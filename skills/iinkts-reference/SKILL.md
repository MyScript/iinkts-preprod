---
name: iinkts-reference
description: iinkTS directory map, naming conventions, symbol hierarchy, manager sub-systems, and utility reference. Invoke for "where is X", "how is Y structured", or architecture lookup questions.
---

# iinkTS Reference

## Directory structure

```
src/
├── canvas/
│   ├── variants/        # InteractiveInkCanvas, InkCanvas, InkCanvasDeprecated, InteractiveInkSSRCanvas
│   ├── AbstractCanvas.ts, CanvasFactory.ts, CanvasEvent.ts, CanvasLayer.ts
│   └── Canvas.ts        # Public entry point
├── manager/
│   ├── base/            # AbstractWriterManager, ColorPaletteManager, EraseManager
│   ├── simple/          # IWriterManager
│   ├── debug/           # IDebugSVGManager
│   └── interactive/     # Core interactive managers
│       ├── math/        # IIMathComputationSubManager, IIMathFunctionEvaluationSubManager, IIMathVariableSubManager
│       ├── transform/   # AbstractTransformManager, IIResizeManager, IIRotationManager, IITranslateManager
│       ├── gestures/    # GestureHandler, GestureHelpers, IIGestureAnnotationProcessor, handlers/
│       ├── IIConversionManager.ts, IIGestureManager.ts, IIJiixQueryManager.ts
│       ├── IIKeyboardManager.ts, IIMathManager.ts, IIMoveManager.ts
│       ├── IIOverlayManager.ts, IISelectionManager.ts, IISnapManager.ts
│       ├── IISynchronizerManager.ts, IITransformManager.ts (orchestrator)
│       ├── IITypesetManager.ts, IIWriterManager.ts
│       └── IIAbstractManager.ts
├── model/               # Model, IModel, IIModel
├── client/
│   ├── recognition/     # Config files (MathConfiguration, TextConfiguration, etc.)
│   ├── HTTPClientV1.ts (deprecated), HTTPClientV2.ts
│   ├── WebSocketClient.ts, WebSocketSSRClient.ts
│   └── ClientEvent.ts, ClientError.ts
├── renderer/
│   ├── base/            # BaseRenderer
│   ├── canvas/          # CanvasRenderer, CanvasRendererShape/Stroke/Text
│   ├── ssr/             # SVGSSRenderer, SVGStroker
│   └── svg/
│       ├── utils/       # SVGRendererConst; SVGBuilder is a re-export shim → @/symbol-utils/SVGBuilder
│       └── SVGRenderer.ts, PenNib.ts
├── symbol-utils/        # Per-type rendering/behavior, plugin registry (see Symbol hierarchy below)
│   ├── SymbolUtil.ts            # Abstract base: getGeometry (abstract) + getSVGElement per type
│   ├── PathSymbolUtil.ts        # Base for single-<path> symbols (stroke/shape/edge)
│   ├── SymbolGeometry.ts        # Façade caching a Geometry2d per frozen symbol
│   ├── SymbolRegistry.ts        # symbolRegistry — register/lookup SymbolUtil by SymbolType
│   ├── KindDefinition.ts        # TKindDefinition — one entry per kind inside a type
│   ├── TransformContext.ts
│   ├── registerBuiltinSymbolUtils.ts  # Registers the 6 built-in Util classes at startup
│   ├── SymbolFactory.ts         # Symbol creation entry point
│   ├── SVGBuilder.ts            # Real SVGBuilder implementation
│   ├── stroke/StrokeUtil.ts, typeset/{TypesetUtil,TextUtil,MathUtil}.ts
│   ├── shape/ShapeUtil.ts, edge/EdgeUtil.ts, decorator/DecoratorUtil.ts
│   └── edge/EdgeRenderOptions.ts
├── grabber/             # PointerEventGrabber
├── history/             # HistoryManager, IHistoryManager, IIHistoryManager
├── symbol/              # Type + type guard, per type — nothing else
│   ├── stroke/          # TStroke, isStroke/isRecognizedMath/isRecognizedText
│   ├── typeset/         # TText/TSymbolChar/isText, TMath/TMathElement/isMath, TTypesetChild, TRotation
│   ├── decorator/       # TDecorator, DecoratorKind, isDecorator
│   ├── eraser/          # TEraser, EraserOps — a transient tool, not a symbol type, so no util
│   ├── shape/           # TShapeCircle/Ellipse/Polygon, ShapeKind
│   ├── edge/            # TEdgeArc, TEdgeLine, TEdgePolyLine, Anchor (smart connectors)
│   ├── Symbol.ts        # SymbolType enum, TBaseSymbol, TSymbol union
│   ├── SymbolHelpers.ts # cloneSymbol() only — NOT a dispatch class, see symbol-utils/ for that
│   └── legacy/          # Stroke, CanvasSymbol (deprecated v1)
├── menu/
│   ├── IIAbstractMenu.ts # base of the 4 menus: items, zones "bar"/"dropdown", dropdown mechanics
│   ├── IIMenuManager.ts # canvas.menu: builds the menus (override classes), item registry, setConfig
│   ├── actions/         # 12 action handlers (Clear, Convert, Export, Undo, etc.)
│   ├── context/         # 9 context menus
│   ├── items/           # 9 item types (Button, Checkbox, Color, Range, etc.)
│   ├── tools/           # 6 tools (Write, Erase, Select, Move, Shape, Edge)
│   └── styles/
├── components/
│   ├── dom/             # DOMFactory — centralized DOM element creation
│   ├── Chart.ts, Modal.ts, Table.ts, Minimap.ts
│   └── IIMath{CapabilitiesTable,DiagnosticChecker,FunctionEvaluator,VariableEditor,VariableInputList,VariablePerBlockEditor}.ts
├── smartguide/          # InteractiveInkSSRSmartGuide
├── style/               # Style, PenStyle, StyleManager, Theme
├── constants/           # Shared constants
├── assets/              # SVG assets
├── logger/              # LoggerManager, LoggerConfiguration (singleton)
├── worker/              # ping.worker.ts (WebSocket heartbeat)
└── core/                # Cross-cutting primitives — there is no src/utils/
    ├── geometry/        # TPoint, TBox, OBB, MatrixTransform, distance/angle/intersection/containment
    │   └── shapes/      # Geometry2d, PointsGeometry2d, PointSet2d, Polyline2d, Polygon2d, Circle2d, Ellipse2d
    ├── math/            # isValidNumber, angles, tessellation, mm ↔ px conversion
    ├── std/             # mergeDeep, isDeepEqual, uuid, DeferredPromise, version, shared types
    └── latex.ts
```

