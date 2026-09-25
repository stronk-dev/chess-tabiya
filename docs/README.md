# Implemented-system documentation

This directory documents what exists in the current tree. Product intent lives in `design/`, active
implementation contracts in `rfc/`, and live status/history in `planning/`. A document appearing
here means its described mechanism has landed; it does not imply that every larger 1.0 journey that
uses the mechanism is complete.

Start with:

- [System architecture](architecture.md) — boundaries, dependency direction and end-to-end flows.
- [Feature and capability map](features.md) — what each work area owns and unlocks.
- [Extending Tabiya](extending.md) — where code/content changes belong and their integration checks.
- [Development foundation](development.md) — toolchain, workspace and commands.
- [Release distribution](release.md) — pinned release images, SBOM/licence gate, runtime-content
  allow-list, release manifest, signing/attestation workflow and local verification.
- [Testing](testing.md) — verification tiers and what each tier proves.
- [1.0 progress tracking](progress-tracking.md) — strict gates, incremental checkpoints, the sealed
  receipt and staged implementation flow-back.

Current completion state is deliberately not copied here. Use the
[authoritative 1.0 roadmap](../planning/roadmap-to-done.md) and its
[source-sealed receipt](../planning/roadmap-1.0.receipt.json).

## Rehearsal runtime and play surface

- [Branch runtime](branch-runtime.md) — immutable run tree, events, rewind/fork, objectives, replay,
  storage and export.
- [Branch groups](branch-groups.md) — durable candidate sets, controlled resistance, evidence
  recovery and group comparison.
- [Branch-set scale](branch-set-scale.md) — decided-shortfall collapse, reversible folding and
  bounded rail projection.
- [Drill-pack format](drill-pack-format.md) — living pack schema, semantic lint, digests, timing
  windows and authoring validation.
- [Drill client](drill-client.md) — REST-driven Svelte client, board/timeline/branch interaction,
  leases, projection and browser acceptance.
- [Application shell](app-shell.md) — routes, information architecture, viewport regions, resume,
  capabilities and keyboard ownership.
- [Play composition](play-composition.md) — one stable board workspace and the composition rules
  shared by play contexts.
- [N-way comparison](n-way-comparison.md) — 2–8 branch comparison, simulation, predictions and deep
  analysis.
- [Outcome Drill grading](outcome-drill-grading.md) — win/hold/save/resist grading and exact
  assessment boundaries.
- [Trajectory Drill](trajectory-drill.md) — continuous legs, per-leg objectives and causal
  provenance.
- [Return and progression](return-and-progression.md) — attempt projection, schedules, duplication,
  related retries and the Learn surface.
- [Open-answer grading](open-answer-grading.md) — private stated reasoning and deterministic
  authored-key matching.

## Evidence, explanation and assistance

- [Evidence contract](evidence-contract.md) — producers, projections, consumers, bindings,
  availability and registration.
- [Semantic evidence](semantic-evidence.md) — operand-preserving events, research selection and
  counterfactual population rules.
- [Learner modules](learner-modules.md) — the compiled eleven-module registry, its capability
  image, what executes today and what is blocked by name.
- [Guided Hint](guided-hint.md) — the learner-requested five-rung disclosure ladder, its sealed
  horizon and per-rung packets, the proposed D1639 ceiling and the hint request protocol.
- [Recorded evidence](recorded-evidence.md) — durable evidence shapes and their source identity.
- [Claim backing](claim-backing.md) — authored-claim evidence bindings and validation.
- [Explanation grounds](explanation-grounds.md) — disclosure, grounded sentences, score
  trajectories and provenance honesty.
- [Structural reading](structural-reading.md) — deterministic structure predicates and learner
  observations.
- [Transition primitives](transition-primitives.md) — typed phase/structure transition readings.
- [Adaptive guidance](adaptive-guidance.md) — phase bands, assistance, pivotal markers, endgame
  naming and voice boundary.
- [Runtime corpus evidence](runtime-corpus-evidence.md) — disclosure-gated Explorer frequency and
  recency facts.
- [Runtime opening identity](runtime-opening-identity.md) — exact opening endpoint/path/history
  catalogue and production boundary.
