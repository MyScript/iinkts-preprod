// @ts-check
/**
 * The lines a student wrote, read from the JIIX export.
 *
 * The server sends one `Math` element per written line (IIC-2096 spike), not one block whose
 * `expressions` would be the lines, and in no guaranteed order: the reading order comes from
 * the boxes.
 */

/**
 * @typedef {import("./evaluator.js").TBox} TBox
 * @typedef {import("./evaluator.js").TExpression} TExpression
 * @typedef {{ type: string, id: string, label?: string, "bounding-box"?: TBox, expressions?: TExpression[] }} TJiixElement
 * @typedef {{ elements?: TJiixElement[] }} TJiix
 * @typedef {{ id: string, label: string, box: TBox, expression: TExpression }} TLine
 */

/**
 * Top to bottom; two lines whose tops are less than half a line apart sit on the same row and
 * read left to right.
 * @param {TLine} a
 * @param {TLine} b
 */
function readingOrder(a, b) {
  const sameRow = Math.abs(a.box.y - b.box.y) < Math.min(a.box.height, b.box.height) / 2
  return sameRow ? a.box.x - b.box.x : a.box.y - b.box.y
}

/**
 * @param {TJiixElement} element
 * @returns {TLine | undefined}
 */
function toLine(element) {
  const expression = element.expressions?.[0]
  const box = element["bounding-box"]
  if (element.type !== "Math" || !expression || !box) return undefined
  return { id: element.id, label: element.label ?? "", box, expression }
}

/**
 * @param {TLine | undefined} line
 * @returns {line is TLine}
 */
function isLine(line) {
  return line !== undefined
}

/**
 * @param {TJiix | undefined} jiix
 * @returns {TLine[]}
 */
export function linesFromJiix(jiix) {
  return (jiix?.elements ?? []).map(toLine).filter(isLine).sort(readingOrder)
}
