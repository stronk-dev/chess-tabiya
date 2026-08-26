# Explorer source primitive — D1703–D1709 author handoff

**Target:** the shared provider-source/scheduler RFC required by `bounded-policy-targets`, the
promotion-race hold and the F1 execution-metadata amendment.

**Rows:** [[D1703]], [[D1704]], [[D1705]], [[D1706]], [[D1707]], [[D1708]], [[D1709]]

**Authority:** `design/research/explorer-source-contract-closure.md`,
`tools/d1703-explorer-source-contract-harness/`,
`design/research/evidence-execution-and-confidence-closure.md` and
`f1-execution-metadata-author-repair-2026-08-26.md`.

No owner chess/product ruling is required. Do not implement from this handoff. Author the shared
contract, cross-review it against all four providers and F1, accept only when literal operations
and able-to-fail fixtures are buildable, then queue implementation.

## 1. Add Explorer to the shared provider layer

The provider RFC currently named by three handoffs is not a Stockfish/Maia/Syzygy RFC. It is the
shared source-exchange boundary and must also own Lichess Explorer:

- `live.stockfish.legal_root_table@1`;
- `human.maia.policy_page@1` plus run occurrence;
- `live.syzygy.position_result@1`;
- `human.explorer.position_page@1` plus narrow consumer projections.

All four share exact request identity, actual response/source receipt, digests, cache provenance,
arrival deadline, bounded scheduling, cancellation, typed failure and compiled execution paths.
They retain provider-specific request/result validators; do not flatten them into `unknown`.

## 2. Literal Explorer source row

Register `human.explorer.position_page@1` exactly as the dossier §7 table specifies:

- node-free `ExplorerPositionPageReceipt`;
- request includes rules/setup family, normalized four-field position + `0 1`, `variant=standard`,
  exact rating buckets, speeds, since/until, move width, history width and zero top/recent widths;
- receipt includes source/endpoint, retrieved/status/etag, request/response digests and cache
  provenance; cache hits retain original retrieval identity;
- result includes validated totals, bounded move rows, listed/unlisted mass and the admitted
  average-rating/opening/history fields;
- `human_corpus / measured / reported`;
- raw page answers fact + candidate moves but is operator/full-inspector only;
- limitations explicitly refuse completeness, rank, recommendation, grade, intent and causal
  outcome.

Use one shared query normalizer, raw-response validator and immutable receipt constructor beneath
both `ExplorerClient` and `LichessCorpusSource`. Authoring versus interactive retry/cache policy may
differ. Parsed source truth may not.

## 3. Separate validation, source availability and consumer suitability

Ingress validation must:

- normalize and validate unique legal UCI with `normalizeInboundMove`;
- derive/check canonical SAN from the requested position;
- require safe W/D/L counts and per-row total no greater than position total;
- allow the bounded returned-row sum to be below total;
- retain literal `listedGames`, `unlistedGames` and coverage;
- validate nullable/safe average rating, optional reported opening data and requested history;
- refuse malformed bytes/identity before an F1 item is declared.

Delete the parser-level 100-game threshold. Valid 0/37/100-game pages are successful source
receipts. Consumer projections own explicit `empty_population`/`insufficient_sample` policies and
retain the actual total and threshold. These states must never be transport failures.

Source abstention is closed and set-equal across type, manifest, wire and parser:

```text
provider_unavailable | deadline_exceeded | queue_full | cancelled |
invalid_response | identity_mismatch
```

If transport details distinguish authorization, 429, 5xx and network failure, keep that as a typed
detail under one source reason. Do not let arbitrary detail strings become the semantic vocabulary.

## 4. Bound the interactive scheduler from caller arrival

- create `deadlineAt` before cache, dedupe and queue decisions;
- queued requests expire without dispatch; dispatch uses only remaining time;
- accept an explicit request scope and `AbortSignal`;
- cancellation removes queued work and aborts active work when its final subscriber leaves;
- rejection, cancellation, timeout and invalid response do not enter the success cache;
- exact canonical request identity dedupes; FEN-only or population-free keys do not;
- static provider capability, live provider health and cached/recorded path availability remain
  separate facts;
- no hover/pointer event may enqueue provider work.

The current one-active/four-waiting default may survive only if the first live composition/load
test justifies it. Four seconds is measured from arrival, never dispatch.

## 5. Publish the consumer projection graph

At minimum specify:

1. `derived.explorer.population_summary@1` from `position_page@1`, structurally omitting move rows,
   retaining normalized position, population/window, totals/WDL, recency/source and `CORPUS_GUARD`;
2. `derived.explorer.played_move_occurrence@1` from `position_page@1` +
   `run.record.position@1` + `run.record.move@1`, with exact normalized-position and legal-move
   equality;
3. a truthful repertoire binding over the raw page or one narrow frontier projection, preserving
   unlisted mass and its literal sample policy.

Correct the returned module-registration repair: theory summary derives from the new node-free raw
page, not `human.explorer.population@1`. A sentinel that exists only in `moves[]` must not reach the
theory packet, deterministic renderer, provider input, voice allow-list or wire.

Bot population priors and longitudinal style aggregates are successor consumer contracts. Name
their required source/occurrence projection but do not admit raw Explorer bytes to bot/personality
or guidance bindings. Frequency never becomes move quality.

## 6. Migration and deletion

- migrate `inspector.corpus`, `runtime.repertoire_scan` and every direct declaration/caller through
  compiled paths;
- derive run node/move occurrence separately; remove caller-owned node/SAN from the raw source;
- migrate the authoring client to the shared validator/receipt without rewriting immutable recorded
  content evidence;
- retain full raw fields only for operator/research/declared derived consumers; the previous
  monthly-history learner refusal stands;
- retire `human.explorer.population@1` and `position_stats@1` only after the generated consumer and
  operation censuses are empty;
- delete duplicate parsers after migration. A compatibility adapter that can relabel a page does
  not count as retirement.

## Acceptance additions

Port all seven disposable arms and add:

- real captured `/lichess` response + provenance round-trip;
- same body/different FEN and same-FEN/different-clock controls;
- Standard/Chess960 same-FEN suppression;
- illegal/duplicate/noncanonical/count-overflow/history negatives;
- listed-mass-short-of-total positive;
- valid 0/37/100 totals and consumer-specific sample thresholds;
- cache original-retrieval identity and cross-request refusal;
- arrival-deadline, queue-full, queued cancel, active cancel, coalesced-subscriber cancel;
- source-reason set equality across manifest/runtime/wire;
- theory move-sentinel noninterference;
- played-occurrence wrong-position/wrong-move negatives;
- repertoire unlisted-mass positive;
- operation census from application composition to both authoring and live policies;
- raw page rejected by grade, recommendation, theory and personality consumers.

## Refusals

- no node id or played SAN in raw source identity;
- no legal validation deferred to individual consumers;
- no popularity-as-quality, recommendation, theory or intent;
- no top-12-as-complete legal set;
- no parser-level global sample floor;
- no cache hit restamped as newly retrieved evidence;
- no queue time outside the declared interaction budget;
- no third Explorer parser;
- no raw move list in `theory_breadcrumb`;
- no direct implementation before the shared RFC is accepted.
