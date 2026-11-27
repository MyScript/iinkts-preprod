import { getAvailableFontList } from "@/iink"

import { WebSocketSSRClientTextConfiguration } from "../__dataset__/configuration.dataset"

describe("font.ts", () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ result: [] }),
    })
  ) as jest.Mock

  test("should call fetch with good url", async () => {
    await getAvailableFontList(WebSocketSSRClientTextConfiguration)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      `${WebSocketSSRClientTextConfiguration?.server?.scheme}://${WebSocketSSRClientTextConfiguration?.server?.host}/api/v4.0/iink/font/google/language/${WebSocketSSRClientTextConfiguration?.recognition?.lang}`
    )
  })

  test("should reject getAvailableFontList if no configuration", async () => {
    // @ts-ignore
    await expect(getAvailableFontList()).rejects.toThrow(
      "Failed to get fonts: configuration.server.scheme & configuration.server.host are required!"
    )
  })

  test("should reject getAvailableFontList if configuration.server is empty", async () => {
    const conf = JSON.parse(JSON.stringify(WebSocketSSRClientTextConfiguration))
    delete conf?.server
    await expect(getAvailableFontList(conf)).rejects.toThrow(
      "Failed to get fonts: configuration.server.scheme & configuration.server.host are required!"
    )
  })

  test("should reject getAvailableFontList if configuration.server.scheme is empty", async () => {
    const conf = JSON.parse(JSON.stringify(WebSocketSSRClientTextConfiguration))
    delete conf?.server?.scheme
    await expect(getAvailableFontList(conf)).rejects.toThrow(
      "Failed to get fonts: configuration.server.scheme & configuration.server.host are required!"
    )
  })

  test("should reject getAvailableFontList if configuration.server.host empty", async () => {
    const conf = JSON.parse(JSON.stringify(WebSocketSSRClientTextConfiguration))
    delete conf?.server?.host
    await expect(getAvailableFontList(conf)).rejects.toThrow(
      "Failed to get fonts: configuration.server.scheme & configuration.server.host are required!"
    )
  })

  test("should reject getAvailableFontList if configuration.recognition.lang empty", async () => {
    const conf = JSON.parse(JSON.stringify(WebSocketSSRClientTextConfiguration))
    delete conf?.recognition?.lang
    await expect(getAvailableFontList(conf)).rejects.toThrow(
      "Failed to get fonts: configuration.recognition.lang is required!"
    )
  })

  test("should reject when the server answers with an error status", async () => {
    const fetchMock = global.fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, status: 500, statusText: "Internal Server Error", json: jest.fn() })
    ) as jest.Mock
    await expect(getAvailableFontList(WebSocketSSRClientTextConfiguration)).rejects.toThrow("500 Internal Server Error")
    global.fetch = fetchMock
  })
})
