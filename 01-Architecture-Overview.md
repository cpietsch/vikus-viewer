# Architecture Overview

## 1. Runtime shape of the application

VIKUS Viewer is a static browser application built from plain JavaScript files loaded directly by `index.html`. It combines:

- **PixiJS/WebGL** for image rendering
- **D3 v3** for data loading, DOM binding, scales, zooming, and quadtree hit-testing
- **Vue** for the detail and info sidebars
- **DOM overlays** for search, navigation, filters, and timeline UI

There is no module bundler or component system. All major subsystems expose globals and share mutable state.

## 2. Bootstrap flow

The main HTML entry point is:

- `/home/runner/work/vikus-viewer/vikus-viewer/index.html`

Scripts are loaded in-order, so later files depend on globals created by earlier ones:

```html
<script src="js/d3.v3.min.js"></script>
<script src="js/vue.min.js"></script>
<script src="js/marked.min.js"></script>
<script src="js/lodash.min.js"></script>
<script src="js/pixi.min.js"></script>

<script src="js/pixi-packer-parser.js"></script>
<script src="js/loader.js"></script>
<script src="js/canvas.js"></script>
<script src="js/timeline.js"></script>
<script src="js/search.js"></script>
<script src="js/tags.js"></script>
<script src="js/tags-hierarchical.js"></script>
<script src="js/crossfilter.js"></script>
<script src="js/utils.js"></script>
<script src="js/modernizr-custom.js"></script>

<script src="js/sidebars.js"></script>
<script src="js/viz.js"></script>
```

Application startup begins in `/home/runner/work/vikus-viewer/vikus-viewer/js/viz.js`:

```js
utils.welcome();

var data;
var tags;
var canvas;
var search;
var ping;
var timeline;
var config;

if (Modernizr.webgl && !utils.isMobile()) {
  init();
}
```

`init()` then performs the full boot pipeline:

1. Construct subsystems: `Canvas()`, `Search()`, `Timeline()`, `utils.ping()`
2. Resolve base paths from the `?config=` query string
3. Load `config.json` with `d3.json(...)`
4. Inject runtime-only `config.baseUrl`
5. Apply config-driven CSS and load info markdown in `utils.initConfig(config)`
6. Load timeline CSV
7. Load item CSV
8. Normalize item data with `utils.clean(data, config)`
9. Instantiate the filter UI (`Tags`, `TagsHierarchical`, or `Crossfilter`)
10. Initialize search, canvas, and layouts
11. Apply hash-based view state
12. Load medium sprite textures and wake the renderer

## 3. State ownership

The codebase uses a global, mutable state model.

### Globals created in `viz.js`

- `data`
- `tags`
- `canvas`
- `search`
- `ping`
- `timeline`
- `config`

### Utility singleton

`/home/runner/work/vikus-viewer/vikus-viewer/js/utils.js` creates:

```js
window.utils = { config: {} };
```

`utils.config` becomes the shared live config object.

### Vue sidebars

`/home/runner/work/vikus-viewer/vikus-viewer/js/sidebars.js` defines:

- `window.detailVue`
- `window.infoVue`

Both are mutated directly from other modules, especially `canvas.js` and `utils.js`.

### Canvas-owned runtime state

`Canvas()` in `/home/runner/work/vikus-viewer/vikus-viewer/js/canvas.js` owns most of the rendering and interaction state:

- viewport transform: `translate`, `scale`
- layout mode: `state.mode`
- image sizes: `imageSize`, `imageSize2`, `imageSize3`
- grid density: `columns`
- selection: `selectedImage`, `zoomedToImage`
- lazy-loading queue: `loadImagesCue`
- annotation state: `annotationVectors`, `imageBorders`
- layout caches: `canvasDomain`, `timeDomain`, `tsneIndex`, `tsneScale`
- Pixi objects: `renderer`, `stage`, `stage2`, `stage3`, `stage4`, `stage5`

## 4. Rendering pipeline

## 4.1 Pixi/WebGL layers

`canvas.init()` creates a `PIXI.Renderer` and the display hierarchy:

```js
renderer = new PIXI.Renderer(renderOptions);

stage = new PIXI.Container();
stage2 = new PIXI.Container();
stage3 = new PIXI.Container();
stage4 = new PIXI.Container();
stage5 = new PIXI.Container();

stage.addChild(stage2);
stage2.addChild(stage3);
stage2.addChild(stage4);
stage2.addChild(stage5);
```

The practical layer breakdown is:

- `stage3`: medium atlas sprites, highlight borders, annotation vectors
- `stage4`: lazily loaded detail-resolution images
- `stage5`: single-image high-resolution overlay

`stage2` receives pan/zoom transforms from D3 zoom and acts as the shared transformed container.

## 4.2 DOM overlays

The rest of the interface stays in the DOM:

- `.navi` layout buttons
- `.searchbar`
- `.tagcloud` or `.crossfilter`
- `.timeline`
- `.infobar`
- `.sidebar.detail`

This means the app uses a hybrid rendering model: WebGL for the image field, DOM for chrome and text.

## 4.3 Sprite/image flow

When `canvas.init()` runs, every item initially gets a placeholder Pixi sprite:

```js
data.forEach(function (d, i) {
  var sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  sprite.scale.x = d.scaleFactor;
  sprite.scale.y = d.scaleFactor;
  sprite._data = d;
  d.sprite = sprite;
  stage3.addChild(sprite);
});
```

Later, once the medium atlas has loaded, `viz.js` replaces those white textures by matching atlas textures back onto items by `id`.

## 4.4 Continuous animation

