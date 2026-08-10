# Drill pack format

The implemented drill-pack foundation is a living Draft 2020-12 JSON Schema at
`schemas/drill_pack.schema.json`. It describes format v0.2; a pack's own
`version` remains semver and is part of its digest.

`schemas/drill_pack.example.json` is the living Najdorf schema fixture. The
fixture and schema under `archive/brief-v2/` remain frozen v0.1 inputs and are
tested only against each other. The v0.1 fixture intentionally fails v0.2 because
it has no required `feedbackPolicy` and uses superseded fields.

## Implemented v0.2 shape

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

## Not implemented yet

Pack A content remains deferred by owner ruling; the living Najdorf file is a
schema fixture, not reviewed training content. Pack-spine/run-branch PGN
round-trip is the separate §3 plan item and has not started. Trajectory
`transitions`, content licensing policy, engines, and authoring UI are also outside
this implemented schema slice.
