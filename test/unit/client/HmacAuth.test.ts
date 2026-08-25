import { resolveHmac } from "@/client/HmacAuth"
import { computeHmac, TServerHTTPConfiguration } from "@/iink"

describe("HmacAuth.ts", () => {
  const baseServer: TServerHTTPConfiguration = {
    scheme: "https",
    host: "cloud.myscript.com",
    applicationKey: "app-key",
    hmacKey: "",
  }

  test("should return undefined when no hmacKey is configured", async () => {
    const result = await resolveHmac({ ...baseServer, hmacKey: "" },"data")
    expect(result).toBeUndefined()
  })

  test("should compute the hmac from a string hmacKey", async () => {
    const server = { ...baseServer, hmacKey: "secret-key" }
    const data = "data"
    const expected = await computeHmac(data, server.applicationKey, server.hmacKey as string)
    const result = await resolveHmac(server, data)
    expect(result).toEqual(expected)
  })

  test("should compute the hmac from an async hmacKey resolver function", async () => {
    const server = { ...baseServer, hmacKey: async (appKey: string) => `resolved-${appKey}` }
    const data = "data"
    const expected = await computeHmac(data, server.applicationKey, "resolved-app-key")
    const result = await resolveHmac(server, data)
    expect(result).toEqual(expected)
  })

  test("should throw when hmacKey is neither a string nor a function", async () => {
    const server = { ...baseServer, hmacKey: 42 } as unknown as TServerHTTPConfiguration
    await expect(resolveHmac(server, "data")).rejects.toThrow("HMAC key is not a string nor a function")
  })
})
