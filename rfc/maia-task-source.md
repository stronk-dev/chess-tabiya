# RFC: Maia task source for selection and Inspector

- **Status:** draft — resolves the D3370/D3363 source-contract gaps; independent review required, not implementation authorization
- **Author:** codex
- **Created:** 2026-10-09
- **Design refs:** `design/03-product-breadth.md` (shared evidence foundation); `design/05-in-run-experience.md` (explicit Inspector, disclosure and grounded help); ADR-0005 (no manufactured chess truth)
- **Exploration gate:** implementing `provider-exchange-and-execution.md` §§6/10; measured D3370/D3363; `design/research/maia-policy-scalar-stability.md` §§1/4; current production controls in `apps/server/src/opponent-selector.test.ts` and `human-split-boundary.test.ts`
- **Depends on:** `provider-exchange-and-execution.md`; `provider-protocol-register.md`; `evidence-value-authority.md`; existing provider health, presentation and recorded-run authority
- **Parent / amends:** provider exchange §6 and the actual Maia callers governed by `rfc/archive/engine-request-contract.md` §10; preserves both predecessors
- **Planning:** existing `planning/provider-exchange-and-execution/`; no new delivery queue
- **Supersedes / superseded by:** —

```tabiya-claims
provider-protocol | members maia_inference_task_v1 | same-task sampled selection and reported candidate window; exact Inspector distribution without a fabricated played move
```

## Summary

Retain two different outputs of one Maia task: the actual terminating sampled move and the
reported candidate window. Bots consume the former when their existing mode calls for it;
Inspector displays the latter at the requested node. Neither is manufactured from the other.
Use the existing shared provider exchange, source factory and presentation machinery. Do not
change sampling, strength, personality, deadlines, pack content or assistance permissions.

This is the missing migration contract, not a new bot algorithm. Accepting it does not accept
the separate bot-policy/calibration proposals, deeper search or every provider migration.

## Located problem and compatibility boundary

Current production behavior, directly checked at these symbols:

| Boundary | Current fact and source |
|---|---|
| `OpponentSelector.#humanCommon` | Plays `bestMove`, not probability argmax. An off-window sample triggers one more task; only the final task's window survives, with a mass-less `offWindow` record if necessary. `opponent-selector.ts`, `opponent-selector.test.ts`. |
| `OpponentSelector.#maia` | Resets advertised SelfElo/OppoElo defaults, applies the honored band, temperature/top-p and capped MultiPV, then sends ordered start-FEN/history and `go`. The width floor can exceed the legal-move count. Same files. |
| `parseMaiaPolicyPage` | Keeps a bounded policy page, not terminal selection, ranks, optional score or WDL. `provider-parsers.ts`; provider exchange §6. |
| GET `human-split` | Queries next moves at the requested node, removes `offWindow`, and returns no observed/played move. It rechecks read/disclosure/subject authority around I/O. `rest.ts`; `human-split-boundary.test.ts`. |
| Inspector parser/renderer | Consumes actual reported rows and honored applied band; requested band is not a calibrated player rating. `human-evidence-response.ts`, `presentation-consumer-adapters.ts`; D3464/D3474. |

The earlier 2,100-probe research separates stable reported policy from varying terminating
selection; it does not authorize replacing the sampler with a draw from that reported policy.
Inherited measurement: `design/research/maia-policy-scalar-stability.md` §§1/4 [P]. The four
current permanent selector controls independently pin non-argmax selection, final-task-only
windows, width above legal count, and distinct histories reaching identical six-field FENs [V].
They are compatibility tests, not a new real-model measurement or calibration discharge.

## Specification

### 1. One task operation, distinct from the existing page

Add the following exact tuple through the existing provider resource:

| Identity | Value |
|---|---|
| operation | `maia.inference_task@1` |
| parser | `parse.maia_inference_task@1` |
| source | `human.maia.inference_task@1` |
| sole factory | `createHumanMaiaInferenceTaskV1Evidence` |
| operator CLI arm | `maia-inference-task` |

Keep `maia.policy_page@1`, its request/parser/source, and both occurrence projections unchanged.
Do not widen its legal-width bound, add bestmove to its frozen payload or forge a page delivery
whose operation is different from the task that ran. No second scheduler, transport, cache,
digest domain, health authority or resource register is introduced.

