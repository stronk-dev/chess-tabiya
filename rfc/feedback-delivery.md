# RFC: Feedback delivery — give the claim layer a learner, and stop the strip printing the census

- **Status:** draft
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-15
- **Design refs:** `design/05-in-run-experience.md` §3 (the assistance ladder; **rung 5 at `:76`** —
  *"Authored claims … with no review workflow (owner ruling 2026-08-13) provenance is the only
  safeguard"*), §3a-i (the shipped disclosure model, and specifically ***"`outcome.reached`
  discloses under every policy (a finished run has nothing left to contaminate)"***);
  `design/03-product-breadth.md` B4 (`:284`, the evidence-and-explanation gate, residual)
- **Exploration gate:** `design/research/feedback-versus-the-dashboard.md` (Q8, 2026-08-15). Its §9
  names four changes; this RFC is items **1** (deliver the claims) and **3** (rank or filter the
  compare strip), which it calls *"the single change most likely to flip axis 5"* and *"the one item
  that is genuinely a design fork"*. Its verdict sentence is the whole brief: **the remedy is
  delivery, not authoring.**
- **Ledger rows this RFC owns**, cited by title because line numbers drift: *0 of 131 authored
  feedback claims can reach a learner* (**D77 🐞**, `design/BACKLOG.md:129`); *The compare strip
  fails the usefulness axis worse than the leaf R3 condemned* (**D78 🐞**, `:130`). Both were
  written 2026-08-15 and are open at the time of this draft.
- **Depends on:** nothing unlanded. `rfc/archive/authored-feedback-delivery.md` and
  `rfc/archive/authored-explanation-surface.md` (both implemented) ship the projection this RFC
  extends; `rfc/archive/open-answer-grading.md` ships the one existing claim consumer;
  `rfc/archive/content-sourcing-foundation.md` ships the evidence ledger and `sourcing-check`.
- **Related, NOT absorbed:** **D88** (*The engine has already answered, at the exact pointer of the
  field that would consume it* — 235 machine-validated records anchored to `/deviations/{i}/moveUci`
  against 0 of 275 deviations declaring a `cost`, `design/BACKLOG.md:119`) is owned by the parallel
  draft **`rfc/engine-leverage.md`**. This RFC reads the same ledger and must not be read as
  claiming that row. See §5.3.
- **Parent / amends:** amends `rfc/archive/authored-feedback-delivery.md` (the three delivered
  authored shapes become four) and `rfc/archive/n-way-comparison.md` (the comparison structure
  strip gains an admission filter). Amends neither at the disclosure model, which is untouched.
- **Supersedes / superseded by:** —
- **Planning:** `planning/feedback-delivery/` (once implementing)

*Every code site below was read in the working tree at **`8445562`** on 2026-08-15, after the
uncommitted edits to `apps/server/src/authored-feedback.ts`, `apps/server/src/sourcing/check.ts`
and `packages/schema/src/drill-pack/*` landed — so these line numbers do **not** match any earlier
commit. The tree moved roughly thirteen times today and at least one sibling draft
(`rfc/live-surface-honesty.md`) appeared in `rfc/` while this was being written. **Locate by symbol
name first — every line number in this document is advisory.***

## Summary

Q8 measured the product's feedback surface against the named anti-pattern and returned a split
verdict: we beat "Stockfish labels + prose" on honesty, timing and re-entry, and we **forfeit on
the claim layer**, because **0 of 131 authored `feedbackClaims` are deliverable** — 32,560
characters, 22.1% of a 202,479-character authored corpus, with **no delivery path of any kind**.
What *is* delivered is worse than that sounds: the comparison structure strip fires on **99.8%** of
transitions at **8.31 entries per ply**, and **99.3%** of 14,463 quiet alternatives fire too, 90.4%
of them with the *same kind* — a lift of **≈1.01×**, below the **1.05×** that got
`slider_lines_changed` refused by R3 and by `rfc/live-marker-quality.md` §3 L2.

This RFC does two jobs, and they are different jobs with different rules.

**Job 1 — deliver what exists.** `projectAuthoredFeedback` gains a fourth authored shape, `claim`,
revealed **only at an `outcome.reached` occurrence**, because a claim carries no anchor and
`design/05` §3a-i already rules that a finished run has nothing left to contaminate. No claim
appears before commitment; consequence-before-verdict is preserved by construction, not by
discipline. **No pack-schema change and no migration**: the claims already exist in the packs, the
occurrence already exists in the run log, and the projection already reads both.

**Job 2 — stop delivering noise.** The strip's structural half answers the wrong question. It
computes each branch's difference *from its own previous ply*, which every move satisfies; the
learner opened a comparison to ask what differs *between the branches*. The fix is a set operation,
not a threshold: **an observation present on every column's path is not a difference between the
columns, and is not admitted to any column's strip.** No number is invented — R3's ρ = −0.143
forbids ranking by rarity, and the dossier's own zero-denominator problem forbids treating a
structurally-empty population as evidence.

**And the 66 unbacked evidence labels are answered rather than deferred (§3).** The fix is
**delivery**, and the verification is in this document: the labels were never checked *on a
surface* because there is no surface. This RFC makes the binding **load-bearing at delivery time** —
a claim whose machine-checkable label has no matching ledger record is **withheld from the
learner**, not merely warned about in a file. Measured over the committed corpus, that ships
**70 of 131 claims today with zero authoring minutes**, and converts the remaining **61** from a
lint warning into a visible, countable content debt with an already-shipped attach path.

## Motivation

### What is actually broken

Three findings from `design/research/feedback-versus-the-dashboard.md`, each re-verified against
code in §1 rather than taken on the dossier's word:

1. **The claim layer has no door.** `projectAuthoredFeedback` delivers exactly three shapes and
   `feedbackClaims` is not among them; `docs/explanation-grounds.md:146-147` states this
   deliberately (*"Concept identifiers, **unanchored feedback claims**, note-less deviations, and
   FEN-anchored deviations remain absent"*). The one runtime consumer is a `stated_reasoning` key
   point ground, and **0 of 145 corpus checkpoints use `stated_reasoning`** (D79). The door is
   shipped, correct, and unopened.
2. **What we do deliver discriminates at ≈1.01×.** The strip is not a proposal — it is the
   difference layer of the surface `design/00-thesis.md` calls the product's one original claim.
3. **66 of 66 machine-checkable evidence labels are unbacked**, on 32 ledger-bearing packs, and
   every pack is `draft` so `EVIDENCE_TYPE_UNBACKED` warns rather than errors.

The uncomfortable reading of (1) and (2) together is the dossier's own: *"the part of our idea that
answers Q8 is authored and undelivered, while the part that is delivered is a census R3 already
told us not to trust unranked."* Both halves are wiring. Neither needs research to start.

### Why the working precedent is deviation notes

**235 deliverable deviation notes**, each bound to a named non-spine `moveUci` at a named spine
node, are revealed when their anchor node is in scope *whether or not the learner played that move*
(`apps/server/src/authored-feedback.ts:150-165`; `docs/explanation-grounds.md:147-149`). The
dossier calls this *"the exact object R3 says a census cannot produce"* — it names the alternative.

That is the shape to copy, and the honest thing to say up front is that **claims cannot copy it
today**, because a deviation note has an anchor and a claim does not. §2.1 establishes that as a
measured fact about the corpus rather than an assumption, and §2.2 derives the delivery rule from
the absence rather than legislating an anchor nobody authored.

### Scope

**In scope:** the delivery path for `feedbackClaims`; the admission rule for structural entries in
`comparisonStrips`; the delivery-time consequence of an unbacked evidence label.

**Explicitly out of scope**, each with its reason:

- **`deviation.cost`** (`rfc/archive/deviation-classes.md`, pack 0.21) — landed author-declared and
  UNBACKED per the 2026-08-15 coordinator ruling. Not re-specified, not re-litigated.
- **`opening-evidence-path`'s engine records** (pack 0.20) — landed. This RFC *reads* the ledger
  those records live in; it changes nothing about how they are produced or validated.
- **D88** — owned by `rfc/engine-leverage.md`, drafting in parallel. §5.3 states the interface.
- **The rung-0 structural reading itself.** R3 exempts learner-initiated surfaces
  (*"a true answer to a question the learner asked is not noise; the learner chose the cost"*), and
  `CompareView.svelte:118-120` keeps the full per-column reading behind a closed `<details>` as the
  deliberate show-me-everything escape hatch. It is untouched. Ranking *it* is the genuine design
  fork the dossier §9.3 names, and this RFC does not take it.
- **New authored content.** Not one word is authored here. Every number in §2 is delivery of prose
  that already exists in `content/drafts/`.
- **The pivotal-marker half of the timing strip** (`compare-strips.ts:38`) — pinned as an
  *unmodified* site by `rfc/live-marker-quality.md` §4.2 criterion 3. See §5.2.

## Specification

### 1. What ships today, read from the code

#### 1.1 The claim layer — three verified facts

**(a) The projection has three shapes and there is no fourth.** `projectAuthoredFeedback`
(`apps/server/src/authored-feedback.ts:251`) builds its deliverable set from `nodeSources` (`:129`)
— which walks `spine[].annotations[]` (`:138`) and `pack.deviations` (`:150`) and nothing else —
plus `planClassSourceIds` (`:239`). `AuthoredFeedbackItem` (`:29-68`) is a four-arm union
(`annotation`, `deviation`, `plan_class`, `theory_verdict`); the fourth arm is a *derived* theory
verdict, not authored prose. `feedbackClaims` is read nowhere in the file.

**(b) The one consumer is a door with no key.** `keyPointViews`
(`apps/server/src/reasoning.ts:49`) resolves a `{kind:"claim", claimId}` reasoning ground at
`:64-65` and renders it as

> `Author-declared claim (${claim.evidenceTypes.join(", ")}): ${claim.text}`

That is the **only** place in the product where a claim's text or its evidence labels can reach a
learner, and it fires only on a `stated_reasoning` checkpoint. **The corpus has none** (D79).

**(c) The claims are structurally anchorless, and this is measured, not assumed.** Over the 37
committed packs (`content/drafts/*.json`, sidecars excluded), **131 claims across 37 packs, and the
key set is exactly `{id, text, evidenceTypes}` on all 131** `[V]`. Not one claim carries a node, a
ply, a move, a checkpoint or a FEN. The type agrees: `FeedbackClaim`
(`packages/schema/src/drill-pack/types.ts:162-166`) has three members and no location.
`design/BACKLOG.md`'s *Content transfer test* row said it first and said it exactly:
*"`feedbackClaims` have no trigger so they can never fire."*

Distribution, because §2.4 rests on it `[V]`: **min 2, median 4, max 5, mean 3.54 claims per pack.**

**(d) The anti-contamination boundary is real and stays.** `projectPackDocument`
(`apps/server/src/pack-registry.ts:65`) strips authored material from `GET /packs/:id` — its
docstring at `:60-63` says so — and `apps/server/src/drill-client-server.test.ts:158` asserts
`expect(projected).not.toHaveProperty("feedbackClaims")`. **Nothing in this RFC touches that
assertion**, and criterion 8 pins it.

#### 1.2 The evidence binding — 67 labels, 0 records, and the exact reason

`sourcing-check`'s claim gate (`apps/server/src/sourcing/check.ts:182-193`) maps three of the seven
schema evidence-type labels onto ledger record kinds (`:183`):

| Label | Required record kind | Self-declared? |
|---|---|---|
| `corpus_observed` | `explorer_frequency` | no — machine-checkable |
| `engine_validated` | `engine_eval` | no — machine-checkable |
| `tablebase_exact` | `tablebase_result` | no — machine-checkable |
| `author_principle`, `hypothesis`, `derived_feature`, `human_model_predicted` | — | yes, by design |

`human_model_predicted` is in the schema enum and **absent from the map**, which is correct and is
D87's finding restated: no Maia evidence kind exists in `EVIDENCE_KINDS`, so the label is
unbackable by construction. It is self-declared and this RFC treats it as such.

Independently recomputed over `content/drafts/` for this draft `[V]`, reproducing the dossier
exactly: **67 machine-checkable labels; 66 on the 32 packs that have an `.evidence.json`; 0 backed.**
The ledgers are not empty — they hold **764 support pointers**, distributed **465 under `/spine`,
235 under `/deviations`, 64 under `/start`** — and **not one** points at
`/feedbackClaims/<i>/text`. The refusal at `:191` is therefore firing correctly on every label it
can see, at `warning` severity because `published` is false for all 37 packs.

#### 1.3 The compare strip — what it computes, and what it discards

`comparisonStrips` (`packages/runtime/src/compare-strips.ts:22`) builds each column's structure
strip in one line (`:32`):

```ts
if (node.id !== fork.id) for (const observation of observations)
  if (!previous.has(observationKey(observation)))
    structure.push(Object.freeze({ …, sentence: `A recorded structural observation changed: ${observation.kind}.`, … }));
```

Four properties, all verified, all load-bearing:

1. **The comparison is intra-branch and inter-ply.** `previous` (`:28`, `:33`) is the *previous node
   on the same column's path*. So the question the strip answers is *"did this branch's reading
   change since last ply"*, which is why it fires on 99.8% of transitions: every move changes
   something. **It never compares one column against another** — and comparing columns is the
   entire purpose of the surface it renders on.
2. **It reports gains only.** An observation present at the predecessor and absent at the node
   produces no entry. A comparison that can report a branch *acquiring* an outpost and cannot
   report the other branch *losing* one is asymmetric on its own axis. (Out of scope here; see
   Open question 3.)
3. **It discards every parameter.** The sentence interpolates `observation.kind` and nothing else,
   while `renderStructuralObservation` (`apps/web/src/lib/structural-sentences.ts:7`) takes the
   same `StructuralObservation` and renders *"White's knight on f3 has 6 attack-reachable squares
   in the current occupancy; check and pins are not evaluated."* **The parameterised renderer is
   shipped and the strip does not use it** — the same defect species as the claim layer, one
   surface over: a built renderer with nothing routed into it. This is also exactly K6's *derived
   half is generic by construction* finding, in the one place where a parameter is available and
   thrown away.
4. **It is twice-gated, and the RFC says so rather than overstating the harm.**
   `CompareView.svelte:91` renders the strip inside a closed `<details><summary>Structure and
   timing</summary>`, and the compare view itself is opened by the learner. So
   `rfc/live-marker-quality.md`'s L1–L6 — the standing admission rule for anything that speaks
   **unasked** — **does not bind this surface**, and this RFC does not pretend it does. What binds
   it is narrower and harder to argue with: *the disclosure promises a comparison and returns a
   census*, and R3's D condition supplies the mechanical test for that.

**The measured consequence** (dossier §5d, over the same 634 transitions and 14,463 quiet
alternatives) `[V]`: 5,266 entries, **mean 8.31 per ply**, p95 16, max 24; **99.5%** of quiet
alternatives pooled also gain ≥1 observation; **99.3%** within-position; **90.4%** gain one of the
*same kind*; **lift ≈ 1.01×**. And at the 44 authored fork pairs, the two branches' full readings
overlap at **Jaccard median 65.7%**, leaving a **median of 36 differing observations** per pair.

### 2. Job 1 — the delivery path for `feedbackClaims`

#### 2.1 The design constraint, stated before the mechanism

A claim has no anchor (§1.1c). Three routes exist and two are refused:

- **Refused: invent an anchor by inference.** Matching claim text to plies — by SAN token, by
  keyword, by embedding, by any model — would manufacture an authorial assertion the author never
  made, and would then attach authored prose to a specific move on that manufactured basis. That is
  **law 8 / ADR-0005** territory: not because an LLM writes the sentence, but because the *binding*
  between a chess claim and a position would be produced by the product rather than by the author
  or by a validated instrument. **No inferred anchoring, in this RFC or a later one, without an
  authored or ledger-recorded basis.**
- **Refused for now: require an authored anchor.** Adding `at` to `$defs/feedbackClaim` is a
  pack-schema change (**0.23**) *and* a 131-claim authoring wave, and it would deliver **zero**
  claims until that wave completes. Q8's verdict is that the remedy is delivery, not authoring;
  spending a schema number and an authoring wave to deliver nothing today is the opposite trade.
  (Notable and recorded for whoever revisits it: `$defs/feedbackClaim` is
  `"additionalProperties": true`, uniquely among the shapes this RFC touched — `$defs/spineNode`
  and `$defs/deviation` are both `false` — so a future anchor field would validate *silently and
  unchecked* before it is specified. That is a hazard, not a shortcut, and this RFC does not use
  it.)
- **Taken: deliver the claim at the only occurrence its lack of an anchor is compatible with.**

#### 2.2 C1 — the reveal occurrence

> **C1.** A `feedbackClaims[]` entry is delivered only at a reveal occurrence whose attribution is
> `{kind: "outcome", eventSeq}`. It is never delivered at a `checkpoint` attribution, under any
> `feedbackPolicy`.

Grounding, in order of authority:

- `design/05-in-run-experience.md` §3a-i: ***"`outcome.reached` discloses under every policy (a
  finished run has nothing left to contaminate)"***. This is design tier, it is already the shipped
  behaviour, and it is the exact property an anchorless claim needs.
- **Consequence-before-verdict is preserved by construction, not by care.** An `outcome.reached`
  event exists only after the run's decisions are made. A claim can therefore never precede a
  commitment it comments on, which is one of the three things Q8 says no dashboard can do.
- **The mechanism already exists.** `revealEvents` (`authored-feedback.ts:169`) already emits an
  outcome-attributed `RevealEvent` for every `outcome.reached` under *both* policy branches
  (`:170-178`, folded into both returns at `:194` and `:225`). C1 adds a source, not an occurrence.
- **The negative case is the reason.** Revealing pack-wide claims at the *first* checkpoint would
  disclose commentary about decisions the learner has not yet made — precisely what
  `projectPackDocument`'s strip exists to prevent (§1.1d). There is no path on which to scope an
  anchorless claim, so the only honest scope is *the run is over*.

**Accepted cost, stated plainly:** a run abandoned before any `outcome.reached` delivers no claims.
That is correct rather than unfortunate — the alternative is disclosing pack commentary mid-run —
and it is measurable: criterion 6 requires the implementation to record what share of corpus
walkthroughs reach an outcome.

#### 2.3 C2 — the anchored path stays, and stays preferred

> **C2.** A claim referenced by a `stated_reasoning` key point ground
> (`{kind:"claim", claimId}`, `$defs/reasoningKeyPoint`) continues to be delivered at that
> checkpoint by `keyPointViews` (`apps/server/src/reasoning.ts:64-65`) under the existing
> `reasoningDeliveryOpen` gate (`:71`). **This RFC changes nothing on that path.** A claim
> delivered by C2 is still also delivered by C1 at the outcome; the terminal sheet is a distinct
> surface and re-reading a claim already seen is not a disclosure violation.

C2 is the *anchored* delivery of a claim and it is strictly better than C1: it arrives at a named
checkpoint, in a named learner's own reasoning context, with the author's key-point label attached.
C1 exists because no pack uses C2. **The direction of travel is C2**, and this RFC's ledger
consequence says so (D79 stays open; §6 criterion 11).

#### 2.4 C3 — no filter, and why that is not a double standard

> **C3.** Delivered claims are **not** filtered or ranked by any usefulness gate. All admitted
> claims for the run are returned, ordered by their index in `pack.feedbackClaims`.

This looks inconsistent with Job 2 and is not, for two reasons that are both in evidence:

- **R3's gate is undefined for authored prose.** The dossier is explicit (§5e): *"T, C and D are
  defined over census firings; authored prose has no firing."* Applying a census gate to an
  author's sentence would be a category error, and would be the product overruling a human
  judgement with arithmetic — the inverse of law 8's concern but the same failure of authority.
- **The volume is not census volume.** Median **4** claims per pack, max **5** (§1.1c), delivered
  **once per run at its end**. The strip prints **8.31 entries per ply**. These differ by three
  orders of magnitude in a 20-ply branch; treating them with one rule would be arithmetic
  theatre.

#### 2.5 C4 — the item shape

`AuthoredFeedbackItem` (`apps/server/src/authored-feedback.ts:29`) gains a fifth arm, mirrored into
`apps/web/src/lib/api.ts:180`'s copy of the union:

```ts
| {
    readonly kind: "claim";
    readonly id: string;                        // `claim#<claimId>`
    readonly revealedBy: RevealAttribution;     // always { kind: "outcome", eventSeq }
    readonly anchor: { readonly claimId: string };
    readonly text: string;
    readonly evidenceTypes: readonly string[];  // verbatim from the pack
    readonly binding: "ledger_bound" | "self_declared";
  }
