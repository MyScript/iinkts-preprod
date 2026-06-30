import { TBox } from "@/iink"

test("TBox is a plain object", () => {
  const box: TBox = { x: 1, y: 2, width: 3, height: 4 }
  expect(box.x).toBe(1)
})
