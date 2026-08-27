# RFC: Recorded semantic path compiler

- **Status:** draft — amended 2026-08-27 for [[D1927]]/[[D1928]]/[[D1930]]–[[D1933]];
  awaits the [[D1921]]/[[D1929]] convention/value predecessor and repeat independent review
- **Author:** codex
- **Created:** 2026-08-27
- **Design refs:** `design/05-in-run-experience.md` §5 (detection is cheap; significance is not),
  §3b-i (the LLM is the voice, never the source); `design/03-product-breadth.md` Review and
  Intelligence/explanation surfaces
- **Exploration gate:** [[D1067]], [[D1068]] and [[D1710]]; source audit
  `planning/evidence-foundation-ux/d1067-path-compiler-audit.md`; execution census
  `design/research/producer-execution-closure.md`; module assembly census
  `design/research/module-evidence-assembly.md`. The research is complete and executable
  production reach is the measured gap, not an open feasibility question
- **Depends on:** implemented branch runtime; implemented evidence
  manifest, semantic event seal and eleven existing multi-edge projections; accepted
  `rfc/semantic-collectors.md` (the projection semantics, already implemented for this subset).
  Acceptance now also waits on the exact value/convention authority returned in
  `rfc/semantic-convention-provenance.md` ([[D1921]]/[[D1929]])
- **Parent / amends:** implements the recorded-run adapter left outside
  `rfc/semantic-collectors.md` §1.1 and consumed later by `rfc/module-registration.md`,
  `rfc/review-evidence-compiler.md` and `rfc/longitudinal-store.md`
- **Supersedes / superseded by:** —
- **Planning:** `planning/recorded-semantic-path/`

```tabiya-claims
none
```

The draft claims no versioned schema/register lane, evidence kind, producer id or persisted record.
It does add one F1 projection, `run.record.edge@1`, and v2 successors for the eleven recorded-path
semantic projections; those are compiled manifest members rather than registered schema resources.
Narrative `run.record.move@1` and every v1 semantic declaration remain byte-unchanged. The family
table remains private implementation data derived set-equal from one exact versioned manifest
inventory, not a second exported vocabulary. The public operation returns v2
`SemanticEvidenceEvent` identities and a non-persisted execution receipt.

## Summary

Eleven multi-edge semantic projections already have exact operand detectors and brand-sealed event
constructors. None has a production caller. Their only complete callers are tests, while
`localSemanticEvents(beforeFen, moveUci, afterFen)` is intentionally one-edge. A completed run can
therefore contain a deflection, overload, clearance, zwischenzug, trade sequence or pawn sequence
that the evidence manifest knows how to represent and every product consumer still receives
nothing.

This RFC adds one pure runtime compiler over one authoritative branch path. It replaces the
order-sensitive path resolver with a total graph-derived authority, derives canonical recorded
anchors from adjacent `Node`s, constructs one sealed `run.record.edge@1` authority per edge,
evaluates every declared contiguous window from the measured exact source closure, and returns v2
sealed events plus a complete typed window receipt. It does not select, rank, render, grade or
explain the events.

The same compiler serves Review and longitudinal observation. Learner-module admission remains in
`module-registration`; presentation remains pair-keyed in `evidence-presentation`. A Stockfish PV
is expressly not a recorded path and cannot call this compiler or mint its projection identities.

## Motivation

The gap has two independently measured halves:

1. All eleven path-family constructors stop at tests; zero reach a live application operation.
   `design/research/producer-execution-closure.md` classifies them as isolated sequence helpers.
2. The current 186-pair learner-module declaration accepts none of the seven observed-tactic
   projections. Even after this compiler exists, D1870 must add their consumer/presentation pairs.

Implementing only the module registry would produce honest-looking empty cards. Implementing only
the path compiler would produce another unused helper. Completion therefore requires both a
correct compiler and a witnessed production consumer; §8 permits the compiler to enter
`awaiting` while that dependent consumer is still landing, but not `implemented`.

## Scope

In scope:

- one exact branch-to-anchor projection over the existing `DrillRun`;
- all eleven currently registered multi-edge output families and their exact horizons;
- one exact recorded-edge source and v2 successors for those eleven outputs, leaving v1 untouched;
- exact construction of every declared derivation input;
- typed `emitted`, `no_witness`, `insufficient_continuation` and whole-path refusal receipts;
- deterministic ordering, deduplication and a stable in-process result digest;
- one server-owned operation reusable by Review and longitudinal compilation;
- an execution witness proving at least one real production consumer uses the emitted identity.

