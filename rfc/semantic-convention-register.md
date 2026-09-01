# RFC: Semantic-convention shared-resource catalogue population

- **Status:** draft — canonical descriptor/history repair complete 2026-09-01 under
  [[D2499]]/[[D2502]], after [[D2454]] and [[D2466]]. The 39-member lineage
  contract now consumes the generic register engine directly; no assistance dependency, C10 or
  resource-name literal remains. Fresh independent review is required; implementation is
  unauthorized.
- **Author:** Codex
- **Created:** 2026-08-27
- **Design refs:** none. This is repository process and changes no evidence meaning or learner UX.
- **Exploration gate:** [[D1722]] and the executable 39-member census in
  `tools/d1722-convention-identity-harness/initial-member-census.test.ts`
- **Depends on:** accepted and implemented `rfc/shared-resource-register-bootstrap.md`
- **Parent / amends:** adds one descriptor/register through the generic engine
- **Supersedes / superseded by:** supersedes the former assistance-C9/C10/`RESOURCE_NAMES` plan
- **Planning:** `planning/semantic-convention-register/`

```tabiya-claims
none
```

```tabiya-resource-descriptor-source
planning/semantic-convention-register/catalogue-additions.v1.json
```

```tabiya-resource-roots
semantic-conventions | lineage_set/versioned_declarations@1/absent | packages/runtime/src/evidence-conventions.ts#export:CONVENTION_DECLARATIONS | none
```

## Summary

This process RFC introduces one absent `semantic-conventions` catalogue root with the generic
`lineage_set/versioned_declarations@1` profile. It creates no evidence-convention product file and
adds no product claim in the same transition.

After the root exists, `semantic-convention-provenance.md` may claim the exact 39 initial
`id@1` members. Its later implementation creates one literal `CONVENTION_DECLARATIONS` array, the
checked source-recovery generator and append-only semantic history. The generic register governs
identity membership only; claim-to-landing time uses the generic engine, while semantic-byte
immutability remains the product RFC's
declared validation hook.

The resource depends on the generic engine, not assistance. It adds no C10, Git reader or
`RESOURCE_NAMES` entry ([[D2466]]).

## 1. Exact descriptor and absent root

The catalogue entry is:

| field | value |
|---|---|
| id | `semantic-conventions` |
| lifecycle | `lineage_set` |
| projection adapter | `versioned_declarations@1` |
| claim mode | `members` |
| introduction | `absent` |
| owned selector | `packages/runtime/src/evidence-conventions.ts#export:CONVENTION_DECLARATIONS` |
| introduced by | `semantic-convention-register.md` |

The selector is absent only when the exact export does not resolve. An existing module may contain
other exports. A malformed or computed `CONVENTION_DECLARATIONS` export is partial/invalid, not
absent. Once any member lands, deletion or rename is a regression.

The process implementation adds a `members=0` register with header-only Landed and Live-claims
tables. It does not create the product claim. After this RFC archives,
`semantic-convention-provenance.md` may be amended/reviewed to claim its exact D1722 set.

## 2. Lineage grammar and exact initial population

Claims use the generic form:

```text
semantic-conventions | members <base-id>@<positive-safe-integer>, ... | whole projection
```

Members are ASCII-sorted and unique. Base ids match `^[a-z][a-z0-9_-]*$`. Versions use canonical
positive safe-integer decimal spelling. Collision identity is the base id: `space@2` and
`space@3` collide while `space@2` and `threat@2` do not. A new id starts at 1; an existing id names
exactly its landed head plus one; earlier versions remain landed.

The initial claim is the exact 39-member set already stored in
`planning/semantic-convention-register/initial-members.json` and exercised by D1722. The product
RFC's machine claim, that immutable seed and the executable census must be set-equal before product
acceptance. A count-preserving swap fails.

This process RFC does not copy the 39 names into checker code or its catalogue descriptor. The
seed/census/product claim are the independent population authorities; the eventual runtime
declarations are the landed tree.

## 3. Product source and semantic-history hook

The product landing creates the literal array through the checked one-time source-recovery
generator already specified by `semantic-convention-provenance.md`:

```text
planning/semantic-convention-provenance/initial-declarations.json
  -> tools/generate-initial-convention-declarations.mjs
  -> packages/runtime/src/evidence-conventions.ts#CONVENTION_DECLARATIONS
```

The planning source is immutable recovery evidence, not a runtime registry. The runtime array is
the sole product authority.

`versioned_declarations@1` derives complete declaration semantic images as well as `id@version`
identities. The generic lifecycle proves member claims, lineage and owner-bound landing. The
product RFC attaches two declared validation hooks:

1. `semantic-convention-source-check` — initial runtime declarations are byte-for-byte generated
   from the reviewed source and every initial member remains present; and
2. `semantic-convention-history-check` — one canonical JSONL row per landed declaration version in
   `packages/runtime/src/evidence-convention-history.jsonl` carries exactly `ref`,
   `semanticDigest`, `registryDigest` and `ownerRfc`, in landing order with append-only bytes. Its
   stable public verification surface is `make semantic-convention-history-check`.

