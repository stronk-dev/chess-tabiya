# Campaign failure resources — consequence without turning mistakes into a tax

**Question:** R12 / [[D1515]] — what depleting campaign resource can make failure consequential
without making the rehearsal loop punitive?

**Date:** 2026-08-26

**Verdict:** an automatically depleted HP counter cannot satisfy the question as posed. If a
`failed` verdict is the debit authority, the product has attributed the loss to the learner's
failed submission; renaming the counter does not change that relation. The viable family is
two-stage: the submitted result creates a visible consequence, then the learner chooses whether to
spend something to resist it or carry a bounded effect forward. `[V]` The best structural fit among
the four executable candidates is **act-reset availability of already-acquired tools**, not a new
number: choose one acquired assistance/tool affordance to rest until the next act, while ownership
and theory knowledge remain intact. `[M]` That candidate passes the mechanical constraints and has
not passed a felt-punishment or usefulness test.

R12 therefore moves from an open mechanism search to one owner decision: what happens when no
exhaustible tool remains—forced recovery route, one carried strain before an act-boundary loss, or
some other explicitly bounded second stage? No failure RFC is buildable until that is ruled.

## 1. Constraints fixed before looking at examples

The owner supplied three constraints in [[D1515]]: failure has a consequence; one failed node is
not an immediate run-ending cliff; and the consequence is resource-shaped. The living product adds
five more:

1. Rewind and branching inside an encounter remain experimentation, not a loss condition
   (`design/00-thesis.md`; `design/06-campaign.md`; [[D945]]). `[V]`
2. Standard educational content and run-scoped rewards unlock by playing, never by winning
   ([[D1040]], [[D1565]]). `[V]`
3. A resource replenished by winning compounds difficulty against the learner already failing; no
   candidate here may use success as income. `[M]`
4. [[D1496]] already establishes the attribution distinction in shipped campaign vocabulary:
   earned rewinds are spent by a learner gesture and earned regardless of verdict. `[V]`
5. The campaign already has one numeric currency. `design/research/ux-campaign.md` §6 records the
   cognitive/UI prohibition on adding a second bare counter. `[V]`

The consequence may use the pack's authored `ObjectiveState`; it may not grade a move, infer intent,
or manufacture a chess claim. Law 8 therefore remains outside the mechanism.

## 2. External mechanisms — the transferable part is authority, not theme

### 2.1 Blades in the Dark: consequence first, spend by choice

