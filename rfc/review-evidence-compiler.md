# RFC: Review evidence compiler

- **Status:** draft — returned by the 2026-08-26 author buildability checkpoint on
  [[D1644]]–[[D1651]]. The typed node-free eval/mate-domain architecture survives, but source
  identity, proof anchoring, production idempotence, engine identity freshness, learner perspective,
  process/wire termination, bounded enrichment and F1 confidence inheritance must be amended before
  the required independent review or any implementation.
- **Author:** codex, on the D717 evidence-foundation routing and the completed Wave-C C4 research
- **Created:** 2026-08-23
- **Design refs:** `design/03-product-breadth.md` Review/Analyze surfaces;
  `design/05-in-run-experience.md` (validated evidence and assistance ceilings)
- **Exploration gate:** complete in `design/research/basic-semantic-tactics-stage-0.md` §§12, 15
  and `tools/d872-semantic-tactics-harness/` C4; the fixed population contains 658 transitions
  across eight imported games
- **Depends on:** implemented F1 evidence manifest; the implemented
  `rules.tactic.consequence.forced_mate_after_move@1` for the optional exact-proof packet link;
  the D921 learner-module/Wave-C amendment for literal Review input eligibility before acceptance;
  `rfc/shared-candidate-evidence-packet.md` §8.3 for `live.stockfish.position_eval@1`
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

This RFC consumes one shared source, lands four Review projections, and lands one packet compiler:

1. `live.stockfish.position_eval@1` — the shared node-free typed `centipawns | mate` source over an
   exact canonical FEN, engine identity and one search bound;
2. `derived.review.eval_point@1` — binds that source to an exact `run.record.position@1` item rather
   than placing a run node on the source;
3. `derived.review.eval_delta@1` — cp→cp only, with both points retained;
4. `derived.review.mate_transition@1` — mate appearance, disappearance or mate→mate distance/side
   change, never a cp conversion;
5. `live.stockfish.wdl_white@1` — Stockfish's raw side-to-move WDL normalized to White with the
   original subject retained;
6. `compileReviewEvidence` — joins independently available declared evidence by exact run/node/move
   identity and records a typed state for every source family.

The packet is not a ranking and not prose. It gives later Review modules enough grounded material
to make a useful card without dumping every producer or silently requiring every provider.

## 1. Source corrections

### 1.1 Engine identity and search bound

`StockfishEvidenceExecutor` currently records only the engine request id ([[D1020]]), although capabilities
already expose `EngineIdentity { id, name, version }`. Its constructor receives the complete
identity and every new eval/WDL payload carries:

```ts
interface ReviewEngineIdentity {
  readonly id: string;
  readonly name: string;
  readonly version: string;
}

type ReviewSearchBound =
  | { readonly kind: "movetime"; readonly requestedMs: number; readonly reachedDepth: number | null }
  | { readonly kind: "depth"; readonly requestedDepth: number; readonly reachedDepth: number | null };
```

An engine id is not a version. Empty name/version, a payload carrying both requested bounds, or a
payload carrying neither is refused before attachment. Existing rows without identity/version or a
single bound remain readable as raw inspector evidence but abstain from every projection in this
RFC with `legacy_provenance_missing`.

`declareStockfishEvalEvidence` stops sealing the generic payload by reference ([[D1021]]). It constructs an
exact filtered `live.stockfish.position_eval@1` payload containing only score, the exact canonical
request FEN and declared provenance;
`bestMoveUci`, PV and MultiPV bytes remain in their separately permitted raw/PV projections and do
not cross the fact/evaluation adapter. The source has no run or node identity. Review's
`derived.review.eval_point@1` joins it to `run.record.position@1` only after exact FEN equality.
This repairs the existing manifest limitation for every consumer, not only Story, without making a
hypothetical candidate pretend to be a recorded run node ([[D1576]]).

### 1.2 WDL perspective

UCI WDL is relative to the side to move at the requested FEN. The raw
`live.stockfish.wdl@1` source remains raw and its manifest semantics/limitations state that
subject explicitly. The executor also emits a narrow, filtered source projection normalized from
the same UCI response and its own request FEN:

```ts
interface WhiteWdlPoint {
  readonly projectionId: "live.stockfish.wdl_white@1";
  readonly nodeId: string;
  readonly positionKey: string;
  readonly rawSubject: "white" | "black";
  readonly perspective: "white";
  readonly win: number;
  readonly draw: number;
  readonly loss: number;
  readonly engine: ReviewEngineIdentity;
  readonly bound: ReviewSearchBound;
}
```

