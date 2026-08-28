# [v5.0.0](https://github.com/MyScript/iinkTS/tree/v5.0.0)

See [MIGRATION.md](./MIGRATION.md) for step-by-step upgrade instructions.

## Breaking Changes

### Internal layout: `src/utils/` dissolved
Every helper moved to the lowest layer its inputs allow, and the new `core` layer may not import from anywhere else in the library. The exported surface is unchanged — the same 787 names before and after — so this only affects code that imported a deep path rather than the package root.
- `src/utils/` no longer exists; helpers now live in `core/geometry`, `core/math`, `core/std`, `core`, `client`, `export` and `browser`
- `TPoint`, `TPointer`, `TSegment`, `TBox` and `TOBB` moved from `symbol/primitives` to `core/geometry`
- see [MIGRATION.md](./MIGRATION.md) for the full mapping

### History: diff-only undo/redo
History entries no longer store a full `Model`/`IIModel` snapshot — only the diff needed to undo/redo, cutting the cost of pushing entries on large documents.
- `TIHistoryStackItem`/`TIIHistoryStackItem` removed
- `history.push(model, changes)` → `history.push(changes)`
- `undo()`/`redo()` return `TIHistoryChanges`/`TIIHistoryChanges` directly instead of `{ model, changes }`
- `IHistoryManager.updateModelStack()`/`IIHistoryManager.update()` removed (no snapshot left to sync)
- `TIIHistoryChanges.updated`: `TSymbol[]` → `{ oldSymbols, newSymbols }`
- `TIIHistoryChanges.style`: `{ style?, fontSize? }` → `{ oldStyles?, newStyles?, oldFontSizes?, newFontSizes? }`
- `InteractiveInkCanvas.undo()`/`redo()` replay the returned changes on the live model instead of swapping in a cloned snapshot; local replay is independent from the backend replay message

### Shape ↔ edge connections
- `IIConnectorManager.updateAnchoredEdges()` returns `TAnchoredEdgesUpdateResult` (ids of the pre-convert edge strokes it moved) instead of `void` — callers must include them in their history entry and backend transform message

### Export: one `exportAs`, one `download`
Every export on `InteractiveInkCanvas` now goes through two functions instead of nine. The nine
removed methods have **no compatibility shim**.

| Removed | Replacement |
|---|---|
| `downloadAsJson(selection?)` | `download("json", { scope })` |
| `downloadAsSVG(selection?)` | `download("svg", { scope })` |
| `downloadAsPNG(selection?)` | `download("png", { scope })` |
| `downloadAsText(selection?)` | `download("text", { scope })` |
| `printAsPDF(selection?, options?)` | `download("pdf", { scope, ...options })` |
| `toMarkdown()` | `exportAs("markdown")` |
| `toMermaid()` | `exportAs("mermaid")` |
| `toPlantUML()` | `exportAs("plantuml")` |
| `toLLM()` | `exportAs("llm")` |

- the positional `selection: boolean` argument is replaced by `{ scope: "all" | "selection" }`, plus `{ symbols: TSymbol[] }` for an explicit list (`symbols` wins over `scope`) and `{ filename }` on `download`
- `exportAs`/`download` are always `async`, including for `json`/`svg`/`png` which used to be synchronous. `png` in particular was asynchronous in disguise before (it went through `image.onload` and returned before the bitmap existed); `exportAs("png")` now resolves with a fully rasterized `Blob`
- `exportAs("pdf")` does not compile — printing produces no in-memory value, `pdf` only exists on `download`
- `export(mimeTypes)` is unchanged and stays public as the low-level server export
- default download file names switched from a locale-formatted date to a truncated ISO instant (`iink-ts-2026-08-26T14-30-15.svg`). The previous name went through `toLocaleDateString` with time fields, which produced `iink-ts-26/08/2026 14:30:15.svg` under `fr-FR` — slashes and colons in a file name, with browser-dependent behavior
- `PDFExportManager.openExportDialog(onConfirm, onCancel?)` gained an optional second callback, fired when the dialog is dismissed, so `download("pdf")` settles on cancellation instead of hanging forever
- `TExportActionItemsConfig`/`TContextExportItemsConfig` gained `markdown`, `mermaid`, `plantuml`, `llm` and `jiix` (all enabled by default). `markdown` is only built when `text` recognition is enabled, `mermaid`/`plantuml` only when `shape` is

