# RFC: Semantic-convention shared-resource catalogue population

- **Status:** implementing 2026-09-24 (process landing complete; archival deferred to the
  consolidation pass) at the owner's direction to implement ready RFCs without further review
  rounds (D2 not run). Rebased onto the implemented collision-core bootstrap for
  [[D2466]]: `semantic-conventions` is one `members` row read by the existing `string_tuple` reader
  over a present, initially empty `SEMANTIC_CONVENTION_MEMBERS` tuple, with its checked README
  register; `semantic-convention-provenance.md` claims the members in the same landing.
  Previously: canonical descriptor/history repair complete 2026-09-01 under [[D2499]]/[[D2502]]
- **Author:** Codex
- **Created:** 2026-08-27
- **Design refs:** none. This is repository process and changes no evidence meaning or learner UX.
- **Exploration gate:** [[D1722]] and the executable 39-member census in
  `tools/d1722-convention-identity-harness/initial-member-census.test.ts`
- **Depends on:** implemented `rfc/archive/shared-resource-register-bootstrap.md` (catalogue + checker)
- **Parent / amends:** adds one data row to the generic catalogue
- **Supersedes / superseded by:** supersedes the former assistance-C9/C10/`RESOURCE_NAMES` plan
- **Planning:** `planning/semantic-convention-register/`

```tabiya-claims
none
```

```tabiya-resource-descriptor-source
rfc/shared-resource-registers.json#semantic-conventions
```

```tabiya-resource-roots
semantic-conventions | members/string_tuple@present | packages/runtime/src/evidence-conventions.ts#export:SEMANTIC_CONVENTION_MEMBERS | none
```

## Summary

This process RFC introduces one `semantic-conventions` catalogue row and a human-owned, mechanically
checked README register. The row uses the implemented bootstrap's existing `string_tuple` reader:
the source bytes `packages/runtime/src/evidence-conventions.ts#SEMANTIC_CONVENTION_MEMBERS` are
created first (as an empty literal tuple) so the resource is *present*, and absent-source admission
([[D3082]]) is not needed. `semantic-convention-provenance.md` then claims one member per convention
`id@version` and, when it lands, adds them.

The resource depends on the generic catalogue, not on assistance. It adds no C10, reader, Git
reader, parser branch or resource-name literal to `tools/register-check.mjs` ([[D2466]]).

## Active contract and acceptance criteria

1. `rfc/shared-resource-registers.json` gains exactly one `semantic-conventions` row with claim kind
   `members` and source `{ kind: "string_tuple", path: "packages/runtime/src/evidence-conventions.ts",
   exportName: "SEMANTIC_CONVENTION_MEMBERS" }`. The historical
   `planning/semantic-convention-register/catalogue-additions.v1.json` descriptor is retained as
   evidence only; its `lineage_set/versioned_declarations@1/absent` vocabulary does not exist in
   the implemented bootstrap (§5 of that RFC removes it).
2. The human-owned `rfc/README.md` register gains exactly `semantic-conventions members=0`, an empty
   Landed table and a Live-claims table. It is checked, never generated.
3. **Member grammar.** One member per convention ref, spelled `<base id with - as _>_v<version>`:
   `defence-duty@1` is `defence_duty_v1`, `space@2` is `space_v2`. The catalogue's generic `members`
   grammar (`^[a-z][a-z0-9_]*$`) refuses a raw `id@version` or a hyphen. Two base ids that would
   alias one member (`back-rank` and `back_rank`) are refused by the runtime registry compiler.
4. **Collision identity** is the member, so two RFCs claiming the same next version (`space_v2`)
   collide through generic C3 while disjoint ids and disjoint versions do not. This is the base-id
   lineage collision the draft asked for, expressed without a lineage reader.
5. **Lineage** (a new id starts at 1; an existing id advances exactly one; earlier versions stay
   landed) and **tree ↔ declaration equality** are product invariants, enforced where the
   declarations live: `compileConventionRegistry` refuses a skipped version and
   `packages/runtime/src/evidence-conventions.test.ts` proves the tuple, the compiled declarations
   and the append-only history are one set. The register governs identity and collision only.
6. The implemented bootstrap's catalogue parser and C1–C8 are the only register authorities. The
   generic C4/C6 checks already prove that every tree member has a Landed row and that the head
   count equals the tuple length.
7. The process landing changes only the catalogue row, the one present source tuple (empty), the
   checked README register, its focused register-check fixture and this RFC's closeout. The product
   claim (`semantic-convention-provenance.md`) is declared in the same landing; it owns the
   declarations, the generated initial source, semantic history and consumers.
8. `make register-check` and `make shared-resource-catalogue` prove the row, register and claim.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Generic register engine lands first | shared-resource-register-bootstrap | archived SHA | **2026-09-24** — the catalogue + catalogue-driven checker are implemented; the bootstrap archived in the same series once its three D3 rebases landed |
| D2 | Fresh independent review of the process population | claude | review receipt plus acceptance/corrections | **2026-09-24 — not run**: the owner directed implementation of ready RFCs without review rounds; criteria 3–6 execute in `tools/register-check.test.mjs` and `packages/runtime/src/evidence-conventions.test.ts` |
| D3 | Present descriptor/register lands with full verification | claude | implementation SHA plus green verification | **2026-09-24** — process landing commit on branch `worktree-agent-ad09667cb734eccf8` |
| D4 | Product RFC claims the members and lands declarations/history | semantic-convention-provenance | claim plus product SHA | claim declared in the same landing; product landing follows in the same series |

## Open questions

None for the owner. Convention definitions, limitations and evidence authority are
`semantic-convention-provenance.md` semantics; this document governs identity and change only.

## Changelog

- 2026-09-24: implemented (claude) and rebased for [[D2466]] with one genuine-defect correction
  inline: the draft assumed a generic `lineage_set` lifecycle, a `versioned_declarations@1`
  projection adapter, an `absent` introduction, a `whole projection` claim mode, staged and
  first-parent Git transition readers and eighteen engine fixtures, none of which exist in the
  implemented `shared-resource-register-bootstrap` (its §5 removes them). The contract is rewritten
  to the smallest honest shape that bootstrap allows: one `members` row over the existing
  `string_tuple` reader, the source bytes created first (an empty tuple) so the resource is present,
  collision by member, and lineage/tree equality proved by the product's own registry compiler and
  test. The former §§1–6 and their eighteen fixtures are superseded; they remain in Git history and
  `planning/semantic-convention-register/`.
- 2026-09-01: added the complete canonical descriptor candidate and restored the exact append-only
  history path plus stable Make surface during generic-engine compatibility review.
- 2026-09-01: rebased onto the generic engine. Removed the assistance/C9 dependency,
  `RESOURCE_NAMES` and C10, retained lineage semantics and delegated time/history to the shared
  reader. Fresh review required; implementation remains unauthorized.
- 2026-08-28: prior repair added source-recovery generation, canonical semantic history and
  safe-integer lineage.
- 2026-08-27: initial draft proposed a bespoke C10 after assistance C9; that architecture is
  superseded.
