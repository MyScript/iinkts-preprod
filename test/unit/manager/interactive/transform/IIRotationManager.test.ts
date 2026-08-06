import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../../helpers"
import {
  EdgeLineOps,
  IIConnectorManager,
  IIRotationManager,
  OBBOps,
  ShapeCircleOps,
  ShapePolygonOps,
  StrokeOps,
  SvgElementRole,
  TPoint,
  TStroke,
  computeRotatedPoint,
  convertDegreeToRadian,
  MatrixTransform,
} from "@/iink"

describe("IIRotationManager.ts", () => {
  test("should create", () => {
    const canvas = createCanvasMock()
    const manager = new IIRotationManager(asCanvas(canvas))
    expect(manager).toBeDefined()
  })

  describe("should applyToSymbol", () => {
    const canvas = createCanvasMock()
    canvas.typeset.updateBounds = jest.fn()
    canvas.renderer.setAttribute = jest.fn()
    const manager = new IIRotationManager(asCanvas(canvas))

    test("not rotate shape with kind unknown", () => {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 0 },
      ]
      const poly = ShapePolygonOps.create(points)
      //@ts-ignore
      poly.kind = "pouet"
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      expect(() => manager.applyToSymbol(poly, matrix)).toThrow(
        expect.objectContaining({ message: expect.stringContaining("Can't apply rotate on shape, kind unknown: ") })
      )
    })
    test("rotate stroke", () => {
      const stroke = StrokeOps.create()
      const origin: TPoint = { x: 0, y: 0 }
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      StrokeOps.addPointer(stroke, { p: 1, t: 10, x: 10, y: 0 })
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      manager.applyToSymbol(stroke, matrix)
      expect(stroke.pointers[0].x.toFixed(0)).toEqual("-1")
      expect(stroke.pointers[0].y.toFixed(0)).toEqual("1")
      expect(stroke.pointers[1].x.toFixed(0)).toEqual("0")
      expect(stroke.pointers[1].y.toFixed(0)).toEqual("10")
    })
    test("rotate a math solver-output (draw) stroke like a normal stroke", () => {
      const stroke = StrokeOps.create()
      stroke.isSolverOutput = true
      const origin: TPoint = { x: 0, y: 0 }
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      StrokeOps.addPointer(stroke, { p: 1, t: 10, x: 10, y: 0 })
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      manager.applyToSymbol(stroke, matrix)
      expect(stroke.pointers[0].x.toFixed(0)).toEqual("-1")
      expect(stroke.pointers[0].y.toFixed(0)).toEqual("1")
      expect(stroke.pointers[1].x.toFixed(0)).toEqual("0")
      expect(stroke.pointers[1].y.toFixed(0)).toEqual("10")
    })
    test("rotate shape Circle", () => {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const circle = ShapeCircleOps.create(center, radius)
      const origin: TPoint = { x: 1, y: 2 }
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      manager.applyToSymbol(circle, matrix)
      expect(circle.radius).toEqual(radius)
      expect(circle.center).toEqual({ x: -2, y: 6 })
    })
    test("rotate edge Line", () => {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = EdgeLineOps.create(start, end)
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      manager.applyToSymbol(line, matrix)
      expect(line.start.x.toFixed(0)).toEqual("0")
      expect(line.start.y.toFixed(0)).toEqual("0")
      expect(line.end.x.toFixed(0)).toEqual("-5")
      expect(line.end.y.toFixed(0)).toEqual("0")
    })
  })

  describe("rotate process on stroke", () => {
    const canvas = createCanvasMock()
    canvas.client.init = jest.fn(() => Promise.resolve())
    canvas.client.transformRotate = jest.fn(() => Promise.resolve())
    canvas.renderer.setAttribute = jest.fn()
    canvas.renderer.drawSymbol = jest.fn()

    const manager = new IIRotationManager(asCanvas(canvas))
    manager.applyToSymbol = jest.fn()

    const stroke = StrokeOps.create({})
    StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 0, y: 0 })
    StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 10, y: 50 })
    const strokeNotRotate = structuredClone(stroke)
    canvas.model.addSymbol(stroke)
    canvas.model.selectedIds.add(stroke.id)

    const rotateCenter: TPoint = {
      x: OBBOps.toBox(stroke.bounds).x + stroke.bounds.width / 2,
      y: OBBOps.toBox(stroke.bounds).y + stroke.bounds.height / 2,
    }
    const rotateOrigin: TPoint = {
      x: OBBOps.toBox(stroke.bounds).x + stroke.bounds.width / 2,
      y: OBBOps.toBox(stroke.bounds).y + stroke.bounds.height,
    }

    const testDatas = [
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, Math.PI / 5),
        angle: 324,
      },
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, Math.PI / 2),
        angle: 270,
      },
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, -Math.PI / 5),
        angle: 36,
      },
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, -Math.PI / 2),
        angle: 90,
      },
    ]

    beforeAll(async () => {
      await canvas.init()
    })

    testDatas.forEach((data) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("id", "group-id")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const rotateElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      rotateElement.setAttribute("cx", rotateOrigin.x.toString())
      rotateElement.setAttribute("cy", rotateOrigin.y.toString())
      group.appendChild(rotateElement)

      test(`should start with angle: "${data.angle}° `, () => {
        manager.start(rotateElement, rotateOrigin)

        expect(manager.interactElementsGroup).toEqual(group)
        expect(manager.center).toEqual(rotateCenter)
        expect(manager.origin).toEqual(rotateOrigin)
        expect(canvas.renderer.setAttribute).toHaveBeenNthCalledWith(
          1,
          group.id,
          "transform-origin",
          `${rotateCenter.x}px ${rotateCenter.y}px`
        )
        expect(canvas.renderer.setAttribute).toHaveBeenNthCalledWith(
          2,
          stroke.id,
          "transform-origin",
          `${rotateCenter.x}px ${rotateCenter.y}px`
        )
        expect(canvas.startOperation).toHaveBeenCalledWith("Rotating")
      })
      test(`shoud continu with angle: "${data.angle}°`, () => {
        expect(manager.continue(data.rotateToPoint)).toEqual(data.angle)

        expect(canvas.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform", `rotate(${data.angle})`)
        expect(canvas.renderer.setAttribute).toHaveBeenNthCalledWith(2, stroke.id, "transform", `rotate(${data.angle})`)
      })
      test(`shoud end with angle: "${data.angle}°`, async () => {
        const endPromise = manager.end(data.rotateToPoint)
        expect(canvas.endOperation).toHaveBeenCalledWith("Rotating")
        await endPromise

        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(canvas.client.transformRotate).toHaveBeenCalledTimes(1)
        expect(canvas.client.transformRotate).toHaveBeenCalledWith(
          [stroke.id],
          convertDegreeToRadian(data.angle),
          rotateCenter.x,
          rotateCenter.y
        )
        expect(stroke).not.toEqual(strokeNotRotate)
      })
    })
  })

  describe("ghost strokes follow a selected math block during rotation", () => {
    function buildMathStroke(jiixBlockId: string) {
      const stroke = buildIIStroke()
      stroke.jiixBlockType = "Math"
      stroke.jiixBlockId = jiixBlockId
      return stroke
    }

    function setupTarget(origin: TPoint) {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const target = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      target.setAttribute("cx", origin.x.toString())
      target.setAttribute("cy", origin.y.toString())
      group.appendChild(target)
      return target
    }

    test("continue() live-rotates the block's ghost stroke element", () => {
      const canvas = createCanvasMock()
      canvas.math.getGhostStrokeIds = jest.fn().mockReturnValue(["ghost-1"])
      canvas.renderer.setAttribute = jest.fn()
      const manager = new IIRotationManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)
      canvas.model.selectedIds.add(stroke.id)

      const origin: TPoint = {
        x: OBBOps.toBox(stroke.bounds).x + stroke.bounds.width / 2,
        y: OBBOps.toBox(stroke.bounds).y + stroke.bounds.height,
      }
      const center: TPoint = {
        x: OBBOps.toBox(stroke.bounds).x + stroke.bounds.width / 2,
        y: OBBOps.toBox(stroke.bounds).y + stroke.bounds.height / 2,
      }

      manager.start(setupTarget(origin), origin)
      manager.continue(computeRotatedPoint(origin, center, Math.PI / 2))

      expect(canvas.renderer.setAttribute).toHaveBeenCalledWith("ghost-1", "transform", expect.stringContaining("rotate("))
    })

    test("end() permanently applies the matrix to the block's ghost strokes", async () => {
      const canvas = createCanvasMock()
      canvas.client.transformRotate = jest.fn(() => Promise.resolve())
      canvas.math.applyTransformToGhostStrokes = jest.fn()
      const manager = new IIRotationManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)
      canvas.model.selectedIds.add(stroke.id)

      const origin: TPoint = {
        x: OBBOps.toBox(stroke.bounds).x + stroke.bounds.width / 2,
        y: OBBOps.toBox(stroke.bounds).y + stroke.bounds.height,
      }
      const center: TPoint = {
        x: OBBOps.toBox(stroke.bounds).x + stroke.bounds.width / 2,
        y: OBBOps.toBox(stroke.bounds).y + stroke.bounds.height / 2,
      }

      manager.start(setupTarget(origin), origin)
      await manager.end(computeRotatedPoint(origin, center, Math.PI / 2))

      expect(canvas.math.applyTransformToGhostStrokes).toHaveBeenCalledWith("block-1", expect.anything())
    })
  })

  describe("raw single-anchor edge stroke follows a rotated block through the full commit path", () => {
    test("end() sends the followed edge stroke's new content via replaceStrokes and snapshots it in history's updated entry", async () => {
      const canvas = createCanvasMock()
      // Real connector: the stub would no-op the rigid-follow commit path entirely.
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockReturnValue([])
      canvas.client.transformRotate = jest.fn(() => Promise.resolve())
      canvas.client.replaceStrokes = jest.fn(() => Promise.resolve())
      const manager = new IIRotationManager(asCanvas(canvas))

      const shape = ShapeCircleOps.create({ x: 50, y: 50 }, 20)
      canvas.model.addSymbol(shape)
      canvas.model.selectedIds.add(shape.id)

      const edgeStroke = StrokeOps.create()
      edgeStroke.pointers = [
        { x: 0, y: 0, t: 0, p: 1 },
        { x: 10, y: 0, t: 1, p: 1 },
      ]
      edgeStroke.jiixBlockType = "Edge"
      edgeStroke.endAnchor = { symbolId: shape.id, normalizedX: 1, normalizedY: 0.5 }
      StrokeOps.updateBounds(edgeStroke)
      canvas.model.addSymbol(edgeStroke)
      const originalPointers = edgeStroke.pointers.map((p) => ({ ...p }))

      const sb = OBBOps.toBox(shape.bounds)
      const origin: TPoint = { x: sb.x + shape.bounds.width / 2, y: sb.y + shape.bounds.height }
      const center: TPoint = { x: sb.x + shape.bounds.width / 2, y: sb.y + shape.bounds.height / 2 }
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const rotateElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      group.appendChild(rotateElement)

      manager.start(rotateElement, origin)
      await manager.end(computeRotatedPoint(origin, center, Math.PI / 2))

      // The edge stroke really moved with the shape...
      expect(edgeStroke.pointers).not.toEqual(originalPointers)
      // ...but it was reshaped non-uniformly (gradient-followed, single anchor), so it must never
      // be folded into the uniform transformRotate call — its full new content goes via replaceStrokes...
      const sentIds = (canvas.client.transformRotate as jest.Mock).mock.calls[0][0] as string[]
      expect(sentIds).not.toContain(edgeStroke.id)
      expect(canvas.client.replaceStrokes).toHaveBeenCalledWith([edgeStroke.id], [edgeStroke])
      // ...and history must hold its PRE-rotation snapshot for undo in `updated`, not the
      // `rotate` entry's own inverse-matrix-replay symbol list (a gradient shift has no inverse).
      const changes = (canvas.history.push as jest.Mock).mock.calls[0][0] as {
        rotate: { symbols: TStroke[] }[]
        updated?: { oldSymbols: TStroke[]; newSymbols: TStroke[] }
      }
      expect(changes.rotate[0].symbols.find((s) => s.id === edgeStroke.id)).toBeUndefined()
      const oldSnapshot = changes.updated?.oldSymbols.find((s) => s.id === edgeStroke.id)
      expect(oldSnapshot).toBeDefined()
      expect(oldSnapshot!.pointers).toEqual(originalPointers)
      expect(changes.updated?.newSymbols.find((s) => s.id === edgeStroke.id)).toBe(edgeStroke)
    })
  })
})