### Bug Fixes
- fix(menu): `ShapeTool`/`EdgeTool` picking a shape or edge type never closed the dropdown — the click handler queried `.sub-menu-content-shape`/`-edge` to remove the `open` class, but the class actually toggled by the trigger and by outside-clicks is the unsuffixed `.sub-menu-content`, so the query silently matched nothing. Also, `update()` in both only added `active` to the newly-selected button without first clearing a previously-active one, so switching shape/edge via `update()` (not via a click) could leave two buttons marked active at once. Both bugs were copy-pasted identically into both files; fixed in both
- fix(canvas,client): `CanvasEvent.emit()`/`ClientEvent.emit()` used a truthy check (`data ? { detail: data } : undefined`) to decide whether to attach the event payload, so any falsy value — `emitIdle(false)`, `0`, `""` — was silently delivered to listeners as `detail: null` instead of the real value. Both now check `data !== undefined`
- fix(client): `HTTPClientV2.post()` was missing the runtime check (already present in `HTTPClientV1.post()`) that strips `recognition.export.jiix.text.lines` when talking to a server below 3.2.0. Its `Configuration` class only applied this gate when the caller hardcoded `server.version` upfront — the common case, where the version is auto-detected via the client's own lazy `getApiInfos()` fetch, skipped it entirely, sending an unsupported field to older servers
- fix(client): `HTTPClientV1.post()`'s error branch unconditionally called `response.json()` on a non-2xx response. A non-JSON error body (an HTML error page from a reverse proxy, plaintext, or an empty body on a raw 502/503) threw an uncaught `SyntaxError`, which `tryFetch()` then reported as the generic "unable to establish a connection" error, discarding the real HTTP status and message. `HTTPClientV2` already handled this correctly by checking the response's content-type first. Extracted shared `parseApiError(response)` (`src/client/ClientApiError.ts`) used by both clients' `post()`
- fix(client): `WebSocketClient`/`WebSocketSSRClient` ping/pong liveness counter was reset on any non-`pong` message and left untouched on an actual `Pong` — the exact inverse of correct keepalive semantics. A healthy connection exchanging only ping/pong during idle periods self-disconnected with `MAXIMUM_PING_REACHED` after `maxPingLostCount * pingDelay` (default 5 min) even though the server kept answering every ping. Now resets only on `Pong` receipt, so the connection only closes when the server actually stops responding
- fix(client): `WebSocketClient`/`WebSocketSSRClient`/`HTTPClientV1`/`HTTPClientV2` constructors logged the raw configuration object — including `server.applicationKey`/`hmacKey` in plaintext — at `info` level. Silent by default (the `CLIENT` logger category defaults to `error`), but any integrator raising it to `info`/`debug` to troubleshoot a session printed the secret to the console. Constructor logging now redacts both fields via the new `redactServerSecrets` util before logging
- feat(utils): new exported `redactServerSecrets(config)` — returns a shallow copy with `server.hmacKey`/`server.applicationKey` replaced by `"[REDACTED]"` when present, for safe logging of client configuration objects
- fix(manager): `IDebugSVGManager.drawRecognitionBox()`'s drag-to-move handler registered 3 brand-new anonymous `pointerup`/`pointerleave`/`pointercancel` listeners on the shared `renderer.layer` on every `pointerdown`, none of which were ever removed — a permanent 3-listener leak per drag on the debug recognition-box info panel. Handlers are now stable references shared across drags, so re-registering them is a no-op and each drag's own `pointerup`/`pointerleave`/`pointercancel` correctly removes itself along with `pointermove`
- fix(manager): `EraseManager.end()` used `this.deletingIds.values().toArray()` (ES2024 `Iterator.prototype.toArray`), unsupported in Safari <18.4 and older Firefox/Chrome — erasing on `InkCanvas` could throw at runtime in those browsers. Replaced with `[...this.deletingIds]`
- fix(menu): `IIMenuContext.destroy()` cleared its DOM but never called `.destroy()` on its `contextMenus` map entries (edit/decorator/reorder/export/convert/math/duplicate/remove/selectAll), nor cleared the map itself. Every `IIMenuManager.setConfig()` call leaked a growing set of `document`-level listeners closing over detached context-menu DOM. Now cascades `.destroy()` to every entry before clearing the map
- fix(renderer): `SVGRenderer.pan()` never called `#reconcileVirtualization()`, unlike `setViewBox()`/`setZoom()` — panning-only viewport changes (`canvas.pan()`, arrow-key panning, `ensurePointVisible()`) left symbols that scrolled into/out of view stuck attached/detached from the DOM until an unrelated zoom or `setViewBox` call happened to run. Regression in the viewport-culling perf work for large documents (4000+ strokes)
- fix(components): `Minimap`'s `MutationObserver` deep-cloned (`cloneNode(true)`) and recursively re-stripped ids from the *entire* rendering layer on every `childList` mutation of the main canvas — fired on every `drawSymbol`/virtualization attach-detach, reintroducing the full-scene-cost-per-mutation problem the SVG virtualization work was meant to eliminate. Sync is now coalesced to at most once per animation frame
- fix(history): `IIHistoryManager` now correctly restores the previous style when reversing a `style` change (was a no-op)
- fix(history): `IIHistoryManager` populates `possibleUndoCount`

