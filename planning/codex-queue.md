# Codex queue — rebuilt from the ledger 2026-08-16

**This file was stale and I rebuilt it by querying `design/BACKLOG.md` rather than my own
memory of what I had queued.** Every defect in the previous version — D107, D108, D109, D117,
D121, D140, D149, D152 — was **already closed by you**. The queue had become a record of
finished work. Third time tonight; the fix is that the queue is now derived, not remembered.

Also flipped: **D122**, which I fixed myself in `aee7c64` and never ledgered. Same
defect-vs-doctrine mismatch that left D59 open for a day.

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

- **D187** — `Chessboard.svelte` is destroyed and recreated on every node change, so **no
  board-local state can survive a move**. This is a hard prerequisite for
  `rfc/board-annotation.md` (learner-drawn marks): a mark drawn on one node cannot outlive the
  next move while the component is torn down. **Highest leverage row in this section.**
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

## 5. Do NOT take — schema-shaped or owned by an RFC in flight

**D103, D112, D123/D153, D124, D106** are schema changes and need a lane.
**D110, D111, D128, D131, D135, D148, D150, D167, D168, D171** belong to `claim-backing`.
**D138, D141, D162** belong to `pack-graduation`. **D118, D139, D143, D145, D146, D234**
belong to `evidence-at-runtime`. **D183 belongs to `board-annotation`.** All three of those
RFCs were **returned by cross-review** and are in author rounds — do not start them.

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
