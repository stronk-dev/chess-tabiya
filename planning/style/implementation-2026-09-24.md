# Player style — implementation receipt (2026-09-24)

**RFC:** `rfc/player-style.md` · **By:** claude, at the owner's direction (implement directly, no
review round) · **Builds on:** `rfc/longitudinal-store.md` (migration 26, landed today).
**Sibling receipt:** `planning/skills/implementation-2026-09-24.md`. **Docs:** `docs/learner-profile.md`.

## What a learner can now see

Rating and Learn link to `/profile`, a private page over their own saved runs:

- **What is counted** — how many saved runs the store has counted, which are still being processed,
  and the definition of a measured game (standard start, ≥1 move attributed to you, first line only).
- **Habit cards** — all twelve registry rows. Each shows its own floor; below it, only *"This card's
  floor is N games; M measured."* with the games measured so far. At the floor it shows the value,
  the 95% game-bootstrap interval, games and decisions, window, phase and time-control scope, metric
  id/version, tier state and the moves behind it, and it can be shared as text after explicit
  consent. Opening surprisal and the three clock metrics abstain with their named blockers.
- **Openings you played** — games grouped by the deepest named catalogue endpoint, results as counts
  (no win rate, and the reason), the games behind each row, and packs that start in the same ECO code.
- **Recorded observations** — the store's `played` rows per projection: happened / could have
  happened / games / your moves in those games, with the moves behind each count.
- **Skills** — see the skills receipt.
- **Your saved runs** — every run with its counted state, opening and result, paginated.
- **Privacy** — private by default; export/deletion; sharing only by explicit per-card request.

## Criteria → tests

| # | Test |
|---|---|
| 1–3 | `apps/server/src/style-registry-check.test.ts` (`make style-registry-check`, in `verify-software`) |
| 4, 5, 6, 7, 8, 9, 10 (reference identity), 12, 13, 15 | `packages/runtime/src/style-contract.test.ts` (type-level arms via `@ts-expect-error`, checked by `make typecheck`) |
| 7, 15 through the store | `apps/server/src/learner-profile.test.ts` (floor − 1 abstains, floor measures; abstaining drill-down lists games only) |
| 10 (never reaches grade/hint/voice/verdict) | `apps/server/src/learner-profile-walls.test.ts` |
| 11 | `learner-profile.test.ts` (consent, abstaining card, share carries no run identity), `learner-profile-application.test.ts` (owner-only HTTP), `ProfileScreen.test.ts` (consent checkbox gates the request) |
| 14 | `learner-profile.test.ts` (`assertLongitudinalStorePresent`) |
| Journey | `tests/browser/drill.spec.ts` — "the private profile opens from Rating and Learn…" (with an axe WCAG scan); `/profile` added to the mobile width matrix |

## Also in this change set

- `normativeDecisions` moved verbatim from `longitudinal-projector.ts` to `longitudinal-decisions.ts`
  (re-exported by the projector) so the HTTP-side profile shares the store's decision authority
  without pulling the projector into the HTTP module graph (criterion 14 of the store stays green).
- `longitudinal-worker.test.ts` criterion 16/29: the worker's totals message can trail the published
  rows, so the test now waits for it instead of racing it (it failed on a clean baseline run).
- `roadmap-check` needs one row it is not this lane's to write: `planning/roadmap-1.0.json`
  `appRoutes` gains `["profile", "learner_model", "live"]` (the client route now exists); the
  `learner_model` capability's `api` cell and `apiFamilies` can then name `/learner-profile`.

## Not done, by name

- **D1/D2** — the atoms are read-time predicates (`style-atoms.ts`), not collector registrations or
  store rows. Moving them is a store derivation-revision bump, not a migration.
- **Opening surprisal** — needs a pinned, versioned reference population.
- **Clock metrics** — `rfc/recorded-clocks.md` (returned draft) must land typed clocks.
- **D6** — the ≥8-week and blitz↔rapid transfer measurement; disclosed on the page.
- **D5/D7** — owner-tier (design/03 surface amendment; the labelled quiz substitute).
- No LLM paraphrase route ships; only its admission gate and output check.
