import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { IIMathManager, IIModel, JIIXElementType, JIIXMathExpressionType } from "@/iink"
import type { TJIIXMathElement, TJIIXMathNumber } from "@/iink"

type TSolverOutputExpression = TJIIXMathNumber & { "solver-output": true }

function buildSolverOutputResult(blockId: string, value: number): TJIIXMathElement {
  const expression: TSolverOutputExpression = {
    id: `${blockId}-solver`,
    type: JIIXMathExpressionType.Number,
    label: String(value),
    value,
    "solver-output": true,
    items: [{ type: "stroke", id: "solver-stroke-src", X: [0, 1, 2], Y: [0, 1, 2] }],
  }
  return {
    id: blockId,
    type: JIIXElementType.Math,
    expressions: [expression],
  }
}

// JIIX the server sends for "3 + 2" written as a vertical operation: the result row is
// empty, so the last operand is null and the label ends with \end{array}, not "=" or "?"
const VERTICAL_OPERATION_JIIX = `{
  "type": "Raw Content",
  "elements": [{
    "id": "raw-content/33",
    "type": "Math",
    "label": "\\\\begin{array}{cc}\\n& 3 \\\\\\\\\\n+ & 2 \\\\\\\\\\n\\\\hline\\n& ? \\\\\\\\\\n\\\\end{array}",
    "expressions": [{
      "type": "vertical operation",
      "id": "raw-content/56",
      "operands": [{
        "type": "+",
        "id": "raw-content/55",
        "operands": [
          { "type": "number", "id": "raw-content/19", "label": "3", "value": 3 },
          { "type": "number", "id": "raw-content/46", "label": "2", "value": 2 }
        ]
      }, null]
    }]
  }],
  "id": "MainBlock",
  "version": "3"
}`

function createAutoComputeCanvas(actions: string[]) {
  const model = new IIModel()
  model.mergeExport({ "application/vnd.myscript.jiix": JSON.parse(VERTICAL_OPERATION_JIIX) })
  const canvas = createCanvasMock({ model })
  canvas.client.getAvailableActions = jest.fn().mockResolvedValue(actions)
  canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("raw-content/33", 5))
  return canvas
}

describe("IIMathManager.ts", () => {
  describe("tryAutoCompute", () => {
    test("computes a vertical operation the server can compute, though its label ends with neither = nor ?", async () => {
      const canvas = createAutoComputeCanvas(["numerical-computation"])
      const manager = new IIMathManager(asCanvas(canvas))

      await manager.tryAutoCompute()

      expect(canvas.client.getNumericalComputation).toHaveBeenCalledWith("raw-content/33")
    })

    test("leaves a block alone when the server does not offer numerical computation", async () => {
      const canvas = createAutoComputeCanvas([])
      const manager = new IIMathManager(asCanvas(canvas))

      await manager.tryAutoCompute()

      expect(canvas.client.getNumericalComputation).not.toHaveBeenCalled()
    })
  })

  describe("getBlockCapabilities", () => {
    test("aggregates capabilities from the client for the given block", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathManager(asCanvas(canvas))
      canvas.client.getAvailableActions = jest.fn().mockResolvedValue(["numerical-computation"])
      canvas.client.getVariables = jest.fn().mockResolvedValue([{ name: "x", value: 1 }])
      canvas.client.getEvaluables = jest.fn().mockResolvedValue([{ inputName: "x", outputName: "f" }])

      const capabilities = await manager.getBlockCapabilities("block-1")

      expect(capabilities).toEqual({
        canEditVariables: true,
        canCompute: true,
        canEvaluate: true,
        hasDrawSolverOutputs: false,
      })
    })

    test("caches the result across calls", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathManager(asCanvas(canvas))
      canvas.client.getAvailableActions = jest.fn().mockResolvedValue([])
      canvas.client.getVariables = jest.fn().mockResolvedValue([])
      canvas.client.getEvaluables = jest.fn().mockResolvedValue([])

      await manager.getBlockCapabilities("block-1")
      await manager.getBlockCapabilities("block-1")

      expect(canvas.client.getAvailableActions).toHaveBeenCalledTimes(1)
    })
  })

  describe("capabilities cache invalidation", () => {
    test("computeNumericalResult invalidates the capabilities cache for that block", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathManager(asCanvas(canvas))
      canvas.client.getAvailableActions = jest.fn().mockResolvedValue([])
      canvas.client.getVariables = jest.fn().mockResolvedValue([])
      canvas.client.getEvaluables = jest.fn().mockResolvedValue([])
      canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))

      await manager.getBlockCapabilities("block-1")
      await manager.computeNumericalResult("block-1", "draw")
      await manager.getBlockCapabilities("block-1")

      expect(canvas.client.getAvailableActions).toHaveBeenCalledTimes(2)
    })

    test("setVariableValue invalidates the capabilities cache for that block", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathManager(asCanvas(canvas))
      canvas.client.getAvailableActions = jest.fn().mockResolvedValue([])
      canvas.client.getVariables = jest.fn().mockResolvedValue([])
      canvas.client.getEvaluables = jest.fn().mockResolvedValue([])

      await manager.getBlockCapabilities("block-1")
      await manager.setVariableValue("block-1", "x", 2)
      await manager.getBlockCapabilities("block-1")

      expect(canvas.client.getAvailableActions).toHaveBeenCalledTimes(2)
    })

    test("enrichMathDependencies invalidates the capabilities cache for that block", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathManager(asCanvas(canvas))
      canvas.client.getAvailableActions = jest.fn().mockResolvedValue([])
      canvas.client.getVariables = jest.fn().mockResolvedValue([])
      canvas.client.getEvaluables = jest.fn().mockResolvedValue([])

      await manager.getBlockCapabilities("block-1")
      await manager.enrichMathDependencies("block-1")
      await manager.getBlockCapabilities("block-1")

      expect(canvas.client.getAvailableActions).toHaveBeenCalledTimes(2)
    })
  })
})
