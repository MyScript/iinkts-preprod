// @ts-check
/**
 * The Math Tutor flow: which exercise is on the sheet, when the lines get judged, and moving on
 * once it is solved.
 */

import { analyzeFigure } from "./figure.js"
import { judge, judgeFigure } from "./judge.js"
import { linesFromJiix } from "./lines.js"
import { nextExercise } from "./playlist.js"
import { EXPLORE, UI } from "./strings.js"

/**
 * @typedef {import("./exercises.js").TExercise} TExercise
 * @typedef {import("./exercises.js").TLevel} TLevel
 * @typedef {import("./lines.js").TLine} TLine
 * @typedef {import("./lines.js").TJiix} TJiix
 * @typedef {import("./overlay.js").TutorOverlay} TutorOverlay
 * @typedef {import("./overlay.js").TKatex} TKatex
 * @typedef {import("./exercises.js").TExercise["kind"]} TKind
 * @typedef {import("./figure.js").TFigureJiix} TFigureJiix
 * @typedef {{
 *   exportAs: (format: "jiix") => Promise<TJiix & TFigureJiix>,
 *   clear: () => Promise<unknown>,
 *   updateRecognitionConfiguration: (partial: object) => Promise<void>,
 *   event: EventTarget,
 * }} TTutorCanvas
 * @typedef {{
 *   rootElement: HTMLElement,
 *   statement: HTMLElement,
 *   prompt: HTMLElement,
 *   levels: HTMLElement,
 *   stars: HTMLElement,
 *   banner: HTMLElement,
 *   checkButton: HTMLButtonElement,
 *   nextButton: HTMLButtonElement,
 *   restartButton: HTMLButtonElement,
 * }} TTutorElements
 */

/**
 * How long the pen has to rest before the last line counts as finished. Long enough to think
 * between two digits: a shorter pause judged `x = 1` while `x = 12` was being written.
 */
export const PAUSE_MS = 2500

/** @type {TLevel[]} */
export const LEVELS = [1, 2, 3]

/**
 * What the recognizer looks for, per kind of exercise. Equations are math only: with shapes on,
 * a `0` can come back as a circle and a `1` as a line.
 * @type {Record<TKind, ("math" | "shape")[]>}
 */
export const RECOGNITION_TYPES = { equation: ["math"], figure: ["math", "shape"] }

/** @param {TKind} kind */
export function rawContentFor(kind) {
  const types = RECOGNITION_TYPES[kind]
  return { "raw-content": { recognition: { types }, classification: { types } } }
}

export class Tutor {
  /** @type {TTutorCanvas | undefined} */
  #canvas
  /** @type {TExercise | undefined} */
  #exercise
  /** @type {TLevel} */
  #level = 1
  /** @type {Record<TLevel, number>} */
  #played = { 1: 0, 2: 0, 3: 0 }
  /** Ids of the exercises solved this session: solving one again after Start over counts once */
  #solvedIds = new Set()
  #solved = false
  /** @type {TLine[]} */
  #lines = []
  /** @type {(TJiix & TFigureJiix) | undefined} */
  #jiix
  /** The recognition the session runs with; the page opens it for equations */
  /** @type {TKind} */
  #recognitionKind = "equation"
  #finished = false
  #penDown = false
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #pauseTimer
  #renderQueue = Promise.resolve()
  /** Bumped on every new exercise: an export still in flight for the previous one is dropped */
  #generation = 0

