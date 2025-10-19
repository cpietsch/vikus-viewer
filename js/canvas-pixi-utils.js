// canvas-pixi-utils.js
// PIXI helper utilities for sprite creation and manipulation
// christopher pietsch
// cpietsch@gmail.com
// 2025

function CanvasPixiUtils() {
  
  /**
   * Create a PIXI sprite with common default settings
   * @param {PIXI.Texture} texture - PIXI texture to use
   * @param {Object} [options] - Configuration options
   * @param {number} [options.anchorX=0.5] - X anchor point (0-1)
   * @param {number} [options.anchorY=0.5] - Y anchor point (0-1)
   * @param {number} [options.scaleX] - X scale factor
   * @param {number} [options.scaleY] - Y scale factor
   * @param {number} [options.scale] - Uniform scale factor (overrides scaleX/Y if set)
   * @param {number} [options.x] - X position
   * @param {number} [options.y] - Y position
   * @param {number} [options.alpha=1] - Alpha transparency (0-1)
   * @param {boolean} [options.visible=true] - Visibility
   * @returns {PIXI.Sprite} Configured PIXI sprite
   */
  function createSprite(texture, options) {
    options = options || {};
    
    var sprite = new PIXI.Sprite(texture);
    
    // Set anchor points
    sprite.anchor.x = options.anchorX !== undefined ? options.anchorX : 0.5;
    sprite.anchor.y = options.anchorY !== undefined ? options.anchorY : 0.5;
    
    // Set scale
    if (options.scale !== undefined) {
      sprite.scale.x = options.scale;
      sprite.scale.y = options.scale;
    } else {
      if (options.scaleX !== undefined) sprite.scale.x = options.scaleX;
      if (options.scaleY !== undefined) sprite.scale.y = options.scaleY;
    }
    
    // Set position
    if (options.x !== undefined) sprite.position.x = options.x;
    if (options.y !== undefined) sprite.position.y = options.y;
    
    // Set other properties
    if (options.alpha !== undefined) sprite.alpha = options.alpha;
    if (options.visible !== undefined) sprite.visible = options.visible;
    
    return sprite;
  }

  /**
   * Update sprite position based on data coordinates and scale
   * @param {PIXI.Sprite} sprite - Sprite to update
   * @param {Object} data - Data object with x, y coordinates
   * @param {number} scale - Canvas scale factor
   * @param {number} imageSize - Image size in pixels (for offset)
   */
  function updateSpritePosition(sprite, data, scale, imageSize) {
    sprite.position.x = data.x * scale + imageSize / 2;
    sprite.position.y = data.y * scale + imageSize / 2;
  }

  /**
   * Update sprite scale based on data scale factor
   * @param {PIXI.Sprite} sprite - Sprite to update
   * @param {Object} data - Data object with scaleFactor property
   */
  function updateSpriteScale(sprite, data) {
    sprite.scale.x = data.scaleFactor;
    sprite.scale.y = data.scaleFactor;
  }

  /**
   * Update both position and scale of a sprite
   * @param {PIXI.Sprite} sprite - Sprite to update
   * @param {Object} data - Data object with x, y, scaleFactor
   * @param {number} scale - Canvas scale factor
   * @param {number} imageSize - Image size in pixels
   */
  function updateSpriteTransform(sprite, data, scale, imageSize) {
    sprite.position.x = data.x * scale + imageSize / 2;
    sprite.position.y = data.y * scale + imageSize / 2;
    sprite.scale.x = data.scaleFactor;
    sprite.scale.y = data.scaleFactor;
  }

  /**
   * Set sprite alpha (transparency)
   * @param {PIXI.Sprite} sprite - Sprite to update
   * @param {number} alpha - Alpha value (0-1)
   */
  function setSpriteAlpha(sprite, alpha) {
    sprite.alpha = alpha;
  }

  /**
   * Set sprite visibility
   * @param {PIXI.Sprite} sprite - Sprite to update
   * @param {boolean} visible - Visibility state
   */
  function setSpriteVisibility(sprite, visible) {
    sprite.visible = visible;
  }

  /**
   * Create a graphics object for borders or shapes
   * @param {Object} options - Configuration options
   * @param {number} [options.lineWidth=1] - Line width
   * @param {number} [options.lineColor=0xff0000] - Line color (hex)
   * @param {number} [options.lineAlpha=1] - Line alpha (0-1)
   * @param {number} [options.fillColor] - Fill color (hex, optional)
   * @param {number} [options.fillAlpha=1] - Fill alpha (0-1)
   * @returns {PIXI.Graphics} Configured graphics object
   */
  function createGraphics(options) {
    options = options || {};
    
    var graphics = new PIXI.Graphics();
    
    // Set line style if specified
    if (options.lineWidth !== undefined || options.lineColor !== undefined) {
      graphics.lineStyle(
        options.lineWidth !== undefined ? options.lineWidth : 1,
        options.lineColor !== undefined ? options.lineColor : 0xff0000,
        options.lineAlpha !== undefined ? options.lineAlpha : 1
      );
    }
    
    // Set fill style if specified
    if (options.fillColor !== undefined) {
      graphics.beginFill(
        options.fillColor,
        options.fillAlpha !== undefined ? options.fillAlpha : 1
      );
    }
    
    return graphics;
  }

  /**
   * Draw a rectangle border around a sprite
   * @param {PIXI.Graphics} graphics - Graphics object to draw on
   * @param {PIXI.Sprite} sprite - Sprite to draw border around
   * @param {Object} [options] - Border options
   * @param {number} [options.padding=0] - Padding around sprite
   * @param {number} [options.lineWidth=1] - Border line width
   * @param {number} [options.lineColor=0xff0000] - Border color
   * @param {number} [options.lineAlpha=1] - Border alpha
   */
  function drawSpriteBorder(graphics, sprite, options) {
    options = options || {};
    var padding = options.padding || 0;
    
    graphics.clear();
    graphics.lineStyle(
      options.lineWidth !== undefined ? options.lineWidth : 1,
      options.lineColor !== undefined ? options.lineColor : 0xff0000,
      options.lineAlpha !== undefined ? options.lineAlpha : 1
    );
    
    graphics.drawRect(
      -padding,
      -padding,
      sprite.width + padding * 2,
      sprite.height + padding * 2
    );
  }

  /**
   * Position graphics relative to a sprite
   * @param {PIXI.Graphics} graphics - Graphics object to position
   * @param {PIXI.Sprite} sprite - Reference sprite
   * @param {Object} [offset] - Position offset
   * @param {number} [offset.x=0] - X offset
   * @param {number} [offset.y=0] - Y offset
   */
  function positionGraphicsOnSprite(graphics, sprite, offset) {
    offset = offset || { x: 0, y: 0 };
    graphics.position.x = sprite.position.x - sprite.width / 2 + (offset.x || 0);
    graphics.position.y = sprite.position.y - sprite.height / 2 + (offset.y || 0);
  }

  /**
   * Batch update multiple sprites with the same transformation
   * @param {Array<PIXI.Sprite>} sprites - Array of sprites to update
   * @param {Function} updateFn - Update function to apply to each sprite
   */
  function batchUpdateSprites(sprites, updateFn) {
    sprites.forEach(updateFn);
  }

  /**
   * Create a texture from a URL with error handling
   * @param {string} url - Image URL
   * @param {Function} [onLoad] - Callback when texture loads
   * @param {Function} [onError] - Callback on error
   * @returns {PIXI.Texture} PIXI texture
   */
  function createTextureFromURL(url, onLoad, onError) {
    var texture = PIXI.Texture.from(url);
    
    if (onLoad) {
      texture.once('update', onLoad);
    }
    
    if (onError) {
      texture.on('error', onError);
    }
    
    return texture;
  }

  /**
   * Animate sprite alpha (fade in/out)
   * @param {PIXI.Sprite} sprite - Sprite to animate
   * @param {number} targetAlpha - Target alpha value (0-1)
   * @param {number} duration - Animation duration in milliseconds
   * @param {Function} [onComplete] - Callback when animation completes
   */
  function animateSpriteAlpha(sprite, targetAlpha, duration, onComplete) {
    var startAlpha = sprite.alpha;
    var startTime = Date.now();
    
    function animate() {
      var elapsed = Date.now() - startTime;
      var progress = Math.min(elapsed / duration, 1);
      
      sprite.alpha = startAlpha + (targetAlpha - startAlpha) * progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    }
    
    animate();
  }

  /**
   * Get sprite bounds in world coordinates
   * @param {PIXI.Sprite} sprite - Sprite to get bounds for
   * @returns {Object} Bounds object with x, y, width, height
   */
  function getSpriteBounds(sprite) {
    return {
      x: sprite.position.x - sprite.width / 2,
      y: sprite.position.y - sprite.height / 2,
      width: sprite.width,
      height: sprite.height
    };
  }

  /**
   * Check if a point is inside a sprite
   * @param {PIXI.Sprite} sprite - Sprite to check
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if point is inside sprite
   */
  function isSpriteHit(sprite, x, y) {
    var bounds = getSpriteBounds(sprite);
    return x >= bounds.x && 
           x <= bounds.x + bounds.width &&
           y >= bounds.y && 
           y <= bounds.y + bounds.height;
  }

  return {
    createSprite: createSprite,
    updateSpritePosition: updateSpritePosition,
    updateSpriteScale: updateSpriteScale,
    updateSpriteTransform: updateSpriteTransform,
    setSpriteAlpha: setSpriteAlpha,
    setSpriteVisibility: setSpriteVisibility,
    createGraphics: createGraphics,
    drawSpriteBorder: drawSpriteBorder,
    positionGraphicsOnSprite: positionGraphicsOnSprite,
    batchUpdateSprites: batchUpdateSprites,
    createTextureFromURL: createTextureFromURL,
    animateSpriteAlpha: animateSpriteAlpha,
    getSpriteBounds: getSpriteBounds,
    isSpriteHit: isSpriteHit
  };
}
