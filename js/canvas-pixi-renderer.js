// canvas-pixi-renderer.js
// PIXI.js rendering setup and animation loop for Canvas module

function CanvasPixiRenderer(canvasConfig, canvasState, canvasData, updateBorderPositions) {
  var renderer = null;
  var stage = null;
  var stage2 = null;
  var stage3 = null;
  var stage4 = null;
  var stage5 = null;
  var container = null;

  function initRenderer(config) {
    container = d3.select(".page").append("div").classed("viz", true);

    var renderOptions = {
      resolution: canvasConfig.resolution,
      antialiasing: true,
      width: canvasConfig.width + canvasConfig.margin.left + canvasConfig.margin.right,
      height: canvasConfig.height,
    };
    
    renderer = new PIXI.Renderer(renderOptions);
    renderer.backgroundColor = parseInt(
      config.style.canvasBackground.substring(1),
      16
    );
    window.renderer = renderer;

    var renderElem = d3.select(container.node().appendChild(renderer.view));
    renderElem.style("width", canvasConfig.widthOuter + "px");
    renderElem.style("height", canvasConfig.height + "px");

    stage = new PIXI.Container();
    stage2 = new PIXI.Container();
    stage3 = new PIXI.Container();
    stage4 = new PIXI.Container();
    stage5 = new PIXI.Container();

    stage.addChild(stage2);
    stage2.addChild(stage3);
    stage2.addChild(stage4);
    stage2.addChild(stage5);

    return {
      stage: stage,
      stage2: stage2,
      stage3: stage3,
      stage4: stage4,
      stage5: stage5,
      container: container,
    };
  }

  function resize() {
    if (!renderer) return;
    renderer.resize(
      canvasConfig.width + canvasConfig.margin.left + canvasConfig.margin.right,
      canvasConfig.height
    );
  }

  function updateStageScales() {
    if (!stage3) return;
    
    stage3.scale.x = 1 / canvasConfig.scale1;
    stage3.scale.y = 1 / canvasConfig.scale1;
    stage3.y = canvasConfig.height;

    stage4.scale.x = 1 / canvasConfig.scale2;
    stage4.scale.y = 1 / canvasConfig.scale2;
    stage4.y = canvasConfig.height;

    stage5.scale.x = 1 / canvasConfig.scale3;
    stage5.scale.y = 1 / canvasConfig.scale3;
    stage5.y = canvasConfig.height;
  }

  function updateStageTransform() {
    if (!stage2) return;
    
    var translate = canvasState.getTranslate();
    var scale = canvasState.getScale();
    
    stage2.scale.x = scale;
    stage2.scale.y = scale;
    stage2.x = translate[0];
    stage2.y = translate[1];
  }

  function imageAnimation() {
    var sleep = true;
    var diff, d;
    var data = canvasData.getData();
    var speed = canvasConfig.speed;

    for (var i = 0; i < data.length; i++) {
      d = data[i];
      diff = d.x1 - d.sprite.position.x;
      if (Math.abs(diff) > 0.1) {
        d.sprite.position.x += diff * speed;
        sleep = false;
      }

      diff = d.y1 - d.sprite.position.y;
      if (Math.abs(diff) > 0.1) {
        d.sprite.position.y += diff * speed;
        sleep = false;
      }

      diff = d.alpha - d.sprite.alpha;
      if (Math.abs(diff) > 0.01) {
        d.sprite.alpha += diff * 0.2;
        sleep = false;
      }

      d.sprite.visible = d.sprite.alpha > 0.1;

      if (d.sprite2) {
        diff = d.alpha2 - d.sprite2.alpha;
        if (Math.abs(diff) > 0.01) {
          d.sprite2.alpha += diff * 0.2;
          sleep = false;
        }

        d.sprite2.visible = d.sprite2.alpha > 0.1;
      }
    }
    
    updateBorderPositions();
    return sleep;
  }

  function animate(loadImages) {
    requestAnimationFrame(function() {
      animate(loadImages);
    });
    loadImages();
    if (canvasState.isSleeping()) return;
    var sleep = imageAnimation();
    canvasState.setSleep(sleep);
    if (renderer && stage) {
      renderer.render(stage);
    }
  }

  function createRect(x, y, width, height, color, alpha, targetStage) {
    // Create a graphics object
    var graphics = new PIXI.Graphics();

    // Set fill properties
    graphics.beginFill(color || 0xFFFFFF, alpha || 1);

    // Draw rectangle
    graphics.drawRect(x, y, width, height);

    // End fill
    graphics.endFill();

    // Add to target stage (defaulting to stage2 if none specified)
    (targetStage || stage2).addChild(graphics);

    // Wake up the renderer
    canvasState.setSleep(false);

    // Return the created graphics object
    return graphics;
  }

  return {
    initRenderer: initRenderer,
    resize: resize,
    updateStageScales: updateStageScales,
    updateStageTransform: updateStageTransform,
    imageAnimation: imageAnimation,
    animate: animate,
    createRect: createRect,
    getRenderer: function() { return renderer; },
    getStage: function() { return stage; },
    getStage2: function() { return stage2; },
    getStage3: function() { return stage3; },
    getStage4: function() { return stage4; },
    getStage5: function() { return stage5; },
    getContainer: function() { return container; },
  };
}
