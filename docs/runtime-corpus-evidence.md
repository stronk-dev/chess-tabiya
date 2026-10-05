# Runtime corpus evidence

Tabiya can show Lichess opening-explorer frequency and recency for a recorded run
position. This is opt-in rung-4 assistance: it says what a named population played
and never grades, recommends, or seeds an opponent move.

## Source and population

The server owns the source credential. In a real engines deployment,
`LICHESS_TOKEN` configures `ExchangeCorpusSource`; no learner identity, cookie, grant,
or account token reaches the upstream request. Mock deployments use a deterministic
fixture and perform no network I/O. Capabilities report `lichess-explorer`, `mock`, or
`none` honestly.

Queries use the run graph's stored FEN, normalize it with `transposeKey`, restore
neutral counters (`0 1`), and build the URL through `URLSearchParams`. A
`human_common` target Elo selects its containing published rating bucket. Otherwise
the default 1000–2500 population is used. Default speeds are blitz, rapid, and
classical over the current UTC month plus the preceding 35 months.

The built-in interactive client uses the application's shared provider exchange, not a private
Explorer queue, parser or cache. Its four-second caller budget includes queue/admission time;
client disconnect cancels the caller, not a surviving coalesced consumer. Shared application
bounds are two active/eight queued exchanges, 64 retained entries/4096 weight and absolute ten-minute
TTL. The Lichess health coordinator serializes new Explorer/tablebase requests and shares 429
Retry-After backoff. Failures are not retained. Exact valid acquisitions remain readable during
outage; a different position/window cannot borrow them. It never takes the batch `.fetch.lock`,
writes source artifacts, retries anonymously, or substitutes a wider population.

The registered request normalizer/parser and source factory validate and seal the complete page:
legal unique UCI, canonical/provider SAN, safe counts, listed/unlisted mass, rating, opening and
requested history. Zero and sparse populations are source success. `stats()` is an explicitly
temporary compatibility view; Inspector, repertoire frontier and return-frequency each own their
existing 100-game sample policy. The source does not decide sample suitability. Full sealed pages
remain in the shared exchange. Theory's move-free summary, the repertoire frontier and the
count-only return-frequency projection now have actual consumers that admit exact requests.
Inspector's whole-source/presentation migration and the remaining exact played-occurrence
consumer joins remain open. Supplied fixtures/custom sources and standalone authoring tools
remain separate.

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
recency derivation, consumer floors, shared coalescing/absolute TTL/backoff, operator-only headers,
capability/error honesty, disclosure re-closing, ephemerality, preference migration,
the sentence fence, and the complete Just Play browser flow at zero retries. The focused provider
gate additionally proves the authenticated real HTTP corpus route, legal-move/count/history
refusals, independent cancellation, and timer-free transport-disconnect propagation.

Corpus data remains evidence only. Repertoire gap-finding now consumes the same
population attribution and guard outside runs; see `docs/repertoire-gap-finding.md`.
Explorer-seeded resistance, catalog browsing, and persisted in-run corpus evidence are
not implemented here.
