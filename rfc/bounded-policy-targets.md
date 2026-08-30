# RFC: Convention-grounded bounded material targets

- **Status:** **draft — RETURNED by second fresh independent review 2026-08-30 on
  [[D2202]]–[[D2205]].** The source anchor, concrete service, whole-job bound and total quantifiers
  survive, but manifest authority is unused, `ThreatPassAnchor` is undefined, the three derived
  projections have no exact value-authority constructors, and the public operation uses private
  request/result types. `make bounded-target-second-fresh-review` passes 4/4. Implementation
  remains unauthorised.
- **Author:** codex, preserving the D1023 research contract and applying `planning/bounded-policy-targets/author-repair-2026-08-26.md`
- **Created:** 2026-08-23; narrowed 2026-08-27
- **Exploration gate:** [[D1023]] ✅; executable contract closure in `design/research/bounded-policy-target-contract-closure.md`
- **Depends on:** implemented F1; accepted/implemented `rfc/exact-legal-mobility.md`; accepted and implemented `rfc/tactical-collectors.md`
- **Followed by:** `rfc/provider-exchange-and-execution.md`, then `rfc/bounded-target-policy-composition.md`
- **Planning:** `planning/bounded-policy-targets/`

```tabiya-claims
none
```

## Summary

This RFC lands the local, bounded-background layer of the bounded-target foundation. It answers three
questions about one already-declared positive material capture:

1. what exact attacker, victim and capture constitute the target;
2. whether a legal candidate immediately removes it and why; and
3. whether the same target can return within the declared three-ply horizon, under separate
   existential and all-defences quantifiers.

It deliberately does not call any provider, infer intent, grade a move or choose a learner-facing
moment. The reusable Stockfish/Maia source receipts and scheduler belong to
`provider-exchange-and-execution`; the two reported policy joins belong to
`bounded-target-policy-composition`. Splitting the landing does not split the 1.0 requirement:
all three layers remain required before complete Support, Review and evidence-aware bot consumers
may claim target-policy coverage ([[D1861]]).

The research result survives unchanged. Exact immediate removal discriminates at **4.10×** in the
authored population and **2.85×** in the imported population. Most played removals return inside
the horizon (69/120 and 130/188), while the all-defences form is rare (2/120 and 0/188) and reverses
direction in one population. `[V]` (`design/research/bounded-policy-targets.md`; committed D1023
census). Therefore each fact is useful as an operand, but none is automatically a significance or
quality verdict.

## 1. Scope and authority

### 1.1 The three-layer boundary

```text
threat@1 + legal_exchange@1 + legal_moves@1(source)
  -> named_material_target@1
       -> immediate@1
       -> bounded_return@1

provider receipts + the three local facts
  -> target-policy composition (different RFC)
```

The local adapter consumes sealed evidence items. It must not call `threats()` or recreate the
**source-position** `legal_exchange@1` item. It may apply the separately versioned
`legal-exchange-for-move@1` deterministic convention to the derived post-candidate position, as
specified in §2.2, because the changed board cannot be classified from the retained source exchange.
That check is an internal semantic dependency and does not mint a second source evidence item. This
preserves the D1657 correction: one source projection identity has one authority, and a derived item
retains the exact source items from which it was computed.

`declareThreatEvidence(sourceFen)` is the sole threat constructor. It canonicalizes the FEN, calls
`threats(sourceFen)` itself, declares the unchanged `threat@1` payload, and records the exact
`ThreatPassAnchor` in a module-private `WeakMap<DeclaredEvidence<ThreatResult>, ThreatPassAnchor>`.
It accepts no caller payload. `threatEvidencePassAnchor(item)` succeeds only for the exact object
minted by that constructor; spread, JSON, cast and a separately sealed equal payload fail. This is
source authority attached to the existing process-local evidence seal, not a new projection or a
payload-version change. All current constructor call sites migrate from
`declareThreatEvidence(threats(fen))` to `declareThreatEvidence(fen)` in the same implementation
commit. The named-target constructor requires its source-position FEN to equal the retained private
anchor before inspecting any threat row. A foreign source with byte-identical threats therefore
still refuses ([[D2105]]).

### 1.2 What a named target means

A named material target is one positive legal capture available to the opponent after the pass
convention already declared by `rules.tactic.consequence.threat@1`. It is identified by:

- canonical six-field original source FEN and its exact sealed `legal_moves@1` item;
- the exact `ThreatPassAnchor` returned by `threatPassAnchor(sourceFen)`, containing the convention
  id plus canonical source and passed FENs;
- attacker colour, role and square;
- victim colour, role and square;
- canonical capture UCI under `chessops-king-takes-rook@1`;
- the retained threat and legal-exchange evidence items.

The join requires literal equality of attacker, victim, capture identity and embedded exchange
payload. `packages/runtime/src/tactics.ts` exports `threatPassAnchor()` and `threats()` consumes that
same function; no other implementation may reproduce the flip-side/clear-en-passant mutation.
Target admission obtains the anchor from `threatEvidencePassAnchor(threat)`, requires its canonical
source FEN to equal `sourcePosition.payload.fen`, and requires its passed FEN to equal the exchange's
passed-position FEN. A cross-position, cross-target, copied payload-shaped substitute or ordinary
`declareEvidence(...)` threat refuses. The source FEN is never reconstructed from the passed FEN
and cannot be supplied as an unsealed scalar.

Standard FEN, threat evidence and legal-exchange evidence carry no trustworthy pre-position
promotion history. `TrackedPieceIdentity` therefore has no initial `promoted` field. When a tracked
pawn promotes inside the enumerated line, the exact legal move records the new role and the tracker
retains that observed edge. The collector never guesses whether a queen, rook, bishop or knight
already present at the source arose from promotion.

### 1.3 Candidate authority

`immediate@1` and `bounded_return@1` consume the same exact source-position authority retained by
the named target. Candidate UCI is derived from the complete legal-move item, not supplied as a
free request scalar. The adapter computes the child FEN once by playing that canonical identity;
callers may not supply an after-FEN alongside the move.

This makes a counterfactual legal move truthful without inventing `run.record.move` or another run
node. A wrong-FEN legal map, incomplete exchange set, duplicate candidate or caller-supplied child
board refuses before any bounded enumeration begins.

## 2. Closed local payloads

### 2.1 `NamedMaterialTarget`

