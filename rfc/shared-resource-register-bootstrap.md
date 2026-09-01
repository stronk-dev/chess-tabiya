# RFC: Shared-resource register engine, bootstrap and adoption

- **Status:** draft — fourth author repair complete 2026-09-01 on [[D2498]]–[[D2501]]. The
  previous repair's projection/config union, ten-descriptor baseline, four-state resolution,
  check-not-generate README ownership and review boundary survive. The selector grammar now encodes
  the real assistance profiles, process RFCs carry complete descriptor authority, and the two
  remaining adapter images are literal. Another fresh independent review is required; no
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
campaign-schema | sequential/json_schema_id@1/existing | schemas/campaign.schema.json#$id | none
concept-registry-schema | sequential/json_schema_id@1/absent | schemas/concept_registry.schema.json#$id | packages/schema/src/index.ts#export:CONCEPT_REGISTRY_SCHEMA_VERSION
evidence-kinds | member_set/literal_string_tuple@1/existing | apps/server/src/sourcing/types.ts#export:EVIDENCE_KINDS | none
migration | sequential/migration_sequence@1/existing | apps/server/src/storage.ts#class:SQLiteRunStorage/private-method:migrate/local:migrations | apps/server/src/storage.ts#export:STORAGE_VERSION
pack-schema | sequential/json_schema_id@1/existing | schemas/drill_pack.schema.json#$id | packages/schema/src/index.ts#export:DRILL_PACK_SCHEMA_VERSION
principle-entry-schema | sequential/json_schema_id@1/existing | schemas/principle_entry.schema.json#$id | packages/schema/src/index.ts#export:PRINCIPLE_ENTRY_SCHEMA_VERSION
release-manifest-schema | sequential/json_schema_id@1/absent | schemas/release_manifest.schema.json#$id | packages/schema/src/index.ts#export:RELEASE_MANIFEST_SCHEMA_VERSION
run-schema | sequential/json_schema_id@1/existing | schemas/drill_run.schema.json#$id | packages/schema/src/index.ts#export:DRILL_RUN_SCHEMA_VERSION
shape-entry-schema | sequential/json_schema_id@1/existing | schemas/shape_entry.schema.json#$id | packages/schema/src/index.ts#export:SHAPE_ENTRY_SCHEMA_VERSION
source-attribution-registry | sequential/canonical_resource@1/absent | packages/runtime/src/source-attribution.ts#export:SOURCE_ATTRIBUTION_REGISTRY_RESOURCE | none
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

The implementation creates `rfc/shared-resource-catalogue.json`. Its exact bootstrap preimage is
checked in now as
`planning/shared-resource-register-bootstrap/initial-catalogue.v1.json`; author review validates
that file against the type and compatibility table below, the ten-row metadata block above and the
live selectors. Implementation copies it byte-for-byte to the runtime catalogue before adding any
derived register state. There is no prose-only seventh-resource reconstruction left to an
implementer ([[D2489]]).

`rfc/README.md` is **not generated**. It remains the human-owned explanation/register surface from
the implemented parent. `make register-check` parses its resource markers and table rows and fails
when their checked projection differs from the catalogue/tree/claims in either direction. No tool
rewrites, deletes or owns the file's wave order, pins, rationale, archive links or any other bytes
([[D2493]]). There is no independent `RESOURCE_NAMES`, `SCHEMA_SLUGS`, check-number resource list
or hand-maintained count.

Every process RFC that introduces or adopts resources carries exactly one
`tabiya-resource-descriptor-source` fenced block naming a repository-relative canonical JSON file.
That file has the same `{ "schemaVersion": 1, "resources": [...] }` envelope and complete
descriptor grammar as the catalogue, and contains exactly the descriptors that RFC authorizes.
The path is literal (no glob, absolute path, `..` or symlink traversal), is checked in before
acceptance and is part of review. The transition reader obtains no descriptor field from prose: it
requires canonical equality between the source file's rows and the rows appended to the catalogue,
then checks the RFC's `tabiya-resource-roots` block as a routing summary of the same ids,
lifecycle/adapter/introduction profiles, primary roots and version selectors. Missing, extra or
cross-RFC descriptor rows fail. For every post-bootstrap introduction or adoption, `introducedBy`
must equal that declaring RFC's basename, not merely name any active process RFC. The bootstrap
seed alone retains `shared-resource-registers.md` on the six authorities that parent actually
introduced; its four rows first governed here name this RFC ([[D2499]]).

