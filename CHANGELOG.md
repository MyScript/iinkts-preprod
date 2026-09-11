# [v5.0.0](https://github.com/MyScript/iinkTS/tree/v5.0.0)

See [MIGRATION.md](./MIGRATION.md) for step-by-step upgrade instructions.

## Breaking Changes

### A stroke's thickness follows the pen, not the sampling rate
Width was read off each pointer's `p`, which the capture overwrote with a value derived from the gap to the previous pointer. Spacing is only a proxy for speed while the sampling rate holds steady, and it does not: the browser coalesces samples under load. The same gesture therefore came out **17% thicker** when the samples arrived twice as densely.
- `p` on a stored pointer is now exactly what the device reported, and nothing writes it back. Width is derived at draw time from distance over elapsed time, which reads the same however densely the stroke was sampled
- a pen that reports a pressure of its own overrides the estimate; a constant pressure — what a mouse and most touch devices report — is read as "no measurement" rather than as a flat one
- thinning is measured against a reference speed rather than from a standstill, so the slow part of a stroke keeps its full width and the whole range is available to the fast part. Without it every nib came out flatter than intended, and picking an expressive one merely drew everything thinner
- a nib may carry a **broad edge** (`edgeAngle`), and then width follows the angle between travel and that edge instead of following speed — the property that makes a stroke look written rather than extruded. `fountain` holds a 45° edge: a circle comes out full on the sides across the edge and hairline where it runs along it, a 7:1 ratio at one unchanging speed. It reads geometry alone, so unlike speed it works on a document that carries no timing
- a nib's ceiling is its own (`max`), and may exceed the nominal width: `brush` reaches 1.6, so where the hand slows the stroke swells past the width the style asks for. A nib that can only subtract width cannot look like a brush
- the end taper is capped at a share of the stroke's own length. Real handwriting runs about 55 units per stroke, so the broadest nib's 22-unit taper at each end left 11 units of full width and drew a limp even line
- `smoothing` averages a nib's width over neighbouring pointers, for the inertia a tuft of hair has — `brush` uses it so its width does not track speed point by point
- a stroke whose `dt` was filled in from the pointer index carries no measured timing, and is left unshaded rather than shaded by an invention
- removed: `StrokeOps._computePressure` and `Model.computePressure`, which had no reader left
- new: `computeWidthProfile`, `computeOutlinePointers`, `isPenNib`, `PEN_NIBS`, `DEFAULT_PEN_NIB`, `TPenNib`, `TNibProfile`
- all three stroke renderers — SVG, SSR and Canvas — go through the same profile, so width is decided in one place

### A stroke records the instrument it was drawn with
`TStyle.pen` names a nib: `ballpoint` (uniform line, blunt ends), `pencil`, `fountain` and `brush`, in order of how strongly speed and pressure move the line. It sits on the style rather than on the tool so a document reopened later redraws each stroke with the nib it was written with.
- the write tool in the built-in menu becomes a submenu, the way the shape tool already was: `ms-menu-tool-write-pencil` is now the trigger, with one button per nib beside it
- `pencil` is the default. **Strokes drawn by an earlier version render differently**: width now follows the pen's speed, and every nib reaches full width on a deliberate stroke while thinning as the pen accelerates. `ballpoint` is the one that draws a line of constant width
- an unknown value under `pen` falls back to the default instead of throwing — a style is a loose bag of strings and numbers
- `TStyle.penAngle`, `penSmoothing` and `penSpeed` override the nib's own values on a single stroke, so two settings can sit side by side on the canvas and be compared. `readNibOverrides` reads them
- the style menu gains a nib picker, which applies to the current selection as well as to the pen: **a stroke already written takes a new nib and redraws**, because what was captured is the path and not the thickness
- the action menu gains a `Pen` submenu for the tunables. A setting the current nib does not read is disabled rather than hidden
- new example: `interactive_canvas_pen_nibs.html`, which draws one generated gesture per nib so the four can be compared without the hand getting in the way

