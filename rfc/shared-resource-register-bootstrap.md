# RFC: Shared-resource register catalogue bootstrap

- **Status:** draft — owner-directed collision-core cut complete for [[D3034]]; fresh independent
  buildability review is required before acceptance or implementation
- **Author:** Codex
- **Created:** 2026-08-31; cut to the owner-ruled scope 2026-09-06
- **Design refs:** none; this is repository process and changes no learner or product behavior
- **Exploration gate:** [[D2363]] reproduced the checker/process deadlock; [[D3034]] measured 62
  collision/id-race/renumbering rows and ruled the former 1,330-line solution disproportionate
- **Depends on:** implemented `rfc/archive/shared-resource-registers.md`
- **Parent / amends:** RFC-0000 rule 7, `rfc/README.md`, and `tools/register-check.mjs`
- **Supersedes / superseded by:** supersedes only the hard-coded resource-name and schema-slug
  inventories in `tools/register-check.mjs`; the former projection, lifecycle and Git-history
  engines are withdrawn, not relocated
- **Planning:** `planning/shared-resource-register-bootstrap/`

```tabiya-claims
none
```

## Summary

The existing register checker prevents collisions, but the resources it knows are duplicated in
two code constants. A new shared register therefore requires checker surgery before an RFC can even
declare its claim. That is the bootstrap deadlock in [[D2363]].

This RFC makes the **seven resources already governed at HEAD** data in one checked JSON catalogue.
The checker derives resource ids, claim grammar and the existing tree-reader configuration from
those rows. Adding another resource that fits one of the three existing reader shapes is one data
row plus its human-readable register section—not a new resource-name branch or parser.

Nothing else is in scope. This RFC does **not** introduce absent roots, project arbitrary TypeScript
graphs, define resource lifecycle/history, generate `rfc/README.md`, or replace the parent RFC's
claim/register/tree join. The previous draft attempted all of those and grew to 1,330 lines across
fifteen review rounds. [[D3034]] explicitly withdrew that architecture.

## 1. The catalogue

Implementation creates `rfc/shared-resource-registers.json` from the exact reviewed seed at
`planning/shared-resource-register-bootstrap/collision-catalogue.v1.json`.

The top-level value has exactly `schemaVersion` and `resources`; `schemaVersion` is exactly `1`.
`resources` is a non-empty array, ASCII-sorted by unique `id`. Each id matches
`^[a-z][a-z0-9-]*$`. Unknown or extra keys fail.

Every resource row has exactly:

```ts
interface SharedResourceRegisterRowV1 {
  readonly id: string;
  readonly claimKind: "schema_lane" | "migration_position" | "members";
  readonly source: SharedResourceSourceV1;
}

type SharedResourceSourceV1 =
  | Readonly<{
      kind: "json_schema";
      schemaSlug: string;
      versionExport: string | null;
    }>
  | Readonly<{
      kind: "storage_migrations";
      path: "apps/server/src/storage.ts";
      headExport: "STORAGE_VERSION";
    }>
  | Readonly<{
      kind: "string_tuple";
      path: string;
      exportName: string;
    }>;
```

The exact bootstrap rows are:

| id | claim kind | source |
|---|---|---|
| `campaign-schema` | `schema_lane` | schema slug `campaign`; no duplicated version export |
| `evidence-kinds` | `members` | `EVIDENCE_KINDS` in `apps/server/src/sourcing/types.ts` |
| `migration` | `migration_position` | `STORAGE_VERSION` and migration entries in `apps/server/src/storage.ts` |
| `pack-schema` | `schema_lane` | `drill-pack`; `DRILL_PACK_SCHEMA_VERSION` |
| `principle-entry-schema` | `schema_lane` | `principle-entry`; `PRINCIPLE_ENTRY_SCHEMA_VERSION` |
| `run-schema` | `schema_lane` | `drill-run`; `DRILL_RUN_SCHEMA_VERSION` |
| `shape-entry-schema` | `schema_lane` | `shape-entry`; `SHAPE_ENTRY_SCHEMA_VERSION` |

These are the seven resources already present in `RESOURCE_NAMES` and already represented by
register sections. The bootstrap neither discovers nor invents another resource.

### 1.1 Catalogue validation

`tools/register-check.mjs` exports `parseResourceCatalogue(value)` and fails closed before reading
claims or registers when:

