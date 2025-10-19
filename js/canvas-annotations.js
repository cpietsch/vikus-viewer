// canvas-annotations.js
// Vector annotations and image borders for Canvas module

function CanvasAnnotations(canvasConfig, canvasState, canvasData, stage3) {
  var annotationVectors = "";
  var annotationVectorGraphics = undefined;
  var imageBorders = {};
  var config = null;  // Will be set via setConfig()

  function abs2relCoordinate(p) {
    return [
      (p[0] / canvasConfig.widthOuter) * 100,
      ((-1 * p[1]) / canvasConfig.widthOuter) * 100,
    ].map(function (d) {
      return Math.round(d * 100) / 100;
    });
  }

  function rel2absCoordinate(p) {
    return [
      p[0] / 100 * canvasConfig.widthOuter,
      (-1 * p[1] / 100) * canvasConfig.widthOuter,
    ];
  }

  function parseVectors(v) {
    if (v == undefined) return;
    if (v == "") return;

    // example: "w1,0-0,1-1,2-2,w2,3-3,4-4"
    // w1 means new vector with weight 1 
    // 0-0,1-1,2-2 means vector points
    // w2 means new vector with weight 2
    // 3-3,4-4 means vector points

    var parts = v.split(",");
    var vectors = [];
    var currentVector = [];
    var currentWeight = 1;
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim();
      if (part.startsWith("w")) {
        // new vector with weight

        if (currentVector.length > 0) {
          vectors.push({
            vector: currentVector,
            weight: currentWeight,
          });
        }
        currentWeight = parseFloat(part.replaceAll("w", ""));

        currentVector = [];
      } else {
        // vector point
        var coords = part.split("-").map(function (d) {
          return parseFloat(d);
        });
        if (coords.length == 2) {
          var decodeAnnotationCoordinates = rel2absCoordinate(coords);
          currentVector.push(decodeAnnotationCoordinates);
        } else {
          console.log("invalid vector point", part);
        }
      }
    }
    if (currentVector.length > 0) {
      vectors.push({
        vector: currentVector,
        weight: currentWeight,
      });
    }
    return vectors;
  }

  function addVector(toScreenPoint, vizContainer, config, startNew) {
    if (startNew === undefined) startNew = false;
    
    var mouse = d3.mouse(vizContainer.node());
    var p = toScreenPoint(mouse);
    var relative = abs2relCoordinate(p);

    console.log("add vector", relative, p);

    if (startNew || annotationVectors.length == 0) {
      annotationVectors += (annotationVectors.length ? "," : "") + "w1";
    }

    annotationVectors += "," + relative[0] + "-" + relative[1];
    console.log("vectors", annotationVectors);

    utils.updateHash("vector", annotationVectors);
    drawVectors(config);
  }

  function drawVectors(configParam) {
    var cfg = configParam || config;  // Use passed config or stored config
    if (annotationVectorGraphics) {
      stage3.removeChild(annotationVectorGraphics);
      annotationVectorGraphics.destroy(true);
      annotationVectorGraphics = undefined;
    }

    if (annotationVectors.length == 0) return;

    var parsedVectors = parseVectors(annotationVectors);
    console.log("parsedVectors", parsedVectors);
    
    annotationVectorGraphics = new PIXI.Graphics();

    for (var i = 0; i < parsedVectors.length; i++) {
      var vector = parsedVectors[i].vector;
      var weight = parsedVectors[i].weight;
      
      var lineColorHash = cfg.style?.annotationLineColor || "#00ff00";
      var color = parseInt(lineColorHash.substring(1), 16);
      annotationVectorGraphics.lineStyle(weight, color, 1);
      
      // draw lines between points
      for (var j = 0; j < vector.length - 1; j++) {
        var start = vector[j];
        var end = vector[j + 1];
        annotationVectorGraphics.moveTo(start[0], start[1]);
        annotationVectorGraphics.lineTo(end[0], end[1]);
      }
      annotationVectorGraphics.endFill();
      annotationVectorGraphics.position.x = 0;
      annotationVectorGraphics.position.y = 0;
      annotationVectorGraphics.scale.x = canvasConfig.scale1;
      annotationVectorGraphics.scale.y = canvasConfig.scale1;
      annotationVectorGraphics.interactive = false;
      annotationVectorGraphics.buttonMode = false;
      annotationVectorGraphics.visible = true;
      annotationVectorGraphics.zIndex = 1000;
    }

    stage3.addChild(annotationVectorGraphics);

    canvasState.setSleep(false);
  }

  function removeAllVectors() {
    if (annotationVectorGraphics) {
      stage3.removeChild(annotationVectorGraphics);
      annotationVectorGraphics.destroy(true);
      annotationVectorGraphics = undefined;
    }
    annotationVectors = "";
    canvasState.setSleep(false);
  }

  function setVectors(vectorString) {
    annotationVectors = vectorString;
  }

  function getVectors() {
    return annotationVectors;
  }

  // Border functions
  function addBorder(d, configParam) {
    var cfg = configParam || config;  // Use passed config or stored config
    canvasState.setSleep(false);
    var sprite = d.sprite;
    var graphics = new PIXI.Graphics();
    var borderColorHash = cfg.style?.annotationBorderColor || "#ff0000";
    var borderColor = parseInt(borderColorHash.substring(1), 16);
    graphics.lineStyle(5, borderColor, 1);
    graphics.drawRect(
      0, 0,
      sprite.width,
      sprite.height
    );
    graphics.position.x = sprite.position.x - sprite.width / 2;
    graphics.position.y = sprite.position.y - sprite.height / 2;
    graphics.source = d;
    stage3.addChild(graphics);
    imageBorders[d.id] = graphics;
    console.log("added border", graphics);
  }

  function removeBorder(id) {
    if (imageBorders.hasOwnProperty(id)) {
      stage3.removeChild(imageBorders[id]);
      delete imageBorders[id];
      canvasState.setSleep(false);
    }
  }

  function removeAllBorders() {
    d3.values(imageBorders).forEach(function (d) {
      stage3.removeChild(d);
    });
    imageBorders = {};
    canvasState.setSleep(false);
  }

  function addBorderToImage(d, configParam) {
    var cfg = configParam || config;  // Use passed config or stored config
    canvasState.setSleep(false);
    if (imageBorders.hasOwnProperty(d.id)) {
      stage3.removeChild(imageBorders[d.id]);
      delete imageBorders[d.id];
      updateHashBorders();
      return;
    }
    addBorder(d, cfg);
    updateHashBorders();
  }

  function updateImageBorders(borderIds, configParam) {
    var cfg = configParam || config;  // Use passed config or stored config
    var data = canvasData.getData();
    var enter = borderIds.filter(function (d) { return !imageBorders.hasOwnProperty(d); });
    var exit = Object.keys(imageBorders).filter(function (d) { return !borderIds.includes(d); });

    enter.forEach(function (id) {
      var d = data.find(function (d) { return d.id == id; });
      if (d) addBorderToImage(d, cfg);
    });

    exit.forEach(function (id) {
      removeBorder(id);
    });
  }

  function updateHashBorders() {
    if (!d3.event) return;
    var borders = Object.keys(imageBorders);
    utils.updateHash("borders", borders);
  }

  function updateBorderPositions() {
    var graphics = d3.values(imageBorders);
    if (graphics.length == 0) return;
    graphics.forEach(function (graphic) {
      var d = graphic.source;
      graphic.position.x = d.sprite.position.x - d.sprite.width / 2;
      graphic.position.y = d.sprite.position.y - d.sprite.height / 2;
    });
  }

  function removeAllCustomGraphics() {
    removeAllVectors();
    removeAllBorders();
  }

  function setConfig(cfg) {
    config = cfg;
  }

  return {
    // Vector methods
    abs2relCoordinate: abs2relCoordinate,
    rel2absCoordinate: rel2absCoordinate,
    parseVectors: parseVectors,
    addVector: addVector,
    drawVectors: drawVectors,
    removeAllVectors: removeAllVectors,
    setVectors: setVectors,
    getVectors: getVectors,
    
    // Border methods
    addBorder: addBorder,
    removeBorder: removeBorder,
    removeAllBorders: removeAllBorders,
    addBorderToImage: addBorderToImage,
    updateImageBorders: updateImageBorders,
    updateBorderPositions: updateBorderPositions,
    
    // Combined
    removeAllCustomGraphics: removeAllCustomGraphics,
    
    // Config
    setConfig: setConfig,
  };
}
