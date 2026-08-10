# Drill client server foundation

The drill client's first implemented layer is a zero-pixel HTTP foundation. It
serves validated packs, creates runs from those packs, owns pack-aware mutation
orchestration, schedules evidence work, enforces feedback timing, and exports
pack-aware PGN. No browser client or screen is part of this layer.

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

## Current boundary

This document covers Layer 1 of the accepted drill-client RFC. Typed browser
plumbing, chessground integration, product screens, keyboard behavior,
Playwright coverage, and deployment packaging remain unimplemented follow-on
layers.
