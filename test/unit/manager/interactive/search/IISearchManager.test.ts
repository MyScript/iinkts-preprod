import type {
  TJIIXChar,
  TJIIXElement,
  TJIIXMathElement,
  TJIIXMathExpression,
  TJIIXTextElement,
  TJIIXWord,
  TSymbolChar,
} from "@/iink"
import {
  BoxOps,
  convertBoundingBoxMillimeterToPixel,
  IIJiixQueryManager,
  IISearchManager,
  JIIXElementType,
  MatrixTransform,
} from "@/iink"

import type { TCanvasMock } from "../../../__mocks__/createCanvasMock"
import { asCanvas, createCanvasMock } from "../../../__mocks__/createCanvasMock"
import { buildIIMath, buildIIStroke, buildIIText } from "../../../helpers"

type TTextFixture = { element: TJIIXTextElement; strokeIds: string[][] }

/**
 * Builds a JIIX text element from its words, one stroke and one box (mm) per non-blank char.
 * A "\n" word starts a new line. `strokeIds[w][c]` is the stroke of char c of word w.
 */
function buildTextElement(
  canvas: TCanvasMock,
  words: string[],
  { id = "text-1", withFirstChar = true }: { id?: string; withFirstChar?: boolean } = {}
): TTextFixture {
  const chars: TJIIXChar[] = []
  const jiixWords: TJIIXWord[] = []
  const strokeIds: string[][] = []
  let row = 0
  let col = 0
  words.forEach((label, wordIndex) => {
    const firstChar = chars.length
    const wordStrokes: string[] = []
    for (const c of label) {
      if (/\s/.test(c)) {
        chars.push({ label: c, word: wordIndex, grid: [] })
      } else {
        const stroke = buildIIStroke()
        canvas.model.addSymbol(stroke)
        wordStrokes.push(stroke.id)
        chars.push({
          label: c,
          word: wordIndex,
          grid: [],
          "bounding-box": { x: col * 5, y: row * 10, width: 4, height: 8 },
          items: [{ type: "stroke", id: `s-${stroke.id}`, "full-id": stroke.id }],
        })
      }
      col++
    }
    if (label === "\n") {
      row++
      col = 0
    }
    strokeIds.push(wordStrokes)
    const word: TJIIXWord = { label }
    if (wordStrokes.length) {
      word.items = wordStrokes.map((s) => ({ type: "stroke", id: `s-${s}`, "full-id": s }))
      word["bounding-box"] = { x: 0, y: row * 10, width: col * 5, height: 8 }
    }
    if (withFirstChar) {
      word["first-char"] = firstChar
      word["last-char"] = chars.length - 1
    }
    jiixWords.push(word)
  })
  const element: TJIIXTextElement = {
    id,
    type: JIIXElementType.Text,
    label: words.join(""),
    words: jiixWords,
    chars: withFirstChar ? chars : undefined,
  }
  return { element, strokeIds }
}

/** A math leaf (number, variable…) drawn by one stroke, laid out left to right */
function mathFixture(canvas: TCanvasMock) {
  let col = 0
  const drawn = (): Pick<TJIIXMathExpression, "items" | "bounding-box"> => {
    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)
    const box = { x: col++ * 5, y: 0, width: 4, height: 8 }
    return { items: [{ type: "stroke", id: `s-${stroke.id}`, "full-id": stroke.id }], "bounding-box": box }
  }
  const leaf = (label: string, type = "number"): TJIIXMathExpression =>
    ({ id: `leaf-${label}-${col}`, type, label, value: 0, ...drawn() }) as TJIIXMathExpression
  const op = (type: string, ...operands: (TJIIXMathExpression | null)[]): TJIIXMathExpression =>
    ({ id: `op-${type}-${col}`, type, ...drawn(), operands }) as TJIIXMathExpression
  const group = (...operands: TJIIXMathExpression[]): TJIIXMathExpression =>
    ({ id: `group-${col}`, type: "group", operands }) as TJIIXMathExpression
  const fence = (...operands: TJIIXMathExpression[]): TJIIXMathExpression =>
    ({
      id: `fence-${col}`,
      type: "fence",
      "open symbol": "(",
      "close symbol": ")",
      ...drawn(),
      operands,
    }) as TJIIXMathExpression
  const element = (...expressions: TJIIXMathExpression[]): TJIIXMathElement => ({
    id: "math-1",
    type: JIIXElementType.Math,
    expressions,
  })
  return { leaf, op, group, fence, element }
}

