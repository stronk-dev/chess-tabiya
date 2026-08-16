# RFC: Feedback delivery — give the claim layer a learner, and stop the strip printing the census

- **Status:** **draft — author round 2026-08-16, UNBLOCKED and no longer owner-gated.** Its
  dependency `rfc/archive/claim-backing.md` is implemented and archived; **Open question 1 is
  closed rather than re-asked** (the C6 fork dissolved with the debt it priced), and Open question 5
  is answered. What the RFC now needs is **cross-review**, not a ruling. Claims **nothing
  versioned** — no pack lane, no migration position, no run-schema stamp, no refusal code.
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-15
- **Design refs:** `design/05-in-run-experience.md` §3 (the assistance ladder; **rung 5 at `:76`** —
  *"Authored claims … with no review workflow (owner ruling 2026-08-13) provenance is the only
  safeguard"*), §3a-i (`:105`, the shipped disclosure model, and specifically ***"`outcome.reached`
  discloses under every policy (a finished run has nothing left to contaminate)"*** — which this RFC
  reads operationally, and flags for the owner in Deviations item 4);
  `design/03-product-breadth.md` B4 (`:284`, the evidence-and-explanation gate, residual)
- **Exploration gate:** `design/research/feedback-versus-the-dashboard.md` (Q8, 2026-08-15). Its §9
  names four changes; this RFC is items **1** (deliver the claims) and **3** (rank or filter the
  compare strip), which it calls *"the single change most likely to flip axis 5"* and *"the one item
  that is genuinely a design fork"*. Its verdict sentence is the whole brief: **the remedy is
  delivery, not authoring.**
- **Ledger rows this RFC owns**, cited by title because line numbers drift: *0 of 131 authored
  feedback claims can reach a learner* (**D77 🐞**) and *The compare strip fails the usefulness axis
  worse than the leaf R3 condemned* (**D78 🐞**). Both were written 2026-08-15 and both are open.
  **Both row titles carry stale figures and criterion 11 corrects them at landing**: D77's "131" is
  **196** and D78's 8.31/99.3%/1.01× are **8.83 / 99.4% / 1.004×** (§1.3). This RFC also owns
  **D79 🐞** as an annotation rather than a closure — re-measured from 0 of 145 checkpoints to
  **0 of 201**.
- **Ledger rows this RFC reads but does NOT claim:** **D97 ✅** and **D98 ✅** — both raised by this
  RFC's cross-review, both **closed by `rfc/archive/claim-backing.md`** on 2026-08-16, and both
  re-verified closed in this round (§1.2). **D79 🐞** stays open and is annotated rather than
  closed (criterion 11). **D167 🔨** is `claim-backing`'s request against *this* RFC's `binding`
  field and is discharged by §2.5 in this round. **D417 🐞** and **D421 🐞**, both found 2026-08-16,
  are read as constraints on §3.4 and C9 respectively (§3.5) and neither is claimed here.
- **Depends on:** nothing unlanded. **`rfc/archive/claim-backing.md` (implemented 2026-08-16, pack
  0.26) is the hard dependency and it has landed** — it supplies `claimBindings`, the assertion
  registry, the principle registry, and the `PackRecord.boundClaimIds` / `PackRecord.claimBackings`
  fields this RFC's C6/C7 asked for. `rfc/archive/authored-feedback-delivery.md` and
  `rfc/archive/authored-explanation-surface.md` (both implemented) ship the projection this RFC
  extends; `rfc/archive/open-answer-grading.md` ships the one existing claim consumer;
  `rfc/archive/content-sourcing-foundation.md` ships the evidence ledger and `sourcing-check`.
- **Related, NOT absorbed:** **D88** (*The engine has already answered, at the exact pointer of the
  field that would consume it* — 235 machine-validated records anchored to `/deviations/{i}/moveUci`
  against 0 of 275 deviations declaring a `cost`, `design/BACKLOG.md:124`) is owned by the parallel
  draft **`rfc/engine-leverage.md`**. This RFC reads the same ledger and must not be read as
  claiming that row. See §5.3.
- **Parent / amends:** amends `rfc/archive/authored-feedback-delivery.md` (the three delivered
  authored shapes become four) and `rfc/archive/n-way-comparison.md` (the comparison structure
  strip gains an admission filter). Amends neither at the disclosure model, which is untouched.
- **Supersedes / superseded by:** —
- **Planning:** `planning/feedback-delivery/` (once implementing)