Rendering is driven by a perpetual animation loop:

```js
function animate(time) {
  requestAnimationFrame(animate);
  loadImages();
  if (sleep) return;
  sleep = imageAnimation();
  renderer.render(stage);
}
```

This is a classic invalidation loop:

- item properties are mutated imperatively
- `imageAnimation()` eases actual sprite position/alpha toward target values
- `sleep` suppresses rendering when nothing is changing

## 5. Data flow from load to draw

## 5.1 Load

`viz.js` loads:

- config via `d3.json(...)`
- timeline via `Loader(...)`
- items via `Loader(...)`
- medium atlas via `LoaderSprites()`

## 5.2 Normalize

`utils.clean(data, config)` mutates each row:

```js
d.search = Object.keys(d).map(function (e) { return d[e] }).join(' - ').toUpperCase()
d.i = i;
d.keywords = _(d.keywords || "None")
  .chain()
  .split(config.delimiter || ",")
  .map(_.trim)
  .uniq()
  .filter(function (d) { return d !== "" })
```

It also injects internal state such as:

- `active`
- `highlight`
- `alpha`
- `loaded`
- `page`
- `scaleFactor`
- `x`
- `y`
- `order`

## 5.3 Filter and search

The active filter module mutates `d.active` and `d.highlight`. Search further constrains the same active set using uppercase substring search against `d.search`.

## 5.4 Project to layout

`canvas.project()` chooses the layout algorithm:

- `canvas.split()` for grouped layouts
- `canvas.projectTSNE()` for CSV coordinate layouts

## 5.5 Draw

Projection functions compute target positions:

- `d.x`, `d.y`
- `d.x1`, `d.y1`

Those values then drive actual Pixi sprite positions during the animation loop.

## 6. Layout system

## 6.1 Group layouts

Grouped layouts use `state.mode.groupKey`. The default fallback mode is:

```js
{
  title: "Time",
  type: "group",
  groupKey: "year"
}
```

Positioning happens in `stackLayout(data, invert)`, which groups objects by `groupKey` and lays them out in columns inside each group.

## 6.2 Quantitative grouped layouts

There is an undocumented but real branch for group layouts that also specify `y`. In that case `canvas.split()` switches to `stackYLayout()`:

```js
var layout = state.mode.y ? stackYLayout : stackLayout;
```

That mode groups on X and uses a numeric scale on Y based on `state.mode.y`.

## 6.3 CSV coordinate layouts

When a layout has `url`, `viz.js` loads a CSV and registers it via:

```js
canvas.addTsneData(d.title, tsne, d.scale);
```

`canvas.addTsneData()` expects:

- `id`
- `x`
- `y`

and normalizes those coordinates into `[0,1]`.

## 7. User interaction systems

## 7.1 Hover targeting

Hover uses a D3 quadtree and nearest-neighbor lookup:

```js
var best = utils.nearest(
  p[0] - imgPadding,
  p[1] - imgPadding,
  { d: distance, p: null },
  quadtree
);
```

This makes the nearest visible image the hover target.

## 7.2 Zoom and pan

D3 zoom owns the interaction model, but Pixi stages are updated inside `zoomed()`. The viewer:

- clamps horizontal pan
- tracks zoom thresholds
- hides filter/search UI above `zoomBarrier`
- automatically enters image-detail mode past the single-image zoom threshold

## 7.3 Search

`Search()` in `/js/search.js`:

- toggles `.searchbar.open`
- debounces input by 300ms
- forwards uppercase queries to `tags.search(...)`
- clears the query when closing

## 7.4 Filter modes

The active filter module is chosen at boot:

- `Tags()` for default keyword cloud
- `TagsHierarchical()` for colon-separated keyword hierarchies
- `Crossfilter()` for faceted metadata dimensions

All three expose compatible methods such as:

- `init(...)`
- `setFilterWords(...)`
- `getFilterWords()`
- `getSearchTerm()`
- `search(...)`
- `reset()`

## 7.5 Timeline

`Timeline()` renders a DOM overlay appended into `.viz`. It scales its presentation level by zoom and hides itself when the active layout is not compatible:

```js
timeline.setDisabled(layout.type != "group" && !layout.timeline);
```

## 7.6 Detail panel

When one item is selected, `showDetail(d)` populates `detailVue.item`, opens the sidebar, and starts loading the high-resolution image.

## 7.7 Multipage objects

If `imagenum` exists, the viewer supports page switching from:

- sidebar page buttons
- left/right half clicks on the big image

## 7.8 URL routing / deep links

The hash is the main state transport. `viz.js` and `canvas.js` read/write:

- `filter`
- `search`
- `mode`
- `ids`
- `borders`
- `vector`
- `ui`

Notably, `ui=0` is parsed from the **hash**, not the query string:

```js
const params = new URLSearchParams(window.location.hash.slice(1));
if (params.get('ui') === '0') deactivateUI();
```

## 8. Backward-compatibility traps

A rewrite must preserve several legacy quirks because they are part of the actual behavior:

1. `baseUrl.path` is derived by stripping both `config.json` and its parent `data/` folder
2. timeline rows use `titel`, not `title`
3. reverse alphabetical keyword sorting checks for the misspelled string `"alfabetical-reverse"`
4. `detail.structure[].type === "function"` uses `eval(...)`
5. `loader.textures.medium.url` is treated as a Pixi atlas manifest URL
6. `layout.scale` affects sprite scale in CSV layouts; it does not rescale coordinates
7. `ids` deep linking is based on view-fit behavior, not merely “selected object ID”
