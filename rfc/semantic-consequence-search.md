# RFC: Semantic consequence search — proving why one move differs from another

- **Status:** draft — opened 2026-09-14 by the owner's explicit request for the full shared upgrade;
  the architecture is research-backed, while one preregistered search-profile experiment and the
  existing candidate-foundation dependencies block acceptance. Nothing here authorizes implementation.
- **Author:** codex
- **Created:** 2026-09-14
- **Design refs:** `design/05-in-run-experience.md` §3a (assistance ladder), §3b (voice is not
  authority), §5 (detection is cheap, significance is not); `design/03-product-breadth.md`
  Intelligence and explanation, Review, Play and campaign surfaces
- **Exploration gate:** owner ruling recorded in `planning/exploration/log.md` on 2026-09-14,
  supported by `design/research/semantic-consequence-search.md`; executable predecessor evidence is
  D1066/D1363 semantic-horizon selection, D794 bounded replies, D1023 bounded targets and D1071
  complete candidate population
- **Depends on:** `shared-candidate-evidence-packet.md`, `candidate-collector-registry.md`,
  `candidate-population-service.md`, `evidence-value-authority.md`,
  `semantic-validation-authority.md`, `provider-exchange-and-execution.md`; consumes the implemented
  evidence manifest and semantic-event contract
- **Parent / amends:** new foundation between candidate collection and the consumer-specific
  `hint-distance.md`, `review-evidence-compiler.md`, `bot-policy.md`,
  `bounded-target-policy-composition.md` and pack-validation paths
- **Supersedes / superseded by:** —
- **Planning:** `planning/semantic-consequence-search/` once implementing

```tabiya-claims
none
```

This RFC introduces additive, catalogue-local process values and projections under one owner. It
does not change a pack, run, shape, principle or campaign schema; add an evidence-sourcing kind; add
a database migration; or persist a search graph. Search results that a consumer elects to persist
must travel through that consumer's already registered evidence/run authority. If a second RFC ever
becomes a writer of this RFC's closed search vocabulary, the shared-resource bootstrap is required
before either may land.

## Summary

This RFC specifies the shared mechanism that turns a strong candidate plus registered evidence into
a truthful answer to **“why this move rather than that one?”** It compiles hypotheses over legal
continuations, records witnesses and refutations, distinguishes observed provider lines from exact
and policy-weighted proof, and produces a contrastive move-reason value that Support, Review, bots
and authoring can consume without re-running or reinterpreting chess logic.

It is not a second chess engine and does not decode Stockfish's NNUE. Stockfish remains score/search
authority, Syzygy remains exact outcome authority, Maia/Explorer remain human-choice authorities,
and registered local collectors remain board-relation authorities. This search joins those sources
without allowing co-presence to become causality.

## Motivation

The evidence foundation can say that a bishop ray opened, a defender moved, a candidate passer
appeared, an evaluation changed and a human model assigns a move mass. Displaying those statements
next to one another does not prove that the ray or defender explains the engine preference.

The first semantic-horizon experiment reached 56/64 depth-12 lines within four plies, but its
production-table successor found that 28/72 non-empty selections described an opponent edge while
the proposed hint still disclosed the learner's first move. The packet was exact about the event and
false about the relationship. A separate bounded-reply experiment found that universal consequence
claims are valid but rare. These are not reasons to abandon explanation; they establish the missing
primitive: an explicit proposition, traversal authority and proof strength.

One implementation must serve all downstream products. Rebuilding a private “why” algorithm inside
Guided Hint, Review and bot policy would fork legal populations, source semantics, budgets and
language. The shared output is evidence; each product remains free to choose a different useful
subset and disclosure distance.

## Scope

### This RFC owns

1. The hypothesis declaration and executable evaluator registry.
2. A legal, bounded semantic search graph over shared candidate packets.
3. Provider-line, exact-bounded and policy-coverage traversal authorities.
4. Witness, refutation, coverage, budget and abstention receipts.
5. A contrastive move-reason compiler over one root and common source frame.
6. One injected background-capable search service used by product operations.
7. Source/perspective/polarity enforcement before any reason becomes eligible.

