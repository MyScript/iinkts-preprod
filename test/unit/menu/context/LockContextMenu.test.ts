import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../helpers"
import { LockContextMenu, TSymbol } from "@/iink"

describe("LockContextMenu.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const setup = (symbols: TSymbol[]) => {
    const canvas = createCanvasMock()
    symbols.forEach((s) => {
      canvas.model.addSymbol(s)
      canvas.model.selectSymbol(s.id)
    })
    const item = new LockContextMenu(asCanvas(canvas))
    const button = item.getElement()
    document.body.appendChild(button)
    return { canvas, item, button }
  }
  const click = async (button: HTMLElement) => {
    button.dispatchEvent(new Event("pointerup", { bubbles: true }))
    await Promise.resolve()
  }

  test("offers to lock a selection holding an unlocked symbol, and locks all of it", async () => {
    const free = buildIIStroke()
    const locked: TSymbol = { ...buildIIStroke(), locked: true }
    const { canvas, button } = setup([free, locked])

    expect(button.id).toEqual("ms-menu-context-lock")
    expect(button.textContent).toEqual("Lock")
    await click(button)

    expect(canvas.lockSymbols).toHaveBeenCalledWith([free.id, locked.id])
    expect(canvas.unlockSymbols).not.toHaveBeenCalled()
  })

  test("offers to unlock a fully locked selection, and unlocks it", async () => {
    const locked: TSymbol = { ...buildIIStroke(), locked: true }
    const { canvas, button } = setup([locked])

    expect(button.textContent).toEqual("Unlock")
    await click(button)

    expect(canvas.unlockSymbols).toHaveBeenCalledWith([locked.id])
  })

  test("redraws the selection frame so its handles match the new state", async () => {
    const { canvas, button } = setup([buildIIStroke()])

    await click(button)

    expect(canvas.selector.drawSelectedGroup).toHaveBeenCalled()
  })

  test("update relabels the button after the selection changed", () => {
    const free = buildIIStroke()
    const { canvas, item, button } = setup([free])
    canvas.model.updateSymbol({ ...free, locked: true })

    item.update()

    expect(button.textContent).toEqual("Unlock")
  })
})
