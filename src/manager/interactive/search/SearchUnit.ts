import type { TBox } from "@/core"
import { BoxOps } from "@/core"

/**
 * @group Manager
 * @summary What a search match was found in: text or math
 */
export type TSearchKind = "text" | "math"

/**
 * @group Manager
 * @summary Where a search match was found: recognized handwriting, or a converted symbol
 */
export type TSearchSource = "ink" | "typeset"

/**
 * @group Manager
 * @summary One occurrence of a search query
 */
export type TSearchMatch = {
  /** The matched text, as recognized */
  text: string
  /** A few words around the match, `"…"` where cut */
  context: string
  kind: TSearchKind
  source: TSearchSource
  /** The symbols the match lies on: strokes for ink, the `TText` / `TMath` for typeset */
  symbolIds: string[]
  /** One box per matched character, in pixels; characters sharing a box share it once */
  boxes: TBox[]
  /** Union of `boxes` */
  bounds: TBox
}

/**
 * @group Manager
 * @summary One character of searchable content, with where it is drawn
 */
export type TSearchUnitChar = {
  label: string
  /** Absent for a character with nothing drawn, such as a space */
  box?: TBox
  symbolIds: string[]
}

/**
 * @group Manager
 * @summary A run of searchable content: one recognized block, or one typeset symbol
 */
export type TSearchUnit = {
  kind: TSearchKind
  source: TSearchSource
  chars: TSearchUnitChar[]
}

/** Characters of context kept on each side of a match */
const CONTEXT_RADIUS = 30

const WHITESPACE = /^\s+$/

/** Lower case, accents stripped: what the comparison runs on */
function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

/**
 * The folded string of a unit, and for each of its UTF-16 units the index of the unit char it
 * came from. Folding per char keeps the map exact when folding changes a char's length.
 */
function foldUnit(unit: TSearchUnit): { folded: string; map: number[] } {
  let folded = ""
  const map: number[] = []
  unit.chars.forEach((char, index) => {
    if (WHITESPACE.test(char.label)) {
      if (unit.kind === "math" || folded === "" || folded.endsWith(" ")) {
        return
      }
      folded += " "
      map.push(index)
      return
    }
    for (const unitPart of fold(char.label).split("")) {
      folded += unitPart
      map.push(index)
    }
  })
  return { folded, map }
}

function foldQuery(query: string, kind: TSearchKind): string {
  const folded = fold(query)
  return kind === "math" ? folded.replace(/\s+/g, "") : folded.replace(/\s+/g, " ").trim()
}

function joinLabels(chars: TSearchUnitChar[]): string {
  return chars
    .map((c) => c.label)
    .join("")
    .replace(/\s+/g, " ")
}

function contextBefore(text: string): string {
  if (text.length <= CONTEXT_RADIUS) {
    return text.trimStart()
  }
  const cut = text.slice(-CONTEXT_RADIUS)
  const space = cut.indexOf(" ")
  return `…${space >= 0 ? cut.slice(space + 1) : cut}`
}

function contextAfter(text: string): string {
  if (text.length <= CONTEXT_RADIUS) {
    return text.trimEnd()
  }
  const cut = text.slice(0, CONTEXT_RADIUS)
  const space = cut.lastIndexOf(" ")
  return `${space >= 0 ? cut.slice(0, space) : cut}…`
}

function buildMatch(unit: TSearchUnit, first: number, last: number): TSearchMatch | undefined {
  const chars = unit.chars.slice(first, last + 1)
  const boxes = [...new Set(chars.flatMap((c) => (c.box ? [c.box] : [])))]
  if (!boxes.length) {
    return undefined
  }
  const text = joinLabels(chars)
  return {
    text,
    context:
      contextBefore(joinLabels(unit.chars.slice(0, first))) +
      text +
      contextAfter(joinLabels(unit.chars.slice(last + 1))),
    kind: unit.kind,
    source: unit.source,
    symbolIds: [...new Set(chars.flatMap((c) => c.symbolIds))],
    boxes,
    bounds: BoxOps.createFromBoxes(boxes),
  }
}

/**
 * Every non-overlapping occurrence of `query` in `unit`: case- and accent-insensitive, partial,
 * literal (no pattern syntax). Text compares with whitespace runs collapsed to one space, math
 * with whitespace removed.
 */
export function findInUnit(unit: TSearchUnit, query: string): TSearchMatch[] {
  const needle = foldQuery(query, unit.kind)
  if (!needle) {
    return []
  }
  const { folded, map } = foldUnit(unit)
  const matches: TSearchMatch[] = []
  for (let hit = folded.indexOf(needle); hit >= 0; hit = folded.indexOf(needle, hit + needle.length)) {
    const match = buildMatch(unit, map[hit], map[hit + needle.length - 1])
    if (match) {
      matches.push(match)
    }
  }
  return matches
}
