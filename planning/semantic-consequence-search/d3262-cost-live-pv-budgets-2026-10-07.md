# D3262 complete provider-line budgets and fresh-source sensitivity

Disposable RFC-0000 research, not production search. D3262 remains doing and
the semantic-consequence-search RFC remains draft. Routine tracking and hashes
are maintained automatically, without an owner approval.

## Independent source boundary — D3505

A permanent regression reproduces the predecessor's failure on a preserved real
capture: erase `providerPv`, recompute the outer capture digest/byte count, and
the old independent checker still accepts the record. The regression failed with
`AssertionError not raised` before the repair. This establishes an instrument
gap, not that the actual engine queried the wrong position. `[V]` terminal
`make semantic-search-cost-independent-test` result and
`tools/d3262-search-calibration/cost-independent.test.py`.

Independent replay now requires exactly one requested Stockfish query at the
literal root FEN, declared budget and full legal root MultiPV width. The receipt's
candidate entry supplies exactly one clipped path for each target, in declared
order. A failed source supplies neither entry nor observations; terminal and
no-target cases make no queries. This arm records zero traversal visits and
never invents continuations to extend a short PV. `[V]`
`cost-independent.py::verify_pv_population` and `cost-execution.mjs`.

Twenty-six boundary tests pass. Real-record controls explicitly reseal a missing
entry, a foreign root with identical legal moves, and an invented traversal
count. The changed fullmove counter does not invalidate the provider's legal
table, so legality alone cannot reject that crossed root. Eleven corruptions
of the immutable initial six-row capture refuse after repair. `[V]` successful
normal independent Make outputs, checker and permanent tests.

## Fresh/frozen comparison boundary

`cost-pv-sensitivity.mjs` requires all three complete PV setting populations,
every declared candidate, both horizons and all three regimes. It refuses
partial/duplicate/foreign populations and lost target projections. Every actual
successful cold/warm pair must retain identical compiled evidence; failed cold
queries and unavailable warm receipts stay explicit. A cached source is not
an independent repeat. No-target and provider-off cases remain in the inventory.
Only four-ply cold target outcomes are compared to the frozen four-ply reference;
two-ply results cannot borrow that verdict. `[V]` fourteen passing synthesis
controls and `cost-pv-sensitivity.mjs`.

The comparison separately retains line, raw score domain/value, rank, coherent
depth and grounded target outcome. Immediate preserved opportunity is normalized
to the same meaning on both sides, not falsely counted as new reach. Failed
sources remain unpaired, not absent or changed proof. Source-version,
configuration, timing and search effects are not individually identified by this
descriptive comparison. No difference is an engine causal explanation. `[V]`
synthesis implementation and controls; immutable common reference remains
`d3262-coherent-five-approach-comparison.json.gz`.

## Warm-source boundary — D3506

The first complete two-setting capture retains all 2,316 requested cases, but
its unchanged admission gate refuses it. The four-ply `pv:movetime100` case for
`d1023:22769455c8ed5d0c` / `f6g8` has a cold `invalid_source` outcome:
the literal table contains a bound-only score. Its warm case has an empty cache,
executes another successful query, and has zero cache hits. That is a fresh
source execution labelled warm, not measured dependency reuse. `[V]` preserved
`triplet-002409.json.gz` in the rejected archive and terminal capture refusal.

The complete rejected envelope is preserved without rewriting source snapshots,
metadata, compressed triplets or clocks. SHA-256:
`d163aee0406fccfbee571d59ef8e0cd657da53130d672ce3294943868825f927`.
It explicitly says `lossless_refused_cost_capture_not_admitted_measurement` and
cannot enter the normal admitted-cost reader. Nine controls reject false
refusals, dropped cases, altered source/triplet bytes and filtered declarations.
`[V]` canonical refused writer, archive and `cost-refusal.test.mjs`.

Three permanent regressions fail before the warm-boundary repair. Warm now
admits only an exact matching cold receipt; a cache miss is typed unavailable,
including changed FEN, budget, width, source identity or Maia history. It never
starts a fresh provider query. The primary and independent readers also refuse
a warm executed source, even if another dependency had a legitimate cache hit.
Cold invalid/timeout outcomes remain distinct from missing warm receipts; they
are retained as failed pairs, not relabelled cache successes. `[V]`
`CostDependencies.query`, execution/contract/model-source boundary controls,
independent checker and fresh-source synthesis.

A separately declared **entire setting** can be projected losslessly from the
refused parent only if all candidates, horizons and regimes remain and the
unchanged admission rules pass. Its original parent digest/range, source snapshots
and exact compressed triplets remain bound and checked. No individual failing
case may be removed. The independent replay is still a separate obligation.
The 100-ms setting instead needs a distinct repaired capture; it cannot replace
or restamp the first rejected measurement. `[V]` `cost-refusal.mjs` and normal
cost-package reader.

The complete depth-12 setting passes independent replay: all 1,158 cases,
728 target observations and eleven resealed corruption refusals. The projected
archive SHA-256 is
`b0adb831f234d7d1008898fd34d8546e3393588037ef1a4ac9a11940a378c22c`;
its original parent metadata and bytes remain available above. The previous
depth-8 population also passes the stronger checker again: six + 1,152 rows,
four + 724 observations and eleven corruptions refused in each batch. `[V]`
terminal independent Make outputs and immutable archives.

## Verification boundary and work remaining

