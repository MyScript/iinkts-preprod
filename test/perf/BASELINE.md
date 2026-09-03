# E1 baseline — IIC-1946 · IIC-1951

**Re-recorded 2026-09-02** on `IIC-1946-tooling-and-measurement-…`, after that branch was rebased onto
`IIC-1982`. The tree is master — which by then had absorbed E3 and IIC-1976/1977/1978 — plus this
epic's tooling, IIC-1980 and IIC-1982.

Deliberately no commit SHA: a commit cannot cite its own hash stably, and the previous version of this
file proved it — see below. Identify the tree by what is in it, and reach the superseded figures
through this file's own git history.

Machine: 11th Gen Intel Core i7-11850H @ 2.50GHz, node v25.2.1, Chromium via Playwright.
Measured against a **production** `dist/` (`yarn build:lib`), which the bench requires — see *Gotchas*.

### Why it was re-recorded, and what that taught us

The previous figures were recorded 2026-08-27 and said they described master, naming a commit SHA.
After the rebase that SHA was **no longer an ancestor of this branch** — the rebase rewrote E1's
commits — and its parent turned out to be another E1 commit rather than master. So the provenance the
file claimed could not be checked from here, and any perf claim made against it was a claim against an
unverifiable reference. That is why this version names no SHA.

Worse, it read as a **false regression**. Against the old file the gate failed with four cases 16.7% to
39.0% over their limits, including `derive` at +39%. None of it was real: the source of every regressed
case was unchanged (`cloneSymbol` had zero commits since; `IIModel.ts` had exactly one, an import path
moving from `@/utils` to `@/core/std`). The old baseline had simply recorded an unrepresentatively tight
dispersion for the noisy cases, so their own variance cleared a 15% threshold.

With dispersion recorded honestly, the harness's own `too noisy … (not gated)` mechanism engages and
the gate passes. **Three of the eight cases are too noisy to gate at all** — `derive`, `append` and
`transform` — so the gate effectively judges five. Two consecutive runs of the identical tree put
`derive` at x132.01 and x107.65, a 23% spread, which is why.

**Consequence for any perf epic:** `derive` and `transform` cannot be measured by this harness at usable
precision. Do not plan work whose only evidence would be a movement in those two cases.

### Gotchas

- The bench imports `#iink` → `dist/iink.esm.js`, so it needs a **production** build. A dev build
  (`yarn dev`) injects a livereload snippet whose first statement touches `self.document`, and the bench
  dies with `ReferenceError: self is not defined` — a message that names nothing useful. Run
  `yarn build:lib` first.
- The baseline uses 7 processes (`BENCH_BASELINE_RUNS`), a gate run uses 5 (`BENCH_RUNS`). That
  asymmetry is deliberate and documented in `runCurrent.ts`; the gate compares medians. Set
  `BENCH_RUNS=7` to remove it from an investigation.

This file is the prose companion to `test/perf/baseline.json`: the JSON is what the gate compares
against, this is what a human reads to know what the numbers mean and who owns them. Both are
committed on purpose — a baseline that lives only in a gitignored directory cannot be cited by the
epics it constrains.

---

## What "faster" will mean

Every later epic in the v5 plan set justifies itself against a row below. A row that no epic claims
is a row nobody is allowed to regress.

---

## Static counters on master

| counter | value | which epic moves it |
|---|---|---|
| `.ts` files in `src/` | 308 | E3, E4 |
| lines in `src/` | 44 888 | — |
| linear scans over `model.symbols` | **66** | E6 |
| `structuredClone` call sites | **13** in 7 files | E5 |
| spatial index | **none** | E6 |
| `dist/iink.min.js` | 632 345 B | E9 (tree-shaking) |
| `dist/iink.esm.js` | 618 060 B | E9 |
| runtime npm dependencies | 1 (`json-css`, `src/style/StyleHelper.ts` only) | E2 |

## Micro-benches — `yarn bench`

Seeded document, 500 strokes / 7876 pointers. Ratios are against an in-run control case; the
baseline is the median of **7 independent processes**, and the spread is their relative MAD.

