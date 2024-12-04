import { test, expect } from "@playwright/test"

test.describe("Rest no UI", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/rest/rest_no_ui.html")
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Rest no UI")
  })

  test("should display text/plain into result", async ({ page }) => {
    expect(await page.locator("#interpretatedTextContent").textContent()).toBe("")
    expect(await page.locator("#interpretatedImageContent > *").count()).toEqual(0)

    const textPlainExport =  page.waitForResponse(async (resp) => {
      const headers = await resp.allHeaders()
      return resp.url().includes("/iink/batch") && (headers["content-type"] == "text/plain")
    })
    const imagePngExport = page.waitForResponse(async (resp) => {
      return resp.url().includes("/iink/batch") && (await resp.allHeaders())["content-type"] == "image/png"
    })
    await Promise.all([
      textPlainExport,
      imagePngExport,
      page.click("#recognize")
    ])
    // for wait rendering after convertBlobToBase64
    await page.waitForTimeout(1000)

    expect(await page.locator("#interpretatedTextContent").textContent()).not.toBe("")
    expect(await page.locator("#interpretatedImageContent > *").count()).toEqual(1)
    expect(await page.locator("#interpretatedImageContent > img").getAttribute("src")).toContain("data:image/png;base64")
  })
})