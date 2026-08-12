# Evidence and explanation (B4) — foundation alignment

Program item #2 in `design/03-product-breadth.md`. Written 2026-08-12 by code
inspection of `apps/server/src`, `apps/web/src`, `packages/runtime/src`,
`packages/schema/src`, plus the real authored pack at
`content/drafts/anti-caro-advance.json`.

Every "exists" claim carries `file:line`; every "absent" claim carries the grep
that proves it. Greps exclude `*.test.ts` / `*.spec.ts` unless stated.

## 1. Scope

| Owned surface | Source |
|---|---|
| Feedback packet / evidence composer (server data function) | breadth §RFC program #2a |
| Explanation surface: rail, checkpoint sheet, compare | breadth §RFC program #2b |
| Authored claim rendering — `spine[].annotations`, `deviations[].note`, `planClasses`, `concepts`, `objective.summary`, `feedbackClaims` | `planning/content-era/field-consumer-matrix.md` |
| Per-scope reveal and timing controls (`feedbackPolicy`, withholding) | breadth §"Intelligence and explanation" anti-contamination |
| Selectable layers — authored · Stockfish eval/WDL/MultiPV · Maia reply/policy mass/alternatives · corpus frequency/outcomes/historical · Syzygy WDL/DTZ · deterministic structural/temporal/phase features · evidence-bound LLM | breadth §"Intelligence and explanation" |
| Deep analysis mode | breadth §Review and explore |
| Off-spine graceful degradation (authored coach-voice → instruments-only) | `design/BACKLOG.md` off-spine row |

**Gate rows owned:** B4 in full. Shares B3's "deep mode" cell with program #5 and
B8's "Settings → feedback/evidence, engines/models, LLM" cell with #1. Explanation
is the unifying depth the Lucas Chess analysis says every other surface inherits,
so B2/B3/B5/B7 all depend on this landing.

## 2. What ships today