- the envelope, row keys, source keys, enum values or literals differ;
- ids are duplicated, malformed or not ASCII-sorted;
- two `json_schema` rows name the same `schemaSlug`;
- a `schema_lane` row does not use `json_schema`, a `migration_position` row does not use
  `storage_migrations`, or a `members` row does not use `string_tuple`;
- a path is absolute, contains `..`, escapes the repository, or does not name a regular tracked
  file; or
- a configured export name is not a JavaScript identifier.

The parser returns a deeply immutable owned copy. Mutating the caller's parsed JSON after admission
cannot change a running audit.

## 2. One data source replaces the two inventories

Implementation deletes `RESOURCE_NAMES` and `SCHEMA_SLUGS` as independent authorities.

The checker loads `rfc/shared-resource-registers.json` once. Every check receives that admitted
catalogue or maps derived from it:

- C1 claim parsing accepts only catalogue ids and selects grammar by `claimKind`;
- C2 applies lane ordering/depth only to `schema_lane` rows;
- C3 collision identity and declaration/register bijection use catalogue ids;
- C4 and C6 iterate every catalogue row, never a code list;
- C5 applies the existing bare-integer refusal only to `migration_position` rows;
- C7 maps every versioned schema on disk through the catalogue's `json_schema.schemaSlug` rows;
- C8 uses the same slug map for schema digest reconciliation; and
- `derivedOutput` iterates catalogue rows and formats by `claimKind`.

There is no fallback list. A resource present in a register section but absent from the catalogue,
or present in the catalogue but missing its one register section, fails set equality. Duplicate
register markers still fail through C6.

The human-owned register prose remains in `rfc/README.md`. The tool checks it; it does not generate
or rewrite it.

## 3. The three retained tree readers

This RFC data-drives only behavior that already exists in `register-check`.

### 3.1 JSON schema

`readSchemaFiles` continues to derive slug, version and digest from every `schemas/*.schema.json`
file. A `json_schema` row binds one unique slug to one resource id. If `versionExport` is non-null,
the existing schema-index reader requires that exported literal to equal the schema `$id` version.
If it is null, the `$id` version is the sole head. Missing or extra schema slugs fail C7.

### 3.2 Storage migrations

The single `storage_migrations` row retains today's check: the exported `STORAGE_VERSION` must equal
the largest literal migration entry in the configured file. This is not a generic lifecycle or
history engine and reads no Git state.

### 3.3 String tuple

The `string_tuple` row reads the named exported literal string tuple from its configured file and
derives its members. Missing exports, computed/spread elements, duplicates and non-string members
fail. This makes the existing evidence vocabulary source explicit; it does not project arbitrary
TypeScript contracts.

Adding a future source shape requires its own measured need and RFC. This bootstrap does not claim
that three readers can represent every future shared resource.

## 4. Claim grammar and collision behavior

The parent RFC's public `tabiya-claims` form stays unchanged:

```text
resource-id | claim | changes
```

Grammar is selected from the catalogue row:

- `schema_lane`: `lane <dotted-nonnegative-decimal>` with the same component depth as the landed
  head and strictly greater than that head;
- `migration_position`: `position next` or `position behind <rfc-stem>`; bare integers remain
  refused; and
- `members`: `members <member>, ...`, with unique ASCII-lower-snake-case members.

C3 retains its collision identities: exact lane for schemas, position ordering for migrations, and
individual member name for member sets. Declarations and README live-claim rows remain exactly
set-equal. This RFC changes where the resource and grammar inventories come from, not what a valid
claim means.

## 5. Explicitly removed scope

The implementation must not contain or introduce any of the following on this RFC's authority:

1. `typescript_contract`, `canonical_resource`, `versioned_declarations`, structural selectors or
   a TypeScript dependency graph;
2. generic semantic projections, canonical resource digests or projected object graphs;
3. `absent`, `adopted`, `existing` or other lifecycle states;
4. staged-index, parent-commit, first-parent or Git-history readers;
5. release-manifest, concept-registry, source-attribution, assistance, semantic-convention or
   provider-protocol roots; or
6. generated `rfc/README.md` prose.

Those mechanisms were part of the withdrawn shadow implementation. A later RFC may justify a
small addition from a concrete collision, but it cannot cite the former draft as accepted design.

## 6. Cross-RFC consequence

`assistance-config-register.md`, `semantic-convention-register.md` and
`provider-protocol-register.md` currently depend on the withdrawn projection/lifecycle engine.
They do not become implementable merely because this collision catalogue lands. Their next author
round must reduce each registration to the smallest concrete source/claim shape it needs, adding a
new reader only if the three retained readers genuinely cannot express it.

