// @ts-check
/**
 * Draws the verdicts over the ink without touching the canvas model: a mark before each line,
 * a highlight and a hint under the first wrong one, and what the machine read in the right
 * margin. A verdict drawn as a model change would land in undo/redo and reach the server.
 *
 * JIIX boxes are in millimeters in the document frame; they reach the screen through the
 * rendering layer's CTM, which pan and zoom keep up to date.
 */

import { convertBoundingBoxMillimeterToPixel } from "../../../dist/iink.esm.js"
import { UI } from "./strings.js"

/**
 * @typedef {import("./judge.js").TMark} TMark
 * @typedef {import("./evaluator.js").TBox} TBox
 * @typedef {{ element: HTMLElement, mark: TMark, place: "mark" | "highlight" | "hint" | "reading" }} TPiece
 * @typedef {{ render: (latex: string, element: HTMLElement, options: object) => void }} TKatex
 */

const MARK_GAP = 8
const HINT_GAP = 6

export class TutorOverlay {
  /** @type {TPiece[]} */
  #pieces = []
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

  /** @param {TMark[]} marks */
  render(marks) {
    this.container.replaceChildren()
    this.#pieces = marks.flatMap((mark) => this.#piecesOf(mark))
    this.#pieces.forEach((piece) => this.container.append(piece.element))
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
    if (!matrix || this.#pieces.length === 0) return
    const origin = this.container.getBoundingClientRect()
    const key = [matrix.a, matrix.d, matrix.e, matrix.f, origin.left, origin.top, origin.width].join()
    if (key === this.#layoutKey) return
    this.#layoutKey = key
    this.#pieces.forEach((piece) => this.#place(piece, this.#toContainer(piece.mark.line.box, matrix, origin)))
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
