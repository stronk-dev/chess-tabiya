# Theory knowledge pipeline — can Tabiya reuse Skipper?

**Date:** 2026-08-20

**Question:** Can `~/frameworks/monorepo/api_consultant` (Skipper) operate separately from the
Frameworks platform and become Tabiya's chess knowledge/retrieval layer? If so, should Tabiya reuse
the whole agent, extract its knowledge subsystem, or only copy its patterns?

**Method:** complete local code/architecture pass `[V]`; current upstream documentation and
licensed-source inspection `[V]`; proposed experiment and product recommendation `[M]`. This is
research, not implementation authority.

## Verdict

**Do not make the whole Skipper agent a Tabiya dependency, and do not extract its semantic
retrieval stack for 1.0. The chess retrieval experiment failed the predeclared gate. Reuse the
source-ingestion and invalidation patterns in a smaller provenance compiler with typed keys and a
local FTS bundle.**

There are really three objects called “Skipper” in the code:

1. a Frameworks video-consultant application;
2. a generic chat/tool orchestrator;
3. a relatively clean ingestion/retrieval subsystem under `internal/knowledge`.

Only the third is a natural Tabiya foundation. The first is deeply platform-coupled. The second is
more permissive than law 8 allows and solves a different problem: autonomously answering a broad
question. Tabiya needs a builder that returns traceable candidate knowledge to deterministic
evidence and guidance policies.

The six-arm experiment is complete. Over 144 fixed queries, exact+FTS reached 97.7% recall@5 while
the strongest semantic arm reached 94.7%; the semantic arm returned an ineligible top result on
8.3% of answerable queries and abstained on only 66.7% of hard negatives. Skipper also failed the
model-identity and source/span/digest artifact controls. `[V]` The full method and result are in
`planning/platform-alignment/knowledge-retrieval/results.md`.

The economical route is now one bounded implementation candidate after the remaining research and
owner ruling: a separate deterministic builder fetches allow-listed sources, records provenance and
rights, attaches typed chess applicability keys, and publishes an immutable exact-key/SQLite-FTS
bundle. Ordinary Tabiya deployments need no crawler, PostgreSQL/pgvector, headless Chrome, embedding
provider, reranker or contextualizing LLM.

The separate builder remains worth designing. It could ground theory breadcrumbs, source-backed hints, post-game
explanations, authoring citation search and principle regrounding. It does **not** replace board
arithmetic, tactical detectors, Stockfish, Maia, explorer statistics, tablebases, or authored
judgment.

## Experiment outcome — 2026-08-20

The conditional branch was exercised rather than promoted by recommendation. The corpus contained
55 licensed/local passages and produced 106 Skipper chunks. The gold set had 132 answerable queries
and 12 hard negatives. `[V]`

- Exact+FTS: 81.8% recall@1, 97.7% recall@5.
- Contextual hybrid+reranker: 91.7% recall@1, 94.7% recall@5, 8.3% ineligible top-1 and 66.7%
  hard-negative abstention.
- Source replacement worked atomically; same-dimension embedding-model invalidation and required
  licence/revision/span/digest reproduction are unrepresentable in the current store.
- Exact local vector results matched pgvector's indexed top five in 12/12 controls, so approximate
  search did not explain the retrieval failures.

The semantic path improves ordering at rank one, but loses candidate recall and cannot enforce
applicability or refusal. Four rook-ending questions were routed to generic pawn endings, and four
unrelated hard negatives received chess results. The experiment also exposed a defect in the
proposed “chess keys” abstraction: the free-text key `pawn` itself over-filtered the correct
rook-ending source. The replacement is not better embedding. It is typed applicability predicates
before any ranking. `[V]`

## What was actually inspected

The pass read Skipper's executable, configuration, architecture, SQL schema, crawler, scheduler,
cache, extractor, embedder, store, reranker, admin API, chat pre-retrieval, source propagation and
confidence mapping. `[V]`

Key sources:

- `/Users/stronk/frameworks/monorepo/api_consultant/cmd/skipper/main.go`
- `/Users/stronk/frameworks/monorepo/api_consultant/internal/knowledge/*.go`
- `/Users/stronk/frameworks/monorepo/api_consultant/internal/chat/orchestrator.go`
- `/Users/stronk/frameworks/monorepo/api_consultant/internal/chat/confidence.go`
- `/Users/stronk/frameworks/monorepo/pkg/database/sql/schema/skipper.sql`
- `/Users/stronk/frameworks/monorepo/docs/architecture/skipper.md`

