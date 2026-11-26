import { IDBFactory } from "fake-indexeddb"

import { SessionLock, SessionStorage } from "@/iink"

describe("SessionLock.ts", () => {
  /** In-memory Web Locks: a name is held until the callback's promise settles */
  const fakeLocks = (): LockManager => {
    const held = new Set<string>()
    return {
      request: (async (name: string, options: LockOptions, callback: (lock: Lock | null) => Promise<void>) => {
        if (held.has(name) && options.ifAvailable) {
          return callback(null)
        }
        held.add(name)
        try {
          return await callback({ name, mode: "exclusive" })
        } finally {
          held.delete(name)
        }
      }) as LockManager["request"],
      query: jest.fn(),
    }
  }

  describe("with Web Locks", () => {
    test("should hold a document for one canvas at a time", async () => {
      const locks = fakeLocks()
      const storage = new SessionStorage(new IDBFactory())
      const first = new SessionLock(storage, locks)
      const second = new SessionLock(storage, locks)

      expect(await first.acquire("k", "first")).toBe(true)
      expect(await second.acquire("k", "second")).toBe(false)
      expect(await second.acquire("other", "second")).toBe(true)
    })

    test("should let another canvas take the document once released", async () => {
      const locks = fakeLocks()
      const storage = new SessionStorage(new IDBFactory())
      const first = new SessionLock(storage, locks)
      await first.acquire("k", "first")

      first.release()
      await Promise.resolve()

      expect(await new SessionLock(storage, locks).acquire("k", "second")).toBe(true)
    })
  })

  describe("with a lease, without Web Locks", () => {
    const MINUTE = 60 * 1000
    let storage: SessionStorage
    beforeEach(() => {
      jest.useFakeTimers()
      storage = new SessionStorage(new IDBFactory())
    })
    afterEach(() => {
      jest.useRealTimers()
      storage.close()
    })

    test("should hold a document for one canvas at a time", async () => {
      const first = new SessionLock(storage, undefined)

      expect(await first.acquire("k", "first")).toBe(true)
      expect(await new SessionLock(storage, undefined).acquire("k", "second")).toBe(false)
      first.release()
    })

    test("should keep the lease while the canvas lives", async () => {
      const first = new SessionLock(storage, undefined)
      await first.acquire("k", "first")

      await jest.advanceTimersByTimeAsync(10 * MINUTE)

      expect(await new SessionLock(storage, undefined).acquire("k", "second")).toBe(false)
      first.release()
    })

    test("should let another canvas take a lease no one renewed", async () => {
      await storage.acquireLease({ key: "k", owner: "gone", now: Date.now(), duration: 2 * MINUTE })

      await jest.advanceTimersByTimeAsync(2 * MINUTE + 1)

      expect(await new SessionLock(storage, undefined).acquire("k", "second")).toBe(true)
    })

    test("should let another canvas take the document once released", async () => {
      const first = new SessionLock(storage, undefined)
      await first.acquire("k", "first")

      first.release()
      await jest.advanceTimersByTimeAsync(0)

      expect(await new SessionLock(storage, undefined).acquire("k", "second")).toBe(true)
    })

    test("should take back the lease the previous page of the same tab left on reload", async () => {
      const noop = () => undefined
      // The page reloads without releasing: the lease stays unexpired
      await new SessionLock(storage, undefined, noop, { tab: "tab-1", page: "before" }).acquire("k", "a")

      const otherTab = new SessionLock(storage, undefined, noop, { tab: "tab-2", page: "elsewhere" })
      expect(await otherTab.acquire("k", "b")).toBe(false)
      const reloaded = new SessionLock(storage, undefined, noop, { tab: "tab-1", page: "after" })
      expect(await reloaded.acquire("k", "c")).toBe(true)
    })

    test("should keep the lease from another canvas of the same page", async () => {
      const noop = () => undefined
      const first = new SessionLock(storage, undefined, noop, { tab: "tab-1", page: "p" })
      await first.acquire("k", "first")

      const second = new SessionLock(storage, undefined, noop, { tab: "tab-1", page: "p" })
      expect(await second.acquire("k", "second")).toBe(false)
      first.release()
    })

    test("should release the lease when the page goes away", async () => {
      await new SessionLock(storage, undefined).acquire("k", "first")

      window.dispatchEvent(new Event("pagehide"))
      await jest.advanceTimersByTimeAsync(0)

      expect(await new SessionLock(storage, undefined).acquire("k", "second")).toBe(true)
    })

    test("should tell when the lease was taken over while the page slept", async () => {
      const onLost = jest.fn()
      const first = new SessionLock(storage, undefined, onLost)
      await first.acquire("k", "first")
      await storage.acquireLease({ key: "k", owner: "thief", now: Date.now() + 3 * MINUTE, duration: 2 * MINUTE })

      await jest.advanceTimersByTimeAsync(MINUTE)

      expect(onLost).toHaveBeenCalled()
    })
  })
})
