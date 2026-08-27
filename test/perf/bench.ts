import { installDom } from "./lib/env.ts"
import { countPointers, generateDocument } from "./lib/generateDocument.ts"
import { CONTROL_CASE, printReport, runSuite, writeReport, type TBenchCase } from "./lib/harness.ts"

installDom()

const iink = await import("#iink")
const { IIModel, MatrixTransform, StrokeOps, registerBuiltinSymbolUtils, symbolRegistry } = iink
type TStroke = ReturnType<typeof StrokeOps.create>

/**
 * Resident document size. Held at 1200 rather than the 4419 of the reference document because
 * `IIModel.addSymbol` evaluates `this.symbols` as a logger argument on every insertion, and
 * `IIModel.symbols` deep-clones the whole map — so building a document is quadratic in deep clones.
 * That cost is not hidden: it is what the `import` case below measures.
 */
const RESIDENT_SIZE = 500

/**
 * Import is measured at a smaller size for the same reason: at 500 a single iteration already costs
 * ~125 000 deep clones. These two numbers are deliberately low, and raising them is a measurable
 * acceptance criterion for the store epic: once insertion stops cloning the document, the resident
 * document should reach the 4419 strokes of the reference document without the setup dominating.
 */
const IMPORT_SIZE = 200

/** Fixed seed. The document must be identical on every machine for the ratios to mean anything. */
const SEED = 20260827

/**
 * Repeat factor for the cheap cases. A single linear hit test over 500 strokes costs ~0.03 ms, close
 * enough to the timer floor that its ratio drifted +/-15% between unchanged runs. Doing the same work
 * several times per measured operation lifts it clear of the noise without changing what is measured
 * — the ratio scales, the comparison does not care.
 */
const CHEAP_CASE_PASSES = 20

registerBuiltinSymbolUtils()

function buildStroke(generated: ReturnType<typeof generateDocument>[number]): TStroke {
  const stroke = StrokeOps.create(undefined, generated.pointerType)
  stroke.pointers.push(...generated.pointers)
  StrokeOps.updateBounds(stroke)
  return stroke
}

// The generator's whole contract is that `(count, seed)` fixes the geometry. If it ever stopped
// holding, every ratio in the baseline would silently compare two different documents, so it is
// checked here rather than trusted.
const determinismProbe = 32
if (
  JSON.stringify(generateDocument(determinismProbe, SEED)) !== JSON.stringify(generateDocument(determinismProbe, SEED))
) {
  throw new Error("generateDocument is not deterministic — the baseline would be meaningless")
}

const generated = generateDocument(RESIDENT_SIZE, SEED)
const strokes = generated.map(buildStroke)
const importSource = generateDocument(IMPORT_SIZE, SEED + 1).map(buildStroke)

// Seeding is timed and reported: on master it is the dominant cost of the whole file, because
// `addSymbol` passes `this.symbols` to the logger and that getter deep-clones the entire map.
const seedStart = performance.now()
const model = new IIModel()
for (const stroke of strokes) {
  model.addSymbol(stroke)
}
const seedMs = performance.now() - seedStart

const firstId = strokes[0].id
const probeBox = { x: 200, y: 100, width: 40, height: 40 }
const matrix = new MatrixTransform(1.02, 0.01, -0.01, 1.02, 3, -2)

/** Pre-built strokes for the append case, so generation never lands inside a measured window. */
const appendPool = generateDocument(64, SEED + 2).map(buildStroke)
let appendCursor = 0

/**
 * Control payload: plain arithmetic over a preallocated buffer, no library code whatsoever. Sized so
 * one iteration lands in the same order of magnitude as the mid-range library cases — a control that
 * is far cheaper than what it normalises makes every ratio badly conditioned.
 */
const controlBuffer = new Float64Array(65536)
for (let i = 0; i < controlBuffer.length; i++) {
  controlBuffer[i] = i * 0.5
}

const cases: TBenchCase[] = [
  {
    name: CONTROL_CASE,
    fn: () => {
      let acc = 0
      for (let i = 0; i < controlBuffer.length; i++) {
        acc += Math.sqrt(controlBuffer[i]) * 1.000001
      }
      if (acc < 0) throw new Error("unreachable")
    },
  },
  {
    name: `import: build a model of ${IMPORT_SIZE} strokes`,
    fn: () => {
      const fresh = new IIModel()
      for (const stroke of importSource) {
        fresh.addSymbol(stroke)
      }
    },
  },
  {
    name: `append: add then remove one stroke @${RESIDENT_SIZE}`,
    fn: () => {
      const stroke = appendPool[appendCursor]
      appendCursor = (appendCursor + 1) % appendPool.length
      model.addSymbol(stroke)
      model.removeSymbol(stroke.id)
    },
  },
  {
    name: `read: model.symbols @${RESIDENT_SIZE}`,
    fn: () => {
      void model.symbols
    },
  },
  {
    name: `read: getRootSymbol by id @${RESIDENT_SIZE} x${CHEAP_CASE_PASSES}`,
    fn: () => {
      for (let i = 0; i < CHEAP_CASE_PASSES; i++) {
        void model.getRootSymbol(firstId)
      }
    },
  },
  {
    name: `derive: recompute derived fields for all @${RESIDENT_SIZE} x${CHEAP_CASE_PASSES}`,
    fn: () => {
      for (let pass = 0; pass < CHEAP_CASE_PASSES; pass++) {
        for (const stroke of strokes) {
          symbolRegistry.getUtil(stroke.type)?.updateDerivedFields(stroke)
        }
      }
    },
  },
  {
    name: `hit test: linear overlaps over all @${RESIDENT_SIZE} x${CHEAP_CASE_PASSES}`,
    fn: () => {
      let hits = 0
      for (let pass = 0; pass < CHEAP_CASE_PASSES; pass++) {
        for (const stroke of strokes) {
          if (symbolRegistry.getUtil(stroke.type)?.overlaps(stroke, probeBox)) {
            hits++
          }
        }
      }
      if (hits < 0) throw new Error("unreachable")
    },
  },
  {
    name: `transform: matrix over every pointer @${RESIDENT_SIZE} x${CHEAP_CASE_PASSES}`,
    fn: () => {
      for (let pass = 0; pass < CHEAP_CASE_PASSES; pass++) {
        for (const stroke of strokes) {
          for (const pointer of stroke.pointers) {
            void MatrixTransform.applyToPoint(matrix, pointer)
          }
        }
      }
    },
  },
]

const outFile = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : ".local/bench/current.json"
const repeats = process.argv.includes("--repeats") ? Number(process.argv[process.argv.indexOf("--repeats") + 1]) : 3

const report = await runSuite(cases, { repeats })
const dataset = `${RESIDENT_SIZE} strokes / ${countPointers(generated)} pointers, seed ${SEED}`
console.log(`dataset: ${dataset}`)
console.log(`seeding the resident document via addSymbol: ${seedMs.toFixed(0)} ms`)
printReport(report)
writeReport({ ...report, dataset, seedMs }, outFile)
console.log(`\nreport written to ${outFile}`)
