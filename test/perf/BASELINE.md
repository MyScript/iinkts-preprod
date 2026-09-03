# Perf baseline — E1 (`IIC-1946`, `IIC-1951`) · re-recorded for E5 (`IIC-1967`)

**Re-recorded 2026-09-03** on `IIC-1967-immutable-store-write-contract`. That branch sits on top of
E1's tooling, so the tree is: master (which had absorbed E3 and IIC-1976/1977/1978/1980/1982) plus
E1's harness, plus E1's `perf(model): stop cloning the document on every mutation`, plus E5's
immutable store and write contract.

Master's own three extra commits (`Jenkinsfile`, `package.json`, `test/unit/jest.config.js` — the
coverage gate) are not in this tree and cannot move any figure here, so this baseline is valid for the
merged result.

Deliberately no commit SHA: a commit cannot cite its own hash stably, and an earlier version of this
file proved it — see *What re-recording taught us*. Identify the tree by what is in it, and reach the
superseded figures through this file's own git history.

Machine: 11th Gen Intel Core i7-11850H @ 2.50GHz, node v25.2.1, Chromium via Playwright.
Measured against a **production** `dist/` (`yarn build:lib`), which the bench requires — see *Gotchas*.

## Why this re-record was necessary, and what it is not

E5 deliberately moves cost from read to write: records are deep-frozen once at commit, and nothing is
cloned on read. Two consequences had to be absorbed into the reference rather than reported as
regressions:

- **`hit test` got genuinely slower — x7.27 → x67.80 of control, +779% against E1's baseline.** The
  case's code is byte-identical between the two branches; what changed is that its data is now frozen,
  and property access on a frozen object is slower in V8. Measured independently at the reference
  document size: **0.425 ms → 3.182 ms per full pass over 4419 strokes, a 7.5× ratio and +2.76 ms
  absolute.** Against a 16.7 ms frame budget that is not perceptible — a click goes from 0.4 ms to
  3 ms — and it buys the read and write wins below. It is recorded here, not treated as a defect, and
  it is not something this code can tune away; if a future change ever puts a full hit-test scan inside
  a per-frame loop, the way out is E6's spatial index cutting the candidate set, not unfreezing.
- **`derive` is not comparable to any pre-E5 figure, by construction.** Committed records are frozen,
  so deriving in place throws; the case now goes through `draftSymbol` → `updateDerivedFields` →
  `commitSymbol`, which is what production code does. Its 449 ms therefore includes 10 000
  draft-and-commit round trips and says nothing about the derivation itself.

**Do not read this re-record as the gate being loosened.** No threshold was changed. The gate caught
the frozen-access cost on its own, at +779% against a 36% limit, which is the tooling working.

## What re-recording taught us, kept from the 2026-09-02 version

The figures before that date claimed to describe master and named a commit SHA. After E1 was rebased
that SHA was **no longer an ancestor of the branch**, and its parent turned out to be another E1 commit
rather than master. The provenance the file claimed could not be checked from the tree that cited it.
That is why no version since names a SHA.

It also read as a **false regression**: the gate failed with four cases 16.7%–39.0% over their limits,
`derive` at +39%, none of it real — the source of every regressed case was unchanged. The old baseline
had recorded an unrepresentatively tight dispersion, so the noisy cases' own variance cleared a 15%
threshold. **Symptom to recognise: a "regression" on a case whose source provably did not change.**

**All eight cases are now gated — the three that could not be, can.** The 2026-09-02 version recorded
`derive`, `append` and `transform` as permanently `too noisy … (not gated)`, and concluded that no perf
epic could ever be justified by a movement in them. That was a property of the tree, not of the
harness: the quadratic clone on every mutation made each case's timing depend on model size and GC
pressure. With it gone the dispersion collapsed — `derive` MAD ±2.5%, `append` ±2.8%, `transform`
±4.2% — and the gate now judges all eight with limits of 15–30%. The earlier conclusion is retracted.

## Gotchas

- The bench imports `#iink` → `dist/iink.esm.js`, so it needs a **production** build. A dev build
  (`yarn dev`) injects a livereload snippet whose first statement touches `self.document`, and the bench
  dies with `ReferenceError: self is not defined` — a message that names nothing useful. Run
  `yarn build:lib` first.
- The baseline uses 7 processes (`BENCH_BASELINE_RUNS`), a gate run uses 5 (`BENCH_RUNS`). That
  asymmetry is deliberate and documented in `runCurrent.ts`; the gate compares medians. Set
  `BENCH_RUNS=7` to remove it from an investigation.
- `yarn typecheck` **excludes `test/perf` and `test/perf-e2e`** (see `tsconfig.typecheck.json`), apart
  from `lib/gate.ts` and `lib/stats.ts` which are listed explicitly. A green typecheck says nothing
  about the rest of either directory.
