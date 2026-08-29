# RFC: Provider exchange and projection execution

- **Status:** draft — third-return author repair complete 2026-08-29 for [[D2000]]–[[D2008]].
  Distributive operation results, operation-keyed receipts, crossed-waiter settlement, two-axis
  retention bounds, Syzygy domain abstention, disclosure-only Explorer population, descriptor-owned
  Stockfish command/result authority and one provider-digest registry are now literal contracts.
  The author fixtures pass; fresh independent buildability review still gates implementation.
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
    readonly pathId: `path:sha256:${string}`;
    readonly derivationChoices: readonly {
      readonly projection: VersionedEvidenceId;
      readonly occurrence: readonly number[];
      readonly member: number;
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

`pathId` is the SHA-256 digest of one canonical image containing the output projection/version,
every selected derivation projection/version, its zero-based input-index traversal address and
zero-based member number, each member's literal input order, and the sorted source-requirement
triples. The root occurrence is `[]`; nested addresses append their literal input index, so the same
projection used twice cannot alias itself. It excludes live health, cache contents and
the requesting subject. Equal images produce equal ids; changing an `anyOf` member, input order or
source leaf changes the id. The compiler is the only constructor and rejects duplicate ids with
unequal images.

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

`AdapterDeclaration` gains a required, closed source-absence declaration whenever any compiled
path contains a provider requirement:

```ts
type BindingSourceAbsence =
  | { readonly necessity: "optional"; readonly whenNoPath: "omit_optional_item" }
  | {
      readonly necessity: "required";
      readonly whenNoPath: "honest_empty" | "operation_unavailable";
    };
```

The compiler checks the declaration at the binding-to-path boundary, including transitive provider
leaves. Optional bindings may only omit themselves. Required bindings may only settle the whole
consumer honestly empty or unavailable. A binding also fails when its admitted latency cannot
execute any selected path—for example a sync-only binding over an interactive-only source.

Path satisfaction and aggregation are total:

1. A path is satisfied only when every one of its source leaves is satisfied for the exact
   subject. Build-time/local leaves use the compiled artifact; recorded leaves use exact admitted
   subject evidence; retained/live leaves use the exact normalized provider request. A failed leaf
   makes that path unsatisfied but does not poison a sibling alternative.
2. A binding is satisfied when at least one admitted path is satisfied. Otherwise its literal
   `BindingSourceAbsence` applies.
3. Any missing required `operation_unavailable` binding makes the consumer unavailable. Otherwise
   any missing required `honest_empty` binding makes it honestly empty. Otherwise it is available
   and returns the sorted ids of omitted optional bindings. Local content cannot override either
   required outcome. This precedence covers local+provider, recorded-or-live, differently failing
   providers and all-provider-absent cases.
4. The old consumer `providerOff` scalar becomes a generated compatibility projection of this
   result and is deleted when its client census reaches zero; it is never an input to aggregation.

The global parameterless `GET /capabilities` remains global. It reports the manifest digest,
compiled `pathId`s, static path possibility and current provider reach/health only. It never claims
that a retained page or recorded item exists for an unnamed subject.

Request-specific satisfaction is a separate authenticated operation:

```ts
type EvidenceAvailabilitySubject =
  | { readonly kind: "run_event"; readonly runId: string; readonly eventHeadDigest: string }
  | {
      readonly kind: "module";
      readonly runId: string;
      readonly eventHeadDigest: string;
      readonly module: VersionedEvidenceId;
    }
  | {
      readonly kind: "provider_request";
      readonly operation: ProviderOperationId;
      readonly normalizedRequestDigest: string;
    };

interface SubjectEvidenceAvailabilityRequest {
  readonly subject: EvidenceAvailabilitySubject;
  readonly projectionIds: readonly VersionedEvidenceId[];
}

interface SubjectEvidenceAvailabilityResult {
  readonly subjectDigest: `sha256:${string}`;
  readonly projections: readonly {
    readonly projection: VersionedEvidenceId;
    readonly paths: readonly {
      readonly pathId: `path:sha256:${string}`;
      readonly sources: readonly {
        readonly requirement: {
          readonly projection: VersionedEvidenceId;
          readonly availability: "recorded" | "provider" | "build_time";
        };
        readonly state: "satisfied_build_time" | "satisfied_recorded" | "satisfied_live" |
          "satisfied_retained" | "reachable_live" | "unsatisfied";
      }[];
      readonly state: "satisfied_local" | "satisfied_sources" | "reachable_live" |
        "unsatisfied";
    }[];
  }[];
}
```

The server resolves run evidence and retained entries from the named subject; callers cannot submit
their own cache/recorded assertions. Equal projections queried for different run heads or request
digests can therefore return different satisfaction without making `/capabilities` lie. Static
possibility, live reach, recorded/retained satisfaction, source absence and chess refutation remain
different states. Provider absence cannot become `false`, `draw`, zero population or an empty
recommendation.

Path-state reduction is total and derives only from the returned leaf rows: zero source leaves is
`satisfied_local`; all leaves in a `satisfied_*` state is `satisfied_sources`; otherwise, if every
leaf is either satisfied or `reachable_live` and at least one is reachable, the path is
`reachable_live`; any `unsatisfied` leaf makes the path `unsatisfied`. Source rows are sorted by
projection/version/availability and remain visible, so a mixed recorded/provider path never hides
which leaf is absent. No aggregate state is accepted from a caller.

### 3. One typed exchange receipt

All live source payloads carry a receipt constructed by the scheduler from the capture returned by
the operation that produced the bytes:

```ts
type ProviderOperationProviderMap = {
  readonly "stockfish.legal_root_table@1": "stockfish";
  readonly "stockfish.position_evaluation@1": "stockfish";
  readonly "maia.policy_page@1": "maia";
  readonly "syzygy.position@1": "syzygy";
  readonly "lichess_explorer.position_page@1": "lichess_explorer";
};

interface StockfishCommandIdentity {
  readonly commands: readonly string[];
  readonly commandsDigest: `sha256:${string}`;
}

type ProviderRequestedIdentityMap = {
  readonly "stockfish.legal_root_table@1": Readonly<{
    request: StockfishLegalRootTableRequest;
    command: StockfishCommandIdentity;
  }>;
  readonly "stockfish.position_evaluation@1": Readonly<{
    request: StockfishPositionEvaluationRequest;
    command: StockfishCommandIdentity;
  }>;
  readonly "maia.policy_page@1": Readonly<{ request: MaiaPolicyPageRequest }>;
  readonly "syzygy.position@1": Readonly<{ request: SyzygyPositionRequest }>;
  readonly "lichess_explorer.position_page@1": Readonly<{
    request: ExplorerPositionPageRequest;
  }>;
};

type StockfishActualIdentity = Readonly<{
  id: string;
  name: string;
  version: string;
  binaryDigest: `sha256:${string}`;
  uciOptionsDigest: `sha256:${string}`;
}>;

type ProviderActualIdentityMap = {
  readonly "stockfish.legal_root_table@1": StockfishActualIdentity;
  readonly "stockfish.position_evaluation@1": StockfishActualIdentity;
  readonly "maia.policy_page@1": Readonly<{
    id: string; version: string; runtimeDigest: `sha256:${string}`;
  }>;
  readonly "syzygy.position@1": Readonly<{
    source: "lichess_syzygy"; endpoint: string; apiVersion: string;
  }>;
  readonly "lichess_explorer.position_page@1": Readonly<{
    source: "lichess_explorer"; endpoint: string; apiVersion: string;
  }>;
};

type ProviderAcquisitionReceipt<K extends ProviderOperationId = ProviderOperationId> =
  K extends ProviderOperationId ? Readonly<{
  readonly operation: K;
  readonly provider: ProviderOperationProviderMap[K];
  readonly endpoint: string;
  readonly requestedIdentity: ProviderRequestedIdentityMap[K];
  readonly actualIdentity: ProviderActualIdentityMap[K];
  readonly generation: number | null;
  readonly requestedAt: string;
  readonly retrievedAt: string;
  readonly normalizedRequestDigest: `sha256:${string}`;
  readonly responseDigest: `sha256:${string}`;
}> : never;

type ProviderDelivery<T, K extends ProviderOperationId> =
  | {
      readonly kind: "live";
      readonly servedAt: string;
      readonly cacheIdentity: null;
      readonly acquisition: ProviderAcquisitionReceipt<K>;
      readonly payload: T;
    }
  | {
      readonly kind: "retained_exact";
      readonly servedAt: string;
      readonly cacheIdentity: string;
      readonly acquisition: ProviderAcquisitionReceipt<K>;
      readonly payload: T;
    };

/** The exact payload sealed by every live provider source projection. */
type ProviderEvidenceDelivery<T, K extends ProviderOperationId> = ProviderDelivery<T, K>;
```

The operation maps are the identity authority: neither requested nor actual identity contains an
open `Record`. `makeProviderAcquisitionReceipt<K>()` is a module-private constructor owned by
`provider-exchange.ts`. It receives an admitted descriptor, its normalized request, the identity
captured by that descriptor's live exchange and the exact response bytes; it verifies that
`operation`, `provider`, requested identity and actual identity inhabit the same `K` arm before it
seals the receipt. Descriptors and callers cannot construct, cast or spread a receipt. A runtime
operation/provider mismatch fails as `identity_mismatch`, even when TypeScript has been bypassed.
The constructor also requires the captured endpoint to equal a network actual identity's endpoint,
the captured Stockfish/Maia id and version to equal the requested engine/model, and every normalized
request byte—including bound, timeout, model parameters and population window—to equal the identity
used for request hashing and execution. A mismatched endpoint, engine/model, bound or request image
is `identity_mismatch`; it is never repaired by copying the requested value over the capture.

Stockfish and Maia `generation` are positive safe integers incremented after each successful worker
spawn handshake. Syzygy and Explorer use `null`. The private constructor rejects another
operation/generation pairing. Acquisition is immutable evidence of the operation
that obtained the bytes. A cache hit wraps that same receipt/payload in a new `retained_exact`
delivery with a later `servedAt` and non-null cache identity; it never changes `retrievedAt`,
digests, actual identity or generation. A live delivery has `cacheIdentity: null` and its
`servedAt` equals retrieval completion.

Every `live.*`/`human.*` provider source projection below declares the complete
`ProviderEvidenceDelivery<T, K>` as its F1 payload, not bare `T`. Its exact adapter seals delivery kind,
served/cache identity, immutable acquisition and provider payload together. A downstream derived
projection may read `.payload`, but must retain the admitted delivery input; no adapter may strip
the receipt and then copy provider identity into a new object.

The pending/deduplication key uses the complete normalized requested identity, including the
descriptor-owned Stockfish command image where applicable, but never contains an
actual generation not yet observed. Admission captures actual identity inside the same serialized
exchange. A result is refused if identity or generation changes between execution capture and
response completion. Retained engine results are indexed by the pending key and admitted only when
their captured actual identity/generation equals the supervisor's current established identity; a
cold or unknown generation cannot serve them. A health snapshot or constructor field may not be
stamped onto later bytes.

The two identities are named separately and cannot substitute for one another:

```ts
interface ProviderPendingIdentity {
  readonly operation: ProviderOperationId;
  readonly normalizedRequestDigest: string;
}

interface ProviderRetainedIdentity {
  readonly pending: ProviderPendingIdentity;
  readonly actualIdentityDigest: string;
  readonly generation: number | null;
}
```

`pendingKey` is the canonical digest of `ProviderPendingIdentity`. A retained engine entry is
indexed by that key but carries `ProviderRetainedIdentity`; admission recomputes the actual-identity
digest from the acquisition receipt and compares generation to current supervisor state. Network
providers use `generation: null` while still binding retained admission to actual endpoint/source
identity. Actual identity is never part of request coalescing.

### 3.1 One canonical provider-digest registry

`packages/runtime/src/provider-digest.ts` is the single byte authority for every digest and key in
this RFC. It exports no generic caller-selected tag. Instead it exposes six closed operations:

```ts
type ProviderDigestDomain =
  | "provider.commands.v1"
  | "provider.request.v1"
  | "provider.pending.v1"
  | "provider.actual.v1"
  | "provider.response.v1"
  | "provider.path.v1";

function digestProviderCommands(commands: readonly string[]): `sha256:${string}`;
function digestProviderRequest(image: ProviderRequestDigestImage): `sha256:${string}`;
function digestProviderPending(image: ProviderPendingIdentity): `sha256:${string}`;
function digestProviderActual<K extends ProviderOperationId>(
  operation: K,
  provider: ProviderOperationProviderMap[K],
  identity: ProviderActualIdentityMap[K],
): `sha256:${string}`;
function digestProviderResponse(image: ProviderResponseDigestImage): `sha256:${string}`;
function digestProviderPath(image: CompiledProviderPathDigestImage): `path:sha256:${string}`;
```

For each domain the hashed bytes are exactly
`UTF8("tabiya/" + domain + "\u0000") || UTF8(canonicalProviderJson(image))`.
`canonicalProviderJson` implements RFC 8785 JSON Canonicalization Scheme: recursive object-property
sorting by UTF-16 code units, preserved array order, ECMAScript JSON string escaping and the RFC's
finite IEEE-754 number serialization (`-0` becomes `0`; shortest round-trippable decimal/exponent
form wins). Application validators still require counts, widths, bounds and indices to be safe
integers, while Maia `temperature` and `topP` remain admissible finite decimals. The canonicalizer
rejects `undefined`, array holes, `NaN`, infinities, bigint, symbols, functions and non-plain
objects. The digest is SHA-256 rendered as `sha256:` plus 64 lower-case hexadecimal characters;
`path` adds its literal `path:` prefix only after hashing.

The exact images are closed:

- commands: `{ commands }`, preserving line order and rejecting CR/LF/NUL inside a command;
- request: `{ operation, provider, requestedIdentity }`, where Stockfish requested identity
  includes the descriptor-produced command array and `digestProviderCommands(commands)`;
- pending: `{ operation, normalizedRequestDigest }`;
- actual: `{ operation, provider, actualIdentity }`;
- response: `{ operation, provider, contentEncoding, bodyBase64 }`, where `bodyBase64` represents
  the exact acquired bytes—the complete UCI task transcript for Stockfish and the HTTP response
  body for network providers—without parse/re-serialization;
- path: the exact compiler image specified in §1.

Key reordering is stable; changing an operation, provider, command, request member, actual identity,
raw response byte or path member changes the appropriate digest. The two older canonicalizers may
remain for their schema/manifest domains but cannot produce provider identities. A governance
census rejects another provider hash constructor, raw SHA call or hand-written domain tag.

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
positive `maxActive`, `maxQueued`, `maxRetainedEntries`, `maxRetainedWeight`, `retentionTtlMs` and
a monotonic clock. There are no implicit unbounded defaults.

```ts
interface ProviderRequestScope {
  readonly id: string;
  readonly budgetMs: number;
}

type ProviderOperationId =
  | "stockfish.legal_root_table@1"
  | "stockfish.position_evaluation@1"
  | "maia.policy_page@1"
  | "syzygy.position@1"
  | "lichess_explorer.position_page@1";

interface ProviderOperationRequestMap {
  readonly "stockfish.legal_root_table@1": StockfishLegalRootTableRequest;
  readonly "stockfish.position_evaluation@1": StockfishPositionEvaluationRequest;
  readonly "maia.policy_page@1": MaiaPolicyPageRequest;
  readonly "syzygy.position@1": SyzygyPositionRequest;
  readonly "lichess_explorer.position_page@1": ExplorerPositionPageRequest;
}

interface ProviderOperationResultMap {
  readonly "stockfish.legal_root_table@1": StockfishLegalRootTable;
  readonly "stockfish.position_evaluation@1": FixedBoundPositionEvaluation;
  readonly "maia.policy_page@1": MaiaPolicyPage;
  readonly "syzygy.position@1": LiveSyzygyPosition;
  readonly "lichess_explorer.position_page@1": ExplorerPositionPage;
}

type TypedProviderRequest<K extends ProviderOperationId = ProviderOperationId> =
  K extends ProviderOperationId
    ? Readonly<{ operation: K; request: ProviderOperationRequestMap[K] }>
    : never;

type ProviderSourceFailure<K extends ProviderOperationId> = Readonly<{
  kind: "source_failure";
  operation: K;
  normalizedRequestDigest: `sha256:${string}`;
  failedAt: string;
  reason: "provider_unavailable" | "deadline_exceeded" | "queue_full" | "cancelled" |
    "invalid_response" | "identity_mismatch";
  providerDetail?: string;
}>;

type ProviderSuccess<K extends ProviderOperationId> = K extends ProviderOperationId
  ? Readonly<{
      kind: "success";
      operation: K;
      normalizedRequestDigest: `sha256:${string}`;
      delivery: ProviderDelivery<ProviderOperationResultMap[K], K>;
    }>
  : never;

type TypedProviderResult<K extends ProviderOperationId = ProviderOperationId> =
  K extends ProviderOperationId ? ProviderSuccess<K> | ProviderSourceFailure<K> : never;

interface ProviderExecutionContext {
  readonly signal: AbortSignal;
  readonly remainingMs: number;
  readonly requestedAt: string;
}

interface ProviderExecutionCapture<K extends ProviderOperationId> {
  readonly endpoint: string;
  readonly actualIdentity: ProviderActualIdentityMap[K];
  readonly generation: number | null;
  readonly retrievedAt: string;
  readonly contentEncoding: "uci-utf8" | "http-body";
  readonly responseBytes: Uint8Array;
}

interface ProviderOperationDescriptor<K extends ProviderOperationId> {
  readonly operation: K;
  readonly provider: ProviderOperationProviderMap[K];
  normalizeRequest(
    request: ProviderOperationRequestMap[K],
  ): ProviderRequestedIdentityMap[K];
  execute(
    requestedIdentity: ProviderRequestedIdentityMap[K],
    context: ProviderExecutionContext,
  ): Promise<Readonly<{
    payload: ProviderOperationResultMap[K];
    capture: ProviderExecutionCapture<K>;
  }>>;
  retainedWeight(payload: ProviderOperationResultMap[K]): number;
  admitRetained(acquisition: ProviderAcquisitionReceipt<K>): boolean;
}

type ProviderOperationDescriptors = {
  readonly [K in ProviderOperationId]: ProviderOperationDescriptor<K>;
};

interface ProviderExchangeScheduler {
  get<K extends ProviderOperationId>(
    request: TypedProviderRequest<K>,
    scope: ProviderRequestScope,
    signal: AbortSignal,
  ): Promise<TypedProviderResult<K>>;
}
```

The scheduler constructor accepts one `ProviderOperationDescriptors` exact mapped set—one
for every `ProviderOperationId`, with no extras. Callers provide only the discriminated request,
relative waiting budget and cancellation signal. They cannot provide an absolute deadline,
execution callback, key, weight or receipt.
The scheduler calls the registered descriptor after queue admission, owns failure normalization and
delivery wrapping, and is the sole cache/deduplication authority. It calls `normalizeRequest` once,
computes the request and pending digests through §3.1, then passes that sealed identity to
`execute`. The descriptor returns payload plus same-exchange capture; only the scheduler's private
`makeProviderAcquisitionReceipt` validates the capture, hashes its raw response and seals the
receipt. Engine descriptors enter the supervisor's serialized task inside `execute` and capture
actual identity/generation there.

Each of the five named `*Operation` exports implements its exact
`ProviderOperationDescriptor<operation-id>` member. There is no second public `execute(identity,
signal)` overload or wrapper operation: every descriptor receives `ProviderExecutionContext`, and
the scheduler alone derives that context from caller scope/cancellation. The application census
resolves those five descriptor objects, not five facades plus hidden descriptors.

Rules:

- At caller arrival the scheduler samples its monotonic clock once, validates `budgetMs` as a
  positive safe integer and mints a private waiter deadline `arrival + budgetMs`, before cache,
  dedupe or queue decisions. The caller cannot forge absolute time. The operation's provider
  timeout remains part of the normalized request and therefore shared only by exact-key waiters.
  For a new job the scheduler also mints `executionDeadline = firstArrival + request.timeoutMs`;
  queue time consumes it, dispatch receives only its remaining duration and later joiners cannot
  extend it. Waiter budgets bound each caller's waiting, not the descriptor's common execution.
- Admission order is exact: check an admissible retained entry; otherwise join an equal pending key;
  otherwise reject when the new-job queue is full; otherwise enqueue one new job. Joining pending
  work consumes no additional active or queued slot.
- Exact canonical request identity coalesces. FEN-only keys never coalesce requests whose history,
  model, bound, population window, variant or provider identity differs.
- Engine pending keys contain requested engine id/spec, normalized commands, position, bound and
  timeout, never actual generation. After execution, the retained entry also carries the actual
  identity/generation from acquisition; `admitRetained` compares it to the supervisor's current
  established identity and refuses cold, unknown or changed generations.
- Queue-full, rejection, invalid response, cancellation, timeout and identity mismatch are never
  retained.
- Every waiter settles independently. A shorter waiter reaching its scheduler-minted deadline
  receives its own `deadline_exceeded` result and detaches while a longer waiter remains joined.
  Cancelling one waiter yields `cancelled` only for that waiter. Queued or active shared work is
  aborted only after its final waiter detaches; late results from an aborted job are dropped.
- `retainedWeight(payload)` must return a positive safe integer (`>= 1`); zero, negative,
  fractional, infinite or unsafe weights refuse admission. Retention is bounded simultaneously by
  `maxRetainedEntries` and `maxRetainedWeight`. Before admission the scheduler removes expired and
  identity-stale entries, then evicts least-recently-served entries until both caps would hold;
  equal service times tie by ASCII `pendingKey`. An item heavier than the total weight cap is served
  live and not retained. Failures are never retained.
- Provider/model/generation changes make a retained result stale.
- No hover, pointer-move or board-focus operation may enqueue provider work. An accepted module,
  Review operation, bot policy, authoring operation or explicit inspector request supplies the
  scope and interaction budget.

The first learner-facing consumer must publish and load-test deployment defaults. This RFC's
operator traversal uses explicit small test values; it does not bless them as production latency
or capacity.

The application census resolves every scheduler call to a `ProviderOperationId`, is set-equal to
the request/result maps, and fails for direct provider execution outside a registered descriptor.
No operation may maintain a private queue, retained cache or receipt constructor.

### 5. Stockfish legal-root source

`StockfishLegalRootTableOperation` is the registered descriptor for the following request/result:

```ts
interface StockfishLegalRootTableRequest {
  readonly fen: string;
  readonly bound: { readonly kind: "depth"; readonly value: number };
  readonly requestedWidth: "all_legal";
  readonly moveIdentity: "chessops-king-takes-rook@1";
  readonly requestedEngine: { readonly id: string; readonly version: string };
  readonly timeoutMs: number;
}

interface StockfishLegalRootTable {
  readonly request: StockfishLegalRootTableRequest;
  readonly scoreFrame: "root_side_to_move";
  readonly rows: readonly {
    readonly moveUci: string;
    readonly reachedDepth: number;
    readonly score:
      | { readonly kind: "centipawns"; readonly value: number }
      | {
          readonly kind: "mate";
          readonly outcome: "root_mates" | "root_is_mated";
          readonly distance: number;
          readonly unit: "moves";
        };
    readonly pv: readonly string[];
  }[];
}
```

`live.stockfish.legal_root_table@1` has payload
`ProviderEvidenceDelivery<StockfishLegalRootTable, "stockfish.legal_root_table@1">` and is `search/source_record`,
`bounded_search/measured/reported`, answers evaluation/candidate moves/move/PV, and is
operator-only until a named derived consumer is compiled. Set equality is between unique normalized
`rows.moveUci` and `exactLegalMoves(fen).map(uci)`, with every row reaching the requested depth.
Equal-count replacement, duplicate, missing/extra row and short-depth responses fail. Castling uses
the existing Chess960-safe king-takes-rook identity (`e1a1`/`e1h1`); all four promotion identities
remain distinct. Raw fields may not contain target, opportunity, recommendation or grade meaning.

Every contributing `info` line must contain an exact completed score and PV for its normalized root
move at the requested depth. A line containing `upperbound` or `lowerbound`, a score without a PV,
a PV without a score, a zero-distance mate, an unknown/duplicate MultiPV index or an incomplete
final root table makes the whole response `invalid_response`; bounded rows are never silently
skipped into an apparently complete measured table. The implementation commit changes the existing
capability disposition from the blanket refusal “MultiPV > 1 outside enumerate” to a reached,
narrowly named “all-legal MultiPV for fixed-depth legal-root measurement” row while retaining the
refusal for every other non-enumerator use. A set-equality register test fails if the blanket refusal
survives or the permission widens beyond this operation.

Stockfish's UCI score is interpreted once at the root: cp sign remains in the named
`root_side_to_move` frame; positive/negative mate becomes `root_mates`/`root_is_mated` with absolute
positive safe-integer distance. Candidate consumers never flip rows after applying their moves.
White- and Black-to-move cp fixtures plus winning/losing mate fixtures fail if a White frame, child
frame, signed-distance mate or mate-to-cp sentinel is substituted.

The caller never supplies a command digest. After exact legal-move enumeration, the descriptor
constructs this literal command image inside the serialized supervisor task:

```text
setoption name UCI_ShowWDL value false
setoption name MultiPV value <exact legal move count>
position fen <canonical six-field FEN>
go depth <requested positive depth>
```

The requested identity contains that array and its `digestProviderRequest`-bound command digest.
Before releasing the serialized task, a `finally` block sends `setoption name MultiPV value 1`,
`setoption name UCI_ShowWDL value false`, then `isready` and waits for `readyok`; failed reset makes
the generation unhealthy and forbids reuse. The engine execution boundary returns the actual
engine identity, generation, request digest, output digest and complete task transcript from the
same serialized task. Existing health remains health; it is not exchange provenance.

#### 5.1 Fixed-bound position evaluation

`StockfishPositionEvaluationOperation` is the second Stockfish descriptor and implements
`ProviderOperationDescriptor<"stockfish.position_evaluation@1">`; its only execution entry is
`execute(requestedIdentity, context: ProviderExecutionContext)`,
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
  readonly rawWdl: {
    readonly subject: "side_to_move";
    readonly win: number;
    readonly draw: number;
    readonly loss: number;
  };
  readonly engine: { readonly id: string; readonly name: string; readonly version: string };
  readonly bound:
    | { readonly kind: "movetime"; readonly requestedMs: number; readonly reachedDepth: number | null }
    | { readonly kind: "depth"; readonly requestedDepth: number; readonly reachedDepth: number | null }
    | { readonly kind: "nodes"; readonly requestedNodes: number; readonly reachedDepth: number | null };
}

