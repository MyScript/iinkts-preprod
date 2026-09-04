/**
 * The stroke shapes the recognition protocol deals in, and the one conversion between them.
 *
 * Both types are declared here rather than imported from the symbol layer on purpose: the client is
 * meant to be usable on its own, so it owns the shape of what it sends. TypeScript is structural, so
 * a `TStroke` from the symbol layer satisfies {@link TRecognitionStroke} with no import in either
 * direction and no conversion at the call site.
 */

/**
 * One captured point of a stroke. `x` and `y` are required; `t` and `p` are not, so a caller that
 * builds strokes itself — a custom renderer, an importer — can hand over geometry alone.
 * @group Client
 */
export type TRecognitionPointer = {
  x: number
  y: number
  /**
   * Capture timestamp in milliseconds.
   *
   * **Recognition quality depends on it.** The recognizer uses the interval between points to tell
   * a deliberate stroke from a fast one, to segment characters and to resolve ambiguous shapes.
   * Leave it out and recognition still runs, but on geometry alone — expect measurably worse
   * results, especially on cursive text and on shapes drawn in several passes. Supply it whenever
   * the capture source has it, even approximately.
   */
  t?: number
  /** Pen pressure, 0 to 1. Affects stroke width when rendered; recognition tolerates its absence. */
  p?: number
}

/**
 * What a caller hands the recognizer: an identified sequence of captured pointers, and nothing else.
 * Style, bounds and derived geometry are the document's business, not the server's.
 * @group Client
 */
export type TRecognitionStroke = {
  id: string
  pointerType: string
  pointers: TRecognitionPointer[]
}

/**
 * What actually goes on the wire: the same pointers transposed into one array per component, which
 * is the form the recognition API expects.
 *
 * `t` and `p` are absent when the stroke did not carry them — see {@link toWireStroke} for why they
 * are omitted whole rather than padded.
 * @group Client
 */
export type TWireStroke = {
  id: string
  pointerType: string
  x: number[]
  y: number[]
  p?: number[]
  t?: number[]
}

/**
 * Transposes a stroke's pointers into the protocol's column arrays.
 *
 * The output shape is part of the wire contract — every key, and the order pointers appear in each
 * array, is what the server parses. It is asserted against a literal in
 * `test/unit/client/StrokeSerializer.test.ts` so it cannot drift with a refactor.
 *
 * `t` and `p` are all-or-nothing: an array is emitted only if **every** pointer supplies that value.
 * The server reads each pointer by taking the same index across the arrays, so a partially filled
 * one would misalign with `x`/`y` and silently corrupt the stroke; and padding a gap with a made-up
 * timestamp is worse than sending none, because the recognizer would treat the invention as capture
 * data. A stroke where only some points are timed is a caller bug, and dropping the column is the
 * only reading of it that cannot mislead the server.
 * @group Client
 */
export function toWireStroke(stroke: TRecognitionStroke): TWireStroke {
  const wire: TWireStroke = {
    id: stroke.id,
    pointerType: stroke.pointerType,
    x: [],
    y: [],
  }
  const t: number[] = []
  const p: number[] = []
  let everyPointerIsTimed = true
  let everyPointerHasPressure = true

  stroke.pointers.forEach((pointer) => {
    wire.x.push(pointer.x)
    wire.y.push(pointer.y)
    if (typeof pointer.t === "number") {
      t.push(pointer.t)
    } else {
      everyPointerIsTimed = false
    }
    if (typeof pointer.p === "number") {
      p.push(pointer.p)
    } else {
      everyPointerHasPressure = false
    }
  })

  if (everyPointerIsTimed && t.length) {
    wire.t = t
  }
  if (everyPointerHasPressure && p.length) {
    wire.p = p
  }
  return wire
}
