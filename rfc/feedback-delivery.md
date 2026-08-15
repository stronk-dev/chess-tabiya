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

*Every code site below was first read in the working tree at **`8445562`** on 2026-08-15, and
**re-verified against a clean tree at `a9c31a6`** during the 2026-08-15 adversarial cross-review —
the then-uncommitted edits to `apps/server/src/authored-feedback.ts`,
`apps/server/src/sourcing/check.ts` and `packages/schema/src/drill-pack/*` have since landed. The
tree moved roughly seventeen times that day and three sibling drafts (`rfc/live-surface-honesty.md`,
`rfc/engine-leverage.md`, `rfc/vocabulary-wiring.md`) appeared in `rfc/` while this was being
written. **Locate by symbol name first — every line number in this document is advisory.***

> **Cross-review status, 2026-08-15.** This draft was adversarially cross-reviewed by an agent that
> did not write it. Every measured figure in §1 and §3.2 reproduced exactly. **Three findings were
> load-bearing enough to change the specification**, and are marked **[CR-FIX]** where they land:
> C1's safety argument was **false** (§2.2 — `outcome.reached` closes a *node*, not a run; the
> rewind button sits on the sheet that prints the claims); C8's evidence-packet clause **broke C1
> and widened the `voiceCheck` fence** (§3.4); and the "already-shipped attach path" for the 61
> withheld claims **does not exist for 38 of them and destroys the prose for the other 23** (§3.1).
> The revised C1 in §2.2 is a **reviewer-imposed replacement for the draft's central mechanism** and
> is flagged for the author's and the owner's confirmation, not merely for implementation.

## Summary

Q8 measured the product's feedback surface against the named anti-pattern and returned a split
verdict: we beat "Stockfish labels + prose" on honesty, timing and re-entry, and we **forfeit on
the claim layer**, because **0 of 131 authored `feedbackClaims` are deliverable** — 32,560
characters, **16.1%** of a 202,479-character authored corpus, with **no delivery path of any kind**.
*(**[CR-FIX]** an earlier draft of this sentence read "22.1%". That is the dossier's total
undeliverable share — 44,678 chars = claims 32,560 + FEN-anchored deviation notes 8,848 +
unreferenced plan classes 500 + concept identifiers 2,770, `feedback-versus-the-dashboard.md` §4d
— not the claims' share. Claims are the largest single item in it, at 73% of the undeliverable
prose; they are not all of it, and this RFC only addresses that item.)*
What *is* delivered is worse than that sounds: the comparison structure strip fires on **99.8%** of
transitions at **8.31 entries per ply**, and **99.3%** of 14,463 quiet alternatives fire too, 90.4%
of them with the *same kind* — a lift of **≈1.01×**, below the **1.05×** that got
`slider_lines_changed` refused by R3 and by `rfc/live-marker-quality.md` §3 L2.

This RFC does two jobs, and they are different jobs with different rules.

**Job 1 — deliver what exists.** `projectAuthoredFeedback` gains a fourth *authored* shape (a fifth
union arm — the existing fourth arm, `theory_verdict`, is derived), `claim`,
revealed **only at an `outcome.reached` occurrence that satisfies a run-exhaustion predicate**
(C1, §2.2). **[CR-FIX]** The draft's original rule — *"revealed only at an `outcome.reached`
occurrence, because `design/05` §3a-i rules that a finished run has nothing left to contaminate"* —
**was unsafe and is withdrawn**. `outcome.reached` closes a **node**, not a run
(`docs/branch-runtime.md:137`, `:115-116`), rewind carries no outcome guard, and
`TerminalSheet.svelte:77` — the surface that would print the claims — is where the *"Rewind and
branch"* button lives. A learner who stalemates a mating drill at ply 10 would be handed the
pack-wide claim *"the tablebase gives exactly one winning move, Ra8+"* and a rewind button, in two
clicks. Consequence-before-verdict is therefore **not** preserved by construction; C1 now earns it
with an explicit predicate. **No pack-schema change and no migration**: the claims already exist in
the packs, the occurrence already exists in the run log, and the projection already reads both.

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
**70 of 131 claims today with zero authoring minutes** (15,963 of the 32,560 claim characters —
**49%** of the claim prose), and converts the remaining **61** from a lint warning into a visible,
countable content debt.

**[CR-FIX] — and the debt is not payable with today's tools, which changes Open question 1.** The
draft asserted the 61 have "an already-shipped attach path". Cross-review found they do not:
`/feedbackClaims/\d+/text` is a **`PROSE_POINTER`** (`check.ts:30-36`), so only a registered
*explorer* or *engine* template may support it (`:176`). Of the 61 withheld claims — **37 carry
`tablebase_exact`**, and `tablebase_result` can never be either template
(`explorerTemplate`/`engineTemplate` return `false` on the kind, `check.ts:106`, `:132`), so
`sourcing-check` would refuse the very record C6 demands, at `EVIDENCE_OVERREACH`; **7 carry
`engine_validated`**, whose only permitted template is the move-shaped `engine-move-loss/v1` and
which has no emitter targeting this pointer; **23 carry `corpus_observed`**, the one class with a
shipped path — and that path **overwrites the author's sentence**
(`explorer.ts:262`: `pack.feedbackClaims[claimIndex].text = renderExplorerFrequency(values)`).
So **0 of 61 have a working prose-preserving attach path today**, and 37 have none that the
validator would accept at all. Under C6-as-drafted those 37 are not deferred, they are
**permanently dark**. §3.2 and Open question 1 are rewritten accordingly.

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

Independently recomputed over `content/drafts/` for this draft, and **re-derived a second time in
cross-review from an independent script** `[V]`, reproducing the dossier exactly: **67
machine-checkable labels; 66 on the 32 packs that have an `.evidence.json`; 0 backed.** The ledgers
are not empty — they hold **764 support pointers**, distributed **465 under `/spine`, 235 under
`/deviations`, 64 under `/start`** — and **not one** points at `/feedbackClaims/<i>/text`. The
refusal at `:191` is therefore firing correctly on every label it can see, at `warning` severity
because `published` is false for all 37 packs.

**The 67 labels split three ways, and the split decides §3.2** `[V]`: **23 `corpus_observed`,
7 `engine_validated`, 37 `tablebase_exact`**. Full `evidenceTypes` census over the 131 claims:
`author_principle` 80, `tablebase_exact` 37, `hypothesis` 24, `corpus_observed` 23,
`derived_feature` 17, `engine_validated` 7, `human_model_predicted` **0** — so the self-declared
half is **121** as stated, and `human_model_predicted` is unbackable *and* unused, which makes it
moot in practice as well as by construction.

**[CR-FIX] — what the ledger is permitted to hold at this pointer, which the draft did not check.**
`/feedbackClaims/\d+/text` is one of five **`PROSE_POINTERS`** (`check.ts:30-36`), and the
overreach gate at `:176` refuses any record supporting a prose pointer **unless** it is a
registered explorer template (`kind === "explorer_frequency"` plus eight exact `values` keys,
`:105-111`) or the registered engine template (`kind === "engine_eval"` **and**
`templateId === "engine-move-loss/v1"`, `:131-136`). `EVIDENCE_OVERREACH` carries the default
`error` severity — unlike `EVIDENCE_TYPE_UNBACKED`, which passes `published ? "error" : "warning"`
explicitly. Consequences, all load-bearing for C6:

