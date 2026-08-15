# RFC: Claim backing — an instrument record may back an author's sentence without replacing it

- **Status:** draft
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
  found it sits.
- **Ledger row this RFC now owns and did not cite** `[cross-review]`: **D126** — *are explorer W/D/B
  result splits admissible as `corpus_observed`?* — was **owner-ruled ADMISSIBLE 2026-08-15** at
  `4e19b95`, after this draft was written, and the ruling names *"`rfc/claim-backing.md` (the
  `explorer_position_census` record kind)"* as its owner. The ruling carries a boundary — **"the
  split may be stated; it may never be converted into a move verdict or a quality claim"** — and
  §3.7 and §2 below are amended because **the residual sweep cannot enforce that boundary**.
- **Depends on:** nothing unlanded. `rfc/archive/content-sourcing-foundation.md` ships the evidence
  ledger and `sourcing-check`; `rfc/archive/opening-evidence-path.md` ships the engine records;
  `rfc/archive/fixture-realism.md`'s D64 completion (`8b1b44d`, archived at `8bf2de8`) supplies the
  live tablebase records this RFC binds against.
- **Parent / amends:** amends `rfc/archive/content-sourcing-foundation.md` at `evidenceSupports`
  and the evidence-ledger shape. Amends nothing in the pack format.
- **Supersedes / superseded by:** —
- **Planning:** `planning/claim-backing/` (once implementing)

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

The binding is therefore not "a record is stapled to a sentence". It is: *every **cardinal**, move
token and result word in the sentence is either checked against an instrument or explicitly marked as
the author's own, and the learner is shown which.*

> **[cross-review] That sentence said "every numeral" and it could not.** The frozen table in §3.4
> is *"an English cardinal 0–999"*, and the corpus's numerals are not all cardinals: **24 of the 75
> machine-labelled claims at HEAD carry an ordinal**, and in this corpus ordinals are chess
> geometry, not decoration — *"every rook slide along the **sixth** rank"* (`tempo-is-the-lesson`),
> *"rook to the **fourth**"* (`bridge-not-squeeze`), *"the **third** rank"*, *"queen-versus-**seventh**-pawn"*.
> An ordinal is invisible to a cardinal sweep, so it is neither checked nor declared and the promise
> was false as written. §3.4 now extends the frozen table to ordinals and states what that costs.
> **D129.** The claim is narrowed here rather than in a banner, because the narrowed claim is the
> one the mechanism can keep.

**Pack schema 0.26 is released back to free.** The remedy is validator, ledger and one pack lint: no
`$defs` entry is added, no committed pack byte changes, no content digest moves, no migration, no
run-schema stamp. That is a finding, not a convenience — the debt was never a format problem.
**`[cross-review]` All six of those claims were re-verified at `67f6ee0` and all six hold; the "and
one pack lint" is the cross-review's addition (`CLAIM_ID_DUPLICATE`, §3.2), and a lint code is not a
register row. §5.1 carries the verification table.**

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

**The recommendation is (C) + (A) + (D):** an author-declared span mapping, re-derived from committed
records; a residual sweep that refuses any undeclared machine-shaped span; and a content digest so
the link is keyed to the sentence rather than to its position in an array.

**What the recommended mechanism still admits, stated plainly.** It cannot check a clause's logical
form. An author who writes *"it is not the case that thirteen moves draw"* and declares
*"thirteen"* against a census that returns 13 passes the validator. The mechanism guarantees that
**every machine-shaped fragment of the sentence is a real instrument reading, correctly attributed**;
it does not guarantee that the sentence composed from those fragments is true. That is the ceiling of
any mechanical binding over free prose, it is where rung 5's *"provenance is the only safeguard"*
actually sits, and §3.6 answers it the only honest way available — by printing the instrument's own
sentence beside the author's, so a learner can see the two disagree.

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

#### 3.8 Refusal codes, and the debt ceiling

New `SourcingIssue` codes, all raised through `issue(...)` at default **error** severity:
`CLAIM_POINTER_INVALID`, `CLAIM_POINTER_REBOUND`, `CLAIM_TEXT_DRIFTED`, `CLAIM_BINDING_DUPLICATE`,
`CLAIM_SPAN_ABSENT`, `CLAIM_SPAN_AMBIGUOUS`, `CLAIM_SPAN_CONTRADICTED`,
`CLAIM_ASSERTION_UNRECORDED`, `CLAIM_ASSERTION_UNDECLARED`, `CLAIM_CENSUS_INCOMPLETE`,
`CLAIM_AUTHORED_SPAN_UNLABELLED`, **`[cross-review]` `CLAIM_FEN_OFF_PACK`** (§3.3). One new pack-lint
code raised by `validatePackDocument` rather than by `sourcing-check`: **`CLAIM_ID_DUPLICATE`**
(§3.2). Two new `SourcingError`s: `ATTACH_SPAN_REQUIRED` and **`ATTACH_SOURCE_LINE_MISSING`** (§3.5).

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

