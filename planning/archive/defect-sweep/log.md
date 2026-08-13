# Defect sweep — log

Append-only.

## 2026-08-13 — Codex start

- Independent adversarial review approved the RFC. Implementation begins at
  pack schema v0.5 with no storage migration or run-schema change.
- The review-discovered `illegal-spine.invalid.json` schema-valid/lint-invalid
  fixture is explicitly preserved by adding the now-required learner side.
- Design-tier closures and new BACKLOG proposals remain owner/Claude work; this
  implementation changes code, tests, canonical docs, and lifecycle records only.

## 2026-08-13 — Codex implementation and closeout

- Pack schema v0.5 now requires `start.side`, removes the unimplemented
  immediate-feedback value, and binds checkpoint actions, feedback policies,
  phases, and objective types to shared constants. The schema-valid/lint-invalid
  illegal-spine fixture remains intentionally schema-valid.
- Pack summaries carry nullable phase; the library renders it or
  `unclassified`. The API rejects a malformed detail response before Svelte can
  render it, proven in the browser with zero page errors.
- The release Compose file now has a mock-only default and optional health-gated
  engines profile. Packaging validation renders and inspects both profiles.
- UCI identity derives an advertised version only when configured and advertised
  names agree; mismatches are transcript facts. The authoring evaluator now
  names Stockfish and therefore records its advertised version.
- `ENGINES_REQUIRED=1 make verify` passed 291 tests across 48 files with clean
  schema and packaging checks. `make test-browser` passed 10 required tests at
  zero retries; the optional Maia latency test was skipped. Branch switching
  measured 48.9 ms, below the 100 ms investigation threshold.
