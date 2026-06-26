import { TEdgeArc } from "@/symbol/geometry/IIEdgeArc"
import { TEdgeLine } from "@/symbol/geometry/IIEdgeLine"
import { TEdgePolyLine } from "@/symbol/geometry/IIEdgePolyLine"
import { TShapeCircle } from "@/symbol/geometry/IIShapeCircle"
import { TShapeEllipse } from "@/symbol/geometry/IIShapeEllipse"
import { TShapePolygon } from "@/symbol/geometry/IIShapePolygon"
import { TStroke } from "./IIStroke"
import { TText } from "./IIText"
import { TMath } from "./IIMath"
import { TDecorator } from "./IIDecorator"

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
