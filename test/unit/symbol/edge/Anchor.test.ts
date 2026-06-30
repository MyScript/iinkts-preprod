import { describe, test, expect } from "@jest/globals"
import { resolveAnchorPoint, computeNormalizedAnchor } from "@/iink"

const bounds = { x: 10, y: 20, width: 100, height: 80 }

describe("resolveAnchorPoint", () =>
{
  test("normalizedX=0, normalizedY=0 → top-left corner", () =>
  {
    const anchor = { symbolId: "s1", normalizedX: 0, normalizedY: 0 }
    expect(resolveAnchorPoint(anchor, bounds)).toEqual({ x: 10, y: 20 })
  })

  test("normalizedX=1, normalizedY=1 → bottom-right corner", () =>
  {
    const anchor = { symbolId: "s1", normalizedX: 1, normalizedY: 1 }
    expect(resolveAnchorPoint(anchor, bounds)).toEqual({ x: 110, y: 100 })
  })

  test("normalizedX=0.5, normalizedY=0.5 → center", () =>
  {
    const anchor = { symbolId: "s1", normalizedX: 0.5, normalizedY: 0.5 }
    expect(resolveAnchorPoint(anchor, bounds)).toEqual({ x: 60, y: 60 })
  })

  test("arbitrary values", () =>
  {
    const anchor = { symbolId: "s1", normalizedX: 0.25, normalizedY: 0.75 }
    expect(resolveAnchorPoint(anchor, bounds)).toEqual({ x: 35, y: 80 })
  })
})

describe("computeNormalizedAnchor", () =>
{
  test("point at top-left → {0, 0}", () =>
  {
    const point = { x: 10, y: 20 }
    expect(computeNormalizedAnchor(point, bounds)).toEqual({ normalizedX: 0, normalizedY: 0 })
  })

  test("point at bottom-right → {1, 1}", () =>
  {
    const point = { x: 110, y: 100 }
    expect(computeNormalizedAnchor(point, bounds)).toEqual({ normalizedX: 1, normalizedY: 1 })
  })

  test("point at center → {0.5, 0.5}", () =>
  {
    const point = { x: 60, y: 60 }
    expect(computeNormalizedAnchor(point, bounds)).toEqual({ normalizedX: 0.5, normalizedY: 0.5 })
  })

  test("point outside left → normalizedX clamped to 0", () =>
  {
    const point = { x: -50, y: 20 }
    const result = computeNormalizedAnchor(point, bounds)
    expect(result.normalizedX).toBe(0)
  })

  test("point outside right → normalizedX clamped to 1", () =>
  {
    const point = { x: 200, y: 20 }
    const result = computeNormalizedAnchor(point, bounds)
    expect(result.normalizedX).toBe(1)
  })

  test("point outside top → normalizedY clamped to 0", () =>
  {
    const point = { x: 60, y: -10 }
    const result = computeNormalizedAnchor(point, bounds)
    expect(result.normalizedY).toBe(0)
  })

  test("point outside bottom → normalizedY clamped to 1", () =>
  {
    const point = { x: 60, y: 200 }
    const result = computeNormalizedAnchor(point, bounds)
    expect(result.normalizedY).toBe(1)
  })

  test("zero-width bounds → divides by 1, no division by zero", () =>
  {
    const zeroBounds = { x: 10, y: 20, width: 0, height: 0 }
    const point = { x: 10, y: 20 }
    const result = computeNormalizedAnchor(point, zeroBounds)
    expect(result.normalizedX).toBe(0)
    expect(result.normalizedY).toBe(0)
  })
})
