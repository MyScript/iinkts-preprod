import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { IIMenuSearch, SearchMenuAction } from "@/iink"

function setup(isOpen = false) {
  const search = { isOpen, open: jest.fn(), close: jest.fn() }
  const canvas = createCanvasMock()
  Object.assign(canvas.menu, { search: search as unknown as IIMenuSearch })
  const item = new SearchMenuAction(asCanvas(canvas))
  const button = item.getElement()
  document.body.appendChild(button)
  const tap = () => button.dispatchEvent(new Event("pointerup", { bubbles: true }))
  return { search, item, button, tap }
}

describe("SearchMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build an icon-only button", () => {
    const { button } = setup()
    expect(button.id).toEqual("ms-menu-action-search")
    expect(button.classList.contains("square")).toBe(true)
  })

  test("should open the search bar when it is closed", () => {
    const { search, tap } = setup(false)
    tap()
    expect(search.open).toHaveBeenCalled()
    expect(search.close).not.toHaveBeenCalled()
  })

  test("should close the search bar when it is open", () => {
    const { search, tap } = setup(true)
    tap()
    expect(search.close).toHaveBeenCalled()
    expect(search.open).not.toHaveBeenCalled()
  })

  test("should be active while the search bar is open", () => {
    const { search, item, button } = setup(false)
    item.update()
    expect(button.classList.contains("active")).toBe(false)
    search.isOpen = true
    item.update()
    expect(button.classList.contains("active")).toBe(true)
  })
})
