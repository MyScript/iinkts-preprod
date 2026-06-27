import type { TBaseSymbol } from "./Symbol"
import type { TBox } from "./primitives/Box"
import type { TPoint } from "./primitives/Point"
import type { TPartialDeep } from "@/utils"

/**
 * @group Symbol
 * @summary Plugin interface for registering symbol behaviour.
 *
 * Implement this class to add a new symbol type that participates in the
 * standard dispatch for factory, derived-field updates, overlap detection,
 * snap-point extraction, and capability flags.
 *
 * Register with `symbolRegistry.register(new MyUtil())`.
 *
 * @example
 * class StickyNoteUtil extends SymbolUtil<TStickyNote> {
 *   readonly type = "sticky-note"
 *   create(partial) { ... }
 *   updateDerivedFields(s) { ... }
 *   overlaps(s, box) { ... }
 * }
 * symbolRegistry.register(new StickyNoteUtil())
 */
export abstract class SymbolUtil<T extends TBaseSymbol>
{
  abstract readonly type: string

  abstract create(params: TPartialDeep<T>): T

  abstract updateDerivedFields(symbol: T): void

  abstract overlaps(symbol: T, box: TBox): boolean

  getSnapPoints(_symbol: T): TPoint[]
  {
    return []
  }

  canSelect(_symbol: T): boolean
  {
    return true
  }

  canTransform(_symbol: T): boolean
  {
    return true
  }

  canResize(_symbol: T): boolean
  {
    return true
  }

  canRotate(_symbol: T): boolean
  {
    return true
  }

  getSVGElement?(_symbol: T): SVGGraphicsElement | undefined
}
