# Quick Optimization Guide - Top 5 Priorities

This guide focuses on the **highest impact, lowest effort** optimizations you can implement immediately.

---

## 1. Complete Debug Logging Migration (5 minutes)

### Files to Update:
- `canvas-config.js` (2 console.log)
- `canvas-annotations.js` (5 console.log)
- `canvas-detail.js` (1 console.log)
- `canvas-layout.js` (1 console.log)

### Example Fix:

**canvas-config.js** (lines 63-64):
```javascript
// Before:
console.log("dimensions", computed.width, computed.height);
console.log("self.innerWidth", self.innerWidth, self.innerHeight);

// After:
var canvasDebug = CanvasDebug(); // Add at top of function
canvasDebug.log('layout', "dimensions", computed.width, computed.height);
canvasDebug.log('layout', "self.innerWidth", self.innerWidth, self.innerHeight);
```

Apply same pattern to other files with their appropriate categories.

---

## 2. Add Error Handling to Data Loaders (20 minutes)

### Update loader.js:

```javascript
// Improve error handling
loader.load = function () {
  container = d3.select(".detailLoader");
  container.selectAll("div").remove();

  container.append("div").classed("label", true).text("loading");
  indicator = container.append("div").classed("indicator", true);

  d3.csv(url)
    .on("progress", loader.progress)
    .on("load", function (data) {
      finished(data);
      container.selectAll("div").remove();
    })
    .on("error", function (err) {
      console.error("Error loading data from:", url, err);
      
      // Show user-friendly error
      container.selectAll("div").remove();
      container.append("div")
        .classed("label error", true)
        .style("color", "#ff6b6b")
        .text("Failed to load data");
      
      // Still call finished with empty array to prevent app crash
      finished([]);
    })
    .get();
};
```

### Update viz.js:

```javascript
d3.json(baseUrl.config || "data/config.json", function (error, config) {
  if (error) {
    console.error('Failed to load config:', error);
    document.body.innerHTML = `
      <div style="padding: 40px; color: #fff; text-align: center;">
        <h1>Configuration Error</h1>
        <p>Failed to load configuration file. Please check the data path.</p>
        <pre style="background: #000; padding: 20px; margin: 20px auto; max-width: 600px; text-align: left;">${error.message}</pre>
      </div>
    `;
    return;
  }
  
  try {
    config.baseUrl = baseUrl;
    utils.initConfig(config);
    // ... rest of initialization
  } catch (e) {
    console.error('Initialization error:', e);
    document.body.innerHTML = `
      <div style="padding: 40px; color: #fff; text-align: center;">
        <h1>Initialization Error</h1>
        <p>Failed to initialize visualization.</p>
        <pre style="background: #000; padding: 20px; margin: 20px auto; max-width: 600px; text-align: left;">${e.stack}</pre>
      </div>
    `;
  }
});
```

---

## 3. Optimize Animation Frame Loop (15 minutes)

### Update canvas-pixi-renderer.js:

```javascript
function CanvasPixiRenderer(canvasConfig, canvasState, canvasData) {
  // ... existing code ...
  
  let rafId = null;
  let isAnimating = false;
  let frameCount = 0;
  
  function animate() {
    if (!isAnimating) {
      rafId = null;
      return;
    }
    
    const sleep = imageAnimation();
    
    // Only render if something changed or not sleeping
    if (!sleep || !canvasState.getSleep()) {
      updateStageTransform();
      renderer.render(stage);
      rafId = requestAnimationFrame(animate);
    } else {
      // Nothing to animate, stop the loop
      isAnimating = false;
      rafId = null;
      canvasDebug.log('animation', 'Animation loop stopped (idle)');
    }
  }
  
  function startAnimation() {
    if (!isAnimating) {
      isAnimating = true;
      canvasDebug.log('animation', 'Animation loop started');
      animate();
    }
  }
  
  function stopAnimation() {
    isAnimating = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    canvasDebug.log('animation', 'Animation loop stopped (manual)');
  }
  
  return {
    // ... existing methods ...
    animate: startAnimation,  // Rename for clarity
    stop: stopAnimation,
    isAnimating: function() { return isAnimating; }
  };
}
```

### Update canvas-modular.js to use new API:

```javascript
// Replace
pixiRenderer.animate();

// With
pixiRenderer.animate(); // Now starts animation intelligently
```

**Benefit**: Animation stops when idle, saving CPU/battery

---

## 4. Add Texture Memory Cleanup (10 minutes)

### Update canvas-image-loader.js:

```javascript
function clearBigImages() {
  // Clear stage4 (1024px images)
  if (stages.stage4) {
    stages.stage4.children.forEach(function(child) {
      if (child.texture && child.texture !== PIXI.Texture.WHITE) {
        child.texture.destroy(true); // Destroy texture and base texture
      }
    });
    stages.stage4.removeChildren();
  }
  
  // Clear stage5 (4000px images)  
  if (stages.stage5) {
    stages.stage5.children.forEach(function(child) {
      if (child.texture && child.texture !== PIXI.Texture.WHITE) {
        child.texture.destroy(true);
      }
    });
    stages.stage5.removeChildren();
  }
  
  // Force garbage collection hint
  if (window.gc) window.gc();
  
  canvasDebug.log('image', 'Cleared big images and freed textures');
}
```

**Benefit**: Prevents memory leaks when loading many high-res images

---

## 5. Parallel Data Loading (15 minutes)

### Update viz.js to load data in parallel:

```javascript
// Add helper function at top
function loadCSVParallel(url) {
  return new Promise(function(resolve, reject) {
    d3.csv(url)
      .on("load", resolve)
      .on("error", reject)
      .get();
  });
}

function loadJSONParallel(url) {
  return new Promise(function(resolve, reject) {
    d3.json(url, function(error, data) {
      if (error) reject(error);
      else resolve(data);
    });
  });
}

// In init() function, replace sequential loading with:
function init() {
  canvas = Canvas();
  search = Search();
  timeline = Timeline();
  ping = utils.ping();

  var baseUrl = utils.getDataBaseUrl();
  var makeUrl = utils.makeUrl;

  console.log(baseUrl);

  // Load config first
  loadJSONParallel(baseUrl.config || "data/config.json")
    .then(function(config) {
      config.baseUrl = baseUrl;
      utils.initConfig(config);
      
      // Load timeline and items in parallel
      return Promise.all([
        loadCSVParallel(makeUrl(baseUrl.path, config.loader.timeline)),
        loadCSVParallel(makeUrl(baseUrl.path, config.loader.items)),
        Promise.resolve(config) // Pass config through
      ]);
    })
    .then(function(results) {
      var timelineData = results[0];
      var itemsData = results[1];
      var config = results[2];
      
      console.log('Data loaded in parallel:', itemsData.length, 'items');
      
      utils.clean(itemsData, config);
      
      // Initialize tags based on config
      if(config.filter && config.filter.type === "crossfilter") {
        tags = Crossfilter();
      } else if(config.filter && config.filter.type === "hierarchical") {
        tags = TagsHierarchical();
      } else {
        tags = Tags();
      }
      
      tags.init(itemsData, config);
      search.init();
      canvas.init(itemsData, timelineData, config);
      
      // Rest of initialization...
      if (config.loader.layouts) {
        initLayouts(config);
      } else {
        canvas.setMode({
          title: "Time",
          type: "group",
          groupKey: "year"
        });
      }
      
      // Continue with rest of setup...
      setupEventHandlers(config);
      loadSprites(config, itemsData);
    })
    .catch(function(error) {
      console.error('Failed to load data:', error);
      showErrorMessage('Failed to load data: ' + error.message);
    });
}

function setupEventHandlers(config) {
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (params.get('ui') === '0') deactivateUI();

  window.onhashchange = function () {
    var hash = window.location.hash.slice(1);
    var params = new URLSearchParams(hash);
    if(params.get('ui') === '0') deactivateUI();
    canvas.onhashchange();
  };
  
  // ... rest of event handlers
}

function loadSprites(config, data) {
  const idToItemsMap = new Map();
  data.forEach(function(d) {
    if (d.sprite) {
      if (!idToItemsMap.has(d.id)) {
        idToItemsMap.set(d.id, []);
      }
      idToItemsMap.get(d.id).push(d);
    }
  });

  LoaderSprites()
    .progress(function (textures) {
      Object.keys(textures).forEach(function(id) {
        const items = idToItemsMap.get(id);
        if (items) {
          items.forEach(function(item) {
            item.sprite.texture = textures[id];
          });
        }
      });
      canvas.wakeup();
    })
    .finished(function () {
      canvas.onhashchange();
    })
    .load(utils.makeUrl(config.baseUrl.path, config.loader.textures.medium.url));
}

function showErrorMessage(message) {
  document.body.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #2a2a2a;
      color: #fff;
      padding: 40px;
      border-radius: 8px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    ">
      <h2 style="color: #ff6b6b; margin-top: 0;">Error</h2>
      <p>${message}</p>
      <button onclick="location.reload()" style="
        margin-top: 20px;
        padding: 10px 20px;
        background: #4A90E2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      ">Reload Page</button>
    </div>
  `;
}
```

**Benefit**: ~30-50% faster initial load time

---

## Testing Checklist

After implementing these optimizations:

### Functional Testing
- [ ] Page loads without errors
- [ ] Images display correctly
- [ ] Zoom/pan works
- [ ] Detail sidebar shows/hides
- [ ] Timeline navigation works
- [ ] Search works
- [ ] URL hash updates correctly
- [ ] Browser back/forward works

### Performance Testing
- [ ] Check browser console for errors
- [ ] Monitor FPS in Chrome DevTools Performance tab
- [ ] Check memory usage (shouldn't grow indefinitely)
- [ ] Test with `?debug=true` to see log output
- [ ] Verify animation stops when idle

### Error Testing
- [ ] Test with invalid config URL
- [ ] Test with missing data files
- [ ] Test with malformed CSV
- [ ] Verify error messages display

---

## Measurement

### Before Optimizations:
```
Initial Load Time: ______ seconds
Memory Usage: ______ MB
FPS (idle): ______ fps
FPS (animating): ______ fps
```

### After Optimizations:
```
Initial Load Time: ______ seconds (expected: 20-30% faster)
Memory Usage: ______ MB (expected: 10-20% less)
FPS (idle): 0 fps (stopped) ✅
FPS (animating): ______ fps (should be 60)
```

---

## Next Steps

After completing these 5 optimizations:

1. **Week 2**: Replace `var` with `const`/`let` across all modules
2. **Week 3**: Setup ESLint + Prettier for code quality
3. **Week 4**: Add keyboard navigation and ARIA labels
4. **Month 2**: Implement Vite build system

See `OPTIMIZATION_ANALYSIS.md` for complete roadmap.