## Features

### Shape ↔ edge connections
- feat(connector): edges follow their connected shape when it is translated/resized/rotated, before Convert (raw ink strokes) as well as after (`TEdgeLine`/`TEdgePolyLine`/`TEdgeArc` with `startAnchor`/`endAnchor`)
- feat(connector): new `IIConnectorManager.getFollowedStrokeIds(symbolIds)` — read-only counterpart of the rigid-follow pass, for callers needing the id list before mutating anything

### Export
- feat(export): `InteractiveInkCanvas.exportAs(format, options?)` — single entry point returning the content in one of nine formats, with the resolved type derived from the format: `json` → `TSymbol[]`, `svg`/`text`/`markdown`/`mermaid`/`plantuml` → `string`, `png` → `Blob`, `llm` → `TLLMExport`, `jiix` → `TJIIXExport`
- feat(export): `InteractiveInkCanvas.download(format, options?)` — same nine formats plus `pdf`, handing the file to the browser. New downloads compared to v4: `markdown` (`.md`), `mermaid` (`.mmd`), `plantuml` (`.puml`), `llm` (`.json`) and `jiix` (`.jiix`) — five formats that previously had no download at all
- feat(manager): new `ExportManager` (`src/manager/base/`) — shared implementation of `exportAs`/`download`: symbol resolution (`scope`/`symbols`), file naming, object-URL lifecycle, and the `json`/`svg`/`png`/`pdf` formats. Exposes `TExportFormat`, `TDownloadFormat`, `TExportResultMap`, `TExportOptions`, `TDownloadOptions`, `TPDFDownloadOptions`, `TExporterMap`, `EXPORT_EXTENSIONS` and `EXPORT_MIME_TYPES`
- feat(manager): new `IIExportManager` (`src/manager/interactive/`, exposed as `canvas.exportManager`) — adds the recognition-derived formats on top: `text` from the JIIX stroke index, and `jiix`/`markdown`/`mermaid`/`plantuml`/`llm` from a single JIIX access point. Empty content yields empty output rather than an error
- feat(client): new exported `TRecognitionType` (`"text" | "shape" | "math"`) for the `raw-content` recognition/classification type lists
- feat(export): Markdown conversion — derived locally from the JIIX export (`src/utils/toMarkdown.ts`, `jiixToMarkdown`). Not a server mime type: Text elements become paragraphs, Math elements are wrapped in `$$...$$`; diagram Node/Edge elements are skipped
- feat(export): Mermaid conversion — converts a recognized diagram to Mermaid flowchart syntax, derived locally from the JIIX export (`src/utils/toMermaid.ts`, `jiixToMermaid`). Node shape kind maps to the closest native Mermaid shape (rectangle/circle/ellipse/rhombus/parallelogram; triangle and polygon fall back to a rectangle, no native Mermaid equivalent). Edge connectivity is resolved geometrically — an edge's endpoints (Line/PolyEdge/Arc, the latter via `computePointOnEllipse`) are matched against node bounding boxes, since JIIX diagram exports carry no explicit node/edge id references (the `connected`/`ports` fields exist in the wire format but are always empty today).

### PDF export via native browser print
- feat(canvas): `download("pdf", options?)` — prints the current content (or only the selected symbols) as PDF via the browser's native print dialog. Called with no PDF setting, opens a settings dialog (page format/orientation/page mode/scale) first, same as the Export menu, and the promise settles when the dialog closes — cancellation included; called with any PDF setting, prints immediately with those values (defaults filled in for anything omitted), skipping the dialog — for programmatic callers
- feat(manager): new `PDFExportManager` (`src/manager/base/`, constructor `(canvas: TInteractiveInkCanvas | InkCanvas)`) — builds the print-only DOM/CSS layer, computes page format/orientation/scale-to-page-count (`computePageCount`, `computeFitToPageScale`, `getPageDimensionsMm`), single-page fit-to-scale and multi-page tiled print modes (`buildSinglePagePrintContainer`/`buildMultiPagePrintContainer`), the settings dialog (`openExportDialog`, reusing `Modal.ts` form fields), and print orchestration (`print()`); exposes `TPDFPageFormat`, `TPDFOrientation`, `TPDFPageMode`, `TPDFExportDialogOptions`, `TPDFPageOptions`, `TPDFPageCount`, `TPDFPageSizeMm` and `PDFExportManager.DEFAULT_OPTIONS`
- feat(menu): `ExportMenuAction`/`ExportContextMenu` now build the ten entries (JSON, SVG, PNG, Text, Markdown, Mermaid, PlantUML, LLM, JIIX, PDF), each toggleable through `TExportActionItemsConfig`/`TContextExportItemsConfig` and each routed through `canvas.download()`. The context menu resolves its scope at click time, so it always follows the current selection


