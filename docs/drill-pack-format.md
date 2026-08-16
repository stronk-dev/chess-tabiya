# Drill pack format

The implemented drill-pack foundation is a living Draft 2020-12 JSON Schema at
`schemas/drill_pack.schema.json`. It describes format v0.22; a pack's own
`version` remains semver and is part of its digest.

Trajectory packs may declare `legs`; see `docs/trajectory-drill.md`. The format
supplies leg entries and objectives, not authored position jumps or automatic phase
detection.

Version 0.8 narrows publication status to `schema_example`, `draft`, or `published`.
Publication channel is server-derived and deliberately absent from the document; see
`docs/pack-studio.md`.

Version 0.9 removes prediction `grading`. A prediction interaction carries only
`type: prediction` and optional `flipBoard`; recorded policy mass and rank are
shown as numbers and never turned into a correctness verdict.

Version 0.13 retains v0.12's closed opponent policy and v0.11's additive shape references. It widens
v0.10's structural grammar from twelve to fifteen leaves with `bishop_on_shade`, `pawn_count`, and
`king_opposition`, and adds the `mirrored` and bounded `quantified` expression nodes. Every added
object is closed. Structural facts remain deterministic FEN arithmetic, derive from the run FEN,
and do not change the run schema or storage version; see `docs/structural-reading.md`.

Version 0.14 adds the executable `immediate_guard` feedback policy and an optional closed
`guard.evalSwingCp` tuning block. The threshold defaults to 200 centipawns; `null` disables
the recorded-engine tier while leaving deterministic rules tiers active. A `guard` block on
any other policy is refused.

Version 0.15 adds the closed `stated_reasoning` checkpoint interaction. It carries
1–12 keyed points whose grounds are structural expressions, referenced shape plans,
authored spine moves, or typed feedback claims. Match phrases are author-owned and
digest-versioned; the product has no global synonym or semantic-grading vocabulary.

Version 0.16 adds root-addressable `atStart` checkpoint and deviation anchors,
machine-proved `variantOf` sibling relations, optional per-leg length targets, and
guard windows/overrides with independently switchable rules, centipawn, and forced-mate
signals. Branch length targets now accept 2–40 plies; Plan Drill values above 20 carry a
warning. Syzygy root declarations admit determinate `cursed-win` and `blessed-loss`
categories under objective-specific admission rules, and `rules_fact: draw` is executable.

Version 0.17 replaces the inert checkpoint-local timing pair with top-level timing
windows. A window declares an opening commitment, ordered closes, a move-set readiness
condition, tolerated moves, and a luxury-move budget. Checkpoints consume the derived
ledger through `atWindow`; objectives consume it through `timing_window` conditions.
The seven runtime verdicts are `unopened`, `open`, `in_time`, `over_budget`, `too_slow`,
`outpaced`, and `premature`. Authored `outpaced` grading is opt-in per window; unauthored
contexts publish failure as their default, though automatic window detection is not part
of this format.

Version 0.18 widens the shared structural grammar to eighteen feature kinds with all-role
`piece_count`, current `king_zone`, and static `piece_distance`. The legacy `pawn_count` leaf and
`piece_reach_count` with `scope: every` are deprecated with authoring warnings. It adds the seventh
success-condition kind, `plan_consequence`, which resolves a plan class through its referenced
shape plan's structural success signature and fails closed when that consequence cannot be checked.
Shape references now accept either a bare id (present on an authored spine) or
`{shape, relation: "present" | "prospective"}`; only present references participate in detection
and grading. These are pack/shape authoring changes only: run schema and storage are unchanged.

Version 0.21 separates three deviation axes without changing the existing class. Optional
`mistake` is a non-empty set of `plan`, `timing`, and `tactical`; learner-visible theory verdicts
render every declared value in canonical order. Optional `cost` records an author-declared
centipawn, mate, or explicitly unmeasurable cost and is not evidence-backed by itself. A timing
mistake may reference a declared timing window. Immediate-guard packs warn when a tactical cost
reaches no configured threshold, and guard overrides may scope a threshold to one legal UCI move.
Human-judgment evidence refusals cover both the whole `mistake` array and its element pointers.

