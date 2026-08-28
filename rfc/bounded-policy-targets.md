# RFC: Convention-grounded bounded material targets

- **Status:** **draft — RETURNED by second repeat independent review 2026-08-28 on [[D1962]],
  [[D1963]], [[D1964]], [[D1965]], [[D1966]], [[D1967]] and [[D1968]].** The three-layer split,
  convention grounding, exact source authority, provider separation and inspector-only posture
  survive. Implementation remains unauthorised: the pass transform is duplicated; initial
  promotion provenance is unavailable; one immediate outcome is impossible; background,
  cancellation and the 512-pair batch have no execution owner; and request/result/witness truth is
  uncorrelated. Exact return:
  `planning/bounded-policy-targets/second-repeat-independent-buildability-review-2026-08-28.md`.
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

The local adapter consumes sealed evidence items. It must not call `threats()`,
`legalExchangeForMove()` or an equivalent detector to recreate those inputs. This is the central
D1657 correction: one projection identity has one authority, and a derived item retains the exact
items from which it was computed.

### 1.2 What a named target means

A named material target is one positive legal capture available to the opponent after the pass
convention already declared by `rules.tactic.consequence.threat@1`. It is identified by:

- canonical six-field original source FEN and its exact sealed `legal_moves@1` item;
- canonical six-field passed-position FEN;
- attacker colour, role, promoted state and square;
- victim colour, role, promoted state and square;
- canonical capture UCI under `chessops-king-takes-rook@1`;
- the retained threat and legal-exchange evidence items.

The join requires literal equality of attacker, victim, capture identity and embedded exchange
payload. It also applies the registered threat pass transform (flip side to move, clear en-passant,
preserve the other canonical FEN fields) to the sealed source-position FEN and requires exact
equality with the exchange's passed-position FEN. A cross-position, cross-target or copied
payload-shaped substitute refuses. The source FEN is never reconstructed from the passed FEN and
cannot be supplied as an unsealed scalar.

### 1.3 Candidate authority

`immediate@1` and `bounded_return@1` consume the same exact source-position authority retained by
the named target. Candidate UCI must be a unique member of that item. The adapter computes the
child FEN once by playing that canonical identity; callers may not supply an after-FEN alongside
the move.

This makes a counterfactual legal move truthful without inventing `run.record.move` or another run
node. A wrong-FEN legal map, missing candidate, duplicate candidate or caller-supplied child board
refuses before any bounded enumeration begins.

## 2. Closed local payloads

### 2.1 `NamedMaterialTarget`

```ts
type ProjectionEvidence<Id extends string, Payload> =
  DeclaredEvidence<Payload> & {
    readonly projection: { readonly id: Id; readonly version: 1 };
  };

type ThreatEvidence = ProjectionEvidence<
  "rules.tactic.consequence.threat",
  ThreatResult
>;
type LegalExchangeEvidence = ProjectionEvidence<
  "rules.exchange.predicate.legal_exchange",
  LegalExchangeResult
>;
type SourceLegalMovesEvidence = ProjectionEvidence<
  "rules.mobility.reading.legal_moves",
  ExactLegalMoveMap
>;

interface NamedMaterialTarget {
  readonly convention: "bounded-target@1";
  readonly sourceFen: string;
  readonly passedFen: string;
  readonly attacker: TrackedPieceIdentity;
  readonly victim: TrackedPieceIdentity;
  readonly captureUci: string;
  readonly threat: ThreatEvidence;
  readonly exchange: LegalExchangeEvidence;
  readonly sourcePosition: SourceLegalMovesEvidence;
}
```

`TrackedPieceIdentity` contains colour, role, promoted flag and square. It advances through normal
moves, captures, promotion and chessops rook-square castling. An observed legal capture of the
attacker or victim is a known removal cause and takes precedence over identity loss. `identity_lost`
is reserved for a replacement or mismatch that the exact candidate update cannot explain; it never
silently retargets another piece on the same square.

### 2.2 `BoundedTargetImmediate`

