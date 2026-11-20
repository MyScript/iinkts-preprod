import { base64ToBytes, bytesToBase64 } from "@/iink"

describe("base64", () => {
  test("should encode bytes as base64", () => {
    expect(bytesToBase64(new Uint8Array([0, 1, 2, 253, 254, 255]))).toEqual("AAEC/f7/")
  })

  test("should decode base64 into bytes", () => {
    expect(Array.from(base64ToBytes("AAEC/f7/"))).toEqual([0, 1, 2, 253, 254, 255])
  })

  test("should encode bytes too many for one call of String.fromCharCode", () => {
    const bytes = new Uint8Array(300_000).map((_, i) => i % 256)

    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes)
  })

  test("should encode no byte as an empty string", () => {
    expect(bytesToBase64(new Uint8Array())).toEqual("")
  })
})
