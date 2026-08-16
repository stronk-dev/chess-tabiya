# Codex queue — refreshed 2026-08-16 (late)

## 0. TAKE FIRST — a contradiction inside work you just landed

**`plan_signature` is refused, demanded and faulted by three different instruments.** It is
the construct `vocabulary-wiring` shipped at pack **0.24**, and a content wave hit the
contradiction while trying to use it:

- the **linter DEMANDS** it — `PLAN_SIGNATURE_INLINED` fires on a shape signature written
  inline;
- **`pack-check` REFUSES** it inside any `fenPredicate`, via `START_POSITION_UNRUNNABLE`;
- the **census FAULTS** on it at **all 827 positions**.

So the only legal way to satisfy the linter is a form another instrument rejects, and the
wave shipped its three packs with the inline copies *because the successor is unusable there*
— `PLAN_SIGNATURE_INLINED` now fires on expressions that cannot legally be written any other
way. **Confirmed independently by claude**: census `satisfiabilityUnknown` rose **23 → 26**
and the three new unknowns are exactly that wave's `plan_signature` objectives.

Context that makes this worth taking first rather than filing: the corpus was **4 packs on
the deprecated `plan_consequence` and 0 on the successor**, so the merge landed with no
customer to exercise it, and **neither `PLAN_SIGNATURE_INLINED` nor `START_POSITION_UNRUNNABLE`
appears in the ledger or the log**. This is the first real use, and it failed.

Rows: D347 (the three-way disagreement), D353 (the census delta going the wrong way).

## 0a. Accepted RFCs — four of them, take in lane order

**These were mis-flagged "do not start" until 2026-08-16 (late). They are accepted and
implementable now.** Lane order matters only where a pack-schema number does; the two
that claim nothing versioned can be taken at any point.

| # | RFC | Claims | Note |
|---|---|---|---|
| 1 | `rfc/format-surface.md` | pack **0.25** | Accepted; both owner rulings applied throughout the body. `arrows` is `unmeasured`, **not** retired, and the `<select>` STAYS. `formatDispositions` does **not** go on `/capabilities` |
| 2 | `rfc/claim-backing.md` | pack **0.26** | Round 2 complete, ready to accept; two owner-gated questions that do **not** block. Re-claimed 0.26, reversing its own earlier release |
| 3 | `rfc/pack-graduation.md` | pack **0.27** | Accepted. Graduation is a **move**, not a copy; `graduationBlockers` entries become `blocking`/`resolved`/`accepted` objects |
| 4 | `rfc/evidence-at-runtime.md` | **nothing versioned** | Accepted, one owner call open (the voice seam) — does not block. Closes D118 by deleting a discard: `loadDefault` already reads every ledger and drops 764 records |

**Register drift corrected in the same pass:** `engine-leverage` holds **migration 21**
(landed — `STORAGE_VERSION` is 21 at HEAD), not 22. Its own text said 22 in two places and
`evidence-at-runtime` had inherited that citation; both are fixed. **Migration 22 landed
with `board-annotation`; `teacher-surface` holds the next migration position**, still a
draft awaiting cross-review.

## 1. Then — a broken exemplar and a closed vocabulary

- **D346** — `carlsbad-minority-attack`, the pack `design/04` §8 names as the middlegame
  exemplar, declares `plyHorizon: 8` with its deepest authored spine node at **ply 11**. Its
  last three nodes are in neither `spineNodeIds` nor under the cap, **and its objective
  materialises exactly there.** Nothing warns. `plyHorizon` equals the deepest spine ply in
  19/20 opening and 10/11 middlegame packs, so this is the one place the invariant everyone
  assumes is actually violated.
- **D348** — **21 of 25 shape entries cannot be named in any expression**: `named_structure`'s
  vocabulary is closed at four structures, so every structure-keyed predicate in the corpus is
  a hand copy of the library rather than a reference to it.
- **D351** — no `make` target computes an attack count. A pack claim was wrong **in both
  directions** until an evaluator was hand-built for it (d4 asserted 3-attacked/2-defended;
  actually 2 against 3, because a queen was blocked by its own pawn). That is a diagram anyone
  would misread, and nothing in the repo would have caught it.

## 0. The main course — two accepted RFCs, land in lane order

| # | RFC | Claims | Notes |
|---|---|---|---|
| 1 | `rfc/vocabulary-wiring.md` | **pack 0.24** | **Accepted.** Q1/Q8 owner-ruled, Q9 closed against `planning/work-register.md` §4a. **Read the open questions; do not grep them** — superseded *"resolve before `accepted`"* strings are struck through and labelled, because that search gave you a false clear here once. Merges `plan_consequence` into a `plan_signature` leaf and publishes the selection rule D89 names as missing |
| 2 | `rfc/format-surface.md` | **pack 0.25** | **Accepted.** Both owner rulings are applied throughout the body, not just in the questions. **`arrows` is `unmeasured`, NOT retired, and the `<select>` STAYS.** **`formatDispositions` does NOT go on `/capabilities`** — it ships with the schema |

`DRILL_PACK_SCHEMA_VERSION` reads **0.23** at HEAD, so the order is clean.

## 1. Permission and correctness — smallest, sharpest, take first

- **D94** — `RunService.flip` is `requireRead`-only. A mutating operation behind a read gate.
- **D95** — `selectionCacheKey` omits `targetElo`, so two bands can share a cache entry.
  Sibling of the already-closed D108; same family, same file, route them together.
- **D101** — `SILENT_ASSISTANCE.boardLighting` is `"legal"`, not `"off"`, so the silent floor
  is the floor in **eight of nine fields**. Bounded to rung 0 by `live-surface-honesty` with a
  test; closing it properly is still open.

## 2. Client surface — and one of these blocks an RFC

- **D100** — the vote form hardcodes three inputs against a server accepting **2–8** options
  and **15–600** seconds, and sets `label = moveUci` while `rest.ts` requires `label` — so
  `design/03`'s *"chat votes on plans or moves"* is blocked purely client-side.
- **D63** — eight-way compare overflows the **desktop** projection, not just phones.

## 3. Contract residuals — read D72 before touching D67

- **D66** — an aborted MultiPV job leaves the engine at that width.
- **D67** — `sameEngine` is indifferent to the band. **D72 is the trap**: the obvious fix
  would silently convert fixed resistance into fresh selections, i.e. cause the desync it
  exists to prevent. Fix D67 *with* D72 in hand or not at all.
- **D70** — the advertised Elo range is a UCI formality and would bless the ledger's own
  counterexample.

## 4. Structural tidying

- **D185** — `SessionKind` is hand-duplicated across the package boundary with nothing
  keeping the two in step.
- **D184** — `deriveMoveAuthorship` is specified, implemented, exported, tested, and reaches
  **no viewer**. Either wire it or record why it exists.
- **D235** — your D194 fix strips by **spread-minus-two**, so it enumerates what to remove
  rather than what to keep; a third field on `SelectionCandidate` would ship public by
  default. `projectPackDocument` and `PackSummary` build public objects field by field — copy
  that. Take it on your next touch of `feedback-policy.ts`.
- **D104 (yours)** — the nondeterministic browser walkthrough. Still a measurement to
  reproduce, not a test to stabilise.

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
