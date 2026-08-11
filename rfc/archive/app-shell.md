# RFC: Application Shell & Capability Registry

- **Status:** implemented
- **Author:** claude (for Marco)
- **Created:** 2026-08-11
- **Design refs:** `design/03-product-breadth.md` (surface map, IA, B1/B8), `design/02-product-shape.md` §UX commitments
- **Exploration gate:** breadth ruling 2026-08-11 (logged); program item #1
- **Depends on:** `docs/branch-runtime.md`, `docs/drill-client.md`
- **Parent / amends:** **`rfc/archive/drill-client.md`** — amends implemented behavior: `GET /capabilities` response shape, a new `/runs` collection route, run-storage listing + schema migration, the client shell layout, and the keyboard-ownership contract (AS-C7)
- **Supersedes / superseded by:** —
- **Planning:** `planning/app-shell/`

## Summary

The frame every future surface plugs into: stable routes for the full product
(Home · Play · Learn · Review · Live · Create · Library · Settings), a
viewport-fitted region model, session resume, and a **capability registry** that
tells the UI what this deployment can actually do — so unavailable surfaces say
so honestly instead of being hidden or faked. Closes B1; starts B8.

## Motivation

The walkthrough validated the mechanic and exposed the frame: a pack-picker plus
one scrolling page is a mechanism demo. Reserving the whole information
architecture now prevents every later RFC from redefining navigation around its
own fixture. Two walkthrough frictions are in scope: the page scrolls instead of
fitting the viewport, and there is no way back to anything.

**Scope correction (AS-C5):** this is a **shell-layer rewrite**, not a re-homing.
There is no router today (`App.svelte` is a two-branch `{#if}` over query
params), screen state lives inside `DrillSessionController`'s phase machine, and
`.drill` is document-flow with no scroll containers. The RFC owns dissolving
that phase machine into route state and converting the drill layout to a fitted
grid. Board/timeline/rail *components* are reused as-is.

