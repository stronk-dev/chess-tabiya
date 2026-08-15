# Resistance spectrum implementation log

Append-only.

## 2026-08-15 — implementation opened (codex)

- Pulled the next unblocked queue item after `opening-evidence-path` exposed an out-of-order pack-schema lane (0.20 before the still-unlanded 0.18) and a stale 20-pack migration census (23 opening packs now exist).
- Re-reviewed this RFC against run schema 0.13 and storage 18. Its independent 0.14 / migration-19 lane is clean.
- Confirmed the queue carries the owner latency ruling: the measured roughly 580 ms is a declared per-selection cost, not a hidden breach or a reason to substitute a different objective.

## 2026-08-15 — implementation exercised (codex)

- Added the single pure `humanConcessionMass` definition and the two-instrument selector. Positive measured mass selects by ratio; complete all-zero measurement refuses; missing mass abstains and uses the deterministic UCI tiebreak.
- Published `practical_resistance` only with both instruments, persisted candidate ratios and requested/applied Elo facts, and structurally closed D36 by parsing the exported mode vocabulary rather than another hand-written list.
- Migration 19 stamps frozen `0.13` snapshots to `0.14` without rewriting event evidence; a regression compares the full historical event log after upgrade.
- The tagged Maia probe completed: 20/20 identical target-Elo-1800 requests returned byte-identical policy vectors. The mode still relies on durable record/replay, not an inferred seed guarantee.
- Folded the canonical description into the existing engine-worker, outcome-grading, branch-runtime, and drill-pack pages. A separate page would split one cross-cutting resistance contract across a fifth location without adding a new surface.

## 2026-08-15 — lifecycle complete (codex)

- `ENGINES_REQUIRED=1 make verify` passed: 529 tests across 85 files; Svelte diagnostics 0/0; scaffold and packaging clean.
- `make test-browser` passed at zero retries: 24 passed, one optional Maia latency spec skipped.
- The RFC and planning job move to their archives in the same commit as run schema 0.14, storage migration 19, canonical docs, and the completion ledger flips.
