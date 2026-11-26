import type { TMarginConfiguration } from "@/iink"
import { InteractiveInkSSRSmartGuide } from "@/iink"

import { LeftClickEventMock } from "../__mocks__/EventMock"
import { InteractiveInkSSRCanvasMock } from "../__mocks__/InteractiveInkSSRCanvasMock"
import { delay } from "../helpers"

describe("InteractiveInkSSRSmartGuide.ts", () => {
  const canvasMock = new InteractiveInkSSRCanvasMock()
  const margin: TMarginConfiguration = {
    bottom: 100,
    top: 20,
    left: 30,
    right: 40,
  }
  test("should instanciate InteractiveInkSSRSmartGuide", () => {
    const sm = new InteractiveInkSSRSmartGuide(canvasMock)
    expect(sm).toBeDefined()
  })

  describe("Initilize", () => {
    const domElement = document.createElement("div")
    const sm = new InteractiveInkSSRSmartGuide(canvasMock)
    sm.init(domElement, margin)

    test("should init wrapper", () => {
      const smartguide = domElement.querySelector(".smartguide") as HTMLDivElement
      expect(smartguide).toBeDefined()
      expect(smartguide.id).toBe(`smartguide-${sm.uuid}`)
    })
    test("should init prompter", () => {
      const prompter = domElement.querySelector(".prompter-container") as HTMLDivElement
      expect(prompter).toBeDefined()
      expect(prompter.id).toBe(`prompter-container-${sm.uuid}`)

      const prompterText = domElement.querySelector(".prompter-text") as HTMLDivElement
      expect(prompterText).toBeDefined()
      expect(prompterText.id).toBe(`prompter-text-${sm.uuid}`)
    })
    test("should init ellipsis", () => {
      const wrapper = domElement.querySelector(".ellipsis") as HTMLDivElement
      expect(wrapper).toBeDefined()
      expect(wrapper.id).toBe(`ellipsis-${sm.uuid}`)
    })
    test("should init tag icon", () => {
      const wrapper = domElement.querySelector(".tag-icon") as HTMLDivElement
      expect(wrapper).toBeDefined()
      expect(wrapper.id).toBe(`tag-icon-${sm.uuid}`)
    })
    test("should init candidates", () => {
      const wrapper = domElement.querySelector(".candidates") as HTMLDivElement
      expect(wrapper).toBeDefined()
      expect(wrapper.id).toBe(`candidates-${sm.uuid}`)
    })
    test("should init more-menu", () => {
      const wrapper = domElement.querySelector(".more-menu") as HTMLDivElement
      expect(wrapper).toBeDefined()
      expect(wrapper.id).toBe(`more-menu-${sm.uuid}`)

      const copyBtn = domElement.querySelector(`#copy-${sm.uuid}`) as HTMLDivElement
      expect(copyBtn).toBeDefined()
      expect(copyBtn.classList).toContain("options-label-button")

      const deleteBtn = domElement.querySelector(`#delete-${sm.uuid}`) as HTMLDivElement
      expect(deleteBtn).toBeDefined()
      expect(deleteBtn.classList).toContain("options-label-button")
    })
  })

  describe("Menu visibility", () => {
    const domElement = document.createElement("div")
    const sm = new InteractiveInkSSRSmartGuide(canvasMock)
    sm.init(domElement, margin)

    const pointerDownEvt = new LeftClickEventMock("pointerdown", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1,
    })
    test("should hidden by default", () => {
      const menu = domElement.querySelector(".more-menu") as HTMLDivElement
      expect(menu.classList).toContain("close")
      expect(menu.classList).not.toContain("open")
    })
    test("should open menu", () => {
      const ellispis = domElement.querySelector(".ellipsis") as HTMLDivElement
      ellispis.dispatchEvent(pointerDownEvt)
      const menu = domElement.querySelector(".more-menu") as HTMLDivElement
      expect(menu.classList).not.toContain("close")
      expect(menu.classList).toContain("open")
    })
    test("should close menu", () => {
      const ellispis = domElement.querySelector(".ellipsis") as HTMLDivElement
      ellispis.dispatchEvent(pointerDownEvt)
      const menu = domElement.querySelector(".more-menu") as HTMLDivElement
      expect(menu.classList).toContain("close")
      expect(menu.classList).not.toContain("open")
    })
  })

  describe("Menu actions", () => {
    const domElement = document.createElement("div")
    const sm = new InteractiveInkSSRSmartGuide(canvasMock)
    sm.init(domElement, margin)

    const pointerDownEvt = new LeftClickEventMock("pointerdown", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1,
    })
    const ellispis = domElement.querySelector(".ellipsis") as HTMLDivElement
    ellispis.dispatchEvent(pointerDownEvt)
    test("should call canvas.convert", () => {
      expect(canvasMock.convert).toHaveBeenCalledTimes(0)
      const btn = domElement.querySelector(`#convert-${sm.uuid}`) as HTMLDivElement
      btn.dispatchEvent(pointerDownEvt)
      expect(canvasMock.convert).toHaveBeenCalledTimes(1)
    })
    test("should tell there is nothing to copy when the prompter is empty", async () => {
      canvasMock.event.emitNotif = jest.fn()
      const btn = domElement.querySelector(`#copy-${sm.uuid}`) as HTMLDivElement
      btn.dispatchEvent(pointerDownEvt)
      await delay(0)
      expect(canvasMock.event.emitNotif).toHaveBeenCalledWith({ message: "Nothing to copy", timeout: 1500 })
    })
    test("should copy the prompter text to the clipboard", async () => {
      canvasMock.event.emitNotif = jest.fn()
      // jsdom implements neither innerText nor execCommand
      const prompter = domElement.querySelector(".prompter-text") as HTMLDivElement
      Object.defineProperty(prompter, "innerText", { value: "hello", configurable: true })
      document.execCommand = jest.fn(() => true)
      const btn = domElement.querySelector(`#copy-${sm.uuid}`) as HTMLDivElement
      btn.dispatchEvent(pointerDownEvt)
      await delay(0)
      expect(document.execCommand).toHaveBeenCalledWith("copy")
      expect(canvasMock.event.emitNotif).toHaveBeenCalledWith({
        message: '"hello" copied to clipboard',
        timeout: 1500,
      })
    })
    test("should call behavior.clear", () => {
      expect(canvasMock.clear).toHaveBeenCalledTimes(0)
      const btn = domElement.querySelector(`#delete-${sm.uuid}`) as HTMLDivElement
      btn.dispatchEvent(pointerDownEvt)
      expect(canvasMock.clear).toHaveBeenCalledTimes(1)
    })
  })

  describe("Candidates escaping", () => {
    const PAYLOAD = '<img src=x onerror="window.__xss = true">'

    const buildJiix = (candidate: string) => ({
      type: "Text",
      label: "hello",
      words: [
        {
          id: "1",
          label: "hello",
          candidates: ["hello", candidate],
        },
      ],
      version: "3",
      id: "MainBlock",
    })

    const openCandidates = (sm: InteractiveInkSSRSmartGuide, domElement: HTMLElement) => {
      const wordSpan = domElement.querySelector(`#word-0${sm.uuid}`) as HTMLSpanElement
      expect(wordSpan).not.toBeNull()
      // EventMock does not set `bubbles`, so it cannot reach the listener on the prompter;
      // #onClickPrompter only reads target/preventDefault/stopPropagation, so a plain
      // bubbling Event is enough here.
      wordSpan.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true }))
      return domElement.querySelector(".candidates") as HTMLDivElement
    }

    test("should not build DOM from a server candidate label", () => {
      const domElement = document.createElement("div")
      const sm = new InteractiveInkSSRSmartGuide(canvasMock)
      sm.init(domElement, margin)
      sm.update(buildJiix(PAYLOAD))

      const candidates = openCandidates(sm, domElement)

      expect(candidates.querySelector("img")).toBeNull()
      expect(candidates.textContent).toContain(PAYLOAD)
    })

    test("should still render one span per candidate", () => {
      const domElement = document.createElement("div")
      const sm = new InteractiveInkSSRSmartGuide(canvasMock)
      sm.init(domElement, margin)
      sm.update(buildJiix("helle"))

      const candidates = openCandidates(sm, domElement)

      expect(candidates.children).toHaveLength(2)
      expect(candidates.children[0].id).toBe(`cdt-0${sm.uuid}`)
      expect(candidates.children[0].textContent).toBe("hello")
      expect(candidates.children[1].textContent).toBe("helle")
    })

    test("should mark the candidate matching the current label as selected", () => {
      const domElement = document.createElement("div")
      const sm = new InteractiveInkSSRSmartGuide(canvasMock)
      sm.init(domElement, margin)
      sm.update(buildJiix("helle"))

      const candidates = openCandidates(sm, domElement)

      expect(candidates.children[0].classList.contains("selected-word")).toBe(true)
      expect(candidates.children[1].classList.contains("selected-word")).toBe(false)
    })
  })

  describe("Display", () => {
    const domElement = document.createElement("div")
    const sm = new InteractiveInkSSRSmartGuide(canvasMock)
    sm.init(domElement, margin)
    const jiix = {
      type: "Text",
      label: "hello how",
      words: [
        {
          id: "1",
          label: "hello",
          candidates: ["hello", "helle", "hellor", "hells", "hellon"],
        },
        {
          label: " ",
        },
        {
          id: "2",
          label: "how",
          candidates: ["how", "hou", "hore", "hon", "hor"],
        },
      ],
      version: "3",
      id: "MainBlock",
    }

    test("should display jiix label into prompter-text", () => {
      sm.update(jiix)
      const prompterText = domElement.querySelector(".prompter-text") as HTMLDivElement
      expect(prompterText).toBeDefined()
      expect(prompterText.textContent).toContain(jiix.words[0].label)
      expect(prompterText.textContent).toContain(jiix.words[2].label)
      expect(prompterText.children.length).toBeGreaterThan(0)
      const candidates = domElement.querySelector(".candidates") as HTMLDivElement
      expect(candidates.children).toHaveLength(0)
    })
  })
})
