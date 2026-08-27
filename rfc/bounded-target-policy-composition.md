# RFC: Bounded target policy composition

- **Status:** draft — blocked on acceptance/implementation of `provider-exchange-and-execution` and `bounded-policy-targets`; independent buildability review required
- **Author:** codex, from the D1023 result and D1652–D1658 contract-closure handoff
- **Created:** 2026-08-27
- **Exploration gate:** [[D1023]] ✅; contract closure `design/research/bounded-policy-target-contract-closure.md`
- **Depends on:** `rfc/bounded-policy-targets.md`; `rfc/provider-exchange-and-execution.md`; implemented F1 path-effective execution/confidence compilation
- **Planning:** `planning/bounded-policy-targets/`

```tabiya-claims
none
```

## Summary

This RFC composes two provider-labelled opinions over the exact target facts defined by
`bounded-policy-targets`:

- a Stockfish depth-stability category over a complete legal-root table; and
- Maia probability bounds over one declared band and bounded expansion.

It is the third and final infrastructure layer of [[D1861]]. Raw provider records stay reusable;
they contain no target interpretation. Exact target facts stay local and provider-free. Only this
layer joins the two authorities, and every result retains the receipts and exact facts that justify
it.

The outputs are reported readings, not strategy, move quality, human difficulty or learner-facing
sentences. They initially remain inspector-only. Support, Review, drills, bots and longitudinal
analysis each need their own binding, selection and presentation contracts.

## 1. Shared inputs

The composition operation accepts only sealed evidence items:

| input | authority |
|---|---|
| `derived.bounded_target.named_material_target@1` | exact attacker/victim/capture identity |
| `derived.bounded_target.immediate@1` | exact candidate and immediate target state |
| `derived.bounded_target.bounded_return@1` | exact bounded witnesses/refutations under `bounded-target@1` |
| `live.stockfish.legal_root_table@1` | same-exchange complete legal-root search table |
| `human.maia.policy_page@1` | one node-free model policy page under a complete request identity |

Every join checks exact FEN, move identity and target identity. The operation may request additional
provider pages only through the shared typed operations and scheduler. It never calls a raw engine,
Maia client, health snapshot or private cache.

## 2. Stockfish target-policy reading

### 2.1 Payload

```ts
type TargetPolicyCategory = Readonly<{
  nextExecution: boolean;
  secondOpportunityAvailable: boolean;
}>;

interface EngineTargetPolicyReading {
  readonly convention: "bounded-target-engine-policy@1";
  readonly target: DeclaredEvidenceItem;
  readonly immediate: DeclaredEvidenceItem;
  readonly boundedReturn: DeclaredEvidenceItem;
  readonly candidateUci: string;
  readonly counterfactualUci: string;
  readonly pairKey: string;
  readonly depths: readonly [8, 10];
  readonly tables: readonly [DeclaredEvidenceItem, DeclaredEvidenceItem];
  readonly perDepth: readonly {
    readonly depth: 8 | 10;
    readonly category: TargetPolicyCategory;
    readonly bestMoveUci: string;
    readonly score: { readonly kind: "cp" | "mate"; readonly value: number };
  }[];
  readonly stableCategory: TargetPolicyCategory;
}
```

The operation derives `nextExecution` by comparing the table's selected root move with the exact
target capture. It derives `secondOpportunityAvailable` only after the selected first move and one
declared defender reply, at the opponent's second decision state. Availability is not execution and
the two fields are never summed.

The result is admitted only when both complete tables agree on the ordered category. Disagreement
abstains as `depth_category_unstable`; it never selects depth 8, depth 10 or an average. The
counterfactual is mandatory and legal under the same source position. Candidate and counterfactual
must differ and retain the same exact target identity.

### 2.2 Completeness

The raw source already proves unique set equality against `exactLegalMoves(fen)` and reached depth.
Composition rechecks the receipt and exact FEN but does not replace source completeness with a
second response-owned count. A missing, duplicate, extra, equal-count replacement or short-depth
table is impossible to admit as `live.stockfish.legal_root_table@1` and therefore impossible here.

The fixed D1023 population measured category agreement on 88/96 pairs (91.67%) across depth 8 and
10. `[V]` (`design/research/bounded-policy-targets.md`) The eight disagreements remain the permanent
abstention population; a contrary production-symbol rerun is evidence to record, not a threshold to
weaken.

