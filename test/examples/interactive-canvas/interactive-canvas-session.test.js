import { writeFile } from "node:fs/promises"
import { test, expect } from "@playwright/test"
import { passModalKey, writeStrokes, waitForSynchronizedEvent, getCanvasSymbols, callCanvasExport } from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"
import madrid from "../__dataset__/madrid"

const PAGE = `${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_session.html`
const JIIX = "application/vnd.myscript.jiix"

const symbolIds = async (page) => (await getCanvasSymbols(page)).map((s) => s.id)
// Raw Content: the recognized text is on the elements, not on the root
const jiixLabel = async (page) => (await callCanvasExport(page, JIIX)).elements?.[0]?.label

/** Writes "hello" and waits for the server to recognize it */
const writeHello = (page) => Promise.all([waitForSynchronizedEvent(page), writeStrokes(page, helloOneStroke.strokes)])

/** The session is saved in memory a while after the changes stop: shortened, for the test */
const shortenSnapshotDelay = (page) => page.evaluate(() => (rootEl.iink.configuration.persistence.snapshotDelay = 500))
const waitForSnapshot = (page) =>
  expect.poll(() => page.evaluate(() => !!rootEl.iink.session.snapshot?.package), { timeout: 15000 }).toBe(true)

/** Entries the page saved in the browser */
const storedEntries = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const request = indexedDB.open("iinkts-sessions")
        request.onsuccess = () => {
          const read = request.result.transaction("entries").objectStore("entries").getAll()
          read.onsuccess = () => {
            request.result.close()
            resolve(read.result.map((e) => e.symbolCount))
          }
        }
      })
  )

test.describe("Interactive ink canvas session", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE)
    await passModalKey(page)
  })

  test("should save the session to a file and open it again", async ({ page }, testInfo) => {
    await writeHello(page)
    const written = await symbolIds(page)

    const downloading = page.waitForEvent("download")
    await page.locator("#btn-save").click()
    const download = await downloading
    expect(download.suggestedFilename()).toMatch(/\.iinkts$/)
    const file = testInfo.outputPath("hello.iinkts")
    await download.saveAs(file)

    await page.evaluate(() => rootEl.iink.clear())
    await expect.poll(() => symbolIds(page)).toEqual([])

    await page.locator("#input-open").setInputFiles(file)
    await expect(page.locator("#session-status")).toHaveText("Restored, recognition resumed as it was")
    expect(await symbolIds(page)).toEqual(written)
    expect(await jiixLabel(page)).toEqual(helloOneStroke.exports[JIIX].label)
  })

  test("should save and open the session from the action menu", async ({ page }, testInfo) => {
    await writeHello(page)
    const written = await symbolIds(page)
    const openSessionMenu = async () => {
      await page.locator("#ms-menu-action").dispatchEvent("pointerdown")
      await page.locator("#ms-menu-action-session-trigger").dispatchEvent("pointerdown")
    }

    await openSessionMenu()
    const downloading = page.waitForEvent("download")
    await page.locator("#ms-menu-action-session-save").dispatchEvent("pointerup")
    const file = testInfo.outputPath("menu.iinkts")
    await (await downloading).saveAs(file)
    await page.evaluate(() => rootEl.iink.clear())

    await openSessionMenu()
    await page.locator("#ms-menu-action-session-open-input").setInputFiles(file)
    await page.locator("#ms-menu-action-session-open button").dispatchEvent("pointerup")

    await expect.poll(() => symbolIds(page)).toEqual(written)
    await expect(page.locator(".ms-modal")).toHaveCount(0)
  })

  test("should report a file that is not a session and keep the content", async ({ page }, testInfo) => {
    await writeHello(page)
    const written = await symbolIds(page)
    const file = testInfo.outputPath("symbols.json")
    await writeFile(file, "[]")

    await page.locator("#input-open").setInputFiles(file)

    await expect(page.locator("#session-status")).toHaveText("Not an iinkTS session file")
    expect(await symbolIds(page)).toEqual(written)
  })

  test("should list the session saved before a reload, and restore it", async ({ page }) => {
    await shortenSnapshotDelay(page)
    await writeHello(page)
    const written = await symbolIds(page)
    await waitForSnapshot(page)
    await expect.poll(() => storedEntries(page)).toEqual([1])

    await page.reload()
    await expect.poll(() => page.evaluate(() => !!rootEl.iink?.client?.partId), { timeout: 30000 }).toBe(true)
    expect(await symbolIds(page)).toEqual([])
    await expect(page.locator("#saved-sessions .saved-session")).toHaveCount(1)

    await page.locator("#saved-sessions .btn-restore").click()

    await expect(page.locator("#session-status")).toHaveText("Restored, recognition resumed as it was")
    expect(await symbolIds(page)).toEqual(written)
    expect(await jiixLabel(page)).toEqual(helloOneStroke.exports[JIIX].label)
    await expect(page.locator("#saved-panel")).toBeHidden()
  })

  test("should save nothing in the browser from a second tab on the same document", async ({ page, context }) => {
    await writeHello(page)

    const second = await context.newPage()
    await second.goto(PAGE)

    await expect(second.locator("#session-status")).toHaveText("Not saved in this browser: locked", { timeout: 30000 })
    await second.close()
  })
})

