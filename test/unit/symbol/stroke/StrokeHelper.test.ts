import {
  StrokeHelper,
  DefaultStyle,
  TStyle,
  TPointer,
} from "../../../../src/iink"

describe("StrokeHelper", () =>
{
  describe("create", () =>
  {
    test("should create with default style", () =>
    {
      const stroke = StrokeHelper.create()
      expect(stroke.style).toEqual(DefaultStyle)
      expect(stroke.pointerType).toEqual("pen")
      expect(stroke.pointers).toHaveLength(0)
      expect(stroke.selected).toEqual(false)
      expect(stroke.deleting).toEqual(false)
      expect(stroke.isClosed).toEqual(false)
      expect(stroke.length).toEqual(0)
      expect(stroke.bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 })
    })
    test("should create with custom style", () =>
    {
      const style: TStyle = { color: "blue", width: 20 }
      const stroke = StrokeHelper.create(style)
      expect(stroke.style).toEqual(expect.objectContaining(style))
    })
    test("should cast opacity and width to number", () =>
    {
      //@ts-ignore
      const style = { opacity: "1", width: "1" }
      //@ts-ignore
      const stroke = StrokeHelper.create(style)
      expect(stroke.style.opacity).toEqual(1)
      expect(stroke.style.width).toEqual(1)
    })
    test("should create with custom pointerType", () =>
    {
      const stroke = StrokeHelper.create(undefined, "touch")
      expect(stroke.pointerType).toEqual("touch")
    })
    test("should generate unique ids", () =>
    {
      const s1 = StrokeHelper.create()
      const s2 = StrokeHelper.create()
      expect(s1.id).not.toEqual(s2.id)
    })
    test("vertices should be same reference as pointers", () =>
    {
      const stroke = StrokeHelper.create()
      expect(stroke.vertices).toBe(stroke.pointers)
    })
  })

  describe("addPointer", () =>
  {
    test("should add first pointer", () =>
    {
      const stroke = StrokeHelper.create(DefaultStyle)
      const pointer: TPointer = { p: 1, t: 1, x: 0, y: 0 }
      StrokeHelper.addPointer(stroke, pointer)
      expect(stroke.pointers).toHaveLength(1)
    })
    test("should not add pointer too close to previous", () =>
    {
      const stroke = StrokeHelper.create(DefaultStyle)
      StrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 0, y: 0 })
      StrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 1.1, y: 1.1 })
      expect(stroke.pointers).toHaveLength(1)
    })
    test("should update modification date", () =>
    {
      const stroke = StrokeHelper.create(DefaultStyle)
      const before = stroke.creationTime
      StrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 5, y: 5 })
      expect(stroke.modificationDate).toBeGreaterThanOrEqual(before)
    })
    test("should update length", () =>
    {
      const stroke = StrokeHelper.create(DefaultStyle)
      StrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 0, y: 0 })
      StrokeHelper.addPointer(stroke, { p: 1, t: 2, x: 50, y: 50 })
      expect(stroke.length).toBeCloseTo(Math.sqrt(2 * Math.pow(50, 2)))
    })
    test("should update bounds", () =>
    {
      const stroke = StrokeHelper.create(DefaultStyle)
      StrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      StrokeHelper.addPointer(stroke, { p: 1, t: 2, x: 11, y: 11 })
      expect(stroke.bounds.x).toEqual(1)
      expect(stroke.bounds.y).toEqual(1)
      expect(stroke.bounds.width).toEqual(10)
      expect(stroke.bounds.height).toEqual(10)
    })
  })

  describe("updateBounds", () =>
  {
    test("should compute bounds from pointers", () =>
    {
      const stroke = StrokeHelper.create()
      stroke.pointers.push({ p: 1, t: 1, x: 5, y: 10 })
      stroke.pointers.push({ p: 1, t: 2, x: 15, y: 20 })
      StrokeHelper.updateBounds(stroke)
      expect(stroke.bounds).toEqual({ x: 5, y: 10, width: 10, height: 10 })
    })
    test("should compute edges from pointers", () =>
    {
      const stroke = StrokeHelper.create()
      stroke.pointers.push({ p: 1, t: 1, x: 0, y: 0 })
      stroke.pointers.push({ p: 1, t: 2, x: 10, y: 10 })
      stroke.pointers.push({ p: 1, t: 3, x: 20, y: 20 })
      StrokeHelper.updateBounds(stroke)
      expect(stroke.edges).toHaveLength(2)
    })
  })

  describe("formatToSend", () =>
  {
    test("should return arrays of x, y, t, p", () =>
    {
      const stroke = StrokeHelper.create(DefaultStyle)
      StrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      StrokeHelper.addPointer(stroke, { p: 1, t: 2, x: 11, y: 11 })
      const result = StrokeHelper.formatToSend(stroke)
      expect(result.id).toEqual(stroke.id)
      expect(result.pointerType).toEqual(stroke.pointerType)
      expect(result.x).toEqual(stroke.pointers.map(p => p.x))
      expect(result.y).toEqual(stroke.pointers.map(p => p.y))
      expect(result.t).toEqual(stroke.pointers.map(p => p.t))
      expect(result.p).toEqual(stroke.pointers.map(p => p.p))
    })
  })

  describe("split", () =>
  {
    test("should split into before and after at index", () =>
    {
      const stroke = StrokeHelper.create(DefaultStyle)
      StrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 0, y: 0 })
      StrokeHelper.addPointer(stroke, { p: 1, t: 2, x: 10, y: 10 })
      StrokeHelper.addPointer(stroke, { p: 1, t: 3, x: 20, y: 20 })
      StrokeHelper.addPointer(stroke, { p: 1, t: 4, x: 30, y: 30 })
      const { before, after } = StrokeHelper.split(stroke, 2)
      expect(before.pointers).toHaveLength(2)
      expect(after.pointers).toHaveLength(2)
    })
    test("should preserve style", () =>
    {
      const style: TStyle = { color: "red", width: 5 }
      const stroke = StrokeHelper.create(style)
      StrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 0, y: 0 })
      StrokeHelper.addPointer(stroke, { p: 1, t: 2, x: 10, y: 10 })
      StrokeHelper.addPointer(stroke, { p: 1, t: 3, x: 20, y: 20 })
      const { before, after } = StrokeHelper.split(stroke, 1)
      expect(before.style).toEqual(expect.objectContaining(style))
      expect(after.style).toEqual(expect.objectContaining(style))
    })
  })

  describe("substract", () =>
  {
    test("should return before stroke when partStroke has no length", () =>
    {
      const stroke = StrokeHelper.create(DefaultStyle)
      StrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 0, y: 0 })
      const partStroke = StrokeHelper.create(DefaultStyle)
      const result = StrokeHelper.substract(stroke, partStroke)
      expect(result.before).toBe(stroke)
      expect(result.after).toBeUndefined()
    })
    test("should return before and after strokes", () =>
    {
      const stroke = StrokeHelper.create(DefaultStyle)
      for (let i = 0; i < 10; i++) {
        StrokeHelper.addPointer(stroke, { p: 1, t: i, x: i * 10, y: i * 10 })
      }
      const partStroke = StrokeHelper.create(DefaultStyle)
      StrokeHelper.addPointer(partStroke, { p: 1, t: 1, x: 30, y: 30 })
      StrokeHelper.addPointer(partStroke, { p: 1, t: 2, x: 50, y: 50 })
      const result = StrokeHelper.substract(stroke, partStroke)
      expect(result.before !== undefined || result.after !== undefined).toBe(true)
    })
  })

  describe("overlaps", () =>
  {
    test("should return true when pointer is inside box", () =>
    {
      const stroke = StrokeHelper.create(DefaultStyle)
      StrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 5, y: 5 })
      expect(StrokeHelper.overlaps(stroke, { x: 0, y: 0, width: 10, height: 10 })).toBe(true)
    })
    test("should return false when no pointer is inside box", () =>
    {
      const stroke = StrokeHelper.create(DefaultStyle)
      StrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 50, y: 50 })
      expect(StrokeHelper.overlaps(stroke, { x: 0, y: 0, width: 10, height: 10 })).toBe(false)
    })
  })

  describe("createFromPartial", () =>
  {
    test("should create from partial data", () =>
    {
      const partial = {
        pointers: [
          { x: 10, y: 20, t: 1, p: 0.5 },
          { x: 30, y: 40, t: 2, p: 0.8 },
        ]
      }
      const stroke = StrokeHelper.createFromPartial(partial)
      expect(stroke.pointers[0]).toEqual(expect.objectContaining({ x: 10, y: 20 }))
    })
    test("should preserve id if provided", () =>
    {
      const partial = {
        id: "test-id-123",
        pointers: [{ x: 10, y: 20, t: 1, p: 0.5 }, { x: 30, y: 40, t: 2, p: 0.8 }]
      }
      const stroke = StrokeHelper.createFromPartial(partial)
      expect(stroke.id).toEqual("test-id-123")
    })
    test("should throw if no pointers", () =>
    {
      expect(() => StrokeHelper.createFromPartial({})).toThrow("not pointers")
    })
    test("should throw if pointer missing x", () =>
    {
      expect(() => StrokeHelper.createFromPartial({
        pointers: [{ x: 1, y: 1, t: 1, p: 1 }, { y: 2, t: 2, p: 1 }]
      })).toThrow("no x at pointer at 1")
    })
    test("should throw if pointer missing y", () =>
    {
      expect(() => StrokeHelper.createFromPartial({
        pointers: [{ x: 1, y: 1, t: 1, p: 1 }, { x: 2, t: 2, p: 1 }]
      })).toThrow("no y at pointer at 1")
    })
    test("should throw if pointer is undefined", () =>
    {
      expect(() => StrokeHelper.createFromPartial({
        pointers: [undefined]
      })).toThrow("no pointer at 0")
    })
    test("should set isSolverOutput from partial", () =>
    {
      const stroke = StrokeHelper.createFromPartial({
        isSolverOutput: true,
        pointers: [{ x: 10, y: 20, t: 1, p: 0.5 }, { x: 30, y: 40, t: 2, p: 0.8 }]
      })
      expect(stroke.isSolverOutput).toBe(true)
    })
  })
})