| Capability | Shipped? | Evidence |
|---|:--:|---|
| Run-global feedback latch | ✓ | `apps/server/src/feedback-policy.ts:11` — true once **any** `checkpoint.reached` / `segment.completed` exists |
| Latch applied to graph / events / staged evidence / apply / compare | ✓ | `feedback-policy.ts:19,44`; `apps/server/src/service.ts:255,269,276,325,339` |
| Per-scope reveal (checkpoint / segment / comparison) | ✗ | `grep -rn 'reveal' apps/server/src` → sole production hit is the comment `pack-registry.ts:44`; all others are tests |
| Feedback packet, composer, or endpoint | ✗ | `grep -rn 'feedback' apps/server/src/rest.ts apps/web/src/lib/api.ts` → 0 hits; `rest.ts:299` allows only `moves\|rewind\|fork\|graph\|compare\|events\|evidence\|pgn` |
| `objective.summary` rendered | ✓ (ungrounded) | `apps/web/src/lib/screen-model.ts:61`; `apps/web/src/lib/DrillScreen.svelte:363` |
| `spine[].annotations` | ✗ | declared `packages/schema/src/drill-pack/types.ts:21`; stripped at `apps/server/src/pack-registry.ts:33-40`; zero web consumers |
| `deviations[]` — `.note`, `.class`, `.offObjective` | ✗ | `types.ts:74` + lint `packages/schema/src/drill-pack/lint.ts:179`; `grep -rn 'offObjective' apps packages` → 0 hits |
| `feedbackClaims` | ✗ | `grep -rn 'feedbackClaims' apps packages` → **1 hit**, the negative assertion `apps/server/src/drill-client-server.test.ts:155`. Absent even from `drill-pack/types.ts` |
| `planClasses` / `concepts` | ✗ | same grep → only `drill-client-server.test.ts:156,157` |
| `checkpoints[].interaction` (`intent_capture`, `prediction`) | ✗ | declared `types.ts:38-56`; only consumer is a density warning `lint.ts:127`; `CheckpointSheet.svelte:28-48` offers Continue/Rewind/Compare/Stop |
| `authoredBoundary` → `provenanceMode` | ✗ | `authoredBoundary` only at `types.ts:70`, `lint.ts:171`; `grep -rn 'provenanceMode' apps packages` → 0 hits |
| Timing window `windowOpens` / `luxuryMoveBudget` | ✗ | `luxuryMoveBudget` only at `types.ts:33`; `apps/server/src/pack-orchestrator.ts:67-70` fires on `windowCloses` alone |
| Objective types beyond `reach_checkpoint` | ✗ | `pack-orchestrator.ts:88-100` translates one kind; `apps/server/src/pack-validation.ts:160-175` rejects every other |
| Runtime predicate vocabulary (rulesFact · materialBalance · fenPredicate incl. `transposeKey`/`pawnStructure` · checkpointReached · all/any/not) | ✓ **and evaluated** | `packages/runtime/src/objective.ts:60-69`; evaluator `objective.ts:195` |
| Segment identity `{branchId,startSeq,endSeq}` | ✓ | `packages/runtime/src/events.ts:167` `deriveSegments`; type `packages/runtime/src/types.ts:197-205` |
| Stockfish `eval` evidence auto-enqueued per move | ✓ | `service.ts:406-412` (`kind: "eval"`); executor `apps/server/src/evidence-queue.ts:316-334` |
| Stockfish `wdl` / `bestline` evidence | executor only | `evidence-queue.ts:335-347,360`; the only enqueue site in the product is `service.ts:409`, hard-coded `kind: "eval"` |
| MultiPV as evidence | ✗ | `MultiPV` exists only in the *opponent* profile `apps/server/src/strong-engine.ts:14,55`; the evidence executor sets only `UCI_ShowWDL` (`evidence-queue.ts:307`) |
| Maia chosen reply + policy mass | computed, persisted, never surfaced | parsed `apps/server/src/opponent-selector.ts:225`, persisted in the v0.4 `opponent.move_selected.selection`. `EvidenceSource` already includes `"human_model_predicted"` (`packages/runtime/src/types.ts:12`) but `grep -rn 'human_model_predicted' apps packages` finds **only tests** |
| Corpus frequency / outcomes / historical examples | ✗ | `grep -rniE 'corpus\|explorer' apps/server/src apps/web/src packages` → 0 hits |
| Syzygy WDL/DTZ | ✗ | `grep -rniE 'syzygy\|tablebase' apps packages` → 0 hits |
| Deterministic structural/temporal/phase features | ✗ | `grep -rniE 'pawn_structure\|featureExtract\|openFiles' apps packages` → 0 hits |
| Evidence-bound LLM rendering | ✗ | `apps/server/src/capabilities.ts:33` declares `readonly llm: "none"` as a **literal type**; mirrored `apps/web/src/lib/api.ts:118` |
| Deep analysis mode | ✗ | `grep -rniE 'deep analysis\|deepAnalysis' apps packages` → 0 hits |
| Evidence-sentence rendering for `rules:` / `pack:` / `engine:` | ✓ | `apps/web/src/lib/evidence-sentences.ts:33,73` |
| Grounded objective transitions + aligned score trajectory in compare | ✓ | `packages/runtime/src/compare.ts:49-63`; `apps/web/src/lib/CompareView.svelte` |
| Explanation rail / selectable layers | ✗ | the drill screen's only explanation element is `WhyBanner.svelte` (52 lines), shown solely on an objective transition (`screen-model.ts:173`); `DrillScreen.svelte:360-376` is objective copy + board |
| Settings: user feedback/evidence/LLM controls | ✗ | `apps/web/src/App.svelte:271-283` renders read-only deployment providers and surface availability |
| Branch `intent` free-text recording site | ✓ | `packages/runtime/src/types.ts:78`, written by `fork` (`runtime.ts:94`), rendered `BranchRail.svelte:33` |