Version 0.22 adds `transition_feature`, a success condition evaluated over a committed authored
edge rather than one position. Its closed sibling grammar, evidence refs, and coverage refusals
are described in `docs/transition-primitives.md`. The change is additive and does not alter pack
digests.

Version 0.23 makes deviation cost a machine-bound measurement. `verify-draft` may stamp
centipawn, mate, or tablebase-category cost only from the current engine or tablebase invocation;
an unbacked or contradicted declaration is refused rather than trusted. Immediate guards gain a
closed `conditions` list for engine evaluation/mate and tablebase category/DTZ regressions. The
legacy scalar guard fields desugar to the same list, so existing packs keep their behavior.
That desugaring is shared by runtime and validation. Explicit scalar shorthands remain active
beside `conditions[]`, and per-anchor scalar overrides replace matching arms in place without
reordering unrelated authored conditions.
Tablebase conditions are learner-relative, require both probes at seven pieces or fewer, and cite
the exact `tablebase:` record that fired them.

The already-declared `practical_resistance` opponent policy is executable
without changing pack bytes or the pack-schema version. Its two-provider
capability gate, named refusals, and persisted measurement live in the run and
engine contracts; see `docs/engine-workers.md`.

`schemas/drill_pack.example.json` is the living Najdorf schema fixture. The
fixture and schema under `archive/brief-v2/` remain frozen v0.1 inputs and are
tested only against each other. The v0.1 fixture intentionally fails v0.18 because
it has no required `feedbackPolicy` and uses superseded fields.

## Implemented v0.5 shape

- `spine` is an optional array of first-move nodes rooted at the pack's start
  FEN. Each recursive node has a pack-unique `id`, UCI, SAN, `children`, and
  optional string annotations. The start position itself is implicit.
- `feedbackPolicy` is required and is one of `delayed_checkpoint`, `segment_end`,
  or `immediate_guard`. The guard is post-commit and non-blocking: the opponent starts
  the consequence before any rewind offer appears.
- A checkpoint has one trigger and may have an `intent_capture` or `prediction`
  interaction, or a `stated_reasoning` interaction. Intent capture names plan-class
  IDs. Prediction carries an optional board flip and records policy mass without a
  verdict. Stated reasoning names grounded key points and their literal match phrases.
- The frozen simple trigger vocabulary is `atPly`, `atSpineNode`, `fenPredicate`,
  `atStart`, and `materialBalance`. `atWindow` is the separate checkpoint form for a
  declared window verdict or live spend threshold; keeping it out of simple triggers
  prevents windows from recursively opening on other windows.
- `authoredBoundary` contains at least one of spine-node IDs, a non-negative ply
  horizon, or FEN predicates.
- `deviations` replaces `acceptedAlternatives`. Every entry identifies a spine
  node, FEN, or the start position, a UCI move, and one required classification. It may also mark the
  move off-objective, carry a note, declare one or more mistake kinds, record a machine-bound cost, and
  link a timing mistake to a timing window.
- `difficulty.branchLengthTarget` accepts 2–40 plies. The declared 2–8 on-ramp
  and 8–20 Plan bands remain teaching targets rather than schema ceilings. Rating bands may begin at 1000.
- `capture_intent` is no longer accepted in checkpoint `actions`; it is represented
  by the typed interaction. The reserved provenance source `session_distilled` is
  accepted.
- `objective` is closed. Outcome objectives (`win`, `hold`, `save`, and
  `resist`) require `grading`: an authored, Syzygy-declared, or fixed-depth engine root assessment
  plus a checkpoint or terminal resolution. `successConditions` is a closed
  union of checkpoint, outcome, material-balance, rules-fact, structural, timing-window, and
  plan-consequence conditions;
  conditions may declare their target state and applicable non-terminal source
  states.