```ts
type ProjectionEvidence<Id extends string, Payload> =
  DeclaredEvidence<Payload> & {
    readonly projection: { readonly id: Id; readonly version: 1 };
  };

declare const THREAT_SOURCE_BOUND: unique symbol; // module-private
export type SourceBoundThreatEvidence = ProjectionEvidence<
  "rules.tactic.consequence.threat",
  ThreatResult
> & {
  readonly [THREAT_SOURCE_BOUND]: true;
};
export function declareThreatEvidence(sourceFen: string): SourceBoundThreatEvidence;
export function threatEvidencePassAnchor(
  evidence: SourceBoundThreatEvidence,
): ThreatPassAnchor;

type ThreatEvidence = SourceBoundThreatEvidence;
type LegalExchangeEvidence = ProjectionEvidence<
  "rules.exchange.predicate.legal_exchange",
  LegalExchangeResult
>;
type SourceLegalMovesEvidence = ProjectionEvidence<
  "rules.mobility.reading.legal_moves",
  ExactLegalMoveMap
>;

export interface TrackedPieceIdentity {
  readonly color: Color;
  readonly role: Role;
  readonly square: SquareName;
}

export interface ObservedPromotionEdge {
  readonly ply: 1 | 2 | 3;
  readonly moveUci: string;
  readonly from: SquareName;
  readonly to: SquareName;
  readonly fromRole: "pawn";
  readonly toRole: "queen" | "rook" | "bishop" | "knight";
}

interface TrackedPieceState {
  readonly source: TrackedPieceIdentity;
  readonly current: TrackedPieceIdentity | null;
  readonly observedPromotions: readonly ObservedPromotionEdge[];
}

export interface NamedMaterialTarget {
  readonly convention: "bounded-target@1";
  readonly passAnchor: ThreatPassAnchor;
  readonly attacker: TrackedPieceIdentity;
  readonly victim: TrackedPieceIdentity;
  readonly captureUci: string;
  readonly threat: ThreatEvidence;
  readonly exchange: LegalExchangeEvidence;
  readonly sourcePosition: SourceLegalMovesEvidence;
}
```

`ThreatPassAnchor` is the frozen `{ conventionId: "threat@1", sourceFen, passedFen }` returned by
the one exported transform and recovered only from the threat evidence's private source authority.
`TrackedPieceIdentity` contains exactly colour, current role and square; excess `promoted`, source
history or arbitrary labels refuse. `TrackedPieceState` is traversal-only and never enters a
projection payload: it retains the immutable source identity, nullable current identity and every
promotion observed on plies 1–3. It advances through normal moves and both chessops rook-square
castling forms. A legal promotion appends exactly one `ObservedPromotionEdge` and changes the
current role; an edge from a non-pawn, to pawn/king, at a non-promotion destination, with the wrong
UCI or outside plies 1–3 refuses. No initial promotion provenance is present or inferred. A known
legal capture of the attacker sets `current: null` and is a removal cause. Any other failed exact
update is an `identity_lost` abstention, not a chess-state result ([[D2107]]).

### 2.2 `BoundedTargetImmediate`

```ts
interface PostCandidateExchangeEvaluation {
  readonly convention: "legal-exchange-for-move@1";
  readonly captureUci: string;
  readonly resultUnits: number;
  readonly result: "positive" | "non_positive";
}

type ImmediateTargetOutcome =
  | {
      readonly result: "preserved";
      readonly cause: "preserved";
      readonly postCandidateExchange: PostCandidateExchangeEvaluation & {
        readonly result: "positive";
      };
    }
  | {
      readonly result: "removed";
      readonly cause:
        | "attacker_captured"
        | "target_moved"
        | "capture_illegal";
      readonly postCandidateExchange: null;
    }
  | {
      readonly result: "removed";
      readonly cause: "exchange_neutralized";
      readonly postCandidateExchange: PostCandidateExchangeEvaluation & {
        readonly result: "non_positive";
      };
    };

interface BoundedTargetImmediate {
  readonly target: NamedMaterialTarget;
  readonly candidateUci: string;
  readonly afterFen: string;
  readonly outcome: ImmediateTargetOutcome;
}
```

The discriminated union makes result, cause and post-candidate exchange evidence correlate. Known legal captures are resolved
before identity comparison: a candidate that captures the tracked attacker is
`removed/attacker_captured`. The candidate and victim have the same colour, so `target_captured`
is deliberately absent as unreachable. An unexplained replacement or failed identity update
returns the typed `identity_lost` abstention and cannot seal an immediate payload.

After the candidate is played and both identities still exist, the adapter constructs the tracked
capture on that changed board. If it is illegal, the cause is `capture_illegal` and the evaluation
operand is `null`. If it is legal, `legalExchangeForMove(afterPosition, capture)` runs under the
literal internal convention `legal-exchange-for-move@1`; its exact `resultUnits` and canonical UCI
are retained in `postCandidateExchange`. Positive units correlate only with `preserved`; zero or
negative units correlate only with `exchange_neutralized`. The adapter checks that relation before
sealing. This deterministic rules dependency is not a new F1 source item and cannot replace or
mutate the retained source `LegalExchangeEvidence`.

The adapter retains the named target, which itself retains the exact legal-move authority. A
sentence or overlay can therefore point back to every source authority without accepting a second
legal map. It does not say the candidate was good, best, intentional or prophylactic.

### 2.3 `BoundedTargetReturn`

```ts
type CandidateLine = readonly [candidateUci: string];
type RefutationLine = readonly [
  candidateUci: string,
  preparationUci: string,
  replyUci: string,
];
type ReintroductionLine = readonly [
  candidateUci: string,
  preparationUci: string,
  replyUci: string,
  captureUci: string,
];

type BoundedReturnOutcome =
  | {
      readonly kind: "not_reintroduced";
      readonly firstRefutation: RefutationLine | null;
    }
  | {
      readonly kind: "reintroduced";
      readonly witness: ReintroductionLine;
      readonly firstRefutation: RefutationLine;
    }
  | {
      readonly kind: "survives_every_defence";
      readonly witness: ReintroductionLine;
    };

interface BoundedTargetReturn {
  readonly immediate: BoundedTargetImmediate & {
    readonly outcome: Extract<ImmediateTargetOutcome, { readonly result: "removed" }>;
  };
  readonly horizonPlies: 3;
  readonly visitedPositions: number;
  readonly outcome: BoundedReturnOutcome;
}
```

The discriminant is the truth. Compatibility booleans, if a later consumer needs them, are derived:
`reintroducedWithin3Ply` is true for `reintroduced` and `survives_every_defence`, while
`preparationSurvivesEveryDefence` is true only for `survives_every_defence`. A universal result
therefore cannot exist without its existential witness, and a negative result cannot carry one.
The adapter constructs each fixed-length tuple internally while replaying exact legal moves under
`chessops-king-takes-rook@1`; no caller supplies a `string[]` witness or refutation.

A preserved immediate target needs no “return” claim and produces no bounded-return item. A removed
target may be not reintroduced, reintroduced on at least one preparation/reply branch, or survive
every legal defence after one preparation. Canonical ordering is preparation UCI then reply UCI.
`reintroduced` means its canonical witness preparation has at least one permitting reply and at
least one refuting reply, so `firstRefutation` is required and shares the witness's candidate and
preparation. `survives_every_defence` means the witness preparation has at least one legal reply and
all legal replies permit reintroduction; a terminal/zero-reply preparation is not a vacuous
universal. Only `not_reintroduced.firstRefutation` is nullable, when no legal preparation/reply line
exists. The terminal, witness-only, mixed-reply and universal fixtures make all four boundaries
able to fail ([[D2109]]).

The horizon is exactly three plies after the candidate. Enumeration stops before exceeding
**25,000 visited positions** under the exact §4.3 convention. At the cap the candidate entry returns the typed `budget_exhausted`
abstention in §4; it cannot construct or seal this payload, so a partial traversal never becomes a
false negative. Terminal positions have zero continuations without inventing a reply. A fourth ply
is a different search and remains outside v1 under [[D1025]].

### 2.4 Direction and significance

The projections describe state changes with signs `preserved` and `removed`. The
`survives_every_defence` outcome may be rendered when a caller has already selected this exact target. It may not select a
moment: its observed direction reverses between the authored and imported populations. Review
selection, module admission and bot weighting require a separate declared consumer policy.

