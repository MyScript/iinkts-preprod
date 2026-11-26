import type { TExport } from "@/iink"
import { DefaultInteractiveInkSSRCanvasConfiguration, Model, WebSocketSSRClient } from "@/iink"

export class WebSocketSSRClientMock extends WebSocketSSRClient {
  constructor() {
    super(DefaultInteractiveInkSSRCanvasConfiguration)
  }
  //@ts-ignore
  init = jest.fn(() => {
    this.initialized.resolve()
    return this.initialized.promise
  })
  //@ts-ignore
  send = jest.fn(() => Promise.resolve())
  addStrokes = jest.fn(() => Promise.resolve({} as TExport))
  setPenStyle = jest.fn(() => Promise.resolve())
  setPenStyleClasses = jest.fn(() => Promise.resolve())
  setTheme = jest.fn(() => Promise.resolve())
  export = jest.fn(() => Promise.resolve(new Model()))
  import = jest.fn(() => Promise.resolve(new Model()))
  resize = jest.fn(() => Promise.resolve(new Model()))
  importPointEvents = jest.fn(() => Promise.resolve({} as TExport))
  convert = jest.fn(() => Promise.resolve(new Model()))
  waitForIdle = jest.fn(() => Promise.resolve())
  undo = jest.fn((m: Model) => Promise.resolve(m))
  redo = jest.fn((m: Model) => Promise.resolve(m))
  clear = jest.fn((m: Model) => Promise.resolve(m))
  close = jest.fn()
  destroy = jest.fn()
}