**Net:** the *transport* is real and tested (typed payloads, durable
`evidence.attached`, ref grammar, sentence table, server-side withholding). The
*composition* layer, the *surface*, and six of seven evidence sources are absent.
Pack A's `objective` carries only `type` and `summary` — no `successConditions` —
so its state machine cannot fire even in principle.

## 3. The gap

| Sub-capability | What is missing to be minimally real |
|---|---|
| Feedback packet | A composer producing a scoped typed packet plus a read route. Nothing assembles authored + engine evidence into one addressable object; the nearest thing, `compare()`'s per-side arrays (`compare.ts:60-63`), is comparison-only and carries no authored content |
| Per-scope reveal | `feedbackIsRevealed(pack, run)` returns one boolean for the whole run. Pack A has three checkpoints; reaching the first releases prose for all three. Needs `(pack, run, scope)` |
| Authored claim rendering | No route emits authored prose at all — `projectPackDocument` (`pack-registry.ts:46-73`) deliberately omits it. Needs a reveal-gated projection, then a rail |
| `planClasses` | No intent-capture consumer; `CheckpointSheet.svelte` never reads `interaction`. Shipped recording site is `Branch.intent` (`types.ts:78`), free text — must accept a plan-class id |
| `concepts` | Strings with no display and no per-node association. Minimal real = pack concept ids as labeled chips on the packet, sourced from the pack, never inferred |
| `deviations[].note` | Best first render: addressable by `spineNodeId` + `moveUci` with no new authored vocabulary, and Pack A has five with real teaching prose. Missing: the lookup at commit time and reveal-gated delivery |
| `feedbackClaims` | No triggers, no recording site, no renderer. Pack A's two claims are floating sentences |
| Off-spine degradation | `authoredBoundary` has zero evaluators. `activeSpineNodeId` (`pack-orchestrator.ts:21-37`) answers "on the spine?" but is **move-order exact** and returns `undefined` off-spine, whereas `theory_strict` recognizes transpositions by `transposeKey`. The evaluator must use the predicate form, not the exact walker |
| Stockfish WDL / MultiPV | `wdl` executor exists but nothing enqueues it; MultiPV is never requested for evidence. Needs a second enqueue kind and a `multiPv` job option |
| Maia layer | Policy mass is parsed and persisted in the selection event but never converted into an `evidence.attached` payload, so it cannot reach compare or a packet. `human_model_predicted` is a producer-less enum member |
| Corpus / historical | Nothing. Minimal real = one source (Lichess explorer or a pack-authored frozen example list) behind one typed payload kind |
| Syzygy | Nothing. Minimal real = WDL/DTZ for ≤7-piece positions, honestly unavailable otherwise |
| Deterministic features | Nothing. The six written formulas in `rfc/withdrawn/evidence-composer.md` §feature extractor are the only spec and are re-usable as written |
| Deep analysis mode | No surface, and no analysis path with a budget distinct from the ratified 100 ms play profile |
| LLM rendering | `llm: "none"` is a type, not a config. Needs the union widened, a provider setting, and a renderer consuming only packet members |
| Timing / spare tempo | `luxuryMoveBudget` is read by nothing. Pack A needs a *set* of plan-completing moves (Be3 **or** c3); `SimpleTrigger` (`types.ts:24-28`) has no set form |

## 4. Contracts to pin

**C1 — Feedback scope identity.** Pinnable now; mints no new identity.

```ts
// packages/runtime/src/types.ts:197
export interface Segment {
  readonly branchId: string; readonly startCheckpointId: string;
  readonly endCheckpointId: string; readonly startNodeId: string;
  readonly endNodeId: string; readonly startSeq: number; readonly endSeq: number;
}
```

Scope = `{kind:"checkpoint", nodeId}` | `{kind:"segment", branchId, startSeq,
endSeq}` | `{kind:"comparison", branchAId, branchBId}` — produced by
`deriveSegments` (`events.ts:167`) and by the shipped compare arguments
(`rest.ts:531-533`).

**C2 — Per-scope reveal predicate.** Pinnable now; amends one shipped signature.

