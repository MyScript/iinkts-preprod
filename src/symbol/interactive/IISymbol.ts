import type { TEdgeArc } from "@/symbol/geometry/IIEdgeArc"
import type { TEdgeLine } from "@/symbol/geometry/IIEdgeLine"
import type { TEdgePolyLine } from "@/symbol/geometry/IIEdgePolyLine"
import type { TShapeCircle } from "@/symbol/geometry/IIShapeCircle"
import type { TShapeEllipse } from "@/symbol/geometry/IIShapeEllipse"
import type { TShapePolygon } from "@/symbol/geometry/IIShapePolygon"
import type { TStroke } from "./IIStroke"
import type { TText } from "./IIText"
import type { TMath } from "./IIMath"
import type { TDecorator } from "./IIDecorator"

/**
 * @group Symbol
 */
export type TEdge = TEdgeArc | TEdgeLine | TEdgePolyLine

/**
 * @group Symbol
 */
export type TShape = TShapeCircle | TShapeEllipse | TShapePolygon

/**
 * @group Symbol
 */
export type TSymbol = TEdge | TShape | TStroke | TText | TMath | TDecorator
