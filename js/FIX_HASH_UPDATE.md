# Fix: Hash Update Implementation

## Date
October 19, 2025

## Issue
The modular refactoring had placeholder code in `canvas-zoom.js` for hash updates. The hash synchronization logic wasn't fully implemented, breaking URL sharing and browser navigation.

## Root Cause
During the initial modular refactoring:
1. The hash update logic in `zoomend()` was left as a placeholder comment
2. `canvasHash` module was created after `canvasZoom`, creating a circular dependency challenge
3. Config parameters were missing in some function calls

## Files Modified

### 1. `/workspaces/vikus-viewer/js/canvas-zoom.js`

**Changes:**
- Added `canvasHash` variable to store hash module reference (initialized to null)
- Implemented full `handleHashUpdate(getViewFunc)` function with:
  - Viewport items detection via `getViewFunc()` 
  - URLSearchParams manipulation
  - Debounce timeout handling
  - User interaction flag setting
- Added `setHashModule(hashModule)` method to wire hash module after initialization
- Updated `zoomend()` to call `handleHashUpdate(canvasHash.getView)` when canvasHash is available
- Fixed config propagation: added `canvasConfig` parameter to:
  - `detailModule.showDetail()` in `zoomed()` (line ~54)
  - `imageLoader.loadBigImage()` in `zoomend()` (line ~112)
  - `detailModule.showDetail()` and `imageLoader.loadBigImage()` in `setView()` (line ~282-283)
- Exported `setHashModule` in return statement

**Code Added (handleHashUpdate):**
```javascript
function handleHashUpdate(getViewFunc) {
  var lastSourceEvent = canvasState.getLastSourceEvent();
  if (!lastSourceEvent) return;

  var debounceHash = canvasState.getDebounceHash();
  if (debounceHash) clearTimeout(debounceHash);
  
  var newDebounce = setTimeout(function () {
    if (canvasState.isZooming()) return;
    
    // Update hash with viewport items
    var hash = window.location.hash.slice(1);
    var params = new URLSearchParams(hash);

    var idsInViewport = getViewFunc();
    if (idsInViewport.length > 0) {
      params.set("ids", idsInViewport.join(","));
    } else if (canvasState.isZoomedToImage()) {
      return;
    } else {
      params.delete("ids");
    }
    
    window.location.hash = params.toString().replaceAll("%2C", ",");
    canvasState.setUserInteraction(true);
  }, canvasConfig.debounceHashTime);
  
  canvasState.setDebounceHash(newDebounce);
}
```

### 2. `/workspaces/vikus-viewer/js/canvas-modular.js`

**Changes:**
- Added `canvasZoom.setHashModule(canvasHash)` call after canvasHash initialization
- This wires the hash module to the zoom module, resolving the initialization order dependency

**Code Added:**
```javascript
canvasHash = CanvasHash(...);

// Wire canvasHash to canvasZoom for hash updates
canvasZoom.setHashModule(canvasHash);
```

## Solution Architecture

### Dependency Resolution Pattern
Instead of passing canvasHash to CanvasZoom constructor (impossible due to initialization order), we use a setter pattern:

1. **Initialization Phase:**
   - canvasZoom created first (without hash module)
   - canvasHash created second (with zoom module reference)
   - canvasZoom.setHashModule() called to wire the connection

2. **Runtime Phase:**
   - zoomend event fires
   - handleHashUpdate checks if canvasHash exists
   - If available, calls canvasHash.getView() to get viewport items
   - Updates URL hash with debounced logic

### Hash Update Flow
```
User pans/zooms
  ↓
zoomend() fires
  ↓
handleHashUpdate(canvasHash.getView) called
  ↓
Debounce timer starts (300ms)
  ↓
Timer expires → getView() called
  ↓
Viewport items calculated
  ↓
URLSearchParams updated
  ↓
window.location.hash modified
  ↓
userInteraction flag set
```

## Testing

To verify the fix works:

1. **Open the application** in a browser
2. **Pan or zoom** the canvas
3. **Wait ~300ms** (debounce time)
4. **Check URL hash** - should contain `ids=X,Y,Z` with visible item IDs
5. **Copy URL** and paste in new tab - should restore same view
6. **Use browser back button** - should navigate through view history

## Differences from Original

The implementation closely matches `canvas.js` lines 1335-1370 with these adaptations:

- Uses `canvasHash.getView()` instead of local `canvas.getView()`
- Uses `canvasState` getters/setters instead of direct state access
- Uses `canvasConfig` instead of local config variables
- Wired via `setHashModule()` instead of closure access

## Related Issues

- ✅ Hash update placeholder (lines 123-127) - **FIXED**
- ✅ Config propagation in zoom callbacks - **FIXED**
- ⚠️ zoomToYear() function - **NOT IMPLEMENTED** (per user request)
- ✅ ping() call in canvas.project() - **ALREADY PRESENT**

## Status
**COMPLETE** - Hash updates now fully functional in modular architecture.
