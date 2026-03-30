# Modularity and Reusability Strategy

This document describes how a new VIKUS Viewer implementation can be structured to be more modular, reusable, and easier to evolve than the legacy codebase.

It is intentionally grounded in the current architecture so that the rewrite can improve internal structure without losing the viewer's existing strengths or backward compatibility.

## 1. Why modularity matters here

The current viewer is effective, but it is hard to reuse in new contexts because many concerns are tightly coupled:

- data loading and normalization
- config parsing and fallback behavior
- layout computation
- filter and search logic
- URL/hash state
- Pixi rendering
- DOM and Vue UI updates
- interaction state such as zoom, selection, and annotations

In the legacy app, these concerns often share mutable global state. That makes it hard to:

- test core logic independently of the browser
- swap out one part of the system without editing several others
- reuse data or layout logic in other tools
- add new filters, layouts, or renderers safely
- keep backward compatibility isolated and explicit

The rewrite should keep the viewer behavior compatible while replacing this shared-state structure with clear module boundaries.

## 2. Design goals

The new viewer should be designed so that:

1. **Core logic is framework-independent**
   - Data, layout, filtering, and routing should not depend on Pixi, Vue, or direct DOM access.

2. **Modules own their own state**
   - Each subsystem should have a well-defined responsibility and avoid mutating another subsystem's internals.

3. **Communication happens through explicit interfaces**
   - Modules should communicate through function calls, events, or typed data contracts instead of globals.

4. **Compatibility logic is centralized**
   - Legacy quirks should live in a dedicated compatibility layer instead of being scattered through the app.

5. **Reuse is possible outside the main app**
   - Layout, normalization, config parsing, and filter logic should be reusable in tests, preprocessing tools, or alternative frontends.

6. **The architecture supports incremental migration**
   - The code should be replaceable subsystem by subsystem instead of requiring a full cutover in one step.

## 3. Proposed high-level architecture

The rewrite should separate the application into the following layers:

### 3.1 Data layer

Responsible for:

- loading config, items, timeline, and optional layout CSVs
- resolving relative URLs
- normalizing metadata
- validating or patching known legacy input shapes

Suggested outputs:

- normalized config
- normalized item records
- normalized timeline records
- layout input data

This layer should be usable without creating a canvas or mounting UI.

### 3.2 Domain layer

Responsible for:

- layout computation
- filtering and search logic
- selection and visibility rules
- compatibility-preserving behavior rules
- state derivation from config + data + route state

This layer should be mostly pure logic and should be the easiest layer to unit test.

### 3.3 Application state layer

Responsible for:

- tracking current mode, filters, search, selected item, zoom target, and annotations
- coordinating updates between modules
- serializing and restoring route state

This layer should be the single place where app-wide state is assembled.

### 3.4 Rendering layer

Responsible for:

- sprite creation and update
- texture loading
- viewport transforms
- animation and draw scheduling
- renderer-specific optimizations

This layer should know how to draw the current derived view state, but should not own business logic.

### 3.5 UI layer

Responsible for:

- sidebar presentation
- search input
- filter controls
- timeline DOM
- navigation buttons

This layer should emit intents such as “change mode” or “apply filter” and render state it receives from the application layer.

## 4. Natural module boundaries

The current code suggests several natural seams for a rewrite.

### 4.1 Config manager

Create a dedicated config module that:

- loads config from URL
- resolves defaults
- applies compatibility mappings
- exposes a normalized config object

This avoids spreading fallback behavior across several files.

### 4.2 Data model and loaders

Create a data module that:

- loads item CSVs and timeline CSVs
- normalizes keywords, years, ids, and image-related fields
- prepares records for later layout and rendering stages

This should also encapsulate relative path resolution from the config URL.

### 4.3 Layout engine

Move all position calculation into a layout engine with pluggable strategies, for example:

- grouped layout
- grouped quantitative Y layout
- coordinate/CSV layout
- future layouts such as map, similarity, or custom clustering

The layout engine should accept normalized items and return positions plus any layout metadata needed by the renderer or timeline.

### 4.4 Filter pipeline

Unify filtering behavior behind one interface, even if multiple implementations exist:

- default tag filter
- hierarchical tags
- crossfilter mode

This keeps the rest of the app independent from the specific filter UI or filtering algorithm in use.

### 4.5 Search service

Keep search separate from UI and rendering. The service should:

- index or scan normalized item text
- apply case-insensitive matching
- expose matched item ids or visibility sets

The search UI should simply publish search terms and display results.

### 4.6 Router and deep-link state

Create a dedicated router/state serializer for:

- `mode`
- `filter`
- `search`
- `ids`
- `borders`
- `vector`
- `ui`

This isolates deep-link compatibility and makes shared URLs easier to reason about and test.

### 4.7 Renderer adapter

Wrap Pixi-specific logic behind a renderer interface. That interface should describe operations like:

- initialize scene
- update visible items
- update positions and scale
- show detail image
- clear or refresh overlays

This allows the rest of the app to treat Pixi as an implementation detail rather than as the application core.

### 4.8 Interaction controller

Extract interaction logic for:

- pointer hover
- click and selection
- pan and zoom
- keyboard shortcuts
- annotations and vectors

This makes interaction behavior testable and portable across renderer implementations.

## 5. Reusable contracts and interfaces

Modularity improves when subsystems share simple, stable contracts.

