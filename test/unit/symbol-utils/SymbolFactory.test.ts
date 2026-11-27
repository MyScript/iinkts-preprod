import {
  createSymbolFromPartial,
  createSymbolsFromPartial,
  EdgeKind,
  registerBuiltinSymbolUtils,
  ShapeKind,
  symbolRegistry,
  SymbolType,
  type TPartialDeep,
  type TSymbol,
} from "@/iink"

// The factory is fed deserialized JSON: these partials are plain data, some of them invalid on purpose
type TJSONPartial = Record<string, unknown>
const fromJSON = (partial: TJSONPartial) => partial as TPartialDeep<TSymbol>

// The factory asks the registry which util owns a type, so the built-ins have to be registered
// first. Before IIC-2001 this file passed without registering anything, because the factory carried
// a `switch` with a branch per built-in type and only consulted the registry for unknown ones.
beforeAll(() => {
  registerBuiltinSymbolUtils()
})

describe("createSymbolFromPartial", () => {
  it("should build stroke symbol", () => {
    const partial: TJSONPartial = {
      type: SymbolType.Stroke,
      id: "stroke-1",
      pointers: [{ t: 0, p: 1, x: 0, y: 0 }],
      style: {},
    }
    const symbol = createSymbolFromPartial(fromJSON(partial))
    expect(symbol.type).toBe(SymbolType.Stroke)
    expect(symbol.id).toBe("stroke-1")
  })

  it("should build text symbol", () => {
    const partial: TJSONPartial = {
      type: SymbolType.Text,
      id: "text-1",
      chars: [{ label: "A", fontSize: 12, fontWeight: "normal" }],
      point: { x: 0, y: 0 },
      bounds: { x: 0, y: 0, width: 10, height: 10 },
    }
    const symbol = createSymbolFromPartial(fromJSON(partial))
    expect(symbol.type).toBe(SymbolType.Text)
    expect(symbol.id).toBe("text-1")
  })

  it("should build math symbol", () => {
    const partial: TJSONPartial = {
      type: SymbolType.Math,
      id: "math-1",
      elements: [
        {
          id: "e1",
          label: "1",
          fontSize: 12,
          fontWeight: "normal",
          fontFamily: "Arial",
          color: "#000",
          bounds: { x: 0, y: 0, width: 10, height: 10 },
        },
      ],
      point: { x: 0, y: 0 },
      bounds: { x: 0, y: 0, width: 10, height: 10 },
    }
    const symbol = createSymbolFromPartial(fromJSON(partial))
    expect(symbol.type).toBe(SymbolType.Math)
    expect(symbol.id).toBe("math-1")
  })

  // The three shape kinds and the three edge kinds used to be covered through
  // `ShapeUtil.createShapeFromPartial` and `EdgeUtil.createEdgeFromPartial`. Those two were pure
  // dispatchers duplicating `ShapeUtil.create` / `EdgeUtil.create`, and `SymbolFactory` was their
  // only caller, so they are gone. The coverage stays, now exercising the path production uses.
  describe("shape kinds", () => {
    it("should build a circle", () => {
      const partial: TJSONPartial = {
        type: SymbolType.Shape,
        kind: ShapeKind.Circle,
        center: { x: 50, y: 50 },
        radius: 25,
      }
      const symbol = createSymbolFromPartial(fromJSON(partial))
      expect(symbol.type).toBe(SymbolType.Shape)
      expect(symbol).toHaveProperty("kind", ShapeKind.Circle)
    })

    it("should build an ellipse", () => {
      const partial: TJSONPartial = {
        type: SymbolType.Shape,
        kind: ShapeKind.Ellipse,
        center: { x: 50, y: 50 },
        radiusX: 30,
        radiusY: 20,
      }
      expect(createSymbolFromPartial(fromJSON(partial))).toHaveProperty("kind", ShapeKind.Ellipse)
    })

    it("should build a polygon", () => {
      const partial: TJSONPartial = {
        type: SymbolType.Shape,
        kind: ShapeKind.Polygon,
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
        ],
      }
      expect(createSymbolFromPartial(fromJSON(partial))).toHaveProperty("kind", ShapeKind.Polygon)
    })

    it("should throw for an unknown shape kind", () => {
      const partial: TJSONPartial = { type: SymbolType.Shape, kind: "Unknown" }
      expect(() => createSymbolFromPartial(fromJSON(partial))).toThrow("Unable to create shape")
    })
  })

  describe("edge kinds", () => {
    it("should build an arc", () => {
      const partial: TJSONPartial = {
        type: SymbolType.Edge,
        kind: EdgeKind.Arc,
        center: { x: 50, y: 50 },
        radiusX: 30,
        radiusY: 20,
        startAngle: 0,
        sweepAngle: Math.PI,
        phi: 0,
      }
      expect(createSymbolFromPartial(fromJSON(partial))).toHaveProperty("kind", EdgeKind.Arc)
    })

    it("should build a line", () => {
      const partial: TJSONPartial = {
        type: SymbolType.Edge,
        kind: EdgeKind.Line,
        start: { x: 0, y: 0 },
        end: { x: 10, y: 10 },
      }
      expect(createSymbolFromPartial(fromJSON(partial))).toHaveProperty("kind", EdgeKind.Line)
    })

    it("should build a polyline", () => {
      const partial: TJSONPartial = {
        type: SymbolType.Edge,
        kind: EdgeKind.PolyEdge,
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 20, y: 0 },
        ],
      }
      expect(createSymbolFromPartial(fromJSON(partial))).toHaveProperty("kind", EdgeKind.PolyEdge)
    })

    it("should throw for an unknown edge kind", () => {
      const partial: TJSONPartial = { type: SymbolType.Edge, kind: "Unknown" }
      expect(() => createSymbolFromPartial(fromJSON(partial))).toThrow("Unable to create edge")
    })
  })

  describe("when no util owns the type", () => {
    it("should name the type it could not resolve", () => {
      expect(() => createSymbolFromPartial(fromJSON({ type: "sticky-note" }))).toThrow(
        /no util is registered for type "sticky-note"/
      )
    })

    it("should list what is registered, so a missing registration is distinguishable from a typo", () => {
      // The whole point of the message: "you spelled it wrong" and "registerBuiltinSymbolUtils never
      // ran" produce the same failure otherwise, and the second is the one that bites at startup.
      let message = ""
      try {
        createSymbolFromPartial(fromJSON({ type: "sticky-note" }))
      } catch (error) {
        message = (error as Error).message
      }
      symbolRegistry.registeredTypes().forEach((type) => expect(message).toContain(type))
    })

    it("should report the kind too when the partial carries one", () => {
      expect(() => createSymbolFromPartial(fromJSON({ type: "sticky-note", kind: "small" }))).toThrow(/kind "small"/)
    })

    it("should not throw a TypeError when nothing is registered at all", () => {
      // A `getUtil(type)!.create(...)` would surface a missing registration as
      // "Cannot read properties of undefined", which says nothing about the cause.
      const empty = { getUtil: () => undefined, registeredTypes: () => [] }
      const spy = jest.spyOn(symbolRegistry, "getUtil").mockImplementation(empty.getUtil)
      const types = jest.spyOn(symbolRegistry, "registeredTypes").mockImplementation(empty.registeredTypes)
      try {
        expect(() => createSymbolFromPartial(fromJSON({ type: SymbolType.Stroke }))).toThrow(
          /no util is registered for type "stroke".*Registered types: none/s
        )
      } finally {
        spy.mockRestore()
        types.mockRestore()
      }
    })
  })
})

