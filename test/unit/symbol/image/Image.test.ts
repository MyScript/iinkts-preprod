import { describe, expect, test } from "@jest/globals"

import { isImage, SymbolType } from "@/iink"

import { buildIIImage, buildIIStroke } from "../../helpers"

describe("Image.ts", () => {
  test("isImage accepts an image", () => {
    expect(isImage(buildIIImage())).toBe(true)
  })

  test("isImage rejects another symbol", () => {
    expect(isImage(buildIIStroke())).toBe(false)
  })

  test("SymbolType has an image member", () => {
    expect(SymbolType.Image).toBe("image")
  })
})