```ts
interface MaiaInferenceTaskRequest {
  readonly sampleRequestId: string; // server-owned canonical UUID for this requested draw
  readonly position: MaiaPositionRequest;
  readonly requestedModel: { readonly id: string; readonly version: string };
  readonly band: number;
  readonly temperature: number;
  readonly topP: number;
  readonly requestedWidth: number;
  readonly timeoutMs: number;
}

interface MaiaInferenceTaskResult {
  readonly request: MaiaInferenceTaskRequest;
  readonly appliedBand: number;
  readonly coverage: "bounded_reported_window";
  readonly candidates: readonly {
    readonly moveUci: string;
    readonly rank: number;
    readonly mass: number | null;
    readonly scoreCp: number | null;
    readonly wdl: { readonly win: number; readonly draw: number; readonly loss: number } | null;
  }[];
  readonly termination: {
    readonly rawBestMoveUci: string | null;
    readonly moveUci: string | null;
  };
}
```

The source payload is the existing operation-keyed
`ProviderEvidenceDelivery<MaiaInferenceTaskResult, "maia.inference_task@1">`, never the bare result.
The shared acquisition already retains actual model/container/options/generation and captured
commands; do not duplicate actual identity as a claim from the request.

Request admission reuses the current page's pinned model/source, honored-band and decimal-option
rules, **except** requested width is bounded by the advertised positive MultiPV range, not by
legal-move count. Returning fewer legal candidates than the requested width is lawful. This
preserves the selection mode's `max(8, legal count)` floor instead of silently replacing it with
the page operation's smaller request. All numbers must satisfy the existing finite/safe-integer
bounds; unknown models, clamping inside the descriptor and supplied command arrays refuse.

The selector resolves defaults and its existing cap once before constructing the request.
Omitted band uses `appliedTargetElo`'s advertised default, not an invented rating. Temperature
and top-p use the existing defaults 0.8/0.92; a requested value remains exact. Width uses the
current mode's existing calculation. The descriptor validates, never recalculates those operands.
The new modern source requires an explicitly honored band and captured pinned model. Unbanded
or nonmatching standalone fixtures remain explicitly legacy; modern failure cannot fall back
to them. This proposal does not add a model-family contract for unsupported engines.

The descriptor sends advertised SelfElo/OppoElo defaults when present, then Elo, Temperature,
TopP, MultiPV, exact position/history and `go`, in that order, matching the current selector.
Check option defaults and generation both before admission and against the same-task capture.
No caller overrides auxiliary defaults. No reset omitted by the current selector is invented
as a compatibility requirement; supervisor isolation and the existing ready fence still apply.
Exact-FEN and history-conditioned requests retain their separate pending/retained identities.
Equal reached FENs do not collapse different ordered histories.

**A sampled draw is not a reusable deterministic policy query.** The current shared scheduler
retains successful results and joins identical pending requests (`provider-exchange.ts#get`).
Using only model/position/options as this task's identity would replay the first off-window
sample on retry and could give unrelated sessions the same draw. Therefore `sampleRequestId`
is part of the normalized request but is never an engine seed or UCI command. The server mints
one canonical UUID for each new logical draw; the existing coalesced selection flight owns it.
An off-window retry mints a new id, as does each independent child task or new selection.
Neither public selection nor Inspector HTTP accepts this field from a learner. The authorized
operator CLI may supply it as part of its typed request, not through a public cache-probing API.

Reissuing the same id and exact request means retrieving the **same observation**, with normal
pending joins/retention and truthful receipt; it does not request another draw. Different ids
never share pending/retained results even when every model/position/option byte agrees. The
existing selection cache remains responsible for exact final-selection reuse and saved decisions
remain by-record replay. Do not add a generic cache-bypass switch, invalidate another caller's
cache, choose a different seed, or pretend the UUID makes Maia's output reproducible. Inject a
UUID generator in tests; no new identity/digest domain or persistent table.

### 2. Parser retains independent reported operands

Read only output belonging to this task, ending at its first valid terminal bestmove. Later
rows, another task's output, a crossed command image/model/generation and malformed termination
refuse. Null termination is legal only at a rules-terminal root; existing learner selection
continues to refuse terminal roots before provider work.

For candidate rows, preserve the current selector's valid interpretation: reported `multipv`
rank and first PV move; latest row for the same canonical move; ascending reported rank;
optional policy mass; unbounded cp/WDL only from that same row. Normalize move identity from
the reached request FEN, including castling/promotion. Reject illegal moves, invalid ranks,
ambiguous duplicate final ranks, invalid probabilities and malformed numeric operands. A
bounded score cannot provide exact cp or WDL. Never assemble operands from different rows.
Missing operands become null internally and are omitted in the old narrow selection shape.
Valid rank gaps remain rank gaps, not relabelled contiguous ranks.