See [SETUP.md](../../../SETUP.md) for prefix conventions (T/I/II).

## Naming conventions

**Prefixes** (see [SETUP.md](../../../SETUP.md) "Prefix Helper"):
- `T{Name}` → TypeScript type/interface (e.g., `TSymbol`, `TPoint`, `TExport`)
- `I{Name}` → Ink variant, uses `HTTPClientV2` (e.g., `IModel`, `IWriterManager`)
- `II{Name}` → InteractiveInk variant, uses `WebSocketClient` (e.g., `IIModel`, `IIStroke`)

**Classes**:
- `{Name}Manager` → Business logic orchestrator
- `{Name}Renderer` → Rendering implementation
- `{Name}Configuration` → Configuration with defaults
- `Abstract{Name}` → Base class for inheritance

**Files**: PascalCase matching primary export → `InteractiveInkCanvas.ts` exports `InteractiveInkCanvas`

## Configuration pattern

Every major component uses **partial configuration merging**:

```typescript
// Type definition
export type TClientConfig = { ... }

// Class with defaults
export class ClientConfiguration implements TClientConfig {
  static readonly DEFAULT = { /* sensible defaults */ }
}

// Usage: merge user config with defaults
import { mergeDeep } from "@/core/std"
this.config = mergeDeep({}, DefaultConfig, userConfig)
```

**Never** assume all config properties exist → always merge with defaults.

## Async patterns