The earlier alignment audit had inspected several of these components, but then answered the
owner's question as though it were about request-time scraping. That framing was wrong and is
corrected in D557.

## Why the whole service is not drop-in

`cmd/skipper/main.go` is a Frameworks application, not a standalone generic agent. `[V]`

It hard-requires:

- `DATABASE_URL`, `JWT_SECRET` and `SERVICE_TOKEN`;
- the Frameworks shared `pkg` module and its auth, database, server, config, logging, monitoring,
  LLM, search, middleware, tenant and protobuf packages;
- PostgreSQL with the Skipper schema and pgvector;
- a valid system-tenant identity.

It also initializes or wires Frameworks-specific concerns:

- Periscope stream diagnostics;
- Purser tier gating;
- Commodore tenant/stream context;
- Decklog usage metering;
- Quartermaster discovery/bootstrap;
- Gateway MCP clients and mutation/read policies;
- heartbeat and infrastructure monitoring;
- tenant notifications and the social-post drafting agent;
- video-specific prompts, confidence language and web UI.

Some platform clients degrade when absent, but the executable and schema still assume the platform
identity/auth/database model. A “standalone mode” inside this main would become a forest of feature
flags around code Tabiya does not need.

Deployment also cuts against Tabiya's current package. Tabiya ships one Node server backed by one
SQLite file plus an optional Maia sidecar (`deploy/compose.release.template.yaml`). `[V]` Running
whole Skipper would add PostgreSQL/pgvector, another HTTP/gRPC service, platform-derived auth
configuration, optional headless Chrome and several model-provider settings. That is a large
self-hosting tax merely to retrieve theory.

## The reusable seam

The non-test knowledge files have a much smaller dependency surface. `[V]`

| Component | Useful behavior already implemented | Frameworks coupling to remove or abstract |
|---|---|---|
| crawler | sitemaps, same-origin discovery, robots rules, SSRF-safe transport, redirect limits, size bounds, SPA detection/render fallback, readability extraction | shared logger; admin auth outside core |
| page cache/scheduler | ETag/Last-Modified/hash/TTL skips, sitemap metadata, failure/unchanged counters, paced queue, local source files | PostgreSQL store and shared logger |
| embedder | heading-aware ~500-token chunks, overlap, thin/navigation/duplicate filtering, batching/retry, optional contextual retrieval | shared LLM interfaces |
| store | atomic per-source replacement, tenant partition, vector and full-text retrieval, source filtering | shared DB JSON helper and PostgreSQL/pgvector |
| reranker | optional cross-encoder, deterministic fallback, per-source result cap | shared reranker interface |
| admin | crawl/upload/status/cancel/source management | Frameworks JWT/role/tenant context; Gin route shape |

Go's `internal` rule prevents Tabiya from importing this package directly from another repository.
`go.mod` also replaces the Frameworks shared package with `../pkg`. `[V]` Reuse therefore means
one of:

- extract it to a shared public Go module;
- fork it into a small standalone service with an HTTP/CLI contract; or
- duplicate/port the code.

A shared library would still couple Tabiya's release to Frameworks' Go/provider/database package.
A standalone service gives the cleanest version boundary and permits Skipper and Tabiya to evolve
different application policy over the same ingestion core.

## What must change for chess

The core is operationally mature, but its generic knowledge semantics are insufficient for law 8.

### 1. Source provenance becomes a schema, not loose metadata

The enforced knowledge table stores URL, title, source root/type, chunk text/index, embedding and
generic JSON metadata. Ingestion adds `source_root`, `page_url`, `source_type` and `ingested_at`.
`[V]` The page cache has a content hash, but that hash is not a required property of each published
chunk. Licence, author, revision, language, redistribution permission, section/span and adaptation
status are not required.

A chess bundle needs at minimum:

- canonical source and revision URL;
- source, document and chunk digests;
- title, author/publisher, licence/version and attribution text;
- fetched/pinned date and content language;
- exact section/span or record pointer;
- allowed uses: retrieval only, quotation, adaptation, redistribution;
- source-strength class and human-review state.

