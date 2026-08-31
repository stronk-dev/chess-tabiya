# RFC: Provider-protocol shared-resource register

- **Status:** draft — RETURNED by fresh independent review 2026-08-31 on
  [[D2455]]–[[D2459]]. Named absence survives, but the bespoke register conflicts with the generic
  bootstrap, operation rows contradict literal-field closure, the sole tuple cannot independently
  reject swaps, previous-claim history is unavailable in CI and partial product authority still
  reads absent. `make provider-protocol-fresh-review` reproduces 5/5; implementation is forbidden.
- **Author:** codex
- **Created:** 2026-08-30
- **Design refs:** none. This is repository process and changes no provider behavior or learner UX.
- **Exploration gate:** [[D2189]] and the executable second fresh provider review establish the
  cross-package collision/drift defect
- **Depends on:** implemented `rfc/archive/shared-resource-registers.md`; the returned assistance
  and semantic-convention register RFCs do not need to land first because this resource receives a
  distinct grammar/check number and no shared node walker
- **Parent / amends:** RFC-0000 rule 7; `rfc/README.md`; `tools/register-check.mjs`
- **Supersedes / superseded by:** —
- **Planning:** `planning/provider-protocol-register/`

```tabiya-claims
none
```

## Fresh independent return (2026-08-31)

The D2361 repair correctly removes fictional head 0 and makes landed history one-way. Five
buildability blockers remain:

- [[D2455]] — the bespoke `RESOURCE_NAMES`/C11 plan conflicts with the active generic catalogue;
- [[D2456]] — “every operation field literal” contradicts three function-witness fields and an
  undeclared constructor;
- [[D2457]] — the sole tuple has no independent authority capable of refusing a coordinated swap;
- [[D2458]] — prior-claim landing has no staged/first-parent or CI history contract; and
- [[D2459]] — absence watches only the version symbol and admits a partial declaration artifact.

`make provider-protocol-fresh-review` reproduces 5/5. Exact evidence is in
`planning/provider-protocol-register/fresh-independent-buildability-review-2026-08-31.md`.
Generic-process reconciliation and another author repair/review are required before C11 or product
protocol bytes.

## Summary

Register `provider-protocol` before `provider-exchange-and-execution.md` creates a tenth
cross-package authority with hand-copied operation, digest, endpoint, parser, factory and CLI lists.
The tree starts explicitly absent. The provider RFC claims `first lane 1` only after this process RFC
lands; its implementation creates one literal protocol declaration artifact from which runtime
types, server registries, source factories, CLI names and register checks derive.

This RFC changes no provider, engine, source evidence, API, schema, content or learner binding. It
only makes the future authority claimable and drift-checked.

## 1. Resource and claim grammar

The explicit absent-root lifecycle, unique `first lane 1` claim and landed-to-missing refusal are
the durable owner route for [[D2361]]; a fresh reviewer must verify that repair before this RFC can
be accepted.

`RESOURCE_NAMES` gains `provider-protocol`. Its claim forms are:

```text
provider-protocol | first lane 1 | <one or more sorted unique symbol tokens>
provider-protocol | lane <positive safe integer greater than the landed head> | <one or more sorted unique symbol tokens>
```

The resource is sequential and single-writer. While absent, exactly one claimant uses `first lane
1`; ordinary numeric/member claims fail. Once landed, at most one live claim exists and it must
equal `tree head + 1`; first, same-head, skipped, backward, duplicate or parallel claims fail. Symbol tokens use
the existing `path#symbol` grammar and are compared as a sorted set, not prose.

When this process RFC lands, `provider-exchange-and-execution.md` atomically replaces `none` with:

```text
provider-protocol | first lane 1 | packages/runtime/src/provider-protocol.ts#PROVIDER_PROTOCOL_DECLARATIONS; packages/runtime/src/provider-protocol.ts#PROVIDER_PROTOCOL_VERSION
```