| case | ms | of control | spread |
|---|---|---|---|
| seeding 500 strokes through `addSymbol` | **5419** | — | — |
| import: build a model of 200 strokes | 558 | x4930 | 7.0% |
| append: add then remove one stroke @500 | **29.2** | x284 | 7.4% |
| read: `model.symbols` @500 | 14.1 | x139 | 6.4% |
| derive: recompute derived fields, 20 passes | 5.9 | x119 | 7.6% |
| transform: matrix over every pointer, 20 passes | 0.61 | x12.4 | 2.2% |
| hit test: linear overlaps over all, 20 passes | 0.32 | x6.4 | 9.8% |
| read: `getRootSymbol` by id, 20 lookups | 0.30 | x6.2 | 9.0% |

## Browser scenarios — `yarn bench:e2e`

Document of 150 strokes, Desktop Chrome. Blocking time is the primary figure; wall clock includes the
websocket round trip and is reported only for context.

| scenario | wall | blocking | longest task | frames p50 / p95 / max | dropped |
|---|---|---|---|---|---|
| import 150 strokes | 687 ms | 0 ms | 0 ms | 16.7 / 534.1 / 534.1 ms | 1 |
| write one stroke | 752 ms | 0 ms | 0 ms | 16.6 / 20.1 / 51.1 ms | 1 |
| pan, 90 frames | 1499 ms | 0 ms | 0 ms | 16.7 / 18.5 / 22.8 ms | 0 |
| zoom, 30 steps | 493 ms | 0 ms | 0 ms | 16.4 / 19.6 / 19.6 ms | 0 |
| **drag 150 selected symbols** | 2529 ms | **1036 ms** | **974 ms** | 11.9 / 53.8 / **978.8 ms** | **26** |

---

## What the baseline says, and it is not what the archived plans assumed

**The cost on master is cloning, not searching.**

A linear hit test over 500 strokes costs **0.016 ms per pass**. The spatial index that three archived
plans were built around is not where the time is at any document size a user reaches through the
public API today — because that API cannot build a large document in the first place.

Adding **one** stroke to a 500-stroke document costs **29 ms**, near two frames.
`src/model/IIModel.ts:94` reads:

```ts
this.#logger.debug("addSymbol", this.symbols)
```

`IIModel.symbols` is `Array.from(map.values(), cloneSymbol)` and `cloneSymbol` is
`structuredClone`. Arguments are evaluated whatever the log level, so every insertion deep-clones
the whole document. Seeding 500 strokes through the public API therefore costs 5.4 s, and the
micro-bench sizes had to be capped at 500 resident / 200 imported because of it.

The browser narrows it further. Writing, panning and zooming hold 60 Hz on master with **zero**
blocking time. Dragging a selection of 150 symbols freezes the main thread for **974 ms in a single
task**. The import row's 534 ms frame is the websocket round trip, not jank.

## Acceptance criteria this baseline creates

| criterion | epic |
|---|---|
| the micro-bench resident document reaches 4419 strokes without setup dominating | E5 (store) |
| `append` on a loaded document costs a frame or less | E5 |
| `drag N selected symbols` shows no task above 50 ms | E5 |
| `structuredClone` call sites reach 0 | E5 |
| the 66 linear scans reach the "legitimate full walk" set only | E6 |
| a document of 4419 strokes still holds 60 Hz on pan | E8 |
| an INK_V2-only bundle is materially smaller than 632 kB | E9 |

## How to reproduce

```
yarn bench:baseline   # 7 independent processes, writes test/perf/baseline.json
yarn bench            # one run, writes .local/bench/current.json
yarn bench:gate       # compares the two, exits non-zero on regression
yarn bench:e2e        # browser scenarios, writes .local/bench/perf-e2e.json
```

The gate compares ratios, never absolute milliseconds, and derives each case's threshold from that
case's own dispersion measured across independent processes. Verified both ways on 2026-08-27: a 20%
slowdown injected into `MatrixTransform.applyToPoint` is caught at +20.0%, and two unchanged runs
pass.
