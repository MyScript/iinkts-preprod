import { test, expect } from "@playwright/test"
import {
  passModalKey,
  writeStrokes,
  waitForConvertedEvent,
  callCanvasIdle,
  callCanvasConvert,
  getCanvasSymbols,
  pollJiix,
} from "../helper"
import dataset from "../__dataset__/diagram_connections"

test.describe("Interactive ink canvas diagram connections", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_diagram_connections.html`
    )
    await passModalKey(page)
  })

  test("tracks shape-edge connections live in ink, groups a multi-stroke edge into one entry, and preserves connections through Convert", async ({
    page,
  }) => {
    // Dataset: rectangle, a line edge (rectangle↔circle), a circle, a 2-stroke arrow edge
    // (rectangle↔rectangle), and a second rectangle — recorded as one continuous capture.
    await writeStrokes(page, dataset.strokes)
    await callCanvasIdle(page)

    const jiix = await pollJiix(page, 5, 20000)
    expect(jiix.elements).toHaveLength(5)

    const edgeElements = jiix.elements.filter((e) => e.type === "Edge")
    expect(edgeElements).toHaveLength(2)
    // Both edges connect exactly 2 shapes each — this dataset has no free-floating connections.
    edgeElements.forEach((edge) => expect(edge.connected).toHaveLength(2))

    // The 2-stroke arrow edge must render as a single panel entry, not one per stroke.
    await expect(page.locator("#connections-list .connection-info")).toHaveCount(2)

    const panelText = await page.locator("#connections-list").innerText()
    expect(panelText).toContain("rectangle")
    expect(panelText).toContain("circle")
    expect(panelText).toMatch(/ink/)

    // Every ink stroke classified as an Edge got a real anchor from sync on both ends.
    const symbolsBeforeConvert = await getCanvasSymbols(page)
    const edgeStrokesBeforeConvert = symbolsBeforeConvert.filter((s) => s.jiixBlockType === "Edge")
    expect(edgeStrokesBeforeConvert.length).toBeGreaterThan(0)
    expect(edgeStrokesBeforeConvert.every((s) => s.startAnchor && s.endAnchor)).toBe(true)

    // Convert, then confirm the connections survived onto the resulting vector edges.
    await Promise.all([waitForConvertedEvent(page), callCanvasConvert(page)])
    await callCanvasIdle(page)

    const symbolsAfterConvert = await getCanvasSymbols(page)
    const convertedEdges = symbolsAfterConvert.filter((s) => s.type === "edge")
    expect(convertedEdges).toHaveLength(2)
    expect(convertedEdges.every((e) => e.startAnchor && e.endAnchor)).toBe(true)
    // Anchors must point at real symbol ids now (post-convert), not the pre-convert jiixBlockId.
    const convertedShapeIds = new Set(symbolsAfterConvert.filter((s) => s.type === "shape").map((s) => s.id))
    convertedEdges.forEach((edge) => {
      expect(convertedShapeIds.has(edge.startAnchor.symbolId)).toBe(true)
      expect(convertedShapeIds.has(edge.endAnchor.symbolId)).toBe(true)
    })

    await expect(page.locator("#connections-list .connection-info")).toHaveCount(2)
    const panelTextAfterConvert = await page.locator("#connections-list").innerText()
    expect(panelTextAfterConvert).toContain("converted")
  })
})
