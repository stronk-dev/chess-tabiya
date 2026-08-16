# RFC: Graduation clearance — how a blocker stops blocking

- **Status:** draft — **cross-reviewed 2026-08-16, RETURNED TO AUTHOR.** The core is sound and the
  0.28 lane is kept (§7). Blocking corrections landed in the body by the reviewer: the **3-pack
  "graduates on instrument runs alone" claim is refuted** (§5.2 — the honest number is **0**, and
  `make graduation-report` will still print `(none)` after this lands); the **demotion gate is not
  wired** to either the register or the report (§2.3, §6.3); the **acceptance citation is weaker
  than §3 assumes** and does admit an author-written ruling (§3.2a); and the **254-claim figure was
  a citation count, not a claim count** — the corpus has **196** claims (§1.2). Two open questions
  gained measured answers (OQ4, OQ5) and one gained a new one (OQ6)
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-16
- **Cross-review:** 2026-08-16 by a second agent; every figure below re-derived at HEAD rather than
  re-read. Corrections are marked **[cross-review]** in place
- **Design refs:** `design/03-product-breadth.md` B6 (Create → validated fixture, publication
  channels); `design/04-content-architecture.md` §2d/§7 (the grounding obligations the blocker
  entries record); `design/02-product-shape.md` §Deployment axis (hosted multi-user, settled
  2026-08-12) — which is what makes an empty production catalogue a defect rather than a curiosity
- **Exploration gate:** the breadth gates are complete (`planning/exploration/gates.md` §Breadth
  gates — *"B1–B11 all green, content era open"*). Opened by `design/BACKLOG.md` row **D138**, as
  sharpened 2026-08-16 by running `make graduation-report`: *"the corpus is authored, the mechanism
  exists, and the bridge between them is undefined — so this is not a content backlog, it is a
  missing clearance vocabulary."*
- **Depends on:** nothing unlanded. `rfc/archive/pack-graduation.md` (pack **0.27**, implemented
  2026-08-16) and `rfc/archive/claim-backing.md` (pack **0.26**, `claimBindings`) are both landed
  prerequisites.
- **Parent / amends:** **completes `rfc/archive/pack-graduation.md`.** That RFC shipped the state
  machine, the gate predicate, the report and the migration, and shipped `clearedBy` as *"optional,
  free text"* (§1). This RFC gives `clearedBy` a grammar and makes it required. It amends nothing
  that RFC decided; it specifies the one thing it deliberately left unspecified.
- **Supersedes / superseded by:** —
- **Planning:** `planning/graduation-clearance/` (once implementing)

## Summary

`make graduation-report` reads **documents 56, blocking 220, resolved 30, accepted 43** over
`content/drafts/` and ends **"Graduable drafts and packs: (none)"** `[V]`. Zero of fifty authored
packs can reach `content/packs/`, and `content/packs/` is the only root a production image contains.
The reason is uniform and is one line of the report: **every blocking entry ends `clears via
(unspecified)`**, because `clearedBy` is an optional free-text string and **0 of 293 entries in
`content/drafts/` and 0 of 143 in `content/candidates/` carry one** `[V]`. There is no vocabulary
for *how* a blocker clears, so no entry can ever move from `blocking` to `resolved` or `accepted`
by any route a machine can check.

This RFC specifies that vocabulary as a required **`clearance`** object on every `blocking` entry:
a closed `kind`, a JSON pointer naming what the entry is a claim *about*, and — for the mechanical
kinds — the exact shipped predicate that decides it. It then draws the line the whole gate rests
on: **`resolved` is a standing predicate a checker re-evaluates on every run; `accepted` is a
citation to a decision recorded elsewhere. Neither is ever an author's sentence about their own
pack.** That distinction is not hypothetical repair — it has already collapsed. **All 30 `resolved`
entries in the corpus carry one byte-identical `resolved.by`**: *"The recorded work was completed;
the original statement remains as history."* `[V]` The state that is supposed to mean *the
condition is gone and is checkable* currently carries a migration placeholder and nothing else.

Measured: **4 entries clear today with no new work** (three mates packs and
`philidor-passive-rook-convert` each say *"The Syzygy root assessment is declared but not
ledger-verified; no sourcing sidecars were produced"* while carrying 25–27 `tablebase_result`
records and passing `sourcing-check` at **strict**) `[V]`; **108 of 220 name an output a shipped
instrument produces** and become machine-decidable; and **47 of 50 authored packs carry at least
one blocker no instrument in this repository can ever clear** — 23 of them blocked on an instrument
that does not exist, 24 on chess judgement a human must author and law 8 forbids manufacturing.
This RFC says so with a number rather than implying a backlog.

**[cross-review] And the number is worse than the draft's, in the direction the draft was already
arguing for.** The draft named three packs — `anti-french-advance-white`, `kid-classical-black`,
`leningrad-dutch-black` — that "graduate on instrument runs alone". Re-derived entry by entry
against the shipped instruments, **none of the three does** (§5.2): each carries at least one
blocker resting on an `author_principle`/`hypothesis` claim, and `attachExplorerEvidence` refuses
to write pack prose (`ATTACH_SPAN_REQUIRED`) and refuses to run at all on a pack whose
`provenance.sources` lacks the explorer rationale line (`ATTACH_SOURCE_LINE_MISSING`) — which **all
three lack** `[V]`. So the honest headline is **0 of 50 packs graduate on instrument runs alone,
50 of 50 need new authoring**, and the graduable set stays `(none)` through this RFC's landing.
That does not weaken the case for the vocabulary; it is the case for it. A vocabulary whose first
run prints an unchanged `(none)` while making 180 entries individually decidable is doing exactly
the job §5.2 says it is: *making the distance measurable rather than shortening it.*

## Motivation

### §0.1 The measurement, reproduced

Run at HEAD, not re-read:

```
## content/drafts
documents: 56; legacy: 0; blocking: 220; resolved: 30; accepted: 43
## content/candidates
documents: 36; legacy: 0; blocking: 143; resolved: 0; accepted: 0
## content/packs
documents: 0; legacy: 0; blocking: 0; resolved: 0; accepted: 0
## Graduable drafts and packs
(none)
```

`[V]`. `PackRegistry.loadDefault` builds `productionPaths` as
`[schemas/drill_pack.example.json, ...jsonFiles(content/packs/)]` and loads `content/drafts/` only
when `options.development === true`; `.dockerignore` excludes `content/drafts` and
`tools/verify-packaging.mjs` asserts it does (`rfc/archive/pack-graduation.md` §0.1, re-verified —
`content/packs/` holds only `.gitkeep` at HEAD `[V]`). So the graduable set being empty is
identically the statement that **nothing this product has authored can reach a non-development
registry.**

**[cross-review] Corpus-size reconciliation, because four cited ledger rows quote the old figures
and a reader will otherwise think one of us is wrong.** **D138** and **D162** say *"47 authored
packs"*; **D227** says *"53 pack documents"*; this RFC says **50** and **56**. Both are right at
their own dates: three drafts landed between them (`closed-centre-chain-black-base-strike`,
`london-wedge-black-counterplay`, `open-centre-french-exchange-black`), so 47 + 3 = 50 and
53 + 3 = 56 `[V]`. The 50 is no longer a quoted convention: `runExpressionCensus` computes it as
`totals.packs` and the six browser fixtures as `corpus.fixturePacks` `[V]` — which is precisely
what **D257** asked for (*"the corpus figure the whole project quotes … is computed by no code, so
no test can ever assert it"*). **This RFC's counts are the computed ones and supersede the quoted
ones**; every figure below is a run at HEAD.

Every one of the 220 blocking lines the report prints ends the same way:

```
  - **no-engine-validation-pass-has-been-run-on-any-position-i** — No engine validation pass
    has been run on any position in this pack.; clears via (unspecified)
```

That suffix is `graduation-report.ts:39` — `` `clears via ${entry.clearedBy ?? "(unspecified)"}` ``
`[V]`. It is not a rendering defect. Counted directly over the corpus: **0 of 293
`graduationBlockers` entries under `content/drafts/` carry a `clearedBy` key at all**, and the same
holds for all 143 under `content/candidates/` `[V]`. The field exists, is printed, and is empty
everywhere.

### §0.2 `pack-graduation` specified the slot and declined to specify its grammar — deliberately, and this is the half it left

**This RFC does not correct `pack-graduation`, and the check that matters is that it did not
descope this.** That RFC's §0.3 scopes out *"(a) doing any of the grounding work the blockers
record — this RFC makes the debt legible and countable, it does not pay it"*. Paying debt is out of
scope here too (§0.3). But **specifying what payment looks like is not paying it**, and it is the
missing half of *legible*: a debt whose discharge condition is unstated is not legible, it is only
counted.

The archived RFC's own cross-review diagnosed the gap in one sentence and then fixed the smaller
half of it:

> **`clearedBy` is never resolved and never printed, so it cannot be audited either way.** It is
> free text (§1), it does not touch the gate predicate (§2), and §3.3's report prints only `id` +
> `statement` for blocking entries — so a `clearedBy` naming an RFC that does not exist, or one
> whose named section landed months ago, is invisible.
> — `rfc/archive/pack-graduation.md` §1.1

Both of that paragraph's remedies shipped: the report prints `clearedBy`
(`graduation-report.ts:39`), and `GRADUATION_CLEAREDBY_UNRESOLVED` fires at **warning** when a
`clearedBy` string contains a repo-path-shaped token that does not exist on disk
(`apps/server/src/pack-validation.ts:860–863`) `[V]`. Neither remedy makes the field *required* or
*typed*, and the lint's guard clause is `if (row.state === "blocking" && typeof row.clearedBy ===
"string")` — so with zero strings in the corpus, **the only lint guarding clearance fires zero
times** `[V]`. The pointer was made auditable and then nobody was obliged to write one.

The consequence, stated as the gate sees it. `PackStudio.register` refuses on
`blockers.some(graduationEntryIsBlocking)` with `GRADUATION_BLOCKERS_OUTSTANDING`
(`apps/server/src/pack-studio.ts:122`) `[V]`, and
`GRADUATION_BLOCKING_ON_PUBLISHED` raises at error on any `published` document with a blocking
entry (`pack-validation.ts:873`) `[V]`. Both gates are correct and both work. **They are unmeetable
not because the corpus is unready but because the corpus has no expressible way to become ready.**

### §0.3 The second defect: `resolved` has already become a rubber stamp, measured

`rfc/archive/pack-graduation.md` §1.1 defines the three states as *blocking* (outstanding work),
*resolved* (was blocking; the work was done, kept for the record), and *accepted* (a permanent
condition the product has decided to live with), and requires `resolved.at` + `resolved.by`.

**[cross-review] That requirement is enforced by the schema, not by the lint this draft named.**
`$defs/graduationEntry.resolved` carries `required: ["at", "by"]` with `by` as `nonEmptyString` and
`additionalProperties: false` `[V]`, and that is the whole of the enforcement. The codes
`GRADUATION_RESOLVED_WITHOUT_RESOLUTION` and `GRADUATION_ACCEPTED_WITHOUT_RULING` were **specified
by `pack-graduation` §6 and do not exist anywhere in the tree** — a sweep for `GRADUATION_[A-Z_]*`
over `apps/`, `packages/`, `schemas/`, `content/` and `tools/` returns exactly seven codes:
`GRADUATION_BLOCKERS_OUTSTANDING`, `GRADUATION_RULING_UNCITED`, `GRADUATION_REQUIRES_SOURCES`,
`GRADUATION_ENTRY_LEGACY_SHAPE`, `GRADUATION_ID_DUPLICATE`, `GRADUATION_CLEAREDBY_UNRESOLVED` and
`GRADUATION_BLOCKING_ON_PUBLISHED` `[V]`. Nothing in the argument below turns on which layer
enforces it — schema-required and blank-checked is exactly as strong here — but an RFC that cites a
lint by name must have run the grep, and **two of `pack-graduation`'s specified codes did not
land**, which is a flow-back finding in its own right (**D416**, §Ledger rows).

Grouped over the 30 `resolved` entries in `content/drafts/` at HEAD, the distinct values of
`resolved.by` are:

| `resolved.by` | count |
|---|---|
| `The recorded work was completed; the original statement remains as history.` | **30** |

`[V]`. One string, thirty times, including on entries whose statements describe entirely different
work. `resolved.at` carries a date. Nothing else. So the state that §1.1 defines as *the work was
done* records, in every instance in the corpus, that **someone typed that the work was done**.

This is exactly as strong as `accepted` was before its own cross-review — the RFC's §1.2 correction
2 found that *"`accepted` IS reachable by assertion as drafted"* and fixed it with a required
`accepted.rulingRef` that must resolve. That fix shipped, and it worked: all 43 `accepted` entries
carry a resolving reference (**40 `owner_ruling` → `planning/exploration/log.md#L1231`, 3
`permanent_property` → `docs/tablebase-grounding.md`, 0 `out_of_scope`**) `[V]`, and
`GRADUATION_RULING_UNCITED` checks path existence, the `#L<line>` grammar, and — for
`owner_ruling` — date containment (`pack-validation.ts:840–858`) `[V]`.

**The same argument was never applied to `resolved`, and `resolved` is the state that will do all
the work.** There are 43 acceptances and there will be a few hundred resolutions; guarding the rare
state and leaving the common one on an author's word inverts the priority. **Getting this wrong
turns graduation into a rubber stamp, and the corpus shows the stamp already exists.**

### §0.4 The third defect, small and diagnostic: a permanent refusal filed as outstanding work

