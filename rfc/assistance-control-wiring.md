# RFC: Assistance control wiring

- **Status:** draft — ready for independent review
- **Author:** Codex, extracting the dependency-free subset of `assistance-controls`
- **Created:** 2026-08-22
- **Design refs:** `design/05-in-run-experience.md` §3a, §3a-i, §3b and §3-forms
- **Exploration gate:** `design/research/mechanics-by-mode.md` §3.3–§3.5 and the verified
  D308/D309 code census in `assistance-controls.md`
- **Depends on:** nothing unlanded
- **Parent / amends:** `archive/adaptive-guidance.md`; extracts D308/D309 and the ruled on-ramp
  fallback from `assistance-controls.md`
- **Supersedes / superseded by:** supersedes only parent §§2, 3, 4.1–4.2 and their criteria;
  D307's real workflow ceiling remains with F5/D715
- **Planning:** `planning/assistance-control-wiring/` once implementing

```tabiya-claims
none
```

## Summary

The runtime, server and HTTP client already support learner-initiated `attempt_end` disclosure,
but the run screen has no control. Separately, live named-shape guidance ignores its own preference
while a smaller duplicate is gated by two switches. This RFC wires the missing control, makes the
`guided` preference own the shape-marker channel, and applies the one non-silent fallback already
ruled for on-ramp packs. It does not define workflow presets or context ceilings.

## Motivation

D308 and D309 are defects against shipped intent, not new product choices. A re-close rule only has
a job if reveal is reachable, and a learner-choice mode only exists if its switch controls it.
Leaving these behind D715 would couple two missing buttons to the much larger preset architecture.

Out of scope: `permittedAssistance`, D532's per-context ceilings, F5 presets/modules, detector
admission, marker selection, new evidence, learner ratings and any automatic reveal.

## Specification

### 1. Learner-initiated reveal

`RunStateStore` gains `reveal()`, implemented through its existing mutation path and
`RunApi.reveal(runId, writerId)`. `SessionController` gains the matching busy/error-wrapped method.
`App.svelte` passes it to `DrillScreen` as `onReveal`.

Inside the existing assistance region, `DrillScreen` renders `Open evidence for this position`
only when `run.feedbackPolicy === "attempt_end"`, the viewer can write, and the handler exists. It
never guesses from pack presence. When delivery is already open the control is disabled with:

> Evidence is open at this position until you commit your next move.

The always-visible mechanism sentence is:

> Recorded on the run as a disclosure, and it closes again on your next committed move.

The client does not pre-empt a live-match refusal because it lacks authoritative pause state. The
server's existing `MATCH_LIVE` refusal reaches the existing alert. Reveal emits no new event type,
route or error code; it uses `feedback.revealed`. An already-open empty mutation remains success.

### 2. Guided means the live named-shape channel

The computed shape-marker list is empty unless `assistance.guided === "live"`. The pivotal dialog's
second, smaller named-plan block is deleted; the full `ShapePanel` remains the sole renderer.
Pivotal sentences, endgame reading, re-voice and marker admission are unchanged.

When guidance is on and no shape fires, the learner-opened structural-reading region states:

> No named structure entry matches this line.

The source firing computation remains available for the honest-empty result. `markers` and `guided`
are independent: `guided: live, markers: off` still exposes shape markers and their full panel.

### 3. Fallback defaults

`assistance-preference.ts` exports `PROFILE_DEFAULTS` for all six current profiles. Five values are
`SILENT_ASSISTANCE`; `onramp` is `{...SILENT_ASSISTANCE, guided:"live"}`. Every absent/invalid/error
fallback in `loadAssistance` uses that table. Stored v4 preferences always win whole; defaults are
never merged over a learner's explicit `guided: off`. No migration or config-version bump occurs.

`assistanceProfile`'s shipped `immediate_guard` mapping is the only route to `onramp`. This RFC does
not implement a rating-driven fade and does not alter which shapes a pack loads.

### 4. Implementation surface

The unit is one file or one documentation/test family; total **nine**.

| # | Surface | Change |
|---:|---|---|
| 1 | `apps/web/src/lib/run-state.ts` | reveal mutation |
| 2 | `apps/web/src/lib/session-controller.ts` | busy/error-wrapped reveal |
| 3 | `apps/web/src/App.svelte` | pass handler |
| 4 | `apps/web/src/lib/DrillScreen.svelte` | control, guided gate, duplicate deletion, empty state |
| 5 | `apps/web/src/lib/assistance-preference.ts` | exported fallback table |
| 6 | focused web unit tests | store/controller/preference/screen behavior |
| 7 | `tests/browser/drill.spec.ts` | reveal/re-close and real guided marker flow |
| 8 | `docs/adaptive-guidance.md` | on-ramp exception and reveal boundary |
| 9 | `docs/drill-client.md` | control predicate/copy/refusal and guided meaning |

## Deviations from design

None. D532's later ceiling ruling is preserved by explicitly excluding `permittedAssistance`.

## Acceptance criteria

1. A writable `attempt_end` position/imported run exposes the reveal control; a delayed/segment pack
   and read-only viewer do not.
2. Clicking reveal emits exactly one `feedback.revealed` event and refreshes the projected run.
3. Human split/corpus permissions become available from the refreshed state and re-lock after the
   next committed move.
4. An already-open reveal succeeds without duplicating the event.
5. An unpaused live-match refusal appears in the existing alert; the client does not over-refuse a
   paused match.
6. With no stored preference, a firing produces no `.shape-marker` outside on-ramp.
7. `guided: live` with `markers: off` renders the marker and opens the attributed `ShapePanel`.
8. The duplicate named-plan sentence occurs only in `ShapePanel.svelte`; guided honest-empty copy
   remains when no shape fires.
9. The on-ramp fallback differs from silence only at `guided`; the other five deep-equal silence.
10. Stored `guided: off` beats the on-ramp fallback; malformed/absent storage uses the fallback.
11. The existing real marker tests are amended to enable guidance, not deleted.
12. No schema, route, error-code or `AssistanceConfig.version` value changes; the nine implementation
    surfaces and both docs are covered by the scoped diff.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | D308 — reachable learner-initiated reveal | `assistance-control-wiring` | implementation commit | |
| D2 | D309 — guided preference owns the named-shape live channel | `assistance-control-wiring` | implementation commit | |

## Open questions

None. D532/D715 is deliberately outside this RFC rather than silently answered.

## Changelog

- 2026-08-22: extracted the dependency-free D308/D309/default subset after D715 proved the parent
  RFC's permission half could not implement the owner's ceiling ruling with its current input shape.
