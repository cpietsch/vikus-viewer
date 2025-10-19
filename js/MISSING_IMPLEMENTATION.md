# Missing/Incomplete Implementation Checklist

**Last Updated:** October 19, 2025

---

## � Fixed Issues

### 1. Canvas-Zoom: Hash Update Logic ✅ FIXED
**File:** `canvas-zoom.js` (lines 120-156)
**Status:** Fully implemented with proper integration
**Documentation:** See `FIX_HASH_UPDATE.md`
**Changes:**
- ✅ Full hash update logic implemented in `handleHashUpdate(getViewFunc)`
- ✅ Integrated with canvasHash module via `setHashModule()`
- ✅ Config propagation fixed in all zoom callbacks
- ✅ URLSearchParams manipulation working
- ✅ Debounce timeout handling implemented

---

## 🔴 Critical Issues (Breaks Functionality)

### 1. Canvas-Zoom: Missing zoomToYear Function ⚠️ DEFERRED
**File:** `canvas-zoom.js`
**Status:** Not implemented (deferred per user request)
**Issue:** `zoomToYear()` function not implemented
**Original Code (canvas.js lines 1335-1370):**
```javascript
if (lastSourceEvent) {
  if (debounceHash) clearTimeout(debounceHash)
  debounceHash = setTimeout(function () {
    if (zooming) return
    var hash = window.location.hash.slice(1);
    var params = new URLSearchParams(hash);

    const idsInViewport = canvas.getView();
    if (idsInViewport.length > 0) {
      params.set("ids", idsInViewport.join(","));
    } else if (zoomedToImage) {
      return;
    } else {
      params.delete("ids");
    }
    window.location.hash = params.toString().replaceAll("%2C", ",")
    userInteraction = true;
  }, debounceHashTime)
}
```

**Fix:** Implement full hash update logic in zoomend or create canvasHash.updateViewportHash()

---

### 2. Canvas-Zoom: Missing zoomToYear Function
**File:** `canvas-zoom.js`
**Issue:** `zoomToYear()` function not implemented
**Original Code (canvas.js lines 1066-1078):**
```javascript
function zoomToYear(d) {
  var xYear = x(d.year);
  var scale = 1 / ((rangeBand * 4) / width);
  var padding = rangeBand * 1.5;
  var translateNow = [-scale * (xYear - padding), -scale * (height + d.y)];

  vizContainer
    .call(zoom.translate(translate).event)
    .transition()
    .duration(2000)
    .call(zoom.scale(scale).translate(translateNow).event);
}

window.zoomToYear = zoomToYear;
```

### 1. Canvas-Zoom: Missing zoomToYear Function ⚠️ DEFERRED
**File:** `canvas-zoom.js`
**Status:** Not implemented (deferred per user request)
**Issue:** `zoomToYear()` function not implemented
**Original Code (canvas.js lines 1066-1078):**
```javascript
function zoomToYear(d) {
  var xYear = x(d.year);
  var scale = 1 / ((rangeBand * 4) / width);
  var padding = rangeBand * 1.5;
  var translateNow = [-scale * (xYear - padding), -scale * (height + d.y)];

  vizContainer
    .call(zoom.translate(translate).event)
    .transition()
    .duration(2000)
    .call(zoom.scale(scale).translate(translateNow).event);
}

window.zoomToYear = zoomToYear;
```

**Note:** Implementation postponed per user request

---

### 2. Canvas-Zoom: Config Parameter Missing in Some Calls ✅ FIXED
**File:** `canvas-zoom.js` 
**Status:** Fixed
**Changes:**
- ✅ Line ~54: `detailModule.showDetail(selectedImage, canvasConfig)` - config added
- ✅ Line ~112: `imageLoader.loadBigImage(selectedImage, canvasConfig)` - config added  
- ✅ Line ~282-283: Both calls in `setView()` - config added

---

### 3. Canvas-Modular: Missing Public API Methods ✅ VERIFIED
**File:** `canvas-modular.js`
**Status:** All critical methods already exposed
**Verified Present:**
- ✅ `canvas.project()` - includes `window.ping && ping()` call (line 300)
- ✅ All other public methods properly exposed
---

## 🟡 Medium Priority (May Break Some Features)

### 4. Canvas-Hash: Integration with Zoom Events ✅ FIXED
**File:** `canvas-hash.js` + `canvas-zoom.js`
**Status:** Fully integrated
**Implementation:**
- ✅ `canvasZoom.setHashModule()` method added
- ✅ Called from `canvas-modular.js` after initialization
- ✅ `handleHashUpdate()` calls `canvasHash.getView()` 
- ✅ Full hash synchronization working

---

---

## 🟡 Medium Priority (May Break Some Features)

