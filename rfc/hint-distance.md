# RFC: Guided-hint disclosure distance

- **Status:** draft amended 2026-08-27 — technical returns [[D1638]], [[D1640]]–[[D1643]] are
  repaired against the shared provider/execution draft, the candidate-packet authority and the
  amended module/presentation contracts. [[D1639]] remains an explicit owner table awaiting
  ruling; independent D1 and implementation remain forbidden until it is answered and the
  dependency drafts pass their own reviews
- **Author:** codex, amending claude's 2026-08-23 draft on the owner's [[D1061]] ruling and
  [[D1456]] product correction
- **Created:** 2026-08-23; rebuilt 2026-08-26
- **Design refs:** `design/05-in-run-experience.md` §3/§3a (assistance and disclosure), §3b
  (naming without recommending), §5 (detection versus significance);
  `design/03-product-breadth.md` §Intelligence and explanation
- **Exploration gate:** [[D1061]] opens the axis. The original selector was returned by
  [[D1376]]–[[D1378]]. Its replacement is measured in
  `design/research/hint-selector-production-table.md` and
  `design/research/hint-relation-safe-selection.md`, with the frozen receipt at
  `planning/evidence-foundation-ux/d1397-hint-relation-results.json`. The shared population is
  specified and Node-24-measured by `rfc/shared-candidate-evidence-packet.md` and [[D1579]].
- **Depends on:** amended `rfc/shared-candidate-evidence-packet.md` (must be accepted and implemented
  before this module may become default-on); draft `rfc/provider-exchange-and-execution.md` for
  same-exchange Stockfish execution, confidence and bounded scheduling; the implemented F1 evidence contract; accepted
  `rfc/learner-modules.md`; draft `rfc/module-registration.md`; implementing
  `rfc/intent-presets.md`
- **Parent / amends:** amends `rfc/learner-modules.md` §4.8/A17,
  `rfc/module-registration.md`'s `guided_hint` declaration, and `rfc/intent-presets.md`'s
  `AssistanceConfig` projection
- **Supersedes / superseded by:** supersedes this file's returned 2026-08-23 specification in
  place; no implemented behaviour is superseded
- **Planning:** `planning/evidence-foundation-ux/`

```tabiya-claims
none
```

The claims block remains `none`: the feature adds catalogue-local `@1` projections, an in-process
compiler and a client preference migration. It changes no schema, database migration or sourcing
`EVIDENCE_KINDS` member. `AssistanceConfig` is nevertheless an unregistered shared versioned
resource used by this RFC and `intent-presets`; [[D1581]] records that process defect and the two
drafts carry an explicit cross-draft pin until a register exists.

## Summary

Guided Hint is one learner action over five cumulative disclosures:

`pattern → square → piece → distance → move`.

The learner never chooses an engine, projection, stage or source. The first press asks for the
least revealing available packet; **A little more** advances one rung for this decision; a commit,
rewind, branch change or selected-node change resets it. `hintDistance` is an Advanced/config
**ceiling**, not the ordinary interaction and not a prediction of how stuck the learner expects to
be.

The source primitive is not a principal variation. It is one relation-safe semantic occurrence on
one exact searched line, joined to one exact complete candidate population. The full occurrence is
operator-only. A compiler produces a separately sealed learner packet whose runtime bytes contain
only what that rung may reveal. The renderer, browser and optional external voice provider never
receive the full occurrence.

The module is deliberately **one source**, not a bag of unlike evidence. Engine-semantic hints use
this ladder. `theory_breadcrumb`, `structure_nudge` and endgame/tablebase presentations remain
independent modules and remain available when Stockfish abstains. Presets compose those modules to
offer Guided, Support or theory-only help. This is how the platform exposes rich evidence without
turning the learner UI into source settings or pretending that a theory citation, a Syzygy DTZ and
a searched-event ply are one primitive.

Measured reach is sparse and honest: strict direct reaches 10/64 positions in both frozen engine
arms; the qualified later-root arm reaches 16/64 at depth 12 and 10/64 at 100 ms. The module is a
precise supplement, never the sole support path and never padded with a generic engine move.

## Motivation

The returned draft had the right product idea and four false implementation assumptions:

1. Its seven-family table was not the table its first harness measured ([[D1376]]), and four rows
   were readings/predicates rather than events ([[D1378]]).
2. Raw precedence selected an opponent action as the supposed reason for the learner's move in
   28/72 non-empty arm/position rows ([[D1364]]).
3. Every lower rung still held `firstMove`; redaction and the LLM boundary existed only in prose
   ([[D1366]]).
4. It named projections and a setting but no live request, service operation, client method, store
   transition or module seat ([[D1368]]).

D1397 closes the first two at the research tier. Of 150 exact occurrences, 78 are opponent-line,
48 root-direct and 24 later-root. Family/sign admission retains 35 and refuses every opponent
occurrence, every self-exposure/preserved-risk loose-piece occurrence and the non-persistent
promotion occurrence. This RFC turns that measured grammar into types, then closes the latter two
defects with a per-rung evidence projection and a named end-to-end operation.

