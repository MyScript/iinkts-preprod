import type { TPoint } from "./Point"
/**
 * @group Core/Geometry
 * @remarks Represents a 2D affine transform, defined as a 3x3 matrix with an implicit third raw of <code>[ 0 0 1 ]</code>
 */
export type TMatrixTransform = {
  /**
   * @remarks scaling x
   */
  xx: number
  /**
   * @remarks shearing x
   */
  yx: number
  /**
   * @remarks translation x
   */
  tx: number
  /**
   * @remarks shearing y
   */
  xy: number
  /**
   * @remarks scaling y
   */
  yy: number
  /**
   * @remarks translation y
   */
  ty: number
}

/**
 * @group Core/Geometry
 * @remarks Represents a 2D affine transform, defined as a 3x3 matrix with an implicit third raw of <code>[ 0 0 1 ]</code>
 */
export class MatrixTransform implements TMatrixTransform {
  xx: number
  yx: number
  xy: number
  yy: number
  tx: number
  ty: number

  constructor(xx: number, yx: number, xy: number, yy: number, tx: number, ty: number) {
    this.xx = xx
    this.yx = yx
    this.xy = xy
    this.yy = yy
    this.tx = tx
    this.ty = ty
  }

  static identity(): MatrixTransform {
    return new MatrixTransform(1, 0, 0, 1, 0, 0)
  }

  static applyToPoint(mat: TMatrixTransform, point: TPoint): TPoint {
    return {
      x: mat.xx * point.x + mat.xy * point.y + mat.tx,
      y: mat.yx * point.x + mat.yy * point.y + mat.ty,
    }
  }

  static rotation(mat: TMatrixTransform): number {
    let rotation

    if (mat.xx !== 0 || mat.xy !== 0) {
      const hypotAc = Math.hypot(mat.xx, mat.xy)
      rotation = Math.acos(mat.xx / hypotAc) * (mat.xy > 0 ? -1 : 1)
    } else if (mat.yx !== 0 || mat.yy !== 0) {
      const hypotBd = Math.hypot(mat.yx, mat.yy)
      rotation = Math.PI / 2 + Math.acos(mat.yx / hypotBd) * (mat.yy > 0 ? -1 : 1)
    } else {
      rotation = 0
    }

    return rotation
  }

  static toCssString(matrix: TMatrixTransform): string {
    return `matrix(${matrix.xx}, ${matrix.yx}, ${matrix.xy}, ${matrix.yy}, ${matrix.tx}, ${matrix.ty})`
  }

  invert() {
    const { xx, yx, xy, yy, tx, ty } = this
    const denom = xx * yy - yx * xy
    this.xx = yy / denom
    this.yx = yx / -denom
    this.xy = xy / -denom
    this.yy = xx / denom
    this.tx = (yy * tx - xy * ty) / -denom
    this.ty = (yx * tx - xx * ty) / denom
    return this
  }

  multiply(m: TMatrixTransform): MatrixTransform {
    const { xx, yx, xy, yy, tx, ty } = this
    this.xx = xx * m.xx + xy * m.yx
    this.yx = yx * m.xx + yy * m.yx
    this.xy = xx * m.xy + xy * m.yy
    this.yy = yx * m.xy + yy * m.yy
    this.tx = xx * m.tx + xy * m.ty + tx
    this.ty = yx * m.tx + yy * m.ty + ty
    return this
  }

  translate(tx: number, ty: number): MatrixTransform {
    return this.multiply({
      xx: 1,
      yx: 0,
      xy: 0,
      yy: 1,
      tx,
      ty,
    })
  }

  rotate(radian: number, center?: TPoint): MatrixTransform {
    if (center) {
      this.translate(center.x, center.y)
    }
    const cosAngle = Math.round(Math.cos(radian) * 1000) / 1000
    const sinAngle = Math.round(Math.sin(radian) * 1000) / 1000
    this.multiply({
      xx: cosAngle,
      yx: sinAngle,
      xy: -sinAngle,
      yy: cosAngle,
      tx: 0,
      ty: 0,
    })
    if (center) {
      this.translate(-center.x, -center.y)
    }
    return this
  }

  scale(x: number, y: number, center?: TPoint): MatrixTransform {
    if (center) {
      this.translate(center.x, center.y)
    }
    this.multiply({
      xx: x,
      yx: 0,
      xy: 0,
      yy: y,
      tx: 0,
      ty: 0,
    })
    if (center) {
      this.translate(-center.x, -center.y)
    }
    return this
  }

  applyToPoint(point: TPoint): TPoint {
    return MatrixTransform.applyToPoint(this, point)
  }

  clone(): MatrixTransform {
    return new MatrixTransform(this.xx, this.yx, this.xy, this.yy, this.tx, this.ty)
  }

  toCssString(): string {
    return MatrixTransform.toCssString(this)
  }
}

/**
 * Decimals a transformed coordinate keeps.
 *
 * Three is what this library stores everywhere else — `toFixed(3)` appears in dozens of places. The
 * transform managers were the exception, and only in some of their branches, which is how a resized
 * line came to hold three decimals while a translated one held seventeen.
 */
const TRANSFORM_DECIMALS = 3

function roundCoordinate(value: number): number {
  return +value.toFixed(TRANSFORM_DECIMALS)
}

/**
 * A matrix applied to a point, rounded to the precision the document stores.
 *
 * Prefer this over {@link MatrixTransform.applyToPoint} whenever the result is written back into a
 * symbol: the raw form is for intermediate maths, where rounding at every step would accumulate.
 *
 * Returns a new point and leaves the argument untouched.
 *
 * @group Core/Geometry
 */
export function applyMatrixToPoint(point: TPoint, matrix: TMatrixTransform): TPoint {
  const transformed = MatrixTransform.applyToPoint(matrix, point)
  return { x: roundCoordinate(transformed.x), y: roundCoordinate(transformed.y) }
}

/**
 * The same, applied in place to every point of a list, so each point keeps its object identity.
 *
 * Lived as a `protected` method on the transform manager base until IIC-2010, where no symbol util
 * could reach it — which is half of why the managers rounded inconsistently.
 *
 * @group Core/Geometry
 */
export function applyMatrixToPoints(points: TPoint[], matrix: TMatrixTransform): void {
  points.forEach((point) => {
    const transformed = applyMatrixToPoint(point, matrix)
    point.x = transformed.x
    point.y = transformed.y
  })
}
