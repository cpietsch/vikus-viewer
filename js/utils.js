// VIKUS Viewer Utilities
// Author: Christopher Pietsch
// Email: cpietsch@gmail.com
// 2015-2018

class ViewerUtils {
  static getDataBaseUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const configPath = urlParams.get('config');
    let basePath = "";

    if (configPath) {
      const pathSegments = configPath.split("/");
      pathSegments.pop();
      basePath = pathSegments.join("/") + "/";
      console.log("Base URL path:", basePath);
    }

    return { 
      path: basePath, 
      config: configPath 
    };
  }

  static makeUrl(basePath, resourceUrl) {
    if (resourceUrl && resourceUrl.startsWith("http")) {
      return resourceUrl;
    }
    return basePath + resourceUrl;
  }

  static isMobile() {
    const viewportWidth = window.innerWidth || 
                         document.documentElement.clientWidth || 
                         document.body.clientWidth;
    return viewportWidth < 500;
  }

  static isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  static displayWelcomeMessage() {
    if (window.console) {
      console.log(`
 _   ________ ____  ______ 
| | / /  _/ //_/ / / / __/ 
| |/ // // ,< / /_/ /\\ \\ 
|___/___/_/|_|\\____/___/_______ 
| | / /  _/ __/ | /| / / __/ _ \\ 
| |/ // // _/ | |/ |/ / _// , _/ 
|___/___/___/ |__/|__/___/_/|_| 
      `);
    }
  }

  static initializeConfig(config) {
    // Load info sidebar content
    this.loadInfoContent(config);
    
    // Set window title
    document.title = config.project.name;

    // Handle search functionality visibility
    this.configureSearchVisibility(config);

    // Apply style configurations
    this.applyStyleConfigurations(config);
  }

  static loadInfoContent(config) {
    d3.text(this.makeUrl(config.baseUrl.path, config.loader.info), (error, text) => {
      if (text) infoVue.info = text;
    });
  }

  static configureSearchVisibility(config) {
    if (config.searchEnabled !== undefined && !config.searchEnabled) {
      document.querySelector('.searchbar').style.display = 'none';
    }
  }

  static applyStyleConfigurations(config) {
    const styleSheet = document.styleSheets[0];
    const rules = [
      { selector: '.close::before', style: `background-color: ${config.style.fontColorActive}` },
      { selector: '.close::after', style: `background-color: ${config.style.fontColorActive}` },
      { selector: '.tag.active', style: `color: ${config.style.fontColorActive}` },
      { selector: '.tag.active', style: `background: ${config.style.fontBackground}` },
      { selector: '.crossfilter .keys .item.active', style: `color: ${config.style.fontColorActive}` },
      { selector: '.crossfilter .keys .item.active', style: `background: ${config.style.fontBackground}` },
      { selector: '.crossfilter .keys .item:hover', style: `color: ${config.style.fontColorActive}` },
      { selector: '.crossfilter .keys .item:hover', style: `background: ${config.style.fontBackground}` },
      { selector: '.crossfilter .keys .item', style: `background: ${config.style.textShadow}` },
      { selector: '.timeline .entry', style: `background: ${config.style.timelineBackground}` },
      { selector: '.timeline .entry', style: `color: ${config.style.timelineFontColor}` },
      { selector: '.timeline .year', style: `color: ${config.style.fontColor}` },
      { selector: '.tagcloud .tag', style: `text-shadow: ${config.style.textShadow}` },
      { selector: '.infobar .outer', style: `background: ${config.style.infoBackground}` },
      { selector: '.infobar .outer', style: `color: ${config.style.infoFontColor}` },
      { selector: '.infobar a', style: `color: ${config.style.infoFontColor}` },
      { selector: '.infobar .infobutton path', style: `stroke: ${config.style.infoFontColor}` },
      { selector: '.infobar.sneak .infobutton path', style: `stroke: ${config.style.fontColor}` },
      { selector: '.sidebar .outer', style: `background: ${config.style.detailBackground}` },
      { selector: '.searchbar input', style: `background: ${config.style.searchbarBackground}` }
    ];

    rules.forEach(rule => {
      styleSheet.insertRule(`${rule.selector} { ${rule.style} }`, styleSheet.cssRules.length);
    });
  }

  static createExhibitionPing(timeoutMinutes = 2) {
    let lastPingTime = +new Date();
    const timeoutMs = timeoutMinutes * 60 * 1000;

    const interval = setInterval(() => {
      if (new Date() - lastPingTime > timeoutMs) {
        // Timeout reached, could trigger reload here
        // location.reload();
      }
    }, 1000);

    return () => {
      lastPingTime = +new Date();
    };
  }

  static printKeywords(data) {
    const uniqueKeywords = {};
    data.forEach(item => {
      item.keywords.forEach(keyword => {
        uniqueKeywords[keyword] = true;
      });
    });

    Object.keys(uniqueKeywords).forEach(keyword => {
      console.log(keyword);
    });
  }

  static requestFullscreen(element) {
    const fullscreenEnabled = document.fullscreenEnabled || 
                             document.mozFullScreenEnabled || 
                             document.documentElement.webkitRequestFullScreen;

    if (!fullscreenEnabled) return;

    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullScreen) {
      element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  }

  static cleanData(data, separator = ",") {
    data.forEach((item, index) => {
      // Create searchable text
      item.search = Object.values(item).join(' - ').toUpperCase();
      item.index = index;

      // Process keywords
      item.keywords = _.chain(item.keywords || "None")
        .split(separator)
        .map(_.trim)
        .uniq()
        .filter(keyword => keyword !== "")
        .map(keyword => keyword.charAt(0).toUpperCase() + keyword.slice(1))
        .value();

      // Set internal properties
      item._year = item.year;
      item._keywords = item.keywords;

      // Initialize visualization properties
      Object.assign(item, {
        alpha: 1,
        active: 1,
        loaded: false,
        type: "image",
        page: 0,
        scaleFactor: 0.9,
        x: index,
        y: index,
        order: index
      });
    });
  }

  static simulateLargeDataset(data) {
    // Clone data multiple times for testing
    Array.prototype.push.apply(data, _.clone(data, true));
    Array.prototype.push.apply(data, _.clone(data, true));
    Array.prototype.push.apply(data, _.clone(data, true).slice(0, 1036));
  }
}

// Export utilities globally
window.utils = ViewerUtils;
