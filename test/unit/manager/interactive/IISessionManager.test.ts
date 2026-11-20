import { IDBFactory } from "fake-indexeddb"
import { buildIIStroke } from "../../helpers"
import {
  DefaultInteractiveInkCanvasConfiguration,
  InteractiveInkCanvas,
  readBlobAsText,
  registerBuiltinSymbolUtils,
  serializeSession,
  SessionStorage,
  TSavedSessionInfo,
  TInteractiveInkCanvasOptions,
  TSessionEnvelope,
  TSessionRecovery,
  TStroke,
  WebSocketClient,
} from "@/iink"

describe("IISessionManager.ts", () => {
  beforeAll(() => registerBuiltinSymbolUtils())

  const buildCanvas = (serverVersion = "4.6.0", snapshotDelay?: number): InteractiveInkCanvas => {
    const options: TInteractiveInkCanvasOptions = {
      configuration: JSON.parse(JSON.stringify(DefaultInteractiveInkCanvasConfiguration)),
    }
    options.configuration!.server!.version = serverVersion
    if (snapshotDelay !== undefined) {
      options.configuration!.persistence = { snapshotDelay }
    }
    const canvas = new InteractiveInkCanvas(document.createElement("div"), options)
    canvas.client.exportPackage = jest.fn(() => Promise.resolve(new Uint8Array([1, 2, 3])))
    canvas.client.importPackage = jest.fn(() => Promise.resolve())
    canvas.client.newSession = jest.fn(() => Promise.resolve())
    canvas.client.addStrokes = jest.fn(() => Promise.resolve())
    jest.spyOn(canvas.client, "partId", "get").mockReturnValue("part-7")
    return canvas
  }
  const asData = (value: unknown) => JSON.parse(JSON.stringify(value))
  const envelopeOf = (symbols: TStroke[], withPackage = true): TSessionEnvelope => ({
    format: "iinkts-session",
    formatVersion: 1,
    libVersion: "5.1.0",
    createdAt: "2026-11-20T10:00:00.000Z",
    symbols,
    package: withPackage ? { partId: "part-7", data: "AQID" } : undefined,
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe("save", () => {
    test("should save the symbols with the server package of the part they are written in", async () => {
      const canvas = buildCanvas()
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)

      const envelope = await canvas.session.save()

      expect(asData(envelope)).toEqual({
        format: "iinkts-session",
        formatVersion: 1,
        libVersion: expect.any(String),
        createdAt: expect.any(String),
        symbols: asData([stroke]),
        package: { partId: "part-7", data: "AQID" },
      })
    })

    test("should save without package on a server older than 4.6.0", async () => {
      const canvas = buildCanvas("4.5.4")
      canvas.model.addSymbol(buildIIStroke())

      const envelope = await canvas.session.save()

      expect(envelope.package).toBeUndefined()
      expect(canvas.client.exportPackage).not.toHaveBeenCalled()
    })

    test("should save copies the canvas does not change afterwards", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())

      const envelope = await canvas.session.save()

      expect(envelope.symbols[0]).not.toBe(canvas.model.symbols[0])
    })
  })

  describe("restore", () => {
    test("should replace the canvas content with the saved symbols", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())
      const saved = buildIIStroke()

      await canvas.session.restore(envelopeOf([saved]))

      expect(canvas.model.symbols.map((s) => s.id)).toEqual([saved.id])
    })

    test("should empty the history", async () => {
      const canvas = buildCanvas()
      canvas.history.init(canvas.model)
      canvas.history.push({ added: [buildIIStroke()] })

      await canvas.session.restore(envelopeOf([buildIIStroke()]))

      expect(canvas.history.context.canUndo).toBe(false)
      expect(canvas.history.stack).toHaveLength(1)
    })

    test("should import the package into the part it was saved from, without sending the strokes again", async () => {
      const canvas = buildCanvas()

      await expect(canvas.session.restore(envelopeOf([buildIIStroke()]))).resolves.toEqual("imported")

      expect(canvas.client.importPackage).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]), "part-7")
      expect(canvas.client.newSession).not.toHaveBeenCalled()
      expect(canvas.client.addStrokes).not.toHaveBeenCalled()
    })

    test("should start a new session with the strokes when the package is refused", async () => {
      const canvas = buildCanvas()
      canvas.client.importPackage = jest.fn(() => Promise.reject(new Error("Invalid package")))
      const saved = buildIIStroke()

      await expect(canvas.session.restore(envelopeOf([saved]))).resolves.toEqual("replayed")

      expect(canvas.client.newSession).toHaveBeenCalled()
      expect(asData(jest.mocked(canvas.client.addStrokes).mock.calls[0][0])).toEqual(asData([saved]))
    })

    test("should start a new session with the strokes when the file has no package", async () => {
      const canvas = buildCanvas()

      await expect(canvas.session.restore(envelopeOf([buildIIStroke()], false))).resolves.toEqual("replayed")

      expect(canvas.client.importPackage).not.toHaveBeenCalled()
      expect(canvas.client.addStrokes).toHaveBeenCalled()
    })

    test("should not try the package on a server older than 4.6.0", async () => {
      const canvas = buildCanvas("4.5.4")

      await expect(canvas.session.restore(envelopeOf([buildIIStroke()]))).resolves.toEqual("replayed")

      expect(canvas.client.importPackage).not.toHaveBeenCalled()
    })

    test("should not send the solver outputs again", async () => {
      const canvas = buildCanvas()
      const ink = buildIIStroke()
      const solverOutput: TStroke = { ...buildIIStroke(), isSolverOutput: true }

      await canvas.session.restore(envelopeOf([ink, solverOutput], false))

      expect(jest.mocked(canvas.client.addStrokes).mock.calls[0][0].map((s) => s.id)).toEqual([ink.id])
    })

    test("should keep the canvas read-only while restoring, then give it back", async () => {
      const canvas = buildCanvas()
      let readOnlyDuringImport: boolean | undefined
      canvas.client.importPackage = jest.fn(async () => {
        readOnlyDuringImport = canvas.readOnly
      })

      await canvas.session.restore(envelopeOf([buildIIStroke()]))

      expect(readOnlyDuringImport).toBe(true)
      expect(canvas.readOnly).toBe(false)
    })

    test("should read a .iinkts file", async () => {
      const canvas = buildCanvas()
      const saved = buildIIStroke()

      await canvas.session.restore(new Blob([serializeSession(envelopeOf([saved]))]))

      expect(canvas.model.symbols.map((s) => s.id)).toEqual([saved.id])
    })

    test("should reject a file that is not a session, leaving the content as it was", async () => {
      const canvas = buildCanvas()
      const kept = buildIIStroke()
      canvas.model.addSymbol(kept)

      await expect(canvas.session.restore(new Blob(["[]"]))).rejects.toThrow("Not an iinkTS session file")

      expect(canvas.model.symbols.map((s) => s.id)).toEqual([kept.id])
    })
  })

  describe("session format", () => {
    test("should export the session as a .iinkts JSON file", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())

      const file = await canvas.exportAs("session")

      expect(file.type).toEqual("application/json")
      expect(JSON.parse(await readBlobAsText(file))).toEqual(expect.objectContaining({ format: "iinkts-session" }))
    })

    test("should download the session with the .iinkts extension", async () => {
      const canvas = buildCanvas()
      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      global.URL.createObjectURL = jest.fn(() => "blob:session")
      global.URL.revokeObjectURL = jest.fn()

      await canvas.download("session", { filename: "notes" })

      expect(link.download).toEqual("notes.iinkts")
    })
  })

  describe("automatic resume", () => {
    let recovery: TSessionRecovery
    const buildRecoverableCanvas = (serverVersion?: string, snapshotDelay?: number) => {
      const setRecovery = jest.spyOn(WebSocketClient.prototype, "setSessionRecovery")
      const canvas = buildCanvas(serverVersion, snapshotDelay)
      recovery = setRecovery.mock.calls.at(-1)![0]!
      return canvas
    }
    const change = (canvas: InteractiveInkCanvas) => canvas.event.emitChanged(canvas.history.context)
    const setPageHidden = (hidden: boolean) => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") })
      document.dispatchEvent(new Event("visibilitychange"))
    }
    const strokesSent = (canvas: InteractiveInkCanvas) => ({
      added: jest.mocked(canvas.client.addStrokes).mock.calls.flatMap(([strokes]) => strokes.map((s) => s.id)),
      erased: jest.mocked(canvas.client.eraseStrokes).mock.calls.flatMap(([ids]) => ids),
      replaced: jest.mocked(canvas.client.replaceStrokes).mock.calls.map(([ids, strokes]) => [ids, strokes.map((s) => s.id)]),
    })

    beforeEach(() => jest.useFakeTimers())
    afterEach(() => {
      jest.useRealTimers()
      setPageHidden(false)
    })

    describe("snapshot", () => {
      test("should save the session in memory 5 s after the last change", async () => {
        const canvas = buildRecoverableCanvas()
        canvas.model.addSymbol(buildIIStroke())

        change(canvas)
        await jest.advanceTimersByTimeAsync(4999)
        expect(canvas.client.exportPackage).not.toHaveBeenCalled()
        await jest.advanceTimersByTimeAsync(1)

        expect(canvas.client.exportPackage).toHaveBeenCalledTimes(1)
        expect(recovery.package()).toEqual({ data: new Uint8Array([1, 2, 3]), partId: "part-7" })
      })

      test("should wait for the changes to stop", async () => {
        const canvas = buildRecoverableCanvas()
        canvas.model.addSymbol(buildIIStroke())

        change(canvas)
        await jest.advanceTimersByTimeAsync(3000)
        change(canvas)
        await jest.advanceTimersByTimeAsync(3000)

        expect(canvas.client.exportPackage).not.toHaveBeenCalled()
      })

      test("should save at once when the page is hidden, only if something changed", async () => {
        const canvas = buildRecoverableCanvas()
        canvas.model.addSymbol(buildIIStroke())

        change(canvas)
        setPageHidden(true)
        await jest.advanceTimersByTimeAsync(0)
        setPageHidden(false)
        setPageHidden(true)
        await jest.advanceTimersByTimeAsync(10000)

        expect(canvas.client.exportPackage).toHaveBeenCalledTimes(1)
      })

      test("should not save while offline", async () => {
        const canvas = buildRecoverableCanvas()
        canvas.model.addSymbol(buildIIStroke())
        jest.spyOn(canvas.client, "isOffline", "get").mockReturnValue(true)

        change(canvas)
        await jest.advanceTimersByTimeAsync(5000)

        expect(canvas.client.exportPackage).not.toHaveBeenCalled()
      })

      test("should not save on a server older than 4.6.0", async () => {
        const canvas = buildRecoverableCanvas("4.5.4")
        canvas.model.addSymbol(buildIIStroke())

        change(canvas)
        await jest.advanceTimersByTimeAsync(5000)

        expect(canvas.client.exportPackage).not.toHaveBeenCalled()
      })

      test("should follow configuration.persistence.snapshotDelay, 0 never saving", async () => {
        const quick = buildRecoverableCanvas(undefined, 1000)
        quick.model.addSymbol(buildIIStroke())
        change(quick)
        await jest.advanceTimersByTimeAsync(1000)
        const never = buildRecoverableCanvas(undefined, 0)
        never.model.addSymbol(buildIIStroke())
        change(never)
        setPageHidden(true)
        await jest.advanceTimersByTimeAsync(60000)

        expect(quick.client.exportPackage).toHaveBeenCalledTimes(1)
        expect(never.client.exportPackage).not.toHaveBeenCalled()
      })

      test("should have no package to resume from before a first snapshot", () => {
        buildRecoverableCanvas()

        expect(recovery.package()).toBeUndefined()
      })
    })

    describe("recover", () => {
      const snapshotOf = async (canvas: InteractiveInkCanvas, strokes: TStroke[]) => {
        strokes.forEach((s) => canvas.model.addSymbol(s))
        change(canvas)
        await jest.advanceTimersByTimeAsync(5000)
        canvas.client.replaceStrokes = jest.fn(() => Promise.resolve())
        canvas.client.eraseStrokes = jest.fn(() => Promise.resolve())
        jest.mocked(canvas.client.addStrokes).mockClear()
      }

      test("should send only what changed since the package it resumed from", async () => {
        const canvas = buildRecoverableCanvas()
        const [kept, erased, moved] = [buildIIStroke(), buildIIStroke(), buildIIStroke()]
        await snapshotOf(canvas, [kept, erased, moved])
        const added = buildIIStroke()
        canvas.model.removeSymbol(erased.id)
        canvas.model.replaceSymbol(moved.id, [{ ...moved, modificationDate: moved.modificationDate + 1 }])
        canvas.model.addSymbol(added)

        await recovery.recover(true)

        expect(strokesSent(canvas)).toEqual({ added: [], erased: [], replaced: [[[erased.id, moved.id], [moved.id, added.id]]] })
      })

      test("should only add the strokes written since, when nothing else changed", async () => {
        const canvas = buildRecoverableCanvas()
        await snapshotOf(canvas, [buildIIStroke()])
        const added = buildIIStroke()
        canvas.model.addSymbol(added)

        await recovery.recover(true)

        expect(strokesSent(canvas)).toEqual({ added: [added.id], erased: [], replaced: [] })
      })

      test("should send every stroke but the solver outputs to a new empty session", async () => {
        const canvas = buildRecoverableCanvas()
        const ink = buildIIStroke()
        await snapshotOf(canvas, [ink, { ...buildIIStroke(), isSolverOutput: true }])

        await recovery.recover(false)

        expect(strokesSent(canvas)).toEqual({ added: [ink.id], erased: [], replaced: [] })
      })

      test("should end the recognition when there is nothing to send", async () => {
        const canvas = buildRecoverableCanvas()
        await snapshotOf(canvas, [buildIIStroke()])
        canvas.startOperation("Recognizing")

        await recovery.recover(true)

        expect(canvas.hasOperation("Recognizing")).toBe(false)
      })
    })

    test("should stop saving and hand no recovery to the client once destroyed", async () => {
      const setRecovery = jest.spyOn(WebSocketClient.prototype, "setSessionRecovery")
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())
      change(canvas)

      canvas.session.destroy()
      setPageHidden(true)
      await jest.advanceTimersByTimeAsync(10000)

      expect(canvas.client.exportPackage).not.toHaveBeenCalled()
      expect(setRecovery).toHaveBeenLastCalledWith(undefined)
    })

    test("should resume from the file a restore imported", async () => {
      const canvas = buildRecoverableCanvas()

      await canvas.session.restore(envelopeOf([buildIIStroke()]))

      expect(recovery.package()).toEqual({ data: new Uint8Array([1, 2, 3]), partId: "part-7" })
    })

    test("should save the new session a while after a restore replayed the strokes", async () => {
      const canvas = buildRecoverableCanvas()

      await canvas.session.restore(envelopeOf([buildIIStroke()], false))
      await jest.advanceTimersByTimeAsync(5000)

      expect(canvas.client.exportPackage).toHaveBeenCalledTimes(1)
    })

    test("should drop the snapshot of the previous content when a restore replays the strokes", async () => {
      const canvas = buildRecoverableCanvas()
      canvas.model.addSymbol(buildIIStroke())
      change(canvas)
      await jest.advanceTimersByTimeAsync(5000)

      await canvas.session.restore(envelopeOf([buildIIStroke()], false))

      expect(recovery.package()).toBeUndefined()
    })
  })

  describe("browser storage", () => {
    const KEY = "/notes#ink"
    const DAY = 24 * 60 * 60 * 1000
    let factory: IDBFactory
    let stored: SessionStorage

    const buildStoringCanvas = (persistence: Record<string, unknown> = {}, rootId?: string): InteractiveInkCanvas => {
      const canvas = buildCanvas()
      canvas.configuration.persistence = { ...canvas.configuration.persistence, key: KEY, ...persistence }
      if (rootId) {
        canvas.layers.root.id = rootId
      }
      return canvas
    }
    const change = (canvas: InteractiveInkCanvas) => canvas.event.emitChanged(canvas.history.context)
    const savedAt = async (id: string, symbols: TStroke[], options: { now?: number; key?: string; snapshot?: TSessionEnvelope } = {}) => {
      await stored.writeSymbols({ id, key: options.key ?? KEY, symbols: JSON.stringify(symbols), symbolCount: symbols.length, now: options.now ?? Date.now() })
      if (options.snapshot) {
        await stored.writeSnapshot({ id, key: options.key ?? KEY, snapshot: serializeSession(options.snapshot), now: options.now ?? Date.now() })
      }
    }

    beforeEach(() => {
      factory = new IDBFactory()
      Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: factory })
      stored = new SessionStorage(factory)
      jest.useFakeTimers({ now: 100 * DAY })
    })
    afterEach(() => {
      jest.useRealTimers()
      stored.close()
    })

    describe("start", () => {
      test("should tell the sessions an earlier page saved for this document", async () => {
        await savedAt("earlier", [buildIIStroke()])
        await savedAt("elsewhere", [buildIIStroke()], { key: "/other#ink" })
        const canvas = buildStoringCanvas()
        const available = jest.fn()
        canvas.event.addSavedSessionsAvailableListener(available)

        await canvas.session.start()

        const expected: TSavedSessionInfo[] = [expect.objectContaining({ id: "earlier", key: KEY, symbolCount: 1 })]
        expect(canvas.session.saved).toEqual(expected)
        expect(available).toHaveBeenCalledWith(expected)
      })

      test("should key the document with the page path and the canvas element id", async () => {
        await savedAt("earlier", [buildIIStroke()], { key: `${location.pathname}#editor` })
        const canvas = buildStoringCanvas({ key: undefined }, "editor")

        await canvas.session.start()

        expect(canvas.session.saved.map((s) => s.id)).toEqual(["earlier"])
      })

      test("should purge the sessions not written for more than 30 days", async () => {
        await savedAt("old", [buildIIStroke()], { now: 100 * DAY - 31 * DAY })
        const canvas = buildStoringCanvas()

        await canvas.session.start()

        expect(await stored.list(KEY)).toEqual([])
      })

      test("should store nothing, and tell why, when another canvas holds the document", async () => {
        const first = buildStoringCanvas()
        await first.session.start()
        const second = buildStoringCanvas()
        const unavailable = jest.fn()
        second.event.addSessionStorageUnavailableListener(unavailable)

        await second.session.start()
        second.model.addSymbol(buildIIStroke())
        change(second)
        await jest.advanceTimersByTimeAsync(1000)

        expect(unavailable).toHaveBeenCalledWith("locked")
        expect(await stored.list(KEY)).toEqual([])
      })

      test("should tell the browser has no storage", async () => {
        Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: undefined })
        const canvas = buildStoringCanvas()
        const unavailable = jest.fn()
        canvas.event.addSessionStorageUnavailableListener(unavailable)

        await canvas.session.start()

        expect(unavailable).toHaveBeenCalledWith("unsupported")
      })

      test("should store nothing when persistence.storage is off", async () => {
        await savedAt("earlier", [buildIIStroke()])
        const canvas = buildStoringCanvas({ storage: false })

        await canvas.session.start()
        canvas.model.addSymbol(buildIIStroke())
        change(canvas)
        await jest.advanceTimersByTimeAsync(1000)

        expect(canvas.session.saved).toEqual([])
        expect((await stored.list(KEY)).map((s) => s.id)).toEqual(["earlier"])
      })
    })

    describe("writing", () => {
      test("should write nothing before the first change", async () => {
        const canvas = buildStoringCanvas()

        await canvas.session.start()
        await jest.advanceTimersByTimeAsync(10000)

        expect(await stored.list(KEY)).toEqual([])
      })

      test("should write the symbols 500 ms after a change, next to the earlier sessions", async () => {
        await savedAt("earlier", [buildIIStroke()])
        const canvas = buildStoringCanvas()
        await canvas.session.start()
        canvas.model.addSymbol(buildIIStroke())
        canvas.model.addSymbol(buildIIStroke())

        change(canvas)
        await jest.advanceTimersByTimeAsync(499)
        expect(await stored.list(KEY)).toHaveLength(1)
        await jest.advanceTimersByTimeAsync(1)

        const entries = await stored.list(KEY)
        expect(entries.map((s) => s.symbolCount)).toEqual([2, 1])
      })

      test("should write the snapshot it takes, with the server package", async () => {
        const canvas = buildStoringCanvas()
        await canvas.session.start()
        canvas.model.addSymbol(buildIIStroke())

        change(canvas)
        await jest.advanceTimersByTimeAsync(5000)

        const [entry] = await stored.list(KEY)
        expect(JSON.parse((await stored.read(entry.id))!.snapshot!).package).toEqual({ partId: "part-7", data: "AQID" })
      })

      test("should write at once when the page is hidden", async () => {
        const canvas = buildStoringCanvas()
        await canvas.session.start()
        canvas.model.addSymbol(buildIIStroke())

        change(canvas)
        Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" })
        document.dispatchEvent(new Event("visibilitychange"))
        await jest.advanceTimersByTimeAsync(0)
        Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" })

        const [entry] = await stored.list(KEY)
        expect(JSON.parse((await stored.read(entry.id))!.symbols)).toHaveLength(1)
      })

      test("should delete its session once the canvas is empty", async () => {
        const canvas = buildStoringCanvas()
        await canvas.session.start()
        const stroke = buildIIStroke()
        canvas.model.addSymbol(stroke)
        change(canvas)
        await jest.advanceTimersByTimeAsync(500)

        canvas.model.removeSymbol(stroke.id)
        change(canvas)
        await jest.advanceTimersByTimeAsync(500)

        expect(await stored.list(KEY)).toEqual([])
      })
    })

    describe("restoreSaved / discard", () => {
      test("should restore a saved session: the package imported, then what changed since sent", async () => {
        const [inSnapshot, writtenAfter] = [buildIIStroke(), buildIIStroke()]
        const snapshot: TSessionEnvelope = { ...envelopeOf([inSnapshot]) }
        await savedAt("earlier", [inSnapshot, writtenAfter], { snapshot })
        const canvas = buildStoringCanvas()
        await canvas.session.start()

        await expect(canvas.session.restoreSaved("earlier")).resolves.toEqual("imported")

        expect(canvas.model.symbols.map((s) => s.id)).toEqual([inSnapshot.id, writtenAfter.id])
        expect(canvas.client.importPackage).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]), "part-7")
        expect(jest.mocked(canvas.client.addStrokes).mock.calls.flatMap(([s]) => s.map((x) => x.id))).toEqual([writtenAfter.id])
      })

      test("should take the restored session over: written on as this canvas's own", async () => {
        await savedAt("earlier", [buildIIStroke()])
        const canvas = buildStoringCanvas()
        await canvas.session.start()

        await canvas.session.restoreSaved("earlier")
        await jest.advanceTimersByTimeAsync(500)

        const entries = await stored.list(KEY)
        expect(entries.map((s) => s.id)).not.toContain("earlier")
        expect(entries).toHaveLength(1)
        expect(canvas.session.saved).toEqual([])
      })

      test("should reject an unknown saved session", async () => {
        const canvas = buildStoringCanvas()
        await canvas.session.start()

        await expect(canvas.session.restoreSaved("missing")).rejects.toThrow("No saved session missing")
      })

      test("should discard one saved session, or all of them", async () => {
        await savedAt("one", [buildIIStroke()])
        await savedAt("two", [buildIIStroke()])
        await savedAt("three", [buildIIStroke()])
        const canvas = buildStoringCanvas()
        await canvas.session.start()

        await canvas.session.discard("one")
        expect(canvas.session.saved.map((s) => s.id).sort()).toEqual(["three", "two"])
        await canvas.session.discard()

        expect(canvas.session.saved).toEqual([])
        expect(await stored.list(KEY)).toEqual([])
      })
    })
  })
})
