import { hTextJIIX, circleJIIX, lineJIIX } from "../../__dataset__/jiix.dataset"
import { buildIIStroke } from "../../helpers"
import { InteractiveInkEditorMock } from "../../__mocks__/InteractiveInkEditorMock"
import
{
  IISynchronizerManager,
  TJIIXExport,
  TJIIXTextElement,
  TJIIXMathElement,
  TJIIXNodeElement,
  TJIIXEdgeElement,
  IIRecognizedText,
  IIRecognizedMath,
  IIRecognizedCircle,
  IIRecognizedLine,
  DecoratorKind,
  IIDecorator,
  JIIXELementType,
} from "../../../../src/iink"

// Mock Math JIIX export
const mathJIIX: TJIIXExport = {
  "type": "Raw Content",
  "bounding-box": {
    "x": 10,
    "y": 10,
    "width": 50,
    "height": 20
  },
  "elements": [
    {
      "type": "Math",
      "id": "raw-content/math-1",
      "bounding-box": {
        "x": 10,
        "y": 10,
        "width": 50,
        "height": 20
      },
      "label": "x+1",
      "items": [
        {
          "type": "stroke" as const,
          "id": "stroke-math-1",
          "full-id": "stroke-math-1"
        }
      ],
      "expressions": [
        {
          "id": "expr-1",
          "type": "symbol",
          "label": "x",
          "items": [
            {
              "type": "stroke" as const,
              "id": "stroke-math-1",
              "full-id": "stroke-math-1"
            }
          ]
        } as any
      ]
    }
  ],
  "id": "MainBlock",
  "version": "3"
}

// Mock Text with embedded Math JIIX export
const textWithMathJIIX: TJIIXExport = {
  "type": "Raw Content",
  "bounding-box": {
    "x": 10,
    "y": 10,
    "width": 100,
    "height": 30
  },
  "elements": [
    {
      "type": "Math",
      "id": "raw-content/math-embedded",
      "parent": "raw-content/text-1",
      "bounding-box": {
        "x": 30,
        "y": 10,
        "width": 30,
        "height": 20
      },
      "label": "x",
      "items": [
        {
          "type": "stroke",
          "id": "stroke-math-embedded",
          "full-id": "stroke-math-embedded"
        }
      ],
      "expressions": []
    },
    {
      "type": JIIXELementType.Text,
      "id": "raw-content/text-1",
      "bounding-box": {
        "x": 10,
        "y": 10,
        "width": 100,
        "height": 30
      },
      "label": "hello x world",
      "children": ["raw-content/math-embedded"],
      "children-pos": [6],
      "words": [
        {
          "label": "hello",
          "first-char": 0,
          "last-char": 4,
          "bounding-box": {
            "x": 10,
            "y": 10,
            "width": 20,
            "height": 15
          },
          "items": [
            {
              "type": "stroke",
              "id": "stroke-text-1",
              "full-id": "stroke-text-1"
            }
          ]
        },
        {
          "label": "x",
          "first-char": 6,
          "last-char": 6,
          "refs": ["raw-content/math-embedded"],
          "bounding-box": {
            "x": 30,
            "y": 10,
            "width": 30,
            "height": 20
          },
          "items": []
        },
        {
          "label": "world",
          "first-char": 8,
          "last-char": 12,
          "bounding-box": {
            "x": 60,
            "y": 10,
            "width": 30,
            "height": 15
          },
          "items": [
            {
              "type": "stroke",
              "id": "stroke-text-2",
              "full-id": "stroke-text-2"
            }
          ]
        }
      ],
      "chars": [
        {
          "label": "h",
          "word": 0,
          "bounding-box": {
            "x": 10,
            "y": 10,
            "width": 5,
            "height": 15
          },
          "grid": [
            { "x": 10, "y": 10 },
            { "x": 15, "y": 10 },
            { "x": 15, "y": 25 },
            { "x": 10, "y": 25 }
          ]
        }
      ],
      "lines": [
        {
          "first-char": 0,
          "last-char": 12,
          "baseline-y": 20,
          "x-height": 10
        }
      ]
    }
  ],
  "id": "MainBlock",
  "version": "3"
}