interface StockfishPositionEvaluationRequest {
  readonly fen: string;
  readonly requestedEngine: { readonly id: string; readonly version: string };
  readonly bound:
    | { readonly kind: "movetime"; readonly requestedMs: number }
    | { readonly kind: "depth"; readonly requestedDepth: number }
    | { readonly kind: "nodes"; readonly requestedNodes: number };
  readonly timeoutMs: number;
}
```

The caller never supplies `normalizedCommandsDigest`. The descriptor normalizes the request, then
constructs the exact command image below and records the array plus its digest in
`ProviderRequestedIdentityMap["stockfish.position_evaluation@1"]`:

```text
setoption name MultiPV value 1
setoption name UCI_ShowWDL value true
position fen <canonical six-field FEN>
go movetime <requestedMs> | go depth <requestedDepth> | go nodes <requestedNodes>
```

The same `finally` reset (`MultiPV 1`, `UCI_ShowWDL false`, `isready`/`readyok`) runs on success,
failure, timeout and cancellation before the generation can serve another task. The pending key is
exact canonical six-field FEN plus requested engine/version, bound, descriptor-owned command image
and timeout; it does not contain actual generation. The acquisition receipt adds actual
engine identity/generation from the serialized execution, and retained admission compares that
identity to the current established supervisor identity.

The result reducer starts empty at the descriptor's `position` command and stops at that task's
first `bestmove`; prior supervisor lines and later-task lines are ineligible. It admits only `info`
lines with one unbounded `multipv 1` (or omitted MultiPV), a finite cp or non-zero mate score and a
three-safe-integer WDL tuple on that same line. For a depth request, the selected line is the last
admissible line at exactly the requested depth. For nodes or movetime, it is the admissible line
with greatest reported depth, breaking equal-depth ties by latest arrival. No line may be assembled
from the score of one iteration and WDL of another. Missing/short depth, `upperbound`, `lowerbound`,
MultiPV other than 1, output after `bestmove`, malformed score or malformed WDL makes the response
`invalid_response`; a previous task's final line cannot satisfy a new task.

The operation therefore produces exactly one completed score and retains that selected line's raw
UCI WDL tuple. WDL is
required to contain three safe integers in `[0,1000]` summing to 1000; a missing, malformed or
different-line WDL makes the response `invalid_response` rather than silently producing a
score-only Review source. The operation converts the engine's declared side-to-move score to the
named White frame using the FEN turn, but deliberately keeps WDL in its declared
`side_to_move` frame. Review owns the node-free White normalization; candidate scoring consumes the
score and cannot reinterpret WDL as quality. White- and Black-to-move cp/mate/WDL fixtures assert
both frames. `live.stockfish.position_eval@1` is
`search/source_record`, has payload
`ProviderEvidenceDelivery<FixedBoundPositionEvaluation, "stockfish.position_evaluation@1">`, is
`bounded_search/measured/reported`, answers evaluation, and carries no node,
best move, PV, rank, loss, grade or recommendation. Bot and Review derive their own frames from this
one source; neither opens a second engine request path.

### 6. Maia policy-page source and run occurrence

```ts
type MaiaPositionRequest =
  | { readonly kind: "history_conditioned"; readonly startFen: string; readonly historyUci: readonly string[] }
  | { readonly kind: "exact_fen"; readonly fen: string };

