import { buildIIStroke } from "../../helpers"
import { DefaultInteractiveInkCanvasConfiguration, InteractiveInkCanvas, OBBOps, SymbolGeometry, TInteractiveInkCanvasOptions, TStroke } from "@/iink"

describe("InteractiveInkCanvas lock", () => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ result: {} }) })) as jest.Mock
  const options: TInteractiveInkCanvasOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultInteractiveInkCanvasConfiguration)),
  }

  const buildCanvas = async (): Promise<InteractiveInkCanvas> => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), options)
    canvas.client.init = jest.fn(() => Promise.resolve())
    canvas.client.waitForIdle = jest.fn(() => Promise.resolve())
    canvas.client.eraseStrokes = jest.fn(() => Promise.resolve())
    canvas.client.replaceStrokes = jest.fn(() => Promise.resolve())
    canvas.client.clear = jest.fn(() => Promise.resolve())
    canvas.renderer.drawSymbol = jest.fn()
    await canvas.initialize()
    return canvas
  }

  const addStrokes = (canvas: InteractiveInkCanvas): { locked: TStroke; free: TStroke } => {
    const locked: TStroke = { ...buildIIStroke(), locked: true }
    const free = buildIIStroke()
    canvas.model.addSymbol(locked)
    canvas.model.addSymbol(free)
    return { locked, free }
  }

  const refusedSpy = (canvas: InteractiveInkCanvas): jest.Mock => {
    const spy = jest.fn()
    canvas.event.addLockedRefusedListener(spy)
    return spy
  }

  describe("guard", () => {
    test("updateSymbols leaves a locked symbol untouched and updates the others", async () => {
      const canvas = await buildCanvas()
      const { locked, free } = addStrokes(canvas)

      const updated = await canvas.updateSymbols([locked.id, free.id], { style: { color: "red" } })

      expect(updated.map((s) => s.id)).toEqual([free.id])
      expect(canvas.model.getSymbol(locked.id)).toBe(locked)
      expect(canvas.model.getSymbol(free.id)?.style.color).toBe("red")
    })

    test("updateSymbols never hands a locked symbol to a function patch", async () => {
      const canvas = await buildCanvas()
      const { locked } = addStrokes(canvas)
      const patch = jest.fn()

      await canvas.updateSymbols([locked.id], patch)

      expect(patch).not.toHaveBeenCalled()
    })

    test("updateSymbols reports the locked symbols it refused", async () => {
      const canvas = await buildCanvas()
      const { locked, free } = addStrokes(canvas)
      const refused = refusedSpy(canvas)

      await canvas.updateSymbols([locked.id, free.id], { style: { color: "red" } })

      expect(refused).toHaveBeenCalledWith([locked])
    })

    test("removeSymbols keeps a locked symbol and erases only the others on the server", async () => {
      const canvas = await buildCanvas()
      const { locked, free } = addStrokes(canvas)
      const refused = refusedSpy(canvas)

      const removed = await canvas.removeSymbols([locked.id, free.id])

      expect(removed.map((s) => s.id)).toEqual([free.id])
      expect(canvas.model.getSymbol(locked.id)).toBe(locked)
      expect(canvas.client.eraseStrokes).toHaveBeenCalledWith([free.id])
      expect(refused).toHaveBeenCalledWith([locked])
    })

    test("removeSymbol does nothing to a locked symbol", async () => {
      const canvas = await buildCanvas()
      const { locked } = addStrokes(canvas)
      const refused = refusedSpy(canvas)

      await canvas.removeSymbol(locked.id)

      expect(canvas.model.getSymbol(locked.id)).toBe(locked)
      expect(canvas.client.eraseStrokes).not.toHaveBeenCalled()
      expect(refused).toHaveBeenCalledWith([locked])
    })

    test("replaceSymbols refuses the whole replacement when one old symbol is locked", async () => {
      const canvas = await buildCanvas()
      const { locked, free } = addStrokes(canvas)
      const refused = refusedSpy(canvas)
      const replacement = buildIIStroke()

      await canvas.replaceSymbols([free, locked], [replacement])

      expect(canvas.model.symbols.map((s) => s.id)).toEqual([locked.id, free.id])
      expect(canvas.client.replaceStrokes).not.toHaveBeenCalled()
      expect(refused).toHaveBeenCalledWith([locked])
    })

    test("changeOrderSymbols keeps a locked symbol in place", async () => {
      const canvas = await buildCanvas()
      const { locked, free } = addStrokes(canvas)
      canvas.renderer.changeOrderSymbol = jest.fn()
      const refused = refusedSpy(canvas)

      canvas.changeOrderSymbols([locked, free], "first")

      expect(canvas.renderer.changeOrderSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.changeOrderSymbol).toHaveBeenCalledWith(free, "first")
      expect(refused).toHaveBeenCalledWith([locked])
    })

    test("changeOrderSymbols pushes no history step when every symbol is locked", async () => {
      const canvas = await buildCanvas()
      const { locked } = addStrokes(canvas)
      canvas.history.push = jest.fn()

      canvas.changeOrderSymbols([locked], "first")

      expect(canvas.history.push).not.toHaveBeenCalled()
    })
  })

  describe("refusal feedback", () => {
    test("a refused change flashes a padlock at the top-right corner of the locked symbols", async () => {
      const canvas = await buildCanvas()
      canvas.renderer.flashLockIcon = jest.fn()
      const { locked } = addStrokes(canvas)
      const box = OBBOps.toBox(SymbolGeometry.boundsOf(locked))

      await canvas.removeSymbols([locked.id])

      expect(canvas.renderer.flashLockIcon).toHaveBeenCalledWith({ x: box.x + box.width, y: box.y })
    })
  })

  describe("clear", () => {
    test("keeps locked symbols and erases the others", async () => {
      const canvas = await buildCanvas()
      const { locked, free } = addStrokes(canvas)

      await canvas.clear()

      expect(canvas.model.symbols).toEqual([locked])
      expect(canvas.client.clear).not.toHaveBeenCalled()
      expect(canvas.client.eraseStrokes).toHaveBeenCalledWith([free.id])
    })

    test("still reports cleared and refuses nothing when locked symbols stay", async () => {
      const canvas = await buildCanvas()
      addStrokes(canvas)
      const cleared = jest.fn()
      canvas.event.addClearedListener(cleared)
      const refused = refusedSpy(canvas)

      await canvas.clear()

      expect(cleared).toHaveBeenCalledTimes(1)
      expect(refused).not.toHaveBeenCalled()
    })

    test("clears the server in one call when nothing is locked", async () => {
      const canvas = await buildCanvas()
      canvas.model.addSymbol(buildIIStroke())

      await canvas.clear()

      expect(canvas.client.clear).toHaveBeenCalledTimes(1)
      expect(canvas.model.symbols).toHaveLength(0)
    })
  })

  describe("lockSymbols / unlockSymbols", () => {
    test("lockSymbols marks the symbols locked and leaves the others alone", async () => {
      const canvas = await buildCanvas()
      const locked = buildIIStroke()
      const free = buildIIStroke()
      canvas.model.addSymbol(locked)
      canvas.model.addSymbol(free)

      await canvas.lockSymbols([locked.id])

      expect(canvas.model.getSymbol(locked.id)?.locked).toBe(true)
      expect(canvas.model.getSymbol(free.id)?.locked).toBeFalsy()
    })

    test("unlockSymbols clears the flag", async () => {
      const canvas = await buildCanvas()
      const stroke = { ...buildIIStroke(), locked: true }
      canvas.model.addSymbol(stroke)

      await canvas.unlockSymbols([stroke.id])

      expect(canvas.model.getSymbol(stroke.id)?.locked).toBe(false)
    })

    test("lockSymbols redraws the symbol so the renderer can mark it", async () => {
      const canvas = await buildCanvas()
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)

      await canvas.lockSymbols([stroke.id])

      expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(expect.objectContaining({ id: stroke.id, locked: true }))
    })

    test("lockSymbols is one undo step holding the before and after records", async () => {
      const canvas = await buildCanvas()
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.history.push = jest.fn()

      await canvas.lockSymbols([stroke.id])

      expect(canvas.history.push).toHaveBeenCalledTimes(1)
      const [[{ updated }]] = (canvas.history.push as jest.Mock).mock.calls
      expect(updated).toHaveLength(1)
      expect(updated[0].before).toEqual(stroke)
      expect(updated[0].after).toEqual(expect.objectContaining({ id: stroke.id, locked: true }))
    })

    test("lockSymbols skips symbols already locked and pushes no empty step", async () => {
      const canvas = await buildCanvas()
      const stroke = { ...buildIIStroke(), locked: true }
      canvas.model.addSymbol(stroke)
      canvas.history.push = jest.fn()

      const changed = await canvas.lockSymbols([stroke.id])

      expect(changed).toHaveLength(0)
      expect(canvas.history.push).not.toHaveBeenCalled()
    })

    test("lockSymbols does not push history when told not to", async () => {
      const canvas = await buildCanvas()
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.history.push = jest.fn()

      await canvas.lockSymbols([stroke.id], false)

      expect(canvas.model.getSymbol(stroke.id)?.locked).toBe(true)
      expect(canvas.history.push).not.toHaveBeenCalled()
    })
  })
})