**`wdl_white` is a read-time projection, never a second durable payload.** It is declared from the
stored raw `kind: "wdl"` payload plus that payload's own request FEN; nothing new is attached to the
run. This is not a stylistic choice: `schemas/drill_run.schema.json` (drill-run **0.17**) constrains
`evidence.attached.data.payload` with `additionalProperties: false` over a **closed** `kind` enum
`["eval", "wdl", "bestline", "tablebase"]`, so a durably attached `wdl_white` payload is literally
unwritable without a run-schema claim. The provenance additions of §1.1 *are* writable, because
`payload.values` is declared `additionalProperties: true` — which is exactly why this RFC's
`tabiya-claims` block can stay `none`. Any future change that attaches a new payload `kind` must
claim the run schema.

For White to move, output equals raw `{win, draw, loss}`. For Black to move, output swaps win/loss
and retains draw. All values are safe integers in `[0,1000]` and must sum to 1000; otherwise the
projection abstains `invalid_source_payload`. It is a second `live.stockfish` source projection,
grounded `bounded_search`, exactness `measured`, answer content `evaluation`, forms `list | panel`,
and abstains for provider/source failure. The request's node id and FEN are operands of the
measurement, not a later run-record derivation.

No WDL delta or grade lands here. A graph may plot the three normalized values; a later source-local
selector must declare any subtraction or threshold as its own projection.

## 2. Shared position evaluation and Review node point

```ts
type ReviewEngineScore =
  | { readonly kind: "centipawns"; readonly value: number }
  | { readonly kind: "mate"; readonly side: "white" | "black";
      readonly distance: number; readonly unit: "moves" };

interface StockfishPositionEvaluation {
  readonly projectionId: "live.stockfish.position_eval@1";
  readonly fen: string; // exact canonical six-field request FEN
  readonly transposeKey: string;
  readonly perspective: "white";
  readonly score: ReviewEngineScore;
  readonly engine: ReviewEngineIdentity;
  readonly bound: ReviewSearchBound;
}

interface ReviewEnginePoint {
  readonly projectionId: "derived.review.eval_point@1";
  readonly position: DeclaredEvidence<RecordedPosition>; // run.record.position@1
  readonly evaluation: DeclaredEvidence<StockfishPositionEvaluation>;
}
```

The source executor already normalizes `centipawns` and signed `mateIn` to White. The narrow source
adapter makes that perspective explicit, converts signed mate to
`{side, distance: abs(mateIn), unit: "moves"}`,
and rejects zero mate distance. The executor records its exact canonical request FEN,
`transposeKey`, engine identity and bound in the same payload. `live.stockfish.position_eval@1`
belongs to `live.stockfish`, uses
grounding `bounded_search`, exactness `measured`, answer content `evaluation`, forms `list | panel`,
and abstention reasons `provider_unavailable | legacy_provenance_missing |
invalid_source_payload`.

`derived.review.eval_point@1` consumes one position evaluation and one
`run.record.position@1`. It emits only when their canonical six-field FEN is byte-identical, retains
both sealed inputs literally, and takes its node identity only from the recorded position. Its
grounding is `declared_convention`, exactness `convention`, confidence `exact`, answer content
`evaluation`, and forms `list | panel | machine_condition`. A FEN mismatch abstains
`position_mismatch`; a missing source or recorded position abstains `input_abstained`. A
`transposeKey` match is not enough: clocks are part of the source measurement identity even when
the board occupancy transposes.

The payload contains neither best move nor principal variation. Cp is never clamped. Mate is never
assigned a cp sentinel.

## 3. Derived transitions

Both transition projections consume two `derived.review.eval_point@1` items. They are general
typed comparisons, not claims that the points are adjacent; `compileReviewEvidence` chooses
adjacent same-branch pairs by the recorded path. The nested evaluations must use the same engine
`{id,version}` and identical requested bound. A mismatch abstains rather than subtracting measurements with
different operands.

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
perspective. The projection is `declared_convention`, `convention`, answer content `evaluation`,
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