interface MaiaPolicyPageRequest {
  readonly position: MaiaPositionRequest;
  readonly requestedModel: { readonly id: string; readonly version: string };
  readonly band: number;
  readonly temperature: number;
  readonly topP: number;
  readonly requestedWidth: number;
  readonly timeoutMs: number;
}

interface MaiaPolicyPage {
  readonly request: MaiaPolicyPageRequest;
  readonly appliedBand: number;
  readonly temperature: number;
  readonly topP: number;
  readonly requestedWidth: number;
  readonly returnedWidth: number;
  readonly returnedProbabilityMass: number;
  readonly coverage: "bounded_top_k";
  readonly candidates: readonly { readonly moveUci: string; readonly probability: number }[];
}
```

The pending key includes request kind and every request byte, requested model identity, band,
temperature, top-p, width and timeout. Actual model identity and generation exist only in the
acquisition and `ProviderRetainedIdentity`, never in the pending key. Equal final FEN with different
history is not equal; identical exact-FEN requests may dedupe. Candidate identities are unique legal normalized UCI, probabilities
are finite and non-negative, `returnedWidth` equals candidate count, and
`returnedProbabilityMass` equals their finite sum in `[0,1]`. `coverage: "bounded_top_k"` makes
explicit that missing mass/moves are unobserved rather than impossible; requested/returned width
and mass are retained rather than inferred.

`human.maia.policy_page@1` has payload
`ProviderEvidenceDelivery<MaiaPolicyPage, "maia.policy_page@1">` and is
`human/source_record`,
`human_model/measured/reported`, answers candidate moves only, and is operator-only pending named
consumers. Model mass is likelihood under one declared request, never move quality, intent or a
player diagnosis.

History-conditioned and exact-FEN occurrences are deliberately different projections:

```ts
interface MaiaRunMoveOccurrence {
  readonly page: DeclaredEvidence<
    ProviderEvidenceDelivery<MaiaPolicyPage, "maia.policy_page@1">
  >;
  readonly run: {
    readonly runId: string;
    readonly eventHeadDigest: string;
    readonly startFen: string;
    readonly historyUci: readonly string[];
    readonly reachedFen: string;
    readonly playedMoveUci: string;
  };
}