This RFC's descriptor authority is:

```tabiya-resource-descriptor-source
planning/shared-resource-register-bootstrap/initial-catalogue.v1.json
```

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

The previously undefined projection field is this exact closed discriminated union ([[D2488]]):

```ts
type StructuralSelectorV1 = string;

type SharedResourceProjectionV1 =
  | {
      readonly adapter: "json_schema_id@1";
      readonly schemaSelector: StructuralSelectorV1;
      readonly versionSelector: StructuralSelectorV1 | null;
    }
  | {
      readonly adapter: "migration_sequence@1";
      readonly sequenceSelector: StructuralSelectorV1;
      readonly headSelector: StructuralSelectorV1;
    }
  | {
      readonly adapter: "literal_string_tuple@1";
      readonly rootSelector: StructuralSelectorV1;
    }
  | {
      readonly adapter: "literal_string_union@1";
      readonly rootSelector: StructuralSelectorV1;
    }
  | {
      readonly adapter: "canonical_resource@1";
      readonly rootSelector: StructuralSelectorV1;
    }
  | {
      readonly adapter: "typescript_contract@1";
      readonly versionSelector: StructuralSelectorV1;
      readonly roots: readonly [StructuralSelectorV1, ...StructuralSelectorV1[]];
      readonly repositoryEdges: "transitive";
      readonly externalEdges: "resolved_signature";
    }
  | {
      readonly adapter: "versioned_declarations@1";
      readonly rootSelector: StructuralSelectorV1;
      readonly idField: "id";
      readonly versionField: "version";
    };
```

No adapter accepts an open `options` object. The exact keys above are the only configuration;
missing or extra keys fail. `StructuralSelectorV1` is parsed, not merely type-checked as a string:
the repository-relative POSIX path precedes `#`, and the suffix is exactly one of `$id`,
`export:<name>`, `interface:<name>`, `type:<name>`, `function:<name>` or a `/`-separated descent of
`class:<name>`, `private-method:<name>`, `method:<name>`, `local:<name>`, `member:<name>` and
`object:<name>` and `literal`. Identifier components use ECMAScript IdentifierName spelling. A
declaration segment resolves one compiler declaration; `member:<name>` resolves one named member
directly owned by the current declaration; `object:<name>` resolves exactly one object-literal
property assignment with that static identifier/string-literal key in the current node's subtree;
and `literal` resolves that member/property's sole literal type or initializer after stripping
parentheses, `as const` and `satisfies`. Zero or multiple matches fail. Segments are always separated
by `/`; dotted pseudo-paths fail. A selector must resolve to exactly one JSON property or TypeScript
compiler symbol/AST node. Text or regex matching is not resolution ([[D2498]]).

`id` matches `^[a-z][a-z0-9-]*$`, is unique, and equals the README register marker. `introducedBy`
is one active or archived process RFC basename. Catalogue entries are ASCII-sorted by `id`.
Unknown/missing/extra keys, duplicate ids, unsafe paths, unknown adapters or incompatible
lifecycle/claim-mode pairs fail before claims are parsed.

The initial catalogue is exactly the seven already-registered resources plus these three absent
ones. The table is a reading aid; the checked-in JSON is the complete normative image:

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

The exact compatibility table is closed:

| lifecycle | allowed adapters | required claim mode |
|---|---|---|
| `sequential` | `json_schema_id@1`, `migration_sequence@1`, `canonical_resource@1`, `typescript_contract@1` | `prose` or `whole_projection` |
| `member_set` | `literal_string_tuple@1`, `literal_string_union@1` | `members` |
| `lineage_set` | `versioned_declarations@1` | `members` |

Existing rows retain `claimMode: prose`; the three new sequential roots use
`claimMode: whole_projection`. Follow-on process RFCs use the same engine and may add only the
closed adapters/lifecycles specified below. Adding an adapter or lifecycle requires an accepted
amendment to this RFC's process contract and a second synthetic able-to-fail resource; a product
RFC cannot add checker code.

