# Migration Guide

## v4.x → v5.0.0

### Exports: nine methods become two

Every export goes through `exportAs(format, options?)` (get the content) or `download(format, options?)`
(get the file). The nine methods below no longer exist — there is no compatibility shim, so
`yarn build:lib` / your own typecheck will point at every remaining call site.

| v4.x | v5.0.0 |
|---|---|
| `canvas.downloadAsJson()` | `canvas.download("json")` |
| `canvas.downloadAsJson(true)` | `canvas.download("json", { scope: "selection" })` |
| `canvas.downloadAsSVG()` | `canvas.download("svg")` |
| `canvas.downloadAsSVG(true)` | `canvas.download("svg", { scope: "selection" })` |
| `canvas.downloadAsPNG()` | `canvas.download("png")` |
| `canvas.downloadAsPNG(true)` | `canvas.download("png", { scope: "selection" })` |
| `canvas.downloadAsText()` | `canvas.download("text")` |
| `canvas.downloadAsText(true)` | `canvas.download("text", { scope: "selection" })` |
| `canvas.printAsPDF()` | `canvas.download("pdf")` |
| `canvas.printAsPDF(true)` | `canvas.download("pdf", { scope: "selection" })` |
| `canvas.printAsPDF(false, { mode: "multi" })` | `canvas.download("pdf", { mode: "multi" })` |
| `await canvas.toMarkdown()` | `await canvas.exportAs("markdown")` |
| `await canvas.toMermaid()` | `await canvas.exportAs("mermaid")` |
| `await canvas.toPlantUML()` | `await canvas.exportAs("plantuml")` |
| `await canvas.toLLM()` | `await canvas.exportAs("llm")` |

`canvas.export(mimeTypes)` is unchanged — it stays the low-level server export.

#### Everything is a promise now

`downloadAsSVG`/`downloadAsPNG`/`downloadAsJson` used to return `void`. Their replacements are
`async`, so `await` them (or handle the returned promise) where you relied on the call having
finished:

```diff
- canvas.downloadAsSVG()
- doSomethingAfter()
+ await canvas.download("svg")
+ doSomethingAfter()
```

This closes a real bug in `downloadAsPNG`: it went through `image.onload` and returned before the
bitmap existed. `exportAs("png")` resolves with a fully rasterized `Blob`.

#### Selecting what to export

The positional `selection: boolean` is gone, replaced by an options object:

```diff
- canvas.downloadAsText(true)
+ canvas.download("text", { scope: "selection" })
```

```typescript
// an explicit list, which takes precedence over `scope`
await canvas.exportAs("json", { symbols: mySymbols })
// name the file yourself; without it the name is timestamped
await canvas.download("markdown", { filename: "meeting-notes" })
```

#### Five formats gained a download

`markdown`, `mermaid`, `plantuml`, `llm` and `jiix` had no download in v4 — you had to serialize and
save the string yourself. They now work like every other format:

```typescript
await canvas.download("mermaid") // saves iink-ts-<timestamp>.mmd
```

#### `pdf` is download-only

`exportAs("pdf")` does not compile: printing produces no in-memory value.

```typescript
await canvas.exportAs("pdf") // ❌ Argument of type '"pdf"' is not assignable…
await canvas.download("pdf") // ✅
```

`download("pdf")` resolves when the settings dialog closes, **cancellation included** — in v4 there
was no cancellation signal at all. Pass any PDF setting (`format`/`orientation`/`mode`/`scale`) to
skip the dialog and print immediately.

#### File names

Default names moved from a locale-formatted date to a truncated ISO instant:

| v4.x (`fr-FR`) | v5.0.0 |
|---|---|
| `iink-ts-26/08/2026 14:30:15.svg` | `iink-ts-2026-08-26T14-30-15.svg` |

If you matched on the old shape anywhere (tests, download interception), update the pattern.

#### Menu configuration

`TExportActionItemsConfig` and `TContextExportItemsConfig` gained `markdown`, `mermaid`, `plantuml`,
`llm` and `jiix`, all enabled by default — the Export menu goes from 5 entries to 10. Set the ones
you don't want to `false`. `markdown` is only built when `text` recognition is enabled, and
`mermaid`/`plantuml` only when `shape` is.

#### Custom `PDFExportManager` callers

`openExportDialog(onConfirm)` now accepts an optional `onCancel` second argument. Existing one-argument
calls keep working unchanged.

### The document is immutable: symbols you read are frozen

