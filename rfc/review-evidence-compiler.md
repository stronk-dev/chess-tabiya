# RFC: Review evidence compiler

- **Status:** draft — **RETURNED BY FOURTH FRESH INDEPENDENT REVIEW 2026-09-07 on
  [[D3109]]–[[D3115]].** The third repair's local seals and set checks survive, but the executable
  model authorizes caller-described prefixes, invents nine generic adapters, admits arbitrary
  evidence digests and then discards them, emits count-only node packets, drops completion and
  required Story fields, hashes with a lossy private serializer and leaves the attempt lifecycle
  unimplemented. `make review-evidence-fourth-fresh-review` retains the chain and reproduces 7/7.
  No production implementation is authorised before a bounded fourth author repair, another fresh
  review and the declared dependencies land.
- **Author:** codex, on the D717 evidence-foundation routing and the completed Wave-C C4 research
- **Created:** 2026-08-23
- **Design refs:** `design/03-product-breadth.md` Review/Analyze surfaces;
  `design/05-in-run-experience.md` (validated evidence and assistance ceilings)
- **Exploration gate:** complete in `design/research/basic-semantic-tactics-stage-0.md` §§12, 15
  and `tools/d872-semantic-tactics-harness/` C4; the fixed population contains 658 transitions
  across eight imported games
- **Depends on:** implemented F1 evidence manifest; draft
  `rfc/provider-exchange-and-execution.md` including [[D1969]]'s WDL-bearing
  `live.stockfish.position_eval@1`; draft `rfc/recorded-semantic-path.md` for
  `run.record.edge@1`; the implemented `rules.tactic.consequence.forced_mate_after_move@1` plus the
  v2 exact-occurrence projection specified here; the D921 learner-module/Wave-C amendment for
  literal Review input eligibility before acceptance; draft `rfc/shared-candidate-evidence-packet.md`
  §8.3 for the one position-evaluation authority; and draft `rfc/evidence-presentation.md`
  checkpoint A for `PresentedEvidenceItem`, `PresentationReceipt`, its serializers/parsers and
  exact component ownership. This RFC cannot be accepted or implemented before those draft
  contracts are accepted and their named operations land
- **Parent / amends:** replaces Story's untyped engine scalar and supplies
  `rfc/semantic-collectors.md` Discharge D2; it does not choose the final Review Map module policy
- **Supersedes / superseded by:** —
- **Planning:** `planning/review-evidence-compiler/` once accepted/implementing

```tabiya-claims
none
```

**Why `none`.** This RFC adds evidence projections, a local packet compiler and additive runtime
payload provenance. It changes no pack, run, shape-entry or principle schema, no database table and
no evidence-kind member. Existing durable evidence rows remain bytes as written; adapters abstain
when legacy rows lack operands needed for a truthful projection.

## Summary

Replace Review's one lossy number with a typed, partial evidence packet.

Today `story.ts:evaluation` maps every mate score to ±1000 cp, clips real cp to the same range and
then applies a 150-cp pivot. The same post-game path requests only Stockfish eval even though the
platform has independent WDL, tablebase, human-model, Explorer, opening and semantic producers.
The result is both narrow and dishonest: mate distance disappears, cp↔mate transitions become fake
scalar swings, raw WDL alternates perspective, and every missing source is indistinguishable from
“nothing interesting happened.”

This RFC consumes one shared source, lands five Review projections plus one exact proof-version
successor, and lands one packet compiler:

1. `live.stockfish.position_eval@1` — the shared node-free typed `centipawns | mate` source over an
   exact canonical FEN, engine identity and one search bound;
2. `derived.review.eval_point@1` — binds that source to an exact `run.record.position@1` item rather
   than placing a run node on the source;
3. `derived.review.eval_delta@1` — cp→cp only, with both points retained;
4. `derived.review.mate_transition@1` — mate appearance, disappearance or mate→mate distance/side
   change, never a cp conversion;
5. `derived.review.wdl_white@1` — the shared delivery's raw side-to-move WDL normalized once to
   White while literally retaining that delivery;
6. `derived.review.wdl_point@1` — binds the reusable normalization to an exact
   `run.record.position@1` occurrence by canonical FEN;
7. `compileReviewEvidence` — joins independently available declared evidence by exact run/node/move
   identity and records a typed state for every source family.

The packet is not a ranking and not prose. It gives later Review modules enough grounded material
to make a useful card without dumping every producer or silently requiring every provider.

## 1. Source corrections

### 1.1 Engine identity and search bound

Review does not repair engine identity inside `StockfishEvidenceExecutor` and does not construct a
second queue. `provider-exchange-and-execution` owns the single
`StockfishPositionEvaluationOperation`, its exact pending request, same-serialized-exchange actual
identity/generation and `ProviderEvidenceDelivery<FixedBoundPositionEvaluation>`. Review admits
that sealed delivery or abstains; a health snapshot, configured id or constructor-captured identity
is never copied onto later bytes ([[D1020]], [[D1647]]).

The shared result already carries the complete actual engine identity and one reached search bound:

```ts
interface ReviewEngineIdentity {
  readonly id: string;
  readonly name: string;
  readonly version: string;
}

type ReviewSearchBound =
  | { readonly kind: "movetime"; readonly requestedMs: number; readonly reachedDepth: number | null }
  | { readonly kind: "depth"; readonly requestedDepth: number; readonly reachedDepth: number | null }
  | { readonly kind: "nodes"; readonly requestedNodes: number; readonly reachedDepth: number | null };
```

An engine id is not a version. Empty name/version, an acquisition whose requested/actual identities
or generation fail provider admission, a payload carrying multiple requested bounds, or a payload
carrying none is refused by the shared operation before F1 declaration. Existing attached eval/WDL
rows without a `ProviderEvidenceDelivery` remain readable as raw inspector evidence but abstain
from every projection in this RFC with `legacy_provenance_missing`; Review never relabels them with
the currently running engine.

`provider-exchange-and-execution` replaces `declareStockfishEvalEvidence` as the authority for this
path ([[D1021]]). Its exact filtered `live.stockfish.position_eval@1` payload is the complete sealed
delivery containing only typed score, raw WDL, exact canonical request FEN and provider provenance;
`bestMoveUci`, PV and MultiPV bytes are not members of `FixedBoundPositionEvaluation` and cannot
cross its adapter. The source has no run or node identity. Review's
`derived.review.eval_point@1` joins it to `run.record.position@1` only after exact FEN equality.
This repairs the existing manifest limitation for every consumer, not only Story, without making a
hypothetical candidate pretend to be a recorded run node ([[D1576]]).

### 1.2 WDL perspective

UCI WDL is relative to the side to move at the requested FEN. [[D1969]] makes the shared
`FixedBoundPositionEvaluation.rawWdl` retain that tuple and literal `side_to_move` subject from the
same completed info line as the typed score. Review adds no live source. It derives one reusable,
node-free normalization from the admitted delivery:

```ts
interface WhiteWdlPoint {
  readonly projectionId: "derived.review.wdl_white@1";
  readonly source: DeclaredEvidence<ProviderEvidenceDelivery<FixedBoundPositionEvaluation>>;
  readonly fen: string;
  readonly rawSubject: "white" | "black";
  readonly perspective: "white";
  readonly win: number;
  readonly draw: number;
  readonly loss: number;
}

interface ReviewWdlPoint {
  readonly projectionId: "derived.review.wdl_point@1";
  readonly position: DeclaredEvidence<RecordedPosition>; // run.record.position@1
  readonly normalized: DeclaredEvidence<WhiteWdlPoint>;
}
```