## 2. Closed projection adapters

Selector population and semantic validity are different facts. Every adapter returns this exact
union; `partial` is not represented by throwing or collapsed into absence ([[D2490]]):

```ts
interface ProjectedResourceV1 {
  readonly identity: Readonly<Record<string, CanonicalValue>>;
  readonly semantic: CanonicalValue;
  readonly digest: `sha256:${string}` | null;
  readonly resolvedSelectors: readonly string[];
}

type ResourceResolutionV1 =
  | {
      readonly state: "absent";
      readonly resolvedSelectors: readonly [];
      readonly missingSelectors: readonly string[];
    }
  | {
      readonly state: "partial";
      readonly resolvedSelectors: readonly string[];
      readonly missingSelectors: readonly string[];
    }
  | {
      readonly state: "invalid";
      readonly resolvedSelectors: readonly string[];
      readonly missingSelectors: readonly [];
      readonly diagnostics: readonly ResourceDiagnosticV1[];
    }
  | {
      readonly state: "landed";
      readonly resolvedSelectors: readonly string[];
      readonly missingSelectors: readonly [];
      readonly projection: ProjectedResourceV1;
    };
```

The engine first expands the descriptor's selector fields in their declared order. Zero resolved
selectors is `absent`; a strict non-zero subset is `partial`; all selectors resolving but failing
adapter grammar/digest/agreement is `invalid`; only a valid complete projection is `landed`.
`assertSharedResourceTransition` receives immutable before/after maps of descriptor id to this
union, so introduction, adoption and regression rules cannot reinterpret an adapter exception.

The adapter is selected by `projection.adapter`, never by resource id. Exact selector identity is
`<repository-relative POSIX path>#<structural selector>`. Paths may repeat across resources;
complete selector strings may not. Every path rejects absolute form, glob, `..`, symlink traversal
and non-repository targets. A selector must resolve structurally exactly once. Text matching is not
resolution.

The closed adapter set is:

1. `json_schema_id@1` — resolves one JSON file `$id` and optional exported version selector;
   identity is the terminal version component parsed from the exact
   `urn:chess-tabiya:schema:<slug>:<version>` id, semantic is the complete JSON value parsed with
   duplicate-key rejection, and the digest is over that value. When non-null, the exported version
   must be one literal string/positive safe integer equal to the parsed id component after canonical
   decimal/dotted-decimal spelling. No comments or non-JSON number forms exist in the input.
2. `migration_sequence@1` — resolves one literal ordered migration array and one exported positive
   safe-integer head; identity is the contiguous `1..head` sequence. Each array member must be the
   exact object `{ version, name, apply }`, where `version` is a literal positive safe integer,
   `name` a literal string and `apply` an arrow/function expression whose repository calls resolve
   under the TypeScript graph rules below. Semantic is the ordered array of
   `{ version, name, applyGraph }`; `applyGraph` is the exact `TypeScriptGraphV1` image below with
   the migration callback as its sole root. SQL is retained as decoded string-literal values inside
   that graph. There is no separately “normalized SQL” text and therefore no second SQL parser/image.
3. `literal_string_tuple@1` — resolves one exported readonly literal string tuple; identity and
   semantic are the ASCII-sorted unique member set. Source order, whitespace and comments do not
   move a set resource.
4. `literal_string_union@1` — resolves one exported type alias whose complete body is a union of
   unique string literals; identity and semantic are the ASCII-sorted member set. Parentheses,
   source order, whitespace and comments do not enter the image; every non-string-literal arm,
   duplicate or alias fails. It exists because adoption must describe the live
   `AssistancePermission` authority rather than rewriting it into a tuple ([[D2467]]).
