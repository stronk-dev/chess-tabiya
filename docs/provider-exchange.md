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
| `syzygy.position@1` | syzygy | `https://tablebase.lichess.org/standard` | `live.syzygy.position_result@2` | `syzygy-position` |
| `lichess_explorer.position_page@1` | lichess_explorer | `https://explorer.lichess.org/lichess` | `human.explorer.position_page@1` | `explorer-position-page` |

The literal rows live in `PROVIDER_PROTOCOL_RESOURCE` (`packages/runtime/src/provider-protocol.ts`).
The register member tuple `PROVIDER_PROTOCOL_MEMBERS` is the shared-resource catalogue's
`provider-protocol` source (`rfc/README.md` "Provider-protocol register"). Compile-time relations
and `provider-protocol.test.ts` prove several things are one set: the tuple, the rows, the
operation-keyed type maps, parsers, normalizers, projections, factories, CLI arms and the ten digest
domains.

Resource image v3 explicitly retains Syzygy's whole-source v1 factory alongside the current
v2 acquisition route. `providerProtocolSourceBinding` resolves an exact registered version;
the compiler and factory both use this authority. New requests always select the current row.
Retained source history neither grants a learner binding nor turns a bare legacy packet into a
whole delivery. Current/retained paths have distinct versioned identities; unknown versions,
crossed whole payloads and forged deliveries refuse. The source census checks the registered
whole-delivery factories rather than counting legacy source-shaped packets as modern evidence.

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
- `apps/server/src/provider-operations.ts` contains the six descriptors.
- `apps/server/src/engine-supervisor.ts#exchange` runs one serialized task. That task captures the
  generation, identity, option image and launched artifact, and runs the `finally` reset.
- `apps/server/src/provider-traversal.ts` is the operator capability, the six `providerTraversal*`
  callables and the CLI.
- `packages/runtime/src/evidence-execution.ts` compiles literal execution paths. Nested choices
  form Cartesian products; repeated inputs retain their full occurrence addresses; semantic
  `dependsOn` edges are not additional execution inputs. The registered digest constructor owns
  path identity, and each path retains its slowest selected latency and exact non-local leaves.

The operation census checks exact consumer id/version pairs. Existing version-1 registrations
remain valid; a declared successor requires its own callable registration, even when both
versions share an implementation. Duplicate declarations cannot overwrite one another.
`make consumer-operation-version-check` covers coexistence, omitted successors, undeclared or
malformed versions, callable drift and non-callable forgeries. This is a prerequisite for
separating modern Explorer execution from standalone compatibility, not a completed migration
of Inspector, repertoire or return-frequency binding contracts.

## Inspector population

Inspector uses `derived.explorer.inspector_population@1`: canonical move rows, WDL counts,
unlisted mass and reported recency derived only from one sealed whole source. The actual
server consumer checks its compiled path and exact normalized position/population/window,
then emits a registered presentation receipt, not a raw statistics object. The browser
checks consumer/projection/renderer identity, population attribution and committed-move
membership without minting provider evidence. Source failure never opens bare fallback;
the route rechecks read access, disclosure and subject after I/O. See
[runtime corpus evidence](runtime-corpus-evidence.md).

## Return frequency

The return queue also consumes a declared narrow Explorer projection:
`derived.explorer.position_frequency@1` retains the whole sealed page internally and derives
only its exact request and literal game count. `runtime.return_frequency@1` declares source
absence as optional item omission. `RunService.dueQueue` checks the registered operation
before acquisition and matches payload and acquisition identities afterward. Its 100-game
floor, same-day tie-break, stored-order fallback and lookup/intake limits are unchanged;
modern source failures never retry bare statistics. This backend-only projection has no
Theory, voice or repertoire binding. See [return and progression](return-and-progression.md).

## Pinned Maia option admission

The supported Maia3 model/source profile (`MAIA3_MODEL_ID` / `MAIA3_SOURCE_COMMIT`) advertises
Temperature and TopP as decimal `string` options, not bounded integer `spin` options. §6 was
owner-amended on 2026-10-01 against the pinned source and actual offline model advertisement.
The descriptor requires unique names, the supported option types and finite positive decimal
defaults (TopP at most one); it never invents a Temperature maximum. Requests stay finite,
Temperature strictly positive and TopP in `(0,1]`, without clamping or replacement values.
Advertised integer Elo/MultiPV bounds, legal width and timeout limits still apply. Request
normalization and literal decimal command bytes are unchanged.

