// @ts-check
/**
 * Level 3: what the machine understands of the triangle drawn by hand.
 *
 * The JIIX gives the triangle as a `Node` with its three vertices in millimeters (no convert
 * needed, IIC-2096 spike), and each `a = 3` written next to a side as its own `Math` element.
 * A definition belongs to the side it is written closest to.
 */

import { parseAnswer } from "./evaluator.js"

/**
 * @typedef {{ x: number, y: number }} TPoint
 * @typedef {{ id: string, points: TPoint[] }} TTriangle
 * @typedef {import("./lines.js").TLine} TLine
 * @typedef {import("./exercises.js").TExercise} TExercise
 * @typedef {{ type: string, id: string, kind?: string, points?: number[] }} TNodeElement
 * @typedef {{ elements?: TNodeElement[] }} TFigureJiix
 * @typedef {{ line: TLine, variable: string, value: number, side: number, distance: number }} TBinding
 * @typedef {"no-triangle" | "not-right" | "labels"} TFigureProblem
 * @typedef {{
 *   triangle?: TTriangle,
 *   rightVertex: number,
 *   bindings: TBinding[],
 *   reasoning: TLine[],
 *   hypotenuse?: number,
 *   problem?: TFigureProblem,
 * }} TFigureAnalysis
 */

/** A hand-drawn right angle is never exactly 90° */
export const RIGHT_ANGLE_TOLERANCE = 8
/** How far from a side, in millimeters, a definition still labels it */
export const LABEL_DISTANCE = 20

/**
 * @param {number[]} flat `[x1, y1, x2, y2, …]`
 * @returns {TPoint[]}
 */
function toPoints(flat) {
  const points = []
  for (let index = 0; index + 1 < flat.length; index += 2) points.push({ x: flat[index], y: flat[index + 1] })
  return points
}

/**
 * The first triangle of the document: a `triangle` node, or a polygon with three vertices.
 * @param {TFigureJiix | undefined} jiix
 * @returns {TTriangle | undefined}
 */
export function findTriangle(jiix) {
  for (const element of jiix?.elements ?? []) {
    if (element.type !== "Node" || !element.points) continue
    const points = toPoints(element.points)
    if ((element.kind === "triangle" || element.kind === "polygon") && points.length === 3) {
      return { id: element.id, points }
    }
  }
  return undefined
}

/**
 * @param {TPoint} previous
 * @param {TPoint} vertex
 * @param {TPoint} next
 */
function angleAt(previous, vertex, next) {
  const a = { x: previous.x - vertex.x, y: previous.y - vertex.y }
  const b = { x: next.x - vertex.x, y: next.y - vertex.y }
  const cos = (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y))
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI
}

/**
 * Index of the vertex holding the right angle, or -1.
 * @param {TPoint[]} points
 * @param {number} [tolerance] degrees
 */
export function rightAngleVertex(points, tolerance = RIGHT_ANGLE_TOLERANCE) {
  return points.findIndex(
    (vertex, index) => Math.abs(angleAt(points[(index + 2) % 3], vertex, points[(index + 1) % 3]) - 90) <= tolerance
  )
}

/**
 * @param {TPoint} point
 * @param {TPoint} start
 * @param {TPoint} end
 */
function distanceToSegment(point, start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared
    ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
    : 0
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy))
}

/**
 * Corners, edge middles and center of a box: a label is as close to a side as its nearest
 * part. Measured from its center, a wide `a = 3` written right against a side looked far.
 * @param {import("./evaluator.js").TBox} box
 * @returns {TPoint[]}
 */
function samplePoints(box) {
  const xs = [box.x, box.x + box.width / 2, box.x + box.width]
  const ys = [box.y, box.y + box.height / 2, box.y + box.height]
  return xs.flatMap((x) => ys.map((y) => ({ x, y })))
}

/**
 * Side `i` joins vertex `i` to vertex `i + 1`.
 * @param {TLine} line
 * @param {TTriangle} triangle
 * @returns {{ side: number, distance: number }}
 */
function nearestSide(line, triangle) {
  const samples = samplePoints(line.box)
  return triangle.points
    .map((start, side) => {
      const end = triangle.points[(side + 1) % 3]
      return { side, distance: Math.min(...samples.map((point) => distanceToSegment(point, start, end))) }
    })
    .reduce((best, candidate) => (candidate.distance < best.distance ? candidate : best))
}

/**
 * The definitions (`a = 3`) written next to a side, one per side: the nearest one wins.
 * @param {TLine[]} lines
 * @param {TTriangle} triangle
 * @param {number} [maxDistance] millimeters
 * @returns {TBinding[]}
 */
export function bindDefinitions(lines, triangle, maxDistance = LABEL_DISTANCE) {
  /** @type {Map<number, TBinding>} */
  const bySide = new Map()
  lines.forEach((line) => {
    const answer = parseAnswer(line.expression)
    if (!answer) return
    const { side, distance } = nearestSide(line, triangle)
    const current = bySide.get(side)
    if (distance <= maxDistance && (!current || distance < current.distance)) {
      bySide.set(side, { line, variable: answer.variable, value: answer.value, side, distance })
    }
  })
  return [...bySide.values()].sort((a, b) => a.side - b.side)
}

/**
 * Both legs of the right angle carry the exercise's two leg variables, one each.
 * @param {TBinding[]} bindings
 * @param {number} rightVertex
 */
function legsLabelled(bindings, rightVertex) {
  const legSides = [(rightVertex + 2) % 3, rightVertex]
  const onLegs = bindings.filter((binding) => legSides.includes(binding.side)).map((binding) => binding.variable)
  return onLegs.length === 2 && onLegs.includes("a") && onLegs.includes("b")
}

/**
 * @param {TBinding[]} bindings
 * @returns {number | undefined}
 */
function liveHypotenuse(bindings) {
  const a = bindings.find((binding) => binding.variable === "a")?.value
  const b = bindings.find((binding) => binding.variable === "b")?.value
  return a === undefined || b === undefined ? undefined : Math.hypot(a, b)
}

/**
 * @param {TFigureJiix | undefined} jiix
 * @param {TLine[]} lines every Math line of the sheet
 * @param {TExercise} exercise
 * @returns {TFigureAnalysis}
 */
export function analyzeFigure(jiix, lines, exercise) {
  const triangle = exercise.kind === "figure" ? findTriangle(jiix) : undefined
  if (!triangle) return { rightVertex: -1, bindings: [], reasoning: lines, problem: "no-triangle" }
  const rightVertex = rightAngleVertex(triangle.points)
  const bindings = bindDefinitions(lines, triangle)
  const bound = new Set(bindings.map((binding) => binding.line.id))
  const reasoning = lines.filter((line) => !bound.has(line.id))
  const hypotenuse = liveHypotenuse(bindings)
  if (rightVertex === -1) return { triangle, rightVertex, bindings, reasoning, hypotenuse, problem: "not-right" }
  const problem = legsLabelled(bindings, rightVertex) ? undefined : "labels"
  return { triangle, rightVertex, bindings, reasoning, hypotenuse, problem }
}