Neither projection is durable. `wdl_white` retains the complete provider delivery literally,
derives `rawSubject` from the exact canonical request FEN, and has no run/node field.
`wdl_point` separately exact-FEN joins that normalization to `run.record.position@1` and retains
both inputs. The same delivery and FEN joined to two recorded occurrences therefore creates one
normalization and two node points; changing a node cannot change the engine measurement identity.
Legacy attached `live.stockfish.wdl@1` remains inspector-readable but is not an input here.

For White to move, output equals raw `{win, draw, loss}`. For Black to move, output swaps win/loss
and retains draw. All values are safe integers in `[0,1000]` and must sum to 1000; otherwise the
provider operation has already refused `invalid_response`. `derived.review.wdl_white@1` is
`bounded_search/measured/reported`; `derived.review.wdl_point@1` is
`declared_convention/measured/reported`. Both answer only `evaluation`, retain exact inputs and
abstain `input_abstained`; the occurrence additionally abstains `position_mismatch`.

No WDL delta or grade lands here. A graph may plot the three normalized values; a later source-local
selector must declare any subtraction or threshold as its own projection.

## 2. Shared position evaluation and Review node point

```ts
type ReviewEngineScore = FixedBoundPositionEvaluation["score"];
type StockfishPositionEvaluation =
  ProviderEvidenceDelivery<FixedBoundPositionEvaluation>;

interface ReviewEnginePoint {
  readonly projectionId: "derived.review.eval_point@1";
  readonly position: DeclaredEvidence<RecordedPosition>; // run.record.position@1
  readonly evaluation: DeclaredEvidence<StockfishPositionEvaluation>; // live.stockfish.position_eval@1
}
```

The shared provider operation already normalizes `centipawns` and signed `mateIn` to White, makes
the perspective explicit, converts signed mate to `{side, distance: abs(mateIn), unit: "moves"}`
and rejects zero mate distance. Its admitted delivery retains exact canonical request FEN,
`positionKey`, engine identity, bound and same-exchange receipt. `live.stockfish.position_eval@1`
belongs to `live.stockfish`, uses
grounding `bounded_search`, exactness `measured`, answer content `evaluation`, forms `list | panel`,
and abstention reasons `provider_unavailable | deadline_exceeded | queue_full | cancelled |
invalid_response | identity_mismatch | legacy_provenance_missing`.

`derived.review.eval_point@1` consumes one sealed provider delivery and one
`run.record.position@1`. It emits only when their canonical six-field FEN is byte-identical, retains
both sealed inputs literally, and takes its node identity only from the recorded position. Its
grounding is `declared_convention`, exactness `measured`, confidence `reported`, answer content
`evaluation`, and forms `list | panel | machine_condition`. A FEN mismatch abstains
`position_mismatch`; a missing source or recorded position abstains `input_abstained`. A
`transposeKey` match is not enough: clocks are part of the source measurement identity even when
the board occupancy transposes.

The payload contains neither best move nor principal variation. Cp is never clamped. Mate is never
assigned a cp sentinel. The point cannot widen the provider delivery's measured/reported status by
joining it to an exact recorded position.

## 3. Derived transitions

Both transition projections consume two `derived.review.eval_point@1` items. They are general
typed comparisons, not claims that the points are adjacent; `compileReviewEvidence` chooses
adjacent same-branch pairs by the recorded path. The nested deliveries must use the same actual
engine `{id,version}`, generation, normalized command digest and identical requested/reached bound.
A mismatch abstains rather than subtracting measurements with different operands.

### 3.1 Cp delta

```ts
interface ReviewEvalDelta {
  readonly projectionId: "derived.review.eval_delta@1";
  readonly before: ReviewEnginePoint;
  readonly after: ReviewEnginePoint;
  readonly deltaCp: number;
}
```

Both nested `evaluation.payload.score` values must be `centipawns`; then
`deltaCp = after.evaluation.payload.score.value - before.evaluation.payload.score.value` in White
perspective. The projection is `declared_convention`, exactness `measured`, confidence `reported`,
answer content `evaluation`,
forms `sentence | list | panel`, and
abstains `missing_endpoint | mate_operand | engine_mismatch | bound_mismatch | input_abstained`.
It says only that one recorded measurement changed. It is not a grade, blunder label, pivotality
claim or recommendation.

### 3.2 Mate transition

```ts
type MateTransitionKind = "appeared" | "disappeared" | "side_changed" | "distance_changed";

interface ReviewMateTransition {
  readonly projectionId: "derived.review.mate_transition@1";
  readonly before: ReviewEnginePoint;
  readonly after: ReviewEnginePoint;
  readonly changes: readonly [MateTransitionKind, ...MateTransitionKind[]];
}
```

The projection is `declared_convention/measured/reported`. It exists only when at least one endpoint
is mate and the typed state changes. Cp→mate
is `appeared`; mate→cp is `disappeared`; mate→mate may carry both `side_changed` and
`distance_changed`, sorted in the enum order above. Equal mate side/distance abstains
`no_mate_transition`; cp→cp abstains `no_mate_operand`. It retains both points and never computes
magnitude across the type boundary.

The v1 proof is not linkable to a recorded occurrence: its declared operands omit the exact
position endpoints even though its runtime object happens to carry them ([[D1645]]). This RFC adds
`rules.tactic.consequence.forced_mate_after_move@2` beside byte-unchanged v1. The v2 declaration and
its exact adapter admit precisely:

```ts
interface ForcedMateAfterMoveProofV2 extends ForcedMateAfterMoveProof {
  readonly beforeFen: string;
  readonly afterFen: string;
}
```

Its literal operands are
`beforeFen | candidate | afterFen | attacker | maxAttackerMoves | proofStatus | proofDigest |
rootReplies | nodes`. The same mate-proof computation constructs v1 and v2 through separate exact
adapters; Review accepts only v2. This is a compiled F1 projection version, not a persisted run
payload or schema claim.

The packet links a proved v2 item only to a sealed `run.record.edge@1` whose canonical
`beforeFen`, `moveUci` and `afterFen` are byte-identical to the proof's endpoints and candidate.
`attacker` and `proofDigest` remain retained proof identity but are never pretended to exist on the
recorded edge. A proof from a repeated or identical-looking position therefore cannot attach to the
wrong occurrence. Engine agreement never upgrades bounded search to rules proof; both remain
separately declared evidence items. A missing, v1-only, refuted, budget-exhausted,
horizon-ineligible or endpoint-mismatched proof leaves the engine transition unchanged and
unlinked.

## 4. Partial post-game packet

