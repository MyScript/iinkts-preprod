// @ts-check
/**
 * Exercises of the Math Tutor: how they are built, generated and picked.
 *
 * Level 1: one-step equation (`x + b = c` or `ax = c`).
 * Level 2: two-step equation (`ax + b = c`), solved over several lines.
 * Level 3: right triangle drawn by hand, hypotenuse found with Pythagoras.
 */

import { EXERCISE_HINTS, PROMPTS } from "./strings.js"

/**
 * @typedef {import("./evaluator.js").TScope} TScope
 * @typedef {import("./evaluator.js").TAnswer} TAnswer
 * @typedef {import("./evaluator.js").TLinesCheck} TLinesCheck
 * @typedef {1 | 2 | 3} TLevel
 * @typedef {{
 *   id: string,
 *   level: TLevel,
 *   kind: "equation" | "figure",
 *   prompt: string,
 *   tex: string,
 *   params: { a: number, b: number, c: number },
 *   solution: TScope,
 *   answer: TAnswer,
 *   hint: string,
 * }} TExercise
 */

/** Integer-sided right triangles, small enough to compute by hand */
export const PYTHAGOREAN_TRIPLES = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [9, 12, 15],
  [8, 15, 17],
]

let generatedCount = 0

/**
 * `ax + b = c`, written the way a teacher would: no `1x`, no `+ -3`, no `+ 0`.
 * @param {number} a
 * @param {number} b
 * @param {number} c
 */
export function formatLinear(a, b, c) {
  const unknown = a === 1 ? "x" : a === -1 ? "-x" : `${a}x`
  const constant = b === 0 ? "" : b > 0 ? ` + ${b}` : ` - ${-b}`
  return `${unknown}${constant} = ${c}`
}

/**
 * @param {string} id
 * @param {TLevel} level
 * @param {number} a
 * @param {number} b
 * @param {number} x the solution
 * @param {string} hint
 * @returns {TExercise}
 */
export function linearExercise(id, level, a, b, x, hint) {
  const c = a * x + b
  return {
    id,
    level,
    kind: "equation",
    prompt: PROMPTS.equation,
    tex: formatLinear(a, b, c),
    params: { a, b, c },
    solution: { x },
    answer: { variable: "x", value: x },
    hint,
  }
}

/**
 * @param {string} id
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {string} hint
 * @returns {TExercise}
 */
export function figureExercise(id, a, b, c, hint) {
  return {
    id,
    level: 3,
    kind: "figure",
    prompt: PROMPTS.figure(a, b),
    tex: `a = ${a},\\ b = ${b},\\ c = ?`,
    params: { a, b, c },
    solution: { a, b, c },
    answer: { variable: "c", value: c },
    hint,
  }
}

/**
 * @param {number} min
 * @param {number} max
 * @param {() => number} random
 */
function randomInt(min, max, random) {
  return min + Math.floor(random() * (max - min + 1))
}

/**
 * @param {number} min
 * @param {number} max
 * @param {() => number} random
 */
function randomNonZero(min, max, random) {
  const value = randomInt(min, max - 1, random)
  return value >= 0 ? value + 1 : value
}

/**
 * @param {TLevel} level
 * @param {() => number} random
 * @returns {TExercise}
 */
function generateLinear(level, random) {
  const id = `generated-${++generatedCount}`
  if (level === 2) {
    const a = randomInt(2, 9, random)
    const b = randomNonZero(-9, 9, random)
    return linearExercise(id, 2, a, b, randomNonZero(-9, 9, random), EXERCISE_HINTS.twoSteps(a, b))
  }
  if (random() < 0.5) {
    const b = randomNonZero(-12, 12, random)
    return linearExercise(id, 1, 1, b, randomNonZero(-12, 12, random), EXERCISE_HINTS.moveConstant(b))
  }
  const a = randomInt(2, 9, random)
  return linearExercise(id, 1, a, 0, randomNonZero(-12, 12, random), EXERCISE_HINTS.divide(a))
}

/**
 * @param {TLevel} level
 * @param {() => number} [random]
 * @returns {TExercise}
 */
export function generateExercise(level, random = Math.random) {
  if (level !== 3) return generateLinear(level, random)
  const [a, b, c] = PYTHAGOREAN_TRIPLES[randomInt(0, PYTHAGOREAN_TRIPLES.length - 1, random)]
  return figureExercise(`generated-${++generatedCount}`, a, b, c, EXERCISE_HINTS.pythagoras)
}

/**
 * Solved when the reasoning holds and ends on the exercise's own unknown.
 * @param {TExercise} exercise
 * @param {TLinesCheck} check
 */
export function isSolved(exercise, check) {
  return check.solved && check.answer?.variable === exercise.answer.variable
}
