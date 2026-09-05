# Pack capability contract — sixteenth fresh independent buildability review

- **Date:** 2026-09-05
- **Reviewed:** fifteenth author repair for [[D2771]]–[[D2778]]
- **Gate:** `make pack-capability-sixteenth-fresh-review` — complete predecessor chain, new 7/7
- **Verdict:** **RETURNED on [[D2802]], [[D2803]], [[D2804]], [[D2805]], [[D2806]],
  [[D2807]], [[D2808]]**

## What survives

The 23-column row shape, basic state presence/nullability, database-scoped lease capability,
result-sequence transaction, objective from-state/evidence-set join, before/after image retention
and response-loss replay survive their retained controls. This return is at the remaining source,
state and history authority boundaries rather than a regression to the fifteenth review.

## Return

The provider envelope is joined to job identity, but its chess payload is not. An eval claiming a
different engine and depth settles, as does a tablebase result for a different FEN, source and piece
count ([[D2802]]). “Canonical” response bytes are only required to round-trip through
`JSON.parse`/`JSON.stringify`; arbitrary object-key orders create distinct accepted digests for the
same payload ([[D2803]]).

Three durable parser arms contradict the RFC's exact union. `retry_wait` accepts arbitrary JSON in
place of a typed availability/failure/shutdown/expiry basis ([[D2804]]). Provider-unavailable empty
and unavailable settlements omit the required availability and use an undeclared `reason` field
([[D2805]]). The exhaustive row parser also accepts a crossed origin, consumer and provider
operation combination even though §5.2 requires that join to survive corruption checks
([[D2806]]).

Time and history remain forgeable. A response whose own retrieval timestamp is after its lease
expiry settles because settlement compares only database-now to expiry, never the response's
request/retrieval interval ([[D2807]]). The transition table has hashes but no immutable authority:
rewriting before/after/current images, revisions, digests, receipt and transition row coherently
passes replay; even `committed_at="attacker"` is accepted ([[D2808]]).

## Required repair

Join every payload operand to the exact stored request and provider instance; use the repository's
single canonical JSON byte authority. Parse the full retry and terminal settlement unions including
real provider availability/failure receipts, and reassert origin/consumer/operation identity in the
row parser. Require provider request/retrieval instants to lie within the exact live lease and
transaction observation. Make transitions append-only under a storage-owned authority or bind them
to an immutable event/history chain that a coordinated row rewrite cannot recreate. Then run
another genuinely fresh independent review.

No production schema, migration, storage, provider, route, client or content implementation is
authorized; D560 remains held whole.
