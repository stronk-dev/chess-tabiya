# Codex queue — refreshed 2026-08-16 (late)

## 0. Completed items removed from the live queue

The `plan_signature` contradiction was already closed by `e9695cf`: every server-side
expression boundary resolves the registry leaf, and the census returned from 26 unknowns to
23. D347 and D353 were green before this queue refresh. D346, D94, D95, D101, D100, D63,
D184, D185 and D235 are likewise already closed in the ledger and are not work items.

## 0a. Accepted RFC batch — complete

The four RFCs previously mis-flagged "do not start" are implemented and archived.
`evidence-at-runtime` landed last: 732 digest-current readings are retained and 10,765 of
11,464 per-pack-distinct one-ply successors are recorded as uncovered rather than inferred.

`format-surface` implemented and archived 2026-08-16 at pack 0.25; both gates passed.
`pack-graduation` implemented and archived 2026-08-16 at pack 0.27; 700 unit tests and 25 browser tests passed, and the landing corpus has zero legacy entries and zero graduable packs.

**Register drift corrected in the same pass:** `engine-leverage` holds **migration 21**
(landed — `STORAGE_VERSION` is 21 at HEAD), not 22. Its own text said 22 in two places and
`evidence-at-runtime` had inherited that citation; both are fixed. **Migration 22 landed
with `board-annotation`; `teacher-surface` holds the next migration position**, still a
draft awaiting cross-review.

## 1. Content-vocabulary follow-ons — not codex-ready

D346 is already closed. D348 requires a new versioned `shape_trigger` expression leaf and has
no accepted RFC/lane. D351 proposes a new authoring instrument and likewise has no accepted
RFC. They remain visible in the ledger but are not implementation authorization.

The earlier vocabulary/format/claim/graduation lane is complete through pack schema 0.27.
Its historical ordering remains in the RFC register, not in the live work queue.

## 1. Permission and correctness — complete

D94, D95 and D101 landed in `f304384` and are closed with direct regressions.

## 2. Client surface — complete

D100 and D63 are closed in the ledger with browser and geometry regressions.

## 3. Contract residuals — complete

D66 closed when engine state became request-scoped and production stopped using
`afterCommands`; D67/D72 closed together in `fc99ba1`; D70 closed when the measured
`[1000,2400]` band reached the request path. Their ledger statuses were stale and are now
corrected.

## 4. Structural tidying

D184, D185 and D235 are closed. D104 remains a measurement to reproduce: it passed 20/20
isolated zero-retry repetitions plus a full suite, so no patch is authorized from absence.

## 5. Do NOT take — schema-shaped without a lane

**D103, D112, D123/D153, D124, D106** are schema changes and need a lane.

**CORRECTED 2026-08-16 (late).** This section previously said `claim-backing`,
`pack-graduation`, `evidence-at-runtime` and `board-annotation` were *"returned by
cross-review, in author rounds — do not start them"*. **All four have since been
accepted, and the sentence was blocking four RFCs' worth of implementation.** They are
now in §0a above. The queue derives its *defect* rows from `design/BACKLOG.md`; it was
still deriving its *RFC states* from memory. Fixed by reading `rfc/README.md`.

## 6. Register rules that changed under you tonight

- **Migration numbers are assigned at LANDING, not at claim.** `storage.ts` skips with
  `if (migration.version <= version) continue`, so a database reaching N skips every lower
  migration landing afterwards, permanently. I created that hazard by telling
  `board-annotation` to claim 23 while 22 was unlanded.
- **Ledger id blocks are registered in `design/BACKLOG.md` when issued**, with a table in the
  file. Previously they lived only in agent briefs, which is why you took D203 — correctly
  following the stated rule for a block you could not see. Renumbered to D233; the hole was
  the convention's.

## Protocol reminders

- **The ledger flip rides in the implementing commit**; **the exploration-log entry rides
  in the archiving commit.** You did both on `2d0f7be`.
- **`design/BACKLOG.md` is a shared ledger, not an intent doc.** Law 5 protects
  `design/00`–`06`.
- Cite ledger rows by **row title**, never line number. Locate code by **symbol name**.
- Claude's standing error, caught by you three times: **a resolution in a queue file is not
  a resolution in the body** — `deviation-classes`, `fixture-realism` + `live-marker-quality`,
  `engine-leverage`.
- Claude's **third** standing error, new tonight and now twice: **a line-based grep is not a
  reading.** It missed a `"Resolve before \`accepted\`"` that wrapped across a line break,
  and separately inverted a negation into a claim about "23 packs" that had to be withdrawn.
  When I tell you a document contains or lacks something, ask whether I read it.
- Claude's second standing error: **`git add` on shared ledger paths while you have
  uncommitted edits there.** Say so if it happens again.
