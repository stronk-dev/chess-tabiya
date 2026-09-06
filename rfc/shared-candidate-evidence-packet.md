# RFC: Shared candidate evidence packet — the compiled legal population three consumers are measured against

- **Status:** **draft — cut to its blocking contract 2026-09-06 and awaiting owner acceptance; no
  further fresh-review round is commissioned.** This document is bounded to the obligation its
  dependents actually carry: one score-free, provider-free, complete legal-candidate event packet,
  compiled from the root position and the shipped move authority, retaining the original sealed
  values and keyed by facts alone. The runtime service and cache execution model moved to
  `rfc/candidate-population-service.md`; the executable collector registry and its dependency-closed
  scope plans moved to `rfc/candidate-collector-registry.md`; fourteen rounds of review history moved
  to `planning/evidence-foundation-ux/candidate-packet-cut-plan.md`. Nothing was deleted. The
  contract, the acceptance criteria that can go red against it, and the three consumer handoffs are
  unchanged bytes. Implementation remains unauthorized until acceptance and until
  `rfc/evidence-value-authority.md` lands `createRulesMobilityReadingLegalMovesV1Evidence`.
- **Author:** claude (initial draft); codex (2026-08-29 operation-boundary author repair). Drafted
  from `design/research/shared-candidate-evidence-packet.md` and
  `tools/d1071-candidate-packet-harness/`; every carried claim re-verified at HEAD, with seven
  corrections recorded
