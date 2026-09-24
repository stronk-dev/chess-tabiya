# Recorded semantic path — implementation receipt (2026-09-24)

Authority: owner direction in session, 2026-09-24 ("just do the work implement a bunch of RFC's"),
recorded as acceptance of `rfc/recorded-semantic-path.md`. Status after this commit: **`awaiting D1`**.
The compiler, source, successors and operation are implemented; no Review, module or longitudinal
application operation consumes them yet, so criterion 13 keeps the RFC out of `implemented`.

## What landed

| site | change |
|---|---|
| `packages/runtime/src/branch-path.ts` | `resolveBranchPath`: total graph authority (unique ids, one `run.started` root, present fork, fork reachability without missing parent or cycle, one tip, fork-to-tip membership). `branchPath`/`branchPaths` delegate to it, share one node index and throw `BranchQueryError` `INVALID_BRANCH_GRAPH` with the typed reason instead of truncating |
| `packages/runtime/src/evidence-catalog.ts` | `SEMANTIC_EVENT_PROJECTION_REFS` (exact `id@version`, 78 refs) replaces `SEMANTIC_EVENT_PROJECTION_IDS`; `SEMANTIC_EVENT_FAMILY_IDS` is the named lossy view; `run.record.edge@1` (inspector-only source record); eleven `@2` successors via the separately named `recordedPathSuccessor` helper; consumer specs and semantic declarations keyed by exact ref |
| `packages/runtime/src/evidence-source-adapters.ts` | `declareRecordedEdgeEvidence(run, parent, child)`: the only minting path. It replays the move, never repairs bytes, and records edges in a private registry that `assertRecordedEdgeEvidence` checks. Eleven `declareRecorded*Evidence` v2 adapters |
| `packages/runtime/src/semantic-evidence.ts` | eleven `recorded*SemanticEvent` v2 constructors. Each binds every edge to its operand anchor value-for-value, checks one run and contiguity, and puts run/branch/node on the anchor. The v1 constructors are unchanged |
| `packages/runtime/src/recorded-semantic-path.ts` | `recordedSemanticPath` / `recordedSemanticPathExecution`: a private table with 13 rows and a closure check at module load, a receipt per start and row, exact-source preparation, duty memoised per start FEN, ordering and dedupe, a value-receipt digest and the explicit convention abstention |
| `apps/server/src/recorded-semantic-path.ts` | `recordedSemanticPathOperation(storage)` → injected `compileRecordedSemanticPath({principal, runId, branchId})` (read authority, no REST route) |
| `apps/server/src/recorded-semantic-path-check.ts`, `Makefile` | `make recorded-semantic-path-check` |
| `apps/server/src/evidence-manifest-check.ts`, `semantic-evidence-check.ts` | exact-ref closure (no manufactured `@1`) |
| `tools/d2144-evidence-value-authority-route-map/route-map.ts` + receipt | routes keyed by `id@version` (the base-id map had silently relabelled the v1 trade adapter as `@2`); pins 204/200/6 |
| `docs/semantic-evidence.md` | canonical behaviour, limits and new manifest tuple |

## Criteria → tests