Probability validation uses the existing `PolicyMassError`/model-scalar conventions, including
their measured floating-point tolerance; do not introduce a tighter new sum rule. Missing mass
remains unknown, never zero or an invented normalized vector. No row marked `offWindow` comes
from the provider; that marker belongs only to the existing selection transformation below.

Normalize the terminal sampled move independently. It may differ from every candidate or from
the highest policy/rank row. Do not add it to the reported window or attach invented probability,
score, WDL or model rank. The parser creates no move grade, strategic intent or personality claim.

### 3. Preserve actual opponent behavior

Register one exact machine-only consumer `opponent.maia_task@1` accepting this whole source with
required-source `operation_unavailable`. Its complete execution contract compiles before each
acquisition. Source admission checks operation, registered factory, requested position/history,
options and generation. All production callers of `#maia` use its admitted result, not raw lines:

| Caller | Required unchanged transformation |
|---|---|
| `human_common` | Play the actual terminal sample. If outside its window, perform the existing one retry under the same total deadline. Keep only that final task's result; if still outside, append existing mass-less `offWindow` record with max rank + 1. Never merge windows or substitute a policy argmax. |
| `theory_strict` | Filter the reported rows by legal authored spine children and use the existing seeded policy/rank/uniform rules, including the existing degraded fallback. It does not play task bestmove on-spine. Off-spine still uses `human_common`. |
| `practical_resistance` | Read each child task's reported rows under the existing four-reply bound and total deadline; retain exact child history and existing conceding-mass calculation/tie break. The terminal sample does not become that metric's move or probability. |
| explicit standalone/fixtures | Keep the legacy contract and its tests separate, with no fallback from a failed supplied modern source. Do not call standalone output a shared provider delivery. |

The transport wrapper must preserve independent cancellation, actual execution deadlines and
provider-health settlement. A cached delivery may replay only its identical requested draw;
it is source reuse, not a new sample, live execution or health healing. The existing settled
**selection** cache and stored run decisions keep
their current meaning; this source migration cannot erase or resample a recorded decision.
Identical source results can serve distinct selection policies without claiming those policies
or final selections are identical.

The modern human-common selection flight and bounded settled selection entry retain the exact
final task's sealed source alongside their existing narrow selection. Add an internal typed
`selectWithMaiaEvidence(request, options)` result for Inspector, sharing those same flights and
entries; ordinary `select`/`selectWithReceipt` keep their public shapes. It returns the existing
selection/receipt plus that final admitted source, never an ambient last-task pointer. A cache
hit preserves the original source acquisition identity/time and existing generation/TTL checks;
it does not relabel the old execution live or consult a different shared-cache entry. The fixed
512-entry bound applies to these retained source references too. Do not merge failed/first-task
windows or retain additional tasks in a successful entry. Explicit legacy selections carry no
modern source and remain the separate v1 path; a supplied modern-source failure cannot be
silently converted to v1. Inspector never independently resamples a cached final selection.

No new run-schema or SQL format is claimed. Existing selected-move events retain their narrow
shape and by-record replay. The new source is process-local/retained like the shared page.
Durable whole-source storage for legacy selection events would require its own explicit format
contract; do not fabricate a transcript from an old event or claim exact recorded-source
satisfaction for a source that was not stored. Registered bot-profile inference already uses
its own page/durable delivery path and is not silently redirected by this RFC.

### 4. Inspector has a node distribution, not an observed move

Add `derived.maia.node_distribution@1` through the sole registered value factory, with literal
inputs `[human.maia.inference_task@1, run.record.position@1]`. Its additional sealed
`ResolvedRunSubject` must be `run_node`, not caller-authored run/FEN/history. Before deriving,
match the recorded position and exact selected historical branch path to the task's requested
start FEN and every prior UCI through that node. The matched head/node/branch remain ancestry.
No active-cursor substitution, preceding-edge query or sibling transposition join is allowed.

Use this source for the currently requested node's next-move window. The route uses the same
internal `selectWithMaiaEvidence` flight/cache and at-most-two-task window selection as
`human_common`, but never commits or claims either terminal sample as a learner move. The
factory retains the final genuine source and its reported candidates only; it never synthesizes
an `offWindow` distribution row. This is distinct from both existing played-move occurrence
projections, which remain unchanged.

