# Rewrite Migration Checklist

This is a condensed checklist for the rewrite team. It focuses on preserving the legacy viewer's externally visible behavior while replacing the implementation safely.

## 1. Lock compatibility scope

- [ ] Treat existing `config.json` files as the primary compatibility target
- [ ] Preserve current URL/hash-driven behavior before improving internals
- [ ] Keep legacy field names and values that existing projects depend on:
  - [ ] timeline field `titel`
  - [ ] `sortKeywords: "alfabetical-reverse"`

## 2. Recreate the config contract first

- [ ] Support the current top-level config shape:
  - [ ] `project`
  - [ ] `loader`
  - [ ] `filter`
  - [ ] `delimiter`
  - [ ] `searchEnabled`
  - [ ] `sortKeywords`
  - [ ] `sortArrays`
  - [ ] `style`
  - [ ] `projection`
  - [ ] `detail`
- [ ] Preserve `loader.layouts` fallback to implicit `Time/year` group mode
- [ ] Preserve `layout.scale` semantics in coordinate layouts as thumbnail scale, not coordinate rescaling
- [ ] Preserve `loader.textures.detail.csv` and `loader.textures.big.csv` overrides over prefix-based image URL construction
- [ ] Preserve `detail.structure` rendering behavior

## 3. Preserve data ingestion contracts

- [ ] Keep item CSV ingestion compatible with existing columns, especially `id`, `keywords`, `year`, and `imagenum`
- [ ] Keep timeline CSV compatible with `titel`, `text`, and `extra`
- [ ] Preserve keyword splitting via `delimiter`
- [ ] Preserve current relative path resolution behavior from config load

## 4. Preserve image and asset loading behavior

- [ ] Keep medium texture loading compatible with the current atlas manifest contract
- [ ] Preserve sprite-to-item matching by `id`
- [ ] Keep detail-image fallback behavior unchanged
- [ ] Keep optional big-image tier behavior unchanged
- [ ] Preserve multipage image naming and page selection behavior

## 5. Rebuild layout behavior accurately

- [ ] Preserve grouped layout mode using `groupKey`
- [ ] Preserve grouped layout ordering behavior
- [ ] Preserve grouped quantitative `y` layout behavior
- [ ] Preserve coordinate-layout CSV support with `id/x/y`
- [ ] Preserve timeline visibility rules across layout types

## 6. Rebuild filtering and search behavior

- [ ] Preserve default tag filtering behavior
- [ ] Preserve hierarchical keyword expansion behavior
- [ ] Preserve crossfilter hash serialization format: `dimension:value|dimension:value`
- [ ] Preserve search as case-insensitive substring matching across combined metadata text
- [ ] Preserve search and filter restoration from hash state

## 7. Preserve interaction and deep-link behavior

- [ ] Keep hash as the primary state transport for:
  - [ ] `filter`
  - [ ] `search`
  - [ ] `mode`
  - [ ] `ids`
  - [ ] `borders`
  - [ ] `vector`
  - [ ] `ui`
- [ ] Preserve `ui=0` behavior
- [ ] Preserve delayed `ids` restoration when mode, filter, or search also changes
- [ ] Preserve click-to-zoom and single-image transition behavior
- [ ] Preserve annotation border and vector encoding for legacy shared links

## 8. Preserve detail and info panel behavior

- [ ] Keep detail rendering driven by `detail.structure`
- [ ] Preserve markdown, link, keywords, and text rendering modes
- [ ] Preserve multipage sidebar controls
- [ ] Preserve info panel markdown loading and rendering behavior

## 9. Define acceptance tests before switching implementations

- [ ] Build fixture configs covering:
  - [ ] default grouped mode
  - [ ] coordinate layout mode
  - [ ] hierarchical keywords
  - [ ] crossfilter
  - [ ] detail CSV override
  - [ ] big-image CSV override
  - [ ] multipage items
- [ ] Add compatibility checks for:
  - [ ] `titel`
  - [ ] `alfabetical-reverse`
  - [ ] `ui=0`
  - [ ] hash restore
  - [ ] atlas manifest loading
  - [ ] `layout.scale`
  - [ ] fallback `loader.layouts`

## 10. Rollout

- [ ] Implement a compatibility layer first
- [ ] Test old sample datasets and configs unchanged
- [ ] Only remove legacy quirks behind explicit opt-in flags
- [ ] Do not rename config keys, hash params, or CSV expectations in v1 of the rewrite