1. **DeferredPromise**: Custom promise wrapper for tracking pending operations ([src/core/std/DeferredPromise.ts](../../../src/core/std/DeferredPromise.ts)). `WebSocketClient` uses maps of deferred promises for concurrent requests.
2. **Dual async model**: Operations return Promises + emit Events
   ```typescript
   await client.addStrokes(strokes)  // Operation promise
   client.event.addContentChangedListener(cb) // Notification event
   ```
3. **Initialization**: Stateful clients (`WebSocketClient`, `WebSocketSSRClient`) expose `initialized: DeferredPromise<void>` — always `await canvas.client.initialized.promise` before interacting. `HTTPClientV2`/`HTTPClientV1` are stateless, no init step.

## Symbol hierarchy

**Base type**: `TSymbol` — shared properties (id, type, creationTime, style)

**Symbol types** (`SymbolType` enum): `Stroke` (raw ink), `Group`, `Shape` (Circle/Ellipse/Polygon), `Edge` (Line/Arc/PolyLine), `Text`/`Math`/`Typeset` (recognized/typeset content)

```
Primitives: TPoint { x, y }, TBox { x, y, height, width }, OBB (oriented box)
Stroke:     TStroke
Text:       TText
Math:       TMath
Typeset:    TTypesetChild, TRotation
Decorator:  TDecorator
Eraser:     TEraser
Shape:      TShapeCircle, TShapeEllipse, TShapePolygon
Edge:       TEdgeArc, TEdgeLine, TEdgePolyLine, Anchor (smart connectors)
Legacy:     Stroke, CanvasSymbol (deprecated v1)
```

**Root types** (`src/symbol/Symbol.ts`):
```typescript
type TBaseSymbol = { id: string; creationTime: number; modificationDate: number; type: string; style: TPartialDeep<TStyle> }
type TSymbol = TEdge | TShape | TStroke | TText | TMath | TDecorator
```

**One place per type — the util:**
`src/symbol/{type}/{Type}.ts` holds the type and its guards (`isStroke`, `isText`, `isMath`, `isDecorator`). Everything else — construction, editing, geometry, rendering — is on `StrokeUtil`, `TextUtil`, `MathUtil`, `ShapeUtil`, `EdgeUtil`, `DecoratorUtil` in `src/symbol-utils/{type}/`, all extending `SymbolUtil` and registered by `registerBuiltinSymbolUtils()`. Instance methods are what the registry dispatches; statics are construction and editing, which have no symbol to dispatch on.

**There is no `*Ops` object for a symbol.** `BoxOps` and `OBBOps` are geometry primitives, not symbols; `EraserOps` belongs to a transient tool with no util.

`SVGRenderer` dispatches rendering with `symbolRegistry.getUtil(symbol.type).getSVGElement(symbol)` — don't branch on `SymbolType` inline, extend the matching util instead.

**Model distinctions**:
- `Model` (basic): `Stroke[]` — InkCanvasDeprecated (v1)
- `IModel` (intermediate): `TStroke[]` — InkCanvas (v2)
- `IIModel` (advanced): `TSymbol[]` with Map caching — InteractiveInkCanvas

## Manager sub-system patterns

**Transform** (`manager/interactive/transform/`): `AbstractTransformManager<TParams>` Template Method base, extended by `IITranslateManager`, `IIRotationManager`, `IIResizeManager`, orchestrated by `IITransformManager`.

**Math** (`manager/interactive/math/`): `IIMathVariableSubManager` (variable state), `IIMathComputationSubManager` (computation), `IIMathFunctionEvaluationSubManager` (function evaluation), orchestrated by `IIMathManager`.

**Gestures** (`manager/interactive/gestures/`): `GestureHandler` + `handlers/` per-gesture, `IIGestureAnnotationProcessor` for annotation logic, orchestrated by `IIGestureManager`.

**Typeset** (`IITypesetManager`): handles both text and math typeset bounds via SVG `getBBox`, replaced former `IITextManager`.

