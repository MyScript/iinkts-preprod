import { buildIICircle, buildIIEraser, buildIIStroke, buildIIText } from "../../helpers"
import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { EraseManager, TPointerInfo, SymbolType } from "@/iink"

describe("EraseManager.ts", () => {
  test("should create", () => {
    const canvas = createCanvasMock()
    const manager = new EraseManager(asCanvas(canvas))
    expect(manager).toBeDefined()
    expect(manager.currentEraser).toBeUndefined()
  })

  describe("writing process", () => {
    const canvas = createCanvasMock()
    canvas.client.init = jest.fn(() => Promise.resolve())
    canvas.client.addStrokes = jest.fn(() => Promise.resolve(undefined))
    canvas.client.eraseStrokes = jest.fn(() => Promise.resolve())

    const manager = new EraseManager(asCanvas(canvas))
    manager.renderer.drawSymbol = jest.fn()
    manager.renderer.removeSymbol = jest.fn()
    canvas.init()

    test("should init currentEraser", async () => {
      expect(manager.currentEraser).toBeUndefined()
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      expect(manager.currentEraser).toBeDefined()
      expect(manager.currentEraser?.type).toBe(SymbolType.Eraser)
      expect(manager.currentEraser?.pointers).toHaveLength(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.currentEraser)
    })
    test("should update currentEraser", async () => {
      const info = {
        pointer: { t: 1, p: 0.5, x: 15, y: 15 },
      } as TPointerInfo
      manager.continue(info)
      expect(manager.currentEraser).toBeDefined()
      expect(manager.currentEraser?.type).toBe(SymbolType.Eraser)
      expect(manager.currentEraser?.pointers).toHaveLength(2)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.currentEraser)
    })
    test("should complete erasing", async () => {
      const eraserId = manager.currentEraser!.id
      const strokeToErase = buildIIStroke()
      canvas.model.addSymbol(strokeToErase)
      manager.deletingIds.add(strokeToErase.id)
      const circleToErase = buildIICircle()
      canvas.model.addSymbol(circleToErase)
      manager.deletingIds.add(circleToErase.id)
      canvas.model.addSymbol(buildIIStroke())

      const info = {
        pointer: { t: 1, p: 0.5, x: 20, y: 20 },
      } as TPointerInfo
      await manager.end(info)
      expect(manager.currentEraser).toBeUndefined()
      expect(manager.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.removeSymbol).toHaveBeenNthCalledWith(1, eraserId)

      expect(canvas.removeSymbols).toHaveBeenNthCalledWith(1, [strokeToErase.id, circleToErase.id])
    })
    test("should throw error if continu when currentEraser is undefine", async () => {
      const info = {
        pointer: { t: 1, p: 0.5, x: 20, y: 20 },
      } as TPointerInfo
      expect(manager.currentEraser).toBeUndefined()
      expect(() => manager.continue(info)).toThrow("Can't update current eraser because currentEraser is undefined")
    })
  })
})

describe("partial character erase", () => {
  /**
   * Regression for IIC-1971: the partial-erase branch mutated the clone `model.symbols` had just
   * handed it, drew the result, and never stored it — so the deleted characters were back on the
   * next redraw from the document.
   */
  test("should store the remaining characters in the model, not only draw them", async () => {
    const canvas = createCanvasMock()
    const manager = new EraseManager(asCanvas(canvas))

    const text = buildIIText({
      chars: [
        { id: "c1", label: "a", color: "#000", fontSize: 10, fontWeight: "normal", bounds: { x: 0, y: 0, width: 5, height: 10 } },
        { id: "c2", label: "b", color: "#000", fontSize: 10, fontWeight: "normal", bounds: { x: 5, y: 0, width: 5, height: 10 } },
      ],
    })
    canvas.model.addSymbol(text)

    manager.currentEraser = buildIIEraser()
    manager.charsToDelete.set(text.id, new Set(["c1"]))

    await manager.end({ pointer: { x: 0, y: 0, t: 0, p: 1 }, pointerType: "pen" } as TPointerInfo)

    const stored = canvas.model.getRootSymbol(text.id) as typeof text
    expect(stored.chars.map((c) => c.id)).toEqual(["c2"])
  })
})
