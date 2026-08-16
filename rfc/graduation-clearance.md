# RFC: Graduation clearance — how a blocker stops blocking

- **Status:** draft
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-16
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
`GRADUATION_RESOLVED_WITHOUT_RESOLUTION` raises at error on a missing `at` or blank `by`.

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

### §1.2 The clearance kinds

Seven kinds, closed. The corpus population column is this RFC's hand audit over the 220 blocking
entries in `content/drafts/` — **classified by an ordered first-match keyword ruleset**, stated in
§5.1 with its residue, and **labelled a hand audit rather than a measurement** because
`pack-graduation` §4.3 established, on this same corpus, that *"a status recorded in prose cannot
be migrated mechanically."* The right-hand columns are shipped facts and are `[V]`.

| # | `kind` | Cleared when | Deciding predicate (shipped) | Corpus |
|---|---|---|---|---|
| A | `assessment_grounded` | `objective.grading.assessedBy` resolves against the pack's ledger | `assessmentGrounding(...)` returns `"ledger_verified"` (`apps/server/src/sourcing/ledger-validation.ts:427`) `[V]` | 6 |
| B | `ledger_record` | a record of a named `kind`, anchored to a named FEN, exists in the pack's `.evidence.json` and validates | `checkSourcingFile` over the pack. **Note the asymmetry:** the 32 committed ledgers hold only `position_legality` (32), `engine_eval` (391) and `tablebase_result` (341); `explorer_position_census` is a supported kind (`apps/server/src/sourcing/claim-binding.ts:93`) with **zero committed instances** `[V]` | 38 (engine) + 40 (corpus) |
| C | `claim_bound` | a `claimBindings` entry binds `subject` to a source with a matching text digest | `validateClaimBindings` (`apps/server/src/sourcing/claim-binding.ts:176`); `runExpressionCensus` reports `backing.backedClaims` per claim `[V]` | 52 |
| D | `shape_firing` | a named shape entry's trigger fires on at least one of this pack's positions | `runExpressionCensus` / `checkShapeFile`; the negative is already a code — `SHAPE_TRIGGER_NEVER_FIRES_IN_CORPUS` (`apps/server/src/shape-check.ts:13`) `[V]` | 24 |
| E | `pointer_authored` | the text at `subject` no longer matches the stated placeholder predicate | string comparison at `subject` against `clearance.placeholder` | 20 |
| F | `unbuilt` | **never here.** The instrument does not exist; `blockedBy` names who owns it | none — `blockedBy` path must resolve, reusing `GRADUATION_CLEAREDBY_UNRESOLVED` | 28 |
| G | `unreachable` | **never.** Neither a source nor an instrument can ever reach it; the entry is a candidate for `accepted` (§3) | none — the *unreachability* is what carries a citation | 12 residue + 5 fixtures |

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
over the corpus at HEAD reports **254 `feedbackClaims` and exactly 1 backed claim** `[V]`, split
`author_principle` 82 / `corpus_observed` 60 / `derived_feature` 43 / `tablebase_exact` 37 /
`hypothesis` 24 / `engine_validated` 8. The ledger row **D267** measured the consequence directly:
running `checkSourcingFile` before and after a 22-pack citation pass gave **32 of 47 clean at draft
severity and 4 of 47 at published severity, before and after** — *"no instrument in this repo can
see a citation."* `claimBindings` (landed at pack **0.26**) is the mechanism that changes that, and
it is used by **1 of 32 ledgers** `[V]`. So `claim_bound` is a real predicate over a nearly-unused
mechanism, and §5.3 prices that honestly rather than counting 52 entries as cheap.

### §1.3 What `claim_bound` checks, and what it refuses to check

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

## §2 `resolved` versus `accepted` — the rule

### §2.1 The rule

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

### §2.2 `resolved.by` stops being prose

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

### §2.3 A `resolved` entry that stops re-deriving demotes itself

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

### §2.4 The clearance ladder, and where the gate sits on it

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