Its Active-register claim cell and the new register's live row contain the same lane, owner and
symbols. Until then the provider RFC remains draft and explicitly cannot be accepted.

## 2. One tree authority

The product landing creates `packages/runtime/src/provider-protocol.ts` with exactly:

```ts
export const PROVIDER_PROTOCOL_VERSION = 1 as const;

export const PROVIDER_PROTOCOL_DECLARATIONS = defineProviderProtocol([
  // five literal rows; no second operation list
] as const, [
  // ten literal digest-domain rows; no second domain list
] as const);
```

Each operation row is one discriminated declaration containing:

```ts
interface ProviderProtocolOperationDeclaration<
  K extends string,
  Request,
  Result,
  LocalResult,
> {
  readonly operation: K;
  readonly provider: "stockfish" | "maia" | "syzygy" | "lichess_explorer";
  readonly endpoint: ProviderEndpoint;
  readonly parser: string;
  readonly sourceProjection: VersionedEvidenceId;
  readonly sourceFactory: string;
  readonly cliName: string;
  readonly requestType: (value: Request) => Request;
  readonly resultType: (value: Result) => Result;
  readonly localResultType: (value: LocalResult) => LocalResult;
}
```

The three type witnesses are identity-only compile-time helpers created inside the module; they are
not parsers or callbacks supplied by consumers. `ProviderOperationId`, provider/endpoint maps,
request/result/local maps, parser-id map, source projection/factory maps and CLI-name union derive
from the tuple. Server descriptors and parsers are mapped sets keyed by its derived operation union.
The CLI dispatch iterates/looks up the declaration rather than declaring a second switch vocabulary.

The digest-domain tuple contains literal `{ domain, constructor }` rows. `ProviderDigestDomain` and
the constructor census derive from it. The ten initial domains are the three engine identities plus
seven provider identities specified by the provider RFC; their literal membership is supplied by
that RFC's lane claim and author contract, not copied into this process RFC.

No dependent RFC may export a competing operation/domain union. Friendly aliases must be derived
types over this artifact. Request/result chess semantics, parser behavior and digest byte images
remain owned by `provider-exchange-and-execution`; this resource owns their shared identities and
join, not their implementation meaning.

## 3. Pre-landing state and README register

`rfc/README.md` gains:

```text
## Provider-protocol register
<!-- register: provider-protocol head=absent -->
<!-- contract-digest: provider-protocol absent -->
```

The exact future root is
`packages/runtime/src/provider-protocol.ts#PROVIDER_PROTOCOL_VERSION`. The Landed table is empty and
the Live claims table contains provider exchange `first lane 1`. A missing root is legal only while
the state is `absent`, Landed is empty and exactly one valid first claim exists. Head 0 is invalid
in markers, rows, claims and CLI output. Once any Landed row exists, a missing or renamed root is
`LANDED_RESOURCE_CANNOT_BECOME_ABSENT`, never a withdrawal or a second first claim.

On the product landing, the checker derives head 1 and the complete identities from the literal
artifact, the README moves lane 1 to Landed with its owning RFC, and the live claim disappears in
the same commit. Later claims must target the next integer and their product transition must change
the literal version plus declaration image atomically.

## 4. C11 closure

`make register-check` adds C11 without changing C1–C10 semantics. Using the pinned TypeScript
Program/TypeChecker, it proves:

1. exactly one resource/register/head line exists;
2. claim and README rows are bijective and sequential;
3. the pre-landing state is `absent`, has empty Landed and exactly one `first lane 1` claim;
4. after landing, version and declaration tuple are literal, closed and tree/Landed-equal;
5. operation ids are unique and every operation field is literal and exact;
6. digest domains and constructor symbols are unique and exact;
7. runtime exported maps/types, server descriptor/parser mapped sets, value-authority factory map and
   CLI dispatch derive from the tuple—AST aliases/indexed access are admitted; copied unions,
   switches or arrays fail;