```ts
type ImmediateTargetOutcome =
  | { readonly result: "preserved"; readonly cause: "preserved" }
  | {
      readonly result: "removed";
      readonly cause:
        | "attacker_captured"
        | "target_captured"
        | "target_moved"
        | "capture_illegal"
        | "exchange_neutralized";
    }
  | { readonly result: "identity_lost"; readonly cause: "identity_lost" };

interface BoundedTargetImmediate {
  readonly target: NamedMaterialTarget;
  readonly candidateUci: string;
  readonly afterFen: string;
  readonly outcome: ImmediateTargetOutcome;
}
```

The discriminated union makes the result/cause relation closed. Known legal captures are resolved
before identity comparison: a candidate that captures the tracked attacker is
`removed/attacker_captured`; one that captures the tracked victim is `removed/target_captured`.
Only an unexplained replacement or failed identity update is `identity_lost/identity_lost`.

The adapter retains the named target, which itself retains the exact legal-move authority. A
sentence or overlay can therefore point back to every source authority without accepting a second
legal map. It does not say the candidate was good, best, intentional or prophylactic.

### 2.3 `BoundedTargetReturn`

```ts
interface BoundedTargetReturn {
  readonly immediate: BoundedTargetImmediate;
  readonly horizonPlies: 3;
  readonly visitedPositions: number;
  readonly reintroducedWithin3Ply: boolean;          // exists preparation, exists reply
  readonly reintroductionWitness: readonly string[] | null;
  readonly preparationSurvivesEveryDefence: boolean; // exists preparation, forall replies
  readonly everyDefenceWitness: readonly string[] | null;
  readonly firstRefutation: readonly string[] | null;
}
```

The two booleans are not aliases and are never collapsed. A reintroduction witness contains the
candidate, opponent preparation, defender reply and available capture. The stronger witness names
the preparation whose target survives every legal defender reply; when false, `firstRefutation`
retains the first canonical line showing why the candidate preparation fails.

The horizon is exactly three plies after the candidate. Enumeration stops before exceeding
**25,000 visited positions**. At the cap the operation returns the typed `budget_exhausted`
abstention in §4; it cannot construct or seal this payload, so a partial traversal never becomes a
false `false` result. Terminal positions have zero continuations without inventing a reply. A
fourth ply is a different search and remains outside v1 under [[D1025]].

### 2.4 Direction and significance

The projections describe state changes with signs `preserved` and `removed`. The all-defences
field may be rendered when a caller has already selected this exact target. It may not select a
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

### 3.2 `derived.bounded_target.named_material_target@1`

| field | value |
|---|---|
| role / plane | `reading` / `derived` |
| payloadType | `NamedMaterialTarget` |
| semantics | convention-grounded positive material-capture identity retained from threat, exchange and the exact source-position authority |
| operands | `convention`, `sourceFen`, `passedFen`, `attacker`, `victim`, `captureUci`, `threat`, `exchange`, `sourcePosition` |
| signs | `state`, `threatened` |
| grounding / exactness / confidence | `declared_convention` / `convention` / `exact` |
| answerContent | `fact`, `threat` |
| forms | `sentence`, `list`, `lit_squares`, `arrows`, `piece_halo`, `machine_condition` |
| abstention | possible: `input_abstained`, `position_mismatch`, `target_mismatch`, `exchange_mismatch` |
| derivation inputs | `rules.tactic.consequence.threat@1`, `rules.exchange.predicate.legal_exchange@1`, `rules.mobility.reading.legal_moves@1` |
| limitations | one exact material capture; no intent, quality, plan, force or significance |
| disposition | `inspector_only` until a named module/Review/bot RFC binds it |

### 3.3 `derived.bounded_target.immediate@1`

| field | value |
|---|---|
| role / plane | `event` / `derived` |
| payloadType | `BoundedTargetImmediate` |
| semantics | convention-grounded immediate preservation/removal of one named material target after one legal candidate |
| operands | `target`, `candidateUci`, `afterFen`, `outcome` |
| signs | `preserved`, `removed` |
| grounding / exactness / confidence | `declared_convention` / `convention` / `exact` |
| answerContent | `fact`, `threat` |
| forms | `sentence`, `timeline_marker`, `lit_squares`, `arrows`, `piece_halo`, `machine_condition` |
| abstention | possible: `input_abstained`, `position_mismatch`, `candidate_not_legal`, `target_mismatch` |
| derivation inputs | `derived.bounded_target.named_material_target@1` |
| limitations | one candidate and target; no ranking, evaluation, recommendation, intent or significance |
| disposition | `inspector_only` until a named consumer binds it |

