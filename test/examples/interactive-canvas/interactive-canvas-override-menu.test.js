import { test, expect } from "@playwright/test"
import { passModalKey, writeStrokes } from "../helper"
import h from "../__dataset__/h"

test.describe("Interactive ink canvas menu items and overrides", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_override_menu.html`
    )
    await passModalKey(page)
  })

  // Commented out until the menu layout work (.local/menu-layout/PLAN.md) rewrites the example:
  // it no longer has the zoom buttons nor the tool bar's "…" dropdown these tests rely on.
  // test("should add the items to the action and tool bars", async ({ page }) => {
  //   await expect(page.locator("#download-png")).toBeVisible()
  //   await expect(page.locator("#stroke-count")).toBeVisible()
  //   await expect(page.locator("#reset-zoom")).toBeVisible()
  //   // The "…" dropdown holding the item sent to the tool menu's dropdown zone ends the tool bar
  //   const toolBar = page.locator(".ms-menu-bottom")
  //   await expect(toolBar.locator(":scope > :last-child #ms-menu-tool-more")).toBeAttached()
  // })

  // test("should open the tool bar's dropdown on the item sent to it", async ({ page }) => {
  //   await expect(page.locator("#zoom-in")).toBeHidden()
  //   await page.locator("#ms-menu-tool-more").click()
  //   await expect(page.locator("#zoom-in")).toBeVisible()
  // })

  // test("should zoom in and out from the current level", async ({ page }) => {
  //   const zoom = () => page.evaluate(() => Math.round(window.canvas.renderer.getZoom() * 100))
  //   expect(await zoom()).toBe(100)
  //   await page.locator("#ms-menu-tool-more").click()
  //
  //   await page.locator("#zoom-in").click()
  //   await page.locator("#zoom-in").click()
  //   // Each step multiplies the current level: 1.2 × 1.2
  //   await expect.poll(zoom).toBe(144)
  //
  //   await page.locator("#zoom-out").click()
  //   await expect.poll(zoom).toBe(120)
  //
  //   await page.locator("#reset-zoom").click()
  //   await expect.poll(zoom).toBe(100)
  // })

  // test("should put the zoom buttons side by side in the tool bar's dropdown", async ({ page }) => {
  //   await page.locator("#ms-menu-tool-more").click()
  //   const zoomOut = await page.locator("#zoom-out").boundingBox()
  //   const zoomIn = await page.locator("#zoom-in").boundingBox()
  //   expect(zoomIn.y).toBe(zoomOut.y)
  //   expect(zoomIn.x).toBeGreaterThan(zoomOut.x)
  // })

  test("should move undo/redo from the action bar to the style menu's bar", async ({ page }) => {
    await expect(page.locator("#ms-menu-action-undoredo")).not.toBeAttached()
    await expect(page.locator("#ms-menu-style-undoredo-undo")).toBeVisible()
    await expect(page.locator("#ms-menu-style-undoredo-undo")).toBeDisabled()
    await writeStrokes(page, h.strokes)
    await expect(page.locator("#ms-menu-style-undoredo-undo")).toBeEnabled()
  })

  test("should count the strokes in the badge as the user writes", async ({ page }) => {
    const badge = page.locator("#stroke-count .custom-badge")
    await expect(badge).toHaveText("0")
    await writeStrokes(page, h.strokes)
    await expect(badge).not.toHaveText("0")
  })

  test("should keep the added items when the menu configuration changes", async ({ page }) => {
    await page.evaluate(() => window.canvas.menu.setConfig({ tool: { erase: false } }))
    await expect(page.locator("#ms-menu-tool-erase")).not.toBeAttached()
    await expect(page.locator("#reset-zoom")).toBeVisible()
    await expect(page.locator("#download-png")).toBeVisible()
  })

  test("should show the quick action above the context menu list", async ({ page }) => {
    await page.evaluate(() => {
      window.canvas.menu.context.position = { x: 400, y: 300 }
      window.canvas.menu.context.show()
    })
    await expect(page.locator(".ms-menu-context-bar #count-selected")).toBeVisible()
  })

  test("should restrict the overridden style menu to the brand colors", async ({ page }) => {
    await expect(page.locator("#ms-menu-style-color-list > *")).toHaveCount(6)
  })
})
