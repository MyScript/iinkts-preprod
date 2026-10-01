import {
  checkLine,
  checkLines,
  evaluate,
  parseAnswer,
} from "../../../../../examples/interactive-canvas/math-tutor/evaluator.js"

import {
  add,
  div,
  eq,
  frac,
  mul,
  neg,
  num,
  op,
  sqrt,
  sub,
  sup,
  twoXPlusThreeEqualsSeven,
  v,
} from "./fixtures"

describe("math-tutor/evaluator", () => {
  describe("evaluate", () => {
    test("should evaluate numbers and the four operations", () => {
      expect(evaluate(num(4))).toBe(4)
      expect(evaluate(add(num(1), num(2), num(3)))).toBe(6)
      expect(evaluate(sub(num(9), num(4)))).toBe(5)
      expect(evaluate(mul(num(3), num(4)))).toBe(12)
      expect(evaluate(div(num(8), num(2)))).toBe(4)
    })

    test("should evaluate unary minus, fractions, powers and roots", () => {
      expect(evaluate(neg(num(3)))).toBe(-3)
      expect(evaluate(frac(num(1), num(4)))).toBe(0.25)
      expect(evaluate(sup(num(3), num(2)))).toBe(9)
      expect(evaluate(op("power", num(2), num(3)))).toBe(8)
      expect(evaluate(sqrt(num(25)))).toBe(5)
      expect(evaluate(op("root", num(27), num(3)))).toBeCloseTo(3)
      expect(evaluate(op("group", add(num(1), num(2))))).toBe(3)
    })

    test("should read variables from the scope", () => {
      expect(evaluate(twoXPlusThreeEqualsSeven.operands![0], { x: 2 })).toBe(7)
    })

    test("should read π as a symbol", () => {
      expect(evaluate({ type: "symbol", label: "π" })).toBeCloseTo(Math.PI)
    })

    test("should give up on what it cannot compute", () => {
      expect(evaluate(v("y"), { x: 2 })).toBeUndefined()
      expect(evaluate(op("integral", num(1)))).toBeUndefined()
      expect(evaluate(div(num(1), num(0)))).toBeUndefined()
      expect(evaluate(sqrt(num(-1)))).toBeUndefined()
      expect(evaluate(add(num(1), v("y")))).toBeUndefined()
    })
  })

  describe("parseAnswer", () => {
    test("should read `x = <constant>`", () => {
      expect(parseAnswer(eq(v("x"), num(2)))).toEqual({ variable: "x", value: 2 })
      expect(parseAnswer(eq(v("x"), neg(num(3))))).toEqual({ variable: "x", value: -3 })
      expect(parseAnswer(eq(v("x"), frac(num(1), num(2))))).toEqual({ variable: "x", value: 0.5 })
    })

    test("should reject what is not a final answer", () => {
      expect(parseAnswer(twoXPlusThreeEqualsSeven)).toBeUndefined()
      expect(parseAnswer(eq(v("x"), v("y")))).toBeUndefined()
      expect(parseAnswer(eq(num(2), v("x")))).toBeUndefined()
      expect(parseAnswer(add(v("x"), num(2)))).toBeUndefined()
    })
  })

  describe("checkLine", () => {
    test("should accept a line that holds once the solution is substituted", () => {
      expect(checkLine(twoXPlusThreeEqualsSeven, { x: 2 })).toEqual({ verdict: "correct", left: 7, right: 7 })
    })

    test("should reject a line that does not hold", () => {
      expect(checkLine(eq(mul(num(2), v("x")), num(10)), { x: 2 })).toEqual({ verdict: "wrong", left: 4, right: 10 })
    })

    test("should check every member of a chain", () => {
      const chain = eq(add(sup(num(3), num(2)), sup(num(4), num(2))), add(num(9), num(16)), num(25))
      expect(checkLine(chain, {}).verdict).toBe("correct")
      const broken = eq(add(sup(num(3), num(2)), sup(num(4), num(2))), add(num(9), num(16)), num(24))
      expect(checkLine(broken, {}).verdict).toBe("wrong")
    })

    test("should leave a line it cannot judge unchecked", () => {
      expect(checkLine(add(num(9), num(16)), {}).verdict).toBe("unchecked")
      expect(checkLine(eq(v("y"), num(3)), { x: 2 }).verdict).toBe("unchecked")
    })

    test("should accept a rounded decimal up to the digits written", () => {
      const third = eq(v("x"), num(0.33, "0.33"))
      expect(checkLine(third, { x: 1 / 3 }).verdict).toBe("correct")
      expect(checkLine(eq(v("x"), num(0.3, "0.3")), { x: 1 / 3 }).verdict).toBe("correct")
      expect(checkLine(eq(v("x"), num(0.34, "0.34")), { x: 1 / 3 }).verdict).toBe("wrong")
    })

    test("should not tolerate an integer that is off by a little", () => {
      expect(checkLine(eq(v("x"), num(3)), { x: 2.6 }).verdict).toBe("wrong")
    })
  })

  describe("checkLines", () => {
    const solution = { x: 2 }
    const right = [twoXPlusThreeEqualsSeven, eq(mul(num(2), v("x")), num(4)), eq(v("x"), num(2))]

    test("should report the verdict of each line and no first wrong line", () => {
      const result = checkLines(right, solution)
      expect(result.verdicts.map((line) => line.verdict)).toEqual(["correct", "correct", "correct"])
      expect(result.firstWrong).toBe(-1)
      expect(result.answer).toEqual({ variable: "x", value: 2 })
      expect(result.solved).toBe(true)
    })

    test("should point at the first wrong line", () => {
      const lines = [twoXPlusThreeEqualsSeven, eq(mul(num(2), v("x")), num(10)), eq(v("x"), num(5))]
      const result = checkLines(lines, solution)
      expect(result.firstWrong).toBe(1)
      expect(result.solved).toBe(false)
    })

    test("should not count an unfinished reasoning as solved", () => {
      const result = checkLines(right.slice(0, 2), solution)
      expect(result.firstWrong).toBe(-1)
      expect(result.answer).toBeUndefined()
      expect(result.solved).toBe(false)
    })

    test("should not count a final answer as solved once a line above is wrong", () => {
      // A wrong step followed by the right answer copied from somewhere is not a solved exercise
      const lines = [eq(mul(num(2), v("x")), num(10)), eq(v("x"), num(2))]
      expect(checkLines(lines, solution).solved).toBe(false)
    })
  })
})
