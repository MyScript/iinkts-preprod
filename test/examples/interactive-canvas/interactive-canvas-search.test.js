import { test, expect } from "@playwright/test"
import { passModalKey } from "../helper"

test.describe("Interactive ink canvas search", { tag: "@slow" }, () => {
  // The page imports ~1000 strokes of notes and waits for their recognition
  test.describe.configure({ timeout: 120 * 1000 })

  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_search.html`
    )
    await passModalKey(page)
    await expect(page.locator("#search-input")).toBeEnabled({ timeout: 60 * 1000 })
  })

  test("should list, highlight and reveal the occurrences of a word", async ({ page }) => {
    await page.locator("#search-input").fill("derivative")

    const results = page.locator("#search-results .search-result")
    await expect.poll(() => results.count(), { timeout: 20 * 1000 }).toBeGreaterThanOrEqual(2)
    await expect(page.locator('#rootEl [data-overlay="search"]').first()).toBeAttached()
    await expect(page.locator("#search-count")).toContainText("/")

    await results.first().click()
    await expect(results.first()).toHaveClass(/active/)
    await expect(page.locator("#rootEl .ms-search-highlight-active").first()).toBeAttached()
    await expect(page.locator('.ms-layer-rendering g[role="interact-elements-group"]')).toBeAttached()

    await page.locator("#next-btn").click()
    await expect(results.nth(1)).toHaveClass(/active/)
    await expect(page.locator("#search-count")).toContainText("2 /")
    await page.locator("#prev-btn").click()
    await expect(results.first()).toHaveClass(/active/)

    await page.locator("#search-input").fill("")
    await expect(page.locator("#next-btn")).toBeDisabled()
    await expect(results).toHaveCount(0)
    await expect(page.locator('#rootEl [data-overlay="search"]')).toHaveCount(0)
  })

  test("should find a handwritten expression", async ({ page }) => {
    await page.locator("#search-input").fill("f'(a)")
    // Cloud recognition of the notes varies a little run to run: assert presence, not an exact count
    await expect(page.locator("#search-results .search-result").first()).toBeVisible({ timeout: 20 * 1000 })
    await expect(page.locator("#search-results .search-result-tag").first()).toContainText("math")
  })
})
