# Lichess Explorer as a reusable evidence source

**Question:** What source primitive must Lichess human-population evidence expose so that theory,
Review, repertoire, bots, longitudinal analysis and the inspector can share one trustworthy result
without turning popularity into quality or leaking raw move lists into every learner surface?

**Rows:** [[D1703]], [[D1704]], [[D1705]], [[D1706]], [[D1707]], [[D1708]], [[D1709]]

**Date:** 2026-08-26

**Verdict:** The current runtime object is neither a source receipt nor a safe consumer primitive.
It omits its position and transport identity, admits illegal or impossible move rows, starts its
latency budget after queueing, collapses valid sparse populations into absence, and diverges from
the authoring client's parser/provenance. One node-free `human.explorer.position_page@1` receipt
must own request, response and source truth. Run occurrence, theory summary, repertoire frontier,
bot prior and longitudinal facts are narrower declared derivations with their own suitability
rules. Raw popularity never grades or recommends a move. Seven executable arms pass. `[V]`

## Method and source boundary

- Read the live and authoring clients, route, manifest declarations, adapters, repertoire scanner,
  module-registration return and existing captured Explorer bytes at HEAD. `[V]`
- Reproduced identity, validation, queue, abstention and field-loss failures in
  `tools/d1703-explorer-source-contract-harness/`. `[V]`
