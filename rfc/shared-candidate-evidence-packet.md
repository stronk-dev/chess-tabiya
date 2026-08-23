# RFC: Shared candidate evidence packet — the compiled legal population three consumers are measured against

- **Status:** draft — 2026-08-23
- **Author:** claude (drafted from `design/research/shared-candidate-evidence-packet.md` and `tools/d1071-candidate-packet-harness/`; every carried claim re-verified at HEAD, with seven corrections recorded)
- **Created:** 2026-08-23
- **Design refs:** `design/05-in-run-experience.md` §5 (*"detection is cheap, significance is not"* — the split this RFC executes in code: one factual population, separate opinionated derivations) and §3b-i (*"The LLM is the voice, never the source"*); `design/03-product-breadth.md` §Play (opponent selection) and §Intelligence and explanation
- **Exploration gate:** [[D1071]] 📊 and [[D1072]] 🐞 — research complete 2026-08-23, dossier `design/research/shared-candidate-evidence-packet.md`, executable falsifier `tools/d1071-candidate-packet-harness/` under `rfc/0000-rfc-process.md` §Exploration gate. [[D1330]]'s per-dossier classification of all 118 research artifacts ranked this **live debt rank 6**: the population finding was partially adopted by `evidence-move-selector.md`, *"but the packet itself is that RFC's Discharge D2, unbuilt"*
- **Depends on:** **accepted** `rfc/exact-legal-mobility.md` — it ships the single actual-turn move authority (`exactLegalMoves`/`exactLegalMoveMap`), `MOVE_IDENTITY_CONVENTION`, `MOVE_DESTINATION_CONVENTION` and the `rules.mobility.reading.legal_moves@1` projection, which is this packet's legal-convention field rather than a new one (§4.2). Implemented F1 evidence contract (`rfc/archive/evidence-contract-manifest.md`, `rfc/archive/semantic-evidence-selection.md`) and the compiled catalogue at HEAD
- **Parent / amends:** amends the `SemanticSelectionInput` contract in `packages/runtime/src/semantic-evidence.ts` (§3 — the caller-supplied alternative population becomes a compiled packet) and the `derived.opponent.candidate_feature_vector@1` declaration in `packages/runtime/src/evidence-catalog.ts:712-723` (§8.2 — its engine dependency becomes consumed rather than declared). Amends no other RFC's normative text. **Discharges `rfc/hint-distance.md` D5 on landing**; that row is its author's to flip
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
original sealed events, keyed by facts alone, and cached once for all three consumers. Bot scores,
hint PVs and Review's played edge are **three separate exact joins on top of it**, each of which may
abstain without touching the packet.

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

**And the same population is compiled up to three times per node today**, because nothing shares it:
the bot's selector cache is keyed on policy and session, the hint would compile its own, and Review
compiles a third at post-game time.

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
6. **`hint-distance.md:593` cites this dossier as [[D1330]] rank 5.** It is **rank 6**
   (`planning/platform-alignment/dossier-remainder.md:232`); rank 5 is `theory-drill-current-joins`.
   `[V]` Off by one, in a row that otherwise points at exactly the right document. Not repaired here
   — that file belongs to a concurrent draft — and recorded for its author.
7. **The ledger head is D1373, not D1354.** The drafting brief for this document stated D1354; the
   ledger's maximum id at HEAD is **D1373**. `[V]` The `## Ledger rows` section states the head it
   actually observed, per [[D1130]].

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

**§3.1 — Identity.** Register one output on a new `derived.candidate` producer implemented in
`packages/runtime/src/candidate-population.ts`:

```ts
/** derived.candidate.event_population@1 */
export interface CandidateEventPopulation {
  readonly id: string;                        // digest over the identity fields below
  readonly beforeFen: string;                 // canonical full six-field FEN
  readonly legalConvention: VersionedEvidenceId;  // rules.mobility.reading.legal_moves@1
  readonly moveIdentityConvention: string;    // MOVE_IDENTITY_CONVENTION, retained literally
  readonly manifestDigest: string;            // CompiledEvidenceManifest.digest
  readonly compilerVersion: number;           // this packet's own construction semantics
  readonly legalMoves: readonly ExactLegalMove[];  // the sealed authority's complete set
  readonly candidates: readonly CandidateEventRow[];
  readonly terminal?: { readonly reason: "checkmate" | "stalemate" | "insufficient_material" | "variant_end" };
}

export interface CandidateEventRow {
  readonly moveUci: string;                   // exactly one member of legalMoves, same dialect
  readonly afterFen: string;                  // canonical child, derived not supplied
  readonly events: readonly SemanticEvidenceEvent[];   // ORIGINAL sealed values
  readonly readings?: readonly DeclaredEvidence<unknown>[];  // ORIGINAL sealed values, if requested
}
```

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