- **`tablebase_result` can never legally support a claim.** Neither template function accepts the
  kind. So the **37 `tablebase_exact`** labels are not "unbacked pending a wave" — they are
  **unbackable under the shipped validator**, which would refuse the record at `error` before
  `EVIDENCE_TYPE_UNBACKED` ever fired.
- **`engine_eval` is legal but move-shaped.** `engine-move-loss/v1` requires
  `moveSan`/`bestSan`/`atFen`/`candidates`/`lossCp` — it describes a move's cost, not a claim's
  content — and **no shipped emitter writes it to a `/feedbackClaims` pointer**.
- **`explorer_frequency` is legal, capped at one claim per record** (`:122`, *"explorer frequency
  may support exactly one feedbackClaims text"*), and has the only shipped emitter — which
  **replaces the claim text** (§3.1).

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
  pack-schema change (**the next free number — `0.23` is `engine-leverage`'s and `0.24` is
  `vocabulary-wiring`'s, so `0.25`; see §5.1** **[CR-FIX]**) *and* a 131-claim authoring wave, and
  it would deliver **zero** claims until that wave completes. Q8's verdict is that the remedy is
  delivery, not authoring; spending a schema number and an authoring wave to deliver nothing today
  is the opposite trade. **This refusal is now much closer than it was** — see §2.2b's accepted
  cost and Open question 4.
  (Notable and recorded for whoever revisits it, and **independently re-verified in cross-review**
  `[V]`: `$defs/feedbackClaim` is `"additionalProperties": true`, uniquely among the shapes this
  RFC touched — `$defs/spineNode`, `$defs/deviation` and `$defs/reasoningKeyPoint` are all `false`;
  only `$defs/provenance` shares the openness — so a future anchor field would validate *silently
  and unchecked* before it is specified. **This is why §1.1(c)'s key-set measurement, not the
  schema, is what C1 rests on:** an open object cannot prove absence, so absence was counted. That
  is a hazard, not a shortcut, and this RFC does not use it.)
- **Taken: deliver the claim at the only occurrence its lack of an anchor is compatible with.**

#### 2.2 C1 — the reveal occurrence **[CR-FIX: rewritten; the draft's rule was unsafe]**

##### 2.2a Why the draft's rule failed — and it failed on its own stated invariant

The draft rule was *"delivered only at a reveal occurrence whose attribution is
`{kind: "outcome", eventSeq}`"*, justified by the claim that **"an `outcome.reached` event exists
only after the run's decisions are made"** and therefore that consequence-before-verdict holds *by
construction*. **That premise is false in the shipped runtime, and the docs already say so.**

- **`outcome.reached` closes a node, not a run.** `docs/branch-runtime.md:137`: *"the persisted
  `outcome.reached` event, not move availability, closes **the node**."* `:115-116`: *"Rewinding and
  replaying a terminal move creates a new node and therefore **a new outcome event for that
  node**."* There is no run-terminal predicate anywhere in the codebase.
- **The runtime enforces this per node, deliberately.** `commitMove`
  (`packages/runtime/src/runtime.ts:280-285`) refuses only when the **cursor node itself** carries
  an outcome (`event.data.nodeId === cursorNode.id`); the event validator's uniqueness check is
  per node, not per run (`packages/runtime/src/events.ts:314`); and `rewind` (`runtime.ts:385`)
  carries **no outcome guard at all**.
- **`attempt_end` is written on the assumption that play continues past an outcome.**
  `feedbackDeliveryOpen` (`packages/runtime/src/feedback.ts:22-30`) re-closes on the next
  `move.committed`, and `docs/branch-runtime.md:213-214` states it: *"Under `attempt_end`, an
  outcome opens delivery, **rewind leaves it open, and the next committed move closes it**."*
- **The exploit is on the sheet itself, not down some obscure path.**
  `TerminalSheet.svelte:43-61` renders the `authoredItems` C1 would deliver, and `:77` is
  `<button … onclick={onRewind}>Rewind and branch</button>`. Two clicks.
- **And the corpus claims name the answers.** Measured `[V]`: **77 of 131 claims contain a move or
  square token**. `content/drafts/philidor-passive-rook-convert.json`'s `one-move-wins` reads *"In
  this exact position the tablebase gives exactly one winning move, **Ra8+**"*;
  `content/drafts/mate-bishop-knight.json`'s `stalemate-is-the-default` enumerates the final
  decision node. An early stalemate in a mating drill — the drill's **normal failure mode**, and
  already a test fixture shape (`authored-feedback.test.ts:304-341` is a 4-ply Fool's mate) — would
  hand the learner the answer to a decision they have not reached, with a rewind button beside it.

**The four shipped arms do not have this problem, and the difference is exactly anchorlessness.**
Annotations and deviations are revealed only for `pathSpineNodeIds` (`authored-feedback.ts:281-297`);
plan classes only for checkpoints on `pathRunNodeIds` (`:299-304`); theory verdicts only via line
membership on the reveal path. **A premature outcome can therefore only ever disclose commentary
about moves already played.** A claim has no path, so it breaks the invariant every other arm
preserves. §2.1's refusal to invent an anchor was right; the conclusion drawn from it — that "the
run is over" is an available scope — was not, because *the run is over* is not a state this product
has.

Additional paths verified during cross-review: **group seeding** reaches the same state without the
learner rewinding at all (`Service.createGroup`, `apps/server/src/service.ts:862-889`, commits N
seed moves inside one run and parks the cursor on member 0's leaf, so a mating seed opens the
terminal sheet while every sibling is unplayed); **story re-entry** resumes play in the same run
(`App.svelte:316-322` = `rewind` then `fork`; `story.ts:113` sets a terminal moment's `entryNodeId`
to the node's *parent* specifically so play resumes before the terminal move). Verified **safe**:
comparison (no authored-feedback reference in `CompareView.svelte`; `/voice` with `scope:"compare"`
blanks `authored` at `rest.ts:1127`), and export/derivation (`duplicate`/`flip` create a fresh run
with a fresh event log, `service.ts:1509`, `:572`).

##### 2.2b C1, revised

> **C1.** A `feedbackClaims[]` entry is delivered only at a reveal occurrence whose attribution is
> `{kind: "outcome", eventSeq}` **and** only when the run satisfies the **exhaustion predicate**:
>
> **(i) Authored coverage.** Every spine node in `reachableAuthoredSpineIds(pack.document)` has
> been *reached* by some node of the run — not merely *reachable*. This is the operational reading
> of `design/05` §3a-i's *"a finished run has nothing left to contaminate"*: nothing is left when
> no authored decision point remains undrilled.
>
> **(ii) Quiescence.** No `move.committed` and no `run.rewound` event follows the outcome event
> being attributed. Claims are withdrawn from every surface the moment the learner resumes play,
> and are re-delivered only when (i) and (ii) hold again.
>
> It is never delivered at a `checkpoint` attribution, under any `feedbackPolicy`.

**(i) is the load-bearing half and (ii) is hygiene.** (ii) alone cannot restore the invariant —
a projection can be withdrawn but a learner's memory cannot, so a rule that only hides claims after
the fact protects nothing. (i) is what makes the disclosure sound: if every authored decision point
has already been played, there is no authored decision the claim can precede. (ii) then keeps the
*surface* honest and keeps the evidence packet clean (§3.4), and costs nothing.

**The mechanism is one set comparison away from code that already exists.**
`projectAuthoredFeedback` (`:259-266`) already walks `historyFrom(run, event.data.nodeId)` at every
`outcome.reached` and maps run nodes to spine ids via `spinePositionIndex`. (i) needs the same walk
over *all* run nodes rather than outcome paths only, compared against
`reachableAuthoredSpineIds`. No new I/O, no new event, no new index.

**Accepted cost, and it is now large rather than small.** A run abandoned before any
`outcome.reached` delivers no claims; a run that reaches an outcome without covering the authored
spine also delivers none. **This RFC does not know what share of corpus walkthroughs satisfy (i),
and the number could be near zero** — in which case Job 1 ships a correct mechanism with almost no
traffic, and the honest response is to take Open question 4's ledger-derived anchor rather than to
weaken (i). Criterion 6 is rewritten to measure exactly this and to make the answer blocking rather
than informational.

- **The mechanism already exists for the occurrence itself.** `revealEvents`
  (`authored-feedback.ts:169`) already emits an outcome-attributed `RevealEvent` for every
  `outcome.reached` under *both* policy branches (`:170-178`, folded into both returns at `:194`
  and `:225`). C1 adds a source and a gate, not an occurrence.
- **The negative case is unchanged and still the reason.** Revealing pack-wide claims at the
  *first* checkpoint would disclose commentary about decisions the learner has not yet made —
  precisely what `projectPackDocument`'s strip exists to prevent (§1.1d).

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
   `hasWithheldAuthoredContent` (`:369`) keeps its meaning. **[CR-FIX]** Note the practical
   consequence C1's exhaustion predicate creates: an admitted claim is in `deliverable` from the
   first request but is not `revealed` until §2.2b (i) and (ii) both hold, so
   `hasWithheldAuthoredContent` reads `true` for the whole of any run that never satisfies the
   predicate. The flag's *literal* meaning ("deliverable material exists that you have not been
   shown") is preserved and correct; its *discriminating value* drops, because every pack carries
   at least 2 claims (§1.1c). Criterion 4 is extended to record how often the flag is true at run
   end before and after, so the degradation is measured rather than assumed harmless.
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

**Not authoring — or rather, not authoring *first*.** Binding the labels today would change
**nothing a learner sees**, because 0 of 131 claims are delivered. The binding wave is real work
with real value and it is **item 2** of the dossier's four; it is not the fix for the labels,
because the labels' failure is not that they are unbacked in a file — it is that nothing has ever
asked them a question at the moment they matter.

> **[CR-FIX] — but the draft described the binding wave as cheap and shipped, and it is neither.**
> The draft cited *"the shipped `make candidate-attach … --target /feedbackClaims/<i>/text` path
> (`apps/server/src/sourcing/explorer.ts:239-262`)"* as though it attaches a record to an author's
> sentence. **It does not attach; it substitutes.** `explorer.ts:262` reads
> `pack.feedbackClaims[claimIndex].text = renderExplorerFrequency(values);` — the tool *overwrites
> the author's prose* with a template-rendered explorer sentence and then records the evidence for
> the sentence **it** wrote. That is a coherent design (it is why the record is machine-validatable
> at all: the text is generated from the same `values` the record carries) but it is the opposite
> of what "binding the 61" implies. Running it over the 23 `corpus_observed` claims would delete
> authored prose and replace it with generated prose, which is an **authoring decision for the
> owner**, not a wiring chore — and it is a decision Q8's *"the remedy is delivery, not authoring"*
> verdict does not cover, because the corpus loses words either way.
>
> Combined with §1.2's overreach finding: **of the 61 withheld claims, 0 have a prose-preserving
> attach path, 23 have a prose-destroying one, and 38 have none at all.** This is recorded here
> rather than solved here — closing it needs either a new template kind for
> `tablebase_result`/claim-shaped `engine_eval` at a prose pointer, or a widening of the overreach
> rule, and both are `content-sourcing`'s territory, not this RFC's. **New ledger row required
> before this RFC is accepted** (AGENTS.md law 4); it is named in Open question 5.

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

| | count | claim chars |
|---|---|---|
| claims total | **131** | 32,560 |
| admitted today — no machine-checkable label, or backed | **70** (`self_declared`; **0** `ledger_bound`) | **15,963** |
| withheld today — unbacked machine-checkable label | **61** | 16,597 |
| claims deliverable before this RFC | **0** | 0 |

Both counts and both character totals were **re-derived independently in cross-review** and match
`[V]`. Note the honest reading of the char column: 70 of 131 claims is **49% of the claim prose**,
not 53% — the withheld claims are slightly longer on average, because the machine-checkable ones
are the ones carrying numbers.

**[CR-FIX] — the 61 do not divide into "dark until the wave". They divide into three very
different populations, and only one of them has any path at all:**

| withheld population | count | can a legal record exist? | shipped emitter? |
|---|---|---|---|
| `tablebase_exact` | **37** | **no** — `tablebase_result` is neither template, so `EVIDENCE_OVERREACH` refuses it at a prose pointer (§1.2) | — |
| `engine_validated` | **7** | yes, but only as move-shaped `engine-move-loss/v1` | **none** for this pointer |
| `corpus_observed` | **23** | yes | yes — and it **overwrites the claim text** (§3.1) |

So the draft's *"61 claims stay dark until the binding wave"* is wrong in the direction that
matters: **37 of them stay dark permanently under C6 as written**, because the repo's own validator
forbids the record C6 requires. C6 does not convert those into countable debt; it converts them
into a silent deletion with a rule attached. That is the substance of Open question 1, and it is
why the cross-review's recommendation there is **not** the draft's choice.

**Also unaddressed by the draft: the binding pointer is an array index.**
`/feedbackClaims/<i>/text` keys on ordinal position (`check.ts:190`, `explorer.ts:240`). Inserting
or reordering a claim silently rebinds every later pointer to a different sentence — a
`ledger_bound` badge on prose the record never described. Today this is harmless (0 records exist)
and it is a pre-existing property of `sourcing-check`, not something C6 introduces. But C6 is what
makes it *learner-visible*, so it must not ship unpinned: criterion 14 requires a test that
reordering a pack's `feedbackClaims` either fails `sourcing-check` or demotes the affected claims
to `self_declared`. **Ledger row required** (Open question 5).

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

> **C9 [CR-FIX] — a claim is excluded from the evidence packet, `/voice` and `/speech`.**
> `authoredText` (`apps/server/src/guidance.ts:23-28`) returns `undefined` for
> `item.kind === "claim"`, exactly as it already does for `theory_verdict`. A claim reaches a
> learner **only** through `TerminalSheet.svelte`'s rendered `claim` branch. Criterion 15 pins it.

**The draft said the opposite, and it was wrong twice.** The draft added
`if (item.kind === "claim") return item.text;` to `authoredText` *"so the evidence packet and
`/voice` are not quieter than the sheet — the claim then travels the existing `voiceCheck` fence
(`voice.ts:21-40`), which is rung 6 wording rung 5, permitted, and machine-fenced already."* Both
halves of that sentence fail:

1. **It breaks C1.** `evidencePacket` (`guidance.ts:40-45`) consumes `input.authored.items`
   **unfiltered** — no occurrence filter, no node filter — and folds every `authoredText` into
   `packet.sentences`. It is handed the whole-run page at `rest.ts:1132` and `:1147`, for whatever
   `nodeId` the request names. So a claim revealed at any outcome would ride into every subsequent
   `POST /runs/:id/voice` and `/speech` at every later ply, under scopes `marker`, `reading`,
   `steering` and `story`. C1 says *outcome-only*; the packet has no notion of an occurrence. C1's
   quiescence clause (§2.2b (ii)) narrows this but does not close it, which is why exclusion is the
   rule rather than filtering. (`scope: "compare"` already blanks `authored` at `rest.ts:1127` —
   the one place the existing code got this right.)
2. **`voiceCheck` fences the renderer *against the packet*, so widening the packet widens the
   renderer's licence — the fence runs the other way.** `voiceCheck(packet, output)`
   (`voice.ts:32-40`) permits a word in LLM output *iff* it appears in `packet.sentences`. Measured
   over the 131 claims `[V]`: **44 contain a `BANNED_JUDGEMENTS` word** — `winning` ×17, `wins` ×9,
   `must` ×6, `better` ×3, `loses` ×3, `best` ×2, `worse` ×2, `advantage` ×2, plus `mistake`,
   `punish`, `good`, `bad`, `worst`, `should` — **75 contain a `PRESCRIPTIVE_VERBS` word**, and
   **77 contain move or square tokens**. Routing claim text into the packet would hand the renderer
   permission to say *"winning"*, *"mistake"* and *"punish"*, and to name moves, at positions the
   author never wrote about. That is **law 8 / ADR-0005** — an LLM producing a binding between a
   chess judgement and a position that neither the author nor an instrument made — arriving through
   the exact door §2.1 refused to open by inference.

**Quieter is correct here.** The claim is rung-5 authored prose with no anchor; the packet is the
rung-6 renderer's evidence base. Anchorless prose has no business in an anchored packet, and the
sheet is where an author's judgement belongs.

### 4. Job 2 — the change rule for the comparison structure strip

#### 4.1 The rule

> **CR1 — admission by between-column difference.** In a comparison of **N ≥ 2** columns, let
> `pathObservations(X)` be the set of structural observation identities occurring at any node on
> column `X`'s path **strictly past the fork** — the fork node itself is excluded, because it is
> shared by every column by construction and including it would put its entire reading into
> `common` for free **[CR-FIX: the draft said "past the fork" without settling this, and the two
> readings give different results for an observation present at the fork, lost, and regained]**.
> Let `common = ⋂_X pathObservations(X)`. **A structure strip entry is admitted only if its
> observation identity is not in `common`.** Equivalently: an entry is admitted iff its identity is
> absent from at least one *other* column's path.
>
> **CR2 — no rank, and the ordering stays arithmetic.** Admitted entries keep the existing sort:
> ply offset, then node id. **No entry is scored, ranked by rarity, or ordered by significance.**
>
> **CR3 — degenerate cases are named, not discovered.** With `N < 2`, `common` is undefined and the
> filter does not apply; the strip is emitted as today. Where `common` equals a column's entire
> path set (identical branches), that column's strip is legitimately empty and renders the existing
> empty state rather than a fallback.
>
> **CR5 [CR-FIX] — CR1's selectivity is monotone-decreasing in N, and this is stated rather than
> discovered on the surface where it matters most.** `common` is an intersection, so it shrinks as
> columns are added: **every column added can only admit more entries, never fewer.** The
> comparison cap is **`MAX_COMPARISON_BRANCHES = 8`** (`packages/runtime/src/compare.ts:15`;
> `branch-scale.ts:5` aliases it as the collapse floor), and `archive/branch-set-scale.md` shipped
> the large-branch-set surface that reaches it. At N = 8, an observation must be absent from **all
> seven** siblings' paths to be filtered, so CR1 approaches a no-op exactly where the strip's
> volume is worst. **CR1's measured basis (§4.2) is N = 2 and its extrapolation to N ≥ 2 is
> unwarranted.** Criterion 5 is therefore extended to measure admitted volume at **N = 2, 4 and 8**
> separately, and criterion 16 makes an N = 8 admission rate above 90% a **finding that reopens
> CR1**, not a passing result. Alternatives exist and are deliberately not taken here — a
> majority-absence rule, or per-pair strips — because both are ranking-adjacent and R3's ρ = −0.143
> forbids reaching for a selectivity score without measuring first. See Open question 6.

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

**[CR-FIX] — the draft's prediction measured the wrong surface, and the corrected version predicts
nothing.** The draft read: *"at the 44 authored fork pairs the two columns' readings overlap at
Jaccard median 65.7%, with a median 36 differing observations. CR1 removes exactly that shared
core. The prediction is therefore median 36 admitted observations per pair, replacing 2 × ~58
printed sentences."* Cross-review found this is a **unit error, twice over**:

- The **65.7% / median-36** figure is measured over *"the two branches' full **structural
  readings**"* (`feedback-versus-the-dashboard.md` §5d, which names `CompareView.svelte:119` in the
  same sentence). That is the **rung-0 per-position reading** — the surface this RFC puts
  **explicitly out of scope** (§Scope, *"The rung-0 structural reading itself … It is untouched"*).
  CR1 filters the **strip**, not the reading.
- The **~58** figure is the dossier's *"median 58 observations per position"* (§5b, `:327`) — again
  the reading, not the strip. The strip's own volume is **8.31 entries per ply** over 634
  transitions (§1.3), which is a per-*transition-gain* count over a whole path, not a
  per-position census. The two are not comparable and neither bounds the other.

CR1's admitted volume is therefore **not predicted by any number in the dossier**, and this RFC
makes **no numeric prediction for it**. What CR1 asserts is an *identity*, not a magnitude: an
observation on every column's path is not a difference between the columns. **The magnitude is
unmeasured and criterion 5 is the measurement** — which is now the only claim being made, and it is
falsifiable in the strongest sense available: there is no number for it to disagree with.

Two consequences worth stating plainly. **CR1 may barely reduce the strip at all** — the strip
already only fires on *gains*, and a gain that happens on one column at ply 3 and on another at ply
5 is in `common` and filtered, while a genuinely divergent structural consequence is exactly the
kind of thing that appears on one path only, so the direction is right and the size is unknown.
And **the surface the dossier actually condemned with the 36-differences figure is the rung-0
reading, which this RFC does not touch** — so D78's second half is *not* discharged by CR1, and
criterion 11 must not claim it is. This RFC does not claim CR1 makes the strip good; it claims CR1
makes it *about the comparison*, which it currently is not, and it claims that on set arithmetic
rather than on taste.

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
> when absent. **[CR-FIX] The edit is confined to the *first* `{#each}` block on that line — the
> one over `strips[…].structure`.** Line `:91` holds **two** `{#each}` blocks inside one
> `<details>`; the second iterates `strips[…].timing`, whose pivotal-marker entries
> `rfc/live-marker-quality.md` criterion 3 protects, and it is not touched.
> **The runtime's `sentence` field is unchanged**, so `comparisonNarrative` (`:56`),
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

- **Pack schema: nothing.** `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts:2`, verified
  `"0.22"`) and `schemas/drill_pack.schema.json`'s `$id`
  (`urn:chess-tabiya:schema:drill-pack:0.22`) are **untouched**. Not one `$defs` entry is added,
  removed, widened or narrowed. **0.19 remains frozen shut** and is not reopened. No committed pack
  byte changes, so **no content digest moves** (`packages/schema/src/drill-pack/digest.ts` digests
  content, not the `$id`). **[CR-FIX]** the draft said *"0.23 is left free"*: it is **not** —
  `rfc/engine-leverage.md` claims **0.23** and `rfc/vocabulary-wiring.md` claims **0.24**. The next
  free pack version is **0.25**, and §2.1 and Open question 4 are corrected to say so. This RFC
  claims none of them and is unaffected by their landing order.
- **Migration: nothing.** No table, no column, no `STORAGE_VERSION` bump, no run-schema stamp.
  Migration **20** (run schema **0.15**) stands as the head. **[CR-FIX]** the in-flight claims, for
  the record and for whoever rebases: `rfc/teacher-surface.md` holds **21** (no run- or pack-schema
  change), `rfc/engine-leverage.md` holds **22** with run schema **0.16**, `rfc/vocabulary-wiring.md`
  holds pack **0.24** and no migration, and `rfc/live-surface-honesty.md` claims none of the three.
  All are unaffected by this RFC and this RFC is unaffected by all of them. No new event type: claim
  delivery is a *projection* over the existing `outcome.reached` event, and projections are never
  persisted — the same reasoning `archive/shape-library.md` used to keep run schema at 0.8 for
  firings.
- **Refusal codes: nothing.** Verified by sweep: this RFC adds no `SourcingIssue` code, no
  `SourcingError`, and no pack-lint code. C6 is a *delivery-time* admission gate, not a validation
  refusal — it reads `EVIDENCE_TYPE_UNBACKED`'s existing map (`check.ts:183`) and changes no
  severity. The one adjacent register, `rfc/engine-leverage.md`'s `DEVIATION_COST_UNBACKED` /
  `DEVIATION_COST_CONTRADICTED`, is that RFC's (§5.3).
- **Run schema: nothing.** `feedbackDisclosed`/`feedbackDeliveryOpen`
  (`packages/runtime/src/feedback.ts:3`, `:22`) and the **four** run policies (**[CR-FIX]**, not
  five — see Deviations item 4) are **not modified**. This
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

All three claims were confirmed verbatim in cross-review: `live-marker-quality.md` §4.2 lists
*"Sites that do not change … `compare-strips.ts:38`, `story.ts:78`, `guidance.ts:34`"*, and its
criterion **3** names `castled` and `pawn_break`. Exhaustively: `StripEntry` appears **zero** times
in that RFC, `CompareView` **zero**, `StructuralObservation` **zero**, and all four
`compare-strips` mentions are disclaimers or deferrals to its own open question 4. **CR4's addition
to `StripEntry` is unopposed.**

**[CR-FIX] — one interaction in the other direction, which the draft did not flag.**
`live-marker-quality`'s open question 3 resolved 2026-08-15 to render `queensOff`, so its criterion
5 pins **eight** `renderPivotalMarker` outputs and states the seven existing ones are not frozen —
the `last_of_role` sentence changes text. `compare-strips.ts:38` calls
`renderPivotalMarker(entry).join(" ")`, so **the timing strip's rendered text moves when
`live-marker-quality` lands, in either landing order**. This does not conflict with criterion 9,
which is scoped before-and-after *this* RFC's change only — but criterion 9 must be implemented as
a before/after comparison within one tree, **not** as a golden-string fixture, or it will fail
spuriously on the other RFC's landing.

The conceptual borrowing is deliberate and bounded: this RFC uses L2's **method results** (ρ,
zero-denominator) as prohibitions, and does **not** claim that L1–L6 govern the compare strip —
§1.3(4) establishes it is a twice-gated learner-initiated surface and therefore outside L-rule
scope, and `live-marker-quality`'s own §3 scopes L1–L6 to firings that occur *"without the learner
asking for it in that moment"*, which agrees.

#### 5.3 `rfc/engine-leverage.md` — the ledger is shared, the row is not

D88 observes 235 machine-validated records anchored to `/deviations/{i}/moveUci` against 0 of 275
deviations declaring a `cost`. This RFC's §1.2 recomputed that same ledger population from the other
end — **235 `/deviations` support pointers**, reproducing the count exactly — because it needed the
`/feedbackClaims` figure from the same scan. **The `cost` binding and the deviation-anchored engine
records are `engine-leverage`'s, entirely**, and it says so from its side: *"`rfc/feedback-delivery.md`
(parallel draft) owns D77 / D78 / D79 … it does not specify the compare strip, claim delivery, or
`stated_reasoning`, and must not be read as doing so."* Verified exhaustively in cross-review:
`engine-leverage` contains **zero** mentions of `authored-feedback`, `AuthoredFeedbackItem`,
`KIND_ORDER`, `compare-strips`, `feedbackClaims` or `boundClaimIds`.

**[CR-FIX] — the draft's stated interface was the wrong one, and it missed the real one.**

- **`PackRecord` is not shared.** The draft hedged *"if `engine-leverage` also wants a
  ledger-derived field on `PackRecord`…"*. It does not: `engine-leverage` never mentions
  `PackRecord`, `pack-registry.ts` or `assessmentGrounding` at all. Its added fields are
  `Capabilities.costBasis` (a `/capabilities` response field), pack-schema `$defs`, and run-schema
  amendments. **C7's `boundClaimIds` is the only new `PackRecord` field in the wave.**
  (`PackRecord` is declared at `pack-registry.ts:41`, not `:40`.)
- **The real overlap is `apps/server/src/sourcing/check.ts`, and it is a co-edit of one function.**
  `engine-leverage` §2.4 adds `DEVIATION_COST_UNBACKED` and `DEVIATION_COST_CONTRADICTED` to
  `evidenceSupports` — the same function body that holds the `feedbackClaims` block at `:182-193`
  whose label→kind map C6 and C7 read as their source of truth. **This RFC modifies no line of
  `check.ts`; it only reads `:183`.** So the two are semantically disjoint (different issue codes,
  different pack fields) and merge-conflict-adjacent only. Neither blocks the other; whichever
  lands second re-reads the map's line number.
- **`check.ts` was being edited in the working tree during this cross-review** — an uncommitted
  `offlineJobProvenance` gate and an `OFFLINE_JOB_HTTP_PROVENANCE` code were added above the
  template functions, shifting every line number in §1.2 by roughly twenty. The findings are
  unaffected (`PROSE_POINTERS`, `explorerTemplate`, `engineTemplate` and the `feedbackClaims` block
  are untouched by it), but this is the third independent draft landing in one file. **Locate the
  label→kind map by the `feedbackClaims` block, not by line.**

#### 5.4 `rfc/client-surface-floor.md` — no geometry, no CSS

CR4's `CompareView.svelte` edit is a single render expression inside the existing `<details>` at
`:91`. It adds **no `@media` rule**, changes no selector, and moves no element. The file contains
**zero** `@media` rules today (verified: `grep -c "@media"` returns 0; the whole `<style>` block is
one minified line at `:128`) and CR4 adds none. Criterion 10 pins it.

**[CR-FIX] — the draft cited a criterion that does not exist, and understated the real interaction.**

- The *"compare-geometry draft will touch the same file"* note is **not in §8**; it is coordination
  note 1 of `client-surface-floor`'s **Register claim** section. §8 says the opposite about
  existence: *"`rfc/compare-geometry.md` **does not exist** (verified: no such file in `rfc/` or
  `rfc/archive/`)"*.
