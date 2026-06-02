import { InteractiveInkEditor } from "@/editor"
import { BaseMenuItem, TGenericMenuItem } from "@/menu/items/BaseMenuItem"
import ArrowDown from "@/assets/svg/nav-arrow-down.svg"
import { SymbolType, IIText } from "@/symbol"
import { createUUID } from "@/utils"

/**
 * @group Menu
 * @remarks Menu contextuel Edit - Édite le texte sélectionné
 */
export class EditContextMenu extends BaseMenuItem<HTMLElement>
{
  protected declare config: TGenericMenuItem
  editInput?: HTMLInputElement
  editSaveBtn?: HTMLButtonElement

  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context")
  {
    const config: TGenericMenuItem = {
      type: "custom",
      id: `${idPrefix}-edit`,
      label: "Edit"
    }
    super(config, editor)
  }

  createElement(): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${this.config.id}-trigger`
    trigger.classList.add("ms-menu-button")
    const label = document.createElement("span")
    label.innerText = "Edit"
    trigger.appendChild(label)
    const icon = document.createElement("span")
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-column")
    
    this.editInput = document.createElement("input")
    subMenuWrapper.appendChild(this.editInput)
    
    this.editSaveBtn = document.createElement("button")
    this.editSaveBtn.classList.add("ms-menu-button")
    this.editSaveBtn.innerText = "Save"
    subMenuWrapper.appendChild(this.editSaveBtn)
    
    this.editSaveBtn.addEventListener("pointerdown", async (e) => {
      e.stopPropagation()
      const textSymbol = this.editor.model.symbolsSelected.find(s => s.type === SymbolType.Text) as IIText
      if (textSymbol) {
        const firstChar = textSymbol.chars[0]
        textSymbol.chars = []
        for (let i = 0; i < this.editInput!.value.length; i++) {
          textSymbol.chars.push({
            label: this.editInput!.value.charAt(i),
            id: createUUID(),
            color: firstChar.color,
            fontSize: firstChar.fontSize,
            fontWeight: firstChar.fontWeight,
            bounds: firstChar.bounds
          })
        }
        await this.editor.updateSymbol(textSymbol)
        this.editor.selector.resetSelectedGroup([textSymbol])
      }
    })

    const wrapper = document.createElement("div")
    wrapper.classList.add("sub-menu")
    wrapper.appendChild(trigger)

    const content = document.createElement("div")
    content.classList.add("sub-menu-content", "right")
    content.appendChild(subMenuWrapper)
    wrapper.appendChild(content)

    // Event listeners
    trigger.addEventListener("pointerdown", () => content.classList.toggle("open"))
    document.addEventListener("pointerdown", (e) => {
      if (!wrapper.contains(e.target as HTMLElement)) {
        content.classList.remove("open")
      }
    })

    return wrapper
  }

  update(): void
  {
    this.updateDisabled()
    this.updateVisible()
  }
}