Out of scope:

- hypothetical engine-PV semantics or Guided Hint staging — `hint-distance`/D1068;
- deciding which event is important, good, bad or useful;
- module budgets, seats, components, presets or assistance ceilings;
- new tactic definitions or changes to the eleven projection semantics;
- persistence or a run-schema change;
- LLM input or prose.

## Specification

### 1. Authoritative input and result

The runtime export is:

```ts
type RecordedPathRefusalReason =
  | "unknown_branch"
  | "duplicate_branch"
  | "duplicate_node_id"
  | "missing_root"
  | "missing_fork"
  | "missing_parent"
  | "parent_cycle"
  | "multiple_branch_tips"
  | "off_chain_branch_node"
  | "broken_fen_boundary"
  | "illegal_recorded_move"
  | "noncanonical_recorded_move"
  | "noncanonical_recorded_san"
  | "broken_ply";

type RecordedPathWindowReceipt = Readonly<{
  projection: VersionedEvidenceId;
  startNodeId: string;
  endNodeId: string | null;
  horizon: 2 | 3 | 4 | 5;
  status: "emitted" | "no_witness" | "insufficient_continuation";
  eventIds: readonly string[];
}>;

type RecordedSemanticPathResult =
  | Readonly<{
      kind: "available";
      branchId: string;
      branchOrigin: "played" | "simulated";
      pathNodeIds: readonly string[];
      events: readonly SemanticEvidenceEvent[];
      windows: readonly RecordedPathWindowReceipt[];
      digest: string;
    }>
  | Readonly<{
      kind: "refused";
      branchId: string;
      reason: RecordedPathRefusalReason;
      atNodeId?: string;
      detail: string;
    }>;

recordedSemanticPath(run: DrillRun, branchId: string): RecordedSemanticPathResult;
```

The receipt uses the compiled v2 projection identity rather than adding a second family vocabulary.
It cannot be used for consumer admission by itself; consumers still compile against the manifest.

The caller supplies only `run` and `branchId`. It may not supply nodes, FENs, UCI strings, event
payloads or evidence. The repaired `branchPath(run, branchId)` is the sole path authority and
`branchPaths` delegates to it. Ancestral nodes before a fork may carry an ancestor branch id; that
is valid. “One branch” means one parent-linked path resolved from the requested branch head, not
that every ancestral `Node.branchId` is byte-equal.

### 2. Path validation and anchor construction

Before any detector runs, `branchPath` validates the complete graph authority:

1. Exactly one branch has the requested id; every branch and node id is non-empty and unique.
2. Exactly one node has `parentId: null`, exactly one `run.started` event exists, and its root id is
   that node.
3. The requested branch's fork node exists. Every node whose actual `branchId` is the requested id,
   excluding the fork when inherited, reaches that fork through present parents without a cycle.
4. Those same-branch nodes have exactly one graph tip (or the fork is the tip for an empty branch).
   Walking tip-to-root includes the declared fork and every same-branch node; multiple tips and
   off-chain same-branch nodes refuse rather than selecting by array order.
5. Every adjacent pair has the declared parent relation, increments ply by one and carries a
   non-null UCI/SAN on the child. Legal replay from the parent's canonical FEN reproduces canonical
   UCI, canonical SAN and the child's canonical FEN exactly.

Any failure returns one whole-path `refused` result before detector invocation. A corrupted path is
not partially interpreted. The compiler never repairs FEN, UCI, parent or ply bytes.

For every valid adjacent pair it constructs exactly one frozen `RecordedMoveAnchor`:

```ts
{
  beforeNodeId: parent.id,
  afterNodeId: child.id,
  beforeFen: parent.fen,
  moveUci: child.moveUci,
  afterFen: child.fen
}
```

It also constructs one sealed exact source through an adapter that accepts the validated run and
actual adjacent nodes—never caller-authored payload bytes:

```ts
interface RecordedEdge {
  readonly runId: string;
  readonly edgeBranchId: string;
  readonly beforeNodeId: string;
  readonly afterNodeId: string;
  readonly beforeFen: string;
  readonly afterFen: string;
  readonly moveUci: string;
  readonly moveSan: string;
  readonly ply: number;
}

declareRecordedEdgeEvidence(run: DrillRun, parent: Node, child: Node):
  DeclaredEvidence<RecordedEdge>; // run.record.edge@1
```

