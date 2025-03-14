import { DoubleTouchEventMock, LeftClickEventMock, RightClickEventMock, TouchEventMock } from "../__mocks__/EventMock"
import { DefaultGrabberConfiguration, PointerEventGrabber, TGrabberConfiguration } from "../../../src/iink"

describe("PointerEventGrabber.ts", () =>
{
  test("should create with default configuration", () =>
  {
    const grabber = new PointerEventGrabber(DefaultGrabberConfiguration)
    expect(grabber).toBeDefined()
  })

  describe("should attach & detach", () =>
  {
    const wrapperHTML: HTMLElement = document.createElement("div")
    wrapperHTML.style.width = "100px"
    wrapperHTML.style.height = "100px"
    document.body.appendChild(wrapperHTML)

    const grabber = new PointerEventGrabber(DefaultGrabberConfiguration)
    grabber.attach(wrapperHTML)
    grabber.onPointerDown = jest.fn()
    grabber.onPointerMove = jest.fn()
    grabber.onPointerUp = jest.fn()

    const pointerDownEvt = new LeftClickEventMock("pointerdown", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1
    })

    const pointerMoveEvt = new LeftClickEventMock("pointermove", {
      pointerType: "pen",
      clientX: 15,
      clientY: 15,
      pressure: 1
    })
    pointerMoveEvt.pointerId = pointerDownEvt.pointerId

    const pointerUpEvt = new LeftClickEventMock("pointerup", {
      pointerType: "pen",
      clientX: 15,
      clientY: 15,
      pressure: 1
    })
    pointerUpEvt.pointerId = pointerDownEvt.pointerId

    test("should listen pointerdown event", () =>
    {
      wrapperHTML.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).toBeCalledTimes(1)
    })

    test("should listen pointermove event", () =>
    {
      wrapperHTML.dispatchEvent(pointerMoveEvt)
      expect(grabber.onPointerMove).toBeCalledTimes(1)
    })

    test("should listen pointerup event", () =>
    {
      wrapperHTML.dispatchEvent(pointerUpEvt)
      expect(grabber.onPointerUp).toBeCalledTimes(1)
    })

    test("should call detach if already attach", () =>
    {
      const g = new PointerEventGrabber(DefaultGrabberConfiguration)
      g.onPointerDown = jest.fn()
      g.onPointerMove = jest.fn()
      g.onPointerUp = jest.fn()
      g.detach = jest.fn()
      g.attach(wrapperHTML)
      g.attach(wrapperHTML)
      expect(g.detach).toBeCalledTimes(1)
    })

    test("should not listen pointerdown event after detach", () =>
    {
      grabber.detach()
      wrapperHTML.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).not.toBeCalled()
    })

    test("should not listen pointermove event after detach", () =>
    {
      grabber.detach()
      wrapperHTML.dispatchEvent(pointerMoveEvt)
      expect(grabber.onPointerMove).not.toBeCalled()
    })

    test("should not listen pointerup event after detach", () =>
    {
      grabber.detach()
      wrapperHTML.dispatchEvent(pointerUpEvt)
      expect(grabber.onPointerUp).not.toBeCalled()
    })
  })

  describe("Should extract TPointer from event", () =>
  {
    const wrapperHTML: HTMLElement = document.createElement("div")
    wrapperHTML.style.width = "100px"
    wrapperHTML.style.height = "100px"
    document.body.appendChild(wrapperHTML)

    const grabber = new PointerEventGrabber(DefaultGrabberConfiguration)
    grabber.onPointerDown = jest.fn()
    grabber.attach(wrapperHTML)

    test("should extract TPointer from mouseEvent", () =>
    {
      const mouseDownEvt = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 2705,
        clientY: 1989,
        pressure: 1
      })

      wrapperHTML.dispatchEvent(mouseDownEvt)

      expect(grabber.onPointerDown)
        .toBeCalledWith(
          expect.objectContaining({
            pointer: expect.objectContaining({
              x: mouseDownEvt.clientX,
              y: mouseDownEvt.clientY,
              p: mouseDownEvt.pressure
            })
          })
        )
    })

    test("should extract TPointer from touchEvent", () =>
    {
      const touchDownEvt = new TouchEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 2705,
        clientY: 1989,
        pressure: 1
      })

      wrapperHTML.dispatchEvent(touchDownEvt)

      expect(grabber.onPointerDown)
        .toBeCalledWith(
          expect.objectContaining({
            pointer: expect.objectContaining({
              x: touchDownEvt.changedTouches[0].clientX,
              y: touchDownEvt.changedTouches[0].clientY,
              p: touchDownEvt.pressure
            })
          })
        )
    })
  })

  describe("Should use configuration", () =>
  {
    const wrapperHTML: HTMLElement = document.createElement("div")
    wrapperHTML.style.width = "100px"
    wrapperHTML.style.height = "100px"
    document.body.appendChild(wrapperHTML)

    const pointerDownEvt = new LeftClickEventMock("pointerdown", {
      pointerType: "pen",
      clientX: 2705,
      clientY: 1989,
      pressure: 1
    })

    test("should not round values with default configuration", () =>
    {
      const grabber = new PointerEventGrabber(DefaultGrabberConfiguration)
      grabber.onPointerDown = jest.fn()
      grabber.onPointerMove = jest.fn()
      grabber.onPointerUp = jest.fn()
      grabber.attach(wrapperHTML)

      wrapperHTML.dispatchEvent(pointerDownEvt)

      expect(grabber.onPointerDown)
        .toBeCalledWith(
          expect.objectContaining({
            pointer: expect.objectContaining({
              x: pointerDownEvt.clientX,
              y: pointerDownEvt.clientY,
              p: pointerDownEvt.pressure
            })
          })
        )
      grabber.detach()
    })

    test("should round values from configuration", () =>
    {
      const grabberConfig: TGrabberConfiguration = { ...DefaultGrabberConfiguration, xyFloatPrecision: 2 }
      const grabber = new PointerEventGrabber(grabberConfig)
      grabber.onPointerDown = jest.fn()
      grabber.onPointerMove = jest.fn()
      grabber.onPointerUp = jest.fn()
      grabber.attach(wrapperHTML)

      grabber.onPointerDown = jest.fn()

      wrapperHTML.dispatchEvent(pointerDownEvt)

      expect(grabber.onPointerDown)
        .toBeCalledWith(
          expect.objectContaining({
            pointer: expect.objectContaining({
              x: Math.round(pointerDownEvt.clientX / 100) * 100,
              y: Math.round(pointerDownEvt.clientY / 100) * 100,
              p: pointerDownEvt.pressure
            })
          })
        )
    })

    test("should not round values from configuration if negative precision", () =>
    {
      const grabberConfig: TGrabberConfiguration = { ...DefaultGrabberConfiguration, xyFloatPrecision: -2 }
      const grabber = new PointerEventGrabber(grabberConfig)
      grabber.onPointerDown = jest.fn()
      grabber.onPointerMove = jest.fn()
      grabber.onPointerUp = jest.fn()
      grabber.attach(wrapperHTML)

      grabber.onPointerDown = jest.fn()

      wrapperHTML.dispatchEvent(pointerDownEvt)

      expect(grabber.onPointerDown)
        .toBeCalledWith(
          expect.objectContaining({
            pointer: expect.objectContaining({
              x: pointerDownEvt.clientX,
              y: pointerDownEvt.clientY,
              p: pointerDownEvt.pressure
            })
          })
        )
    })
  })

  describe("Should ignore Event", () =>
  {
    const wrapperHTML: HTMLElement = document.createElement("div")
    wrapperHTML.style.width = "100px"
    wrapperHTML.style.height = "100px"
    document.body.appendChild(wrapperHTML)

    const grabber = new PointerEventGrabber(DefaultGrabberConfiguration)
    grabber.attach(wrapperHTML)
    grabber.onPointerDown = jest.fn()

    test("should not listen right click event", () =>
    {
      const pointerDownEvt = new RightClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      wrapperHTML.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).not.toBeCalled()
      grabber.detach()
    })

    test("should not listen right click event", () =>
    {
      const pointerDownEvt = new DoubleTouchEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      wrapperHTML.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).not.toBeCalled()
      grabber.detach()
    })
  })

})