- There is **no criterion** that `CompareView.svelte` contains zero `@media` rules. The zero-`@media`
  statement is prose in that register note. The actual numbered criterion is **12**:
  *"`CompareView.svelte` is **unmodified** by this RFC's commits."*
- **That criterion is self-scoped, so CR4 does not break it** — the conclusion the draft reached is
  right. But `client-surface-floor` §8 states the *intent* behind it: *"a promise not to touch
  `CompareView.svelte`, held by criterion 12, so that whoever picks up **D63** inherits the file
  unmoved."* **CR4 moves it.** D63's future owner inherits one changed markup expression at `:91`
  and an unchanged `<style>` block. That is a real, if small, cost to another RFC's stated plan and
  it is recorded here rather than left for D63's owner to discover.

#### 5.5 `rfc/vocabulary-wiring.md` — no code overlap, one shared ledger row, one shared corpus **[CR-FIX]**

The draft did not mention this sibling. It claims **pack schema 0.24 and nothing else** (no
migration, run schema stays 0.15) and it clears this RFC from its side. Symbol-by-symbol it is
disjoint: `feedbackClaims`, `evidenceTypes`, `reasoning.ts`, `compare-strips`, `CompareView` — zero
hits; its single `authored-feedback.ts` mention is a read-only citation of `gradability`. Its file
surface is `lint.ts`, `pack-orchestrator.ts`, `pack-validation.ts`, `ledger-validation.ts`,
`packages/runtime/src/{line,trajectory,tempo}.ts` and the pack schema. Two real interfaces:

1. **A shared ledger row.** Criterion 11 annotates *Four declared vocabularies have zero content
   usage*; `vocabulary-wiring` owns **D90** and its criterion 8 discharges that row's `variantOf`
   quarter. Both edit the same row in the same wave — the annotations are additive and the row's own
   text (*"`prediction` and `reasoningKeyPoint` … have no in-flight RFC"*) survives both.
2. **A shared measurement corpus.** Its criterion 7 re-verifies and rewrites `assessedBy.retrievedAt`
   across committed `content/` sidecars. §1.2's 67/764/465-235-64 figures and §3.2's **70/61** are
   derived from those files. It adds no record pointing at `/feedbackClaims/<i>/text`, so the split
   should be stable — but **if `vocabulary-wiring` lands first, criterion 2's numbers are re-derived,
   not assumed.**

#### 5.6 `rfc/live-surface-honesty.md` — zero collision, one shared file **[CR-FIX]**

Named in the preamble as having appeared mid-drafting; now checked. It claims **no migration, no run
schema, no pack schema, no refusal code**, and explicitly leaves 0.23 and migration 21 to their
owners. Verified zero hits on every file this RFC touches: `compare-strips`, `CompareView`,
`authored-feedback`, `structural-sentences`, `guidance.ts`, `voice.ts`, `TerminalSheet`,
`CheckpointSheet`. Its surface is `live-types.ts`, `assistance-preference.ts`,
`packages/runtime/src/{types,assistance}.ts` and `feedback-policy.ts`.

