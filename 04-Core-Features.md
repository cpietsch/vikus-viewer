# Core Features

## 1. Group layout engine

Group layouts are the core legacy visualization mode.

If `config.loader.layouts` is missing, the viewer automatically falls back to:

```js
{
  title: "Time",
  type: "group",
  groupKey: "year"
}
```

Group mode is projected by `stackLayout(data, invert)` in `canvas.js`.

### 1.1 Projection logic

Items are grouped by `state.mode.groupKey`, then positioned into columns:

```js
d.x = startX + (i % columns) * (rangeBand / columns);
d.y = (invert ? 1 : -1) * (row * (rangeBand / columns));
```

Within each group, items are sorted by descending keyword count:

```js
year.values.sort(function (a, b) {
  return b.keywords.length - a.keywords.length;
});
```

That sorting rule is part of the visual signature and should be preserved.

## 2. Quantitative Y-group layouts

There is an undocumented but real branch in the layout engine:

```js
var layout = state.mode.y ? stackYLayout : stackLayout;
```

If a group layout object contains a `y` field, `stackYLayout()`:

- still groups on X using `groupKey`
- computes a numeric Y scale from `state.mode.y`
- sorts each group by that same numeric field

This is important for backward compatibility because existing configs may depend on it even though it is not prominently documented.

## 3. CSV coordinate layouts

The code internally calls these “tSNE” layouts, but the runtime is generic.

Any layout entry with `url` causes `viz.js` to load a CSV and register it with:

```js
canvas.addTsneData(d.title, tsne, d.scale);
```

`canvas.addTsneData()` expects `id`, `x`, and `y`, then normalizes those coordinates to `[0,1]`.

### 3.1 Important legacy behavior

`layout.scale` is **not** used to scale point coordinates. It is used later as the sprite scale factor in non-group mode:

```js
var scaleFactor = state.mode.type == "group" ? 0.9 : tsneScale[state.mode.title] || 0.5;
```

A rewrite must preserve this exact interpretation.

## 4. Filtering system

All filter implementations mutate the same per-item state:

- `d.active`
- `d.highlight`

Canvas rendering then reacts through:

- `canvas.project()`
- `canvas.highlight()`

This shared contract is what allows different filtering UIs to swap in and out.

## 5. Default tag cloud

Core behaviors:

- keywords extracted from `d.keywords`
- AND logic across selected tags
- hover preview without committing the filter
- counts recomputed from the current active set

The tag cloud also recenters itself visually after every update.

## 6. Hierarchical keywords

Hierarchical mode extends the default keyword filter with ancestor-chain expansion.

Distinctive legacy behaviors:

- a keyword like `A:B:C` is expanded into `A`, `A:B`, `A:B:C`
- the display strips already-selected ancestor prefixes
- deselecting a nested term can clear descendants sharing that prefix

The feature is implemented entirely in the client and depends on colon-separated input data.

## 7. Crossfilter

Crossfilter is the most structurally different filter mode.

Core capabilities:

- multiple independent dimensions
- metadata-value counts recomputed per dimension
- support for array-valued dimensions
- label click resets a dimension
- hash serialization as `dimension:value` pairs separated by `|`

The code also supports custom ordering through `config.sortArrays`.

## 8. Search

Search is not a separate data pipeline; it narrows the same active set used by filters.

The search index is built once in `utils.clean()` and then reused by:

- `Tags.search(...)`
- `TagsHierarchical.search(...)`
- `Crossfilter.search(...)`

This makes search behavior consistent across filter modes.

## 9. Semantic zoom and image inspection

The viewer has multiple zoom phases:

1. collection overview
2. closer inspection with lazy detail images
3. single-image focus with big-image overlay

Crossing zoom thresholds changes both rendering and UI behavior.

### 9.1 Automatic single-image mode

When zoom passes the target scale for the selected image:

```js
if (
  zoomedToImageScale != 0 &&
  scale > zoomedToImageScale * 0.9 &&
  !zoomedToImage &&
  selectedImage &&
  selectedImage.type == "image"
) {
  zoomedToImage = true;
  ...
}
```

The viewer:

- hides other items
- shows the detail sidebar
- loads a large image

## 10. Lazy image loading

This is one of the main performance features.

### 10.1 Medium layer

Base thumbnails are provided by the atlas and appear once the atlas manifest and spritesheets finish loading.

### 10.2 Detail layer

Detail images are only queued when:

- the item is visible
- the item is active
- fewer than 40 items are visible
- the detail image has not already been loaded

### 10.3 Big image layer

High-resolution images are loaded only for the currently selected single image.

## 11. Single-image detail view

When one image is focused:

1. `hideTheRest(d)` fades out all others
2. `showDetail(d)` populates Vue sidebar content
3. `loadBigImage(d)` loads the highest-resolution available asset
4. multipage controls activate if `imagenum` exists

The detail panel content is driven by `config.detail.structure`, so it is effectively a rendering engine controlled by config.

## 12. Timeline

The timeline is not just decorative. It is a zoom-sensitive explanatory layer aligned to the active grouped domain.

Key traits:

- its domain is rebuilt from the current `groupKey`
- its detail level changes with zoom
- it can be forcibly retained in non-group layouts via `layout.timeline`

The timeline’s text fields are sourced from timeline CSV rows, and the title field is the legacy `titel`.

## 13. Deep linking

URL hash state is a core product feature rather than an add-on.

It supports:

- restoring filters
- restoring search
- restoring active layout mode
- restoring viewport focus through `ids`
- restoring highlighted borders
- restoring annotation vectors
- hiding UI for embeds

This is what makes viewer states shareable and embeddable.

## 14. Border highlights and annotation vectors

### 14.1 Borders

Shift-click toggles image borders rendered as Pixi `Graphics`. Their positions are recalculated continuously so they stay attached to animated sprites.

### 14.2 Vectors

The vector system stores freehand-like paths in the hash using a compact weighted polyline syntax:

```js
// "w1,0-0,1-1,2-2,w2,3-3,4-4"
```

The current code supports:

- multiple independent paths
- weighted strokes
- relative coordinate encoding

## 15. View fitting

`canvas.setView(ids, duration)` is a central feature used by:

- deep linking
- hash restore
- click-to-zoom

It computes the bounding box of the referenced items, derives a target scale and translate, and animates the viewer to fit them into the viewport.

If only one item is present, the transition ends in single-image mode.

## 16. Core rewrite constraints

To preserve legacy behavior, a rewrite should maintain:

1. grouped layout ordering by keyword count
2. the `y`-enabled grouped layout branch
3. `layout.scale` semantics in coordinate layouts
4. single-image zoom thresholds and lazy image loading tiers
5. timeline detail levels and `titel` field usage
6. hash-driven deep linking for filters, search, modes, borders, vectors, and focused IDs