### 3.4 `derived.bounded_target.bounded_return@1`

| field | value |
|---|---|
| role / plane | `reading` / `derived` |
| payloadType | `BoundedTargetReturn` |
| semantics | separate exists-exists return and exists-for-all-defences survival within the declared three-ply horizon |
| operands | `immediate`, `horizonPlies`, `visitedPositions`, `reintroducedWithin3Ply`, `reintroductionWitness`, `preparationSurvivesEveryDefence`, `everyDefenceWitness`, `firstRefutation` |
| signs | `preserved`, `removed`, `enabled` |
| grounding / exactness / confidence | `declared_convention` / `convention` / `exact` |
| answerContent | `fact`, `threat` |
| forms | `sentence`, `list`, `timeline_marker`, `lit_squares`, `arrows`, `machine_condition` |
| abstention | possible: `input_abstained`, `position_mismatch`, `target_mismatch`, `budget_exhausted` |
| derivation inputs | `derived.bounded_target.immediate@1` |
| limitations | horizon is three plies; the all-defences fact cannot select a moment; no strategy or inevitability beyond the enumerated horizon |
| disposition | `inspector_only` until a named consumer binds it |

No declaration has a provider dependency. `local` says where the calculation executes; it does not
mean cheap. The measured tails in §4.1 require `background` for all three projections. The
policy-composition RFC will declare separate provider-bearing paths rather than making this
producer lie about its local facts.

## 4. Operation and sealing boundary

The literal sealed aliases are:

```ts
type NamedMaterialTargetEvidence = ProjectionEvidence<
  "derived.bounded_target.named_material_target",
  NamedMaterialTarget
>;
type BoundedTargetImmediateEvidence = ProjectionEvidence<
  "derived.bounded_target.immediate",
  BoundedTargetImmediate
>;
type BoundedTargetReturnEvidence = ProjectionEvidence<
  "derived.bounded_target.bounded_return",
  BoundedTargetReturn
>;

type BoundedTargetDerivationRequest =
  | {
      readonly kind: "named_material_target";
      readonly threat: ThreatEvidence;
      readonly exchange: LegalExchangeEvidence;
      readonly sourcePosition: SourceLegalMovesEvidence;
    }
  | {
      readonly kind: "immediate";
      readonly target: NamedMaterialTargetEvidence;
      readonly candidateUci: string;
    }
  | {
      readonly kind: "bounded_return";
      readonly immediate: BoundedTargetImmediateEvidence;
    };

type BoundedTargetProjectionId =
  | { readonly id: "derived.bounded_target.named_material_target"; readonly version: 1 }
  | { readonly id: "derived.bounded_target.immediate"; readonly version: 1 }
  | { readonly id: "derived.bounded_target.bounded_return"; readonly version: 1 };

type BoundedTargetAbstentionReason =
  | "input_abstained"
  | "position_mismatch"
  | "target_mismatch"
  | "exchange_mismatch"
  | "candidate_not_legal"
  | "multiplication_limit"
  | "budget_exhausted"
  | "cancelled";

type BoundedTargetDerivationResult =
  | {
      readonly kind: "evidence";
      readonly item:
        | NamedMaterialTargetEvidence
        | BoundedTargetImmediateEvidence
        | BoundedTargetReturnEvidence;
    }
  | {
      readonly kind: "abstained";
      readonly projection: BoundedTargetProjectionId;
      readonly reason: BoundedTargetAbstentionReason;
      readonly inputDigests: readonly string[];
      readonly candidateUci?: string;
      readonly visitedPositions?: number;
    };

interface BoundedTargetDerivationOperation {
  derive(
    request: BoundedTargetDerivationRequest,
    signal: AbortSignal,
  ): Promise<BoundedTargetDerivationResult>;
}
```

