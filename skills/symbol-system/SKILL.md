---
name: symbol-system
description: >
  Deep guide to the iinkTS symbol system: TSymbol union, type guards, the util that
  holds everything a type knows, Geometry2d, SymbolFactory, symbolRegistry. Use when
  writing type-safe symbol code, adding symbol behavior, or debugging type confusion
  between variants.
---

# Symbol System

## Hierarchy

```
TSymbol (union, src/symbol/Symbol.ts)
├── TStroke     — raw ink stroke
├── TText       — recognized text
├── TMath       — math formula
├── TDecorator  — edge/arrow decorator
├── TEdge (union) — TEdgeLine, TEdgeArc, TEdgePolyLine, TAnchor (smart connectors)
└── TShape (union) — TShapeCircle, TShapeEllipse, TShapePolygon
```

**Not in `TSymbol`**: `TEraser` (separate), legacy `Stroke`/`CanvasSymbol` (deprecated v1, `src/symbol/legacy/`), `TPoint`/`TBox`/`OBB` (primitives).

## One place per type: the util

`src/symbol/{type}/{Type}.ts` holds the **type and its guards, and nothing else**.

`src/symbol-utils/{type}/{Type}Util.ts` holds **everything a type knows** — `StrokeUtil`, `TextUtil`,
`MathUtil`, `ShapeUtil`, `EdgeUtil`, `DecoratorUtil`, all extending `SymbolUtil`. Instance methods are
the contract the registry dispatches (`getGeometry`, `getSVGElement`, `canSelect`…); statics are
construction and editing, which have no symbol to dispatch on — `StrokeUtil.createEmpty`,
`ShapeUtil.createCircleBetweenPoints`, `EdgeUtil.moveLineVertex`. All 6 register via
`registerBuiltinSymbolUtils()`.

There is **no `*Ops` object for a symbol any more**. The two that remain are not symbols: `BoxOps` and
`OBBOps` are geometry primitives, and `EraserOps` belongs to a transient tool with no util.

A type describes its shape with `getGeometry(symbol): Geometry2d` and inherits overlap, containment
and distance from it — see `src/core/geometry/shapes/`.

`SVGRenderer` dispatches rendering with `symbolRegistry.getUtil(symbol.type).getSVGElement(symbol)` — no `switch` on `SymbolType` in the renderer.

## Type Guards

Co-located with each type, not centralized:

```typescript
import { isStroke, isRecognizedMath, isRecognizedText } from "@/symbol/stroke/Stroke"
import { isText } from "@/symbol/text/Text"
import { isMath } from "@/symbol/math/Math"
import { isDecorator } from "@/symbol/decorator/Decorator"

// Narrow before accessing type-specific properties
if (isStroke(symbol)) {
  symbol.pointers  // now typed as TStroke
}
```

If a type guard you need doesn't exist, add it next to the type definition — never inline `symbol.type === "..."` checks.

**Note**: `src/symbol/SymbolHelpers.ts` is NOT a dispatcher — it only exports `cloneSymbol()` (via `structuredClone`). The real per-type dispatch is `symbolRegistry` in `src/symbol-utils/`.

## IIModel Interactions

`IIModel` stores symbols in a `Map<string, TSymbol>` (keyed by `symbol.id`):

```typescript
model.addSymbol(symbol)      // adds to map + updates bounding box cache
model.getSymbol(id)          // returns TSymbol | undefined
model.symbols                // returns TSymbol[] (from map values)
model.removeSymbol(id)
model.updateSymbol(symbol)   // replace by id
```

**Cache invalidation**: `IIModel` caches bounding boxes. After bulk mutations, call `model.resetBoundingBox()`.

## SymbolFactory

Use `SymbolFactory` (`src/symbol-utils/SymbolFactory.ts`) to create symbols — never construct a type literal directly:

```typescript
import { SymbolFactory } from "@/symbol-utils"
```

Creating symbols by hand bypasses ID generation and default style merging.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `symbol.type === "stroke"` inline check | Use `isStroke(symbol)` from `@/symbol/stroke/Stroke` |
| Assuming `SymbolHelpers` dispatches by type | It only has `cloneSymbol()` — use `symbolRegistry` |
| Branching on `SymbolType` in a manager/renderer | Add/extend the type's util instead |
| Mutating `model.symbols` array directly | Use `model.addSymbol()` / `model.removeSymbol()` |
| Looking for per-type logic in `src/symbol/` only | Rendering + capability flags live in `src/symbol-utils/` |

## Adding a New Symbol Type

See the `add-symbol-type` skill for the full step-by-step (enum → type + guard → util → registry → renderer → tests).
