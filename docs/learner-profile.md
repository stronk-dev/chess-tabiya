# Learner profile

Storage migration 36 and derivation revision 10 add per-decision source coverage to completed
cuts. Profile isolates a corrupt or superseded cut and keeps independently verified games visible.
These private observations do not activate learner metrics.
Profile no longer exposes the old pooled event-prevalence observations as habits. Its overview
returns observationStatus unavailable/subject_metrics_not_adopted and observations:[]; old
observation detail returns authenticated409 PROFILE_OBSERVATIONS_NOT_ADOPTED. The UI states
“Detailed structure statistics are unavailable.” GAME/choice/skills/history remain independent.


The learner profile is the private surface that reads the [longitudinal store](longitudinal-store.md)
back to the learner: habit cards, opening results, skills and history. Detailed structure statistics
are explicitly unavailable while subject metrics await adoption. Counted cards retain their
populations and links to contributing runs and moves. Contracts:
`rfc/player-style.md` (habit cards, sharing, the LLM licence) and `rfc/skills.md` (the migration-free
subset: taxonomy, valence register, concept-mark derivation). Cards are read-time arithmetic over the learner's saved runs and durable evidence at the store's exact completed cuts; no card or personality label is persisted.

## Where it lives

| Layer | Path |
|---|---|
| Habit-card contract: registry, card grammar, refusal set, tier rule, reference wall, paraphrase licence, bootstrap | `packages/runtime/src/style-contract.ts` |
| Original complete-legal choice reduction | `packages/runtime/src/internal/profile-choice-facts.ts`, `apps/server/src/profile-choice-facts.ts` |
| Strict per-cut choice row and original source/reference joins | `apps/server/src/profile-choice-facts-contract.ts`, `profile-choice-fact-references.ts`, `profile-game-source.ts` |
| Original GAME-source reduction and strict per-cut row | `apps/server/src/profile-game-facts.ts`, `profile-game-facts-contract.ts` |
| Skills contract: categories, valence admissibility and register validator, leaves, concept marks | `packages/runtime/src/skills-contract.ts` |
| Read-time profile service | `apps/server/src/learner-profile.ts` |
| Valence register (content, empty) | `content/valence/register.json` |
| Client surface | `apps/web/src/lib/ProfileScreen.svelte`, route `/profile`, linked from Rating and Learn |

`createApplication` composes `LearnerProfileService` over file-backed storage. The service
requires all longitudinal tables, including GAME facts, choice facts, subject observations and
subject evaluations. An invalid valence register fails startup.

## HTTP

All routes authenticate and read only the caller's own rows; no route names another learner.

| Route | Returns |
|---|---|
| `GET /learner-profile` | the whole view (store status, population, cards, openings, observations, skills, first history page, privacy) |
| `GET /learner-profile/history?offset&limit` | a history page with `hiddenCount` |
| `GET /learner-profile/style/:metricId?offset&limit` | one card and its drill-down page |
| `GET /learner-profile/openings/:key?offset&limit` | one opening row and its games |
| `GET /learner-profile/observations/:key?offset&limit` | authenticated409 `PROFILE_OBSERVATIONS_NOT_ADOPTED` |
| `POST /learner-profile/share-card` `{ metricId, consent: true }` | a share text for one measured card |

## What counts

History, habit-card and opening details offer **Show more** until all counted
references are visible. Loading is per detail; a failed, overlapping or inconsistent page keeps
the existing list and offers retry or **Refresh profile**. Continuations check offsets, totals
and duplicate identities; habit details also retain the displayed card's measured operands.
Refresh clears drill-downs and discards pending responses from the previous view. These checks
do not certify a habit or promise a transactional snapshot across requests.

History rows share one complete client decoder across Profile, history pagination and opening
details. Missing or mistyped dates, session/status fields, counts and explanatory text refuse
the read through its existing retry surface, rather than becoming asserted display data.
A nullable date says **date unavailable in this view**: it does not claim the saved recording
has no timestamp. Admitted dates retain native locale formatting; a refused source can regain
its original date after an operator rebuild and explicit refresh. This adds no timestamp inference,
new wire fields or contributor-numbering policy.

Move-level references open `/review/game/:runId?node=:nodeId`. Review resolves the node's actual
stored branch, selects that move and retains it on reload. Inspecting a reference does not commit,
rewind or fork the game. Missing/inaccessible references produce an unavailable message, not a
different selected move. Run-level history/opening links still open the game's default review.

Native unfinished lines can be reviewed with their honest unfinished outcome. They require an
open disclosure window, which closes on the next committed move. Open rated games and live
unpaused matches remain withheld; completed/imported review retains its existing disclosure rule.

A **measured game** is a run that began from the standard starting position with at least one move
the store attributes to the learner (`played` decisions only — imported games' moves belong to the
players who made them). Only the run's first line counts; rewound branches do not. Decisions come
from the store's own decision algebra (`normativeDecisions`) at the exact completed cut, and a run
whose recount disagrees with the store's `played` denominators is left out as `store_mismatch`.
Runs still being processed are named and not counted.