### Existing owners retained

| concern | owner |
|---|---|
| Complete score-free legal child population | `shared-candidate-evidence-packet.md` |
| Collector topology, dependencies and sealed outcomes | `candidate-collector-registry.md` |
| Queue, cancellation, single-flight and bounded packet cache | `candidate-population-service.md` |
| Provider execution and immutable engine/human/tablebase receipts | `provider-exchange-and-execution.md` |
| Hint rungs, redaction and rated-run ceiling | `hint-distance.md` |
| Review moment selection, budgets and re-entry | `review-evidence-compiler.md` / `review-map.md` |
| Bot weighting, profile policy and chosen-move record | `bot-policy.md` |
| Theory applicability and citations | `theory-knowledge-pipeline.md` |
| Module eligibility and workflow presets | `learner-modules.md` / `module-registration.md` / `intent-presets.md` |

### Explicitly out of scope

- extracting or claiming Stockfish's internal neural reason;
- an LLM selecting facts, grading a move, proposing a hypothesis or filling an abstention;
- a generic strategic-plan generator;
- arbitrary unregistered predicate code supplied by a caller;
- persisting or exposing the complete search graph to a learner;
- choosing Review moments, bot personality weights, hint wording or workflow defaults;
- claiming that a source correlation is a causal explanation.

## Specification

[[D3263]] is the tracked implementation/specification obligation for this complete contract.

### 1. Terms and invariants

**Candidate** means one exact legal root move. **Alternative** means another exact legal move from
the same root. **Hypothesis** means a registered proposition over named evidence operands that can
evaluate true, false or abstained. **Witness** means a legal path satisfying the proposition under
its declared quantifiers. **Refutation** means a retained legal path falsifying it. **Proof** means
the traversal receipt plus the hypothesis result; it never means mathematical truth beyond the
declared rules, source population and horizon.

Six invariants apply everywhere:

1. The root and every expanded node use one exact legal-move authority and a complete candidate
   packet for the requested scope.
2. Every event occurrence retains position, edge, actor, beneficiary/adversary, sign, operands,
   projection and source identity.
3. A later event is not causal merely because it occurs after the root move.
4. A skipped legal branch weakens the result's proof class unless an exact registered rule proves
   that branch irrelevant to the proposition.
5. Provider score, human mass, theory applicability and semantic relation remain independently
   addressable inputs in the output.
6. Every budget exit, unavailable source, invalid line and unsupported hypothesis returns a typed
   abstention. Partial traversal never becomes a negative or universal result.

### 2. Search subject

```ts
export interface SemanticSearchSubject {
  readonly rootFen: string;
  readonly rulesRef: { readonly id: string; readonly version: number };
  readonly rootSide: "white" | "black";
  readonly rootPacketId: string;
  readonly historyDigest?: string;
}
```

`rootFen` is the canonical full FEN accepted by the candidate packet. `historyDigest` is mandatory
only for propositions involving repetition, fifty-move or other history-dependent terminal facts;
its absence makes those propositions abstain and does not affect position-local tactics. A request
cannot supply child FENs, legal lists, events or readings.

### 3. Hypothesis registry

```ts
export type RootRelation =
  | "root_direct"
  | "root_followup"
  | "opponent_threat"
  | "root_avoidance"
  | "alternative_refutation"
  | "line_observation";

export interface ConsequenceHypothesisDeclaration<Operands, State> {
  readonly id: string;
  readonly version: number;
  readonly inputProjectionIds: readonly string[];
  readonly permittedRelations: readonly RootRelation[];
  readonly permittedAuthorities: readonly SearchAuthorityKind[];
  readonly initialize: (subject: SemanticSearchSubject, operands: Operands) => State;
  readonly advance: (state: State, edge: SearchEdgeEvidence) => State;
  readonly evaluate: (state: State, node: SearchNodeEvidence) => HypothesisEvaluation;
}
```

The production registry is closed and code-derived. A caller supplies a declaration id/version and
typed operands admitted by that declaration; it cannot supply functions, prose, a result, a target
that the operands do not name, or a source projection outside the declaration.

