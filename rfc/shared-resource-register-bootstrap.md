# RFC: Shared-resource register bootstrap and absent roots

- **Status:** draft — author contract amended 2026-08-31 on [[D2370]]; fresh independent
  process/buildability review required before implementation
- **Author:** Codex
- **Created:** 2026-08-31
- **Design refs:** none; this is repository process and changes no learner/product behavior
- **Exploration gate:** [[D2363]] reproduces a checker/process deadlock while repairing the returned
  runtime-distribution RFC
- **Depends on:** implemented `rfc/archive/shared-resource-registers.md`
- **Parent / amends:** RFC-0000 rule 7, `rfc/README.md`, `rfc/template.md`,
  `tools/register-check.mjs`
- **Supersedes / superseded by:** —
- **Planning:** `planning/shared-resource-register-bootstrap/`

```tabiya-claims
none
```

## Summary

A new shared resource enters the governance graph in two commits, never by creating product bytes
before their RFC is accepted. First, an accepted process RFC registers a named `absent` root plus
its tree-discovery metadata. Second, the product RFC declares the unique `first lane 1` claim. Its
later implementation creates version 1 and converts that claim into the first landed row.

This repairs [[D2363]] and immediately bootstraps `release-manifest-schema` for
`verifiable-runtime-distribution.md`. [[D2370]] adds the second proved consumer of the generic
protocol: `concept-registry-schema`, whose product bytes belong to `concept-registry.md`, not this
process RFC. It also replaces the seven-name hard-coded checker ceiling
with a checked catalogue, so the next legitimate resource uses the same protocol rather than
another one-off exception.

## 1. Machine-readable register catalogue

`rfc/README.md` gains one catalogue section. Each row is closed and unique by resource:

```text
## Shared-resource catalogue
| resource | kind | tree authority | version authority |
| release-manifest-schema | schema | schemas/release_manifest.schema.json#urn:chess-tabiya:schema:release-manifest | packages/schema/src/index.ts#RELEASE_MANIFEST_SCHEMA_VERSION |
| concept-registry-schema | schema | schemas/concept_registry.schema.json#urn:chess-tabiya:schema:concept-registry | packages/schema/src/index.ts#CONCEPT_REGISTRY_SCHEMA_VERSION |
```

The implementation migrates the seven current resources into the same table. Schema rows name an
exact repository-relative file plus `$id` slug and either an exported constant or `none`; migration
and closed-vocabulary rows name their existing exact exported authority. Paths are literal POSIX
paths with no glob, `..` or symlink traversal. Symbols must resolve exactly once. Resource names
match `^[a-z][a-z0-9-]*$`; kinds are `schema | migration | closed_vocabulary`.

`RESOURCE_NAMES` and `SCHEMA_SLUGS` are deleted as independent authority. `register-check` parses
the catalogue first and derives both sets. A register section absent from the catalogue, duplicate
resource/slug/path/symbol, unknown kind, missing current authority, or current tree authority not
represented by a catalogue row fails C0 before claims are parsed. This preserves C7/C8 while
removing their hard-coded ceiling.

Catalogue growth is authorized only by an accepted process RFC whose implementation commit adds
the catalogue row, an `absent` register section, its able-to-fail fixtures, the ledger closeout and
append-only log entry together. A product RFC cannot add its own resource row. Staged governance
set-equals any new catalogue/register pair to the implementing process RFC named in that register's
`introduced-by` marker.

## 2. Absent-root lifecycle

An unlanded resource has exactly this register image:

```text
## Release-manifest-schema-version register
<!-- register: release-manifest-schema head=absent -->
<!-- introduced-by: release-manifest-schema shared-resource-register-bootstrap.md -->

### Landed
| version | RFC | changes |
| — | — | no product artifact exists |

### Live claims
| claim | RFC | changes |
| — | — | none until the process RFC lands |
```

For an absent root, C2/C4/C6 enforce:

1. its declared tree file and version symbol do not yet exist;
2. it has no landed row and no schema digest;
3. before the introducing process RFC archives, it has no product claim;
4. afterward, at most one active RFC may claim `first lane 1`;
5. ordinary `lane 1`, later lanes, members, migration positions, duplicate or parallel first
   claims fail;
6. the first product implementation must atomically create the declared tree authority, change
   head to `1`, add landed version `1`, remove the live claim, and record the exact schema digest;
7. once non-absent, the resource can never return to `absent`.

The first claim grammar is:

```text
release-manifest-schema | first lane 1 | $id; release metadata; component inventory; verification receipt
```

After the root lands, ordinary schema claims use `lane N` with the existing exact-depth and
strictly-above-head rules. `first lane 1` is thereafter invalid. A failed product implementation
that creates only the file, only the constant, only the register row, or leaves the claim live
fails set equality.

## 3. D2363 handoff

This RFC's implementation adds the absent `release-manifest-schema` catalogue/register root and no
release schema bytes. Only then may `verifiable-runtime-distribution.md` replace its `claims none`
block with the exact `first lane 1` claim above and return to independent review. The runtime-
distribution implementation later owns the schema, generator, consumers and first landed row.

The same implementation also updates RFC-0000 rule 7 and `rfc/template.md`: authors first ledger a
new resource, draft/accept this small process extension, and may claim the resource only after its
absent root lands. “Add the name to `RESOURCE_NAMES`” is removed because that list no longer exists.

### 3.1 D2370 handoff

The implementation also adds an absent `concept-registry-schema` catalogue/register root and no
concept schema, registry or product bytes. Only after this process RFC lands may
`concept-registry.md` claim `first lane 1`. Its implementation owns the schema, exported version,
reviewed registry, compiler, consumers and first landed row. `skills.md` relinquishes direct
ownership of D300's registry mechanics and consumes that one compiled authority; Campaign does the
same. A third concept enum, pack-local fallback or unvalidated registry file fails the product
RFC's set-equality contract.

Skills and Campaign consume one compiled authority; neither may own a parallel identity map.

## Acceptance criteria

1. `make shared-resource-bootstrap-check` derives all resource names and schema slugs from the
   catalogue; removing any current row, adding a duplicate/unknown row or restoring a parallel
   hard-coded resource list fails.
2. The committed release-manifest and concept-registry registers are both `absent`, have no tree
   file/constant/digest/landed row and name this implemented process RFC as introducer.
3. Fixtures cross unique `first lane 1`, duplicate first, ordinary lane on absent, first on landed,
   file-before-claim, claim-without-root, partial landing and attempted return to absent.
4. Staged governance refuses catalogue/register growth without the accepted+archived introducing
   process RFC, ledger update and append-only log entry in the same commit.
5. Existing C1–C8 behavior and all seven current register/tree joins remain green after catalogue
   derivation; `make verify` invokes the new checks through the same register target.
6. No production schema, package export, release manifest, concept registry, API, runtime, content
   or protected-design byte changes in this implementation.
7. [[D2363]] and [[D2370]] close only when criteria 1–6 pass; the two named product RFCs then carry
   the sole first claims for their distinct resources and still require fresh review.

## Discharges

none

## Open questions

No owner/product decision remains. Fresh review should attack the authorization of catalogue
growth, the absent→landed atomic join, one-way history and whether schema discovery can again drift
into a second list.

## Changelog

- 2026-08-31: amended on [[D2370]] to exercise the generic protocol with the concept-registry
  schema root; no concept product bytes authorized.
- 2026-08-31: drafted from [[D2363]] with generic catalogue derivation, accepted-process bootstrap,
  absent-root lifecycle, exact release-manifest handoff and seven able-to-fail acceptance arms. No
  checker/register/product implementation yet.