## 3. Literal F1 declaration image

One producer and three projections are added. This table is normative; implementation must compile
the same fields, not a reduced summary.

### 3.1 Producer

| field | value |
|---|---|
| id/version | `derived.bounded_target@1` |
| plane | `derived` |
| implementation | `packages/runtime/src/bounded-target.ts` |
| own availability/latency | `local` / `background` |
| operation symbol | `BoundedTargetBackgroundService.submit` |

`producer()` changes from an availability-derived latency helper to an explicit checked
`producer(id, plane, implementation, availability, latency, outputs)` constructor. The complete
legal matrix is `local → sync | background`, `recorded → sync`, `provider → interactive`, and
`build_time → offline`; every other pair throws during catalogue construction. The implementation
mechanically supplies today's derived latency to every existing declaration and proves their
compiled bytes and manifest digest do not change. The only producer delta is the exact
`derived.bounded_target@1` row above; an implicit local→sync fallback is forbidden.

### 3.2 `derived.bounded_target.named_material_target@1`

| field | value |
|---|---|
| role / plane | `reading` / `derived` |
| payloadType | `NamedMaterialTarget` |
| semantics | convention-grounded positive material-capture identity retained from threat, exchange and the exact source-position authority |
| operands | `convention`, `passAnchor`, `attacker`, `victim`, `captureUci`, `threat`, `exchange`, `sourcePosition` |
| signs | `state`, `threatened` |
| grounding / exactness / confidence | `declared_convention` / `convention` / `exact` |
| answerContent | `fact`, `threat` |
| forms | `sentence`, `list`, `lit_squares`, `arrows`, `piece_halo`, `machine_condition` |
| abstention | possible: `input_abstained`, `position_mismatch`, `target_mismatch`, `exchange_set_mismatch`, `multiplication_limit`, `batch_budget_exhausted`, `queue_full`, `cancelled`, `service_closed` |
| derivation inputs | `rules.tactic.consequence.threat@1`, `rules.exchange.predicate.legal_exchange@1`, `rules.mobility.reading.legal_moves@1` |
| limitations | one exact material capture; no intent, quality, plan, force or significance |
| disposition | `inspector_only` until a named module/Review/bot RFC binds it |

### 3.3 `derived.bounded_target.immediate@1`

| field | value |
|---|---|
| role / plane | `event` / `derived` |
| payloadType | `BoundedTargetImmediate` |
| semantics | convention-grounded immediate preservation/removal of one named material target after one legal candidate |
| operands | `target`, `candidateUci`, `afterFen`, `outcome`, `outcome.postCandidateExchange` |
| signs | `preserved`, `removed` |
| grounding / exactness / confidence | `declared_convention` / `convention` / `exact` |
| answerContent | `fact`, `threat` |
| forms | `sentence`, `timeline_marker`, `lit_squares`, `arrows`, `piece_halo`, `machine_condition` |
| abstention | possible: `input_abstained`, `position_mismatch`, `target_mismatch`, `identity_lost`, `multiplication_limit`, `batch_budget_exhausted`, `queue_full`, `cancelled`, `service_closed` |
| derivation inputs | `derived.bounded_target.named_material_target@1` |
| limitations | one candidate and target; `legal-exchange-for-move@1` is a deterministic post-candidate rule check, not an engine evaluation, ranking, recommendation, intent or significance |
| disposition | `inspector_only` until a named consumer binds it |

### 3.4 `derived.bounded_target.bounded_return@1`

| field | value |
|---|---|
| role / plane | `reading` / `derived` |
| payloadType | `BoundedTargetReturn` |
| semantics | separate exists-exists return and exists-for-all-defences survival within the declared three-ply horizon |
| operands | `immediate`, `horizonPlies`, `visitedPositions`, `outcome` |
| signs | `preserved`, `removed`, `enabled` |
| grounding / exactness / confidence | `declared_convention` / `convention` / `exact` |
| answerContent | `fact`, `threat` |
| forms | `sentence`, `list`, `timeline_marker`, `lit_squares`, `arrows`, `machine_condition` |
| abstention | possible: `input_abstained`, `position_mismatch`, `target_mismatch`, `identity_lost`, `multiplication_limit`, `queue_full`, `budget_exhausted`, `batch_budget_exhausted`, `cancelled`, `service_closed` |
| derivation inputs | `derived.bounded_target.immediate@1` |
| limitations | horizon is three plies; the all-defences fact cannot select a moment; no strategy or inevitability beyond the enumerated horizon |
| disposition | `inspector_only` until a named consumer binds it |

No declaration has a provider dependency. `local` says where the calculation executes; it does not
mean cheap. The measured tails in §4.1 require `background` for all three projections. The
policy-composition RFC will declare separate provider-bearing paths rather than making this
producer lie about its local facts.

## 4. Operation and sealing boundary

The public boundary has one set-owning request and a result whose discriminants correlate every
success and abstention. There is no generic request union beside a generic result union.

