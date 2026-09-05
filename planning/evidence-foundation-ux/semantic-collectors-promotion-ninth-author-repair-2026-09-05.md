# Held promotion collectors — ninth author repair

- **Date:** 2026-09-05
- **Repairs:** [[D2748]], [[D2749]], [[D2750]], [[D2751]], [[D2752]]
- **Gate:** `make semantic-collectors-promotion-ninth-author-repair`
- **Scope:** disposable RFC-tier model only; no production collector is authorized

## Repair

Recorded tablebase truth now begins with one immutable durable sourcing snapshot containing the
complete ledger records and the exact source manifest. Snapshot construction validates canonical
FEN identity, complete record fields (`anchor`, `grounds`, `supports` included), registered
`syzygy.position@1 / tablebase_exact` source identity, timestamp order, FEN/value/piece-count
identity, non-empty JSON-pointer supports and the seven-piece ceiling. A durable lookup is the only
public route from that snapshot to recorded evidence, and its receipt retains the exact snapshot,
record and resulting evidence by identity ([[D2748]], [[D2752]]).

The lookup is now a total sealed dependency. A separate factory constructs either declared storage
failure, and the collector refuses provider fallback on that arm ([[D2749]]). The legal dependency
is likewise one sealed total resolver: its unavailable arm produces a sealed
`input_abstained/legal_moves` result without inventing legal evidence or contacting the provider,
while its evidence arm is the same exact resolver consumed by the retained transaction
([[D2750]]).

The collector derives piece count from the exact geometry FEN before consulting recorded storage or
the live provider. An eight-piece request returns one sealed outside-domain result with the exact
FEN, observed count and literal maximum; neither lookup, scheduler nor legal resolver runs. The
durable snapshot independently rejects an eight-piece tablebase record, so recorded and live
success share the same domain law rather than trusting the provider's chosen result discriminator
([[D2751]], [[D2752]]).

## Evidence and hold

`make semantic-collectors-promotion-ninth-author-repair` first retains all prior promotion author
and review gates, then passes 5/5 new behavioral controls and strict TypeScript. The controls retain
a complete durable record/source receipt, reject a future record, exercise storage failure with
zero provider calls, exercise legal abstention with zero provider calls, refuse live outside-domain
success before any dependency work, and refuse an outside-domain durable record.

This is author evidence, not acceptance. Both promotion projections remain held at 12/14 until a
tenth genuinely fresh independent review passes and the provider/value dependencies land.
