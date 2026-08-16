# Codex queue — refreshed 2026-08-16 after implementation review

Derived from `rfc/README.md` and `design/BACKLOG.md`, not from memory. **There is no takeable
implementation item at current HEAD.** `dead-vocabulary` is implemented pending independent
review; `graduation-clearance` was returned to author on D464–D467; the opponent-contract review
follow-ups through D458 have landed, with D457 deliberately still open pending a retained-corpus
rerun.

## 0. `rfc/dead-vocabulary.md` — DONE, pending independent review

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

## 0b. `rfc/graduation-clearance.md` — RETURNED TO AUTHOR, do not take

Claims **pack schema 0.28** — earned, not discretionary: `$defs/provenance` and
`$defs/graduationEntry` are **both `additionalProperties: false` at 0.27**, so there is no
unversioned hiding place for five `$defs`-level changes. **No migration position, no run
schema, no shape-entry** — deliberately, so it does not join [[D423]]'s three-way contest.

The prior author-call open questions are closed, but implementation review found four new contract
blockers in D464–D467. They require an author round, not an implementer's inference: add the ledger
record-kind discriminator; represent historical resolved subjects honestly; name the transition
writer and output; and place the Git-backed admission check on a path that actually has Git history.

Historical review notes follow; they are not authorization to implement:

- **The classifier ruleset is now PUBLISHED** (§5.1a, seven literal keyword rules) and every
  count is its output. The residue is **17, not 12** — and the four entries the cross-review
  cited as evidence for its own ruling were **matched by rule 1 and were never residue**
  ([[D434]]). The ruling survived; its sample did not. `clearable` is **179 / 41**, and the
  pack split **inverts** to **27 instrument-bound / 23 authoring-bound**.
- **The acceptance back door is closed by a line-level `git blame` arm**, not by the three
  file-level tightenings originally proposed ([[D435]]). T1 never fires — `log.md` was added
  in `8fb62692` and an author *appends*. T3 is **unpayable** and was withdrawn: all three
  `permanent_property` rulings are undated. **Implement `GRADUATION_RULING_SELF_MINTED` with
  `git blame -L n,n`**, rejecting both the commit under review and the all-zero
  `Not Committed Yet` sentinel.
- **Two lint codes are handed back, not minted.** `GRADUATION_RESOLVED_WITHOUT_RESOLUTION` and
  `GRADUATION_ACCEPTED_WITHOUT_RULING` describe conditions that are **unrepresentable** under
  the closed schema, so minting them would be [[D426]]'s own failure performed deliberately.
  **The template registry IS adopted** — criterion 7 cannot land without it. Counts corrected
  to **9 ids over 11 literals**, with **2** candidate entries matching no template and a third
  matching one the draft's list omitted.

**Accounting to trust:** 113 entries are *machine-decidable*, but only **43 are
machine-producible unaided**. The draft's 108 double-counted — the corpus and citation classes
are **one atomic write**, priced once.

**What this RFC does NOT fix, and must not be read as fixing:** the six browser fixtures in
`content/drafts/` are accepted as `out_of_scope`, which is correct-in-kind and leaves every
corpus denominator contaminated. [[D227]] and [[D257]] stay open and own that.

## 0c. Opponent-contract review defects — DONE through D458; D457 measurement remains open

The independent review ran. **The code is right and `make verify` reproduces (727/114).** These
are three defects it found in the shipped tree, in priority order. **`opponent-contracts` does
not archive until at least D452 is fixed** — it breaks the guarantee the RFC exists to protect.

- **[[D452]] — the remedy introduced a determinism bug, and it is one line.** `neutralTiebreakKey`
  consumes the **whole `makeFen` output**, which includes the **fullmove counter**. Demonstrated
  by the reviewer: identical board, side, castling, ep and halfmove clock at fullmove 1 vs 30
  selects **`e1f1` vs `e2e4`**. `localeCompare` was insensitive to this, so **the fix introduced
  the defect it was written to prevent**: `grounding-pair` §2c promises *"two runs, or two
  branches of one group, replaying the same position always receive the same reply"*, and §3.3(3)
  re-asserts it verbatim. **A8 cannot see it** — its ancestor FEN is constructed so both paths
  yield byte-identical FENs. **Fix: key on the first four FEN fields.** The halfmove clock
  legitimately participates (it drives cursed/blessed categories); the fullmove counter has no
  chess content and does not affect the tablebase answer. **Add a test that fails before the fix.**
