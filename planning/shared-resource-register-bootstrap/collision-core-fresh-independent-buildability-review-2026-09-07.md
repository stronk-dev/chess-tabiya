# Shared-resource register bootstrap — collision-core fresh independent buildability review

- **Date:** 2026-09-07
- **Reviewed image:** owner-directed seven-resource collision-core cut plus [[D3082]]–[[D3087]]
  author self-audit
- **Gate:** `make shared-resource-bootstrap-collision-core-fresh-review`
- **Verdict:** **RETURN TO AUTHOR** on [[D3116]]–[[D3119]]; the cut remains the right scope, but
  it does not yet close its own collision or data-only-extension contract

## What survived

The 1,330-line projection/lifecycle/history design remains correctly withdrawn. The seven seed
rows equal the seven resources governed at HEAD, the three retained reader families are enough for
that population, absent-source admission remains honestly deferred, and the staged-discharge join
is executable. No product, schema, migration, vocabulary, content, API or client behavior needs to
enter this RFC.

## Returned seams

| row | executable result | required repair |
|---|---|---|
| [[D3116]] | A second resource id may name the same tuple path/export (or migration path/head). Claims against the two ids never share a collision key. | Define a canonical source identity per reader, reject aliases, and cover normalized/symlink-equivalent paths rather than only identical strings. |
| [[D3117]] | `0.29` and `00.29` compare as the same version but remain distinct C3 keys. | Refuse leading-zero components or normalize the parsed integer tuple before identity and output. |
| [[D3118]] | Catalogue ids admit digits, while the retained README marker reader recognizes only `[a-z-]+`. An admitted `schema2` resource can never acquire a parsed register section. | Use one exported id grammar at catalogue, claim and register boundaries; include a digit-bearing extension fixture. |
| [[D3119]] | The author equality/source-resolution tests ignore `versionExport`; replacing `DRILL_PACK_SCHEMA_VERSION` with a nonexistent export leaves every asserted equality unchanged. | Join every non-null seed export to the exact retained schema-index reader and its literal version in the author gate. |

## Why this blocks the foundation

The first two cases recreate the exact failure this bootstrap exists to prevent: two spellings or
two ids can reserve one semantic resource without a collision. The third makes the advertised
extension grammar wider than the register grammar. The fourth means the reviewed seed can carry a
false source binding while its author receipt remains green. These are bounded collision-core
repairs; none justifies restoring the withdrawn generic engine.

## Reproduction and boundary

The gate first retains the 5/5 owner-cut author controls, then passes four fresh executable
falsifiers. Repair the four seams in this RFC and author contract, then request another genuinely
fresh review. The implementation and the three staged consumer rebases remain unauthorized.
