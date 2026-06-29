import { isBetween } from "@/utils"
import type { TPoint, TSegment } from "./Point"

/**
 * @group Symbol
 */
export type TBox = {
  x: number,
  y: number,
  width: number,
  height: number
}

/**
 * @group Symbol
 */
export const BoxOps = {
  createFromBoxes(boxes: TBox[]): TBox
  {
    if (!boxes?.length) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    let minX = boxes[0].x
    let maxX = boxes[0].x + boxes[0].width
    let minY = boxes[0].y
    let maxY = boxes[0].y + boxes[0].height
    for (let i = 1; i < boxes.length; i++) {
      const b = boxes[i]
      if (b.x < minX) minX = b.x
      if (b.x + b.width > maxX) maxX = b.x + b.width
      if (b.y < minY) minY = b.y
      if (b.y + b.height > maxY) maxY = b.y + b.height
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  },

  createFromPoints(points: TPoint[]): TBox
  {
    if (!points?.length) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    let minX = points[0].x
    let maxX = points[0].x
    let minY = points[0].y
    let maxY = points[0].y
    for (let i = 1; i < points.length; i++) {
      const p = points[i]
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  },

  getCorners(box: TBox): TPoint[]
  {
    return [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x + box.width, y: box.y + box.height },
      { x: box.x, y: box.y + box.height }
    ]
  },

  getSide(box: TBox): TPoint[]
  {
    return [
      { x: box.x + box.width / 2, y: box.y },
      { x: box.x + box.width, y: box.y + box.height / 2 },
      { x: box.x + box.width / 2, y: box.y + box.height },
      { x: box.x, y: box.y + box.height / 2 }
    ]
  },

  getCenter(box: TBox): TPoint
  {
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  },

  getSides(box: TBox): TSegment[]
  {
    const vertices = BoxOps.getCorners(box)
    return vertices.map((p, i) =>
    {
      if (i === 3) {
        return { p1: vertices[0], p2: p }
      }
      return { p1: p, p2: vertices[i + 1] }
    })
  },

  getSnapPoints(box: TBox): TPoint[]
  {
    return [...BoxOps.getCorners(box), BoxOps.getCenter(box)]
  },

  isContained(box: TBox, wrapper: TBox): boolean
  {
    return isBetween(box.x, wrapper.x, wrapper.x + wrapper.width) &&
      isBetween(box.x + box.width, wrapper.x, wrapper.x + wrapper.width) &&
      isBetween(box.y, wrapper.y, wrapper.y + wrapper.height) &&
      isBetween(box.y + box.height, wrapper.y, wrapper.y + wrapper.height)
  },

  containsPoint(box: TBox, point: TPoint): boolean
  {
    return isBetween(point.x, box.x, box.x + box.width) &&
      isBetween(point.y, box.y, box.y + box.height)
  },

  contains(box: TBox, child: TBox): boolean
  {
    return isBetween(child.x, box.x, box.x + box.width) &&
      isBetween(child.x + child.width, box.x, box.x + box.width) &&
      isBetween(child.y, box.y, box.y + box.height) &&
      isBetween(child.y + child.height, box.y, box.y + box.height)
  },

  overlaps(box1: TBox, box2: TBox): boolean
  {
    if (box1.x > box2.x + box2.width) return false
    if (box1.x + box1.width < box2.x) return false
    if (box1.y > box2.y + box2.height) return false
    if (box1.y + box1.height < box2.y) return false
    return true
  },
}
