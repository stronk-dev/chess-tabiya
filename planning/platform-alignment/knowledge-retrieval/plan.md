# Knowledge retrieval experiment

**Parent:** `planning/platform-alignment/plan.md`

**Research:** `design/research/theory-knowledge-pipeline.md`

**Ledger:** D557, D564

**Status:** complete 2026-08-20; semantic extraction gate failed; no product implementation authority.

## Decision

Determine whether Skipper-derived semantic retrieval adds enough value over Tabiya's structured
chess keys and ordinary full-text search to justify extracting a standalone knowledge builder.

## Work order

1. **Source register**
   - select the small allow-listed corpus named in the dossier;
   - record canonical URL/revision, author/publisher, licence, attribution, redistribution/adaptation
     rights, language and digest;
   - refuse every source whose use is ambiguous.
2. **Gold set**
   - write at least 120 stratified queries and hard negatives;
   - assign eligible passages from cited sources or exact validated facts;
   - include transpositions, configuration→consequence patterns and opposite-advice negatives.
3. **Disposable Skipper adapter**
   - run existing Skipper knowledge ingestion outside the Tabiya product runtime;
   - map source metadata into its upload/crawl interface;
   - export raw results for all six arms without asking its chat agent to answer.
4. **Deterministic baselines**
   - exact normalized position/ECO/motif/principle keys;
   - full-text search over the same extracted passages;
   - record candidate sets before adding vectors.
5. **Semantic arms**
   - vector only;
   - key-filtered hybrid;
   - hybrid + reranker;
   - contextualized embeddings + hybrid + reranker.
6. **Evaluation**
   - recall@1/@5, ineligible top-1, hard-negative abstention;
   - citation/digest reproduction, latency and size;
   - source-edit and embedding-model invalidation controls;
   - exact-search control against any HNSW result.
7. **Decision record**
   - clear: draft source/bundle design decision, then RFC candidate after owner ruling;
   - fail: retain exact keys/FTS/source links and close D564 without a vector service.

## Gate

The extraction path clears only if the best semantic arm:

- improves eligible-passage recall@5 by at least 10 percentage points over exact-key + FTS;
- keeps ineligible top-1 at or below 2%;
- abstains on at least 90% of hard negatives;
- reproduces every source/span/digest on a clean rebuild;
- demonstrates correct invalidation after a source or embedding-model change.

These are predeclared research thresholds, not product acceptance criteria.

**Result:** failed. The strongest safe semantic arm reached 94.7% recall@5 against 97.7% for
exact+FTS, 8.3% ineligible top-1 against the 2% ceiling and 66.7% hard-negative abstention against
the 90% floor. Source replacement passed; embedding-model identity and required
licence/revision/span/digest reproduction failed. See `results.md`.

## Outputs

- `planning/platform-alignment/knowledge-retrieval/source-register.csv`
- `planning/platform-alignment/knowledge-retrieval/gold-queries.json`
- disposable harness under `tools/knowledge-retrieval-harness/`
- `planning/platform-alignment/knowledge-retrieval/results.md`
- append-only `log.md`

## Non-goals

- no in-run hint route;
- no Tabiya schema or Compose change;
- no commercial/copyright-ambiguous corpus;
- no LLM-written gold claims;
- no decision based on answer prose quality;
- no assumption that an indexed source is verified chess truth.
