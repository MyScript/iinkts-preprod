import { test, expect } from "@playwright/test"
import {
  passModalKey,
  writeStrokes,
  waitForSynchronizedEvent,
  getCanvasSymbols,
} from "../helper"
import locator from "../locators"
import helloOneStroke from "../__dataset__/helloOneStroke"

test.describe("Interactive ink canvas Export Formats", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__printCalled = false
      window.print = () => {
        window.__printCalled = true
      }
    })
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_export.html`)
    await passModalKey(page)
  })

  test("only the Export menu is shown, with every format available", async ({ page }) => {
    await page.locator(locator.menu.action.triggerBtn).click()

    await expect(page.locator(locator.menu.action.export.triggerBtn)).toBeVisible()
    await expect(page.locator(locator.menu.action.gesture.triggerBtn)).toHaveCount(0)
    await expect(page.locator(locator.menu.action.guide.triggerBtn)).toHaveCount(0)
    await expect(page.locator(locator.menu.action.snap.triggerBtn)).toHaveCount(0)
    await expect(page.locator(locator.menu.action.convertBtn)).toHaveCount(0)
    await expect(page.locator(locator.menu.action.undoBtn)).toHaveCount(0)
    await expect(page.locator(locator.menu.action.clearBtn)).toHaveCount(0)
    await expect(page.locator(locator.menu.action.language.trigger)).toHaveCount(0)

    await page.locator(locator.menu.action.export.triggerBtn).click()
    await expect(page.locator("#ms-menu-action-export-json")).toBeVisible()
    await expect(page.locator("#ms-menu-action-export-svg")).toBeVisible()
    await expect(page.locator("#ms-menu-action-export-png")).toBeVisible()
    await expect(page.locator("#ms-menu-action-export-text")).toBeVisible()
    await expect(page.locator(locator.menu.action.export.pdfBtn)).toBeVisible()
  })

  test("toolbar buttons trigger exports directly from code, same as the menu", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, helloOneStroke.strokes)
    ])

    await test.step("JSON toolbar button triggers a download", async () => {
      const downloadPromise = page.waitForEvent("download")
      await page.locator("#btn-export-json").click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain(".json")
    })

    await test.step("PDF toolbar button opens the dialog and printing works the same way", async () => {
      await page.locator("#btn-export-pdf").click()
      await page.locator(".ms-modal-actions").getByRole("button", { name: "Export", exact: true }).click()
      await expect(page.locator(".ms-modal")).toHaveCount(0)
      expect(await page.evaluate(() => window.__printCalled)).toBe(true)
    })
  })

  test("right-click context menu is disabled", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, helloOneStroke.strokes)
    ])

    await page.locator("#rootEl").click({ button: "right" })
    await expect(page.locator(locator.menu.context.wrapper)).toHaveCount(0)
  })

  test("confirming the export dialog prints and closes it", async ({ page }) => {
    await test.step("write a stroke", async () => {
      await Promise.all([
        waitForSynchronizedEvent(page),
        writeStrokes(page, helloOneStroke.strokes)
      ])
      expect(await getCanvasSymbols(page)).toHaveLength(helloOneStroke.strokes.length)
    })

    await test.step("open Export menu and click PDF", async () => {
      await page.locator(locator.menu.action.triggerBtn).click()
      await page.locator(locator.menu.action.export.triggerBtn).click()
      await page.locator(locator.menu.action.export.pdfBtn).click()
    })

    await test.step("dialog shows the default format/orientation/mode/scale", async () => {
      await expect(page.locator("#ii-pdf-export-format")).toHaveValue("A4")
      await expect(page.locator("#ii-pdf-export-orientation")).toHaveValue("portrait")
      await expect(page.locator("#ii-pdf-export-mode")).toHaveValue("single")
      await expect(page.locator("#ii-pdf-export-scale")).toHaveValue("100")
    })

    await test.step("confirming Export triggers window.print and closes the dialog", async () => {
      await page.locator(".ms-modal-actions").getByRole("button", { name: "Export", exact: true }).click()
      await expect(page.locator(".ms-modal")).toHaveCount(0)
      expect(await page.evaluate(() => window.__printCalled)).toBe(true)
    })
  })

  test("cancelling the export dialog does not print", async ({ page }) => {
    await test.step("open Export menu and click PDF", async () => {
      await page.locator(locator.menu.action.triggerBtn).click()
      await page.locator(locator.menu.action.export.triggerBtn).click()
      await page.locator(locator.menu.action.export.pdfBtn).click()
    })

    await test.step("cancelling closes the dialog without printing", async () => {
      await page.locator(".ms-modal-actions").getByRole("button", { name: "Cancel", exact: true }).click()
      await expect(page.locator(".ms-modal")).toHaveCount(0)
      expect(await page.evaluate(() => window.__printCalled)).toBe(false)
    })
  })

  test("selecting multi-page tiled mode and printing", async ({ page }) => {
    await test.step("open Export menu and click PDF", async () => {
      await page.locator(locator.menu.action.triggerBtn).click()
      await page.locator(locator.menu.action.export.triggerBtn).click()
      await page.locator(locator.menu.action.export.pdfBtn).click()
    })

    await test.step("switch to multi-page tiled mode and confirm", async () => {
      await page.locator("#ii-pdf-export-mode").selectOption("multi")
      await page.locator(".ms-modal-actions").getByRole("button", { name: "Export", exact: true }).click()
      await expect(page.locator(".ms-modal")).toHaveCount(0)
      expect(await page.evaluate(() => window.__printCalled)).toBe(true)
    })
  })
})