## §3 Who may accept, and against what — without a reviewer

### §3.1 The constraint, stated exactly

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

### §3.2 The ruling: acceptance is authorized by a citation, not by a person

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

### §3.3 The one new obligation: an acceptance must state its unreachability, not its inconvenience

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
`unreachableBecause` too. **A citation requirement is a real guard only when the honest case pays
it once and the dishonest case cannot pay it at all** (`pack-graduation` **D242**), and that is the
standard this field is built to.

## §4 What the shipped instruments already clear

### §4.1 Four entries clear today, with no new work — measured

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

**The honest counterweight, run in the same pass:** 16 entries assert *"no engine pass has been run
on this pack"*, and **all 16 of those packs hold 0 `engine_eval` records** `[V]`. Not one is stale.
So the corpus's blockers are, with four exceptions, telling the truth — which is the finding that
makes this RFC a bridge rather than a cleanup. Only 32 of 50 packs have a ledger at all, holding
391 `engine_eval` and 341 `tablebase_result` records between them `[V]`.

### §4.2 The mechanical half, per class

108 of the 220 blocking entries (49%) fall in kinds A–D, whose predicate is a shipped instrument's
output:

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

### §4.3 What the instruments cannot see, priced

`claim_bound` (52 entries, the largest class) is mechanically checkable and **almost entirely
unpaid**: 1 of 32 ledgers carries `claimBindings`, and the census reports 1 backed claim of 254
`[V]`. D267 measured that a 22-pack citation pass moved the checker by zero. So the 52 are
*mechanizable* and are not *cheap*, and this RFC does not let the first word stand in for the
second. Each of the 52 needs a source found by a human, attached to a pointer, and digested — the
mechanism exists (0.26) and the work does not.

`pointer_authored` (20 entries) is the weakest predicate in the vocabulary and is stated as such: a
string comparison can prove a placeholder is *gone*; it can never prove what replaced it is *true*.
Law 8 forbids closing that gap with generated judgement, and this RFC does not try.

## §5 What cannot clear, quantified

### §5.1 The classification and its residue

The class counts above come from an ordered first-match keyword ruleset over the `statement` of all
220 blocking entries, evaluated in the order `unbuilt → corpus → citation → engine → tablebase →
shape → authored`. **Ordering matters and the order was chosen to be safe rather than flattering:**
`unbuilt` is tested first, so any entry that mentions a missing instrument is counted as
unclearable even when it also mentions an engine pass. **12 entries match no rule** and are counted
as `unreachable` residue pending an author's choice; they are listed in the planning directory at
implementation. `pack-graduation` **D245**'s lesson applies directly — *"a proxy built to be loose
cannot also be cited to the unit"* — so these figures are **a hand audit with a stated ruleset, not
a measurement**, and the only numbers in this RFC quoted to the unit are the ones a command printed.

### §5.2 Packs that cannot graduate without new authoring

Partitioning the 56 documents in `content/drafts/` by the classes their blocking entries fall in:

| Population | Documents | Reading |
|---|---|---|
| Zero blocking entries | **1** | `line-boundary.browser.json` — a fixture, excluded by suffix (§0.4) |
| Blocked **only** by mechanically-decidable kinds (A–D) | **3** | `anti-french-advance-white`, `kid-classical-black`, `leningrad-dutch-black` — these graduate on instrument runs alone |
| Blocked by at least one `unbuilt` entry | **23** | cannot graduate until an instrument that does not exist ships |
| Blocked by authored / citation kinds only (C, E, G) | **29** | of which **5 are browser fixtures** (§0.4) → **24 authored packs** |

`[V]` for the partition arithmetic (1 + 3 + 23 + 29 = 56); the class assignment inside it is §5.1's
hand audit.

**So the answer to *how many packs cannot graduate without new authoring* is 47 of 50 authored
packs**, and the two halves are different problems: **23 are waiting on an instrument** (tablebase
opponent selection, the game-level tempo corpus of **D155**, Maia practical difficulty, format
gaps) and **24 are waiting on a human to write chess judgement or find a source**. Only **3 of 50**
graduate on instrument runs alone.

