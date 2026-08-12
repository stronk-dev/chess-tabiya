# Content sourcing

Tabiya’s sourcing tools generate unpublished inputs for a human author. They do not publish
packs or manufacture chess instruction. The common pipeline is fetch/ingest → normalize →
emit candidate → review.

## Artifact boundary

Each directory below `content/candidates/` contains four canonical JSON files:

- `pack.json` is a schema-valid draft pack. It contains geometry and public attribution,
  never machine evidence or an assertion that the source did not establish.
- `evidence.json` is the private grounding ledger. It identifies the pack digest, anchors
  evidence to pack fields, links every item to an input, and records abstentions explicitly.
- `sources.json` inventories HTTP bodies, local files, and engine searches. Each entry has
  immutable retrieval identity and one of three closed licence rows.
- `job.json` records resolved arguments, source etags, and the deterministic job digest.

The directory is intentionally separate from `content/drafts/` and `content/packs/`.
Sidecars are not pack documents; candidates are not served content. Raw caches live in the
gitignored `content/sources/` directory.

## Checks and legal encoding

`make sourcing-check DIR=content/candidates/<id>` is strict. It runs ordinary pack
validation and then checks the manifest union, licence matrix, source deny list, evidence ↔
manifest linkage, derived `sourcedAt`, RFC 6901 support pointers, grounding boundaries,
wholesale candidate licence, and draft-only status. A changed pack digest is a warning;
broken anchors and unsupported claims are errors. Outside `content/candidates/` the same
inspection is advisory so hand-authored packs do not acquire sidecar requirements.

Licence obligations are derived rather than stored as booleans. The accepted rows are
CC0-1.0, CC-BY-SA-4.0 with notice text, and `no-rights-asserted` with a rationale. Every
emitted candidate declares CC-BY-SA-4.0 wholesale. B6a registers no prose template, so its
evidence can ground line geometry and identity but no explanatory prose or move grade.

## Reproducibility and source access

JSON uses RFC 8785 canonicalization plus one trailing newline. `sourcedAt` comes from the
newest consumed input rather than the emit clock, and `generatedAt` does not exist. An
unchanged, complete, checking job is a no-op; changed inputs, arguments, or missing artifacts
force emission.

Network requests are serial in a process and guarded by `content/sources/.fetch.lock` across
processes in one checkout. Any existing lock fails with `STALE_LOCK_HELD`; recovery is
manual after confirming no owner remains. Ownership is verified before each request and
again before deletion. HTTP 429/5xx responses retry after 60, 120, and 240 seconds; 4xx
responses fail immediately. The lock does not coordinate different checkouts.

## Opening line skeleton

The `openings` emitter consumes TSV rows from a pinned `lichess-org/chess-openings` commit.
It parses and legally walks the line with chessops, uses an explicit learner colour and
split ply, and emits the remaining moves as a single theory-strict spine ending at an
`atPly` checkpoint. Its objective text is explicitly a mechanical placeholder and blocks
graduation. The committed D35 Queen’s Gambit Declined Exchange candidate demonstrates the
complete offline path with six drill plies.

Later amendments add Syzygy/engine grounding, explorer priority, and puzzle-derived
position seeds to this same boundary.
