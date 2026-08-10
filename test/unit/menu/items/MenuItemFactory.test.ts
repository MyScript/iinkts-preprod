import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import {
  createMenuItemInstance,
  TAllMenuItems,
  TGenericMenuItem,
  ButtonMenuItem,
  CheckboxMenuItem,
  SelectMenuItem,
  ButtonListMenuItem,
  SubMenuItem,
  ColorListMenuItem,
  RangeMenuItem,
  FileInputMenuItem,
} from "@/iink"

describe("MenuItemFactory.ts", () => {
  const canvas = createCanvasMock()

  test.each([
    ["button", { type: "button", id: "b", action: jest.fn() }, ButtonMenuItem],
    ["checkbox", { type: "checkbox", id: "c", getValue: jest.fn(), setValue: jest.fn() }, CheckboxMenuItem],
    ["select", { type: "select", id: "s", options: [], getValue: jest.fn(), setValue: jest.fn() }, SelectMenuItem],
    [
      "buttonlist",
      { type: "buttonlist", id: "bl", options: [], getValue: jest.fn(), setValue: jest.fn() },
      ButtonListMenuItem,
    ],
    ["submenu", { type: "submenu", id: "sm", items: [] }, SubMenuItem],
    ["colorlist", { type: "colorlist", id: "cl", colors: [], fill: true, onChange: jest.fn() }, ColorListMenuItem],
    ["range", { type: "range", id: "r", min: 0, max: 1, step: 1, onChange: jest.fn() }, RangeMenuItem],
    ["fileinput", { type: "fileinput", id: "fi", action: jest.fn() }, FileInputMenuItem],
  ])("should create a %s config as %p", (_type, config, expectedClass) => {
    const item = createMenuItemInstance(config as TAllMenuItems, asCanvas(canvas))
    expect(item).toBeInstanceOf(expectedClass)
  })

  test("should throw for an unknown menu item type", () => {
    const config = { type: "unknown", id: "u" } as unknown as TGenericMenuItem
    expect(() => createMenuItemInstance(config as TAllMenuItems, asCanvas(canvas))).toThrow(
      "Unknown menu item type: unknown"
    )
  })
})
