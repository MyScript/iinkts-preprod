import { StrokeOps, toWireStroke, type TRecognitionStroke, type TWireStroke } from "@/iink"

describe("StrokeSerializer.ts", () => {
  describe("toWireStroke", () => {
    // The expected payload is written out in full rather than derived from the input. Deriving it
    // would make the test agree with whatever the function does, which is the one thing it must not
    // do: this shape is the wire contract, and the server is what parses it.
    test("should produce exactly the payload the recognition API expects", () => {
      const stroke: TRecognitionStroke = {
        id: "stroke-1",
        pointerType: "pen",
        pointers: [
          { x: 1, y: 2, t: 1000, p: 0.5 },
          { x: 3, y: 4, t: 1008, p: 0.6 },
          { x: 5, y: 6, t: 1016, p: 0.7 },
        ],
      }

      expect(toWireStroke(stroke)).toEqual({
        id: "stroke-1",
        pointerType: "pen",
        p: [0.5, 0.6, 0.7],
        t: [1000, 1008, 1016],
        x: [1, 3, 5],
        y: [2, 4, 6],
      })
    })

    test("should keep the four arrays index-aligned and in pointer order", () => {
      const stroke: TRecognitionStroke = {
        id: "stroke-2",
        pointerType: "mouse",
        pointers: [
          { x: 10, y: 20, t: 5, p: 1 },
          { x: 30, y: 40, t: 6, p: 1 },
        ],
      }

      const wire = toWireStroke(stroke)
      // Every pointer here is timed and pressured, so both columns must be emitted.
      expect(wire.t).toBeDefined()
      expect(wire.p).toBeDefined()
      const t = wire.t as number[]
      const pressure = wire.p as number[]
      // Order carries meaning: the server reconstructs each pointer from the same index across the
      // four arrays, so a stable sort or a reversal anywhere would be silent corruption.
      wire.x.forEach((_, i) => {
        expect({ x: wire.x[i], y: wire.y[i], t: t[i], p: pressure[i] }).toEqual(stroke.pointers[i])
      })
    })

    test("should omit t when a pointer is not timed, and keep the geometry", () => {
      const wire = toWireStroke({
        id: "stroke-4",
        pointerType: "pen",
        pointers: [
          { x: 1, y: 2, p: 0.4 },
          { x: 3, y: 4, p: 0.5 },
        ],
      })

      expect(wire).toEqual({ id: "stroke-4", pointerType: "pen", x: [1, 3], y: [2, 4], p: [0.4, 0.5] })
      expect("t" in wire).toBe(false)
    })

    test("should omit p when pressure is absent", () => {
      const wire = toWireStroke({
        id: "stroke-5",
        pointerType: "mouse",
        pointers: [
          { x: 1, y: 2, t: 10 },
          { x: 3, y: 4, t: 20 },
        ],
      })

      expect(wire).toEqual({ id: "stroke-5", pointerType: "mouse", x: [1, 3], y: [2, 4], t: [10, 20] })
      expect("p" in wire).toBe(false)
    })

    test("should send geometry alone when neither t nor p is supplied", () => {
      const wire = toWireStroke({
        id: "stroke-6",
        pointerType: "pen",
        pointers: [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
        ],
      })

      expect(wire).toEqual({ id: "stroke-6", pointerType: "pen", x: [1, 3], y: [2, 4] })
    })

    test("should drop t entirely when only some pointers are timed", () => {
      // Half a timing column is worse than none: the server pairs each pointer with the same index
      // across the arrays, so a short `t` would attach the wrong timestamps to the wrong points.
      const wire = toWireStroke({
        id: "stroke-7",
        pointerType: "pen",
        pointers: [
          { x: 1, y: 2, t: 10 },
          { x: 3, y: 4 },
          { x: 5, y: 6, t: 30 },
        ],
      })

      expect(wire).toEqual({ id: "stroke-7", pointerType: "pen", x: [1, 3, 5], y: [2, 4, 6] })
      expect("t" in wire).toBe(false)
    })

    test("should return empty arrays for a stroke with no pointers", () => {
      expect(toWireStroke({ id: "stroke-3", pointerType: "pen", pointers: [] })).toEqual({
        id: "stroke-3",
        pointerType: "pen",
        x: [],
        y: [],
      })
    })

    test("should accept a TStroke from the symbol layer without conversion", () => {
      // The point of declaring `TRecognitionStroke` inside the client rather than importing the
      // symbol layer's type: structural typing makes a real `TStroke` a valid argument, so neither
      // package needs to know about the other.
      const stroke = StrokeOps.create(undefined, "pen")
      // `addPointer` overwrites the supplied pressure with its own computed value — 1 for the first
      // pointer, whose travelled distance is 0 — so the expected `p` below is the library's, not the
      // one passed in here.
      StrokeOps.addPointer(stroke, { x: 7, y: 8, t: 42, p: 0.25 })

      const wire: TWireStroke = toWireStroke(stroke)
      expect(wire).toEqual({
        id: stroke.id,
        pointerType: "pen",
        p: [1],
        t: [42],
        x: [7],
        y: [8],
      })
    })
  })
})
