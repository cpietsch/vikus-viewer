// christopher pietsch
// cpietsch@gmail.com
// 2015-2018

function Canvas() {
  var margin = {
    top: 20,
    right: 50,
    bottom: 50,
    left: 50,
  };

  var minHeight = 400;
  var width = window.innerWidth - margin.left - margin.right;
  var widthOuter = window.innerWidth;
  var height = window.innerHeight < minHeight ? minHeight : window.innerHeight;

  var scale;
  var scale1 = 1;
  var scale2 = 1;
  var scale3 = 1;
  var allData = [];

  var translate = [0, 0];
  var scale = 1;
  var timeDomain = [];
  var loadImagesCue = [];

  var x = d3.scale
    .ordinal()
    .rangeBands([margin.left, width + margin.left], 0.2);

  var Quadtree = d3.geom
    .quadtree()
    .x(function (d) {
      return d.x;
    })
    .y(function (d) {
      return d.y;
    });

  var quadtree;

  var maxZoomLevel = utils.isMobile() ? 5000 : 2500;

  var zoom = d3.behavior
    .zoom()
    .scaleExtent([1, maxZoomLevel])
    .size([width, height])
    .on("zoom", zoomed)
    .on("zoomend", zoomend)
    .on("zoomstart", zoomstart);

  var canvas;
  var config;
  var container;
  var entries;
  var years;
  var data;
  var rangeBand = 0;
  var rangeBandImage = 0;
  var imageSize = 256;
  var imageSize2 = 1024;
  var imageSize3 = 4000;
  var collumns = 4;
  var renderer, stage;

  var svgscale, voronoi;

  var selectedImageDistance = 0;
  var selectedImage = null;

  var drag = false;
  var sleep = false;

  var stagePadding = 40;
  var imgPadding;

  var bottomPadding = 70;
  var extent = [0, 0];
  var bottomZooming = false;

  var touchstart = 0;
  var vizContainer;
  var spriteClick = false;

  var state = {
    lastZoomed: 0,
    zoomingToImage: false,
    mode: "time",
    init: false,
  };

  var zoomedToImage = false;
  var zoomedToImageScale = 117;
  var zoomBarrier = 2;

  var startTranslate = [0, 0];
  var startScale = 0;
  var cursorCutoff = 1;
  var zooming = false;
  var detailContainer = d3.select(".sidebar");
  var timelineData;
  var stage, stage1, stage2, stage3, stage4, stage5;
  var timelineHover = false;
  var tsneIndex = {};
  var tsneScale = {}

  function canvas() { }

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

  canvas.resize = function () {
    if (!state.init) return;
    width = window.innerWidth - margin.left - margin.right;
    height = window.innerHeight < minHeight ? minHeight : window.innerHeight;
    widthOuter = window.innerWidth;
    renderer.resize(width + margin.left + margin.right, height);
    canvas.makeScales();
    canvas.project();
  };

  canvas.makeScales = function () {
    x.rangeBands([margin.left, width + margin.left], 0.2);

    rangeBand = x.rangeBand();
    rangeBandImage = x.rangeBand() / collumns;

    imgPadding = rangeBand / collumns / 2;

    scale1 = imageSize / (x.rangeBand() / collumns);
    scale2 = imageSize2 / (x.rangeBand() / collumns);
    scale3 = imageSize3 / (x.rangeBand() / collumns);

    stage3.scale.x = 1 / scale1;
    stage3.scale.y = 1 / scale1;
    stage3.y = height;

    stage4.scale.x = 1 / scale2;
    stage4.scale.y = 1 / scale2;
    stage4.y = height;

    stage5.scale.x = 1 / scale3;
    stage5.scale.y = 1 / scale3;
    stage5.y = height;

    timeline.rescale(scale1);

    cursorCutoff = (1 / scale1) * imageSize * 0.48;
    zoomedToImageScale =
      (0.8 / (x.rangeBand() / collumns / width)) *
      (state.mode == "time" ? 1 : 0.5);
    // console.log("zoomedToImageScale", zoomedToImageScale)
  };

  canvas.init = function (_data, _timeline, _config) {
    data = _data;
    config = _config;

    container = d3.select(".page").append("div").classed("viz", true);
    detailVue._data.structure = config.detail.structure;

    collumns = config.projection.columns;
    imageSize = config.loader.textures.medium.size;
    imageSize2 = config.loader.textures.detail.size;

    if (config.loader.textures.big) {
      imageSize3 = config.loader.textures.big.size;
    }

    PIXI.settings.SCALE_MODE = 1;
    PIXI.settings.SPRITE_MAX_TEXTURES = Math.min(
      PIXI.settings.SPRITE_MAX_TEXTURES,
      16
    );

    var renderOptions = {
      resolution: 1,
      antialiasing: false,
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

    _timeline.forEach(function (d) {
      d.type = "timeline";
    });

    var canvasDomain = d3
      .nest()
      .key(function (d) {
        return d.year;
      })
      .entries(_data.concat(_timeline))
      .sort(function (a, b) {
        return a.key - b.key;
      })
      .map(function (d) {
        return d.key;
      });

    timeDomain = canvasDomain.map(function (d) {
      return {
        key: d,
        values: _timeline.filter(function (e) {
          return d == e.year;
        }),
      };
    });

    timeline.init(timeDomain);
    x.domain(canvasDomain);
    //canvas.makeScales();

    // add preview pics
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

    vizContainer = d3
      .select(".viz")
      .call(zoom)
      .on("mousemove", mousemove)
      .on("dblclick.zoom", null)
      .on("touchstart", function (d) {
        mousemove(d);
        touchstart = new Date() * 1;
      })
      .on("touchend", function (d) {
        var touchtime = new Date() * 1 - touchstart;
        if (touchtime > 250) return;
        if (selectedImageDistance > 15) return;
        if (selectedImage && !selectedImage.id) return;
        if (selectedImage && !selectedImage.active) return;
        if (drag) return;

        zoomToImage(selectedImage, 1400 / Math.sqrt(Math.sqrt(scale)));
      })
      .on("click", function () {
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
        // console.log(selectedImage)

        if (Math.abs(zoomedToImageScale - scale) < 0.1) {
          canvas.resetZoom();
        } else {
          zoomToImage(selectedImage, 1400 / Math.sqrt(Math.sqrt(scale)));
        }
      });

    //canvas.makeScales();
    //canvas.project();
    animate();

    // selectedImage = data.find(d => d.id == 88413)
    // showDetail(selectedImage)
    state.init = true;
  };

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
    // console.log(cursorCutoff, scale, scale1, selectedImageDistance)

    // if (best.p && selectedImageDistance > 7) {
    //   //selectedImage = null;
    //   //zoom.center(null);
    //   container.style("cursor", "default");
    // } else {
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
    // }
  }

  function stackLayout(data, invert) {
    var years = d3
      .nest()
      .key(function (d) {
        return d.year;
      })
      .entries(data);

    years.forEach(function (year) {
      var startX = x(year.key);
      var total = year.values.length;
      year.values.sort(function (a, b) {
        return b.keywords.length - a.keywords.length;
      });

      year.values.forEach(function (d, i) {
        var row = Math.floor(i / collumns) + 2;
        d.ii = i;

        d.x = startX + (i % collumns) * (rangeBand / collumns);
        d.y = (invert ? 1 : -1) * (row * (rangeBand / collumns));

        d.x1 = d.x * scale1 + imageSize / 2;
        d.y1 = d.y * scale1 + imageSize / 2;

        if (d.sprite.position.x == 0) {
          d.sprite.position.x = d.x1;
          d.sprite.position.y = d.y1;
        }

        if (d.sprite2) {
          d.sprite2.position.x = d.x * scale2 + imageSize2 / 2;
          d.sprite2.position.y = d.y * scale2 + imageSize2 / 2;
        }

        d.order = (invert ? 1 : 1) * (total - i);
      });
    });
  }

  canvas.distance = function (a, b) {
    return Math.sqrt(
      (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])
    );
  };

  function toScreenPoint(p) {
    var p2 = [0, 0];

    p2[0] = p[0] / scale - translate[0] / scale;
    p2[1] = p[1] / scale - height - translate[1] / scale;

    return p2;
  }

  var speed = 0.02;

  function imageAnimation() {
    var sleep = true;

    data.forEach(function (d, i) {
      var diff;
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
        //else d.sprite2.visible = d.visible;
      }
    });
    return sleep;
  }

  canvas.wakeup = function () {
    sleep = false;
  };

  canvas.setMode = function (mode) {
    state.mode = mode;
    timeline.setDisabled(mode != "time");
    canvas.makeScales();
    canvas.project();
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

  function zoomToImage(d, duration) {
    state.zoomingToImage = true;
    zoom.center(null);
    loadMiddleImage(d);
    d3.select(".tagcloud").classed("hide", true);
    /*
    var padding = (state.mode == "time" ? 0.1 : 0.8) * rangeBandImage;
    var sidbar = width / 8;
    var scale =
      (0.8 / (rangeBandImage / width)) * (state.mode == "time" ? 1 : 0.4);
    console.log(d, padding);
    //* (state.mode == "time" ? 1 : 0.5)
    var translateNow = [
      -scale * (d.x - padding),
      -margin.bottom - scale * (height + d.y - padding),
    ];
    */

    var padding = rangeBandImage / 2;
    var scale = 1 / (rangeBandImage / (width*0.8));
    var translateNow = [
      -scale * (d.x - padding) - (width*0.8) / 2 + margin.left,
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
        loadBigImage(d, "click");
        state.zoomingToImage = false;
      });
  }

  function showDetail(d) {
    // console.log("show detail", d)

    detailContainer.select(".outer").node().scrollTop = 0;

    detailContainer.classed("hide", false).classed("sneak", utils.isMobile());

    // needs to be done better
    var detailData = {};
    for (field in selectedImage) {
      if (field[0] === "_") detailData[field] = selectedImage[field];
    }
    detailData["_id"] = selectedImage.id;
    detailData["_keywords"] = selectedImage.keywords;
    detailData["_year"] = selectedImage.year;
    detailData["_imagenum"] = selectedImage.imagenum || 1;
    detailVue._data.item = detailData;
    detailVue._data.id = d.id;
    detailVue._data.page = d.page;
  }

  canvas.changePage = function (id, page) {
    console.log("changePage", id, page, selectedImage);
    selectedImage.page = page;
    detailVue._data.page = page;
    clearBigImages();
    loadBigImage(selectedImage);
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

  function zoomed() {
    translate = d3.event.translate;
    scale = d3.event.scale;
    if (!startTranslate) startTranslate = translate;
    drag = startTranslate && translate !== startTranslate;
    // check borders
    var x1 = (-1 * translate[0]) / scale;
    var x2 = x1 + widthOuter / scale;

    if (d3.event.sourceEvent != null) {
      if (x1 < 0) {
        translate[0] = 0;
      } else if (x2 > widthOuter) {
        translate[0] = (widthOuter * scale - widthOuter) * -1;
      }

      zoom.translate([translate[0], translate[1]]);

      x1 = (-1 * translate[0]) / scale;
      x2 = x1 + width / scale;
    }

    if (
      zoomedToImageScale != 0 &&
      scale > zoomedToImageScale * 0.9 &&
      !zoomedToImage &&
      selectedImage &&
      selectedImage.type == "image"
    ) {
      zoomedToImage = true;
      zoom.center(null);
      zoomedToImageScale = scale;
      hideTheRest(selectedImage);
      showDetail(selectedImage);
    }

    if (zoomedToImage && zoomedToImageScale * 0.8 > scale) {
      // console.log("clear")
      zoomedToImage = false;
      state.lastZoomed = 0;
      showAllImages();
      clearBigImages();
      detailContainer.classed("hide", true);
    }

    timeline.update(x1, x2, scale, translate, scale1);

    // toggle zoom overlays
    if (scale > zoomBarrier) {
      d3.select(".tagcloud").classed("hide", true);
      d3.select(".searchbar").classed("hide", true);
      d3.select(".infobar").classed("sneak", true);
    } else {
      d3.select(".tagcloud").classed("hide", false);
      d3.select(".searchbar").classed("hide", false);
    }

    stage2.scale.x = d3.event.scale;
    stage2.scale.y = d3.event.scale;
    stage2.x = d3.event.translate[0];
    stage2.y = d3.event.translate[1];

    sleep = false;
  }

  function zoomstart(d) {
    zooming = true;
    startTranslate = false;
    drag = false;
    startScale = scale;
  }

  function zoomend(d) {
    drag = startTranslate && translate !== startTranslate;
    zooming = false;
    filterVisible();

    if (
      zoomedToImage &&
      selectedImage &&
      !selectedImage.big &&
      state.lastZoomed != selectedImage.id &&
      !state.zoomingToImage
    ) {
      loadBigImage(selectedImage, "zoom");
    }
  }

  canvas.highlight = function () {
    data.forEach(function (d, i) {
      d.alpha = d.highlight ? 1 : 0.2;
    });
    canvas.wakeup();
  };

  // canvas.project = function () {
  //     sleep = false
  //     canvas.split();
  //     canvas.resetZoom();
  // }

  canvas.project = function () {
    sleep = false;
    var scaleFactor = state.mode == "time" ? 0.9 : tsneScale[state.mode] || 0.5;
    data.forEach(function (d) {
      d.scaleFactor = scaleFactor;
      d.sprite.scale.x = d.scaleFactor;
      d.sprite.scale.y = d.scaleFactor;
      if (d.sprite2) {
        d.sprite2.scale.x = d.scaleFactor;
        d.sprite2.scale.y = d.scaleFactor;
      }
    });

    if (state.mode == "time") {
      canvas.split();
      cursorCutoff = (1 / scale1) * imageSize * 0.48;
    } else {
      canvas.projectTSNE();
      cursorCutoff = (1 / scale1) * imageSize * 1;
    }

    canvas.resetZoom();

    zoomedToImageScale =
      (0.8 / (x.rangeBand() / collumns / width)) *
      (state.mode == "time" ? 1 : 0.5);
  };

  canvas.projectTSNE = function () {
    var marginBottom = -height / 2.5;

    var inactive = data.filter(function (d) {
      return !d.active;
    });
    var inactiveSize = inactive.length;

    var active = data.filter(function (d) {
      return d.active;
    });

    var dimension = Math.min(width, height) * 0.8;

    inactive.forEach(function (d, i) {
      var r = dimension / 1.9 + Math.random() * 40;
      var a = -Math.PI / 2 + (i / inactiveSize) * 2 * Math.PI;

      d.x = r * Math.cos(a) + width / 2 + margin.left;
      d.y = r * Math.sin(a) + marginBottom;
    });

    active.forEach(function (d) {
      var factor = height / 2;
      var tsneEntry = tsneIndex[state.mode][d.id];
      if (tsneEntry) {
        d.x =
          tsneEntry[0] * dimension + width / 2 - dimension / 2 + margin.left;
        d.y = tsneEntry[1] * dimension - dimension / 2 + marginBottom;
      } else {
        // console.log("not found", d)
        d.alpha = 0;
      }
      // var tsneEntry = tsne.find(function (t) {
      //     return t.id == d.id
      // })
    });

    data.forEach(function (d) {
      d.x1 = d.x * scale1 + imageSize / 2;
      d.y1 = d.y * scale1 + imageSize / 2;

      if (d.sprite.position.x == 0) {
        d.sprite.position.x = d.x1;
        d.sprite.position.y = d.y1;
      }

      if (d.sprite2) {
        d.sprite2.position.x = d.x * scale2 + imageSize2 / 2;
        d.sprite2.position.y = d.y * scale2 + imageSize2 / 2;
      }
    });

    quadtree = Quadtree(data);
    //chart.resetZoom();
  };

  canvas.resetZoom = function () {
    var duration = 1400;

    extent = d3.extent(data, function (d) {
      return d.y;
    });

    var y = -extent[1] - bottomPadding;
    y = extent[1] / -3 - bottomPadding;
    // this needs a major cleanup
    y = Math.max(y, -bottomPadding);

    vizContainer
      .call(zoom.translate(translate).event)
      .transition()
      .duration(duration)
      .call(zoom.translate([0, y]).scale(1).event);
  };

  canvas.split = function () {
    var active = data.filter(function (d) {
      return d.active;
    });
    stackLayout(active, false);
    var inactive = data.filter(function (d) {
      return !d.active;
    });
    stackLayout(inactive, true);
    quadtree = Quadtree(data);
  };

  function filterVisible() {
    var zoomScale = scale;
    if (zoomedToImage) return;

    data.forEach(function (d, i) {
      var p = d.sprite.position;
      var x = p.x / scale1 + translate[0] / zoomScale;
      var y = p.y / scale1 + translate[1] / zoomScale;
      var padding = 5;

      if (
        x > -padding &&
        x < width / zoomScale + padding &&
        y + height < height / zoomScale + padding &&
        y > height * -1 - padding
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
    if (d.loaded) {
      d.alpha2 = 1;
      return;
    }
    var url = "";
    if (config.loader.textures.detail.csv) {
      url = d[config.loader.textures.detail.csv];
    } else {
      url = config.loader.textures.detail.url + d.id + ".jpg";
    }

    var texture = new PIXI.Texture.from(url);
    var sprite = new PIXI.Sprite(texture);

    var update = function () {
      sleep = false;
    };

    sprite.on("added", update);
    texture.once("update", update);

    sprite.scale.x = d.scaleFactor;
    sprite.scale.y = d.scaleFactor;

    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.position.x = d.x * scale2 + imageSize2 / 2;
    sprite.position.y = d.y * scale2 + imageSize2 / 2;
    sprite._data = d;
    stage4.addChild(sprite);
    d.sprite2 = sprite;
    d.alpha2 = d.highlight;
    d.loaded = true;
    sleep = false;
  }

  function loadBigImage(d) {
    if (!config.loader.textures.big) {
      loadMiddleImage(d);
      return;
    }

    state.lastZoomed = d.id;
    var page = d.page ? "_" + d.page : "";
    var url = "";
    if (config.loader.textures.big.csv) {
      url = d[config.loader.textures.big.csv];
    } else {
      url = config.loader.textures.big.url + d.id + page + ".jpg";
    }

    var texture = new PIXI.Texture.from(url);
    var sprite = new PIXI.Sprite(texture);
    var res = config.loader.textures.big.size;

    var updateSize = function (t) {
      var size = Math.max(texture.width, texture.height);
      sprite.scale.x = sprite.scale.y = (imageSize3 / size) * d.scaleFactor;
      sleep = false;
      if (t.valid) {
        d.alpha = 0;
        d.alpha2 = 0;
      }
    };

    sprite.on("added", updateSize);
    texture.once("update", updateSize);

    if (d.imagenum) {
      sprite.on("mousemove", function (s) {
        var pos = s.data.getLocalPosition(s.currentTarget);
        s.currentTarget.cursor = pos.x > 0 ? "e-resize" : "w-resize";
      });
      sprite.on("click", function (s) {
        if (drag) return;

        s.stopPropagation();
        spriteClick = true;
        var pos = s.data.getLocalPosition(s.currentTarget);
        var dir = pos.x > 0 ? 1 : -1;
        var page = d.page + dir;
        var nextPage = page;
        if (page > d.imagenum - 1) nextPage = 0;
        if (page < 0) nextPage = d.imagenum - 1;

        canvas.changePage(d.id, nextPage);
      });
      sprite.interactive = true;
    }

    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.position.x = d.x * scale3 + imageSize3 / 2;
    sprite.position.y = d.y * scale3 + imageSize3 / 2;
    sprite._data = d;
    d.big = true;
    stage5.addChild(sprite);
    sleep = false;
  }

  function clearBigImages() {
    while (stage5.children[0]) {
      stage5.children[0]._data.big = false;
      stage5.removeChild(stage5.children[0]);
      sleep = false;
    }
  }

  function loadImages() {
    if (zooming) return;
    if (zoomedToImage) return;

    if (loadImagesCue.length) {
      var d = loadImagesCue.pop();
      if (!d.loaded) {
        loadMiddleImage(d);
      }
    }
  }

  function nearest(x, y, best, node) {
    // mike bostock https://bl.ocks.org/mbostock/4343214
    var x1 = node.x1,
      y1 = node.y1,
      x2 = node.x2,
      y2 = node.y2;
    node.visited = true;
    //console.log(node, x , x1 , best.d);
    //return;
    // exclude node if point is farther away than best distance in either axis
    if (
      x < x1 - best.d ||
      x > x2 + best.d ||
      y < y1 - best.d ||
      y > y2 + best.d
    ) {
      return best;
    }
    // test point if there is one, potentially updating best
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
    // check if kid is on the right or left, and top or bottom
    // and then recurse on most likely kids first, so we quickly find a
    // nearby point and then exclude many larger rectangles later
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
