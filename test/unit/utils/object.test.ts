import { mergeDeep, mergeExports, redactServerSecrets, uniqueById } from "@/iink"

describe("merge", () => {
  const testDatas = [
    {
      source: {
        scheme: "https",
        host: "cloud.myscript.com",
        applicationKey: "XXXX-XXXX-XXXX",
        hmacKey: "YYYY-YYYY-YYYY",
        recognition: {
          text: {
            mimeTypes: ["application/vnd.myscript.jiix"],
          },
          math: {
            mimeTypes: ["application/vnd.myscript.jiix"],
            solver: {
              enable: false,
            },
          },
          diagram: {
            mimeTypes: ["application/vnd.myscript.jiix"],
          },
        },
      },
      target: {
        scheme: "http",
        host: "cloud.preprod.myscript.com",
        applicationKey: "AAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA",
        hmacKey: "BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB",
        recognition: {
          math: {
            mimeTypes: ["application/x-latex"],
            solver: {
              enable: true,
            },
          },
          diagram: {
            mimeTypes: [
              "application/vnd.myscript.jiix",
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              "image/svg+xml",
            ],
          },
        },
      },
      expected: {
        scheme: "http",
        host: "cloud.preprod.myscript.com",
        applicationKey: "AAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA",
        hmacKey: "BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB",
        recognition: {
          text: {
            mimeTypes: ["application/vnd.myscript.jiix"],
          },
          math: {
            mimeTypes: ["application/vnd.myscript.jiix", "application/x-latex"],
            solver: {
              enable: true,
            },
          },
          diagram: {
            mimeTypes: [
              "application/vnd.myscript.jiix",
              "application/vnd.myscript.jiix",
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              "image/svg+xml",
            ],
          },
        },
      },
    },
  ]
  testDatas.forEach((d) => {
    test(`shoud mergeDeep ${JSON.stringify(d.source)} with ${JSON.stringify(d.target)} to ${JSON.stringify(d.expected)}`, () => {
      expect(mergeDeep(d.source, d.target)).toEqual(d.expected)
    })
  })
})

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

describe("uniqueById", () => {
  test("should drop later duplicates, keeping the first occurrence", () => {
    const items = [
      { id: "a", value: 1 },
      { id: "b", value: 2 },
      { id: "a", value: 3 },
      { id: "c", value: 4 },
      { id: "b", value: 5 },
    ]
    expect(uniqueById(items)).toEqual([
      { id: "a", value: 1 },
      { id: "b", value: 2 },
      { id: "c", value: 4 },
    ])
  })

  test("should return an equivalent array when there are no duplicates", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }]
    expect(uniqueById(items)).toEqual(items)
  })

  test("should handle an empty array", () => {
    expect(uniqueById([])).toEqual([])
  })
})

describe("mergeExports", () => {
  type TExportLike = { "text/plain"?: string; "application/x-latex"?: string }

  test("should adopt the incoming payload as-is when there is nothing to merge into", () => {
    const incoming: TExportLike = { "text/plain": "hello" }
    expect(mergeExports<TExportLike>(undefined, incoming)).toBe(incoming)
  })

  test("should merge new keys into the current payload, mutating and returning it", () => {
    const current: TExportLike = { "text/plain": "hello" }
    const incoming: TExportLike = { "application/x-latex": "\\hello" }
    const result = mergeExports(current, incoming)
    expect(result).toBe(current)
    expect(result).toEqual({ "text/plain": "hello", "application/x-latex": "\\hello" })
  })

  test("should let the incoming payload overwrite overlapping keys", () => {
    const current: TExportLike = { "text/plain": "hello" }
    const incoming: TExportLike = { "text/plain": "world" }
    expect(mergeExports(current, incoming)).toEqual({ "text/plain": "world" })
  })
})
