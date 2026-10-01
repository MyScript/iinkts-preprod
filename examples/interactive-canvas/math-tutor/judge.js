// @ts-check
/**
 * Turns the lines a student wrote into what the page shows: a mark per line, a hint on the first
 * wrong one, and whether the exercise is solved.
 *
 * The last line is only judged once the student paused or pressed Check. Judging it while it is
 * being written flashes a red mark on `2x =` before the right side exists, and even a line that
 * already reads as a final answer may not be: `x = 12` reads `x = 1` until the 2 is drawn.
 */

import { checkLine, checkLines } from "./evaluator.js"
import { isSolved } from "./exercises.js"
import { diagnose, hintFor } from "./hints.js"
import { FIGURE_HINTS } from "./strings.js"

/**
 * @typedef {import("./lines.js").TLine} TLine
 * @typedef {import("./exercises.js").TExercise} TExercise
 * @typedef {"correct" | "wrong" | "pending" | "unchecked" | "after-error"} TMarkStatus
 * @typedef {{ line: TLine, status: TMarkStatus, hint?: string }} TMark
 * @typedef {{ marks: TMark[], solved: boolean }} TJudgement
 * @typedef {import("./figure.js").TBinding} TBinding
 * @typedef {import("./figure.js").TFigureAnalysis} TFigureAnalysis
 * @typedef {TJudgement & { figureHint?: string }} TFigureJudgement
 */

/**
 * @param {TLine} line
 * @param {TMarkStatus} status
 * @param {string} [hint]
 * @returns {TMark}
 */
function markOf(line, status, hint) {
  return hint === undefined ? { line, status } : { line, status, hint }
}

/**
 * @param {TLine[]} lines in reading order
 * @param {TExercise} exercise
 * @param {{ finished: boolean }} options `finished`: the student is done with the last line
 * @returns {TJudgement}
 */
export function judge(lines, exercise, { finished }) {
  const check = checkLines(
    lines.map((line) => line.expression),
    exercise.solution
  )
  const lastPending = !finished
  let errorSeen = false
  const marks = lines.map((line, index) => {
    if (errorSeen) return markOf(line, "after-error")
    if (lastPending && index === lines.length - 1) return markOf(line, "pending")
    const { verdict } = check.verdicts[index]
    if (verdict !== "wrong") return markOf(line, verdict)
    errorSeen = true
    const mistake = diagnose(line.expression, lines[index - 1]?.expression, exercise.solution)
    return markOf(line, "wrong", hintFor(mistake, exercise.hint))
  })
  return { marks, solved: !lastPending && isSolved(exercise, check) }
}

/**
 * A side label checked against the exercise. The hypotenuse is the answer: like the last line of
 * a reasoning, it waits until the student is done.
 * @param {TBinding} binding
 * @param {TExercise} exercise
 * @param {boolean} finished
 * @returns {TMark}
 */
function judgeDefinition(binding, exercise, finished) {
  const { line, variable } = binding
  if (variable === exercise.answer.variable && !finished) return markOf(line, "pending")
  const { verdict } = checkLine(line.expression, exercise.solution)
  if (verdict !== "wrong") return markOf(line, verdict)
  const isLeg = variable !== exercise.answer.variable
  const hint = isLeg
    ? FIGURE_HINTS.values(exercise.params.a, exercise.params.b)
    : hintFor(diagnose(line.expression, undefined, exercise.solution), exercise.hint)
  return markOf(line, "wrong", hint)
}

/**
 * Level 3: the drawing, its side labels and the reasoning beside it. Solved once the right
 * triangle carries the given legs and the hypotenuse is found, on its side or in a reasoning.
 * @param {TFigureAnalysis} analysis
 * @param {TExercise} exercise
 * @param {{ finished: boolean }} options
 * @returns {TFigureJudgement}
 */
export function judgeFigure(analysis, exercise, options) {
  const definitions = analysis.bindings.map((binding) => judgeDefinition(binding, exercise, options.finished))
  const reasoning = judge(analysis.reasoning, exercise, options)
  const marks = [...definitions, ...reasoning.marks]
  const answeredOnSide = definitions.some(
    (mark, index) => analysis.bindings[index].variable === exercise.answer.variable && mark.status === "correct"
  )
  const solved =
    !analysis.problem && marks.every((mark) => mark.status !== "wrong") && (reasoning.solved || answeredOnSide)
  return { marks, solved, figureHint: analysis.problem ? FIGURE_HINTS[analysis.problem] : undefined }
}
