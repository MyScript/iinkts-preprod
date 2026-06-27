import type { TText, TMath, TSymbol, TSymbolChar, TBox} from "@/symbol";
import { isText } from "@/symbol"
import { TextOps } from "@/symbol/text/Text"
import { MathOps } from "@/symbol/math/Math"
import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import { IIAbstractManager } from "./IIAbstractManager"
import { LoggerCategory } from "@/logger"

/**
 * @group Manager
 */
export class IITypesetManager extends IIAbstractManager
{
  protected managerName = "IITypesetManager"

  constructor(editor: TInteractiveInkEditor)
  {
    super(editor, LoggerCategory.TEXT)
    this.logger.info("constructor")
  }

  get rowHeight(): number
  {
    return this.editor.configuration.rendering.guides.gap
  }

  protected drawSymbolHidden(symbol: TText | TMath): SVGGElement
  {
    const clone = structuredClone(symbol) as TText | TMath
    clone.id = "symbol-to-measure"
    if (isText(clone)) {
      clone.chars.forEach(c => c.id += "-to-measure")
    }
    clone.decorators = []
    this.renderer.layer.querySelector(`#${ clone.id }`)?.remove()
    const el = this.renderer.buildElementFromSymbol(clone)!
    el.setAttribute("visibility", "hidden")
    this.renderer.prependElement(el)
    return el as SVGGElement
  }

  setCharsBounds(text: TText, textGroupEl: SVGGElement): TText
  {
    const textEl = textGroupEl.querySelector("text")
    if (textEl) {
      for (let i = 0; i < textEl.getNumberOfChars(); i++) {
        const char = text.chars.at(i)
        if (char) {
          const ext = textEl.getExtentOfChar(i)
          char.bounds = { x: ext.x, y: ext.y, width: ext.width, height: ext.height }
        }
      }
    }
    return text
  }

  setBounds(symbol: TText | TMath): void
  {
    const el = this.drawSymbolHidden(symbol)
    if (isText(symbol)) {
      symbol.bounds = this.getElementBoundingBox(el)
      this.setCharsBounds(symbol, el)
      TextOps.updateDerivedFields(symbol)
    }
    else {
      const bbox = el.getBBox()
      symbol.bounds = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height } as TBox
      MathOps.updateDerivedFields(symbol)
    }
  }

  getElementBoundingBox(textElement: SVGElement): TBox
  {
    const bbox = textElement.querySelector("text")!.getBBox({ stroke: true, markers: true, clipped: true, fill: true })
    return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height } as TBox
  }

  getBoundingBox(text: TText): TBox
  {
    const element = this.drawSymbolHidden(text)
    return this.getElementBoundingBox(element)
  }

  getSpaceWidth(fontSize: number): number
  {
    const boundingBox: TBox = { height: 0, width: 0, x: 0, y: 0 }
    const charSymbol: TSymbolChar = {
      id: `text-char-space`,
      label: "-",
      color: "",
      fontSize,
      fontWeight: "normal",
      bounds: boundingBox
    }
    return this.getBoundingBox(TextOps.create([charSymbol], { x: 0, y: 0 }, boundingBox))?.width as number
  }

  updateBounds(textSymbol: TText): TText
  {
    this.setBounds(textSymbol)
    this.model.updateSymbol(textSymbol)
    return textSymbol
  }

  moveTextAfter(text: TText, tx: number): TSymbol[] | undefined
  {
    const row = this.model.getSymbolsByRowOrdered().find(r => r.rowIndex === this.model.getSymbolRowIndex(text))
    if (row) {
      const textsAfter = row.symbols.filter(s => isText(s) && s.bounds.x + s.bounds.width / 2 > text.bounds.x + text.bounds.width / 2) as TText[]
      textsAfter.forEach(symbol => {
        symbol.point.x += tx
        this.updateBounds(symbol)
        this.model.updateSymbol(symbol)
        this.renderer.drawSymbol(symbol)
      })
      return textsAfter
    }
    return
  }
}