describe("IISynchronizerManager.ts", () =>
{
  test("should create", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IISynchronizerManager(editor)
    expect(manager).toBeDefined()
    expect(manager.editor).toBe(editor)
  })

  test("should get model from editor", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IISynchronizerManager(editor)
    expect(manager.model).toBe(editor.model)
  })

  describe("synchronize", () =>
  {
    test("should call editor.export and emit synchronized event", async () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.export = jest.fn(() => Promise.resolve(editor.model))
      editor.event.emitSynchronized = jest.fn()
      editor.history.update = jest.fn()

      const manager = new IISynchronizerManager(editor)
      editor.model.exports = { "application/vnd.myscript.jiix": hTextJIIX }

      await manager.synchronize()

      expect(editor.export).toHaveBeenCalledTimes(1)
      expect(editor.export).toHaveBeenCalledWith(["application/vnd.myscript.jiix"])
      expect(editor.history.update).toHaveBeenCalledTimes(1)
      expect(editor.event.emitSynchronized).toHaveBeenCalledTimes(1)
    })

    test("should synchronize Text element", async () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.export = jest.fn(() => Promise.resolve(editor.model))
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.synchronizeTextElement = jest.fn()

      editor.model.exports = { "application/vnd.myscript.jiix": hTextJIIX }

      await manager.synchronize()

      //@ts-ignore
      expect(manager.synchronizeTextElement).toHaveBeenCalledTimes(1)
      //@ts-ignore
      expect(manager.synchronizeTextElement).toHaveBeenCalledWith(
        hTextJIIX.elements![0],
        hTextJIIX
      )
    })

    test("should synchronize Math element", async () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.export = jest.fn(() => Promise.resolve(editor.model))
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.synchronizeMathElement = jest.fn()

      editor.model.exports = { "application/vnd.myscript.jiix": mathJIIX }

      await manager.synchronize()

      //@ts-ignore
      expect(manager.synchronizeMathElement).toHaveBeenCalledTimes(1)
      //@ts-ignore
      expect(manager.synchronizeMathElement).toHaveBeenCalledWith(mathJIIX.elements![0])
    })

    test("should synchronize Node element", async () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.export = jest.fn(() => Promise.resolve(editor.model))
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.synchronizeNodeElement = jest.fn()

      editor.model.exports = { "application/vnd.myscript.jiix": circleJIIX }

      await manager.synchronize()

      //@ts-ignore
      expect(manager.synchronizeNodeElement).toHaveBeenCalledTimes(1)
      //@ts-ignore
      expect(manager.synchronizeNodeElement).toHaveBeenCalledWith(circleJIIX.elements![0])
    })

    test("should synchronize Edge element", async () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.export = jest.fn(() => Promise.resolve(editor.model))
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.synchronizeEdgeElement = jest.fn()

      editor.model.exports = { "application/vnd.myscript.jiix": lineJIIX }

      await manager.synchronize()

      //@ts-ignore
      expect(manager.synchronizeEdgeElement).toHaveBeenCalledTimes(1)
      //@ts-ignore
      expect(manager.synchronizeEdgeElement).toHaveBeenCalledWith(lineJIIX.elements![0])
    })
  })

  describe("getSymbolsAndStrokesAssociatedFromJIIXStrokeItems", () =>
  {
    test("should return empty arrays if no items", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)

      const result = manager["getSymbolsAndStrokesAssociatedFromJIIXStrokeItems"]([])

      expect(result.symbols).toEqual([])
      expect(result.strokes).toEqual([])
    })

    test("should extract symbols and strokes from JIIX items", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)

      const stroke1 = buildIIStroke()
      stroke1.id = "stroke-1"
      editor.model.symbols.push(stroke1)

      const items = [
        {
          type: "stroke" as const,
          id: "stroke-1",
          "full-id": "stroke-1"
        }
      ]

      const result = manager["getSymbolsAndStrokesAssociatedFromJIIXStrokeItems"](items)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0]).toBe(stroke1)
      expect(result.strokes).toHaveLength(1)
      expect(result.strokes[0]).toBe(stroke1)
    })

    test("should skip duplicate stroke ids", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)

      const stroke1 = buildIIStroke()
      stroke1.id = "stroke-1"
      editor.model.symbols.push(stroke1)

      const items = [
        { type: "stroke" as const, id: "stroke-1", "full-id": "stroke-1" },
        { type: "stroke" as const, id: "stroke-1", "full-id": "stroke-1" }
      ]

      const result = manager["getSymbolsAndStrokesAssociatedFromJIIXStrokeItems"](items)

      expect(result.symbols).toHaveLength(1)
      expect(result.strokes).toHaveLength(1)
    })
  })

  describe("synchronizeTextElement", () =>
  {
    test("should create new Text symbol when not exists", async () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.export = jest.fn(() => Promise.resolve(editor.model))
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.createNewTextSymbol = jest.fn()

      const stroke = buildIIStroke()
      stroke.id = "stroke-7d4b2518-619d-4cf8-af49-1c93481d85eb"
      editor.model.symbols.push(stroke)

      editor.model.exports = { "application/vnd.myscript.jiix": hTextJIIX }

      const textElement = hTextJIIX.elements![0] as TJIIXTextElement
      await manager["synchronizeTextElement"](textElement, hTextJIIX)

      //@ts-ignore
      expect(manager.createNewTextSymbol).toHaveBeenCalledTimes(1)
    })

    test("should update existing Text symbol when exists", async () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.updateExistingTextSymbol = jest.fn()

      const stroke = buildIIStroke()
      stroke.id = "stroke-7d4b2518-619d-4cf8-af49-1c93481d85eb"

      const existingText = new IIRecognizedText([stroke], { baseline: 10, xHeight: 5 })
      existingText.jiixId = "raw-content/11"
      editor.model.symbols.push(existingText)
      editor.model.symbols.push(stroke)

      const textElement = hTextJIIX.elements![0] as TJIIXTextElement
      await manager["synchronizeTextElement"](textElement, hTextJIIX)

      //@ts-ignore
      expect(manager.updateExistingTextSymbol).toHaveBeenCalledTimes(1)
      //@ts-ignore
      expect(manager.updateExistingTextSymbol).toHaveBeenCalledWith(
        existingText,
        textElement,
        expect.any(Object)
      )
    })

    test("should process embedded Math elements", async () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.synchronizeEmbeddedMathElement = jest.fn()
      //@ts-ignore
      manager.createNewTextSymbol = jest.fn()

      const stroke1 = buildIIStroke()
      stroke1.id = "stroke-text-1"
      const stroke2 = buildIIStroke()
      stroke2.id = "stroke-text-2"
      const strokeMath = buildIIStroke()
      strokeMath.id = "stroke-math-embedded"

      editor.model.symbols.push(stroke1, stroke2, strokeMath)
      editor.model.exports = { "application/vnd.myscript.jiix": textWithMathJIIX }

      const textElement = textWithMathJIIX.elements!.find(e => e.type === JIIXELementType.Text) as TJIIXTextElement
      await manager["synchronizeTextElement"](textElement, textWithMathJIIX)

      //@ts-ignore
      expect(manager.synchronizeEmbeddedMathElement).toHaveBeenCalledTimes(1)
    })
  })

  describe("updateExistingTextSymbol", () =>
  {
    test("should update text symbol properties", () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.renderer.drawSymbol = jest.fn()
      editor.model.updateSymbol = jest.fn()
      const manager = new IISynchronizerManager(editor)

      const stroke = buildIIStroke()
      stroke.id = "stroke-1"
      const existingText = new IIRecognizedText([stroke], { baseline: 10, xHeight: 5 })
      existingText.jiixId = "raw-content/11"

      const textElement = hTextJIIX.elements![0] as TJIIXTextElement
      const jiixAssociation = { symbols: [existingText], strokes: [stroke] }

      manager["updateExistingTextSymbol"](existingText, textElement, jiixAssociation)

      expect(existingText.label).toBe("h")
      expect(existingText.strokes).toEqual([stroke])
      expect(editor.model.updateSymbol).toHaveBeenCalledWith(existingText)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(existingText)
    })

    test("should preserve word decorators", () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.renderer.drawSymbol = jest.fn()
      editor.model.updateSymbol = jest.fn()
      const manager = new IISynchronizerManager(editor)

      const stroke = buildIIStroke()
      stroke.id = "stroke-1"
      const existingText = new IIRecognizedText([stroke], { baseline: 10, xHeight: 5 })

      const decorator = new IIDecorator(DecoratorKind.Highlight, { color: "yellow" })
      existingText.words = [
        {
          label: "h",
          firstChar: 0,
          lastChar: 0,
          decorators: [decorator]
        }
      ]

      const textElement = hTextJIIX.elements![0] as TJIIXTextElement
      const jiixAssociation = { symbols: [existingText], strokes: [stroke] }

      manager["updateExistingTextSymbol"](existingText, textElement, jiixAssociation)

      expect(existingText.words).toBeDefined()
      expect(existingText.words![0].decorators).toEqual([decorator])
    })
  })

  describe("createNewTextSymbol", () =>
  {
    test("should create new text symbol from JIIX", () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.renderer.drawSymbol = jest.fn()
      editor.renderer.removeSymbol = jest.fn()
      editor.model.addSymbol = jest.fn()
      editor.model.removeSymbol = jest.fn()
      const manager = new IISynchronizerManager(editor)

      const stroke = buildIIStroke()
      stroke.id = "stroke-1"

      const textElement = hTextJIIX.elements![0] as TJIIXTextElement
      const jiixAssociation = { symbols: [stroke], strokes: [stroke] }

      manager["createNewTextSymbol"](textElement, jiixAssociation)

      expect(editor.model.addSymbol).toHaveBeenCalledTimes(1)
      const addedSymbol = (editor.model.addSymbol as jest.Mock).mock.calls[0][0]
      expect(addedSymbol).toBeInstanceOf(IIRecognizedText)
      expect(addedSymbol.jiixId).toBe("raw-content/11")
      expect(addedSymbol.label).toBe("h")
    })

    test("should preserve decorators from old symbols", () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.renderer.drawSymbol = jest.fn()
      editor.renderer.removeSymbol = jest.fn()
      editor.model.addSymbol = jest.fn()
      editor.model.removeSymbol = jest.fn()
      const manager = new IISynchronizerManager(editor)

      const stroke = buildIIStroke()
      stroke.id = "stroke-1"

      const oldText = new IIRecognizedText([stroke], { baseline: 10, xHeight: 5 })
      const decorator = new IIDecorator(DecoratorKind.Underline, { color: "red" })
      oldText.decorators.push(decorator)

      const textElement = hTextJIIX.elements![0] as TJIIXTextElement
      const jiixAssociation = { symbols: [oldText], strokes: [stroke] }

      manager["createNewTextSymbol"](textElement, jiixAssociation)

      const addedSymbol = (editor.model.addSymbol as jest.Mock).mock.calls[0][0]
      expect(addedSymbol.decorators).toHaveLength(1)
      expect(addedSymbol.decorators[0].kind).toBe(DecoratorKind.Underline)
    })
  })

  describe("synchronizeMathElement", () =>
  {
    test("should skip embedded Math elements (with parent)", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.updateExistingMathSymbol = jest.fn()
      //@ts-ignore
      manager.createNewMathSymbol = jest.fn()

      const mathElement = mathJIIX.elements![0] as TJIIXMathElement
      mathElement.parent = "some-parent"

      manager["synchronizeMathElement"](mathElement)

      //@ts-ignore
      expect(manager.updateExistingMathSymbol).not.toHaveBeenCalled()
      //@ts-ignore
      expect(manager.createNewMathSymbol).not.toHaveBeenCalled()
    })

    test("should create new Math symbol when not exists", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.createNewMathSymbol = jest.fn()

      const stroke = buildIIStroke()
      stroke.id = "stroke-math-1"
      editor.model.symbols.push(stroke)

      const mathElement = mathJIIX.elements![0] as TJIIXMathElement
      delete mathElement.parent

      manager["synchronizeMathElement"](mathElement)

      //@ts-ignore
      expect(manager.createNewMathSymbol).toHaveBeenCalledTimes(1)
    })

    test("should update existing Math symbol when exists", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.updateExistingMathSymbol = jest.fn()

      const stroke = buildIIStroke()
      stroke.id = "stroke-math-1"

      const existingMath = new IIRecognizedMath([stroke])
      existingMath.jiixId = "raw-content/math-1"
      editor.model.symbols.push(existingMath)
      editor.model.symbols.push(stroke)

      const mathElement = mathJIIX.elements![0] as TJIIXMathElement
      delete mathElement.parent

      manager["synchronizeMathElement"](mathElement)

      //@ts-ignore
      expect(manager.updateExistingMathSymbol).toHaveBeenCalledTimes(1)
    })
  })

  describe("synchronizeNodeElement", () =>
  {
    test("should create new Node symbol when not exists", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.createNewNodeSymbol = jest.fn()

      const stroke = buildIIStroke()
      stroke.id = "stroke-e3ab0f2b-7846-4440-9e49-97ae560813ee"
      editor.model.symbols.push(stroke)

      const nodeElement = circleJIIX.elements![0] as TJIIXNodeElement
      manager["synchronizeNodeElement"](nodeElement)

      //@ts-ignore
      expect(manager.createNewNodeSymbol).toHaveBeenCalledTimes(1)
    })

    test("should update existing Node symbol when exists", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.updateExistingNodeSymbol = jest.fn()

      const stroke = buildIIStroke()
      stroke.id = "stroke-e3ab0f2b-7846-4440-9e49-97ae560813ee"

      const existingCircle = new IIRecognizedCircle([stroke])
      existingCircle.jiixId = "raw-content/12"
      editor.model.symbols.push(existingCircle)
      editor.model.symbols.push(stroke)

      const nodeElement = circleJIIX.elements![0] as TJIIXNodeElement
      manager["synchronizeNodeElement"](nodeElement)

      //@ts-ignore
      expect(manager.updateExistingNodeSymbol).toHaveBeenCalledTimes(1)
    })
  })

  describe("synchronizeEdgeElement", () =>
  {
    test("should create new Edge symbol when not exists", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.createNewEdgeSymbol = jest.fn()

      const stroke = buildIIStroke()
      stroke.id = "stroke-2632b9c1-697d-44e6-bba4-44c498203182"
      editor.model.symbols.push(stroke)

      const edgeElement = lineJIIX.elements![0] as TJIIXEdgeElement
      manager["synchronizeEdgeElement"](edgeElement)

      //@ts-ignore
      expect(manager.createNewEdgeSymbol).toHaveBeenCalledTimes(1)
    })

    test("should update existing Edge symbol when exists", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.updateExistingEdgeSymbol = jest.fn()

      const stroke = buildIIStroke()
      stroke.id = "stroke-2632b9c1-697d-44e6-bba4-44c498203182"

      const existingLine = new IIRecognizedLine([stroke])
      existingLine.jiixId = "raw-content/12"
      editor.model.symbols.push(existingLine)
      editor.model.symbols.push(stroke)

      const edgeElement = lineJIIX.elements![0] as TJIIXEdgeElement
      manager["synchronizeEdgeElement"](edgeElement)

      //@ts-ignore
      expect(manager.updateExistingEdgeSymbol).toHaveBeenCalledTimes(1)
    })
  })

  describe("createNewNodeSymbol", () =>
  {
    test("should create Circle symbol for circle kind", () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.renderer.drawSymbol = jest.fn()
      editor.renderer.removeSymbol = jest.fn()
      editor.model.addSymbol = jest.fn()
      editor.model.removeSymbol = jest.fn()
      const manager = new IISynchronizerManager(editor)

      const stroke = buildIIStroke()
      const nodeElement = circleJIIX.elements![0] as TJIIXNodeElement
      const jiixAssociation = { symbols: [stroke], strokes: [stroke] }

      manager["createNewNodeSymbol"](nodeElement, jiixAssociation)

      expect(editor.model.addSymbol).toHaveBeenCalledTimes(1)
      const addedSymbol = (editor.model.addSymbol as jest.Mock).mock.calls[0][0]
      expect(addedSymbol).toBeInstanceOf(IIRecognizedCircle)
      expect(addedSymbol.jiixId).toBe("raw-content/12")
    })
  })

  describe("createNewEdgeSymbol", () =>
  {
    test("should create Line symbol for line kind", () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.renderer.drawSymbol = jest.fn()
      editor.renderer.removeSymbol = jest.fn()
      editor.model.addSymbol = jest.fn()
      editor.model.removeSymbol = jest.fn()
      const manager = new IISynchronizerManager(editor)

      const stroke = buildIIStroke()
      const edgeElement = lineJIIX.elements![0] as TJIIXEdgeElement
      const jiixAssociation = { symbols: [stroke], strokes: [stroke] }

      manager["createNewEdgeSymbol"](edgeElement, jiixAssociation)

      expect(editor.model.addSymbol).toHaveBeenCalledTimes(1)
      const addedSymbol = (editor.model.addSymbol as jest.Mock).mock.calls[0][0]
      expect(addedSymbol).toBeInstanceOf(IIRecognizedLine)
      expect(addedSymbol.jiixId).toBe("raw-content/12")
    })
  })

  describe("collectMathItems", () =>
  {
    test("should return empty array for null expression", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)

      const result = manager["collectMathItems"](null as any)

      expect(result).toEqual([])
    })

    test("should collect items from Math expression", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)

      const expression = {
        type: "symbol",
        label: "x",
        items: [
          { type: "stroke", id: "stroke-1", "full-id": "stroke-1" }
        ]
      }

      const result = manager["collectMathItems"](expression as any)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("stroke-1")
    })

    test("should recursively collect items from operands", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)

      const expression = {
        type: "operator",
        label: "+",
        operands: [
          {
            type: "symbol",
            label: "x",
            items: [
              { type: "stroke", id: "stroke-1", "full-id": "stroke-1" }
            ]
          },
          {
            type: "number",
            label: "1",
            items: [
              { type: "stroke", id: "stroke-2", "full-id": "stroke-2" }
            ]
          }
        ]
      }

      const result = manager["collectMathItems"](expression as any)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe("stroke-1")
      expect(result[1].id).toBe("stroke-2")
    })
  })

  describe("getMathElementItems", () =>
  {
    test("should collect items from Math element", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)

      const mathElement = {
        type: "Math",
        id: "math-1",
        items: [
          { type: "stroke", id: "stroke-1", "full-id": "stroke-1" }
        ],
        expressions: []
      } as TJIIXMathElement

      const result = manager["getMathElementItems"](mathElement)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("stroke-1")
    })

    test("should collect items from expressions", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)

      const mathElement = {
        type: "Math",
        id: "math-1",
        expressions: [
          {
            type: "symbol",
            label: "x",
            items: [
              { type: "stroke", id: "stroke-1", "full-id": "stroke-1" }
            ]
          }
        ]
      } as any

      const result = manager["getMathElementItems"](mathElement)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("stroke-1")
    })
  })

  describe("updateExistingNodeSymbol", () =>
  {
    test("should update node symbol and remove old symbols", () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.renderer.drawSymbol = jest.fn()
      editor.renderer.removeSymbol = jest.fn()
      editor.model.updateSymbol = jest.fn()
      editor.model.removeSymbol = jest.fn()
      const manager = new IISynchronizerManager(editor)

      const newStroke = buildIIStroke()
      newStroke.id = "stroke-new"
      const oldStroke = buildIIStroke()
      oldStroke.id = "stroke-old"

      const existingNode = new IIRecognizedCircle([oldStroke])
      const jiixAssociation = { symbols: [oldStroke], strokes: [newStroke] }

      manager["updateExistingNodeSymbol"](existingNode, jiixAssociation)

      expect(existingNode.strokes).toEqual([newStroke])
      expect(editor.model.updateSymbol).toHaveBeenCalledWith(existingNode)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(existingNode)
    })
  })

  describe("updateExistingEdgeSymbol", () =>
  {
    test("should update edge symbol and remove old symbols", () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.renderer.drawSymbol = jest.fn()
      editor.renderer.removeSymbol = jest.fn()
      editor.model.updateSymbol = jest.fn()
      editor.model.removeSymbol = jest.fn()
      const manager = new IISynchronizerManager(editor)

      const newStroke = buildIIStroke()
      newStroke.id = "stroke-new"
      const oldStroke = buildIIStroke()
      oldStroke.id = "stroke-old"

      const existingEdge = new IIRecognizedLine([oldStroke])
      const jiixAssociation = { symbols: [oldStroke], strokes: [newStroke] }

      manager["updateExistingEdgeSymbol"](existingEdge, jiixAssociation)

      expect(existingEdge.strokes).toEqual([newStroke])
      expect(editor.model.updateSymbol).toHaveBeenCalledWith(existingEdge)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(existingEdge)
    })
  })

  describe("updateExistingMathSymbol", () =>
  {
    test("should update math symbol properties", () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.renderer.drawSymbol = jest.fn()
      editor.model.updateSymbol = jest.fn()
      const manager = new IISynchronizerManager(editor)

      const stroke = buildIIStroke()
      const existingMath = new IIRecognizedMath([stroke])

      const mathElement = {
        type: "Math",
        id: "math-1",
        label: "x+1",
        parent: undefined,
        expressions: []
      } as TJIIXMathElement

      const jiixAssociation = { symbols: [existingMath], strokes: [stroke] }

      manager["updateExistingMathSymbol"](existingMath, mathElement, jiixAssociation, false)

      expect(existingMath.label).toBe("x+1")
      expect(existingMath.expressions).toEqual([])
      expect(editor.model.updateSymbol).toHaveBeenCalledWith(existingMath)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(existingMath)
    })

    test("should preserve solverOutputStrokeIds and variableValues", () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.renderer.drawSymbol = jest.fn()
      editor.model.updateSymbol = jest.fn()
      const manager = new IISynchronizerManager(editor)

      const stroke = buildIIStroke()
      const existingMath = new IIRecognizedMath([stroke])
      existingMath.solverOutputStrokeIds = ["solver-1", "solver-2"]
      existingMath.variableValues = { x: 5, y: 10 }

      const mathElement = {
        type: "Math",
        id: "math-1",
        label: "x+y",
        expressions: []
      } as TJIIXMathElement

      const jiixAssociation = { symbols: [existingMath], strokes: [stroke] }

      manager["updateExistingMathSymbol"](existingMath, mathElement, jiixAssociation, false)

      expect(existingMath.solverOutputStrokeIds).toEqual(["solver-1", "solver-2"])
      expect(existingMath.variableValues).toEqual({ x: 5, y: 10 })
    })
  })

  describe("createNewMathSymbol", () =>
  {
    test("should create new math symbol from JIIX", () =>
    {
      const editor = new InteractiveInkEditorMock()
      editor.renderer.drawSymbol = jest.fn()
      editor.renderer.removeSymbol = jest.fn()
      editor.model.addSymbol = jest.fn()
      editor.model.removeSymbol = jest.fn()
      const manager = new IISynchronizerManager(editor)

      const stroke = buildIIStroke()
      const mathElement = {
        type: "Math",
        id: "math-1",
        label: "x+1",
        expressions: []
      } as TJIIXMathElement
      const jiixAssociation = { symbols: [stroke], strokes: [stroke] }

      manager["createNewMathSymbol"](mathElement, jiixAssociation, false)

      expect(editor.model.addSymbol).toHaveBeenCalledTimes(1)
      const addedSymbol = (editor.model.addSymbol as jest.Mock).mock.calls[0][0]
      expect(addedSymbol).toBeInstanceOf(IIRecognizedMath)
      expect(addedSymbol.jiixId).toBe("math-1")
      expect(addedSymbol.label).toBe("x+1")
    })
  })

  describe("synchronizeEmbeddedMathElement", () =>
  {
    test("should synchronize embedded Math element", () =>
    {
      const editor = new InteractiveInkEditorMock()
      const manager = new IISynchronizerManager(editor)
      //@ts-ignore
      manager.createNewMathSymbol = jest.fn()

      const stroke = buildIIStroke()
      stroke.id = "stroke-math-embedded"
      editor.model.symbols.push(stroke)

      const mathElement = textWithMathJIIX.elements!.find(e => e.type === "Math") as TJIIXMathElement

      manager["synchronizeEmbeddedMathElement"](mathElement)

      //@ts-ignore
      expect(manager.createNewMathSymbol).toHaveBeenCalledTimes(1)
      //@ts-ignore
      expect(manager.createNewMathSymbol).toHaveBeenCalledWith(
        mathElement,
        expect.any(Object),
        true // isEmbedded
      )
    })
  })
})
