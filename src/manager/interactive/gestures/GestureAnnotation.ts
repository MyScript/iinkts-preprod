import type { TInteractiveInkCanvas } from "@/canvas"
import type { TBox, TDraft } from "@/core"
import { OBBOps, type TOBB } from "@/core"
import type { TIIHistoryChanges } from "@/history"
import type { DecoratorKind, TDecorator, TStroke, TText } from "@/symbol"
import { isDecorator, isMath, isRecognizedMath, isRecognizedText, isStroke, isText, type TSymbol } from "@/symbol"
import { DecoratorUtil, MathUtil, SymbolGeometry, TextUtil } from "@/symbol-utils"

/**
 * Unified representation of a gesture's intent on a set of target strokes.
 * Handlers write annotations; IIGestureAnnotationProcessor executes them.
 * @group Manager
 */
export type TGestureAnnotation =
  | {
      kind: "decorator"
      decoratorKind: DecoratorKind
      /**
       * One decorator spanning every target instead of one per word or text, as a surround
       * gesture decorates what it encloses as a whole. A lone word or text is decorated as usual.
       */
      group?: boolean
    }
  | { kind: "erase" }
  | {
      kind: "thicken"
      /** Stroke widths to step through, the thickness menu's */
      widths: number[]
      /** Font weights to step through, the font weight menu's */
      fontWeights: ("normal" | "bold")[]
    }
  | { kind: "select" }

/** What one decorator covers when a gesture decorates its targets one by one */
type TDecoratorUnit =
  | { kind: "text"; id: string }
  | {
      kind: "strokes"
      strokeIds: string[]
      wordBounds: TBox | null
      baseline: number | null
      xHeight: number | null
    }

/**
 * Centralized executor for gesture annotations.
 * Standalone TDecorator symbols live in model.symbols with targetIds referencing strokes.
 * @group Manager
 */
export class IIGestureAnnotationProcessor {
  constructor(private canvas: TInteractiveInkCanvas) {}

  async apply(ids: string[], annotation: TGestureAnnotation): Promise<TIIHistoryChanges | undefined> {
    switch (annotation.kind) {
      case "decorator":
        return this.#applyDecorator(ids, annotation.decoratorKind, annotation.group ?? false)
      case "erase":
        await this.canvas.removeSymbols(ids)
        return undefined
      case "thicken":
        await this.#stepThickness(ids, annotation.widths, annotation.fontWeights)
        return undefined
      case "select":
        this.#applySelect(ids)
        return undefined
    }
  }

  async #applyDecorator(ids: string[], kind: DecoratorKind, group: boolean): Promise<TIIHistoryChanges | undefined> {
    await this.#waitForPendingClassification(ids)

    const units = this.#collectDecoratorUnits(ids)
    const added: TDecorator[] = []
    const erased: TDecorator[] = []
    if (group && units.length > 1) {
      const targetIds = units.flatMap((unit) => (unit.kind === "text" ? [unit.id] : unit.strokeIds))
      this.#toggleWordDecorator(targetIds, null, null, null, kind, added, erased)
    } else {
      units.forEach((unit) => this.#toggleUnitDecorator(unit, kind, added, erased))
    }

    if (!added.length && !erased.length) {
      return undefined
    }
    const changes: TIIHistoryChanges = {}
    if (added.length) {
      changes.added = added
    }
    if (erased.length) {
      changes.erased = erased
    }
    return changes
  }

