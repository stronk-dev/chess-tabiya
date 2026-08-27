# RFC: Provider exchange and projection execution

- **Status:** draft — returned by independent buildability review 2026-08-27 on
  [[D1871]]–[[D1878]]. The shared-provider direction survives; implementation is not authorised
  until the capability, receipt, occurrence, payload, scheduler and generation contracts are
  repaired and independently re-reviewed.
- **Author:** codex, from the D1652–D1658 and D1699–D1709 author-repair handoffs
- **Created:** 2026-08-27
- **Design refs:** `design/03-product-breadth.md` evidence architecture and provider-backed
  capabilities; `design/05-in-run-experience.md` assistance ceilings and no-provider degradation
- **Exploration gate:** executed contract closures in
  `design/research/evidence-execution-and-confidence-closure.md`,
  `design/research/bounded-policy-target-contract-closure.md`,
  `design/research/promotion-race-contract-closure.md`, and
  `design/research/explorer-source-contract-closure.md`
- **Depends on:** implemented `rfc/archive/evidence-contract-manifest.md`; implemented engine,
  Maia, Syzygy and Explorer clients; accepted `rfc/exact-legal-mobility.md`
- **Parent / amends:** amends the implemented F1 compiler contract through a new RFC; supplies the
  shared source dependency for `semantic-collectors`, `bounded-policy-targets`, Review, bots,
  theory and repertoire work
- **Supersedes / superseded by:** —
- **Planning:** `planning/provider-exchange-and-execution/` once implementing

```tabiya-claims
none
```

## Summary

One compiled evidence graph must describe both what a projection means and what has to execute to
obtain it. This RFC adds path-preserving execution metadata and reported-confidence inheritance to
F1, then places Stockfish, Maia, Syzygy and Lichess Explorer behind one bounded exchange contract.
Each provider keeps a typed request and result, but shares exact request identity, same-exchange
provenance, deadlines, cancellation, deduplication and bounded retention. The result is reusable
source evidence for Support, Review, bots, drills and analysis rather than a private provider
shortcut in each consumer.

This RFC intentionally does not implement promotion-race, bounded-target, Review, bot, theory or
learner-facing semantics. Those contracts consume the exact source receipts and compiled paths
defined here. Frequency remains frequency, an engine table remains search output, a tablebase
result remains an exact in-domain result, and an LLM receives only evidence admitted by a later
consumer.

## Motivation

The implemented manifest owns semantic identities but loses execution truth at a derived producer
boundary. The 2026-08-26 executable census measured 37 producers, 193 projections, 46 derived
projections, 96 direct derivation members and 99 fully expanded paths. Eight current projections
advertise `local/sync` while requiring Stockfish, ten bindings bypass provider-off validation
through those local wrappers, and 49 immediate derivation members discard `reported` confidence.
Correcting the story chain exposes a fourth transitive confidence declaration. These are current
production defects, not only prerequisites for future collectors.

The same research found four provider clients with overlapping but inconsistent boundaries:

- Stockfish output lacks an all-legal root-table receipt tied to the engine generation that
  produced it;
- Maia's `HumanSplitPage` is node-shaped even though counterfactual queries are history- or
  exact-FEN-shaped;
- Syzygy returns a `TablebasePosition` with no request FEN or exchange identity;
- Explorer has multiple parsers, a global 100-game suitability threshold inside source parsing,
  incomplete request identity and a timeout that starts after queueing.

Adding the held collectors without this RFC would recreate four private source authorities and
make `/capabilities` report wrapper availability instead of executable evidence paths.

## Specification

### 1. F1 compiles execution paths

`packages/runtime/src/evidence-contract.ts` gains the following dependency-free image:

```ts
interface CompiledProjectionExecution {
  readonly projection: VersionedEvidenceId;
  readonly own: {
    readonly availability: AvailabilityMode;
    readonly latency: LatencyMode;
  };
  readonly paths: readonly {
    readonly derivationChoices: readonly {
      readonly projection: VersionedEvidenceId;
      readonly inputs: readonly VersionedEvidenceId[];
    }[];
    readonly sourceRequirements: readonly {
      readonly projection: VersionedEvidenceId;
      readonly availability: "recorded" | "provider" | "build_time";
    }[];
    readonly effectiveLatency: LatencyMode;
  }[];
  readonly worstCaseLatency: LatencyMode;
}
```

