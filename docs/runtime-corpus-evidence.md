# Runtime corpus evidence

Tabiya can show Lichess opening-explorer frequency and recency for a recorded run
position. This is opt-in rung-4 assistance: it says what a named population played
and never grades, recommends, or seeds an opponent move.

## Source and population

The server owns the source credential. In a real engines deployment,
`LICHESS_TOKEN` configures `LichessCorpusSource`; no learner identity, cookie, grant,
or account token reaches the upstream request. Mock deployments use a deterministic
fixture and perform no network I/O. Capabilities report `lichess-explorer`, `mock`, or
`none` honestly.

Queries use the run graph's stored FEN, normalize it with `transposeKey`, restore
neutral counters (`0 1`), and build the URL through `URLSearchParams`. A
`human_common` target Elo selects its containing published rating bucket. Otherwise
the default 1000–2500 population is used. Default speeds are blitz, rapid, and
classical over the current UTC month plus the preceding 35 months.

The interactive client is separate from the authoring-time batch source. It uses a
512-entry in-memory LRU, 24-hour positive TTL, identical-request coalescing, one
upstream request at a time, a four-request waiting queue, a four-second dispatch
budget, and a 60-second negative cache for 429/5xx responses. It never takes the
batch `.fetch.lock`, writes source artifacts, retries anonymously, or substitutes a
wider population.

## Delivery and API

`GET /runs/:id/corpus?nodeId=...` is read-authorized and then server-withheld with the
same rule as the human-model split: only the solo/host learner may request it while
`feedbackDeliveryOpen` is true. A closed window or participant/spectator receives
`ASSISTANCE_WITHHELD`; an unconfigured source receives typed `CORPUS_UNAVAILABLE`.
Abstention below the 100-game floor or due to source failure is a successful response
that describes honest absence.

The response is ephemeral. Requests append no run event or evidence, do not alter the
graph or comparison payload, and leave the authoring-time explorer path unchanged.
For a pre-move node on the active path, the response also identifies the
learner-authored child move so the client can mark it among the population rows.

## Client contract

Assistance preferences are version 2; valid version-1 values upgrade with corpus off,
and the localStorage key remains unchanged. Corpus remains off by default and is shown
only when the provider exists and the server-derived permission is free.

Every rendered result begins with its population attribution and the byte-fixed line:

> These counts say what this population played, not what is good.

The remaining closed sentences report totals, W/D/L percentages, moves ordered only
by played count, the learner's committed-move membership, last recorded month, or an
honest abstention. No LLM renders this surface and no verdict vocabulary is allowed.

## Verification and limits

Tests cover FEN normalization/encoding, population and month arithmetic, count and
recency derivation, the floor, coalescing/TTL/negative caching, operator-only headers,
capability/error honesty, disclosure re-closing, ephemerality, preference migration,
the sentence fence, and the complete Just Play browser flow at zero retries.

Corpus data remains evidence only. Repertoire gap-finding, explorer-seeded resistance,
catalog browsing, and persisted corpus evidence are not implemented here.