```ts
// apps/server/src/feedback-policy.ts:11
export function feedbackIsRevealed(pack: PackRecord, run: DrillRun): boolean
```

→ `feedbackIsRevealed(pack, run, scope)`, with `{kind:"run"}` retained so the five
existing call sites (`service.ts:255,269,276,325,339`) keep their meaning until
each is given a real scope.

**C3 — Feedback read route.** Pinnable now; extends the shipped regex.

```ts
// apps/server/src/rest.ts:299
/^\/runs\/([^/]+)\/(moves|rewind|fork|graph|compare|events|evidence|pgn)$/
```

`GET /runs/:id/feedback?scope=…`, leaseless (read routes carry no writer id,
`rest.ts:426-446`). An unrevealed scope returns the shipped `FEEDBACK_WITHHELD`
code already used at `service.ts:340`.

**C4 — Evidence-ref grammar split.** Pinnable now; the id space exists in content.

```ts
// packages/runtime/src/evidence-ref.ts:32,36
export function packEvidenceRef(checkpointId: string): PackEvidenceRef  // `pack:${id}`
export function engineEvidenceRef(jobId: string): EngineEvidenceRef     // `engine:${id}`
```

Pack A supplies both id spaces: checkpoints `plan-commitment` / `break-arrived` /
`tal-commitment`, claims `chain-base` / `tal-tempo`. Pin `pack-checkpoint:` and
`pack-claim:`, keeping `pack:` as the checkpoint alias so the shipped sentence
table (`evidence-sentences.ts:44-54`) and persisted runs stay valid.

**C5 — Claim `when` triggers.** Pinnable now, and this **corrects the withdrawn
RFC**. `rfc/withdrawn/authoring-contracts-v03.md` §1 argued a new
key-discriminated vocabulary was required because the runtime's type-discriminated
form "cannot be expressed here without duplicating a second, differently-spelled
vocabulary". That is false against shipped code: the pack already carries a
key-discriminated `SimpleTrigger` that `pack-orchestrator.ts:39-59` translates into
the runtime form, and `successPredicate` (`pack-orchestrator.ts:88-100`) is the
shipped pack→runtime translation seam. The target already exists and is evaluated:

```ts
// packages/runtime/src/objective.ts:60  (evaluator at objective.ts:195)
export type ObjectivePredicate =
  | RulesFactPredicate | MaterialBalancePredicate
  | { readonly type: "fenPredicate"; readonly predicate: FenPredicate }
  | { readonly type: "checkpointReached"; readonly checkpointId: string }
  | { readonly type: "all" | "any"; readonly predicates: readonly [ObjectivePredicate, ...ObjectivePredicate[]] }
  | { readonly type: "not"; readonly predicate: ObjectivePredicate };
```

A claim's `when` is a pack-side trigger widened with `all`/`any`/`not`, routed
through the same seam. No second vocabulary.

**C6 — Authored-boundary evaluator → `provenanceMode`.** Pinnable now against
`FenPredicate.transposeKey` (`objective.ts:42-45`), the same transposition test
`theory_strict` already uses (`docs/engine-workers.md` §selector). Semantics
ratified against author intuition in Pack A session 1: **`plyHorizon` caps
authored reach, it does not grant it.** Pack A's boundary is ten `spineNodeIds` +
`plyHorizon: 14`.

**C7 — `EvidencePayload` widening for non-Stockfish sources.** *Not honestly
pinnable yet.*

```ts
// packages/runtime/src/types.ts:11
export type EvidenceKind = "eval" | "wdl" | "bestline";
export type EvidenceSource = "engine_validated" | "human_model_predicted";
```

`human_model_predicted` has zero producers. What pins it: the first real producer
writing an `evidence.attached` payload from the Maia data already persisted in
`opponent.move_selected.selection` (slice S7). Corpus and tablebase kinds pin on
their first probe (S9). Each widening bumps `schemas/drill_run.schema.json`
(currently v0.4).