`CompiledEvidenceManifest` gains sorted `execution: readonly
CompiledProjectionExecution[]`. It participates in the existing canonical manifest digest; there
is no hand-written execution field on a projection.

Compilation rules:

1. A non-derived projection has one path. Its producer is the `own` operation; a non-local
   producer is also its one source requirement.
2. A derivation member recursively takes the Cartesian product of each literal input's paths.
   `inputs` is one member; each `anyOf` entry is a distinct member.
3. `derivationChoices` retains the selected member at this projection and every nested derived
   projection. Equal latency/source profiles never collapse different choices.
4. Source requirements are an exact unique set of non-local leaves. Recorded, provider and
   build-time sources remain distinct even when their current latency is equal.
5. Effective latency is the slowest selected operation under
   `sync < interactive < background < offline`; `worstCaseLatency` is a derived convenience over
   all paths and never replaces them.
6. `dependsOn` remains the semantic/migration graph. It is not execution input and is never
   conjoined with mutually exclusive `derivation` alternatives.
7. The current 96 direct members must remain distinguishable and expand to 99 paths before new
   sources are added. Counts after additions are generated and checked, never copied as timeless
   constants.

The existing producer availability and latency fields now mean only the producer's own operation.
A producer may therefore own a synchronous local output and a provider-bearing derived sibling
without either declaration lying.

### 2. Confidence inheritance and binding consequences

`EVIDENCE_DERIVATION_WIDENS` additionally enforces, independently for every derivation member:

- if any input is `reported`, the output is `reported`;
- an all-`not_applicable` member remains `not_applicable`;
- an all-`exact` member may remain `exact`; it may be `reported` only when the output payload
  explicitly records a reported operation;
- no rule is invented for a mixed `exact`/`not_applicable` member until a real member establishes
  its semantics.

The implementing migration corrects the complete fixed point: candidate feature vector, story
last-level, story rank and story title. It first adds red fixtures against the uncorrected
catalogue, then changes declarations; weakening the guard to preserve green bytes is forbidden.

`AdapterDeclaration` gains a required `sourceAbsent` value whenever any compiled path contains a
provider requirement:

```ts
type EvidenceSourceAbsentBehavior = "omit_optional_item" | "honest_empty" | "operation_unavailable";
```

The compiler checks the behavior at the binding-to-path boundary, including transitive provider
leaves. A consumer's existing `providerOff` value becomes a generated aggregate over its bindings,
not a substitute for them. A binding also fails when its admitted latency cannot execute any
selected path—for example a sync-only binding over an interactive-only source.

`/capabilities` joins live source availability to the compiled static paths and returns
per-projection satisfiable path identities plus the aggregate consumer state. Static possibility,
live health, recorded/cache availability and a chess refutation are four different states. A local
wrapper cannot make a missing provider path available, and provider absence cannot become `false`,
`draw`, an empty population or an empty recommendation.

### 3. One typed exchange receipt

All live source payloads carry a receipt constructed inside the operation that produced the bytes:

```ts
interface ProviderExchangeReceipt {
  readonly provider: "stockfish" | "maia" | "syzygy" | "lichess_explorer";
  readonly endpoint: string;
  readonly requestedIdentity: Readonly<Record<string, string | number | boolean>>;
  readonly actualIdentity: Readonly<Record<string, string | number | boolean>>;
  readonly generation: number | null;
  readonly requestedAt: string;
  readonly retrievedAt: string;
  readonly normalizedRequestDigest: string;
  readonly responseDigest: string;
  readonly cache: "live" | "retained_exact";
}
```

Provider-specific payloads remain typed; `Record` appears only in the common identity envelope and
is filled by provider-specific constructors. Engine `generation` increments after each successful
spawn handshake. Network providers use `null`. A cache hit retains the original receipt and
retrieval time rather than being restamped.

The cache key uses the complete normalized requested identity. Admission uses actual identity from
the same serialized exchange. A result is refused if identity or generation changes between
request admission and response completion. A health snapshot or constructor field may not be
stamped onto later bytes.

Closed source abstention vocabulary:

```text
provider_unavailable | deadline_exceeded | queue_full | cancelled |
invalid_response | identity_mismatch
```

Provider-specific transport detail may distinguish authorization, 429, 5xx, network failure,
model failure, incomplete root table and outside-domain. Those details do not widen the semantic
source-reason vocabulary. Outside Syzygy domain and a valid sparse Explorer population remain
successful typed domain/consumer states, not transport failures.

### 4. Shared bounded scheduler

`apps/server/src/provider-exchange.ts` owns `ProviderExchangeScheduler`. Its constructor requires
positive `maxActive`, `maxQueued`, `maxRetainedWeight`, `retentionTtlMs` and a monotonic clock.
There are no implicit unbounded defaults.

```ts
interface ProviderRequestScope {
  readonly id: string;
  readonly deadlineAt: number;
}

interface ProviderExchangeScheduler {
  get<T>(
    request: TypedProviderRequest<T>,
    scope: ProviderRequestScope,
    signal: AbortSignal,
  ): Promise<TypedProviderResult<T>>;
}
```

Rules:

- `deadlineAt` is created at caller arrival, before cache, dedupe or queue decisions. Dispatch gets
  only remaining time.
- Exact canonical request identity coalesces. FEN-only keys never coalesce requests whose history,
  model, bound, population window, variant or provider identity differs.
- Queue-full, rejection, invalid response, cancellation, timeout and identity mismatch are never
  retained.
- Cancellation removes queued work. Active work aborts when its final subscriber leaves; late
  results are dropped.
- Retention is weight-bounded as well as entry-bounded. Provider/model/generation changes make a
  retained result stale.
- No hover, pointer-move or board-focus operation may enqueue provider work. An accepted module,
  Review operation, bot policy, authoring operation or explicit inspector request supplies the
  scope and interaction budget.

The first learner-facing consumer must publish and load-test deployment defaults. This RFC's
operator traversal uses explicit small test values; it does not bless them as production latency
or capacity.

### 5. Stockfish legal-root source

`StockfishLegalRootTableOperation.execute(request, signal)` returns:

```ts
interface StockfishLegalRootTable {
  readonly request: {
    readonly fen: string;
    readonly bound: { readonly kind: "depth"; readonly value: number };
    readonly requestedWidth: "all_legal";
    readonly moveIdentity: "chessops-king-takes-rook@1";
    readonly normalizedCommandsDigest: string;
    readonly timeoutMs: number;
  };
  readonly receipt: ProviderExchangeReceipt;
  readonly rows: readonly {
    readonly moveUci: string;
    readonly reachedDepth: number;
    readonly score: { readonly kind: "cp" | "mate"; readonly value: number };
    readonly pv: readonly string[];
  }[];
}
```

`live.stockfish.legal_root_table@1` is `search/source_record`,
`bounded_search/measured/reported`, answers evaluation/candidate moves/move/PV, and is
operator-only until a named derived consumer is compiled. Set equality is between unique normalized
`rows.moveUci` and `exactLegalMoves(fen).map(uci)`, with every row reaching the requested depth.
Equal-count replacement, duplicate, missing/extra row and short-depth responses fail. Castling uses
the existing Chess960-safe king-takes-rook identity (`e1a1`/`e1h1`); all four promotion identities
remain distinct. Raw fields may not contain target, opportunity, recommendation or grade meaning.

The engine execution boundary returns the actual engine identity, generation, request digest,
output digest and UCI bytes from the same serialized task. Existing health remains health; it is
not exchange provenance.

#### 5.1 Fixed-bound position evaluation

`StockfishPositionEvaluationOperation.execute(request, signal)` is the second Stockfish operation,
not a private candidate-packet adapter ([[D1860]]). It uses the same scheduler, engine execution
boundary, generation and receipt constructor as the legal-root table:

```ts
type FixedBoundPositionScore =
  | { readonly kind: "centipawns"; readonly value: number }
  | { readonly kind: "mate"; readonly side: "white" | "black"; readonly distance: number; readonly unit: "moves" };

interface FixedBoundPositionEvaluation {
  readonly fen: string;
  readonly positionKey: string;
  readonly perspective: "white";
  readonly score: FixedBoundPositionScore;
  readonly engine: { readonly id: string; readonly name: string; readonly version: string };
  readonly bound:
    | { readonly kind: "movetime"; readonly requestedMs: number; readonly reachedDepth: number | null }
    | { readonly kind: "depth"; readonly requestedDepth: number; readonly reachedDepth: number | null }
    | { readonly kind: "nodes"; readonly requestedNodes: number; readonly reachedDepth: number | null };
  readonly receipt: ProviderExchangeReceipt;
}
```

The normalized request key is exact canonical six-field FEN plus engine/version/generation, bound,
command digest and timeout. The operation parses exactly one completed score, rejects bound/NaN/
missing/zero-distance mate output, and converts the engine's declared side-to-move score to the
named White frame using the FEN turn. Both White- and Black-to-move cp/mate fixtures assert the
conversion. `live.stockfish.position_eval@1` is
`search/source_record`, `bounded_search/measured/reported`, answers evaluation, and carries no node,
best move, PV, rank, loss, grade or recommendation. Bot and Review derive their own frames from this
one source; neither opens a second engine request path.

### 6. Maia policy-page source and run occurrence

```ts
type MaiaPositionRequest =
  | { readonly kind: "history_conditioned"; readonly startFen: string; readonly historyUci: readonly string[] }
  | { readonly kind: "exact_fen"; readonly fen: string };

interface MaiaPolicyPageReceipt {
  readonly request: MaiaPositionRequest;
  readonly receipt: ProviderExchangeReceipt;
  readonly appliedBand: number;
  readonly temperature: number;
  readonly topP: number;
  readonly requestedWidth: number;
  readonly candidates: readonly { readonly moveUci: string; readonly probability: number }[];
}
```

The complete key includes request kind and every request byte, requested/actual model identity,
band, temperature, top-p and width. Equal final FEN with different history is not equal; identical
exact-FEN requests may dedupe. Candidate identities are unique legal normalized UCI, probabilities
are finite and non-negative, and mass/width completeness is retained rather than inferred.

`human.maia.policy_page@1` is `human/source_record`,
`human_model/measured/reported`, answers candidate moves only, and is operator-only pending named
consumers. Model mass is likelihood under one declared request, never move quality, intent or a
player diagnosis.

`derived.maia.run_move_occurrence@1` separately joins a page to exact
`run.record.position@1` and `run.record.move@1`. The current inspector human split migrates to that
projection. The node-shaped `human.maia.policy@1` is retired only when the generated consumer and
operation censuses show zero remaining callers; it may not serve hypothetical positions.

### 7. Syzygy position source

```ts
interface LiveSyzygyPositionReceipt {
  readonly fen: string;
  readonly receipt: ProviderExchangeReceipt;
  readonly result: TablebasePosition;
}
```

`live.syzygy.position_result@1` is `search/source_record`,
`tablebase_exact/exact/not_applicable`, and answers fact/evaluation/candidate moves/move. The full
canonical FEN—including side to move, castling/en-passant fields and clocks—is part of request
identity. `result` is admitted only inside the supported tablebase domain and after legal move
identity validation. Outside-domain is a typed domain abstention; provider absence is an execution
failure; neither is a draw or a refutation.

One `SyzygyPositionOperation.execute(request, signal)` and one receipt constructor serve direct
probe and queue-backed evidence. The existing `TablebaseSource.probe` path migrates through it;
there is no pawn-specific or Review-specific tablebase adapter. This source is the live arm later
paired with `recorded.tablebase.result@1`; exact same-FEN joins are owned by the consuming
derivation.

### 8. Explorer position source and narrow projections

`ExplorerPositionPageOperation.execute(request, signal)` returns a node-free
`ExplorerPositionPageReceipt`. Its normalized request includes rules/setup family, canonical
four-field position normalized with `0 1`, `variant=standard`, exact rating buckets, speeds,
since/until, move width, history width and zero top/recent widths. The receipt retains endpoint,
status/etag, request/response digests, cache provenance, validated totals, bounded move rows,
listed/unlisted mass, average rating, reported opening fields and requested history.

