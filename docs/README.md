# Canonical implementation docs

This directory describes what currently exists. Design intent remains in `design/`;
accepted implementation contracts remain in `rfc/`; work history remains in `planning/`.

Implemented foundation:

- `development.md` — workspace layout, toolchain, and verification commands.
- `branch-runtime.md` — immutable run tree, rewind/fork/objective/replay semantics,
  comparison and PGN export, REST/lease/storage behavior, measured envelope, and
  current limitations.
- `drill-pack-format.md` — living v0.2 schema, semantic authoring lint, canonical
  digest and URL tooling, pack/run PGN round-trip, and deferred content boundary.
- `engine-workers.md` — UCI supervision, Dockerized Maia and policy exposure,
  opponent selection/cache/writer seam, evidence queue, capabilities, ratified
  strong-engine profile, measured envelope, and current limitations.
- `drill-client.md` — pack-aware server routes and browser plumbing: typed
  transport, persisted writer sessions, event-projected state and polling, the
  bare Chessground primitive, evidence sentences, and PGN export.