## Features

### Shape ↔ edge connections
- feat(connector): edges follow their connected shape when it is translated/resized/rotated, before Convert (raw ink strokes) as well as after (`TEdgeLine`/`TEdgePolyLine`/`TEdgeArc` with `startAnchor`/`endAnchor`)
- refactor(connector): **BREAKING** `IIConnectorManager.updateAnchoredEdges()` now returns `string[]` (ids of the pre-convert edge strokes it moved) instead of `void`; callers must include them in their history entry and backend transform message
- feat(connector): new `IIConnectorManager.getFollowedStrokeIds(symbolIds)` — read-only counterpart of the rigid-follow pass, for callers needing the id list before mutating anything

## Performance

- perf(manager): `IIConversionManager.convertNode()`/`convertEdge()` deduped associated strokes by id using an O(n²) `filter`+`findIndex` idiom, copy-pasted 4×. Extracted a shared `uniqueById()` util (`src/utils/object.ts`, exported) using a `Set`, O(n)
- perf: `IIWriterManager`, `IIMoveManager`, `Minimap`, `IISelectionManager` (arc-handle drag), `Chart.ts` (pan), and `InteractiveInkCanvas` (wheel-zoom) each hand-rolled the same "coalesce to one `requestAnimationFrame` callback" pattern independently. Extracted a shared `RafCoalescer` (`src/utils/RafCoalescer.ts`, exported) and migrated all 6 call sites

## Refactor
- refactor(renderer): `CanvasRendererStroke`/`SVGStroker` reimplemented the same stroke-outline geometry (line, quadratic, and end-cap-fan segments) once per renderer, encoding the same points as Canvas2D calls vs. SVG path strings. Extracted the shared point math into `computeLineOutlinePoints()`/`computeQuadraticOutlinePoints()`/`computeFinalOutlinePoints()` (`src/utils/quadratics.ts`, exported), both renderers now only encode the returned points into their own drawing API
- refactor(canvas): `setCursorStyle()` (toggling root CSS classes to reflect the current tool) was byte-identical in `InkCanvasDeprecated`/`InteractiveInkSSRCanvas`, fused inline into `InkCanvas`'s `tool` setter as a 3rd copy, and reimplemented again with a 4th (Select/Move-aware) variant in `InteractiveInkCanvas`. `AbstractCanvas` now owns the whole toggle algorithm (`setCursorStyle()`, behind a new `abstract get tool(): CanvasTool`) driven by two small `protected` hooks, `cursorClasses` and `getCursorClass()`; `InteractiveInkCanvas` only overrides the two hooks for its extra tools, no longer the algorithm itself
- refactor(canvas): all 4 canvas variants' `resize()` reimplemented the same "explicit value, else computed root element size clamped to a configured minimum" fragment. Added `resolveDimensions()` on `AbstractCanvas` (behind a new `abstract get minDimensions()`); each variant now only supplies its own minimum dimensions and calls the shared helper, keeping its own renderer-call arity/caching/network-round-trip logic unchanged
- refactor(canvas): all 4 canvas variants' `destroy()` repeated the same `stopResizeObserver()`/`event.removeAllListeners()`/`layers.destroy()`/`renderer.destroy()` sequence. Added `teardownCommon()` on `AbstractCanvas` (behind a new `abstract renderer: { destroy(): void }`); each variant now calls it alongside its own teardown (input-handler detach, client/menu/model/history cleanup) and still calls `clearRootElementReference()` itself last
- refactor(client): `HTTPClientV1`/`HTTPClientV2`'s `post()` reimplemented the same HMAC key-resolution logic (string-or-function `hmacKey`, `computeHmac` call). Extracted `resolveHmac()` (`src/client/HmacAuth.ts`), used by both; the 2 WebSocket clients were left untouched since their HMAC-challenge handling has genuinely different failure-handling control flow
- refactor(logger): **BREAKING (type-only)** `Logger.debug`/`info`/`warn`/`error` (and the private `log`) took `...data: any` — the last `any` holes in the class. Changed to `...data: unknown[]`, no runtime behavior change (values were only ever stored/passed to `console[level]`, never read as a specific type)
- refactor(utils): **BREAKING (type-only)** `mergeDeep(target: any, ...sources): any` — the deep-merge engine behind every configuration object in the lib — took/returned `any`. Changed to `mergeDeep<T extends TMergeable>(target: TPartialDeep<T>, ...sources): T`; all ~30 call sites (every `*Configuration.ts` constructor) now pass an explicit type argument, e.g. `mergeDeep<TServerHTTPConfiguration>({}, DefaultServerHTTPConfiguration, override)`, since the conventional empty-object `target` carries no type information for inference to work from. No runtime behavior change. Also dropped 2 now-redundant `as TPenStyle`/`as TTheme` casts in `StyleManager.ts` that this made unnecessary
- refactor(examples): the anti-flash-of-wrong-theme inline `<script>` (applies the saved `data-theme` before first paint, ahead of the deferred `assets/js/theme.js` toggle-button wiring) was byte-identical across 69 of the 71 example HTML pages. Extracted to `examples/assets/js/theme-init.js`, referenced via `<script src>` at the same head position (same synchronous, pre-paint execution timing as the inline version)

