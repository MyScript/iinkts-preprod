import { buildIIDecorator } from "../helpers"
import {
  SymbolType,
  TMathElement,
  TPoint,
  TBox,
  DecoratorKind,
  SVGRendererConst,
  SVGRendererMathUtil
} from "../../../src/iink"
import { MathHelper } from "../../../src/symbol/math/Math"

describe("SVGRendererMathUtil.ts", () =>
{
  const elements: TMathElement[] = [
    {
      id: "elem-1",
      label: "x",
      fontSize: 16,
      fontWeight: "normal",
      fontFamily: "Arial",
      color: "#000000",
      bounds: { x: 10, y: 10, width: 10, height: 16 }
    },
    {
      id: "elem-2",
      label: "+",
      fontSize: 16,
      fontWeight: "normal",
      fontFamily: "Arial",
      color: "#000000",
      bounds: { x: 25, y: 10, width: 8, height: 16 }
    },
    {
      id: "elem-3",
      label: "1",
      fontSize: 16,
      fontWeight: "normal",
      fontFamily: "Arial",
      color: "#000000",
      bounds: { x: 38, y: 10, width: 8, height: 16 }
    }
  ]
  const point: TPoint = { x: 10, y: 20 }
  const boundingBox: TBox = { x: 10, y: 10, width: 36, height: 16 }
  const math = MathHelper.create(elements, point, boundingBox)

  test("should getSVGElement with style for each element", () =>
  {
    const el = SVGRendererMathUtil.getSVGElement(math)!
    expect(el.getAttribute("id")).toEqual(math.id)
    expect(el.getAttribute("type")).toEqual(SymbolType.Math)

    const tspans = el.querySelectorAll("tspan")
    expect(tspans).toHaveLength(3)

    expect(tspans[0].id).toEqual(elements[0].id)
    expect(tspans[0].getAttribute("fill")).toEqual(elements[0].color)
    expect(tspans[0].getAttribute("font-size")).toEqual(`${elements[0].fontSize}px`)
    expect(tspans[0].getAttribute("font-weight")).toEqual(elements[0].fontWeight)
    expect(tspans[0].textContent).toEqual(elements[0].label)
  })

  test("should getSVGElement with selected filter", () =>
  {
    const elNotSelected = SVGRendererMathUtil.getSVGElement(math)!
    expect(elNotSelected.getAttribute("filter")).toBeFalsy()

    math.selected = true
    const elSelected = SVGRendererMathUtil.getSVGElement(math)!
    expect(elSelected.getAttribute("filter")).toEqual(`url(#${SVGRendererConst.selectionFilterId})`)

    math.selected = false
  })

  test("should getSVGElement with removal filter", () =>
  {
    const elNotDeleting = SVGRendererMathUtil.getSVGElement(math)!
    expect(elNotDeleting.getAttribute("filter")).toBeFalsy()

    math.deleting = true
    const elDeleting = SVGRendererMathUtil.getSVGElement(math)!
    expect(elDeleting.getAttribute("filter")).toEqual(`url(#${SVGRendererConst.removalFilterId})`)

    math.deleting = false
  })

  test("should getSVGElement with transform rotate", () =>
  {
    const elNotRotate = SVGRendererMathUtil.getSVGElement(math)!
    expect(elNotRotate.getAttribute("transform")).toBeFalsy()

    math.rotation = { center: { x: 12, y: 25 }, degree: 45 }
    const elRotating = SVGRendererMathUtil.getSVGElement(math)!
    expect(elRotating.getAttribute("transform")).toEqual(`rotate(${math.rotation.degree}, ${math.rotation.center.x}, ${math.rotation.center.y})`)

    math.rotation = undefined
  })

  test("should getSVGElement with decorators", () =>
  {
    const elWithoutDecorator = SVGRendererMathUtil.getSVGElement(math)!
    expect(elWithoutDecorator.children.length).toBe(1) // Only text element

    math.decorators.push(buildIIDecorator(DecoratorKind.Strikethrough))
    const elWithDecorator = SVGRendererMathUtil.getSVGElement(math)!
    expect(elWithDecorator.children.length).toBeGreaterThan(1)

    math.decorators = []
  })

  test("should handle superscript and subscript positions", () =>
  {
    const elementsWithLimits: TMathElement[] = [
      {
        id: "elem-op",
        label: "∑",
        fontSize: 20,
        fontWeight: "normal",
        fontFamily: "Arial",
        color: "#000000",
        bounds: { x: 10, y: 10, width: 15, height: 20 },
        position: "normal"
      },
      {
        id: "elem-super",
        label: "n",
        fontSize: 12,
        fontWeight: "normal",
        fontFamily: "Arial",
        color: "#000000",
        bounds: { x: 12, y: 5, width: 8, height: 10 },
        position: "superscript"
      },
      {
        id: "elem-sub",
        label: "i=1",
        fontSize: 12,
        fontWeight: "normal",
        fontFamily: "Arial",
        color: "#000000",
        bounds: { x: 12, y: 32, width: 15, height: 10 },
        position: "subscript"
      }
    ]

    const mathWithLimits = MathHelper.create(elementsWithLimits, point, boundingBox)
    const el = SVGRendererMathUtil.getSVGElement(mathWithLimits)!

    expect(el.getAttribute("id")).toEqual(mathWithLimits.id)
    const textElements = el.querySelectorAll("text")
    expect(textElements.length).toBeGreaterThan(0)
  })

  test("should handle opacity", () =>
  {
    math.style.opacity = 0.5
    const el = SVGRendererMathUtil.getSVGElement(math)!
    expect(el.getAttribute("opacity")).toEqual("0.5")

    delete math.style.opacity
  })
})
