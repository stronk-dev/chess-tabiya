# RFC: Assistance control wiring

- **Status:** implemented — 2026-08-22; the learner reveal, guided-channel ownership, duplicate deletion and on-ramp fallback shipped together with focused unit/component and built-browser coverage. *(Prior line for history: accepted — 2026-08-22, by claude as register owner on the buildability test after independent cross-review.)*
- **Author:** Codex, extracting the dependency-free subset of `assistance-controls`
- **Created:** 2026-08-22
- **Design refs:** `design/05-in-run-experience.md` §3a, §3a-i, §3b and §3-forms
- **Exploration gate:** `design/research/mechanics-by-mode.md` §3.3–§3.5 and the verified
  D308/D309 code census in `assistance-controls.md`
- **Depends on:** nothing unlanded
- **Parent / amends:** `archive/adaptive-guidance.md`; extracts D308/D309 and the ruled on-ramp
  fallback from `assistance-controls.md`
- **Supersedes / superseded by:** supersedes only parent §§2, 3, 4.1–4.2 and their criteria;
  D307's real workflow ceiling is `rfc/intent-presets.md`'s (accepted 2026-08-22, discharging D532/D715)
- **Planning:** `planning/assistance-control-wiring/` once implementing

```tabiya-claims
none
```

## Summary

The runtime, server and HTTP client already support learner-initiated `attempt_end` disclosure,
but the run screen has no control. Separately, live named-shape guidance ignores its own preference
while a smaller duplicate is gated by two switches. This RFC wires the missing control, makes the
`guided` preference own the shape-marker channel, and applies the one non-silent fallback already
ruled for on-ramp packs. It does not define workflow presets or context ceilings — `rfc/intent-presets.md` does.

## Motivation

D308 and D309 are defects against shipped intent, not new product choices. A re-close rule only has
a job if reveal is reachable, and a learner-choice mode only exists if its switch controls it.
Leaving these behind D715 would couple two missing buttons to the much larger preset architecture.

Out of scope: `permittedAssistance`, D532's per-context ceilings and the F5 presets/modules (both
now specified by the accepted `rfc/intent-presets.md`), detector admission, marker selection, new evidence, learner ratings and any automatic reveal.

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

The computed shape-marker list is empty unless `assistance.guided === "live"`. The second, smaller
named-plan block — since feedback stage 1 it renders in the inspector's Recorded-moment section (`DrillScreen.svelte` `data-evidence-consumer="inspector.pivotal_marker"`, `:1139-1141` at HEAD), not in the pivotal dialog the parent census named, which now carries no plan content — is deleted; the full `ShapePanel` remains the sole renderer.
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

Seam with `rfc/intent-presets.md` (accepted 2026-08-22, after this draft): its §8.2 assumes this RFC
lands first, with `PROFILE_DEFAULTS`'s `onramp` value becoming the `onramp` context's
`defaultPreset: "guided"` projection; if it lands first instead, this RFC rebases to consume its
`ContextContract` rather than shipping the table. Either way the on-ramp default has exactly one
owner at landing (its criterion 10), and its §3.1 renames `assistanceProfile` to the runtime
`deriveWorkflowContext` without changing the `immediate_guard` mapping this section relies on.

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
| D1 | D308 — reachable learner-initiated reveal | `assistance-control-wiring` | implementation commit | 2026-08-22 |
| D2 | D309 — guided preference owns the named-shape live channel | `assistance-control-wiring` | implementation commit | 2026-08-22 |

## Open questions

None. D532/D715 is deliberately outside this RFC rather than silently answered; since 2026-08-22 it
is discharged by the accepted `rfc/intent-presets.md`, whose §8.2 landing-order seam §3 now mirrors.

## Changelog

- 2026-08-22 (cross-review, in place): **(1)** §2's deletion target relocated to where it lives at
  HEAD — the duplicate named-plan block renders in the inspector's Recorded-moment section
  (`inspector.pivotal_marker`, `DrillScreen.svelte:1139-1141`), not in the pivotal dialog
  (`:1206-1214`, which carries no plan content); the parent census and D309 described the
  pre-stage-1 code, and an implementer sent to the pivotal dialog would find nothing to delete.
  **(2)** Scoping de-staled against the same-day acceptance of `rfc/intent-presets.md`: the header,
  summary, out-of-scope list and open questions now name it as D532/D715's discharge site, and §3
  gains the mirror of its §8.2 landing-order seam (single owner of the on-ramp default, criterion
  10 there; the `deriveWorkflowContext` rename). §3's `PROFILE_DEFAULTS` paragraph was left
  line-stable because `intent-presets.md` cites it as `assistance-control-wiring.md:74-77`.
  Verified clean at source, among ~40 claims: the full reveal chain (`RunApi.reveal` `api.ts:624`,
  route action `rest.ts:1381`, `service.reveal` + `#refuseWhileMatchLive`/paused-match pass
  `service.ts:1547-1572,1752-1757`, `revealFeedback`'s attempt_end guard and already-open empty
  success `runtime.ts:240-259`, `MATCH_LIVE` → the existing alert copy that already says
  "revealing feedback", `session-controller.ts:78-79`); the ungated `shapeMarkers` and the
  two-switch duplicate; `session.ts`'s type-locked attempt_end for position/imported and its
  exclusion for packs; the six profiles / five-silent / four-fallback-site / nine-surface counts;
  and the two existing real marker tests criterion 11 amends (`tests/browser/drill.spec.ts:128`,
  `screens.test.ts:321`).
- 2026-08-22: extracted the dependency-free D308/D309/default subset after D715 proved the parent
  RFC's permission half could not implement the owner's ceiling ruling with its current input shape.