```

`KIND_ORDER` (`:112`) gains `claim: 4`, after `theory_verdict`, so claim prose sorts last within an
occurrence — an author's judgement is the last thing said, beneath the derived facts, which is the
ladder's own ordering (rung 5 sits above rungs 0–4 in *what it can get wrong*).

`binding` is not decoration: it is the rendered provenance (§3.4) and it is the only field a
learner-facing surface may use to distinguish *the author says* from *the author says and a record
agrees*.

#### 2.6 C5 — where the mechanism goes, and what it costs

Three edits, none of which introduce a new data source:

1. **`nodeSources` is not the site.** Claims have no node. `projectAuthoredFeedback` gains a
   separate claim pass inside its reveal loop (`:277-359`), guarded on
   `reveal.attribution.kind === "outcome"`, adding `claim#<id>` entries to the same `revealed` map
   and therefore inheriting deduplication, freezing, ordering and `revealedBy` attribution
   unchanged.
2. **`deliverable` (`:268`) gains the admitted claim ids** (§3.2), so
   `hasWithheldAuthoredContent` (`:369`) keeps its meaning.
3. **`revealIsReleased` (`:94`) is not modified.** The `stated_reasoning`-must-be-answered-first
   gate applies to the reveal occurrence, not to the item kind, so claims inherit it for free.

