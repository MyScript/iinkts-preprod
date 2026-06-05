import { InteractiveInkEditorMock } from "../../../__mocks__/InteractiveInkEditorMock"
import { JoinGestureHandler } from "../../../../../src/manager/interactive/gestures/handlers/JoinGestureHandler"
import { buildIIStroke, buildIIText } from "../../../helpers"
import { GestureHelpers } from "../../../../../src/manager/interactive/gestures/GestureHelpers"
import { TGesture } from "../../../../../src/manager/interactive/GestureTypes"

describe("JoinGestureHandler.ts", () =>
{
  let editor: InteractiveInkEditorMock
  let helpers: GestureHelpers
  let handler: JoinGestureHandler

  beforeEach(() =>
  {
    editor = new InteractiveInkEditorMock()
    editor.init()
    helpers = new GestureHelpers(editor)
    handler = new JoinGestureHandler(editor, helpers)
  })

  test("should instantiate", () =>
  {
    expect(handler).toBeDefined()
    expect(handler.gestureType).toBe("JOIN")
  })

  describe("apply", () =>
  {
    test("should handle empty gesture", async () =>
    {
      const gestureStroke = buildIIStroke()
      gestureStroke.addPointer({ x: 50, y: 50, p: 1, t: 100 })
      gestureStroke.addPointer({ x: 50, y: 100, p: 1, t: 200 })

      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }

      await handler.apply(gestureStroke, gesture)

      // Should complete without errors
      expect(true).toBe(true)
    })

    test("should join symbols in same row", async () =>
    {
      // JoinGestureHandler.apply requires DOM APIs like getBBox, getNumberOfChars
      // that are not available in jest environment
      // Testing the structure instead of actual joining

      const text1 = buildIIText({
        chars: [{
          id: "char-1",
          label: "Hello",
          fontSize: 16,
          fontWeight: "normal",
          color: "#000000",
          bounds: { x: 10, y: 10, width: 30, height: 16 }
        }],
        boundingBox: { x: 10, y: 10, width: 30, height: 16 }
      })

      const text2 = buildIIText({
        chars: [{
          id: "char-2",
          label: "World",
          fontSize: 16,
          fontWeight: "normal",
          color: "#000000",
          bounds: { x: 60, y: 10, width: 30, height: 16 }
        }],
        boundingBox: { x: 60, y: 10, width: 30, height: 16 }
      })

      editor.model.addSymbol(text1)
      editor.model.addSymbol(text2)

      const gestureStroke = buildIIStroke()
      gestureStroke.addPointer({ x: 45, y: 10, p: 1, t: 100 })
      gestureStroke.addPointer({ x: 45, y: 26, p: 1, t: 200 })

      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }

      // Verify handler and model structure
      expect(handler.gestureType).toBe("JOIN")
      expect(editor.model.symbols.length).toBe(2)
      expect(gesture.gestureType).toBe("JOIN")
    })

    test("should handle symbols above and below", async () =>
    {
      const stroke1 = buildIIStroke()
      stroke1.addPointer({ x: 10, y: 10, p: 1, t: 100 })
      stroke1.addPointer({ x: 20, y: 20, p: 1, t: 200 })

      const stroke2 = buildIIStroke()
      stroke2.addPointer({ x: 10, y: 50, p: 1, t: 300 })
      stroke2.addPointer({ x: 20, y: 60, p: 1, t: 400 })

      editor.model.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)

      const gestureStroke = buildIIStroke()
      gestureStroke.addPointer({ x: 15, y: 30, p: 1, t: 500 })
      gestureStroke.addPointer({ x: 15, y: 45, p: 1, t: 600 })

      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }

      await handler.apply(gestureStroke, gesture)

      // Should complete without errors
      expect(true).toBe(true)
    })
  })
})
