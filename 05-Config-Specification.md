# Config Specification

This document captures the `config.json` contract as consumed by the legacy codebase. It is intended as a strict backward-compatibility reference for a rewrite.

## 1. Scope

- Only keys actually read by the shipped source are documented here.
- “Default” means runtime fallback behavior observed in the current code.
- “No guard” means the legacy code assumes the value exists and may fail or produce invalid CSS if it does not.

## 2. Runtime-injected fields

These are not authored in `config.json`, but the runtime adds them after config load.

| Key | Type | Default | Exact behavior | Dependencies / Source |
|---|---|---:|---|---|
| `baseUrl` | Object | runtime-computed | Added in `viz.js` after `d3.json(...)` resolves. Used for relative URL resolution. | `js/viz.js:59-61` |
| `baseUrl.path` | String | runtime-computed | Root path used by `utils.makeUrl(path, url)`. Computed by stripping both the config filename and its parent `data/` folder from the `?config=` URL. | `js/utils.js:13-25` |
| `baseUrl.config` | String | runtime-computed | Original config URL from the query string. | `js/utils.js:13-25` |

## 3. Top-level config keys

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `project.name` | String | none | Sets `document.title`. | None; read in `js/utils.js:63` |
| `loader` | Object | no guard | Root object for all external resource URLs. | Required by `viz.js`, `utils.js`, `canvas.js` |
| `filter` | Object | omitted = default tag cloud | Chooses filter UI mode. | Read in `js/viz.js:69-75` and `js/utils.js:150` |
| `delimiter` | String | `","` | Splits `keywords` in `utils.clean()`. | Depends on `keywords` column |
| `searchEnabled` | Boolean | shown if omitted | If explicitly `false`, hides `.searchbar`. | `js/utils.js:65-67` |
| `sortKeywords` | String or Array<String> | `"alphabetical"` inside tag modules | Controls default/hierarchical keyword ordering. | `js/tags.js`, `js/tags-hierarchical.js` |
| `sortArrays` | Object | alphabetical in crossfilter | Per-dimension custom sort order in crossfilter. | `js/crossfilter.js:43-45` |
| `style` | Object | no guard except annotation colors | Supplies colors/backgrounds for CSS injection and Pixi background. | `js/utils.js`, `js/canvas.js` |
| `projection` | Object | no guard | Holds grid settings. | `js/canvas.js:553,1044` |
| `detail` | Object | no guard | Detail sidebar structure definition. | `js/canvas.js:551,1158+` |

## 4. `loader` subtree

## 4.1 Core resource URLs

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `loader.timeline` | String | none | URL loaded with `d3.csv()` for timeline rows. | Required for timeline data load in `js/viz.js:63` |
| `loader.items` | String | none | URL loaded with `d3.csv()` for item metadata. | Required for core data load in `js/viz.js:64` |
| `loader.info` | String | none | URL loaded with `d3.text()` for the info sidebar markdown/text. | Read in `js/utils.js:55-58` |

## 4.2 `loader.textures.medium`

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `loader.textures.medium.url` | String | none | Passed to `LoaderSprites().load(...)`. Treated as a Pixi atlas manifest URL, not a plain image folder. | `js/viz.js:149`, `js/pixi-packer-parser.js` |
| `loader.textures.medium.size` | Number | none | Nominal medium-image dimension used in layout/stage scaling math. | `js/canvas.js:554` |

## 4.3 `loader.textures.detail`

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `loader.textures.detail.url` | String | none | Prefix for detail image URL construction: `url + id + ".jpg"` when no CSV override exists. | `js/canvas.js:1686` |
| `loader.textures.detail.csv` | String | absent | If present, names an item metadata column whose value is used as the full detail image URL. Overrides `.url`. | `js/canvas.js:1683-1684` |
| `loader.textures.detail.size` | Number | none | Nominal detail-image dimension used for scaling. | `js/canvas.js:555` |

## 4.4 `loader.textures.big` (optional)

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `loader.textures.big` | Object | omitted = no big-image tier | Enables high-resolution single-image loading. If missing, the viewer falls back to detail images in close zoom. | `js/canvas.js:1715-1717` |
| `loader.textures.big.url` | String | none if object exists | Prefix for big image URL construction: `url + id + pageSuffix + ".jpg"`. | `js/canvas.js:1726` |
| `loader.textures.big.csv` | String | absent | If present, names an item metadata column whose value is used as the full big-image URL. | `js/canvas.js:1723-1724` |
| `loader.textures.big.size` | Number | none if object exists | Nominal big-image dimension used in scaling math. | `js/canvas.js:558,1731` |

## 4.5 `loader.layouts`

If `loader.layouts` is missing entirely, the viewer falls back to:

```js
{ title: "Time", type: "group", groupKey: "year" }
```

Source:

- `js/viz.js:80-88`

