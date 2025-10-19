# Canvas Module Refactoring Documentation

## Overview

The original `canvas.js` file (~1,400 lines) has been refactored into 11 focused modules plus a main orchestrator. This improves maintainability, testability, and code organization.

## Module Structure

### Core Modules

#### 1. **canvas-config.js** (~150 lines)
**Purpose:** Configuration and constants management

**Responsibilities:**
- Store and manage all configuration constants
- Handle dimension calculations
- Provide scale calculations
- Update computed properties based on window size

**Key Methods:**
- `updateDimensions()` - Recalculate on window resize
- `updateScales(x)` - Update scale values based on d3 scale
- `updateFromLoaderConfig(loaderConfig)` - Set image sizes
- `updateColumns(columns)` - Update column count

**Exports:** Getters for all config values

---

#### 2. **canvas-state.js** (~150 lines)
**Purpose:** Centralized state management

**Responsibilities:**
- Manage application state (mode, init status, etc.)
- Track transform state (translate, scale)
- Handle selection state (selected image, zoom state)
- Manage interaction state (dragging, sleeping, zooming)
- Store view and hash state

**Key State Groups:**
- `state` - Application state (mode, lastZoomed, zoomingToImage, init)
- `transform` - Transform values (translate, scale, startTranslate, startScale)
- `selection` - Selection tracking (selectedImage, zoomedToImage)
- `interaction` - User interaction flags (drag, sleep, zooming, etc.)
- `view` - View-related state (extent, bottomZooming, zoomBarrierState)
- `hash` - Hash-related state (debounceHash, lastSourceEvent)

**Benefits:**
- Single source of truth for all state
- Easy to debug state changes
- Clear getter/setter pattern

---

#### 3. **canvas-data.js** (~130 lines)
**Purpose:** Data management and spatial indexing

**Responsibilities:**
- Store and manage main data arrays
- Handle t-SNE projection data
- Manage quadtree for spatial queries
- Provide data filtering and highlighting

**Key Methods:**
- `setData(data)` / `getData()` - Main data array
- `addTsneData(name, data, scale)` - Add t-SNE projection
- `updateQuadtree(data)` - Update spatial index
- `highlight()` - Apply highlight to filtered data

**Data Structures:**
- `data` - Main item array
- `timelineData` - Timeline-specific data
- `tsneIndex` - t-SNE coordinates by projection name
- `quadtree` - D3 quadtree for nearest neighbor search

---

### Feature Modules

#### 4. **canvas-annotations.js** (~280 lines)
**Purpose:** Vector drawings and image borders

**Responsibilities:**
- Draw vector annotations on canvas
- Parse and serialize vector data for URL hash
- Manage image border overlays
- Coordinate transformations (absolute ↔ relative)

**Key Methods:**
- `addVector(toScreenPoint, vizContainer, config, startNew)` - Add vector point
- `drawVectors(config)` - Render vectors to stage
- `parseVectors(v)` - Parse vector string format
- `addBorder(d, config)` - Add border to image
- `updateBorderPositions()` - Update borders on transform

**Vector Format:** `"w1,0-0,1-1,2-2,w2,3-3,4-4"`
- `w1` = weight 1
- `0-0,1-1` = vector points (x-y coordinates)

---

#### 5. **canvas-detail.js** (~80 lines)
**Purpose:** Detail sidebar management

**Responsibilities:**
- Show/hide detail sidebar
- Populate detail view with item data
- Manage multi-page navigation
- Control visibility of other items when zoomed

**Key Methods:**
- `showDetail(d, config)` - Display item details
- `hideTheRest(d)` - Fade out non-selected items
- `showAllImages()` - Restore all item visibility
- `changePage(id, page, clearBigImages, loadBigImage)` - Navigate pages

**Integration:**
- Uses Vue.js (`detailVue`) for reactive UI
- Interfaces with global `config.detail.structure`

---

#### 6. **canvas-hash.js** (~180 lines)
**Purpose:** URL hash synchronization

**Responsibilities:**
- Sync viewport state to URL hash
- Parse hash on navigation/refresh
- Trigger appropriate actions on hash change
- Calculate visible items for hash updates

**Key Methods:**
- `getView()` - Calculate visible items in viewport
- `setView(ids, duration)` - Navigate to specific items
- `onhashchange(config, utils, loadModule)` - Handle hash changes

**Hash Parameters:**
- `ids` - Comma-separated item IDs
- `mode` - Current layout mode
- `filter` - Active filters
- `search` - Search term
- `borders` - Items with borders
- `vector` - Vector annotation data

