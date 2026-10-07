# [v5.0.0](https://github.com/MyScript/iinkTS/tree/v5.0.0)

See [MIGRATION.md](./MIGRATION.md) for step-by-step upgrade instructions.

## Breaking Changes

### Strokes: pen nibs, width and timing
A stroke's width used to be read off each pointer's `p`, which the capture overwrote with a value derived from the gap to the previous pointer. Spacing is only a proxy for speed while the sampling rate holds steady, and the browser coalesces samples under load: the same gesture came out **17% thicker** when sampled twice as densely.
- `p` is now exactly what the device reported and is never written back. Width is derived at draw time from distance over elapsed time, independent of sampling density. A pen reporting its own pressure overrides the estimate; a constant pressure (mouse, most touch devices) is read as "no measurement"
- `TStyle.pen` names a nib: `ballpoint` (uniform line, blunt ends), `pencil` (default), `fountain`, `brush`, in order of how strongly speed and pressure move the line. It sits on the style, not the tool, so a reopened document redraws each stroke with its own nib; an unknown value falls back to the default instead of throwing. **Strokes drawn by an earlier version render differently**: every nib reaches full width on a deliberate stroke and thins as the pen accelerates; `ballpoint` is the constant-width one
- nib behaviour: thinning is measured against a reference speed, not from a standstill, so slow parts keep full width; a nib may carry a **broad edge** (`edgeAngle`) — width then follows the angle between travel and edge, from geometry alone, so it works without timing (`fountain`: 45°, 7:1 ratio on a circle); a nib's ceiling (`max`) may exceed the nominal width (`brush` reaches 1.6); the end taper is capped at a share of the stroke's length; `smoothing` averages width over neighbouring pointers (`brush`). A stroke whose `dt` was filled in from the pointer index is left unshaded
- `TStyle.penAngle`, `penSmoothing`, `penSpeed` override the nib's values on a single stroke (`readNibOverrides`)
- menu: the write tool becomes a submenu (`ms-menu-tool-write-pencil` is the trigger, one button per nib); the style menu gains a nib picker that also applies to the selection — **an existing stroke takes the new nib and redraws**; the action menu gains a `Pen` submenu for the tunables, disabling those the current nib ignores
- SVG, SSR and Canvas renderers go through the same width profile
- new: `computeWidthProfile`, `computeOutlinePointers`, `isPenNib`, `PEN_NIBS`, `DEFAULT_PEN_NIB`, `TPenNib`, `TNibProfile`, `readNibOverrides`; example `interactive_canvas_pen_nibs.html`
- removed: `_computePressure` on the stroke, `Model.computePressure`, and `TStroke.length`/`TLegacyStroke.length` (a hand-maintained accumulator with no reader left) → `SymbolGeometry.lengthOf(symbol)` (document frame) or `SymbolGeometry.rawOf(stroke).length` (stroke frame)
- **`TPointer.t` is renamed `TPointer.dt`** and now counts milliseconds since the stroke began (first pointer at 0) instead of epoch milliseconds. The absolute instant is `stroke.creationTime + dt`, which `toWireStroke` sends. The rename is deliberate: same name, new meaning would have compiled and silently mis-timed every reader
- **old documents still load**: `StrokeUtil.createFromPartial` and `IIPlaybackManager.play` accept an absolute `t` and rebase it, recovering both the intervals and the stroke's `creationTime`
- pointer times are no longer rounded to whole milliseconds (18% of intervals in a reference capture were exactly zero): `DefaultGrabberConfiguration.timestampFloatPrecision` `0` → `-1`. Each coalesced sample is timed from its own event rather than one clock read per batch
- `StrokeUtil.split` and the insert gesture's sub-strokes inherit the origin of the stroke they were cut from; the sub-strokes also keep the original `pointerType`, previously dropped
- new: `TPointerImport`, `TStrokeImport`, `resolvePointerDelta`, `resolveStrokeOrigin`, `TPointerInfo.gestureStartTime`, a third `creationTime` argument to `StrokeUtil.createEmpty`
- fixed: `IIPlaybackManager.play` ordered strokes by their first pointer's timestamp; it orders by stroke origin now

### The document is immutable
Symbols are frozen when committed and handed to readers directly instead of the document being deep-cloned on every read: `model.symbols` on 500 strokes goes from 11.59 ms to 0.0012 ms; building a 200-stroke model is 28% slower.
- mutating a symbol read from `model` throws (runtime `Object.freeze`, not types) — use `model.draftSymbol(id)` then `model.commitSymbol(draft)`. A committed draft is frozen, so a per-frame gesture needs a fresh draft each frame
- `model.selectedIds` is a `ReadonlySet`; `modificationDate` and `exports` are getters
- **renamed**: `IIModel.getRootSymbol(id)` → `IIModel.getSymbol(id)`. Same behaviour: the committed, frozen symbol, no copy — the cheap read, against `draftSymbol(id)` for a write
- new: `SymbolStore`, `TDraft`, `TReadonlyDeep`, `TSymbolOrder`, `IIModel.symbolCount`, `IIModel.decoratorsByTargetId`, `IIModel.selectionVersion`
- fixed: `changeOrderSymbol` was a no-op; partially erasing characters was never stored; undo/redo replay rewrote the entry it was replaying; edge-connection anchors were silently dropped behind a swallowed throw

