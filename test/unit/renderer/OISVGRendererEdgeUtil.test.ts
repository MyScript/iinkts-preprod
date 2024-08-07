import { DefaultStyle, EdgeDecoration, EdgeKind, OIEdgeArc, OIEdgeLine, OIEdgePolyLine, OISVGRendererConst, OISVGRendererEdgeUtil, SymbolType, TPoint, TStyle } from "../../../src/iink"

describe("OISVGRendererEdgeUtil.ts", () =>
{
  test("should throw error if kind is unknow when getSVGPath", () =>
  {
    //@ts-ignore
    expect(() => OISVGRendererEdgeUtil.getSVGPath({ kind: "pouet" })).toThrow("Can't getSVGPath for edge cause kind is unknow: \"{\"kind\":\"pouet\"}\"")
  })

  test("should getSVGPath for line", () =>
  {
    const start: TPoint = { x: 1, y: 1 }
    const end: TPoint = { x: 11, y: 11 }
    const line = new OIEdgeLine(start, end)
    expect(OISVGRendererEdgeUtil.getSVGPath(line)).toEqual("M 1 1 L 11 11")
  })

  test("should getSVGPath for polyline", () =>
  {
    const points: TPoint[] = [
      { x: 1, y: 1 },
      { x: 11, y: 11 },
      { x: 111, y: 111 },
    ]
    const line = new OIEdgePolyLine(points)
    expect(OISVGRendererEdgeUtil.getSVGPath(line)).toEqual("M 1 1 L 1 1 L 11 11 L 111 111")
  })

  test("should getSVGPath for arc", () =>
  {
    const center: TPoint = { x: 1, y: 1 }
    const startAngle = Math.PI / 4
    const sweepAngle = Math.PI
    const radiusX = 10
    const radiusY = 50
    const phi = 0
    const arc = new OIEdgeArc(center, startAngle, sweepAngle, radiusX, radiusY, phi)
    expect(OISVGRendererEdgeUtil.getSVGPath(arc)).toEqual("M 8.071 36.355 Q 8.071 36.355 6.811 41.692 5.392 45.92 3.853 48.921 2.237 50.616 0.587 50.957 -1.052 49.936 -2.635 47.58 -4.119 43.953 -5.463 39.154 -6.631 33.315 -7.591 26.594 -8.316 19.175 -8.787 11.261 -8.991 3.066 -8.923 -5.185 -8.584 -13.267 -7.984 -20.96 -7.138 -28.054")
  })

  describe("getSVGElement", () =>
  {
    test("should get line with style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine(start, end, undefined, undefined, style)
      const el = OISVGRendererEdgeUtil.getSVGElement(line)!
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("kind")).toEqual(EdgeKind.Line)
      expect(el.getAttribute("stroke")).toEqual(style.color)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should get line with default style", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine(start, end)
      const el = OISVGRendererEdgeUtil.getSVGElement(line)!
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should get line with startDecoration", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine(start, end, EdgeDecoration.Arrow)
      const el = OISVGRendererEdgeUtil.getSVGElement(line)!
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("marker-start")).toEqual(`url(#${ OISVGRendererConst. arrowHeadStartMarker })`)
    })
    test("should get line with endDecoration", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine(start, end, undefined, EdgeDecoration.Arrow)
      const el = OISVGRendererEdgeUtil.getSVGElement(line)!
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("marker-end")).toEqual(`url(#${ OISVGRendererConst.arrowHeadEndMaker })`)
    })
    test("should get line with startDecoration & endDecoration", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine(start, end, EdgeDecoration.Arrow, EdgeDecoration.Arrow)
      const el = OISVGRendererEdgeUtil.getSVGElement(line)!
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("marker-start")).toEqual(`url(#${ OISVGRendererConst.arrowHeadStartMarker })`)
      expect(el.getAttribute("marker-end")).toEqual(`url(#${ OISVGRendererConst.arrowHeadEndMaker })`)
    })
    test("should get line when selected", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine(start, end)
      const elNotSelected = OISVGRendererEdgeUtil.getSVGElement(line)!
      expect(elNotSelected.getAttribute("id")).toEqual(line.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      line.selected = true
      const elSelected = OISVGRendererEdgeUtil.getSVGElement(line)!
      expect(elSelected.getAttribute("id")).toEqual(line.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ OISVGRendererConst.selectionFilterId })`)
    })
    test("should get line when deleting", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine(start, end)
      const elNotSelected = OISVGRendererEdgeUtil.getSVGElement(line)!
      expect(elNotSelected.getAttribute("id")).toEqual(line.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      line.deleting = true
      const elSelected = OISVGRendererEdgeUtil.getSVGElement(line)!
      expect(elSelected.getAttribute("id")).toEqual(line.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ OISVGRendererConst.removalFilterId })`)
    })
    test("should get arc with style", () =>
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
      const arc = new OIEdgeArc(center, startAngle, sweepAngle, radiusX, radiusY, phi, undefined, undefined, style)
      const el = OISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(el.getAttribute("id")).toEqual(arc.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("kind")).toEqual(EdgeKind.Arc)
      expect(el.getAttribute("stroke")).toEqual(style.color)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should get arc with default style", () =>
    {
      const arc = new OIEdgeArc({ x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0)
      const el = OISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(el.getAttribute("id")).toEqual(arc.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should get arc with startDecoration", () =>
    {
      const arc = new OIEdgeArc({ x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0, EdgeDecoration.Arrow)
      const el = OISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(el.getAttribute("id")).toEqual(arc.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("marker-start")).toEqual(`url(#${ OISVGRendererConst.arrowHeadStartMarker })`)
    })
    test("should get arc with endDecoration", () =>
    {
      const arc = new OIEdgeArc({ x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0, undefined, EdgeDecoration.Arrow)
      const el = OISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(el.getAttribute("id")).toEqual(arc.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("marker-end")).toEqual(`url(#${ OISVGRendererConst.arrowHeadEndMaker })`)
    })
    test("should get arc with startDecoration & endDecoration", () =>
    {
      const arc = new OIEdgeArc({ x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0, EdgeDecoration.Arrow, EdgeDecoration.Arrow)
      const el = OISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(el.getAttribute("id")).toEqual(arc.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("marker-start")).toEqual(`url(#${ OISVGRendererConst.arrowHeadStartMarker })`)
      expect(el.getAttribute("marker-end")).toEqual(`url(#${ OISVGRendererConst.arrowHeadEndMaker })`)
    })
    test("should get arc when selected", () =>
    {
      const arc = new OIEdgeArc({ x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0)
      const elNotSelected = OISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(elNotSelected.getAttribute("id")).toEqual(arc.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      arc.selected = true
      const elSelected = OISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(elSelected.getAttribute("id")).toEqual(arc.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ OISVGRendererConst.selectionFilterId })`)
    })
    test("should get arc when deleting", () =>
    {
      const arc = new OIEdgeArc({ x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0)
      const elNotSelected = OISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(elNotSelected.getAttribute("id")).toEqual(arc.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      arc.deleting = true
      const elSelected = OISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(elSelected.getAttribute("id")).toEqual(arc.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ OISVGRendererConst.removalFilterId })`)
    })
  })

})