The initial registry must cover the already researched families rather than invent a new chess
ontology:

- direct signed semantic event on the root edge;
- exact reply breadth and first/all refuting replies;
- retained or removed named material target;
- bounded target reintroduction;
- meaningful double attack and one-reply survival;
- discovered-latency execution with retained slider/screen/target identity;
- multi-edge defender duty, removal/relocation, overload response, observed deflection,
  attraction, clearance, interference and checking zwischenzug;
- exact mate and tablebase terminal outcomes through their existing authorities;
- a future-square or piece-route hypothesis that is **research/inspector-only** until its separate
  validation clears the measured knight-route false-positive class.

Adding a hypothesis family requires its own exact positive, hard negative, mirror/orientation,
wrong-perspective, counterfactual and non-vacuity fixtures through the semantic-validation
authority. No generic renderer is created by registration.

### 4. Search authorities

```ts
export type SearchAuthorityKind =
  | "provider_line"
  | "exact_bounded"
  | "policy_coverage";

export type SearchAuthority =
  | {
      readonly kind: "provider_line";
      readonly lineRef: string;
      readonly providerRef: string;
    }
  | {
      readonly kind: "exact_bounded";
      readonly quantifiers: readonly ("exists" | "forall")[];
      readonly horizonPlies: number;
    }
  | {
      readonly kind: "policy_coverage";
      readonly policyRef: string;
      readonly requiredMass: number;
      readonly horizonPlies: number;
    };
```

`provider_line` replays one immutable legal provider line and licenses only observation unless the
hypothesis is satisfied directly on the root edge. It cannot produce an all-defences, likely or
causal result.

`exact_bounded` applies the declared alternating quantifiers. Every `forall` node enumerates the
complete legal population. Every `exists` result retains a canonical witness. A universal node with
zero legal children is terminal and follows the hypothesis's declared terminal semantics; it never
passes merely because its population is empty.

`policy_coverage` expands only candidates present in one admitted distribution. It retains returned
mass, reconstructed mass where licensed by that source, covered mass, residual mass and any
off-window abstention. It may say that a consequence occurs under a named covered policy mass. It
may not say every defence, objectively likely, human-like in general, or forced.

The numerical `requiredMass`, maximum horizon and node/time/memory bounds come from one registered
search profile selected after the pre-acceptance experiment. Callers cannot invent larger bounds.

### 5. Graph construction

```ts
export interface SearchNodeEvidence {
  readonly id: string;
  readonly fen: string;
  readonly ply: number;
  readonly sideToMove: "white" | "black";
  readonly packetId: string;
  readonly incomingEdgeId: string | null;
}

export interface SearchEdgeEvidence {
  readonly id: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly moveUci: string;
  readonly actorSide: "white" | "black";
  readonly eventRefs: readonly string[];
  readonly readingRefs: readonly string[];
}
```

The service derives child positions and evidence through the packet/compiler authorities. Node and
edge ids digest their complete factual identity. Two transposed positions may share a compiled
candidate packet, but path-sensitive hypothesis state, quantifier position and history-dependent
rules remain distinct search states. A transposition cache may reuse factual evidence; it may not
silently merge proof state.

Canonical traversal order is independent of scheduling. Exact existential witnesses and first
refutations use canonical UCI order after any provider work completes, so concurrency and cache
temperature cannot change persisted or rendered evidence.

### 6. Scheduling and pruning

The service may use these values only to order work:

- checks, captures, promotions and exact terminal facts;
- fixed-bound engine rank/value;
- Maia policy mass and Explorer frequency;
- whether a move changes an operand named by the hypothesis;
- transposition and already-evaluated state;
- theory applicability already established by a separate source.

Ordering is not proof. Pruning obeys the authority:

- `provider_line` follows exactly the supplied line;
- an `exists` node may stop after its canonical witnessed result is established, but then makes no
  uniqueness claim;
- a `forall` node may not prune a legal child without an exact declaration-specific irrelevance
  proof;
- `policy_coverage` may stop only when its registered coverage rule is satisfied and must retain the
  unvisited residual mass;