**This is stated as a number rather than as a hope because the alternative is worse.** A vocabulary
that makes 108 entries mechanically decidable will produce a wave of green checks, and a reader who
does not have the 47 in front of them will read that wave as *graduation is nearly solved*. It is
not. The clearance vocabulary makes the distance measurable; it does not shorten it.

### §5.3 The class that no instrument will ever reach, named

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

## §6 Schema, lints and report

### §6.1 Schema — `$defs/graduationEntry`

`clearedBy` (`{ "$ref": "#/$defs/nonEmptyString" }`) is **replaced** by `clearance`, a closed
object:

```jsonc
"clearance": {
  "type": "object",
  "required": ["kind", "subject"],
  "properties": {
    "kind": { "enum": ["assessment_grounded", "ledger_record", "claim_bound", "shape_firing",
                       "pointer_authored", "unbuilt", "unreachable"] },
    "subject": { "type": "string", "pattern": "^/" },
    "instrument": { "$ref": "#/$defs/nonEmptyString" },
    "blockedBy": { "$ref": "#/$defs/nonEmptyString" },
    "placeholder": { "$ref": "#/$defs/nonEmptyString" }
  },
  "additionalProperties": false
}
```

`clearance` is **required** when `state` is `"blocking"`; the existing `oneOf` already forbids the
old `clearedBy` on `resolved` and `accepted` and the same binding carries over to `clearance`, with
one change: `resolved` **requires** `resolved.clearance` (§2.2). `accepted` gains a required
`accepted.unreachableBecause` (§3.3).

**`$defs/provenance` is `additionalProperties: false` at pack 0.27** and `$defs/graduationEntry` is
`additionalProperties: false` too `[V]`. The brief asked whether `provenance`'s openness is a
licence or a trap here: **it is neither — it is stale.** `pack-graduation` closed it, deliberately,
as the whole of its §3.1. There is no unversioned hiding place, and inventing one would mean
reopening the object that RFC closed. The lane is claimed instead (§7).

### §6.2 Migration — mechanical, 363 entries, no judgement

| Stage | Population | Rule |
|---|---|---|
| 0 | `content/candidates/` — 143 entries, 36 documents | each of the 5 emitter templates gets one checked-in `clearance` in the template registry `pack-graduation` §1.6 shipped; the emitters write it and Stage 0 backfills the same object. No judgement: the id is already keyed on the template `[V]` |
| A | `content/drafts/` — 220 blocking entries | the §5.1 ruleset assigns a candidate `kind`; **`unreachable` is the default for the 12 residue**, and every assignment is written into the commit for review as a diff |
| B | `content/drafts/` — 30 resolved entries | each gains `resolved.clearance`; the 4 measured stale ones (§4.1) are **not** hand-resolved — the checker resolves them, which is the migration's own first test |
| C | 5 browser fixtures (§0.4) | `blocking` → `accepted`, `kind: "out_of_scope"`, `unreachableBecause` naming the fixture role. First `out_of_scope` instances in the corpus |

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

### §6.3 Lints

Added to `validatePackDocument` (`apps/server/src/pack-validation.ts`), alongside the seven
graduation codes it already raises:

| Code | Condition | Severity |
|---|---|---|
| `GRADUATION_CLEARANCE_MISSING` | `state: "blocking"` with no `clearance` | error |
| `GRADUATION_CLEARANCE_SUBJECT_UNRESOLVED` | `clearance.subject` is not a pointer that resolves in this document | error |
| `GRADUATION_CLEARANCE_INSTRUMENT_MISSING` | a mechanical `kind` (A–E) with no `instrument` | error |
| `GRADUATION_CLEARANCE_BLOCKEDBY_UNRESOLVED` | `kind: "unbuilt"` with a missing or non-existent `blockedBy` path | error (replaces the warning-level `GRADUATION_CLEAREDBY_UNRESOLVED`) |
| `GRADUATION_RESOLVED_WITHOUT_CLEARANCE` | `resolved` with no `resolved.clearance`, or one whose kind is `unbuilt`/`unreachable` | error |
| `GRADUATION_ACCEPTED_WITHOUT_UNREACHABILITY` | `accepted` with missing/blank `unreachableBecause` | error |
| `GRADUATION_RESOLUTION_STALE` | a `resolved` entry whose `resolved.clearance` no longer re-derives (§2.3) | warning in `content/drafts/`, **error** in `content/packs/` |

