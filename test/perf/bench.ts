import { installDom } from "./lib/env.ts"
import { countPointers, generateDocument } from "./lib/generateDocument.ts"
import { CONTROL_CASE, printReport, runSuite, writeReport, type TBenchCase } from "./lib/harness.ts"

installDom()

const iink = await import("#iink")
const { IIModel, MatrixTransform, StrokeOps, SymbolGeometry, registerBuiltinSymbolUtils, symbolRegistry } = iink
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
 * How many times each case repeats its own unit of work per measured operation.
 *
 * There used to be one shared factor of 20 here, which is the same mistake as one shared threshold:
 * the cases span seven orders of magnitude, so a single number cannot put them all in a measurable
 * band. Measured at 20 passes, one iteration of `getRootSymbol` cost 0.00003 ms — below the
 * resolution of `performance.now()`, so it timed the clock rather than the code, and then failed CI
 * at +21% against a 15% limit on a tree nobody had touched.
 *
 * Each factor below is therefore chosen from a measurement, targeting **0.1-10 ms per iteration**:
 * high enough that timer overhead is negligible, low enough that a run stays affordable when every
 * case is later measured twice, once per build. A case whose smallest indivisible unit already costs
 * more than the band keeps a factor of 1 and sits above it.
 *
 * These are constants, not calibrated at runtime, on purpose: the two sides of an A/B comparison must
 * do byte-for-byte the same work, and a factor recomputed per run would not guarantee that.
 */
const IMPORT_PASSES = 16 // 0.030 ms measured x1 -> ~0.5 ms
const APPEND_PASSES = 1000 // 0.0003 ms measured x1 -> ~0.3 ms
const SYMBOLS_READ_PASSES = 200 // 0.0015 ms measured x1 -> ~0.3 ms
const GET_ROOT_PASSES = 100_000 // below timer resolution at x20 -> see the sink in the case below
const HIT_TEST_PASSES = 20 // 7.6 ms measured, already in band
const TRANSFORM_PASSES = 20 // 4.0 ms measured, already in band
const GEOMETRY_COLD_PASSES = 1 // one build of the whole set is its smallest unit
const GEOMETRY_WARM_PASSES = 1 // one read of the whole set is its smallest unit

/**
 * Case names carry their repeat factor so a report can never be read as if it measured a single pass.
 * A factor of 1 adds nothing: the name of a case that does its work once should not claim a multiple.
 */
function sized(name: string, passes: number): string {
  return passes > 1 ? `${name} x${passes}` : name
}

registerBuiltinSymbolUtils()

