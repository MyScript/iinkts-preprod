import
{
  RecognizerWebSocket,
  TRecognizerWebSocketConfiguration,
  TRecognizerWebSocketMessage,
  TPartialDeep,
  TServerWebsocketConfiguration,
  TRecognitionWebSocketConfiguration
} from 'iink-ts'

export class Recognizer extends RecognizerWebSocket
{
  static initializing = false
  static instance: Recognizer
  messages: { state: "Sent" | "Received", message: TRecognizerWebSocketMessage }[]
  private static readonly MAX_MESSAGES = 100

  constructor(config: TPartialDeep<TRecognizerWebSocketConfiguration>)
  {
    super(config)
    this.messages = []
  }

  protected messageCallback(message: MessageEvent<string>)
  {
    super.messageCallback(message)
    const websocketMessage: TRecognizerWebSocketMessage = JSON.parse(message.data)
    this.messages.push({ state: "Received", message: websocketMessage })
    if (this.messages.length > Recognizer.MAX_MESSAGES) {
      this.messages.shift()
    }
  }

  override send(message: TRecognizerWebSocketMessage): Promise<void>
  {
    this.messages.push({ state: "Sent", message })
    if (this.messages.length > Recognizer.MAX_MESSAGES) {
      this.messages.shift()
    }
    return super.send(message)
  }

  override destroy(): Promise<void>
  {
    Recognizer.initializing = false
    return super.destroy()
  }
}

export const useRecognizer = async (serverConfiguration: TPartialDeep<TServerWebsocketConfiguration>): Promise<Recognizer> =>
  {
  if (!Recognizer.initializing) {
    Recognizer.initializing = true
    const recognition: TPartialDeep<TRecognitionWebSocketConfiguration> = {
      "raw-content": {
        gestures: ["underline", "scratch-out", "join", "insert", "strike-through", "surround"]
      },
      gesture: {
        enable: true,
        ignoreGestureStrokes: false
      }
    }
    Recognizer.instance = new Recognizer({ server: serverConfiguration, recognition })
    await Recognizer.instance.init()
  }

  return Recognizer.instance
}