*Every code site below was first read in the working tree at **`8445562`** on 2026-08-15,
**re-verified against a clean tree at `a9c31a6`** during the 2026-08-15 adversarial cross-review, and
**re-verified a third time at `8744adb`** during that day's author revision.
**Re-verified a fourth time at `532c7e2` on 2026-08-16, for the author round that follows the
landing of `rfc/archive/claim-backing.md`.** Between the third and fourth verifications the tree
moved past six of this document's load-bearing findings and the corpus grew by **35%**
(37 claim-bearing packs → **50**; 131 claims → **196**). Every figure below carries the commit it
was measured at; the ones marked `[2026-08-16]` are this round's and the ones without a marker are
`8744adb` numbers **that have been superseded and are kept only where the comparison is the point**.
**Locate by symbol name first — every line number in this document is advisory**, and several have
moved by fifty or more (`CompareView.svelte`'s strip block was `:91` and is `:135`).*

> **Revision status, 2026-08-15 — the author's response to cross-review.** This draft was
> adversarially cross-reviewed by an agent that did not write it, and has now been revised by its
> author. Every measured figure in §1 and §3.2 was reproduced a **third** time for this revision,
> from the committed corpus; every code site was re-located **by symbol**, and the line numbers in
> `apps/server/src/sourcing/check.ts` had moved by roughly twenty and are corrected throughout.
> **What the author kept of the reviewer's substitutes, and what the author replaced:**
>
> - **Kept — the demolition of the draft's C1 (§2.2a).** The reviewer was right and the draft was
>   wrong. `outcome.reached` closes a **node**, re-verified at `runtime.ts`'s `commitMove`,
>   `events.ts`'s uniqueness check and `rewind`'s missing guard. Consequence-before-verdict did not
>   hold by construction, and the two-click exploit is real.
> - **Kept and made stricter — the exhaustion predicate (§2.2c).** It is the right rule and it is
>   the reviewer's, not the author's. But the reviewer scoped coverage to
>   `reachableAuthoredSpineIds`, which is the ancestor-chain of the pack's *checkpoints* — narrower
>   than the object being protected. A pack-wide anchorless claim earns pack-wide exhaustion:
>   **every authored spine node**, and the hole this closes is measured (§2.2c).
> - **Replaced — the outcome-only occurrence.** `outcome.reached` is emitted only from
>   `terminalOutcome` (checkmate, stalemate, 50-move, threefold), and **only 6 of the 37 committed
>   packs have a spine leaf that is a chess-terminal position — 24 of 131 claims** (§2.2b). Bolting
>   the predicate to that event caps Job 1 at 18.3% of the claim corpus *before a single learner is
>   observed*, and the outcome conjunct contributes no safety that exhaustion does not already
>   supply. C1 now rides **whichever reveal occurrence the pack's policy has already released**.
>   This is a design reading and is flagged for the owner in Deviations item 4, exactly as the
>   reviewer's reading was.
> - **Kept in full — C9 (§3.4),** and verified to close the hole completely: `authoredText` is the
>   only door into `evidencePacket`, and `voiceCheck` allowlists LLM output *from* the packet, so
>   exclusion — not filtering — is the only rule that does not widen the renderer's licence.
> - **Kept — CR5, the withdrawn CR1 prediction, and the four register/arithmetic corrections**
>   (0.25 next free; four run policies, three authorable; 16.1% not 22.1%; criterion 16's N = 8
>   gate). Each was re-verified here against code, the corpus, and `rfc/README.md`'s registers.
> - **Escalated — the attach-path finding.** It is now **D97** (`design/BACKLOG.md:115`), with
>   **D98** (`:116`) for the index-keyed pointer, and it is sharper than cross-review found: the
>   validator does not merely lack an attach path, it **requires the claim's text to be the
>   byte-exact rendered template** (§1.2). Job 1 is reshaped around that rather than patched: the
>   C6 fork is now the owner question this RFC exists to ask (Open question 1).
> - **The kill gate stands, unweakened, and here is the author's answer to it.** Criterion 6's
>   *"below 10% of exhausting walkthroughs and Job 1 does not ship as specified"* is kept exactly as
>   cross-review wrote it, including the ruling that the remedy is an anchor rather than a softer
>   predicate. **What the author refuses is to let the gate be answered by the wrong measurement.**
>   Under the reviewer's outcome-conjunct rule the gate would trip at a structural ceiling of 18.3%
>   — a fact about which packs end in mate, not about whether learners exhaust drills — and Job 1
>   would be abandoned on evidence that was never about Job 1. C1 as specified makes criterion 6 a
>   *behavioural* measurement, which is what a kill gate is for. If it still comes back under 10%,
>   the author's position is unchanged from the reviewer's: **take the anchor (Open question 4), do
>   not weaken the predicate.**


> **OWNER RESPONSE 2026-08-16, and it reframes Open question 1 rather than answering it.**
> The owner asked: *"i dont understand… what are we missing? can't we implement it properly?
> what do we gain/lose?"* — and that is the right question. Claude posed C6 / C6′ / C6″ as a
> three-way product fork about **what to show a learner while the attach path is broken**. It is
> not primarily that. **What is missing is an implementation, not a decision.**
>
> The evidence contract was built for machine-*rendered* sentences: a claim's text pointer is
> `PROSE_POINTER`, only a registered explorer or engine template may support it, and both require
> the supported prose to be the **byte-exact rendered template**. So the only way to "back" an
> authored sentence today is to **replace it** — `attachExplorerEvidence` literally assigns
> `pack.feedbackClaims[i].text = renderExplorerFrequency(values)` and then records evidence for
> the sentence *it* wrote. Authored prose was never given a path, and the contract forbids one.
>
> **`rfc/archive/claim-backing.md` (implemented, pack 0.26) is that implementation.** It adds `claimBindings`:
> the author keeps their own sentence and declares, span by span, which verbatim fragments are
> instrument readings; the validator re-derives each reading from records already in that pack's
> ledger and requires the author's words to match. The author's voice survives and the numbers
> inside it are verified.
>
> **Therefore this RFC is sequenced BEHIND `claim-backing`, and that sequencing dissolves the
> costly half of the fork.** "Withhold" stops meaning *permanently dark for 37 claims* and starts
> meaning *not yet bound* — deferral, which is what it was always assumed to be. This RFC must
> restate Open question 1 against a working attach path and report what residue, if any, still
> cannot be bound once `claimBindings` exists. **Do not re-ask the owner the three-way question;
> it was a symptom of enforcing before building.**

> ## AUTHOR ROUND, 2026-08-16 — Open question 1 is CLOSED, not re-asked, and the blocker was gone
> ## for a day before anyone noticed
>
> **`rfc/archive/claim-backing.md` is implemented and archived at pack schema 0.26.** The attach
> path is not a proposal any more; it is `claimBindings` in the evidence ledger, validated by
> `validateClaimBindings` (`apps/server/src/sourcing/claim-binding.ts`), and it is **already wired
> into the delivery-side field this RFC specifies** — `PackRecord` carries `boundClaimIds` *and*
> `claimBackings` (`apps/server/src/pack-registry.ts`), so §3.3's C7 has shipped ahead of the RFC
> that asked for it. `planning/work-register.md` §2 still read *"OWNER-BLOCKED on the C6 fork"*
> until `532c7e2`. **The register was stale for a day on the item it calls the highest product
> value of anything unowned**, which is the same failure class as the content-wave closeout added
> to `AGENTS.md` this morning, one tier over.
>
> **Open question 1 does not need an owner ruling and is closed here rather than re-asked.** The
> three-way fork priced a debt that could not be paid; the owner already refused all three options
> on 2026-08-15 (*"why not fix them properly?"*, `claim-backing`'s exploration gate) and
> `claim-backing` §6 retained **C6 — withhold the unbacked** — and formally **withdrew C6′ and
> C6″**. Withholding is now genuine deferral. Re-asking would be asking the owner to re-rule a
> ruling. §3.2 restates C6 against the shipped predicate and §Open question 1 records the closure
> with the one condition that would reopen it.
>
> **What the residue actually is, measured rather than argued** `[V]` `[2026-08-16]`. Of **196
> claims across 50 packs**, `make expression-census` reports **`backedClaims: 1`** — one binding in
> the entire corpus, and it is `claim-backing`'s own worked example
> (`philidor-third-rank-hold/philidor-is-drawn`). So this RFC's day-zero delivery is **98 admitted /
> 98 withheld**, and the withheld half is a **wave**, not a contract:
> `claimBindings` can carry every one of the three machine-checkable classes, and the reasons the
> other 97 are not carried yet are named at the shipped checker in §3.2 — `CLAIM_ASSERTION_UNRECORDED`
> for 60 `corpus_observed` claims because **the corpus holds zero explorer records of either kind**,
> `CLAIM_CENSUS_INCOMPLETE` for the tablebase census claims, and a 15-pack population with **no
> evidence sidecar at all** to bind into.

## Summary

Q8 measured the product's feedback surface against the named anti-pattern and returned a split
verdict: we beat "Stockfish labels + prose" on honesty, timing and re-entry, and we **forfeit on
the claim layer**, because **no authored `feedbackClaim` is deliverable** — **0 of 196**, over
**61,531 characters**, with **no delivery path of any kind** `[V]` `[2026-08-16]`. *(That was
0 of 131 / 32,560 chars at `8744adb`. The claim corpus has **grown by 49% in claims and 89% in
characters** in one day while the delivery path stayed at zero, which is the argument for landing
this: every honest authoring wave makes the undelivered pile larger. The draft's
"16.1% of a 202,479-character authored corpus" is a `8744adb` figure and is **not re-derived here**
— the denominator has moved and the claims' share of it is not what this RFC turns on. An earlier
draft said "22.1%", which was the dossier's total undeliverable share rather than the claims'
share; both numbers are retired in favour of the absolute count.)*
What *is* delivered is worse than that sounds, and re-measurement made it worse rather than
better `[V]` `[2026-08-16]`: the comparison structure strip fires on **99.9%** of **754**
transitions at **8.83 entries per ply**, and **99.4%** of **18,470** quiet alternatives fire too,
**92.0%** of them with the *same kind* — a lift of **1.004×**, down from the draft's 1.005×, and far
below the **1.05×** that got `slider_lines_changed` refused by R3 and by
`rfc/live-marker-quality.md` §3 L2. Volume grew (5,266 entries → **6,659**) and discrimination did
not. **D78 has not decayed; it has been re-confirmed on 19% more transitions.**

This RFC does two jobs, and they are different jobs with different rules.

**Job 1 — deliver what exists.** `projectAuthoredFeedback` gains a fourth *authored* shape (a fifth
union arm — the existing fourth arm, `theory_verdict`, is derived), `claim`, revealed **only while
the run satisfies an authored-exhaustion predicate**, and attributed to the reveal occurrence the
pack's policy has already released (C1, §2.2c).

The draft's original rule — *"revealed only at an `outcome.reached` occurrence, because `design/05`
§3a-i rules that a finished run has nothing left to contaminate"* — **was unsafe and is withdrawn**.
`outcome.reached` closes a **node**, not a run (`docs/branch-runtime.md:137`, `:116`), rewind
carries no outcome guard, and `apps/web/src/lib/TerminalSheet.svelte:77` — the surface that would
print the claims — is where the *"Rewind and branch"* button lives. A learner who stalemates a
mating drill at ply 10 would be handed the pack-wide claim *"the tablebase gives exactly one winning
move, Ra8+"* and a rewind button, in two clicks. Consequence-before-verdict is **not** preserved by
construction; C1 earns it with an explicit predicate instead.

That predicate is the whole of the safety argument, which is why C1 is **not** also bolted to the
outcome event. `outcome.reached` is emitted only where `terminalOutcome`
(`packages/runtime/src/outcome.ts:5-16`) returns a result — checkmate, stalemate, 50-move,
threefold — and **only 6 of the 50 claim-bearing packs have a spine leaf that is a chess-terminal
position, holding 24 of the 196 claims** `[V]` `[2026-08-16]` (§2.2b). An outcome-gated Job 1 is
therefore capped at **12.2% of the claim corpus by the corpus's own shape** — a ceiling that **fell
from 18.3%** as the corpus grew, because all nineteen packs added since the draft are opening and
middlegame packs that cannot produce the event at all. **No pack-schema change and no migration**:
the claims already exist in the packs, the occurrences already exist in the run log, and the
projection already computes both halves of the predicate.

**Job 2 — stop delivering noise.** The strip's structural half answers the wrong question. It
computes each branch's difference *from its own previous ply*, which every move satisfies; the
learner opened a comparison to ask what differs *between the branches*. The fix is a set operation,
not a threshold: **an observation present on every column's path is not a difference between the
columns, and is not admitted to any column's strip.** No number is invented — R3's ρ = −0.143
forbids ranking by rarity, and the dossier's own zero-denominator problem forbids treating a
structurally-empty population as evidence.

**And the unbacked evidence labels are answered rather than deferred (§3), by a mechanism that now
exists.** The fix is **delivery**, and the verification is in this document: the labels were never
checked *on a surface* because there is no surface. This RFC makes the binding **load-bearing at
delivery time** — a claim whose machine-checkable label has no validating `claimBindings` entry is
**not delivered as though the record existed**.

**The rule is C6 — withhold the unbacked — and it is settled rather than forked.** The draft posed
C6 / C6′ / C6″ as an owner fork because withholding was not deferral: `/feedbackClaims/\d+/text` was
a `PROSE_POINTER` that only a registered explorer or engine template could support, both templates
required the supported prose to be the byte-exact rendered sentence, and the one shipped emitter
*substituted* the author's sentence rather than attaching to it — so **37 claims could never earn
admission at all**. That is **D97**, and **`rfc/archive/claim-backing.md` closed it** (owner ruling
2026-08-15: *"why not fix them properly?"*). All three findings are now false in the tree, verified
by symbol at `532c7e2` (§1.2): `attachExplorerEvidence` writes a binding and **never assigns to
`pack.feedbackClaims[i].text`**; the template exemption is gone from the overreach guard so a claim
pointer in `record.supports` is refused **unconditionally**; and claim backing lives in
`ledger.claimBindings`, span by span, with the author's sentence intact. `claim-backing` §6
retained C6 and **withdrew C6′ and C6″**. **Open question 1 is therefore closed in this round, not
re-asked** — the fork was a way of pricing an unpayable debt, and the debt is payable.

**What is left is a wave, and it is measured** `[V]` `[2026-08-16]`. Day zero — this RFC lands,
nothing further is authored — delivers **98 of 196 claims, 26,735 of 61,531 characters (50.0% of
claims, 43.4% of claim prose)**, because `make expression-census` reports **`backedClaims: 1`**
against **99 machine-labelled claims**. The one binding is `claim-backing`'s own worked example.
§3.2 reports the residue per class and names each blocker at the shipped checker rather than at
intent.

## Motivation

### What is actually broken

Three findings from `design/research/feedback-versus-the-dashboard.md`, each re-verified against
code in §1 rather than taken on the dossier's word:

1. **The claim layer has no door.** `projectAuthoredFeedback` delivers exactly three shapes and
   `feedbackClaims` is not among them; `docs/explanation-grounds.md:146-147` states this
   deliberately (*"Concept identifiers, **unanchored feedback claims**, note-less deviations, and
   FEN-anchored deviations remain absent"*). The one runtime consumer is a `stated_reasoning` key
   point ground, and **0 of 201 corpus checkpoints use `stated_reasoning`** (D79, re-measured
   `[2026-08-16]`; the draft's figure was 0 of 145 and only the denominator moved). The door is
   shipped, correct, and unopened.
2. **What we do deliver discriminates at ≈1.01×.** The strip is not a proposal — it is the
   difference layer of the surface `design/00-thesis.md` calls the product's one original claim.
3. **Machine-checkable evidence labels are essentially unbacked**, and every pack is `draft` so
   `EVIDENCE_TYPE_UNBACKED` warns rather than errors. The draft measured 66 of 66 unbacked across 32
   ledger-bearing packs; re-measured `[2026-08-16]`, **99 of 196 claims carry a machine-checkable
   label and exactly 1 is backed** — `make expression-census` reports `backedClaims: 1`. The
   *mechanism* to back them landed on 2026-08-16 (§1.2); the *records* have not.

The uncomfortable reading of (1) and (2) together is the dossier's own: *"the part of our idea that
answers Q8 is authored and undelivered, while the part that is delivered is a census R3 already
told us not to trust unranked."* Both halves are wiring. Neither needs research to start.

### Why the working precedent is deviation notes

**349 deliverable deviation notes** `[V]` `[2026-08-16]` (235 when the draft was written; **349 of
349 deviations carry one**), each bound to a named non-spine `moveUci` at a named spine
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
learner, and it fires only on a `stated_reasoning` checkpoint. **The corpus has none** (D79) — and
re-measured for this round the denominator has grown while the numerator has not: **0 of 201
checkpoints** across the 50 drill packs use `interaction.type === "stated_reasoning"`, against the
draft's 0 of 145 `[V]` `[2026-08-16]`. There are **0 `reasoningKeyPoint` entries** in any drill pack
and **0 key points anywhere** using a `{kind:"claim", claimId}` ground, against **196** authored
claims. The one `stated_reasoning` instance in the repository is the browser fixture
`content/drafts/stated-reasoning.browser.json`, whose two key points both use a `spine_move` ground.
See §6 criterion 11.

**(c) The claims are structurally anchorless, and this is measured, not assumed.** Over the 50
committed drill packs (`content/drafts/*.json`; the six `*.browser.json` fixtures carry no claims
and the `.evidence`/`.job`/`.sources` sidecars are excluded), **196 claims across 50 packs**, and
the key vocabulary is exactly **four** keys with exactly **two** key sets `[V]` `[2026-08-16]`:
`{id, text, evidenceTypes}` on **114** claims and `{id, text, evidenceTypes, principles}` on **82**.
Not one claim carries a node, a ply, a move, a checkpoint or a FEN. **`principles` is a rung-5
provenance reference, not an anchor** — it names a registry entry (`content/principles/`), never a
position — so C1's argument is unchanged by its arrival. The type agrees: `FeedbackClaim`
(`packages/schema/src/drill-pack/types.ts:170-175`) has four members and no location.
`design/BACKLOG.md`'s *Content transfer test* row said it first and said it exactly:
*"`feedbackClaims` have no trigger so they can never fire."*

Distribution, because §2.4 rests on it `[V]` `[2026-08-16]`: **min 2, median 4, max 7, mean 3.92
claims per pack** (was min 2 / median 4 / max 5 / mean 3.54). §2.4's order-of-magnitude argument is
unaffected; the max moved by two.

**(d) The anti-contamination boundary is real and stays.** `projectPackDocument`
(`apps/server/src/pack-registry.ts:65`) strips authored material from `GET /packs/:id` — its
docstring at `:60-63` says so — and `apps/server/src/drill-client-server.test.ts:158` asserts
`expect(projected).not.toHaveProperty("feedbackClaims")`. **Nothing in this RFC touches that
assertion**, and criterion 8 pins it.

#### 1.2 The evidence binding — one binding in 196 claims, and the reason is now a wave rather than a refusal

**This section reported a permanent refusal and now reports a payable debt. Both halves are
re-verified by symbol at `532c7e2`, and the change is `rfc/archive/claim-backing.md`'s.**

**(a) What the draft found, and what is true now.** The draft's D97 finding was that
`/feedbackClaims/\d+/text` is a `PROSE_POINTER` admitting only a registered explorer or engine
template; that both templates require the supported prose to be the **byte-exact rendered
sentence**; and that the one shipped emitter assigns
`pack.feedbackClaims[claimIndex].text = renderExplorerFrequency(values)`. Each is now false in the
tree, and each was checked at the symbol rather than at the line `[V]` `[2026-08-16]`:

| draft finding | state at `532c7e2` |
|---|---|
| the overreach guard exempts records satisfying `explorerTemplate` / `engineTemplate` | **gone.** The guard in `evidenceSupports` (`apps/server/src/sourcing/check.ts`) now reads `HUMAN_ONLY_POINTERS.some(...) \|\| PROSE_POINTERS.some(...) \|\| (record.kind === "explorer_frequency" && /^\/spine(?:\/\|$)/.test(pointer))` with **no `isExplorerTemplate` / `isEngineTemplate` term**. Every prose-pointer support raises `EVIDENCE_OVERREACH` unconditionally, at the `issue(...)` default severity **`error`** (`ledger-validation.ts`). This is **D133** ✅, and it made the fence *stricter*, not looser: the two template predicates survive only as a `templateId` allowlist |
| `attachExplorerEvidence` overwrites the author's sentence | **gone.** `apps/server/src/sourcing/explorer.ts`'s `attachExplorerEvidence` makes **no assignment into `pack` at all**. It reads `pack.feedbackClaims[claimIndex].id` and `sha256(...text)` to build a `ClaimBinding`, and refuses without `--span`/`--field`: *"`--span` and `--field` are required; pack prose is never generated or overwritten"* (`ATTACH_SPAN_REQUIRED`). `renderExplorerFrequency` survives but is **dead in production** — its only remaining caller is `explorer.test.ts`. This is **D97** ✅ |
| `tablebase_result` can never legally back a claim | **false.** It backs one today. `content/drafts/philidor-third-rank-hold.evidence.json` binds `philidor-is-drawn` through four instrument spans — `draw`/`tablebase.category@v1`, `five`/`tablebase.pieceCount@v1`, `drawn`/`tablebase.lineUniformCategory@v1`, `lost`/`tablebase.moveCategory@v1` — against `tablebase_result` records already in that pack's own ledger, **with the author's 262-character sentence unchanged** |
| `$defs/feedbackClaim` is `additionalProperties: true`, so absence can only be counted | **closed.** The `$def` is `additionalProperties: false` at pack schema 0.27, with exactly four properties (`id`, `text`, `evidenceTypes`, `principles`). This is **D112** ✅. §2.1's key-set measurement is now corroborated by the schema instead of substituting for it — and §1.1(c)'s two observed key sets are exactly the two the schema permits |

**(b) The attach path, stated once so §3 can refer to it.** `ClaimBinding`
(`apps/server/src/sourcing/types.ts`) is `{claimId, pointer, textSha256, spans}`, living in an
**optional third array on the evidence ledger**, not in the pack. Each span is either
`{span, assertion}` or `{span, authored: true}`. `validateClaimBindings`
(`apps/server/src/sourcing/claim-binding.ts`) resolves the pointer, checks the claim id and the
text digest, evaluates each assertion against **records already in that pack's ledger**, requires
the author's own characters to normalise to the assertion's result (`normalizes`), sweeps the
undeclared remainder for machine-shaped tokens (`MACHINE_TOKEN` → `CLAIM_ASSERTION_UNDECLARED`),
cuts the sentence into segments and attributes each one, and returns a
`disposition: "ledger_bound" | "author_attributed"`. **The author keeps the sentence and the numbers
inside it are verified.** Fifteen assertion kinds are registered (`CLAIM_ASSERTION_KINDS`), and
they resolve from exactly three record kinds: `tablebase_result`, `engine_eval` and
`explorer_position_census`.

**(c) Measured state of the corpus** `[V]` `[2026-08-16]`, `make expression-census` plus an
independent recount over `content/drafts/`:

| | |
|---|---|
| drill packs / packs carrying claims | **50 / 50** (the six `*.browser.json` fixtures carry none) |
| claims / claim characters | **196 / 61,531** |
| claims carrying ≥1 machine-checkable label | **99** (35,058 chars) |
| `evidenceTypes` census | `author_principle` **82**, `corpus_observed` **60**, `derived_feature` **43**, `tablebase_exact` **37**, `hypothesis` **24**, `engine_validated` **8**, `human_model_predicted` **0** |
| **`backedClaims` (expression census)** | **1** |
| evidence sidecars / records | **32 / 764** |
| records by kind | `engine_eval` **391**, `tablebase_result` **341**, `position_legality` **32** |
| records of either explorer kind | **0** |
| ledgers carrying `claimBindings` | **1** (`philidor-third-rank-hold`) |
| support pointers at `/feedbackClaims/…` | **0** — and now unconditionally refused (D133) |

`human_model_predicted` is in the schema enum, absent from the label→kind map, and **used by zero
claims**. It is unbackable by construction (D87: no Maia evidence kind exists in `EVIDENCE_KINDS`)
and moot in practice. `hypothesis` and `derived_feature` are self-declared by design.

**(d) One dead alternative in the shipped map, and it is worth naming because it will mislead the
wave.** `MACHINE_LABELS` (`claim-binding.ts`) maps `corpus_observed` to
`["explorer_frequency", "explorer_position_census"]`, but **no assertion kind can ever return
`explorer_frequency` as its `recordKind`** — `evaluate` resolves every `explorer.*@v1` assertion
through `uniqueRecord(ledger.records, "explorer_position_census", fen)` and returns
`recordKind: "explorer_position_census"` unconditionally. So an `explorer_frequency` record can
never back a `corpus_observed` label through a binding, and the same dead alternative is mirrored
in `check.ts`'s map and in `expression-census.ts`. Harmless today (0 records of either kind) and
misleading the moment someone tries to pay the `corpus_observed` debt with the older record kind.
**Ledger row proposed, not claimed here.**

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

**The measured consequence, re-run for this round** `[V]` `[2026-08-16]`. The Q8 harness
(`tools/q8-feedback-surface-harness/q8.test.ts`, committed `a7d5569`) still runs unmodified against
the shipped `structuralReading` and its own mirror of `compare-strips.ts:19`/`:32`; it was re-run
over the current 50-pack corpus with **no measurement logic changed** (only its output path
redirected, because its last statement writes into the repo). Old figure → new figure:

| | draft (37 packs) | now (50 packs) |
|---|---|---|
| spine transitions | 634 | **754** |
| transitions with ≥1 strip entry | 633 = 99.8% | **753 = 99.9%** |
| total strip entries | 5,266 | **6,659** |
| mean / median / p95 / max entries per ply | 8.31 / 8 / 16 / 24 | **8.83 / 9 / 18 / 24** |
| quiet alternatives evaluated | 14,463 | **18,470** |
| quiet alternatives also gaining ≥1 (within-position mean) | 99.3% | **99.4454%** |
| …gaining one of the **same kind** | 90.4% | **91.9520%** |
| **lift** | 1.00546 ≈ 1.01× | **1.00424 ≈ 1.004×** |
| same-kind lift | 1.11× | **1.09×** |
| authored fork pairs / Jaccard median / median differing observations | 44 / 65.7% / 36 | **62 / 64.4% / 38** |

**Every column moved the wrong way.** The strip prints 26% more sentences and discriminates
slightly less well than when D78 was filed. This is the strongest available form of the defect: it
is not a stale measurement that a bigger corpus repaired, it is a property of the computation that a
bigger corpus re-confirmed. §6 criterion 5 measures CR1 against these numbers, not against the
draft's.

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
  pack-schema change (**the next free lane is `0.28`, and `rfc/graduation-clearance.md` is holding
  it; see §5.1**) *and* a **196-claim** authoring wave, and it would deliver **zero** claims until
  that wave completes. Q8's verdict is that the remedy is delivery, not authoring; spending a
  schema number and an authoring wave to deliver nothing today is the opposite trade. **This
  refusal is now much closer than it was** — see §2.2c's accepted cost and Open question 4.
  (**The hazard the draft recorded here is closed, and the closure strengthens C1's basis rather
  than changing it** `[V]` `[2026-08-16]`. The draft recorded that `$defs/feedbackClaim` was
  `"additionalProperties": true`, uniquely among the shapes this RFC touched, so a future anchor
  field would validate *silently and unchecked* — and that this is why §1.1(c) counted absence
  rather than reading it off the schema. `claim-backing` flipped it to `false` at pack 0.26, which
  is **D112** ✅. §1.1(c)'s measurement now agrees with a schema that can enforce it: the two
  observed key sets are exactly the two the `$def` permits, and an anchor field can no longer
  arrive unannounced. **The measurement is kept anyway** — a schema states what is permitted, and
  C1 rests on what was authored.)
- **Taken: deliver the claim only in the run state its lack of an anchor is compatible with —
  one where no authored decision is left for it to precede.**

#### 2.2 C1 — the delivery condition

*Rewritten twice: the draft's rule was unsafe, and cross-review's replacement was inert.*

##### 2.2a Why the draft's rule failed — and it failed on its own stated invariant

The draft rule was *"delivered only at a reveal occurrence whose attribution is
`{kind: "outcome", eventSeq}`"*, justified by the claim that **"an `outcome.reached` event exists
only after the run's decisions are made"** and therefore that consequence-before-verdict holds *by
construction*. **That premise is false in the shipped runtime, and the docs already say so.**

- **`outcome.reached` closes a node, not a run.** `docs/branch-runtime.md:137`: *"the persisted
  `outcome.reached` event, not move availability, closes **the node**."* `:116`: *"…creates a new
  node and therefore **a new outcome event for that
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
- **And the corpus claims name the answers.** Measured `[V]` `[2026-08-16]`: **123 of 196 claims
  contain a move or square token** (was 77 of 131 — the share is unchanged at 63% and the absolute
  exposure has grown by 60%), using the same SAN/square alternation the shipped `MACHINE_TOKEN`
  sweep uses (`claim-binding.ts`).
  `content/drafts/philidor-passive-rook-convert.json`'s `one-move-wins` reads *"In
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

##### 2.2b Why cross-review's replacement cannot ship as written — the outcome event barely exists in this corpus

Cross-review kept the draft's `outcome.reached` conjunct and added the exhaustion predicate beside
it. The predicate is right (§2.2c keeps it). **The conjunct is not, and the reason is measurable
from the packs rather than from learner behaviour.**

**`outcome.reached` is a chess-terminality event, not a session event.** `commitMove` emits it only
when `terminalOutcome(position, side, repetitions)` returns a value
(`packages/runtime/src/runtime.ts:345-350`), and `terminalOutcome`
(`packages/runtime/src/outcome.ts:5-16`) returns one only on `position.isEnd()` — checkmate or
stalemate — or on `halfmoves >= 100` or a threefold repetition. Objective resolution does **not**
emit it; `follow_theory` packs end at an authored boundary, not at a mate.

Re-measured for this round over the 50 committed claim-bearing packs by replaying every authored
spine line from `start.fen` with `chessops` `[V]` `[2026-08-16]`:

| | packs | claims |
|---|---|---|
| corpus | 50 | 196 |
| **has ≥1 chess-terminal spine leaf** — an outcome can be reached *by playing the authored line* | **6** | **24** (12.2%) |
| no terminal spine leaf — an outcome requires leaving the authored content and getting mated, stalemated, or shuffling to a 50-move draw | **44** | **172** |

The six are unchanged: `mate-bishop-knight`, `mate-k-q-technique`, `mate-k-r-technique`,
`mate-two-bishops`, `philidor-passive-rook-convert` and `trajectory-mate-bishop-knight`. **All six
leaves are checkmate; the corpus contains no stalemate leaf and no 50-move leaf**, so the four arms
of `terminalOutcome` reduce to one in practice.

**So the two halves of the reviewer's rule pull against each other, and the corpus has made the
argument stronger rather than weaker.** For **44 of 50** packs the only way to produce the required
occurrence is to *abandon or overshoot the authored content*, which is precisely the state the
exhaustion predicate then refuses. The conjunction is not merely strict; it is close to
contradictory for seven-eighths of the corpus, and it caps Job 1 at **12.2% of claims before any
learner is observed** — a ceiling that **fell from 18.3%** because all nineteen packs added since
the draft are opening or middlegame packs with no terminal leaf. A criterion-6 measurement of that
rule would report a near-zero share and would be reporting the corpus's shape, not the learners'.

**And the conjunct buys no safety.** Once every authored spine node has been reached, there is no
authored decision left for a claim to precede — that is the entire argument, and it does not
mention outcomes. The draft reached for `outcome.reached` because `design/05` §3a-i (`:105`) grants
it disclosure under every policy; but the sentence that grants it — *"a finished run has nothing
left to contaminate"* — is about **exhaustion**, and §2.2a proved the event is not exhaustion. The
honest move is to implement the sentence's meaning and drop the proxy.

##### 2.2c C1, as this RFC specifies it

> **C1.** A `feedbackClaims[]` entry is delivered only while the run satisfies **both** conditions,
> and is attributed to the run's **latest released reveal occurrence**:
>
> **(i) Authored exhaustion.** Every spine node id declared by the pack — the full authored tree,
> not a subset — has been reached by some node of the run, matched through the existing
> `spinePositionIndex` so a transposition counts as a reach. This is the operational reading of
> `design/05` §3a-i's *"a finished run has nothing left to contaminate"* (`:105`): nothing is left
> when no authored decision point remains undrilled.
>
> **(ii) Quiescence.** No `move.committed` and no `run.rewound` event follows the reveal occurrence
> being attributed. Claims are withdrawn from every surface the moment the learner resumes play,
> and are re-delivered only when (i) and (ii) hold again.
>
> **(iii) Attribution.** The item's `revealedBy` is the attribution of the latest `RevealEvent`
> that `revealEvents` produced for this run **and** `revealIsReleased` admits
> (`authored-feedback.ts:169`, `:94`). If no such occurrence exists, no claim is delivered. C1
> therefore adds **no new disclosure moment**: it adds an item kind to a moment the pack's
> `feedbackPolicy` has already opened, and it inherits the `stated_reasoning`-answered-first gate
> unchanged.

**(i) is the load-bearing half and (ii) is hygiene.** (ii) alone cannot restore the invariant — a
projection can be withdrawn but a learner's memory cannot, so a rule that only hides claims after
the fact protects nothing. (i) is what makes the disclosure sound: if every authored decision point
has already been played, there is no authored decision the claim can precede. (ii) then keeps the
*surface* consistent with the disclosure model — an attempt in progress shows no verdicts — and it
costs nothing.

**What changed from the reviewer's version, and why (i) got stricter rather than looser.**
Cross-review scoped coverage to `reachableAuthoredSpineIds(pack.document)`
(`packages/schema/src/drill-pack/lint.ts:49-72`). Read at the symbol, that function returns *the
union of the ancestor chains of the pack's checkpoint anchors* — and returns the whole spine only
when some checkpoint uses a trigger that is neither `atSpineNode` nor `atAuthoredBoundary` (`:61`).
That is narrower than the object being protected, and the gap is not hypothetical: **re-measured
over the 50-pack corpus for this round, the finding reproduces exactly** — **5 of 50 claim-bearing
packs (holding 21 of 196 claims) have a nonempty difference, and all 50 use `atSpineNode` triggers
only, so none short-circuits to the whole spine** `[V]` `[2026-08-16]`. The checkpoint-chain set
omits **exactly the mating leaf** in four packs —
`mate-bishop-knight`'s `p39-bf6` (38 of 39 spine nodes), `mate-k-q-technique`'s `w-qe8-mate`
(18 of 19), `mate-k-r-technique`'s `w-ra8-mate` (18 of 19), `mate-two-bishops`'s `w-bd4-mate`
(16 of 17) — and omits three nodes of `carlsbad-minority-attack` (`h6-wait`, `bxc6-consequence`,
`bxc6-recapture`; 15 of 18). Note the asymmetry the re-measurement surfaced and the draft did not:
terminal-leaf presence and reachability coverage are **independent** in this corpus —
`philidor-passive-rook-convert` and `trajectory-mate-bishop-knight` both have a mating leaf and both
keep it reachable, so the four-pack hole is a fact about where checkpoints were authored, not about
mates. Under the reviewer's scoping, a learner one move from mate satisfies
"coverage" and is handed `mate-bishop-knight`'s `stalemate-is-the-default` claim, which describes
exactly that final decision. **A pack-wide anchorless claim earns pack-wide exhaustion**; anything
less re-opens §2.2a's hole one node further along.

**Accepted cost, re-measured for this round rather than carried forward** `[V]` `[2026-08-16]`.
Full-spine exhaustion means every authored variation must be played, which is the product's own loop
(commit → rewind → branch → replay), not an exotic demand. Its distribution over the 50
claim-bearing packs, with the draft's 37-pack figures beside it:

| | packs | claims | was (37 packs) |
|---|---|---|---|
| single authored line — one uninterrupted playthrough exhausts the pack | **19** | **73** | 19 / 73 |
| branches only at **learner-turn** nodes — exhaustible by the learner alone, via rewind and branch | **14** | **56** | 7 / 20 |
| at least one **opponent-turn** branch point — the learner cannot force the opponent to play the sibling reply | **17** | **67** | 11 / 38 |

19 + 14 + 17 = 50 packs; 73 + 56 + 67 = 196 claims `[V]`. **The single-line class is frozen at
exactly the same 19 packs and 73 claims** — every one of the nineteen packs added since the draft
branches — and the split of the new work is 7 learner-only against 6 opponent-turn.

So **33 of 50 packs (129 of 196 claims, 65.8%) are exhaustible by learner action alone**, against
the draft's 26 of 37 (93 of 131, 71.0%). **The share fell by five points as the corpus grew**, which
is the direction that matters for criterion 6: the remaining 17 packs depend on the opponent policy
producing each authored reply across attempts within one run. That is a real limit, it is stated
here rather than discovered in the harness, and criterion 6 reports the populations separately.
**If the opponent-branch packs turn out to be the binding constraint, the answer is Open question
4's anchor — not a weaker predicate.** Spine size across the same 50 packs, because the cost is a
function of it: **min 5, median 12, max 64, 754 nodes total, mean 15.1** `[V]`.

**The mechanism is one set comparison away from code that already exists.**
`projectAuthoredFeedback` already builds the full spine index at `:256-257` (`indexSpine` over
`pack.document.spine`) and already maps run nodes to spine ids through `spinePositionIndex`
(`:259`, `spineNodeIdFor` at `:262-264`). (i) is `[...spine.keys()].every(id => runSpineIds.has(id))`
over *all* run nodes rather than outcome paths only. (iii) reuses `revealEvents`/`revealIsReleased`
verbatim. **No new I/O, no new event, no new index, no new import.**

- **The occurrence machinery is untouched.** `revealEvents` (`authored-feedback.ts:169`) already
  emits an outcome-attributed `RevealEvent` for every `outcome.reached` under *both* policy
  branches (`:170-178`, folded into both returns at `:194` and `:225`), and checkpoint- or
  segment-attributed events under the policy that owns them. C1 adds a source and a gate, not an
  occurrence.
- **The negative case is unchanged and still the reason.** Revealing pack-wide claims at the
  *first* checkpoint would disclose commentary about decisions the learner has not yet made —
  precisely what `projectPackDocument`'s strip exists to prevent (§1.1d). C1 forbids that through
  (i), which is the condition that actually distinguishes the two cases, rather than through a ban
  on checkpoint attributions that a mating stalemate walks straight around.
- **Group seeding is covered by (i) rather than by a special case.** `Service.createGroup`
  (`apps/server/src/service.ts:779-889`) commits N seed moves inside one run and parks the cursor on
  member 0's leaf (`:888`). Under (i) a seeded run discloses nothing until the authored tree is
  covered — and where a seed *does* cover it, every authored move has by then been played onto the
  board in front of the learner. Criterion 1a(c) tests the behaviour, not the coincidence.

#### 2.3 C2 — the anchored path stays, and stays preferred

> **C2.** A claim referenced by a `stated_reasoning` key point ground
> (`{kind:"claim", claimId}`, `$defs/reasoningKeyPoint`) continues to be delivered at that
> checkpoint by `keyPointViews` (`apps/server/src/reasoning.ts:64-65`) under the existing
> `reasoningDeliveryOpen` gate (`:71`). **This RFC changes nothing on that path.** A claim
> delivered by C2 is still also delivered by C1 once the run satisfies C1's predicate; the sheet is
> a distinct surface and re-reading a claim already seen is not a disclosure violation.

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
- **The volume is not census volume.** Median **4** claims per pack, max **7** (§1.1c), delivered
  **once per run at its end**. The strip prints **8.83 entries per ply** (§1.3). Over the corpus's
  median 12-node spine these differ by more than two orders of magnitude; treating them with one
  rule would be arithmetic theatre. Both figures are `[2026-08-16]` and both moved *up* since the
  draft, in the same direction and by nowhere near the same factor.

#### 2.5 C4 — the item shape

`AuthoredFeedbackItem` (`apps/server/src/authored-feedback.ts:29`) gains a fifth arm, mirrored into
`apps/web/src/lib/api.ts:180`'s copy of the union:

```ts
| {
    readonly kind: "claim";
    readonly id: string;                        // `claim#<claimId>`
    readonly revealedBy: RevealAttribution;     // the latest released occurrence (C1 (iii))
    readonly anchor: { readonly claimId: string };
    readonly text: string;
    readonly evidenceTypes: readonly string[];  // verbatim from the pack
    readonly binding: "ledger_bound" | "author_attributed" | "self_declared";
    readonly authorSpans: readonly string[];    // author-attributed segments, verbatim
    readonly principles: readonly {
      readonly id: string; readonly name: string; readonly statement: string;
      readonly standsOn: string; readonly counterCase: string;
    }[];
  }
```

**`binding` is three-valued, and this is the one shape change `claim-backing` asks of this RFC —
D167, and it is not optional.** The draft's two-valued field would render a **mixed** claim — one
bound percentage plus an appended authored verdict — as `ledger_bound`, indistinguishable from a
claim every word of which is a re-derived instrument reading. *"The bound number buys the badge and
the verdict rides in under it"* is the owner's own test of the routing ruling, and a two-valued
field fails it. The three values are **not computed here**: they are read verbatim from
`PackRecord.claimBackings.get(claimId).binding`, which already ships
(`apps/server/src/pack-registry.ts`) and whose `ledger_bound` / `author_attributed` split comes
from `validateClaimBindings`'s `disposition` — `ledger_bound` iff **every** segment is
instrument-attributed. `authorSpans` and `principles` are likewise read from the same record.
**This RFC computes none of it and adds no new I/O; it plumbs an already-projected value onto an
item.** §2.6 C5(4) states the one case the shipped projection does not cover.

`KIND_ORDER` (`:112`) gains `claim: 4`, after `theory_verdict`, so claim prose sorts last within an
occurrence — an author's judgement is the last thing said, beneath the derived facts, which is the
ladder's own ordering (rung 5 sits above rungs 0–4 in *what it can get wrong*).

`binding` is not decoration: it is the rendered provenance (§3.4) and it is the only field a
learner-facing surface may use to distinguish *the author says* from *the author says and a record
agrees* from *the author says both, in the same sentence, and here is which half is which*.

#### 2.6 C5 — where the mechanism goes, and what it costs

Three edits, none of which introduce a new data source:

1. **`nodeSources` is not the site.** Claims have no node. `projectAuthoredFeedback` gains a
   separate claim pass **after** its reveal loop (`:277-359`), gated on C1's predicate and
   attributed to the last reveal the loop admitted, adding `claim#<id>` entries to the same
   `revealed` map and therefore inheriting deduplication, freezing, ordering and `revealedBy`
   attribution unchanged. Running it after the loop rather than inside it is what makes (iii)
   one line: the loop has already established which occurrences `revealIsReleased` admits.
2. **`deliverable` (`:268`) gains the admitted claim ids** (§3.2), so
   `hasWithheldAuthoredContent` (`:369`) keeps its meaning. Note the practical
   consequence C1's exhaustion predicate creates: an admitted claim is in `deliverable` from the
   first request but is not `revealed` until §2.2c (i) and (ii) both hold, so
   `hasWithheldAuthoredContent` reads `true` for the whole of any run that never satisfies the
   predicate. The flag's *literal* meaning ("deliverable material exists that you have not been
   shown") is preserved and correct; its *discriminating value* drops, because every pack carries
   at least 2 claims (§1.1c). Criterion 4 is extended to record how often the flag is true at run
   end before and after, so the degradation is measured rather than assumed harmless.
3. **`revealIsReleased` (`:94`) is not modified.** The `stated_reasoning`-must-be-answered-first
   gate applies to the reveal occurrence, not to the item kind, so claims inherit it for free.
4. **The one case `claimBackings` does not cover, and it is a third of the admitted set.**
   `pack-registry.ts` writes a `claimBackings` entry in exactly two cases: a validating binding
   exists, **or** the claim carries `author_principle` and no machine-checkable label. Measured
   `[V]` `[2026-08-16]`: **31 of 196 claims carry `derived_feature` and nothing else** — 11,256
   characters, **18.3% of all claim prose, and 32% of the 98 claims C6 admits at day zero** — and
   they fall through **both** arms, so `claimBackings.get(id)` is `undefined` for them. C4 therefore
   specifies the default explicitly rather than letting the projection decide by accident:
   **a claim with no `claimBackings` entry is delivered with `binding: "self_declared"`, empty
   `authorSpans` and empty `principles`.** That is the correct value — the claim carries no
   machine-checkable label, so C6 admits it, and no record is attached — but it is the value of a
   *missing map entry*, which is exactly how a fail-open bug is written. Criterion 3 tests it in
   both directions and criterion 18 pins the count.
   *(The narrower question — whether a claim whose only label is the rung-0 `derived_feature` should
   carry `author_principle` too, and therefore a principle reference — is an **authoring** question
   about 31 claims, not a delivery question, and this RFC does not take it. Ledger row proposed.)*

**Cost: no new I/O, no new event, no new table, no new endpoint.** `GET /runs/:id/authored-feedback`
(`apps/server/src/rest.ts:1010`) returns a longer `items` array of the same shape.

### 3. The unbacked evidence labels — the answer is delivery, and the debt is now payable

The task on this RFC was to say whether the fix is authoring, format, or delivery, and to verify
rather than assume. **It is delivery, and `rfc/archive/claim-backing.md` has since made the other
two tractable rather than impossible.** This section is rewritten for the author round: everything
the draft recorded about a forbidden attach path is superseded by §1.2, and what remains is a
measured residue.

#### 3.1 Ruling out the other two, with evidence

**Not format.** The requirement is correct and must stay. `design/05:76` is the reason and it is
design tier: rung 5 is *"an author's judgement … with no review workflow (owner ruling 2026-08-13)
**provenance is the only safeguard**"*. Deleting the machine-checkable labels, or downgrading them
to self-declared, would remove the only safeguard the ladder grants the rung. And the labels are
the *"claims carry evidence refs + uncertainty"* artefact `planning/exploration/plan.md:209` names
as the alternative to the dashboard. **The format argument is now stronger than the draft could make
it**: `claim-backing` gave rung 5 an actual floor — `author_principle` resolves against
`content/principles/` (`pack-validation.ts`, `CLAIM_PRINCIPLE_MISSING` / `CLAIM_PRINCIPLE_UNKNOWN`
at **error**, `CLAIM_PRINCIPLE_OFF_PHASE` at warning), and every registry entry carries a required
non-empty **`counterCase`** (`schemas/principle_entry.schema.json`, `required` includes it; **D165**
✅). So the self-declared half is no longer an unchecked enum member.

**Not authoring — or rather, not authoring *first*.** Binding the labels today would change
**nothing a learner sees**, because 0 of 196 claims are delivered. The binding wave is real work
with real value; it is not the fix for the labels, because the labels' failure is not that they are
unbacked in a file — it is that nothing has ever asked them a question at the moment they matter.

> **The draft's account of the binding wave — *"cheap and shipped"*, then *"impossible"* — was
> wrong in both directions, and the corrected account is the third one.** The draft cited
> `make candidate-attach … --target /feedbackClaims/<i>/text` as an attach path; cross-review found
> it *substituted* rather than attached (`explorer.ts` assigning
> `pack.feedbackClaims[claimIndex].text = renderExplorerFrequency(values)`), and that the validator
> *forbade* a prose-preserving path. **Both are now false in the tree** (§1.2a). `attachExplorerEvidence`
> makes no assignment into the pack at all and refuses without `--span`/`--field`, with the
> invariant written into the error message: *"pack prose is never generated or overwritten"*. The
> wave is neither free nor forbidden. It is a wave, and §3.2 prices it.

**Delivery, and here is the verification Q8 only implied.** The `EVIDENCE_TYPE_UNBACKED` check
(`evidenceSupports`, `apps/server/src/sourcing/check.ts`) runs in `sourcing-check`, a CLI over pack
files. Its severity escalates to `error` on `provenance.reviewStatus === "published"` and no pack is
published, so it warns. Meanwhile the *only* code path that can put a label in front of a learner is
`reasoning.ts`'s `keyPointViews`, which interpolates `claim.evidenceTypes.join(", ")` **without
consulting the ledger at all** — and which **0 of 201 checkpoints** reach (§1.1b). So: **the labels
are checked in a file that never ships them and unchecked on the one surface that would.** Q8's
implication is confirmed, and the sharp version of it is that binding was never load-bearing because
nothing ever loaded it.

#### 3.2 C6 — delivery-gated binding, restated against the shipped predicate

> **C6.** A claim is **admitted to delivery** only if every label in its `evidenceTypes` that
> appears in the machine-checkable map (`MACHINE_LABELS`, `apps/server/src/sourcing/claim-binding.ts`
> — `corpus_observed`, `engine_validated`, `tablebase_exact`) is **backed** in the sense of
> `rfc/archive/claim-backing.md` §3.9: the pack's evidence ledger holds a `claimBindings` entry for
> that claim whose `spans` include at least one **instrument** span whose assertion resolves from a
> record of the label's mapped kind, **and the binding validates in full**. A claim with no
> machine-checkable label is admitted. **A claim that is not admitted is withheld, is never returned
> by any surface, and is NOT counted in `hasWithheldAuthoredContent`** — it is not deliverable by
> any occurrence, and a flag that promises content which can never arrive is a lie about the run.
>
> The admission predicate is **read, not recomputed**: it is `PackRecord.boundClaimIds`
> (`apps/server/src/pack-registry.ts`), which already ships. The delivered `binding` value is
> `PackRecord.claimBackings.get(claimId)?.binding ?? "self_declared"` (§2.6 C5(4)).

**What changed from the draft, and it is the whole of Open question 1.** The draft could not settle
C6 because withholding was not deferral — 37 claims could never earn admission, so "withhold" meant
"delete with a rule attached". The owner refused all three of the draft's options on 2026-08-15
(*"why not fix them properly?"*) and `claim-backing` §6 **retained C6 and withdrew C6′ and C6″**.
**Both alternatives are struck from this document.** Their measured effects (106/78.2% and
107/79.1%) were arguments for softening a permanent refusal, and there is no longer a permanent
refusal to soften.

**Why C6 is the right shape and not merely a strict one.** Once C1 ships, an unbacked
`corpus_observed` label is no longer a note in a file: it is a **false provenance statement shown to
a learner** about a corpus query that no record supports. The dossier §6's worked example is the
exact hazard — a claim reading *"the position after 3.Bc4 was reached 44,467,486 times … White
scores 50.1% against 45.9%"*, labelled `corpus_observed`, whose sidecar's real records support
`/start/fen` and not the claim text. *"The author ran the query, typed the number, and the ledger
never learned about it."* **C6 is what makes `sourcing-check` a refusal rather than a lint.**

**Measured effect, today, with zero authoring** `[V]` `[2026-08-16]`, recomputed over
`content/drafts/` and cross-checked against `make expression-census`:

| | count | claim chars |
|---|---|---|
| claims total | **196** | 61,531 |
| admitted — no machine-checkable label, or backed | **98** | **26,735** (43.4%) |
| — of which `ledger_bound` or `author_attributed` (a validating binding exists) | **1** | 262 |
| — of which `self_declared` | **97** | 26,473 |
| withheld — an unbacked machine-checkable label | **98** | 34,796 |
| claims deliverable before this RFC | **0** | 0 |

**Read the day-zero split honestly: it is 50/50, and it is drifting the wrong way.** At `d2f34f9`
the split was 70/61 (53.4% of claims, 49.0% of prose). It is now 98/98 — **50.0% of claims and
43.4% of prose** — because every grounding wave since has added `corpus_observed` claims, which land
on the withheld side until the explorer records exist. *An honest authoring wave lowers the
delivered share.* That is not an argument against C6; it is the argument for landing the binding
wave beside it.

##### The residue, per class, named at the shipped checker rather than at intent

**This is the section the author round exists to produce.** For each machine-checkable class:
can `claimBindings` carry it, and if it is not carried today, why — stated as a refusal code or a
missing record, never as an intention.

| class | claims | withheld | packs | can `claimBindings` carry it? |
|---|---|---|---|---|
| `tablebase_exact` | **37** | **36** | 12 | **Yes, and it is proven in the corpus.** One claim is bound today through four assertion kinds |
| `engine_validated` | **8** | **8** | 3 | **Yes, for centipawn and depth readings only** — those are the two registered engine assertions |
| `corpus_observed` | **60** | **60** | 31 | **Yes in principle, no claim today** — the assertion kinds exist and the emitter exists; **the records do not** |
| `author_principle` | **82** | n/a | 35 | **Not applicable, and that is the answer** — it is self-declared and resolves against the registry, not the ledger |

**`tablebase_exact` — 37 claims / 12 packs / 1 bound / 36 withheld (9,516 chars).** The path works:
`philidor-third-rank-hold`'s `philidor-is-drawn` binds `draw`, `five`, `drawn` and `lost` through
`tablebase.category@v1`, `tablebase.pieceCount@v1`, `tablebase.lineUniformCategory@v1` and
`tablebase.moveCategory@v1`, against `tablebase_result` records already in its own ledger, with the
sentence unchanged. The reasons the other 36 are not bound, at the checker:
- **`CLAIM_CENSUS_INCOMPLETE`** (`claim-binding.ts`, in the `tablebase.moveCensus@v1` /
  `tablebase.uniqueMoveOfCategory@v1` branch). Both kinds require a `tablebase_result` record for
  **every legal successor** of the asserted FEN and refuse with a count when any is missing. The 12
  tablebase packs hold **341 records anchored at authored positions**, not at legal-move
  enumerations — which is **D110** stated as a refusal code. Every claim of the form *"nine win,
  nine draw, and eight of those nine draws are stalemate"* needs a census run first.
- **`CLAIM_FEN_OFF_PACK`.** An assertion's FEN must lie in `positions(pack).reached` — the spine
  positions **plus exactly one ply of legal successors**. A claim about a position two plies off the
  authored tree is refused whatever records exist.
- **No cross-ledger resolution.** `evaluate` reads `ledger.records` only, by construction (*"a
  validator that re-queries is a second instrument"*), so
  `philidor-passive-rook-convert/sibling-drill` — which cites *"the deviation that pack queries as a
  loss"* — cannot bind without copying the record into this pack's ledger. That is an authoring fix,
  not a tooling one.
- **Not a blocker, and worth recording so the wave does not chase it:** `uniqueRecord` refuses when
  **more than one** record of a kind matches a FEN. Measured across all 12 tablebase packs:
  **0 ambiguous FENs** `[V]`. Same for the engine packs.
**Verdict: payable by a tablebase-census wave** — cheap, repeatable, already wired through
`verifySyzygyDraft` / `make tablebase-walk` — **plus two authoring fixes.**

**`engine_validated` — 8 claims / 3 packs / 0 bound (2,279 chars).** Two registered assertions:
`engine.centipawns@v1` and `engine.depth@v1`. The ledgers are not the blocker — the corpus holds
**391 `engine_eval` records** and the three packs concerned have **0 ambiguous FENs** `[V]`. Three
real constraints:
- **`normalizes` is exact.** A centipawn span must equal `(value/100).toFixed(2)` after stripping a
  leading `+`. So *"+0.66"* binds and *"0.7"*, *"two-thirds of a pawn"* and *"about two thirds"* do
  not. This is a **prose** constraint, and the wave will hit it before it hits any tooling limit.
- **A comparison needs one record per position.** *"…the best of the five second moves measured, at
  +0.66 against +0.01 for 2.e5 and −1.06 for 2.Nf3"* binds only if a unique `engine_eval` record
  exists at each of those successor FENs.
- **1 of the 8 is in a pack with no evidence ledger at all** (`maroczy-bind-white-squeeze`), so its
  debt is a sourcing run plus a ledger, not a query.
**Verdict: payable, and the binding constraint is authored wording rather than records.**

**`corpus_observed` — 60 claims / 31 packs / 0 bound (24,764 chars). The largest residue, and the
only class with a structural reason it cannot bind *today*.** Not a contract refusal — a missing
record kind in the corpus:
- **`CLAIM_ASSERTION_UNRECORDED` for all 60.** `evaluate` resolves every `explorer.*@v1` assertion
  through `uniqueRecord(ledger.records, "explorer_position_census", fen)`, and the corpus holds
  **0 records of that kind, and 0 of `explorer_frequency`** — 764 records split
  `engine_eval` 391 / `tablebase_result` 341 / `position_legality` 32 `[V]`.
- **The emitter exists**, so this is a wave rather than a specification: `explorer.ts` writes
  `kind: "explorer_position_census"` records, and `check.ts` validates their shape
  (`EVIDENCE_VALUES_INVALID`, *"explorer_position_census requires the exact census shape and derived
  move shares"*).
- **38 of the 60 sit in 15 packs with no `.evidence.json` at all** `[V]` — `berlin-queenless-press`,
  `carlsbad-minority-attack`, `dragon-yugoslav-race`, `french-advance-chain-white`,
  `grunfeld-exchange-fianchetto`, `iqp-black-tarrasch-defence`, `iqp-white-panov-attack`,
  `kid-mar-del-plata-white`, `maroczy-bind-white-squeeze`, `nimzo-doubled-c-pawns`,
  `open-centre-ruy-exchange` and the three uncommitted-then-committed centre packs among them. For
  those the debt is **a sourcing run plus a ledger plus a binding**, which is `claim-backing`'s D128
  and is a materially different cost from *"the query was never recorded"*. C7's empty-set default
  fails them closed correctly.
- **One coupling nobody owns yet.** `RECORDED_READING_DISPOSITIONS`
  (`apps/server/src/position-evidence.ts`) still records `explorer_position_census` as
  `disposition: "refused"`, reason *"No loadable pack producer emits this position-census record
  kind"* — a **corpus fact frozen as a runtime disposition**. It is true today and becomes false the
  moment the wave runs, and `assertRecordedReadingDispositions` will not catch it because the table
  is complete either way. Recorded here; **ledger row proposed, not claimed.**
**Verdict: payable, and it is the biggest single wave in the corpus.**

**`author_principle` — 82 claims across 35 packs, resolving to 12 of the 13 shipped registry
entries** `[V]`. **`claimBindings` neither carries nor needs to carry this class**, and saying so
precisely matters because it is the largest label in the corpus:
- It is **self-declared by design** and is absent from `MACHINE_LABELS`, so C6 never withholds on
  it.
- Its safeguard is the registry, checked at **pack validation** rather than in the ledger:
  `pack-validation.ts` raises `CLAIM_PRINCIPLE_MISSING` when `author_principle` is carried without a
  `principles` reference and `CLAIM_PRINCIPLE_UNKNOWN` when the id does not resolve, **both at
  error**. Measured: **all 82 carry exactly one reference and all 82 resolve** `[V]`. The one
  unreferenced entry is `activity-has-a-price`.
- Its delivery-side payload is projected at registration, not during a run:
  `pack-registry.ts` writes `{id, name, statement, standsOn, counterCase}` rows into
  `claimBackings`, which is what C8's third provenance line renders.
- **16 of the 82 also carry a machine-checkable label** `[V]`. Those sixteen are exactly the
  population the three-valued `binding` exists for (§2.5), and today **1 of the 16 is bound**.
- Where `claimBindings` *does* touch this class, it does so as a **refusal, not a carrier**:
  `CLAIM_AUTHOR_LABEL_REQUIRED` fires when a validating binding leaves an author-attributed segment
  and the claim does **not** carry `author_principle`.
**Verdict: carried, but by the registry rather than the ledger — and it is already at 100%.**

#### 3.3 C7 — where binding is computed, and it has already shipped

> **C7.** `PackRecord` (`apps/server/src/pack-registry.ts`) carries
> `readonly boundClaimIds: ReadonlySet<string>` and
> `readonly claimBackings: ReadonlyMap<string, {binding, rendered, authorSpans, principles}>`,
> computed at registration in the same block that computes `assessmentGrounding`, from the
> already-loaded ledger via `validateClaimBindings`. Packs registered without a ledger — studio
> drafts and the two fallback constructions, which already default
> `assessmentGrounding: "unverified"` — get an **empty set and an empty map**, so an unbacked label
> **fails closed**.

**This is now a description rather than a proposal.** `claim-backing` implemented C7 ahead of the
RFC that specified it, and the shipped shape is *wider* than the draft asked for: the draft wanted
one derived set, and the tree carries the set plus a per-claim record with the rendered instrument
sentences, the author-attributed spans and the resolved principle rows. **This RFC therefore adds no
field to `PackRecord` and no computation at registration.** What it must do is (a) consume the map,
(b) specify the default for the 31 claims the map has no entry for (§2.6 C5(4)), and (c) keep the
fail-closed property under test (criterion 3). The precedent the draft cited — `assessmentGrounding`
as a ledger-derived field attached at load — is now the pattern this follows rather than the one it
imitates.

#### 3.4 C8 — what a learner actually reads

> **C8.** A delivered claim renders as the author's sentence plus one provenance line, and the
> provenance line states the labels and the binding without grading either:
>
> - `binding: "ledger_bound"` → *"Author's claim. Evidence recorded for: `<labels>`."*
> - `binding: "author_attributed"` → *"Author's claim. Evidence recorded for: `<labels>`. The rest
>   is the author's judgement, resting on: `<principle name>` — `<statement>`. It can be wrong when:
>   `<counterCase>`."*
> - `binding: "self_declared"` → *"Author's claim, author-declared: `<labels>`. No machine record is
>   attached."* Where the claim carries `author_principle`, the principle clause of the second form
>   is appended, because the registry row is projected for it too.
>
> No sentence may say the claim is true, correct, strong, verified-as-good, or better than an
> alternative. The vocabulary floor is `BANNED_JUDGEMENTS` (`packages/runtime/src/voice.ts`); the
> ceiling is law 8 / ADR-0005. **All three forms are frozen templates over projected values — no
> LLM writes any part of them.**

**The third form is `claim-backing`'s ask and it is what makes the principle registry worth its
migration.** Without it, `author_principle` is a validator artifact a learner never sees; with it, a
learner reading an authored verdict is handed the general rule it rests on **and the case in which
that rule fails**. It is the same move `renderEndgameReading` makes with *"Technique entries: none
in Tabiya's index."* (`packages/runtime/src/endgame.ts:46`): state the basis, state the absence,
grade nothing.

**The second form is the important one for volume, because almost every admitted claim takes it
today** — **97 of the 98** admitted claims are `self_declared` (§3.2), so *"No machine record is
attached"* is what a learner reads on all but one claim at day zero. That is the axis Q8 says we win
on, and C8 keeps winning it while shipping more prose than zero.

Surfaces: `apps/web/src/lib/TerminalSheet.svelte` (the `{#each authoredItems}` arm chain, `:47-51`)
gains a `claim` branch, and `apps/web/src/lib/CheckpointSheet.svelte` gains the same branch. **Both
are real surfaces, not exhaustiveness padding**: C1 (iii) attributes claims to whichever released
occurrence is latest, which is a checkpoint occurrence in any pack whose authored tree is exhausted
before a chess-terminal position — **44 of 50 packs** (§2.2b). The arm is also **not optional**:
both chains end in a bare `{:else}` that renders `theoryVerdictSentence`, so a fifth kind without a
branch would be rendered as a theory verdict rather than skipped.

#### 3.5 C9 — a claim is excluded from the evidence packet, `/voice` and `/speech`

> **C9.** `authoredText` (`apps/server/src/guidance.ts`) returns `undefined` for
> `item.kind === "claim"`, exactly as it already does for `theory_verdict` (the function has three
> `if` arms and a bare `return undefined`, so a fifth union arm is excluded by default — the change
> is to keep it that way and to pin it). A claim reaches a learner **only** through the two sheets'
> rendered `claim` branch. Criterion 15 pins it.

**Kept from cross-review in full, promoted from correct to load-bearing by `claim-backing`, and
re-measured for this round.** The exclusion is airtight in the direction that matters:
`evidencePacket` is the *only* constructor of an `EvidencePacket`, `authoredText` is the *only* path
from an `AuthoredFeedbackItem` into `packet.authored` and `packet.sentences`, and `voiceCheck` reads
nothing but `packet.sentences`. With `authoredText` silent on `claim`, no claim word can enter the
allow-list by any route this RFC touches.

The draft proposed the opposite — adding `if (item.kind === "claim") return item.text;` — and it
was wrong twice, in ways the corpus has since made worse:

1. **It breaks C1.** `evidencePacket` consumes `input.authored.items` **unfiltered** — no occurrence
   filter, no node filter — and is handed the whole-run page at `rest.ts` for whatever `nodeId` the
   request names. A claim revealed at any occurrence would ride into every subsequent
   `POST /runs/:id/voice` and `/speech` at every later ply, under scopes `marker`, `reading`,
   `steering` and `story`. C1's quiescence clause narrows this and does not close it, which is why
   exclusion rather than filtering is the rule. (`scope: "compare"` already blanks `authored` at
   `rest.ts` — the one place the existing code got this right.)
2. **`voiceCheck` fences the renderer *against* the packet, so widening the packet widens the
   renderer's licence — the fence runs the other way.** `voiceCheck(packet, output)` computes
   `source = packet.sentences.join("\n")` and permits a word in LLM output **iff** it appears in
   `source`. And `evidencePacket` already folds authored items into `sentences` as
   `` `${item.text} (${item.attribution})` `` — so **authored prose does not merely bypass the
   guard, it widens it.**

   Re-measured over all 196 claims with the shipped word lists `[V]` `[2026-08-16]`:
   **66 contain a `BANNED_JUDGEMENTS` word** (39 of 50 packs) and **117 contain a
   `PRESCRIPTIVE_VERBS` word** (44 of 50 packs); **136 contain a word from either list**. The
   draft measured 44 and 75 over 131. Per-word: `wins` 24, `winning` 17, `must` 6, `better` 4,
   `good` 4, `loses` 3, `best` 2, `worse` 2, `bad` 2, `mistake` 2, `advantage` 2, plus
   `worst`/`strongest`/`punish`/`should`/`accurate`. Restricted to the unambiguously judgemental
   words (`wins`, `winning`, `must`, `best`, `mistake`, `punish`, `should`), **51 claims** still
   match. Routing claim text into the packet would hand the renderer permission to say *"winning"*,
   *"mistake"* and *"punish"*, and to name moves, at positions the author never wrote about. That is
   **law 8 / ADR-0005** arriving through the exact door §2.1 refused to open by inference.

**Quieter is correct here.** The claim is rung-5 authored prose with no anchor; the packet is the
rung-6 renderer's evidence base. `claim-backing` §3.11 asks explicitly that C9 not be weakened, and
states the successor rule for whoever widens the packet later: **instrument-attributed segments
only**, which `validateClaimBindings`'s segment cut is the first thing in this repository able to
identify.

#### 3.6 Two live holes this RFC leans on, both found 2026-08-16, neither claimed here

**Both are `claim-backing`'s to fix or a successor's; this RFC records them because C6 and C8 rest
on them and a reader must not infer a guarantee neither guard supplies.**

**(a) [[D417]] — the rate refusal is decimal-only, so an integer percentage routes as authored
judgement.** `claim-backing` §3.4a step 3(3) refuses a **rate** inside an author-attributed segment
and says *"no label lifts it"*, on the asymmetry that **a rate hides its denominator and a count
carries it**. The shipped guard is `RATE_TOKEN = /(?:[+-]?\d+\.\d+%?)/`
(`apps/server/src/sourcing/claim-binding.ts`), raised at `CLAIM_READING_UNATTRIBUTED`. It requires a
literal decimal point between two digit runs. Probed against the shipped validator `[V]`:

| span | raised |
|---|---|
| *"f5 scores 90.9% for White"* | `CLAIM_READING_UNATTRIBUTED` |
| ***"f5 scores 91% for White"*** | **nothing** |
| *"f5 scores ninety-one percent"* | nothing |
| *"reached 44,467,486 times"* | nothing |

**And the escape is not caught by the second net.** `CLAIM_ASSERTION_UNDECLARED` sweeps
`MACHINE_TOKEN` over the *remainder*, and the remainder has already had every declared span removed
— **including `authored: true` spans**. So an author who declares *"f5 scores 91%"* as an authored
span passes the sweep (nothing left to sweep), passes `RATE_TOKEN` (no decimal), and the claim
validates clean with `disposition: "author_attributed"`. The existing test
(`claim-binding.test.ts`) pins the decimal form exactly; changing `90.9%` to `91%` in that fixture
makes the assertion fail.

**Why it bears on this RFC.** C8's `author_attributed` line reads *"The rest is the author's
judgement…"* — which is a **true sentence about a laundered measurement** in exactly the case D166
says must be refused. The corpus already contains the shape: `anti-scandinavian-white`'s
`just-take-it`, labelled `corpus_observed, engine_validated`, reads *"2.exd5 is played in **74%** of
games at band and is the **best** of the five second moves measured…"* — an integer percentage
`RATE_TOKEN` cannot see, in a claim that also carries two `BANNED_JUDGEMENTS` words. **This RFC does
not widen the guard** (that is a `claim-backing` successor's change to a frozen table) and it does
not narrow C8. What it does is refuse to *claim* the guarantee: **§6 criterion 19 asserts the hole
rather than asserting its absence**, so the day D417 is fixed the criterion changes with it instead
of silently having been wrong.

**(b) [[D421]] — `BANNED_JUDGEMENTS` is enforced only over LLM output, so authored prose has no gate
at all.** Verified exhaustively `[V]`: `voiceCheck` is a **containment** test over LLM output;
`PRESCRIPTIVE_VERBS` has exactly three occurrences repo-wide (definition, that one use, and a
re-export) and **is applied to authored content nowhere**; `BANNED_JUDGEMENTS`'s only non-voice
consumer is `KEY_POINT_JUDGEMENTS` (`pack-validation.ts`), which fires only on
`checkpoint.interaction.keyPoints[].phrases`, only when **every** word in the phrase is listed, and
only at **warning**. `check.ts`, `lint.ts`, `pack-check` and `pack-validation`'s per-claim loop
contain no vocabulary rule over `feedbackClaims[].text`.

**Why it bears on this RFC.** C8's floor sentence — *"the vocabulary floor is `BANNED_JUDGEMENTS`"*
— is **true of the three frozen provenance lines this RFC writes** (they interpolate labels,
principle fields and nothing else) and is **false of the authored sentence they sit beside**, which
is 66 claims deep in judgement vocabulary. Those are two different objects and the draft's wording
allowed them to be read as one. **C8 is amended above to say "all three forms are frozen templates";
the author's sentence is rung 5 and is protected by provenance, not by vocabulary** — which is
`design/05:76`'s own construction. D421's general fix (a gate over authored surfaces) is larger than
this RFC and is not claimed here; criterion 20 pins the narrow half — that the provenance lines
themselves contain no `BANNED_JUDGEMENTS` word.

### 4. Job 2 — the change rule for the comparison structure strip

#### 4.1 The rule

> **CR1 — admission by between-column difference.** In a comparison of **N ≥ 2** columns, let
> `pathObservations(X)` be the set of structural observation identities occurring at any node on
> column `X`'s path **strictly past the fork** — the fork node itself is excluded, because it is
> shared by every column by construction and including it would put its entire reading into
> `common` for free **(the draft said "past the fork" without settling this, and the two
> readings give different results for an observation present at the fork, lost, and regained)**.
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
> **CR5 — CR1's selectivity is monotone-decreasing in N, and this is stated rather than
> discovered on the surface where it matters most.** `common` is an intersection, so it shrinks as
> columns are added: **every column added can only admit more entries, never fewer.** The
> comparison cap is **`MAX_COMPARISON_BRANCHES = 8`** (`packages/runtime/src/compare.ts:15`;
> `branch-scale.ts:5` aliases it as the collapse floor), and `archive/branch-set-scale.md` shipped
> the large-branch-set surface that reaches it. At N = 8, an observation is filtered only if it is
> present on **all seven** siblings' paths — one sibling that never records it is enough to admit
> it — so CR1 approaches a no-op exactly where the strip's volume is worst. **CR1's measured basis (§4.2) is N = 2 and its extrapolation to N ≥ 2 is
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

**The draft's prediction measured the wrong surface, and the corrected version predicts nothing.**
The draft read: *"at the 44 authored fork pairs the two columns' readings overlap at
Jaccard median 65.7%, with a median 36 differing observations. CR1 removes exactly that shared
core. The prediction is therefore median 36 admitted observations per pair, replacing 2 × ~58
printed sentences."* Cross-review found this is a **unit error, twice over**:

- The **65.7% / median-36** figure is measured over *"the two branches' full **structural
  readings**"* (`feedback-versus-the-dashboard.md` §5d, which names `CompareView.svelte:119` in the
  same sentence). That is the **rung-0 per-position reading** — the surface this RFC puts
  **explicitly out of scope** (§Scope, *"The rung-0 structural reading itself … It is untouched"*).
  CR1 filters the **strip**, not the reading.
- The **~58** figure is the dossier's *"median 58 observations per position"* (§5b, `:327`) — again
  the reading, not the strip. The strip's own volume is **8.83 entries per ply** over **754**
  transitions (§1.3, `[2026-08-16]`), which is a per-*transition-gain* count over a whole path, not
  a per-position census. The two are not comparable and neither bounds the other.

**Both of the withdrawn figures were re-measured in this round, and both moved — which is why they
stay withdrawn rather than being refreshed.** At `[2026-08-16]` there are **62** authored fork pairs
(was 44), Jaccard median **64.4%** (was 65.7%), median **38** differing observations (was 36); and
the rung-0 reading's median observations per position is now **78**, mean 63.96 (was median 58) —
`planning/exploration/log.md` already recorded that movement on a 47-pack corpus. **Every one of
these describes the out-of-scope rung-0 reading**, so refreshing them into a CR1 prediction would
repeat the unit error with newer numbers. They are recorded here only so that a later reader who
finds "36" in the dossier and "38" in a harness output does not think one of them is a bug.

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

**And CR1 disposes of the unconditional census for free.** Thirteen of the median **78**
observations per position (`[2026-08-16]`; 58 when the draft was written) are emitted
unconditionally by construction — twelve per-colour/per-role piece counts
and one king-to-king distance (`packages/runtime/src/structure.ts:454`, `:494`;
`docs/structural-reading.md:49-53` states this as intended). Under CR1 a `piece_count` survives only
where the columns' material actually differs, which is exactly when it is worth a sentence. No
special case was written for it.

#### 4.3 CR4 — the strip stops throwing the parameters away

> **CR4.** `StripEntry` (`compare-strips.ts:8`, re-verified unchanged at `532c7e2` — still
> `{plyOffset, nodeId, sentence, attribution}`) gains
> `readonly observation?: StructuralObservation`, carrying the admitted observation.
> `CompareView.svelte`'s `<details><summary>Structure and timing</summary>` block — **now at `:135`,
> and it was `:91` when the draft was written** — renders
> `renderStructuralObservation(entry.observation)`
> (`apps/web/src/lib/structural-sentences.ts:7`) when present, falling back to `entry.sentence`
> when absent. **The edit is confined to the *first* `{#each}` block on that line — the
> one over `strips[…].structure`.** That line holds **two** `{#each}` blocks inside one
> `<details>`; the second iterates `strips[…].timing`, whose pivotal-marker entries
> `rfc/live-marker-quality.md` criterion 3 protects, and it is not touched. (The per-column rung-0
> reading has likewise moved, from `:118-120` to `:157-159`, and stays untouched.)
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

> **Sibling status, re-read at `532c7e2` for this round.** Three of the six siblings §§5.2–5.7 were
> written against have **landed and moved to `rfc/archive/`**: `client-surface-floor`,
> `live-surface-honesty` and — the one that matters — **`claim-backing`**, which did not exist when
> those sections were written and now supplies this RFC's dependency (§5.8).
> `rfc/live-marker-quality.md`, `rfc/engine-leverage.md` and `rfc/vocabulary-wiring.md` are all
> **implementing**; `rfc/teacher-surface.md` is still **draft and owner-blocked**. The findings in
> §§5.2–5.7 were re-checked and **none of them inverted**; what changed is line numbers and one
> resolved open question, both recorded in place.

#### 5.1 Register claims: NONE, and this is stated loudly

> **This RFC claims NO pack-schema version and NO migration number.**

**Every register fact below was re-verified at `532c7e2` for this round, because the draft's were
`8744adb` facts and four of the six had moved** `[V]` `[2026-08-16]`. *(Register staleness under a
draft is itself a live defect — [[D423]], and `rfc/learner-rating.md` was blocked on exactly this
class of drift this morning.)*

- **Pack schema: nothing.** `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts:2`) is
  **`"0.27"`** and `schemas/drill_pack.schema.json`'s `$id` is
  `urn:chess-tabiya:schema:drill-pack:0.27`; both are **untouched by this RFC**. Not one `$defs`
  entry is added, removed, widened or narrowed. **0.19 remains frozen shut** and is not reopened. No
  committed pack byte changes, so **no content digest moves** (`packages/schema/src/drill-pack/digest.ts`
  digests content, not the `$id`). The draft said the next free lane was 0.25; **five lanes have
  landed or been claimed since** — 0.23 `engine-leverage`, 0.24 `vocabulary-wiring`, 0.25
  `archive/format-surface.md`, **0.26 `archive/claim-backing.md`**, 0.27 `archive/pack-graduation.md`
  — and **0.28 is the next free lane, currently held by `rfc/graduation-clearance.md`**. §2.1 and
  Open question 4 are corrected to say so. This RFC claims none of them and is unaffected by their
  landing order.
- **Migration: nothing.** No table, no column, no `STORAGE_VERSION` bump, no run-schema stamp.
  `STORAGE_VERSION` is **23** (`apps/server/src/storage.ts`) and **migration 23** is the head
  (`opponent-contracts`, run schema 0.16→**0.17**); `DRILL_RUN_SCHEMA_VERSION` is **`"0.17"`**. The
  draft's "migration 20 / run schema 0.15" is three migrations stale. **This RFC takes no migration
  position**, which matters more than usual right now: **[[D423]] records that three documents
  (`teacher-surface`, `opponent-contracts`, `learner-rating`) already hold one migration position as
  `STORAGE_VERSION + 1`, and the register cannot see the collision.** Adding a fourth silent holder
  would make this RFC part of that defect rather than a reader of it. No new event type either: claim
  delivery is a *projection* over the run's existing events and reveal occurrences — C1 persists
  nothing, and projections are never persisted — the same reasoning `archive/shape-library.md` used
  to keep run schema at 0.8 for firings.
- **Shape-entry and principle-entry schemas: nothing.** `SHAPE_ENTRY_SCHEMA_VERSION` is `"0.3"` and
  `PRINCIPLE_ENTRY_SCHEMA_VERSION` is `"0.1"`; this RFC reads the principle registry's projected rows
  and changes neither schema. (`rfc/measurement-records.md` holds shape-entry **0.4**.)
- **Refusal codes: nothing.** Verified by sweep: this RFC adds no `SourcingIssue` code, no
  `SourcingError`, and no pack-lint code. **C6 is a delivery-time admission gate over a predicate
  that already ships** — it reads `PackRecord.boundClaimIds` / `claimBackings`, which
  `claim-backing` computes from `validateClaimBindings`, and it changes no severity anywhere. The
  nine codes C6's meaning now rests on (`CLAIM_POINTER_INVALID`, `CLAIM_POINTER_REBOUND`,
  `CLAIM_TEXT_DRIFTED`, `CLAIM_BINDING_DUPLICATE`, `CLAIM_SPAN_ABSENT`, `CLAIM_SPAN_AMBIGUOUS`,
  `CLAIM_SPAN_CONTRADICTED`, `CLAIM_ASSERTION_UNDECLARED`, `CLAIM_ASSERTION_UNRECORDED`) plus
  `CLAIM_CENSUS_INCOMPLETE`, `CLAIM_FEN_OFF_PACK`, `CLAIM_AUTHOR_LABEL_REQUIRED`,
  `CLAIM_LABEL_UNEARNED` and `CLAIM_READING_UNATTRIBUTED` are **all `claim-backing`'s and all
  shipped**; this RFC cites them and adds none.
- **Run schema: nothing.** `feedbackDisclosed`/`feedbackDeliveryOpen`
  (`packages/runtime/src/feedback.ts:3`, `:22`) and the **four** run policies (not
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

**One interaction in the other direction, which the draft did not flag.**
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
end because it needed the `/feedbackClaims` figure from the same scan; the draft reproduced 235
exactly, and **re-derived at `532c7e2` the population is 245 `/deviations` support pointers against
349 deviations** `[V]` `[2026-08-16]` — the shape holds and both of D88's numbers have moved, which
is that row's owner's to correct, not this one's. **The `cost` binding and the deviation-anchored engine
records are `engine-leverage`'s, entirely**, and it says so from its side: *"`rfc/feedback-delivery.md`
(parallel draft) owns D77 / D78 / D79 … it does not specify the compare strip, claim delivery, or
`stated_reasoning`, and must not be read as doing so."* Verified exhaustively in cross-review:
`engine-leverage` contains **zero** mentions of `authored-feedback`, `AuthoredFeedbackItem`,
`KIND_ORDER`, `compare-strips`, `feedbackClaims` or `boundClaimIds`.

**The draft's stated interface was the wrong one, and it missed the real one.**

- **`PackRecord` is not shared.** The draft hedged *"if `engine-leverage` also wants a
  ledger-derived field on `PackRecord`…"*. It does not: `engine-leverage` never mentions
  `PackRecord`, `pack-registry.ts` or `assessmentGrounding` at all. Its added fields are
  `Capabilities.costBasis` (a `/capabilities` response field), pack-schema `$defs`, and run-schema
  amendments. **C7's `boundClaimIds` is the only new `PackRecord` field in the wave.**
  (`PackRecord` is declared at `pack-registry.ts:41`, not `:40`.)
- **The real overlap is `apps/server/src/sourcing/check.ts`, and it is a co-edit of one function.**
  `engine-leverage` §2.4 adds `DEVIATION_COST_UNBACKED` and `DEVIATION_COST_CONTRADICTED` to
  `evidenceSupports` — the same function body that holds the `feedbackClaims` block at `:201-212`
  whose label→kind map C6 and C7 read as their source of truth. **This RFC modifies no line of
  `check.ts`; it only reads `:202`.** So the two are semantically disjoint (different issue codes,
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

**The draft cited a criterion that does not exist, and understated the real interaction.**

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

#### 5.5 `rfc/vocabulary-wiring.md` — no code overlap, one shared ledger row, one shared corpus

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

#### 5.6 `rfc/live-surface-honesty.md` — zero collision, one shared file

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

#### 5.7 `rfc/teacher-surface.md` — confirmed clear

Claims **migration 21** only; run schema stays 0.15, pack schema stays 0.22. Zero hits on
`PackRecord`, `pack-registry`, `authored-feedback`, `AuthoredFeedbackItem`, `feedbackClaims`,
`compare-strips` or either sheet. It reads `feedbackDisclosed`/`feedbackDeliveryOpen` read-only and
states *"There is no per-viewer disclosure and this RFC adds none"* — which is also why §2.2a marks
the live-session path **unclear rather than broken**: an outcome on a shared live board opens the
terminal sheet for every seated participant, but no participant sees claims the player does not.
*(Its register facts have moved with everyone else's — it now holds the next migration position
after board annotation's landed 22, and pack/run schema are 0.27/0.17, not 0.22/0.15. §5.1 states
the current head. The non-interference finding is unaffected.)*

#### 5.8 `rfc/archive/claim-backing.md` — the dependency, and the one thing it asks of this RFC

**Added in the author round, because this sibling did not exist when §5 was written.** It is
implemented and archived at pack 0.26. Interfaces, in both directions:

1. **What it gives.** `claimBindings` on the evidence ledger; `validateClaimBindings` with fourteen
   refusal codes; the assertion registry (`CLAIM_ASSERTION_KINDS`, 15 kinds); the principle registry
   (`content/principles/`, `schemas/principle_entry.schema.json`, `PrincipleRegistry.loadDefault`);
   `explorer_position_census` as a record kind with an emitter; and — **already wired** —
   `PackRecord.boundClaimIds` and `PackRecord.claimBackings`. §3.3 records that this RFC's C7
   therefore ships ahead of it.
2. **What it asks (§6 of that RFC, and §3.11).** *One shape change and one prohibition, neither
   optional.* The shape change is C4's three-valued `binding` plus `authorSpans` and `principles`
   (**D167**) — discharged by §2.5 in this round. The prohibition is **C9 must not be weakened**
   (**D168**) — discharged by §3.5, with the measurement re-run and worse (66 / 117 of 196, against
   44 / 75 of 131).
3. **What it dissolved.** Open question 1's C6′ and C6″ are **withdrawn**; C6 stands; criterion 2
   collapses from three branches to one; criterion 14's reorder test is **superseded** by
   `CLAIM_POINTER_REBOUND` + `CLAIM_TEXT_DRIFTED`, which close D98 structurally; criterion 17's D97
   and D98 are flipped by *its* archiving commit, not this one; and Open question 5 is **answered**
   — it owns the binding wave, which is content plus two instrument runs.
4. **What it does NOT change.** *"C1, C2, C3, C5, C8's timing, CR1–CR5, and the disclosure model:
   untouched. This RFC changes when a claim is admitted, never when it is revealed."* Verified from
   this side: `validateClaimBindings` runs at pack registration and never during a run;
   `authored-feedback.ts` contains no reference to claims, bindings or backings; the four-arm
   `AuthoredFeedbackItem` union and `KIND_ORDER` are byte-unchanged.
5. **Zero file collision.** `claim-backing`'s surface is `apps/server/src/sourcing/*`,
   `apps/server/src/principle-registry.ts`, `schemas/principle_entry.schema.json`,
   `content/principles/` and the `$defs/feedbackClaim` lane. This RFC's surface is
   `apps/server/src/authored-feedback.ts`, `packages/runtime/src/compare-strips.ts`,
   `apps/web/src/lib/{api,CompareView,TerminalSheet,CheckpointSheet,structural-sentences}.*` and
   `apps/server/src/guidance.ts` (as a *pinned unmodified* site). The one file both touch is
   `apps/server/src/pack-registry.ts`, and `claim-backing` has already made that edit — **this RFC
   reads the fields and adds none.**

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
   `CompareView.svelte` (`:157-159` at `532c7e2`; `:118-120` when the draft was written) continues
   to present each branch independently and is untouched.
3. **`design/03-product-breadth.md:284` B4's residual** shrinks but does not close: this RFC ships
   the authored-claim delivery half. Full evidence-bound LLM rendering and Syzygy runtime rendering
   remain residual. **This RFC does not edit `design/`;** the ledger consequence is criterion 12.
   *(B4 shrinks by less than the draft implied and the honest figure should be stated: day zero
   delivers **98 of 196 claims**, and 60 of the 98 withheld are blocked on explorer records that do
   not exist. A gate item that reads "claims have a delivery path" would be true and would overstate
   what a learner sees.)*
4. **`design/05-in-run-experience.md` §3a-i (`:105`) — *"`outcome.reached` discloses under every
   policy (a finished run has nothing left to contaminate)"* — is given an operational reading it
   did not previously have, in two steps, and **both are flagged for the owner rather than settled
   here**.
   - **(a) *Finished run* becomes a predicate.** The draft treated it as a synonym for *an
     `outcome.reached` exists*; §2.2a shows the runtime has no such state, so C1 supplies one
     (exhaustion: every authored spine node reached, no play since). This is a reading, not an
     amendment — it makes the design sentence *true* of the mechanism instead of assumed-true.
   - **(b) The occurrence is decoupled from the event.** §3a-i names `outcome.reached` as the
     occurrence that discloses under every policy. C1 (iii) delivers claims at the latest reveal
     occurrence the policy has *already* released, which for **44 of 50** packs is a checkpoint or
     segment occurrence, because those packs cannot produce an outcome event at all without leaving
     the authored content (§2.2b, re-measured `[2026-08-16]`; the draft's figure was 31 of 37, and
     the share rose from 84% to 88%). No new disclosure moment is created and no policy gate is
     loosened — but the sentence the draft leaned on is no longer the load-bearing one; the
     predicate is. **If the owner reads §3a-i as granting `outcome.reached` and only
     `outcome.reached`, then C1 collapses back to the reviewer's rule, criterion 6(b) will report a
     near-zero share for corpus reasons rather than learner reasons, and the honest answer is Open
     question 4's anchor — not a weaker predicate.**
5. **`rfc/archive/claim-backing.md` gave rung 5 a floor and this RFC renders it — flagged because it
   borders intent tier and is not this RFC's to settle.** `design/05` §3 defines rung 5 as *"an
   author's judgement … provenance is the only safeguard"*. C8's third provenance line hands a
   learner the named principle, its statement and its **counter-case**, which is the strongest form
   that sentence can take without a review workflow. `claim-backing`'s own Deviations item 4 records
   the borderline: **a claim may now carry rung-4 and rung-5 content simultaneously and be rendered
   as both**, which `design/05` neither provides for nor forbids, and C4's three-valued `binding` is
   the smallest expression of that. **This RFC renders the distinction; it does not create it, and
   it edits no design document.** If the owner reads it as a ladder change rather than a labelling
   one, it belongs in an amendment to `design/05` and this RFC's C8 follows whatever that says.

Otherwise: none. The disclosure model, the anti-contamination boundary and the assistance ladder's
rungs are used as-is. The draft said *"the five feedback policies"*: there are
**four** run policies — `RunFeedbackPolicy = "delayed_checkpoint" | "segment_end" | "attempt_end" |
"immediate_guard"` (`packages/runtime/src/types.ts:40`, matching `feedbackDisclosed`'s four-arm
switch at `packages/runtime/src/feedback.ts:3-20`) — and only **three** are authorable, because
`schemas/drill_pack.schema.json`'s `feedbackPolicy` enum is
`["delayed_checkpoint", "segment_end", "immediate_guard"]`; `attempt_end` is run-only. All four are
used as-is.

## Acceptance criteria

1. **The projection delivers claims, and only under the predicate.** A run satisfying C1 (i) and
   (ii) returns `kind: "claim"` items from `GET /runs/:id/authored-feedback`, each carrying the
   attribution of the run's latest released reveal occurrence. The same test runs under **all four**
   `RunFeedbackPolicy` values (`delayed_checkpoint`, `segment_end`, `attempt_end`,
   `immediate_guard`; only three are pack-authorable, so `attempt_end` is exercised by constructing
   the run directly), and asserts that a run which has **not** exhausted the authored spine returns
   **zero** claim items under every one of them — including at an `outcome` attribution, which is
   the case the draft got wrong.
1a. **C1 is tested against the exploit that killed the draft's rule, and against the inertness that
    killed the reviewer's.** Four tests:
    (a) **early terminal + rewind** — play a mating pack to an early stalemate, assert **zero**
    claim items at the terminal sheet because the authored spine is not exhausted, then rewind and
    assert still zero;
    (b) **quiescence** — satisfy the predicate, assert claims are delivered, then `rewind` and
    `commitMove`, and assert claims are **withdrawn** from `GET /runs/:id/authored-feedback`;
    (c) **group seeding** — `createGroup` with a seed move that mates, assert no claims are
    delivered while any authored spine node is unreached;
    (d) **the no-outcome case** — an opening pack that emits no `outcome.reached` at all (**44 of
    the 50 claim-bearing packs**, `[2026-08-16]`): play its authored tree to exhaustion and assert
    claims **are** delivered, at the checkpoint attribution.
    (d) fails under the reviewer's outcome-only rule and is the reason C1 (iii) exists.
    A criterion that only asserts an attribution kind passes while the product is broken; these look
    at what happens *after*, and at what happens when nothing terminal ever happens.
2. **The corpus figure is reproduced by the shipped code, not by a script — and the criterion is now
   one branch, not three.** With C6′ and C6″ withdrawn (§3.2), C6 is the only rule. Over the **50**
   committed claim-bearing packs, C6 admits **98** and withholds **98** (**26,735 / 34,796** claim
   characters) `[2026-08-16]`; the shipped number is recorded in `planning/feedback-delivery/`. If
   the shipped implementation disagrees with §3.2's count, the RFC's number is wrong and is corrected
   there rather than in the code. **Both the numerator and the denominator are re-derived at
   implementation time, never asserted from this document** — the corpus grew 49% in claims between
   the draft and this round, and a criterion that pins "98 of 196" is unfalsifiable against the next
   corpus. This is an admission count and is independent of C1 — do not conflate it with how many
   claims a *run* delivers, which criterion 6 measures.
2a. **The admitted set agrees with `make expression-census`.** The implementation's admitted count
    minus its `self_declared` count must equal the census's **`backedClaims`** for the same tree
    (**1** at `[2026-08-16]`). Two independent readers of the same ledger disagreeing is the finding;
    matching is the pass. This criterion is what makes criterion 2's number checkable by a command
    rather than by a script nobody re-runs.
3. **C6 fails closed, in three directions.** (a) A pack with a `corpus_observed` claim and no
   `.evidence.json` withholds it — **and this is a real population now, not a constructed one: 15
   packs carry 39 machine-labelled claims with no sidecar at all** (§3.2). (b) Adding a validating
   `claimBindings` entry whose assertion resolves from a record of the mapped kind admits the claim
   with `binding: "ledger_bound"` or `"author_attributed"`; **`philidor-third-rank-hold` is a real
   fixture for this and the draft's note that one must be constructed is now false** — construct the
   *negative* cases instead. (c) The ledger-less fallbacks are tested explicitly, since C7 relies on
   them: a pack registered through either `pack-registry.ts` fallback (both of which already default
   `assessmentGrounding: "unverified"`) yields an **empty** `boundClaimIds` **and an empty
   `claimBackings`**, and therefore withholds every machine-checkable claim while still delivering
   its unlabelled ones with `binding: "self_declared"` (§2.6 C5(4)).
4. **`hasWithheldAuthoredContent` is unchanged in meaning.** A run on a pack whose *only*
   undelivered material is C6-withheld claims reports `false`. Regression test written **before**
   the change. Additionally, record the share of runs for which the flag is `true` at
   the last event, before and after, so §2.5's discrimination loss is measured.
5. **CR1 is an identity, and it is measured.** A test asserts that for every admitted structure
   entry, the observation identity is absent from at least one sibling column's path set; and the
   Q8 harness's §5d measurement is re-run against the filtered projection, with the new
   entries-per-ply, firing rate and per-fork-pair admitted count recorded in
   `planning/feedback-delivery/` **whatever they are**. No threshold is asserted as a pass
   condition. The measurement is reported **separately for N = 2, 4 and 8** (see CR5),
   and it is reported against the *strip*, not the rung-0 reading — §4.2 records that the draft's
   "median 36" prediction came from the reading and has been withdrawn, so there is no prior
   number for this to agree or disagree with. **The unfiltered baseline it is compared against is
   re-run in the same tree, not taken from this document**: §1.3's `[2026-08-16]` figures (754
   transitions, 6,659 entries, 8.83/ply, lift 1.004x) are themselves 35%-larger-corpus numbers, and
   the harness at `tools/q8-feedback-surface-harness/` runs unmodified, so there is no excuse for
   comparing a filtered 2026-08-17 projection against an unfiltered 2026-08-15 one.
6. **C1's reach is measured, and the result is blocking — the kill gate.** Over the corpus
   walkthrough set, record (a) the share of walkthroughs that reach any `outcome.reached`, (b) the
   share that satisfy C1's **exhaustion predicate** — the number that actually governs delivery —
   and (c) (b) split into the three exhaustibility populations of §2.2c (single-line, learner-turn
   branching, opponent-turn branching), because a low (b) driven entirely by the **17**
   opponent-branch packs has a different remedy from a low (b) that is uniform. **If (b) is below
   10%, this RFC's Job 1 does not ship as specified**: the mechanism would be correct and inert, and
   the honest response is Open question 4's anchor, **not** a weaker predicate. Two things are
   already known and must not be re-discovered by the harness, both re-measured for this round
   `[2026-08-16]`: the reviewer's outcome-conjunct version of C1 has a structural ceiling of
   **24 of 196 claims (12.2%)** because only 6 of 50 packs can produce the event at all (§2.2b) —
   which is why it is not what ships, and note the ceiling **fell** from 18.3% as the corpus grew —
   and full-spine exhaustion is attainable by learner action alone in **33 of 50 packs, 129 of 196
   claims (65.8%)**, down from 71.0% (§2.2c). **The gate threshold is unchanged at 10% and is not
   renegotiated by either movement.**
7. **CR3's degenerate cases are tested**: `N < 2` emits the unfiltered strip; identical branches
   emit an empty strip and the existing empty state.
8. **The anti-contamination boundary holds.** `drill-client-server.test.ts:158`
   (`expect(projected).not.toHaveProperty("feedbackClaims")`) passes unmodified, and a new test
   asserts `GET /packs/:id` still exposes no claim text after C1 ships.
9. **`live-marker-quality` non-interference.** `compare-strips.ts:38`'s pivotal-marker entries are
   byte-identical before and after; `castled` and `pawn_break` still render in the timing strip.
   Tested from both sides. Implemented as a **before/after comparison within one
   tree**, never as a golden-string fixture. **The reason is no longer hypothetical:**
   `live-marker-quality`'s resolved open question 3 **has landed** — `renderPivotalMarker` now emits
   *"The queens have left the board."* for a `last_of_role` marker with `queensOff`
   (`packages/runtime/src/pivotal.ts`) — so a golden-string fixture written against the draft's text
   would already be failing.
10. **`client-surface-floor` non-interference.** `CompareView.svelte` still contains zero `@media`
    rules after CR4 (verified 0 at `532c7e2`), and CR4 touches only the `structure` `{#each}` block
    inside the `Structure and timing` `<details>` — **at `:135`, not the draft's `:91`** — leaving
    the `timing` block, the rung-0 reading block at `:157-159`, and the `<style>` block unmodified.
    `client-surface-floor` is now archived; its criterion 12 (*"`CompareView.svelte` is unmodified
    by this RFC's commits"*) is self-scoped and CR4 does not break it, but D63's future owner still
    inherits one changed markup expression, as §5.4 records.
11. **The ledger and the log are updated in the archiving commit** (`AGENTS.md` RFC completion
    protocol). Precisely, and rewritten in this round because half the rows moved:
    **D77** flips to ✅ with the admission split **and C1's measured reach** named, and its
    *"0 of 131 … 22.1% of a 202,479-character authored prose corpus"* text is corrected in the same
    edit — the corpus is **196 claims / 61,531 chars over 50 packs**, and the percentage is retired
    rather than refreshed because its denominator has moved twice (§Summary);
    **D78** flips to **🚧 partial, not ✅**, because §4.2 establishes that CR1 addresses the strip
    only, while D78's second half (the rung-0 reading) is explicitly out of scope — **and the row's
    figures are corrected to the re-measurement: 99.9% of 754 transitions, 8.83 entries/ply, 99.4%
    of 18,470 quiet alternatives, lift 1.004×, and the rung-0 reading's median 78 observations per
    position, not 58**;
    **D79** stays **open**, and its *"0 of 145 checkpoints"* is corrected to **0 of 201**, with the
    note that 0 of 196 claims are referenced by any key-point `claim` ground;
    **D97** and **D98** are **already ✅** (closed by `claim-backing`) and are **not touched** by this
    RFC's commit — criterion 17;
    **D167** flips to ✅, discharged by §2.5's three-valued `binding`;
    **D417** and **D421** stay **open** and are annotated with §3.6's disposition — this RFC leans on
    neither guard and claims neither fix;
    the *Four declared vocabularies have zero content usage* row is annotated. A dated entry lands in
    `planning/exploration/log.md`. **The ledger edits are proposed by the implementer and landed by
    claude**, per the standing note that concurrent agents collide on `design/BACKLOG.md`.
12. **The B4 residual is restated** in `planning/exploration/gates.md` — the *authored feedback
    claims have no delivery path (0/131)* item is replaced by the measured post-landing state
    (claims admitted, claims delivered, claims withheld), rather than deleted, **and its 131 is
    corrected to the corpus size at landing**.
13. **No register row is added anywhere, and this is checked against a moving register.**
    `rfc/README.md`'s pack-schema and migration registers are unchanged by this RFC, and the Active
    row it eventually gets says **claims nothing versioned**. At implementation time the implementer
    re-reads `DRILL_PACK_SCHEMA_VERSION`, `DRILL_RUN_SCHEMA_VERSION` and `STORAGE_VERSION` from the
    tree rather than from §5.1 — they were 0.22/0.15/20 in the draft and are **0.27/0.17/23** now —
    and asserts this RFC moved none of them. **No migration position is taken**, which also keeps
    this RFC out of [[D423]]'s three-way `STORAGE_VERSION + 1` collision.
14. **The index-pointer hazard is pinned — superseded form.** The draft's reorder test (*"fails
    `sourcing-check` or demotes to `self_declared`"*) is **replaced** by `claim-backing`'s stronger
    closure, which this RFC asserts from the delivery side: reordering a pack's `feedbackClaims`
    raises **`CLAIM_POINTER_REBOUND`** at error and editing a bound claim's prose raises
    **`CLAIM_TEXT_DRIFTED`**, so no reordered or edited claim can reach a surface carrying a
    `ledger_bound` badge. The delivery-side test asserts the *consequence*: after a reorder, the
    affected claim is **withheld** by C6 rather than delivered with a stale badge.
15. **C9 holds: claims never enter the evidence packet.** A test asserts that after a
    covering occurrence, `evidencePacket` at any node contains **no** claim text in
    `packet.sentences` and no claim entry in `packet.authored`, and that `POST /runs/:id/voice` and
    `/speech` are byte-identical to their pre-change output for the same run. Written as a **grep
    test** as well: `authoredText` has no `"claim"` arm. **The measurement is re-run at
    implementation, not cited**: §3.5's 66 / 117 of 196 were 44 / 75 of 131 in the draft, and
    `claim-backing`'s routing raises both counts by design.
16. **CR5's degradation is measured and is a finding, not a pass.** The admitted-entry
    share at **N = 8** is recorded. **Above 90% admitted, CR1 is reopened** rather than shipped as
    effective, and the result is written into D78's row and Open question 6.
17. **D97 and D98 are NOT re-flipped, and the reason is recorded.** Both are ✅, closed by
    `rfc/archive/claim-backing.md`'s archiving commit on 2026-08-16. The criterion is that this
    RFC's commit **touches neither row**, and that §1.2's re-verification (the overwrite is gone,
    the template exemption is gone, `$defs/feedbackClaim` is closed) is what a future reader finds
    if they follow this RFC's citation of them. A second RFC re-flipping a closed row is the ledger
    integrity failure [[D400]]'s reconciliation was about.
18. **The `claimBackings` gap is pinned as a number, not as a default.** A test asserts that a claim
    whose only label is `derived_feature` — **31 claims, 11,256 chars, 32% of the admitted set at
    `[2026-08-16]`** — is delivered with `binding: "self_declared"`, empty `authorSpans` and empty
    `principles`, and that this comes from C4's **explicit** default rather than from an absent map
    entry read as falsy (§2.6 C5(4)). The count is re-derived at implementation.
19. **D417's hole is asserted, not assumed away.** A test asserts the *current* behaviour of the
    shipped guard — that a claim whose author-attributed segment reads *"f5 scores 91% for White"*
    raises **no** `CLAIM_READING_UNATTRIBUTED`, while *"90.9%"* does — with a comment naming
    [[D417]]. **This is deliberately a test of a defect.** C8's `author_attributed` line would
    otherwise be read as promising that no unattributed rate reaches a learner, and it does not
    promise that. When D417 is fixed the test flips with it; today it stops the guarantee from being
    silently assumed.
20. **C8's own sentences are inside the vocabulary floor, and only its own sentences are claimed.**
    A test asserts that the three rendered provenance lines contain no `BANNED_JUDGEMENTS` and no
    `PRESCRIPTIVE_VERBS` word for every projected `claimBackings` row in the corpus — including the
    principle `statement` and `counterCase` fields, which are authored prose interpolated into a
    frozen template. **The author's claim sentence is explicitly out of this criterion's scope**
    (66 of 196 carry a judgement word), because [[D421]] establishes that authored prose has no gate
    and this RFC does not build one.

## Open questions

1. **CLOSED 2026-08-16 — the C6 fork dissolved and no owner ruling is needed. It is recorded here
   rather than deleted, because a question that was the whole reason an RFC was blocked should show
   its closure, not vanish.**

   *The question was:* should an unbacked machine-checkable label **withhold** the claim (C6),
   **deliver it with a stated absence unless its text carries a cardinal number** (C6′), or
   **deliver it unless its label class has a legal record path** (C6″)? The draft called this the
   owner decision the RFC existed to ask, and recommended C6″.

   **Why it is closed, in three steps, none of which is this author's judgement:**

   - **The owner already ruled, on 2026-08-15, and refused the fork itself.** Offered the three
     options with their measured shares (49.0% / 78.2% / 79.1%), the ruling was *"why not fix them
     properly?"* — recorded as `rfc/archive/claim-backing.md`'s exploration gate, and the third
     landing of that ruling in that shape (cf. *"we need to fix this asap. fix all to include it
     properly. we are the authors"*). **Re-asking it would be asking the owner to re-rule a ruling.**
   - **The premise that made it a fork is now false in the tree.** All three options were ways of
     pricing a debt that **could not be paid**: 37 claims failed `EVIDENCE_OVERREACH` at error
     permanently, and the only working emitter deleted the author's sentence. §1.2 re-verifies by
     symbol at `532c7e2` that the overwrite is gone, the template exemption is gone, and a
     `tablebase_result` record backs an authored sentence **today**, unchanged, in
     `philidor-third-rank-hold`. **Withholding is now deferral, which is what C6 was always assumed
     to be.**
   - **`claim-backing` §6 disposed of the two alternatives explicitly.** C6 is retained; **C6′ and
     C6″ are withdrawn**, on the stated ground that both existed only to soften a permanent refusal.
     §3.2 strikes them from this document. The draft's recommendation is **reversed, and the
     reversal is stated rather than absorbed**: the option this RFC's author argued against is the
     one that ships, and it is right now for exactly the reason it was wrong then.

   **The delivery rule, stated once so nothing has to be inferred from the history above:**

   > A claim is **delivered** iff every machine-checkable label it carries
   > (`corpus_observed`, `engine_validated`, `tablebase_exact`) is backed by a **validating
   > `claimBindings` entry** whose spans include at least one instrument span resolving from a record
   > of that label's mapped kind. A claim carrying no machine-checkable label is delivered. Anything
   > else is **withheld**, and a withheld claim is not counted in `hasWithheldAuthoredContent`.
   > Delivered claims carry `binding ∈ {ledger_bound, author_attributed, self_declared}`, read from
   > `PackRecord.claimBackings` and defaulting to `self_declared` where no entry exists.
   > **Day zero: 98 of 196 delivered, 26,735 of 61,531 characters** `[V]` `[2026-08-16]`.

   **The one condition that reopens this question, and it is not a preference.** If a class turns
   out to be **structurally unbindable** — not "the wave has not run", but "the shipped checker
   cannot accept any record for this shape" — then the withheld set stops being a queue for that
   class and the fork comes back for it alone. §3.2 checked all four classes against the shipped
   checker and **found no such class**: `tablebase_exact` is proven bindable in the corpus,
   `engine_validated` is bindable for the two registered engine assertions, `corpus_observed` is
   blocked by **missing records** rather than by any refusal (`CLAIM_ASSERTION_UNRECORDED`, with the
   emitter shipped), and `author_principle` is not a machine label at all. The nearest thing to a
   permanent residue is the handful of claims `claim-backing` §4 Bucket 3 named — cross-ledger
   citations and assertions no instrument in this repository measures — and **their remedy is
   authoring, not a ruling**. That is the honest answer to *"what residue still cannot be bound"*:
   **a wave and a few sentences, not a class.**

   **Nothing else in this question survives.** Options A/B/C, their tables, the numeral-proxy
   analysis and the spelled-out-cardinal finding are all withdrawn with C6′ and C6″. *(One fragment
   of that analysis is worth keeping because it became a defect rather than an argument: the draft
   observed that this corpus writes quantities in words as often as in digits, and a digit-only
   detector therefore mis-sorts. `claim-backing`'s shipped `RATE_TOKEN` is digit-**and-decimal**-only
   and mis-sorts exactly as predicted — [[D417]], §3.6a. The draft's reasoning was right about a
   rule it was arguing against, and the rule shipped somewhere else.)*
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
4. **What anchors a claim, eventually? — still "probably required", and one of its three candidates
   just got much cheaper.**
   C1 is the honest consequence of anchorlessness, not a destination. §2.2a raised the price of
   staying anchorless from *"claims arrive late"* to *"claims arrive late and the runtime has no
   state at which late is safe, so a predicate had to be invented"*, and §2.2c raises it again: the
   predicate is all-or-nothing per pack, so a learner who drills three of a pack's four authored
   lines gets nothing, and **17 of 50 packs' exhaustion depends on the opponent policy** rather than
   on the learner. An anchor makes delivery incremental instead. Three candidates, none taken here:
   - **an authored `at` on `$defs/feedbackClaim`** — pack lane **0.28**, currently held by
     `rfc/graduation-clearance.md` (§5.1), plus a **196-claim** wave. *The `$def` is now
     `additionalProperties: false`, so this can no longer be smuggled in unversioned — which is
     D112's closure working as intended.*
   - **a ledger-derived anchor** — **this is the candidate that changed.** The draft said it *"no
     longer arrives free with the binding wave"*, because there was no prose-preserving path. There
     is one now, and it carries FENs by construction: a `ClaimAssertion`'s `args.fen` is
     **machine-checked against the pack's own reachable positions** (`CLAIM_FEN_OFF_PACK`), so every
     validating binding already names a position set that the validator has agreed lies on or one
     ply off the authored spine. `claim-backing`'s own Open question 3 records the same thing from
     its side. **A ledger-derived anchor is now a projection over data the wave produces anyway** —
     author-supplied and machine-checked, therefore not an inference — and it needs no schema lane.
     Its coverage is exactly the bound set, which is **1 claim today and the wave's output tomorrow**.
   - **C2's `stated_reasoning` reference becoming the normal authoring habit** — see D79, still at
     0 of 201 checkpoints.
   **If criterion 6(b) comes back low, this question becomes the RFC rather than a footnote to it**,
   and the ledger-derived candidate is the one to take first, because it is the only one that costs
   no schema lane and no separate authoring wave.
5. **ANSWERED 2026-08-16 — `rfc/archive/claim-backing.md` owns it, and the wave is content plus two
   instrument runs.** *The question was:* who owns D97, and is the binding wave a content wave at
   all? The draft's answer was *"not a content wave — it needs a template kind, or an overreach-rule
   widening, or an emitter that attaches rather than overwrites"*. **It got the third one**, plus a
   new ledger artifact, and `claim-backing` §6 states the ownership: it owns D97 and D98, both now
   ✅, and the wave is **content plus the instrument runs** — an explorer position-census pass and a
   tablebase legal-successor census pass (§3.2). This RFC deliberately does not claim any of it, and
   criterion 17 asserts that its commit re-flips neither row. **The residual question is scheduling,
   not ownership**, and it has a number: the wave is worth **98 claims and 34,796 characters**, of
   which the single largest tranche is 60 `corpus_observed` claims blocked on **zero** explorer
   records.
6. **Does CR1 survive N = 8?** CR5 records that `common` shrinks monotonically in the
   column count and that `MAX_COMPARISON_BRANCHES = 8`, so CR1's selectivity is weakest exactly
   where `archive/branch-set-scale.md` put the most columns. Criterion 16 measures it. The
   alternatives — majority-absence, or pairwise strips against a designated reference column — are
   both closer to ranking than CR1 is, and R3's ρ = −0.143 says do not reach for a selectivity
   score before measuring. Deferred **to criterion 16's result**, not to taste.
7. **Is `hasWithheldAuthoredContent` still worth having?** §2.5 records that C1's
   predicate makes the flag near-permanently `true` mid-run. Criterion 4 measures the degradation.
   **The corpus has made this worse rather than better:** every pack carries at least 2 claims and
   the median is 4 (§1.1c), so the flag is `true` for the whole of any run that never exhausts its
   spine — which is most runs. If it becomes uninformative, the honest move is to retire or
   re-specify it rather than let a true-but-useless flag sit on the surface — which is the same
   failure this whole RFC is about, one field over. Not blocking; ledger row if the measurement
   confirms it.
8. **NEW — should a `derived_feature`-only claim carry a principle reference?** 31 claims (11,256
   chars, 32% of the day-zero admitted set) carry `derived_feature` and nothing else, so they have no
   `claimBackings` entry, no principle, and C8 renders them as *"author-declared: derived_feature. No
   machine record is attached."* That is honest and it is also the thinnest provenance any delivered
   claim gets, on the label whose name most implies a machine. **This is an authoring question, not a
   delivery one**, and §2.6 C5(4) makes the delivery behaviour explicit either way so it is not
   blocking. Ledger row proposed; whoever runs the binding wave should decide it in the same pass,
   because they will be reading all 196 claims anyway.

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
- 2026-08-15: **author's revision after cross-review**, re-verifying every code site by symbol at
  `8744adb` and re-deriving every corpus figure a third time (all reproduce exactly).
  **Kept:** §2.2a's demolition of the draft's C1; the exhaustion predicate; C9 in full; CR5; the
  withdrawn CR1 prediction; the register, policy-count and 16.1% corrections.
  **Changed, with new measurements:**
  **(1)** C1's coverage clause is **stricter** — the full authored spine, not
  `reachableAuthoredSpineIds`, which is the ancestor chain of the pack's checkpoints and omits the
  final mating node in four of six mate packs (§2.2c);
  **(2)** C1's `outcome.reached` conjunct is **dropped** in favour of the latest released reveal
  occurrence, because `outcome.reached` fires only from `terminalOutcome` and **only 6 of 37 packs
  (24 of 131 claims) have a chess-terminal spine leaf** — an outcome-gated Job 1 is capped at 18.3%
  of the claim corpus by the corpus's shape (§2.2b), and the conjunct adds no safety the predicate
  does not already supply. Both readings of `design/05` §3a-i are flagged for the owner
  (Deviations 4);
  **(3)** §1.2 sharpens D97: the templates require the supported prose to be the **byte-exact
  generated sentence** (`check.ts:143-145`, `:170-172`), so the validator does not merely lack a
  prose-preserving attach path — it forbids one;
  **(4)** Open question 1 is rewritten as the owner fork with three written rules and their measured
  effects (C6 70/49.0%; C6′ 106/78.2%; C6″ 107/79.1%), including two findings cross-review did not
  have: **28 of the 36 claims C6′ newly delivers carry a spelled-out cardinal** (so the digit proxy
  admits the very hazard it names, and extending it collapses the gain to 78/55.2%), and **all 12
  packs with `tablebase_exact` claims already hold `tablebase_result` records — 341 of them** — so
  withholding those claims withholds an assertion whose instrument ran.
  Criteria 1, 1a, 2, 6, 11 and 17 rewritten accordingly; criterion 17 now records that D97/D98 exist
  and are not this RFC's to close.
- 2026-08-16: **author round after the blocker landed — and the blocker had been gone for a day.**
  `rfc/archive/claim-backing.md` is implemented and archived at pack 0.26;
  `planning/work-register.md` §2 still read *"OWNER-BLOCKED on the C6 fork"* until `532c7e2`. Every
  code site re-verified **by symbol** at `532c7e2`; every corpus figure re-derived over a corpus
  that grew from **37 claim-bearing packs / 131 claims** to **50 / 196** (+35% packs, +49% claims,
  +89% claim characters).
  **Closed:**
  **(1) Open question 1 — dissolved, not re-asked.** The three-way C6 fork priced an unpayable
  debt; the owner refused all three on 2026-08-15 and `claim-backing` §6 retained **C6** and
  **withdrew C6′ and C6″**. §3.2 strikes both alternatives and states the delivery rule; the draft's
  own recommendation (C6″) is reversed and the reversal is stated rather than absorbed.
  **(2) Open question 5 — answered.** `claim-backing` owns D97/D98 (both ✅) and the wave.
  **Superseded findings, each re-verified false in the tree** (§1.2): the explorer emitter no longer
  overwrites `feedbackClaims[i].text` (**D97**); the `EVIDENCE_OVERREACH` template exemption is gone
  and prose pointers are refused unconditionally at `error` (**D133**); `$defs/feedbackClaim` is
  `additionalProperties: false` at pack 0.27 (**D112**); the principle registry ships with
  `counterCase` **required** (**D165**); and `validateClaimBindings` sets
  `disposition: "author_attributed"` when author segments remain (**D164**) — **with one correction
  to the brief this round was given: that disposition emits no issue at all, and it is
  `EVIDENCE_TYPE_UNBACKED` that is `published ? "error" : "warning"`. The routing's own refusals
  (`CLAIM_AUTHOR_LABEL_REQUIRED`, `CLAIM_LABEL_UNEARNED`, `CLAIM_READING_UNATTRIBUTED`) are `error`
  at every review status.**
  **Specification changes:** C4's `binding` becomes **three-valued** and the item gains
  `authorSpans` and `principles` (discharges **D167**); C7 is restated as *already shipped* —
  `PackRecord.boundClaimIds` and `claimBackings` exist and this RFC adds no field; C8 gains a
  **third** provenance line naming the principle, its statement and its counter-case; C5 gains item
  (4), the explicit `self_declared` default for the **31 claims** that carry `derived_feature` alone
  and therefore have no `claimBackings` entry.
  **Two live holes recorded and deliberately not papered over (§3.6):** **[[D417]]** — `RATE_TOKEN`
  is `/(?:[+-]?\d+\.\d+%?)/`, so *"90.9%"* raises `CLAIM_READING_UNATTRIBUTED` and ***"91%" raises
  nothing***, and the `MACHINE_TOKEN` sweep cannot catch it because declared `authored` spans are
  removed from the remainder first; **[[D421]]** — `voiceCheck` is a containment test over LLM
  output and **authored prose has no gate at all**, and `evidencePacket` folds authored sentences
  into `packet.sentences`, so authored prose *widens* the renderer's licence. Criteria 19 and 20
  assert the holes rather than assuming them away.
  **Re-measurements** `[V]`: **D78** re-run on the unmodified Q8 harness — 754 transitions (was
  634), 6,659 entries (5,266), **8.83/ply** (8.31), 99.9% firing (99.8%), 99.4454% of 18,470 quiet
  alternatives (99.3% of 14,463), **lift 1.004× (was 1.005×)**, same-kind lift 1.09× (1.11×); the
  rung-0 reading's median observations per position is **78** (58) and there are 62 fork pairs (44)
  at Jaccard median 64.4% (65.7%) with median 38 differing observations (36). **D79** — **0 of 201
  checkpoints** use `stated_reasoning` (was 0 of 145), 0 `reasoningKeyPoint` entries exist in any
  drill pack, and 0 key points use a `claim` ground against **196** claims. **C1's cost table** —
  the outcome-conjunct ceiling **fell** to 6 of 50 packs / **24 of 196 claims (12.2%)** from 18.3%;
  exhaustibility is 19 single-line / 14 learner-branch / 17 opponent-branch packs (73 / 56 / 67
  claims), so **33 of 50 packs and 129 of 196 claims (65.8%)** are learner-exhaustible, down from
  71.0%; `reachableAuthoredSpineIds` still omits the mating leaf in four packs, 5 of 50 differing.
  **Register: still NOTHING VERSIONED**, re-checked against a register that moved four ways —
  pack **0.27** (0.28 free but held by `graduation-clearance`), run **0.17**, `STORAGE_VERSION`
  **23**, migration head **23**. No migration position is taken, which also keeps this RFC out of
  **[[D423]]**'s three-way `STORAGE_VERSION + 1` collision.
  Criteria 2, 3, 5, 6, 9, 10, 11, 13, 14, 15 and 17 rewritten; **2a, 18, 19 and 20 added**; §5.8
  added for the `claim-backing` interface; Open question **8** added.