  /**
   * @param {TTutorElements} elements
   * @param {TutorOverlay} overlay
   * @param {TKatex | undefined} katex
   */
  constructor(elements, overlay, katex) {
    this.elements = elements
    this.overlay = overlay
    this.katex = katex
    elements.rootElement.addEventListener("pointerdown", () => this.#onPenDown(), { capture: true })
    elements.rootElement.addEventListener("pointerup", () => this.#onPenUp(), { capture: true })
    elements.rootElement.addEventListener("pointercancel", () => this.#onPenUp(), { capture: true })
    elements.checkButton.addEventListener("click", () => this.#finish())
    elements.nextButton.addEventListener("click", () => this.#next())
    elements.restartButton.addEventListener("click", () => this.#load(this.#exercise))
    this.#renderLevels()
  }

  /** @param {TTutorCanvas} canvas */
  attach(canvas) {
    this.#canvas = canvas
    this.#recognitionKind = "equation"
    canvas.event.addEventListener("exported", () => this.#refresh())
    this.#load(this.#exercise ?? nextExercise(this.#level, this.#played[this.#level]))
  }

  /** @param {TLevel} level */
  selectLevel(level) {
    this.#level = level
    this.#renderLevels()
    this.#load(nextExercise(level, this.#played[level]))
  }

  #onPenDown() {
    this.#penDown = true
    this.#finished = false
    clearTimeout(this.#pauseTimer)
  }

  #onPenUp() {
    this.#penDown = false
    this.#schedulePause()
  }

  /** The export of a stroke can land while the next one is drawn: the pause only runs pen up */
  #schedulePause() {
    clearTimeout(this.#pauseTimer)
    if (this.#penDown) return
    this.#pauseTimer = setTimeout(() => this.#finish(), PAUSE_MS)
  }

  #finish() {
    clearTimeout(this.#pauseTimer)
    this.#finished = true
    this.#judge()
  }

  #refresh() {
    const generation = this.#generation
    this.#renderQueue = this.#renderQueue
      .then(async () => {
        const jiix = await this.#canvas?.exportAs("jiix")
        if (generation !== this.#generation) return
        this.#jiix = jiix
        this.#lines = linesFromJiix(jiix)
        // No pause re-armed here: it counts from the last pen up, not from when the server
        // answered. An export landing after the pause is judged as finished right away.
        this.#judge()
      })
      .catch((error) => console.error(error))
  }

  #judge() {
    const exercise = this.#exercise
    if (!exercise) return
    const options = { finished: this.#finished }
    if (exercise.kind !== "figure") {
      const { marks, solved } = judge(this.#lines, exercise, options)
      this.overlay.render(marks)
      if (solved && !this.#solved) this.#onSolved()
      return
    }
    const analysis = analyzeFigure(this.#jiix, this.#lines, exercise)
    if (this.#solved) {
      // Solved: the figure is the student's to play with, the hypotenuse follows their values
      this.overlay.render([], { analysis, hint: EXPLORE, explore: true })
      return
    }
    const { marks, solved, figureHint } = judgeFigure(analysis, exercise, options)
    this.overlay.render(marks, { analysis, hint: figureHint, explore: false })
    if (solved) this.#onSolved()
  }

  #onSolved() {
    this.#solved = true
    if (this.#exercise) this.#solvedIds.add(this.#exercise.id)
    this.elements.stars.textContent = `★ ${UI.stars(this.#solvedIds.size)}`
    this.elements.banner.hidden = false
    this.elements.nextButton.classList.add("is-ready")
    if (this.#exercise?.kind === "figure") this.#judge()
  }

  #next() {
    this.#played[this.#level]++
    this.#load(nextExercise(this.#level, this.#played[this.#level]))
  }

  /** @param {TExercise | undefined} exercise */
  async #load(exercise) {
    if (!exercise) return
    this.#generation++
    clearTimeout(this.#pauseTimer)
    this.#exercise = exercise
    this.#solved = false
    this.#finished = false
    this.#lines = []
    this.#jiix = undefined
    this.overlay.clear()
    this.elements.banner.hidden = true
    this.elements.nextButton.classList.remove("is-ready")
    this.#renderStatement(exercise)
    await this.#canvas?.clear()
    await this.#useRecognitionFor(exercise.kind)
  }

  /**
   * Opens a session for this kind of exercise if the current one is for the other kind. Done
   * on an empty sheet, so the new session has nothing to resend.
   * @param {TKind} kind
   */
  async #useRecognitionFor(kind) {
    if (!this.#canvas || kind === this.#recognitionKind) return
    this.#recognitionKind = kind
    // The canvas is read-only while the session reopens and drops what is drawn meanwhile:
    // the sheet says so instead of swallowing the first stroke
    const sheet = this.elements.rootElement.parentElement
    sheet?.classList.add("is-preparing")
    try {
      await this.#canvas.updateRecognitionConfiguration(rawContentFor(kind))
    } finally {
      sheet?.classList.remove("is-preparing")
    }
  }

  /** @param {TExercise} exercise */
  #renderStatement(exercise) {
    this.elements.prompt.textContent = exercise.prompt
    try {
      this.katex?.render(exercise.tex, this.elements.statement, { throwOnError: false, displayMode: true })
    } catch {
      this.elements.statement.textContent = exercise.tex
    }
  }

  #renderLevels() {
    this.elements.levels.replaceChildren(
      ...LEVELS.map((level) => {
        const button = document.createElement("button")
        button.className = `tutor-level${level === this.#level ? " is-active" : ""}`
        button.innerHTML = `<strong></strong><span></span>`
        button.querySelector("strong")?.append(UI.level(level))
        button.querySelector("span")?.append(UI.levelNames[level])
        button.addEventListener("click", () => this.selectLevel(level))
        return button
      })
    )
  }
}
