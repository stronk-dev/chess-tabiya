# Module-registry semantic closure

**Question.** Can the five semantic returns in [[D1585]], [[D1586]], [[D1587]], [[D1589]] and
[[D1591]] be resolved from shipped evidence contracts without inventing chess truth or widening a
learner surface?

**Method.** Source audit of `packages/runtime/src/evidence-contract.ts`,
`evidence-catalog.ts`, `module-contract.ts`, `module-reducers.ts`, `presets.ts`,
`assistance.ts`, the Explorer wire and renderer; plus the disposable Node-24 instrument at
`tools/d1585-module-semantic-closure/`. The instrument runs crossed-negative disclosure tests,
derives Sight's answer union from the compiled manifest, injects SAN/UCI sentinels into an
Explorer result, exercises the real F1 consumer-view seals, and tests the Match role
intersection. `[V]`

## Verdict

All five returns have a buildable repair. None requires a new chess collector. Two require new
contract vocabulary, one requires a derived projection, one is a missing bridge between two
already-shipped authorities, and one is a false role intersection. The production RFC remains
returned: these results are author input, not authority to implement, and [[D1164]]'s exact
novelty-identity enumeration remains separately open.

## 1. Answer distance is a branched capability set

`AnswerDistance` is a TypeScript union, not an ordered semantic scale. Theory, evaluation and
move disclosure are independent: `theory_only` promises cited theory with no evaluation, while a
Review grade can disclose an evaluation without a plan. The draft's total order therefore grants
bytes a module did not ask for. `[V]` `packages/runtime/src/evidence-contract.ts:7`;
`packages/runtime/src/presets.ts:31-37`; `planning/learner-modules/module-registration-cross-review.md`
R1.

The smallest closed repair is to replace `ModuleAnswerContract.ceiling` with an explicit
`allowedContent: readonly AnswerDistance[]` (and exact per-stage sets for Guided Hint). Reusable
named capability images may reduce repetition, but the compiled module declaration must carry the
literal union it permits. The prototype establishes these incomparable branches:

| capability | explicit image |
|---|---|
| observation | fact |
| pattern | fact, pattern |
| threat | fact, threat |
| theory | fact, pattern, theory, principle, plan |
| evaluation | fact, evaluation |
| candidates | fact, candidate_moves |
| ranked candidates | fact, candidate_moves, ranked_moves |
| move | fact, candidate_moves, ranked_moves, move |
| principal variation | fact, candidate_moves, ranked_moves, move, principal_variation |

The images are not one ladder. A module that intentionally combines branches declares their
literal union. The able-to-fail controls prove theory refuses evaluation, evaluation refuses
theory/principle/plan, a Review union of pattern + threat + evaluation refuses candidate moves,
and a PV capability does not silently imply theory or evaluation. `[V]`

This also resolves the question behind [[D1591]] mechanically. The exact Sight set is the 17
non-retired `STRUCTURAL_FEATURE_KINDS` readings plus castling rights/legality,
rook-on-seventh, square control and pawn contacts: 22 projections. Their compiled answer-content
union is exactly `{fact, pattern}`. `rules.tactic.reading.rook_on_seventh@1` is the **only** pattern
witness; `space` and `pawn_connectivity` are not in the set. `[V]`

## 2. Explorer needs a derived population summary, not operand pseudo-narrowing

`human.explorer.population@1` retains `result`, and `CorpusResult.stats.result.moves[]` contains
SAN, UCI, count, share and W/D/L for every candidate. Removing only `committedMoveSan` cannot
remove candidate-move content, so the existing projection remains an Inspector input. `[V]`
`packages/runtime/src/evidence-catalog.ts:787`; `apps/web/src/lib/api.ts:514-516`.

The buildable breadcrumb input is a registered derived projection, recommended id
`derived.explorer.population_summary@1`, with literal input
`human.explorer.population@1`. Its closed payload retains node id, population window, total,
aggregate W/D/L, recency, or typed abstention. It has no `moves` or `committedMoveSan` member and
declares answer content `fact`; its renderer always carries `CORPUS_GUARD`. A sentinel existing
only as `moves[0].san`, `moves[0].uci`, and `committedMoveSan` is absent from the derived JSON in
the executable negative. `[V]`

This is a genuine derivation rather than rendering surgery: the payload type makes move identity
unrepresentable before the module packet is built. Provider-off preserves the source's typed
abstention and never invents population facts. `[V]`

## 3. Reducer output can reseal through the existing authority

The reducer returns `ModuleFact[]`, each retaining its original `DeclaredEvidence`. The F1 API
already provides the needed narrowing authority:

```ts
const narrowed = evidenceForConsumer(
  manifest,
  originalView.consumer,
  reduction.facts.map((fact) => fact.evidence),
);
```

This rechecks the same exact consumer binding and creates a real process-local
`ConsumerEvidenceView`; no new brand or public narrowing primitive is required. The instrument
selects a real multi-projection production consumer, admits two exact evidence values, drops one,
reseals the retained value, and renders it. The dropped sentinel reaches neither deterministic
sentences, the simulated provider input nor the voice allow-list. A spread object with the same
bytes and narrowed `items` is refused by `assertConsumerEvidenceView` with
`EVIDENCE_GENERIC_BYPASS`. `[V]` `packages/runtime/src/evidence-contract.ts:407-456`.

The author amendment should name this exact expression in packet step 3 and require the three
sentinel destinations. Passing the original view or forging a subset remains forbidden.

## 4. Match requires a role exception for its non-guidance floor

`WORKFLOW_CONTEXT_POLICIES.match.moduleCeiling` contains only `rules_floor`.
`permittedAssistance` gives a seated participant `sight` board lighting, while the draft's blanket
play-role rule permits only learner and host. The intersection is therefore empty for the invited
seat. `[V]` `packages/runtime/src/presets.ts:41-49`;
`packages/runtime/src/assistance.ts:26-34`.

`rules_floor.ceilings.roles` must be the explicit set
`[learner, host, participant]`; the remaining play modules keep their narrower role sets.
Spectator remains excluded from board input. This is not guidance widening: Match's context
ceiling still makes every non-floor module impossible. The harness contains both the positive
participant arm and the negative old-role/spectator controls. `[V]`

## Author handoff and remaining boundary

Amend `module-registration.md` as follows before repeat review:

1. replace the false answer ceiling with explicit allowed-content sets and crossed negatives;
2. correct Sight's proof to the derived 22-row union and sole pattern witness;
3. register `derived.explorer.population_summary@1`, its literal input, payload, renderer,
   `CORPUS_GUARD`, abstention and SAN/UCI sentinel negative;
4. reseal reduced facts through `evidenceForConsumer` for the same consumer before rendering;
5. include participant in `rules_floor` only and add both-seat Match closure tests;
6. re-derive all registry/binding tripwires after the new derived projection changes the set.

Together with `module-delivery-and-staging-boundary.md`, this supplies executable repair shapes for
all seven findings in the 2026-08-26 cross-review. It does **not** enumerate [[D1164]]'s stable
novelty identities for every proactive-module projection; that set-equal matrix remains the next
research job, and the registry must not be accepted until it exists and is reviewed.

## Limits

- This instrument proves contract closure, not learner usefulness or layout quality.
- The named capability images are contract factoring; each module's literal allowed set remains
  the authority.
- The Explorer summary reports population facts only. It does not turn frequency into quality,
  theory, intent or a recommendation.
- No protected design, production contract, manifest, renderer, content or RFC status changed.
