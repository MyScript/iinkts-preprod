import { StrokeOps, DefaultStyle, TStyle, TPointer, OBBOps } from "@/iink"

describe("TStroke / StrokeOps", () => {
  describe("create", () => {
    test("should create with custom style", () => {
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const stroke = StrokeOps.create(style)
      expect(stroke).toBeDefined()
      expect(stroke.creationTime).toBeLessThanOrEqual(Date.now())
      expect(stroke.creationTime).toEqual(stroke.modificationDate)
      expect(stroke.style).toEqual(expect.objectContaining(style))
      expect(stroke.pointerType).toEqual("pen")
      expect(stroke.pointers).toHaveLength(0)
      expect(OBBOps.toBox(stroke.bounds).x).toEqual(0)
      expect(OBBOps.toBox(stroke.bounds).y).toEqual(0)
      expect(stroke.bounds.height).toEqual(0)
      expect(stroke.bounds.width).toEqual(0)
    })
    test("should create with default style", () => {
      const stroke = StrokeOps.create()
      expect(stroke.style).toEqual(DefaultStyle)
    })
    test("should create and cast opacity and width to number", () => {
      //@ts-ignore
      const style = { opacity: "1", width: "1" }
      //@ts-ignore
      const stroke = StrokeOps.create(style)
      expect(stroke.style.opacity).toEqual(+style.width)
      expect(stroke.style.width).toEqual(+style.width)
    })
  })

  describe("addPointer", () => {
    const stroke = StrokeOps.create(DefaultStyle)

    test("should add first pointer and update modification date", () => {
      const pointer: TPointer = {
        p: 1,
        t: 1,
        x: 0,
        y: 0,
      }
      StrokeOps.addPointer(stroke, pointer)
      expect(stroke.pointers).toHaveLength(1)
      expect(stroke.pointers[0]).toEqual(pointer)
    })

    test("should not add the pointer if it is too close to the previous one", () => {
      const pointer: TPointer = {
        p: 1,
        t: 1,
        x: 1.1,
        y: 1.1,
      }
      StrokeOps.addPointer(stroke, pointer)
      expect(stroke.pointers).toHaveLength(1)
    })

    test("should update modification date if pointer added", () => {
      const pointer: TPointer = {
        p: 1,
        t: 1,
        x: 5,
        y: 5,
      }
      StrokeOps.addPointer(stroke, pointer)
      expect(stroke.modificationDate).toBeGreaterThan(stroke.creationTime)
    })

    test("should update length if pointer added", () => {
      const pointer: TPointer = {
        p: 1,
        t: 1,
        x: 50,
        y: 50,
      }
      StrokeOps.addPointer(stroke, pointer)
      expect(stroke.length).toEqual(Math.sqrt(2 * Math.pow(50, 2)))
    })
  })

  describe("boundingBox", () => {
    test("should get without pointers", () => {
      const stroke = StrokeOps.create(DefaultStyle)
      expect(stroke.bounds.height).toEqual(0)
      expect(stroke.bounds.width).toEqual(0)
      expect(OBBOps.toBox(stroke.bounds).x).toEqual(0)
      expect(OBBOps.toBox(stroke.bounds).y).toEqual(0)
    })
    test("should get with pointers", () => {
      const stroke = StrokeOps.create(DefaultStyle)
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 11, y: 11 })
      expect(stroke.bounds.height).toEqual(10)
      expect(stroke.bounds.width).toEqual(10)
      expect(OBBOps.toBox(stroke.bounds).x).toEqual(1)
      expect(OBBOps.toBox(stroke.bounds).y).toEqual(1)
    })
  })

  describe("formatToSend", () => {
    test("should return array of x, y, t, and p", () => {
      const stroke = StrokeOps.create(DefaultStyle)
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 11, y: 11 })

      const jsonToSend = StrokeOps.formatToSend(stroke)
      expect(jsonToSend).toEqual({
        id: stroke.id,
        pointerType: stroke.pointerType,
        x: stroke.pointers.map((s) => s.x),
        y: stroke.pointers.map((s) => s.y),
        t: stroke.pointers.map((s) => s.t),
        p: stroke.pointers.map((s) => s.p),
      })
    })
  })

  describe("clone", () => {
    test("should return clone", () => {
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const stroke = StrokeOps.create(style)
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 11, y: 11 })

      const clone = structuredClone(stroke)
      expect(clone).toEqual(stroke)
      expect(clone).not.toBe(stroke)
    })
    test("should not update origin pointers", () => {
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const stroke = StrokeOps.create(style)
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 11, y: 11 })

      const clone = structuredClone(stroke)
      clone.pointers.forEach((p) => {
        p.x += 10
        p.y += 10
      })
      expect(stroke.pointers[0]).toEqual({ p: 1, t: 1, x: 1, y: 1 })
      expect(clone.pointers[0]).toEqual({ p: 1, t: 1, x: 11, y: 11 })
    })
  })
})