The scope is intentionally narrow. It does not rank every form of chess advice, replace authored
pack guidance, expose a PV, add a chat coach, or fill silence with LLM prose. It establishes the
reusable boundary those future surfaces consume.

## Specification

### §1 — Two objects, never one

The runtime defines an operator-only occurrence and a learner-facing disclosure packet. They have
different constructors, brands, projection ids and consumers.

```ts
export type HintFamily =
  | "mate_in_one"
  | "forced_mate"
  | "double_attack"
  | "fork_survives_reply"
  | "discovered_executed"
  | "loose_piece"
  | "promotion_pressure";

export type HintRelation = "root_direct" | "root_followup_in_line";

export interface DeclaredEvidenceRef {
  readonly producer: VersionedEvidenceId;
  readonly projection: VersionedEvidenceId;
  readonly evidenceDigest: string;
}

export interface HintHorizonOccurrence {
  readonly family: HintFamily;
  readonly sourceRole: "reading" | "predicate" | "event";
  readonly search: ProviderExchangeReceipt;
  readonly rootTableDigest: string;
  readonly packetDigests: readonly string[];
  readonly source: DeclaredEvidenceRef;
  readonly rootSide: "white" | "black";
  readonly edgeSide: "white" | "black";
  readonly relation: HintRelation;
  readonly signOrStatus: string;
  readonly actor: PieceIdentity;
  readonly targetSquares: readonly Square[];
  readonly occurrencePly: 1 | 3;
  readonly firstMove: { readonly uci: string; readonly san: string };
}
```

The interface is descriptive output, not a public constructor input. `compileHintHorizon` accepts
one `HintHorizonAuthority` containing the **actual sealed values**: an admitted
`live.stockfish.legal_root_table@1` source with its same-exchange execution receipt; the selected
literal root row/PV; one original sealed candidate-population view for every scanned PV node; and
the original declared semantic occurrence retained by the owning packet. It also receives the
root `{runId, branchId, nodeId, fen, eventHeadSeq}` from the server-owned run.

The constructor asserts: root FEN/request equality; exact legal-root set equality; selected row
reference membership; legal consecutive PV edges; packet FEN/path equality; original evidence
reference ownership by the named packet; family/status/sign mapping; and root/edge side. Only then
does it create a private `WeakSet`-sealed horizon and a `WeakMap` owner tuple over those exact
authorities. `compileHintDisclosure` accepts only that sealed horizon. Literal/spread/JSON/double-
asserted horizons, a correctly sealed occurrence rebuilt outside its packet, cross-generation root
tables, same-version PV swaps, packet swaps and occurrence swaps all fail before disclosure
([[D1640]]). Digests are receipts emitted *after* identity checks, never substitutes for the
authorities being checked.

The four non-event sources now have an exact referent. A **reading or predicate is evaluated at a
specific legal PV edge** and `occurrencePly` names that evaluation edge; the RFC never relabels the
source projection as an event.

| family | source projection | role | admitted source status |
|---|---|---|---|
| mate in one | `rules.tactic.consequence.mate_in_one@1` | reading | exact root-side mate after the edge |
| forced mate | `rules.tactic.consequence.forced_mate_after_move@1` | predicate | `proofStatus=proved` |
| double attack | `rules.tactic.event.double_attack@1` | event | `gained` |
| fork survives reply | `derived.tactic.fork_survives_reply@1` | predicate | `matched` |
| discovered execution | `derived.tactic.discovered_executed@1` | event | `gained` |
| loose piece | `rules.tactic.event.loose_piece@1` | event | `lost` for a mover-owned previously en-prise piece |
| promotion pressure | `derived.tactic.promotion_pressure@1` | reading | promotion available and persistent after every exact immediate reply |

The table's unit is **hint family**; total seven, asserted set-equal to D1397's frozen
`contract.families`, never hand-counted as proof.

#### §1.1 — The literal F1 derivation graph

The implementation exports `HINT_DECLARATION_MATRIX`; it is the authority for every horizon and
disclosure declaration, not documentation copied beside them. All horizons derive from the
family source above **and** `live.stockfish.legal_root_table@1`. The mixed chain therefore declares
the weakest input tuple exactly: `grounding: "declared_convention"`, `exactness: "measured"`,
`confidence: "reported"`. It never relabels bounded search as proof. Every horizon declares the
closed abstention union `input_abstained | no_admitted_occurrence | provider_unavailable |
deadline_exceeded | queue_full | cancelled | invalid_response | identity_mismatch`; the operator
receipt retains the more specific source abstention underneath `input_abstained`.

