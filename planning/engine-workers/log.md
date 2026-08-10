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