**One shared file, at different declarations:** `apps/web/src/lib/api.ts`. C4 mirrors the fifth
`AuthoredFeedbackItem` arm into that file's copy of the union (`:180`); `live-surface-honesty` adds
`VoteTally.relayed` and `LiveSessionDetail.voteAdapter` to the same file. Different types,
different regions — merge-conflict-adjacent, no semantic overlap. Both RFCs also read
`packages/runtime/src/feedback.ts` and both declare it unmodified, which agrees.

#### 5.7 `rfc/teacher-surface.md` — confirmed clear **[CR-FIX]**

Claims **migration 21** only; run schema stays 0.15, pack schema stays 0.22. Zero hits on
`PackRecord`, `pack-registry`, `authored-feedback`, `AuthoredFeedbackItem`, `feedbackClaims`,
`compare-strips` or either sheet. It reads `feedbackDisclosed`/`feedbackDeliveryOpen` read-only and
states *"There is no per-viewer disclosure and this RFC adds none"* — which is also why §2.2a marks
the live-session path **unclear rather than broken**: an outcome on a shared live board opens the
terminal sheet for every seated participant, but no participant sees claims the player does not.

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
   remain residual. **This RFC does not edit `design/`;** the ledger consequence is criterion 12.
4. **[CR-FIX] `design/05-in-run-experience.md` §3a-i's *"a finished run has nothing left to
   contaminate"* is given an operational reading it did not previously have.** The draft treated
   *finished run* as a synonym for *an `outcome.reached` exists*; §2.2a shows the runtime has no
   such predicate, so C1 supplies one (exhaustion: every authored spine node reached, no play
   since). **This is a reading, not an amendment** — it makes the design sentence *true* of the
   mechanism instead of assumed-true — but it is the kind of reading design tier should confirm
   rather than have an RFC settle. **Flagged for the owner alongside Open question 1.** If the
   owner reads §3a-i as licensing the draft's weaker rule, §2.2a's stalemate-and-rewind case is the
   evidence that the weaker rule spoils drills, and the answer should be an anchor (Open question
   4), not a relaxation.

