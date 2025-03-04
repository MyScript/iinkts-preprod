import {
  IIStroke,
  DefaultStyle,
  TStyle,
  TPointer,
  TStroke,
  convertPartialStrokesToOIStrokes,
  PartialDeep
} from "../../../src/iink"

describe("IIStroke.ts", () =>
{
  describe("instanciate", () =>
  {
    test("should create with custom style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const stroke = new IIStroke(style)
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
      const stroke = new IIStroke()
      expect(stroke.style).toEqual(DefaultStyle)
    })
    test("should create and cast opacity and width to number", () =>
    {
      //@ts-ignore
      const style = { opacity: "1", width: "1" }
      //@ts-ignore
      const stroke = new IIStroke(style)
      expect(stroke.style.opacity).toEqual(+style.width)
      expect(stroke.style.width).toEqual(+style.width)
    })
  })

  describe("addPointer", () =>
  {
    const stroke = new IIStroke(DefaultStyle)

    test("should add first pointer and update modification date", () =>
    {
      const pointer: TPointer = {
        p: 1,
        t: 1,
        x: 0,
        y: 0
      }
      stroke.addPointer(pointer)
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
      stroke.addPointer(pointer)
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
      stroke.addPointer(pointer)
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
      stroke.addPointer(pointer)
      expect(stroke.length).toEqual(Math.sqrt(2 * Math.pow(50, 2)))
    })
  })

  describe("boundingBox", () =>
  {
    test("should get without pointers", () =>
    {
      const stroke = new IIStroke(DefaultStyle)
      expect(stroke.bounds.height).toEqual(0)
      expect(stroke.bounds.width).toEqual(0)
      expect(stroke.bounds.x).toEqual(0)
      expect(stroke.bounds.y).toEqual(0)
    })
    test("should get with pointers", () =>
    {
      const stroke = new IIStroke(DefaultStyle)
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
      stroke.addPointer({ p: 1, t: 1, x: 11, y: 11 })
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
      const stroke = new IIStroke(DefaultStyle)
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
      stroke.addPointer({ p: 1, t: 1, x: 11, y: 11 })

      const jsonToSend = stroke.formatToSend()
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
      const stroke = new IIStroke(style)
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
      stroke.addPointer({ p: 1, t: 1, x: 11, y: 11 })

      const clone = stroke.clone()
      expect(clone).toEqual(stroke)
      expect(clone).not.toBe(stroke)
    })
    test("should not update origin pointers", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const stroke = new IIStroke(style)
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
      stroke.addPointer({ p: 1, t: 1, x: 11, y: 11 })

      const clone = stroke.clone()
      clone.pointers.forEach(p => {
        p.x += 10
        p.y += 10
      })
      expect(stroke.pointers[0]).toEqual({ p: 1, t: 1, x: 1, y: 1 })
      expect(clone.pointers[0]).toEqual({ p: 1, t: 1, x: 11, y: 11 })
    })
  })

  describe("convertPartialStrokesToOIStrokes", () =>
  {
    test("should convert", () => {
      const pStrokes: PartialDeep<TStroke>[] = [
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
      const strokes = convertPartialStrokesToOIStrokes(pStrokes)
      expect(strokes).toHaveLength(2)
      expect(strokes[0].pointers[0]).toEqual(pStrokes[0]?.pointers?.[0])
      expect(strokes[0].style).toEqual(DefaultStyle)
      expect(strokes[1].pointers[1]).toEqual(pStrokes[1]?.pointers?.[1])
      expect(strokes[1].style).toEqual(expect.objectContaining(pStrokes[1]?.style))
    })
    test("should throw error if no pointers", () => {
      const pStrokes: PartialDeep<TStroke>[] = [
        {
        },
      ]
      expect(() => convertPartialStrokesToOIStrokes(pStrokes)).toThrow("stroke 1 has not pointers")
    })
    test("should throw error if pointers have empty object", () => {
      const pStrokes: PartialDeep<TStroke>[] = [
        {
          pointers: [undefined]
        },
      ]
      expect(() => convertPartialStrokesToOIStrokes(pStrokes)).toThrow("stroke 1 has no pointer at 0")
    })
    test("should throw an error if an x ​​is missing on pointers ", () => {
      const pStrokes: PartialDeep<TStroke>[] = [
        {
          pointers: [
            { x: 254, y: 37, t: 1, p: 0.5 },
            { y: 42, t: 2, p: 0.7 },
          ]
        },
      ]
      expect(() => convertPartialStrokesToOIStrokes(pStrokes)).toThrow("stroke 1 has no x at pointer at 1")
    })
    test("should throw an error if an y ​​is missing on pointers ", () => {
      const pStrokes: PartialDeep<TStroke>[] = [
        {
          pointers: [
            { x: 254, y: 37, t: 1, p: 0.5 },
            { x: 254, t: 2, p: 0.7 },
          ]
        },
      ]
      expect(() => convertPartialStrokesToOIStrokes(pStrokes)).toThrow("stroke 1 has no y at pointer at 1")
    })
  })
})