| # | test(s) | state |
|---|---|---|
| 1 | `packages/runtime/src/recorded-semantic-path.test.ts` "[criterion 1]" (reordered nodes, typed no-overload) | green |
| 2 | "[criterion 2]" (duplicate branch or node, missing root ×2, missing fork, missing parent, cycle, multiple tips, off-chain, zero detector work on refusal, `branchPaths` shares the resolver) | green |
| 3 | "[criterion 3]" (ply, illegal UCI, non-canonical castling UCI, SAN, child FEN, non-canonical parent FEN, copied-node refusal, shared-ancestry identity) | green |
| 4 | "[criterion 4]" ×2 (table set-equality, ±row failures, @1/@2 crossed inventory, v2-as-v1 omission → `EVIDENCE_PROJECTION_DUPLICATE`, v1/v2 meaning parity, no production/governance import of the old inventory) + `evidence-catalog.test.ts` exact-ref equality | green |
| 5, 8 | "[criteria 5, 8]" (`plies × 13` receipts, row order per start, insufficient/no-witness/emitted semantics, 1 transition + 1 check per edge, 0 fan-out, duty ≤ distinct start FENs) | green |
| 6 | "[criterion 6]" (all eleven v2 positives incl. attraction h5 and check-induced deflection; eleven hard negatives stay `no_witness`; broken boundary refuses) | green |
| 7 | "[criterion 7]" ×2 (`assertSemanticEvidenceEvent` on every event, edge ↔ anchor value equality; crossed, reordered, short, long, forged, PV, cross-run edges refused; v1 trade constructor refuses edges) | green |
| 9 | "[criterion 9]" (byte-stable repeat, lexicographic order check on two paths, different projections not collapsed, ids unique) | green |
| 10 | "[criterion 10]" (ancestral `branchId` ≠ requested, byte-equal common-ancestry receipts) | green |
| 11 | `apps/server/src/recorded-semantic-path.test.ts` "[criterion 11]" (two injected builders get byte-equal ids and digest) | **partial**: stand-in builders only. The real Review/longitudinal builders belong to `review-evidence-compiler` / `longitudinal-store` (D5/D6) |
| 12 | "[criterion 12]" ×2 (stranger/absent run → `RUN_NOT_FOUND`, unknown branch refusal, `rest.ts` has no route) | green |
| 13 | "[criterion 13]" census: zero production callers ⇒ status token ≠ `implemented` (proved able to fail during this work) | green as a guard; **the consumer witness itself is open** (D1) |
| 14 | "[criterion 14]" + criterion-7 PV case | green; hypothetical-horizon dependency (D7, `hint-distance`) remains open |
| 15 | "[criterion 15]" (identity moves with each material field; run identity; equal projection sets over different values differ; convention digest retained) | green; convention part is the explicit predecessor abstention |
| 16 | runtime/server typecheck, `make recorded-semantic-path-check` | green. `make verify` is not fully green (see below); browser tests not run (no downstream UI consumer exists) |
| 17 | "[criterion 17]" (exact vs eager byte parity + counts on all fixtures); checker parity on 36 imported paths; `recorded-semantic-path.performance.test.ts` in the pinned performance tier | green |
| 18 | `docs/semantic-evidence.md` updated. `design/BACKLOG.md` and `planning/exploration/log.md` are left to the coordinator's merge closeout, as instructed | partial |

## Measured (this host: Node v26.9.0, darwin/arm64 — not the pinned Node-24 release host)

`make recorded-semantic-path-check` over `tools/r2-selection-harness/imported-sample.pgn`: 108 games,
6,991 plies and 1,288 v2 events, with no refusals. The exact source-call contract held on every game,
and eager parity was byte-equal on all 36 timing-arm paths. Total p95 is **69.7 / 140.1 / 235.4 ms** at
20/40/80 plies (D1931 preregistered 64.7/129.7/212.7). Emitted receipts by row: trade 597, contact h2
137, contact h3 46, harassment 6, defender consequence 40, deflection 37, attraction h3 11, attraction h5 1,
line clearance 23, square clearance 374, interference 3, check zwischenzug 7, overload 5.

## Left undone / open

- **D1 / criterion 13:** no production consumer calls `compileRecordedSemanticPath`. The consumers are
  `review-evidence-compiler` (D5), `longitudinal-store` (D6) and `module-registration` /
  `evidence-presentation` (D3/D4, [[D1870]]). Status stays `awaiting D1`.
- **D2:** the D1710 execution disposition flips only with D1. The `tools/d1710` census now finds the new
  root and fails its historical pins, which is the expected drift.
- **[[D1921]]/[[D1929]]:** there is no semantic-convention registry. The result abstains with
  `conventionReceipt.status: "predecessor_unlanded"`.
- **D7:** hypothetical PV semantics remain `hint-distance`'s job.
- **Governance follow-ups for the coordinator:** `rfc/README.md` Active row must become `awaiting D1`
  (`make status-parity` P2 fails until then). Ledger/log closeout remains too.
- **Historical harness pins (not in `make verify`):** `semantic-validation-closure` (D1711: 67 events,
  literal census text) and `tools/d1710` fail by construction on the grown manifest.
  `evidence-value-authority-author-contract` pins 192/188/185/46 and its own RFC text, so that RFC's
  owner must absorb the +12 exact routes. `foundation-closure-check` (D1737 `193`) and d1710's
  `193` pin were already stale at baseline (the manifest had 194 projections before this work). The
  harnesses that imported the removed inventory now alias `SEMANTIC_EVENT_FAMILY_IDS`, which has
  byte-identical content to the old list.
