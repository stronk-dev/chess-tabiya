# engine-workers — log (append-only)

## 2026-08-12 (claude, setup)

- RFC accepted after adversarial review (EW-C1..C8 all resolved in-draft; no
  owner rulings needed — resolutions derived from standing rulings; see RFC
  blockers section + changelog).
- Key seams for implementers: selector never appends (writer does); run schema
  v0.3 adds evidence.attached (declared amendment of archived branch-runtime);
  theory_strict membership is by transposeKey.
- Next: codex session 1 → §1 schema v0.3 + §2 supervisor.

## 2026-08-12 (codex, §1 run schema v0.3)

- Amended the living run schema to v0.3 with `evidence.attached`; the archived
  branch-runtime RFC remains unchanged. The event requires a node id, at least one
  unique evidence reference, and a typed payload: `eval|wdl|bestline`,
  `engine_validated|human_model_predicted`, plus source-specific values.
- Runtime projection appends unique references to the named node without changing
  objective state. Tests cover node-local projection, preservation of the typed
  payload in the event log, unknown-node rejection, valid schema acceptance, and
  a checked-in negative fixture missing the required evidence source.
- Updated the schema constant, runtime build assertion, and canonical branch-runtime
  and development docs from v0.2 to v0.3. Focused schema/runtime tests green (18
  tests); full verification follows before the checkpoint commit.
- Checkpoint verification: `make verify` green (14 files, 73 tests, all
  typechecks and schema/scaffold verification); `git diff --check` clean.

## 2026-08-12 (codex, §2 engine supervisor)

- Added a per-engine UCI supervisor in `apps/server`. Startup is
  spawn → `uci`/`uciok` → capture advertised identity/options → configured
  `setoption` commands → `isready`/`readyok`. Requests serialize per engine;
  health is an active `isready` exchange; shutdown sends `quit` and force-kills
  after a one-second bound.
- Unexpected exits reject in-flight requests and restart through capped
  exponential backoff. Defaults: 250 ms initial, 5 s maximum, five attempts;
  specs may override them. Health exposes status, successful restart count,
  identity, and last error. The bounded transcript defaults to 256 entries and
  records sent/received UCI, stderr, and lifecycle lines across restarts.
- Captured identity contains id/kind, advertised name/version, optional
  model/container identifiers, and `seedHonored` determined by whether the
  configured seed option was actually advertised. Stockfish correctly records
  `seedHonored: false`; Maia first-contact remains §3.
- Added typed `ENGINE_UNAVAILABLE` with engine id/retry hint and HTTP 503, plus
  `POLICY_MODE_UNSUPPORTED` with HTTP 422. No fallback engine is selected. The
  supervisor owns no run and appends no events; EW-C1's pure-selector/writer-
  commits boundary remains untouched for §4.
- Real-Stockfish tests cover handshake, options, depth-limited search, active
  health, identity, bounded-buffer eviction, graceful shutdown, spawn failure,
  and forced-exit/backoff/restart. This machine has no host Stockfish, so focused
  tests used `/usr/games/stockfish` from the already-local `maia-smoke:latest`
  image via explicit `SF_CMD=docker`/JSON `SF_ARGS`. CI now installs the Stockfish
  system package; absence produces a clear install/`SF_CMD` instruction.
- Added canonical `docs/engine-workers.md` for the implemented §1–§2 surface and
  explicit not-yet-implemented boundary. Focused supervisor suite green (4 tests);
  full verification follows before commit.
- Checkpoint verification with the real-Stockfish command above: `make verify`
  green (15 files, 77 tests, all typechecks and schema/scaffold verification);
  `git diff --check` clean.

## 2026-08-12 (claude, review of §1–§2)

- Verification initially FAILED locally: 2 supervisor tests require a real
  Stockfish and this machine had none — codex's "verify green" was true on its
  env (SF via the Maia image) but not portable. Root cause: my spec said
  "fail with a clear message if absent," which breaks the verify gate on
  binary-less machines. Fixed both layers: stockfish installed via brew here
  (verify now green: 77 tests), and the RFC amended — **skip-with-warning
  locally, ENGINES_REQUIRED=1 makes absence fail in CI**. Codex: implement the
  skip policy in the next session.
- Otherwise verified: run schema v0.3 carries evidence.attached (+ negative
  fixture); supervisor has real handshake/restart-after-crash tests, transcript
  buffer, identity capture; ENGINE_UNAVAILABLE / POLICY_MODE_UNSUPPORTED typed
  and mapped. **§1–§2 APPROVED** with the skip-policy item carried into §3.
- Process note: reviews must re-run verify on a second environment before
  trusting "green" — recorded for future sessions.

## 2026-08-12 (codex, amended engine-test policy)

- Real-Stockfish tests now print a prominent warning and skip locally when no
  binary/`SF_CMD` is available. `ENGINES_REQUIRED=1` turns the same condition into
  a suite failure; CI sets it and still installs the system package. Error-contract
  tests remain active regardless of engine availability.

## 2026-08-12 (codex, §3 Maia production sidecar)

- Promoted the research harness lineage to `workers/maia`: Python 3.12.13,
  python-chess 1.999, Maia-3 source commit
  `1e13597c42d4858b7cfd7cfdae01e297263364b2`, and 5M checkpoint snapshot
  `b6559de2398d7140b985f28fd2c19fb5e47ddabe`. The build verifies source and
  checkpoint identities, disables runtime Hugging Face access, and makes
  `--use-uci-history` part of the immutable entry point.
- Built `chess-tabiya-maia:1e13597` successfully; local image identity:
  `sha256:2e77dfee8a9de0f360c27efc288e479dfb4d4155740b16db9e95674cd0082c14`.
  `maiaDockerSpec` records the pinned source/model plus deployment-supplied image
  digest and gives the existing supervisor a Docker stdio command.