**Out of scope:** any new surface's behavior (Learn/Live/Create render honest
empty states), evidence UI (program #2), compare defaults or standalone compare
(program #5), responsive/PWA proper (later B8).

## Specification

### Routes and IA

| Route | v1 content |
|---|---|
| `/` Home | resume card (most recent run), entry to Play, recent activity |
| `/play` | pack list (existing `PackList`); Just Play / From-position appear as unavailable-with-reason |
| `/play/run/:runId` | the drill screen, fitted-grid layout |
| `/review` | run history list; selecting a run opens it at `/play/run/:id` where compare already works. **Standalone compare is out of scope** — `CompareView` requires a live controller session (AS-C5) |
| `/learn`, `/live`, `/create` | honest empty state naming the program item that delivers it |
| `/library` | packs + exported PGNs, read-only (open question resolved: it stays a route — AS-C7) |
| `/settings` | capability report, provider status, theme, keyboard map |

**Router (AS-C5):** hand-rolled, ~100 lines, history-API based — no new
dependency, no SvelteKit migration (recorded in the deferred-decisions
register). Deep-linkable; unknown route → not-found view with navigation.

### Run index, storage listing, and migration (AS-C1)

- `RunStorage` gains `list(limit, offset)` returning summary rows. **No
  per-row replay** and no reliance on the live pack registry.
- Storage carries a **denormalized summary column** written on every `save`
  (the snapshot write already happens; the summary is free): `{title (captured
  at run creation, so stale-digest runs keep their historical name), packId,
  updatedAt, objectiveState (of the node at `activeCursor` when saved),
  branchCount}`.
- **Migration mechanism (new; the repo has none and `compose.yaml` mounts a
  persistent volume, so silent no-op schema changes are a real hazard):** a
  `PRAGMA user_version` migration runner — ordered, idempotent steps applied at
  open, logged. Step 1 adds the summary column and backfills existing rows by
  replaying them once at upgrade time.
- `GET /runs?limit=&offset=` returns those summaries plus `activeWriterId`.

### Lease visibility and resume (AS-C2)

- Read responses (`GET /runs` summaries and `GET /runs/:id/graph`) include
  `activeWriterId`. The client compares it to its stored id for that run —
  no probing-by-mutation, no 409 required to learn the truth.
- `WriterSession` gains a **non-minting `peek(runId)`**; the minting path stays
  explicit (`claimFor(runId)`), so reading a foreign run never pollutes
  `localStorage`.
- Read-only state is derived from that comparison on load (not only after a
  failed write) and rendered as the existing banner; a 409 still demotes
  defensively.

### Capability registry (AS-C4)

The server reports **only what it can actually determine**:

```ts
// GET /capabilities (extends the existing engines/policyModes payload)
providers: {
  opponent: "maia" | "mock" | "none",   // from engineMode + supervisor state
  judge:    "stockfish" | "mock" | "none",
  llm:      "none"
}
surfaces: Record<SurfaceId, "available" | "unavailable-here">
```

`planned` is **roadmap data and stays a client constant** — it is identical in
every deployment of a build and has no business on the wire. `mock` is a
first-class provider value: in `ENGINE_MODE=mock` the judge is genuinely a mock
executor and must say so rather than claim Stockfish or claim nothing while
evidence visibly flows. Contract change spans three files: server capabilities,
`apps/web/src/lib/api.ts`, and `capabilities.test.ts`.

### Region model (viewport-fitted)

Fixed top bar (route nav + run context) plus a content region that fits without
page scroll; only designated inner panes scroll (timeline, branch rail, lists).
The drill screen becomes a grid: board sized to the smaller viewport axis, rail
and timeline as their own scroll containers. Minimum supported desktop viewport
1280×720; below that panes stack (responsive/PWA proper is later B8).

### Keyboard ownership contract (AS-C3)

- **One window-level dispatcher, owned by the shell.** `DrillScreen` stops
  binding `svelte:window` and registers a **scoped handler** for the drill
  region; the dispatcher routes events by focus region.
- Ownership: shell owns `g`-chords, `?`, `Esc` **when no region handler claims
  them**; the drill region keeps `R/Shift+R/B/1..9/Tab/←→/Space/E` unchanged
  and claims `?`/`Esc` while its own overlays are open.
- **`Tab` rule:** the drill's compare-toggle binding applies only while focus is
  inside the drill region, and never suppresses Tab when focus is in the top bar
  or any nav control — the existing `main.drill` focus → `Tab` browser test
  keeps passing while keyboard-only navigation out of the drill becomes possible
  (a skip-link plus `g` chords provide the escape).
- Chord suppression: after `g`, the next key is consumed by the chord and not
  delivered to region handlers.

### Honest-unavailability convention (AS-C6)

Mechanically testable: **every `[disabled]` or `[aria-disabled="true"]` control
must carry `aria-describedby` resolving to non-empty text.** A shared control
wrapper provides it; the DOM-sweep test asserts it across all rendered routes.
The existing `Compare` button (disabled at `cards.length < 2` with no reason)
is fixed under this convention — in scope, small.

## Deviations from design

`design/03` lists Learn/Live/Create as first-class surfaces; this RFC reserves
their routes and ships empty states — the program assigns their behavior to
later items. Timing only, no substantive deviation.

## Acceptance criteria

- Every route renders, deep-links, survives reload; unknown route → not-found.
- Migration: opening a pre-migration database file upgrades it, backfills
  summaries, and is idempotent on second open (tested against a fixture DB).
- `GET /runs` returns summaries incl. `activeWriterId`; stale-digest runs still
  show their captured title.
- Resume: create → reload → Home resume card → reopen in writer mode; a second
  browser context shows read-only **on load** (no failed write required);
  `peek()` on a foreign run leaves `localStorage` untouched (asserted).
- Capabilities: `ENGINE_MODE=mock` reports `opponent: mock, judge: mock`;
  engines mode reports `maia`/`stockfish`; `surfaces` contains no `planned`
  value (server-side assertion).
- Honesty sweep: no disabled control without resolving `aria-describedby`,
  across all routes.
- Keyboard: `g`-chords, `?`, `Esc`, focus restoration; drill keys unchanged and
  the existing `main.drill` → `Tab` compare test still passes; keyboard-only
  path from drill body to top-bar nav exists.
- Viewport: Playwright **projects** at 1280×720 and 1440×900 assert
  `document.scrollingElement.scrollHeight <= clientHeight + 1` on every route,
  and the board's bounding box is inside the viewport (±1px).
- `docs/drill-client.md` updated for the amended behavior and `rfc/README.md`
  index row updated (process requirements, AS-C7).
- `ENGINES_REQUIRED=1 make verify` and `make test-browser` green.

## Open questions

- Spectator/read-only projection shape is reserved by the role-aware nav but
  specified by program #8 (Live).

## Acceptance review blockers (2026-08-11 — AS-C1..AS-C8) — RESOLVED

C1 → storage `list()` + denormalized summary column + `PRAGMA user_version`
migration runner with backfill; C2 → `activeWriterId` on read responses,
non-minting `peek()`, load-time read-only derivation; C3 → single shell
dispatcher with region-scoped handlers, explicit ownership table and Tab rule;
C4 → server reports only deployment-determinable state, `planned` demoted to a
client constant, `mock` a first-class provider value; C5 → scope corrected to a
shell-layer rewrite, hand-rolled router, standalone compare removed from scope;
C6 → `aria-describedby` convention + DOM sweep, existing Compare button fixed;
C7 → `Parent / amends` set, Library resolved as a route, docs/index updates in
acceptance; C8 → Playwright projects, `scrollingElement` assertion, ±1px board
tolerance. Original texts: git history (review landing).

## Changelog

- 2026-08-11: created as program item #1 under the reordered breadth program.
- 2026-08-11: adversarial review AS-C1..C8; all resolved in-draft (no owner
  rulings required — resolutions follow standing rulings and the breadth
  ruling's own "current UI is not an acceptable application architecture");
  **status → accepted**.
- 2026-08-11: implementation and independent acceptance review complete;
  canonical behavior distilled to `docs/app-shell.md`; **status → implemented**.
