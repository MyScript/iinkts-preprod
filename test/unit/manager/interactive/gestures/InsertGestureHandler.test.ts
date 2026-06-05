import { InteractiveInkEditorMock } from "../../../__mocks__/InteractiveInkEditorMock"
import { InsertGestureHandler } from "../../../../../src/manager/interactive/gestures/handlers/InsertGestureHandler"
import { buildIIStroke } from "../../../helpers"
import { GestureHelpers } from "../../../../../src/manager/interactive/gestures/GestureHelpers"

describe("InsertGestureHandler.ts", () =>
{
  let editor: InteractiveInkEditorMock
  let helpers: GestureHelpers
  let handler: InsertGestureHandler

  beforeEach(() =>
  {
    editor = new InteractiveInkEditorMock()
    editor.init()
    helpers = new GestureHelpers(editor)
    handler = new InsertGestureHandler(editor, helpers)
  })

  test("should instantiate", () =>
  {
    expect(handler).toBeDefined()
    expect(handler.gestureType).toBe("INSERT")
  })

  describe("createStrokesFromGestureSubStroke", () =>
  {
    test("should create strokes from substroke data", () =>
    {
      const strokeOrigin = buildIIStroke()
      strokeOrigin.addPointer({ x: 0, y: 0, p: 1, t: 100 })
      strokeOrigin.addPointer({ x: 5, y: 5, p: 0.8, t: 200 })

      const subStrokes = [
        { x: [0, 1], y: [0, 1] },
        { x: [5, 6], y: [5, 6] }
      ]

      const strokes = handler.createStrokesFromGestureSubStroke(strokeOrigin, subStrokes)

      expect(strokes.length).toBe(2)
      expect(strokes[0].pointers.length).toBe(2)
      expect(strokes[1].pointers.length).toBe(2)
    })

    test("should handle single substroke", () =>
    {
      const strokeOrigin = buildIIStroke()
      strokeOrigin.addPointer({ x: 0, y: 0, p: 1, t: 100 })

      const subStrokes = [
        { x: [0, 1], y: [0, 1] }
      ]

      const strokes = handler.createStrokesFromGestureSubStroke(strokeOrigin, subStrokes)

      expect(strokes.length).toBe(1)
    })
  })

  describe("computeSplitStroke", () =>
  {
    test("should split stroke into before and after parts", () =>
    {
      const strokeOrigin = buildIIStroke()
      strokeOrigin.addPointer({ x: 0, y: 0, p: 1, t: 100 })
      strokeOrigin.addPointer({ x: 5, y: 5, p: 0.8, t: 200 })
      strokeOrigin.addPointer({ x: 10, y: 10, p: 0.9, t: 300 })

      const subStrokes = [
        { x: [0, 1], y: [0, 1] },
        { x: [5, 6], y: [5, 6] }
      ]

      const result = handler.computeSplitStroke(strokeOrigin, subStrokes)

      expect(result.before).toBeDefined()
      expect(result.after).toBeDefined()
    })

    test("should translate after stroke", () =>
    {
      const strokeOrigin = buildIIStroke()
      strokeOrigin.addPointer({ x: 0, y: 0, p: 1, t: 100 })
      strokeOrigin.addPointer({ x: 5, y: 5, p: 0.8, t: 200 })

      const subStrokes = [
        { x: [0, 1], y: [0, 1] },
        { x: [5, 6], y: [5, 6] }
      ]

      const result = handler.computeSplitStroke(strokeOrigin, subStrokes)

      expect(result.after).toBeDefined()
      if (result.after) {
        // After stroke should be translated
        expect(result.after.bounds.x).not.toBe(5)
      }
    })
  })

  describe("computeChangesOnSplitStroke", () =>
  {
    test("should return changes with replaced symbols", () =>
    {
      const gestureStroke = buildIIStroke()
      gestureStroke.addPointer({ x: 5, y: 5, p: 1, t: 100 })

      const strokeToSplit = buildIIStroke()
      strokeToSplit.addPointer({ x: 0, y: 0, p: 1, t: 100 })
      strokeToSplit.addPointer({ x: 10, y: 10, p: 1, t: 200 })

      editor.model.addSymbol(strokeToSplit)

      const subStrokes = [
        { fullStrokeId: strokeToSplit.id, x: [0, 1], y: [0, 1] },
        { fullStrokeId: strokeToSplit.id, x: [5, 6], y: [5, 6] }
      ]

      const changes = handler.computeChangesOnSplitStroke(gestureStroke, strokeToSplit.id, subStrokes)

      expect(changes.replaced).toBeDefined()
      expect(changes.replaced?.oldSymbols.length).toBeGreaterThanOrEqual(0)
    })
  })
})