# [v4.1.0](https://github.com/MyScript/iinkTS/tree/v4.1.0)

- fix(history): `IIHistoryManager` reversing a `style` change used to reapply the same new style instead of restoring the old one (undo was a no-op for style edits); now round-trips correctly via the enriched `oldStyles`/`newStyles`
- fix(manager): `IISynchronizerManager`'s own metadata bookkeeping (`jiixBlockId`/`jiixBlockType`, connection anchors) called `model.updateSymbol(stroke)` without the new opt-out, so every sync cleared `model.exports` right after `canvas.export()` had just populated it. Reading `model.exports` right after a `synchronized` event could get `undefined` instead of the JIIX just fetched. Now passes `updateSymbol(stroke, false)` — none of that metadata is part of the export content
- fix(model): `Model.addStroke()` silently allowed a duplicate stroke id, unlike `IModel.addStroke`/`IIModel.addSymbol` which both throw — now throws `Stroke id already exist: <id>` too, for consistency

### Import Strokes
- feat(InkCanvasV2) added strokes import functionality 

## Performance

### virtualization
- throttle pan and cull off-screen symbols on large documents

# [v4.0.0](https://github.com/MyScript/iinkTS/tree/v4.0.0)

## Breaking Changes

See [MIGRATION.md](./MIGRATION.md) for step-by-step upgrade instructions.

### Class/API renaming
- refactor: **BREAKING** `Editor` class renamed to `Canvas` (`Editor.load()` → `Canvas.load()`); `Canvas.load()` type constants renamed: `"INTERACTIVEINK"` → `"INTERACTIVE_INK"`, `"INTERACTIVEINKSSR"` → `"INTERACTIVE_INK_SSR"`, `"INKV1"` → `"INK_V1"`, `"INKV2"` → `"INK_V2"`
- refactor: **BREAKING** editor variants renamed: `InteractiveInkEditor` → `InteractiveInkCanvas`, `InteractiveInkSSREditor` → `InteractiveInkSSRCanvas`, `InkEditor` → `InkCanvas`, `InkEditorDeprecated` → `InkCanvasDeprecated` (and their `*Configuration`/`*Options` companion types)
- refactor: **BREAKING** network layer renamed from `Recognizer*` to `*Client`: `RecognizerHTTPV1` → `HTTPClientV1`, `RecognizerHTTPV2` → `HTTPClientV2`, `RecognizerWebSocket` → `WebSocketClient`, `RecognizerWebSocketSSR` → `WebSocketSSRClient` (and their `Configuration`/`Message`/`Event`/`Error` companion types)
- refactor: source layout mirrors the new naming — `src/editor/` → `src/canvas/`, `src/recognizer/` → `src/client/`
- refactor(examples): directories renamed to match — `examples/rest/` → `examples/canvas/` (files split `canvas_v1_*`/`canvas_v2_*`), `examples/websocket/` → `examples/interactive-canvas-ssr/`, `examples/offscreen-interactivity/` → `examples/interactive-canvas/`; new `examples/custom-rendering/` hosts the tldraw + `WebSocketClient` demo (`examples/custom-rendering/tldraw-websocket-client/`)
- refactor: **BREAKING** remove II-prefix from all symbol types — IIStroke→TStroke, IIText→TText, IIMath→TMath, IIDecorator→TDecorator, IIEraser→TEraser, IIShapeCircle→TShapeCircle, IIEdgeLine→TEdgeLine, etc.
- refactor: **BREAKING** convert all symbol interfaces to type aliases with T* naming convention
- refactor: **BREAKING** remove SymbolFactory — creation dispatchers moved to SymbolHelpers
- refactor: **BREAKING** the canvas instance attached to the root DOM element is now exposed as `rootElement.iink` (was `rootElement.editor`) — decoupled from the class name since it collided with the real `<canvas>` elements rendered inside that same root element
- refactor: **BREAKING** `EditorTool`/`EditorWriteTool` renamed to `CanvasTool`/`CanvasWriteTool`
- refactor: **BREAKING** `LoggerCategory.EDITOR`/`EDITOR_EVENT` renamed to `LoggerCategory.CANVAS`/`CANVAS_EVENT`
- refactor: **BREAKING** default/public CSS hook `.ms-editor` renamed to `.ms-ink`; state badge classes `.editor-state*` renamed to `.ms-ink-state*`
- refactor: **BREAKING** CSS custom property prefix `--iink-*` renamed to `--ms-ink-*` (e.g. `--iink-primary` → `--ms-ink-primary`); `--iink-editor-bg` also renamed to `--ms-ink-canvas-bg`

