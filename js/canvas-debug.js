// canvas-debug.js
// Debug and logging utility for Canvas module
// christopher pietsch
// cpietsch@gmail.com
// 2025

function CanvasDebug() {
  // Check URL parameters for debug mode
  var urlParams = new URLSearchParams(window.location.search);
  var DEBUG = urlParams.has('debug') || urlParams.get('debug') === 'true';
  
  // Debug categories for granular control
  var categories = {
    layout: DEBUG,
    zoom: DEBUG,
    image: DEBUG,
    hash: DEBUG,
    interaction: DEBUG,
    animation: DEBUG,
    all: DEBUG
  };

  /**
   * Enable/disable debug mode globally
   * @param {boolean} state - True to enable debug mode
   */
  function setDebug(state) {
    DEBUG = state;
    Object.keys(categories).forEach(function(key) {
      categories[key] = state;
    });
  }

  /**
   * Enable/disable debug for specific category
   * @param {string} category - Category name (layout, zoom, image, etc.)
   * @param {boolean} state - True to enable debug for this category
   */
  function setCategory(category, state) {
    if (categories.hasOwnProperty(category)) {
      categories[category] = state;
    }
  }

  /**
   * Log debug message (only in debug mode)
   * @param {string} category - Category of the log message
   * @param {...*} args - Arguments to log
   */
  function log(category) {
    if (DEBUG && categories[category]) {
      var args = Array.prototype.slice.call(arguments, 1);
      console.log('[' + category + ']', ...args);
    }
  }

  /**
   * Log info message (only in debug mode)
   * @param {string} category - Category of the log message
   * @param {...*} args - Arguments to log
   */
  function info(category) {
    if (DEBUG && categories[category]) {
      var args = Array.prototype.slice.call(arguments, 1);
      console.info('[' + category + ']', ...args);
    }
  }

  /**
   * Log warning message (always shown, even without debug mode)
   * @param {string} category - Category of the warning
   * @param {...*} args - Arguments to log
   */
  function warn(category) {
    var args = Array.prototype.slice.call(arguments, 1);
    console.warn('[' + category + ']', ...args);
  }

  /**
   * Log error message (always shown)
   * @param {string} category - Category of the error
   * @param {...*} args - Arguments to log
   */
  function error(category) {
    var args = Array.prototype.slice.call(arguments, 1);
    console.error('[' + category + ']', ...args);
  }

  /**
   * Time a function execution (only in debug mode)
   * @param {string} label - Label for the timer
   * @param {Function} fn - Function to time
   * @returns {*} Return value of the function
   */
  function time(label, fn) {
    if (DEBUG) {
      console.time(label);
      var result = fn();
      console.timeEnd(label);
      return result;
    }
    return fn();
  }

  /**
   * Start a performance timer
   * @param {string} label - Label for the timer
   */
  function timeStart(label) {
    if (DEBUG) {
      console.time(label);
    }
  }

  /**
   * End a performance timer
   * @param {string} label - Label for the timer
   */
  function timeEnd(label) {
    if (DEBUG) {
      console.timeEnd(label);
    }
  }

  /**
   * Group console messages
   * @param {string} label - Label for the group
   */
  function group(label) {
    if (DEBUG) {
      console.group(label);
    }
  }

  /**
   * End a console group
   */
  function groupEnd() {
    if (DEBUG) {
      console.groupEnd();
    }
  }

  /**
   * Log object properties in table format (only in debug mode)
   * @param {Object|Array} data - Data to display in table
   * @param {Array<string>} [columns] - Optional column names to display
   */
  function table(data, columns) {
    if (DEBUG && console.table) {
      console.table(data, columns);
    }
  }

  /**
   * Assert a condition (always checked, even without debug mode)
   * @param {boolean} condition - Condition to assert
   * @param {string} message - Error message if assertion fails
   */
  function assert(condition, message) {
    if (!condition) {
      console.error('Assertion failed:', message);
      throw new Error('Assertion failed: ' + message);
    }
  }

  /**
   * Check if debug mode is enabled
   * @returns {boolean} True if debug mode is enabled
   */
  function isDebug() {
    return DEBUG;
  }

  /**
   * Check if a specific category is enabled
   * @param {string} category - Category name
   * @returns {boolean} True if category is enabled
   */
  function isCategoryEnabled(category) {
    return DEBUG && categories[category];
  }

  /**
   * Log the current state of an object (deep inspection)
   * @param {string} label - Label for the state dump
   * @param {Object} obj - Object to inspect
   */
  function dumpState(label, obj) {
    if (DEBUG) {
      console.group(label);
      console.dir(obj);
      console.groupEnd();
    }
  }

  /**
   * Create a logger function bound to a specific category
   * @param {string} category - Category name
   * @returns {Function} Logger function for this category
   */
  function createLogger(category) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      log.apply(null, [category].concat(args));
    };
  }

  // Log initial debug state
  if (DEBUG) {
    console.log('%c[CanvasDebug] Debug mode enabled', 'color: #4CAF50; font-weight: bold');
    console.log('Available categories:', Object.keys(categories).filter(function(k) { return k !== 'all'; }));
    console.log('Use CanvasDebug.setCategory(name, true/false) to toggle categories');
  }

  return {
    log: log,
    info: info,
    warn: warn,
    error: error,
    time: time,
    timeStart: timeStart,
    timeEnd: timeEnd,
    group: group,
    groupEnd: groupEnd,
    table: table,
    assert: assert,
    setDebug: setDebug,
    setCategory: setCategory,
    isDebug: isDebug,
    isCategoryEnabled: isCategoryEnabled,
    dumpState: dumpState,
    createLogger: createLogger
  };
}