This matters because CC BY-SA allows reuse and adaptation only with attribution and share-alike
conditions; those obligations cannot live in an optional JSON convention. `[V]`
[Creative Commons BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

### 2. Chess enrichment precedes generic similarity

Skipper indexes generic chunks. Tabiya can attach stronger keys:

- normalized position and transposition keys;
- ECO/opening family/variation;
- phase and material band;
- structure and motif IDs from the evidence registry;
- principle and claim IDs;
- side to move, player side and relevant squares/pieces;
- intended skill band and assistance rung;
- source population: tradition, master games, human corpus, engine/search, authored.

The Lichess opening-name corpus already supplies ECO, name, PGN/UCI and EPD under CC0, including
multiple entries for transpositions. `[V]`
[lichess-org/chess-openings](https://github.com/lichess-org/chess-openings)
The Lichess puzzle export supplies FEN, solution moves, rating, popularity and tactical theme tags;
it is useful as a detector/evaluation corpus, not as prose theory. `[V]`
[Lichess database](https://database.lichess.org/)

Exact structured matches should be candidate generators and filters. Full-text/vector retrieval
can then find relevant prose inside the eligible source set. “Similar” cannot itself mean
“applicable to this position.”

### 3. Retrieval relevance and chess validity are separate axes

Skipper maps any knowledge-base source to confidence `verified` in
`internal/chat/confidence.go`. `[V]` Ingestion and retrieval establish that text came from an
indexed source and is relevant enough to return; neither establishes that its chess claim is true,
applicable, current, or sufficiently specific.

Tabiya therefore needs at least:

- **retrieval score:** how well the query/keys match the passage;
- **source/provenance status:** where it came from and under what review/licence;
- **applicability result:** whether position/evidence predicates admit it;
- **claim backing:** which exact sentence/record supports which rendered fact.

No source-type shortcut may collapse these into “verified.”

### 4. Generated retrieval context is not evidence

Skipper can ask a utility LLM to prepend one or two generated context sentences before embedding a
chunk, while storing the original text for display. `[V]` This may improve recall, but the generated
context can change which passage is retrieved. For Tabiya it is an index aid only, never a citable
claim. The experiment must compare it against no-context indexing and log every false match it
introduces or removes.

Anthropic's published contextual-retrieval experiment reports that contextual embeddings plus
keyword retrieval and reranking reduced top-20 retrieval failures on its evaluated corpora, but it
also recommends domain-specific experiments for cost/latency and configuration. `[V]`
[Anthropic contextual retrieval](https://www.anthropic.com/engineering/contextual-retrieval)

### 5. Generic tuning is not a chess contract

Skipper's store currently uses a 0.3 minimum vector similarity and a weighted 0.7 vector / 0.3
full-text score; its fallback reranker uses reciprocal-rank fusion over vector order and keyword
overlap. `[V]` These are implementation defaults, not measured chess thresholds. Its architecture
document and store describe the hybrid path at different levels, another reason to test behavior
rather than inherit prose.

Approximate HNSW also trades recall for speed; pgvector explicitly recommends monitoring recall
against exact search. `[V]` [pgvector](https://github.com/pgvector/pgvector)
The first chess corpus is small enough to establish exact-search ground truth before choosing an
approximate index.

### 6. Publish an artifact, not an always-on builder dependency

Skipper handles embedding-model dimension changes by deleting incompatible vectors and requiring a
recrawl. `[V]` Tabiya should generalize this into an explicit build identity covering:

- source-registry version and source digests;
- extractor/chunker/enricher versions;
- evidence-vocabulary version;
- embedding/contextualizer/reranker identities;
- bundle schema and generated-at timestamp;
- retrieval evaluation result.

The builder exports a signed or digest-addressed bundle. A release pins one bundle. Self-hosters can
use the bundled exact-key/FTS index without provider credentials. An optional “knowledge-builder”
Compose profile may refresh or add private sources later; its output remains quarantined until its
licence and validation checks pass.

## Options compared

| Option | Reuse | Product/deployment cost | Law-8 fit | Verdict |
|---|---:|---:|---:|---|
| Run whole Skipper beside Tabiya | high code reuse | very high; adds Frameworks identity/platform assumptions and PostgreSQL stack | poor without replacing agent policy/confidence | **refuse as product architecture** |
| Add a “chess mode” to whole Skipper | medium | high; permanent conditionals across two products | still too easy for generic agent/tool output to become truth | **refuse for 1.0 core**; optional research UI only |
| Extract standalone knowledge builder/search service | high reuse of the valuable core | moderate once, explicit API/version boundary | good after provenance/enrichment/validation changes | **recommended if experiment clears** |
| Port everything to TypeScript/SQLite immediately | low | repeats crawler/extractor/retrieval hardening; simplest final deployment | policy can fit | **do not start here** |
| Use current Skipper only as a disposable experiment | no product coupling | low; uses existing Frameworks stack | safe if outputs remain research evidence | **do now** |

## The experiment that decides whether to bother

Create `planning/platform-alignment/knowledge-retrieval/` and a disposable harness. No production
route or schema change.

### Corpus

Use a small allow-list with different source shapes:

- Lichess opening names/EPDs (CC0 structured facts);
- Lichess puzzle themes (CC0 labelled motif positions);
- selected openly licensed prose with explicit attribution/redistribution metadata;
- the thirteen existing principle entries and their eventual cited sources;
- a small authored Tabiya pack/claim set as known-target passages.

Do not ingest commercial course/book prose, search-result snippets, or a site whose licence/terms
have not been recorded.

### Query set

At least 120 predeclared queries, stratified across:

- exact opening/transposition identity;
- structure and plan terminology;
- tactical motif and configuration→consequence patterns;
- endgame technique;
- ambiguous natural-language learner questions;
- hard negatives where no source is applicable;
- two positions with similar prose vocabulary but opposite advice.

Each query records eligible sources/passages before retrieval. Chess judgments in the gold set must
come from cited sources or exact validated facts, never the LLM.

### Arms

1. exact chess keys only;
2. full-text search only;
3. vector search only;
4. exact-key filter + hybrid retrieval;
5. arm 4 + reranking;
6. arm 5 + contextualized embeddings.

### Metrics and gates

- eligible-passage recall@1/@5;
- ineligible top-1 rate;
- hard-negative abstention rate;
- citation completeness and digest reproducibility;
- retrieval latency and bundle size;
- change invalidation: one edited source and one changed embedding model;
- incremental value over exact keys/FTS, not over “no retrieval.”

**Clear extraction:** the best semantic arm improves recall@5 by at least 10 percentage points over
exact-key+FTS, keeps ineligible top-1 at or below 2%, abstains on at least 90% of hard negatives,
and reproduces every citation/digest after a clean rebuild. Thresholds are experiment gates `[M]`,
not product design.

**If it fails:** keep deterministic source links and authored citations; do not build a vector
service merely because one already exists elsewhere.

## What a standalone service would expose

If the experiment clears, extract a small service or CLI with no chat agent:

```text
source register → fetch/extract → enrich → validate/quarantine → index → evaluate → export bundle

POST /build-sources     operator/build pipeline only
POST /search            structured keys + optional text; returns passages, never an answer
GET  /sources/:id       provenance/licence/revision
POST /evaluate          committed retrieval suite
POST /export            immutable bundle + manifest
```

Changes required from Skipper:

1. new standalone entrypoint and independent schema migrations;
2. local operator key/CLI instead of Frameworks JWT/tier/tenant middleware;
3. remove video diagnostics, heartbeat, social, notifications, Gateway tools and general chat;
4. retain provider abstraction but make embeddings/reranking optional;
5. required source/licence/digest/span schema;
6. pluggable chess enricher supplied by Tabiya's evidence vocabulary;
7. raw → extracted → enriched → validated → publishable/quarantined lifecycle;
8. structured search response with retrieval/applicability separated;
9. committed eval harness and fail-closed bundle export;
10. build manifest and runtime compatibility check.

An optional author/research assistant may later sit on top of this service. It can propose sources
and draft transformations, but its output remains unvalidated until a cited claim/predicate accepts
it. It is not the in-run coach and not the opponent brain.

## Dependency placement toward 1.0

This research can run now using current Skipper. Product extraction depends on:

- detector/evidence identifiers stable enough to define chess enrichment;
- the producer→consumer contract defining what a theory passage may support;
- the source/provenance and bundle compatibility rulings;
- Gate F's pack-compatibility proof.

It should not block exact detectors, Maia/bot-policy research or basic guidance-module UX. It **does**
block any 1.0 promise of dynamic source-backed theory, LLM-rendered theory hints, automatic citation
search for authors, or post-game theory explanations.

## Ledger effect

D557 is corrected to the owner's actual question. D564 records the conditional extraction verdict.
No RFC is authorized: the six-arm retrieval experiment is the next step.
