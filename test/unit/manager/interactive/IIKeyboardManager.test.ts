import {
  IIKeyboardManager,
  InteractiveInkEditor,
  EditorTool
} from "../../../../src/iink"

describe("IIKeyboardManager", () =>
{
  let manager: IIKeyboardManager
  let mockEditor: any

  beforeEach(() =>
  {
    mockEditor = {
      tool: EditorTool.Write
    }

    manager = new IIKeyboardManager(mockEditor as InteractiveInkEditor)
  })

  afterEach(() =>
  {
    manager.detach()
  })

  describe("attach / detach", () =>
  {
    it("should attach event listeners", () =>
    {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener")

      manager.attach()

      expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith("keyup", expect.any(Function))

      addEventListenerSpy.mockRestore()
    })

    it("should detach event listeners", () =>
    {
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener")

      manager.attach()
      manager.detach()

      expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith("keyup", expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })
  })

  describe("handleKeyDown", () =>
  {
    beforeEach(() =>
    {
      manager.attach()
    })

    it("should switch to Move tool when Ctrl is pressed", () =>
    {
      const event = new KeyboardEvent("keydown", { ctrlKey: true })
      window.dispatchEvent(event)

      expect(mockEditor.tool).toBe(EditorTool.Move)
    })

    it("should switch to Move tool when Meta (Cmd) is pressed", () =>
    {
      const event = new KeyboardEvent("keydown", { metaKey: true })
      window.dispatchEvent(event)

      expect(mockEditor.tool).toBe(EditorTool.Move)
    })

    it("should not switch if already in Move mode", () =>
    {
      mockEditor.tool = EditorTool.Move

      const event = new KeyboardEvent("keydown", { ctrlKey: true })
      window.dispatchEvent(event)

      expect(mockEditor.tool).toBe(EditorTool.Move)
    })

    it("should ignore keydown in INPUT elements", () =>
    {
      const input = document.createElement("input")
      document.body.appendChild(input)

      const event = new KeyboardEvent("keydown", { ctrlKey: true, bubbles: true })
      Object.defineProperty(event, "target", { value: input, configurable: true })

      input.dispatchEvent(event)

      expect(mockEditor.tool).toBe(EditorTool.Write)

      document.body.removeChild(input)
    })

    it("should ignore keydown in TEXTAREA elements", () =>
    {
      const textarea = document.createElement("textarea")
      document.body.appendChild(textarea)

      const event = new KeyboardEvent("keydown", { ctrlKey: true, bubbles: true })
      Object.defineProperty(event, "target", { value: textarea, configurable: true })

      textarea.dispatchEvent(event)

      expect(mockEditor.tool).toBe(EditorTool.Write)

      document.body.removeChild(textarea)
    })
  })

  describe("handleKeyUp", () =>
  {
    beforeEach(() =>
    {
      manager.attach()
    })

    it("should restore previous tool when Ctrl is released", () =>
    {
      mockEditor.tool = EditorTool.Select

      // Press Ctrl to switch to Move
      const keydownEvent = new KeyboardEvent("keydown", { ctrlKey: true })
      window.dispatchEvent(keydownEvent)
      expect(mockEditor.tool).toBe(EditorTool.Move)

      // Release Ctrl to restore previous tool
      const keyupEvent = new KeyboardEvent("keyup", { ctrlKey: false })
      window.dispatchEvent(keyupEvent)

      expect(mockEditor.tool).toBe(EditorTool.Select)
    })

    it("should restore previous tool when Meta is released", () =>
    {
      mockEditor.tool = EditorTool.Erase

      // Press Meta to switch to Move
      const keydownEvent = new KeyboardEvent("keydown", { metaKey: true })
      window.dispatchEvent(keydownEvent)
      expect(mockEditor.tool).toBe(EditorTool.Move)

      // Release Meta to restore previous tool
      const keyupEvent = new KeyboardEvent("keyup", { metaKey: false })
      window.dispatchEvent(keyupEvent)

      expect(mockEditor.tool).toBe(EditorTool.Erase)
    })

    it("should not restore tool if Ctrl was not pressed", () =>
    {
      mockEditor.tool = EditorTool.Write

      const event = new KeyboardEvent("keyup", { ctrlKey: false })
      window.dispatchEvent(event)

      expect(mockEditor.tool).toBe(EditorTool.Write)
    })
  })

  describe("keyboard shortcut flow", () =>
  {
    it("should handle complete Ctrl+Move flow", () =>
    {
      manager.attach()

      mockEditor.tool = EditorTool.Write

      // Press Ctrl
      const keydown = new KeyboardEvent("keydown", { ctrlKey: true })
      window.dispatchEvent(keydown)
      expect(mockEditor.tool).toBe(EditorTool.Move)

      // Release Ctrl
      const keyup = new KeyboardEvent("keyup", { ctrlKey: false })
      window.dispatchEvent(keyup)
      expect(mockEditor.tool).toBe(EditorTool.Write)
    })

    it("should not switch twice if Ctrl is pressed multiple times", () =>
    {
      manager.attach()

      mockEditor.tool = EditorTool.Select

      // First Ctrl press
      const keydown1 = new KeyboardEvent("keydown", { ctrlKey: true })
      window.dispatchEvent(keydown1)
      expect(mockEditor.tool).toBe(EditorTool.Move)

      // Second Ctrl press (holding)
      const keydown2 = new KeyboardEvent("keydown", { ctrlKey: true })
      window.dispatchEvent(keydown2)
      expect(mockEditor.tool).toBe(EditorTool.Move)

      // Release Ctrl
      const keyup = new KeyboardEvent("keyup", { ctrlKey: false })
      window.dispatchEvent(keyup)
      expect(mockEditor.tool).toBe(EditorTool.Select)
    })
  })
})
