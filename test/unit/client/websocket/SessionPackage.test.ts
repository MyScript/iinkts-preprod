import { supportsSessionPackage } from "@/iink"

describe("SessionPackage", () => {
  describe("supportsSessionPackage", () => {
    test("should be supported from server 4.6.0", () => {
      expect(supportsSessionPackage("4.6.0")).toBe(true)
      expect(supportsSessionPackage("5.0.1")).toBe(true)
    })

    test("should not be supported before server 4.6.0", () => {
      expect(supportsSessionPackage("4.5.4")).toBe(false)
    })

    test("should not be supported by an unknown server version", () => {
      expect(supportsSessionPackage(undefined)).toBe(false)
    })
  })
})
