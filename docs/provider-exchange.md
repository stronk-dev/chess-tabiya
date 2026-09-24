# Provider exchange

Source: `rfc/provider-exchange-and-execution.md` (§§3–9 implemented 2026-09-24; §§1–2 not yet —
see "Not yet shipped"). Resource: `rfc/provider-protocol-register.md`.

Stockfish, Maia, Syzygy and the Lichess explorer share one exchange. Each provider operation has a
typed request and result. They all share exact request identity, same-exchange provenance,
deadlines, cancellation, deduplication and bounded retention. A consumer receives either sealed
source evidence, a typed local-domain fact or a typed source failure. It never receives a
provider-private shortcut.

## The six operations

| operation | provider | endpoint | source projection | CLI name |
|---|---|---|---|---|
| `stockfish.legal_root_table@1` | stockfish | `stockfish-analysis` supervisor | `live.stockfish.legal_root_table@1` | `stockfish-legal-roots` |
| `stockfish.position_evaluation@1` | stockfish | `stockfish-analysis` supervisor | `live.stockfish.position_eval@1` | `stockfish-position-evaluation` |
| `stockfish.principal_variation@1` | stockfish | `stockfish-analysis` supervisor | `live.stockfish.principal_variation@1` | `stockfish-principal-variation` |
| `maia.policy_page@1` | maia | `maia-5m` supervisor | `human.maia.policy_page@1` | `maia-policy-page` |
| `syzygy.position@1` | syzygy | `https://tablebase.lichess.org/standard` | `live.syzygy.position_result@1` | `syzygy-position` |
| `lichess_explorer.position_page@1` | lichess_explorer | `https://explorer.lichess.org/lichess` | `human.explorer.position_page@1` | `explorer-position-page` |

The literal rows live in `PROVIDER_PROTOCOL_RESOURCE` (`packages/runtime/src/provider-protocol.ts`).
The register member tuple `PROVIDER_PROTOCOL_MEMBERS` is the shared-resource catalogue's
`provider-protocol` source (`rfc/README.md` "Provider-protocol register"). Compile-time relations
and `provider-protocol.test.ts` prove several things are one set: the tuple, the rows, the
operation-keyed type maps, parsers, normalizers, projections, factories, CLI arms and the ten digest
domains.

