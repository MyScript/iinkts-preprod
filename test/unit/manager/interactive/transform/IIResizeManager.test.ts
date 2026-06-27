import { createEditorMock, asEditor } from "../../../__mocks__/createEditorMock"
import
{
  EdgeArcHelper,
  EdgeLineHelper,
  EdgePolyLineHelper,
  IIResizeManager,
  ShapeCircleHelper,
  ShapeEllipseHelper,
  ShapePolygonHelper,
  StrokeHelper,
  ResizeDirection,
  SvgElementRole,
  TSymbolChar,
  TPoint
} from "../../../../../src/iink"
import { MatrixTransform } from "../../../../../src/transform"
import { buildIIStroke } from "../../../helpers"
import { TextHelper } from "../../../../../src/symbol/text/Text"

describe("IIResizeManager.ts", () =>
{
  test("should create", () =>
  {
    const editor = createEditorMock()
    const manager = new IIResizeManager(asEditor(editor))
    expect(manager).toBeDefined()
  })

  describe("applyToSymbol", () =>
  {
    const editor = createEditorMock()
    const manager = new IIResizeManager(asEditor(editor))
    test("should not resize symbol with type unknown", () =>
    {
      const stroke = buildIIStroke()
      //@ts-ignore
      stroke.type = "pouet"
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      expect(() => manager.applyToSymbol(stroke, matrix)).toThrow(expect.objectContaining({ message: expect.stringContaining("Can't apply resize on symbol, type unknown:") }))
    })
    test("should resize stroke", () =>
    {
      const stroke = StrokeHelper.create()
      const origin: TPoint = { x: 1, y: 2 }
      StrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 1, y: 2 })
      StrokeHelper.addPointer(stroke, { p: 1, t: 10, x: 21, y: 42 })
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      manager.applyToSymbol(stroke, matrix)
      expect(stroke.pointers[0]).toEqual(expect.objectContaining({ x: 1, y: 2 }))
      expect(stroke.pointers[1]).toEqual(expect.objectContaining({ x: 41, y: 122 }))
    })
    test("should not resize shape with kind unknown", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 0 }
      ]
      const poly = ShapePolygonHelper.create(points)
      //@ts-ignore
      poly.kind = "pouet"
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      expect(() => manager.applyToSymbol(poly, matrix)).toThrow(expect.objectContaining({ message: expect.stringContaining("Can't apply resize on shape, kind unknown:") }))
    })
    test("should resize shape Circle", () =>
    {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const shape = ShapeCircleHelper.create(center, radius)
      const origin: TPoint = { x: 1, y: 2 }
      const matrix = MatrixTransform.identity().scale(2, 4, origin)
      manager.applyToSymbol(shape, matrix)
      expect(shape.radius).toEqual(12)
      expect(shape.center).toEqual({ x: 9, y: 14 })
    })
    test("should resize shape Ellipse", () =>
    {
      const center: TPoint = { x: 0, y: 0 }
      const radiusX = 50
      const radiusY = 10
      const orientation = 0
      const shape = ShapeEllipseHelper.create(center, radiusX, radiusY, orientation)
      const scaleX = 2
      const scaleY = 4
      const origin: TPoint = { x: shape.bounds.x, y: shape.bounds.y }
      manager.transformOrigin = origin
      const matrix = MatrixTransform.identity().scale(scaleX, scaleY, origin)
      manager.applyToSymbol(shape, matrix)
      expect(shape.radiusX).toEqual(radiusX * scaleX)
      expect(shape.radiusY).toEqual(radiusY * scaleY)
      expect(shape.center).toEqual({ x: 49.534, y: 29.931 })
    })
    test("should resize shape Polygon", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 0, y: 10 },
      ]
      const shape = ShapePolygonHelper.create(points)
      const scaleX = 2
      const scaleY = 4
      const origin: TPoint = { x: shape.bounds.x, y: shape.bounds.y }
      const matrix = MatrixTransform.identity().scale(scaleX, scaleY, origin)
      manager.applyToSymbol(shape, matrix)
      expect(shape.points[0].x).toEqual(0)
      expect(shape.points[0].y).toEqual(0)
      expect(shape.points[1].x).toEqual(40)
      expect(shape.points[1].y).toEqual(0)
      expect(shape.points[2].x).toEqual(40)
      expect(shape.points[2].y).toEqual(40)
      expect(shape.points[3].x).toEqual(0)
      expect(shape.points[3].y).toEqual(40)
    })
    test("should not resize edge with kind unknown", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const edge = EdgeLineHelper.create(start, end)
      //@ts-ignore
      edge.kind = "pouet"
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      expect(() => manager.applyToSymbol(edge, matrix)).toThrow(expect.objectContaining({ message: expect.stringContaining("Can't apply resize on edge, kind unknown:") }))
    })
    test("should resize edge Arc", () =>
    {
      const center: TPoint = { x: 0, y: 0 }
      const startAngle = -Math.PI
      const sweepAngle = Math.PI
      const radiusX = 50
      const radiusY = 10
      const phi = 0
      const edge = EdgeArcHelper.create(center, startAngle, sweepAngle, radiusX, radiusY, phi)
      const origin: TPoint = { x: edge.bounds.x, y: edge.bounds.y }
      const scaleX = 2
      const scaleY = 3
      manager.transformOrigin = origin
      const matrix = MatrixTransform.identity().scale(scaleX, scaleY, origin)
      manager.applyToSymbol(edge, matrix)
      expect(edge.center).toEqual({ x: 55, y: 29.796 })
      expect(edge.radiusX).toEqual(radiusX * scaleX)
      expect(edge.radiusY).toEqual(radiusY * scaleY)
    })
    test("resize edge Line", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const edge = EdgeLineHelper.create(start, end)
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      manager.applyToSymbol(edge, matrix)
      expect(edge.start).toEqual({ x: 0, y: 0 })
      expect(edge.end).toEqual({ x: 0, y: 15 })
    })
    test("resize edge PolyEdge", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 0, y: 10 },
      ]
      const edge = EdgePolyLineHelper.create(points)
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      manager.applyToSymbol(edge, matrix)
      expect(edge.points[0].x).toEqual(0)
      expect(edge.points[0].y).toEqual(0)
      expect(edge.points[1].x).toEqual(40)
      expect(edge.points[1].y).toEqual(0)
      expect(edge.points[2].x).toEqual(40)
      expect(edge.points[2].y).toEqual(30)
      expect(edge.points[3].x).toEqual(0)
      expect(edge.points[3].y).toEqual(30)
    })
    test("resize edge Text", () =>
    {
      editor.typeset.updateBounds = jest.fn()
      const point: TPoint = { x: 0, y: 0 }
      const chars: TSymbolChar[] = [
        {
          bounds: { height: 10, width: 5, x: 0, y: 0 },
          color: "black",
          fontSize: 12,
          fontWeight: "normal",
          id: "char-1",
          label: "A"
        }
      ]
      const text = TextHelper.create(chars, point, { height: 10, width: 5, x: 0, y: 0 })
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      manager.applyToSymbol(text, matrix)
      expect(text.point).toEqual({ x: 0, y: 0 })
      expect(chars[0].fontSize).toEqual(30)
      expect(editor.typeset.updateBounds).toHaveBeenCalledTimes(1)
    })
  })

  describe("resize process on stroke without snap", () =>
  {
    const editor = createEditorMock()
    editor.recognizer.init = jest.fn(() => Promise.resolve())
    editor.recognizer.transformScale = jest.fn(() => Promise.resolve())
    editor.renderer.setAttribute = jest.fn()
    editor.renderer.drawSymbol = jest.fn()
    editor.snaps.snapConfiguration.guide = false
    editor.snaps.snapConfiguration.symbol = false

    const manager = new IIResizeManager(asEditor(editor))
    manager.applyToSymbol = jest.fn()

    const stroke = StrokeHelper.create({})
    StrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 0, y: 0 })
    StrokeHelper.addPointer(stroke, { p: 1, t: 1, x: 10, y: 50 })
    const strokeNotResized = structuredClone(stroke)
    stroke.selected = true
    editor.model.addSymbol(stroke)

    const resizeToPoint: TPoint = {
      x: (stroke.bounds.x + stroke.bounds.width + stroke.bounds.x) / 4,
      y: (stroke.bounds.y + stroke.bounds.height + stroke.bounds.y) / 4
    }

    const testDatas = [
      {
        direction: ResizeDirection.North,
        transformOrigin: {
          x: stroke.bounds.x + stroke.bounds.width / 2,
          y: stroke.bounds.y + stroke.bounds.height
        },
        scale: {
          x: 1,
          y: 1 + (stroke.bounds.y - resizeToPoint.y) / stroke.bounds.height
        }
      },
      {
        direction: ResizeDirection.East,
        transformOrigin: {
          x: stroke.bounds.x,
          y: stroke.bounds.y + stroke.bounds.height / 2
        },
        scale: {
          x: 1 + (resizeToPoint.x - (stroke.bounds.x + stroke.bounds.width)) / stroke.bounds.width,
          y: 1
        }
      },
      {
        direction: ResizeDirection.South,
        transformOrigin: {
          x: stroke.bounds.x + stroke.bounds.width / 2,
          y: stroke.bounds.y
        },
        scale: {
          x: 1,
          y: 1 + (resizeToPoint.y - (stroke.bounds.y + stroke.bounds.height)) / stroke.bounds.height,
        }
      },
      {
        direction: ResizeDirection.West,
        transformOrigin: {
          x: stroke.bounds.x + stroke.bounds.width,
          y: stroke.bounds.y + stroke.bounds.height / 2
        },
        scale: {
          x: 1 + (stroke.bounds.x - resizeToPoint.x) / stroke.bounds.width,
          y: 1
        }
      },
      {
        direction: ResizeDirection.NorthEast,
        transformOrigin: {
          x: stroke.bounds.x,
          y: stroke.bounds.y + stroke.bounds.height
        },
        scale: {
          x: 1 + (resizeToPoint.x - (stroke.bounds.x + stroke.bounds.width)) / stroke.bounds.width,
          y: 1 + (stroke.bounds.y - resizeToPoint.y) / stroke.bounds.height
        }
      },
      {
        direction: ResizeDirection.NorthWest,
        transformOrigin: {
          x: stroke.bounds.x + stroke.bounds.width,
          y: stroke.bounds.y + stroke.bounds.height
        },
        scale: {
          x: 1 + (stroke.bounds.x - resizeToPoint.x) / stroke.bounds.width,
          y: 1 + (stroke.bounds.y - resizeToPoint.y) / stroke.bounds.height
        }
      },
      {
        direction: ResizeDirection.SouthEast,
        transformOrigin: {
          x: stroke.bounds.x,
          y: stroke.bounds.y
        },
        scale: {
          x: 1 + (resizeToPoint.x - (stroke.bounds.x + stroke.bounds.width)) / stroke.bounds.width,
          y: 1 + (resizeToPoint.y - (stroke.bounds.y + stroke.bounds.height)) / stroke.bounds.height,
        }
      },
      {
        direction: ResizeDirection.SouthWest,
        transformOrigin: {
          x: stroke.bounds.x + stroke.bounds.width,
          y: stroke.bounds.y
        },
        scale: {
          x: 1 + (stroke.bounds.x - resizeToPoint.x) / stroke.bounds.width,
          y: 1 + (resizeToPoint.y - (stroke.bounds.y + stroke.bounds.height)) / stroke.bounds.height,
        }
      },
    ]

    beforeAll(async () =>
    {
      await editor.init()
    })

    testDatas.forEach(data =>
    {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("id", "group-id")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const resizeElement = document.createElementNS("http://www.w3.org/2000/svg", "line")
      resizeElement.setAttribute("resize-direction", data.direction)
      group.appendChild(resizeElement)

      test(`should start with direction: "${ data.direction }" `, () =>
      {
        manager.start(resizeElement, data.transformOrigin)
        expect(manager.interactElementsGroup).toEqual(group)
        expect(manager.boundingBox).toEqual(stroke.bounds)
        expect(manager.direction).toEqual(data.direction)
        expect(manager.transformOrigin).toEqual(data.transformOrigin)
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform-origin", `${ data.transformOrigin.x }px ${ data.transformOrigin.y }px`)
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(2, stroke.id, "transform-origin", `${ data.transformOrigin.x }px ${ data.transformOrigin.y }px`)
      })
      test(`shoud continu with direction: "${ data.direction }"`, () =>
      {
        expect(manager.continue(resizeToPoint)).toEqual({ scaleX: data.scale.x, scaleY: data.scale.y })
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform", `scale(${ data.scale.x },${ data.scale.y })`)
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(2, stroke.id, "transform", `scale(${ data.scale.x },${ data.scale.y })`)
      })
      test(`shoud end with direction: "${ data.direction }"`, async () =>
      {
        await manager.end(resizeToPoint)
        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(editor.recognizer.transformScale).toHaveBeenCalledTimes(1)
        expect(editor.recognizer.transformScale).toHaveBeenCalledWith([stroke.id], data.scale.x, data.scale.y, data.transformOrigin.x, data.transformOrigin.y)
        expect(stroke).not.toEqual(strokeNotResized)
      })
    })
  })

})
