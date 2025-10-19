# Fix: Timeline Undefined Error

## Problem
```
canvas-layout.js:47 Uncaught TypeError: Cannot read properties of undefined (reading 'init')
```

The `timeline` parameter was undefined when `initGroupLayout` was called because the timeline module is a global variable created in `viz.js`, not a local variable in canvas-modular.js.

## Solution
Changed all references from local `timeline` variable to `window.timeline` to reference the global timeline object.

## Changes Made

### canvas-modular.js

**Removed:**
```javascript
var config, timeline;  // timeline was declared but never assigned
```

**Changed to:**
```javascript
var config;  // timeline removed, using window.timeline instead
```

**Updated all timeline references:**
1. Line ~103: `canvasLayout.makeScales(window.timeline)`
2. Line ~109: `canvasLayout.makeScales(window.timeline)`
3. Line ~115: `canvasLayout.initGroupLayout(config, window.timeline)`
4. Line ~168: `CanvasZoom(..., window.timeline, ...)`
5. Line ~188: `CanvasHash(..., window.timeline, ...)`
6. Line ~193: `canvasLayout.initGroupLayout(config, window.timeline)`
7. Line ~283: `window.timeline.setDisabled(...)`

## Why This Works

The `timeline` object is created globally in `viz.js`:
```javascript
timeline = Timeline();  // Creates global window.timeline
```

Then later, canvas is initialized:
```javascript
canvas.init(data, timelineData, config);
```

By using `window.timeline`, we reference the already-created Timeline instance instead of trying to use an undefined local variable.

## Testing
After this fix:
- [ ] Page should load without errors
- [ ] Timeline should display correctly
- [ ] Layout initialization should work
- [ ] All timeline interactions should function

## Date
October 19, 2025