### Everything a symbol type knows lives on its util
Behaviour was split between `*Ops` objects and `*Util` classes with no rule for which held what, and the transform managers reached per-type code through a `switch (symbol.type)` — so a custom symbol could be registered, drawn and selected, but not moved. The utils now hold everything; the type file holds the type.
- **removed from the public API**: `StrokeOps`, `ShapeOps`, `ShapeCircleOps`, `ShapeEllipseOps`, `ShapePolygonOps`, `EdgeOps`, `EdgeLineOps`, `EdgeArcOps`, `EdgePolyLineOps`, `TextOps`, `MathOps`, `DecoratorOps`. Members moved to their family's util as statics, same name except on collision: `ShapeCircleOps.create`/`createFromPartial`/`createBetweenPoints`/`getSVGPath` → `ShapeUtil.createCircle`/`createCircleFromPartial`/`createCircleBetweenPoints`/`getCirclePath` (same for ellipse, polygon); `EdgeLineOps.create`/`moveVertex`/`getSVGPath` → `EdgeUtil.createLine`/`moveLineVertex`/`getLinePath` (same for arc, polyline); `TextOps.create` → `TextUtil.createText`; `MathOps.create` → `MathUtil.createMath`; `DecoratorOps.create` → `DecoratorUtil.createDecorator`; `StrokeOps.create` → `StrokeUtil.createEmpty`. `EraserOps` stays (transient tool artefact, no util)
- type guards that were `*Ops` members are util statics: `ShapeUtil.isShape`, `EdgeUtil.isEdge`, `isLineEdge`, `isArcEdge`, `isPolyEdge`. `isStroke`, `isText`, `isMath`, `isDecorator` are unchanged
- new: dispatching `ShapeUtil.getSVGPath(symbol)`/`EdgeUtil.getSVGPath(symbol)` for any kind of the family
- removed: `EdgeOps.computeEdgeBounds` (an edge's geometry applies its padding), `EdgeOps.getEdgeResizePoints` → `symbolRegistry.getUtilFor(symbol).getResizePoints(symbol)`, `StrokeOps.formatToSend` → `toWireStroke` (see below); `StrokeOps`' five `_`-prefixed path helpers are private to `StrokeUtil`
- new, concrete on `SymbolUtil`: `translate`/`rotate`/`resize(symbol, context)`, each composing `context.matrix` onto `symbol.transform` via `applyTransform` — no built-in type overrides them, a custom util inherits all three. `TTransformContext` (`{ matrix }`) replaces `TTranslateContext`/`TRotateContext`/`TResizeContext`, which had become identical
- new: `SymbolUtil.getResizePoints(symbol)` (empty by default; edge kinds offer per-vertex handles), `TResizePoint` (`{ point, vertexIndex }`, structural)
- new: `SymbolUtil.keepsAspectRatio(symbol)`, `false` by default; `true` for text and math (`TypesetUtil`) and the circle. `IIResizeManager` no longer tests types, and a custom symbol can now require a locked ratio
- new: `TypesetUtil` (`src/symbol-utils/typeset/`), the abstract base of `TextUtil` and `MathUtil`
- `IIAbstractTransformManager`: the type switch, `applyToStroke`/`applyToShape`/`applyToEdge`/`applyOnText`/`applyOnMath`, `transformName` and `IIResizeManager.applyOnTypeset` are gone; a subclass implements one `protected abstract applyThroughUtil(symbol, matrix)`. A decorator is no longer skipped early: `DecoratorUtil` implements the three operations as deliberate no-ops. An unregistered type fails from `symbolRegistry.getUtilFor` with `No util is registered for type "x". Registered types: …` (was `Can't apply resize on symbol, type unknown: {…}`)
- **`SymbolUtil.getSVGElement(symbol)` is abstract**: a custom util omitting it no longer compiles (return `undefined` for a state you do not draw). The SVG renderer's "no util for symbol" error now means just that. `InkCanvasDeprecated` (INK_V1) still draws through `CanvasRenderer`'s fixed tables, so a custom symbol is invisible there and logs "symbol type unknown"

### A symbol's geometry is computed, and answers for itself
`bounds`, `vertices`, `snapPoints` and `edges` are gone from every stroke, shape and edge type. They were copies kept in step by hand, and a stale box surfaced later in hit-testing rather than where the write happened. They are computed on read, cached on the frozen record's identity (a mutated symbol is a new object, so nothing to invalidate).
- new: `SymbolGeometry.boundsOf`, `verticesOf`, `snapPointsOf`, `edgesOf`, `lengthOf` (document frame, raw × scale), `of(symbol)` and `rawOf(symbol)` (pre-transform) returning a `Geometry2d`. All work detached: `symbols.map(SymbolGeometry.boundsOf)`
- new in `@/core/geometry`: `Geometry2d` and its shapes `PointSet2d` (stroke), `Polyline2d`, `Polygon2d`, `Circle2d`, `Ellipse2d`, `PointsGeometry2d`, answering overlap, containment, distance and transformation
- `SymbolUtil.getGeometry(symbol): Geometry2d` is the only geometry method a custom type implements; `overlaps`, `bounds`, `vertices`, `edges`, `length`, `containsPoint`, `nearestPoint`, `hitTestPoint` derive from it. **`SymbolUtil.overlaps` is no longer abstract**
- removed: `SymbolUtil.updateDerivedFields` and every per-kind/`*Ops` implementation, `StrokeOps.updateBounds`, and the `*Ops` geometry members (`computeBounds`, `computeVertices`, `computeEdges`, `computeSnapPoints`, `computeLength`, `overlaps`)
- `TText.bounds` and `TMath.bounds` **stay**: measured from the DOM with `getBBox()`
- behaviour: a query lying wholly inside a filled shape now selects it; a rotated symbol keeps a *rotated* box instead of its axis-aligned envelope (up to √2 wider); a circle stretched unevenly becomes an exact `Ellipse2d` instead of a re-tessellated outline
- new on `OBBOps`: `createFromPointsAtAngle(points, angle)`, `toCorners`, `fromCorners`, `polygonOverlapsQuad`, `toUnrotatedBox`, `getSnapPoints`

### A symbol carries where it sits, as a matrix
`TBaseSymbol.transform` is a persisted `TMatrixTransform`, identity by construction. Translate, rotate and resize compose into it; the symbol's own coordinates never move.
- the renderer applies a transform by rewriting one attribute (`SVGRenderer.setSymbolTransform`) instead of rebuilding the element
- undo is exact: no rounding accumulates across steps
- reads go through `SymbolGeometry`; a write into a symbol's own frame maps the point back first — new: `applyInverseMatrixToPoint`, `isIdentityMatrix`, `mergeSymbolTransform`, and `applyMatrixToPoint`/`applyMatrixToPoints` (rounded to three decimals, previously a `protected` helper applied inconsistently across 13 sites) exported from `core/geometry`
- removed: `TText.rotation`, `TMath.rotation`, `TRotation`, `TTypesetPort`, and `IIAbstractTransformManager.setTransformOrigin`/`translateElement`/`rotateElement`/`scaleElement` — a live gesture composes onto the stored matrix instead of writing a CSS transform, which is what made a rotated typeset symbol lose its rotation on drag
- `StrokeSerializer` bakes the matrix at the network boundary; the wire format is unchanged

### A path symbol is its path, with no group around it
Strokes, shapes and edges were each a `<g>` holding one `<path>` — a DOM node per symbol (4419 on the reference document) for nothing.
- `getSVGElement` returns the `<path>`, carrying `id`, `type`, `kind` and the matrix
- **`vector-effect` now applies** (it is not inherited): `non-scaling-stroke` keeps a shape's or edge's width as the canvas zooms
- **selectors reaching through the group no longer match**: `#<id> path`, `g[type="stroke"]`
- text and math keep their group; a decorator stays a single bare element
- new: `PathSymbolUtil` (types implement `getPathData`/`getPathAttributes` instead of `getSVGElement`), `SymbolUtil.getGroupAttributes`

### A decorator's box is named for where it comes from
A decorator holds no coordinates: its box comes from the recognizer's word box, or the union of its targets'.
- renamed: `TDecorator.bounds` → `TDecorator.targetBounds`, now optional; `DecoratorOps.setBounds` → `DecoratorUtil.setTargetBounds`
- removed: `TDecorator.hasBounds` — presence of `targetBounds` is the flag (the boolean shadowed a zero-size box)
- fixed: a decorator serialised by iinkTS (`TOBB`) came back with a NaN centre on re-import; erasing one target out of several threw `Cannot assign to read only property 'targetIds'`

### History: diff-only, records what changed
Entries no longer store a `Model`/`IIModel` snapshot, and no longer describe a change by its parameters (delta, angle, factors, colour): a transform writes `symbol.transform` and a restyle `symbol.style`, so the record is the state and undo restores it exactly (a scale's `1 / scaleX` was `Infinity` at zero and ignored its origin).
- removed: `TIHistoryStackItem`/`TIIHistoryStackItem`, `IHistoryManager.updateModelStack()`, `IIHistoryManager.update()`
- `history.push(model, changes)` → `history.push(changes)`; `undo()`/`redo()` return `TIHistoryChanges`/`TIIHistoryChanges` instead of `{ model, changes }`. `InteractiveInkCanvas.undo()`/`redo()` replay them on the live model, independently from the backend replay message
- removed: `TIIHistoryChanges.translate`, `rotate`, `scale`, `matrix`, `style`; `TIIHistoryBackendChanges.translate`, `rotate`, `scale`, `matrix` — undo/redo reach the server as a stroke replacement
- `TIIHistoryChanges.updated`: `TSymbol[]` → `{ before: TSymbol; after: TSymbol }[]`. New `appendUpdated(changes, pairs)` for a step gathering symbols from several sources (assigning twice kept only the last)
- `IITypesetManager.moveTextAfter` returns `{ before, after }[]` instead of `TSymbol[]`
- `WebSocketClient.transformMatrix` still works but the library no longer calls it
- fixed: a restyle never reached the server; `IITranslateManager.translate(symbols, …)` recorded the selection instead of `symbols` (undo applied nothing); thickening strokes by gesture recorded the old record as the new one (redo was a no-op); `IIHistoryManager` did not populate `possibleUndoCount`

### The client owns the stroke shape it sends
The protocol conversion moved to the client, which no longer depends on the symbol layer.
- removed: `StrokeOps.formatToSend(stroke)` → `toWireStroke(stroke)`
- new: `TRecognitionStroke` (`{ id, pointerType, pointers }`, what you hand the recognizer), `TRecognitionPointer`, `TWireStroke` (the column-array wire form)
- a pointer's `dt` and `p` are **optional**, so geometry alone can be sent. Supply `dt` whenever the source has it: the recognizer uses inter-point timing to segment characters and resolve ambiguous shapes (measurably worse on cursive text and multi-pass shapes without it). `TWireStroke.t`/`.p` are optional to match and emitted all-or-nothing, so a column never misaligns with `x`/`y`
- `TStrokeGroupToSend.strokes` and `THTTPClientV2PostData.strokes` are `TWireStroke[]`; `WebSocketClient.addStrokes`/`replaceStrokes`/`recognizeGesture` and `HTTPClientV2.send` take `TRecognitionStroke` (a `TStroke` still satisfies it)
- renamed: `TStrokeMinimal` → `TStrokeCapture`, still the base of `TStroke`

### Internal layout: `src/utils/` dissolved
Every helper moved to the lowest layer its inputs allow; the new `core` layer imports nothing else from the library. The exported surface is unchanged (787 names), so only deep imports are affected.
- helpers now live in `core/geometry`, `core/math`, `core/std`, `core`, `client`, `export`, `dom`
- `TPoint`, `TPointer`, `TSegment`, `TBox`, `TOBB` moved from `symbol/primitives` to `core/geometry`
- see [MIGRATION.md](./MIGRATION.md) for the full mapping

### `SELECTION_MARGIN` split by meaning, `Constants` dissolved
One value of 10 served three unrelated purposes, so tuning the selection frame also changed how finely circles are drawn and how close a click must land on an edge.
- **removed**: `SELECTION_MARGIN` → `SELECTION_PADDING` (10, selection frame and handles, `getSymbolsBounds` default), `HIT_TOLERANCE` (5, per side around a thin edge — the former `SELECTION_MARGIN / 2`), `DUPLICATE_OFFSET` (10, where `duplicate` places the copy), `TESSELLATION_SEGMENT_LENGTH` (10, target segment length when a curve becomes a polyline). Values are unchanged
- the other constants moved next to their owner: `CanvasTool` (`manager/base`), `CanvasWriteTool`, `GESTURE_OPERATION_LABELS`, `ResizeDirection` (`manager/interactive`), `TCanvasOperationLabel` (`canvas`), `SvgElementRole` (`renderer`), `EdgeDecoration` (`symbol`), `MathDiagnosticMessages` (`components`). Still exported under the same names, so only deep imports of `Constants` are affected

### Shape ↔ edge connections
- `IIConnectorManager.updateAnchoredEdges()` returns `TAnchoredEdgesUpdateResult` (`{ rigidStrokeIds, oldSymbols, newSymbols }`: the pre-convert edge strokes it moved and the edges it recomputed) instead of `void` — callers must include them in their history entry

### One call changes the recognition configuration: `changeLanguage` is gone
`InteractiveInkCanvas.updateRecognitionConfiguration(partial)` replaces `changeLanguage(code)`, with **no compatibility shim**: `changeLanguage("fr_FR")` → `updateRecognitionConfiguration({ lang: "fr_FR" })`. It also changes the math solver, e.g. `{ math: { solver: { "angle-unit": "deg" } } }`.
- opens a new session with the merged configuration and re-sends every user stroke. An array in the partial **replaces** the current one; an explicit `undefined` clears a key
- the canvas is read-only while it runs, then restored to its previous read-only state; concurrent calls are serialized and those waiting together are applied in one resynchronization
- on failure the previous configuration is restored, the error goes through the `error` event and the promise rejects (`changeLanguage` kept the new value while the server ran on the old one)
- solver outputs are cleared before the new session, then recomputed if auto-compute is on (`changeLanguage` re-sent them as ink)
- fix(client): `WebSocketClient.newSession(config)` merged with `mergeDeep`, which appends arrays, duplicating every array (`raw-content` types, `gestures`, `mimeTypes`…) on each new session; arrays in `config` now replace
- fix(client): a message sent while `WebSocketClient.close()` was tearing down (typically the debounced synchronize during `newSession()`) was re-sent to the next session — an `export` on the previous part that settled the new session's export with stale content, and `mathSolver` requests on reused block ids, so auto-compute computed nothing after a resynchronization. Such a message is now dropped

### The math solver works in radians by default
`DefaultSolverConfiguration["angle-unit"]` is now `"rad"` (was `"deg"`), and `DefaultRecognitionWebSocketConfiguration.recognition.math.solver` spreads `DefaultSolverConfiguration` instead of declaring its own. `sin(90)` no longer evaluates to `1` by default; set `recognition.math.solver["angle-unit"]` to `"deg"` to keep the previous behaviour.

### Export: one `exportAs`, one `download`
Every export on `InteractiveInkCanvas` goes through two functions instead of nine, with **no compatibility shim**.

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

- `selection: boolean` → `{ scope: "all" | "selection" }`, plus `{ symbols: TSymbol[] }` (wins over `scope`) and `{ filename }` on `download`
- both are always `async`, including `json`/`svg`/`png`; `exportAs("png")` resolves with a fully rasterized `Blob` (previously returned before `image.onload`)
- `exportAs("pdf")` does not compile: `pdf` only exists on `download`
- `export(mimeTypes)` is unchanged and stays public as the low-level server export
- default file names use a truncated ISO instant (`iink-ts-2026-08-26T14-30-15.svg`) instead of `toLocaleDateString`, which put slashes and colons in the name under `fr-FR`
- `PDFExportManager.openExportDialog(onConfirm, onCancel?)`: new optional cancel callback, so `download("pdf")` settles on cancellation instead of hanging
- `TExportActionItemsConfig`/`TContextExportItemsConfig` gained `markdown`, `mermaid`, `plantuml`, `llm`, `jiix` (enabled by default; `markdown` only built with `text` recognition, `mermaid`/`plantuml` only with `shape`)

### Type-only
- `Logger.debug`/`info`/`warn`/`error` take `...data: unknown[]` instead of `...data: any`. No runtime change
- `TWebSocketClientMessageReceived` is derived from the new `TWebSocketClientMessageReceivedMap` (one entry per `TWebSocketClientMessageType`, a missing one no longer compiles) instead of a hand-kept union; it resolves to the same members. Likewise `TWebSocketClientMessageMathSolverResult` comes from the new `TMathSolverResultMap` (`result` type by action) through the new generic `TWebSocketClientMessageMathSolver<A extends TMathSolverAction>`; the eleven `TWebSocketClientMessageMathSolver*` aliases stay, now one-liners over it. `WebSocketClient` now checks a message's `type` before dispatching it and logs an unknown one with its raw payload (it used to print `[object Object]`). No other runtime change
- `WebSocketSSRClient` messages are a discriminated union: `TWebSocketSSRClientMessage<T extends string = string>` takes its `type` as a parameter, each received message type fixes it (`TWebSocketSSRClientMessageSVGPatch.type` is `"svgPatch"`, no longer any string), and the new `TWebSocketSSRClientMessageReceived` is built from the new `TWebSocketSSRClientMessageReceivedMap`. The `manage*Message` handlers take their own message type instead of the base one and cast. New: `TWebSocketSSRClientMessageAck` (`TWebSocketSSRClientMessageHMACChallenge` now extends it), `TWebSocketSSRClientMessageNewPart`, `TWebSocketSSRClientMessageIdle`, `TWebSocketSSRClientMessagePong`. A message of unknown type is logged with its raw payload. No other runtime change
- `TWebSocketClientMessageExport.exports` and `TWebSocketSSRClientMessageExport.exports` are typed `TExportWire` (new: every format a string) instead of `TExport`: the websocket protocols send JIIX as a JSON string, which `TExport` declared an object. `parseExportedJIIX(wire)` returns the `TExport` instead of rewriting the message in place; the handlers resolve and emit that. No runtime change
- `mergeDeep(target: any, ...sources): any` → `mergeDeep<T extends TMergeable>(target: TPartialDeep<T>, ...sources): T`. With the usual empty-object `target`, pass the type argument explicitly: `mergeDeep<TServerHTTPConfiguration>({}, DefaultServerHTTPConfiguration, override)`. No runtime change

## Bug Fixes
- refactor(menu): `IIMenuAction`, `IIMenuStyle`, `IIMenuTool` and `IIMenuContext` extend the new `IIAbstractMenu<TConfig>`, which holds what they duplicated: the item map and its `update`/`destroy`, `show`/`hide`, the dropdown mechanics (`createDropdown`) and a protected `addItem(key, item, options)`. Each menu has two zones, `"bar"` (always visible) and `"dropdown"` (behind a trigger), new `TMenuZone`/`TMenuItemOptions`; a zone is built on its first item, so the built-in menus render the same DOM. New zones an item can now go to: a row beside the style palette, a "…" dropdown at the end of the tool bar, a row of quick actions above the context menu list. One change: a style menu with every item disabled no longer shows an empty palette trigger. **API change for subclasses**: `wrapper` is typed `HTMLElement` on every menu (`HTMLDivElement` on style and tool); `IIMenuContext`'s logger and scroll handler are protected (`logger`, `scrollHandler`); the rendered items live in the protected `items` map
- fix(menu): `IIMenuManager.setConfig()` rebuilt the menus from the built-in classes, so a menu replaced through `options.override.menu` was lost on the first `canvas.menu.setConfig(...)`. And an override class was constructed with `(canvas)` alone, never seeing `configuration.menu.<menu>`. Overrides now survive `setConfig`, and every menu is constructed `(canvas, id, config)`. **Type change**: `options.override.menu` takes menu classes, typed by the new `TMenuOverride` (it declared instances, while classes were expected and cast), and now accepts `context` too
- fix(manager): `IISynchronizerManager` never cancelled the timeout racing each math block's dependency enrichment: every sync left one 5 s timer per math block running, long after the enrichment had settled. They are cleared now. Its retry delay and that timeout are exposed as `RETRY_DELAY_MS` and `ENRICH_TIMEOUT_MS`; `SYNCHRONIZE_TIMEOUT`, which nothing read, is gone
- fix(client): `WebSocketClient` reported only `canUndo`/`canRedo` of a `contentChanged` message, cast to a full `THistoryContext`: `InteractiveInkCanvas`'s `changed` event then carried `empty`, `stackIndex` and `possibleUndoCount` as `undefined` (and `canClear` always `true`). **Behaviour change**: that `changed` event now carries the local history state, like the ones the history emits on push/undo/redo, instead of the backend's; `onContentChanged()` no longer takes the context. Both websocket clients now read the whole state through the new `readHistoryContext(message)`. `WebSocketSSRClient`'s reconnection no longer re-sends a pen style, style classes or theme that was never set (new protected `restoreStyles()`). Error message typo: "Client must be initilized" → "Client must be initialized". Also new: `toRecognitionContentType` (shared by the HTTP clients), `PX_TO_MM_RATIO` (exported from `core/math`)
- fix(client): an HMAC key that could not be resolved (an `hmacKey` function that rejects) left `WebSocketClient.init()`/`WebSocketSSRClient.init()` waiting forever: only the `error` listeners heard of it. `init()` now rejects with it (new protected `failInitialization`): the server only sends a challenge when it requires the signature. The HTTP clients keep sending the request unsigned, the signature being optional there
- fix(client): the websocket URLs did not encode `server.applicationKey`; a key holding `&`, `=` or `#` broke the query string
- **API change for subclasses**: the clients have no `#private` member left, so an integrator can override any of them. `WebSocketClient`'s offline queue, reconnection loop, connection/closing promises and export queue are now protected under the same names (`offlineQueue`, `scheduleReconnectAttempt`, `connectingPromise`, `exportQueue`…); `#send` becomes `sendOnSocket`, not to clash with the public `send()`. All four clients expose their `logger` as protected. Same for the menu classes `options.override.menu` replaces: `IIMenuStyle`, `IIMenuTool` and `IIMenuAction` expose `logger` and (style, action) `documentPointerdownHandler` as protected
- fix(client): `HTTPClientV1`/`HTTPClientV2` signed the request body before adapting the configuration to the server version: against a server below 3.2.0 (2.3.0 for V1's `convert`), the HMAC sent did not match the body, as soon as `export.jiix.text.lines` was set. The body is now serialized once, after the adaptation, and that string is what is signed and sent. Both clients now share `postRecognition`, `parseRecognitionResponse` and `toRecognitionError` (new, `src/client/HTTPRecognition.ts`); their `post`/`tryFetch` stay protected and overridable
- fix(client): the four clients share one mapping of server error codes, `mapErrorCodeToMessage` (new, `ClientError.ts`). **Behaviour change**: `WebSocketSSRClient` now reports `restore.session.not.found` as `ClientError.NO_SESSION_FOUND`, and the HTTP clients map every known code, not only `access.not.granted`. Also new: `parseExportedJIIX` (the websocket clients' JIIX parsing, see `TExportWire` under Type-only) and `ensureServerVersion` (the version lookup all four repeated)
- fix(client): `WebSocketClient.send()` resolved even when the socket failed to send (closed while waiting for initialization, or `socket.send` threw): the failure became an unhandled rejection. It now rejects
- fix(client): `WebSocketSSRClient.send()` silently dropped the message when the socket was closed with `autoReconnect` off, or still connecting; it now rejects. A non-JSON payload from the server (e.g. a proxy's 502 page) threw out of the message handler; it is now reported through `error` with the payload, as in `WebSocketClient`
- fix(client): `WebSocketSSRClient.destroy()` dropped the requests still waiting for an answer, leaving their callers hanging (e.g. the canvas' "Recognizing" state); they now resolve with an empty export, as on a deliberate `WebSocketClient.close()`. `init()` no longer goes through `destroy()` but through the new protected `resetConnection()`; new protected `resolvePendingRequests()`
- fix(client): `WebSocketClient` math solver requests and `sendToSupport()` pending when the connection dropped abnormally (or the server sent an error) never settled: they were dropped without being rejected. They are rejected now. Two concurrent `evaluate()` calls on the same block left the second hanging, and a request whose send failed stayed queued and took the answer to the next one. **API change for subclasses**: the eleven protected `*Deferred` math queues, `resolveFirstInQueue` and `resolveAllInQueue` are replaced by `requestMathSolver(action, blockId, parameters)`, on the single pending-request queue below. New `typedKeys(object)` in core/std
- refactor(client): `WebSocketClient` keeps every request waiting on the server in one queue, `pendingRequests` (new `TPendingRequest`), filled by `waitForAnswer(key, neutral)`, settled by `answer(key, value, all?)` and `withdraw(key, reject)`, and failed, answered neutrally or forgotten in one pass by `rejectDeferredPending`/`resolveDeferredPending`/`resetAllDeferred`. **API change for subclasses**: the protected `contextlessGestureDeferred`, `exportDeferredMap`, `closeDeferred`, `waitForIdleDeferred` and `sendToSupportDeferred` are removed
- fix(client): with `offlineQueueEnabled` (the default), a network drop (1006, also each failed reconnection attempt) was emitted as `error`: the canvas reopened its error modal over the ink every `reconnectDelay`, and strokes drawn meanwhile were lost on its backdrop. **Behaviour change**: once connected, such a drop is only a connection state (`offline`/`syncing`); other close codes, a failure before the first connection and a disabled queue still emit `error`
- fix(canvas): `updateRecognitionConfiguration()` on an empty sheet (e.g. right after `clear()`) left "Recognizing" open for good, the canvas stuck `online-working`: the reopened session never sends the `contentChanged` that closes it. It is now closed when there is no ink to read
- fix(renderer): selecting several strokes crashed WebKit's renderer, which painted the SVG selection filter on each. The outline is now a CSS `drop-shadow` on the new `ms-selected` class, colored by the new `--ms-ink-selection-color` token. **API change**: `SVGRendererConst.selectionFilterId` → `SVGRendererConst.selectedClassName`; `#selection-filter` removed
- fix(renderer): erasing crashed WebKit's renderer, which painted the SVG removal filter on each stroke the eraser passed over. The fade is now a CSS `filter: opacity(25%)` on the new `ms-deleting` class. **API change**: `SVGRendererConst.removalFilterId` → `SVGRendererConst.deletingClassName`; `#removal-filter` removed
- fix(client): of two concurrent `WebSocketClient.export()` calls for the same mime type, the first never resolved: the second overwrote its pending answer. Exports now run one after another
- fix(canvas): a second export superseded by a model change cleared the shared retry's debounce timer without re-arming it, so every caller hung; with the synchronizer among them, no sync ran again and new strokes were never recognized
- fix(menu): picking a shape/edge type in `ShapeTool`/`EdgeTool` never closed the dropdown (queried `.sub-menu-content-shape`/`-edge` instead of `.sub-menu-content`), and `update()` could leave two buttons active
- fix(canvas,client): `CanvasEvent.emit()`/`ClientEvent.emit()` delivered any falsy payload (`emitIdle(false)`, `0`, `""`) as `detail: null`; now checks `data !== undefined`
- fix(client): `HTTPClientV2.post()` lacked the runtime check stripping `recognition.export.jiix.text.lines` for servers below 3.2.0 when the version is auto-detected
- fix(client): `HTTPClientV1.post()` called `response.json()` on any non-2xx response, so a non-JSON error body (proxy HTML page, empty 502/503) surfaced as a generic connection error. Both HTTP clients now share `parseApiError(response)` (`src/client/ClientApiError.ts`)
- fix(client): `WebSocketClient`/`WebSocketSSRClient` reset the ping liveness counter on every message except `Pong`, so an idle healthy connection closed with `MAXIMUM_PING_REACHED` after `maxPingLostCount * pingDelay` (default 5 min). Now resets only on `Pong`
- fix(client): all four client constructors logged `server.applicationKey`/`hmacKey` in plaintext at `info` level; they are now redacted by the new exported `redactServerSecrets(config)` (`src/client/ServerConfiguration.ts`), which returns a shallow copy with both replaced by `"[REDACTED]"`
- fix(core): `mergeDeep` could write through `__proto__` onto `Object.prototype` (`JSON.parse` makes `__proto__` an own key, passing the `hasOwnProperty` guard). **Behaviour change on an exported function**: `__proto__`, `constructor` and `prototype` keys are now dropped; no library configuration uses them
- fix(smartguide): `InteractiveInkSSRSmartGuide` interpolated JIIX candidate labels into `innerHTML`, so a crafted label executed script. Candidates are now built with `textContent`, the container emptied with `replaceChildren()`. The path was untested because `EventMock` never sets `bubbles`
- fix(manager): `IDebugSVGManager.drawRecognitionBox()` leaked 3 `pointerup`/`pointerleave`/`pointercancel` listeners on `renderer.layer` per drag
- fix(manager): `EraseManager.end()` used ES2024 `Iterator.prototype.toArray`, throwing on Safari <18.4 and older browsers
- fix(menu): `IIMenuContext.destroy()` never destroyed its `contextMenus` entries, leaking `document` listeners on every `IIMenuManager.setConfig()`
- fix(renderer): `SVGRenderer.pan()` skipped virtualization reconciliation, leaving symbols scrolled into/out of view stuck until the next zoom or `setViewBox`
- fix(components): `Minimap` deep-cloned the whole rendering layer on every mutation of the main canvas; sync is now coalesced to one per animation frame
- fix(canvas): `InteractiveInkCanvas.clear()` did not await `client.clear()`: a failure became an unhandled rejection while `await canvas.clear()` resolved (local content wiped, server kept) and the "Recognizing" badge stayed lit. It is awaited now and still reports through the `error` event
- fix(canvas,manager): `InteractiveInkCanvas.destroy()` left thirteen managers alive, leaking a full set on every `Canvas.load()`. It now destroys all fourteen in reverse construction order, guarded by a test enumerating the canvas. `IIMathManager.onDestroy()` runs for the first time, and `IIJiixQueryManager` gained an `onDestroy()` releasing its index and text metadata
- fix(canvas,manager,menu,components,client): nine swallowed errors and floating promises now reach the caller — the debounced `synchronize()` (a failure also skipped `updateLayerUI()`/`emitChanged()`), `IWriterManager`'s auto-export, both `UndoRedoMenuAction` buttons, `EditContextMenu`'s save, `WebSocketClient.messageCallback` (its `try` now covers only `JSON.parse`, so a handler fault is reported as itself), `IIMathVariableSubManager.asVariableDefinition` (no longer caches `null` on failure) and both math variable dialogs (now surface the error and always close)
- fix(manager): `IISynchronizerManager` recorded an element's fingerprint before its writes, so a throw midway left its text metadata permanently stale; the snapshot is recorded once every write has landed
- fix(manager): `IISynchronizerManager`'s metadata bookkeeping called `model.updateSymbol(stroke)` and cleared `model.exports` right after `canvas.export()`; it now passes `updateSymbol(stroke, false)`
- fix(manager): `IIJiixQueryManager.getStrokesGroupedByWord()`/`getStrokesGroupedByChar()` re-scanned `model.exports` instead of the index, returning `[]` after any transient exports clear
- fix(manager): `IITranslateManager` silently returned an unknown edge kind untransformed while rotate and resize threw; all three now go through the util registry and fail alike
- fix(symbol): a rotated text or math block reported a box mirrored about its rotation centre (and rotated twice), so surrounding it no longer selected it
- fix(model): `Model.addStroke()` now throws `Stroke id already exist: <id>` on a duplicate id, like `IModel.addStroke`/`IIModel.addSymbol`
- fix(client): `getAvailableLanguageList()` resolved with the server's error body when the request failed, and `getAvailableFontList()` threw a bare `TypeError`; both now reject with `GET <endpoint> failed: <status> <statusText>`. `LanguageMenuAction` never caught that request, so a failed language list was an unhandled rejection; it now logs it and leaves the select empty
- fix(manager): a JOIN gesture between two strokes (or any two symbols that are not both texts) of a row left the first one after the gesture in place while shifting those behind it, which landed them over or in front of it (broken since 4.0.0). The whole remainder of the row moves together again
- fix(client): `WebSocketClient` sent messages of any size, while the backend closes the connection (1009, "message too big") on an incoming message over 500 KB: a large import (`addStrokes` went a thousand strokes at a time, over 1 MB for long strokes), or a transform, erase or replace over many strokes, ended the session, and every gesture after it did nothing. `addStrokes`, `replaceStrokes`, `eraseStrokes` and the four `transform*` now split what they send to stay under the new protected `maxMessageBytes` (256 KiB), which a subclass can lower; `undo`/`redo` stay one message each, being one step of the server's history

## Features

### Every module is exported
Each folder's barrel now reaches every file in it, so the helpers the built-in clients and symbol utils were written with are available to a custom one.
- new: `resolveHmac`, `parseApiError`, `TApiError` (client helpers, for a custom client); `TKindDefinition`, `defineKind`, `resolveKind` (how the built-in families resolve their kinds — `@experimental`, not yet a stable contract)

### Place the menus where you want: `configuration.layout`
The canvas UI has 8 slots (`top-left`, `top-center`, `top-right`, `middle-left`, `middle-right`, `bottom-left`, `bottom-center`, `bottom-right`), and `configuration.layout` says what goes in each, in stacking order — e.g. `{ "bottom-center": ["action", "tool"] }` puts the action bar right above the tools.
- occupants: the menus (`action`, `style`, `tool`) and, in `InteractiveInkCanvas` and `InkCanvas` (INK_V2), the connection state (`state`) and the minimap (`minimap`)
- a slot you give replaces the default one; an occupant you leave out keeps its default slot (`enable: false` still hides a menu); one listed twice shows in its first slot only, with a warning
- the default layout is today's look; new: `LayoutManager` (`canvas.layout`), `TLayoutConfiguration`, `TLayoutSlot`, `LAYOUT_SLOTS`, `DefaultLayoutConfiguration`
- the slot shapes the menu: bars are horizontal at the top and bottom, vertical on the sides (`middle-*`), and every dropdown opens away from the slot's edge — down from the top, up from the bottom, inwards from a side — its items' sub-menus included, growing towards the inside of the canvas. A menu's `orientation` (`"horizontal"`/`"vertical"`) and `openTowards` (`"up"`/`"down"`/`"left"`/`"right"`) override its slot's; the style menu's `collapsed` forces its panel folded or open, folded by default on a narrow screen or in a shared horizontal slot
- a menu hiding in a shared slot (the style menu, when the tool is neither write nor select) folds away with a short animation and the others close the gap — none under `prefers-reduced-motion`; alone in its slot, it keeps its room as before
- at runtime: `canvas.layout.set(table)` (same rule; an occupant named in a given slot leaves the one it was in), `canvas.layout.add(key, factory, { slot, before, after })` for your own occupant and `canvas.layout.remove(key)`. The factory gets `(canvas, { slot, orientation, openTowards })` and runs again when its occupant changes slot; a menu that changes slot is rebuilt for it, the others don't move. The table stays the single source of truth: `slot` adds the key to it, and an occupant it places nowhere is not shown (with a warning)
- example: `interactive_canvas_menu_layout.html` (layout presets switched with `canvas.layout.set`, a custom occupant); the menu items example now declares its items in `options.extend`
- **no flash on load**: `options.extend` declares, next to `override`, what to add before the first render — `extend.menuItems` (like `canvas.menu.addItem`) and `extend.layout` (like `canvas.layout.add`). Item factories now get the canvas: `TMenuItemFactory` is `(canvas) => BaseMenuItem | HTMLElement` (a factory without parameter still fits). New: `TMenuItemRegistration`, `TLayoutOccupant`, `TLayoutOccupantFactory`, `TLayoutOccupantContext`, `TLayoutOccupantOptions`, `LayoutManager.onOccupantMoved`
- new: `TMenuLayoutConfig`, `TMenuStyleLayoutConfig`, `TMenuOrientation`, `TMenuDirection`, `slotOrientation`/`slotOpenTowards`/`slotAnchor`, `BaseMenuItem.openPosition` (where an item opens its sub-menu, set by its menu); `TMenuPosition` gains `top-left`, `top-right`, `left-top`
- **CSS change**: the menus no longer carry their position. `ms-menu-top-left` → `ms-menu-action`, `ms-menu-top-right` → `ms-menu-style`, `ms-menu-bottom` → `ms-menu-tool`; a slot is `.ms-layout-slot.ms-layout-<slot>`, each occupant sits in `.ms-layout-host-<name>`. The connection state and the minimap no longer position themselves either

### Add your own items to the menus
`canvas.menu.addItem(menu, key, factory, options?)` adds an item to the action, tool, style or context menu without subclassing it; `canvas.menu.removeItem(menu, key)` takes it away.
- `factory` returns a `BaseMenuItem` (updated with the menu: the generic `ButtonMenuItem`, `CheckboxMenuItem`… or your own) or a raw `HTMLElement` (static: removed with the menu, never updated). It is called on every render, since the menus are rebuilt by `setConfig`, which now keeps the added items
- `options.zone`: `"bar"` or `"dropdown"`, each menu having a default one; `options.before`/`options.after`: next to another item, by key; `options.replace`: take the place of a built-in item of the same key, refused otherwise
- a shown menu is rebuilt at once; an open context menu stays open where it was
- new: `TMenuName`, `TMenuItemFactory`, `TRegisteredMenuItem`, `IIMenuManager.getMenu`, `IIAbstractMenu.renderRegisteredItems`; `TMenuItemOptions` gains `before`, `after`, `replace`

### Math Tutor example
- feat(examples): `examples/interactive-canvas/math-tutor/`, a handwritten math workbook for edtech demos: each line is transcribed and checked as it is written, and the first wrong one gets a hint on the mistake (sign, division, square root, slip). Level 3 checks a hand-drawn right triangle and its labelled sides; once solved, the hypotenuse follows the values written

### Pen-only input for tablets
- feat(grabber): new `grabber.inputMode` (`TGrabberInputMode`): `"any"` (default), `"pen"`, or `"auto"` (any pointer until the first pen, then pen only). A resting palm no longer inks nor takes over the pen stroke; rejected pointers are ignored, not routed to pan

### Math solver settings in the Math menu
- feat(menu): Math > **Solver** submenu: angle unit, number of decimals, decimal separator, rounding mode, solving mode (algebraic, numeric or server default), automatic variable management and its scoping policy. Each change goes through `updateRecognitionConfiguration`; the decimals slider waits `MATH_SOLVER_DEBOUNCE_MS` (300 ms) after the last move
- feat(menu): each setting can be hidden through `TMathActionItemsConfig.solver` — `false` hides the submenu, or an object of `TMathSolverItemsConfig` flags (`angleUnit`, `fractionalDigits`, `decimalSeparator`, `roundingMode`, `options`, `autoVariable`, `scopingPolicy`)
- feat(menu): "Show Dependencies on Hover" and "Highlight on Select" are always built, shown only while automatic variable management is on
- feat(client): new exported `TScopingPolicy`, `TAutoVariableManagement`; `TRecognitionWebSocketConfiguration.math.solver` is now `TSolverConfiguration & { "auto-variable-management"?: TAutoVariableManagement }`
- feat(core): new exported `overrideDeep(target, override)`, a `mergeDeep` that replaces arrays

### Excalidraw integration example
- feat(examples): `examples/custom-rendering/excalidraw-websocket-client/`, the Excalidraw counterpart of the TLDraw demo, on `WebSocketClient`. Freedraw is recognized as drawn; scratch-out/strike-through erase, surround selects, underline thickens; Convert turns the selection (or scene) into Excalidraw text, rectangle, ellipse, diamond, line and arrow elements

### Shape ↔ edge connections
- feat(connector): edges follow their connected shape when it is translated, resized or rotated, before Convert (raw ink strokes) as well as after (`TEdgeLine`/`TEdgePolyLine`/`TEdgeArc` with `startAnchor`/`endAnchor`)
- feat(connector): new `IIConnectorManager.getFollowedStrokeIds(symbolIds)`, read-only counterpart of the rigid-follow pass

### Export
- feat(export): `InteractiveInkCanvas.exportAs(format, options?)` returns content in nine formats, typed by format: `json` → `TSymbol[]`; `svg`/`text`/`markdown`/`mermaid`/`plantuml` → `string`; `png` → `Blob`; `llm` → `TLLMExport`; `jiix` → `TJIIXExport`
- feat(export): `InteractiveInkCanvas.download(format, options?)`, same formats plus `pdf`. New downloads: `markdown` (`.md`), `mermaid` (`.mmd`), `plantuml` (`.puml`), `llm` (`.json`), `jiix` (`.jiix`)
- feat(manager): new `ExportManager` (`src/manager/base/`) — scope/symbol resolution, file naming, object-URL lifecycle, `json`/`svg`/`png`/`pdf`. Exposes `TExportFormat`, `TDownloadFormat`, `TExportResultMap`, `TExportOptions`, `TDownloadOptions`, `TPDFDownloadOptions`, `TExporterMap`, `EXPORT_EXTENSIONS`, `EXPORT_MIME_TYPES`
- feat(manager): new `IIExportManager` (`src/manager/interactive/`, `canvas.exportManager`) — `text` from the JIIX stroke index, `jiix`/`markdown`/`mermaid`/`plantuml`/`llm` from one JIIX access point. Empty content yields empty output
- feat(client): new exported `TRecognitionType` (`"text" | "shape" | "math"`)
- feat(export): Markdown conversion derived locally from JIIX (`jiixToMarkdown`, `src/export/toMarkdown.ts`): Text → paragraphs, Math → `$$...$$`, diagram Node/Edge skipped
- feat(export): Mermaid flowchart conversion derived locally from JIIX (`jiixToMermaid`, `src/export/toMermaid.ts`). Node kinds map to the closest Mermaid shape (rectangle/circle/ellipse/rhombus/parallelogram; triangle and polygon fall back to rectangle). Edge endpoints (Line/PolyEdge/Arc via `computePointOnEllipse`) are matched geometrically against node boxes, since JIIX `connected`/`ports` are always empty today

### PDF export via native browser print
- feat(canvas): `download("pdf", options?)` prints the content (or selection) through the browser's print dialog. With no PDF setting, opens a settings dialog (page format/orientation/page mode/scale) first and settles when it closes, cancellation included; with any setting, prints immediately with defaults for the rest
- feat(manager): new `PDFExportManager` (`src/manager/base/`, `(canvas: TInteractiveInkCanvas | InkCanvas)`) — print-only DOM/CSS layer, page computation (`computePageCount`, `computeFitToPageScale`, `getPageDimensionsMm`), single-page fit and multi-page tiled modes (`buildSinglePagePrintContainer`/`buildMultiPagePrintContainer`), settings dialog (`openExportDialog`, reusing `Modal.ts`), `print()`. Exposes `TPDFPageFormat`, `TPDFOrientation`, `TPDFPageMode`, `TPDFExportDialogOptions`, `TPDFPageOptions`, `TPDFPageCount`, `TPDFPageSizeMm`, `PDFExportManager.DEFAULT_OPTIONS`
- feat(menu): `ExportMenuAction`/`ExportContextMenu` build ten entries (JSON, SVG, PNG, Text, Markdown, Mermaid, PlantUML, LLM, JIIX, PDF), each toggleable via `TExportActionItemsConfig`/`TContextExportItemsConfig` and routed through `canvas.download()`; the context menu resolves its scope at click time

### Types returned by public methods can be named
- feat(manager): `TAnchoredEdgesUpdateResult`, `TFollowedStroke` (`IIConnectorManager`), `TShift` and `TSplitOutcome` (`InsertGestureHandler.computeChangesOnSplitText`) are exported

## Performance
- perf(manager): `IISynchronizerManager` drafted (a `structuredClone`) every stroke of the document on every synchronize, before knowing whether its block changed, and redrafted and recommitted every edge stroke even when its anchors were unchanged. It now reads the committed strokes and drafts only the ones it writes: a sync of an unchanged 4000-stroke document (80 points each) goes from 128 ms to 94 ms. Its loop also yielded a frame every 50 elements, so that same sync took 80 frames (1.3 s) with nothing to do; it now yields once 8 ms of work are spent: 27 ms, 1 frame. **API change**: `IISynchronizerManager.SYNC_YIELD_CHUNK_SIZE` → `SYNC_YIELD_BUDGET_MS`
- perf(manager): `IIConversionManager.convertNode()`/`convertEdge()` deduped strokes in O(n²), copy-pasted 4×; now the exported O(n) `uniqueById()` (`src/core/std/object.ts`)
- perf: six hand-rolled "coalesce to one `requestAnimationFrame`" copies (`IIWriterManager`, `IIMoveManager`, `Minimap`, `IISelectionManager` arc-handle drag, `Chart.ts` pan, `InteractiveInkCanvas` wheel-zoom) replaced by the exported `RafCoalescer` (`src/dom/RafCoalescer.ts`)

## Refactor
- refactor(renderer): `CanvasRendererStroke`/`SVGStroker` share the stroke-outline point math — exported `computeLineOutlinePoints()`/`computeQuadraticOutlinePoints()`/`computeFinalOutlinePoints()` (`src/core/geometry/outline.ts`) — and only encode it into their own API
- refactor(canvas): `AbstractCanvas` owns the cursor-class toggle (`setCursorStyle()`, new `abstract get tool(): CanvasTool`, `protected` hooks `cursorClasses`/`getCursorClass()`), previously copied into all four variants; `InteractiveInkCanvas` only overrides the hooks
- refactor(canvas): `AbstractCanvas.resolveDimensions()` (new `abstract get minDimensions()`) replaces the size fallback repeated in all four `resize()`
- refactor(canvas): `AbstractCanvas.teardownCommon()` (new `abstract renderer: { destroy(): void }`) replaces the teardown sequence repeated in all four `destroy()`; each still calls `clearRootElementReference()` last
- refactor(client): `HTTPClientV1`/`HTTPClientV2` share `resolveHmac()` (`src/client/shared/HmacAuth.ts`); the WebSocket clients keep their own HMAC-challenge flow
- refactor(client): every server URL comes from the new exported `serverUrl(server, endpoint, { websocket?, query? })` (`src/client/shared/ServerConfiguration.ts`) instead of seven copies of `${scheme}://${host}/api/v4.0/iink/…` in the four clients, `getAvailableFontList`, `getAvailableLanguageList` and `getApiInfos`
- refactor(client): `getAvailableFontList`, `getAvailableLanguageList` and `getApiInfos` fetch through the new exported `getJSON(server, endpoint)`, which rejects on a non-2xx status instead of parsing the error body. `getApiInfos` keeps its fallback to 3.1.3, now with `gitCommit: "unknown"` whatever the failure
- refactor(examples): the anti-flash-of-wrong-theme inline script, identical in 69 of 71 example pages, is now `examples/assets/js/theme-init.js`, loaded at the same head position

# [v4.1.0](https://github.com/MyScript/iinkTS/tree/v4.1.0)

## Features

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
