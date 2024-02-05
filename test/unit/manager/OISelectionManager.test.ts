import { buildOIStroke } from "../helpers"
import
{
  OIBehaviors,
  TBehaviorOptions,
  DefaultConfiguration,
  OISelectionManager,
  TBoundingBox,
  SvgElementRole,
} from "../../../src/iink"

describe("OISelectionManager.ts", () =>
{
  const behaviorsOptions: TBehaviorOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
  }
  behaviorsOptions.configuration.offscreen = true
  test("should create", () =>
  {
    const behaviors = new OIBehaviors(behaviorsOptions)
    const manager = new OISelectionManager(behaviors)
    expect(manager).toBeDefined()
  })

  test("should draw selecting rect", () =>
  {
    const behaviors = new OIBehaviors(behaviorsOptions)
    const manager = new OISelectionManager(behaviors)
    manager.renderer.clearElements = jest.fn()
    manager.renderer.appendElement = jest.fn()
    const box: TBoundingBox = {
      height: 10,
      width: 20,
      x: 1,
      y: 2
    }
    manager.drawSelectingRect(box)
    expect(manager.renderer.clearElements).toBeCalledTimes(1)
    expect(manager.renderer.appendElement).toBeCalledTimes(1)
  })

  test("should clear selecting rect", () =>
  {
    const behaviors = new OIBehaviors(behaviorsOptions)
    const manager = new OISelectionManager(behaviors)
    manager.renderer.clearElements = jest.fn()
    manager.clearSelectingRect()
    expect(manager.renderer.clearElements).toBeCalledTimes(1)
  })

  describe("selected group", () =>
  {
    const wrapperHTML: HTMLElement = document.createElement("div")
    const behaviors = new OIBehaviors(behaviorsOptions)
    const manager = new OISelectionManager(behaviors)
    const stroke = buildOIStroke()

    behaviors.recognizer.init = jest.fn(() => Promise.resolve())
    behaviors.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))

    beforeAll(async () =>
    {
      await behaviors.init(wrapperHTML)
      behaviors.model.addSymbol(stroke)
      behaviors.renderer.drawSymbol(stroke)
    })

    test("should draw selected group", () =>
    {
      manager.drawSelectedGroup([stroke])
      const group = behaviors.renderer.layer.querySelector("[role=\"selected\"]") as SVGGElement
      expect(group).not.toBeNull()
      const translateRect = group?.querySelector(`[role=${ SvgElementRole.Translate }]`)
      expect(translateRect?.getAttribute("x")).toEqual((stroke.boundingBox.x - (stroke.style.width || 1)).toString())
      expect(translateRect?.getAttribute("y")).toEqual((stroke.boundingBox.y - (stroke.style.width || 1)).toString())
      expect(translateRect?.getAttribute("width")).toEqual((stroke.boundingBox.width + 2 * (stroke.style.width || 1)).toString())
      expect(translateRect?.getAttribute("height")).toEqual((stroke.boundingBox.height + 2 * (stroke.style.width || 1)).toString())

      const rotateCircles = group.querySelectorAll(`circle[role=${ SvgElementRole.Rotate }]`)
      expect(rotateCircles).toHaveLength(2)

      const cornerResizeElement = group.querySelectorAll(`circle[role=${ SvgElementRole.Resize }]`)
      expect(cornerResizeElement).toHaveLength(4)
      const edgeResizeElement = group.querySelectorAll(`line[role=${ SvgElementRole.Resize }]`)
      expect(edgeResizeElement).toHaveLength(4)

      const strokePath = group.querySelectorAll(`[id=${ stroke.id }]`)
      expect(strokePath).toHaveLength(1)
    })
  })

  describe("process", () =>
  {
    const behaviors = new OIBehaviors(behaviorsOptions)
    const manager = new OISelectionManager(behaviors)
    const strokeToSelect = buildOIStroke( { box: { height: 10, width: 10, x: 10, y: 10 }})
    manager.model.addSymbol(strokeToSelect)
    const otherStroke = buildOIStroke( { box: { height: 10, width: 10, x: 100, y: 100 }})
    manager.model.addSymbol(otherStroke)
    manager.drawSelectingRect = jest.fn()
    manager.clearSelectingRect = jest.fn()
    manager.drawSelectedGroup = jest.fn()
    manager.renderer.drawSymbol = jest.fn()
    manager.internalEvent.emitSelected = jest.fn()

    test("start", () =>
    {
      manager.start({ x: 1, y: 2 })
      expect(manager.drawSelectingRect).toBeCalledTimes(1)
    })

    test("continue", () =>
    {
      manager.continue({ x: 20, y: 20 })
      expect(manager.drawSelectingRect).toBeCalledTimes(1)
      expect(manager.renderer.drawSymbol).toBeCalledTimes(1)
      expect(manager.renderer.drawSymbol).toBeCalledWith(strokeToSelect)
      expect(manager.model.symbolsSelected).toEqual([strokeToSelect])
    })

    test("end", () =>
    {
      manager.end({ x: 20, y: 20 })
      expect(manager.drawSelectingRect).toBeCalledTimes(1)
      expect(manager.clearSelectingRect).toBeCalledTimes(1)
      expect(manager.drawSelectedGroup).toBeCalledTimes(1)
      expect(manager.drawSelectedGroup).toBeCalledWith([strokeToSelect])
      expect(manager.model.symbolsSelected).toEqual([strokeToSelect])
      expect(manager.internalEvent.emitSelected).toBeCalledTimes(1)
      expect(manager.internalEvent.emitSelected).toBeCalledWith([strokeToSelect])
    })
  })

})
