# RFC: Shared candidate evidence packet — the compiled legal population three consumers are measured against

- **Status:** draft — returned by repeat independent buildability review 2026-08-27 on
  [[D1900]]–[[D1903]], with the returned provider dependency [[D1871]]–[[D1878]] still blocking.
  The [[D1631]]–[[D1636]] terminal/cache/closure/score repairs survive and the literal amended F1
  tuple compiles, but consumer-specific admission is conflated with the factual cache, the
  scope-specific derivation has no runtime value witness, the claimed bot consumer is test-only,
  and per-child evaluation replaces the measured one-root operation without a whole-set budget.
  Exact return:
  `planning/evidence-foundation-ux/shared-candidate-packet-repeat-review-2026-08-27.md`.
  Do not implement before amendment and another independent review. [[D1580]] remains separate
  numeric appliance-tier debt
- **Author:** claude (drafted from `design/research/shared-candidate-evidence-packet.md` and `tools/d1071-candidate-packet-harness/`; every carried claim re-verified at HEAD, with seven corrections recorded)
- **Created:** 2026-08-23
- **Design refs:** `design/05-in-run-experience.md` §5 (*"detection is cheap, significance is not"* — the split this RFC executes in code: one factual population, separate opinionated derivations) and §3b-i (*"The LLM is the voice, never the source"*); `design/03-product-breadth.md` §Play (opponent selection) and §Intelligence and explanation
- **Exploration gate:** [[D1071]] 📊 and [[D1072]] 🐞 — research complete 2026-08-23, dossier `design/research/shared-candidate-evidence-packet.md`, executable falsifier `tools/d1071-candidate-packet-harness/` under `rfc/0000-rfc-process.md` §Exploration gate. [[D1330]]'s per-dossier classification of all 118 research artifacts ranked this **live debt rank 6**: the population finding was partially adopted by `evidence-move-selector.md`, *"but the packet itself is that RFC's Discharge D2, unbuilt"*
- **Depends on:** **accepted** `rfc/exact-legal-mobility.md` — it ships the single actual-turn move authority (`exactLegalMoves`/`exactLegalMoveMap`), `MOVE_IDENTITY_CONVENTION`, `MOVE_DESTINATION_CONVENTION` and the `rules.mobility.reading.legal_moves@1` projection, which is this packet's legal-convention field rather than a new one (§4.2). Implemented F1 evidence contract (`rfc/archive/evidence-contract-manifest.md`, `rfc/archive/semantic-evidence-selection.md`) and the compiled catalogue at HEAD; draft `rfc/provider-exchange-and-execution.md` for same-exchange Stockfish/Maia receipts, the shared scheduler and cancellation semantics (must be accepted first)
- **Parent / amends:** amends the `SemanticSelectionInput` contract in `packages/runtime/src/semantic-evidence.ts` (§3 — the caller-supplied alternative population becomes a compiled packet), the `derived.opponent.candidate_feature_vector@1` declaration in `packages/runtime/src/evidence-catalog.ts:712-723` (§8.2 — its engine dependency becomes consumed rather than declared), and `rfc/review-evidence-compiler.md`'s engine-point source (§8.3 — a node-free position evaluation becomes the shared source and Review derives its node-scoped point). **Discharges rebuilt `rfc/hint-distance.md` D2 on landing**; that row is its author's to flip
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-foundation-ux/` (once implementing)

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
- **No evidence-kinds member.** That register governs `EVIDENCE_KINDS` in
  `apps/server/src/sourcing/types.ts:57-65`, the **content-sourcing** union of seven; this RFC adds
  an **evidence-catalogue projection**, which is a different object with no register in
  `rfc/README.md` and no schema on disk (`schemas/` holds five documents, none of them the
  manifest). `[V]` The manifest carries a **content digest** (`evidence-manifest.ts:82`) that moves
  whenever the catalogue moves; that is a derived value, not a claimed lane, and criterion 14 makes
  the absence of any register collision failable rather than asserted.

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
not yet exist at one production boundary. Today only the bot-side host is concrete; the earlier
claim that three live consumers already recompile it was too strong. §6.0 names the server
composition root and narrows reuse to operations actually injected with that cache. `[V]`

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
`apps/server/src/bot-policy-catalog.ts`; this RFC's are in `packages/runtime/src/semantic-evidence.ts`,
`packages/runtime/src/evidence-catalog.ts` and one new runtime module. Landing order is free in both
directions, and no cross-draft pin is required.

**§2.4 — Against `hint-distance.md`: it is that RFC's named dependency.** Its Discharge D5 is *"The
shared score-free candidate/event packet ([[D1071]])"* with this filename in its target column, and
its §7 refuses independent recomputation per consumer. This RFC supplies the population; the rung
grammar, the redaction and the family table stay there. The one thing this RFC hands it beyond the
population is §1.5: the emitted closure becomes **derived**, so `hint-distance`'s accepts table can
be asserted set-equal to something rather than hand-listed — which is the mechanism [[D1363]] found
missing.

**§2.5 — Against `review-evidence-compiler.md`: complementary at the denominator.** That RFC
compiles a partial post-game packet of typed evidence for Review modules. Its opportunity/avoidance
items need the *complete legal alternative* set at the played root, which is precisely §7.3's join.
It owns the Review packet; this RFC owns the population its denominators are computed over.

### §3 — `CandidateEventPopulation`: the contract

**§3.1 — Identity and the literal F1 tuple** ([[D1570]]). Register one output on a new
`derived.candidate@1` producer implemented in `packages/runtime/src/candidate-population.ts`.
The producer is `plane: "derived"`, `availability: "local"`, `latency: "sync"`. Its output is:

| field | literal value |
|---|---|
| id / role / plane | `derived.candidate.event_population@1` / `reading` / `derived` |
| payload / semantics | `CandidateEventPopulation` / complete exact legal-move rows plus the literal sealed local evidence emitted for each child under the named scope and conventions |
| operands | `id`, `beforeFen`, `scope`, `legalConvention`, `moveIdentityConvention`, `manifestDigest`, `compilerVersion`, `legalMoves`, `candidates`, `terminal` |
| sign / grounding / exactness / confidence | `state` / `declared_convention` / `convention` / `exact` |
| abstention | possible: `input_abstained`; a terminal root is a valid zero-row packet and construction errors remain typed failures, while a collector-specific abstention is retained on its candidate row rather than laundered into absence |
| answer / forms | `fact`, `candidate_moves` / `list`, `panel`, `machine_condition` |
| derivation | literal `anyOf` with exactly three members keyed by scope: `[legal_moves, ...events]`, `[legal_moves, ...readings]`, `[legal_moves, ...events, ...readings]`; `dependsOn: []`, because the derivation members already own the complete dependency union |
| limitations | legality and emitted evidence are not quality, rank, likelihood, recommendation, grade or personality; the packet is operator/internal and may not be rendered to a learner |

The projection is bound, not disposed. `research.semantic_selection@1` and
`opponent.selection@1` both accept it through literal `machine_condition` adapters and their
production operations take a sealed `ConsumerEvidenceView<CandidateEventPopulation>` rather than a
raw payload. The research consumer's answer image gains `candidate_moves`; both consumers remain
operator-only. Hint and Review **do not** accept the raw packet: their future internal join
operations register their own bindings when they land, and learner modules accept only the
selected derived item. A fixture deletes either of the two landing bindings and the F1 compiler
fails orphan closure; a fixture adds the packet to a learner-role consumer and the role/operation
audit fails. No generic bypass or temporary disposition is permitted.

`CANDIDATE_PACKET_COMPILER_VERSION = 1` is an exported literal and every construction-semantic
change must move it or the cache-identity fixture fails.

```ts
export type CandidatePacketScope =
  | { readonly events: true; readonly readings: false }
  | { readonly events: true; readonly readings: true }
  | { readonly events: false; readonly readings: true };