### 5. Register claims

#### 5.1 Pack schema **0.26 is released back to free**

> **This RFC claims NO pack-schema version, NO run-schema version, NO migration, and NO new
> `EvidenceKind` beyond `explorer_position_census`, which is a code-level ledger constant and not a
> registered schema version.**

- **Pack schema: nothing.** `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts`, `"0.22"`)
  and `schemas/drill_pack.schema.json`'s `$id` (`urn:chess-tabiya:schema:drill-pack:0.22`) are
  untouched; no `$defs` entry is added, widened or narrowed; **0.19 stays frozen shut**. No committed
  pack byte changes, so **no content digest moves**. `rfc/README.md`'s provisional **0.26** row is to
  be **released** and 0.26 returned to the free pool — the next free lane becomes **0.26**, not 0.27.
  One interaction the register writer must resolve rather than inherit: `engine-leverage` is recorded
  as renumbering to **0.27** if `vocabulary-wiring` lands first, and with 0.26 freed the honest
  successor number for it is **0.26**. This RFC states its release and takes no position on who
  takes the freed lane. *(`rfc/README.md` is single-writer and this RFC does not edit it; this is the
  request.)*
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
- **`rfc/format-surface.md` (draft, **returned for one narrow round** 2026-08-15; pack 0.25).** No
  overlap: it touches `$defs/trajectoryLeg`, `$defs/legOpponentPolicy` and `$defs/shapeReference`.
  This RFC touches no `$defs` at all.
- **`rfc/feedback-delivery.md` (behind this one).** §6.

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
   `CLAIM_AUTHORED_SPAN_UNLABELLED`, `CLAIM_POINTER_REBOUND`, `CLAIM_TEXT_DRIFTED`.
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
8. **The refusal-debt ceiling shrinks or holds; it never grows.** All eleven `CLAIM_*` codes and
   `ATTACH_SPAN_REQUIRED` are discovered by `refusal-coverage.test.ts` **and covered by tests**;
   `fixtures/refusal-debt-ceiling.fixture.json` is not edited.
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
10. **The ledger and the log are updated in the archiving commit.** **D97** flips to ✅ with the
    measured split named and the owner ruling quoted; **D98** flips to ✅ with §3.2's structural
    closure; **D110**, **D111** and **D112** are opened by the drafting commit and carry their
    measurements. **`[cross-review]` D110's row title is corrected to say which predicate it counts
    (7 full-set census claims, not 13 — §1.3a); **D126** flips to 🔨 owned here and is named in §3.7;
    and **D128**–**D136** are opened by the cross-review commit with the measurements that found
    them.** `rfc/README.md`'s pack-schema register releases **0.26** (single-writer edit, not made
    here). A dated entry lands in `planning/exploration/log.md`.
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

14. **`[cross-review]` The new structural refusals fire.** `CLAIM_ID_DUPLICATE` on a pack with two
    claims sharing an `id` (**0 committed packs affected today** `[V]`, so this is a constructed
    fixture); `CLAIM_FEN_OFF_PACK` on a binding whose `tablebase.category@v1` names a FEN with a
    record in this ledger that is **not** reachable from the pack's `start.fen` — built from
    `philidor-third-rank-hold`, whose ledger holds 23 `tablebase_result` records, so the fixture is
    the real corpus state; and a test that §3.9's backing test resolves **by pointer**, by
    constructing the duplicate-id rebinding of §3.2's cross-review note and asserting the second
    claim is **not** admitted.

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
5. **Do the two retired template branches come back?** §3.2(5) makes `explorerTemplate`'s and
   `engineTemplate`'s prose comparison unreachable. The byte-exact generated sentence remains the
   strongest possible binding and costs nothing to keep as *values* validation, which is what this
   RFC does. If a future surface wants generated prose in a pack, it re-enters through
   `claimBindings` with a whole-text span, which is strictly better because the author must still
   accept the sentence into their file. Recorded so the retirement is not read as a loss.

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
