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

## 2026-08-11 (codex, Layer 3 — screens)

- Replaced the web scaffold with the real REST-driven episode shell. The app
  lists registered packs with mode, difficulty band, and the server's honest
  `reviewStatus`, starts or resumes URL-addressed runs, preserves the writer
  identity through `localStorage`, and downloads the server PGN export.
- Added `DrillSessionController` as the thin episode coordinator over Layers 1
  and 2. Player moves pause on atomically returned checkpoints before any
  opponent selection; continue calls the pure selector and writer-appends the
  selected reply. The controller also owns fork, rewind, branch switching,
  compare, export, stop, and read-only follower state without duplicating
  runtime semantics in the browser.
- Added the composed drill screen: centered Chessground board and authored
  objective, evidence-backed why-banner, checkpoint sheet, checkpoint-marked
  click-preview/confirm timeline, and a branch rail with divergent move,
  intent, live objective chip, selection, and compare controls.
- Added comparison as two boards driven by the server/runtime `compare()`
  payload. One synchronized stepper controls both sides; absent pairs visibly
  render `Line ended`, and the separate objective and checkpoint strips remain
  free of engine-number contamination.
- Implemented the complete keyboard map (`R`, `Shift+R`, `B`, `1..9`, `Tab`,
  arrows, Space, `E`, and `?`) with mouse equivalents. Mounted DOM tests cover
  the map, timeline confirmation, and focus entry for the drill, checkpoint,
  checkpoint picker, fork form, compare view, and shortcut guide.
- The why-banner derives every sentence from the enumerable Layer 2 sentence
  table. Its CI test rejects an objective transition with empty evidence refs,
  so the screen cannot regress to a bare state label.
- Playwright remains in Layer 4 as permitted. A final rendered smoke through
  the in-app browser was attempted, but this environment exposed no browser
  backend; mounted happy-dom component tests and a production Vite build cover
  this layer here.
- Verification: `ENGINES_REQUIRED=1 make verify` passed: 30 test files and 136
  tests, all workspace typechecks and Svelte diagnostics, schema checks, and
  scaffold verification green. `pnpm --filter @chess-tabiya/web build` also
  passed.
- Stop point: Layer 3 complete. Layer 4 Playwright, packaging, latency
  measurements, and the owner walkthrough remain untouched.

## 2026-08-11 (claude, review of layer 3)

- Independently verified (ENGINES_REQUIRED=1): 136 tests / 30 files green,
  zero Svelte diagnostics, production build green. All screens + episode
  controller present with real tests. **Layer 3 APPROVED code-wise.**
- **Blocking finding for layer 4 (walkthrough-killer):** the living Najdorf
  fixture ships opponentPolicy.mode=plan_defense — unsupported by the
  selector → the walkthrough's first opponent reply would 422
  (POLICY_MODE_UNSUPPORTED). No unit test caught it because tests use
  supported modes. Fix systemically in layer 4: (1) registry refuses to serve
  packs whose policy mode is not selectable (same refuse-to-serve pattern as
  blunder-guard) + test; (2) living fixture flips to human_common (archive
  original untouched); (3) the Playwright flow must run against a SERVED pack,
  not a synthetic one, so this class can't recur.

## 2026-08-11 (codex, Layer 4 — packaging and automated acceptance)

- Closed the Layer 3 blocker at the registry boundary. Pack loading now rejects
  any `opponentPolicy.mode` outside the selector's advertised v1 modes with
  typed `PACK_INVALID`; the regression test includes `plan_defense`. The living
  Najdorf schema fixture now uses `human_common`; the frozen archive copy was
  not changed.
- Added a real application entry point that serves the production Svelte build
  and the pack-aware REST surface from one origin. Mock mode supplies a
  deterministic opponent and evidence executor; engine mode connects to the
  healthchecked Maia TCP sidecar and the image's Stockfish binary. `/healthz`
  reports the active mode.
- Added the Playwright acceptance flow against the default registry, not a
  synthetic pack. It proves the served pack is the `schema_example` Najdorf
  fixture with `human_common`, then plays through authored checkpoints,
  rewinds, creates and switches an alternative, compares both branches, and
  downloads a legal PGN with a variation. `make test-browser` runs it and the
  separate `browser.yml` CI job installs Chromium and retains failure
  artifacts.
- The browser flow caught four cross-layer seams that mounted tests could not:
  native `fetch` needed a receiver-safe wrapper; `R` needed to choose the
  checkpoint before the active cursor rather than the just-reached checkpoint;
  PGN download needed a DOM-attached anchor; and pack/run PGN merging needed to
  preserve actual opponent nodes as system moves rather than inventing missing
  selector events. Each fix has exercising coverage. Unexpected server faults
  are now logged while the HTTP response remains typed and non-disclosing.
- Added root Compose packaging. Default mode is the server plus deterministic
  mock; the `engines` profile adds Maia and sets the server to Maia mode. The
  Maia sidecar performs `uci` and `isready` against the pinned model before
  creating `/ready`; Compose waits for that healthcheck before starting the
  engine-backed server. `make up`, `make up-engines`, and `make down` wrap the
  lifecycle.
- Added server and Maia production images, a Stockfish-equipped devcontainer
  on the same Compose toolchain, and manifest verification in `schema:check`.
  The tag-triggered release workflow builds both images for amd64/arm64, pushes
  version and commit-SHA tags to GHCR, and attaches a generated Compose file
  pinned to the two exact image digests.
- Validated both live profiles. Default Compose became healthy and served the
  actual living registry. In engines mode, Maia reached healthy only after its
  model/UCI self-test, the dependent server then started, `/healthz` reported
  `maia`, and `/capabilities` reported the pinned Maia model plus Stockfish.
- In-browser latency sample on this Apple Silicon host with local Chromium
  (one acceptance run, warm application): board ready 79.2 ms (budget <250,
  pass); rewind 31.0 ms (budget <100, pass); branch switch 48.0 ms (budget <50,
  pass); uncached mock reply 1.1 ms and cached mock reply 0.6 ms. A separate
  browser-to-Compose measurement recorded an uncached Maia reply at 234.8 ms
  (budget <600, pass). These are honest smoke measurements, not a stable
  hardware benchmark or CI timing gate; Playwright writes fresh values to the
  ignored `test-results/` directory.
- The owner-only walkthrough checkbox remains intentionally unchecked. Layer 4
  stops at the tested and packaged experience ready for that walkthrough.
- The final standalone `make test-browser` rerun passed with one Maia-only test
  intentionally skipped. Its fresh mock measurements were: board ready 107.3
  ms, rewind 32.6 ms, branch switch 45.1 ms, uncached reply 1.2 ms, cached reply
  0.8 ms — all within the same acceptance budgets.

## 2026-08-11 (claude, review of layer 4)

- Independently verified: 136 tests green (ENGINES_REQUIRED=1); layer-3
  blocking finding fixed at all three levels (registry rejects non-selectable
  modes, living fixture → human_common, Playwright runs a SERVED pack — the
  class can't recur); compose.yaml with engines/devcontainer profiles and a
  /ready-file healthcheck; browser.yml + release.yml CI jobs; devcontainer;
  make up/up-engines/down/test-browser. Browser latencies all inside budget
  (board 107ms, rewind 33ms, branch switch 45ms, uncached Maia 235ms).
  **Layer 4 APPROVED.**
- All plan boxes closed except THE WALKTHROUGH — owner's. RFC completion
  protocol waits on it.