/** derived.candidate.event_population@1 */
export interface CandidateEventPopulation {
  readonly id: string;                        // digest over the identity fields below
  readonly beforeFen: string;                 // canonical full six-field FEN
  readonly scope: CandidatePacketScope;       // one of the three closed members above
  readonly legalConvention: VersionedEvidenceId;  // rules.mobility.reading.legal_moves@1
  readonly moveIdentityConvention: string;    // MOVE_IDENTITY_CONVENTION, retained literally
  readonly manifestDigest: string;            // CompiledEvidenceManifest.digest
  readonly compilerVersion: number;           // this packet's own construction semantics
  readonly legalMoves: readonly ExactLegalMove[];  // the sealed authority's complete set
  readonly candidates: readonly CandidateEventRow[];
  readonly terminal?: { readonly reason: "checkmate" | "stalemate" };
}

export interface CandidateEventRow {
  readonly moveUci: string;                   // exactly one member of legalMoves, same dialect
  readonly afterFen: string;                  // canonical child, derived not supplied
  readonly events: readonly SemanticEvidenceEvent[];   // ORIGINAL sealed values; [] when scope excludes
  readonly readings: readonly DeclaredEvidence<unknown>[]; // ORIGINAL sealed values; [] when scope excludes
  readonly abstentions: readonly {
    readonly projection: VersionedEvidenceId;
    readonly reason: string;
  }[]; // typed collector abstentions only; no-match is not an abstention
}
```

This literal tuple is compiled by `compileEvidenceManifest` as an acceptance fixture, not merely
compared to prose ([[D1634]]). Each scope selects its exact `anyOf` member; an events-only packet
does not falsely claim readings and a readings-only packet does not falsely claim events. The
legal-move input is position-rules/exact; each retained closure
mixes exact and declared-convention inputs, so the packet declares
`grounding: "declared_convention"`, `exactness: "convention"`, `confidence: "exact"` and
`abstention: {possible:true,reasons:["input_abstained"]}`. A negative fixture removes the weakest
input while retaining its payload, claims position-rules grounding, claims exactness, or removes
`input_abstained`; each must fail the shipped compiler. Scope narrows which retained inputs appear
in a value, never the declaration's complete possible-input vocabulary.

The projection name is this RFC's, replacing the dossier's provisional
`derived.candidate.event_population@1` with the same string; the shape is the dossier's with §0's
first correction applied.

**§3.2 — What a caller may supply and what it may not.** A caller supplies **`beforeFen`** and a
**request scope** (§3.4). It may not supply `afterFen`, `legalMoves`, any event, any event sign, id,
anchor, basis or derivation input, or any reading. Every one of those is derived by the compiler
from the root and the legal-move authority. This is the whole of the repair: the population stops
being an argument and becomes an output. Criterion 1.

**§3.3 — Completeness is set equality, not a count.** The compiler establishes, and asserts, that
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
`{ events: false, readings: true }`. **Scope selects which evidence
families are compiled per candidate; it never selects which candidates exist.** The candidate set is
always complete. Scope is part of the cache identity (§6.1) so a narrow packet is never served to a
consumer that needs the wide one. A cached wide packet may satisfy a narrow request only by a
deterministic no-chess projection that returns a **new frozen packet with the narrow scope and its
own narrow `packetId`**, retaining the same legal-move and evidence object references while replacing
the excluded arrays with frozen empties. This counts as a cache hit and not as a compilation.
Criterion 4.

### §4 — The legal-move authority, and the dialect that has already bitten twice

**§4.1 — One authority.** `legalMoves` is `exactLegalMoves(beforeFen)` — the authority
`rfc/exact-legal-mobility.md` accepted, which enumerates four promotion identities per promoting move
(`legal-moves.ts:42-46`) where a bare `allDests()` walk enumerates one. `[V]` The packet compiler is a
ninth consumer of that authority and adds no tenth enumerator; `exact-legal-mobility` §1.2 already
names `semantic-evidence.ts` as one of its eight, and this RFC keeps that promise rather than opening
a parallel one.

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

**§5.3 — The emitted closure is derived from code, not inferred from a sample** ([[D1574]]).
`localSemanticEvents` and the packet compiler consume one exported literal
`LOCAL_CANDIDATE_EVENT_PROJECTION_IDS`; it is assembled from the exact one-edge collector groups
the function composes and is set-equal to their manifest semantic-event declarations. Sequence
events requiring `run.record.move@1` and selection-derived avoidance events are excluded by their
declared source/shape, not by their absence from a corpus. The compiler rejects any retained event
whose id is outside that set.

`make candidate-closure-census` has two outputs with different authority. The **schema arm** emits
the code-derived set and requires one named positive plus one hard-negative fixture per member. The
**population arm** reports which members fired and at what prevalence over the fixed sweep; it may
be empty for a rare member without deleting it from the schema. The 2026-08-26 control observed
41/67 catalogue events and missed both one-edge checkmate and promotion, proving the population arm
cannot define the set. `[V]` `d1573-candidate-packet-envelope.json`. This code-derived closure makes
§1.5's two-enumerator divergence impossible to reintroduce silently and gives `hint-distance` a
literal source registry to intersect with, never a sampled list. Criterion 9.

The reading half has the same single authority and explicitly includes the two values the earlier
draft would have dropped ([[D1635]]):

```ts
const CANDIDATE_DERIVED_READING_PROJECTION_IDS = Object.freeze([
  "rules.exchange.predicate.legal_exchange",
  "derived.tactic.fork_survives_reply",
] as const);

