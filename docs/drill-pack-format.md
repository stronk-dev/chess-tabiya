# Drill pack format

The implemented drill-pack foundation is a living Draft 2020-12 JSON Schema at
`schemas/drill_pack.schema.json`. It describes format v0.15; a pack's own
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

`schemas/drill_pack.example.json` is the living Najdorf schema fixture. The
fixture and schema under `archive/brief-v2/` remain frozen v0.1 inputs and are
tested only against each other. The v0.1 fixture intentionally fails v0.15 because
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
  and `materialBalance`. A timing window contains `windowOpens`, `windowCloses`,
  and a non-negative `luxuryMoveBudget`; each boundary uses a simple trigger.
- `authoredBoundary` contains at least one of spine-node IDs, a non-negative ply
  horizon, or FEN predicates.
- `deviations` replaces `acceptedAlternatives`. Every entry identifies a spine
  node or FEN, a UCI move, and one required classification. It may also mark the
  move off-objective and carry a note.
- `difficulty.branchLengthTarget` accepts 2–20 plies, covering the declared 2–8
  on-ramp and 8–20 core bands. Rating bands may begin at 1000.
- `capture_intent` is no longer accepted in checkpoint `actions`; it is represented
  by the typed interaction. The reserved provenance source `session_distilled` is
  accepted.
- `objective` is closed. Outcome objectives (`win`, `hold`, `save`, and
  `resist`) require `grading`: an authored or Syzygy-declared root assessment
  plus a checkpoint or terminal resolution. `successConditions` is a closed
  union of checkpoint, outcome, material-balance, and rules-fact conditions;
  conditions may declare their target state and applicable non-terminal source
  states.

The format schema intentionally leaves `checkpoints[].actions` structurally
open, but the shipped registry and `pack-check` close the executable v1
vocabulary to `compare_branches`. An empty array means the checkpoint offers
no pack-selectable action. Any other value fails runtime validation with its
JSON Pointer and the allowed set; vocabulary grows only when a consumer grows.
This is an executable-policy lint rather than a JSON-Schema enum, so it does
did not require the earlier grading amendment; grading is the change that advanced
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
