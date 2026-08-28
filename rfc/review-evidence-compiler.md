# RFC: Review evidence compiler

- **Status:** draft — author-amended 2026-08-28 for [[D1644]]–[[D1651]] and [[D1969]]; awaiting a
  fresh independent buildability review. The amendment binds Review to the shared same-exchange
  provider delivery, adds node-free WDL normalization and exact recorded occurrences, refuses
  unanchored mate proofs, replaces both queue paths with one bounded coordinator, terminates the F1
  packet in a closed server-rendered wire receipt, preserves learner perspective and inherits
  weakest-input confidence. No implementation is authorised before that review.
- **Author:** codex, on the D717 evidence-foundation routing and the completed Wave-C C4 research
- **Created:** 2026-08-23
- **Design refs:** `design/03-product-breadth.md` Review/Analyze surfaces;
  `design/05-in-run-experience.md` (validated evidence and assistance ceilings)
- **Exploration gate:** complete in `design/research/basic-semantic-tactics-stage-0.md` §§12, 15
  and `tools/d872-semantic-tactics-harness/` C4; the fixed population contains 658 transitions
  across eight imported games
- **Depends on:** implemented F1 evidence manifest; accepted and implemented
  `rfc/provider-exchange-and-execution.md` including [[D1969]]'s WDL-bearing
  `live.stockfish.position_eval@1`; accepted and implemented `rfc/recorded-semantic-path.md` for
  `run.record.edge@1`; the implemented `rules.tactic.consequence.forced_mate_after_move@1` plus the
  v2 exact-occurrence projection specified here; the D921 learner-module/Wave-C amendment for
  literal Review input eligibility before acceptance; `rfc/shared-candidate-evidence-packet.md`
  §8.3 for the one position-evaluation authority
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

type ReviewFamilyState =
  | { readonly kind: "available"; readonly itemCount: number }
  | { readonly kind: "honest_empty"; readonly reason: "no_observation" | "outside_domain" }
  | { readonly kind: "not_requested" }
  | { readonly kind: "not_yet_scheduled"; readonly remainingNodeCount: number }
  | { readonly kind: "pending"; readonly jobCount: number; readonly retrying: number }
  | { readonly kind: "unavailable"; readonly reason:
      "provider_off" | "provider_failed" | "retry_exhausted" |
      "legacy_provenance_missing" | "input_abstained" };

interface ReviewNodePacket {
  readonly nodeId: string;
  readonly ply: number;
  readonly positionKey: string;
  readonly incomingMove: { readonly uci: string; readonly san: string | null } | null;
  readonly items: readonly DeclaredEvidence<unknown>[];
  readonly links: readonly {
    readonly kind: "engine_mate_to_exact_proof";
    readonly transitionEvidenceDigest: string;
    readonly proofEvidenceDigest: string;
  }[];
  readonly families: Readonly<Record<ReviewSourceFamily, ReviewFamilyState>>;
}

interface ReviewEvidencePacket {
  readonly runId: string;
  readonly branchId: string;
  readonly manifestDigest: string;
  readonly nodes: readonly ReviewNodePacket[];
  readonly packetDigest: string;
}

type ReviewScoreReceipt =
  | { readonly kind: "centipawns"; readonly value: number }
  | { readonly kind: "mate"; readonly side: "white" | "black";
      readonly distance: number; readonly unit: "moves" };

interface ReviewStoryMomentReceipt {
  readonly nodeId: string;
  readonly entryNodeId: string;
  readonly ply: number;
  readonly san: string | null;
  readonly fen: string;
  readonly kinds: readonly StoryMomentKind[];
  readonly sentences: readonly string[];
  readonly sourceLabels: readonly string[];
  readonly evaluation: null | {
    readonly before: ReviewScoreReceipt;
    readonly after: ReviewScoreReceipt;
  };
}

