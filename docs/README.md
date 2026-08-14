# Canonical implementation docs

This directory describes what currently exists. Design intent remains in `design/`;
accepted implementation contracts remain in `rfc/`; work history remains in `planning/`.

Implemented foundation:

- `development.md` — workspace layout, toolchain, and verification commands.
- `branch-runtime.md` — immutable run tree, rewind/fork/objective/replay semantics,
  comparison and PGN export, REST/lease/storage behavior, measured envelope, and
  current limitations.
- `branch-groups.md` — durable candidate sets over ordinary branches, four seed
  sources, controlled-resistance reply journals, sequential/lockstep play,
  semantic zoom, evidence recovery, comparison, and export.
- `drill-pack-format.md` — living v0.13 schema, semantic authoring lint, canonical
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
- `content-sourcing.md` — unpublished candidate artifacts, evidence/source linkage,
  licence enforcement, deterministic and polite source access, opening skeletons,
  Syzygy/engine grounding, authenticated explorer priorities, and private-evidence puzzle
  consequence seeds.
- `outcome-drill-grading.md` — win/hold/save/resist grading, monotone outcome
  transitions, exact-assessment admission, path-scoped resistance identity, and
  the learner-facing honesty contract.
- Line Drill theory grading is documented across `drill-pack-format.md`,
  `branch-runtime.md`, `engine-workers.md`, and `drill-client.md`: authored
  membership, boundary crossing, recorded applied policy, and withheld
  three-way verdict delivery are one cross-layer contract.
- `return-and-progression.md` — durable branch-attempt projection, migration 6,
  learner-scoped return schedules, run duplication, the `/learn` surface, and pack
  schema 0.6 retry/concept vocabulary.
- `trajectory-drill.md` — pack schema 0.7 trajectory legs, continuous-path entry,
  per-leg objective seal/reset, causal move provenance, derived verdicts, and the
  deliberately non-aggregated client presentation.
- `pack-studio.md` — migration 7 durable drafts/registrations, source-derived
  publication channels, digest-retained playtests and versions, the authoring REST
  surface, pack schema 0.8, and `/create`.
- `n-way-comparison.md` — one-axis 2–8 branch comparison, consequence rows,
  scratch simulation and promotion, prediction capture, deep analysis, run
  run schema 0.8, pack schema 0.9, and migration 8.
- `live-sessions.md` — roles and board-control policy, possession authorship,
  proposals, advisory chat votes, Arena PGN legs, follower withholding, live routes,
  migration 9, and the accepted streamer-disclosure limitation.
- `structural-reading.md` — fifteen deterministic rung-0 predicates, mirrored/quantified
  expressions, finite learner observations, current-position deltas, and grounded plan objectives.
- `shape-library.md` — reusable structural entries and pack references, source-derived
  channels, derived timeline firings, the attributed plans panel, Shape Studio, and the
  pack-free Just Play position player.
- `adaptive-guidance.md` — attributed phase bands, silent-by-default assistance,
  passive pivotal markers, gated human-model splits, endgame census and technique naming,
  retrospective evaluation pivots, and the packet-checked optional voice seam.
- `runtime-corpus-evidence.md` — operator-authenticated, disclosure-gated Lichess
  frequency and recency facts, bounded interactive caching, honest abstention, and
  the closed fact-only assistance renderer.
- `game-import-and-story.md` — one-game PGN/lichess import, imported-run identity,
  idempotent evidence completion, grounded story moments, live re-entry, and
  original-game-plus-branches export.
- `adoption-wave-1.md` — native terminal stories, deterministic and revocable
  public cards, external packet-bound voice, explicit-open spoken delivery,
  event-shaped milestones, and opposite-side replay provenance.