### A stroke computes its own length
`TStroke.length` and `TLegacyStroke.length` are gone. The field was an accumulator maintained by hand whose only per-pointer reader was the pressure estimator above; with that gone it was written and never read. The earlier note in this changelog kept it on the grounds that deriving it on read would make drawing a stroke quadratic in its own pointer count — that reasoning applied to a reader running once per pointer, and no longer holds.
- use `StrokeOps.computeLength(stroke)`, or `SymbolGeometry.lengthOf(symbol)` for the document-frame length. `TSymbolGeometry.length` is unchanged: it was already computed on read

### A pointer stores when it was captured, relative to its stroke
`TPointer.t` is renamed `TPointer.dt` and its meaning changes: it counted epoch milliseconds, it now counts milliseconds since the stroke began, so the first pointer of every stroke is at 0. The absolute instant is `stroke.creationTime + dt`, which is what `toWireStroke` sends — the recognizer reads the order strokes were written in from those absolute times.
- the rename is deliberate. Same name with a new meaning would have compiled everywhere and silently mis-timed every integrator who reads pointers; `dt` fails loudly instead
- **reading old documents keeps working.** `StrokeOps.createFromPartial` and `IIPlaybackManager.play` accept pointers that still carry the absolute `t` and rebase them, recovering both the intervals inside a stroke and the stroke's own `creationTime`
- pointer times are no longer rounded to whole milliseconds. A pen samples several times per millisecond, and the previous default reported consecutive samples as captured at the same instant — 18% of intervals in a reference capture had a duration of exactly zero. `DefaultGrabberConfiguration.timestampFloatPrecision` changes from `0` to `-1` (no coarsening); it can still coarsen, it no longer decides the default
- each coalesced sample is timed from its own event rather than from one clock read taken while replaying the batch, which is what produced those zero-length intervals
- new: `TPointer.dt`, `TPointerImport`, `TStrokeImport`, `resolvePointerDelta`, `resolveStrokeOrigin`, `TPointerInfo.gestureStartTime`, a third `creationTime` argument to `StrokeOps.create`
- every `dt` is an offset from its stroke's origin, never a difference between consecutive points. `StrokeOps.split` and the insert gesture's sub-strokes therefore inherit the origin of the stroke they were cut from — a fresh one would have claimed their points were drawn at the moment of the split. The insert gesture's sub-strokes also keep the original `pointerType`, which they previously dropped
- fixed: `IIPlaybackManager.play` ordered strokes by their first pointer's timestamp. Every first pointer is now at 0, so it orders by stroke origin instead

### The document is immutable
Symbols are frozen when committed and handed to readers directly, instead of the whole document being deep-cloned on every read. Reading `model.symbols` on a 500-stroke document goes from 11.59 ms to 0.0012 ms; the cost moves to the write side, where building a 200-stroke model is 28% slower.
- mutating a symbol read from `model` now throws — ask for `model.draftSymbol(id)` and hand it back with `model.commitSymbol(draft)`. Enforced at runtime by `Object.freeze`, not by the types
- a draft is frozen once committed, so a per-frame gesture needs a fresh draft each frame
- `model.selectedIds` is a `ReadonlySet`; `modificationDate` and `exports` are getters
- new: `SymbolStore`, `TDraft`, `TReadonlyDeep`, `TSymbolOrder`, `IIModel.symbolCount`, `IIModel.decoratorsByTargetId`, `IIModel.selectionVersion`
- fixed: `changeOrderSymbol` was a no-op; partially erasing characters was never stored; undo/redo replay rewrote the history entry it was replaying; edge-connection anchors were silently dropped behind a swallowed throw
- see [MIGRATION.md](./MIGRATION.md)

### A symbol says whether it resizes with its ratio locked
- new: `SymbolUtil.keepsAspectRatio(symbol)`, `false` by default. `TypesetUtil` returns `true` for both text and math — a font size is one number, so scaling the axes unequally would ask for glyphs that do not exist — and the shape util returns it for the circle, whose single radius cannot describe two scales
- `IIResizeManager` decided this with `isText(s) || isMath(s) || (isShape(s) && isCircleShape(s))`, a question about a symbol asked from outside it. A custom symbol could never require a locked ratio however badly a free scale would distort it; now it can. No type test is left in that manager
- additive: the default means an existing custom util needs no change

