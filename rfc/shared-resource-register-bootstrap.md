# RFC: Shared-resource register engine, bootstrap and adoption

- **Status:** draft — author-repaired 2026-09-01 on [[D2442]]–[[D2444]], [[D2454]],
  [[D2455]], [[D2465]]–[[D2467]]. One catalogue, projection/lifecycle engine and temporal reader
  now replace the competing C9/C10/C11 plans. Fresh independent review is required; no
  implementation is authorized.
- **Author:** Codex
- **Created:** 2026-08-31
- **Design refs:** none; this is repository process and changes no learner/product behavior
- **Exploration gate:** [[D2363]] reproduced the checker/process deadlock; the second fresh review
  reproduced [[D2442]]–[[D2444]]; cross-RFC reconciliation reproduced [[D2454]], [[D2455]],
  [[D2465]]–[[D2467]]
- **Depends on:** implemented `rfc/archive/shared-resource-registers.md`
- **Parent / amends:** RFC-0000 rule 7, `rfc/README.md`, `rfc/template.md`,
  `tools/register-check.mjs`
- **Supersedes / superseded by:** supersedes the bespoke register-engine portions of
  `assistance-config-register.md`, `semantic-convention-register.md` and
  `provider-protocol-register.md`; those documents remain resource-population contracts
- **Planning:** `planning/shared-resource-register-bootstrap/`

```tabiya-claims
none
```

```tabiya-resource-roots
release-manifest-schema | sequential/json_schema_id@1 | schemas/release_manifest.schema.json#$id | packages/schema/src/index.ts#export:RELEASE_MANIFEST_SCHEMA_VERSION
concept-registry-schema | sequential/json_schema_id@1 | schemas/concept_registry.schema.json#$id | packages/schema/src/index.ts#export:CONCEPT_REGISTRY_SCHEMA_VERSION
source-attribution-registry | sequential/canonical_resource@1 | packages/runtime/src/source-attribution.ts#export:SOURCE_ATTRIBUTION_REGISTRY_RESOURCE | packages/runtime/src/source-attribution.ts#export:SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.version
```

## Summary

All shared-resource governance runs through one machine-readable catalogue, one projection engine,
one lifecycle engine and one staged/first-parent transition reader. Resource names are data. They
never select parser code, check numbers or Git history behavior.

This RFC migrates the seven existing registers into that engine and introduces three genuinely
absent roots without creating product bytes: release-manifest schema, concept-registry schema and
source-attribution registry. It also defines the only lawful route for later process RFCs to add a
future root or adopt an already-landed authority.

The assistance, provider and semantic-convention process RFCs no longer add C9, C10 or C11. They
declare catalogue entries using the closed lifecycle/projection vocabulary here. Their distinct
product semantics remain in their own RFCs; their parsing, claims, register joins and time model do
not.

## 1. One machine-readable catalogue

The implementation creates `rfc/shared-resource-catalogue.json`. `rfc/README.md` renders its
human-readable catalogue and register sections, and `make register-check` fails if the rendered
resource population differs in either direction. There is no independent `RESOURCE_NAMES`,
`SCHEMA_SLUGS`, check-number resource list or hand-maintained count.

The catalogue has schema version 1 and exact top-level keys in this order:

```json
{
  "schemaVersion": 1,
  "resources": []
}
```

Each resource entry has exactly:

```ts
interface SharedResourceDescriptorV1 {
  readonly id: string;
  readonly lifecycle: "sequential" | "member_set" | "lineage_set";
  readonly projection: SharedResourceProjectionV1;
  readonly claimMode: "prose" | "whole_projection" | "members";
  readonly introducedBy: string;
  readonly introduction: "existing" | "absent" | "adopted";
}
```

`id` matches `^[a-z][a-z0-9-]*$`, is unique, and equals the README register marker. `introducedBy`
is one active or archived process RFC basename. Catalogue entries are ASCII-sorted by `id`.
Unknown/missing/extra keys, duplicate ids, unsafe paths, unknown adapters or incompatible
lifecycle/claim-mode pairs fail before claims are parsed.

The initial catalogue is exactly the seven already-registered resources plus these three absent
ones:

