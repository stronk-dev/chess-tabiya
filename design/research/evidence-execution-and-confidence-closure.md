# Evidence execution paths — confidence, latency and source availability

**Question:** Can the compiled evidence manifest truthfully describe the confidence, latency and
runtime-source requirements of every current derived projection, including nested `anyOf` paths?

**Rows:** [[D1390]], [[D1654]], [[D1700]], [[D1701]], [[D1702]]

**Date:** 2026-08-26

**Verdict:** No. The manifest's evidence identities and derivation graph are useful, but execution
metadata stops at the immediate producer. Eight shipped derived projections are declared
`local/sync` while requiring live Stockfish, ten bindings escape the provider-off check through
those local wrappers, and forty-nine current derivation members discard `reported` confidence.
Correcting the confidence graph requires four projection edits because the story chain propagates
the taint one step beyond the immediate failures. A path-preserving compiler extension closes all
three classes without splitting every provider-bearing derivation into a new producer. `[V]`

## Method

- Compiled the current `EVIDENCE_CONTRACT_DECLARATIONS` through the shipped
  `compileEvidenceManifest` and enumerated every literal `derivation.inputs` and `derivation.anyOf`
  member. `[V]` (`packages/runtime/src/evidence-catalog.ts`,
  `packages/runtime/src/evidence-contract.ts:compileEvidenceManifest`)
- Recursively expanded nested alternatives, retaining the exact chosen member at every derived
  node, the slowest latency mode and every non-local leaf source. `[V]`
- Joined the effective paths back to compiled bindings and consumer `providerOff` declarations.
  `[V]`
- Reproduced the missing confidence guard with a disposable `reported → exact` projection, then
  computed both immediate violations and the transitive repair fixed point. `[V]`
- Kept `dependsOn` and `derivation` separate. The archived F1 contract defines `dependsOn` as a
  semantic dependency graph and `derivation` as the literal payload inputs; breadth's disjunctive
  amendment permits mutually exclusive derivation members. Treating their union as one required
  execution conjunction would be false. `[V]` (`rfc/archive/evidence-contract-manifest.md` §4.3,
  `rfc/breadth-collectors.md` §1.2)

The disposable instrument is `tools/d1700-evidence-execution-harness/`. Its three tests include
exact current-catalogue assertions rather than only printing a report. `[V]`

## 1. Baseline graph

The current primary catalogue compiles to: `[V]`

| quantity | count |
|---|---:|
| producers | 37 |
| projections | 193 |
| projections with derivations | 46 |
| direct derivation members | 96 |
| fully expanded executable paths | 99 |

The 96→99 increase is real structure, not duplicate noise. A candidate-vector member can consume a
derived input which itself has alternatives: open-file occupancy has two members and role asymmetry
has three. An execution compiler that deduplicates paths merely because their current latency/source
profile is equal destroys the exact member identity needed for admission, confidence and future
availability checks. `[V]`

Four current projections have more than one expanded path: open-file occupancy (2), material role
asymmetry (3), candidate feature vector (50 after nested expansion), and attraction observed (2).
The held promotion outcome adds recorded-versus-live Syzygy, and bounded target policy adds further
provider alternatives; the multi-path shape is therefore growing deliberately. `[V]`

## 2. Producer scalars are false for eight shipped projections ([[D1700]])

`producer()` derives one latency from one availability value: provider means interactive,
build-time means offline, and every local/recorded producer otherwise becomes sync. Every derived
producer is currently local, so dependency cost disappears at the producer boundary. `[V]`

The full census finds these false advertisements: `[V]`

| projection | declared own operation | effective source profile |
|---|---|---|
| `derived.compare.engine_trajectory@1` | local / sync | interactive + Stockfish |
| `derived.compare.eval_delta@1` | local / sync | interactive + Stockfish |
| `derived.grade.move_quality@1` | local / sync | interactive + Stockfish + recorded engine point |
| `derived.opponent.candidate_feature_vector@1` | local / sync | 50 paths; Stockfish, with some recorded-run inputs |
| `derived.story.eval_shift@1` | local / sync | interactive + Stockfish |
| `derived.story.last_level@1` | local / sync | interactive + Stockfish + imported result |
| `derived.story.rank@1` | local / sync | interactive + Stockfish + recorded consequence/result |
| `derived.story.title@1` | local / sync | interactive + Stockfish + recorded consequence/result |