### A symbol the library does not know can be transformed
The three transform managers reached their per-type behaviour through a `switch (symbol.type)` in `IIAbstractTransformManager` with a throwing `default`. A custom symbol could be created, stored, selected and drawn, and then not moved — however well its util was registered. Both the switch and the five `protected abstract applyTo*`/`applyOn*` members it existed to reach are gone.
- `IIAbstractTransformManager` now declares one `protected abstract applyThroughUtil(symbol, matrix)`. A subclass implements that instead of `applyToStroke`, `applyToShape`, `applyToEdge`, `applyOnText` and `applyOnMath`
- removed: `IIAbstractTransformManager.transformName`, whose only reader was the deleted error message
- `applyToSymbol` no longer returns early for a decorator. `DecoratorUtil` implements the three operations as deliberate no-ops — a standalone decorator's bounds are recomputed from the symbols it decorates — so the exception now reads where the behaviour lives
- a symbol whose type no util owns still fails, from `symbolRegistry.getUtilFor`: `No util is registered for type "x". Registered types: …`, which distinguishes a typo from a registry that was never populated. The old message was `Can't apply resize on symbol, type unknown: {…}`
- see [MIGRATION.md](./MIGRATION.md)

### A symbol stores no geometry it can compute
`bounds`, `vertices`, `snapPoints` and `edges` are gone from every stroke, shape and edge type. They were copies of a computation, kept in step by hand: any path that moved a symbol's coordinates and forgot to re-derive left a stale box behind coordinates that read correctly, and the damage surfaced later in hit-testing rather than where the write happened. They are computed on read now, behind a cache keyed on the frozen record's identity — a mutated symbol is a different object, so there is no invalidation to get wrong.
- new: `SymbolGeometry.boundsOf(symbol)`, `verticesOf`, `snapPointsOf`, `edgesOf`, `lengthOf`, plus `of(symbol)` for the whole record in one call and `rawOf(symbol)` for the pre-transform geometry. Every accessor works detached, so `symbols.map(SymbolGeometry.boundsOf)` is fine
- removed: `SymbolUtil.updateDerivedFields` and every per-kind implementation, `StrokeOps.updateBounds`, and the `updateDerivedFields` on each `*Ops`. Nothing needs refreshing after a write any more
- `TStroke.length` **stays**: it is an accumulator `StrokeOps.addPointer` maintains and `_computePressure` reads once per pointer, not a value read from storage. Deriving it on read would make drawing a stroke quadratic in its own pointer count. `SymbolGeometry.lengthOf` reports the document-frame length (raw × scale) and needs no stored field
- `TText.bounds` and `TMath.bounds` **stay**: a typeset symbol's box is measured from the DOM with `getBBox()`, not derived from coordinates it owns
- new on `OBBOps`: `toCorners`, `fromCorners`, `polygonOverlapsQuad`, `toUnrotatedBox`, `getSnapPoints`
- see [MIGRATION.md](./MIGRATION.md)

### A symbol carries where it sits, as a matrix
`TBaseSymbol.transform` is a persisted `TMatrixTransform`, identity by construction. A translate, rotate or resize composes into it; the symbol's own coordinates are what it was created with and never move again.
- the renderer applies a committed transform by rewriting one `transform` attribute (`SVGRenderer.setSymbolTransform`) instead of rebuilding the element
- undo is exact: re-applying an inverse matrix restores the value bit for bit, where re-transforming coordinates accumulated rounding at every step
- reads go through `SymbolGeometry`, which applies the matrix; writes into a symbol's own frame must map the incoming point back through it first — new: `applyInverseMatrixToPoint(point, matrix)`
- removed: `TText.rotation`, `TMath.rotation` and the `TRotation` type. The matrix supersedes them
- removed: `IIAbstractTransformManager.setTransformOrigin`, and its `translateElement`/`rotateElement`/`scaleElement`. A live gesture composes its own matrix onto the stored one instead of writing a CSS transform that would overwrite it — which is what made an already-rotated typeset symbol lose its rotation the moment you started dragging it
- new: `isIdentityMatrix(matrix)`, `mergeSymbolTransform(partial)`
- `StrokeSerializer` bakes the matrix at the network boundary, so the wire format is unchanged
- see [MIGRATION.md](./MIGRATION.md)

