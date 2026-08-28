import { redactServerSecrets } from "@/iink"

describe("redactServerSecrets", () => {
  test("should redact hmacKey and applicationKey", () => {
    const config = {
      server: {
        host: "cloud.myscript.com",
        applicationKey: "XXXX-XXXX-XXXX",
        hmacKey: "YYYY-YYYY-YYYY",
      },
    }
    expect(redactServerSecrets(config)).toEqual({
      server: {
        host: "cloud.myscript.com",
        applicationKey: "[REDACTED]",
        hmacKey: "[REDACTED]",
      },
    })
  })

  test("should redact a function hmacKey the same way as a string one", () => {
    const config = {
      server: {
        host: "cloud.myscript.com",
        applicationKey: "XXXX-XXXX-XXXX",
        hmacKey: () => Promise.resolve("computed"),
      },
    }
    expect(redactServerSecrets(config)).toEqual({
      server: {
        host: "cloud.myscript.com",
        applicationKey: "[REDACTED]",
        hmacKey: "[REDACTED]",
      },
    })
  })

  test("should not touch the original config object", () => {
    const config = { server: { hmacKey: "YYYY-YYYY-YYYY" } }
    redactServerSecrets(config)
    expect(config.server.hmacKey).toEqual("YYYY-YYYY-YYYY")
  })

  test("should leave non-object input untouched", () => {
    expect(redactServerSecrets(undefined)).toEqual(undefined)
    expect(redactServerSecrets({})).toEqual({})
  })
})
