import type { TBox, TPartialDeep, TPoint } from "@/core"
import {
  BoxOps,
  createUUID,
  type Geometry2d,
  isValidNumber,
  isValidPoint,
  MatrixTransform,
  mergeSymbolTransform,
  OBBOps,
  Polygon2d,
} from "@/core"
import { mergeSymbolStyle, type TStyle } from "@/style"
import { SymbolType, type TImage } from "@/symbol"

import { SVGBuilder } from "../SVGBuilder"
import { SymbolGeometry } from "../SymbolGeometry"
import { SymbolUtil } from "../SymbolUtil"

/**
 * The picture formats an image symbol accepts.
 * @group SymbolUtils
 */
export const IMAGE_MIME_TYPES = ["image/png", "image/jpeg"] as const

/**
 * @group SymbolUtils
 */
export type TImageMimeType = (typeof IMAGE_MIME_TYPES)[number]

const DATA_URL = /^data:([^;,]+);base64,/

/** Share of the view a picture fills at most when it is imported without a width */
const FIT_IN_VIEW_RATIO = 0.8

/**
 * Where an imported picture goes.
 * @group SymbolUtils
 */
export type TImageImportOptions = {
  /** Centre of the picture, in document coordinates; the centre of the view by default */
  center?: TPoint
  /** Width of the picture, its ratio kept; by default its natural size, shrunk to fit the view */
  width?: number
}

/**
 * @group SymbolUtils
 */
export class ImageUtil extends SymbolUtil<TImage> {
  readonly type = SymbolType.Image

  create(partial: TPartialDeep<TImage>): TImage {
    return ImageUtil.createFromPartial(partial)
  }

  /** The picture's rectangle, inside included: a click anywhere on the picture selects it. */
  getGeometry(image: TImage): Geometry2d {
    return new Polygon2d(BoxOps.getCorners(ImageUtil.getBox(image)), true)
  }

  getSnapPoints(image: TImage): TPoint[] {
    return OBBOps.getSnapPoints(SymbolGeometry.of(image).bounds)
  }

  /** The ink written over a picture is erased, never the picture: it is removed by selecting it. */
  canErase(_image: TImage): boolean {
    return false
  }

  /** A free scale would stretch the picture. */
  keepsAspectRatio(_image: TImage): boolean {
    return true
  }

  getSVGElement(image: TImage): SVGGraphicsElement {
    const group = SVGBuilder.createGroup(this.getGroupAttributes(image))
    group.append(
      SVGBuilder.createImage(ImageUtil.getBox(image), {
        href: image.src,
        preserveAspectRatio: "none",
      })
    )
    return group
  }

  /**
   * The box a picture of `size` takes when it is imported into `view`: its natural size, or the
   * width asked, shrunk to fit the view if needed, never enlarged, centred where asked.
   */
  static fitBox(size: { width: number; height: number }, view: TBox, options: TImageImportOptions = {}): TBox {
    const scale = options.width
      ? options.width / size.width
      : Math.min(1, (view.width * FIT_IN_VIEW_RATIO) / size.width, (view.height * FIT_IN_VIEW_RATIO) / size.height)
    const width = size.width * scale
    const height = size.height * scale
    const center = options.center ?? BoxOps.getCenter(view)
    return { x: center.x - width / 2, y: center.y - height / 2, width, height }
  }

  static getBox(image: TImage): TBox {
    return { x: image.point.x, y: image.point.y, width: image.width, height: image.height }
  }

  /**
   * @param src - The picture as a `data:image/png` or `data:image/jpeg` URL
   * @param box - Where the picture is shown, before any transform
   * @throws If `src` is not a data URL of a supported format
   */
  static createImage(src: string, box: TBox, style?: TPartialDeep<TStyle>): TImage {
    ImageUtil.assertSupportedSource(src)
    const now = Date.now()
    return {
      type: SymbolType.Image,
      id: `${SymbolType.Image}-${createUUID()}`,
      style: mergeSymbolStyle(style),
      creationTime: now,
      modificationDate: now,
      transform: MatrixTransform.identity(),
      src,
      point: { x: box.x, y: box.y },
      width: box.width,
      height: box.height,
    }
  }

  static createFromPartial(partial: TPartialDeep<TImage>): TImage {
    if (!partial.src) {
      throw new Error("Unable to create image, src is undefined")
    }
    if (!isValidPoint(partial.point)) {
      throw new Error("Unable to create image, point is invalid")
    }
    if (!isValidNumber(partial.width) || !isValidNumber(partial.height)) {
      throw new Error("Unable to create image, size is invalid")
    }
    const point = partial.point as TPoint
    const image = ImageUtil.createImage(
      partial.src,
      { x: point.x, y: point.y, width: partial.width!, height: partial.height! },
      partial.style
    )
    image.id = partial.id ?? image.id
    image.creationTime = partial.creationTime ?? image.creationTime
    image.modificationDate = partial.modificationDate ?? image.modificationDate
    image.transform = mergeSymbolTransform(partial.transform)
    if (partial.locked) {
      image.locked = true
    }
    return image
  }

  /** The format of the picture, read from its data URL */
  static getMimeType(image: Pick<TImage, "src">): TImageMimeType {
    return ImageUtil.assertSupportedSource(image.src)
  }

  /** The picture's bytes, for an upload or a recognition request */
  static toBlob(image: Pick<TImage, "src">): Blob {
    const type = ImageUtil.getMimeType(image)
    const binary = atob(image.src.slice(image.src.indexOf(",") + 1))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new Blob([bytes], { type })
  }

  static isSupportedMimeType(type: string): type is TImageMimeType {
    return (IMAGE_MIME_TYPES as readonly string[]).includes(type)
  }

  static assertSupportedSource(src: string): TImageMimeType {
    const type = DATA_URL.exec(src)?.[1]
    if (!type) {
      throw new Error("Unable to create image, src must be a base64 data URL")
    }
    if (!ImageUtil.isSupportedMimeType(type)) {
      throw new Error(`Unable to create image, ${type} is not supported, only ${IMAGE_MIME_TYPES.join(", ")}`)
    }
    return type
  }
}
