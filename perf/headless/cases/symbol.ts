import type { TBenchCase } from "../lib/harness.ts"
import { sized, RESIDENT_SIZE, GEOMETRY_SYMBOL_COUNT, type TBenchFixture } from "../lib/fixture.ts"

/** Symbols: hit testing through the registry, and the geometry cache read cold and warm. */

const HIT_TEST_PASSES = 20 // 7.84 ms measured
const GEOMETRY_COLD_PASSES = 1 // 110 ms measured: above the band, one build of the set is its smallest unit
const GEOMETRY_WARM_PASSES = 1 // 0.22 ms measured, one read of the whole set

export const OBJECT = "symbol"

export function cases(f: TBenchFixture): TBenchCase[] {
  const { SymbolGeometry, symbolRegistry } = f.iink
  return [
    {
      name: sized(`symbol: hit test over all @${RESIDENT_SIZE}`, HIT_TEST_PASSES),
      fn: () => {
        let hits = 0
        for (let pass = 0; pass < HIT_TEST_PASSES; pass++) {
          for (const stroke of f.strokes) {
            if (symbolRegistry.getUtil(stroke.type)?.overlaps(stroke, f.probeBox)) {
              hits++
            }
          }
        }
        if (hits < 0) throw new Error("unreachable")
      },
    },
    {
      name: sized(`symbol: geometry cold @${GEOMETRY_SYMBOL_COUNT}`, GEOMETRY_COLD_PASSES),
      // A fresh, freshly-frozen stroke set every invocation: every read is a first read, so this is the
      // uncached path — building the f.strokes and computing their geometry, with nothing to reuse.
      fn: () => {
        f.buildFrozenGeometryStrokes().forEach((s) => SymbolGeometry.boundsOf(s))
      },
    },
    {
      name: sized(`symbol: geometry warm @${GEOMETRY_SYMBOL_COUNT}`, GEOMETRY_WARM_PASSES),
      // Same frozen f.strokes on every invocation, already warmed once above: this is a WeakMap hit per
      // symbol, drawing and hit-testing's actual read shape, not the per-frame f.renderer path — the
      // f.renderer's own pan virtualization reads `tracked.bounds`, not `SymbolGeometry`.
      fn: () => {
        f.geometryWarmStrokes.forEach((s) => SymbolGeometry.boundsOf(s))
      },
    },
  ]
}
