import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { DefaultIIRendererConfiguration, IIMoveManager, TPointerInfo } from "@/iink"

describe("IIMoveManager.ts", () => {
  test("should instanciate", () => {
    const canvas = createCanvasMock()
    const manager = new IIMoveManager(asCanvas(canvas))
    expect(manager).toBeDefined()
    expect(manager.origin).toBeUndefined()
  })

  describe("move process", () => {
    const canvas = createCanvasMock()
    canvas.init()

    const manager = new IIMoveManager(asCanvas(canvas))

    test("should init origin on start", async () => {
      const info = {
        clientX: 1,
        clientY: 2,
      } as TPointerInfo

      manager.start(info)
      expect(manager.origin).toBeDefined()
      expect(manager.origin).toEqual({
        clientX: 1,
        clientY: 2,
        viewBoxX: 0,
        viewBoxY: 0,
      })
      expect(manager.renderer.getViewBox()).toEqual({
        x: 0,
        y: 0,
        width: DefaultIIRendererConfiguration.minWidth,
        height: DefaultIIRendererConfiguration.minHeight,
      })
    })

    test("should update viewbox on renderer.parent on continu", async () => {
      const info = {
        clientX: 75,
        clientY: 102,
      } as TPointerInfo
      manager.continue(info)
      // viewBox update is coalesced to once per animation frame, see "continue() viewbox update throttle" below.
      await new Promise((resolve) => requestAnimationFrame(resolve))
      expect(manager.renderer.getViewBox()).toEqual({
        x: -74,
        y: -100,
        width: DefaultIIRendererConfiguration.minWidth,
        height: DefaultIIRendererConfiguration.minHeight,
      })
      expect(manager.renderer.parent.scrollLeft).toEqual(0)
      expect(manager.renderer.parent.scrollTop).toEqual(0)
    })

    test("should update viewbox on renderer.parent and clear origin on end", async () => {
      const info = {
        clientX: -42,
        clientY: -96,
      } as TPointerInfo

      manager.end(info)
      expect(manager.renderer.getViewBox()).toEqual({
        x: 43,
        y: 98,
        width: DefaultIIRendererConfiguration.minWidth,
        height: DefaultIIRendererConfiguration.minHeight,
      })
      expect(manager.renderer.parent.scrollLeft).toEqual(0)
      expect(manager.renderer.parent.scrollTop).toEqual(0)
      expect(manager.origin).toBeUndefined()
    })
  })

  describe("continue() viewbox update throttle", () => {
    const canvas = createCanvasMock()
    canvas.init()

    const manager = new IIMoveManager(asCanvas(canvas))
    manager.renderer.setViewBox = jest.fn()

    test("should coalesce several continue() calls into a single setViewBox call per animation frame", async () => {
      manager.start({ clientX: 0, clientY: 0 } as TPointerInfo)
      ;(manager.renderer.setViewBox as jest.Mock).mockClear()

      manager.continue({ clientX: 10, clientY: 10 } as TPointerInfo)
      manager.continue({ clientX: 20, clientY: 20 } as TPointerInfo)
      manager.continue({ clientX: 30, clientY: 30 } as TPointerInfo)

      expect(manager.renderer.setViewBox).not.toHaveBeenCalled()

      await new Promise((resolve) => requestAnimationFrame(resolve))

      expect(manager.renderer.setViewBox).toHaveBeenCalledTimes(1)
      expect(manager.renderer.setViewBox).toHaveBeenCalledWith(-30, -30, expect.any(Number), expect.any(Number), false)
    })

    test("should still update the viewbox immediately on end(), without a pending stale frame", async () => {
      manager.continue({ clientX: 5, clientY: 5 } as TPointerInfo)
      ;(manager.renderer.setViewBox as jest.Mock).mockClear()

      manager.end({ clientX: 15, clientY: 15 } as TPointerInfo)
      expect(manager.renderer.setViewBox).toHaveBeenCalledTimes(1)
      expect(manager.renderer.setViewBox).toHaveBeenCalledWith(-15, -15, expect.any(Number), expect.any(Number), true)

      // If the pending frame from the continue() above wasn't cancelled, it would fire here
      // and call setViewBox again with the stale mid-gesture position.
      await new Promise((resolve) => requestAnimationFrame(resolve))
      expect(manager.renderer.setViewBox).toHaveBeenCalledTimes(1)
    })
  })
})