- Checked the official Lichess Opening Explorer repository and API pointer. The service covers
  rated Lichess games and exposes `/masters`, `/lichess` and `/player`; position requests carry a
  variant and FEN. The official response example warns that move counts may include games that
  transpose to the resulting position, so they are population observations rather than causal
  move outcomes. `[V]`
  [Official Lichess Opening Explorer README](https://github.com/lichess-org/lila-openingexplorer/blob/master/README.md#public-http-api)
- Reused the repository's real 2026-08-12 `/lichess` capture rather than inventing a provider
  response. It contains top-level W/D/L, twelve move rows with UCI, SAN, `averageRating`, W/D/L and
  optional opening identity, plus top-level opening identity. `[V]`
  `apps/server/src/sourcing/fixtures/explorer-response.json` and
  `apps/server/src/sourcing/fixtures/explorer-response.provenance.json`.

The failed unauthenticated live probe on 2026-08-26 returned HTTP 401. That establishes current
deployment authentication only; it is not treated as response-shape evidence. `[V]`

## 1. Position evidence can currently be relabelled ([[D1703]])

`CorpusResult` retains totals, moves, recency and population but not FEN, endpoint, retrieval time,
request digest or response digest. `declareExplorerPositionEvidence` therefore produces identical
declared bytes when the same body is parsed for two different positions. `[V]`

`human.explorer.population@1` then combines that result with caller-owned `nodeId` and
`committedMoveSan`. `declareExplorerPopulationEvidence` accepts an unrelated node and even an
impossible played SAN because neither belongs to the provider result and no equality is checked.
The raw human-corpus fact has been mixed with a run occurrence before either has a trustworthy
identity. `[V]`

The existing request normalization is useful and should survive: `normalizedCorpusQuery` reduces
the requested position to its four-field transposition key and appends `0 1`, while ratings,
speeds, time window and move width are canonicalized in `normalizeExplorerQuery`. Clocks are not
part of a population lookup. The source identity is therefore the normalized standard-position
query, not a run node and not arbitrary caller FEN bytes. `[V]`/`[M]`

The exact source identity also includes `rules=chess` and `setupFamily=standard_default |
standard_from_position`. The same FEN admitted as Chess960 cannot reuse a Standard Explorer page;
the executable distinction is already established by [[D1675]]. `[V]`

## 2. Provider strings become candidate evidence without chess validation ([[D1704]])

`parseCorpusResponse` checks only that SAN/UCI are strings and counts are non-negative integers. It
accepts an illegal UCI, duplicate normalized moves and a move whose W/D/L sum exceeds the entire
position population. The repertoire scanner later catches an illegal move and silently drops it;
the inspector path can render the same row. `[V]`

The authoring pipeline already imports `normalizeInboundMove` and uses it when emitting priority
rows. The shared source validator must use that same authority at ingress, derive canonical SAN
from the requested position, require unique normalized UCI, and retain the raw provider SAN only
as a compared source field if desired. `[V]`/`[M]`

Required count invariants are deliberately asymmetric: `[M]`

- top-level and per-move W/D/L are safe non-negative integers and their sums are safe;
- every move total is at most the position total;
- move identities are legal and unique for the requested position;
- the sum of returned move totals may be **less than** the position total, because `moves=12` is a
  bounded top list;
- zero missing-list mass never means every other legal move was absent from the corpus.

The receipt computes `listedGames`, `unlistedGames` and `listedCoveragePct`. It does not fabricate
zero-count rows for legal moves outside the returned list. `[M]`

## 3. Source fidelity is split across two clients ([[D1707]], [[D1708]])

The authoring `ExplorerClient` records HTTP URL/status/hash/bytes/retrieval time in `SourceEntry`,
preserves `averageRating`, serializes requests, retries provider failures and persists a 30-day
disk cache. Its query sets `history=false`. `[V]`

The live `LichessCorpusSource` uses a one-day memory cache and one-active/four-waiting queue, sets
`history=true`, but returns no source receipt. Its parser drops per-move `averageRating`, optional
opening identity and every history row except the newest nonzero month. The harness sends two
valid history rows plus rating/opening fields and proves only `lastPlayedMonth` survives. `[V]`

These are legitimate **policy** differences but not legitimate **truth** differences. One shared
normalizer, response validator and immutable receipt constructor must sit beneath both clients.
Authoring may persist and retry; interactive use may cache briefly and enforce a deadline. Both
must produce the same validated page for the same request/body, including the same digests and
field semantics. `[M]`

The parsed raw page should retain the response fields already present in captured bytes:
top-level W/D/L; legal move rows with canonical identity, provider SAN, average rating and W/D/L;
optional reported opening fields; and the requested history series when requested. Optional
opening identity remains reported Explorer metadata, not a replacement for the cited opening
catalogue. Full monthly history remains operator/research data unless a later exploration gate
overturns the measured refusal recorded in `planning/platform-alignment/refused-vs-asked.md`; merely
retaining source truth does not revive it as learner guidance. `[V]`/`[M]`

## 4. A product sample threshold currently destroys source truth ([[D1709]])

Both parsers turn any valid population below 100 games into `no_data_at_band`. A valid 37-game body
therefore loses all measured counts before a consumer can inspect it. The threshold is product
selection disguised as source validation. `[V]`

The raw receipt must retain every validator-green population, including total zero. Downstream
projections decide whether their use requires a threshold: repertoire mass propagation, a Review
rarity statement, a bot prior and an operator inspector do not necessarily share one denominator.
They return typed `empty_population` or `insufficient_sample` with the literal threshold and actual
total when unsuitable. Provider failure remains a different state. `[M]`

This is the same architectural rule as the broader evidence rework: collectors preserve facts;
modules decide significance and disclosure. It prevents a global source parser from becoming an
undeclared hint-ranking policy. `[M]`

## 5. The four-second budget starts too late ([[D1705]])

`LichessCorpusSource.stats` accepts one active request plus four queued requests. The timeout is
created inside `#fetch`, after a queued item reaches the front. With four slow predecessors, the
fifth accepted request can wait roughly four provider budgets before its own timer starts. The
sixth request is refused immediately. `CorpusSource.stats` carries no `AbortSignal` or request
scope, so closing a rail, rewinding or replacing a request cannot cancel queued/active work. `[V]`

The interactive contract measures from caller arrival: `[M]`

- compute one absolute `deadlineAt` before cache/coalescing/queue decisions;
- a cache hit may return immediately but retains the original source retrieval receipt;
- a queued item expires at its deadline without dispatch;
- dispatch receives only remaining time and an abort signal;
- closing/superseding a consumer cancels its subscription; shared in-flight work survives only
  while another live subscriber still needs it;
- queue-full, deadline-before-dispatch, provider timeout, explicit cancellation and transport
  failure remain distinct typed source outcomes;
- `/capabilities` reports static possibility separately from live provider reachability, and F1's
  compiled path records cached/recorded versus interactive alternatives.

This contract belongs in the same shared provider scheduler/exchange RFC as Stockfish, Maia and
Syzygy. Four private timeout vocabularies would reproduce the register drift the F1 compiler is
being amended to prevent. `[M]`

## 6. Abstention vocabulary is both mismatched and at the wrong layer ([[D1706]])

The manifest declares `source_unavailable | empty_population`; runtime returns
`source_unavailable | no_data_at_band`. Exact evidence adapters validate operand names but not the
source/result union, so this disagreement compiles. `[V]`

The source receipt needs transport/identity states only: `[M]`

```text
provider_unavailable | deadline_exceeded | queue_full | cancelled |
invalid_response | identity_mismatch
```

An HTTP 429/5xx, authorization failure and network failure may retain a typed transport detail but
must map through one closed authority rather than arbitrary prose being the semantic reason.
Valid zero/sparse pages are successful source receipts. Derived consumers add
`empty_population | insufficient_sample | unsupported_rules | withheld_by_context` as applicable;
those are not provider failures. `[M]`

## 7. Literal source projection

The generic declaration to author is: `[M]`

| field | value |
|---|---|
| id | `human.explorer.position_page@1` |
| role / plane | `source_record` / `human` |
| payload | `ExplorerPositionPageReceipt` |
| grounding / exactness / confidence | `human_corpus` / `measured` / `reported` |
| request operands | rules/setup family, normalized FEN, ratings, speeds, since/until, move width, history/top/recent widths |
| receipt operands | source id, endpoint, retrieved/status/etag, request digest, response digest, cache provenance |
| result operands | totals, validated bounded moves, listed/unlisted mass, optional history/opening metadata |
| answers / forms | fact + candidate moves; list, panel, machine condition |
| availability | provider with cached/recorded and interactive paths compiled by F1 |
| source abstention | the six transport/identity reasons in §6 |
| limitation | bounded population observation; never completeness, rank, quality, recommendation, intent or causal outcome |
| disposition | operator/full-inspector until each narrower consumer projection lands |

`requestDigest` covers one canonical closed request object, not incidental URL parameter order.
`responseDigest` covers exact response bytes. A cached receipt retains its original `retrievedAt`,
response digest and request digest; `servedAt`/cache hit may be recorded separately and can never
make old evidence look newly retrieved. `[M]`

## 8. One source, explicit consumer projections

The source is broad so collectors do not destroy facts. Ordinary UX stays narrow because no
learner module consumes the broad page by accident. `[M]`

| consumer need | declared projection / join | what it may say | what it may not say |
|---|---|---|---|
| Full inspector / operator | raw `position_page@1` | exact population, window, bounded rows and source state | quality, recommendation, intent |
| Theory breadcrumb | `derived.explorer.population_summary@1` from the raw page | book presence, total/WDL/recency and population guard | SAN/UCI candidates; “theory says play…” |
| Post-commit / Review | `derived.explorer.played_move_occurrence@1` from raw page + exact recorded position + recorded move | observed share/count and population outcome split for the played move | grade, causation or counterfactual best move |
| Repertoire frontier | raw page admitted through an exact normalized-position consumer binding, or a narrow frontier projection | bounded reply mass and unlisted remainder under its declared threshold | treating top 12 as all legal replies |
| Human-like bot policy | a separately registered legal normalized population prior, then engine guard / persona policy | population-weighted candidate prior | popularity as strength or personality by itself |
| Longitudinal player analysis | aggregates of sealed played-move occurrences plus opportunity denominators | repeated choice tendencies by phase/opening/structure | one-game personality diagnosis or causal coaching |
| Authored pack evidence | persisted recorded receipt + exact claim binding | cited observed frequency/outcome fact | generated strategic lesson |

The module-registration return currently proposes `derived.explorer.population_summary@1` from
`human.explorer.population@1`. That input must be corrected to the node-free raw page. The summary
must omit move rows structurally, retain the population guard and be resealed for the consuming
module. Operand scoping over the old page is still not narrowing. `[V]`/`[M]`

Run identity is a separate join. `derived.explorer.played_move_occurrence@1` requires exact
normalized-position equality with `run.record.position@1` and exact legal move identity with
`run.record.move@1`; neither `nodeId` nor `committedMoveSan` belongs in raw source bytes. A source
page may be shared across runs without changing identity. `[M]`

## 9. Dependency and migration order

1. Amend/re-review F1 for projection-effective execution paths, sticky `reported` confidence and
   binding-level source absence ([[D1700]]–[[D1702]]). `[M]`
2. Author one shared provider-source/scheduler RFC for Stockfish, Maia, Syzygy **and Explorer**.
   Explorer adds the literal contract in §§5–7 and two policy implementations over one receipt
   constructor. `[M]`
3. Implement request/response validation, receipts, arrival deadlines, cancellation and typed
   source states; port all seven disposable arms plus captured-response positives. `[M]`
4. Register `human.explorer.position_page@1`, source adapters and live capability composition.
   Direct inspector/research operation must consume the compiled path, not merely name it. `[M]`
5. Register/migrate the summary, occurrence and repertoire bindings. Bot/longitudinal projections
   follow their own accepted contracts and may not consume the raw page as an implicit policy.
   `[M]`
6. Retire `human.explorer.population@1` and `position_stats@1` only after a set-equal consumer census
   is empty. Delete the duplicate truth/parsers; do not keep compatibility wrappers with caller-
   supplied node identity. `[M]`

No content wave should bind new Explorer-backed prose to the legacy objects. Existing pack source
records remain immutable recorded evidence and migrate only through their own content/provenance
workflow. `[M]`

## Required able-to-fail acceptance arms

- same body, different normalized FEN: different receipt/request digest, same response digest;
- same normalized query with different clocks: same source identity; Standard versus Chess960:
  different capability and the latter suppressed;
- arbitrary node/SAN cannot enter raw source identity;
- illegal UCI, non-canonical SAN, duplicate move, per-row count overflow and malformed history
  refuse at ingress;
- listed mass below total passes and yields positive unlisted mass;
- 0-, 37- and 100-game valid pages all remain source successes; consumer thresholds differ;
- average rating, optional opening and requested history survive raw round-trip;
- cached receipt retains original retrieval/digests; cross-request cached bytes refuse;
- fifth accepted interactive request cannot exceed four seconds from arrival; sixth queue request
  returns `queue_full`; cancellation before and during dispatch are distinct;
- runtime source-result vocabulary and manifest source abstentions are set-equal in both directions;
- theory-summary sentinel SAN/UCI cannot reach packet, renderer, voice allow-list or wire;
- played-move occurrence fails wrong-position and wrong-move joins;
- repertoire never treats unlisted mass as zero or missing legal rows as absent from the corpus;
- raw popularity cannot satisfy a grade, recommendation, theory or personality consumer binding;
- every production Explorer operation consumes the shared receipt constructor; a new private parser
  or unclassified request site fails the operation census.

## Limits

- This pass proves source and projection boundaries, not that Explorer improves learning or that a
  particular sample floor is useful. Those are consumer-specific measurements. `[V]`
- The official API surface can change. Request and response digests plus strict versioned validation
  make such change visible; they do not promise eternal upstream schema stability. `[M]`
- Human frequency is useful evidence about what people did. It is not evidence that the move was
  good, that the learner intended a plan, or that the same move should be recommended. `[M]`
- No production contract, active RFC, design-intent document or authored content was changed by
  this research pass. `[V]`
