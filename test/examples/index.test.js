import { test, expect } from "@playwright/test"

const GITHUB_EXAMPLES = "https://github.com/MyScript/iinkTS/blob/master/examples/"

test.describe("Home Page", { tag: "@minimal" }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/index.html`)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("iinkTS — Examples")
  })

  test("each sidebar anchor targets a section of the page", async ({ page }) => {
    const anchors = await page.locator("#home-sidebar a[href^='#']").evaluateAll((links) => links.map((a) => a.getAttribute("href")))
    expect(anchors.length).toBeGreaterThan(0)
    const missing = await page.evaluate((hrefs) => hrefs.filter((href) => !document.getElementById(href.slice(1))), anchors)
    expect(missing).toStrictEqual([])
  })

  test("each card has one View and one Code link", async ({ page }) => {
    const cards = page.locator("article.card")
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
    await expect(cards.locator(".btn-view")).toHaveCount(count)
    await expect(cards.locator(".btn-code")).toHaveCount(count)
  })

  test("each Code link targets the iinkTS GitHub examples", async ({ page }) => {
    const hrefs = await page.locator(".btn-code").evaluateAll((links) => links.map((a) => a.getAttribute("href")))
    expect(hrefs.filter((href) => !href.startsWith(GITHUB_EXAMPLES))).toStrictEqual([])
  })

  test("each View link should be ok", async ({ page }) => {
    const urls = await page.locator(".btn-view").evaluateAll((links) => links.map((a) => a.href))
    const linksInErrors = []
    for (const url of urls) {
      const response = await page.request.get(url)
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (!response.ok()) {
        linksInErrors.push(url)
      }
    }
    expect(linksInErrors).toStrictEqual([])
  })
})
