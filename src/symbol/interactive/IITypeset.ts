/**
 * @group Symbol
 */
export type TTypesetChild = {
  id: string
  label: string
  color: string
  bounds: import("@/symbol/base/Box").TBox
  fontSize: number
  fontWeight: "normal" | "bold"
}

export type { TRotation } from "@/symbol/helpers/_typesetDerivedFields"
