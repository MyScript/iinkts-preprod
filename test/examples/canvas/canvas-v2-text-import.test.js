import { test, expect } from "@playwright/test"
import { waitForCanvasInit, writeStrokes, waitForExportedEvent, getCanvasExports, passModalKey, getCanvasStrokes } from "../helper"
import h from "../__dataset__/h"

test.describe("Ink Canvas v2 Text Import", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/canvas/canvas_v2_text_import_strokes.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Ink Canvas v2 Import")
  })

  test("should import strokes into result", async ({ page }) => {
    await page.locator("#importStrokes").click()
    await expect(page.locator("#result")).toHaveText("MyScript")
  })

  test("Nav actions", async ({ page }) => {
    await test.step("should import", async () => {
      await page.locator("#importStrokes").click()
      await expect(page.locator("#result")).toHaveText("MyScript")
    })

    await test.step("should clear", async () => {
      const promisesResult = await Promise.all([waitForExportedEvent(page), page.locator("#clear").click()])
      expect(promisesResult[0]).toBeNull()
      expect(await getCanvasExports(page)).toBeFalsy()
      await expect(page.locator("#result")).toBeEmpty()
    })

    await test.step("should undo clear", async () => {
      await page.locator("#undo").click()
      await expect(page.locator("#result")).toHaveText("MyScript")
    })

    await test.step("should undo import", async () => {
      await page.locator("#undo").click()
      await expect(page.locator("#result")).toBeEmpty()
    })

    await test.step("should redo", async () => {
      await page.locator("#redo").click()
      await expect(page.locator("#result")).toHaveText("MyScript")
    })
  })
})