The official SRD says a player who receives an unwanted consequence **chooses** to resist it;
resistance is effective, and only after that choice does a roll determine stress cost. It also
allows choosing among several consequences rather than converting every bad result into the same
loss. `[V]` [Blades in the Dark — Resistance & Armor](https://bladesinthedark.com/index.php/resistance-armor)

The transferable object is not “stress.” It is the event authority:

```text
result -> consequence offered -> learner chooses resistance -> resource spent
```

That is categorically different from `result=failed -> hp--`. The former can truthfully say what
the learner chose to preserve; the latter can only say what the failure took. `[M]`

### 2.2 Fate Condensed: one short buffer is not enough

Fate uses two stages. Stress absorbs a hit and clears after the scene; consequences remain and can
change what is possible. Only after both are unavailable is a character taken out. A player may
also concede early and retain control over the terms of the loss. `[V]`
[Fate Condensed — Challenges, Conflicts, and Contests](https://fate-srd.com/fate-condensed/challenges-conflicts-and-contests)

Two transfers survive the fiction:

- a short buffer should reset at a meaningful boundary rather than carry every early mistake into
  the climax; and
- “zero” needs a second consequence state. If decrementing the last point ends the run, a single
  node can still become the cliff [[D1515]] refused. `[M]`

### 2.3 Hades: a failure can add access rather than subtract it

Supergiant's official FAQ describes God Mode as always available and making the player more
resilient, with resilience increasing after each death. `[V]`
[Supergiant Games — Hades FAQ](https://www.supergiantgames.com/blog/hades-faq/)

This is a negative control for the owner requirement: it is not a depleting resource. It does show
that a commercial roguelike can make repeated failure increase help without removing the run's
identity. Tabiya already has the more expressive version—the earned module inventory—and should not
add a second hidden adaptive difficulty system. `[M]`

### 2.4 Learning evidence: failed attempts need the consolidation phase

Kapur's productive-failure experiments establish an existence proof for attempting complex
problems before instruction, and later work describes the productive sequence as problem solving
followed by instruction/consolidation. `[V]`
[Kapur 2008, DOI 10.1080/07370000802212669](https://doi.org/10.1080/07370000802212669) ·
[Kapur 2014, DOI 10.1111/cogs.12107](https://doi.org/10.1111/cogs.12107)

This does not prove any game mechanic. It does rule against a failure resource that removes access
to the post-attempt evidence or prevents the learner reaching the consolidation phase. `[M]`

An experimental competence-frustration study summarizes prior evidence that negative feedback can
undermine perceived competence and is associated with disengagement; it also distinguishes
persistence driven by interest from persistence driven by self-worth concerns. `[P]`
[Waterschoot et al. 2019](https://selfdeterminationtheory.org/wp-content/uploads/2021/02/2019_WaterschootEtAl_RoleofCompetence.pdf)
The study is not about chess or campaign UI, so it supports a caution, not a product claim: red
damage language and a counter in the coaching seat are not neutral presentation choices.

## 3. Executable comparison over the accepted run shape

`tools/d1515-failure-resource-harness/` exhaustively evaluates all **512** achieved/failed patterns
over 3 acts × 3 nodes. `[V]` It fixes no probabilities and therefore makes no population claim. The
four policies are structural controls with deliberately small constants:

| Candidate | Completes educational path | Terminates | Act-I failure changes Act-III capacity | Debit authority | New numeric counter |
|---|---:|---:|---|---|---|
| Global HP (3) | 46 / 512 | 466 | yes | failed verdict | yes |
| Act HP (2, resets) | 64 / 512 | 448 | no | failed verdict | yes |
| Existing rewind charges as resistance | 512 / 512 | 0 | yes | learner spend | no |
| Acquired-tool exhaustion, act reset | 512 / 512 | 0 | no | learner choice | no |

All nine single-failure patterns survive every candidate; that weak check is why it is not enough.
The discriminating properties are carry-forward, the debit authority, and whether depletion closes
the educational path across the full state space. `[V]`

The exact receipt is `tools/d1515-failure-resource-harness/results.json`; six able-to-fail Node-24
tests cover the enumeration, carry-forward, attribution, silent-consequence and second-currency
claims.

## 4. What the comparison rules out

### 4.1 Automatic HP is a contradiction, not a naming problem

Any transition of the form `failed seal -> decrement` has `failed seal` as the debit authority.
It can be gentle, visually quiet, or restored later; it cannot be described as non-attributive.
This is an analytic result under [[D1496]]'s definition, not a user-perception measurement. `[V]`

### 4.2 A global pool prices the first act into the boss

The global-HP and shared-charge candidates both carry an Act-I loss/spend into Act III. That is the
same early-experiment tax [[D1496]] found in the earned-rewind economy. Reusing charges avoids a
second counter but couples “try another branch” to “survive a later consequence,” making the
learner husband the thesis's core loop. `[V]`

### 4.3 Resetting HP fixes carry-forward and not attribution

The act-reset control makes an Act-I failure irrelevant to Act-III capacity. It still creates a
second number and still debits automatically from the failure. Reset cadence and debit authority
are independent questions. `[V]`

### 4.4 A single pool cannot express the owner's cliff rule by itself

If a resource at one remaining unit is decremented to zero and zero terminates, that node ends the
run. Guaranteeing that one node never causes the cliff requires a second state: a carried
consequence, recovery route, concession, or deferred act-boundary decision. Fate's stress →
consequence → taken-out sequence is an external example of the same structural necessity. `[M]`

## 5. Recommended research contract: availability, not another currency

The candidate worth authoring after the owner decision is a **readiness projection over the
run-scoped inventory** [[D1565]] already requires:

```text
owned          durable for this run; a preset never mutates it
ready          owned tools offerable in the current act
resting        owned tools unavailable until the fixed act boundary
boss-suppressed ready tools unavailable for this encounter only
effective      honesty ceiling ∩ ready ∩ not suppressed ∩ learner request
```

After a failed submitted branch, the result card states one authored fact—the objective verdict—and
offers a campaign choice. Resting one eligible tool is the learner's spend; declining carries a
named campaign consequence. No counter appears beside the move or in the coaching seat. Ownership,
theory knowledge and the core rules floor cannot be lost. All resting tools return at the next act
boundary regardless of results. `[M]`

Why this candidate is stronger than a new HP bar:

- it uses the thing the run is already about, so rewards and consequences share one model;
- it makes later encounters and bosses structurally depend on acquired tools;
- it adds no second currency or success-gated refill;
- it cannot lock the ordinary educational catalogue; and
- its state can be explained by exact reason: ready, resting, boss-suppressed, honesty-refused, or
  not requested. `[M]`

The word “exhaustion” is research vocabulary, not learner copy. Theory entries represent knowledge
and must remain owned; at most their in-run consultation affordance can rest. `[M]`

## 6. The remaining owner decision

The research does **not** decide what a learner carries when no eligible tool remains. Three bounded
families survive:

1. **Recovery route (recommended):** the next map choice becomes a recovery encounter that restores
   one affordance on entry or seal, independent of verdict. The run continues, but route freedom is
   the consequence.
2. **One carried strain, resolved at the act boundary:** depletion cannot terminate on the node;
   unresolved strain may produce an act loss after the learner has seen and accepted it. Exact
   threshold and recovery are candidate values requiring owner-use.
3. **No terminal campaign loss:** exhaustion and lost prestige are the complete consequence; the
   educational route always reaches its final node. This is mechanically safest but may remain the
   “playlist” shape [[D1300]] objected to.

Whichever is ruled must preserve these invariants: rewards/content unlock on any verdict; failure
never removes Review/consolidation; replenishment is scheduled or choice-based, never win-based;
the first failed node is nonterminal; and the ending offers the preserved run and its Review.

## 7. What this dossier does not establish

- No person used any candidate; “non-punitive” remains unverified as felt experience.
- The exhaustive 512 patterns are a state-space proof, not an estimate of real failure rates.
- No HP amount, number of resting tools, act reset cadence, recovery-node count or loss threshold is
  licensed.
- The inventory candidate depends on the two-horizon campaign amendment and the learner-module
  registry; neither is accepted at this date.
- The exact low-resource copy and screen timing require the campaign composition pass.

## 8. Sources and reproducibility

External `[V]`/`[P]` sources are linked inline. Repo evidence `[V]` was checked at the 2026-08-26
HEAD against `packages/runtime/src/campaign-contract.ts`,
`packages/runtime/src/campaign-state.ts`, `rfc/campaign-core.md`,
`planning/campaign-research-queue.md`, `design/research/ux-campaign.md`, [[D1496]], [[D1515]] and
[[D1565]]. Reproduce the finite-state arm with the two Node-24 commands in
`tools/d1515-failure-resource-harness/README.md`.
