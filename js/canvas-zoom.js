// canvas-zoom.js
// Zoom and pan interactions for Canvas module

function CanvasZoom(canvasConfig, canvasState, canvasData, timeline, pixiRenderer, imageLoader, detailModule) {
  var canvasDebug = CanvasDebug();
  var canvasHash = null; // Will be set via setHashModule
  
  var zoom = d3.behavior
    .zoom()
    .scaleExtent([1, canvasConfig.maxZoomLevel])
    .size([canvasConfig.width, canvasConfig.height]);

  function zoomed() {
    canvasState.setLastSourceEvent(d3.event.sourceEvent);
    var translate = d3.event.translate;
    var scale = d3.event.scale;
    
    canvasState.setTranslate(translate);
    canvasState.setScale(scale);
    
    if (!canvasState.getStartTranslate()) {
      canvasState.setStartTranslate(translate);
    }
    canvasState.setDrag(canvasState.getStartTranslate() && translate !== canvasState.getStartTranslate());

    // check borders
    var x1 = (-1 * translate[0]) / scale;
    var x2 = x1 + canvasConfig.widthOuter / scale;

    if (d3.event.sourceEvent != null) {
      if (x1 < 0) {
        translate[0] = 0;
      } else if (x2 > canvasConfig.widthOuter) {
        translate[0] = (canvasConfig.widthOuter * scale - canvasConfig.widthOuter) * -1;
      }

      zoom.translate([translate[0], translate[1]]);

      x1 = (-1 * translate[0]) / scale;
      x2 = x1 + canvasConfig.width / scale;
    }

    // Check if zooming into image
    if (
      canvasConfig.zoomedToImageScale != 0 &&
      scale > canvasConfig.zoomedToImageScale * 0.9 &&
      !canvasState.isZoomedToImage() &&
      canvasState.getSelectedImage() &&
      canvasState.getSelectedImage().type == "image"
    ) {
      canvasState.setZoomedToImage(true);
      zoom.center(null);
      var selectedImage = canvasState.getSelectedImage();
      detailModule.hideTheRest(selectedImage);
      detailModule.showDetail(selectedImage);
    }

    // Check if zooming out from image
    if (canvasState.isZoomedToImage() && canvasConfig.zoomedToImageScale * 0.8 > scale) {
      canvasState.setZoomedToImage(false);
      canvasState.setLastZoomed(0);
      detailModule.showAllImages();
      imageLoader.clearBigImages();
      d3.select(".sidebar").classed("hide", true);
    }

    timeline.update(x1, x2, scale, translate, canvasConfig.scale1);

    // toggle zoom overlays
    if (scale > canvasConfig.zoomBarrier && !canvasState.getZoomBarrierState()) {
      canvasState.setZoomBarrierState(true);
      d3.select(".tagcloud, .crossfilter").classed("hide", true);
      d3.select(".searchbar").classed("hide", true);
      d3.select(".infobar").classed("sneak", true);
    }
    if (scale < canvasConfig.zoomBarrier && canvasState.getZoomBarrierState()) {
      canvasState.setZoomBarrierState(false);
      d3.select(".tagcloud, .crossfilter").classed("hide", false);
      d3.select(".vorbesitzerinOuter").classed("hide", false);
      d3.select(".searchbar").classed("hide", false);
    }

    pixiRenderer.updateStageTransform();
    canvasState.setSleep(false);
  }

  function zoomstart(d) {
    canvasState.setZooming(true);
    canvasState.setStartTranslate(false);
    canvasState.setDrag(false);
    canvasState.setStartScale(canvasState.getScale());
  }

  function zoomend() {
    if (!canvasState.getStartTranslate()) return;
    
    var translate = canvasState.getTranslate();
    var startTranslate = canvasState.getStartTranslate();
    
    canvasState.setDrag(startTranslate && translate !== startTranslate);
    canvasState.setZooming(false);
    imageLoader.filterVisible();

    var selectedImage = canvasState.getSelectedImage();
    if (
      canvasState.isZoomedToImage() &&
      selectedImage &&
      !selectedImage.big &&
      canvasState.getLastZoomed() != selectedImage.id &&
      !canvasState.isZoomingToImage()
    ) {
      imageLoader.loadBigImage(selectedImage);
    }

    // Hash update logic (moved to hash module in full implementation)
    if (canvasHash) {
      handleHashUpdate(canvasHash.getView);
    }
  }

  function handleHashUpdate(getViewFunc) {
    var lastSourceEvent = canvasState.getLastSourceEvent();
    if (!lastSourceEvent) return;

    var debounceHash = canvasState.getDebounceHash();
    if (debounceHash) clearTimeout(debounceHash);
    
    var newDebounce = setTimeout(function () {
      if (canvasState.isZooming()) return;
      
      // Update hash with viewport items
      var hash = window.location.hash.slice(1);
      var params = new URLSearchParams(hash);

      var idsInViewport = getViewFunc();
      if (idsInViewport.length > 0) {
        params.set("ids", idsInViewport.join(","));
      } else if (canvasState.isZoomedToImage()) {
        return;
      } else {
        params.delete("ids");
      }
      
      window.location.hash = params.toString().replaceAll("%2C", ",");
      canvasState.setUserInteraction(true);
    }, canvasConfig.debounceHashTime);
    
    canvasState.setDebounceHash(newDebounce);
  }

  function zoomToImage(d, duration, config) {
    canvasState.setZoomingToImage(true);
    var vizContainer = pixiRenderer.getContainer();
    vizContainer.style("pointer-events", "none");
    zoom.center(null);
    imageLoader.loadMiddleImage(d, config);
    d3.select(".tagcloud").classed("hide", true);

    var padding = canvasConfig.rangeBandImage / 2;
    var max = Math.max(canvasConfig.width, canvasConfig.height);
    var scale = 1 / (canvasConfig.rangeBandImage / (max * 0.6));
    var translateNow = [
      -scale * (d.x - padding) - (max * 0.3) / 2 + canvasConfig.margin.left,
      -scale * (canvasConfig.height + d.y + padding) - canvasConfig.margin.top + canvasConfig.height / 2,
    ];

    setTimeout(function () {
      detailModule.hideTheRest(d);
    }, duration / 2);

    var translate = canvasState.getTranslate();
    vizContainer
      .call(zoom.translate(translate).event)
      .transition()
      .duration(duration)
      .call(zoom.scale(scale).translate(translateNow).event)
      .each("end", function () {
        canvasState.setZoomedToImage(true);
        canvasState.setSelectedImage(d);
        detailModule.hideTheRest(d);
        detailModule.showDetail(d, config);
        imageLoader.loadBigImage(d, config);
        canvasState.setZoomingToImage(false);
        canvasDebug.log('zoom', "zoomedToImage", canvasState.isZoomedToImage());
        vizContainer.style("pointer-events", "auto");
        utils.updateHash("ids", d.id, ["translate", "scale"]);
      });
  }

  function resetZoom(callback) {
    var scale = canvasState.getScale();
    var duration = scale > 1 ? 1000 : 100;

    var data = canvasData.getData();
    var extent = d3.extent(data, function (d) {
      return d.y;
    });
    canvasState.setExtent(extent);

    var y = -canvasConfig.bottomPadding;

    canvasDebug.log('zoom', "resetZoom", canvasState.getTranslate());

    var translate = canvasState.getTranslate();
    var vizContainer = pixiRenderer.getContainer();
    
    vizContainer
      .call(zoom.translate(translate).event)
      .transition()
      .duration(duration)
      .call(zoom.translate([0, y]).scale(1).event)
      .each("end", function () {
        if (callback && scale < canvasConfig.zoomBarrier) callback();
      });
  }

  function setView(ids, duration) {
    if (duration === void 0) { duration = 1000; }
    
    var data = canvasData.getData();
    var items = data.filter(function (d) { return ids.includes(d.id); });
    if (!items.length) return;

    var vizContainer = pixiRenderer.getContainer();
    vizContainer.style("pointer-events", "none");
    zoom.center(null);
    canvasState.setZoomingToImage(true);

    // Compute the bounding box of all selected items
    var xs = items.map(function (d) { return d.x; });
    var ys = items.map(function (d) { return d.y });

    var minX = d3.min(xs);
    var maxX = d3.max(xs);
    var minY = d3.min(ys);
    var maxY = d3.max(ys);

    var width = canvasConfig.width;
    var height = canvasConfig.height;

    // Use rangeBandImage for padding/spacing logic
    var padding = canvasConfig.rangeBandImage / 2;
    var boxWidth = maxX - minX + padding * 2;
    var boxHeight = maxY - minY + padding * 2;

    // Calculate center without padding (center point remains the same)
    var centerX = (minX + maxX) / 2;
    var centerY = (minY + maxY) / 2;

    // Calculate scale to fit the bounding box
    var scale = 0.9 / Math.max(boxWidth / width, boxHeight / height);

    var translateTarget = [
      width / 2 - scale * (centerX + padding),
      height / 2 - scale * (height + centerY + padding),
    ];

    if (items.length == 1) {
      // Single item - will be handled in transition end
    }

    var translate = canvasState.getTranslate();
    vizContainer
      .interrupt()
      .call(zoom.translate(translate).event)
      .transition()
      .duration(duration)
      .call(zoom.scale(scale).translate(translateTarget).event)
      .each("end", function () {
        canvasState.setZoomingToImage(false);
        vizContainer.style("pointer-events", "auto");
        if (items.length == 1) {
          var d = items[0];
          canvasState.setZoomedToImage(true);
          canvasState.setSelectedImage(d);
          detailModule.showDetail(d);
          imageLoader.loadBigImage(d);
          detailModule.hideTheRest(d);
        }
      });
  }

  // Setup zoom behavior
  zoom.on("zoom", zoomed)
      .on("zoomend", zoomend)
      .on("zoomstart", zoomstart);

  function setHashModule(hashModule) {
    canvasHash = hashModule;
  }

  return {
    zoom: zoom,
    zoomed: zoomed,
    zoomstart: zoomstart,
    zoomend: zoomend,
    zoomToImage: zoomToImage,
    resetZoom: resetZoom,
    setView: setView,
    setHashModule: setHashModule,
  };
}
