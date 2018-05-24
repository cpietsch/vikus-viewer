// christopher pietsch
// cpietsch@gmail.com
// twitter @chrispiecom
// 2015-2016


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
  var svg, timeline;
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
    last: { mode: "time" },
    init: false,
    config: {
      hasNoBig: true
    }
  };


  var tsneGrid = false;
  var detailContainer = d3.select(".sidebar")

  var force = d3.layout.force()
      .size([width, height])

  var filter;
  var myTooltip;

  var timelineData;

  var stage, stage1, stage2, stage3, stage4, stage5;

  function chart() {}

  chart.setMode = function(name){
    timeline.classed("hide", function(d){ return name != "time" });
    state.last.mode = state.mode;
    state.mode = name;
    chart.project();
  }

  chart.setTsneGrid = function(d){
    tsneGrid = d;
    chart.initTSNE();
  }
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

      timeDomain.forEach(function(d) {
          d.x = x(d.key);
      });

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
      
      // obsolete ?
      PIXI.settings.SCALE_MODE = 1

      var renderOptions = {
          transparent: false,
          resolution: 1,
          antialiasing: false
      };
      renderer = new PIXI.WebGLRenderer(width + margin.left + margin.right, height, renderOptions);
      renderer.backgroundColor = parseInt(config.style.canvasBackground.substring(1), 16)
      window.renderer = renderer;
     
      var renderElem = d3.select(container.node().appendChild(renderer.view));

      stats = new Stats();
      document.body.appendChild(stats.domElement);

      stage = new PIXI.Container();
      stage2 = new PIXI.Container();
      stage3 = new PIXI.Container();
      stage4 = new PIXI.Container();
      stage5 = new PIXI.Container();
      // stageBack = new PIXI.Container();

      // stage.addChild(stageBack);
      stage.addChild(stage2);
      stage2.addChild(stage3);
      stage2.addChild(stage4);
      stage2.addChild(stage5);


      //loadBigImage(data[parseInt(Math.random()*data.length)]);

      //console.log(_data[0])

      // timeline cleaning
      _timeline.forEach(function(d) {
          d.jahr = d.year;
          // d.jahr = d.jahr.split("-")[0];
          // d.jahr = d.jahr * 1;
          d.type = "timeline";

          if(lang == "en"){
            d.titel = d.titelEN;
            d.text = d.textEN;
            d.extra = d.extraEN;
          }
      });

      var chartDomain = d3.nest()
        .key(function(d){ return d.jahr; })
        .entries(_data.concat(_timeline))
        .sort(function(a, b) { return a.key - b.key; })
        // .sort(function(a, b) { return d3.descending(a.key, b.key) })
        .map(function(d){ return d.key; })

      timeDomain = chartDomain.map(function(d){
        return {
          key: d,
          values: _timeline.filter(function(e){ return d == e.jahr; })
        }
      })
      x.domain(chartDomain);

      // console.log(chartDomain)

      chart.makeScales();


      // add preview pics
      data.forEach(function(d, i) {
          var texture = imagesMap.get(d.id);
          var sprite = new PIXI.Sprite(texture);
          
          sprite.anchor.x = 0.5;
          sprite.anchor.y = 0.5;

          // sprite.scale.x = 1/scale1;
          // sprite.scale.y = 1/scale1;

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
              // console.log("DRAG", drag)
              if (spriteClick) { spriteClick = false; return; }
              if (selectedImage && !selectedImage.id) return;
              if (drag) return;
              if (selectedImageDistance > 15) return;
              if (selectedImage && !selectedImage.active) return;
              if(timelineHover) return;
              // console.log(selectedImage)



              if (Math.abs(zoomedToImageScale - scale) < 0.1) {
                  logger.log({
                      action: "zoomback",
                      scale: scale,
                      target: selectedImage ? selectedImage.id : ""
                  });
                  chart.resetZoom();
              } else {
                  logger.log({
                      action: "zoomto",
                      scale: scale,
                      target: selectedImage ? selectedImage.id : ""
                  });
                  zoomToImage(selectedImage, 1400 / Math.sqrt(Math.sqrt(scale)));
              }

              // if(zoomedToImage) zoomToImage(selectedImage, 500);
              // if(!zoomedToImage) zoomToImage(selectedImage, 1000);
          })

      svg = renderElem;
          
      timeline = d3.select(".viz").append("div").classed("timeline", true)
          .style("transform", "translate(" + 0 + "px," + (height - 30) + "px)");

      chart.project();

      animate();


      state.init = true;
  };


  function mousemove(d) {
      if(timelineHover) return;

      var mouse = d3.mouse(vizContainer.node());
      var p = toScreenPoint(mouse);

      // console.time("search")
      var best = nearest(p[0] - imgPadding, p[1] - imgPadding, {
          d: 200,
          p: null
      }, quadtree);
      // console.timeEnd("search")

      selectedImageDistance = best.d;
      // console.log(selectedImageDistance);

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

  var flipflop = false;

  function stackLayout(data, invert) {
      flipflop = !flipflop;

      var years = d3.nest()
          .key(function(d) {
              return d.jahr;
          })
          // .sortKeys(d3.ascending)
          .entries(data)

      years.forEach(function(year) {
          var startX = x(year.key);
          var total = year.values.length;
          year.values.sort(function(a,b){
            return b.keywords.length - a.keywords.length;
            // return b.scaleFactor - a.scaleFactor;
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


  chart.click = function(d) {
      // c("click")

  }

  function toScreenPoint(p) {
      var p2 = [0, 0];

      // console.log("t",translate,scale)

      p2[0] = p[0] / scale - translate[0] / scale;
      p2[1] = (p[1] / scale - height) - translate[1] / scale;

      return p2;
  }

  chart.mousemove = function(d) {
      if (cloud.lock) return;

      var mouse = d3.mouse(this);
      var p = [d.point.x, d.point.y];

      var distance = chart.distance(mouse, p);

      //c("distance", distance);

      // c("cell", p);
      // c("mouse", mouse);
  }



  chart.mouseout = function(d) {
      // console.log("mouseout")
      if (cloud.lock) return;

      //d.target.alpha = 1;
      if (scale < zoomBarrier) {
          cloud.mouseleave();
      }

      myTooltip.hide();
      // svg.attr("cursor", "default");

  }



  chart.mousedown = function(d) {
      if (drag) return;

      var d = d.point;
      //var elm = d.target._data;

      if (!drag) {
          zoomToImage(d, 1000 / Math.sqrt(Math.sqrt(scale)));
      }

  }


  // function keydown(d) {
      // var key = d3.event.keyIdentifier;
      // var charkey = String.fromCharCode(d3.event.charCode || d3.event.keyCode);

      // if (d3.event.keyCode === 8) {
      //     d3.event.preventDefault();
      //     search = search.slice(0, -1);
          
      //     cloud.search(search);
      // }


      // if (!/[^a-zA-Z0-9]/.test(charkey)) {
      //     search += charkey;
      //     cloud.search(search);
      // }

      // if (key == "Right" || key == "Left") {
      //     var dir = key == "Right" ? -1 : 1;
      //     var next = getSiblingImage(selectedImage, dir);

      //     // c(dir, next)
      //     clearBigImages();
      //     zoomToImage(next, 500);
      // }

      // if (key == "Up" || key == "Down") {
      //     var dir = key == "Up" ? 1 : -1;
      //     translateUpDown(dir);
      // }

  // }

  function translateUpDown(dir) {

      var translateNow = [translate[0], translate[1] + dir * 10 * scale];

      svg
          .call(zoom.translate(translate).event)
          .transition().duration(1000)
          .call(zoom.translate(translateNow).event)
  }

  function getSiblingImage(active, dir) {
      if (!active) return;

      return data.filter(function(d) {
          return (d.order == active.order + dir && d.jahr == active.jahr);
      })[0];

  }

  function imageAnimation() {

      data.forEach(function(d, i) {
          var diff;
          diff = (d.x1 - d.sprite.position.x);
          if (Math.abs(diff) > 0.1) d.sprite.position.x += diff * 0.1;

          diff = (d.y1 - d.sprite.position.y);
          if (Math.abs(diff) > 0.1) d.sprite.position.y += diff * 0.1;

          diff = (d.alpha - d.sprite.alpha);
          if (Math.abs(diff) > 0.01) d.sprite.alpha += diff * 0.2;

          d.sprite.visible = d.sprite.alpha > 0.1;

          if (d.sprite2) {
              diff = (d.alpha2 - d.sprite2.alpha);
              if (Math.abs(diff) > 0.01) d.sprite2.alpha += diff * 0.2;

              d.sprite2.visible = d.sprite2.alpha > 0.1;
              //else d.sprite2.visible = d.visible;
          }
      });
    
  }

  function animate(time) {

      requestAnimationFrame(animate);

      loadImages();
      imageAnimation();

      renderer.render(stage);
      stats.update();
  }

  function zoomToYear(d) {

      var xYear = x(d.jahr);
      var scale = 1 / (rangeBand / width);
      var translateNow = [-scale * xYear, -scale * (height + d.y)];

      svg
          .call(zoom.translate(translate).event)
          .transition().duration(2000)
          .call(zoom.scale(scale).translate(translateNow).event)
  }


  var zoomedToImage = false;
  var zoomedToImageScale = 117;
  var zoomBarrier = 2;
  // todo: zoombarrier as d3.scale.threshold()

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

      svg
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
      // console.log("show detail")
      logger.log({
          action: "zoomToDetail",
          target: d.id
      });

      detailContainer
       .select(".outer")
       .node()
       .scrollTop = 0;

      detailContainer
          .classed("hide", false)
          .classed("sneak", (lang=="en" || utils.isMobile()) )


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

      console.log(selectedImage, detailData)
  }

  function changePage(id, page){
    console.log("changePage", id, page, selectedImage);
    // var d = data.find(function (d) { d.imageid == id })
    // console.log(d)
    selectedImage.page = page
    detailVue._data.page = page
    clearBigImages();
    loadBigImage(selectedImage)
  }
  chart.changePage = changePage


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

  var fontScale = d3.scale.linear()
      .domain([1, 9])
      .range([9, 20])
      .clamp(true)

  var timelineFontScale = d3.scale.linear()
      .domain([2, 8, 20])
      .range([9, 14, 19])
      .clamp(true)

  var timelineScale = d3.scale.threshold()
      .domain([3, 10, 20])
      .range(["none", "small", "middle", "large"])

  var timelineHover = false;

  function updateDomain(x1, x2) {

      timeDomain.forEach(function(d) {
          d.pos = ((d.x - x1) * scale);
          d.visible = (d.pos > (-rangeBand * scale) && d.pos < width + 100);
      })

      timeline.attr("class", "timeline " + timelineScale(scale))

      timeline.style("font-size", function() {
          return (2 * scale)+ "px";
      });


      var select = timeline.selectAll(".container")
          .data(timeDomain)

      var enter = select
          .enter()
          .append("div")
          .classed("container", true)
          .on("mouseenter", function(d){
            timelineHover = true;
            zoom.center(null);
            selectedImage = null;
            logger.log({
              action: "enter timeline",
              scale: scale,
              translate: translate,
              target: d.key,
            });
            // console.log("enter")
          })
          .on("mouseleave", function(d){
            timelineHover = false;
            logger.log({
              action: "exit timeline",
              scale: scale,
              translate: translate,
              target: d.key,
            });
          })


      enter.append("div")
          .classed("year", true)
          .text(function(d) {
              return d.key;
          })

      var e = enter
          .append("div")
          .classed("entries", true)
          .selectAll(".entry")
          .data(function(d) {
              return d.values;
          })
          .enter()
          .append("div")
          .classed("entry", true)

      e
          .append("div")
          .classed("small", true)
          .append("div")
          .classed("title", true)
          .text(function(d) {
              return d.titel;
          })

      var m = e
          .append("div")
          .classed("middle", true)

      m
          .append("div")
          .classed("title", true)
          .text(function(d) {
              return d.titel;
          })

      m
          .append("div")
          .classed("text", true)
          .text(function(d) {
              return d.text + ".";
          }) //…

      var l = e
          .append("div")
          .classed("large", true)

      l
          .append("div")
          .classed("title", true)
          .text(function(d) {
              return d.titel;
          })

      l
          .append("div")
          .classed("text", true)
          .html(function(d) {
              return d.text + ".<br><br>" + d.extra;
          })

      select
          .style("transform", function(d) {
              return "translate3d(" + parseInt(d.pos) + "px,0px,0px)";
          })
          .style("height", rangeBand * scale + "px")
          .style("width", rangeBand * scale + "px")
          .style("display", function(d) {
              return d.visible ? "block" : "none";
          })

      select
          .select(".year")
          .style("font-size", fontScale(scale) + "px")

  
  }

  function zoomed() {

      translate = d3.event.translate;
      scale = d3.event.scale;

      // check borders
      // this shit cost me a lot of nerves...
      // to be refactored

      var x1 = -1 * translate[0] / scale;
      var x2 = (x1 + (widthOuter / scale));

      var y1 = (translate[1] + height * scale);

      var e = -extent[1] - bottomPadding;
      var y2 = (e - height) * scale + height;

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
              translate[1] = y2;
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
          detailContainer.classed("hide", true).classed("sneak", lang=="en")
      }

      updateDomain(x1, x2);

      var timeY = ((height) * scale - (-1 * translate[1]) - rangeBandImage * scale);
      timeline
          .style("transform", "translate(" + 0 + "px," + timeY + "px)");
      

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

  }


  var startTranslate = [0, 0];
  var startScale = 0;

  var zooming = false;

  function zoomstart(d) {
      zooming = true;
      startTranslate = translate;
      startScale = scale;
  }

  var thresholdScale = d3.scale.threshold()
    .domain([1.1,115,116])
    .range(["far","middle","close","detail"])


  function zoomend(d) {
      drag = translate !== startTranslate;
      zooming = false;

      filterVisible();

      logger.log({
          action: "zoomend",
          translate: translate,
          scale: scale,
          target: selectedImage ? selectedImage.id : ""
      });

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
    if(state.mode == "tsne" || state.mode == "grid"){
      chart.projectTSNE();
    }
    else {
      chart.split();
    }
    chart.resetZoom();
  }

  chart.projectTSNE = function(){

    var marginBottom = -height / 2.5;

    var inactive = data.filter(function(d){ return !d.active; });
    var inactiveSize = inactive.length;

    var active = data.filter(function(d){ return d.active; });

    inactive.sort(function(a,b){ return a.rTSNE - b.rTSNE });

    inactive.forEach(function(d,i){
      var r = 300 + d.scaleFactor*100;
      var a =  -Math.PI/2+ (i/inactiveSize) * 2*Math.PI; 
      var factor = 10;

      d.x = r * Math.cos(a) +width/2;
      d.y = r * Math.sin(a) +marginBottom;
    });

    active.forEach(function(d){

      if(state.mode == "tsne"){
        var factor = 10;
        d.x = d.tsne[0]*factor +width/2;
        d.y = d.tsne[1]*factor +marginBottom;
      } else {
        var factor =8;
        d.x = d.grid[0]*factor +width/2 - 150;
        d.y = d.grid[1]*factor-150 +marginBottom;
      }
     
    })

    data.forEach(function(d){
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


  }


  chart.resetZoom = function() {
      var duration = 1400;

      extent = d3.extent(data, function(d) { return d.y; });

      var y = -extent[1] - bottomPadding;
      console.log(extent, y)
      y =  (extent[1] / -3) - bottomPadding
      // y =  - bottomPadding
      bottomZooming = (y<-30 && y>-40);      

      svg
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

  function nearest(x, y, best, node) {
      // mike bostocks code https://blocks...
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


  function filterVisible() {

      var zoomScale = scale;
      // var translate = t;

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
      // if (!imagesMap2.get(d.id)) {
      //     return;
      // }
      // console.log("load", d)
      var texture = new PIXI.Texture.fromImage(config.loader.textures.detail.url + d.id + '.jpg', true)
      var sprite = new PIXI.Sprite(texture);

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

          changePage(d.id, nextPage)
        })
        sprite.interactive = true;
      }

      sprite.anchor.x = 0.5;
      sprite.anchor.y = 0.5;
      sprite.position.x = d.x * scale3 + imageSize3 / 2;
      sprite.position.y = d.y * scale3 + imageSize3 / 2;
      sprite._data = d;
      d.big = true;

      console.log(sprite, "done")

      stage5.addChild(sprite);

  }


  function loadBigImage2(d, type) {
      console.log("loadBig", d.id, d.page);

      if(!config.loader.textures.big) {
        loadMiddleImage(d)
        return
      }

      state.lastZoomed = d.id;

      var page = d.page ? '_' + (d.page) : ''
      var url = config.loader.textures.big.url + d.id + page + ".jpg";

      LoaderBlob(url).finished(function(blob){
        var sprite = new PIXI.Sprite.from(blob);

        if(d.imagenum) {
          sprite.on("mousemove", function (s) {
            var pos = s.data.getLocalPosition(s.currentTarget)
            s.currentTarget.cursor = pos.x > 0 ? "e-resize" : "w-resize"
          })
          sprite.on("click", function (s) {
            console.log("click sprite")
            // s.stopPropagation()
            spriteClick = true
            var pos = s.data.getLocalPosition(s.currentTarget)
            var dir = pos.x > 0 ? 1 : -1
            var page = d.page + dir
            // var nextPage = Math.min(Math.max(page, 0), d.imagenum-1)
            var nextPage = page
            if(page > d.imagenum-1) nextPage = 0
            if(page < 0) nextPage = d.imagenum-1

            changePage(d.id, nextPage)
          })
          sprite.interactive = true;
        }

        console.log(sprite.width, sprite.height)

        var maxRes = Math.max(sprite.width, sprite.height)
        
        // c(texture.baseTexture.hasLoaded, sprite);
        sprite.scale.x = d.scaleFactor;
        sprite.scale.y = d.scaleFactor;

        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.position.x = d.x * scale3 + imageSize3 / 2;
        sprite.position.y = d.y * scale3 + imageSize3 / 2;
        sprite._data = d;
        d.big = true;

        stage5.addChild(sprite);

      })

  }


  function loadBigImage3(d, callback) {
      // c("loadBig", d.id);

      var img = new Image();

      img.addEventListener("load", function() {
          // console.log(img)
          var base = new PIXI.BaseTexture(img);
          var texture = new PIXI.Texture(base);
          // var texture = PIXI.Texture.fromImage("data/bilder_4000/" + d.id + ".jpg");
          var sprite = new PIXI.Sprite(texture);

          //c(texture.baseTexture.hasLoaded, sprite);

          sprite.scale.x = sprite.scale.y = 0.1;

          sprite.anchor.x = 0.5;
          sprite.anchor.y = 0.5;
          sprite.position.x = d.x * scale3 + imageSize3 / 2;
          sprite.position.y = d.y * scale3 + imageSize3 / 2;
          sprite._data = d;
          d.big = true;

          stage5.addChild(sprite);
      });
      // img.src = "data/bilder_4000/" + d.id + ".jpg";
      // img.src = "data/large/105599.jpg";
      img.crossOrigin = "";
      img.src = "https://s3.eu-central-1.amazonaws.com/fw4/large/" + d.id + ".jpg";


  }

  function clearBigImages() {
      while (stage5.children[0]) {
          stage5.children[0]._data.big = false;
          stage5.removeChild(stage5.children[0]);
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


  return chart;

}