const LOCAL_CANDIDATE_READING_PROJECTION_IDS = Object.freeze([
  ...CANDIDATE_CHILD_READING_PROJECTION_IDS, // the twenty moved child-reading projections
  ...CANDIDATE_DERIVED_READING_PROJECTION_IDS,
] as const);
```

`candidateChildReadings` owns the twenty child-position calls after moving to runtime. The packet
compiler separately evaluates `legal_exchange` on the exact root edge and evaluates
`fork_survives_reply` only from the retained double-attack event plus exact reply breadth/legal
exchange inputs. Its explicit abstention is retained in `row.abstentions`; no-match emits neither a
reading nor an abstention. Both exported arrays are set-equal to the literal §3.1 F1 inputs and the
candidate-vector declaration. Before/after migration fixtures compare projection **identity
multisets** (not just counts) on ordinary, capture, double-attack and abstaining candidates; deleting
either extra derivation fails while all twenty child readings remain present.

**§5.4 — The narrow closure is repaired, not tolerated.** `selectLocalSemanticEvidence`'s inline
eight-family closure (`semantic-evidence.ts:1058-1064`) is replaced by a packet read, so the played
events and the alternative population come from the one compiler. The measured consequence is that
`semantic-evidence-check.ts:20`'s assertion changes what it is asserting over; the check is updated
in the same change and its `19/19` becomes a set-equality against the packet rather than two
integers. Criterion 10, which is **red before the change and green after**.

### §6 — Cache identity, invalidation, single-flight, and the bound

**§6.0 — Ownership and process boundary** ([[D1572]]). `CandidatePopulationService` owns one
`CandidatePopulationCache`; neither is a module singleton. `apps/server/src/application.ts`
constructs the service once and injects it into `OpponentSelector` and the server-side semantic
selection operation. Future Guided Hint and Review joins share it only if they execute in that same
server process and receive the same injected service. A browser, worker or second server process
compiles or fetches its own derived result; this RFC refuses packet serialization and therefore
claims no cross-process packet reuse. Tests construct isolated services with explicit limits.

The application composition root is the cache lifetime: restart clears it, deployment instances do
not coordinate it, account/run deletion has nothing to invalidate because no learner/session term
enters the key. A production operation reaching the compiler without an injected service fails the
consumer-operation census; it may not instantiate an ad-hoc cache per request.

The production operations are named, callable and separately cancellable ([[D1633]]):

```ts
interface CandidatePopulationService {
  get(request: CandidatePopulationRequest, signal: AbortSignal): Promise<ConsumerEvidenceView<CandidateEventPopulation>>;
}

interface SemanticSelectionOperation {
  select(input: { beforeFen: string; playedUci: string; policy: VersionedEvidenceId }, signal: AbortSignal):
    Promise<EvidenceSelectionResult>;
}

