# RFC: Provider-protocol shared-resource catalogue population

- **Status:** draft — **owner-approved process cut authored on [[D3128]] after the sixth review
  returned [[D2956]]–[[D2959]].** The active obligation is now only one absent descriptor/register
  population through the generic bootstrap. The provider-local Git/acceptance/resource validator
  and its six-round author chain are retained as historical evidence but removed as acceptance
  authority. [[D2956]]–[[D2958]] belong to the generic staged-transition dependency; [[D2959]] and
  durable operation-specific provider parsing belong to `provider-exchange-and-execution.md`.
  `make provider-protocol-cut-contract` checks the bounded active surface. One fresh review of this
  cut and accepted/implemented generic bootstrap still precede implementation.
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

## Active cut contract and acceptance criteria

This section is the complete active contract. The historical product/receipt designs and review
rounds below remain evidence for why the cut exists; they are not implementation or acceptance
authority.

1. `planning/provider-protocol-register/catalogue-additions.v1.json` contributes exactly one
   `provider-protocol` descriptor with lifecycle `sequential`, adapter `canonical_resource@1`,
   introduction `absent`, claim mode `whole_projection` and the exact atomic selector declared in
   the metadata root above.
2. The human-owned `rfc/README.md` register gains exactly `provider-protocol head=absent`, an empty
   Landed table and an empty Live-claims table. It is checked, never generated.
3. The generic bootstrap's accepted catalogue, projection and staged-transition operations are the
   only authorities. This RFC adds no provider-specific Git reader, status parser, canonicalizer,
   acceptance receipt, resource issuer or validation hook.
4. The process landing changes only the descriptor source, checked README register, its focused
   population fixture, docs and required ledger/log/roadmap closeout. It creates no runtime provider
   resource, type, API, schema, migration, content or web byte.
5. The generic engine must already be accepted, implemented and archived. The focused fixture uses
   its opaque staged `canonical_resource@1` projection and build-composition-owned repository
   authority; no raw repository path or caller-built resource is accepted here ([[D2956]]–[[D2959]]).
6. The exact absent image, unrelated-export absence, malformed atomic root, same-transition process
   introduction plus product claim, wrong first claimant and landed-to-missing regression all fail
   through the generic engine. No process-local duplicate of those semantics counts.
7. After this RFC implements and archives, `provider-exchange-and-execution.md` atomically claims
   `provider-protocol | first lane 1 | whole projection` and owns the literal resource, type
   relations, complete operation/digest-domain populations, durable operation-specific provider
   parsers and consumer closure. That product landing, not this process row, discharges [[D2959]]
   and bot-policy [[D3030]].
8. `make provider-protocol-cut-contract` proves the exact bounded source/register/handoff and
   exclusion of the retired provider-local authority from stable governance. Full normal
   verification must pass before implementation and archival.

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

## Historical product-image design (non-normative; transferred)

Everything in this section is retained review history. The active criterion 7 transfers the real
product obligations to `provider-exchange-and-execution.md`; none of the following receipt or
repository mechanisms may be implemented from this process RFC.

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

## Historical independent-population design (non-normative; transferred)

The resource tuple cannot validate its own intended members. A coordinated swap of the tuple and
all derived consumers would otherwise remain internally consistent ([[D2457]]).

Before product acceptance, `provider-exchange-and-execution.md` must publish one
`tabiya-provider-obligations` metadata block containing the already-specified five operation ids
with provider/endpoint/parser/projection/factory/CLI pairings and ten digest
domain/constructor-id pairs. That block is product intent, independently reviewed before runtime
bytes exist. It is not imported by production and is not a second mutable runtime registry.

The acceptance commit also writes the canonical build-only projection
`planning/provider-protocol-register/accepted-obligations.v1.json` with the exact closed shape
`{schema, sourceRfc, obligationsDigest, operations, digestDomains}`. `schema` is the literal
`tabiya.provider-obligations.v1`; `sourceRfc` is the literal
`provider-exchange-and-execution.md`. Each population is strictly sorted by the unsigned
lexicographic UTF-8 bytes of its row's RFC-8785 serialization and contains no duplicate row.
`obligationsDigest` is exactly `sha256:` followed by 64 lowercase hexadecimal characters over
`UTF8("tabiya.provider-obligations.v1\0") || UTF8(RFC8785({operations,digestDomains}))`.
No alternate schema type, prefix, case, encoding, order or extra key parses. The two ordered
populations are byte-equal to the accepted metadata block after canonical parsing. This file is an
acceptance receipt, not product configuration: it is neither copied into a release image nor
imported by runtime code.