**Menus** (`menu/`): `IIMenuAction`, `IIMenuStyle`, `IIMenuTool`, `IIMenuContext` extend `IIAbstractMenu<TConfig>`. Each has two zones, `"bar"` and `"dropdown"`, built on their first item (`createZone`), and a `defaultZone`. In `render()`, a menu sets `wrapper` first, then calls the protected `addItem(key, item, { zone, before, after, replace })`. An integrator adds items with `canvas.menu.addItem(menu, key, factory, options)`: the `IIMenuManager` registry keeps **factories** (menus are rebuilt by every `setConfig`, and a destroyed item can't be reused) and replays them after each render. A whole menu is replaced through `options.override.menu` (`TMenuOverride`, classes constructed `(canvas, id, config)`). Menu members are protected, never `#private`: they are overridable.

## Key utilities

Always check `src/core/` before writing a new utility function — there is no `src/utils/`.

```typescript
// Geometry
import { computeDistance, computeDistanceSquared, computeAngleAxeRadian,
         isPointInsideBox, areValidCoordinates } from "@/core/geometry"
if (computeDistanceSquared(p1, p2) < threshold * threshold) { ... } // no sqrt, ~2x faster for comparisons

// A symbol's geometry is an object, not a record — reach it through the façade, never rebuild it
import { SymbolGeometry } from "@/symbol-utils"
SymbolGeometry.of(symbol).overlapsBox(box)   // or boundsOf / verticesOf / edgesOf / lengthOf

// Scalars
import { isValidNumber, TWO_PI } from "@/core/math"

// SVG building — SVGBuilder's real implementation lives in @/symbol-utils; @/renderer/svg/utils re-exports it
import { SVGBuilder } from "@/symbol-utils"
import { SVGRendererConst } from "@/renderer/svg/utils"
SVGBuilder.createPath({ ...SVGRendererConst.guidePathAttrs, d: pathData })

// Other
import { mergeDeep, isDeepEqual, uuid, DeferredPromise } from "@/core/std"
import { convertMillimeterToPixel } from "@/core/math"
import { resolveHmac } from "@/client/HmacAuth"
```

## Examples

- **`interactive-canvas/`** (19 files) → `InteractiveInkCanvas` (WebSocket), pattern: `interactive_canvas_{feature}.html`
- **`interactive-canvas-ssr/`** (28 files) → `InteractiveInkSSRCanvas` (WebSocket SSR)
- **`canvas/`** (16 files) → `InkCanvas`/`InkCanvasDeprecated` (HTTP), pattern: `canvas_v2_{feature}.html` (current) / `canvas_v1_{feature}.html` (deprecated)
- **`non-specific/`** → Configuration demos
- **`custom-rendering/`** → Third-party integrations (`tldraw-websocket-client/`, `excalidraw-websocket-client/`)

Most examples: `<div id="rootEl">` → `Canvas.load(element, type, options)` → event listeners. Shared assets in `examples/assets/` and `examples/components/`. Matching E2E specs live in `test/examples/{same-subdir}/*.test.js`.

## Build system

**Rollup-based**: `config/rollup.config.{build,dev,mjs}`. Outputs: `dist/iink.min.js` (UMD), `dist/iink.esm.js` (ESM), `dist/iink.d.ts`. CSS imported as strings in TS, injected dynamically at runtime.

## Testing

- **Unit (Jest)**: `test/unit/` mirrors `src/` exactly, ≥75% coverage (branches/functions/lines/statements), `yarn test:unit`, mocks in `test/unit/__config__/`
- **E2E (Playwright)**: `test/examples/`, `yarn test:examples`

## Development

```bash
yarn dev          # Rollup watch + example server on :8000
make dev-lib      # Docker: MongoDB, backend services, fonts, resources
```

## Common patterns

```typescript
// Logger
import { LoggerManager, LoggerCategory } from "@/logger"
#logger = LoggerManager.getLogger(LoggerCategory.CANVAS)
this.#logger.info("Message", data)

// Event handling — events defined in src/canvas/CanvasEvent.ts
canvas.event.addChangedListener((context: THistoryContext) => { ... })
```

## Documentation

- **SETUP**: [SETUP.md](../../../SETUP.md) — development setup, prefix guide
- **API Docs**: `yarn build:docs` → `docs/`
- **External**: https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/

## MyScript Cloud integration

**Authentication**: HMAC-based (applicationKey + hmacKey) set in `configuration.server`. See `examples/websocket/` for credential setup.
