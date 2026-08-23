# RFC: Review evidence compiler

- **Status:** draft 2026-08-23 — executes Semantic Collectors discharge D2 from D916–D928;
  independent buildability review required before acceptance
- **Author:** codex, on the D717 evidence-foundation routing and the completed Wave-C C4 research
- **Created:** 2026-08-23
- **Design refs:** `design/03-product-breadth.md` Review/Analyze surfaces;
  `design/05-in-run-experience.md` (validated evidence and assistance ceilings)
- **Exploration gate:** complete in `design/research/basic-semantic-tactics-stage-0.md` §§12, 15
  and `tools/d872-semantic-tactics-harness/` C4; the fixed population contains 658 transitions
  across eight imported games
- **Depends on:** implemented F1 evidence manifest; the implemented
  `rules.tactic.consequence.forced_mate_after_move@1` for the optional exact-proof packet link;
  the D921 learner-module/Wave-C amendment for literal Review input eligibility before acceptance
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

This RFC lands four foundation projections and one packet compiler:

1. `live.stockfish.eval_point@1` — a typed `centipawns | mate` union with explicit perspective,
   engine version and search bound;
2. `derived.review.eval_delta@1` — cp→cp only, with both points retained;
3. `derived.review.mate_transition@1` — mate appearance, disappearance or mate→mate distance/side
   change, never a cp conversion;
4. `live.stockfish.wdl_white@1` — Stockfish's raw side-to-move WDL normalized to White with the
   original subject retained;
5. `compileReviewEvidence` — joins independently available declared evidence by exact run/node/move
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
exact filtered `live.stockfish.eval@1` payload containing only score and declared provenance;
`bestMoveUci`, PV and MultiPV bytes remain in their separately permitted raw/PV projections and do
not cross the fact/evaluation adapter. The new `eval_point` projection is the flattened typed
Review source over that filtered payload. This repairs the existing manifest limitation for every
consumer, not only Story.

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

For White to move, output equals raw `{win, draw, loss}`. For Black to move, output swaps win/loss
and retains draw. All values are safe integers in `[0,1000]` and must sum to 1000; otherwise the
projection abstains `invalid_source_payload`. It is a second `live.stockfish` source projection,
grounded `bounded_search`, exactness `measured`, answer content `evaluation`, forms `list | panel`,
and abstains for provider/source failure. The request's node id and FEN are operands of the
measurement, not a later run-record derivation.

No WDL delta or grade lands here. A graph may plot the three normalized values; a later source-local
selector must declare any subtraction or threshold as its own projection.

## 2. Typed engine point

```ts
type ReviewEngineScore =
  | { readonly kind: "centipawns"; readonly value: number }
  | { readonly kind: "mate"; readonly side: "white" | "black";
      readonly distance: number; readonly unit: "moves" };

interface ReviewEnginePoint {
  readonly projectionId: "live.stockfish.eval_point@1";
  readonly nodeId: string;
  readonly positionKey: string;
  readonly perspective: "white";
  readonly score: ReviewEngineScore;
  readonly engine: ReviewEngineIdentity;
  readonly bound: ReviewSearchBound;
}
```

The source executor already normalizes `centipawns` and signed `mateIn` to White. The narrow source
adapter makes that perspective explicit, converts signed mate to
`{side, distance: abs(mateIn), unit: "moves"}`,
and rejects zero mate distance. The executor records its request `nodeId`, canonical FEN/key,
engine identity and bound in the same payload. The projection belongs to `live.stockfish`, uses
grounding `bounded_search`, exactness `measured`, answer content `evaluation`, forms `list | panel`,
and abstention reasons `provider_unavailable | legacy_provenance_missing |
invalid_source_payload`.

The payload contains neither best move nor principal variation. Cp is never clamped. Mate is never
assigned a cp sentinel.

## 3. Derived transitions

Both transition projections consume two `live.stockfish.eval_point@1` items. They are general
typed comparisons, not claims that the points are adjacent; `compileReviewEvidence` chooses
adjacent same-branch pairs by the recorded path. The points must use the same engine `{id,version}`
and identical requested bound. A mismatch abstains rather than subtracting measurements with
different operands.

### 3.1 Cp delta