Changing those producer rows to provider/interactive is not a repair. Each producer also owns local
outputs, and the promotion/bounded-target additions intentionally place local and provider-bearing
outputs beside each other. Producer metadata describes the local function itself; effective
projection execution is the function plus the selected derivation path. `[V]`/`[M]`

## 3. Transitive provider work bypasses the fallback invariant ([[D1701]])

The compiler applies `EVIDENCE_PROVIDER_FALLBACK_MISSING` only when the adapter's immediate
producer has `availability === "provider"`. A derived projection's immediate producer is local, so
its transitive provider leaves are invisible to the check. `[V]`

Ten current bindings have this shape, across seven projections: `[V]`

- Compare trajectory and compare voice delta;
- Story voice eval-shift, last-level and title;
- Review story eval-shift, last-level, rank and title;
- Opponent selection's candidate feature vector.

Nine inherit a consumer-wide `providerOff: available`; opponent selection says unavailable. Those
values are not necessarily wrong as aggregate product behavior—a Review screen may remain
available while an engine-derived card is omitted—but the compiler cannot state or verify that
distinction. It currently proves neither that the item becomes honest-empty nor that the operation
blocks nor that an alternative recorded path is used. `[V]`

This is why copying the consumer scalar onto every derived adapter would also be insufficient.
Provider/source absence is a **binding-to-path** consequence, while whole-consumer availability is
an aggregate of many optional and required bindings. `[M]`

## 4. Reported confidence is discarded immediately and transitively ([[D1702]])

The shipped derivation guard checks grounding, exactness, answer distance and abstention, but never
checks `confidence`. A disposable derived projection over `live.stockfish.eval@1`
(`confidence: reported`) compiles with either `confidence: reported` or `confidence: exact`. `[V]`

The current catalogue contains 49 immediate violations of the minimal enforceable rule “if one
member input is reported, the output is reported”: `[V]`

- 47 candidate-vector alternatives;
- `derived.story.last_level@1`;
- `derived.story.rank@1`.

The repair is not only those three declarations. Once `story.rank` becomes reported,
`derived.story.title@1` also consumes reported evidence and must become reported. The transitive
fixed point is therefore four projection edits: candidate vector, story last-level, story rank and
story title. `[V]`

The current corpus does **not** establish a total order between `exact` and `not_applicable`.
Rules-derived facts commonly use not-applicable while exact opening/record positions use exact, and
no current member mixes only those two values. This pass therefore supports one minimal compiler
law, not a manufactured confidence algebra: `[V]`/`[M]`

```text
For every derivation member independently:
  if any input (after transitive correction) is reported,
  the output must be reported.
```

All-exact versus all-not-applicable behavior can remain as declared until a real mixed case earns a
second rule. Weakening `reported` to either other value is forbidden. `[M]`

## 5. Compile execution paths; do not add another hand-written field

The executable contract is derived from the graph already required by F1: `[M]`

```ts
interface CompiledProjectionExecution {
  projection: VersionedEvidenceId;
  own: {
    availability: AvailabilityMode;
    latency: LatencyMode;
  };
  paths: readonly {
    // Exact choices at this projection and every nested derived input.
    derivationChoices: readonly {
      projection: VersionedEvidenceId;
      inputs: readonly VersionedEvidenceId[];
    }[];
    // Non-local leaves, never inferred from the wrapper producer.
    sourceRequirements: readonly {
      projection: VersionedEvidenceId;
      availability: "recorded" | "provider" | "build_time";
    }[];
    effectiveLatency: LatencyMode;
  }[];
}
```

Rules: `[M]`

