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
