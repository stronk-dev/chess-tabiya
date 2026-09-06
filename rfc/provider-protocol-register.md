# RFC: Provider-protocol shared-resource catalogue population

- **Status:** draft — **third author repair closes [[D2874]]–[[D2877]] at contract tier.** Malformed
  one-selector resources are `invalid`; a canonical build-only acceptance artifact supplies the
  prior obligation preimage without a runtime registry or product Git reader; process closeout
  leaves product-only defects open; and endpoint identity is the exact structured UCI/HTTPS value
  already owned by the product RFC. `make provider-protocol-third-author-repair` retains the
  complete return/repair chain and passes 4/4 repair groups. Another genuinely fresh review and the
  generic bootstrap dependency remain required. Implementation is unauthorized.
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
provider-protocol | sequential/canonical_resource@1/absent | packages/runtime/src/provider-protocol.ts#export:PROVIDER_PROTOCOL_RESOURCE | none
```

## Summary

This RFC introduces one absent `provider-protocol` catalogue root and a human-owned, mechanically
checked README register.
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
selector does not resolve. A file with unrelated exports remains absent; a malformed
`PROVIDER_PROTOCOL_RESOURCE` is `invalid` and fails. There is no `partial` state for this
one-selector descriptor. Once a landed row exists, a missing or renamed
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
type ProviderProtocolEndpointIdentity =
  | Readonly<{ kind: "uci_supervisor"; engineId: "stockfish-analysis" | "maia-5m" }>
  | Readonly<{
      kind: "https";
      origin: "https://tablebase.lichess.org" | "https://explorer.lichess.ovh";
      path: "/standard" | "/lichess";
    }>;

interface ProviderProtocolOperationIdentity {
  readonly operation: string;
  readonly provider: "stockfish" | "maia" | "syzygy" | "lichess_explorer";
  readonly endpoint: ProviderProtocolEndpointIdentity;
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
type ProviderProtocolTypeRelations = {
  readonly [operation in ProviderOperationId]: {
    readonly request: unknown;
    readonly result: unknown;
    readonly localResult: unknown;
  };
};
```

The product RFC supplies the exact mapped declaration using `satisfies`/indexed types. Server
descriptors, response parsers, source factories, evidence projections and CLI dispatch are mapped
sets keyed by the resource-derived operation union. The product RFC owns the exact source roots,
exemptions and set-equality algorithm that rejects a copied operation/domain union, array or switch;
this process RFC neither guesses that population nor claims it has already run.

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

The acceptance commit also writes the canonical build-only projection
`planning/provider-protocol-register/accepted-obligations.v1.json` with the exact closed shape
`{schema, sourceRfc, obligationsDigest, operations, digestDomains}`. `sourceRfc` is the literal
`provider-exchange-and-execution.md`; `obligationsDigest` is the RFC-8785 SHA-256 digest of
`{operations,digestDomains}`; and the two populations are byte-equal to the accepted metadata
block after canonical parsing. This file is an acceptance receipt, not product configuration: it
is neither copied into a release image nor imported by runtime code.

Acceptance and implementation are separate commits. The product landing gate requires the
receipt to exist in committed HEAD and refuses any staged modification to it while provider product
bytes change. A later obligation change requires a separately reviewed RFC amendment and a new
acceptance commit before the next product lane may land. Thus a coordinated same-landing swap
cannot replace the preimage it is checked against.

Before product landing, `provider-exchange-and-execution.md` owns its exact obligation parser,
consumer-root population and able-to-fail validator. Build orchestration reads the committed
acceptance-receipt bytes and passes them as an explicit input to that pure product validator; the
validator reads neither Git nor RFC prose. This is not a hook smuggled into the descriptor. The
product check:

1. parse the exact committed `accepted-obligations.v1.json` bytes and verify their internal digest;
2. derive the candidate resource payload from product bytes;
3. require operation and digest-domain rows to be set-equal by complete row identity;
4. require every operation to reach one mapped descriptor, parser, source factory/projection and
   CLI binding; and
5. ask the generic lifecycle engine to consume the sole prior lane claim into an owner-bound
   landed row only after those product checks pass.

The obligation block is immutable after acceptance except through a reviewed RFC amendment that
also owns a next resource lane. A count-preserving operation/provider/parser/factory/domain swap in
product bytes alone fails. A coordinated change to both accepted intent and product bytes in one
landing fails because the transition reads the prior accepted claim/obligation preimage.

This product validation is a Discharge and ordering precondition, not an acceptance criterion of
this process RFC. The initial obligations are not copied here. Their authoritative current values
remain the five operation and ten digest-domain declarations already normative in
`provider-exchange-and-execution.md`; its author amendment converts them to the machine block.

## 4. Register and transition behavior