`GRADUATION_RESOLUTION_STALE` is the one that matters, and it is the only one that requires the
ledger, so it lives in `checkSourcingFile` (which already reads the sidecar) rather than in
`validatePackDocument` (which does not). `pack-graduation` criterion 14 already wired
`checkSourcingDirectory` over `content/packs/` at strict inside `make verify` and a ≤15-of-47
ratchet over `content/drafts/`; **this RFC adds a predicate to a sweep that already runs and adds
no new sweep.**

### §6.4 The report

`graduation-report.ts:39` changes from `clears via ${entry.clearedBy ?? "(unspecified)"}` to
printing `clearance.kind` + `clearance.subject` + the checker's verdict — `holds` / `does not hold`
/ `no predicate`. Two lines are added to each root's header: **`clearable: N`** (blocking entries
whose kind is A–E) and **`unclearable: N`** (`unbuilt` + `unreachable`), because the whole point of
the vocabulary is that those two numbers stop being the same number. **No merged corpus-wide total
is printed**, per `pack-graduation` §3.3 and **D243**, unchanged.

## §7 Register and version claims

- **Pack schema: claims 0.28.** `rfc/README.md`'s pack-version register records *"0.28 is the next
  free pack lane"* `[V]`, released by `opponent-contracts` at cross-review (*"NO pack lane — 0.28
  released and remains free"*) `[V]`. `DRILL_PACK_SCHEMA_VERSION` reads `"0.27"` and the schema
  `$id` is `urn:chess-tabiya:schema:drill-pack:0.27` `[V]`. The lane is **earned**, not
  discretionary: `$defs/graduationEntry` and `$defs/provenance` are both
  `additionalProperties: false` at 0.27, so `clearance` cannot be added without a version. This RFC
  does not edit `rfc/README.md`; it **requests** the row.
- **`STORAGE_VERSION`: nothing.** No table, no column, no bump, and therefore **no migration
  position is claimed**. `STORAGE_VERSION` reads **22** (`apps/server/src/storage.ts:407`) `[V]`,
  and the register's rule — *"MIGRATION NUMBERS ARE ASSIGNED AT LANDING, NOT AT CLAIM"* — is not
  reached, because this RFC holds no migration to number. `pack_drafts.document_json` and
  `registered_packs.document_json` store whole documents as JSON blobs, and
  `GRADUATION_ENTRY_LEGACY_SHAPE` already fails an old-shape stored draft closed as `blocking`
  (`pack-validation.ts:830`) `[V]` — a stored draft carrying a `clearance`-less entry refuses to
  register rather than requiring a rewrite, which is the same compatibility rule `pack-graduation`
  §8.2 used to avoid a migration and it holds unchanged here.
- **Run schema: nothing.** Clearance is never persisted in a run — no event, no occurrence, no
  policy. `DRILL_RUN_SCHEMA_VERSION` is byte-identical.
- **Shape-entry schema: nothing.** `shape_firing` reads the shape entry; it does not extend it.
- **Nothing versioned was preferred and is not available.** §6.1 states why.

## §8 Relationship to `rfc/measurement-records.md`