### One context for all three transforms
- removed: `TTranslateContext`, `TRotateContext`, `TResizeContext` → one `TTransformContext`, `{ matrix }`. The three had become identical: the measuring port, the rotation centre and the scale origin were all still being passed and read by nobody, because the matrix carries the centre and the origin folded in and a typeset symbol's measured box does not change when it moves
- removed: `TTypesetPort`, whose only reader was the port field above

### History records what changed, not how
`TIIHistoryChanges` had a form per operation: `translate`, `rotate`, `scale`, `matrix` and `style`, each carrying the *parameters* of a change — a delta, an angle, a pair of factors, a colour — so undo could re-derive the previous state by applying an inverse. None of them is needed once a transform writes to `symbol.transform` and a restyle to `symbol.style`: both are part of the record, so the record is the state. All five are gone; `updated` is the only way a change to an existing symbol is recorded.
- removed: `TIIHistoryChanges.translate`, `rotate`, `scale`, `matrix` and `style`
- removed: `TIIHistoryBackendChanges.translate`, `rotate`, `scale` and `matrix`. Undo and redo reach the server as a stroke replacement, whose wire form carries the moved coordinates — `StrokeSerializer` bakes the matrix in
- `TIIHistoryChanges.updated` is now `{ before: TSymbol; after: TSymbol }[]`, a list of pairs, where it was `{ oldSymbols: TSymbol[]; newSymbols: TSymbol[] }`. Two parallel lists could fall out of step, and a length mismatch paired the wrong symbols together on undo without a word; the pairing is the type now
- new: `appendUpdated(changes, pairs)`. One undoable step can gather symbols from several sources — a transform records the symbols dragged *and* the connected edges recomputed from them — and assigning `updated` twice kept only the last writer
- undo is exact where it used to be arithmetic: restoring a record needs no inverse. A scale's reversal was `1 / scaleX`, which is `Infinity` at zero and ignores the origin the scale was taken about
- `IITypesetManager.moveTextAfter` returns `{ before, after }[]` instead of `TSymbol[]`: it is the only place that knows which texts it shifted, so it is the only place their pre-move snapshots can come from
- fixed: a restyle never reached the server, `style` having had no backend form. It travels as a replacement now, so undoing a colour change no longer leaves the server holding the old one
- fixed: `IITranslateManager.translate(symbols, …)` recorded `model.symbolsSelected` rather than the symbols it was asked to move. Called with anything else, it produced an entry with no symbols at all, and undo consumed it and applied nothing
- fixed: thickening strokes by a gesture recorded the pre-change record as the *new* symbol, so redo restored the value it was already at
- `WebSocketClient.transformMatrix` is still there and still works, but nothing in the library calls it any more — it was reachable only through the removed `matrix` undo path

### A decorator's box is named for where it comes from
`TDecorator` was the one symbol type whose `bounds` was never derived: a decorator holds no coordinates of its own and is placed over other symbols, so its box arrives from outside — the recognizer's word box when JIIX has answered, the union of its targets' boxes otherwise. It is the only stored geometry left on a stroke, shape or edge-like symbol, and it is renamed so it cannot be read as a leftover derived field.
- renamed: `TDecorator.bounds` → `TDecorator.targetBounds`, now optional. `DecoratorOps.setBounds(decorator, obb)` → `DecoratorOps.setTargetBounds(decorator, obb)`
- removed: `TDecorator.hasBounds`. Presence of `targetBounds` is the flag, so the two can no longer disagree — the boolean used to shadow a zero-size box
- fixed: `DecoratorUtil.create` read the incoming partial's box as a `TBox` behind a cast and handed it to `OBBOps.fromBox`, which reads `.x`/`.y`. A decorator serialised by iinkTS itself — a `TOBB`, carrying `center` and no `x` — came back with a NaN centre on re-import
- fixed: erasing one target out of several threw `TypeError: Cannot assign to read only property 'targetIds'`. That branch wrote onto the frozen record `model.symbols` hands out, so it had been dead since the document became immutable; it drafts and commits now

