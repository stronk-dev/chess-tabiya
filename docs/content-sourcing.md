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

## Syzygy and endgame abstention

The `syzygy` emitter begins with a mechanical census of the FEN placement field. Positions
with at most seven pieces may query `tablebase.lichess.org`; positions with eight or more
do not issue a request and record `out_of_range` with the exact count. The batch-one 4v3
rook root has eleven pieces, so the committed candidate is an abstention-first artifact,
not a falsely tablebase-grounded pack.

In-range records preserve the backend category, DTZ, precise DTZ, DTM, and terminal flags,
including nulls. Tablebase evidence and engine evidence are distinct kinds, and the checker
rejects either kind on the wrong side of the range boundary. Neither may support prose.

The optional above-range authoring substitute uses Stockfish at depth 22, Threads 1, Hash
16 MB, and MultiPV 1 in a fresh authoring context, with a 120-second timeout. Fixed depth is
recorded evidence, not a wall-clock reproducibility claim; the engine identity and profile
must travel with the result. The general evidence executor’s timeout remains five seconds
unless a caller explicitly supplies the new override.

Generated endgame packs are spine-less outcome drills. The opponent is explicitly
`strong_engine` or `human_common`, the checkpoint is aligned to a learner ply, and roots in
tablebase range retain a graduation blocker because `perfect_tablebase` is still not a
selectable runtime policy (D8). Terminal runs disclose through the implemented
`outcome.reached` contract; this emitter does not define win/hold/save grading.

## Opening explorer priority

The explorer client asks one closed question: frequency at explicit rating buckets, speeds,
and a real calendar window. Ratings and speeds are canonicalized against the published
Lichess enums; all request parameters are explicit; 401/403 abstain immediately and never
substitute another population. Counts are derived from white/draw/black result fields—the
response has no trustworthy `total` or echoed time window—and rows below 100 games abstain.

Gate 0 succeeded through operator authentication. The exact anonymous request returned HTTP
401 from nginx while advertising `Authorization`; the identical request with a scope-less
personal operator token returned HTTP 200. `content/candidates/priority/priority.json`
therefore contains real first-wave rating-band rows. Q6’s offline-explorer revival condition
did not fire, and no bulk or alternate backend was added.

Explorer authorization is an operator boundary. Hosted deployments use one service/admin
credential for authoring; self-hosters may configure their own. A future learner-facing
Lichess account link is a separate optional identity/import feature and is never a content
prerequisite or a source of per-user credentials for this pipeline.

One machine-generated prose crossing is defined for future available data:
`explorer-move-share/v1`. `candidate-attach` accepts an author-selected response move and an
existing feedback-claim text, generates the exact count/share sentence, and atomically
updates the pack plus source/evidence sidecars after a strict pre-check. The checker
re-derives the percentage, verifies the request population/window from the manifest URL,
and requires byte equality. Explorer evidence cannot infer difficulty, grade a deviation,
or support any other prose.