- an engine beam without complete or policy-mass authority may generate research candidates but can
  seal only `line_observation` results.

Forcing extensions and semantic-target-preserving frontiers are search-profile strategies, not new
truth classes. A profile change changes the receipt identity.

### 7. Proof result

```ts
export type ConsequenceProof =
  | { readonly kind: "direct"; readonly rootEdgeId: string; readonly eventRefs: readonly string[] }
  | { readonly kind: "line_observation"; readonly witness: readonly string[]; readonly eventRefs: readonly string[] }
  | { readonly kind: "existential_witness"; readonly witness: readonly string[]; readonly eventRefs: readonly string[] }
  | { readonly kind: "survives_every_defence"; readonly strategy: ProofStrategyTree; readonly eventRefs: readonly string[] }
  | { readonly kind: "policy_coverage"; readonly witnesses: readonly PolicyWitness[]; readonly coveredMass: number; readonly residualMass: number }
  | { readonly kind: "refuted"; readonly firstRefutation: readonly string[]; readonly partialWitness?: readonly string[] }
  | { readonly kind: "abstained"; readonly reason: SearchAbstentionReason };
```

The closed abstention vocabulary includes at least invalid/illegal provider line, source
unavailable, hypothesis unsupported by authority, history required, packet unavailable, budget
exhausted, cancelled, provider mass unreconciled, no eligible event and validation failure. Each arm
retains subject, declaration, profile, source and execution receipt identities outside the union.

`line_observation` wording is permanently limited to “in this searched line.”
`existential_witness` may say “can lead to” and never “forces.” `survives_every_defence` may use the
declared bounded-survival language and always states its horizon. `policy_coverage` names its policy
and coverage; it never silently becomes exact.

### 8. Contrastive move reason

```ts
export interface MoveReasonEvidence {
  readonly root: SemanticSearchSubject;
  readonly selectedMove: CandidateAuthorityRef;
  readonly alternatives: readonly CandidateAuthorityRef[];
  readonly valueComparison: ValueComparisonRef | null;
  readonly clauses: readonly [MoveReasonClause, ...MoveReasonClause[]];
  readonly context: readonly ContextEvidenceRef[];
  readonly disposition: "single_dominant" | "multi_factor" | "engine_preference_only";
}

export interface MoveReasonClause {
  readonly relation:
    | "changes_directly"
    | "enables_witness"
    | "preserves_through_defence"
    | "answers_opponent_threat"
    | "avoids_alternative_consequence"
    | "refutes_alternative";
  readonly selectedMoveUci: string;
  readonly alternativeMoveUci: string | null;
  readonly proofRef: string;
  readonly subjectRefs: readonly string[];
}
```

`selectedMove` is selected by an upstream engine, tablebase, authored or bot-policy authority; this
compiler does not choose it. Every alternative shares the same root and compatible source/value
frame. `valueComparison` is required for “better,” “best,” score, WDL or move-grade language. A
semantic clause without that authority can explain a consequence but not objective preference.

The compiler admits at most three non-subsumed clauses. It prefers, in order: a direct decisive
relation; a selected-versus-natural-alternative refutation; a bounded survival result; then
independent theory or human context. This is a representation budget, not a global chess-importance
ranking. Consumer-specific usefulness and moment selection remain downstream.

If no clause clears, `engine_preference_only` retains the value authority and the typed reason that
semantic explanation abstained. It renders deterministically as an honest limitation rather than
passing the position to an LLM.

### 9. Source separation

The output may carry these independent context refs:

- Stockfish score/WDL/PV and search stability;
- Syzygy result/category/distance;
- Maia policy/candidate outcomes;
- Explorer population and outcome counts;
- cited theory/shape applicability;
- authored claim and objective evidence.

No arithmetic combines incompatible CP, mate, WDL, DTZ or policy-mass domains. No context source
becomes a reason clause unless a registered adapter establishes the exact relation it claims. In
particular:

- human frequency means common under the named population, not good;
- engine preference means value under the named search, not humanly natural;
- theory applicability means the cited pattern applies, not that it caused the engine score;
- semantic co-occurrence means a fact changed, not that it explains the entire evaluation.