**Cost: no new I/O, no new event, no new table, no new endpoint.** `GET /runs/:id/authored-feedback`
(`apps/server/src/rest.ts:1010`) returns a longer `items` array of the same shape.

### 3. The 66 unbacked evidence labels — the answer, and it is delivery

The task on this RFC was to say whether the fix is authoring, format, or delivery, and to verify
rather than assume. **It is delivery, and the verification changes what "fix" means.**

#### 3.1 Ruling out the other two, with evidence

**Not format.** The requirement is correct and must stay. `design/05:76` is the reason and it is
design tier: rung 5 is *"an author's judgement … with no review workflow (owner ruling 2026-08-13)
**provenance is the only safeguard**"*. Deleting the machine-checkable labels, or downgrading them
to self-declared, would remove the only safeguard the ladder grants the rung. And the labels are
the *"claims carry evidence refs + uncertainty"* artefact `planning/exploration/plan.md:209` names
as the alternative to the dashboard; the 121 self-declared labels are the uncertainty half working
as designed.

**Not authoring — or rather, not authoring *first*.** Binding all 66 labels today, via the shipped
`make candidate-attach … --target /feedbackClaims/<i>/text` path
(`apps/server/src/sourcing/explorer.ts:239-262`), would change **nothing a learner sees**, because
0 of 131 claims are delivered. The binding wave is real work with real value and it is **item 2** of
the dossier's four; it is not the fix for the labels, because the labels' failure is not that they
are unbacked in a file — it is that nothing has ever asked them a question at the moment they
matter.

