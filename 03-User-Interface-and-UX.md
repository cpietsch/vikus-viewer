# User Interface and UX

## 1. Main UI surfaces

The viewer UI consists of:

- `.viz` — Pixi/WebGL canvas container
- `.navi` — layout mode buttons
- `.searchbar` — collapsible search UI
- `.tagcloud` or `.crossfilter` — filtering controls
- `.timeline` — zoom-sensitive timeline overlay
- `.infobar` — project/about sidebar
- `.sidebar.detail` — item detail sidebar

The image field is rendered by Pixi; the surrounding controls stay in the DOM.

## 2. Search UX

Search is implemented in:

- `/home/runner/work/vikus-viewer/vikus-viewer/js/search.js`

### 2.1 Open/close model

Search has an explicit open state:

```js
var state = {
  open: false,
  userOpened: false
}
```

Clicking `.openbutton` toggles:

- `.searchbar.open`
- `.tagcloud.open`

When closing, the code:

- clears the input
- resets search state
- sends `tags.search("")`

### 2.2 Debounced typing

Typing is debounced by 300ms:

```js
var debounced = _.debounce(function(value) {
  tags.search(value.toUpperCase())
},300)
```

The query is always uppercased before being sent to the active filter module.

### 2.3 Search semantics

Search is:

- case-insensitive
- plain substring matching
- performed against the precomputed `d.search` string that concatenates all metadata columns

### 2.4 Hash restore behavior

If the hash contains `search=...`, `canvas.onhashchange()` restores it and also reopens the search UI through `search.setSearchTerm(searchTerm)`.

## 3. Default filter UX: tag cloud

Implemented in:

- `/home/runner/work/vikus-viewer/vikus-viewer/js/tags.js`

Behavior:

- keywords come from `d.keywords`
- clicking a tag toggles it in the active filter set
- multiple selected tags are combined with AND logic
- hovering a tag previews highlight without committing the filter
- search is combined with tag filters

Hash encoding:

- `filter=Keyword1,Keyword2`

The tag bar recenters itself based on the widths of the currently visible tags.

## 4. Hierarchical keyword UX

Implemented in:

- `/home/runner/work/vikus-viewer/vikus-viewer/js/tags-hierarchical.js`

This mode is activated by `config.filter.type === "hierarchical"`.

Behavior:

- keywords are expected to use colon-separated paths
- the runtime expands those paths into ancestor chains
- top-level terms are shown first
- selecting a parent term reveals drill-down children
- label text strips already-selected prefixes for readability

Visual indentation is applied diagonally:

```js
var level = (d.key.match(/:/g) || []).length;
var indent = level * levelIndent * 0.707;
return "translate(" + (d.x + indent) + "px," + indent + "px) rotate(45deg)";
```

Hash encoding remains comma-separated:

- `filter=Animals,Animals:Mammals`

## 5. Crossfilter UX

Implemented in:

- `/home/runner/work/vikus-viewer/vikus-viewer/js/crossfilter.js`

This replaces the keyword cloud with one list per metadata dimension.

Behavior:

- each dimension has its own active value array
- clicking a label resets that entire dimension
- clicking a value toggles it
- counts in other dimensions recompute based on the active filter state
- array-valued metadata columns are supported

Hash encoding changes to a `dimension:value` format:

- `filter=_medium:Painting|_artist:Monet`

This encoding is explicitly recognized in both `viz.js` and `canvas.js`.

## 6. Layout navigation UX

Navigation buttons are created in `viz.js:initLayouts(config)`.

Behavior:

- one button per entry in `config.loader.layouts`
- first layout is auto-selected
- if there is only one layout, `.navi` gets `.hide`
- clicking a button calls `utils.setMode(d.title, interaction=true)`

Hash synchronization:

- active layout title is written as `mode=<title>`

Compatibility note:

- `space: true` only adds a `.space` class
- the shipped CSS does not give `.space` special behavior

## 7. Timeline UX

Implemented in:

- `/home/runner/work/vikus-viewer/vikus-viewer/js/timeline.js`

Timeline is a DOM overlay appended into `.viz`. It is tied to the active grouped domain and changes detail level with zoom.

### 7.1 Semantic zoom levels

The code maps zoom level to CSS classes:

```js
var timelineScale = d3.scale
  .threshold()
  .domain([3, 10, 20])
  .range(["none", "small", "middle", "large"]);
```

The corresponding markup shows progressively more information:

- `.small` — title only
- `.middle` — title + text
- `.large` — title + text + extra

### 7.2 Hover interaction

Hovering a timeline entry sets `timelineHover = true`, which disables image hover targeting while the pointer is over the timeline.

### 7.3 Visibility rules

Timeline is shown for:

- group layouts
- non-group layouts whose layout object has a truthy `timeline`

## 8. Canvas interaction UX

## 8.1 Hover targeting

The nearest item under the pointer becomes the selection candidate through quadtree hit-testing.