| family | exact source answer image | horizon answer image | `pattern`/`square`/`piece`/`distance` image | `move` image |
|---|---|---|---|---|
| `mate_in_one` | `threat` | `threat`, `move` | `threat` | `threat`, `move` |
| `forced_mate` | `candidate_moves` | `candidate_moves`, `move` | `candidate_moves` | `candidate_moves`, `move` |
| `double_attack` | `threat` | `threat`, `move` | `threat` | `threat`, `move` |
| `fork_survives_reply` | `threat` | `threat`, `move` | `threat` | `threat`, `move` |
| `discovered_executed` | `fact`, `pattern`, `threat` | `fact`, `pattern`, `threat`, `move` | `fact`, `pattern`, `threat` | `fact`, `pattern`, `threat`, `move` |
| `loose_piece` | `fact`, `threat` | `fact`, `threat`, `move` | `fact`, `threat` | `fact`, `threat`, `move` |
| `promotion_pressure` | `fact` | `fact`, `move` | `fact` | `fact`, `move` |

The table is executable data: each row supplies source projection, role/status, derivation inputs,
grounding, exactness, confidence, abstention and each rung's answer image/forms. The implementation
compiles it through the real F1 manifest compiler. Adding `pattern` to a mate row, `evaluation` to
any row, `principal_variation` to any learner row, deleting a source input or claiming exact
confidence is a must-fail widening fixture ([[D1641]]).

The learner rung named **pattern** is disclosure-distance copy meaning “name the family before its
geometry.” It is not `EvidenceAnswerContent.pattern`. Only `discovered_executed` has that answer
token because only its admitted source declares it. Every other family label is rendered under its
literal source answer image; a shared label must not manufacture a pattern claim.

### §2 — Relation and selection are literal

Only two relations enter this module:

- `root_direct`: the admitted source holds after the root move at ply 1.
- `root_followup_in_line`: the root side produces it at ply 3 of this exact searched line.

`opponent_line_event` remains a measured routing result and is refused from Guided Hint. It may
later feed a separately researched reply/threat module, but occurrence alone does not license the
word *threat*.

The selector uses the seven-family order above as a fixed product convention, then relation
(`root_direct` before `root_followup_in_line`), occurrence ply, canonical target square, edge UCI
and occurrence digest. The order resolves presentation contention only; it never means best,
strongest, most important or causal.

The four-ply scan ceiling remains fixed. A later-root selection must render the exact qualifier
**“on your next turn in this searched line”**. It may not say *because*, *sets up*, *prevents* or
otherwise claim the first move caused the later occurrence. The direct arm may say **“after this
move”**, not *best* or *recommended*.

Measured production-policy tripwires are:

- depth-12 strict-direct 10/64; strict-horizon 16/64;
- 100-ms strict-direct 10/64; strict-horizon 10/64;
- admitted occurrences 35/150; opponent admissions 0/78.

They are drift alarms against the immutable population, not targets for new corpora. A zero-incidence
family remains registered when permanent positive and hard-negative constructor fixtures pass.

### §3 — The five rung packets are byte-level disclosures

`packages/runtime/src/hint-disclosure.ts` exports:

```ts
export const HINT_RUNGS = ["pattern", "square", "piece", "distance", "move"] as const;
export type HintRung = (typeof HINT_RUNGS)[number];

type HintDisclosurePacket =
  | HintPatternPacket
  | HintSquarePacket
  | HintPiecePacket
  | HintDistancePacket
  | HintMovePacket;
```

Every packet carries only `rung`, `family`, source attribution, the exact disclosed-projection id
and an opaque disclosure digest. The cumulative family fields are:

| rung | additional runtime bytes | forms |
|---|---|---|
| `pattern` | none beyond registered family label | sentence/card |
| `square` | `targetSquares` | sentence + lit squares |
| `piece` | `actor` | sentence + lit squares + piece halo |
| `distance` | `relation`, `occurrencePly` | sentence + prior marks |
| `move` | one `firstMove {uci,san}` | sentence + one arrow |

The table's unit is **rung**; total five, set-equal to `HINT_RUNGS`. “Cumulative” describes
learner meaning, not object inheritance: each request creates a new frozen packet and the lower
packet physically lacks all higher fields. A pattern packet has no square, actor, ply, relation,
UCI or SAN anywhere in its JSON; a distance packet has no UCI or SAN.

There is one internal projection per family,
`derived.hint.horizon.<family>@1`, and one learner projection per admitted family/rung pair,
`derived.hint.disclosure.<family>.<rung>@1`. The exported registries are literal and derived from
one family table:

```ts
HINT_HORIZON_PROJECTION_IDS
HINT_DISCLOSURE_PROJECTION_IDS
HINT_DISCLOSURE_BY_RUNG
```

No generic `derived.hint.target@1`, wildcard family or raw-PV binding exists ([[D1569]]). A rung
projection derives from its exact family horizon, declares only forms/answer content reachable at
that rung, and has one registered renderer. `module.guided_hint` accepts the disclosure ids only;
the operator horizon ids and `live.stockfish.pv@1` are not learner bindings.

The disclosure brand is a runtime property backed by a private `WeakSet`, following
`DeclaredEvidence`/`RenderedEvidenceView`. `assertHintDisclosurePacket` rejects object literals,
spread copies, JSON round-trips and double assertions. The only public constructor is
`compileHintDisclosure(occurrence, rung)`.

