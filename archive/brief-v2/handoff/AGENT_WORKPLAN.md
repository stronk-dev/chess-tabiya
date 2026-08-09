# Parallel agent workplan

## Lane 1 — Runtime

Owner: Codex implementation agent.

- schema;
- branch graph;
- event store;
- board UI;
- tests.

## Lane 2 — Engines

Owner: systems agent.

- UCI wrapper;
- Stockfish/Maia benchmarks;
- opponent policy;
- cache and cancellation.

## Lane 3 — Content

Owner: Claude plus human chess reviewer.

- pack taxonomy;
- first positions;
- objectives/checkpoints;
- feedback claims;
- review.

## Lane 4 — Research/UX

Owner: research agent.

- competitor teardown;
- task timing;
- forum signal update;
- branch UI wireframes;
- user test script.

## Merge gates

1. Schema frozen enough for one pack.
2. Deterministic mock run passes before real engines.
3. No feedback claim without evidence reference.
4. No pack published without independent review.
5. No corpus ingestion until vertical slice is used end to end.
