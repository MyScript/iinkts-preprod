import { buildIIStroke } from "../../helpers"
import {
  DefaultInteractiveInkCanvasConfiguration,
  InteractiveInkCanvas,
  readBlobAsText,
  registerBuiltinSymbolUtils,
  serializeSession,
  TInteractiveInkCanvasOptions,
  TSessionEnvelope,
  TStroke,
} from "@/iink"

describe("IISessionManager.ts", () => {
  beforeAll(() => registerBuiltinSymbolUtils())

  const buildCanvas = (serverVersion = "4.6.0"): InteractiveInkCanvas => {
    const options: TInteractiveInkCanvasOptions = {
      configuration: JSON.parse(JSON.stringify(DefaultInteractiveInkCanvasConfiguration)),
    }
    options.configuration!.server!.version = serverVersion
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
})
