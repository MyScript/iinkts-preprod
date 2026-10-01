import { DEMO_EXERCISES } from "../../../../../examples/interactive-canvas/math-tutor/demo-exercises.js"
import type { TExpression } from "../../../../../examples/interactive-canvas/math-tutor/evaluator.js"
import { judge } from "../../../../../examples/interactive-canvas/math-tutor/judge.js"
import { HINTS } from "../../../../../examples/interactive-canvas/math-tutor/strings.js"

import { add, eq, mul, num, twoXPlusThreeEqualsSeven, v } from "./fixtures"

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
})
