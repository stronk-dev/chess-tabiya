# Provider-exchange second fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/provider-exchange-and-execution.md` after the D2056–D2062 author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make provider-exchange-second-fresh-review` — 6/6 blocker arms
- **Production status:** untouched; provider implementation remains forbidden

The author repair closes all seven previously returned seams. Runtime seals, run-prefix digests,
absolute TTL, closed provider/cache identities, Syzygy's local envelope and Maia's requested/applied
checks survive this review. Six deeper seams still force an implementer to invent the runtime
subject, evidence-value authority, engine byte identity, production traversal or shared-resource
ownership.

## B1 — run-prefix identity is too coarse for runtime evidence occurrences ([[D2184]])

`EvidenceAvailabilitySubject` carries only `runId + eventHeadDigest`. The resolver key adds the
compiled projection, path and static source occurrence, but no node, edge, position or move-event
identity. A run prefix commonly contains many positions requiring the same projection. The RFC's
own Story eval-shift member needs two Stockfish evaluation requests at `[0]` and `[1]`, but those
addresses distinguish before from after in the derivation grammar; they do not select which move
inside the run is being reviewed. A resolver can choose the active cursor, every matching node or
an arbitrary occurrence while satisfying the published key.

**Required repair:** publish a closed semantic subject union and digest authority at the grains the
compiled paths execute—at minimum exact node/edge/run-prefix identities—then make every resolver
accept that sealed subject. Cross two different moves in one unchanged run head, transpositions,
before/after reversal and a historical node that is not the active cursor.

## B2 — three engine digest brands have no byte authority ([[D2185]])

`EngineBinaryDigest`, `EngineOptionImageDigest` and `EngineContainerDigest` are branded strings, but
the seven-operation provider digest registry constructs none of them. The live `EngineIdentity`
contains no binary or option-image digest, and carries `containerDigest` only as an optional plain
string. Yet Stockfish acquisition requires binary/options digests and Maia acquisition requires
options/container digests. “Project from the live identity” cannot construct fields the identity
does not contain.

**Required repair:** name exact byte images and sole constructors for all three, extend the live
supervisor identity/capture to carry values obtained from the launched artifact and handshake, and
cross caller-authored, stale-generation, same-label/different-binary and reordered/changed option
images.

## B3 — a sealed receipt is not bound to the chess payload beside it ([[D2186]])

`ProviderOperationDescriptor.execute` returns `{ payload, capture }` as independent siblings. The
scheduler hashes `capture.responseBytes`, seals the receipt and freezes the supplied payload, but
no operation requires the payload to be the registered parser/reducer output of those exact bytes.
A descriptor can return payload A beside response bytes B; every receipt and delivery seal still
passes. The downstream `evidence-value-authority` RFC already recognises this missing step by
requiring source factories to verify typed response bytes and result digests, but provider exchange
does not depend on it and its migration seals the provider projections first.

**Required repair:** either make each descriptor return only a sealed raw exchange that one
registered parser turns into the typed result, or bind the typed result to the exact captured bytes
with a parser-specific runtime receipt asserted by the source factory. Split source-projection
landing behind accepted value authority if necessary. Same bytes/different payload,
same payload/different bytes and parser substitution must fail before `declareEvidence`.

## B4 — Explorer status and ETag sit outside acquisition identity ([[D2187]])

`ExplorerPositionPage.source` publishes HTTP status and ETag. `ProviderExecutionCapture` retains
only endpoint, engine identity, generation, content encoding and body bytes, while
`provider.response.v1` hashes only the HTTP body. A descriptor can therefore attach arbitrary
status/ETag metadata to a genuine body, and identical cache identity can carry different claimed
source metadata.

**Required repair:** retain and canonicalize the exact admitted HTTP status and allow-listed headers
in the same exchange capture/response identity, or remove them from evidence. Cross same body with
different status/ETag and headers from another response.

## B5 — the five “adapter traversals” stop before evidence admission ([[D2188]])

Every `providerTraversal*` callable returns `TypedProviderResult` and is specified to call
`scheduler.get`. The same section claims five raw source-adapter traversals and says the composed
census reaches “through `scheduler.get` to each adapter”, but no callable invokes or returns a
declared-evidence adapter. A built CLI can prove acquisition while all five evidence projections
remain dead.

**Required repair:** decide whether these are acquisition traversals or evidence-source traversals.
For the latter, name the typed adapter invocation/output and prove each scheduler success reaches
the exact projection factory; preserve local-domain and source-failure arms without fabricating
evidence. Do not let five scheduler-only positives discharge five evidence producers.

## B6 — the new closed cross-package resources are unregistered ([[D2189]])

The RFC declares `tabiya-claims none` while introducing `ProviderOperationId`,
`ProviderDigestDomain`, endpoint/request/result maps and digest images shared between runtime,
server, CLI and several parallel RFCs. These satisfy RFC-0000 rule 7: closed/versioned, exported
across package boundaries and independently movable by parallel documents. No provider resource
register exists in `rfc/README.md`.

**Required repair:** register the minimum shared provider protocol resource(s), declare the claim
once and make all dependent RFCs consume the registered head. Derive set equality across runtime,
server descriptors, CLI names and digest domains; do not hand-copy another operation list.

## Re-review order

1. Add runtime subject grain and close every engine/provider byte authority.
2. Bind parsed chess values and HTTP metadata to the exact exchange.
3. Make each promised traversal reach its truthful endpoint.
4. Register the shared protocol, invert all six arms, preserve every earlier contract and run full
   verification before requesting another independent review.

No provider, source adapter, learner binding, schema or content implementation is authorized by
this return.
