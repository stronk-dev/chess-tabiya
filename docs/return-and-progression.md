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
pack-scoped tags and never scheduling keys.

Attempt provenance distinguishes fresh, duplicate, scheduled, and in-run retry origins.
The server derives `root_due_at_start` from its own schedule table, so omitting client
intent cannot make a prompted return look voluntary.

## Return queue

The automatic scheduler owns at most one pending item per learner and root. An ungraded
attempt is varied; two consecutive stable graded attempts are varied; other histories are
blocked. Varied repetitions use the 1, 3, 7, 16, and 35 day ladder. Learners may also
schedule a node explicitly. That operation persists a schedule and appends
`transfer.scheduled`; callers without the writer lease cannot create either.

The HTTP surface is:

- `GET /progress` — learner-scoped attempt history.
- `GET /progress/due` — due pending schedules, blocked first.
- `POST /progress/schedules/:id` with `dismiss` — learner-scoped dismissal.
- `POST /runs/:id/duplicate` — a new owned run without mutating the source.
- `POST /runs/:id/schedule` — a writer-leased explicit return.

`POST /runs` accepts optional intent metadata, but schedule ownership and due-at-start are
resolved server-side. Foreign schedules are indistinguishable from missing ones.

## Client surface

`/learn` is a real surface and deployment capability. It lists due work and recorded
attempts, names ungraded work honestly, links back to source runs, and permits dismissal.
It deliberately presents no mastery percentage: the stored data is an attempt history and
a return queue, not proof of mastery.

## Pack format 0.6

Packs may declare typed `retryVariants` and pack-scoped `concepts`. Concept keys must be
slug-like; non-slug keys produce a lint warning rather than silently becoming a global
taxonomy.

## Current limits

The first implementation does not yet import personal PGN history or rank pack
recommendations from it. Related-position expansion and longitudinal product-success SQL
remain operator/reporting work rather than claims made by the learner UI. The scheduler is
intentionally small and explainable; it is not an FSRS/SM-2 mastery model.
