# Engine leverage implementation log

## 2026-08-16 — implementation started

- Re-reviewed the accepted RFC against current code and corrected two stale migration-22 references to the owner-ruled migration 21.
- Landed the initial schema, storage, evidence, guard, engine-bound, corpus, sourcing, and capability changes.
- Found and fixed a persistence seam during regression work: REST parsing discarded newly recorded candidate score/WDL and engine search-bound fields even though generation and schema accepted them.
- Full unit regression is green after adding direct refusal tests for all three deviation-cost failure codes.

## 2026-08-16 — implementation verified

- Replayed the committed Stockfish authoring records through the current invocation path for all 20 engine-assessed opening packs. It added the RFC's 135 bound deviation costs; together with five pre-existing engine-bound costs, the tree now contains 140 (137 cp, 3 mate). The second pass was byte-identical.
- The 20 rewritten ledgers remain `ledger_verified`; direct sourcing checks report zero stale digests and zero unbacked or contradicted deviation costs. Four existing `unmeasurable` declarations were preserved, and deviations without a measured pair remain unstamped.
- Promoted the audit's exact 51-position R4/R5 stratified corpus into the real-engine suite. Stockfish agreed on move and score for 51/51 repeated positions at `go nodes 50000`; the 102 calls measured 51.8 ms median, 79.8 ms p95, 83.0 ms max, and zero over 500 ms on this run.
- The unit gate caught one stale isolated-ledger test expectation after costs became evidence-bound. The test now supplies the pack's real ledger instead of weakening the checker.
- The first browser run caught the expected corpus-sentence contract change: per-move result splits now follow the count/share sentence. The assertion was widened to pin the complete attributed split.
- Final gates: `ENGINES_REQUIRED=1 make verify` passed with 637 tests across 101 files and Svelte 0 errors/0 warnings; `make test-browser` passed 24 tests at zero retries with the optional Maia latency test skipped.
- Canonical docs now describe the 50,000-node strong-engine bound, recorded search bounds and candidate measurements, exact tablebase evidence/disclosure, bound deviation costs, guard conditions, capability dispositions, and per-move explorer result splits.

## 2026-08-20 — independent closeout

- A0 re-derived the historical pack 0.23/run 0.16/storage-21 landing state at `18d2832`, rather
  than incorrectly comparing the landing invariant to HEAD's later 0.27/0.17/23.
- Current clean focused tests and the Stockfish-required engine suite passed; type, scaffold and
  packaging checks passed. RFC moved to the archive and historical lanes were released.
