# Client surface floor implementation log

## 2026-08-15 — implementation opened

The owner chose an explicit minimum supported viewport rather than silent clipping. The implementation must derive the height from rendered geometry, state the number, and explain below it why a fully visible board and the 24 px square-target floor cannot both fit.

## 2026-08-15 — measured layout and implementation

The in-app compact sweep found the first all-tab fit at 360×676 CSS pixels. The supported run floor is stated as 360×680, leaving four pixels of headroom; 360×679 now mounts no chessboard and explains that a fully visible board and 24-pixel chess-square targets cannot both fit. At supported phone sizes Timeline, Branches and Evidence are mutually exclusive real regions, and the inert Session tab is gone.

The conditional-placement guard exposed a genuine layout edge during implementation: at 390×844 with both `WhyBanner` and `OutcomeContext`, the board occupies the 192-pixel safety floor. At 430×932, where more room exists, the same rendered siblings leave a board wider than 192 pixels. That latter case is the pinned C4b assertion; it proves the size container is not unconditionally stuck at its minimum without inventing space in the smaller fixture.

Desktop geometry did not move:

| Projection | Before board / rail | After board / rail |
|---|---:|---:|
| 1280×720 | 176 / 339 px | 176 / 339.234 px |
| 1440×900 | 356 / 375 px | 356 / 374.5 px |

The new 768×1024 projection measures a 480-pixel board and 240-pixel rail. Targeted unit tests, Svelte diagnostics, and the two affected browser scenarios are green before the full gates.

## 2026-08-15 — verification

`ENGINES_REQUIRED=1 make verify` passed with 606 tests across 98 files, schema and packaging checks clean, and Svelte at 0 errors / 0 warnings. `make test-browser` passed 24 tests at zero retries; the baseline optional Maia-profile latency spec remained skipped. The full browser gate completed in 36.5 seconds. No timeout or retry was raised.

## 2026-08-15 — containment correction

The first sweep's 676-pixel figure checked the Chessground element against the viewport but not against `.position-column`, its clipping ancestor. A stronger assertion exposed 22–31 pixels of clipped board at the nominal floor depending on the active region. After bounding Timeline and Branches as their own scrollers and removing Evidence's unused reserved row, an instrument-only sweep with the ancestor check found Timeline, Branches and Evidence first all fit at 360×630; 360×620 still clipped Timeline and Branches. The owner-ruled product floor remains 360×680, now with 50 pixels of measured headroom. The earlier 676 figure is superseded rather than silently edited out of this append-only log.

## 2026-08-15 — final verification after the containment correction

The strengthened browser helper now asserts that the board box fits inside `.position-column`, not merely inside the viewport. Both final gates are green on that assertion: `ENGINES_REQUIRED=1 make verify` passed 606 tests across 98 files; `make test-browser` passed 24 tests at zero retries in 38.7 seconds, with only the baseline optional Maia-profile spec skipped. The earlier 36.5-second full-suite observation and the final 38.7-second run differ by 2.2 seconds; no timeout or retry changed.

## 2026-08-15 — acceptance demonstrations and guard audit completed

The required red demonstrations were re-run against the current browser test and source guards, with each defect temporarily restored or minimally reintroduced and then reverted:

- **Criterion 4 — containment is observable.** Reintroducing the removed `62rem` layout rules made the 768×1024 projection report document dimensions **1280 / 1024**, and made the compact board escape its position ancestor (**board bottom 646.125 px; position bottom 574.453125 px**). A separate compact containment injection made `.drill-region` report **640 px scroll height / 300 px client height**, proving C5-2 is not another constant document-scroll assertion. The injected rules were removed.
- **Criterion 7 — the region vocabulary is closed over real regions.** Temporarily adding `session` to the `compactTab` union made `client-surface-floor.test.ts` fail its exact three-member assertion. The mutation was reverted.
- **Criterion 9 — the target-size floor has teeth.** Temporarily reducing `.pivotal-marker` from `1.5rem` to `1rem` made the same suite fail the 24 CSS-pixel source guard while the shape marker still passed. The mutation was reverted.
- **Criterion 8(a) — spelling-independent role guard.** The shipped regex only rejected the exact spelling `viewerRole !== "host"`. The guard now inspects all rendered markup and rejects any `viewerRole` use there while retaining `role: viewerRole` in script plumbing. A temporary `{#if viewerRole === "spectator"}` control failed it: **1 failed, 2 passed**. The control was removed.

The surviving `document.scrollingElement` check now has its required in-file annotation: at ≤719 px the fixed `#app` makes document scrolling structurally constant, so that check remains a desktop/tablet global-overflow guard while compact containment is proved by `assertRunViewport`. With all demonstrations restored away, the four focused acceptance suites passed **24/24**.

## 2026-08-15 — final completion verification

`ENGINES_REQUIRED=1 make verify` passed **608 tests across 98 files** with schema and packaging checks clean and Svelte at 0 errors / 0 warnings. `make test-browser` passed **24 tests at zero retries**; the existing optional Maia-profile test was the sole skip. The lifecycle is complete; the shipped viewport, region and refusal model is canonical in `docs/app-shell.md`.

## 2026-08-15 — unrelated post-archive browser flake recorded

The first post-move rerun of `make test-browser` failed in the served-Najdorf walkthrough while waiting for `Active line 4 plies` after the branch move (**23 passed, 1 failed, 1 baseline skip**). No file changed; an immediate full rerun passed **24 with the same skip** at zero configured retries, matching the green pre-move run. This is not a viewport assertion and does not alter this RFC's acceptance result, but an authoritative gate cannot silently carry a race. It is recorded as D104 for separate diagnosis rather than hidden by retries.