```ts
interface ReviewEvalDelta {
  readonly projectionId: "derived.review.eval_delta@1";
  readonly before: ReviewEnginePoint & { readonly score: { readonly kind: "centipawns"; readonly value: number } };
  readonly after: ReviewEnginePoint & { readonly score: { readonly kind: "centipawns"; readonly value: number } };
  readonly deltaCp: number;
}
```

`deltaCp = after.score.value - before.score.value` in White perspective. The projection is
`bounded_search`, `measured`, answer content `evaluation`, forms `sentence | list | panel`, and
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

The optional exact proof is linked by the packet only when its `beforeFen`, `candidate`, `afterFen`
and attacker equal the recorded edge and the proof status is `proved`. Engine agreement never
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
  `{nodeId, kind, engine identity, bound}`;
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
  significance: outcome, mate transition, cp pivot, last-level, phase/endgame, irreversibility,
  shape, then other facts; ties use ply then node id;
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

1. **Typed source:** cp and mate fixtures compile into the discriminated point; both/neither, mate
   zero, non-integer score and missing provenance abstain or fail as specified.
2. **No move leak:** an eval payload containing `bestMoveUci` and PV produces byte-identical
   `engine_point` output to the same payload without them; those keys are absent recursively.
3. **Identity:** every new live eval/WDL row carries exact capability id/name/version and one search
   bound; changing version or bound changes the evidence/packet digest.
4. **Legacy:** a persisted pre-RFC row remains readable in the inspector and yields
   `legacy_provenance_missing` for Review—never an invented current version.
5. **WDL perspective:** paired White/Black-to-move fixtures normalize by identity/swap, sum to
   1000 and reproduce C4's fixed normalized values; the old raw timeline reproduces the known
   alternating-player hard negative and is rejected by the Review consumer.
6. **Cp-only delta:** cp→cp returns exact signed difference and retains both operands; cp→mate,
   mate→cp and mate→mate abstain `mate_operand`.
7. **Comparable operands:** a one-character engine-version mismatch and movetime/depth mismatch
   each abstain; equal declared operands pass.
8. **Mate transitions:** appearance, disappearance, side change and distance change are separately
   fixtured; equal mate and cp→cp do not emit.
9. **No sentinel:** a repository sweep plus a runtime fixture proves `STORY_MATE_CP` and ±1000 mate
   conversion are absent; +1000 genuine cp remains +1000 cp.
10. **Exact-proof join:** an exact matching proved fixture creates the packet link over both sealed
    evidence digests; mismatched candidate/FEN/attacker, refuted and budget-exhausted fixtures do
    not.
11. **Partial packet:** each family state has a positive fixture; provider-off plus successful eval
    renders the eval item while retaining the other family's unavailability.
12. **Idempotence:** repeated Story/Review reads enqueue no duplicate jobs for an identical
    `{node,kind,engine,bound}`; changing the bound creates distinct work and cannot reuse results.
13. **Readiness:** pending/failed/empty/not-requested are distinct; deprecated `ready` becomes true
    when all requested work terminates even when optional providers are off.
14. **Determinism:** shuffled events/items/provider completion order produce byte-identical packet
    and digest.
15. **Manifest/adapter closure:** four projections compile with literal operands/inputs,
    dispositions and negative widening fixtures; counts/digest move by the declared delta.
    Packet input bindings, source-id list and adapter-map keys are set-equal and non-empty; deleting
    or adding one member fails. No consumer uses raw eval/WDL as Review prose.
16. **Story:** cp pivot, mate transition, last-level and public-share fixtures render without raw
    UCI, provider ids as prose, duplicate facts or cross-type arithmetic.
17. **Performance:** compiling 661 fixed positions from durable items is below 50 ms p95 on the CI
    runner; provider time is reported separately and excluded from this local bound.
18. **Scope/closeout:** no pack/content/preset/assistance/bot bytes change. Focused runtime/server/
    browser Story tests, status parity, register check and work index pass; D917/D927 close, D918
    advances to compiled-packet complete, and Semantic Collectors D2 records the implementation SHA.

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

- 2026-08-23: initial draft from D916–D928 and Semantic Collectors discharge D2.
