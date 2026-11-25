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