- **`import` is a flake risk against this baseline and will eventually fail CI on an unchanged tree.**
  Three gate runs on the identical tree that produced this baseline reported +12.4%, +14.6% and
  +4.2% against a **15%** limit. Its recorded dispersion (MAD ±4.1%, tail ±8.6%) yields
  1.5 × 8.6 = 12.9%, so the case falls back to the 15% floor — and its real run-to-run drift is
  larger than that floor. The case is now so cheap (0.031 ms) that it sits near the timer floor,
  which is where the drift comes from. **Fix it by raising `IMPORT_SIZE` so the case costs enough to
  measure, not by widening the threshold**, and re-record. Until then, a lone `import` regression
  between 15% and 20% is noise, and the way to tell is to re-run rather than to bisect.
- `yarn bench:e2e` is **not** run by CI — the Jenkinsfile runs `bench:ci` and `bench:gate` only. The
  browser scenarios are a manual instrument.
- The seed loop passes the *same* stroke objects to `addSymbol`, so since E5 those objects are frozen
  by the commit. Any case that iterates `strokes` is therefore measuring frozen records. This is
  intentional — it is what the library hands out — but it means a case cannot be assumed to measure
  plain objects just because it never touches the model.

This file is the prose companion to `test/perf/baseline.json`: the JSON is what the gate compares
against, this is what a human reads to know what the numbers mean and who owns them. Both are
committed on purpose — a baseline that lives only in a gitignored directory cannot be cited by the
epics it constrains.

---

## Static counters

| counter | master baseline | now | which epic moves it |
|---|---|---|---|
| `.ts` files in `src/` | 308 | 322 | E3, E4 |
| lines in `src/` | 44 888 | 45 306 | — |
| linear scans over `model.symbols` | 66 | see note | E6 |
| `structuredClone` call sites | 13 in 7 files | **13 in 7 files** | E5 |
| spatial index | none | none | E6 |
| `dist/iink.min.js` | 632 345 B | 634 459 B | E9 (tree-shaking) |
| `dist/iink.esm.js` | 618 060 B | 620 243 B | E9 |
| runtime npm dependencies | 1 (`json-css`) | 1 (`json-css`) | E2 |

**The "66 linear scans" counter is not reproducible and should be replaced before E6 relies on it.**
The original 66 was recorded without its grep pattern, and the count swings wildly with the pattern
chosen: 46 for iteration methods on `.symbols` alone, 83 once `.symbolsSelected` is included, 211 for
every `.symbols` mention. Three plausible readings straddle the number the epic is supposed to drive
to zero. E6 needs to define what it counts — a committed script, not a remembered `grep` — before it
can claim to have moved it. Until then treat 66 as folklore.

The `structuredClone` count did not move, and the E5 acceptance criterion that asked for zero is
**not met**. What E5 removed was the clone on every *read* of the interactive document; the thirteen
remaining sites are elsewhere and mostly legitimate — `SymbolStore.draftSymbol` clones on purpose
(that is how a frozen record becomes writable), and the rest are in `Model`, `IModel` and
`symbol/legacy/Stroke`, which serve the non-interactive canvas variants. The criterion was written
against a counter, not against a behaviour, and the counter was the wrong instrument.

## Micro-benches — `yarn bench`

Seeded document, 500 strokes / 7876 pointers, seed 20260827. Ratios are against an in-run control
case; the baseline is the median of **7 independent processes**, and the spread is their relative MAD.

| case | ms | of control | spread | vs master baseline |
|---|---|---|---|---|
| seeding 500 strokes through `addSymbol` | **15.2** | — | — | 5419 ms → **357× faster** |
| import: build a model of 200 strokes | 0.031 | x0.28 | 4.1% | 558 ms → **~18 000× faster** |
| append: add then remove one stroke @500 | 0.00027 | x0.00 | 2.8% | 29.2 ms → **~107 000× faster** |
| read: `model.symbols` @500 | 0.0014 | x0.01 | 11.3% | 14.1 ms → **~10 200× faster** |
| read: `getRootSymbol` by id, 20 lookups | 0.00003 | x0.00 | 1.0% | 0.30 ms → **~10 000× faster** |
| hit test: linear overlaps over all, 20 passes | 6.89 | x67.80 | 1.0% | 0.32 ms → **21× slower** (frozen) |
| transform: matrix over every pointer, 20 passes | 3.07 | x32.29 | 4.2% | 0.61 ms → 5× slower (frozen) |
| derive: recompute derived fields, 20 passes | 449.5 | x4373 | 2.5% | **not comparable** — case rewritten |

The two "slower" rows and the eight-of-eight gating are the same phenomenon seen from two sides: the
frozen-record read path costs more per access, and it costs it *predictably*, which is why cases that
were unmeasurable are now measurable.

`RESIDENT_SIZE` is still 500 and `IMPORT_SIZE` still 200. Seeding 500 strokes now costs 15 ms instead
of 5.4 s, so the cap that forced those sizes is gone and the resident document can be raised to the
reference 4419 — that work is simply not done yet.

## Browser scenarios — `yarn bench:e2e`

Desktop Chrome. Blocking time is the primary figure; wall clock includes the websocket round trip and
is reported only for context. There is no longer a document-size ceiling on these scenarios — see the
comment at the top of `test/perf-e2e/scenarios.perf.ts` for why there was one and why it went.

