# Live session platform log

## 2026-08-13 — codex implementation

- Rebased the reviewed DDL from its stale draft number to migration 9, after migrations
  6–8 landed in the ordered breadth batch.
- Implemented the session aggregate, board-control policy, possession journal,
  proposals, namespaced advisory votes with a bounded adapter intake, invitations, and
  atomic two-leg Arena imports.
- Kept session traffic outside the deterministic run event log. Vote casts are proven
  not to mutate the run, and imported human plies use `system` rather than invented
  opponent-engine provenance.
- Added response-only follower withholding state, real `/live`, session, and chrome-free
  overlay routes, and flipped the capability registry to available.
- First integration gate found the intended D17 behavior colliding with old tests that
  assumed every participant could seize a session-less run. Updated those tests to use
  an explicit host handoff; the deleted-owner case now asserts the new fail-closed
  behavior. It also exposed migration fixtures that deliberately rewind `user_version`
  while retaining newer tables, so migration 9 uses idempotent `IF NOT EXISTS` DDL.
- Current server/unit gate: 307 tests across 52 files, green.

## 2026-08-13 — integration and documentation

- Added the browser-level live path: create a session from a real served run, open its
  session screen, and open a chrome-free overlay with the projected board. Playwright
  remains at zero retries.
- Added the in-run session rail, two-second session/vote polling, proposal, handoff, and
  vote controls. Disabled controls carry explanations.
- Canonicalized the shipped behavior in `docs/live-sessions.md` and corrected the old
  identity/app-shell descriptions that said any participant could always claim and that
  `/live` was empty.
- Final pre-closeout gates: `ENGINES_REQUIRED=1 make verify` — 307 tests across 52
  files, schema/scaffold/packaging green; `make test-browser` — 11 passed, optional Maia
  test skipped, zero retries. Measured branch switch 43.8 ms, below the 100 ms worry
  threshold.