interface CandidateFeatureOperation {
  build(input: { packet: ConsumerEvidenceView<CandidateEventPopulation>; evaluations: readonly DeclaredEvidence<FixedBoundPositionEvaluation>[] }, signal: AbortSignal):
    Promise<ConsumerEvidenceView<CandidateFeatureVector>>;
}
```

`apps/server/src/semantic-selection-operation.ts` owns the research operation: it requests the
event scope, finds the played row using the packet reader and passes that row plus the packet's
literal alternatives to `selectSemanticEvidence`; the CLI calls this operation rather than a
runtime helper that recompiles. `apps/server/src/candidate-feature-operation.ts` owns the bot join:
it requests the full scope, obtains fixed-bound evaluations through the shared provider scheduler,
then compiles the root-side vector. `OpponentSelector.select` calls it only for a compiled bot
profile declaring evidence/guard inputs; profiles without those layers do not pay for it. The
production test supplies such a compiled profile through the real selector path, so this is
consumption rather than a dormant anchor.

`createApplication` constructs one packet service, the semantic operation, candidate-feature
operation and bounded final-selection cache, injects them into `OpponentSelector` and the CLI/service
composition adapter, and closes their scopes on application shutdown. Caller abort/deadline flows
into packet single-flight and the provider scheduler. Cancelling one waiter removes that waiter;
shared packet compilation continues for remaining waiters and aborts when none remain. A completed
packet may be cached; failures/cancellations are not. No public REST route is added by this lower
primitive—the hint, Review and bot route owners expose their own operations—but every listed
consumer is invoked through a production composition path and operation census.

**§6.1 — The key is facts only.**

```text
packetId = digest(
  canonical full six-field FEN,
  legal-convention id@version,
  move-identity convention,
  compiled-manifest digest,
  packet-compiler version,
  request scope
)
```

**Selection policy is not in the packet key, and neither is a seed, a profile, a band, history or a
session.** That statement applies only to the factual packet. The complete cache hierarchy is
literal and no layer may drop an input owned by the layer below ([[D1632]]):

1. **Factual packet:** the `packetId` tuple above.
2. **Provider exchange:** the provider RFC's complete normalized request identity and receipt. For
   Maia this includes `startFen + historyUci[]`, model/band, temperature, top-p, requested width and
   provider generation. For Stockfish it includes exact FEN, engine/version/generation and bound.
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

Landing replaces it with a bounded `OpponentSelectionCache`. Provider execution first yields the
same-exchange receipt from `provider-exchange-and-execution`; only then can the policy-result key be
constructed. Cache lookup therefore cannot precede provider identity unless a retained exact
provider result supplies that receipt. The final cache keeps single-flight, entry/weight bounds and
rejection deletion; a packet hit never implies a provider or selection hit.

**§6.3 — Single-flight and a measured dual bound.** Packet construction is single-flight per key —
the in-flight promise is stored, and deleted on rejection so a failure is not memoised. The cache is
an LRU bounded by both **entry count** and deterministic **typed retained weight**. The initial
configurable defaults are `maxEntries: 8` and `maxRetainedWeight: 56_000`, with
`packetWeight = eventCount + 5 × readingCount`. Both are constructor options injected at §6.0's
composition root. Event and reading counts are reported separately in stats so the coefficient is
observable rather than hidden inside one integer.

The event-only fixed population measured p95 5,482 and max 5,803 events; eight maximum packets are
46,424 events and about 63 MB of structural JSON before V8 overhead. The first Node-24 full-scope
trial proves equal weight is wrong: 37,804 events add 52.28 MB heap, while adding 6,629 readings
raises the same eight-entry cache to 91.78 MB. The incremental reading/event heap-per-item ratio is
4.31 (structural JSON independently reads 2.00×), so the corrected trial rounds up to 5. It retains
six stress roots at 52,975 weight, 51.22 MB structural JSON and 67.17 MB heap; event-only retains
eight at 37,804 weight and 52.28 MB heap. `[V]`
`planning/evidence-foundation-ux/d1579-candidate-packet-node24-envelope.json`; [[D1579]]. The
equal-item arm remains a mandatory negative control.

These are **initial mechanism defaults, not a release-tier clearance**. O13/F12 name `core`, `cpu`
and `accelerated` but provide no numeric heap/RSS ceiling, so “the envelope is exceeded” has no
testable predicate today. [[D1580]] requires F12 to supply that release predicate; this RFC keeps
the cache bounded/configurable and criterion 12 records the measured bytes without manufacturing a
pass threshold.

Insertion evicts least-recently-used settled entries until **both** bounds hold. In-flight entries
are never evicted; if their settlement would exceed a bound by itself, the packet is returned but
not cached and the introspection record states `oversize_not_cached`. `cacheStats()` reports entry
count, retained weight, hit/miss/projection-hit/eviction/oversize counts, never FENs or learner data.
Criterion 13 asserts eviction actually happens at each bound and that two concurrent requests for
one key compile once.

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

### §7 — Three consumers, three exact joins, three honest abstentions

Each join takes the packet plus **one declared input family** (a complete same-bound evaluation set
for the bot, one PV table for Hint, one played edge for Review), and each abstains on a stated
condition without disturbing the packet.

**§7.1 — The bot's candidate vector.** Inputs: the complete population, plus one sealed fixed-bound
evaluation **per scored candidate**. Output: scores joined to retained event identities. Abstains
when the evaluation provider is off, when the score set is incomplete or mixes mate and centipawn
domains ([[D969]]'s measured case: the typed rerun *"abstains on 11 mixed mate/cp positions (33
cells) rather than converting mate to fake cp"*), or when the bot's declared cap is not the complete
population it claims. `[V]`

[[D1571]] makes “joined” literal rather than descriptive. The repaired payload is:

```ts
interface CandidateScoreJoinRow {
  readonly packetId: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly candidateEventIds: readonly string[];
  readonly evaluation: DeclaredEvidence<FixedBoundPositionEvaluation>;
  readonly rootScore:
    | { readonly kind: "centipawns"; readonly value: number }
    | { readonly kind: "mate"; readonly outcome: "root_mates" | "root_is_mated"; readonly distance: number };
  readonly loss:
    | { readonly kind: "centipawns"; readonly value: number }
    | { readonly kind: "mate_distance"; readonly value: number }
    | { readonly kind: "mate_outcome_flip" };
}

