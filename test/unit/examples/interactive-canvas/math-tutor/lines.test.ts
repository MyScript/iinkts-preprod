import { linesFromJiix } from "../../../../../examples/interactive-canvas/math-tutor/lines.js"

import { eq, num, v } from "./fixtures"

describe("math-tutor/lines", () => {
  const box = (x: number, y: number) => ({ x, y, width: 20, height: 8 })
  const math = (id: string, label: string, x: number, y: number) => ({
    type: "Math",
    id,
    label,
    "bounding-box": box(x, y),
    expressions: [eq(v("x"), num(Number(label.split("=")[1])))],
  })

  test("should make one line per Math element, top to bottom", () => {
    // The server sends one Math element per written line, in no particular order
    const jiix = { elements: [math("b", "x=2", 10, 40), math("a", "x=1", 10, 20), math("c", "x=3", 10, 60)] }
    expect(linesFromJiix(jiix).map((line) => line.id)).toEqual(["a", "b", "c"])
  })

  test("should order lines on the same row from left to right", () => {
    const jiix = { elements: [math("right", "x=2", 60, 20), math("left", "x=1", 10, 21)] }
    expect(linesFromJiix(jiix).map((line) => line.id)).toEqual(["left", "right"])
  })

  test("should keep the expression, label and box of each line", () => {
    const [line] = linesFromJiix({ elements: [math("a", "x=1", 10, 20)] })
    expect(line).toEqual({ id: "a", label: "x=1", box: box(10, 20), expression: eq(v("x"), num(1)) })
  })

  test("should skip shapes, text and Math elements without an expression", () => {
    const jiix = {
      elements: [
        { type: "Node", id: "triangle", kind: "triangle", "bounding-box": box(0, 0) },
        { type: "Text", id: "text", label: "hello", "bounding-box": box(0, 10) },
        { type: "Math", id: "empty", label: "", "bounding-box": box(0, 20), expressions: [] },
        math("a", "x=1", 10, 30),
      ],
    }
    expect(linesFromJiix(jiix).map((line) => line.id)).toEqual(["a"])
  })

  test("should accept a JIIX without elements", () => {
    expect(linesFromJiix({})).toEqual([])
    expect(linesFromJiix(undefined)).toEqual([])
  })
})