`edgeBranchId` is the child's actual recorded branch. The requested branch and branch-relative
offset belong to the path result/window receipt; putting them in the edge would give shared
ancestral moves different identities across descendant paths ([[D1932]]). The projection is
`recorded_run`/`exact`, accepts `fact | move`, permits only `list | panel | machine_condition`, is
inspector-only and has no ordinary sentence renderer.

### 3. Closed evaluated population

The compiler's private declaration table is set-equal to these v2 successor projections and
horizons:

| receipt family | projection | horizons | operand detector / sealed constructor |
|---|---|---|---|
| trade completed | `derived.exchange.trade_completed@2` | 2 | consecutive capture events / v2 `tradeCompletedSemanticEvent` |
| pawn contact timing | `derived.pawn.sequence.contact_timing@2` | 2, 3 | `pawnContactTimingSequence` / v2 `pawnContactTimingSemanticEvent` |
| harassment pressure | `derived.pawn.sequence.harassment_pressure@2` | 2 | `harassmentPressureSequence` / v2 `harassmentPressureSemanticEvent` |
| defender consequence | `derived.tactic.sequence.defender_consequence@2` | 3 | `defenderConsequenceOperands` / v2 `defenderConsequenceSemanticEvent` |
| deflection | `derived.tactic.deflection_observed@2` | 3 | `deflectionObservedOperands` / v2 `deflectionObservedSemanticEvent` |
| attraction | `derived.tactic.attraction_observed@2` | 3, 5 | `attractionObservedOperands` / v2 `attractionObservedSemanticEvent` |
| line clearance | `derived.tactic.line_blocker_clearance_observed@2` | 3 | `lineBlockerClearanceObservedOperands` / v2 `lineBlockerClearanceSemanticEvent` |
| square clearance | `derived.tactic.square_clearance_observed@2` | 3 | `squareClearanceObservedOperands` / v2 `squareClearanceSemanticEvent` |
| interference | `derived.tactic.interference_observed@2` | 3 | `interferenceObservedOperands` / v2 `interferenceSemanticEvent` |
| checking zwischenzug | `derived.tactic.check_zwischenzug_observed@2` | 4 | `checkZwischenzugObservedOperands` / v2 `checkZwischenzugSemanticEvent` |
| overload exploitation | `derived.tactic.overload_exploitation_observed@2` | 3 | `overloadExploitationObservedOperands` / v2 `overloadExploitationSemanticEvent` |

There are eleven projection ids and thirteen `(family, horizon)` evaluator rows. The counts are
derived drift diagnostics. Every v2 declaration retains the v1 operands/convention meaning but
derives from exact `run.record.edge@1`; v1 declarations remain unchanged and receive no production
caller. Acceptance asserts set equality against the manifest's exact v2 population; no public
second list is maintained.

The catalogue's current `SEMANTIC_EVENT_PROJECTION_IDS: string[]` authority is replaced, not
extended, because it collapses coexisting versions ([[D1933]]):

```ts
const SEMANTIC_EVENT_PROJECTION_REFS: readonly VersionedEvidenceId[]; // one literal exact authority
const SEMANTIC_EVENT_FAMILY_IDS: readonly string[]; // derived unique base ids; analysis only
```

Projection declarations, semantic declarations, manifest checks, execution censuses and every
production consumer use exact ref keys from `SEMANTIC_EVENT_PROJECTION_REFS`. The old
`SEMANTIC_EVENT_PROJECTION_IDS` export is removed so callers must choose exact-version closure or
the explicitly lossy family view. Longitudinal/skills registries that claim complete event ingest
use refs; display/taxonomy code may use family ids only after stating how versions collapse.
The current private `projection(...)` catalogue helper hard-codes version 1; it gains an explicit
version argument (or a separately named versioned helper), and an omission fixture proves a v2 row
cannot silently compile as v1.

For each edge start and each row, the compiler emits exactly one receipt:

- fewer remaining edges than the horizon → `insufficient_continuation`, `endNodeId: null`;
- a complete valid window with zero matching operands → `no_witness`;
- one or more sealed events → `emitted` with their exact sorted ids.

No-witness is an evaluated negative for that declared convention, not an abstention from running.
Insufficient continuation is not a negative. Neither creates an evidence item.

### 4. Shared input construction; no detector recomputation per family

The compiler prepares each valid edge once, using D1931's measured exact-source shape:

- the canonical anchor and sealed `run.record.edge@1` source;
- exactly one `transitionSemanticEvents` call and one direct checked `checkEvent` declaration;
- an index of exact transition-capture and check events by edge;
- legal-exchange evidence only for the exact captures requested by a matched operand;
- defender-duty evidence once per distinct window-start FEN.

Each sealed constructor receives exactly the inputs its manifest derivation declares. It never
rebuilds a capture/check event under another projection and never passes raw payload objects where
a sealed `DeclaredEvidence` is required. Duplicate input projection ids may appear as multiple
observations but the derivation membership checker continues to compare the declared projection
set; event payloads retain exact individual participants.

Full `localSemanticEvents` fan-out is forbidden: it failed the 500 ms boundary at 40/80 plies while
the byte-identical exact source closure passed all arms at 64.7/129.7/212.7 ms p95. Defender-duty
readings are memoized within one compile call only. No process-global cache is introduced. The
result is deterministic from the run bytes and exact manifest/convention closure.

### 5. Event ordering, identity and digest

Events order by:

1. ending node ply;
2. starting node ply;
3. projection id;
4. existing semantic event id.

An identical event found by overlapping evaluator rows is retained once by its existing event id;
every relevant window receipt may reference that id. The compiler does not invent a second
identity or merge different projections with equal operands.

The result digest is the evidence contract's canonical digest over:

```ts
{
  operation: "recorded-semantic-path@1",
  manifestDigest,
  semanticConventionRegistryDigest,
  sourceClosureDigest,
  runId: run.id,
  branchId,
  branchOrigin,
  pathNodeIds,
  eventIds,
  windows
}
```

`sourceClosureDigest` covers the ordered exact-edge receipts and every emitted event's compiler-owned
value/convention receipt supplied by the [[D1921]]/[[D1929]] predecessor. The operation string is a
digest discriminator, not a shared resource version. A future semantic change moves the underlying
projection/convention version; the same operation cannot launder it.

### 6. Source boundary and refusal of hypothetical paths

This operation accepts `DrillRun` only. `live.stockfish.pv@1`, an arbitrary PGN move array and a
caller-built `RecordedMoveAnchor[]` are not valid inputs. The public export exposes no overload
that accepts them.

Guided Hint may reuse pure operand arithmetic in a separate compiler, but its evidence must derive
from the exact versioned provider receipt and use separately registered hypothetical projection
ids. Passing PV evidence cannot satisfy `run.record.edge@1` or any v2 recorded constructor.
Byte-equal chess moves do not make source identities interchangeable.

### 7. Server operation and downstream consumption

`apps/server/src/recorded-semantic-path.ts` owns one injected operation:

```ts
compileRecordedSemanticPath(input: {
  principal: Principal;
  runId: string;
  branchId: string;
}): Promise<RecordedSemanticPathResult>
```

It authenticates read authority, loads the run, and delegates unchanged to the runtime compiler.
There is no public raw-evidence REST response in this RFC. The operation is injected into Review
and longitudinal builders so both consume the same event identity for the same run/branch.

`module-registration` imports the emitted projection closure only through its compiled F1
consumer bindings and adds D1870's module acceptance/presentation pairs. It must not call operand
detectors directly. `evidence-presentation` renders only after that pair admission.

The compiler code may land before those downstream RFCs, but this RFC then enters `awaiting` on
D1870/D1710. It reaches `implemented` only when an actual Review, module or longitudinal
application operation consumes at least one sealed emitted item and an execution-deletion fixture
proves the call is load-bearing. Registering the server function, exporting it, or calling it only
from a test is not completion.

### 8. Instrumentation and cost

`make recorded-semantic-path-check` runs:

- the exact positive/hard-negative fixtures for all eleven projections;
- every committed branch of the current corpus and fixed imported sample;
- a receipt census by family/status/horizon and source population;
- runtime measurements for path validation, one-edge preparation and window evaluation separately.

The pinned performance tier records p50/p95/max and enforces total p95 at or below 500 ms for each
fixed 20/40/80-ply arm. The first implementation reproduces the preregistered exact-source result on
Node 24/release bytes. Generic software CI asserts deterministic source-call/receipt counts and
byte parity against an eager oracle, not wall time. Corpus additions are reported separately and
do not silently move the fixed performance population.

The checker must report honest zeroes for rare families. A zero corpus count does not replace the
canonical positive fixture and never weakens the detector.

### 9. Law-8 boundary

The operation reports observed relations only. It emits none of:

- good/bad, mistake/blunder or significance;
- intent, purpose or causality;
- forcedness (including a claim that a recapture was forced);
- recommendation, candidate rank or principal variation;
- prose.

Selection and module reduction may decide whether a fact is shown under their accepted contracts.
An LLM may later render an admitted sealed component, but cannot call this compiler, choose a
family, create an event or reinterpret `no_witness`.

## Production sites

The implementation is bounded to:

| site | responsibility |
|---|---|
| `packages/runtime/src/branch-path.ts` | total graph-derived `branchPath`; `branchPaths` delegates to it |
| `packages/runtime/src/recorded-semantic-path.ts` (new) | path validation, anchor/evidence construction, evaluator table, receipts, ordering and digest |
| `packages/runtime/src/evidence-catalog.ts`, `evidence-source-adapters.ts`, `semantic-evidence.ts` | exact ref inventory, edge projection/adapter and eleven v2 semantic successors; v1 unchanged |
| `packages/runtime/src/index.ts` | operation/result type exports |
| `apps/server/src/recorded-semantic-path.ts` (new) | authenticated run-loading operation |
| first downstream Review/module/longitudinal site | load-bearing consumer call; may land later while this RFC is `awaiting` |
| `docs/semantic-evidence.md` | canonical implemented behavior and limits |
| `Makefile`, harness/tests | checker and executable closure |

Changes to detector/convention meaning, schemas, storage or Svelte components are outside this RFC
and require their owning RFCs. The exact F1 projection and v2 provenance migration above are the
only evidence-catalogue changes in scope.

## Acceptance criteria

1. `recordedSemanticPath` accepts only a run and branch id, obtains its path through the total
   `branchPath`, and exposes no caller-anchor/PV overload. Reordering `run.nodes` changes no path.
2. Duplicate branch/node, missing root/fork/parent, cycle, multiple-tip and off-chain-node fixtures
   return their exact refusal before detector invocation. `branchPaths` shares the same resolver.
3. Parent, ply, legal/canonical UCI, canonical SAN and exact child-FEN failures refuse; the exact
   edge adapter accepts run/nodes rather than caller payload and shared ancestry has one identity.
4. The private table is set-equal to eleven v2 projection ids and thirteen exact
   family/horizon rows. Removing or adding a row fails.
   `SEMANTIC_EVENT_PROJECTION_REFS` is set-equal to exact manifest event refs; an `@1`/`@2`
   crossed fixture fails even when base ids match, and no production/governance import of the old
   unversioned inventory remains.
5. Every path start has exactly one receipt per evaluator row: emitted, evaluated no-witness or
   insufficient continuation. A compiler returning only positive events fails receipt coverage.
6. Canonical positives emit all eleven v2 projections. Existing hard negatives remain empty with
   `no_witness`; broken-boundary cases refuse rather than becoming no-witness.
7. Every emitted event passes `assertSemanticEvidenceEvent`; exact source receipts match event
   anchors value-for-value. Wrong run, actual branch, node, FEN, UCI, SAN, order or multiplicity and
   PV-as-recorded negatives fail. V1 declarations/constructors remain byte-unchanged and unused.
8. One transition compile and one check probe occur per edge; full local fan-out is zero. Defender
   duty computes at most once per distinct start FEN and receipts equal `plies × 13`.
9. Event and receipt ordering is byte-stable; an overlapping duplicate id is emitted once without
   collapsing different projections.
10. An ancestral fork path compiles correctly even when ancestral `Node.branchId` values differ;
    two descendant paths share byte-equal exact-edge receipts for common ancestry.
11. Review and longitudinal fixtures over the same run/branch receive byte-equal event ids and
    digest. Neither recomputes a semantic event under a new identity.
12. The server operation enforces read authority and returns no public raw-evidence route.
13. A production-consumer witness fails when the consumer call is deleted while compiler unit
    tests and manifest rows remain. Until this is green, status is `awaiting`, never `implemented`.
14. `live.stockfish.pv@1` cannot enter the operation or satisfy `run.record.edge@1`; the distinct
    hypothetical-horizon dependency remains open.
15. Result identity changes when any exact edge/value/convention receipt changes and retains the
    exact convention registry digest; projection-set-only substitutions fail.
16. `make recorded-semantic-path-check`, runtime typecheck, server typecheck, `make verify` and the
    relevant Review/module browser tests pass in the implementation commit.
17. Deterministic CI proves exact/eager byte parity and source-call counts. Pinned Node-24/release
    performance keeps total p95 ≤500 ms at 20/40/80 plies independently of corpus growth.