### A symbol moves, turns and scales itself
Translating used to be three managers' business: `IIAbstractTransformManager` switched on `symbol.type` to reach five abstract methods, and two of those switched again on kind — so a symbol type the library did not know threw instead of moving. The three operations are `SymbolUtil` members now.
- new: `SymbolUtil.translate(symbol, context)`, `rotate(symbol, context)`, `resize(symbol, context)`, all three **concrete**. Each composes the given matrix onto `symbol.transform` through `SymbolUtil.applyTransform`, which is the whole of moving any of the six built-in types — none of them overrides these. A custom util inherits all three and only needs its own body if it stores something a matrix cannot express
- new: `TTransformContext` (`{ matrix }`), the second argument to all three
- new: `TypesetUtil`, an abstract util that `TextUtil` and `MathUtil` extend, in `src/symbol-utils/typeset/`. `TText` and `TMath` differ only in the list they hold, so what they share is written once
- `IIResizeManager.applyOnTypeset` handled text and math together and branched on `isText(symbol)` twice — once for the font list, once for the derive. Both type tests are gone, with the method
- see [MIGRATION.md](./MIGRATION.md)

### A symbol offers its own resize handles
`EdgeOps.getEdgeResizePoints` is gone. It was an `if/else` over the three edge kinds with a single caller, reaching the very functions the edge util's kind table already reaches.
- removed: `EdgeOps.getEdgeResizePoints(edge)` → use `symbolRegistry.getUtilFor(symbol).getResizePoints(symbol)`, which answers for any symbol type including your own
- new: `SymbolUtil.getResizePoints(symbol)`, empty by default — most symbols resize by their bounding box alone, and only the edge kinds offer per-vertex handles
- new: `TResizePoint`, the `{ point, vertexIndex }` shape that was written out inline in four places. Structural, so existing code needs no change
- see [MIGRATION.md](./MIGRATION.md)

### A custom symbol has to be able to draw itself
`SymbolUtil.getSVGElement` was optional, so a custom util could register successfully and then render nothing at all, with no error anywhere. It is now a required member.
- `SymbolUtil.getSVGElement(symbol)` is abstract. A custom util that omits it no longer compiles; return `undefined` for a state you deliberately do not draw
- the SVG renderer no longer checks whether a util can draw, so its "no util for symbol" error now means what it says. It used to fire for a util that existed but had no draw method
- `InkCanvasDeprecated` (INK_V1) still ignores it: that variant draws through `CanvasRenderer`, which dispatches on `isStroke` and two fixed tables rather than asking the registry, so a custom symbol is invisible there and logs "symbol type unknown". The three other variants draw it
- see [MIGRATION.md](./MIGRATION.md)