```ts
type ReviewSourceFamily =
  | "engine_eval" | "engine_wdl" | "tablebase" | "semantic"
  | "opening" | "human_model" | "human_corpus" | "authored" | "recorded";

type ReviewNodeFamilyState =
  | { readonly kind: "available"; readonly itemCount: number }
  | { readonly kind: "honest_empty"; readonly reason: "no_observation" | "outside_domain" }
  | { readonly kind: "not_requested" }
  | { readonly kind: "not_yet_scheduled" }
  | { readonly kind: "pending"; readonly jobCount: number; readonly retrying: number }
  | { readonly kind: "unavailable"; readonly reason:
      "provider_off" | "provider_failed" | "retry_exhausted" |
      "legacy_provenance_missing" | "input_abstained" |
      "attempt_history_capacity" };

interface ReviewRunFamilyState {
  readonly nodeCount: number;
  readonly availableNodeCount: number;
  readonly itemCount: number;
  readonly honestEmptyNodeCount: number;
  readonly notRequestedNodeCount: number;
  readonly progress: {
    readonly notYetScheduledNodeCount: number;
    readonly pendingNodeCount: number;
    readonly pendingJobCount: number;
    readonly retryingJobCount: number;
  };
  readonly unavailable: readonly {
    readonly reason: Extract<ReviewNodeFamilyState, { readonly kind: "unavailable" }>["reason"];
    readonly nodeCount: number;
  }[];
}

interface ReviewNodePacket {
  readonly nodeId: string;
  readonly ply: number;
  readonly positionKey: string;
  readonly incomingMove: { readonly uci: string; readonly san: string | null } | null;
  readonly items: readonly ReviewPacketDeclaredEvidence[];
  readonly links: readonly {
    readonly kind: "engine_mate_to_exact_proof";
    readonly transitionEvidenceDigest: string;
    readonly proofEvidenceDigest: string;
  }[];
  readonly families: Readonly<Record<ReviewSourceFamily, ReviewNodeFamilyState>>;
}

type ReviewOutcomeReceipt =
  | { readonly kind: "board_terminal"; readonly eventSeq: number;
      readonly nodeId: string; readonly result: RunOutcome }
  | { readonly kind: "recorded_result"; readonly sourceDigest: string;
      readonly result: "1-0" | "0-1" | "1/2-1/2" }
  | { readonly kind: "unfinished" };

interface ReviewRecordedPrefixReceipt {
  readonly protocol: "review-recorded-prefix@1";
  readonly runId: string;
  readonly branchId: string;
  readonly eventHead: { readonly seq: number; readonly digest: string };
  readonly tipNodeId: string;
  readonly pathNodeIds: readonly string[];
  readonly prefixDigest: string;
  readonly learnerSide: "white" | "black";
  readonly outcome: ReviewOutcomeReceipt;
  readonly subjectDigest: string;
}

type ReviewPacketDeclaredEvidence = {
  readonly [P in keyof ReviewPacketPayloadByProjection]:
    DeclaredEvidence<ReviewPacketPayloadByProjection[P]> & {
      readonly projection: ReviewPacketProjectionRef<P>;
    }
}[keyof ReviewPacketPayloadByProjection];

type ReviewPacketSourceInput = {
  readonly [A in ReviewPacketSourceAdapterId]: ReviewPacketSourceAdapterResult<A>
}[ReviewPacketSourceAdapterId];

interface ReviewEvidenceInput {
  readonly subject: ReviewRecordedPrefixReceipt;
  readonly sources: readonly ReviewPacketSourceInput[];
}

interface ReviewPrefixAuthorizationInput {
  readonly run: DrillRun;
  readonly branchId: string;
  readonly importedRecord: ImportedGameRecord | null;
}

interface ReviewEvidencePacket {
  readonly subject: ReviewRecordedPrefixReceipt;
  readonly manifestDigest: string;
  readonly nodes: readonly ReviewNodePacket[];
  readonly families: Readonly<Record<ReviewSourceFamily, ReviewRunFamilyState>>;
  readonly packetDigest: string;
}

type ReviewScoreReceipt =
  | { readonly kind: "centipawns"; readonly value: number }
  | { readonly kind: "mate"; readonly side: "white" | "black";
      readonly distance: number; readonly unit: "moves" };

interface ReviewStoryMoment {
  readonly nodeId: string;
  readonly entryNodeId: string;
  readonly ply: number;
  readonly san: string | null;
  readonly fen: string;
  readonly kinds: readonly StoryMomentKind[];
  readonly components: readonly PresentedEvidenceItem[];
  readonly evaluation: null | {
    readonly before: ReviewScoreReceipt;
    readonly after: ReviewScoreReceipt;
  };
}

interface ReviewStoryMomentReceipt extends Omit<ReviewStoryMoment, "components"> {
  readonly presentation: PresentationReceipt;
}

type ReviewProgress =
  | { readonly kind: "settled" }
  | { readonly kind: "progressive"; readonly pendingNodeCount: number;
      readonly pendingJobCount: number; readonly retryingJobCount: number;
      readonly notYetScheduledNodeCount: number };

type ReviewDegradation =
  | { readonly kind: "healthy" }
  | { readonly kind: "degraded"; readonly unavailableFamilies: readonly {
      readonly family: ReviewSourceFamily;
      readonly reasons: readonly {
        readonly reason: Extract<ReviewNodeFamilyState, { readonly kind: "unavailable" }>["reason"];
        readonly nodeCount: number;
      }[];
    }[] };

interface ReviewStoryReceipt {
  readonly protocol: "review-story@1";
  readonly subject: ReviewRecordedPrefixReceipt;
  readonly manifestDigest: string;
  readonly packetDigest: string;
  readonly progress: ReviewProgress;
  readonly degradation: ReviewDegradation;
  readonly families: Readonly<Record<ReviewSourceFamily, ReviewRunFamilyState>>;
  readonly title: PresentationReceipt;
  readonly moments: readonly ReviewStoryMomentReceipt[];
  readonly rank: readonly string[];
}
```

`ReviewPacketPayloadByProjection`, `ReviewPacketProjectionRef`,
`ReviewPacketSourceAdapterId` and `ReviewPacketSourceAdapterResult` are generated from the one
literal `REVIEW_PACKET_SOURCE_ADAPTERS` registry in §4.2. Each result is a private-sealed exact
adapter output: either one projection-typed `ReviewPacketDeclaredEvidence` or one typed node-family
absence. Callers cannot put an arbitrary `DeclaredEvidence<unknown>`, prose, family string or
absence assertion into `ReviewEvidenceInput`.

`authorizeReviewRecordedPrefix(input: ReviewPrefixAuthorizationInput)` is the sole constructor for
`ReviewRecordedPrefixReceipt`. It invokes the exact `recordedSemanticPath` authority, takes the
event head from the highest contiguous event sequence, hashes the canonical event prefix and
ordered path, derives `learnerSide` from `run.start.side`, and derives the outcome from the exact
on-path `outcome.reached` event or the storage-owned `ImportedGameRecord`. It rejects a record whose
`runId` differs, whose result disagrees with the parsed source authority, or which is supplied for a
non-imported run. A caller supplies none of the receipt fields.
`assertReviewRecordedPrefixReceipt` replays that derivation; same run/branch ids with a
different head, path, learner side, imported-result digest or outcome fail.

`compileReviewEvidence(input: ReviewEvidenceInput): ReviewEvidencePacket` accepts only a live
prefix receipt and private-sealed adapter results owned by that same subject. It returns an
aggregate-sealed packet constructed by `createReviewEvidencePacket`; only that constructor may add
`packetDigest` and register the result in the private packet authority. The exported
`assertReviewEvidencePacket(value)` validates exact keys, subject and adapter seals, occurrence
joins, ordering, family folds, links and canonical digest. A spread, JSON round-trip, crossed
subject or individually valid but unowned item fails before any consumer receives it.