### §4 — F1 and the optional LLM see the same redacted fact

The compiler declares the rung packet as exact evidence, admits it to `module.guided_hint@1`, and
passes that `ConsumerEvidenceView` to `renderEvidenceItems`. The registered renderer produces one
canonical sentence. The module packet contains exactly **one** rendered item per request, so
`voiceCheck` cannot borrow a move or judgement word from a sibling item ([[D1406]]'s packet-wide
scope defect).

The server-side external `VoiceProvider` receives only this one-item `RenderedEvidenceView`. It never receives
the horizon, PV, candidate population, packet cache entry or a server prompt containing those
objects. It may paraphrase the canonical sentence. `voiceCheck` rejects:

- any square, actor, ply or move absent from the rung;
- any different UCI/SAN from the move rung;
- *best*, *forced*, *winning*, *good*, *should* and prescription language unless that exact word
  appears in the canonical sentence (none does);
- causality language for `root_followup_in_line`.

Provider absence, timeout or refusal returns the deterministic sentence byte-for-byte. The LLM
selects no family, relation, rung or mark and fills no empty state.

The F1 seal is deliberately process-local: its symbol and private `WeakSet` membership cannot
survive JSON. Therefore neither `RenderedEvidenceView` nor a claim that the browser has re-admitted
one crosses REST ([[D1582]]). After rendering and voice checking, the server alone calls
`compileHintDeliveryReceipt`. It emits the following closed wire value:

```ts
type HintDeliveryReceipt = {
  readonly version: 1;
  readonly requestId: string;
  readonly runId: string;
  readonly decision: HintDecisionStamp;
  readonly rung: HintRung;
  readonly family: HintFamily;
  readonly projectionId: HintDisclosureProjectionId;
  readonly disclosureDigest: string;
  readonly manifestDigest: string;
  readonly rendered: {
    readonly source: "deterministic";
    readonly sentence: string;
    readonly voice:
      | { readonly state: "not_requested" }
      | { readonly state: "rendered"; readonly sentence: string }
      | {
          readonly state: "fallback";
          readonly reason: "provider_unavailable" | "deadline_exceeded" | "refused" | "invalid_output";
        };
  };
  readonly marks: HintDeliveryMarks;
  readonly receiptDigest: string;
};
```

The deterministic rendered item remains the only evidence authority. A successful optional voice
paraphrase is an additional checked presentation; the browser displays it only in the `rendered`
arm. Every other voice state displays `rendered.sentence` byte-for-byte. Voice absence or failure
therefore cannot turn an available chess hint into a source failure, and cannot suppress the hint
([[D1638]]).

`HintDeliveryMarks` is itself a rung-discriminated closed union derived from the same redacted
packet: pattern has no board coordinates; square may name only the disclosed square set; piece may
add only the actor identity; distance may add only the bounded occurrence text; move may add only
the first-move arrow. It cannot contain a generic record or optional higher-rung fields. The server
computes `receiptDigest` over canonical JSON of every preceding field. The browser validates the
closed shape, recomputes that digest, requires the projection id to be the exact
family×rung registry member, and rejects extra fields. This detects corruption and contract drift;
it does **not** pretend to recreate the server's F1 evidence seal. The browser renders only the
sentence and marks in this receipt.

### §5 — Hint distance is a ceiling; pressing the button is the request

`AssistanceConfig` moves v4→v5 with:

```ts
readonly hintDistance: "off" | HintRung;
```

Every migration defaults it to `off`, and `SILENT_ASSISTANCE.hintDistance === "off"`. Advanced
settings may configure it because every primitive remains reachable somewhere. Ordinary play does
not show a six-option select. Presets and workflow contracts project a named default and a ceiling;
the run screen shows one learner question and one progressive action.

**The type, parser and migrations are one product boundary ([[D1629]]).** Today
`apps/web/src/lib/assistance-preference.ts` independently hand-codes `validV4` and every legacy
migration beside runtime's authoritative `AssistanceConfig` interface. V5 deletes that split:
`packages/runtime/src/assistance-codec.ts` exports one pure `parseAssistanceConfig`/migration
operation for v1-v5, and the web preference store calls it rather than retaining a second validator.
The assistance-register TypeChecker projection drives a conformance fixture: for every current
field and every allowed literal, a base valid value with that one member round-trips; missing,
extra, unknown and broad values refuse; v1-v4 fixtures migrate to v5 with `hintDistance: "off"`;
and a valid v5 non-off rung survives save/load byte-for-byte. This is a test-time join to the
register authority, not runtime reflection or another stored schema.

The effective ceiling is the minimum of preset, workflow context, role/contest policy and stored
Advanced preference. **Runtime source availability is not a ceiling term** ([[D1371]]). A request
above policy yields `policy_refused`; an allowed request whose source abstains yields `honest_empty`.

**D1639 owner table — proposed, not ruled.** The five preset defaults, eight context clamps and
role/contest cells below are the smallest concrete table that makes the algebra implementable. The
RFC remains draft until the owner confirms or changes it; neither `intent-presets` nor code may
transcribe these candidates as decisions.