### The client owns the stroke shape it sends
`StrokeOps.formatToSend` is gone. The conversion now lives in the client, which is the layer that owns the protocol, so the client no longer depends on the symbol layer to talk to the server.
- removed: `StrokeOps.formatToSend(stroke)` → use `toWireStroke(stroke)`
- new: `toWireStroke`, `TRecognitionStroke` (`{ id, pointerType, pointers }` — what you hand the recognizer), `TRecognitionPointer` and `TWireStroke` (the column-array form that goes on the wire)
- a pointer's `t` and `p` are **optional**, so a caller building strokes itself can send geometry alone. `t` is worth supplying whenever the capture source has it: the recognizer uses inter-point timing to segment characters and resolve ambiguous shapes, so leaving it out measurably degrades results on cursive text and multi-pass shapes
- `TWireStroke.t` and `.p` are optional to match, and are emitted all-or-nothing — a partially filled column would misalign with `x`/`y` and corrupt the stroke
- `TStrokeGroupToSend.strokes` and `THTTPClientV2PostData.strokes` are now `TWireStroke[]` instead of three copies of the same inline shape
- renamed: `TStrokeMinimal` → `TStrokeCapture`, where it stays in the symbol layer as the base of `TStroke`
- `WebSocketClient.addStrokes`/`replaceStrokes`/`recognizeGesture` and `HTTPClientV2.send` now take `TRecognitionStroke`. A `TStroke` still satisfies them — TypeScript is structural, so no conversion is needed at the call site
- see [MIGRATION.md](./MIGRATION.md)

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
- fix(smartguide): `InteractiveInkSSRSmartGuide`'s candidate list interpolated JIIX candidate labels straight into `innerHTML`, so a crafted label coming back from the recognition response executed script in the host page. `createWordSpan` in the same file already built its span with `textContent`, so this was an oversight rather than a deliberate difference. Each candidate span is now built with `createElement` + `textContent`, and the container is emptied with `replaceChildren()` instead of `innerHTML = ""`. Note that the pre-existing `test.skip` covering this path blamed the event target for being untestable; the real reason is that `EventMock` never sets `bubbles`, so a mock event dispatched on a child can never reach a delegated listener — which is why this path was never tested
- fix(utils): `mergeDeep` could write through `__proto__` onto `Object.prototype`, polluting every object in the page. The `hasOwnProperty` guard was not enough: `JSON.parse('{"__proto__": {...}}')` yields `__proto__` as an *own* enumerable property, so it passed, and reading `target["__proto__"]` then hit the getter and returned `Object.prototype`, which the recursion merged into. `__proto__`, `constructor` and `prototype` are now refused before the copy. **Behaviour change on an exported function**: a source object carrying one of those three keys now has it dropped rather than merged. No configuration in the library uses those names as keys, across all 57 `mergeDeep` call sites. (`constructor` was in fact not exploitable — `isObject` rejects a function, so the deep-write branch was never taken — but it is refused anyway and a test pins that shut)
- fix(canvas): `InteractiveInkCanvas.clear()` called the async `client.clear()` without awaiting it. The floating rejection escaped the enclosing `try`/`catch` entirely, so `manageError` never ran and the failure reached the integrator as an unhandled rejection while `await canvas.clear()` resolved as a success — local content wiped, server content kept, no way for the caller to know. The `"Recognizing"` badge also stayed lit forever, because the `onContentChanged` handler that bulk-clears it is driven by the client's `contentChanged` event, which never arrives after a failed clear. The call is now awaited and the operation is cleared on the failure path. `clear()` still resolves and reports through the `error` event, as the other backend-calling methods do
- fix(manager): `IISynchronizerManager` recorded an element's content-fingerprint snapshot *before* running that element's write loop, so a throw halfway through marked the element as synchronized for the rest of the session. The `needsMetadata` re-check cannot rescue that case: `jiixBlockId` is already correct by then, and the write that was actually lost — the text metadata — appears in neither that check nor the snapshot key, so the element was never reprocessed and its metadata stayed permanently stale after a content change. The snapshot is now recorded only once every write for the element has landed
- fix(canvas,manager): `InteractiveInkCanvas.destroy()` released four of the managers it owns (client, exportManager, menu, playback) and detached five grabber-like ones, but left the other thirteen `IIAbstractManager`-derived managers standing with their state intact — `teardownCommon()` touches no manager at all. Since `Canvas.load()` destroys the previous instance on every call, each load leaked a full set. `destroy()` now cascades to all fourteen in reverse construction order. This also makes `IIMathManager.onDestroy()` run for the first time: it clears five caches and cascades to the three math sub-managers, and was unreachable dead code until now. `IIJiixQueryManager` gained the `onDestroy()` it was missing, dropping its index and its text metadata — both hold references into the document, so keeping them populated retained the whole symbol graph. The cascade is an explicit list guarded by a test that enumerates the canvas at runtime, so a manager added later and forgotten fails that test instead of leaking silently
- fix(canvas,manager,menu,components,client): nine swallowed errors and floating promises now reach the caller. `InteractiveInkCanvas`'s debounced `synchronize()` sat in a `try`/`finally` with no `catch`, so a failure was an unhandled rejection **and** skipped both `updateLayerUI()` and `emitChanged()` — the UI never refreshed and consumers never learned the document had moved, on the path that runs 500ms after every stroke. `IWriterManager`'s auto-export, both `UndoRedoMenuAction` buttons and `EditContextMenu`'s save all awaited a canvas call inside an async listener or timer with nothing catching it; each failure was an unhandled rejection at the integrator, and the edit-menu one left the text half-rewritten with no redraw. `WebSocketClient.messageCallback` wrapped its whole twelve-case dispatch switch in `catch { emitError(new Error(message.data)) }`, so any fault inside a handler was reported as though the payload were malformed — the `try` is now narrowed to the `JSON.parse` (where reporting the payload is the right diagnostic) and a handler's own error is reported as itself. `IIMathVariableSubManager.asVariableDefinition` cached `null` on failure from a bare `catch`, so one transient error pinned that block as undefined for the rest of the session with no trace; failures are no longer cached, and the success path already caches a legitimately absent definition. Both math variable dialogs logged and swallowed a failed `Promise.all` of variable writes, leaving the modal open with no feedback after partial writes; they now surface the error and always close
- fix(manager): `IIJiixQueryManager.getStrokesGroupedByWord()`/`getStrokesGroupedByChar()` located their JIIX element by re-scanning `model.exports` with a linear `find`, even though the index they had just validated holds it in `elementById`. That was not only a scan: `ensureIndexValid()` deliberately keeps the existing index when exports are cleared transiently (its own comment says so), and these two defeated that — after any `updateSymbol()` cleared the exports, both returned an empty array with a perfectly good index in hand. Both now resolve through the index. Neither method had any test before; they have three now, including one that pins the transient-clear case
- fix(manager): `IITranslateManager.applyToEdge()` switched on three edge kinds with no `default` and fell through to `return edge`, so an edge kind it did not know was silently returned untransformed. Its two siblings, `IIResizeManager` and `IIRotationManager`, both `throw` in that case — a new edge kind would have been silently un-translated while failing loudly on rotate and resize. Translate now throws like the others, and the missing test was added to rotation too so all three pin the same contract
- fix(symbol,symbol-utils): a rotated text or math block reported a box that did not match what was drawn, so surrounding it no longer selected it. Three faults, all on the model side. `computeTypesetVertices` and `computeTypesetSnapPoints` turned the box by `-degree` while the renderer writes `rotate(+degree, center)` on the symbol's group — and `computeRotatedPoint` is that same transform, so the model described the rendered quad **mirrored** about the rotation centre. They were the only two negations of their kind in the library. Both helpers were also fed `OBBOps.toBox(bounds)`, which for a non-zero angle returns the axis-aligned *envelope* of the already-rotated box, so the rotation was applied twice; they now take `OBBOps.toUnrotatedBox`, new alongside it. And `MathUtil` never updated `bounds.angle` or its derived fields after a turn at all, so a rotated math block could not be surrounded whatever the sign — `TypesetUtil.rotate` now does both for text and math, without re-measuring, since a typeset symbol's box is measured from its unrotated glyphs and cannot depend on the angle. That dropped the last reader of the rotate context's `typeset` port, which went with the port itself when the three transform contexts merged. `bounds.angle` is still written on purpose: `OBBOps.toBox` uses it to report the area a symbol covers on screen, which the erase hit box, decorator bounds and annotation extents all rely on. Wrong since the negation was introduced, not by the transform refactor — survivable at small angles, where only the y is mirrored, until the switch to oriented bounds added the envelope and pushed the mismatch past what selection tolerated
- fix(symbol-utils,manager): translating or rotating a selection of typeset symbols moved only the first one in the document. `IITypesetManager.updateBounds` measures **and** commits, and `SymbolStore.update` deep-freezes what it stores, so the draft came back frozen and the transform manager's own `commitSymbol` then threw a `TypeError` stamping `modificationDate` on it. The throw escaped `applyAndDraw`'s loop, leaving every symbol after the first untransformed while the drag preview showed all of them moved — so selection and hit-testing afterwards pointed at where they used to be. The transform port is now `setBounds`, which measures only: a util transforms a draft, and committing it is the caller's business. This also makes `applyToSymbol` consistent, since it never committed a stroke, shape or edge either. Present since the store began freezing, not introduced by the transform refactor
- refactor(manager,core): every coordinate a transform writes is now rounded to three decimals. Thirteen sites went through `MatrixTransform.applyToPoint` raw while their neighbours went through a rounding helper, so resizing a line stored `10.333` where translating the same line stored `10.333333333333332` — and a circle's centre kept full precision under translate and rotate while its radius was rounded in the same branch. `applyMatrixToPoint`/`applyMatrixToPoints` are now exported from `core/geometry`, where a symbol util can reach them; the rounding helper had been a `protected` method on the transform manager base. Derived fields (`bounds`, `vertices`, `snapPoints`, `edges`) are unchanged: they are recomputed from the stored geometry, and arithmetic on a rounded value is not itself a rounded value. Observable if you compare a transformed coordinate for exact equality

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