### 10. Service boundary

```ts
export interface SemanticConsequenceSearchService {
  search(
    request: SemanticConsequenceSearchRequest,
    signal: AbortSignal,
  ): Promise<SemanticConsequenceSearchResult>;
}
```

The service is constructed once at the application composition root and receives candidate packet,
collector registry and provider-execution dependencies explicitly. It exposes no route of its own.
Guided Hint, Review, bot decision and authoring routes call it through their existing operation and
authorization boundaries.

Requests are immutable, subject-bound and idempotent. Duplicate work is single-flight on subject,
hypothesis operands, authority, profile and source receipt identities. Cancellation is cooperative;
the last waiter may cancel computation, while cancellation of one waiter cannot cancel work still
owned by another. Queue overload, deadline and memory refusal are typed abstentions, not thrown
provider diagnostics.

The complete graph and full legal populations remain server/operator data. Consumers receive only
the sealed proof or move-reason item they declared. The advanced inspector may expose source and
proof metadata under its assistance ceiling; no normal surface receives the graph.

### 11. Product consumer contract

| consumer | receives | may decide | may not decide |
|---|---|---|---|
| Guided Hint | one admitted proof + disclosure compiler | requested rung and deterministic phrasing | hypothesis, chess value, hidden move at a lower rung |
| Post-commit nudge | direct/avoidance clause for the played edge | one useful signed card under its budget | better move without value authority |
| Compare Coach | clauses over two committed branches | which exact divergence to enter | causal relation from adjacent score/fact cards |
| Review Map | proof-backed reason candidates at selected moments | moment/card budget and re-entry action | recompute or widen proof |
| Bot policy | candidate proofs/features plus human/engine sources | profile weights and final distribution | publish policy weight as chess truth |
| Bot explanation | persisted chosen-policy record + proof refs | explain the actual selected move | retrofit a reason the policy did not use |
| Pack validation | authored proposition + proof/refutation | warn/refuse according to authoring contract | silently rewrite authored chess prose |

Every binding appears in the compiled producer→projection→consumer manifest. A registered search
operation with zero product callers is a foundation checkpoint, not 1.0 completion.

### 12. Disclosure and LLM boundary

The reason compiler emits structured clauses and one registered deterministic sentence per clause
and proof class. Hint-distance redaction derives separately sealed packets containing only fields
licensed at that rung. A lower-rung packet cannot contain the selected move, PV or hidden target and
rely on CSS or prompt instructions to conceal them.

An external voice provider may receive only the registered rendered items admitted to the current
module and rung. It does not receive the root FEN, search graph, legal population, rejected
hypotheses or hidden stages. Output checking enforces exact moves, subjects, strength language and
source labels. Provider failure uses deterministic rendering of the same sealed item.

### 13. Rated and fair-play boundary

Search capability is assistance. Rated/native competitive contexts apply their ceiling at the
common search admission and disclosure boundaries, not merely at one route. Background Review may
run only after the game is sealed. A direct service call, future route or accessibility projection
cannot bypass the same refusal.

### 14. Search-profile research receipt

Before acceptance, [[D3262]] requires `planning/semantic-consequence-search/` to contain an immutable preregistration,
input digest and result artifact comparing:

1. provider line only;
2. exact one-reply with forcing extension;
3. engine-ordered bounded beam;
4. Maia-mass bounded frontier;
5. semantic-target-preserving frontier.

The root-source receipt found [[D3276]]: pinned Maia emits raw legal-logit softmax masses
for at most 20 moves, while the configured bot samples after temperature/top-p. The experiment
must name which distribution its mass arm measures, retain the unreturned legal moves as a
residual population, and abstain from any claim about the configured bot's reply probability
unless that transformation is separately validated. It must also normalize Maia's king-to-rook
castling encoding only at the legal-identity join, retaining raw source bytes. The root capture
does not satisfy the child-node traversal or profile decision.

