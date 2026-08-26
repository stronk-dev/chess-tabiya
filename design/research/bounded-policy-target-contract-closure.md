# Bounded policy targets — provider and derivation contract closure

**Question:** What production contracts are required before the exact D1023 named-target facts may
be joined to Stockfish and Maia policy evidence without inventing source identity, target meaning,
completeness or unbounded work?

**Rows:** [[D1390]], [[D1647]], [[D1652]]–[[D1658]]

**Date:** 2026-08-26

**Verdict:** The exact three-ply target primitive survives, but the returned RFC cannot be repaired
as one six-projection implementation. It crosses three independently reusable layers: exact target
derivation, generic provider exchange receipts, and target-policy composition. The provider layer
must land before the policy composition; otherwise Review, candidate scoring and bots will each
build a private Stockfish/Maia identity and scheduler. Nine executable falsifiers pass. `[V]`

## Method

- Re-derived the returned review against the shipped F1 compiler/catalogue, exact legal-move
  authority, threat/exchange evidence adapters, engine supervisor, evidence queue,
  `OpponentSelector`, `human-split` route and application source census. `[V]`
- Built `tools/d1652-bounded-target-repair-harness/`, importing those production authorities while
  keeping prospective receipt/scheduler shapes disposable. `[V]`
- Tested source/derivation separation, Maia history identity, F1 confidence, inherited latency,
  operation reach, equal-count legal-table corruption, castling/promotion identity, sealed target
  joins, request/actual identity and bounded cancellation. `[V]`
- Reused D1023's measured chess semantics and provider populations. This pass makes no new chess
  claim and does not reinterpret its 88/96 Stockfish stability or Maia mass measurements. `[V]`

## 1. The implementation boundary is three layers, not one

The current RFC registers target rules, raw provider facts and provider-derived target policy in one
wave. The code audit shows that the two raw provider facts are not bounded-target-specific:

- a complete Stockfish legal-root table is also the missing reusable input for candidate scoring,
  Review alternatives and engine-aware bots;
- a node-free Maia policy page is also the missing reusable input for run human-split, bot policy
  and counterfactual Review;
- same-exchange identity, cancellation, deduplication and retention are provider infrastructure,
  not facts about one target.

The build order is therefore: `[M]`

1. **Exact target derivation:** registered threat + registered legal exchange + complete exact legal
   move map produce named target, immediate result and bounded-return result. Local and provider-free.
2. **Provider exchange receipts:** generic Stockfish legal-root, Maia policy-page and Syzygy
   position-result operations, same-exchange/request identity, complete request keys, bounded
   scheduling and truthful per-projection execution metadata.
3. **Target-policy composition:** joins those raw records to the sealed exact target and publishes
   the two target-specific policy readings, still inspector-only until a module selects them.

This is a dependency split, not a descope. The 1.0 foundation owes all three layers; it simply may
not pretend layer 2 exists by adding an implementation path to the manifest. `[M]`

## 2. The Stockfish source is a generic complete root table ([[D1652]], [[D1656]])

`live.stockfish.target_policy@1` is not a source record: `nextExecution` and
`secondOpportunityAvailable` are interpretations over Stockfish output plus a target convention.
The source record must contain only the exact request, same-exchange receipt and typed response: `[M]`

```ts
interface StockfishLegalRootTable {
  request: {
    fen: string;                         // canonical full FEN
    bound: { kind: "depth"; value: number };
    requestedWidth: "all_legal";
    moveIdentity: "chessops-king-takes-rook@1";
    normalizedCommandsDigest: string;
    timeoutMs: number;
  };
  receipt: ProviderExchangeReceipt;      // actual identity from this exchange
  rows: readonly {
    moveUci: string;                     // canonical authority identity
    reachedDepth: number;
    score: { kind: "cp" | "mate"; value: number };
    pv: readonly string[];
  }[];
}
```

Completeness is set equality between unique `rows.moveUci` and
`exactLegalMoves(request.fen).map(move => move.uci)`, plus `reachedDepth >= requested depth` for
every row. An equal-count replacement fails in the harness. `[V]`

The first run of that fixture caught a second assumption: the exact authority uses Chess960-safe
king-to-rook identity for castling (`e1a1`, `e1h1`), not boundary-normalized king destinations
(`e1c1`, `e1g1`). Promotion identities are the four separate `a7a8{q,r,b,n}` rows. A provider
adapter must normalize engine bytes through the existing inbound-move boundary before set equality;
hand-written UCI expectations are not authoritative. `[V]`

Literal source declaration target: `[M]`

| field | value |
|---|---|
| id | `live.stockfish.legal_root_table@1` |
| role / plane | `source_record` / `search` |
| payload | `StockfishLegalRootTable` |
| grounding / exactness / confidence | `bounded_search` / `measured` / `reported` |
| operands | `request`, `receipt`, `rows` |
| answers | `evaluation`, `candidate_moves`, `move`, `principal_variation` |
| forms | `list`, `panel`, `machine_condition` |
| abstentions | provider unavailable, timeout/cancel, identity mismatch, incomplete root table |
| limitation | engine output and ordering are not target meaning, move quality or advice |
| disposition | `operator_only` until a named target/Review/bot consumer is compiled |

