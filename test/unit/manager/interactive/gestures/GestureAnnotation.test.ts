import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIIMath, buildIIStroke, buildIIText } from "../../../helpers"
import { DecoratorKind, DefaultStyle, IIGestureAnnotationProcessor, OBBOps, StrokeUtil, SymbolGeometry, TDecorator, TGestureAnnotation, TMath, TStroke, TSymbolChar, TText, isStroke } from "@/iink"

describe("GestureAnnotation.ts", () => {
  describe("IIGestureAnnotationProcessor.apply (decorator)", () => {
    test("waits for a still-unclassified target stroke to be recognized before giving up", async () => {
      const canvas = createCanvasMock()
      const processor = new IIGestureAnnotationProcessor(asCanvas(canvas))

      const stroke = buildIIStroke()
      StrokeUtil.addPointer(stroke, { x: 10, y: 10, p: 1, dt: 100 })
      StrokeUtil.addPointer(stroke, { x: 20, y: 20, p: 1, dt: 200 })
      // Not classified yet — mirrors a freshly-written stroke whose own recognition
      // round-trip hasn't resolved yet (jiixBlockType assigned later, asynchronously).
      canvas.model.addSymbol(stroke)

      setTimeout(() => {
        // The document holds frozen records, so classify by committing a draft.
        const draft = canvas.model.draftSymbol(stroke.id)
        if (draft && isStroke(draft)) {
          draft.jiixBlockType = "Text"
          canvas.model.updateSymbol(draft)
        }
      }, 50)

      const changes = await processor.apply([stroke.id], {
        kind: "decorator",
        decoratorKind: DecoratorKind.Surround,
      })

      expect(changes?.added).toHaveLength(1)
      const decorator = canvas.model.symbols.find((s) => s.type === "decorator")
      expect(decorator).toBeDefined()
      expect((decorator as { targetIds: string[] }).targetIds).toContain(stroke.id)
    })

    test("gives up if the target stroke is never classified as text", async () => {
      const canvas = createCanvasMock()
      const processor = new IIGestureAnnotationProcessor(asCanvas(canvas))

      const stroke = buildIIStroke()
      StrokeUtil.addPointer(stroke, { x: 10, y: 10, p: 1, dt: 100 })
      StrokeUtil.addPointer(stroke, { x: 20, y: 20, p: 1, dt: 200 })
      canvas.model.addSymbol(stroke)

      const changes = await processor.apply([stroke.id], {
        kind: "decorator",
        decoratorKind: DecoratorKind.Surround,
      })

      expect(changes).toBeUndefined()
      expect(canvas.model.symbols.find((s) => s.type === "decorator")).toBeUndefined()
    }, 10000)
  })
  /**
   * Where the decorator is *drawn*. `targetBounds` is an input — a decorator holds no coordinates
   * of its own — so if nothing writes it here the underline has no box and renders at the origin.
   * Nothing covered this, which is why removing the two writers below looked free.
   */
  describe("IIGestureAnnotationProcessor.apply (decorator placement)", () => {
    function buildRecognizedStroke() {
      const stroke = buildIIStroke()
      StrokeUtil.addPointer(stroke, { x: 10, y: 10, p: 1, dt: 100 })
      StrokeUtil.addPointer(stroke, { x: 20, y: 20, p: 1, dt: 200 })
      stroke.jiixBlockType = "Text"
      return stroke
    }

    const applySurround = (canvas: ReturnType<typeof createCanvasMock>, id: string) =>
      new IIGestureAnnotationProcessor(asCanvas(canvas)).apply([id], {
        kind: "decorator",
        decoratorKind: DecoratorKind.Surround,
      })

    const decoratorIn = (canvas: ReturnType<typeof createCanvasMock>) =>
      canvas.model.symbols.find((sym) => sym.type === "decorator") as TDecorator | undefined

    test("takes the recognizer's word box when JIIX has one, in preference to the strokes' own", async () => {
      const canvas = createCanvasMock()
      const stroke = buildRecognizedStroke()
      canvas.model.addSymbol(stroke)
      // Deliberately unlike the stroke's own box: a word box is the recognizer's, tighter than the
      // union of the strokes it covers and not computable from them. Asserting a box that differs
      // is what distinguishes "took the word box" from "fell back to the targets".
      const wordBox = { x: 100, y: 200, width: 60, height: 12 }
      canvas.jiix.getWordGroupForStroke = jest.fn().mockReturnValue({
        wordKey: "word-1",
        allStrokeIds: [stroke.id],
        wordBounds: wordBox,
        baseline: 210,
        xHeight: 8,
      })

      await applySurround(canvas, stroke.id)

      const decorator = decoratorIn(canvas)
      expect(decorator?.targetBounds).toEqual(OBBOps.fromBox(wordBox))
      expect(decorator?.targetBounds).not.toEqual(SymbolGeometry.boundsOf(stroke))
      expect(decorator?.baseline).toBe(210)
      expect(decorator?.xHeight).toBe(8)
    })

    test("falls back to the union of its targets' boxes when JIIX has not answered yet", async () => {
      const canvas = createCanvasMock()
      const stroke = buildRecognizedStroke()
      canvas.model.addSymbol(stroke)
      canvas.jiix.getWordGroupForStroke = jest.fn().mockReturnValue(undefined)

      await applySurround(canvas, stroke.id)

      expect(decoratorIn(canvas)?.targetBounds).toEqual(SymbolGeometry.boundsOf(stroke))
    })
  })

  describe("IIGestureAnnotationProcessor.apply (grouped decorator)", () => {
    function buildRecognizedStroke(x: number) {
      const stroke = buildIIStroke()
      StrokeUtil.addPointer(stroke, { x, y: 10, p: 1, dt: 100 })
      StrokeUtil.addPointer(stroke, { x: x + 10, y: 20, p: 1, dt: 200 })
      stroke.jiixBlockType = "Text"
      return stroke
    }

    const applyGrouped = (canvas: ReturnType<typeof createCanvasMock>, ids: string[]) =>
      new IIGestureAnnotationProcessor(asCanvas(canvas)).apply(ids, {
        kind: "decorator",
        decoratorKind: DecoratorKind.Highlight,
        group: true,
      })

    const decoratorsIn = (canvas: ReturnType<typeof createCanvasMock>) =>
      canvas.model.symbols.filter((sym): sym is TDecorator => sym.type === "decorator")

    test("draws one decorator across words in separate groups", async () => {
      const canvas = createCanvasMock()
      const first = buildRecognizedStroke(10)
      const second = buildRecognizedStroke(100)
      canvas.model.addSymbol(first)
      canvas.model.addSymbol(second)

      const changes = await applyGrouped(canvas, [first.id, second.id])

      expect(changes?.added).toHaveLength(1)
      const decorators = decoratorsIn(canvas)
      expect(decorators).toHaveLength(1)
      expect(decorators[0].targetIds).toEqual([first.id, second.id])
      expect(decorators[0].targetBounds).toEqual(
        OBBOps.createFromOBBs([SymbolGeometry.boundsOf(first), SymbolGeometry.boundsOf(second)])
      )
    })

    test("covers a text and strokes with one standalone decorator, leaving the text's own untouched", async () => {
      const canvas = createCanvasMock()
      const stroke = buildRecognizedStroke(10)
      const text = buildIIText({ boundingBox: { x: 100, y: 10, width: 20, height: 16 } })
      canvas.model.addSymbol(stroke)
      canvas.model.addSymbol(text)

      await applyGrouped(canvas, [stroke.id, text.id])

      const decorators = decoratorsIn(canvas)
      expect(decorators).toHaveLength(1)
      expect(decorators[0].targetIds).toEqual([stroke.id, text.id])
      expect((canvas.model.getSymbol(text.id) as TText).decorators).toHaveLength(0)
    })

    test("decorates a lone text inside it, as without grouping", async () => {
      const canvas = createCanvasMock()
      const text = buildIIText({ boundingBox: { x: 100, y: 10, width: 20, height: 16 } })
      canvas.model.addSymbol(text)

      await applyGrouped(canvas, [text.id])

      expect(decoratorsIn(canvas)).toHaveLength(0)
      expect((canvas.model.getSymbol(text.id) as TText).decorators).toHaveLength(1)
    })

    test("decorates strokes recognized as math, one decorator per math block", async () => {
      const canvas = createCanvasMock()
      const [a, b, c] = [10, 30, 200].map((x, i) => {
        const stroke = buildRecognizedStroke(x)
        stroke.jiixBlockType = "Math"
        stroke.jiixBlockId = i < 2 ? "math-1" : "math-2"
        canvas.model.addSymbol(stroke)
        return stroke
      })

      const changes = await new IIGestureAnnotationProcessor(asCanvas(canvas)).apply([a.id, b.id, c.id], {
        kind: "decorator",
        decoratorKind: DecoratorKind.Underline,
      })

      expect(changes?.added).toHaveLength(2)
      expect(decoratorsIn(canvas).map((d) => d.targetIds)).toEqual([[a.id, b.id], [c.id]])
    })

    test("takes math strokes into the group decorator", async () => {
      const canvas = createCanvasMock()
      const text = buildRecognizedStroke(10)
      const math = buildRecognizedStroke(100)
      math.jiixBlockType = "Math"
      math.jiixBlockId = "math-1"
      canvas.model.addSymbol(text)
      canvas.model.addSymbol(math)

      await applyGrouped(canvas, [text.id, math.id])

      const decorators = decoratorsIn(canvas)
      expect(decorators).toHaveLength(1)
      expect(decorators[0].targetIds).toEqual([text.id, math.id])
    })

    test("removes the group decorator when the same set is decorated again", async () => {
      const canvas = createCanvasMock()
      const first = buildRecognizedStroke(10)
      const second = buildRecognizedStroke(100)
      canvas.model.addSymbol(first)
      canvas.model.addSymbol(second)

      await applyGrouped(canvas, [first.id, second.id])
      const changes = await applyGrouped(canvas, [second.id, first.id])

      expect(changes?.erased).toHaveLength(1)
      expect(decoratorsIn(canvas)).toHaveLength(0)
    })
  })

  describe("IIGestureAnnotationProcessor.apply (thicken)", () => {
    // The default thickness and font weight menus, "auto" left out
    const levels: TGestureAnnotation = { kind: "thicken", widths: [1, 2, 4, 8], fontWeights: ["normal", "bold"] }
    const char = (fontWeight: "normal" | "bold"): TSymbolChar => ({
      id: `char-${fontWeight}`,
      label: "a",
      color: "#000000",
      fontSize: 16,
      fontWeight,
      bounds: { x: 0, y: 0, width: 10, height: 16 },
    })
    const setup = () => {
      const canvas = createCanvasMock()
      return { canvas, processor: new IIGestureAnnotationProcessor(asCanvas(canvas)) }
    }
    const widthOf = (canvas: ReturnType<typeof createCanvasMock>, id: string) =>
      (canvas.model.getSymbol(id) as TStroke).style.width
    const weightsOf = (canvas: ReturnType<typeof createCanvasMock>, id: string) =>
      (canvas.model.getSymbol(id) as TText).chars.map((c) => c.fontWeight)

    test.each([
      [1, 2],
      [2, 4],
      [4, 8],
      [3, 4],
    ])("moves a stroke of width %p to the next thickness, %p", async (width, expected) => {
      const { canvas, processor } = setup()
      const stroke = buildIIStroke({ style: { ...DefaultStyle, width } })
      canvas.model.addSymbol(stroke)

      await processor.apply([stroke.id], levels)

      expect(widthOf(canvas, stroke.id)).toBe(expected)
    })

    test.each([8, 12])("brings a stroke of width %p, at or past the last thickness, back to the first", async (width) => {
      const { canvas, processor } = setup()
      const stroke = buildIIStroke({ style: { ...DefaultStyle, width } })
      canvas.model.addSymbol(stroke)

      await processor.apply([stroke.id], levels)

      expect(widthOf(canvas, stroke.id)).toBe(1)
    })

    test("steps a converted text through the font weights, back to the first past the last", async () => {
      const { canvas, processor } = setup()
      const text = buildIIText({ chars: [char("normal")] })
      canvas.model.addSymbol(text)

      await processor.apply([text.id], levels)
      expect(weightsOf(canvas, text.id)).toEqual(["bold"])

      await processor.apply([text.id], levels)
      expect(weightsOf(canvas, text.id)).toEqual(["normal"])
    })

    test("steps a math block through the font weights, back to the first past the last", async () => {
      const { canvas, processor } = setup()
      const math = buildIIMath("x")
      canvas.model.addSymbol(math)
      const weights = () => (canvas.model.getSymbol(math.id) as TMath).elements.map((e) => e.fontWeight)

      await processor.apply([math.id], levels)
      expect(weights()).toEqual(["bold"])

      await processor.apply([math.id], levels)
      expect(weights()).toEqual(["normal"])
    })

    test("moves each target from its own level, in one updateSymbols call", async () => {
      const { canvas, processor } = setup()
      const thin = buildIIStroke({ style: { ...DefaultStyle, width: 2 } })
      const thick = buildIIStroke({ style: { ...DefaultStyle, width: 8 } })
      const text = buildIIText({ chars: [char("bold"), char("normal")] })
      canvas.model.addSymbol(thin)
      canvas.model.addSymbol(thick)
      canvas.model.addSymbol(text)

      await processor.apply([thin.id, thick.id, text.id], levels)

      expect(widthOf(canvas, thin.id)).toBe(4)
      expect(widthOf(canvas, thick.id)).toBe(1)
      expect(weightsOf(canvas, text.id)).toEqual(["bold", "bold"])
      expect(canvas.updateSymbols).toHaveBeenCalledTimes(1)
    })

    test("leaves a kind with no level as it is", async () => {
      const { canvas, processor } = setup()
      const stroke = buildIIStroke({ style: { ...DefaultStyle, width: 2 } })
      const text = buildIIText({ chars: [char("normal")] })
      canvas.model.addSymbol(stroke)
      canvas.model.addSymbol(text)

      await processor.apply([stroke.id, text.id], { kind: "thicken", widths: [], fontWeights: ["normal", "bold"] })

      expect(widthOf(canvas, stroke.id)).toBe(2)
      expect(weightsOf(canvas, text.id)).toEqual(["bold"])
      expect(canvas.updateSymbols).toHaveBeenCalledWith([text.id], expect.any(Function))
    })
  })
  describe("IIGestureAnnotationProcessor.apply (locked targets)", () => {
    const underline = (canvas: ReturnType<typeof createCanvasMock>, id: string) =>
      new IIGestureAnnotationProcessor(asCanvas(canvas)).apply([id], {
        kind: "decorator",
        decoratorKind: DecoratorKind.Underline,
      })

    test("a locked text keeps its decorators as they are", async () => {
      const canvas = createCanvasMock()
      const text: TText = { ...buildIIText(), locked: true }
      canvas.model.addSymbol(text)

      await underline(canvas, text.id)

      expect(canvas.model.getSymbol(text.id)).toBe(text)
      expect(canvas.event.emitLockedRefused).toHaveBeenCalledWith([text])
    })

    test("a locked stroke can still be decorated: the decorator is a new symbol", async () => {
      const canvas = createCanvasMock()
      const stroke: TStroke = { ...buildIIStroke(), locked: true, jiixBlockType: "Text" }
      canvas.model.addSymbol(stroke)
      canvas.jiix.getWordGroupForStroke = jest.fn().mockReturnValue(undefined)

      await underline(canvas, stroke.id)

      expect(canvas.model.symbols.some((s) => s.type === "decorator")).toBe(true)
    })

    test("a locked decorator is not toggled off", async () => {
      const canvas = createCanvasMock()
      const stroke: TStroke = { ...buildIIStroke(), jiixBlockType: "Text" }
      canvas.model.addSymbol(stroke)
      canvas.jiix.getWordGroupForStroke = jest.fn().mockReturnValue(undefined)
      await underline(canvas, stroke.id)
      const decorator = canvas.model.symbols.find((s) => s.type === "decorator")!
      canvas.model.updateSymbol({ ...decorator, locked: true })

      await underline(canvas, stroke.id)

      expect(canvas.model.getSymbol(decorator.id)).toBeDefined()
      expect(canvas.event.emitLockedRefused).toHaveBeenCalledWith([expect.objectContaining({ id: decorator.id })])
    })
  })
})
