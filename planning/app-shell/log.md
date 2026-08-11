# app-shell — log (append-only)

## 2026-08-11 (claude, setup)

- RFC accepted after adversarial review (AS-C1..C8 resolved in-draft; no owner
  rulings needed). Key corrections from review: this is a shell-layer rewrite
  (no router exists), storage cannot list and the repo has no migration
  mechanism while compose mounts a persistent volume, lease visibility was
  unimplementable without a non-minting peek, and the keymap would have
  double-fired against DrillScreen's window handler.
- Router decision: hand-rolled, no new dependency (deferred-decisions register).
- Next: codex session 1 → §1 storage listing + migration.

## 2026-08-11 (codex, §1 storage listing + migration)

- Added the ordered `PRAGMA user_version` runner. Migration 1 is transactional,
  logged after commit, adds `summary_json`, and replays each legacy event log
  exactly once to backfill it. A fixture database test proves the upgrade and
  that reopening at version 1 applies nothing.
- Run summaries are maintained with snapshot writes and list without replay or
  pack-registry access. New registered runs capture the pack title; legacy rows
  fall back to `packId` because the pre-migration snapshot did not store titles.
- Added `RunStorage.list(limit, offset)` and `GET /runs` (default 50, maximum
  100), ordered newest-first and returning `activeWriterId`.

## 2026-08-11 (codex, §2 lease visibility)

- Added `activeWriterId` to graph reads and the typed web response, alongside
  the run-list lease field shipped in §1.
- Replaced implicit `WriterSession` construction with explicit `claimFor()`.
  `peek()` only returns an existing local claim; `observe()` creates an
  in-memory read-only follower and never writes localStorage.
- Resume reads the graph before constructing run state. A matching stored id
  resumes writer mode; a missing or foreign id starts read-only immediately.
  Tests cover both refresh paths and prove a foreign peek leaves storage empty;
  the existing 409-demotion test remains green as the defensive fallback.
- Session closeout: `ENGINES_REQUIRED=1 make verify` is green (31 test files,
  141 tests; zero Svelte diagnostics; scaffold and packaging checks pass).

## 2026-08-11 (claude, review of §1–§2)

- Independently verified (ENGINES_REQUIRED=1): 141 tests / 31 files green.
  Migration runner reads PRAGMA user_version with a real legacy-fixture test
  proving upgrade-then-skip-on-reopen (the exact hazard AS-C1 named, since
  compose mounts a persistent volume); RunStorage.list() + paginated GET /runs
  with activeWriterId; WriterSession.peek() has the "no minting, localStorage
  untouched" test AS-C2 demanded. drill-client's completion protocol also ran
  — four RFCs now archived. **§1–§2 APPROVED.**
- Accepted judgment call: legacy runs fall back to packId as title (old
  snapshots carry none). Honest and cheap; noted so the history list's odd
  early rows are explainable rather than mysterious.
- §3 (capability registry) green-lit — the last server-side piece before the
  router/shell rewrite.

## 2026-08-11 (codex, §3 capability registry)

- Extended `/capabilities` with deployment-derived providers and surface
  availability. Real-mode identities are included only while their supervisor
  health is `ready`; unhealthy/restarting Maia or Stockfish reports `none`
  instead of leaking a stale identity.
- Mock mode reports `opponent: mock` and `judge: mock`: the latter deliberately
  follows the wired `MockEvidenceExecutor`, which produces visible evidence
  without a UCI judge identity. LLM remains honestly `none`.
- The server runtime assertion accepts only `available | unavailable-here` for
  the complete surface keyset and rejects `planned` (exercised directly).
  Roadmap state now lives in the web-only `PLANNED_SURFACES` constant.
- Session closeout: `ENGINES_REQUIRED=1 make verify` is green (31 test files,
  144 tests; zero Svelte diagnostics; scaffold and packaging checks pass).

## 2026-08-11 (claude, review of §3)

- Independently verified (ENGINES_REQUIRED=1): 144 tests green. Providers
  derived from engineMode AND live supervisor health (unhealthy engines report
  `none` rather than lying); mock mode reports mock/mock; surfaces type admits
  only available|unavailable-here with tests rejecting `planned`;
  PLANNED_SURFACES is client-only. AS-C4 fully satisfied. **§3 APPROVED.**
- §4 green-lit ALONE (not §4–§6 together): dissolving DrillSessionController's
  phase machine into route state is the riskiest single change in this RFC and
  should be reviewable before the fitted layout and keyboard dispatcher land on
  top of it.

## 2026-08-11 (codex, §4 router + shell frame)

- Added a dependency-free history-API router with typed parsing for every shell
  route, encoded run ids, push/replace/popstate handling, and an explicit
  not-found state. `/play/run/:id` reloads without query metadata: the client
  derives `packId` from the authoritative `run.started` event.
- Removed `phase` and pack-list state from `DrillSessionController`. It now owns
  only an optional active drill session; App route state owns Home, Play, run,
  Review, Learn, Live, Create, Library, Settings, loading, and not-found views.
- Added the global top bar with primary navigation and run/access context. Home
  uses the run index for a lease-aware resume card; Review lists runs and opens
  them in the existing live drill/compare context. Learn/Live/Create identify
  their exact breadth-program items and explicitly decline to fake behavior.
- Route/component tests cover initial deep-link reconstruction, Review → run,
  writer and foreign/read-only resume, every reserved route, and not-found.
  The existing Playwright drill walkthrough now enters through `/play` and is
  green. Fitted layout and keyboard ownership were intentionally untouched.