The named destination-arrival → declared-pawn-capture witness is a useful bounded diagnostic,
but [[D3279]] keeps it outside arm 2: the frozen forcing-extension triggers do not include
destination occupancy. If that trigger is wanted in a search profile, preregister a separate
comparison before measuring its reach or cost; do not add these observed plies to the current
five-arm result after the fact.

[[D3280]] keeps a second interpretation open: a reply newly controlling a registered future
destination square is not necessarily an attack on an enemy piece. The exact-arm experiment
must retain both trigger readings and their distinct cost/reach, then settle which reading
the production profile means before this RFC can claim a calibrated exact arm.

[[D3281]] records a failed first-child semantic-selection baseline: every independently
named positive reply touches a declared operand, yet reserving only the highest engine-ranked
touch finds at most one of 32 pawn-denial controls across the tested budgets. Arm 5 still
needs a source-blind, typed relation-change selector and hard negatives; broad operand
contact is not sufficient target preservation. This receipt does not amend the frozen
five-arm population or authorize a production profile.

The subsequent exact-event receipt recovers all 32 named pawn-denial arrivals at the first
reply by reserving the registered minor's arrival, while also reserving 14 material captures
whose exchange is not positive. It is a valid branch-scheduling primitive, not a proof or
an answer to why the root candidate is better than its alternative. Arm 5 must test the
continuation and contrast after selection; the 139/139 named-event reach is not its verdict.

The population covers opening, middlegame, endgame, tactical and quiet-plan positions and includes
the knight-route false-positive and retained bishop-pressure cases. The report includes reach,
family/proof mix, visited nodes, transposition reuse, perspective/polarity failures, witnesses,
refutations, abstentions, engine-budget agreement, covered/residual policy mass, cold/warm/offline
latency and retained memory.

The result fixes the production profile catalogue and its numerical budgets. If no interactive arm
meets the product budget without weakening proof, live hints use cached/direct results and honest
empty while deeper Review/authoring profiles remain background. The criterion does not authorize
calling a partial beam exact.

## Implementation order

1. Accept and implement the complete shared candidate packet plus its value authority.
2. Specify and implement the collector registry and candidate population service for this named
   consumer, retaining their bounded scope.
3. Run §14's preregistered experiment and amend only the profile catalogue/budgets it decides.
4. Implement hypothesis declarations, graph traversal and proof receipts with exact/local fixtures.
5. Implement provider/policy joins and the contrastive compiler.
6. Bind Guided Hint and Review first, proving one interactive and one background journey.
7. Bind bot policy/explanation and pack-validation counterexample search.
8. Add remaining eligible hypothesis families only through semantic validation; do not widen the
   initial implementation while its consumer journeys are incomplete.

## Deviations from design

None. This RFC supplies the missing proof join required by the existing rule that evidence may power
many modules while selection, disclosure and product voice remain separate.

## Acceptance criteria

1. **Registry closure.** An unknown declaration/version, undeclared source, operand shape or
   relation fails before traversal. The production registry and manifest declaration list are
   set-equal.
2. **Exact root authority.** Wrong root packet, omitted/extra legal candidate, wrong child FEN and
   crossed rules convention fail.
3. **Occurrence identity.** Swapping two same-family events on different edges or two provider lines
   with the same projection id fails.
4. **Perspective.** Opponent events cannot satisfy a root-benefit relation; dedicated fork, mate,
   promotion and loose-piece negatives cross every relation arm.
5. **Temporal non-causality.** An event that appears later in a legal PV seals only
   `line_observation` unless its declaration proves another relation.
6. **Existential witness.** Every positive existential retains and replays one canonical legal path;
   removing any edge invalidates the proof.
7. **Universal completeness.** An omitted legal defence, early budget exit or zero-child vacuity
   cannot seal `survives_every_defence`; a retained refuting reply produces `refuted`.
8. **Policy arithmetic.** Candidate identity/order, mass, covered mass and residual mass reconcile
   under the source's exact numeric convention. Crossed Maia bands or Explorer populations fail.
9. **Pruning honesty.** The same hypothesis run under a partial engine beam cannot acquire exact or
   policy-coverage strength. An exact irrelevance prune requires its registered receipt.