Checks run before commands and over the captured response. The model/version and established
generation must remain the requested pinned ones, and the response requires its actual captured
container. Unsupported/missing/duplicate/malformed options are `invalid_response`, which provider
health reports as `protocol`, not a claim that the process crashed. Identity/generation mismatch
refuses separately. Labelled Mock Maia uses the same decimal grammar but remains labelled synthetic
data; only the actual appliance journey proves real bot play. Amendment and retained source evidence:
`planning/provider-exchange-and-execution/maia-decimal-option-amendment-2026-10-01.md`.

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
  Absolute expiry accepts fractional monotonic instants (the production high-resolution clock),
  not only integer fixture clocks. Non-finite or non-advancing expiry is still non-retainable.
- **Durability (bot replay, D3030).** Stored bytes become a delivery only through
  `parsePersistedProviderDelivery`. It closes the image, re-normalizes the request, re-runs the
  parser and recomputes every digest, then issues fresh seals.

## Operator door

`make provider-traversal OP=syzygy-position < request.json` builds the server and runs
`node apps/server/dist/provider-traversal.js`. The CLI output is a diagnostic
projection/receipt digest line with the compiled execution image on evidence success. Each
traversal validates its registered operation, whole-delivery type and source-factory identity
before acquiring anything. Exit codes: 0 evidence or local-domain result, 3 typed source
failure, 64 usage error. `PROVIDER_TRAVERSAL_OFFLINE=1` disables network providers.
`LICHESS_EXPLORER_TOKEN` enables the explorer and `STOCKFISH_COMMAND` selects the engine. The
bounds are explicit operator values (`OPERATOR_PROVIDER_BOUNDS`) and are not production capacity.

`make provider-exchange-check` runs the focused contract. After a parser source change, regenerate
the parser digest with `UPDATE_PROVIDER_PARSER_IMPLEMENTATION=1`.
`make evidence-execution-check` runs the literal-path/compiler and actual CLI regression suites.

## Not yet shipped

The binding execution primitives now implement §2's closed optional/required source-absence
policy and its aggregation precedence. `compileEvidenceConsumerExecution` strictly compiles
each bound path, requires literal policy for transitive provider leaves, and refuses bindings
whose latency admits no execution path. `aggregateEvidenceConsumerSourceAvailability` validates
the complete set of already-resolved binding/path results and generates compatibility
`providerOff` output. Required unavailable wins over honest-empty; optional failures omit only
their item. Missing policies and raw sources refuse instead of being silently defaulted.

These primitives do not resolve sources or prove per-subject availability. Actual binding-policy
migration and production adoption, the complete manifest execution image/digest and authorized
availability operation remain unshipped. Maia's sampled `bestmove`/off-window contract cannot be
replaced by a policy page's first candidate; D3370 records this source-contract gap. Receipt:
`planning/provider-exchange-and-execution/binding-absence-2026-10-04.md`.


- Whole-manifest §1 execution integration and §2 actual binding-policy adoption, `/capabilities`
  path reach and `POST /evidence/availability`. The strict compiler and operator traversal caller
  now ship, but the legacy catalogue still fails whole-image compilation on unregistered provider
  payloads. It must be migrated truthfully before `CompiledEvidenceManifest.execution` and its
  manifest digest can claim a complete image; no row is silently excluded or assigned a fallback
  operation. Exact run-subject authority ships separately; it is not the availability endpoint.
- Remaining legacy Stockfish/Maia callers. Built-in learner tablebase and Explorer acquisitions
  have migrated (below). Inspector, Theory, repertoire and return-frequency now admit modern
  Explorer sources through their own narrow projections. Explicit standalone Explorer
  compatibility remains until its zero-consumer/zero-operation retirement census.
  D3367's retained whole-source registration is implemented; strict whole-image completion
  still refuses the remaining raw legacy provider projections rather than guessing or excluding them.
  Supplied sources and standalone sourcing/research clients
  are separate, and old node-shaped projections retire only at a proven zero-consumer census.
- Inspector's Maia next-move distribution and remaining legacy Explorer consumer identities.
  The separate Maia observed-move occurrence projections and the integrated move-free Explorer
  population summary ship; this does not retire their older, different consumer contracts.
- (Shipped by `rfc/provider-health-degradation.md`: the Maia container-identity probe for the
  networked sidecar; see `docs/provider-health.md`.)

## Learner tablebase probes

The built-in opponent selector now consumes the whole source delivery through
`probeEvidence` and `opponent.selection@1` before reading any position. It checks the
registered execution operation, seal and exact requested/payload FEN (including clocks).
Root and practical-resistance reply probes share this path; provider failure cannot
fall back to the bare compatibility probe. The bound source is the v2 successor;
the operator-only v1 declaration remains frozen. Standalone/fixture sources and the
durable worker's old packet remain distinct pending their own migration. Receipt:
`planning/provider-exchange-and-execution/tablebase-selection-2026-10-04.md`.

