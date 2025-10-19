// canvas-config.js
// Configuration and constants for Canvas module

function CanvasConfig() {
  var config = {
    // Margins
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },

    // Dimensions
    minHeight: 400,
    stagePadding: 40,
    bottomPadding: 40,

    // Image sizes (will be updated from loader config)
    imageSize: 256,
    imageSize2: 1024,
    imageSize3: 4000,

    // Layout
    columns: 4,

    // Zoom settings
    maxZoomLevel: utils.isMobile() ? 5000 : 2500,
    zoomBarrier: 2,
    zoomedToImageScale: 117,

    // Timing
    hashDelay: 800,
    debounceHashTime: 400,

    // Animation
    speed: 0.04,

    // Resolution
    resolution: window.devicePixelRatio || 1,
  };

  // Computed properties
  var computed = {
    width: window.innerWidth - config.margin.left - config.margin.right,
    widthOuter: window.innerWidth,
    height: window.innerHeight,
    rangeBand: 0,
    rangeBandImage: 0,
    imgPadding: 0,
    cursorCutoff: 1,

    // Scales for different texture resolutions
    scale1: 1,
    scale2: 1,
    scale3: 1,
  };

  function updateDimensions() {
    computed.width = window.innerWidth - config.margin.left - config.margin.right;
    computed.height = window.innerHeight;
    computed.widthOuter = window.innerWidth;
    console.log("dimensions", computed.width, computed.height);
    console.log("self.innerWidth", self.innerWidth, self.innerHeight);
  }

  function updateFromLoaderConfig(loaderConfig) {
    if (loaderConfig.textures) {
      if (loaderConfig.textures.medium) {
        config.imageSize = loaderConfig.textures.medium.size;
      }
      if (loaderConfig.textures.detail) {
        config.imageSize2 = loaderConfig.textures.detail.size;
      }
      if (loaderConfig.textures.big) {
        config.imageSize3 = loaderConfig.textures.big.size;
      }
    }
  }

  function updateColumns(columns) {
    config.columns = columns;
  }

  function updateScales(x) {
    computed.rangeBand = x.rangeBand();
    computed.rangeBandImage = computed.rangeBand / config.columns;
    computed.imgPadding = computed.rangeBand / config.columns / 2;

    computed.scale1 = config.imageSize / computed.rangeBandImage;
    computed.scale2 = config.imageSize2 / computed.rangeBandImage;
    computed.scale3 = config.imageSize3 / computed.rangeBandImage;

    computed.cursorCutoff = (1 / computed.scale1) * config.imageSize * 0.48;
  }

  function updateZoomedToImageScale(mode, x) {
    config.zoomedToImageScale =
      (0.8 / (x.rangeBand() / config.columns / computed.width)) *
      (mode.type === "group" ? 1 : 0.5);
  }

  return {
    // Base config
    config: config,
    computed: computed,

    // Methods
    updateDimensions: updateDimensions,
    updateFromLoaderConfig: updateFromLoaderConfig,
    updateColumns: updateColumns,
    updateScales: updateScales,
    updateZoomedToImageScale: updateZoomedToImageScale,

    // Getters
    get margin() { return config.margin; },
    get width() { return computed.width; },
    get height() { return computed.height; },
    get widthOuter() { return computed.widthOuter; },
    get rangeBand() { return computed.rangeBand; },
    get rangeBandImage() { return computed.rangeBandImage; },
    get imgPadding() { return computed.imgPadding; },
    get imageSize() { return config.imageSize; },
    get imageSize2() { return config.imageSize2; },
    get imageSize3() { return config.imageSize3; },
    get columns() { return config.columns; },
    get scale1() { return computed.scale1; },
    get scale2() { return computed.scale2; },
    get scale3() { return computed.scale3; },
    get maxZoomLevel() { return config.maxZoomLevel; },
    get zoomBarrier() { return config.zoomBarrier; },
    get zoomedToImageScale() { return config.zoomedToImageScale; },
    get cursorCutoff() { return computed.cursorCutoff; },
    get stagePadding() { return config.stagePadding; },
    get bottomPadding() { return config.bottomPadding; },
    get hashDelay() { return config.hashDelay; },
    get debounceHashTime() { return config.debounceHashTime; },
    get speed() { return config.speed; },
    get resolution() { return config.resolution; },
  };
}
