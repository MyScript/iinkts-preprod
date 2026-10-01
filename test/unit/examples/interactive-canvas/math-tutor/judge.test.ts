import { DEMO_EXERCISES } from "../../../../../examples/interactive-canvas/math-tutor/demo-exercises.js"
import type { TExpression } from "../../../../../examples/interactive-canvas/math-tutor/evaluator.js"
import { analyzeFigure } from "../../../../../examples/interactive-canvas/math-tutor/figure.js"
import { judge, judgeFigure } from "../../../../../examples/interactive-canvas/math-tutor/judge.js"
import { FIGURE_HINTS, HINTS } from "../../../../../examples/interactive-canvas/math-tutor/strings.js"

import { add, eq, mul, num, sqrt, sup, twoXPlusThreeEqualsSeven, v } from "./fixtures"

describe("math-tutor/judge", () => {
  const exercise = DEMO_EXERCISES.find((e) => e.tex === "2x + 3 = 7")!
  const toLines = (...expressions: TExpression[]) =>
    expressions.map((expression, index) => ({
      id: `line-${index}`,
      label: "",
      box: { x: 0, y: index * 15, width: 40, height: 10 },
      expression,
    }))
  const statuses = (result: ReturnType<typeof judge>) => result.marks.map((mark) => mark.status)

  const twoXEqualsFour = eq(mul(num(2), v("x")), num(4))
  const twoXEqualsTen = eq(mul(num(2), v("x")), num(10))

  test("should wait before judging a last line still being written", () => {
    const result = judge(toLines(twoXPlusThreeEqualsSeven, twoXEqualsTen), exercise, { finished: false })
    expect(statuses(result)).toEqual(["correct", "pending"])
    expect(result.solved).toBe(false)
  })

  test("should judge the last line once the student is done", () => {
    const result = judge(toLines(twoXPlusThreeEqualsSeven, twoXEqualsTen), exercise, { finished: true })
    expect(statuses(result)).toEqual(["correct", "wrong"])
  })

  test("should wait on a final answer too, its digits may not all be written yet", () => {
    // `x = 12` reads `x = 1` until the 2 is drawn: judging it then flashed a wrong mark
    const lines = toLines(twoXPlusThreeEqualsSeven, twoXEqualsFour, eq(v("x"), num(2)))
    const writing = judge(lines, exercise, { finished: false })
    expect(statuses(writing)).toEqual(["correct", "correct", "pending"])
    expect(writing.solved).toBe(false)

    const done = judge(lines, exercise, { finished: true })
    expect(statuses(done)).toEqual(["correct", "correct", "correct"])
    expect(done.solved).toBe(true)
  })

  test("should explain the first wrong line and leave the next ones unmarked", () => {
    const result = judge(toLines(twoXPlusThreeEqualsSeven, twoXEqualsTen, eq(v("x"), num(5))), exercise, {
      finished: true,
    })
    expect(statuses(result)).toEqual(["correct", "wrong", "after-error"])
    expect(result.marks[1].hint).toBe(HINTS.sign)
    expect(result.marks[0].hint).toBeUndefined()
    expect(result.marks[2].hint).toBeUndefined()
    expect(result.solved).toBe(false)
  })

  test("should fall back on the exercise hint when the mistake is not a typical one", () => {
    const result = judge(toLines(eq(mul(num(2), v("x")), num(57))), exercise, { finished: true })
    expect(result.marks[0].hint).toBe(exercise.hint)
  })

  test("should leave a line it cannot read unchecked", () => {
    const result = judge(toLines(add(num(1), num(2)), twoXEqualsFour), exercise, { finished: false })
    expect(statuses(result)).toEqual(["unchecked", "pending"])
  })

  test("should not be solved without any line", () => {
    expect(judge([], exercise, { finished: true })).toEqual({ marks: [], solved: false })
  })

  describe("judgeFigure", () => {
    const figure = DEMO_EXERCISES.find((e) => e.kind === "figure" && e.params.a === 3)!
    const jiix = { elements: [{ type: "Node", id: "tri", kind: "triangle", points: [80, 40, 80, 106, 159, 106] }] }
    const at = (id: string, expression: TExpression, x: number, y: number) => ({
      id,
      label: id,
      expression,
      box: { x: x - 10, y: y - 4, width: 20, height: 8 },
    })
    const a = at("a", eq(v("a"), num(3)), 70, 73)
    const b = at("b", eq(v("b"), num(4)), 120, 114)
    const run = (lines: ReturnType<typeof at>[], finished = true) =>
      judgeFigure(analyzeFigure(jiix, lines, figure), figure, { finished })
    const statusOf = (result: ReturnType<typeof run>, id: string) =>
      result.marks.find((mark) => mark.line.id === id)?.status

    test("should explain what is wrong with the drawing", () => {
      const notRight = { elements: [{ type: "Node", id: "tri", kind: "triangle", points: [100, 40, 80, 106, 159, 106] }] }
      expect(judgeFigure(analyzeFigure(notRight, [], figure), figure, { finished: true }).figureHint).toBe(
        FIGURE_HINTS["not-right"]
      )
      expect(run([a]).figureHint).toBe(FIGURE_HINTS.labels)
      expect(run([a, b]).figureHint).toBeUndefined()
    })

    test("should check the legs against the given values", () => {
      const wrongLeg = at("b", eq(v("b"), num(5)), 120, 114)
      const result = run([a, wrongLeg])
      expect(statusOf(result, "a")).toBe("correct")
      expect(statusOf(result, "b")).toBe("wrong")
      expect(result.marks.find((mark) => mark.line.id === "b")?.hint).toBe(FIGURE_HINTS.values(3, 4))
      expect(result.solved).toBe(false)
    })

    test("should be solved by the hypotenuse written on its side", () => {
      const result = run([a, b, at("c", eq(v("c"), num(5)), 128, 66)])
      expect(statusOf(result, "c")).toBe("correct")
      expect(result.solved).toBe(true)
    })

    test("should diagnose a wrong hypotenuse", () => {
      const result = run([a, b, at("c", eq(v("c"), num(25)), 128, 66)])
      expect(statusOf(result, "c")).toBe("wrong")
      expect(result.marks.find((mark) => mark.line.id === "c")?.hint).toBe(HINTS["square-root"])
    })

    test("should be solved by a reasoning written beside the figure", () => {
      const formula = at("formula", eq(v("c"), sqrt(add(sup(v("a"), num(2)), sup(v("b"), num(2))))), 250, 150)
      const answer = at("answer", eq(v("c"), num(5)), 250, 170)
      expect(run([a, b, formula, answer], false).solved).toBe(false)
      const result = run([a, b, formula, answer])
      expect(statusOf(result, "formula")).toBe("correct")
      expect(result.solved).toBe(true)
    })

    test("should not be solved while the drawing is wrong", () => {
      const result = run([a, at("c", eq(v("c"), num(5)), 128, 66)])
      expect(result.solved).toBe(false)
    })
  })
})