Add exact `inspector.human_split@2` consumer, operation and registered renderer. Its only binding
is the new node distribution, with required-source `operation_unavailable`, the existing
postcommit/review/analysis timings and list/panel candidate disclosure. Full Inspector's
accepted source branch must request this exact successor; do not add it to ordinary hints,
voice, coaching selection or any module that did not already permit the distribution.

Keep the authenticated route, node subject, permissions and before/after asynchronous rechecks.
The modern page carries the existing node/engine/requested-band/candidate operands plus its
registered presentation receipt. The old exact wire/parser remains a separate explicit v1 arm.
The modern parser validates the registered component, exact node and candidate operand equality
before display. It derives no evidence from raw HTTP rows and accepts no raw fallback if modern
receipt validation fails. Applied band comes only from the honored source; retain the existing
human-model, non-rating disclaimer and no-data/missing-mass distinctions.

A private response must not serialize the whole source, prompts, task transcripts, source cache
keys or terminal sampled move merely because the registered distribution has source ancestry.
The displayed window remains reported bounded model choice, not human frequency, complete
legal coverage, move quality, a predicted observed move or a calibrated player rating.

#### 4.1 D3841 candidate WDL companion — still draft

The policy-only `maia.policy_page@1` cannot satisfy this obligation: its frozen candidates contain
only move and probability. Add the separate `derived.maia.node_candidate_wdl@1`, sole proposed
`createDerivedMaiaNodeCandidateWdlV1Evidence`, with literal ordered inputs
[`human.maia.inference_task@1`,`run.record.position@1`] and the same sealed run-node/history
admission as node_distribution. Its exact arm is `{task,position,resolved}`; neither a bare page,
observed move, source lookup key nor arbitrary candidate list is accepted. The whole task's
machine-only answer image retains evaluation as well as candidate/selected-move operands; the
node distribution remains candidate_moves-only, and this new projection is evaluation-only.
Mixed model/recorded-position grounding is declared_convention, measured/reported; there is no
grade, forecasted observed move or calibrated strength meaning.

The output is exactly `{task,position,nodeId,engine,requestedBand,appliedBand,candidates}`, where
task/position are the complete sealed inputs retained internally. Engine and applied band derive
only from that actual final source; requested band remains separately labelled, never a player
rating. Candidates preserve final-task order and contain exactly moveUci, reported rank and the
same row's reported win/draw/loss. Omit rows whose WDL is null; do not fill missing values, merge
tasks/windows, renormalize, rank by WDL or add the sampled off-window move. An empty WDL result
returns the existing typed `unavailable("empty_population")`; Full Inspector maps that one
source-local result to source_absent with its fixed missing-reported-WDL disclosure, not provider
failure/no_witness/zero probabilities. Malformed/crossed task data remains failure.

Full Inspector obtains this source from the same internal `selectWithMaiaEvidence` final-task
flight/cache and exact requested-node authority as the distribution. It never resamples only to
find more favorable WDL; a retained task remains that observation. If two independently acquired
pages do not have the same task identity, their values cannot be labelled one shared observation.
These node topics are not the old branch's recorded selection distribution; old events cannot
reconstruct a missing task. The new derived projections bind only to their separately accepted
exact Inspector consumers, not ordinary voice/hints, grading, player classification or pack truth.

Before delivery, register an exact @2 Full Inspector pair and a closed evaluation-valued renderer
over canonical legal moves/reported rank/WDL, model identity and honest requested/applied band
wording. Retain the human-model/non-rating guard. Neither serialized task/transcript/source keys
nor terminal sampled move is a public operand. Actual task/history/node substitutions, missing/
partial WDL, no-row/zero-value distinctions, final-window identity, cancellation/access changes
and authenticated desktop/phone delivery are acceptance obligations, not proved by this paragraph.
The existing v1 page, old candidate-WDL factory and standalone Inspector paths remain unchanged.

### 5. Adoption, absence and retirement

Implementation proof crosses application composition, each opponent mode, authenticated
Inspector HTTP, shared web parser/renderer, cancellation/recovery, and unchanged saved-run replay.
Constructor tests, a registered source or an operator CLI alone are insufficient.

