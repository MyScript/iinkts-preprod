// @ts-check
/**
 * Draws the verdicts over the ink without touching the canvas model: a mark before each line,
 * a highlight and a hint under the first wrong one, and what the machine read in the right
 * margin. A verdict drawn as a model change would land in undo/redo and reach the server.
 *
 * On level 3 it also draws over the figure: the labelled sides and the right angle. Once the
 * exercise is solved, the hypotenuse computed live from the values the student wrote: shown
 * before, it would give the answer away.
 *
 * JIIX boxes are in millimeters in the document frame; they reach the screen through the
 * rendering layer's CTM, which pan and zoom keep up to date.
 */

import { convertBoundingBoxMillimeterToPixel } from "../../../dist/iink.esm.js"
import { FIGURE_UI, UI } from "./strings.js"

/**
 * @typedef {import("./judge.js").TMark} TMark
 * @typedef {import("./evaluator.js").TBox} TBox
 * @typedef {{ element: HTMLElement, mark: TMark, place: "mark" | "highlight" | "hint" | "reading" }} TPiece
 * @typedef {{ render: (latex: string, element: HTMLElement, options: object) => void }} TKatex
 * @typedef {import("./figure.js").TFigureAnalysis} TFigureAnalysis
 * @typedef {import("./figure.js").TPoint} TPoint
 * @typedef {{ analysis: TFigureAnalysis, hint?: string, explore: boolean }} TFigureView
 */

const MARK_GAP = 8
const HINT_GAP = 6
/** Side of the right-angle square, in millimeters */
const RIGHT_ANGLE_SIZE = 5
const SVG_NS = "http://www.w3.org/2000/svg"

