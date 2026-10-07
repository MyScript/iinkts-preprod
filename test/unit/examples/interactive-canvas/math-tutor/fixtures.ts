import type { TExpression } from "../../../../../examples/interactive-canvas/math-tutor/evaluator.js"

/** JIIX expression builders, shaped like what the server sends (see the IIC-2096 spike report) */
export const num = (value: number, label = String(value)): TExpression => ({ type: "number", label, value })
export const v = (label: string): TExpression => ({ type: "variable", label })
export const sym = (label: string): TExpression => ({ type: "symbol", label })
export const op = (type: string, ...operands: TExpression[]): TExpression => ({ type, operands })

export const add = (...operands: TExpression[]) => op("+", ...operands)
export const sub = (...operands: TExpression[]) => op("-", ...operands)
export const mul = (...operands: TExpression[]) => op("×", ...operands)
export const div = (...operands: TExpression[]) => op("/", ...operands)
export const eq = (...operands: TExpression[]) => op("=", ...operands)
export const neg = (operand: TExpression) => op("-", operand)
export const frac = (numerator: TExpression, denominator: TExpression) => op("fraction", numerator, denominator)
export const sqrt = (operand: TExpression) => op("square root", operand)
export const sup = (base: TExpression, exponent: TExpression) => op("superscript", base, exponent)

/** `2x + 3 = 7`, exactly the tree the spike captured */
export const twoXPlusThreeEqualsSeven = eq(add(mul(num(2), v("x")), num(3)), num(7))
