import CanvasBase from './CanvasBase';
import CanvasZoom from './CanvasZoom';
import CanvasLayout from './CanvasLayout';
import CanvasImage from './CanvasImage';

function Canvas() {
  var canvasBase = new CanvasBase();
  var canvasZoom = new CanvasZoom();
  var canvasLayout = new CanvasLayout();
  var canvasImage = new CanvasImage();

  var margin = canvasBase.margin;
  var width = canvasBase.width;
  var height = canvasBase.height;
  var scale = canvasBase.scale;
  var translate = canvasBase.translate;
  var data = canvasBase.data;

  var zoom = canvasZoom.zoom;
  var maxZoomLevel = canvasZoom.maxZoomLevel;
  var zoomBarrier = canvasZoom.zoomBarrier;

  var columns = canvasLayout.columns;
  var rangeBand = canvasLayout.rangeBand;
  var rangeBandImage = canvasLayout.rangeBandImage;

  var imageSize = canvasImage.imageSize;
  var imageSize2 = canvasImage.imageSize2;
  var imageSize3 = canvasImage.imageSize3;

  var hashDelay = 800;
  var minHeight = 400;
  var widthOuter = window.innerWidth;
  var allData = [];
  var timeDomain = [];
  var canvasDomain = [];
  var loadImagesCue = [];
  var resolution = 1;
  var x = d3.scale.ordinal().rangeBands([margin.left, width + margin.left], 0.2);
  var yscale = d3.scale.linear();
  var Quadtree = d3.geom.quadtree().x(function (d) { return d.x; }).y(function (d) { return d.y; });
  var quadtree;
  var canvas;
  var config;
  var container;
  var entries;
  var years;
  var rangeBand = 0;
  var rangeBandImage = 0;
  var renderer, stage;
  var svgscale, voronoi;
  var selectedImageDistance = 0;
  var selectedImage = null;
  var drag = false;
  var sleep = false;
  var stagePadding = 40;
  var imgPadding;
  var bottomPadding = 40;
  var extent = [0, 0];
  var bottomZooming = false;
  var touchstart = 0;
  var vizContainer;
  var spriteClick = false;
  var state = {
    lastZoomed: 0,
    zoomingToImage: false,
    init: false,
    mode: "time",
  };
  var zoomedToImage = false;
  var zoomedToImageScale = 117;
  var startTranslate = [0, 0];
  var startScale = 0;
  var cursorCutoff = 1;
  var zooming = false;
  var detailContainer = d3.select(".sidebar");
  var timelineData;
  var stage, stage1, stage2, stage3, stage4, stage5;
  var timelineHover = false;
  var tsneIndex = {};
  var tsneScale = {};

  function canvas() { }

  canvas.margin = margin;

  canvas.getView = function () {
    return canvasBase.getView();
  };

  canvas.setView = function (ids, duration) {
    return canvasBase.setView(ids, duration);
  };

  canvas.rangeBand = function () {
    return rangeBand;
  };
  canvas.width = function () {
    return width;
  };
  canvas.height = function () {
    return height;
  };
  canvas.rangeBandImage = function () {
    return rangeBandImage;
  };
  canvas.zoom = zoom;
  canvas.selectedImage = function () {
    return selectedImage;
  };
  canvas.x = x;
  canvas.y = yscale;

  canvas.resize = function () {
    return canvasBase.resize();
  };

  canvas.makeScales = function () {
    return canvasBase.makeScales();
  };

  canvas.initGroupLayout = function () {
    return canvasLayout.initGroupLayout();
  };

  canvas.init = function (_data, _timeline, _config) {
    data = _data;
    config = _config;
    timelineData = _timeline;

    container = d3.select(".page").append("div").classed("viz", true);
    detailVue._data.structure = config.detail.structure;

    columns = config.projection.columns;
    imageSize = config.loader.textures.medium.size;
    imageSize2 = config.loader.textures.detail.size;

    if (config.loader.textures.big) {
      imageSize3 = config.loader.textures.big.size;
    }

    var renderOptions = {
      resolution: resolution,
      antialiasing: true,
      width: width + margin.left + margin.right,
      height: height,
    };
    renderer = new PIXI.Renderer(renderOptions);
    renderer.backgroundColor = parseInt(
      config.style.canvasBackground.substring(1),
      16
    );
    window.renderer = renderer;

    var renderElem = d3.select(container.node().appendChild(renderer.view));

    stage = new PIXI.Container();
    stage2 = new PIXI.Container();
    stage3 = new PIXI.Container();
    stage4 = new PIXI.Container();
    stage5 = new PIXI.Container();

    stage.addChild(stage2);
    stage2.addChild(stage3);
    stage2.addChild(stage4);
    stage2.addChild(stage5);

    canvas.initGroupLayout();

    data.forEach(function (d, i) {
      var sprite = new PIXI.Sprite(PIXI.Texture.WHITE);

      sprite.anchor.x = 0.5;
      sprite.anchor.y = 0.5;

      sprite.scale.x = d.scaleFactor;
      sprite.scale.y = d.scaleFactor;

      sprite._data = d;
      d.sprite = sprite;

      stage3.addChild(sprite);
    });

    var lastClick = 0;

    vizContainer = d3
      .select(".viz")
      .call(zoom)
      .on("mousemove", mousemove)
      .on("dblclick.zoom", null)
      .on("dblclick", null)
      .on("touchstart", function (d) {
        mousemove(d);
        touchstart = new Date() * 1;
      })
      .on("click", function () {
        if (d3.event.shiftKey) {
          console.log("shift click", selectedImage);
          canvas.addBorderToImage(selectedImage);
          return;
        }

        var clicktime = new Date() * 1 - lastClick;
        if (clicktime < 250) return;
        lastClick = new Date() * 1;

        console.log("click");
        if (spriteClick) {
          spriteClick = false;
          return;
        }

        if (selectedImage && !selectedImage.id) return;
        if (drag) return;
        if (selectedImageDistance > cursorCutoff) return;
        if (selectedImage && !selectedImage.active) return;
        if (timelineHover) return;
        userInteraction = true;

        if (Math.abs(zoomedToImageScale - scale) < 0.1) {
          canvas.resetZoom();
        } else {
          zoomToImage(selectedImage, 1400 / Math.sqrt(Math.sqrt(scale)));
        }
      });

    vizContainer.on("contextmenu", function () {
      d3.event.preventDefault();
    });

    animate();
    state.init = true;
  };

  var imageBorders = {};

  canvas.updateBorderPositions = function () {
    var graphics = d3.values(imageBorders);
    if (graphics.length == 0) return;
    graphics.forEach(function (graphic) {
      var d = graphic.source;
      graphic.position.x = d.sprite.position.x - d.sprite.width / 2;
      graphic.position.y = d.sprite.position.y - d.sprite.height / 2;
    });
  };

  canvas.removeBorder = function (id) {
    if (imageBorders.hasOwnProperty(id)) {
      stage3.removeChild(imageBorders[id]);
      delete imageBorders[id];
      sleep = false;
    }
  };

  canvas.removeAllBorders = function () {
    d3.values(imageBorders).forEach(function (d) {
      stage3.removeChild(d);
    });
    imageBorders = {};
    sleep = false;
  };

  canvas.addBorder = function (d) {
    sleep = false;
    var sprite = d.sprite;
    var graphics = new PIXI.Graphics();
    var borderColorHash = config.style?.borderColor || "#ff0000";
    var borderColor = parseInt(borderColorHash.substring(1), 16);
    graphics.lineStyle(5, borderColor, 1);
    graphics.drawRect(
      0, 0,
      sprite.width,
      sprite.height
    );
    graphics.position.x = sprite.position.x - sprite.width / 2;
    graphics.position.y = sprite.position.y - sprite.height / 2;
    graphics.source = d;
    stage3.addChild(graphics);
    imageBorders[d.id] = graphics;
    console.log("added border", graphics);
  };

  canvas.addBorderToImage = function (d) {
    sleep = false;
    if (imageBorders.hasOwnProperty(d.id)) {
      stage3.removeChild(imageBorders[d.id]);
      delete imageBorders[d.id];
      updateHashBorders();
      return;
    }
    canvas.addBorder(d);
    updateHashBorders();
  };

  function updateHashBorders() {
    if (!d3.event) return;
    var borders = Object.keys(imageBorders);
    utils.updateHash("borders", borders);
  }

  canvas.addTsneData = function (name, d, scale) {
    tsneIndex[name] = {};
    tsneScale[name] = scale;
    var clean = d.map(function (d) {
      return {
        id: d.id,
        x: parseFloat(d.x),
        y: parseFloat(d.y),
      };
    });
    var xExtent = d3.extent(clean, function (d) {
      return d.x;
    });
    var yExtent = d3.extent(clean, function (d) {
      return d.y;
    });

    var x = d3.scale.linear().range([0, 1]).domain(xExtent);
    var y = d3.scale.linear().range([0, 1]).domain(yExtent);

    d.forEach(function (d) {
      tsneIndex[name][d.id] = [x(d.x), y(d.y)];
    });
  };

  function mousemove(d) {
    if (timelineHover) return;

    var mouse = d3.mouse(vizContainer.node());
    var p = toScreenPoint(mouse);

    var distance = 200;

    var best = nearest(
      p[0] - imgPadding,
      p[1] - imgPadding,
      {
        d: distance,
        p: null,
      },
      quadtree
    );

    selectedImageDistance = best && best.d || 1000;

    if (best && best.p && !zoomedToImage) {
      var d = best.p;
      var center = [
        (d.x + imgPadding) * scale + translate[0],
        (height + d.y + imgPadding) * scale + translate[1],
      ];
      zoom.center(center);
      selectedImage = d;
    }

    container.style("cursor", function () {
      return selectedImageDistance < cursorCutoff && selectedImage.active
        ? "pointer"
        : "default";
    });
  }

  function stackLayout(data, invert) {
    return canvasLayout.stackLayout(data, invert);
  }

  function stackYLayout(data, invert) {
    return canvasLayout.stackYLayout(data, invert);
  }

  canvas.distance = function (a, b) {
    return Math.sqrt(
      (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])
    );
  };

  var speed = 0.03;

  function imageAnimation() {
    var sleep = true;
    var diff, d;

    for (var i = 0; i < data.length; i++) {
      d = data[i];
      diff = d.x1 - d.sprite.position.x;
      if (Math.abs(diff) > 0.1) {
        d.sprite.position.x += diff * speed;
        sleep = false;
      }

      diff = d.y1 - d.sprite.position.y;
      if (Math.abs(diff) > 0.1) {
        d.sprite.position.y += diff * speed;
        sleep = false;
      }

      diff = d.alpha - d.sprite.alpha;
      if (Math.abs(diff) > 0.01) {
        d.sprite.alpha += diff * 0.2;
        sleep = false;
      }

      d.sprite.visible = d.sprite.alpha > 0.1;

      if (d.sprite2) {
        diff = d.alpha2 - d.sprite2.alpha;
        if (Math.abs(diff) > 0.01) {
          d.sprite2.alpha += diff * 0.2;
          sleep = false;
        }

        d.sprite2.visible = d.sprite2.alpha > 0.1;
      }
    };
    canvas.updateBorderPositions();
    return sleep;
  }

  canvas.wakeup = function () {
    sleep = false;
  };

  canvas.setMode = function (layout) {
    state.mode = layout;

    if (layout.type == "group") {
      canvas.initGroupLayout();
      if (layout.columns) {
        columns = layout.columns;
      } else {
        columns = config.projection.columns;
      }
    }

    timeline.setDisabled(layout.type != "group" && !layout.timeline);
    canvas.makeScales();
    canvas.project();
    canvas.resetZoom();
  };

  canvas.getMode = function () {
    return state.mode;
  };

  function animate(time) {
    requestAnimationFrame(animate);
    loadImages();
    if (sleep) return;
    sleep = imageAnimation();
    renderer.render(stage);
  }

  function zoomToYear(d) {
    var xYear = x(d.year);
    var scale = 1 / ((rangeBand * 4) / width);
    var padding = rangeBand * 1.5;
    var translateNow = [-scale * (xYear - padding), -scale * (height + d.y)];

    vizContainer
      .call(zoom.translate(translate).event)
      .transition()
      .duration(2000)
      .call(zoom.scale(scale).translate(translateNow).event);
  }

  window.zoomToYear = zoomToYear;

  function zoomToImage(d, duration) {
    state.zoomingToImage = true;
    vizContainer.style("pointer-events", "none");
    zoom.center(null);
    canvasImage.loadMiddleImage(d);
    d3.select(".tagcloud").classed("hide", true);

    var padding = rangeBandImage / 2;
    var max = Math.max(width, height);
    var scale = 1 / (rangeBandImage / (max * 0.6));
    var translateNow = [
      -scale * (d.x - padding) - (max * 0.3) / 2 + margin.left,
      -scale * (height + d.y + padding) - margin.top + height / 2,
    ];

    zoomedToImageScale = scale;

    setTimeout(function () {
      hideTheRest(d);
    }, duration / 2);

    vizContainer
      .call(zoom.translate(translate).event)
      .transition()
      .duration(duration)
      .call(zoom.scale(scale).translate(translateNow).event)
      .each("end", function () {
        zoomedToImage = true;
        selectedImage = d;
        hideTheRest(d);
        showDetail(d);
        canvasImage.loadBigImage(d, "click");
        state.zoomingToImage = false;
        console.log("zoomedToImage", zoomedToImage);
        vizContainer.style("pointer-events", "auto");
        utils.updateHash("ids", d.id, ["translate", "scale"]);
      });
  }
  canvas.zoomToImage = zoomToImage;

  function showDetail(d) {
    detailContainer.select(".outer").node().scrollTop = 0;

    detailContainer.classed("hide", false).classed("sneak", utils.isMobile() || isInIframe);

    var detailData = {};

    config.detail.structure.forEach(function (field) {
      var val = selectedImage[field.source];
      if (val && val !== "") detailData[field.source] = val;
      else detailData[field.source] = "";
      if (field.fields && field.fields.length) {
        field.fields.forEach(function (subfield) {
          var val = selectedImage[subfield];
          if (val && val !== "") detailData[subfield] = val;
        })
      }
    })

    detailData["_id"] = selectedImage.id;
    detailData["_keywords"] = selectedImage.keywords || "None";
    detailData["_year"] = selectedImage.year;
    detailData["_imagenum"] = selectedImage.imagenum || 1;
    detailVue.id = d.id;
    detailVue.page = d.page;
    detailVue.item = detailData;
  }

  canvas.showDetail = showDetail;

  canvas.changePage = function (id, page) {
    console.log("changePage", id, page, selectedImage);
    selectedImage.page = page;
    detailVue._data.page = page;
    canvasImage.clearBigImages();
    canvasImage.loadBigImage(selectedImage);
  };

  function hideTheRest(d) {
    data.forEach(function (d2) {
      if (d2.id !== d.id) {
        d2.alpha = 0;
        d2.alpha2 = 0;
      }
    });
  }

  function showAllImages() {
    data.forEach(function (d) {
      d.alpha = d.active ? 1 : 0.2;
      d.alpha2 = d.visible ? 1 : 0;
    });
  }

  var zoomBarrierState = false;
  var lastSourceEvent = null;
  var isInIframe = window.self !== window.top;

  function zoomed() {
    return canvasZoom.zoomed();
  }

  function zoomstart(d) {
    return canvasZoom.zoomstart(d);
  }

  function createRect(x, y, width, height, color, alpha, targetStage) {
    var graphics = new PIXI.Graphics();
    graphics.beginFill(color || 0xFFFFFF, alpha || 1);
    graphics.drawRect(x, y, width, height);
    graphics.endFill();
    (targetStage || stage2).addChild(graphics);
    sleep = false;
    return graphics;
  }

  function toScreenPoint(p) {
    var p2 = [0, 0]

    p2[0] = p[0] / scale - translate[0] / scale
    p2[1] = p[1] / scale - height - translate[1] / scale

    return p2
  }

  var debounceHash = null;
  var debounceHashTime = 400;
  var userInteraction = false;

  function zoomend() {
    return canvasZoom.zoomend();
  }

  canvas.onhashchange = function () {
    var hash = window.location.hash.slice(1);
    console.log("hashchange", hash)

    var params = new URLSearchParams(hash);

    if (params.has("ids") && !userInteraction) {
      var ids = params.get("ids").split(",")
      console.log("set setView", ids)
      if (
        params.has("mode") && params.get("mode") !== state.mode.title ||
        params.has("filter") && params.get("filter") !== tags.getFilterWords().join(",")
      ) {
        setTimeout(function () {
          canvas.setView(ids)
        }, hashDelay)
      } else {
        canvas.setView(ids)
      }
    }

    if (hash === "") {
      console.log("reset")
      canvas.resetZoom(function () {
        tags.reset();
        utils.setMode()
        search.reset();
      })
      return
    }

    if (params.has("filter")) {
      var filter = params.get("filter").split(",")
      tags.setFilterWords(filter)
    } else {
      tags.setFilterWords([])
    }

    if (params.has("mode")) {
      utils.setMode(params.get("mode"))
    } else {
      utils.setMode()
    }

    if (params.has("borders")) {
      setTimeout(function () {
        var borderIds = params.get("borders").split(",")
        console.log("borders", borderIds)
        var enter = borderIds.filter(function (d) { return !imageBorders.hasOwnProperty(d) })
        var exit = Object.keys(imageBorders).filter(function (d) { return !borderIds.includes(d) })

        enter.forEach(function (id) {
          var d = data.find(function (d) { return d.id == id })
          canvas.addBorderToImage(d)
        })

        exit.forEach(function (id) {
          canvas.removeBorder(id)
        })
      }, params.has("filter") || params.has("mode") ? 2000 : 0)
    } else {
      canvas.removeAllBorders()
    }

    userInteraction = false;
  }

  canvas.highlight = function () {
    data.forEach(function (d, i) {
      d.alpha = d.highlight ? 1 : 0.2;
    });
    canvas.wakeup();
  };

  canvas.project = function () {
    ping();
    sleep = false;
    var scaleFactor = state.mode.type == "group" ? 0.9 : tsneScale[state.mode.title] || 0.5;
    data.forEach(function (d) {
      d.scaleFactor = scaleFactor;
      d.sprite.scale.x = d.scaleFactor;
      d.sprite.scale.y = d.scaleFactor;
      if (d.sprite2) {
        d.sprite2.scale.x = d.scaleFactor;
        d.sprite2.scale.y = d.scaleFactor;
      }
    });

    if (state.mode.type === "group") {
      canvas.split();
      cursorCutoff = (1 / scale1) * imageSize * 1;
    } else {
      canvas.projectTSNE();
      cursorCutoff = (1 / scale1) * imageSize * 1;
    }

    zoomedToImageScale =
      (0.8 / (x.rangeBand() / columns / width)) *
      (state.mode.type === "group" ? 1 : 0.5);
  };

  canvas.projectTSNE = function () {
    return canvasLayout.projectTSNE();
  };

  canvas.resetZoom = function (callback) {
    var duration = scale > 1 ? 1000 : 0;

    extent = d3.extent(data, function (d) {
      return d.y;
    });

    var y = -bottomPadding;

    vizContainer
      .call(zoom.translate(translate).event)
      .transition()
      .duration(duration)
      .call(zoom.translate([0, y]).scale(1).event)
      .each("end", function () {
        if (callback && scale < zoomBarrier) callback();
      })
  };

  canvas.split = function () {
    var layout = state.mode.y ? stackYLayout : stackLayout;
    var active = data.filter(function (d) {
      return d.active;
    });
    layout(active, false);
    var inactive = data.filter(function (d) {
      return !d.active;
    });
    layout(inactive, true);
    quadtree = Quadtree(data);
  };

  function filterVisible() {
    var zoomScale = scale;
    if (zoomedToImage) return;

    data.forEach(function (d, i) {
      var p = d.sprite.position;

      var x = p.x / scale1 + translate[0] / zoomScale;
      var y = p.y / scale1 + translate[1] / zoomScale;
      var padding = 2;

      if (
        x > -padding
        && x < width / zoomScale + padding
        && y + height < height / zoomScale + padding
        && y > height * -1 - padding
      ) {
        d.visible = true;
      } else {
        d.visible = false;
      }
    });

    var visible = data.filter(function (d) {
      return d.visible;
    });

    if (visible.length < 40) {
      data.forEach(function (d) {
        if (d.visible && d.loaded && d.active) d.alpha2 = 1;
        else if (d.visible && !d.loaded && d.active) loadImagesCue.push(d);
        else d.alpha2 = 0;
      });
    } else {
      data.forEach(function (d) {
        d.alpha2 = 0;
      });
    }
  }

  function loadMiddleImage(d) {
    return canvasImage.loadMiddleImage(d);
  }

  function loadBigImage(d) {
    return canvasImage.loadBigImage(d);
  }

  function clearBigImages() {
    return canvasImage.clearBigImages();
  }

  function loadImages() {
    return;
  }

  function nearest(x, y, best, node) {
    var x1 = node.x1,
      y1 = node.y1,
      x2 = node.x2,
      y2 = node.y2;
    node.visited = true;

    if (
      x < x1 - best.d ||
      x > x2 + best.d ||
      y < y1 - best.d ||
      y > y2 + best.d
    ) {
      return best;
    }

    var p = node.point;
    if (p) {
      p.scanned = true;
      var dx = p.x - x,
        dy = p.y - y,
        d = Math.sqrt(dx * dx + dy * dy);
      if (d < best.d) {
        best.d = d;
        best.p = p;
      }
    }

    var kids = node.nodes;
    var rl = 2 * x > x1 + x2,
      bt = 2 * y > y1 + y2;
    if (kids[bt * 2 + rl]) best = nearest(x, y, best, kids[bt * 2 + rl]);
    if (kids[bt * 2 + (1 - rl)])
      best = nearest(x, y, best, kids[bt * 2 + (1 - rl)]);
    if (kids[(1 - bt) * 2 + rl])
      best = nearest(x, y, best, kids[(1 - bt) * 2 + rl]);
    if (kids[(1 - bt) * 2 + (1 - rl)])
      best = nearest(x, y, best, kids[(1 - bt) * 2 + (1 - rl)]);

    return best;
  }

  return canvas;
}
