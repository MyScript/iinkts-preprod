import { InteractiveInkEditor } from "@/editor"
import { IIAbstractManager } from "./IIAbstractManager"
import
{
  TJIIXChar,
  TJIIXEdgeArc,
  TJIIXEdgeElement,
  JIIXEdgeKind,
  TJIIXEdgeLine,
  TJIIXEdgePolyEdge,
  TJIIXExport,
  TJIIXNodeCircle,
  TJIIXNodeElement,
  TJIIXNodeEllipse,
  JIIXNodeKind,
  TJIIXNodeParallelogram,
  TJIIXNodePolygon,
  TJIIXNodeRectangle,
  TJIIXNodeRhombus,
  TJIIXNodeTriangle,
  TJIIXTextElement,
  TJIIXWord,
  TJIIXMathElement,
  JIIXElementType
} from "@/model"
import
{
  Box,
  DecoratorKind,
  IIDecorator,
  IIEdgeArc,
  IIEdgeLine,
  IIEdgePolyLine,
  IIShapeCircle,
  IIShapeEllipse,
  IIShapePolygon,
  IIStroke,
  IIText,
  IIMath,
  TIIEdge,
  TIIShape,
  TIISymbol,
  TIISymbolChar,
  TPoint,
  TIIMathElement,
  isRecognizedMath,
  isRecognizedText,
} from "@/symbol"
import { computeAngleAxeRadian, computeAverage, convertBoundingBoxMillimeterToPixel, convertMillimeterToPixel, convertPixelToMillimeter, createUUID } from "@/utils"
import { LoggerCategory } from "@/logger"

/**
 * @group Manager
 */
export class IIConversionManager extends IIAbstractManager
{
  protected managerName = "IIConversionManager"

  constructor(editor: InteractiveInkEditor)
  {
    super(editor, LoggerCategory.CONVERTER)
    this.logger.info("constructor")
  }

  get fontStyleConfiguration(): { size: number | "auto", weight: "bold" | "normal" | "auto" } {
    return this.editor.configuration.fontStyle
  }

  get rowHeight(): number
  {
    return this.editor.configuration.rendering.guides.gap
  }

  protected computeFontSize(chars: TJIIXChar[]): number
  {
    if (chars.some(c => c["bounding-box"])) {
      const height = convertMillimeterToPixel(computeAverage(chars.map(c => c["bounding-box"]?.height || 1)))
      return Math.round(Math.round(height * this.rowHeight) / this.rowHeight / 2) * 2
    }
    return Math.round(this.rowHeight / 2)
  }

  buildChar(char: TJIIXChar, strokes: IIStroke[], fontSize: number): TIISymbolChar
  {
    const points = char.grid.map(p => ({
      x: convertMillimeterToPixel(p.x),
      y: convertMillimeterToPixel(p.y),
    }))
    let fontWeight = this.fontStyleConfiguration.weight
    if (fontWeight === "auto") {
      fontWeight = (strokes[0].style.width || 1) > 2 ? "bold" : "normal"
    }

    const color = strokes[0].style.color || "black"
    return {
      id: `text-char-${ createUUID() }`,
      label: char.label,
      color,
      fontSize,
      fontWeight,
      bounds: Box.createFromPoints(points)
    }
  }