```ts
type NamedMaterialTargetEvidence = ProjectionEvidence<
  "derived.bounded_target.named_material_target",
  NamedMaterialTarget
>;
type BoundedTargetImmediateEvidence<
  Outcome extends ImmediateTargetOutcome = ImmediateTargetOutcome,
> = ProjectionEvidence<
  "derived.bounded_target.immediate",
  BoundedTargetImmediate & { readonly outcome: Outcome }
>;
type BoundedTargetReturnEvidence = ProjectionEvidence<
  "derived.bounded_target.bounded_return",
  BoundedTargetReturn
>;

interface BoundedTargetBatchRequest {
  readonly kind: "source_position_batch";
  readonly threat: ThreatEvidence;
  readonly exchanges: readonly LegalExchangeEvidence[];
  readonly sourcePosition: SourceLegalMovesEvidence;
}

type ReturnDerivation =
  | { readonly kind: "evidence"; readonly item: BoundedTargetReturnEvidence }
  | {
      readonly kind: "abstained";
      readonly projection: {
        readonly id: "derived.bounded_target.bounded_return";
        readonly version: 1;
      };
      readonly reason: "budget_exhausted";
      readonly candidateUci: string;
      readonly visitedPositions: number;
    };

type CandidateDerivation =
  | {
      readonly kind: "preserved";
      readonly immediate: BoundedTargetImmediateEvidence<
        Extract<ImmediateTargetOutcome, { readonly result: "preserved" }>
      >;
    }
  | {
      readonly kind: "removed";
      readonly immediate: BoundedTargetImmediateEvidence<
        Extract<ImmediateTargetOutcome, { readonly result: "removed" }>
      >;
      readonly boundedReturn: ReturnDerivation;
    }
  | {
      readonly kind: "abstained";
      readonly projection: {
        readonly id: "derived.bounded_target.immediate";
        readonly version: 1;
      };
      readonly reason: "identity_lost";
      readonly candidateUci: string;
    };

interface TargetDerivation {
  readonly target: NamedMaterialTargetEvidence;
  readonly candidates: readonly CandidateDerivation[];
}

interface BoundedTargetInputDigests {
  readonly threat: string;
  readonly exchanges: readonly string[];
  readonly sourcePosition: string;
}

interface BoundedTargetRequestIdentity {
  readonly domain: "tabiya:bounded-target-request@1";
  readonly requestDigest: string;
  readonly inputs: BoundedTargetInputDigests;
}

interface BoundedTargetResultIdentity extends BoundedTargetRequestIdentity {
  readonly resultDomain: "tabiya:bounded-target-result@1";
  readonly resultDigest: string;
}

type BoundedTargetBatchResult =
  | {
      readonly kind: "completed";
      readonly identity: BoundedTargetResultIdentity;
      readonly targets: readonly TargetDerivation[];
      readonly visitedPositions: number;
    }
  | {
      readonly kind: "abstained";
      readonly identity: BoundedTargetResultIdentity;
      readonly reason:
        | "input_abstained"
        | "position_mismatch"
        | "target_mismatch"
        | "exchange_set_mismatch"
        | "multiplication_limit"
        | "batch_budget_exhausted"
        | "queue_full";
      readonly visitedPositions: number;
    }
  | {
      readonly kind: "cancelled";
      readonly identity: BoundedTargetResultIdentity;
      readonly reason: "caller_aborted" | "service_closed";
      readonly visitedPositions: number;
    }
  | {
      readonly kind: "failed";
      readonly identity: BoundedTargetResultIdentity;
      readonly reason:
        | "yield_failed"
        | "traversal_failed"
        | "seal_failed"
        | "invariant_failed";
      readonly visitedPositions: number;
    };

export interface BoundedTargetServiceLimits {
  readonly maxActive: number;                // exactly 1 in v1
  readonly maxQueued: number;                // safe integer 0..8; default 8
  readonly maxPairs: number;                 // safe integer 1..512; default 512
  readonly maxVisitedPositions: number;      // safe integer 1..25_000; default 25_000
  readonly maxBatchVisitedPositions: number; // safe integer 1..100_000; default 100_000
  readonly yieldEveryVisited: number;        // safe integer 1..64; default 64
}

export declare class BoundedTargetBackgroundService {
  private constructor(/* fixed authorities + validated limits */);
  static create(input: {
    readonly manifest: CompiledEvidenceManifest;
    readonly limits?: Partial<BoundedTargetServiceLimits>;
  }): BoundedTargetBackgroundService;
  submit(
    request: BoundedTargetBatchRequest,
    signal: AbortSignal,
  ): Promise<BoundedTargetBatchResult>;
  close(): Promise<void>;
}

export declare function createBoundedTargetBackgroundService(input: {
  readonly manifest: CompiledEvidenceManifest;
  readonly limits?: Partial<BoundedTargetServiceLimits>;
}): BoundedTargetBackgroundService;
```

`boundedTargetInputDigest(item)` calls the shipped browser-safe `evidenceDigest()` over exactly
`{ domain: "tabiya:bounded-target-input@1", producer, projection, payload }`. The non-serializable
process seal is separately verified for admission and is not digest material. `boundedTargetRequestIdentity()` sorts
the exchange item digests lexicographically, retains threat and source-position digests in their
named slots, and hashes exactly `{ domain, kind, threat, exchanges, sourcePosition }` with
`evidenceDigest()`. Therefore exchange-array reordering preserves request identity; changing a
producer, projection or payload byte changes it. The request's public order never controls target
enumeration, which remains canonical by target capture UCI.

Every exit is built by one checked result constructor. It maps each declared evidence item to its
exact `{ producer, projection, payload }` image, retains ordinary closed result fields, excludes
`identity.resultDigest`, and hashes
`{ domain: "tabiya:bounded-target-result@1", requestDigest, result }`. The constructor inserts the
result digest; the public validator removes it and recomputes the same image. An arbitrary digest,
input permutation or result mutation therefore refuses. A failed seal still receives a stable
request identity by hashing the visible triple first, but it never enters deduplication or the job
map and returns `failed/seal_failed`.

The batch validates compiler-admitted seals, requires the supplied exchange set to be set-equal to
all positive material exchanges referenced by the threat reading, and derives the complete
candidate set from `sourcePosition`. It then constructs every target/candidate row internally.
Callers cannot request a single item, supply a candidate subset or pair one request kind with a
different projection result. A preserved immediate arm cannot carry a return; a removed arm must
carry either a bounded-return item or its exact `budget_exhausted` abstention; an identity failure
cannot carry evidence.

Completed evidence is published only when the whole batch finishes. Cancellation, failure or
whole-batch exhaustion discards partial arrays. `budget_exhausted` is candidate-local and retains
only its exact projection, candidate and local visited count; it contains no negative fact, witness
or refutation. `batch_budget_exhausted` is a whole-job abstention at exactly 100,000 aggregate
positions and carries no `targets`. Pure helpers may be exported for tests, but application/server
callers use the service and no second adapter may declare a payload-shaped object later.

The concrete class, fixed product factory and public limit type are exported from
`packages/runtime/src/index.ts`; its implementation, declaration and
only allowed callers are included in the producer-operation census in §4.2. Removing it, adding
a per-item public derivation path, accepting an incomplete set or constructing crossed result arms
fails before any consumer binding exists.

### 4.1 Execution class and multiplication bound

`make bounded-target-census` measures the D1023 algorithm over the fixed authored and imported
populations. The 2026-08-28 author run measured per-target/candidate p95 at 12.40 ms and 10.26 ms,
but one legitimate call reached 753.88 ms. Whole-position p95 was 367.10 ms and 343.68 ms, with
maxima of 1,305.12 ms and 993.43 ms. `[V]`
(`tools/d1023-bounded-policy-harness/exact-census-output.md`;
`design/research/bounded-target-execution-closure.md`). This refuses request-thread `sync` even
though the computation is provider-free.

The production service is therefore background-only. A Support gesture, board hover, move commit
or HTTP request may consume a completed item but may not call the traversal helpers inline. One
service instance admits **one active and eight queued** source-position jobs; the ninth queued job
returns `queue_full`. `BoundedTargetBackgroundService.create()` and the named exported factory
accept only the compiled manifest plus numeric `Partial<BoundedTargetServiceLimits>`. They fix
`messageChannelMacrotaskYield`, the exact legal/tracking functions, adapters, result constructors
and producer registry by import. Deployment limits may narrow but never raise the annotated v1
ceilings; `maxActive` remains exactly one. Non-safe-integer, non-positive or out-of-range values
throw synchronously. A module-private `createBoundedTargetBackgroundServiceForTest()` accepts
sealed yield/traversal/seal fault hooks and is absent from the runtime barrel and production import
graph. Once constructed, `submit()` never throws: chess admission exits are `abstained`, waiter or
service termination is `cancelled`, and adapter/traversal/seal/invariant exits are `failed`. Every
settlement removes its listeners; a terminal job leaves the active/queue/dedup maps in the same
state as if it had never been admitted. No cancelled or failed operation publishes or retains a
partial evidence array ([[D2106]], [[D2110]]).

Identity validation and the 512-pair check precede job admission. Deduplication then occurs **before
queue-capacity admission**. Each exact request digest owns one queued/running job and each `submit`
owns one waiter attached to it. A caller abort settles only that waiter as
`cancelled/caller_aborted`; other waiters continue to share the same job. When the last waiter
aborts, a queued job is removed immediately, while a running job receives its private abort and
stops at the next surrounding signal check/yield. A duplicate may attach to an already-queued job
when eight other unique jobs fill capacity. Attachment is permitted only while the job is queued or
running: settlement atomically removes the job-map entry, so a later identical request starts a new
job rather than receiving an undeclared cache. A race between final settlement and attachment is
serialized by the job state transition; it cannot attach to a settled promise.