Completed processing alone does not make a run counted in the Profile. Its recorded source must
also pass the Profile's recount. A mismatch is excluded from the header totals, habit/opening
populations and counted history; history explains that its counts need rebuilding
without changing the saved game. If a subset read loses its completed cut during acquisition,
any remaining complete-but-unread run is also not counted in that response, with a distinct
temporary loading explanation rather than a mismatch verdict. **Refresh profile** performs only
a new read. The operator's existing `make longitudinal-rebuild WRITE=1` can repair observation
rows from the saved events; refreshing does not itself rebuild, rewrite play or grant access.
Actual built-server desktop/touch journeys cover refusal → operator rebuild → refresh, with
unchanged saved run rows and an independent account seeing none of the owner's data.

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
| Fianchetto setup and knight screen | worker's original GAME source reduction, current parsed per-cut row |
| Castled kingside/queenside | recorded castling side plus worker's original first-owner castling eligibility |
| Pawn / extended-centre / early-queen residuals | worker's complete chosen-inclusive legal populations, current parsed choice row; no HTTP collection |
| Opening family entropy | runtime opening identity (deepest named endpoint) |
| Opening surprisal | abstains: no versioned reference population is installed |
| Time used per move (three phases) | abstains: owner-played/native timing evidence is not yet recorded for these cards; imported clocks remain viewable in Review (`rfc/recorded-clocks.md` D4) |

Every card sentence passes `styleCardTextCheck`: the refused norm/type words (`too`, `simple`,
`positional`, `solid`, …) render only beside a baseline operand, which no production card has.

## Openings, observations, skills

- **Openings** group measured games by the deepest named catalogue endpoint and show results as
  counts (a rated game's sealed result, else the run's own terminal outcome). No win rate is shown.
  Packs whose start position is named with the same ECO code are offered as rehearsals.
- **Structure statistics** state “Detailed structure statistics are unavailable.” The overview has
  exact `observationStatus:{kind:"unavailable",reason:"subject_metrics_not_adopted"}` and
  `observations:[]`. Old pooled prevalence rows remain private stored data, not personal habits.
  The detail route returns typed409; the client rejects old successful bodies and offers no stale
  table, move links or retry for an unadopted metric. New subject rows require separate qualified
  consumer adoption; this temporary withholding does not close the full1.0 player-model scope.
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
The client validates the complete numeric share image and compares it with the card the learner
consented to share. Cancel, a new card, consent withdrawal, refresh and departure retire that
preparation; an obsolete success or failure cannot modify its successor. Copying is explicit and
single-flight. A departed copy completion is ignored, although a clipboard write already issued
cannot be retracted. Withdrawing consent clears the prepared text and requires fresh consent.

## Current GAME evidence

Fianchetto setup, knight screen and initial castling eligibility come from the existing worker's
three-source GAME consumer and its current parsed row. HTTP requests do not run those collectors
or open worker source scopes. Cached run facts retain independent cohort/reference metadata;
the cache also keys the existing completed-job source identity and actual owner, with same-store
owner/digest admission on cold loading. Sharing grants and delete/recreate/restore cannot reuse
a different source at the same move count; unchanged warm hits reload no V4 image. Every
overview, detail, denominator/numerator page and consented share rereads the current GAME
lane. Its exact owner/run/cut/revision/primary/color/node-creation identities must match.

An observed empty configuration is a measured zero. Missing/invalid data, unavailable role or
rights abstains the whole affected card before floor arithmetic. The game stays in overall
history/cohort; unrelated cards remain available. Detail lists only independently proved
denominator references, and the screen withholds “Measured so far” for incomplete cards. No old
helper value or previously shareable card is used as fallback. First-owner castling eligibility
uses the raw normative decision's BEFORE node, independently of filtered public decision refs.

The initial supported role is single-player with every stored learner-side primary action
proved owner-played. Mixed/shared/scripted-own-side histories remain counted but unavailable for
these fields. This conservative boundary is not a new personality or proof of player intent.
Broader actor/source qualification remains D4140. Local integration, full software/performance/types/build and the actual new200-game path are
verified with bounded migrated-operand/ref parity. The source plan records exact costs and
limits; held content/default-native/release and broader style qualification remain open.

## Current choice evidence

The three decision residuals consume the separate `learner_choice_facts` completed-cut family
(`rfc/profile-choice-facts.md`). One original store-opened scope proves every selected owner move,
its BEFORE/AFTER/event identities and complete legal population. The four declared sources are
legal moves, candidate role, extended-centre pawn destination and early queen. Their source
identities stay attached through the finite worker consumer and publication; the row does not
become source authority for another collector.

The supported role requires both actual single-player attribution and a proved owner move.
Unlike the separate GAME reduction, it does not require every learner-side path action to be
owner-played: the particular decision may involve either board color. Unsupported roles remain
counted with unavailable choice data. Broader role qualification remains open.

Residuals subtract each trait's share of the complete legal population from the chosen flag.
Forced, unanimous and all-false zeros keep their decision weight. Early queen uses the original
BEFORE index below16; another decision's later missing data cannot block that earlier scope.
Missing or invalid selected data makes the affected whole card incomplete before its unchanged
100/200/100-game floor. Other cards and history retain their independent metadata. Detail lists
only independently known denominator games while incomplete, and shares require measured data.

Every overview, detail, contributor page and consented share rereads the current parsed choice
lane. The raw run cache has no trait flags, legal identities or shares to substitute for it;
unchanged warm reads open no V4 image. Skills uses only genuine available legal sets and gains no
new credit. Original first-public CHILD and first-owner BEFORE references remain distinct.
The source plan records complete local software/performance/type/build verification and the
actual200game/6400decision operand/statistic/independent interval/contributor/share proof. Repeated
scripted lines establish workload parity, not player personalities or human qualification. Held
content/native/release and wider actor roles remain open.