| preset | proposed default/ceiling | reason |
|---|---|---|
| `quiet` | `off` | silence means silence |
| `guided` | `distance` | useful consequence without revealing the move |
| `theory_only` | `off` | theory remains a separate source/module |
| `support` | `distance` | stronger help on request without default move disclosure |
| `analysis` | `off` | the explicit Inspector/Review modules own raw analysis |

| context | proposed maximum | reason |
|---|---|---|
| `position` | `move` | learner-owned free play may request the full ladder |
| `pack` | `distance` | rehearsal protects the authored answer |
| `imported` | `move` | historical review may reveal the played alternative |
| `match` | `off` | no live contest assistance |
| `stream` | `distance` | self-analysis is allowed but live move delivery is withheld |
| `academy` | `distance` | relay remains a nudge, not an answer feed |
| `onramp` | `move` | explicitly guided learning may reveal the final move on request |
| `campaign` | `distance` | encounters protect the collected theory/module challenge |

Proposed access cells: the acting `solo|host|participant` learner receives the preset/context
minimum; a live `spectator` receives `off` from this learner-action module; a post-outcome reviewing
grant may use the `imported`/Review contract; any seated rated or timed contest is `off`. Advanced
or Custom may store any of `off|pattern|square|piece|distance|move`, but can never widen a context
or access ceiling. This table answers “where can every primitive be configured?” without making
ordinary learners operate the primitive panel.

There is no `committedMoveCount` or run `revision` in `DrillRun` ([[D1643]], [[D1858]]). The server
derives one exact decision stamp from bytes that do exist:

```ts
type HintDecisionStamp = {
  readonly eventHeadSeq: number;
  readonly cursor: { readonly branchId: string; readonly nodeId: string };
  readonly disclosureBoundarySeq: number | null;
  readonly digest: string;
};
```

`eventHeadSeq` is the last contiguous run event, `cursor` is `activeCursor`, and
`disclosureBoundarySeq` names the exact currently open checkpoint/disclosure occurrence or `null`.
The digest covers `runId` plus those fields in canonical JSON. Returning to the same node after a
commit, rewind or fork is therefore a different decision. `HintRequestState` is client/session-
ephemeral and keyed by that digest. It begins before `pattern`, advances exactly one rung per
learner request, and resets whenever the recomputed digest changes or the run is replaced. Refresh
may reset to the first rung; no run-schema event or parallel revision counter is invented. The
later longitudinal-store discharge may record requests for learning analytics, but it cannot
change the live compiler.

The client sends the explicit computed rung so the server can validate it; the public control says
**Hint** and then **A little more**, never “stage 2,” “PV,” “semantic event” or a producer name.

### §6 — Sources remain separate modules

The old draft claimed one ladder served engine, theory, authored claims and Syzygy. The payload
could represent only the engine case, and global engine abstention would have disabled theory
([[D1367]]). That claim is withdrawn.

| learner need | module | source | engine-off behaviour |
|---|---|---|---|
| progressively reveal one searched semantic occurrence | `guided_hint` | the per-family disclosures in this RFC | named honest empty |
| what theory/authors say here | `theory_breadcrumb` | `pack.authored.claim`, shape/theory/opening evidence | remains available |
| what structure/pattern is present | `structure_nudge` | shapes + exact structural/endgame readings | remains available |
| exact tablebase condition or endgame measurement | registered endgame/Review presentation | Syzygy/tablebase evidence | provider-specific empty only |

The table's unit is **support concern**; total four. Presets compose modules. The shipped
`theory_only` preset disables `guided_hint` and enables `rules_floor + theory_breadcrumb`; it does
not ask the engine module to impersonate theory. Support may enable all eligible modules while the reducer/budgets
still choose at most the registered module allowance. Advanced source controls remain diagnostic,
not the ordinary workflow.

### §7 — The production request path is closed end to end

The implementing change owns this exact path:

```text
GuidedHintSeat.svelte
  → RunState.requestHint(nodeId, rung)
  → ApiClient.hint(runId, {nodeId, rung, decisionDigest}, writerId)
  → POST /runs/:runId/hints
  → DrillRunService.hint(...)
  → injected CandidatePopulationService
  → exact PV evidence / protected evidence queue
  → relation selector
  → compileHintDisclosure
  → module.guided_hint admitted/rendered item (server-local)
  → voice check + compileHintDeliveryReceipt
  → typed HintResponse
  → the same rail seat
```

`HintResponse` is a closed union:

```ts
type HintResponse =
  | { readonly state: "pending"; readonly requestId: string; readonly rung: HintRung }
  | { readonly state: "available"; readonly delivery: HintDeliveryReceipt }
  | { readonly state: "honest_empty"; readonly rung: HintRung; readonly reason: HintEmptyReason }
  | { readonly state: "source_unavailable"; readonly rung: HintRung; readonly reason: ProviderSourceReason }
  | { readonly state: "policy_refused"; readonly rung: HintRung; readonly reason: HintPolicyReason }
  | { readonly state: "failed"; readonly rung: HintRung; readonly reason: HintFailureReason }
  | { readonly state: "stale" | "cancelled"; readonly requestId: string; readonly rung: HintRung };
```