8. every declaration reaches exactly one descriptor, parser, source factory/projection and CLI name;
9. lane transition bytes match the previous claim owner/symbols and remove that claim; and
10. a count-preserving operation/domain/factory/CLI swap fails.

The checker does not infer that a parser is truthful or an engine digest is byte-authoritative;
those able-to-fail behaviors remain provider acceptance criteria. It prevents identity drift and
parallel ownership only.

## 5. Able-to-fail process fixtures

The process implementation crosses at least:

1. absent named root + `head=absent` + empty Landed + exact first-lane-1 claim passes;
2. absent root without a first claim, with numeric head, ordinary lane/member claim or Landed row fails;
3. duplicate resource/register/head or claim fails;
4. same/skipped/backward/unsafe lane fails;
5. two live claimants fail;
6. literal product tuple + matching Landed + no claim passes;
7. missing/duplicate/computed/broad operation row fails;
8. missing/duplicate/computed digest row fails;
9. copied runtime/server/CLI operation list fails even when equal;
10. derived mapped/indexed aliases pass;
11. one descriptor/parser/factory/projection/CLI omission or extra fails;
12. count-preserving operation, parser, projection, factory, CLI or domain swap fails;
13. product landing without the prior exact claimant, with wrong owner/symbols or leaving the claim
    live fails; and
14. landed history followed by missing/renamed root fails and cannot accept another first claim;
15. unrelated provider semantic byte changes remain outside C11 rather than producing a false
    process guarantee.

## 6. Implementation boundary and order

The process implementation may change only `tools/register-check.mjs`, its tests, `rfc/README.md`,
the provider RFC claim block/register cell, this RFC's docs/closeout records and the deterministic
roadmap receipt. It creates no provider protocol product file.

Order:

1. fresh independent review executes the fifteen process fixtures;
2. implement C11 plus the empty register and provider lane-1 claim;
3. run normal `make register-check`, governance and full verification;
4. archive this process RFC with ledger and exploration-log closeout;
5. only then may provider exchange seek fresh acceptance and implement the claimed product artifact.

## 7. Acceptance criteria

1. C1 recognizes the new exact grammar and rejects `none` plus a claim.
2. C3/C6/C11 enforce one resource, one register and one sequential claimant.
3. The legal absent-tree phase cannot persist after a product landing.
4. The exact provider claim exists in its RFC and README only after this process implementation.
5. The product declaration becomes the sole identity authority; copied equal vocabularies fail.
6. All fifteen negative/positive process fixtures execute and can fail for their named reason.
7. `make register-check`, `make verify-governance` and `make verify` pass through normal targets.
8. No production, schema, migration, API, content, archive or protected-design byte changes before
   acceptance.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Fresh independent process/buildability review executes the complete pre/post-landing matrix | claude | review receipt plus corrections or acceptance | |
| D2 | Implement C11, empty register and atomic provider lane-1 claim without product bytes | codex | implementation commit plus green register/governance/full verification | |
| D3 | Provider exchange lands the literal version/declarations, moves lane 1 to Landed and removes its claim | `provider-exchange-and-execution` | provider implementation transition receipt | |

## Open questions

None. This is a mechanical application of implemented RFC-0000 rule 7 to the measured [[D2189]]
resource. Provider semantics remain in the provider RFC.

## Changelog

- 2026-08-31: fresh independent review returned the D2361 repair on [[D2455]]–[[D2459]]. The
  register architecture, literal row model, population authority, committed transition and partial
  absence boundary remain unbuildable. No checker/register/provider implementation is authorized.
- 2026-08-31: author-repaired [[D2361]]. Replaced fictional head 0 with named-root `absent`, unique
  `first lane 1`, absent digest and a one-way landed lifecycle. Fifteen fixtures now include
  landed→missing-root regression. Fresh review remains required.
- 2026-08-30: drafted from the second fresh provider return. Defined the pre-landing head-0 state,
  sequential lane grammar, one tuple authority, C11 joins and fourteen able-to-fail fixtures. No
  checker, register or product implementation is authorized yet.