18. `docs/semantic-evidence.md`, `design/BACKLOG.md` and `planning/exploration/log.md` closeout land
    with the implementation; no detector/presentation claim is silently broadened.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | [[D1067]] recorded-run path compiler and real production caller | `recorded-semantic-path` | implementation plus criterion-13 consumer witness | |
| D2 | [[D1710]] execution disposition for the eleven isolated sequence projections changes from helper-only to live only when criterion 13 passes | `recorded-semantic-path` | set-equal execution receipt plus consumer witness | |
| D3 | [[D1870]] adds exact learner-module consumer pairs for the observed semantic tactics | `module-registration` | accepted pair declarations plus implementation commit | |
| D4 | [[D1870]] adds exact pair-keyed presentation for the observed semantic tactics | `evidence-presentation` | accepted component declarations plus implementation commit | |
| D5 | Review consumes the shared recorded event identity | `review-evidence-compiler` | Review consumer fixture over one run | |
| D6 | Longitudinal compilation consumes the same recorded event identity | `longitudinal-store` | longitudinal consumer fixture over the Review control run | |
| D7 | Hypothetical PV semantics remain separately typed and cannot use recorded projections | `hint-distance` ([[D1068]]) | accepted hypothetical-horizon projections and negative source fixture | |

## Deviations from design

None. This is the missing mechanical producer-execution join underneath the already ruled module,
Review and longitudinal surfaces. It adds no product surface or chess judgement.

## Open questions

No owner product choice is open. Product selection, presentation and hint disclosure decisions
remain in their owning RFCs. The author must still resolve the buildability questions below; the
implemented run/evidence contracts do not currently supply the exact authorities the first draft
assumed.

## Independent-review routing

| finding | blocker | repair owner |
|---|---|---|
| [[D1927]] | `branchPath` truncates missing ancestry, trusts node-array order and has no cycle guard | **candidate green and amended:** total graph authority; repeat review required |
| [[D1928]] | `run.record.move@1` is a loose narrative payload, not the claimed exact edge receipt | **candidate green and amended:** new `run.record.edge@1` plus eleven v2 successors; repeat review required |
| [[D1921]] | event seals accept unrelated move-evidence values and retain the same id | semantic-convention/value-level derivation predecessor |
| [[D1929]] | result identity claims convention heads but digests no convention receipt | semantic-convention predecessor + author amendment |
| [[D1930]] | relative co-editable benchmark has no absolute consumer budget or deterministic CI split | **measured and amended:** absolute 500 ms pinned-performance gate; deterministic generic-CI parity/counts |
| [[D1931]] | eager full `localSemanticEvents` preparation dominates and fails the 40/80-ply synchronous envelope | **measured and amended:** exact source closure is byte-identical and passes all three arms |
| [[D1932]] | requested-branch identity duplicates a shared ancestral edge | **measured and amended:** actual edge branch stays in `run.record.edge@1`; requested branch stays in path/window receipt |
| [[D1933]] | unversioned semantic inventory cannot police coexisting v1/v2 projections | **measured and amended:** exact ref authority; separately named derived family view |

## Changelog

- 2026-08-27: authority amendment after D1927/D1928/D1932 candidate. `branchPath` becomes a total
  graph resolver; `run.record.edge@1` is path-independent; the eleven outputs move to v2 rather
  than rewriting their v1 provenance. D1933 replaces the base-id inventory with exact versioned
  refs. Dossier: `design/research/recorded-path-authority.md`.
- 2026-08-27: D1931 resolves execution shape without weakening semantics. One transition compile
  and one direct check declaration per edge preserve every event id, receipt and result digest;
  total p95 is 64.7/129.7/212.7 ms at 20/40/80 plies. Eager full local fan-out remains refused.
- 2026-08-27: D1930 measured the first-draft execution shape. Total p95 is
  399.7/826.3/1,434.0 ms at 20/40/80 plies against 500 ms; preparation is ~88% of total and
  produces [[D1931]]. Dossier: `design/research/recorded-semantic-path-cost.md`.
- 2026-08-27: independent review returned the draft on [[D1927]]–[[D1930]] plus inherited
  [[D1921]]. Exact return:
  `planning/recorded-semantic-path/independent-buildability-review-2026-08-27.md`.
- 2026-08-27: first draft from the D1067/D1068 source audit, D1710 execution census and D1865
  module-assembly census.
