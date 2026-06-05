import
{
  IIEdgeArc,
  IIEdgeLine,
  IIEdgePolyLine,
  IIShapeCircle,
  IIShapeEllipse,
  IIShapePolygon
} from "@/symbol/geometry"
import { IIStroke } from "./IIStroke"
import { IIText } from "./IIText"
import { IIMath } from "./IIMath"

/**
 * @group Symbol
 */
export type TIIEdge = IIEdgeArc | IIEdgeLine | IIEdgePolyLine

/**
 * @group Symbol
 */
export type TIIShape = IIShapeCircle | IIShapeEllipse | IIShapePolygon

/**
 * @group Symbol
 */
export type TIISymbol = TIIEdge | TIIShape | IIStroke | IIText | IIMath
