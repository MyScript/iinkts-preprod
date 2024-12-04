import { test, expect } from "@playwright/test"
import { waitForEditorWebSocket, writeStrokes, waitForExportedEvent, callEditorIdle } from "../helper"
import h from "../__dataset__/h"

function hexToRgbA(hex) {
  let c
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split("")
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]]
    }
    c = "0x" + c.join("")
    return (
      "rgba(" + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(", ") + ", 1)"
    )
  }
  throw new Error("Bad Hex")
}

test.describe("Websocket Text Customize Stroke Style", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_text_customize_stroke_style.html")
    await Promise.all([
      waitForEditorWebSocket(page),
      page.waitForResponse(req => req.url().includes("api/v4.0/iink/font/google/language/en_US"))
    ])
    await callEditorIdle(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Websocket Text Styling")
  })

  test("should draw stroke with DefaultTheme", async ({ page }) => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])
    const defaultThemeColor = await page.evaluate("editor.theme.ink.color")
    const path = page.locator(`path[fill="${hexToRgbA(defaultThemeColor)}"]`)
    expect(await path.count()).toEqual(1)
  })

  test("should draw stroke with penStyleClasses", async ({ page }) => {
    await page.locator("#penStyleClasses").check()
    await page.waitForTimeout(2000)

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])

    const editorTheme = await page.evaluate("editor.theme")
    const editorPenStyleClasses = await page.evaluate("editor.penStyleClasses")
    const penColorExpected = editorTheme[`.${editorPenStyleClasses}`].color
    expect(await page.locator(`path[fill="${hexToRgbA(penColorExpected)}"]`).count()).toEqual(1)
  })

  test("should draw stroke with theme", async ({ page }) => {
    await page.selectOption("#theme", "bold-red"),

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])

    const editorTheme = await page.evaluate("editor.theme")
    const penColorExpected = editorTheme.ink.color
    const path = page.locator(`path[fill="${hexToRgbA(penColorExpected)}"]`)
    expect(await path.count()).toEqual(1)
  })

  test("should draw stroke with default penStyle", async ({ page }) => {
    expect(await page.locator("#pencolor").isDisabled()).toEqual(true)
    expect(await page.locator("#penwidth").isDisabled()).toEqual(true)
    await page.setChecked("#penenabled", true)
    expect(await page.locator("#pencolor").isDisabled()).toEqual(false)
    expect(await page.locator("#penwidth").isDisabled()).toEqual(false)

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])

    const editorPenStyle = await page.evaluate("editor.penStyle")
    const path = page.locator(`path[fill="${hexToRgbA(editorPenStyle.color)}"]`)
    expect(await path.count()).toEqual(1)

    await page.setChecked("#penenabled", false)
    expect(await page.locator("#pencolor").isDisabled()).toEqual(true)
    expect(await page.locator("#penwidth").isDisabled()).toEqual(true)
  })

  test("should draw stroke with selected penStyle", async ({ page }) => {
    const penColorExpected = "#1a5fb4"
    expect(await page.locator("#pencolor").isDisabled()).toEqual(true)
    expect(await page.locator("#penwidth").isDisabled()).toEqual(true)

    await page.setChecked("#penenabled", true)
    expect(await page.locator("#pencolor").isDisabled()).toEqual(false)
    expect(await page.locator("#penwidth").isDisabled()).toEqual(false)

    await page.fill("#pencolor", penColorExpected)

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])

    const path = page.locator(`path[fill="${hexToRgbA(penColorExpected)}"]`)
    expect(await path.count()).toEqual(1)
  })
})