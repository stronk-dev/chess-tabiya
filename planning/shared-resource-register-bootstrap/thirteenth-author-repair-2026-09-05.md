# Shared-resource register bootstrap — thirteenth author repair

- **Date:** 2026-09-05
- **Repairs:** [[D2843]]–[[D2845]]
- **Gate:** `make shared-resource-bootstrap-thirteenth-author-repair`
- **Verdict:** author repair complete; another genuinely fresh independent review required

## Repair

Literal string/numeric element access now resolves the exact compiler property symbol and retains
the same site-bound edge plus target declaration as dot access. The repair does not suppress bracket
syntax or treat a missing target as a successful empty relation.

The existing canonical shared-resource authority is selected explicitly: ascending UTF-16
code-unit order. That one comparator now orders root names, node ids, root members/selectors,
complete serialized edges and declaration-artifact paths. Full-width BMP and astral identifiers
prove this is not accidentally interchangeable with UTF-8 byte ordering.

One Unicode `ID_Start`/`ID_Continue` structural-selector parser is invoked both while compiling the
complete catalogue and during projection. A Unicode function selector is therefore either refused
before descriptor authority is issued or projected by the same grammar; the repaired positive
projects.

## Evidence and hold

`make shared-resource-bootstrap-thirteenth-author-repair` retains every predecessor review and
author repair, reproduces the three thirteenth-review attacks against the pinned twelfth model, and
passes 3/3 repair controls against the composed successor. No production catalogue, checker,
register, schema, provider, product or content byte changed. Another genuinely fresh review still
precedes acceptance and implementation.
