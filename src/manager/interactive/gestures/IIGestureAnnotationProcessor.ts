import { Box, IIDecorator, IIStroke, IIText, SymbolType, DecoratorKind, isDecorator, isRecognizedText, isText, type TIISymbol } from "@/symbol"
import type { TIIHistoryChanges } from "@/history"
import type { InteractiveInkEditor } from "@/editor"
import { EditorTool } from "@/Constants"
import type { TGestureAnnotation } from "./GestureAnnotation"

/**
 * Centralized executor for gesture annotations.
 * Standalone IIDecorator symbols live in model.symbols with targetIds referencing strokes.
 * @group Manager
 */
export class IIGestureAnnotationProcessor
{
  constructor(private editor: InteractiveInkEditor) {}

  async apply(ids: string[], annotation: TGestureAnnotation): Promise<TIIHistoryChanges | undefined>
  {
    switch (annotation.kind) {
      case "decorator":
        return this.#applyDecorator(ids, annotation.decoratorKind)
      case "erase":
        await this.editor.removeSymbols(ids)
        return undefined
      case "thicken": {
        const changed = this.#applyThicken(ids, annotation.factor)
        return changed.length ? { style: { symbols: changed } } : undefined
      }
      case "select":
        this.#applySelect(ids)
        return undefined
    }
  }

  #applyDecorator(ids: string[], kind: DecoratorKind): TIIHistoryChanges | undefined
  {
    const seenWordKeys = new Set<string>()
    const added: IIDecorator[] = []
    const erased: IIDecorator[] = []

    for (const id of ids) {
      const sym = this.editor.model.getRootSymbol(id)
      if (!sym) continue

      if (isText(sym)) {
        this.#toggleTextDecorator(sym, kind, added, erased)
        continue
      }

      if (!isRecognizedText(sym as IIStroke)) continue

      const wordGroup = this.editor.jiix.getWordGroupForStroke(sym.id)
      if (wordGroup) {
        if (seenWordKeys.has(wordGroup.wordKey)) continue
        seenWordKeys.add(wordGroup.wordKey)
        this.#toggleWordDecorator(wordGroup.allStrokeIds, wordGroup.wordBounds, wordGroup.baseline, wordGroup.xHeight, kind, added, erased)
      } else {
        // JIIX not yet available — treat stroke as its own group
        if (seenWordKeys.has(sym.id)) continue
        seenWordKeys.add(sym.id)
        this.#toggleWordDecorator([sym.id], null, null, null, kind, added, erased)
      }
    }

    if (!added.length && !erased.length) return undefined
    const changes: TIIHistoryChanges = {}
    if (added.length) changes.added = added
    if (erased.length) changes.erased = erased
    return changes
  }

  #toggleWordDecorator(
    targetIds: string[],
    wordBounds: Box | null,
    baseline: number | null,
    xHeight: number | null,
    kind: DecoratorKind,
    added: IIDecorator[],
    erased: IIDecorator[]
  ): void
  {
    const existing = this.editor.model.symbols
      .filter(isDecorator)
      .find(d => d.kind === kind && this.#sameTargets(d.targetIds, targetIds))

    if (existing) {
      this.editor.model.removeSymbol(existing.id)
      this.editor.renderer.removeElement(existing.id)
      erased.push(existing)
    } else {
      const decorator = new IIDecorator(kind, this.editor.penStyle, targetIds)
      if (wordBounds) decorator.bounds = wordBounds
      else {
        const bounds = this.#computeBoundsFromTargets(targetIds)
        if (bounds) decorator.bounds = bounds
      }
      if (baseline !== null) decorator.baseline = baseline
      if (xHeight !== null) decorator.xHeight = xHeight
      this.editor.model.addSymbol(decorator)
      this.editor.renderer.drawSymbol(decorator)
      added.push(decorator)
    }
  }

  #toggleTextDecorator(sym: IIText, kind: DecoratorKind, added: IIDecorator[], erased: IIDecorator[]): void
  {
    const index = sym.decorators.findIndex(d => d.kind === kind)
    if (index !== -1) {
      const removed = sym.decorators.splice(index, 1)[0]
      this.editor.model.updateSymbol(sym)
      this.editor.renderer.drawSymbol(sym)
      erased.push(removed)
    } else {
      const decorator = new IIDecorator(kind, this.editor.penStyle)
      sym.decorators.push(decorator)
      this.editor.model.updateSymbol(sym)
      this.editor.renderer.drawSymbol(sym)
      added.push(decorator)
    }
  }

  #sameTargets(a: string[], b: string[]): boolean
  {
    if (a.length !== b.length) return false
    const setA = new Set(a)
    return b.every(id => setA.has(id))
  }

  #computeBoundsFromTargets(targetIds: string[]): Box | null
  {
    const syms = targetIds
      .map(id => this.editor.model.getRootSymbol(id))
      .filter((s): s is TIISymbol => !!s)
    if (!syms.length) return null
    return Box.createFromBoxes(syms.map(s => s.bounds))
  }

  #applyThicken(ids: string[], factor: number): IIStroke[]
  {
    const changed: IIStroke[] = []
    const seen = new Set<string>()
    for (const id of ids) {
      const sym = this.editor.model.getRootSymbol(id)
      if (!sym || sym.type !== SymbolType.Stroke || seen.has(sym.id)) continue
      seen.add(sym.id)
      const stroke = sym as IIStroke
      const newWidth = (stroke.style.width || 1) * factor
      this.editor.updateSymbolsStyle([stroke.id], { width: newWidth }, false)
      changed.push(stroke)
    }
    return changed
  }

  #applySelect(ids: string[]): void
  {
    if (ids.length) {
      this.editor.tool = EditorTool.Select
      this.editor.select(ids)
    }
  }
}
