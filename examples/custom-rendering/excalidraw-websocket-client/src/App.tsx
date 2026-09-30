import { useCallback, useEffect, useRef, useState } from "react"
import { Excalidraw, convertToExcalidrawElements } from "@excalidraw/excalidraw"
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types"
import { WebSocketClient, TPartialDeep, TServerWebsocketConfiguration } from "iink-ts"

import { createRecognizer } from "./Recognizer"
import { Synchronizer } from "./Synchronizer"
import { GestureManager } from "./GestureManager"
import { convert } from "./Converter"
import { isFreeDraw } from "./FreeDrawStroke"
import { updateScene } from "./Scene"
import { Loading } from "./components/Loading"
import { Modal } from "./components/Modal"
import { KeyForms } from "./components/KeyForms"

declare global
{
  interface Window
  {
    /** Exposed for the end-to-end tests: Excalidraw draws on a canvas, the scene is not in the DOM */
    excalidrawAPI?: ExcalidrawImperativeAPI
  }
}

type TServer = TPartialDeep<TServerWebsocketConfiguration>

const readStoredServer = (): TServer | undefined =>
{
  const stored = window.localStorage.getItem("server")
  if (!stored) return
  const server: TServer = JSON.parse(stored)
  return server
}

// Opens on the pen: the example is about handwriting
const INITIAL_DATA: ExcalidrawInitialDataState = {
  appState: { activeTool: { type: "freedraw", customType: null, lastActiveTool: null, locked: false } }
}

const toMessage = (error: unknown): string => error instanceof Error ? error.message : String(error)

export default function App()
{
  const [serverConfiguration, setServerConfiguration] = useState<TServer | undefined>(readStoredServer)
  const [api, setApi] = useState<ExcalidrawImperativeAPI>()
  const [recognizer, setRecognizer] = useState<WebSocketClient>()
  const [synchronizer, setSynchronizer] = useState<Synchronizer>()
  const [errors, setErrors] = useState<string[]>([])
  const gestureManagerRef = useRef<GestureManager>()

  const addError = useCallback((error: unknown) => setErrors(previous => [...previous, toMessage(error)]), [])

  useEffect(() =>
  {
    if (!serverConfiguration) return
    let cancelled = false
    let client: WebSocketClient | undefined
    createRecognizer(serverConfiguration)
      .then(c =>
      {
        client = c
        if (cancelled) {
          c.destroy()
          return
        }
        // Registered once per client: listeners live until the client is destroyed
        c.event.addGestureDetectedListener(gesture => gestureManagerRef.current?.apply(gesture))
        c.event.addErrorListener(addError)
        setRecognizer(c)
      })
      .catch(addError)
    return () =>
    {
      cancelled = true
      client?.destroy()
      setRecognizer(undefined)
    }
  }, [serverConfiguration, addError])

  useEffect(() =>
  {
    if (!api || !recognizer) return
    const sync = new Synchronizer(recognizer)
    sync.onError = addError
    const unsubscribe = api.onChange((elements, appState) => sync.onChange(elements, appState))
    setSynchronizer(sync)
    return () =>
    {
      unsubscribe()
      sync.destroy()
      setSynchronizer(undefined)
    }
  }, [api, recognizer, addError])

  const onExcalidrawMounted = useCallback((excalidrawAPI: ExcalidrawImperativeAPI) =>
  {
    window.excalidrawAPI = excalidrawAPI
    gestureManagerRef.current = new GestureManager(excalidrawAPI)
    setApi(excalidrawAPI)
  }, [])

  /**
   * Converts the selected strokes, or every stroke when nothing drawn is selected
   */
  const convertStrokes = useCallback(async () =>
  {
    if (!api || !recognizer || !synchronizer) return
    try {
      await synchronizer.settle()
      const exports = await recognizer.export(["application/vnd.myscript.jiix"])
      const jiix = exports["application/vnd.myscript.jiix"]
      if (!jiix) return
      const strokes = api.getSceneElements().filter(isFreeDraw)
      const selectedIds = api.getAppState().selectedElementIds
      const selected = strokes.filter(s => selectedIds[s.id])
      const { skeletons, convertedStrokeIds } = convert(jiix, selected.length ? selected : strokes)
      updateScene(api, { erase: convertedStrokeIds, add: convertToExcalidrawElements(skeletons) })
    } catch (error) {
      addError(error)
    }
  }, [api, recognizer, synchronizer, addError])

  if (!serverConfiguration) {
    return <KeyForms onSubmit={(keys) =>
    {
      window.localStorage.setItem("server", JSON.stringify(keys))
      setServerConfiguration(keys)
    }} />
  }

  return (
    <div className="excalidraw-wrapper">
      {
        errors.map((e, i) => (
          <Modal
            key={i}
            type="error"
            title="Something went wrong"
            message={e}
            onClose={() => setErrors(previous => previous.filter((_, j) => j !== i))}
          />
        ))
      }
      <Loading loading={!synchronizer} />
      <Excalidraw
        excalidrawAPI={onExcalidrawMounted}
        initialData={INITIAL_DATA}
        renderTopRightUI={() => (
          <button className="convert-btn" data-testid="convert-button" disabled={!synchronizer} onClick={convertStrokes}>
            Convert
          </button>
        )}
      />
    </div>
  )
}