The source-input population is not caller-selected. From the subject path and
`REVIEW_PACKET_SOURCE_ADAPTERS`, `reviewPacketSourcePlan(subject)` derives the exact adapter × node
or adapter × declared-window invocations. `sources` must be set-equal to that plan by invocation id;
missing, duplicate, extra, wrong-node, wrong-window and wrong-subject results fail. An adapter's
honest absence therefore occupies the same required slot as its evidence result and cannot be
omitted to make a family look quiet.

`positionKey` is exactly `Node.transposeKey` (`packages/runtime/src/types.ts:114`), produced by
`transposeKey(fen)` (`packages/runtime/src/chess.ts:16`) — **not** a locally re-derived FEN prefix.
The repo already carries at least two other position keys under the same word
(`apps/server/src/opponent-selector.ts:254` takes the first five FEN fields;
`tools/r11-bot-policy-harness/generate-blind-set.mts:120` takes four), so a packet that says only
"position identity" would join on whichever one the implementer reached for, and criterion 14's
determinism test would pass under any of them. The name is pinned here for that reason.

`compileReviewEvidence` accepts the exact `ReviewEvidenceInput` above, never an authorized branch
described only in prose. It never accepts raw sentences. It validates every source adapter seal and
each item's F1 runtime seal, joins only on literal node/edge/position/candidate identities, sorts
nodes by ply then node id, sorts items by projection id/version then evidence digest, and hashes the
canonical packet excluding `packetDigest`.

`links` are non-renderable packet indices over two evidence digests already present in `items`, not
new chess claims. A link with either target missing, duplicated or anchor-mismatched fails packet
compilation. Renderers must admit both evidence items independently before co-rendering them.

Family state is data, not a footnote. A provider being off, a request not being made, a request
not yet entering the bounded window, a request still pending/retrying, source failure, domain
absence and a successful source with no observation are not aliases. `available.itemCount` is
strictly positive and equals that family's items at the node;
zero successful items is `honest_empty`, never `available: 0`. One unavailable family never makes
the packet unavailable.

`foldReviewFamilyState(nodes)` is the only node-to-prefix aggregation. For each family it counts
each node exactly once into `available`, `honest_empty`, `not_requested`, `not_yet_scheduled`,
`pending` or `unavailable`; the six node counts must sum to `nodeCount`. `itemCount` is the sum of
positive available item counts. `pendingJobCount` is the sum of positive pending job counts and
`retryingJobCount` is a non-negative subset of it. Unavailable reasons are grouped by literal
reason and sorted lexically; every reason count is positive. Shuffled nodes produce identical
bytes. Any zero/negative/non-safe count, a retry count above pending jobs, an available node with
no matching item, an unavailable entry with zero nodes, or a total mismatch fails packet
construction.

`foldReviewCompletion(families)` produces two independent fields. `progress` is `settled` exactly
when all four progress counts are zero, otherwise `progressive` with their positive aggregate
counts. `degradation` is `healthy` exactly when every family has an empty `unavailable` list,
otherwise `degraded` with only unavailable families and their already canonical reason groups.
Consequently one receipt can truthfully be progressive and degraded at the same time; neither arm
can erase the other.

The F1 packet terminates inside `RunService.story()` at one named server-only consumer:
`renderReviewStoryReceipt(packet)`. That function first asserts the aggregate packet, admits packet
items through the literal `review.story@1` bindings, constructs private-sealed
`PresentedEvidenceItem`s through the registered presentation adapters, applies the compatibility
selection, and serializes each moment and title through `serializePresentedEvidence`. Learner side,
outcome and title operands come only from `packet.subject`; there is no caller-owned story context.
It emits the closed `ReviewStoryReceipt`, and `GET /runs/:id/story` returns only that receipt. The web
`parseReviewStoryReceipt` recursively validates exact keys, literal discriminants, safe numbers,
canonical FENs, the complete nested `PresentationReceipt`s, subject digest and node/rank references;
it never calls `declareEvidence`, asserts a process seal or accepts `DeclaredEvidence` in JSON.
Unknown keys fail instead of becoming an accidental evidence channel.

`ReviewStoryMoment` is server-only and carries the exact sealed components. Its wire counterpart
contains the closed presentation receipt produced from those same components, never a parallel
sentence or source-label array. The title is likewise the `derived.story.title@1` component receipt,
not a free string. `projectPublicReviewStory(receipt)` may drop family/progress/provider metadata and
component kinds that the public policy does not admit, but each retained component is copied from
the same already-selected `PresentationReceipt` with its evidence reference, adapter identity and
component digest unchanged. The public parser accepts that narrower closed projection only; neither
wire contains packet rows, provider deliveries, raw F1 objects or caller-authored prose.

### 4.1 Enrichment policy

The post-game pass is capability-aware, progressive and idempotent. One
`ReviewEvidenceCoordinator` is composed in `apps/server/src/application.ts`; both import completion
and `RunService.story()` call its single `ensureBranch(runId, branchId, eventHead)` operation.
Neither calls `EvidenceQueue.enqueue`, `enqueueProducer` nor a private Stockfish executor.

The coordinator constructor requires explicit positive `windowNodes`, `maxOutstandingPerRun`,
`maxTrackedRuns`, `maxAttemptsPerRequest` and `maxTerminalAttemptOutcomes`; the application supplies
the 1.0 profile values and no implicit unbounded defaults exist. It also receives the one
application-lifetime `ReviewAttemptOutcomeStore` described below. For each authorized branch it:

1. derives the ordered recorded path and exact event head;
2. compiles local recorded, authored, semantic and opening items immediately when their producers
   exist;
3. subtracts already admitted exact `live.stockfish.position_eval@1` deliveries by canonical FEN,
   requested engine/version/bound and normalized command digest;
4. admits at most `windowNodes` missing positions and never has more than
   `maxOutstandingPerRun` active subscribers; each node makes one
   `stockfish.position_evaluation@1` request whose same delivery supplies typed score **and** raw
   WDL;
5. uses only `ProviderExchangeScheduler.get`, so exact-key coalescing, arrival deadline,
   cancellation, bounded global queue/retention and same-exchange identity remain the provider
   contract rather than a Review fork;
6. on every terminal result, attaches one admitted delivery or records one typed attempt outcome,
   advances the cursor and pumps the next bounded window until the whole branch is covered;
7. retries only retryable source failures up to `maxAttemptsPerRequest`, with at most one retry
   subscriber occupying the same per-run bound; exhausted work becomes `retry_exhausted` and never
   loops on repeated reads;
8. evicts least-recently-used *idle* branch coordinators above `maxTrackedRuns`. Active subscribers
   are cancelled before eviction and can be reconstructed from durable evidence plus the separate
   bounded application-lifetime terminal-outcome store;
   no partial F1 item or stale cursor is published.

