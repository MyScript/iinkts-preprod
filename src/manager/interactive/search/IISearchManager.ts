import type { TInteractiveInkCanvas } from "@/canvas"
import type { TJIIXElement } from "@/client"
import { JIIXElementType } from "@/client"
import type { TBox } from "@/core"
import { BoxOps } from "@/core"
import { LoggerCategory } from "@/logger"
import { SVGBuilder } from "@/renderer"
import { isMath, isStroke, isText } from "@/symbol"

import { IIAbstractManager } from "../IIAbstractManager"
import type { TSearchMatch, TSearchUnit } from "./SearchUnit"
import { findInUnit } from "./SearchUnit"
import {
  buildInkMathUnit,
  buildInkTextUnit,
  buildTypesetMathUnit,
  buildTypesetTextUnit,
  inlinedMathIds,
  type TMathResolver,
} from "./SearchUnitBuilders"

/**
 * @group Manager
 * @remarks Searches the recognized content of the canvas, owned by `InteractiveInkCanvas` as `canvas.search`.
 */
export class IISearchManager extends IIAbstractManager {
  protected managerName = "IISearchManager"

  /** `data-overlay` value of the highlight rects */
  static readonly HIGHLIGHT_ATTR = "search"
  /** Class of every highlight rect */
  static readonly HIGHLIGHT_CLASS = "ms-search-highlight"
  /** Extra class of the active match's rects */
  static readonly ACTIVE_CLASS = "ms-search-highlight-active"

  /** The query the highlight follows when the content changes */
  protected lastQuery = ""
  protected highlightedMatches: TSearchMatch[] = []
  protected activeIndex = -1
  protected destroyed = false

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.SEARCH)
    canvas.event.addSynchronizedListener(() => this.onSynchronized())
  }

  /** The matches currently highlighted */
  get highlighted(): TSearchMatch[] {
    return [...this.highlightedMatches]
  }

  /**
   * Every occurrence of `query`, top to bottom then left to right.
   *
   * Case- and accent-insensitive, partial (`"deriv"` finds `"derivative"`), literal: no pattern
   * syntax. In text, any run of whitespace matches one space, so a phrase can span a line break.
   * Math compares without spaces, in reading order (`"3x+2"`); exponents and fractions read
   * linearly with no sign of their own except `/`: a converted `x²` is found by `"x2"`.
   *
   * The highlight follows the last query given here: once the content is synchronized again, it is
   * searched anew and every match of it is highlighted.
   * @param query - The text to look for; blank finds nothing
   */
  find(query: string): TSearchMatch[] {
    this.lastQuery = query
    return this.buildUnits()
      .flatMap((unit) => findInUnit(unit, query))
      .sort((a, b) => a.bounds.y - b.bounds.y || a.bounds.x - b.bounds.x)
  }

  /**
   * Everything searchable: one unit per recognized block still drawn in ink, one per converted
   * text or math. A converted block's strokes are gone from the model, so it is found only once.
   */
  protected buildUnits(): TSearchUnit[] {
    const symbols = this.model.symbols
    const liveStrokeIds = new Set(symbols.filter(isStroke).map((s) => s.id))
    const elements = this.canvas.jiix.getElements()
    const ink = this.buildInkUnits(elements, liveStrokeIds)
    const typeset = symbols.flatMap((s) => {
      if (isText(s)) {
        return [buildTypesetTextUnit(s)]
      }
      return isMath(s) ? [buildTypesetMathUnit(s)] : []
    })
    return [...ink, ...typeset]
  }

  /** One unit per text and math element; inline math is read inside its text, not on its own. */
  protected buildInkUnits(elements: TJIIXElement[], liveStrokeIds: Set<string>): TSearchUnit[] {
    const inlined = inlinedMathIds(elements)
    const resolveMath: TMathResolver = (id) => {
      const element = elements.find((e) => e.id === id)
      return element?.type === JIIXElementType.Math ? element : undefined
    }
    return elements.flatMap((element) => {
      if (element.type === JIIXElementType.Text) {
        return buildInkTextUnit(element, liveStrokeIds, resolveMath) ?? []
      }
      const isOwnMath = element.type === JIIXElementType.Math && !inlined.has(element.id)
      return (isOwnMath && buildInkMathUnit(element, liveStrokeIds)) || []
    })
  }

  /**
   * Draw `matches` over the content, replacing what was highlighted; `active` stands out.
   * Kept up to date as the content changes, see {@link find}.
   */
  highlight(matches: TSearchMatch[], active?: TSearchMatch): void {
    this.highlightedMatches = [...matches]
    this.activeIndex = active ? matches.indexOf(active) : -1
    this.draw()
  }

  /** Remove the highlight. */
  clear(): void {
    this.highlightedMatches = []
    this.activeIndex = -1
    this.removeRects()
  }

  /**
   * Bring `match` into view and select its symbols: centered at the current zoom, or fitted when
   * larger than the view.
   */
  reveal(match: TSearchMatch): void {
    const view = this.renderer.getViewBox()
    if (match.bounds.width > view.width || match.bounds.height > view.height) {
      this.canvas.zoomToFit(match.symbolIds.flatMap((id) => this.model.getSymbol(id) ?? []))
    } else {
      const center = BoxOps.getCenter(match.bounds)
      this.renderer.setViewBox(center.x - view.width / 2, center.y - view.height / 2, view.width, view.height)
    }
    this.canvas.select(match.symbolIds)
  }

  protected onDestroy(): void {
    this.destroyed = true
    this.clear()
  }

  /** Search the last query again, keeping the active match active when it is still found. */
  protected onSynchronized(): void {
    if (this.destroyed || !this.highlightedMatches.length) {
      return
    }
    const activeKey = this.matchKeys(this.highlightedMatches)[this.activeIndex]
    const matches = this.find(this.lastQuery)
    const activeIndex = activeKey === undefined ? -1 : this.matchKeys(matches).indexOf(activeKey)
    this.highlight(matches, matches[activeIndex])
  }

  /** What identifies a match across a refresh: where it is found, what, and its rank there. */
  protected matchKeys(matches: TSearchMatch[]): string[] {
    const seen = new Map<string, number>()
    return matches.map((m) => {
      const key = `${m.source}:${m.symbolIds[0]}:${m.text.toLowerCase()}`
      const rank = seen.get(key) ?? 0
      seen.set(key, rank + 1)
      return `${key}#${rank}`
    })
  }

  protected draw(): void {
    this.removeRects()
    this.highlightedMatches.forEach((match, index) => {
      const className =
        index === this.activeIndex
          ? `${IISearchManager.HIGHLIGHT_CLASS} ${IISearchManager.ACTIVE_CLASS}`
          : IISearchManager.HIGHLIGHT_CLASS
      match.boxes.forEach((box) => this.drawRect(box, className))
    })
  }

  protected drawRect(box: TBox, className: string): void {
    this.renderer.appendElement(
      SVGBuilder.createRect(box, { "data-overlay": IISearchManager.HIGHLIGHT_ATTR, class: className, rx: "2" })
    )
  }

  protected removeRects(): void {
    this.renderer.layer
      ?.querySelectorAll(`[data-overlay="${IISearchManager.HIGHLIGHT_ATTR}"]`)
      .forEach((rect) => rect.remove())
  }
}
