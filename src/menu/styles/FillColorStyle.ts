import { InteractiveInkEditor } from "../../editor"
import { BaseMenuItem } from "../items/BaseMenuItem"
import { ColorListMenuItem, IMenuColorList, CollapsibleWrapper } from "../items"

/**
 * @group Menu
 * @remarks Fill color style menu
 */
export class FillColorStyle extends BaseMenuItem<HTMLDivElement>
{
  private colorItem?: ColorListMenuItem
  private colors: string[]

  constructor(editor: InteractiveInkEditor, colors: string[], idPrefix = "ms-menu-style")
  {
    const config = {
      type: "fillcolor" as const,
      id: `${idPrefix}-fill`,
      label: "Fill Color"
    }
    super(config, editor)
    this.colors = colors
  }

  createElement(): HTMLDivElement
  {
    const symbolsStyles = this.editor.model.symbolsSelected.map(s => s.style)
    const hasUniqColor = symbolsStyles.length && symbolsStyles.every(st => st.color === symbolsStyles[0]?.color)
    const color = hasUniqColor && symbolsStyles[0].color ? symbolsStyles[0].color : this.editor.penStyle.color as string

    const colorConfig: IMenuColorList = {
      type: "colorlist",
      id: `${this.config.id}-list`,
      fill: true,
      colors: this.colors,
      initValue: color,
      onChange: (fill, editor) => {
        editor.penStyle = { fill }
        editor.updateSymbolsStyle(editor.model.symbolsSelected.map(s => s.id), { fill })
      }
    }

    this.colorItem = new ColorListMenuItem(colorConfig, this.editor)
    const colorElement = this.colorItem.getElement()
    const wrapper = new CollapsibleWrapper(colorElement, "Fill", this.config.id)
    return wrapper.getElement()
  }

  update(): void
  {
    this.updateDisabled()
    this.updateVisible()
  }

  destroy(): void
  {
    if (this.colorItem) {
      this.colorItem.destroy()
      this.colorItem = undefined
    }
    super.destroy()
  }
}