interface MaiaExactFenMoveOccurrence {
  readonly page: DeclaredEvidence<
    ProviderEvidenceDelivery<MaiaPolicyPage, "maia.policy_page@1">
  >;
  readonly position: { readonly fen: string; readonly observedMoveUci: string };
}
```

`derived.maia.run_move_occurrence@1` accepts only the sealed
`human.maia.policy_page@1` item whose delivery payload request kind is
`history_conditioned`; normalized `startFen` and every ordered `historyUci` byte must equal the
sealed authoritative run path at the named event head, and replay must produce `reachedFen` before
the observed move is joined. Same final FEN with a different path fails. The separate
`derived.maia.exact_fen_move_occurrence@1` accepts only sealed `exact_fen` delivery payloads and requires exact
canonical FEN plus legal observed-move equality; it never claims run history. The current inspector
human split migrates to the projection matching its actual request. The node-shaped
`human.maia.policy@1` is retired only when the generated consumer and operation censuses show zero
remaining callers; it may not serve hypothetical positions.

### 7. Syzygy position source

```ts
interface SyzygyPositionRequest {
  readonly rules: "chess";
  readonly variant: "standard";
  readonly fen: string;
  readonly timeoutMs: number;
}

type SyzygyPositionDomainResult =
  | { readonly kind: "in_domain"; readonly position: TablebasePosition }
  | {
      readonly kind: "outside_domain";
      readonly reason: "piece_count";
      readonly pieceCount: number;
      readonly maximumPieceCount: 7;
    };