`ReviewAttemptOutcomeStore` owns only fixed-size scalar receipts, never provider payloads or prose.
Its key is the canonical provider request digest plus requested provider/version/bound; the value is
one of `retryable_failure`, `non_retryable_failure`, `retry_exhausted` or
`succeeded_delivery_digest`, with attempt count, terminal timestamp and actual provider generation
when a completed exchange supplies it. `acquire(requestKey)` runs synchronously **before**
`ProviderExchangeScheduler.get` and returns exactly one of: an owner handle with the private
one-shot `settle(outcome)` operation and a completion promise; a subscriber handle carrying that
same promise for an already-pending identity; an existing handle whose promise resolves to the
retained terminal outcome; or `attempt_history_capacity` for an unseen identity when the store is
full. Pending reservation state is private to the store and is never returned as an outcome. Only
the owner calls the provider and settles; every concurrent caller observes the same sealed terminal
result. A cancelled reservation with zero started attempts may be released; a started cancellation
or retryable failure retains its attempt count and may resume only within `maxAttemptsPerRequest`.
Success retains its delivery digest until the durable evidence attachment commits, then releases
the slot because that durable delivery becomes the reconstruction authority. Non-retryable failure
and retry exhaustion remain terminal and retained.

The store has exactly `maxTerminalAttemptOutcomes` slots for its application lifetime and **does
not evict or expire individual terminal entries**. It never forgets an exhausted identity in order
to make room. `size` is always at most the configured maximum and every retained value has a fixed
byte bound. Application restart explicitly starts a new attempt-history lifetime and may retry
failures; an operator can therefore recover from capacity pressure by restart rather than receiving
a silently unbounded map or retry loop.

The cursor is a consequence of the exact branch/event head plus durable admitted deliveries and
the bounded attempt store, not an independent truth store. A process restart may retry a previously
failed source within the same per-process attempt bound, but can never relabel or duplicate an
already admitted delivery. A branch-head
change invalidates only the suffix after the common exact node/FEN prefix. Concurrent equal
`story()` calls share the coordinator and provider pending identity. A different engine version,
bound, FEN or command digest is distinct work. Completion callbacks, not future page reads, advance
the bounded window, so a long game eventually reaches full requested-family coverage without an
all-at-once enqueue.

Tablebase is requested only inside its declared material domain. Maia, Explorer and PV remain
`not_requested` in the baseline pass; explicit Review/Analyze modules may request them later and
recompile the packet. No source request blocks already complete facts.

The closed receipt replaces Story's ambiguous `ready/pendingEvidence`. Its orthogonal `progress`
and `degradation` fields distinguish pending, retrying and not-yet-scheduled counts from terminal
unavailable families. `settled` means every baseline requested position has a terminal admitted or
honest failure state; it never means every optional provider exists or that the run is healthy. The
old fields may survive for one compatibility release only as generated summaries and are forbidden
inputs to the web UI.

### 4.2 Source-adapter closure

No “collect all evidence” reflection or free-text family tag is permitted. The runtime exports one
literal `REVIEW_PACKET_SOURCE_PROJECTION_IDS` list at exact versions and one
`REVIEW_PACKET_SOURCE_ADAPTERS` map. The two key sets are equal, and every adapter declares its
single `ReviewSourceFamily`. The list is itself set-equal to the manifest's accepted Review packet
input bindings; adding an input without an adapter or an adapter without a binding fails startup
and verification.

An adapter returns only sealed declared evidence plus one family state; it may not return prose or
an unregistered object. Local sequence adapters receive the exact ordered branch and can therefore
compute the landed Wave-C recorded events at their declared horizons. Provider adapters read
durable attached events/jobs. Opening, human and tablebase adapters retain their native abstention.
The learner-modules/Wave-C eligibility amendment must land literal ids before this list can be
accepted; placeholder forecast ids are forbidden by D921.

## 5. Story compatibility repair

The server-local compatibility compiler consumes typed `ReviewEnginePoint` items and emits only the
closed `ReviewScoreReceipt` union. Browser `StoryEvaluation` is deleted rather than widened into a
forgeable evidence lookalike. `STORY_MATE_CP` and every mate→cp clamp are deleted.

- `eval_pivot` consumes only `derived.review.eval_delta@1` and may retain the existing absolute
  150-cp product convention until the Review Map policy replaces it;
- a new `mate_transition` moment consumes `derived.review.mate_transition@1` without a scalar;
- `last_level` evaluates cp points only and converts White evidence to learner perspective at this
  consumer: `learnerCp = side === "white" ? whiteCp : -whiteCp`. A mate point cannot satisfy or fail
  the within-one-pawn convention. Sign-mirrored White/Black learner fixtures must produce the same
  result;
- Story's deterministic rank remains explicitly a compatibility presentation order, not chess
  significance: outcome, mate transition, cp pivot, last-level, **phase change, endgame entry**,
  irreversibility, shape, then other facts — **nine bands, not eight**. HEAD's ladder
  (`packages/runtime/src/story.ts:182`) gives `phase_change` priority **3** and `endgame_entry`
  priority **4**; the drafted "phase/endgame" collapsed two live bands into one, which would have
  changed the order this bullet calls preserved. Mate transition takes a new band at position 1 and
  every band below it shifts by one;
- **the second tiebreak survives only for cp-typed moments, and this must be said.** HEAD sorts
  within a band by `|evalAfter.centipawns − evalBefore.centipawns|` descending before ply
  (`story.ts:183`). Once the server compiler reads the typed `ReviewEnginePoint`, a mate-typed point
  has no `centipawns` member, and the shipped expression would silently read `undefined ?? 0` — every
  mate moment sorting to the tail of its band. Refusal 1 forbids restoring the magnitude by
  converting mate to cp. The repaired path reads the nested retained
  `evaluation.payload.score`; the rule is explicit: the magnitude tiebreak applies **only** when
  both endpoints of a moment are `kind: "centipawns"`; a moment with any mate-typed endpoint skips
  the magnitude comparison and is ordered by ply then node id within its band, ahead of cp moments
  with equal ply. An implementer who reads only the band list above and deletes the magnitude
  tiebreak changes live output; one who keeps it verbatim breaks the type. Both are wrong;
- ties use ply then node id (HEAD reaches the same result through a stable sort over the
  ply/node-id-ordered moment list at `story.ts:181`, so this is a statement of existing behavior);
- the public shared story receives only the same compiled/selected server items as the authorized
  Story consumer through its narrow receipt. Raw packet rows, F1 seals, provider deliveries and
  absence internals do not leak into either JSON shape.

The existing `derived.story.eval_shift@1` is retired once no consumer remains; it is not silently
redefined over the new union. `derived.story.rank@1` declares the new mate-transition input before
Story may rank it.

## 6. Selection boundary

This RFC compiles candidates; it does not claim which moments teach best. D928 remains a discharge
for the Review Map successor to register a typed family-local policy containing:

- accepted projection ids at exact versions;
- per-family admission predicate;
- per-family quota;
- fixed cross-family presentation priority;
- deterministic ties;
- explicit overflow and absence behavior.

There is no universal numeric score. Cp, mate distance, WDL, DTZ, human probability, frequency,
opening identity and semantic facts keep their own units. The current Story compatibility order is
not evidence for the final Review Map policy.

## 7. Refusals

1. No mate→cp sentinel, clamp or cross-type subtraction.
2. No raw side-to-move WDL on a White/learner timeline.
3. No subtraction across engine versions or search bounds.
4. No DTZ-as-advantage or DTZ-as-distance-to-mate conversion.
5. No Maia/Explorer probability treated as quality.
6. No opening label treated as a move prior or theory lesson.
7. No raw best move/PV admitted through an eval payload.
8. No all-providers-ready gate and no silent source absence.
9. No LLM moment selection, grading or inferred causal explanation.
10. No “blunder,” “brilliant,” “best,” “accuracy” or player diagnosis from these projections.
    Move-quality labels and Story's separately declared compatibility title remain their own
    projections/consumers rather than being smuggled into source renderers.