interface ReviewStoryReceipt {
  readonly protocol: "review-story@1";
  readonly runId: string;
  readonly branchId: string;
  readonly manifestDigest: string;
  readonly packetDigest: string;
  readonly completion:
    | { readonly kind: "complete" }
    | { readonly kind: "progressive"; readonly pending: number;
        readonly retrying: number; readonly notYetScheduled: number }
    | { readonly kind: "degraded"; readonly unavailableFamilies: readonly ReviewSourceFamily[] };
  readonly families: Readonly<Record<ReviewSourceFamily, ReviewFamilyState>>;
  readonly side: "white" | "black";
  readonly outcome: StoryTitleInput["outcome"];
  readonly title: string;
  readonly moments: readonly ReviewStoryMomentReceipt[];
  readonly rank: readonly string[];
}
```

`positionKey` is exactly `Node.transposeKey` (`packages/runtime/src/types.ts:114`), produced by
`transposeKey(fen)` (`packages/runtime/src/chess.ts:16`) — **not** a locally re-derived FEN prefix.
The repo already carries at least two other position keys under the same word
(`apps/server/src/opponent-selector.ts:254` takes the first five FEN fields;
`tools/r11-bot-policy-harness/generate-blind-set.mts:120` takes four), so a packet that says only
"position identity" would join on whichever one the implementer reached for, and criterion 14's
determinism test would pass under any of them. The name is pinned here for that reason.

`compileReviewEvidence` accepts the authorized recorded branch plus declared source items. It never
accepts raw sentences. It validates each item's F1 runtime seal, joins only on literal node/edge/
position/candidate identities, sorts nodes by ply then node id, sorts items by projection id/version
then evidence digest, and hashes the canonical packet excluding `packetDigest`.

`links` are non-renderable packet indices over two evidence digests already present in `items`, not
new chess claims. A link with either target missing, duplicated or anchor-mismatched fails packet
compilation. Renderers must admit both evidence items independently before co-rendering them.

Family state is data, not a footnote. A provider being off, a request not being made, a request
not yet entering the bounded window, a request still pending/retrying, source failure, domain
absence and a successful source with no observation are not aliases. `available.itemCount` is
strictly positive and equals that family's items at the node;
zero successful items is `honest_empty`, never `available: 0`. One unavailable family never makes
the packet unavailable.

The F1 packet terminates inside `RunService.story()` at one named server-only consumer:
`renderReviewStoryReceipt(packet, context)`. That function admits packet items through the literal
`review.story@1` bindings and registered renderers, applies the compatibility selection, and emits
the closed `ReviewStoryReceipt`. `GET /runs/:id/story` returns only that receipt. The web
`parseReviewStoryReceipt` recursively validates exact keys, literal discriminants, safe numbers,
canonical FENs and node/rank references; it never calls `declareEvidence`, asserts a seal or accepts
`DeclaredEvidence` in JSON. Unknown keys fail instead of becoming an accidental evidence channel.
The public-share renderer consumes the same already-selected server items and emits its narrower
closed public receipt; it never serializes packet rows, family internals or provider deliveries.

### 4.1 Enrichment policy

The post-game pass is capability-aware, progressive and idempotent. One
`ReviewEvidenceCoordinator` is composed in `apps/server/src/application.ts`; both import completion
and `RunService.story()` call its single `ensureBranch(runId, branchId, eventHead)` operation.
Neither calls `EvidenceQueue.enqueue`, `enqueueProducer` nor a private Stockfish executor.

The coordinator constructor requires explicit positive `windowNodes`, `maxOutstandingPerRun`,
`maxTrackedRuns` and `maxAttemptsPerRequest`; the application supplies the 1.0 profile values and no
implicit unbounded defaults exist. For each authorized branch it:

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
   are cancelled before eviction and can be reconstructed from durable evidence plus the current
   process's typed terminal outcomes;
   no partial F1 item or stale cursor is published.

The cursor is a consequence of the exact branch/event head plus durable admitted deliveries and
current process outcomes, not an independent truth store. A process restart may retry a previously
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

The closed receipt replaces Story's ambiguous `ready/pendingEvidence`. `progressive` distinguishes
pending, retrying and not-yet-scheduled counts; `complete` means every baseline requested position
has a terminal admitted or honest failure state; `degraded` names terminal unavailable families.
It never means every optional provider exists. The old fields may survive for one compatibility
release only as generated summaries and are forbidden inputs to the web UI.

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
11. **Partial packet:** every family-state discriminant, including `not_yet_scheduled`, retrying and
    retry-exhausted, has a positive fixture. Provider-off plus successful local/eval evidence still
    renders available items while retaining the unavailable family.
12. **Production idempotence:** import completion and repeated actual `RunService.story()` calls
    reach only `ReviewEvidenceCoordinator.ensureBranch` and `ProviderExchangeScheduler.get`.
    Concurrent identical requests coalesce; different FEN, engine version, bound or command digest
    creates distinct work. A census fails if either service path calls `EvidenceQueue.enqueue`,
    `enqueueProducer` or a private Stockfish executor.
13. **Bounded progressive completion:** a synthetic legal long game never exceeds configured
    per-run outstanding, window, attempt or tracked-run bounds; queued/active eviction cancellation
    publishes no partial item. Completion callbacks eventually cover every node without another
    page read. Restart recomputes from admitted deliveries, and branch-head changes reuse only the
    exact common prefix.
14. **Completion truth:** pending, retrying, not-yet-scheduled, honest-empty, not-requested and each
    terminal unavailability remain distinct in packet and receipt. Deprecated `ready` and
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
17. **Closed process/wire termination:** `compileReviewEvidence` is consumed by
    `renderReviewStoryReceipt` on the production `story()` route. JSON round-trip through
    `parseReviewStoryReceipt` preserves the closed receipt without constructing/asserting F1 seals;
    unknown keys, `DeclaredEvidence`, provider delivery sentinels, invalid rank references and
    process-only symbols fail. Public share is a strict narrower projection of the same selected
    server items.
18. **Story compatibility:** cp pivot, mate transition, learner-relative last-level and public
    share render without raw UCI, provider ids as prose, duplicate facts or cross-type arithmetic.
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