**If you only read `canvas.model`, nothing changes for you** — except that reading it is now roughly
ten thousand times cheaper. The document's symbols are frozen when committed and handed to you
directly, instead of the whole document being deep-cloned on every read.

Four names are added (`SymbolStore`, `TDraft`, `TReadonlyDeep`, `TSymbolOrder`) and **none removed**.

**If you mutated a symbol you read from the model, that code now throws.** It never worked the way it
looked: the getter handed you a deep clone, so the mutation was lost unless you passed the object
back to `updateSymbol`. Now it is a frozen record, and the failure is loud instead of silent.

```ts
// Before — silently mutated a copy, and only worked if you also called updateSymbol
const stroke = canvas.model.symbols.find((s) => s.id === id)
stroke.style.color = "red"
canvas.model.updateSymbol(stroke)

// Now — ask for a draft, change it, commit it
const draft = canvas.model.draftSymbol(id)
if (draft) {
  draft.style.color = "red"
  canvas.model.commitSymbol(draft)
}
```

`draftSymbol` returns a mutable copy that is yours until you commit it. **A draft is frozen the moment
it is committed**, so a gesture that commits on every frame must take a fresh draft each frame rather
than reusing one.

**This is enforced at runtime, not by the compiler.** `Object.freeze` is what stops the write; the
types will not warn you. Treat anything you read from `canvas.model` as frozen.

Building a symbol from scratch is unaffected: `StrokeOps.create()` and friends return an object you
own, and it becomes frozen only when you hand it to `addSymbol`.

Two accessors were sealed along the way: `model.selectedIds` is a `ReadonlySet` — change the selection
through `selectSymbol` / `unselectSymbol` — and `model.modificationDate` and `model.exports` are
getters.

**New on `IIModel`:** `draftSymbol` / `commitSymbol`, `symbolCount` (counts without building the
list), `decoratorsByTargetId` (an index, memoized against `version`).

### The client owns the stroke shape it sends

`StrokeOps.formatToSend` has moved into the client as `toWireStroke`. It does exactly the same thing —
transposes a stroke's pointers into the protocol's `x`/`y`/`t`/`p` arrays — but it now lives in the
layer that owns the wire format, so the client no longer needs the symbol layer at all.

```diff
- import { StrokeOps } from "iink-ts"
- const payload = StrokeOps.formatToSend(stroke)
+ import { toWireStroke } from "iink-ts"
+ const payload = toWireStroke(stroke)
```

The client also declares its own input type rather than importing `TStroke`:

| before | after |
|---|---|
| `TStrokeMinimal` | `TStrokeCapture` — same shape, still in the symbol layer, still the base of `TStroke` |
| `WebSocketClient.addStrokes(strokes: TStroke[])` | `addStrokes(strokes: TRecognitionStroke[])` |
| `WebSocketClient.replaceStrokes(ids, newStrokes: TStroke[])` | `replaceStrokes(ids, newStrokes: TRecognitionStroke[])` |
| `WebSocketClient.recognizeGesture(stroke: TStroke)` | `recognizeGesture(stroke: TRecognitionStroke)` |
| `HTTPClientV2.send(strokes: TStrokeMinimal[])` | `send(strokes: TRecognitionStroke[])` |

**No call-site change is needed for any of those.** `TRecognitionStroke` is
`{ id, pointerType, pointers }` and TypeScript is structural, so the `TStroke` you already pass
satisfies it. The rename only matters if you named the type explicitly in your own signatures.

A pointer's `t` and `p` are now optional, which is what lets you build a stroke by hand:

```ts
await client.addStrokes([{ id: "s1", pointerType: "pen", pointers: [{ x: 10, y: 20 }, { x: 30, y: 40 }] }])
```

**Supply `t` if you can.** The recognizer reads the interval between points to segment characters and
to resolve ambiguous shapes; without it, recognition runs on geometry alone and results are
measurably worse on cursive text and on shapes drawn in several passes. `p` only affects rendered
stroke width.

`t` and `p` are emitted all-or-nothing: if any pointer in a stroke lacks one, that whole column is
left out rather than padded, because the server pairs pointers by index across the arrays and a short
column would attach the wrong values to the wrong points.

### Geometry is computed, not stored

`bounds`, `vertices`, `snapPoints` and `edges` are no longer properties of a stroke, a shape or an
edge. Read them through `SymbolGeometry`:

