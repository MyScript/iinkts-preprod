import type { TPoint } from "@/core"

import { SvgElementRole } from "../SvgElementRole"
import { SVGBuilder } from "./SVGBuilder"
import { SVGRendererConst } from "./SVGRendererConst"

/**
 * @group Renderer
 * @summary Default size, in document units, of the padlock drawn by {@link createLockIcon}
 */
export const LOCK_ICON_SIZE = 16

/**
 * @group Renderer
 * @summary A padlock centred on `center`, on a white disc so it reads over any content
 * @remarks Styled through the `ms-lock-icon` class; carries the `lock` role
 */
export function createLockIcon(center: TPoint, size = LOCK_ICON_SIZE): SVGGElement {
  const { x, y } = center
  const group = SVGBuilder.createGroup({ role: SvgElementRole.Lock, class: SVGRendererConst.lockIconClassName })
  group.appendChild(
    SVGBuilder.createCircle(center, size * 0.7, { fill: "white", stroke: "#3e68ff", "stroke-width": "1" })
  )
  const shackle = SVGBuilder.createPath({
    d: `M ${x - size * 0.22} ${y} V ${y - size * 0.2} A ${size * 0.22} ${size * 0.22} 0 0 1 ${x + size * 0.22} ${y - size * 0.2} V ${y}`,
    fill: "none",
    stroke: "#3e68ff",
    "stroke-width": `${size * 0.1}`,
  })
  group.appendChild(shackle)
  const body = { x: x - size * 0.35, y: y - size * 0.05, width: size * 0.7, height: size * 0.45 }
  group.appendChild(SVGBuilder.createRect(body, { fill: "#3e68ff", rx: `${size * 0.08}` }))
  return group
}