This is a staged discharge under [[D3047]], not prose-only future work: [[D2454]] remains a tracked
work-state item owned by `assistance-and-presentation`, and the provider/semantic register rows
remain tracked behind this foundation. Before this RFC can **land**, the implementing closeout must
show each surviving discharge in `planning/work-state.json` with an owner, date and
`blocker: "item:D3034"`; otherwise foundation implementation is refused.

## 7. Able-to-fail contract

Fresh review and implementation must execute all of these controls:

1. the exact seven-row seed parses and is ASCII-sorted with seven unique ids;
2. deleting, duplicating, renaming or adding an extra key to a row fails catalogue admission;
3. a duplicate schema slug fails even when ids differ;
4. every current claim/register/tree test remains green against the catalogue-driven checker;
5. deleting either former code inventory does not change the result because neither exists;
6. a synthetic versioned schema becomes a known resource by adding one `json_schema` catalogue row
   and one register fixture, with no checker-source edit;
7. that synthetic schema without its row fails C7, and its row without a schema fails C7;
8. an unknown claim resource fails even if a README section uses the same unknown name;
9. two RFCs claiming one synthetic schema lane collide;
10. a missing/extra register section fails catalogue/register set equality;
11. a missing tuple export, spread/computed tuple, duplicate member and non-string member each fail;
12. caller mutation after catalogue admission leaves the admitted image unchanged; and
13. a source scan proves the implementation contains none of §5 items or the three removed
    speculative root ids.

The full repository gate is `make verify-awake`. The focused contract receives its own normal Make
target and is enrolled in `verify-governance`; no ad-hoc environment command is part of the
acceptance surface.

## 8. Implementation boundary and order

After fresh independent review and owner acceptance:

1. add the exact reviewed JSON catalogue;
2. add its strict parser and owned immutable image;
3. refactor `register-check` to consume it and remove both old inventories;
4. extend `tools/register-check.test.mjs` with the able-to-fail controls;
5. enroll the focused target in `verify-governance`;
6. make the [[D3047]] staged-discharge rows enforceably present; and
7. run `make verify-awake`, then archive with ledger and append-only log closeout.

No product, schema, migration, vocabulary or content bytes change in this implementation.

## Acceptance criteria

1. A fresh independent review verifies this document and its exact seed against current
   `register-check`, reproduces at least one original collision/deadlock, and finds no unruled
   product or future-resource semantics.
2. The document is no longer than 300 lines and contains no projection/lifecycle/history engine.
3. The seed contains exactly the seven already-governed resources and no speculative root.
4. The author contract proves the seed shape, old-scope absence, current-resource equality and
   data-row extension property.
5. Owner acceptance follows the fresh review; implementation is forbidden before it.
6. Implementation satisfies all thirteen able-to-fail controls and `make verify-awake` at the exact
   landing commit.
7. Every staged discharge required by [[D3047]] is a dated, owned work-state item blocked on
   `item:D3034`; missing metadata fails the focused gate.
8. Closeout updates the RFC register, relevant ledger rows, roadmap/receipt and append-only
   exploration log in the implementation commit.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Fresh independent review of the cut contract; due 2026-09-07 | claude | review receipt plus verdict | |
| D2 | Catalogue/checker implementation after acceptance; due 2026-09-07 | codex | implementing SHA plus `make verify-awake` | |
| D3 | Rebase assistance/provider/semantic register RFCs on the minimal catalogue; due 2026-09-08 | codex | tracked owned items blocked on `item:D3034` | |

## Open questions

None for the owner. [[D3034]] settled the scope: collision prevention now; additional readers only
when a concrete resource proves one necessary.

## Changelog

- 2026-09-06: owner-directed [[D3034]] cut. Replaced the 1,330-line catalogue/projection/lifecycle/
  history architecture with the seven-row collision catalogue and three existing reader shapes.
  Removed all three speculative roots and deferred every dependent generic engine. Earlier repair
  and review receipts remain immutable in `planning/shared-resource-register-bootstrap/` and Git
  history; they are evidence of the withdrawn attempt, not requirements of this RFC.
- 2026-08-31 through 2026-09-05: original bootstrap drafted and repaired through fifteen review
  rounds; withdrawn by [[D3034]] before acceptance or implementation.
