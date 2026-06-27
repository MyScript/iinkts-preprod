import type { TDecorator, TStroke, TText, TBox, DecoratorKind} from "@/symbol";
import { SymbolType, isDecorator, isRecognizedText, isText, type TSymbol } from "@/symbol"
import { BoxHelper } from "@/symbol/primitives/Box"
import { DecoratorHelper } from "@/symbol/decorator/Decorator"
import type { TIIHistoryChanges } from "@/history"
import type { InteractiveInkEditor } from "@/editor"

/**
 * Unified representation of a gesture's intent on a set of target strokes.
 * Handlers write annotations; IIGestureAnnotationProcessor executes them.
 * @group Manager
 */
export type TGestureAnnotation =
  | { kind: "decorator"; decoratorKind: DecoratorKind }
  | { kind: "erase" }
  | { kind: "thicken"; factor: number }
  | { kind: "select" }

/**
 * Centralized executor for gesture annotations.
 * Standalone TDecorator symbols live in model.symbols with targetIds referencing strokes.
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
    const added: TDecorator[] = []
    const erased: TDecorator[] = []

    for (const id of ids) {
      const sym = this.editor.model.getRootSymbol(id)
      if (!sym) continue

      if (isText(sym)) {
        this.#toggleTextDecorator(sym, kind, added, erased)
        continue
      }

      if (!isRecognizedText(sym as TStroke)) continue

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
    wordBounds: TBox | null,
    baseline: number | null,
    xHeight: number | null,
    kind: DecoratorKind,
    added: TDecorator[],
    erased: TDecorator[]
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
      const decorator = DecoratorHelper.create(kind, this.editor.penStyle, targetIds)
      if (wordBounds) DecoratorHelper.setBounds(decorator, wordBounds)
      else {
        const bounds = this.#computeBoundsFromTargets(targetIds)
        if (bounds) DecoratorHelper.setBounds(decorator, bounds)
      }
      if (baseline !== null) decorator.baseline = baseline
      if (xHeight !== null) decorator.xHeight = xHeight
      this.editor.model.addSymbol(decorator)
      this.editor.renderer.drawSymbol(decorator)
      added.push(decorator)
    }
  }

  #toggleTextDecorator(sym: TText, kind: DecoratorKind, added: TDecorator[], erased: TDecorator[]): void
  {
    const index = sym.decorators.findIndex(d => d.kind === kind)
    if (index !== -1) {
      const removed = sym.decorators.splice(index, 1)[0]
      this.editor.model.updateSymbol(sym)
      this.editor.renderer.drawSymbol(sym)
      erased.push(removed)
    } else {
      const decorator = DecoratorHelper.create(kind, this.editor.penStyle)
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

  #computeBoundsFromTargets(targetIds: string[]): TBox | null
  {
    const syms = targetIds
      .map(id => this.editor.model.getRootSymbol(id))
      .filter((s): s is TSymbol => !!s)
    if (!syms.length) return null
    return BoxHelper.createFromBoxes(syms.map(s => s.bounds))
  }

  #applyThicken(ids: string[], factor: number): TStroke[]
  {
    const changed: TStroke[] = []
    const seen = new Set<string>()
    for (const id of ids) {
      const sym = this.editor.model.getRootSymbol(id)
      if (!sym || sym.type !== SymbolType.Stroke || seen.has(sym.id)) continue
      seen.add(sym.id)
      const stroke = sym as TStroke
      const newWidth = (stroke.style.width || 1) * factor
      this.editor.updateSymbolsStyle([stroke.id], { width: newWidth }, false)
      changed.push(stroke)
    }
    return changed
  }

  #applySelect(ids: string[]): void
  {
    if (ids.length) {
      this.editor.select(ids)
    }
  }
}
