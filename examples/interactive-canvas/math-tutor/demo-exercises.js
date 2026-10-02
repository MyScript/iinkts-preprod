// @ts-check
/**
 * The exercises played first, in this order, for a guided demo. Each level then continues with
 * generated exercises.
 */

import { figureExercise, linearExercise } from "./exercises.js"

/** @type {import("./exercises.js").TExercise[]} */
export const DEMO_EXERCISES = [
  linearExercise("demo-1-1", 1, 1, 5, 7, "Which number plus 5 gives 12? Subtract 5 from both sides."),
  linearExercise("demo-1-2", 1, 3, 0, 6, "3 times what gives 18? Divide both sides by 3."),
  linearExercise("demo-2-1", 2, 2, 3, 2, "Get 2x alone first, then find x."),
  linearExercise("demo-2-2", 2, 5, -4, 3, "Move the -4 to the other side first: it becomes +4."),
  figureExercise("demo-3-1", 3, 4, 5, "Square the legs, add them, then take the square root."),
  figureExercise("demo-3-2", 5, 12, 13, "c² = 5² + 12² = 25 + 144."),
]
