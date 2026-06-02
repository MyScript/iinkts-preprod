import { InteractiveInkEditor } from "@/editor"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"
import { RangeMenuItem, IMenuRange, CollapsibleWrapper } from "@/menu/items"

/**
 * @group Menu
 * @remarks Opacity style menu
 */
export class OpacityStyle extends BaseMenuItem<HTMLDivElement>
{
  private opacityItem?: RangeMenuItem

  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-style")
  {
    const config = {
      type: "opacity" as const,
      id: `${idPrefix}-opacity`,
      label: "Opacity"
    }
    super(config, editor)
  }

  createElement(): HTMLDivElement
  {
    const symbolsStyles = this.editor.model.symbolsSelected.map(s => s.style)
    const hasUniqOpacity = symbolsStyles.length && symbolsStyles.every(st => st.opacity === symbolsStyles[0]?.opacity)
    const currentOpacity = Math.round((hasUniqOpacity && symbolsStyles[0]?.opacity ? symbolsStyles[0]?.opacity : (this.editor.penStyle.opacity || 1)) * 100)

    const opacityConfig: IMenuRange = {
      type: "range",
      id: this.config.id,
      label: "opacity",
      min: 1,
      max: 100,
      step: 1,
      initValue: currentOpacity,
      onChange: (value: number, editor) => {
        editor.penStyle = { opacity: value / 100 }
        if (editor.model.symbolsSelected.length) {
          editor.updateSymbolsStyle(editor.model.symbolsSelected.map(s => s.id), { opacity: value / 100 })
        }
      }
    }

    this.opacityItem = new RangeMenuItem(opacityConfig, this.editor)
    const opacityElement = this.opacityItem.getElement()
    const wrapper = new CollapsibleWrapper(opacityElement, "Opacity", this.config.id)
    return wrapper.getElement()
  }

  update(): void
  {
    this.updateDisabled()
    this.updateVisible()
  }

  destroy(): void
  {
    if (this.opacityItem) {
      this.opacityItem.destroy()
      this.opacityItem = undefined
    }
    super.destroy()
  }
}
