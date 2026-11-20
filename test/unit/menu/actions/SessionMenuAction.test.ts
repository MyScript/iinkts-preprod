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
  const build = (
    restore = jest.fn(() => Promise.resolve("imported")),
    suggestedFileName = jest.fn(() => Promise.resolve<string | undefined>("Shopping list for"))
  ) => {
    const canvas = createCanvasMock({ session: { restore, suggestedFileName } as never })
    jest.spyOn(canvas.layers, "showMessageInfo").mockImplementation(() => undefined)
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

  test("should build a Session submenu to save the session and open a .iinkts file, each explained", () => {
    const { wrapper } = build()
    const text = (selector: string) => wrapper.querySelector(selector)?.textContent

    expect(wrapper.querySelector("#ms-menu-action-session-trigger")).toBeTruthy()
    // In tests an SVG import is its file name, so the icon's text comes before the title
    expect(text("#ms-menu-action-session-save .ms-menu-field-title")).toMatch(/Save to a file$/)
    expect(text("#ms-menu-action-session-save .ms-menu-field-hint")).toEqual("Content and recognition, to resume later")
    expect((wrapper.querySelector("#ms-menu-action-session-save-input") as HTMLInputElement).placeholder).toEqual("File name")
    expect(text("#ms-menu-action-session-save button")).toEqual("Download .iinkts")
    expect(text("#ms-menu-action-session-open .ms-menu-field-title")).toMatch(/Open a file$/)
    expect(text("#ms-menu-action-session-open .ms-menu-field-hint")).toEqual("Replaces the current content")
    expect(text("#ms-menu-action-session-open button")).toEqual("Open session")
    expect((wrapper.querySelector("#ms-menu-action-session-open-input") as HTMLInputElement).accept).toEqual(".iinkts")
  })

  const save = (wrapper: HTMLElement, name?: string) => {
    const input = wrapper.querySelector("#ms-menu-action-session-save-input") as HTMLInputElement
    if (name !== undefined) {
      input.value = name
      input.dispatchEvent(new Event("input"))
    }
    wrapper.querySelector("#ms-menu-action-session-save button")!.dispatchEvent(new Event("pointerup"))
  }

  test("should suggest the first words of the document as file name", async () => {
    const { wrapper } = build()
    const submenu = wrapper.querySelector("#ms-menu-action-session-trigger") as HTMLButtonElement

    submenu.dispatchEvent(new Event("pointerdown"))
    await flush()

    expect((wrapper.querySelector("#ms-menu-action-session-save-input") as HTMLInputElement).value).toEqual("Shopping list for")
  })

  test("should download the session under the name typed on Save", async () => {
    const { canvas, wrapper } = build()

    save(wrapper, "my notes")
    await flush()

    expect(canvas.download).toHaveBeenCalledWith("session", { filename: "my notes" })
    expect(canvas.layers.showMessageInfo).toHaveBeenCalledWith({ message: "Session saved: my notes.iinkts" })
  })

  test("should download the session under the first words of the document when the field is empty", async () => {
    const { canvas, wrapper } = build()

    save(wrapper, "   ")
    await flush()

    expect(canvas.download).toHaveBeenCalledWith("session", { filename: "Shopping list for" })
    expect(canvas.layers.showMessageInfo).toHaveBeenCalledWith({ message: "Session saved: Shopping list for.iinkts" })
  })

  test("should download the session under its dated name when nothing is recognized", async () => {
    const { canvas, wrapper } = build(undefined, jest.fn(() => Promise.resolve<string | undefined>(undefined)))

    save(wrapper, "")
    await flush()

    expect(canvas.download).toHaveBeenCalledWith("session", { filename: undefined })
    expect(canvas.layers.showMessageInfo).toHaveBeenCalledWith({ message: "Session saved" })
  })

  test("should restore the session from the file opened", async () => {
    const { canvas, wrapper, restore } = build()
    const file = new File(["{}"], "notes.iinkts", { type: "application/json" })

    open(wrapper, file)
    await flush()

    expect(restore).toHaveBeenCalledWith(file)
    // The content coming back is the confirmation
    expect(canvas.layers.showMessageInfo).not.toHaveBeenCalled()
  })

  test("should tell when the strokes of the opened session are recognized again", async () => {
    const { canvas, wrapper } = build(jest.fn(() => Promise.resolve("replayed")))

    open(wrapper, new File(["{}"], "notes.iinkts"))
    await flush()

    expect(canvas.layers.showMessageInfo).toHaveBeenCalledWith({ message: "Session restored, its strokes are recognized again" })
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