5. `canonical_resource@1` — statically resolves one exported `const` declaration; it never imports,
   bundles or executes the target module. Its initializer may contain only parentheses, `as const`
   or `satisfies` wrappers and optional `Object.freeze(...)` wrappers around a plain object literal.
   Object members are property assignments with static identifier or string-literal keys; values
   recurse only through JSON literals, arrays and plain object literals under the same wrappers.
   Spread, shorthand, computed keys, methods/accessors, identifier references, calls other than the
   admitted `Object.freeze`, templates, getters, holes and duplicate keys fail. After the wrappers
   are erased, the value has exact keys `{ id, version, payload, digest }`: `id` equals the
   descriptor id, `version` is a positive safe integer, `payload` is a canonical JSON object, and
   literal `digest` equals the shared-resource digest of `{ id, version, payload }`. Extra semantic
   fields outside `payload` fail. This side-effect-free AST image is the required shape for source
   attribution, provider protocol and assistance exchange ([[D2501]]).
6. `typescript_contract@1` — resolves a positive safe-integer literal version selector plus one or
   more type/value roots using the repository-pinned TypeScript compiler. Starting from each root,
   it follows every compiler-symbol reference in type positions, initializers, property access,
   call/new/tagged-template expressions and return/throw/control-flow expressions. It traverses
   repository declarations transitively, including re-export origins, generic declarations,
   constraints/defaults and every local overload signature plus its implementation. Repository
   edges are exactly `type_reference`, `value_reference`, `property_reference`, `call`,
   `construct`, `tag`, `extends`, `implements`, `import` and `re_export`; any repository symbol edge
   outside that enum fails.

   The semantic graph is exactly this canonical value ([[D2500]]):

   ```ts
   interface SyntaxTreeV1 {
     readonly kind: string; // TypeScript SyntaxKind name
     readonly text: string | number | boolean | null;
     readonly children: readonly SyntaxTreeV1[];
   }

   interface ContractNodeV1 {
     readonly id: string;
     readonly origin: "repository" | "node_builtin" | "typescript_lib" | "external_package";
     readonly exportedName: string | null;
     readonly tree: SyntaxTreeV1;
     readonly dependencyIdentity: CanonicalValue | null;
   }

   interface ContractEdgeV1 {
     readonly from: string;
     readonly to: string;
     readonly kind: "type_reference" | "value_reference" | "property_reference" | "call" |
       "construct" | "tag" | "extends" | "implements" | "import" | "re_export";
     readonly exportPath: readonly string[];
     readonly resolvedSignature: SyntaxTreeV1 | null;
     readonly overloads: readonly SyntaxTreeV1[];
   }

   interface TypeScriptGraphV1 {
     readonly roots: readonly string[];
     readonly nodes: readonly ContractNodeV1[];
     readonly edges: readonly ContractEdgeV1[];
   }
   ```

   A repository node id is its resolved repository path plus the declaration's zero-based preorder
   ordinal among AST declarations. An external node id is its origin, dependency identity and
   public export path joined with NUL separators. `SyntaxTreeV1.children` retains compiler child
   order; `text` is non-null only for identifiers, decoded literals and operator tokens, and is
   otherwise null. Trivia, comments and source offsets do not enter the tree; binding/member names,
   operators, statement/argument order and type structure do. Roots are ASCII-sorted unique
   selector strings; nodes sort by `id`; edges sort by the canonical bytes of the complete edge and
   exact duplicate edges collapse. Every edge endpoint must name a retained node. Repository edges
   have `resolvedSignature: null` and empty overloads unless the edge is call/construct/tag; those
   three retain the compiler-selected signature and the complete public overload set. This
   deliberately treats a local/import alias rename as a semantic change—the adapter promises
   deterministic complete coverage, not equivalence proving.

   External boundaries are closed rather than ignored ([[D2491]]):
   - `node:` builtins use `origin: "node_builtin"`, the module/export path in `id`, the exported
     declaration as `tree`, and `{ package:"@types/node", version, integrity:null }` as
     `dependencyIdentity`;
   - ECMAScript/DOM library symbols use `origin: "typescript_lib"`, the normalized lib filename and
     export path in `id`, the declaration as `tree`, and `{ package:"typescript", version,
     integrity }` from the exact lockfile package;
   - package imports use `origin: "external_package"`, package/export path in `id`, the public
     declaration as `tree`, and the exact resolved `{ package, version, integrity }` identity from
     `pnpm-lock.yaml`; workspace links resolve as repository nodes, not external packages; and
   - every call/construct/tag edge records the compiler-selected signature plus the complete public
     overload set in the exact `ContractEdgeV1` fields above.

   Ambient declarations without one of those three origins, `any`/`unknown`-based member or call
   resolution, `eval`, dynamic `import()`, computed property names not reducible to one literal,
   broad index-signature lookup and missing/ambiguous lockfile identity fail. Re-exports resolve to
   origin while retaining the public export path. This is the complete before/after authority used
   by adopted assistance resources; callers cannot supply a changed-symbol list.
