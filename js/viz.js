// VIKUS Viewer Main Visualization
// Author: Christopher Pietsch
// Email: cpietsch@gmail.com
// 2015-2018

class VikusViewer {
  constructor() {
    this.data = null;
    this.tags = null;
    this.canvas = null;
    this.search = null;
    this.ping = null;
    this.timeline = null;
  }

  initialize() {
    if (!this.checkBrowserCompatibility()) {
      return;
    }

    utils.displayWelcomeMessage();
    this.initializeComponents();
    this.loadConfiguration();
  }

  checkBrowserCompatibility() {
    return Modernizr.webgl && !utils.isMobile();
  }

  initializeComponents() {
    this.canvas = Canvas();
    this.search = Search();
    this.timeline = Timeline();
    this.ping = utils.createExhibitionPing();
  }

  loadConfiguration() {
    const baseUrl = utils.getDataBaseUrl();
    const configUrl = baseUrl.config || "data/config.json";

    d3.json(configUrl, config => {
      config.baseUrl = baseUrl;
      this.initializeVisualization(config);
    });
  }

  initializeVisualization(config) {
    utils.initializeConfig(config);
    this.loadTimelineData(config)
      .then(timelineData => this.loadItemData(config, timelineData))
      .then(() => this.loadTextures(config));
  }

  loadTimelineData(config) {
    return new Promise(resolve => {
      const timelineUrl = utils.makeUrl(config.baseUrl.path, config.loader.timeline);
      new ResourceLoader(timelineUrl).setCompletionCallback(resolve);
    });
  }

  loadItemData(config, timelineData) {
    return new Promise(resolve => {
      const itemsUrl = utils.makeUrl(config.baseUrl.path, config.loader.items);
      new ResourceLoader(itemsUrl)
        .setCompletionCallback(data => {
          this.initializeDataAndComponents(data, timelineData, config);
          resolve();
        });
    });
  }

  initializeDataAndComponents(data, timelineData, config) {
    console.log("Loaded item data:", data);
    utils.cleanData(data, config.delimiter);
    
    this.initializeTags(data, config);
    this.search.initialize();
    this.canvas.init(data, timelineData, config);

    if (config.loader.layouts) {
      this.initializeLayouts(config);
    } else {
      this.setDefaultMode();
    }
  }

  initializeTags(data, config) {
    this.tags = config.filter && config.filter.type === "crossfilter" 
      ? Crossfilter()
      : Tags();
    this.tags.init(data, config);
  }

  setDefaultMode() {
    this.canvas.setMode({
      title: "Time",
      type: "group",
      groupKey: "year"
    });
  }

  loadTextures(config) {
    const textureUrl = utils.makeUrl(
      config.baseUrl.path, 
      config.loader.textures.medium.url
    );

    new SpriteLoader()
      .setProgressCallback(textures => this.updateTextures(textures))
      .loadSprites(textureUrl);
  }

  updateTextures(textures) {
    // Create a lookup map for faster access
    const dataMap = new Map(
      this.data
        .filter(d => d.sprite)
        .map(d => [d.id, d])
    );
    
    Object.keys(textures).forEach(id => {
      const item = dataMap.get(id);
      if (item) {
        item.sprite.texture = textures[id];
      }
    });

    this.canvas.wakeup();
  }

  initializeLayouts(config) {
    const { path } = config.baseUrl;
    d3.select(".navi").classed("hide", false);

    config.loader.layouts.forEach((layout, index) => {
      this.processLayout(layout, index, path);
    });

    this.setupLayoutNavigation(config);
  }

  processLayout(layout, index, basePath) {
    // Handle legacy time scales
    if (!layout.type && !layout.url) {
      layout.type = "group";
      layout.groupKey = "year";
    }

    if (layout.type === "group" && index === 0) {
      this.canvas.setMode(layout);
    } else if (layout.url) {
      this.loadLayoutData(layout, basePath);
    }
  }

  loadLayoutData(layout, basePath) {
    d3.csv(utils.makeUrl(basePath, layout.url), tsneData => {
      this.canvas.addTsneData(layout.title, tsneData, layout.scale);
      if (index === 0) {
        this.canvas.setMode(layout);
      }
    });
  }

  setupLayoutNavigation(config) {
    if (config.loader.layouts.length === 1) {
      d3.select(".navi").classed("hide", true);
      return;
    }

    const navigationButtons = d3.select(".navi")
      .selectAll(".button")
      .data(config.loader.layouts);

    navigationButtons.enter()
      .append("div")
      .classed("button", true)
      .classed("space", d => d.space)
      .text(d => d.title);

    navigationButtons.on("click", d => {
      this.canvas.setMode(d);
      this.updateActiveButton();
    });

    this.updateActiveButton();
  }

  updateActiveButton() {
    d3.selectAll(".navi .button").classed(
      "active",
      d => d.title === this.canvas.getMode().title
    );
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Window resize handler
  d3.select(window).on("resize", () => {
    if (canvas && tags) {
      clearTimeout(window.resizedFinished);
      window.resizedFinished = setTimeout(() => {
        canvas.resize();
        tags.resize();
      }, 250);
    }
  });

  // Keyboard handler
  d3.select(window).on("keydown", () => {
    if (d3.event.keyCode !== 27) return; // ESC key
    search.reset();
    tags.reset();
    canvas.split();
  });

  // Filter reset button handlers
  d3.select(".filterReset")
    .on("click", () => {
      canvas.resetZoom(() => {
        tags.reset();
      });
    })
    .on("dblclick", () => {
      console.log("Reloading page...");
      location.reload();
    });

  // Sidebar toggle handlers
  d3.select(".slidebutton").on("click", () => {
    const sidebar = d3.select(".sidebar");
    sidebar.classed("sneak", !sidebar.classed("sneak"));
  });

  d3.select(".infobutton").on("click", () => {
    const infobar = d3.select(".infobar");
    infobar.classed("sneak", !infobar.classed("sneak"));
  });
}

// Initialize the visualization
function init() {
  const viewer = new VikusViewer();
  viewer.initialize();
  initializeEventListeners();
}

// Show browser compatibility message if needed
d3.select(".browserInfo").classed("show", utils.isMobile());

// Start the application if browser is compatible
if (Modernizr.webgl && !utils.isMobile()) {
  init();
}