| resource | lifecycle | projection |
|---|---|---|
| `campaign-schema` | `sequential` | `json_schema_id@1` |
| `concept-registry-schema` | `sequential` | `json_schema_id@1` |
| `evidence-kinds` | `member_set` | `literal_string_tuple@1` |
| `migration` | `sequential` | `migration_sequence@1` |
| `pack-schema` | `sequential` | `json_schema_id@1` |
| `principle-entry-schema` | `sequential` | `json_schema_id@1` |
| `release-manifest-schema` | `sequential` | `json_schema_id@1` |
| `run-schema` | `sequential` | `json_schema_id@1` |
| `shape-entry-schema` | `sequential` | `json_schema_id@1` |
| `source-attribution-registry` | `sequential` | `canonical_resource@1` |

Existing rows retain `claimMode: prose`; the three new sequential roots use
`claimMode: whole_projection`. Follow-on process RFCs use the same engine and may add only the
closed adapters/lifecycles specified below. Adding an adapter or lifecycle requires an accepted
amendment to this RFC's process contract and a second synthetic able-to-fail resource; a product
RFC cannot add checker code.

## 2. Closed projection adapters

Every adapter returns one immutable `ProjectedResource`:

```ts
interface ProjectedResource {
  readonly state: "absent" | "landed";
  readonly identity: Readonly<Record<string, CanonicalValue>>;
  readonly semantic: CanonicalValue;
  readonly digest: `sha256:${string}` | null;
  readonly resolvedSelectors: readonly string[];
}
```

The adapter is selected by `projection.adapter`, never by resource id. Exact selector identity is
`<repository-relative POSIX path>#<structural selector>`. Paths may repeat across resources;
complete selector strings may not. Every path rejects absolute form, glob, `..`, symlink traversal
and non-repository targets. A selector must resolve structurally exactly once. Text matching is not
resolution.

The closed adapter set is:

1. `json_schema_id@1` — resolves one JSON file `$id` and optional exported version selector;
   identity is the parsed version, semantic is the complete parsed schema object, and the digest is
   over that object. `$id` and exported version must agree.
2. `migration_sequence@1` — resolves one literal ordered migration array and one exported positive
   safe-integer head; identity is the contiguous `1..head` sequence and semantic includes each
   literal migration version/name plus the normalized SQL body.
3. `literal_string_tuple@1` — resolves one exported readonly literal string tuple; identity and
   semantic are its unique ordered members.
4. `literal_string_union@1` — resolves one exported type alias whose complete body is a union of
   unique string literals; identity is the ASCII-sorted member set and semantic retains the
   normalized union declaration. It exists because adoption must describe the live
   `AssistancePermission` authority rather than rewriting it into a tuple ([[D2467]]).
5. `canonical_resource@1` — resolves one atomic exported object with exact keys
   `{ id, version, payload, digest }`. `id` equals the descriptor id, `version` is a positive safe
   integer, `payload` is a canonical JSON object, and `digest` equals the shared-resource digest of
   `{ id, version, payload }`. Extra semantic fields outside `payload` fail. This is the required
   shape for source attribution, provider protocol and assistance exchange.
6. `typescript_contract@1` — resolves a positive integer version selector plus one or more exported
   type/value roots. The adapter closes over referenced local/imported type aliases, interfaces,
   literal const objects/tuples, called functions/methods and referenced constants within the
   repository. It records normalized node identity/body and resolved directed edges; unresolved
   dynamic property access, `any`, broad index signatures, computed registry membership or an
   unclassified repository edge fails. Local bindings are alpha-renamed by first declaration;
   comments, whitespace and import aliases do not enter the semantic image. Exported/member names,
   literals, type structure, call order and property edges do. This is the complete before/after
   authority used by assistance resources; callers cannot supply a changed-symbol list.
7. `versioned_declarations@1` — resolves one literal declaration array whose members contain a
   base id and canonical positive safe-integer version. Identity is the `id@version` set; semantic
   is the complete declaration image. This supplies semantic conventions' per-base lineage without
   a bespoke checker.

Adapter configuration is data within the catalogue projection: exact root selectors, version
selector, and adapter-specific closed options. All owned selectors are listed there. The generic
engine rejects a descriptor whose configuration omits a required root, repeats a selector or
contains an option the adapter does not consume.

### 2.1 One canonical byte authority

The implementation adds `tools/shared-resource-canonical.mjs` exporting
`canonicalSharedResourceBytes(value)` and `sharedResourceDigest(value)`. Both register checking and
all build-time resource digest generation import these functions; a second project implementation
is forbidden.