**Delivery, and here is the verification Q8 only implied.** The `EVIDENCE_TYPE_UNBACKED` check
(`check.ts:182-193`) runs in `sourcing-check`, a CLI over pack files. Its severity escalates to
`error` on `provenance.reviewStatus === "published"` (`:184`, `:191`) and no pack is published, so
it warns. Meanwhile the *only* code path that can put a label in front of a learner is
`reasoning.ts:65`, which interpolates `claim.evidenceTypes.join(", ")` **without consulting the
ledger at all** — and which no pack reaches. So: **the labels are checked in a file that never
ships them and unchecked on the one surface that would.** Q8's implication is confirmed, and the
sharp version of it is that binding was never load-bearing because nothing ever loaded it.

#### 3.2 C6 — delivery-gated binding

> **C6.** A claim is **admitted to delivery** only if, for every label in its `evidenceTypes` that
> appears in the machine-checkable map (`check.ts:183`), the pack's evidence ledger contains a
> record of the mapped kind whose `supports` includes `/feedbackClaims/<i>/text` for that claim's
> array index. A claim with no machine-checkable label is admitted with
> `binding: "self_declared"`; an admitted claim with at least one machine-checkable label carries
> `binding: "ledger_bound"`. **A claim that is not admitted is withheld, is never returned by any
> surface, and is NOT counted in `hasWithheldAuthoredContent`** — it is not deliverable by any
> occurrence, and a flag that promises content which can never arrive is a lie about the run.

