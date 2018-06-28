// christopher pietsch
// cpietsch@gmail.com
// 2015-2018


function myListView() {
  var margin = {
      top: 20,
      right: 50,
      bottom: 30,
      left: 50
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

  var x = d3.scale.ordinal()
      .rangeBands([margin.left, width + margin.left], 0.2);

  var Quadtree = d3.geom.quadtree()
      .x(function(d) {
          return d.x;
      })
      .y(function(d) {
          return d.y;
      });

  var quadtree;

  var maxZoomLevel = utils.isMobile() ? 5000 : 2500;

  var zoom = d3.behavior.zoom()
      .scaleExtent([1, maxZoomLevel])
      .size([width,height])
      .on("zoom", zoomed)
      .on("zoomend", zoomend)
      .on("zoomstart", zoomstart);

  // d3.select("body")
  //     .on("keydown", keydown);

  var canvas;
  var container;
  var entries;
  var years;
  var data;
  var rangeBand = 0;
  var rangeBandImage = 0;
  // var imageSize = 50;
  var imageSize = 256;
  var imageSize2 = 1024;
  var imageSize3 = 4000;
  var collumns = 4;
  var renderer, stage, stats;
  
  var svgscale, voronoi;

  var selectedImageDistance = 0;
  var selectedImage = null;

  var drag = false;

  var stagePadding = 40;
  var imgPadding;

  var bottomPadding = 70;
  var extent = [0, 0];
  var bottomZooming = true;

  var touchstart = 0;
  var vizContainer;
  var spriteClick = false

  var state = { 
    lastZoomed:0,
    zoomingToImage: false,
    mode: "time",
    init: false
  };

  var zoomedToImage = false;
  var zoomedToImageScale = 117;
  var zoomBarrier = 2;

  var startTranslate = [0, 0];
  var startScale = 0;
  var zooming = false;


  var detailContainer = d3.select(".sidebar")

  var timelineData;
  var stage, stage1, stage2, stage3, stage4, stage5;

  function chart() {}

  chart.rangeBand = function() { return rangeBand }
  chart.width = function() { return width }
  chart.height = function() { return height }
  chart.rangeBandImage = function() { return rangeBandImage }
  chart.zoom = zoom
  chart.selectedImage = function() { return selectedImage }
  chart.x = x

  chart.resize = function() {
      if(!state.init) return;
      // console.log("resize")
      width = window.innerWidth - margin.left - margin.right;
      height = window.innerHeight < minHeight ? minHeight : window.innerHeight;
      widthOuter = window.innerWidth;

      renderer.resize(width + margin.left + margin.right, height);

      chart.makeScales();
      chart.project();
  }

  chart.makeScales = function() {
      x.rangeBands([margin.left, width + margin.left], 0.2)

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

      timeline.rescale(scale1)

      zoomedToImageScale = 0.8 / (x.rangeBand() / collumns / width)
  }

  chart.init = function(_data,_timeline) {
      data = _data;

      container = d3.select(".page").append("div").classed("viz", true);
      detailVue._data.structure = config.detail.structure


      collumns = config.projection.columns;
      imageSize = config.loader.textures.medium.size;
      imageSize2 = config.loader.textures.detail.size;
      
      if(config.loader.textures.big){
        imageSize3 = config.loader.textures.big.size;
      }
      
      PIXI.settings.SCALE_MODE = 1

      var renderOptions = {
          resolution: 1,
          antialiasing: false
      };
      renderer = new PIXI.WebGLRenderer(width + margin.left + margin.right, height, renderOptions);
      renderer.backgroundColor = parseInt(config.style.canvasBackground.substring(1), 16)
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

      // timeline cleaning
      _timeline.forEach(function(d) {
          d.type = "timeline";
      });

      var chartDomain = d3.nest()
        .key(function(d){ return d.year; })
        .entries(_data.concat(_timeline))
        .sort(function(a, b) { return a.key - b.key; })
        // .sort(function(a, b) { return d3.descending(a.key, b.key) })
        .map(function(d){ return d.key; })

      timeDomain = chartDomain.map(function(d){
        return {
          key: d,
          values: _timeline.filter(function(e){ return d == e.year; })
        }
      })

      timeline.init(timeDomain)
      x.domain(chartDomain);
      chart.makeScales();

      // add preview pics
      data.forEach(function(d, i) {
          var texture = imagesMap.get(d.id);
          var sprite = new PIXI.Sprite(texture);
          
          sprite.anchor.x = 0.5;
          sprite.anchor.y = 0.5;

          sprite.scale.x = d.scaleFactor;
          sprite.scale.y = d.scaleFactor;

          sprite._data = d;
          d.sprite = sprite;

          stage3.addChild(sprite);

      })
      

      vizContainer = d3.select(".viz")
          .call(zoom)
          .on("mousemove", mousemove)
          .on("dblclick.zoom", null)
          .on("touchstart", function(d){
            mousemove(d);
            touchstart = new Date()*1;
          })
          .on("touchend", function(d){
            var touchtime = (new Date()*1) - touchstart;
            if(touchtime > 250) return;
            if(selectedImageDistance > 15) return;
            if (selectedImage && !selectedImage.id) return;
            if (selectedImage && !selectedImage.active) return;
            if(drag) return;

            zoomToImage(selectedImage, 1400 / Math.sqrt(Math.sqrt(scale)))
          })
          .on("click", function() {
               console.log("click");
              if (spriteClick) { spriteClick = false; return; }
              if (selectedImage && !selectedImage.id) return;
              if (drag) return;
              if (selectedImageDistance > 15) return;
              if (selectedImage && !selectedImage.active) return;
              if(timelineHover) return;
              // console.log(selectedImage)
              

              if (Math.abs(zoomedToImageScale - scale) < 0.1) {
                  chart.resetZoom();
              } else {
                zoomToImage(selectedImage, 1400 / Math.sqrt(Math.sqrt(scale)));
              }

          })

      chart.project();
      animate();
      // selectedImage = data.find(d => d.id == 88413)
      // showDetail(selectedImage)
      state.init = true;
  };


  function mousemove(d) {
      if(timelineHover) return;

      var mouse = d3.mouse(vizContainer.node());
      var p = toScreenPoint(mouse);
 
      var best = nearest(p[0] - imgPadding, p[1] - imgPadding, {
          d: 200,
          p: null
      }, quadtree);

      selectedImageDistance = best.d;

      if(bottomZooming && best.p && best.p.ii < 3 && selectedImageDistance > 7){
        // console.log("bottom");
        selectedImage = null;
        zoom.center(null);
        container.style("cursor", "default");
      } else {
        if (best.p && !zoomedToImage) {
            var d = best.p;
            // todo iprove that bitch
            var center = [((d.x + imgPadding) * scale) + translate[0], (height + d.y + imgPadding) * scale + translate[1]];
            zoom.center(center);

            selectedImage = d;
        }

        container.style("cursor", function() {
            return ((best.d < 5) && selectedImage.active) ? "pointer" : "default";
        });
      }

  } 


  function stackLayout(data, invert) {

      var years = d3.nest()
          .key(function(d) {
              return d.year;
          })
          // .sortKeys(d3.ascending)
          .entries(data)

      years.forEach(function(year) {
          var startX = x(year.key);
          var total = year.values.length;
          year.values.sort(function(a,b){
            return b.keywords.length - a.keywords.length;
          })
          //console.log(year.values)

          year.values.forEach(function(d, i) {
              var row = (Math.floor(i / collumns) +2);
              d.ii = i;

              d.x = startX + ((i % collumns) * (rangeBand / collumns));
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
          })
      })
  }

  chart.distance = function(a, b) {
      return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
  }

  function toScreenPoint(p) {
      var p2 = [0, 0];

      // console.log("t",translate,scale)

      p2[0] = p[0] / scale - translate[0] / scale;
      p2[1] = (p[1] / scale - height) - translate[1] / scale;

      return p2;
  }

  function imageAnimation() {
      var sleep = true

      data.forEach(function(d, i) {
          var diff;
          diff = (d.x1 - d.sprite.position.x);
          if (Math.abs(diff) > 0.1) {
            d.sprite.position.x += diff * 0.1;
            sleep = false;
          }

          diff = (d.y1 - d.sprite.position.y);
          if (Math.abs(diff) > 0.1) {
            d.sprite.position.y += diff * 0.1
            sleep = false;
          }

          diff = (d.alpha - d.sprite.alpha);
          if (Math.abs(diff) > 0.01) {
            d.sprite.alpha += diff * 0.2
            sleep = false;
          }

          d.sprite.visible = d.sprite.alpha > 0.1;

          if (d.sprite2) {
              diff = (d.alpha2 - d.sprite2.alpha);
              if (Math.abs(diff) > 0.01) {
                d.sprite2.alpha += diff * 0.2
                sleep = false;
              }

              d.sprite2.visible = d.sprite2.alpha > 0.1;
              //else d.sprite2.visible = d.visible;
          }
      });
    return sleep
  }

  var sleep = false
  chart.wakeup = function() { sleep = false }

  function animate(time) {
      requestAnimationFrame(animate);
      loadImages();
      if(sleep) return
      sleep = imageAnimation();
      renderer.render(stage);
  }

  function zoomToYear(d) {

      var xYear = x(d.year);
      var scale = 1 / (rangeBand*4 / width);
      var padding = rangeBand*1.5
      var translateNow = [-scale * (xYear - padding), -scale * (height + d.y)];

      vizContainer
          .call(zoom.translate(translate).event)
          .transition().duration(2000)
          .call(zoom.scale(scale).translate(translateNow).event)
  }

  function zoomToImage(d, duration) {

      // console.log("detail", d)

      state.zoomingToImage = true;

      zoom.center(null);

      loadMiddleImage(d);

      d3.select(".tagcloud").classed("hide", true);

      var padding = x.rangeBand() / collumns / 2;
      var sidbar = width / 8;
      // var padding = 0;
      var scale = 0.8 / (x.rangeBand() / collumns / width);
      var translateNow = [(-scale * (d.x - padding/2)) - sidbar, -scale * (height + d.y)];

      //console.log(scale, translateNow);

      zoomedToImageScale = scale;

      setTimeout(function() {
          hideTheRest(d);
      }, duration / 2);

      vizContainer
          .call(zoom.translate(translate).event)
          .transition().duration(duration)
          .call(zoom.scale(scale).translate(translateNow).event)
          .each("end", function() {

              zoomedToImage = true;
              selectedImage = d;

              hideTheRest(d);

              showDetail(d);

              loadBigImage(d, "click");

              state.zoomingToImage = false;
          })
  }

  function showDetail(d) {
      console.log("show detail", d)

      detailContainer
       .select(".outer")
       .node()
       .scrollTop = 0;

      detailContainer
          .classed("hide", false)
          .classed("sneak", utils.isMobile() )

      // needs to be done better
      var detailData = {}
      for ( field in selectedImage ){
        if(field[0] === '_') detailData[field] = selectedImage[field]
      }
      detailData['_id'] = selectedImage.imageid
      detailData['_keywords'] = selectedImage.keywords
      detailData['_year'] = selectedImage.year
      detailData['_imagenum'] = selectedImage.imagenum || 1
      detailVue._data.item = detailData
      detailVue._data.id = d.id
      detailVue._data.page = d.page

  }

  chart.changePage = function (id, page){
    console.log("changePage", id, page, selectedImage);
    // var d = data.find(function (d) { d.imageid == id })
    // console.log(d)
    selectedImage.page = page
    detailVue._data.page = page
    clearBigImages();
    loadBigImage(selectedImage)
  }


  function hideTheRest(d) {
      // c("hide", d.id)
      data.forEach(function(d2) {
          if (d2.id !== d.id) {
              // d2.sprite.alpha = 0;
              // d2.sprite.visible = false;
              d2.alpha = 0;
              d2.alpha2 = 0;

          }
      })
  }

  function showAllImages() {
      data.forEach(function(d) {
          d.alpha = d.active ? 1 : 0.2;;
          //d.visible = d.active;
          d.alpha2 = d.visible ? 1 : 0;
          //d.sprite.visible = true;  

      })
  }


  var timelineHover = false;


  function zoomed() {


      translate = d3.event.translate;
      scale = d3.event.scale;

      // check borders

      var x1 = -1 * translate[0] / scale;
      var x2 = (x1 + (widthOuter / scale));

      var y1 = (translate[1] + height * scale);

      var e1 = -extent[1] - bottomPadding;
      var y2 = (e1 - height) * scale + height;

      var e2 = extent[0] - bottomPadding;
      var y3 = (e2 + height) * -scale;

      // console.log(translate[1],e2, y3);

      if (d3.event.sourceEvent != null) {
          if (x1 < 0) {
              translate[0] = 0;
          } else if (x2 > widthOuter) {
              translate[0] = ((widthOuter * scale) - widthOuter) * -1;
          }

          if (translate[1] < y2) {
              // translate[1] = y2;
          }

          zoom.translate([translate[0], translate[1]]);

          x1 = -1 * translate[0] / scale;
          x2 = (x1 + (width / scale))
      }

      if (zoomedToImageScale != 0 && scale > zoomedToImageScale && !zoomedToImage && selectedImage && selectedImage.type == "image") {
          
          zoomedToImage = true;
          zoom.center(null);
          zoomedToImageScale = scale;
          hideTheRest(selectedImage);
          showDetail(selectedImage)
      }

      if (zoomedToImage && zoomedToImageScale - 20 > scale) {
          // c("clear")
          zoomedToImage = false;
          state.lastZoomed = 0;
          showAllImages();
          clearBigImages();
          detailContainer.classed("hide", true)
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

      sleep = false
  }

  function zoomstart(d) {
      zooming = true;
      startTranslate = translate;
      startScale = scale;
  }

  function zoomend(d) {
      drag = translate !== startTranslate;
      zooming = false;

      filterVisible();

      if (zoomedToImage && !selectedImage.big && state.lastZoomed != selectedImage.id && !state.zoomingToImage) {
          //c("loadbig after zoom")
          loadBigImage(selectedImage, "zoom");
      }
  }

  chart.highlight = function() {
      data.forEach(function(d, i) {
          d.alpha = d.highlight ? 1 : 0.2;
      });
  }

  chart.project = function(){
    sleep = false
    chart.split();
    chart.resetZoom();
  }

  chart.resetZoom = function() {
      var duration = 1400;

      extent = d3.extent(data, function(d) { return d.y; });

      var y = -extent[1] - bottomPadding;
      // console.log(extent, y)
      y =  (extent[1] / -3) - bottomPadding
      // y =  - bottomPadding
      //bottomZooming = (y<-30 && y>-40);      

      vizContainer
          .call(zoom.translate(translate).event)
          .transition().duration(duration)
          .call(zoom.translate([0, y]).scale(1).event)
          //.each("end", chart.split)
  }

  chart.split = function() {
      var active = data.filter(function(d) {
          return d.active;
      })
      stackLayout(active, false);

      var inactive = data.filter(function(d) {
          return !d.active;
      })
      stackLayout(inactive, true);

      // console.time("Quadtree")
      quadtree = Quadtree(data);
      // console.timeEnd("Quadtree");
 
  }

  function filterVisible() {

      var zoomScale = scale;

      if (zoomedToImage) return;

      data.forEach(function(d, i) {
          var p = d.sprite.position;
          var x = (p.x / scale1) + translate[0] / zoomScale;
          var y = ((p.y / scale1) + (translate[1]) / zoomScale);
          var padding = 5;

          // c(x,y,p, translate, zoomScale, scale, height/zoomScale, y+height)

          if (x > (-padding) && x < ((width / zoomScale) + padding) && y + height < (height / zoomScale + padding) && y > (height * -1) - padding) {
              //d.sprite.alpha = 1;
              d.visible = true;
              // d.alpha = 1;
          } else {
              //d.sprite.alpha = 0.5;
              d.visible = false;
              // d.alpha = 0;
          }
      });

      var visible = data.filter(function(d) {
          return d.visible;
      });
      //c(visible.length);


      if (visible.length < 40) {
          data.forEach(function(d) {
              if (d.visible && d.loaded && d.active) d.alpha2 = 1;
              else if (d.visible && !d.loaded && d.active) loadImagesCue.push(d);
              else d.alpha2 = 0;
          })
      } else {
          data.forEach(function(d) {
              d.alpha2 = 0;
              //if(d.sprite2) d.sprite2.visible = false;
          })
      }


  }

  function loadMiddleImage(d) {
      if (d.loaded) {
          d.alpha2 = 1;
          return;
      }

      // console.log("load", d)
      var texture = new PIXI.Texture.fromImage(config.loader.textures.detail.url + d.id + '.jpg', true)
      var sprite = new PIXI.Sprite(texture);

      var update = function() {
        sleep = false
      }

      sprite.on('added', update)
      texture.once('update', update)

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
      sleep = false
  }

  function loadBigImage(d) {
      if(!config.loader.textures.big) {
        loadMiddleImage(d)
        return
      }

      state.lastZoomed = d.id;
      var page = d.page ? '_' + d.page : ''
      var url = config.loader.textures.big.url + d.id + page + ".jpg";

      var texture = new PIXI.Texture.fromImage(url, true)
      var sprite = new PIXI.Sprite(texture);
      var res = config.loader.textures.big.size

      var updateSize = function() {
        var size = Math.max(texture.width, texture.height)
        sprite.scale.x = sprite.scale.y = (imageSize3 / size) * d.scaleFactor;
        sleep = false
      }

      sprite.on('added', updateSize)
      texture.once('update', updateSize)

      if(d.imagenum) {
        sprite.on("mousemove", function (s) {
          var pos = s.data.getLocalPosition(s.currentTarget)
          s.currentTarget.cursor = pos.x > 0 ? "e-resize" : "w-resize"
        })
        sprite.on("click", function (s) {

          console.log("click sprite")
          s.stopPropagation()
          spriteClick = true
          var pos = s.data.getLocalPosition(s.currentTarget)
          var dir = pos.x > 0 ? 1 : -1
          var page = d.page + dir
          // var nextPage = Math.min(Math.max(page, 0), d.imagenum-1)
          var nextPage = page
          if(page > d.imagenum-1) nextPage = 0
          if(page < 0) nextPage = d.imagenum-1

          chart.changePage(d.id, nextPage)
        })
        sprite.interactive = true;
      }

      sprite.anchor.x = 0.5;
      sprite.anchor.y = 0.5;
      sprite.position.x = d.x * scale3 + imageSize3 / 2;
      sprite.position.y = d.y * scale3 + imageSize3 / 2;
      sprite._data = d;
      d.big = true;

      // console.log(sprite, "done")

      stage5.addChild(sprite);
      sleep = false
  }

  function clearBigImages() {
      while (stage5.children[0]) {
          stage5.children[0]._data.big = false;
          stage5.removeChild(stage5.children[0]);
          sleep = false
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


  // function translateUpDown(dir) {

  //     var translateNow = [translate[0], translate[1] + dir * 10 * scale];

  //     svg
  //         .call(zoom.translate(translate).event)
  //         .transition().duration(1000)
  //         .call(zoom.translate(translateNow).event)
  // }

  // function getSiblingImage(active, dir) {
  //     if (!active) return;

  //     return data.filter(function(d) {
  //         return (d.order == active.order + dir && d.year == active.year);
  //     })[0];

  // }

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
      if (x < x1 - best.d || x > x2 + best.d || y < y1 - best.d || y > y2 + best.d) {
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
      var rl = (2 * x > x1 + x2),
          bt = (2 * y > y1 + y2);
      if (kids[bt * 2 + rl]) best = nearest(x, y, best, kids[bt * 2 + rl]);
      if (kids[bt * 2 + (1 - rl)]) best = nearest(x, y, best, kids[bt * 2 + (1 - rl)]);
      if (kids[(1 - bt) * 2 + rl]) best = nearest(x, y, best, kids[(1 - bt) * 2 + rl]);
      if (kids[(1 - bt) * 2 + (1 - rl)]) best = nearest(x, y, best, kids[(1 - bt) * 2 + (1 - rl)]);

      return best;
  }


  return chart;

}
