// canvas-state.js
// State management for Canvas module

function CanvasState() {
  var state = {
    lastZoomed: 0,
    zoomingToImage: false,
    init: false,
    mode: "time",
  };

  // Transform state
  var transform = {
    translate: [0, 0],
    scale: 1,
    startTranslate: [0, 0],
    startScale: 0,
  };

  // Selection state
  var selection = {
    selectedImage: null,
    selectedImageDistance: 0,
    zoomedToImage: false,
  };

  // Interaction state
  var interaction = {
    drag: false,
    sleep: false,
    zooming: false,
    touchstart: 0,
    spriteClick: false,
    timelineHover: false,
    userInteraction: false,
  };

  // View state
  var view = {
    extent: [0, 0],
    bottomZooming: false,
    zoomBarrierState: false,
  };

  // Hash state
  var hash = {
    debounceHash: null,
    lastSourceEvent: null,
  };

  return {
    // Main state
    state: state,
    transform: transform,
    selection: selection,
    interaction: interaction,
    view: view,
    hash: hash,

    // State getters/setters
    getMode: function() { return state.mode; },
    setMode: function(mode) { state.mode = mode; },
    
    getLastZoomed: function() { return state.lastZoomed; },
    setLastZoomed: function(id) { state.lastZoomed = id; },
    
    isZoomingToImage: function() { return state.zoomingToImage; },
    setZoomingToImage: function(val) { state.zoomingToImage = val; },
    
    isInit: function() { return state.init; },
    setInit: function(val) { state.init = val; },

    // Transform
    getTranslate: function() { return transform.translate; },
    setTranslate: function(t) { transform.translate = t; },
    
    getScale: function() { return transform.scale; },
    setScale: function(s) { transform.scale = s; },
    
    getStartTranslate: function() { return transform.startTranslate; },
    setStartTranslate: function(t) { transform.startTranslate = t; },
    
    getStartScale: function() { return transform.startScale; },
    setStartScale: function(s) { transform.startScale = s; },

    // Selection
    getSelectedImage: function() { return selection.selectedImage; },
    setSelectedImage: function(img) { selection.selectedImage = img; },
    
    getSelectedImageDistance: function() { return selection.selectedImageDistance; },
    setSelectedImageDistance: function(d) { selection.selectedImageDistance = d; },
    
    isZoomedToImage: function() { return selection.zoomedToImage; },
    setZoomedToImage: function(val) { selection.zoomedToImage = val; },

    // Interaction
    isDragging: function() { return interaction.drag; },
    setDrag: function(val) { interaction.drag = val; },
    
    isSleeping: function() { return interaction.sleep; },
    setSleep: function(val) { interaction.sleep = val; },
    wakeup: function() { interaction.sleep = false; },
    
    isZooming: function() { return interaction.zooming; },
    setZooming: function(val) { interaction.zooming = val; },
    
    getTouchstart: function() { return interaction.touchstart; },
    setTouchstart: function(val) { interaction.touchstart = val; },
    
    getSpriteClick: function() { return interaction.spriteClick; },
    setSpriteClick: function(val) { interaction.spriteClick = val; },
    
    isTimelineHover: function() { return interaction.timelineHover; },
    setTimelineHover: function(val) { interaction.timelineHover = val; },
    
    isUserInteraction: function() { return interaction.userInteraction; },
    setUserInteraction: function(val) { interaction.userInteraction = val; },

    // View
    getExtent: function() { return view.extent; },
    setExtent: function(e) { view.extent = e; },
    
    isBottomZooming: function() { return view.bottomZooming; },
    setBottomZooming: function(val) { view.bottomZooming = val; },
    
    getZoomBarrierState: function() { return view.zoomBarrierState; },
    setZoomBarrierState: function(val) { view.zoomBarrierState = val; },

    // Hash
    getDebounceHash: function() { return hash.debounceHash; },
    setDebounceHash: function(val) { hash.debounceHash = val; },
    
    getLastSourceEvent: function() { return hash.lastSourceEvent; },
    setLastSourceEvent: function(val) { hash.lastSourceEvent = val; },
  };
}