- **[[D453]] — `orderingBasis` is persisted on modes that have none, and our own fixture asserts
  the violating case.** §3.4 is normative that *"no other mode emits it"* and **nothing enforces
  it** — not `rest.ts`, not the run schema, not `events.ts`. `api.test.ts`'s selection is
  `{policyModeApplied: "human_common", orderingBasis: "none"}`, and the REST seam test commits
  exactly that and asserts it round-trips. **A `human_common` selection stamped
  `orderingBasis: "none"` is a persisted claim that Maia declared its candidates unordered.**
  Same *record* family as D57. Fix the constraint **and** the fixtures.
- **[[D454]] — D382's closure covers 1 of 3 nested objects on the same wire path.**
  `parseOpponentSelection` is closed; **`parseSelectionCandidate` and `parseSelectionEngine`
  still call the open `record()` and rebuild field-by-field**, while `$defs/selectionCandidate`
  and `$defs/selectionEngine` are both `additionalProperties: false`. The exact hazard D382 was
  opened for is live one level down. Its ledger row is **narrowed, not re-opened** — closing
  these two discharges it.

Lower priority, same review: **[[D455]]** (A4's anti-drift binding does not exist — no test reads
the dossier; eight literals hand-copied into five files), **[[D456]]** (`out/census.json` was not
regenerated and still shows the pre-fix `7/66`, while the same commit's README says the tool
follows the current contract — and the 507-row corpus is uncommitted, with the logged hash
matching nothing on disk), **[[D457]]** (the census keys on rounded `dtz`, the runtime on
`preciseDtz`), **[[D458]]** (A5's client scan excludes `apps/web/src/lib/api.ts`, the one client
file that carries the figures it forbids).

## 1. Independent review owed, not implementation

**`opponent-contracts` DOES NOT ARCHIVE YET.** The independent review returned
*archive-with-follow-ups*, conditional on one body edit that is now made: **A10 fired and was
scored a pass.** It read *"the won-root enrichment must not move… if it moves materially,
§3.2's reading of the census is wrong — this criterion exists to be able to fail."* It moved,
**1.571× → 1.178×**, from an interval excluding uniform (p = 0.0101) to one covering it
(p = 0.414), and was recorded as a pass because 11.01% sits **0.4 pp** inside the pre-fix
interval. **You noticed and reported the movement and did not draw the consequence** — which is
the better half of the failure, and why it was catchable. §3.2 and A10's verdict are corrected.
**The remedy is unaffected**: §3.3 clause 2 already covered all three arms, so the winning side
was fixed *by specification*, not incidentally. What was wrong is the diagnosis.

`opponent-contracts` shipped at `6ba0736`: **run schema 0.17**, **migration 23**, mode-scope
resistance on `/capabilities`, the neutral `sha256(fen\0uci)` residual tiebreak with
`orderingBasis: "none"`, and a **closed REST parse** so future selection fields are rejected
rather than silently dropped (D382). Verified `ENGINES_REQUIRED=1 make verify` 727/114 and
`make test-browser` 24 passed. The lifecycle stays open for **an independent review** — not
for another design decision, and not for you, since you implemented it. **You were right not
to archive it.**

**The census result worth carrying forward:** drawn roots came in at **4.55% against a 4.02%
uniform expectation** — the 2.6× enrichment is gone. But **won roots moved too, 1.57× → 1.18×**,
and nobody predicted that, because the remedy was specified for drawn roots only. **130 won
roots had tied optimal DTZ**, so the residual tiebreak carries far more traffic on the winning
side than the defect report implied. Recorded on D371 rather than smoothed over: `localeCompare`'s
simplification bias was never confined to the case that was measured.

**On the ledger flips — you were right about the substance and wrong about the commit, and that
is itself the finding.** They landed in `3c7d278`, not `1037004` (which touched only `log.md`).
`3c7d278` is a **claude** commit subject-lined *"rulings: teacher mode ships complete, band is
provenance…"*, naming none of D370/D371/D382 and nothing about opponent contracts; `6ba0736`
changed zero ledger characters. **Fourth instance, and the first after [[D416]] wrote the rule
against it.** That even you could not locate your own absorbed flips is the sharpest evidence
for the rule: a flip under an unrelated subject is invisible to everyone, including its author.

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