Return the existing typed provider unavailable/failure boundaries without raw protocol errors.
Missing source remains unavailable, never an empty distribution or a random/Stockfish reply.
Broken exact execution prevents any I/O; revoked read or closed disclosure prevents display.
Fixture deployments continue to label mock/standalone behavior honestly.

Freeze every predecessor declaration and field. Use normal append-only capability registration,
sole factory profiles and source/consumer census. Retire `human.maia.policy@1` only after **all**
its existing consumers, including Compare/Story derivatives, have migrated under accepted
contracts and the actual callable census is zero. This RFC migrates the two named doors; it
does not authorize deleting other legacy consumers to make that census green. There is no
pack/run schema, storage migration, content wave or implicit bot-calibration approval.

## Acceptance criteria

1. The registered operation/parser/factory/CLI tuple agrees. All six existing operations and
   frozen page/occurrence meanings survive; no unclaimed provider member or second scheduler.
2. A real pinned Maia task traverses descriptor → shared exchange → parser → sole factory →
   exact consumer. Requested band/decimals/width/history, container/options/generation and
   first terminal result agree. Mock tests do not discharge this real-model requirement.
3. Non-argmax and outside-window samples remain distinct from reported probabilities. Two
   tasks with different windows retain only final-task candidates, and the existing retry
   deadline/cancellation and mass-less residual semantics survive without a third task.
4. A live non-terminal position with fewer than eight legal moves preserves its selection
   width floor; page@1 still refuses its own out-of-legal-count width. No descriptor clamping.
5. Equal complete reached FENs with distinct ordered histories have distinct task identities;
   exact-FEN vs history requests, cross-node/head/branch/model/generation and copied/JSON/spread
   deliveries refuse. A warmed first draw cannot satisfy a retry/new session/child with a new
   sampleRequestId; an exact replay of that id returns the same observation. Actual pending joins
   and retained-cache controls prove both cases. Null terminal samples never become playable moves.
6. Existing theory-strict mass/rank/uniform and practical-resistance child-history cases stay
   byte-compatible for equal valid source tasks. Missing policy mass is not fabricated, and a
   sampled bestmove does not become conceding probability or a seeded theory choice.
7. Authenticated Inspector queries the actual requested node, retains final-task reported rows,
   carries a v2 presentation receipt and renders through the strict shared client. At least
   desktop and touch-phone journeys prove explicit request, missing source, failure/retry,
   subject change and grant/disclosure revocation with unchanged recorded play.
8. A sampled move, unfiltered whole source or raw transcript never enters modern Inspector,
   voice or an ordinary hint. Applied vs requested band/non-rating wording remains truthful.
9. Every affected production caller uses the supplied modern source without raw fallback.
   Independent cancellation and health recovery/cache generation controls pass. Old selection
   events still replay their recorded moves after reload without another provider request.
10. Full normal software/performance/content/browser/governance gates pass; budgets, floors,
    assertions and schema readers are not weakened. Track the exact two migrated doors and
    leave broader source retirement/availability/bot qualification open when not discharged.

## Deviations from design

None proposed. This repairs the shared source boundary; it creates no new assistance rung,
sampling policy, learner entry requirement or LLM-authored chess judgement.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | [[D3370]] preserve actual sampled Maia selection through a registered shared task source | `maia-task-source` | Criteria 1–6/9/10 through actual production selector and real pinned Maia | |
| D2 | [[D3363]] exact requested-node distribution through a separate sealed derivation and registered Inspector consumer | `maia-task-source` | Criteria 5/7/8/10 through authenticated HTTP and actual browser | |

## Open questions

1. Independent review must check the complete current candidate parser compatibility, especially
   repeated rows/ranks, optional cp/WDL and the distinction between invalid protocol and missing
   mass. Any valid old result the new parser cannot represent must return this draft for repair,
   not be waved through as an implementation detail.
2. Confirm the exact modern Inspector wire discriminator/receipt dispatch against retained v1
   clients before acceptance. No structural duck typing or generic evidence payload is permitted.

## Changelog

- 2026-10-15: D3841 authors the separate evaluation-valued node candidate-WDL companion over
  the genuine final task and recorded position. Missing WDL remains typed absence, not model
  failure, zero probabilities or a sampled-move inference. Independent review and actual
  task/source/consumer adoption still precede implementation; all page predecessors remain.
- 2026-10-09: authored against current production/task/parser/Inspector boundaries and four
  permanent compatibility controls. Resource claim and durable work ownership recorded together;
  independent review/acceptance precedes production source or consumer changes.
