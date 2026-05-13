import { InteractiveInkEditorMock } from "../__mocks__/InteractiveInkEditorMock"
import { MathContextMenu } from "../../../src/menu/context/MathContextMenu"
import { IIRecognizedMath, SymbolType, RecognizedKind } from "../../../src/symbol"
import { buildOIStroke } from "../helpers"

describe("MathContextMenu.ts", () =>
{
  let editor: InteractiveInkEditorMock
  let mathMenu: MathContextMenu

  beforeEach(() =>
  {
    editor = new InteractiveInkEditorMock()
    editor.init()
    mathMenu = new MathContextMenu(editor)
    document.body.innerHTML = ""
  })

  afterEach(() =>
  {
    jest.clearAllMocks()
    document.body.innerHTML = ""
  })

  describe("constructor", () =>
  {
    test("should create MathContextMenu with default prefix", () =>
    {
      expect(mathMenu).toBeDefined()
      expect(mathMenu.id).toBe("ms-menu-context-math")
      expect(mathMenu.idEditVariables).toBe("ms-menu-context-math-variables")
      expect(mathMenu.idNumericalComputation).toBe("ms-menu-context-math-numerical-computation")
      expect(mathMenu.idEvaluate).toBe("ms-menu-context-math-evaluate")
    })

    test("should create with custom id prefix", () =>
    {
      const customMenu = new MathContextMenu(editor, "custom-prefix")
      expect(customMenu.id).toBe("custom-prefix-math")
      expect(customMenu.idEditVariables).toBe("custom-prefix-math-variables")
      expect(customMenu.idNumericalComputation).toBe("custom-prefix-math-numerical-computation")
      expect(customMenu.idEvaluate).toBe("custom-prefix-math-evaluate")
    })

    test("should have unique IDs for all actions", () =>
    {
      const ids = [
        mathMenu.id,
        mathMenu.idEditVariables,
        mathMenu.idNumericalComputation,
        mathMenu.idEvaluate
      ]
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe("getElement()", () =>
  {
    test("should return HTMLElement", () =>
    {
      const element = mathMenu.getElement()
      expect(element).toBeDefined()
      expect(element).toBeInstanceOf(HTMLElement)
    })

    test("should have submenu structure", () =>
    {
      const element = mathMenu.getElement()
      expect(element.classList.contains("sub-menu")).toBe(true)
    })

    test("should have trigger button", () =>
    {
      const element = mathMenu.getElement()
      document.body.appendChild(element)

      const trigger = element.querySelector("button")
      expect(trigger).toBeTruthy()
    })

    test("should have menu label", () =>
    {
      const element = mathMenu.getElement()
      document.body.appendChild(element)

      const trigger = element.querySelector("button")
      expect(trigger?.textContent).toContain("Math")
    })
  })

  describe("setMenuVisibility()", () =>
  {
    beforeEach(() =>
    {
      const element = mathMenu.getElement()
      document.body.appendChild(element)
    })

    test("should show menu when at least one action is available", () =>
    {
      mathMenu.setMenuVisibility(true, {
        canEditVariables: true,
        canCompute: false,
        canEvaluate: false
      })

      const menuElement = mathMenu.getElement()
      expect(menuElement.style.display).not.toBe("none")
    })

    test("should hide menu when show parameter is false", () =>
    {
      mathMenu.setMenuVisibility(false, {
        canEditVariables: true,
        canCompute: true,
        canEvaluate: true
      })

      const menuElement = mathMenu.getElement()
      expect(menuElement.style.display).toBe("none")
    })

    test("should hide menu when no actions are available", () =>
    {
      mathMenu.setMenuVisibility(true, {
        canEditVariables: false,
        canCompute: false,
        canEvaluate: false
      })

      const menuElement = mathMenu.getElement()
      expect(menuElement.style.display).toBe("none")
    })

    test("should show menu when all actions are available", () =>
    {
      mathMenu.setMenuVisibility(true, {
        canEditVariables: true,
        canCompute: true,
        canEvaluate: true
      })

      const menuElement = mathMenu.getElement()
      expect(menuElement.style.display).not.toBe("none")
    })

    test("should show menu with partial availability", () =>
    {
      mathMenu.setMenuVisibility(true, {
        canEditVariables: true,
        canCompute: false,
        canEvaluate: true
      })

      const menuElement = mathMenu.getElement()
      expect(menuElement.style.display).not.toBe("none")
    })

    test("should show menu when only compute is available", () =>
    {
      mathMenu.setMenuVisibility(true, {
        canEditVariables: false,
        canCompute: true,
        canEvaluate: false
      })

      const menuElement = mathMenu.getElement()
      expect(menuElement.style.display).not.toBe("none")
    })

    test("should show menu when only evaluate is available", () =>
    {
      mathMenu.setMenuVisibility(true, {
        canEditVariables: false,
        canCompute: false,
        canEvaluate: true
      })

      const menuElement = mathMenu.getElement()
      expect(menuElement.style.display).not.toBe("none")
    })
  })

  describe("editor math methods", () =>
  {
    let mathSymbol: IIRecognizedMath

    beforeEach(() =>
    {
      const stroke = buildOIStroke()
      mathSymbol = {
        id: "math-1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        strokes: [stroke],
        label: "2x + 3",
        jiixId: "jiix-1",
        baseline: 10,
        bounds: stroke.bounds,
        decorators: [],
        style: stroke.style,
        modificationDate: Date.now(),
        creationDate: Date.now(),
        variableValues: {},
        clone: jest.fn()
      } as unknown as IIRecognizedMath

      editor.model.addSymbol(mathSymbol)
      editor.model.selectSymbol(mathSymbol.id)
    })

    test("should have getVariables method available", () =>
    {
      expect(editor.getVariables).toBeDefined()
      expect(typeof editor.getVariables).toBe("function")
    })

    test("should have setMathVariables method available", () =>
    {
      expect(editor.setMathVariables).toBeDefined()
      expect(typeof editor.setMathVariables).toBe("function")
    })

    test("should have computeMathNumericalResult method available", () =>
    {
      expect(editor.computeMathNumericalResult).toBeDefined()
      expect(typeof editor.computeMathNumericalResult).toBe("function")
    })

    test("should have getEvaluables method available", () =>
    {
      expect(editor.getEvaluables).toBeDefined()
      expect(typeof editor.getEvaluables).toBe("function")
    })

    test("should have evaluateMathFunction method available", () =>
    {
      expect(editor.evaluateMathFunction).toBeDefined()
      expect(typeof editor.evaluateMathFunction).toBe("function")
    })

    test("getVariables returns a promise", async () =>
    {
      editor.getVariables = jest.fn().mockResolvedValue([])
      const result = await editor.getVariables("test-id")
      expect(result).toEqual([])
      expect(editor.getVariables).toHaveBeenCalledWith("test-id")
    })

    test("setMathVariables can be called with symbol and variables", async () =>
    {
      editor.setMathVariables = jest.fn().mockResolvedValue(undefined)
      await editor.setMathVariables(mathSymbol, { x: 10, y: 20 })
      expect(editor.setMathVariables).toHaveBeenCalledWith(mathSymbol, { x: 10, y: 20 })
    })

    test("computeMathNumericalResult can be called with mode", async () =>
    {
      editor.computeMathNumericalResult = jest.fn().mockResolvedValue(undefined)
      await editor.computeMathNumericalResult(mathSymbol, "value-only")
      expect(editor.computeMathNumericalResult).toHaveBeenCalledWith(mathSymbol, "value-only")
    })

    test("getEvaluables returns evaluable functions", async () =>
    {
      const evaluables = [
        { inputName: "x", outputName: "f" },
        { inputName: "t", outputName: "g" }
      ]
      editor.getEvaluables = jest.fn().mockResolvedValue(evaluables)
      const result = await editor.getEvaluables("test-id")
      expect(result).toEqual(evaluables)
      expect(editor.getEvaluables).toHaveBeenCalledWith("test-id")
    })

    test("evaluateMathFunction returns data points", async () =>
    {
      const points = [
        [{ x: -10, y: 100 }],
        [{ x: 0, y: 0 }],
        [{ x: 10, y: 100 }]
      ]
      editor.evaluateMathFunction = jest.fn().mockResolvedValue(points)

      const result = await editor.evaluateMathFunction(mathSymbol, {
        inputVariableName: "x",
        outputVariableName: "y",
        from: -10,
        to: 10,
        pointCount: 21
      })

      expect(result).toEqual(points)
      expect(editor.evaluateMathFunction).toHaveBeenCalledWith(mathSymbol, {
        inputVariableName: "x",
        outputVariableName: "y",
        from: -10,
        to: 10,
        pointCount: 21
      })
    })
  })

  describe("menu properties", () =>
  {
    test("should have correct menu id structure", () =>
    {
      expect(mathMenu.id).toContain("math")
      expect(mathMenu.idEditVariables).toContain("variables")
      expect(mathMenu.idNumericalComputation).toContain("numerical-computation")
      expect(mathMenu.idEvaluate).toContain("evaluate")
    })

    test("should use default prefix when not specified", () =>
    {
      expect(mathMenu.id).toContain("ms-menu-context")
    })

    test("should not use default prefix with custom prefix", () =>
    {
      const customMenu = new MathContextMenu(editor, "test")
      expect(customMenu.id).toBe("test-math")
      expect(customMenu.id).not.toContain("ms-menu-context")
    })

    test("all IDs should be strings", () =>
    {
      expect(typeof mathMenu.id).toBe("string")
      expect(typeof mathMenu.idEditVariables).toBe("string")
      expect(typeof mathMenu.idNumericalComputation).toBe("string")
      expect(typeof mathMenu.idEvaluate).toBe("string")
    })
  })
})
