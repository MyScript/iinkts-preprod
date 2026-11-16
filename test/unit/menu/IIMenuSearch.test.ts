import { createCanvasMock, asCanvas } from "../__mocks__/createCanvasMock"
import { IIMenuSearch, IISearchManager, TSearchMatch } from "@/iink"

const match = (text: string, y: number): TSearchMatch => ({
  text,
  context: text,
  kind: "text",
  source: "ink",
  symbolIds: [`s-${y}`],
  boxes: [{ x: 0, y, width: 10, height: 10 }],
  bounds: { x: 0, y, width: 10, height: 10 },
})

function setup(matches: TSearchMatch[] = [match("a", 0), match("a", 20), match("a", 40)]) {
  let highlighted: TSearchMatch[] = []
  const search = {
    find: jest.fn(() => matches),
    highlight: jest.fn((m: TSearchMatch[]) => {
      highlighted = m
    }),
    clear: jest.fn(() => {
      highlighted = []
    }),
    reveal: jest.fn(),
    get highlighted() {
      return highlighted
    },
  }
  const canvas = createCanvasMock({ search: search as unknown as IISearchManager })
  const layer = document.createElement("div")
  document.body.appendChild(layer)
  const menu = new IIMenuSearch(asCanvas(canvas))
  menu.render(layer)
  const input = () => layer.querySelector<HTMLInputElement>("#ms-menu-search-input")!
  const count = () => layer.querySelector("#ms-menu-search-count")!.textContent
  const type = (value: string) => {
    input().value = value
    input().dispatchEvent(new Event("input"))
  }
  const key = (k: string, shiftKey = false) =>
    input().dispatchEvent(new KeyboardEvent("keydown", { key: k, shiftKey, bubbles: true }))
  return { canvas, search, layer, menu, input, count, type, key, matches }
}

describe("IIMenuSearch", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should render hidden", () => {
    const { layer, menu } = setup()
    expect(layer.querySelector("#ms-menu-search")).not.toBeNull()
    expect(menu.isOpen).toBe(false)
  })

  test("should render nothing when disabled", () => {
    const canvas = createCanvasMock()
    canvas.configuration.menu.search.enable = false
    const layer = document.createElement("div")
    new IIMenuSearch(asCanvas(canvas)).render(layer)
    expect(layer.querySelector("#ms-menu-search")).toBeNull()
  })

  test("open should show the bar and focus the input", () => {
    const { menu, input } = setup()
    menu.open()
    expect(menu.isOpen).toBe(true)
    expect(document.activeElement).toBe(input())
  })

  test("typing should find and highlight every match, none active", () => {
    const { menu, search, type, count, matches } = setup()
    menu.open()
    type("a")
    expect(search.find).toHaveBeenCalledWith("a")
    expect(search.highlight).toHaveBeenLastCalledWith(matches)
    expect(count()).toBe("0/3")
  })

  test("should tell when nothing is found", () => {
    const { menu, type, count } = setup([])
    menu.open()
    type("zzz")
    expect(count()).toBe("0/0")
  })

  test("Enter should reveal the next match, Shift+Enter the previous one, wrapping around", () => {
    const { menu, search, type, key, count, matches } = setup()
    menu.open()
    type("a")
    key("Enter")
    expect(search.reveal).toHaveBeenLastCalledWith(matches[0])
    expect(search.highlight).toHaveBeenLastCalledWith(matches, matches[0])
    expect(count()).toBe("1/3")
    key("Enter", true)
    expect(search.reveal).toHaveBeenLastCalledWith(matches[2])
    expect(count()).toBe("3/3")
  })

  test("the next and previous buttons should navigate", () => {
    const { menu, search, type, layer, matches } = setup()
    menu.open()
    type("a")
    layer.querySelector<HTMLButtonElement>("#ms-menu-search-next")!.click()
    layer.querySelector<HTMLButtonElement>("#ms-menu-search-next")!.click()
    expect(search.reveal).toHaveBeenLastCalledWith(matches[1])
    layer.querySelector<HTMLButtonElement>("#ms-menu-search-previous")!.click()
    expect(search.reveal).toHaveBeenLastCalledWith(matches[0])
  })

  test("navigation should follow the matches the highlight refreshed", () => {
    const { menu, search, type, key } = setup()
    menu.open()
    type("a")
    const refreshed = [match("a", 100)]
    search.highlight(refreshed)
    key("Enter")
    expect(search.reveal).toHaveBeenLastCalledWith(refreshed[0])
  })

  test("Escape should close the bar and clear the highlight", () => {
    const { menu, search, type, key } = setup()
    menu.open()
    type("a")
    key("Escape")
    expect(menu.isOpen).toBe(false)
    expect(search.clear).toHaveBeenCalled()
  })

  test("the close button should close the bar", () => {
    const { menu, layer } = setup()
    menu.open()
    layer.querySelector<HTMLButtonElement>("#ms-menu-search-close")!.click()
    expect(menu.isOpen).toBe(false)
  })

  test("opening again should keep the query selected", () => {
    const { menu, input, type } = setup()
    menu.open()
    type("abc")
    menu.close()
    menu.open()
    expect(input().value).toBe("abc")
    expect(input().selectionStart).toBe(0)
    expect(input().selectionEnd).toBe(3)
  })

  test("destroy should remove the bar", () => {
    const { menu, layer } = setup()
    menu.destroy()
    expect(layer.querySelector("#ms-menu-search")).toBeNull()
    expect(menu.isOpen).toBe(false)
  })
})
