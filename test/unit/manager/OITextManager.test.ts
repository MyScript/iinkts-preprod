import { buildOIText } from "../helpers"
import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import
{
  OITextManager,
  TOISymbolChar,
  Box,
  SVGBuilder
} from "../../../src/iink"

describe("OITextManager.ts", () =>
{
  const chars: TOISymbolChar[] = [
    {
      bounds: { height: 0, width: 0, x: 0, y: 0 },
      color: "black",
      fontSize: 12,
      fontWeight: 400,
      id: "char-1",
      label: "A"
    },
    {
      bounds: { height: 0, width: 0, x: 0, y: 0 },
      color: "black",
      fontSize: 16,
      fontWeight: 400,
      id: "char-1",
      label: "A"
    },
  ]
  Object.defineProperty(global.SVGElement.prototype, 'getNumberOfChars', {
    writable: true,
    value: jest.fn().mockReturnValue(chars.length),
  })
  Object.defineProperty(global.SVGElement.prototype, 'getExtentOfChar', {
    writable: true,
    value: jest.fn((i) => ({ x: i, y: i * 2, height: i * 3, width: i * 4})),
  })
  Object.defineProperty(global.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: jest.fn().mockReturnValue({
      x: 0,
      y: 0,
      width: 10,
      height: 10
    }),
  })

  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OITextManager(behaviors)
    expect(manager).toBeDefined()
  })

  test("should set chars BoundingBox", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OITextManager(behaviors)
    const text = buildOIText({ chars })
    const textEl = manager.renderer.util.getSymbolElement(text) as SVGGElement
    manager.setCharsBounds(text, textEl)

    expect(chars[0].bounds).toEqual({ height: 0, width: 0, x: 0, y: 0 })
    expect(chars[1].bounds).toEqual({ height: 3, width: 4, x: 1, y: 2 })
  })

  test("should get element BoundingBox", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OITextManager(behaviors)
    const text = buildOIText({ chars })
    const textEl = manager.renderer.util.getSymbolElement(text) as SVGGElement
    expect(manager.getElementBoundingBox(textEl)).toEqual({ x: 0, y: 0, width: 10, height: 10 })
  })

  test("should get BoundingBox", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OITextManager(behaviors)
    manager.renderer.layer = SVGBuilder.createLayer({ x: 0, y: 0, width: 100, height: 100 })
    manager.renderer.prependElement = jest.fn()
    const text = buildOIText({ chars })
    manager.getElementBoundingBox = jest.fn(() => new Box({ x: 1, y: 2, width: 3, height: 4 }))
    expect(manager.getBoundingBox(text)).toEqual({ x: 1, y: 2, width: 3, height: 4 })
    expect(manager.getElementBoundingBox).toBeCalledTimes(1)
  })

  test("shoud get Space Width", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OITextManager(behaviors)
    manager.getBoundingBox = jest.fn(() => new Box({ height: 12, width: 42, x: 0, y: 0 }))
    expect(manager.getSpaceWidth(12)).toEqual(42)
    expect(manager.getBoundingBox).toBeCalledTimes(1)
  })

  test("should update Text BoundingBox", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OITextManager(behaviors)
    manager.renderer.layer = SVGBuilder.createLayer({ x: 0, y: 0, width: 100, height: 100 })
    manager.renderer.prependElement = jest.fn()
    manager.getElementBoundingBox = jest.fn(() => new Box({ x: 1989, y: 27, width: 5, height: 42 }))
    manager.setCharsBounds = jest.fn()
    const text = buildOIText({ chars })
    manager.updateBounds(text)
    expect(text.bounds).toEqual({ x: 1989, y: 27, width: 5, height: 42 })
    expect(manager.getElementBoundingBox).toBeCalledTimes(1)
    expect(manager.setCharsBounds).toBeCalledTimes(1)
  })

})
