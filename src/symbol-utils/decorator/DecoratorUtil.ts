import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import { isIdentityMatrix, MatrixTransform, mergeSymbolTransform, OBBOps, type TOBB } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import { DefaultStyle } from "@/style"
import { DecoratorKind, DecoratorOps, type TDecorator } from "@/symbol/decorator/Decorator"
import type { TBaseSymbol } from "@/symbol/Symbol"
import { SymbolType } from "@/symbol/Symbol"

import { SVGBuilder } from "../SVGBuilder"
import { SymbolGeometry } from "../SymbolGeometry"
import { SymbolUtil } from "../SymbolUtil"
import type { TSymbolGeometry } from "../TSymbolGeometry"

/**
 * How one kind of decorator is drawn.
 *
 * Not the shared `TKindDefinition` used by the shape and edge tables: a decorator does not produce
 * a path string but a whole element, and it needs the decorated symbol's stroke width and the text
 * metrics to place itself. Same idea, different contract.
 */
type TDecoratorKindDefinition = {
  /** Attributes this kind layers over the shared ones. */
  attributes(decorator: TDecorator): Record<string, string>
  /** The element this kind draws. */
  render(context: TDecoratorRenderContext, attrs: { [key: string]: string }): SVGGeometryElement
}

/** What every kind needs to place itself, resolved once before the table is consulted. */
type TDecoratorRenderContext = {
  box: TBox
  /** From the decorated symbol, not the decorator: it is what the decoration has to clear. */
  strokeWidth: number
  baseline?: number
  xHeight?: number
}

/** The attributes shared by every decoration drawn as an outline — all of them but the highlight. */
function outlineAttributes(decorator: TDecorator): Record<string, string> {
  return {
    fill: "transparent",
    stroke: decorator.style.color || DefaultStyle.color!,
    "stroke-width": (decorator.style.width || DefaultStyle.width).toString(),
  }
}

/** The decorated bounds grown by one symbol stroke width on every side. */
function inflatedBox({ box, strokeWidth }: TDecoratorRenderContext): TBox {
  return {
    x: box.x - +strokeWidth,
    y: box.y - +strokeWidth,
    width: box.width + +strokeWidth * 2,
    height: box.height + +strokeWidth * 2,
  }
}

/**
 * A line spanning the decorated bounds.
 *
 * `fallbackY` places it from the bounding box; when the text metrics are there the line follows the
 * baseline instead, which is what keeps an underline under the glyphs rather than under the box
 * their ascenders inflate. Both metrics are required — one alone says nothing.
 */
function horizontalLine(
  context: TDecoratorRenderContext,
  fallbackY: number,
  fromBaseline: (baseline: number, xHeight: number) => number,
  attrs: { [key: string]: string }
): SVGGeometryElement {
  const { box, baseline, xHeight } = context
  const y = baseline !== undefined && xHeight !== undefined ? fromBaseline(baseline, xHeight) : fallbackY
  return SVGBuilder.createLine({ x: box.x, y }, { x: box.x + box.width, y }, attrs)
}

/**
 * The decorator kinds this util can draw, and how. Adding a kind is adding an entry.
 *
 * The `switch` this replaced repeated the outline attributes in three of its four branches and
 * built the same inflated rect in two of them.
 */
const DECORATOR_KINDS: Partial<Record<DecoratorKind, TDecoratorKindDefinition>> = {
  [DecoratorKind.Highlight]: {
    // The one kind that fills rather than outlines, and the one that overrides the decorator's own
    // opacity: a highlight is a wash, and 0.5 is what keeps the decorated symbol readable through
    // it.
    attributes: (decorator) => ({
      opacity: "0.5",
      stroke: "transparent",
      fill: decorator.style.color || DefaultStyle.color!,
    }),
    render: (context, attrs) => SVGBuilder.createRect(inflatedBox(context), attrs),
  },
  [DecoratorKind.Surround]: {
    attributes: outlineAttributes,
    render: (context, attrs) => SVGBuilder.createRect(inflatedBox(context), attrs),
  },
  [DecoratorKind.Strikethrough]: {
    attributes: outlineAttributes,
    render: (context, attrs) =>
      horizontalLine(context, context.box.y + context.box.height / 2, (baseline, xHeight) => baseline - xHeight, attrs),
  },
  [DecoratorKind.Underline]: {
    attributes: outlineAttributes,
    render: (context, attrs) =>
      horizontalLine(
        context,
        context.box.y + context.box.height + +context.strokeWidth,
        (baseline, xHeight) => baseline + xHeight,
        attrs
      ),
  },
}

/**
 * @group SymbolUtils
 */
export class DecoratorUtil extends SymbolUtil<TDecorator> {
  readonly type = SymbolType.Decorator