The protocol is closed and idempotent:

1. `POST /runs/:runId/hints` receives `{ nodeId, rung, decisionDigest }`. The server recomputes the
   decision stamp, active writer, disclosure boundary, effective ceiling and module availability;
   caller-supplied policy bytes are forbidden.
2. The request id is a deterministic digest of run decision, rung, manifest/compiler digests and
   provider-source generation. Repeating the same POST joins the same queued/resolved operation;
   it cannot enqueue a duplicate.
3. `GET /runs/:runId/hints/:requestId` polls that exact operation. Before every response and before
   publication, the server recomputes the decision stamp. A mismatch returns `stale`; the client
   also compares the receipt stamp and never renders a late result.
4. `DELETE /runs/:runId/hints/:requestId` removes this waiter and cancels queued work; the shared
   provider scheduler aborts active work when its final subscriber leaves. A run/cursor/boundary
   change triggers this cancellation from the client, but server-side stale refusal is still the
   authority.
5. The queue is deliberately process-local. After restart an unknown request id makes the client
   re-POST the same decision/rung; deterministic identity either recreates the operation or finds a
   retained exact provider exchange. No persisted request schema is invented.

`pending` never returns a placeholder move. `honest_empty` means the available exact inputs yielded
no admitted occurrence and offers the product loop: play and inspect the consequence, rewind, or
try another branch. `source_unavailable` means Stockfish/search execution could not supply the
required input while theory/structure modules remain independently available. `failed` is reserved
for a typed contract/internal failure and is never presented as “safe” or “no hint.” None is an
invitation for the LLM to invent help.

The route validates active writer, node/branch identity, open disclosure boundary, effective
ceiling and module availability. Its response parser rejects extra fields, identity/rung mismatch,
unknown disclosure projection, or a receipt-digest mismatch; it never asserts an F1 seal across
JSON. The API, run state and seat each have a focused contract test; one browser test traverses
button → pending → available for every rung plus honest-empty, source-unavailable, cancellation,
restart/re-POST and a late stale result after commit/rewind/fork.

### §8 — Rated play is guarded at the capability boundary

`DrillRunService.analysis()` already calls `#refuseRatedAssistance`; public
`enqueueEvidence()` does not ([[D1369]]). The implementing change moves/adds the refusal to the
common server boundary before any disclosive provider job is enqueued and calls it again from
`hint()` before reading a cached horizon. An open rated game therefore cannot obtain the same bytes
through analysis, hint, direct enqueue, cached result or a future caller.

Post-outcome review remains possible because `#refuseRatedAssistance` already keys on rated-game
state `open`, not historical rated identity. Tests cover direct enqueue, future-caller adapter,
hint cache hit and ordinary post-outcome Review.

### §9 — Module contract amendment

The old three-stage `guided_hint` grammar is removed rather than layered under a second disclosure
system. `ModuleAnswerContract.stages` cannot encode five rungs and its optional per-acceptance
`answerContent` can be omitted, which is [[D1370]]'s bypass.

`module-contract.ts` gains a closed optional disclosure declaration:

```ts
readonly disclosure?: {
  readonly vocabulary: "guided_hint@1";
  readonly ceiling: HintRung;
  readonly compiler: VersionedEvidenceId;
};
```

Only `guided_hint` may declare it; `guided_hint` must declare it; every accepted projection must be
one exact member of `HINT_DISCLOSURE_PROJECTION_IDS`; every row must declare its exact
`answerContent`; and `compileModuleRegistry` checks projection → family/rung registry → disclosure
image → requested rung → effective ceiling. Omission is a compile error.

This RFC consumes `module-registration`'s branched `ModuleAnswerCapability`, not the nonexistent
singular `ModuleAnswerCeiling="move"` from the returned draft ([[D1642]]). Guided Hint declares the
exact capability union `observation | pattern | threat | candidates | move`; compilation requires
that union's answer image to equal the union of §1.1's disclosure rows. The `move` capability maps
only to `fact + move` ([[D1859]]), so it cannot grant `ranked_moves`; no Hint row declares
evaluation, theory, principle, plan, ranking or principal variation. Other modules declare their
own independent branches.

Its raw PV/tablebase/authored/endgame acceptance rows are removed, and its literal precedence is
the ordered disclosure registry. The module may
render at checkpoint/post-commit disclosure boundaries only. A `move` rung at `pre_commit` or
`at_commit` fails compilation; lower pre-commit availability, if a future context proposes it,
requires a separate owner ruling and RFC amendment rather than falling through this grammar.

### §10 — Latency and availability

The old selector's p95 was already 1,595.9 ms before engine, transport or rendering ([[D1399]]), so
no default-on path may independently recompute alternatives. This RFC consumes the injected
`CandidatePopulationService`; constructing a cache inside the hint handler fails the operation
census.