## 3. Maia policy-bounds reading

### 3.1 Request convention

One reading names exactly one applied band. Where the evidence describes a played run, that band is
the run's applied band. A counterfactual/research request with no run names its band explicitly.
There is no multi-band learner control or cross-band average.

The root and hypothetical second positions use `exact_fen` Maia requests. A played run occurrence
may retain its `history_conditioned` page as an additional input, but it is never treated as equal
to an exact-FEN counterfactual merely because the resulting boards match. Model identity, band,
temperature, top-p, requested width and exchange generation are all part of request identity.

### 3.2 Payload

```ts
type ProbabilityInterval = Readonly<{ lower: number; upper: number }>;

interface BoundedTargetPolicyBounds {
  readonly convention: "bounded-target-maia-policy@1";
  readonly target: DeclaredEvidenceItem;
  readonly immediate: DeclaredEvidenceItem;
  readonly boundedReturn: DeclaredEvidenceItem;
  readonly candidateUci: string;
  readonly counterfactualUci: string;
  readonly pairKey: string;
  readonly appliedBand: number;
  readonly temperature: 0.8;
  readonly topP: 0.92;
  readonly keptPerNode: 8;
  readonly retainedMassFloor: 0.9;
  readonly pages: readonly DeclaredEvidenceItem[];
  readonly nextExecutionMass: ProbabilityInterval;
  readonly nextExecutionAbsence: ImmediateTargetCause | null;
  readonly secondOpportunityAvailableMass: ProbabilityInterval;
  readonly expandedSecondNodes: number;
  readonly minimumSecondKeptMass: number;
  readonly denominator: {
    readonly requestedNodes: number;
    readonly admittedNodes: number;
    readonly returnedMass: number;
    readonly keptMass: number;
    readonly candidateCount: number;
    readonly keptCount: number;
  };
}
```

The root page is retained. Up to the top eight root moves are expanded; each second page is retained
with the exact child FEN that requested it. One row costs at most nine Maia calls, all through the
shared scheduler and one exact scoped request identity.

### 3.3 The two quantities

`nextExecutionMass` is probability assigned to playing the target capture at the next opponent
decision:

- target exists and page contains it: `[m, m]`;
- target does not exist as the same legal positive capture: `[0, 0]` plus typed absence cause;
- target exists but is absent from a mass-bearing bounded page: `[0, missingMass]`.

`secondOpportunityAvailableMass` is path mass reaching a later position where the exact capture is
available, not selected. Its lower bound is verified available path mass; its upper bound is
`1 - knownFailure`. Tail mass is never renormalized away.

The two values refer to different states and events. No sum, average or composite “prevention score”
exists.

### 3.4 Admission and abstention

Every root and expanded second page must have retained mass at least 0.90 and no mass-less candidate.
Any page with an `offWindow` or otherwise mass-less row refuses the whole reading; excluding or
zeroing that row would fabricate returned mass. Refused pages are not negative observations.

Typed abstentions are:

- `input_abstained`;
- `position_or_target_mismatch`;
- `provider_unavailable`, `timeout`, `cancelled`, `identity_or_generation_mismatch`;
- `retained_mass_below_gate`;
- `massless_candidate`;
- `expansion_budget_exhausted`.

The payload retains its denominator because D1023 admission is band-confounded: 52/66/77/85 of 96
rows passed at bands 1000/1400/1800/2200. `[V]` No aggregate or longitudinal use may discard the
band-specific admitted/total pair.

## 4. Literal F1 declaration image

One derived producer owns two projections. Its own operation is local, while both compiled paths
are provider-bearing and interactive through their literal inputs. This is the mixed-producer
case that F1's path-effective execution metadata must represent.

### 4.1 Producer

| field | value |
|---|---|
| id/version | `derived.bounded_target_policy@1` |
| plane | `derived` |
| implementation | `apps/server/src/bounded-target-policy.ts` |
| own availability/latency | `local` / `sync` |

### 4.2 `derived.bounded_target.engine_target_policy@1`