/**
 * The server drops a session after about an hour without activity. Here the recognition websocket
 * goes through `page.routeWebSocket`, a proxy to the real server: once `server.lost` is set, it
 * answers the client's `restoreSession` as the server does for an expired session, without
 * passing it on. Everything else, the package import included, reaches the real server.
 */
test.describe("Interactive ink canvas session resumed once the server lost it", () => {
  const routes = []
  const server = { down: false, lost: false }
  const sent = []

  test.beforeEach(async ({ page }) => {
    routes.length = 0
    sent.length = 0
    Object.assign(server, { down: false, lost: false })
    await page.routeWebSocket(/\/api\/v4\.0\/iink\/offscreen/, (ws) => {
      if (server.down) {
        ws.close({ code: 1006, reason: "network down" })
        return
      }
      const backend = ws.connectToServer()
      ws.onMessage((message) => {
        const { type } = JSON.parse(message)
        sent.push(type)
        if (server.lost && type === "restoreSession") {
          ws.send(JSON.stringify({ type: "error", code: "restore.session.not.found", message: "No session found" }))
          ws.close({ code: 1000 })
          return
        }
        backend.send(message)
      })
      backend.onMessage((message) => ws.send(message))
      routes.push({ ws, backend })
    })
    await page.goto(PAGE)
    await passModalKey(page)
  })

  test("should start a new session from the last snapshot and send what changed since", async ({ page }) => {
    await shortenSnapshotDelay(page)
    await writeHello(page)
    const [hello] = await getCanvasSymbols(page)
    await waitForSnapshot(page)

    // The connection drops; meanwhile the server forgets the session
    const { ws, backend } = routes.at(-1)
    server.down = true
    await ws.close({ code: 1006, reason: "network drop" })
    await backend.close()
    await expect.poll(() => page.evaluate(() => rootEl.iink.isOffline)).toBe(true)
    server.lost = true

    // Changes made offline: a stroke written, the one in the snapshot removed
    await writeStrokes(page, madrid.strokes)
    await page.evaluate((id) => rootEl.iink.removeSymbol(id), hello.id)

    server.down = false
    await expect.poll(() => page.evaluate(() => rootEl.iink.isOffline), { timeout: 30000 }).toBe(false)
    const jiix = await callCanvasExport(page, JIIX)

    expect(sent).toContain("importPackage")
    expect(jiix.elements).toHaveLength(1)
    expect(jiix.elements[0].label).toEqual(madrid.exports[JIIX].label)
    // Resumed, not an error
    await expect(page.locator(".ms-modal")).toHaveCount(0)
  })
})