Admission owns both complete sets. It derives named targets from the set-equal exchange authorities,
derives candidates from the complete legal-move map, computes `targets.length × candidates.length`,
and returns `multiplication_limit` before queueing or enumeration above **512 pairs**. There is no
public per-item path with which a caller can evade the ceiling. The permanent census records
fixed-population maxima of 111 authored and 333 imported pairs and fails if either exceeds 512.

Every admitted job also owns one monotonically increasing aggregate counter capped at
**100,000 visited positions across the whole batch**. Before materializing any candidate root or
child, the enumerator checks both its candidate-local 25,000 cap and the job cap. Hitting the local
cap produces that candidate's `budget_exhausted` arm and may continue with the next canonical row;
requesting work after the job counter reaches 100,000 stops the entire job as
`abstained/batch_budget_exhausted`, discards every partial target/candidate array and releases the
active slot before the next FIFO job starts. Canonical target-capture UCI then candidate UCI order
makes the exhaustion boundary reproducible. A legal 512-pair control whose individual traversals
all remain below 25,000 but whose sum requests position 100,001 proves the job cannot approach the
former 12.8-million-position envelope ([[D2108]]).

The enumerator receives no scheduler from a product caller. Production uses the shared
`packages/runtime/src/cooperative-yield.ts:messageChannelMacrotaskYield` ([[D2029]]), implemented
with one `MessageChannel` post and closed ports; the traversal calls it after every **64 visited
positions** and after the final
node of each candidate when that candidate visited fewer than 64. It checks `AbortSignal` before
work, immediately before and after each yield, and before publishing. Thus an abort observable by
the event loop stops the operation before node 65 of the next chunk. A rejecting/throwing yield is
`failed/yield_failed`; a traversal exception is `failed/traversal_failed`; a seal assertion is
`failed/seal_failed`; and an impossible closed-state or digest check is
`failed/invariant_failed`. The permanent control schedules `setTimeout(() => abort(), 0)`
independently of the adapter, starts work, requires `cancelled` at exactly 64 visited positions and
proves that no sealed or partial item escaped. A worker is deliberately not used until F1
authorities have a serialize/revalidate/reseal transport contract.

The same census enforces a conservative background envelope: cold position <1,000 ms, per-call p95
<100 ms, whole-position p95 <500 ms, per-call max <2,000 ms and whole-position max <5,000 ms. It
also asserts that the fixed populations do **not** satisfy the predeclared request-thread envelope
(all calls <250 ms and all positions <1,000 ms). If that last assertion changes, the RFC must be
explicitly reclassified; a stale execution label may not survive a performance improvement.

`close()` is idempotent and returns one shared promise. Its first call atomically changes the
service from `open` to `closing`, refuses new submissions as `cancelled/service_closed`, removes
every queued job, settles all queued waiters with count 0, aborts the active job, and settles its
waiters with the aggregate count observed synchronously at close. It then awaits the active
enumerator's exit and listener/job-map cleanup before becoming `closed`. Later `close()` calls
return the same fulfilled promise; later submissions remain typed `service_closed`. No close path
publishes, caches or retains partial evidence, and closing one service cannot affect another
instance. The lifecycle fixture crosses empty, queued, active, shared-waiter and post-close states.

### 4.2 Producer-operation authority

F1 gains the producer analogue of its existing consumer-operation authority:

```ts
interface EvidenceProducerOperation {
  readonly producer: VersionedEvidenceId;
  readonly operationSymbol: string;
  readonly operation: CallableFunction;
}

evidenceProducerOperation(
  "derived.bounded_target",
  "BoundedTargetBackgroundService.submit",
  BoundedTargetBackgroundService.prototype.submit,
);
```

`evidenceProducerOperation()` rejects an empty id/symbol or non-callable operation.
`assertEvidenceProducerOperations(producers, operations)` derives its expected set from **every
manifest producer whose latency is `background`**, requires set equality, version 1, unique ids and
symbols, and exact equality between the registered symbol and the producer-specific mapping. At
this landing the derived expected set and exported frozen
`RUNTIME_EVIDENCE_PRODUCER_OPERATIONS` are both exactly `{derived.bounded_target@1}`. Deleting the
entry, adding a second service, registering `sync` work, or substituting a payload helper fails.

The initial production call-site census is deliberately empty outside
`packages/runtime/src/bounded-target.ts`; test files may invoke the exported service. Because all
three projections land `inspector_only`, no server/web consumer is yet entitled to schedule it.
Each downstream consumer RFC must add its exact operation/caller binding to the census before it
may request computation. The repo-wide AST census follows imports and member calls to the registered
class/method, and fails a direct traversal-helper call, a web/HTTP request-thread call, or an
undeclared caller. This proves actual reach rather than merely proving that a source anchor exists.

### 4.3 Normative visited-position convention

`visitedPositions` uses one convention at two correlated levels. A candidate-local count measures
**materialized and semantically inspected chess positions in that traversal**; the batch count is
the exact sum of every started candidate-local count in canonical target/candidate order. Neither
counts moves, unique FENs, replay validation, admission work or queue time:

1. The legal candidate is applied before bounded-return traversal. Its canonical `afterFen` is the
   traversal root and counts as **1**, including checkmate/stalemate and immediate identity-loss
   cases. The source position does not count.
2. Before following any legal preparation or reply edge, the traversal checks whether the counter
   already equals `maxVisitedPositions`. If so, it returns `budget_exhausted` with the count exactly
   at the cap and does not materialize the child.
3. A legal edge is applied once; after the child position exists, the counter increments once.
   Terminal detection, tracked-identity validation and target evaluation then inspect that child.
   The child still counts if it is terminal or the identity update fails. An illegal/unapplied edge
   never counts.
4. The reintroduction capture is validated on the reply position and retained as the fourth witness
   UCI, but v1 does not play it; therefore it creates no fifth position and no increment.
5. Enumeration has no transposition table. Reaching the same FEN through two legal paths counts two
   traversal occurrences. Canonical witness/refutation replay at the sealing boundary validates the
   result after enumeration and never alters the recorded count.
6. After a counted child is fully inspected, a multiple of `yieldEveryVisited` yields. The initial
   root does not yield merely because it is 1. If a candidate finishes between multiples, the
   service performs one final yield before publishing that candidate. Signal checks surround every
   yield and the final batch publication.
7. The job aggregate increments in the same statement as the candidate-local counter. A candidate
   root is therefore one in both counters; a child is one in both; no second summation pass exists.
   Zero targets, admission refusal, a queued cancellation and post-close submission report 0.
   Multiple completed/local-exhausted traversals report their arithmetic sum. Global exhaustion
   reports exactly `maxBatchVisitedPositions` and never starts position 100,001.
8. A waiter-local abort samples the aggregate counter synchronously in its abort listener and seals
   that count in only that waiter's cancelled result. The shared job may advance for remaining
   waiters. Last-waiter abort and `close()` sample first, then signal the enumerator; their waiter
   results retain the sampled value even if already-materialized work finishes unwinding. A caught
   yield/traversal/seal/invariant failure reports the aggregate at the catch boundary. Only a
   completed shared job publishes its final aggregate with evidence.

