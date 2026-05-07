import { VariableColorManager } from "../../../src/manager/math/VariableColorManager"

describe("VariableColorManager", () =>
{
  beforeEach(() =>
  {
    const manager = VariableColorManager.getInstance()
    manager.clear() // Reset for each test
  })

  afterEach(() =>
  {
    const manager = VariableColorManager.getInstance()
    manager.clear()
  })

  describe("Singleton pattern", () =>
  {
    test("should return same instance", () =>
    {
      const instance1 = VariableColorManager.getInstance()
      const instance2 = VariableColorManager.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("getColorForVariable", () =>
  {
    test("should return consistent color for same variable", () =>
    {
      const manager = VariableColorManager.getInstance()
      const color1 = manager.getColorForVariable("x")
      const color2 = manager.getColorForVariable("x")
      expect(color1).toBe(color2)
    })

    test("should return different colors for different variables", () =>
    {
      const manager = VariableColorManager.getInstance()
      const colorX = manager.getColorForVariable("x")
      const colorY = manager.getColorForVariable("y")
      expect(colorX).not.toBe(colorY)
    })

    test("should cycle through palette when variables exceed palette size", () =>
    {
      const manager = VariableColorManager.getInstance()
      const palette = VariableColorManager.getPalette()
      const colors = []

      // Get colors for more variables than palette size
      for (let i = 0; i < palette.length + 5; i++) {
        colors.push(manager.getColorForVariable(`var${i}`))
      }

      // First color should repeat after cycling
      expect(colors[0]).toBe(colors[palette.length])
      expect(colors[1]).toBe(colors[palette.length + 1])
    })

    test("should return valid hex colors", () =>
    {
      const manager = VariableColorManager.getInstance()
      const color = manager.getColorForVariable("test")
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })

  describe("getAllVariableColors", () =>
  {
    test("should return empty map initially", () =>
    {
      const manager = VariableColorManager.getInstance()
      const colors = manager.getAllVariableColors()
      expect(colors.size).toBe(0)
    })

    test("should return all assigned variable colors", () =>
    {
      const manager = VariableColorManager.getInstance()
      manager.getColorForVariable("x")
      manager.getColorForVariable("y")
      manager.getColorForVariable("z")

      const colors = manager.getAllVariableColors()
      expect(colors.size).toBe(3)
      expect(colors.has("x")).toBe(true)
      expect(colors.has("y")).toBe(true)
      expect(colors.has("z")).toBe(true)
    })

    test("should return copy not reference", () =>
    {
      const manager = VariableColorManager.getInstance()
      manager.getColorForVariable("x")
      const colors = manager.getAllVariableColors()
      colors.set("y", "#000000")

      // Original should not be affected
      const originalColors = manager.getAllVariableColors()
      expect(originalColors.has("y")).toBe(false)
    })
  })

  describe("clear", () =>
  {
    test("should remove all variable color assignments", () =>
    {
      const manager = VariableColorManager.getInstance()
      manager.getColorForVariable("x")
      manager.getColorForVariable("y")
      expect(manager.getAllVariableColors().size).toBe(2)

      manager.clear()
      expect(manager.getAllVariableColors().size).toBe(0)
    })

    test("should reset color index", () =>
    {
      const manager = VariableColorManager.getInstance()
      const firstColor = manager.getColorForVariable("x")
      manager.clear()
      const sameColor = manager.getColorForVariable("y")

      // After clear, next variable should get first color again
      expect(firstColor).toBe(sameColor)
    })
  })

  describe("removeVariable", () =>
  {
    test("should remove specific variable", () =>
    {
      const manager = VariableColorManager.getInstance()
      manager.getColorForVariable("x")
      manager.getColorForVariable("y")

      manager.removeVariable("x")

      const colors = manager.getAllVariableColors()
      expect(colors.has("x")).toBe(false)
      expect(colors.has("y")).toBe(true)
    })

    test("should allow reassignment after removal", () =>
    {
      const manager = VariableColorManager.getInstance()
      manager.getColorForVariable("x")
      manager.removeVariable("x")
      const newColor = manager.getColorForVariable("x")

      // May or may not be same color depending on index state
      expect(newColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })

  describe("getPalette", () =>
  {
    test("should return non-empty palette", () =>
    {
      const palette = VariableColorManager.getPalette()
      expect(palette.length).toBeGreaterThan(0)
    })

    test("should return array of valid hex colors", () =>
    {
      const palette = VariableColorManager.getPalette()
      palette.forEach(color =>
      {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })

    test("should return copy not reference", () =>
    {
      const palette1 = VariableColorManager.getPalette()
      palette1.push("#000000")

      const palette2 = VariableColorManager.getPalette()
      expect(palette2.length).not.toBe(palette1.length)
    })
  })
})
