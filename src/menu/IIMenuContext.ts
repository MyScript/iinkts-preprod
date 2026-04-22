import ArrowDown from "../assets/svg/nav-arrow-down.svg"
import { SELECTION_MARGIN } from "../Constants"
import { LoggerCategory, LoggerManager } from "../logger"
import { DecoratorKind, IIDecorator, IIRecognizedText, IIRecognizedMath, IIStroke, IISymbolGroup, IIText, RecognizedKind, SymbolType, TIISymbol } from "../symbol"
import { IIMenu, TMenuItemBoolean, TMenuItemButton, TMenuItemColorList } from "./IIMenu"
import { convertMillimeterToPixel, createUUID } from "../utils"
import { IIMenuSub, TSubMenuParam } from "./IIMenuSub"
import { InteractiveInkEditor } from "../editor"
import { createMenuButtonWithText } from "./MenuHelper"
/**
 * @group Menu
 */
export class IIMenuContext extends IIMenu
{
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)
  editor: InteractiveInkEditor
  id: string
  wrapper?: HTMLElement
  editMenu?: HTMLDivElement
  editInput?: HTMLInputElement
  editSaveBtn?: HTMLButtonElement
  reorderMenu?: HTMLDivElement
  decoratorMenu?: HTMLDivElement
  menuExport?: HTMLDivElement
  duplicateBtn?: HTMLButtonElement
  groupBtn?: HTMLButtonElement
  convertBtn?: HTMLButtonElement
  removeBtn?: HTMLButtonElement
  mathMenu?: HTMLDivElement

  position: {
    x: number,
    y: number
  }

  constructor(editor: InteractiveInkEditor, id = "ms-menu-context")
  {
    super()
    this.id = id
    this.#logger.info("constructor")
    this.editor = editor
    this.position = { x: 0, y: 0 }
  }

  get symbolsSelected(): TIISymbol[]
  {
    return this.editor.model.symbolsSelected
  }

  get haveSymbolsSelected(): boolean
  {
    return this.symbolsSelected.length > 0
  }

  get symbolsDecorable(): (IIStroke | IIText | IISymbolGroup | IIRecognizedText)[]
  {
    return this.symbolsSelected.filter(s => {
      return s.type === SymbolType.Stroke || s.type === SymbolType.Text || s.type === SymbolType.Group || (s.type === SymbolType.Recognized && s.kind === RecognizedKind.Text)
    }) as (IIStroke | IIText | IISymbolGroup | IIRecognizedText)[]
  }

  get showDecorator(): boolean
  {
    return this.symbolsDecorable.length > 0
  }

  get hasMathSelected(): boolean
  {
    return this.symbolsSelected.some(s => s.type === SymbolType.Recognized && s.kind === RecognizedKind.Math)
  }

  get hasSingleMathSymbol(): boolean
  {
    return this.symbolsSelected.length === 1 && this.symbolsSelected[0].type === SymbolType.Recognized && this.symbolsSelected[0].kind === RecognizedKind.Math
  }

  get hasMixedTextAndMath(): boolean
  {
    const hasText = this.symbolsSelected.some(s =>
      s.type === SymbolType.Text ||
      (s.type === SymbolType.Recognized && s.kind === RecognizedKind.Text)
    )
    return hasText && this.hasMathSelected
  }

  protected createMenuEdit(): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-edit-trigger`
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
    subMenuWrapper.classList.add("ms-menu-colmun")
    this.editInput = document.createElement("input")
    subMenuWrapper.appendChild(this.editInput)
    this.editSaveBtn = document.createElement("button")
    this.editSaveBtn.classList.add("ms-menu-button")
    this.editSaveBtn.innerText = "Save"
    subMenuWrapper.appendChild(this.editSaveBtn)
    this.editSaveBtn.addEventListener("pointerdown", async (e) =>
    {
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
    const params: TSubMenuParam = {
      trigger: trigger,
      subMenu: subMenuWrapper,
      position: "right"
    }
    this.editMenu = new IIMenuSub(params).element

    return this.editMenu
  }

  protected createMenuDuplicate(): HTMLElement
  {
    this.duplicateBtn = createMenuButtonWithText(
      `${ this.id }-duplicate`,
      "Duplicate",
      async () => {
        const symbolsToDuplicate = this.symbolsSelected

        const updateDeepIdInGroup = (gr: IISymbolGroup) =>
        {
          gr.children.forEach(s =>
          {
            s.id = `${s.type}-${ createUUID() }`
            switch (s.type) {
              case SymbolType.Group:
                updateDeepIdInGroup(s)
                break
              case SymbolType.Recognized:
                s.strokes.forEach(s => s.id = `${s.type}-${ createUUID() }`)
                break
            }
          })
        }
        const duplicatedSymbols = symbolsToDuplicate.map(s =>
        {
          const clone = s.clone()
          while (this.editor.model.symbols.find(s => s.id === clone.id)) {
            clone.id = `${clone.type}-${ createUUID() }`
            if (clone.type === SymbolType.Group) {
              updateDeepIdInGroup(clone)
            }
            else if (clone.type === SymbolType.Recognized) {
              clone.strokes.forEach(s => s.id = `${s.type}-${ createUUID() }`)
            }
          }
          clone.selected = true
          this.editor.translator.applyToSymbol(clone, SELECTION_MARGIN, SELECTION_MARGIN)
          return clone
        })

        this.editor.unselectAll()
        await this.editor.addSymbols(duplicatedSymbols)
        this.editor.selector.drawSelectedGroup(duplicatedSymbols)
      }
    )
    return this.duplicateBtn
  }

  protected createMenuGroup(): HTMLElement
  {
    this.groupBtn = createMenuButtonWithText(
      `${ this.id }-group`,
      "Group",
      async () => {
        if (this.symbolsSelected.length === 1 && this.symbolsSelected[0].type === SymbolType.Group) {
          const symbols = this.editor.ungroupSymbol(this.symbolsSelected[0] as IISymbolGroup)
          this.editor.select(symbols.map(s => s.id))
        }
        else {
          const symbols = this.symbolsSelected.slice()
          this.editor.unselectAll()
          const group = this.editor.groupSymbols(symbols)
          group.selected = true
          this.editor.select([group.id])
        }
      }
    )
    return this.groupBtn
  }

  protected createMenuConvert(): HTMLElement
  {
    this.convertBtn = createMenuButtonWithText(
      `${ this.id }-convert`,
      "Convert",
      () => this.editor.convertSymbols(this.symbolsSelected)
    )
    return this.convertBtn
  }

  protected createMenuRemove(): HTMLButtonElement
  {
    this.removeBtn = createMenuButtonWithText(
      `${ this.id }-remove`,
      "Remove",
      async () => {
        this.editor.selector.removeSelectedGroup()
        await this.editor.removeSymbols(this.symbolsSelected.map(s => s.id))
      }
    )
    return this.removeBtn
  }

  protected createMenuReorder(): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-reorder`
    trigger.classList.add("ms-menu-button")
    const label = document.createElement("span")
    label.innerText = "Reorder"
    trigger.appendChild(label)
    const icon = document.createElement("span")
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const menuItems: TMenuItemButton[] = [
      {
        type: "button",
        id: `${ this.id }-reorder-first`,
        label: "Bring to front",
        callback: () =>
        {
          this.editor.changeOrderSymbols(this.symbolsSelected, "last")
          this.editor.selector.resetSelectedGroup(this.symbolsSelected)
        }
      },
      {
        type: "button",
        id: `${ this.id }-reorder-forward`,
        label: "Bring forward",
        callback: () =>
        {
          this.editor.changeOrderSymbols(this.symbolsSelected, "forward")
          this.editor.selector.resetSelectedGroup(this.symbolsSelected)
        }
      },
      {
        type: "button",
        id: `${ this.id }-reorder-backward`,
        label: "Send backward",
        callback: () =>
        {
          this.editor.changeOrderSymbols(this.symbolsSelected, "backward")
          this.editor.selector.resetSelectedGroup(this.symbolsSelected)
        }
      },
      {
        type: "button",
        id: `${ this.id }-reorder-last`,
        label: "Send to back",
        callback: () =>
        {
          this.editor.changeOrderSymbols(this.symbolsSelected.slice().reverse(), "first")
          this.editor.selector.resetSelectedGroup(this.symbolsSelected)
        }
      },
    ]
    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })
    const params: TSubMenuParam = {
      trigger: trigger,
      subMenu: subMenuWrapper,
      position: "right"
    }
    this.reorderMenu = new IIMenuSub(params).element
    return this.reorderMenu
  }

  protected createDecoratorSubMenu(label: string, kind: DecoratorKind): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-decorator-${ kind }`
    trigger.classList.add("ms-menu-button")
    const labelEL = document.createElement("span")
    labelEL.innerText = label
    trigger.appendChild(labelEL)
    const icon = document.createElement("span")
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const menuItems: (TMenuItemBoolean | TMenuItemColorList)[] = [
      {
        type: "checkbox",
        id: `${ this.id }-decorator-${ kind }-enable`,
        label: "Enable",
        initValue: false,
        callback: (enable) =>
        {
          this.symbolsDecorable.forEach(s =>
          {
            if (enable) {
              if (!s.decorators.some(d => d.kind === kind)) {
                s.decorators.push(new IIDecorator(kind, this.editor.penStyle))
              }
            }
            else {
              const decoIndex = s.decorators.findIndex(d => d.kind === kind)
              if (decoIndex > -1) {
                s.decorators.splice(decoIndex, 1)
              }
            }
            this.editor.model.updateSymbol(s)
            this.editor.renderer.drawSymbol(s)
          })

          document.querySelectorAll(`#${ this.id }-decorator-${ kind }-color button`).forEach(b =>
          {
            (b as HTMLButtonElement).disabled = !enable
            b.classList.remove("active")
          })
          if (enable) {
            document.querySelector(`#${ this.id }-decorator-${ kind }-color button`)?.classList.add("active")
          }
        }
      },
      {
        type: "colors",
        label: "Colors",
        id: `${ this.id }-decorator-${ kind }-color`,
        fill: false,
        values: this.colors.filter((_c, i) => !(i % 4)),
        initValue: this.colors[0],
        disabled: true,
        callback: (color) =>
        {
          this.symbolsDecorable.forEach(s =>
          {
            const deco = s.decorators.find(d => d.kind === kind)
            if (deco) {
              deco.style.color = color
              this.editor.model.updateSymbol(s)
              this.editor.renderer.drawSymbol(s)
            }
          })
        },
      }
    ]
    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })
    const params: TSubMenuParam = {
      trigger: trigger,
      subMenu: subMenuWrapper,
      position: "right"
    }
    return this.decoratorMenu = new IIMenuSub(params).element
  }

  protected createMenuDecorator(): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-decorator`
    trigger.classList.add("ms-menu-button")
    const label = document.createElement("span")
    label.innerText = "Decorator"
    trigger.appendChild(label)
    const icon = document.createElement("span")
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")
    subMenuWrapper.appendChild(this.createDecoratorSubMenu("Hightlight", DecoratorKind.Highlight))
    subMenuWrapper.appendChild(this.createDecoratorSubMenu("Surround", DecoratorKind.Surround))
    subMenuWrapper.appendChild(this.createDecoratorSubMenu("Underline", DecoratorKind.Underline))
    subMenuWrapper.appendChild(this.createDecoratorSubMenu("Strikethrough", DecoratorKind.Strikethrough))

    const params: TSubMenuParam = {
      trigger: trigger,
      subMenu: subMenuWrapper,
      position: "right"
    }
    this.decoratorMenu = new IIMenuSub(params).element
    return this.decoratorMenu
  }

  protected createMenuExport(): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-export`
    trigger.classList.add("ms-menu-button")
    const label = document.createElement("span")
    label.innerText = "Export"
    trigger.appendChild(label)
    const icon = document.createElement("span")
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const menuItems: TMenuItemButton[] = [
      {
        type: "button",
        id: `${ this.id }-export-json`,
        label: "json",
        callback: () => this.editor.downloadAsJson(this.haveSymbolsSelected)
      },
      {
        type: "button",
        id: `${ this.id }-export-svg`,
        label: "svg",
        callback: () => this.editor.downloadAsSVG(this.haveSymbolsSelected)
      },
      {
        type: "button",
        id: `${ this.id }-export-png`,
        label: "png",
        callback: () => this.editor.downloadAsPNG(this.haveSymbolsSelected)
      },
    ]
    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })
    const params: TSubMenuParam = {
      trigger: trigger,
      subMenu: subMenuWrapper,
      position: "right"
    }
    this.menuExport = new IIMenuSub(params).element
    return this.menuExport
  }

  protected createMenuSelectAll(): HTMLElement
  {
    const btn = document.createElement("button")
    btn.id = `${ this.id }-duplicate`
    btn.textContent = "Select all"
    btn.classList.add("ms-menu-button")
    btn.addEventListener("pointerup", async () => this.editor.selectAll())
    return btn
  }

  protected createMenuMath(): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-math`
    trigger.classList.add("ms-menu-button")
    const label = document.createElement("span")
    label.innerText = "Math"
    trigger.appendChild(label)
    const icon = document.createElement("span")
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const menuItems: TMenuItemButton[] = [
      {
        type: "button",
        id: `${ this.id }-math-get-variable`,
        label: "Get variable",
        callback: async () =>
        {
          this.#logger.info("Get variable clicked")
          // TODO: Implement get variable logic
          // This should extract variables from the selected math expression
          const mathSymbols = this.symbolsSelected.filter(s =>
            s.type === SymbolType.Recognized && s.kind === RecognizedKind.Math
          ) as IIRecognizedMath[]

          mathSymbols.forEach(math =>
          {
            this.#logger.info("Math expression:", { label: math.label, expressions: math.expressions })
            // Extract variables from expressions tree
            // This would need to recursively traverse the expressions
          })
        }
      },
      {
        type: "button",
        id: `${ this.id }-math-set-variable`,
        label: "Set variable value",
        callback: async () =>
        {
          this.#logger.info("Set variable value clicked")
          // TODO: Implement set variable value logic
          // This should allow user to assign values to variables
        }
      },
      {
        type: "button",
        id: `${ this.id }-numerical-computation`,
        label: "Solve",
        callback: async () =>
        {
          this.#logger.info("Solve clicked")
          try {
            const mathSymbols = this.symbolsSelected.filter(s =>
              s.type === SymbolType.Recognized && s.kind === RecognizedKind.Math
            ) as IIRecognizedMath[]
            if (mathSymbols.length === 0) {
              this.#logger.warn("No math symbol selected")
              return
            }
            const blocId = mathSymbols[0].jiixId
            if (!blocId) {
              this.#logger.warn("Selected math symbol does not have jiixId")
              return
            }
            const result = await this.editor.recognizer.getNumericalComputation(blocId)
            this.#logger.info("Math solved successfully", result)

            // Extract and render solver output strokes
            const extractSolverOutputStrokes = (obj: unknown): Array<{ X: number[], Y: number[], F?: number[], T?: number[] }> => {
              const strokes: Array<{ X: number[], Y: number[], F?: number[], T?: number[] }> = []

              if (!obj || typeof obj !== "object") {
                return strokes
              }

              const objRecord = obj as Record<string, unknown>

              // Check if this is a solver output item
              if (objRecord["type"] === "number" && objRecord["solver-output"] === true && objRecord.items && Array.isArray(objRecord.items)) {
                strokes.push(...objRecord.items as Array<{ X: number[], Y: number[], F?: number[], T?: number[] }>)
              }

              // Recursively search in operands
              if (objRecord.operands && Array.isArray(objRecord.operands)) {
                objRecord.operands.forEach((operand: unknown) => {
                  if (operand) {
                    strokes.push(...extractSolverOutputStrokes(operand))
                  }
                })
              }

              // Recursively search in expressions
              if (objRecord.expressions && Array.isArray(objRecord.expressions)) {
                objRecord.expressions.forEach((expr: unknown) => {
                  if (expr) {
                    strokes.push(...extractSolverOutputStrokes(expr))
                  }
                })
              }

              return strokes
            }

            const solverStrokes = extractSolverOutputStrokes(result)
            this.#logger.info("Found solver output strokes:", solverStrokes.length)

            // Create IIStroke objects from solver output data
            for (const strokeData of solverStrokes) {
              if (!strokeData.X || !strokeData.Y) {
                this.#logger.warn("Stroke data missing X or Y coordinates")
                continue
              }

              const pointers = strokeData.X.map((x: number, i: number) => ({
                x: convertMillimeterToPixel(x),
                y: convertMillimeterToPixel(strokeData.Y[i]),
                p: strokeData.F?.[i] || 1,
                t: strokeData.T?.[i] || i
              }))

              const stroke = IIStroke.create({
                pointers,
                style: { color: "#4caf50", width: 5 }  // Green color for solver output
              })

              await this.editor.addSymbol(stroke)
              this.#logger.info("Added solver output stroke:", stroke.id)
            }
          } catch (error) {
            this.#logger.error("Error solving math:", error)
          }
        }
      }
    ]

    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })

    const params: TSubMenuParam = {
      trigger: trigger,
      subMenu: subMenuWrapper,
      position: "right"
    }
    this.mathMenu = new IIMenuSub(params).element
    console.log("this.mathMenu: ", this.mathMenu);
    return this.mathMenu
  }

  protected updateDecoratorSubMenu(): void
  {
    if (this.showDecorator && !this.hasSingleMathSymbol) {
      this.decoratorMenu?.style.removeProperty("display")

      Object.values(DecoratorKind).forEach(kind =>
      {
        const checkbox = document.getElementById(`${ this.id }-decorator-${ kind }-enable`) as HTMLInputElement
        if (checkbox) {
          document.querySelectorAll(`#${ this.id }-decorator-${ kind }-color button`).forEach(e => e.classList.remove("active"))
          const decos = this.symbolsDecorable.flatMap(s => s.decorators).filter(d => d.kind === kind)

          if (decos.length && decos.every(d => d.style.color === decos[0].style.color)) {
            const btnToActivate = document.getElementById(`${ this.id }-decorator-${ kind }-color-${ decos[0].style.color?.replace("#", "") }-btn`)
            btnToActivate?.classList.add("active")
          }

          if (this.symbolsDecorable.filter(s => s.decorators.some(d => d.kind === kind)).length === this.symbolsDecorable.length) {
            checkbox.checked = true

            document.querySelectorAll(`#${ this.id }-decorator-${ kind }-color button`).forEach(b =>
            {
              (b as HTMLButtonElement).disabled = false
            })
            checkbox.indeterminate = false
          }
          else if (this.symbolsDecorable.filter(s => !s.decorators.some(d => d.kind === kind)).length === this.symbolsDecorable.length) {
            checkbox.checked = false
            document.querySelectorAll(`#${ this.id }-decorator-${ kind }-color button`).forEach(b =>
            {
              (b as HTMLButtonElement).disabled = true
            })
            checkbox.indeterminate = false
          }
          else {
            checkbox.setAttribute("indeterminate", "true")
            checkbox.indeterminate = true
            document.querySelectorAll(`#${ this.id }-decorator-${ kind }-color button`).forEach(b =>
            {
              (b as HTMLButtonElement).disabled = false
            })
          }
        }

      })
    }
    else {
      this.decoratorMenu?.style.setProperty("display", "none")
    }
  }

  protected updateGroupMenu(): void
  {
    if (this.groupBtn && this.haveSymbolsSelected && !this.hasSingleMathSymbol) {
      this.groupBtn.style.removeProperty("display")
      if (this.symbolsSelected.length === 1 && this.symbolsSelected[0].type === SymbolType.Group) {
        this.groupBtn.textContent = "UnGroup"
      }
      else {
        this.groupBtn.textContent = "Group"
      }
    }
    else {
      this.groupBtn?.style.setProperty("display", "none")
    }
  }

  protected async updateMathMenu(): Promise<void>
  {
    if (this.mathMenu) {
      if (this.hasSingleMathSymbol) {
        const mathSymbol = this.symbolsSelected[0] as IIRecognizedMath
        const actions = await this.editor.recognizer.getAvailableActions(mathSymbol.jiixId!)
        console.log("==> actions: ", actions);
        if (actions?.length) {
          (this.mathMenu.querySelector(`#${ this.id }-math-get-variable`) as HTMLButtonElement).style.setProperty("display", !actions.includes("get-variable") ? "none" : "inline-block");
          (this.mathMenu.querySelector(`#${ this.id }-math-set-variable`) as HTMLButtonElement).style.setProperty("display", !actions.includes("set-variable") ? "none" : "inline-block");
          (this.mathMenu.querySelector(`#${ this.id }-numerical-computation`) as HTMLButtonElement).style.setProperty("display", !actions.includes("numerical-computation") ? "none" : "inline-block");
          this.mathMenu.style.removeProperty("display")
        }
        else {
          this.mathMenu.style.setProperty("display", "none")
        }
      }
      else {
        this.mathMenu.style.setProperty("display", "none")
      }
    }
  }

  update(): void
  {
    // Position is now in client coordinates (relative to viewport), no need to adjust for scroll
    this.wrapper?.style.setProperty("left", `${ this.position.x }px`)
    this.wrapper?.style.setProperty("top", `${ this.position.y }px`)

    // Adjust position if menu overflows viewport boundaries
    if (this.wrapper) {
      const rect = this.wrapper.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = this.position.x
      let adjustedY = this.position.y

      // Check if menu overflows bottom
      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10 // 10px margin
      }

      // Check if menu overflows right
      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10 // 10px margin
      }

      // Check if menu overflows left
      if (adjustedX < 10) {
        adjustedX = 10 // 10px margin
      }

      // Check if menu overflows top
      if (adjustedY < 10) {
        adjustedY = 10 // 10px margin
      }

      // Apply adjusted positions if needed
      if (adjustedX !== this.position.x) {
        this.wrapper.style.setProperty("left", `${ adjustedX }px`)
      }
      if (adjustedY !== this.position.y) {
        this.wrapper.style.setProperty("top", `${ adjustedY }px`)
      }
    }

    if (this.haveSymbolsSelected) {
      const textSymbol = this.editor.model.symbolsSelected.find(s => s.type === SymbolType.Text)
      if (this.editMenu && this.editInput && this.editor.model.symbolsSelected.length === 1 && textSymbol) {
        this.editMenu.style.removeProperty("display")
        this.editInput.value = (textSymbol as IIText).label
      }
      else {
        this.editMenu?.style.setProperty("display", "none")
      }

      // Show convert button only if there are strokes AND not only math selected
      if (this.editor.extractStrokesFromSymbols(this.symbolsSelected).length && !this.hasSingleMathSymbol) {
        this.convertBtn?.style.removeProperty("display")
      }
      else {
        this.convertBtn?.style.setProperty("display", "none")
      }


      this.reorderMenu?.style.removeProperty("display")
      this.duplicateBtn?.style.removeProperty("display")
      this.removeBtn?.style.removeProperty("display")
      this.menuExport?.style.removeProperty("display")
    }
    else {
      this.editMenu?.style.setProperty("display", "none")
      this.convertBtn?.style.setProperty("display", "none")
      this.reorderMenu?.style.setProperty("display", "none")
      this.duplicateBtn?.style.setProperty("display", "none")
      this.removeBtn?.style.setProperty("display", "none")
      this.menuExport?.style.setProperty("display", "none")
    }
    this.updateDecoratorSubMenu()
    this.updateGroupMenu()
    this.updateMathMenu()
  }

  render(layer: HTMLElement): void
  {
    this.wrapper = document.createElement("div")
    this.wrapper.id = `${ this.id }-wrapper`
    this.wrapper.classList.add("ms-menu", "ms-menu-context")
    this.wrapper.appendChild(this.createMenuEdit())
    this.wrapper.appendChild(this.createMenuDecorator())
    this.wrapper.appendChild(this.createMenuReorder())
    this.wrapper.appendChild(this.createMenuExport())
    this.wrapper.appendChild(this.createMenuConvert())
    this.wrapper.appendChild(this.createMenuMath())
    this.wrapper.appendChild(this.createMenuGroup())
    this.wrapper.appendChild(this.createMenuDuplicate())
    this.wrapper.appendChild(this.createMenuRemove())
    this.wrapper.appendChild(this.createMenuSelectAll())
    this.wrapper.style.setProperty("display", "none")
    layer.appendChild(this.wrapper)

    // Hide context menu when scrolling as the referenced element moves
    this.editor.layers.rendering.addEventListener("scroll", () =>
    {
      this.hide()
    })
  }

  show(): void
  {
    this.update()
    this.wrapper?.style.setProperty("display", "block")
  }

  hide(): void
  {
    this.wrapper?.style.setProperty("display", "none")
  }

  destroy(): void
  {
    while (this.wrapper?.lastChild) {
      this.wrapper.removeChild(this.wrapper.lastChild)
    }
    this.wrapper?.remove()
  }
}