The implementation accepts only compiler-admitted sealed items with the exact projection ids above.
It returns a sealed derived item or one typed abstention. A `budget_exhausted` result may retain only
the requested projection, input digests, candidate identity and visited-position count. It contains
no preservation boolean, witness or refutation, and the adapter refuses to seal
`bounded_return@1` on that arm. Direct exports may expose pure helpers for tests, but application or
server callers use the operation; no second adapter may create a payload-shaped object and declare
it later.

The operation is exported from `packages/runtime/src/index.ts`. Its implementation and declaration
are included in the generated evidence-operation census. Removing the callable, swapping an input
projection or returning an unsealed payload fails before any consumer binding exists.

### 4.1 Execution class and multiplication bound

`make bounded-target-census` measures the D1023 algorithm over the fixed authored and imported
populations. The 2026-08-28 author run measured per-target/candidate p95 at 12.40 ms and 10.26 ms,
but one legitimate call reached 753.88 ms. Whole-position p95 was 367.10 ms and 343.68 ms, with
maxima of 1,305.12 ms and 993.43 ms. `[V]`
(`tools/d1023-bounded-policy-harness/exact-census-output.md`;
`design/research/bounded-target-execution-closure.md`). This refuses request-thread `sync` even
though the computation is provider-free.

The production operation is therefore background-only and cancellation-aware. A Support gesture,
board hover, move commit or HTTP request may consume a completed item but may not run the traversal
inline. A source-position job admits at most **512 target × candidate pairs**; it returns
`multiplication_limit` before enumeration when the exact target and legal-candidate authorities
exceed that bound. Consumers may narrow that set but may not fan it into independent unbounded jobs.
The permanent census records fixed-population maxima of 111 authored and 333 imported pairs and
fails if either exceeds 512.

The same census enforces a conservative background envelope: cold position <1,000 ms, per-call p95
<100 ms, whole-position p95 <500 ms, per-call max <2,000 ms and whole-position max <5,000 ms. It
also asserts that the fixed populations do **not** satisfy the predeclared request-thread envelope
(all calls <250 ms and all positions <1,000 ms). If that last assertion changes, the RFC must be
explicitly reclassified; a stale execution label may not survive a performance improvement.

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
2. No recomputation of threat or legal exchange beside the retained sealed inputs.
3. No caller-supplied after-FEN and no invented counterfactual node id.
4. No collapse of exists-exists into exists-for-all.
5. No partial traversal reported as a negative fact.
6. No pawn-created empty-destination denial projection: the D1023 population measured 0/75 and
   0/52 surviving every defence.
7. No provider request, engine score, Maia mass, ranking, default sentence or consumer binding.
8. No use of the all-defences field as an independent significance selector.
9. No partial acceptance of a provider or policy half hidden in this local RFC.

## 7. Implementation surface

| file | required change |
|---|---|
| `packages/runtime/src/bounded-target.ts` | identities, closed payloads, exact joins, child-FEN derivation, bounded enumeration and operation |
| `packages/runtime/src/evidence-catalog.ts` | one producer and three literal projection declarations/dispositions |
| `packages/runtime/src/evidence-source-adapters.ts` | exact sealing adapters over the normative operands |
| `packages/runtime/src/index.ts` | public operation/types export |
| `tools/d1023-bounded-policy-harness/exact-target.test.ts` | permanent control/census instrument, rewritten at implementation to import production symbols |
| `Makefile` | stable `bounded-target-contract` and `bounded-target-census` targets |
| `docs/evidence-contract.md`, `docs/semantic-evidence.md` | exact local semantics and refusal boundary |

Tests belong beside the runtime operation and manifest. No server, worker, route, schema, migration,
pack or Svelte file changes in this RFC.

## 8. Acceptance criteria

1. The ten D1023 focused controls and exhaustive authored/imported census run through production
   symbols. The fixed population reproduces 4.10×/2.85× immediate lift, 69/120 and 130/188
   reintroduction, 2/120 and 0/188 all-defences survival, or records/escalates contrary evidence.
