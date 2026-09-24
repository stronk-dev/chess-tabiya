# Learner profile

The learner profile is the private surface that reads the [longitudinal store](longitudinal-store.md)
back to the learner: habit cards, opening results, recorded observations, skills and history. Every
number carries what it was counted out of and opens the runs and moves behind it. Contracts:
`rfc/player-style.md` (habit cards, sharing, the LLM licence) and `rfc/skills.md` (the migration-free
subset: taxonomy, valence register, concept-mark derivation). Nothing on the page is stored: each
read recomputes from the learner's saved runs at the store's exact completed cuts.

## Where it lives

| Layer | Path |
|---|---|
| Habit-card contract: registry, card grammar, refusal set, tier rule, reference wall, paraphrase licence, bootstrap | `packages/runtime/src/style-contract.ts` |
| The five style atoms and castling eligibility (rules predicates, no prose) | `packages/runtime/src/style-atoms.ts` |
| Skills contract: categories, valence admissibility and register validator, leaves, concept marks | `packages/runtime/src/skills-contract.ts` |
| Read-time profile service | `apps/server/src/learner-profile.ts` |
| Valence register (content, empty) | `content/valence/register.json` |
| Client surface | `apps/web/src/lib/ProfileScreen.svelte`, route `/profile`, linked from Rating and Learn |

`createApplication` composes `LearnerProfileService` over the file-backed storage; it refuses to
compose without the migration-26 tables (`assertLongitudinalStorePresent`) and fails startup on an
invalid valence register.

## HTTP

All routes authenticate and read only the caller's own rows; no route names another learner.

| Route | Returns |
|---|---|
| `GET /learner-profile` | the whole view (store status, population, cards, openings, observations, skills, first history page, privacy) |
| `GET /learner-profile/history?offset&limit` | a history page with `hiddenCount` |
| `GET /learner-profile/style/:metricId?offset&limit` | one card and its drill-down page |
| `GET /learner-profile/openings/:key?offset&limit` | one opening row and its games |
| `GET /learner-profile/observations/:key?offset&limit` | one ledger row and its occurred moves |
| `POST /learner-profile/share-card` `{ metricId, consent: true }` | a share text for one measured card |

## What counts

A **measured game** is a run that began from the standard starting position with at least one move
the store attributes to the learner (`played` decisions only — imported games' moves belong to the
players who made them). Only the run's first line counts; rewound branches do not. Decisions come
from the store's own decision algebra (`normativeDecisions`) at the exact completed cut, and a run
whose recount disagrees with the store's `played` denominators is left out as `store_mismatch`.
Runs still being processed are named and not counted.

## Habit cards

`STYLE_METRICS` holds the twelve R12/R21 metrics; `make style-registry-check` keeps it set-equal to
the R21 instrument (metric id, feature id and floor) and turns red on any drift. Each card carries its
own floor (25–200 games); below it the card says only *"This card's floor is N games; M measured."*
and its drill-down lists the games measured so far, never the occurrences. At or above the floor it
shows the value, a deterministic 95% game-bootstrap interval, game and decision counts, the window,
phase and time-control scope, the metric id/version, its tier state under
`reference_quantile_lower_bound@1` (always `established` — no reference population is pinned) and the
contributing moves.

| Metric | Source at this landing |
|---|---|
| Fianchetto setup, knight screen, castled kingside/queenside, pawn / extended-centre / early-queen residuals | read-time atoms over the first line, complete legal-move sets per decision |
| Opening family entropy | runtime opening identity (deepest named endpoint) |
| Opening surprisal | abstains: no versioned reference population is installed |
| Time used per move (three phases) | abstains: no run records typed clock readings (`rfc/recorded-clocks.md` D4) |

Every card sentence passes `styleCardTextCheck`: the refused norm/type words (`too`, `simple`,
`positional`, `solid`, …) render only beside a baseline operand, which no production card has.

## Openings, observations, skills

- **Openings** group measured games by the deepest named catalogue endpoint and show results as
  counts (a rated game's sealed result, else the run's own terminal outcome). No win rate is shown.
  Packs whose start position is named with the same ECO code are offered as rehearsals.
- **Recorded observations** sum the store's `played` rows per projection identity: occurred,
  opportunities, games and the learner's moves in those games, with per-phase splits and the moves
  behind each count. No rate, trend or comparison is shown.
- **Skills** render the five category names. Openings and Strategy state why nothing can be credited;
  registered shapes are listed as candidate leaves with their blockers (unassigned category, unruled
  valence, missing opportunity definition). The valence register is empty, so the concept-mark
  derivation runs over the learner's decisions and returns no mark. Nothing is written to
  `learner_marks`, and no campaign module reads profile or skill state.

## Privacy and sharing

The profile is private and stores nothing of its own. Export and deletion cover the underlying store
rows (`account-data-lifecycle.md`). Sharing is per card and explicit: the request must carry
`consent: true`, only a measured card can be shared, and the result is text with the card's sentence
and numbers — no run, position, type or composite. Nothing is published or persisted.
