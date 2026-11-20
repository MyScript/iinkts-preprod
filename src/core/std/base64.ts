// Bytes per String.fromCharCode call: spreading more arguments overflows the call stack
const CHAR_CODE_BATCH = 0x8000

/**
 * @group Core/Std
 * @summary Base64 of raw bytes
 */
export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = ""
  for (let i = 0; i < bytes.length; i += CHAR_CODE_BATCH) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHAR_CODE_BATCH))
  }
  return btoa(binary)
}

/**
 * @group Core/Std
 * @summary Raw bytes of a base64 string
 */
export const base64ToBytes = (base64: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