1. A non-derived projection has one path containing its own non-local source, if any.
2. A derived member starts with the producer's own operation and recursively takes the cartesian
   product of its literal input paths.
3. Path latency is the slowest member of the selected chain under
   `sync < interactive < background < offline`; source requirements are an exact unique set.
4. Equal source/latency profiles do not collapse distinct derivation choices.
5. `dependsOn` remains the semantic/migration graph. Only `derivation` declares payload execution;
   its alternatives must not be converted into a conjunction.
6. The compiled execution image and digest are generated by `compileEvidenceManifest`; authors do
   not copy it into projection declarations.

The producer scalar remains truthful as `own`. A `worstCaseLatency` convenience may be computed,
but it cannot replace paths: recorded-versus-live Syzygy has different runtime satisfiability at the
same output identity. `[M]`

## 6. Binding and capability repair

Every adapter whose selected projection has a provider-bearing path must enter the provider/source
fallback check, even when its immediate producer is local. The static binding needs a per-projection
unsatisfied-source outcome (omit this optional item, render honest empty, or make the operation
unavailable); the consumer's aggregate `providerOff` may then be compiled from its bindings rather
than used as a substitute for them. `[M]`

The compiler must also refuse a binding whose accepted latency mode cannot execute any admitted
path. Runtime `/capabilities` should join actual source availability to these static paths and
report which projection paths are satisfiable; it must not advertise a derived item merely because
the local wrapper function exists. `[M]`

This does not require the manifest to promise provider response time. Existing operation deadlines
and scheduler contracts turn timeout/cancellation into typed unavailability. Static latency states
the interaction class and prevents a sync surface from silently initiating provider work. `[M]`

## 7. Amendment and migration order

1. Amend F1 with the compiled execution image, reported-confidence guard and transitive
   provider-binding check. `[M]`
2. Add red fixtures for the current false shapes before correcting catalogue declarations. `[M]`
3. Correct the four confidence declarations and verify the fixed point is empty. `[M]`
4. Migrate the ten current transitive-provider bindings to explicit per-binding source absence
   behavior; preserve current visible bytes only where they are truthful. `[M]`
5. Expose path satisfiability through the existing capability compilation. `[M]`
6. Only then add Stockfish root-table, Maia policy-page and Syzygy position receipts, promotion
   recorded/live alternatives and bounded-target policy joins. `[M]`

The provider-exchange RFC owns provider identity, scheduling and operations. F1 owns the generic
graph semantics and compiler. Collector RFCs own only their literal projection rows. This keeps one
shared evidence spine for Support, Review, bots, drills and future player analysis. `[M]`

## Able-to-fail acceptance set

- `reported → exact` and `reported → not_applicable` derived fixtures fail;
- each `anyOf` member is checked independently;
- the story chain exposes title after upstream confidence is corrected;
- current manifest migration yields zero immediate and zero transitive confidence violations;
- all 96 direct members remain distinguishable and expand to the current 99 paths;
- the eight current false producer-scalar projections retain local own-operation metadata but
  compile interactive provider-bearing effective paths;
- a local derived wrapper around one provider input triggers the fallback check;
- a local-only sibling on the same producer remains sync and provider-free;
- recorded-versus-live Syzygy compiles two distinct satisfiable paths;
- a binding cannot claim sync while admitting only an interactive path;
- provider-off runtime capability suppresses only unsatisfied paths and never relabels missing
  evidence as refuted or available.

## Limits

- This pass measures static contract truth, not cold provider latency or deployment defaults. `[V]`
- It does not decide which Review/voice items should remain visible without Stockfish; that is the
  owning consumer RFC's product behavior, but the new binding field makes the decision explicit.
  `[M]`
- The fourteen `dependsOn`/derivation set differences are not automatically defects. Some are
  intentional semantic-impact edges and some are active RFC migration targets. The execution
  compiler must use the normative derivation graph and leave the semantic graph intact. `[V]`
- No production, schema, content or UI byte changed in this research pass. `[V]`
