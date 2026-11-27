/**
 * @group DOM
 * @summary Text content of a blob or file, read as UTF-8
 * @remarks Through `FileReader` rather than `Blob.text()`, which some environments lack
 */
export function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Unable to read the file"))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsText(blob)
  })
}

/**
 * @group DOM
 * @summary Content of a blob or file, as a base64 `data:` URL
 */
export function readBlobAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Unable to read the file"))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(blob)
  })
}

/**
 * @group DOM
 * @summary Natural size of a picture, once the browser has decoded it
 */
export function readImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve({ width: image.naturalWidth, height: image.naturalHeight }))
    image.addEventListener("error", () => reject(new Error("Unable to decode the image")))
    image.src = src
  })
}