7. `versioned_declarations@1` — resolves one literal declaration array whose members contain a
   base id and canonical positive safe-integer version under the descriptor's literal field names.
   Every member must be a recursively canonical JSON object literal: no spread, shorthand,
   computed key, method, accessor, identifier reference or non-canonical numeric literal.
   Identity is the ASCII-sorted `id@version` set; semantic is the same-order array of the complete
   parsed objects, with object keys canonicalized by §2.1. Declaration/source order, comments and
   whitespace do not enter the image. This supplies semantic conventions' per-base lineage without
   a bespoke checker ([[D2492]]).

Adapter configuration is the discriminated data union in §1: exact roots/version selector and no
open options. All owned selectors are derived from those fields. The generic engine rejects a
descriptor whose configuration omits a required root, repeats a selector or contains a key the
adapter does not consume. These rules define the pre-canonical semantic values; §2.1 alone defines
their bytes and digest ([[D2492]]).

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
must match both that RFC's canonical `tabiya-resource-descriptor-source` and its
`tabiya-resource-roots` routing summary. A product RFC cannot add its own entry.

### 4.1 Genuinely absent root

`unregistered -> absent` is legal only when the adapter result is exactly `state: "absent"`.
File existence is irrelevant: a new export may be introduced in an existing module ([[D2443]]).
`partial` and `invalid` both refuse introduction with distinct stable diagnostics. The README image
is `head=absent`, header-only Landed and Live-claims tables, and an immutable `introduced-by`
marker.

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

Snapshot validation and checked register projection remain in `register-check`, but every temporal rule is
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

The implementation—not pre-acceptance review—supplies executable fixtures for at least:

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
16. checked README/catalogue bijection, preservation of unrelated README prose and stable
    diagnostics after adding a resource.

## 8. Implementation boundary and order

The accepted process implementation may change only the register/catalogue tools and tests,
`rfc/shared-resource-catalogue.json`, `rfc/README.md`, RFC-0000/template/development documentation,
CI checkout/base wiring, the three absent register sections, and its ledger/log/roadmap closeout.
It creates no release schema, concept registry, source-attribution object, assistance/provider/
semantic product authority, API, storage, content, web or protected-design bytes.

Order:

1. fresh independent buildability review executes the author-repair contract: parse and validate
   the literal ten-descriptor seed, projection union, compatibility matrix, four resolution states,
   adapter semantic-image rules, README ownership and the implementation-test boundary;
2. only after acceptance, implement the generic catalogue/projection/lifecycle/transition engine,
   all sixteen fixture families and three absent roots;
3. run normal `make register-check`, governance and full `make verify`;
4. archive this RFC with ledger and append-only exploration-log closeout;
5. rebase/accept/implement the assistance population RFC, then semantic/provider population RFCs;
6. only then accept and implement their product lanes.

Step 1 proves the contract is literal and implementable; it does not pretend the unimplemented
engine already executes its implementation acceptance suite. Step 2 must make every family in §7
red against its named mutation before the implementation can complete ([[D2494]]).

## Historical finding routing

The generic engine retains the earlier returned obligations rather than making them invisible:

- [[D2381]] remains the header-only empty-register rule;
- [[D2382]] remains the second-resource/no-name-dispatch falsifier;
- [[D2383]] remains exact catalogue population and selector-grammar closure; and
- [[D2384]] remains staged-index plus committed first-parent temporal verification.

The third fresh review adds the author-repair batch without changing that direction:

- [[D2488]] defines the missing projection/config discriminated union;
- [[D2489]] supplies all ten literal complete baseline descriptors;
- [[D2490]] carries selector `partial` through one typed resolver/transition image;
- [[D2491]] closes TypeScript traversal and external-edge semantics;
- [[D2492]] defines the three missing adapter normal forms;
- [[D2493]] fixes README derived-byte ownership while preserving hand-authored prose; and
- [[D2494]] makes the pre-acceptance review matrix executable without implementing product bytes.

