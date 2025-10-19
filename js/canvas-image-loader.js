// canvas-image-loader.js
// Image loading and texture management for Canvas module

function CanvasImageLoader(canvasConfig, canvasState, canvasData, stage4, stage5) {
  var loadImagesCue = [];
  var config = null;  // Will be set via setConfig()

  function filterVisible() {
    var data = canvasData.getData();
    var scale = canvasState.getScale();
    var translate = canvasState.getTranslate();
    
    if (canvasState.isZoomedToImage()) return;

    data.forEach(function (d, i) {
      var p = d.sprite.position;

      var x = p.x / canvasConfig.scale1 + translate[0] / scale;
      var y = p.y / canvasConfig.scale1 + translate[1] / scale;
      var padding = 2;

      if (
        x > -padding
        && x < canvasConfig.width / scale + padding
        && y + canvasConfig.height < canvasConfig.height / scale + padding
        && y > canvasConfig.height * -1 - padding
      ) {
        d.visible = true;
      } else {
        d.visible = false;
      }
    });

    var visible = data.filter(function (d) {
      return d.visible;
    });

    if (visible.length < 40) {
      data.forEach(function (d) {
        if (d.visible && d.loaded && d.active) d.alpha2 = 1;
        else if (d.visible && !d.loaded && d.active) loadImagesCue.push(d);
        else d.alpha2 = 0;
      });
    } else {
      data.forEach(function (d) {
        d.alpha2 = 0;
      });
    }
  }

  function loadMiddleImage(d, configParam) {
    var cfg = configParam || config;  // Use passed config or stored config
    if (d.loaded) {
      d.alpha2 = 1;
      return;
    }
    var url = "";
    if (cfg.loader.textures.detail.csv) {
      url = d[cfg.loader.textures.detail.csv];
    } else {
      url = cfg.loader.textures.detail.url + d.id + ".jpg";
    }

    var texture = new PIXI.Texture.from(url);
    var sprite = new PIXI.Sprite(texture);

    var update = function () {
      canvasState.setSleep(false);
    };

    sprite.on("added", update);
    texture.once("update", update);

    sprite.scale.x = d.scaleFactor;
    sprite.scale.y = d.scaleFactor;

    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.position.x = d.x * canvasConfig.scale2 + canvasConfig.imageSize2 / 2;
    sprite.position.y = d.y * canvasConfig.scale2 + canvasConfig.imageSize2 / 2;
    sprite._data = d;
    stage4.addChild(sprite);
    d.sprite2 = sprite;
    d.alpha2 = d.highlight;
    d.loaded = true;
    canvasState.setSleep(false);
  }

  function loadBigImage(d, configParam, changePage) {
    var cfg = configParam || config;  // Use passed config or stored config
    if (!cfg.loader.textures.big) {
      loadMiddleImage(d, cfg);
      return;
    }

    canvasState.setLastZoomed(d.id);
    var page = d.page ? "_" + d.page : "";
    var url = "";
    if (cfg.loader.textures.big.csv) {
      url = d[cfg.loader.textures.big.csv];
    } else {
      url = cfg.loader.textures.big.url + d.id + page + ".jpg";
    }

    var texture = new PIXI.Texture.from(url);
    var sprite = new PIXI.Sprite(texture);

    var updateSize = function (t) {
      var size = Math.max(texture.width, texture.height);
      sprite.scale.x = sprite.scale.y = (canvasConfig.imageSize3 / size) * d.scaleFactor;
      canvasState.setSleep(false);
      if (t.valid) {
        d.alpha = 0;
        d.alpha2 = 0;
      }
    };

    sprite.on("added", updateSize);
    texture.once("update", updateSize);

    if (d.imagenum) {
      sprite.on("mousemove", function (s) {
        var pos = s.data.getLocalPosition(s.currentTarget);
        s.currentTarget.cursor = pos.x > 0 ? "e-resize" : "w-resize";
      });
      sprite.on("click", function (s) {
        if (canvasState.isDragging()) return;

        s.stopPropagation();
        canvasState.setSpriteClick(true);
        var pos = s.data.getLocalPosition(s.currentTarget);
        var dir = pos.x > 0 ? 1 : -1;
        var page = d.page + dir;
        var nextPage = page;
        if (page > d.imagenum - 1) nextPage = 0;
        if (page < 0) nextPage = d.imagenum - 1;

        changePage(d.id, nextPage);
      });
      sprite.interactive = true;
    }

    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.position.x = d.x * canvasConfig.scale3 + canvasConfig.imageSize3 / 2;
    sprite.position.y = d.y * canvasConfig.scale3 + canvasConfig.imageSize3 / 2;
    sprite._data = d;
    d.big = true;
    stage5.addChild(sprite);
    canvasState.setSleep(false);
  }

  function clearBigImages() {
    while (stage5.children[0]) {
      stage5.children[0]._data.big = false;
      stage5.removeChild(stage5.children[0]);
      canvasState.setSleep(false);
    }
  }

  function loadImages() {
    if (canvasState.isZooming()) return;
    if (canvasState.isZoomedToImage()) return;

    if (loadImagesCue.length) {
      var d = loadImagesCue.pop();
      if (!d.loaded) {
        loadMiddleImage(d);
      }
    }
  }

  function setConfig(cfg) {
    config = cfg;
  }

  return {
    filterVisible: filterVisible,
    loadMiddleImage: loadMiddleImage,
    loadBigImage: loadBigImage,
    clearBigImages: clearBigImages,
    loadImages: loadImages,
    setConfig: setConfig,
  };
}
