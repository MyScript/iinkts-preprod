import { SELECTION_MARGIN, EditorWriteTool } from "@/Constants"
import type { IIModel } from "@/model"
import type {
  TEdgeLine,
  TShapePolygon,
  TShapeCircle,
  TShapeEllipse,
  TStroke,
  TEdge,
  TSymbol,
  TPoint,
  TPointer} from "@/symbol";
import
{
  EdgeDecoration,
  EdgeKind,
  SymbolType,
  isStroke,
  cloneSymbol
} from "@/symbol"
import type { RecognizerWebSocket } from "@/recognizer"
import type { SVGRenderer } from "@/renderer"
import type { TStyle } from "@/style"
import type { IIHistoryManager } from "@/history"
import type { TPointerInfo } from "@/grabber"
import { ShapeCircleHelper } from "@/symbol/shape/Circle"
import { ShapeEllipseHelper } from "@/symbol/shape/Ellipse"
import { ShapePolygonHelper } from "@/symbol/shape/Polygon"
import { EdgeLineHelper } from "@/symbol/edge/Line"
import { updateEdgeDerivedFields } from "@/symbol"
import { StrokeHelper } from "@/symbol/stroke/Stroke"
import { BoxHelper } from "@/symbol/primitives/Box"
import type { IIGestureManager } from "./IIGestureManager"
import type { TGesture } from "./gestures"
import type { IISnapManager } from "./IISnapManager"
import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import { AbstractWriterManager } from "@/manager/base/AbstractWriterManager"

/**
 * @group Manager
 */
export class IIWriterManager extends AbstractWriterManager
{
  #tool: EditorWriteTool = EditorWriteTool.Pencil
  detectGesture: boolean = true
  editor: TInteractiveInkEditor
  currentSymbolOrigin?: TPoint

  constructor(editor: TInteractiveInkEditor)
  {
    super(editor)
    this.editor = editor
  }

