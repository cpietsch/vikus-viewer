// canvas-data.js
// Data management and t-SNE indexing for Canvas module

function CanvasData() {
  var data = [];
  var timelineData = [];
  var allData = [];
  
  var timeDomain = [];
  var canvasDomain = [];
  
  var tsneIndex = {};
  var tsneScale = {};

  var quadtree = null;
  var Quadtree = d3.geom
    .quadtree()
    .x(function (d) {
      return d.x;
    })
    .y(function (d) {
      return d.y;
    });

  function setData(newData) {
    data = newData;
  }

  function getData() {
    return data;
  }

  function setTimelineData(newData) {
    timelineData = newData;
  }

  function getTimelineData() {
    return timelineData;
  }

  function setAllData(newData) {
    allData = newData;
  }

  function getAllData() {
    return allData;
  }

  function setTimeDomain(domain) {
    timeDomain = domain;
  }

  function getTimeDomain() {
    return timeDomain;
  }

  function setCanvasDomain(domain) {
    canvasDomain = domain;
  }

  function getCanvasDomain() {
    return canvasDomain;
  }

  function addTsneData(name, d, scale) {
    tsneIndex[name] = {};
    tsneScale[name] = scale;
    var clean = d.map(function (d) {
      return {
        id: d.id,
        x: parseFloat(d.x),
        y: parseFloat(d.y),
      };
    });
    var xExtent = d3.extent(clean, function (d) {
      return d.x;
    });
    var yExtent = d3.extent(clean, function (d) {
      return d.y;
    });

    var x = d3.scale.linear().range([0, 1]).domain(xExtent);
    var y = d3.scale.linear().range([0, 1]).domain(yExtent);

    d.forEach(function (d) {
      tsneIndex[name][d.id] = [x(d.x), y(d.y)];
    });
  }

  function getTsneIndex(name) {
    return tsneIndex[name];
  }

  function getTsneScale(name) {
    return tsneScale[name];
  }

  function updateQuadtree(data) {
    quadtree = Quadtree(data);
  }

  function getQuadtree() {
    return quadtree;
  }

  function highlight() {
    data.forEach(function (d, i) {
      d.alpha = d.highlight ? 1 : 0.2;
    });
  }

  return {
    // Data arrays
    setData: setData,
    getData: getData,
    setTimelineData: setTimelineData,
    getTimelineData: getTimelineData,
    setAllData: setAllData,
    getAllData: getAllData,
    
    // Domains
    setTimeDomain: setTimeDomain,
    getTimeDomain: getTimeDomain,
    setCanvasDomain: setCanvasDomain,
    getCanvasDomain: getCanvasDomain,
    
    // t-SNE
    addTsneData: addTsneData,
    getTsneIndex: getTsneIndex,
    getTsneScale: getTsneScale,
    
    // Quadtree
    updateQuadtree: updateQuadtree,
    getQuadtree: getQuadtree,
    
    // Operations
    highlight: highlight,
  };
}
