# Log

## 2026-08-15 — codex review

- Approved the cross-reviewed RFC under the owner's explicit queue order.
- Re-derived 20 non-fixture opening packs: 17 `follow_theory`, 3 `play_until_checkpoint`.
- Verified current baselines: pack 0.18, run 0.14, storage 19.
- Recorded that landing 0.20 intentionally skips the still-reserved 0.19 lane; transition-primitives must rebase before it can implement.
- Open NNUE identity, multi-instrument prose, and deviation-cost admission remain named limits, not claims this lifecycle closes.

## 2026-08-15 — implementation and closeout

- Added the pack 0.20 `engine` root-assessment arm while retaining terminal-only root resolution and the existing leg refusal. Inline provenance evidence now fails closed.
- Extended admission through manifest-linked engine records, flat-file evidence checks, preserved-record merging, the closed move-loss template, and explicit human-judgment overreach refusals.
- Added reproducible authoring evaluation (`ucinewgame` plus `Clear Hash` per position), instrument-dispatched `verify-draft`, flat explorer attachment, and the read-only `engine-walk` sibling.
- Re-measured all 20 non-browser opening packs with Stockfish 18 at depth 22. The actual corpus was 381 authored positions, materially larger than the RFC's ~240-second estimate. Parallel processes were safe because each owned a separate engine process and hash.
- Replaced every unconstrained `provenance.engineValidation` block with a root declaration and flat evidence/source/job sidecars. No strategic prose, plan class, annotation, or deviation class was re-authored or promoted to grounded.
- Corrected an implementation seam found by the new admission test: the engine verifier initially updated the in-memory root source timestamp but did not write the pack back. The pack write is now symmetrical with the Syzygy branch; all 20 sidecars earn `ledger_verified`.
- Canonical behavior was distilled into `docs/engine-grounding.md` and folded into the existing sourcing, tablebase, format, and docs-index pages. A separate engine page was chosen because the result-vs-measurement distinction is the feature's central honesty boundary and would be obscured inside the tablebase page.
- Verification: `ENGINES_REQUIRED=1 make verify` — 546 tests across 88 files, schema and packaging green; `make test-browser` — 24 passed, one optional Maia test skipped, zero retries.
