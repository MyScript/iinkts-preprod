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

/** Page chrome */
export const UI = {
  title: "Math Tutor",
  /** @param {number} level */
  level: (level) => `Level ${level}`,
  levelNames: { 1: "One step", 2: "Two steps", 3: "Triangle" },
  check: "Check",
  next: "Next exercise",
  restart: "Start over",
  preparing: "Preparing the sheet…",
  margin: "What the machine reads",
  solved: "Solved! Well done.",
  /** @param {number} count */
  stars: (count) => `${count} solved`,
  rotate: "Turn your tablet to landscape to start.",
  marks: { correct: "✓", wrong: "✗", unchecked: "?", pending: "…", "after-error": "" },
}

/** Feedback on the drawing itself, on level 3 */
export const FIGURE_HINTS = {
  "no-triangle": "Draw a right triangle first.",
  "not-right": "This triangle has no right angle: Pythagoras does not apply. Draw it again.",
  labels: "Write a = … and b = … next to the two sides of the right angle.",
  /**
   * @param {number} a
   * @param {number} b
   */
  values: (a, b) => `The two sides of the right angle are a = ${a} and b = ${b}.`,
}

/** Labels drawn over the figure */
export const FIGURE_UI = {
  /** @param {string} value */
  hypotenuse: (value) => `c = √(a² + b²) = ${value}`,
}

export const EXPLORE = "Now change a or b: c follows."

/** Connection pill and the message shown while verdicts are on hold */
export const CONNECTION = {
  connecting: "Connecting…",
  online: "Online",
  offline: "Offline",
  syncing: "Reconnecting…",
  error: "Connection lost",
  waiting: "No connection: keep writing, your lines will be checked as soon as it is back.",
  lost: "The connection could not be restored. Reload the page to continue.",
}