The projection exists only when at least one endpoint is mate and the typed state changes. Cp→mate
is `appeared`; mate→cp is `disappeared`; mate→mate may carry both `side_changed` and
`distance_changed`, sorted in the enum order above. Equal mate side/distance abstains
`no_mate_transition`; cp→cp abstains `no_mate_operand`. It retains both points and never computes
magnitude across the type boundary.

The optional exact proof is linked by the packet only when its `candidate`, `attacker` and
`proofDigest` equal the recorded edge's and the proof status is `proved`, with the edge itself
identified by the packet's own `nodeId` and parent `positionKey`.

**The drafted join keys were `beforeFen`/`afterFen`, and those are not readable.**
`ForcedMateAfterMoveProof` does carry both fields (`packages/runtime/src/mate-proof.ts:16-21`), but
the projection's **declared operands** are exactly
`["candidate", "attacker", "maxAttackerMoves", "proofStatus", "proofDigest", "rootReplies", "nodes"]`
(`packages/runtime/src/evidence-catalog.ts:440-449`, adapter at
`evidence-source-adapters.ts:131`) — `beforeFen` and `afterFen` are absent from it. They survive at
runtime only because `exactObject` seals the whole payload by reference
(`evidence-source-adapters.ts:17-26`), which is the precise leak §1.1 exists to close. Joining on
them would make this RFC depend on bytes it is simultaneously removing. Node identity plus the
declared `candidate`/`attacker`/`proofDigest` is exact and reads only declared operands; if a later
pass wants the FEN endpoints as a join key, it must add them to the projection's operand list as a
declared manifest delta and count it in criterion 15. Engine agreement never
upgrades bounded search to rules proof; both remain separately declared evidence items. A missing,
refuted, capped or horizon-ineligible proof leaves the engine transition unchanged and unlinked.

## 4. Partial post-game packet