  /**
   * What a decorator gesture decorates among `ids`: each text on its own, each recognized text
   * stroke through the whole word it belongs to, once per word, and the recognized math strokes
   * of one block together. A locked text is refused, an unrecognized stroke or any other symbol
   * left out.
   */
  #collectDecoratorUnits(ids: string[]): TDecoratorUnit[] {
    const units: TDecoratorUnit[] = []
    const seenWordKeys = new Set<string>()
    const mathBlocks = new Map<string, string[]>()
    for (const id of ids) {
      const sym = this.canvas.model.getSymbol(id)
      if (!sym) {
        continue
      }
      if (isText(sym)) {
        this.#pushTextUnit(sym, units)
      } else if (isRecognizedMath(sym)) {
        // JIIX not yet available — the stroke is its own block
        const blockKey = sym.jiixBlockId ?? sym.id
        mathBlocks.set(blockKey, [...(mathBlocks.get(blockKey) ?? []), sym.id])
      } else if (isRecognizedText(sym)) {
        this.#pushWordUnit(sym, seenWordKeys, units)
      }
    }
    mathBlocks.forEach((strokeIds) =>
      units.push({ kind: "strokes", strokeIds, wordBounds: null, baseline: null, xHeight: null })
    )
    return units
  }

  /**
   * A text carries its decorators inside it: decorating a locked one would rewrite it. A locked
   * stroke is left as it is by a decorator, which is a symbol of its own.
   */
  #pushTextUnit(sym: TText, units: TDecoratorUnit[]): void {
    if (sym.locked) {
      this.canvas.event.emitLockedRefused([sym])
    } else {
      units.push({ kind: "text", id: sym.id })
    }
  }

  #pushWordUnit(sym: TStroke, seenWordKeys: Set<string>, units: TDecoratorUnit[]): void {
    // JIIX not yet available — the stroke is its own word
    const wordGroup = this.canvas.jiix.getWordGroupForStroke(sym.id)
    const wordKey = wordGroup?.wordKey ?? sym.id
    if (seenWordKeys.has(wordKey)) {
      return
    }
    seenWordKeys.add(wordKey)
    units.push({
      kind: "strokes",
      strokeIds: wordGroup?.allStrokeIds ?? [sym.id],
      wordBounds: wordGroup?.wordBounds ?? null,
      baseline: wordGroup?.baseline ?? null,
      xHeight: wordGroup?.xHeight ?? null,
    })
  }

  #toggleUnitDecorator(unit: TDecoratorUnit, kind: DecoratorKind, added: TDecorator[], erased: TDecorator[]): void {
    if (unit.kind === "strokes") {
      this.#toggleWordDecorator(unit.strokeIds, unit.wordBounds, unit.baseline, unit.xHeight, kind, added, erased)
      return
    }
    // A draft rather than a read: a decorator is added to or removed from the text, then committed.
    const sym = this.canvas.model.draftSymbol(unit.id)
    if (sym && isText(sym)) {
      this.#toggleTextDecorator(sym, kind, added, erased)
    }
  }

  /**
   * A stroke's `jiixBlockType` (its recognition classification, e.g. "Text") is assigned
   * asynchronously once its own recognition round-trip completes — a separate round-trip
   * from (and not necessarily faster than) the one classifying a gesture drawn around/through
   * it. Without this wait, a decorator gesture applied right after writing its target can
   * find the target stroke present but still unclassified, silently skip it (`isRecognizedText`
   * below is false), and produce no decorator at all — measured up to ~800ms of real
   * classification latency in a slower environment (WebKit/Safari). Give it a couple of
   * seconds to land before giving up on a still-pending candidate.
   */
  async #waitForPendingClassification(ids: string[]): Promise<void> {
    const isPending = () =>
      ids.some((id) => {
        const sym = this.canvas.model.getSymbol(id)
        return sym && isStroke(sym) && !sym.jiixBlockType
      })
    for (const delay of [100, 200, 300, 400, 500, 500]) {
      if (!isPending()) {
        return
      }
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  #toggleWordDecorator(
    targetIds: string[],
    wordBounds: TBox | null,
    baseline: number | null,
    xHeight: number | null,
    kind: DecoratorKind,
    added: TDecorator[],
    erased: TDecorator[]
  ): void {
    const existing = this.canvas.model.symbols
      .filter(isDecorator)
      .find((d) => d.kind === kind && this.#sameTargets(d.targetIds, targetIds))

    if (existing?.locked) {
      this.canvas.event.emitLockedRefused([existing])
    } else if (existing) {
      this.canvas.model.removeSymbol(existing.id)
      this.canvas.renderer.removeElement(existing.id)
      erased.push(existing)
    } else {
      const decorator = DecoratorUtil.createDecorator(kind, this.canvas.penStyle, targetIds)
      // The recognizer's own word box when JIIX has answered, the union of the targets' boxes
      // otherwise. Not interchangeable: a word box is tighter than the union of its strokes, and
      // neither can be recomputed from the decorator, which stores no coordinates of its own.
      if (wordBounds) {
        DecoratorUtil.setTargetBounds(decorator, OBBOps.fromBox(wordBounds))
      } else {
        const bounds = this.#computeBoundsFromTargets(targetIds)
        if (bounds) {
          DecoratorUtil.setTargetBounds(decorator, bounds)
        }
      }
      if (baseline !== null) {
        decorator.baseline = baseline
      }
      if (xHeight !== null) {
        decorator.xHeight = xHeight
      }
      this.canvas.model.addSymbol(decorator)
      this.canvas.renderer.drawSymbol(decorator)
      added.push(decorator)
    }
  }

  #toggleTextDecorator(sym: TDraft<TText>, kind: DecoratorKind, added: TDecorator[], erased: TDecorator[]): void {
    const index = sym.decorators.findIndex((d) => d.kind === kind)
    if (index !== -1) {
      const removed = sym.decorators.splice(index, 1)[0]
      this.canvas.model.commitSymbol(sym)
      this.canvas.renderer.drawSymbol(sym)
      erased.push(removed)
    } else {
      const decorator = DecoratorUtil.createDecorator(kind, this.canvas.penStyle)
      sym.decorators.push(decorator)
      this.canvas.model.commitSymbol(sym)
      this.canvas.renderer.drawSymbol(sym)
      added.push(decorator)
    }
  }

  #sameTargets(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
      return false
    }
    const setA = new Set(a)
    return b.every((id) => setA.has(id))
  }

  #computeBoundsFromTargets(targetIds: string[]): TOBB | null {
    const syms = targetIds.map((id) => this.canvas.model.getSymbol(id)).filter((s): s is TSymbol => !!s)
    if (!syms.length) {
      return null
    }
    return OBBOps.createFromOBBs(syms.map((s) => SymbolGeometry.boundsOf(s)))
  }

  /**
   * Moves each target one level up: a stroke to the first width above its own, a text or math block
   * to the next font weight; past the last level, back to the first. A kind with no level is left as
   * is. `updateSymbols` records the history, the texts it slides along included.
   */
  async #stepThickness(ids: string[], widths: number[], fontWeights: ("normal" | "bold")[]): Promise<void> {
    const sortedWidths = [...widths].sort((a, b) => a - b)
    const targets = [...new Set(ids)].filter((id) => {
      const sym = this.canvas.model.getSymbol(id)
      return (
        !!sym &&
        ((isStroke(sym) && sortedWidths.length > 0) || ((isText(sym) || isMath(sym)) && fontWeights.length > 0))
      )
    })
    if (!targets.length) {
      return
    }
    await this.canvas.updateSymbols(targets, (draft) => {
      if (isText(draft)) {
        const fontWeight = this.#nextFontWeight(fontWeights, TextUtil.isBold(draft) ? "bold" : "normal")
        TextUtil.updateChildrenFont(draft, { fontWeight })
      } else if (isMath(draft)) {
        const fontWeight = this.#nextFontWeight(fontWeights, MathUtil.isBold(draft) ? "bold" : "normal")
        MathUtil.updateChildrenFont(draft, { fontWeight })
      } else if (isStroke(draft)) {
        const width = draft.style.width || 1
        draft.style = { ...draft.style, width: sortedWidths.find((w) => w > width) ?? sortedWidths[0] }
      }
    })
  }

  #nextFontWeight(fontWeights: ("normal" | "bold")[], current: "normal" | "bold"): "normal" | "bold" {
    return fontWeights[(fontWeights.indexOf(current) + 1) % fontWeights.length]
  }

  #applySelect(ids: string[]): void {
    if (ids.length) {
      this.canvas.select(ids)
    }
  }
}