```diff
- const box = stroke.bounds
- const points = shape.vertices
+ import { SymbolGeometry } from "iink-ts"
+ const box = SymbolGeometry.boundsOf(stroke)
+ const points = SymbolGeometry.verticesOf(shape)
```

`of(symbol)` returns all of them in one call, which is what to use when you need more than one —
each accessor is a read off the same cached record, but destructuring once reads better:

```ts
const { bounds, vertices, edges } = SymbolGeometry.of(symbol)
```

**Two frames, and picking the wrong one is the mistake to watch for.** `SymbolGeometry` applies the
symbol's `transform`, so it answers in document coordinates — where the symbol is on screen. The
symbol's own stored coordinates are the raw frame, and `SymbolGeometry.rawOf(symbol)` reports the
geometry there. Use `boundsOf` to hit-test, to place something over the symbol, or to draw a
selection box. Use `rawOf` when you are working with the symbol's own path data, which the element's
`transform` attribute repositions for you — applying the matrix as well would move it twice.

Writing into a symbol's own frame needs the inverse: a pointer position is a document point, and
storing it as if it were raw geometry puts it in the wrong place as soon as the symbol has been
turned or scaled.

```diff
- symbol.points[i] = { x, y }
+ import { applyInverseMatrixToPoint } from "iink-ts"
+ const raw = applyInverseMatrixToPoint({ x, y }, symbol.transform)
+ if (raw) { symbol.points[i] = raw }
```

`applyInverseMatrixToPoint` returns `undefined` for a matrix that cannot be inverted, which is the
one case where there is no answer to give.

Nothing needs refreshing after a write any more:

```diff
- symbolRegistry.getUtilFor(symbol).updateDerivedFields(symbol)
- StrokeOps.updateBounds(stroke)
```

Both are removed, along with every per-kind `updateDerivedFields`. The next read recomputes.

Two stored fields survive, because neither is derived from coordinates the symbol owns.
`TStroke.length` is an accumulator that `StrokeOps.addPointer` maintains and the pressure model
reads once per pointer; deriving it on read would make drawing a stroke quadratic in its own pointer
count. `TText.bounds` and `TMath.bounds` are measured from the DOM with `getBBox()`. And
`TDecorator.bounds` is renamed `targetBounds` — see below.

If you built a symbol type of your own, its util's `computeGeometry` is where its geometry comes
from now; there is no field to keep in step.

### A symbol carries where it sits, as a matrix

`TBaseSymbol.transform` is a `TMatrixTransform`, identity on a freshly created symbol. Transforms
compose into it and the symbol's stored coordinates never move.

If you construct symbols by hand rather than through `*Ops.create` or `createSymbolFromPartial`,
give them one:

```diff
+ import { mergeSymbolTransform } from "iink-ts"
  const symbol = { id, type: "sticky-note", point: { x: 0, y: 0 }, style,
+   transform: mergeSymbolTransform(partial.transform),
  }
```

`mergeSymbolTransform(undefined)` is the identity, so it doubles as the default. `isIdentityMatrix`
is exported alongside it, for the "has this been moved at all" test that a renderer or a serializer
wants before doing work.

`TText.rotation`, `TMath.rotation` and the `TRotation` type are gone — the matrix supersedes them.

The wire format is unchanged: `StrokeSerializer` bakes the matrix into the coordinates it sends, so
a server sees the same strokes it always did.

### History: one form for every change

If you read or build `TIIHistoryChanges` — a custom menu action, an integration that pushes its own
undoable steps — the five per-operation forms are gone:

```diff
- history.push({ translate: [{ symbols, tx: 10, ty: 0 }] })
- history.push({ rotate: [{ symbols, angle, center }] })
- history.push({ scale: [{ symbols, scaleX, scaleY, origin }] })
- history.push({ matrix: { symbols, matrix } })
- history.push({ style: { symbols, oldStyles, newStyles } })
+ import { appendUpdated } from "iink-ts"
+ const changes = {}
+ appendUpdated(changes, symbols.map((after, i) => ({ before: snapshots[i], after })))
+ history.push(changes)
```

Take the snapshots *before* you change anything, and read `after` back from the document rather than
from the object you mutated — a write commits a draft, so the reference you started with is the
pre-change record.

`updated` itself changed shape, from two parallel lists to a list of pairs:

```diff
- changes.updated.newSymbols.forEach((sym) => restore(sym))
+ changes.updated.forEach(({ after }) => restore(after))
```