Acceptance and implementation are separate commits. Build orchestration walks the required complete
first-parent history and finds the unique transition where `provider-exchange-and-execution.md`
enters `accepted`. It reads the receipt from that exact commit and issues an opaque
`AcceptedProviderObligationsAuthority` carrying that commit id and the SHA-256 digest of the exact
receipt bytes. The product validator accepts those receipt bytes only through that authority; it
does not accept a filename, current-HEAD self-digest or caller-constructed substitute. The product
landing gate additionally requires current committed receipt bytes to equal the accepted bytes and
refuses any staged modification to it while provider product bytes change. An intervening commit
that replaces the receipt and recalculates
its internal digest therefore fails. A later obligation change requires a separately reviewed RFC
amendment, a new versioned acceptance receipt and a new accepted transition before the next product
lane may land; an existing accepted receipt is never rewritten.

Before product landing, `provider-exchange-and-execution.md` owns its exact obligation parser,
consumer-root population and able-to-fail validator. Build orchestration reads the committed
acceptance-receipt bytes and passes them as an explicit input to that pure product validator; the
validator reads neither Git nor RFC prose. This is not a hook smuggled into the descriptor. The
product check:

1. derive the acceptance-transition authority from complete first-parent history, parse the exact
   receipt bytes at that commit, and require current/staged receipt identity to remain unchanged;
2. derive the candidate resource payload from product bytes;
3. require both operation and digest-domain arrays to be in the one canonical row-byte order and
   ordered-equal by complete row identity;
4. require every operation to reach one mapped descriptor, parser, source factory/projection and
   CLI binding; and
5. ask the generic lifecycle engine to consume the sole prior lane claim into an owner-bound
   landed row only after those product checks pass.

The accepted receipt version is immutable after acceptance. A reviewed amendment that owns a next
resource lane creates the next receipt version and a new accepted transition rather than rewriting
history. A count-preserving operation/provider/parser/factory/domain swap in product bytes alone
fails. A coordinated change to current receipt and product bytes fails because the authority reads
the exact earlier accepted-transition preimage.

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

## Superseded pre-cut acceptance criteria (non-normative)

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
11. [[D2909]] Build orchestration derives one opaque acceptance authority from the unique complete
    first-parent transition into `accepted` and pins the exact receipt bytes at that commit. A later
    self-consistent replacement, a caller-constructed authority or a staged receipt edit fails.
12. [[D2910]] Receipt and canonical-resource operation/domain arrays are strictly sorted and unique
    by the unsigned lexicographic UTF-8 bytes of each RFC-8785 row. Ordered equality, not set
    equality, binds the accepted population to the governed resource bytes.
13. [[D2911]] The receipt accepts only schema `tabiya.provider-obligations.v1` and a
    `sha256:`-prefixed 64-character lowercase hexadecimal digest over the exact domain-separated
    bytes. A pinned independent reference fixture and malformed schema/prefix/key fixtures pass.
14. [[D2921]] Acceptance authority requires a complete history projection that witnesses the source
    RFC in draft immediately before its unique transition to accepted. A shallow history whose first
    visible image is already accepted cannot mint authority.
15. [[D2950]] Only a repository-owned reader over the required complete first-parent history can
    issue acceptance authority. Caller arrays, unresolved object ids, broken parent adjacency,
    wrong repository/base and status rows not derived from exact source-RFC bytes fail.
16. [[D2951]] Acceptance authority carries the SHA-256 digest of the exact receipt file bytes from
    the accepted transition, distinct from the receipt's semantic obligations digest. Whitespace,
    key-order or final-newline drift fails even when parsed values are equal.
17. [[D2952]] One build-owned observation binds accepted bytes, committed HEAD bytes, index bytes and
    worktree bytes before product validation. A caller cannot supply any of those observations;
    committed replacement, staged replacement and unstaged replacement each fail independently.
18. [[D2953]] Receipt bytes reject duplicate keys and non-canonical representation before ordinary
    JSON value construction; the resulting parsed value then passes the closed semantic parser.
19. [[D2954]] Receipt and resource canonicalization reuse the repository's shipped RFC-8785
    authority. Lone high and low surrogates fail before digesting or sorting any row.
20. [[D2955]] Every first-parent image after v1 acceptance preserves the exact accepted receipt
    bytes until a separately versioned amendment transition. Mutation, disappearance and
    mutate-then-restore all fail the history projection.

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

## Fourth fresh independent return (2026-09-06)

The third repair closes [[D2874]]–[[D2877]] but leaves three acceptance-authority failures:

1. [[D2909]] — the receipt is self-authenticating mutable HEAD. A commit between product-RFC
   acceptance and product implementation can replace the rows and their self-digest; the later
   landing leaves the receipt unstaged and passes every stated guard. `sourceRfc` names only a
   filename, so no accepted revision or external receipt digest survives the substitution;
2. [[D2910]] — the validator requires set equality while `canonical_resource@1` hashes ordered
   arrays. Permuting either population passes the accepted-obligation join but changes the governed
   resource semantic bytes and digest; and
3. [[D2911]] — the closed receipt shape does not define the literal/type of `schema`, the digest
   domain/input prefix or the digest output encoding. Numeric-schema/prefixed-hex and named-schema/
   bare-hex implementations are both consistent with the current prose and are wire-incompatible.

`make provider-protocol-fourth-fresh-review` retains all three predecessor return/repair rounds,
preserves the generic absent canonical-resource descriptor as a positive control and passes the
three new executable falsifiers. Exact evidence:
`planning/provider-protocol-register/fourth-fresh-independent-buildability-review-2026-09-06.md`.
The RFC remains draft; no descriptor, register, obligation receipt or provider product byte is
authorized.

## Fifth author repair (2026-09-06)

The six returned defects are repaired as one repository-owned boundary. [[D2950]] removes the
history-array API: one operation resolves the repository and walks its actual complete first-parent
history, reading source status and receipt bytes from each commit object. [[D2951]] gives exact
accepted receipt bytes their own digest, distinct from the semantic obligations digest. [[D2952]]
makes landing re-read HEAD, index and worktree bytes rather than accept a `currentReceipt` operand.
[[D2953]] requires the raw file to equal its RFC-8785 canonical image plus one newline before object
parsing. [[D2954]] imports the shipped canonicalizer and its Unicode-scalar refusal. [[D2955]] checks
the exact accepted v1 bytes at every later first-parent image, including mutate-then-restore.

`make provider-protocol-fifth-author-repair` retains all predecessor evidence, passes the 6/6 fifth
fresh-review counterexamples and then passes 6/6 direct repairs plus repository-compatible
TypeScript. Exact receipt:
`planning/provider-protocol-register/fifth-author-repair-2026-09-06.md`. This remains author-contract
evidence; another genuinely fresh review and the generic bootstrap dependency precede acceptance
or implementation.

## Fourth author repair (2026-09-06)

The three returned acceptance-authority defects are repaired as one boundary:

1. [[D2909]] replaces current-HEAD self-authentication with an opaque authority derived from the
   unique first-parent transition into `accepted`, pinning the exact receipt commit and bytes;
2. [[D2910]] sorts both populations by unsigned lexicographic UTF-8 bytes of each RFC-8785 row and
   requires strict unique ordered equality between acceptance receipt and canonical resource; and
3. [[D2911]] fixes the schema literal, domain/input bytes and lowercase `sha256:` output grammar,
   including an independent fixed digest vector and malformed-wire negatives; and
4. [[D2920]] pins the fourth historical review's text/data inputs to commit `ae7fe5b3`, so this
   repair inverts its findings without rewriting the evidence that found them; and
5. [[D2921]] requires the complete history projection to observe an actual draft predecessor and
   transition into accepted status; a shallow suffix beginning at `accepted` fails closed.

`make provider-protocol-fourth-author-repair` retains all earlier returns and repairs plus the
fourth-review descriptor control and 3/3 falsifiers, then passes 4/4 direct inversions. Exact
receipt: `planning/provider-protocol-register/fourth-author-repair-2026-09-06.md`. This is
author-contract evidence, not acceptance or implementation; another genuinely fresh review and the
generic bootstrap dependency remain mandatory.

## Fifth fresh independent return (2026-09-06)

The fourth repair's population order and value-level receipt grammar survive, but the claimed
repository authority is still a caller-constructed model. [[D2950]] accepts invented commit labels
and unproved array order as complete first-parent history. [[D2951]] hashes a re-canonicalized
receipt value rather than exact accepted file bytes. [[D2952]] trusts a supplied current object and
observes neither HEAD, index nor worktree receipt state. [[D2953]] cannot refuse duplicate keys
after JSON has materialized. [[D2954]] implements a partial canonicalizer that hashes lone
surrogates. [[D2955]] ignores changed receipt bytes in every accepted history image after the first.