interface LiveSyzygyPosition {
  readonly fen: string;
  readonly result: SyzygyPositionDomainResult;
}
```

`live.syzygy.position_result@1` has payload
`ProviderEvidenceDelivery<LiveSyzygyPosition, "syzygy.position@1">` and is `search/source_record`,
`tablebase_exact/exact/not_applicable`, and answers fact/evaluation/candidate moves/move. The full
canonical FEN—including side to move, castling/en-passant fields and clocks—is part of request
identity. `in_domain.position` is admitted only after legal move identity validation. Piece count is
computed locally from the normalized position before network admission; more than seven pieces
returns the successful `outside_domain` arm without calling Syzygy. Provider absence or an invalid
in-domain response is a `ProviderSourceFailure`; exact win/draw/loss inside `TablebasePosition` is
an outcome. These three states have no common fallback and cannot be relabelled as one another.
The descriptor accepts only the literal standard-chess request arm used by the `/standard`
endpoint; another ruleset or variant is an invalid request before provider scheduling, not
`outside_domain`, transport failure or a fabricated tablebase result.

`SyzygyPositionOperation` implements
`ProviderOperationDescriptor<"syzygy.position@1">`; its only execution entry is
`execute(requestedIdentity, context: ProviderExecutionContext)`. That descriptor and the one scheduler-private receipt constructor
serve direct probe and queue-backed evidence. The existing `TablebaseSource.probe` path migrates through it;
there is no pawn-specific or Review-specific tablebase adapter. This source is the live arm later
paired with `recorded.tablebase.result@1`; exact same-FEN joins are owned by the consuming
derivation.

### 8. Explorer position source and narrow projections

The Explorer descriptor accepts and returns this closed, node-free protocol:

```ts
type ExplorerSpeed = "ultraBullet" | "bullet" | "blitz" | "rapid" | "classical" | "correspondence";

