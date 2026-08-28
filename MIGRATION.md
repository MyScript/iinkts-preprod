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
