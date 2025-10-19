# Fix: Config Parameter Type Error in Detail and Image Loading

**Date:** October 19, 2025  
**Status:** ✅ FIXED

---

## Issue

When zooming to an individual image via hash URL (e.g., `#mode=Time&ids=704e3fda-a16f-4939-b8f7-d9b960f3f999`), the application threw errors:

**First Error:**
```
canvas-detail.js:17 Uncaught TypeError: Cannot read properties of undefined (reading 'structure')
    at Object.showDetail (canvas-detail.js:17:16)
    at HTMLDivElement.<anonymous> (canvas-zoom.js:275:24)
```

**Second Error (after first fix):**
```
canvas-image-loader.js:91 Uncaught TypeError: Cannot read properties of undefined (reading 'textures')
    at Object.loadBigImage (canvas-image-loader.js:91:21)
    at HTMLDivElement.<anonymous> (canvas-zoom.js:276:23)
```

---

## Root Cause

**Confusion between two different `config` objects:**

1. **`config`** - The loader configuration object with structure:
   ```javascript
   {
     detail: {
       structure: [...],  // Detail sidebar field definitions
     },
     loader: {
       // Image loading configuration
     },
     // ... other properties
   }
   ```

2. **`canvasConfig`** - The CanvasConfig module instance with methods like:
   ```javascript
   {
     updateDimensions: function() {},
     getWidth: function() {},
     // ... config module methods
   }
   ```

**The Problem:**
- In `canvas-zoom.js` line 275, `detailModule.showDetail(d, canvasConfig)` was passing the **module** instead of the **config object**
- `canvas-detail.js` tried to access `cfg.detail.structure` on the module, which doesn't have that property
- Result: `Cannot read properties of undefined (reading 'structure')`

---

## Solution

The `canvasDetail` module already stores the correct config via `setConfig(config)` in `canvas-modular.js` during initialization. Therefore, **don't pass a second parameter** to `showDetail()` when it's not available.

### Pattern in canvas-detail.js:
```javascript
function showDetail(d, configParam) {
  var cfg = configParam || config;  // Use passed OR stored config
  // ...
  cfg.detail.structure.forEach(...)  // Works with stored config
}
```

### Fixed Calls in canvas-zoom.js:

**Line 54 (in `zoomed()`):** ✅ Already correct
```javascript
detailModule.showDetail(selectedImage);  // Uses stored config
```

**Line 180 (in `zoomToImage()`):** ✅ Correct - uses function parameter
```javascript
detailModule.showDetail(d, config);  // config parameter passed to zoomToImage
```

**Line 275 (in `setView()`):** ❌ **FIXED**
```javascript
**The Problem:**
- In `canvas-zoom.js`, multiple calls were passing `canvasConfig` (the **module**) instead of the **config object**:
  - Line 111: `imageLoader.loadBigImage(selectedImage, canvasConfig)` 
  - Line 275: `detailModule.showDetail(d, canvasConfig)` 
  - Line 276: `imageLoader.loadBigImage(d, canvasConfig)` 
- Both `canvas-detail.js` and `canvas-image-loader.js` tried to access properties that don't exist on the module:
  - `cfg.detail.structure` → undefined
  - `cfg.loader.textures` → undefined
- Result: `Cannot read properties of undefined`

---

## Solution

Both `canvasDetail` and `canvasImageLoader` modules already store the correct config via `setConfig(config)` in `canvas-modular.js` during initialization. Therefore, **don't pass a second parameter** to these functions when calling from `setView()` or `zoomend()`.

### Pattern in canvas-detail.js & canvas-image-loader.js:
```javascript
var config = null;  // Stored via setConfig()

function setConfig(cfg) {
  config = cfg;  // Store the loader config object
}

function showDetail(d, configParam) {
  var cfg = configParam || config;  // Use passed OR stored config
  cfg.detail.structure.forEach(...)  // Works with stored config
}

function loadBigImage(d, configParam) {
  var cfg = configParam || config;  // Use passed OR stored config
  cfg.loader.textures.big...  // Works with stored config
}
```

### Fixed Calls in canvas-zoom.js:

**Line 54 (in `zoomed()`):** ✅ Already correct
```javascript
detailModule.showDetail(selectedImage);  // Uses stored config
```

**Line 111 (in `zoomend()`):** ❌→✅ **FIXED**
```javascript
// BEFORE (wrong):
imageLoader.loadBigImage(selectedImage, canvasConfig);