No raw key or payload may contain `target`, `execution` or `opportunity`. The target category is a
`derived.bounded_target` output retaining this source record and the exact target. `[V]`

## 3. Maia needs a node-free request receipt ([[D1653]])

The live route calls `selector.select` with `startFen` plus ordered `historyUci`; the returned
`HumanSplitPage` contains only node id, engine, target Elo and candidates. A hypothetical position
has no truthful node id, while equal final boards reached by different histories are not the same
provider request. `[V]` (`apps/server/src/rest.ts:human-split`; `opponent-selector.ts:#maia`)

The generic source request is a discriminated union: `[M]`

```ts
type MaiaPositionRequest =
  | { kind: "history_conditioned"; startFen: string; historyUci: readonly string[] }
  | { kind: "exact_fen"; fen: string };
```

Its key additionally retains actual model/container request identity, applied band, temperature,
top-p and requested width. The harness proves equal FEN with empty versus four-ply returning history
and exact-FEN mode produce three keys, while two identical exact-FEN requests deduplicate. `[V]`

Literal source declaration target: `[M]`

| field | value |
|---|---|
| id | `human.maia.policy_page@1` |
| role / plane | `source_record` / `human` |
| payload | `MaiaPolicyPageReceipt` |
| grounding / exactness / confidence | `human_model` / `measured` / `reported` |
| operands | `request`, `receipt`, `appliedBand`, `temperature`, `topP`, `requestedWidth`, `candidates` |
| answers | `candidate_moves` |
| forms | `list`, `panel`, `machine_condition` |
| abstentions | provider unavailable, timeout/cancel, identity/model mismatch, model failure |
| limitation | model mass is human-model likelihood at one declared request, never quality or intent |
| disposition | `operator_only` pending migrated human-split and declared policy consumers |

The current `human.maia.policy@1` may remain byte-compatible during the provider landing, but it
must not serve counterfactuals. The provider RFC owes a separately derived run occurrence that joins
one raw page to `run.record.position@1`; only after its inspector binding migrates may the old
node-shaped source be retired. `[M]`

## 4. Same-exchange identity is a result, not constructor state ([[D1647]])

`EngineSupervisor.execute` and `EvidenceEngineClient.execute` return only UCI lines. Health exposes
identity and restart count separately. The engine can restart between any preflight health read and
the queued exchange, so a constructor-captured identity cannot label the returned bytes. `[V]`

The provider operation must return: `[M]`

```ts
interface ProviderExchangeReceipt {
  requestedIdentity: ProviderRequestedIdentity;
  actualIdentity: EngineIdentity;
  generation: number;
  normalizedRequestDigest: string;
  outputDigest: string;
}
```

`generation` is incremented on every successful spawned-engine handshake. The receipt is created
inside the same serialized engine task after `start()` and before/after the response, and the task
refuses if generation/identity changes. The cache key uses requested identity; admission and the
payload use actual identity. A stale generation is never relabelled or retained. The harness makes
the request/actual distinction and stale-result refusal explicit. `[V]`

## 5. Exact target derivation must stay on registered authorities ([[D1657]])

The compiler only permits a projection with derivation members on the `derived` plane. Therefore a
`rules.bounded_target.*` projection that claims to derive from threat/exchange is not a compileable
F1 shape; recomputing the functions to keep a rules-plane label creates the second authority the
review rejected. `[V]` (`compileEvidenceManifest` derived-projection validation)

The three local ids should all be `derived.bounded_target.*`: `[M]`

1. `named_material_target@1` derives from `rules.tactic.consequence.threat@1` and
   `rules.exchange.predicate.legal_exchange@1`;
2. `immediate@1` derives from the named target plus `rules.mobility.reading.legal_moves@1` for the
   candidate source position;
3. `bounded_return@1` derives from the same inputs and retains witnesses/refutations, visited count
   and the 25,000-position abstention.

For material targets the threat item embeds the exact exchange. The join requires literal equality
of passed-position FEN, attacker, victim, capture identity and exchange payload. The harness accepts
the real `a8a1` threat and refuses a cross-target `a8b8` exchange. `[V]`

Candidate UCI must be a member of the exact legal-map item, and its canonical after-FEN is computed
once from that identity. This makes alternatives truthful without inventing `run.record.move`
nodes. The bounded target retains the original declared items, not copied payload-shaped objects.
`[M]`

## 6. F1 must enforce weakest confidence and inherited latency ([[D1654]], [[D1390]])

The shipped compiler rejects widening of exactness, grounding, answer content and abstention but
does not inspect confidence. A disposable derived projection with `confidence: exact` over
`live.stockfish.eval@1` (`reported`) compiles successfully today. The prospective guard rejects it.
`[V]`

Minimum confidence rule: `[M]`

