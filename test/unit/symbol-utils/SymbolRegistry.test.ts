import type { TBaseSymbol, TBox, TPartialDeep } from "@/iink"
import { registerBuiltinSymbolUtils, symbolRegistry, SymbolType, SymbolUtil } from "@/iink"

beforeAll(() => {
  registerBuiltinSymbolUtils()
})

/** A type the library knows nothing about, to stand in for an integrator's own symbol. */
type TStickyNote = TBaseSymbol & { type: "sticky-note"; text: string }

class StickyNoteUtil extends SymbolUtil<TStickyNote> {
  readonly type = "sticky-note"
  create(partial: TPartialDeep<TStickyNote>): TStickyNote {
    return { ...partial, type: "sticky-note", text: partial.text ?? "" } as TStickyNote
  }
  updateDerivedFields(): void {}
  overlaps(_symbol: TStickyNote, _box: TBox): boolean {
    return false
  }
}

describe("symbolRegistry", () => {
  describe("getUtilFor", () => {
    /**
     * Added by IIC-2004. The transform managers used to call a family dispatcher that re-resolved
     * the kind; they now ask the symbol's own util. That path cannot carry on without a util —
     * skipping a derive leaves stale bounds behind a symbol that still looks right — so unlike
     * `getUtil` this one throws.
     */
    it("should return the util that owns the symbol's type", () => {
      const util = symbolRegistry.getUtilFor({ type: SymbolType.Shape } as TBaseSymbol)
      expect(util.type).toBe(SymbolType.Shape)
    })

    it("should serve a type the integrator registered, not only the built-ins", () => {
      symbolRegistry.register(new StickyNoteUtil())
      expect(symbolRegistry.getUtilFor({ type: "sticky-note" } as TBaseSymbol)).toBeInstanceOf(StickyNoteUtil)
    })

    it("should throw naming the type it could not resolve", () => {
      expect(() => symbolRegistry.getUtilFor({ type: "no-such-type" } as TBaseSymbol)).toThrow(
        'No util is registered for type "no-such-type"'
      )
    })

    it("should list what is registered, so a missing registration is distinguishable from a typo", () => {
      // The two failure modes read identically otherwise, and "registerBuiltinSymbolUtils never
      // ran" is the one that bites: it makes every transform throw at once.
      let message = ""
      try {
        symbolRegistry.getUtilFor({ type: "no-such-type" } as TBaseSymbol)
      } catch (error) {
        message = (error as Error).message
      }
      symbolRegistry.registeredTypes().forEach((type) => expect(message).toContain(type))
    })

    it("should say so plainly when nothing is registered at all", () => {
      const utils = jest.spyOn(symbolRegistry, "getUtil").mockReturnValue(undefined)
      const types = jest.spyOn(symbolRegistry, "registeredTypes").mockReturnValue([])
      try {
        expect(() => symbolRegistry.getUtilFor({ type: SymbolType.Shape } as TBaseSymbol)).toThrow(
          /Registered types: none/
        )
      } finally {
        utils.mockRestore()
        types.mockRestore()
      }
    })

    it("should not be the same contract as getUtil, which stays tolerant", () => {
      // Guards the distinction: if `getUtilFor` were made to return undefined, the transform
      // managers would silently stop deriving and this is what would say so.
      expect(symbolRegistry.getUtil("no-such-type")).toBeUndefined()
      expect(() => symbolRegistry.getUtilFor({ type: "no-such-type" } as TBaseSymbol)).toThrow()
    })
  })
})
