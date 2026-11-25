import { readBlobAsText } from "@/iink"

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