After both RFCs are implemented, a Node-24 production-boundary harness measures:

- cold request → pending/available;
- warm packet + warm PV → rendered deterministic item;
- Stockfish/source off → `source_unavailable` while theory/structure modules still render;
- optional voice off/timeout/refusal → the same available hint with byte-identical deterministic
  sentence and typed fallback provenance;
- honest-empty selector;
- all five rung payload sizes and browser paint.

The interaction budget remains `p95 ≤ 1,500 ms` to an honest pending state and `p95 ≤ 150 ms` from
resolved dependencies to a rendered rung. The measurements must name engine/version/bound,
manifest/packet/compiler digests, machine, Node version and population. The RFC cannot be accepted
as default-on on inherited D1066 timings; the integrated receipt is an implementation criterion.

## Deviations from design

1. The owner ruled four increasing disclosures beginning at square. This RFC retains all four and
   adds a strictly vaguer family-only `pattern` rung, as the original draft proposed. It is needed
   for a first request that does not light the answer geometry. It grants no new source or answer.
2. The old RFC interpreted the axis as a learner setting. [[D1456]] and the owner's later
   “opinionated flows, rich primitives in Advanced” direction refine it: the field is a ceiling;
   the interaction is per-decision progressive disclosure.
3. The old RFC claimed a shared theory/engine/tablebase ladder. This rebuild withdraws that claim
   because the evidence types do not share distance semantics. The product still offers theory-only
   help through module/preset composition.

## Acceptance criteria

1. **Measured registry equality.** The seven internal horizon ids are set-equal to D1397's frozen
   family list; every source role/status row matches §1. A changed family, sign or relation requires
   a new preregistered receipt. Negative: the old D1066 list fails equality.
2. **Exact occurrence identity.** The horizon compiler accepts the actual sealed root table, row/PV,
   packet views and retained occurrence. Literal/spread/JSON/double-asserted horizons, same-version
   PV/occurrence swaps, rebuilt occurrences, packet swaps and cross-generation search values all
   fail before selection; changing only matching digest strings cannot make any fixture pass.
3. **Perspective safety.** All 150 frozen occurrences classify exactly; 78 opponent occurrences
   produce zero guided-hint admissions. Higher-precedence opponent synthetic fixtures cannot change
   selection.
4. **Sign safety.** `loose_piece:gained|preserved` and non-persistent promotion cannot select;
   every admitted branch has a permanent positive and hard negative.
5. **Relation language.** Root-followup renders “in this searched line” and never causality;
   root-direct and followup remain separate identities. A causality sentinel fails voice checking.
6. **No PV learner binding.** `module.guided_hint` accepts no `live.stockfish.*`, raw Syzygy,
   authored claim, endgame reading or internal horizon projection. Full Inspector remains unchanged.
7. **Five sealed byte images.** Serialised packets are exactly cumulative as §3 states. Every
   higher-field sentinel is absent from every lower packet; object literals, spreads, JSON
   round-trips and double assertions fail the runtime seal.
8. **Exact declaration and disclosure registry.** `HINT_DECLARATION_MATRIX` compiles through the
   real F1 compiler with §1.1's source, grounding, exactness, confidence, abstention, answer and form
   tuples. Per-family/per-rung projections and renderers are set-equal. Removing one, widening one,
   or adding a generic/wildcard projection fails manifest/module closure.
9. **One rendered authority.** Deterministic text, external provider input and `voiceCheck` derive
   from the same one-item redacted view. A provider cannot name an absent square/move, a different
   move, a judgement or a recommendation. Voice-off/timeout/refusal keeps the response `available`,
   records typed fallback provenance and displays deterministic bytes exactly.
10. **Ceiling versus availability.** Above-ceiling requests return `policy_refused`; an allowed
    request with available sources but no selected occurrence returns `honest_empty`; absent search
    returns `source_unavailable`. Neither silently downgrades or disables theory/structure modules.
11. **Per-decision progression.** Hint/A-little-more advances one rung for an exact decision-stamp
    digest. Commit, rewind, fork, cursor/boundary change and a return to the same node after another
    event reset it. The ordinary run UI contains no rung/source select; Advanced exposes the ceiling.
12. **Production closure and trust boundary.** Browser → run state → client → REST → service →
    injected population service → selector → disclosure compiler → admitted module → server-local
    renderer/voice check → delivery-receipt compiler → same seat passes for all five rungs,
    pending, source-unavailable, voice fallback, honest-empty and policy-refused. Idempotent POST,
    GET poll, DELETE cancellation, restart/re-POST and a late result after commit/rewind/fork are
    exercised. Deleting any link fails a consumer-operation test. Serializing a
    `RenderedEvidenceView`, accepting a malformed receipt, adding a higher-rung byte to a lower-rung
    receipt, or claiming a browser-side F1 seal fails.
13. **Rated boundary.** Open-rated direct enqueue, analysis, hint request and cached-horizon paths
    all fail before bytes/job creation; post-outcome Review succeeds.