- **Created:** 2026-08-23
- **Design refs:** `design/05-in-run-experience.md` §5 (*"detection is cheap, significance is not"* — the split this RFC executes in code: one factual population, separate opinionated derivations) and §3b-i (*"The LLM is the voice, never the source"*); `design/03-product-breadth.md` §Play (opponent selection) and §Intelligence and explanation
- **Exploration gate:** [[D1071]] 📊 and [[D1072]] 🐞 — research complete 2026-08-23, dossier `design/research/shared-candidate-evidence-packet.md`, executable falsifier `tools/d1071-candidate-packet-harness/` under `rfc/0000-rfc-process.md` §Exploration gate. [[D1330]]'s per-dossier classification of all 118 research artifacts ranked this **live debt rank 6**: the population finding was partially adopted by `evidence-move-selector.md`, *"but the packet itself is that RFC's Discharge D2, unbuilt"*
- **Depends on:** **accepted** `rfc/exact-legal-mobility.md` — it ships the single actual-turn move authority (`exactLegalMoves`/`exactLegalMoveMap`), `MOVE_IDENTITY_CONVENTION`, `MOVE_DESTINATION_CONVENTION` and the `rules.mobility.reading.legal_moves@1` projection, which is this packet's legal-convention field rather than a new one (§4.2); **draft `rfc/evidence-value-authority.md`**, whose exact route `createRulesMobilityReadingLegalMovesV1Evidence` must land first; implemented F1 evidence contract (`rfc/archive/evidence-contract-manifest.md`, `rfc/archive/semantic-evidence-selection.md`) and the compiled catalogue at HEAD. The provider RFC is a dependency of held Discharge D10, not of this provider-free landing
- **Parent / amends:** amends the `SemanticSelectionInput` contract in `packages/runtime/src/semantic-evidence.ts` (§3 — the caller-supplied alternative population becomes a compiled packet). It consumes, and does not amend or co-own, `evidence-value-authority`'s exact FEN→legal-evidence factory; projection, operands and move semantics do not change here. It supplies the complete-population input and one-root score-source correction to `evidence-move-selector.md`/bot Discharge D10 without implementing a dormant candidate vector here. Review's separate node-free position evaluation stays owned by `provider-exchange-and-execution` plus `review-evidence-compiler`; this RFC does not turn it into N child searches. **Discharges rebuilt `rfc/hint-distance.md` D2 on landing**; that row is its author's to flip
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-foundation-ux/` (once implementing)

## Scope — the obligation this document is bounded to

**This is a cut to a named obligation, not to a landable minimum.** [[D3034]] sent
`shared-resource-register-bootstrap.md` back to its core on the ground that fifteen review rounds
were the shadow-implementation pattern rather than rigour, and set the changed unit of delivery:
*bound the document to the blocking contract instead of continuing to widen it.* This is the second
application. The banned reasoning — "the first visible pixel", "the cheapest real path" — is not
what selected the cut. What selected it is the measured dependent set.

`planning/work-state.json` carries **92** items blocked on this file, more than any other document
in the repository. Reading them splits cleanly:

- **16 are the obligation.** [[D1071]] needs a shared, fact-keyed cache so the complete alternative
  population is compiled once instead of per consumer. [[D1072]] needs a replacement for
  `CandidateFeatureVector` that is a population, retains sealed evidence, and carries no score.
  [[D1385]], [[D1386]], [[D1387]] and [[D1412]] are shipped defects in
  `packages/runtime/src/semantic-evidence.ts` that only a compiled complete population repairs, and
  [[D1388]] is the one report in that group that did not reproduce. [[D1270]], [[D1363]] and
  [[D1373]] are constraints the packet must obey. [[D1503]] is the ledger-numbering convention this
  document follows. [[D1570]], [[D1572]], [[D1573]], [[D1579]] and [[D1580]] are findings about the
  packet's own shape, identity and bound.
- **76 are review debt this document raised against its own author models.** Fourteen fresh-review
  rounds produced findings about registry topology, memo dependency images, queue deadlines,
  retained-graph walkers, stats field counts and test fault factories — none of which any consumer
  waits for, because none of them is production code. **58 of the 92 rows were routed by this
  document alone**, which is the measurement that matters: the document had become the only home
  for defects it manufactured.

Everything in the second group has a named home and a named owner, per [[D1230]] — a deferral
without a home is not a deferral, and a deferral without an owner is a wish:

| cut material | home | owner |
|---|---|---|
| the runtime service and cache: construction seam, closed result/failure algebra, cancellation, cooperative yield, single-flight, queue/deadline/overload bounds, LRU admission and eviction, retained-graph accounting, the stats snapshot | `rfc/candidate-population-service.md` | codex |
| the executable collector topology: the thirteen adapters, dependency-closed scope plans, the per-collector memo, the generated projection dialect, abstention and failure identity | `rfc/candidate-collector-registry.md` | codex |
| fourteen rounds of review history and the pre-cut Status field | `planning/evidence-foundation-ux/candidate-packet-cut-plan.md` | `planning/evidence-foundation-ux/` |

Discharges D11 and D12 hold those two successors so the cut is a routed obligation rather than a
deletion. Neither successor authorises implementation.

```tabiya-claims
none
```

**Why `none`, verified at HEAD, and why it is a finding rather than a convenience.** The packet is
an **in-process compiled value**, not a persisted one, and nothing it adds reaches a versioned
resource. Checked, not assumed:

- **No pack lane.** Packs declare no candidate population; `schemas/drill_pack.schema.json` gains
  nothing. `[V]`
- **No run lane.** The packet is never serialised into a run. Its *consumers* persist — the bot's
  decision record rides `bot-policy.md`'s live-claimed lane 0.18 and the hint's rungs ride
  `hint-distance.md` — and this RFC widens neither. §6.5 refuses a persisted packet outright,
  because the sealed-event brands are a process-local `WeakSet` (`semantic-evidence.ts:54`) and
  JSON that resembles a semantic event is not the event. `[V]`
- **No migration**, for the same reason: an LRU keyed by a content digest is not a table.
- **No shape-entry, principle-entry or campaign lane.**
- **No evidence-kinds member and no F1 projection.** That register governs `EVIDENCE_KINDS` in
  `apps/server/src/sourcing/types.ts:57-65`, the **content-sourcing** union of seven. This RFC adds
  no catalogue projection: the packet is an internal
  execution receipt whose retained events/readings keep their existing exact F1 identities. A
  complete packet contains a position-specific subset of the possible collector vocabulary, so
  declaring the whole vocabulary as one derivation conjunction would be false ([[D1946]]). `[V]`

The precedent is `evidence-move-selector.md` §5's and `bot-route-source.md`'s identical `none` on
identical ground ([[D936]]: a catalogue is not a table). The register row for this draft is added to
`rfc/README.md` **in the registration commit**.

## Summary

Three products need the same fact: **what every legal move from this position does, in registered
evidence terms.** The bot needs it to score a distribution over the complete legal set; the guided
hint needs it at each node of a searched line to say which event a square refers to; Review needs
it as the denominator behind *"you had this and took that."* At HEAD each of the three either
recomputes it, or — worse — **asks its caller for it and believes the answer**.

[[D1072]] falsified the obvious candidate. `candidateFeatureVector` is not a population (it accepts
2 of the initial position's 20 legal moves while its own production test says *"features every
legal candidate"*), does not retain sealed evidence (an eight-field event envelope arrives as
`{source, payload}`), and does not consume the engine dependency it declares (it accepts 900,031 as
a centipawn score). `[V]` This RFC's re-verification found the same three properties intact at
HEAD, **and a fourth defect the dossier did not reach**: the *shipped selection path* has the same
disease in a sharper form. `selectSemanticEvidence` takes the alternative population from a caller
callback, never checks that the events returned for an edge are anchored to that edge, and reports
`evaluatedAlternatives` as a constant rather than a measurement. Measured at HEAD: a caller that
evaluates **nothing** is reported as having evaluated **33 of 33 alternatives**, and the selection
it produces is not merely different but **strictly more flattering** — every played event scores a
`sameFamilyShare` of `0.000`, so two families the complete population *rejects* as
`nothing_distinctive` are admitted instead. `[V]` (`tools/d1071-candidate-packet-harness/population-integrity.test.ts`)

The answer is not to widen the vector. It is a **score-free, provider-free, complete legal-candidate
event packet** compiled from the root position and the shipped move authority, retaining the
original sealed events and keyed by facts alone. Bot scores, hint PVs and Review's played edge are
**three separate exact joins on top of it**, each of which may abstain without touching the packet.
The cache is shared only among consumers injected with the same process-local service (§6.0);
cross-process reuse is neither claimed nor simulated ([[D1572]]).

**Where it sits relative to the two sibling drafts is the question this RFC was commissioned to
answer, and it has a mechanical answer** (§2). `bot-route-source.md` §2.2 established that a
**base** must cover the complete legal set while a **proposer** must not, and that contradictory
coverage obligations mean they cannot be one layer. Both obligations are stated *against a
population neither of them owns*. This packet is that population. It subsumes neither and is
subsumed by neither; it is the object both are measured against, and it is what makes the selector's
coverage identity computable **without an engine**.

## Motivation

**The latency is measured and it is the product, not a micro-optimisation.** Over 229 searched PV
edges, compiling and selecting over the complete alternative population costs **mean 329 ms, p50
354, p95 799, max 939** per edge; the second pass over the same edge, served from the population the
first pass built, costs **mean 38.7, p95 66.5**. `[V]`
(`planning/evidence-foundation-ux/d1066-semantic-horizon-results.json`
`summary.timingMs.horizonColdFirst`, `.compatibilityAfterCache`, both `n: 229`) Lines search **1.79
edges** on average (229 timings over 128 lines), so a cold hint is roughly **600 ms** against
`hint-distance.md`'s declared `{ mode: "interactive", maxMs: 1500 }`. `[V]` An independent
measurement at HEAD on a 34-legal-move middlegame agrees on the shape: **33 alternatives, 3,561
sealed events, ~558 ms** to compile the population once. `[V]`

**And the same population would be compiled up to three times per node without a shared service**:
the bot's selector cache is keyed on policy and session, while the hint and Review operations do
not yet exist at one production boundary. Today only the semantic-check executable calls local
selection; the bot host exists but does not consume this population. The earlier claim that three
live consumers already recompile it was too strong. §6.0 now refuses to count that verification
command as a composition root and defers application lifetime until the first real route consumes
the deliberately unconsumed foundation. `[V]`

**The correctness argument is stronger than the latency one**, and it is the reason this is a
foundation rather than a cache. The R2 distinctiveness rule — *this event is worth showing because
few alternatives also produce it* — is a claim about a **denominator**. At HEAD that denominator is
a number the caller hands in. §3 shows three separate ways the shipped path accepts a false one, all
measured.

**Why now.** [[D1330]] ranked this live-debt 6 and recorded the precise shape of the debt: the
population finding was adopted (`evidence-move-selector.md` §3 takes *"`coverage = |candidates
scored| / |legal moves|` … required to be **exactly 1.0**. Not a threshold — **identity**"*) while
the packet that makes the identity computable was left as a discharge row. Meanwhile
`hint-distance.md` §7 states the same dependency from the other side — *"independent recomputation
per consumer is refused: the shared score-free candidate/event packet is [[D1071]], and Discharge D5
routes it"* — and D5's target column names **this file**. Two accepted-or-drafted documents point at
a document that did not exist.

**Out of scope, each with a named home and a named owner** ([[D1230]] — a deferral without a home is
not a deferral; a deferral without an owner is a wish):

| out of scope | why | home | owner |
|---|---|---|---|
| the bot's score join and its weight fitting | a different mechanism with its own gate; the packet supplies its denominator and nothing else | `rfc/evidence-move-selector.md` §2, §6 | claude |
| the hint's rung grammar, selector and redaction | `hint-distance.md` owns the disclosure ladder; this RFC owns the population underneath it | `rfc/hint-distance.md` | claude |
| Review's module admission, quota and priority policy | `review-evidence-compiler.md` D1 already holds it | `rfc/review-evidence-compiler.md` D1 | `planning/evidence-foundation-ux/` |
| which event families are *stageable* as a hint, and the seven-family table [[D1363]] returned | a selection-policy question about **meaning**; this RFC makes the emitted closure **derived** so the table can be checked, and does not choose its members | `rfc/hint-distance.md` | claude |
| a persisted or cross-process packet | refused, not deferred — §6.5 and §11.5 | — | — |
| Tier-2 variant rulesets | the collectors are standard-chess-shaped and two are defined against the standard back rank ([[D1275]], `evidence-move-selector.md` D3); the packet inherits that limit and does not paper over it | Discharge D6 | codex |
| an engine, tablebase or Explorer join inside the packet | refused, not deferred — the packet is provider-free by construction (§8) | — | — |

## Specification

### §0 — What the research established, what re-verification changed

**Seven corrections against the source material, recorded because a draft that carries a dossier
forward unchecked is not evidence.** Each is verified at HEAD; the first three change what this RFC
specifies.

1. **The dossier's `legalConvention` field already exists and is owned by an accepted RFC.** The
   dossier proposed *"exact legal-move convention id + version"* as a new packet field. At HEAD,
   `rfc/exact-legal-mobility.md` is **accepted** and ships `MOVE_IDENTITY_CONVENTION =
   "chessops-king-takes-rook@1"` and `MOVE_DESTINATION_CONVENTION = "king-landing-square@1"`
   (`packages/runtime/src/legal-moves.ts:9-10`, in-flight in the shared worktree at drafting), plus a
   `rules.mobility.reading.legal_moves@1` projection carrying the complete set. `[V]` The packet
   **consumes** that authority; it does not declare a second convention (§4.2). This is a
   dependency the dossier did not know it had.
2. **The event envelope loses six fields, not five.** The harness asserted five absences (`sign`,
   `id`, `anchor`, `basis`, `derivationInputs`) and [[D1072]]'s ledger row says *"discards five
   source-bearing semantic-event envelope fields."* The sixth is **`evidence`** itself — the sealed
   `DeclaredEvidence` wrapper, which is where the **producer identity** and the `DECLARED` brand
   live (`evidence-contract.ts:358`). `candidate-evidence.ts:171` keeps
   `{ source: evidence.projection, payload: evidence.payload }`, so the projection and the operands
   survive and the producer does not. `[V]` Six lost, two retained, and the two retained ones are
   unbranded copies.
3. **The dossier's *"the only non-test `candidateFeatureVector(` occurrence is its function
   declaration"* is false at HEAD.** Three research harnesses now call it —
   `tools/d1071-candidate-packet-harness/`, `tools/d1162-evidence-head-harness/` and
   `tools/d1162-independent-population-harness/` — and `evidence-move-selector.md` names it in
   `Depends on:`. `[V]` The **substantive** claim survives intact and is what matters: there is
   still **no production caller**, and `EVIDENCE_CONSUMERS`' `opponent.selection` row still declares
   `implementation: "selectMove; opponent-selector; candidateFeatureVector"`
   (`evidence-catalog.ts:875`) while neither `selectMove` nor `opponent-selector` calls it. The
   correction sharpens the finding rather than softening it: the vector now has a **drafted
   consumer** (`evidence-move-selector.md`) whose coverage identity it cannot satisfy without an
   engine call per legal move.
4. **The cold/warm pair is not a controlled A/B of one computation**, and the dossier's *"proving
   caching changes the product"* over-attributes. The instrument times `horizonSelection` first and
   `moduleSelection` second on the same edge
   (`tools/d1066-semantic-horizon-harness/semantic-horizon.test.ts:215-220`); they share the
   `EVENT_CACHE` the first pass fills (`:152-159`) but they are **different selectors doing
   different work**. `[V]` The direction and order of magnitude are sound and the shared quantity —
   the complete alternative population — is genuinely what the cache holds. The exact same-work
   cold/warm figure is **not yet measured**, and criterion 12 owes it rather than inheriting it.
5. **The harness's own legal-move enumerator is not the shipped one, and undercounts.**
   `tools/d1071-candidate-packet-harness/candidate-packet.test.ts:34-41` walks `allDests()` and emits
   one UCI per destination, with **no promotion expansion**; `exactLegalMoves` emits four identities
   per promoting move (`legal-moves.ts:42-46`). `[V]` On the initial position the two agree at 20, so
   the 2/20 finding stands exactly. On any position with a promotion available the harness would
   **understate** the legal population and therefore **understate** the completeness gap it measures.
6. **The returned `hint-distance.md:593` cited this dossier as [[D1330]] rank 5.** It is **rank 6**
   (`planning/platform-alignment/dossier-remainder.md:232`); rank 5 is `theory-drill-current-joins`.
   `[V]` Off by one, in a row that otherwise pointed at exactly the right document. The 2026-08-26
   rebuild removed that stale rank claim and consumes this RFC by name; D4 is discharged.
7. **The ledger head at drafting was D1384, not D1354 and not D1373.** The drafting brief stated
   D1354; an earlier version of this correction stated D1373, which was itself wrong. Re-derived
   from the drafting commit: `git show 3a291abb:design/BACKLOG.md` has a maximum row id of
   **D1384**. `[V]` The correction is retained rather than deleted because *the correction was the
   thing that drifted* — a document whose job is to record what the source got wrong recorded its
   own observation wrong, in the one field it was correcting. [[D1503]] has since retired the D1130
   numbering convention, so the `## Ledger rows` section names no head at all and the proposed rows
   below are unnumbered.

**What the research established and this RFC carries forward unchanged**, each re-verified:

| finding | verified at | status |
|---|---|---|
| the adapter accepts a strict legal subset (2/20 on the initial position; 1/34 in this RFC's own fixture) | `candidate-evidence.ts:195` — the only cardinality check is `length === 0` | intact |
| it accepts arbitrary finite caller bytes as `scoreCp` (900,031 admitted) | `candidate-evidence.ts:198` — `Number.isFinite` and nothing else | intact |
| its `live.stockfish.eval` dependency is declared, never consumed | declared at `evidence-catalog.ts:721`; the declaration adapter checks four operand keys only (`evidence-source-adapters.ts:163`) | intact |
| the sealed envelope has eight fields | `semantic-evidence.ts:69-88` | intact |
| there is no production caller | repository-wide grep at HEAD | intact |

### §1 — The four ways the population is caller-asserted at HEAD

The dossier found one. Re-verification found four, and the three new ones are in the **shipped
selection path**, which is the one with a declared consumer.

**§1.1 — The adapter takes the population from its caller.** `candidateFeatureVector`
(`candidate-evidence.ts:187-220`) validates that each supplied move is legal, unique and finitely
scored, and never asks how many legal moves exist. `[V]` The production test at
`candidate-evidence.test.ts:22` supplies two moves under the sentence *"features every legal
candidate."*

**§1.2 — The selector takes the alternative population from a callback and never checks it against
the edge.** `selectSemanticEvidence` enumerates the alternatives itself
(`semantic-evidence.ts:1011`, which is correct and complete) and then calls
`input.evaluateAlternative(edge)` for each, pushing whatever comes back
(`:1013-1017`). Nothing asserts `event.anchor.moveUci === edge.moveUci`. `[V]` The dedupe at `:1022`
keys on `anchor.moveUci`, which **bounds** the inflation at one per distinct anchor — it does not
refuse it. Measured: answering every alternative with the played edge's own events changes the
selection outright and reports a `sameFamilyShare` of `0.030` (1/33). `[V]`

**§1.3 — `evaluatedAlternatives` is asserted by construction, not measured.** The success path
returns `selectedResult(manifest, policy, alternatives.length, alternatives.length, …)`
(`semantic-evidence.ts:1054`) — the same value twice. Only the `undefined` short-circuit at `:1015`
reports a real count. `[V]` Measured at HEAD: a caller whose `evaluateAlternative` returns `[]` for
every edge is reported as `{ legalAlternatives: 33, evaluatedAlternatives: 33 }`. **The one statistic
that exists to say how much of the population was evaluated cannot say "none."**

**§1.4 — And the unevaluated population is flattering, which is why §1.3 is not cosmetic.** With no
alternative events, every played event scores `share = 0`, so nothing is refused as
`nothing_distinctive` and the alphabetical tiebreak at `:1048` decides. Measured on the same edge:
the complete population selects `derived.pawn.event.transitions:state` and
`rules.structural.event.backward_pawn:gained`; the **empty** population selects
`derived.exchange.capture_class:state` and `derived.material.event.role_asymmetry:state` — two
families the complete population **rejects**. `[V]` A silent failure that produces a weaker claim is
a bug; one that produces a **stronger** claim is the [[D444]] class, and it sits inside the rule
that decides what a learner is shown.

**§1.5 — Two enumerators disagree about which families exist, inside the one function whose job is a
like-for-like comparison.** `localSemanticEvents` (`semantic-evidence.ts:919-922`) composes **ten**
event families including `breadthSemanticEvents` and `semanticDutyEvents`;
`selectLocalSemanticEvidence`'s inline closure (`:1058-1064`) composes **eight**, omitting exactly
those two. `[V]` Both the played events and the alternatives come from the same narrow closure, so
the function is internally consistent and **externally wrong**: measured on the same edge, the
shipped path selects `backward_pawn:gained` + `half_open_file:lost` while the same policy over the
full closure selects `derived.pawn.event.transitions:state` + `backward_pawn:gained`. `[V]` D1066's
harness used the **wide** closure; `apps/server/src/semantic-evidence-check.ts:19-20` — the only
non-test caller in the tree — uses the **narrow** one and asserts `19/19`. The measured reach
numbers and the shipped path are not measuring the same object. This is the mechanism half of
[[D1363]]; the hint-family table it returned is `hint-distance.md`'s to repair.

### §2 — Where this sits: base, proposer, and the population both are measured against

The drafting directive asked whether this subsumes, is subsumed by, or composes with
`evidence-move-selector.md` and `bot-route-source.md`. **It composes beneath both, subsumes neither,
and is subsumed by neither** — and the argument is `bot-route-source.md`'s own, completed.

**§2.1 — The coverage argument names an object it does not own.** `bot-route-source.md` §2.2:

> A base must cover the whole legal set or it is fabricating a distribution … A route source **must
> not** cover the whole legal set … Two layers with contradictory coverage requirements cannot be
> the same layer.

That test is exactly right, and both halves of it are stated **against a legal set that is neither
layer's**. The base's obligation is *cover the population*; the proposer's is *be a proper subset of
the population*; the selector's identity is `|candidates scored| / |legal moves| = 1.0`, whose
denominator is the population. Three obligations, one object, and at HEAD that object is recomputed
independently by each and verified by none.

```text
                 ┌──────────────────────────────────────────────┐
                 │  CandidateEventPopulation  (this RFC)        │
                 │  score-free · provider-free · complete       │
                 └──────────────────────────────────────────────┘
                     │                │                 │
        coverage = 1.0│      proper subset│        exact join│
                     ▼                ▼                 ▼
        evidence base        route proposer      hint / Review
     (evidence-move-selector) (bot-route-source)  (hint-distance /
                                                  review-evidence-compiler)
```

**§2.2 — Against `evidence-move-selector.md`: beneath it, and it is the thing that makes its
identity affordable.** The selector's feature source at HEAD is `candidateFeatureVector`
(named in its `Depends on:`), which **requires a finite `scoreCp` per candidate**
(`candidate-evidence.ts:198`) — its own ledger row records this: *"the selector is **not
engine-free**."* `[V]` So today, reaching `coverage = 1.0` means a Stockfish evaluation for **every**
legal move at every node. The packet splits that: the rules features for all legal moves are
compiled with **no provider at all**, and the score is a separate join that may be partial or absent
(§7.1). The selector's coverage identity then applies to the packet's population — which is
computed, complete and verifiable — rather than to whatever its caller assembled.

**Its Discharge D2 is partially discharged and the remainder is named.** D2
(`evidence-move-selector.md:296`) reads *"The score-free feature family for Tier 2 variants, where no
scoring engine exists."* The **score-free family** is this packet. The **Tier-2** half is not:
the collectors are standard-chess-shaped and two of them are defined against the standard back rank
(that RFC's own D3). [[D1330]]'s summary that *"the packet itself is that RFC's Discharge D2"* is
therefore right about the object and wrong about the scope — correction recorded, and Discharge D6
here carries the variant remainder rather than letting D2 look closed.

**§2.3 — Against `bot-route-source.md`: disjoint, and deliberately so.** A route source's distance
function is *"the count of unsatisfied occupancy requirements"* — pure rules arithmetic over a
declared square set, with **no evidence input at all**. It is the one bot mechanism in the repository
that does **not** consume this packet, and that is a feature: the packet must not become a
prerequisite for a layer that does not need it. The two documents touch at exactly one point — both
state an obligation against the legal set — and that point is where §5.2's runtime refusal (a
proposal set equal to the complete legal set) becomes checkable against a population the proposer
did not supply. **No file, type or line is claimed by both.** The route source's edits are in
`apps/server/src/bot-policy-catalog.ts`; this RFC's are in `packages/runtime/src/semantic-evidence.ts`
and the new runtime packet/cache modules. Landing order is free in both
directions, and no cross-draft pin is required.

**§2.4 — Against `hint-distance.md`: it is that RFC's named dependency.** Its Discharge D5 is *"The
shared score-free candidate/event packet ([[D1071]])"* with this filename in its target column, and
its §7 refuses independent recomputation per consumer. This RFC supplies the population; the rung
grammar, the redaction and the family table stay there. The one thing this RFC hands it beyond the
population is §1.5: the emitted closure becomes **code-derived from the collector registry**, so `hint-distance`'s accepts table can
be asserted set-equal to something rather than hand-listed — which is the mechanism [[D1363]] found
missing.

**§2.5 — Against `review-evidence-compiler.md`: complementary at the denominator.** That RFC
compiles a partial post-game packet of typed evidence for Review modules. Its opportunity/avoidance
items need the *complete legal alternative* set at the played root, which is precisely §7.3's join.
It owns the Review packet; this RFC owns the population its denominators are computed over.

### §3 — `CandidateEventPopulation`: the contract

**§3.1 — Identity and the process receipt** ([[D1570]], [[D1901]], [[D1946]]). The packet is **not an
F1 projection**. It is an internal execution value grouping one complete legal population and the
exact already-declared evidence values emitted for its child positions. F1's
`derivation.inputs` is a conjunction; each `anyOf` member is an alternative conjunction and a
runtime semantic-event seal records the one complete member actually used. A real packet contains
a position-specific subset of the possible 47 event and 22 reading identities. The earlier
three-member declaration therefore compiled only because the manifest checked names and
inheritance: it falsely claimed the entire scope vocabulary occurred in every packet value. No
aggregate projection, adapter, binding, consumer view or future-only opponent admission ships here.

This does not remove evidence authority. `legalMovesInput`, every retained
`SemanticEvidenceEvent`, and every retained `DeclaredEvidence` reading preserve their exact existing
F1 identities and seals. The private packet compiler records their original object references in a
process-only receipt and refuses any packet not minted from those values. Downstream conclusions
must declare the particular values they actually compose; they may not cite the packet container as
if it were evidence. This foundation landing has **zero product consumers**. The existing semantic
verification CLI may exercise the compiler through a contract-only harness, but it is not a route,
learner operation or 1.0 discharge. The first accepted semantic-selection, hint, Review or bot
operation consumes the receipt and declares only its own derived output authority. D9/D10 remain
required roadmap work; implementing this RFC alone cannot close those consumer features.

`CANDIDATE_PACKET_COMPILER_VERSION = 1` is an exported literal and every construction-semantic
change must move it or the cache-identity fixture fails.

```ts
export type CandidateEventsScope = { readonly events: true; readonly readings: false };
export type CandidateReadingsScope = { readonly events: false; readonly readings: true };
export type CandidateWideScope = { readonly events: true; readonly readings: true };
export type CandidatePacketScope = CandidateEventsScope | CandidateReadingsScope | CandidateWideScope;

export type ProjectableCandidateScope<S extends CandidatePacketScope> =
  S extends CandidateWideScope ? CandidatePacketScope : S;

export interface CandidateEventPopulation<S extends CandidatePacketScope = CandidatePacketScope> {
  readonly id: string;                        // digest over the identity fields below
  readonly beforeFen: string;                 // canonical full six-field FEN
  readonly ruleset: "standard";
  readonly scope: S;                          // one of the three closed members above
  readonly legalConvention: {
    readonly id: "rules.mobility.reading.legal_moves";
    readonly version: 1;
  };
  readonly moveIdentityConvention: typeof MOVE_IDENTITY_CONVENTION;
  readonly manifestDigest: string;            // CompiledEvidenceManifest.digest
  readonly compilerVersion: typeof CANDIDATE_PACKET_COMPILER_VERSION;
  readonly legalMoves: readonly ExactLegalMove[];  // the sealed authority's complete set
  readonly candidates: readonly CandidateEventRow[];
  readonly terminal?: { readonly reason: "checkmate" | "stalemate" };
}

export interface CandidateEventRow {
  readonly moveUci: string;                   // exactly one member of legalMoves, same dialect
  readonly afterFen: string;                  // canonical child, derived not supplied
  readonly events: readonly SemanticEvidenceEvent[];   // ORIGINAL sealed values; [] when scope excludes
  readonly readings: readonly DeclaredEvidence<unknown>[]; // ORIGINAL sealed values; [] when scope excludes
  readonly abstentions: readonly CandidatePacketAbstention[];
}

export interface CandidatePopulationRequest<S extends CandidatePacketScope> {
  readonly beforeFen: string;
  readonly ruleset: "standard";
  readonly scope: S;
}

export interface CandidatePopulationReceipt<S extends CandidatePacketScope = CandidatePacketScope> {
  readonly packet: CandidateEventPopulation<S>;
  readonly selectedMember: "events" | "readings" | "events_and_readings";
  readonly manifest: typeof PRIMARY_EVIDENCE_MANIFEST;
  readonly legalMovesInput: DeclaredEvidence<ExactLegalMoveMap>;
  readonly candidateInputs: readonly {
    readonly moveUci: string;
    readonly events: readonly SemanticEvidenceEvent[];
    readonly readings: readonly DeclaredEvidence<unknown>[];
    /**
     * Outcomes for declarations retained by this scope; hidden dependencies are private.
     * `SealedCandidateCollectorOutcome` is defined by `rfc/candidate-collector-registry.md`,
     * which owns collector execution. The packet requires only that every abstention it
     * publishes has exactly one sealed outcome for that row's move and projection.
     */
    readonly collectorOutcomes: readonly SealedCandidateCollectorOutcome[];
  }[];
}

// One generated source: the collector-output vocabulary and the abstention reasons share literal
// id@version keys. The generator resolves every source id through PRIMARY_EVIDENCE_MANIFEST and
// check mode refuses missing, duplicate, stale-version, extra or non-literal output. The registry
// that produces these keys, its per-collector results and its sealed outcomes are
// `rfc/candidate-collector-registry.md`; only the value dialect the packet row carries is here.
import {
  CANDIDATE_COLLECTOR_PROJECTION_KEYS,
  CANDIDATE_PACKET_ABSTENTION_REASONS,
} from "./candidate-population-projections.generated.js";

export type CandidateCollectorProjection = {
  [K in keyof typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS]:
    (typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS)[K][number]
}[keyof typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS];

export type CandidatePacketAbstention = {
  [P in keyof typeof CANDIDATE_PACKET_ABSTENTION_REASONS]: {
    readonly projection: P;
    readonly reason: (typeof CANDIDATE_PACKET_ABSTENTION_REASONS)[P][number];
  }
}[keyof typeof CANDIDATE_PACKET_ABSTENTION_REASONS];

// The compiled service, its result/failure algebra and its cache live in
// `rfc/candidate-population-service.md`. What this RFC fixes is the value the service returns and
// the two operations that mint and re-derive it.

export type CandidatePopulationProjectionResult<S extends CandidatePacketScope> =
  | { readonly kind: "ready"; readonly receipt: CandidatePopulationReceipt<S> }
  | {
      readonly kind: "failed";
      readonly error: {
        readonly code: "invalid_scope_projection";
        readonly source: CandidatePacketScope;
        readonly target: CandidatePacketScope;
      };
    };

interface CandidatePopulationReceiptReferences {
  readonly manifest: typeof PRIMARY_EVIDENCE_MANIFEST;
  readonly packet: CandidateEventPopulation;
  readonly legalMovesInput: DeclaredEvidence<ExactLegalMoveMap>;
  readonly candidateInputs: readonly {
    readonly row: CandidateEventRow;
    readonly events: CandidateEventRow["events"];
    readonly readings: CandidateEventRow["readings"];
  }[];
}

const CANDIDATE_POPULATION_RECEIPTS = new WeakMap<
  CandidatePopulationReceipt,
  CandidatePopulationReceiptReferences
>();

function compileCandidatePopulationReceipt(
  packet: CandidateEventPopulation,
  legalMovesInput: DeclaredEvidence<ExactLegalMoveMap>,
  candidateInputs: CandidatePopulationReceipt["candidateInputs"],
): CandidatePopulationReceipt;

function compileLegalPopulation(beforeFen: string): Readonly<{
  legalMovesInput: DeclaredEvidence<ExactLegalMoveMap>;
  legalMoves: readonly ExactLegalMove[];
}>;

export function assertCandidatePopulationReceipt(
  value: unknown,
): asserts value is CandidatePopulationReceipt;

export function projectCandidatePopulationReceipt<
  S extends CandidatePacketScope,
  T extends ProjectableCandidateScope<S>,
>(receipt: CandidatePopulationReceipt<S>, scope: T): CandidatePopulationProjectionResult<T>;
```

`compileLegalPopulation` is module-private and has exactly one source call. It calls
`createRulesMobilityReadingLegalMovesV1Evidence(beforeFen)`; that projection-specific factory validates the FEN,
invokes `exactLegalMoveMap` exactly once, seals the returned payload and accepts no caller-supplied
move map. The compiler then freezes
`legalMovesInput.payload.pieces.flatMap(piece => piece.moves)`. `flatMap` allocates only the flat
container; it does not copy a move object. The service builds every packet row from that returned
declaration and has no import or call to either legal enumerator. A separately enumerated list or
field-equal map is not a legal factory/compiler input even when its UCI set is equal.

`compileCandidatePopulationReceipt` is module-private and the only receipt constructor. It closes over the
exact imported `PRIMARY_EVIDENCE_MANIFEST`, requires `packet.manifestDigest` and every retained
event/reading assertion to agree with that object, then checks that `packet.legalMoves` is the exact
flat array returned by `compileLegalPopulation` and that every member is reference-identical to one
member of `legalMovesInput.payload.pieces[].moves`; equality by UCI or fields is insufficient. It
then freezes the receipt. It stores the exact
manifest/packet/legal/event/reading references in the module-private `WeakMap`, and returns the
opaque execution value. `assertCandidatePopulationReceipt` requires a map entry and then checks the
receipt still points to the exact primary manifest, packet, legal input, candidate rows and retained
event/reading arrays recorded at construction. A caller-compiled manifest, forged digest or event
asserted against a different valid manifest therefore cannot enter a packet. The sealed per-collector
outcome that proves each row's abstentions, and the dependency-closed execution record behind it, are
`rfc/candidate-collector-registry.md`'s; the packet requires only that every abstention it publishes
is one the registry sealed for that row's move and projection.

`projectCandidatePopulationReceipt` first asserts the source receipt and then checks the literal
partial order `events_and_readings → {events_and_readings, events, readings}`, `events → events`,
`readings → readings`. Events-only→readings-only and readings-only→events-only fail
`invalid_scope_projection` before an id, packet, or receipt is constructed; the generic overloads
make those crossed calls compile-time errors without treating types as the runtime seal. A valid
projection performs no chess work, retains the same legal/event/reading member references permitted
by the target scope, constructs a new frozen packet/id and calls the same private constructor to
mint a distinct receipt. It never copies a `WeakMap` entry or brands an arbitrary object. The runtime authority proves only “this
compiler created and still recognizes this exact receipt in this process”; it is not an F1
derivation receipt and is never persisted.

Each retained semantic event/reading remains individually admitted through its existing F1 or
semantic-event constructor. The aggregate is never declared or admitted as evidence. An events-only receipt does not retain readings and a
readings-only receipt does not retain events. The
legal-move input remains position-rules/exact and each retained evidence value keeps its own
grounding, exactness, confidence and abstention rather than being laundered into one aggregate
label. Runtime negatives forge the receipt, mismatch selected member/scope, replace one retained
input by an equal rebuild, or remove a retained reference; they fail the packet compiler's receipt
assertion. Every receipt reader accepts `unknown` or re-asserts even a statically typed value at its
boundary; the TypeScript interface alone is not treated as a seal. Scope narrows which retained
inputs appear in a value. The possible-input vocabulary is a code-derived registry and migration
guard, never a claim that all members fired in one position.

**§3.2 — What a caller may supply and what it may not.** A caller supplies exactly the closed
`CandidatePopulationRequest<S>`: **`beforeFen`**, literal **`ruleset:"standard"`**, and a literal
**request scope** (§3.4). The service injects
manifest, compiler and convention identities. The caller may not supply `afterFen`, `legalMoves`, any event, any event sign, id,
anchor, basis or derivation input, or any reading. Every one of those is derived by the compiler
from the root and the legal-move authority. This is the whole of the repair: the population stops
being an argument and becomes an output. Criterion 1.

**§3.3 — Completeness is reference ownership plus set equality, not a count.** The compiler first
establishes that `packet.legalMoves` is the frozen flat container returned from the one sealed map
payload and that each member is the same object retained under
`legalMovesInput.payload.pieces[].moves`. It then asserts that
`candidates.map(row => row.moveUci)` is **set-equal** to `legalMoves.map(move => move.uci)` — same
cardinality, no duplicates, no omissions, no extras, order irrelevant to meaning. It is asserted
against the authority's output, not against a number ([[D1240]]: a criterion asserts set equality
against a derivation, with integers baked only as drift tripwires). Criterion 2.

**Empty is legal exactly for a no-legal-move rules terminal.** A zero-candidate packet is valid only
for checkmate or stalemate and requires that exact reason. A non-terminal root with zero candidates
is a truncation and fails with a typed error; `OpponentSelector.select` currently handles it by
throwing from a different layer (`opponent-selector.ts:491-493`, *"Opponent selection requires a
non-terminal position"*). `[V]`

Draw adjudication is a separate run/rules result and never changes this factual population
([[D1631]]). Insufficient-material positions retain every legal move and carry no `terminal` field.
The fifty-move rule uses clock/history policy outside the packet; repetition necessarily uses move
history. Two histories with the same canonical full FEN may therefore share a packet while having
different repetition state. Fixtures cover king-versus-king, a halfmove-clock claim position and a
repeated position: in all three, candidate set equality still holds and adjudication is neither
stored nor inferred here. Criterion 3.

**§3.4 — Request scope, and why it is not a completeness escape.** `CandidatePacketScope` is the
closed three-member union above; `{events:false, readings:false}` is unrepresentable. A consumer may
request `{ events: true, readings: false }` (the hint and Review),
`{ events: true, readings: true }` (the bot's feature family) or
`{ events: false, readings: true }`. **Scope selects which evidence families are retained in each
candidate row; it never selects which candidates exist and it never deletes a dependency needed to
compute a retained output.**

A scope's execution plan — which declarations run, in what order, and which of them are hidden
dependencies retained only privately — is `rfc/candidate-collector-registry.md`'s contract, and so is
the rule that no collector callable ever receives `scope`. What this RFC fixes is the consequence:
for the same root and the same compiler/manifest versions, an output executed under more than one
plan has the same canonical projection identity and the same evidence payload.
Request order may change
cache hits, never factual bytes.

The candidate set is always complete. Scope is part of the cache identity (§6.1) so a narrow packet
is never served to a consumer that needs the wide one. A cached wide packet may satisfy a narrow request only by a
deterministic no-chess projection that returns a **new frozen packet with the narrow scope and its
own narrow `packetId`**, retaining the same legal-move and evidence object references while replacing
the excluded arrays with frozen empties. This counts as a cache hit and not as a compilation.
The complete permitted relation is literal: wide may project to wide/events/readings; events may
project only to events; readings may project only to readings. A narrow receipt has discarded the
other family and cannot manufacture it by projection. The generic type and runtime relation in
§3.1 enforce the same table independently. Criterion 4.

### §4 — The legal-move authority, and the dialect that has already bitten twice

**§4.0 — V1 is explicitly standard-only ([[D2103]]).** Every typed request carries the literal
`ruleset: "standard"`; runtime validation of `unknown` occurs before FEN parsing, key construction
or `exactLegalMoves`. Any other or missing value returns `unsupported_ruleset` and creates no job or
cache entry. The literal is part of `packetId`, the packet receipt and the collector context. This
does not make Chess960 a malformed FEN or silently interpret it as standard chess. Tier-2 support
remains D6 and must introduce a registered ruleset authority through the request, legal compiler,
key and every affected collector before another literal becomes admissible.

**§4.1 — One authority and one value graph.** The service calls
`createRulesMobilityReadingLegalMovesV1Evidence(beforeFen)` once. The route is the sole evidence factory for this
projection: it accepts the FEN rather than a payload, calls `exactLegalMoveMap` once, seals that
exact returned object and derives no second value. The compiler derives `legalMoves` by flattening
`legalMovesInput.payload.pieces[].moves` without copying move objects. The accepted authority
enumerates four promotion identities per promoting move (`legal-moves.ts:42-46`) where a bare
`allDests()` walk enumerates one. `[V]` The packet compiler is a consumer of the exact evidence
factory, not another enumerator: it imports neither `exactLegalMoveMap` nor `exactLegalMoves`, and
the receipt rejects a separately enumerated equal list or copied move. This preserves semantic
completeness, exact value identity and one computation.

The retired public adapter `declareExactLegalMovesEvidence(payload: ExactLegalMoveMap)` is replaced
by the already-pinned value-authority route
`createRulesMobilityReadingLegalMovesV1Evidence(fen: string)`. Runtime validation rejects a
non-string before the authority runs. The route's output remains
`DeclaredEvidence<ExactLegalMoveMap>` and retains the
exact frozen payload returned by the authority. This is a source-factory correction, not a weaker
validator: callers lose the ability to propose bytes for validation. Existing payload-mutation
tests become compile/runtime refusal tests at the input boundary; map integrity remains covered by
the exact-mobility authority's permanent ordinary, pin/check, castling, en-passant, promotion and
terminal fixtures.

**The single authority is measured, not aesthetic ([[D2428]]).** On the current production symbols,
six positions (ordinary, castling, promotion, middlegame, pawn endgame and terminal), 20 warm-up
rounds and 100 measured rounds produced median **0.029465 ms/position** for one authority
computation and **0.080278 ms/position** for the current compiler-plus-validating-adapter path:
**2.724×**. `[V]` This is a local author measurement, not a release latency promise; its purpose is
to show that the duplicate trust path is measurable work before a single candidate collector runs.
Reproducer: `make candidate-packet-d2428-measurement`. Criterion 36 binds one factory call to one
internal authority call and the same declared object graph.

**§4.2 — The convention is retained, not re-declared.** `legalConvention` is the versioned id of
`rules.mobility.reading.legal_moves@1` and `moveIdentityConvention` is `MOVE_IDENTITY_CONVENTION`
verbatim. A packet compiled under one identity convention and read under another is a different
packet — §6.1 puts both in the key. This is §0's first correction made structural.

**§4.3 — The committed move is a member, and this is a real difference from the shipped
enumerator.** `legalAlternativeEdges` deliberately **excludes** the committed move
(`semantic-evidence.ts:972`, `if (canonical !== committed)`), which is correct for a counterfactual
denominator and wrong for a population. Measured: 34 legal moves, 33 alternatives. `[V]` The bot
needs a row for the move it is about to play; Review needs a row for the move that was played. So
the packet contains **all** legal moves and each consumer derives its own exclusion:
`alternatives(packet, playedUci) = packet.candidates.filter(row => row.moveUci !== playedUci)`, with
the played row available beside it. Criterion 5 asserts both directions from one packet.

**§4.4 — Engine dialect conversion happens outside the packet.** The packet is in
`MOVE_IDENTITY_CONVENTION` throughout. An engine that speaks `e1g1` is converted **at the engine
boundary and normalised back before use** — the repair D1084's instrument already found and
`bot-route-source.md` Discharge D8 already routes. `[V]` The packet does not accept a second dialect
and does not normalise on ingest; a caller presenting a foreign-dialect UCI gets a typed error naming
the convention. Criterion 6.

### §5 — Retention: what survives the packet, and what may not be reconstructed

**§5.1 — Sealed events are retained as the original values.** `events[]` holds the
`SemanticEvidenceEvent` objects `localSemanticEvents` returned — **the same object references**, not
copies, so `assertSemanticEvidenceEvent` (`semantic-evidence.ts:956-961`) still passes on them. All
eight envelope fields survive: `id`, `projection`, `evidence` (with its producer and its `DECLARED`
brand), `derivationInputs`, `anchor`, `sign`, `operands`, `basis`. `[V]` This is the direct repair of
§0's correction 2: six fields the vector drops, retained. Criterion 7 asserts the assertion passes on
every retained event and that all eight keys are present, including `evidence.producer`.

**§5.2 — Reconstruction is not retention, and the seal is not what stops it.** A consumer that needs
a sign, an anchor or a producer reads it; it does not recompute it.

**An earlier draft said the seal enforces that, and it does not. Executed at HEAD:** `[V]`

```text
RECONSTRUCTION REJECTED BY SEAL? false     (sameRef: false, sameId: true)
```

`SEMANTIC_EVENT_VALUES` is a `WeakSet` (`semantic-evidence.ts:55`) and
`compileSemanticEvidenceEvent` **adds every value it produces to it** (`:952`). A "reconstruction" is
just another call to that function, so the rebuilt object is a WeakSet member on the same line that
created it and `assertSemanticEvidenceEvent` (`:956-961`) passes on it. There is no unbranded state
for the seal to catch: the brand is minted by the act of rebuilding.

**And it is worse than merely permissive — asserting an event mints a second sealed twin.**
`assertSemanticEvidenceEvent` calls `compileSemanticEvidenceEvent` at `:959` to recompute `id` and
`basis` for comparison, and that call runs `:952`, so **every assertion adds a fresh object to the
WeakSet**. A hot path that asserts once per event per request grows the sealed-value population by
one object per assertion. They are unreachable and therefore garbage-collectable, so this is not a
leak — but it means the WeakSet is not, and has never been, a record of "values the compiler
originally produced". It is a record of "values the compiler has ever produced, including during
verification".

**What the seal actually guarantees, stated at its real strength.** `SEMANTIC_EVENT_VALUES` proves
one thing: the object was produced by `compileSemanticEvidenceEvent` against *some* manifest, rather
than hand-built or JSON-parsed. That is a real and useful guarantee — it is exactly what stops a
caller from asserting a plain object literal into a consumer — and it is **not** an identity
guarantee. Two structurally identical events compiled from the same inputs are indistinguishable to
the seal, by construction.

**So the retention rule is enforced by reference identity, not by the seal.** The packet holds the
same object references `localSemanticEvents` returned (§5.1), and the rule is:
`packet.candidates[i].events[j]` **is** (`===`) the value the compiler produced. A row admitting a
different object — even a byte-identical, correctly sealed one — is refused by the packet's own
admission check, because the packet is the thing that knows which value it compiled and the WeakSet
is not. Criterion 8 tests that check, and tests it against a **rebuilt, sealed, passing** event, which
is the only fixture that distinguishes the two mechanisms.

**§5.3 — The emitted closure is derived, and the sample only measures it** ([[D1574]]). The set of
projections a packet may carry is the **declared** set: the collector composition joined against
`PRIMARY_EVIDENCE_MANIFEST`, resolved to literal `id@version` keys. It is not inferred from a
fixed-position census. A rare or newly added projection that never fires in a sweep is still in the
closure, and a census that misses it is reporting prevalence rather than schema — which is exactly
the confusion [[D1574]] returned. The census stays, as a separate governance instrument reporting
observed prevalence and cost.

The executable registry that carries those declarations — the thirteen adapters, their outputs,
their dependencies and their per-candidate invocation cardinality — is
`rfc/candidate-collector-registry.md`. This RFC requires only that the closure be **code-derived**
and that the packet refuse any projection outside it (§8.2, criteria 9 and 16).

**§5.4 — The narrow closure is repaired, not tolerated.** `selectLocalSemanticEvidence`'s inline
eight-family closure (`semantic-evidence.ts:1058-1064`) is replaced by a packet read, so the played
events and the alternative population come from the one compiler. The measured consequence is that
`semantic-evidence-check.ts:20`'s assertion changes what it is asserting over; the check is updated
in the same change and its `19/19` becomes a set-equality against the packet rather than two
integers. Criterion 10, which is **red before the change and green after**.

### §6 — Cache identity, invalidation, single-flight, and the bound

**§6.0 — Ownership and process boundary** ([[D1572]]). `CandidatePopulationService` owns one
`CandidatePopulationCache`; neither is a module singleton. That service is defined by
`rfc/candidate-population-service.md`; what this section fixes is the ownership rule it must obey,
because [[D1572]] is a finding about *who owns the cache*, not about how it evicts. This
foundation-first landing compiles packets and has **zero application composition roots and zero
product consumers**. The existing
`semantic-evidence-check.ts` remains a verification command over current production symbols; it is
not rewritten and not counted as product reach. Contract/performance harnesses construct isolated
services with explicit limits. The first accepted bot, Guided Hint, Review or semantic-selection
operation constructs one application-owned service and injects that same instance into every
packet consumer landing with it.

A browser or second server process compiles its own derived result. This RFC refuses packet
serialization and therefore claims no cross-process packet reuse. Implementing this lower layer
closes only its foundation discharges; roadmap and acceptance receipts must continue to report
Support/Review/bot consumption as missing until those later operations land.

The eventual owning application/process composition root is the cache lifetime: exit/restart clears it,
deployment instances do not coordinate it, and account/run deletion has nothing to invalidate
because no learner/session term enters the key. A future production operation reaching the compiler
without the one injected application service fails its consumer-operation census; it may not
instantiate an ad-hoc cache per request.

The service's callable shape, its closed result and failure algebra, its cancellation and yielding
model, and its bounds are `rfc/candidate-population-service.md`. This RFC fixes what that service is
allowed to return and what its cache is allowed to be keyed on — §6.1 through §6.5 — and nothing
about how it executes.

**§6.1 — The key is facts only.**

```text
packetId = digest(
  canonical full six-field FEN,
  legal-convention id@version,
  move-identity convention,
  compiled-manifest digest,
  packet-compiler version,
  ruleset = "standard",
  request scope
)
```

**Selection policy is not in the packet key, and neither is a seed, a profile, a band, history or a
session.** That statement applies only to the factual packet. The complete cache hierarchy is
literal and no layer may drop an input owned by the layer below ([[D1632]]):

1. **Factual packet:** the `packetId` tuple above.
2. **Provider exchange:** the provider RFC's complete normalized request identity and receipt. For
   Maia this includes `startFen + historyUci[]`, model/band, temperature, top-p, requested width and
   requested model identity; actual model/generation remains acquisition provenance. For Stockfish
   it includes exact FEN, requested engine/version and bound, while actual generation is captured
   inside the exchange and checked for retained admission.
3. **Policy result:** `packetId + provider receipt/response digest + policyConfigDigest + profile
   id/version/digest + targetElo + pack/repertoire identity + seed` and every other literal input
   named by the compiled policy layers.

A selected hint is a separate derivation keyed by `packetId + exact PV/provider receipt +
selection-policy digest`. Two move orders reaching an identical full FEN may share the factual
packet while producing different Maia exchanges and policy results. Provider/history identity is
not “contamination”; it simply belongs above the provider-free fact layer. Criterion 11.

“Position” in this RFC means **identical canonical full six-field FEN**, not board-equivalent
transposition. Halfmove/fullmove bytes survive in event anchors and ids, so packets that differ in
either byte are intentionally different even when placement/castling/en-passant fields match. The
cache repairs history-shaped duplication only when two histories reach the same full FEN; it does
not claim all move-order transpositions share an entry ([[D1573]]).

**§6.2 — The shipped cache is the counter-example, and it is a defect at HEAD.**
`selectionCacheKey` (`opponent-selector.ts:264-278`) is
`[policyConfigDigest, targetElo, profile.id, profile.version, profile.digest, packId, seed,
sha256(startFen + every history move)]`. `[V]` **Corrected ([[D1388]]/[[D1413]]): the last term IS positional** —
a start position plus every history move determines the position, so the earlier "no positional
term" reading was wrong and is retracted. What survives is that the one shipped key conflates
three layers: it cannot share the factual packet across histories, yet its history hash is
necessary for the Maia exchange and must remain in that provider/policy identity. Board-equivalent
positions whose clock fields differ remain different factual packets. The final cache is also
**unbounded** — `#cache` is a plain
`Map` (`:469`) with no LRU, no TTL and no eviction anywhere in the class; `cacheSize()` (`:506`)
reports the growth and nothing acts on it. `[V]` Single-flight is present and correct (the promise is
stored before resolution and deleted on rejection, `:495-503`) and is the pattern §6.3 keeps.

This landing does not replace that cache while no production evidence-bearing bot profile can reach
it. Discharge D10 requires the first accepted bot landing to replace it with a bounded
`OpponentSelectionCache`. Provider execution first yields the same-exchange acquisition/delivery
from `provider-exchange-and-execution`; only then can the policy-result key be constructed. Cache
lookup therefore cannot precede provider identity unless a retained exact provider result supplies
that receipt. The future final cache keeps single-flight, entry/weight bounds and rejection
deletion; a packet hit never implies a provider or selection hit.

**§6.3 — Single-flight and a real bound are required; their mechanism is the successor's.** Packet
construction is single-flight per key, and the in-flight promise is deleted on rejection so a failure
is not memoised — the pattern §6.2 shows the shipped selector already gets right. The cache is
bounded; it is never an unbounded `Map`. **No memory defaults are published here**: `8 / 56,000`
described an obsolete visible-item weight, and carrying either number forward would turn an old
measurement into a new claim ([[D1579]]). The Node-24 record at
`planning/evidence-foundation-ux/d1579-candidate-packet-node24-envelope.json` — 37,804 events adding
52.28 MB heap, 6,629 readings raising the same eight-entry cache to 91.78 MB — is retained as
evidence that equal visible-item weights fail, not as calibration.

The cache is bounded independently by **entry count**, **complete retained logical UTF-8 bytes**
(`maxRetainedLogicalBytes`) and **unique retained object count** (`maxRetainedObjects`); all three
are explicit composition-root inputs.
No public-packet serialization or visible event/reading coefficient
is an admissible substitute for measuring the retained graph. Exactly
one retained-root descriptor names the measured top-level fields and derives every category
selector from those same rows, so an added reference field fails root-set closure until it is
categorized rather than being silently unmeasured ([[D2657]]–[[D2659]]). How that graph is
traversed, and how eviction and oversize behave, are
`rfc/candidate-population-service.md`'s to specify and to measure. [[D1580]] remains
separate: no release tier declares a numeric heap/RSS envelope, so a deterministic cache bound is
necessary and does not manufacture release clearance.

**§6.4 — Invalidation is by key, never by mutation.** A change to the manifest digest, the legal
convention, the move-identity convention or the compiler version produces a **new key**; the old
entry is missed and eventually evicted. No compiled packet is ever edited. **Provider state cannot
invalidate a packet**, because a packet has no provider input (§8) — provider-off invalidates or
abstains the dependent *join* and leaves the population untouched. Criterion 21. (An earlier draft
pointed this section at criterion 14, which is about the claims decision and says nothing about
invalidation; §6.4 had no criterion at all.)

**§6.5 — Process-local, and a persisted form is refused rather than deferred — re-argued on
something true.** An earlier draft rested this refusal on §5.2's false premise: that a rebuilt event
fails the seal. It does not (§5.2), so "the seals do not survive serialisation" proves nothing about
a persisted packet — a reader could deserialise and re-run `compileSemanticEvidenceEvent`, and the
result would pass `assertSemanticEvidenceEvent` exactly as an original does.

**The true reason is that re-sealing across a process boundary re-seals against a *different*
manifest, and nothing in the seal notices.** `compileSemanticEvidenceEvent` takes the manifest as its
first argument and checks the event against *that* manifest's declarations; `assertSemanticEvidenceEvent`
then rebuilds against whatever manifest **its own caller** passes and compares `id` and
`evidenceDigest(basis)` (`:959-960`). So a persisted packet is admissible exactly when the reading
process's manifest agrees with the writing process's — and **the packet's stored `manifestDigest` is
the only thing that could establish that**, which means the guarantee has to come from a receipt, not
from the seal. Concretely, a cross-process form needs three things this RFC does not specify:
a serialised receipt carrying every literal source digest, a re-seal on admission that compares the
receipt's `manifestDigest` to the reading process's compiled digest **before** rebuilding, and a typed
refusal when they differ. Until someone writes that RFC, JSON that resembles a semantic event is not
the event — **not because the seal rejects it, but because nothing has checked what vocabulary it was
sealed against.** §11 item 5 records this as a refusal with its exit named.

### §7 — Three consumer handoffs, with provider behavior held by their owners

Each future join takes the packet plus **one declared input family** (one complete legal-root table
for the bot, one PV table for Hint, one played edge for Review). This foundation exports only the
provider-free packet/service shapes; each handoff type lands with its real accepted dependency. It implements, executes and accepts
none of their provider operations, score/loss algebra, selection, deadlines, or abstention
behavior. Those are D9/D10 and the named consumer RFCs' acceptance work.

**§7.1 — The bot score handoff is deferred whole, not half-imported ([[D2098]]).** This provider-free
landing exports only `CandidatePopulationReceipt`. It creates no `candidate-score-handoff.ts`,
imports no provider-exchange type, and publishes no local restatement. The provider RFC is returned
and its exact `ProviderEvidenceDelivery<T, K>` type does not exist in production; compiling a
one-argument imitation here would make the dependency fiction part of the runtime API.

D10 owns the handoff after provider exchange is accepted and implemented. At that point it must
import the exact two-argument delivery type with operation id
`"stockfish.legal_root_table"`, retain the complete admitted `live.stockfish.legal_root_table@1`
item, require request FEN/ruleset/move convention and row set equality with this packet before
reading a score, and declare the downstream value over the exact retained inputs. It also owns the
closed cp/mate loss algebra, `root_side_to_move` frame, mixed-domain abstention, aggregate deadline,
cancellation, real profile/route and final bounded policy cache. These are D10 acceptance clauses,
not foundation exports or tests. Per-child searches remain refused without a separately
preregistered horizon/batching/latency study.

**The packet remains the exact legal population; the future table is a measured score source.** The
future provider operation may use `MultiPV=N searchmoves` only after independently enumerating the exact legal
set and requires set equality on return. A bare caller-chosen MultiPV list can never substitute for
the packet or legal authority. A downstream bot may project a capped scored subset, but that value
is marked `evaluated_subset` and may not support a complete-scored-alternative claim.

**§7.2 — The semantic-horizon hint.** Inputs: the packet at each searched PV node, plus one sealed
versioned PV. Output: one operator-only, relation-safe occurrence retaining exact search, packet,
edge, source-occurrence, actor and target identities. `hint-distance.md` then compiles a separate
family/rung disclosure whose lower bytes cannot contain the move. Abstains when the PV is absent or
illegal, when a packet is missing, when the measured family/sign/relation selector finds no eligible
occurrence, or when the budget expires. The immutable D1397 receipt—not the superseded D1066 range—
is the drift authority: strict-direct 10/64 in both arms; qualified root-followup 16/64 depth-12 and
10/64 at 100 ms; 35/150 admitted occurrences and zero opponent admissions.

**§7.3 — Review opportunity and avoidance.** Inputs: the packet at the played root, plus the sealed
played edge. Output: the played event and the **literal** alternative denominator — `|candidates| −
1`, computed rather than asserted (§4.3). Abstains when the played edge or the complete population is
absent. This is the join that makes §1.3's defect unreachable: the denominator is a property of a
compiled object, so there is no argument for a caller to get wrong.

**§7.4 — The route source is explicitly not a consumer**, per §2.3. Recorded so that a future reader
does not treat the packet as a universal bot prerequisite.

### §8 — Provider independence, and the engine dependency that is declared but not consumed

**§8.1 — The packet has no provider input, and that is a product property.** No engine, no Maia, no
tablebase, no Explorer, no LLM. Local rules evidence stays available when every provider is off,
which is the availability floor `design/05-in-run-experience.md` §5's rung-0 split depends on. The
packet also carries **no** score, rank, salience, selected event, prose, trait or grade: those are
derivations, and keeping them out is what lets one population serve three opinions.

**§8.2 — The one live provider leak, and its repair.** `CANDIDATE_COLLECTOR_IDS`
(`candidate-evidence.ts:67-70`) is the union of the tactical and breadth collector id lists, and
`human.maia.candidate_wdl` is a member of the tactical list (`evidence-catalog.ts:166`). `[V]` The
manifest's own declared input set filters it out with an explicit comment — *"Maia WDL is an
alternative provider evaluation, not a local collector result"* (`evidence-catalog.ts:706-710`) — so
**the runtime admission set is wider than the declared one**, and the closure guard at
`candidate-evidence.ts:168` would admit a Maia declaration into a supposedly local vector. Nothing
produces one today, which is why this has never fired. `evidence-move-selector.md`'s ledger row found
the same member from the other side. The packet's closure is the **declared** set, derived from
§5.3's collector composition and manifest join; the census measures only prevalence. Criterion 16
is the must-fail fixture: a Maia WDL declaration offered to the
packet compiler is refused.

**§8.3 — Candidate scoring consumes the measured complete root table; Review keeps its distinct
node-free point** ([[D1571]], [[D1576]], [[D1903]]). The current defect is unchanged:
`derived.opponent.candidate_feature_vector@1` declares
`dependsOn: [ref("live.stockfish.eval"), …]` and `derivation.anyOf` requiring
`live.stockfish.eval` with each collector (`evidence-catalog.ts:721-722`), while its declaration
adapter checks four operand keys and nothing else (`evidence-source-adapters.ts:163`) and its
constructor accepts any finite number (`candidate-evidence.ts:198`). `[V]` This is the
undeclared-input class caught for runtime opening identity at [[D1018]], live in an operator
projection.

The provider RFC owns two deliberately distinct Stockfish sources. Candidate scoring consumes
`live.stockfish.legal_root_table@1`: one fixed-depth, all-legal request whose normalized row set is
equal to the exact legal authority, carrying a complete
future `ProviderEvidenceDelivery<StockfishLegalRootTable, "stockfish.legal_root_table">` in the
`root_side_to_move` frame after that type lands. This is the
operation D969 actually measured. `live.stockfish.position_eval@1` remains a node-free White-frame
single-position source for Review and other point consumers; this RFC no longer fans it out once per
child.

The vector becomes a derivation of the packet plus one admitted delivered legal-root table. A
caller-invented score is rejected unless it is a row of the retained table whose request FEN,
move-identity convention, legal set, engine identity, generation and bound match the packet and
delivery. Criterion 17 is the must-fail fixture: `scoreCp: 900031` with no admitted table fails; an
equivalently large **typed centipawn** row in a valid complete table succeeds because the gate checks
provenance/domain, not plausibility. A mate row never enters a cp field; mixed domains abstain as
§7.1 states.

`review-evidence-compiler.md`'s node-scoped `derived.review.eval_point@1` still derives from
`live.stockfish.position_eval@1` plus `run.record.position@1`; it does not fake a node id and does
not create a second score authority. The two sources share scheduler/acquisition machinery, not
payload semantics. Replacing the one-root candidate source with N child requests requires new
research and a new amendment rather than being hidden behind “same bound.”

### §9 — Surface boundary, law 8, and the LLM

**§9.1 — The full packet is operator-only.** It contains every legal alternative, so it can disclose
moves even though it ranks nothing. It is never sent to a learner surface. A learner receives only
the admitted derived module item allowed by `preset ∩ ceiling ∩ role ∩ availability`; the advanced
inspector may name the **sources of that item** and does not dump the population. Criterion 18.

**§9.2 — The law-8 line, and where it falls.** Law 8 forbids LLM-manufactured chess truth. The packet
contains **no chess truth to manufacture**: every row is *this legal move produces this position, and
these registered projections fired on it*, each sealed with its own grounding and exactness. There is
no goodness, no ranking, no salience and no valence. `SemanticEvidenceEvent.valence` is optional and
**`compileSemanticEvidenceEvent` never sets it** (`semantic-evidence.ts:952-956`) `[V]`; the packet
retains whatever the event carries and originates none, which keeps the [[D1270]] grounded-only
ruling intact by construction rather than by policy.

**§9.3 — The LLM is not a consumer.** It may render a sealed selected item **after** a deterministic
module has fixed the event, the operands and the disclosure stage. It may not read the packet to
choose what seems interesting — that is `design/05` §3b-i's *"the voice, never the source"* stated as
an access rule. Criterion 19 asserts no renderer path reaches the packet.

### §10 — What ships, what is held, and by whom

Priced at the full ask ([[D1230]]).

**Ships in this RFC, complete:** the process-sealed neutral packet receipt and its set-equality
completeness assertion; the checkmate/stalemate terminal distinction and explicit adjudication
separation; the request-scope vocabulary and the immutable wide-to-narrow projection; the
legal-authority and dialect rules; original sealed-event retention by reference; the requirement that
the emitted closure be code-derived, plus the separate prevalence/cost census and `make
candidate-closure-census`; the closed `CandidatePopulationRequest`; the facts-only cache key and the
invalidation rules; the Maia-leak repair; the `selectSemanticEvidence` input repair and the
`evaluatedAlternatives` fix, exercised as a verification contract only; the narrow-closure repair;
and the operator-only and LLM boundaries. The shipped foundation has zero product consumers and
claims no Support, Review or bot feature completion.

**Cut to two successors, not dropped** (§Scope): the service execution model and cache mechanism
(`rfc/candidate-population-service.md`, Discharge D11) and the executable collector registry
(`rfc/candidate-collector-registry.md`, Discharge D12). This RFC cannot be implemented alone —
neither can it be reviewed alone into another fourteen rounds.

**Held, and the holds are not mine.**

1. **Tier-2 variant rulesets (codex, Discharge D6)** — two collectors are defined against the
   standard back rank, and `evidence-move-selector.md` D3 already owns that repair. V1 now refuses
   every ruleset except literal `standard` before FEN/legal compilation; D6 must thread a real
   variant authority through the whole registry before another member is admitted.
2. **The end-to-end latency and memory acceptance (claude, Discharge D2)** — the dossier's own handoff item 8,
   and §0's correction 4 shows why it cannot be inherited from D1066: that pair is not a controlled
   cold/warm measurement of one computation. The number this RFC owes is its own.
3. **Selection-policy registration for the hint (claude, `hint-distance.md`)** — the only shipped
   policy is `research.r2_candidate@1`, `disposition: "experimental"`
   (`evidence-catalog.ts:974-979`). `[V]` A production hint policy is that RFC's to declare; the
   packet serves whichever policy is registered.
4. **Bot score-join behavior, production admission and final-policy caching (`bot-policy.md` / `bot-roster.md` /
   `evidence-move-selector.md`)** — the catalogue is empty today. Those accepted RFCs must name the
   concrete profile, bind its normal request to truthful derived outputs, compose one legal-root provider
   request under an aggregate deadline, and repair the final history/provider/policy cache. A test
   profile is not a substitute. This RFC lands only the neutral receipt and typed root-table handoff;
   it does not manufacture a dormant vector or future-only admission.
5. **First product consumption (`hint-distance.md`, `review-evidence-compiler.md` or the accepted
   bot path)** — the owner ruled the evidence foundation first because later packs, analysis,
   Support and bots all consume it. That authorises the lower primitive to land unused, not to
   masquerade as a feature. D9/D10 and the roadmap remain open until a real route/operation binds
   exact retained values and its own output authority.

**None of these narrows the mechanism**, and none of them is a size argument.

### §11 — What this RFC refuses, at mechanism level

1. **Widening `CandidateFeatureVector` into the shared layer** — [[D1072]], measured. It is not a
   population, it does not retain sealed evidence, and it couples rules-only facts to an engine and a
   search budget. The existing vector is retired by D10 in favor of truthful per-value outputs;
   this RFC supplies only the population receipt and join input (§8.3).
2. **Any caller-supplied population, anywhere.** Not as an optimisation, not behind a flag, not for
   tests. §3.2, criterion 1.
3. **MultiPV as the legal population** — a scored search output with a caller-chosen `N`. §7.1,
   criterion 15.
4. **Selection policy, seed, band, profile or session in the packet key** — §6.1. This is the
   distinction between a fact and an opinion, expressed as a cache identity; the shipped selector
   cache (§6.2) is what the alternative looks like.
5. **A persisted or cross-process packet** — §6.5. Refused with its exit named: a serialised receipt
   with a re-seal on admission that compares the receipt's `manifestDigest` against the reading
   process's compiled digest **before** rebuilding, in its own RFC. **Not** refused on the ground
   that the seal rejects a rebuild — it does not (§5.2).
6. **Any provider inside the packet** — §8.1. Engine, Maia, tablebase, Explorer and LLM are all joins,
   and every one of them may be off while the packet still compiles.
7. **A distance, salience, valence, rank or grade field** — §9.2. There is nowhere to put one, which
   is the enforcement.
8. **Lifecycle state on a position key** — [[D1373]]'s rule, adopted verbatim: *"the position key may
   cache only position-derived"* facts. A packet is position-derived; nothing about a run, a route
   age, a rewind or a learner may be stored under its key.
9. **Reconstructing a sealed event instead of retaining it** — §5.2. **Not** because the
   reconstruction is unbranded: it is correctly branded and passes `assertSemanticEvidenceEvent`
   (executed). Because the packet's guarantee is *"this is the value the compiler produced for this
   candidate"*, and only reference identity carries that; a rebuild also defeats the cache the packet
   exists to be.

### §12 — Implementation surface

[[D1575]] removed the false six-file target: the old table counted a tool as production, omitted the
adapter/barrel and left a server-private readings authority below a runtime compiler. The table below
is the minimum symbol migration **for the contract this RFC still owns**; criterion 20 derives the
touched production set and checks every listed symbol moved exactly once rather than rewarding a hand
count.

| # | file | change |
|---|---|---|
| 1 | `packages/runtime/src/candidate-population.ts` (new) | the compiler: consumes `createRulesMobilityReadingLegalMovesV1Evidence` from the implemented predecessor without re-owning it; set-equality completeness; terminal and scope rules; the **moved** one-authority `candidateChildReadings`; sealed-value retention by reference; the private `WeakMap` receipt authority, its assertion and the wide→narrow projector (§3–§5) |
| 1a | `packages/runtime/src/candidate-population-projections.generated.ts` (new) | one generated frozen `as const` collector→versioned-key map plus projection→reason map; the packet's public identity and abstention unions derive from these literal bytes |
| 2 | `packages/runtime/src/semantic-evidence.ts` | selection accepts and runtime-asserts a packet receipt instead of a callback; both enumerators consume one code-derived closure; counts become measurements (§1.2–§1.5, §5.4) |
| 3 | `packages/runtime/src/index.ts` | public packet/receipt/scope/readings contracts; no consumer deep-imports source files |
| — | `tools/candidate-closure-census.mjs` (new; governance tool, **not production**) | code-derived schema arm plus prevalence/cost arm (§5.3) |
| — | `tools/generate-candidate-packet-projections.mjs` (new; generator/checker, **not production**) | resolves source-family ids through the compiled manifest, emits the one literal versioned-key/reason authority and fails check mode on byte, version or set drift |

`packages/runtime/src/candidate-population-cache.ts` and `packages/runtime/src/cooperative-yield.ts`
are **not** in this surface. They are `rfc/candidate-population-service.md`'s, and the registry module
that populates the generated map is `rfc/candidate-collector-registry.md`'s. This RFC's compiler is
constructed by whichever service that successor defines; it does not define one.

Named validation and docs sites that necessarily move (the [[D828]] discipline — named, not implicit,
and not additional implementation homes): `apps/server/src/semantic-evidence-check.ts` (§5.4's
assertion), `packages/runtime/src/semantic-evidence.test.ts`,
`packages/runtime/src/candidate-population.test.ts`,
`packages/runtime/src/evidence-catalog.test.ts`, `apps/server/src/evidence-manifest.test.ts`,
`docs/evidence-contract.md`, `docs/semantic-evidence.md`, and `Makefile`.

`packages/runtime/src/evidence-factories.ts` is a **read-only dependency**, not an implementation
surface: `evidence-value-authority` lands and owns
`createRulesMobilityReadingLegalMovesV1Evidence` before this RFC. The packet imports that exact
barrel-exported symbol. Its implementation diff must not touch the factory file, recreate deleted
`evidence-source-adapters.ts`, add a same-purpose wrapper/alias, or import either legal enumerator
below the factory ([[D2468]], [[D2625]], [[D2842]]). Criterion 36 checks the source graph and the
changed-file set rather than trusting this statement.

**No `schemas/` or `packages/schema/` file changes**, which is what makes the `none` claim failable
rather than aspirational — criterion 14.

### §13 — Where each finding is specified

Rows this document still answers. Every other row it once carried is named in §Scope's cut table and
lives in a successor.

| ledger row | finding | specified in | made failable by |
|---|---|---|---|
| [[D1071]] | the complete alternative population is recompiled per consumer and costs more than the engine request | §Motivation, §6.0–§6.1 | criteria 11, 12 |
| [[D1072]] | `CandidateFeatureVector` is not a population, drops sealed evidence, and admits arbitrary caller bytes | §0, §1.1, §11.1 | criteria 1, 2, 7, 17 |
| [[D1385]] | `evaluatedAlternatives` is a constant, and an unevaluated population is **flattering** | §1.3–§1.4, §7.3 | criterion 10 (red before, green after) |
| [[D1386]] | two shipped enumerators disagree on the event closure and select different evidence | §1.5, §5.3–§5.4 | criteria 9, 10 |
| [[D1387]] | `selectSemanticEvidence` never checks an alternative's events against the edge they were supplied for | §1.2, §3.2 | criteria 1, 5 |
| [[D1388]] | the reported `selectionCacheKey` positional defect **does not exist** and is retracted | §6.2 | criterion 11 (the key's real defect is that it is history-shaped and unbounded) |
| [[D1412]] | `SEMANTIC_EVENT_VALUES` does not distinguish a rebuild from the original, and asserting an event mints a second sealed twin | §5.2, §6.5 | criterion 8 (a rebuild that *passes* the seal) |
| [[D1270]] | grounded only — rules and outcomes, and the owner authors nothing | §9.2 | criterion 18; `valence` has nowhere to be originated (§11.7) |
| [[D1363]] | the seven-family hint table is a selection-policy question about meaning | §Motivation out-of-scope table | not a packet criterion; `hint-distance.md` owns it, and §5.3 makes the closure checkable |
| [[D1373]] | a position key cannot store a history-dependent route age | §11.8 | criterion 21(b) |
| [[D1570]] | the packet named an F1 projection without an honest value-level evidence contract | §3.1 | criterion 22: no aggregate evidence projection ships; exact constituents retain authority |
| [[D1572]] | one cache for three consumers had no execution topology or owner | §6.0 | criterion 23 |
| [[D1573]] | scope/key/transposition claims conflicted | §3.4, §6.1 | criteria 4, 11 |
| [[D1574]] | a fixed-position census was treated as the emitted schema | §5.3 | criteria 9, 16 |
| [[D1575]] | the six-file target omitted the server-private readings authority and production entries | §12 | criterion 20 |
| [[D1576]] | Review's run-node-bound engine point could not represent a hypothetical candidate honestly | §8.3 | Discharge D8; not a foundation acceptance arm |
| [[D1579]] | "retained item" is not a memory-homogeneous unit | §6.3 | criterion 12 refuses to inherit a default; the bound itself is D11 |
| [[D1580]] | no release tier declares a numeric memory envelope | §6.3 | criterion 12's closing clause keeps the release decision red |
| [[D1631]] | the terminal algebra contradicted the complete-legal-set invariant | §3.3 | criterion 3 |
| [[D1959]] | the "process-sealed receipt" had only an erased type brand and no runtime constructor or assertion | §3.1 | criterion 22: a private `WeakMap` constructor authority, a runtime assertion, and an asserted wide→narrow minting path |
| [[D1980]] | the public projector claimed wide→narrow while its type accepted every source/target pair | §3.1, §3.4 | criterion 4: `ProjectableCandidateScope` plus the runtime partial order and a typed `invalid_scope_projection` result |
| [[D1632]] | a naive opponent-cache rekey would collide history-conditioned Maia requests | §6.1 | criterion 11 |
| [[D1902]] | the claimed live bot consumer was reachable only through a test-created profile | §6.0, §10 | criterion 23 + Discharge D10 |
| [[D1945]] | either of two future packet bindings could be deleted while F1 orphan closure stayed green | §3.1 | criterion 22 |
| [[D1946]] | the scope-wide derivation members treated the complete possible vocabulary as simultaneously present | §3.1, §5.3 | criterion 22 |
| [[D1947]] | `createApplication` was assigned a semantic service with no caller or route | §6.0, §12 | criterion 23 |
| [[D1958]] | the replacement first consumer is a verify-only hard-coded CLI, not a product operation | §6.0, §10 | criterion 23: zero product consumers claimed |
| [[D1978]] | held provider work was required by the provider-free foundation's own acceptance | §7.1, §10, §12 | criteria 15, 17 fence the absence; D10 owns all behavior |
| [[D2098]] | the provider-free landing imported an unavailable wrong-arity provider type | §7.1, §12 | criteria 15, 17 |
| [[D2103]] | a FEN-only request could not enforce the variant refusal | §4.0 | criterion 27 |
| [[D2428]] | the "one exact-map call" criterion required two calls at the production symbol | §4.1 | criterion 36 |
| [[D2468]] | the repair invented an exact-legal-move factory alias its dependency forbids | §4.1, §12 | criterion 36's source-graph negative |
| [[D2625]] | the required dependency deletes a file the packet claimed to implement | §12 | criterion 36's changed-file set |
| [[D2842]] | the predecessor-factory control retained an unbranded F1 lookalike | §4.1 | criterion 36 |

## Deviations from design

**None.** `design/05-in-run-experience.md` §5 asks for exactly this split — *"That is one hard problem
only if you keep it as one. Split it and most of it falls to rung 0"* — and this RFC is that
sentence in code: rung-0 rules facts compiled once and provider-free, with significance left to
separate opinionated derivations. §3b-i's *"the LLM is the voice, never the source"* is enforced as
an access rule in §9.3 rather than restated as prose. No design statement is widened, narrowed or
contradicted.

## Acceptance criteria

> **Cross-review 2026-08-23 — [[D1412]] repaired 2026-08-24.** Reproduced by execution at HEAD: `RECONSTRUCTION REJECTED BY SEAL? false` (`sameRef: false`, `sameId: true`), and `assertSemanticEvidenceEvent` calls `compileSemanticEvidenceEvent` at `semantic-evidence.ts:959`, which runs `SEMANTIC_EVENT_VALUES.add` at `:952` — so asserting an event does mint a second sealed twin. §5.2 is re-argued on **reference identity** (the packet knows which value it compiled; the WeakSet does not), §6.5 and §11 item 5 are re-argued on **manifest-vocabulary agreement** instead of on the false premise, and criterion 8's parenthetical is inverted back: identity is compared **by reference**, and a byte-identical correctly-sealed rebuild is the fixture. Criterion 14 now names C1–**C8**, criterion 6 is re-pointed from the compiler to the packet readers that actually take a caller UCI, and criteria 5 and 12 are given tree states that make them red.

> **Cross-review 2026-08-23.** [[D1385]] — `evaluatedAlternatives` cannot differ from `legalAlternatives` on the main path, and the unevaluated case selects two families the complete population rejects. [[D1386]] — the selector's inline event closure composes eight families where `localSemanticEvents` composes ten. [[D1387]] — alternative events are never checked against the edge they were supplied for. [[D1388]] — the reported `selectionCacheKey` positional defect does not exist.

**These are the criteria for the contract this document still owns.** The original numbering is
preserved so that every existing citation from `hint-distance.md`,
`evidence-move-selector.md`, `bot-policy.md` and `planning/evidence-foundation-ux/` still resolves.
Ten criteria moved with their mechanism; they are listed after the surviving set and are not
re-litigated here. Every criterion below names the concrete tree state that makes it fail —
an unfailable criterion is a named defect class in this repository ([[D444]], [[D984]], [[D1274]]).

1. **The population is never an argument.** A fixture attempting to supply `candidates`,
   `legalMoves`, `afterFen`, or any event or reading to the packet compiler **fails to type-check**
   (`.typecheck.ts`), and no runtime predicate is the enforcement. *Wrong implementation that would
   pass a weaker check: one that accepts a caller population and validates it.*
2. **Completeness is set equality against the retained exact-map payload, not a count.** A fixture
   calls `createRulesMobilityReadingLegalMovesV1Evidence(beforeFen)` once, asserts the route invokes
   `exactLegalMoveMap` once, and asserts every
   `packet.legalMoves[i]` is reference-identical to the corresponding member obtained by flattening
   `legalMovesInput.payload.pieces[].moves`, then asserts `candidates.map(r => r.moveUci)` set-equal
   to `packet.legalMoves.map(m => m.uci)` on
   ordinary, check-evasion, castling, en-passant and **promotion** positions. Must-fail fixtures: one
   omitted move, one duplicate, one extra, one wrong child FEN, and a separately enumerated
   field-equal legal list whose members have different object identities. The promotion case is required
   because §0's correction 5 shows a plausible enumerator that silently drops three of four
   identities. Integers appear only as drift tripwires.
3. **Terminal and truncated are distinguishable.** A checkmate root yields zero candidates **with**
   `terminal.reason`; a non-terminal root yielding zero candidates fails with a typed error. *Fails
   if the two are represented the same way.* Stalemate is the other zero-row reason. King-versus-
   king, fifty-move-eligible and repetition-history fixtures retain their complete non-empty legal
   populations and carry no packet terminal/adjudication field; two repetition histories may share
   one packet. A non-empty packet carrying `terminal` fails; `insufficient_material`,
   `fifty_move`, `repetition` and `variant_end` are absent from the terminal union.
4. **Scope narrows evidence, never candidates.** A fixture asserts all three scopes produce identical
   `candidates.map(r => r.moveUci)`, that a narrow packet is not served for a wide request, and that a
   wide packet projects to satisfy a narrow one **without chess recomputation** as a distinct frozen
   packet with the narrow scope/id and reference-identical retained members. The false/false scope
   and both crossed events-only→readings-only/readings-only→events-only calls fail to type-check;
   runtime-forged crossed pairs return `invalid_scope_projection` before constructing an id or
   receipt. Same-scope narrow projection remains valid and reference-preserving.
   *Concrete RED: a compiler that filters candidates by scope rather than filtering the evidence
   families retained in each row — the three scopes then disagree on `candidates.map(r => r.moveUci)`
   and completeness is scope-dependent, which is the escape §3.4 exists to close.* The dependency-closed
   execution plan behind each scope is criterion 35, in `rfc/candidate-collector-registry.md`.
5. **One packet serves both the played row and the alternative denominator — compared on `(moveUci,
   afterFen)` pairs, not on cardinality.** The cardinality arm alone **cannot fail**:
   `alternatives = candidates.filter(row => row.moveUci !== playedUci)` makes
   `|alternatives| = |candidates| − 1` an arithmetic consequence of criterion 2's set-equality, and
   `legalAlternativeEdges` independently derives its comparison population
   (`semantic-evidence.ts:968`), so a moveUci-only comparison largely restates criterion 2. What *can* differ
   is the **child FEN and the canonical dialect**, because `legalAlternativeEdges` re-canonicalizes
   every uci through `canonicalMoveUci` (`:971`) and computes its own `afterFen` by a separate
   `position.play` path (`:977-978`), while the packet derives both in its compiler. So: from a
   single packet, a fixture derives Review's alternative set and the bot's played row, and asserts
   the packet's `(moveUci, afterFen)` **pair set** is set-equal to `legalAlternativeEdges`' pair set
   **plus** the played edge's pair — on an ordinary root, a **castling** root (where
   `canonicalMoveUci` is the transform that could diverge) and a **promotion** root (four identities
   per promoting move). *Concrete RED: a compiler that retains `exactLegalMoves`' raw `uci` where
   `legalAlternativeEdges` retains the canonicalized form — the pair sets diverge on the castling
   root while cardinality stays equal, which is the dialect defect §4 says has already bitten twice.
   Second RED: a compiler that derives `afterFen` by a different play path — the pair sets diverge
   on the promotion root.*
6. **The dialect is closed at the readers, which are the only things that take a caller UCI.** An
   earlier version of this criterion presented a foreign-dialect UCI **to the compiler** — but §3.2
   gives the compiler no move parameter at all (a caller supplies `beforeFen` and a request scope),
   and criterion 1 makes supplying one a type error, so the fixture tested an input criterion 1
   forbids and could never run. The surface that really takes a caller UCI is the **packet readers**:
   `alternatives(packet, playedUci)` (§4.3) and Review's played-row lookup (§7.3). So: a
   foreign-dialect castling UCI (`e1g1` where `MOVE_IDENTITY_CONVENTION` says `e1h1`) passed to
   either reader fails with a typed error naming the convention, and is **not** silently normalised
   on ingest (§4.4); the 960 degenerate case from `exact-legal-mobility` (`g1h1` where the king's
   semantic destination equals its origin) resolves to its row. *Concrete RED: a reader that calls
   `canonicalMoveUci` on its argument before looking it up — it succeeds on `e1g1`, which is exactly
   the "normalise on ingest" §4.4 refuses, and the criterion catches it.*
7. **Sealed events survive whole.** For every retained event, `assertSemanticEvidenceEvent` passes,
   every required envelope key is present, **including `evidence`, and `evidence.producer` is
   present**. If a future event carries optional `valence`, reference identity proves it survives
   too; the criterion does not falsely require `Object.keys` to remain exactly eight forever.
   *Fails if the packet copies or re-wraps events — §0's correction 2 made failable.*
8. **Reconstruction is refused, by reference identity — and the fixture is a rebuild that *passes*
   the seal.** A must-fail fixture rebuilds an identical event with `compileSemanticEvidenceEvent`
   from the retained bytes of an original, asserts the rebuild **passes**
   `assertSemanticEvidenceEvent` and has the same `id` and `basis` digest, then admits it to a packet
   row and asserts the packet refuses it as not being the value it compiled. *Wrong implementation
   that would pass a weaker check: one whose admission test is `assertSemanticEvidenceEvent`, or a
   digest comparison, or `SEMANTIC_EVENT_VALUES.has` — **all three accept the rebuild** (executed at
   HEAD: `RECONSTRUCTION REJECTED BY SEAL? false`), so only a `===` comparison against the compiled
   value goes red.* The parenthetical in the earlier draft — *"fails if identity is compared by
   digest rather than by seal"* — was inverted: the seal is the weaker of the two, and comparing by
   seal is the defect this criterion catches.
9. **The closure is code-derived; the sample only measures it** ([[D1574]]). The packet's permitted
   projection set is derived from the collector composition joined against the compiled manifest and
   resolved to literal `id@version` keys; the generator rejects a missing id, a wrong version, a
   duplicate key, an extra key or a non-literal output. `LOCAL_CANDIDATE_READING_PROJECTION_KEYS` is
   separately set-equal to the twenty child readings plus legal exchange and fork survival. The
   population census reports observed prevalence, is allowed to miss members, and retains its 41/67
   control as proof that sampling is not schema. Ordinary, capture, double-attack and abstention
   fixtures prove projection-identity multiset equality before and after migration. *Concrete RED: a
   closure built by unioning the projections observed across the census positions — it compiles, it
   passes every fixture drawn from that same sweep, and it silently drops a projection production can
   still emit, which is exactly the defect [[D1574]] returned.* The registry that supplies those
   declarations, and its per-member positive/negative fixtures, are criteria 32 and 34 in
   `rfc/candidate-collector-registry.md`.
10. **The two enumerators become one, demonstrated against the old behaviour.** A fixture on
    `r2q1rk1/pp2bppp/2n1bn2/2pp4/3P4/2N1PN2/PP2BPPP/R1BQ1RK1 w - - 0 10` playing `d4c5` asserts that
    `selectLocalSemanticEvidence` and the same policy over the full closure select the **same**
    families after the change and **different** ones before it, and that a selection whose
    alternatives were never evaluated reports `evaluatedAlternatives: 0` rather than the legal count.
    *Red before, green after — this is §1.3's and §1.5's repair, together.*
11. **The three cache identities do not collapse.** Two requests differing **only** in seed,
    profile digest, band, history, session
    or selection policy produce the **same** `packetId` and one compilation; two differing in FEN,
    manifest digest, legal convention, move-identity convention, compiler version or scope produce
    different ids. Two histories reaching byte-identical canonical full FEN share; two FENs differing
    only in halfmove/fullmove counters do **not**, because their anchors differ. Two histories with
    the same packet id produce distinct Maia provider identities and cannot share a policy result;
    identical complete provider receipts plus identical policy inputs do share one bounded final
    result. *Fails if a policy/provider term leaks into the packet key, if history is dropped above
    it, or if a packet hit is treated as a provider/policy hit.*
12. **End-to-end cold and warm latency is measured on *one* computation, and the record proves it.**
    No threshold is baked — a threshold here would be invented rather than measured — so the
    criterion is failable on the **shape and provenance of the record**, which is the property
    §0's correction 4 says D1071 lacked. The recorded artifact must exist at the path Discharge D2
    names and must carry: the cold figure, the warm figure, the machine declaration, the procedure,
    the D1071 baseline cited **as a different measurement**, and — the load-bearing field — the
    **`packetId` of each run, asserted equal**. *Concrete RED, and it is the exact defect being
    corrected: a recorded pair whose two runs carry different `packetId`s is two computations, not a
    cold/warm pair, which is what `tools/d1066-semantic-horizon-harness/semantic-horizon.test.ts:215-220`
    did by timing `horizonSelection` and `moduleSelection` as if they were one. Second RED: an
    artifact with figures and no procedure — a number with no way to reproduce it is not a
    measurement.* The Node-24 receipt at
    `planning/evidence-foundation-ux/d1579-candidate-packet-node24-envelope.json` is retained as the
    historical negative: its visible-item formula can report equal or zero weight for materially
    different retained graphs. It cannot supply a default.
    The retained-graph rerun that would propose numeric cache defaults is criterion 13, in
    `rfc/candidate-population-service.md`. The receipt does **not** call the result release-cleared;
    [[D1580]] keeps that decision red until F12 names a numeric resource-tier predicate. This splits a
    buildable bounded mechanism from an unavailable release threshold instead of inventing one.
14. **The claims decision stays true at implementation time, and C8 is named because it is the check
    a `none` claim needs.** `register-check` **C1–C8** green with this RFC's claims block reading
    `none`, **and** an assertion that the implementation touched no file under `schemas/` or
    `packages/schema/`. The tool runs eight checks (`tools/register-check.mjs:366-375`); an earlier
    version of this criterion named C1–C7 and so omitted **exactly the one that fires on this RFC's
    risk**: C8 fails when a schema file's bytes differ from the digest the register was reconciled
    against **and no live claim declares the resource** (`register-check.mjs:66-84`). With a `none`
    claims block, `claimed.has(resource)` is false for every resource, so C8 is the only check that
    catches a schema byte-change smuggled in under this RFC. *Concrete RED: edit one byte of any
    `schemas/*.schema.json` during implementation — C1–C7 stay green and C8 fails, which is the whole
    point.* *Forces renegotiation in the register rather than a silent widening.*
15. **The held score join has zero foundation API or behavior here ([[D2098]]).** An AST/source
    census asserts there is no `candidate-score-handoff.ts`, provider-exchange import, local
    `ProviderEvidenceDelivery` restatement, join constructor, provider call, score/loss
    implementation, vector, profile, operation or consumer. D10 waits for implemented provider
    types and then owns the exact two-argument delivery, scored-table set equality,
    `evaluated_subset`, frame/loss algebra and complete-alternative behavior tests.
16. **The Maia leak is closed.** A `human.maia.candidate_wdl` declaration offered to the packet
    compiler is refused, and the packet's permitted closure is asserted set-equal to
    the scoped union of `LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS` and
    `LOCAL_CANDIDATE_READING_PROJECTION_KEYS`, not to `CANDIDATE_COLLECTOR_IDS` or a position sample.
17. **Future provider behavior cannot become a foundation false-green.** The foundation contract
    verifies that all behavior named in §7.1—exact delivery type/operation, legal-root set equality,
    `evaluated_subset`, score/loss algebra, mate ordering, acquisition checks, aggregate deadline and
    zero child searches—is enumerated in Discharge D10 and absent from this RFC's implementation
    target. No provider type or fixture is credited toward foundation acceptance.
    D10 cannot discharge until its real production profile/route crosses every enumerated arm.
18. **Operator-only, demonstrated.** A fixture asserts no learner-role surface receives a packet, and
    that the advanced inspector's item names sources without enumerating candidates.
19. **No renderer path reaches the packet.** A fixture asserts the LLM/renderer boundary receives only
    sealed selected items, and a must-fail fixture attempts to pass a packet to it.
20. **The implementation surface is derived, not targeted.** An AST receipt proves every §12 symbol
    has one production definition, `childReadings` has been deleted and replaced by the exported
    runtime authority, no runtime file imports `apps/server`, no consumer deep-imports the new source
    modules, each named production row has its named definition, and the product-consumer count is
    exactly zero. The governance CLIs are not counted as product consumption. Any extra production
    file is named in the receipt rather than hidden to preserve a total. *Concrete RED: an
    implementation that also lands `candidate-population-cache.ts` or a collector registry module —
    the receipt names files §12 does not, and the criterion fails rather than quietly re-absorbing the
    two successors.*
21. **Invalidation is by key and never by mutation, and provider state cannot reach it** (§6.4 — the
    section that had no criterion). Four arms. **(a)** A compiled packet is frozen: a fixture asserts
    every mutation attempt on a served packet throws in strict mode, and that the cache never hands
    out a value it later edits. **(b)** Changing any one of the six key terms — manifest digest,
    legal convention, move-identity convention, compiler version, FEN, scope — produces a **different
    `packetId`** and a fresh compilation, with the old entry still intact until eviction rather than
    overwritten. **(c)** Turning every provider off and on again produces the **same** `packetId` and
    the **same** cache hit, since a packet has no provider input (§8.1). **(d)** A dependent join
    abstains under provider-off while the packet it read is unchanged and still served.
    *Concrete RED for (b): an implementation that mutates a cached packet's `manifestDigest` in place
    on a manifest change — the id stops identifying the bytes and (a) fails too. Concrete RED for
    (c): any provider term leaking into the key, which is criterion 11's defect seen from the
    invalidation side.*

22. **The packet does not counterfeit an aggregate evidence identity.** A repository contract fails
    if `derived.candidate.event_population`, an aggregate packet adapter, a packet consumer binding
    or a `ConsumerEvidenceView<CandidateEventPopulation>` appears. The process receipt selects the
    member from scope, retains the exact legal/event/reading input references and refuses a forged
    receipt, equal rebuild, member/scope mismatch or removed retained input through the private
    `WeakMap` assertion. A wide→narrow fixture proves the projector first asserts the wide value,
    retains exact permitted references and mints a distinct recognized receipt through the private
    constructor. A semantic-selection contract fixture proves any later selected event is one of
    the original values already bound to `research.semantic_selection@1`. A negative manifest fixture demonstrates why the withdrawn
    scope-wide conjunction is not a value proof: a legal quiet root emits only a strict subset of
    the code-derived possible vocabulary while the same static tuple still compiles.
23. **One service owns one process-local factual cache, and this landing claims no product consumer.**
    The source census asserts `createApplication`, routes, `OpponentSelector`, Support, Review and
    web code have zero packet-service imports; `BOT_POLICY_PROFILES` remains empty. The verification
    CLI may exercise the symbols but is explicitly classified as a contract instrument. A
    repository assertion refuses a module singleton and ad-hoc `new CandidatePopulationCache()`
    inside request handlers. A separately constructed service compiles independently and makes no
    cross-process reuse claim. D9/D10 remain open and the 1.0 roadmap refuses to count packet
    implementation as their discharge.
    Crossing every result arm against cache publication — invalid request, truncation, collector
    failure, scheduler rejection, overload, deadline, closure, cancellation and waiter semantics — is
    criterion 23's second half and moved with the algebra to
    `rfc/candidate-population-service.md`. What stays failable here is the consumer census. *Concrete
    RED: an implementation that constructs the service inside `createApplication`, or that adds a
    module-level singleton so the CLI can reach it without injection — [[D1947]]'s defect exactly.*
24. **The factual cache never stores consumer authority.** The cache entry and service return type
    carry only `CandidatePopulationReceipt` inside the `ready` result; neither contains a consumer id, binding, view or
    rendered item. Every packet reader runtime-asserts the receipt and rejects a raw packet. A repository
    assertion fails on `ConsumerEvidenceView<CandidateEventPopulation>`, packet admission helpers or
    an `opponent.selection` packet binding. Future operations share the neutral receipt and own
    their truthful output admissions separately.
25. **Convention and compiler version remain closed in the receipt.** Compile-time negatives reject
    any move convention other than `typeof MOVE_IDENTITY_CONVENTION`, any compiler version other than
    `typeof CANDIDATE_PACKET_COMPILER_VERSION`, and a projection/reason pair not present in
    `CANDIDATE_PACKET_ABSTENTION_REASONS`. *Concrete RED: widening either field to `string` or
    `number` — [[D1961]]'s defect — which compiles and lets a packet built under one convention be
    read under another.* The generator's check mode, the abstention/outcome bijection and the
    available-empty fixture are criteria 25b, 29 and 31 in `rfc/candidate-collector-registry.md`.
27. **Ruleset identity is admitted, not inferred ([[D2103]]).** All three typed requests require
    `ruleset:"standard"`; missing/Chess960/unknown runtime values return `unsupported_ruleset`
    before FEN, job or cache construction. The literal survives packet/receipt/key/collector context.
36. **One sealed exact-map object owns the flat population ([[D2389]], [[D2428]]).** Instrument the
    projection-specific factory and assert one `createRulesMobilityReadingLegalMovesV1Evidence(beforeFen)` call and
    exactly one internal `exactLegalMoveMap(beforeFen)` call. Assert the adapter retains that exact
    returned object as its payload and that the packet's frozen flat array
    contains the exact move-object references reachable from `legalMovesInput.payload.pieces`.
    Both legal enumerators are absent from the product factory/compiler import graph. An object,
    equal rebuilt map and wrong FEN type are rejected as adapter inputs before authority execution.
    A packet-internal negative rebuilds every move as `{...move}`: its fields and UCI set remain
    equal, but receipt compilation returns `invariant_failed: "receipt"`. A second negative calls an
    independently instrumented enumerator with equal output and is rejected for the same reason.
    These negatives must fail by source boundary or identity, not by order, fields or cardinality.
    The implementation changed-file set excludes predecessor-owned `evidence-factories.ts`; the
    production import graph contains exactly one packet import of its exact registered factory,
    contains no recreated `evidence-source-adapters.ts`, same-purpose wrapper/alias or packet-side
    factory definition, and contains no `exactLegalMoveMap`/`exactLegalMoves` import below that
    boundary. This is an executable source-graph negative, not a comment convention.

**Moved criteria.** Each keeps its number in its successor so nothing that cites it breaks.

| criterion | subject | home |
|---|---|---|
| 13 | single-flight, entry/byte/object bounds, eviction, oversize, FIFO admission and deadlines | `rfc/candidate-population-service.md` |
| 26 | the public construction seam and the product factory's refusals | `rfc/candidate-population-service.md` |
| 28 | registry-closed collector failure identity | `rfc/candidate-collector-registry.md` |
| 29 | sealed abstention authority and the outcome bijection | `rfc/candidate-collector-registry.md` |
| 30 | one manifest owns packet identity and retained values | `rfc/candidate-collector-registry.md` |
| 31 | every result is projection-addressed | `rfc/candidate-collector-registry.md` |
| 32 | the thirteen-row registry compiles and executes its declared topology | `rfc/candidate-collector-registry.md` |
| 33 | closed public support types and the stats snapshot | `rfc/candidate-population-service.md` |
| 34 | one literal projection dialect | `rfc/candidate-collector-registry.md` |
| 35 | dependency-closed scope plans without widened retained output | `rfc/candidate-collector-registry.md` |

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Repair the shipped `OpponentSelector` cache as the bounded third-layer policy cache: retain the complete Maia/provider receipt (including history/model/generation), then join packet id plus every compiled policy input; never substitute packet identity for provider identity (§6.2) | codex | `planning/evidence-foundation-ux/` | |
| D2 | Measure end-to-end cold and warm latency on **one** computation and record it beside the D1071 baseline as a distinct measurement, with both runs' `packetId` asserted equal (§0.4, criterion 12). The retained-graph rerun that would propose numeric cache defaults moved to D11 with its mechanism | codex | `planning/evidence-foundation-ux/d1579-candidate-packet-node24-envelope.json` plus the implementation graph receipt | historical pre-implementation envelope discharged 2026-08-26; complete-graph calibration remains open until production symbols exist |
| D3 | Register a production hint selection policy; only `research.r2_candidate@1` exists and it is `disposition: "experimental"` (§10 hold 3) | claude | `rfc/hint-distance.md` | |
| D4 | Correct the returned `hint-distance.md:593` [[D1330]] rank citation (§0.6) | codex | rebuilt `rfc/hint-distance.md` | discharged 2026-08-26 |
| D5 | Fold the packet's population into `review-evidence-compiler.md`'s opportunity/avoidance denominator when that RFC implements (§2.5) | claude | `planning/evidence-foundation-ux/` | |
| D6 | Tier-2 variant support: the collectors are standard-chess-shaped and two are defined against the standard back rank; this is `evidence-move-selector.md` D3's repair, and the packet inherits it (§2.2, §10 hold 1) | codex | `planning/platform-alignment/bot-policy/` | |
| D7 | A serialised, cross-process packet form with a receipt and a re-seal on admission, **if** ever wanted — refused here, exit named (§6.5, §11.5) | OWNER | `rfc/README.md` | |
| D8 | Reconcile `review-evidence-compiler.md` so its node point is `derived.review.eval_point@1` over `live.stockfish.position_eval@1` + `run.record.position@1`; no fake node and no second engine-score authority (§8.3) | codex | Review RFC amendment commit | |
| D9 | Future production hint and Review joins may consume the neutral receipt internally, but must declare and bind only their actual derived outputs when those operations land; the raw packet never becomes a learner-module input (§3.1, §9) | codex | each consumer RFC registration/implementation commit | |
| D10 | Bind one concrete accepted bot profile/route to truthful candidate outputs; compose one delivered legal-root request under an aggregate deadline; require source-row/legal-set equality; retain `root_side_to_move`; cross cp loss, all-winning/all-losing mate order, outcome flip and mixed-domain abstention; refuse wrong FEN/move/acquisition/bound, zero/non-integral mate, raw scores, fake nodes and every child `position_eval` request; mark capped score projections `evaluated_subset`; declare value-honest outputs over exact retained inputs; measure cold/warm/cancel/provider-off operation; and repair the final provider/policy cache. Test-created profiles and foundation type fixtures do not discharge this row (§7.1, criteria 15/17, §10 hold 4) | codex | `bot-policy.md`, `bot-roster.md`, `evidence-move-selector.md` | |
| D11 | The runtime service and cache: construction seam, closed result/failure algebra, cancellation and cooperative yield, single-flight, queue/deadline/overload bounds, LRU admission and eviction, retained-graph accounting and the stats snapshot. Cut from this RFC 2026-09-06 with its rows; criteria 13, 26 and 33 move with it | candidate-population-service | `rfc/candidate-population-service.md` acceptance | |
| D12 | The executable collector topology: the thirteen adapters, dependency-closed scope plans, the per-collector memo, the generated projection dialect, and abstention/failure identity. Cut from this RFC 2026-09-06 with its rows; criteria 28–32, 34 and 35 move with it | candidate-collector-registry | `rfc/candidate-collector-registry.md` acceptance | |

## Answered buildability questions

1. **Compile readings eagerly or lazily per candidate? — answered: immutable exact scopes.** The bot's feature family
   needs the twenty per-child readings that `childReadings` assembles
   (`candidate-evidence.ts:125-148`); the hint and Review need only events. §3.4 makes scope part of
   the cache identity, which means a bot request after a hint request **recompiles** rather than
   extending. The alternative is one packet with lazily-populated readings, which is cheaper on the
   second consumer and makes the packet mutable after construction — and a mutable value with a
   content digest is a contradiction. *Recommendation: keep scope in the identity and accept the
   recompile; measure it under criterion 12 and revisit only if the measurement says so.* This RFC
   adopts that recommendation. A wide cached value may produce an immutable narrow projection
   without chess recomputation (§3.4); no lazy mutation exists.
2. **Replace `legalAlternativeEdges` or wrap it? — answered: retain a thin derivation.** It is
   exported today and its committed-move exclusion is right for its callers and wrong for a
   population (§4.3). Keeping both means two functions with a one-element difference, which is exactly
   how §1.5's two enumerators happened. *Recommendation: keep `legalAlternativeEdges` as a thin
   derivation of the packet — `packet.candidates.filter(...)` — so there is one enumerator and the
   difference is a filter with a name.* This RFC adopts that recommendation; the old independent
   enumeration path is deleted.
3. **Whose is the packet compiler's home package? — answered: runtime, service composed by each
   long-lived process.** §12 puts it in `packages/runtime` because the
   collectors, the seals and the move authority all live there and `apps/server` already imports
   them. The counter-argument is that `candidateFeatureVector` — the thing being repaired — lives in
   `apps/server`, and a runtime module that only the server uses is a layering claim without a second
   consumer. *Recommendation: `packages/runtime`, because the hint and Review consumers are runtime
   modules and the bot consumer is not the only one.* This RFC adopts that recommendation. The cache
   is not a module singleton: each process composition root constructs and injects one
   `CandidatePopulationService` (§6.0).

## Ledger rows

**The cut is the current entry.** This document was 2,786 lines and blocked 92 items, 76 of which
were findings it had raised against its own author models across fourteen review rounds. It is now
bounded to the contract its dependents carry; the cut material is routed to
`rfc/candidate-population-service.md`, `rfc/candidate-collector-registry.md` and
`planning/evidence-foundation-ux/candidate-packet-cut-plan.md`, and `planning/work-state.json` is
re-pointed in the same commit. No row was dropped and no finding was rationalised away — the second
application of [[D3034]]'s changed unit of delivery.

*(Proposed — ids assigned at landing; unnumbered per [[D1503]], which retires the D1130 head-stating
convention. Historical note, since §0's correction 7 turns on it: the head at the drafting commit
`3a291abb` was **D1384**. The drafting brief stated
D1354; corrected here per §0.7.)*

- **🐞** — **`selectSemanticEvidence` takes the counterfactual population from a caller callback and
  never checks that the events returned for an edge are anchored to that edge.**
  `semantic-evidence.ts:1013-1017` pushes whatever `input.evaluateAlternative(edge)` returns; the
  dedupe at `:1022` keys on `anchor.moveUci` and so **bounds** the inflation at one per distinct
  anchor rather than refusing it. Measured at HEAD: answering every alternative with the played
  edge's own events changes the selection outright and reports `sameFamilyShare: 0.030`. The R2
  distinctiveness rule is a claim about a denominator, and the denominator is an argument.
- **🐞** — **`evaluatedAlternatives` cannot report that nothing was evaluated, and the unevaluated
  case is *flattering*.** The success path passes `alternatives.length` twice
  (`semantic-evidence.ts:1054`); only the `undefined` short-circuit at `:1015` reports a real count.
  Measured: `evaluateAlternative: () => []` yields
  `{ legalAlternatives: 33, evaluatedAlternatives: 33 }`, every played event scores
  `sameFamilyShare: 0.000`, and **two families the complete population rejects as
  `nothing_distinctive` are selected instead** (`derived.exchange.capture_class:state`,
  `derived.material.event.role_asymmetry:state`, against the complete population's
  `derived.pawn.event.transitions:state` and `rules.structural.event.backward_pawn:gained`). A silent
  failure that strengthens the claim it should weaken — [[D444]]'s class, inside the rule that
  decides what a learner is shown.
- **🐞** — **Two shipped enumerators disagree on the event closure and therefore select different
  evidence for the same move.** `localSemanticEvents` (`semantic-evidence.ts:919-922`) composes ten
  families; `selectLocalSemanticEvidence`'s inline closure (`:1058-1064`) composes eight, omitting
  `breadthSemanticEvents` and `semanticDutyEvents`. Measured on one middlegame edge: the shipped path
  selects `backward_pawn:gained` + `half_open_file:lost`, the full closure selects
  `derived.pawn.event.transitions:state` + `backward_pawn:gained`. D1066's harness measured the wide
  closure; `semantic-evidence-check.ts:19-20`, the only non-test caller, asserts `19/19` over the
  narrow one. The mechanism half of [[D1363]].
- **🐞** — **`CANDIDATE_COLLECTOR_IDS` admits `human.maia.candidate_wdl` where the manifest's declared
  input set deliberately excludes it.** The runtime closure guard (`candidate-evidence.ts:67-70`,
  `:168`) unions the tactical and breadth lists, and the tactical list carries the Maia member
  (`evidence-catalog.ts:166`); `candidateCollectorInputs` filters it out with an explicit comment
  (`evidence-catalog.ts:706-710`). The runtime admission set is wider than the declared one, and only
  the absence of a producer keeps it dark.
- **🐞** — **The shipped selection cache is keyed on policy and session and is unbounded.**
  `selectionCacheKey` (`opponent-selector.ts:264-278`) is a policy-config digest, target Elo, the
  profile triple, pack id, seed and `sha256(startFen + every history move)` — the last term is positional, so the
  retracted "no positional term" claim does not stand ([[D1388]]); what stands is that the key is
  **history-shaped**, so the same position by two move orders is two entries and no other consumer
  can hit it. `#cache` is a plain `Map` (`:469`) with no eviction anywhere in the class; `cacheSize()`
  (`:506`) reports growth and nothing acts on it. Single-flight is present and correct (`:495-503`).
- **📊** — **The candidate vector loses six envelope fields, not five.** [[D1072]]'s row and the
  harness assert five absences; the sixth is **`evidence`** itself — the sealed `DeclaredEvidence`
  wrapper carrying the **producer identity** and the `DECLARED` brand
  (`evidence-contract.ts:358`). `candidate-evidence.ts:171` retains
  `{ source: evidence.projection, payload: evidence.payload }`: projection and operands survive as
  unbranded copies, producer does not.
- **📊** — **The D1071 cold/warm pair is not a controlled A/B of one computation.** The instrument
  times `horizonSelection` first and `moduleSelection` second on the same edge
  (`d1066-semantic-horizon-harness/semantic-horizon.test.ts:215-220`); they share the `EVENT_CACHE`
  the first fills (`:152-159`) but are different selectors doing different work. The direction and
  order of magnitude are sound and the cached quantity is genuinely the complete alternative
  population; the same-work figure is unmeasured and is owed rather than inherited. Independent at
  HEAD: 33 alternatives, 3,561 sealed events, ~558 ms to compile one population.
- **📊** — **The packet is the population both sibling coverage obligations are stated against, and it
  subsumes neither.** `bot-route-source.md` §2.2's test — a base must cover the complete legal set, a
  proposer must not — names an object neither layer owns. `evidence-move-selector.md`'s
  `coverage = 1.0` identity has the same denominator, and its feature source requires a finite
  `scoreCp` per candidate (`candidate-evidence.ts:198`), so its identity is unaffordable without the
  packet's score-free population. The route source consumes nothing here, deliberately. [[D1330]]'s
  *"the packet itself is that RFC's Discharge D2"* is right about the object and wrong about the
  scope: D2 is Tier-2-scoped and the packet is not.
- **📊** — **Three source corrections that do not change the verdict**, recorded because a carried
  claim is only evidence once re-run: the dossier's `legalConvention` field already exists and is
  owned by the **accepted** `rfc/exact-legal-mobility.md` (`legal-moves.ts:9-10`); the dossier's
  *"only non-test occurrence is its function declaration"* is false at HEAD (three harnesses call it,
  and `evidence-move-selector.md` depends on it) while *no production caller* remains true and
  `evidence-catalog.ts:875` still names three implementations, none of which call it; and the D1071
  harness's own legal enumerator omits promotion identities
  (`candidate-packet.test.ts:34-41` against `legal-moves.ts:42-46`), so it would **understate** the
  completeness gap in any promoting position.
- **🐞** — **`SEMANTIC_EVENT_VALUES` does not prove what every reader assumes it proves, and
  asserting an event mints a second sealed twin.** `compileSemanticEvidenceEvent` adds **every**
  value it produces to the WeakSet (`semantic-evidence.ts:952`), so a rebuild from retained
  in-process bytes is a member on the line that created it — executed at HEAD:
  `RECONSTRUCTION REJECTED BY SEAL? false`, with `sameRef: false` and `sameId: true`. Worse,
  `assertSemanticEvidenceEvent` **itself calls** `compileSemanticEvidenceEvent` (`:959`) to recompute
  `id` and `basis` for comparison, so each assertion adds a fresh object to the set. The values are
  unreachable and collectable, so it is not a leak — but the WeakSet is a record of *"values this
  compiler has ever produced, including during verification"*, not *"values that were originally
  produced"*. What the seal really guarantees is that an object came from the compiler rather than
  from a literal or `JSON.parse`; it is **not** an identity guarantee and never was. Any RFC that
  argues a retention or persistence rule from "a reconstruction fails the seal" is arguing from a
  false premise.
- **🐞** — **A criterion citing `register-check` C1–C7 omits the only check that fires on a `none`
  claims block.** The tool runs **C1–C8** (`tools/register-check.mjs:366-375`). C8 fails when a
  schema file's bytes differ from the register's reconciled digest **and no live claim declares the
  resource** (`:66-84`) — and with `none` claimed, `claimed.has(resource)` is false for every
  resource, so C8 is precisely the gate a no-claim RFC needs. Naming C1–C7 is not a rounding error;
  it names the seven checks that cannot catch the thing being asserted.

## Changelog

- 2026-09-06 — **cut to the blocking contract** ([[D3034]]'s precedent, second application).
  2,786 lines to the contract three consumers join against. The runtime service and cache moved to
  `rfc/candidate-population-service.md` (Discharge D11); the executable collector registry moved to
  `rfc/candidate-collector-registry.md` (Discharge D12); fourteen rounds of review history and the
  pre-cut 61-line Status field moved to
  `planning/evidence-foundation-ux/candidate-packet-cut-plan.md`. Criteria 13, 26, 28–35 moved with
  their mechanism and keep their numbers; criteria 4, 9, 12, 20, 23 and 25 were reduced to the arm
  this document can still fail on. No criterion was deleted, no finding was withdrawn, and no
  section was moved that was correct and required. The claims block stays `none` and is re-verified
  against the reduced implementation surface.

- 2026-09-06 — fourteenth fresh independent review returned the thirteenth repair on [[D3009]]–
  [[D3016]]. Hidden execution outcomes, permissive product options, split failure algebras,
  incomplete receipt/graph closure, erased scope typing, absent collector fault injection and
  eighteen-versus-sixteen stats reproduce under `make candidate-packet-fourteenth-fresh-review`
  (8/8 plus strict TypeScript). Implementation remains unauthorized.

- 2026-09-06 — thirteenth fresh independent review returned the twelfth repair on [[D2934]]–
  [[D2941]]. Hidden memo dependencies, false projection attribution, abandoned-job rejoin, invalid
  request misclassification, repeated singleton accounting, incomplete receipt joins, a copied
  output vocabulary and a weakened local TypeScript contract reproduce under `make
  candidate-packet-thirteenth-fresh-review` (8/8). Implementation remains unauthorized.

- 2026-09-06 — twelfth fresh independent review returned the eleventh repair on [[D2885]]–[[D2891]].
  Crossed receipts, stale queue timers, unreachable failures, vacuous terminal guarding, incomplete
  retained-graph accounting, non-LRU projection hits and a second loose-piece execution reproduce
  under `make candidate-packet-twelfth-fresh-review` (7/7 plus strict TypeScript). Implementation
  remains unauthorized.
- 2026-09-06 — [[D2860]]–[[D2863]] eleventh author repair. One current checkpoint composes the
  production-backed compiler with cooperative group scheduling and the public bounded service,
  retains all packet identity and total collector-result authorities, and distinguishes checkmate
  from stalemate. `make candidate-packet-eleventh-author-repair` passes 8/8 new behavioral groups
  plus strict TypeScript; fresh review and the value-authority dependency remain.
- 2026-09-05 — eleventh fresh independent review returned the tenth repair on [[D2860]]–[[D2863]].
  Its bounded fixes survive, but the current model drops the public service/result/cache operation,
  retained identity fields, projection-addressed outcomes/abstentions and terminal distinction.
  `make candidate-packet-eleventh-fresh-review` passes 4/4 falsifiers; implementation remains
  unauthorized.
- 2026-09-05 — [[D2678]]–[[D2684]] plus [[D2841]]–[[D2842]] tenth author repair. One
  production-backed contract operation closes request, seven-term identity, scope-private graph,
  cache authority, deep sealing and all thirteen real adapter paths while preserving aggregate
  bounds. Binding real evidence also replaces the blanket symbol refusal with an assertion-gated
  brand rule and refuses the predecessor's unbranded legal-evidence lookalike. `make
  candidate-packet-tenth-author-repair` passes 9/9 plus strict TypeScript; fresh review and the
  value-authority dependency remain required, and production implementation is unauthorized.
- 2026-09-04 — ninth fresh independent review returned the eighth repair on [[D2678]]–[[D2684]].
  The bounded graph controls survive, but request, factual identity, projected private closure,
  cache key/result authority, deep immutability and exact collector execution do not compose.
  `make candidate-packet-ninth-fresh-review` retains the complete earlier chain and passes 7/7 new
  falsifiers. Exact return:
  `planning/evidence-foundation-ux/shared-candidate-packet-ninth-fresh-independent-buildability-review-2026-09-04.md`.
  No production packet, cache or consumer is authorized.
- 2026-09-04 — [[D2655]]–[[D2660]] eighth author repair. One executable operation now consumes the
  predecessor legal-evidence author surface, runs all three exact collector plans, measures one
  descriptor-closed private graph fail-closed and admits it through an entry/byte/object bounded
  LRU cache. `make candidate-packet-eighth-author-repair` retains every prior control and passes
  seven new composed arms. Fresh independent review remains required.
- 2026-09-04 — eighth fresh independent review returned the seventh repair on [[D2655]]–
  [[D2660]]. Factory and scope controls do not execute their claimed graphs; retained measurement
  skips private wrapper/container and forbidden-property shapes; category closure is tautological;
  and no cache consumes the measurement. Exact review:
  `planning/evidence-foundation-ux/shared-candidate-packet-eighth-fresh-independent-buildability-review-2026-09-04.md`.
  `make candidate-packet-eighth-fresh-review` passes 6/6; implementation remains unauthorized.
- 2026-09-04 — [[D2625]]–[[D2627]] seventh author repair. The packet now consumes the predecessor's
  exact factory without claiming its file; collector truth inputs contain no request scope and
  direct/projected shared values must agree; and cache admission measures every retained receipt
  reference through logical-byte and unique-object bounds instead of the obsolete visible-item
  coefficient. `make candidate-packet-seventh-author-repair` is positive author evidence only;
  another fresh independent review remains required.
- 2026-09-01 — [[D2428]] sixth author repair. The exact evidence adapter becomes the sole
  FEN-to-declared-evidence factory, removing caller payloads and the second legality computation.
  Current production symbols measure 0.029465 ms/position for one authority computation versus
  0.080278 ms/position for the current two-stage path (2.724×) across the six-position author
  instrument. Fresh independent review remains required; no product implementation is authorized.
- 2026-08-31 — fifth fresh independent review returned the RFC on [[D2428]]. The D2389 single-value-
  graph repair survives, but the production declaration adapter recomputes `exactLegalMoveMap`, so
  criterion 36's exactly-one-call requirement is not buildable. Exact review:
  `planning/evidence-foundation-ux/shared-candidate-packet-fifth-fresh-independent-review-2026-08-31.md`.
- 2026-08-31 — [[D2389]] fifth author repair. One `exactLegalMoveMap` object now owns declaration,
  packet population and receipt identity; the factory has no second `exactLegalMoves` source and an
  equal rebuilt move list is an explicit negative. `make candidate-packet-fifth-author-repair`
  passes; fifth fresh independent review remains required and no implementation is authorized.
- 2026-08-31 — fourth fresh independent review returned the RFC on [[D2389]]. The D2329/D2330
  repair remains valid, but the packet's flat legal list and sealed exact-legal-map receipt have
  separate specified sources. One exact map value must own both before acceptance.
- 2026-08-31 — [[D2329]]–[[D2330]] fourth author repair. One generated literal `id@version` map,
  resolved and checked against the compiled manifest, now owns collector output identity across
  results, abstentions and value joins. Scope now selects retained output after a transitive
  dependency-closure plan: readings-only executes transition/tactical predecessors privately and
  exposes only readings. `make candidate-packet-fourth-author-repair` is the positive author
  contract; fourth fresh independent review remains required and no implementation is authorized.
- 2026-08-30 — third fresh independent review returned the prior repair on [[D2329]]–[[D2330]]:
  the proposed projection union widened to `string`/mixed identity dialects, and readings-only
  removed its own event dependencies. Exact return:
  `planning/evidence-foundation-ux/shared-candidate-packet-third-fresh-independent-review-2026-08-30.md`.
- 2026-08-30 — D2198–D2201 third author repair. The product/test factories fix one primary
  manifest; every result is projection-addressed; thirteen one-context adapters compile into the
  executable registry; and memo, bounded-stat and exact receipt-reference protocols are closed.
  Maintained contracts plus the new author/typecheck contract pass. Fresh independent review remains
  required; no implementation is authorized.
- 2026-08-30 — second fresh independent review returned the D2097–D2104 author repair on
  [[D2198]]–[[D2201]]. Exact return:
  `planning/evidence-foundation-ux/shared-candidate-packet-second-fresh-independent-review-2026-08-30.md`;
  reproduction: `make candidate-packet-second-fresh-review`. No production/schema/content byte
  changed.
- 2026-08-30 — D2097–D2104 author repair. Request/result/projector scope is one generic map; the
  provider handoff is removed whole; an exported product factory fixes legal/registry/scheduler
  authorities; thirteen callable declarations own topology; unique jobs have active/FIFO/deadline/
  shutdown bounds; scheduler and collector failures are closed; `standard` ruleset identity enters
  request/packet/key/context; and exact sealed collector outcomes authorize every abstention. The
  eight-arm author contract passes and the historical return inverts. Fresh review remains required.
- 2026-08-30 — fresh independent review returned the author repair on [[D2097]]–[[D2104]]. The
  eight-arm reproduction crosses scope correlation, provider type availability/arity, the exported
  construction seam, executable collector topology, bounded in-flight work, scheduler/failure
  closure, ruleset identity and abstention source retention. Exact return:
  `planning/evidence-foundation-ux/shared-candidate-packet-fresh-independent-review-2026-08-30.md`;
  reproduction: `make candidate-packet-fresh-review`. No production/schema/content byte changed.

- 2026-08-29 — author repair for final independent return [[D1977]]–[[D1981]]. The service now has
  a closed result/failure/options boundary; `messageChannelMacrotaskYield` and a literal bounded
  group topology replace the unnamed scheduler; receipt projection is a type/runtime partial
  order; collector groups retain unavailable separately from available-empty; and the provider
  join is a type-only D10 handoff with every behavioral criterion transferred to the real consumer.
  Fresh independent buildability review remains required; no implementation is authorised.

- 2026-08-28 — repaired the second repeat [[D1958]]–[[D1961]] return. The owner's
  foundation-first sequence is recorded honestly as zero product consumers rather than a verify CLI
  relabeled as production. The receipt now has a private `WeakMap` constructor/assertion authority
  and an asserted wide→narrow minting path; the compiler yields between bounded collector groups and
  cancellation after work begins is failable; convention/version/reason fields retain literal
  authorities. Fresh independent buildability review remains required.

- 2026-08-28 — repeat-return amendment on [[D1900]]–[[D1903]], followed by [[D1945]]–[[D1947]].
  The factual cache now stores one neutral process receipt; the first landing traverses only the
  real semantic-selection operation and does not invent a bot; the held bot handoff joins one
  complete root-side legal table rather than N child searches. Re-deriving F1's conjunction
  semantics then proved the scope-wide 47-event/22-reading `anyOf` false: a position emits only a
  subset. The aggregate projection, adapter and future-only bindings are removed. Exact retained
  values keep their existing F1 authority; downstream modules must declare only the conclusions
  they actually derive. A final reach trace removed dormant `createApplication` injection: the
  existing semantic-check executable is the first composition root and application lifetime waits
  for a real Support, Review or bot route. Repeat independent review remains required.

- 2026-08-27 — independent-return amendment on [[D1631]]–[[D1636]]. The packet now reserves empty
  populations for checkmate/stalemate while adjudication stays separate; packet/provider/policy
  caches retain distinct complete identities; concrete semantic/bot operations and application
  cancellation are in the implementation surface; the F1 declaration has three scope-exact
  `anyOf` members over the complete event and 20+2 reading closures; and White Stockfish evidence
  derives explicit root-side cp/mate loss. [[D1860]] registers that position evaluation in the
  shared provider scheduler rather than a private candidate adapter. Repeat independent review is
  required before implementation.

- 2026-08-26 — Node-24 cache amendment on [[D1579]]/[[D1580]]. The same-id cold/warm pair is now
  measured (972.32 ms / 0.011 ms on the 50-move witness), and separate fresh-process scopes record
  structural bytes, heap/RSS and cache stats. Equal event/reading weight fails: eight mixed packets
  add 91.78 MB heap versus 52.28 MB event-only. The typed weight becomes
  `events + 5×readings`, keeping its equal-item negative control; the corrected mixed trial retains
  six roots / 67.17 MB heap under 52,975/56,000 weight. Numeric release clearance stays with F12,
  whose ruled tiers currently name no memory ceiling; the RFC no longer pretends “exceeded” is a
  testable branch.

- 2026-08-23 — drafted on [[D1071]]/[[D1072]], routed by [[D1330]] as live-debt rank 6 and named as
  the target of `hint-distance.md` Discharge D5. Every dossier claim re-verified at HEAD; **seven
  corrections recorded**, three of which change the specification (the legal convention is an
  accepted sibling's, the envelope loses six fields not five, and the cold/warm pair is not a
  controlled measurement). Four defects found beyond the dossier, all in the **shipped** selection
  path, with an executable falsifier added at
  `tools/d1071-candidate-packet-harness/population-integrity.test.ts`. Subsumption against
  `evidence-move-selector.md` and `bot-route-source.md` determined in §2: composes beneath both,
  subsumes neither, and is the object their two contradictory coverage obligations are both measured
  against.
- 2026-08-24 — **[[D1412]] repaired.** Both halves reproduced by execution before anything was
  changed. **§5.2's central claim was false**: `RECONSTRUCTION REJECTED BY SEAL? false`. The section
  is re-argued on **reference identity** — the packet knows which value it compiled and the WeakSet
  does not — and the seal's real strength is stated (it proves an object came from the compiler, not
  that it is *the* object). §6.5 and §11 item 5 leaned on the same false premise and are re-argued on
  **manifest-vocabulary agreement**: a persisted packet is admissible exactly when the reading
  process's manifest matches the writing process's, and only a receipt can establish that, because
  `assertSemanticEvidenceEvent` rebuilds against whatever manifest its own caller passes (`:959`).
  Criterion 8's parenthetical was inverted and is corrected: the seal is the **weaker** of the two
  comparisons, so the fixture is a rebuild that **passes** every seal-shaped check and is refused
  only by `===`. Also repaired: criterion 14 now names **C1–C8** and says why C8 is the check a
  `none` claim needs; criterion 6 is re-pointed from the compiler (which §3.2 gives no move
  parameter, so criterion 1 forbids the input the fixture required) to the packet readers that do
  take a caller UCI; criterion 5 is re-specified on `(moveUci, afterFen)` **pairs** over castling and
  promotion roots, since its cardinality arm was an arithmetic consequence of criterion 2; criterion
  12 is made failable on the record's shape and on the two runs sharing a `packetId`, which is the
  D1071 defect §0.4 records; §6.4 gains criterion 21 (it had pointed at criterion 14, which is about
  something else); and §0's correction 7 is itself corrected — the ledger head at the drafting commit
  `3a291abb` was **D1384**, not the D1373 the correction asserted, so the correction had drifted in
  the field it existed to correct. [[D1503]] retires the head-stating convention, so the proposed
   rows are unnumbered.

**The 2026-08-26 buildability re-run adds seven blocking corrections** ([[D1570]]–[[D1576]]).
The original D1071 falsifier remains green: 33 alternatives, 3,561 sealed events and about 580 ms
cold on its middlegame root. Across the fixed 64-position D1061 population, complete event packets
measure 3,779 / 5,482 / 5,803 retained events and 5.13 / 7.44 / 7.88 MB structural JSON at
p50 / p95 / max; compile time is 614 / 863 / 922 ms. Structural JSON is a deterministic size
proxy, not V8 heap usage. `[V]`
`design/research/shared-candidate-packet-buildability.md`;
`planning/evidence-foundation-ux/d1573-candidate-packet-envelope.json`.

The same sweep observes only 41 of 67 declared semantic-event projections and misses both
`rules.transition.event.checkmate@1` and `.promotion@1`, so §5.3's fixed-sweep closure authority is
withdrawn. The sweep remains the prevalence/cost instrument; code-derived composition plus
per-family positive/hard-negative fixtures becomes the schema authority. The re-run also found
that the packet's manifest tuple, engine-evidence retention, process/cache owner, exact scope
projection and runtime migration of server-private `childReadings` were never specified. The
sections below now carry those bytes instead of leaving them to the implementer. [[D1576]] also
proved the drafted Review engine point was run-node-bound and therefore could not identify a
hypothetical candidate child; §8.3 now owns one generic node-free position evaluation, and the
Review RFC derives its node point from that source plus the recorded run position.
