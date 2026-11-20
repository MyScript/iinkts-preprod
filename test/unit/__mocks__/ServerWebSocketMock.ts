import Server from "jest-websocket-mock"
import { DeserializedMessage } from "jest-websocket-mock/lib/websocket"
import { TWebSocketClientMessage, bytesToBase64 } from "@/iink"

export const HMACChallengeMessage = {
  type: "hmacChallenge",
  hmacChallenge: "1f434e8b-cc46-4a8c-be76-708eea2ff305",
}

export const authenticatedMessage = {
  type: "authenticated",
}

export const sessionDescriptionMessage = {
  type: "sessionDescription",
  contentPartCount: 0,
  iinkSessionId: "39311164-39fb-4ae1-be8f-fa955c89dbd7",
}

export const partChangeMessage = {
  type: "partChanged",
  partIdx: 0,
  partId: "yyrrutgk",
  partCount: 1,
}

export const newPartMessage = {
  type: "newPart",
  idx: 0,
  id: "yyrrutgk",
}

export const gestureDetectedMessage = {
  type: "gestureDetected",
  gestureType: "SCRATCH",
  gestureStrokeId: "stroke-289febca-93fd-4745-846b-414b57e4807e",
  strokeIds: ["stroke-c0fb2df7-11eb-4ec7-88b2-9df8403be4cd"],
  strokeBeforeIds: [],
  strokeAfterIds: [],
  subStrokes: [],
}

export const contextlessGestureMessage = {
  type: "contextlessGesture",
  gestureType: "scratch",
  strokeId: "stroke-cf218593-0be2-474b-b981-10b46bfe9d7d",
}

export const contentChangeMessage = {
  type: "contentChanged",
  partId: "mknnilfn",
  canUndo: null,
  canRedo: null,
  empty: null,
  undoStackIndex: 0,
  possibleUndoCount: 0,
}

export const hTextJIIX = {
  type: "Text",
  label: "hello",
  words: [
    {
      label: "H",
      candidates: ["h"],
    },
  ],
}

export const hExportedMessage = {
  type: "exported",
  partid: 0,
  exports: {
    "application/vnd.myscript.jiix": JSON.stringify(hTextJIIX),
  },
}

export const idleMessage = {
  type: "idle",
}

export const ackMessage = {
  type: "ack",
}

export const errorNotGrantedMessage = {
  type: "error",
  message: "Access not granted",
  code: "access.not.granted",
}

export const sessionNotFoundMessage = {
  type: "error",
  message: "Session not found",
  code: "restore.session.not.found",
}

export class ServerWebSocketMock extends Server {
  init({ withHMAC, withIdle, importError, sessionLost }: { withHMAC?: boolean; withIdle?: boolean; importError?: object; sessionLost?: boolean } = { withHMAC: true, withIdle: true }) {
    let importChunkIdx = 0
    this.on("connection", (socket) => {
      socket.on("message", (message: string | Blob | ArrayBuffer | ArrayBufferView) => {
        const parsedMessage: TWebSocketClientMessage = JSON.parse(message as string)
        switch (parsedMessage.type) {
          case "authenticate":
            if (withHMAC) {
              socket.send(JSON.stringify(HMACChallengeMessage))
            } else {
              socket.send(JSON.stringify(authenticatedMessage))
            }
            break
          case "hmac":
            socket.send(JSON.stringify(authenticatedMessage))
            break
          case "restoreSession":
            // An expired session: the server no longer has it
            socket.send(JSON.stringify(sessionLost ? sessionNotFoundMessage : sessionDescriptionMessage))
            break
          case "initSession":
            socket.send(JSON.stringify(sessionDescriptionMessage))
            break
          case "newContentPart":
          case "openContentPart":
            socket.send(JSON.stringify(partChangeMessage))
            break
          case "importPackage":
            importChunkIdx = 0
            break
          case "importPackageChunk":
            socket.send(JSON.stringify({ type: "importPackageChunkAck", importId: parsedMessage.importId, chunkIdx: importChunkIdx++ }))
            if (parsedMessage.lastChunk) {
              socket.send(JSON.stringify(importError ?? { ...sessionDescriptionMessage, iinkSessionId: "imported-session" }))
            }
            break
          case "waitForIdle":
            if (withIdle) {
              socket.send(JSON.stringify(idleMessage))
            }
            break
          default:
            break
        }
      })
    })
  }

  sendHMACChallenge() {
    this.send(JSON.stringify(HMACChallengeMessage))
  }

  sendAuthenticated() {
    this.send(JSON.stringify(authenticatedMessage))
  }

  sendSessionDescription() {
    this.send(JSON.stringify(sessionDescriptionMessage))
  }

  sendNewPartMessage() {
    this.send(JSON.stringify(newPartMessage))
  }

  sendPartChangeMessage() {
    this.send(JSON.stringify(partChangeMessage))
  }

  sendContentChangeMessage() {
    this.send(JSON.stringify(contentChangeMessage))
  }

  sendGestureDetectedMessage() {
    this.send(JSON.stringify(gestureDetectedMessage))
  }

  sendContextlessGestureMessage() {
    this.send(JSON.stringify(contextlessGestureMessage))
  }

  sendHExportMessage() {
    this.send(JSON.stringify(hExportedMessage))
  }

  sendNotGrantedErrorMessage() {
    this.send(JSON.stringify(errorNotGrantedMessage))
  }

  sendAckMessage() {
    this.send(JSON.stringify(ackMessage))
  }

  /** Answers an exportPackage: packageInfo, then the bytes base64 encoded in chunks of `chunkSize` */
  sendPackage(bytes: Uint8Array, { chunkSize = 3, exportId = "export-1", size = bytes.length } = {}) {
    const chunkCount = Math.max(1, Math.ceil(bytes.length / chunkSize))
    this.send(JSON.stringify({ type: "packageInfo", exportId, size, chunkCount }))
    for (let chunkIdx = 0; chunkIdx < chunkCount; chunkIdx++) {
      const data = bytesToBase64(bytes.subarray(chunkIdx * chunkSize, (chunkIdx + 1) * chunkSize))
      this.send(JSON.stringify({ type: "packageChunk", exportId, chunkIdx, data, lastChunk: chunkIdx === chunkCount - 1 }))
    }
  }

  getMessages(type: string): DeserializedMessage<object>[] {
    return this.messages.filter((m: DeserializedMessage<object>) => {
      const parseMessage = JSON.parse(m as string) as TWebSocketClientMessage
      return parseMessage.type === type
    })
  }

  getLastMessage(): DeserializedMessage<object> {
    return this.messages[this.messages.length - 1]
  }
}