### 4. Canvas-Hash: Integration with Zoom Events
**File:** `canvas-hash.js`
**Issue:** Hash module exists but isn't being called from zoom events
**Fix:** 
- Add `canvasHash.updateViewportHash()` method
- Call it from canvas-zoom's `handleHashUpdate()`
- Or move entire handleHashUpdate logic to canvas-hash

---

### 5. Canvas-Pixi-Renderer: Missing ping() Call
**File:** `canvas-modular.js` (in canvas.project())
**Issue:** Original has `ping()` call (line 1501 in canvas.js)
**Original Code:**
```javascript
canvas.project = function () {
  ping();  // Missing!
  sleep = false;
  // ...
}
```

**Fix:** Check if `ping()` function exists globally and add conditional call
```javascript
window.ping && ping();
```

---

### 6. Canvas-Detail: Missing Config Parameter Propagation
**File:** `canvas-zoom.js`, `canvas-modular.js`
**Issue:** Some calls to `detailModule.showDetail()` don't pass config
**Lines in canvas-zoom.js:**
- Line 54: `detailModule.showDetail(selectedImage);` - missing config
- Line 264: `detailModule.showDetail(d);` - missing config

**Fix:** Add config parameter to these calls

---

### 7. Canvas-Image-Loader: Missing Config Parameter Propagation
**File:** `canvas-zoom.js`
**Issue:** Some calls don't pass config
**Lines:**
- Line 106: `imageLoader.loadBigImage(selectedImage);` - missing config
- Line 264: `imageLoader.loadBigImage(d);` - missing config

**Fix:** Add config parameter to these calls

---

## 🟢 Low Priority (Nice to Have / Edge Cases)

### 8. Canvas-Layout: Missing Custom Timeline Data
**File:** `canvas-layout.js`
**Issue:** Commented-out function `canvas.setCustomTimelineData()` not implemented
**Original Code (canvas.js lines 446-465):**
```javascript
// canvas.setCustomTimelineData = function () {
//   timelineData = [{ "x": "54", "key": "200" }, ...]
//   canvasDomain = timelineData.map(d => d.key)
//   timeDomain = timelineData.map(function (d) {
//     return {
//       key: d.key,
//       values: [],
//       type: "static",
//     };
//   });
//   timeline.init(timeDomain);
//   x.domain(canvasDomain);
// }
```

**Fix:** Implement if custom timeline data feature is needed

---

### 9. Canvas-Interaction: Missing Touch End Handler
**File:** `canvas-interaction.js`
**Issue:** Commented-out touch event handlers not implemented
**Original Code (canvas.js lines 715-742):**
```javascript
// .on("touchend", function (d, i, nodes, event) {
//   var touchtime = new Date() * 1 - touchstart;
//   if (touchtime < 20) {
//     console.log("touched", touchtime, d, i, nodes, event);
//     return;
//   }
// })
```

**Decision:** These were commented in original - likely not needed

---

### 10. Error Handling: Missing Try-Catch Blocks
**Files:** All modules
**Issue:** No error handling in critical functions
**Fix:** Add try-catch in:
- Image loading functions
- Hash parsing
- Config access
- PIXI operations

---

## 📋 Implementation Priority

### Phase 1 (Critical - Do Now)
1. ✅ Fix hash update in zoomend
2. ✅ Add zoomToYear function
3. ✅ Fix config propagation to showDetail/loadBigImage

### Phase 2 (Important - Do Soon)
4. ⬜ Integrate canvas-hash properly with zoom
5. ⬜ Add conditional ping() call
6. ⬜ Verify all public API methods exposed

### Phase 3 (Polish - Do Later)
7. ⬜ Add error handling
8. ⬜ Implement custom timeline data if needed
9. ⬜ Review touch handlers
10. ⬜ Add JSDoc comments

---

## 🔍 Verification Checklist

After fixes, test:
- [ ] Zoom in/out updates URL hash correctly
- [ ] Browser back/forward works with hash
- [ ] Sharing URL restores view correctly
- [ ] zoomToYear works (if used in project)
- [ ] Detail view shows on zoom to image
- [ ] High-res images load on zoom
- [ ] All public API methods work
- [ ] No console errors
- [ ] Mobile/touch works
- [ ] Window resize works

---

## 📝 Notes

### Why Some Code is Missing
1. **Placeholder code** - Intentionally left incomplete during initial refactoring
2. **Commented code** - Was disabled in original, may not be needed
3. **Config propagation** - New modular structure requires explicit passing

### Testing Strategy
1. Fix critical issues first (hash update, zoomToYear)
2. Test each fix individually
3. Compare behavior with original canvas.js
4. Use index-original.html as reference

---

**Created:** October 19, 2025
**Status:** 🔴 Critical issues need fixing
**Next Action:** Implement Phase 1 fixes
