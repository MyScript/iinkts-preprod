import type {
  TJIIXBase,
  TJIIXElement,
  TJIIXMathElement,
  TJIIXMathExpression,
  TJIIXTextElement,
  TJIIXWord,
} from "@/client"
import { JIIXElementType, JIIXMathExpressionType, strokeIdsFromJIIXItems } from "@/client"
import type { TBox, TMatrixTransform } from "@/core"
import { applyMatrixToPoint, BoxOps, convertBoundingBoxMillimeterToPixel } from "@/core"
import type { TMath, TText } from "@/symbol"

import type { TSearchUnit, TSearchUnitChar } from "./SearchUnit"

/** A char drawn by the strokes of `source` still in the model; no box when none is left. */
function inkChar(label: string, source: TJIIXBase, liveStrokeIds: Set<string>): TSearchUnitChar {
  const symbolIds = strokeIdsFromJIIXItems(source.items).filter((id) => liveStrokeIds.has(id))
  const bbox = source["bounding-box"]
  return { label, symbolIds, box: symbolIds.length && bbox ? convertBoundingBoxMillimeterToPixel(bbox) : undefined }
}

/** One unit char per character of `label`, all sharing the box of `base` (the same object). */
function spread(label: string, base: Omit<TSearchUnitChar, "label">): TSearchUnitChar[] {
  return [...label].map((c) => ({ ...base, label: c }))
}

/** Finds the math element a text word refers to (inline math). */
export type TMathResolver = (id: string) => TJIIXMathElement | undefined

/**
 * The chars of one word, each with its own JIIX char when the word points at them, else all
 * sharing the word's box (the same object, so a match counts it once). A word holding inline math
 * (`refs`) reads as that math, between the whitespace around its LaTeX label.
 */
function wordChars(
  element: TJIIXTextElement,
  word: TJIIXWord,
  liveStrokeIds: Set<string>,
  resolveMath: TMathResolver
): TSearchUnitChar[] {
  if (word.refs?.length) {
    const blank = { symbolIds: [] }
    const math = word.refs.flatMap((id) => mathElementChars(resolveMath(id), liveStrokeIds))
    const [lead, trail] = [/^\s*/, /\s*$/].map((edge) => word.label.match(edge)?.[0] ?? "")
    return [...spread(lead, blank), ...math, ...spread(trail, blank)]
  }
  const wordChar = inkChar("", word, liveStrokeIds)
  const firstChar = word["first-char"]
  return [...word.label].map((label, i) => {
    const jiixChar = firstChar !== undefined ? element.chars?.[firstChar + i] : undefined
    return jiixChar ? inkChar(label, jiixChar, liveStrokeIds) : spread(label, wordChar)[0]
  })
}

/**
 * The handwritten text of a JIIX text element, inline math included, or `undefined` when none of
 * its strokes is left in the model (erased, or replaced by a typeset symbol).
 */
export function buildInkTextUnit(
  element: TJIIXTextElement,
  liveStrokeIds: Set<string>,
  resolveMath: TMathResolver = () => undefined
): TSearchUnit | undefined {
  const words: TJIIXWord[] = element.words?.length
    ? element.words
    : [{ label: element.label, items: element.items, "bounding-box": element["bounding-box"] }]
  const chars = words.flatMap((word) => wordChars(element, word, liveStrokeIds, resolveMath))
  return chars.some((c) => c.symbolIds.length) ? { kind: "text", source: "ink", chars } : undefined
}

/** Ids of the math elements read inside a text (inline math), not on their own. */
export function inlinedMathIds(elements: TJIIXElement[]): Set<string> {
  return new Set(
    elements.flatMap((e) => (e.type === JIIXElementType.Text ? (e.words ?? []).flatMap((w) => w.refs ?? []) : []))
  )
}

/**
 * The sign written between the operands (`+`, `=`, `∈`, a fraction's `/`), if any. Only a drawn
 * one counts: JIIX adds a `×` with no ink for an implicit product (`2x`, `f(a)`).
 */
function signOf(expression: TJIIXMathExpression): string | undefined {
  if (!expression.items?.length) {
    return undefined
  }
  if (expression.type === JIIXMathExpressionType.Fraction) {
    return "/"
  }
  return /[a-z]/i.test(expression.type) ? undefined : expression.type
}

/** The parentheses (or brackets…) a JIIX `fence` draws around its content. */
function fenceOf(expression: object): [string, string] | undefined {
  if ("open symbol" in expression && "close symbol" in expression) {
    return [String(expression["open symbol"] ?? ""), String(expression["close symbol"] ?? "")]
  }
  return undefined
}

/** The written form of a leaf: its label, or `√` for a square root. */
function leafLabel(expression: TJIIXMathExpression): string {
  if (expression.type === JIIXMathExpressionType.SquareRoot) {
    return "√"
  }
  return "label" in expression && typeof expression.label === "string" ? expression.label : ""
}

/**
 * The chars of a math expression in reading order: a sign between its operands (before a single
 * one), a fence around them, a leaf's label. Exponents and fractions read linearly. JIIX sends
 * `null` for a blank side (`= 24`), skipped here.
 */
function mathChars(expression: TJIIXMathExpression | null | undefined, liveStrokeIds: Set<string>): TSearchUnitChar[] {
  if (!expression) {
    return []
  }
  const operands = "operands" in expression && Array.isArray(expression.operands) ? expression.operands : []
  const drawn = inkChar("", expression, liveStrokeIds)
  const own = (label: string) => spread(label, drawn)
  const inner = operands.map((operand: TJIIXMathExpression | null) => mathChars(operand, liveStrokeIds))
  const fence = fenceOf(expression)
  if (fence) {
    return [...own(fence[0]), ...inner.flat(), ...own(fence[1])]
  }
  const sign = signOf(expression)
  if (sign && inner.length > 1) {
    return inner.flatMap((chars, i) => [...(i ? own(sign) : []), ...chars])
  }
  return [...own(sign ?? leafLabel(expression)), ...inner.flat()]
}

function mathElementChars(element: TJIIXMathElement | undefined, liveStrokeIds: Set<string>): TSearchUnitChar[] {
  return (element?.expressions ?? []).flatMap((expression) => mathChars(expression, liveStrokeIds))
}

/**
 * The handwritten math of a JIIX math element, or `undefined` when none of its strokes is left in
 * the model.
 */
export function buildInkMathUnit(element: TJIIXMathElement, liveStrokeIds: Set<string>): TSearchUnit | undefined {
  const chars = mathElementChars(element, liveStrokeIds)
  return chars.some((c) => c.symbolIds.length) ? { kind: "math", source: "ink", chars } : undefined
}

/** `box` as the symbol shows it: through its transform. */
function placeBox(box: TBox, transform: TMatrixTransform): TBox {
  return BoxOps.createFromPoints(BoxOps.getCorners(box).map((p) => applyMatrixToPoint(p, transform)))
}

function typesetChars(symbol: TText | TMath, children: { label: string; bounds: TBox }[]): TSearchUnitChar[] {
  return children.flatMap((child) =>
    spread(child.label, { box: placeBox(child.bounds, symbol.transform), symbolIds: [symbol.id] })
  )
}

/** The characters of a converted text. */
export function buildTypesetTextUnit(text: TText): TSearchUnit {
  return { kind: "text", source: "typeset", chars: typesetChars(text, text.chars) }
}

/** The elements of a converted math expression, in their order. */
export function buildTypesetMathUnit(math: TMath): TSearchUnit {
  return { kind: "math", source: "typeset", chars: typesetChars(math, math.elements) }
}