Otherwise: none. The disclosure model, the anti-contamination boundary and the assistance ladder's
rungs are used as-is. **[CR-FIX]** the draft said *"the five feedback policies"*: there are
**four** run policies — `RunFeedbackPolicy = "delayed_checkpoint" | "segment_end" | "attempt_end" |
"immediate_guard"` (`packages/runtime/src/types.ts:37`, matching `feedbackDisclosed`'s four-arm
switch at `packages/runtime/src/feedback.ts:3-20`) — and only **three** are authorable, because
`schemas/drill_pack.schema.json`'s `feedbackPolicy` enum is
`["delayed_checkpoint", "segment_end", "immediate_guard"]`; `attempt_end` is run-only. All four are
used as-is.

## Acceptance criteria

1. **The projection delivers claims.** A run satisfying C1's exhaustion predicate returns
   `kind: "claim"` items from `GET /runs/:id/authored-feedback`, each with
   `revealedBy.kind === "outcome"`. A test asserts that **no** claim item is ever returned with a
   `checkpoint` attribution, under **all four** `RunFeedbackPolicy` values
   (`delayed_checkpoint`, `segment_end`, `attempt_end`, `immediate_guard` — **[CR-FIX]**, the draft
   said five; only three of the four are pack-authorable, so `attempt_end` is exercised by
   constructing the run directly).
