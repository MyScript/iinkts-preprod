import { InteractiveInkEditor } from "@/editor"
import { BaseMenuItem, IMenuItemBase } from "./BaseMenuItem"

/**
 * @group Menu
 * @remarks Configuration for a range input menu item
 */
export interface IMenuRange extends IMenuItemBase {
  type: "range"
  min: number
  max: number
  step: number
  initValue?: number
  onChange: (value: number, editor: InteractiveInkEditor) => void
}

/**
 * @group Menu
 * @remarks Class for range input menu items (slider)
 */
export class RangeMenuItem extends BaseMenuItem<HTMLDivElement>
{
  protected declare config: IMenuRange
  private currentValue: number
  private input?: HTMLInputElement
  private output?: HTMLOutputElement

  constructor(config: IMenuRange, editor: InteractiveInkEditor) {
    super(config, editor)
    this.currentValue = config.initValue ?? config.min
  }

  createElement(): HTMLDivElement {
    const wrapper = document.createElement("div")
    wrapper.id = `${this.config.id}-wrapper`

    this.input = document.createElement("input")
    this.input.id = `${this.config.id}-input`
    this.input.setAttribute("type", "range")
    this.input.setAttribute("step", this.config.step.toString())
    this.input.setAttribute("min", this.config.min.toString())
    this.input.setAttribute("max", this.config.max.toString())

    if (this.currentValue !== undefined) {
      this.input.setAttribute("value", this.currentValue.toString())
    }

    wrapper.appendChild(this.input)

    this.output = document.createElement("output")
    this.output.innerHTML = this.currentValue !== undefined ? `${this.currentValue}%` : "-"
    wrapper.appendChild(this.output)

    if (this.config.label) {
      this.input.setAttribute("name", this.config.label)
      this.output.setAttribute("for", this.config.label)
    }

    this.input.addEventListener("input", (evt) => {
      const value = parseInt((evt.target as HTMLInputElement).value)
      this.currentValue = value
      if (this.output) {
        this.output.innerHTML = `${value}%`
      }
      this.config.onChange(value, this.editor)
    })

    return wrapper
  }

  getValue(): number {
    return this.currentValue
  }

  setValue(value: number): void {
    this.currentValue = value
    if (this.input) {
      this.input.value = value.toString()
    }
    if (this.output) {
      this.output.innerHTML = `${value}%`
    }
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()
  }
}
