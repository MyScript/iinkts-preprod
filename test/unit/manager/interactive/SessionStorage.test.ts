import { IDBFactory } from "fake-indexeddb"

import { SessionStorage } from "@/iink"

describe("SessionStorage.ts", () => {
  const DAY = 24 * 60 * 60 * 1000
  let storage: SessionStorage

  beforeEach(() => {
    storage = new SessionStorage(new IDBFactory())
  })
  afterEach(() => storage.close())

  test("should list the entries of a document, most recent first", async () => {
    await storage.writeSymbols({ id: "a", key: "/doc#ink", symbols: "[1]", symbolCount: 1, now: 1000 })
    await storage.writeSymbols({ id: "b", key: "/doc#ink", symbols: "[1,2]", symbolCount: 2, now: 2000 })
    await storage.writeSymbols({ id: "c", key: "/other#ink", symbols: "[]", symbolCount: 0, now: 3000 })

    expect(await storage.list("/doc#ink")).toEqual([
      { id: "b", key: "/doc#ink", createdAt: 2000, updatedAt: 2000, symbolCount: 2, size: 5 },
      { id: "a", key: "/doc#ink", createdAt: 1000, updatedAt: 1000, symbolCount: 1, size: 3 },
    ])
  })

  test("should keep the date an entry was created when it is written again", async () => {
    await storage.writeSymbols({ id: "a", key: "k", symbols: "[1]", symbolCount: 1, now: 1000 })
    await storage.writeSymbols({ id: "a", key: "k", symbols: "[1,2]", symbolCount: 2, now: 5000 })

    expect(await storage.list("k")).toEqual([
      { id: "a", key: "k", createdAt: 1000, updatedAt: 5000, symbolCount: 2, size: 5 },
    ])
  })

  test("should read back the symbols and the snapshot of an entry", async () => {
    await storage.writeSymbols({ id: "a", key: "k", symbols: "[1,2]", symbolCount: 2, now: 1000 })
    await storage.writeSnapshot({ id: "a", key: "k", snapshot: '{"package":1}', now: 2000 })

    expect(await storage.read("a")).toEqual({ symbols: "[1,2]", snapshot: '{"package":1}' })
    expect((await storage.list("k"))[0]).toEqual(expect.objectContaining({ updatedAt: 2000, size: 5 + 13 }))
  })

  test("should read an entry saved without snapshot", async () => {
    await storage.writeSymbols({ id: "a", key: "k", symbols: "[]", symbolCount: 0, now: 1000 })

    expect(await storage.read("a")).toEqual({ symbols: "[]", snapshot: undefined })
    expect(await storage.read("missing")).toBeUndefined()
  })

  test("should delete an entry with its symbols and snapshot", async () => {
    await storage.writeSymbols({ id: "a", key: "k", symbols: "[]", symbolCount: 0, now: 1000 })
    await storage.writeSnapshot({ id: "a", key: "k", snapshot: "{}", now: 1000 })

    await storage.delete("a")

    expect(await storage.list("k")).toEqual([])
    expect(await storage.read("a")).toBeUndefined()
  })

  test("should purge the entries not written for longer than the maximum age", async () => {
    await storage.writeSymbols({ id: "old", key: "k", symbols: "[]", symbolCount: 0, now: 0 })
    await storage.writeSymbols({ id: "recent", key: "k", symbols: "[]", symbolCount: 0, now: 20 * DAY })

    await storage.purge({ maxAge: 30 * DAY, maxSize: Infinity, now: 31 * DAY })

    expect((await storage.list("k")).map((e) => e.id)).toEqual(["recent"])
  })

  test("should purge the oldest entries, of every document, beyond the maximum total size", async () => {
    await storage.writeSymbols({ id: "oldest", key: "k1", symbols: "x".repeat(40), symbolCount: 1, now: 1000 })
    await storage.writeSymbols({ id: "middle", key: "k2", symbols: "x".repeat(40), symbolCount: 1, now: 2000 })
    await storage.writeSymbols({ id: "newest", key: "k1", symbols: "x".repeat(40), symbolCount: 1, now: 3000 })

    await storage.purge({ maxAge: Infinity, maxSize: 100, now: 4000 })

    expect((await storage.list("k1")).map((e) => e.id)).toEqual(["newest"])
    expect((await storage.list("k2")).map((e) => e.id)).toEqual(["middle"])
  })

  test("should never purge the entry being written", async () => {
    await storage.writeSymbols({ id: "current", key: "k", symbols: "x".repeat(200), symbolCount: 1, now: 0 })

    await storage.purge({ maxAge: 1, maxSize: 10, now: 100 * DAY, keep: "current" })

    expect((await storage.list("k")).map((e) => e.id)).toEqual(["current"])
  })
})