**C8 — Timing / luxury contract.** *Not honestly pinnable yet.* Pack A named the
exact shortfall: the teaching point needs (a) a **set** of plan-completing moves
(Be3 or c3), (b) an opponent-arrival move (…c5), (c) a discretionary spend (h4),
and the same move must be plan-completion on one branch and irrelevant on another.
`SimpleTrigger` (`types.ts:24-28`) has no set form; `TimingWindowTrigger`
(`types.ts:30-34`) carries `luxuryMoveBudget` with no counter. What pins it: a
move-set encoding written against Pack A's h4/…c5 case plus a counter in
`pack-orchestrator.ts:61-71`. Slice S6 does exactly that, with Pack A as fixture.

**C9 — LLM provider contract.** *Not honestly pinnable yet.*

```ts
// apps/server/src/capabilities.ts:30
export interface CapabilityProviders {
  readonly opponent: "maia" | "mock" | "none";
  readonly judge: "stockfish" | "mock" | "none";
  readonly llm: "none";
}
```

What pins it: one configured provider reaching `GET /capabilities`
(`capabilities.ts:77-97`), which requires the S2 packet to exist as the renderer's
only permitted input. Slice S10 does both.

## 5. Slice plan

Each slice is minimal-but-real: real entry, runtime behaviour, evidence boundary,
resume/export path, one acceptance scenario. Pack A is the fixture throughout —
it is the only content that exercises authored feedback.