**Why this is the right shape and not merely a strict one.** Once C1 ships, an unbacked
`corpus_observed` label is no longer a note in a file: it is a **false provenance statement shown to
a learner** about a corpus query that no record supports. The worked example in the dossier §6 is
the exact hazard — a claim reading *"the position after 3.Bc4 was reached 44,467,486 times … White
scores 50.1% against 45.9%"*, labelled `corpus_observed`, whose sidecar's real records support
`/start/fen` and not the claim text. *"The author ran the query, typed the number, and the ledger
never learned about it."* Delivering that sentence with its label attached is the dashboard's prose
half — a confident, specific, unverifiable number — which is the failure mode
`teardown-taketaketake-desk.md` documents in public. **C6 is what makes `sourcing-check` a refusal
rather than a lint.**

**Measured effect, today, with zero authoring** `[V]` (recomputed over `content/drafts/` for this
draft):

| | count |
|---|---|
| claims total | **131** |
| admitted today — no machine-checkable label, or backed | **70** (`self_declared`; 0 `ledger_bound`) |
| withheld today — unbacked machine-checkable label | **61** |
| claims deliverable before this RFC | **0** |

So the RFC's own headline is honest about its half-measure: **0 → 70 on the day it lands, and 61
claims stay dark until the binding wave.** Those 61 are now a *countable* debt with a shipped tool
and a visible payoff, which is a strictly better state than 131 dark claims and a warning nobody
reads.

#### 3.3 C7 — where binding is computed

> **C7.** `PackRecord` (`apps/server/src/pack-registry.ts:40`) gains
> `readonly boundClaimIds: ReadonlySet<string>`, computed at registration in the same block that
> computes `assessmentGrounding` (`:253`) from the already-loaded `entry.ledger`, using the map at
> `check.ts:183` as the single source of truth for label→kind. Packs registered without a ledger —
> studio drafts and the two fallback constructions at `pack-registry.ts:374` and `:397`, which
> already default `assessmentGrounding: "unverified"` — get an **empty set**, so an unbacked label
> **fails closed**.

The precedent is exact and three lines away: `assessmentGrounding` is already a ledger-derived
boolean-ish summary attached to the pack record at load, so this adds a second derived field beside
the first, reads no new file, and does no I/O during a run.

#### 3.4 C8 — what a learner actually reads