- First-contact UCI inspection found `Elo`, `SelfElo`, `OppoElo`, `Temperature`,
  `TopP`, and `MultiPV`; there is no seed option, so `seedHonored: false` is now
  recorded rather than assumed. Static sidecar tests green (2); tagged
  `INTEGRATION=maia` supervisor handshake/history test green against the promoted
  image (1) and remains outside `make verify` via a separate Vitest config.
- DESIGN-GAP for §4: pinned upstream computes policy probability internally but
  its UCI info lines expose candidate rank, cp, and WDL only. WDL is an outcome
  prediction, not move-policy mass, so it cannot truthfully implement EW-C3's
  proportional spine sampling. No Python patch or rank-as-probability shortcut was
  introduced; theory-strict needs an explicit resolution before its checkbox can
  flip.
- §3 checkpoint verification: `make verify` green (16 files, 79 tests); tagged
  Maia integration green separately; `git diff --check` clean.

## 2026-08-12 (codex, §4 blocked before implementation)

- EW-C3 cannot be implemented faithfully against the promoted sidecar: the
  pinned upstream UCI adapter computes `item["policy"]` internally, but prints
  only rank, cp, WDL, and PV. WDL describes predicted game outcome after a move,
  not the probability that a human chooses that move. Treating WDL or rank as
  policy mass would violate the RFC and evidence-typing discipline. The exact
  mechanism needs either a narrow sidecar compatibility patch exposing upstream's
  existing policy value, or an owner-approved sampling-contract amendment.
- EW-C1 has a second wire-contract gap: run schema v0.3 defines
  `opponent.move_selected.data` as exactly `{nodeId, branchId, moveUci}` with
  `additionalProperties: false`, while this RFC requires the writer to embed the
  selection and engine identity. Adding those fields after v0.3 shipped requires
  a declared schema amendment (normally v0.4), plus replay/schema tests; silently
  dropping identity would violate the accepted selector contract.
- Stopped before implementing `/select-move`, cache, or `appendOpponentPly`: both
  gaps affect their public/event shapes. §4 checkboxes remain open. Recommended
  owner resolution: authorize the minimal UCI transport patch (expose the already-
  computed policy scalar; no new chess logic) and declare run schema v0.4 with a
  typed selection/engine-identity payload on `opponent.move_selected`.

## 2026-08-12 (claude, §4 DESIGN-GAP resolutions)

- Both §4 gaps resolved in the RFC (no owner ruling required — both follow
  standing rulings):
  1. **Run schema v0.4**: opponent.move_selected gains the typed selection
     payload {moveUci, candidates?[{moveUci, mass?, rank}], engine identity} —
     same declared-amendment mechanism as v0.3.
  2. **Maia policy exposure**: sidecar carries a minimal patch against the
     pinned maia3 commit emitting the existing policy scalar as a UCI info
     field (workers/maia/patches/, applied at build, AGPL-published, upstream
     PR candidate). WDL never misused as probability. Fallback if patch breaks
     on a future pin: rank-weighted sampling, logged as degraded.
- §4 unblocked. BACKLOG gap note updated.

## 2026-08-12 (codex, §4 opponent selector)

- Bumped the living drill-run schema and package constant to v0.4. The
  `opponent.move_selected` event now requires a typed selection containing the
  chosen move, optional ranked candidates with optional policy mass, and exact
  engine/model identity including `seedHonored`. Added a checked-in negative
  fixture missing that required identity bit; the earlier v0.3 evidence event is
  preserved unchanged.
- Added `workers/maia/patches/maia3-uci-policy-mass.patch`. The Docker build
  checks and applies it against pinned Maia commit
  `1e13597c42d4858b7cfd7cfdae01e297263364b2` before installation. It only emits
  the already-computed policy scalar on MultiPV UCI lines; WDL remains separate.
  Rebuilt image `chess-tabiya-maia:1e13597` as
  `sha256:49126a62213d86e7305d8087499136830002cb42ceaf9b587e977e2cd806985e`;
  the tagged `INTEGRATION=maia` test passed and observed bounded policy mass on
  every returned info line.
- Implemented pure `POST /select-move`. `human_common` maps Elo, temperature,
  and top-p to Maia; `strong_engine` uses a configurable movetime-limited
  Stockfish request; `theory_strict` indexes authored positions by
  `transposeKey`, resumes after a move-order transposition, filters MultiPV to
  spine children, samples proportionally by policy mass, uses seeded uniform
  fallback at zero/no eligible mass, and falls back to `human_common` off-spine.
  A missing policy field on a future pin logs `DEGRADED_POLICY_MASS` and uses
  inverse-rank weighting; it never substitutes WDL.
- The selection cache key is exactly policy-config digest, branch seed, and a
  SHA-256 history hash covering start FEN plus every UCI move. Identical retries
  reuse the same promise/result; seed or history changes miss; failures evict.
- Added runtime `appendOpponentPly(selection)`. Bare opponent commits are
  rejected; the helper handles any implicit fork first, then emits the typed
  selection immediately followed by its matching move. The REST seam test proves
  selection itself mutates no run, a server identity gets
  `NOT_ACTIVE_WRITER`, the actual writer can append the ply, and full read-back
  replay succeeds.
- Verification: pinned-source `git apply --check` passed; the rebuilt Maia
  tagged integration passed (1 test); `ENGINES_REQUIRED=1 make verify` passed
  all typechecks, 17 files / 88 tests, and schema/scaffold verification.
- Final post-integrity run (nested selection mismatch + degraded rank-fallback
  tests added): tagged Maia integration still 1/1; CI-equivalent verification
  passed 17 files / 90 tests plus all typechecks and schema/scaffold checks.