function typesetChars(text: string, x = 0): TSymbolChar[] {
  return [...text].map((label, i) => ({
    id: `char-${i}`,
    label,
    color: "#000",
    fontSize: 16,
    fontWeight: "normal",
    bounds: { x: x + i * 10, y: 0, width: 10, height: 20 },
  }))
}

function setup(
  elements: TJIIXElement[] = [],
  canvas = createCanvasMock()
): { canvas: TCanvasMock; search: IISearchManager } {
  canvas.model.mergeExport({
    "application/vnd.myscript.jiix": { type: "Raw Content", id: "MainBlock", version: "3", elements },
  })
  const jiix = new IIJiixQueryManager(asCanvas(canvas))
  Object.assign(canvas, { jiix })
  jiix.invalidateIndex()
  const search = new IISearchManager(asCanvas(canvas))
  Object.assign(canvas, { search })
  return { canvas, search }
}

function textCanvas(words: string[], options?: { id?: string; withFirstChar?: boolean }) {
  const canvas = createCanvasMock()
  const fixture = buildTextElement(canvas, words, options)
  return { ...setup([fixture.element], canvas), ...fixture }
}

const DERIVATIVE = ["The", " ", "derivative", "\n", "of", " ", "f"]

describe("IISearchManager.ts", () => {
  describe("find — handwritten text", () => {
    test("should find a whole word with one box and one stroke per letter", () => {
      const { search, element, strokeIds } = textCanvas(DERIVATIVE)
      const matches = search.find("derivative")
      expect(matches).toHaveLength(1)
      const [match] = matches
      expect(match.text).toBe("derivative")
      expect(match.kind).toBe("text")
      expect(match.source).toBe("ink")
      expect(match.boxes).toHaveLength(10)
      expect(match.symbolIds).toEqual(strokeIds[2])
      const expectedBoxes = element
        .chars!.slice(4, 14)
        .map((c) => convertBoundingBoxMillimeterToPixel(c["bounding-box"]!))
      expect(match.boxes).toEqual(expectedBoxes)
      expect(match.bounds).toEqual(BoxOps.createFromBoxes(expectedBoxes))
    })

    test("should ignore case and report the recognized text", () => {
      const { search } = textCanvas(DERIVATIVE)
      const matches = search.find("DERIV")
      expect(matches).toHaveLength(1)
      expect(matches[0].text).toBe("deriv")
    })

    test("should ignore accents", () => {
      const { search } = textCanvas(["La", " ", "Dérivée"])
      const matches = search.find("derivee")
      expect(matches).toHaveLength(1)
      expect(matches[0].text).toBe("Dérivée")
    })

    test("should find a phrase across a line break", () => {
      const { search } = textCanvas(DERIVATIVE)
      const matches = search.find("of f")
      expect(matches).toHaveLength(1)
      expect(matches[0].boxes).toHaveLength(3)
      expect(search.find("derivative of")).toHaveLength(1)
    })

    test("should find every non-overlapping occurrence, top to bottom then left to right", () => {
      const { search } = textCanvas(["see", "\n", "bee"])
      const matches = search.find("e")
      expect(matches).toHaveLength(4)
      const positions = matches.map((m) => [m.bounds.y, m.bounds.x])
      const sorted = [...positions].sort((a, b) => a[0] - b[0] || a[1] - b[1])
      expect(positions).toEqual(sorted)
      expect(search.find("ee")).toHaveLength(2)
    })

    test("should match regex special characters literally", () => {
      const { search } = textCanvas(["f'(x)", " ", "x^2"])
      expect(search.find("f'(x)")).toHaveLength(1)
      expect(search.find("x^2")).toHaveLength(1)
      expect(() => search.find("(")).not.toThrow()
      expect(search.find("(")).toHaveLength(1)
    })

    test("should return nothing for an empty or blank query", () => {
      const { search } = textCanvas(DERIVATIVE)
      expect(search.find("")).toEqual([])
      expect(search.find("   ")).toEqual([])
    })

    test("should use the word box and strokes when chars are not given", () => {
      const { search, element, strokeIds } = textCanvas(DERIVATIVE, { withFirstChar: false })
      const [match] = search.find("deriv")
      const wordBox = convertBoundingBoxMillimeterToPixel(element.words![2]["bounding-box"]!)
      expect(match.boxes).toEqual([wordBox])
      expect(match.symbolIds).toEqual(strokeIds[2])
    })

    test("should ignore an element whose strokes are gone", () => {
      const { canvas, search, strokeIds } = textCanvas(DERIVATIVE)
      strokeIds.flat().forEach((id) => canvas.model.removeSymbol(id))
      expect(search.find("derivative")).toEqual([])
    })

    test("should give the whole unit as context when it is short", () => {
      const { search } = textCanvas(DERIVATIVE)
      expect(search.find("derivative")[0].context).toBe("The derivative of f")
    })

    test("should cut a long context at a space with an ellipsis", () => {
      const filler = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do"
      const { search } = textCanvas([filler, " ", "target", " ", filler])
      const { context } = search.find("target")[0]
      expect(context.startsWith("…")).toBe(true)
      expect(context.endsWith("…")).toBe(true)
      expect(context).toContain("target")
      expect(context.length).toBeLessThan(filler.length * 2)
      expect(context.slice(1, -1).startsWith(" ")).toBe(false)
    })
  })
  describe("find — handwritten math", () => {
    function mathCanvas() {
      const canvas = createCanvasMock()
      const { leaf, op, group, element } = mathFixture(canvas)
      // 3x + 2 = 5, with an unrelated 12 = 12 after it
      const statement = op("=", op("+", group(leaf("3"), leaf("x", "variable")), leaf("2")), leaf("5"))
      const twelve = op("=", leaf("12"), leaf("12"))
      return setup([element(statement, twelve)], canvas)
    }

    test("should find an expression in reading order, ignoring spaces", () => {
      const { search } = mathCanvas()
      const matches = search.find("3x+2")
      expect(matches).toHaveLength(1)
      expect(matches[0].kind).toBe("math")
      expect(matches[0].source).toBe("ink")
      expect(matches[0].text).toBe("3x+2")
      expect(matches[0].boxes).toHaveLength(4)
      expect(search.find("3 x + 2")).toHaveLength(1)
      expect(search.find("3x+2=5")).toHaveLength(1)
    })

    test("should count a multi-digit leaf box once", () => {
      const { search } = mathCanvas()
      const matches = search.find("12")
      expect(matches).toHaveLength(2)
      expect(matches[0].boxes).toHaveLength(1)
    })

    test("should read a fence as parentheses around its content", () => {
      const canvas = createCanvasMock()
      const { leaf, group, fence, element } = mathFixture(canvas)
      const { search } = setup([element(group(leaf("f", "variable"), leaf("'", "symbol"), fence(leaf("0"))))], canvas)
      const matches = search.find("f'(0)")
      expect(matches).toHaveLength(1)
      // f, ', 0 and the fence, whose one box holds both parentheses
      expect(matches[0].boxes).toHaveLength(4)
    })

    test("should put any sign operator between its operands", () => {
      const canvas = createCanvasMock()
      const { leaf, op, element } = mathFixture(canvas)
      const { search } = setup([element(op("∈", leaf("x", "variable"), leaf("R", "variable")))], canvas)
      expect(search.find("x∈R")).toHaveLength(1)
    })

    test("should read a math element inlined in a text where the text refers to it, once", () => {
      const canvas = createCanvasMock()
      const { leaf, op, element } = mathFixture(canvas)
      const inline = { ...element(op("=", leaf("x", "variable"), leaf("0"))), id: "math-inline", parent: "text-1" }
      const fixture = buildTextElement(canvas, ["at", " ", "X", " ", "."])
      const words = fixture.element.words!
      words[2] = { ...words[2], label: " $x=0$ ", refs: ["math-inline"], items: [], "first-char": 2, "last-char": 4 }
      const { search } = setup([fixture.element, inline], canvas)
      expect(search.find("at x=0 .")).toHaveLength(1)
      const matches = search.find("x=0")
      expect(matches).toHaveLength(1)
      expect(matches[0].kind).toBe("text")
      expect(matches[0].boxes).toHaveLength(3)
    })

    test("should not read an implicit multiplication JIIX adds without ink", () => {
      const canvas = createCanvasMock()
      const { leaf, element } = mathFixture(canvas)
      const implicit = {
        id: "implicit",
        type: "×",
        operands: [leaf("2"), leaf("x", "variable")],
      } as TJIIXMathExpression
      const { search } = setup([element(implicit)], canvas)
      expect(search.find("2x")).toHaveLength(1)
    })

    test("should skip a blank operand", () => {
      const canvas = createCanvasMock()
      const { leaf, op, element } = mathFixture(canvas)
      const { search } = setup([element(op("=", null, leaf("24")))], canvas)
      expect(search.find("=24")).toHaveLength(1)
    })
  })

  describe("find — typeset", () => {
    test("should find characters of a converted text", () => {
      const canvas = createCanvasMock()
      const text = buildIIText({ chars: typesetChars("photosynthesis") })
      canvas.model.addSymbol(text)
      const { search } = setup([], canvas)
      const matches = search.find("photo")
      expect(matches).toHaveLength(1)
      expect(matches[0].kind).toBe("text")
      expect(matches[0].source).toBe("typeset")
      expect(matches[0].boxes).toHaveLength(5)
      expect(matches[0].symbolIds).toEqual([text.id])
      expect(matches[0].bounds).toEqual({ x: 0, y: 0, width: 50, height: 20 })
    })

    test("should place boxes where the symbol transform puts them", () => {
      const canvas = createCanvasMock()
      const text = buildIIText({ chars: typesetChars("photo") })
      text.transform = new MatrixTransform(1, 0, 0, 1, 100, 0)
      canvas.model.addSymbol(text)
      const { search } = setup([], canvas)
      expect(search.find("photo")[0].bounds).toEqual({ x: 100, y: 0, width: 50, height: 20 })
    })

    test("should find a converted math expression", () => {
      const canvas = createCanvasMock()
      const math = buildIIMath("y=3x+2")
      canvas.model.addSymbol(math)
      const { search } = setup([], canvas)
      const matches = search.find("3x + 2")
      expect(matches).toHaveLength(1)
      expect(matches[0].kind).toBe("math")
      expect(matches[0].source).toBe("typeset")
      expect(matches[0].boxes).toHaveLength(1)
      expect(matches[0].symbolIds).toEqual([math.id])
    })

    test("should find converted content once, not again through its former ink", () => {
      const canvas = createCanvasMock()
      const fixture = buildTextElement(canvas, ["photosynthesis"])
      fixture.strokeIds.flat().forEach((id) => canvas.model.removeSymbol(id))
      canvas.model.addSymbol(buildIIText({ chars: typesetChars("photosynthesis") }))
      const { search } = setup([fixture.element], canvas)
      const matches = search.find("photo")
      expect(matches).toHaveLength(1)
      expect(matches[0].source).toBe("typeset")
    })
  })
  describe("available", () => {
    test("should be false while nothing is recognized", () => {
      const { search } = setup()
      expect(search.available).toBe(false)
    })

    test("should be true once a handwritten text is recognized", () => {
      const { search } = textCanvas(DERIVATIVE)
      expect(search.available).toBe(true)
    })

    test("should be true with a converted text only", () => {
      const canvas = createCanvasMock()
      canvas.model.addSymbol(buildIIText({ chars: typesetChars("photo") }))
      const { search } = setup([], canvas)
      expect(search.available).toBe(true)
    })
  })
  describe("highlight", () => {
    const rects = (canvas: TCanvasMock) => canvas.renderer.layer.querySelectorAll('[data-overlay="search"]')

    test("should draw one rect per box, the active match marked", () => {
      const { canvas, search } = textCanvas(["see", " ", "bee"])
      const [m1, m2] = search.find("ee")
      search.highlight([m1, m2], m2)
      expect(rects(canvas)).toHaveLength(m1.boxes.length + m2.boxes.length)
      expect(canvas.renderer.layer.querySelectorAll(".ms-search-highlight-active")).toHaveLength(m2.boxes.length)
      expect(search.highlighted).toEqual([m1, m2])
    })

    test("should replace the previous highlight", () => {
      const { canvas, search } = textCanvas(["see", " ", "bee"])
      const [m1, m2] = search.find("ee")
      search.highlight([m1, m2])
      search.highlight([m1])
      expect(rects(canvas)).toHaveLength(m1.boxes.length)
    })

    test("should remove every rect on clear", () => {
      const { canvas, search } = textCanvas(["see"])
      search.highlight(search.find("ee"))
      search.clear()
      expect(rects(canvas)).toHaveLength(0)
      expect(search.highlighted).toEqual([])
    })

    test("should drop matches whose ink is erased once synchronized", () => {
      const { canvas, search, strokeIds } = textCanvas(DERIVATIVE)
      search.highlight(search.find("derivative"))
      strokeIds[2].forEach((id) => canvas.model.removeSymbol(id))
      canvas.event.emitSynchronized()
      expect(rects(canvas)).toHaveLength(0)
      expect(search.highlighted).toEqual([])
    })

    test("should redraw a moved converted text where it now is, keeping the active match", () => {
      const canvas = createCanvasMock()
      const text = buildIIText({ chars: typesetChars("photo") })
      canvas.model.addSymbol(text)
      const { search } = setup([], canvas)
      const [match] = search.find("photo")
      search.highlight([match], match)
      canvas.model.removeSymbol(text.id)
      canvas.model.addSymbol({ ...text, transform: new MatrixTransform(1, 0, 0, 1, 100, 0) })
      canvas.event.emitSynchronized()
      expect(search.highlighted[0].bounds.x).toBe(100)
      expect(canvas.renderer.layer.querySelectorAll(".ms-search-highlight-active")).toHaveLength(5)
    })

    test("should do nothing on synchronized once destroyed", () => {
      const { canvas, search } = textCanvas(DERIVATIVE)
      search.highlight(search.find("derivative"))
      search.destroy()
      expect(() => canvas.event.emitSynchronized()).not.toThrow()
      expect(rects(canvas)).toHaveLength(0)
    })
  })

  describe("reveal", () => {
    test("should center a small match at the current zoom and select it", () => {
      const { canvas, search } = textCanvas(DERIVATIVE)
      const [match] = search.find("derivative")
      search.reveal(match)
      const center = BoxOps.getCenter(match.bounds)
      expect(canvas.renderer.setViewBox).toHaveBeenCalledWith(center.x - 200, center.y - 200, 400, 400)
      expect(canvas.renderer.setZoom).not.toHaveBeenCalled()
      expect(canvas.select).toHaveBeenCalledWith(match.symbolIds)
    })

    test("should fit a match larger than the view", () => {
      const canvas = createCanvasMock()
      const chars = typesetChars("photo").map((c) => ({ ...c, bounds: { ...c.bounds, width: 500 } }))
      const text = buildIIText({ chars })
      canvas.model.addSymbol(text)
      const { search } = setup([], canvas)
      const [match] = search.find("photo")
      search.reveal(match)
      expect(canvas.zoomToFit).toHaveBeenCalledWith([text])
      expect(canvas.select).toHaveBeenCalledWith([text.id])
    })
  })
})
