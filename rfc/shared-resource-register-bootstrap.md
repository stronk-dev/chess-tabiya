# RFC: Shared-resource register bootstrap and absent roots

- **Status:** draft — AUTHOR REPAIRED 2026-08-31 after the fresh independent return on
  [[D2381]]–[[D2384]]; another independent process/buildability review is required before
  acceptance or implementation
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

```tabiya-resource-roots
release-manifest-schema | schema | schemas/release_manifest.schema.json#$id=urn:chess-tabiya:schema:release-manifest:{version} | packages/schema/src/index.ts#export:RELEASE_MANIFEST_SCHEMA_VERSION
concept-registry-schema | schema | schemas/concept_registry.schema.json#$id=urn:chess-tabiya:schema:concept-registry:{version} | packages/schema/src/index.ts#export:CONCEPT_REGISTRY_SCHEMA_VERSION
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
|---|---|---|---|
| pack-schema | schema | schemas/drill_pack.schema.json#$id=urn:chess-tabiya:schema:drill-pack:{version} | packages/schema/src/index.ts#export:DRILL_PACK_SCHEMA_VERSION |
| run-schema | schema | schemas/drill_run.schema.json#$id=urn:chess-tabiya:schema:drill-run:{version} | packages/schema/src/index.ts#export:DRILL_RUN_SCHEMA_VERSION |
| shape-entry-schema | schema | schemas/shape_entry.schema.json#$id=urn:chess-tabiya:schema:shape-entry:{version} | packages/schema/src/index.ts#export:SHAPE_ENTRY_SCHEMA_VERSION |
| principle-entry-schema | schema | schemas/principle_entry.schema.json#$id=urn:chess-tabiya:schema:principle-entry:{version} | packages/schema/src/index.ts#export:PRINCIPLE_ENTRY_SCHEMA_VERSION |
| campaign-schema | schema | schemas/campaign.schema.json#$id=urn:chess-tabiya:schema:campaign:{version} | none |
| migration | migration | apps/server/src/storage.ts#function:SqliteStorage.#migrate/local:migrations[].version | apps/server/src/storage.ts#export:STORAGE_VERSION |
| evidence-kinds | closed_vocabulary | apps/server/src/sourcing/types.ts#export:EVIDENCE_KINDS[] | none |
| release-manifest-schema | schema | schemas/release_manifest.schema.json#$id=urn:chess-tabiya:schema:release-manifest:{version} | packages/schema/src/index.ts#export:RELEASE_MANIFEST_SCHEMA_VERSION |
| concept-registry-schema | schema | schemas/concept_registry.schema.json#$id=urn:chess-tabiya:schema:concept-registry:{version} | packages/schema/src/index.ts#export:CONCEPT_REGISTRY_SCHEMA_VERSION |
```

This nine-row table is normative input, not an example or a discovery task left to the implementer.
Schema rows name an exact repository-relative file, exact `$id` template and either an exported
constant or `none`. The migration row names the `migrations` local array inside the exact private
method plus its exported head. The closed-vocabulary row names the exact exported tuple. Selectors
are parsed structurally through the TypeScript AST; a text match is not a resolution. Paths are
literal POSIX paths with no glob, `..` or symlink traversal. Every path and non-`none` selector must
resolve exactly once for a landed root. Resource names match `^[a-z][a-z0-9-]*$`; kinds are the
closed set `schema | migration | closed_vocabulary`.

Kind, rather than resource name, selects all semantics:

- `schema`: the tree authority yields one `$id`; its `{version}` suffix is the head, the optional
  version authority must equal it, claims use `lane N`, and landed rows are ordered versions whose
  maximum equals the head;
- `migration`: the tree authority yields one ordered integer sequence, the version authority must
  equal its maximum, claims use `position behind RFC`, and landed rows set-equal the contiguous
  sequence `1..head`; and
- `closed_vocabulary`: the tree authority yields one ordered string tuple, the register head is
  `members=N`, claims use `members x[,y...]`, and landed member names set-equal the tuple.

The checker has no branch on `migration`, `evidence-kinds`, or a `-schema` resource-name suffix.
Able-to-fail fixtures add a second synthetic resource of every kind and prove identical parsing,
claim, head, landing and output behavior. They also independently corrupt every catalogue column
for each kind: resource, kind, tree authority and version authority.

`RESOURCE_NAMES` and `SCHEMA_SLUGS` are deleted as independent authority. `register-check` parses
the catalogue first and derives both sets. A register section absent from the catalogue, duplicate
resource/slug/path/symbol, unknown kind, missing current authority, or current tree authority not
represented by a catalogue row fails C0 before claims are parsed. This preserves C7/C8 while
removing their hard-coded ceiling.

Catalogue growth is authorized only by an accepted process RFC whose implementation commit adds
the catalogue row, an `absent` register section, its able-to-fail fixtures, the ledger closeout and
append-only log entry together. A product RFC cannot add its own resource row. Staged governance
set-equals any new catalogue/register pair to the implementing process RFC named in that register's
`introduced-by` marker and to that RFC's closed `tabiya-resource-roots` block. The block uses the
same four columns as the catalogue without its header; `none` is forbidden there because every new
root must declare a kind and both future authorities before introduction.

## 2. Absent-root lifecycle

An unlanded resource has exactly this register image:

```text
## Release-manifest-schema-version register
<!-- register: release-manifest-schema head=absent -->
<!-- introduced-by: release-manifest-schema shared-resource-register-bootstrap.md -->

### Landed
| version | RFC | changes |

### Live claims
| claim | RFC | changes |
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

Header-only tables are the sole empty representation. A sentinel row, whitespace-only cell or
prose placeholder is data and fails.

The first claim grammar is:

```text
release-manifest-schema | first lane 1 | $id; release metadata; component inventory; verification receipt
```

After the root lands, ordinary schema claims use `lane N` with the existing exact-depth and
strictly-above-head rules. `first lane 1` is thereafter invalid. A failed product implementation
that creates only the file, only the constant, only the register row, or leaves the claim live
fails set equality.

## 2.1 Transition authority and history

Snapshot validation remains in `register-check`, but temporal claims are checked by one exported
pure function:

```text
assertSharedResourceTransition(beforeTree, afterTree, changedPaths)
```

`beforeTree` and `afterTree` expose file reads at exact repository revisions; `changedPaths` is the
set of paths whose bytes differ. The staged-process runner calls it with committed `HEAD` as
`beforeTree` and the already-materialized staged index as `afterTree`. Unstaged and untracked bytes
therefore cannot satisfy it.

CI runs `make register-history-check` with a required `REGISTER_BASE_SHA`. The workflow sets that
to `github.event.before` for a push and the pull request base SHA for a pull request, with full
history checkout. The command walks
`git rev-list --reverse --first-parent REGISTER_BASE_SHA..HEAD` and invokes the same function for
each commit against that commit's first parent. A merge commit is checked against its first parent;
therefore a branch may merge only when the required introduction and claim transitions remain
separate in the target's first-parent history. `make ci-local` sets `REGISTER_BASE_SHA=HEAD^` and
checks the committed checkpoint in addition to the staged check. A missing or unresolvable base,
shallow range or second-parent-only introduction fails rather than falling back to a snapshot.

The function admits exactly these changing-root transitions:

1. `unregistered -> absent`: the before tree contains the introducing process RFC active and
   accepted; the after tree archives that same RFC as implemented, adds exactly the roots declared
   in its `tabiya-resource-roots` block, and changes the required ledger and append-only log files.
   Every new root has header-only landed/claim tables and neither tree authority exists.
2. `absent -> first claim`: the before tree already contains the absent root and archived
   introducer; the after tree changes only the product RFC/register/governance receipts and carries
   exactly one `first lane 1` claim. A root introduced in the same transition is ineligible.
3. `first claim -> landed 1`: the before tree already contains that unique first claim; the after
   tree creates every declared authority, changes the head to `1`, removes the claim, adds exactly
   landed row `1` plus the schema digest, and performs the RFC ledger/log closeout atomically.
4. `landed -> landed`: ordinary current snapshot rules apply, but any after image with `absent`, a
   missing prior landed row or a lower head fails before snapshot validation.

A change that combines transitions, skips a named precondition, rewrites `introduced-by`, or
changes a catalogue row's kind/authority after introduction fails. Fixtures cover introduction plus
first claim in one commit, claim without a base root, partial first landing, each combined partial,
landed-to-absent, a hidden earlier bad commit in a multi-commit CI range, and a merge whose second
parent alone contains the prerequisite.

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

## Fresh-review return and author response — 2026-08-31

Implementation remains unauthorized pending another independent review. This author repair answers
the four buildability findings as follows:

- [[D2381]] — §2 now uses header-only tables and refuses sentinels;
- [[D2382]] — §1 closes generic semantics over the three kinds and requires a second-resource
  fixture for each;
- [[D2383]] — §1 publishes all nine normative rows and the exact authority-selector grammar; and
- [[D2384]] — §2.1 names the shared transition function, staged preimage, required CI range,
  first-parent merge policy and negative transition matrix.

The fresh review receipt is
`planning/shared-resource-register-bootstrap/fresh-independent-buildability-review-2026-08-31.md`.
Another independent review is required after the author repair.

## Acceptance criteria

1. `make shared-resource-bootstrap-check` derives all resource names and schema slugs from the
   catalogue; removing any current row, adding a duplicate/unknown row or restoring a parallel
   hard-coded resource list fails.
2. The committed release-manifest and concept-registry registers are both `absent`, have no tree
   file/constant/digest/landed row and name this implemented process RFC as introducer.
3. Fixtures cross unique `first lane 1`, duplicate first, ordinary lane on absent, first on landed,
   file-before-claim, claim-without-root, partial landing, combined introduction+claim, a bad
   intermediate CI commit, a second-parent-only prerequisite and attempted return to absent.
4. Staged governance refuses catalogue/register growth without the accepted+archived introducing
   process RFC, ledger update and append-only log entry in the same commit.
5. Existing C1–C8 behavior and all seven current register/tree joins remain green after catalogue
   derivation; `make verify` invokes snapshot, staged-transition and CI-history checks. The CI
   workflow supplies `REGISTER_BASE_SHA`; `make ci-local` supplies `HEAD^`.
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

- 2026-08-31: author repair answers D2381–D2384 with header-only empty registers, the normative
  nine-row catalogue, closed generic kind semantics, exact staged/CI preimages and first-parent
  transition policy. Implementation remains unauthorized pending another independent review.
- 2026-08-31: returned by fresh independent buildability review on D2381–D2384; no checker,
  register or product implementation authorized.
- 2026-08-31: amended on [[D2370]] to exercise the generic protocol with the concept-registry
  schema root; no concept product bytes authorized.
- 2026-08-31: drafted from [[D2363]] with generic catalogue derivation, accepted-process bootstrap,
  absent-root lifecycle, exact release-manifest handoff and seven able-to-fail acceptance arms. No
  checker/register/product implementation yet.
