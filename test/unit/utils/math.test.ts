import
{
  computeAverage,
  isBetween,
  isValidNumber,
} from "../../../src/iink"


describe("math.ts", () =>
{
  describe("isValidNumber", () =>
  {
    const testDatas = [
      { value: "", expect: false },
      { value: "x", expect: false },
      { value: "1e10", expect: true },
      { value: 1e10, expect: true },
      { value: "-5", expect: true },
      { value: -5, expect: true },
      { value: 42, expect: true },
      { value: { b: "x" }, expect: false },
      { value: { b: "10" }, expect: false },
      { value: [{ b: "10" }], expect: false },
      { value: Infinity, expect: false },
      { value: -Infinity, expect: false },
    ]
    testDatas.forEach(d =>
    {
      test(`should return ${ d.expect } from "${ d.value }"`, () =>
      {
        expect(isValidNumber(d.value)).toEqual(d.expect)
      })
    })
  })

  describe("isBetween", () =>
  {
    test("should return true", () =>
    {
      expect(isBetween(1, 0, 2)).toEqual(true)
    })
    test("should return false", () =>
    {
      expect(isBetween(3, 0, 2)).toEqual(false)
    })
  })
})

describe("Average", () =>
{
  const testDatas = [
    { values: [0, 1, 2, 3], expected: 1.5 },
    { values: [10, 1, 2, 3], expected: 4 },
    { values: [12, 12, 2, 2], expected: 7 },
    { values: [33, 11], expected: 22 },
    { values: [8], expected: 8 },
    { values: [], expected: 0 },
  ]
  testDatas.forEach(data =>
  {
    test(`should computeAverage of ${ JSON.stringify(data.values) } equal to ${ data.expected }`, () =>
    {
      expect(computeAverage(data.values)).toEqual(data.expected)
    })
  })
})
