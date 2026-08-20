# Knowledge retrieval experiment — result

**Date:** 2026-08-20

**Question:** Does Skipper-derived semantic retrieval add enough value over typed chess keys and
ordinary text retrieval to justify extracting its knowledge subsystem for Tabiya 1.0?

**Verdict:** **No. The predeclared extraction gate fails. Keep the licensed source register,
exact/typed keys and local text index; do not put a vector service, contextualizer or reranker on
the 1.0 roadmap.** `[V]`

This does not reject a separate knowledge-building pipeline. It narrows it. A deterministic builder
that fetches pinned sources, records rights and digests, extracts passages, attaches typed chess
applicability keys and publishes an immutable SQLite/FTS bundle still solves a real problem. The
experiment rejects semantic similarity as the missing foundation and rejects current Skipper as the
artifact contract.

## Method and population

The source register admitted only material with explicit redistribution and adaptation rights:

- five pinned Lichess opening tables (CC0);
- 20 records from the already-digested Lichess puzzle prefix (CC0; tags treated as generated,
  vote-refined corpus evidence rather than truth);
- eight exact Wikibooks revisions (CC BY-SA 4.0);
- three local research dossiers, labelled as research rather than general chess authority.

The resulting corpus contains 55 logical passages. Skipper's normal 500-token chunker produced 106
contextualized chunks. The gold set contains 144 queries: 72 opening identities, 16 plan questions,
16 endgame questions, 20 tactical-record lookups, four opposite-advice cases, four ambiguous learner
questions and 12 unrelated hard negatives. Eligible targets were fixed before retrieval and come
from exact records or cited source passages; no LLM wrote a gold chess claim. `[V]`

The six requested arms were measured over the same passages:

1. exact normalized keys;
2. lexical full-text retrieval;
3. raw `text-embedding-3-small` vectors;
4. exact-key filtering plus 0.7 vector / 0.3 lexical hybrid;
5. hybrid plus the configured `zerank-2` reranker;
6. Skipper contextualization plus hybrid and reranking.

