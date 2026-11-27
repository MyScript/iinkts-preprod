import { ensureServerVersion, getApiInfos } from "@/iink"

import { WebSocketSSRClientTextConfiguration } from "../../__dataset__/configuration.dataset"

describe("getApiInfos", () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ result: { fr: "fr_FR" } }),
    })
  ) as jest.Mock

  test("should call fetch with good url", async () => {
    await getApiInfos(WebSocketSSRClientTextConfiguration)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      `${WebSocketSSRClientTextConfiguration?.server?.scheme}://${WebSocketSSRClientTextConfiguration?.server?.host}/api/v4.0/iink/version`
    )
  })

  const fallback = { version: "3.1.3", gitCommit: "unknown", nativeVersion: "<=3.1.1" }

  test("should answer the last version without the endpoint if no configuration", async () => {
    // @ts-ignore
    await expect(getApiInfos()).resolves.toEqual(fallback)
  })

  test.each(["server", "scheme", "host"])(
    "should answer the last version without the endpoint, without fetching, if %s is missing",
    async (key) => {
      const conf = JSON.parse(JSON.stringify(WebSocketSSRClientTextConfiguration))
      if (key === "server") {
        delete conf.server
      } else {
        delete conf.server[key]
      }
      const fetchSpy = jest.fn()
      global.fetch = fetchSpy
      await expect(getApiInfos(conf)).resolves.toEqual(fallback)
      expect(fetchSpy).not.toHaveBeenCalled()
    }
  )
})

describe("ensureServerVersion", () => {
  test("should keep a version already configured, without fetching", async () => {
    const fetchSpy = jest.fn()
    global.fetch = fetchSpy
    const configuration = { server: structuredClone(WebSocketSSRClientTextConfiguration.server) }
    configuration.server.version = "3.2.0"
    await expect(ensureServerVersion(configuration)).resolves.toEqual("3.2.0")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test("should fetch the version once and store it in the configuration", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ version: "3.4.0" }) })
    ) as jest.Mock
    const configuration = { server: structuredClone(WebSocketSSRClientTextConfiguration.server) }
    configuration.server.version = ""
    await expect(ensureServerVersion(configuration)).resolves.toEqual("3.4.0")
    expect(configuration.server.version).toEqual("3.4.0")
  })
})
