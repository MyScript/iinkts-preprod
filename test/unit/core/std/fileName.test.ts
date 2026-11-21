import { datedFileName, fileNameFromText } from "@/iink"

describe("fileName", () => {
  test("should keep the first words", () => {
    expect(fileNameFromText("Hello world from MyScript", 3)).toEqual("Hello world from")
  })

  test("should join the words of several lines with single spaces", () => {
    expect(fileNameFromText("Shopping\nlist   for\ttoday", 3)).toEqual("Shopping list for")
  })

  test("should drop the characters a file name can not hold", () => {
    expect(fileNameFromText('a/b: "c"', 3)).toEqual("a b c")
    expect(fileNameFromText("Q3 <draft>|*? notes", 3)).toEqual("Q3 draft notes")
  })

  test("should not start or end with a dot", () => {
    expect(fileNameFromText("...hidden notes.", 3)).toEqual("hidden notes")
  })

  test("should stay short", () => {
    expect(fileNameFromText("a".repeat(100), 3)).toEqual("a".repeat(60))
  })

  test("should give no name for a text without words", () => {
    expect(fileNameFromText("", 3)).toBeUndefined()
    expect(fileNameFromText(" \n /:*? ", 3)).toBeUndefined()
  })

  test("should name a file after the date, to the second, without characters file names refuse", () => {
    expect(datedFileName(new Date("2026-11-21T10:30:15.123Z"))).toEqual("iink-ts-2026-11-21T10-30-15")
  })
})