function buildStroke(generated: ReturnType<typeof generateDocument>[number]): TStroke {
  const stroke = StrokeOps.create(undefined, generated.pointerType)
  // Pushed verbatim, not through `addPointer`: that path runs the acquisition-delta filter and
  // rewrites every `p` via `_computePressure`, so the resident document would stop being the one
  // `baseline.json` was measured against. Nothing replaces the `updateBounds` call that used to
  // follow — a stroke's box is derived on read now.
  generated.pointers.forEach((p) => StrokeOps.addPointer(stroke, p))
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

/**
 * Volume of the reference document used to diagnose the pan-latency bug (see
 * `.local/v5-symbol-geometry-matrix/BASELINE.md`), reused here so the cache is measured at the size
 * that made the read cost visible in the first place.
 */
const GEOMETRY_SYMBOL_COUNT = 4419
const GEOMETRY_POINTS_PER_STROKE = 40

/**
 * `SymbolGeometry` only caches for a frozen symbol — an unfrozen one is recomputed on every call, by
 * design. `Object.freeze` here is what makes a "warm" measurement possible at all: without it every
 * call below would silently take the uncached path and the two cases would measure the same thing.
 */
function buildFrozenGeometryStrokes(): TStroke[] {
  return Array.from({ length: GEOMETRY_SYMBOL_COUNT }, (_, i) =>
    Object.freeze(
      StrokeOps.createFromPartial({
        pointers: Array.from({ length: GEOMETRY_POINTS_PER_STROKE }, (_, j) => ({
          x: i + j,
          y: i - j,
          t: j,
          p: 1,
        })),
      })
    )
  )
}

/**
 * Cached geometry is deep-frozen before it is stored, and for a stroke `vertices` is `pointers`
 * itself — reading geometry once therefore freezes the stroke's own arrays. These strokes exist only
 * to be read, never mutated after, so that is never a problem here.
 */
const geometryWarmStrokes = buildFrozenGeometryStrokes()
geometryWarmStrokes.forEach((s) => SymbolGeometry.boundsOf(s))

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
    name: sized(`import: build a model of ${IMPORT_SIZE} strokes`, IMPORT_PASSES),
    fn: () => {
      for (let pass = 0; pass < IMPORT_PASSES; pass++) {
        const fresh = new IIModel()
        for (const stroke of importSource) {
          fresh.addSymbol(stroke)
        }
      }
    },
  },
  {
    name: sized(`append: add then remove one stroke @${RESIDENT_SIZE}`, APPEND_PASSES),
    fn: () => {
      for (let pass = 0; pass < APPEND_PASSES; pass++) {
        const stroke = appendPool[appendCursor]
        appendCursor = (appendCursor + 1) % appendPool.length
        model.addSymbol(stroke)
        model.removeSymbol(stroke.id)
      }
    },
  },
  {
    name: sized(`read: model.symbols @${RESIDENT_SIZE}`, SYMBOLS_READ_PASSES),
    fn: () => {
      let seen = 0
      for (let pass = 0; pass < SYMBOLS_READ_PASSES; pass++) {
        seen += model.symbols.length
      }
      if (seen < 0) throw new Error("unreachable")
    },
  },
  {
    name: sized(`read: getRootSymbol by id @${RESIDENT_SIZE}`, GET_ROOT_PASSES),
    // The lookup's result was discarded through `void`, which let V8 remove part of the work: the
    // case reported 1.6 ns per `Map.get`, below what a real one costs. Counting the hits makes the
    // call observable, the same way the hit test case does.
    fn: () => {
      let found = 0
      for (let i = 0; i < GET_ROOT_PASSES; i++) {
        if (model.getRootSymbol(firstId) !== undefined) found++
      }
      if (found < 0) throw new Error("unreachable")
    },
  },
  {
    name: sized(`hit test: linear overlaps over all @${RESIDENT_SIZE}`, HIT_TEST_PASSES),
    fn: () => {
      let hits = 0
      for (let pass = 0; pass < HIT_TEST_PASSES; pass++) {
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
    name: sized(`transform: matrix over every pointer @${RESIDENT_SIZE}`, TRANSFORM_PASSES),
    fn: () => {
      for (let pass = 0; pass < TRANSFORM_PASSES; pass++) {
        for (const stroke of strokes) {
          for (const pointer of stroke.pointers) {
            void MatrixTransform.applyToPoint(matrix, pointer)
          }
        }
      }
    },
  },
  {
    name: sized(`symbolGeometry:cold @${GEOMETRY_SYMBOL_COUNT}`, GEOMETRY_COLD_PASSES),
    // A fresh, freshly-frozen stroke set every invocation: every read is a first read, so this is the
    // uncached path — building the strokes and computing their geometry, with nothing to reuse.
    fn: () => {
      buildFrozenGeometryStrokes().forEach((s) => SymbolGeometry.boundsOf(s))
    },
  },
  {
    name: sized(`symbolGeometry:warm @${GEOMETRY_SYMBOL_COUNT}`, GEOMETRY_WARM_PASSES),
    // Same frozen strokes on every invocation, already warmed once above: this is a WeakMap hit per
    // symbol, drawing and hit-testing's actual read shape, not the per-frame renderer path — the
    // renderer's own pan virtualization reads `tracked.bounds`, not `SymbolGeometry`.
    fn: () => {
      geometryWarmStrokes.forEach((s) => SymbolGeometry.boundsOf(s))
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
