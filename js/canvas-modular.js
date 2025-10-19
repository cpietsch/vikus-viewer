// canvas-modular.js
// Main Canvas module - integrates all sub-modules
// christopher pietsch
// cpietsch@gmail.com
// 2015-2025

function Canvas() {
  // Initialize all sub-modules
  var canvasConfig = CanvasConfig();
  var canvasState = CanvasState();
  var canvasData = CanvasData();
  
  var config;
  var stages = {};
  
  // Module references (will be initialized in init())
  var pixiRenderer, canvasLayout, canvasInteraction, canvasZoom;
  var canvasDetail, canvasAnnotations, canvasHash, imageLoader;
  
  var vizContainer;

  function canvas() { }

  // Public API - maintain backwards compatibility
  canvas.margin = canvasConfig.margin;

  canvas.abs2relCoordinate = function (p) {
    return canvasAnnotations.abs2relCoordinate(p);
  };

  canvas.rel2absCoordinate = function (p) {
    return canvasAnnotations.rel2absCoordinate(p);
  };

  canvas.addVector = function (startNew) {
    if (startNew === undefined) startNew = false;
    canvasAnnotations.addVector(
      canvasInteraction.toScreenPoint,
      vizContainer,
      config,
      startNew
    );
  };

  canvas.parseVectors = function (v) {
    return canvasAnnotations.parseVectors(v);
  };

  canvas.drawVectors = function () {
    canvasAnnotations.drawVectors(config);
  };

  canvas.removeAllVectors = function () {
    canvasAnnotations.removeAllVectors();
  };

  canvas.removeAllCustomGraphics = function () {
    canvasAnnotations.removeAllCustomGraphics();
  };

  canvas.removeAllBorders = function () {
    canvasAnnotations.removeAllBorders();
  };

  canvas.getView = function () {
    return canvasHash.getView();
  };

  canvas.setView = function (ids, duration) {
    return canvasHash.setView(ids, duration);
  };

  canvas.rangeBand = function () {
    return canvasConfig.rangeBand;
  };

  canvas.width = function () {
    return canvasConfig.width;
  };

  canvas.height = function () {
    return canvasConfig.height;
  };

  canvas.rangeBandImage = function () {
    return canvasConfig.rangeBandImage;
  };

  canvas.zoom = null; // Will be set in init()

  canvas.selectedImage = function () {
    return canvasState.getSelectedImage();
  };

  canvas.x = null; // Will be set in init()
  canvas.y = null; // Will be set in init()

  canvas.resize = function () {
    if (!canvasState.isInit()) return;
    canvasConfig.updateDimensions();
    pixiRenderer.resize();
    canvasZoom.zoom.size([canvasConfig.width, canvasConfig.height]);
    canvasLayout.makeScales(window.timeline);
    canvas.project();
    canvas.resetZoom();
  };

  canvas.makeScales = function () {
    canvasLayout.makeScales(window.timeline);
    pixiRenderer.updateStageScales();
    canvasConfig.updateZoomedToImageScale(canvasState.getMode(), canvasLayout.getX());
  };

  canvas.initGroupLayout = function () {
    canvasLayout.initGroupLayout(config, window.timeline);
  };

  canvas.init = function (_data, _timeline, _config) {
    canvasData.setData(_data);
    config = _config;
    canvasData.setTimelineData(_timeline);

    if (window.detailVue) {
      window.detailVue._data.structure = config.detail.structure;
    }

    canvasConfig.updateColumns(config.projection.columns);
    canvasConfig.updateFromLoaderConfig(config.loader);

    // Initialize PIXI renderer
    pixiRenderer = CanvasPixiRenderer(
      canvasConfig,
      canvasState,
      canvasData,
      function() { 
        if (canvasAnnotations) canvasAnnotations.updateBorderPositions(); 
      }
    );
    
    stages = pixiRenderer.initRenderer(config);

    // Initialize other modules
    canvasAnnotations = CanvasAnnotations(
      canvasConfig,
      canvasState,
      canvasData,
      stages.stage3
    );
    canvasAnnotations.setConfig(config);  // Set config for annotations

    canvasDetail = CanvasDetail(canvasState, canvasData);
    canvasDetail.setConfig(config);  // Set config for detail view

    canvasLayout = CanvasLayout(canvasConfig, canvasState, canvasData);
    canvas.x = canvasLayout.getX();
    canvas.y = canvasLayout.getYScale();

    imageLoader = CanvasImageLoader(
      canvasConfig,
      canvasState,
      canvasData,
      stages.stage4,
      stages.stage5
    );
    imageLoader.setConfig(config);  // Set config for image loading

    canvasZoom = CanvasZoom(
      canvasConfig,
      canvasState,
      canvasData,
      window.timeline,
      pixiRenderer,
      imageLoader,
      canvasDetail
    );
    canvas.zoom = canvasZoom.zoom;

    canvasInteraction = CanvasInteraction(
      canvasConfig,
      canvasState,
      canvasData
    );

    canvasHash = CanvasHash(
      canvasConfig,
      canvasState,
      canvasData,
      canvasZoom,
      canvasDetail,
      canvasAnnotations,
      window.timeline,
      window.tags,
      window.search
    );

    // Wire canvasHash to canvasZoom for hash updates
    canvasZoom.setHashModule(canvasHash);

    canvasLayout.initGroupLayout(config, window.timeline);

    // Add preview sprites to stage
    var data = canvasData.getData();
    data.forEach(function (d, i) {
      var sprite = new PIXI.Sprite(PIXI.Texture.WHITE);

      sprite.anchor.x = 0.5;
      sprite.anchor.y = 0.5;

      sprite.scale.x = d.scaleFactor;
      sprite.scale.y = d.scaleFactor;

      sprite._data = d;
      d.sprite = sprite;

      stages.stage3.addChild(sprite);
    });

    // Setup interactions
    vizContainer = d3.select(".viz")
      .call(canvasZoom.zoom)
      .on("mousemove", function(d) {
        canvasInteraction.mousemove(
          vizContainer,
          canvasZoom.zoom,
          stages.container,
          d
        );
      })
      .on("dblclick.zoom", null)
      .on("dblclick", null);

    canvasInteraction.setupTouchEvents(vizContainer);
    canvasInteraction.setupClickEvent(
      vizContainer,
      canvas.addVector,
      canvas.addBorderToImage,
      canvas.resetZoom,
      canvas.zoomToImage
    );
    canvasInteraction.setupContextMenu(vizContainer);

    // Start animation loop
    pixiRenderer.animate(imageLoader.loadImages.bind(imageLoader));

    canvasState.setInit(true);
  };

  canvas.updateBorderPositions = function () {
    canvasAnnotations.updateBorderPositions();
  };

  canvas.removeBorder = function (id) {
    canvasAnnotations.removeBorder(id);
  };

  canvas.addBorder = function (d) {
    canvasAnnotations.addBorder(d, config);
  };

  canvas.addBorderToImage = function (d) {
    canvasAnnotations.addBorderToImage(d, config);
  };

  canvas.addTsneData = function (name, d, scale) {
    canvasData.addTsneData(name, d, scale);
  };

  canvas.onhashchange = function () {
    canvasHash.onhashchange(config, window.utils, imageLoader);
  };

  canvas.highlight = function () {
    canvasData.highlight();
    canvasState.wakeup();
  };

  canvas.setMode = function (layout) {
    canvasState.setMode(layout);

    if (layout.type == "group") {
      canvas.initGroupLayout();
      if (layout.columns) {
        canvasConfig.updateColumns(layout.columns);
      } else {
        canvasConfig.updateColumns(config.projection.columns);
      }
    }

    window.timeline.setDisabled(layout.type != "group" && !layout.timeline);
    canvas.makeScales();
    canvas.project();
    canvas.resetZoom();
  };

  canvas.getMode = function () {
    return canvasState.getMode();
  };

  canvas.project = function () {
    window.ping && ping();
    canvasState.setSleep(false);
    
    var mode = canvasState.getMode();
    var scaleFactor = mode.type == "group" ? 0.9 : canvasData.getTsneScale(mode.title) || 0.5;
    var data = canvasData.getData();
    
    data.forEach(function (d) {
      d.scaleFactor = scaleFactor;
      d.sprite.scale.x = d.scaleFactor;
      d.sprite.scale.y = d.scaleFactor;
      if (d.sprite2) {
        d.sprite2.scale.x = d.scaleFactor;
        d.sprite2.scale.y = d.scaleFactor;
      }
    });

    if (mode.type === "group") {
      canvas.split();
    } else {
      canvasLayout.projectTSNE();
    }
  };

  canvas.resetZoom = function (callback) {
    canvasZoom.resetZoom(callback);
  };

  canvas.split = function () {
    canvasLayout.split();
  };

  canvas.zoomToImage = function (d, duration) {
    canvasZoom.zoomToImage(d, duration, config);
  };

  canvas.showDetail = function (d) {
    canvasDetail.showDetail(d, config);
  };

  canvas.changePage = function (id, page) {
    canvasDetail.changePage(
      id,
      page,
      imageLoader.clearBigImages.bind(imageLoader),
      function(d) { imageLoader.loadBigImage(d, config); }
    );
  };

  canvas.distance = function (a, b) {
    return Math.sqrt(
      (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])
    );
  };

  canvas.wakeup = function () {
    canvasState.wakeup();
  };

  return canvas;
}
