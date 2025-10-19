# Fix: Config Undefined Error

## Problem
```
canvas-image-loader.js:56 Uncaught TypeError: Cannot read properties of undefined (reading 'loader')
```

Multiple modules were trying to access `config` but it wasn't being passed or stored properly.

## Root Cause
Several modules received `config` as a parameter in specific functions but didn't have access to it when needed:
- `CanvasImageLoader` - `loadImages()` called `loadMiddleImage()` without config
- `CanvasDetail` - needed config for detail structure
- `CanvasAnnotations` - needed config for annotation styles

## Solution
Added internal config storage to affected modules with a `setConfig()` method, allowing config to be set once during initialization and accessed throughout the module's lifetime.

## Changes Made

### 1. canvas-image-loader.js
- Added `var config = null;` to store config internally
- Modified `loadMiddleImage(d, configParam)` to use `configParam || config`
- Modified `loadBigImage(d, configParam, changePage)` to use `configParam || config`
- Added `setConfig(cfg)` method
- Exported `setConfig` in return object

### 2. canvas-detail.js
- Added `var config = null;` to store config internally
- Modified `showDetail(d, configParam)` to use `configParam || config`
- Added `setConfig(cfg)` method
- Exported `setConfig` in return object

### 3. canvas-annotations.js
- Added `var config = null;` to store config internally
- Modified `drawVectors(configParam)` to use `configParam || config`
- Modified `addBorder(d, configParam)` to use `configParam || config`
- Modified `addBorderToImage(d, configParam)` to use `configParam || config`
- Modified `updateImageBorders(borderIds, configParam)` to use `configParam || config`
- Added `setConfig(cfg)` method
- Exported `setConfig` in return object

### 4. canvas-modular.js
Added setConfig calls after module initialization:
```javascript
canvasAnnotations.setConfig(config);  // Set config for annotations
canvasDetail.setConfig(config);       // Set config for detail view
imageLoader.setConfig(config);        // Set config for image loading
```

## Pattern Used

**Flexible Config Access Pattern:**
```javascript
function someFunction(d, configParam) {
  var cfg = configParam || config;  // Use passed config or stored config
  // ... use cfg ...
}
```

This allows:
1. **Backwards compatibility** - Can still pass config explicitly
2. **Convenience** - Internal calls don't need to pass config
3. **Flexibility** - Config can be updated via setConfig() if needed

## Benefits

1. **Cleaner internal calls** - No need to pass config everywhere
2. **Single source of truth** - Config set once, used everywhere
3. **Backwards compatible** - Can still override with explicit config param
4. **Easy to update** - Call setConfig() to change config

## Testing
After this fix:
- [ ] Page should load without errors
- [ ] Images should load at all resolutions
- [ ] Detail view should display correctly
- [ ] Annotations (vectors and borders) should work
- [ ] No "Cannot read properties of undefined" errors

## Date
October 19, 2025
