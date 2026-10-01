// @ts-check
/**
 * Every text the Math Tutor shows, in one place so the demo can be translated without touching
 * the code.
 */

/** Hints shown under a wrong line, keyed by the mistake `diagnose` recognized */
export const HINTS = {
  sign: "Watch the sign: a term changes sign when it moves to the other side.",
  division: "Divide both sides by the coefficient of the unknown.",
  "square-root": "Almost there: you still need to take the square root.",
  slip: "Your method is right, check the arithmetic on this line.",
  generic: "This line does not follow from the one above. Check it step by step.",
}

/** What the student is asked to do, per kind of exercise */
export const PROMPTS = {
  equation: "Solve for x. Write each step on its own line.",
  /**
   * @param {number} a
   * @param {number} b
   */
  figure: (a, b) =>
    `Draw a right triangle with legs a = ${a} and b = ${b}. Label its sides, then find the hypotenuse c.`,
}

/** Hints written for generated exercises, when no typical mistake is recognized */
export const EXERCISE_HINTS = {
  /** @param {number} b */
  moveConstant: (b) => (b > 0 ? `Subtract ${b} from both sides.` : `Add ${-b} to both sides.`),
  /** @param {number} a */
  divide: (a) => `Divide both sides by ${a}.`,
  /**
   * @param {number} a
   * @param {number} b
   */
  twoSteps: (a, b) => `First ${b > 0 ? `subtract ${b} from` : `add ${-b} to`} both sides, then divide by ${a}.`,
  pythagoras: "In a right triangle, c² = a² + b².",
}