> **C8.** A delivered claim renders as the author's sentence plus one provenance line, and the
> provenance line states the labels and the binding without grading either:
>
> - `binding: "ledger_bound"` → *"Author's claim. Evidence recorded for: `<labels>`."*
> - `binding: "self_declared"` → *"Author's claim, author-declared: `<labels>`. No machine record is
>   attached."*
>
> No sentence may say the claim is true, correct, strong, verified-as-good, or better than an
> alternative. The vocabulary floor is `BANNED_JUDGEMENTS` (`packages/runtime/src/voice.ts:21`);
> the ceiling is law 8 / ADR-0005.

The second form is the important one, because 70 of 70 admitted claims today take it. It is the
same move `corpus-sentences.ts` already makes with the abstention floor and `endgame.ts:47` makes
with *"No technique entry is available yet"*: **absence is rendered as absence.** That is the axis
Q8 says we win on, and C8 keeps winning it while shipping more prose.

Surfaces: `TerminalSheet.svelte` (`:47-51`, the `{#each authoredItems}` arm chain) gains a `claim`
branch — this is the surface that actually shows claims, since C1 makes them outcome-only.
`CheckpointSheet.svelte` (`:131-140`) gains the same branch for union exhaustiveness.
`guidance.ts:23`'s `authoredText` gains `if (item.kind === "claim") return item.text;` so the
evidence packet and `/voice` are not quieter than the sheet — the claim then travels the existing
`voiceCheck` fence (`voice.ts:21-40`), which is rung 6 wording rung 5, permitted, and machine-fenced
already.

### 4. Job 2 — the change rule for the comparison structure strip

#### 4.1 The rule

> **CR1 — admission by between-column difference.** In a comparison of **N ≥ 2** columns, let
> `pathObservations(X)` be the set of structural observation identities occurring at any node on
> column `X`'s path past the fork, and let `common = ⋂_X pathObservations(X)`. **A structure strip
> entry is admitted only if its observation identity is not in `common`.**
>
> **CR2 — no rank, and the ordering stays arithmetic.** Admitted entries keep the existing sort:
> ply offset, then node id. **No entry is scored, ranked by rarity, or ordered by significance.**
>
> **CR3 — degenerate cases are named, not discovered.** With `N < 2`, `common` is undefined and the
> filter does not apply; the strip is emitted as today. Where `common` equals a column's entire
> path set (identical branches), that column's strip is legitimately empty and renders the existing
> empty state rather than a fallback.

#### 4.2 The measured basis, and what is deliberately *not* invented

**Why filtering at all — R3's D condition, applied to the only real population this surface has.**
D asks whether a firing is *"not equally true of the moves not played"*. R3 evaluated it against a
synthetic population of enumerated quiet alternatives, and warned (§8.4) that the population
*"over-weights bad moves and under-weights the human-plausible ones."* A comparison view does not
need the proxy: **its other columns are recorded alternatives that a learner actually played.** CR1
runs D against them. An observation true on every column's path is, by D, not about any column.

**Why the threshold is a set intersection and not a number.** Two measured results forbid the
obvious alternatives, and this RFC obeys both rather than routing around them:

- **Selectivity is not quality.** Spearman **ρ = −0.143** between firing rate and false-positive
  rate (R3 §6; restated as normative in `rfc/live-marker-quality.md` §3 L2). So "keep the rare
  observations" is refused — it is the reasoning R3 invalidated, and `live-marker-quality` already
  wrote the standing prohibition. CR2 exists to make the refusal explicit.
- **A structurally-zero denominator makes lift undefined, not infinite.**
  `rfc/live-marker-quality.md` §3 L2(i) is the general clause and it binds here: any "the filtered
  strip achieves ∞× lift because nothing else fires" argument is inadmissible. CR1 makes no lift
  claim at all; it makes an identity claim (§6 criterion 5).

**What CR1 predicts, from numbers already measured** `[V]`: at the 44 authored fork pairs the two
columns' readings overlap at Jaccard median **65.7%**, with a **median 36 differing observations**.
CR1 removes exactly that shared core. The prediction is therefore *median 36 admitted observations
per pair, replacing 2 × ~58 printed sentences* — and it is a **prediction stated so it can fail**:
criterion 5 requires the implementation to measure it and record the actual figure, whatever it is.
**36 is still a lot.** This RFC does not claim CR1 makes the strip good; it claims CR1 makes it
*about the comparison*, which it currently is not, and it claims that on arithmetic rather than on
taste.

**And CR1 disposes of the unconditional census for free.** Thirteen of the median 58 observations
per position are emitted unconditionally by construction — twelve per-colour/per-role piece counts
and one king-to-king distance (`packages/runtime/src/structure.ts:454`, `:494`;
`docs/structural-reading.md:49-53` states this as intended). Under CR1 a `piece_count` survives only
where the columns' material actually differs, which is exactly when it is worth a sentence. No
special case was written for it.

#### 4.3 CR4 — the strip stops throwing the parameters away

> **CR4.** `StripEntry` (`compare-strips.ts:8`) gains
> `readonly observation?: StructuralObservation`, carrying the admitted observation.
> `CompareView.svelte:91` renders `renderStructuralObservation(entry.observation)`
> (`apps/web/src/lib/structural-sentences.ts:7`) when present, falling back to `entry.sentence`
> when absent. **The runtime's `sentence` field is unchanged**, so `comparisonNarrative` (`:56`),
> the evidence packet and `/voice` are byte-identical for the entries that survive CR1.

This is a two-line client change that turns *"A recorded structural observation changed:
`piece_reach_count`."* into *"White's knight on f3 has 6 attack-reachable squares in the current
occupancy; check and pins are not evaluated."* — a sentence that carries its own scope, names its
convention, and grades nothing. It is a direct hit on **K6** (*explanations remain generic despite
curated packs*): the derived half is generic *by construction* only where the parameters were never
persisted, and here they are in hand and discarded.