`measurement-records.md` (draft, returned to author at cross-review) is adjacent and does not
collide. **It was rewritten in the working tree while this RFC was being drafted (277 insertions),
so both quotations below were re-checked against the file after the rewrite and both survive
verbatim** — `pack-graduation` **D246**'s rule applied (*"an RFC round that measures a moving tree
must pin its commit and re-check the lanes"*). Its 0.28 release also survives the rewrite: *"0.28
remains the next free lane and this RFC leaves it free"* `[V]`, which is the lane §7 claims.

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
§4.3 and §5.3: no clearance kind grades a move, and `pointer_authored` is explicitly stated to
prove absence rather than truth.

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
   ledger and asserts `GRADUATION_RESOLUTION_STALE` fires and the gate predicate counts the entry
   as `blocking` again.
5. **`unbuilt` cannot launder.** A test asserts a `clearance.kind: "unbuilt"` entry cannot be
   `resolved` (error) and cannot be `accepted` (error), at an exact JSON pointer.
6. **Acceptance still costs a citation.** All 43 existing `accepted` entries carry a resolving
   `rulingRef` **and** a non-blank `unreachableBecause` after the migration;
   `content/accepted-conditions.md` is byte-identical to a fresh `make graduation-report` run and
   now contains the 5 Stage-C fixtures as the corpus's first `out_of_scope` entries.
7. **Emitters emit clearance.** `distill.ts`, `sourcing/openings.ts`, `sourcing/position-seeds.ts`
   and `sourcing/syzygy.ts` write a `clearance` from the checked-in template registry; a freshly
   emitted document validates against the closed schema. Three of the four validate their own
   output and throw `SourcingError("EMITTED_PACK_INVALID")` (**D239**), so this is a landing
   requirement, not a follow-up.
8. **The graduable set is reported, not asserted.** `make graduation-report` runs from a clean
   checkout, prints `clearable` and `unclearable` per root, and its graduable-set line agrees with
   an independent re-derivation. **The expected value at landing is the 3 packs of §5.2 minus
   whatever their instrument runs have not yet produced — plausibly still `(none)`, and the
   criterion asserts the printed number matches the re-derivation, never that it is greater than
   zero.**
9. **Nothing else moved.** `DRILL_RUN_SCHEMA_VERSION` and `STORAGE_VERSION` are byte-identical; no
   `$defs` outside `graduationEntry` changed; `sourcing-check`'s severity rules are untouched.
10. **Digests.** At the **end of the landing commit**, `make sourcing-check` over every draft
    reports `0` `EVIDENCE_DIGEST_STALE`; whichever RFC lands second re-stamps every ledger its own
    change moved (**D209**).

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
4. **Does the 12-entry `unreachable` residue get read before or after landing?** §5.1 defaults them
   to `unreachable` and §6.2 Stage A writes every assignment as a reviewable diff — but
   `unreachable` is the one kind that is a candidate for `accepted`, so defaulting *to* it is the
   unsafe direction, and it is the only place in this RFC where the safe default is not obviously
   the strict one. The alternative is defaulting them to `pointer_authored` with the pack root as
   subject, which is always blocking and always honest but is also a lie about what the entry says.
   **Recommended: default to `unreachable` and require the migration commit to list all 12 with
   their statements in its message**, since `unreachable` alone still blocks — only `unreachable`
   **plus a resolving ruling citation** accepts, and the migration writes no citations. *Author's
   call; recorded because the reasoning is one step longer than the other defaults.*
5. **Who owns re-reading the 220 statements for compound conditions?** `pack-graduation` §1.3 rules
   that one entry states one condition and concedes the rule is not machine-enforceable; its §4.2
   found **42 of 48** resolution-marked entries were compound. A `clearance` with a single `subject`
   makes compoundness *visible* for the first time — an entry needing two subjects is compound by
   construction — but this RFC does not split any. **Recommended: the checker warns when an entry's
   statement is longer than a threshold and its clearance names one subject**, as a lead rather
   than a verdict. *Deferred to the first content wave; recorded so it is not rediscovered.*

## Ledger rows

To be added to `design/BACKLOG.md` by claude (this RFC does not edit the ledger — concurrent agents
collide on it). **Id block D401–D408**, minted above the highest id in use (**D400**) `[V]`.

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
