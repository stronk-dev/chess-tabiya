# RFC: Application Shell & Capability Registry

- **Status:** draft
- **Author:** claude (for Marco)
- **Created:** 2026-08-11
- **Design refs:** `design/03-product-breadth.md` (surface map, IA, B1/B8), `design/02-product-shape.md` §UX commitments
- **Exploration gate:** breadth ruling 2026-08-11 (logged); program item #1
- **Depends on:** `docs/drill-client.md` (existing screens are re-homed, not rewritten)
- **Parent / amends:** —
- **Supersedes / superseded by:** —
- **Planning:** `planning/app-shell/` (once implementing)

## Summary

The frame every future surface plugs into: stable routes for the full product
(Home · Play · Learn · Review · Live · Create · Library · Settings), a
viewport-fitted region model, session resume, and a **capability registry**
that tells the UI what this deployment can actually do — so unavailable
surfaces say so honestly instead of being hidden or faked. Closes B1; starts
B8.

## Motivation

The walkthrough validated the mechanic and exposed the frame: a pack-picker
plus one scrolling page is a mechanism demo. Reserving the whole information
architecture now prevents every later RFC from redefining navigation around its
own fixture (the explicit rule in `design/03`). Two walkthrough frictions are
in scope: the page scrolls instead of fitting the viewport, and there is no way
back to anything.

**Out of scope — deliberately:** any new surface's behavior. Learn/Live/Create
routes render honest empty states pointing at their program item. No new domain
logic, no drill changes beyond re-homing, no compare-default change (that is
program #5 / B3), no evidence UI (program #2 / B4).

## Specification

### Routes and IA

| Route | v1 content |
|---|---|
| `/` Home | resume card (last run), entry points to Play, recent activity list |
| `/play` | today's pack list (existing `PackList`), plus disabled-with-reason entries for Just Play and From-position (program #3) |
| `/play/run/:runId` | the existing drill screen, re-homed |
| `/review` | run history list; opens existing compare view for a chosen run |
| `/learn`, `/live`, `/create` | honest empty state: what it will do, which program item delivers it |
| `/library` | packs + exported PGNs (read-only listing over existing routes) |
| `/settings` | capability report, engine/provider status, theme, keyboard map |

Routing: client-side, history-API based, deep-linkable. Unknown route → a
not-found view with navigation, never a blank page.

### Capability registry (extends `GET /capabilities`)

The server's existing engines/policyModes descriptor gains a `surfaces` map:

```
surfaces: { play: "available", review: "available",
            learn|live|create: "planned",
            justPlay|fromPosition: "planned" }
providers: { opponent: "maia"|"mock"|"none", judge: "stockfish"|"none",
             llm: "none" }
```

Values are `available | planned | unavailable-here` (the last for
deployment-dependent capability, e.g. engines absent in mock mode). **Honesty
law:** the UI renders `planned` and `unavailable-here` distinctly and never
disables a control without saying why. A surface is never faked with mock data.

### Region model (viewport-fitted)

The app owns the viewport: a fixed top bar (route nav + run context) and a
content region that fits without page scroll; only designated inner panes
scroll (timeline, branch rail, lists). The drill screen becomes a
grid: board region sized to the smaller viewport axis, rail and timeline as
their own scroll containers. Minimum supported desktop viewport: 1280×720;
below that the shell degrades to stacked panes (responsive/PWA proper is B8,
program later).

### Session resume (B1)

Runs already persist server-side with a localStorage writer id. The shell adds:
a `runs` index endpoint (`GET /runs?limit=`, summary rows: id, packId, title,
updatedAt, objectiveState, branchCount) and a Home resume card that reopens the
most recent run in writer mode when this browser holds its lease, read-only
otherwise (existing lease semantics, no transfer).

### Keyboard and accessibility

Global: `g` then `p/r/l/c/s` route jumps; `?` help overlay (extends the existing
one); `Esc` closes overlays. Drill-screen keys are unchanged. Focus is trapped
in overlays and restored on close; every route reachable by keyboard alone.

## Deviations from design

`design/03` lists Learn/Live/Create as first-class surfaces; this RFC reserves
their routes but ships empty states — the design doc's own program assigns
their behavior to later items. No deviation in substance, only in timing.

## Acceptance criteria

- Every route in the table renders, is deep-linkable, and survives reload;
  unknown routes show the not-found view.
- Capability registry: with engines absent (mock mode), Play is `available`,
  opponent provider reads `mock`, and the UI says so in Settings — tested both
  modes.
- Honesty test: no control is disabled without an adjacent reason string
  (enumerated over the shell's controls).
- Viewport test (Playwright at 1280×720 and 1440×900): `document.body` does not
  scroll on any route; the drill screen's board fits without clipping; inner
  panes scroll independently.
- Resume: create a run, reload, land on Home, reopen from the resume card in
  writer mode; second browser context gets read-only with the banner.
- `GET /runs` index returns summaries and is covered.
- Keyboard: route jumps, `?`, `Esc`, and focus restoration tested; existing
  drill keys still pass their layer-3 tests.
- `ENGINES_REQUIRED=1 make verify` and `make test-browser` green.

## Open questions

- Whether `Library` is a distinct route or a Play/Review filter — resolve in
  planning after seeing the empty states.
- Spectator/read-only projection shape is reserved by the role-aware nav but
  not specified here; program #8 (Live) owns it.

## Changelog

- 2026-08-11: created as program item #1 under the reordered breadth program.