1a. **[CR-FIX] C1's exhaustion predicate is tested against the exploit that killed the draft's
    rule.** Three tests, all of which the draft's rule would have failed:
    (a) **early terminal + rewind** — play a mating pack to an early stalemate, assert **zero**
    claim items at the terminal sheet because authored coverage is incomplete;
    (b) **quiescence** — reach a covering outcome, assert claims are delivered, then `rewind` and
    `commitMove`, and assert claims are **withdrawn** from `GET /runs/:id/authored-feedback`;
    (c) **group seeding** — `createGroup` with a seed move that mates, assert no claims are
    delivered while sibling members are unplayed.
    A criterion that only asserts `revealedBy.kind === "outcome"` passes while the product is
    broken; these look at what happens *after*.
2. **The corpus figure is reproduced by the shipped code, not by a script.** Over the 37
   committed packs, C6 admits **70** claims and withholds **61** (**15,963 / 16,597** claim
   characters); the numbers are recorded in `planning/feedback-delivery/`. If the shipped
   implementation disagrees with §3.2's count, the RFC's number is wrong and is corrected there
   rather than in the code. **[CR-FIX]** This is a C6 count and is independent of C1 — do not
   conflate it with how many claims a *run* delivers, which criterion 6 measures.
3. **C6 fails closed.** A pack with a `corpus_observed` claim and no `.evidence.json` withholds it;
   adding a matching `explorer_frequency` record supporting `/feedbackClaims/<i>/text` admits it
   with `binding: "ledger_bound"`. Both directions tested. **[CR-FIX]** and the ledger-less
   fallbacks are tested explicitly, since C7 relies on them: a pack registered through
   `pack-registry.ts:374` or `:397` (both of which already default
   `assessmentGrounding: "unverified"`) yields an **empty** `boundClaimIds` and therefore withholds
   every machine-checkable claim. Note `ledger_bound` has **no fixture in the committed corpus**
   (0 today), so this criterion must construct one rather than find one.
4. **`hasWithheldAuthoredContent` is unchanged in meaning.** A run on a pack whose *only*
   undelivered material is C6-withheld claims reports `false`. Regression test written **before**
   the change. **[CR-FIX]** Additionally, record the share of runs for which the flag is `true` at
   the last event, before and after, so §2.5's discrimination loss is measured.
5. **CR1 is an identity, and it is measured.** A test asserts that for every admitted structure
   entry, the observation identity is absent from at least one sibling column's path set; and the
   Q8 harness's §5d measurement is re-run against the filtered projection, with the new
   entries-per-ply, firing rate and per-fork-pair admitted count recorded in
   `planning/feedback-delivery/` **whatever they are**. No threshold is asserted as a pass
   condition. **[CR-FIX]** The measurement is reported **separately for N = 2, 4 and 8** (see CR5),
   and it is reported against the *strip*, not the rung-0 reading — §4.2 records that the draft's
   "median 36" prediction came from the reading and has been withdrawn, so there is no prior
   number for this to agree or disagree with.
6. **[CR-FIX] C1's reach is measured, and the result is blocking.** Record (a) the share of corpus
   walkthroughs that reach any `outcome.reached`, and (b) the share that satisfy C1's **exhaustion
   predicate** — the number that actually governs delivery. **If (b) is below 10%, this RFC's Job 1
   does not ship as drafted**: it means the mechanism is correct and inert, and the honest response
   is Open question 4's ledger-derived anchor rather than a weaker predicate. §2.2b states this
   cost is unknown; this criterion is where it stops being unknown.
7. **CR3's degenerate cases are tested**: `N < 2` emits the unfiltered strip; identical branches
   emit an empty strip and the existing empty state.
8. **The anti-contamination boundary holds.** `drill-client-server.test.ts:158`
   (`expect(projected).not.toHaveProperty("feedbackClaims")`) passes unmodified, and a new test
   asserts `GET /packs/:id` still exposes no claim text after C1 ships.
9. **`live-marker-quality` non-interference.** `compare-strips.ts:38`'s pivotal-marker entries are
   byte-identical before and after; `castled` and `pawn_break` still render in the timing strip.
   Tested from both sides. **[CR-FIX]** implemented as a **before/after comparison within one
   tree**, never as a golden-string fixture — `live-marker-quality`'s resolved open question 3
   changes `renderPivotalMarker`'s `last_of_role` text, which flows through `:38` in either landing
   order (§5.2).
10. **`client-surface-floor` non-interference.** `CompareView.svelte` still contains zero `@media`
    rules after CR4, and CR4 touches only the `structure` `{#each}` block at `:91`, leaving the
    `timing` block and the `<style>` block unmodified.
11. **The ledger and the log are updated in the archiving commit** (`AGENTS.md` RFC completion
    protocol): **D77** flips to ✅ with the 70/61 split **and C1's measured reach** named; **D78**
    flips to **🚧 partial, not ✅** — **[CR-FIX]**, because §4.2 establishes that CR1 addresses the
    strip only, while D78's second half (*"the rung-0 reading is comparably undiscriminating: median
    58 observations per position"*) is explicitly out of scope; **D79** stays **open** and is
    annotated that C2 remains unused by content; the *Four declared vocabularies have zero content
    usage* row is annotated with the same. A dated entry lands in `planning/exploration/log.md`.
12. **The B4 residual is restated** in `planning/exploration/gates.md` — the *authored feedback
    claims have no delivery path (0/131)* item is replaced by the measured post-landing state
    (claims admitted, claims delivered, claims withheld), rather than deleted.
13. **No register row is added anywhere.** `rfc/README.md`'s pack-schema and migration registers are
    unchanged by this RFC, and the Active row it eventually gets says **claims nothing versioned**.
14. **[CR-FIX] The index-pointer hazard is pinned.** A test reorders a pack's `feedbackClaims` and
    asserts the result either fails `sourcing-check` or demotes the affected claims to
    `self_declared` — never silently carries a `ledger_bound` badge for a record describing a
    different sentence (§3.2).
15. **[CR-FIX] C9 holds: claims never enter the evidence packet.** A test asserts that after a
    covering outcome, `evidencePacket` at any node contains **no** claim text in `packet.sentences`
    and no claim entry in `packet.authored`, and that `POST /runs/:id/voice` and `/speech` are
    byte-identical to their pre-change output for the same run. Written as a **grep test** as well:
    `authoredText` has no `"claim"` arm.
16. **[CR-FIX] CR5's degradation is measured and is a finding, not a pass.** The admitted-entry
    share at **N = 8** is recorded. **Above 90% admitted, CR1 is reopened** rather than shipped as
    effective, and the result is written into D78's row and Open question 6.
17. **[CR-FIX] The attach-path finding is ledgered before acceptance.** New `design/BACKLOG.md` rows
    exist for (a) *no prose-preserving evidence-attach path exists for `/feedbackClaims/<i>/text`;
    `tablebase_result` is refused there outright and the explorer path overwrites the author's
    sentence* and (b) *evidence support pointers key on array index, so reordering silently
    rebinds*. AGENTS.md law 4 — both were uttered by this cross-review and neither has a row.

## Open questions