**Empty is legal exactly once.** A zero-candidate packet is valid **only** when the root is terminal,
and then `terminal.reason` is required. A non-terminal root with zero candidates is a truncation and
fails with a typed error; the two cases have never been distinguishable in any shipped path, and
`OpponentSelector.select` currently handles it by throwing from a different layer
(`opponent-selector.ts:491-493`, *"Opponent selection requires a non-terminal position"*). `[V]`
Criterion 3.

**§3.4 — Request scope, and why it is not a completeness escape.** A consumer may request
`{ events: true, readings: false }` (the hint and Review), `{ events: true, readings: true }` (the
bot's feature family) or `{ events: false, readings: true }`. **Scope selects which evidence
families are compiled per candidate; it never selects which candidates exist.** The candidate set is
always complete. Scope is part of the cache identity (§6.1) so a narrow packet is never served to a
consumer that needs the wide one, and a wide packet **may** serve a narrow request by projection.
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
copies, so `assertSemanticEvidenceEvent` (`semantic-evidence.ts:961-966`) still passes on them. All
eight envelope fields survive: `id`, `projection`, `evidence` (with its producer and its `DECLARED`
brand), `derivationInputs`, `anchor`, `sign`, `operands`, `basis`. `[V]` This is the direct repair of
§0's correction 2: six fields the vector drops, retained. Criterion 7 asserts the assertion passes on
every retained event and that all eight keys are present, including `evidence.producer`.

**§5.2 — Reconstruction is not retention.** A consumer that needs a sign, an anchor or a producer
reads it; it does not recompute it. Recomputation defeats the cache (which is the point of the
packet) and, worse, produces an object that is byte-equal but **unbranded** — `SEMANTIC_EVENT_VALUES`
is a `WeakSet` of the exact values `compileSemanticEvidenceEvent` produced (`:54`, `:957`), so a
reconstructed event fails `assertSemanticEvidenceEvent` and any consumer that skips the assertion is
running on an unsealed value. `[V]` Criterion 8 is the must-fail fixture.

**§5.3 — The emitted closure is derived, not listed.** The packet's per-candidate event families are
whatever `localSemanticEvents` composes, and the compiler exports that set as a **derivation**:
`make candidate-closure-census` emits the projection ids actually emitted over a fixed position
sweep, and the packet's declared closure is asserted **set-equal by id** to that output, with the
HEAD count baked only as a drift tripwire ([[D1240]]). This is what makes §1.5's two-enumerator
divergence impossible to reintroduce silently, and it is what gives `hint-distance`'s family table
something to be checked against ([[D1363]]). Criterion 9.

**§5.4 — The narrow closure is repaired, not tolerated.** `selectLocalSemanticEvidence`'s inline
eight-family closure (`semantic-evidence.ts:1058-1064`) is replaced by a packet read, so the played
events and the alternative population come from the one compiler. The measured consequence is that
`semantic-evidence-check.ts:20`'s assertion changes what it is asserting over; the check is updated
in the same change and its `19/19` becomes a set-equality against the packet rather than two
integers. Criterion 10, which is **red before the change and green after**.

### §6 — Cache identity, invalidation, single-flight, and the bound

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

**Selection policy is not in the key, and neither is a seed, a profile, a band or a session.** A
selected hint is a **second** cached derivation keyed by `packetId + PV identity + selection-policy
digest`; a bot weighting is a third keyed by `packetId + profile digest + seed`. One factual
population, several opinionated derivations, none of them contaminating the facts. Criterion 11.

**§6.2 — The shipped cache is the counter-example, and it is a defect at HEAD.**
`selectionCacheKey` (`opponent-selector.ts:264-278`) is
`[policyConfigDigest, targetElo, profile.id, profile.version, profile.digest, packId, seed,
sha256(startFen + every history move)]`. `[V]` Every term is policy or session; **not one is the
position**. Two consequences, both measured by reading: the same position reached by two move orders
is two entries, and no other consumer can ever hit it. And it is **unbounded** — `#cache` is a plain
`Map` (`:469`) with no LRU, no TTL and no eviction anywhere in the class; `cacheSize()` (`:506`)
reports the growth and nothing acts on it. `[V]` Single-flight is present and correct (the promise is
stored before resolution and deleted on rejection, `:495-503`) and is the pattern §6.3 keeps.

**§6.3 — Single-flight and a declared bound.** Packet construction is single-flight per key — the
in-flight promise is stored, and deleted on rejection so a failure is not memoised. The cache is an
**LRU with a declared maximum entry count**, and the maximum is a constructor parameter with a
declared default, not a literal buried in a method. `cacheSize()`-style introspection is retained.
Criterion 13 asserts eviction actually happens at the bound and that two concurrent requests for one
key compile once.

**§6.4 — Invalidation is by key, never by mutation.** A change to the manifest digest, the legal
convention, the move-identity convention or the compiler version produces a **new key**; the old
entry is missed and eventually evicted. No compiled packet is ever edited. **Provider state cannot
invalidate a packet**, because a packet has no provider input (§8) — provider-off invalidates or
abstains the dependent *join* and leaves the population untouched. Criterion 14.

**§6.5 — Process-local, and a persisted form is refused rather than deferred.** The first and only
implementation is process-local, because the seals are `WeakSet` membership (`:54`) and do not
survive serialisation. A cross-process form is a **different projection** with a different problem:
it would need a serialised receipt carrying every literal source digest and a re-seal on admission,
and until someone writes that RFC, JSON that resembles a semantic event is not the event. §11.5
records this as a refusal with its exit named.

### §7 — Three consumers, three exact joins, three honest abstentions

Each join takes the packet plus **one** other sealed input, and each abstains on a stated condition
without disturbing the packet.

**§7.1 — The bot's candidate vector.** Inputs: the complete population, plus one sealed fixed-bound
evaluation **per scored candidate**. Output: scores joined to retained event identities. Abstains
when the evaluation provider is off, when the score set is incomplete or mixes mate and centipawn
domains ([[D969]]'s measured case: the typed rerun *"abstains on 11 mixed mate/cp positions (33
cells) rather than converting mate to fake cp"*), or when the bot's declared cap is not the complete
population it claims. `[V]`

**A bot may evaluate a declared capped subset** — that is legitimate and cheap — but then the derived
value is marked `evaluated_subset` and **may not support a complete-alternative claim**. **MultiPV is
a scored search output and is not the exact legal population**, and criterion 15 makes that failable
rather than conventional: a MultiPV result presented as the population fails.

**§7.2 — The semantic-horizon hint.** Inputs: the packet at each searched PV node, plus one sealed
versioned PV. Output: the chosen eligible event with its target, actor, occurrence ply and move,
subject to `hint-distance.md`'s rung grammar. Abstains when the PV is absent or illegal, when the
packet is missing, when the selector finds no eligible event, or when the budget expires. **Any reach
claim made over this join is a range, not a number** ([[D1352]]): 56/64 and 46/64 are upper bounds
under the R2-derived candidate policy.

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
the same member from the other side. The packet's closure is the **declared** set, derived by
§5.3's census, and criterion 16 is the must-fail fixture: a Maia WDL declaration offered to the
packet compiler is refused.

**§8.3 — The engine dependency becomes consumed or is dropped.**
`derived.opponent.candidate_feature_vector@1` declares
`dependsOn: [ref("live.stockfish.eval"), …]` and `derivation.anyOf` requiring
`live.stockfish.eval` with each collector (`evidence-catalog.ts:721-722`), while its declaration
adapter checks four operand keys and nothing else (`evidence-source-adapters.ts:163`) and its
constructor accepts any finite number (`candidate-evidence.ts:198`). `[V]` This is the
undeclared-input class caught for runtime opening identity at [[D1018]], live in an operator
projection. Under this RFC the vector becomes a **derivation of the packet plus an admitted engine
item**: a caller-invented score is rejected unless it arrives as sealed evidence naming the exact
engine identity and search bound. Criterion 17 is the must-fail fixture — `scoreCp: 900031` with no
admitted engine item fails, and the same number **with** one succeeds, because the packet's job is
provenance, not plausibility.

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

**Ships in this RFC, complete:** the `derived.candidate.event_population@1` projection and its
producer; the compiler and its set-equality completeness assertion; the terminal/truncated
distinction; the request-scope vocabulary; the legal-authority and dialect rules; sealed-event
retention with the eight-field assertion; the derived closure census and `make
candidate-closure-census`; the cache key, single-flight, LRU bound and invalidation rules; the three
join contracts with their abstentions; the `evaluated_subset` marker and the MultiPV refusal; the
Maia-leak repair; the engine-provenance repair to `candidate_feature_vector`; the
`selectSemanticEvidence` input repair and the `evaluatedAlternatives` fix; the narrow-closure repair;
and the operator-only and LLM boundaries. That is the whole mechanism.

**Held, and the holds are not mine.**

1. **Tier-2 variant rulesets (codex, Discharge D6)** — two collectors are defined against the
   standard back rank, and `evidence-move-selector.md` D3 already owns that repair. The packet would
   compile in a variant and would carry two features that mean nothing there. Refusing to ship it
   into Tier 2 until D3 lands is honesty, not scope.
2. **The end-to-end latency acceptance (claude, Discharge D2)** — the dossier's own handoff item 8,
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
   with a re-seal on admission, in its own RFC.
6. **Any provider inside the packet** — §8.1. Engine, Maia, tablebase, Explorer and LLM are all joins,
   and every one of them may be off while the packet still compiles.
7. **A distance, salience, valence, rank or grade field** — §9.2. There is nowhere to put one, which
   is the enforcement.
8. **Lifecycle state on a position key** — [[D1373]]'s rule, adopted verbatim: *"the position key may
   cache only position-derived"* facts. A packet is position-derived; nothing about a run, a route
   age, a rewind or a learner may be stored under its key.
9. **Reconstructing a sealed event instead of retaining it** — §5.2, because the reconstruction is
   unbranded and any consumer skipping the assertion runs on an unsealed value.

### §12 — Implementation surface

Unit: **production source file**; total: **6**. Criterion 20 counts the same unit.

| # | file | change |
|---|---|---|
| 1 | `packages/runtime/src/candidate-population.ts` (new) | the compiler: legal-authority read, per-candidate child derivation, event/reading collection, set-equality assertion, terminal handling, request scope, packet digest (§3–§5) |
| 2 | `packages/runtime/src/candidate-population-cache.ts` (new) | key derivation, single-flight, LRU bound, invalidation (§6) |
| 3 | `packages/runtime/src/evidence-catalog.ts` | the `derived.candidate` producer and `derived.candidate.event_population@1` projection; `candidate_feature_vector`'s derivation corrected to consume its engine item (§8.3); the declared-closure constant the census asserts against (§5.3) |
| 4 | `packages/runtime/src/semantic-evidence.ts` | `SemanticSelectionInput` takes a packet instead of an `evaluateAlternative` callback; `evaluatedAlternatives` becomes a measurement; `selectLocalSemanticEvidence`'s inline closure is replaced by a packet read (§1.2–§1.5, §5.4) |
| 5 | `apps/server/src/candidate-evidence.ts` | the vector becomes a derivation of the packet plus an admitted engine item; the `CANDIDATE_COLLECTOR_IDS` leak is closed against the declared set (§8.2–§8.3) |
| 6 | `tools/candidate-closure-census.mjs` (new) | `make candidate-closure-census` (§5.3) |

Named validation and docs sites that necessarily move (the [[D828]] discipline — named, not implicit,
and not additional implementation homes): `apps/server/src/semantic-evidence-check.ts` (§5.4's
assertion), `packages/runtime/src/semantic-evidence.test.ts`,
`packages/runtime/src/evidence-catalog.test.ts`, `apps/server/src/candidate-evidence.test.ts`
(including its *"features every legal candidate"* sentence, which becomes true),
`apps/server/src/evidence-manifest.test.ts`, `docs/evidence-contract.md`, and `Makefile`.

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

## Deviations from design

**None.** `design/05-in-run-experience.md` §5 asks for exactly this split — *"That is one hard problem
only if you keep it as one. Split it and most of it falls to rung 0"* — and this RFC is that
sentence in code: rung-0 rules facts compiled once and provider-free, with significance left to
separate opinionated derivations. §3b-i's *"the LLM is the voice, never the source"* is enforced as
an access rule in §9.3 rather than restated as prose. No design statement is widened, narrowed or
contradicted.

## Acceptance criteria

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
   if the two are represented the same way.*
4. **Scope narrows evidence, never candidates.** A fixture asserts all three scopes produce identical
   `candidates.map(r => r.moveUci)`, that a narrow packet is not served for a wide request, and that a
   wide packet projects to satisfy a narrow one.
5. **One packet serves both the played row and the alternative denominator.** From a single packet, a
   fixture derives Review's `|alternatives| = |candidates| − 1` and the bot's row for the played move,
   and asserts the alternative set is set-equal to `legalAlternativeEdges`' output for the same edge.
   *This is §4.3's difference made failable in both directions.*
6. **The dialect is closed.** A foreign-dialect castling UCI (`e1g1` where the convention says
   `e1h1`) presented to the compiler fails with a typed error naming
   `MOVE_IDENTITY_CONVENTION`; the 960 degenerate case from `exact-legal-mobility` (`g1h1` where the
   king's semantic destination equals its origin) compiles.
7. **Sealed events survive whole.** For every retained event, `assertSemanticEvidenceEvent` passes and
   `Object.keys(event).sort()` equals the eight-field envelope, **including `evidence`, and
   `evidence.producer` is present**. *Fails if the packet copies, freezes or re-wraps events —
   §0's correction 2 made failable.*
8. **Reconstruction is refused.** A must-fail fixture rebuilds an identical event with
   `compileSemanticEvidenceEvent` from retained bytes, admits it to a packet row, and the packet
   refuses it as not being the original value. *Fails if identity is compared by digest rather than by
   seal.*
9. **The closure is derived.** `make candidate-closure-census` emits the emitted projection ids over a
   fixed position sweep, and the packet's declared closure is asserted **set-equal by id** to that
   output. A projection added to `localSemanticEvents` and not to the declaration fails. HEAD counts
   are drift tripwires only ([[D1240]]).
10. **The two enumerators become one, demonstrated against the old behaviour.** A fixture on
    `r2q1rk1/pp2bppp/2n1bn2/2pp4/3P4/2N1PN2/PP2BPPP/R1BQ1RK1 w - - 0 10` playing `d4c5` asserts that
    `selectLocalSemanticEvidence` and the same policy over the full closure select the **same**
    families after the change and **different** ones before it, and that a selection whose
    alternatives were never evaluated reports `evaluatedAlternatives: 0` rather than the legal count.
    *Red before, green after — this is §1.3's and §1.5's repair, together.*
11. **The key is facts only.** Two requests differing **only** in seed, profile digest, band, session
    or selection policy produce the **same** `packetId` and one compilation; two differing in FEN,
    manifest digest, legal convention, move-identity convention, compiler version or scope produce
    different ids. *Fails if any policy term leaks into the key — the shipped selector cache (§6.2)
    is the negative example.*
12. **End-to-end cold and warm latency is measured, on one computation.** The same packet-serving
    hint and bot request is timed cold and warm on a declared machine, and both figures are recorded
    with the D1071 baseline cited beside them **as a different measurement** (§0's correction 4). No
    threshold is baked; the obligation is a recorded number with its procedure.
13. **Single-flight and the bound both work.** Two concurrent requests for one key compile **once**; a
    rejected compilation is not memoised; and exceeding the declared maximum evicts the
    least-recently-used entry rather than growing. *Fails against an unbounded `Map` — which is what
    ships today.*
14. **The claims decision stays true at implementation time.** `register-check` C1–C7 green with this
    RFC's claims block reading `none`, **and** an assertion that the implementation touched no file
    under `schemas/` or `packages/schema/`. *Forces renegotiation in the register rather than a
    silent widening.*
15. **MultiPV is refused as the population, and `evaluated_subset` is honest.** A join built over a
    MultiPV result presented as the legal population fails; a declared capped subset succeeds and is
    marked `evaluated_subset`; and a complete-alternative claim over an `evaluated_subset` value
    fails.
16. **The Maia leak is closed.** A `human.maia.candidate_wdl` declaration offered to the packet
    compiler is refused, and the packet's admitted closure is asserted set-equal to the manifest's
    **declared** input set (`evidence-catalog.ts:706-710`), not to `CANDIDATE_COLLECTOR_IDS`.
17. **A caller-invented score is refused.** `scoreCp: 900031` with no admitted engine item **fails**;
    the same value accompanied by a sealed fixed-bound engine item naming its identity and search
    bound **succeeds**. *The pair is the criterion: the second half proves the gate checks provenance
    and not magnitude.*
18. **Operator-only, demonstrated.** A fixture asserts no learner-role surface receives a packet, and
    that the advanced inspector's item names sources without enumerating candidates.
19. **No renderer path reaches the packet.** A fixture asserts the LLM/renderer boundary receives only
    sealed selected items, and a must-fail fixture attempts to pass a packet to it.
20. **The implementation surface counts 6 production source files**, the same unit §12's caption
    states.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Repair the shipped `OpponentSelector` cache: key it on the packet identity plus the policy derivation rather than on a full-history hash, and bound it (§6.2) | codex | `planning/evidence-foundation-ux/` | |
| D2 | Measure end-to-end cold and warm hint and bot latency on one computation and record it beside the D1071 baseline as a distinct measurement (§0.4, criterion 12) | claude | `planning/evidence-foundation-ux/` | |
| D3 | Register a production hint selection policy; only `research.r2_candidate@1` exists and it is `disposition: "experimental"` (§10 hold 3) | claude | `rfc/hint-distance.md` | |
| D4 | Correct `hint-distance.md:593`'s [[D1330]] rank citation from 5 to 6 (§0.6) | claude | `rfc/hint-distance.md` | |
| D5 | Fold the packet's population into `review-evidence-compiler.md`'s opportunity/avoidance denominator when that RFC implements (§2.5) | claude | `planning/evidence-foundation-ux/` | |
| D6 | Tier-2 variant support: the collectors are standard-chess-shaped and two are defined against the standard back rank; this is `evidence-move-selector.md` D3's repair, and the packet inherits it (§2.2, §10 hold 1) | codex | `planning/platform-alignment/bot-policy/` | |
| D7 | A serialised, cross-process packet form with a receipt and a re-seal on admission, **if** ever wanted — refused here, exit named (§6.5, §11.5) | OWNER | `rfc/README.md` | |

## Open questions

1. **Should the packet compile readings eagerly or lazily per candidate?** The bot's feature family
   needs the twenty per-child readings that `childReadings` assembles
   (`candidate-evidence.ts:125-148`); the hint and Review need only events. §3.4 makes scope part of
   the cache identity, which means a bot request after a hint request **recompiles** rather than
   extending. The alternative is one packet with lazily-populated readings, which is cheaper on the
   second consumer and makes the packet mutable after construction — and a mutable value with a
   content digest is a contradiction. *Recommendation: keep scope in the identity and accept the
   recompile; measure it under criterion 12 and revisit only if the measurement says so.* Not
   blocking, and criterion 4 holds either way.
2. **Does the packet replace `legalAlternativeEdges` as an exported primitive, or wrap it?** It is
   exported today and its committed-move exclusion is right for its callers and wrong for a
   population (§4.3). Keeping both means two functions with a one-element difference, which is exactly
   how §1.5's two enumerators happened. *Recommendation: keep `legalAlternativeEdges` as a thin
   derivation of the packet — `packet.candidates.filter(...)` — so there is one enumerator and the
   difference is a filter with a name.* Not blocking; criterion 5 asserts the equality either way.
3. **Whose is the packet compiler's home package?** §12 puts it in `packages/runtime` because the
   collectors, the seals and the move authority all live there and `apps/server` already imports
   them. The counter-argument is that `candidateFeatureVector` — the thing being repaired — lives in
   `apps/server`, and a runtime module that only the server uses is a layering claim without a second
   consumer. *Recommendation: `packages/runtime`, because the hint and Review consumers are runtime
   modules and the bot consumer is not the only one.* Not blocking.

## Ledger rows

*(Proposed — ids assigned at landing; head was **D1373** at drafting. The drafting brief stated
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
  profile triple, pack id, seed and `sha256(startFen + every history move)` — **not one term is the
  position**, so the same position by two move orders is two entries and no other consumer can hit
  it. `#cache` is a plain `Map` (`:469`) with no eviction anywhere in the class; `cacheSize()`
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

## Changelog

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
