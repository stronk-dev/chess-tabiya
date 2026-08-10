# RFC: Drill Client (playable vertical slice)

- **Status:** accepted
- **Author:** claude (for Marco)
- **Created:** 2026-08-12
- **Design refs:** `design/02-product-shape.md` §UX commitments (layout, keyboard-first, anti-contamination, latency budgets), `design/01-training-model.md` (episode stages, feedback timing)
- **Exploration gate:** E5 waived by owner ruling 2026-08-12 ("A" — build real screens, iterate by use); logged in gates.md + exploration log
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

### New server surface (DC-C1/C2/C4/C6 resolutions — everything the UI needs that does not exist today)

The current server is a pack-blind run store + pure selector. This RFC adds a
**pack-aware orchestration layer**, server-side, inside the existing
single-writer mutation path:

1. **Pack serving (DC-C1):** `GET /packs` → `[{id, version, digest, title,
   mode, difficulty, reviewStatus}]`; `GET /packs/:id` → full document.
   Server loads packs from `schemas/` fixtures + `content/packs/` at boot,
   **lints on load and refuses to serve failures**, computes the RFC-8785
   digest at serve time (digest locus: server).
2. **Run orchestration (DC-C2):** `POST /runs` accepts `packId`; the server
   loads the pack, derives objective rules and checkpoint triggers, and — 
   **within the same mutation as each committed move** (it already executes
   runtime ops under the writer's lease) — evaluates triggers →
   `reachCheckpoint`, and objective rules → `evaluateObjective`. One atomic
   mutation returns the full emitted-event set to the client. No second
   checkpoint engine anywhere; the passive voice has a subject now: the
   server's run service.
3. **Evidence production + withholding (DC-C6):** the service auto-enqueues a
   per-move eval job (internal; ratified 100ms profile). **feedbackPolicy is
   enforced server-side**: `/graph`, `/events`, `/evidence` withhold evidence
   payloads until the pack's reveal condition (checkpoint reached / segment
   completed) — client hiding would be inspectable theater, so the server is
   the gate. Rules-derived why-banners (engine-free) are exempt: they are the
   objective machine's own output and always shown. `immediate_blunder_guard`
   is **cut from v1** — no shipped pack uses it (the fixture is
   delayed_checkpoint) and its blunder judge has no consumer until on-ramp
   content exists; it returns with the on-ramp content era.
4. **PGN export (DC-C4):** `GET /runs/:id/pgn?branches=a,b` →
   `text/x-chess-pgn` + filename header; pack-merged export
   (`exportPackRunPgn`) when the run's pack is loaded, plain `exportPgn`
   otherwise.

### Evidence-ref rendering contract (DC-C3)

Refs gain a v1 grammar: `rules:<fact>` (checkmate, stalemate, draw-threefold,
draw-50move, draw-insufficient, material), `pack:<checkpointId>`,
`engine:<jobId>`. The runtime exports ref constructors; the client owns a
sentence table for every `rules:*` and `pack:*` form ("Draw available:
threefold repetition on this path"); `engine:*` renders the job's typed
payload (source-labeled, never merged). Unknown prefixes render a generic
"evidence recorded" chip. The CI gate is now testable: every ref the v1
system can emit must have a table entry (enumerated test).

### Writer lease & polling in the browser (DC-C5)

Writer id: generated per run, persisted in `localStorage` keyed by run id —
refresh resumes the same lease (no expiry exists, so same-browser resume
always works). Another browser gets `NOT_ACTIVE_WRITER` → read-only mode with
a visible banner (no transfer in v1; documented limitation from
branch-runtime). Polling: the sole writer does not poll events during play
(its own mutations return emitted events); it polls `/evidence` at 1s while
jobs are pending for revealed segments, stopping when drained. Read-only
followers poll `/events?sinceSeq` at 2s.

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
6. Feedback timing honors the pack's `feedbackPolicy`, enforced server-side
   (§New server surface): `delayed_checkpoint` withholds evidence until a
   checkpoint (badge shows "evidence waiting"); `segment_end` until segment
   completion. (`immediate_blunder_guard`: cut from v1, returns with on-ramp
   content.)
7. Export: `GET /runs/:id/pgn` (new route, §New server surface) via download.

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
- GHCR publishing (DC-C7, concrete): a `release.yml` workflow on `v*` tags
  builds and pushes `server` and `maia` multi-arch images tagged
  `{version, sha}`; `compose.yaml` references version tags, digest-pinned in
  the release commit.
- Maia container healthcheck (DC-C7, concrete): the entrypoint self-tests the
  UCI handshake (`uci`/`isready`) at startup and touches `/ready`;
  `HEALTHCHECK` probes that file. "Healthy" = model loaded and UCI answered,
  which is exactly the warmup race behind the exit-126 flake.
- Devcontainer referencing the same toolchain (stockfish included) — humans
  and agents share one environment.
- Makefile: `make up`, `make up-engines`, `make down`.

## Acceptance review blockers (2026-08-12 — DC-C1..DC-C8) — RESOLVED (C8 pending owner)

C1 → pack-serving surface specified (server digest locus, lint-on-serve);
C2 → server-side orchestration inside the writer's mutation (no second
checkpoint engine); C3 → ref grammar + sentence-table contract with an
enumerable CI gate; C4 → concrete PGN route; C5 → localStorage lease resume +
polling contract; C6 → server-side withholding + immediate_blunder_guard cut
from v1 (no consumer until on-ramp content); C7 → test-browser target +
separate CI job + release.yml + concrete UCI healthcheck, all marked as new
work; C8 → resolved: E5 waived by owner ruling 2026-08-12; logged. Deployment-folding
citation: the backlog row scheduled packaging "for the client/vertical-slice
era" — this RFC is that era; folding is per that ruling, now cited.

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
- Playwright covers the same flow headless against the mock opponent —
  **new** `make test-browser` target and a **new separate CI job** (Playwright
  container, not part of local `make verify`) — this is added work, not
  existing plumbing (DC-C7).
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
- 2026-08-12: adversarial review DC-C1..C8; C1–C7 resolved in-draft; C8
  resolved by owner E5 waiver → **status → accepted**.
