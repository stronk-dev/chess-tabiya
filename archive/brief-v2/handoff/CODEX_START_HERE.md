# Codex implementation handoff

## Mission

Build the Phase Drill Lab vertical slice. Do not build a personal game analyzer.

## Read first

1. `00_CORRECTED_VERDICT.md`
2. `implementation/vertical_slice_spec.md`
3. `rfcs/RFC-0001-drill-pack-format.md`
4. `rfcs/RFC-0002-branch-runtime.md`
5. `rfcs/RFC-0003-opponent-policy.md`
6. `schemas/*.json`

## First PR sequence

### PR 1 — scaffold and schema

- monorepo layout;
- schema validation;
- generated TypeScript/Python types;
- fixture pack loader;
- CI for JSON and markdown links.

### PR 2 — chess core and graph

- legal move adapter;
- immutable nodes;
- rewind/fork;
- event log;
- property tests;
- PGN variations export.

### PR 3 — UCI workers

- generic UCI wrapper;
- Stockfish adapter;
- Maia-3 adapter;
- process supervision;
- cancellation/cache;
- deterministic policy seed.

### PR 4 — vertical-slice UI

- active board;
- objective;
- delayed segment feedback;
- branch rail;
- rewind/fork;
- dual-board compare.

### PR 5 — evidence packet

- objective states;
- engine checkpoints;
- branch comparison;
- authored feedback claims;
- export/debug view.

## Non-goals

No auth, billing, game import, LLM, bulk corpus, native matchmaking, mobile app or automatic lesson generation.

## Definition of done

The acceptance scenario in `implementation/vertical_slice_spec.md` passes locally and in CI using a deterministic mock opponent plus optional real Stockfish/Maia integration tests.