Hooks receive projected before/after images and no Git authority; the generic transition reader
supplies the introducing commit/preimage. A row does not contain its impossible own commit hash.
Same-version semantic replacement changes the projected digest and fails even if membership is
unchanged; a legitimate semantic revision adds the next `id@version` and history row.

## 4. Generic transition behavior

For semantic conventions the engine proves:

- process introduction creates exactly one absent descriptor/register and no claim/product bytes;
- a later transition may add one or more disjoint exact lineage claims;
- a product landing requires the prior claims, literal declarations, owner-bound Landed rows and
  claim removal together;
- new ids start at 1 and existing ids advance exactly one;
- declaration identity/tree and Landed rows are set-equal;
- removal, duplicate/computed/broad refs, same-base concurrent claims, skipped/backward versions,
  fixed-version semantic drift and landed-to-absent all fail; and
- staged and committed first-parent histories use the same generic reader.

No ordering dependency on assistance remains. After the generic engine lands, this process RFC and
provider protocol may proceed independently.

## 5. Able-to-fail population fixtures

Using the generic engine, the implementation crosses:

1. exact absent descriptor/register with no product bytes or claim;
2. introduction plus product claim in one transition;
3. later exact 39-member claim set equal to seed/census;
4. omitted/extra/count-preserving swapped initial member;
5. malformed ref, version 0, unsafe integer and aliased decimal;
6. two claimants for one base id and two disjoint base ids;
7. new id at version 2 and existing id skip/backtrack;
8. duplicate/computed/broad runtime declaration;
9. runtime member missing from Landed and stale Landed member absent from runtime;
10. declaration reorder preserving identity but changing no canonical set image;
11. product landing without prior claim, wrong owner, partial members or lingering claim;
12. generator/source mismatch and hand-copied initial array;
13. missing source/history hook after product landing;
14. semantic history wrong key order/shape/digest/newline or impossible own-commit field;
15. same-version semantic replacement;
16. lawful next-version semantic revision with append-only history;
17. landed-to-missing/partial root; and
18. a second synthetic lineage resource proving no semantic-convention id branch.

## 6. Implementation boundary and order

The accepted process implementation changes only the shared catalogue, generated README register,
population fixtures, development docs and this RFC's ledger/log/roadmap closeout. It calls the
generic engine unchanged.

It does not create `evidence-conventions.ts`, alter evidence projections/semantics, create the
generator/history, claim members, touch runtime/web/schema/storage/content/archive or edit
protected design.

Order:

1. generic register engine is accepted, implemented and archived;
2. fresh independent review executes these eighteen population fixtures;
3. implement the absent descriptor/register and run full normal verification;
4. archive with ledger and append-only exploration-log closeout;
5. amend/review/accept semantic-convention provenance with the exact 39-member claim and hooks;
6. only then land generated declarations and semantic history.

## Acceptance criteria

1. `semantic-conventions` exists exactly once in the generic catalogue/register and nowhere in a
   parallel resource list.
2. The process implementation adds no C10, assistance dependency, parser branch, canonicalizer or
   Git history reader.
3. Selector-level absence is exact and partial product authority fails.
4. The lineage grammar enforces canonical positive safe integers, next-version progression and
   per-base collision while permitting disjoint ids.
5. The initial product claim, immutable seed and executable census are set-equal without a copied
   checker list.
6. Runtime declarations and Landed identities become set-equal only through the generic
   prior-claim transition.
7. Product source/history hooks retain full semantic bytes and refuse same-version replacement.
8. All eighteen fixture families can fail for their named reason.
9. Normal `make verify` covers snapshot, staged and first-parent checks without bespoke commands.
10. No product/runtime/web/schema/storage/content/archive/protected-design bytes change in the
    process implementation.
11. [[D1722]], [[D1852]] and [[D2466]] close only after executable process criteria pass; product
    semantics remain separately blocked.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Generic engine lands first | shared-resource-register-bootstrap | archived SHA | |
| D2 | Fresh independent review executes all eighteen fixtures | claude | review receipt plus acceptance/corrections | |
| D3 | Absent descriptor/register lands with full verification | codex | implementation SHA plus green `make verify` | |
| D4 | Product RFC claims 39 members and lands generated declarations/history | semantic-convention-provenance | accepted preimage plus product SHA | |

## Open questions

None for the owner. Convention definitions, limitations and evidence authority remain product-RFC
semantics already under review; this document governs identity, lineage and change only.

## Changelog

- 2026-09-01: added the complete canonical descriptor candidate and restored the exact append-only
  history path plus stable Make surface during generic-engine compatibility review.
- 2026-09-01: rebased onto the generic engine. Removed the assistance/C9 dependency,
  `RESOURCE_NAMES` and C10, retained lineage semantics and delegated time/history to the shared
  reader. Fresh review required; implementation remains unauthorized.
- 2026-08-28: prior repair added source-recovery generation, canonical semantic history and
  safe-integer lineage.
- 2026-08-27: initial draft proposed a bespoke C10 after assistance C9; that architecture is
  superseded.
