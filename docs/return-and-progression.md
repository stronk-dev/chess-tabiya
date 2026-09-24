# Return and progression

Tabiya records an attempt as one branch of a run. This keeps the return loop aligned
with the product's basic unit: rewind-and-branch creates another attempt without erasing
the first one.

## Durable projection

SQLite migration 6 adds `attempts`, `attempt_concepts`, `schedules`,
`learner_position_stats`, and `progress_meta`. Existing runs are backfilled once. Every
run mutation reprojects affected branches, and the `(run_id, branch_id)` key makes repeated
projection idempotent.

An empty fork is recorded but not counted. A countable attempt receives a stable ordinal
within its root position. Objective states project to `stable`, `unstable`, or `open`; a
position session with no authored grader remains explicitly ungraded. Concepts are
registered global identities (migration 28, [concept registry](concept-registry.md)): a pack's
concept on an attempt is stored as `concept:<id>@1` with its exact registry revision and the pack
digest as occurrence. They are never scheduling keys.

Attempt provenance distinguishes fresh, duplicate, scheduled, and in-run retry origins.
The server derives `root_due_at_start` from its own schedule table, so omitting client
intent cannot make a prompted return look voluntary.

## Return queue

The automatic scheduler owns at most one pending item per learner and root. An ungraded
attempt is varied; two consecutive stable graded attempts are varied; other histories are
blocked. Varied repetitions use the 1, 3, 7, 16, and 35 day ladder. Ungraded histories advance
that ladder by countable-attempt count; graded histories advance it only by the current trailing
stable streak, with two stable attempts earning the first rung. A prior lapse therefore cannot
inflate the next interval.

`rfc/return-scheduling.md` adds three rules, all derived by replaying the countable `attempts`
history with no new column. **Step-down:** a root that lapses after reaching ladder index `k`
keeps a floor of `k - 1`, so a root that had reached 16 days and then recovered returns at 7 days
rather than 1; a root that never climbed keeps a floor of 0, and re-reaching the peak clears the
floor. **Overstudy:** an attempt the learner timed may demote but never advance the ladder. In-run
retries are always off schedule; any other non-`scheduled` attempt is off schedule only when the
root already had a pending return that was not yet due when it started. **Named variation:** the
automatic varied return rotates `schedules.variant` through the pack's declared `retryVariants`
kinds by ladder index; a blocked return, or a pack declaring none, stores `NULL`, which Learn
describes as a fresh opponent seed. `retryVariants` is still not a run modifier.

**Return standing** (Discharge D2, owner ruling 2026-09-24). Each root has a coarse standing word
from a closed three-word vocabulary, derived only from the ladder index the same replay serves.
The mapping lives in one place, `returnStanding` in `apps/server/src/progress.ts`, with explicit
thresholds in `RETURN_STANDING_MIN_RUNG`:

| Ladder index (interval) | Standing |
|---|---|
| none — a blocked repeat, or no countable history | `new` |
| 0 (1 day) | `new` |
| 1-2 (3 and 7 days) | `learning` |
| 3-4 (16 and 35 days) | `established` |

The word describes spaced-recall standing — how far apart returns have been held — never mastery
or a verdict. Because it reads the replayed index, step-down and overstudy move it exactly as they
move the interval: a lapse from the top rung repeats blocked and reads `new`, and recovery resumes
at the retained floor's word. The index itself never leaves the server.

Learners may also
schedule a node explicitly. That operation persists a schedule and appends
`transfer.scheduled`; callers without the writer lease cannot create either.

The HTTP surface is:

- `GET /progress` — learner-scoped attempt history.
- `GET /progress/due` — the served due queue: blocked first, then by due date. Within one kind and
  one UTC due date only, returns are ordered by how many Lichess games reach the root position at
  the source run's authored band (`corpusPopulation`); each item carries that population count or
  `null`. Frequency orders and never grades. At most `DUE_INTAKE_LIMIT` (20) returns are served;
  the response counts the rest as `waiting`, which keep their order and pending state (vacation
  safety — nothing is rescheduled and the learner chooses no interval). Each item carries
  `standing`, one of `new`, `learning` or `established`; there is no ladder index, ratio or
  mastery number, and the client parser refuses any other word and any extra field.
- `GET /progress/difficult` — roots with at least three unstable graded attempts, read from
  `attempts` (never `learner_position_stats`), with the unstable count and the latest runs where
  it happened. The rule is published with the response; there is no attempt total, ratio or
  ladder position.
- `GET /progress/related` — at most three of the learner's own least-rehearsed related attempts.
- `POST /progress/schedules/:id` with `dismiss` — learner-scoped dismissal.
- `POST /runs/:id/duplicate` — a new owned run without mutating the source.
- `POST /runs/:id/schedule` — a writer-leased explicit return.