| field | value |
|---|---|
| role / plane | `reading` / `derived` |
| payloadType | `EngineTargetPolicyReading` |
| semantics | depth-stable Stockfish category for next execution and second-opportunity availability over one exact target/candidate pair |
| operands | all fields of §2.1 |
| signs | `preserved`, `removed`, `enabled` |
| grounding / exactness / confidence | `declared_convention` / `convention` / `reported` |
| answerContent | `fact`, `threat`, `evaluation`, `candidate_moves`, `move` |
| forms | `sentence`, `list`, `timeline_marker`, `panel`, `machine_condition` |
| abstention | possible: `input_abstained`, `position_or_target_mismatch`, `counterfactual_invalid`, `depth_category_unstable` |
| derivation inputs | `live.stockfish.legal_root_table@1`, `derived.bounded_target.named_material_target@1`, `derived.bounded_target.immediate@1`, `derived.bounded_target.bounded_return@1` |
| effective execution | provider-bearing / interactive; inherited same-exchange Stockfish requirement |
| limitations | two fixed depths; reports engine choice, not bestness, intent, human likelihood or strategic meaning |
| disposition | `inspector_only` |

### 4.3 `derived.bounded_target.policy_bounds@1`

| field | value |
|---|---|
| role / plane | `reading` / `derived` |
| payloadType | `BoundedTargetPolicyBounds` |
| semantics | one-band lower/upper bounds for next target execution and later target availability under the declared Maia expansion |
| operands | all fields of §3.2 |
| signs | `preserved`, `removed`, `enabled` |
| grounding / exactness / confidence | `declared_convention` / `convention` / `reported` |
| answerContent | `fact`, `threat`, `candidate_moves` |
| forms | `sentence`, `list`, `timeline_marker`, `panel`, `machine_condition` |
| abstention | possible: all reasons in §3.4 |
| derivation inputs | `human.maia.policy_page@1`, `derived.bounded_target.named_material_target@1`, `derived.bounded_target.immediate@1`, `derived.bounded_target.bounded_return@1` |
| effective execution | provider-bearing / interactive; inherited Maia model/band/generation requirement |
| limitations | one declared band; bounded page/expansion; probability is model choice, not quality, intent or player diagnosis |
| disposition | `inspector_only` |

The compiler must reject either row if confidence is widened above the reported provider input, if
the provider-bearing path advertises sync-only satisfaction, or if a raw source is omitted from the
literal derivation member.

## 5. Production operation

`BoundedTargetPolicyCompositionOperation.evaluate(request, scope, signal)` is constructed by
`apps/server/src/application.ts` with:

- `BoundedTargetDerivationOperation`;
- `StockfishLegalRootTableOperation`;
- `MaiaPolicyPageOperation`; and
- the shared `ProviderExchangeScheduler`.

The request names one exact target, candidate, counterfactual and requested arm (`stockfish`, `maia`
or both). It carries a complete decision stamp or operator scope. Cancellation propagates to queued
and active provider work; late results are dropped. The operation uses no private cache. Exact raw
requests may coalesce in the shared scheduler; final policy readings may be retained only under a
complete key containing target/candidate/counterfactual identity, every source request digest,
provider generation/model and all declared composition parameters.

One operator/research traversal executes both arms before any learner binding lands. A manifest row,
source filename or constructor-only test does not satisfy reachability.

## 6. Consumer posture and refusals

Both projections land inspector-only. Later consumers may use them only through their accepted
contracts:

- Review can attach the readings to a moment chosen by a separate significance source;
- Support can request a bounded fact under a preset/rung, never on hover;
- a bot can use the raw vector or a declared target feature only after its own trait/proposal gate;
- longitudinal analysis must carry opportunity, band and admitted/total denominators;
- theory/authored content supplies strategic meaning.

This RFC refuses:

1. target interpretation inside a raw Stockfish or Maia record;
2. fake node ids for hypothetical positions or FEN-only aliasing of history-conditioned Maia work;
3. provider-owned counts as legal-root completeness;
4. health/constructor identity stamped onto later response bytes;
5. unbounded promise maps, hover-triggered provider work or a private scheduler;
6. inheriting one Stockfish depth when the category disagrees;
7. mass renormalization, mass-less-row zeroing, cross-band aggregation or summing the two Maia
   quantities;
8. strategy, `prophylaxis`, intent, move quality, ranking, human-likeness or player-type claims;
9. direct learner binding or a raw evidence dump.

