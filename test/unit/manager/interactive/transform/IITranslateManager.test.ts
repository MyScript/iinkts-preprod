import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIIMath, buildIIStroke, buildIIText, expectDerivedFieldsSettled, expectPointsRounded } from "../../../helpers"
import {
  DecoratorKind,
  DecoratorOps,
  DefaultHistoryConfiguration,
  EdgeLineOps,
  IIConnectorManager,
  IIHistoryManager,
  IITranslateManager,
  MatrixTransform,
  OBBOps,
  ShapeCircleOps,
  ShapePolygonOps,
  StrokeOps,
  SvgElementRole,
  TDecorator,
  TEdgeLine,
  TPoint,
  TShapeCircle,
  TShapePolygon,
  TStroke,
  SymbolUtil,
  TBaseSymbol,
  TPartialDeep,
  TResizeContext,
  TRotateContext,
  TTranslateContext,
  applyMatrixToPoint,
  symbolRegistry,
  TSymbol,
} from "@/iink"

describe("IITranslateManager.ts", () => {
  test("should create", () => {
    const canvas = createCanvasMock()
    const manager = new IITranslateManager(asCanvas(canvas))
    expect(manager).toBeDefined()
  })

  describe("should applyToSymbol", () => {
    const canvas = createCanvasMock()
    const manager = new IITranslateManager(asCanvas(canvas))

    test("translate stroke", () => {
      const stroke = StrokeOps.create()
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      StrokeOps.addPointer(stroke, { p: 1, t: 10, x: 10, y: 0 })
      const matrix = MatrixTransform.identity().translate(10, 15)
      manager.applyToSymbol(stroke, matrix)
      expect(stroke.pointers[0]).toEqual(expect.objectContaining({ x: 11, y: 16 }))
      expect(stroke.pointers[1]).toEqual(expect.objectContaining({ x: 20, y: 15 }))
    })
    test("translate shape Circle", () => {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const circle = ShapeCircleOps.create(center, radius)
      const matrix = MatrixTransform.identity().translate(10, 15)
      manager.applyToSymbol(circle, matrix)
      expect(circle.radius).toEqual(radius)
      expect(circle.center).toEqual({ x: 15, y: 20 })
    })
    test("translate shape with kind unknown", () => {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 0 },
      ]
      const poly = ShapePolygonOps.create(points)
      //@ts-ignore
      poly.kind = "pouet"
      const matrix = MatrixTransform.identity().translate(10, 15)
      // IIC-2011 moved the refusal from the manager's switch to the family util's kind table, so
      // the wording is now the one every other table lookup uses — and it no longer stringifies the
      // whole symbol into the message. Rotation and resize keep the old wording until IIC-2012 and
      // IIC-2013 move them too.
      expect(() => manager.applyToSymbol(poly, matrix)).toThrow(
        'Unable to translate shape, kind: "pouet" is unknown'
      )
    })
    test("should not translate edge with kind unknown", () => {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const edge = EdgeLineOps.create(start, end)
      //@ts-ignore
      edge.kind = "pouet"
      const matrix = MatrixTransform.identity().translate(10, 15)
      // IIC-2011 moved the refusal from the manager's switch to the family util's kind table, so
      // the wording is now the one every other table lookup uses — and it no longer stringifies the
      // whole symbol into the message. Rotation and resize keep the old wording until IIC-2012 and
      // IIC-2013 move them too.
      expect(() => manager.applyToSymbol(edge, matrix)).toThrow(
        'Unable to translate edge, kind: "pouet" is unknown'
      )
    })
    test("translate edge Line", () => {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = EdgeLineOps.create(start, end)
      const matrix = MatrixTransform.identity().translate(10, 15)
      manager.applyToSymbol(line, matrix)
      expect(line.start).toEqual(expect.objectContaining({ x: 10, y: 15 }))
      expect(line.end).toEqual(expect.objectContaining({ x: 10, y: 20 }))
    })
  })

  describe("translate process on stroke without snap", () => {
    const canvas = createCanvasMock()
    canvas.snaps.snapConfiguration.guide = false
    canvas.snaps.snapConfiguration.symbol = false
    canvas.client.init = jest.fn(() => Promise.resolve())
    canvas.client.transformTranslate = jest.fn(() => Promise.resolve())
    canvas.renderer.setAttribute = jest.fn()
    canvas.renderer.drawSymbol = jest.fn()

    const manager = new IITranslateManager(asCanvas(canvas))
    manager.applyToSymbol = jest.fn()

    const strokeOrigin = StrokeOps.create({})
    StrokeOps.addPointer(strokeOrigin, { p: 1, t: 1, x: 0, y: 0 })
    StrokeOps.addPointer(strokeOrigin, { p: 1, t: 1, x: 10, y: 50 })
    canvas.model.addSymbol(strokeOrigin)
    canvas.model.selectSymbol(strokeOrigin.id)

    const translationOrigin: TPoint = {
      x: OBBOps.toBox(strokeOrigin.bounds).x + strokeOrigin.bounds.width / 2,
      y: OBBOps.toBox(strokeOrigin.bounds).y + strokeOrigin.bounds.height / 2,
    }

    const testDatas = [
      {
        translateToPoint: { x: translationOrigin.x, y: translationOrigin.y + 10 },
        tx: 0,
        ty: 10,
      },
      {
        translateToPoint: { x: translationOrigin.x + 10, y: translationOrigin.y },
        tx: 10,
        ty: 0,
      },
      {
        translateToPoint: { x: translationOrigin.x + 20, y: translationOrigin.y + 25 },
        tx: 20,
        ty: 25,
      },
    ]

    beforeAll(async () => {
      await canvas.init()
    })

    testDatas.forEach((data) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("id", "group-id")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const translateElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      group.appendChild(translateElement)

      test(`should start with tx: "${data.tx} & ty ${data.ty}`, () => {
        manager.start(translateElement, translationOrigin)

        expect(manager.interactElementsGroup).toEqual(group)
        expect(manager.transformOrigin).toEqual(translationOrigin)
        expect(canvas.startOperation).toHaveBeenCalledWith("Translating")
      })
      test(`shoud continu with tx: "${data.tx} & ty ${data.ty}`, () => {
        expect(manager.continue(data.translateToPoint)).toEqual({ tx: data.tx, ty: data.ty })

        expect(canvas.renderer.setAttribute).toHaveBeenNthCalledWith(
          1,
          group.id,
          "transform",
          `translate(${data.tx},${data.ty})`
        )
        expect(canvas.renderer.setAttribute).toHaveBeenNthCalledWith(
          2,
          strokeOrigin.id,
          "transform",
          `translate(${data.tx},${data.ty})`
        )
      })
      test(`shoud end with tx: "${data.tx} & ty ${data.ty}`, async () => {
        const endPromise = manager.end(data.translateToPoint)
        // Must be ended synchronously, before the backend round-trip below even resolves -
        // IISynchronizerManager's write-idle gate polls this same flag.
        expect(canvas.endOperation).toHaveBeenCalledWith("Translating")
        await endPromise

        const newStroke = canvas.model.getRootSymbol(strokeOrigin.id) as TStroke
        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(newStroke)
        expect(canvas.client.transformTranslate).toHaveBeenCalledTimes(1)
        expect(canvas.client.transformTranslate).toHaveBeenCalledWith([newStroke.id], data.tx, data.ty)
        expect(strokeOrigin).not.toEqual(newStroke)
      })
    })
  })

  describe("ghost strokes follow a selected math block during translate", () => {
    function buildMathStroke(jiixBlockId: string) {
      const stroke = buildIIStroke()
      stroke.jiixBlockType = "Math"
      stroke.jiixBlockId = jiixBlockId
      return stroke
    }

    function setupTarget() {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const target = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      group.appendChild(target)
      return target
    }

    test("continue() live-translates the block's ghost stroke element", () => {
      const canvas = createCanvasMock()
      canvas.math.getGhostStrokeIds = jest.fn().mockReturnValue(["ghost-1"])
      canvas.renderer.setAttribute = jest.fn()
      const manager = new IITranslateManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)
      canvas.model.selectSymbol(stroke.id)

      manager.start(setupTarget(), { x: 0, y: 0 })
      manager.continue({ x: 10, y: 20 })

      expect(canvas.renderer.setAttribute).toHaveBeenCalledWith("ghost-1", "transform", "translate(10,20)")
    })

    test("translate() permanently applies the matrix to the block's ghost strokes", async () => {
      const canvas = createCanvasMock()
      canvas.math.applyTransformToGhostStrokes = jest.fn()
      const manager = new IITranslateManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)

      await manager.translate([stroke], 10, 20, false)

      expect(canvas.math.applyTransformToGhostStrokes).toHaveBeenCalledWith("block-1", expect.anything())
    })
  })

  describe("standalone decorator bounds follow translated targets", () => {
    test("translate() recomputes the decorator's bounds from its (moved) target symbols", async () => {
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))

      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      const decorator = DecoratorOps.create(DecoratorKind.Highlight, {}, [stroke.id], OBBOps.toBox(stroke.bounds))
      canvas.model.addSymbol(decorator)
      const centerBefore = { ...decorator.bounds.center }

      await manager.translate([stroke], 10, 20, false)

      const newDeco = canvas.model.getRootSymbol(decorator.id) as TDecorator
      expect(newDeco.bounds.center).toEqual(
        expect.objectContaining({ x: centerBefore.x + 10, y: centerBefore.y + 20 })
      )
    })

    test("translate() leaves other decorators (not targeting a moved symbol) untouched", async () => {
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))

      const movedStroke = buildIIStroke()
      const otherStroke = buildIIStroke()
      canvas.model.addSymbol(movedStroke)
      canvas.model.addSymbol(otherStroke)
      const decorator = DecoratorOps.create(
        DecoratorKind.Highlight,
        {},
        [otherStroke.id],
        OBBOps.toBox(otherStroke.bounds)
      )
      canvas.model.addSymbol(decorator)
      const centerBefore = { ...decorator.bounds.center }

      await manager.translate([movedStroke], 10, 20, false)

      expect(decorator.bounds.center).toEqual(centerBefore)
    })

    test("translate() shifts the decorator's baseline vertically along with its target stroke", async () => {
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))

      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      const decorator = DecoratorOps.create(DecoratorKind.Underline, {}, [stroke.id], OBBOps.toBox(stroke.bounds))
      decorator.baseline = 100
      decorator.xHeight = 8
      canvas.model.addSymbol(decorator)

      await manager.translate([stroke], 0, 50, false)

      const newDeco = canvas.model.getRootSymbol(decorator.id) as TDecorator
      expect(newDeco.baseline).toBe(150)
    })
  })

  describe("raw single-anchor edge stroke follows a translated block through the full commit path", () => {
    /**
     * Wires a real IIConnectorManager (the stub would no-op) plus a shape and a raw Edge stroke
     * anchored to it, so the follow-on-transform commit path runs for real.
     */
    function setupShapeWithConnectedEdgeStroke(canvas: ReturnType<typeof createCanvasMock>) {
      // `connector` is readonly on TInteractiveInkCanvas; swap the stub for a real instance
      // wired to this same canvas mock, mirroring the cast pattern createCanvasMock.ts itself
      // uses to configure otherwise-readonly/auto-stubbed manager properties for tests.
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))

      const shape = ShapeCircleOps.create({ x: 50, y: 50 }, 20)
      canvas.model.addSymbol(shape)
      // The gradient-follow direction resolves the connected block's center via
      // jiix.getStrokesForElement + model.getRootSymbol — here the "block" is just the shape itself.
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockImplementation((id) => (id === shape.id ? [shape.id] : []))

      const edgeStroke = StrokeOps.create()
      edgeStroke.pointers = [
        { x: 0, y: 0, t: 0, p: 1 },
        { x: 10, y: 0, t: 1, p: 1 },
      ]
      edgeStroke.jiixBlockType = "Edge"
      edgeStroke.endAnchor = { symbolId: shape.id, normalizedX: 1, normalizedY: 0.5 }
      StrokeOps.updateBounds(edgeStroke)
      canvas.model.addSymbol(edgeStroke)

      return { shape, edgeStroke }
    }

    test("translate() applies the matrix ONCE when the edge stroke is selected together with its shape", async () => {
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))
      const { shape, edgeStroke } = setupShapeWithConnectedEdgeStroke(canvas)

      // Both symbols dragged together: the direct-transform path owns the edge stroke, so the
      // rigid-follow pass must not apply the same matrix a second time.
      await manager.translate([shape, edgeStroke], 5, 5, false)

      // Read the model, not the object passed in: the transform commits a draft rather than
      // mutating the committed record, so the local reference is a pre-transform snapshot.
      const movedEdgeStroke = canvas.model.getRootSymbol(edgeStroke.id) as TStroke
      expect(movedEdgeStroke.pointers[0]).toEqual(expect.objectContaining({ x: 5, y: 5 }))
      expect(movedEdgeStroke.pointers[1]).toEqual(expect.objectContaining({ x: 15, y: 5 }))
    })

    test("translate() records the followed edge stroke's pre-transform snapshot in history so undo restores its points", async () => {
      const canvas = createCanvasMock()
      const history = new IIHistoryManager(DefaultHistoryConfiguration, canvas.event)
      ;(canvas as unknown as { history: IIHistoryManager }).history = history
      const manager = new IITranslateManager(asCanvas(canvas))
      const { shape, edgeStroke } = setupShapeWithConnectedEdgeStroke(canvas)
      history.init(canvas.model)
      canvas.model.selectSymbol(shape.id)
      const pointersBefore = edgeStroke.pointers.map((p) => ({ ...p }))

      await manager.translate([shape], 5, 5)

      const newEdgeStroke = canvas.model.getRootSymbol(edgeStroke.id) as TStroke
      // This connection is gradient-followed (single anchor, shape moving): point[1] (10,0) is
      // nearest the shape's center (50,50) → full weight; point[0] is farthest → unchanged.
      expect(newEdgeStroke.pointers[0]).toEqual(expect.objectContaining({ x: 0, y: 0 }))
      expect(newEdgeStroke.pointers[1]).toEqual(expect.objectContaining({ x: 15, y: 5 }))

      // Gradient moves aren't uniform, so undo can't just re-apply an inverse matrix — it must
      // restore the pre-transform snapshot recorded in `changes.updated` instead. Replay the way
      // InteractiveInkCanvas.#applyHistoryChanges does: `updated` first, then `translate`.
      const undoChanges = history.undo()
      undoChanges.updated?.newSymbols.forEach((sym) => canvas.model.updateSymbol(sym))
      undoChanges.translate?.forEach((tr) => {
        manager.applyMatrix(tr.symbols, MatrixTransform.identity().translate(tr.tx, tr.ty))
      })

      const restoredEdgeStroke = canvas.model.getRootSymbol(edgeStroke.id) as typeof edgeStroke
      expect(restoredEdgeStroke.pointers[0]).toEqual(
        expect.objectContaining({ x: pointersBefore[0].x, y: pointersBefore[0].y })
      )
      expect(restoredEdgeStroke.pointers[1]).toEqual(
        expect.objectContaining({ x: pointersBefore[1].x, y: pointersBefore[1].y })
      )
    })

    test("translate() moving a shape with a converted, anchored edge is undo-safe (the originally reported bug)", async () => {
      // Reproduces the exact scenario reported: move a shape connected to an already-converted
      // (anchored) edge, then undo — the shape must go back AND the edge must go back with it.
      const canvas = createCanvasMock()
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      const history = new IIHistoryManager(DefaultHistoryConfiguration, canvas.event)
      ;(canvas as unknown as { history: IIHistoryManager }).history = history
      const manager = new IITranslateManager(asCanvas(canvas))

      const shape = ShapeCircleOps.create({ x: 50, y: 50 }, 20)
      canvas.model.addSymbol(shape)

      const edge = EdgeLineOps.create({ x: 0, y: 0 }, { x: 100, y: 100 })
      edge.endAnchor = { symbolId: shape.id, normalizedX: 0.5, normalizedY: 0.5 }
      canvas.model.addSymbol(edge)

      history.init(canvas.model)
      canvas.model.selectSymbol(shape.id)
      const endBefore = { ...edge.end }

      await manager.translate([shape], 20, 20)

      const newEdge = canvas.model.getRootSymbol(edge.id) as TEdgeLine
      // Anchor recomputed from the shape's new bounds center (70,70), not translated by (20,20).
      expect(newEdge.end).toEqual({ x: 70, y: 70 })
      expect(newEdge.end).not.toEqual(endBefore)

      // Replay the undo diff the way InteractiveInkCanvas.#applyHistoryChanges does: `updated`
      // (restores the edge's snapshot directly) then `translate` (inverse-translates the shape).
      const undoChanges = history.undo()
      undoChanges.updated?.newSymbols.forEach((sym) => canvas.model.updateSymbol(sym))
      undoChanges.translate?.forEach((tr) => {
        manager.applyMatrix(tr.symbols, MatrixTransform.identity().translate(tr.tx, tr.ty))
      })

      const restoredShape = canvas.model.getRootSymbol(shape.id) as typeof shape
      const restoredEdge = canvas.model.getRootSymbol(edge.id) as typeof edge
      expect(restoredShape.center).toEqual({ x: 50, y: 50 })
      expect(restoredEdge.end).toEqual(endBefore)
    })

    test("translate() sends the followed edge stroke's new content via replaceStrokes, not the backend transform", async () => {
      const canvas = createCanvasMock()
      canvas.client.transformTranslate = jest.fn(() => Promise.resolve())
      canvas.client.replaceStrokes = jest.fn(() => Promise.resolve())
      const manager = new IITranslateManager(asCanvas(canvas))
      const { shape, edgeStroke } = setupShapeWithConnectedEdgeStroke(canvas)

      await manager.translate([shape], 5, 5, false)

      // Gradient-followed (single anchor): reshaped non-uniformly, so its full new content must
      // be replaced on the backend, not folded into a uniform transformTranslate call.
      const sentIds = (canvas.client.transformTranslate as jest.Mock).mock.calls[0][0] as string[]
      expect(sentIds).not.toContain(edgeStroke.id)

      const newEdgeStroke = canvas.model.getRootSymbol(edgeStroke.id) as TStroke
      expect(canvas.client.replaceStrokes).toHaveBeenCalledWith([edgeStroke.id], [newEdgeStroke])
    })

    test("translate() commits the exact same gradient shape the drag preview showed (no pointerup snap)", async () => {
      // Regression: the preview pass (drawAnchoredEdgesForMatrix, called from continue() before
      // the shape has moved) and the commit pass (updateAnchoredEdges, called from translate()
      // after applyAndDraw already moved the shape) must resolve the gradient's target center
      // from the SAME pre-transform position, or the committed stroke jumps to a different
      // shape than what was just shown while dragging. Needs a 3rd, non-extreme point: with
      // only 2 points both always land exactly on the group's min/max (weight 0 or 1 no matter
      // which center is used), so the drift this test guards against wouldn't show up.
      const canvas = createCanvasMock()
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      const manager = new IITranslateManager(asCanvas(canvas))

      const shape = ShapeCircleOps.create({ x: 50, y: 50 }, 20)
      canvas.model.addSymbol(shape)
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockImplementation((id) => (id === shape.id ? [shape.id] : []))

      const edgeStroke = StrokeOps.create()
      edgeStroke.pointers = [
        { x: 0, y: 0, t: 0, p: 1 },
        { x: 5, y: 0, t: 1, p: 1 },
        { x: 10, y: 0, t: 2, p: 1 },
      ]
      edgeStroke.jiixBlockType = "Edge"
      edgeStroke.endAnchor = { symbolId: shape.id, normalizedX: 1, normalizedY: 0.5 }
      StrokeOps.updateBounds(edgeStroke)
      canvas.model.addSymbol(edgeStroke)

      const matrix = MatrixTransform.identity().translate(30, 40)
      canvas.connector.drawAnchoredEdgesForMatrix([shape.id], matrix)
      const previewClone = (canvas.renderer.drawSymbol as jest.Mock).mock.calls.at(-1)![0] as typeof edgeStroke
      const previewPointers = previewClone.pointers.map((p) => ({ ...p }))

      await manager.translate([shape], 30, 40, false)

      const newEdgeStroke = canvas.model.getRootSymbol(edgeStroke.id) as TStroke
      expect(newEdgeStroke.pointers).toEqual(previewPointers)
    })

    test("translate() moving a shape with a converted, anchored edge never sends the edge's id to the backend", async () => {
      // The backend only tracks raw ink strokes — a converted Line/PolyEdge/Arc symbol must
      // never appear in a client.transform* call, even though its anchor gets recomputed.
      const canvas = createCanvasMock()
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      canvas.client.transformTranslate = jest.fn(() => Promise.resolve())
      const manager = new IITranslateManager(asCanvas(canvas))

      const shape = ShapeCircleOps.create({ x: 50, y: 50 }, 20)
      canvas.model.addSymbol(shape)
      const edge = EdgeLineOps.create({ x: 0, y: 0 }, { x: 100, y: 100 })
      edge.endAnchor = { symbolId: shape.id, normalizedX: 0.5, normalizedY: 0.5 }
      canvas.model.addSymbol(edge)

      await manager.translate([shape], 20, 20, false)

      // The anchor was in fact recomputed (proves the connector ran, not a no-op).
      const newEdge = canvas.model.getRootSymbol(edge.id) as TEdgeLine
      expect(newEdge.end).toEqual({ x: 70, y: 70 })

      // Neither the shape nor the edge is raw ink once converted — nothing for the backend here.
      const sentIds = (canvas.client.transformTranslate as jest.Mock).mock.calls[0][0] as string[]
      expect(sentIds).not.toContain(edge.id)
      expect(sentIds).toEqual([])
    })

    test("translate() permanently mutates the connected edge stroke's points (not just a preview clone)", async () => {
      const canvas = createCanvasMock()
      // Use the real IIConnectorManager so this exercises updateAnchoredEdges' commit path for
      // real, not the connector stub — this is what the drag-preview-only test would have missed.
      // `connector` is readonly on TInteractiveInkCanvas; swap the stub for a real instance
      // wired to this same canvas mock, mirroring the cast pattern createCanvasMock.ts itself
      // uses to configure otherwise-readonly/auto-stubbed manager properties for tests.
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      const manager = new IITranslateManager(asCanvas(canvas))

      const shape = ShapeCircleOps.create({ x: 50, y: 50 }, 20)
      canvas.model.addSymbol(shape)
      // The gradient-follow direction resolves the connected block's center via
      // jiix.getStrokesForElement + model.getRootSymbol — here the "block" is just the shape itself.
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockImplementation((id) => (id === shape.id ? [shape.id] : []))

      const edgeStroke = StrokeOps.create()
      edgeStroke.pointers = [
        { x: 0, y: 0, t: 0, p: 1 },
        { x: 10, y: 0, t: 1, p: 1 },
      ]
      edgeStroke.jiixBlockType = "Edge"
      edgeStroke.endAnchor = { symbolId: shape.id, normalizedX: 1, normalizedY: 0.5 }
      StrokeOps.updateBounds(edgeStroke)
      canvas.model.addSymbol(edgeStroke)

      await manager.translate([shape], 5, 5, false)

      const newEdgeStroke = canvas.model.getRootSymbol(edgeStroke.id) as TStroke
      expect(newEdgeStroke.pointers[0]).toEqual(expect.objectContaining({ x: 0, y: 0 }))
      expect(newEdgeStroke.pointers[1]).toEqual(expect.objectContaining({ x: 15, y: 5 }))
    })
  })

  /**
   * IIC-2004 moved the derive out of each `case` and into one call after the switch, asking the
   * symbol's own util instead of a family dispatcher that re-resolved the kind. Deleting that one
   * call left every existing test in this file green, so these are what hold it.
   */
  describe("derived fields", () => {
    const canvas = createCanvasMock()
    const manager = new IITranslateManager(asCanvas(canvas))

    test("should leave a translated circle derived-consistent", () => {
      const circle = ShapeCircleOps.create({ x: 5, y: 5 }, 4)
      manager.applyToSymbol(circle, MatrixTransform.identity().translate(10, 15))
      expectDerivedFieldsSettled(circle)
    })

    test("should leave a translated line derived-consistent", () => {
      const line = EdgeLineOps.create({ x: 0, y: 0 }, { x: 10, y: 10 })
      manager.applyToSymbol(line, MatrixTransform.identity().translate(10, 15))
      expectDerivedFieldsSettled(line)
    })
  })

  /**
   * A translate by a third of a pixel: raw, every coordinate would keep seventeen decimals. IIC-2010
   * put all thirteen of the managers' raw `applyToPoint` sites on the rounding helper, and nothing
   * covered any of them — deleting the rounding outright left this whole file green.
   *
   * Each case names the geometry the transform writes. The derived fields are excluded on purpose:
   * see `expectPointsRounded`.
   */
  describe("coordinate rounding", () => {
    const canvas = createCanvasMock()
    const manager = new IITranslateManager(asCanvas(canvas))

    /** Each row names the geometry its own builder produced, so the narrowing is sound. */
    const CASES: [string, () => TSymbol, (symbol: TSymbol) => TPoint[]][] = [
      ["circle centre", () => ShapeCircleOps.create({ x: 5, y: 5 }, 4), (s) => [(s as TShapeCircle).center]],
      [
        "polygon points",
        () =>
          ShapePolygonOps.create([
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
          ]),
        (s) => (s as TShapePolygon).points,
      ],
      [
        "line endpoints",
        () => EdgeLineOps.create({ x: 0, y: 0 }, { x: 10, y: 10 }),
        (s) => [(s as TEdgeLine).start, (s as TEdgeLine).end],
      ],
      ["stroke pointers", () => buildIIStroke(), (s) => (s as TStroke).pointers],
    ]

    test.each(CASES)("%s should keep three decimals", (_name, build, stored) => {
      const symbol = build()
      manager.applyToSymbol(symbol, MatrixTransform.identity().translate(1 / 3, 1 / 3))
      expectPointsRounded(stored(symbol))
    })
  })

  /**
   * IIC-2011 moved translate onto each symbol's util. Two things about that move needed holding
   * that nothing held before: text and math reach a service rather than doing geometry, and a
   * symbol type the library does not know can now translate at all.
   */
  describe("translate through the util", () => {
    test.each([
      ["text", () => buildIIText({ point: { x: 0, y: 0 } })],
      ["math", () => buildIIMath()],
    ])("%s should be re-measured by the typeset service", (_name, build) => {
      // Not geometry: a typeset symbol's bounds come from drawing it hidden and reading getBBox(),
      // so the util is handed a port instead of computing them. Dropping the call left every test
      // in this file green before this one existed.
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))
      const symbol = build()
      manager.applyToSymbol(symbol, MatrixTransform.identity().translate(10, 15))
      expect(canvas.typeset.updateBounds).toHaveBeenCalledWith(symbol)
    })

    test.each([
      ["text", () => buildIIText({ point: { x: 1, y: 2 } })],
      ["math", () => buildIIMath("y=3x+2", { point: { x: 1, y: 2 } })],
    ])("%s should move its anchor point", (_name, build) => {
      // A typeset symbol stores a position and is otherwise measured, so its anchor point is the
      // whole of what a translate moves. Nothing asserted it: gutting the move left every test in
      // this file green, including the one that checks the typeset service was called.
      const symbol = build()
      const canvas = createCanvasMock()
      new IITranslateManager(asCanvas(canvas)).applyToSymbol(symbol, MatrixTransform.identity().translate(10, 15))
      expect(symbol.point).toEqual({ x: 11, y: 17 })
    })

    test("math should also move its stored bounds centre and its elements", () => {
      // Math carries more position than text: its own bounds centre, and one box per element. The
      // typeset service is stubbed here, so these are the raw moves rather than a re-measurement.
      const math = buildIIMath("y=3x+2", { point: { x: 1, y: 2 } })
      const centreBefore = { ...math.bounds.center }
      const elementBefore = { ...math.elements[0].bounds }
      const canvas = createCanvasMock()
      new IITranslateManager(asCanvas(canvas)).applyToSymbol(math, MatrixTransform.identity().translate(10, 15))
      expect(math.bounds.center).toEqual({ x: centreBefore.x + 10, y: centreBefore.y + 15 })
      expect(math.elements[0].bounds).toEqual({
        ...elementBefore,
        x: elementBefore.x + 10,
        y: elementBefore.y + 15,
      })
    })

    test("a symbol type the library does not know should translate", () => {
      // The point of the epic. It is reachable through the util now; `applyToSymbol` still throws
      // for an unregistered type, because the base's switch on `symbol.type` survives until
      // IIC-2014.
      type TStickyNote = TBaseSymbol & { type: "sticky-note"; point: TPoint }
      class StickyNoteUtil extends SymbolUtil<TStickyNote> {
        readonly type = "sticky-note"
        create(partial: TPartialDeep<TStickyNote>): TStickyNote {
          return partial as TStickyNote
        }
        updateDerivedFields(): void {}
        overlaps(): boolean {
          return false
        }
        translate(symbol: TStickyNote, { matrix }: TTranslateContext): void {
          symbol.point = applyMatrixToPoint(symbol.point, matrix)
        }
        rotate(symbol: TStickyNote, { matrix }: TRotateContext): void {
          symbol.point = applyMatrixToPoint(symbol.point, matrix)
        }
        resize(symbol: TStickyNote, { matrix }: TResizeContext): void {
          symbol.point = applyMatrixToPoint(symbol.point, matrix)
        }
        getSVGElement(): SVGGraphicsElement {
          return document.createElementNS("http://www.w3.org/2000/svg", "g")
        }
      }
      symbolRegistry.register(new StickyNoteUtil())

      const canvas = createCanvasMock()
      const sticky = { id: "n1", type: "sticky-note", point: { x: 1, y: 2 } } as unknown as TSymbol
      symbolRegistry
        .getUtilFor(sticky)
        .translate(sticky, { matrix: MatrixTransform.identity().translate(10, 15), typeset: canvas.typeset })

      expect((sticky as unknown as TStickyNote).point).toEqual({ x: 11, y: 17 })

      // Written in IIC-2011 asserting that `applyToSymbol` still refused this symbol, because the
      // base's `switch (symbol.type)` fell to a throwing default. IIC-2014 deleted that switch, so
      // the manager route works too — which is the whole point of the epic.
      new IITranslateManager(asCanvas(canvas)).applyToSymbol(sticky, MatrixTransform.identity().translate(1, 2))
      expect((sticky as unknown as TStickyNote).point).toEqual({ x: 12, y: 19 })
    })
  })
})
