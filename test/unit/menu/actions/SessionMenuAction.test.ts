import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { IIMenuAction, SessionMenuAction } from "@/iink"

const setInputFiles = (input: HTMLInputElement, files: File[]): void => {
  Object.defineProperty(input, "files", { value: files, configurable: true })
}
const flush = async () => {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve()
  }
}

describe("SessionMenuAction.ts", () => {
  const build = (restore = jest.fn(() => Promise.resolve("imported"))) => {
    const canvas = createCanvasMock({ session: { restore } as never })
    const wrapper = new SessionMenuAction(asCanvas(canvas)).getElement()
    document.body.appendChild(wrapper)
    return { canvas, wrapper, restore }
  }
  const open = (wrapper: HTMLElement, file: File) => {
    const input = wrapper.querySelector("#ms-menu-action-session-open-input") as HTMLInputElement
    setInputFiles(input, [file])
    input.dispatchEvent(new Event("change"))
    const button = input.parentElement!.querySelector("button") as HTMLButtonElement
    button.dispatchEvent(new Event("pointerup", { bubbles: true, cancelable: true }))
  }

  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a Session submenu to save the session and open a .iinkts file", () => {
    const { wrapper } = build()

    expect(wrapper.querySelector("#ms-menu-action-session-trigger")).toBeTruthy()
    expect(wrapper.querySelector("#ms-menu-action-session-save")?.textContent).toEqual("Save")
    expect((wrapper.querySelector("#ms-menu-action-session-open-input") as HTMLInputElement).accept).toEqual(".iinkts")
  })

  test("should download the session on Save", async () => {
    const { canvas, wrapper } = build()

    wrapper.querySelector("#ms-menu-action-session-save")!.dispatchEvent(new Event("pointerup"))
    await flush()

    expect(canvas.download).toHaveBeenCalledWith("session")
  })

  test("should restore the session from the file opened", async () => {
    const { wrapper, restore } = build()
    const file = new File(["{}"], "notes.iinkts", { type: "application/json" })

    open(wrapper, file)
    await flush()

    expect(restore).toHaveBeenCalledWith(file)
  })

  test("should report a file that is not a session", async () => {
    const error = new Error("Not an iinkTS session file")
    const { canvas, wrapper } = build(jest.fn(() => Promise.reject(error)))

    open(wrapper, new File(["[]"], "symbols.json"))
    await flush()

    expect(canvas.manageError).toHaveBeenCalledWith(error)
  })

  test("should be in the action menu unless config.session is false", () => {
    const render = (session?: boolean) => {
      const canvas = createCanvasMock()
      new IIMenuAction(asCanvas(canvas), "ms-menu-action", session === undefined ? {} : { session }).render(canvas.layers.ui.root)
      return canvas.layers.ui.root
    }

    expect(render().querySelector("#ms-menu-action-session-trigger")).toBeTruthy()
    expect(render(false).querySelector("#ms-menu-action-session-trigger")).toBeNull()
  })
})