### Gestures
- feat(gesture): **BREAKING** `join` and `insert` gestures are now disabled by default (previously enabled) — re-enable them explicitly via the `gestures` configuration if your integration relies on them

## Features

### Canvas state
- feat(canvas): add `canvas.connectionState` (initializing/online-idle/online-working/syncing/offline/error) + `connectionStateChanged` event
- feat(canvas): add `canvas.trackOperation()`/`startOperation()`/`endOperation()`/`hasOperation(label)` — named, ref-counted busy tracking surfaced through the state badge, covering recognition, conversion, synchronization, math, transforms, gestures, and export/undo/redo/clear/import
- feat(canvas): state badge tooltip now opens on click and lists the active operation(s); new pulsing "typing" indicator for working/syncing states
- feat(canvas): "Recognizing" busy state now reacts immediately on pointer-down/drag-start instead of waiting for a server round-trip, removing perceived lag on fast writing and multi-stroke imports
- feat(canvas): **BREAKING** `CanvasLayer.updateState()`/`showState()`/`hideState()`/`createState()`/`createBusy()` removed — replaced by `updateCanvasState()` driven by `canvas.connectionState`. `CanvasLayer.ui.state` shape changed (`{ root, icon, count }` instead of `{ root, busy }`)
- feat(client): `WebSocketClient` now proactively detects unexpected disconnects and reconnects immediately (previously only reactive); `TConnectionStatus` gains an `"error"` value once reconnection attempts are exhausted

### Stroke Playback
- feat(canvas): add `canvas.playback` — replays a recorded set of strokes point by point, honoring their original relative timing; `play(strokes, speed?)`, `pause()`, `resume()`, `stop()`, `setSpeed()`, with `state`/`progress` getters and `onProgress`/`onStateChange`/`onEnd` callbacks
- feat(canvas): add `canvas.readOnly` — blocks pointer input across all tools and shows a "not-allowed" cursor; used by `canvas.playback` for the duration of a playback

### Math
- feat(math): add comprehensive math dependencies visualization (variables, overlays, computation, evaluation) and a Math Diagnostic menu with function evaluator
- feat(math): add numerical computation result display with graph rendering, and an auto variable management option
- feat(math): include math equations in `downloadAsText` export
- feat(menu): Math context menu now shows for multi-block selections when every selected block is a fully-selected Math block; add `canvas.math.getBlockCapabilities(blockId)` and `IIJiixQueryManager.getStrokeIdsForBlock(blockId)`
- feat(math): Math context menu gains a "Force compute" button that clears and recomputes numerical results for the selected blocks; add `canvas.math.forceCompute(jiixBlockIds?)` (all blocks if omitted), also used by the global "Force Compute all" action

### Chart
- feat(chart): support multiple data series with per-series colors
- feat(chart): add zoom/pan controls and a toggle for graph point visibility

### Canvas
- feat(keyboard): add shortcuts — copy/paste/cut, undo/redo, zoom, pan, fit
- feat(canvas): add `zoomToFit(symbols?)` to center view on content
- feat(minimap): add Minimap component with click/drag navigation
- feat(menu): add minimap toggle button in the action menu bar

### Gestures & Input
- feat(gesture): add underline action options and integrate into the gesture menu
- feat(gesture): enhance insert action for line breaks and horizontal inserts
- feat(erase): enhance stroke and character deletion logic
- feat(writer): add margin parameter to `ensurePointVisible`

### Other
- feat(selection): add selection granularity configuration (`element` level, for text/math/shape selections)
- feat(jiix): add `getBlocksForSymbols` to `IIJiixQueryManager`
- feat(menu): add text export option to menu actions and context menu
- feat(history): expose `extractStrokes(symbols)` (`@/symbol`) and `extractIIBackendChanges(changes)` (`@/history`) as new pure helper exports

