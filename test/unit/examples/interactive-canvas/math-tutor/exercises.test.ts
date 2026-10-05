import { DEMO_EXERCISES } from "../../../../../examples/interactive-canvas/math-tutor/demo-exercises.js"
import { formatLinear, generateExercise, isSolved, PYTHAGOREAN_TRIPLES } from "../../../../../examples/interactive-canvas/math-tutor/exercises.js"
import type { TExercise } from "../../../../../examples/interactive-canvas/math-tutor/exercises.js"
import { checkLines } from "../../../../../examples/interactive-canvas/math-tutor/evaluator.js"

import { add, eq, mul, num, sqrt, sup, twoXPlusThreeEqualsSeven, v } from "./fixtures"

/** Deterministic stand-in for Math.random, cycling through the given values */
function sequence(...values: number[]): () => number {
  let index = 0
  return () => values[index++ % values.length]
}

/** The statement holds once the solution is substituted: the exercise is self-consistent */
function expectConsistent(exercise: TExercise): void {
  const { a, b, c } = exercise.params
  if (exercise.kind === "figure") {
    expect(a * a + b * b).toBe(c * c)
    expect(exercise.solution).toEqual({ a, b, c })
    expect(exercise.answer).toEqual({ variable: "c", value: c })
  } else {
    expect(a * exercise.solution.x + b).toBe(c)
    expect(exercise.answer).toEqual({ variable: "x", value: exercise.solution.x })
    expect(exercise.tex).toBe(formatLinear(a, b, c))
  }
  expect(exercise.prompt.length).toBeGreaterThan(0)
  expect(exercise.hint.length).toBeGreaterThan(0)
}

describe("math-tutor/exercises", () => {
  describe("formatLinear", () => {
    test("should write the equation the way a teacher would", () => {
      expect(formatLinear(2, 3, 7)).toBe("2x + 3 = 7")
      expect(formatLinear(5, -4, 11)).toBe("5x - 4 = 11")
      expect(formatLinear(1, 5, 12)).toBe("x + 5 = 12")
      expect(formatLinear(-1, 2, -3)).toBe("-x + 2 = -3")
      expect(formatLinear(3, 0, 18)).toBe("3x = 18")
    })
  })

  describe("demo set", () => {
    test("should cover the three levels, easiest first", () => {
      expect(DEMO_EXERCISES.map((exercise) => exercise.level)).toEqual([...DEMO_EXERCISES.map((e) => e.level)].sort())
      expect(new Set(DEMO_EXERCISES.map((exercise) => exercise.level))).toEqual(new Set([1, 2, 3]))
    })

    test("should only hold self-consistent exercises with unique ids", () => {
      DEMO_EXERCISES.forEach(expectConsistent)
      expect(new Set(DEMO_EXERCISES.map((exercise) => exercise.id)).size).toBe(DEMO_EXERCISES.length)
    })
  })

  describe("generateExercise", () => {
    test("should generate one-step equations on level 1", () => {
      const exercise = generateExercise(1, sequence(0.5))
      expect(exercise.level).toBe(1)
      expect(exercise.params.a === 1 || exercise.params.b === 0).toBe(true)
    })

    test("should generate two-step equations on level 2", () => {
      const exercise = generateExercise(2, sequence(0.9, 0.2, 0.7))
      expect(exercise.params.a).not.toBe(1)
      expect(exercise.params.b).not.toBe(0)
    })

    test("should generate a Pythagorean figure on level 3", () => {
      const exercise = generateExercise(3, sequence(0))
      expect(exercise.kind).toBe("figure")
      expect(PYTHAGOREAN_TRIPLES).toContainEqual([exercise.params.a, exercise.params.b, exercise.params.c])
    })

    test("should always generate self-consistent exercises with a non-zero integer solution", () => {
      for (let seed = 0; seed < 200; seed++) {
        const random = sequence(((seed * 0.618) % 1) + 0, ((seed * 0.377) % 1) + 0, ((seed * 0.143) % 1) + 0)
        ;([1, 2, 3] as const).forEach((level) => {
          const exercise = generateExercise(level, random)
          expectConsistent(exercise)
          Object.values(exercise.solution).forEach((value) => {
            expect(Number.isInteger(value)).toBe(true)
            expect(value).not.toBe(0)
          })
        })
      }
    })

    test("should give each generated exercise its own id", () => {
      const random = sequence(0.1, 0.5, 0.9, 0.3)
      expect(generateExercise(2, random).id).not.toBe(generateExercise(2, random).id)
    })
  })

  describe("isSolved", () => {
    const exercise = DEMO_EXERCISES.find((e) => e.tex === "2x + 3 = 7")!

    test("should accept a correct reasoning ending on the answer", () => {
      const lines = [twoXPlusThreeEqualsSeven, eq(mul(num(2), v("x")), num(4)), eq(v("x"), num(2))]
      expect(isSolved(exercise, checkLines(lines, exercise.solution))).toBe(true)
    })

    test("should refuse an answer to another variable", () => {
      // y = 2 holds nothing: y is not the unknown of this exercise
      expect(isSolved(exercise, checkLines([eq(v("y"), num(2))], exercise.solution))).toBe(false)
    })

    test("should accept the hypotenuse found through the legs", () => {
      const figure = DEMO_EXERCISES.find((e) => e.kind === "figure")!
      const { a, b, c } = figure.params
      const lines = [eq(v("c"), sqrt(add(sup(num(a), num(2)), sup(num(b), num(2))))), eq(v("c"), num(c))]
      expect(isSolved(figure, checkLines(lines, figure.solution))).toBe(true)
    })
  })
})

