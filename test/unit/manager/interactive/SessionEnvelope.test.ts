import { buildIIMath, buildIIStroke, buildIIText } from "../../helpers"
import { parseSession, registerBuiltinSymbolUtils, serializeSession, TSessionEnvelope, TSymbolChar } from "@/iink"

describe("SessionEnvelope.ts", () => {
  beforeAll(() => registerBuiltinSymbolUtils())

  const char: TSymbolChar = {
    bounds: { height: 10, width: 8, x: 0, y: 0 },
    color: "black",
    fontSize: 12,
    fontWeight: "normal",
    id: "char-h",
    label: "h",
  }
  const envelope = (overrides: Partial<TSessionEnvelope> = {}): TSessionEnvelope => ({
    format: "iinkts-session",
    formatVersion: 1,
    libVersion: "5.1.0",
    createdAt: "2026-11-20T10:00:00.000Z",
    symbols: [buildIIStroke(), buildIIText({ chars: [char] }), buildIIMath()],
    package: { partId: "part-7", data: "UEsDBA==" },
    ...overrides,
  })

  // What a file can hold: a matrix is its numbers, not a MatrixTransform
  const asData = (value: unknown) => JSON.parse(JSON.stringify(value))

  test("should read back the symbols and package it wrote", () => {
    const saved = envelope()

    expect(asData(parseSession(serializeSession(saved)))).toEqual(asData(saved))
  })

  test("should keep the dates the symbols were created and last changed", () => {
    const saved = envelope()
    saved.symbols = saved.symbols.map((symbol) => ({ ...symbol, creationTime: 1000, modificationDate: 2000 }))

    expect(parseSession(serializeSession(saved)).symbols.map((s) => [s.creationTime, s.modificationDate])).toEqual(
      saved.symbols.map(() => [1000, 2000])
    )
  })

  test("should read a session saved without package", () => {
    const saved = envelope({ package: undefined })

    expect(parseSession(serializeSession(saved)).package).toBeUndefined()
  })

  test("should reject a text that is not JSON", () => {
    expect(() => parseSession("<svg/>")).toThrow("Not an iinkTS session file")
  })

  test("should reject a JSON file of another kind, such as a symbols export", () => {
    expect(() => parseSession(JSON.stringify([buildIIStroke()]))).toThrow("Not an iinkTS session file")
  })

  test("should reject a session file without symbols", () => {
    expect(() => parseSession(JSON.stringify({ format: "iinkts-session", formatVersion: 1 }))).toThrow("Not an iinkTS session file")
  })

  test("should reject a session written by a newer format version", () => {
    const text = serializeSession({ ...envelope(), formatVersion: 2 as TSessionEnvelope["formatVersion"] })

    expect(() => parseSession(text)).toThrow("Session file format 2 is newer than this library reads (1)")
  })

  describe("history", () => {
    const step = () => {
      const [a, b, c] = [buildIIStroke(), buildIIStroke(), buildIIStroke()]
      return {
        added: [a],
        erased: [b],
        updated: [{ before: c, after: { ...c, modificationDate: c.modificationDate + 1 } }],
        replaced: { oldSymbols: [a], newSymbols: [b] },
        order: { symbols: [c], position: "first" as const },
        variables: [{ strokeIds: [a.id], name: "x", before: 1, after: 2 }],
      }
    }

    test("should read back the undo/redo steps and where the history stood", () => {
      const saved = envelope({ history: { stack: [{}, step(), step()], stackIndex: 1 } })

      expect(asData(parseSession(serializeSession(saved)).history)).toEqual(asData(saved.history))
    })

    test("should keep the dates of the symbols in the steps", () => {
      const stroke = { ...buildIIStroke(), creationTime: 1000, modificationDate: 2000 }
      const saved = envelope({ history: { stack: [{}, { added: [stroke] }], stackIndex: 1 } })

      const [, restored] = parseSession(serializeSession(saved)).history!.stack
      expect([restored.added![0].creationTime, restored.added![0].modificationDate]).toEqual([1000, 2000])
    })

    test("should open a session whose history can not be read, without its history", () => {
      const text = serializeSession(envelope({ history: { stack: [{}, { added: [{ type: "unknown" }] }], stackIndex: 1 } } as never))

      const parsed = parseSession(text)

      expect(parsed.history).toBeUndefined()
      expect(parsed.symbols).toHaveLength(3)
    })
  })
})