## Performance
- perf(snap): faster id lookup and coordinate bucketing during snapping
- perf(symbol): faster bounds computation for symbols

## Bugs fix
- fix(history): undo is no-op for style, order, and updated changes; fix rotation reversal sign
- fix(history): carry through updated symbols in reverseChanges for undo
- fix(client): HMAC challenge and computation errors now surfaced via `emitError`
- fix(client): `undoDeferred`/`redoDeferred` not reset after a connection reset
- fix(client): WebSocketSSR listeners never removed on reconnect
- fix(client): emit `EndInitialization` after the WebSocket handshake completes
- fix(renderer): canvas transform accumulating on each resize
- fix(renderer): remove spurious `context2d.save()` unbalancing canvas state
- fix(menu): context menu positioning within rendering layer bounds
- fix(menu): remove document/scroll listener leaks on destroy
- fix(symbol): `TStroke.split()` leaves length=0 on result strokes
- fix(symbol): `TEdgePolyLine.create` validation never fired
- fix(utils): `isDeepEqual` incorrectly treats arrays as plain objects
- fix(utils): correct segment intersection endpoint guard
- fix(grabber): unsafe cast of `MouseEvent` to `PointerEvent` in context menu handler
- fix(canvas): destroy all existing instances before creating a new canvas
- fix(canvas): filter invalid strokes in `importPointEvents`
- fix(BaseMenuItem): remove DOM node leak on destroy (`replaceWith(cloneNode)`)
- fix(smartguide): correct event listener removal
- fix(security): force `js-yaml` ≥4.2.0 (CVE DoS)

## Refactor
- refactor: internal reorganization of transform, gesture, symbol, and history code (managers, file layout, dead code removal) — no public API impact

# [v3.3.0](https://github.com/MyScript/iinkTS/tree/v3.3.0)

## Features
- exemple(TLDraw): add TopZone component for auto conversion toggle
- feat: add zoom functionality
- feat: add pan functionality

## Performance
- perf(example): optimize perf of tldraw example
- perf(core): refactor the library to optimize performance

## Bugs fix
- fix(tldraw): Converter add toRichText
- fix(IIGestureManager): scratch-out on a shape does not erase the shape
- fix: update SVG element selection logic to verify child element counts
- fix: refactor decorable type checks in IIGestureManager and IIMenuContext
- fix: enhance selection filter and outline rendering in SVGRendererEdgeUtil
- fix: update ID generation logic in duplicate menu for consistent symbol identification
- fix: improve point calculation in getPoint method for better accuracy
- fix: correct spelling of "unknown" in error messages across multiple files
- fix: EraserManager remove warning Circular dependency
- fix(rest_custom_grabber.html): remove unused event listener for modal editor
- fix(rest_diagram_import.html): update modal editor options to include editorOptions

## Refactor
- refactor: manager, move IISnapManager & IIGestureManager into manager folder
- refactor(logger): change LoggerLevel values to integers and streamline logging methods
- refactor(exports): reorganize export types into ExportCommon for better structure and maintainability
- refactor(renderer): introduce base renderer and shared utilities for consistent rendering across formats
- refactor(symbol): reorganize symbols into dedicated folders
- refactor(Manager): separation of Managers' Dependencies
- refactor(editor): restructure editor classes and introduce EditorFactory for improved instance management
- refactor(helper): optimisation of helpers

# [v3.2.1](https://github.com/MyScript/iinkTS/tree/v3.2.1)

## Bugs fix
- fix(readme.md): remove await from readme

# [v3.2.0](https://github.com/MyScript/iinkTS/tree/v3.2.0)

## Bugs fix
- Disable default touch actions on multiple elements to improve touch interaction handling
- When HMAC key is missing despite being optional in Admin UI configuration
- Sample websocket_text_highlight_words broken, enhance export options to include text words and chars

## Refactor
- Consolidate and rename trigger configuration types
- Add API key input to iinkts sample and pass it from Admin UI
- Update samples, import iink-ts as module


# [v3.1.1](https://github.com/MyScript/iinkTS/tree/v3.1.1)

## Bugs fix
- fix(RecognizerHTTPV1, RecognizerHTTPV2): add credentials: "omit" option to POST requests
- fix(InteractiveInkEditor): clean root element
- fix(InteractiveInkEditor): remove layer classes on destroy
- fix(rest-raw-content-recognizerInk.html): recognition info is displayed twice on rest_v2_raw_content example

# [v3.1.0](https://github.com/MyScript/iinkTS/tree/v3.1.0)