interface CandidateFeatureVector {
  readonly packet: DeclaredEvidence<CandidateEventPopulation>;
  readonly scoreFrame: "root_side";
  readonly candidates: readonly CandidateScoreJoinRow[];
}
```

`evaluation.projection` is `live.stockfish.position_eval@1` (§8.3). Each row is accepted only when
`packetId`, `moveUci` and `afterFen` match one packet row and the evaluation's exact FEN matches that
child. Completeness is set equality between joined rows and the declared evaluated scope; the
complete arm requires all packet rows. The vector's literal derivation inputs are the packet and
the generic position evaluation, and the runtime payload retains the exact admitted input values.
A score number plus a copied engine identity is not an input and is rejected.

`rootScore` is a derived value, never a relabel of the White bytes ([[D1636]]). For a White root,
centipawns are retained; for a Black root they are negated. A mate item maps its named mating side
to `root_mates|root_is_mated` and requires a positive safe-integer distance. Every row must share
one engine id/version/generation and one literal bound. The loss algebra is closed by score domain:

- cp-only: `bestRootCp - rowRootCp`, finite and non-negative;
- mate-only: `root_mates` outranks `root_is_mated`; among root mates, shorter distance is better;
  when every move is losing, longer distance is better. Same-outcome distance difference becomes
  `mate_distance`; a losing candidate below a winning best becomes `mate_outcome_flip`.
- mixed cp/mate: the vector abstains `mixed_score_domain`; no mate value is converted to fake cp.

Black-root, cp-only, all-winning-mate, all-losing-mate, outcome-flip, mixed-domain, engine/bound
mismatch and zero/non-integral mate fixtures make the conversion and comparison able to fail. The
vector declares `scoreFrame: "root_side"` only because it retains these derived `rootScore`/`loss`
values beside the original White evaluation.

**A bot may evaluate a declared capped subset** — that is legitimate and cheap — but then the derived
value is marked `evaluated_subset` and **may not support a complete-alternative claim**. **MultiPV is
a scored search output and is not the exact legal population**, and criterion 15 makes that failable
rather than conventional: a MultiPV result presented as the population fails.

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

**§8.3 — One node-free engine point is shared by candidate scoring and Review** ([[D1571]],
[[D1576]]). The current defect is unchanged:
`derived.opponent.candidate_feature_vector@1` declares
`dependsOn: [ref("live.stockfish.eval"), …]` and `derivation.anyOf` requiring
`live.stockfish.eval` with each collector (`evidence-catalog.ts:721-722`), while its declaration
adapter checks four operand keys and nothing else (`evidence-source-adapters.ts:163`) and its
constructor accepts any finite number (`candidate-evidence.ts:198`). `[V]` This is the
undeclared-input class caught for runtime opening identity at [[D1018]], live in an operator
projection.

This RFC adds `live.stockfish.position_eval@1`, the generic source primitive both products were
missing:

```ts
type FixedBoundPositionScore =
  | { readonly kind: "centipawns"; readonly value: number }
  | { readonly kind: "mate"; readonly side: "white" | "black"; readonly distance: number; readonly unit: "moves" };