type ExplorerHistoryRequest =
  | { readonly kind: "disabled" }
  | { readonly kind: "requested" };

interface ExplorerPositionPageRequest {
  readonly rules: "chess";
  readonly setupFamily: "standard_start" | "from_position";
  readonly variant: "standard";
  readonly positionFen4: string;
  readonly requestFen6: string; // exact positionFen4 plus literal `0 1`
  readonly ratingBuckets: readonly number[];
  readonly speeds: readonly ExplorerSpeed[];
  readonly since: string | null;
  readonly until: string | null;
  readonly moveWidth: number;
  readonly history: ExplorerHistoryRequest;
  readonly topWidth: 0;
  readonly recentWidth: 0;
  readonly timeoutMs: number;
}

interface ExplorerWdlCounts {
  readonly white: number;
  readonly draws: number;
  readonly black: number;
}

interface ExplorerMoveRow {
  readonly canonicalUci: string;
  readonly canonicalSan: string;
  readonly providerSan: string;
  readonly averageRating: number | null;
  readonly counts: ExplorerWdlCounts;
  readonly played: number;
}

interface ExplorerHistoryRow {
  readonly period: string;
  readonly counts: ExplorerWdlCounts;
  readonly played: number;
}

type ExplorerReportedOpening =
  | { readonly kind: "reported"; readonly eco: string; readonly name: string }
  | { readonly kind: "absent" };

type ExplorerReportedHistory =
  | { readonly kind: "reported"; readonly rows: readonly ExplorerHistoryRow[] }
  | { readonly kind: "not_requested" };

type ExplorerPositionPageDomainResult =
  | {
      readonly kind: "zero_population";
      readonly totals: {
        readonly white: 0;
        readonly draws: 0;
        readonly black: 0;
        readonly total: 0;
      };
      readonly moves: readonly [];
      readonly listed: 0;
      readonly unlisted: 0;
      readonly averageRating: null;
      readonly opening: ExplorerReportedOpening;
      readonly history: ExplorerReportedHistory;
    }
  | {
      readonly kind: "population";
      readonly totals: ExplorerWdlCounts & { readonly total: number };
      readonly moves: readonly ExplorerMoveRow[];
      readonly listed: number;
      readonly unlisted: number;
      readonly averageRating: number | null;
      readonly opening: ExplorerReportedOpening;
      readonly history: ExplorerReportedHistory;
    };

interface ExplorerPositionPage {
  readonly request: ExplorerPositionPageRequest;
  readonly source: { readonly status: number; readonly etag: string | null };
  readonly result: ExplorerPositionPageDomainResult;
}
```

`ProviderDelivery.acquisition` retains endpoint, request/response digests and retrieval identity;
`ProviderDelivery` owns live/retained cache delivery. The literal page retains source status/etag,
validated totals, bounded move rows, listed/unlisted mass, average rating, reported opening fields
and the requested history union. Transport/provider abstention is the shared
`ProviderSourceFailure`, never a domain-result variant. Zero population is successful source truth,
not `provider_unavailable` or `honest_empty` invented by the parser.

Normalization rejects unordered/duplicate rating buckets or speeds, invalid date windows,
non-positive move widths, mismatched four-/six-field FEN,
non-standard variants and non-zero top/recent widths. `history: disabled` alone admits
`not_requested`; `history: requested` always returns `reported`, including an empty row list.
The normalizer serializes those arms to the provider's literal `history=false|true`; no history
width exists because the official Lichess `/lichess` operation publishes only the boolean request.
Ingress uses one normalizer and validator shared by `ExplorerClient` and
`LichessCorpusSource`. It requires unique legal normalized UCI, canonical SAN, safe W/D/L counts,
below total is valid. `listed` equals the sum of admitted row `played` counts exactly and
`unlisted = totals.total - listed`; provider SAN and independently normalized canonical SAN both
survive. Totals 0, 37 and 100 are successful source pages. The parser-level 100-game
threshold is deleted; each consumer owns its explicit sample suitability policy.

`human.explorer.position_page@1` has payload
`ProviderEvidenceDelivery<ExplorerPositionPage, "lichess_explorer.position_page@1">` and is `human/source_record`,
`human_corpus/measured/reported`, answers facts and candidate moves, and is operator/full-inspector
only. It carries no completeness, quality, rank, recommendation, intent or causal-outcome meaning.

The provider landing also publishes this literal narrow projection and operation:

```ts
interface ExplorerPopulationSummary {
  readonly page: DeclaredEvidence<
    ProviderEvidenceDelivery<ExplorerPositionPage, "lichess_explorer.position_page@1">
  >;
  readonly position: {
    readonly positionFen4: string;
    readonly requestFen6: string;
    readonly population: {
      readonly ratingBuckets: readonly number[];
      readonly speeds: readonly ExplorerSpeed[];
      readonly since: string | null;
      readonly until: string | null;
    };
  };
  readonly totals: ExplorerWdlCounts & { readonly total: number };
  readonly listed: number;
  readonly unlisted: number;
  readonly averageRating: number | null;
  readonly opening: ExplorerReportedOpening;
  readonly history: ExplorerReportedHistory;
  readonly disclosure: {
    readonly guard: "CORPUS_GUARD";
    readonly statement: typeof CORPUS_GUARD;
  };
}

