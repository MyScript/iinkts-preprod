import { getAvailableLanguageList } from "@/iink"

import { WebSocketSSRClientTextConfiguration } from "../__dataset__/configuration.dataset"

describe("language.ts", () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ result: { fr: "fr_FR" } }),
    })
  ) as jest.Mock

  test("should call fetch with good url", async () => {
    await getAvailableLanguageList(WebSocketSSRClientTextConfiguration)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      `${WebSocketSSRClientTextConfiguration?.server?.scheme}://${WebSocketSSRClientTextConfiguration?.server?.host}/api/v4.0/iink/availableLanguageList`
    )
  })

  test("should reject getAvailableLanguageList if no configuration", async () => {
    // @ts-ignore
    await expect(getAvailableLanguageList()).rejects.toThrow(
      "Failed to get languages: configuration.server.scheme & configuration.server.host are required!"
    )
  })

  test("should reject getAvailableLanguageList if configuration.server is empty", async () => {
    const conf = JSON.parse(JSON.stringify(WebSocketSSRClientTextConfiguration))
    delete conf?.server
    await expect(getAvailableLanguageList(conf)).rejects.toThrow(
      "Failed to get languages: configuration.server.scheme & configuration.server.host are required!"
    )
  })

  test("should reject getAvailableLanguageList if configuration.server.scheme is empty", async () => {
    const conf = JSON.parse(JSON.stringify(WebSocketSSRClientTextConfiguration))
    delete conf?.server?.scheme
    await expect(getAvailableLanguageList(conf)).rejects.toThrow(
      "Failed to get languages: configuration.server.scheme & configuration.server.host are required!"
    )
  })

  test("should reject getAvailableLanguageList if configuration.server.host empty", async () => {
    const conf = JSON.parse(JSON.stringify(WebSocketSSRClientTextConfiguration))
    delete conf?.server?.host
    await expect(getAvailableLanguageList(conf)).rejects.toThrow(
      "Failed to get languages: configuration.server.scheme & configuration.server.host are required!"
    )
  })

  test("should reject when the server answers with an error status", async () => {
    const fetchMock = global.fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, status: 500, statusText: "Internal Server Error", json: jest.fn() })
    ) as jest.Mock
    await expect(getAvailableLanguageList(WebSocketSSRClientTextConfiguration)).rejects.toThrow(
      "500 Internal Server Error"
    )
    global.fetch = fetchMock
  })
})
