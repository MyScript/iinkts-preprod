import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { TextInputMenuItem, TMenuTextInput } from "@/iink"

const flush = async () => {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve()
  }
}

describe("TextInputMenuItem.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const build = (overrides: Partial<TMenuTextInput> = {}) => {
    const config: TMenuTextInput = {
      type: "textinput",
      id: "test-name",
      buttonLabel: "Save",
      placeholder: "File name",
      value: jest.fn(() => Promise.resolve("Shopping list for")),
      action: jest.fn(),
      ...overrides,
    }
    const item = new TextInputMenuItem(config, asCanvas(createCanvasMock()))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const input = wrapper.querySelector("#test-name-input") as HTMLInputElement
    const button = wrapper.querySelector("button") as HTMLButtonElement
    return { item, config, wrapper, input, button }
  }
  const type = (input: HTMLInputElement, text: string) => {
    input.value = text
    input.dispatchEvent(new Event("input"))
  }
  const submit = (button: HTMLButtonElement) => button.dispatchEvent(new Event("pointerup", { bubbles: true }))

  test("should fill the field with the suggested value on update", async () => {
    const { item, input, button } = build()

    item.update()
    await flush()

    expect(input.value).toEqual("Shopping list for")
    expect(input.placeholder).toEqual("File name")
    expect(button.textContent).toEqual("Save")
  })

  test("should keep what the user typed across updates", async () => {
    const { item, input } = build()
    item.update()
    await flush()

    type(input, "my notes")
    item.update()
    await flush()

    expect(input.value).toEqual("my notes")
  })

  test("should not compute a suggestion it would not show", async () => {
    const { item, input, config } = build()
    type(input, "my notes")

    item.update()
    await flush()

    expect(config.value).not.toHaveBeenCalled()
  })

  test("should run the action with the trimmed value, then close the menu", async () => {
    const { config, wrapper, input, button } = build()
    const closed = jest.fn()
    wrapper.addEventListener("ms-menu-close", closed)
    type(input, "  my notes ")

    submit(button)
    await flush()

    expect(config.action).toHaveBeenCalledWith(expect.anything(), "my notes")
    expect(closed).toHaveBeenCalled()
  })

  test("should suggest again once submitted", async () => {
    const { item, input, button } = build()
    type(input, "my notes")
    submit(button)
    await flush()

    item.update()
    await flush()

    expect(input.value).toEqual("Shopping list for")
  })

  test("should head the field with its icon, title and hint", () => {
    const { wrapper } = build({ icon: "<svg id='icon'></svg>", title: "Save to a file", hint: "To resume later" })

    expect(wrapper.querySelector(".ms-menu-field-title")?.textContent).toEqual("Save to a file")
    expect(wrapper.querySelector(".ms-menu-field-title #icon")).toBeTruthy()
    expect(wrapper.querySelector(".ms-menu-field-hint")?.textContent).toEqual("To resume later")
  })

  test("should have no heading without title nor hint", () => {
    const { wrapper } = build()

    expect(wrapper.querySelector(".ms-menu-field-title, .ms-menu-field-hint")).toBeNull()
  })
})