## Second author repair (2026-09-04)

The fresh return is closed in the specification, not waived:

1. [[D2635]] — `ReviewEvidenceInput` now contains one sealed recorded-prefix subject and only the
   exact registry-derived source-input union. `createReviewEvidencePacket` owns the aggregate seal
   and `assertReviewEvidencePacket` is the callable trust boundary; the module execution contract
   names all three.
2. [[D2631]] — node state and run aggregate are separate types. One total, order-independent fold
   accounts for every node exactly once, while orthogonal `progress` and `degradation` fields retain
   expected mixed states.
3. [[D2632]] — Review depends on evidence-presentation checkpoint A. Server moments contain sealed
   `PresentedEvidenceItem`s; both story and title wire bytes are `PresentationReceipt`s; the public
   story is a strict projection of those same receipts. The parallel sentence/source-label arrays
   no longer exist.
4. [[D2633]] — `authorizeReviewRecordedPrefix` derives event head, path/prefix digest, side and
   outcome from the run/path/import authorities. The packet retains that receipt and the renderer
   accepts no independent context.
5. [[D2634]] — one application-lifetime `ReviewAttemptOutcomeStore` retains fixed-size terminal
   receipts under an explicit hard capacity and never evicts individual identities. Branch LRU
   therefore cannot restart exhaustion; capacity refuses unseen provider work explicitly, and
   restart is the only automatic reset boundary.

`make review-evidence-second-author-repair` retains all six original author controls and exercises
five able-to-fail repair arms. Another fresh independent review is still required before
implementation.

## Second fresh independent return (2026-09-04)

The prose-level repair direction survives, but its executable evidence does not establish the
composition. [[D2685]] and [[D2686]] show that an equal packet wrapper passes and a nested event
head mutates behind the shallow subject seal. [[D2687]] and [[D2688]] show that anonymous node
states and an arbitrary family object cannot prove exact path/family coverage: duplicates pass and
an empty record is healthy/settled. [[D2689]] exposes an internal reservation to a concurrent
reader without any waiter or shared completion path.

[[D2690]] and [[D2691]] show that presentation and source-plan integration are regex assertions,
not invoked constructors/serializers/parsers. [[D2692]] additionally reproduces the advertised
second-author target red at HEAD: the live execution contract retains null input/assertion and an
absent-seal blocker, while ordinary `make verify` does not execute that target.

Exact review and reproducer:
`planning/evidence-foundation-ux/review-evidence-compiler-second-fresh-independent-buildability-review-2026-09-04.md`;
`make review-evidence-second-fresh-review`. A bounded author repair and another genuinely fresh
review precede production.

## Third author repair (2026-09-05)

The eight returned seams now execute together under one maintained contract target:

1. [[D2685]]/[[D2686]] — `authorizeReviewRecordedPrefix` copies and recursively freezes every
   retained field; its assertion rechecks the private issuer, exact keys, digest and deep
   immutability. `createReviewEvidencePacket` retains that exact subject under a separate private
   aggregate authority. Literal, spread and JSON-rebuilt subjects or packets fail even when their
   visible bytes and digests are equal.
2. [[D2687]]/[[D2688]] — family folding consumes the authorized prefix's exact unique path-node
   population, rejects missing/duplicate/foreign nodes, and completion consumes a set-equal record
   of all nine `ReviewSourceFamily` members. Empty and partial family records cannot report settled
   or healthy.
3. [[D2689]] — attempt acquisition returns an owner or a subscriber sharing the same completion
   promise. Only the owner settles it; concurrent readers receive the same terminal outcome,
   retained terminals remain idempotent, and capacity refuses new work without exposing an
   internal `reserved` value. The predecessor's `reserve(requestKey)` did run before provider work,
   but that ordering never gave its second caller a completion path; `acquire` replaces it rather
   than treating the old check as sufficient.
4. [[D2690]] — the target invokes an adapter-owned component constructor, process-seal assertion,
   serializer, closed receipt parser, story parser and public projection. Spread components,
   unknown receipt keys, component substitution, crossed node receipts and unparsed public input
   all fail.
5. [[D2691]] — `reviewPacketSourcePlan`, every private-sealed adapter result,
   `compileReviewEvidence` and `assertReviewEvidencePacket` execute. Missing, duplicate, extra,
   foreign-node and equal-byte/wrong-authority source results fail set equality.
6. [[D2692]] — `review_evidence_packet@1` in the module execution image now publishes
   `ReviewEvidenceInput`, `compileReviewEvidence(input)`,
   `assertReviewEvidencePacket(value)` and the private aggregate seal while retaining its honest
   dependency block. Opt-in `make verify-rfc-evidence` includes
   `review-evidence-third-author-repair`; [[D3076]] deliberately keeps this draft model out of
   required release governance.

`make review-evidence-third-author-repair` retains the original and second-author controls and
passes all six composed repair groups. Exact receipt:
`planning/evidence-foundation-ux/review-evidence-compiler-third-author-repair-2026-09-05.md`.
Another genuinely fresh review must attack this composition before acceptance or production.

## Fourth fresh independent return (2026-09-07)

The local sealing mechanics survive, but the executable image does not implement the normative
compiler it claims to prove:

1. [[D3109]] — prefix authority copies caller-selected game/path truth rather than deriving it;
2. [[D3110]] — nine family placeholders stand in for the literal projection-adapter registry;
3. [[D3111]] — an arbitrary nonempty evidence digest is admitted and discarded into an item count;
4. [[D3112]] — node packets omit positions, moves, evidence items and links;
5. [[D3113]] — completion is discarded and the Story wire omits seven required fields;
6. [[D3114]] — private canonical bytes collide `NaN` with `null` and admit forbidden values; and
7. [[D3115]] — attempt settlement accepts any object and implements no retry lifecycle.

`make review-evidence-fourth-fresh-review` retains all 17 predecessor controls and passes 7/7
fresh falsifiers. [[D3108]] separately reconciles the author target with [[D3076]] by retaining it
in opt-in `verify-rfc-evidence`, not release governance. This is an author return: no production or
protected-design change is authorised. Exact receipt:
`planning/evidence-foundation-ux/review-evidence-compiler-fourth-fresh-independent-buildability-review-2026-09-07.md`.

## 8. Acceptance criteria

1. **Typed shared delivery:** White/Black cp and mate fixtures compile into the one
   `ProviderEvidenceDelivery<FixedBoundPositionEvaluation>` with exact canonical six-field FEN,
   literal side-to-move WDL and no run/node field. Both/neither search bound, non-integer score,
   zero-distance mate, missing/malformed/non-summing/different-depth WDL and same-exchange identity
   mismatch are refused by the provider operation and create no F1 item.
2. **No move leak:** provider output containing `bestMoveUci`, PV or MultiPV bytes produces the same
   narrow position-evaluation payload as the allowed score/WDL operands; the forbidden keys are
   absent recursively from declared evidence, packet, deterministic text and wire.
3. **Identity:** every admitted delivery retains exact requested and actual engine identity,
   generation, one bound, canonical FEN and provider digests. Changing FEN, requested/actual
   version, generation, bound or command digest changes request/admission identity as appropriate;
   changing a recorded node does not change the provider measurement identity.
