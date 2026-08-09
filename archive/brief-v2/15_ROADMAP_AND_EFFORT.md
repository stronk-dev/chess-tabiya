# Roadmap and engineering effort

Effort is expressed in **engineer-weeks**, not calendar promises.

## Phase 0 — repository and competitor teardown

**1–2 engineer-weeks**

- hands-on benchmark of the closest products;
- capture exact UX for Chess Endgame Training, Noctie, Chess.com Practice, Chessable position play, Chess From Position and ChessDojo manual sparring;
- finalize licenses and stack;
- establish three reviewed sample packs.

## Phase 1 — branch runtime vertical slice

**3–5 engineer-weeks**

- web board;
- legal move/state handling;
- immutable branch graph;
- checkpoint rewind/fork;
- Stockfish UCI worker;
- Maia-3 UCI worker;
- pack schema and loader;
- one Plan Drill;
- basic branch comparison;
- PGN with variations export.

## Phase 2 — three drill modes

**4–8 engineer-weeks**

- Line Drill with theory boundary and continuation;
- Plan Drill with dual-board compare;
- Outcome Drill with Stockfish/Syzygy/Maia policies;
- replay variants;
- pack versioning;
- evidence packet and templated feedback;
- latency and caching work.

## Phase 3 — content tooling and trajectories

**5–10 engineer-weeks**

- pack authoring UI;
- model-game/corpus import;
- trajectory transitions;
- deterministic feature extraction;
- regression tests for claims;
- review workflow;
- related-position scheduling.

## Phase 4 — corpus mining

**3–8 engineer-weeks**, depending on ambition

- streamed Lichess ingestion;
- position/transition aggregates;
- rating/time-control filters;
- source-game search;
- automatic candidate pack proposals;
- performance tuning.

## Phase 5 — human arena

**6–12+ engineer-weeks** for native play, less for external challenge integration

- external Lichess challenge handoff first;
- invitation links and PGN re-import;
- later native clocks, reconnects, cheating controls and two-leg match state.

## Recommended v0 content scope

Do not attempt a complete curriculum.

Build approximately:

- 10 opening roots in one move-order-sensitive family;
- 10 roots in one quiet structural family;
- 15–25 endgame roots across convert/hold/save;
- 100–200 reviewed checkpoints/claims total;
- 3–5 connected trajectories.

This is enough to prove the interaction without hiding behind content volume.

## Recommended first packs

### Pack A — Sicilian timing and move order

Purpose: demonstrate that two playable moves can differ by one tempo and alter attack/counterplay order.

### Pack B — Carlsbad or IQP plan execution

Purpose: demonstrate quiet positional branching, piece improvement, pawn-break timing and exchanges.

### Pack C — practical rook endings

Purpose: demonstrate repeated conversion, hold and save objectives with varied defense.

These three expose the entire thesis. If the system only works for tactical attacks, it is not the intended product.
