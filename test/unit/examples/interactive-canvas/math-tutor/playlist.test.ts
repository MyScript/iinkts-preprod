import { DEMO_EXERCISES } from "../../../../../examples/interactive-canvas/math-tutor/demo-exercises.js"
import { nextExercise } from "../../../../../examples/interactive-canvas/math-tutor/playlist.js"

describe("math-tutor/playlist", () => {
  const constant = () => 0.5

  describe("nextExercise", () => {
    test("should play the demo exercises of a level first, then generated ones", () => {
      const demoLevel2 = DEMO_EXERCISES.filter((exercise) => exercise.level === 2)
      demoLevel2.forEach((exercise, played) => expect(nextExercise(2, played, constant)).toBe(exercise))
      expect(nextExercise(2, demoLevel2.length, constant).id).toMatch(/^generated-/)
    })
  })
})