`stockfish.principal_variation@1` (§5.2) is the bounded engine line. It is a separate operation so
that the evaluation delivery stays score/WDL only. Its request is the evaluation's single-line bound
grammar plus a refuse-only `maxPlies` (`1..MAX_PRINCIPAL_VARIATION_PLIES` = 32). Its command image
sends `UCI_ShowWDL false`, so it never coalesces with an evaluation. The parser uses the same
task-local selection rule as the evaluation over lines that carry a completed score and a PV. It
keeps only the selected line's exact legal moves (king-takes-rook castling identity), truncated to
`maxPlies`, with `truncated`, the actual engine and the requested bound with its reached depth. It
keeps no score, rank or verdict. The only consumer is Review's explicit Analyze reveal
([review evidence](review-evidence.md#the-analyze-line)).

## Modules

- `packages/runtime/src/provider-types.ts` holds the operation-keyed request, result, identity,
  endpoint, receipt, delivery and result unions.
- `packages/runtime/src/provider-digest.ts` is the single digest authority. It has ten closed domains,
  `sha256(UTF8("tabiya/<domain>\0") || RFC-8785 JSON)`, and a dependency-free byte SHA-256.
- `packages/runtime/src/provider-requests.ts` holds the refuse-only request normalizers. It also
  holds the descriptor-owned Stockfish and Maia command images and the Syzygy preflight.
- `packages/runtime/src/provider-parsers.ts` has one parser per operation. Each one reads raw
  capture bytes plus the sealed requested identity. `provider-parser-implementation.generated.ts`
  pins the digest of their local import closure.
- `packages/runtime/src/provider-exchange.ts` holds the `WeakSet` seals, the scheduler-only
  constructors (subpath `@chess-tabiya/runtime/provider-exchange-authority`), the assertions and the
  durable `serializeProviderDelivery` / `parsePersistedProviderDelivery` boundary.
- `apps/server/src/provider-exchange.ts` contains `ProviderExchangeScheduler`.
- `apps/server/src/provider-operations.ts` contains the five descriptors.
- `apps/server/src/engine-supervisor.ts#exchange` runs one serialized task. That task captures the
  generation, identity, option image and launched artifact, and runs the `finally` reset.
- `apps/server/src/provider-traversal.ts` is the operator capability, the five `providerTraversal*`
  callables and the CLI.

## Guarantees

- **Request identity.** `scheduler.normalizedRequestDigest(request)` is the only caller-visible
  request digest. Every result carries it. Equal final FEN with different Maia history never
  aliases. The pending key never contains an engine generation.
- **Receipts.** A descriptor returns only a capture: endpoint, actual identity, generation and raw
  bytes. The acquisition constructor recomputes the request and response digests. It also checks
  the operation → provider → endpoint → actual identity → generation chain. Any disagreement is
  `identity_mismatch`. The payload receipt constructor runs the registered parser itself, so bytes
  and payload cannot be paired by a caller.
- **Evidence.** Each source factory in `evidence-factories.ts` admits only the scheduler-sealed
  delivery of its exact operation, and it seals the whole delivery. This supplies D2 of
  `evidence-value-authority`. `rules.endgame.tablebase_domain@1` admits only the sealed Syzygy
  local-domain envelope.
- **Unavailability.** The closed failure reasons are `provider_unavailable`, `deadline_exceeded`,
  `queue_full`, `cancelled`, `invalid_response` and `identity_mismatch`. An unconfigured provider is
  `provider_unavailable`. Examples: the networked Maia sidecar with no container identity, or the
  explorer without a token. It is never a fabricated result. Mock-engine deployments serve the two
  engine operations through the same exchange from labelled stand-ins (`Mock Stockfish`,
  `Mock Maia`; `apps/server/src/mock-provider-engine.ts`), so Review and bot play run end to end. More than seven
  pieces is the local `outside_domain` fact, not a failure. A zero explorer population is
  successful source truth.
- **Scheduling.** Each waiter gets its own scheduler-minted deadline. Queue time consumes the first
  arrival's execution timeout. Shared work is aborted only when its last waiter leaves. Retention
  is bounded by entries and total weight. It uses LRU/ASCII eviction and an absolute,
  non-refreshing TTL. Failures are never retained. Retained engine results are refused after a
  generation change.
- **Durability (bot replay, D3030).** Stored bytes become a delivery only through
  `parsePersistedProviderDelivery`. It closes the image, re-normalizes the request, re-runs the
  parser and recomputes every digest, then issues fresh seals.

## Operator door

`make provider-traversal OP=syzygy-position < request.json` builds the server and runs
`node apps/server/dist/provider-traversal.js`. The CLI output is a diagnostic
projection/receipt digest line. Exit codes: 0 evidence or local-domain result, 3 typed source
failure, 64 usage error. `PROVIDER_TRAVERSAL_OFFLINE=1` disables network providers.
`LICHESS_EXPLORER_TOKEN` enables the explorer and `STOCKFISH_COMMAND` selects the engine. The
bounds are explicit operator values (`OPERATOR_PROVIDER_BOUNDS`) and are not production capacity.

`make provider-exchange-check` runs the focused contract. After a parser source change, regenerate
the parser digest with `UPDATE_PROVIDER_PARSER_IMPLEMENTATION=1`.

## Not yet shipped

- §1–§2 F1 execution metadata (compiled paths, `pathId`, confidence inheritance, binding
  source-absence), `/capabilities` path reach and `POST /evidence/availability` with the
  run-subject digests.
- Migration of the existing learner callers onto the exchange. Today those are the opponent
  selector, the evidence queue, `TablebaseSource.probe` and the corpus/repertoire explorer paths,
  and they keep their shipped clients. The old node-shaped projections retire only when the
  consumer census reaches zero.
- The Maia occurrence projections and the Explorer population summary (§§6, 8 derived
  projections).
- (Shipped by `rfc/provider-health-degradation.md`: the Maia container-identity probe for the
  networked sidecar; see `docs/provider-health.md`.)