interface FixedBoundPositionEvaluation {
  readonly fen: string;                 // canonical full six-field evaluated FEN
  readonly positionKey: string;         // transposeKey(fen), retained but never substituted for fen
  readonly perspective: "white";
  readonly score: FixedBoundPositionScore;
  readonly engine: { readonly id: string; readonly name: string; readonly version: string };
  readonly bound:
    | { readonly kind: "movetime"; readonly requestedMs: number; readonly reachedDepth: number | null }
    | { readonly kind: "depth"; readonly requestedDepth: number; readonly reachedDepth: number | null }
    | { readonly kind: "nodes"; readonly requestedNodes: number; readonly reachedDepth: number | null };
  readonly receipt: ProviderExchangeReceipt; // same exchange as score/engine/bound
}
```

The projection belongs to `live.stockfish`, with `grounding: bounded_search`,
`exactness: measured`, `confidence: reported`, operands exactly the seven fields above, answer
`evaluation`, forms `panel | machine_condition`, and abstention
`provider_unavailable | invalid_source_payload`. It contains no node id, best move, PV, rank or
grade. The operand list includes `receipt` after composing with
`provider-exchange-and-execution`; the receipt's actual engine/generation/request/bound/response
identity must match the filtered fields from the same exchange. The adapter constructs a filtered
value; it never stamps health or seals a generic provider payload by reference.

`review-evidence-compiler.md`'s node-scoped `derived.review.eval_point@1` derives from this
projection plus `run.record.position@1`; it does not fake a node id for hypothetical children
and does not create a second score authority. Candidate scoring consumes `position_eval` directly.
The vector becomes a derivation of the packet plus admitted position-evaluation items and the
typed White→root-side comparison in §7.1: a
caller-invented score is rejected unless the sealed item's exact FEN, engine identity, bound and
typed score domain match the packet row. Criterion 17 is the must-fail fixture — `scoreCp: 900031`
with no admitted item fails; an equivalently large **typed centipawn** item with valid provenance
succeeds because the gate checks provenance/domain, not plausibility. A mate item never enters a cp
field; mixed domains abstain as §7.1 states. The original White item remains available to Review;
only `derived.opponent.candidate_feature_vector@1` owns root-side scores and loss.

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

**Ships in this RFC, complete:** the exact F1 tuple and operator-only bindings for
`derived.candidate.event_population@1`; the compiler and its set-equality completeness assertion;
the checkmate/stalemate terminal distinction and explicit adjudication separation; the request-scope vocabulary and immutable wide-to-narrow
projection; the legal-authority and dialect rules; original sealed-event retention; the
**code-derived** event and 20+2 reading closures plus a separate prevalence/cost census and `make
candidate-closure-census`; the injected per-process `CandidatePopulationService`; the full-FEN key,
single-flight, dual-bound weighted LRU, statistics and invalidation rules; the three join contracts
with their abstentions; the `evaluated_subset` marker and the MultiPV refusal; the Maia-leak repair;
the generic node-free `live.stockfish.position_eval@1` source and engine-provenance repair to
`candidate_feature_vector`, including White→root-side score and typed loss; the bounded
history-preserving final selection cache; the concrete semantic-selection and candidate-feature
operations plus application injection/cancellation; the
`selectSemanticEvidence` input repair and the `evaluatedAlternatives` fix; the narrow-closure repair;
and the operator-only and LLM boundaries. That is the whole mechanism.

**Held, and the holds are not mine.**

1. **Tier-2 variant rulesets (codex, Discharge D6)** — two collectors are defined against the
   standard back rank, and `evidence-move-selector.md` D3 already owns that repair. The packet would
   compile in a variant and would carry two features that mean nothing there. Refusing to ship it
   into Tier 2 until D3 lands is honesty, not scope.
2. **The end-to-end latency and memory acceptance (claude, Discharge D2)** — the dossier's own handoff item 8,
   and §0's correction 4 shows why it cannot be inherited from D1066: that pair is not a controlled
   cold/warm measurement of one computation. The number this RFC owes is its own.
3. **Selection-policy registration for the hint (claude, `hint-distance.md`)** — the only shipped
   policy is `research.r2_candidate@1`, `disposition: "experimental"`
   (`evidence-catalog.ts:974-979`). `[V]` A production hint policy is that RFC's to declare; the
   packet serves whichever policy is registered.

**None of these narrows the mechanism**, and none of them is a size argument.

### §11 — What this RFC refuses, at mechanism level

1. **Widening `CandidateFeatureVector` into the shared layer** — [[D1072]], measured. It is not a
   population, it does not retain sealed evidence, and it couples rules-only facts to an engine and a
   search budget. It stays what it is: one derivation, repaired for provenance (§8.3).
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

[[D1575]] removes the false six-file target: the old table counted a tool as production, omitted the
adapter/barrel and left a server-private readings authority below a runtime compiler. The table is
the minimum symbol migration; criterion 20 derives the touched production set and checks every
listed symbol moved exactly once rather than rewarding a hand count.

| # | file | change |
|---|---|---|
| 1 | `packages/runtime/src/candidate-population.ts` (new) | compiler, legal-authority read, per-child derivation, the **moved** one-authority `candidateChildReadings`, set equality, terminal/scope rules and packet declaration (§3–§5) |
| 2 | `packages/runtime/src/candidate-population-cache.ts` (new) | service/cache types, exact-scope projection, key, single-flight, dual-bound LRU, stats and invalidation (§6) |
| 3 | `packages/runtime/src/evidence-catalog.ts` | exact §3.1 tuple and two bindings; `LOCAL_CANDIDATE_EVENT_PROJECTION_IDS`; `live.stockfish.position_eval@1`; corrected vector derivation (§5.3/§8.3) |
| 4 | `packages/runtime/src/evidence-source-adapters.ts` | exact packet and filtered position-evaluation declarations; neither seals a generic payload by reference |
| 5 | `packages/runtime/src/semantic-evidence.ts` | selection takes a sealed packet view instead of a callback; both enumerators consume one closure; counts become measurements (§1.2–§1.5, §5.4) |
| 6 | `packages/runtime/src/index.ts` | public packet/service/scope/readings and position-evaluation contracts; no consumer deep-imports source files |
| 7 | `apps/server/src/candidate-evidence.ts` | deletes private `childReadings`; pure vector compiler retains packet, admitted White evaluation, derived root score/loss; Maia closure leak closes (§7.1/§8.2–§8.3) |
| 8 | `apps/server/src/position-evaluation.ts` (new) | filtered `live.stockfish.position_eval@1` construction from the shared provider scheduler: typed cp/mate, White perspective, exact FEN, same-exchange receipt, engine and bound |
| 9 | `apps/server/src/semantic-selection-operation.ts` (new) | injected production research operation over an event-scope packet; owns request abort/deadline and replaces CLI-local compilation |
| 10 | `apps/server/src/candidate-feature-operation.ts` (new) | injected bot operation over a full-scope packet plus same-bound Stockfish evaluation set; owns vector abstention and cancellation |
| 11 | `apps/server/src/opponent-selection-cache.ts` (new) | bounded single-flight final-policy cache keyed only after exact provider receipt, retaining Maia history/model identity ([[D1632]]) |
| 12 | `apps/server/src/opponent-selector.ts` | receives packet/feature operation and final cache; compiled evidence/guard profiles traverse them, ordinary provider-only profiles do not compile unused evidence |
| 13 | `apps/server/src/application.ts` | constructs one packet service and the three server operations/caches, injects them, propagates shutdown/abort, exposes no packet singleton |
| — | `tools/candidate-closure-census.mjs` (new; governance tool, **not production**) | code-derived schema arm plus prevalence/cost arm (§5.3) |

Named validation and docs sites that necessarily move (the [[D828]] discipline — named, not implicit,
and not additional implementation homes): `apps/server/src/semantic-evidence-check.ts` (§5.4's
assertion), `packages/runtime/src/semantic-evidence.test.ts`,
`packages/runtime/src/candidate-population.test.ts`,
`packages/runtime/src/candidate-population-cache.test.ts`,
`packages/runtime/src/evidence-catalog.test.ts`, `apps/server/src/candidate-evidence.test.ts`
(including its *"features every legal candidate"* sentence, which becomes true),
`apps/server/src/position-evaluation.test.ts`, `apps/server/src/evidence-manifest.test.ts`,
`apps/server/src/semantic-selection-operation.test.ts`,
`apps/server/src/candidate-feature-operation.test.ts`,
`apps/server/src/opponent-selection-cache.test.ts`, `apps/server/src/application.test.ts`,
`apps/server/src/opponent-selector.test.ts`, `docs/evidence-contract.md`,
`docs/semantic-evidence.md`, and `Makefile`.

**No `schemas/` or `packages/schema/` file changes**, which is what makes the `none` claim failable
rather than aspirational — criterion 14.

### §13 — Where each finding is specified

| ledger row | finding | specified in | made failable by |
|---|---|---|---|
| proposed 🐞 | `selectSemanticEvidence` never checks alternative events against the edge they were supplied for | §1.2, §3.2 | criteria 1, 5 |
| proposed 🐞 | `evaluatedAlternatives` is a constant, and an unevaluated population is **flattering** | §1.3–§1.4, §7.3 | criterion 10 (red before, green after) |
| proposed 🐞 | two shipped enumerators disagree on the event closure and select different evidence | §1.5, §5.3–§5.4 | criteria 9, 10 |
| proposed 🐞 | `CANDIDATE_COLLECTOR_IDS` admits `human.maia.candidate_wdl` where the manifest excludes it | §8.2 | criterion 16 |
| proposed 🐞 | the shipped selection cache is keyed on policy and session, and is unbounded | §6.2–§6.3 | criteria 11, 13 |
| proposed 📊 | the event envelope loses **six** fields, not five — `evidence`, and with it the producer | §0.2, §5.1 | criterion 7 |
| proposed 📊 | the D1071 cold/warm pair is not a controlled A/B of one computation | §0.4, §10 hold 2 | criterion 12 |
| proposed 📊 | the packet is the population both sibling coverage obligations are stated against | §2 | criteria 2, 5, 15 |
| proposed 🐞 | `SEMANTIC_EVENT_VALUES` does not distinguish a rebuild from the original, and asserting an event mints a second sealed twin | §5.2, §6.5 | criterion 8 (a rebuild that *passes* the seal) |
| proposed 🐞 | a criterion citing `register-check` C1–C7 omits C8, the only check that fires on a `none` claims block | criterion 14 | criterion 14 |
| [[D1570]] | the packet named a projection without the F1 producer/output tuple, adapter or binding | §3.1 | criteria 18, 22 |
| [[D1571]] | the vector repair stripped the engine evidence and packet identity it claimed to consume | §7.1, §8.2–§8.3 | criteria 15–17 |
| [[D1572]] | one cache for three consumers had no execution topology or owner | §6.0 | criterion 23 |
| [[D1573]] | scope/key/transposition claims conflicted and entry count did not bound memory | §3.4, §6.1–§6.3 | criteria 4, 11–13, 21 |
| [[D1574]] | a fixed-position census was treated as the emitted schema | §5.3 | criteria 9, 16 |
| [[D1575]] | the six-file target omitted the server-private readings authority and production entries | §12 | criterion 20 |
| [[D1576]] | Review's run-node-bound engine point could not represent a hypothetical candidate honestly | §8.3; Review RFC amendment | criterion 17; Discharge D8 |
| [[D1900]] | the shared factual cache returns a consumer-specific view without defining or keying the consumer | §6.0 | repeat review; amend service/request boundary before criterion 23 |
| [[D1901]] | the compiled scope-wide `anyOf` declaration has no runtime value-level derivation-member witness | §3.1 | repeat review; amend F1 admission/receipt before criterion 22 |
| [[D1902]] | the claimed live bot consumer is reachable only through a test-created profile while the production roster is empty | §6.0, §10 | repeat review; narrow first landing or wait for an accepted concrete profile |
| [[D1903]] | per-child position evaluation replaces the measured one-root bot-guard operation without a whole-set execution budget | §7.1, §8.3 | repeat review; reconcile source/topology before criterion 17 |

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

1. **The population is never an argument.** A fixture attempting to supply `candidates`,
   `legalMoves`, `afterFen`, or any event or reading to the packet compiler **fails to type-check**
   (`.typecheck.ts`), and no runtime predicate is the enforcement. *Wrong implementation that would
   pass a weaker check: one that accepts a caller population and validates it.*
2. **Completeness is set equality against the authority, not a count.** A fixture asserts
   `candidates.map(r => r.moveUci)` set-equal to `exactLegalMoves(beforeFen).map(m => m.uci)` on
   ordinary, check-evasion, castling, en-passant and **promotion** positions. Must-fail fixtures: one
   omitted move, one duplicate, one extra, one wrong child FEN. The promotion case is required
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
   fails to type-check.
5. **One packet serves both the played row and the alternative denominator — compared on `(moveUci,
   afterFen)` pairs, not on cardinality.** The cardinality arm alone **cannot fail**:
   `alternatives = candidates.filter(row => row.moveUci !== playedUci)` makes
   `|alternatives| = |candidates| − 1` an arithmetic consequence of criterion 2's set-equality, and
   both sides of the `legalAlternativeEdges` comparison read the same `exactLegalMoves` authority
   (`semantic-evidence.ts:968`), so a moveUci-only comparison restates criterion 2. What *can* differ
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
9. **The closure is code-derived; the sample only measures it** ([[D1574]]).
   `LOCAL_CANDIDATE_EVENT_PROJECTION_IDS` is set-equal to the exact collector groups composed by
   `localSemanticEvents` and their manifest semantic-event rows. Every member has one positive and
   one hard-negative fixture. The population census separately reports observed prevalence and is
   allowed to miss members; its 41/67 control is retained as proof that sampling is not schema.
   `LOCAL_CANDIDATE_READING_PROJECTION_IDS` is separately set-equal to the twenty child readings
   plus legal exchange and fork survival. Ordinary, capture, double-attack and abstention fixtures
   prove projection-identity multiset equality before/after migration. Adding a collector call
   without its id, an id with no callable collector/fixtures, or dropping either extra reading
   fails.
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
    `planning/evidence-foundation-ux/d1579-candidate-packet-node24-envelope.json` records event-only,
    equal-item negative-control and corrected event+reading arms: typed retained weight, separate
    event/reading counts, structural bytes, heap/RSS delta and cache stats under the initial
    8/56,000 dual bound. It must reproduce the equal-item arm retaining materially more heap while
    still passing that bad bound, and the corrected `events + 5×readings` arm staying within weight.
    The receipt does **not** call the result release-cleared; [[D1580]] keeps that decision red until
    F12 names a numeric resource-tier predicate. This splits a buildable bounded mechanism from an
    unavailable release threshold instead of inventing one.
13. **Single-flight and both bounds work.** Two concurrent requests for one key compile **once**; a
    rejected compilation is not memoised; exceeding either 8 entries or 56,000 retained weight
    evicts least-recently-used settled entries until both hold; in-flight entries survive; one
    oversize packet is served uncached and counted. Deleting the reading coefficient (or changing
    it to 1) fails the Node-24 negative control. Projection hits do no chess work and carry their
    own scope/id. *Fails against an unbounded, entry-count-only or untyped-item `Map`.*
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
15. **MultiPV is refused as the population, and `evaluated_subset` is honest.** A join built over a
    MultiPV result presented as the legal population fails; a declared capped subset succeeds and is
    marked `evaluated_subset`; and a complete-alternative claim over an `evaluated_subset` value
    fails.
16. **The Maia leak is closed.** A `human.maia.candidate_wdl` declaration offered to the packet
    compiler is refused, and the packet's admitted closure is asserted set-equal to
    the scoped union of `LOCAL_CANDIDATE_EVENT_PROJECTION_IDS` and
    `LOCAL_CANDIDATE_READING_PROJECTION_IDS`, not to `CANDIDATE_COLLECTOR_IDS` or a position sample.
17. **A caller-invented score and a fake node are refused.** `scoreCp: 900031` with no admitted
    `live.stockfish.position_eval@1` item **fails**; a typed centipawn item with the same magnitude,
    exact child FEN, White perspective, same-exchange receipt, engine identity and one bound
    succeeds. White/Black cp roots orient oppositely and compute non-negative best-minus-row loss;
    winning-mate chooses shorter, all-losing mate chooses longer, and an outcome flip remains
    categorical. Wrong FEN, generation/engine/bound mismatch, zero/non-integral mate distance,
    cp/mate mixing and a fabricated Review `nodeId` fail. Review's node-scoped point derives
    separately from position-eval + `run.record.position`.
18. **Operator-only, demonstrated.** A fixture asserts no learner-role surface receives a packet, and
    that the advanced inspector's item names sources without enumerating candidates.
19. **No renderer path reaches the packet.** A fixture asserts the LLM/renderer boundary receives only
    sealed selected items, and a must-fail fixture attempts to pass a packet to it.
20. **The implementation surface is derived, not targeted.** An AST receipt proves every §12 symbol
    has one production definition, `childReadings` has been deleted and replaced by the exported
    runtime authority, no runtime file imports `apps/server`, no consumer deep-imports the new source
    modules, each of the thirteen production rows has its named definition/caller, and the
    governance tool is not counted as production. Any extra production file is
    named in the receipt rather than hidden to preserve a total.
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

22. **The packet is a complete F1 projection, not an interface wearing an id.** The compiled
    manifest accepts the literal §3.1 producer/output tuple with the exact three scope-discriminated
    `anyOf` members over legal moves plus the complete event/reading closures, weakest
    grounding/exactness and `input_abstained`, and exactly the two landing bindings to
    `research.semantic_selection@1` and `opponent.selection@1`. Deleting either binding fails orphan
    closure; widening either operation beyond the declared answer/form fails compilation; adding a
    learner-role binding or a generic payload adapter fails the role/adapter audit. The operation
    receives a sealed `ConsumerEvidenceView<CandidateEventPopulation>`, never a raw payload.
23. **One injected service owns one process-local cache and real operations consume it.** An
    application-composition fixture constructs one `CandidatePopulationService`, injects it into
    `SemanticSelectionOperation`, `CandidateFeatureOperation` and `OpponentSelector`, then traverses
    the real semantic CLI operation and a compiled evidence-bearing bot profile. The two scopes
    compile/hit exactly as §3.4 allows; provider receipt and final policy cache identities remain
    distinct. Cancellation removes one waiter, aborts on the final waiter, and never caches a
    failure. A repository assertion refuses a module singleton and ad-hoc
    `new CandidatePopulationCache()` inside request handlers. A separately constructed service
    compiles independently and makes no cross-process reuse claim; hint and Review acquire bindings
    only through Discharge D9 when their production operations land.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Repair the shipped `OpponentSelector` cache as the bounded third-layer policy cache: retain the complete Maia/provider receipt (including history/model/generation), then join packet id plus every compiled policy input; never substitute packet identity for provider identity (§6.2) | codex | `planning/evidence-foundation-ux/` | |
| D2 | Measure end-to-end cold and warm latency on one computation and record it beside the D1071 baseline as a distinct measurement; measure both cache scopes and preserve the equal-item falsifier (§0.4, criterion 12) | codex | `planning/evidence-foundation-ux/d1579-candidate-packet-node24-envelope.json` | discharged 2026-08-26 for the pre-implementation envelope; implementation re-runs the same receipt on production symbols |
| D3 | Register a production hint selection policy; only `research.r2_candidate@1` exists and it is `disposition: "experimental"` (§10 hold 3) | claude | `rfc/hint-distance.md` | |
| D4 | Correct the returned `hint-distance.md:593` [[D1330]] rank citation (§0.6) | codex | rebuilt `rfc/hint-distance.md` | discharged 2026-08-26 |
| D5 | Fold the packet's population into `review-evidence-compiler.md`'s opportunity/avoidance denominator when that RFC implements (§2.5) | claude | `planning/evidence-foundation-ux/` | |
| D6 | Tier-2 variant support: the collectors are standard-chess-shaped and two are defined against the standard back rank; this is `evidence-move-selector.md` D3's repair, and the packet inherits it (§2.2, §10 hold 1) | codex | `planning/platform-alignment/bot-policy/` | |
| D7 | A serialised, cross-process packet form with a receipt and a re-seal on admission, **if** ever wanted — refused here, exit named (§6.5, §11.5) | OWNER | `rfc/README.md` | |
| D8 | Reconcile `review-evidence-compiler.md` so its node point is `derived.review.eval_point@1` over `live.stockfish.position_eval@1` + `run.record.position@1`; no fake node and no second engine-score authority (§8.3) | codex | Review RFC amendment commit | |
| D9 | Bind future production hint and Review join operations to the packet only when those operations land; the raw packet remains operator-only and never becomes a learner-module input (§3.1, §9) | codex | each consumer RFC registration/implementation commit | |

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
