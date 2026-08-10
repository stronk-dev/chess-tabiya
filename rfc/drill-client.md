# RFC: Drill Client (playable vertical slice)

- **Status:** draft
- **Author:** claude (for Marco)
- **Created:** 2026-08-12
- **Design refs:** `design/02-product-shape.md` §UX commitments (layout, keyboard-first, anti-contamination, latency budgets), `design/01-training-model.md` (episode stages, feedback timing)
- **Exploration gate:** E5 (branch/compare comprehension) deliberately answered by use in this slice — logged
- **Depends on:** `docs/branch-runtime.md`, `docs/drill-pack-format.md`, `docs/engine-workers.md`
- **Parent / amends:** —
- **Supersedes / superseded by:** —
- **Planning:** `planning/drill-client/` (once implementing)

## Summary

The Svelte 5 app that makes the stack playable: pick a pack, play against the
selected opponent on a chessground board, hit a checkpoint, rewind with one
key, branch, compare the attempts side by side, export PGN. The client is the
run's **writer**, driving the existing REST surface. This slice is where
rewind-branch-compare meets a human for the first time (E5 by use).

## Motivation

Everything below the UI exists and is tested. Out of scope: mobile polish
(responsive layout only), streamer overlay, prediction-checkpoint and
intent-capture interactions (schema exists; UI in a follow-up), LLM narration,
authored content (the demo pack is the existing Najdorf schema fixture —
`reviewStatus: schema_example` shown honestly in the UI).

## Specification

### Execution model for v1 (scope decision)

The client is **REST-driven**: it holds the writer lease and mutates
exclusively through the existing server binding (`POST /runs`, `/moves`,
`/rewind`, `/fork`, `/select-move`, evidence + events polling). No in-browser
runtime execution in v1 — on localhost/LAN the round-trip is well inside the
latency budgets, and backend capability parity (the standing ruling) is
satisfied by definition. The in-browser runtime (offline play, browser
Stockfish) remains the named progressive enhancement, unlocked later by an
event-log sync endpoint — explicitly NOT built now.

### Screens & layout (from design/02)

One drill screen, three regions:

- **Center:** chessground board; objective sentence; minimal status line.
  Promotion picker; last-move + check highlights; legal-move hints ON
  (normal board behavior — not contamination).
- **Bottom timeline:** moves of the active branch with semantic checkpoint
  markers (from `checkpoint.reached` events); click = rewind-cursor preview,
  Enter/click-confirm = rewind.
- **Right branch rail:** one card per branch — label (`main`/`alt-N` or
  authored), first divergent move, live objective-state chip, result if
  terminal. Click switches the active branch (cursor to its leaf).

**Compare view** (opens from the rail with two branches selected, or `Tab`):
two boards at aligned plies driven by the runtime's `compare()` payload —
stepper syncs both; absent-side plies render as a dimmed "line ended";
objective timelines and checkpoint hits shown as two strips. No engine
numbers in v1 compare (evidence overlays arrive with the feedback RFC).

### Episode flow

1. Pack list (fixture packs served by the server from `schemas/` +
   `content/packs/` when it exists); shows mode, difficulty band, review
   status badge.
2. Start → `POST /runs` (client generates writer id; policyConfig from pack +
   capabilities). Player side from `start.side`.
3. User moves on the board → `POST /moves`. Opponent plies: client calls
   `/select-move`, then appends selection + move via the writer path
   (`appendOpponentPly` semantics over REST).
4. Checkpoints: pack triggers evaluated by the runtime; on `checkpoint.reached`
   the client shows the checkpoint sheet (stop/compare/continue per pack
   `actions`).
5. Objective state changes render as the **why-banner**: state + the evidence
   refs' plain rendering ("Draw available: threefold repetition on this
   path") — never a bare state flip (the CET lesson, now UI law).
6. Feedback timing honors the pack's `feedbackPolicy`: `delayed_checkpoint`
   hides evidence accumulation until a checkpoint (badge shows "evidence
   waiting", contents hidden); `segment_end` until segment completion;
   `immediate_blunder_guard` shows the why-banner immediately and offers
   one-key rewind.
7. Export: PGN with variations (existing endpoint payload) via download.

### Keyboard map (design/02, confirmed)

`R` rewind to last checkpoint · `Shift+R` checkpoint picker · `B` fork here
(names branch, optional intent text) · `1..9` switch branch · `Tab` compare
toggle · `←/→` step timeline · `Space` play/pause branch replay animation ·
`E` export. All actions also mouse-reachable; keys shown in a `?` overlay.

### Anti-contamination defaults (ADR-0006 surface)

No eval bar, no move-quality labels, no engine arrows, no human-frequency
display anywhere in v1 play. Evidence appears only per feedbackPolicy, and
only as typed why-banners. (A pack cannot ask the v1 client to show an eval
bar; there is nothing to accidentally leak.)

### Latency budgets (measured in-browser, acceptance)

Board-ready from pack selection <250 ms warm · rewind <100 ms · branch switch
<50 ms · cached opponent reply perceived-instant · uncached Maia reply <600 ms
end-to-end (server 500 + transport allowance).

### Deployment packaging (ruled 2026-08-12, lands with this slice)

- Root `compose.yaml`: server + Maia sidecar with healthcheck; server
  `depends_on: service_healthy` (also expected to cure the exit-126 startup
  race). Profiles: default = server + mock opponent; `engines` adds
  Maia/Stockfish.
- GHCR multi-arch images published by CI on tag; compose pulls by digest.
- Devcontainer referencing the same toolchain (stockfish included) — humans
  and agents share one environment.
- Makefile: `make up`, `make up-engines`, `make down`.

## Deviations from design

- design/02 lists a "difference strip" with eval/WDL trajectories in compare —
  deferred to the feedback RFC (no engine numbers in v1 UI at all). Alignment,
  objective timelines, and checkpoint strips ship now.
- Branch race (two-board alternating play) stays experimental/absent (design
  already marked it optional).

## Acceptance criteria

- **The end-to-end scenario, by a human:** `make up-engines` → open browser →
  pick the Najdorf fixture → play 8+ plies vs `human_common` Maia → checkpoint
  sheet appears → `R` rewinds → alternative line → `Tab` compare shows both
  attempts aligned with the divergence visible → `E` downloads legal PGN with
  both branches. Recorded as a walkthrough note in planning (with screenshots).
- Playwright covers the same flow headless against the mock opponent
  (deterministic; part of `make verify` via the browser job).
- Latency budgets measured in-browser and recorded (honest, even if missed).
- Why-banner test: an objective state change without renderable evidence refs
  fails CI (no bare banners).
- feedbackPolicy behaviors covered per mode (three tests).
- Keyboard map fully reachable without mouse (a11y smoke: focus + keys).

## Open questions

- Branch-rail scaling beyond ~6 branches (Q9's open tail: grouping/cleanup) —
  observe in use during the slice; defer machinery.
- Intent-capture + prediction checkpoint UI — follow-up RFC after the
  feedback composer exists.

## Changelog

- 2026-08-12: created; REST-driven v1 execution model chosen (in-browser
  runtime named as later enhancement); deployment packaging folded in per
  ruling.
