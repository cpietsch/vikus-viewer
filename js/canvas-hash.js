// canvas-hash.js
// URL hash synchronization for Canvas module

function CanvasHash(canvasConfig, canvasState, canvasData, canvasZoom, canvasDetail, canvasAnnotations, timeline, tags, search) {
  var canvasDebug = CanvasDebug();
  var canvasUtils = CanvasUtils();
  
  function getView() {
    var visibleItems = [];
    var data = canvasData.getData();
    var translate = canvasState.getTranslate();
    var scale = canvasState.getScale();

    var invScale = 1 / scale;
    var viewLeft = (-translate[0] * invScale);
    var viewTop = (-translate[1] * invScale) - canvasConfig.height;
    var viewRight = viewLeft + canvasConfig.widthOuter * invScale;
    var viewBottom = viewTop + canvasConfig.height * invScale;

    data.forEach(function (d) {
      var px = d.x1 / canvasConfig.scale1;
      var py = d.y1 / canvasConfig.scale1;
      var halfW = 0;
      var halfH = 0;

      var left = px - halfW;
      var right = px + halfW;
      var top = py - halfH;
      var bottom = py + halfH;

      if (
        left >= viewLeft &&
        right <= viewRight &&
        top >= viewTop &&
        bottom <= viewBottom
      ) {
        visibleItems.push(d);
      }
    });

    if (visibleItems.length === 0 || visibleItems.length == data.length) {
      return [];
    }

    var mostLeft = null;
    var mostRight = null;
    var mostTop = null;
    var mostBottom = null;

    visibleItems.forEach(function (d) {
      if (!mostLeft || d.x < mostLeft.x) mostLeft = d;
      if (!mostRight || d.x > mostRight.x) mostRight = d;
      if (!mostTop || d.y < mostTop.y) mostTop = d;
      if (!mostBottom || d.y > mostBottom.y) mostBottom = d;
    });

    var unique = new Set([
      mostLeft?.id,
      mostRight?.id,
      mostTop?.id,
      mostBottom?.id,
    ]);

    return Array.from(unique).filter(function (id) { return id !== undefined && id !== null; });
  }

  function setView(ids, duration) {
    return canvasZoom.setView(ids, duration);
  }

  function onhashchange(config, utils, loadModule) {
    var hash = window.location.hash.slice(1);
    var params = new URLSearchParams(hash);

    canvasDebug.log('hash', "onhashchange", params.toString());

    if (params.has("ids") && !canvasState.isUserInteraction()) {
      var ids = params.get("ids").split(",");
      canvasDebug.log('hash', "set setView", ids);
      
      var searchTerm = tags.getSearchTerm ? tags.getSearchTerm() : "";
      var hasDelayedChanges = 
        (params.has("mode") && params.get("mode") !== canvasState.getMode().title) ||
        (params.has("filter") && params.get("filter") !== tags.getFilterWords().join(",")) ||
        (params.get("search") !== searchTerm);

      if (hasDelayedChanges) {
        canvasDebug.log('hash', "delayed setView due to mode/filter/search change");
        // temp fix to avoid sticky image
        canvasState.setZoomedToImage(false);
        canvasState.setLastZoomed(0);
        canvasDetail.showAllImages();
        loadModule.clearBigImages();
        
        setTimeout(function () {
          setView(ids);
        }, canvasConfig.hashDelay);
      } else {
        canvasDebug.log('hash', "setView immediately");
        setView(ids);
      }
    }

    if (!params.has("ids") && canvasState.getScale() > 1) {
      canvasDebug.log('hash', "reset zoom because no ids and scale > 1");
      canvasZoom.resetZoom();
    }

    if (hash === "") {
      canvasDebug.log('hash', "reset");
      canvasAnnotations.removeAllCustomGraphics();
      canvasZoom.resetZoom(function () {
        tags.reset();
        utils.setMode();
        search.reset();
      });
      return;
    }

    if (params.has("filter")) {
      var filter = params.get("filter").split(",");
      tags.setFilterWords(filter);
    } else {
      tags.setFilterWords([]);
    }

    if (params.has("search")) {
      var searchTerm = params.get("search");
      canvasDebug.log('hash', "search term from hash", searchTerm);
      if (tags.getSearchTerm() !== searchTerm) {
        tags.search(searchTerm);
        if (typeof search !== 'undefined' && search.setSearchTerm) {
          search.setSearchTerm(searchTerm);
        }
      }
    } else {
      if (tags.getSearchTerm && tags.getSearchTerm() !== "") {
        tags.search("");
        if (typeof search !== 'undefined' && search.reset) {
          search.reset();
        }
      }
    }

    if (params.has("mode")) {
      utils.setMode(params.get("mode"));
    } else {
      utils.setMode();
    }

    if (params.has("borders")) {
      setTimeout(function () {
        var borderIds = params.get("borders").split(",");
        canvasDebug.log('hash', "borders", borderIds);
        canvasAnnotations.updateImageBorders(borderIds, config);
      }, params.has("filter") || params.has("mode") ? 2000 : 0);
    } else {
      canvasAnnotations.removeAllBorders();
    }

    if (params.has("vector")) {
      var vectorVals = params.get("vector");
      canvasDebug.log('hash', "vector Hash", vectorVals);
      if (canvasAnnotations.getVectors().toString() !== vectorVals.toString()) {
        canvasAnnotations.setVectors(vectorVals);
        canvasAnnotations.drawVectors(config);
      }
    } else {
      canvasAnnotations.removeAllVectors();
    }

    canvasState.setUserInteraction(false);
  }

  return {
    getView: getView,
    setView: setView,
    onhashchange: onhashchange,
  };
}
