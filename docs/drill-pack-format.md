# Drill pack format

The implemented drill-pack foundation is a living Draft 2020-12 JSON Schema at
`schemas/drill_pack.schema.json`. It describes format v0.3; a pack's own
`version` remains semver and is part of its digest.

`schemas/drill_pack.example.json` is the living Najdorf schema fixture. The
fixture and schema under `archive/brief-v2/` remain frozen v0.1 inputs and are
tested only against each other. The v0.1 fixture intentionally fails v0.3 because
it has no required `feedbackPolicy` and uses superseded fields.

## Implemented v0.3 shape

- `spine` is an optional array of first-move nodes rooted at the pack's start
  FEN. Each recursive node has a pack-unique `id`, UCI, SAN, `children`, and
  optional string annotations. The start position itself is implicit.
- `feedbackPolicy` is required and is one of `delayed_checkpoint`, `segment_end`,
  or `immediate_blunder_guard`. Threshold behavior belongs to the runtime or
  workers, not the pack.
- A checkpoint has one trigger and may have an `intent_capture` or `prediction`
  interaction. Intent capture names plan-class IDs. Prediction grading always
  declares `opponent_policy`, `engine`, or `both`, with optional `topK`,
  `minMass`, and board flip.
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
did not require the format v0.3 amendment; grading is the change that advanced
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