The format schema intentionally leaves `checkpoints[].actions` structurally
open, but the shipped registry and `pack-check` close the executable v1
vocabulary to `compare_branches`. An empty array means the checkpoint offers
no pack-selectable action. Any other value fails runtime validation with its
JSON Pointer and the allowed set; vocabulary grows only when a consumer grows.
This is an executable-policy lint rather than a JSON-Schema enum, so it does
not require the earlier grading amendment; grading is the change that advanced
the schema `$id`.

## Semantic authoring lint

JSON Schema validates structure. `lintDrillPack` from
`@chess-tabiya/schema/drill-pack` handles relationships and chess legality that
the schema cannot express:

- parses the start as legal standard chess;
- walks every recursive spine path with chessops;
- rejects illegal UCI, disagreeing SAN, duplicate spine-node IDs, and references
  to unknown spine nodes;
- warns when a segment has more than two prediction checkpoints.

Static packs do not contain segment IDs. A caller may supply checkpoint groupings
from authoring/runtime context; without them, the lint conservatively treats the
whole pack as one segment. Prediction density is a warning, not schema rejection.

The server-side authoring validator additionally rejects pack semantics the
current product cannot execute, including unknown checkpoint actions,
unsupported opponent and feedback policies, and unsupported objective
conditions. These checks are shared by `make pack-check` and registry loading,
so an authoring no-op cannot validate locally and then enter the served
catalogue.

Objective validation is compiler-backed and total. It compiles the root
objective and every trajectory-leg objective before admission, using the same
rule compiler play uses. Compiler failures become pointed validation issues,
never escaping stack traces. The compiler specifically refuses structural
conditions made only from placement or quantified-piece nodes because they
cannot derive a grounded evidence reference. An unexpected compiler failure is
reported as `OBJECTIVE_RULES_UNCOMPILABLE` rather than entering the catalogue.

The same objective invariants apply at `/objective` and at every
`/legs/{index}/objective`: grading requirements, resolution checkpoints,
monotone transitions, absorbing-state restrictions, and supported conditions.
Decimal equality against integral material balance is refused as impossible;
a `rules_fact` winner is accepted only for checkmate. A pack that passes
`pack-check` therefore cannot reach a rule-compilation path that validation did
not exercise first.

Stated-reasoning validation refuses duplicate point IDs, colliding phrases,
unresolvable grounds, and structural grounds false at statically known checkpoint
positions. Under `segment_end`, the checkpoint must be statically provable as the end
of an existing segment; a dynamic or first checkpoint is refused rather than risking
either an evidence leak or an unreplayable redacted mutation snapshot.

Outcome grading adds the typed validation codes
`OBJECTIVE_GRADING_REQUIRED`, `OBJECTIVE_GRADING_UNSUPPORTED`,
`OBJECTIVE_RESOLUTION_UNKNOWN`, `OBJECTIVE_RESIST_NEEDS_CHECKPOINT`,
`OBJECTIVE_SELF_TRANSITION`, `OBJECTIVE_ABSORBING_WITHOUT_OUTCOME`,
`OBJECTIVE_OUTCOME_TARGET_INVALID`, `OBJECTIVE_DEGRADED_IS_ONE_WAY`,
`SYZYGY_ASSESSMENT_OUT_OF_RANGE`, `SYZYGY_ASSESSMENT_MISMATCH`,
`CHECKPOINT_UNREACHABLE_AT_ROOT`, and `CHECKPOINT_TRUE_AT_ROOT`. Candidate
promotion additionally uses `SYZYGY_ASSESSMENT_UNGROUNDED`. The behavior behind
these codes is canonical in `outcome-drill-grading.md`.

The required negative fixtures live in `schemas/fixtures/drill-pack/`. The illegal
spine fixture is structurally schema-valid and fails semantic lint; the other
fixtures fail their targeted schema constraint.

## Digest and URLs

