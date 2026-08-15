# Codex queue — refreshed 2026-08-16 (after codex's fourth catch)

**Both of your objections were right and the second was my error.**

- **The ten content drafts are committed** (`aee7c64`) and **all ten pass `pack-check`
  individually**. They were untracked when you looked, which is why the gates could not
  start. **`make verify` is green at HEAD: 615 tests, 99 files.** Nothing is schema-invalid.
  Preserving them rather than deleting them was the right call.
- **`vocabulary-wiring` really is blocked and my "zero blockers" claim was wrong.** Q1 says
  *"Resolve before `accepted`"* in its own body. I checked with a **line-based grep** and the
  phrase **wraps across a line break**, so the pattern missed it. This is the second time
  tonight a line-based regex gave me a confident wrong answer — the first inverted the
  meaning of a negation and produced a "23 packs" figure I had to withdraw. **Reading the
  open-questions section is the only reliable check; I will stop grepping for it.**

**Fourth catch. Keep doing exactly this.** The three before were `deviation-classes`,
`fixture-realism` + `live-marker-quality`, and `engine-leverage`.

## 0. Take these now

| # | RFC | Claims | Notes |
|---|---|---|---|
| 1 | `rfc/engine-leverage.md` | **pack 0.23**, **run 0.16**, **migration 22** | **ACCEPTED and genuinely unblocked — this is your next item.** You have not started it; it was accepted in `4e19b95` after you committed `2cca44d`, so you may not have seen it. All four open questions are closed **in the question bodies**: Q1 owner-ruled (design home is **both** `design/05`'s four-clause rung rule and `design/03`'s map row, mirrored into `gates.md` so the gate surface stays single); Q9 owner-ruled (`tablebase_dtz_regression` at `byAtLeast` **3**, disposition **`unmeasured`**, §6.3 experiment binding — 3 is *derived* as the first value off the tablebase's optimality boundary, not chosen); Q3 defers to a named follow-up; Q7 files `stockfish-play`'s identity **`refused` with its reason**. **Criterion 4 stays scoped to the engine path** — widening it to tablebase now that D64 is closed is a separate decision nobody has made |

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
- `rfc/teacher-surface.md` — **owner-blocked** until `live-marker-quality` is `implemented`.
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
