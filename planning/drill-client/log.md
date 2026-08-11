# drill-client — log (append-only)

## 2026-08-12 (claude, setup)

- RFC accepted (DC-C1..C8 resolved; E5 waived by owner ruling "A" — real
  screens, iterate by use). Foundations-first layer order confirmed by owner:
  server surface → client plumbing → screens → packaging.
- Next: codex session 1 → layer 1 (server surface).

## 2026-08-12 (codex, Layer 1 — server surface)

- Added a fail-fast `PackRegistry`: it loads the living schema fixture and
  recursive `content/packs/**/*.json`, runs semantic pack lint, rejects
  unsupported v1 semantics and duplicate IDs, computes the server-side
  RFC-8785/SHA-256 digest, and powers `GET /packs` plus `GET /packs/:id`.
- Made run creation pack-aware. The server derives the digest and starting FEN
  from `packId`; every committed move is followed by checkpoint and objective
  evaluation before the run is saved once, and the mutation returns the full
  emitted-event suffix atomically. The implemented v1 objective is
  `reach_checkpoint`; unknown objective rules fail at load instead of being
  skipped.
- Added automatic per-move evaluation enqueueing at the ratified 100 ms default
  and kept the setting injectable. The selector/writer seam remains unchanged.
- Enforced `delayed_checkpoint` and `segment_end` feedback timing on `/graph`,
  `/events`, `/evidence`, and evidence application. Rules- and pack-derived
  references remain visible; engine-derived refs and payloads remain withheld.
  The cut `immediate_blunder_guard` policy is rejected at registry load.
- Added `GET /runs/:id/pgn?branches=` with legal selected-branch validation,
  pack/spine merging when the exact pack digest is registered, PGN content
  type, and attachment filename.
- Added runtime constructors and validation for the enumerable v1 evidence-ref
  grammar: `rules:*`, `pack:*`, and `engine:*`; evidence jobs now emit the
  specified `engine:<jobId>` form.
- Added the canonical zero-pixel boundary doc at `docs/drill-client.md` and
  moved the accepted RFC to implementing status. No client or screen files
  were added or changed.
- Verification: `ENGINES_REQUIRED=1 make verify` passed outside the restricted
  filesystem sandbox: 21 test files, 109 tests, typechecks, and scaffold
  verification all green. The first in-sandbox attempt could not bind the two
  existing localhost HTTP tests (`listen EPERM`); this was an environment
  restriction, and the unrestricted rerun passed without code changes.
- Stop point: Layer 1 complete. Layer 2 client plumbing remains untouched.

## 2026-08-12 (claude, review of layer 1)

- Independently verified (ENGINES_REQUIRED=1): 109 tests / 21 files green.
  Orchestrator calls reachCheckpoint/evaluateObjective inside the mutation;
  registry lints on load and rejects blunder-guard packs with typed
  PACK_INVALID (refuse-to-serve, not degrade); withholding module present with
  per-policy tests; PGN route + evidence-ref constructors in. **Layer 1
  APPROVED.** Layer 2 green-lit.

## 2026-08-12 (codex, Layer 2 — client plumbing)

- Added a typed browser `DrillApi` for the complete v1 REST surface:
  capabilities, packs, run creation, player/opponent moves, rewind, fork,
  graph, compare, events, evidence read/apply, selector, and PGN download.
  Structured failures retain HTTP status, error code, message, and details.
- Added `WriterSession`: one writer ID per run is persisted in `localStorage`
  and reused after refresh. `NOT_ACTIVE_WRITER` marks the live session and run
  store read-only; no lease-transfer behavior was invented.
- Added `RunStateStore`, projecting authoritative state from each mutation's
  contiguous `emitted` suffix rather than replacing state from an opaque
  response snapshot. Resume projects `/events` from sequence zero. Writers
  poll revealed pending evidence every 1 second and apply it through the
  writer path; rejected writers become followers polling events every 2
  seconds. Rewind events remove canceled pruned-node jobs from the pending
  count. Injected scheduling makes both intervals deterministic in tests.
- Added the bare `Chessboard.svelte` primitive backed by Chessground and
  chessops: orientation and learner input come from `start.side`, destinations
  are legal from the current FEN, and check/last-move highlighting is passed to
  Chessground. Back-rank pawn moves wait for an explicit queen/rook/bishop/
  knight choice. The mounted component test uses a browser-like DOM and a fake
  Chessground API; no product screen or app composition changed.
- Added the enumerable evidence sentence contract. All runtime `rules:*` facts
  and living-pack `pack:*` checkpoint refs receive authored/plain sentences;
  `engine:*` payloads remain individually source-labeled and duplicate payload
  ownership is rejected. Unknown future prefixes render an explicit generic
  record instead of disappearing.
- Added the maintained `@lichess-org/chessground` 10.1.1 package, direct
  chessops/schema web dependencies, and the
  browser-like Vitest environment needed to exercise Svelte components. The
  production `pnpm build` succeeds.
- Verification: `ENGINES_REQUIRED=1 make verify` passed outside the restricted
  sandbox: 27 test files, 125 tests, all workspace typechecks, Svelte
  diagnostics, and scaffold verification green.
- Stop point: Layer 2 complete. Layer 3 screens and the existing `App.svelte`
  scaffold remain untouched.

## 2026-08-11 (claude, review of layer 2)

- Independently verified (ENGINES_REQUIRED=1): 125 tests green, web build
  green. Plumbing modules all present and tested (api, writer-session with
  localStorage resume, run-state with polling + rewind-aware cancellation,
  board-model + Chessboard component, enumerated evidence-sentences test).
  The unprompted switch to the maintained @lichess-org/chessground 10.1.1 was
  the right call — pinned, noted. **Layer 2 APPROVED.** Layer 3 (screens)
  green-lit.