Consequently cap−1 work may materialize one more child and finish at the cap; work that requests a
further child returns `budget_exhausted` at the cap, never cap+1. Counts 63/64/65 yield zero/one/one
scheduled chunk boundaries respectively, with node 64 inspected before the yield and node 65 never
started after an abort observed there. The production counter fixtures cover zero-target,
terminal root/child, identity loss, repeated positions, multiple traversals, local and global
cap−1/cap/cap+1, waiter-local/last-waiter/service-close snapshots, failure boundaries and
yield−1/yield/yield+1. The permanent census reports this convention id as
`bounded-target-visited-positions@1` ([[D2111]]).

## 5. Consumer posture

All three projections initially land `inspector_only`; this is foundation, not a raw learner dump.

| consumer family | what these facts can supply | what still authorizes delivery |
|---|---|---|
| Support/touch | exact target, squares, capture arrow, immediate cause, bounded witness on request | module declaration, disclosure rung and answer ceiling |
| Review | target removal/reintroduction detail for an already-selected moment | Review significance source and typed card module |
| drills/theory | exact consequence/witness behind authored or cited meaning | authored claim or cited theory join |
| bots | exact local feature over every legal candidate | accepted bot trait/proposal rule and provider policy receipts where used |
| longitudinal/style | opportunity and outcome operands | longitudinal denominator/store contract and validated aggregation |

No surface is licensed to dump these rows merely because they exist. `inspector_only` is a
temporary binding state, not the 1.0 user experience.

## 6. Refusals

1. No `prophylaxis`, `plan`, `intent`, `best`, `good`, `bad`, `mistake`, `forced` or `unavoidable`
   field or deterministic sentence.
2. No recomputation of the source threat outside its sole FEN-owning evidence constructor, and no
   recomputation of source-position legal exchange beside the retained sealed inputs. The sole
   allowed exchange evaluator call is the declared
   `legal-exchange-for-move@1` check over the derived post-candidate board in §2.2; it cannot mint a
   source item or be replaced by an undeclared evaluator.
3. No caller-supplied after-FEN and no invented counterfactual node id.
4. No collapse of exists-exists into exists-for-all.
5. No partial traversal reported as a negative fact.
6. No pawn-created empty-destination denial projection: the D1023 population measured 0/75 and
   0/52 surviving every defence.
7. No provider request, engine score, Maia mass, ranking, default sentence or consumer binding.
8. No use of the all-defences field as an independent significance selector.
9. No partial acceptance of a provider or policy half hidden in this local RFC.
10. No inferred initial promotion history and no `target_captured` or sealed `identity_lost` state.
11. No public per-item derivation path that can bypass complete-set admission, the queue or the
    multiplication ceiling.
12. No product-supplied scheduler/fault hook, unbounded admitted batch, partial batch publication
    or post-close resurrection.

## 7. Implementation surface

| file | required change |
|---|---|
| `packages/runtime/src/tactics.ts` | export `ThreatPassAnchor`/`threatPassAnchor()` and make `threats()` consume the same transform |
| `packages/runtime/src/bounded-target.ts` | literal source/traversal identity types, closed payloads, exact joins, child-FEN derivation, local+whole-job bounded enumeration and the concrete closeable queue/service |
| `packages/runtime/src/cooperative-yield.ts` | shared dependency-free `messageChannelMacrotaskYield` authority used by this RFC and `shared-candidate-evidence-packet` ([[D2029]]) |
| `packages/runtime/src/evidence-contract.ts`, `packages/runtime/src/evidence-producer-operations.ts` | explicit availability/latency validation plus producer-operation type, constructor, set-equality assertion and exact bounded service binding |
| `packages/runtime/src/evidence-catalog.ts` | explicit latency argument on every existing producer with byte preservation; one new producer and three literal projection declarations/dispositions |
| `packages/runtime/src/evidence-source-adapters.ts` | replace caller-payload threat declaration with `declareThreatEvidence(sourceFen)`, retain its pass anchor in a private WeakMap, and expose the checked anchor reader; exact bounded-target sealing adapters |
| `packages/runtime/src/index.ts` | public operation/types export |
| `tools/d1023-bounded-policy-harness/exact-target.test.ts` | permanent control/census instrument, rewritten at implementation to import production symbols |
| `Makefile` | stable `bounded-target-contract` and `bounded-target-census` targets |
| `docs/evidence-contract.md`, `docs/semantic-evidence.md` | exact local semantics and refusal boundary |

Tests belong beside the runtime service and manifest. No server, worker, route, schema, migration,
pack or Svelte file changes in this RFC; the portable yield and bounded queue live in runtime.

## 7.1 Second fresh independent return (2026-08-30)

Exact return:
`planning/bounded-policy-targets/second-fresh-independent-buildability-review-2026-08-30.md`.
Four seams remain after the D2105–D2111 repair:

1. both public construction paths accept `CompiledEvidenceManifest`, but the current source
   adapters use the global catalogue and the request/result identities retain no manifest identity
   ([[D2202]]);
2. `ThreatPassAnchor` appears in exported signatures and payloads but has no TypeScript declaration
   ([[D2203]]);
3. the three new projection aliases have no named exact constructor, assertion or value-authority
   receipt, so the generic declared-evidence route remains able to mint their ids ([[D2204]]); and
4. the exported service's request, result and nested discriminated arms are non-exported despite the
   promised public types barrel ([[D2205]]).

The next author repair must coordinate the constructor work with `evidence-value-authority`, invert
all four executable arms, preserve the prior contracts, and undergo another fresh independent
review before implementation.

## 8. Acceptance criteria

1. The ten D1023 focused controls and exhaustive authored/imported census run through production
   symbols. The fixed population reproduces 4.10×/2.85× immediate lift, 69/120 and 130/188
   reintroduction, 2/120 and 0/188 all-defences survival, or records/escalates contrary evidence.
2. The literal declaration image in §3 compiles; the producer delta is exactly
   `{derived.bounded_target@1}` and the projection delta exactly the three ids in §3. Bindings do not
   change. Every old producer receives an explicit latency and compiles byte/digest-identically;
   the legal availability/latency matrix passes and every crossed pair fails. The new row is exactly
   `local/background`, never an implicit `sync` fallback.
3. Named-target positives retain the original sealed threat, exchange and exact source-position
   items. `declareThreatEvidence(sourceFen)` is the only threat constructor, accepts no payload,
   and binds the exact `threatPassAnchor()` in a private WeakMap read by target admission. A generic
   declaration, equal-payload foreign position, spread/JSON/cast, cross-attacker, cross-victim or
   cross-capture substitution fails; all current constructor call sites use the FEN-owned form.
4. The batch requires the exchange authorities to be set-equal to every positive material exchange
   in the threat reading and derives every candidate from the retained complete `legal_moves@1`.
   Missing/duplicate exchanges, wrong-position maps, candidate subsets and caller-supplied child
   positions fail.
