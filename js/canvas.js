// VIKUS Viewer Canvas Component
// Author: Christopher Pietsch
// Email: cpietsch@gmail.com
// 2015-2018

function Canvas() {
  // Configuration constants
  const VIEWPORT_MARGINS = {
    top: 20,
    right: 50,
    bottom: 50,
    left: 50
  };
  const MIN_VIEWPORT_HEIGHT = 400;
  const DEVICE_PIXEL_RATIO = 1;
  const ZOOM_ANIMATION_DURATION = 1400;
  const IMAGE_FADE_SPEED = 0.03;
  const ALPHA_FADE_SPEED = 0.2;
  const ZOOM_BARRIER = 2;
  const CURSOR_INTERACTION_THRESHOLD = 15;
  const MOBILE_MAX_ZOOM = 5000;
  const DESKTOP_MAX_ZOOM = 2500;

  // Viewport dimensions
  let viewportWidth = window.innerWidth - VIEWPORT_MARGINS.left - VIEWPORT_MARGINS.right;
  let viewportHeight = window.innerHeight < MIN_VIEWPORT_HEIGHT ? MIN_VIEWPORT_HEIGHT : window.innerHeight;
  let outerWidth = window.innerWidth;

  // Image properties
  let previewImageSize = 256;
  let detailImageSize = 1024;
  let largeImageSize = 4000;
  let gridColumns = 4;
  let imagePadding;

  // Scales and transforms
  let previewScale = 1;
  let detailScale = 1;
  let largeScale = 1;
  let currentTranslate = [0, 0];
  let currentScale = 1;
  let zoomedToImageScale = 0;

  // State management
  let applicationState = {
    lastZoomed: 0,
    zoomingToImage: false,
    initialized: false,
    mode: "time",
  };

  let isZoomedToImage = false;
  let isDragging = false;
  let isZooming = false;
  let isSleeping = false;
  let timelineIsHovered = false;
  let spriteWasClicked = false;

  // Data storage
  let allImageData = [];
  let imageLoadQueue = [];
  let timeDomainData = [];
  let canvasDomainData = [];
  let tsneDataIndex = {};
  let tsneScaleFactors = {};

  // PIXI.js components
  let renderer, mainStage, contentStage;
  let previewStage, detailStage, largeStage;
  let selectedImage = null;
  let selectedImageDistance = 0;
  let config;

  // D3 components
  let xScale = d3.scale.ordinal().rangeBands([VIEWPORT_MARGINS.left, viewportWidth + VIEWPORT_MARGINS.left], 0.2);
  let yScale = d3.scale.linear();
  let quadtree = d3.geom.quadtree()
    .x(item => item.x)
    .y(item => item.y);

  // Zoom behavior
  let maxZoomLevel = utils.isMobile() ? MOBILE_MAX_ZOOM : DESKTOP_MAX_ZOOM;
  let zoomBehavior = d3.behavior.zoom()
    .scaleExtent([1, maxZoomLevel])
    .size([viewportWidth, viewportHeight])
    .on("zoom", handleZoom)
    .on("zoomend", handleZoomEnd)
    .on("zoomstart", handleZoomStart);

  function initializeCanvas() {
    // Implementation of canvas initialization
  }

  function handleImageInteraction(event) {
    if (timelineIsHovered) return;

    const mousePosition = d3.mouse(vizContainer.node());
    const screenPoint = convertToScreenPoint(mousePosition);
    const nearestImage = findNearestImage(
      screenPoint[0] - imagePadding,
      screenPoint[1] - imagePadding,
      { distance: 200, image: null },
      quadtree
    );

    selectedImageDistance = nearestImage && nearestImage.distance || 1000;

    if (nearestImage && nearestImage.image && !isZoomedToImage) {
      updateSelectedImage(nearestImage.image);
    }

    updateCursorStyle();
  }

  function updateSelectedImage(image) {
    const center = calculateImageCenter(image);
    zoomBehavior.center(center);
    selectedImage = image;
  }

  function calculateImageCenter(image) {
    return [
      (image.x + imagePadding) * currentScale + currentTranslate[0],
      (viewportHeight + image.y + imagePadding) * currentScale + currentTranslate[1]
    ];
  }

  function updateCursorStyle() {
    vizContainer.style("cursor", 
      selectedImageDistance < cursorCutoff && selectedImage.active
        ? "pointer" 
        : "default"
    );
  }

  // ... Rest of the refactored functions ...

  // Public API
  return {
    init: initializeCanvas,
    resize: handleResize,
    highlight: highlightImages,
    project: projectImages,
    wakeup: () => { isSleeping = false },
    setMode: setDisplayMode,
    getMode: () => applicationState.mode,
    zoomToImage: zoomToSpecificImage,
    showDetail: showImageDetail,
    changePage: changeImagePage,
    resetZoom: resetZoomLevel,
    margin: VIEWPORT_MARGINS,
    width: () => viewportWidth,
    height: () => viewportHeight,
    rangeBand: () => rangeBand,
    rangeBandImage: () => rangeBandImage,
    zoom: zoomBehavior,
    selectedImage: () => selectedImage,
    x: xScale,
    y: yScale
  };
}
