import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../../helpers"
import { UnderlineGestureHandler, GestureHelpers, TGesture, UnderlineAction } from "@/iink"

describe("UnderlineGestureHandler.ts", () => {
  let canvas: ReturnType<typeof createCanvasMock>
  let helpers: GestureHelpers
  let handler: UnderlineGestureHandler

  beforeEach(() => {
    canvas = createCanvasMock()
    helpers = new GestureHelpers(asCanvas(canvas))
    handler = new UnderlineGestureHandler(asCanvas(canvas), helpers)
  })

  test("should instantiate", () => {
    expect(handler).toBeDefined()
    expect(handler.gestureType).toBe("UNDERLINE")
  })

  describe("apply", () => {
    test("should warn and do nothing when there are no target strokes", async () => {
      const gestureStroke = buildIIStroke()
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      await handler.apply(gestureStroke, gesture)

      expect(canvas.updateSymbolsStyle).not.toHaveBeenCalled()
      expect(canvas.history.push).not.toHaveBeenCalled()
    })

    test("should double the stroke width when underlineAction is Thicken", async () => {
      canvas.gesture.underlineAction = UnderlineAction.Thicken
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      const gestureStroke = buildIIStroke()
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      await handler.apply(gestureStroke, gesture)

      expect(canvas.updateSymbolsStyle).toHaveBeenCalledWith(
        [stroke.id],
        { width: (stroke.style.width || 1) * 2 },
        false
      )
      expect(canvas.history.push).toHaveBeenCalledTimes(1)
    })

    test("should push a history entry when underlineAction is Draw", async () => {
      canvas.gesture.underlineAction = UnderlineAction.Draw
      const stroke = buildIIStroke()
      // avoid the multi-second "wait for pending classification" delay in IIGestureAnnotationProcessor
      stroke.jiixBlockType = "Text"
      canvas.model.addSymbol(stroke)
      const gestureStroke = buildIIStroke()
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      await handler.apply(gestureStroke, gesture)

      expect(canvas.history.push).toHaveBeenCalledTimes(1)
      expect(canvas.updateSymbolsStyle).not.toHaveBeenCalled()
    })
  })
})