Five of the six `*.browser.json` test fixtures in `content/drafts/` carry exactly one `blocking`
entry, and each is a permanent refusal `[V]`:

| fixture | statement |
|---|---|
| `immediate-guard.browser.json` | Testing fixture only; do not publish as authored chess content. |
| `outcome-hold.browser.json` | Test-only fixture; never publish as chess content. |
| `outcome-resist.browser.json` | Test-only fixture; never publish as chess content. |
| `stated-reasoning.browser.json` | Testing fixture only; do not publish as chess instruction. |
| `trajectory-legs.browser.json` | Mechanical acceptance fixture only; it asserts no chess phase truth. |

*"Never publish"* is not outstanding work anybody can do. It is the definition of
`accepted` / `kind: "out_of_scope"` — the one `kind` with **zero** corpus instances `[V]`. This is
the identical defect `pack-graduation` §0.2 found for the 37 no-review-workflow entries (*"a
permanent accepted condition is sitting in a field for debts"*), surviving its own migration in a
population Stage B did not read. It is small — 5 entries — and it is diagnostic, because it shows
the migration's default-to-`blocking` rule (§4.1, correct) leaves permanent conditions parked in
the wrong state until something obliges an author to state a route.

The sixth fixture, `line-boundary.browser.json`, carries **zero** blocking entries and is kept out
of the graduable set by `!file.endsWith(".browser.json")` in `graduation-report.ts:25` `[V]`. The
report is right to exclude it; a filename suffix is a thin thing for that to rest on when
`runExpressionCensus` already computes `corpus.fixturePacks` naming all six `[V]`.

### §0.5 Scope boundary

**In scope:** the grammar of `clearedBy` and its replacement by a typed `clearance` object; the
closed kind taxonomy and what predicate decides each kind; the `resolved`/`accepted` rule and the
demotion behaviour that makes it real; the authorization rule for `accepted` that does not require
a reviewer; the schema, lints, and report changes; and an honest count of what cannot clear.

**Out of scope, explicitly:**

- **(a) Doing the grounding work.** No engine pass, no explorer wave, no citation pass, no shape
  authoring lands here. `pack-graduation` §0.3(a) drew this line and it holds.
- **(b) Curating a subset of packs for promotion.** Refused by the owner at D162 and still refused.
- **(c) Reintroducing a pack review workflow** — see §3.
- **(d) Changing what `reviewStatus: "published"` means for severity.** `sourcing/check.ts`'s
  escalation of `EVIDENCE_TYPE_UNBACKED` and `DEVIATION_COST_UNBACKED` is untouched.
- **(e) The candidate→draft promotion path.** `content/candidates/` is inside the schema and is not
  a graduation subject (`pack-graduation` §0.3, open question 6, ruled). Its 143 entries take the
  emitter template's clearance (§6.3) because the schema reaches them; nothing here promotes one.
- **(f) `content/accepted-conditions.md`'s existence** — it is committed and byte-checked today and
  this RFC only adds rows to what it can contain.

## Specification

### §1 Clearance is a predicate, not a sentence

Every `blocking` entry carries a required **`clearance`** object. It replaces `clearedBy`, which is
withdrawn (§6.2 states the migration).

```jsonc
{
  "id": "syzygy-root-unverified",
  "state": "blocking",
  "statement": "The Syzygy root assessment is declared but not ledger-verified; no sourcing sidecars were produced.",
  "clearance": {
    "kind": "assessment_grounded",          // required, closed enum (§1.2)
    "subject": "/objective/grading/assessedBy",  // required, JSON pointer into this pack
    "instrument": "make verify-draft"       // required for mechanical kinds; the command that produces the evidence
  }
}
```

Three fields, each doing one job:

- **`kind`** names *which predicate decides this entry*. Closed enum; §1.2 is the whole vocabulary.
- **`subject`** is a JSON pointer into **this pack document**, naming what the entry is a claim
  about. A blocker with no subject is a blocker nobody can check, because "this pack is ungrounded"
  has no discharge condition. Required for every kind including `unreachable`.
- **`instrument`** is the shipped command that produces the evidence. Required for the mechanical
  kinds (§1.2 rows A–E), forbidden for `unreachable` and `unbuilt`, which have none.
- **`blockedBy`** (required for `unbuilt` only) is a repo-relative path to the RFC or the
  `design/BACKLOG.md` row that owns the missing instrument.

**The rule that makes this cheap rather than ceremonial:** the author writes the `kind` and the
`subject`; **the author never writes whether it is cleared.** A checker derives that (§2.3). An
author asserting clearance is exactly the thing §0.3 measured going wrong.

#### §1.1 What a clearance is not

- It is not a promise. `clearance` states the *shape* of the discharge condition, not that anyone
  intends to satisfy it.
- It is not a schedule. `pack-graduation` §1.1 refused a fourth state for *deferred / blocked on
  unlanded work* — *"'we are waiting on someone else' is the single most reusable sentence in
  software"* — and that refusal stands. `unbuilt` is a **`kind`, not a state**: an entry whose
  clearance is `unbuilt` is `blocking`, counts against the gate, and stops the pack graduating. All
  it adds is the name of what would have to exist, so that the count of *blocked on unlanded work*
  is a number rather than an impression.
- It is not a grade, a verdict, or a chess claim. A clearance names an instrument and a pointer;
  it never says a move is good. Law 8.

#### §1.2 The clearance kinds

Seven kinds, closed. The corpus population column is this RFC's hand audit over the 220 blocking
entries in `content/drafts/` — **classified by an ordered first-match keyword ruleset**, stated in
§5.1 with its residue, and **labelled a hand audit rather than a measurement** because
`pack-graduation` §4.3 established, on this same corpus, that *"a status recorded in prose cannot
be migrated mechanically."* The right-hand columns are shipped facts and are `[V]`.

| # | `kind` | Cleared when | Deciding predicate (shipped) | Corpus |
|---|---|---|---|---|
| A | `assessment_grounded` | `objective.grading.assessedBy` resolves against the pack's ledger | `assessmentGrounding(...)` returns `"ledger_verified"` (`apps/server/src/sourcing/ledger-validation.ts:423`) `[V]` | 6 |
| B | `ledger_record` | a record of a named `kind`, anchored to a named FEN, exists in the pack's `.evidence.json` and validates | `checkSourcingFile` over the pack. **Note the asymmetry:** the 32 committed ledgers hold only `position_legality` (32), `engine_eval` (391) and `tablebase_result` (341); `explorer_position_census` is a supported kind (`apps/server/src/sourcing/claim-binding.ts:93`) with **zero committed instances** `[V]` | 38 (engine) + 40 (corpus) |
| C | `claim_bound` | a `claimBindings` entry binds `subject` to a source with a matching text digest | `validateClaimBindings` (`apps/server/src/sourcing/claim-binding.ts:174`); `runExpressionCensus` reports `backing.backedClaims` per claim `[V]` | 52 |
| D | `shape_firing` | a named shape entry's trigger fires on at least one of this pack's positions | `runExpressionCensus` / `checkShapeFile`; the negative is already a code — `SHAPE_TRIGGER_NEVER_FIRES_IN_CORPUS` (`apps/server/src/shape-check.ts:13`) `[V]` | 24 |
| E | `pointer_authored` | the text at `subject` no longer matches the stated placeholder predicate | string comparison at `subject` against `clearance.placeholder` | 20 |
| F | `unbuilt` | **never here.** The instrument does not exist; `blockedBy` names who owns it | none — `blockedBy` path must resolve, reusing `GRADUATION_CLEAREDBY_UNRESOLVED` | 28 |
| G | `unreachable` | **never.** Neither a source nor an instrument can ever reach it; the entry is a candidate for `accepted` (§3) | none — the *unreachability* is what carries a citation | 12 residue, **of which 5 are the browser fixtures of §0.4** |

**[cross-review] The taxonomy is total over the real corpus, and the arithmetic is the proof:**
6 + (38 + 40) + 52 + 24 + 20 + 28 + 12 = **220**, the exact blocking population of `content/drafts/`
`[V]`. The draft's G cell read *"12 residue + 5 fixtures"*, which double-counted the five fixture
entries — they match no keyword rule and are therefore **inside** the 12, not beside it — and made
the column sum to 225 over a 220-entry population. Corrected above. Every blocking entry lands in
exactly one kind; there is no eighth bucket and no entry outside the seven.

Two things about this table are the design and must not be softened.

**First: F and G are different, and conflating them is how a backlog becomes a permanent
exemption.** `unbuilt` says *the instrument does not exist yet and someone owns building it* — it
keeps the pack out of `content/packs/` and its `blockedBy` is a live pointer. `unreachable` says
*no instrument can ever exist for this, by a property of the world* — and only that second one may
ever become `accepted`. A pack blocked on `perfect_tablebase` opponent selection is `unbuilt`
(three entries; `pack-graduation` §1.1's substitution population). A pack sitting at eleven pieces
where no tablebase applies is `unreachable` (`planning/content-era/plan.md` §3b: *"some assertions
are unreachable by material, not by effort"*). The keyword that separates them is not in the prose;
the author must choose, and the choice is auditable because §3 makes the second one cost a
citation.

**Second: C is the largest class and the one where the instrument sees least.** `runExpressionCensus`
over the corpus at HEAD reports **196 `feedbackClaims` across 50 authored packs, and exactly 1
backed claim** `[V]` — `totals.claims: 196`, `totals.backedClaims: 1`. **[cross-review] The draft
said 254, which is a different quantity.** 254 is the sum of `totals.byRung[].claims`, and a claim
carrying two `evidenceTypes` is counted once per type there (`expression-census.ts:123` sums
per-citation, `:130` sums per-pack) `[V]`; it is the **citation** count, not the claim count. The
254 splits as `author_principle` 82 / `corpus_observed` 60 / `derived_feature` 43 /
`tablebase_exact` 37 / `hypothesis` 24 / `engine_validated` 8, and that split is correct **as a
split of citations**. The ratio the argument needs is **1 backed of 196 claims**, and it is the
figure `design/BACKLOG.md` **D403** already carries — so the draft's own ledger neighbourhood had
the right number and this RFC quoted the wrong one. Direction unchanged; precision restored, and
§5.1's own standard (*"the only numbers in this RFC quoted to the unit are the ones a command
printed"*) requires it, because the command printed both and they mean different things.
The ledger row **D267** measured the consequence directly:
running `checkSourcingFile` before and after a 22-pack citation pass gave **32 of 47 clean at draft
severity and 4 of 47 at published severity, before and after** — *"no instrument in this repo can
see a citation."* `claimBindings` (landed at pack **0.26**) is the mechanism that changes that, and
it is used by **1 of 32 ledgers** `[V]`. So `claim_bound` is a real predicate over a nearly-unused
mechanism, and §5.3 prices that honestly rather than counting 52 entries as cheap.

#### §1.3 What `claim_bound` checks, and what it refuses to check

`claim_bound` clears when a source *is attached and bound to the named claim* — path resolves,
`claimId` matches, `textSha256` matches the prose it binds. **It never checks that the source
supports the claim.** No lint can read a Wikibooks page and agree with a sentence about the
Carlsbad structure. This RFC states the limit in the specification rather than in a footnote,
because a reader who believes `claim_bound` means *verified* has learned the wrong thing from a
green check.

The honest reading is `planning/content-era/plan.md` §3b's, adopted verbatim: a claim needs *"a
citable source … or engine/corpus/tablebase validation that actually bears on the claim."*
`claim_bound` mechanizes **attachment**, which is the half a machine owns. Whether the source bears
on the claim is an authored judgement, and §3 rules who may make it — the answer is nobody, and
that is why `claim_bound` clears on attachment rather than on agreement.

#### §1.4 [cross-review] What no lint ties together — the residue of author discretion, stated

§1.3's honesty about `claim_bound` is right and **is not special to `claim_bound`.** The same gap
runs through the whole vocabulary and the draft did not generalize it, so a reader takes §2.1's
*"neither is ever an author's sentence about their own pack"* as stronger than the mechanism
delivers. Three specific residues, each real and each **acceptable if written down**:

1. **Nothing ties `clearance` to `statement`.** `GRADUATION_CLEARANCE_SUBJECT_UNRESOLVED` checks
   that the pointer resolves; no lint in §6.3 checks that the thing it points at is what the
   statement is about. An author may file a `no engine pass has been run` blocker with
   `kind: "assessment_grounded"`, `subject: "/objective/grading/assessedBy"` — a predicate that
   already holds on four packs today — and the entry resolves on the checker's first run without
   an engine ever running. **The clearance is machine-decided; which predicate applies stays an
   author's sentence.** This is the honest form of §2.1's rule and it must be stated that way.
2. **`subject: "/"` satisfies the pattern.** `^/` matches the document root, so *"this pack is
   ungrounded"* — the very shape §1 refuses as *"a blocker nobody can check"* — is expressible with
   a resolving subject. Open question 4's own fallback proposes the pack root as a subject, so the
   escape hatch is already in the draft's text. **Fix (normative):** `clearance.subject` must be a
   pointer of depth ≥ 1 — `"^/[^/]"`, not `"^/"` — and `GRADUATION_CLEARANCE_SUBJECT_UNRESOLVED`
   raises on the bare root. Cheap, closes the hole, costs the honest case nothing.
3. **Kind E's author writes the predicate's input.** `pointer_authored` compares the text at
   `subject` against `clearance.placeholder` — and the **author supplies `placeholder`**. An author
   who writes a `placeholder` the text already fails to match has authored a predicate that holds
   on arrival. §4.3 calls E *"the weakest predicate in the vocabulary"*; that is the reason, and it
   is sharper than *"a string comparison cannot prove what replaced it is true."* **Fix
   (normative):** `placeholder` is **required** when `kind` is `pointer_authored` — the draft's §1
   field list omits it entirely and §6.3 has no lint for it, so 20 entries could carry a kind whose
   predicate has no input — and the migration's Stage A must take each `placeholder` **from the
   emitter template or the committed text at landing**, never from a later author's choice. Code:
   `GRADUATION_CLEARANCE_PLACEHOLDER_MISSING` (error).

Residues 2 and 3 are closed by the fixes above. Residue 1 is not closable by a lint — matching a
prose statement to a predicate is the same judgement §1.3 refuses to mechanize — and is therefore
**stated as a limit of the vocabulary rather than patched**. What the vocabulary buys against it is
still decisive: a mismatched kind is **visible in a diff as one word**, where today the same
dishonesty is a paragraph of prose nobody re-reads.

### §2 `resolved` versus `accepted` — the rule

#### §2.1 The rule

> **`resolved` is a standing predicate a checker re-evaluates on every run. `accepted` is a
> citation to a decision already recorded outside the pack. Neither is ever an author's sentence
> about their own pack.**

| | `resolved` | `accepted` |
|---|---|---|
| What it asserts | the condition is **gone** | the condition **stands**, and shipping anyway was decided |
| Who decides | a shipped predicate, on every run | a dated ruling in the living tier, cited by path |
| Can it become false? | **yes** — and it demotes itself (§2.3) | no; a ruling is not falsified by a pack changing |
| Required companion | `resolved.by` is the **clearance the entry carried**, plus the instrument output | `accepted.kind` + `ruling` + `rulingRef` (shipped) |
| Author's free text | none that the state depends on | the quoted ruling, which the lint date-checks |
| Failure mode it prevents | a debt retired by assertion | a debt retired by a shrug |

The asymmetry is deliberate and it is the same one `pack-graduation` §4.4 built the migration on:
misclassifying a real debt as cleared graduates a pack that should not graduate; misclassifying a
cleared debt as blocking delays a pack that should. The first is a product failure; the second is
an inconvenience.

#### §2.2 `resolved.by` stops being prose

`resolved` gains a required `resolved.clearance`: **the same object the entry carried while
blocking**, unchanged, plus the instrument output that satisfied it.

```jsonc
{
  "id": "syzygy-root-unverified",
  "state": "resolved",
  "statement": "The Syzygy root assessment is declared but not ledger-verified; no sourcing sidecars were produced.",
  "resolved": {
    "at": "2026-08-16",
    "clearance": { "kind": "assessment_grounded", "subject": "/objective/grading/assessedBy", "instrument": "make verify-draft" },
    "by": "assessmentGrounding = ledger_verified; content/drafts/mate-k-q-technique.evidence.json holds 27 tablebase_result records"
  }
}
```

`resolved.by` stays required and stays free text — it is the *human-readable* record — but it is no
longer load-bearing. **The state is decided by `resolved.clearance`, which the checker re-runs.**
That is what makes a `resolved` entry different in kind from an `accepted` one rather than
different only in wording, and it is what the 30 identical boilerplate strings prove is needed.

`GRADUATION_RESOLVED_WITHOUT_CLEARANCE` (error) fires on a `resolved` entry with no
`resolved.clearance`, or one whose `clearance.kind` is `unbuilt` or `unreachable` — those two kinds
have no predicate and therefore cannot resolve, only be accepted or stay blocking.

#### §2.3 A `resolved` entry that stops re-deriving demotes itself

`checkSourcingFile` gains a graduation pass: for every `resolved` entry, re-evaluate
`resolved.clearance`. If the predicate no longer holds, raise
**`GRADUATION_RESOLUTION_STALE`** — at **warning** in `content/drafts/`, at **error** in
`content/packs/`, and the gate predicate treats the entry as `blocking`.

This is the whole content of *"resolved means the condition is gone and is checkable"*. A
resolution that cannot be re-derived is an assertion with a date on it, which is what the corpus
has 30 of today. It costs nothing to add now: the predicates are already shipped, and the
`content/packs/` strict sweep `pack-graduation` §5.1 landed is already free because the directory
is empty (**D237** — *"a gate added before its first subject is free and uncontested"*).

**Symmetrically, `accepted` never demotes**, and this is not an oversight. A ruling is a fact about
a decision, not about a pack; nothing an author does to a pack can falsify it. What *is* re-checked
on every run is that the citation still resolves — `GRADUATION_RULING_UNCITED` already does exactly
that, at error `[V]`.

##### §2.3a [cross-review] *"and the gate predicate treats the entry as `blocking`"* is the sentence this RFC has to earn, and as drafted it does not

**This was the largest hole in the draft and it is a wiring hole, not a reasoning one.** The rule
is right; the mechanism as specified cannot reach either consumer. Three shipped facts, all `[V]`:

1. **The gate predicate is a pure state read.** `graduationEntryIsBlocking`
   (`pack-validation.ts:154–158`) is `return (value as Record<string, unknown>).state === "blocking"`
   — synchronous, one entry, `unknown` in, no ledger, no filesystem, no `await`. It is the predicate
   `PackStudio.register` calls (`pack-studio.ts:122`) and the one `GRADUATION_BLOCKING_ON_PUBLISHED`
   calls (`pack-validation.ts:872`). **A `GRADUATION_RESOLUTION_STALE` raised inside
   `checkSourcingFile` cannot change what it returns.**
2. **The report does not consult a checker either.** `graduation-report.ts` imports only
   `node:fs`/`node:path` and reads `entry.state` directly (`:24`, `:39`). Its graduable set is
   *"zero entries whose `state` is `blocking`"* and nothing else. §6.4's *"the checker's verdict —
   `holds` / `does not hold` / `no predicate`"* therefore **is** a new sweep, contradicting §6.3's
   *"adds a predicate to a sweep that already runs and adds no new sweep."*
3. **`checkSourcingFile` is filesystem-and-async and `PackStudio.register` is neither.**
   `checkSourcingFile(file: string): Promise<SourcingCheckResult>` (`sourcing/check.ts:416`) resolves
   `<stem>.evidence.json` and `<stem>.sources.json` next to a **file on disk**. `PackStudio.register`
   runs synchronously over a document read from `pack_drafts.document_json` — a stored draft **has
   no sidecar at all**. So on the studio route there is no ledger to re-derive against, and none can
   be conjured without the storage change §7 correctly refuses to make.

**What follows, stated as the specification rather than left to the implementer.** The consequence
is that the answer to *"can a determined author still satisfy `resolved` by assertion?"* is **yes,
on the studio route, and this RFC must say so rather than imply otherwise:**

- **Corpus route (`content/drafts/`, `content/packs/`, `make verify`, `make graduation-report`):
  fully closed.** The ledger is on disk beside the pack. `checkSourcingFile` gains the graduation
  pass, **and `graduation-report.ts` gains a `--verify` mode that calls it** and treats a
  `GRADUATION_RESOLUTION_STALE` entry as `blocking` when computing the graduable set. The
  re-derivation is a **report-and-sweep** obligation, not a `graduationEntryIsBlocking` obligation:
  that function keeps its signature and its pure-state semantics, because widening it to async
  ledger-reading would push a filesystem dependency into the request path of every pack validation.
  §6.4's two new header lines and the per-entry verdict come from this mode.
- **Studio route (`PackStudio.register`): open by construction, and bounded instead of closed.** A
  stored draft can carry a `resolved` entry whose predicate has never been re-derived, and register
  will accept it, because the gate sees only `state`. The bound is that the pack lands in
  `registered_packs`, **not** in `content/packs/`, and `content/packs/` is the only root a
  production image contains (§0.1) — so the studio route cannot reach the official catalogue, which
  is the population this RFC exists to unblock. **Naming this is not a concession; hiding it would
  have been the defect.** Closing it needs a sidecar concept for stored drafts, which is a storage
  change, a `STORAGE_VERSION` bump, and a different RFC. Filed as **D417**.
- **Acceptance criterion 4 is rewritten accordingly** (see §Acceptance criteria): the negative test
  asserts `GRADUATION_RESOLUTION_STALE` fires **and the report's graduable set loses the pack**,
  which is testable, rather than *"the gate predicate counts the entry as `blocking`"*, which is
  not.

**Cost note, since §2.3 claims the addition is free.** For kinds A and B the re-derivation is a
ledger read and is genuinely free. For **D `shape_firing` it is not**: `runExpressionCensus` walks
the whole corpus (827 positions, 771 transitions, 25 shape entries at HEAD `[V]`) and is a
`make expression-census` run, not a per-file check. The graduation pass must re-derive D from a
**single cached census run per sweep**, not once per entry, or `make verify` acquires a corpus walk
per pack. This is a real implementation constraint and is stated here because *"the predicates are
already shipped"* is true and *"so re-running them costs nothing"* is not.

#### §2.4 The clearance ladder, and where the gate sits on it

```
  blocking ──── predicate holds ────▶ resolved ──── predicate stops holding ────▶ blocking
     │                                                     (automatic, §2.3)
     │
     └──── kind is `unreachable` AND a ruling exists ────▶ accepted   (§3; never returns)
```

There is no edge from `blocking` to `accepted` for the mechanical kinds A–E, and no edge from
`unbuilt` to `accepted` at all. **`unbuilt` cannot be accepted** — that edge is the laundering
channel in its purest form (*"nobody has built it, so we will ship without it"*), and refusing it
is the same refusal `pack-graduation` §1.1 made against a fourth state, applied to the state that
already exists.

### §3 Who may accept, and against what — without a reviewer

#### §3.1 The constraint, stated exactly

`rfc/archive/content-sourcing-foundation.md`'s reviewer sign-off was **struck 2026-08-13**.
`planning/content-era/plan.md` §3b carries the strike in its own heading (*"reviewer sign-off
struck 2026-08-13"*) and its body `[V]`:

> **The third route is struck (owner ruling, 2026-08-13).** This list previously ended with "a
> strong reviewer's explicit sign-off". **There is no pack review workflow and there never will be
> one.** A sign-off gate nobody performs is worse than an honest label, because a status nobody can
> grant implies a check that never happened.

And `planning/content-era/plan.md` §4 rewrote the exit criterion for the same reason: *"'Reviewed
and published' was the previous wording. Nothing is reviewed, so the exit criterion is grounding
coverage plus honest labelling of what could not be grounded"* `[V]`. `pack-validation.ts` carries
no `reviewers` check at all at HEAD — the published floor is `GRADUATION_REQUIRES_SOURCES` on
`provenance.sources` and nothing else `[V]`. The role is gone from the code as well as the process.

#### §3.2 The ruling: acceptance is authorized by a citation, not by a person

**Nobody accepts a blocker. A blocker becomes `accepted` by citing a decision that already exists.**
The authority is the cited ruling; the author's act is *pointing at it*, and pointing is
mechanically checkable — `GRADUATION_RULING_UNCITED` checks path existence, the `#L<line>` grammar
and, for `owner_ruling`, that the target file contains the quoted date `[V]`.

This is not a workaround for the missing reviewer. **It is the structure §3b already has**, written
down: §3b gives an assertion exactly two routes to grounding — a citable source, or an instrument
that bears on it — and then rules what happens to an assertion neither route reaches:

> an assertion that neither a source nor an instrument can reach **stays ungrounded, permanently
> and in writing**. It is named in the pack's own `graduationBlockers` and it does not become
> groundable by anyone reading it. `[V]`

Map that onto the states and the vocabulary falls out with no new role in it:

| §3b route | clearance kind | resulting state |
|---|---|---|
| an instrument that bears on the claim | A, B, D | `resolved` — predicate re-derives |
| a citable source | C | `resolved` — binding re-derives |
| the placeholder is replaced by authored text | E | `resolved` — pointer predicate re-derives |
| **neither route can ever reach it** | **G `unreachable`** | **`accepted`** — cite the ruling that says so |
| neither route reaches it *yet* | F `unbuilt` | **stays `blocking`** |

So the question *"who may accept"* has the answer **"the same authority that already writes owner
rulings, and only through the documents it already writes."** A new acceptance that needs a new
ruling requires the ruling to land in the living tier first — which is law 5's existing authority
structure, unchanged, with no second-party review anywhere in it.

##### §3.2a [cross-review] The back door is open, and the draft did not check it — `GRADUATION_RULING_UNCITED` is a *reachability* check, not an *authority* check

**No reviewer is reinstated. That part of §3 survives the attack intact** — the strike stays
struck, nothing in this RFC asks anyone to grant a status, and *"acceptance is citing a decision
that already exists"* remains the right shape. **But §3.2 rests the whole authority argument on
`GRADUATION_RULING_UNCITED`, and the shipped check is much weaker than the sentence implies.** Read
at `pack-validation.ts:838–858` `[V]`:

- **For `permanent_property` and `out_of_scope` there is no date check at all.** The whole test is
  `cited = existsSync(resolve(file))`. `rulingRef: "README.md"` passes. The 3 committed
  `permanent_property` entries cite `docs/tablebase-grounding.md`, which is honest — and nothing in
  the code distinguishes that from any other path in the repo.
- **For `owner_ruling` the date test is file-wide, not line-scoped.** `cited` requires
  `contents.includes(date)` where `date` is the first `20\d\d-\d\d-\d\d` in the author's **own
  `ruling` string** and `contents` is the entire cited file. The `#L<line>` half only asserts that
  `contents.split(/\r?\n/)[line - 1] !== undefined` — i.e. **that the file has that many lines.**
  The cited line is never compared to the quoted ruling.
- **The one file the `#L` grammar accepts is `planning/exploration/log.md`**
  (`file === "planning/exploration/log.md"` is a literal in the guard), and that log is
  **append-only by law 7 and appended to by every agent as the last step of every task.** An author
  who appends a dated entry — which the workflow *requires* — has thereby made
  `planning/exploration/log.md#L1` cite-able for that date.

Put together: **an author can write a ruling, land it in the living tier, and cite it in the same
wave, and every lint in this RFC passes.** That is exactly the *"an author writes a ruling then
cites it"* shape, and §3.2 as drafted does not notice it. `pack-graduation` **D242** — quoted in
§3.3 — states the standard this fails: *"a citation requirement is a real guard only when the honest
case can pay it cheaply and the dishonest case cannot pay it at all — **so verify payability before
ratifying the lint**."* The draft quoted the first clause and skipped the second, which is the
clause that asks for exactly this check.

**Ruling: the door stays open, deliberately, and is narrowed rather than closed.** Closing it needs
a second party, and there is none — that is §3.1's whole point, and inventing one here would
reintroduce the struck role through this RFC instead of through the front door. What is available
is to make the honest case cheap and the dishonest case **loud**, which is the D242 standard's
actual remedy:

1. **`accepted.rulingRef` must resolve to a document in the living intent tier or a dated log
   entry** — `planning/exploration/log.md#L<line>`, `planning/content-era/log.md#L<line>`,
   `design/0[0-6]-*.md`, or `docs/*.md`. Not `README.md`, not an `rfc/` draft, and **never a file
   introduced by the same commit that adds the acceptance**. The last clause is the operative one
   and it is mechanically checkable: `git log --diff-filter=A` on the cited path must predate the
   commit. Code: `GRADUATION_RULING_SELF_MINTED` (**error**).
2. **The `#L<line>` check must read the line, not count it.** The cited line's text must contain
   the ruling's quoted date. One-line change to the existing guard, and it turns a
   *"the file is long enough"* assertion into a citation.
3. **`permanent_property` and `out_of_scope` get the same date containment `owner_ruling` has.**
   There is no reason the two kinds that need no dated ruling are the two kinds a shrug reaches for.
4. **Acceptance stays visible in a diff** — `content/accepted-conditions.md` is regenerated and
   byte-checked, so every new acceptance is a reviewable line in a committed file `[V]`. That is
   the honest replacement for the reviewer and §3b already named it: *"what replaces the reviewer's
   assurance is not another assurance. It is the publication channel"* `[V]`.

Fixes 1–3 are added to §6.3. They do not make acceptance unreachable by a determined author; **they
make an author-minted acceptance require a self-minted ruling in a diff, which is the difference
between a shrug and a forgery.** Filed as **D418**.

#### §3.3 The one new obligation: an acceptance must state its unreachability, not its inconvenience

`accepted.kind` is already a closed three-value enum (`owner_ruling` / `permanent_property` /
`out_of_scope`), and `pack-graduation` §1.2 correction 2 found — correctly — that *"`kind` buys
nothing mechanically … all three collapse to one non-blank string."* The `rulingRef` fix closed the
*citation* half of that. This RFC closes the other half with one field:

**An `accepted` entry carries `accepted.unreachable`: the clearance kind the entry would have had,
had any route existed, plus why none does.** Concretely, `accepted` gains a required
`unreachableBecause` string and the existing entry keeps everything else:

```jsonc
{ "state": "accepted",
  "statement": "This position holds eleven pieces. Syzygy tops out at seven.",
  "accepted": {
    "kind": "permanent_property",
    "unreachableBecause": "material — the position is above the tablebase piece bound and always will be",
    "ruling": "…", "rulingRef": "docs/tablebase-grounding.md" } }
```

`GRADUATION_ACCEPTED_WITHOUT_UNREACHABILITY` (error) fires when the field is missing or blank. It
is still prose and a lint still cannot tell a real impossibility from a shrug — but it forces the
author to write the sentence that a reader can disagree with, in a file
(`content/accepted-conditions.md`) that is committed and byte-checked against a fresh run `[V]`. A
shrug that has to name the route it is refusing is a shrug that shows up in a diff.

**What this deliberately does not do:** it does not require the `unreachableBecause` reason to be
unique, novel, or approved. The 40 `owner_ruling` entries all quote the same 2026-08-13 ruling and
all take the same `rulingRef` (`planning/exploration/log.md#L1231`) `[V]`; they take the same
`unreachableBecause` too. **A citation requirement is a real guard only when the honest case can
pay it cheaply and the dishonest case cannot pay it at all — so verify payability before ratifying
the lint** (**D242**, quoted in full **[cross-review]**; the draft dropped the second clause, which
is the clause §3.2a then had to supply).

**[cross-review] Payability, verified rather than asserted, since D242 requires it.** The honest
case pays once: all 43 committed `accepted` entries already resolve (40 `owner_ruling` →
`planning/exploration/log.md#L1231`, 3 `permanent_property` → `docs/tablebase-grounding.md`) `[V]`,
and the migration adds `unreachableBecause` to each with no new citation, so criterion 6 is
reachable at zero authoring cost. **The dishonest case can also pay it** — that is §3.2a's finding,
and it is why §6.3 gains `GRADUATION_RULING_SELF_MINTED`. `unreachableBecause` itself is prose and
this RFC does not pretend otherwise; its whole value is that a shrug must **name the route it is
refusing**, in a regenerated, byte-checked file, and a named route is a thing a reader can
contradict.

### §4 What the shipped instruments already clear

#### §4.1 Four entries clear today, with no new work — measured

This is the RFC's proof that the mechanical half is real rather than projected. Four packs carry
the byte-identical entry *"The Syzygy root assessment is declared but not ledger-verified; no
sourcing sidecars were produced."* All four now have a sidecar, and the assertion is **stale**:

| pack | `objective.grading.assessedBy.kind` | `tablebase_result` records | `sourcing-check` at strict |
|---|---|---|---|
| `mate-k-q-technique` | `syzygy` | 27 | **passed (strict)** |
| `mate-k-r-technique` | `syzygy` | 25 | **passed (strict)** |
| `mate-two-bishops` | `syzygy` | 25 | **passed (strict)** |
| `philidor-passive-rook-convert` | `syzygy` | 25 | **passed (strict)** |

`[V]`, by running `apps/server/dist/sourcing-check.js` over each file. `check.ts:449` raises
`SYZYGY_ASSESSMENT_UNGROUNDED` at strict when `assessmentGrounding(...)` returns `"unverified"`
`[V]`; it raises for none of the four, which is the same statement as *the assessment is
`ledger_verified`*. Under §1.2 these four are `kind: "assessment_grounded"`, `subject:
"/objective/grading/assessedBy"` — and the checker moves them to `resolved` on its first run,
without an author writing a sentence.

**The honest counterweight, run in the same pass:** the entries asserting *"no engine pass has been
run on this pack"* are **all true** — **every one of those packs holds 0 `engine_eval` records**
`[V]`. Not one is stale. So the corpus's blockers are, with four exceptions, telling the truth —
which is the finding that makes this RFC a bridge rather than a cleanup, and it is the difference
between a **general-rot** claim (which would need an audit) and an **absence-of-recheck** claim
(which needs a re-derived predicate, i.e. this RFC). Only 32 of 50 packs have a ledger at all,
holding 391 `engine_eval` and 341 `tablebase_result` records between them `[V]`; **18 of 50 have
neither a `.evidence.json` nor a `.sources.json`** `[V]`, which is the same 18.

**[cross-review] The count `16` is ruleset-sensitive and the draft did not say which ruleset
produced it.** Re-derived at HEAD: **15** entries literally assert *"No engine pass/validation pass
has been run"*; widening to every blocking statement whose engine-absence is the operative claim
(`trajectory-caro-advance-chain-bishops`'s *"requires engine evidence this repo lacks"* and
`trajectory-qgd-exchange-minority`'s *"with no engine…"*) gives **17**, over 17 distinct packs. The
draft's 16 falls between two defensible readings and matches neither exactly. **The finding is
invariant across all three: 15, 16 or 17, the count of stale ones is zero** — `engine_eval` is 0 in
every one of the packs concerned, on every reading `[V]`. Quoted as a range because §5.1's standard
forbids quoting a hand-audited figure to the unit, and this is one.

#### §4.2 The mechanical half, per class

108 of the 220 blocking entries (49%) fall in kinds **A, B and D**, whose predicate is a shipped
instrument's output. **[cross-review] The draft wrote *"kinds A–D"*, and C is inside that range** —
the table below has no C row, C's 52 entries are priced separately in §4.3, and §5.2's last row
files C with the *authored / citation* kinds. Letters are used as an inclusive range in one place
and as a set in another, and the RFC then carries **three different "mechanical" totals**: 108
(A + B + D), 160 (adding C), and 180 (the `clearable` count §6.4 prints, which is A–E). All three
are correct for what they count and the draft never says which is which. **Normative resolution,
used everywhere below: `clearable` = kinds A–E = 180; `unclearable` = F + G = 40; the 108 is the
sub-total whose evidence a *machine can produce unaided*, and C and E are excluded from it because
their evidence requires a human to find a source or write a sentence first.**

| kind | entries | instrument that produces the evidence | Makefile target |
|---|---|---|---|
| B (engine) | 38 | Stockfish walk → `engine_eval` records | `make verify-draft`, `make engine-walk` |
| B (corpus) | 40 | Lichess explorer → `explorer_position_census` records | explorer sourcing (`candidate-attach PIPELINE=explorer`) |
| D (shape) | 24 | `runExpressionCensus` firings / `checkShapeFile` | `make expression-census`, `make shape-check` |
| A (assessment) | 6 | Syzygy walk → `tablebase_result` + `assessmentGrounding` | `make verify-draft`, `make tablebase-walk` |

**These clear by running an instrument, not by asserting one was run.** That is the cheapest half
of this RFC and it is most of what a content wave will actually move: a wave runs the walk, the
checker re-derives, and the entry demotes from `blocking` on its own. **No wave commit needs to
edit a blocker's state by hand**, which removes the class of error `pack-graduation` §4.3 measured
at length (ten entries whose ALLCAPS status marker inverts their meaning).

**[cross-review] True of the engine and assessment rows. False as written of the corpus row, and
that row is 40 of the 108.** `explorer_position_census` records have exactly one producer in the
tree — `attachExplorerEvidence` (`sourcing/explorer.ts:268`) — and it is not a walk. Read at
`explorer.ts:232–250` `[V]`, it refuses to run unless **all** of the following already hold:

| refusal | what it demands the author do first |
|---|---|
| `CANDIDATE_NOT_CLEAN` | the pack already passes `checkSourcingFile` at **strict**, sidecars and all |
| `ATTACH_TARGET_FORBIDDEN` | `--target` is an existing `/feedbackClaims/<i>/text` — a claim must already be authored |
| `ATTACH_SPAN_REQUIRED` | `--span` names a substring of that claim and `--field` names what settles it; *"pack prose is never generated or overwritten"* |
| `ATTACH_SOURCE_LINE_MISSING` | `provenance.sources` already contains the verbatim explorer rationale line |

So a corpus blocker clears only if the pack **already contains a quantified sentence** the explorer
can settle. *"Which reroute is more common is unquantified"* names no span, because the number it
asks for is not in the file. **Writing that sentence is authoring, and the instrument is explicitly
built to refuse to write it.** Two consequences the draft should have drawn:

1. **B (corpus) and C (`claim_bound`) are not independent kinds for the corpus half — one command
   satisfies both.** `attachExplorerEvidence` writes the `explorer_position_census` record **and**
   the `claimBindings` entry in the same atomic write (`explorer.ts:268–273`). §4.3 prices C as
   *"mechanizable and not cheap"* and §4.2 prices B-corpus as cheap; **they are the same work,
   priced twice, in opposite directions.** The 40 belong with the 52, not with the 38.
2. **18 of 50 packs have no ledger and no manifest at all** `[V]`, so for those the explorer path
   does not begin: `readJson` on both sidecars precedes every check above.

**Corrected reading of this section:** of the 108, the **44** in B(engine) + A(assessment) are
genuinely *run-the-instrument* work — a Stockfish or Syzygy walk over authored positions, no new
prose. The **24** in D(shape) need a shape entry to already name the trigger. The **40** in
B(corpus) need an authored quantified claim first and are, in cost, part of C. That is why §5.2's
*"graduates on instrument runs alone"* population collapses to zero, and it is the single most
important correction in this review.

#### §4.3 What the instruments cannot see, priced

`claim_bound` (52 entries, the largest class — **92 [cross-review]**, once §4.2's 40 corpus entries
are priced where their work actually is) is mechanically checkable and **almost entirely unpaid**:
1 of 32 ledgers carries `claimBindings`, and the census reports **1 backed claim of 196** `[V]`.
D267 measured that a 22-pack citation pass moved the checker by zero. So the 52 are *mechanizable*
and are not *cheap*, and this RFC does not let the first word stand in for the second. Each of the
52 needs a source found by a human, attached to a pointer, and digested — the mechanism exists
(0.26) and the work does not.

`pointer_authored` (20 entries) is the weakest predicate in the vocabulary and is stated as such: a
string comparison can prove a placeholder is *gone*; it can never prove what replaced it is *true*.
**[cross-review] And it is weaker still than that, because the author supplies the string it
compares against** — see §1.4(3), which makes `clearance.placeholder` required and sources it from
the emitter template rather than from a later author's choice. Law 8 forbids closing the remaining
gap with generated judgement, and this RFC does not try.

### §5 What cannot clear, quantified

#### §5.1 The classification and its residue

The class counts above come from an ordered first-match keyword ruleset over the `statement` of all
220 blocking entries, evaluated in the order `unbuilt → corpus → citation → engine → tablebase →
shape → authored`. **Ordering matters and the order was chosen to be safe rather than flattering:**
`unbuilt` is tested first, so any entry that mentions a missing instrument is counted as
unclearable even when it also mentions an engine pass. **12 entries match no rule** and are counted
as `unreachable` residue pending an author's choice. `pack-graduation` **D245**'s lesson applies
directly — *"a proxy built to be loose cannot also be cited to the unit"* — so these figures are
**a hand audit with a stated ruleset, not a measurement**, and the only numbers in this RFC quoted
to the unit are the ones a command printed.

**[cross-review] The ruleset is not in fact stated, and this section claims it is.** §1.2 says the
classification is *"stated in §5.1 with its residue"*; §5.1 states the **order** of seven rules and
**none of their keywords**, and defers the residue to *"the planning directory at implementation"*.
So no reader can reproduce 108, 52, 40, 28 or 12, and no reviewer can check them — which is exactly
the failure D245 names, one level up: the draft applied D245's honesty label to figures whose
derivation it withheld. Two obligations, both cheap and both **landing requirements, not
follow-ups**:

- **The seven rules ship as a literal.** The keyword list per rule goes in this RFC (or in a
  checked-in `tools/` classifier the migration commit runs), so the counts are re-derivable by a
  second party from the document alone.
- **The 12 residue entries are listed here, by pack id and statement, before this RFC is accepted.**
  They are 12 rows. Open question 4 turns entirely on them — it asks the owner to rule on the
  default for a population the document never shows — and **an owner cannot rule on a residue they
  cannot see.** Sampled at HEAD by the reviewer, the residue is dominated by *format-gap* and
  *missing-runtime-surface* statements (*"the drill has no fifty-move counter surfaced"*, *"the
  variants rule has no encoding"*, *"first-move alternatives cannot be deviations in a
  `follow_theory` pack"*, *"`pack-check` raises `PLAN_SIGNATURE_INLINED` … and the checker both
  demands and refuses the alternative"*) — every one of which is **`unbuilt`, not `unreachable`**.
  That measurement answers open question 4; see the ruling recorded there.

#### §5.2 Packs that cannot graduate without new authoring

Partitioning the 56 documents in `content/drafts/` by the classes their blocking entries fall in:

| Population | Documents | Reading |
|---|---|---|
| Zero blocking entries | **1** | `line-boundary.browser.json` — a fixture, excluded by suffix (§0.4) |
| Blocked **only** by kinds A, B and D | **3** | `anti-french-advance-white`, `kid-classical-black`, `leningrad-dutch-black` — ~~these graduate on instrument runs alone~~ **refuted, see below** |
| Blocked by at least one `unbuilt` entry | **23** | cannot graduate until an instrument that does not exist ships |
| Blocked by authored / citation kinds only (C, E, G) | **29** | of which **5 are browser fixtures** (§0.4) → **24 authored packs** |

`[V]` for the partition arithmetic (1 + 3 + 23 + 29 = 56); the class assignment inside it is §5.1's
hand audit.

**So the answer to *how many packs cannot graduate without new authoring* is 47 of 50 authored
packs**, and the two halves are different problems: **23 are waiting on an instrument** (tablebase
opponent selection, the game-level tempo corpus of **D155**, Maia practical difficulty, format
gaps) and **24 are waiting on a human to write chess judgement or find a source**.

##### §5.2a [cross-review] The 3-pack claim is refuted, entry by entry — the honest number is 0

The three packs' blockers were re-read at HEAD against the instruments that would have to clear
them. **None of the three graduates on instrument runs alone**, and two of the nine blockers
contradict the draft's own text elsewhere:

| pack | blocker | why an instrument run does not clear it |
|---|---|---|
| `anti-french-advance-white` | *"ENGINE-CHECKED 2026-08-15: 4.dxc5 evaluates −0.39 against +0.29 … **the class itself stays objective-relative and unsettled by evaluation**"* | The engine pass **already ran**. The entry survives it by construction and says so. Re-running the engine cannot clear a blocker whose statement is *"evaluation does not settle this"* |
| `anti-french-advance-white` | *"the d4 attacker/defender counts … the structural-feature vocabulary **could express and check this count and has not been asked to**"* | D `shape_firing` needs a **named shape entry**; none exists. Authoring one is authoring |
| `anti-french-advance-white` | *"'their prep is longer' … a plausible hypothesis with no corpus measurement"* | The claim `their-prep-is-longer` is `author_principle` + `hypothesis`. `MACHINE_LABELS` (`claim-binding.ts:168`) maps only `corpus_observed` / `engine_validated` / `tablebase_exact` to record kinds `[V]` — **a `hypothesis` claim is unbackable by construction** until its type and text are rewritten |
| `kid-classical-black` | *"which reroute … the explorer API could settle it below the family root"* | No authored claim carries the number, so `--span` names nothing (§4.2) |
| `kid-classical-black` | *"no corpus measurement of **tempo-vs-result in KID races** exists in this repo"* | This is **D155's game-level tempo corpus** — an instrument this RFC's own §5.2 lists among *"an instrument that does not exist"*. **The pack belongs in the 23, and the draft put it in the 3** |
| `leningrad-dutch-black` | *"the 'one-break counting rule' … authored doctrine with no source; the structural-feature vocabulary **has not been asked to**"* | Same as row 2: no shape entry exists |
| `leningrad-dutch-black` | two *"which finisher / which order … is unquantified"* entries | Same as row 4 |

And a precondition kills all three independently of the above: **none of the three packs carries
the explorer rationale line in `provenance.sources`** `[V]`, so `attachExplorerEvidence` throws
`ATTACH_SOURCE_LINE_MISSING` before it queries anything. That line is a pack edit.

**Corrected statement, which is the one planning should consume: 0 of 50 authored packs graduate on
instrument runs alone; 50 of 50 need new authoring.** The 47/3 split does not survive; the 23/24
split of *kinds* of remaining work does, and gains the 3: **23 wait on an instrument that does not
exist, 27 wait on a human to write chess judgement or find a source.** `make graduation-report`
prints `(none)` today and will still print `(none)` on the day this RFC lands — which acceptance
criterion 8 already anticipated in its hedge (*"plausibly still `(none)`"*) while §5.2 and D409
asserted otherwise. **The criterion was right and the headline was wrong.**

**This is stated as a number rather than as a hope because the alternative is worse.** A vocabulary
that makes 180 entries individually decidable will produce a wave of green checks, and a reader who
does not have the 50 in front of them will read that wave as *graduation is nearly solved*. It is
not. The clearance vocabulary makes the distance measurable; it does not shorten it — **and the
strongest evidence for that reading is that its first run moves the graduable set by zero.**

#### §5.3 The class that no instrument will ever reach, named

`planning/content-era/plan.md` §3b's *"authored teaching"* class is the one law 8 fences. On a
puzzle-derived on-ramp pack the emitter itself writes
`authored-teaching-absent` — *"No authored plan, deviation, or feedback claim exists; a reviewer
must add any chess judgement rather than infer one from puzzle metadata"* — and that entry appears
on **26 of the 36 `content/candidates/*/pack.json` documents** `[V]`. No instrument supplies chess judgement, an LLM
may not manufacture it (law 8; ADR-0005), and the reviewer the statement names does not exist
(§3.1). Its clearance kind is **E `pointer_authored`** with `subject` naming the pointers that must
be written — the predicate proves the placeholder is gone and stops there.

Those 36 are **not** graduation subjects (`pack-graduation` §0.3, ruled), so they do not enter the
counts in §5.2. They are named here because the same class exists in `content/drafts/` and because
a reader comparing the two reports will otherwise add 143 to 220. **The report already refuses to
print a merged total for exactly this reason** (`pack-graduation` **D243**) and this RFC does not
reintroduce one.

### §6 Schema, lints and report

#### §6.1 Schema — `$defs/graduationEntry`

`clearedBy` (`{ "$ref": "#/$defs/nonEmptyString" }`) is **replaced** by `clearance`, a closed
object:

```jsonc
"clearance": {
  "type": "object",
  "required": ["kind", "subject"],
  "properties": {
    "kind": { "enum": ["assessment_grounded", "ledger_record", "claim_bound", "shape_firing",
                       "pointer_authored", "unbuilt", "unreachable"] },
    "subject": { "type": "string", "pattern": "^/[^/]" },
    "instrument": { "$ref": "#/$defs/nonEmptyString" },
    "blockedBy": { "$ref": "#/$defs/nonEmptyString" },
    "placeholder": { "$ref": "#/$defs/nonEmptyString" }
  },
  "additionalProperties": false
}
```

**[cross-review] `pattern` tightened from `^/` to `^/[^/]`.** The draft's `^/` matched the bare
document root, so *"this pack is ungrounded"* — the exact shape §1 refuses as *"a blocker nobody
can check"* — was expressible with a subject that resolves. See §1.4(2). The three conditional
requirements (`instrument` for A–E, `blockedBy` for `unbuilt`, `placeholder` for
`pointer_authored`) stay in the lints rather than in a `oneOf`, deliberately: the entry-level
`oneOf` is already three-armed on `state` and a second dimension would make it nine, for no gain a
lint does not give with a better message.

`clearance` is **required** when `state` is `"blocking"`; the existing `oneOf` already forbids the
old `clearedBy` on `resolved` and `accepted` and the same binding carries over to `clearance`, with
one change: `resolved` **requires** `resolved.clearance` (§2.2). `accepted` gains a required
`accepted.unreachableBecause` (§3.3).

**`$defs/provenance` is `additionalProperties: false` at pack 0.27** and `$defs/graduationEntry` is
`additionalProperties: false` too `[V]`. The brief asked whether `provenance`'s openness is a
licence or a trap here: **it is neither — it is stale.** `pack-graduation` closed it, deliberately,
as the whole of its §3.1. There is no unversioned hiding place, and inventing one would mean
reopening the object that RFC closed. The lane is claimed instead (§7).

#### §6.2 Migration — mechanical, 363 entries, no judgement

| Stage | Population | Rule |
|---|---|---|
| 0 | `content/candidates/` — 143 entries, 36 documents | each emitter blocker template gets one checked-in `clearance`; the emitters write it and Stage 0 backfills the same object. Keyed on the template id, not on the rendered statement `[V]` — **but see the correction below: 3 of the 143 are not emitter output and do need judgement** |
| A | `content/drafts/` — 220 blocking entries | the §5.1 ruleset assigns a candidate `kind`; **the 12 residue are classified by hand, not defaulted** (**[cross-review]**, see open question 4 — the draft defaulted them to `unreachable`, which is the one kind eligible for `accepted`, and the residue is measurably `unbuilt`-shaped). Every assignment is written into the commit for review as a diff |
| B | `content/drafts/` — 30 resolved entries | each gains `resolved.clearance`; the 4 measured stale ones (§4.1) are **not** hand-resolved — the checker resolves them, which is the migration's own first test |
| C | 5 browser fixtures (§0.4) | `blocking` → `accepted`, `kind: "out_of_scope"`, `unreachableBecause` naming the fixture role. First `out_of_scope` instances in the corpus |

**[cross-review] Stage 0's premise is wrong in two ways, both small and both load-bearing for the
word *mechanical* in this section's title.**

1. **There is no template registry.** `pack-graduation` §1.6 specified *"a named, checked-in
   template list — id plus template"* that both the emitter and the migration read. It **did not
   ship**: `sourcing/openings.ts:115`, `sourcing/position-seeds.ts:227`, `sourcing/syzygy.ts:170`
   and `distill.ts:43` each build an **inline object literal** and no module exports a shared list
   `[V]`. So Stage 0 must either create the registry (a real, small piece of work this RFC should
   own and cost) or backfill against four inline literals. Either is fine; *"the template registry
   `pack-graduation` §1.6 shipped"* is not a thing that exists. Filed as **D416** with the two
   missing lint codes — same flow-back failure, same RFC.
2. **There are not 5 templates, and 3 of the 143 entries are not templated at all.** Distinct
   template ids across the four emitters: **9** (7 in the three sourcing emitters, per §1.6's own
   *"two of the seven texts are templated"*, plus 2 in `distill.ts`) `[V]`. In
   `content/candidates/` the 143 entries carry **7** distinct ids: `mechanical-objective-placeholder`
   36, `outcome-ungraded` 26, `start-assessment-absent` 26, `target-elo-authored` 26,
   `authored-teaching-absent` 26 — and then `opponent-policy-authored` **1** (a `syzygy.ts`
   template, not among the draft's five) and `immediate-blunder-guard-is-not-selectable-defect-d8-dela`
   **2**, which is **hand-authored and matches no emitter template at all** `[V]`. **Stage 0's
   *"no judgement"* claim fails on 3 of 143 entries** — a small number, and exactly the shape §0.4
   found for the five browser fixtures: *a population a stage did not read.* Stage 0 must
   **enumerate ids and fail on an unrecognised one** rather than assume template coverage.

**Stage A's error mode is a false mechanical kind** — an entry filed as `ledger_record` that no
record can actually satisfy. It is bounded by the fact that a wrong mechanical kind **fails to
clear** rather than clearing wrongly: the predicate simply never holds, and the entry stays
`blocking`. That is `pack-graduation` §4.4's safe direction preserved by construction. The one
dangerous move — `unreachable` → `accepted` — requires a citation and a diff line in
`content/accepted-conditions.md` and is not performed by the migration at all except for Stage C's
five fixtures.

**Digest consequence.** `digestDrillPack` canonicalizes the whole document including `provenance`
(`packages/schema/src/drill-pack/digest.ts`), so this migration moves every touched pack's digest
and the commit re-stamps `packDigest` on every ledger it moves — the **landing-order obligation**
`pack-graduation` §4.5 established, restated as an end-of-commit assertion rather than a permanent
property (**D209**).

#### §6.3 Lints

Added to `validatePackDocument` (`apps/server/src/pack-validation.ts`), alongside the **six**
graduation codes it already raises (`GRADUATION_ENTRY_LEGACY_SHAPE`, `GRADUATION_ID_DUPLICATE`,
`GRADUATION_RULING_UNCITED`, `GRADUATION_CLEAREDBY_UNRESOLVED`, `GRADUATION_BLOCKING_ON_PUBLISHED`,
`GRADUATION_REQUIRES_SOURCES`) `[V]` — **[cross-review]** the draft said seven, counting
`GRADUATION_BLOCKERS_OUTSTANDING`, which is a `ServerError` thrown by `PackStudio.register`
(`pack-studio.ts:123`), not an issue `validatePackDocument` raises:

| Code | Condition | Severity | Home |
|---|---|---|---|
| `GRADUATION_CLEARANCE_MISSING` | `state: "blocking"` with no `clearance` | error | `validatePackDocument` |
| `GRADUATION_CLEARANCE_SUBJECT_UNRESOLVED` | `clearance.subject` is not a depth-≥1 pointer that resolves in this document (§1.4(2)) | error | `validatePackDocument` |
| `GRADUATION_CLEARANCE_INSTRUMENT_MISSING` | a mechanical `kind` (A–E) with no `instrument` | error | `validatePackDocument` |
| `GRADUATION_CLEARANCE_PLACEHOLDER_MISSING` **[cross-review]** | `kind: "pointer_authored"` with no `placeholder` — the predicate would have no input (§1.4(3)) | error | `validatePackDocument` |
| `GRADUATION_CLEARANCE_BLOCKEDBY_UNRESOLVED` | `kind: "unbuilt"` with a missing or non-existent `blockedBy` path | error (replaces the warning-level `GRADUATION_CLEAREDBY_UNRESOLVED`) | `validatePackDocument` |
| `GRADUATION_RESOLVED_WITHOUT_CLEARANCE` | `resolved` with no `resolved.clearance`, or one whose kind is `unbuilt`/`unreachable` | error | `validatePackDocument` |
| `GRADUATION_ACCEPTED_WITHOUT_UNREACHABILITY` | `accepted` with missing/blank `unreachableBecause` | error | `validatePackDocument` |
| `GRADUATION_RULING_SELF_MINTED` **[cross-review]** | `accepted.rulingRef` resolves to a path outside the living intent tier, or to a file first added by the commit under review (§3.2a) | error | `validatePackDocument` |
| `GRADUATION_RESOLUTION_STALE` | a `resolved` entry whose `resolved.clearance` no longer re-derives (§2.3) | warning in `content/drafts/`, **error** in `content/packs/` | `checkSourcingFile` |

`GRADUATION_RULING_UNCITED` is additionally **tightened in place** (§3.2a): the `#L<line>` arm reads
the cited line and requires it to contain the ruling's quoted date rather than merely requiring the
file to have that many lines, and the date-containment test extends from `owner_ruling` to all
three `accepted.kind` values. No new code; the existing one stops being satisfiable by a long file.

`GRADUATION_RESOLUTION_STALE` is the one that matters, and it is the only one that requires the
ledger, so it lives in `checkSourcingFile` (which already reads the sidecar) rather than in
`validatePackDocument` (which does not). `pack-graduation` criterion 14 already wired
`checkSourcingDirectory` over `content/packs/` at strict inside `make verify` and a ≤15-of-47
ratchet over `content/drafts/`; **this RFC adds a predicate to a sweep that already runs.**
**[cross-review] It does, however, add one new sweep**, and the draft's *"and adds no new sweep"*
was wrong: §6.4's per-entry verdict requires `graduation-report.ts` — today a pure `node:fs` JSON
reader that imports nothing from `pack-validation` or `sourcing` `[V]` — to call the checker. See
§2.3a, which specifies that as a `--verify` mode and states the census-caching constraint that
comes with kind D.

#### §6.4 The report

`graduation-report.ts:39` changes from `clears via ${entry.clearedBy ?? "(unspecified)"}` to
printing `clearance.kind` + `clearance.subject` + the checker's verdict — `holds` / `does not hold`
/ `no predicate`. Two lines are added to each root's header: **`clearable: N`** (blocking entries
whose kind is A–E — **180** at HEAD) and **`unclearable: N`** (`unbuilt` + `unreachable` — **40**),
because the whole point of the vocabulary is that those two numbers stop being the same number.
**No merged corpus-wide total is printed**, per `pack-graduation` §3.3 and **D243**, unchanged.

**[cross-review] Two constraints on this, both from §2.3a.** (a) The verdict column requires the
ledger, so it runs only in the new `--verify` mode; the default `make graduation-report` invocation
stays a pure JSON read and prints `clearance.kind` + `clearance.subject` with no verdict, because
`writeAcceptedConditions` regenerates a **committed, byte-checked** file and must not acquire a
dependency on a Stockfish container or a corpus walk to do it. (b) `clearable`/`unclearable` are
derived from `clearance.kind` alone and are therefore available in **both** modes — they are the
two numbers planning consumes, and they must not be the ones that need an instrument to print.

### §7 Register and version claims

- **Pack schema: claims 0.28.** `rfc/README.md`'s pack-version register records *"0.28 is the next
  free pack lane"* `[V]`, released by `opponent-contracts` at cross-review (*"NO pack lane — 0.28
  released and remains free"*) `[V]`. `DRILL_PACK_SCHEMA_VERSION` reads `"0.27"` and the schema
  `$id` is `urn:chess-tabiya:schema:drill-pack:0.27` `[V]`. The lane is **earned**, not
  discretionary: `$defs/graduationEntry` and `$defs/provenance` are both
  `additionalProperties: false` at 0.27, so `clearance` cannot be added without a version. This RFC
  does not edit `rfc/README.md`; it **requests** the row.
  **[cross-review] Verified independently, and the claim clears the bar that released the last
  0.28 claim.** Both objects re-read from `schemas/drill_pack.schema.json` at HEAD:
  `$defs/provenance` is `{"type":"object","required":["reviewStatus"],…,"additionalProperties":false}`
  and `$defs/graduationEntry` is `{"type":"object","required":["id","state","statement"],…,
  "oneOf":[…],"additionalProperties":false}` `[V]`. The precedent that released the lane from
  `opponent-contracts` was *"**NO pack lane** — the cited `claim-backing` precedent does not exist
  … and **every pack lane 0.3→0.27 carries a `$defs`/enum/property change**"*: that RFC wanted the
  lane for **register rows only**, with no schema edit, and the register was right to refuse it.
  **This claim is the opposite shape.** It adds a `clearance` property to a closed `$defs`, adds a
  seven-value enum, tightens a `pattern`, adds a required key inside the closed `resolved`
  sub-object and another inside the closed `accepted` sub-object, and **withdraws `clearedBy`**
  along with its arm of the entry-level `oneOf`. Five `$defs`-level changes, not zero. It is not
  register-only and could not be made register-only: with `additionalProperties: false` on both
  candidate hosts, **there is no unversioned place to put `clearance`**, which is the exact test
  the register applies. **Verdict: keep 0.28.**
- **`STORAGE_VERSION`: nothing.** No table, no column, no bump, and therefore **no migration
  position is claimed**. `STORAGE_VERSION` reads **22** (`apps/server/src/storage.ts:407`) `[V]`,
  and the register's rule — *"MIGRATION NUMBERS ARE ASSIGNED AT LANDING, NOT AT CLAIM"* — is not
  reached, because this RFC holds no migration to number. `pack_drafts.document_json` and
  `registered_packs.document_json` store whole documents as JSON blobs, and
  a stored draft carrying a `clearance`-less entry **refuses to register rather than requiring a
  rewrite**, which is the same compatibility rule `pack-graduation` §8.2 used to avoid a migration
  and it holds unchanged here. **[cross-review] The mechanism is right and the draft cited the
  wrong code for it.** `GRADUATION_ENTRY_LEGACY_SHAPE` (`pack-validation.ts:830`) fires only when
  `typeof entry === "string"` `[V]` — it catches legacy *strings*, not typed entries missing
  `clearance`. What actually stops the stored draft is `GRADUATION_BLOCKERS_OUTSTANDING` (any
  `blocking` entry refuses registration outright, `pack-studio.ts:122`) and, for `resolved` /
  `accepted` entries, plain schema validation against the closed 0.28 `graduationEntry`. Same
  outcome, different code; a stored draft stays **editable** through `PackStudio.update`, which is
  what makes *"refuses to register"* rather than *"is bricked"* the true statement.
- **Run schema: nothing.** Clearance is never persisted in a run — no event, no occurrence, no
  policy. `DRILL_RUN_SCHEMA_VERSION` is byte-identical.
- **Shape-entry schema: nothing.** `shape_firing` reads the shape entry; it does not extend it.
- **Nothing versioned was preferred and is not available.** §6.1 states why.

### §8 Relationship to `rfc/measurement-records.md`

`measurement-records.md` (draft, returned to author at cross-review) is adjacent and does not
collide. **It was rewritten in the working tree while this RFC was being drafted (277 insertions),
so both quotations below were re-checked against the file after the rewrite and both survive
verbatim** — `pack-graduation` **D246**'s rule applied (*"an RFC round that measures a moving tree
must pin its commit and re-check the lanes"*). Its 0.28 release also survives the rewrite: *"0.28
remains the next free lane and this RFC leaves it free"* `[V]`, which is the lane §7 claims.

**[cross-review] Re-checked a third time, after the tree moved again.** Two commits landed between
this RFC's drafting commit (`b9fd803`) and this review — `31dc2f9` (*"rfc: register statuses
corrected"*) and `c86f74a` (*"research: live relay verdict landed"*). All four quotations in this
section survive verbatim: `measurement-records.md:333` (the 0.28 release), `:1282` (the D380
hand-off), `:410–411` and `:423–424` (the two governing sentences) `[V]`. `content/`, `schemas/`,
`packages/schema/`, `apps/server/src/sourcing/`, `pack-validation.ts`, `pack-studio.ts` and the
`Makefile` are unchanged since `b9fd803`, so every measurement in this RFC — corrected figures
included — was re-derived at the same tree the review read. D246's rule, applied twice.

Its §9 already routes the graduation half of **D157**/**D380** here explicitly:

> the **graduation policy** — may a pack publish with `declared: 0`? — to `rfc/pack-graduation.md`,
> which owns `GRADUATION_REQUIRES_SOURCES` and the published-status floor. Filed as **D380**. `[V]`

**This RFC answers D380: yes, a pack may publish with `declared: 0`, provided no blocking entry
names the missing declaration as its subject.** The gate is *zero blocking entries*, not *every
axis measured*; a pack whose corpus axis was never asserted has nothing to declare, while a pack
that asserted one and did not measure it carries a `claim_bound` or `ledger_record` blocker whose
subject is that claim. **Publication is bounded by what the pack claims, never by a checklist of
axes it might have claimed** — which is the only reading compatible with §3b's *"honest labelling
of what could not be grounded."*

The overlap in the other direction is real and is a coordination note rather than a dependency. A
cleared blocker **is** a measured claim about a pack, and `measurement-records` §2 supplies the
governing distinction this RFC's §1.2 inherits rather than restates:

> A tablebase record grounds a claim by settling it. An engine record grounds a claim by making it
> falsifiable at a named cost. … The corpus is under version control and the instrument is in the
> repository, so the named cost is zero and the reviewer is a CI run. `[V]`

That is precisely why `resolved` may carry a standing predicate at all (§2.3): for the corpus-side
kinds the cost of re-deriving is zero, so *"a stale record is a failing assertion"* is affordable.
Where `measurement-records`' `census.*` assertion family lands, `shape_firing` and the corpus half
of `ledger_record` should be expressed as `census.*` assertions rather than as a second
re-derivation path. **Whichever lands second adopts the other's vocabulary in one commit**; neither
blocks the other, and this RFC claims no `census.*` names.

## Deviations from design

None. `design/03-product-breadth.md` B6 names publication channels as shipped and
`rfc/archive/pack-graduation.md` made the official channel *reachable in principle*; this RFC makes
it reachable in fact. The 2026-08-13 no-review-workflow ruling is preserved exactly and §3 is built
to be expressible without a reviewer rather than around one. Law 8 is load-bearing in §1.1, §1.3,
§1.4, §4.3 and §5.3: no clearance kind grades a move, and `pointer_authored` is explicitly stated to
prove absence rather than truth.

**[cross-review] The no-reviewer ruling survives the review intact, and this is worth stating
because §3.2a reads like an attack on it and is not.** The finding is that the *citation check* is
weak, not that acceptance needs a person. Nothing added by this review grants anyone a status,
introduces a second-party approval, or reinstates `provenance.reviewers` — the three tightenings in
§3.2a are all path-and-date arithmetic a CI run performs, which is exactly the substitution
`planning/content-era/plan.md` §3b already made: *"what replaces the reviewer's assurance is not
another assurance. It is the publication channel."* **The one thing this review will not let the
RFC do is call a convention a mechanism.**

## Acceptance criteria

1. **Schema.** `$defs/graduationEntry` carries the closed `clearance` object; `clearance` is
   required on `blocking`, `resolved.clearance` on `resolved`, `accepted.unreachableBecause` on
   `accepted`. All 56 `content/drafts/` documents, all 36 `content/candidates/*/pack.json`,
   `schemas/drill_pack.example.json` and every `schemas/fixtures/drill-pack/` file validate — **in
   the same commit as criterion 2**. Proof is `packages/schema/src/drill-pack.test.ts`'s *"validates
   every committed pack document under the closed policy"* going green unmodified.
2. **Migration completeness.** Every `blocking` entry in `content/drafts/` and
   `content/candidates/` carries a `clearance` with a resolving `subject`; every `resolved` entry
   carries a `resolved.clearance`; `make graduation-report` prints **zero** `(unspecified)`.
3. **The four stale entries clear without an author.** With the migration's Stage B leaving them
   `blocking`, one checker run demotes `mate-k-q-technique`, `mate-k-r-technique`,
   `mate-two-bishops` and `philidor-passive-rook-convert`'s `assessment_grounded` entries to
   `resolved`, and a test asserts exactly those four and no others. **This is the criterion that
   proves the vocabulary is a bridge and not a form.**
4. **Demotion is provable.** A negative test deletes a `tablebase_result` record from a fixture
   ledger and asserts `GRADUATION_RESOLUTION_STALE` fires **and `graduationReport(roots, { verify:
   true })` drops that pack from its graduable set**. **[cross-review] The draft said *"the gate
   predicate counts the entry as `blocking` again"*, which is not testable** —
   `graduationEntryIsBlocking` is a synchronous pure state read that never sees a ledger (§2.3a).
   The criterion is rewritten to assert the thing that actually changes, and criterion 4a below
   asserts the thing that does not.
4a. **The studio hole is asserted, not left implicit.** A test registers a stored draft whose
   `resolved.clearance` does not re-derive and asserts that `PackStudio.register` **succeeds** — the
   documented, bounded limit of §2.3a — together with a comment naming **D417** as its owner. A
   limit an RFC states and a test pins is a limit; a limit only the prose mentions is a surprise
   for whoever finds it next.
5. **`unbuilt` cannot launder.** A test asserts a `clearance.kind: "unbuilt"` entry cannot be
   `resolved` (error) and cannot be `accepted` (error), at an exact JSON pointer.
6. **Acceptance still costs a citation.** All 43 existing `accepted` entries carry a resolving
   `rulingRef` **and** a non-blank `unreachableBecause` after the migration;
   `content/accepted-conditions.md` is byte-identical to a fresh `make graduation-report` run and
   now contains the 5 Stage-C fixtures as the corpus's first `out_of_scope` entries.
7. **Emitters emit clearance.** `distill.ts`, `sourcing/openings.ts`, `sourcing/position-seeds.ts`
   and `sourcing/syzygy.ts` write a `clearance` **from a checked-in template registry this commit
   creates** — **[cross-review]** `pack-graduation` §1.6 specified one and it did not ship; all four
   emitters carry inline literals at HEAD `[V]` (§6.2). A freshly emitted document validates against
   the closed schema. Three of the four validate their own output and throw
   `SourcingError("EMITTED_PACK_INVALID")` (**D239**), so this is a landing requirement, not a
   follow-up. **Stage 0 fails loudly on an id the registry does not know**, which is how the 3
   non-templated candidate entries (§6.2) surface rather than silently take a wrong `clearance`.
8. **The graduable set is reported, not asserted.** `make graduation-report` runs from a clean
   checkout, prints `clearable` and `unclearable` per root, and its graduable-set line agrees with
   an independent re-derivation. **[cross-review] The expected value at landing is `(none)`, and
   the criterion should say so plainly**: §5.2a establishes that none of the 50 authored packs
   clears on instrument runs alone, so `clearable: 180 / unclearable: 40` over an unchanged
   `(none)` graduable set is the **passing** result. The criterion asserts the printed numbers match
   the re-derivation, never that the graduable set is non-empty — a landing that produced a
   graduable pack would be evidence of a **mis-assigned kind**, not of progress, and should be
   investigated before it is celebrated.
9. **Nothing else moved.** `DRILL_RUN_SCHEMA_VERSION` and `STORAGE_VERSION` are byte-identical; no
   `$defs` outside `graduationEntry` changed; `sourcing-check`'s severity rules are untouched.
10. **Digests.** At the **end of the landing commit**, `make sourcing-check` over every draft
    reports `0` `EVIDENCE_DIGEST_STALE`; whichever RFC lands second re-stamps every ledger its own
    change moved (**D209**).
11. **[cross-review] The classification is re-derivable by a second party.** The §5.1 ruleset ships
    as a checked-in classifier under `tools/`, and re-running it over `content/drafts/` reproduces
    the counts this RFC states (A 6 / B 38 + 40 / C 52 / D 24 / E 20 / F 28 / G 12, summing to
    **220**). Without this, no reviewer can check the numbers planning consumes, which is D245's
    lesson applied to this RFC rather than quoted by it.
12. **[cross-review] The citation guard is tightened and tested.** A test asserts that
    `accepted.rulingRef = "planning/exploration/log.md#L<n>"` **fails** when line *n* does not
    contain the ruling's quoted date, and that a `rulingRef` pointing at a file first added by the
    same commit raises `GRADUATION_RULING_SELF_MINTED`. All 43 committed acceptances still pass
    (§3.3's payability check), which is what makes the tightening free for the honest case.

## Open questions

1. **Do the 5 browser fixtures become `accepted`, or do they leave `content/drafts/`?** §6.2 Stage C
   accepts them as `out_of_scope`, which is cheap and correct-in-kind. The alternative — moving all
   six fixtures out of `content/drafts/` — is what **D227** and **D257** actually ask for, and it
   would delete the `.browser.json` suffix check in `graduation-report.ts:25` and fix every corpus
   denominator at once. **Recommended: accept them here and leave the move to whichever RFC owns
   D227**, because moving fixtures touches 16 files that hardcode draft paths (**D211**) and this
   RFC has no other reason to. *Author's call unless the owner wants the denominators fixed now.*
2. **Should `claim_bound` clear on attachment, or require a `measurement-records` `census.*`
   assertion?** §1.3 rules attachment, because the mechanism (`claimBindings`, pack 0.26) is landed
   and the assertion family is not. If `measurement-records` lands first, the corpus half of
   `claim_bound` has a stronger predicate available and should take it. *Not an owner call — a
   landing-order question, and §8 states the rule (whichever lands second adopts the other's
   vocabulary).*
3. **Is `GRADUATION_RESOLUTION_STALE` a warning or an error in `content/drafts/`?** §6.3 says
   warning in drafts, error in packs, on **D238**'s reasoning that a criterion which reddens the
   build for debt this RFC declines to pay is a criterion that gets waived. The counter-argument is
   that a stale *resolution* is not debt this RFC declines to pay — it is a false statement in a
   committed file, which is a different species from an unpaid blocker. **Recommended: keep it a
   warning for one wave, then flip**, owned by the first content wave that drives it to zero, which
   is the mechanism `pack-graduation` §5.1 already established for the sourcing ratchet. *Not an
   owner call; a severity ruling with a named trigger.*
4. ~~**Does the 12-entry `unreachable` residue get read before or after landing?**~~ **[cross-review]
   ANSWERED — before, and the recommended default was the wrong one.** The draft correctly
   identified this as *"the only place in this RFC where the safe default is not obviously the
   strict one"*, and then recommended the unsafe side anyway on the argument that `unreachable`
   alone still blocks. Two things break that argument:
   - **The residue is measurably `unbuilt`-shaped, not `unreachable`-shaped.** Sampled at HEAD, the
     entries matching no instrument keyword are dominated by missing *runtime surfaces* and *format
     encodings*, not by properties of the world: *"the drill has no fifty-move counter surfaced even
     though the annotations argue from it"* (×2 packs), *"the variants rule has no encoding … a
     root-identity field or pack-group would make the convert…"*, *"first-move alternatives cannot
     be deviations in a `follow_theory` pack … third/fourth attestation of wave-2 friction #3"*
     (×2), *"`pack-check` raises `PLAN_SIGNATURE_INLINED` on the copied expressions … the checker
     both demands and refuses the alternative"* `[V]`. **Every one of those names a thing someone
     could build.** They are the definition of `unbuilt` and the negation of `unreachable`.
   - **"It still blocks" is the argument that makes the default dangerous, not safe.** `unreachable`
     is the sole kind eligible for `accepted` (§2.4), and `unbuilt` **can never be** (§1.2). So the
     default routes a population of format gaps into the one bucket from which a later wave can
     launder them out with a citation — and the later wave will not re-read the statements, because
     the migration will have written a kind that looks considered.
   **Ruling: do not default. Classify all 12 by hand before landing and list them in this RFC**
   (§5.1's second obligation). Twelve rows is an afternoon, `unbuilt` needs a `blockedBy` a machine
   cannot invent, and this is the one place where §6.2's *"a wrong mechanical kind fails to clear
   rather than clearing wrongly"* safety argument **does not apply** — a wrong `unreachable` fails
   in the direction that clears. *No longer an owner call; the measurement decides it.*
5. **Who owns re-reading the 220 statements for compound conditions?** `pack-graduation` §1.3 rules
   that one entry states one condition and concedes the rule is not machine-enforceable; its §4.2
   found **42 of 48** resolution-marked entries were compound. A `clearance` with a single `subject`
   makes compoundness *visible* for the first time — an entry needing two subjects is compound by
   construction — but this RFC does not split any. **Recommended: the checker warns when an entry's
   statement is longer than a threshold and its clearance names one subject**, as a lead rather
   than a verdict. *Deferred to the first content wave; recorded so it is not rediscovered.*
   **[cross-review] Sharpened with a measurement the draft did not take:** the corpus's longest
   blocking statements are compound *by inspection* — one entry combines a digest-staleness fact, a
   named cause, a scope note and a remedy in a single paragraph; another combines a corpus-band
   refusal with an engine-pass finding. **A length threshold will therefore fire on the honest
   entries too**, since this corpus's authors write long *for a reason*. Prefer the structural
   signal the draft already identified — an entry whose statement names **two or more** distinct
   instruments (`engine` and `explorer`, say) while its clearance names one `kind` — which is a
   lead with a false-positive rate a reader can live with. Still deferred; the refinement is
   recorded so the first wave does not ship a length lint and then delete it.
6. **[cross-review] NEW — is `subject` one pointer or a list?** §1 fixes `subject` as a single JSON
   pointer, and open question 5 then observes that *"an entry needing two subjects is compound by
   construction"* — which is a **feature** only if the vocabulary can express the two-subject case
   at all. It cannot: the schema takes a string. So a genuinely compound entry has exactly two legal
   moves, **split it** or **file it under the kind that covers the widest of its conditions**, and
   the second is the one an author under time pressure takes. The alternative is
   `subject: string | string[]` with the predicate required to hold for **every** element, which
   costs one line of schema and makes the compound case expressible-and-honest instead of
   expressible-only-by-lying. *Author's call. Recorded rather than fixed in place because it
   touches §1's central shape and the RFC's author should decide whether compoundness is something
   the vocabulary tolerates or something it refuses.*

## Ledger rows

Added to `design/BACKLOG.md` by claude (this RFC does not edit the ledger — concurrent agents
collide on it).

**[cross-review] LANDED AS D404–D409, NOT D401–D408.** The draft minted D401–D408 as *"the block
above the highest id in use (D400)"*; claude had spent D401–D403 on the D400 reconciliation minutes
earlier, and the eight proposed rows landed as **six** — the two `unbuilt`/`unreachable` findings
merged, and the two claim-backing/47-of-50 findings merged. The renumbering is itself a ledger row
(*"Ledger id blocks collide when two agents are issued one in the same hour"*, 2026-08-16), and
**the highest id in use is now D415** `[V]`, so the cross-review rows below take **D416–D418**.
Mapping, so a reader of either numbering can follow:

| proposed | landed | row title as landed |
|---|---|---|
| D401 | **D404** | *`clearedBy` is populated in exactly zero of 436 graduation entries, so the only clearance lint fires zero times* |
| D402 | **D405** | *The rubber stamp already exists, and it is `resolved`, not `accepted`* |
| D403 | **D406** | *Four blockers are stale and nothing detects staleness* |
| D404 + D405 | **D407** | *`unbuilt` is being filed as work, and it is not work* |
| D406 | **D408** | *Acceptance needs no reviewer because it was never a person's act* |
| D407 + D408 | **D409** | *47 of 50 authored packs cannot graduate without new authoring, and the split is the finding* |

**Two landed rows carry figures this review corrected and need claude to amend them:** **D409**
says *"the census reads 254 claims with exactly 1 backed"* — it is **196** claims (§1.2), and
**D403**, three rows above it in the same file, already says 196 — and **D409**'s *"only 3 packs
graduate on instrument runs alone"* is refuted by §5.2a; the honest figure is **0 of 50**, with the
remaining split **23 instrument / 27 authoring**.

The eight rows as originally drafted are kept below unedited, because the landed rows are the
register and this section is now the *provenance* of them rather than a second copy.

- **D401** 🐞 *`clearedBy` shipped as an optional free-text field and is empty in 100% of the
  corpus.* 0 of 293 entries under `content/drafts/` and 0 of 143 under `content/candidates/` carry
  one, so `make graduation-report` prints `clears via (unspecified)` on all 220 blocking lines, and
  `GRADUATION_CLEAREDBY_UNRESOLVED` — guarded by `typeof row.clearedBy === "string"` — fires **zero
  times**. The general form: **an optional field that records the discharge condition of a
  mandatory gate is a field nobody writes**, and its lint is decoration until it is required.
- **D402** 🐞 *All 30 `resolved` entries carry one byte-identical `resolved.by`.* *"The recorded
  work was completed; the original statement remains as history."* — a migration placeholder in the
  state that is supposed to mean *the condition is gone and is checkable*. `accepted` was hardened
  against assertion by `rulingRef` and `resolved` never was, which inverts the priority: there are
  43 acceptances and there will be hundreds of resolutions. **The rare state got the guard and the
  common state got an author's word.**
- **D403** 🐞 *Four graduation blockers are stale and nothing detects staleness.*
  `mate-k-q-technique`, `mate-k-r-technique`, `mate-two-bishops` and `philidor-passive-rook-convert`
  each assert *"no sourcing sidecars were produced"* while carrying 25–27 `tablebase_result`
  records and passing `sourcing-check` at **strict** — i.e. `assessmentGrounding` returns
  `ledger_verified` for all four. Their debt was paid and the field never noticed. Counterweight
  measured in the same pass: all 16 *"no engine pass"* entries are true (0 `engine_eval` records
  each), so the corpus is honest with four exceptions — which is what makes a re-derived predicate
  the fix rather than an audit.
- **D404** 🐞 *A permanent refusal is filed as outstanding work in five committed fixtures.*
  `immediate-guard`, `outcome-hold`, `outcome-resist`, `stated-reasoning` and `trajectory-legs`
  each carry one `blocking` entry reading *"never publish as chess content"* — the definition of
  `accepted` / `out_of_scope`, the one `kind` with **zero** corpus instances. Same defect
  `pack-graduation` §0.2 found for the 37 no-review-workflow entries, surviving its own migration
  in a population Stage B did not read. The sixth fixture has zero blockers and is held out of the
  graduable set by a `.browser.json` suffix check.
- **D405** 💡 *`unbuilt` and `unreachable` are different, and conflating them is how a backlog
  becomes a permanent exemption.* *The instrument does not exist yet and someone owns building it*
  must keep blocking; *no instrument can ever exist, by a property of the world* is the only thing
  that may be accepted. 28 of 220 blocking entries are the first; ~12 are the second. `perfect_
  tablebase` opponent substitution is `unbuilt`; an eleven-piece position above the Syzygy bound is
  `unreachable`. **Only the second may ever be cited into `accepted`.**
- **D406** 💡 *Acceptance needs no reviewer because it was never a person's act.*
  `planning/content-era/plan.md` §3b already rules that an assertion no source and no instrument
  can reach *"stays ungrounded, permanently and in writing"* — so acceptance is **citing a decision
  that already exists**, which `GRADUATION_RULING_UNCITED` already checks mechanically. The struck
  reviewer role does not need a replacement; it needs its absence written into the vocabulary.
- **D407** 🐞 *The corpus has 254 feedback claims and exactly one backed claim.*
  `runExpressionCensus` reports it directly, split `author_principle` 82 / `corpus_observed` 60 /
  `derived_feature` 43 / `tablebase_exact` 37 / `hypothesis` 24 / `engine_validated` 8, and
  `claimBindings` — the pack-0.26 mechanism that makes a citation machine-visible — is used by **1
  of 32 ledgers**. Sharpens **D267** (*"no instrument in this repo can see a citation"*): one now
  can, and it is unused. The largest clearance class in the corpus (52 entries) is mechanizable and
  unpaid, and those are not the same word.
- **D408** 🐞 *47 of 50 authored packs cannot graduate without new authoring, and the two halves are
  different problems.* 23 wait on an instrument that does not exist (tablebase opponent selection,
  the game-level tempo corpus of **D155**, Maia practical difficulty, format gaps); 24 wait on a
  human to write chess judgement or find a source, which law 8 forbids manufacturing. Only 3 —
  `anti-french-advance-white`, `kid-classical-black`, `leningrad-dutch-black` — graduate on
  instrument runs alone. **A vocabulary that makes 108 of 220 entries mechanically decidable will
  produce a wave of green checks that reads as "nearly solved"**, and this number is the guard
  against that reading.

### [cross-review] New rows this review opens — **D416–D418**, for claude to land

- **D416** 🐞 *`pack-graduation` specified two lint codes and an emitter template registry, and none
  of the three shipped.* A sweep for `GRADUATION_[A-Z_]*` over `apps/`, `packages/`, `schemas/`,
  `content/` and `tools/` returns **seven** codes, and neither `GRADUATION_RESOLVED_WITHOUT_RESOLUTION`
  (§6, §1.1) nor `GRADUATION_ACCEPTED_WITHOUT_RULING` (§6) is among them `[V]`; the effect survives
  only because the schema happens to make both fields `required` + `nonEmptyString`. The *"named,
  checked-in template list — id plus template"* of §1.6 is likewise absent: all four emitters carry
  inline object literals (`openings.ts:115`, `position-seeds.ts:227`, `syzygy.ts:170`,
  `distill.ts:43`) `[V]`. **The general form is the one D400's reconciliation is already chasing,
  one tier lower: an RFC's acceptance criteria are checked against its *behaviour*, and a code name
  is not behaviour**, so a specified-but-unimplemented lint passes every gate the repo has.
  `graduation-clearance` cites both codes as shipped, which is how the gap surfaced.
- **D417** 🐞 *The graduation gate cannot see a ledger, so `resolved`-by-assertion survives on the
  studio route no matter what the corpus checker does.* `graduationEntryIsBlocking`
  (`pack-validation.ts:154–158`) is `state === "blocking"`, synchronous, one entry, no filesystem;
  `PackStudio.register` calls it over a document read from `pack_drafts.document_json`, which **has
  no `.evidence.json` beside it** `[V]`. So `GRADUATION_RESOLUTION_STALE` — however correct — reaches
  `content/drafts/` and `content/packs/` and can never reach the register. The bound is real
  (registered packs do not enter `content/packs/`, the only root a production image contains) and
  the hole is real, and **closing it is a storage change**: stored drafts would need a sidecar
  concept, which is a `STORAGE_VERSION` bump and a different RFC. Filed so the next author does not
  rediscover it as a surprise.
- **D418** 🐞 *`GRADUATION_RULING_UNCITED` checks that a citation is reachable, not that it is
  authoritative — and the one file its `#L` grammar accepts is appended to by every agent.* For
  `permanent_property` and `out_of_scope` the whole test is `existsSync` `[V]`. For `owner_ruling`
  the date test is `contents.includes(date)` over the **entire file**, where `date` is parsed from
  the author's own `ruling` string, and the `#L<line>` arm only asserts the file has that many
  lines — **the cited line is never read**. The sole accepted `#L` target is
  `planning/exploration/log.md`, which is append-only by law 7 and which every agent appends to as
  the last step of every task (it grew 59 lines between this RFC's drafting commit and its review
  `[V]`). **So an author can write a ruling, land it, and cite it in the same wave, and every lint
  passes.** This does not reinstate the struck reviewer — nobody grants anything — but it means
  *"acceptance is authorised by citing a decision that already exists"* is a **convention** today,
  not a mechanism. Remedy is three small tightenings, not a new role: read the cited line, extend
  date containment to all three `accepted.kind` values, and refuse a `rulingRef` whose target file
  was first added by the citing commit. **D242**'s second clause — *"verify payability before
  ratifying the lint"* — is the rule that would have caught this at `pack-graduation` time.

## Changelog

- 2026-08-16: created. `make graduation-report` re-run at HEAD rather than quoted: 56/220/30/43 for
  `content/drafts/`, 36/143/0/0 for `content/candidates/`, 0/0/0/0 for `content/packs/`, graduable
  `(none)`. `sourcing-check` run per-file over all 56 draft documents; `expression-census` run for
  the 254/1 claim-backing figures; the four stale `assessment_grounded` entries and the 16 truthful
  `no engine pass` entries verified against their ledgers' record kinds. Class counts in §1.2 and
  §5 are a hand audit over an ordered keyword ruleset, labelled as such per **D245**. Register
  facts re-checked at HEAD: pack `0.27` in `packages/schema/src/index.ts:2`, `0.28` recorded free
  in `rfc/README.md`, `STORAGE_VERSION = 22` in `apps/server/src/storage.ts:407`. **The tree moved
  during drafting** — `rfc/measurement-records.md` was rewritten in the working tree and
  `design/research/README.md` changed — so §8's two quotations and the 0.28 release were re-read
  after the rewrite rather than trusted (**D246**); `content/`, `schemas/`, `packages/schema/`,
  `apps/server/src/sourcing/`, `pack-validation.ts`, `pack-studio.ts` and the `Makefile` did not
  move, so every measurement above stands.
- 2026-08-16: **cross-reviewed by a second agent; RETURNED TO AUTHOR with corrections landed in
  place.** Every figure re-derived at HEAD rather than re-read, at a tree verified unchanged since
  the drafting commit `b9fd803` for `content/`, `schemas/`, `packages/schema/`,
  `apps/server/src/sourcing/`, `pack-validation.ts`, `pack-studio.ts` and the `Makefile` `[V]`.
  **D246 note: the working tree moved under the review too** — a concurrent `opponent-contracts`
  implementation landed uncommitted edits to `pack-validation.ts` (+7 lines at `:1002`, a
  `PERFECT_TABLEBASE_UNORDERED_OBJECTIVE` warning), `packages/schema/src/index.ts`
  (`DRILL_RUN_SCHEMA_VERSION` → `0.17`) and `schemas/drill_run.schema.json` while this review was
  running. **Every symbol and line this RFC cites was re-checked after those edits and none moved**:
  `graduationEntryIsBlocking` `:154`, `GRADUATION_ENTRY_LEGACY_SHAPE` `:830`, the `accepted` guard
  `:838`, the `clearedBy` guard `:860`, `GRADUATION_BLOCKING_ON_PUBLISHED` `:873`, and
  `DRILL_PACK_SCHEMA_VERSION` still `"0.27"` `[V]`. `content/`, `schemas/drill_pack.schema.json`,
  `pack-studio.ts`, `graduation-report.ts` and `apps/server/src/sourcing/` are untouched by that
  work, so every corpus figure stands.
  **Reproduced exactly:** 56/220/30/43, 36/143/0/0, 0/0/0/0, graduable `(none)`; 0 `clearedBy` keys
  in 293 + 143 entries; the guard `typeof row.clearedBy === "string"` at `pack-validation.ts:860`;
  one distinct `resolved.by` over 30 entries; 27/25/25/25 `tablebase_result` and four
  `sourcing-check` strict passes; 32 ledgers holding 391 `engine_eval` + 341 `tablebase_result`;
  1 ledger with `claimBindings`; 26 of 36 `authored-teaching-absent`; three `perfect_tablebase`
  entries; both `$defs` closed at 0.27; `STORAGE_VERSION` 22; `content/accepted-conditions.md`
  byte-identical to a fresh run. **Corrected:** the 254-claim figure (**196** claims; 254 is the
  citation count, `expression-census.ts:123` vs `:130`); §1.2's kind column, which summed to 225
  over a 220-entry population; *"kinds A–D"* used as both a range and a set, and the three
  different mechanical totals it produced; *"the seven graduation codes"* (six in
  `validatePackDocument`); the `GRADUATION_ENTRY_LEGACY_SHAPE` attribution in §7;
  `GRADUATION_RESOLVED_WITHOUT_RESOLUTION`, cited as shipped and **absent from the tree**; the
  emitter template registry, cited as shipped and **absent from the tree**; *"5 emitter templates"*
  (nine distinct, and 3 of the 143 candidate entries are not templated at all); the `16` no-engine
  entries (15–17 by ruleset, all true on every reading); two `:line` citations; and the D242 quote,
  whose dropped second clause is the one §3.2a needed. **Refuted:** *"3 packs graduate on instrument
  runs alone"* — **0 do** (§5.2a), because `attachExplorerEvidence` refuses to write pack prose and
  refuses to run without an explorer rationale line none of the three carries, and because
  `kid-classical-black`'s second blocker is D155's non-existent tempo corpus, which the same section
  lists as a non-existent instrument. **Added:** §1.4 (the residue of author discretion, with two
  normative fixes and one stated limit), §2.3a (the demotion gate is not wired to either consumer;
  the studio route stays open and is now bounded and tested), §3.2a (the citation guard is a
  reachability check, not an authority check — the back door is open and is narrowed rather than
  closed), §4.2's instrument-preconditions table, §5.1's re-derivability obligation, §5.2a,
  criteria 4a, 11 and 12, open question 6, and rows **D416–D418**. **Answered:** open question 4,
  against its own recommendation, on a measurement of the residue. **Kept: the pack 0.28 lane**, and
  §7 now argues it against the precedent that released the last claim rather than asserting it.
