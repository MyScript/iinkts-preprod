import { buildButton, ButtonElConfig } from "./buttonElement"
import
  {
    buildCheckbox,
    CheckboxElConfig,
    buildFileInput,
    FileInputElConfig,
    buildNumberInput,
    buildRange,
    RangeElConfig,
    buildTextInput,
    InputElConfig
  } from "./inputElement"
import { buildSelect, buildOption, SelectElConfig, SelectElOption } from "./selectElement"
import { buildLabel, LabelElConfig } from "./labelElement"
import { buildOutput, OutputElConfig } from "./outputElement"
import
  {
    buildDiv,
    buildH3,
    buildP,
    buildSection,
    buildSpan,
    buildStyle,
    ContainerElConfig
  } from "./containerElement"
import
  {
    buildTable,
    buildTBody,
    buildTd,
    buildTh,
    buildTHead,
    buildTr,
    TableBaseElConfig,
    TableCellElConfig
  } from "./tableElement"
import { buildCanvas } from "./miscElement"

/**
 * @group DOM
 * @remarks Static utility class for DOM element creation.
 */
export class DOMFactory
{
  private constructor() { }

  static div(config?: ContainerElConfig): HTMLDivElement
  {
    return buildDiv(config)
  }
  static span(config?: ContainerElConfig): HTMLSpanElement
  {
    return buildSpan(config)
  }
  static p(config?: ContainerElConfig): HTMLParagraphElement
  {
    return buildP(config)
  }
  static h3(config?: ContainerElConfig): HTMLHeadingElement
  {
    return buildH3(config)
  }
  static section(config?: ContainerElConfig): HTMLElement
  {
    return buildSection(config)
  }
  static style(cssText: string, dataAttr?: Record<string, string>): HTMLStyleElement
  {
    return buildStyle(cssText, dataAttr)
  }
  static canvas(config?: { id?: string; className?: string }): HTMLCanvasElement
  {
    return buildCanvas(config)
  }

  static label(config: LabelElConfig): HTMLLabelElement
  {
    return buildLabel(config)
  }

  static button(config: ButtonElConfig): HTMLButtonElement
  {
    return buildButton(config)
  }

  static textInput(config: InputElConfig): HTMLInputElement
  {
    return buildTextInput(config)
  }

  static numberInput(config: InputElConfig): HTMLInputElement
  {
    return buildNumberInput(config)
  }

  static checkbox(config: CheckboxElConfig): HTMLInputElement
  {
    return buildCheckbox(config)
  }

  static range(config: RangeElConfig): HTMLInputElement
  {
    return buildRange(config)
  }

  static fileInput(config: FileInputElConfig): HTMLInputElement
  {
    return buildFileInput(config)
  }

  static select(config: SelectElConfig): HTMLSelectElement
  {
    return buildSelect(config)
  }
  static option(opt: SelectElOption): HTMLOptionElement
  {
    return buildOption(opt)
  }

  static output(config?: OutputElConfig): HTMLOutputElement
  {
    return buildOutput(config)
  }

  static table(config?: TableBaseElConfig): HTMLTableElement
  {
    return buildTable(config)
  }
  static thead(config?: TableBaseElConfig): HTMLTableSectionElement
  {
    return buildTHead(config)
  }
  static tbody(config?: TableBaseElConfig): HTMLTableSectionElement
  {
    return buildTBody(config)
  }
  static tr(config?: TableBaseElConfig): HTMLTableRowElement
  {
    return buildTr(config)
  }
  static td(config?: TableCellElConfig): HTMLTableCellElement
  {
    return buildTd(config)
  }
  static th(config?: TableCellElConfig): HTMLTableCellElement
  {
    return buildTh(config)
  }

  // ─── Composites ───────────────────────────────────────────────────────────

  static colorDot(color: string, size = "12px"): HTMLSpanElement
  {
    return buildSpan({
      style: `
        width: ${ size };
        height: ${ size };
        border-radius: var(--iink-radius-full);
        background-color: ${ color };
        display: inline-block;
        flex-shrink: 0;
      ` })
  }

  static statusBadge(available: boolean): HTMLSpanElement
  {
    return buildSpan({
      text: available ? "✓" : "✗",
      style: available
        ? "color: var(--iink-success); font-weight: bold; font-size: 16px;"
        : "color: var(--iink-error); font-weight: bold; font-size: 16px;"
    })
  }

  static labeledInput(config: {
    id: string
    label: string
    type?: string
    defaultValue?: string | number
    placeholder?: string
    min?: number
    max?: number
    step?: string | number
    labelSize?: string
    gap?: string
  }): { wrapper: HTMLDivElement; input: HTMLInputElement; label: HTMLLabelElement }
  {
    const wrapper = buildDiv({ style: `
      display: flex;
      flex-direction: column;
      gap: ${config.gap ?? "var(--iink-spacing-xs)"};
    ` })
    const label = buildLabel({
      text: config.label,
      htmlFor: config.id,
      style: `font-size: ${ config.labelSize ?? "13px" }; font-weight: 500;`
    })
    const input = buildTextInput({
      id: config.id,
      value: config.defaultValue,
      placeholder: config.placeholder,
      step: config.step,
      min: config.min,
      max: config.max,
      fullWidth: true,
    })
    if (config.type) input.type = config.type
    wrapper.appendChild(label)
    wrapper.appendChild(input)
    return { wrapper, input, label }
  }
}
