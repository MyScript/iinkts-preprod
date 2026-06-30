import { IIMathVariableInputList, TVariableInputItem } from "@/iink"

describe("IIMathVariableInputList.ts", () =>
{
  afterEach(() =>
  {
    document.body.innerHTML = ""
  })

  describe("constructor", () =>
  {
    test("should create element with one row per item", () =>
    {
      const items: TVariableInputItem[] = [
        { name: "x", initialValue: 3 },
        { name: "y", initialValue: 7 },
      ]
      const list = new IIMathVariableInputList(items)
      expect(list.element).toBeDefined()
      expect(list.element.children.length).toBe(2)
    })

    test("should create empty element when items is empty", () =>
    {
      const list = new IIMathVariableInputList([])
      expect(list.element.children.length).toBe(0)
    })
  })

  describe("row rendering", () =>
  {
    test("should set input value from initialValue", () =>
    {
      const list = new IIMathVariableInputList([{ name: "PI", initialValue: 3.14 }])
      const input = list.element.querySelector("input") as HTMLInputElement
      expect(input.value).toBe("3.14")
    })

    test("should leave input empty when initialValue is undefined", () =>
    {
      const list = new IIMathVariableInputList([{ name: "x" }])
      const input = list.element.querySelector("input") as HTMLInputElement
      expect(input.value).toBe("")
    })

    test("should disable input when item.disabled is true", () =>
    {
      const list = new IIMathVariableInputList([{ name: "x", disabled: true }])
      const input = list.element.querySelector("input") as HTMLInputElement
      expect(input.disabled).toBe(true)
    })

    test("should enable input when item.disabled is false", () =>
    {
      const list = new IIMathVariableInputList([{ name: "x", disabled: false }])
      const input = list.element.querySelector("input") as HTMLInputElement
      expect(input.disabled).toBe(false)
    })

    test("should show sourceType label when isDefinition is true", () =>
    {
      const list = new IIMathVariableInputList([{ name: "x", sourceType: "API", isDefinition: true }])
      const spans = list.element.querySelectorAll("span")
      const typeSpan = Array.from(spans).find(s => s.textContent === "API")
      expect(typeSpan).toBeDefined()
    })

    test("should show sourceType label when isDefinition is false", () =>
    {
      const list = new IIMathVariableInputList([{ name: "x", sourceType: "BLOCK", isDefinition: false }])
      const spans = list.element.querySelectorAll("span")
      const typeSpan = Array.from(spans).find(s => s.textContent === "Block")
      expect(typeSpan).toBeDefined()
    })

    test("should render sourceLabel span when provided", () =>
    {
      const list = new IIMathVariableInputList([{ name: "x", sourceType: "BLOCK", sourceLabel: "block-abc" }])
      const spans = list.element.querySelectorAll("span")
      const labelSpan = Array.from(spans).find(s => s.textContent === "block-abc")
      expect(labelSpan).toBeDefined()
      expect(labelSpan?.title).toBe("block-abc")
    })

    test("should render targetLabel column when targetLabel is provided", () =>
    {
      const list = new IIMathVariableInputList([{ name: "x", targetLabel: "block-xyz" }])
      const divs = list.element.querySelectorAll("div")
      const targetDiv = Array.from(divs).find(d => d.textContent === "block-xyz")
      expect(targetDiv).toBeDefined()
      expect(targetDiv?.title).toBe("block-xyz")
    })

    test("should render delete button when onDelete is provided", () =>
    {
      const list = new IIMathVariableInputList([{
        name: "x",
        onDelete: jest.fn()
      }])
      const buttons = list.element.querySelectorAll("button")
      expect(buttons.length).toBe(1)
      expect(buttons[0].textContent).toBe("✕")
    })

    test("should not render delete button when onDelete is undefined", () =>
    {
      const list = new IIMathVariableInputList([{ name: "x" }])
      const buttons = list.element.querySelectorAll("button")
      expect(buttons.length).toBe(0)
    })

    test("should call onDelete and removeRow when delete button is clicked", async () =>
    {
      const onDelete = jest.fn().mockResolvedValue(undefined)
      const list = new IIMathVariableInputList([{ name: "x", onDelete }])
      const btn = list.element.querySelector("button") as HTMLButtonElement
      await btn.click()
      await Promise.resolve()
      expect(onDelete).toHaveBeenCalledWith("x")
      // row removed from inputs
      expect(list.getValues().size).toBe(0)
    })
  })

  describe("key strategy — id vs name", () =>
  {
    test("should use id as key in inputs map when id is provided", () =>
    {
      const list = new IIMathVariableInputList([{ id: "usage-1", name: "x", initialValue: 5 }])
      const values = list.getValues()
      expect(values.has("usage-1")).toBe(true)
      expect(values.has("x")).toBe(false)
    })

    test("should fall back to name as key when id is undefined", () =>
    {
      const list = new IIMathVariableInputList([{ name: "y", initialValue: 9 }])
      const values = list.getValues()
      expect(values.has("y")).toBe(true)
    })
  })

  describe("getValues()", () =>
  {
    test("should return values for all filled inputs", () =>
    {
      const list = new IIMathVariableInputList([
        { name: "a", initialValue: 1 },
        { name: "b", initialValue: 2 },
      ])
      const values = list.getValues()
      expect(values.size).toBe(2)
      expect(values.get("a")).toBe(1)
      expect(values.get("b")).toBe(2)
    })

    test("should skip empty inputs", () =>
    {
      const list = new IIMathVariableInputList([{ name: "x" }])
      const values = list.getValues()
      expect(values.size).toBe(0)
    })

    test("should skip NaN inputs", () =>
    {
      const list = new IIMathVariableInputList([{ name: "x" }])
      const input = list.element.querySelector("input") as HTMLInputElement
      input.value = "abc"
      const values = list.getValues()
      expect(values.size).toBe(0)
    })

    test("should parse float values correctly", () =>
    {
      const list = new IIMathVariableInputList([{ name: "x", initialValue: 3.14 }])
      const values = list.getValues()
      expect(values.get("x")).toBeCloseTo(3.14)
    })

    test("should return empty map when no items", () =>
    {
      const list = new IIMathVariableInputList([])
      expect(list.getValues().size).toBe(0)
    })
  })

  describe("removeRow()", () =>
  {
    test("should remove row and its input from the map", () =>
    {
      const list = new IIMathVariableInputList([
        { name: "x", initialValue: 1 },
        { name: "y", initialValue: 2 },
      ])
      list.removeRow("x")
      const values = list.getValues()
      expect(values.has("x")).toBe(false)
      expect(values.has("y")).toBe(true)
    })

    test("should do nothing for unknown key", () =>
    {
      const list = new IIMathVariableInputList([{ name: "x", initialValue: 1 }])
      expect(() => list.removeRow("does-not-exist")).not.toThrow()
      expect(list.getValues().size).toBe(1)
    })

    test("should use id as key when item has id", () =>
    {
      const list = new IIMathVariableInputList([{ id: "u1", name: "x", initialValue: 5 }])
      list.removeRow("u1")
      expect(list.getValues().size).toBe(0)
    })
  })
})