```ts
type ReviewSourceFamily =
  | "engine_eval" | "engine_wdl" | "tablebase" | "semantic"
  | "opening" | "human_model" | "human_corpus" | "authored" | "recorded";

type ReviewFamilyState =
  | { readonly kind: "available"; readonly itemCount: number }
  | { readonly kind: "honest_empty"; readonly reason: "no_observation" | "outside_domain" }
  | { readonly kind: "not_requested" }
  | { readonly kind: "pending"; readonly jobCount: number }
  | { readonly kind: "unavailable"; readonly reason:
      "provider_off" | "provider_failed" | "legacy_provenance_missing" | "input_abstained" };

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
still pending, source failure, domain absence and a successful source with no observation are not
aliases. `available.itemCount` is strictly positive and equals that family's items at the node;
zero successful items is `honest_empty`, never `available: 0`. One unavailable family never makes
the packet unavailable.

### 4.1 Enrichment policy

The post-game pass is capability-aware and idempotent:

- local recorded, authored, semantic and opening items compile synchronously when their producers
  exist;
- Stockfish eval and WDL are requested for every node at the one configured Review bound when the
  judge provider is available; durable, failed and outstanding sets are tracked independently per
  `{nodeId, kind, engine identity, bound}`. **Three shipped symbols must change for that key to
  exist, and all three are named here because none of them carries it today:**
  (a) `EvidenceQueue.enqueueProducer`'s attempt key is `` `${input.runId}\0${input.nodeId}\0${input.kind}` ``
  (`apps/server/src/evidence-queue.ts:123`) — with no bound and no engine in it, a second request at
  a *different* bound is swallowed by `#producerAttempts.has(key)` and silently reuses the first
  bound's result, the exact opposite of criterion 12; (b) `EvidenceQueue.outstanding()` returns
  `Pick<EvidenceJob, "id" | "runId" | "nodeId" | "kind">` (`evidence-queue.ts:174`), which cannot
  express a per-bound outstanding set at all; (c) `EvidenceJob` carries no engine identity —
  `StockfishEvidenceExecutor` holds `#engineId` as private constructor state
  (`evidence-queue.ts:361-370`), so identity is a property of the executor, not of the work item, and
  must move onto the job (or be read from the executor's `ReviewEngineIdentity`) before it can key
  anything. `enqueue()` itself performs no deduplication; Review's repeat-read path is
  `enqueueProducer`, and criterion 12 is asserted against that path;
- tablebase is requested only inside the provider's declared material domain;
- Maia, Explorer and PV remain `not_requested` in the baseline pass. A later explicit Analyze or
  Review module may request them and recompile the packet; they are never hidden prerequisites;
- no source request blocks rendering facts from sources already complete.

The service replaces Story's one `ready/pendingEvidence` interpretation with per-family states and
may retain those two fields temporarily only as deprecated summaries. `ready` means no *requested*
job is pending; it never means every possible source exists.

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

`StoryEvaluation` becomes the typed `ReviewEnginePoint`. `STORY_MATE_CP` and every mate→cp clamp are
deleted.

- `eval_pivot` consumes only `derived.review.eval_delta@1` and may retain the existing absolute
  150-cp product convention until the Review Map policy replaces it;
- a new `mate_transition` moment consumes `derived.review.mate_transition@1` without a scalar;
- `last_level` evaluates cp points only; a mate point cannot satisfy or fail the within-one-pawn
  convention;
- Story's deterministic rank remains explicitly a compatibility presentation order, not chess
  significance: outcome, mate transition, cp pivot, last-level, **phase change, endgame entry**,
  irreversibility, shape, then other facts — **nine bands, not eight**. HEAD's ladder
  (`packages/runtime/src/story.ts:182`) gives `phase_change` priority **3** and `endgame_entry`
  priority **4**; the drafted "phase/endgame" collapsed two live bands into one, which would have
  changed the order this bullet calls preserved. Mate transition takes a new band at position 1 and
  every band below it shifts by one;
- **the second tiebreak survives only for cp-typed moments, and this must be said.** HEAD sorts
  within a band by `|evalAfter.centipawns − evalBefore.centipawns|` descending before ply
  (`story.ts:183`). Once `StoryEvaluation` becomes the typed `ReviewEnginePoint`, a mate-typed point
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
- the public shared story receives only the same compiled/selected items as the authorized Story
  consumer. Raw packet rows and provider absence internals do not leak into the share.

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

1. **Typed source and node derivation:** cp and mate fixtures compile into
   `live.stockfish.position_eval@1` with exact canonical six-field FEN and no node/run field. An
   exact-FEN `run.record.position@1` item derives `derived.review.eval_point@1` retaining both sealed
   inputs; a fake node on the source is a type error, and a FEN mismatch abstains
   `position_mismatch`. The five source negatives
   are pinned to one outcome each, because "abstain or fail" is satisfied by an implementation that
   only ever does one of them: a payload carrying **both** requested bounds and a payload carrying
   **neither** are *refused before attachment* (§1.1, a thrown refusal, not an abstention); **mate
   distance zero** and a **non-integer score** are *refused* by the source adapter as
   `invalid_source_payload`; a row **missing engine identity/version** *abstains*
   `legacy_provenance_missing` and stays inspector-readable. A test asserting the abstention codes
   must also assert that the two refusal cases produce no evidence item at all.
2. **No move leak:** an eval payload containing `bestMoveUci` and PV produces byte-identical
   `position_eval` output to the same payload without them; those keys are absent recursively.
3. **Identity:** every new live eval/WDL row carries exact capability id/name/version and one search
   bound; position evaluation carries exact canonical FEN and transpose key but no node id; changing
   FEN, version or bound changes the evidence/packet digest.
4. **Legacy:** a persisted pre-RFC row remains readable in the inspector and yields
   `legacy_provenance_missing` for Review—never an invented current version.
5. **WDL perspective:** paired White/Black-to-move fixtures normalize by identity/swap and sum to
   1000. Over C4's fixed population (**658 transitions, 661 positions** across eight imported games,
   `design/research/basic-semantic-tactics-stage-0.md:612-616`) the instrument reproduces the
   measured constants to their stated precision: Pearson **.015** raw versus **.847** normalized
   against White-perspective cp; adjacent cp-delta sign agreement **49.4%** raw versus **68.5%**
   normalized; median/p90 absolute adjacent change **90.1/100.0** percentage points raw versus
   **0.6/23.8** normalized. The raw timeline's alternating-player swing is the hard negative and is
   rejected by the Review consumer. (Unquoted, "reproduce C4's fixed normalized values" is passed by
   any number the harness happens to emit.)
6. **Cp-only delta:** cp→cp returns exact signed difference and retains both operands; cp→mate,
   mate→cp and mate→mate abstain `mate_operand`.
7. **Comparable operands:** a one-character engine-version mismatch and movetime/depth mismatch
   each abstain; equal declared operands pass.
8. **Mate transitions:** appearance, disappearance, side change and distance change are separately
   fixtured; equal mate and cp→cp do not emit.
