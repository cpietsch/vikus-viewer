// canvas-detail.js
// Detail view and sidebar management for Canvas module

function CanvasDetail(canvasState, canvasData) {
  var detailContainer = d3.select(".sidebar");
  var detailVue = window.detailVue; // Global Vue instance
  var isInIframe = window.self !== window.top;
  var config = null;  // Will be set via setConfig()

  function showDetail(d, configParam) {
    var cfg = configParam || config;  // Use passed config or stored config
    detailContainer.select(".outer").node().scrollTop = 0;
    detailContainer.classed("hide", false).classed("sneak", utils.isMobile() || isInIframe);

    var detailData = {};
    
    cfg.detail.structure.forEach(function (field) {
      var val = d[field.source];
      if (val && val !== "") detailData[field.source] = val;
      else detailData[field.source] = "";
      if (field.fields && field.fields.length) {
        field.fields.forEach(function (subfield) {
          var val = d[subfield];
          if (val && val !== "") detailData[subfield] = val;
        });
      }
    });

    detailData["_id"] = d.id;
    detailData["_keywords"] = d.keywords || "None";
    detailData["_year"] = d.year;
    detailData["_imagenum"] = d.imagenum || 1;
    
    if (detailVue) {
      detailVue.id = d.id;
      detailVue.page = d.page;
      detailVue.item = detailData;
    }
  }

  function hideDetail() {
    detailContainer.classed("hide", true);
  }

  function hideTheRest(d) {
    var data = canvasData.getData();
    data.forEach(function (d2) {
      if (d2.id !== d.id) {
        d2.alpha = 0;
        d2.alpha2 = 0;
      }
    });
  }

  function showAllImages() {
    var data = canvasData.getData();
    data.forEach(function (d) {
      d.alpha = d.active ? 1 : 0.2;
      d.alpha2 = d.visible ? 1 : 0;
    });
  }

  function changePage(id, page, clearBigImages, loadBigImage) {
    console.log("changePage", id, page, canvasState.getSelectedImage());
    var selectedImage = canvasState.getSelectedImage();
    selectedImage.page = page;
    if (detailVue) {
      detailVue._data.page = page;
    }
    clearBigImages();
    loadBigImage(selectedImage);
  }

  function setConfig(cfg) {
    config = cfg;
  }

  return {
    showDetail: showDetail,
    hideDetail: hideDetail,
    hideTheRest: hideTheRest,
    showAllImages: showAllImages,
    changePage: changePage,
    setConfig: setConfig,
  };
}