`createApplication` now supplies one `ExchangeTablebaseSource` to the opponent selector, run
service and durable evidence queue when the built-in Lichess tablebase is configured. It calls the
application's shared `syzygy.position@1` operation and source factory, then returns the admitted
position unchanged through the existing `TablebaseSource` interface. It owns no HTTP parser,
fetch, queue or cache. Both FEN clocks remain in exact request identity. More than seven pieces
uses the sealed local preflight and maps to the existing `TABLEBASE_OUT_OF_RANGE`; provider failure
maps to `TABLEBASE_UNAVAILABLE` without a fabricated win/draw/loss or engine fallback.

`healthAdmittedSyzygyOperation` places provider-health admission inside NEW scheduler execution,
after local preflight, retained lookup and exact-key coalescing. It retains status/Retry-After only
within that execution for shared Lichess backoff, and uses the registered parser to validate the
capture before establishing provider health. The scheduler remains the only receipt constructor.
An operation-only cache inventory exposes counts/revisions, not keys or results; expiry, eviction
and invalidation remove exact entries. An outage does not prevent reading a valid exact acquisition
but cannot make a different position available. Each coalesced caller retains its own deadline;
work cancelled during health admission never dispatches later.

Supplied fixture/custom sources retain their existing explicit composition, and
`LichessTablebaseSource` remains for standalone tooling. This checkpoint does not retire their
legacy projections, migrate every provider, or complete the availability/F1 execution surface.
Proof: `make provider-exchange-check`, including the authenticated production opponent route with
optional engines down and the durable evidence queue sharing the same exchange acquisition.

## Learner Explorer acquisition

The built-in `ExchangeCorpusSource` routes live corpus, repertoire and return-frequency requests
through `lichess_explorer.position_page@1`. It owns no HTTP parser, fetch, queue or cache. The
shared refuse-only normalizer retains exact population/window/width/history identity and neutral
FEN counters; unordered requests are refused rather than silently rewritten. `page()` returns
the whole source-factory-sealed delivery, including opening, rating, history and listed/unlisted
counts. `stats()` is a temporary compatibility view over that admitted page, not a new source mint.
It preserves successful zero/sparse counts. Inspector, frontier and return-frequency each apply
their explicit existing 100-game floor outside acquisition; frontier mass is not renormalized.

Repertoire frontiers now use their declared whole-source projection rather than adapting to
bare statistics before admission. The scan checks exact request/payload/acquisition identity
and consumes the registered view. Wrong windows, copied seals and failed modern sources
become unknown, without compatibility fallback. Application health wrapping retains supplied
page methods, receivers and cancellation/deadline; real typed source failures remain unchanged.
Standalone sources lacking a page method retain their explicit compatibility path.

The authenticated Theory module query accepts the declared optional `page` capability,
including supplied sources preserved by health wrapping; it does not require a concrete
source class. Finalized module demand and read/disclosure authority are checked before
acquisition. The service compiles the population-summary source path, captures the exact
position/population/window, and admits the sealed delivery against that request. Crossed
identities, copied authority and acquisition failure produce module-level absence, never
bare-statistics fallback. Sparse and empty valid pages remain usable summary facts, without
a sample floor. Raw move rows stay out of the module wire and external voice inputs.
After I/O, the service rechecks grants and the decision; transport disconnect cancels the
supplied source through its health adapter without poisoning provider health.

`healthAdmittedExplorerOperation` uses the registered parser before health success, preserves real
HTTP status/Retry-After for the shared Lichess coordinator, and executes only for NEW work. Its
retained inventory is the scheduler's operation-only inventory. Each caller's deadline includes
queue/admission time; one cancellation cannot abort surviving coalesced callers. The Node HTTP
bridge now aborts its Fetch request signal on premature transport closure, never on normal
response completion, so closing a corpus request releases its waiter and, if last, upstream work.

The authenticated production route proves shared retention with optional engines down and keeps
its reveal/read authorization and sample policy. Repertoire controls prove sparse abstention
without provider failure and preservation of unlisted mass. The timer-free HTTP negative first
failed before transport wiring and passes after it. The move-free population summary ships;
played-occurrence projections, replacement of legacy node-shaped consumer identities and standalone tooling
migration remain open. No projection or 1.0 capability is declared complete by this checkpoint.
