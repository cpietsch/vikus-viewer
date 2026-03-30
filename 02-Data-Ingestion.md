# Data Ingestion

## 1. Resource classes loaded at runtime

The legacy viewer ingests the following asset types:

1. `config.json`
2. item metadata CSV
3. timeline CSV
4. info markdown/text
5. medium sprite atlas manifest plus spritesheet images
6. detail JPGs
7. big/high-resolution JPGs
8. optional coordinate-layout CSVs

There is no runtime pipeline in this repository that generates atlases or textures. The application only consumes pre-generated outputs.

## 2. Config loading

The first loaded resource is config:

```js
d3.json(baseUrl.config || "data/config.json", function (config) {
  config.baseUrl = baseUrl;
  utils.initConfig(config);
  ...
});
```

Source:

- `/home/runner/work/vikus-viewer/vikus-viewer/js/viz.js`

If no `?config=` query parameter is supplied, the viewer defaults to:

- `data/config.json`

## 3. Path resolution behavior

Relative paths are not resolved against the config file directory directly. Instead, `utils.getDataBaseUrl()` removes both:

1. the config file name
2. its parent `data` folder

```js
if (config) {
  path = config.split("/")
  path.pop() // remove config file
  path.pop() // remove data folder
  path = path.join("/") + "/"
}
```

That base path is then used by `utils.makeUrl(path, url)`.

This is a major compatibility detail: a rewrite that resolves relative URLs differently will break existing data packages.

## 4. Timeline CSV ingestion

Timeline data is loaded first:

```js
Loader(makeUrl(baseUrl.path, config.loader.timeline)).finished(function (timeline) {
```

The custom loader in `/js/loader.js` uses:

```js
d3.csv(url)
```

Expected runtime fields are:

- grouping key matching the active layout’s `groupKey` (default `year`)
- `titel`
- `text`
- `extra`

Compatibility warning: `timeline.js` reads `d.titel`, not `d.title`.

## 5. Item CSV ingestion

Item metadata is loaded immediately after timeline data:

```js
Loader(makeUrl(baseUrl.path, config.loader.items)).finished(function (data) {
```

This is also plain CSV via `d3.csv(...)`.

### 5.1 Required item fields used by runtime logic

| Field | Why it matters |
|---|---|
| `id` | joins atlas textures to rows, builds image URLs, supports deep links |
| `keywords` | default and hierarchical filtering |
| `year` | required by the implicit fallback layout |
| `imagenum` | enables multipage big-image behavior |

### 5.2 Search index generation

Every row is converted into a single uppercase searchable string:

```js
d.search = Object.keys(d).map(function (e) { return d[e] }).join(' - ').toUpperCase()
```

This means:

- every CSV column is searchable
- search is case-insensitive by uppercasing both data and query
- search is simple substring matching

## 6. Keyword normalization

`utils.clean(data, config)` transforms the raw `keywords` column:

```js
d.keywords = _(d.keywords || "None")
  .chain()
  .split(config.delimiter || ",")
  .map(_.trim)
  .uniq()
  .filter(function (d) { return d !== "" })
```

Effects:

- missing `keywords` becomes `"None"`
- delimiter defaults to `,`
- whitespace is trimmed
- duplicates are removed
- empty tokens are discarded

### Hierarchical keyword expansion

If `config.filter.type === "hierarchical"`, each colon-separated keyword is expanded into all ancestor paths:

```js
var split = d.split(":")
return split.map(function(d,i) { 
  return split.slice(0,i+1).join(":")
})
```

So:

- `Animals:Mammals:Dog`

becomes:

- `Animals`
- `Animals:Mammals`
- `Animals:Mammals:Dog`

## 7. Internal item-state augmentation

During cleaning, the viewer injects internal fields onto every item:

- `i`
- `_year`
- `_keywords`
- `alpha`
- `active`
- `loaded`
- `type = "image"`
- `page = 0`
- `scaleFactor = 0.9`
- `x`
- `y`
- `order`

These are not source-data columns, but the runtime relies on them after load.

## 8. Info content ingestion

`utils.initConfig(config)` loads the info panel from `config.loader.info`:

```js
d3.text(utils.makeUrl(config.baseUrl.path, config.loader.info), function (error, text) {
  if (text) infoVue.info = text
})
```

That content is rendered through `marked(...)` in the Vue sidebar.

## 9. Medium sprite atlas ingestion

After item data is ready, `viz.js` loads the medium sprite set:

```js
LoaderSprites()
  .progress(function (textures) { ... })
  .finished(function () { ... })
  .load(makeUrl(baseUrl.path, config.loader.textures.medium.url));
```

The path supplied by `config.loader.textures.medium.url` is treated as a **Pixi atlas manifest**, not a plain directory.