`make provider-protocol-fifth-fresh-review` retains every predecessor and passes 6/6 fresh
counterexamples. Exact evidence:
`planning/provider-protocol-register/fifth-fresh-independent-buildability-review-2026-09-06.md`.
The RFC remains draft; no descriptor, register, obligation receipt or provider product byte is
authorized.

## Sixth fresh independent return (2026-09-06)

The fifth repair makes accepted receipt bytes exact, but the surrounding build authority is still
not buildable through the lifecycle it is meant to govern:

1. [[D2956]] — after observing acceptance, `scanAcceptance` permits only the literal `accepted`
   source status. The first legal `implementing` successor throws `SOURCE_STATUS`, and moving an
   implemented RFC into the archive becomes `ACCEPTANCE_REGRESSION`;
2. [[D2957]] — `openRepositoryAcceptance(repoDirectory)` still accepts a raw caller path. A complete
   independently constructed lookalike repository mints authority and validates;
3. [[D2958]] — landing binds receipt bytes across HEAD/index/worktree but observes source-RFC status
   only from committed history. A worktree source changed to `withdrawn` remains green before commit
   and turns red after commit; and
4. [[D2959]] — the candidate resource remains a caller-built plain object. The validator succeeds
   when `packages/runtime/src/provider-protocol.ts` is absent from the repository, so no generic
   staged canonical-resource projection owns the supposed product bytes.

`make provider-protocol-sixth-fresh-review` retains all five preceding review/repair rounds and
passes 5/5 new executable counterexamples plus the repository TypeScript contract. Exact evidence:
`planning/provider-protocol-register/sixth-fresh-independent-buildability-review-2026-09-06.md`.
The RFC remains draft; no catalogue, register, receipt or provider product byte is authorized.

## Owner-approved process cut (2026-09-07)

The sixth return established that the remaining failures are not provider-register semantics. The
document had recreated repository identity, RFC lifecycle authority, staged projection and product
validation around one absent catalogue member. [[D3128]] therefore cuts acceptance to the eight
criteria at the top of this document. [[D2956]]–[[D2958]] are obligations of the generic
`shared-resource-register-bootstrap` transition authority; [[D2959]] transfers to the product
landing in `provider-exchange-and-execution`, which also owns durable operation-specific parsing
for bot-policy [[D3030]]. The historical review chain remains executable evidence, but it cannot
require a seventh provider-local repository model or widen this process landing.

## Open questions

None for the owner. The five operations, providers and ten digest domains are existing product-RFC
semantics, not choices made by this process document.

## Changelog

- 2026-09-07: owner-approved process cut on [[D3128]]. The active contract is eight criteria for
  one absent generic catalogue/register population. [[D2956]]–[[D2958]] route to the shared generic
  transition engine; [[D2959]] and durable provider parsing route to
  `provider-exchange-and-execution`. The six review rounds are retained as historical evidence and
  removed from acceptance authority. `make provider-protocol-cut-contract` checks the boundary.
- 2026-09-06: sixth fresh independent review returned the fifth repair on [[D2956]]–[[D2959]]:
  post-accept lifecycle states fail, current source drift is unobserved, repository identity remains
  caller-selected and the product resource is not a staged generic projection. `make
  provider-protocol-sixth-fresh-review` passes 5/5 new counterexamples plus strict TypeScript.
- 2026-09-06: fifth author repair closes [[D2950]]–[[D2955]] at contract tier with an actual
  repository-owned first-parent reader, exact accepted/HEAD/index/worktree byte joins, canonical
  raw receipt parsing through the shared RFC-8785 authority and post-accept byte immutability.
  `make provider-protocol-fifth-author-repair` passes 6/6 plus strict TypeScript.
- 2026-09-06: fifth fresh independent review returned the fourth repair on [[D2950]]–[[D2955]]:
  history and exact bytes remain caller claims, checkout state is unobserved, duplicate keys and
  invalid Unicode enter, and later accepted-receipt mutation is ignored. `make
  provider-protocol-fifth-fresh-review` passes 6/6 fresh counterexamples.
- 2026-09-06: fourth author repair closes [[D2909]]–[[D2911]] and [[D2920]]/[[D2921]] at contract tier with a
  first-parent acceptance-transition authority, canonical ordered populations and one exact
  receipt wire grammar. `make provider-protocol-fourth-author-repair` passes 4/4 repair groups.
- 2026-09-06: fourth fresh independent review returned the third repair on [[D2909]]–[[D2911]]:
  mutable self-authenticating acceptance state, set-equal/order-sensitive resource drift and an
  incomplete receipt wire contract. `make provider-protocol-fourth-fresh-review` passes the three
  new falsifiers plus the descriptor positive control.
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