4. **Legacy:** pre-RFC attached eval/WDL rows remain inspector-readable and yield
   `legacy_provenance_missing` for Review—never an invented current version or generated delivery.
5. **WDL normalization and occurrence:** paired White/Black-to-move fixtures normalize by
   identity/swap and sum to 1000. The same raw delivery joined to two matching run nodes yields one
   `derived.review.wdl_white@1` item and two distinct `wdl_point` occurrences; a FEN mismatch
   abstains. Over C4's fixed **658 transitions / 661 positions**, the harness reproduces Pearson
   **.015/.847**, sign agreement **49.4%/68.5%**, and median/p90 adjacent change
   **90.1/100.0** versus **0.6/23.8** for raw/normalized timelines.
6. **Cp-only delta:** cp→cp returns the exact signed White-perspective difference and literally
   retains both operands; cp→mate, mate→cp and mate→mate abstain `mate_operand`.
7. **Comparable operands:** one-character actual engine-version, generation and
   movetime/depth/nodes-bound mismatches each abstain; equal admitted operands pass.
8. **Mate transitions:** appearance, disappearance, side change and distance change are separately
   fixtured; equal mate and cp→cp do not emit.
9. **No sentinel:** a repository sweep plus runtime fixture proves `STORY_MATE_CP` and every ±1000
   mate conversion are absent; genuine +1000 cp remains typed +1000 cp.
10. **Exact-proof occurrence:** v1 proof cannot link. A proved v2 proof links only when sealed
    `run.record.edge@1` has byte-identical before FEN, UCI candidate and after FEN. Wrong before,
    move or after authority, v1 substitution, repeated-position substitution, refuted,
    budget-exhausted and horizon-ineligible proofs do not link. The v2 exact adapter drops every
    undeclared payload key.
11. **Partial packet and total fold:** every node-family discriminant, including
    `not_yet_scheduled`, retrying, retry-exhausted and attempt-history-capacity, has a positive
    fixture. The node counts sum exactly to the path population, available item totals match packet
    items, unavailable reasons are canonical and shuffled input produces identical aggregates.
    Provider-off plus successful local/eval evidence still renders available items while retaining
    the unavailable family.
12. **Production idempotence:** import completion and repeated actual `RunService.story()` calls
    reach only `ReviewEvidenceCoordinator.ensureBranch` and `ProviderExchangeScheduler.get`.
    Concurrent identical requests coalesce; different FEN, engine version, bound or command digest
    creates distinct work. A census fails if either service path calls `EvidenceQueue.enqueue`,
    `enqueueProducer` or a private Stockfish executor.
13. **Bounded progressive completion and attempt truth:** a synthetic legal long game never exceeds
    configured per-run outstanding, window, attempt, tracked-run or terminal-outcome bounds;
    queued/active eviction cancellation publishes no partial item. Completion callbacks eventually
    cover every node without another page read. Exhaust one request, churn more branches than
    `maxTrackedRuns`, reread the first branch and prove zero new provider calls plus the same
    `retry_exhausted` result and bounded store size. Fill the terminal store, prove an unseen request
    returns `attempt_history_capacity` without provider work, then prove a new application instance
    may retry. Branch-head changes reuse only the exact common prefix.
14. **Completion truth:** pending, retrying, not-yet-scheduled, honest-empty, not-requested and each
    terminal unavailability remain distinct in packet and receipt. A mixed provider-failed plus
    still-pending fixture is simultaneously `progressive` and `degraded`; shuffled fold order is
    byte-identical and every impossible count combination fails. Deprecated `ready` and
    `pendingEvidence`, while temporarily present, are generated summaries and changing them cannot
    alter web rendering or re-entry eligibility.
15. **Determinism:** shuffled events, items and provider completion order produce byte-identical
    packet, server receipt and digests for equal terminal inputs.
16. **Manifest/adapter closure:** the shared WDL-bearing source; five Review projections
    (`eval_point`, `wdl_white`, `wdl_point`, `eval_delta`, `mate_transition`); and forced-mate v2
    compile with literal inputs/operands and dispositions. Every Review derivation is
    `reported` and never more exact than `measured`; changing one to `confidence: exact` fails the
    real `EVIDENCE_DERIVATION_WIDENS` guard. Packet ids, adapters and bindings are non-empty
    set-equal, and raw eval/WDL cannot become Review prose.
17. **Closed process/wire termination:** `ReviewEvidenceInput`, registry-derived source inputs,
    `createReviewEvidencePacket` and `assertReviewEvidencePacket` are typechecked as the only public
    compiler ABI. `compileReviewEvidence` is consumed by `renderReviewStoryReceipt(packet)` on the
    production `story()` route with no independent context. JSON round-trip through
    `parseReviewStoryReceipt` preserves nested presentation receipts without constructing/asserting
    F1 seals; unknown keys, raw sentence/source-label arrays, `DeclaredEvidence`, provider delivery
    sentinels, crossed subject heads/sides/outcomes, invalid rank references and process-only symbols
    fail. Public share is a strict narrower projection of the same selected component receipts.
18. **Story compatibility:** cp pivot, mate transition, learner-relative last-level and public
    share render through sealed components without raw UCI, provider ids as prose, duplicate facts,
    caller-owned strings or cross-type arithmetic.
    Sign-mirrored White/Black learner scores give the same last-level result. `phase_change` still
    precedes `endgame_entry`, and mate-typed moments use ply/node order rather than a fake magnitude.
19. **Performance:** compiling and server-rendering 661 fixed positions is below 50 ms p95 on the CI
    runner. Provider time and progressive completion time are reported separately and excluded from
    this local bound; scheduler bounds are asserted independently by criterion 13.
20. **Scope/closeout:** no pack/content/preset/assistance/bot bytes change. Focused runtime/server/
    web receipt tests, status parity, register check, work index and full `make verify` pass; only
    rows actually discharged close, and the RFC plus exploration log record the implementation SHA.
21. **One engine authority:** a repository receipt finds one production constructor and operation
    for `live.stockfish.position_eval@1`; candidate scoring and Review eval/WDL projections consume
    it. No `live.stockfish.eval_point`, `live.stockfish.wdl_white`, Review-private scheduler/cache or
    node-bearing engine source remains. Direct use of the provider delivery as a Review occurrence
    fails while exact recorded-position joins pass.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Final Review Map source-local admission/quota/priority policy and learner-facing modules (D928); this RFC lands packet + Story compatibility only | `planning/evidence-foundation-ux/` | Review Map RFC registration/implementation commits | |
| D2 | Runtime opening items appear only after `runtime-opening-identity.md` lands; absence before then remains explicit | `planning/evidence-foundation-ux/` | opening adapter implementation SHA + packet fixture | |
| D3 | Learner usefulness of the selected Review moments; external panel work is descoped by D649, so owner-use/public-use evidence updates the gate after the final module exists | OWNER | dated owner-use evidence in `planning/exploration/log.md` | |
| D4 | [[D1969]] WDL-bearing same-exchange position evaluation | `provider-exchange-and-execution` | provider implementation SHA + raw/normalized crossed fixture | |
| D5 | Exact recorded occurrence authority for proof and semantic joins | `recorded-semantic-path` | `run.record.edge@1` implementation SHA + wrong-occurrence fixture | |

## Open questions

