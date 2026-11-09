import { test, expect } from "@playwright/test"
import {
  passModalKey,
  getCanvasSymbols,
  waitForSynchronizedEvent,
  writeStrokes,
  writePointers,
  callEditoClear,
  buildEraseSweepPointers,
  boundsOf,
} from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"

const writeHello = async (page) => {
  await Promise.all([waitForSynchronizedEvent(page), writeStrokes(page, helloOneStroke.strokes)])
  const [stroke] = await getCanvasSymbols(page)
  return stroke
}

const selectWithMenu = async (page, ids) => {
  await page.evaluate((ids) => {
    rootEl.iink.select(ids)
    rootEl.iink.menu.context.show()
  }, ids)
  await expect(page.locator("#ms-menu-context-wrapper")).toBeVisible()
}

const interactGroup = (page) => page.locator('.ms-layer-rendering g[role="interact-elements-group"]')

test.describe("Interactive ink canvas lock symbols", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_get_started.html`)
    await passModalKey(page)
  })

  test("locks from the context menu: tones the stroke down and frames it with a padlock, no handle", async ({ page }) => {
    const stroke = await writeHello(page)
    await selectWithMenu(page, [stroke.id])

    await page.locator("#ms-menu-context-lock").click()

    await expect.poll(async () => (await getCanvasSymbols(page))[0].locked).toBe(true)
    await expect(page.locator(`#${stroke.id}`)).toHaveClass(/ms-locked/)
    await expect(interactGroup(page).locator('[role="lock"]')).toBeAttached()
    await expect(interactGroup(page).locator('[role="resize"], [role="rotate"]')).toHaveCount(0)
  })

  test("dragging a locked selection leaves it in place and flashes a padlock", async ({ page }) => {
    const stroke = await writeHello(page)
    await page.evaluate((id) => rootEl.iink.lockSymbols([id]), stroke.id)
    await selectWithMenu(page, [stroke.id])

    const box = await interactGroup(page).locator('[role="translate"]').boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40, { steps: 5 })
    await page.mouse.up()

    await expect(page.locator(".ms-lock-icon-flash")).toBeAttached()
    const [after] = await getCanvasSymbols(page)
    expect(after.transform).toEqual(stroke.transform)
  })

  test("the eraser leaves a locked stroke alone and reports the refusal once", async ({ page }) => {
    const stroke = await writeHello(page)
    await page.evaluate((id) => rootEl.iink.lockSymbols([id]), stroke.id)
    // Counted rather than looked for: the padlock lasts under a second, less than the sweep itself
    await page.evaluate(() => {
      window.lockRefusals = 0
      rootEl.iink.event.addLockedRefusedListener(() => window.lockRefusals++)
    })

    await page.locator("#ms-menu-tool-erase").click()
    await page.locator("#ms-menu-tool-erase-20").click()
    await writePointers(page, buildEraseSweepPointers(boundsOf(helloOneStroke.strokes, -20)))

    expect(await page.evaluate(() => window.lockRefusals)).toBe(1)
    const symbols = await getCanvasSymbols(page)
    expect(symbols.map((s) => s.id)).toEqual([stroke.id])
  })

  test("clear keeps a locked stroke and erases the others", async ({ page }) => {
    const locked = await writeHello(page)
    await page.evaluate((id) => rootEl.iink.lockSymbols([id], false), locked.id)
    const shifted = helloOneStroke.strokes.map((s) => ({ ...s, pointers: s.pointers.map((p) => ({ ...p, y: p.y + 150 })) }))
    await Promise.all([waitForSynchronizedEvent(page), writeStrokes(page, shifted)])
    expect(await getCanvasSymbols(page)).toHaveLength(2)

    await callEditoClear(page)

    const symbols = await getCanvasSymbols(page)
    expect(symbols.map((s) => s.id)).toEqual([locked.id])
  })

  test("unlocks from the context menu: the handles come back", async ({ page }) => {
    const stroke = await writeHello(page)
    await page.evaluate((id) => rootEl.iink.lockSymbols([id]), stroke.id)
    await selectWithMenu(page, [stroke.id])

    const lockButton = page.locator("#ms-menu-context-lock")
    await expect(lockButton).toHaveText("Unlock")
    await lockButton.click()

    await expect.poll(async () => (await getCanvasSymbols(page))[0].locked).toBe(false)
    await expect(page.locator(`#${stroke.id}`)).not.toHaveClass(/ms-locked/)
    await expect(interactGroup(page).locator('[role="resize"]').first()).toBeAttached()
  })
})
