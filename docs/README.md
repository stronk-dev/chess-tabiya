# Canonical implementation docs

This directory describes what currently exists. Design intent remains in `design/`;
accepted implementation contracts remain in `rfc/`; work history remains in `planning/`.

Implemented foundation:

- `development.md` — workspace layout, toolchain, and verification commands.
- `branch-runtime.md` — immutable run tree, rewind/fork/objective/replay semantics,
  comparison and PGN export, REST/lease/storage behavior, measured envelope, and
  current limitations.
- `drill-pack-format.md` — living v0.2 schema, semantic authoring lint, canonical
  digest and URL tooling, executable checkpoint-action validation, pack/run PGN
  round-trip, and deferred content boundary.
- `engine-workers.md` — UCI supervision, Dockerized Maia and policy exposure,
  opponent selection/cache/writer seam, evidence queue, capabilities, ratified
  strong-engine profile, measured envelope, and current limitations.
- `drill-client.md` — pack-aware server routes and the REST-driven Svelte
  client: persisted writer sessions, event-projected state, episode
  orchestration, board/timeline/branch screens, evidence sentences, comparison,
  browser-safe pack projection, keyboard behavior, PGN export, browser
  acceptance, and packaged operation.
- `app-shell.md` — stable routes and information architecture, run discovery
  and lease-aware resume, honest deployment capabilities, fitted viewport
  regions, global keyboard ownership, and disabled-control explanations.
- `explanation-grounds.md` — durable comparison evidence, feedback withholding,
  path-relative authored checkpoint reveal, grounded objective sentences,
  aligned engine-score trajectories, provenance honesty, and the explicit
  content-era boundary.
- `identity-and-authorization.md` — learner accounts, server-side sessions,
  per-run roles, learner-bound writer leases, grant transfer, deletion
  reassignment, and hosted-operation limits.