10. **History dependence.** Repetition/draw propositions without a history digest abstain; local
    tactical propositions remain available.
11. **Transposition safety.** Factual packet reuse is demonstrated while incompatible path state,
    quantifier position and history cannot merge.
12. **Determinism.** Parallel scheduling, cache warmth and insertion order produce byte-equal
    canonical witnesses/refutations and reason clauses.
13. **Budget failure.** Time, node, memory, queue, cancellation and provider-off exits are distinct
    typed results; no partial graph is published as false or universal.
14. **Value separation.** Semantic evidence alone cannot render “better,” “best,” a score, WDL,
    grade or forced outcome. Cross-domain CP/mate/WDL/DTZ arithmetic fails.
15. **Contrast root.** Selected and alternative moves must share root, rules and compatible value
    authority. A crossed-root alternative fails.
16. **Minimal reason.** Subsumed duplicate clauses are removed; at most three remain; a multi-factor
    fixture retains two independent reasons rather than inventing one dominant cause.
17. **Honest empty.** A stable engine preference with no admitted semantic clause returns
    `engine_preference_only` with deterministic limitation copy.
18. **LLM containment.** Provider sentinels prove the model never receives the graph, legal
    population, hidden move/PV, rejected hypotheses or a higher proof strength; invented causal or
    value language fails output checking.
19. **Fair-play choke point.** Rated live search is refused through the direct service, every current
    route and a future-caller fixture; sealed post-game Review remains reachable.
20. **Consumer closure.** One Guided Hint journey and one Review→re-entry journey call the shared
    service and render a proof-backed result plus provider-off/honest-empty states. Manifest checks
    fail if either binding is replaced by direct collector or provider access.
21. **Bot reuse.** One bot-policy fixture consumes the same proof identity used by Review while
    retaining a separate weighting decision; changing bot weights cannot change the proof bytes.
22. **Authoring reuse.** One pack claim receives a valid witness and one receives a refutation; the
    validator reports both without rewriting prose or graduating content.
23. **Search-profile gate.** §14's preregistered population, inputs, output schema and thresholds are
    present and reproducible; acceptance fails if the production profile is absent from the result
    or if a failed latency/perspective arm is declared default.
24. **Required gates.** Focused tests, strict types, evidence-manifest/semantic checks,
    `make verify-software`, `make verify-governance` and the named browser journeys pass on the same
    committed bytes.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Complete §14's preregistered search-profile experiment and freeze the production profile catalogue | codex | `planning/semantic-consequence-search/` result receipt | |
| D2 | Accept and implement `shared-candidate-evidence-packet.md` and its value-authority dependency | `shared-candidate-evidence-packet` | implementation SHA and canonical docs | |
| D3 | Specify, accept and implement the collector topology required by this real consumer | `candidate-collector-registry` | implementation SHA and canonical docs | |
| D4 | Specify, accept and implement the bounded population service required by this real consumer | `candidate-population-service` | implementation SHA and canonical docs | |
| D5 | Compile the engine-semantic proof into Guided Hint without changing theory-only availability | `hint-distance` | module binding and browser journey SHA | |
| D6 | Compile proof-backed contrast into Review and prove Review→re-entry | `review-evidence-compiler` | module binding and browser journey SHA | |
| D7 | Join the same proofs to the bot's persisted decision without conflating explanation with weighting | `bot-policy` | policy binding and replay SHA | |
| D8 | Add the authoring counterexample consumer without treating machine evidence as authored judgement | `claim-semantic-anchors` | validator binding and hard-negative SHA | |

## Ledger rows

- [[D3262]] is the preregistered search-profile experiment owned by §14 and Discharge D1.
- [[D3263]] is the full semantic consequence-search contract owned by this RFC.

## Open questions

None at owner-intent level. Search-profile numbers and family admission are empirical questions owned
by §14 and semantic validation. Product-specific card priority, hint ceiling, Review moment selection,
bot personality and authored-content policy remain with their named RFCs.

## Changelog

- 2026-09-14: initial draft from the owner-opened full semantic consequence-search upgrade and the
  existing candidate, horizon, reply and bounded-target research.
