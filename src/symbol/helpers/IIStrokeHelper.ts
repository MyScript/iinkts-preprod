import type { TPartialDeep} from "@/utils";
import { computeDistance, getClosestPoint, createUUID } from "@/utils"
import type { TStyle} from "@/style";
import { DefaultStyle } from "@/style"
import type { TBox } from "@/symbol/base/Box"
import type { TPointer } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import type { TStrokeToSend } from "@/symbol/base/Stroke"
import { BoxHelper } from "@/symbol/helpers/BoxHelper"
import type { TStroke } from "@/symbol/interactive/IIStroke"

/**
 * Helper functions for TStroke plain type
 * @group Symbol
 * @group Utilities
 */
export const IIStrokeHelper = {
  create(style?: TPartialDeep<TStyle>, pointerType = "pen"): TStroke
  {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) mergedStyle.opacity = +mergedStyle.opacity
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const pointers: TPointer[] = []
    return {
      type: SymbolType.Stroke,
      id: `${ SymbolType.Stroke }-${ createUUID() }`,
      isClosed: false,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      selected: false,
      deleting: false,
      pointerType,
      pointers,
      length: 0,
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      snapPoints: [],
      vertices: pointers,
      edges: [],
    }
  },

  updateBounds(stroke: TStroke): void
  {
    stroke.bounds = BoxHelper.createFromPoints(stroke.pointers)
    stroke.snapPoints = BoxHelper.getSnapPoints(stroke.bounds)
    stroke.edges = stroke.pointers.slice(0, -1).map((p, i) => ({ p1: p, p2: stroke.pointers[i + 1] }))
  },

  _computePressure(stroke: TStroke, distance: number): number
  {
    let ratio = 1.0
    if (distance === stroke.length) {
      ratio = 1.0
    } else if (distance < 10) {
      ratio = 0.2 + Math.pow(0.1 * distance, 0.4)
    } else if (distance > stroke.length - 10) {
      ratio = 0.2 + Math.pow(0.1 * (stroke.length - distance), 0.4)
    }
    const pressure = ratio * Math.max(0.1, 1.0 - (0.1 * Math.sqrt(distance)))
    return isNaN(pressure) ? 0.5 : Math.round(pressure * 100) / 100
  },

  _filterPointByAcquisitionDelta(stroke: TStroke, point: TPointer): boolean
  {
    const lastPointer = stroke.pointers.at(-1)
    const delta: number = (2 + ((stroke.style.width || 1) / 4))
    return !lastPointer ||
      Math.abs(lastPointer.x - point.x) >= delta ||
      Math.abs(lastPointer.y - point.y) >= delta
  },

  addPointer(stroke: TStroke, pointer: TPointer): void
  {
    if (IIStrokeHelper._filterPointByAcquisitionDelta(stroke, pointer)) {
      const lastPointer = stroke.pointers.at(-1)
      const distance = lastPointer ? computeDistance(pointer, lastPointer) : 0
      stroke.length += distance
      pointer.p = IIStrokeHelper._computePressure(stroke, distance)
      stroke.pointers.push(pointer)
      stroke.modificationDate = Date.now()
      IIStrokeHelper.updateBounds(stroke)
    }
  },

  overlaps(stroke: TStroke, box: TBox): boolean
  {
    return stroke.pointers.some(p =>
      p.x >= box.x && p.x <= box.x + box.width &&
      p.y >= box.y && p.y <= box.y + box.height
    )
  },

  formatToSend(stroke: TStroke): TStrokeToSend
  {
    const json: TStrokeToSend = {
      id: stroke.id,
      pointerType: stroke.pointerType,
      p: [],
      t: [],
      x: [],
      y: []
    }
    stroke.pointers.forEach(p =>
    {
      json.p.push(p.p)
      json.t.push(p.t)
      json.x.push(p.x)
      json.y.push(p.y)
    })
    return json
  },

  split(strokeToSplit: TStroke, i: number): { before: TStroke, after: TStroke }
  {
    const before = IIStrokeHelper.create(strokeToSplit.style, strokeToSplit.pointerType)
    before.pointers.push(...strokeToSplit.pointers.slice(0, i))
    before.length = before.pointers.reduce((sum, ptr, idx, arr) =>
      idx === 0 ? 0 : sum + computeDistance(ptr, arr[idx - 1]), 0)
    IIStrokeHelper.updateBounds(before)

    const after = IIStrokeHelper.create(strokeToSplit.style, strokeToSplit.pointerType)
    after.pointers.push(...strokeToSplit.pointers.slice(i))
    after.length = after.pointers.reduce((sum, ptr, idx, arr) =>
      idx === 0 ? 0 : sum + computeDistance(ptr, arr[idx - 1]), 0)
    IIStrokeHelper.updateBounds(after)

    return { before, after }
  },

  substract(stroke: TStroke, partStroke: TStroke): { before?: TStroke, after?: TStroke }
  {
    if (!partStroke.length) return { before: stroke }
    const result: { before?: TStroke, after?: TStroke } = {}
    const lastPointBeforeStroke = { x: partStroke.pointers[0].x, y: partStroke.pointers[0].y }
    const closestLastPointBeforeStroke = getClosestPoint(stroke.pointers, lastPointBeforeStroke)
    if (closestLastPointBeforeStroke.index > -1) {
      const newStrokes = IIStrokeHelper.split(stroke, closestLastPointBeforeStroke.index)
      result.before = newStrokes.before
      result.after = newStrokes.after
    }
    const strokeAfter = result.after || stroke
    const firstPointAfterStroke = { x: partStroke.pointers.at(-1)!.x, y: partStroke.pointers.at(-1)!.y }
    const closestFirstPointStrokeAfter = getClosestPoint(strokeAfter.pointers, firstPointAfterStroke)
    if (closestFirstPointStrokeAfter.index > -1) {
      const newStrokes = IIStrokeHelper.split(strokeAfter, closestFirstPointStrokeAfter.index)
      result.after = newStrokes.after
    }
    if (!result.before?.pointers.length) result.before = undefined
    if (!result.after?.pointers.length) result.after = undefined
    return result
  },

  createFromPartial(partial: TPartialDeep<TStroke>): TStroke
  {
    if (!partial.pointers?.length) throw new Error(`not pointers`)
    const stroke = IIStrokeHelper.create(partial.style, partial.pointerType)
    if (partial.id) stroke.id = partial.id
    stroke.isSolverOutput = partial.isSolverOutput
    const errors: string[] = []
    let flag = true
    partial.pointers?.forEach((pp, pIndex) =>
    {
      if (!pp) {
        errors.push(`no pointer at ${ pIndex }`)
        flag = false
        return
      }
      const pointer: TPointer = { p: pp.p || 1, t: pp.t || pIndex, x: 0, y: 0 }
      if (pp?.x == undefined || pp?.x == null) {
        errors.push(`no x at pointer at ${ pIndex }`)
        flag = false
        return
      } else pointer.x = pp.x
      if (pp?.y == undefined || pp?.y == null) {
        errors.push(`no y at pointer at ${ pIndex }`)
        flag = false
        return
      } else pointer.y = pp.y
      if (flag) IIStrokeHelper.addPointer(stroke, pointer)
    })
    if (errors.length) throw new Error(errors.join(" and "))
    return stroke
  },
}