---

### Layout & Rendering Modules

#### 7. **canvas-layout.js** (~220 lines)
**Purpose:** Layout calculations and projections

**Responsibilities:**
- Calculate grid-based layouts
- Apply t-SNE projections
- Split active/inactive items
- Manage D3 scales

**Key Methods:**
- `initGroupLayout(config, timeline)` - Initialize grouped layout
- `stackLayout(data, invert)` - Grid stack layout
- `stackYLayout(data, invert)` - Y-axis based layout
- `projectTSNE()` - Apply t-SNE projection
- `split()` - Separate active/inactive items
- `makeScales(timeline)` - Update D3 scales

**Layout Types:**
- **Group Layout:** Grid-based, grouped by key
- **t-SNE Layout:** Projection-based spatial layout
- **Y Layout:** Grid with Y-axis mapped to data value

---

#### 8. **canvas-image-loader.js** (~170 lines)
**Purpose:** Progressive image loading

**Responsibilities:**
- Manage image loading queue
- Load different resolution textures
- Determine visible images
- Handle multi-resolution strategy

**Key Methods:**
- `filterVisible()` - Detect visible items in viewport
- `loadMiddleImage(d, config)` - Load medium resolution
- `loadBigImage(d, config, changePage)` - Load high resolution
- `clearBigImages()` - Remove high-res textures
- `loadImages()` - Process loading queue

**Texture Strategy:**
- **Small (256px):** Always loaded, preview quality
- **Medium (1024px):** Loaded when visible in viewport
- **Large (4000px):** Loaded when zoomed to single item

---

#### 9. **canvas-pixi-renderer.js** (~180 lines)
**Purpose:** PIXI.js rendering and animation

**Responsibilities:**
- Initialize PIXI renderer and stages
- Manage animation loop
- Handle sprite transformations
- Update stage hierarchy on zoom/pan

**Key Methods:**
- `initRenderer(config)` - Create PIXI renderer and stages
- `resize()` - Handle window resize
- `updateStageScales()` - Update stage scaling
- `updateStageTransform()` - Apply zoom/pan to stages
- `imageAnimation()` - Animate sprite positions/opacity
- `animate(loadImages)` - Main render loop

**Stage Hierarchy:**
```
stage
└── stage2 (transforms applied here)
    ├── stage3 (256px sprites, annotations, borders)
    ├── stage4 (1024px sprites)
    └── stage5 (4000px sprites)
```

---

### Interaction Modules

#### 10. **canvas-zoom.js** (~260 lines)
**Purpose:** Zoom and pan behavior

**Responsibilities:**
- Manage D3 zoom behavior
- Handle zoom/pan transformations
- Zoom to specific items
- Reset zoom to overview
- Toggle UI elements based on zoom level

**Key Methods:**
- `zoomed()` - Handle zoom/pan events
- `zoomstart()` / `zoomend()` - Zoom lifecycle
- `zoomToImage(d, duration, config)` - Zoom to single item
- `resetZoom(callback)` - Return to overview
- `setView(ids, duration)` - Zoom to multiple items

**Zoom Behavior:**
- **Extent:** 1x to 2500x (5000x on mobile)
- **Zoom Barrier:** 2x (UI changes above/below)
- **Boundary Constraints:** Prevents panning beyond edges

---

#### 11. **canvas-interaction.js** (~140 lines)
**Purpose:** User input handling

**Responsibilities:**
- Handle mouse movement and cursor
- Manage click events
- Support touch interactions
- Detect nearest item under cursor
- Handle modifier keys (shift, ctrl, alt)

**Key Methods:**
- `mousemove(vizContainer, zoom, container, d)` - Track mouse
- `setupClickEvent(...)` - Handle clicks with modifiers
- `setupTouchEvents(vizContainer)` - Touch support
- `toScreenPoint(p)` - Convert screen to data coordinates

**Click Modifiers:**
- **Shift + Click:** Toggle image border
- **Ctrl/Cmd + Click:** Add vector point
- **Ctrl/Cmd + Alt + Click:** Start new vector
- **Regular Click:** Zoom to image or reset zoom

---

### Main Orchestrator

#### 12. **canvas-modular.js** (~350 lines)
**Purpose:** Integrate all modules and provide public API

**Responsibilities:**
- Initialize all sub-modules
- Wire dependencies between modules
- Provide backwards-compatible public API
- Coordinate module interactions

