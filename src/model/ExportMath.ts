import { TBox } from "../symbol"
import { TJIIXBase, TJIIXElementBase } from "./ExportCommon"

/**
 * @group Exports
 * @remarks Math element type in JIIX
 */
export enum JIIXMathExpressionType {
  Number = "number",
  Variable = "variable",
  Symbol = "symbol",
  Group = "group",
  Fraction = "fraction",
  Superscript = "superscript",
  Subscript = "subscript",
  Subsuperscript = "subsuperscript",
  SquareRoot = "square root",
  Root = "root",
  Add = "+",
  Subtract = "-",
  Multiply = "×",
  Divide = "/",
  Equal = "=",
  NotEqual = "≠",
  LessThan = "<",
  GreaterThan = ">",
  LessThanOrEqual = "≤",
  GreaterThanOrEqual = "≥",
}

/**
 * @group Exports
 * @remarks Symbol in a math expression
 */
export type TJIIXMathSymbol = {
  symbol: string
  candidates?: string[]
}

/**
 * @group Exports
 * @remarks Base type for math expressions
 */
export type TJIIXMathExpressionBase = TJIIXBase & {
  id: string
  type: string
}

/**
 * @group Exports
 * @remarks Number expression in math
 */
export type TJIIXMathNumber = TJIIXMathExpressionBase & {
  type: "number"
  label: string
  value: number
  symbols?: TJIIXMathSymbol[]
}

/**
 * @group Exports
 * @remarks Variable expression in math (e.g., x, y, z)
 */
export type TJIIXMathVariable = TJIIXMathExpressionBase & {
  type: "variable"
  label: string
}

/**
 * @group Exports
 * @remarks Symbol expression in math
 */
export type TJIIXMathSymbolExpression = TJIIXMathExpressionBase & {
  type: "symbol"
  label: string
  symbols?: TJIIXMathSymbol[]
}

/**
 * @group Exports
 * @remarks Operator expression (binary or unary)
 */
export type TJIIXMathOperator = TJIIXMathExpressionBase & {
  type: string  // "+", "-", "×", "/", "=", etc.
  symbols?: TJIIXMathSymbol[]
  operands?: TJIIXMathExpression[]
}

/**
 * @group Exports
 * @remarks Group expression
 */
export type TJIIXMathGroup = TJIIXMathExpressionBase & {
  type: "group"
  operands?: TJIIXMathExpression[]
}

/**
 * @group Exports
 * @remarks Fraction expression
 */
export type TJIIXMathFraction = TJIIXMathExpressionBase & {
  type: "fraction"
  operands?: [TJIIXMathExpression, TJIIXMathExpression]  // [numerator, denominator]
}

/**
 * @group Exports
 * @remarks Superscript expression (exponent)
 */
export type TJIIXMathSuperscript = TJIIXMathExpressionBase & {
  type: "superscript"
  operands?: [TJIIXMathExpression, TJIIXMathExpression]  // [base, exponent]
}

/**
 * @group Exports
 * @remarks Subscript expression
 */
export type TJIIXMathSubscript = TJIIXMathExpressionBase & {
  type: "subscript"
  operands?: [TJIIXMathExpression, TJIIXMathExpression]  // [base, subscript]
}

/**
 * @group Exports
 * @remarks Subsuperscript expression (both subscript and superscript)
 */
export type TJIIXMathSubsuperscript = TJIIXMathExpressionBase & {
  type: "subsuperscript"
  operands?: [TJIIXMathExpression, TJIIXMathExpression, TJIIXMathExpression]  // [base, subscript, superscript]
}

/**
 * @group Exports
 * @remarks Square root expression
 */
export type TJIIXMathSquareRoot = TJIIXMathExpressionBase & {
  type: "square root"
  operands?: [TJIIXMathExpression]
}

/**
 * @group Exports
 * @remarks Root expression (nth root)
 */
export type TJIIXMathRoot = TJIIXMathExpressionBase & {
  type: "root"
  operands?: [TJIIXMathExpression, TJIIXMathExpression]  // [radicand, index]
}

/**
 * @group Exports
 * @remarks Union type for all math expressions
 */
export type TJIIXMathExpression =
  | TJIIXMathNumber
  | TJIIXMathVariable
  | TJIIXMathSymbolExpression
  | TJIIXMathOperator
  | TJIIXMathGroup
  | TJIIXMathFraction
  | TJIIXMathSuperscript
  | TJIIXMathSubscript
  | TJIIXMathSubsuperscript
  | TJIIXMathSquareRoot
  | TJIIXMathRoot

/**
 * @group Exports
 * @remarks Math element that can be embedded in text or standalone
 */
export type TJIIXMathElement = TJIIXElementBase<"Math"> & {
  id: string
  "bounding-box"?: TBox
  label?: string
  expressions?: TJIIXMathExpression[]
}