### Supported layout object keys

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `loader.layouts` | Array<Object> | omitted = implicit `Time/year` layout | Defines all visible layout modes and nav buttons. | `js/viz.js:80,210-246` |
| `loader.layouts[].title` | String | none | Button label, hash `mode` value, and lookup key for registered CSV layouts. | `js/viz.js:225,240,258-264`, `js/canvas.js:1512,1562` |
| `loader.layouts[].type` | String | if missing and no `url`, patched to `"group"` | `"group"` activates grouped layout mode. | `js/viz.js:217-223`, `js/canvas.js:1039` |
| `loader.layouts[].groupKey` | String | if missing and no `url`, patched to `"year"` | Metadata column used for grouping and timeline alignment. | `js/viz.js:218-220`, `js/canvas.js:483,877,920` |
| `loader.layouts[].columns` | Number | falls back to `projection.columns` | Overrides group column count for that layout only. | `js/canvas.js:1041-1045` |
| `loader.layouts[].url` | String | none | Loads a CSV with `id`, `x`, `y` and registers it as a coordinate layout. | `js/viz.js:223-226` |
| `loader.layouts[].scale` | Number | falls back to `0.5` in coordinate mode | Controls sprite scale factor in non-group layouts. It does **not** scale coordinates. | `js/viz.js:225`, `js/canvas.js:1512` |
| `loader.layouts[].space` | Boolean | false | Adds `.space` class to nav button. The shipped CSS does not style `.space` specially. | `js/viz.js:238-240` |
| `loader.layouts[].timeline` | Boolean / truthy value | false | Keeps timeline visible in non-group layouts when truthy. | `js/canvas.js:1051` |
| `loader.layouts[].y` | String | absent | Activates grouped quantitative Y layout using the named metadata field. | `js/canvas.js:928-951,1624` |

## 5. `filter` subtree

## 5.1 Filter mode selector

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `filter.type` | String | omitted = default tag cloud | `"crossfilter"` instantiates `Crossfilter()`, `"hierarchical"` instantiates `TagsHierarchical()`, anything else falls back to `Tags()`. | `js/viz.js:69-75` |

## 5.2 Crossfilter-only keys

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `filter.dimensions` | Array<Object> | none when crossfilter is enabled | Defines one crossfilter dimension per entry. Missing dimensions will break runtime initialization. | `js/crossfilter.js:37-41` |
| `filter.dimensions[].label` | String | none | Human-readable label rendered above the filter dimension. | `js/crossfilter.js:123` |
| `filter.dimensions[].source` | String | none | Metadata column used for filtering and as the left side of `dimension:value` hash tokens. | `js/crossfilter.js:38,123` |

## 5.3 Hierarchical filter dependency

No extra config keys are read, but the item `keywords` column must use colon-separated paths for the feature to be meaningful.

## 6. `delimiter`

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `delimiter` | String | `","` | Splits the raw `keywords` string before trim/uniq/filter processing. | `js/utils.js:145`, item `keywords` column |

## 7. `searchEnabled`

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `searchEnabled` | Boolean | search visible | If set to `false`, the search bar is hidden with `display: none`. If omitted, the search bar stays visible. | `js/utils.js:65-67` |

## 8. `sortKeywords`

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `sortKeywords` | String or Array<String> | `"alphabetical"` inside tag modules | Controls tag ordering for default and hierarchical keyword UIs. | `js/tags.js`, `js/tags-hierarchical.js` |

### Accepted string values in actual code

| Value | Actual Effect |
|---|---|
| `"alphabetical"` | ascending order |
| `"alfabetical-reverse"` | descending order |
| `"count"` | descending by item count |
| `"count-reverse"` | ascending by item count |

### Compatibility note

The legacy code checks the misspelled string:

- `"alfabetical-reverse"`

A rewrite should continue to accept that exact value for backward compatibility.

### Array form

If `sortKeywords` is an array, keyword order follows that list. Unknown keywords are pushed to the end.

## 9. `sortArrays`

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `sortArrays` | Object<String, Array<String>> | omitted = alphabetical order in crossfilter | Custom value ordering keyed by crossfilter dimension source name. | `js/crossfilter.js:43-45,101-109` |

## 10. `style` subtree

Most style keys are read without guards. Missing values generally produce broken CSS or invalid rendering rather than safe defaults.

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `style.fontColor` | CSS color string | none | Tag text color and timeline year color. | `js/tags.js:43`, `js/tags-hierarchical.js:63`, `js/utils.js:82,88` |
| `style.fontColorActive` | CSS color string | none | Active/hover tag and crossfilter colors; close icon bars. | `js/utils.js:71-78` |
| `style.fontBackground` | CSS color string | none | Active/hover background for tags and crossfilter items. | `js/utils.js:74,76,78` |
| `style.textShadow` | CSS value string | none | Used as tag text shadow and, in current code, as crossfilter item background. | `js/utils.js:79,83` |
| `style.timelineBackground` | CSS color string | none | Background for `.timeline .entry`. | `js/utils.js:80` |
| `style.timelineFontColor` | CSS color string | none | Text color for `.timeline .entry`. | `js/utils.js:81` |
| `style.infoBackground` | CSS color string | none | Info sidebar background. | `js/utils.js:84` |
| `style.infoFontColor` | CSS color string | none | Info sidebar text, links, and icon stroke color. | `js/utils.js:85-87` |
| `style.detailBackground` | CSS color string | none | Detail sidebar background. | `js/utils.js:89` |
| `style.searchbarBackground` | CSS color string | none | Search input background. | `js/utils.js:90` |
| `style.canvasBackground` | Hex color string like `#000000` | none | Converted into Pixi renderer background color with `substring(1)` and `parseInt(..., 16)`. | `js/canvas.js:574-577` |
| `style.annotationLineColor` | Hex color string | `#00ff00` | Stroke color for vector annotations. | `js/canvas.js:230-232` |
| `style.annotationBorderColor` | Hex color string | `#ff0000` | Border color for Shift-click highlights. | `js/canvas.js:746-748` |