- [Expression census](expression-census.md) — offline structural-expression coverage and
  satisfiability instrument.
- [Board annotation](board-annotation.md) — arrows, marks and their evidence/disclosure ownership.

## Engines and opponent infrastructure

- [Engine workers](engine-workers.md) — UCI supervision, Maia, Stockfish evidence, capabilities,
  caching and failure handling.
- [Provider exchange](provider-exchange.md) — one scheduler, sealed request identity and receipts,
  typed unavailability and the durable save/reload parser for Stockfish, Maia, Syzygy and Explorer.
- [Provider health](provider-health.md) — the live provider-health registry, circuits and shared
  backoff, `/capabilities` provider state, and honest in-run degradation including the paused
  opponent.
- [Engine grounding](engine-grounding.md) — fixed-depth opening assessments and the read-only engine
  authoring walk.
- [Tablebase grounding](tablebase-grounding.md) — Syzygy sidecars, perfect resistance and refusal
  boundaries.
- [Bot policy](bot-policy.md) — measured policy composition and the current opponent-policy
  foundation.

## Content, theory and authoring

- [Content sourcing](content-sourcing.md) — candidates, provenance, licences, source access and
  grounding pipelines.
- [Pack Studio](pack-studio.md) — durable drafts, publication channels, versions and authoring API.
- [Concept registry](concept-registry.md) — the one cross-pack concept identity, its compiler,
  consumers and the migration-28 legacy quarantine.
- [Pack graduation](pack-graduation.md) — clearance states, reports and official-content boundary.
- [Shape library](shape-library.md) — reusable structural entries, triggers, plans and Shape Studio.
- [Repertoire gap finding](repertoire-gap-finding.md) — private repertoire import, coverage scans
  and gap-to-run entry.

## Review, story and adoption

- [Game import and story](game-import-and-story.md) — PGN/Lichess import, grounded moments,
  re-entry and export.
- [Review evidence](review-evidence.md) — the typed Review packet, its coordinator, the story
  receipt and the Review Map evidence panel.
- [Evidence presentation](evidence-presentation.md) — the sealed component vocabulary, adapters and
  the closed presentation receipt.
- [Adoption wave 1](adoption-wave-1.md) — terminal stories, public cards, milestones and
  opposite-side replay.

## Social, professional and progression surfaces

- [Live sessions](live-sessions.md) — roles, native matches, proposals, votes, overlays, Arena legs
  and follower withholding.
- [Classrooms](classrooms.md) — rosters, assignments, submissions and consent.
- [Campaign](campaign.md) — campaign schema/registry/fold and the present product boundary.
- [Learner rating](learner-rating.md) — isolated rating arithmetic, storage and learner surface.
- [Longitudinal store](longitudinal-store.md) — the personal observation ledger, its background
  projection worker, typed read and operator rebuild.
- [Learner profile](learner-profile.md) — the private profile over the store: habit cards with
  per-metric floors, opening results, the observation ledger, skills with named blockers, history,
  drill-down and consented sharing.
- [Evidence jobs](evidence-jobs.md) — durable admission, lease, settlement and consumption of
  queued engine/tablebase evidence.

## Identity and client platform

- [Identity and authorization](identity-and-authorization.md) — accounts, sessions, roles, grants
  and writer leases.
- [Account data lifecycle](account-data-lifecycle.md) — export, deletion, tombstones and browser-local
  clearing.
- [Theming](theming.md) — app, board and piece appearance axes and persistence.

## Operations and self-hosting

- [Deployment profiles](deployment.md) — loopback `local`, LAN `appliance` and Internet `hosted`
  topologies, the Caddy/TLS edge, cookie and origin policy, and the `core`/`cpu` resource tiers.
- [Storage backup and recovery](storage-backup-and-recovery.md) — verified backup bundles,
  restore, migration-safe startup, rollback to the prior release and the maintenance lock.

## Documentation rule

Every Markdown document directly under `docs/` must appear in this index. `make docs-check` enforces
that set equality and also checks that the repository README links the architecture, features and
contributor entry points.