Cursor states vary by modifier:

- default cursor when no actionable image is near
- `pointer` when a clickable active image is under the cursor
- `copy` while `Shift` is held
- `crosshair` while `Ctrl/Cmd` is held
- `cell` while `Ctrl/Cmd + Alt` is held

## 8.2 Click-to-zoom

A normal click on an active item:

- zooms to the item if not already in single-image mode
- or resets zoom if already approximately at the single-image zoom scale

Double-click zoom is explicitly disabled:

```js
.on("dblclick.zoom", null)
.on("dblclick", null)
```

## 8.3 Zoom threshold UI suppression

When zoom exceeds `zoomBarrier` (`2`):

- `.tagcloud` / `.crossfilter` are hidden
- `.searchbar` is hidden
- `.infobar` is forced into sneak mode

When zoom returns below that threshold, those surfaces are shown again.

## 9. Detail sidebar UX

The detail sidebar is declared in:

- `/home/runner/work/vikus-viewer/vikus-viewer/index.html`

and driven by:

- `/home/runner/work/vikus-viewer/vikus-viewer/js/sidebars.js`
- `/home/runner/work/vikus-viewer/vikus-viewer/js/canvas.js`

### 9.1 Opening behavior

`showDetail(d)`:

- resets scroll position
- unhides `.sidebar`
- applies `.sneak` automatically on mobile/iframe
- builds a detail object from `config.detail.structure`
- writes that object into `detailVue.item`

### 9.2 Supported entry render types

The Vue template supports:

- `text`
- `keywords`
- `link`
- `markdown`
- `function`

Important compatibility detail:

```js
if(entry.type === 'function') {
  const column = this.item
  const func = entry.source
  try {
    return eval(func)
  } catch (e) {
    return 'Error'
  }
}
```

That means legacy configs may depend on arbitrary expressions executed against `column`.

### 9.3 Multipage UX

If `item._imagenum > 1`, the sidebar renders page buttons. Clicking them calls:

```js
canvas.changePage(this.id, page)
```

## 10. High-resolution image UX

Once single-image mode is reached:

- all other images fade out
- detail sidebar opens
- big image loads if configured
- clicking the left/right half of the big image changes page for multipage items

The big image cursor changes to:

- `e-resize` on the right half
- `w-resize` on the left half

## 11. Info sidebar UX

The info panel is backed by `infoVue` and fed by `config.loader.info`.

The `.infobutton` toggles `.infobar.sneak`.

Markdown is rendered via `marked(...)`.

Because `index.html` sets:

```html
<base target="_blank" />
```

links in the sidebar open in a new tab by default.

## 12. Annotation UX

## 12.1 Border highlighting

Holding `Shift` while clicking an image toggles a highlight border around that item.

Those borders are persisted into the hash as:

- `borders=id1,id2,...`

## 12.2 Freehand vectors

Holding `Ctrl/Cmd` while clicking adds points to a vector path.

Holding `Ctrl/Cmd + Alt` starts a new path segment group.

The encoded hash format looks like:

- `vector=w1,0-0,1-1,2-2,w2,3-3,4-4`

That value is parsed back into weighted polyline segments and rendered as Pixi `Graphics`.

## 13. Deep-linking and URL state

The URL hash acts as the viewer’s serialized UI state.

### 13.1 Consumed parameters

| Param | Meaning |
|---|---|
| `filter` | active filter state |
| `search` | active search query |
| `mode` | active layout title |
| `ids` | target items used for view fitting |
| `borders` | highlighted image IDs |
| `vector` | annotation vectors |
| `ui` | when `0`, hides UI chrome |

### 13.2 `ui=0` location

The runtime checks `ui=0` in the **hash**, not the query string.

### 13.3 `ids` semantics

The viewer uses `ids` for deep-link restoration through `canvas.setView(ids)`.

When the viewer writes `ids` itself on zoom-end, it does **not** serialize all visible items. `canvas.getView()` returns only boundary IDs:

- leftmost
- rightmost
- topmost
- bottommost

### 13.4 Delayed restoration

If hash change includes `ids` plus a different `mode`, `filter`, or `search`, the code delays `setView()` so the new state can settle first.

## 14. Reset behavior

Pressing `Esc` triggers:

```js
search.reset();
tags.reset();
canvas.split();
window.location.hash = "";
```

A fully empty hash also triggers a broader reset path in `canvas.onhashchange()`:

- remove annotations
- reset zoom
- reset filters
- reset mode
- reset search

## 15. Backward-compatibility UX traps

For a rewrite to feel the same to existing projects, it must preserve:

1. hash-based UI state as the primary deep-link mechanism
2. `ui=0` behavior from the hash
3. crossfilter’s `dim:value|dim:value` serialization
4. search restore reopening the searchbar
5. delayed `ids` restoration when mode/filter/search also changed
6. iframe-specific detail sidebar behavior