| # | Slice | Minimal real proof | Acceptance scenario | Deps |
|---|---|---|---|---|
| S1 | Per-scope reveal predicate | `feedbackIsRevealed(pack, run, scope)` per C2: a checkpoint scope reveals when that checkpoint is reached on the path, a segment when it completes (`deriveSegments`), a comparison when both sides' in-scope checkpoints are revealed. Existing call sites pass `{kind:"run"}` | Pack A run reaches `plan-commitment`; that scope reveals while `tal-commitment` still returns `FEEDBACK_WITHHELD` — the exact case the run-global latch gets wrong | none; all inputs shipped |
| S2 | Feedback packet composer + `GET /runs/:id/feedback` | Pure data function assembling, per scope: authored claims, deviation notes matching the played move, spine annotations on the path, plan-class and concept labels, objective transitions with their grounds, and recorded `evidence.attached` payloads. **Fail closed** — a claim with no resolving ref is dropped and logged, never rendered (ADR-0005 enforced structurally, not by prompt). Reveal applied by S1 | `scope=checkpoint:<c5-break node>` returns the three deviation notes authored at `c5-break` and nothing authored at `tal-commitment`; the same request before the checkpoint returns `FEEDBACK_WITHHELD`; the Playwright payload contains none of the withheld note text. Packet derives from persisted events, so it survives reload | S1; C1/C3/C4 |
| S3 | Explanation rail (the surface) | A third stable region in `DrillScreen.svelte` (the shell already reserves a context-sensitive rail) plus the same packet in `CompareView.svelte`. Per-layer toggles; each entry carries its source label through the shipped `renderEvidenceRef`; unconfigured layers render as honest empty rows via `HonestControl.svelte` rather than hiding. `planClasses` render as intent capture in `CheckpointSheet.svelte`, recorded on the shipped `Branch.intent` so the choice survives fork and PGN export | Playing Pack A to `plan-commitment` shows three plan-class choices, records the chosen one on the branch, and after commit shows the authored deviation note for the move actually played; toggling Authored off leaves the engine trajectory intact | S2 |
| S4 | Authored boundary → `provenanceMode` → off-spine degradation | `provenanceMode: "authored" \| "instruments_only"` per node via C6. Off the boundary the composer emits **zero** authored claims and the rail switches to an explicitly labeled instruments-only voice | A run playing 4.Nc3 (an authored `interesting_deviation`) stays `authored`; a run off both the spine and the predicates at ply 8 — inside `plyHorizon: 14` — composes `instruments_only` with no authored claims, proving `plyHorizon` caps rather than grants | S2; C6 |
| S5 | Claim triggers and the claim recording site | `feedbackClaims[].when` per C5, translated through `successPredicate` and evaluated on the active path at commit; a satisfied claim is **recorded as an event**, so comparison assembles recorded claims instead of re-evaluating triggers off-cursor. This closes the hole that killed the withdrawn RFC ("recorded claims had no recording site") | Pack A's `tal-tempo` fires only on the branch where h4 was played and …c5 has landed, and is absent on the Be2 branch; comparing the two shows the claim on exactly one side | S2, S4; C5 |
| S6 | Timing windows, luxury accounting, remaining objective types | Move-set encoding for plan completion and opponent arrival, a `luxuryMoveBudget` counter in `pack-orchestrator.ts:61-71`, and translation of the objective types Pack A and the breadth doc use — `preserve_plan_window`, `execute_break`, `prevent_opponent_plan`, `transition_to_endgame`, `win`, `hold` — into shipped `ObjectivePredicate` rules, lifting `pack-validation.ts:160-175` accordingly | Pack A's `preserve_plan_window` emits real `objective.state_changed` events (it emits none today — behaviourally confirmed in `planning/content-era/log.md` session 2 pass (a) #2); the h4 branch consumes its luxury budget and degrades, the Be2 branch preserves | S5; pins C8 |
| S7 | Local instrument layers | Three producers, typed separately and never merged into one number: Stockfish `wdl` and MultiPV `bestline` enqueued alongside the shipped `eval` (`service.ts:406-412`); a Maia layer converting persisted `opponent.move_selected.selection` policy mass into a `human_model_predicted` payload (chosen reply, target rating, plausible alternatives); the deterministic feature extractor with the six written formulas from `rfc/withdrawn/evidence-composer.md`, each emitting a value plus its ply of change | A Pack A comparison shows per branch: an eval trajectory, a WDL band, the Maia reply distribution at the configured rating, and the ply at which pawn structure diverged — four separately-sourced rows, no averaging | S3; pins C7 |
| S8 | Deep analysis mode | User-initiated deeper analysis on any node reachable from Review, with an evidence budget distinct from the ratified 100 ms play profile; provenance already persists `requestedDepth`/`requestedMovetimeMs` per payload. Reveal still applies — deep mode is a depth control, not a timing bypass | Opening a stored Pack A run in Review, requesting deep analysis on the `c5-break` node, and seeing a higher achieved depth recorded in run provenance than the automatic per-move job | S7 |
| S9 | External evidence sources | Syzygy WDL/DTZ for ≤7-piece positions and one corpus source giving frequency, outcomes and historical examples. Both honestly unavailable when unconfigured, surfaced through `GET /capabilities` alongside the existing opponent/judge providers, and rendered as their own layers | An endgame fixture returns a Syzygy verdict with DTZ; a Pack A opening node returns corpus frequencies for the authored spine move and at least one historical example; with both unconfigured the rail shows two honest unavailable rows and every other layer still renders | S3, S7 |
| S10 | Evidence-bound LLM rendering + evidence settings | The renderer's **only** input is the S2 packet — it may word, connect and re-anchor packet members and may not introduce a move, evaluation or strategic claim absent from it; enforced structurally by handing it the packet and never the position. Settings gains real user controls: per-layer default visibility, reveal timing within what the pack permits, provider selection, widening `llm: "none"` per C9 | A packet with authored claims removed produces prose citing only engine and feature members; a golden test asserts no move SAN appears in output that is absent from the packet; setting the provider to none leaves every other layer working | S2, S7, S9; pins C9 |

## 6. Dependencies in and out

**In — already satisfied:**

- Program #1 shell: router, fitted regions and one keyboard ownership model ship
  (`docs/drill-client.md` §Application shell). The rail needs placement only.
- Authored content exercising the fields: Pack A carries 9 annotations,
  5 deviations, 2 claims, 3 plan classes, 3 concepts, an `authoredBoundary` and
  an intent-capture checkpoint.
