import { round } from "../../helpers"

import {
  convertDegreeToRadian,
  convertRadianToDegree,
} from "@/iink"

describe("convert angle", () => {
  const degreToRad = [
    { degree: 0, radian: 0 },
    { degree: 10, radian: 0.1745 },
    { degree: 30, radian: 0.5236 },
    { degree: 45, radian: 0.7854 },
    { degree: 60, radian: 1.0472 },
    { degree: 90, radian: 1.5708 },
    { degree: 135, radian: 2.3562 },
    { degree: 180, radian: 3.1416 },
    { degree: 270, radian: 4.7124 },
    { degree: 360, radian: 0 },
    { degree: 370, radian: 0.1745 },
    { degree: 390, radian: 0.5236 },
    { degree: 450, radian: 1.5708 },
  ]
  degreToRad.forEach((d) => {
    test(`shoud couvert ${d.degree}° to ${d.radian} rad`, () => {
      expect(convertDegreeToRadian(d.degree)).toEqual(d.radian)
    })
  })

  const radToDegree = [
    { radian: 0, degree: 0 },
    { radian: Math.PI / 6, degree: 30 },
    { radian: Math.PI / 4, degree: 45 },
    { radian: Math.PI / 3, degree: 60 },
    { radian: Math.PI / 2, degree: 90 },
    { radian: Math.PI, degree: 180 },
    { radian: (Math.PI * 4) / 3, degree: 240 },
    { radian: (Math.PI * 3) / 2, degree: 270 },
    { radian: Math.PI * 2, degree: 0 },
    { radian: (Math.PI * 5) / 2, degree: 90 },
    { radian: (Math.PI * 2) / 3, degree: 120 },
    { radian: (Math.PI * 8) / 3, degree: 120 },
  ]
  radToDegree.forEach((d) => {
    test(`shoud couvert ${d.radian} rad to ${d.degree}°`, () => {
      expect(round(convertRadianToDegree(d.radian))).toEqual(d.degree)
    })
  })
})