**Public API Methods:**
All original `Canvas()` methods are preserved:
- `canvas.init(data, timeline, config)`
- `canvas.resize()`
- `canvas.setMode(layout)`
- `canvas.zoom` - D3 zoom behavior
- `canvas.selectedImage()` - Get selected item
- And many more...

**Initialization Flow:**
1. Create config, state, and data modules
2. Initialize PIXI renderer
3. Create all feature modules with dependencies
4. Setup interaction handlers
5. Start animation loop

---

## Migration Guide

### For Developers

**To use the new modular version:**

1. Include all module files BEFORE `canvas-modular.js`:
```html
<script src="js/canvas-config.js"></script>
<script src="js/canvas-state.js"></script>
<script src="js/canvas-data.js"></script>
<script src="js/canvas-annotations.js"></script>
<script src="js/canvas-detail.js"></script>
<script src="js/canvas-layout.js"></script>
<script src="js/canvas-image-loader.js"></script>
<script src="js/canvas-pixi-renderer.js"></script>
<script src="js/canvas-interaction.js"></script>
<script src="js/canvas-zoom.js"></script>
<script src="js/canvas-hash.js"></script>
<script src="js/canvas-modular.js"></script>
```

2. Use `Canvas()` exactly as before - API is unchanged

**To keep using the original:**
- Just keep using `canvas.js` - it still works!

---

## Benefits

### Maintainability
- **Single Responsibility:** Each module has one clear purpose
- **Easy Navigation:** Find code faster (e.g., zoom bugs → check `canvas-zoom.js`)
- **Smaller Files:** 100-300 lines vs 1,400 lines

### Testability
- **Unit Testing:** Test modules independently
- **Mocking:** Easy to mock dependencies
- **Isolated Bugs:** Easier to reproduce and fix

### Collaboration
- **Parallel Development:** Multiple devs can work on different modules
- **Clear Ownership:** Modules can be owned by team members
- **Reduced Conflicts:** Less merge conflicts in smaller files

### Performance
- **Lazy Loading:** Could load modules on demand in future
- **Code Splitting:** Easier to implement if needed
- **Tree Shaking:** Better for bundlers

---

## Dependency Graph

```
canvas-modular.js (main orchestrator)
├── canvas-config.js (no dependencies)
├── canvas-state.js (no dependencies)
├── canvas-data.js (depends on: d3)
├── canvas-annotations.js (depends on: config, state, data, PIXI)
├── canvas-detail.js (depends on: state, data, Vue)
├── canvas-layout.js (depends on: config, state, data, d3)
├── canvas-image-loader.js (depends on: config, state, data, PIXI)
├── canvas-pixi-renderer.js (depends on: config, state, data, PIXI)
├── canvas-interaction.js (depends on: config, state, data, d3)
├── canvas-zoom.js (depends on: config, state, data, d3, timeline, detail, imageLoader)
└── canvas-hash.js (depends on: config, state, data, zoom, annotations, tags, search)
```

---

## Testing Strategy

### Unit Tests
Each module can be tested independently:

```javascript
// Example: Testing canvas-config.js
describe('CanvasConfig', function() {
  it('should calculate scale1 correctly', function() {
    var config = CanvasConfig();
    config.updateScales(mockXScale);
    expect(config.scale1).to.equal(expectedValue);
  });
});
```

### Integration Tests
Test module interactions:

```javascript
describe('Canvas Integration', function() {
  it('should zoom to image correctly', function() {
    var canvas = Canvas();
    canvas.init(mockData, mockTimeline, mockConfig);
    canvas.zoomToImage(mockItem, 1000);
    // Assert expected behavior
  });
});
```

---

## Future Improvements

### Potential Enhancements
1. **TypeScript:** Add type definitions for better IDE support
2. **ES6 Modules:** Convert to import/export syntax
3. **Webpack/Rollup:** Bundle for production
4. **State Management:** Consider Redux/MobX for complex state
5. **Event Bus:** Decouple modules further with pub/sub
6. **Web Workers:** Offload calculations (t-SNE, quadtree)

### Performance Optimizations
1. **Virtual Scrolling:** Only render visible sprites
2. **Object Pooling:** Reuse PIXI objects
3. **Debouncing:** More aggressive debouncing on resize/zoom
4. **Canvas Textures:** Pre-render static elements

---

## Rollback Plan

If issues arise:
1. Revert to original `canvas.js`
2. Update HTML to use `canvas.js` instead of modular files
3. No data migration needed - API is identical

---

## Questions?

Contact: cpietsch@gmail.com

Last Updated: October 19, 2025
