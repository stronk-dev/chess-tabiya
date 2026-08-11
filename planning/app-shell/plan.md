# Application Shell & Capability Registry — implementation plan

RFC: `rfc/app-shell.md` (accepted 2026-08-11). Assignee: codex.
Breadth program #1 (B1/B8). `[x]` flips only with the exercising test.
This is a shell-layer REWRITE (no router exists today) — read AS-C5.

## 1. Storage: listing + migration (server, no UI)

- [x] `PRAGMA user_version` migration runner: ordered, idempotent, logged at open
- [x] Step 1: denormalized summary column (title captured at creation, packId,
      updatedAt, objectiveState at activeCursor, branchCount) + backfill by
      one-time replay; idempotency test against a fixture DB
- [x] `RunStorage.list(limit, offset)`; no per-row replay, no registry dependency
- [x] `GET /runs?limit=&offset=` returning summaries + activeWriterId

## 2. Lease visibility (server + client plumbing)

- [x] `activeWriterId` on GET /runs summaries and /runs/:id/graph
- [x] `WriterSession.peek(runId)` non-minting + explicit `claimFor(runId)`;
      test that peeking a foreign run leaves localStorage untouched
- [x] Read-only derived on load (not only after 409); 409 still demotes

## 3. Capability registry

- [ ] providers {opponent, judge, llm} derived from engineMode + supervisor;
      `mock` is first-class and honest
- [ ] surfaces map: available | unavailable-here ONLY (server assertion that
      no `planned` value is ever emitted); `planned` lives as a client constant
- [ ] Three-file contract update: server capabilities, web api.ts, capabilities.test.ts

## 4. Router + shell frame

- [ ] Hand-rolled history-API router (~100 lines, no new dependency)
- [ ] Dissolve DrillSessionController's phase machine into route state
- [ ] Top bar (route nav + run context), not-found view, deep links, reload-safe
- [ ] Routes: / /play /play/run/:id /review /learn /live /create /library /settings
      (Learn/Live/Create = honest empty states naming their program item)

## 5. Fitted region model

- [ ] Viewport-owning layout; inner scroll containers only (timeline, rail, lists)
- [ ] Drill screen → grid; board sized to smaller viewport axis
- [ ] Playwright projects 1280x720 + 1440x900; scrollingElement + board-bbox assertions

## 6. Keyboard ownership + honesty convention

- [ ] Single shell keydown dispatcher; DrillScreen becomes a region-scoped handler
- [ ] Ownership table incl. the Tab rule; existing main.drill→Tab compare test must
      still pass; keyboard-only path drill body → top-bar nav
- [ ] `g` chords, `?`, `Esc`, focus restoration
- [ ] aria-describedby convention for disabled controls + DOM sweep across routes;
      fix the existing Compare button

## 7. Process closeout

- [ ] docs/drill-client.md updated for amended behavior (capabilities shape,
      /runs route, shell/keyboard contract)
- [ ] rfc/README.md index row; ENGINES_REQUIRED=1 make verify + make test-browser green
