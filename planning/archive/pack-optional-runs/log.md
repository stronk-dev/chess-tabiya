# Pack-optional runs log

Append-only.

## 2026-08-12 — Codex implementation start

- F3 landed first as required: learner identity, grants, and lease authorization are
  present and migration 2 is green.
- Re-read the revised RFC and started F2 as migration 3. The implementation keeps
  the position player UI out of scope; the shipped client will refuse these runs by
  name until that surface exists.
- B6a–d remain draft after adversarial review. Their blockers are reported separately
  and do not widen F2.

## 2026-08-12 — Codex F2 implementation

- Added drill-run schema v0.5 with pack/position session identity, canonical
  RFC-8785 digesting, replay-time invariants, and `feedback.revealed`. Position
  runs cannot claim theory-strict play and never manufacture objective upgrades.
- Replaced registry-presence withholding with the runtime's two run-level
  predicates. Disclosure is durable; an attempt-end delivery window opens on
  explicit reveal and closes on the next committed move. Tests inject durable
  engine evidence around the service to prove graph, events, comparison, staged
  delivery, and application do not fail open.
- Added the strict pack/position create union, JSON-pointer errors for unknown
  create fields, async server-derived session digests, evidence generation for
  both run kinds, the authorized reveal route, audible theory fallback, and
  position PGN identity. A missing evidence queue fails before move mutation.
- Migration 3 stamps snapshot schema versions and quarantines, without deleting,
  pre-v0.5 rows. Migration 1 no longer replays legacy snapshots through the
  current runtime. Summaries carry session kind, nullable pack id, and digest.
- `RunStateStore` no longer depends on a pack. The existing pack player refuses
  position-session resume explicitly and without minting a writer; the actual
  position player remains correctly outside this RFC.
- Canonical docs were updated where the living schema and feedback contract are
  described. `ENGINES_REQUIRED=1 make verify` passed with 204 tests and Svelte
  diagnostics 0/0. `make test-browser` passed 4 tests with the tagged Maia test
  skipped as designed.

## 2026-08-12 — Independent approval and lifecycle closeout

- Claude independently verified the implementation and included F2 in the owner-directed
  seven-RFC completion batch. Canonical docs were reconciled and the lifecycle archived.
