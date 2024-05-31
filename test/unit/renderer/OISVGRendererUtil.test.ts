import
{
  OIText,
  TPoint,
  TOISymbolChar,
  SymbolType,
  TBoundingBox,
  OISVGRendererUtil,
  OIStroke,
  DefaultStyle,
  TStyle,
  OIShapeRectangle,
  OIShapeCircle,
  ShapeKind,
  OIShapeParallelogram,
  OIShapeTriangle,
  EdgeDecoration,
  OIEdgeArc,
  OIEdgeLine,
  EdgeKind,
  OIEraser,
  OISymbolGroup
} from "../../../src/iink"

describe("OISVGRendererUtil.ts", () =>
{
  const selectionFilterId = "selectionFilterId"
  const removalFilterId = "removalFilterId"
  const arrowStartDecoration = "arrowStartDecoration"
  const arrowEndDecoration = "arrowEndDecoration"
  const renderer = new OISVGRendererUtil(selectionFilterId, removalFilterId, arrowStartDecoration, arrowEndDecoration)

  describe("text", () =>
  {
    const chars: TOISymbolChar[] = [
      {
        color: "blue",
        fontSize: 18,
        fontWeight: 400,
        id: 'id-1',
        label: "first",
        boundingBox: {
          height: 10,
          width: 5,
          x: 0,
          y: 10
        }
      },
      {
        color: "red",
        fontSize: 12,
        fontWeight: 200,
        id: 'id-2',
        label: "second",
        boundingBox: {
          height: 10,
          width: 5,
          x: 5,
          y: 10
        }
      },
    ]
    const point: TPoint = { x: 0, y: 0 }
    const boundingBox: TBoundingBox = { height: 100, width: 100, x: 0, y: 0 }
    const text = new OIText({}, chars, point, boundingBox)

    test("should getSymbolElement with style for each char", () =>
    {
      const el = renderer.getSymbolElement(text)!
      expect(el.getAttribute("id")).toEqual(text.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Text)
      const spans = el.querySelectorAll("tspan")

      expect(spans).toHaveLength(2)
      expect(spans[0].id).toEqual(chars[0].id)
      expect(spans[0].getAttribute("fill")).toEqual(chars[0].color)
      expect(spans[0].getAttribute("font-size")).toEqual(`${ chars[0].fontSize }px`)
      expect(spans[0].getAttribute("font-weight")).toEqual(`${ chars[0].fontWeight }`)
      expect(spans[0].textContent).toEqual(chars[0].label)

      expect(spans[1].id).toEqual(chars[1].id)
      expect(spans[1].getAttribute("fill")).toEqual(chars[1].color)
      expect(spans[1].getAttribute("font-size")).toEqual(`${ chars[1].fontSize }px`)
      expect(spans[1].getAttribute("font-weight")).toEqual(`${ chars[1].fontWeight }`)
      expect(spans[1].textContent).toEqual(chars[1].label)
    })
    test("should getSymbolElement with selected filter", () =>
    {
      const elNotSelected = renderer.getSymbolElement(text)!
      expect(elNotSelected.getAttribute("id")).toEqual(text.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Text)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()

      text.selected = true
      const elSelected = renderer.getSymbolElement(text)!
      expect(elSelected.getAttribute("id")).toEqual(text.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Text)
      expect(elSelected.querySelector("text")?.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
    })
    test("should getSymbolElement with removal filter", () =>
    {
      const elNotDeleting = renderer.getSymbolElement(text)!
      expect(elNotDeleting.getAttribute("id")).toEqual(text.id)
      expect(elNotDeleting.getAttribute("type")).toEqual(SymbolType.Text)
      expect(elNotDeleting.getAttribute("filter")).toBeFalsy()

      text.deleting = true
      const elDeleting = renderer.getSymbolElement(text)!
      expect(elDeleting.getAttribute("id")).toEqual(text.id)
      expect(elDeleting.getAttribute("type")).toEqual(SymbolType.Text)
      expect(elDeleting.getAttribute("filter")).toEqual(`url(#${ removalFilterId })`)
    })
  })

  describe("stroke", () =>
  {
    test("should getSymbolElement with default style", () =>
    {
      const stroke = new OIStroke({})
      stroke.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
      stroke.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
      const el = renderer.getSymbolElement(stroke)!
      expect(el.getAttribute("id")).toEqual(stroke.id)
      expect(el.getAttribute("type")).toEqual("stroke")
      expect(el.getAttribute("fill")).toEqual(DefaultStyle.color)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should getSymbolElement with custom style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const stroke = new OIStroke(style)
      stroke.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
      stroke.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
      const el = renderer.getSymbolElement(stroke)!
      expect(el.getAttribute("id")).toEqual(stroke.id)
      expect(el.getAttribute("type")).toEqual("stroke")
      expect(el.getAttribute("fill")).toEqual(style.color)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should getSymbolElement with selected filter", () =>
    {
      const stroke = new OIStroke({})
      stroke.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
      stroke.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
      stroke.selected = true
      const el = renderer.getSymbolElement(stroke)!
      expect(el.getAttribute("id")).toEqual(stroke.id)
      expect(el.querySelector("path")?.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
    })
    test("should getSymbolElement with removal filter", () =>
    {
      const stroke = new OIStroke({})
      stroke.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
      stroke.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
      stroke.deleting = true
      const el = renderer.getSymbolElement(stroke)!
      expect(el.getAttribute("id")).toEqual(stroke.id)
      expect(el.getAttribute("filter")).toEqual(`url(#${ removalFilterId })`)
    })
  })

  describe("shape", () =>
  {
    describe("rectangle", () =>
    {
      test("should getSymbolElement with default style", () =>
      {
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const rect = OIShapeRectangle.createFromLine({}, origin, target)
        const el = renderer.getSymbolElement(rect)!
        expect(el.getAttribute("id")).toEqual(rect.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(el.getAttribute("kind")).toEqual(ShapeKind.Rectangle)
        expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
        expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
      })
      test("should getSymbolElement with custom style", () =>
      {
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const rect = OIShapeRectangle.createFromLine(style, origin, target)
        const el = renderer.getSymbolElement(rect)!
        expect(el.getAttribute("id")).toEqual(rect.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(el.getAttribute("kind")).toEqual(ShapeKind.Rectangle)
        expect(el.getAttribute("stroke")).toEqual(style.color)
        expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
      })
      test("should getSymbolElement when selected", () =>
      {
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const rect = OIShapeRectangle.createFromLine({}, origin, target)
        const elNotSelected = renderer.getSymbolElement(rect)!
        expect(elNotSelected.getAttribute("id")).toEqual(rect.id)
        expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Rectangle)
        expect(elNotSelected.getAttribute("filter")).toBeFalsy()
        rect.selected = true
        const elSelected = renderer.getSymbolElement(rect)!
        expect(elSelected.getAttribute("id")).toEqual(rect.id)
        expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Rectangle)
        expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
      })
      test("should getSymbolElement when deleting", () =>
      {
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const rect = OIShapeRectangle.createFromLine({}, origin, target)
        const elNotSelected = renderer.getSymbolElement(rect)!
        expect(elNotSelected.getAttribute("id")).toEqual(rect.id)
        expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Rectangle)
        expect(elNotSelected.getAttribute("filter")).toBeFalsy()
        rect.deleting = true
        const elSelected = renderer.getSymbolElement(rect)!
        expect(elSelected.getAttribute("id")).toEqual(rect.id)
        expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Rectangle)
        expect(elSelected.getAttribute("filter")).toEqual(`url(#${ removalFilterId })`)
      })
    })

    describe("circle", () =>
    {
      test("should getSymbolElement with default style", () =>
      {
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const circle = OIShapeCircle.createFromLine({}, origin, target)
        const el = renderer.getSymbolElement(circle)!
        expect(el.getAttribute("id")).toEqual(circle.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(el.getAttribute("kind")).toEqual(ShapeKind.Circle)
        expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
        expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
      })
      test("should getSymbolElement with custom style", () =>
      {
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const circle = OIShapeCircle.createFromLine(style, origin, target)
        const el = renderer.getSymbolElement(circle)!
        expect(el.getAttribute("id")).toEqual(circle.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(el.getAttribute("kind")).toEqual(ShapeKind.Circle)
        expect(el.getAttribute("stroke")).toEqual(style.color)
        expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
      })
      test("should getSymbolElement when selected", () =>
      {
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const circle = OIShapeCircle.createFromLine({}, origin, target)
        const elNotSelected = renderer.getSymbolElement(circle)!
        expect(elNotSelected.getAttribute("id")).toEqual(circle.id)
        expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Circle)
        expect(elNotSelected.getAttribute("filter")).toBeFalsy()
        circle.selected = true
        const elSelected = renderer.getSymbolElement(circle)!
        expect(elSelected.getAttribute("id")).toEqual(circle.id)
        expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Circle)
        expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
      })
      test("should getSymbolElement when deleting", () =>
      {
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const circle = OIShapeCircle.createFromLine({}, origin, target)
        const elNotSelected = renderer.getSymbolElement(circle)!
        expect(elNotSelected.getAttribute("id")).toEqual(circle.id)
        expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Circle)
        expect(elNotSelected.getAttribute("filter")).toBeFalsy()
        circle.deleting = true
        const elSelected = renderer.getSymbolElement(circle)!
        expect(elSelected.getAttribute("id")).toEqual(circle.id)
        expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Circle)
        expect(elSelected.getAttribute("filter")).toEqual(`url(#${ removalFilterId })`)
      })
    })

    describe("parallelogram", () =>
    {
      test("should getSymbolElement with default style", () =>
      {
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const parallelogram = OIShapeParallelogram.createFromLine({}, origin, target)
        const el = renderer.getSymbolElement(parallelogram)!
        expect(el.getAttribute("id")).toEqual(parallelogram.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(el.getAttribute("kind")).toEqual(ShapeKind.Parallelogram)
        expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
        expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
      })
      test("should getSymbolElement with custom style", () =>
      {
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const origin: TPoint = { x: 0, y: 0 }
        const target: TPoint = { x: 10, y: 20 }
        const parallelogram = OIShapeParallelogram.createFromLine(style, origin, target)
        const el = renderer.getSymbolElement(parallelogram)!
        expect(el.getAttribute("id")).toEqual(parallelogram.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(el.getAttribute("kind")).toEqual(ShapeKind.Parallelogram)
        expect(el.getAttribute("stroke")).toEqual(style.color)
        expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
      })
      test("should getSymbolElement when selected", () =>
      {
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const parallelogram = OIShapeParallelogram.createFromLine({}, origin, target)
        const elNotSelected = renderer.getSymbolElement(parallelogram)!
        expect(elNotSelected.getAttribute("id")).toEqual(parallelogram.id)
        expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Parallelogram)
        expect(elNotSelected.getAttribute("filter")).toBeFalsy()
        parallelogram.selected = true
        const elSelected = renderer.getSymbolElement(parallelogram)!
        expect(elSelected.getAttribute("id")).toEqual(parallelogram.id)
        expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Parallelogram)
        expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
      })
      test("should getSymbolElement when deleting", () =>
      {
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const parallelogram = OIShapeParallelogram.createFromLine({}, origin, target)
        const elNotSelected = renderer.getSymbolElement(parallelogram)!
        expect(elNotSelected.getAttribute("id")).toEqual(parallelogram.id)
        expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Parallelogram)
        expect(elNotSelected.getAttribute("filter")).toBeFalsy()
        parallelogram.deleting = true
        const elSelected = renderer.getSymbolElement(parallelogram)!
        expect(elSelected.getAttribute("id")).toEqual(parallelogram.id)
        expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Parallelogram)
        expect(elSelected.getAttribute("filter")).toEqual(`url(#${ removalFilterId })`)
      })
    })

    describe("triangle", () =>
    {
      test("should getSymbolElement with default style", () =>
      {
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const triangle = OIShapeTriangle.createFromLine({}, origin, target)
        const el = renderer.getSymbolElement(triangle)!
        expect(el.getAttribute("id")).toEqual(triangle.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(el.getAttribute("kind")).toEqual(ShapeKind.Triangle)
        expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
        expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
      })
      test("should getSymbolElement with custom style", () =>
      {
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const triangle = OIShapeTriangle.createFromLine(style, origin, target)
        const el = renderer.getSymbolElement(triangle)!
        expect(el.getAttribute("id")).toEqual(triangle.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(el.getAttribute("kind")).toEqual("triangle")
        expect(el.getAttribute("stroke")).toEqual(style.color)
        expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
      })
      test("should getSymbolElement when selected", () =>
      {
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const triangle = OIShapeTriangle.createFromLine({}, origin, target)
        const elNotSelected = renderer.getSymbolElement(triangle)!
        expect(elNotSelected.getAttribute("id")).toEqual(triangle.id)
        expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Triangle)
        expect(elNotSelected.getAttribute("filter")).toBeFalsy()
        triangle.selected = true
        const elSelected = renderer.getSymbolElement(triangle)!
        expect(elSelected.getAttribute("id")).toEqual(triangle.id)
        expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Triangle)
        expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
      })
      test("should getSymbolElement when deleting", () =>
      {
        const origin: TPoint = { x: 1, y: 1 }
        const target: TPoint = { x: 11, y: 11 }
        const triangle = OIShapeTriangle.createFromLine({}, origin, target)
        const elNotSelected = renderer.getSymbolElement(triangle)!
        expect(elNotSelected.getAttribute("id")).toEqual(triangle.id)
        expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Triangle)
        expect(elNotSelected.getAttribute("filter")).toBeFalsy()
        triangle.deleting = true
        const elSelected = renderer.getSymbolElement(triangle)!
        expect(elSelected.getAttribute("id")).toEqual(triangle.id)
        expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
        expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Triangle)
        expect(elSelected.getAttribute("filter")).toEqual(`url(#${ removalFilterId })`)
      })
    })
  })

  describe("edge", () =>
  {
    describe("line", () =>
    {
      test("should getSymbolElement with style", () =>
      {
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const start: TPoint = { x: 1, y: 1 }
        const end: TPoint = { x: 11, y: 11 }
        const line = new OIEdgeLine(style, start, end)
        const el = renderer.getSymbolElement(line)!
        expect(el.getAttribute("id")).toEqual(line.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(el.getAttribute("kind")).toEqual(EdgeKind.Line)
        expect(el.getAttribute("stroke")).toEqual(style.color)
        expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
      })
      test("should getSymbolElement with default style", () =>
      {
        const start: TPoint = { x: 1, y: 1 }
        const end: TPoint = { x: 11, y: 11 }
        const line = new OIEdgeLine({}, start, end)
        const el = renderer.getSymbolElement(line)!
        expect(el.getAttribute("id")).toEqual(line.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
        expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
      })
      test("should getSymbolElement with startDecoration", () =>
      {
        const start: TPoint = { x: 1, y: 1 }
        const end: TPoint = { x: 11, y: 11 }
        const line = new OIEdgeLine(DefaultStyle, start, end, EdgeDecoration.Arrow)
        const el = renderer.getSymbolElement(line)!
        expect(el.getAttribute("id")).toEqual(line.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(el.getAttribute("marker-start")).toEqual(`url(#${ arrowStartDecoration })`)
      })
      test("should getSymbolElement with endDecoration", () =>
      {
        const start: TPoint = { x: 1, y: 1 }
        const end: TPoint = { x: 11, y: 11 }
        const line = new OIEdgeLine(DefaultStyle, start, end, undefined, EdgeDecoration.Arrow)
        const el = renderer.getSymbolElement(line)!
        expect(el.getAttribute("id")).toEqual(line.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(el.getAttribute("marker-end")).toEqual(`url(#${ arrowEndDecoration })`)
      })
      test("should getSymbolElement with startDecoration & endDecoration", () =>
      {
        const start: TPoint = { x: 1, y: 1 }
        const end: TPoint = { x: 11, y: 11 }
        const line = new OIEdgeLine(DefaultStyle, start, end, EdgeDecoration.Arrow, EdgeDecoration.Arrow)
        const el = renderer.getSymbolElement(line)!
        expect(el.getAttribute("id")).toEqual(line.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(el.getAttribute("marker-start")).toEqual(`url(#${ arrowStartDecoration })`)
        expect(el.getAttribute("marker-end")).toEqual(`url(#${ arrowEndDecoration })`)
      })
      test("should getSymbolElement when selected", () =>
      {
        const start: TPoint = { x: 1, y: 1 }
        const end: TPoint = { x: 11, y: 11 }
        const line = new OIEdgeLine(DefaultStyle, start, end)
        const elNotSelected = renderer.getSymbolElement(line)!
        expect(elNotSelected.getAttribute("id")).toEqual(line.id)
        expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(elNotSelected.getAttribute("filter")).toBeFalsy()
        line.selected = true
        const elSelected = renderer.getSymbolElement(line)!
        expect(elSelected.getAttribute("id")).toEqual(line.id)
        expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
      })
      test("should getSymbolElement when deleting", () =>
      {
        const start: TPoint = { x: 1, y: 1 }
        const end: TPoint = { x: 11, y: 11 }
        const line = new OIEdgeLine(DefaultStyle, start, end)
        const elNotSelected = renderer.getSymbolElement(line)!
        expect(elNotSelected.getAttribute("id")).toEqual(line.id)
        expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(elNotSelected.getAttribute("filter")).toBeFalsy()
        line.deleting = true
        const elSelected = renderer.getSymbolElement(line)!
        expect(elSelected.getAttribute("id")).toEqual(line.id)
        expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(elSelected.getAttribute("filter")).toEqual(`url(#${ removalFilterId })`)
      })
    })

    describe("arc", () =>
    {
      test("should getSymbolElement with style", () =>
      {
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const center: TPoint = { x: 1, y: 1 }
        const startAngle = Math.PI / 4
        const sweepAngle = Math.PI
        const radiusX = 10
        const radiusY = 50
        const phi = 0
        const arc = new OIEdgeArc(style, center, startAngle, sweepAngle, radiusX, radiusY, phi)
        const el = renderer.getSymbolElement(arc)!
        expect(el.getAttribute("id")).toEqual(arc.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(el.getAttribute("kind")).toEqual(EdgeKind.Arc)
        expect(el.getAttribute("stroke")).toEqual(style.color)
        expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
      })
      test("should getSymbolElement with default style", () =>
      {
        const arc = new OIEdgeArc({}, { x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0)
        const el = renderer.getSymbolElement(arc)!
        expect(el.getAttribute("id")).toEqual(arc.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
        expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
      })
      test("should getSymbolElement with startDecoration", () =>
      {
        const arc = new OIEdgeArc({}, { x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0, EdgeDecoration.Arrow)
        const el = renderer.getSymbolElement(arc)!
        expect(el.getAttribute("id")).toEqual(arc.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(el.getAttribute("marker-start")).toEqual(`url(#${ arrowStartDecoration })`)
      })
      test("should getSymbolElement with endDecoration", () =>
      {
        const arc = new OIEdgeArc({}, { x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0, undefined, EdgeDecoration.Arrow)
        const el = renderer.getSymbolElement(arc)!
        expect(el.getAttribute("id")).toEqual(arc.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(el.getAttribute("marker-end")).toEqual(`url(#${ arrowEndDecoration })`)
      })
      test("should getSymbolElement with startDecoration & endDecoration", () =>
      {
        const arc = new OIEdgeArc({}, { x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0, EdgeDecoration.Arrow, EdgeDecoration.Arrow)
        const el = renderer.getSymbolElement(arc)!
        expect(el.getAttribute("id")).toEqual(arc.id)
        expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(el.getAttribute("marker-start")).toEqual(`url(#${ arrowStartDecoration })`)
        expect(el.getAttribute("marker-end")).toEqual(`url(#${ arrowEndDecoration })`)
      })
      test("should getSymbolElement when selected", () =>
      {
        const arc = new OIEdgeArc({}, { x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0)
        const elNotSelected = renderer.getSymbolElement(arc)!
        expect(elNotSelected.getAttribute("id")).toEqual(arc.id)
        expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(elNotSelected.getAttribute("filter")).toBeFalsy()
        arc.selected = true
        const elSelected = renderer.getSymbolElement(arc)!
        expect(elSelected.getAttribute("id")).toEqual(arc.id)
        expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
      })
      test("should getSymbolElement when deleting", () =>
      {
        const arc = new OIEdgeArc({}, { x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0)
        const elNotSelected = renderer.getSymbolElement(arc)!
        expect(elNotSelected.getAttribute("id")).toEqual(arc.id)
        expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(elNotSelected.getAttribute("filter")).toBeFalsy()
        arc.deleting = true
        const elSelected = renderer.getSymbolElement(arc)!
        expect(elSelected.getAttribute("id")).toEqual(arc.id)
        expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
        expect(elSelected.getAttribute("filter")).toEqual(`url(#${ removalFilterId })`)
      })
    })
  })

  describe("eraser", () =>
  {
    test("should getSVGElement for eraser", () =>
    {
      const eraserSym = new OIEraser()
      eraserSym.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
      eraserSym.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
      const el = renderer.getSymbolElement(eraserSym)!
      expect(el.getAttribute("id")).toEqual(eraserSym.id)
      expect(el.getAttribute("type")).toEqual("eraser")
      expect(el.getAttribute("stroke")).toEqual("grey")
      expect(el.getAttribute("stroke-width")).toEqual("12")
    })
  })

  describe("group", () =>
  {
    test("should getSVGElement for group", () =>
    {
      const stroke = new OIStroke({})
      stroke.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
      stroke.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
      const groupSym = new OISymbolGroup({}, [stroke])
      const el = renderer.getSymbolElement(groupSym)!
      expect(el.getAttribute("id")).toEqual(groupSym.id)
      expect(el.getAttribute("type")).toEqual("group")
    })
  })
})
