import { DEMO_EXERCISES } from "../../../../../examples/interactive-canvas/math-tutor/demo-exercises.js"
import {
  analyzeFigure,
  bindDefinitions,
  findTriangle,
  rightAngleVertex,
} from "../../../../../examples/interactive-canvas/math-tutor/figure.js"
import type { TLine } from "../../../../../examples/interactive-canvas/math-tutor/lines.js"

import { add, eq, num, sqrt, sup, v } from "./fixtures"

/** Right angle at (80, 40); legs along x and y, in millimeters like the JIIX */
const RIGHT = [80, 40, 80, 106, 159, 106]
const triangleNode = (points: number[], kind = "triangle") => ({ type: "Node", id: "tri", kind, points })

/** A Math line whose box is centered on (x, y) */
function lineAt(id: string, expression: TLine["expression"], x: number, y: number): TLine {
  return { id, label: id, expression, box: { x: x - 10, y: y - 4, width: 20, height: 8 } }
}

describe("math-tutor/figure", () => {
  const exercise = DEMO_EXERCISES.find((e) => e.kind === "figure" && e.params.a === 3)!

  describe("findTriangle", () => {
    test("should read a triangle node", () => {
      expect(findTriangle({ elements: [triangleNode(RIGHT)] })).toEqual({
        id: "tri",
        points: [
          { x: 80, y: 40 },
          { x: 80, y: 106 },
          { x: 159, y: 106 },
        ],
      })
    })

    test("should accept a three-point polygon and ignore other shapes", () => {
      expect(findTriangle({ elements: [triangleNode(RIGHT, "polygon")] })?.points).toHaveLength(3)
      expect(findTriangle({ elements: [triangleNode([0, 0, 10, 0, 10, 10, 0, 10], "polygon")] })).toBeUndefined()
      expect(findTriangle({ elements: [{ type: "Node", id: "c", kind: "circle" }] })).toBeUndefined()
      expect(findTriangle(undefined)).toBeUndefined()
    })
  })

  describe("rightAngleVertex", () => {
    test("should find the right angle within 8 degrees", () => {
      expect(rightAngleVertex(findTriangle({ elements: [triangleNode(RIGHT)] })!.points)).toBe(1)
      // 84° at the bottom left corner still counts as drawn by hand
      expect(rightAngleVertex(findTriangle({ elements: [triangleNode([87, 40, 80, 106, 159, 106])] })!.points)).toBe(1)
    })

    test("should find none on a triangle that is not right", () => {
      expect(rightAngleVertex(findTriangle({ elements: [triangleNode([100, 40, 80, 106, 159, 106])] })!.points)).toBe(-1)
    })
  })

  describe("bindDefinitions", () => {
    const triangle = findTriangle({ elements: [triangleNode(RIGHT)] })!

    test("should bind each definition to the side it is written next to", () => {
      const lines = [
        lineAt("a", eq(v("a"), num(3)), 70, 73), // left of the vertical leg (side 0)
        lineAt("b", eq(v("b"), num(4)), 120, 114), // under the horizontal leg (side 1)
        lineAt("c", eq(v("c"), num(5)), 128, 66), // beside the hypotenuse (side 2)
      ]
      expect(bindDefinitions(lines, triangle).map((binding) => [binding.variable, binding.value, binding.side])).toEqual([
        ["a", 3, 0],
        ["b", 4, 1],
        ["c", 5, 2],
      ])
    })

    test("should measure from the part of the label nearest the side, not its center", () => {
      // `a = 3` is wide: centered 27 mm left of the vertical leg, its right edge stops 4 mm short
      const wide: TLine = { id: "wide", label: "a=3", expression: eq(v("a"), num(3)), box: { x: 30, y: 69, width: 46, height: 8 } }
      expect(bindDefinitions([wide], triangle).map((binding) => binding.side)).toEqual([0])
    })

    test("should ignore lines far from the triangle and lines that are not definitions", () => {
      const lines = [
        lineAt("far", eq(v("a"), num(3)), 300, 300),
        lineAt("formula", eq(v("c"), sqrt(add(sup(v("a"), num(2)), sup(v("b"), num(2))))), 70, 73),
      ]
      expect(bindDefinitions(lines, triangle)).toEqual([])
    })

    test("should keep the nearest definition when two claim the same side", () => {
      const lines = [lineAt("near", eq(v("a"), num(3)), 74, 73), lineAt("farther", eq(v("x"), num(9)), 62, 73)]
      expect(bindDefinitions(lines, triangle).map((binding) => binding.line.id)).toEqual(["near"])
    })
  })

  describe("analyzeFigure", () => {
    const legs = [lineAt("a", eq(v("a"), num(3)), 70, 73), lineAt("b", eq(v("b"), num(4)), 120, 114)]

    test("should ask for a triangle until one is drawn", () => {
      expect(analyzeFigure({ elements: [] }, [], exercise).problem).toBe("no-triangle")
    })

    test("should reject a triangle that is not right", () => {
      const jiix = { elements: [triangleNode([100, 40, 80, 106, 159, 106])] }
      expect(analyzeFigure(jiix, [], exercise).problem).toBe("not-right")
    })

    test("should ask for the legs to be labelled", () => {
      const analysis = analyzeFigure({ elements: [triangleNode(RIGHT)] }, legs.slice(0, 1), exercise)
      expect(analysis.problem).toBe("labels")
    })

    test("should accept the legs labelled with the given values, in either order", () => {
      const swapped = [lineAt("b", eq(v("b"), num(4)), 70, 73), lineAt("a", eq(v("a"), num(3)), 120, 114)]
      expect(analyzeFigure({ elements: [triangleNode(RIGHT)] }, legs, exercise).problem).toBeUndefined()
      expect(analyzeFigure({ elements: [triangleNode(RIGHT)] }, swapped, exercise).problem).toBeUndefined()
    })

    test("should refuse a leg labelled as the hypotenuse", () => {
      const onHypotenuse = [lineAt("a", eq(v("a"), num(3)), 70, 73), lineAt("b", eq(v("b"), num(4)), 128, 66)]
      expect(analyzeFigure({ elements: [triangleNode(RIGHT)] }, onHypotenuse, exercise).problem).toBe("labels")
    })

    test("should compute the hypotenuse live from the values the student wrote", () => {
      const analysis = analyzeFigure({ elements: [triangleNode(RIGHT)] }, legs, exercise)
      expect(analysis.hypotenuse).toBe(5)
      const changed = [lineAt("a", eq(v("a"), num(6)), 70, 73), lineAt("b", eq(v("b"), num(8)), 120, 114)]
      expect(analyzeFigure({ elements: [triangleNode(RIGHT)] }, changed, exercise).hypotenuse).toBe(10)
    })

    test("should tell definitions apart from the reasoning lines", () => {
      const reasoning = lineAt("c", eq(v("c"), num(5)), 250, 200)
      const analysis = analyzeFigure({ elements: [triangleNode(RIGHT)] }, [...legs, reasoning], exercise)
      expect(analysis.bindings.map((binding) => binding.line.id)).toEqual(["a", "b"])
      expect(analysis.reasoning.map((line) => line.id)).toEqual(["c"])
    })
  })
})
