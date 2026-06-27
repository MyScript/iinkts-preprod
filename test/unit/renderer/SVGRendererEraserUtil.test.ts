import { EraserHelper, SVGRendererEraserUtil } from "../../../src/iink"

describe("SVGRendererEraserUtil.ts", () =>
{
  test("should getSVGPath when no pointers", () =>
  {
    const eraserSym = EraserHelper.create()
    expect(SVGRendererEraserUtil.getSVGPath(eraserSym)).toEqual("")
  })

  test("should getSVGPath when 2 pointers", () =>
  {
    const eraserSym = EraserHelper.create()
    eraserSym.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
    eraserSym.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
    expect(SVGRendererEraserUtil.getSVGPath(eraserSym)).toEqual("M 1 1 L 10 1")
  })

  test("should getSVGPath when more than 2 pointers", () =>
  {
    const eraserSym = EraserHelper.create()
    eraserSym.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
    eraserSym.pointers.push({ p: 1, t: 1, x: 5, y: 5 })
    eraserSym.pointers.push({ p: 1, t: 1, x: 7, y: 5 })
    eraserSym.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
    expect(SVGRendererEraserUtil.getSVGPath(eraserSym)).toEqual("M 1 1 L 5 5 L 7 5 L 10 1")
  })
})