2. The literal declaration image in §3 compiles; the producer delta is exactly
   `{derived.bounded_target@1}` and the projection delta exactly the three ids in §3. Bindings do not
   change.
3. Named-target positives retain the original sealed threat, exchange and exact source-position
   items. The pass transform joins that source to the passed FEN; cross-position, cross-attacker,
   cross-victim, cross-capture and copy-spread substitutions all fail.
4. Candidate identity is set-member checked against the retained `legal_moves@1`; wrong-position
   legal maps, missing candidates and caller-supplied child positions fail.
5. Identity survives ordinary motion, capture, all four promotions and both rook-square castling
   forms. Observed attacker/victim captures return their named removal causes before identity
   comparison; only an unexplained replacement returns `identity_lost`.
6. `ImmediateTargetOutcome` is an exhaustive discriminated union. Every legal combination passes;
   every impossible result/cause pairing fails.
7. Exists-exists and exists-for-all are separate fields with separate witnesses. Replacing them
   with one boolean, exchanging witnesses or omitting the first refutation fails.
8. A synthetic traversal above 25,000 positions yields only the typed `budget_exhausted`
   abstention; it cannot be sealed as `bounded_return@1`, and no partial boolean, witness or
   refutation escapes. Checkmate/stalemate and non-terminal zero-reply fixtures remain distinct.
9. The permanent destination negative reproduces 0/75 and 0/52 all-defences survival, and no
   destination bounded-return projection is registered.
10. Banned judgement vocabulary is absent from payloads and deterministic renderers. An LLM may
    render only an admitted consumer view and cannot add strategy or move quality.
11. The literal aliases and `BoundedTargetDerivationOperation` signature in §4 compile against
    `DeclaredEvidence<T>`. It is present in the operation census and returns only the closed result
    union; removing it, swapping an input projection or returning a plain payload fails.
12. All three projections are disposed `inspector_only` with a named downstream contract; any
    direct Support, Review, drill, bot or longitudinal binding fails this RFC's fixture.
13. `make bounded-target-contract`, `make bounded-target-census`, runtime typecheck/tests, evidence
    manifest checks, `make verify-software` and `make verify-governance` pass on committed bytes
    before implementation closeout.
14. Closeout flips only rows shipped by this local layer and appends the exploration log in the same
    commit. D1652–D1656/D1658 remain owned by the provider/composition layers until those land.
15. The production-symbol census enforces the §4.1 background envelope and 512-pair ceiling. A
    request-thread call path, a fixed-population multiplication above 512, an unhandled cancellation,
    or a fixed population newly satisfying the predeclared sync envelope fails informatively.

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
| [[D1907]] | captured-attacker result conflicts with identity-loss prose | repaired: observed attacker/victim capture precedes unexplained identity loss in a closed union |
| [[D1908]] | normative evidence item type does not exist | repaired: literal `DeclaredEvidence<T>` projection aliases and request/result types |
| [[D1909]] | local/sync bounded traversal has no measured cost gate | repaired: `background`, 512-pair cap and permanent cold/warm tail gates |
| [[D1962]] | the claimed registered threat-pass transform is privately duplicated | returned: export one source/passed anchor authority used by threat and target admission |
| [[D1963]] | initial promotion provenance is absent from exchange/threat/FEN inputs | returned: remove it or add a genuine history authority; observed promotion remains exact |
| [[D1964]] | `target_captured` is unreachable for a candidate by the victim's own side | returned: remove the member and fixture only reachable immediate causes |
| [[D1965]] | background/cancellation is metadata around synchronous work | returned: specify bounded queue, cooperative yield/worker and maximum cancellation latency |
| [[D1966]] | the 512-pair ceiling has no request owning both complete sets | returned: add a set-owning batch admission or move the ceiling to its real owner |
| [[D1967]] | request and result unions admit every cross-pair | returned: publish a distributive map or exact descriptors |
| [[D1968]] | independent booleans and nullable arrays admit contradictory facts | returned: publish a discriminated result algebra or mandatory validating constructor |

## Changelog

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
