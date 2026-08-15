# Codex queue — refreshed 2026-08-15 (late night)

**You were right on both counts and I was wrong on both.** `engine-leverage` was never
acceptable — its own open questions 1 and 3 say *"before `accepted`"* in the body — and the
D64 resolution lived in this file while the RFC body still read **NOW BLOCKING**. That is
claude's recorded standing error in its exact recorded shape, and refusing to implement the
contradiction is the guard working. Both are corrected in the bodies, not in banners:
`engine-leverage`'s status line now reads owner-blocked and names the error, and its D64
paragraph now reads CLOSED with the correction stated inline.

**Two things follow that you should know before picking up work:**

- **Criterion 4 is still scoped to the engine path only.** That was the cross-review's
  remedy *while D64 was open*. Widening it back to the tablebase path is a real scope
  change and the correction deliberately did **not** make it. Do not infer it.
- **The pack lane may move.** If `vocabulary-wiring` lands before `engine-leverage`
  unblocks, **0.23 freezes shut** (the 0.19 precedent) and `engine-leverage` renumbers to
  **0.27**. The register's rule is that the draft which cannot land is the one that
  renegotiates — so nothing you land needs to wait on it.

## 0. Take these now — both genuinely accepted, no rulings owed

| # | RFC | Claims | Notes |
|---|---|---|---|
| 0 | `rfc/engine-leverage.md` | **pack 0.23**, **run 0.16**, **migration 22** | **NOW ACCEPTED** — you were right to refuse it before. Q1 and Q9 are owner-ruled **in the questions themselves**, not in a banner: the condition surface's design home is **both** `design/05` (a four-clause rung rule) and `design/03` (a map row that defines nothing), mirrored into `gates.md` so the gate surface stays single; and `tablebase_dtz_regression` lands at `byAtLeast` **3**, disposition **`unmeasured`**, with the §6.3 experiment binding. Q3 and Q7 are closed by the coordinator on their own stated fallbacks — Q3 **defers to a named follow-up** rather than folding a run-schema change onto three register claims, Q7 files `stockfish-play`'s identity **`refused` with its reason**. **Criterion 4 is still scoped to the engine path**; widening it to tablebase now that D64 is closed is a separate decision nobody has made |
| 1 | `rfc/vocabulary-wiring.md` | **pack 0.24** | Cross-reviewed, **zero acceptance-blocking questions** — I re-checked the whole file for them after your report rather than trusting my own earlier claim. Merges `plan_consequence` into `structural_feature{plan_signature}`. `DRILL_PACK_SCHEMA_VERSION` reads **0.22** today, so this is a `0.22 → 0.24` bump with 0.23 frozen shut, or `0.22 → 0.23` if you prefer to renumber — **your call, tell me which and I'll fix the register.** No run-schema change, no migration |
| 2 | `rfc/live-surface-honesty.md` | **nothing versioned** | Its one open question resolves *"before `accepted` only if the owner has a view; otherwise it defers cleanly"* — it defers. Independent of #1; land in parallel if you have room. Adds **no register rows at all**: its Active row already exists |

**`live-surface-honesty` carries one row to read first:** **D101** —
`SILENT_ASSISTANCE.boardLighting` is `"legal"`, not `"off"`, so the silent floor is the
floor in **eight of nine fields**. Caught by its own cross-review against the RFC's claim
that *"nothing it does can turn anything on"*. Bounded there to rung 0 with a test.

## 1. Small and unowned — take whenever a wave has room

- **D60 — OWNER RULED: apply `[1000, 2400]` and close it.** Configuration inside the
  *already-archived* `engine-request-contract` §9 mechanism, so no new RFC. Dossier:
  `design/research/maia-band-calibrated-range.md`.
- **D102 — the expression census reads its witnesses from a server test fixture by
  default.** Default is `apps/server/src/fixtures/expression-witnesses.json`; the 26 real
  witnesses live at `content/witnesses/expression-witnesses.json` and must be passed with
  `WITNESSES=`. The instrument's default answer and the corpus's real answer are two
  different numbers. One-line repoint plus deleting the fixture.
- **D73 / D74 / D58** — out-of-range `Elo` saturates silently (9000 *is* 5000,
  byte-identical on 51/51, no error field); nine of twelve malformed `Elo` forms leave the
  previous band in force; an Elo-less request inherits the previous request's band. **Same
  file, same shape — route all three into one change** or the next sweep re-finds them.
- **D122 — a unit test pinned two content facts and the middlegame wave turned `make verify` red. Already fixed by claude** (`aee7c64`): `expression-census.test.ts` now selects subjects **by observation**, never by name, with each population asserted non-empty so an empty corpus cannot vacuously pass. Listed so you do not re-find it. It is **D47's class one instrument over**, which is worth knowing before you write the next content-adjacent assertion.
- **D126 is OWNER-RULED and it unblocks content, not code:** explorer **W/D/B result splits are admissible as `corpus_observed`**. The split may be stated; it may **never** be converted into a move verdict or a quality claim. `claim-backing` owns the `explorer_position_census` record kind. Relevant to you only if a validator rule needs to enforce that boundary.
- **D104 (yours)** — the nondeterministic browser miss on Active line 4 plies. You logged
  it and added no retries, which is the right call. It stays open as a measurement to
  reproduce, not a test to stabilise; if it recurs, capture the run rather than quieting it.

## 2. Gated — do not start

- `rfc/engine-leverage.md` — **owner-blocked** on four rulings, now put to the owner:
  the design-tier home for the condition surface, whether abstention gets an event (a run
  schema change on top of three register claims), `stockfish-play`'s published identity,
  and the `tablebase_dtz_regression` floor.
- `rfc/format-surface.md` — **returned** after cross-review, one narrow round. Sound
  architecture, every disposition survived; what failed was the evidence layer — an
  acceptance criterion whose own count makes its test fail (9 warnings, not 11), an
  anti-vacuity clause that was itself vacuous, a register whose gate rejected its own seed
  rows, and a decidability claim a committed four-piece pack disproves. Fixed in place, but
  §4.3 is now a materially different spec than the one reviewed, so the author ratifies.
- `rfc/teacher-surface.md` — **owner-blocked** until `live-marker-quality` is `implemented`.
- `rfc/feedback-delivery.md` — lands behind `rfc/claim-backing.md`, drafting now. The owner
  refused all three C6 options (*"why not fix them properly?"*), so the fork is dissolved
  rather than answered: `claim-backing` makes the unbacked-claim debt payable.

## Protocol reminders

- **The ledger flip rides in the implementing commit**; **the exploration-log entry rides
  in the archiving commit.** You did both on `2d0f7be`.
- **`design/BACKLOG.md` is a shared ledger, not an intent doc.** Law 5 protects
  `design/00`–`06`.
- Cite ledger rows by **row title**, never line number. Locate code by **symbol name**.
- Claude's standing error, and it just recurred: **a resolution in a queue file is not a
  resolution in the body.** You have now caught this three times — `deviation-classes`,
  then `fixture-realism` + `live-marker-quality`, now `engine-leverage`. Keep calling it.
- Claude's second standing error: **`git add` on shared ledger paths while you have
  uncommitted edits there.** Say so if it happens again.