The generic engine supplies all claim and history behavior:

- absent permits only one later `first lane 1 | whole projection` claimant;
- first landing must create the one atomic root, valid digest and version 1;
- it must consume the prior claimant and append exactly one owner-bound landed row;
- later claims target exactly the next positive safe integer;
- fixed-head payload drift, skipped/backward lanes, duplicate claimants and malformed roots fail as
  `invalid`; and
- landed history cannot be deleted, rewritten or returned to absent.

No provider-specific branch or validation-hook protocol exists in `register-check`. The generic
engine proves descriptor, projection, claim and history transitions only. The product RFC's own
normal verification target proves its accepted obligation and consumer closure before it invokes
the generic transition operation; it receives projected before/after values through the public
generic API and may not read or alter Git state.

## 5. Able-to-fail population fixtures

Using the generic engine, this process implementation crosses these ten process-owned families:

1. exact absent descriptor/register with no product bytes;
2. absent root plus no claim, ordinary lane, head 0 or landed row;
3. file exists with unrelated export and remains selector-absent;
4. malformed atomic root is `invalid`, never absent;
5. process introduction plus product claim in one transition;
6. exact later first claim;
7. product landing without prior claim, wrong owner or lingering claim;
8. version-only/payload-only/digest-only malformed resource, each `invalid`;
9. fixed-head nested payload drift; and
10. landed-to-missing root with generic first-parent history.

The product RFC separately owns missing/duplicate/computed/non-canonical operation/domain rows;
runtime function fields; missing/extra type-map operations; copied identity lists; exact derived
consumers; obligation omission/extra/swap; and same-landing obligation mutation. They are not
counted as process fixtures before their source population and validator exist ([[D2812]], [[D2813]]).

## 6. Implementation boundary and order

The accepted process implementation changes only the shared catalogue, human-owned checked README register,
one population fixture set, development docs and this RFC's ledger/log/roadmap closeout. It does
not change `tools/register-check.mjs` except through the already-implemented generic engine and
creates no provider product file.

Order:

1. generic engine is accepted, implemented and archived;
2. fresh independent review executes these ten process population fixtures;
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
2. Exact selector absence and atomic canonical-resource semantics classify every malformed
   product authority as `invalid`.
3. The process implementation adds no C11, parser branch, canonicalizer or Git history reader.
4. Runtime payload fields and compile-only type relations are separate and compilable
   ([[D2456]]).
5. The future product validator has one exact owner and must join population to its prior
   independently accepted obligation block before invoking the generic landing; coordinated swaps
   fail there ([[D2457]], [[D2812]], [[D2813]]).
6. Prior-claim and landed history use the generic staged/first-parent contract ([[D2458]]).
7. All ten process fixture families can fail for their named reason; the seven product families are
   explicit D4 obligations rather than false process coverage.
8. Normal `make verify` covers the maintained current author/review target without bespoke user commands.
9. No provider/engine/source/API/schema/storage/content/web/archive/protected-design product bytes
   change in the process implementation.
10. [[D2189]], [[D2455]], [[D2458]] and [[D2459]] close only after executable process criteria
    pass. Product-only [[D2456]] and [[D2457]] remain open through D4 until the atomic runtime
    image/type relation and independent obligation validator actually land.

## Second fresh independent return (2026-09-05)

The generic descriptor file itself parses, but the repaired process contract is not buildable. The
named `provider-protocol-fresh-review` target still runs the superseded C11/`RESOURCE_NAMES`
assertions and fails on the current RFC, while no successor executes the claimed seventeen fixture
families ([[D2809]]). The RFC twice says the human README register is generated although its generic
parent explicitly keeps that file human-owned and checked ([[D2810]]).

The normative `ProviderProtocolTypeRelations` interface produces TS1337 rather than compiling
([[D2811]]). Its promise to detect copied operation/domain identities has no exact source
population or algorithm ([[D2812]]), and the validation-hook protocol that allegedly supplies the
obligation join does not exist in the exact generic descriptor grammar or bootstrap engine
([[D2813]]). Finally, the canonical-resource routing row names a separate `.version` selector while
the descriptor correctly contains only the atomic root; the generic parent's canonical-resource
row uses `none` ([[D2814]]).

`make provider-protocol-second-fresh-review` reproduces all five groups. Exact receipt:
`planning/provider-protocol-register/second-fresh-independent-buildability-review-2026-09-05.md`.
The RFC remains draft and dependency-blocked; no catalogue/register/provider product byte is
authorized.

## Second author repair (2026-09-05)

The bounded repair closes [[D2809]]–[[D2814]] at contract tier. Both prior review harnesses now
load the exact Git revision they reviewed, so later prose repairs cannot invert historical tests;
the maintained successor target is part of normal verification. README language mirrors the
generic parent's human-owned/check-only rule, and the type relation is a compilable mapped type
with missing-operation failure.