  buildText(word: TJIIXWord, chars: TJIIXChar[], strokes: IIStroke[], size: number | "auto"): IIText
  {
    const boundingBox = Box.createFromBoxes([convertBoundingBoxMillimeterToPixel(word["bounding-box"])])
    const charSymbols: TIISymbolChar[] = []
    const charFontSize = size === "auto" ? this.computeFontSize(chars) : size

    chars.forEach(char =>
    {
      const charStrokes = strokes.filter(s => char.items?.some(i => i["full-id"] === s.id)) as IIStroke[]
      if (charStrokes.length) {
        charSymbols.push(this.buildChar(char, charStrokes, charFontSize))
      }
    })
    const point: TPoint = {
      x: boundingBox.xMin,
      y: boundingBox.yMax
    }
    const text = new IIText(charSymbols, point, boundingBox, strokes[0].style)
    const decorators = strokes.flatMap(s => s.decorators)
    strokes.forEach(s =>
    {
      const sym = this.model.getRootSymbol(s.id)
      if (sym && isRecognizedText(sym)) {
        // Check for word-level decorators in text metadata
        const textMetadata = this.editor.jiix.getTextMetadata(sym.id)
        if (textMetadata?.word) {
          const w = textMetadata.word
          if (w.decorators && w.bounds) {
            // Check if this word overlaps with the current text bounds
            if (w.bounds.overlaps(boundingBox)) {
              w.decorators.forEach((d: IIDecorator) => {
                const exists = decorators.find(dec => dec.kind === d.kind)
                if (!exists) {
                  decorators.push(d)
                }
              })
            }
          }
        }

        // Check for stroke-level decorators
        const hightlight = sym.decorators.find(d => d.kind === DecoratorKind.Highlight)
        if (hightlight) decorators.push(hightlight)
        const strikethrough = sym.decorators.find(d => d.kind === DecoratorKind.Strikethrough)
        if (strikethrough) decorators.push(strikethrough)
        const surround = sym.decorators.find(d => d.kind === DecoratorKind.Surround)
        if (surround) decorators.push(surround)
        const underline = sym.decorators.find(d => d.kind === DecoratorKind.Underline)
        if (underline) decorators.push(underline)
      }
    })
    if (decorators.length) {
      const hightlight = decorators.find(d => d.kind === DecoratorKind.Highlight)
      if (hightlight) {
        text.decorators.push(new IIDecorator(DecoratorKind.Highlight, hightlight.style))
      }
      const strikethrough = decorators.find(d => d.kind === DecoratorKind.Strikethrough)
      if (strikethrough) {
        text.decorators.push(new IIDecorator(DecoratorKind.Strikethrough, strikethrough.style))
      }
      const surround = decorators.find(d => d.kind === DecoratorKind.Surround)
      if (surround) {
        text.decorators.push(new IIDecorator(DecoratorKind.Surround, surround.style))
      }
      const underline = decorators.find(d => d.kind === DecoratorKind.Underline)
      if (underline) {
        text.decorators.push(new IIDecorator(DecoratorKind.Underline, underline.style))
      }
    }

    return text
  }

  convertText(text: TJIIXTextElement, strokes: IIStroke[], onlyText: boolean): { symbol: IIText, strokes: IIStroke[] }[] | undefined
  {
    if (!text.lines) {
      throw new Error("You need to active configuration.recognition.export.jiix.text.lines = true")
    }
    if (!text.words) {
      throw new Error("You need to active configuration.recognition.export.jiix.text.words = true")
    }
    if (!text.chars) {
      throw new Error("You need to active configuration.recognition.export.jiix.text.chars = true")
    }
    if (!text.chars.some(c => c.items)) {
      throw new Error("You need to active configuration.recognition.export.jiix.strokes = true")
    }

    const jiixWords = text.words as TJIIXWord[]
    const jiixChars = text.chars as TJIIXChar[]

    const result: { symbol: IIText, strokes: IIStroke[] }[] = []


    let textFontSize = this.fontStyleConfiguration.size
    if (onlyText && textFontSize === "auto") {
      textFontSize = Math.round(this.computeFontSize(jiixChars.filter(c => c.items?.length)) / 2) * 2
    }
    else if (this.fontStyleConfiguration.size !== "auto") {
      textFontSize = this.fontStyleConfiguration.size * this.rowHeight
    }

    let isNewLine = false
    let currentY = convertMillimeterToPixel(text.lines[0]["baseline-y"])
    const leftX = convertMillimeterToPixel(text["bounding-box"]?.x || 0)
    let currentX = convertMillimeterToPixel(jiixWords[0]["bounding-box"]?.x || 0)
    jiixWords.forEach(word =>
    {
      if (word.label === " ") {
        currentX += this.editor.texter.getSpaceWidth(result.at(-1)?.symbol.chars[0].fontSize|| (this.rowHeight / 2))
        return
      }
      const wordStrokes = strokes.filter(s => word.items?.some(i => i["full-id"] === s.id)) as IIStroke[]
      if (wordStrokes.length) {
        const chars = jiixChars.slice(word["first-char"] as number, (word["last-char"] || 0) + 1)
        const wordSymbol = this.buildText(word, chars, wordStrokes, textFontSize)

        if (onlyText) {
          if (isNewLine) {
            isNewLine = false
            const nbRow = Math.round((wordSymbol.point.y - currentY) / this.rowHeight) || 1
            currentY += nbRow * this.rowHeight
            if (Math.abs(wordSymbol.point.x - leftX) < this.rowHeight) {
              currentX = leftX
            }
            else {
              currentX = wordSymbol.point.x
            }
          }
          wordSymbol.point.x = currentX
          wordSymbol.point.y = this.model.roundToLineGuide(currentY)
        }

        this.editor.texter.setBounds(wordSymbol)
        currentX += wordSymbol.bounds.width
        result.push({
          symbol: wordSymbol,
          strokes: wordStrokes
        })
      }
      isNewLine = word.label === "\n"
    })

    return result
  }

