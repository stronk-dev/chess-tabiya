# Drill client foundations

The drill client's implemented foundations now cover the pack-aware HTTP
surface and the browser-side plumbing that consumes it. There are still no
product screens: the web app remains a scaffold, with reusable transport,
state, board, and evidence primitives ready for composition.

## Pack registry and routes

`PackRegistry.loadDefault()` loads the living
`schemas/drill_pack.example.json` fixture and every JSON document below
`content/packs/` when that directory exists. Loading is fail-fast: malformed
core fields, duplicate pack IDs, unsupported v1 semantics, and semantic lint
errors produce a typed `PACK_INVALID` error. The v1 server accepts
`delayed_checkpoint` and `segment_end`; `immediate_blunder_guard` remains cut
until the on-ramp content phase has a consumer for it.

Each accepted document receives a server-computed SHA-256 digest over its RFC
8785 canonical form. `GET /packs` returns immutable summaries containing ID,
version, digest, title, mode, difficulty, and review status. `GET /packs/:id`
returns the full document and its digest in `x-pack-digest`; missing packs are
typed `PACK_NOT_FOUND` errors.

## Pack-aware run mutations

`POST /runs` accepts `packId`. The service resolves the registered pack and
derives the run's digest and starting FEN; callers cannot substitute stale pack
data. For every committed player or opponent move, one writer-leased mutation:

1. commits the move;
2. evaluates matching authored checkpoint triggers;
3. emits checkpoint and segment events;
4. evaluates the pack's objective rules; and
5. persists the resulting run once and returns the complete emitted-event set.

This keeps the move, checkpoint, and objective projection atomic from the
client's perspective. V1 supports the fixture's `reach_checkpoint` objective
rule and the frozen trigger vocabulary: `atPly`, `atSpineNode`,
`fenPredicate`, `materialBalance`, and timing windows. A timing window fires
when its authored closing trigger matches. Unsupported objective rules fail at
pack load rather than being ignored.

After each successful move mutation, the service enqueues one asynchronous
evaluation job for the active node. Its shipped default is the ratified
100-millisecond profile and remains deployment-configurable.

## Feedback withholding

Feedback timing is enforced on the server, not with client-side hiding.
`delayed_checkpoint` reveals engine-derived evidence after the run reaches a
checkpoint; `segment_end` reveals it after a segment completes. Until then:

- `/graph` removes engine evidence references while retaining rules- and
  pack-derived references;
- `/events` stops at the first withheld engine-evidence event without advancing
  the visible cursor beyond it; and
- `/evidence` withholds staged results, while attempts to apply them return the
  typed `FEEDBACK_WITHHELD` error.

Rules-derived explanations remain visible because they are engine-free facts
from the objective machine. Evidence references have runtime constructors and
the v1 grammar `rules:<fact>`, `pack:<checkpointId>`, and `engine:<jobId>`.
Known rules facts are checkmate, stalemate, threefold draw, 50-move draw,
insufficient-material draw, and material.

## PGN export

`GET /runs/:id/pgn?branches=a,b` returns legal `text/x-chess-pgn` with an
attachment filename. When the run still resolves to its exact registered pack
digest, export merges authored spine content with the selected played
branches. Otherwise it uses the runtime's ordinary run export. Unknown branch
IDs are rejected by the runtime rather than silently omitted.

## Typed browser transport and writer identity

`DrillApi` is the typed client for the complete v1 surface: capabilities,
packs, run creation and mutation, opponent selection, graph and comparison,
events and evidence, and PGN download. It preserves structured server failures
as `ApiError`, including the machine-readable error code and details. Mutating
requests carry the run's writer ID; read-only and selector requests do not.

`WriterSession` stores one generated writer ID in `localStorage` under a key
scoped to the run ID. Reconstructing the session after a browser refresh reuses
that identity. A `NOT_ACTIVE_WRITER` response marks only the live session as
read-only; it does not overwrite the persisted identity or attempt unsupported
lease transfer.

## Run-state projection and polling

`RunStateStore` treats mutation-returned events as authoritative. It projects
the current run by appending each mutation's contiguous emitted-event suffix,
and rejects a response whose projected event count disagrees with its included
run. Resume projects the complete public event stream from `run.started`.

The writer does not poll its own run events. It tracks one pending evaluation
per committed move and, once the pack's feedback reveal condition is present,
polls `/evidence` every second until the staged results have been writer-applied
and their `evidence.attached` events drain the pending count. A client rejected
with `NOT_ACTIVE_WRITER` becomes a follower and polls `/events?sinceSeq` every
two seconds. Rewinds remove server-canceled jobs for pruned nodes from the
pending count. Poll scheduling is injectable and covered without wall-clock
tests.

## Bare chessboard primitive

`Chessboard.svelte` wraps Chessground without adding a drill screen. Chessops
derives legal destinations from the authoritative FEN. The pack's `start.side`
sets orientation and restricts input to the learner's turns; the component
passes the current check and last move into Chessground's normal highlights.
Pawn moves to the back rank pause at an explicit queen/rook/bishop/knight
picker before emitting promotion UCI.

## Evidence sentences

The browser owns an enumerable evidence sentence table. Every exported
`rules:*` fact has a fixed plain sentence, and every pack checkpoint produces a
`pack:<checkpointId>` sentence from its authored label. Each `engine:*` result
renders independently with its typed payload and an `Engine` or `Human model`
source label; duplicate payload ownership is rejected rather than merged.
Unknown future prefixes remain explicit as a generic recorded-evidence chip.
The CI test enumerates the runtime rules vocabulary and the living pack's
checkpoint vocabulary.

## Current boundary

Layers 1 and 2 of the accepted drill-client RFC are implemented. Product
screens, layout, keyboard behavior, Playwright coverage, and deployment
packaging remain unimplemented follow-on layers.