// AFTER (correct):
imageLoader.loadBigImage(selectedImage);  // Uses stored config
```

**Line 180 (in `zoomToImage()`):** ✅ Correct - uses function parameter
```javascript
detailModule.showDetail(d, config);  // config parameter passed to zoomToImage
imageLoader.loadBigImage(d, config);
```

**Line 275 (in `setView()`):** ❌→✅ **FIXED**
```javascript
// BEFORE (wrong):
detailModule.showDetail(d, canvasConfig);  // canvasConfig is the module!

// AFTER (correct):
detailModule.showDetail(d);  // Uses stored config
```

**Line 276 (in `setView()`):** ❌→✅ **FIXED**
```javascript
// BEFORE (wrong):
imageLoader.loadBigImage(d, canvasConfig);  // canvasConfig is the module!

// AFTER (correct):
imageLoader.loadBigImage(d);  // Uses stored config
```
```

---

## Why loadBigImage Still Gets canvasConfig

The `imageLoader.loadBigImage(d, canvasConfig)` call **correctly** passes `canvasConfig` because:

1. `canvas-image-loader.js` expects the config **module** (not the config object)
2. It uses `configParam.getLoaderBasePath()` to access loader configuration
3. This is a different pattern than `canvas-detail.js`

### Different Module Patterns:

**canvas-detail.js** - stores the **config object**:
```javascript
function setConfig(cfg) {
  config = cfg;  // Stores the whole config object
}

function showDetail(d, configParam) {
  var cfg = configParam || config;
  cfg.detail.structure.forEach(...)  // Access config.detail
}
```

**canvas-image-loader.js** - uses the **config module**:
```javascript
function loadBigImage(d, configParam) {
  var cfg = configParam || config;
  var basePath = cfg.getLoaderBasePath();  // Call module method
}
```

---

## Files Modified

### `/workspaces/vikus-viewer/js/canvas-zoom.js`

**Changes:**
- Line 54: ✅ No change needed (already correct)
- Line 111: ❌→✅ Removed `canvasConfig` parameter from `loadBigImage(selectedImage)`
- Line 180: ✅ No change needed (uses function parameter correctly)
- Line 275: ❌→✅ Removed `canvasConfig` parameter from `showDetail(d)`
- Line 276: ❌→✅ Removed `canvasConfig` parameter from `loadBigImage(d)`

**Summary:** All calls in `zoomend()` and `setView()` now use stored config instead of passing the wrong module.

---

## Testing

To verify the fix:

1. **Open application** with a hash URL containing an image ID
   - Example: `#mode=Time&ids=704e3fda-a16f-4939-b8f7-d9b960f3f999`

2. **Check console** - should have no errors

3. **Verify detail sidebar** - should display correctly with image details

4. **Test zoom to image** - detail sidebar should show without errors

---

## Status

**✅ COMPLETE** - Both detail sidebar and image loading now work correctly when navigating via hash URLs.

### What Was The Issue?

The modular refactoring introduced a pattern where modules store their config via `setConfig()`. However, `canvas-zoom.js` was incorrectly passing `canvasConfig` (the CanvasConfig **module**) instead of relying on the stored config **object**.

### Key Learning

**Two different configs:**
1. **`config`** (loader config object) - Has `detail.structure`, `loader.textures`, etc.
2. **`canvasConfig`** (CanvasConfig module) - Has methods like `getWidth()`, `updateDimensions()`

**When to pass config:**
- ✅ **Pass `config` parameter** - When a function receives it as a parameter (like `zoomToImage(d, duration, config)`)
- ✅ **Don't pass anything** - When calling from functions that don't have config available
- ❌ **Never pass `canvasConfig`** - It's a module, not a config object!

---

## Related Issues

This is part of the ongoing modular refactoring fixes:
- See `FIX_HASH_UPDATE.md` for hash update implementation
- See `FIX_SUMMARY.md` for overall Phase 1 fixes
