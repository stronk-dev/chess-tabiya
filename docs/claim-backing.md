# Claim backing

Authored feedback remains the author's sentence. Evidence records never overwrite it and may not
point at prose fields. An evidence ledger may instead carry optional `claimBindings`, each pinning a
claim by JSON pointer, claim id, and SHA-256 of the exact text. Reordering, duplicate ids, editing,
and pointer drift therefore fail closed.

Each binding names verbatim spans. Instrument spans use one closed, versioned assertion that is
re-derived solely from records already present in that ledger; authored spans remain attributed to
the author. The validator never fetches or runs an engine. Assertion FENs must be reachable from the
pack, tablebase census assertions require every legal successor, and undeclared machine-shaped
tokens are refused. A rate without a recorded population cannot be routed into authored opinion.

The v1 assertion registry covers tablebase category, DTM, DTZ, piece count, move category, line
uniformity, legal-move censuses and unique moves; engine centipawns and depth; and explorer totals,
outcome shares, move shares, windows, and rating bands. `explorer_position_census` is the ledger
record that carries the last family.

Bindings classify a claim as `ledger_bound` only when every segment is instrument-attributed, or
`author_attributed` when instrument and author segments coexist. Pure authored claims remain
`self_declared`. Registration projects the instrument readings, author spans, and resolved
principles without placing claim text in the optional voice packet.

## Principle registry

Official entries live under `content/principles/` and validate against
`schemas/principle_entry.schema.json` v0.1. Each entry has a stable digest, statement, applicable
phases, one closed basis (`chess_tradition`, `authors_practice`, or `instrument_pattern`), provenance,
and a required counter-case. The registry is a provenance floor for authored judgement; it does not
grade whether a particular claim correctly instantiates the principle.

Pack format v0.26 adds `feedbackClaims[].principles` and closes the claim object. `pack-check` loads
the official registry, refuses missing or unknown references, and warns on phase mismatch. The
initial migration groups 82 authored-principle claims under 12 used entries; the largest entry has
13 references, below the one-third concentration escalation.