The separate repaired 100-ms capture retains all 1,158 requested cases and
passes unchanged plan admission: 708 available, 362 source-unavailable,
four invalid-source and 84 no-target rows. All four invalid cold tables remain
literal; their warm partners report missing receipts, and no warm operation
executes a fresh source query. Independent replay retains 720 target observations
and rejects eleven resealed corruptions. This is a distinct repair repeat, not
a replacement for the first rejected capture. `[V]` original metadata/triplets,
normal capture/independent Make outputs and complete state census.

The repaired archive SHA-256 is
`58399dbb39571e1b32936039b60cb5a47c183f24bb823a1328b74b3aa049b58a`.
With preserved depth-8 and complete depth-12, all three PV budgets now have
complete populations. This wave adds 2,316 admitted case identities, bringing
the total to **11,580 / 61,374**, ten of 53 settings. The rejected parent is not
counted as an additional population. `[V]` immutable archive ranges and frozen
plan; corresponding prior live-cost reports remain preserved.

## Measured server cost

The three PV budgets retain 3,474 admitted rows / 130 phase/focus/state/regime
groups. The full 61,374-case plan is still incomplete. Four-ply available-case
elapsed p95 below is milliseconds; opening/middlegame/endgame counts are
46/41/39 per setting/regime. The separate unclear phase remains in the JSON,
including the two failed four-ply cold 100-ms queries. `[V]`
`d3262-cost-live-pv-budgets-summary-2026-10-07.json`, SHA-256
`bb1731fb24e11c0154019dbabaf9b6c7f4cb706e6f0e3f4fe5428d1fd062ecd9`.

| Budget | Cold opening | Cold middlegame | Cold endgame | Warm opening | Warm middlegame | Warm endgame |
|---|---:|---:|---:|---:|---:|---:|
| depth 8 | 334.317 | 285.513 | 372.354 | 59.801 | 68.757 | 45.395 |
| depth 12 | 2591.225 | 4434.083 | 1763.552 | 126.483 | 141.819 | 87.288 |
| 100 ms | 235.773 | 270.209 | 212.693 | 63.110 | 76.178 | 54.452 |

Depth-12 cold server p95 exceeds the existing 1,500-ms reference in every named
phase. This is not a browser or production-profile verdict, nor a reason to
relax the budget. Failed/offline/no-target rows remain separate, not folded into
available-case timing. Source time dominates these measurements; collection
and compilation remain separately recorded. `[V]` unchanged frozen cost plan
and complete summary groups.

Each is one original case execution, not repeated-machine trials. Host isolation
was not established: the first two-setting capture overlapped focused instrument
checks/build, not the full software gate. Full software verification remained
separate from timed captures. Parent RSS is a sampled lower bound, not measured
engine/model peak. Startup is not included. No browser/paint time, equal evidence
strength or timing-effect attribution is claimed. `[V]` terminal execution
sequence, original capture metadata and summary scope fields.

## Fresh/frozen sensitivity result

The complete comparison retains all 3,474 live cases, 546 named four-ply target
cells and 1,158 cold/warm pairs. Exactly 1,154 pairs have identical compiled
evidence; four retain failed cold tables and missing warm receipts. Depth8 and
depth12 each compare 182 cells with zero changed clipped paths, scores, ranks,
depths or target outcomes. The 100-ms setting compares 180 cells and preserves
two failed-source cells as unpaired. `[V]`
`d3262-cost-live-pv-sensitivity-2026-10-07.json`, SHA-256
`61053b356f14c659219bcfeaaf54447daadb99cc93dd8bb1bf6fad97ec5c9265`.

Across those 180 comparable 100-ms target cells, 42 clipped histories, 49 raw
scores, 30 ranks, 59 depths and five grounded target outcomes differ. Outcome
changes are zero in opening/middlegame, one in unclear and four in endgame.
Cells are named targets, not independent positions: more than one target can
share a candidate. All changed and unchanged identities/operands are retained;
these counts do not identify version, timing, search or configuration as the
cause, prove strategic usefulness, or select a production profile. All fourteen
no-target candidates remain in every setting; shorter horizons remain inventory
and cache checks, not a four-ply reference comparison. `[V]` complete synthesis
groups/cells, literal source metadata and fourteen permanent controls.

Full `make staged-process-contracts verify-governance` terminates zero, retaining
R1–R10, all lifecycle/history/state/append-only checks, 1,689 routed live rows and
zero untriaged/unrouted. Canonical roadmap receipt and D3262 source anchor are
current. Normal `make semantic-search-cost-pv-sensitivity-check` also terminates
zero, reconstructing the exact immutable sensitivity bytes/digest from all
original archives and parent provenance, without overwriting evidence. Explicit
owned-file staging and ordinary hooks precede checkpoint commit. `[V]` terminal
Make outputs and generated receipt.
Earlier source/capture/summary bytes remain untouched. No production profile,
UI/API behavior, capability, milestone, content graduation or full-1.0 completion
follows from these disposable measurements. `[V]` active D3262 assignment and
draft RFC criterion 23 / Discharge D1.

Full `make staged-software-contracts` terminates zero at exact index tree
`62545c39c25ecef9b1d756c6e4e0bae1f40b9099`: 3,398 software cases / 344 files,
seven isolated performance cases / four files, clean types and full downstream
build/package/source/value/capability/history/migration gates. Original proof is
preserved without overwrite in `d3262-cost-pv-budgets-software-2026-10-07.json`.
Final source/Make bytes equal the tested tree. No new browser or GitHub success
is claimed for this research-only change. `[V]` terminal Make result, original
proof and exact-index diff.

Full `make verify-content` terminates zero: 227 cases / 23 files, zero clearance
errors over 92 corpus documents, and all 104 exact capability documents retained.
This is content-contract verification, not pack graduation. `[V]` terminal Make
result; no authored chess content or production pack is changed.