No owner question blocks buildability review. This RFC deliberately does not choose D928's final
Review Map quotas or priority because C4 measured source overlap and stability, not usefulness.
The existing Story order is preserved only as a labelled compatibility convention.

## Changelog

- 2026-09-05 third author repair ([[D2685]]–[[D2692]]): executable deep prefix/packet authority,
  exact node/family folds, single-flight terminal settlement, source-plan compilation and sealed
  presentation termination replace the prior prose/shallow models. The live module contract is
  reconciled and the maintained target is enrolled in ordinary verification. Exact receipt:
  `planning/evidence-foundation-ux/review-evidence-compiler-third-author-repair-2026-09-05.md`.
- 2026-09-04 second fresh independent review: returned on [[D2685]], [[D2686]], [[D2687]],
  [[D2688]], [[D2689]], [[D2690]], [[D2691]] and [[D2692]]. Aggregate/prefix authority, exact fold
  populations, concurrent attempt settlement and real source/presentation execution remain
  unproven; the advertised author target is itself red and unenrolled. `make
  review-evidence-second-fresh-review` retains the original 6/6 and passes 8/8 falsifiers. Exact
  receipt:
  `planning/evidence-foundation-ux/review-evidence-compiler-second-fresh-independent-buildability-review-2026-09-04.md`.
- 2026-09-04 second author repair ([[D2631]]–[[D2635]]): publishes the exact compiler input,
  registry-derived source plan, recorded-prefix authority and aggregate packet seal; separates node
  and run availability with a total fold and orthogonal progress/degradation; replaces raw Story
  prose arrays with sealed presentation receipts; and gives attempt history a fixed-capacity slot
  reserved before provider work, surviving branch LRU without forgetting terminal failures. The
  module execution contract now names the exact input/assertion. Retained author controls 6/6 plus
  new behavioral controls 5/5 pass; fresh independent review is still required. Exact receipt:
  `planning/evidence-foundation-ux/review-evidence-compiler-second-author-repair-2026-09-04.md`.
- 2026-09-04 fresh independent review: returned on [[D2631]]–[[D2635]].
  The public compiler still omits its exact input and aggregate runtime assertion; the receipt's
  exclusive completion union cannot tell simultaneous progress and degradation and has no
  node-to-run family fold; `sentences[]`/`sourceLabels[]` conflicts with the later sealed-component
  presentation authority; packet/context bytes share no event-head or prefix authority; and
  non-retained provider failures plus evictable coordinators leave exhausted attempts either
  retryable again or stored outside the declared bounds. Exact receipt:
  `planning/evidence-foundation-ux/review-evidence-compiler-fresh-independent-buildability-review-2026-09-04.md`.
- 2026-08-28 author amendment ([[D1644]]–[[D1651]], [[D1969]]): WDL now travels on the one shared
  same-exchange position-evaluation delivery and normalizes node-free before an exact recorded
  occurrence join; forced-mate v2 declares exact position endpoints and links only through
  `run.record.edge@1`; one bounded `ReviewEvidenceCoordinator` replaces both legacy queue paths and
  eventually covers long games; a named server renderer terminates the sealed packet in a closed,
  parsed JSON receipt; last-level converts White evidence to learner perspective; and all five
  Review derivations remain measured/reported. A fresh independent buildability review is required.
- 2026-08-26 buildability amendment ([[D1576]]): the drafted
  `live.stockfish.eval_point@1` falsely made `nodeId` an operand of the engine measurement, which
  made it unusable for hypothetical candidate children and invited fabricated run nodes. The source
  is now the shared, node-free `live.stockfish.position_eval@1` owned by
  `shared-candidate-evidence-packet.md`: exact canonical FEN, transpose key, White-perspective typed
  cp/mate score, engine identity and one bound. Review derives
  `derived.review.eval_point@1` only by exact-FEN joining that source to
  `run.record.position@1`, retaining both sealed inputs. Criteria 1–3, 15, 18 and 19 make the split
  failable and prohibit a second engine-score authority.
- 2026-08-23: initial draft from D916–D928 and Semantic Collectors discharge D2.
- 2026-08-23 cross-review: eight corrections, three of them buildability blockers as drafted.
  (1) **§4.1's `{nodeId, kind, engine identity, bound}` tracking had no home.** HEAD's attempt key is
  `runId\0nodeId\0kind` (`evidence-queue.ts:123`), `outstanding()` projects only
  `id/runId/nodeId/kind` (`:174`), and `EvidenceJob` has no engine identity at all — the executor
  holds `#engineId` privately (`:361-370`). Criterion 12's "changing the bound creates distinct work"
  is **false at HEAD in the reuse direction**: the second bound's job is never enqueued. All three
  symbols are now named and criterion 12 states the hard negative.
  (2) **§3.2 joined on `beforeFen`/`afterFen`, which are not declared operands** of
  `rules.tactic.consequence.forced_mate_after_move` (`evidence-catalog.ts:440-449`); they are visible
  only because `exactObject` seals payloads by reference (`evidence-source-adapters.ts:17-26`) — the
  leak §1.1 closes. Join moved to `candidate`/`attacker`/`proofDigest` + node identity; criterion 10
  now forbids reading the undeclared fields.
  (3) **`positionKey` had no derivation.** Pinned to `Node.transposeKey` (`types.ts:114`,
  `chess.ts:16`); two rival FEN-prefix keys under the same word exist at
  `opponent-selector.ts:254` and `r11-bot-policy-harness/generate-blind-set.mts:120`, and criterion
  14 would have passed under any of them (D982 class).
  (4) **§5 collapsed two live rank bands.** `phase_change` is priority 3 and `endgame_entry` is 4 at
  `story.ts:182`; "phase/endgame" would have tied them while claiming preservation. Nine bands now.
  (5) **§5 omitted HEAD's `|Δcp|`-descending second tiebreak** (`story.ts:183`), which silently reads
  `undefined ?? 0` for every mate point once the score is a union and cannot be restored without
  violating refusal 1. The cp-only rule is now stated and fixtured in criterion 16.
  (6) `live.stockfish.wdl_white@1` pinned as a read-time projection: `evidence.attached.data.payload`
  is `additionalProperties: false` over a closed `kind` enum in `schemas/drill_run.schema.json`
  (0.17), so a durable `wdl_white` payload is unwritable and would break the `none` claims block.
  §1.1's provenance additions *are* writable because `payload.values` is `additionalProperties: true`
  — checked, and this is what keeps `none` correct.
  (7) Criterion 1's "abstain or fail as specified" was passed by an implementation that only ever
  did one; each of the five negatives now names its single outcome.
  (8) Criterion 5's "reproduce C4's fixed normalized values" named no value; the six measured
  constants are quoted at their stated precision.
  Re-derived and unchanged: **661 positions / 658 transitions** are both correct
  (`basic-semantic-tactics-stage-0.md:612-616`) — the two figures are not a discrepancy;
  `STORY_MATE_CP = 1000` (`story.ts:33`), the ±1000 mate map (`:104`), the same-range clamp (`:107`)
  and `STORY_PIVOT_CP = 150` (`:34`) are as described; D1020 (executor takes only `engineId`) and
  D1021 (`exactObject` seals by reference) are both accurate; `EngineIdentity` does expose
  `{id, name, version}` (`engine-supervisor.ts:15-20`); all eleven cited ledger rows exist.
