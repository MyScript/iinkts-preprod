import { parseExportedJIIX, TExport } from "@/iink"

describe("Export.ts", () => {
  describe("parseExportedJIIX", () => {
    test("should parse the JIIX sent as a JSON string, in place", () => {
      // As the websocket message arrives: TExport says JIIX is an object, the wire carries a string
      const message = JSON.stringify({ "application/vnd.myscript.jiix": JSON.stringify({ type: "Text", label: "a" }) })
      const exports: TExport = JSON.parse(message)
      const parsed = parseExportedJIIX(exports)
      expect(parsed).toBe(exports)
      expect(parsed["application/vnd.myscript.jiix"]).toEqual({ type: "Text", label: "a" })
    })

    test("should leave the other exports untouched", () => {
      const exports: TExport = { "text/plain": "a" }
      expect(parseExportedJIIX(exports)).toEqual({ "text/plain": "a" })
    })
  })
})
