import { buildIIStroke } from "../../helpers"
import { InteractiveInkEditorMock } from "../../__mocks__/InteractiveInkEditorMock"

describe("IIJiixQueryManager.ts", () =>
{
  describe("getBlocksForSymbols", () =>
  {
    test("should return empty array when no exports", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      expect(editor.jiix.getBlocksForSymbols([stroke])).toEqual([])
    })

    test("should return empty array when no symbol matches any block", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      editor.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math", id: "MainBlock", version: "3",
          elements: [{ id: "block-1", type: "Math" as never, items: [{ type: "stroke", id: "s1", "full-id": "other-id" }] }]
        }
      })
      editor.jiix.invalidateIndex()
      expect(editor.jiix.getBlocksForSymbols([stroke])).toEqual([])
    })

    test("should return block when all its strokes are in symbols", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      editor.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math", id: "MainBlock", version: "3",
          elements: [{ id: "block-1", type: "Math" as never, items: [{ type: "stroke", id: "s1", "full-id": stroke.id }] }]
        }
      })
      editor.jiix.invalidateIndex()
      const result = editor.jiix.getBlocksForSymbols([stroke])
      expect(result.map(el => el.id)).toEqual(["block-1"])
    })

    test("should not return block when only some strokes are in symbols", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      editor.model.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)
      editor.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math", id: "MainBlock", version: "3",
          elements: [{
            id: "block-1", type: "Math" as never,
            items: [{ type: "stroke", id: "s1", "full-id": stroke1.id }, { type: "stroke", id: "s2", "full-id": stroke2.id }]
          }]
        }
      })
      editor.jiix.invalidateIndex()
      expect(editor.jiix.getBlocksForSymbols([stroke1])).toEqual([])
    })

    test("should return only fully-covered blocks among multiple", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      const stroke3 = buildIIStroke()
      editor.model.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)
      editor.model.addSymbol(stroke3)
      editor.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math", id: "MainBlock", version: "3",
          elements: [
            { id: "block-full", type: "Math" as never, items: [{ type: "stroke", id: "s1", "full-id": stroke1.id }] },
            { id: "block-partial", type: "Math" as never, items: [{ type: "stroke", id: "s2", "full-id": stroke2.id }, { type: "stroke", id: "s3", "full-id": stroke3.id }] }
          ]
        }
      })
      editor.jiix.invalidateIndex()
      const result = editor.jiix.getBlocksForSymbols([stroke1, stroke2])
      expect(result.map(el => el.id)).toEqual(["block-full"])
    })
  })

  describe("getBlocksForSymbols with selected symbols", () =>
  {
    test("should return blocks for selected symbols", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      editor.model.selectSymbol(stroke.id)
      editor.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math", id: "MainBlock", version: "3",
          elements: [{ id: "block-selected", type: "Math" as never, items: [{ type: "stroke", id: "s1", "full-id": stroke.id }] }]
        }
      })
      editor.jiix.invalidateIndex()
      expect(editor.jiix.getBlocksForSymbols(editor.model.symbolsSelected).map(el => el.id)).toEqual(["block-selected"])
    })

    test("should return empty when no symbols selected", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      editor.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math", id: "MainBlock", version: "3",
          elements: [{ id: "block-1", type: "Math" as never, items: [{ type: "stroke", id: "s1", "full-id": stroke.id }] }]
        }
      })
      editor.jiix.invalidateIndex()
      expect(editor.jiix.getBlocksForSymbols(editor.model.symbolsSelected)).toEqual([])
    })
  })
})