Document of 150 strokes, the size the master baseline used:

| scenario | wall | blocking | longest task | frames p50 / p95 / max | dropped |
|---|---|---|---|---|---|
| import 150 strokes | 189 ms | 0 ms | 0 ms | 16.8 / 88.2 / 88.2 ms | 1 |
| write one stroke | 693 ms | 0 ms | 0 ms | 16.6 / 18.0 / 18.7 ms | 0 |
| pan, 90 frames | 1506 ms | 0 ms | 0 ms | 16.7 / 18.0 / 18.7 ms | 0 |
| zoom, 30 steps | 493 ms | 0 ms | 0 ms | 16.7 / 17.3 / 19.2 ms | 0 |
| **drag 150 selected symbols** | 569 ms | **0 ms** | 0 ms | 16.8 / 22.0 / 36.0 ms | 1 |
| erase across 150 strokes | 690 ms | 0 ms | 0 ms | 16.5 / 19.2 / 20.2 ms | 0 |
| lasso over 150 strokes | 712 ms | 0 ms | 0 ms | 16.6 / 18.8 / 20.8 ms | 0 |

Document of 4419 strokes, the reference size, which the harness can now reach:

| scenario | wall | blocking | longest task | frames p50 / p95 / max | dropped |
|---|---|---|---|---|---|
| import 4419 strokes | 5336 ms | 0 ms | 0 ms | 16.7 / 17.6 / **2434 ms** | 1 |
| write one stroke | 736 ms | 0 ms | 0 ms | 16.7 / 20.0 / 21.7 ms | 0 |
| pan, 90 frames | 1504 ms | 0 ms | 0 ms | 16.7 / 18.1 / 27.0 ms | 0 |
| zoom, 30 steps | 491 ms | 0 ms | 0 ms | 16.6 / 17.4 / 18.2 ms | 0 |
| **drag 4419 selected symbols** | 1620 ms | **674 ms** | **674 ms** | 16.9 / 38.4 / **679 ms** | **8** |
| erase across 4419 strokes | 707 ms | 0 ms | 0 ms | 16.6 / 19.9 / 26.5 ms | 0 |
| lasso over 4419 strokes | 1019 ms | 0 ms | 0 ms | 17.0 / 30.6 / 41.4 ms | 1 |

**`blockingMs` does not see a long task raised inside an awaited `page.evaluate`.** The import row
reports 0 ms blocking next to a 2434 ms frame. Read `frameMaxMs` for anything driven from inside the
page, and `blockingMs` for anything driven through the pointer.

**Dragging a full selection is the one interaction that still janks, and it scales linearly.**
Measured across sizes: 0 ms at 150, 285 ms at 2000, 455 ms at 3000, 674–889 ms at 4419 — always a
**single** long task, roughly 0.2 ms per selected symbol. It is the largest unfixed perf defect the
harness can see, and it was invisible until the scenario stopped skipping above 1000 strokes.

## Acceptance criteria this baseline creates, and where they stand

| criterion | epic | status |
|---|---|---|
| the micro-bench resident document reaches 4419 strokes without setup dominating | E5 | **unblocked, not done** — seeding 500 costs 15 ms, the cap can be lifted |
| `append` on a loaded document costs a frame or less | E5 | **met** — 0.00027 ms |
| `drag N selected symbols` shows no task above 50 ms | E5 | **met at 150** (0 ms), **not met at 4419** (674 ms) |
| `structuredClone` call sites reach 0 | E5 | **not met** — 13 remain; see *Static counters* for why the counter was the wrong target |
| the 66 linear scans reach the "legitimate full walk" set only | E6 | **unmeasurable as written** — the counter is not reproducible, see *Static counters* |
| a document of 4419 strokes still holds 60 Hz on pan | E8 | **met** — p95 18.1 ms, 0 dropped frames at 4419 |
| an INK_V2-only bundle is materially smaller than 634 kB | E9 | not started |

## How to reproduce

```
yarn build:lib        # required: the bench needs a production dist
yarn bench:baseline   # 7 independent processes, writes test/perf/baseline.json
yarn bench            # one run, writes .local/bench/current.json
yarn bench:ci         # 5 processes, what CI runs
yarn bench:gate       # compares against the baseline, exits non-zero on regression
PERF_E2E_DOCUMENT=4419 PROJECT="Desktop Chrome" yarn bench:e2e   # browser scenarios
```

The gate compares ratios, never absolute milliseconds, and derives each case's threshold from that
case's own dispersion measured across independent processes. Verified both ways on 2026-08-27: a 20%
slowdown injected into `MatrixTransform.applyToPoint` is caught at +20.0%, and two unchanged runs
pass. Verified again on 2026-09-03, twice: it caught E5's frozen-access cost at +779% against a 36%
limit without being asked to, and against *this* baseline a slowdown injected into
`MatrixTransform.applyToPoint` was caught on `transform` at +69.6% against a 30% limit — a case that
the previous baseline could not gate at all. Reverted immediately after; the gate is green on the
committed tree.