The custom parser in `/js/pixi-packer-parser.js` only activates when the loaded JSON includes:

```js
resource.data.meta &&
(resource.data.meta.type === "pixi-packer" || 
 resource.data.meta.type === "sharpsheet")
```

and then iterates:

```js
resource.data.spritesheets.forEach(function (spritesheet) {
  ...
  spritesheet.sprites.forEach(function (sprite) {
    ...
    res.textures[sprite.name] = new PIXI.Texture(...)
  });
});
```

### 9.1 Atlas contract that must be preserved

To be compatible with the current viewer:

- the manifest must be JSON
- `meta.type` must be `pixi-packer` or `sharpsheet`
- `spritesheets[]` must exist
- sprite names must match item `id` values

That last point matters because `viz.js` assigns textures by atlas key:

```js
Object.keys(textures).forEach(id => {
  const items = idToItemsMap.get(id);
  if (items) {
    items.forEach(item => {
      item.sprite.texture = textures[id];
    });
  }
});
```

## 10. Detail-image ingestion

The medium atlas is not the only image source. The viewer lazily loads larger images as the user zooms in.

Detail images are loaded by `loadMiddleImage(d)` in `canvas.js`:

```js
if (config.loader.textures.detail.csv) {
  url = d[config.loader.textures.detail.csv];
} else {
  url = config.loader.textures.detail.url + d.id + ".jpg";
}
```

So the runtime supports two detail-image modes:

### Mode A: prefix + id convention
- URL becomes `detail.url + id + ".jpg"`

### Mode B: per-row URL column
- `detail.csv` names a metadata column whose value is treated as the full image URL

Loaded detail images are attached as Pixi sprites to `stage4`.

## 11. Big-image ingestion

Once the user reaches single-image mode, `loadBigImage(d)` may fetch an even larger asset:

```js
if (!config.loader.textures.big) {
  loadMiddleImage(d);
  return;
}
```

If `loader.textures.big` exists:

```js
if (config.loader.textures.big.csv) {
  url = d[config.loader.textures.big.csv];
} else {
  url = config.loader.textures.big.url + d.id + page + ".jpg";
}
```

The `page` suffix is computed as:

```js
var page = d.page ? "_" + d.page : "";
```

So the legacy naming convention is:

- first page: `id.jpg`
- later pages: `id_1.jpg`, `id_2.jpg`, ...

## 12. Multipage support

Multipage behavior depends on the item column `imagenum`.

When present:

- detail sidebar shows page buttons
- big image becomes interactive
- clicking left/right halves cycles pages
- current page is tracked in `d.page`

## 13. Optional coordinate-layout CSVs

`config.loader.layouts[].url` points to CSV files used for non-group layouts. `viz.js` loads them with `d3.csv(...)` and registers them via:

```js
canvas.addTsneData(d.title, tsne, d.scale);
```

`canvas.addTsneData()` expects:

- `id`
- `x`
- `y`

and normalizes the coordinates to `[0,1]`.

Items that are missing from a coordinate CSV are actively hidden in that layout:

```js
if (tsneEntry) {
  ...
} else {
  d.alpha = 0;
  d.x = 0;
  d.y = 0;
  d.active = false;
}
```

## 14. Lazy/dynamic loading behavior

### 14.1 Base thumbnails

Loaded once from the atlas.

### 14.2 Detail images

Loaded when:

- the viewer is zoomed in enough
- the image is visible
- the visible object count is low enough

Source:

```js
if (visible.length < 40) {
  ...
  else if (d.visible && !d.loaded && d.active) loadImagesCue.push(d);
}
```

The queue is then drained one image at a time inside the animation loop:

```js
if (loadImagesCue.length) {
  var d = loadImagesCue.pop();
  if (!d.loaded) {
    loadMiddleImage(d);
  }
}
```

### 14.3 Big images

Only loaded for the currently selected single image.

## 15. Texture sizing and layout math

The following config values are not just metadata; they directly affect projection and scale computations:

```js
columns = config.projection.columns;
imageSize = config.loader.textures.medium.size;
imageSize2 = config.loader.textures.detail.size;
if (config.loader.textures.big) {
  imageSize3 = config.loader.textures.big.size;
}
```

A compatible rewrite must preserve the fact that these sizes feed layout math, hit thresholds, and stage scaling, not only image loading.

## 16. What this repository does not contain

The problem statement mentions “sprite sheet generation logic” and “texture packing.” In this repository, that logic is only visible indirectly through the **runtime parser contract** in `pixi-packer-parser.js`. The actual offline atlas generation pipeline is not present here.

For rewrite purposes, the compatibility requirement is therefore:

- preserve the current manifest and atlas consumption contract
- preserve ID-to-sprite matching
- preserve detail/big image fallback rules
