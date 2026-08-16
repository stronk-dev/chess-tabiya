# Codex queue — rebuilt 2026-08-16 after evidence-at-runtime

**You were right that it was empty.** Five accepted RFCs have now landed
(`board-annotation`, `claim-backing`, `pack-graduation`, `format-surface`,
`evidence-at-runtime`) and the queue had not been refilled behind them. Rebuilt from
`rfc/README.md` and `design/BACKLOG.md`, not from memory.

**My error, twice tonight, and you caught it:** I ran `git add design/` and `git add rfc/`
while you had uncommitted register edits, absorbing them into my commits. Ledgered as D372;
the rule is that I add the paths I authored, never a shared directory, while you are working.

## 0. `rfc/opponent-contracts.md` — implementing; pending independent review

The owner ruled the digest tiebreak in the RFC body on 2026-08-16. Codex reviewed and
implemented it; the lifecycle remains open for gate results and independent review, not for
another design decision.

Claims **run schema 0.17** (`OpponentSelection.orderingBasis`), a **stamp-only migration at
position `STORAGE_VERSION + 1`** (22 at HEAD), and an unversioned `/capabilities` change.
**No pack lane** — 0.28 was claimed defensively and **released** in review.

Two defects, both measured:

- **D371** — `perfect_tablebase` plays the **alphabet** when holding a draw. `grounding-pair`
  §2c specified the drawn tie (lexicographically least UCI) and required determinism and
  purity while **assuming neutrality it never named**. `localeCompare` lacks it: the drawn-root
  pick is **10.6% capture-or-pawn against 4.02% uniform** — a 2.6× enrichment toward
  irreversible simplification in `hold`, the one objective whose content is the opposite.
  Remedy: a **named refusal to order** (`orderingBasis: "none"`) plus a neutral
  `sha256(fen\0uci)` tiebreak. **Only `hold` reaches the unordered case** — `save`/`resist`
  give the learner `["loss","blessed-loss"]`, so the opponent is winning and takes the
  ascending-DTZ arm.
- **D370** — resistance is published at **mode scope** on `/capabilities`, never per move.

**Read A13 before you start.** It was written to fail against the current tree: `rest.ts`
**rebuilds** the opponent selection field-by-field, so `orderingBasis` would be **silently
dropped on the wire while every test passed** (D382). Same shape as D235.

## 1. Still do NOT take

**D348** (needs a versioned lane), **D351** (needs an accepted authoring-instrument RFC),
**D104** (not reproduced in 20 isolated runs — your call to refuse a speculative patch was
correct), and the schema-shaped rows. `engine-leverage` and `vocabulary-wiring` are
**implementing** — do not re-enter them.

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
