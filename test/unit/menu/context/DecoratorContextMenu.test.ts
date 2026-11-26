import type { TDecorator, TIIHistoryChanges, TMath, TSymbol, TText } from "@/iink"
import {
  DecoratorContextMenu,
  DecoratorKind,
  DecoratorUtil,
  DefaultStyle,
  isDecorator,
  OBBOps,
  StrokeUtil,
  SymbolGeometry,
} from "@/iink"

import { asCanvas, createCanvasMock } from "../../__mocks__/createCanvasMock"
import { buildIIMath, buildIIStroke, buildIIText } from "../../helpers"

describe("DecoratorContextMenu.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const buildTextSymbol = () =>
    buildIIText({
      chars: [
        {
          id: "char-1",
          label: "H",
          fontSize: 16,
          fontWeight: "normal",
          color: "#000000",
          bounds: { x: 0, y: 0, width: 10, height: 16 },
        },
      ],
      boundingBox: { x: 0, y: 0, width: 10, height: 16 },
    })

  test("should build a trigger and one submenu per decorator kind by default", () => {
    const canvas = createCanvasMock()
    const item = new DecoratorContextMenu(asCanvas(canvas))

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-context-decorator")).toBeTruthy()
    ;[DecoratorKind.Highlight, DecoratorKind.Surround, DecoratorKind.Underline, DecoratorKind.Strikethrough].forEach(
      (kind) => {
        expect(wrapper.querySelector(`#ms-menu-context-decorator-${kind}`)).toBeTruthy()
      }
    )
  })

  test("should omit a submenu when disabled via itemsConfig", () => {
    const canvas = createCanvasMock()
    const item = new DecoratorContextMenu(asCanvas(canvas), "ms-menu-context", { highlight: false })

    const wrapper = item.getElement()

    expect(wrapper.querySelector(`#ms-menu-context-decorator-${DecoratorKind.Highlight}`)).toBeNull()
    expect(wrapper.querySelector(`#ms-menu-context-decorator-${DecoratorKind.Surround}`)).toBeTruthy()
  })

  const strokeAt = (x: number) => {
    const stroke = buildIIStroke()
    StrokeUtil.addPointer(stroke, { x, y: 0, p: 1, dt: 100 })
    StrokeUtil.addPointer(stroke, { x: x + 10, y: 10, p: 1, dt: 200 })
    return stroke
  }

  const select = (canvas: ReturnType<typeof createCanvasMock>, symbols: TSymbol[]) =>
    symbols.forEach((s) => {
      canvas.model.addSymbol(s)
      canvas.model.selectSymbol(s.id)
    })

  const standaloneIn = (canvas: ReturnType<typeof createCanvasMock>, kind: DecoratorKind) =>
    canvas.model.symbols.filter((s): s is TDecorator => isDecorator(s) && s.kind === kind)

  const kindsOf = (canvas: ReturnType<typeof createCanvasMock>, id: string) =>
    (canvas.model.getSymbol(id) as TText | TMath).decorators.map((d) => d.kind)

  test("symbolsDecorable should include the selected strokes, texts and maths", () => {
    const canvas = createCanvasMock()
    const text = buildTextSymbol()
    const math = buildIIMath()
    const stroke = strokeAt(0)
    select(canvas, [text, math, stroke])
    const item = new DecoratorContextMenu(asCanvas(canvas))

    expect(item.symbolsDecorable.map((s) => s.id).sort()).toEqual([text.id, math.id, stroke.id].sort())
    expect(item.showDecorator).toBe(true)
  })

  test("should set the decorator on every selected text, math and stroke via the enable checkbox, in one undo step", () => {
    const canvas = createCanvasMock()
    const text = buildTextSymbol()
    const math = buildIIMath()
    const first = strokeAt(0)
    const second = strokeAt(50)
    select(canvas, [text, math, first, second])
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const checkbox = wrapper.querySelector(
      `#ms-menu-context-decorator-${DecoratorKind.Highlight}-enable`
    ) as HTMLInputElement
    const firstColorButton = wrapper.querySelector(
      `#ms-menu-context-decorator-${DecoratorKind.Highlight}-color-000000-btn`
    ) as HTMLButtonElement
    expect(firstColorButton.disabled).toBe(true)

    checkbox.checked = true
    checkbox.dispatchEvent(new Event("change", { bubbles: true }))

    expect(kindsOf(canvas, text.id)).toEqual([DecoratorKind.Highlight])
    expect(kindsOf(canvas, math.id)).toEqual([DecoratorKind.Highlight])
    const standalone = standaloneIn(canvas, DecoratorKind.Highlight)
    expect(standalone).toHaveLength(1)
    expect(standalone[0].targetIds).toEqual([first.id, second.id])
    expect(standalone[0].targetBounds).toEqual(
      OBBOps.createFromOBBs([SymbolGeometry.boundsOf(first), SymbolGeometry.boundsOf(second)])
    )
    expect(canvas.history.push).toHaveBeenCalledTimes(1)
    const changes = (canvas.history.push as jest.Mock).mock.calls[0][0] as TIIHistoryChanges
    expect(changes.added).toEqual(standalone)
    expect(changes.updated).toHaveLength(2)
    expect(firstColorButton.disabled).toBe(false)
    expect(firstColorButton.classList.contains("active")).toBe(true)
  })

  test("enabling leaves alone the strokes that already carry the decorator", () => {
    const canvas = createCanvasMock()
    const decorated = strokeAt(0)
    const bare = strokeAt(50)
    select(canvas, [decorated, bare])
    canvas.model.addSymbol(DecoratorUtil.createDecorator(DecoratorKind.Underline, DefaultStyle, [decorated.id]))
    const item = new DecoratorContextMenu(asCanvas(canvas))

    item.setDecorator(DecoratorKind.Underline, true)

    expect(standaloneIn(canvas, DecoratorKind.Underline).map((d) => d.targetIds)).toEqual([[decorated.id], [bare.id]])
  })

  test("disabling removes it from every selected symbol and shrinks a decorator also on unselected strokes", () => {
    const canvas = createCanvasMock()
    const text = buildTextSymbol()
    text.decorators.push(DecoratorUtil.createDecorator(DecoratorKind.Surround, DefaultStyle))
    const selected = strokeAt(0)
    const unselected = strokeAt(50)
    select(canvas, [text, selected])
    canvas.model.addSymbol(unselected)
    const own = DecoratorUtil.createDecorator(DecoratorKind.Surround, DefaultStyle, [selected.id])
    const shared = DecoratorUtil.createDecorator(DecoratorKind.Surround, DefaultStyle, [selected.id, unselected.id])
    canvas.model.addSymbol(own)
    canvas.model.addSymbol(shared)
    const item = new DecoratorContextMenu(asCanvas(canvas))

    item.setDecorator(DecoratorKind.Surround, false)

    expect(kindsOf(canvas, text.id)).toEqual([])
    expect(canvas.model.getSymbol(own.id)).toBeUndefined()
    const shrunk = canvas.model.getSymbol(shared.id) as TDecorator
    expect(shrunk.targetIds).toEqual([unselected.id])
    expect(shrunk.targetBounds).toEqual(SymbolGeometry.boundsOf(unselected))
    expect(canvas.history.push).toHaveBeenCalledTimes(1)
    const changes = (canvas.history.push as jest.Mock).mock.calls[0][0] as TIIHistoryChanges
    expect(changes.erased).toEqual([own])
    expect(changes.updated).toHaveLength(2)
  })

  test("a locked text is refused, the other symbols are still decorated", () => {
    const canvas = createCanvasMock()
    const locked = { ...buildTextSymbol(), locked: true }
    const stroke = strokeAt(0)
    select(canvas, [locked, stroke])
    const item = new DecoratorContextMenu(asCanvas(canvas))

    item.setDecorator(DecoratorKind.Highlight, true)

    expect(kindsOf(canvas, locked.id)).toEqual([])
    expect(canvas.event.emitLockedRefused).toHaveBeenCalled()
    expect(standaloneIn(canvas, DecoratorKind.Highlight)).toHaveLength(1)
  })

  test("should set the decorator color on every selected text, math and stroke on color pick", () => {
    const canvas = createCanvasMock()
    const text = buildTextSymbol()
    text.decorators.push(DecoratorUtil.createDecorator(DecoratorKind.Highlight, DefaultStyle))
    const math = buildIIMath()
    math.decorators.push(DecoratorUtil.createDecorator(DecoratorKind.Highlight, DefaultStyle))
    const stroke = strokeAt(0)
    select(canvas, [text, math, stroke])
    const standalone = DecoratorUtil.createDecorator(DecoratorKind.Highlight, DefaultStyle, [stroke.id])
    canvas.model.addSymbol(standalone)
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const redButton = wrapper.querySelector(
      `#ms-menu-context-decorator-${DecoratorKind.Highlight}-color-ff0000-btn`
    ) as HTMLButtonElement

    redButton.dispatchEvent(new Event("pointerup", { bubbles: true, cancelable: true }))

    const colorOf = (id: string) =>
      (canvas.model.getSymbol(id) as TText | TMath).decorators.find((d) => d.kind === DecoratorKind.Highlight)?.style
        .color
    expect(colorOf(text.id)).toEqual("#ff0000")
    expect(colorOf(math.id)).toEqual("#ff0000")
    expect((canvas.model.getSymbol(standalone.id) as TDecorator).style.color).toEqual("#ff0000")
    expect(canvas.history.push).toHaveBeenCalledTimes(1)
    expect(redButton.classList.contains("active")).toBe(true)
  })

  test("should toggle the top-level and per-kind submenus open on trigger pointerdown", () => {
    const canvas = createCanvasMock()
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const topTrigger = wrapper.querySelector("#ms-menu-context-decorator") as HTMLButtonElement
    const topContent = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    const kindTrigger = wrapper.querySelector(
      `#ms-menu-context-decorator-${DecoratorKind.Highlight}`
    ) as HTMLButtonElement
    const kindContent = kindTrigger.closest(".sub-menu")?.querySelector(".sub-menu-content") as HTMLDivElement

    topTrigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(topContent.classList.contains("open")).toBe(true)

    kindTrigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(kindContent.classList.contains("open")).toBe(true)
  })

  test("should hide the whole menu on update() when nothing decorable is selected", () => {
    const canvas = createCanvasMock()
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()

    item.update()

    expect(wrapper.style.display).toEqual("none")
  })

  test("should show the menu and check the box on update() when every decorable symbol has the decorator", () => {
    const canvas = createCanvasMock()
    const text = buildTextSymbol()
    text.decorators.push(DecoratorUtil.createDecorator(DecoratorKind.Highlight, DefaultStyle))
    canvas.model.addSymbol(text)
    canvas.model.selectSymbol(text.id)
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const checkbox = wrapper.querySelector(
      `#ms-menu-context-decorator-${DecoratorKind.Highlight}-enable`
    ) as HTMLInputElement

    item.update()

    expect(wrapper.style.display).not.toEqual("none")
    expect(checkbox.checked).toBe(true)
    expect(checkbox.indeterminate).toBe(false)
  })

  test("should show the menu on update() for a lone stroke recognized as math", () => {
    const canvas = createCanvasMock()
    const mathStroke = strokeAt(0)
    mathStroke.jiixBlockType = "Math"
    select(canvas, [mathStroke])
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()

    item.update()

    expect(wrapper.style.display).not.toEqual("none")
  })

  test("update() reads a stroke's standalone decorator: checked when all have it, indeterminate when some", () => {
    const canvas = createCanvasMock()
    const decorated = strokeAt(0)
    const bare = strokeAt(50)
    select(canvas, [decorated])
    canvas.model.addSymbol(DecoratorUtil.createDecorator(DecoratorKind.Underline, DefaultStyle, [decorated.id]))
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const checkbox = wrapper.querySelector(
      `#ms-menu-context-decorator-${DecoratorKind.Underline}-enable`
    ) as HTMLInputElement

    item.update()
    expect(checkbox.checked).toBe(true)

    select(canvas, [bare])
    item.update()
    expect(checkbox.indeterminate).toBe(true)
  })

  test("a click on the mixed state sets the decorator on every symbol, even when the box was checked before", () => {
    const canvas = createCanvasMock()
    const decorated = strokeAt(0)
    const bare = strokeAt(50)
    select(canvas, [decorated])
    canvas.model.addSymbol(DecoratorUtil.createDecorator(DecoratorKind.Underline, DefaultStyle, [decorated.id]))
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const checkbox = wrapper.querySelector(
      `#ms-menu-context-decorator-${DecoratorKind.Underline}-enable`
    ) as HTMLInputElement
    item.update()
    expect(checkbox.checked).toBe(true)
    select(canvas, [bare])
    item.update()

    checkbox.click()

    expect(standaloneIn(canvas, DecoratorKind.Underline).map((d) => d.targetIds)).toEqual([[decorated.id], [bare.id]])
  })

  test("should not throw and remove document listeners on destroy()", () => {
    const canvas = createCanvasMock()
    const item = new DecoratorContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)

    item.destroy()

    expect(document.body.contains(wrapper)).toBe(false)
    expect(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))).not.toThrow()
  })
})