Use `appendUpdated` rather than assigning `changes.updated`. One undoable step can gather symbols
from more than one source, and assigning twice keeps only the last.

**Why the forms went.** Each described a change by its parameters so that undo could re-derive the
old state by applying an inverse. A transform writes to `symbol.transform` and a restyle to
`symbol.style`, both part of the record — so the record is the state, and restoring it is exact.
Inverting a parameter was not: a scale's `1 / scaleX` is `Infinity` at zero, and it ignores the
origin the scale was taken about.

`TIIHistoryBackendChanges` lost the same four transform forms. Undo and redo reach the server as a
stroke replacement, whose wire form carries the moved coordinates because the serializer bakes the
matrix in. One consequence worth knowing: a restyle now reaches the server, where `style` had no
backend form and silently did not.

### A decorator's box is renamed for where it comes from

`TDecorator` is the one symbol type that still stores a box, because it is the one type whose box is
not derived: a decorator holds no coordinates at all — it is placed over other symbols, and its box
arrives from outside. The field is renamed so it cannot be mistaken for a leftover derived field,
and it is optional now.

```diff
- decorator.bounds
- decorator.hasBounds
+ decorator.targetBounds          // TOBB | undefined; unset is "no box of its own"

- DecoratorOps.setBounds(decorator, obb)
+ DecoratorOps.setTargetBounds(decorator, obb)
```

`hasBounds` is gone: presence of `targetBounds` is the flag, so the two can no longer disagree. The
boolean only ever existed to shadow a zero-size box.

If you place decorators yourself, you own that write. It comes from the recognizer's word box when
JIIX has answered — which is tighter than the union of the strokes it covers, and not computable
from them — and from that union otherwise. It has to be written again whenever the decorated symbols
move or a target is removed; the built-in transform manager and erase paths do this, and
`DecoratorUtil.applyTransform` is deliberately a no-op, so no matrix carries a decorator.

### A custom transform manager implements one method, not five

Only relevant if you subclass `IIAbstractTransformManager`.

```diff
  class MyTransformManager extends IIAbstractTransformManager {
-   protected transformName = "skew"
-   protected applyToStroke(stroke, matrix) { ... }
-   protected applyToShape(shape, matrix) { ... }
-   protected applyToEdge(edge, matrix) { ... }
-   protected applyOnText(text, matrix) { ... }
-   protected applyOnMath(math, matrix) { ... }
+   protected applyThroughUtil(symbol, matrix) {
+     symbolRegistry.getUtilFor(symbol).translate(symbol, { matrix, typeset: this.canvas.typeset })
+   }
  }
```

The five members existed so that a `switch (symbol.type)` in `applyToSymbol` could reach them, and
that switch is why a symbol type the library did not know threw instead of moving. Routing through
the symbol's own util means one method, and a custom symbol that transforms.

### A custom `SymbolUtil` no longer implements `translate`, `rotate` or `resize`

All three were abstract in the first v5 betas, and each one asked you to move your symbol's stored
geometry. They are concrete now, and none of the six built-in utils overrides them:

```ts
translate(symbol, { matrix }) { this.applyTransform(symbol, matrix) }
```

A transform composes into `symbol.transform` and leaves the coordinates alone, so the body is the
same for every type and you inherit it. Delete yours unless your symbol stores something a matrix
cannot express.

```diff
  class StickyNoteUtil extends SymbolUtil<TStickyNote> {
    readonly type = "sticky-note"
    create(partial) { ... }
    overlaps(symbol, box) { ... }
    getSVGElement(symbol) { ... }
-   translate(symbol, { matrix }) {
-     symbol.point = applyMatrixToPoint(symbol.point, matrix)
-   }
-   rotate(symbol, { matrix }) { ... }
-   resize(symbol, { matrix, origin }) { ... }
  }
```

If you do override one, the second argument is a `TTransformContext` — `{ matrix }`, and nothing
else. The three separate contexts are gone, and so are the extras they carried: `center` (the
rotation centre) and `origin` (the fixed point of a scale) are folded into the matrix already, and
the `typeset` measuring port went with them because a typeset symbol's measured box does not change
when it moves.

```diff
- import type { TTranslateContext, TRotateContext, TResizeContext } from "iink-ts"
+ import type { TTransformContext } from "iink-ts"
```

An override that moves coordinates still works, but it gives up what the matrix buys: the renderer
rewriting one attribute instead of rebuilding the element, and an undo that restores the previous
value bit for bit rather than re-transforming coordinates and accumulating rounding.