`digestDrillPack` canonicalizes the complete JSON document—including `version`—
with [RFC 8785 JCS](https://www.rfc-editor.org/rfc/rfc8785.html), hashes the UTF-8
bytes with SHA-256, and returns `sha256:<lowercase hex>`. Object serialization
order therefore does not change pack identity.

The address helpers format, parse, and resolve:

- `/drill/<packId>@<version>[/<spineNodeId>]` against a supplied pack registry;
- `/fen/<encodedFen>/<objectiveType>` into an ad-hoc start/objective definition.

The bare FEN is validated as standard chess and encoded with `encodeURIComponent`,
so the complete FEN occupies one path segment and round-trips without losing
slashes or spaces.

## Pack and run PGN round-trip

`exportPackRunPgn` from `@chess-tabiya/runtime` combines two kinds of paths into
one legal PGN variation tree:

- every authored leaf path under the pack's `spine`;
- every branch actually present in the run.

Before merging, it applies the schema package's semantic lint and RFC 8785 digest,
then requires the pack ID, digest, and canonical start FEN to match the run. It
also validates the source run with the ordinary runtime PGN exporter. Exact move-
sequence duplicates are collapsed; a played deviation remains a separate
variation from its longest shared authored prefix. The resulting tree is passed
back through the runtime's legal-move/SAN/FEN validation and PGN serializer rather
than maintaining a second chess or serialization implementation.

Authored and played variation labels use `authored:<spine-leaf-id>` and
`run:<branch-label>` comments. These labels identify provenance of paths, not
reviewed coaching annotations.

The integration test loads the living amended Najdorf fixture, plays its authored
main path, rewinds at `najdorf-e6`, creates a `g3` deviation, and proves that the
unplayed authored `Be2` sibling plus both played paths survive PGN parse, serialize,
and reparse as legal chess.

## Current boundary

The living Najdorf file remains a schema fixture rather than reviewed training
content. Draft content now exists and may exercise v0.3 outcome grading, but
per-assertion grounding, timing-window evaluation, trajectory `transitions`, and
the authoring studio remain separate content-era work. A Syzygy declaration in
pack JSON is not by itself proof; exactness is admitted only by the server-side
ledger and manifest checks described in `outcome-drill-grading.md`.

## v0.4 Line Drill contract

Pack schema v0.4 adds `objective.type: follow_theory` and the closed
`{atAuthoredBoundary: "crossed"}` checkpoint trigger. A theory objective requires
`mode: line`, an authored boundary with a finite `plyHorizon`, and exactly one
boundary checkpoint. It may transition only among `active`, `preserved`, and
`degraded`; it cannot claim a chess result or enter an absorbing state.

Boundary membership is explicit: a run node is supported when its resolved
spine id is listed in `spineNodeIds` or a declared FEN predicate matches, and the
node is no later than `plyHorizon`. The horizon caps a grant and never creates
one. Position-keyed spine resolution permits transposition re-entry, while the
objective remains monotone on each path.

Deviation lint now rejects wrong-side, illegal, and duplicate authored moves.
It warns when a deviation shadows an authored child, when two spine nodes reach
one position, or when the boundary cap makes a listed id dead. A
`follow_theory` deviation must use a spine-node anchor so its grading edge is
deterministically resolvable.

## v0.5 defect sweep

`start.side` is required in both schema and shared TypeScript shape. Pack
phases, feedback policies, objective types, and checkpoint actions are exported
as shared vocabularies and bound to the JSON Schema by tests. The loader may
declare an opponent mode it cannot select only when capabilities expose that
refusal with a concrete reason; feedback timing has no such negotiation path,
so unsupported feedback values are not declared. Pack summaries carry an
optional phase as a nullable value rather than guessing from the position.

Version 0.11 also adds optional `shapes` entry ids and optional
`planClass.shapePlan {shape, plan}` references. Resolution is registry-backed at server load
and studio registration; unknown entries, references that bypass `pack.shapes`, and unknown
plan ids are refused. Inlined plan classes remain fully supported.