5. `TrackedPieceIdentity`, `ObservedPromotionEdge` and internal `TrackedPieceState` compile with
   exactly the fields in §2.1. Identity survives ordinary motion, attacker capture, all four
   observed promotions and both rook-square castling forms without an initial promoted flag. Extra
   provenance and illegal role/ply/square transitions fail. Attacker capture returns its named
   removal cause; an unexplained replacement returns only `identity_lost` abstention. Positive and
   non-positive `legal-exchange-for-move@1` post-candidate evaluations retain exact UCI/units and
   correlate only with `preserved`/`exchange_neutralized`; other causes require `null`.
6. `ImmediateTargetOutcome` is an exhaustive discriminated union. Every legal combination passes;
   every impossible result/cause pairing, including `target_captured`, fails.
7. `BoundedReturnOutcome` has exactly `not_reintroduced`, `reintroduced` and
   `survives_every_defence` arms with three/four-move tuples. `reintroduced` requires a canonical
   same-preparation refutation; universal requires at least one legal reply; only a terminal/no-line
   negative may carry null. Witness-only, universal-without-witness, negative-with-witness,
   arbitrary array lengths and noncanonical replay fail at the adapter.
8. A synthetic candidate traversal above 25,000 positions yields only the typed `budget_exhausted`
   abstention; it cannot be sealed as `bounded_return@1`, and no partial boolean, witness or
   refutation escapes. A legal multi-candidate batch requesting position 100,001 returns only
   `batch_budget_exhausted` at 100,000 and publishes no target array. Checkmate/stalemate and
   non-terminal zero-reply fixtures remain distinct. The §4.3 counters cross terminal root/child,
   identity loss, repeated positions, multi-traversal sums, both cap−1/cap/cap+1 boundaries and
   yield−1/yield/yield+1 without counting witness replay or an unplayed capture.
9. The permanent destination negative reproduces 0/75 and 0/52 all-defences survival, and no
   destination bounded-return projection is registered.
10. Banned judgement vocabulary is absent from payloads and deterministic renderers. An LLM may
    render only an admitted consumer view and cannot add strategy or move quality.
11. The literal aliases, exported concrete `BoundedTargetBackgroundService`, static/named product
    factory and `close()` signature in §4 compile against `DeclaredEvidence<T>`. Its runtime
    `.prototype.submit` is present in `RUNTIME_EVIDENCE_PRODUCER_OPERATIONS`, whose expected
    set is derived from all background producers, and returns only the nested closed
    result algebra; a public per-item operation, crossed evidence/abstention arm, swapped input
    projection, plain payload, wrong operation symbol or undeclared production caller fails.
12. All three projections are disposed `inspector_only` with a named downstream contract; any
    direct Support, Review, drill, bot or longitudinal binding fails this RFC's fixture.
13. `make bounded-target-contract`, `make bounded-target-census`, runtime typecheck/tests, evidence
    manifest checks, `make verify-software` and `make verify-governance` pass on committed bytes
    before implementation closeout.
14. Closeout flips only rows shipped by this local layer and appends the exploration log in the same
    commit. D1652–D1656/D1658 remain owned by the provider/composition layers until those land.
15. The production-symbol census enforces the §4.1 background envelope, 512-pair ceiling and
    100,000-position whole-job ceiling. The
    service owns both complete sets, runs one active/eight queued, refuses the ninth queued job and
    deduplicates exact requests before capacity. A duplicate attaches while unique capacity is full;
    a request-thread/per-item call path or multiplication above 512 fails informatively.
16. Two waiters share one execution. Aborting one settles only that waiter with the aggregate count
    sampled by its abort listener; aborting both removes a
    queued job or cancels a running job at the next yield; a late pre-settlement waiter attaches and
    a post-settlement request starts new work. Every path removes listeners/job-map entries.
17. `boundedTargetRequestIdentity()` uses the exact three domain-separated input images and sorted
    exchange digests. Key/exchange reordering preserves identity; any producer/projection/payload or
    request-kind mutation changes it. The checked result digest rejects arbitrary identity strings,
    reordered named slots and any completed/abstained/cancelled/failed result mutation.
18. Default construction is exactly 1 active, 8 queued, 512 pairs, 25,000 per-candidate positions,
    100,000 whole-job positions, 64-position yields and fixed shared
    `messageChannelMacrotaskYield`; deployment may only narrow those ceilings and invalid/raised
    numeric limits are the only synchronous throws. No
    product constructor accepts a scheduler or fault hook. Yield, traversal, seal and invariant
    failures return their exact `failed` arms with the catch-boundary aggregate, publish nothing
    and leave queue/dedup/listener state empty.
19. A real `setTimeout(..., 0)` abort scheduled independently of the shared MessageChannel adapter
    interrupts the first 64-node chunk, receives only `cancelled/caller_aborted` at 64 inspected
    positions and observes zero partial/sealed items. Removing the adapter, either surrounding
    signal check or final pre-publish check fails.
20. `messageChannelMacrotaskYield` is imported from the one dependency-free
    `cooperative-yield.ts` by both bounded-target and candidate-packet implementations. A duplicate
    adapter body or reverse import between the two feature modules fails [[D2029]].
21. `close()` is idempotent: empty, queued, active, shared-waiter and already-closed controls settle
    every waiter exactly once, await active cleanup, retain the specified aggregate snapshots and
    leave no listener/job-map/queue state. Submission after close returns only
    `cancelled/service_closed`; no product or test hook can reopen the instance.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | implement and seal the three exact local projections | `bounded-policy-targets` | production operation + manifest/census | |
| D2 | raw Stockfish/Maia receipts, same-exchange identity and bounded scheduler | `provider-exchange-and-execution` | that RFC's implementation closeout | |
| D3 | compose the two policy projections over exact local facts and raw receipts | `bounded-target-policy-composition` | that RFC's implementation closeout | |
| D4 | Review moment selection cannot use the directionless all-defences field | `review-map` | selection fixture | |
| D5 | opportunity denominator before any habit/style inference | `longitudinal-store` | store/aggregation fixture | |
| D6 | bot grammar/trait admission for target preservation | `bot-policy` | owner ruling plus bot validation gate | |

## Open questions

None for this local collector. Whether a bot uses the facts, which Review moments matter and which
learner preset exposes them are consumer decisions and do not change the exact payload.

## Ledger routing retained from the monolithic draft

- [[D1392]] is the measured local-census receipt behind §§2.3–2.4 and acceptance criterion 1.
- [[D1411]] is closed by the permanent destination negative and by removing the false amendment
  claim; no breadth-collector clause is created here.
- [[D1391]] remains a bot-grammar discharge owned by `bot-policy`; exact local facts do not make a
  target-preserving goal expressible by themselves.
- [[D1372]] remains a bot-route provenance correction. This RFC neither defines nor consumes
  `rawMass`/`proposedBy`; the policy-composition sibling keys Maia admission on source-page mass.

## Repeat-review routing

