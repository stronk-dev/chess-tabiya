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
  `additionalProperties: true`* (**D112 🐞**).
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

The binding is therefore not "a record is stapled to a sentence". It is: *every numeral, move token
and result word in the sentence is either checked against an instrument or explicitly marked as the
author's own, and the learner is shown which.*

**Pack schema 0.26 is released back to free.** The remedy is validator-and-ledger only: no `$defs`
entry is added, no committed pack byte changes, no content digest moves, no migration, no run-schema
stamp. That is a finding, not a convenience — the debt was never a format problem.

**Measured outcome, and the honest half** `[V]`. Of the 61 claims carrying a machine-checkable label:
**20 become backable with the records already committed** (an authoring pass, zero instrument runs);
**36 become payable** — the instrument exists and is wired, but the query was never recorded, in a
few cases never run; and **5 must still fail**, because no instrument in this repository measures
what they assert. Delivered-claim share (against `rfc/feedback-delivery.md`'s delivery path):
**70/131 (49.0%) day zero → 90/131 (64.5%) after a binding pass → 126/131 (95.4%) after the
instrument waves → never 131.** If it admitted 131 it would be a licence, not a binding.

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

#### 1.3 What the ledger does *not* contain — measured, and it is the honest half

Three findings, each new, each ledgered (D110/D111 below), each shaping §4's outcome.

**(a) No position anywhere in the corpus has a complete legal-move tablebase census.** For each of
the 12 packs the legal successors of the root and of every authored spine node were enumerated with
`chessops` and matched against the pack's `tablebase_result` FENs. **0 of 241 positions is fully
censused.** Root coverage ranges from **1 of 28** (`mate-two-bishops`) to **5 of 11**
(`pawn-breakthrough-convert`); `philidor-passive-rook-convert` covers **4 of 21**. `[V]`

That matters because the prose asserts the enumeration in so many words —
`philidor-passive-rook-convert`'s `one-move-wins`: *"All twenty-one legal moves were enumerated and
queried: thirteen draw … and seven lose"*; `mate-bishop-knight`'s `stalemate-is-the-default`: *"every
legal move was enumerated and queried: nine win, nine draw, and eight of those nine draws are
stalemate."* The records for those enumerations are not in the ledger. Either the queries ran and
were never recorded, or the counts came from somewhere else. **This is the dossier's worked example
generalised** — *the author ran the query, typed the number, and the ledger never learned about it* —
and it is exactly what a binding mechanism makes visible instead of assumable. **D110.**

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
`engine_eval` record in all 68 ledgers: `0`, `66` and `76`/`77` are present; **`109`, `1`, `−106`,
`−120`, `−170` appear nowhere.** Its sibling `scandinavian-mainline-black` *does* hold the `75` that
`anti-scandinavian-white`'s `nothing-to-refute` cites — so the same authored assertion is backed in
one pack and unrecorded in its sibling, because the run happened once. `[V]`

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

And the fence gets stricter, not looser:

5. **`record.supports` may no longer contain a `/feedbackClaims/…` pointer at all.** The
   `explorerTemplate`/`engineTemplate` exemption in the `PROSE_POINTERS` test is removed for that
   pattern; claim support flows through `claimBindings` or not at all. Measured cost: **0 records
   affected** — no committed record points at a claim, and no templated record exists anywhere
   `[V]`. Consequently the two template functions keep their **values** validation (they are how an
   `explorer_frequency` or a templated `engine_eval` record proves its own shape) and **lose their
   `supports`-must-be-a-claim-pointer clause and their byte-exact prose comparison**, both of which
   are now unreachable.

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
(`apps/server/src/sourcing/tablebase-category.ts`) so `cursed_win`/`blessed_loss` are not silently
read as `win`/`draw` by the prose check.

#### 3.4 The span check, and the residual sweep that closes (C)'s hole

For each `spans[]` entry:

1. `span` must occur in `text` **exactly once** — zero occurrences is `CLAIM_SPAN_ABSENT`, two or
   more is `CLAIM_SPAN_AMBIGUOUS`. An author disambiguates by quoting more words.
2. For an instrument span, the assertion is evaluated and the result **normalised**, then compared
   for equality with the normalised span. `CLAIM_SPAN_CONTRADICTED` otherwise.

Normalisation is a closed, frozen table with no natural-language inference in it:

- **Integers.** The span, trimmed, must be either digits (with optional `,` group separators) or an
  English cardinal 0–999 from a frozen table (`nine` → 9, `twenty-one` → 21, `thirteen` → 13). This
  is required by the corpus, not a nicety: the endgame packs write their quantities in words.
- **Centipawn displays.** `displayCp` (`check.ts`) is reused verbatim, so `+1.09` ↔ `109`. The span
  may carry or omit the leading `+`.
- **Percentages.** One decimal place, matching `pct()` in `explorer.ts`; `30.0%` ↔ `30.0`.
- **SAN.** Exact string equality after trimming. The SAN is derived from the record's own FEN and
  move with `makeSan`, never parsed out of the prose.
- **Categories.** Case-insensitive equality with the category word, plus a frozen two-entry
  inflection table (`draw`↔`drawn`, `loss`↔`lost`). That table is English morphology, not chess
  semantics, and it is listed in full here so it cannot grow without an RFC.

> **The residual sweep — the rule that makes the mapping complete rather than selective.** After
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
> `tablebase_exact` claims, **18 carry a self-declared label as well** and 19 do not.

Numerals with no chess content still need handling, and the answer is *declare them*: rating bands,
date windows and piece counts are all `authored` spans on a claim that carries a self-declared
label, or genuine assertions (`tablebase.pieceCount@v1` backs *"five pieces"*). The sweep is
deliberately noisy; noise here costs an author a line of JSON, and silence here costs a learner a
false provenance statement.

#### 3.5 The overwrite is deleted

`attachExplorerEvidence` **no longer assigns to `pack.feedbackClaims[claimIndex].text`**. The
assignment line is removed, not gated behind a flag. In its place the tool requires the author to
supply the span it is backing:

```
make candidate-attach FILE=… TARGET=/feedbackClaims/3/text SAN=Bf5 SPAN="61.4%" FIELD=sharePct
```

and writes a `claimBindings` entry rather than a `supports` pointer. With no `SPAN`, the tool
refuses (`ATTACH_SPAN_REQUIRED`) instead of overwriting. The pack file becomes an **input** to the
attach path rather than an output of it; `atomicCanonical` writes `evidence.json` and `sources.json`
only. An author who genuinely wants a generated sentence writes it into the pack themselves and
binds it like any other — a visible authoring edit, not a side effect of recording evidence.

`digestDrillPack(pack)` is still recomputed into the ledger's `packDigest`, and now it is stable
across an attach, which is the correct behaviour and was not achievable before.

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

#### 3.8 Refusal codes, and the debt ceiling

New `SourcingIssue` codes, all raised through `issue(...)` at default **error** severity:
`CLAIM_POINTER_INVALID`, `CLAIM_POINTER_REBOUND`, `CLAIM_TEXT_DRIFTED`, `CLAIM_BINDING_DUPLICATE`,
`CLAIM_SPAN_ABSENT`, `CLAIM_SPAN_AMBIGUOUS`, `CLAIM_SPAN_CONTRADICTED`,
`CLAIM_ASSERTION_UNRECORDED`, `CLAIM_ASSERTION_UNDECLARED`, `CLAIM_CENSUS_INCOMPLETE`,
`CLAIM_AUTHORED_SPAN_UNLABELLED`. One new `SourcingError`: `ATTACH_SPAN_REQUIRED`.

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
statement.

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
| **Criterion 2** (70 admitted / 61 withheld) | **re-measured per wave.** The day-zero figure is unchanged at 70/61; §4's table replaces the single number with the sequence 70 → 90 → 126 |
| **Criterion 3** (*"`ledger_bound` has no fixture in the committed corpus — this criterion must construct one"*) | still true at day zero, false after the binding pass; the constructed fixture becomes a real one |
| **Criterion 14** (a reorder test must fail `sourcing-check` or demote to `self_declared`) | **superseded by a stronger form.** D98 is closed structurally (§3.2); the test asserts `CLAIM_POINTER_REBOUND` at error, and additionally that a claim pointer in `record.supports` is refused outright |
| **Criterion 17** (D97 and D98 exist and are **not** flipped by that RFC) | still correct from its side; both are flipped by **this** RFC's archiving commit instead |
| **Open question 5** (*who owns D97, and is the binding wave a content wave?*) | **answered.** This RFC owns it; the wave is content **plus** the two instrument runs of §4's Bucket 2 |
| **Open question 4** (*what anchors a claim, eventually?*) | not claimed, but cheapened: a validating binding names FENs, all machine-checked against the pack's own spine, so a ledger-derived anchor becomes available without an authoring wave or a schema field. See Open question 3 |
| C1, C2, C3, C4, C5, C8, C9, CR1–CR5, and the disclosure model | **untouched.** This RFC changes when a claim is *admitted*, never when it is *revealed* |

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
   after; a test written **before** the change records that inversion.
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
4. **The residual sweep is not decorative.** A binding that declares one of a sentence's three
   numerals is refused with `CLAIM_ASSERTION_UNDECLARED`, naming the surviving token. Tested with
   both a digit residue and a spelled-out residue (`"nine"`), since the corpus writes both.
5. **The validator never queries.** A grep test asserts `claim-binding.ts` imports no fetch, no
   `ExplorerClient`, no `liveTablebaseQuery`, and no engine client; and a run of `sourcing-check`
   with the network unavailable produces identical output.
6. **The overwrite is gone.** A grep test asserts `explorer.ts` contains no assignment to
   `feedbackClaims`; `attachExplorerEvidence` without a span refuses with `ATTACH_SPAN_REQUIRED`;
   with a span it writes a `claimBindings` entry, leaves `pack.json` byte-identical, and leaves the
   ledger's `packDigest` unchanged.
7. **Every committed ledger still validates unchanged.** `sourcing-check` over all 68 ledgers under
   `content/` produces the same issue set as at `d2f34f9`, code for code. `claimBindings` is
   optional and nothing regresses on its absence.
8. **The refusal-debt ceiling shrinks or holds; it never grows.** All eleven `CLAIM_*` codes and
   `ATTACH_SPAN_REQUIRED` are discovered by `refusal-coverage.test.ts` **and covered by tests**;
   `fixtures/refusal-debt-ceiling.fixture.json` is not edited.
9. **The measured outcome is reproduced by the shipped code, not by this document.** The Bucket
   1/2/3 split (**20 / 36 / 5**) and the delivery sequence (**70 → 90 → 126 of 131**) are recomputed
   in `planning/claim-backing/` from the shipped validator after the binding pass. **If the shipped
   figure disagrees with §4, §4 is wrong and is corrected there rather than the code being bent to
   it.** Bucket 3 must remain non-empty; a run that admits 131 of 131 fails this criterion.
10. **The ledger and the log are updated in the archiving commit.** **D97** flips to ✅ with the
    measured split named and the owner ruling quoted; **D98** flips to ✅ with §3.2's structural
    closure; **D110**, **D111** and **D112** are opened by the drafting commit and carry their
    measurements. `rfc/README.md`'s pack-schema register releases **0.26** (single-writer edit, not
    made here). A dated entry lands in `planning/exploration/log.md`.
11. **The five must still fail.** A test asserts that each Bucket 3 claim, given a best-effort
    binding, is refused — and that the refusal names *which* token is undeclared. This is the law-8
    criterion and it is the one that must not be softened to make a wave green.
12. **`licenceObligations` follows the binding.** Its CC-BY-SA attribution requirement currently
    triggers on records supporting `PROSE_POINTERS`; it must also trigger on records reached through
    a `claimBindings` assertion, or a CC-BY-SA-sourced record could back prose with no notice. No
    present effect (Lichess and Syzygy are both no-rights-asserted), which is why it needs a test
    rather than an observation.

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