Whether the runtime sentence should be parameterised too — which would require moving
`renderStructuralObservation` from `apps/web` into `packages/runtime` and would upgrade the
narrative, packet and voice paths as well — is **Open question 2**, not decided here.

### 5. What this RFC does not claim, and the sibling interfaces

#### 5.1 Register claims: NONE, and this is stated loudly

> **This RFC claims NO pack-schema version and NO migration number.**

- **Pack schema: nothing.** `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts`) and
  `schemas/drill_pack.schema.json`'s `$id` (`urn:chess-tabiya:schema:drill-pack:0.22`) are
  **untouched**. Not one `$defs` entry is added, removed, widened or narrowed. **0.23 is left
  free**; **0.19 remains frozen shut** and is not reopened. No committed pack byte changes, so **no
  content digest moves** (`packages/schema/src/drill-pack/digest.ts` digests content, not the
  `$id`).
- **Migration: nothing.** No table, no column, no `STORAGE_VERSION` bump, no run-schema stamp.
  Migration **20** (run schema **0.15**) stands as the head and `rfc/teacher-surface.md`'s claim on
  **21** is unaffected. No new event type: claim delivery is a *projection* over the existing
  `outcome.reached` event, and projections are never persisted — the same reasoning
  `archive/shape-library.md` used to keep run schema at 0.8 for firings.
- **Run schema: nothing.** `feedbackDisclosed`/`feedbackDeliveryOpen`
  (`packages/runtime/src/feedback.ts:3`, `:22`) and the five policies are **not modified**. This
  RFC adds a source to an existing occurrence; it does not add, move or reinterpret an occurrence.

**This is the better outcome and it is the point.** Q8's finding was that the words are already
written and the numbers are already recorded; a delivery RFC that needed a schema version would be
evidence that the diagnosis was wrong.

#### 5.2 `rfc/live-marker-quality.md` — one shared file, zero overlap

`live-marker-quality` §4.2 pins `compare-strips.ts:38` as one of exactly three `pivotalMarkers`
call sites that it **does not modify**, and its criterion 3 tests that `castled` and `pawn_break`
survive there. **Line `:38` is the *timing* strip. This RFC modifies only the *structure* strip
(`:32`) and the `StripEntry` shape (`:8`).** No pivotal marker is filtered, demoted, added or
re-rendered here; `liveAdmitted`/`liveMarkers` are neither called nor referenced by CR1–CR4.
Criterion 9 pins the non-interference in both directions.

The conceptual borrowing is deliberate and bounded: this RFC uses L2's **method results** (ρ,
zero-denominator) as prohibitions, and does **not** claim that L1–L6 govern the compare strip —
§1.3(4) establishes it is a twice-gated learner-initiated surface and therefore outside L-rule
scope.

#### 5.3 `rfc/engine-leverage.md` — the ledger is shared, the row is not

D88 observes 235 machine-validated records anchored to `/deviations/{i}/moveUci` against 0 of 275
deviations declaring a `cost`. This RFC's §1.2 recomputed that same ledger population from the other
end — **235 `/deviations` support pointers**, reproducing the count exactly — because it needed the
`/feedbackClaims` figure from the same scan. **The `cost` binding and the deviation-anchored engine
records are `engine-leverage`'s, entirely.** The only interface is `boundClaimIds` (C7): if
`engine-leverage` also wants a ledger-derived field on `PackRecord`, the two land in whatever order
the register sets, in the same `pack-registry.ts:253` block, with no shared key. Neither blocks the
other.

#### 5.4 `rfc/client-surface-floor.md` — no geometry, no CSS

CR4's `CompareView.svelte` edit is a single render expression inside the existing `<details>` at
`:91`. It adds **no `@media` rule**, changes no selector, and moves no element — so
`client-surface-floor`'s hold on `CompareView.svelte` (its §8 note that a compare-geometry draft
will touch the same file) is unaffected, and its criterion that `CompareView.svelte` contains zero
`@media` rules still passes. Criterion 10 pins it.

## Deviations from design

1. **`docs/explanation-grounds.md:146-147`** states that *"unanchored feedback claims … remain
   absent"*. This RFC changes that fact. It is a **doc** statement of shipped behaviour, not a
   design ruling — `docs/` is the canonical description of what exists — and the doc is updated in
   the implementing commit. The design-tier statement it rests on (§3a-i's outcome-discloses-under-
   every-policy) is *used*, not contradicted.
2. **`docs/structural-reading.md:63`** states that *"Comparison presents each branch independently
   in canonical order and never ranks or compares the readings."* CR1 **compares** them. Two
   qualifications: CR2 preserves "never ranks" literally, and CR1 is a set intersection over
   observation identities — arithmetic over the position, no significance judgement — so `design/05`
   §3's rung-0 property (*"it makes no chess judgement"*) is preserved. The sentence is amended in
   the implementing commit, for the **strip only**; the per-column reading at
   `CompareView.svelte:118-120` continues to present each branch independently and is untouched.
3. **`design/03-product-breadth.md:284` B4's residual** shrinks but does not close: this RFC ships
   the authored-claim delivery half. Full evidence-bound LLM rendering and Syzygy runtime rendering
   remain residual. **This RFC does not edit `design/`;** the ledger consequence is §6 criterion 12.

Otherwise: none. The disclosure model, the anti-contamination boundary, the assistance ladder's
rungs, and the five feedback policies are all used as-is.

## Acceptance criteria