### 5.1 Item contract

Define one normalized item shape used throughout the app:

- source metadata
- normalized keywords
- numeric or normalized year values
- image identifiers
- optional custom metadata

Runtime rendering data should not be mixed directly into this object unless intentionally modeled.

### 5.2 Render state contract

Keep temporary drawing state separate from data records, for example:

- position
- opacity
- scale
- visibility
- texture load status
- current animation target

This separation makes data reusable even when there is no renderer attached.

### 5.3 Filter adapter contract

Each filter implementation should provide the same basic operations:

- initialize from items and config
- apply or remove filters
- return active or visible ids
- serialize and restore state
- expose display metadata such as counts or labels

That allows the application shell to swap filter implementations without special cases everywhere else.

### 5.4 Layout strategy contract

Each layout mode should provide:

- a name or id
- required input fields
- a projection function from items to positioned output
- optional per-layout metadata for axes, timeline, or grouping

This allows new layouts to be added as plugins rather than special branches in a monolithic canvas file.

### 5.5 Event contract

Use a consistent event or subscription model for state changes such as:

- mode changed
- filters changed
- search changed
- selection changed
- viewport changed
- route restored

That removes the need for modules to reach into one another directly.

## 6. How to make the viewer reusable

The rewrite should aim for reuse at multiple levels.

### 6.1 Reusable as a library

The core should be embeddable in another app with an API like:

- create viewer
- load config/data
- set mode
- set filters
- focus item
- export current state

That would allow institutions or product teams to integrate the viewer inside larger systems.

### 6.2 Reusable without the default UI

The viewer should be able to run with:

- default UI
- custom sidebars
- custom filter controls
- minimal kiosk mode
- host-application-managed controls

That means the UI should be optional or replaceable, not fused to the rendering engine.

### 6.3 Reusable data and layout logic

The app should make it possible to reuse:

- config normalization
- item normalization
- layout calculations
- filter logic
- route serialization

in tests, preprocessors, server-side tools, or future editors.

### 6.4 Reusable extension points

The new architecture should make it easy to add:

- new layout strategies
- new filter types
- custom metadata renderers
- alternative image loaders
- alternative renderers or rendering backends

without changing unrelated subsystems.

## 7. Backward compatibility as a dedicated layer

A more modular system should not discard compatibility; it should isolate it.

Create a compatibility layer responsible for:

- preserving legacy config semantics
- preserving legacy hash semantics
- preserving legacy CSV expectations
- preserving known legacy field names and values
- documenting intentionally supported quirks

This allows the rest of the rewritten code to use normalized internal structures while still accepting old inputs.

Examples of behavior that belong in this layer include:

- legacy timeline field names such as `titel`
- legacy keyword sort values such as `alfabetical-reverse`
- legacy hash parsing and restoration order
- legacy layout fallback behavior

## 8. Suggested implementation patterns

The specific framework choices may change, but the architectural patterns should remain stable.

### 8.1 Prefer composition over monoliths

Instead of one giant canvas module owning everything, compose the app from smaller services:

- loader service
- config service
- layout service
- filter service
- route service
- renderer service
- UI components

### 8.2 Prefer pure derivation where possible

Functions that compute:

- positions
- visible item sets
- groups
- search results
- route state

should avoid side effects when possible. This makes them easier to test and reuse.

### 8.3 Prefer adapters around third-party libraries

Wrap Pixi, Vue, or any future framework so that:

- library-specific code stays local
- replacement is possible
- core logic does not import renderer details

### 8.4 Prefer explicit schemas

Define schemas or typed contracts for:

- config
- item records
- timeline records
- layout CSVs
- route state

This makes both compatibility and migration easier to manage.

### 8.5 Prefer dependency injection for core services

Pass in services such as loaders, router, renderer, and logger instead of importing singletons everywhere.

This improves testability and allows alternative implementations.

## 9. Phased migration approach

The rewrite should become modular in stages.

### Phase 1: stabilize contracts

- document config, data, and route contracts
- define normalized internal types
- create a compatibility layer for legacy inputs

### Phase 2: extract pure logic

- move normalization, layout, and filter logic into standalone modules
- test them independently from the UI

### Phase 3: isolate rendering

- wrap Pixi rendering behind a renderer adapter
- move texture lifecycle and animation logic into renderer-owned modules

### Phase 4: isolate routing and state

- centralize route serialization and app state coordination
- replace direct cross-module mutation with explicit events or actions

### Phase 5: make UI replaceable

- convert sidebar, timeline, and controls into consumers of app state
- ensure the app can run with custom or reduced UI shells

## 10. What success looks like

The new viewer is meaningfully modular and reusable when:

- core logic can run without Pixi or Vue
- layout strategies can be added without editing the renderer core
- filter modes share a standard adapter interface
- route parsing is isolated and testable
- compatibility quirks live in one documented layer
- the viewer can be embedded with custom UI controls
- data and rendering state are separate
- tests can validate core behavior without a browser canvas

## 11. Recommended first implementation targets

If the rewrite team wants the highest value early, start with these:

1. **Config and compatibility layer**
2. **Normalized data model**
3. **Layout engine**
4. **Filter/search pipeline**
5. **Route serializer**
6. **Renderer adapter**

That order creates reusable foundations first and reduces the risk of recreating legacy coupling inside a newer codebase.