The small-corpus vector calculation is exact. A 12-query control matched PostgreSQL/pgvector's
indexed top five in 12/12 cases. This is also the appropriate control shape for a corpus this size:
OpenAI's own pgvector example recommends exact flat search for very small collections rather than
accepting approximate-recall loss. `[V]`
([OpenAI semantic search with pgvector](https://developers.openai.com/cookbook/examples/partners/temporal_agents_with_knowledge_graphs/temporal_agents#semantic-search-with-pgvector))

## Aggregate result

Percentages use 132 answerable queries; abstention uses the 12 hard negatives. Latency for local
arms is in-process scoring only. Reranked/contextual latency includes the provider call, so those
figures are not a server-vs-browser benchmark; they are the marginal cost this design adds. `[V]`

| Arm | Recall@1 | Recall@5 | Ineligible top-1 | Hard-negative abstention | median | p95 |
|---|---:|---:|---:|---:|---:|---:|
| exact keys | 74.2% | 78.0% | 9.1% | 100.0% | 0.011 ms | 0.019 ms |
| lexical FTS | 60.6% | **97.7%** | 39.4% | 0.0% | 1.688 ms | 2.051 ms |
| exact + FTS baseline | 81.8% | **97.7%** | 18.2% | 0.0% | 0.016 ms | 0.032 ms |
| raw vector | 66.7% | 93.9% | 33.3% | **100.0%** | 0.074 ms | 0.098 ms |
| key-filtered hybrid | 88.6% | 93.9% | 11.4% | 58.3% | 0.077 ms | 1.759 ms |
| hybrid + reranker | 90.2% | 94.7% | 9.8% | 58.3% | 415 ms | 2,004 ms |
| contextual + hybrid + reranker | **91.7%** | 94.7% | **8.3%** | 66.7% | 564 ms | 2,103 ms |

The strongest safe semantic arm is contextual retrieval: it ties reranking at recall@5 and improves
both top-1 error and negative abstention. It still loses **3.0 percentage points** of recall@5 to
the exact+FTS baseline rather than gaining the required 10 points; returns an ineligible first result
on **8.3%** of answerable queries against the 2% ceiling; and abstains on **66.7%** of hard negatives
against the 90% floor. All three retrieval gates fail. `[V]`

Contextualization itself did little: compared with ordinary hybrid+reranking, recall@5 is unchanged
at 94.7%, recall@1 gains 1.5 points and abstention gains one of twelve negatives. Building the 55
passages took 22.4 seconds on the configured stack. That is not a cost argument by itself; it is
evidence that an LLM contextualizer is not buying the missing capability. `[V]`

## Why the failures matter

### Similarity is useful ranking evidence, not applicability

The semantic arms substantially improve top-1 ranking over lexical retrieval, especially on
natural-language plan and endgame questions. But their errors are exactly the class law 8 cannot
tolerate as silent hint selection:

- four rook-and-pawn-ending questions were routed to the generic pawn-ending passage;
- a Queen's Gambit question about holding the c4 pawn was routed to pawn endings;
- a King's Indian pawn-break question was routed to pawn endings;
- identical opening-family names crossed ECO identities (A40/D00 Queen's Pawn Game and B10/B12
  Caro-Kann).

The sharpest failure belongs partly to the experiment's key layer, not the vector: the untyped key
`pawn` admitted the generic pawn-ending document for phrases such as “connected pawns” and then
excluded the correct rook-ending document. This is the producer→consumer problem in miniature.
Keys must be typed predicates (`phase:endgame`, `material:rook+pawns`, `opening:E60-E99`, exact
position/transposition identity), not free-text tags or substrings. A vector cannot repair an
over-broad eligibility set. `[V]`

### Negative behavior is not safe enough

Contextual retrieval answered four of twelve unrelated questions. A 4K livestream question mapped
to king-and-queen mate; football offside mapped to the detector dossier and Sicilian/minor-piece
pages; a Kubernetes crash question mapped to pack stability; and a saxophone question mapped to
the Sicilian. The raw vector arm abstained on 12/12 at Skipper's 0.3 similarity floor, but hybrid
lexical score revived unrelated candidates and the reranker did not restore abstention. `[V]`

This means an optional semantic layer would need a separately evaluated admission/refusal policy.
That policy, not embeddings, would be the safety-critical component. It does not exist in Skipper.

## Artifact and lifecycle controls

Only one of the three non-retrieval gates passes. `[V]`

| Control | Result | Evidence |
|---|---|---|
| source edit invalidation | **pass** | re-ingesting one source atomically removed every stale chunk and left only the replacement marker |
| embedding-model invalidation | **fail** | stored chunks contain no provider/model identity; Skipper only detects vector-dimension changes, so a same-dimension model change is invisible |
| source/span/digest reproduction | **fail** | chunk metadata contains title/source-root/type/ingested-at, but no required licence, revision, source digest, chunk digest or source span |

The startup experiment also confirmed whole-service coupling in execution, not just by code reading.
The Skipper binary would not start without Frameworks Postgres, auth/service identity and Gateway
MCP; the bounded research run required starting the otherwise unrelated bridge, Commodore and
Periscope Query services. That is acceptable for a disposable instrument and unacceptable as the
ordinary Tabiya knowledge path. `[V]`

## Decision

For 1.0:

- retain the source register and licensed-source fetch/invalidation work;
- publish an immutable local bundle with exact typed keys, SQLite FTS, source/revision/span/digests
  and explicit evidence/applicability status;
- let deterministic evidence compilation choose eligible claims; use lexical retrieval only inside
  that eligible set;
- let an LLM render an already-admitted evidence packet at a requested directness rung, never choose
  the source, infer applicability, grade the move or fill a missing claim;
- do not extract Skipper's pgvector/contextualization/reranker path for 1.0;
- keep semantic ranking as a later, optional experiment only if a much larger cited corpus makes
  exact+FTS recall materially inadequate, with a new gold set and an explicit abstention model.

The experiment therefore closes D564's conditional extraction branch negatively. D557's actual
product need remains: a separate, versioned theory builder is useful, but its 1.0 implementation is
a provenance compiler and typed local index, not a chess chat agent or vector service. `[M]`

## Reproduction

- source register: `source-register.csv`
- fixed queries: `gold-queries.json`
- disposable instrument: `tools/knowledge-retrieval-harness/`
- raw result IDs and exact-vector controls: `/private/tmp/tabiya-r4-knowledge/raw-results.json`
  (intentionally uncommitted; contains no secrets or source prose)