  buildCircle(circle: TJIIXNodeCircle, strokes: IIStroke[]): IIShapeCircle
  {
    const center: TPoint = {
      x: convertMillimeterToPixel(circle.cx),
      y: convertMillimeterToPixel(circle.cy)
    }
    return new IIShapeCircle(center, convertMillimeterToPixel(circle.r), strokes[0]?.style)
  }

  buildEllipse(ellipse: TJIIXNodeEllipse, strokes: IIStroke[]): IIShapeEllipse
  {
    const center: TPoint = {
      x: convertMillimeterToPixel(ellipse.cx),
      y: convertMillimeterToPixel(ellipse.cy),
    }
    return new IIShapeEllipse(center, convertMillimeterToPixel(ellipse.rx), convertMillimeterToPixel(ellipse.ry), ellipse.orientation, strokes[0]?.style)
  }

  buildRectangle(rectangle: TJIIXNodeRectangle, strokes: IIStroke[]): IIShapePolygon
  {
    const height = convertMillimeterToPixel(rectangle.height)
    const width = convertMillimeterToPixel(rectangle.width)
    const x = convertMillimeterToPixel(rectangle.x)
    const y = convertMillimeterToPixel(rectangle.y)
    const points: TPoint[] = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ]
    return new IIShapePolygon(points, strokes[0]?.style)
  }

  #buildPolygonFromPoints(polygon: { points: number[] }, strokes: IIStroke[]): IIShapePolygon
  {
    const points: TPoint[] = []
    for (let i = 0; i < polygon.points.length; i += 2) {
      points.push({
        x: convertMillimeterToPixel(polygon.points[i]),
        y: convertMillimeterToPixel(polygon.points[i + 1])
      })
    }
    return new IIShapePolygon(points, strokes[0]?.style)
  }

  buildPolygon(polygon: TJIIXNodePolygon, strokes: IIStroke[]): IIShapePolygon
  {
    return this.#buildPolygonFromPoints(polygon, strokes)
  }

  buildRhombus(polygon: TJIIXNodeRhombus, strokes: IIStroke[]): IIShapePolygon
  {
    return this.#buildPolygonFromPoints(polygon, strokes)
  }

  buildTriangle(polygon: TJIIXNodeTriangle, strokes: IIStroke[]): IIShapePolygon
  {
    return this.#buildPolygonFromPoints(polygon, strokes)
  }

  buildParallelogram(polygon: TJIIXNodeParallelogram, strokes: IIStroke[]): IIShapePolygon
  {
    return this.#buildPolygonFromPoints(polygon, strokes)
  }

  convertNode(node: TJIIXNodeElement, strokes: IIStroke[]): { symbol: TIIShape, strokes: IIStroke[] } | undefined
  {
    const associatedStroke = strokes.filter(s => node.items?.some(i => i["full-id"] === s.id))
    if (!associatedStroke.length) return

    const uniqStrokes = associatedStroke.filter((a, i) => associatedStroke.findIndex((s) => a.id === s.id) === i)

    let shape: TIIShape
    switch (node.kind) {
      case JIIXNodeKind.Circle:
        shape = this.buildCircle(node, uniqStrokes)
        break
      case JIIXNodeKind.Ellipse:
        shape = this.buildEllipse(node, uniqStrokes)
        break
      case JIIXNodeKind.Rectangle:
        shape = this.buildRectangle(node, uniqStrokes)
        break
      case JIIXNodeKind.Triangle:
        shape = this.buildTriangle(node, uniqStrokes)
        break
      case JIIXNodeKind.Parallelogram:
        shape = this.buildParallelogram(node, uniqStrokes)
        break
      case JIIXNodeKind.Polygon:
        shape = this.buildPolygon(node, uniqStrokes)
        break
      case JIIXNodeKind.Rhombus:
        shape = this.buildRhombus(node, uniqStrokes)
        break
      default:
        this.logger.warn("convertNode", `Conversion of Node with kind equal to ${ JSON.stringify(node) } is unknown`)
        return
    }
    return { symbol: shape, strokes: uniqStrokes }
  }

  buildLine(line: TJIIXEdgeLine, strokes: IIStroke[]): IIEdgeLine
  {
    const point1: TPoint = { x: convertMillimeterToPixel(line.x1), y: convertMillimeterToPixel(line.y1) }
    const point2: TPoint = { x: convertMillimeterToPixel(line.x2), y: convertMillimeterToPixel(line.y2) }
    const angle = computeAngleAxeRadian(point1, point2)

    if (Math.abs(angle % Math.PI) < 0.1) {
      // to adjust the line with the horizontal
      point1.y = +((point1.y + point2.y) / 2).toFixed(3)
      point2.y = point1.y
    }
    else if (Math.abs(angle % (Math.PI / 2)) < 0.1) {
      // to adjust the line with the vertical
      point1.x = +((point1.x + point2.x) / 2).toFixed(3)
      point2.x = point1.x
    }
    return new IIEdgeLine(point1, point2, line.p1Decoration, line.p2Decoration, strokes[0]?.style)
  }

  buildPolyEdge(polyline: TJIIXEdgePolyEdge, strokes: IIStroke[]): IIEdgePolyLine
  {
    const start: TPoint = { x: convertMillimeterToPixel(polyline.edges[0].x1), y: convertMillimeterToPixel(polyline.edges[0].y1) }
    const points = polyline.edges.map(e => ({ x: convertMillimeterToPixel(e.x2), y: convertMillimeterToPixel(e.y2) }))
    points.unshift(start)
    for (let index = 0; index < points.length - 1; index++) {
      const p1 = points[index]
      const p2 = points[index + 1]
      const angle = computeAngleAxeRadian(p1, p2)
      if (Math.abs(angle % Math.PI) < 0.1) {
        p1.y = +((p1.y + p2.y) / 2).toFixed(3)
        p2.y = p1.y
      }
      else if (Math.abs(angle % (Math.PI / 2)) < 0.1) {
        p1.x = +((p1.x + p2.x) / 2).toFixed(3)
        p2.x = p1.x
      }
    }

    return new IIEdgePolyLine(points, polyline.edges[0].p1Decoration, polyline.edges.at(-1)!.p2Decoration, strokes[0]?.style)
  }

  buildArc(arc: TJIIXEdgeArc, strokes: IIStroke[]): IIEdgeArc
  {
    const center: TPoint = { x: convertMillimeterToPixel(arc.cx), y: convertMillimeterToPixel(arc.cy) }
    const radiusX = convertMillimeterToPixel(arc.rx)
    const radiusY = convertMillimeterToPixel(arc.ry)
    return new IIEdgeArc(center, arc.startAngle, arc.sweepAngle, radiusX, radiusY, arc.phi, arc.startDecoration, arc.endDecoration, strokes[0]?.style)
  }

  convertEdge(edge: TJIIXEdgeElement, strokes: IIStroke[]): { symbol: TIIEdge, strokes: IIStroke[] } | undefined
  {
    switch (edge.kind) {
      case JIIXEdgeKind.Line: {
        const associatedStroke = strokes.filter(s => edge.items?.some(i => i["full-id"] === s.id))
        if (!associatedStroke.length) return
        const uniqStrokes = associatedStroke.filter((a, i) => associatedStroke.findIndex((s) => a.id === s.id) === i)
        const oiEdge = this.buildLine(edge, uniqStrokes)
        return {
          symbol: oiEdge,
          strokes: uniqStrokes
        }
      }
      case JIIXEdgeKind.Arc: {
        const associatedStroke = strokes.filter(s => edge.items?.some(i => i["full-id"] === s.id))
        if (!associatedStroke.length) return
        const uniqStrokes = associatedStroke.filter((a, i) => associatedStroke.findIndex((s) => a.id === s.id) === i)
        const oiEdge = this.buildArc(edge, uniqStrokes)
        return {
          symbol: oiEdge,
          strokes: uniqStrokes
        }
      }
      case JIIXEdgeKind.PolyEdge: {
        const associatedStroke = strokes.filter(s => edge.edges.flatMap(e => e.items)?.some(i => i!["full-id"] === s.id))
        if (!associatedStroke.length) return
        const uniqStrokes = associatedStroke.filter((a, i) => associatedStroke.findIndex((s) => a.id === s.id) === i)
        const oiEdge = this.buildPolyEdge(edge, uniqStrokes)
        return {
          symbol: oiEdge,
          strokes: uniqStrokes
        }
      }
      default:
        this.logger.error("convertEdge", `Conversion of Edge with kind equal to ${ JSON.stringify(edge) } is unknown`)
        return
    }
  }

  protected convertLatexToUnicode(latex: string): string
  {
    // Convert common LaTeX commands to Unicode symbols
    const result = latex
      // Greek letters
      .replace(/\\alpha/g, "α")
      .replace(/\\beta/g, "β")
      .replace(/\\gamma/g, "γ")
      .replace(/\\delta/g, "δ")
      .replace(/\\epsilon/g, "ε")
      .replace(/\\lambda/g, "λ")
      .replace(/\\Lambda/g, "Λ")
      .replace(/\\pi/g, "π")
      .replace(/\\sigma/g, "σ")
      .replace(/\\Sigma/g, "Σ")
      .replace(/\\omega/g, "ω")
      .replace(/\\Omega/g, "Ω")
      // Math operators
      .replace(/\\int/g, "∫")
      .replace(/\\sum/g, "∑")
      .replace(/\\prod/g, "∏")
      .replace(/\\sqrt/g, "√")
      .replace(/\\infty/g, "∞")
      .replace(/\\partial/g, "∂")
      .replace(/\\nabla/g, "∇")
      // Superscripts (convert ^{n} to Unicode superscript)
      .replace(/\^{([0-9]+)}/g, (_, num) => {
        const superscripts: { [key: string]: string } = {
          "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
          "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹"
        }
        return num.split("").map((d: string) => superscripts[d] || d).join("")
      })
      .replace(/\^([0-9])/g, (_, num) => {
        const superscripts: { [key: string]: string } = {
          "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
          "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹"
        }
        return superscripts[num] || num
      })
      // Subscripts (convert _{n} to Unicode subscript)
      .replace(/_{([0-9]+)}/g, (_, num) => {
        const subscripts: { [key: string]: string } = {
          "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
          "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉"
        }
        return num.split("").map((d: string) => subscripts[d] || d).join("")
      })
      .replace(/_([0-9])/g, (_, num) => {
        const subscripts: { [key: string]: string } = {
          "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
          "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉"
        }
        return subscripts[num] || num
      })
      // Fractions - simplified rendering as a/b
      .replace(/\\dfrac{([^}]+)}{([^}]+)}/g, "($1)/($2)")
      .replace(/\\frac{([^}]+)}{([^}]+)}/g, "($1)/($2)")
      // Remove remaining braces
      .replace(/[{}]/g, "")
      // Clean up backslashes for simple commands
      .replace(/\\/g, "")

    return result
  }

  buildMath(mathElement: TJIIXMathElement, strokes: IIStroke[], fontSize: number): IIMath
  {
    const boundingBox = Box.createFromBoxes([convertBoundingBoxMillimeterToPixel(mathElement["bounding-box"])])

    // Get font family with comprehensive fallbacks for math symbols
    const fontFamily = "'STIX Two Math', STIXGeneral, STIX, 'Cambria Math', 'Latin Modern Math', 'DejaVu Math', serif"

    let fontWeight = this.fontStyleConfiguration.weight
    if (fontWeight === "auto") {
      fontWeight = (strokes[0]?.style.width || 1) > 2 ? "bold" : "normal"
    }
    const color = strokes[0]?.style.color || "black"

    const label = mathElement.label || ""
    const mathElements: TIIMathElement[] = []

    // Check for operators with bounds (like \sum ^{...}_{...} or \sum _{...}^{...})
    // Support both orders: ^{...}_{...} and _{...}^{...}
    const operatorWithBothBounds1 = /\\(sum|int|prod)\s*\^{([^}]+)}_{([^}]+)}/
    const operatorWithBothBounds2 = /\\(sum|int|prod)\s*_{([^}]+)}\^{([^}]+)}/

    let match = label.match(operatorWithBothBounds1)
    let upperBound = ""
    let lowerBound = ""

    if (!match) {
      match = label.match(operatorWithBothBounds2)
      if (match) {
        // Order is reversed: _{lower}^{upper}
        upperBound = match[3]
        lowerBound = match[2]
      }
    } else {
      // Normal order: ^{upper}_{lower}
      upperBound = match[2]
      lowerBound = match[3]
    }

    if (match) {
      // Extract operator and rest of expression
      const operator = match[1] // "sum", "int", or "prod"
      const restOfExpression = label.substring(match.index! + match[0].length)

      // Convert operator to Unicode
      const operatorSymbols: { [key: string]: string } = {
        "sum": "∑",
        "int": "∫",
        "prod": "∏"
      }
      const operatorSymbol = operatorSymbols[operator] || operator

      // Create elements in order: operator, superscript (upper bound), subscript (lower bound), rest
      const limitFontSize = fontSize * 0.5 // Smaller font for limits (50% of main size)

      // 1. Main operator symbol
      mathElements.push({
        id: `math-element-${createUUID()}`,
        label: operatorSymbol,
        color,
        fontSize,
        fontWeight,
        fontFamily,
        bounds: boundingBox,
        position: "normal"
      })

      // 2. Upper bound (superscript)
      mathElements.push({
        id: `math-element-${createUUID()}`,
        label: this.convertLatexToUnicode(upperBound),
        color,
        fontSize: limitFontSize,
        fontWeight,
        fontFamily,
        bounds: boundingBox,
        position: "superscript"
      })

      // 3. Lower bound (subscript)
      mathElements.push({
        id: `math-element-${createUUID()}`,
        label: this.convertLatexToUnicode(lowerBound),
        color,
        fontSize: limitFontSize,
        fontWeight,
        fontFamily,
        bounds: boundingBox,
        position: "subscript"
      })

      // 4. Rest of expression
      if (restOfExpression) {
        mathElements.push({
          id: `math-element-${createUUID()}`,
          label: this.convertLatexToUnicode(restOfExpression),
          color,
          fontSize,
          fontWeight,
          fontFamily,
          bounds: boundingBox,
          position: "normal"
        })
      }
    } else {
      // No special bounds - convert the whole label as before
      const unicodeLabel = this.convertLatexToUnicode(label)

      mathElements.push({
        id: `math-element-${createUUID()}`,
        label: unicodeLabel,
        color,
        fontSize,
        fontWeight,
        fontFamily,
        bounds: boundingBox,
        position: "normal"
      })
    }

    const point: TPoint = {
      x: boundingBox.xMin,
      y: boundingBox.yMax
    }

    // Calculate adjusted bounding box for operators with superscript/subscript limits
    let adjustedBounds = boundingBox
    if (match) {
      // When we have superscript/subscript, the renderer positions them vertically
      // superscript: y = baselineY - fontSize * 1.5 (this is baseline position)
      // subscript: y = baselineY + fontSize * 1.2 (this is baseline position)
      const baselineY = boundingBox.yMax
      const limitFontSize = fontSize * 0.5

      // Calculate vertical extent
      // Superscript: text extends above its baseline by ~fontSize
      const superscriptTop = baselineY - limitFontSize * 1.5 - limitFontSize
      // Subscript: text extends below its baseline by ~0.25 * fontSize (descenders)
      const subscriptBottom = baselineY + limitFontSize * 1.2 + limitFontSize * 0.25

      // Calculate horizontal extent
      // The renderer positions normal elements horizontally with width = label.length * fontSize * 0.6
      // Sum up all normal elements (operator + rest)
      const normalElements = mathElements.filter(e => e.position === "normal")
      const totalWidth = normalElements.reduce((sum, e) => sum + e.label.length * e.fontSize * 0.6, 0)

      // Also check if superscript/subscript extend beyond the operator
      const limitElements = mathElements.filter(e => e.position === "superscript" || e.position === "subscript")
      const maxLimitWidth = limitElements.reduce((max, e) => {
        // Limits are centered: x = currentX - label.length * fontSize * 0.3
        // So they extend from (currentX - label.length * fontSize * 0.3) to (currentX - label.length * fontSize * 0.3 + label.length * fontSize * 0.6)
        const limitWidth = e.label.length * e.fontSize * 0.6
        return Math.max(max, limitWidth)
      }, 0)

      // Final width is the max of total normal width and limit width
      const finalWidth = Math.max(totalWidth, maxLimitWidth)

      // Extend bounding box to include superscript and subscript
      adjustedBounds = new Box({
        x: boundingBox.x,
        y: superscriptTop,
        width: finalWidth,
        height: subscriptBottom - superscriptTop
      })
    }

    const math = new IIMath(mathElements, point, adjustedBounds, strokes[0]?.style)

    return math
  }

  convertMath(mathElement: TJIIXMathElement, strokes: IIStroke[]): { symbol: IIMath, strokes: IIStroke[] } | undefined
  {
    if (!mathElement["bounding-box"]) {
      this.logger.warn("convertMath", "Math element missing bounding-box")
      return undefined
    }

    const mathStrokes = strokes.filter(s => mathElement.items?.some(i => i["full-id"] === s.id)) as IIStroke[]
    if (!mathStrokes.length) {
      return undefined
    }

    // Calculate font size based on bounding box height
    const height = convertMillimeterToPixel(mathElement["bounding-box"].height)
    const fontSize = Math.round(height * 0.4) // Divided by 2 from original 0.8

    const mathSymbol = this.buildMath(mathElement, mathStrokes, fontSize)

    return {
      symbol: mathSymbol,
      strokes: mathStrokes
    }
  }

  async apply(symbols: TIISymbol[] = []): Promise<void>
  {
    this.logger.info("convert")
    if (!this.model.exports?.["application/vnd.myscript.jiix"]) {
      await this.editor.export(["application/vnd.myscript.jiix"])
    }
    this.editor.selector.removeSelectedGroup()
    const jiix = this.model.exports?.["application/vnd.myscript.jiix"] as TJIIXExport

    const strokesToConvert = this.editor.extractStrokesFromSymbols(symbols.length ? symbols : this.model.symbols)

    // Track all changes for history (batch at the end for performance)
    const allAddedSymbols: TIISymbol[] = []
    const allErasedStrokes: IIStroke[] = []

    // Convert symbols directly - group by jiixBlockId first
    const symbolsToProcess = symbols.length ? symbols : this.model.symbols
    const mathStrokesByBlock = new Map<string, IIStroke[]>()

    for (const sym of symbolsToProcess) {
      if (isRecognizedMath(sym)) {
        const blockId = sym.jiixBlockId || sym.id
        const existingStrokes = mathStrokesByBlock.get(blockId) || []
        existingStrokes.push(sym)
        mathStrokesByBlock.set(blockId, existingStrokes)
      }
    }

    // Convert each math block (with all its strokes) - process sequentially with visual updates
    for (const [blockId, blockStrokes] of mathStrokesByBlock.entries()) {
      // Get metadata from first stroke (all strokes in block share same metadata)
      const firstStroke = blockStrokes[0]
      const jiixMathElement = this.editor.jiix.getElementForStroke(firstStroke.id) as TJIIXMathElement | undefined
      const label = this.editor.jiix.getLabelForStroke(firstStroke.id)

      if (jiixMathElement?.expressions && label) {
        // Calculate bounding box that contains all strokes
        const allBounds = blockStrokes.map(s => s.bounds).filter(b => b !== undefined)
        if (allBounds.length > 0) {
          const combinedBounds = Box.createFromBoxes(allBounds)
          const boundsMM = {
            x: convertPixelToMillimeter(combinedBounds.x),
            y: convertPixelToMillimeter(combinedBounds.y),
            width: convertPixelToMillimeter(combinedBounds.width),
            height: convertPixelToMillimeter(combinedBounds.height)
          }

          const mathElement: TJIIXMathElement = {
            type: JIIXElementType.Math,
            id: blockId,
            label: label,
            expressions: jiixMathElement.expressions,
            "bounding-box": boundsMM,
            items: blockStrokes.map(s => ({
              type: "stroke" as const,
              id: s.id,
              "full-id": s.id
            }))
          }

          const conversion = this.convertMath(mathElement, blockStrokes)
          if (conversion) {
            // Progressive rendering: remove strokes then add typeset symbol
            await this.editor.removeSymbols(conversion.strokes.map(s => s.id), false)
            await this.editor.addSymbols([conversion.symbol], false)

            allAddedSymbols.push(conversion.symbol)
            allErasedStrokes.push(...conversion.strokes)

            // Allow browser to render between blocks
            await new Promise(resolve => requestAnimationFrame(resolve))
          }
        }
      }
    }

    // Also convert from JIIX export if available - process sequentially
    if (jiix?.elements?.length) {
      const onlyText = !jiix.elements?.some(e => e.type !== "Text")

      for (const el of jiix.elements) {
        let conversionResults: { symbol: TIISymbol, strokes: IIStroke[] }[] = []

        switch (el.type) {
          case JIIXElementType.Text: {
            const conversion = this.convertText(el, strokesToConvert, onlyText)
            if (conversion) {
              conversionResults = conversion
            }
            break
          }
          case JIIXElementType.Math: {
            const conversion = this.convertMath(el, strokesToConvert)
            if (conversion) {
              conversionResults = [conversion]
            }
            break
          }
          case JIIXElementType.Node: {
            const conversion = this.convertNode(el, strokesToConvert)
            if (conversion) {
              conversionResults = [conversion]
            }
            break
          }
          case JIIXElementType.Edge: {
            const conversion = this.convertEdge(el, strokesToConvert)
            if (conversion) {
              conversionResults = [conversion]
            }
            break
          }
          default: {
            this.logger.warn("apply", `Unknown jiix element type: ${ (el as { type: string })?.type }`)
          }
        }

        // Progressive rendering: process this block's conversions
        if (conversionResults.length) {
          // First remove all strokes for this block
          const strokeIds = conversionResults.flatMap(cs => cs.strokes.map(s => s.id))
          await this.editor.removeSymbols(strokeIds, false)

          // Then add all typeset symbols for this block
          const newSymbols = conversionResults.map(cs => cs.symbol)
          await this.editor.addSymbols(newSymbols, false)

          allAddedSymbols.push(...newSymbols)
          allErasedStrokes.push(...conversionResults.flatMap(cs => cs.strokes))

          // Allow browser to render between blocks
          await new Promise(resolve => requestAnimationFrame(resolve))
        }
      }
    }

    // Add single history entry for the entire conversion
    if (allAddedSymbols.length) {
      this.editor.history.push(this.model, {
        added: allAddedSymbols,
        erased: allErasedStrokes
      })
    }
  }
}
