# Shared-resource register bootstrap — eighth author repair

**Date:** 2026-09-04

**Scope:** bounded contract-tier repair for [[D2645]]–[[D2649]].

**Production authorization:** none. This checkpoint changes the RFC and disposable author model;
it does not implement the register engine or any product/shared-resource bytes.

## Repair

- [[D2645]]: the author projector now starts from exact resolved symbols, retains referenced
  repository declarations transitively and emits typed edges. A two-file fixture requires the
  referenced interface and its `type_reference` edge, and exact compiled-graph comparison refuses
  deletion.
- [[D2646]]: projection is created by a repository-bound projector from descriptor plus Git
  revision. The host reads repository paths from the resolved commit, records that commit, hashes
  the installed TypeScript package metadata/compiler image, digests the committed config and
  retains converted forced options. Working-tree mutation, unknown revisions and caller
  `sourceText` fail or leave the committed projection unchanged.
- [[D2647]]: alias resolution retains the public `ExportSpecifier`, follows the exact aliased
  compiler symbol, retains its target declarations and emits a `re_export` edge.
- [[D2648]]: recursive sealing now admits only safe integers other than negative zero and strings/
  keys with paired UTF-16 surrogates. Fractional, unsafe and unpaired values fail before digesting.
- [[D2649]]: `ContractRootV1` now carries a non-empty ordered `nodes` set rather than one arbitrary
  node. A normal three-declaration overload resolves as one compiler symbol and roots every
  declaration without name-based widening.

## Executable evidence

`make shared-resource-bootstrap-eighth-author-repair` runs:

- 4/4 sixth-author controls;
- 5/5 seventh-author controls;
- 5/5 eighth-review defect reproductions; and
- 5/5 new repair controls over a real committed temporary Git repository.

This is positive author evidence, not an independent acceptance. Another genuinely fresh review
must attack graph completeness, program/dependency identity, alias/overload closure and canonical
interoperability before the RFC can be accepted or production implementation can begin.