The fourth author preflight found four remaining literal-contract gaps:

- [[D2498]] closes selector descent and proves the two adopted assistance heads resolve;
- [[D2499]] makes each process RFC authorize complete descriptor bytes rather than prose fields;
- [[D2500]] defines the exact TypeScript/migration node, edge, signature and ordering image; and
- [[D2501]] makes canonical resources a static side-effect-free literal AST projection.

Their earlier repairs are incorporated into §§1–7. They close only when the amended executable
criteria land; rewriting the architecture does not retire the findings.

## Acceptance criteria

1. Catalogue and README register populations are set-equal; no `RESOURCE_NAMES`, `SCHEMA_SLUGS` or
   numbered resource-specific branch remains.
2. All ten initial descriptors resolve through their adapter/lifecycle or the exact absent state;
   the assistance, semantic-convention and provider follow-on descriptor candidates validate under
   the same union, and both adopted assistance version selectors resolve exactly once.
3. `canonical_resource@1` statically seals every payload semantic field through the one named
   canonical byte authority without importing the target module; [[D2442]], [[D2444]] and
   [[D2501]] fixtures fail before the repair and pass after it.
4. Selector-level absence admits an export in an existing file, refuses duplicate selector
   identity and refuses every partial artifact ([[D2443]], [[D2459]]).
5. Adoption pins current product bytes without mutating them or inventing prior history; later
   lanes begin above the adopted baseline ([[D2465]]).
6. Lifecycle behavior is selected by descriptor data. Assistance/provider/semantic follow-ons can
   inhabit the closed profiles without adding C9/C10/C11 or Git readers ([[D2454]]–[[D2455]],
   [[D2466]]); the exact catalogue addition must equal the declaring RFC's checked descriptor file.
7. One transition function validates staged and every committed first-parent image; CI/local
   preimages are explicit and fail closed.
8. After implementation, all sixteen fixture families are able to fail for their named reason,
   including a second synthetic resource for every adapter/lifecycle; pre-acceptance review instead
   executes the bounded author contract named in §8.
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
| D1 | Fresh independent review executes the bounded author-repair contract and verifies the cross-RFC profile fit | claude | review receipt plus acceptance/corrections | |
| D2 | Generic engine/catalogue/three absent roots land with normal full verification | codex | implementing SHA plus green `make verify` | |
| D3 | Assistance population removes bespoke architecture and names this dependency | assistance-config-register.md | amended RFC plus fresh review | |
| D4 | Semantic-convention population removes bespoke architecture and names this dependency | semantic-convention-register.md | amended RFC plus fresh review | |
| D5 | Provider-protocol population removes bespoke architecture and names this dependency | provider-protocol-register.md | amended RFC plus fresh review | |

## Open questions

None for the owner. This is repository-process architecture. Fresh review should attack adapter
closure, adoption honesty, canonical byte interoperability and whether a resource-specific branch
can be smuggled through descriptor options.

## Changelog

- 2026-09-01: fourth author repair on [[D2498]]–[[D2501]]. Selector descent now admits exact
  member/object/literal paths and the two assistance heads use resolvable slash paths; every process
  RFC supplies canonical descriptor-candidate bytes; TypeScript/migration graphs define exact
  nodes, edges, signatures and ordering; canonical resources are statically parsed closed literal
  ASTs. Another fresh independent review remains required; implementation is unauthorized.
- 2026-09-01: author-repaired [[D2488]]–[[D2494]] after the third return. Added the closed
  projection/config union, literal ten-descriptor seed, four-state resolver result, explicit
  adapter semantic images and TypeScript edge boundary, check-not-generate README contract and an
  honest split between pre-acceptance author checks and implementation fixtures. Another fresh
  independent review remains required; implementation is unauthorized.
- 2026-09-01: returned by third fresh independent buildability review on [[D2488]]–[[D2494]];
  receipt: `planning/shared-resource-register-bootstrap/third-fresh-independent-buildability-review-2026-09-01.md`.
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
