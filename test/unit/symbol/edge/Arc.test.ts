import { EdgeArcOps, reprojectArcEndpoint, computePointOnEllipse } from "@/iink"
import { OBBOps, TPoint, DefaultStyle, TStyle, TBox } from "@/iink"

describe("Arc.ts", () => {
  describe("constructor", () => {
    test("should create", () => {
      const center: TPoint = { x: 0, y: 0 }
      const startAngle = Math.PI / 4
      const sweepAngle = (3 * Math.PI) / 4
      const radiusX = 10
      const radiusY = 50
      const phi = 0

      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const arc = EdgeArcOps.create(center, startAngle, sweepAngle, radiusX, radiusY, phi, undefined, undefined, style)
      expect(arc).toBeDefined()
      expect(arc.creationTime).toBeLessThanOrEqual(Date.now())
      expect(arc.creationTime).toEqual(arc.modificationDate)
      expect(arc.style).toEqual(expect.objectContaining(style))
      expect(arc.center).toEqual(center)
      expect(OBBOps.toBox(arc.bounds).x).toEqual(-15)
      expect(OBBOps.toBox(arc.bounds).y).toEqual(-5)
      expect(+arc.bounds.width.toFixed(0)).toEqual(27)
      expect(+arc.bounds.height.toFixed(0)).toEqual(60)
    })
    test("should create with default style", () => {
      const center: TPoint = { x: 0, y: 0 }
      const startAngle = Math.PI / 4
      const sweepAngle = (3 * Math.PI) / 4
      const radiusX = 10
      const radiusY = 50
      const phi = 0
      const arc = EdgeArcOps.create(center, startAngle, sweepAngle, radiusX, radiusY, phi)
      expect(arc.style).toEqual(DefaultStyle)
    })
  })

  describe("properties", () => {
    const center: TPoint = { x: 0, y: 0 }
    const smallClockwiseArc = EdgeArcOps.create(center, Math.PI / 4, Math.PI / 4, 5, 5, 0)
    const largeClockwiseArc = EdgeArcOps.create(center, Math.PI / 4, (3 * Math.PI) / 4, 50, 50, 0)
    const smallCounterClockwiseArc = EdgeArcOps.create(center, Math.PI / 4, -Math.PI / 4, 5, 5, 0)
    const largeCounterClockwiseArc = EdgeArcOps.create(center, Math.PI / 4, (-3 * Math.PI) / 4, 50, 50, 0)

    test(`should get vertices for small clockwise arc`, () => {
      expect(smallClockwiseArc.vertices).toHaveLength(9)
      expect(smallClockwiseArc.vertices).toEqual(
        expect.arrayContaining([
          { x: 3.536, y: 3.536 },
          { x: 2.357, y: 4.41 },
          { x: 0, y: 5 },
        ])
      )
    })
    test(`should get vertices for large clockwise arc`, () => {
      expect(largeClockwiseArc.vertices).toHaveLength(13)
      expect(largeClockwiseArc.vertices).toEqual(
        expect.arrayContaining([
          { x: 35.355, y: 35.355 },
          { x: 0, y: 50 },
          { x: -49.039, y: 9.755 },
        ])
      )
    })
    test(`should get vertices for small counter-clockwise arc`, () => {
      expect(smallCounterClockwiseArc.vertices).toHaveLength(9)
      expect(smallCounterClockwiseArc.vertices).toEqual(
        expect.arrayContaining([
          { x: 3.536, y: 3.536 },
          { x: 4.41, y: 2.357 },
          { x: 5, y: 0 },
        ])
      )
    })
    test(`should get vertices for large counter-clockwise arc`, () => {
      expect(largeCounterClockwiseArc.vertices).toHaveLength(13)
      expect(largeCounterClockwiseArc.vertices).toEqual(
        expect.arrayContaining([
          { x: 35.355, y: 35.355 },
          { x: 50, y: 0 },
          { x: 0, y: -50 },
        ])
      )
    })
    test(`should get snap points for small clockwise arc`, () => {
      expect(smallClockwiseArc.snapPoints).toHaveLength(2)
      expect(smallClockwiseArc.snapPoints).toEqual([
        { x: 3.536, y: 3.536 },
        { x: 0, y: 5 },
      ])
    })
  })

  describe("overlaps", () => {
    const center: TPoint = { x: 0, y: 0 }
    const startAngle = Math.PI / 4
    const sweepAngle = Math.PI / 2
    const radiusX = 10
    const radiusY = 50
    const phi = 0
    const arc = EdgeArcOps.create(center, startAngle, sweepAngle, radiusX, radiusY, phi)
    test(`should return true if partially wrap`, () => {
      const boundaries: TBox = { height: 20, width: 20, x: 0, y: 45 }
      expect(EdgeArcOps.overlaps(arc, boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () => {
      const boundaries: TBox = { height: 200, width: 100, x: -50, y: -5 }
      expect(EdgeArcOps.overlaps(arc, boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () => {
      const boundaries: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(EdgeArcOps.overlaps(arc, boundaries)).toEqual(false)
    })
  })

  describe("clone", () => {
    test("should return clone", () => {
      const center: TPoint = { x: 0, y: 0 }
      const startAngle = Math.PI / 4
      const sweepAngle = (3 * Math.PI) / 4
      const radiusX = 10
      const radiusY = 50
      const phi = 0
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const arc = EdgeArcOps.create(center, startAngle, sweepAngle, radiusX, radiusY, phi, undefined, undefined, style)
      const clone = structuredClone(arc)
      expect(clone).toEqual(arc)
      expect(clone).not.toBe(arc)
    })
  })

  describe("anchors", () => {
    test("arc has no anchors by default, accepts optional startAnchor/endAnchor", () => {
      const arc = EdgeArcOps.create({ x: 0, y: 0 }, 0, Math.PI, 10, 10, 0)
      expect(arc.startAnchor).toBeUndefined()
      arc.endAnchor = { symbolId: "shape-1", normalizedX: 0.1, normalizedY: 0.9 }
      expect(arc.endAnchor.symbolId).toBe("shape-1")
    })
  })

  describe("reprojectArcEndpoint", () => {
    const arc = { center: { x: 0, y: 0 }, radiusX: 10, radiusY: 10, phi: 0, startAngle: 0, sweepAngle: Math.PI }

    test("moving the start endpoint keeps the end angle fixed", () => {
      const oldEndAngle = arc.startAngle + arc.sweepAngle
      const targetPoint = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, Math.PI / 4)
      const result = reprojectArcEndpoint(arc, "start", targetPoint)
      expect(result.startAngle).toBeCloseTo(Math.PI / 4, 2)
      expect(result.startAngle + result.sweepAngle).toBeCloseTo(oldEndAngle, 2)
    })

    test("moving the end endpoint keeps the start angle fixed", () => {
      const targetPoint = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, (3 * Math.PI) / 4)
      const result = reprojectArcEndpoint(arc, "end", targetPoint)
      expect(result.startAngle).toBeCloseTo(arc.startAngle, 2)
      expect(result.startAngle + result.sweepAngle).toBeCloseTo((3 * Math.PI) / 4, 2)
    })

    test("moving the end endpoint wraps around 0/2π boundary (rawSweep < 0 -> +TWO_PI)", () => {
      // Arc from 0 to 2π/3 (sweepAngle = 2π/3, positive)
      const testArc = { center: { x: 0, y: 0 }, radiusX: 10, radiusY: 10, phi: 0, startAngle: 0, sweepAngle: (2 * Math.PI) / 3 }
      // Move end to -π/6 (before start, crosses the 0 boundary)
      const targetAngle = -Math.PI / 6
      const targetPoint = computePointOnEllipse(testArc.center, testArc.radiusX, testArc.radiusY, testArc.phi, targetAngle)
      const result = reprojectArcEndpoint(testArc, "end", targetPoint)
      expect(result.startAngle).toBeCloseTo(0, 2)
      // End angle should be -π/6, which normalizes to 11π/6 in positive range
      const TWO_PI = Math.PI * 2
      const expectedEndAngle = targetAngle < 0 ? targetAngle + TWO_PI : targetAngle
      expect(result.startAngle + result.sweepAngle).toBeCloseTo(expectedEndAngle, 1)
    })

    test("moving start endpoint with negative sweepAngle (clockwise arc) wraps (rawSweep > 0 -> -TWO_PI)", () => {
      // Arc from 3π/2 to π (sweepAngle = -π/2, clockwise/backwards)
      const testArc = { center: { x: 0, y: 0 }, radiusX: 10, radiusY: 10, phi: 0, startAngle: (3 * Math.PI) / 2, sweepAngle: -Math.PI / 2 }
      // Old end angle: 3π/2 + (-π/2) = π
      // Move start to 0, crossing the 0 boundary
      const targetAngle = 0
      const targetPoint = computePointOnEllipse(testArc.center, testArc.radiusX, testArc.radiusY, testArc.phi, targetAngle)
      const result = reprojectArcEndpoint(testArc, "start", targetPoint)
      expect(result.startAngle).toBeCloseTo(0, 2)
      // Old end was at π. With startAngle=0 and original negative sweep,
      // the result should maintain the negative sweep direction: sweepAngle = -π
      // so 0 + (-π) = -π, which equals π modulo the circle (both are on the negative real axis)
      expect(result.sweepAngle).toBeCloseTo(-Math.PI, 1)
      expect(result.startAngle + result.sweepAngle).toBeCloseTo(-Math.PI, 1)
    })
  })
})
