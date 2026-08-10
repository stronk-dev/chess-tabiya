# drill-pack-format — log (append-only)

## 2026-08-12 (claude, setup)

- RFC accepted after adversarial review (DPF-C1..C8 resolved; owner ruled spine
  tree + frozen trigger vocabulary; rest author-resolved, all logged).
- Plan created. Pack A doubles as the E3/Q7 experiment — authoring time is
  kill-criterion evidence, record it honestly.
- Next: schema work after scaffold lands (branch-runtime §0); pack A spine
  drafting can start on paper immediately.

## 2026-08-12 (codex, shared scaffold)

- Shared §0 workspace landed: `packages/schema`, `schemas/`, pinned toolchain, and the
  root verification/CI gates are ready for drill-pack-format §1.
- No schema/content checkbox changed; the living v0.2 schema and fixtures remain next.

## 2026-08-12 (codex, §1 schema and authoring tooling)

- Added the living Draft 2020-12 `schemas/drill_pack.schema.json` with format id
  `urn:chess-tabiya:schema:drill-pack:0.2`. It carries the accepted recursive
  spine tree, required enum feedback policy, typed intent/prediction interactions,
  authored-boundary contract, classified deviations rename, 2–20 branch target,
  all four frozen simple triggers plus timing windows, and the reserved
  `session_distilled` provenance source. The pack's own `version` is semver and
  remains distinct from the format version.
- Added `schemas/drill_pack.example.json`, an amended living copy of the Najdorf
  schema example. It is labeled `schema_example`, contains only placeholder/test
  annotations, and is not reviewed training content. A regression test compiles
  the frozen v0.1 schema against the frozen fixture, then proves that fixture is
  not silently promoted to v0.2. No file under `archive/` changed.
- Added every acceptance-list negative fixture. Missing feedback policy,
  prediction without `grading.source`, empty authored boundary, classless
  deviation, and malformed window fail JSON Schema. The illegal-spine fixture is
  deliberately schema-valid and fails semantic lint, keeping structural and chess
  validation responsibilities explicit.
- Added `lintDrillPack`: it parses the start FEN, walks every authored branch with
  chessops, validates legal UCI and matching SAN, detects duplicate/unknown spine
  ids, and warns above two prediction checkpoints per segment. Because v0.2 does
  not encode segment IDs, callers may pass a checkpoint grouping; without one the
  static lint conservatively treats the whole pack as one segment rather than
  inventing a schema field.
- Added an RFC 8785 JCS serializer and Web Crypto SHA-256 digest over the complete
  document, including `version`. Tests cover recursive key-order invariance,
  ECMAScript/JCS number serialization, lower-case digest form, and version
  sensitivity.
- Added versioned pack/node and bare-FEN URL format/parse/resolve helpers. Pack
  resolution checks the registry and spine-node identity; the ad-hoc form validates
  standard-chess FEN and percent-encodes the full FEN into exactly one path segment.
- Documented the implemented schema slice in `docs/drill-pack-format.md`. Pack A
  remains deferred by owner ruling and was not authored. §3 pack/run PGN round-trip
  was not started.
- Verification before commit: focused drill-pack suite green (18 tests);
  `make verify` green (13 files, 70 tests, all typechecks and schema/scaffold
  verification); `git diff --check` clean. Stopped at the §1 boundary.
- Follow-up `make build` green; all 58 frozen archive checksums verified unchanged.

## 2026-08-12 (claude, review of §1)

- Independently verified: `make verify` green (70 tests / 13 files), archive
  diff 0 lines. v0.2 schema carries all amendments (spine/feedbackPolicy/
  interaction/authoredBoundary/deviations; acceptedAlternatives correctly
  gone); all six negative fixtures present; hand-rolled RFC 8785 with
  surrogate handling; amended Najdorf fixture at 0.2.0. **§1 APPROVED.**
  §3 (round-trip) green-lit; §2 stays deferred per owner ruling.