  create(partial: TPartialDeep<TDecorator>): TDecorator {
    if (!partial.kind) {
      throw new Error("TDecorator requires kind")
    }
    const targetIds = (partial.targetIds ?? []).filter((id): id is string => id !== undefined)
    const targetBounds = partial.targetBounds
    const decorator = DecoratorOps.create(partial.kind, partial.style ?? {}, targetIds)
    // Read as the `TOBB` the field declares, field by field, rather than through `create`'s `TBox`
    // parameter. The code this replaces did `partial.bounds as TBox` and handed that to
    // `OBBOps.fromBox`, which reads `.x`/`.y` — so a decorator serialised by iinkTS itself (a
    // `TOBB`, with `center` and no `x`) came back with a NaN centre on re-import. The cast was what
    // hid the mismatch from the compiler.
    if (targetBounds) {
      DecoratorOps.setTargetBounds(
        decorator,
        OBBOps.create(
          { x: targetBounds.center?.x ?? 0, y: targetBounds.center?.y ?? 0 },
          targetBounds.width ?? 0,
          targetBounds.height ?? 0,
          targetBounds.angle ?? 0
        )
      )
    }
    decorator.transform = mergeSymbolTransform(partial.transform)
    return decorator
  }

  overlaps(decorator: TDecorator, box: TBox): boolean {
    return this.overlapsQuery(decorator, box, (b) => DecoratorOps.overlaps(decorator, b))
  }

  /**
   * Deliberately nothing. A standalone decorator's bounds are recomputed from the symbols it
   * decorates, which the transform manager does after moving them — moving the decorator itself
   * would double the displacement. `IIAbstractTransformManager.applyToSymbol` still returns early
   * for decorators, so nothing calls this yet; it becomes the live path when IIC-2014 removes that
   * early return, and stating the exception here is what keeps it from being lost.
   *
   * Overriding `applyTransform` rather than `translate`/`rotate`/`resize` individually: those three
   * are concrete on `SymbolUtil` now and all three route through this one method, so a single
   * no-op here covers all three at once instead of three separate ones.
   */
  applyTransform(): void {}

  /**
   * A decorator's geometry is read, not derived: `targetBounds` is an input written by whoever
   * placed it (see `TDecorator.targetBounds`). This util is the one that reports a stored box
   * because it is the one type whose box does not come from coordinates it owns.
   *
   * No `targetBounds` means no box of its own — a decorator embedded in a `TText`/`TMath`, or
   * standalone but not yet placed. It reports empty rather than two phantom points at the origin,
   * which is what a zero-size box would produce.
   */
  computeGeometry(decorator: TDecorator): TSymbolGeometry {
    const bounds = decorator.targetBounds
    if (!bounds) {
      return { bounds: OBBOps.create({ x: 0, y: 0 }, 0, 0), vertices: [], snapPoints: [], edges: [], length: 0 }
    }
    const vertices = DecoratorOps.computeVertices(bounds)
    return {
      bounds,
      vertices,
      snapPoints: vertices,
      edges: [{ p1: vertices[0], p2: vertices[1] }],
      length: 0,
    }
  }

  getSnapPoints(decorator: TDecorator): TPoint[] {
    return this.mapPointsForward(decorator, this.computeGeometry(decorator).snapPoints)
  }

  canResize(_decorator: TDecorator): boolean {
    return false
  }

  canRotate(_decorator: TDecorator): boolean {
    return false
  }

  getSVGElement(decorator: TDecorator): SVGGeometryElement | undefined {
    return DecoratorUtil.renderFromBounds(
      decorator,
      SymbolGeometry.rawOf(decorator).bounds,
      decorator.baseline,
      decorator.xHeight,
      {
        width: decorator.style.width,
        color: decorator.style.color,
      }
    )
  }

  static renderForSymbol(decorator: TDecorator, symbol: TBaseSymbol): SVGGeometryElement | undefined {
    // `SymbolGeometry.rawOf`, not `boundsOf`: this element is drawn either as the decorator's own
    // top-level group (which carries its own `transform` below) or as a child of the host's group
    // (which carries the host's), so the geometry itself must stay untransformed — the enclosing
    // `transform` attribute is what repositions it, exactly once at each level. `rawOf` also keeps
    // this on the cache `boundsOf` uses, rather than calling a util's `computeGeometry` uncached on
    // every redraw.
    const bounds = decorator.targetBounds ? SymbolGeometry.rawOf(decorator).bounds : SymbolGeometry.rawOf(symbol).bounds
    return DecoratorUtil.renderFromBounds(decorator, bounds, undefined, undefined, {
      width: symbol.style.width,
      color: symbol.style.color,
    })
  }

  static renderFromBounds(
    decorator: TDecorator,
    bounds: TOBB,
    baseline?: number,
    xHeight?: number,
    symbolStyle?: {
      width?: number
      color?: string
    }
  ): SVGGeometryElement | undefined {
    const definition = DECORATOR_KINDS[decorator.kind]
    if (!definition) {
      // Skipped rather than thrown on, unlike the shape and edge utils: this runs over every
      // decorated symbol on every redraw, and one unknown kind must not abort the frame.
      return undefined
    }

    const attrs: { [key: string]: string } = {
      id: decorator.id,
      type: "decorator",
      kind: decorator.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }
    if (decorator.style.opacity) {
      attrs["opacity"] = decorator.style.opacity.toString()
    }
    if (!isIdentityMatrix(decorator.transform)) {
      attrs.transform = MatrixTransform.toCssString(decorator.transform)
    }
    // Layered after, so a kind may override a shared attribute. The highlight does exactly that.
    Object.assign(attrs, definition.attributes(decorator))

    const context: TDecoratorRenderContext = {
      box: OBBOps.toBox(bounds),
      strokeWidth: symbolStyle?.width || DefaultStyle.width,
      baseline,
      xHeight,
    }
    return definition.render(context, attrs)
  }
}
