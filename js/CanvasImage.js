class CanvasImage {
  constructor() {
    this.imageSize = 256;
    this.imageSize2 = 1024;
    this.imageSize3 = 4000;
  }

  loadMiddleImage(d) {
    if (d.loaded) {
      d.alpha2 = 1;
      return;
    }
    var url = "";
    if (config.loader.textures.detail.csv) {
      url = d[config.loader.textures.detail.csv];
    } else {
      url = config.loader.textures.detail.url + d.id + ".jpg";
    }

    var texture = new PIXI.Texture.from(url);
    var sprite = new PIXI.Sprite(texture);

    var update = function () {
      sleep = false;
    };

    sprite.on("added", update);
    texture.once("update", update);

    sprite.scale.x = d.scaleFactor;
    sprite.scale.y = d.scaleFactor;

    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.position.x = d.x * scale2 + this.imageSize2 / 2;
    sprite.position.y = d.y * scale2 + this.imageSize2 / 2;
    sprite._data = d;
    stage4.addChild(sprite);
    d.sprite2 = sprite;
    d.alpha2 = d.highlight;
    d.loaded = true;
    sleep = false;
  }

  loadBigImage(d) {
    if (!config.loader.textures.big) {
      this.loadMiddleImage(d);
      return;
    }

    state.lastZoomed = d.id;
    var page = d.page ? "_" + d.page : "";
    var url = "";
    if (config.loader.textures.big.csv) {
      url = d[config.loader.textures.big.csv];
    } else {
      url = config.loader.textures.big.url + d.id + page + ".jpg";
    }

    var texture = new PIXI.Texture.from(url);
    var sprite = new PIXI.Sprite(texture);
    var res = config.loader.textures.big.size;

    var updateSize = function (t) {
      var size = Math.max(texture.width, texture.height);
      sprite.scale.x = sprite.scale.y = (this.imageSize3 / size) * d.scaleFactor;
      sleep = false;
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
        if (drag) return;

        s.stopPropagation();
        spriteClick = true;
        var pos = s.data.getLocalPosition(s.currentTarget);
        var dir = pos.x > 0 ? 1 : -1;
        var page = d.page + dir;
        var nextPage = page;
        if (page > d.imagenum - 1) nextPage = 0;
        if (page < 0) nextPage = d.imagenum - 1;

        canvas.changePage(d.id, nextPage);
      });
      sprite.interactive = true;
    }

    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.position.x = d.x * scale3 + this.imageSize3 / 2;
    sprite.position.y = d.y * scale3 + this.imageSize3 / 2;
    sprite._data = d;
    d.big = true;
    stage5.addChild(sprite);
    sleep = false;
  }

  clearBigImages() {
    while (stage5.children[0]) {
      stage5.children[0]._data.big = false;
      stage5.removeChild(stage5.children[0]);
      sleep = false;
    }
  }
}