9. **No sentinel:** a repository sweep plus a runtime fixture proves `STORY_MATE_CP` and ±1000 mate
   conversion are absent; +1000 genuine cp remains +1000 cp.
10. **Exact-proof join:** an exact matching proved fixture creates the packet link over both sealed
    evidence digests; mismatched `candidate`, mismatched `attacker`, mismatched `proofDigest`,
    mismatched packet `nodeId`, refuted and budget-exhausted fixtures do not. A test asserts the
    join reads **only** declared operands of
    `rules.tactic.consequence.forced_mate_after_move@1` — reaching `beforeFen`/`afterFen` off the
    sealed payload fails the criterion even when the resulting link is correct.
11. **Partial packet:** each family state has a positive fixture; provider-off plus successful eval
    renders the eval item while retaining the other family's unavailability.
12. **Idempotence:** repeated Story/Review reads enqueue no duplicate jobs for an identical
    `{node,kind,engine,bound}`; changing the bound creates distinct work and cannot reuse results,
    and changing the engine version does the same. The hard negative is the shipped behavior: a test
    pins that `enqueueProducer` at movetime *m* followed by `enqueueProducer` at movetime *m′ ≠ m*
    for the same `{runId,nodeId,kind}` yields **two** jobs and two distinct results. Under HEAD's
    three-part attempt key (`evidence-queue.ts:123`) the second call returns `undefined`, so this
    criterion fails before the change and passes after it.
13. **Readiness:** pending/failed/empty/not-requested are distinct; deprecated `ready` becomes true
    when all requested work terminates even when optional providers are off.
14. **Determinism:** shuffled events/items/provider completion order produce byte-identical packet
    and digest.
15. **Manifest/adapter closure:** the shared `live.stockfish.position_eval@1` source plus this RFC's
    four projections compile with literal operands/inputs,
    dispositions and negative widening fixtures; counts/digest move by the declared delta.
    Packet input bindings, source-id list and adapter-map keys are set-equal and non-empty; deleting
    or adding one member fails. No consumer uses raw eval/WDL as Review prose.
16. **Story:** cp pivot, mate transition, last-level and public-share fixtures render without raw
    UCI, provider ids as prose, duplicate facts or cross-type arithmetic. The rank is fixtured at
    both changed points: `phase_change` still precedes `endgame_entry` (nine bands, not the drafted
    eight), and a band containing one cp moment with a large `|Δcp|` plus one mate-typed moment
    orders the mate moment by ply rather than by a magnitude read off a missing `centipawns` member.
17. **Performance:** compiling 661 fixed positions from durable items is below 50 ms p95 on the CI
    runner; provider time is reported separately and excluded from this local bound.
18. **Scope/closeout:** no pack/content/preset/assistance/bot bytes change. Focused runtime/server/
    browser Story tests, status parity, register check and work index pass; D917/D927 close, D918
    advances to compiled-packet complete, Semantic Collectors D2 records the implementation SHA,
    and shared-packet Discharge D8 records the same reconciliation SHA.
19. **One engine-score authority:** a repository receipt finds one production constructor for
    `live.stockfish.position_eval@1`; candidate-vector scoring and Review node-point derivation both
    consume it. No `live.stockfish.eval_point@1` declaration remains, no Review adapter can seal a
    node id into the source, and no candidate adapter can manufacture one. A fixture with the same
    position evaluation joined to a matching recorded node succeeds while the same evaluation used
    directly as a Review node point fails.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Final Review Map source-local admission/quota/priority policy and learner-facing modules (D928); this RFC lands packet + Story compatibility only | `planning/evidence-foundation-ux/` | Review Map RFC registration/implementation commits | |
| D2 | Runtime opening items appear only after `runtime-opening-identity.md` lands; absence before then remains explicit | `planning/evidence-foundation-ux/` | opening adapter implementation SHA + packet fixture | |
| D3 | Learner usefulness of the selected Review moments; external panel work is descoped by D649, so owner-use/public-use evidence updates the gate after the final module exists | OWNER | dated owner-use evidence in `planning/exploration/log.md` | |

## Open questions

No owner question blocks buildability review. This RFC deliberately does not choose D928's final
Review Map quotas or priority because C4 measured source overlap and stability, not usefulness.
The existing Story order is preserved only as a labelled compatibility convention.

## Changelog

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
