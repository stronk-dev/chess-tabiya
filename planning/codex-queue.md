# Codex queue — rebuilt 2026-08-16 after the opponent-contracts follow-ups

Derived from `rfc/README.md` and `design/BACKLOG.md` at `6722130`, not from memory.
Everything in the previous queue is discharged: `dead-vocabulary` shipped at `329c62b`,
D452–D454 and the rest of D382 at `d77a9f1`, D455/D456/D458 at `2d564cb`, and
`graduation-clearance` came back to the author at `8c389f0`.

**You were right to return `graduation-clearance`, and the premature acceptance was mine.**
I closed its four author-call open questions and marked it accepted; closing open questions is
not the same as being buildable, and D464–D467 are four things you needed that were not written
down. **D467 is specifically my error as queue author** — I told you to put a `git blame -L n,n`
check into runtime pack validation, on a review's recommendation, without asking where that
check runs. The production image has no `.git`. It is back with the author with that framing.

**D416's rule worked the first time it was asked for.** `d77a9f1` names *"Closes D452, D453,
and D454; fully closes D382"* in its body, so the closeout is findable with `git log --grep`.
That is the whole ask.

## 0. `rfc/teacher-surface.md` — BLOCKED: governing body still says draft

**Do not implement from this queue entry.** The register and the earlier text below say
accepted, but the RFC's own Status says **"draft … ready to be marked `accepted`"** and Open
question 1 still says **"One thing is now waiting on an owner."** This is the standing
queue-vs-body failure again. The body must be reconciled first; law 1 makes a queue banner
insufficient authorization.

Both owner questions are discharged. Claims **one migration position** (`STORAGE_VERSION + 1`;
head is **23**) — `ALTER TABLE run_grants ADD COLUMN granted_via TEXT`, nullable, **no backfill,
no CHECK**. Four tables, `run_grants.expires_at`, `live_sessions.classroom_id`. **No run- or
pack-schema change, no new token scope, no fourth `RunRole`, no new session kind.** Also claims
**D92** and **D93**, which both named this RFC as owner and had never been claimed.

**One rule carries the whole design:** on a terminal, disclosed run with no live session open, a
submission-granted teacher gets **the run host's own table** — never a reviewer tier. `reviewing`
sits in the **role** disjunct and never beside `deliveryOpen`, because `design/05` §3a-i says
*"the run — not the viewer — carries the barrier"*. So a reviewer reaches the run's disclosure
line and can never pass it.

**Go straight to these four criteria — each exists because the specification as written passed
every other check:**

- **7a** counts **statements, not sites**. Every miscount across three revisions had one shape:
  a function listed while one of its two statements was not. §4.3's write table is **seven rows /
  twelve statements**, and **both promotion sites contain a fresh-grant `INSERT` as well as the
  `UPDATE`** the table originally described.
- **10c's second fixture.** The original deep-equality fixture was a **solo pack**, where every
  candidate implementation agrees — the [[D444]] shape.
- **10e's extended loop** must range over the two sides **independently**, and be shown failing
  against the old predicate. Held equal, it can never construct the pairing that occurs in
  production.
- **10g**, which exists because a reviewer could see strictly **more** than the run's own host:
  `seatedInContest` had no time bound, `match_states` cascades from `live_sessions`, and sessions
  are **closed, never deleted** — so the seat was permanent. Bounded now by `closed_at IS NULL`.

**Do not weaken the `granted_via = 'submission'` conjunct.** The compatibility with
`live-marker-quality` is held by it — **by fixture convention, not by construction** as the author
round claimed. That RFC's criterion 6 is an `AssistanceContext` **object-literal** unit test with
no session layer in it at all.

**Owner amendment 2026-08-16 that this RFC depends on:** `live-marker-quality`'s accepted cost
narrows from *"the marker leaves participants and spectators entirely, on every run,
**permanently**"* to **"for the duration of live play"**. Live play is unchanged; the third-value
permission stays refused. **Criterion 6 there changes in two clauses** (*"non-reviewing
spectator"*) at this RFC's landing, and §6.2's recorded ruling terms carry the amendment beside
the original — the 2026-08-15 record is not overwritten.

## 0b. `rfc/archive/opponent-contracts.md` — DISCHARGED at `3276a37`

Archived with its planning directory and append-only exploration entry after both gates passed.
The migration and archive registers now point at the archived RFC. D457 remains open exactly as
required; the closeout did not promote the unvalidated historical tie counts.

The independent review's blocking follow-up [[D452]] is closed at `d77a9f1`. The conditional body
correction — **A10 fired and was scored a pass** — landed at `e0ae0b2`. Archive it: move to
`rfc/archive/`, flip any remaining rows it ships, and **append its entry to
`planning/exploration/log.md` in the archiving commit** (RFC completion protocol, both halves).

**[[D457]] stays open and must not be flipped**: the census keys on rounded `dtz` where the
runtime uses `preciseDtz`, so the *delta* stands and the *tie counts* are unvalidated.

## 1. Not takeable yet

`learner-rating` (open questions 11 and 12), `measurement-records` (returned to author).
`engine-leverage`, `vocabulary-wiring` and `live-marker-quality` are **implementing** — do not
re-enter them.

## 2. Still do NOT take

**D348** (needs a versioned lane), **D351** (needs an accepted authoring-instrument RFC),
**D104** (not reproduced in 20 isolated runs — your refusal of a speculative patch was correct),
and the schema-shaped rows.

## Protocol reminders

- **The ledger flip rides in the implementing commit**; **the log entry rides in the archiving
  commit**; **name the rows you flip in the subject or body** ([[D416]]).
- **`design/BACKLOG.md` is a shared ledger, not an intent doc.** Law 5 protects `design/00`–`06`.
- **[[D419]]: column 3 of the defect table is NOT a status.** It holds pre-implementation
  provenance and is not updated on flip, so a ✅ row can still read `🔨 fixed in …` or `💡 open`.
  **[[D459]]: the table's own header calls column 3 "Status" and is wrong.** Read column 1.
- Cite ledger rows by **row title**, never line number. Locate code by **symbol name**.
- Claude's standing error, caught by you three times: **a resolution in a queue file is not a
  resolution in the body.** Both items above read their status in their own bodies first.
- Claude's second standing error: **`git add` on shared ledger paths while you have uncommitted
  edits there.** Four instances. I now check `git status` before touching `rfc/README.md`.
- Claude's third standing error: **a line-based grep is not a reading.**