14. **No optional answer bypass.** Every guided-hint acceptance row declares exact answer content;
    the module's branched capability image equals their union and grants no rank/eval/theory/PV
    answer. Deleting an answer, making `move` imply ranking, or presenting an internal horizon as a
    module item fails `compileModuleRegistry`.
15. **Shared service only.** A hint and another injected consumer hit one process-local packet
    service; a request-local cache constructor is refused.
16. **Integrated latency.** The Node-24 receipt records the §10 arms and clears both budgets before
    any preset makes the module default-on. Search-source absence and optional voice absence are
    measured independently; neither delays or suppresses independent theory/structure rendering.
17. **CI parity.** Node-24 `make verify`, focused server/web tests, browser content/composed journey,
    `status-parity`, `register-check`, `work-index`, roadmap receipt and `git diff --check` pass on
    committed bytes. No content-coverage census is misclassified as a unit-test failure.
18. **Owner-use discharge.** On the owner's normal devices, the ladder feels increasingly useful,
    never like a raw evidence dump, and the qualified later-line wording is understandable. A
    negative verdict returns selection/presentation; it is not rationalized away.
19. **Assistance codec parity ([[D1629]]).** Web imports the one runtime v1-v5 parser/migrator and
    contains no parallel `validV5`/migration switch. The TypeChecker-derived field/domain matrix
    exercises every allowed literal plus missing/extra/unknown values; v1-v4 each migrate with
    `hintDistance: "off"`, and a non-off v5 round-trips through the real preference store. Adding a
    field/domain member to the registered type without codec support fails.
20. **Owner ceiling table ([[D1639]]).** The owner-ratified five-preset, eight-context and
    role/contest cells are mirrored byte-identically into this RFC and `intent-presets`. Every one
    of the 40 preset×context combinations compiles by minimum; rated/timed live assistance is off;
    Advanced can select all six stored values but cannot widen policy. This criterion is RED while
    §5 remains labelled proposed.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Independent buildability/cross-document review of this rebuild | claude | review artifact + corrections + acceptance decision | |
| D2 | Shared candidate packet accepted and implemented with injected service | `shared-candidate-evidence-packet` | implementing SHA | |
| D3 | Horizon/disclosure registries, selector, seals, renderers and module compiler amendment | codex | implementing SHA + docs | |
| D4 | REST/service/client/store/seat production path and rated common-boundary guard | codex | implementing SHA + E2E receipt | |
| D5 | Owner-ratified D1639 table mirrored into `intent-presets` v5 projection and explicit per-context/role ceiling cells | OWNER + `intent-presets` | dated ruling + amendment/implementation SHA | |
| D6 | Module-registration accepts/precedence/count amendment from horizon ids to disclosure ids | `module-registration` | its amendment/implementation SHA | |
| D7 | Node-24 integrated latency, source-unavailable, independent voice-fallback and browser receipt | codex | immutable result artifact | |
| D8 | Durable hint-request analytics, if retained | `longitudinal-store` | its module-delivery projection; not required for live function | |
| D9 | Owner device/use verdict | OWNER | dated validation record | |
| D10 | AssistanceConfig shared-resource register gap [[D1581]] | codex | accepted process RFC/check | |
| D11 | Process-local F1 view must terminate in a closed wire receipt [[D1582]] | codex | amended contract + able-to-fail server/client fixtures | |
| D12 | AssistanceConfig runtime codec and TypeChecker-derived persistence conformance [[D1629]] | codex | v5 implementing SHA + focused runtime/web receipt | |

## Open questions

**D1639 blocks independent review:** confirm or change §5's proposed five preset ceilings, eight
context maxima and role/contest cells. The technical compiler, source separation, decision protocol
and theory-only composition are specified; those values are product intent and are not inferred
from the implementation. Preset labels and promise copy remain `intent-presets`' separate owner-use
validation.

## Changelog

- 2026-08-23: initial draft.
- 2026-08-23: returned on [[D1376]]–[[D1378]] and buildability blockers B1–B9.
- 2026-08-26: rebuilt after D1363/D1397. Replaced raw all-edge precedence with exact
  relation/sign admission; declaration ids with occurrence identities; prose redaction with
  per-family/per-rung sealed projections; the setting interaction with a per-decision request and
  Advanced ceiling; the source-conflated ladder with independent module composition; and the
  projection-only discharge with a named browser-to-render production path. Integrated latency
  remains honestly red until the shared packet is implemented.
- 2026-08-26: self-review caught [[D1582]] before cross-review: the process-local F1 seal cannot
  survive JSON. The server now terminates the admitted view in a closed, digest-checked delivery
  receipt; the browser validates wire bytes and never claims to reconstruct evidence admission.
- 2026-08-26: pre-review [[D1629]] correction. V5 now owns one pure runtime assistance
  parser/migrator consumed by web and a TypeChecker-derived domain conformance matrix; prose saying
  migrations default the new field is no longer the only guard against a registered field being
  silently discarded by browser persistence.
