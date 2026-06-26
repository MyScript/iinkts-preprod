import {
  IIStrokeHelper,
  DefaultStyle,
  TStyle,
  TPointer,
  TLegacyStroke,
  convertPartialStrokesToIIStrokes,
  PartialDeep
} from "../../../src/iink"

describe("TStroke / IIStrokeHelper", () =>
{
  describe("create", () =>
  {
    test("should create with custom style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const stroke = IIStrokeHelper.create(style)
      expect(stroke).toBeDefined()
      expect(stroke.creationTime).toBeLessThanOrEqual(Date.now())
      expect(stroke.creationTime).toEqual(stroke.modificationDate)
      expect(stroke.style).toEqual(expect.objectContaining(style))
      expect(stroke.pointerType).toEqual("pen")
      expect(stroke.pointers).toHaveLength(0)
      expect(stroke.selected).toEqual(false)
      expect(stroke.bounds.x).toEqual(0)
      expect(stroke.bounds.y).toEqual(0)
      expect(stroke.bounds.height).toEqual(0)
      expect(stroke.bounds.width).toEqual(0)
    })
    test("should create with default style", () =>
    {
      const stroke = IIStrokeHelper.create()
      expect(stroke.style).toEqual(DefaultStyle)
    })
    test("should create and cast opacity and width to number", () =>
    {
      //@ts-ignore
      const style = { opacity: "1", width: "1" }
      //@ts-ignore
      const stroke = IIStrokeHelper.create(style)
      expect(stroke.style.opacity).toEqual(+style.width)
      expect(stroke.style.width).toEqual(+style.width)
    })
  })

  describe("addPointer", () =>
  {
    const stroke = IIStrokeHelper.create(DefaultStyle)

    test("should add first pointer and update modification date", () =>
    {
      const pointer: TPointer = {
        p: 1,
        t: 1,
        x: 0,
        y: 0
      }
      IIStrokeHelper.addPointer(stroke, pointer)
      expect(stroke.pointers).toHaveLength(1)
      expect(stroke.pointers[0]).toEqual(pointer)
    })

    test("should not add the pointer if it is too close to the previous one", () =>
    {
      const pointer: TPointer = {
        p: 1,
        t: 1,
        x: 1.1,
        y: 1.1
      }
      IIStrokeHelper.addPointer(stroke, pointer)
      expect(stroke.pointers).toHaveLength(1)
    })

    test("should update modification date if pointer added", () =>
    {
      const pointer: TPointer = {
        p: 1,
        t: 1,
        x: 5,
        y: 5
      }
      IIStrokeHelper.addPointer(stroke, pointer)
      expect(stroke.modificationDate).toBeGreaterThan(stroke.creationTime)
    })

    test("should update length if pointer added", () =>
    {
      const pointer: TPointer = {
        p: 1,
        t: 1,
        x: 50,
        y: 50
      }
      IIStrokeHelper.addPointer(stroke, pointer)
      expect(stroke.length).toEqual(Math.sqrt(2 * Math.pow(50, 2)))
    })
  })

  describe("boundingBox", () =>
  {
    test("should get without pointers", () =>
    {
      const stroke = IIStrokeHelper.create(DefaultStyle)
      expect(stroke.bounds.height).toEqual(0)
      expect(stroke.bounds.width).toEqual(0)
      expect(stroke.bounds.x).toEqual(0)
      expect(stroke.bounds.y).toEqual(0)
    })
    test("should get with pointers", () =>
    {
      const stroke = IIStrokeHelper.create(DefaultStyle)
      IIStrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      IIStrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 11, y: 11 })
      expect(stroke.bounds.height).toEqual(10)
      expect(stroke.bounds.width).toEqual(10)
      expect(stroke.bounds.x).toEqual(1)
      expect(stroke.bounds.y).toEqual(1)
    })
  })

  describe("formatToSend", () =>
  {
    test("should return array of x, y, t, and p", () =>
    {
      const stroke = IIStrokeHelper.create(DefaultStyle)
      IIStrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      IIStrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 11, y: 11 })

      const jsonToSend = IIStrokeHelper.formatToSend(stroke)
      expect(jsonToSend).toEqual({
        id: stroke.id,
        pointerType: stroke.pointerType,
        x: stroke.pointers.map(s => s.x),
        y: stroke.pointers.map(s => s.y),
        t: stroke.pointers.map(s => s.t),
        p: stroke.pointers.map(s => s.p)
      })
    })
  })

  describe("clone", () =>
  {
    test("should return clone", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const stroke = IIStrokeHelper.create(style)
      IIStrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      IIStrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 11, y: 11 })

      const clone = structuredClone(stroke)
      expect(clone).toEqual(stroke)
      expect(clone).not.toBe(stroke)
    })
    test("should not update origin pointers", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const stroke = IIStrokeHelper.create(style)
      IIStrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      IIStrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 11, y: 11 })

      const clone = structuredClone(stroke)
      clone.pointers.forEach(p => {
        p.x += 10
        p.y += 10
      })
      expect(stroke.pointers[0]).toEqual({ p: 1, t: 1, x: 1, y: 1 })
      expect(clone.pointers[0]).toEqual({ p: 1, t: 1, x: 11, y: 11 })
    })
  })

  describe("convertPartialStrokesToIIStrokes", () =>
  {
    test("should convert", () => {
      const pStrokes: PartialDeep<TLegacyStroke>[] = [
        {
          pointers: [
            { x: 254, y: 37, t: 1, p: 1 },
            { x: 253, y: 42, t: 2, p: 0.7 },
          ]
        },
        {
          pointers: [
            { x: 222, y: 386, t: 3, p: 0.5 },
            { x: 226, y: 385, t: 4, p: 0.8 },
          ],
          style: { width: 3, color: "#1A8CFF" }
        }
      ]
      const strokes = convertPartialStrokesToIIStrokes(pStrokes)
      expect(strokes).toHaveLength(2)
      expect(strokes[0].pointers[0]).toEqual(pStrokes[0]?.pointers?.[0])
      expect(strokes[0].style).toEqual(DefaultStyle)
      expect(strokes[1].pointers[1]).toEqual(pStrokes[1]?.pointers?.[1])
      expect(strokes[1].style).toEqual(expect.objectContaining(pStrokes[1]?.style))
    })
    test("should throw error if no pointers", () => {
      const pStrokes: PartialDeep<TLegacyStroke>[] = [
        {
        },
      ]
      expect(() => convertPartialStrokesToIIStrokes(pStrokes)).toThrow("stroke 1 has not pointers")
    })
    test("should throw error if pointers have empty object", () => {
      const pStrokes: PartialDeep<TLegacyStroke>[] = [
        {
          pointers: [undefined]
        },
      ]
      expect(() => convertPartialStrokesToIIStrokes(pStrokes)).toThrow("stroke 1 has no pointer at 0")
    })
    test("should throw an error if an x ​​is missing on pointers ", () => {
      const pStrokes: PartialDeep<TLegacyStroke>[] = [
        {
          pointers: [
            { x: 254, y: 37, t: 1, p: 0.5 },
            { y: 42, t: 2, p: 0.7 },
          ]
        },
      ]
      expect(() => convertPartialStrokesToIIStrokes(pStrokes)).toThrow("stroke 1 has no x at pointer at 1")
    })
    test("should throw an error if an y ​​is missing on pointers ", () => {
      const pStrokes: PartialDeep<TLegacyStroke>[] = [
        {
          pointers: [
            { x: 254, y: 37, t: 1, p: 0.5 },
            { x: 254, t: 2, p: 0.7 },
          ]
        },
      ]
      expect(() => convertPartialStrokesToIIStrokes(pStrokes)).toThrow("stroke 1 has no y at pointer at 1")
    })
  })
})
