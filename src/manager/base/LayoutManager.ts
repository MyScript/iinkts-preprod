import type { CanvasLayer } from "@/canvas/CanvasLayer"
import type { TPartialDeep } from "@/core/std"
import { DOMFactory } from "@/dom"
import { LoggerCategory, LoggerManager } from "@/logger"

/**
 * @group Manager
 * @summary The places of the canvas UI where menus and other occupants sit; the center belongs to the ink
 */
export const LAYOUT_SLOTS = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const

/**
 * @group Manager
 */
export type TLayoutSlot = (typeof LAYOUT_SLOTS)[number]

/**
 * @group Manager
 * @summary The axis of a menu's bar
 */
export type TMenuOrientation = "horizontal" | "vertical"

/**
 * @group Manager
 * @summary The side a menu's dropdowns open towards
 */
export type TMenuDirection = "up" | "down" | "left" | "right"

/**
 * @group Manager
 * @summary The axis a slot gives its menus: vertical bars on the sides, horizontal ones at the top and bottom
 */
export function slotOrientation(slot: TLayoutSlot): TMenuOrientation {
  return slot.startsWith("middle") ? "vertical" : "horizontal"
}

/**
 * @group Manager
 * @summary The side a slot's menus open towards: away from the edge they sit on
 */
export function slotOpenTowards(slot: TLayoutSlot): TMenuDirection {
  if (slot.startsWith("top")) {
    return "down"
  }
  if (slot.startsWith("bottom")) {
    return "up"
  }
  return slot === "middle-left" ? "right" : "left"
}

/**
 * @group Manager
 * @summary The horizontal side a slot sits against, which a dropdown grows away from
 */
export function slotAnchor(slot: TLayoutSlot): "start" | "center" | "end" {
  if (slot.endsWith("left")) {
    return "start"
  }
  return slot.endsWith("right") ? "end" : "center"
}

/**
 * @group Manager
 * @summary What goes in each slot, in stacking order
 * @remarks A slot given here replaces the default one. An occupant it leaves out keeps its default slot;
 * one listed twice only shows in the first.
 * @example
 * // Undo/redo of the action bar right above the tools
 * { "bottom-center": ["action", "tool"] }
 */
export type TLayoutConfiguration = Partial<Record<TLayoutSlot, string[]>>

/**
 * @group Manager
 * @summary Where each occupant sits when the configuration does not say
 */
export const DefaultLayoutConfiguration: Readonly<TLayoutConfiguration> = {
  "top-left": ["action"],
  "top-right": ["style"],
  "bottom-center": ["tool"],
  "bottom-left": ["state"],
  "bottom-right": ["minimap"],
}

/** The configured slots as given in the canvas options, whose partial typing allows holes in the arrays */
function readLayoutConfiguration(configuration?: TPartialDeep<TLayoutConfiguration>): TLayoutConfiguration {
  const read: TLayoutConfiguration = {}
  LAYOUT_SLOTS.forEach((slot) => {
    const occupants = configuration?.[slot]
    if (occupants) {
      read[slot] = occupants.filter((occupant): occupant is string => typeof occupant === "string")
    }
  })
  return read
}

/**
 * @group Manager
 * @summary Places the canvas UI occupants (menus, connection state, minimap) in the slots of the layout
 * @remarks Each occupant gets a host element in its slot, in table order: it renders into that host, so the order
 * holds whatever order the occupants render in.
 */
export class LayoutManager {
  protected logger = LoggerManager.getLogger(LoggerCategory.CANVAS)
  layers: CanvasLayer
  /** The slots as configured, before the defaults fill the rest */
  configuration: TLayoutConfiguration
  /** The occupants this canvas has; a name outside of them in the configuration is ignored */
  occupants: readonly string[]

  /** Where each occupant sits, resolved from the configuration and the defaults */
  protected placement: Record<TLayoutSlot, string[]>
  protected slots: Partial<Record<TLayoutSlot, HTMLDivElement>> = {}
  protected hosts: Map<string, HTMLDivElement> = new Map()

  constructor(layers: CanvasLayer, occupants: readonly string[], configuration?: TPartialDeep<TLayoutConfiguration>) {
    this.layers = layers
    this.occupants = occupants
    this.configuration = readLayoutConfiguration(configuration)
    this.placement = this.resolve()
  }

  /** The occupants of each slot: the configured slots as given, the others from the defaults minus what moved */
  protected resolve(): Record<TLayoutSlot, string[]> {
    const placed = new Set<string>()
    const configured = this.readConfiguredSlots(placed)
    const placement: Record<TLayoutSlot, string[]> = {
      "top-left": [],
      "top-center": [],
      "top-right": [],
      "middle-left": [],
      "middle-right": [],
      "bottom-left": [],
      "bottom-center": [],
      "bottom-right": [],
    }
    LAYOUT_SLOTS.forEach((slot) => {
      placement[slot] =
        configured[slot] ??
        (DefaultLayoutConfiguration[slot] ?? []).filter((occupant) => this.isKnown(occupant) && !placed.has(occupant))
    })
    return placement
  }

  /** The slots the configuration gives, each occupant kept in the first slot naming it */
  protected readConfiguredSlots(placed: Set<string>): Partial<Record<TLayoutSlot, string[]>> {
    const configured: Partial<Record<TLayoutSlot, string[]>> = {}
    LAYOUT_SLOTS.forEach((slot) => {
      const occupants = this.configuration[slot]
      if (!occupants) {
        return
      }
      configured[slot] = occupants.filter((occupant) => {
        if (!this.isKnown(occupant)) {
          this.logger.warn("layout", `No "${occupant}" in this canvas: ignored in "${slot}"`)
          return false
        }
        if (placed.has(occupant)) {
          this.logger.warn("layout", `"${occupant}" is already placed: ignored in "${slot}"`)
          return false
        }
        placed.add(occupant)
        return true
      })
    })
    return configured
  }

  protected isKnown(occupant: string): boolean {
    return this.occupants.includes(occupant)
  }

  /** The occupants of a slot, in stacking order */
  occupantsOf(slot: TLayoutSlot): readonly string[] {
    return this.placement[slot]
  }

  /** The slot an occupant sits in */
  slotOf(occupant: string): TLayoutSlot | undefined {
    return LAYOUT_SLOTS.find((slot) => this.placement[slot].includes(occupant))
  }

  /** Builds the slots holding occupants, with a host per occupant, and moves the connection state into its own */
  render(): void {
    LAYOUT_SLOTS.forEach((slot) => {
      const occupants = this.placement[slot]
      if (occupants.length === 0) {
        return
      }
      const container = DOMFactory.div({ className: ["ms-layout-slot", `ms-layout-${slot}`] })
      occupants.forEach((occupant) => {
        const host = DOMFactory.div({ className: ["ms-layout-host", `ms-layout-host-${occupant}`] })
        this.hosts.set(occupant, host)
        container.appendChild(host)
      })
      this.slots[slot] = container
      this.layers.ui.root.appendChild(container)
    })
    this.host("state")?.appendChild(this.layers.ui.state.root)
  }

  /** The element an occupant renders into; undefined before render() or for an occupant this canvas lacks */
  host(occupant: string): HTMLElement | undefined {
    return this.hosts.get(occupant)
  }

  destroy(): void {
    Object.values(this.slots).forEach((slot) => slot.remove())
    this.slots = {}
    this.hosts.clear()
  }
}
