import { test, expect } from "@playwright/test"
import { passModalKey, writeStrokes, waitForSynchronizedEvent } from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"
import rectangle from "../__dataset__/rectangle"

test.describe("Interactive ink canvas Markdown & Mermaid Export", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_export_markdown_mermaid.html`)
    await passModalKey(page)
  })

  test("should start with both export results empty", async ({ page }) => {
    await expect(page.locator("#markdownResult")).toHaveText("")
    await expect(page.locator("#mermaidResult")).toHaveText("")
  })

  test("should convert recognized text to Markdown", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, helloOneStroke.strokes),
    ])

    await page.locator("#exportMarkdown").click()

    await expect(page.locator("#markdownResult")).toHaveText("hello")
  })

  test("should convert a recognized shape to a Mermaid flowchart node", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, rectangle.strokes),
    ])

    await page.locator("#exportMermaid").click()

    // The node id comes from the server (e.g. "raw-content/12") and isn't stable across runs —
    // only the flowchart shell and the shape-to-mermaid mapping ("rectangle" -> "[...]") are asserted.
    await expect(page.locator("#mermaidResult")).toHaveText(/^flowchart TD\n {2}\S+\[rectangle\]$/)
  })

  test("should clear both export results", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, helloOneStroke.strokes),
    ])

    await page.locator("#exportMarkdown").click()
    await expect(page.locator("#markdownResult")).toHaveText("hello")

    await page.locator("#clear").click()

    await expect(page.locator("#markdownResult")).toHaveText("")
    await expect(page.locator("#mermaidResult")).toHaveText("")
  })
})
