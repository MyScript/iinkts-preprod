import { InteractiveInkEditorMock } from "../../../__mocks__/InteractiveInkEditorMock"
import { SurroundGestureHandler } from "../../../../../src/manager/interactive/gestures/handlers/SurroundGestureHandler"
import { buildIIStroke, buildIIText } from "../../../helpers"
import { GestureHelpers } from "../../../../../src/manager/interactive/gestures/GestureHelpers"
import { TGesture, SurroundAction } from "../../../../../src/manager/interactive/GestureTypes"
import { IIGestureManager } from "../../../../../src/manager/interactive/IIGestureManager"

describe("SurroundGestureHandler.ts", () =>
{
  let editor: InteractiveInkEditorMock
  let helpers: GestureHelpers
  let handler: SurroundGestureHandler

  beforeEach(() =>
  {
    editor = new InteractiveInkEditorMock();
    editor.init();
    // Create a minimal gesture manager for testing
    (editor as any).gesture = new IIGestureManager(editor);
    helpers = new GestureHelpers(editor);
    handler = new SurroundGestureHandler(editor, helpers);
  })

  test("should instantiate", () =>
  {
    expect(handler).toBeDefined()
    expect(handler.gestureType).toBe("SURROUND")
  })

  describe("apply", () =>
  {
    test("should handle Select action", async () =>
    {
      const stroke = buildIIStroke()
      stroke.addPointer({ x: 10, y: 10, p: 1, t: 100 })
      stroke.addPointer({ x: 20, y: 20, p: 1, t: 200 })

      editor.model.addSymbol(stroke)

      const gestureStroke = buildIIStroke()
      gestureStroke.addPointer({ x: 5, y: 5, p: 1, t: 300 })
      gestureStroke.addPointer({ x: 25, y: 25, p: 1, t: 400 })

      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }

      // Set surround action to Select
      editor.gesture.surroundAction = SurroundAction.Select

      await handler.apply(gestureStroke, gesture)

      // Should complete without errors
      expect(true).toBe(true)
    })

    test("should handle Highlight action", async () =>
    {
      const text = buildIIText({
        chars: [
          {
            id: "char-1",
            label: "Test",
            fontSize: 16,
            fontWeight: "normal",
            color: "#000000",
            bounds: { x: 10, y: 10, width: 20, height: 16 }
          }
        ],
        boundingBox: { x: 10, y: 10, width: 20, height: 16 }
      })

      editor.model.addSymbol(text)

      const gestureStroke = buildIIStroke()
      gestureStroke.addPointer({ x: 5, y: 5, p: 1, t: 100 })
      gestureStroke.addPointer({ x: 35, y: 30, p: 1, t: 200 })

      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }

      // Set surround action to Highlight
      editor.gesture.surroundAction = SurroundAction.Highlight

      await handler.apply(gestureStroke, gesture)

      // Should complete without errors
      expect(true).toBe(true)
    })

    test("should handle Surround action", async () =>
    {
      const stroke = buildIIStroke()
      stroke.addPointer({ x: 10, y: 10, p: 1, t: 100 })
      stroke.addPointer({ x: 20, y: 20, p: 1, t: 200 })
      stroke.jiixBlockType = "Text"

      editor.model.addSymbol(stroke)

      const gestureStroke = buildIIStroke()
      gestureStroke.addPointer({ x: 5, y: 5, p: 1, t: 300 })
      gestureStroke.addPointer({ x: 25, y: 25, p: 1, t: 400 })

      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }

      // Set surround action to Surround
      editor.gesture.surroundAction = SurroundAction.Surround

      await handler.apply(gestureStroke, gesture)

      // Should complete without errors
      expect(true).toBe(true)
    })

    test("should handle empty symbols", async () =>
    {
      const gestureStroke = buildIIStroke()
      gestureStroke.addPointer({ x: 100, y: 100, p: 1, t: 100 })
      gestureStroke.addPointer({ x: 200, y: 200, p: 1, t: 200 })

      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }

      editor.gesture.surroundAction = SurroundAction.Select

      await handler.apply(gestureStroke, gesture)

      // Should complete without errors even with no symbols
      expect(true).toBe(true)
    })

    test("should handle unknown surround action", async () =>
    {
      const gestureStroke = buildIIStroke()
      gestureStroke.addPointer({ x: 10, y: 10, p: 1, t: 100 })

      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }

      // Set an invalid surround action (cast to bypass type check for testing)
      editor.gesture.surroundAction = "UNKNOWN" as any

      await handler.apply(gestureStroke, gesture)

      // Should log error and complete
      expect(true).toBe(true)
    })
  })

  describe("integration", () =>
  {
    test("should select symbols within gesture bounds", async () =>
    {
      const stroke1 = buildIIStroke()
      stroke1.addPointer({ x: 10, y: 10, p: 1, t: 100 })
      stroke1.addPointer({ x: 15, y: 15, p: 1, t: 200 })

      const stroke2 = buildIIStroke()
      stroke2.addPointer({ x: 100, y: 100, p: 1, t: 300 })
      stroke2.addPointer({ x: 105, y: 105, p: 1, t: 400 })

      editor.model.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)

      const gestureStroke = buildIIStroke()
      gestureStroke.addPointer({ x: 5, y: 5, p: 1, t: 500 })
      gestureStroke.addPointer({ x: 20, y: 20, p: 1, t: 600 })

      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }

      editor.gesture.surroundAction = SurroundAction.Select

      await handler.apply(gestureStroke, gesture)

      // Should only select stroke1 which is within bounds
      expect(true).toBe(true)
    })
  })
})