Ingress uses one normalizer and validator shared by `ExplorerClient` and
`LichessCorpusSource`. It requires unique legal normalized UCI, canonical SAN, safe W/D/L counts,
row totals not exceeding position total, and a literal listed/unlisted split. A bounded row sum
below total is valid. Totals 0, 37 and 100 are successful source pages. The parser-level 100-game
threshold is deleted; each consumer owns its explicit sample suitability policy.

`human.explorer.position_page@1` is `human/source_record`,
`human_corpus/measured/reported`, answers facts and candidate moves, and is operator/full-inspector
only. It carries no completeness, quality, rank, recommendation, intent or causal-outcome meaning.

The provider landing also publishes:

1. `derived.explorer.population_summary@1`, retaining position/window/totals/WDL/recency/source and
   `CORPUS_GUARD` while structurally omitting move rows;
2. `derived.explorer.played_move_occurrence@1`, joining the page to exact run position and move
   with normalized-position and legal-move equality;
3. the existing repertoire frontier binding over the raw page or one narrow frontier projection,
   retaining unlisted mass and its literal sample policy.

`inspector.corpus`, `runtime.repertoire_scan` and current direct callers migrate through compiled
paths. The old `human.explorer.population@1` and `position_stats@1`, duplicated parsers and
caller-authored node/SAN identity retire only after generated zero-consumer/zero-operation
censuses. A sentinel present only in raw `moves[]` may not reach theory summary, deterministic
rendering, provider input, voice allow-list or wire.

### 9. Composition and operations

`apps/server/src/application.ts` constructs one scheduler and the five operations. The application
does not re-declare evidence semantics. Each operation has one real operator/research traversal
before any learner binding is added:

| operation unit | total | required traversal |
|---|---:|---|
| typed provider operations | 5 | Stockfish legal roots, Stockfish fixed-bound position evaluation, Maia policy page, Syzygy position, Explorer page |
| shared scheduler composition | 1 | application root with explicit bounds and source health inputs |
| raw source adapters | 5 | exact projection declaration through `declareEvidence` adapter |
| migration operations | 3 | Maia run occurrence, Explorer summary, Explorer played occurrence |

The operation census resolves exported callables from the application composition through to each
adapter; a filename, manifest row or constructor-only test is not reachability. Provider source
health later composes with `provider-health-degradation`; that RFC may add circuits and deployment
profiles, but may not create a second receipt, cache or request identity authority.

### 10. Migration order

Implementation is one reviewable RFC but lands in guarded commits in this order:

1. add red F1 execution/confidence/provider-fallback fixtures;
2. compile path-preserving execution metadata and migrate the four confidence declarations plus
   ten current transitive-provider bindings;
3. expose path satisfiability through `/capabilities` and its web type;
4. add the bounded scheduler, same-exchange receipts and five typed source operations;
5. migrate the current Maia/Explorer/Syzygy/Stockfish callers without changing learner semantics;
6. prove operator traversals and retire duplicated authorities only at zero consumers;
7. close only the rows actually discharged and archive with BACKLOG plus exploration-log closeout.

The held promotion and bounded-target projections are not implemented in this RFC. Once this RFC
is implemented, their already-researched amendments may compile against these sources without
private metadata.

## Deviations from design

None. This RFC supplies the shared evidence source and execution foundation required by the living
breadth design. It does not choose a Support preset, a Review ranking, a bot personality or a
learner-facing explanation.

## Acceptance criteria

1. The D1700 harness's 96 direct members remain distinguishable and expand to 99 paths at the
   pre-source checkpoint; a deletion or alternative collapse changes the manifest digest and fails.
2. `reported → exact` and `reported → not_applicable` fixtures fail for both direct and transitive
   chains; every `anyOf` member is checked independently; the corrected current catalogue has zero
   immediate and zero transitive violations.
3. The eight measured local wrappers retain local/sync `own` metadata and compile provider-bearing
   interactive paths; a local-only sibling on the same producer remains provider-free and sync.
4. All ten measured transitive-provider bindings declare a path consequence. A local wrapper
   cannot bypass provider-off validation, and a sync binding cannot accept an interactive-only
   path.
5. Runtime capabilities suppress only unsatisfied paths. Recorded and live alternatives remain
   distinct; source absent, cached/recorded, outside-domain, honest-empty and refuted are not
   interchangeable.
