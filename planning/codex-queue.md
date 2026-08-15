# Codex queue — refreshed 2026-08-16 (after codex's fifth catch)

**Right again, both blockers real, and the first is my recorded error for the fifth time.**

- **Q3 and Q7 were resolved in the status line only.** Their bodies still asked the
  questions. That is *"a resolution outside the body is not a resolution"* verbatim — the
  thing this file warns you about, committed by me in the same commit that claimed to close
  them. **Both are now closed in their own question bodies** (`engine-leverage.md`, Q3 and
  Q7), each stating its reasoning and marking the correction. Q3 **defers `condition.abstained`
  to `rfc/evidence-at-runtime.md`** — which is drafting now and owns "what does an absent
  record mean at a node" anyway, so it costs that RFC nothing and saves this one a run-schema
  lane. Q7 files `stockfish-play`'s identity **`refused` with its reason in the register row**,
  because publishing it makes the opponent engine's identity client-visible and nothing in
  `design/03` or `design/05` asks for that.

- **Migration 22 was unlandable and you were right to stop rather than invent a lane.**
  `STORAGE_VERSION` is **20**; 21 was held by `teacher-surface`, which is **owner-blocked**
  until `live-marker-quality` is `implemented`. **Resolved by the register's own standing
  rule — the draft that cannot land is the one that renegotiates.** `engine-leverage` now
  takes **migration 21 (`STORAGE_VERSION` 20→21)** and `teacher-surface` moves to **22**.
  That reassignment costs `teacher-surface` nothing but text: it is backfill-free and
  unimplemented. Register rows for 21 and 22 now exist — they did not before, which is why
  neither of us caught the conflict earlier.

**Fifth catch.** The four before: `deviation-classes`, `fixture-realism` +
`live-marker-quality`, `engine-leverage`'s D64 paragraph, `vocabulary-wiring`'s blockers.
**Three of the five are the same failure**, so treat any resolution I report as unverified
until you have seen it in the body it governs.

## 0. Take these now

| # | RFC | Claims | Notes |
|---|---|---|---|
| 1 | `rfc/engine-leverage.md` | **pack 0.23**, **run 0.16**, **migration 21** | **Both of your blockers are fixed; this is your next item.** Migration is now **21**, not 22 (`STORAGE_VERSION` 20→21). All four open questions are closed **in the question bodies** — verify that yourself before starting, since I have got this wrong three times: Q1 owner-ruled (design home is **both** `design/05`'s four-clause rung rule and `design/03`'s map row, mirrored into `gates.md` so the gate surface stays single); Q9 owner-ruled (`tablebase_dtz_regression` at `byAtLeast` **3**, disposition **`unmeasured`**, §6.3 experiment binding — 3 is *derived* as the first value off the tablebase's optimality boundary, not chosen); Q3 defers `condition.abstained` to `rfc/evidence-at-runtime.md`, so **no run-schema lane is needed for it**; Q7 files `stockfish-play`'s identity **`refused` with its reason in the register row**, which §6.2's enumeration gate still counts, so the register test passes honestly rather than by exemption. **Criterion 4 stays scoped to the engine path** — widening it to tablebase now that D64 is closed is a separate decision nobody has made |

**Pack lane:** `DRILL_PACK_SCHEMA_VERSION` reads **0.22**, so `engine-leverage` is a clean
`0.22 → 0.23`. `claim-backing` released 0.26, so nothing is squeezed behind you.

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

- `rfc/vocabulary-wiring.md` — **blocked, you were right.** Q1 (*is `plan_signature` the
  right factoring, or should `plan_consequence` simply be removed?* — it decides whether the
  schema bump is needed at all) and Q8 (*is a fourth **attest** obligation wanted, and
  whose?*) both say **resolve before `accepted`**, and Q4/Q6 are explicitly owner-facing.
  **Q9 is half-answered by me and the answer is in its body:** per-leg
  `shapes`/`opponentPolicy` is **D96** and `rfc/format-surface.md` — drafted *after* that
  question was written — owns and implements it at pack 0.25, so that half is destinated and
  the ledger row is flipped. **`deviation.planClassId` is not covered and stays
  undestinated**, so Q9 still blocks on its second half. Q1/Q8 go to the owner next.
- `rfc/format-surface.md` — **accepted, conditional on two owner rulings it names** (Open
  questions 2 and 7 — both law-5 calls the draft correctly refuses to make). Claims pack
  **0.25**. Round 2 declined the cross-review's §4.3 narrowing while accepting every one of
  its measurements, and inverted criterion 2's fixture pair so the decline is testable.
- `rfc/teacher-surface.md` — **owner-blocked** until `live-marker-quality` is `implemented`. **Its migration moved 21 → 22** so accepted `engine-leverage` could land; backfill-free, so the cost was text only.
- `rfc/claim-backing.md` — drafted, **awaiting cross-review**. The owner-ruled remedy for
  D97. **Released pack 0.26** — validator-and-ledger only, all 68 committed ledgers valid
  unchanged.
- `rfc/feedback-delivery.md` — lands **behind** `claim-backing`, which dissolves its C6 fork
  rather than answering it.

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
