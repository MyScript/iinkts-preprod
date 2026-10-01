// @ts-check
/**
 * Turns the lines a student wrote into what the page shows: a mark per line, a hint on the first
 * wrong one, and whether the exercise is solved.
 *
 * The last line is only judged once the student paused or pressed Check. Judging it while it is
 * being written flashes a red mark on `2x =` before the right side exists, and even a line that
 * already reads as a final answer may not be: `x = 12` reads `x = 1` until the 2 is drawn.
 */

import { checkLines } from "./evaluator.js"
import { isSolved } from "./exercises.js"
import { diagnose, hintFor } from "./hints.js"

/**
 * @typedef {import("./lines.js").TLine} TLine
 * @typedef {import("./exercises.js").TExercise} TExercise
 * @typedef {"correct" | "wrong" | "pending" | "unchecked" | "after-error"} TMarkStatus
 * @typedef {{ line: TLine, status: TMarkStatus, hint?: string }} TMark
 * @typedef {{ marks: TMark[], solved: boolean }} TJudgement
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