## 7. Implementation surface

| file | required change |
|---|---|
| `apps/server/src/bounded-target-policy.ts` | closed composition request, two derivations, exact joins and operation |
| `apps/server/src/application.ts` | inject local operation, two provider operations and shared scheduler |
| `packages/runtime/src/evidence-catalog.ts` | producer plus two literal projection declarations/dispositions |
| `packages/runtime/src/evidence-source-adapters.ts` | sealed derived adapters |
| `apps/server/src/evidence-manifest.ts`, `capabilities.ts` | compiled provider-bearing path/disposition reporting |
| `tools/bounded-target-census.mjs` | production-symbol D1023 policy rerun and operation census |
| docs/Makefile/tests | contract documentation, target and permanent gates |

No schema, migration, pack, authored content or learner UI changes in this RFC.

## 8. Acceptance criteria

1. Both literal declarations compile with reported confidence and provider-bearing effective paths;
   reported→exact and provider→sync widening fixtures fail.
2. Stockfish rows retain two same-exchange source items plus exact target facts and pair identity.
   Position, target, candidate, counterfactual, depth, receipt or generation swaps fail.
3. Ordinary, both castling identities and four promotions survive source completeness; equal-count
   replacement, duplicate, missing/extra and short-depth tables cannot enter composition.
4. The sealed D1023 Stockfish population reruns through production symbols at 88/96 depth agreement;
   the same eight disagreements abstain, or contrary evidence is recorded/escalated.
5. Maia keys distinguish request convention, history, exact FEN, model, band, temperature, top-p,
   width and generation. Exact duplicate pages may coalesce; equal-FEN/different-history pages may not.
6. The three-arm next-execution interval is exhaustive. A non-existent target yields `[0,0]`; a
   legal target absent from a bounded page yields `[0,missingMass]`; identity swaps fail.
7. Root and every expanded page satisfy the 0.90 retained-mass gate. A mass-less/off-window row
   refuses the reading; no zeroing or renormalization path exists.
8. Next execution and second-opportunity availability remain separate types/fields and cannot be
   summed. One-band payloads carry exact band-specific denominators.
9. The sealed D1023 Maia population reruns at 52/66/77/85 admitted rows by band, or records/escalates
   contrary evidence. The permanent absent-target and missing-mass negatives remain able to fail.
10. Application/source census reaches the composed operation, both provider operations, scheduler
    and sealing adapters. Deleting any callable or replacing it with a manifest/file anchor fails.
11. Burst, exact-key dedupe, queued/active cancellation, weighted retention, TTL, provider restart,
    model change, timeout and late-result tests reuse the provider scheduler fixtures; no second
    cache/scheduler appears in this implementation.
12. Zero learner bindings land. Banned judgement vocabulary and raw provider sentences are absent.
13. Focused server/runtime tests, operation/evidence/capability censuses, `make verify-software` and
    `make verify-governance` pass on committed bytes before closeout.
14. Closeout flips D1652/D1653 only after provider implementation exists, D1654–D1658 only to the
    degree their shared layer shipped, and this RFC's composition row only after both projections
    execute. The exploration log is appended in the same commit.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | implement and traverse both policy derivations | `bounded-target-policy-composition` | operation census + production-symbol rerun | |
| D2 | keep source receipt/scheduler semantics single-owned | `provider-exchange-and-execution` | provider closeout and zero-private-adapter census | |
| D3 | bind Review only through a separate significance selector | `review-map` | Review selection/binding fixture | |
| D4 | bind Support only through a module preset/rung and explicit request | `module-registration` | composed module journey | |
| D5 | admit any bot use only after its trait/proposal validation gate | `bot-policy` | policy gate and distribution validation | |
| D6 | carry opportunity and band denominators into longitudinal use | `longitudinal-store` | store/aggregation fixture | |

## Open questions

None for the composition foundation. Bot admission, Review selection and learner preset exposure are
separate consumer decisions and cannot weaken these source/derivation boundaries.

## Changelog

- 2026-08-27 — created as the third layer required by the D1652–D1658 author handoff. It replaces
  the monolithic RFC's interpreted Stockfish “source” and node-shaped Maia reuse with two literal
  reported derivations over shared raw receipts plus the three exact local target facts.
