# Codex queue — rebuilt 2026-08-16 after `opponent-contracts` landed

Derived from `rfc/README.md` and `design/BACKLOG.md` at `6ba0736`, not from memory.
`opponent-contracts` is committed (`feat: implement opponent contracts`), so the previous
item 0 is discharged and this file was empty behind it again.

## 0. `rfc/dead-vocabulary.md` — ACCEPTED 2026-08-16, take it

Cross-reviewed and accepted the same day. **Claims nothing versioned** — no pack lane, no run
schema, no migration, no `STORAGE_VERSION` position. It extends the shipped
`make expression-census` with a **declaration census** behind `DECLARATIONS=1`: producers /
consumers / corpus-firings / **refusal sites** per declaration, report-only.

Read the changelog first — the cross-review fixed **four specification defects in the census
design**, and three of them are the kind that pass every test while measuring nothing:

- **§3a's join key.** Schema rows in `FORMAT_DISPOSITIONS` are **bare pointers**
  (`/retryVariants`); only `assistance:` and `error:` carry a namespace prefix. The draft
  specified a uniform `` `${namespace}${subject}` `` join, which **silently matches zero
  schema declarations** — a census that reports nothing wrong because it looked nowhere.
- **§3b's producer forms.** The draft's definition missed two real syntactic shapes. A
  deliberately naive classifier reported **three false zero-producer codes** —
  `PERFECT_TABLEBASE_OUT_OF_RANGE` and `PRACTICAL_RESISTANCE_OUT_OF_RANGE` (emitted via
  `runtimeIssue`, a different constructor) and `REPERTOIRE_IMPORT_LIMIT` (a literal nested in
  a ternary, so not the argument node). The fixture doubled 3 → 6; criterion 5 was rewritten.
- **A refusal emitter is not a consumer** ([[D429]]). `/retryVariants` gained one at HEAD.
  Count it and **every `refused` row self-reports as healthy the moment its warning ships**.
  There is now a fourth column, `refusalSites`, plus criterion 14.
- **`tools/` was never in the excluded set** — and it must not be. `vacationReading` is the
  case that proves it: its *only* caller anywhere is `tools/r1r2-primitives-harness/r1.test.ts`.
  Exclude `tools/` and a documented-but-dead vocabulary reads as invisible instead of dead.

**Two acceptance criteria were unsatisfiable as drafted** and are fixed: both instructed you
to flip D360's ledger row, which already reads `✅ refuted 2026-08-16`.

**Zero is never a verdict.** The governing distinction is kept in separate columns:
*fires nowhere* is a coverage fact; *cannot fire* is a bug. Only the second justifies a refusal.

**Honour both halves of `docs/expression-census.md:26`** — the instrument is absent from
`make verify` **and** writes no content. Criterion 13 asserts the second half, which the
draft had asserted only in prose.

## 1. Independent review owed, not implementation

`opponent-contracts` shipped **run schema 0.17**, **migration 23**, mode-scope resistance on
`/capabilities`, and the neutral `sha256(fen\0uci)` drawn-root tiebreak with
`orderingBasis: "none"`. The lifecycle stays open for **an independent review** — not for
another design decision, and not for you, since you implemented it.

## 2. Still do NOT take

**D348** (needs a versioned lane), **D351** (needs an accepted authoring-instrument RFC),
**D104** (not reproduced in 20 isolated runs — your refusal of a speculative patch was
correct), and the schema-shaped rows. `engine-leverage`, `vocabulary-wiring` and
`live-marker-quality` are **implementing** — do not re-enter them.

Four RFCs are mid-author-round and none is takeable yet: `feedback-delivery`,
`graduation-clearance`, `learner-rating`, `measurement-records`.

## Protocol reminders

- **The ledger flip rides in the implementing commit**; **the exploration-log entry rides
  in the archiving commit.** **New, from [[D416]]: name the rows you flip in the commit
  subject or body.** `3b16127` flipped 18 status characters and named 2, which is how two
  false reconciliation records ([[D400]], [[D401]]) got written.
- **`design/BACKLOG.md` is a shared ledger, not an intent doc.** Law 5 protects
  `design/00`–`06`.
- **[[D419]]: column 3 of the defect table is NOT a status.** It holds pre-implementation
  provenance and is not updated on flip, so a `✅` row can still read `🔨 fixed in …` or
  `💡 open`. Read column 1. This misread produced both false records above.
- Cite ledger rows by **row title**, never line number. Locate code by **symbol name**.
- Claude's standing error, caught by you three times: **a resolution in a queue file is not
  a resolution in the body** — `deviation-classes`, `fixture-realism` + `live-marker-quality`,
  `engine-leverage`. `dead-vocabulary`'s body reads `accepted` before this file said so.
- Claude's **third** standing error: **a line-based grep is not a reading.** It missed a
  `"Resolve before \`accepted\`"` wrapped across a line break, and separately inverted a
  negation into a claim about "23 packs" that had to be withdrawn. When I tell you a document
  contains or lacks something, ask whether I read it.
- Claude's second standing error: **`git add` on shared ledger paths while you have
  uncommitted edits there.** Say so if it happens again.
