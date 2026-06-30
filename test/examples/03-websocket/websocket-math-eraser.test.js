import { test, expect } from "@playwright/test"
import {
  callEditorIdle,
  waitForExportedEvent,
  writePointers,
  writeStrokes,
  passModalKey,
} from "../helper"
import equation from "../__dataset__/equation"

test.describe("Websocket Math Eraser", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/websocket/websocket_math_eraser.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Websocket Math Eraser")
  })

  test("should erase first stroke", async ({ page }) => {
    await writeStrokes(page, equation.strokes)
    await callEditorIdle(page)
    await expect(page.locator("#result .katex-html")).toHaveText(
      equation.exports.LATEX.at(-1)
    )

    await page.locator("#eraser").click()

    await Promise.all([
      waitForExportedEvent(page),
      writePointers(
        page,
        equation.strokes[0].pointers.filter((p, i) => i % 2)
      ),
    ])
    await expect(page.locator("#result .katex-html")).toHaveText("=3x+2")
  })
})