1. **Should C6 withhold, or deliver with a stated absence?** **Owner decision requested.** The draft
   chose **withhold**, because an unbacked `corpus_observed` claim carries a specific number the
   learner cannot check and the label is the only thing distinguishing it from a guess — and rung
   5's only safeguard is provenance. **[CR-FIX] Cross-review recommends the owner rule the other
   way, on a measurement the draft did not have**, and states its reasoning here so the owner can
   overrule it:

   - **Withholding is not deferral, it is deletion for 37 claims.** §1.2 found `/feedbackClaims/…
     /text` is a `PROSE_POINTER` and that `tablebase_result` can never be a registered template
     there, so the 37 `tablebase_exact` claims can never earn admission under the shipped
     validator. C6-as-drafted therefore does not create "countable debt with a visible payoff" for
     the majority of the 61; it creates a permanent silence with a rule attached. A debt you are
     forbidden to pay is not a debt.
   - **The hazard is narrower than the rule.** The dossier's worked example is a claim carrying *a
     specific, machine-shaped, unverifiable number* (*"reached 44,467,486 times … White scores
     50.1%"*). Measured `[V]`: **25 of the 61 withheld claims contain such a number; 36 do not** —
     and the numeral-bearing ones are almost entirely the `corpus_observed` and `engine_validated`
     classes (23 and 7), while **36 of the 37 `tablebase_exact` claims carry no number at all**.
     They read as categorical statements about a position class. Withholding them buys no honesty
     and costs the whole tablebase half of the corpus.
   - **Stating absence is what the product does everywhere else,** and C8 already writes the
     sentence: *"Author's claim, author-declared: `<labels>`. No machine record is attached."* That
     is the corpus abstention floor and `endgame.ts:47`'s *"No technique entry is available yet"*,
     applied to rung 5. It is also the only option that keeps the ladder's own logic: rung 5 is
     *an author's judgement*, and the honest provenance for an unbacked author's judgement is
     "the author said it", not silence.

   **Recommended rule — a two-tier C6, with the tier decided by the claim's text, not its label:**

   > **C6′.** A claim with an unbacked machine-checkable label is delivered with
   > `binding: "self_declared"` and C8's absence sentence, **unless** its `text` contains a
   > cardinal number that is not part of a move token — in which case it is **withheld**.

   This withholds **25** claims and delivers **36** more than the draft (70 → 106), it targets the
   named hazard exactly, and it is machine-checkable without an anchor. Its cost is a crude
   detector: a numeral is a proxy for "a quantity the learner cannot check", and it will withhold
   the occasional harmless number and admit the occasional unverifiable adjective. **That crudeness
   is the reason this is the owner's call and not the RFC's** — the alternative readings are
   defensible, and the draft's blanket withhold is the safe one if the owner weighs a false
   provenance statement above a silent corpus. What is **not** defensible after §1.2 is describing
   the blanket withhold as temporary.

   Whichever way this rules, **the rendered line must not print an unbacked machine-checkable label
   as though it were provenance.** C8's `self_declared` form already handles that; the label is
   named as *author-declared* and the absence is stated. That part is not in question.
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
4. **What anchors a claim, eventually? [CR-FIX: promoted from "deferred" to "probably required"]**
   C1 is the honest consequence of anchorlessness, not a destination — and §2.2a raised the price of
   staying anchorless from *"claims arrive late"* to *"claims arrive late and the runtime has no
   state at which late is safe, so a predicate had to be invented."* Three candidates, none taken
   here: an authored `at` on `$defs/feedbackClaim` (pack **0.25** — **[CR-FIX]**, 0.23 and 0.24 are
   claimed, §5.1 — plus a 131-claim wave); a ledger-derived anchor, where a claim's
   `explorer_frequency` or `engine_eval` record already carries an `anchor.fen` that could be
   matched to a spine position — **author-supplied and machine-checked, therefore not an
   inference** — or C2's `stated_reasoning` reference becoming the normal authoring habit.
   **The second no longer "arrives free with the binding wave"**, because §3.1 found the binding
   wave has no prose-preserving path; and it can never cover the 37 `tablebase_exact` claims, since
   §1.2 shows `tablebase_result` cannot legally support that pointer at all. **If criterion 6(b)
   comes back low, this question becomes the RFC rather than a footnote to it.**
5. **Does the binding wave belong in this RFC's planning directory or its own?** §3.2's 61 withheld
   claims become visible debt the moment C1 ships. The dossier files it as item 2, a content wave,
   not an RFC. **[CR-FIX]** After §3.1 and §1.2 it is **not** a content wave at all — it needs a
   template kind for `tablebase_result` at a prose pointer, or an overreach-rule widening, or an
   emitter that attaches rather than overwrites. That is `content-sourcing` RFC territory. Two
   `design/BACKLOG.md` rows are required before this RFC is accepted (criterion 17), and this
   question is then answered by whoever picks them up.
6. **[CR-FIX] Does CR1 survive N = 8?** CR5 records that `common` shrinks monotonically in the
   column count and that `MAX_COMPARISON_BRANCHES = 8`, so CR1's selectivity is weakest exactly
   where `archive/branch-set-scale.md` put the most columns. Criterion 16 measures it. The
   alternatives — majority-absence, or pairwise strips against a designated reference column — are
   both closer to ranking than CR1 is, and R3's ρ = −0.143 says do not reach for a selectivity
   score before measuring. Deferred **to criterion 16's result**, not to taste.
7. **[CR-FIX] Is `hasWithheldAuthoredContent` still worth having?** §2.5 records that C1's
   predicate makes the flag near-permanently `true` mid-run. Criterion 4 measures the degradation.
   If it becomes uninformative, the honest move is to retire or re-specify it rather than let a
   true-but-useless flag sit on the surface — which is the same failure this whole RFC is about,
   one field over. Not blocking; ledger row if the measurement confirms it.

## Changelog

- 2026-08-15: created.
- 2026-08-15: **adversarial cross-review by an agent that did not write the draft.** Every measured
  figure in §1 and §3.2 reproduced independently and exactly (131 claims, key set
  `{id, text, evidenceTypes}` on all 131, min 2 / median 4 / max 5 / mean 3.54; 67 machine-checkable
  labels, 66 on 32 ledger-bearing packs, 0 backed; 764 support pointers at 465/235/64 with 0 at
  `/feedbackClaims`; 70 admitted / 61 withheld). Three specification changes:
  **(1)** C1 rewritten — the draft's *"consequence-before-verdict holds by construction"* argument
  was false (`outcome.reached` closes a node, not a run) and is replaced by an explicit exhaustion
  predicate (§2.2);
  **(2)** C8's evidence-packet clause removed and replaced by **C9**, which excludes claims from the
  packet, `/voice` and `/speech` — the draft's version broke C1 and widened the `voiceCheck` fence
  by 44 judgement-bearing and 75 prescription-bearing claims (§3.4);
  **(3)** §3.1/§3.2 corrected — the "already-shipped attach path" for the 61 withheld claims does
  not exist for 38 of them and overwrites the author's prose for the other 23, which changes Open
  question 1 from a preference into a measured recommendation.
  Corrections: Summary's 22.1% → 16.1%; "five feedback policies" → four (three authorable);
  CR1's "median 36 admitted" prediction withdrawn as a unit error (it measured the out-of-scope
  rung-0 reading); CR5 added for CR1's N-degradation; §5.1's "0.23 is left free" → claimed;
  §5.3's `PackRecord` counterfactual replaced by the real `check.ts` co-edit; §5.4's cited
  criterion corrected to `client-surface-floor` criterion 12; §§5.5–5.7 added for
  `vocabulary-wiring`, `live-surface-honesty` and `teacher-surface`; criteria 1a and 14–17 added.