The nonexistent generic hook is deleted. The process RFC now owns only descriptor/projection/
lifecycle behavior; `provider-exchange-and-execution.md` must define and test its exact obligation
parser plus consumer population before it invokes the generic landing. The former seventeen
fixtures split honestly into ten process-owned and seven product-owned families. Finally, the
canonical-resource routing summary uses `none` for its nested version, byte-matching its descriptor
and the parent's example. `make provider-protocol-second-author-repair` retains both returns and
passes 5/5 repair groups. Exact receipt:
`planning/provider-protocol-register/second-author-repair-2026-09-05.md`. Another genuinely fresh
review and the generic bootstrap dependency still gate acceptance and implementation.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Generic register engine lands first | shared-resource-register-bootstrap | archived SHA | |
| D2 | Fresh independent review executes the ten process fixtures | claude | review receipt plus acceptance/corrections | |
| D3 | Absent descriptor/register lands with full verification | codex | implementation SHA plus green `make verify` | |
| D4 | Product RFC publishes accepted obligations, claims lane 1 and later lands the atomic image | provider-exchange-and-execution | accepted preimage plus product SHA | |

## Third fresh independent return (2026-09-06)

The second repair closes its five named issues but leaves four buildability failures:

1. [[D2874]] — the descriptor owns one atomic selector, so a malformed version-only, payload-only
   or digest-only root is `invalid`, not the repeatedly promised `partial` state;
2. [[D2875]] — the product validator must read a prior accepted obligation preimage, but is forbidden
   from reading Git, receives no such preimage through the generic API, and has no descriptor hook;
3. [[D2876]] — acceptance criterion 10 closes [[D2456]]/[[D2457]] on process criteria even though
   their runtime type relation, obligation authority and independent validator are deferred to the
   later product D4; and
4. [[D2877]] — the canonical row requires `endpoint: string`, while the normative product authority
   is a structured UCI-or-HTTPS object and no lossless endpoint identifier or encoding is defined.

`make provider-protocol-third-fresh-review` retains both historical returns and the second repair,
then passes 4/4 executable falsifiers. Exact evidence:
`planning/provider-protocol-register/third-fresh-independent-buildability-review-2026-09-06.md`.
The RFC remains draft and implementation remains unauthorized.

## Third author repair (2026-09-06)

The bounded repair closes [[D2874]]–[[D2877]] at contract tier. The one-selector descriptor now
uses the generic engine's actual `invalid` result for every malformed root. The independently
accepted obligation becomes a canonical build-only receipt committed at product-RFC acceptance;
build orchestration supplies those exact bytes to the pure product validator, while a staged-diff
guard forbids replacing the receipt in the product landing that consumes it. No runtime registry or
product Git/RFC reader is introduced.

Process closeout now names only [[D2189]], [[D2455]], [[D2458]] and [[D2459]]; product-only
[[D2456]]/[[D2457]] remain open through D4. Finally, operation rows carry the exact structured
`uci_supervisor` or `https` endpoint object already used by `ProviderEndpointMap`, so canonical JSON
row equality is lossless and requires no invented string encoding. `make
provider-protocol-third-author-repair` retains the full return/repair chain and passes 4/4 repair
groups. Exact receipt:
`planning/provider-protocol-register/third-author-repair-2026-09-06.md`. Another genuinely fresh
review and the generic bootstrap dependency still gate acceptance and implementation.

## Open questions

None for the owner. The five operations, providers and ten digest domains are existing product-RFC
semantics, not choices made by this process document.

## Changelog

- 2026-09-06: third author repair closes [[D2874]]–[[D2877]] at contract tier: malformed atomic
  roots are `invalid`; a canonical committed acceptance receipt supplies the product validator's
  preimage; process closeout leaves product-only defects open; and endpoint identity is the exact
  structured product value. `make provider-protocol-third-author-repair` passes 4/4 repair groups.
- 2026-09-06: third fresh independent review returned the second repair on [[D2874]]–[[D2877]]:
  unreachable partial-state semantics, an unreadable accepted obligation preimage, premature
  product-defect closeout and an undefined structured-endpoint-to-string mapping. `make
  provider-protocol-third-fresh-review` passes 4/4 reproductions.
- 2026-09-05: second author repair on [[D2809]]–[[D2814]]. Revision-pinned historical reviews,
  restored README ownership, compilable mapped relations, honest process/product validation scope
  and descriptor-equal routing now execute under the maintained Make target.
- 2026-09-05: second fresh independent review returned the generic rebase on [[D2809]]–[[D2814]].
  The descriptor parses, but the maintained test, README ownership, type relation, consumer/hook
  closure and routing summary do not match the claimed build.
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