| finding | blocker | repair owner |
|---|---|---|
| [[D1904]] | literal F1 grounding/exactness image widens over convention inputs | repaired: all three rows inherit `declared_convention/convention`; literal image compiles |
| [[D1905]] | original source FEN is absent after the threat pass convention | repaired: named target retains sealed `legal_moves@1`; exact pass-transform join is failable |
| [[D1906]] | capped traversal has no closed evidence/abstention return | repaired: evidence/abstention union; capped arm cannot carry partial facts or seal a payload |
| [[D1907]] | captured-attacker result conflicts with identity-loss prose | repaired: observed attacker capture is a reachable removal; unexplained identity loss abstains |
| [[D1908]] | normative evidence item type does not exist | repaired: literal `DeclaredEvidence<T>` projection aliases and request/result types |
| [[D1909]] | local/sync bounded traversal has no measured cost gate | repaired: `background`, 512-pair cap and permanent cold/warm tail gates |
| [[D1962]] | the claimed registered threat-pass transform is privately duplicated | author-repaired: `tactics.ts` owns one exported anchor consumed by threat and target admission |
| [[D1963]] | initial promotion provenance is absent from exchange/threat/FEN inputs | author-repaired: initial flag removed; only promotion observed inside a replay is retained |
| [[D1964]] | `target_captured` is unreachable for a candidate by the victim's own side | author-repaired: member removed; identity mismatch is an abstention rather than state evidence |
| [[D1965]] | background/cancellation is metadata around synchronous work | author-repaired: one-active/eight-queued cooperative service yields every 64 nodes and cancels before node 65 |
| [[D1966]] | the 512-pair ceiling has no request owning both complete sets | author-repaired: one batch owns set-equal targets and complete legal candidates before admission |
| [[D1967]] | request and result unions admit every cross-pair | author-repaired: one batch request has a nested discriminated result; no public per-item union remains |
| [[D1968]] | independent booleans and nullable arrays admit contradictory facts | author-repaired: three-arm outcome with fixed canonical witness/refutation tuples |
| [[D1993]] | shared work has no per-waiter cancellation or dedup/capacity ordering | author-repaired: waiter-local settlement, last-waiter cancellation, dedup-before-capacity, attachment race and cleanup are closed |
| [[D1994]] | request/result digests have no canonical byte authority | author-repaired: domain-separated `evidenceDigest` images, sorted exchange identities and checked result digests |
| [[D1995]] | live producer helper forces local work to `sync` | author-repaired: explicit latency constructor, closed legal matrix and byte-preserving existing declarations |
| [[D1996]] | producer-operation census does not exist | author-repaired: producer operation type/registry/set-equality assertion, exact service symbol and zero-caller initial census |
| [[D1997]] | `exchange_neutralized` contradicts the evaluator refusal | author-repaired: source recomputation stays refused; versioned post-candidate rule evaluation is retained and correlated |
| [[D1998]] | service failures/options and production yield are open | author-repaired: literal defaults, four failed arms, no-throw submission, cleanup/no-publication and shared MessageChannel adapter |
| [[D1999]] | visited-position count is not reproducible | author-repaired: root/edge/terminal/identity/transposition/cap/yield/replay convention `bounded-target-visited-positions@1` |

## Fresh-review routing

| finding | blocker | repair owner |
|---|---|---|
| [[D2105]] | sealed threat evidence has no source-position identity to join | author-repaired: sole FEN-owning threat constructor + private pass-anchor authority; same-shaped foreign evidence refuses |
| [[D2106]] | the producer registry names `.prototype.submit` on an erased interface | author-repaired: exported concrete class, static/named product factory and literal runtime callable |
| [[D2107]] | `TrackedPieceIdentity` is used but never declared | author-repaired: exact source identity, observed promotion edge and internal traversal-state types |
| [[D2108]] | 25,000 positions per candidate permits 12.8 million per admitted batch | author-repaired: deterministic 100,000-position whole-job bound and no-partial exhaustion arm |
| [[D2109]] | `reintroduced` permits null refutation despite not being universal | author-repaired: mandatory same-preparation refutation; terminal and universal quantifiers total |
| [[D2110]] | product callers may override yielding and the service has no shutdown | author-repaired: fixed scheduler, private fault factory and idempotent close/drain/abort lifecycle |
| [[D2111]] | batch result counts have no aggregation/cancellation convention | author-repaired: exact sum counter plus waiter/failure/close snapshot rules |
| [[D2112]] | repeat-review Make target asserted repaired defects | closed in review: target now asserts the current repaired contract |

## Changelog

- 2026-08-30 — second fresh independent review returned the D2105–D2111 author repair on
  [[D2202]]–[[D2205]]. Exact return:
  `planning/bounded-policy-targets/second-fresh-independent-buildability-review-2026-08-30.md`;
  reproduction: `make bounded-target-second-fresh-review`. No production/schema/content byte
  changed.
- 2026-08-30 — author-repaired [[D2105]]–[[D2111]]. Threat evidence now owns its source
  anchor without changing `threat@1` payload bytes; every normative identity type compiles; one
  concrete product-fixed service caps both candidate and whole-job work, counts the batch exactly,
  closes idempotently and binds a real producer operation; and each quantified outcome carries the
  witness/refutation its meaning entails. Fresh independent review still gates implementation.
- 2026-08-30 — fresh independent review returned the author repair on [[D2105]]–[[D2111]]. The
  source join, concrete service, tracked identity type, whole-job bound, return algebra, product
  lifecycle and batch counter remain unbuildable as one operation. The stale repeat-review target
  was repaired under [[D2112]] without changing the verdict or production code.
- 2026-08-29 — repaired the final [[D1993]]–[[D1999]] buildability return without authorising
  implementation. Closed request/result identity, waiter/job lifecycle, explicit manifest latency,
  producer-operation reach, post-candidate exchange semantics, service exits/defaults and exact
  node counting. Reused one dependency-free MessageChannel yield with the candidate-packet RFC
  under [[D2029]]. Dedicated author/review falsifiers and a fresh independent review remain the
  acceptance boundary.
- 2026-08-28 — repaired the second repeat [[D1962]]–[[D1968]] return. Assigned the pass
  convention to one exported `tactics.ts` anchor; removed ungrounded initial promotion provenance
  and impossible `target_captured`; changed identity loss to abstention; replaced independent
  booleans/arrays with a discriminated return algebra; replaced the uncorrelated per-item operation
  with one complete-set batch; and specified a one-active/eight-queued cooperative service yielding
  every 64 nodes. `make bounded-target-contract` now runs 18 controls plus five crossed type
  controls. Fresh independent buildability review remains required.
- 2026-08-28 — amended the repeat return without weakening F1. Added weakest-input declarations,
  retained source-position authority, closed typed outcomes/abstentions, observed-capture precedence
  and literal sealed aliases. Measured the exhaustive D1023 algorithm through
  `make bounded-target-census`: fixed-population maxima 333 target×candidate pairs and 1,305.12 ms
  per position refuse request-thread `sync`; the producer is now `local/background`. Fourteen
  executable repair controls pass. Repeat independent review remains required.
- 2026-08-27 — repeat independent review returned the narrowed local contract on [[D1904]]–[[D1909]].
  Exact return: `planning/bounded-policy-targets/repeat-independent-buildability-review-2026-08-27.md`.
- 2026-08-27 — applied the D1652–D1658 author handoff by narrowing this RFC to exact local target
  derivation. Removed the false target-specific Stockfish source, node-shaped Maia reuse, provider
  operation placeholders and mixed-latency producer. Published three literal F1 rows over retained
  sealed threat/exchange/legal-move items and one real derivation operation. Provider execution and
  target-policy composition remain explicit required 1.0 dependencies under [[D1861]].
- 2026-08-24 — repaired D1411's false breadth-collector amendment claim and corrected the
  non-existent-target Maia interval in the earlier monolithic draft.
- 2026-08-23 — initial draft from the D1023 research closure.
