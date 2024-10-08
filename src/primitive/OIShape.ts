import { TStyle } from "../style"
import { findIntersectionBetween2Segment, PartialDeep } from "../utils"
import { Box, TBoundingBox } from "./Box"
import { OISymbolBase } from "./OISymbolBase"
import { TPoint } from "./Point"
import { SymbolType } from "./Symbol"

/**
 * @group Primitive
 */
export enum ShapeKind
{
  Circle = "circle",
  Ellipse = "ellipse",
  Polygon = "polygon",
  Table = "table"
}

/**
 * @group Primitive
 */
export abstract class OIShapeBase<K = ShapeKind> extends OISymbolBase<SymbolType.Shape>
{
  readonly kind: K
  readonly isClosed = true

  constructor(kind: K, style?: PartialDeep<TStyle>)
  {
    super(SymbolType.Shape, style)
    this.kind = kind
  }

  get bounds(): Box
  {
    return Box.createFromPoints(this.vertices)
  }

  get snapPoints(): TPoint[]
  {
    return this.bounds.snapPoints
  }

  overlaps(box: TBoundingBox): boolean
  {
    return this.bounds.isContained(box) ||
      this.edges.some(e1 => Box.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  }
}