- any derivation member containing `reported` requires output `reported`;
- an all-`not_applicable` member requires `not_applicable`;
- an all-`exact` member may remain `exact` or weaken to `reported` only when the payload explicitly
  records a reported operation;
- every `anyOf` member must satisfy the rule independently.

Adding the guard will expose existing declarations, so the provider RFC must first run a manifest
census and correct every current false confidence. Weakening the check to keep the current manifest
green is forbidden. `[M]`

Latency has the parallel defect. `producer()` maps availability to latency, and
`derived.grade@1` is currently `local/sync` despite a live Stockfish derivation input. The later
promotion-race closure ([[D1700]]) proves a producer-wide replacement is also wrong: one derived
producer may contain local outputs and an `anyOf` projection with recorded/sync and
provider/interactive members. F1 must compile effective latency and source requirements per
projection/member, retaining the producer scalar only as its own-operation default. If that compiler
work is declined, provider-backed outputs require separate producer ids. The harness reproduces
`derived.grade: sync`; `promotion-race-contract-closure.md` supplies the mixed-producer falsifier.
`[V]`

## 7. Provider work needs one shared bounded scheduler ([[D1655]], [[D1658]])

No non-test server source contains a bounded-target operation or application composition today.
`EvidenceJobQueue` has a configurable concurrency default of two and rewind cancellation, but no
generic request dedupe/retained bound; `OpponentSelector` has an unbounded promise cache. `[V]`

The shared provider layer must name these actual operations: `[M]`

- `StockfishLegalRootTableOperation.execute(request, signal)`;
- `MaiaPolicyPageOperation.execute(request, signal)`;
- `ProviderExchangeScheduler.get(request, scope, signal)`;
- one application composition that constructs the scheduler and both operations;
- one operator/research entry that calls each operation before any learner binding exists.

The scheduler contract is configuration, not a magic measured constant: positive
`maxActive`, `maxQueued`, `maxRetainedWeight` and `retentionTtlMs` are mandatory constructor inputs,
with deployment defaults documented and load-tested before the first Review consumer. Exact request
key deduplication is allowed; FEN-only deduplication is not. Rejection, timeout and abort are never
cached. Scope cancellation removes pending work, aborts active provider work and rejects late
results. Retention is weighted because one Stockfish complete table and nine Maia pages are not one
unit. `[M]`

The harness uses small caps to prove the semantics: two active, two queued, a fifth distinct request
refused; an exact duplicate coalesced; a changed generation dropped; scope cancellation removed
queued work; only a matching-generation completion retained. `[V]`

The first product consumer must supply its own request budget. No hover or board-pointer event may
construct provider work; Support, Review and bot callers request it only through their accepted
module/policy operation. `[M]`

## 8. Literal dependency image

The corrected graph is: `[M]`

```text
threat@1 + legal_exchange@1
  -> derived.bounded_target.named_material_target@1
       + exact_legal_moves@1
       -> immediate@1
       -> bounded_return@1

live.stockfish.legal_root_table@1
  + named_material_target@1 + immediate@1 + bounded_return@1
  -> derived.bounded_target.engine_target_policy@1

human.maia.policy_page@1 (one or more exact request receipts)
  + named_material_target@1 + immediate@1 + bounded_return@1
  -> derived.bounded_target.policy_bounds@1
```

The two policy projections are `derived`, `reported`, have provider-bearing effective dependency
members, and are inspector-only. Their
payloads retain the raw receipt(s), all exact target inputs, candidate/counterfactual pair identity,
typed abstention and the D1023 denominator fields. No input is reconstructed from prose, node id or
provider-owned count. `[M]`

## 9. Consequences for the returned RFC and 1.0

The author repair should narrow `bounded-policy-targets` to the exact local arm or explicitly split
it into three RFCs in the dependency order above. It must not remain one accepted document whose
provider half is only an implementation filename. `[M]`

This adds no learner-facing “prophylaxis” label. The exact primitive says the named capture was
removed, returned on some bounded line, or survived every bounded defence. Theory/authored evidence
may call a specific case prophylaxis; a learner module may phrase an obtuse hint over those admitted
facts; neither Stockfish nor Maia manufactures that strategic meaning. `[V]`

Conversely, the provider layer is not optional polish. It is the shared evidence foundation for
complete Review, evidence-aware human-like bots and graduated Support. Those consumers remain
blocked until the raw receipt and scheduler exist, rather than growing private shortcuts. `[M]`

## Limits

- This pass did not rerun D1023's provider population; it preserved the measured facts and tested
  the production contract they must enter. `[V]`
- True cold Maia latency remains unmeasured and stays a discharge before deployment defaults are
  claimed sufficient. `[V]`
- The scheduler's production numeric defaults require a load envelope from the first named consumer;
  this pass establishes mandatory bounded semantics, not an arbitrary capacity number. `[M]`
- The existing confidence census is not yet run; enforcing the rule may reveal additional catalogue
  repairs beyond `derived.story`/`derived.grade`. `[M]`