## Featues
- feat(Editor) added the option to give a async function for challenge validation [#11](https://github.com/MyScript/iinkTS/issues/10)

## Bugs fix
- fix(offscreen) insert gesture does nothing after convert + undo
- fix(InkEditor.ts) [Raw Content] Show Recognition Blocks button does not work when writing after the check
- fix(InkEditor) wrong default mimeTypes for Math & RawContent

# [v3.0.2](https://github.com/MyScript/iinkTS/tree/v3.0.2)

## Bugs fix
- fix(InkEditor) last undo does not supress 1st result
- fix(InkEditor) eraser does not work
- fix(InkEditor) missing result after undo
- fix(InkEditor) bad recognition displayed when language is not english

# [v3.0.1](https://github.com/MyScript/iinkTS/tree/v3.0.1)

## Features
- feat(InkEditor): change CanvasRenderer with SVGRenderer
- feat(examples): add japanese vertical example

## Bugs fix
- fix(InkEditor): add quiet_period before send recognition request

# [v3.0](https://github.com/MyScript/iinkTS/tree/v3.0)

## Features
- configuration update
  - added classification to raw-content
  - added base lines on jiix
- can resize edges by vertices
- sync strokes with jiix element continuously

## Refactor
- replacing the editor constructor with an editor loader
- delete global configuration, definition of specific configuration per editor
- changing editor instantiation, split editor into separate editors
- centralize layers
- centralize event, rename intention to tool
- separation of smart guide style into a specific file
- separation of menu style into a specific file

## Bugs fix
- fix(Grabber) prevents the pointer cancel for touch event
- fix(Convert) misalignment when converting text
- fix(Interact) keep cursor during shape transformation
- fix(Behaviors) fix change langage to reset init promise and raise event loaded
- fix(RestBehaviors) missing exported event when export function ended

## Samples
- updating the display of exchanged Websocket messages on TLDraw example

## Chore
- chore(deps): upgrade all dependencies

# [v2.0.1](https://github.com/MyScript/iinkTS/tree/v2.0.1)

## Features
- feat(example) add underline & strikethrought gestures on tldraw example
- feat(example) add possibility to disable gesture on tldraw example

## Bugs fix
- fix(Convert) converted word in a group with a stroke disappears after conversion
- fix(Gesture) don't send contextLessGesture if stroke not overlaps symbol
- fix(examples) wrong placement of text after convert in tldraw example
- fix(examples) style broken on websocket_text_customize_editor_css.html

# [v2.0.0](https://github.com/MyScript/iinkTS/tree/v2.0.0)

## Features
- offscreen behaviors

## Refactor
- [suggestion] friendly type declaration [#4](https://github.com/MyScript/iinkTS/issues/4)

# [v1.0.5](https://github.com/MyScript/iinkTS/tree/v1.0.5)

## Refactor
- use the native Crypto module instead of the crypto-js library as the library is no longer maintained [#3](https://github.com/MyScript/iinkTS/issues/3)
- split examples css files
- redesign of the examples homepage style

## Bugs fix
- fix(SmartGuide) it is possible to write just next to the ellipsis
- fix(WSBehaviors) add stroke to model when importPointEvents

# [v1.0.4](https://github.com/MyScript/iinkTS/tree/v1.0.4)

## Bugs fix
- fix(Types) not all types are exported for development
- fix(Model) clear export when strokes changed
- fix(README.md) installing iink-ts from github using readme fails
- fix(install) npm install error after git clone
- fix(style) Editor styles unavailable in shadow dom elements [#2](https://github.com/MyScript/iinkTS/issues/2)
- fix(Convert) Server state randomly corrupts and collapses the iink editor content [#1](https://github.com/MyScript/iinkTS/issues/1)
- fix(examples) math examples don't give result when katex fails
# [v1.0.3](https://github.com/MyScript/iinkTS/tree/v1.0.3)

## Samples
- sample Math with graph

## Bugs fix
- fix(Style) wrong import for custom grabber & custom recognizer

# [v1.0.2](https://github.com/MyScript/iinkTS/tree/v1.0.2)

## Samples
- sample custom grabber for websocket & REST
- sample custom recognizer for websocket & REST
- sample digram REST

## Refactor
- renaming redraw function to importPointEvents

## Chore
- chore(deps): upgrade crypto-js 3.3.0 -> 4.2.0

## Bugs fix
- fix(Stroke) generate uniqId
- fix(Sample) wrong import into dev sample

# [v1.0.1](https://github.com/MyScript/iinkTS/tree/v1.0.1)

## Features
- can redraw JIIX export

## Bugs fix
- fix(Smartguide) hide if no export JIIX
# [v1.0.0](https://github.com/MyScript/iinkTS/tree/v1.0.0)

## Features
- migration javascript to typescript [link](https://github.com/MyScript/iinkTS)