1. **The projection delivers claims.** A run reaching `outcome.reached` on a pack with admitted
   claims returns `kind: "claim"` items from `GET /runs/:id/authored-feedback`, each with
   `revealedBy.kind === "outcome"`. A test asserts that **no** claim item is ever returned with a
   `checkpoint` attribution, under **all five** `feedbackPolicy` values.
2. **The corpus figure is reproduced by the shipped code, not by a script.** Walking the 37
   committed packs to a terminal outcome delivers **70** claims and withholds **61**; the numbers
   are recorded in `planning/feedback-delivery/`. If the shipped implementation disagrees with
   §3.2's count, the RFC's number is wrong and is corrected there rather than in the code.
3. **C6 fails closed.** A pack with a `corpus_observed` claim and no `.evidence.json` withholds it;
   adding a matching `explorer_frequency` record supporting `/feedbackClaims/<i>/text` admits it
   with `binding: "ledger_bound"`. Both directions tested.
4. **`hasWithheldAuthoredContent` is unchanged in meaning.** A run on a pack whose *only*
   undelivered material is C6-withheld claims reports `false`. Regression test written **before**
   the change.
5. **CR1 is an identity, and it is measured.** A test asserts that for every admitted structure
   entry, the observation identity is absent from at least one sibling column's path set; and the
   Q8 harness's §5d measurement is re-run against the filtered projection, with the new
   entries-per-ply, firing rate and per-fork-pair admitted count recorded in
   `planning/feedback-delivery/` **whatever they are**. No threshold is asserted as a pass
   condition.
6. **The outcome-reach share is recorded.** The share of corpus walkthroughs that reach an
   `outcome.reached` is measured and recorded, because C1's accepted cost is proportional to it.
7. **CR3's degenerate cases are tested**: `N < 2` emits the unfiltered strip; identical branches
   emit an empty strip and the existing empty state.
8. **The anti-contamination boundary holds.** `drill-client-server.test.ts:158`
   (`expect(projected).not.toHaveProperty("feedbackClaims")`) passes unmodified, and a new test
   asserts `GET /packs/:id` still exposes no claim text after C1 ships.
9. **`live-marker-quality` non-interference.** `compare-strips.ts:38`'s pivotal-marker entries are
   byte-identical before and after; `castled` and `pawn_break` still render in the timing strip.
   Tested from both sides.
10. **`client-surface-floor` non-interference.** `CompareView.svelte` still contains zero `@media`
    rules after CR4.
11. **The ledger and the log are updated in the archiving commit** (`AGENTS.md` RFC completion
    protocol): **D77** flips to ✅ with the 70/61 split named; **D78** flips to ✅ with the measured
    post-CR1 figures; **D79** stays **open** and is annotated that C2 remains unused by content;
    the *Four declared vocabularies have zero content usage* row is annotated with the same. A dated
    entry lands in `planning/exploration/log.md`.
12. **The B4 residual is restated** in `planning/exploration/gates.md` — the *authored feedback
    claims have no delivery path (0/131)* item is replaced by the measured post-landing state
    (70 delivered, 61 withheld pending binding), rather than deleted.
13. **No register row is added anywhere.** `rfc/README.md`'s pack-schema and migration registers are
    unchanged by this RFC, and the Active row it eventually gets says **claims nothing versioned**.

## Open questions

1. **Should C6 withhold, or deliver with a stated absence?** C8 renders absence honestly everywhere
   else in the product (the corpus abstention floor, *"No technique entry is available yet"*), so a
   third option exists: deliver the 61 unbacked claims with *"the author declares this as a corpus
   observation; no record is attached"*. This draft chooses **withhold**, because an unbacked
   `corpus_observed` claim carries a specific number the learner cannot check and the label is the
   only thing distinguishing it from a guess — and rung 5's only safeguard is provenance. But this
   is an owner-shaped call about honesty-vs-availability, and it is cheap to reverse in either
   direction. **Owner decision requested.**
2. **Should `renderStructuralObservation` move into `packages/runtime`?** CR4 upgrades only the
   client render. Moving it upgrades `comparisonNarrative`, the evidence packet and `/voice` too,
   at the cost of a cross-package move touching `structural-sentences.test.ts`,
   `evidence-sentences.ts` and their tests. Deferred; not blocking.
3. **Should the strip report *lost* observations?** §1.3(2) records that it reports gains only, so a
   branch that *loses* an outpost produces no entry while the branch that gains one does. Under
   CR1 a loss entry could only ever be a real between-column difference, so the honesty argument is
   strong — but it is a new class of entry with unmeasured volume, and R3's lesson is that new
   emissions get measured before they ship. `structuralDelta` (`structure.ts:501`) already computes
   `lost` and is unused by the strip. Deferred to a follow-up with a measurement.
4. **What anchors a claim, eventually?** C1 is the honest consequence of anchorlessness, not a
   destination. Three candidates, none taken here: an authored `at` on `$defs/feedbackClaim` (pack
   **0.23** plus a 131-claim wave); a ledger-derived anchor, where a claim's `explorer_frequency` or
   `engine_eval` record already carries an `anchor.fen` that could be matched to a spine position —
   **author-supplied and machine-checked, therefore not an inference**, and it would arrive free
   with the binding wave; or C2's `stated_reasoning` reference becoming the normal authoring habit.
   The second is the most interesting and depends on the binding wave existing. Deferred, ledgered.
5. **Does the binding wave belong in this RFC's planning directory or its own?** §3.2's 61 withheld
   claims become visible debt the moment C1 ships. The dossier files it as item 2, a content wave,
   not an RFC. Recorded here so it is not lost between the two.

## Changelog

- 2026-08-15: created.