`POST /runs` accepts optional intent metadata, but schedule ownership and due-at-start are
resolved server-side. Foreign schedules are indistinguishable from missing ones.

## Client surface

`/learn` is a real surface and deployment capability. It lists due work and recorded
attempts, names pack work through catalogue titles rather than registry ids, names ungraded work
honestly, links back to source runs, and permits dismissal. If a recorded pack is no longer in the
catalogue, the surface says **Unavailable rehearsal** without leaking its internal id.
Its primary due action starts the scheduled attempt itself: pack returns create a current-pack
run carrying the schedule id, while position returns duplicate their recorded source with the same
id. *Try this again* creates a separately owned run from a recorded attempt and never mutates the
source. At an attempt's terminal sheet, *Schedule a retry from here* writes an immediate blocked
return for the exact terminal node; the button reports read-only/unavailable states and confirms
when the position entered the queue.

Learn owns related-attempt lookup and due dismissal as retained client actions. Closing a pending
related lookup invalidates its request, so a late result cannot reopen it; a failed lookup stays open
as an explicit retry and never exposes provider diagnostics. The client verifies the requested run
graph and the bounded three-item related projection before rendering it. Dismissal captures one
schedule id, refuses duplicates, removes the card only after server success, keeps a failed card for
retry, and cannot mutate a newly loaded Learn route after departure. Due and retry starts continue
through the run controller's single-flight lifecycle and now expose its pending state to assistive
technology while their controls are disabled.

Due cards name the variation (the pack's retry-variant kind in words, or a fresh opponent seed),
the due date with the root's standing word beside it and the fixed explanation *"based on how many
spaced returns you've held"*, and, when the corpus answered, the population count that ordered them. When intake holds work back,
Learn says how many returns are waiting. *Positions with repeated unstable attempts* lists the
difficult roots with the published rule and one *Open run* control per preserved run.

Imported games support guess-the-move: at a source-game position with a played next move, the
learner plays a guess on a separate board; the server records `prediction.recorded` under the
reserved checkpoint `imported-game:next-move` against the human-move model's distribution, and the
run does not advance. The drill screen then names the move the game played and the model rank of the
guess, never a grade.

It deliberately presents no mastery percentage — the standing word is a closed-vocabulary word
about return spacing, not a number or a level: the stored data is an attempt history and
a return queue, not proof of mastery. It also lists derived event-shaped milestones linking
to preserved runs. Those record firsts and one explicit attempt-count event; they never add
a skill percentage, score, streak, rating, ranking, or cross-learner comparison.
Those limits are scoped to the return and progression surfaces. The separate learner-rating
system records whole-game results against calibrated opponents and never feeds this scheduler,
its recommendations, or its milestones.

`GET /progress/recommendations` is a read-only, learner-scoped projection. It
may name an unaddressed stored repertoire gap or a shape encountered in a
preserved run but absent from every countable attempt. Its closed sentences
state only those events and corpus population counts; they never infer weakness,
mastery, rating, or what other learners struggle with. Empty history produces no
section, and reading recommendations writes no schedule or attempt. Repertoire and shape
recommendations each have a deterministic ten-item display budget. The endpoint returns their
combined shown and eligible counts, and Learn states that denominator whenever eligible grounded
recommendations exceed the visible set. Shape eligibility scans every preserved run in bounded
storage pages; the display budget does not become an evidence-population cutoff.
Each shape recommendation resolves every currently served matching pack through the
catalogue, names its phase, and starts that exact rehearsal. It does not discard the
recommendation by sending the learner to an unfiltered pack shelf. A stale pack id is
rendered only as an honest absence, never exposed as an internal identifier.

## Pack format 0.6

Packs may declare typed `retryVariants` and `concepts`. Since migration 28 every concept
must be a registered id in `content/concepts/`: a malformed, unregistered or retired-new id is a
validation **error** at lint, `make pack-check` and publication.

## Current limits

The first implementation does not import bulk personal PGN history or rank
recommendations by inferred skill. Related-position expansion is available from each recorded
attempt and labels only same-position, same-pack, or same-concept relations; `same_concept` is
cross-pack and names the shared registered concept (the retired `same_concept_in_pack` token is
rejected). The voluntary concept-return metric groups on the same global key. Longitudinal
product-success SQL remains operator/reporting work rather than a claim made by the learner UI. The scheduler is
intentionally small and explainable; it is not an FSRS/SM-2 mastery model.

Repertoire-gap entries are ordinary `position` runs. Their first countable attempt
therefore creates and advances the same position-root schedule; the repertoire link
adds provenance without introducing a separate queue.