6. All five provider payload declarations match §§5–8 literally and compile through F1 with no
   second hand-written execution image.
7. Stockfish positives cover ordinary play, both castling identities and four promotions. Missing,
   duplicate, extra, equal-count replacement and short-depth tables fail. Fixed-bound evaluation
   separately covers White/Black cp and mate orientation, zero/non-integral mate distance,
   generation/bound mismatch and same-exchange receipt identity.
8. Maia positives cover history-conditioned and exact-FEN requests. Same FEN/different history,
   model, band, temperature, top-p or width cannot alias; identity/generation mismatch fails.
9. Syzygy direct and queue-backed probes use the same constructor; same body/different FEN and
   same-piece-count/different-FEN joins fail; provider absence and outside-domain stay distinct.
10. Explorer tests cover a captured response and provenance round trip; standard/Chess960 identity,
    illegal/duplicate/noncanonical/count-overflow/history negatives; listed-mass-short positive;
    valid 0/37/100 totals; and per-consumer sample thresholds.
11. Scheduler tests prove arrival-based deadline, queue-full, queued and active cancellation,
    coalesced-subscriber cancellation, exact-key dedupe, weighted eviction, stale generation/model
    refusal and no retention of failures.
12. One mixed-producer fixture compiles a local geometry path as sync and recorded/live tablebase
    paths as sync/interactive without changing the siblings. Equivalent bounded-target paths
    reproduce the same invariant.
13. The Explorer move sentinel cannot reach theory, deterministic text, voice allow-list, provider
    input or wire; raw provider rows are refused by grade, recommendation, theory and personality
    consumers.
14. An application/source census names five real callable operations, one shared scheduler
    composition and the three migration operations in §9. Removing any callable fails the census.
15. `make evidence-manifest-check`, `make semantic-evidence-check`, server/runtime/web typechecks,
    focused provider tests, `make verify-software` and `make verify-governance` pass on committed
    bytes before the RFC is marked implemented.
16. Closeout updates D1390/D1647/D1654/D1655/D1658/D1700–D1709 only to the degree shipped, appends
    `planning/exploration/log.md`, and leaves D963/D1699 plus bounded-target consumer rows open until
    their own projections execute.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | [[D1390]] projection-effective latency, not a producer-wide replacement | `provider-exchange-and-execution` | implementation commit + F1 census | |
| D2 | [[D1647]] same-exchange identity and generation | `provider-exchange-and-execution` | engine exchange fixture + implementation commit | |
| D3 | [[D1654]] literal compiled execution/confidence contract | `provider-exchange-and-execution` | manifest fixtures + implementation commit | |
| D4 | [[D1655]] named production operations and composition | `provider-exchange-and-execution` | application/source census + implementation commit | |
| D5 | [[D1658]] bounded scheduler/cache/cancellation identity | `provider-exchange-and-execution` | scheduler fixtures + implementation commit | |
| D6 | [[D1700]] mixed derived-producer execution paths | `provider-exchange-and-execution` | mixed-producer fixture + implementation commit | |
| D7 | [[D1701]] transitive provider fallback checking | `provider-exchange-and-execution` | binding census + implementation commit | |
| D8 | [[D1702]] reported-confidence fixed point | `provider-exchange-and-execution` | confidence census + implementation commit | |
| D9 | [[D1703]]–[[D1709]] Explorer source identity, validation, scheduling and migration | `provider-exchange-and-execution` | source/migration fixtures + implementation commit | |

D1652/D1653 are source rows implemented here but close only after the returned
`bounded-policy-targets` RFC is amended to point at them. D963/D1699 remain dependent consumer work.

## Open questions

None. Provider-specific response formats and deployment capacity are implementation measurements,
not product rulings. If cross-review finds an uncheckable source identity or operation, this RFC
returns to author instead of accepting a placeholder.

## Changelog

- 2026-08-27: [[D1860]] registered `live.stockfish.position_eval@1` and its fixed-bound operation
  beside the legal-root table so candidate bots and Review consume the same scheduler, engine
  generation and same-exchange receipt instead of creating a private Stockfish authority.
- 2026-08-27: created from the independently measured F1, bounded-target, promotion-race and
  Explorer contract closures.
