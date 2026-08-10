# Canonical implementation docs

This directory describes what currently exists. Design intent remains in `design/`;
accepted implementation contracts remain in `rfc/`; work history remains in `planning/`.

Implemented foundation:

- `development.md` — workspace layout, toolchain, and verification commands.
- `branch-runtime.md` — immutable run tree, rewind/fork/objective/replay semantics,
  comparison and PGN export, REST/lease/storage behavior, measured envelope, and
  current limitations.
- `drill-pack-format.md` — living v0.2 schema, semantic authoring lint, canonical
  digest and URL tooling, and the boundary of the current schema slice.
