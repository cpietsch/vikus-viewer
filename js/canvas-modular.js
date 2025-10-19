// canvas-modular.js
// Main Canvas module - integrates all sub-modules
// christopher pietsch
// cpietsch@gmail.com
// 2015-2025

function Canvas() {
  // Initialize utility modules (no dependencies)
  var canvasUtils = CanvasUtils();
  var canvasDebug = CanvasDebug();
  var canvasPixiUtils = CanvasPixiUtils();
  
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

  /**
   * Convert absolute canvas coordinates to relative coordinates (0-1 range)
   * @param {Object} p - Point with x,y properties in absolute coordinates
   * @returns {Object} Point with x,y properties in relative coordinates
   */
  canvas.abs2relCoordinate = function (p) {
    return canvasAnnotations.abs2relCoordinate(p);
  };

  /**
   * Convert relative coordinates (0-1 range) to absolute canvas coordinates
   * @param {Object} p - Point with x,y properties in relative coordinates
   * @returns {Object} Point with x,y properties in absolute coordinates
   */
  canvas.rel2absCoordinate = function (p) {
    return canvasAnnotations.rel2absCoordinate(p);
  };

  /**
   * Add a vector annotation to the canvas
   * @param {boolean} [startNew=false] - Whether to start a new vector or continue existing one
   */
  canvas.addVector = function (startNew) {
    if (startNew === undefined) startNew = false;
    canvasAnnotations.addVector(
      canvasInteraction.toScreenPoint,
      vizContainer,
      config,
      startNew
    );
  };

  /**
   * Parse vector string representation into vector objects
   * @param {string} v - Vector string in format "x1,y1;x2,y2;..."
   * @returns {Array} Array of parsed vector objects
   */
  canvas.parseVectors = function (v) {
    return canvasAnnotations.parseVectors(v);
  };

  /**
   * Draw all vector annotations on the canvas
   */
  canvas.drawVectors = function () {
    canvasAnnotations.drawVectors(config);
  };

  /**
   * Remove all vector annotations from the canvas
   */
  canvas.removeAllVectors = function () {
    canvasAnnotations.removeAllVectors();
  };

  /**
   * Remove all custom graphics (vectors and other annotations) from the canvas
   */
  canvas.removeAllCustomGraphics = function () {
    canvasAnnotations.removeAllCustomGraphics();
  };

  /**
   * Remove all border annotations from the canvas
   */
  canvas.removeAllBorders = function () {
    canvasAnnotations.removeAllBorders();
  };

  /**
   * Get IDs of currently visible items in the viewport
   * @returns {Array<string>} Array of item IDs visible in current view
   */
  /**
   * Get IDs of currently visible items in the viewport
   * @returns {Array<string>} Array of item IDs visible in current view
   */
  canvas.getView = function () {
    return canvasHash.getView();
  };

  /**
   * Zoom and pan to show specific items
   * @param {Array<string>} ids - Array of item IDs to focus on
   * @param {number} [duration=1000] - Animation duration in milliseconds
   */
  canvas.setView = function (ids, duration) {
    return canvasHash.setView(ids, duration);
  };

  /**
   * Get the range band size for items in group layout
   * @returns {number} Range band size in pixels
   */
  canvas.rangeBand = function () {
    return canvasConfig.rangeBand;
  };

  /**
   * Get the canvas width
   * @returns {number} Canvas width in pixels
   */
  canvas.width = function () {
    return canvasConfig.width;
  };

  /**
   * Get the canvas height
   * @returns {number} Canvas height in pixels
   */
  canvas.height = function () {
    return canvasConfig.height;
  };

  /**
   * Get the image size for individual images
   * @returns {number} Image size in pixels
   */
  canvas.rangeBandImage = function () {
    return canvasConfig.rangeBandImage;
  };

  /**
   * D3 zoom behavior instance
   * @type {d3.behavior.zoom}
   */
  canvas.zoom = null; // Will be set in init()

  /**
   * Get the currently selected image
   * @returns {Object|null} Selected image data object or null
   */
  canvas.selectedImage = function () {
    return canvasState.getSelectedImage();
  };

  /**
   * D3 x-scale for positioning items
   * @type {d3.scale}
   */
  canvas.x = null; // Will be set in init()
  
  /**
   * D3 y-scale for positioning items
   * @type {d3.scale}
   */
  canvas.y = null; // Will be set in init()

  /**
   * Resize the canvas to match window dimensions
   * Recalculates scales and redraws all elements
   */
  canvas.resize = function () {
    if (!canvasState.isInit()) return;
    canvasConfig.updateDimensions();
    pixiRenderer.resize();
    canvasZoom.zoom.size([canvasConfig.width, canvasConfig.height]);
    canvasLayout.makeScales(window.timeline);
    canvas.project();
    canvas.resetZoom();
  };

  /**
   * Recalculate scales based on current layout mode
   * Updates x and y scales and image size for zoomed view
   */
  /**
   * Recalculate scales based on current layout mode
   * Updates x and y scales and image size for zoomed view
   */
  canvas.makeScales = function () {
    canvasLayout.makeScales(window.timeline);
    pixiRenderer.updateStageScales();
    canvasConfig.updateZoomedToImageScale(canvasState.getMode(), canvasLayout.getX());
  };

  /**
   * Initialize group layout (grid-based positioning by time)
   * Must be called before displaying items in group mode
   */
  canvas.initGroupLayout = function () {
    canvasLayout.initGroupLayout(config, window.timeline);
  };

  /**
   * Initialize the canvas with data and configuration
   * @param {Array<Object>} _data - Array of item data objects
   * @param {Object} _timeline - Timeline instance for temporal navigation
   * @param {Object} _config - Configuration object with loader, detail, and projection settings
   */
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
      var sprite = canvasPixiUtils.createSprite(PIXI.Texture.WHITE, {
        anchorX: 0.5,
        anchorY: 0.5,
        scale: d.scaleFactor
      });

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

  /**
   * Update positions of all border annotations
   * Call after layout changes or zooming
   */
  canvas.updateBorderPositions = function () {
    canvasAnnotations.updateBorderPositions();
  };

  /**
   * Remove a specific border annotation by ID
   * @param {string} id - ID of the border to remove
   */
  canvas.removeBorder = function (id) {
    canvasAnnotations.removeBorder(id);
  };

  /**
   * Add a border annotation around an item
   * @param {Object} d - Item data object to add border to
   */
  canvas.addBorder = function (d) {
    canvasAnnotations.addBorder(d, config);
  };

  /**
   * Add a border annotation to the currently selected image
   * @param {Object} d - Item data object to add border to
   */
  canvas.addBorderToImage = function (d) {
    canvasAnnotations.addBorderToImage(d, config);
  };

  /**
   * Add t-SNE projection data for a specific layout mode
   * @param {string} name - Name of the t-SNE layout
   * @param {Array<Object>} d - Array of items with x,y coordinates
   * @param {number} scale - Scale factor for the projection
   */
  canvas.addTsneData = function (name, d, scale) {
    canvasData.addTsneData(name, d, scale);
  };

  /**
   * Handle URL hash change events
   * Synchronizes view state with URL parameters
   */
  /**
   * Handle URL hash change events
   * Synchronizes view state with URL parameters
   */
  canvas.onhashchange = function () {
    canvasHash.onhashchange(config, window.utils, imageLoader);
  };

  /**
   * Highlight active/visible items and wake up animation loop
   */
  canvas.highlight = function () {
    canvasData.highlight();
    canvasState.wakeup();
  };

  /**
   * Change the layout mode (group, t-SNE, etc.)
   * @param {Object} layout - Layout configuration object with type and optional properties
   * @param {string} layout.type - Layout type ("group" or t-SNE name)
   * @param {number} [layout.columns] - Number of columns for group layout
   * @param {boolean} [layout.timeline] - Whether timeline is enabled
   */
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

  /**
   * Get the current layout mode
   * @returns {Object} Current layout configuration object
   */
  canvas.getMode = function () {
    return canvasState.getMode();
  };

  /**
   * Project/position all items according to current layout mode
   * Updates item positions and triggers re-render
   */
  canvas.project = function () {
    window.ping && ping();
    canvasState.setSleep(false);
    
    var mode = canvasState.getMode();
    var scaleFactor = mode.type == "group" ? 0.9 : canvasData.getTsneScale(mode.title) || 0.5;
    var data = canvasData.getData();
    
    data.forEach(function (d) {
      d.scaleFactor = scaleFactor;
      canvasPixiUtils.updateSpriteScale(d.sprite, d);
      if (d.sprite2) {
        canvasPixiUtils.updateSpriteScale(d.sprite2, d);
      }
    });

    if (mode.type === "group") {
      canvas.split();
    } else {
      canvasLayout.projectTSNE();
    }
  };

  /**
   * Reset zoom to overview (scale 1.0, centered)
   * @param {Function} [callback] - Optional callback function executed after zoom completes
   */
  canvas.resetZoom = function (callback) {
    canvasZoom.resetZoom(callback);
  };

  /**
   * Apply group layout positioning to all items
   * Arranges items in a grid based on time
   */
  canvas.split = function () {
    canvasLayout.split();
  };

  /**
   * Zoom to focus on a specific image
   * @param {Object} d - Item data object to zoom to
   * @param {number} [duration=1000] - Animation duration in milliseconds
   */
  canvas.zoomToImage = function (d, duration) {
    canvasZoom.zoomToImage(d, duration, config);
  };

  /**
   * Show detail sidebar for an item
   * @param {Object} d - Item data object to display details for
   */
  canvas.showDetail = function (d) {
    canvasDetail.showDetail(d, config);
  };

  /**
   * Change the current page/view of a multi-page item
   * @param {string} id - ID of the item
   * @param {number} page - Page number to display
   */
  canvas.changePage = function (id, page) {
    canvasDetail.changePage(
      id,
      page,
      imageLoader.clearBigImages.bind(imageLoader),
      function(d) { imageLoader.loadBigImage(d, config); }
    );
  };

  /**
   * Calculate Euclidean distance between two points
   * @param {Array<number>} a - First point [x, y]
   * @param {Array<number>} b - Second point [x, y]
   * @returns {number} Distance between the two points
   */
  canvas.distance = function (a, b) {
    return Math.sqrt(
      (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])
    );
  };

  /**
   * Wake up the animation loop
   * Forces a re-render by setting sleep state to false
   */
  canvas.wakeup = function () {
    canvasState.wakeup();
  };

  return canvas;
}