The admitted value domain is recursively: `null`, booleans, strings with no unpaired surrogate,
safe integers other than negative zero, arrays, and plain objects with unique own string keys.
Floating-point values, `undefined`, bigint, functions, symbols, dates, maps, sets, prototypes,
cycles, accessors and sparse arrays fail.

Canonical bytes are produced recursively: object keys are sorted by ascending UTF-16 code-unit
sequence; scalars and keys use ECMAScript `JSON.stringify` escaping; arrays retain order; objects
and arrays use `,`/`:` with no whitespace; the final string is UTF-8. Digest input is the UTF-8
prefix `chess-tabiya/shared-resource/v1\0` followed by those bytes. Output is lowercase
`sha256:<64 hex>`.

Independent reference fixtures prove cross-key-order equality, array-order sensitivity, resolver-
policy sensitivity, UTF-8/escape behavior and refusal of every unsupported value class. Therefore
`canonical(rows)` and insertion-order `JSON.stringify` are not alternate conforming images
([[D2444]]).

## 3. Lifecycles and claim grammar

Lifecycle, not adapter or resource name, selects claim/collision/landing behavior.

### 3.1 Sequential

A landed sequential resource has a positive integer/dotted version head as its adapter defines.
At most one active RFC claims it. Existing `prose` resources retain their registered lane grammar
and non-empty change description. A `whole_projection` resource uses exactly:

```text
<resource> | first lane 1 | whole projection
<resource> | lane <next version> | whole projection
```

`first lane 1` is valid only from `absent`. Later claims name exactly the adapter-specific next
version. A landing must advance the head, change the complete projection digest, consume the sole
prior claim and append one owner-bound landed row atomically. Fixed-head semantic drift, skipped or
backward lanes, multiple claimants and partial landings fail.

### 3.2 Member set

Claims use sorted unique `members <member>, ...`; collision identity is each member. Tree members
and landed member rows are set-equal. Additions require exact prior claims; deletion of a landed
member is forbidden. Semantic operations do not belong in a member-set resource. Assistance uses
one member-set for the permission vocabulary and a separate sequential contract for its operation
graph, resolving [[D2453]].

### 3.3 Lineage set

Claims use sorted unique `members <id>@<version>, ...`. Collision identity is the base id. A new id
starts at 1; an existing id advances exactly one version; prior versions remain landed. The same
generic transition reader binds the before claim to the after declaration/history rows. This is
semantic conventions' distinct profile, not C10.

## 4. Introduction, absence and adoption

Catalogue growth is authorized only by an accepted process RFC. Its implementation changes the
catalogue, README register, process closeout, ledger and append-only exploration log together and
must match that RFC's `tabiya-resource-roots` declaration. A product RFC cannot add its own entry.

### 4.1 Genuinely absent root

`unregistered -> absent` is legal only when **none** of the descriptor's owned selectors resolves.
File existence is irrelevant: a new export may be introduced in an existing module ([[D2443]]).
If some but not all selectors resolve, the state is `partial`, never `absent`, and registration
fails. The README image is `head=absent`, header-only Landed and Live-claims tables, and an immutable
`introduced-by` marker.

After the process RFC archives, one product RFC may add `first lane 1`. A later product transition
must make every owned selector resolve, produce a valid projection, remove the claim and append the
landed row together. Once landed, missing/partial selectors can never be read as absence.

### 4.2 Already-landed adoption

`unregistered -> adopted` is the only route for a current product authority ([[D2465]]). It is
legal only when:

1. the accepted process RFC declares `introduction: adopted` and the exact descriptor;
2. every owned selector resolves in both before and after trees;
3. their bytes and complete projected image are identical across the transition;
4. the after register writes exactly one `adopted@<current head>` baseline row with the derived
   digest, the process RFC owner and `coverage begins here` marker;
5. there is no live claim; and
6. catalogue/register/ledger/log are the only semantic governance additions.

The adoption does not invent earlier landed rows. Future sequential continuity starts above the
adopted head; member/lineage deletion remains forbidden from the adopted identity set. Adoption
cannot run for a registered resource, cannot coincide with a product change and cannot be used to
reset history.

This is how assistance-config v4, workflow-preference v1 and the current assistance-permission
vocabulary enter the generic engine without being described as absent or historically governed.

## 5. One temporal authority

Snapshot validation and register rendering remain in `register-check`, but every temporal rule is
implemented by one exported pure function:

```text
assertSharedResourceTransition(beforeTree, afterTree, changedPaths)
```

The staged runner materializes the Git index and compares committed `HEAD` to that index; unstaged
and untracked bytes cannot satisfy it. CI runs `make register-history-check` with required
`REGISTER_BASE_SHA`, set to `github.event.before` on push and the PR base SHA on pull requests, and
full history checkout. It walks every first-parent commit in order and calls the same function.
`make ci-local` checks committed `HEAD^..HEAD` plus the staged index. Missing/unresolvable parents,
shallow history, second-parent-only prerequisites and a hidden bad intermediate commit fail closed.

The function admits only:

- catalogue bootstrap over the seven existing registered resources plus the three declared absent
  roots;
- `unregistered -> absent`;
- `unregistered -> adopted`;
- `absent -> first claim`;
- `first claim -> landed 1`;
- registered sequential/member/lineage claim and landing transitions; and
- product-byte-preserving catalogue metadata corrections authorized by a separate accepted process
  RFC.

Combined introduction+claim, introduction+product landing, adoption+product change, claimless
landing, lingering claim, rewritten older row, landed-to-absent/partial and fixed-head digest drift
all fail before current-snapshot equality can make them look valid.

Diagnostics use stable `R/<resource>/<rule>` codes. Human output may summarize them under one
`register-check` line; new resources do not allocate C9/C10/C11 and therefore cannot reorder or
shadow existing checks.

## 6. Cross-RFC handoff

The exact reconciliation is recorded in
`planning/shared-resource-register-bootstrap/cross-rfc-reconciliation-2026-09-01.md`.

- `assistance-config-register.md` depends on this implemented RFC, adds catalogue entries/adoption
  baselines only, and delegates every projection/transition/history check. Its hand-written symbol
  deltas are removed as authority.
- `semantic-convention-register.md` uses `versioned_declarations@1` plus `lineage_set`, depends on
  this engine rather than assistance C9, and retains its product semantic-history guarantee.
- `provider-protocol-register.md` uses one atomic `canonical_resource@1`; independent accepted
  producer/source obligations establish expected population in the product RFC, not in the
  register tuple itself.
- `evidence-presentation.md` may claim source-attribution `first lane 1` only after this process
  implementation. Its payload includes rows, resolver identity and missing-field policy, all under
  one digest ([[D2442]]).

## 7. Able-to-fail matrix

The implementation supplies executable fixtures for at least:

1. catalogue derivation over all ten initial resources with no hard-coded resource list;
2. a second synthetic resource for every lifecycle and adapter, proving no resource-id dispatch;
3. duplicate id/selector, repeated path with distinct selectors, unsafe path and unknown adapter;
4. existing-file/new-selector absence passing while borrowed or partial selectors fail;
5. exact absent introduction, combined introduction+claim and combined introduction+landing;
6. exact adoption, adoption with product-byte/digest change, invented prior rows and replayed
   adoption;
7. canonical-resource resolver/missing-policy changes moving the digest at fixed row membership;
8. key-order canonical equality plus unsupported-value refusal and independent digest agreement;
9. sequential first/next/skipped/backward/duplicate claimant and claimless landing;
10. member addition/removal/collision and a same-membership operation change refused unless routed
    through a separate sequential resource;
11. lineage new-id/next-version/skipped/backward/same-base collision;
12. TypeScript contract transitive type/call/property change, omitted root, unresolved dynamic edge,
    formatting/comment/import-alias/local-binding-only control;
13. atomic root with version-only, payload-only or digest-only partial artifact;
14. staged index-vs-HEAD, committed first-parent, missing parent, shallow range, hidden bad commit and
    second-parent-only prerequisite;
15. landed-to-absent and landed-to-partial regression; and
16. generated README/catalogue bijection and stable diagnostics after adding a resource.

## 8. Implementation boundary and order

The accepted process implementation may change only the register/catalogue tools and tests,
`rfc/shared-resource-catalogue.json`, `rfc/README.md`, RFC-0000/template/development documentation,
CI checkout/base wiring, the three absent register sections, and its ledger/log/roadmap closeout.
It creates no release schema, concept registry, source-attribution object, assistance/provider/
semantic product authority, API, storage, content, web or protected-design bytes.

Order:

1. fresh independent buildability review executes the sixteen fixture families;
2. implement the generic catalogue/projection/lifecycle/transition engine and three absent roots;
3. run normal `make register-check`, governance and full `make verify`;
4. archive this RFC with ledger and append-only exploration-log closeout;
5. rebase/accept/implement the assistance population RFC, then semantic/provider population RFCs;
6. only then accept and implement their product lanes.

## Historical finding routing

The generic engine retains the earlier returned obligations rather than making them invisible:

- [[D2381]] remains the header-only empty-register rule;
- [[D2382]] remains the second-resource/no-name-dispatch falsifier;
- [[D2383]] remains exact catalogue population and selector-grammar closure; and
- [[D2384]] remains staged-index plus committed first-parent temporal verification.

Their earlier repairs are incorporated into ``1–7. They close only when the amended executable
criteria land; rewriting the architecture does not retire the findings.

## Acceptance criteria

1. Catalogue and README register populations are set-equal; no `RESOURCE_NAMES`, `SCHEMA_SLUGS` or
   numbered resource-specific branch remains.
2. All ten initial descriptors resolve through their adapter/lifecycle or the exact absent state.
3. `canonical_resource@1` seals every payload semantic field through the one named canonical byte
   authority; [[D2442]] and [[D2444]] fixtures fail before the repair and pass after it.
4. Selector-level absence admits an export in an existing file, refuses duplicate selector
   identity and refuses every partial artifact ([[D2443]], [[D2459]]).
5. Adoption pins current product bytes without mutating them or inventing prior history; later
   lanes begin above the adopted baseline ([[D2465]]).
6. Lifecycle behavior is selected by descriptor data. Assistance/provider/semantic follow-ons can
   inhabit the closed profiles without adding C9/C10/C11 or Git readers ([[D2454]]–[[D2455]],
   [[D2466]]).
7. One transition function validates staged and every committed first-parent image; CI/local
   preimages are explicit and fail closed.
8. All sixteen fixture families are able to fail for their named reason, including a second
   synthetic resource for every adapter/lifecycle.
9. Existing C1–C8 behavioral protections remain green through compatibility tests even though
   implementation diagnostics move to resource-scoped codes.
10. `make verify` invokes snapshot, staged and committed-history checks through normal targets; no
    bespoke environment command is required from the user.
11. No product/runtime/web/schema/storage/content/archive or protected-design bytes land in this
    process implementation.
12. [[D2363]], [[D2370]], [[D2401]], [[D2442]]–[[D2444]], [[D2454]], [[D2455]] and
    [[D2465]]–[[D2467]] close only after executable criteria pass; downstream resources remain unclaimable
    until their catalogue roots land.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Fresh independent review executes all sixteen families and verifies the cross-RFC profile fit | claude | review receipt plus acceptance/corrections | |
| D2 | Generic engine/catalogue/three absent roots land with normal full verification | codex | implementing SHA plus green `make verify` | |
| D3 | Assistance population removes bespoke architecture and names this dependency | assistance-config-register.md | amended RFC plus fresh review | |
| D4 | Semantic-convention population removes bespoke architecture and names this dependency | semantic-convention-register.md | amended RFC plus fresh review | |
| D5 | Provider-protocol population removes bespoke architecture and names this dependency | provider-protocol-register.md | amended RFC plus fresh review | |

## Open questions

None for the owner. This is repository-process architecture. Fresh review should attack adapter
closure, adoption honesty, canonical byte interoperability and whether a resource-specific branch
can be smuggled through descriptor options.

## Changelog

- 2026-09-01: author-repaired the second return and reconciled the three competing follow-ons.
  Added a descriptor catalogue, seven closed projection adapters, three lifecycles, exact canonical
  bytes, selector-level absence, honest adoption, one temporal reader and resource-scoped
  diagnostics. Fresh independent review remains required; implementation is unauthorized.
- 2026-08-31: returned by second fresh independent review on [[D2442]]–[[D2444]]. The
  `versioned_registry` object/digest could not represent its first consumer, absence was file-bound
  and canonical digest bytes were unspecified.
- 2026-08-31: added the generic `versioned_registry` attempt and source-attribution absent root.
- 2026-08-31: author-repaired [[D2381]]–[[D2384]] with header-only empty registers, generic kind
  semantics and staged/first-parent transition policy.
- 2026-08-31: returned by first fresh review on [[D2381]]–[[D2384]].
- 2026-08-31: drafted from [[D2363]], later adding [[D2370]] and [[D2401]] consumers.