- Nothing else. Every contract marked pinnable in §4 pins against merged code.

**Out — what this unblocks:**

- **The content-iteration loop, author → play → see explanation → refine.** Today
  it terminates at "play": Pack A's five deviation notes, two claims and nine
  annotations cannot be seen by the person who wrote them, so authoring quality is
  unmeasurable and K10's owner-review clock has nothing to review against. S3
  closes the loop; S2 is what makes S3 honest rather than client-side hiding.
- **K6 (generic explanations) and K4 (comparison not beating engine lines) become
  testable.** Both sit `open` with no evidence (`planning/exploration/gates.md`
  K4/K6 rows) because the instrument does not exist.
- **B2 / B3 / B5 / B7.** The breadth doc warns that a surface showing difference
  without explaining consequence is a mode-menu entry; every subsequent program
  item inherits this layer's absence.
- **B6 authoring review.** The graduation bar (content-era log, codex review #2)
  requires per-assertion grounding, unenforceable until claims carry triggers and
  refs — S5.
- **Program #4's prediction checkpoints** need the Maia distribution as evidence
  (S7) and the checkpoint-interaction renderer (S3).

## 7. Proposed BACKLOG row edits

Row identified by its existing first cell; replacement is the full row.

**(a)** `| Authored explanation vocabulary — claim when triggers, timing-window semantics (planMoves/opponentArrival/luxury accounting), authored-boundary provenanceMode, feedback-packet abstraction, non-Stockfish evidence refs |`

```
| Authored explanation vocabulary — claim `when` triggers, timing-window semantics (planMoves/opponentArrival/luxury accounting), authored-boundary provenanceMode, feedback-packet abstraction, non-Stockfish evidence refs | 📜 **scheduled as breadth program #2, slices S2/S4/S5/S6** (`planning/breadth/evidence-explanation.md`). The revival trigger fired: pack A exists and names the tempo contract it needs. Verified correction to the withdrawn drafts: claim `when` needs **no new vocabulary** — the runtime `ObjectivePredicate` (`packages/runtime/src/objective.ts:60`) is shipped and evaluated, and `successPredicate` (`apps/server/src/pack-orchestrator.ts:88`) is the shipped pack→runtime translation seam. Salvage that stands: boundary is "plyHorizon caps, does not grant"; `pack:` splits per id space; scopes are {branchId,startSeq,endSeq} from the shipped `deriveSegments`; claims need a real recording site, which S5 builds | `planning/breadth/evidence-explanation.md`, `rfc/withdrawn/authoring-contracts-v03.md`, `rfc/withdrawn/evidence-composer.md`, Q7 |
```

**(b)** `| Checkpoint/compare explanation sidebar with selectable evidence layers |`

```
| Checkpoint/compare explanation sidebar with selectable evidence layers | 📜 **scheduled as breadth program #2, slice S3** (`planning/breadth/evidence-explanation.md`). Owner walkthrough 2026-08-11 identified it; the shipped surface is one 52-line `WhyBanner.svelte` that renders only on an objective transition. S3 delivers a stable third region rendering the S2 packet with per-layer toggles, honest empty rows for unconfigured sources, and intent capture recorded on the shipped `Branch.intent` field. Anti-contamination governs timing, not permanent absence | Q8, ADR-0005/0006, `planning/breadth/evidence-explanation.md`, `research/competitor-value-props.md` §WhyThisMove |
```

**(c)** `| Off-spine graceful-degradation contract — how feedback honestly thins out as a run deviates from authored content |`

```
| Off-spine graceful-degradation contract — how feedback honestly thins out as a run deviates from authored content | 📜 **scheduled as breadth program #2, slice S4** (`planning/breadth/evidence-explanation.md`). Encoding pinned: `provenanceMode` computes from `authoredBoundary` against `FenPredicate.transposeKey` (`packages/runtime/src/objective.ts:42`), the same transposition test `theory_strict` already uses; `plyHorizon` caps authored reach and does not grant it (validated against author intuition, pack A session 1). Off the boundary the composer emits zero authored claims and the rail switches to a labeled instruments-only voice — ADR-0005 pressure is highest here | Q4a, Q8, `planning/breadth/evidence-explanation.md`, `arch/04 §Stage B`, `arch/09 §off-objective` |
```

**(d)** `| LLM as renderer of validated evidence (never source of truth) |`

```
| LLM as renderer of validated evidence (never source of truth) | 📜 **scheduled as breadth program #2, slice S10** (`planning/breadth/evidence-explanation.md`). Bounded by ADR-0005; wording and connection only. Structural enforcement rather than prompt instruction: the renderer receives the S2 feedback packet and never the position. Contract not yet pinnable — `apps/server/src/capabilities.ts:33` declares `llm: "none"` as a literal type with no provider config; the packet plus one configured provider pins it | Q8, `planning/breadth/evidence-explanation.md`, `arch/09`, `arch/rfcs/RFC-0006` |
```

**(e)** `| Full evidence/explanation surface |`

```
| Full evidence/explanation surface | Authored + Stockfish (eval/WDL/MultiPV) + Maia (reply/policy mass/alternatives) + corpus/history + Syzygy + deterministic features + evidence-bound LLM, timing controlled. **Verified 2026-08-12:** transport ships (typed payloads, `evidence.attached`, ref grammar, sentence table, server-side withholding); composition, surface, and six of seven sources are absent. Ten-slice plan in `planning/breadth/evidence-explanation.md` | B4, `03-product-breadth.md`, `planning/breadth/evidence-explanation.md`, `arch/09` |
```

**(f)** `| Evidence-backed feedback (claims + evidence refs + uncertainty; timing events over eval deltas) |`

```
| Evidence-backed feedback (claims + evidence refs + uncertainty; timing events over eval deltas) | 📜 · quality = exploration **Q8** · scheduled as breadth program #2, slices S2/S5/S6 | `planning/breadth/evidence-explanation.md`, `arch/rfcs/RFC-0006` sketch, `arch/09`, `arch/schemas/feedback_packet.schema.json` |
```

## 8. Owner-level questions

Four genuine forks in product intent. Everything else here is sequencing.

**Q-E1 — Does the rail render `reviewStatus: draft` authored prose?** Pack A's
provenance states every strategic claim is UNGROUNDED, and the graduation bar
blocks promotion. If the rail renders only reviewed content, the author never sees
their prose in situ and the content-iteration loop stays broken until review —
which review needs the loop to perform. If it renders draft prose behind a visible
ungrounded marker, the loop closes but unreviewed chess assertions reach a screen.
Both readings are defensible under ADR-0001.

**Q-E2 — Off-spine during committed play: silent, or instruments-only live?**
ADR-0006 withholds feedback during committed play. Off the authored boundary there
is no authored answer to contaminate, but engine evidence still contaminates. Two
coherent products: (i) withhold everything until the checkpoint regardless of
provenance mode, or (ii) show an instruments-only indicator live so the learner
knows they have left taught territory. (ii) is closer to honest degradation; (i) is
closer to ADR-0006.

**Q-E3 — Corpus evidence: live service or authored frozen examples?** A live
Lichess explorer integration makes B4 depend on a network service and an
unresolved 401 investigation; pack-authored frozen historical examples keep the
product local-first (ADR-0004) at the cost of author effort per pack and
staleness. This decides whether S9 is an integration or an authoring field, and it
touches Q2's content-rights axis.

**Q-E4 — Are `hypothesis`-typed claims rendered at all?** Pack A's `tal-tempo`
declares `evidenceTypes: ["author_principle", "hypothesis"]`. Either marked
speculation is first-class coaching voice (rendered with an explicit uncertainty
marker), or it appears only in deep analysis, or authors may not ship it. This is
the boundary between a coach saying *I think* and the dashboard anti-pattern — a
product-voice ruling, not a technical one.
