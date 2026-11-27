import { readBlobAsDataURL, readBlobAsText, readImageSize } from "@/iink"

describe("readBlob", () => {
  test("should read a blob as UTF-8 text", async () => {
    await expect(readBlobAsText(new Blob(["héllo ✓"]))).resolves.toEqual("héllo ✓")
  })

  test("should reject when the blob can not be read", async () => {
    const failing = jest.spyOn(FileReader.prototype, "readAsText").mockImplementation(function (this: FileReader) {
      this.onerror?.(new ProgressEvent("error") as ProgressEvent<FileReader>)
    })

    await expect(readBlobAsText(new Blob(["x"]))).rejects.toThrow("Unable to read the file")
    failing.mockRestore()
  })
})

describe("readBlobAsDataURL", () => {
  test("should read a blob as a base64 data URL", async () => {
    await expect(readBlobAsDataURL(new Blob(["x"], { type: "image/png" }))).resolves.toEqual(
      "data:image/png;base64,eA=="
    )
  })

  test("should reject when the blob can not be read", async () => {
    const failing = jest.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function (this: FileReader) {
      this.onerror?.(new ProgressEvent("error") as ProgressEvent<FileReader>)
    })

    await expect(readBlobAsDataURL(new Blob(["x"]))).rejects.toThrow("Unable to read the file")
    failing.mockRestore()
  })
})

describe("readImageSize", () => {
  // jsdom never decodes a picture: the load and its natural size are simulated on the element
  const simulateImage = (outcome: "load" | "error", width = 0, height = 0) =>
    jest.spyOn(HTMLImageElement.prototype, "src", "set").mockImplementation(function (this: HTMLImageElement) {
      Object.defineProperty(this, "naturalWidth", { value: width })
      Object.defineProperty(this, "naturalHeight", { value: height })
      setTimeout(() => this.dispatchEvent(new Event(outcome)))
    })

  test("should give the natural size of the picture", async () => {
    const spy = simulateImage("load", 640, 480)
    await expect(readImageSize("data:image/png;base64,eA==")).resolves.toEqual({ width: 640, height: 480 })
    spy.mockRestore()
  })

  test("should reject a picture the browser can not decode", async () => {
    const spy = simulateImage("error")
    await expect(readImageSize("data:image/png;base64,eA==")).rejects.toThrow("Unable to decode the image")
    spy.mockRestore()
  })
})
