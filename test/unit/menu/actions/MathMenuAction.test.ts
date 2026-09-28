import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { MATH_SOLVER_DEBOUNCE_MS, MathMenuAction, TMathActionItemsConfig } from "@/iink"

describe("MathMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("does not build the removed select/delete result strokes buttons", () => {
    const canvas = createCanvasMock()
    const action = new MathMenuAction(asCanvas(canvas))
    const element = action.getElement()

    expect(element.querySelector("#ms-menu-action-math-select-result-strokes")).toBeNull()
    expect(element.querySelector("#ms-menu-action-math-delete-result-strokes")).toBeNull()
  })

  test("clicking Force Compute all clears then recomputes all math blocks", async () => {
    const canvas = createCanvasMock()
    canvas.math.forceCompute = jest.fn().mockResolvedValue(undefined)
    const action = new MathMenuAction(asCanvas(canvas))
    const element = action.getElement()
    document.body.appendChild(element)

    const button = element.querySelector("#ms-menu-action-math-force-compute-all") as HTMLButtonElement
    expect(button).toBeTruthy()
    expect(button.textContent).toBe("Force Compute all")

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))
    await Promise.resolve()
    await Promise.resolve()

    expect(canvas.math.forceCompute).toHaveBeenCalledTimes(1)
    expect(canvas.math.forceCompute).toHaveBeenCalledWith()
  })

  test("does not build the Force Compute all button when disabled via config", () => {
    const canvas = createCanvasMock()
    const action = new MathMenuAction(asCanvas(canvas), "ms-menu-action", { forceComputeAll: false })
    const element = action.getElement()

    expect(element.querySelector("#ms-menu-action-math-force-compute-all")).toBeNull()
  })

  describe("Solver", () => {
    const SOLVER_ITEM_IDS = [
      "#ms-menu-action-math-solver-angle-unit",
      "#ms-menu-action-math-solver-fractional-digits-wrapper",
      "#ms-menu-action-math-solver-decimal-separator",
      "#ms-menu-action-math-solver-rounding-mode",
      "#ms-menu-action-math-solver-options",
      "#ms-menu-action-math-solver-auto-variable",
      "#ms-menu-action-math-solver-scoping-policy",
    ]
    const buildAction = (itemsConfig?: TMathActionItemsConfig) => {
      const canvas = createCanvasMock()
      const action = new MathMenuAction(asCanvas(canvas), "ms-menu-action", itemsConfig)
      const element = action.getElement()
      document.body.appendChild(element)
      return { canvas, action, element }
    }
    const pick = (element: HTMLElement, id: string, value: string) => {
      const select = element.querySelector(`${id}-input`) as HTMLSelectElement
      select.value = value
      select.dispatchEvent(new Event("change", { bubbles: true }))
    }
    const slide = (element: HTMLElement, value: number) => {
      const input = element.querySelector("#ms-menu-action-math-solver-fractional-digits-input") as HTMLInputElement
      input.value = String(value)
      input.dispatchEvent(new Event("input", { bubbles: true }))
    }

    test("builds every solver setting by default", () => {
      const { element } = buildAction()

      expect(element.querySelector("#ms-menu-action-math-solver")).toBeTruthy()
      SOLVER_ITEM_IDS.forEach((id) => expect(element.querySelector(id)).toBeTruthy())
    })

    test("does not build the Solver submenu when disabled via config", () => {
      const { element } = buildAction({ solver: false })

      expect(element.querySelector("#ms-menu-action-math-solver")).toBeNull()
    })

    test("does not build a solver setting disabled via config", () => {
      const { element } = buildAction({ solver: { angleUnit: false } })

      expect(element.querySelector("#ms-menu-action-math-solver-angle-unit")).toBeNull()
      expect(element.querySelector("#ms-menu-action-math-solver-rounding-mode")).toBeTruthy()
    })

    test("shows the current angle unit", () => {
      const { element } = buildAction()

      const select = element.querySelector("#ms-menu-action-math-solver-angle-unit-input") as HTMLSelectElement
      expect(select.value).toEqual("rad")
    })

    test("sends a picked angle unit to the recognition configuration", () => {
      const { canvas, element } = buildAction()

      pick(element, "#ms-menu-action-math-solver-angle-unit", "deg")

      expect(canvas.updateRecognitionConfiguration).toHaveBeenCalledWith({ math: { solver: { "angle-unit": "deg" } } })
    })

    test("clears the solver options when Server default is picked", () => {
      const { canvas, element } = buildAction()

      pick(element, "#ms-menu-action-math-solver-options", "")

      expect(canvas.updateRecognitionConfiguration).toHaveBeenCalledWith({ math: { solver: { options: undefined } } })
    })

    test("switches the automatic variable management", () => {
      const { canvas, element } = buildAction()
      const checkbox = element.querySelector("#ms-menu-action-math-solver-auto-variable-input") as HTMLInputElement

      checkbox.checked = false
      checkbox.dispatchEvent(new Event("change", { bubbles: true }))

      expect(canvas.updateRecognitionConfiguration).toHaveBeenCalledWith({
        math: { solver: { "auto-variable-management": { enable: false } } },
      })
    })

    test("hides the variable settings while the automatic variable management is off", () => {
      const { canvas, action, element } = buildAction()
      canvas.configuration.recognition.math!.solver!["auto-variable-management"]!.enable = false

      action.update()

      ;[
        "#ms-menu-action-math-solver-scoping-policy",
        "#ms-menu-action-math-show-dependency-on-hover",
        "#ms-menu-action-math-highlight-on-select",
      ].forEach((id) => expect((element.querySelector(id) as HTMLElement).style.display).toEqual("none"))
    })

    describe("fractional digits", () => {
      beforeEach(() => jest.useFakeTimers())
      afterEach(() => jest.useRealTimers())

      test("sends only the last value of a slide once it settles", () => {
        const { canvas, element } = buildAction()

        slide(element, 4)
        slide(element, 5)
        slide(element, 6)
        expect(canvas.updateRecognitionConfiguration).not.toHaveBeenCalled()
        jest.advanceTimersByTime(MATH_SOLVER_DEBOUNCE_MS)

        expect(canvas.updateRecognitionConfiguration).toHaveBeenCalledTimes(1)
        expect(canvas.updateRecognitionConfiguration).toHaveBeenCalledWith({
          math: { solver: { "fractional-part-digits": 6 } },
        })
      })

      test("drops a pending value when the menu is destroyed", () => {
        const { canvas, action, element } = buildAction()

        slide(element, 4)
        action.destroy()
        jest.advanceTimersByTime(MATH_SOLVER_DEBOUNCE_MS)

        expect(canvas.updateRecognitionConfiguration).not.toHaveBeenCalled()
      })
    })
  })
})
