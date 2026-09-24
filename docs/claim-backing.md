# Claim backing

Authored feedback remains the author's sentence. Evidence records never overwrite it and may not
point at prose fields. An evidence ledger may instead carry optional `claimBindings`, each pinning a
claim by JSON pointer, claim id, and SHA-256 of the exact text. Reordering, duplicate ids, editing,
and pointer drift therefore fail closed.

Each binding names verbatim spans. Instrument spans use one closed, versioned assertion that is
re-derived solely from records already present in that ledger; authored spans remain attributed to
the author. The validator never fetches or runs an engine. Assertion FENs must be reachable from the
pack, tablebase census assertions require every legal successor (including queen, rook, bishop and
knight promotion outcomes), and undeclared machine-shaped tokens are refused. The tablebase walker
and claim validator use the same exact legal-move enumerator, so a recorded census cannot disagree
with validation merely because a pawn reached the back rank. A rate without a recorded population
cannot be routed into authored opinion.

The v1 assertion registry covers tablebase category, DTM, DTZ, piece count, move category, line
uniformity, legal-move censuses and unique moves; engine centipawns and depth; and explorer totals,
outcome shares, move shares, windows, and rating bands. `explorer_position_census` is the ledger
record that carries the last family.

A missing ledger is reported twice on purpose: once as the missing sidecar and once for every
machine-labelled claim that consequently has no backing. The sidecar failure must not mask the
size or location of the unbacked-claim population.

Bindings classify a claim as `ledger_bound` only when every segment is instrument-attributed, or
`author_attributed` when instrument and author segments coexist. Pure authored claims remain
`self_declared`. Registration projects the instrument readings, author spans, and resolved
principles without placing claim text in the optional voice packet.

## Principle registry

Official entries live under `content/principles/` and validate against
`schemas/principle_entry.schema.json` v0.2. Each entry has a stable digest, statement, applicable
phases, one closed basis (`chess_tradition`, `authors_practice`, `instrument_pattern`, or
`cited_source`), provenance, and a required counter-case. The registry is a provenance floor for
authored judgement; it does not grade whether a particular claim correctly instantiates the principle.

Lane 0.2 (`rfc/theory-knowledge-pipeline.md` §10) lets `provenance.sources` carry a structured
citation `{sourceId, revisionUrl, sha256, sectionRef, quotedText}` beside free-text notes.
`standsOn: "cited_source"` holds exactly when at least one structured citation is present. Every
citation must join an **accepted** row of the theory-source register `content/theory-sources.json`
(`tabiya.theory.sources.v1`, validated by `apps/server/src/theory-sources.ts`) with an equal
revision URL and digest; its attribution — publisher, authors, SPDX licence and notice — is derived
from that row, never copied into the entry. Rows are pinned by origin-specific revision adapters
(MediaWiki `oldid`, commit-pinned GitHub paths), carry a reviewed licence whose permissions are
derived rather than self-declared, and the standing "do not use" origins are refused as data. Source
bytes are not committed (`content/sources/` is gitignored): with local pinned bytes a quotation must
occur exactly once; without them the joined citation reports `proof: "source_unavailable"`. At
landing all 13 entries still stand on `authors_practice` and cite nothing — choosing a supporting
passage is an authored judgement, not a pipeline step.

Pack format v0.26 adds `feedbackClaims[].principles` and closes the claim object. `pack-check` loads
the official registry, refuses missing or unknown references, and warns on phase mismatch. The
initial migration groups 82 authored-principle claims under 12 used entries; the largest entry has
13 references, below the one-third concentration escalation.