describe("createSymbolsFromPartial", () => {
  it("should build multiple symbols", () => {
    const partials: TJSONPartial[] = [
      { type: SymbolType.Stroke, id: "stroke-1", pointers: [{ t: 0, p: 1, x: 0, y: 0 }], style: {} },
      { type: SymbolType.Edge, kind: EdgeKind.Line, id: "line-1", start: { x: 0, y: 0 }, end: { x: 10, y: 10 } },
    ]
    const symbols = createSymbolsFromPartial(partials.map(fromJSON))
    expect(symbols).toHaveLength(2)
    expect(symbols[0].type).toBe(SymbolType.Stroke)
    expect(symbols[1].type).toBe(SymbolType.Edge)
  })

  it("should accumulate errors for failed symbols", () => {
    const partials: TJSONPartial[] = [
      { type: "Invalid1" },
      { type: SymbolType.Stroke, id: "stroke-1", pointers: [{ t: 0, p: 1, x: 0, y: 0 }], style: {} },
      { type: "Invalid2" },
    ]
    expect(() => createSymbolsFromPartial(partials.map(fromJSON))).toThrow(/Failed to create 2 symbol/)
    expect(() => createSymbolsFromPartial(partials.map(fromJSON))).toThrow(/Symbol 0:/)
    expect(() => createSymbolsFromPartial(partials.map(fromJSON))).toThrow(/Symbol 2:/)
  })

  it("should return empty array for empty input", () => {
    expect(createSymbolsFromPartial([])).toEqual([])
  })
})
