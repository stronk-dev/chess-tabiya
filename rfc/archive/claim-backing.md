# RFC: Claim backing — an instrument record may back an author's sentence without replacing it

- **Status:** implemented 2026-08-16
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-15
- **Design refs:** `design/05-in-run-experience.md` §3 (the assistance ladder; **rung 5** — *"Authored
  claims … with no review workflow (owner ruling 2026-08-13) provenance is the only safeguard"*).
  This RFC is entirely about what *provenance* means at that rung, and it does not touch the
  disclosure model, the rungs, or the delivery timing. `design/03-product-breadth.md` B4 (the
  evidence-and-explanation gate) is informed, not closed.
- **Exploration gate:** owner ruling 2026-08-15 on **D97**. Offered three admission rules for the 61
  unbacked claims — withhold all (49.0%), deliver with stated absence (78.2%), tier by label
  (79.1%) — the owner refused all three: *"why not fix them properly?"* The ruling is that the debt
  becomes **payable**, not that the product picks which authored sentences to drop. Third landing of
  this ruling in this shape (cf. *"we need to fix this asap. fix all to include it properly. we are
  the authors"*).
- **Ledger rows this RFC owns**, cited by title because the tree moved repeatedly today: *37 of the
  61 unbacked claims can NEVER earn admission* (**D97 🐞**) and *Support pointers are index-keyed
  into `feedbackClaims`* (**D98 🐞**). D98 is **closed by this RFC**; D97 is converted from a
  permanent refusal into a measured, payable debt with a named residue.
- **Ledger rows this RFC opens** (law 4): *No position in the corpus has a complete legal-move
  tablebase census, and thirteen claims assert one* (**D110 🐞**); *Five claims assert what no
  instrument in this repository measures* (**D111 🐞**); *`$defs/feedbackClaim` is
  `additionalProperties: true`* (**D112 🐞**). **[cross-review] Seven more opened by the
  cross-review** (`D128`–`D136`), each named at the point in the body where the measurement that
  found it sits. **`[round 2]` Ten more (`D163`–`D172`)** — the id block issued for this round, and
  no id outside it was minted — each likewise named where its measurement sits, not here. **D112 is
  closed by this round**, at zero corpus cost (§5.1).
- **Owner rulings this RFC now carries, 2026-08-16.** `[round 2]` The cross-review escalated one
  finding as unfixable — *the residual sweep guarantees numerals, not propositions* (**D131**) — and
  proposed shipping with the ceiling stated. **The owner refused that**, as he refused the
  withhold/deliver fork before it, and ruled twice. **(1) Route the claim; do not forbid the
  sentence.** The boundary was never *"never say Black is better"*; it is *"never say it **as corpus
  observation**"*. A verdict is a legitimate thing for an author to assert and illegitimate only when
  it wears an instrument's label, so an unbound assertion is **not refused** — it forces the claim to
  carry `author_principle` and the delivery path to attribute it as the author's judgement. §2.1
  states the design, §3.4a the rule, §3.9 the label consequence, §3.11 the delivery, §4.1 the payoff.
  **(2) Build the principle registry.** The cross-review found the `authored` fence decorative —
  nothing checks that `author_principle` names a principle — so the relabel is a one-array-element
  escape from every machine check (**D135**). `author_principle` becomes a **resolving reference**
  against `content/principles/`, following `ShapeRegistry` rather than inventing a second pattern
  (§3.10). Ruling 2 is a precondition of ruling 1: the rung the routing targets has to be real before
  the routing means anything, which is why **this round claims pack 0.26 rather than releasing it**
  (§5.1).
- **Ledger row this RFC now owns and did not cite** `[cross-review]`: **D126** — *are explorer W/D/B
  result splits admissible as `corpus_observed`?* — was **owner-ruled ADMISSIBLE 2026-08-15** at
  `4e19b95`, after this draft was written, and the ruling names *"`rfc/claim-backing.md` (the
  `explorer_position_census` record kind)"* as its owner. The ruling carries a boundary — **"the
  split may be stated; it may never be converted into a move verdict or a quality claim"** — and
  §3.7 and §2 below are amended because **the residual sweep cannot enforce that boundary** —
  `[round 2]` and §3.7's round-2 note records that owner ruling 1 does enforce it, by refusing the
  label the verdict was riding rather than the clause itself.
- **Depends on:** nothing unlanded. `rfc/archive/content-sourcing-foundation.md` ships the evidence
  ledger and `sourcing-check`; `rfc/archive/opening-evidence-path.md` ships the engine records;
  `rfc/archive/fixture-realism.md`'s D64 completion (`8b1b44d`, archived at `8bf2de8`) supplies the
  live tablebase records this RFC binds against.
- **Parent / amends:** amends `rfc/archive/content-sourcing-foundation.md` at `evidenceSupports`
  and the evidence-ledger shape. Amends nothing in the pack format.
- **Supersedes / superseded by:** —
- **Planning:** `planning/archive/claim-backing/`

*Every code site below was read in a clean tree at **`d2f34f9`** on 2026-08-15, and every corpus
figure was derived from the committed `content/` tree at the same commit. **Re-verified at
`8bf2de8`**, which moved `rfc/`, `planning/` and `packages/runtime` but left
`apps/server/src/sourcing`, `content/`, `schemas/` and `packages/schema` **byte-untouched** — so
every figure and every code citation below stands at that commit too. An uncommitted
`content/drafts/maroczy-bind-white-squeeze.json` (3 claims, 1 `corpus_observed`) appeared in the
working tree during drafting and is **excluded**: §4 measures the committed corpus, and it is
recorded here so whoever re-derives after that pack lands expects 38 packs and 134 claims rather than
37 and 131. Three sibling drafts (`engine-leverage`, `vocabulary-wiring`, `format-surface`) hold
lanes ahead of this one and `rfc/feedback-delivery.md` lands behind it. **Locate by symbol name — no
line number in this document is normative.***

> **[cross-review] Re-verified at `67f6ee0` (2026-08-15), and the corpus half of the paragraph above
> is now wrong.** `git diff d2f34f9..67f6ee0 -- apps/server/src/sourcing schemas packages/schema`
> is **empty**, so **every code citation in §1, §3 and §5 stands unchanged** and every structural
> figure over the twelve tablebase packs reproduced exactly (§1.2, §1.3b, §1.3c below carry the
> re-derivations). But **`aee7c64` landed ten packs, not one.** The draft predicted "38 packs and
> 134 claims"; HEAD carries **61 drill packs, 47 of them with claims, 166 claims / 45,289 chars, of
> which 75 carry a machine-checkable label** — `corpus_observed` 36 (was 23), `tablebase_exact` 37
> (unchanged), `engine_validated` 8. Day zero is therefore **91 of 166 delivered (52.1% of claim
> prose)**, not 70 of 131 (49.0%). §4's *shape* survives — every bucket argument is about kinds of
> debt, not about the size of the corpus — but **every number in §4 is a `d2f34f9` number and is
> labelled as one there.** Criterion 9 already says the shipped figure wins over §4; the
> cross-review makes that binding rather than gracious. Three further figures in the body were
> falsifiable and one criterion was vacuous — §1.3(a)'s census total, §1.3(c)'s absent-value list,
> the Summary's percentage labelling, and criterion 9's threshold. Each is corrected where it lives,
> below, not here. **D134.**
>
> The second corpus movement is worse than a stale count. Packs **with claims and no evidence ledger
> at all** went from **5 (20 claims, 1 machine-labelled)** to **15 (55 claims, 15 machine-labelled)**.
> §4's Bucket 2 rests on *"the instrument exists and is wired, but the query was never recorded"*;
> for those ten new packs **there is no sidecar to record into**. That is a third kind of debt the
> draft does not name, and §4 now names it. **D128.**
>
> **`[round 2]` Re-derived at `ab662f9` (2026-08-16), independently again, and the corpus moved once
> more.** `git diff 67f6ee0..ab662f9 -- apps/server/src/sourcing schemas/drill_pack.schema.json` is
> **not** empty this time — `engine-leverage` landed at `18d2832` and took `DRILL_PACK_SCHEMA_VERSION`
> and the `$id` to **0.23** with `$defs/engineCondition` and a fourth `deviationCost` arm — but it
> touched **nothing this RFC cites**: `check.ts`'s `PROSE_POINTERS`, `explorerTemplate`,
> `engineTemplate` and the `evidenceSupports` guard are byte-identical, `explorer.ts`'s two pack
> mutations are still two lines apart, and `$defs/feedbackClaim` is unchanged. **Every code citation
> in §1, §3 and §5 stands at HEAD.** `[V]`
>
> The corpus: `da77c56` added **16** `corpus_observed` claims across eleven packs with live-requeried
> result splits, exactly as briefed. HEAD carries **53 pack files in `content/drafts/`, 47 of them
> with claims, 182 claims / 54,739 chars, of which 91 carry a machine-checkable label** —
> `corpus_observed` **52** (was 36), `tablebase_exact` 37 (unchanged since `d2f34f9`),
> `engine_validated` 8 (unchanged). Day zero is **91 of 182 delivered = 50.0% of claims and 43.1% of
> claim prose**. `[V]` The **68 ledgers / 893 records** figure reproduces exactly at HEAD — 32
> `<stem>.evidence.json` beside the drafts plus 36 `evidence.json` inside `content/candidates/*/`,
> which is the split that makes "68" and "32" both correct and is recorded here so the next
> re-derivation does not think one of them is a bug. Kind census unchanged: `engine_eval` 415,
> `tablebase_result` 341, `position_legality` 59, `opening_identity` 52, `puzzle_provenance` 26,
> `explorer_frequency` **0**. **0 of 893 records support a `/feedbackClaims/…` pointer, 0 carry any
> `templateId`, 0 ledgers carry `claimBindings`, and 0 of 53 packs have a duplicate claim id** — so
> every measured cost in §3.2 and §5.1 is still zero. The 15 ledger-less-packs-with-claims figure is
> unchanged as a pack count and has grown as a claim count: **15 packs / 71 claims / 31
> machine-labelled**, up from 15/55/15, because `da77c56` grounded exactly those packs. **D128 got
> worse, not better, and it got worse in the machine-labelled column.**

## Summary

`/feedbackClaims/<i>/text` is a `PROSE_POINTER` (`PROSE_POINTERS`, `apps/server/src/sourcing/check.ts`).
The overreach gate inside `evidenceSupports` refuses any record supporting it unless the record is a
registered explorer or engine template — and **both templates then require the supported prose to be
the byte-exact rendered sentence** (`explorerTemplate`, `engineTemplate`; the comparisons against
`renderExplorerFrequency` and `renderEngineMoveLoss`). So the contract does not merely lack a
prose-preserving attachment path; **it forbids one**. The single shipped emitter proves it from the
other side: `attachExplorerEvidence` (`apps/server/src/sourcing/explorer.ts`) assigns
`pack.feedbackClaims[claimIndex].text = renderExplorerFrequency(values)` — it *substitutes* the
author's sentence and then records evidence for the sentence **it** wrote.

This RFC builds a second door beside that one and does not widen it. **`record.supports` keeps its
fence exactly as shipped** — in fact this RFC makes it *stricter*, by removing the two template
exemptions that let a claim pointer through at all. Claim backing moves to a new ledger artifact,
**`claimBindings`**, in which an author declares — span by span, in their own sentence — which
verbatim fragments are instrument readings and which fragment came from which record. The validator
then re-derives each reading from records **already in that pack's ledger** and requires the
author's own words to match it. A span the author does not declare, and that looks like a machine
reading, is a **refusal**.

The binding is therefore not "a record is stapled to a sentence". It is: *every **segment** of the
sentence is attributed — to an instrument, by a record the validator re-derives, or to the author, by
a named principle — and the learner is shown which segment is which.*

> **`[round 2]` That sentence said "every cardinal, move token and result word", and the owner ruled
> the guarantee must be about segments instead.** The token form is the one the cross-review proved
> could not hold (**D131**): a proposition built out of none of those tokens has an empty residual and
> ships unexamined. Segment attribution is the form that fires there, because a segment with no
> bindable token is not silently admitted — it is *attributed to the author*, which is a disposition
> rather than an absence. The token machinery survives intact underneath it (§3.4's frozen
> normalisation table, ordinals included) as the check on what a bound span may say; what changed is
> that it is no longer asked to certify completeness it cannot deliver. **The sweep's alphabet was
> never the problem. Treating an unbound proposition as nothing to disposition was.** **D163.**

> **[cross-review] That sentence said "every numeral" and it could not.** The frozen table in §3.4
> is *"an English cardinal 0–999"*, and the corpus's numerals are not all cardinals: **24 of the 75
> machine-labelled claims at HEAD carry an ordinal**, and in this corpus ordinals are chess
> geometry, not decoration — *"every rook slide along the **sixth** rank"* (`tempo-is-the-lesson`),
> *"rook to the **fourth**"* (`bridge-not-squeeze`), *"the **third** rank"*, *"queen-versus-**seventh**-pawn"*.
> An ordinal is invisible to a cardinal sweep, so it is neither checked nor declared and the promise
> was false as written. §3.4 now extends the frozen table to ordinals and states what that costs.
> **D129.** The claim is narrowed here rather than in a banner, because the narrowed claim is the
> one the mechanism can keep.

**`[round 2]` Pack schema 0.26 is CLAIMED. The draft released it and the release is withdrawn — say
this loudly, because it inverts a headline finding two rounds carried.** Owner ruling 2's principle
registry needs somewhere on the claim to name the principle it resolves, `evidenceTypes` is a bare
enum array with no slot for an id, and `$defs/feedbackClaim` is the only place the reference can live
where **every** claim carrying the label can be checked — including the 18 that sit in packs with no
evidence ledger, which a ledger-side reference would never reach. So 0.26 adds
`$defs/feedbackClaim.principles` and, in the same lane and at zero corpus cost, flips that `$def` to
`additionalProperties: false`, **closing D112**. Everything else the draft claimed still holds: no
migration, no run-schema stamp, no `EvidenceKind` beyond `explorer_position_census`. What is no longer
true is *"no committed pack byte changes, no content digest moves"* — the migration edits 35 packs and
moves their digests, and §5.1 prices that in full rather than in a footnote. **The debt was never a
format problem; the safeguard for the rung it routes to is.** **D169.**

**Measured outcome, and the honest half** `[V]`, **all at `d2f34f9`; the corpus is 166 claims and 75
machine-checkable labels at `67f6ee0` and the shape below is what survives, not the totals**. Of the
61 claims carrying a machine-checkable label:
**20 become backable with the records already committed** (an authoring pass, zero instrument runs);
**36 become payable** — the instrument exists and is wired, but the query was never recorded, in a
few cases never run; and **5 must still fail**, because no instrument in this repository measures
what they assert. Delivered claims, and separately the share of claim **prose** they carry (against
`rfc/feedback-delivery.md`'s delivery path, all at `d2f34f9`):
**70/131 claims = 53.4% of claims and 49.0% of prose, day zero → 90/131 = 68.7% / 64.5% after a
binding pass → 126/131 = 96.2% / 95.4% after the instrument waves → never 131.** If it admitted 131
it would be a licence, not a binding.

> **[cross-review] The percentages were attached to the wrong denominators.** The draft wrote
> "70/131 (49.0%) → 90/131 (64.5%) → 126/131 (95.4%)", which reads as though 49.0% were 70 of 131.
> It is not: **70/131 = 53.4%**, and 49.0% is the *character* share — 15,963 of 32,560 — because, as
> `rfc/feedback-delivery.md` §3.2 already says in as many words, *"the withheld claims are slightly
> longer on average, because the machine-checkable ones are the ones carrying numbers"*. §4's table
> labels its column correctly; the Summary did not, and a summary that misstates its own headline
> number is the failure this project keeps recording. Both series are now written out. All of §4's
> arithmetic was re-derived and **is internally exact** — 20+36+5 = 61, 70+20 = 90, 90+36 = 126,
> 15,963+5,040 = 21,003, +10,061 = 31,064, 32,560−31,064 = 1,496 `[V]`.

## Motivation

### The problem, stated as the review stated it

*A debt you are forbidden to pay is not a debt, it is a silent deletion with a rule attached.*

`rfc/feedback-delivery.md` measured what withholding the 61 costs and found the withheld set is not
a queue: 37 of them fail `EVIDENCE_OVERREACH` at **error** severity permanently, because
`tablebase_result` can be neither registered template. The owner refused every admission rule
offered and ruled that the contract itself is what must change.

### The tension this RFC must not resolve the easy way

The byte-exact requirement is not an accident and it is not over-strictness. It is the *reason* a
templated record can validate prose at all: if the sentence is generated from the same `values` the
record carries, then the sentence says what the instrument measured, by construction. Relax that
naively — "a record may support any prose it names" — and an author writes anything, staples a
record to it, and the product ships a false provenance statement with a machine's authority behind
it. That is **law 8 / ADR-0005** through the front door.

So the design question is exact: **what is the weakest binding between a record and a sentence that
still makes the sentence's factual content answerable to the record?** §2 evaluates five answers and
states what each admits that it should not.

### Scope

**In scope:** the evidence-ledger artifact that binds a record to authored prose; the validator rules
that check it; the retirement of the prose-substituting emitter; the index-keying of claim pointers
(D98); the delivery-side signal a bound claim carries.

**Explicitly out of scope**, each with its reason:

- **When and to whom a claim is delivered.** That is `rfc/feedback-delivery.md`'s C1/C2, and this RFC
  changes none of it. §6 lists exactly which of that RFC's criteria move.
- **Authoring the bindings.** Not one binding is authored here. §4's figures are what an authoring
  pass would reach, measured against records that already exist.
- **Running the missing instruments.** §4's Bucket 2 is a wave, not a specification. This RFC
  specifies the shape the wave must write into and refuses to pretend the wave has happened.
- **Anchoring a claim to a position.** `feedback-delivery`'s Open question 4. A binding names FENs,
  so a machine-checked position set falls out of this work as a by-product — recorded in Open
  question 3, not claimed.
- **`deviation.cost`, engine conditions, per-leg vocabulary.** `engine-leverage`, `vocabulary-wiring`
  and `format-surface`'s territory. §5.2 states the interfaces.

## Specification

### 1. What ships today, verified at `d2f34f9`

#### 1.1 The refusal, located by symbol

`PROSE_POINTERS` (`check.ts`) holds five patterns; `/^\/feedbackClaims\/\d+\/text$/` is one. Inside
`evidenceSupports`, each `record.supports` pointer is tested: a prose pointer raises
`EVIDENCE_OVERREACH` unless the record satisfied `explorerTemplate` or `engineTemplate`. `issue(...)`
(`ledger-validation.ts`) defaults its severity parameter to **`error`**, so unlike
`EVIDENCE_TYPE_UNBACKED` — which passes `published ? "error" : "warning"` explicitly — the overreach
refusal is fatal on a draft pack too.

Both template functions return `false` before any value check unless the kind matches:
`explorerTemplate` on `record.kind !== "explorer_frequency"`, `engineTemplate` on
`record.kind !== "engine_eval" || record.templateId !== ENGINE_MOVE_LOSS_TEMPLATE_ID`. **There is no
branch of either that `tablebase_result` can enter.** `[V]`

Both then require the byte-exact sentence: `explorerTemplate` resolves the supported pointer and
compares `target.value !== renderExplorerFrequency(values)`; `engineTemplate` compares against
`renderEngineMoveLoss(values)`. Each raises `EVIDENCE_OVERREACH` on any difference. `[V]`

#### 1.2 The instrument already ran — re-verified here, not taken on trust

The owner's brief asserted this and required independent verification at HEAD. All four parts hold
`[V]`:

| | measured at `d2f34f9` |
|---|---|
| packs holding `tablebase_exact` claims | **12** |
| of those, packs holding `tablebase_result` records | **12** (zero exceptions) |
| `tablebase_result` records across the corpus | **341** (14–52 per pack) |
| tablebase HTTP manifest entries whose `retrievedAt` matches the D64 synthesis signature | **0 of 341** |

The manufactured-provenance check was re-derived from first principles against
`manufacturedTablebaseTimestamp` (`ledger-validation.ts`) — `sha256(fen).slice(7,15)` interpreted
modulo 86,400,000 from 2026-08-14 — over every committed `*.sources.json`. **Zero matches.** D64 is
closed and stays closed; `8b1b44d` replaced the 135 fabricated records with live responses rather
than withdrawing them. `[V]`

And the coverage is better than "the instrument ran". Over the 12 packs `[V]`:

- **the root FEN is recorded in 12 of 12** — so root `category`, `dtm`, `dtz` and `pieceCount` are
  in hand for every pack;
- **every authored spine position is recorded: 229 of 229** — so "every position along the authored
  line was queried and remains a win" is a re-derivable statement, not an assertion.

**The evidence exists. Only the binding is forbidden.** That is the whole of D97 and it is now
verified rather than quoted.

> **[cross-review] Every figure in §1.2 reproduced at `67f6ee0`, independently.** 12 packs with
> `tablebase_exact` claims; the same 12 hold `tablebase_result` records; **341** records, **14–52**
> per pack (min `opposite-bishops-fortress-hold` 14, max `mate-bishop-knight` and
> `trajectory-mate-bishop-knight` 52 each); **12 of 12** roots recorded; **229 of 229** spine
> positions recorded. `manufacturedTablebaseTimestamp` (`ledger-validation.ts`) was read rather than
> trusted — `Date.UTC(2026, 7, 14)` plus `parseInt(sha256(fen).slice(7,15), 16) % 86_400_000`,
> exactly as §1.2 describes — and **0 of 341** match. The categories present across all 341 records
> are only `win` 129 / `loss` 129 / `draw` 83, which matters for §3.4's normalisation table and is
> recorded there. `[V]`

#### 1.3 What the ledger does *not* contain — measured, and it is the honest half

Three findings, each new, each ledgered (D110/D111 below), each shaping §4's outcome.

**(a) No position in the corpus that offers a choice has a complete legal-move tablebase census.**
For each of the 12 packs the legal successors of the root and of every authored spine node were
enumerated with `chessops` and matched against the pack's `tablebase_result` FENs. Of 241 positions,
**6 are terminal** (no legal move), **36 are fully censused — and every one of the 36 has exactly one
legal move**, so its census is complete by having nothing to choose between; **0 of the remaining 199
positions is fully censused.** Root coverage ranges from **1 of 28** (`mate-two-bishops`) to **5 of
11** (`pawn-breakthrough-convert`); `philidor-passive-rook-convert` covers **4 of 21**. `[V]`

> **[cross-review] The draft said "0 of 241" and that is false; 36 are censused.** Re-derived with
> `chessops` 0.15.1 over the committed corpus at `67f6ee0`: the 36 are the forced links of the
> mating spines — `mate-bishop-knight` and `trajectory-mate-bishop-knight` 11 each,
> `mate-k-q-technique` 7, `mate-two-bishops` 5, `queen-vs-pawn-seventh-convert` 2 — all
> single-legal-move positions. The **root coverage row reproduced exactly**, which is what shows the
> two measurements used the same method and only the total differed. The corrected statement is
> **stronger** than the draft's, not weaker: the population that matters is positions with a choice,
> and there the count really is zero. A refutable "0 of 241" that a reviewer disproves in one run is
> worse for D110 than a true "0 of 199", because the first thing an owner does with a falsified
> figure is discount the finding it supports.

That matters because the prose asserts the enumeration in so many words —
`philidor-passive-rook-convert`'s `one-move-wins`: *"All twenty-one legal moves were enumerated and
queried: thirteen draw … and seven lose"*; `mate-bishop-knight`'s `stalemate-is-the-default`: *"every
legal move was enumerated and queried: nine win, nine draw, and eight of those nine draws are
stalemate."* The records for those enumerations are not in the ledger. Either the queries ran and
were never recorded, or the counts came from somewhere else. **This is the dossier's worked example
generalised** — *the author ran the query, typed the number, and the ledger never learned about it* —
and it is exactly what a binding mechanism makes visible instead of assumable. **D110.**

> **[cross-review] D110's "thirteen claims assert one" and a phrase sweep's "four" are both right,
> and the row must say which it means.** They apply different predicates and neither is wrong:
>
> - A **lexical** sweep for an explicit enumeration assertion finds **4 claims in 4 files** —
>   `mate-bishop-knight/stalemate-is-the-default` and `trajectory-mate-bishop-knight/stalemate-is-the-default`
>   (*"every legal move was enumerated and queried"*), `mate-two-bishops/corner-stalemate-field`
>   (*"every legal White move was enumerated and queried"*), and
>   `philidor-passive-rook-convert/one-move-wins` (*"All twenty-one legal moves were enumerated and
>   queried"*). `[V]`
> - The **semantic** predicate — a claim whose truth requires quantifying over the whole legal move
>   set — adds uniqueness and partition claims that never use the word *enumerated*:
>   `pawn-breakthrough-convert/order-is-the-content` (*"a6 is **the only** winning move on the
>   board"*), `queen-vs-pawn-seventh-convert/only-checks-win` (*"**every** winning move is a check
>   and **every** quiet move was queried as a draw"*), `pawn-opposition-convert/root-is-won-by-a-tempo`
>   (*"survives **exactly three of White's six legal** first moves … **All three** retreats are
>   tablebase draws"*). `[V]`
>
> **The thirteen is neither of these.** §4's Bucket 2 list is *"13 `tablebase_exact` claims that
> assert a census **or an off-tree position** the ledger does not contain"*, and its own membership
> proves the mixture: `knight-pawn-wins`' pawn-on-c2 comparison is a single unrecorded position, not
> a census, and `lucena-bridge-convert`'s two verified-alternative claims are the same shape;
> `tempo-is-the-lesson`'s *"every rook slide along the sixth rank"* quantifies over a **subset**,
> which is Open question 1's case and which the strict `moveCensus@v1` cannot express at all.
> **D110's row title therefore overstates the law-8 escalation** by counting three different debts
> as one. The escalation is sized at **7 claims asserting a full-set census** (the 4 lexical plus the
> 3 semantic), against a corpus in which **0 of 199 choice-bearing positions is censused**. The other
> six of the thirteen are ordinary unrecorded-position debt and are cheaper. The row is corrected to
> say so.

**(b) Zero `explorer_frequency` records exist in the repository.** Across all **68** evidence ledgers
under `content/`, the kind census is `engine_eval` 415, `tablebase_result` 341, `position_legality`
59, `opening_identity` 52, `puzzle_provenance` 26 — **`explorer_frequency`: 0**. Also **0 templated
records of any kind** (no `explorer-move-share/v1`, no `engine-move-loss/v1`). So the 23
`corpus_observed` claims are unbacked not because the binding is forbidden but because *no explorer
record has ever been written*. `[V]`

And the shape is wrong as well as absent: `ExplorerTemplateValues` carries one move's share
(`moveSan`, `playedCount`, `total`, `sharePct`, bands, window), while the claims assert
position-level result censuses — `anti-london-black`'s `faced-and-losing`: *"reached 3,851,145 times
and Black scores 44.5% against White's 50.4%"*; `anti-dutch-leningrad-white`'s `faced-and-favoured`
names three moves' shares in one sentence. **The values the claims quote are the shape
`emitExplorerPriority` already writes into `priority.json` rows** (`total`, `whitePct`, `drawPct`,
`blackPct`, `topMoves[]`) — a *priority artifact*, which is not an evidence ledger. §3.3 adds the
record kind that closes the gap.

**(c) Some cited engine figures exist in no ledger at all.** `anti-scandinavian-white`'s
`h3-is-the-move` reads *"h3 first at +1.09 and Bc4 last at 0.00"*; `just-take-it` reads *"+0.66
against +0.01 … and −1.06"*; `the-race-you-lose` reads *"between −1.20 and −1.70"*. Searching every
`engine_eval` record in all 68 ledgers: `0`, `66`, `76`/`77` **and `1`** are present; **`109`,
`−106`, `−120`, `−170` appear nowhere.** Its sibling `scandinavian-mainline-black` *does* hold the
`75` that `anti-scandinavian-white`'s `nothing-to-refute` cites — so the same authored assertion is
backed in one pack and unrecorded in its sibling, because the run happened once. `[V]`

> **[cross-review] `1` was listed as absent and it is present.** Re-derived over every
> `candidates[].centipawns` in all 68 committed ledgers: **157 distinct centipawn values**, and `1`
> is among them (so is `52`, which `maroczy-bind-white-squeeze/engine-measured-root` cites). The
> four genuinely absent values are `109`, `−106`, `−120`, `−170` — and the near-misses are worth
> stating, because `−107` and `−110` *are* present: a value that exists somewhere in the corpus is
> **not** evidence that the claim citing it is backed, since the record must be for *that position*.
> This is the second reason §3.3's assertions must be keyed to a FEN rather than to a value, and the
> third reason is D130 below: as drafted they are keyed to a FEN **that need not be this pack's**.

#### 1.4 The overwrite, and why it is the same defect from the other side

`attachExplorerEvidence` validates the target is `/feedbackClaims/<i>/text`, resolves an anchor
position, queries the explorer, and then executes

```ts
pack.feedbackClaims[claimIndex].text = renderExplorerFrequency(values);
```

before writing a record whose `supports` is that pointer. It is internally coherent — the record is
machine-validatable precisely *because* the text is generated from the same `values` — and it is
the opposite of backing. Run over the 23 `corpus_observed` claims it would delete 23 authored
sentences, including every measured comparison the author drew (*"nearly one Advance Caro-Kann in
three skips …Bf5, so an Advance repertoire without an answer here is a third unprepared"*), and
replace them with one-move share sentences. **Silently discarding an author's sentence in favour of
a rendered one is the same defect as refusing to record the author's sentence at all.** §3.5 deletes
it.

### 2. The design question: the weakest sufficient binding

Five candidates. Each is stated, then the sentence it wrongly admits is named. The corpus supplies
the counterexamples, so none of this is hypothetical.

**(A) Consistency sweep over the prose's own numerals and entities.** Extract every cardinal, SAN
token and result word from `text`; require each to appear somewhere in the supporting records'
`values`. No authoring burden at all.
*Admits what it should not:* **a right number in a wrong role.** `mate-bishop-knight`'s
*"nine win, nine draw, and eight of those nine draws are stalemate"* passes if the record set
contains 9 and 8 anywhere, in any role — swapping "win" and "draw" is invisible. It also admits
every *qualitative* assertion for free, because a sentence with no numerals has nothing to sweep:
`philidor-third-rank-hold`'s `passivity-loses` carries no numeral at all and would be admitted
unexamined. And 28 of the corpus's spelled-out cardinals mean the extractor is a natural-language
component in the trust path. **Rejected as a binding.** Kept, in §3.4, as a *completeness* check —
which is the one job it is sound for.

**(B) Render-and-compare on the claim's asserted values rather than its wording.** The claim carries
a structured assertion list; the validator checks each assertion against the records and never looks
at the prose. Simple, fully machine-checkable, no text handling.
*Admits what it should not:* **prose that contradicts its own declared assertions.** An author may
declare `category = draw` and write *"a tablebase win"*. Nothing in the mechanism connects the
sentence to the structure, so the check is real and the guarantee is empty — it certifies a JSON
object while the learner reads a paragraph. **Rejected.** Its useful half — a canonical machine
rendering of what was actually measured — is kept in §3.6 as *disclosure*, where its job is to let a
learner see the discrepancy rather than to prevent it.

**(C) Author-declared mapping from prose spans to record fields.** For each machine-derived fragment,
the author declares the verbatim substring and the derivation that produces it; the validator
re-derives from records and requires the author's own words to match.
*Admits what it should not:* **everything the author declines to declare.** A sentence with one
declared span and four undeclared machine-shaped assertions passes with a `ledger_bound` badge. Also
**negation and scope inversion inside the surrounding clause** — *"thirteen draw"* checks out
whether the clause says it or denies it. The first hole is fatal on its own and is closed by (A) as
a completeness sweep; the second is not closeable by any check short of reading English, and is
answered by disclosure (§3.6) rather than pretended away. **Recommended, with (A) bolted on.**

**(D) Cryptographic signature over the extracted assertion.** A digest binding record to assertion,
so neither can drift without detection.
*Admits what it should not:* **a wrong assertion, tamper-evidently.** A signature is an integrity
primitive, not a semantic one; it certifies that nobody edited the claim, not that the claim is
true. **Rejected as a binding** — and adopted in §3.2 for the one job it is right for: a
content-keyed link that survives reordering, which is D98's fix.

**(E) Widen `EVIDENCE_OVERREACH` so `tablebase_result` may support a prose pointer.** The minimal
change; one predicate.
*Admits what it should not:* **any prose whatsoever, on any pack holding a tablebase record.** All 12
affected packs hold 14–52 such records. This is the one candidate that does not merely have a hole;
it *is* the hole, and it is the shape law 8 names. **Rejected, and named so it is not proposed again
as "the small fix".**

**The recommendation is (C) + (A) + (D) + (F):** an author-declared span mapping, re-derived from
committed records; a residual sweep that refuses any undeclared machine-shaped span; a content digest
so the link is keyed to the sentence rather than to its position in an array; and — `[round 2]`, on
the owner's ruling — **segment attribution**, so that the prose the sweep has no token in is disposed
of to the author under a named principle instead of being admitted unexamined. **(F) is stated in
§2.1 and is the round-2 addition; (A)'s job narrows to the inside of a bound span and does not
shrink.**

**What the recommended mechanism still admits, stated plainly.** It cannot check a clause's logical
form. An author who writes *"it is not the case that thirteen moves draw"* and declares
*"thirteen"* against a census that returns 13 passes the validator. The mechanism guarantees that
**every machine-shaped fragment of the sentence is a real instrument reading, correctly attributed**;
it does not guarantee that the sentence composed from those fragments is true. That is the ceiling of
any mechanical binding over free prose, it is where rung 5's *"provenance is the only safeguard"*
actually sits, and §3.6 answers it the only honest way available — by printing the instrument's own
sentence beside the author's, so a learner can see the two disagree. **`[round 2]` §2.1 adds the
second half of that answer: the mechanism cannot say whether a sentence is true, but it can say
**whose** sentence each part of it is, and §3.10 gives the author's half a published, counter-cased
object to rest on. The ceiling is unchanged; what moved is that the space beneath it is no longer
unattributed.**

> **[cross-review] Negation is the smallest hole, not the largest, and the draft named only the
> smallest.** The residual sweep's alphabet is cardinals, SAN/square tokens and result words. **A
> proposition built out of none of those has an empty residual and is admitted unexamined**, and
> that is not hypothetical — three of the 75 machine-labelled claims at HEAD contain **no digit and
> no spelled cardinal at all** `[V]`. The worked case is `philidor-third-rank-hold/passivity-loses`,
> which the draft already cites in §2(A) and then does not carry through to (C):
>
> > *"The difference between the fence and a passive rook on the back rank is the difference between
> > a tablebase draw and a tablebase loss in this position. 'Activity' here is not style advice; it
> > was verified."*
>
> Declare *"a tablebase draw"* → `tablebase.category@v1`, *"a tablebase loss"* →
> `tablebase.moveCategory@v1`. The residual is then **empty**, the sweep is silent, and the claim
> ships `ledger_bound` — while its operative content is an **equivalence** ("the difference between
> X and Y **is** the difference between draw and loss") that no record states, plus a **meta-claim
> about its own provenance** ("it was verified") that the mechanism is supposed to be the sole judge
> of. Four families sit in this gap and the corpus supplies each: **qualitative** (*"the bishop pair
> compensates"*), **causal** (*"the passive rook did not just lose time; it chose the one square its
> own king disconnects"* — `why-the-skewer-works`), **comparative**, and **scope** (*"in this
> structure"*, *"always"*, *"by construction"* — `knight-pawn-wins`).
>
> **This is where the owner's D126 boundary lands, and the mechanism cannot hold it.** The ruling of
> 2026-08-15 admits explorer result splits *"the split may be stated; it may never be converted into
> a move verdict or a quality claim"*, and refuses *"…so Black is better here"* by name. That refused
> clause carries **no cardinal, no SAN token and no result word**. It survives the sweep with an
> empty residual on any claim that binds one percentage. **A mechanism whose stated job is provenance
> at rung 5 admits, verbatim, the sentence its owner refused eight hours after this draft was
> written.** That is not a reason to abandon (C)+(A); it is the reason the RFC must stop claiming the
> sweep is a completeness guarantee and start claiming what it is: **a guarantee about the numerals,
> and nothing about the proposition.** §3.4, §3.6 and criterion 4 are amended accordingly, and the
> gap is ledgered rather than absorbed. **D131.**

#### 2.1 `[round 2]` (F) Route the claim — the owner's answer to the escalation

The cross-review's conclusion was *state the ceiling and ship*. The owner refused it: **"why not fix
them properly?"**, for the third time in this RFC's history. The ruling is not that the sweep can be
made to read English. It is that **the sweep was answering the wrong question**.

> **The boundary was never *"never say Black is better"*. It is *"never say it AS CORPUS
> OBSERVATION."*** A verdict is a legitimate thing for an author to assert. It is illegitimate only
> when it wears an instrument's label — and the format already has the slot for the legitimate form.
> `$defs/feedbackClaim.evidenceTypes` is a seven-member enum carrying **`author_principle`** and
> **`hypothesis`** alongside `corpus_observed`, and `design/05-in-run-experience.md` §3 defines
> rung 5 as *"Authored claims — an author's judgement. Can simply be wrong, and with no review
> workflow provenance is the only safeguard."*

So candidates (A)–(E) all shared one unexamined assumption: that the mechanism's output is
**admit or refuse**. (F)'s output is **admit, under whose name**.

**(F) Segment attribution — every part of the sentence is disposed of, to an instrument or to the
author.** The text is cut into segments by a frozen boundary set. A segment holding at least one
validating instrument span is **instrument-attributed**. Every other segment is **author-attributed**
— there is no third disposition and no silent one. A claim with an author-attributed segment must
carry `author_principle` resolving against the registry (§3.10); a claim whose instrument label has
**no** instrument-attributed segment behind it does not get to keep the label. The sentence survives
in every case; only the label is ever refused.
*Admits what it should not:* **a verdict conjoined inside an instrument-attributed segment without a
boundary marker.** *"White scores 40.2% over 6011 games and the Berlin structure favours Black"* is
one segment, holds a bindable percentage, and is attributed to the instrument entire. Measured
residue, over the committed corpus at HEAD `[V]`: of **225** machine-shaped segments, **29** also
carry a `BANNED_JUDGEMENTS` word. That is the honest size of what (F) still misses, and it is stated
here rather than in a criterion so it cannot be read as a bug someone forgot. **Recommended, and it
subsumes rather than replaces (A):** the residual sweep keeps its job *inside* a segment, deciding
what a bound span may say; (F) decides who owns the segments the sweep never had a token in.

**Why this is the fix and not a relabelling of the hole.** Three measurements, all at HEAD `[V]`:

1. **The hole is the corpus, not a corner of it.** Cutting the 91 machine-labelled claims on the
   frozen boundary set, **69 of them carry at least one segment with no cardinal, no ordinal, no
   SAN or square token and no result word** — **126 such segments**, provenance 53 sentence-initial
   after a terminator, 31 claim-initial, 26 after `;`/`:`, 9 after a dash, 7 after an inference
   marker. **76% of the machine-labelled corpus** carries prose the drafted sweep would have passed
   unexamined. D131 was filed as a ceiling; it is the load-bearing wall. **D164.**
2. **The corpus is already doing this by hand.** **Eleven** claims — one per pack grounded by
   `da77c56`, counted `[V]` — end with a
   hand-written disclaimer — *"Stated as what happened, per the owner ruling of 2026-08-15 … No move,
   plan or side in this pack is graded from these numbers"* — and `dragon-yugoslav-race`'s
   `split-at-the-arrival-is-recorded-not-compared` spends a whole segment saying its two splits *"are
   recorded side by side and are not compared"*. An author writing the mechanism's job into the prose
   is the strongest available evidence that the mechanism is missing, and that the shape it should
   take is attribution rather than refusal.
3. **Refusal was never available anyway.** The verdict segments are not decoration that could be
   deleted. *"nearly one Advance Caro-Kann in three skips …Bf5, so an Advance repertoire without an
   answer here is a third unprepared"* is the sentence's entire point; the percentage is the setup.
   A rule that refuses the claim deletes the teaching and keeps the number, which is this RFC's own
   Motivation — *"a debt you are forbidden to pay is not a debt, it is a silent deletion with a rule
   attached"* — arriving by a different door.

**What (F) must not do, and this is where it earns its keep.** Attribution to the author is not a
laundry. A *rate* — a percentage or a centipawn display — presents instrument precision and **hides
its denominator**; a raw count carries its population with it. So §3.4a's reading rule refuses a rate
inside an author-attributed segment outright, at error, with no label that lifts it. That single
asymmetry is what keeps (F) from becoming candidate (E) with better manners, and §4.1's payoff table
is where it shows up as the one refusal that survives the routing. **D166.**

### 3. The mechanism

#### 3.1 `claimBindings` — a third array in the evidence ledger

`EvidenceLedger` (`apps/server/src/sourcing/types.ts`) gains an **optional** third array beside
`records` and `abstentions`:

```ts
export interface ClaimBinding {
  readonly claimId: string;             // must equal the resolved claim's id
  readonly pointer: string;             // /feedbackClaims/<i>/text
  readonly textSha256: string;          // sha256 of the claim text this binding describes
  readonly spans: readonly ClaimSpan[];
}

export type ClaimSpan =
  | { readonly span: string; readonly assertion: ClaimAssertion }   // instrument-derived
  | { readonly span: string; readonly authored: true };             // the author's own

export interface ClaimAssertion {
  readonly kind: string;                              // a registered assertion id, §3.3
  readonly args: Readonly<Record<string, unknown>>;   // the assertion's declared inputs
  readonly select?: string;                           // which scalar of a multi-valued result
}
```

`EvidenceLedger` is validated in code by `validateLedger`, not by a JSON Schema file — `schemas/`
holds `drill_pack`, `drill_run` and `shape_entry` only. The array is optional and absent from all
68 committed ledgers, so **every existing ledger stays valid unchanged** and the ledger `schema`
string stays `tabiya.sourcing.evidence.v1`.

**Why the ledger and not the pack.** The binding is a property of the evidence, not of the content.
An author writes a sentence; an instrument record says *"I back this fragment of it."* Putting the
binding pack-side would move authored prose and machine bookkeeping into one object, would require a
pack-schema version, and would move every affected pack's content digest. Ledger-side it costs
none of that — which is why §5 releases 0.26.

#### 3.2 Resolution and the D98 fix

For each binding, in `evidenceSupports`:

1. `pointer` must match `/^\/feedbackClaims\/\d+\/text$/`, else `CLAIM_POINTER_INVALID`.
2. `resolvePointer(pack, pointer.replace(/\/text$/, ""))` must resolve to an object whose `id`
   equals `claimId`, else **`CLAIM_POINTER_REBOUND`**.
3. `sha256(resolved.text)` must equal `textSha256`, else **`CLAIM_TEXT_DRIFTED`**.
4. At most one binding per `claimId`, else `CLAIM_BINDING_DUPLICATE`.

> **D98 is closed by (2) and (3), and closed structurally rather than by a test.** Reordering
> `feedbackClaims` moves index *i* to a different claim; the `claimId` check fails at **error**.
> Editing a claim's prose after binding it changes the digest; `CLAIM_TEXT_DRIFTED` fires — which is
> correct, because the record described *that* sentence. The pointer remains an index because JSON
> Pointer has no other addressing mode, but the pointer is no longer the *identity*; the id and the
> digest are.

> **[cross-review] It is not airtight, and the rebinding that survives it is one line of JSON.**
> (2) and (3) close *reordering* and *editing*. They do not close **two claims sharing an `id`** —
> and nothing refuses that. `validatePackDocument` builds `const claimIds = new Set((pack.feedbackClaims ?? []).map((claim) => claim.id))`
> (`apps/server/src/pack-validation.ts`) purely to resolve `stated_reasoning` references; it never
> compares the set's size to the array's length, and there is no `DUPLICATE_*` refusal for feedback
> claims anywhere in the file `[V]` (the two that exist are `TIMING_WINDOW_DUPLICATE_ID` and
> `TRAJECTORY_DUPLICATE_LEG_ID`). So: give claims 0 and 5 the same `id`; bind claim 0 honestly —
> (2) resolves `/feedbackClaims/0/text` to an object whose `id` matches, (3) digests claim 0's own
> text, (4) sees one binding for that id. **Every check passes.** §3.9 then asks *"does the ledger
> hold a `claimBindings` entry for that claim"*, keyed by `claimId`, and answers yes **for claim 5
> as well** — whose arbitrary prose now carries `ledger_bound` off claim 0's record. The digest that
> was supposed to make the link content-keyed is keyed to the *other* sentence.
>
> Two additions close it, and the RFC takes both because either alone leaves a sharp edge:
>
> 6. **`feedbackClaims[].id` must be unique within a pack**, else **`CLAIM_ID_DUPLICATE`** at error
>    severity, raised by `validatePackDocument` and therefore reaching every pack whether or not it
>    has a ledger. Measured cost: **0 packs affected** — no committed pack has a duplicate claim id
>    `[V]`.
> 7. **§3.9's backing test resolves by pointer, not by id.** The binding's `pointer` identifies
>    *which* claim is backed; `claimId` and `textSha256` are the checks that the pointer still means
>    what it meant. Id-keyed lookup was the mechanism that let (6)'s absence become an exploit.
>
> **D132.** This is what "closed structurally rather than by a test" has to survive to be worth
> saying, and the draft's version did not.

And the fence gets stricter, not looser:

5. **`record.supports` may no longer contain **any** `PROSE_POINTERS` pattern, whatever the record's
   kind or template.** Claim support flows through `claimBindings` or not at all. Measured cost:
   **0 records affected** — no committed record points at a claim (0 of 893 records across the 68
   ledgers carry a `/feedbackClaims/…` support), and no templated record exists anywhere `[V]`.
   Consequently the two template functions keep their **values** validation (they are how an
   `explorer_frequency` or a templated `engine_eval` record proves its own shape) and **lose their
   `supports`-must-be-a-claim-pointer clause and their byte-exact prose comparison**, both of which
   are now unreachable.

> **[cross-review] As drafted, (5) *widened* the gate it claimed to narrow.** The draft removed the
> template exemption *"for that pattern"* — the `/feedbackClaims/` one — and in the same breath
> deleted the templates' requirement that `supports` **be** a claim pointer. But the exemption in
> `check.ts` is **record-level, not pattern-level**: the guard reads
> `(!isExplorerTemplate && !isEngineTemplate && PROSE_POINTERS.some((pattern) => pattern.test(pointer)))`,
> so a record that satisfied either template is exempt from **all five** prose patterns at once.
> Strike only the feedbackClaims pattern and delete the must-be-a-claim-pointer clause, and a
> templated `engine_eval` may then support `/objective/summary`, `/planClasses/<i>/description`,
> `/deviations/<i>/note` **or** `/spine/…/annotations/<i>` — with the byte-exact prose comparison
> deleted too, so **nothing checks it at all**. `explorer_frequency` is blocked from `/spine…` by a
> separate predicate in the same expression and from nothing else. That is a strictly larger hole
> than the one D97 is about, opened by the clause that advertises itself as the narrowing. (5) is
> rewritten above to strike the exemption for all five patterns, which is also what criterion 1
> already tests for the claim pattern and now tests for the other four. **D133.**

#### 3.3 The assertion registry

An assertion is a **pure function from the pack's own ledger records to one scalar**. It may not
issue a query, may not read another pack's ledger, and may not consult the live tablebase, explorer
or engine at validation time — a validator that re-queries is a second instrument, and the record
would then be decoration. Unresolvable inputs are a refusal (`CLAIM_ASSERTION_UNRECORDED`), never a
fetch.

Registry v1 — closed, versioned per entry, extended only by RFC:

| id | args | resolves from | scalar |
|---|---|---|---|
| `tablebase.category@v1` | `{fen}` | the unique `tablebase_result` with `values.fen === fen` | `TABLEBASE_CATEGORIES` member |
| `tablebase.dtm@v1` / `tablebase.dtz@v1` | `{fen}` | same record | integer |
| `tablebase.pieceCount@v1` | `{fen}` | same record | integer |
| `tablebase.moveCategory@v1` | `{fen, uci}` | the record for the successor of `fen` after `uci` | category |
| `tablebase.lineUniformCategory@v1` | `{fens[]}` | one record per FEN; refuses unless all agree | category |
| `tablebase.moveCensus@v1` | `{fen}`, `select: total\|win\|draw\|loss` | one record per **legal** successor | integer |
| `tablebase.uniqueMoveOfCategory@v1` | `{fen, category}` | full census; refuses unless exactly one | SAN |
| `engine.centipawns@v1` | `{fen}` | the `engine_eval` record for that FEN | integer (centipawns) |
| `engine.depth@v1` | `{fen}` | same | integer |
| `explorer.total@v1` / `explorer.scorePct@v1` / `explorer.moveSharePct@v1` | `{fen[, san][, side]}` | an `explorer_position_census` record (§3.7) | integer / one-decimal percentage |

**Two completeness guards make the census assertions honest rather than assertable**, and they are
the reason §1.3(a) is a refusal rather than a caveat:

- `tablebase.moveCensus@v1` and `tablebase.uniqueMoveOfCategory@v1` **enumerate the legal moves at
  `fen` themselves**, with `chessops` — already imported by `check.ts` — and refuse
  (`CLAIM_CENSUS_INCOMPLETE`) unless a record exists for **every** legal successor. An author cannot
  declare "all twenty-one legal moves" against four records.
- `tablebase.lineUniformCategory@v1` refuses unless `fens[]` is exactly the FEN set of an authored
  spine line of this pack, replayed from `start.fen`. "Every position along the authored line" must
  mean the authored line.

Categories are normalised through the shipped `learnerCategory`/`CATEGORY_RANK`
(`apps/server/src/sourcing/tablebase-category.ts`) so `cursed-win`/`blessed-loss` are not silently
read as `win`/`draw` by the prose check.

> **[cross-review] Three registry corrections, each forced by reading the shipped values rather than
> the shipped types.**
>
> **(i) The category spellings were wrong and the vocabulary is bigger than two.** The shipped
> constants are **hyphenated** — `CATEGORY_RANK` in `tablebase-category.ts` and `TABLEBASE_CATEGORIES`
> in `apps/server/src/tablebase.ts` both spell them `cursed-win` / `blessed-loss`, not
> `cursed_win` / `blessed_loss` — and the full vocabulary is **nine** members plus `unknown`
> (`syzygy-win`, `maybe-win`, `cursed-win`, `draw`, `blessed-loss`, `maybe-loss`, `syzygy-loss`,
> `win`, `loss`). The committed corpus only ever holds **`win` 129 / `loss` 129 / `draw` 83** `[V]`,
> so no prose has yet had to render a qualified category — which means the normalisation table must
> **refuse** the other six rather than guess an English word for them. A `maybe-win` silently
> matching the span *"win"* is exactly the failure §3.4 exists to prevent. This is the project's own
> *pin encoding, not intent* rule applied to a contract RFC.
>
> **(ii) The registry cannot express `stalemate`, and four claims need it.** `tablebase_result.values`
> carries `stalemate`, `checkmate` and `insufficient_material` on **341 of 341** records `[V]` — the
> data is already there — but `tablebase.moveCensus@v1`'s `select` is `total|win|draw|loss`. So
> *"eight of those nine draws are stalemate"* (`mate-bishop-knight/stalemate-is-the-default` and its
> trajectory twin), *"the quiet alternatives … are stalemate"* (`mate-two-bishops/corner-stalemate-field`)
> and `mate-k-q-technique/stalemate-is-the-content` are **not payable by the census wave**; they need
> a registry entry the census wave does not supply. §4 puts all four in Bucket 2 on the strength of
> the wave alone, and that is short by one row. Registry v1 gains
> **`select: total|win|draw|loss|stalemate|checkmate`** on `tablebase.moveCensus@v1`, which costs
> nothing because the fields are already recorded and validated.
>
> **(iii) Nothing requires an assertion's `fen` to belong to this pack.** Only
> `tablebase.lineUniformCategory@v1` checks its FENs against the authored spine. `tablebase.category@v1`,
> `tablebase.dtm@v1`, `tablebase.dtz@v1`, `tablebase.pieceCount@v1`, `engine.centipawns@v1`,
> `engine.depth@v1` and the three `explorer.*` entries take **any** FEN that has a record in this
> ledger. `philidor-third-rank-hold`'s `philidor-is-drawn` opens *"This **exact position** is a
> tablebase draw"* and its ledger holds 23 `tablebase_result` records; corpus-wide there are 83 draw
> records. Bind the span to any of them and the validator is satisfied while the sentence is about a
> different position. Registry v1 therefore gains a standing precondition:
>
> > **Every `fen` argument must be a position this pack reaches** — the root, an authored spine node
> > replayed from `start.fen`, or a legal successor of one of those (which covers deviations and
> > declared alternatives) — else **`CLAIM_FEN_OFF_PACK`** at error severity. The pack already knows
> > all three sets; `authoredPositionPointers` in `check.ts` walks two of them today.
>
> This is also what Open question 3 needs to be true. That question offers a bound claim's FENs as a
> free anchor because they are *"author-supplied and machine-checked against the pack's own spine"* —
> quoting `feedback-delivery`'s Open question 4 exactly. **Without this precondition that sentence is
> false**, and the anchor Open question 3 offers would point wherever the author aimed it. **D130.**

#### 3.4 The span check, and the residual sweep that closes (C)'s hole

For each `spans[]` entry:

1. `span` must occur in `text` **exactly once** — zero occurrences is `CLAIM_SPAN_ABSENT`, two or
   more is `CLAIM_SPAN_AMBIGUOUS`. An author disambiguates by quoting more words.
2. For an instrument span, the assertion is evaluated and the result **normalised**, then compared
   for equality with the normalised span. `CLAIM_SPAN_CONTRADICTED` otherwise.

Normalisation is a closed, frozen table with no natural-language inference in it:

- **Integers.** The span, trimmed, must be either digits (with optional `,` group separators), an
  English cardinal 0–999 from a frozen table (`nine` → 9, `twenty-one` → 21, `thirteen` → 13), or an
  English **ordinal** 1st–99th from the same frozen table (`fourth` → 4, `sixth` → 6, `twenty-first`
  → 21). This is required by the corpus, not a nicety: the endgame packs write their quantities in
  words, and they write their **ranks and files as ordinals**.

  > **[cross-review] Ordinals were absent from the table and from the sweep, and they are 24 of the
  > 75 machine-labelled claims at HEAD** `[V]` — `sixth` ×4, `first` ×11, `third`, `fourth`,
  > `second`, `seventh`, `eighth`. In this corpus an ordinal is a board coordinate:
  > `mate-k-r-technique/tempo-is-the-lesson` turns on *"every rook slide along the **sixth** rank
  > from the long side"*, `lucena-bridge-convert/bridge-not-squeeze` on *"rook to the **fourth**"*.
  > Leaving them out of the cardinal table did not make them safe — it made them **invisible to the
  > residual sweep**, which is the opposite of safe, because the sweep's whole contribution is
  > refusing what the author did not declare. Adding them to the table makes them declarable and
  > makes the sweep noisy about them, which is the trade §3.4 already accepts everywhere else.
  > **D129.** Fractions and iteratives (*"a third unprepared"*, *"twice"*, *"once"*) are **not**
  > added: they are not integers, they occur 4 times, and each is an `authored` span on a claim that
  > must carry a self-declared label — see the fence note below, which is where that answer stops
  > working.
- **Centipawn displays.** `displayCp` (`check.ts`) is reused verbatim, so `+1.09` ↔ `109`. The span
  may carry or omit the leading `+`.
- **Percentages.** One decimal place, matching `pct()` in `explorer.ts`; `30.0%` ↔ `30.0`.
- **SAN.** Exact string equality after trimming. The SAN is derived from the record's own FEN and
  move with `makeSan`, never parsed out of the prose.
- **Categories.** Case-insensitive equality with the category word, plus a frozen two-entry
  inflection table (`draw`↔`drawn`, `loss`↔`lost`). That table is English morphology, not chess
  semantics, and it is listed in full here so it cannot grow without an RFC.

> **The residual sweep — the rule that makes the mapping complete over the sweep's alphabet rather
> than selective within it.** `[cross-review]` The alphabet is cardinals, ordinals, SAN/square
> tokens and result words; **completeness is over that alphabet and nothing wider**, and §2's
> cross-review note gives the proposition-level gap this leaves open (**D131**). After
> every declared span (instrument and `authored` alike) is removed from `text`, the remainder is
> scanned for machine-shaped tokens: a cardinal (digits or the frozen word table), a SAN or square
> token, or a result word (`win`/`won`/`draw`/`drawn`/`loss`/`lost`/`stalemate`/`checkmate`). **Any
> survivor is `CLAIM_ASSERTION_UNDECLARED` at error severity.** The author must either bind it or
> mark it `authored`.

> **The `authored: true` escape, and the fence around it.** A span may be declared as the author's
> own — `bridge-not-squeeze`'s *"four-step manoeuvre"* is a teaching decomposition, not a Syzygy
> reading, and must remain sayable. The fence is the schema's own two-tier label vocabulary rather
> than a new judgement: **a claim may carry `authored` spans only if its `evidenceTypes` includes at
> least one self-declared label** (`author_principle`, `hypothesis`, `derived_feature`), else
> `CLAIM_AUTHORED_SPAN_UNLABELLED`. A claim labelled `tablebase_exact` and nothing else must have an
> empty residual — it claimed to be exact, and it is held to it. Measured `[V]`: of the 37
> `tablebase_exact` claims, **18 carry a self-declared label as well** and 19 do not. **`[cross-review]`
> Reproduced exactly at `67f6ee0` — but the fence binds syntactically and not much more: the label
> set is author-chosen and checked only against a seven-member enum, so the escape costs one array
> element. See the measurement below `§3.4`; the RFC's position is that binding the explorer window
> removes the *reason* to reach for the relabel, not that the fence stops anyone who wants to.**

> **`[round 2]` The rulings change both of the fence's clauses, in opposite directions.**
>
> **It stops refusing.** *"A claim labelled `tablebase_exact` and nothing else must have an empty
> residual"* was a refusal of the sentence; under ruling 1 it is a **routing of the label**.
> `CLAIM_AUTHORED_SPAN_UNLABELLED` is withdrawn and re-enters §3.8 as
> **`CLAIM_AUTHOR_LABEL_REQUIRED`**, whose message names the remedy rather than the crime — *"this
> claim contains authored assertion; add `author_principle` and name the principle it rests on"*.
> Mechanically it is still an **error** that stops the pack validating, because a validator that
> merely warns is one authors learn to read past. What changed is that the remedy no longer costs a
> sentence.
>
> **It narrows to one label.** The drafted fence accepted **any** of `author_principle`, `hypothesis`
> or `derived_feature`. Ruling 2 makes only the first resolve against anything, so leaving all three
> in would move **D135**'s one-array-element escape exactly one label to the left: the author who will
> not write a principle entry writes `hypothesis`, and nothing checks that either. **The
> authored-span fence therefore resolves to `author_principle` alone.** `hypothesis` and
> `derived_feature` stay valid `evidenceTypes` members and are not deprecated — they simply stop
> licensing an author-attributed segment. Measured cost at HEAD `[V]`: of the 91 machine-labelled
> claims, **0 of 52 `corpus_observed` and 0 of 8 `engine_validated` carry any self-declared label**;
> of the 37 `tablebase_exact`, **18 do — and 15 of those 18 are already `author_principle`**. So the
> narrowing costs the corpus **three claims** — `mate-bishop-knight/opponent-plays-the-spine`,
> `trajectory-mate-bishop-knight/spine-is-the-opponent` and
> `philidor-passive-rook-convert/why-the-skewer-works`, all `[tablebase_exact, derived_feature]` `[V]`
> — which are **three of §4's five Bucket 3 rows**. The narrowing costs exactly the claims the RFC
> already says must not ship on their machine label, which is a coincidence worth stating: the label
> that gates nothing had drifted onto the claims with nothing behind them. Each gains
> `author_principle` in §3.10's migration. **D172.**

Numerals with no chess content still need handling, and the answer is *bind them where an instrument
recorded them and declare them otherwise*: piece counts are genuine assertions
(`tablebase.pieceCount@v1` backs *"five pieces"*), and **rating bands and date windows are genuine
assertions too**, because `explorer_position_census` (§3.7) records `ratings`, `speeds`, `since` and
`until` and the manifest's request URL is already checked against them. Registry v1 therefore gains
**`explorer.window@v1`** (`select: since|until`) and **`explorer.ratingBand@v1`**. The sweep is
deliberately noisy; noise here costs an author a line of JSON, and silence here costs a learner a
false provenance statement.

> **[cross-review] The draft's answer here was `authored`, and that answer collides with the draft's
> own fence on every single `corpus_observed` claim in the corpus.** Measured at HEAD `[V]`:
>
> | | claims | of which carrying a self-declared label |
> |---|---|---|
> | `corpus_observed` | 36 | **0** |
> | `engine_validated` | 8 | **0** |
> | `tablebase_exact` | 37 | **18** (the draft's "18 of 37" reproduces exactly) |
>
> Every one of the 36 `corpus_observed` claims carries an explorer window written as digits —
> `2024-01` to `2026-07`, or `2023-01` to `2025-12` on the ten new packs — and
> `french-advance-chain-white/no-head-lever-here` also carries the band `1400-1800`. Those are
> cardinals; the sweep flags them; registry v1 as drafted has **no assertion that returns them**; so
> the only route was `authored`; and the fence closes `authored` to a claim with no self-declared
> label. **Every `corpus_observed` claim in the corpus is therefore refused
> `CLAIM_AUTHORED_SPAN_UNLABELLED` under the drafted rules** — which is to say the drafted mechanism
> refuses Bucket 2's entire 23-claim explorer wave, the wave §4 counts as payable and the wave the
> owner's D126 ruling exists to unblock. The fix above is the honest one: the window and band **are**
> instrument readings, recorded in the census record and cross-checked against the request URL, so
> they should be **bound**, not excused.
>
> **And this is why the fence, left as the answer, is decorative.** The alternative route an author
> facing 36 refusals actually takes is to append `author_principle` to `evidenceTypes` — one string
> in a JSON array, gated by nothing but the seven-member enum at
> `schemas/drill_pack.schema.json` `$defs/feedbackClaim.evidenceTypes` `[V]`. **Nothing anywhere
> checks that a claim labelled `author_principle` contains a principle.** So the fence's real
> strength is not "the schema's own two-tier label vocabulary"; it is "the author has not yet
> bothered". A mechanism that makes the cheap move the *relabelling* move is a mechanism that
> converts machine-checkable claims into self-declared ones at scale, and §3.9 then admits them as
> `self_declared` with no residual sweep at all. Binding the window closes the pressure at its
> source. The residual pressure — a claim that could pay but relabels instead — is **not** closable
> by the validator, is now criterion 13's job to *measure* rather than prevent, and is ledgered.
> **D135.**
>
> **`[round 2]` D135 is what owner ruling 2 answers, and the answer is not the window binding.**
> Binding the window removed one *reason* to relabel; ruling 2 removes the *cheapness*.
> `author_principle` stops being a string in an enum and becomes a resolving reference against
> `content/principles/` (§3.10), so the relabel now costs a published entry with a statement, a
> provenance block and a counter-case. And §3.4a routes far more claims to that label than the
> drafted rules ever would have — deliberately — which is exactly why the label had to acquire a
> safeguard first. **A routing to a rung with no floor is a demotion to nowhere.** Criterion 13's
> measurement stands and its interpretation changes: a net movement toward `author_principle` is now
> the mechanism working *if* each movement carries a resolving principle, and the escalation trigger
> becomes movement concentrated on **one** registry entry, which is the shape a rubber-stamp takes.

#### 3.4a `[round 2]` Segment attribution — the rule that fires when the residual is empty

This is owner ruling 1 as a mechanism. It runs **after** §3.4's span check and residual sweep, over
the same `text`, and it changes no span semantics.

**Step 1 — cut.** `text` is cut into **segments** at a **frozen boundary set**, listed here in full so
it cannot grow without an RFC:

1. a sentence terminator `.`, `?` or `!` followed by whitespace and an opening character (an
   uppercase letter, `"`, `'`, `“` or `(`). A decimal point is unaffected, because a digit follows it
   rather than whitespace — verified over the committed corpus: no claim's decimal, ellipsis or
   `1.d4`-style move number is cut by this rule `[V]`;
2. `;` or `:` followed by whitespace;
3. an em dash, en dash, or a space-flanked hyphen — `—`, `–`, ` - `;
4. an **inference marker** at the head of a clause, optionally preceded by a comma:
   `so`, `therefore`, `thus`, `hence`, `which means`, `because`, `since`.

Rule 4 is the one that earns the frozen list. D126's boundary is *inference from a number to a
verdict*, and in English an inference is usually marked; the corpus confirms it, and rule 4 is what
cuts *"…so Black is better here"* off the percentage it was appended to. Rules 1–3 are punctuation and
carry no linguistic claim. **The set is a closed list of surface forms, not a parser** — which is what
keeps it out of the trust path in the sense §2(A) rejects a natural-language extractor: a boundary the
list misses does not admit a false reading, it merely leaves a verdict inside its neighbour's segment,
and §2.1 measures that residue at **29 of 225** rather than leaving it to be discovered.

**Step 2 — attribute.** A segment is **instrument-attributed** iff at least one validating instrument
span of §3.1 lies wholly inside it. **Every other segment is author-attributed.** There is no third
disposition, no "glue" category and no unattributed remainder — which is the whole point, because
*unattributed remainder* is precisely what the drafted mechanism admitted in silence.

**Step 3 — check the label against the attribution.** Three rules, and the second is the one the
owner's brief demands:

1. **≥1 author-attributed segment** ⇒ `evidenceTypes` must contain `author_principle` and
   `principles` must resolve (§3.10), else **`CLAIM_AUTHOR_LABEL_REQUIRED`** at error.
2. **An instrument label with 0 instrument-attributed segments** ⇒ **`CLAIM_LABEL_UNEARNED`** at
   error, naming the label. **This is the empty-residual case, and it is why step 3(1) alone is not
   the rule.** *"Black is better here"* declared `corpus_observed` has nothing to bind, therefore
   nothing to sweep; no span refusal fires and no undeclared token survives, because there are no
   spans and no tokens. What is wrong with it is not located in any span — it is that the **claim**
   wears a label it has not earned. `CLAIM_LABEL_UNEARNED` is the only refusal in this RFC that fires
   on the absence of everything rather than the presence of something, and it is the reason the
   mechanism reaches a sentence the sweep is structurally blind to. Its remedy is one array element in
   the other direction: drop the instrument label, keep `author_principle`, **keep the sentence**.
   *(It is close kin to §3.9's `EVIDENCE_TYPE_UNBACKED`, and deliberately distinct: `UNBACKED` fires
   when the ledger holds no validating binding at all, which includes every ledger-less pack;
   `UNEARNED` fires when a binding validates and still leaves the label standing on nothing. The first
   is a debt, the second is a category error, and criterion 11 asserts which code fires for which
   claim rather than accepting either.)*
3. **A rate inside an author-attributed segment** ⇒ **`CLAIM_READING_UNATTRIBUTED`** at error, and
   **no label lifts it.** A rate is a token normalising under §3.4's *percentage* or *centipawn
   display* entries — `\d+\.\d` with an optional `%`, or a `displayCp` form. The asymmetry is §2.1's
   and it is this rule's whole justification: **a rate hides its denominator; a count carries it.**
   *"…f5 scores 90.9% for White"* over eleven games is refused however it is labelled, because
   attributing it to the author converts an inadmissible measurement into an admissible opinion, which
   is laundering rather than routing. *"d4-d5 scored 1/0/6 over seven games"* is **not** refused: it
   states its population in the same breath, so a learner reading it at rung 5 under the author's name
   has what they need to discount it. Integers are not rates, for the reason §3.4's table already
   gives — in this corpus they are ranks, files, plies, piece counts, rating bands and dates. **D166.**

**What this does not do, said before a reader has to find it.** It does not check that an
author-attributed segment *is* the principle it names, and nothing mechanical can. §3.10's registry
makes the principle a published object with a statement and a counter-case, so a learner can read the
general rule the particular sentence claims to instantiate and judge the fit; that is `design/05`'s
*"provenance is the only safeguard"* taken literally, and it is the same move §3.6 makes for
instrument spans. The gap between *names a principle* and *instantiates it* is where a review workflow
would sit, and the owner ruled on 2026-08-13 that there is none.

#### 3.5 The overwrite is deleted

`attachExplorerEvidence` **no longer mutates the pack at all** — neither
`pack.feedbackClaims[claimIndex].text` nor `pack.provenance.sources`. Both assignments are removed,
not gated behind a flag. In its place the tool requires the author to supply the span it is backing:

```
make candidate-attach FILE=… TARGET=/feedbackClaims/3/text SAN=Bf5 SPAN="61.4%" FIELD=sharePct
```

and writes a `claimBindings` entry rather than a `supports` pointer. With no `SPAN`, the tool
refuses (`ATTACH_SPAN_REQUIRED`) instead of overwriting. The pack file becomes an **input** to the
attach path rather than an output of it, on **both** of the function's two write branches:
`atomicCanonical(directory, …)` writes `evidence.json` and `sources.json` only, and the flat-file
branch — the one every `content/drafts/*.json` pack takes — drops `writeCanonicalJson(paths.pack, pack)`
and writes only the ledger and the manifest. An author who genuinely wants a generated sentence
writes it into the pack themselves and binds it like any other — a visible authoring edit, not a side
effect of recording evidence.

`digestDrillPack(pack)` is still recomputed into the ledger's `packDigest`, and now it is stable
across an attach, which is the correct behaviour and was not achievable before.

> **[cross-review] Removing one assignment does not make the digest stable, and the draft's
> criterion 6 would have failed on the shipped code.** `attachExplorerEvidence` mutates the pack
> **twice** before it digests it. The draft names the first:
>
> ```ts
> pack.feedbackClaims[claimIndex].text = renderExplorerFrequency(values);
> pack.provenance.sources = [...new Set([...(pack.provenance.sources ?? []), `lichess-explorer (…) — ${EXPLORER_RATIONALE}`])];
> ```
>
> and then `const nextLedger = { ...ledger, packDigest: await digestDrillPack(pack), … }` runs over
> the **mutated** object. Delete only the first line and `packDigest` still moves on the first attach
> against any pack whose `provenance.sources` does not already carry the explorer rationale string,
> and `pack.json` is still rewritten. Criterion 6 asserts *"leaves `pack.json` byte-identical, and
> leaves the ledger's `packDigest` unchanged"* — it would have gone red against a faithful
> implementation of the drafted §3.5, and gone red for a reason the RFC never mentioned.
>
> **The second assignment is a licence obligation, not bookkeeping, so dropping it silently is its
> own defect.** It is how the Lichess explorer attribution reaches `provenance.sources`. Dropping the
> write means an author must add the rationale line to the pack **by hand** before the attach, or the
> pack ships an explorer-backed claim with no source line. §3.5 therefore refuses rather than
> silently skips: **`ATTACH_SOURCE_LINE_MISSING`**, raised before any query, when the target pack's
> `provenance.sources` does not already carry the explorer rationale. That keeps the pack an input,
> keeps the digest stable, and keeps the obligation visible — the same shape criterion 12 uses for
> CC-BY-SA. **D136.** No present corpus effect: **0 committed records point at a claim**, so no
> attach has ever run against a committed pack `[V]`.

#### 3.6 What the binding is worth to a learner

> **The bound claim carries the instrument's own sentence, and the two are shown together.** For each
> instrument span, the validator can already render a canonical reading — *"Syzygy at
> `<fen>`: category win, DTM 39, 5 pieces"*, *"Syzygy at `<fen>`: 21 legal moves — 1 win, 13 draw,
> 7 loss"*, *"Stockfish 18 depth 22 at `<fen>`: +0.76"*. These are stored on the binding as
> `rendered` (validator-computed, refused if the author writes it) and delivered beside the author's
> sentence.

This is candidate (B) put where it belongs. It cannot prevent a sentence that contradicts its own
spans, but it makes the contradiction **visible on the surface** rather than resolvable only by
reading a JSON sidecar. It is the same move the product already makes with
`renderEndgameReading`'s *"Technique entries: none in Tabiya's index."* — absence and basis stated,
never implied.

The rendered lines are **derived text, not authored text**, so they belong to the same category as
`renderStructuralObservation` and carry no rung-5 authority. No LLM writes them; the templates are
frozen strings over record values, which is the one form of machine prose ADR-0005 permits.

#### 3.7 `explorer_position_census` — the missing record kind

`EVIDENCE_KINDS` gains a seventh member, `explorer_position_census`, whose `values` are exactly the
shape `emitExplorerPriority` already computes for a `priority.json` row:
`{fen, total, whitePct, drawPct, blackPct, topMoves: [{san, uci, playedCount, sharePct}], ratings,
speeds, since, until}`, with the same derived-value checks `explorerTemplate` applies
(`sharePct === round(playedCount/total*1000)/10`, `total >= 100`, bands and window matching the
request URL in the manifest). It is a record kind, not a template: it supports **position pointers**
like every other record, and reaches claims only through `claimBindings`.

Without it the 23 `corpus_observed` claims are unbackable in shape as well as in fact (§1.3b). With
it they are payable by one wave of explorer queries — the same queries that already produced the
committed priority artifacts.

> **[cross-review] D126 was owner-ruled after this draft was written, it names this RFC as its
> owner, and it changes three things here.** The ruling (`design/BACKLOG.md`, landed `4e19b95`,
> 2026-08-15): *"**ADMISSIBLE as `corpus_observed` (rung 4).** The boundary is now written so authors
> stop self-refusing: **the split may be stated; it may never be converted into a move verdict or a
> quality claim.** … Owned by `rfc/claim-backing.md` (the `explorer_position_census` record kind)"*.
>
> **(1) It ratifies §3.7 rather than complicating it.** The draft designed `explorer_position_census`
> around `whitePct`/`drawPct`/`blackPct` on a hunch that the shape was right; the owner has since
> ruled that the split is admissible evidence. §3.7 stands as written and is now grounded in a
> ruling rather than in the author's reading. The `explorer.scorePct@v1` entry is the assertion the
> ruling's own worked example needs.
>
> **(2) It makes more claims payable than §4 counts.** The ruling says it *"unblocks roughly half the
> ungroundable list at zero extra instrument cost, including five packs carrying `cost: unmeasurable`
> and four authored tempo budgets"*. §4's Bucket 2 counts 23 `corpus_observed` claims at `d2f34f9`;
> at HEAD there are **36**, and the ruling reaches beyond `feedbackClaims` into `cost` and tempo
> fields that §4 never measured. **§4's ceiling is a floor.** The RFC does not restate the ruling's
> arithmetic, because the ruling's population was never measured claim by claim and inventing a
> number here would be the error §4 spends a section avoiding.
>
> **(3) It states a boundary the mechanism provably cannot enforce, and that must be said here.**
> *"…so Black is better here"* — the ruling's own named refusal — carries **no cardinal, no SAN token
> and no result word**. Appended to a claim that binds one percentage, it survives the residual sweep
> with an empty residual and ships `ledger_bound`. The sweep polices *numerals*; the ruling polices
> *inference from numerals to verdict*; those are different objects. §2's cross-review note carries
> the general form. The consequence for this section specifically: **`explorer_position_census`
> unblocks the wave and does not, on its own, hold the line the owner drew** — the line is held by
> §3.6's paired rendering, by authoring discipline, and by nothing mechanical. Recording that is
> law 6, and the alternative — shipping the census kind while implying the boundary is enforced — is
> the failure mode the ruling was written to prevent. **D131.**
>
> **`[round 2]` (3) is superseded, and by a different reading of the boundary rather than by a better
> sweep.** The owner's ruling of 2026-08-16 is that the mechanism was trying to enforce the wrong
> thing: *"…so Black is better here"* was never a sentence to refuse, it was a sentence wearing
> `corpus_observed`. §3.4a cuts it at boundary rule 4, attributes it to the author, requires
> `author_principle` with a resolving entry, and §3.11 renders it under the author's name with the
> principle's counter-case beside it. **So the line the owner drew in D126 *is* now held
> mechanically — not as a prohibition on the clause, but as a refusal of the label the clause was
> riding.** What remains unheld is narrower and measured: a verdict conjoined into an
> instrument-attributed segment with no boundary marker, **29 of 225 segments** (§2.1). D131 moves
> from *open ceiling* to *sized residue*, and the census kind of this section is unchanged — it was
> ratified by D126 and is ratified again by having survived the round that rewrote the rule around it.

#### 3.8 Refusal codes, and the debt ceiling

New `SourcingIssue` codes, all raised through `issue(...)` at default **error** severity:
`CLAIM_POINTER_INVALID`, `CLAIM_POINTER_REBOUND`, `CLAIM_TEXT_DRIFTED`, `CLAIM_BINDING_DUPLICATE`,
`CLAIM_SPAN_ABSENT`, `CLAIM_SPAN_AMBIGUOUS`, `CLAIM_SPAN_CONTRADICTED`,
`CLAIM_ASSERTION_UNRECORDED`, `CLAIM_ASSERTION_UNDECLARED`, `CLAIM_CENSUS_INCOMPLETE`,
**`[cross-review]` `CLAIM_FEN_OFF_PACK`** (§3.3). One new pack-lint
code raised by `validatePackDocument` rather than by `sourcing-check`: **`CLAIM_ID_DUPLICATE`**
(§3.2). Two new `SourcingError`s: `ATTACH_SPAN_REQUIRED` and **`ATTACH_SOURCE_LINE_MISSING`** (§3.5).

> **`[round 2]` The code list moves by one withdrawal and five additions.** Withdrawn:
> `CLAIM_AUTHORED_SPAN_UNLABELLED`, which was a refusal of the sentence and is replaced by a routing
> of the label (§3.4's fence note). Added to `sourcing-check`: **`CLAIM_AUTHOR_LABEL_REQUIRED`**,
> **`CLAIM_LABEL_UNEARNED`** and **`CLAIM_READING_UNATTRIBUTED`** (§3.4a). Added to
> `validatePackDocument`, beside `CLAIM_ID_DUPLICATE` and therefore reaching every pack whether or not
> it has a ledger: **`CLAIM_PRINCIPLE_MISSING`** (the label is present and `principles` is absent or
> empty) and **`CLAIM_PRINCIPLE_UNKNOWN`** (a named id resolves against no registry entry) — §3.10.
> Net: **seventeen `CLAIM_*` codes and two `ATTACH_*` errors** — fourteen in `sourcing-check` (the
> eleven listed above plus this round's three) and three pack lints in `validatePackDocument`
> (`CLAIM_ID_DUPLICATE` plus this round's two) — all discovered by
> `refusal-coverage.test.ts` and all shipping with a test, since criterion 8's ceiling —
> **108 codes, `frozenAt` 2026-08-15**, re-read at HEAD `[V]` — may shrink and may not grow. The
> withdrawal is the interesting half of the arithmetic: it is a refusal code the mechanism **removes**
> from the debt, which is the direction that ceiling exists to encourage.

> **`[cross-review]` Criterion 8's ceiling was checked and it genuinely binds.** `refusal-coverage.test.ts`
> asserts `expect(missing).toEqual(debt)` and `expect(debt.every((code) => ceiling.codes.includes(code))).toBe(true)`,
> where `missing` is recomputed from the production sources each run and `ceiling` holds **108
> codes** frozen `2026-08-15` `[V]`. So an uncovered new code cannot be absorbed: it would appear in
> `missing`, force an edit to the *register* fixture (`tabiya.test-fixture.refusal-debt.v2`), and
> then fail the subset assertion against a ceiling it is not in. Every code above therefore ships
> with a test or the suite is red. One precision the draft omits: it is the **register** fixture, not
> the ceiling, that would have to be edited — criterion 8 forbids editing the ceiling, which is the
> right prohibition, and the register is where the attempt would surface.

`apps/server/src/refusal-coverage.test.ts` discovers refusal codes from production sources and
holds a **frozen debt ceiling** (`fixtures/refusal-debt-ceiling.fixture.json`, `frozenAt`
2026-08-15) that **can only shrink**. Every code above therefore ships **with a test**, and none is
added to the ceiling. Criterion 8 pins it.

`EVIDENCE_TYPE_UNBACKED`'s label→kind map keeps its three rows and gains nothing; what changes is
what satisfies it (§3.9). `EVIDENCE_OVERREACH` is not weakened anywhere; §3.2(5) narrows it.

#### 3.9 What `EVIDENCE_TYPE_UNBACKED` now means

The `feedbackClaims` block inside `evidenceSupports` currently requires a record of the mapped kind
whose `supports` includes the claim pointer. Since §3.2(5) forbids that pointer in `supports`, the
test is re-pointed at bindings:

> A machine-checkable label on claim *i* is **backed** iff the ledger holds a `claimBindings` entry
> for that claim, whose `spans` include at least one instrument span whose assertion resolves from a
> record of the label's mapped kind (`corpus_observed` → `explorer_frequency` **or**
> `explorer_position_census`; `engine_validated` → `engine_eval`; `tablebase_exact` →
> `tablebase_result`), **and** the binding validates in full. Otherwise `EVIDENCE_TYPE_UNBACKED`
> fires as today, at `published ? "error" : "warning"`.

Note the fail-closed shape is preserved and strengthened: a *partially* valid binding backs nothing,
because any span refusal is an error that invalidates the pack's sourcing check outright.

`rfc/feedback-delivery.md`'s C7 computes `PackRecord.boundClaimIds` at registration; its source of
truth moves from *"a record of the mapped kind supports the pointer"* to *"a validating binding
exists"*. Same field, same fail-closed default for ledger-less packs, one predicate changed. §6.

> **`[round 2]` `EVIDENCE_TYPE_UNBACKED` and `CLAIM_LABEL_UNEARNED` are different refusals and the
> distinction is load-bearing, because only one of them is a debt.** `UNBACKED` asks *does a
> validating binding exist for this label's mapped kind?* and fires when it does not — which includes
> every claim in the **15 ledger-less packs** (71 claims, 31 machine-labelled at HEAD `[V]`), where
> the honest answer is *the query was never run or never recorded*. That is payable and §4 buckets it.
> `UNEARNED` (§3.4a) asks a strictly narrower question that only arises **after** a binding validates:
> *does any segment of this sentence actually rest on the instrument whose label it carries?* It fires
> on a claim that binds a percentage in one segment and then declares `tablebase_exact`, or on a claim
> whose only spans are `authored`. That is not a debt and no wave pays it; the remedy is to correct the
> label, which takes an author one line and no instrument run. **Merging them would have hidden the
> ruling's whole subject inside a queue.**
>
> One consequence worth stating rather than leaving to be inferred: because `UNEARNED` presupposes a
> validating binding, and **0 of 68 committed ledgers carry `claimBindings`** `[V]`, the code fires on
> **0 claims at day zero** and becomes reachable only as the binding wave proceeds. It is a
> forward-looking refusal. Criterion 16 constructs its fixture rather than finding one.

#### 3.10 `[round 2]` The principle registry — owner ruling 2

The cross-review's D135 finding is that `author_principle` gates nothing: it is a member of a
seven-member enum at `schemas/drill_pack.schema.json` `$defs/feedbackClaim.evidenceTypes`, and
**nothing anywhere checks that a claim carrying it contains a principle** `[V]`. Ruling 1 routes
claims *to* that label, at scale and on purpose. So the label has to become real first, and the ruling
is that it becomes a **resolving reference**, following the pattern the shape library already ships
rather than inventing a second one. **D165**, and it is the row the rest of this section specifies.

**The pattern being followed, located by symbol.** `ShapeRegistry.loadDefault`
(`apps/server/src/shape-registry.ts`) reads every `*.json` under `content/shapes/`, validates each
through `validateShapeEntry` against `schemas/shape_entry.schema.json`, and throws `PACK_INVALID` on
the first bad file. A pack references entries by id in `pack.shapes[]`; `validatePackDocument` takes an
optional `shapes?: PackShapeLookup` and raises **`SHAPE_REFERENCE_UNKNOWN`** when an id resolves to
nothing and **`SHAPE_REFERENCE_NEVER_PRESENT`** when it resolves but the entry's trigger never fires on
an authored spine position. `pack-check.ts` supplies the registry with `await ShapeRegistry.loadDefault()`.
Every one of those five moves is copied below, including the last, which is the one that matters:
**the shape registry does not merely check that a reference resolves, it checks that the reference is
used for something the pack actually contains.**

**Where principles live.** `content/principles/<id>.json`, one entry per file, loaded by
`PrincipleRegistry.loadDefault(directory = content/principles/)` in
`apps/server/src/principle-registry.ts`, with `list()`, `get(id)`, `required(id)` and `byDigest(digest)`
mirroring `ShapeRegistry` member for member. Validated by `validatePrincipleEntry` against a new
`schemas/principle_entry.schema.json`, `$id` **`urn:chess-tabiya:schema:principle-entry:0.1`** — a
sidecar schema with its own version line, exactly as `shape_entry` has, and therefore **not** a pack
lane. Digested by `digestPrincipleEntry` in the `digestShapeEntry` mould, so a published entry has a
stable identity; references are **by id**, not by digest, because that is what `pack.shapes[]` does and
a second linkage rule here would be the invention the ruling forbids.

**What an entry carries.** The shape entry is the model, field for field, and the two additions are the
two things a shape entry has that a slogan does not:

```json
{
  "id": "tempo-is-the-currency",
  "version": "0.1.0",
  "name": "Tempo is the currency",
  "statement": "In a race, a move that only answers the opponent is a move not spent on the race; the side that first spends one attacks second from then on.",
  "phases": ["opening", "middlegame"],
  "standsOn": "chess_tradition",
  "counterCase": "A defensive move that also advances the race — f3 because Ne1 freed it — is not a spent tempo, so the rule mis-scores prophylaxis that does double duty.",
  "provenance": { "licence": "…", "sources": ["…"], "attribution": [] }
}
```

- **`statement`** is the principle in the author's own voice, and it is the object a learner reads
  (§3.11). It is not the claim text; a claim *instantiates* a principle the way a pack instantiates a
  shape.
- **`phases`** is `SHAPE_REFERENCE_NEVER_PRESENT`'s analogue and the only *use* check available: a
  principle may not be cited from a pack whose `phase` is outside it, else
  **`CLAIM_PRINCIPLE_OFF_PHASE`** at **warning** severity. Warning, not error, because a
  middlegame principle legitimately reaches an endgame conversion and the corpus does this; the
  warning exists so a citation that drifts across the whole ladder is visible rather than silent.
- **`standsOn`** is a frozen three-member enum — `chess_tradition`, `authors_practice`,
  `instrument_pattern` (a generalisation the author drew from this repo's own records). It is the one
  field that tells a learner *what kind of thing* they are being handed, and freezing it keeps it from
  becoming a free-text excuse.
- **`counterCase`** is `typicalMistakes`'s analogue and the entry's honest half: **when the principle
  is wrong.** `design/05` rung 5 says an authored claim *"can simply be wrong"*; an entry that cannot
  say when is a slogan, and the registry refuses to hold slogans. Required, non-empty.
- **`provenance`** is `$defs/provenance` from `shape_entry.schema.json` verbatim — `{licence,
  sources[], attribution[]}` — so a principle quoted from a book carries its citation and its licence,
  and `licenceObligations` (criterion 12) reaches it by the same path it reaches a record.

**How a claim names one.** `$defs/feedbackClaim` gains
`principles: { type: "array", items: {$ref: "#/$defs/id"}, uniqueItems: true }`. That is the `$defs`
change that claims pack **0.26** (§5.1). It has to be pack-side and not ledger-side, and the reason is
measured rather than aesthetic: **18 of the 81 `author_principle` claims sit in packs with no evidence
ledger** `[V]`, so a ledger-side reference would leave nearly a quarter of the label's uses resolving
against nothing — and those are exactly the packs `feedback-delivery`'s C7 already fails closed, which
is to say exactly the ones with the least other protection. `validatePackDocument` raises
**`CLAIM_PRINCIPLE_MISSING`** when `evidenceTypes` contains `author_principle` and `principles` is
absent or empty, and **`CLAIM_PRINCIPLE_UNKNOWN`** when an id resolves to no entry. As with shapes,
resolution is skipped when the registry is not supplied — `pack-check.ts` supplies it, and criterion 17
pins that it does, because a fail-open resolver nobody wires is D135 rebuilt in a new file.

**How many exist on day one, measured rather than guessed.** At HEAD, **81 claims across 35 packs carry
`author_principle`; 34 carry it alone; 15 also carry a machine-checkable label (all `tablebase_exact`);
18 sit in ledger-less packs** `[V]`. Their ids are **not** 81 distinct things: `result-not-moves` occurs
**13 times**, `order-on-your-side` twice, and the other 66 are unique `[V]`. Clustering the 81 by what
they assert gives roughly **twelve families** — outcome-drill grading (13 claims), tempo economy (~15),
construction order (~10), attacker/defender counting (~6), permanent structural concession (~6),
material-versus-purpose in conversion (~5), activity has a price (~4), preparation asymmetry (3),
threat-first reading (3), guard calibration (4), development-as-attack (2), and **authoring disclosure
(~8)**. **Day one is therefore of the order of the shape library's 25 entries, not of the corpus's 81
claims** — which is the test that this is a registry and not a rename. The exact partition is an
authoring judgement and is re-derived by the implementing pass, not inherited from this paragraph; the
three figures that are `[V]` and binding are 81, 35 and 13. **D171.**

**One family in that list is a finding, not a cluster.** The ~8 *authoring disclosure* claims —
`kid-mar-del-plata-white/window-thresholds-are-authored`, `trajectory-mate-bishop-knight/phases-are-authored`,
`mate-two-bishops/wall-then-king`, `pawn-breakthrough-convert/shape-fires-late`,
`opposite-bishops-fortress-hold/fortress-is-not-a-census` and their siblings — assert nothing about
chess. They say *which parts of this pack are authored and which are machine truth*. That is provenance
narration wearing a rung-5 label, and it is the most honest prose in the corpus sitting in the wrong
slot. The registry gives it a home as a single `standsOn: authors_practice` entry
(`authored-teaching-is-declared`), and the better long-term answer is a label of its own — **not
claimed here**, because adding an eighth `evidenceTypes` member is a design-tier question and this RFC
does not get to answer it. Recorded in Open question 6.

**Migration cost, priced honestly.** Every one of the 81 claims gains a `principles` array. That edits
**35 pack files**, which moves their content digests, which makes the stored `packDigest` stale in
every affected ledger. The blast radius is bounded and known: `check.ts` raises
**`EVIDENCE_DIGEST_STALE` at `"warning"`**, not error `[V]`, so the corpus does not go red — it goes
noisy until each ledger is re-confirmed, and re-confirmation is a re-run of `verify-draft` which
rewrites `packDigest` from `digestDrillPack(pack)`. Of the 35 packs, **29 have a ledger and 6 do not**
`[V]`, so the re-confirmation is 29 runs and the warning count is bounded above by 29. **This is the
cost the Summary's withdrawn "no committed pack byte
changes, no content digest moves" was hiding, and it is the price of ruling 2.** **D170.**

#### 3.11 `[round 2]` The delivery side, because a routing that renders identically has changed nothing

Ruling 1 is only real if a rung-5 segment reaches the learner **distinguishably** from an
instrument-backed one. Under `feedback-delivery` as drafted it would not, and the reason is a
two-valued field.

**What ships and what is claimed, located by symbol.** `evidencePacket` (`apps/server/src/guidance.ts`)
builds `authored` items carrying `attribution: authored:<kind>:<seq>` — `authoredText` handles
`annotation`, `deviation` and `plan_class`, and returns `undefined` for anything else. **A feedback
claim has no arm and reaches the packet by no route** `[V]`. `rfc/feedback-delivery.md`'s C4 adds a
fifth `AuthoredFeedbackItem` arm, `kind: "claim"`, whose provenance field is
`binding: "ledger_bound" | "self_declared"`, and C8 renders exactly two sentences from it. So:

> **`binding` is two-valued, and segment attribution produces three dispositions.** A claim with an
> instrument-attributed segment and an author-attributed segment is `ledger_bound` under C6 —
> indistinguishable from a claim every word of which is a re-derived instrument reading. The bound
> percentage buys the badge and the appended verdict rides in under it. **That is the routing
> relabelling in the ledger and rendering identically, which is the failure the owner's brief names by
> name.** **D167.**

**What this RFC asks of `feedback-delivery`** (it is that RFC's field, and §6 carries the row):

1. `binding` becomes **three-valued** — `ledger_bound` | `author_attributed` | `self_declared` —
   where `author_attributed` means *at least one instrument-attributed segment **and** at least one
   author-attributed segment*. `ledger_bound` narrows to *every segment instrument-attributed*, which
   is rarer than the draft assumed and is the honest reading of the badge.
2. The item carries **`authorSpans: readonly string[]`** (the author-attributed segments, verbatim) and
   **`principles: readonly {id, name, statement, standsOn, counterCase}[]`** (projected from the
   registry at pack registration, beside `boundClaimIds`, reading no new file during a run).
3. C8 gains a third provenance line, in the same voice as the two it has:
   > `binding: "author_attributed"` → *"Author's claim. Evidence recorded for: `<labels>`. The rest is
   > the author's judgement, resting on: `<principle name>` — `<statement>`. It can be wrong when:
   > `<counterCase>`."*

   That third sentence is the registry paying for itself. Without it, ruling 2 is bookkeeping; with it,
   a learner reading an authored verdict is handed the general rule it rests on **and the case in which
   that rule fails**, which is the strongest form *"provenance is the only safeguard"* can take
   without a review workflow. It is the same move `renderEndgameReading` makes with *"Technique
   entries: none in Tabiya's index."*: state the basis, state the absence, grade nothing.

**And it must survive `voiceCheck`, which is where this could quietly go wrong.** `voiceCheck`
(`packages/runtime/src/voice.ts`) computes `const source = packet.sentences.join("\n")` and then
**permits a word in renderer output iff that word appears in `source`** — `absentWords` is an
allow-list derived from the packet, so widening `packet.sentences` widens the LLM's licence rather
than narrowing it. That is **D145**'s mechanism and **D146**'s ceiling, and routing collides with it
head-on: ruling 1 deliberately puts *more* verdict prose into claims. Measured at HEAD over all 182
claims `[V]`: **57 contain a `BANNED_JUDGEMENTS` word** and **109 contain a `PRESCRIPTIVE_VERBS` word**
(`feedback-delivery` measured 44 and 75 over 131). Routing raises both counts by construction.

> **The rule this RFC states, and it is a prohibition rather than a mechanism: an author-attributed
> segment may never enter `packet.sentences`.** `feedback-delivery`'s **C9** already achieves it —
> `authoredText` is silent on `claim`, so no claim word can enter the allow-list by any route — and
> this RFC **does not weaken C9 and asks that it not be weakened later**. Routing makes C9 load-bearing
> where it was merely correct. That RFC's C9 was measured against 44 judgement-word claims of 131;
> corpus growth alone has taken it to 57 of 182, and routing raises it further **by design** — the
> whole point is that more verdict prose becomes sayable inside a claim. A future RFC that widens the packet
> with claim prose (the shape `rfc/evidence-at-runtime.md` is circling) must widen it with
> **instrument-attributed segments only**, and §3.4a's cut is exactly the operation that makes that
> possible — it is the first thing in this repository that can tell the two halves of a claim apart.
> **The rung-5 attribution is rendered by C8's deterministic surface and is never voiced.** **D168.**

### 4. The measured outcome — and what still fails

All figures derived from the committed corpus at `d2f34f9` `[V]`; the 131/32,560/70/61 baselines
reproduce `rfc/feedback-delivery.md` §3.2 exactly, which is the check that the population is the
same one.

> **[cross-review] The `d2f34f9` baselines reproduce exactly and the corpus has moved past them.**
> Independently re-derived from `git ls-tree d2f34f9`: **51 pack files carrying 131 claims, 32,560
> chars, 61 machine-labelled, 70 self-declared-only carrying 15,963 chars = 49.0%** `[V]`. Every
> number in this section is sound *for that commit*. At `67f6ee0` the population is **166 claims /
> 45,289 chars / 75 machine-labelled / 91 self-declared-only carrying 23,574 chars = 52.1%**, so
> day zero is **91 of 166**. Criterion 9 already requires the shipped run to win over this table;
> the cross-review's amendment to criterion 9 makes the **denominator** re-derived too, because a
> criterion that pins "131 of 131" is unfalsifiable against a corpus of 166.
>
> **`[round 2]` And it moved again, in the one column that matters here.** At `ab662f9`: **182 claims
> / 54,739 chars / 91 machine-labelled / 91 self-declared-only carrying 23,574 chars = 43.1%** `[V]`.
> Day zero is **91 of 182**. Note the shape: the cross-review's day zero was 91 of 166 and this
> round's is 91 of 182 — **the admitted count did not move at all**, because every one of `da77c56`'s
> sixteen new claims is `corpus_observed` and therefore lands on the withheld side. Sixteen claims of
> genuine, live-requeried corpus grounding **lowered** the delivered share, from 52.1% of prose to
> 43.1%, and will keep lowering it with every honest grounding wave until this RFC lands. **That is
> the most direct argument in the document for landing it**, and it is an argument the draft could not
> have made because the movement had not happened yet. Three buckets, three totals, one conclusion:
> §4's table below is a `d2f34f9` artefact and criterion 9 binds the shipped run, not it.
>
> **A third debt kind, which the three buckets do not have a slot for. D128.** Buckets 1 and 2 both
> assume a pack *has* an evidence ledger. At `d2f34f9` that was nearly true — `feedback-delivery`
> §1.2 measured 5 ledger-less packs carrying **1** machine-checkable label. At `67f6ee0` it is
> **15 ledger-less packs carrying 55 claims, 15 of them machine-labelled and 5,353 chars** `[V]`:
> `berlin-queenless-press`, `dragon-yugoslav-race` (×2), `french-advance-chain-white` (×2),
> `grunfeld-exchange-fianchetto`, `iqp-black-tarrasch-defence`, `iqp-white-panov-attack`,
> `kid-mar-del-plata-white`, `maroczy-bind-white-squeeze` (×2), `nimzo-doubled-c-pawns` (×2),
> `open-centre-ruy-exchange`, `trajectory-caro-advance-chain-bishops`. For these there is no sidecar
> to bind into, so the debt is **a sourcing run plus a ledger plus a binding**, not "the query was
> never recorded". `feedback-delivery`'s C7 fails them closed correctly, which is the mechanism
> working — but §4's sequence would silently attribute them to Bucket 2's wave and overstate what one
> explorer pass buys. **Bucket 2 is hereby two buckets**: *recorded-instrument, unrecorded query*
> and *no ledger at all*, and the implementing pass reports them separately.

**The mechanism delivers nothing by itself.** It makes payment possible. What is delivered is a
function of authoring passes, and the honest presentation is therefore a sequence, not a number.

| stage | delivered claims | claim chars | share of claim prose |
|---|---|---|---|
| today (no delivery path at all) | 0 | 0 | 0% |
| **day zero** — this RFC lands, `feedback-delivery` lands, no binding authored | **70** | 15,963 | **49.0%** |
| **after a binding pass over records already committed** | **90** | 21,003 | **64.5%** |
| **after the instrument waves** (explorer census + tablebase census + the missing engine runs) | **126** | 31,064 | **95.4%** |
| ceiling | **126 of 131** | | **95.4%** |

The 61 machine-labelled claims split three ways. The bucket assignment is an author's reading of each
claim's text against the registry; the *structural* facts it rests on (§1.2, §1.3) are `[V]`.

**Bucket 1 — 20 claims, 5,040 chars: backable with zero instrument runs.** Their machine-shaped
spans are root category/DTM/DTZ/piece count, authored-line uniformity, and the categories of *named*
deviation moves — all of which are recorded in 12 of 12 packs. Examples: `lucena-is-won`,
`philidor-is-drawn`, `kq-always-won`, `phases-are-authored` (which already enumerates its own
backing: *"the root category and DTM, the category of every position after every spine move, and the
queried category of every deviation"*), and `scandinavian-mainline-black`'s
`queen-retreats-are-a-choice`, whose cited `0.75 / 0.76 / 0.77` are all present in its own ledger.

**Bucket 2 — 36 claims, 10,061 chars: payable, and the debt is a query rather than a contract.**
23 `corpus_observed` claims need `explorer_position_census` records (§3.7) — the queries the priority
artifacts already ran, recorded as evidence this time. 13 `tablebase_exact` claims assert a census or
an off-tree position that the ledger does not contain (§1.3a) — `one-move-wins`' twenty-one legal
moves, both `stalemate-is-the-default` claims, `corner-stalemate-field`, `only-checks-win`,
`root-is-won-by-a-tempo`, `order-is-the-content`, the two DTM-optimality claims, `tempo-is-the-lesson`,
`knight-pawn-wins`' pawn-on-c2 comparison, and `lucena-bridge-convert`'s two verified-alternative
claims. The tablebase queries are cheap, repeatable and already wired through `verifySyzygyDraft`;
they simply have to be enumerated over legal successors rather than over authored moves.

**Bucket 3 — 5 claims, 1,496 chars: these must still fail, and the reason is not fixable by tooling.**
**D111.**

| claim | what it asserts | why no binding can exist |
|---|---|---|
| `mate-bishop-knight/opponent-plays-the-spine` | *"a reimplementation of the shipped rule … reproduced all nineteen of them"* | the instrument is a reimplementation that left no artifact; nothing in any ledger records that it ran |
| `trajectory-mate-bishop-knight/spine-is-the-opponent` | the same, at greater length | same |
| `trajectory-mate-bishop-knight/wrong-corner-is-forced` | *"the drive along the edge … took twenty plies"*, *"against the most resistant defence available at every turn"* | a property of the authored line and of an unrun search, not of any record — and the claim carries **no** self-declared label, so the `authored` escape is closed to it |
| `philidor-passive-rook-convert/sibling-drill` | *"the deviation that pack queries as a loss"* | the record lives in **another pack's** ledger; §3.3 forbids cross-ledger resolution, because a binding that reaches outside its own digest is unverifiable |
| `philidor-passive-rook-convert/why-the-skewer-works` | *"Rxa8 is illegal because the defending king stands on e8 between the rooks — square arithmetic"* | a legality/geometry fact carrying a `tablebase_exact` label; no tablebase record says it |

Each has an **authoring** remedy and none has a validator remedy: add `author_principle` and declare
the span as authored (rows 1–3), copy the sibling record into this pack's ledger or drop the
cross-reference (row 4), re-label to `derived_feature` and bind against the pack's
`position_legality` record (row 5). **The RFC's position is that these five staying dark until an
author acts is the mechanism working.** A design that admitted all 131 would be one that had stopped
checking.

> **[cross-review] Bucket 3 survives, but two of the five rows give the wrong reason and the right
> reason is a different clause.** Labels read at HEAD `[V]`:
> `mate-bishop-knight/opponent-plays-the-spine` is `[tablebase_exact, derived_feature]` and
> `trajectory-mate-bishop-knight/spine-is-the-opponent` is `[tablebase_exact, derived_feature]` —
> **both already carry a self-declared label**, so the `authored` escape the draft treats as the
> distinguishing feature of row 3 is *open* to rows 1 and 2. Row 3
> (`wrong-corner-is-forced`, `[tablebase_exact]` alone) and row 5
> (`why-the-skewer-works`, `[derived_feature, tablebase_exact]` — so its escape is open too) show the
> draft applied the label check to one row and not the others.
>
> What actually keeps all five dark is **§3.9, not §3.4**: a machine label is backed only if the
> binding holds *at least one instrument span whose assertion resolves from a record of the label's
> mapped kind*. Rows 1 and 2 assert a reimplementation's output and contain **no tablebase reading to
> bind** — declaring every span `authored` satisfies the sweep and still leaves zero instrument spans,
> so `EVIDENCE_TYPE_UNBACKED` fires. That is a **stronger** closure than the label fence, because it
> cannot be unlocked by editing `evidenceTypes`. The table's "why no binding can exist" column is
> corrected to name it. Row 3's stated reason is fine but incidental; row 4's cross-ledger refusal
> and row 5's mislabelling are unchanged and are the two genuine authoring remedies.
>
> **Consequence for criterion 11**, which tests that each Bucket 3 claim *"given a best-effort
> binding, is refused"*: a best-effort binding for rows 1, 2 and 5 marks their spans `authored` and
> **passes the residual sweep**. The refusal those tests must assert is `EVIDENCE_TYPE_UNBACKED`, not
> `CLAIM_ASSERTION_UNDECLARED`, and the criterion is amended to say which code each row must raise —
> otherwise the law-8 criterion passes for three rows by testing the wrong refusal.

**Why 126, not 131, is the right ceiling.** Bucket 3 is 3.8% of the claims and 4.6% of the claim
prose. That residue is the measurable content of law 8 in this corpus: it is exactly the set of
sentences that assert machine authority without a machine behind them, and it was invisible until a
binding mechanism forced the question.

#### 4.1 `[round 2]` What the routing pays for — 15 of 16

The owner's brief asks the arithmetic question directly: of the sixteen claims two measurements
declared permanently refused, how many become **deliverable at rung 5** under the routing? The two
populations are the explorer-grounding wave's **eleven** (`planning/content-era/log.md`, the D148 wave
report, §*"Every claim wanted and refused"*) and **§4's Bucket 3 five** above. Re-derived claim by
claim:

| # | source | the sentence | disposition under §3.4a | rung |
|---|---|---|---|---|
| 1 | wave | *"b4 scored 51.3 against Ne1's 49.3, so b4 is the better move order"* | both splits are recorded (2795 / 2557 games); the `so`-clause cuts at boundary rule 4 and is author-attributed | **5, deliverable** |
| 2 | wave | *"the three KID window splits are flat, so blunting before the lock changes nothing"* | three splits recorded (783/639/644 games); inference clause cut at rule 4 | **5, deliverable** |
| 3 | wave | *"Nc2 scored 78.9/0.9/20.2 over 218 games at the Maroczy root, so Nc2 is the move"* | 218 ≥ the 100-game floor, so the split is an admissible census record; verdict cut at rule 4 | **5, deliverable** |
| 4 | wave | *"…Nxd4 gives White 63.9 over 324 games, so it is a mistake for Black"* | 324 games; verdict cut at rule 4 | **5, deliverable** |
| 5 | wave | *"readiness-complete 57.7 vs the arrival branch's 52.6, so arranging first is worse for Black"* | both nodes recorded (239 / 439 games) and **both belong to this pack**, so `CLAIM_FEN_OFF_PACK` does not fire; the cross-branch comparison and the verdict are one author-attributed segment | **5, deliverable** |
| 6 | wave | *"White scores 40.2 over 6011 games, so the Berlin queenless structure favours Black at this band"* | recorded; verdict cut at rule 4 | **5, deliverable** |
| 7 | wave | *"Black scores 48.7 to White's 46.5 over 7158, so the French Advance chain is not working for White"* | recorded; verdict cut at rule 4 | **5, deliverable** |
| 8 | wave | *"…f5 scores 90.9% for White"* (Grünfeld, **11 games**) | 11 < 100, so no census record can exist; `90.9%` is a **rate** in an author-attributed segment | **REFUSED — `CLAIM_READING_UNATTRIBUTED`** |
| 9 | wave | *"d4-d5 scored 1/0/1 in its two games"* (Panov) | below floor, but the numerals are **counts, not rates**, and the population is in the sentence | **5, deliverable** |
| 10 | wave | *"d4-d5 scored 1/0/6 over seven games, so the premature break is punished"* (Nimzo) | counts with their population; the verdict clause cuts at rule 4 and is author-attributed | **5, deliverable** |
| 11 | wave | *"the cost of c4-c5 is the drop from the position's split to the post-move split"* | carries no numeral at all — it is a definition, and the drafted sweep's blindest case | **5, deliverable as prose; still refused as a `cost` field** (D148: `$defs/deviationCost` has no corpus basis) |
| 12 | §4 | `mate-bishop-knight/opponent-plays-the-spine` | no instrument span exists to bind; `CLAIM_LABEL_UNEARNED` on `tablebase_exact`; drop the label, keep the sentence | **5, deliverable** |
| 13 | §4 | `trajectory-mate-bishop-knight/spine-is-the-opponent` | same | **5, deliverable** |
| 14 | §4 | `trajectory-mate-bishop-knight/wrong-corner-is-forced` | same, and it is the row whose `authored` escape the draft said was closed | **5, deliverable** |
| 15 | §4 | `philidor-passive-rook-convert/sibling-drill` | the record is in another pack's ledger and §3.3 still forbids reaching it; the sentence is the author's report of a sibling's reading | **5, deliverable** |
| 16 | §4 | `philidor-passive-rook-convert/why-the-skewer-works` | a legality fact under a `tablebase_exact` label; `CLAIM_LABEL_UNEARNED`, relabel or bind to the pack's `position_legality` record | **5, deliverable** |

**Fifteen of sixteen become deliverable at rung 5. One stays refused, and it is the right one.** Row 8
is the only member of either population that puts a **rate** in an unbindable segment, and the rule
that refuses it (§3.4a step 3(3)) is the single asymmetry keeping the routing from being candidate (E)
with better manners. **A mechanism in which nothing is refused is a licence**, which §4 has said since
the draft; what changed is *where* the refusal sits. It sat on the sentence and it now sits on the
label — except for row 8, where the object being refused is a measurement, and a measurement cannot be
demoted into an opinion.

**Two corrections to the wave report fall out, and they are recorded here because that log is
append-only** (law 7 — `planning/content-era/log.md` is not edited, and nothing in this RFC edits it).
The wave sorted its eleven into *"seven vocabulary, four instrument"* and called the seven
**permanent**: *"No amount of authoring turns a split into a verdict, and treating them as a backlog
would be reading popularity as quality with extra steps."* Under the ruling that is **right in its
caution and wrong in its scope**. No amount of authoring turns a split into a verdict *as
`corpus_observed`* — the wave refused correctly under the rules it had, and treating the seven as a
`corpus_observed` backlog would indeed have been reading popularity as quality. It does not follow
that the sentences are unsayable. **The permanent set is one, not seven**, and the one is row 8, which
the wave filed in its other bucket. Second: its item **11** sits under *"refused because no admissible
number exists"* and **contains no number at all** — it is a definitional claim and belongs with the
seven, which is a filing error the routing makes visible rather than a measurement error. Neither
correction is a criticism of the wave; both are recorded because §4's job is to be re-derivable, and a
sizing this RFC cites and silently disagrees with would propagate.

**And the number that is not 15.** None of rows 1–11 exists in the corpus — they were **wanted and
refused**, never authored. *"Deliverable"* means *an author may now write them and the validator will
admit them at rung 5 under a named principle*, not that anything ships on landing. Rows 12–16 **do**
exist and are refused today; those five are the only ones the shipped code can be measured against, and
criterion 11 is where that happens.

### 5. Register claims

#### 5.1 Pack schema **0.26 is CLAIMED** — the release is withdrawn

> **`[round 2]` READ THIS BEFORE THE BULLETS AND THE VERIFICATION TABLE BELOW: BOTH ARE THE DRAFT'S,
> AND BOTH ARE SUPERSEDED IN THE `$defs` AND `no-pack-byte-changes` CLAUSES.** Two rounds of this RFC carried *"0.26 is released back to free"* as a headline
> finding, and `rfc/README.md`'s Active row and pack register both record the release. **Owner ruling 2
> withdraws it. This RFC claims pack schema 0.26.** It is stated here, in the section that owns the
> register claim, and not in a banner at the top of the document, because a correction in a header is
> this project's recorded recurring failure — caught five times.
>
> **What 0.26 buys, and why nothing smaller would do.** `$defs/feedbackClaim` gains
> **`principles: { type: "array", items: {$ref: "#/$defs/id"}, uniqueItems: true }`** — the slot a
> resolving `author_principle` reference has to live in, because `evidenceTypes` is an enum array with
> nowhere to put an id (§3.10). The alternative was a ledger-side reference on the binding, and it was
> rejected on a measurement rather than a preference: **18 of the 81 `author_principle` claims are in
> packs with no evidence ledger at all** `[V]`, so a ledger-side reference would leave 22% of the
> label's uses unresolvable — and those 18 sit in the same fifteen packs D128 is about, which already
> have the least protection of anything in the corpus.
>
> **And the lane pays for a second thing at zero corpus cost: `$defs/feedbackClaim` flips to
> `additionalProperties: false`, closing D112.** Measured at HEAD: **all 182 committed claims have the
> key set exactly `{id, text, evidenceTypes}`** `[V]` — 182 of 182, one distinct shape — so the
> narrowing refuses nothing that exists. D112 was opened by the drafting commit as an open defect this
> RFC could not reach; a pack lane it now holds anyway is the cheapest closure it will ever get, and
> leaving it open while editing the same `$def` would be the omission an implementer discovers later.
>
> **What 0.26 does NOT include, so the register writer does not over-read the claim:** no run-schema
> version, no migration, no `STORAGE_VERSION` bump, no other `$defs` entry, and 0.19 stays frozen
> shut. `explorer_position_census` remains a code-level `EVIDENCE_KINDS` member and not a registered
> schema version. `schemas/principle_entry.schema.json` is a **new sidecar schema** carrying its own
> `$id` at **`urn:chess-tabiya:schema:principle-entry:0.1`**, exactly as `shape_entry` carries its own
> at 0.3; sidecar schemas are not pack lanes, and the register records them the way row 0.13 records
> *"shape-entry schema 0.1 → 0.2"* — beside the pack lane that shipped them, not instead of it.
>
> **Lane hygiene, checked rather than assumed.** At HEAD `DRILL_PACK_SCHEMA_VERSION` and the
> `drill_pack.schema.json` `$id` both read **0.23**, landed by `engine-leverage` at `18d2832`;
> `vocabulary-wiring` holds 0.24 and `format-surface` holds 0.25; `rfc/README.md`'s register records
> **0.26 as the next free lane, released by this RFC** `[V]`. **0.26 is therefore free and this RFC
> takes it**, and the register's *"if `vocabulary-wiring` lands before `engine-leverage` unblocks …
> `engine-leverage`'s honest successor is 0.26"* branch is **dead**: `engine-leverage` already took
> 0.23. The next free lane after this claim is **0.27**. *(`rfc/README.md` is single-writer and this
> RFC does not edit it; this paragraph is the request, and it now asks the opposite of what the draft
> asked, which is why it says so in these words.)* **D169.**

> **This RFC claims pack schema **0.26**, NO run-schema version, NO migration, and NO new
> `EvidenceKind` beyond `explorer_position_census`, which is a code-level ledger constant and not a
> registered schema version. Bullet 1 below is rewritten for this round; bullets 2–4 are the draft's
> and still hold.**

- **Pack schema: 0.26.** `[round 2]` **This bullet read *"Pack schema: nothing"* in the draft and in
  the cross-review, and it is replaced rather than annotated, because a superseded bullet in a
  register-claims section is text an implementer lifts.** The draft's version cited
  `DRILL_PACK_SCHEMA_VERSION` as `"0.22"`; it reads **`"0.23"`** at HEAD, moved by `engine-leverage`
  and not by this RFC. What this RFC changes: `$defs/feedbackClaim` gains `principles` and flips to
  `additionalProperties: false` (the block above), so `DRILL_PACK_SCHEMA_VERSION` and the
  `drill_pack.schema.json` `$id` go to **0.26**; **0.19 stays frozen shut**; the migration edits 35
  packs and moves their content digests (§3.10). `rfc/README.md`'s provisional 0.26 row is **claimed,
  not released**, and its released-lane row is withdrawn; the next free lane becomes **0.27**.
  `engine-leverage`'s recorded 0.27-renumbering branch is dead — it took 0.23 at `18d2832`. *(`rfc/README.md`
  is single-writer and this RFC does not edit it; this is the request, and it reverses the draft's.)*
- **Migration: nothing.** No table, no column, no `STORAGE_VERSION` bump. Bindings are authoring-time
  artifacts in `content/`, never persisted per run.
- **Run schema: nothing.** No event, no policy, no occurrence. This RFC does not touch delivery.
- **Ledger schema: additive within `tabiya.sourcing.evidence.v1`.** `claimBindings` is optional and
  absent from all 68 committed ledgers, so every one stays valid; `explorer_position_census` is a
  seventh `EVIDENCE_KINDS` member with 0 existing records. No version string changes.

**That the remedy needed no format version is the finding, not the shortcut.** D97 read as a format
defect — *the schema forbids the payment* — and it is not: the pack format was never asked. The
forbidding lives entirely in `sourcing-check`'s overreach rule and in one emitter's assignment
statements.

> **`[round 2]` That finding survives, and it is worth separating from the lane claim so the two are
> not read as one retraction.** **D97's remedy still needs no format version.** Every mechanism that
> pays the unbacked-claim debt — `claimBindings`, the assertion registry, the span check, the residual
> sweep, `explorer_position_census`, §3.4a's segment attribution — lives in `sourcing-check` and the
> ledger, and would ship on **0.23** unchanged. **0.26 is claimed for something else entirely: the
> safeguard on the rung the routing demotes to.** The format was never asked to fix the debt; it is
> being asked to hold a reference so that `author_principle` means something when the debt is
> deliberately routed there. Conflating the two would make it look as though the draft's finding was
> wrong. It was not — a second, later ruling asked the format a different question.

> **[cross-review] 0.26's release HOLDS. Every one of the six claims was checked at `67f6ee0`, and
> one of them is now true for a smaller reason than the draft gives** `[V]`:
>
> | claim | verdict |
> |---|---|
> | `DRILL_PACK_SCHEMA_VERSION` untouched | **holds** — `packages/schema/src/index.ts` reads `"0.22"` at `67f6ee0` |
> | `schemas/drill_pack.schema.json` `$id` untouched | **holds** — `urn:chess-tabiya:schema:drill-pack:0.22` at `67f6ee0` |
> | no `$defs` entry added, widened or narrowed | **holds** — the mechanism lives in `EvidenceLedger`, which `validateLedger` checks in code; `schemas/` holds `drill_pack`, `drill_run`, `shape_entry` only |
> | no committed pack byte changes, no content digest moves | **holds** — `git diff d2f34f9..67f6ee0 -- content/` is additive: ten new pack files and three `content/shapes/*.json` edits, none of them a pack this RFC touches |
> | no migration, no run-schema stamp | **holds** — nothing in the mechanism is persisted per run |
> | all 68 committed ledgers stay valid unchanged | **holds** — `claimBindings` is absent from all 68 `[V]`; `validateLedger` rejects only on `schema`, `sourcedAt`, `records[]` and `abstentions[]`, so an added optional key is inert; adding a seventh `EVIDENCE_KINDS` member is additive; and §3.2(5)'s stricter fence costs **0 records**, because **0 of 893 committed records carry a `/feedbackClaims/…` support and 0 carry any `templateId`** |
>
> **The smaller reason:** the draft's `CLAIM_ID_DUPLICATE` successor (§3.2's cross-review note)
> *does* add a pack-lint refusal in `pack-validation.ts`. A refusal code is not a schema version —
> `rfc/README.md`'s register tracks `$defs` and `$id`, not lint codes, and `feedback-delivery` §5.1
> makes the same distinction — so **0.26 still releases**. It is recorded here rather than left for
> the register writer to discover, because "the remedy is validator-and-ledger only" is now
> "validator, ledger **and one pack lint**", and that sentence appears in the Summary, in
> `rfc/README.md`'s Active row, and in the changelog. All three are corrected.
>
> **A concurrent implementation moved the version in the working tree and it does not disturb this.**
> While the cross-review ran, `engine-leverage` began landing: `DRILL_PACK_SCHEMA_VERSION` and the
> `$id` now read **0.23** and `$defs/engineCondition` and a fourth `deviationCost` arm are added —
> exactly the rows `rfc/README.md` records for it, and exactly the branch under which **0.26 stays
> free** (0.23 was not frozen shut, so `engine-leverage` did not need to take 0.26). §5.2's note
> about renumbering is therefore moot in the direction that matters: **the released lane is
> unclaimed and the next free pack lane is 0.26.** The cross-review also re-read
> `attachExplorerEvidence` in that moved tree: **both pack mutations are still present**, so §3.5's
> finding is live against the working tree and not only against `67f6ee0`.
>
> **`[round 2]` Four of the six rows still hold at `ab662f9`; two are superseded by ruling 2, and one
> of the four is now true for a reason the table does not give.** Row 3 (*no `$defs` entry added*) and
> row 4 (*no committed pack byte changes, no content digest moves*) are **withdrawn** — §5.1's opening
> block adds `$defs/feedbackClaim.principles` and §3.10 prices the 35-pack, 29-ledger digest movement.
> Rows 1, 2, 5 and 6 hold, re-verified at HEAD: `DRILL_PACK_SCHEMA_VERSION` and the `$id` both read
> **0.23** (moved by `engine-leverage`, not by this RFC); nothing in the mechanism is persisted per
> run; and all 68 ledgers stay valid unchanged, because **0 of 893 records carry a `/feedbackClaims/…`
> support, 0 carry a `templateId`, and 0 ledgers carry `claimBindings`** `[V]` — every figure the
> cross-review measured reproduces exactly. Row 6's stated reason gains one clause: `validateLedger`
> is indifferent to an added optional key, **and** `EVIDENCE_DIGEST_STALE` is a `"warning"` rather than
> an error `[V]`, which is the only reason §3.10's migration can be sequenced at all rather than
> having to land atomically across 29 sidecars.
>
> Also re-read at HEAD, since `engine-leverage` landed in between: **`attachExplorerEvidence` still
> mutates the pack twice** (`explorer.ts`, the two assignments two lines apart) **and still writes
> `paths.pack` on the flat-file branch as well as `pack.json` through `atomicCanonical`** — so §3.5's
> finding and criterion 6's both-branches clause are live against `ab662f9`, not only against the
> working tree the cross-review saw. `[V]`
>
> **And a second concurrent implementation is in the working tree, in the same file, and it does not
> disturb this either.** **D149** is being fixed as this round is written: `ExplorerQuery` gains an
> optional `moves`, `normalizeExplorerQuery` defaults it to 12 and returns a `NormalizedExplorerQuery`,
> and `explorerUrl`'s hard-coded `url.searchParams.set("moves", "12")` becomes
> `String(query.moves)`. **Both pack mutations and both write branches are untouched by it** `[V]` —
> the change is upstream of `attachExplorerEvidence` entirely. Recorded rather than ignored, because
> §3.5 and criterion 6 are the only claims in this RFC that live in `explorer.ts`, and a reviewer
> re-deriving them against a dirty tree should know which diff they are looking at. It also **helps**
> §3.7: `explorer_position_census` wants the full returned move list, which is exactly what a
> configurable `moves` makes reachable, and the D148 wave's friction 3 (*"`explorerUrl` hard-codes
> `moves=12`", ~4 min, mid-flight rebuild and re-query*) is the reason it is being fixed.

#### 5.2 Sibling interfaces

- **`rfc/engine-leverage.md` (draft, **owner-blocked** on its open questions 1/3/7/9; pack 0.23 / run
  0.16 / migration 22, and it renumbers to **0.27** if `vocabulary-wiring` lands first).** Shares one file:
  `evidenceSupports` in `check.ts`, where it adds `DEVIATION_COST_UNBACKED` /
  `DEVIATION_COST_CONTRADICTED` and this RFC adds the `claimBindings` block. Different codes,
  different pack fields, no semantic overlap; merge-conflict-adjacent only. Its D64 dependency and
  this RFC's §1.2 re-verification agree: 341 records, 0 manufactured.
- **`rfc/vocabulary-wiring.md` (accepted, pack 0.24).** Its criterion 7 rewrites
  `assessedBy.retrievedAt` across committed sidecars. §4's figures are derived from those files; if
  it lands first, §4's Bucket 1/2 split is **re-derived, not assumed**. It adds no claim-pointing
  record, so the split should be stable.
- **`rfc/archive/format-surface.md` (implemented 2026-08-16; pack 0.25).** No
  overlap: it touches `$defs/trajectoryLeg`, `$defs/legOpponentPolicy` and `$defs/shapeReference`.
  This RFC touches no `$defs` at all.
- **`rfc/feedback-delivery.md` (behind this one).** §6.

> **`[round 2]` Two of the four bullets above are stale at `ab662f9` and one sentence in them is now
> false.** `engine-leverage` is no longer owner-blocked or a draft — it **landed** at `18d2832`,
> taking `DRILL_PACK_SCHEMA_VERSION` and the `drill_pack.schema.json` `$id` to **0.23** with
> `$defs/engineCondition` and a fourth `deviationCost` arm, and its migration lane was reassigned to
> **21**, not 22 (`rfc/README.md`, 2026-08-16). **Its 0.27 renumbering branch is therefore dead** and
> §5.1's lane arithmetic is what stands. And *"This RFC touches no `$defs` at all"* in the
> `format-surface` bullet is **false as of ruling 2** — this RFC now touches exactly one,
> `$defs/feedbackClaim`, adding `principles` and flipping `additionalProperties`. The overlap check
> survives it: `format-surface` touches `$defs/trajectoryLeg`, `$defs/legOpponentPolicy` and
> `$defs/shapeReference`, and `engine-leverage` touched `$defs/engineCondition` and
> `$defs/deviationCost` — **`$defs/feedbackClaim` is touched by none of them** `[V]`, so the claim
> that matters (no `$defs` collision) holds while the claim as written does not.

### 6. What this changes in `rfc/feedback-delivery.md`

That RFC's **C6 fork is dissolved rather than answered** — the owner's ruling was that the fork was
the wrong question, because all three options priced a debt that could not be paid. Precisely:

| in `feedback-delivery` | disposition |
|---|---|
| **Open question 1** (C6 / C6′ / C6″ — withhold, deliver-with-absence, or tier by label) | **dissolved.** C6 (withhold the unbacked) is retained as the rule, because withholding is now genuine deferral: every withheld claim except the five of Bucket 3 has a payable path. C6′'s numeral heuristic and C6″'s label tiering are **withdrawn** — both existed only to soften a permanent refusal |
| **§3.2 C6** (the admission rule) | shape unchanged (fail closed, `ledger_bound` / `self_declared`); the backing test is re-pointed from *"a record supports the pointer"* to *"a validating binding exists"* (§3.9) |
| **§3.3 C7** (`PackRecord.boundClaimIds` from `check.ts`'s label→kind map) | same field, same empty-set default for ledger-less packs; the predicate reads `ledger.claimBindings` |
| **Criterion 2** (a **three-branch** criterion: 70/61 under C6, 106/25 under C6′, 107/24 under C6″, conditional on the Open-question-1 ruling) | **collapses to one branch and is re-measured per wave.** With C6′ and C6″ withdrawn, only the C6 branch survives; its day-zero figure is unchanged at 70/61 *at `d2f34f9`*, and §4's table replaces the single number with the sequence 70 → 90 → 126. `[cross-review]` The draft's §6 row rendered this as "70 admitted / 61 withheld", which is the C6 branch only — accurate in effect once the fork dissolves, wrong as a description of the criterion it amends |
| **Criterion 3** (*"`ledger_bound` has no fixture in the committed corpus — this criterion must construct one"*) | still true at day zero, false after the binding pass; the constructed fixture becomes a real one |
| **Criterion 14** (a reorder test must fail `sourcing-check` or demote to `self_declared`) | **superseded by a stronger form.** D98 is closed structurally (§3.2); the test asserts `CLAIM_POINTER_REBOUND` at error, and additionally that a claim pointer in `record.supports` is refused outright |
| **Criterion 17** (D97 and D98 exist and are **not** flipped by that RFC) | still correct from its side; both are flipped by **this** RFC's archiving commit instead |
| **Open question 5** (*who owns D97, and is the binding wave a content wave?*) | **answered.** This RFC owns it; the wave is content **plus** the two instrument runs of §4's Bucket 2 |
| **Open question 4** (*what anchors a claim, eventually?*) | not claimed, but cheapened: a validating binding names FENs, all machine-checked against the pack's own spine, so a ledger-derived anchor becomes available without an authoring wave or a schema field. See Open question 3 |
| C1, C2, C3, C4, C5, C8, C9, CR1–CR5, and the disclosure model | **untouched.** This RFC changes when a claim is *admitted*, never when it is *revealed*. `[cross-review]` All fourteen identifiers were confirmed to exist in that RFC; C6′ and C6″ are the two the row omitted, and the first row above withdraws them |
| **Criterion 3's ledger-less clause** (a pack with a `corpus_observed` claim and no `.evidence.json` withholds it; the two `pack-registry.ts` fallbacks yield an empty `boundClaimIds`) | **`[cross-review]` load-bearing where it was marginal, and it must be re-measured.** That RFC measured **5 ledger-less packs carrying 1 machine-checkable label**. At `67f6ee0` it is **15 packs carrying 15 machine-labelled claims** `[V]`. The clause is unchanged and correct; what changed is that the population it fails closed grew fifteenfold, so criterion 3's constructed fixture should be a real pack rather than a synthetic one |
| **That RFC's own recommendation** (*"deliver rather than withhold — Option C (C6″) … Option B (C6′) if the fork must stay as cross-review posed it"*) | **`[cross-review]` reversed by the owner, and the reversal should be stated rather than absorbed.** §6's first row dissolves the fork and retains C6 — the option that RFC's author argued against. The owner's ruling is what carries it, and the reason it is now the right answer is exactly the one §6 gives: withholding became genuine deferral only once the debt became payable |
| **§2.5 C4** (the `claim` item arm, `binding: "ledger_bound" \| "self_declared"`) | **`[round 2]` one field widens and two are added — this is the only thing this RFC asks of that RFC's *shape*, and it is not optional.** `binding` becomes three-valued (`ledger_bound` \| **`author_attributed`** \| `self_declared`); the arm gains `authorSpans: readonly string[]` and `principles: readonly {id, name, statement, standsOn, counterCase}[]`, both projected at pack registration beside `boundClaimIds` and neither read during a run. Without the third value a mixed claim renders as fully backed and **owner ruling 1 becomes ledger bookkeeping with no learner-visible effect** — §3.11, **D167**. `KIND_ORDER`, the reveal predicate and C1's timing are untouched |
| **§3.4 C8** (two provenance lines) | **`[round 2]` gains a third**, quoted in §3.11: the `author_attributed` line names the principle, its statement, and its counter-case. That sentence is what makes ruling 2 worth its migration; without it the registry is a validator artifact a learner never sees. It grades nothing and stays inside `BANNED_JUDGEMENTS`, which is C8's own floor |
| **§3.5 C9** (claims excluded from the evidence packet, `/voice` and `/speech`) | **`[round 2]` unchanged, and promoted from correct to load-bearing.** Routing deliberately increases the verdict prose in claims; `voiceCheck`'s allow-list is computed **from** `packet.sentences`, so any route that put an author-attributed segment there would hand the renderer its judgement vocabulary. Re-measured at HEAD: **57 of 182 claims carry a `BANNED_JUDGEMENTS` word and 109 carry a `PRESCRIPTIVE_VERBS` word** `[V]`, up from that RFC's 44 and 75 over 131. **This RFC asks that C9 not be weakened**, and states the successor rule for whoever widens the packet later: instrument-attributed segments only — §3.11, **D168** |
| **Criterion 2's day-zero figure** (70/61 at `d2f34f9`) | **`[round 2]` re-derived at `ab662f9`: 91 admitted / 91 withheld of 182 claims** — 50.0% of claims and 43.1% of claim prose `[V]`. The prose share **fell** (49.0% → 43.1%) while the claim share stayed near half, because `da77c56`'s sixteen new `corpus_observed` claims are long ones. Criterion 9 already binds the shipped figure over this document's; the movement is recorded so nobody reads the fall as a regression |

## Deviations from design

1. **`design/05-in-run-experience.md` §3's rung 5 — *"provenance is the only safeguard"*.** This RFC
   takes that sentence literally and builds the safeguard it names. It adds no rung, moves nothing
   between rungs, and grants the renderer nothing: §3.6's rendered lines are frozen templates over
   record values, which is rung 0/4 machinery, and no claim text enters the evidence packet (that
   exclusion is `feedback-delivery`'s C9 and is untouched here).
2. **`docs/content-sourcing.md` and `docs/tablebase-grounding.md`** describe the current attach path,
   including the prose substitution. Both are **docs** — canonical descriptions of what exists — and
   are updated in the implementing commit. No design-tier statement is contradicted.
3. **No `design/` document is edited by this RFC.** The B4 residual shrinks (a claim can now carry
   machine-checked provenance) and does not close; the ledger consequence is criterion 10.
4. **`[round 2]` The principle registry is the first thing in the repository that gives rung 5 a
   floor, and it adds no rung.** `design/05-in-run-experience.md` §3 defines rung 5 as *"Authored
   claims — an author's judgement. Can simply be wrong, and with no review workflow provenance is the
   only safeguard"*. §3.10 builds the safeguard that sentence names and nothing else: a principle
   entry is authored prose with a citation and a stated counter-case, it is graded by nothing, it
   produces no machine claim about chess, and no LLM writes any part of it. The routing of §3.4a
   likewise moves nothing between rungs — it corrects which rung a claim was *already* on. **What is
   new, and is stated here because it borders intent tier:** a claim may now carry rung-4 and rung-5
   content simultaneously and be rendered as both, which `design/05` neither provides for nor forbids.
   §3.11's three-valued `binding` is the smallest expression of that, and if the owner reads it as a
   ladder change rather than a labelling one, it is Open question 6's territory and belongs in an
   amendment to that document rather than here.
5. **`[round 2]` The routing does not reopen the rejected list, and the nearest edge is named.**
   Rung-5 delivery of an authored verdict is *not* "LLM-generated strategic lessons as content" — the
   sentences are the author's, `voiceCheck` and C9 keep them out of the renderer's licence (§3.11),
   and no principle entry is machine-written. The genuine edge is a **community** principle channel,
   which would make the registry a publishing surface for ungrounded strategic claims; the RFC ships
   `official` only and Open question 7 flags it for a ruling before anyone builds one.

Otherwise: none.

## Acceptance criteria

1. **The forbidden path stays forbidden, and is measurably narrower.** A record whose `supports`
   contains `/feedbackClaims/<i>/text` raises `EVIDENCE_OVERREACH` **regardless of kind or
   template** — tested for `tablebase_result`, `explorer_frequency` with a valid template, and
   `engine_eval` with `engine-move-loss/v1`. The third and fourth cases pass today and must fail
   after; a test written **before** the change records that inversion. **`[cross-review]` And the
   same for the other four `PROSE_POINTERS`**: a templated `engine_eval` supporting
   `/objective/summary`, `/planClasses/0/description`, `/deviations/0/note` or
   `/spine/0/annotations/0` must raise `EVIDENCE_OVERREACH` after the change. Those four **pass
   today** under the record-level template exemption and would have kept passing under the drafted
   §3.2(5), with the byte-exact comparison deleted — see §3.2's cross-review note. Without this the
   criterion certifies a narrowing that is a net widening.
2. **A `tablebase_result` record backs authored prose, and the prose is byte-unchanged.** End to end:
   take `philidor-third-rank-hold`'s `philidor-is-drawn`, author a binding with a
   `tablebase.category@v1` span, run `sourcing-check`, assert the pack validates, that
   `EVIDENCE_TYPE_UNBACKED` no longer fires for it, and that `content/drafts/philidor-third-rank-hold.json`
   is **byte-identical** before and after. This is D97's closure and it is one test.
3. **Every span refusal fires, each with its own fixture.** `CLAIM_SPAN_ABSENT` (span not in text),
   `CLAIM_SPAN_AMBIGUOUS` (span twice), `CLAIM_SPAN_CONTRADICTED` (author writes `draw`, record says
   `win`), `CLAIM_ASSERTION_UNRECORDED` (assertion names an unqueried FEN),
   `CLAIM_CENSUS_INCOMPLETE` (a `moveCensus` over a position with 4 of 21 successors recorded — use
   `philidor-passive-rook-convert` as it stands today, which is the real corpus state),
   `CLAIM_POINTER_REBOUND`, `CLAIM_TEXT_DRIFTED`. **`[round 2]` `CLAIM_AUTHORED_SPAN_UNLABELLED` is
   struck from this list — it is withdrawn (§3.4) — and `CLAIM_AUTHOR_LABEL_REQUIRED` takes its
   fixture: the same pack, the same `authored` span, and the assertion is now that the message names
   `author_principle` as the remedy and that adding the label **and a resolving principle** makes the
   pack validate with the text byte-unchanged. A refusal that does not carry its own remedy is how
   authors learn to relabel instead of to bind.**
4. **The residual sweep is not decorative — and its limit is tested too.** A binding that declares
   one of a sentence's three numerals is refused with `CLAIM_ASSERTION_UNDECLARED`, naming the
   surviving token. Tested with a digit residue, a spelled-out residue (`"nine"`) **and an ordinal
   residue (`"sixth"`)**, since the corpus writes all three `[V]`. **`[cross-review]` And one test
   asserts the sweep's ceiling rather than its floor**: a claim binding a single valid span and
   carrying an appended qualitative verdict — the owner's own refused example from D126,
   *"…so Black is better here"* — **passes** the sweep with an empty residual. That test is not a
   bug report; it is the executable statement of what §2 and §3.7 say in prose, so that no later
   reader mistakes the sweep for a truth check. If someone later closes it, the closure is a design
   change and needs an RFC.

   > **`[round 2]` The closure happened, in this RFC, and the criterion inverts rather than being
   > deleted.** The owner refused the ceiling and §3.4a fires on exactly that case, so the sweep test
   > keeps its assertion — *the residual is empty* — and gains the assertion that **the claim is
   > refused anyway**, with `CLAIM_AUTHOR_LABEL_REQUIRED` if it binds a percentage and appends the
   > verdict, or `CLAIM_LABEL_UNEARNED` if it binds nothing and declares `corpus_observed`. Both
   > branches use the owner's own example verbatim. **The pairing is the point**: one assertion proves
   > the sweep is still blind, the next proves something else is not, and a later reader who deletes
   > the first has deleted the evidence for why §3.4a exists. Add a third assertion that the sentence
   > is **not** removed from `text` by any of it — routing must never be testable by whether the
   > sentence survived, because it always does.
5. **The validator never queries.** A grep test asserts `claim-binding.ts` imports no fetch, no
   `ExplorerClient`, no `liveTablebaseQuery`, and no engine client; and a run of `sourcing-check`
   with the network unavailable produces identical output.
6. **The overwrite is gone, and so is the second one.** `[cross-review]` A grep test asserts
   `explorer.ts` contains **no assignment to `pack.`** at all — not merely none to `feedbackClaims`,
   because `pack.provenance.sources` is assigned two lines later and `digestDrillPack(pack)` runs
   over the result, so the drafted criterion would have gone red on a faithful implementation
   (§3.5). `attachExplorerEvidence` without a span refuses with `ATTACH_SPAN_REQUIRED`; against a
   pack whose `provenance.sources` lacks the explorer rationale it refuses with
   `ATTACH_SOURCE_LINE_MISSING` **before issuing any query**; with a span and a prepared pack it
   writes a `claimBindings` entry, leaves `pack.json` byte-identical, and leaves the ledger's
   `packDigest` unchanged. Tested on **both** write branches — the directory branch through
   `atomicCanonical` and the flat-file branch that `content/drafts/*.json` uses — since only the
   first was named in the draft.
7. **Every committed ledger still validates unchanged.** `sourcing-check` over all 68 ledgers under
   `content/` produces the same issue set as at `d2f34f9`, code for code. `claimBindings` is
   optional and nothing regresses on its absence.
8. **The refusal-debt ceiling shrinks or holds; it never grows.** All **seventeen** `CLAIM_*` codes
   and both `ATTACH_*` errors are discovered by `refusal-coverage.test.ts` **and covered by tests**;
   `apps/server/src/fixtures/refusal-debt-ceiling.fixture.json` (**108 codes, `frozenAt` 2026-08-15**,
   re-read at HEAD `[V]`) is not edited. **`[round 2]` The drafted form said "eleven", which was the
   pre-cross-review count; the round-2 list is fourteen in `sourcing-check` and three pack lints
   (§3.8), and one drafted code — `CLAIM_AUTHORED_SPAN_UNLABELLED` — is **withdrawn** rather than
   renamed, so the test must assert it is absent from the discovered set. A withdrawn refusal is the
   only kind of movement this ceiling is designed to reward, and it should be visible in the run.**
9. **The measured outcome is reproduced by the shipped code, not by this document.** The Bucket
   1/2a/2b/3 split and the delivery sequence are recomputed in `planning/claim-backing/` from the
   shipped validator after the binding pass, **against the corpus at the implementing commit, whose
   size is re-derived and not inherited from §4**. **If the shipped figure disagrees with §4, §4 is
   wrong and is corrected there rather than the code being bent to it.** The refusal residue is
   named, not counted: **`philidor-passive-rook-convert/sibling-drill` and
   `philidor-passive-rook-convert/why-the-skewer-works` must still be refused, by name**, unless an
   author has performed the remedy §4 names for each; a run in which no claim is refused fails this
   criterion.

   > **`[cross-review]` The drafted form could be satisfied vacuously and was pinned to a dead
   > denominator.** *"A run that admits 131 of 131 fails this criterion"* is unfalsifiable at HEAD,
   > where there are **166** claims — the shipped code will never report 131 of 131 again, so the
   > clause can never fire. And *"Bucket 3 must remain non-empty"* puts the threshold at **1**, which
   > is the first integer off zero — the project's own standing rule, applied by the owner to the DTZ
   > floor eight hours after this draft ("**a measurement can smuggle a verdict: the threshold must
   > sit off the instrument's optimality boundary**"), rules that out. A count-of-one threshold sits
   > *on* the boundary of "did anything refuse at all", and any implementation that refuses one
   > trivial claim clears it. **Naming the claims moves the threshold off the boundary**: rows 4 and 5
   > of §4's Bucket 3 table are the two whose refusals no relabelling can lift — row 4 because
   > cross-ledger resolution is forbidden by §3.3, row 5 because a legality fact carries a
   > `tablebase_exact` label — so they are the ones that test the mechanism rather than the count.
   > Rows 1–3 are deliberately **not** named, because §4's cross-review note shows their refusal is
   > authoring-dependent and criterion 11 already covers them with the right code.

   > **`[round 2]` The two named claims are the wrong two now, and the reason is that owner ruling 1
   > moved the thing they were chosen for.** Rows 4 and 5 were named as *"the two whose refusals no
   > relabelling can lift"*. Under routing, **relabelling is the sanctioned remedy** — §4.1 rows 15
   > and 16 both become rung-5 deliverable — so naming them would pin the criterion to a refusal the
   > RFC now expects an author to lift. The residue has to be re-picked against the rule that survives
   > relabelling, and there is exactly one: **§3.4a step 3(3), the rate rule.**
   >
   > **The named residue becomes `anti-scandinavian-white/h3-is-the-move` and
   > `anti-scandinavian-white/just-take-it`.** Both quote centipawn displays — `+1.09`, `+0.66`,
   > `−1.06` — for which no record exists in any of the 68 ledgers: re-derived at HEAD over every
   > `candidates[].centipawns`, there are **157 distinct values**, `1` and `52` are present, `−107` and
   > `−110` are present, and **`109`, `−106`, `−120` and `−170` appear nowhere** `[V]`. A rate with no
   > record cannot be bound (`CLAIM_ASSERTION_UNRECORDED`) and cannot be attributed to the author
   > (`CLAIM_READING_UNATTRIBUTED`), and **no `evidenceTypes` edit reaches either code**. Their remedy
   > is an engine run — Bucket 2, genuinely payable — which is the correct shape for a criterion
   > residue: it tests that the mechanism refuses, not that it refuses forever. **A run in which both
   > are admitted without those records having been written fails this criterion**, and so does a run
   > in which no claim is refused at all.
10. **The ledger and the log are updated in the archiving commit.** **D97** flips to ✅ with the
    measured split named and the owner ruling quoted; **D98** flips to ✅ with §3.2's structural
    closure; **D110**, **D111** and **D112** are opened by the drafting commit and carry their
    measurements. **`[cross-review]` D110's row title is corrected to say which predicate it counts
    (7 full-set census claims, not 13 — §1.3a); **D126** flips to 🔨 owned here and is named in §3.7;
    and **D128**–**D136** are opened by the cross-review commit with the measurements that found
    them.** `rfc/README.md`'s pack-schema register releases **0.26** (single-writer edit, not made
    here). A dated entry lands in `planning/exploration/log.md`.

    > **`[round 2]` Three additions and one reversal.** **D112** flips to ✅ — `$defs/feedbackClaim`
    > goes `additionalProperties: false` in the 0.26 lane at zero corpus cost (§5.1) — which is the
    > first row this RFC *closes* rather than opens, and it closes one it opened itself.
    > **D131** flips from open ceiling to 🔨 with §2.1's residue figure (29 of 225) as its measured
    > size, and **D135** flips to 🔨 with §3.10's registry named as the answer rather than the window
    > binding. **D163**–**D172** are opened by the round-2 commit with the measurements that found
    > them. **And the register request reverses**: `rfc/README.md`'s pack register **claims 0.26** and
    > its Active row loses the *"remedy is validator-and-ledger only"* sentence, which is the same
    > single-writer edit the draft asked for in the opposite direction — an archiving commit that
    > flips rows while leaving a released lane recorded as released is the collision class that
    > register exists to prevent.
11. **The five must still fail, each on the code that actually refuses it.** A test asserts that
    each Bucket 3 claim, given a best-effort binding, is refused — and asserts **which** refusal:
    rows 1, 2 and 5 raise **`EVIDENCE_TYPE_UNBACKED`** (a best-effort binding declares their spans
    `authored`, passes the residual sweep, and still holds zero instrument spans of the mapped
    kind — §3.9), row 3 raises `CLAIM_AUTHORED_SPAN_UNLABELLED` **and** the sweep names which token
    survived, row 4 raises `CLAIM_ASSERTION_UNRECORDED` because the record is in another pack's
    ledger. This is the law-8 criterion and it is the one that must not be softened to make a wave
    green. **`[cross-review]` The drafted form asserted only "the refusal names which token is
    undeclared", which is `CLAIM_ASSERTION_UNDECLARED` — the code that fires for exactly one of the
    five. For rows 1, 2 and 5 it would have tested a refusal that does not happen, and a law-8
    criterion that passes by asserting the wrong code is worse than no criterion.**

    > **`[round 2]` The criterion's title is now false and its body is now two assertions per row.**
    > "The five must still fail" was written when failure meant the sentence was lost; under owner
    > ruling 1 **all five are deliverable at rung 5** (§4.1 rows 12–16) and what must still fail is
    > their **machine label**. Each row therefore asserts a pair:
    >
    > - **the label is refused** — rows 1, 2, 3 and 5 raise **`CLAIM_LABEL_UNEARNED`** naming
    >   `tablebase_exact` (a best-effort binding leaves them with zero instrument-attributed segments,
    >   §3.4a step 3(2)); row 4 raises `CLAIM_ASSERTION_UNRECORDED`, because §3.3 still forbids
    >   reaching the sibling pack's ledger. **`EVIDENCE_TYPE_UNBACKED` remains the code for the
    >   ledger-less and unbound cases and is not the code these five raise once a binding is
    >   attempted** — §3.9's round-2 note draws the line;
    > - **the sentence is not** — after the remedy §4.1 names (drop the instrument label, add
    >   `author_principle`, name a resolving principle), each of the five validates with its `text`
    >   **byte-unchanged** and is delivered with `binding: "self_declared"` and the principle's
    >   statement and counter-case beside it (§3.11).
    >
    > A test that asserts only the first half would pass a mechanism that deleted all five, which is
    > the mechanism the owner refused three times. **The second assertion is the law-8 criterion now.**

12. **`licenceObligations` follows the binding.** Its CC-BY-SA attribution requirement currently
    triggers on records supporting `PROSE_POINTERS`; it must also trigger on records reached through
    a `claimBindings` assertion, or a CC-BY-SA-sourced record could back prose with no notice. No
    present effect (Lichess and Syzygy are both no-rights-asserted), which is why it needs a test
    rather than an observation.

13. **`[cross-review]` The relabelling pressure is measured, since it cannot be prevented.** The
    implementing pass reports, before and after the binding wave, how many claims **lost** a
    machine-checkable label or **gained** a self-declared one. §3.4 shows the fence is unlocked by
    one array element and that the cheapest response to a refusal is to relabel; §3.9 then admits
    the result as `self_declared` with no sweep. Nothing in the validator can distinguish an honest
    relabel from an evasive one, so the criterion is a **measurement with a named escalation**: a
    net movement of machine labels to self-declared ones is reported to the owner as a finding under
    law 6, not resolved by the implementer.

    > **`[round 2]` The measurement stands; the escalation trigger moves, because the routing makes
    > the movement expected.** Under ruling 1 a claim losing a machine label it never earned is the
    > mechanism working, so "net movement" can no longer be the trigger — it would fire on success.
    > The trigger becomes **concentration**: the pass reports the distribution of `principles`
    > references across registry entries, and escalates if **any single entry backs more than a third
    > of the author-attributed claims**, or if the wave adds a registry entry whose `counterCase` is
    > shared verbatim with another. Both are the shape a rubber-stamp takes, and both are cheap to
    > compute. Baseline for the comparison, at HEAD `[V]`: 81 `author_principle` claims, one id
    > (`result-not-moves`) recurring **13 times** — 16% — which is the corpus's own current
    > concentration and the number the threshold is set above.

14. **`[cross-review]` The new structural refusals fire.** `CLAIM_ID_DUPLICATE` on a pack with two
    claims sharing an `id` (**0 committed packs affected today** `[V]`, so this is a constructed
    fixture); `CLAIM_FEN_OFF_PACK` on a binding whose `tablebase.category@v1` names a FEN with a
    record in this ledger that is **not** reachable from the pack's `start.fen` — built from
    `philidor-third-rank-hold`, whose ledger holds 23 `tablebase_result` records, so the fixture is
    the real corpus state; and a test that §3.9's backing test resolves **by pointer**, by
    constructing the duplicate-id rebinding of §3.2's cross-review note and asserting the second
    claim is **not** admitted.

15. **`[round 2]` The cut is frozen and the corpus proves it.** A table test runs §3.4a's boundary set
    over all **182** committed claims and asserts: no decimal, ellipsis or `1.d4`-style move number is
    cut by rule 1; the **91** machine-labelled claims produce **69 claims carrying at least one
    token-free segment**, **126** such segments in total, and **225** machine-shaped segments of which
    **29** also carry a `BANNED_JUDGEMENTS` word `[V]`. The last figure is the criterion's real work:
    it is §2.1's stated residue, and pinning it means a later change to the boundary set that
    silently widens or narrows the residue turns the suite red instead of drifting. Adding a boundary
    form is an RFC; the test is what makes that true rather than aspirational.

16. **`[round 2]` The routing fires, and it fires on the owner's own example.** Four fixtures:
    (i) a claim binding one `explorer.scorePct@v1` span with *"…so Black is better here"* appended
    raises **`CLAIM_AUTHOR_LABEL_REQUIRED`**, and validates once `author_principle` and a resolving
    `principles` entry are added, with `text` **byte-identical**; (ii) the same sentence declared
    `corpus_observed` with **no binding at all** raises **`CLAIM_LABEL_UNEARNED`** naming
    `corpus_observed`, and is distinguishable in the issue set from `EVIDENCE_TYPE_UNBACKED`;
    (iii) *"…f5 scores 90.9% for White"* in an author-attributed segment raises
    **`CLAIM_READING_UNATTRIBUTED`** and **is not lifted by adding any label**, tested by adding all
    four self-declared labels in turn; (iv) *"d4-d5 scored 1/0/6 over seven games"* in an
    author-attributed segment **validates**, because counts carry their population. Fixture (iv) is
    not padding — it is the executable form of the asymmetry in §2.1, and without it a later
    implementer tightening (iii) into "no numerals in authored segments" would break the ruling and
    pass the suite.

17. **`[round 2]` The principle registry resolves, and the resolver is wired.**
    `PrincipleRegistry.loadDefault()` loads every entry under `content/principles/` and throws on the
    first invalid one, mirroring `ShapeRegistry.loadDefault`; `validatePrincipleEntry` refuses an
    entry with an empty `counterCase`, an unknown `standsOn`, or a missing `provenance.licence`;
    `validatePackDocument` raises `CLAIM_PRINCIPLE_MISSING` and `CLAIM_PRINCIPLE_UNKNOWN` on
    constructed fixtures and `CLAIM_PRINCIPLE_OFF_PHASE` at **warning**. **And a wiring test asserts
    `pack-check.ts` supplies the registry** — `await PrincipleRegistry.loadDefault()` beside its
    existing `await ShapeRegistry.loadDefault()` — because resolution is skipped when the lookup is
    absent, exactly as it is for shapes, and **an unwired fail-open resolver is D135 rebuilt in a new
    file**. Separately: `sourcing-check` must **not** import the registry, since §3.3 forbids the
    validator reaching outside the pack's own ledger and a principle is not a record; criterion 5's
    grep test extends to it.

18. **`[round 2]` Delivery attributes, measurably.** A test constructs one claim of each of the three
    `binding` values and asserts the three C8 provenance lines differ, that the `author_attributed`
    line contains the principle's `name`, `statement` and `counterCase`, and that **no line contains a
    `BANNED_JUDGEMENTS` word that is not already in the claim's own text**. And C9 is re-pinned in this
    RFC's suite as well as that one: `authoredText` returns `undefined` for `kind: "claim"`, so **no
    author-attributed segment reaches `packet.sentences`** and `voiceCheck`'s allow-list is unchanged
    by the routing — asserted by building a packet at a node after a claim is revealed and comparing
    `voiceCheck(packet, "<a banned judgement word from that claim>")` before and after. **This is the
    criterion that would catch the failure mode the owner's brief names**: a routing that relabels in
    the ledger and renders identically.

## Open questions

1. **Should `tablebase.moveCensus@v1` require a full legal enumeration, or admit an author-declared
   move subset?** §3.3 requires the full set, which is what makes *"all twenty-one legal moves"*
   checkable — and it is also why 13 claims land in Bucket 2 rather than Bucket 1. A subset form
   (*"every rook slide along the sixth rank"* — `tempo-is-the-lesson`) is legitimate prose that the
   strict rule cannot express, and the honest options are a `moveSubsetCensus` taking an explicit
   move list (checkable: every listed move must have a record, and the span must match the count) or
   leaving those claims to Bucket 2's wave. **The author's recommendation is the explicit-list
   form**, because it refuses nothing the strict rule accepts and it never lets an unenumerated
   "every" through. Not taken here because it adds a registry entry the corpus has not yet demanded.
2. **Does a binding belong to the ledger or to a fourth sidecar?** `claimBindings` sits in
   `evidence.json` because it is evidence bookkeeping and shares the ledger's `packDigest` and
   manifest linkage. A `claims.json` would separate instrument records from prose bindings more
   cleanly at the cost of a fourth file and a second linkage rule. Deferred; reversible either way,
   since no committed ledger has bindings.
3. **Does a validating binding become the claim's anchor?** `feedback-delivery`'s Open question 4
   asks what eventually anchors an anchorless claim and rules out inference. A binding's assertion
   args are FENs, author-supplied and machine-checked against the pack's own spine — *"author-supplied
   and machine-checked, therefore not an inference"*, in that RFC's own words. So a bound claim could
   be revealed at the spine node its evidence names, incrementally, instead of at pack-wide
   exhaustion. **Not claimed here** — it is a delivery change and belongs to that RFC or its
   successor — but it is now cheap, and it is the single largest thing this work makes possible.

   > **`[cross-review]` True only after §3.3 was fixed, and the fix is a precondition rather than a
   > bonus.** As drafted, only `tablebase.lineUniformCategory@v1` checked its FENs against the spine;
   > every other registry entry accepted any FEN with a record in the ledger. The phrase this
   > question borrows — *"machine-checked against the pack's own spine"* — was therefore false for
   > eight of the eleven registry entries, and an anchor derived from them would have pointed
   > wherever the author aimed it. `CLAIM_FEN_OFF_PACK` (§3.3, **D130**) makes the borrowed sentence
   > true, which is what turns this from a hope into an option. Also worth the owner's attention:
   > `feedback-delivery`'s Open question 4 warns that a ledger-derived anchor *"can never cover the
   > 37 `tablebase_exact` claims"* under the shipped contract, with the escape that *"the 341
   > `tablebase_result` records already in the 12 affected ledgers do carry anchors, which is where a
   > ledger-derived anchor would come from **if the contract were widened**"*. This RFC is that
   > widening, so the claim to cheapen Open question 4 is consistent — **because** of §3.3's
   > precondition, not in spite of it.

4. **Should the five Bucket 3 claims be re-authored in this wave or left visibly dark?** Leaving them
   dark is defensible and is the mechanism working; re-authoring them is four labels and one
   sentence. **This is an owner call and it is an authoring decision, not a tooling one** — which is
   the distinction D97 existed to force.

   > **`[round 2]` Owner ruling 1 answers half of it and sharpens the half that is left.** "Left
   > visibly dark" is no longer available as a resting state: under §3.4a all five raise
   > `CLAIM_LABEL_UNEARNED` or `CLAIM_ASSERTION_UNRECORDED` at **error**, so the pack does not
   > validate until an author acts. The question that remains is narrower and is still the owner's:
   > **which of the five get a principle and which get an instrument run.** Rows 12–14 of §4.1 assert
   > a reimplementation's output that left no artifact — a principle entry (`authored-teaching-is-declared`)
   > is honest and one line; re-running the reimplementation and recording it is honest and better.
   > Row 16 has a genuine instrument remedy (bind to the pack's own `position_legality` record) and
   > taking the principle route there would be the cheap move the registry exists to make expensive.
   > **The recommendation is: rows 12–15 by principle, row 16 by binding**, and the reason to record it
   > rather than just do it is that this is the first decision the routing makes available, and how it
   > is made sets the corpus's habit.

5. **Do the two retired template branches come back?** §3.2(5) makes `explorerTemplate`'s and
   `engineTemplate`'s prose comparison unreachable. The byte-exact generated sentence remains the
   strongest possible binding and costs nothing to keep as *values* validation, which is what this
   RFC does. If a future surface wants generated prose in a pack, it re-enters through
   `claimBindings` with a whole-text span, which is strictly better because the author must still
   accept the sentence into their file. Recorded so the retirement is not read as a loss.

6. **`[round 2]` Do the ~8 authoring-disclosure claims need an eighth `evidenceTypes` member?**
   `window-thresholds-are-authored`, `phases-are-authored`, `wall-then-king`, `shape-fires-late`,
   `fortress-is-not-a-census` and their siblings assert nothing about chess — they say which parts of
   the pack are authored and which are machine truth. §3.10 houses them under a single
   `standsOn: authors_practice` entry, which works and is slightly dishonest: a provenance disclosure
   is not a principle, and calling it one is the category error this whole RFC is about, one level up.
   The clean answer is a `provenance_note` member on the enum. **Not claimed**, and deliberately: adding
   an `evidenceTypes` member changes what the rungs of `design/05` §3 mean, which is intent tier and
   law 5. Raised so the registry's first compromise is on the record rather than discovered later.

7. **`[round 2]` Who may add a principle entry, and does the registry get a `community` channel?**
   `ShapeRegistry` already carries `ShapeChannel = "official" | "community"` and a `publisherHandle`,
   and `add()` refuses to let a community entry displace an official one. `PrincipleRegistry` copies the
   class; whether it copies the *channel* is a different question, because a shape entry is a
   structural predicate a machine can check and a principle entry is a claim about chess that no
   machine can. **The RFC ships `official` only** and takes no position beyond that. Worth an owner
   ruling before anyone builds a publishing surface, because a community principle registry is a
   route to LLM-generated strategic lessons arriving through a side door, which is the first item on
   this project's rejected list.

## Changelog

- 2026-08-15: created. Owner ruling on D97 (*"why not fix them properly?"*) after all three C6
  options were refused. Five binding mechanisms evaluated (§2); author-declared span mapping +
  residual sweep + content digest recommended; `EVIDENCE_OVERREACH` narrowed rather than widened.
  Pack schema **0.26 released** — the remedy is validator-and-ledger only. D98 closed structurally.
  Three new ledger rows opened from measurements taken during drafting: no position in the corpus has
  a complete legal-move census (D110), five claims assert what no instrument measures (D111),
  `$defs/feedbackClaim` is `additionalProperties: true` (D112).
- 2026-08-15, **adversarial cross-review** (a second agent; did not write the draft). Re-derived at
  `67f6ee0`. **Pack 0.26's release HOLDS** — all six sub-claims verified in §5.1's table; the remedy
  is now "validator, ledger and one pack lint". **The residual sweep survives as a numeral guarantee
  and does not survive as a completeness guarantee**, and §2, §3.4, §3.7 and criterion 4 now say so.
  Broken and fixed in the body: *"0 of 241 positions is fully censused"* (36 are — all single-legal-move
  links; the true and stronger figure is 0 of 199 choice-bearing positions); centipawn `1` listed as
  absent when it is present; the Summary attaching prose-char percentages to claim-count ratios;
  §3.2(5) widening the gate it advertises as a narrowing, because the template exemption is
  record-level not pattern-level; D98 not airtight, because duplicate `feedbackClaims[].id` is
  refused nowhere and §3.9's id-keyed lookup turns that into a surviving rebinding; assertion `fen`
  args not required to belong to the pack, which also falsified Open question 3's premise; the
  `authored` fence refusing **all 36** `corpus_observed` claims on their date windows, because
  registry v1 had no assertion returning them — the fix binds the window rather than excusing it;
  ordinals outside the frozen table and therefore outside the sweep in 24 of 75 claims; §3.5
  stabilising `packDigest` while a second pack mutation (`provenance.sources`) remained; two of
  Bucket 3's five rows given the wrong reason; criterion 9 satisfiable vacuously and pinned to a dead
  denominator; criterion 11 asserting a refusal code that fires for one of its five rows. Corpus
  restated at HEAD: **166 claims, 75 machine-labelled, 15 packs with claims and no ledger** — the
  third debt kind §4 had no slot for. **D126 was owner-ruled after the draft and names this RFC as
  its owner**; §3.7 now carries it, including the part the mechanism cannot enforce. Rows opened:
  **D128**–**D136**.
- 2026-08-16, **round 2** (the draft's author, after the cross-review returned it). Re-derived at
  `ab662f9`. **Two owner rulings, and both change the mechanism rather than the prose.**
  **(1) Route the claim; do not forbid the sentence** — the cross-review escalated D131 as unfixable
  and proposed shipping with the ceiling stated; the owner refused, on the ground that the boundary
  was never *"never say Black is better"* but *"never say it as corpus observation"*. §2.1 adds
  candidate **(F) segment attribution**; §3.4a specifies it, including `CLAIM_LABEL_UNEARNED` for the
  empty-residual case that no span rule can reach, and `CLAIM_READING_UNATTRIBUTED` for the one thing
  routing must not launder — **a rate hides its denominator; a count carries it**.
  `CLAIM_AUTHORED_SPAN_UNLABELLED` is **withdrawn**, and the authored-span fence narrows to
  `author_principle` alone so D135's escape cannot move one label left.
  **(2) Build the principle registry** — §3.10 adds `content/principles/`, `PrincipleRegistry`,
  `schemas/principle_entry.schema.json` at 0.1, and `$defs/feedbackClaim.principles`, following
  `ShapeRegistry` and the shape-entry schema field for field, with `counterCase` as
  `typicalMistakes`' analogue and `phases` as `SHAPE_REFERENCE_NEVER_PRESENT`'s.
  **Pack schema 0.26 is CLAIMED and the draft's release is WITHDRAWN** (§5.1), which also closes
  **D112** at zero corpus cost — 182 of 182 claims carry the key set exactly `{id, text,
  evidenceTypes}`. §3.11 adds the delivery half, because a routing that renders identically has
  changed nothing: `binding` goes three-valued, C8 gains a third provenance line naming the principle
  and its counter-case, and **C9 is re-affirmed rather than weakened** — `voiceCheck`'s allow-list is
  computed *from* `packet.sentences`, and routing raises the judgement-word count from 44 of 131 to
  **57 of 182**. Measured this round `[V]`: **182 claims / 91 machine-labelled / 47 packs with claims
  / 68 ledgers / 893 records / 0 claim-pointer supports / 0 templated records / 0 duplicate claim ids**;
  **69 of 91 machine-labelled claims carry a segment with no machine-shaped token, 126 such segments**,
  which is D131 sized at 76% of the machine-labelled corpus rather than a corner; **29 of 225**
  machine-shaped segments carry a judgement word, which is (F)'s honest residue; **81
  `author_principle` claims across 35 packs, 13 sharing one id**, which is the registry's day-one
  sizing and its migration bill (29 ledgers re-confirmed on an `EVIDENCE_DIGEST_STALE` **warning**).
  §4.1 answers the payoff question: **15 of the 16 permanently-refused claims become deliverable at
  rung 5, and the one that does not is the one that states a rate over eleven games.** Two corrections
  owed to the D148 wave report: its seven "permanent" refusals are permanent only as
  `corpus_observed`, and its item 11 is filed under "no admissible number exists" while containing no
  number. Criteria amended: 3, 4, 8, 9, 11, 13; added: 15–18. Open questions added: 6, 7. Rows opened:
  **D163**–**D172**.