/** @param {number} value */
function formatValue(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export class TutorOverlay {
  /** @type {TPiece[]} */
  #pieces = []
  /** @type {TFigureView | undefined} */
  #figure
  #layoutKey = ""

  /**
   * @param {HTMLElement} container positioned element laid over the canvas
   * @param {HTMLElement} canvasElement the canvas root, holding the rendering layer
   * @param {TKatex | undefined} katex
   */
  constructor(container, canvasElement, katex) {
    this.container = container
    this.canvasElement = canvasElement
    this.katex = katex
    this.#follow()
  }

  /**
   * @param {TMark[]} marks
   * @param {TFigureView} [figure] level 3 only
   */
  render(marks, figure) {
    this.container.replaceChildren()
    this.#pieces = marks.flatMap((mark) => this.#piecesOf(mark))
    this.#pieces.forEach((piece) => this.container.append(piece.element))
    this.#figure = figure
    this.#layoutKey = ""
  }

  clear() {
    this.render([])
  }

  /**
   * @param {TMark} mark
   * @returns {TPiece[]}
   */
  #piecesOf(mark) {
    const pieces = [this.#piece(mark, "mark", UI.marks[mark.status]), this.#reading(mark)]
    if (mark.status === "wrong") pieces.push(this.#piece(mark, "highlight", ""))
    if (mark.hint) pieces.push(this.#piece(mark, "hint", mark.hint))
    return pieces
  }

  /**
   * @param {TMark} mark
   * @param {TPiece["place"]} place
   * @param {string} text
   * @returns {TPiece}
   */
  #piece(mark, place, text) {
    const element = document.createElement("div")
    element.className = `tutor-${place} is-${mark.status}`
    element.textContent = text
    return { element, mark, place }
  }

  /**
   * @param {TMark} mark
   * @returns {TPiece}
   */
  #reading(mark) {
    const piece = this.#piece(mark, "reading", mark.line.label)
    try {
      this.katex?.render(mark.line.label, piece.element, { throwOnError: false })
    } catch {
      // Unparsable LaTeX stays as plain text
    }
    return piece
  }

  /** Repositions on every frame where the view moved: pan, zoom, resize */
  #follow() {
    window.requestAnimationFrame(() => this.#follow())
    const matrix = this.canvasElement.querySelector(".ms-layer-rendering svg")?.getScreenCTM()
    if (!matrix || (this.#pieces.length === 0 && !this.#figure)) return
    const origin = this.container.getBoundingClientRect()
    const key = [matrix.a, matrix.d, matrix.e, matrix.f, origin.left, origin.top, origin.width].join()
    if (key === this.#layoutKey) return
    this.#layoutKey = key
    this.#pieces.forEach((piece) => this.#place(piece, this.#toContainer(piece.mark.line.box, matrix, origin)))
    if (this.#figure)
      this.#drawFigure(this.#figure, (point) => this.#toContainer({ ...point, width: 0, height: 0 }, matrix, origin))
  }

  /**
   * @param {TFigureView} figure
   * @param {(point: TPoint) => TPoint} project millimeters to container pixels
   */
  #drawFigure({ analysis, hint, explore }, project) {
    this.container.querySelectorAll(".tutor-figure").forEach((element) => element.remove())
    const svg = document.createElementNS(SVG_NS, "svg")
    svg.setAttribute("class", "tutor-figure tutor-figure-layer")
    this.container.prepend(svg)
    const { triangle, rightVertex, bindings, hypotenuse } = analysis
    if (triangle) {
      const points = triangle.points.map(project)
      bindings.forEach((binding) => svg.append(this.#side(points, binding.side, binding.variable)))
      if (rightVertex >= 0) svg.append(this.#rightAngle(triangle.points, rightVertex, project))
      if (explore && rightVertex >= 0 && hypotenuse !== undefined)
        this.#hypotenuseLabel(points, rightVertex, hypotenuse)
    }
    if (hint) this.#figureHint(hint)
  }

  /**
   * @param {TPoint[]} points in container pixels
   * @param {number} side
   * @param {string} variable
   */
  #side(points, side, variable) {
    const [start, end] = [points[side], points[(side + 1) % 3]]
    const line = document.createElementNS(SVG_NS, "line")
    Object.entries({ x1: start.x, y1: start.y, x2: end.x, y2: end.y }).forEach(([key, value]) =>
      line.setAttribute(key, String(value))
    )
    line.setAttribute("class", `tutor-side tutor-side-${variable}`)
    return line
  }

  /**
   * The square marking the right angle, built in millimeters along both legs.
   * @param {TPoint[]} points in millimeters
   * @param {number} vertex
   * @param {(point: TPoint) => TPoint} project
   */
  #rightAngle(points, vertex, project) {
    const corner = points[vertex]
    /** @param {TPoint} towards */
    const along = (towards) => {
      const length = Math.hypot(towards.x - corner.x, towards.y - corner.y)
      return {
        x: ((towards.x - corner.x) / length) * RIGHT_ANGLE_SIZE,
        y: ((towards.y - corner.y) / length) * RIGHT_ANGLE_SIZE,
      }
    }
    const u = along(points[(vertex + 1) % 3])
    const w = along(points[(vertex + 2) % 3])
    const square = [
      { x: corner.x + u.x, y: corner.y + u.y },
      { x: corner.x + u.x + w.x, y: corner.y + u.y + w.y },
      { x: corner.x + w.x, y: corner.y + w.y },
    ].map(project)
    const polyline = document.createElementNS(SVG_NS, "polyline")
    polyline.setAttribute("points", square.map((point) => `${point.x},${point.y}`).join(" "))
    polyline.setAttribute("class", "tutor-right-angle")
    return polyline
  }

  /**
   * @param {TPoint[]} points in container pixels
   * @param {number} rightVertex
   * @param {number} value
   */
  #hypotenuseLabel(points, rightVertex, value) {
    const [start, end] = [points[(rightVertex + 1) % 3], points[(rightVertex + 2) % 3]]
    const corner = points[rightVertex]
    // Inside the triangle, a quarter of the way to the right angle: the student writes c outside
    const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
    const anchor = { x: middle.x + (corner.x - middle.x) / 4, y: middle.y + (corner.y - middle.y) / 4 }
    const label = document.createElement("div")
    label.className = "tutor-figure tutor-hypotenuse"
    label.textContent = FIGURE_UI.hypotenuse(formatValue(value))
    label.style.left = `${anchor.x}px`
    label.style.top = `${anchor.y}px`
    this.container.append(label)
  }

  /**
   * Over the sheet, not under the triangle, where the labels are written
   * @param {string} text
   */
  #figureHint(text) {
    const hint = document.createElement("div")
    hint.className = "tutor-figure tutor-figure-hint"
    hint.textContent = text
    this.container.append(hint)
  }

  /**
   * @param {TBox} box
   * @param {DOMMatrix} matrix
   * @param {DOMRect} origin
   * @returns {TBox}
   */
  #toContainer(box, matrix, origin) {
    const pixels = convertBoundingBoxMillimeterToPixel(box)
    const topLeft = new DOMPoint(pixels.x, pixels.y).matrixTransform(matrix)
    const bottomRight = new DOMPoint(pixels.x + pixels.width, pixels.y + pixels.height).matrixTransform(matrix)
    return {
      x: topLeft.x - origin.left,
      y: topLeft.y - origin.top,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    }
  }

  /**
   * @param {TPiece} piece
   * @param {TBox} box line box in container pixels
   */
  #place(piece, box) {
    const style = piece.element.style
    const middle = box.y + box.height / 2
    switch (piece.place) {
      case "mark":
        style.left = `${box.x - MARK_GAP}px`
        style.top = `${middle}px`
        break
      case "highlight":
        Object.assign(style, {
          left: `${box.x}px`,
          top: `${box.y}px`,
          width: `${box.width}px`,
          height: `${box.height}px`,
        })
        break
      case "hint":
        style.left = `${box.x}px`
        style.top = `${box.y + box.height + HINT_GAP}px`
        break
      case "reading":
        style.top = `${middle}px`
        break
    }
  }
}
