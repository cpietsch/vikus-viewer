// canvas-utils.js
// Common utility functions for D3 selections and DOM manipulation
// christopher pietsch
// cpietsch@gmail.com
// 2025

function CanvasUtils() {
  
  /**
   * Toggle CSS class on element(s)
   * @param {string} selector - D3 selector string
   * @param {string} className - Class name to toggle
   * @param {boolean} state - True to add class, false to remove
   * @returns {d3.selection} The D3 selection for chaining
   */
  function toggleClass(selector, className, state) {
    return d3.select(selector).classed(className, state);
  }

  /**
   * Toggle CSS class on multiple elements
   * @param {string} selector - D3 selector string (can match multiple elements)
   * @param {string} className - Class name to toggle
   * @param {boolean} state - True to add class, false to remove
   * @returns {d3.selection} The D3 selection for chaining
   */
  function toggleClassAll(selector, className, state) {
    return d3.selectAll(selector).classed(className, state);
  }

  /**
   * Hide/show element by adding/removing 'hide' class
   * @param {string} selector - D3 selector string
   * @param {boolean} hide - True to hide, false to show
   * @returns {d3.selection} The D3 selection for chaining
   */
  function setVisibility(selector, hide) {
    return d3.select(selector).classed("hide", hide);
  }

  /**
   * Hide/show multiple elements by adding/removing 'hide' class
   * @param {string} selector - D3 selector string
   * @param {boolean} hide - True to hide, false to show
   * @returns {d3.selection} The D3 selection for chaining
   */
  function setVisibilityAll(selector, hide) {
    return d3.selectAll(selector).classed("hide", hide);
  }

  /**
   * Set multiple CSS classes at once on an element
   * @param {string} selector - D3 selector string
   * @param {Object} classes - Object with class names as keys, boolean states as values
   * @returns {d3.selection} The D3 selection for chaining
   * @example
   * setClasses('.sidebar', { 'hide': false, 'sneak': true, 'active': true })
   */
  function setClasses(selector, classes) {
    var selection = d3.select(selector);
    Object.keys(classes).forEach(function(className) {
      selection.classed(className, classes[className]);
    });
    return selection;
  }

  /**
   * Set display style on element(s)
   * @param {string} selector - D3 selector string
   * @param {string} display - Display value ('none', 'block', 'flex', etc.)
   * @returns {d3.selection} The D3 selection for chaining
   */
  function setDisplay(selector, display) {
    return d3.select(selector).style("display", display);
  }

  /**
   * Set display style on multiple elements
   * @param {string} selector - D3 selector string
   * @param {string} display - Display value ('none', 'block', 'flex', etc.)
   * @returns {d3.selection} The D3 selection for chaining
   */
  function setDisplayAll(selector, display) {
    return d3.selectAll(selector).style("display", display);
  }

  /**
   * Toggle element visibility by changing display style
   * @param {string} selector - D3 selector string
   * @param {boolean} show - True to show, false to hide
   * @returns {d3.selection} The D3 selection for chaining
   */
  function toggleDisplay(selector, show) {
    return d3.select(selector).style("display", show ? null : "none");
  }

  /**
   * Check if element has a specific class
   * @param {string} selector - D3 selector string
   * @param {string} className - Class name to check
   * @returns {boolean} True if element has the class
   */
  function hasClass(selector, className) {
    return d3.select(selector).classed(className);
  }

  /**
   * Toggle a class on/off (invert current state)
   * @param {string} selector - D3 selector string
   * @param {string} className - Class name to toggle
   * @returns {boolean} New state after toggle
   */
  function flipClass(selector, className) {
    var currentState = hasClass(selector, className);
    var newState = !currentState;
    toggleClass(selector, className, newState);
    return newState;
  }

  /**
   * Set pointer-events CSS property
   * @param {string} selector - D3 selector string
   * @param {string} value - Pointer events value ('auto', 'none', etc.)
   * @returns {d3.selection} The D3 selection for chaining
   */
  function setPointerEvents(selector, value) {
    return d3.select(selector).style("pointer-events", value);
  }

  /**
   * Batch update multiple DOM elements with different operations
   * @param {Array<Object>} updates - Array of update operations
   * @example
   * batchUpdate([
   *   { selector: '.sidebar', classes: { hide: false, sneak: true } },
   *   { selector: '.infobar', display: 'none' },
   *   { selector: '.timeline', pointerEvents: 'auto' }
   * ])
   */
  function batchUpdate(updates) {
    updates.forEach(function(update) {
      if (update.classes) {
        setClasses(update.selector, update.classes);
      }
      if (update.display !== undefined) {
        setDisplay(update.selector, update.display);
      }
      if (update.pointerEvents !== undefined) {
        setPointerEvents(update.selector, update.pointerEvents);
      }
      if (update.visibility !== undefined) {
        setVisibility(update.selector, update.visibility);
      }
    });
  }

  return {
    toggleClass: toggleClass,
    toggleClassAll: toggleClassAll,
    setVisibility: setVisibility,
    setVisibilityAll: setVisibilityAll,
    setClasses: setClasses,
    setDisplay: setDisplay,
    setDisplayAll: setDisplayAll,
    toggleDisplay: toggleDisplay,
    hasClass: hasClass,
    flipClass: flipClass,
    setPointerEvents: setPointerEvents,
    batchUpdate: batchUpdate
  };
}
