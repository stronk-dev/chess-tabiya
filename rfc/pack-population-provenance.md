# RFC: Pack population and provenance — what a pack may say about its own evidence, and what checks it

- **Status:** draft
- **Author:** claude (RFC-5 of `planning/rfc-drafting-queue.md`)
- **Created:** 2026-08-17
- **Design refs:** `design/05-in-run-experience.md` §3 (the assistance ladder — rungs 4 and 5, and
  the engine-condition rule's clause 1); `design/04-content-architecture.md` §8 (production model
  and the three exemplar packs); `design/00-thesis.md` law 8 as carried in `CLAUDE.md`
- **Exploration gate:** RFC drafting opened by owner override, `planning/exploration/log.md`
  2026-08-12 (*"owner chose immediate RFCs"*). Routed here as **RFC-5** by
  `planning/rfc-drafting-queue.md` §2.5, which records the gate as PASSES with one carve-out (Open questions, Q1).
- **Depends on:** `rfc/archive/shared-resource-registers.md` (implemented — the `evidence-kinds`
  register and this RFC's live member claim now exist); `rfc/graduation-clearance.md` (accepted — holds pack
  lane 0.28)
- **Parent / amends:** — (extends `rfc/archive/pack-graduation.md`'s `$defs/provenance` and
  `rfc/archive/claim-backing.md`'s evidence-ledger vocabulary)
- **Supersedes / superseded by:** —
- **Planning:** `planning/pack-population-provenance/` (once implementing)

```tabiya-claims
pack-schema | lane 0.29 | $defs/provenance.corpusEvidence (new, closed union on state); $defs/timingWindow.properties.note maxLength 400 -> 2000; $defs/feedbackClaim.evidenceTypes (+ provenance_note)
evidence-kinds | members citable_text | EVIDENCE_KINDS (apps/server/src/sourcing/types.ts)
```

---

## Summary

A pack can state a fact about its own population and provenance and the format has nowhere to
record where the evidence for that fact lives — so nothing can check that the evidence exists.
Twenty packs promise data in a key the validator forbids them to carry. Thirty-one packs label
sixty claims `corpus_observed` while **zero** of the corpus's 893 evidence records are of either
explorer kind. The one field that must justify an authored threshold is the only capped prose
field in the format, and it has no reader at all. A retrievable, licence-compatible citation has
no record kind, so the citation pass produced attribution no instrument reads.

This RFC claims **pack schema 0.29** and one `EVIDENCE_KINDS` member. It adds one closed
`provenance` key that says *what state this pack's corpus evidence is in*, five predicates that
refuse a statement whose evidence cannot exist, one bibliographic record kind with the claim label
that binds to it, and one cap change. It **refuses** two things people will expect it to do — a
pack-side population field, and a corpus basis for `deviationCost` — and records the measured
reason for each.

---

## Motivation

### The through-line, stated once

> **A pack may state a fact; the format has nowhere to put where the evidence for that fact lives,
> and nothing refuses a statement whose evidence cannot exist.**

Every row this document discharges is one instance of that sentence:

| Row | The fact stated | Where its evidence should live | What refuses it today |
|---|---|---|---|
| [[D124]] | the corpus population behind a percentage | an `explorer_position_census` record | nothing |
| [[D157]] | *no* population at all | — | nothing; and absence is indistinguishable from a wrong one |
| [[D123]] / [[D153]] | why a luxury budget is 1 and a deadline is 4 | `timingWindows[].note` | a 400-character cap |
| [[D268]] | a retrievable, licence-compatible citation | an evidence record | no bibliographic `EVIDENCE_KINDS` member |
| [[D171]] | *this claim rests on a citation, not an instrument* | `feedbackClaim.evidenceTypes` | a closed seven-member enum |
| [[D470]] (format half) | *the engine evidence is over there* | a sidecar | `PROVENANCE_EVIDENCE_INLINE` — the promise is unkeepable |
| [[D148]] | a deviation's cost, from corpus data | — | **nothing should**; see §7 |

The repo already states the governing rule one layer down. `design/05` §3, engine-condition clause
1: *"A condition may only reference a reading a recorded producer actually emits. An arm exists
when its measurement has a producer in the tree, not when it is expressible."* This RFC applies the
same rule one layer up: **a pack may state a population when a recorded producer emitted it, not
when it can be typed into a string.**

### The measurement, produced for this document

Every number below was produced by walking committed `content/` at **`451bb44`** with a throwaway
script (92 pack documents — every JSON file carrying `id`, `objective` and `provenance` and no
`schema` key; 68 sidecars carrying `schema: "tabiya.sourcing.evidence.v1"`). `content/` is clean at
HEAD, so none of these counts includes another agent's uncommitted work.

| Measured | Value |
|---|---|
| pack documents in `content/` | **92** |
| of those, `reviewStatus: "published"` | **0** (all 92 are `draft`) |
| evidence ledgers / records | **68** / **893** |
| record kinds present | `engine_eval` 415, `tablebase_result` 341, `position_legality` 59, `opening_identity` 52, `puzzle_provenance` 26 |
| `explorer_position_census` **or** `explorer_frequency` records | **0** |
| packs with no ledger at all | **24 of 92** |
| packs carrying ≥1 `corpus_observed` claim | **31**, carrying **60** such claims — of which **15** have no ledger |
| packs whose `provenance.sources` promise `provenance.engineValidation` | **20**; packs carrying the key: **0** |
| packs quoting `blitz+rapid` / `rapid+classical` anywhere | **17** / **14** / **0 both** / 61 neither |
| ledgers carrying any `claimBindings` | **1 of 68** (1 binding in total) |
| `timingWindows[].note` values | **4**, at **337 / 359 / 372 / 394** of 400 |
| readers of `timingWindows[].note` in `apps/`, `packages/` | **0** |
| deviations carrying `cost.kind: "unmeasurable"` | **7**, in 6 packs |

Three of those lines are the motivation on their own.

**31 packs label 60 claims `corpus_observed` and the corpus contains zero explorer records.**
`MACHINE_LABEL_EVIDENCE_KINDS` (`apps/server/src/sourcing/claim-binding.ts`) maps `corpus_observed`
to `["explorer_frequency", "explorer_position_census"]`; not one record of either kind exists in 68
ledgers. The label is a promise the corpus cannot keep, and `EVIDENCE_TYPE_UNBACKED` catches it
only on the 15 packs with no ledger at all (`missingLedgerClaimIssues`) or where a `claimBindings`
array exists — which is **1 of 68**. For the other 16 the promise is invisible.

**20 packs promise `provenance.engineValidation` and the validator forbids the key.**
`PROVENANCE_EVIDENCE_INLINE` (`apps/server/src/pack-validation.ts`) refuses four key names —
`engineValidation`, `tablebaseValidation`, `evidence`, `records` — at both the schema arm
(`schemaIssue`) and the runtime arm. `$defs/provenance` closes `additionalProperties` over six
keys and has none of them. So the promise is not merely unkept, it is unkeepable — and **nothing
reads the promise**, because `provenance.sources` items are `#/$defs/nonEmptyString`.

**`carlsbad-minority-attack` is the whole through-line in one file.** `design/04` §8 names it as
the middlegame exemplar. It quotes a complete explorer population in prose — *"ratings=1400,1600,1800,
speeds=rapid,classical, since=2023-01, until=2025-12 … start position 815 games, 390 white / 60 draw
/ 365 black"* — inside `provenance.sources[2]`, and **has no `.evidence.json` at HEAD**. Nothing can
re-derive that count, compare it to the `blitz+rapid, 2024-01..2026-07` population 17 other packs
quote, or notice when it goes stale. [[D157]]'s row says the pack *"now carries the position census
… as its first corpus fact"*; at HEAD it carries the census **as a sentence**, which is exactly the
defect the row exists to name.

### Why this matters now rather than later

Owner ruling [[D502]] made `content/drafts/` ship to production behind a *draft* badge. Every
number above is therefore in front of a learner today, not in a staging area. That ruling is also
why every predicate in §5 is **warning on `draft`, error on `published`**: the draft channel must
keep shipping, and the graduation gate is where an unbacked population becomes a refusal. This RFC
does not re-argue [[D502]]; it makes the shelf's admission test say something.

### Why this scope boundary

**In scope:** what a pack may say about its own population and provenance, and what checks it.

**Out of scope, named:**
- **The 21 content edits of [[D470]]'s content half.** Queued as job A in `planning/codex-queue.md`
  §0-CONTENT. This RFC specifies only the refusal that stops the 21st; it re-specifies none of the
  edits and its §5 P4 is written so that job A's corrected sentence passes (§5.4).
- **Which population a pack declares.** Choosing a rating band, speed set and window is authored
  chess judgement (`planning/defect-triage.md` §7b). This RFC specifies the field and the
  refusal; it populates nothing. Carried as a `## Discharges` row.
- **The explorer census pass itself.** That is `feedback-delivery`'s stage-2 binding wave and is
  already owned; this RFC's P3 is what makes its absence visible, not what performs it.
- **Anything in the shape-entry or run schema.** [[D103]] is the same defect one schema over and
  belongs to RFC-6 (Appendix B).
- **`deviationCost`.** §7 records a refusal and changes nothing.

---

## Specification

### §1 — What the format may say about where its evidence lives

[[D470]]'s format half asks whether a pack should be able to say where its evidence lives. **Mostly
no, and the exception is precise.**

The sidecar's location is **derived, not declared**: `checkSourcingFile`
(`apps/server/src/sourcing/check.ts`) reads `${stem}.evidence.json` and `${stem}.sources.json`
beside the pack file; `checkSourcingDirectory` reads `evidence.json` and `sources.json` in the
candidate directory. A pack-side path field would restate a derivable fact, and
`rfc/archive/shared-resource-registers.md` §4 states the doctrine that settles it: **a fact you never write
cannot go stale.** A declared path can disagree with the loader; a derived one cannot.

What a pack **cannot** say, and must be able to, is not *where* the evidence is but **whether its
absence is intended**. 24 of 92 packs have no ledger and nothing distinguishes *deliberately
ungrounded* from *the author forgot*. That is [[D157]]'s sentence — *a pack quoting no population
is indistinguishable from a pack quoting the wrong one* — and it is the one fact no derivation can
supply, because it is a statement of intent.

#### §1.1 `provenance.corpusEvidence`

`$defs/provenance` gains one optional key. It is a closed discriminated union on `state`:

```json
"corpusEvidence": {
  "oneOf": [
    {
      "type": "object",
      "required": ["state"],
      "properties": { "state": { "const": "ledger" } },
      "additionalProperties": false
    },
    {
      "type": "object",
      "required": ["state", "reason", "detail"],
      "properties": {
        "state": { "const": "abstained" },
        "reason": { "enum": ["out_of_range", "source_unavailable", "no_data_at_band", "licence_withheld"] },
        "detail": { "$ref": "#/$defs/nonEmptyString" }
      },
      "additionalProperties": false
    },
    {
      "type": "object",
      "required": ["state"],
      "properties": { "state": { "const": "unsourced" } },
      "additionalProperties": false
    }
  ]
}
```

`$defs/provenance` keeps `additionalProperties: false` and goes from six declared keys to seven.

- **`ledger`** — this pack's corpus facts are recorded in its sidecar. Checked by P3a.
- **`abstained`** — there is deliberately no corpus evidence, and here is why. The `reason` enum is
  **`ABSTENTION_REASONS` transcribed verbatim** from `apps/server/src/sourcing/types.ts`; it is not
  a new vocabulary. §5.6 pins the transcription with a set-equality test rather than a comment,
  which is the mechanism `graduation-clearance` criterion 13 already uses on `EVIDENCE_KINDS`.
- **`unsourced`** — there is no corpus evidence and no stated reason. Legitimate on a draft;
  refused on the shelf (P2).

**Optional, not required, and the reason is measured.** Making it required is a 92-pack migration
that turns the entire live draft channel red on the day it lands. Instead the *absence* is P1 — a
warning on `draft`, an error on `published`. That gets "written, never inferred" (RFC-1 §3,
RFC-2 §3.1) exactly where it binds, at the moment a pack asks for the shelf, and costs the draft
channel nothing.

#### §1.2 What is refused here, and why

**A pack-side population field is refused.** [[D124]]'s row asks for *"a corpus-evidence block
(population, speeds, window, retrieval date) beside the claim"*. That block **already exists**, one
file over: `explorer_position_census.values` carries exact keys `fen`, `total`, `whitePct`,
`drawPct`, `blackPct`, `topMoves`, `ratings`, `speeds`, `since`, `until`, validated in
`evidenceSemantics` (`apps/server/src/sourcing/check.ts`) against `RATING_GROUPS` and `SPEEDS`, with
`total >= 100`, with each `topMoves[].sharePct` re-derived from its own `playedCount`, and with
band, window and FEN **compared to the manifest entry's HTTP request URL**. A pack-side copy would
be validated against nothing. Copying a single-writer resource into a second hand-written home is
the defect `rfc/archive/shared-resource-registers.md` exists to prevent; this RFC declines to create a
seventh instance of it. [[D124]] is discharged by making the recorded population **declarable and
checkable** (§1.1, P3), not by re-typing it into the pack.

**A prose-scanning population check is refused, and the corpus supplied the counterexample.** The
obvious P-candidate — *if a `provenance.sources` string names a rating band and a speed, require a
census record* — cannot establish its own non-vacuity. I ran it: the token `Classical` appears as a
**speed** in 14 packs and as part of an **opening name** in at least 6 (`anti-kid-classical-white`,
`kid-classical-black`, `c54-italian-game-classical-variation-center-attack` and others), and
`1800`, `2000` and `2200` are `RATING_GROUPS` members that also appear as ordinary integers. A
predicate that fires on author prose has a false-positive rate I cannot bound, and a warning that
false-positives is noise this repo has already paid for. The check is therefore built on the
format's **own closed vocabulary** — the `corpus_observed` label — where the subject is
unambiguous. This is stated rather than omitted because "we considered a prose check" is exactly
the kind of decision that gets re-litigated in review.

### §2 — The promise that cannot be kept

`PROVENANCE_EVIDENCE_INLINE` refuses four key names. Nothing refuses a *sentence promising* one of
those four. Twenty packs contain such a sentence; job A rewrites all twenty; nothing stops the
twenty-first.

The four names are currently written **twice in the same file** — as an inline array literal in
`schemaIssue` and again in the runtime walk of `pack-validation.ts`. This RFC requires that array be
lifted to a single exported constant in `apps/server/src/pack-validation.ts`:

```ts
export const INLINE_EVIDENCE_KEYS = ["engineValidation", "tablebaseValidation", "evidence", "records"] as const;
```

Both existing sites read it, and P4 reads it. **The promise-side and key-side refusals must never
be able to disagree about which keys are forbidden** — which is the smallest possible instance of
this RFC's own through-line, and the reason the constant is normative rather than a tidy-up.

### §3 — A citation is a record kind (`EVIDENCE_KINDS` gains `citable_text`)

[[D268]] is precise about the shape of the hole: `linkage` (`apps/server/src/sourcing/ledger-validation.ts`)
raises `MANIFEST_ENTRY_UNUSED` for any manifest entry that no record or abstention names, so a
citation cannot enter the manifest at all unless some record consumes it — and no member of
`EVIDENCE_KINDS` is bibliographic. **The row's own count is stale and its claim survives:** it says
*"the six kinds"*; there are **seven** at HEAD (`explorer_position_census` was added by
`claim-backing`). None of the seven is bibliographic.

`EVIDENCE_KINDS` gains an eighth member:

```
opening_identity · position_legality · explorer_frequency · explorer_position_census ·
tablebase_result · engine_eval · puzzle_provenance · citable_text
```

**Record contract.** A `citable_text` record:

- carries `grounds: "citable_source"`. This discriminator already ships and is already used —
  52 `opening_identity` and 26 `puzzle_provenance` records carry it, measured. No new field.
- carries `values` with **exact keys** `["title", "sectionRef", "quotedText"]`, each a non-empty
  string, checked with `exactKeys` in `evidenceSemantics` following the shape every other kind
  uses. `url`, `sha256`, `retrievedAt` and `licence` are **not** duplicated into `values`: they are
  the manifest entry's, joined by `sourceId` + `retrievedAt` in `linkage`.
- must resolve to a manifest entry whose `origin.kind` is `"http"` with a non-null `sha256`.
  Failure raises the new code `CITATION_SOURCE_UNRETRIEVABLE`. A citation whose bytes were never
  hashed is a reference, not evidence — and `SourceEntry.origin` already carries `sha256`.
- **may support only `PROSE_POINTERS`** — `/objective/summary`, `/planClasses/*/description`,
  `/spine/**/annotations/*`, `/deviations/*/note`, `/feedbackClaims/*/text` — and nothing else.
  P5. A citation's job is to ground prose; grounding a FEN or a cost is what the instruments do.

**Two properties this gets for free, and they are why `citable_text` is shaped this way.**
`licenceObligations` (`check.ts`) already treats a record supporting a `PROSE_POINTERS` pointer as
*contributing prose*, and therefore already demands a matching CC-BY-SA-4.0 entry in
`provenance.attribution`. So the attribution obligation [[D268]] describes attaches to
`citable_text` **without one line of new licence code**. And `evidenceSupports` already refuses
`PROSE_POINTERS` for every non-template record; P5 is the inverse arm of a rule that already
exists, not a new rule.

### §4 — A claim may say its ground is a citation (`evidenceTypes` gains `provenance_note`)

`$defs/feedbackClaim.evidenceTypes` is a closed seven-member enum. It gains `provenance_note`,
which is [[D171]]'s requested member, and it gains a **reader** in the same change:

```ts
MACHINE_LABEL_EVIDENCE_KINDS = { corpus_observed: [...], engine_validated: [...],
                                 tablebase_exact: [...], provenance_note: ["citable_text"] }
```

That one map entry is the whole wiring. A claim labelled `provenance_note` now needs a validating
claim binding to a `citable_text` record, or `EVIDENCE_TYPE_UNBACKED` fires — warning on `draft`,
error on `published` — through the **existing** code path in `evidenceSupports`, and through
`missingLedgerClaimIssues` when the pack has no ledger at all. No new predicate, no new code path.

**A vocabulary member with no reader is the defect [[D428]] describes**, and adding
`provenance_note` as an inert eighth enum value would have been exactly that. This is why the row
is discharged together with [[D268]] rather than on its own: the label needs a record kind to point
at, and the record kind needs a label that admits it.

**Three fences, stated so they are not inferred:**

1. **`provenance_note` does not exempt anything from `CLAIM_AUTHOR_LABEL_REQUIRED`.** A claim whose
   text contains an authored assertion still needs `author_principle` and a resolving `principles`
   entry (`claim-binding.ts`; `CLAIM_PRINCIPLE_MISSING` in `pack-validation.ts`). `provenance_note`
   is an *additional* ground, never a substitute for naming a principle. Without this fence the new
   member is a cheaper relabel, which is [[D135]]'s standing finding.
2. **`citable_text` may appear under no other label.** It must not be admissible backing for
   `corpus_observed`, `engine_validated` or `tablebase_exact`. A cited sentence is rung 5 with a
   source; it is not a corpus census, an engine reading or a tablebase result. This is law 8 at the
   vocabulary layer and criterion 7 asserts it.
3. **`provenance_note` may not be mapped to any instrument kind.** Its list is exactly
   `["citable_text"]`.

The worked instance is already in the corpus: `carlsbad-minority-attack`'s
`provenance.sources[6]` is a CITATION PASS naming three CC-BY-SA-4.0 sources, read via the
MediaWiki `action=parse` API, and ending *"THE TAXONOMY DOES NOT MATCH CLEANLY … This pack's third
White plan is therefore NOT cited and is in visible tension with the source."* Today that is a free
string. Under §3 + §4 it is three manifest entries, three `citable_text` records supporting the
plan-class descriptions they actually ground, and one `provenance_note` claim — and the plan that
is *not* cited is visible as the description with no supporting record.

### §5 — The predicates

Five. Each states what makes it non-vacuous, and each carries a **positive and a negative fixture**
— the negative is what proves the predicate reads its subject rather than its own state. That
discipline is not stylistic: [[D522]] found a clearance predicate that already held on all 16
entries assigned to it, so its migration's first run would have retired sixteen debts by doing
nothing, and [[D526]] found an acceptance criterion whose instrument made its answer 100% by
construction. Both fired within 72 hours of this draft.

Unless stated otherwise, severity follows the pattern already shipped in `missingLedgerClaimIssues`:
**`published ? "error" : "warning"`.**

#### §5.1 P1 — `PROVENANCE_CORPUS_STATE_MISSING`

`provenance.corpusEvidence` is absent.

- **Non-vacuity.** It cannot be vacuous: the key does not exist in the format today, so at landing
  it fires on **92 of 92 packs** — as **92 warnings and 0 errors**, because all 92 are
  `reviewStatus: "draft"` (measured). Its error arm is P2's population.
- **Negative fixture.** A `draft` pack carrying `{"state": "unsourced"}` produces **no** P1 issue.
  Without it, a check that fired on every pack regardless of the key would look identical at HEAD.

#### §5.2 P2 — `PROVENANCE_CORPUS_UNSOURCED_ON_PUBLISHED` (error, always)

`reviewStatus: "published"` with `corpusEvidence` absent or `state: "unsourced"`.

- **Non-vacuity — and this one needs the honest sentence.** It fires on **0 packs at HEAD**,
  because **0 of 92 are published**. Under [[D428]]'s distinction that is a **coverage fact, not a
  bug**: the predicate can fire, and it fires nowhere only because graduation has not yet promoted
  anything. `graduation-clearance`'s own register row records *"0 of 50 packs graduate on instrument
  runs alone"*. A predicate whose entire corpus population is empty is exactly the case where the
  fixtures are the argument, so criterion 3 requires both.
- **Positive fixture.** A `published` pack with `state: "unsourced"` → error.
- **Negative fixture.** The same pack with `state: "abstained"` + a reason + detail → **no** issue.
  This is the fixture that proves P2 refuses *silence*, not *the absence of corpus data*. A pack
  that honestly says *no data at this band* must be able to reach the shelf, or the predicate has
  quietly become a corpus-coverage gate nobody agreed to.

#### §5.3 P3 — `PROVENANCE_CORPUS_STATE_CONTRADICTED`

The declared state disagrees with what is actually there. Two runtime arms:

- **P3a** — `state: "ledger"` and the pack has no sibling ledger, **or** its ledger carries zero
  records of kind `explorer_position_census` or `explorer_frequency`.
- **P3b** — `state: "abstained"` or `"unsourced"` and any `feedbackClaims[].evidenceTypes` contains
  `corpus_observed`.

- **Non-vacuity, and it is the strongest in the document.** **31 packs carry 60 `corpus_observed`
  claims; 0 of 68 ledgers carry a single record of either explorer kind** (measured). Whichever
  state those 31 packs declare, an arm fires: `ledger` trips P3a, `abstained`/`unsourced` trips
  P3b. **No declaration satisfies P3 for any of the 31 without new evidence** — which is the exact
  inverse of [[D522]], where the predicate was already satisfied by every subject assigned to it.
  16 of the 31 have a ledger and are invisible to every check that ships today.
- **Negative fixture (P3a).** A pack with one `corpus_observed` claim, `state: "ledger"`, and a
  sibling ledger carrying one valid `explorer_position_census` record → **zero** issues. This is
  the fixture that proves P3a reads the ledger's *contents* and not merely its existence.
- **Negative fixture (P3b).** A pack with `state: "abstained"` and **no** `corpus_observed` label →
  **zero** issues. Without it, P3b could be firing on the state alone.
- **Positive fixture (P3b).** The same pack with one `corpus_observed` claim → issue.

**What P3 deliberately does not do.** It does not compare the census record's `ratings`/`speeds`/
`since`/`until` to anything in the pack, and it does not require two packs to agree on a
population. [[D124]]'s *comparison* becomes possible the moment the populations are records —
`explorer_position_census.values` is already URL-validated — but *which* population is correct is
authored judgement (§Motivation, out of scope) and a checker that picked one would be legislating
content.

#### §5.4 P4 — `PROVENANCE_SOURCE_PROMISES_INLINE` (error, both channels)

Any `provenance.sources[]` string containing the substring `provenance.<key>` where `<key>` is a
member of `INLINE_EVIDENCE_KEYS` (§2).

- **Non-vacuity.** **Fires on 20 of 92 packs at HEAD** (measured; the same 20 job A repairs). After
  job A it fires on **0**, so its permanent non-vacuity rests on fixtures rather than corpus
  firings — stated here so nobody later reads a green corpus as evidence the check is dead.
- **Negative fixture — the one that matters most.** A source string carrying the pointer job A
  substitutes in — *"…full engine detail in `carlsbad-minority-attack.evidence.json`"* — must
  produce **no** issue. A check that refuses its own fix would send job A into a loop, and a naive
  substring match on `evidence` or `records` would do exactly that.
- **Second negative fixture.** A source string using the word *records* as an ordinary verb — *"the
  cited article records that…"* — must not fire. This is why the predicate matches the
  `provenance.` **prefix** rather than the bare key name, and the fixture is what pins that.
- **Positive fixture.** *"…full engine detail in `provenance.engineValidation`"* → error.
- **Severity is error on both channels, unlike P1–P3.** The promise names a key the schema will
  reject if anyone acts on it; there is no state of the world in which it is correct, and [[D502]]'s
  draft channel has no interest in shipping one.

#### §5.5 P5 — `EVIDENCE_OVERREACH`, extended to `citable_text` (error)

A `citable_text` record whose `supports` contains a pointer not matching `PROSE_POINTERS`.

- **Non-vacuity.** The complementary arm already ships and already fires (`evidenceSupports`
  refuses `PROSE_POINTERS` for non-template records; `apps/server/src/sourcing/sourcing.test.ts`
  asserts `EVIDENCE_OVERREACH` today). The new arm is decidable on any record: `/start/fen` fires,
  `/feedbackClaims/0/text` does not.
- **Hazard named.** There will be **0 `citable_text` records in the corpus** at landing, so both
  arms have a corpus firing count of zero on day one. Coverage fact, not a bug — but it means the
  fixtures are the entire non-vacuity argument, and criterion 8 says so.
- **Positive fixture.** A `citable_text` record with `supports: ["/start/fen"]` → error.
- **Negative fixture.** The same record with `supports: ["/planClasses/0/description"]` → no issue.

#### §5.6 Transcription discipline

This RFC transcribes `ABSTENTION_REASONS` (`apps/server/src/sourcing/types.ts`) into
`schemas/drill_pack.schema.json` as `corpusEvidence.abstained.reason`'s enum. **That is, by
construction, a second hand-written copy of a closed vocabulary that has no register** — and it is
worth saying plainly, because [[D506]] was a **retracted false record** that claimed such a copy
already existed and was wrong at HEAD, while its retraction note records what is true: *"the
duplication this row predicted comes true the moment `graduation-clearance` §6.1 transcribes it."*
This document makes the same move a second time, deliberately.

**The mitigation is a set-equality test against the shipped constant, not a comment** — the
mechanism `graduation-clearance` criterion 13 already uses on `EVIDENCE_KINDS`, adopted here for
the same reason and asserted by criterion 6. The alternative (a `$ref` into a generated enum) is
refused: nothing in the build generates schema fragments from TS constants today, and inventing
that pipeline for a four-member enum is a larger change than the register RFC-1 is already
proposing.

The evidence labels in `feedbackClaim.evidenceTypes` are **not** a transcription of a TS constant —
the schema enum is the single writer, and `DrillPackDefinition["feedbackClaims"][n]["evidenceTypes"]`
is typed `readonly string[]`, so adding `provenance_note` needs no TypeScript change at all.

### §6 — The `timingWindows[].note` cap: 400 → 2000

[[D123]] and [[D153]] are one finding with a number on it. Four window notes exist and they are
**337, 359, 372 and 394** of 400 characters — headroom 63, 41, 28 and 6 — while the population
sentence a split needs is ~120 characters in this repo's own phrasing. **No window can state the
population of a split in the field that exists to justify its thresholds.**

**The cap moves to 2000, and the number is derived rather than chosen.** Measured over committed
`content/`, the observed maxima of the format's uncapped author-prose fields are:
`provenance.sources[]` **1657** (n=405, median 373, p90 850), `objective.summary` **1029**,
`feedbackClaims[].text` **892**, `deviations[].note` **684**, spine annotations **579**. 2000 is
the smallest round bound above the widest of them, so the cap can never again be the binding
constraint on prose this corpus has demonstrated it writes, and the field stays bounded. D153's
floor is 400 + 120 = 520; 2000 clears it with the threshold argument still attached.

**Two findings make this cheaper than it looks, and one makes it necessary.**

- **`timingWindows[].note` has zero readers.** I searched `apps/web/src`, `apps/server/src`,
  `packages/runtime/src` and `packages/schema/src`: the field is read nowhere.
  `apps/web/src/lib/evidence-sentences.ts` builds every tempo verdict sentence from `window.label`
  and `window.luxuryMoveBudget` and never touches `note`. So a 400-character cap — a
  learner-facing-length constraint — is being applied to a field **no learner sees**, and widening
  it costs the client exactly nothing.
- **The other 400-cap in the schema stays.** `$defs/objectiveGrading.assessedBy` `kind: "authored"`
  carries `note` at `maxLength: 400`, and that one **is** rendered to learners —
  `apps/web/src/lib/outcome-presentation.ts` prints *"Root assessment (authored, unproved): …"*.
  The two caps are not the same decision and criterion 8 forbids a blanket replace.
- **A widened field with no reader is [[D428]]'s defect one layer over**, so this RFC gives it one:
  `make graduation-report` prints each pack's `timingWindows[].note` verbatim beside its graduation
  state. That puts the justification of an authored threshold in front of the reviewer at the
  moment they decide whether the threshold graduates, which is the only moment it is load-bearing.

**[[D123]]'s alternative is refused.** The row offers *"or give a window a `rationale` sibling that
is not learner-facing"*. The field is **already** not learner-facing, measured; a sibling would
create two author-facing prose fields on one object with no rule dividing them, and the next author
would have to guess.

### §7 — [[D148]]: a refusal of record, changing nothing

[[D148]] is carried here **as a recorded refusal**, per `planning/rfc-drafting-queue.md` §2.5. This
RFC changes `$defs/deviationCost` in no way.

**Structural half, verified at the symbol.** `$defs/deviationCost` is a `oneOf` over **four** arms
— `cp` (`basis: engine | material`), `mate` (`basis: engine | tablebase`), `unmeasurable`
(`reason` only), and `category` (`from`/`to` over the five WDL categories, `basis: "tablebase"`).
No arm admits a corpus basis, and a W/D/B result split cannot be written into the field at all.
**The row's headline is stale in two ways and column 3 already flags one:** it says *three shapes*
(there are four — the `category` arm landed with `engine-leverage`), and it says the four
`unmeasurable` deviations; **at HEAD there are seven, in six packs** — the four the row names are
still there and three more have been authored since.

**Semantic half — the actual refusal, and it is the ruling's, not this RFC's.** Owner ruling
[[D126]] admits explorer result splits as `corpus_observed` (rung 4) and draws the boundary
explicitly: *"the split may be stated; it may never be converted into a move verdict or a quality
claim."* `cost` is a quality claim by construction — it is consumed by `deviationCostEvidenceIssues`
and by grading. **Giving `deviationCost` a corpus basis is precisely the conversion the ruling
refuses.** Specifying one here would breach an owner ruling in the document that cites it, which is
a failure mode this repo hit twice in one day.

**And the corpus says the conversion would be empty anyway.** The four `unmeasurable` deviations
D148 measured are played 30 of 10987, 2 of 158, 0 of 742 and 0 of 730 at ratings 1400/1600/1800,
rapid+classical, 2023-01..2025-12 — all four below the 100-game floor at which the explorer client
abstains (`apps/server/src/sourcing/explorer.ts`: `if (total < 100) return { kind: "abstention",
reason: "no_data_at_band", … }`, verified at the symbol). **A move worth authoring as a deviation is
a move the band does not play, which is the same property that denies it a split.**

**The consequence, stated rather than hidden.** The refusal means `unmeasurable` keeps growing —
4 → 7 in two days — and nothing measures the growth. That is a ledger row, not a schema field, and
it is proposed as D533 under Open questions.

### §8 — Version claim

This RFC claims **pack schema 0.29** and one `EVIDENCE_KINDS` member.

Verified at the symbol at `451bb44`: `DRILL_PACK_SCHEMA_VERSION` is `"0.27"`
(`packages/schema/src/index.ts`); `schemas/drill_pack.schema.json` `$id` is
`urn:chess-tabiya:schema:drill-pack:0.27`; `rfc/README.md` records **0.28 claimed and held by
`graduation-clearance`** and **0.29 as the next free lane**. No run-schema lane (`drill_run.schema.json`
is 0.17), no shape-entry lane (`shape_entry.schema.json` is 0.3), no principle-entry lane
(`principle_entry.schema.json` is 0.1), and **no migration position** — `STORAGE_VERSION` is 23
(`apps/server/src/storage.ts`) and nothing here touches stored runs.

**`tabiya-claims`: carried now by RFC-1's landing.**
`rfc/archive/shared-resource-registers.md` §3 requires every active RFC body to carry exactly one
such block. The declaration at the top of this document is authoritative; the nested copy below
remains an example and the fence-aware parser deliberately ignores it:

````
```tabiya-claims
pack-schema | lane 0.29 | $defs/provenance.corpusEvidence (new, closed union on state); $defs/timingWindow.properties.note maxLength 400 -> 2000; $defs/feedbackClaim.evidenceTypes (+ provenance_note)
evidence-kinds | members citable_text | EVIDENCE_KINDS (apps/server/src/sourcing/types.ts)
```
````

Note the second line, where `graduation-clearance` correctly wrote none: that RFC **transcribes**
the seven kinds and adds no member, while this one adds `citable_text`. Under RFC-1 §4 the
`evidence-kinds` register's claim form is `members <name>…`, not a version — two claims on
*different* members are not a collision, so this claim does not contest anything.

**Landing order.** Behind `graduation-clearance` (holds 0.28). Behind
`rfc/archive/shared-resource-registers.md`, which has created the `evidence-kinds` register and
records this document's member claim — closing [[D499]] without adding a numeric vocabulary version.

---

## Deviations from design

**None.** `design/05` §3 is the ladder this document defends rather than moves: `citable_text` and
`provenance_note` sit at rung 5 with a source attached, and §4 fence 2 forbids either from being
admitted as rung 1, 2 or 4 backing. `design/04` §8's exemplar list is cited as evidence, not
amended.

One deliberate **non**-deviation worth naming: this RFC does not touch the [[D126]] ruling's
boundary, and §7 declines a change that would have crossed it.

---

## Acceptance criteria

Every criterion resolves to a named symbol, file or command. **The acceptance test is buildability**
([[D473]]) — `graduation-clearance` was returned twice for obligations that resolved to a symbol
name that was not in the tree, so each criterion below names what fails and how.

1. **The lane moves in all three places.** `schemas/drill_pack.schema.json` `$id` reads
   `…drill-pack:0.29`; `DRILL_PACK_SCHEMA_VERSION` in `packages/schema/src/index.ts` reads `"0.29"`;
   the expectation in `packages/schema/src/drill-pack.test.ts` is updated; `make schema-check` is
   green. — *Failure mode: the constant and the `$id` diverge. That test is the only binding between
   them, and `principle-entry` is the one resource with no such test at all ([[D499]]).*

2. **All 92 committed packs validate under 0.29 with zero new errors**, verified by running
   `make pack-check FILE=…` over `content/` (or the equivalent single walk). `corpusEvidence` is
   optional; P1 produces 92 warnings and 0 errors. — *Failure mode: making the key required turns
   the live draft channel red on landing day and refutes [[D502]] by accident.*

3. **Each of P1–P5 has a positive fixture that fires and a negative fixture that does not**, with
   the specific fixtures named in §5.1–§5.5. P1–P4 land in
   `apps/server/src/refusal-coverage.test.ts`, which is where `PROVENANCE_EVIDENCE_INLINE`'s own
   positive fixture already lives (`inline.provenance.engineValidation = {}` → `has(inline, …)`);
   P5 lands in `apps/server/src/sourcing/sourcing.test.ts` beside the existing `EVIDENCE_OVERREACH`
   assertion. **That file has a `has(value, code)` helper and no negative counterpart** — the
   implementer adds a `lacks(value, code)` beside it, which is the one piece of new test
   infrastructure this RFC needs and is named so it is not discovered at implementation time. —
   *Failure mode: [[D522]] — a predicate already satisfied by everything assigned to it, whose
   first run retires debts by doing nothing. The negative fixture is what proves the predicate
   reads its subject rather than its own state, and a suite with only a `has` helper structurally
   cannot express one.*

4. **The implementation's log entry records each predicate's measured firing count over
   committed `content/`**, and they match §5 or the divergence is explained: P1 = 92 warnings /
   0 errors; P2 = 0 (0 published packs); P3 ≥ 31 packs; P4 = 20 (→ 0 after job A); P5 = 0. —
   *Failure mode: [[D526]] — a criterion that passes while measuring nothing. A count nobody ran is
   not evidence a check works.*

5. **P4's negative fixture is a sentence produced by job A's substitution rule**, which
   `planning/content-wave-work-order.md` §3 JOB A states as: *replace the pointer
   `provenance.engineValidation` with the sidecar the validator actually accepts —
   `<pack>.evidence.json` — and change nothing else in the sentence.* A source string naming
   `carlsbad-minority-attack.evidence.json` must produce **no** P4 issue. — *Failure mode: shipping
   a check that refuses its own fix, sending the queued content job into a loop. This is why P4
   matches the `provenance.` prefix and not the bare key name.*

6. **`citable_text` is in `EVIDENCE_KINDS`, and a test asserts set-equality between this RFC's
   eight-member transcription and the shipped constant.** Same for `ABSTENTION_REASONS` against
   `corpusEvidence.abstained.reason`'s enum in `schemas/drill_pack.schema.json`. — *Failure mode:
   [[D499]] — `EVIDENCE_KINDS` is a shared resource with no version and no register, so a
   hand-written second copy has nothing to drift against. **This RFC creates one such copy on
   purpose** (§5.6), and the test is the only thing holding it in step until
   `rfc/archive/shared-resource-registers.md` is implemented.*

7. **`MACHINE_LABEL_EVIDENCE_KINDS` gains exactly one entry, `provenance_note: ["citable_text"]`,
   and a test asserts `citable_text` appears under no other label.** — *Failure mode: law 8 — a
   citation admitted as backing for a corpus, engine or tablebase claim, i.e. a source dressed as a
   measurement.*

8. **The cap change touches `$defs/timingWindow.properties.note` only.**
   `$defs/objectiveGrading.assessedBy` `kind: "authored"` keeps `maxLength: 400`, and a test or
   review note records why (it is rendered to learners by
   `apps/web/src/lib/outcome-presentation.ts`; the window note is rendered nowhere). — *Failure
   mode: a blanket find-replace on `maxLength: 400` widening a learner-facing field nobody agreed
   to widen.*

9. **`make graduation-report` prints each pack's `timingWindows[].note` verbatim.** — *Failure
   mode: widening a field that still has no reader, which is [[D428]]'s defect and makes §6
   cosmetic.*

10. **`INLINE_EVIDENCE_KEYS` is exported once from `apps/server/src/pack-validation.ts` and read by
    all three sites** — `schemaIssue`, the runtime `provenance` walk, and P4. A test asserts the
    three agree. — *Failure mode: the promise-side and key-side refusals disagreeing about which
    keys are forbidden, which is this RFC's own through-line failing inside its own implementation.*

11. **`docs/drill-pack-format.md` documents `provenance.corpusEvidence`, the widened cap, and both
    vocabulary members, in the same commit** (RFC-0000 §Docs conventions). — *Failure mode: the
    canonical description of the format not describing the format.*

12. **`$defs/deviationCost` is byte-identical before and after.** — *Failure mode: §7's refusal
    drifting into a change and breaching ruling [[D126]] in the document that cites it.*

13. **The `tabiya-claims` block of §8 is present in the ruled metadata position, written by
    `shared-resource-registers`' landing**, and its two lines join exactly to the pack and
    evidence-kinds live-claim rows. — *Failure mode: a declaration or register row moving alone.*

---

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| `D1` | Populate `provenance.corpusEvidence` across all 92 packs — deciding per pack whether its state is `ledger`, `abstained` (with which `ABSTENTION_REASONS` member and detail) or `unsourced`. This is authored judgement about each pack's evidence situation, not a mechanical edit, and it is what turns P1's 92 warnings into zero. | **`OWNER`** — commissioning a content wave is an owner act | `planning/content-era/log.md` + the ledger flips, in the shipping commit (`CLAUDE.md` content-wave closeout) | |
| `D2` | Job A — the 21 `provenance.sources` string repairs that turn P4 from 20 firings to 0. Already specified and queued; this RFC neither re-specifies nor performs it. | **`planning/codex-queue.md`** §0-CONTENT | the job A shipping commit | |

Section format per `rfc/archive/rfc-lifecycle-completion.md` §3.1 (implemented). **Neither row
blocks `accepted`; both block `implemented`** — which is the distinction that section exists to
express, and the reason `feedback-delivery`'s equivalent obligation went ownerless when it was
filed as an open question instead ([[D476]]).

**Not carried as a discharge, deliberately:** the explorer census pass over the 60 `corpus_observed`
claims in 31 packs. That obligation already exists as `feedback-delivery`'s own `D1` and duplicating
it into a second document would produce two owners for one wave — the failure this section exists to
prevent. P3 makes its absence visible; it does not re-own it.

---

## Open questions

**Q1 — Which population should a pack declare?** *Deferred, permanently, and not to an RFC.*
Choosing a rating band, speed set and window is authored chess judgement (law 8;
`planning/defect-triage.md` §7b names exactly this carve-out). This RFC specifies the field,
the states and the refusals, and populates nothing. Owner-owned via `## Discharges` D1.

**Q2 — Should `corpusEvidence` become required at a later lane?** *Deferred to whichever RFC first
has a non-empty official shelf.* It cannot be answered today: 0 of 92 packs are published, so the
population that would bear the cost does not exist. P2 makes `published` the binding moment, which
is the cheapest answer available now.

**Q3 — Should `citable_text` records be re-fetched and re-hashed on a schedule?** *Deferred.* The
manifest already carries `sha256` and `etag`, and `EVIDENCE_DIGEST_STALE` already warns on pack
drift; a source-drift check is a different instrument with a network dependency, and specifying it
here would put a network call inside `make pack-check`. Named so it is not assumed shipped.

**Q4 — Does `provenance_note` need a runtime surface?** *No, and stated so it is not inferred.*
`evidenceTypes` is an authoring and validation vocabulary; nothing in this RFC renders a
`provenance_note` claim differently to a learner. [[D147]] owns the rung-4 packet gap and this
document does not touch the packet.

### Ledger rows proposed, not written

Ids through **D529** are in use. These are facts I measured that I could not find in any row;
per the brief I have not written them.

- **D533 — `cost: "unmeasurable"` grew from four deviations to seven and nothing measures the
  growth.** [[D148]] measured four (`kid-mar-del-plata-white`, `iqp-white-panov-attack`,
  `nimzo-doubled-c-pawns`, `grunfeld-exchange-fianchetto`, one each); at `451bb44` there are
  **seven in six packs** — the three additions are **two** in
  `closed-centre-chain-black-base-strike` and **one** in `london-wedge-black-counterplay`, both
  packs authored after the row was written. §7 refuses to give the field a corpus basis, which is
  correct and which makes the growth rate the only remaining signal.
- **D534 — 16 packs carry a ledger, label claims `corpus_observed`, and their ledger contains no
  explorer record of either kind.** Distinct from [[D128]]/[[D141]], which own *packs with no ledger
  at all* (they measured 15; I measure **24 of 92** at HEAD). The new shape is a ledger that exists
  and is silent on the one kind the label requires: **0 `explorer_frequency` + 0
  `explorer_position_census` records across 68 ledgers and 893 records**, against 60
  `corpus_observed` labels in 31 packs. Sharpens [[D135]]'s relabel-pressure finding from *0 of 52*
  to *0 of 60, with the backing path now built and still empty*.
- **D535 — `timingWindows[].note` has no reader anywhere in the tree.** Not in `apps/web/src`,
  `apps/server/src`, `packages/runtime/src` or `packages/schema/src`. Three authors independently
  fought its 400-character cap ([[D123]]) over a field displayed to nobody. §6 both widens it and
  gives it a reader; the row is worth having because the *class* — a constrained field with no
  consumer — is not searched for anywhere.
- **D536 — `EVIDENCE_TYPE_UNBACKED`'s ledger-bearing arm is dark on 67 of 68 ledgers.** It fires
  through `claimBindingForPointer`, which needs `ledger.claimBindings`; **1 of 68 ledgers carries
  any bindings, and it carries exactly one**. So `claim-backing`'s binding mechanism is shipped,
  wired and unexercised, and the label check that depends on it is silent almost everywhere. Same
  family as [[D113]]'s *shipped, plumbed, never authored against*.

---

## Appendix A — Row-by-row verification record

Every row assigned to this document was read at **column 1** of `design/BACKLOG.md`'s defect table
([[D419]], [[D459]] — column 3 is a disposition note, not a status) and then **verified at a named
symbol**. Rate: **8 of 8, 100%**, all at a symbol rather than a line number.

| Row | Column 1 | Verified at | Verdict |
|---|---|---|---|
| [[D124]] | 🐞 open | `$defs/provenance` — six keys, `additionalProperties: false`, no band or population key of any kind | **stands, premise refined.** The population *is* machine-representable — in `explorer_position_census.values`, URL-validated. The gap is the pack↔record binding, not a missing block. §1.2 |
| [[D157]] | 🐞 open | `content/drafts/carlsbad-minority-attack.json` read in full; no sibling `.evidence.json` | **stands; row's own update is materially false.** The row says the pack *"now carries the position census … as its first corpus fact"*. At HEAD it carries the census **as a prose string** and has **no ledger at all** |
| [[D153]] | 🐞 open | 4 window notes measured: **337 / 359 / 372 / 394** of 400 | **stands, numbers unchanged** |
| [[D123]] | 🐞 open | `$defs/timingWindow.properties.note` = `{type: string, minLength: 1, maxLength: 400}`; zero readers found in `apps/`, `packages/` | **stands, and strengthened**: the capped field is not learner-facing |
| [[D268]] | 🐞 open | `EVIDENCE_KINDS` (`sourcing/types.ts`); `linkage` / `MANIFEST_ENTRY_UNUSED` (`ledger-validation.ts`) | **stands, count stale.** Row says *"the six kinds"*; there are **seven**. None is bibliographic — the claim survives intact |
| [[D171]] | 🐞 partial | `$defs/feedbackClaim.evidenceTypes` — closed **seven**-member enum, no `provenance_note` | **stands, verbatim** |
| [[D470]] (format half) | 🐞 open | `PROVENANCE_EVIDENCE_INLINE` at both arms of `pack-validation.ts`; corpus walk | **stands**: **20 packs promise, 0 carry the key**, reproduced independently |
| [[D148]] | 🐞 open (core), headline stale | `$defs/deviationCost` — **four** arms; `explorer.ts` 100-game abstention; corpus walk | **stands as a refusal; second staleness found.** Row says four `unmeasurable` deviations; at HEAD there are **seven in six packs**. Semantic core untouched |

**Rows found already fixed: none.** All eight are live at `451bb44`; none was dropped.

**Rows found materially stale: three of eight (38%)** — D268's kind count, D148's deviation count,
and D157's claim that the exemplar now carries a census record. The third is the consequential one:
it would have led a drafter to believe the corpus had explorer evidence when it has none.

**Read at column 1 but not re-derived by me** (cited as `[row]`, and they belong to their authors):
[[D419]], [[D428]], [[D444]], [[D451]], [[D473]], [[D476]], [[D477]], [[D499]], [[D502]], [[D522]],
[[D524]], [[D526]], [[D126]] (owner ruling, quoted verbatim from the ledger), [[D128]], [[D135]],
[[D141]], [[D147]], [[D113]].

**One row I checked before citing it, and it changed what I wrote.** [[D506]] reads ⚠️ **RETRACTED
2026-08-17 — a FALSE RECORD** at column 1. An earlier version of §5.6 and criterion 6 cited it as
evidence that `EVIDENCE_KINDS` had already been duplicated into the pack schema; it has not been,
and citing a retracted row as live evidence is the *"closure citing a ruling that says the
opposite"* failure this repo hit twice in one day. Both passages now cite [[D499]] for the standing
defect and quote D506's **retraction note** for what survives it — that the duplication it forecast
becomes real the moment an RFC transcribes the vocabulary, which is what §5.6 does.

**Register facts re-verified myself at HEAD `451bb44`**, not taken from any register:
`DRILL_PACK_SCHEMA_VERSION = "0.27"` and `$id …drill-pack:0.27`; `…drill-run:0.17`;
`…shape-entry:0.3`; `…principle-entry:0.1`; `STORAGE_VERSION = 23`. `rfc/README.md` records 0.28
held by `graduation-clearance` and 0.29 next free — **and its Active row for that RFC reads
`accepted 2026-08-17`, third round, while its pack-lane register row still reads *"a draft returned
to author 2026-08-16"***. That is [[D477]]'s body-vs-register class, live at HEAD, in the register
this document claims into. Reported, not fixed — it is not this RFC's file to edit.

---

## Appendix B — What RFC-6 (`shape-layer-parity`) inherits

RFC-6 claims a pack lane **behind** this one plus shape-entry 0.5
(`planning/rfc-drafting-queue.md` §2.6). What travels:

1. **The lane arithmetic.** Pack **0.30** is RFC-6's next free lane once 0.29 lands. Under
   `rfc/archive/shared-resource-registers.md` §4 the next-free value is computed and printed by
   `make register-check`, never stored, so nothing needs hand-editing.
2. **[[D103]]'s remedy shape, already decided here.** *A shape entry has nowhere to record why its
   trigger says what it says* is [[D123]]/[[D153]] one schema over. The drafting queue kept them
   apart because they claim different lanes — correctly — but the **rule** travels: §6 settles that
   an author-facing justification field is bounded at **2000**, is not rendered to learners, and
   earns its place by acquiring a reviewer-facing reader. RFC-6's `triggerNote` should be authored
   to that precedent rather than re-deciding it, and should say so.
3. **The don't-copy refusal (§1.2), which RFC-6 faces in a sharper form.** This RFC refuses a
   pack-side population field because the population already has a single validated writer.
   `$defs/structuralExpression` is **duplicated** across `schemas/drill_pack.schema.json` and
   `schemas/shape_entry.schema.json`, so RFC-6's `shape_trigger` leaf is copy two *by construction*.
   It must either adopt this document's answer — point at the single writer and check the pointer —
   or refuse it explicitly and say what keeps the two grammars in step. §5.6's set-equality test is
   the cheap version of that mechanism.
4. **The non-vacuity discipline of §5.** Every predicate states its HEAD firing count and carries a
   positive **and** a negative fixture. RFC-6 is predicate-heavy — a new expression leaf, plus the
   `STRUCTURAL_CONDITION_HAS_NO_FEATURE` interaction at `apps/server/src/pack-orchestrator.ts` —
   and [[D522]] fired on a document one round from acceptance.

**What RFC-6 does *not* inherit, stated so it is not assumed.** `provenance.corpusEvidence` is a
**pack** key. `schemas/shape_entry.schema.json` is `additionalProperties: false` at its root and
carries its own `$defs/provenance`; it gains nothing from this RFC. If a shape entry needs to
declare a corpus-evidence state, that is RFC-6's claim to make and its lane to spend.

---

## Changelog

- 2026-08-17: created. Claims pack schema 0.29 and the `citable_text` member of `EVIDENCE_KINDS`.
  Discharges D124, D157, D153, D123, D268, D171, D470 (format half) and D148 (as a recorded
  refusal). All eight verified at a named symbol at `451bb44`; three found materially stale, none
  found fixed. Refuses a pack-side population field, a prose-scanning population check, D123's
  `rationale` sibling, and a corpus basis for `deviationCost`. Carries a `tabiya-claims` block at
  landing rather than now, on law-1 grounds, per `graduation-clearance`'s ruling.