  get tool(): EditorWriteTool
  {
    return this.#tool
  }
  set tool(wt: EditorWriteTool)
  {
    this.#tool = wt
    if (wt !== EditorWriteTool.Pencil) {
      this.editor.layers.root.classList.add("shape")
    }
    else {
      this.editor.layers.root.classList.remove("shape")
    }
    this.editor.unselectAll()
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  get renderer(): SVGRenderer
  {
    return this.editor.renderer
  }

  get history(): IIHistoryManager
  {
    return this.editor.history
  }

  get gestureManager(): IIGestureManager
  {
    return this.editor.gesture
  }

  get snaps(): IISnapManager
  {
    return this.editor.snaps
  }

  get recognizer(): RecognizerWebSocket
  {
    return this.editor.recognizer
  }

  attach(layer: HTMLElement): void
  {
    this.grabber.attach(layer)
    this.grabber.onPointerDown = this.start.bind(this)
    this.grabber.onPointerMove = this.continue.bind(this)
    this.grabber.onPointerUp = this.end.bind(this)
  }

  detach(): void
  {
    this.grabber.detach()
  }

  protected needContextLessGesture(stroke: TStroke): boolean
  {
    const strokeBoundsWithMargin = this.editor.getSymbolsBounds([stroke], 2 * SELECTION_MARGIN)
    return this.detectGesture && this.model.symbols.some(s => !isStroke(s) && BoxHelper.overlaps(s.bounds, strokeBoundsWithMargin))
  }

  protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TSymbol
  {
    switch (this.tool) {
      case EditorWriteTool.Pencil:
        this.model.currentSymbol = StrokeHelper.create(style, pointerType)
        break
      case EditorWriteTool.Rectangle:
        this.model.currentSymbol = ShapePolygonHelper.createRectangleBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Triangle:
        this.model.currentSymbol = ShapePolygonHelper.createTriangleBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Parallelogram:
        this.model.currentSymbol = ShapePolygonHelper.createParallelogramBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Rhombus:
        this.model.currentSymbol = ShapePolygonHelper.createRhombusBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Circle:
        this.model.currentSymbol = ShapeCircleHelper.createBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Ellipse:
        this.model.currentSymbol = ShapeEllipseHelper.createBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Line:
      case EditorWriteTool.Arrow:
      case EditorWriteTool.DoubleArrow: {
        let startDecoration, endDecoration
        if (this.tool === EditorWriteTool.Arrow) {
          endDecoration = EdgeDecoration.Arrow
        }
        else if (this.tool === EditorWriteTool.DoubleArrow) {
          startDecoration = EdgeDecoration.Arrow
          endDecoration = EdgeDecoration.Arrow
        }
        this.model.currentSymbol = EdgeLineHelper.create(pointer, pointer, startDecoration, endDecoration, style)
        break
      }
      default:
        throw new Error(`Can't create symbol, tool is unknown: "${ this.tool }"`)
    }
    return this.updateCurrentSymbol(pointer)
  }

  protected updateCurrentSymbolShape(pointer: TPointer): void
  {
    switch (this.tool) {
      case EditorWriteTool.Rectangle:
        ShapePolygonHelper.updateRectangleBetweenPoints(this.model.currentSymbol as TShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Triangle:
        ShapePolygonHelper.updateTriangleBetweenPoints(this.model.currentSymbol as TShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Parallelogram:
        ShapePolygonHelper.updateParallelogramBetweenPoints(this.model.currentSymbol as TShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Rhombus:
        ShapePolygonHelper.updateRhombusBetweenPoints(this.model.currentSymbol as TShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Circle:
        ShapeCircleHelper.updateBetweenPoints(this.model.currentSymbol as TShapeCircle, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Ellipse:
        ShapeEllipseHelper.updateBetweenPoints(this.model.currentSymbol as TShapeEllipse, this.currentSymbolOrigin!, pointer)
        break
    }
  }

  protected updateCurrentSymbolEdge(pointer: TPointer): void
  {
    const edge = this.model.currentSymbol as TEdge
    switch (edge.kind) {
      case EdgeKind.Line:
        (edge as TEdgeLine).end = pointer
        updateEdgeDerivedFields(edge)
        break
    }
  }

  protected updateCurrentSymbol(pointer: TPointer): TSymbol
  {
    if (!this.model.currentSymbol) {
      throw new Error("Can't update current symbol because currentSymbol is undefined")
    }

    switch (this.model.currentSymbol.type) {
      case SymbolType.Stroke:
        StrokeHelper.addPointer(this.model.currentSymbol as TStroke, pointer)
        break
      case SymbolType.Shape:
        this.updateCurrentSymbolShape(pointer)
        break
      case SymbolType.Edge:
        this.updateCurrentSymbolEdge(pointer)
        break
    }
    return this.model.currentSymbol
  }

  start(info: TPointerInfo): void
  {
    const localPointer = info.pointer
    if (this.tool !== EditorWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(localPointer)
      localPointer.x = x
      localPointer.y = y
    }
    this.currentSymbolOrigin = localPointer
    this.createCurrentSymbol(localPointer, this.editor.penStyle, info.pointerType)
    this.renderer.drawSymbol(this.model.currentSymbol!)
  }

  continue(info: TPointerInfo): void
  {
    const localPointer = info.pointer
    if (this.tool !== EditorWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(localPointer)
      localPointer.x = x
      localPointer.y = y
    }

    this.renderer.ensurePointVisible(localPointer, 20)

    this.updateCurrentSymbol(localPointer)
    this.renderer.drawSymbol(this.model.currentSymbol!)
  }

  protected async interactWithBackend(stroke: TStroke): Promise<void>
  {
    const localStroke = cloneSymbol(stroke) as TStroke
    let gestureFromContextLess: TGesture | undefined
    if (this.needContextLessGesture(stroke)) {
      gestureFromContextLess = await this.gestureManager.getGestureFromContextLess(localStroke)
    }
    if (gestureFromContextLess) {
      this.history.pop()
      this.recognizer.addStrokes([localStroke], this.detectGesture)
      await this.gestureManager.apply(localStroke, gestureFromContextLess)
    }
    else {
      const gesture = await this.recognizer.addStrokes([localStroke], this.detectGesture)
      if (gesture) {
        this.history.pop()
        await this.gestureManager.apply(localStroke, gesture)
      }
    }
  }

  async end(info: TPointerInfo): Promise<void>
  {
    const localPointer = info.pointer
    if (this.tool !== EditorWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(localPointer)
      localPointer.x = x
      localPointer.y = y
    }
    const localSymbol = this.updateCurrentSymbol(localPointer)
    this.model.currentSymbol = undefined
    this.currentSymbolOrigin = undefined
    this.snaps.clearSnapToElementLines()

    this.renderer.drawSymbol(localSymbol!)
    this.model.addSymbol(localSymbol)
    this.history.push(this.model, { added: [localSymbol] })

    this.renderer.redrawGuides()

    if (isStroke(localSymbol)) {
      await this.interactWithBackend(localSymbol)
    }
  }
}