### Resize handles come from the symbol's util

```diff
- import { EdgeOps } from "iink-ts"
- EdgeOps.getEdgeResizePoints(edge)
+ import { symbolRegistry } from "iink-ts"
+ symbolRegistry.getUtilFor(symbol).getResizePoints(symbol)
```

The replacement is not edge-specific: it answers for any symbol type, and a custom util can now
offer per-vertex handles by overriding `getResizePoints`. It returns an empty list by default, which
is what every built-in but the edges does.

`TResizePoint` names the `{ point, vertexIndex }` shape the three edge `Ops` already returned. It is
structural, so nothing has to change to adopt it.

### A custom `SymbolUtil` must implement `getSVGElement`

It was optional in v4, which meant a util could be registered and accepted while drawing nothing —
the symbol went into the document, took part in selection and transforms, and was simply never
visible. No error said so.

```diff
  class StickyNoteUtil extends SymbolUtil<TStickyNote> {
    readonly type = "sticky-note"
    create(partial) { ... }
    overlaps(symbol, box) { ... }
+   getSVGElement(symbol) { ... }
  }
```

Return `undefined` for a state you deliberately leave undrawn; the built-in decorator util does
that for a kind it does not own.

One limit worth knowing before you build on this: `InkCanvasDeprecated` (INK_V1) does not honour it.
That variant renders through `CanvasRenderer`, which dispatches on `isStroke` and two fixed renderer
tables instead of asking the registry, so your symbol is invisible there and the log says
"symbol type unknown". `InteractiveInkCanvas`, `InkCanvas` and `InteractiveInkSSRCanvas` all draw
it.

### Internal layout: `src/utils/` no longer exists

**If you import from `iink-ts` and nothing else, this section does not apply to you.** The package's
public surface is unchanged: the same 787 names are exported before and after, verified by diffing
the generated `dist/iink.d.ts` against v4's.

What changed is where those names live inside the package, which matters only if you reached past the
package root into a deep path such as `iink-ts/dist/utils/geometry`. `src/utils/` was a drawer with no
rule about what belonged in it, and it imported *upward* into `symbol`, `model` and `client`, which
made it impossible to run the library headless or to publish any part of it on its own. Every helper
moved to the lowest layer its inputs allow:

| Was in `utils/` | Now in | Rule |
|---|---|---|
| `computeDistance`, `findIntersectionBetween2Segment`, `BoxOps`, `TPoint`, `TBox`, `TOBB`, … | `core/geometry` | speaks points, boxes and segments |
| `isBetween`, `roundTo`, `isValidNumber`, `normalizeAngle`, `convertMillimeterToPixel`, … | `core/math` | speaks `number` only |
| `mergeDeep`, `TPartialDeep`, `createUUID`, `isVersionSuperiorOrEqual`, `DeferredPromise` | `core/std` | speaks `unknown`, objects and strings |
| `latexToUnicodeMath` | `core` | `string` in, `string` out |
| `computeHmac`, `getApiInfos`, `getAvailableFontList`, `getAvailableLanguageList`, `assertServerConfig`, `redactServerSecrets` | `client` | speaks server configuration |
| `jiixToMermaid`, `jiixToMarkdown`, `jiixToPlantUML`, `jiixToLLM`, `extractJIIXGraphElements` | `export` | JIIX in, string out |
| `RafCoalescer`, `bumpSvgTransformVersion`, `getSvgTransformVersion` | `browser` | needs the DOM |

The geometry primitives `TPoint`, `TPointer`, `TSegment`, `TBox` and `TOBB` also left `symbol/`,
where they never belonged, for `core/geometry`. `core` may not import from anywhere else in the
library — an eslint rule enforces it — which is what makes a headless and a standalone build
possible later.

## v3.x → v4.0.0

Version 4.0.0 renames every class/type/constant that reused native MyScript SDK terms (`Editor`, `Recognizer`) for unrelated front-end concepts, source of long-standing confusion between the native SDK and iinkTS. This is a **breaking change** with no compatibility shim — the old names simply don't exist anymore. See [CHANGELOG.md](./CHANGELOG.md) for the full breaking-changes list; this guide gives step-by-step find/replace instructions for your integration code.

### 1. Entry point

```diff
- Editor.load(rootElement, "INTERACTIVEINK", options)
+ Canvas.load(rootElement, "INTERACTIVE_INK", options)
```

The type constants also changed format:

| v3.x | v4.0.0 |
|---|---|
| `"INTERACTIVEINK"` | `"INTERACTIVE_INK"` |
| `"INTERACTIVEINKSSR"` | `"INTERACTIVE_INK_SSR"` |
| `"INKV1"` | `"INK_V1"` |
| `"INKV2"` | `"INK_V2"` |

### 2. Class and type names

| v3.x | v4.0.0 |
|---|---|
| `InteractiveInkEditor` | `InteractiveInkCanvas` |
| `InteractiveInkSSREditor` | `InteractiveInkSSRCanvas` |
| `InkEditor` | `InkCanvas` |
| `InkEditorDeprecated` | `InkCanvasDeprecated` |

The matching `*Configuration`/`*Options` types follow the same rename (e.g. `InteractiveInkEditorConfiguration` → `InteractiveInkCanvasConfiguration`).

### 3. Network/client layer

| v3.x | v4.0.0 |
|---|---|
| `RecognizerHTTPV1` | `HTTPClientV1` |
| `RecognizerHTTPV2` | `HTTPClientV2` |
| `RecognizerWebSocket` | `WebSocketClient` |
| `RecognizerWebSocketSSR` | `WebSocketSSRClient` |
| `RecognizerHTTPV1Configuration` | `HTTPClientV1Configuration` |
| `RecognizerHTTPV2Configuration` | `HTTPClientV2Configuration` |
| `RecognizerWebSocketConfiguration` | `WebSocketClientConfiguration` |
| `RecognizerWebSocketSSRConfiguration` | `WebSocketSSRClientConfiguration` |
| `RecognizerWebSocketMessage` | `WebSocketClientMessage` |
| `RecognizerWebSocketSSRMessage` | `WebSocketSSRClientMessage` |
| `RecognizerEvent` | `ClientEvent` |
| `RecognizerError` | `ClientError` |

### 4. Public enums

| v3.x | v4.0.0 |
|---|---|
| `EditorTool` | `CanvasTool` |
| `EditorWriteTool` | `CanvasWriteTool` |
| `LoggerCategory.EDITOR` | `LoggerCategory.CANVAS` |
| `LoggerCategory.EDITOR_EVENT` | `LoggerCategory.CANVAS_EVENT` |

If you configure per-category log levels via `configuration.logger`, update the keys.

### 5. DOM-attached instance

If you retrieve the loaded instance directly off the DOM element instead of keeping the value returned by `Canvas.load()`:

```diff
- document.getElementById("myDiv").editor.export(["application/vnd.myscript.jiix"])
+ document.getElementById("myDiv").iink.export(["application/vnd.myscript.jiix"])
```

### 6. Custom CSS

If you have a stylesheet overriding iinkTS's default look:

| v3.x | v4.0.0 |
|---|---|
| `.ms-editor` (root class) | `.ms-ink` |
| `.editor-state`, `.editor-state-icon`, `.editor-state-count`, `.editor-state-tooltip`, `.editor-state-{state}` (connection badge) | `.ms-ink-state`, `.ms-ink-state-icon`, `.ms-ink-state-count`, `.ms-ink-state-tooltip`, `.ms-ink-state-{state}` |
| `--iink-*` custom properties (44 variables — `--iink-primary`, `--iink-surface`, `--iink-modal-*`, `--iink-spacing-*`, `--iink-radius-*`, etc.) | `--ms-ink-*` (e.g. `--iink-primary` → `--ms-ink-primary`) |
| `--iink-editor-bg` | `--ms-ink-canvas-bg` |

### 7. Examples directory

If you use the `examples/` folder as a reference, the layout was reorganized to match the new naming:

```
examples/rest/                    → examples/canvas/                 (rest_*.html → canvas_v1_*.html, rest_v2_*.html → canvas_v2_*.html)
examples/websocket/               → examples/interactive-canvas-ssr/ (websocket_*.html → interactive_canvas_ssr_*.html)
examples/offscreen-interactivity/ → examples/interactive-canvas/     (offscreen_interactivity_*.html → interactive_canvas_*.html)
                                   → examples/custom-rendering/tldraw-websocket-client/ (was offscreen_interactivity_tldraw/)
```

### What didn't change

- Recognition/configuration API (`recognition.text`, `recognition.math`, etc.)
- Runtime behavior — this is a pure rename, no logic changed

### Need help?

Open an issue on [GitHub](https://github.com/MyScript/iinkTS/issues) or check the [Developer website](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/).
