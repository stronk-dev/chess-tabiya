# RFC: Provider-protocol shared-resource catalogue population

- **Status:** draft — canonical descriptor/static-resource repair complete 2026-09-01 under
  [[D2499]]/[[D2501]]/[[D2502]], after [[D2455]]–[[D2459]]. Provider protocol now
  inhabits the generic atomic-resource lifecycle, separates runtime literals from compile-time
  relations and binds population to independent accepted product obligations. Fresh independent
  review is required; implementation is unauthorized.
- **Author:** Codex
- **Created:** 2026-08-30
- **Design refs:** none. This is repository process and changes no provider behavior or learner UX.
- **Exploration gate:** [[D2189]] and the fresh buildability review establish the cross-package
  collision/drift problem and the failed bespoke solution
- **Depends on:** accepted and implemented `rfc/shared-resource-register-bootstrap.md`
- **Parent / amends:** adds one descriptor/register through the generic engine
- **Supersedes / superseded by:** supersedes the former C11/`RESOURCE_NAMES` plan
- **Planning:** `planning/provider-protocol-register/`

```tabiya-claims
none
```

```tabiya-resource-descriptor-source
planning/provider-protocol-register/catalogue-additions.v1.json
```

```tabiya-resource-roots
provider-protocol | sequential/canonical_resource@1/absent | packages/runtime/src/provider-protocol.ts#export:PROVIDER_PROTOCOL_RESOURCE | packages/runtime/src/provider-protocol.ts#export:PROVIDER_PROTOCOL_RESOURCE.version
```

## Summary

This RFC introduces one absent `provider-protocol` catalogue root and generated README register.
The future product RFC will create a single atomic
`packages/runtime/src/provider-protocol.ts#PROVIDER_PROTOCOL_RESOURCE` object. Runtime operation and
digest-domain identities derive from that object; request/result type relations are checked beside
it at compile time.

This process document does not create provider bytes, add C11, edit the generic checker, allocate a
second Git history reader or decide provider semantics. It applies the accepted generic
`sequential/canonical_resource@1` profile.

## 1. Exact descriptor and absent image

The catalogue entry is:

| field | value |
|---|---|
| id | `provider-protocol` |
| lifecycle | `sequential` |
| projection adapter | `canonical_resource@1` |
| claim mode | `whole_projection` |
| introduction | `absent` |
| owned selector | `packages/runtime/src/provider-protocol.ts#export:PROVIDER_PROTOCOL_RESOURCE` |
| introduced by | `provider-protocol-register.md` |

Because version, payload and digest are fields of one atomic export, absence means that exact
selector does not resolve. A file with unrelated exports remains absent; a malformed/partial
`PROVIDER_PROTOCOL_RESOURCE` is partial and fails. Once a landed row exists, a missing or renamed
selector is a regression, never a new absence ([[D2459]]).

The process implementation adds the exact marker `provider-protocol head=absent` with header-only
Landed and Live-claims tables. It
does not add the product claim in the same transition.

After this process RFC is implemented and archived,
`provider-exchange-and-execution.md` may be amended to:

```text
provider-protocol | first lane 1 | whole projection
```

The generic transition reader owns staged index-vs-HEAD, committed first-parent history, required
CI base/depth and fail-closed missing-parent behavior ([[D2458]]).

## 2. Future atomic product image

The product landing creates exactly:

```ts
export const PROVIDER_PROTOCOL_RESOURCE = Object.freeze({
  id: "provider-protocol",
  version: 1,
  payload: Object.freeze({
    operations: [/* literal runtime identity rows */],
    digestDomains: [/* literal domain/constructor rows */],
  }),
  digest: "sha256:...",
} as const);
```

The generic adapter parses this closed literal AST without importing the module and verifies the
digest over `{ id, version, payload }`. A sibling compile-only `satisfies` assertion checks the
payload interface; no helper call, spread or referenced object participates in the governed value,
and no function is stored inside the payload.

Each operation payload row contains only canonical JSON fields:

```ts
interface ProviderProtocolOperationIdentity {
  readonly operation: string;
  readonly provider: "stockfish" | "maia" | "syzygy" | "lichess_explorer";
  readonly endpoint: string;
  readonly parserId: string;
  readonly sourceProjection: string;
  readonly sourceFactoryId: string;
  readonly cliName: string;
}
```

Each digest row is literal `{ domain, constructorId }`. Function/type witnesses do not appear in
the canonical payload ([[D2456]]).

Beside the resource, derived types index the literal operation union and one exact compile-only
relation checks:

```ts
interface ProviderProtocolTypeRelations {
  readonly [operation: ProviderOperationId]: {
    readonly request: unknown;
    readonly result: unknown;
    readonly localResult: unknown;
  };
}
```

The product RFC supplies the exact mapped declaration using `satisfies`/indexed types. Server
descriptors, response parsers, source factories, evidence projections and CLI dispatch are mapped
sets keyed by the resource-derived operation union. A copied operation/domain union, array or
switch vocabulary fails the product consumer census.

This distinction is exact: the register seals runtime identity and version; TypeScript proves
request/result relations; provider able-to-fail fixtures prove parser/transport semantics. No
function is mislabeled as a literal field.

## 3. Independent population obligation

The resource tuple cannot validate its own intended members. A coordinated swap of the tuple and
all derived consumers would otherwise remain internally consistent ([[D2457]]).

Before product acceptance, `provider-exchange-and-execution.md` must publish one
`tabiya-provider-obligations` metadata block containing the already-specified five operation ids
with provider/endpoint/parser/projection/factory/CLI pairings and ten digest
domain/constructor-id pairs. That block is product intent, independently reviewed before runtime
bytes exist. It is not imported by production and is not a second mutable runtime registry.

