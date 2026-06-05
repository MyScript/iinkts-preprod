import { LoggerManager, LoggerCategory } from "@/logger"
import { PartialDeep } from "@/utils"
import
{
  TIISymbol,
  IIStroke,
  IIText,
  IIMath,
  IIShapeCircle,
  IIShapeEllipse,
  IIShapePolygon,
  IIEdgeArc,
  IIEdgeLine,
  IIEdgePolyLine,
  TIIShape,
  TIIEdge,
  SymbolType,
  ShapeKind,
  EdgeKind
} from "@/symbol"

/**
 * Factory responsible for creating symbols from partial data
 * Centralizes symbol construction logic
 * @group Factory
 */
export class SymbolFactory
{
  #logger = LoggerManager.getLogger(LoggerCategory.EDITOR)

  /**
   * Build a shape symbol from partial data
   * @param partialShape - Partial shape data
   * @returns Complete shape instance
   * @throws Error if shape kind is unknown
   */
  buildShape(partialShape: PartialDeep<TIIShape>): TIIShape
  {
    switch (partialShape.kind) {
      case ShapeKind.Circle:
        return IIShapeCircle.create(partialShape as PartialDeep<IIShapeCircle>)
      case ShapeKind.Ellipse:
        return IIShapeEllipse.create(partialShape as PartialDeep<IIShapeEllipse>)
      case ShapeKind.Polygon:
        return IIShapePolygon.create(partialShape as PartialDeep<IIShapePolygon>)
      default:
        throw new Error(`Unable to create shape, kind: "${ partialShape.kind }" is unknown`)
    }
  }

  /**
   * Build an edge symbol from partial data
   * @param partialEdge - Partial edge data
   * @returns Complete edge instance
   * @throws Error if edge kind is unknown
   */
  buildEdge(partialEdge: PartialDeep<TIIEdge>): TIIEdge
  {
    switch (partialEdge.kind) {
      case EdgeKind.Arc:
        return IIEdgeArc.create(partialEdge as PartialDeep<IIEdgeArc>)
      case EdgeKind.Line:
        return IIEdgeLine.create(partialEdge as PartialDeep<IIEdgeLine>)
      case EdgeKind.PolyEdge:
        return IIEdgePolyLine.create(partialEdge as PartialDeep<IIEdgePolyLine>)
      default:
        throw new Error(`Unable to create edge, kind: "${ partialEdge.kind }" is unknown`)
    }
  }

  /**
   * Build a stroke symbol from partial data
   * @param partialSymbol - Partial stroke data
   * @returns Complete stroke instance
   */
  buildStroke(partialSymbol: PartialDeep<IIStroke>): IIStroke
  {
    return IIStroke.create(partialSymbol as PartialDeep<IIStroke>)
  }

  /**
   * Build a text symbol from partial data
   * @param partialSymbol - Partial text data
   * @returns Complete text instance
   */
  buildText(partialSymbol: PartialDeep<IIText>): IIText
  {
    return IIText.create(partialSymbol as PartialDeep<IIText>)
  }

  /**
   * Build a math symbol from partial data
   * @param partialSymbol - Partial math data
   * @returns Complete math instance
   */
  buildMath(partialSymbol: PartialDeep<IIMath>): IIMath
  {
    return IIMath.create(partialSymbol as PartialDeep<IIMath>)
  }

  /**
   * Build a single symbol from partial data
   * @param partialSymbol - Partial symbol data
   * @returns Complete symbol instance
   * @throws Error if symbol type is unknown or data is invalid
   */
  buildSymbol(partialSymbol: PartialDeep<TIISymbol>): TIISymbol
  {
    try {
      switch (partialSymbol.type) {
        case SymbolType.Stroke:
          return this.buildStroke(partialSymbol)
        case SymbolType.Shape:
          return this.buildShape(partialSymbol)
        case SymbolType.Edge:
          return this.buildEdge(partialSymbol)
        case SymbolType.Text:
          return this.buildText(partialSymbol)
        case SymbolType.Math:
          return this.buildMath(partialSymbol)
        // SymbolType.Recognized no longer exists in TIISymbol union
        default:
          throw new Error(`Unable to build symbol, type: "${ partialSymbol.type }" is unknown`)
      }
    }
    catch (error) {
      this.#logger.error("buildSymbol", error)
      throw error
    }
  }

  /**
   * Build multiple symbols from partial data
   * @param partialSymbols - Array of partial symbol data
   * @returns Array of complete symbols
   * @throws Error if any symbol fails to build (accumulates all errors)
   */
  buildSymbols(partialSymbols: PartialDeep<TIISymbol>[]): TIISymbol[]
  {
    const errors: string[] = []
    const symbols: TIISymbol[] = []

    partialSymbols.forEach((partialSymbol, index) =>
    {
      try {
        symbols.push(this.buildSymbol(partialSymbol))
      } catch (error) {
        errors.push(`Symbol ${index}: ${((error as Error).message || error)}`)
      }
    })

    if (errors.length) {
      throw new Error(`Failed to build ${errors.length} symbol(s):\n${errors.join("\n")}`)
    }

    return symbols
  }
}