## 11. `projection` subtree

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `projection.columns` | Number | none | Default column count for group layouts when the active layout does not define `columns`. Also feeds image scale calculations. | `js/canvas.js:553,1044,453-459` |

## 12. `detail` subtree

## 12.1 Root key

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `detail.structure` | Array<Object> | none | Defines the detail sidebar row structure and which metadata fields are copied into detail state. | `js/canvas.js:551,1158-1170` |

## 12.2 Detail entry keys

| Key Name | Data Type | Default Value | Exact Behavior | Dependencies |
|---|---|---:|---|---|
| `detail.structure[].name` | String | omitted = no label | Label shown for the row when present. | `index.html` detail template |
| `detail.structure[].source` | String | none | Metadata field name, or executable expression string when `type === "function"`. | `js/canvas.js:1159`, `js/sidebars.js:16-37` |
| `detail.structure[].display` | String | none | Applied as CSS class to the row, e.g. `column` or `wide`. | `index.html` detail template |
| `detail.structure[].type` | String | none | Selects the rendering strategy. | `index.html`, `js/sidebars.js` |
| `detail.structure[].fields` | Array<String> | absent | Additional metadata fields copied into detail state if present. Supports expressions/functions that need more than one source field. | `js/canvas.js:1162-1167` |

## 12.3 Supported detail types in actual code

| Type | Exact Behavior | Source |
|---|---|---|
| `text` | Returns `item[source]` as plain text. | `js/sidebars.js:17-19` |
| `array` | Joins `item[source]` with `", "`. | `js/sidebars.js:20-22` |
| `keywords` | Joins `item[source]` with `", "` in the Vue method; template also supports keyword chips. | `js/sidebars.js:23-25`, `index.html:112-116` |
| `markdown` | Renders `marked(item[source], { breaks: true })`. | `js/sidebars.js:26-28` |
| `link` | Renders `<a :href="item[source]" target="_blank">Link</a>`. | `index.html:117-119` |
| `function` | Executes `eval(entry.source)` with a local `column = this.item`; returns `"Error"` if evaluation throws. | `js/sidebars.js:29-37` |

## 13. Data-column dependencies caused by config

| Config key | Required data column or structure |
|---|---|
| implicit fallback layout | `year` |
| all image loading | `id` |
| default and hierarchical filters | `keywords` |
| `loader.layouts[].groupKey` | the named item metadata column |
| `loader.layouts[].y` | the named item metadata column, ideally numeric |
| `filter.dimensions[].source` | the named item metadata column |
| `loader.textures.detail.csv` | a metadata column containing detail image URLs |
| `loader.textures.big.csv` | a metadata column containing big image URLs |
| `detail.structure[].source` | the named metadata field or valid expression context |
| multipage UI | `imagenum` |
| atlas manifest | sprite names matching `id` values |

## 14. Missing/fallback behavior summary

| Key | Legacy behavior if missing |
|---|---|
| `loader.layouts` | falls back to implicit grouped `Time/year` mode |
| `loader.textures.big` | big-image layer is disabled; detail image is reused |
| `loader.textures.detail.csv` | falls back to prefix + `id + ".jpg"` |
| `loader.textures.big.csv` | falls back to prefix + `id + pageSuffix + ".jpg"` |
| `filter` | default tag cloud is used |
| `searchEnabled` | search remains visible |
| `delimiter` | comma is used |
| `sortKeywords` | alphabetical order |
| `sortArrays` | alphabetical crossfilter ordering |
| `style.annotationLineColor` | green fallback |
| `style.annotationBorderColor` | red fallback |
| many other `style.*` keys | invalid CSS or broken styling due to no guard |
| `projection.columns` | layout math breaks or becomes undefined |
| `detail.structure` | detail rendering path breaks when first used |

## 15. TDD compatibility checklist for a rewrite

The new implementation should be considered config-compatible only if tests prove that:

1. configs with no `loader.layouts` still start in grouped `year` mode
2. `timeline.csv` rows using `titel` still render correctly
3. `"alfabetical-reverse"` still reverses keyword order
4. `loader.textures.medium.url` is still accepted as a Pixi atlas manifest URL
5. `detail.csv` and `big.csv` still override prefix-based image URL construction
6. `layout.scale` in coordinate layouts still changes thumbnail scale instead of rescaling coordinates
7. `detail.structure[].type = "function"` still evaluates against `column`
8. `ui=0` in the hash still hides UI chrome
9. crossfilter still serializes as `dimension:value|dimension:value`
10. existing configs can be dropped in without changing key names, nesting, or legacy quirks