At product landing, the generic whole-projection transition additionally invokes the product RFC's
declared obligation join:

1. parse the exact accepted preimage block from the prior product RFC;
2. derive the candidate resource payload from product bytes;
3. require operation and digest-domain rows to be set-equal by complete row identity;
4. require every operation to reach one mapped descriptor, parser, source factory/projection and
   CLI binding; and
5. consume the sole prior lane claim into an owner-bound landed row.

The obligation block is immutable after acceptance except through a reviewed RFC amendment that
also owns a next resource lane. A count-preserving operation/provider/parser/factory/domain swap in
product bytes alone fails. A coordinated change to both accepted intent and product bytes in one
landing fails because the transition reads the prior accepted claim/obligation preimage.

The initial obligations are not copied into this process RFC. Their authoritative current values
remain the five operation and ten digest-domain declarations already normative in
`provider-exchange-and-execution.md`; its author amendment converts them to the machine block.

## 4. Register and transition behavior

The generic engine supplies all claim and history behavior:

- absent permits only one later `first lane 1 | whole projection` claimant;
- first landing must create the one atomic root, valid digest and version 1;
- it must consume the prior claimant and append exactly one owner-bound landed row;
- later claims target exactly the next positive safe integer;
- fixed-head payload drift, skipped/backward lanes, duplicate claimants and partial roots fail; and
- landed history cannot be deleted, rewritten or returned to absent.

No provider-specific branch exists in `register-check`. Product obligation/consumer joins are
declared validation hooks attached to the descriptor and executed through the generic projection
hook protocol. A hook must be named in the accepted product RFC, receive immutable projected
before/after images, return structured diagnostics and may not read or alter Git state.

## 5. Able-to-fail population fixtures

Using the generic engine, this process implementation crosses:

1. exact absent descriptor/register with no product bytes;
2. absent root plus no claim, ordinary lane, head 0 or landed row;
3. file exists with unrelated export and remains selector-absent;
4. malformed/partial atomic root is not absent;
5. process introduction plus product claim in one transition;
6. exact later first claim;
7. product landing without prior claim, wrong owner or lingering claim;
8. missing/duplicate/computed/non-canonical operation/domain row;
9. runtime function field inside canonical payload;
10. compile-only type map missing/extra operation;
11. copied runtime/server/CLI identity list even when equal;
12. exact derived mapped/indexed consumers;
13. obligation omission, extra and count-preserving coordinated product swap;
14. obligation block changed in the same product landing;
15. version-only/payload-only/digest-only partial resource;
16. fixed-head nested payload drift; and
17. landed-to-missing root with generic first-parent history.

## 6. Implementation boundary and order

The accepted process implementation changes only the shared catalogue, generated README register,
one population fixture set, development docs and this RFC's ledger/log/roadmap closeout. It does
not change `tools/register-check.mjs` except through the already-implemented generic engine and
creates no provider product file.

Order:

1. generic engine is accepted, implemented and archived;
2. fresh independent review executes these seventeen population fixtures;
3. implement the absent descriptor/register and run full normal verification;
4. archive this process RFC with ledger and append-only exploration log;
5. amend/review/accept provider exchange with the exact machine obligation block and lane claim;
6. only then land the atomic resource, type relations and consumers.

## Historical finding routing

[[D2361]] remains the named-absence/first-lane/one-way-history obligation. Its repair is now
implemented by the generic absent lifecycle and atomic selector boundary rather than a bespoke
provider state machine. It closes only after this population's executable criteria pass.

## Acceptance criteria

1. `provider-protocol` exists once in the generic catalogue/register and nowhere in a parallel
   resource-name list.
2. Exact selector absence and atomic canonical-resource semantics refuse partial product authority.
3. The process implementation adds no C11, parser branch, canonicalizer or Git history reader.
4. Runtime payload fields and compile-only type relations are separate and compilable
   ([[D2456]]).
5. Product population is joined to the prior independently accepted obligation block; coordinated
   swaps fail ([[D2457]]).
6. Prior-claim and landed history use the generic staged/first-parent contract ([[D2458]]).
7. All seventeen fixture families can fail for their named reason.
8. Normal `make verify` covers snapshot and transition checks without bespoke user commands.
9. No provider/engine/source/API/schema/storage/content/web/archive/protected-design product bytes
   change in the process implementation.
10. [[D2189]] and [[D2455]]–[[D2459]] close only after executable process criteria pass; provider
    semantics remain blocked on the product RFC.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Generic register engine lands first | shared-resource-register-bootstrap | archived SHA | |
| D2 | Fresh independent review executes the seventeen fixtures | claude | review receipt plus acceptance/corrections | |
| D3 | Absent descriptor/register lands with full verification | codex | implementation SHA plus green `make verify` | |
| D4 | Product RFC publishes accepted obligations, claims lane 1 and later lands the atomic image | provider-exchange-and-execution | accepted preimage plus product SHA | |

## Open questions

None for the owner. The five operations, providers and ten digest domains are existing product-RFC
semantics, not choices made by this process document.

## Changelog

- 2026-09-01: added the complete canonical descriptor candidate and replaced the executable helper
  image with the generic adapter's side-effect-free literal `Object.freeze` shape; the maintained
  author target now asserts the atomic version field.
- 2026-09-01: author-repaired [[D2455]]–[[D2459]]. Rebased onto the generic atomic resource,
  separated runtime literals from type relations, added an independent accepted obligation join
  and inherited the shared temporal/absence contract. Fresh review required; implementation
  remains unauthorized.
- 2026-08-31: fresh independent review returned the D2361 repair on [[D2455]]–[[D2459]].
- 2026-08-31: prior repair removed fictional head 0 and made absence one-way.
- 2026-08-30: initial draft proposed a bespoke C11 and sole tuple authority; both are superseded.