type ExplorerPopulationSummaryWire = Readonly<Omit<ExplorerPopulationSummary, "page">> & {
  readonly source: {
    readonly provider: "lichess_explorer";
    readonly normalizedRequestDigest: string;
    readonly responseDigest: string;
    readonly delivery: "live" | "retained_exact";
  };
};

function deriveExplorerPopulationSummary(
  page: DeclaredEvidence<
    ProviderEvidenceDelivery<ExplorerPositionPage, "lichess_explorer.position_page@1">
  >,
): ExplorerPopulationSummary;

function explorerPopulationSummaryWire(
  summary: DeclaredEvidence<ExplorerPopulationSummary>,
): ExplorerPopulationSummaryWire;
```

`derived.explorer.population_summary@1` retains the complete delivery, position/window,
totals/WDL, listed/unlisted mass, rating/opening/history and the exact `CORPUS_GUARD` disclosure
text while structurally omitting move rows. `CORPUS_GUARD` says only that population counts describe
play rather than quality; it is not a predicate and this projection contains no `accepted`,
`suitable` or threshold field. The operation derives every field from the admitted page; callers
cannot submit a disclosure or suitability decision. A sentinel present only in
`page.payload.result.moves[]` remains
reachable only through the retained internal source input for provenance/inspector use. The exact
wire adapter replaces that input with the four-field source receipt above; it never spreads or
serializes the payload, and the sentinel is absent from every summary field, deterministic renderer,
provider input and wire byte. Direct JSON serialization of `ExplorerPopulationSummary` is a
governance failure, not a supported transport.

The existing repertoire frontier binding consumes the raw page or a separately declared narrow
frontier projection and retains unlisted mass plus its own literal, consumer-owned sample policy.
Review, repertoire, theory and bot consumers must each name and test any population threshold they
apply; absence of a consumer policy cannot be filled by this source projection.

`derived.explorer.played_move_occurrence@1` does **not** land here ([[D1956]]). Exact occurrence
needs before-position/move/after-position identity, while shipped `run.record.move@1` is narrative
SAN/context and `run.record.position@1` alone has no move edge. The successor join depends on
`recorded-semantic-path`'s exact `run.record.edge@1`, then derives the occurrence from that sealed
edge plus the admitted Explorer delivery. This is ordered 1.0 work, not a descope or permission for
a provider-private run authority.

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
| migration operations | 3 | Maia run occurrence, Maia exact-FEN occurrence, Explorer summary; Explorer played occurrence follows `run.record.edge@1` under [[D1956]] |

The operation census resolves exported callables from the application composition through to each
adapter; a filename, manifest row or constructor-only test is not reachability. Provider source
health later composes with `provider-health-degradation`; that RFC may add circuits and deployment
profiles, but may not create a second receipt, cache or request identity authority.

### 10. Migration order

Implementation is one reviewable RFC but lands in guarded commits in this order:

1. add red F1 execution/confidence/provider-fallback fixtures;
2. compile path-preserving execution metadata and migrate the four confidence declarations plus
   ten current transitive-provider bindings;
3. expose static/global reach through `/capabilities`, then exact subject satisfaction through the
   separate authenticated availability operation and their web types;
4. add the bounded scheduler, same-exchange receipts and five typed source operations;
5. migrate the current Maia/Explorer/Syzygy/Stockfish callers without changing learner semantics;
6. prove operator traversals and retire duplicated authorities only at zero consumers;
7. hand the exact Explorer played-occurrence join to the `run.record.edge@1` successor and leave it
   open until that operation traverses production;
8. close only the rows actually discharged and archive with BACKLOG plus exploration-log closeout.

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
5. Every compiled path has a deterministic content-derived `pathId`. Global capabilities report
   only static/live reach; exact subject availability resolves recorded/retained state server-side.
   Same projection/different subject and same run/different event-head fixtures differ as expected.
   Source absent, cached/recorded, outside-domain, honest-empty and refuted are not interchangeable.
6. All five operation request/result map members and provider payload declarations match §§5–8
   literally and compile through F1 with no second hand-written execution image. Every source
   adapter seals `ProviderEvidenceDelivery<T, K>` rather than bare `T`; stripping acquisition/delivery
   provenance fails. The operation maps, registered descriptors and application callers are
   set-equal.
7. Stockfish positives cover ordinary play, both castling identities and four promotions. Missing,
   duplicate, extra, equal-count replacement, short-depth, `upperbound`, `lowerbound`, score-less-PV
   and PV-less-score tables fail. A capability-register test authorizes only the named all-legal
   measurement and refuses every other non-enumerator MultiPV use. Fixed-bound evaluation separately
   covers White/Black cp and mate orientation, raw side-to-move WDL retention, zero/non-integral
   mate distance, missing/malformed/non-summing/different-depth WDL,
   generation/bound mismatch and same-exchange acquisition identity. Legal-root rows retain one
   `root_side_to_move` frame; White/Black cp and winning/losing mate controls reject child/White
   relabelling and mate-to-cp conversion.
8. Maia positives cover history-conditioned and exact-FEN requests. Same FEN/different history,
   model, band, temperature, top-p or width cannot alias; identity/generation mismatch fails. A
   transposed-history run occurrence and cross-kind occurrence both fail while the exact run path
   and separately typed exact-FEN occurrence pass. Both occurrence payloads retain the exact
   sealed `DeclaredEvidence<ProviderEvidenceDelivery<MaiaPolicyPage, "maia.policy_page@1">>`;
   substituting a bare page,
   bare delivery or different acquisition fails.
9. Syzygy direct and queue-backed probes use the same constructor; same body/different FEN and
   same-piece-count/different-FEN joins fail; provider absence and outside-domain stay distinct.
10. Explorer tests bind a captured response to the literal request/domain-result unions and shared
    normalizer; cover standard/Chess960 identity, illegal/duplicate/noncanonical/count-overflow/
    history negatives; retain provider and canonical SAN; accept listed-mass-short and valid
    0/37/100 totals; distinguish disabled, requested-empty and requested-populated history; and
    apply sample thresholds only in named consumers. The literal summary retains its delivery and
    contains no move-row field or sentinel.
11. Scheduler tests prove arrival-based deadline, queue-full, queued and active cancellation,
    coalesced-subscriber cancellation, exact-key dedupe, weighted eviction, stale generation/model
    refusal and no retention of failures. A cold-engine pending key does not require generation; a
    live→retained fixture keeps one acquisition/retrieval time while delivery/cache state changes;
    cold, restarted and mismatched current generation refuse retained engine results.
12. One mixed-producer fixture compiles a local geometry path as sync and recorded/live tablebase
    paths as sync/interactive without changing the siblings. Equivalent bounded-target paths
    reproduce the same invariant.
13. The Explorer move sentinel cannot reach theory, deterministic text, voice allow-list, provider
    input or wire; raw provider rows are refused by grade, recommendation, theory and personality
    consumers.
14. An application/source census names five real callable operations, one shared scheduler
    composition and the three migration operations in §9. Removing any callable, bypassing
    `scheduler.get`, constructing a receipt elsewhere or adding a private queue/cache fails.
    Explorer played occurrence remains a checked dependency on `run.record.edge@1`, not a fourth
    callable or a provider-local edge.
15. `make evidence-manifest-check`, `make semantic-evidence-check`, server/runtime/web typechecks,
    focused provider tests, `make verify-software` and `make verify-governance` pass on committed
    bytes before the RFC is marked implemented.
16. Closeout updates D1390/D1647/D1654/D1655/D1658/D1700–D1709 only to the degree shipped, appends
    `planning/exploration/log.md`, and leaves D963/D1699 plus bounded-target consumer rows open until
    their own projections execute.
17. The D1871–D1878 amendment harness proves path/subject separation, acquisition/delivery
    separation, history-preserving Maia occurrences, bounded-score refusal, the closed Explorer
    domain union, all four source-absence cross cases, the exact five-operation protocol and
    requested-versus-actual generation. Repeat independent buildability review returns the RFC if
    any fixture is green only because it reads its own expected value.
18. The default `TypedProviderResult` is a distributive five-arm union. Every success and failure
    carries the same literal operation and request digest as its typed request; a generic result
    cannot pair a Stockfish operation with a Maia, Syzygy or Explorer delivery.
19. Requested identity, actual identity, provider and receipt are operation-keyed exact maps. Only
    the scheduler-private constructor seals receipts from a descriptor's captured bytes; open
    records, descriptor-built receipts, wrong provider/generation arms and runtime double-cast
    forgeries fail.
20. A crossed-waiter scheduler fixture gives one exact pending job a short and a long relative
    budget: the short waiter alone reaches `deadline_exceeded`, the long waiter receives the live
    success, one cancellation leaves its sibling attached, and only the final departure aborts the
    queued/active job. Retained lookup, pending join and new-job queue admission execute in the
    specified order and queue time consumes the first-arrival execution timeout.
21. Retention fixtures independently exceed entry count and total weight, reject non-positive or
    non-safe weights, refuse an individually overweight item and prove deterministic expiry/stale
    purge plus least-recently-served/ASCII-key eviction. No failure enters either bound.
22. Syzygy fixtures distinguish locally detected `outside_domain`, successful in-domain
    win/draw/loss and provider failure. No network call occurs outside domain and none of the three
    states can inhabit another arm.
23. Explorer summary fixtures carry the exact `CORPUS_GUARD` disclosure and no suitability boolean
    or source threshold. Two named consumers may make different explicit sample decisions over the
    same sealed page without changing source evidence.
24. Stockfish callers cannot submit command bytes or digests. Legal-root and fixed-evaluation
    descriptors construct the exact option/position/go images in §5, reset MultiPV/ShowWDL and
    synchronize in `finally`. Iterative-output fixtures reject cross-task, post-bestmove,
    cross-iteration score/WDL, bounds and wrong-MultiPV lines while selecting the specified last
    depth or greatest-depth/latest completed line.
25. The provider-digest registry has the six exact domain tags, canonical JSON and output prefixes
    in §3.1. Key reorder preserves digests; operation/provider/command/request/identity/raw-response/
    path mutations change them. Decimal Maia parameters, `-0`, exponent spelling and Unicode keys
    follow RFC 8785 across runtimes. A census finds no second provider digest authority.

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

- 2026-08-29: repaired final return [[D2000]]–[[D2008]] with distributive operation-correlated
  results; exact operation/provider/requested/actual receipt maps and one scheduler-private
  constructor; scheduler-minted crossed-waiter deadlines plus two-axis deterministic retention;
  an explicit Syzygy outside-domain arm; disclosure-only Explorer population; descriptor-owned UCI
  command/reset and iterative-line reduction; and one six-domain provider-digest byte registry.
  The nine able-to-fail author fixtures replace the review reproductions. Fresh independent review
  still gates implementation.
- 2026-08-29: author self-review found [[D2020]] before commit: safe-integer-only canonical JSON
  could not hash Maia's decimal temperature/top-p request. Provider images now use RFC 8785 finite
  number serialization and the author digest fixture crosses decimal, negative-zero and key order.
- 2026-08-28: [[D1969]] amends the existing fixed-bound position-evaluation result rather than
  adding a sixth operation: the same completed Stockfish exchange now retains a validated raw
  side-to-move WDL tuple beside the White-normalized typed score. Review derives its node-free White
  WDL and recorded occurrences from this delivery; no legacy attached row or second engine queue
  becomes a competing authority.
- 2026-08-28: repaired repeat return [[D1950]]–[[D1956]] with sealed Maia delivery inputs; the
  official boolean Explorer-history request; one descriptor execution signature; exact leaf states
  and total path reduction; separate pending/retained identities; a literal Explorer summary and
  narrow wire projection; and an ordered dependency on `run.record.edge@1` for exact played-move
  occurrence. The author contract passes 7/7 at `make provider-exchange-repeat-review`; another
  independent review remains mandatory.
- 2026-08-28: downstream candidate-packet reconciliation found and repaired [[D1943]]/[[D1944]]:
  legal-root rows now declare one root-side-to-move cp/mate outcome frame, and every provider source
  projection seals the complete typed delivery envelope instead of ambiguously dropping
  acquisition/cache provenance at the F1 adapter.
- 2026-08-28: repaired the independent return [[D1871]]–[[D1878]] with a closed scheduler
  request/result/descriptor protocol; requested-versus-actual engine identity; immutable
  acquisition plus mutable delivery provenance; deterministic compiled path ids and separate
  subject-bound availability; total binding absence algebra; literal Explorer request/domain
  payloads; history-preserving Maia occurrence types; and bounded legal-root score refusal. The
  disposable crossed harness is `tools/d1871-provider-exchange-amendment-harness/`.
- 2026-08-27: [[D1860]] registered `live.stockfish.position_eval@1` and its fixed-bound operation
  beside the legal-root table so candidate bots and Review consume the same scheduler, engine
  generation and same-exchange receipt instead of creating a private Stockfish authority.
- 2026-08-27: created from the independently measured F1, bounded-target, promotion-race and
  Explorer contract closures.
