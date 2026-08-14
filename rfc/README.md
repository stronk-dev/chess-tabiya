# RFC index

Process: `rfc/0000-rfc-process.md`. Template: `rfc/template.md`.

## Active

| RFC | Status | Parent | Implementation |
|---|---|---|---|
| `0000-rfc-process.md` | accepted | — | process |
| `social-match.md` | implementing | `archive/live-session-platform.md` (amends board control, journal kinds, session routes; depends on `archive/adoption-wave-1.md` for `public_tokens`) | `planning/social-match/` (migration 14, no pack/run schema claim) |

**Four-draft wave, 2026-08-14** — claim order: `predicate-wave-2` first, then
`corpus-evidence`, `adoption-wave-1`, `social-match`. Shared-resource claims (pack
schema, migrations, ownership pins) land in that order; a draft that cannot land
behind its predecessor renegotiates here.

The completed breadth batch and its dependency history are kept in the archive
documents and planning logs rather than duplicated in this index.

## Pack-schema-version register

Instituted 2026-08-13 after `pack-studio.md` (then named `pack-studio-and-review.md`) and
`return-and-progression.md` were
both drafted claiming pack schema **0.6**. `DRILL_PACK_SCHEMA_VERSION`
(`packages/schema/src/index.ts:2`) and `schemas/drill_pack.schema.json`'s `$id` are a **shared,
single-writer resource** for exactly the reason a migration number is; claim here before
writing a version into a draft. Unlike a migration, a pack version rebases cheaply — pack
digests are content digests and are unaffected by the `$id`
(`packages/schema/src/drill-pack/digest.ts:58-66`) — so the cost of a collision is a stalled
landing order, not lost data.

| Pack schema | Owner RFC | Status |
|---|---|---|
| 0.3 | `archive/outcome-drill-grading.md` | implemented — `objective.grading`, closed `successConditions` union, closed `objective` |
| 0.4 | `archive/line-drill-theory-grading.md` | implemented — `follow_theory`, the `atAuthoredBoundary` trigger |
| 0.5 | `archive/defect-sweep.md` | implemented — required `start.side`, vocabulary-constant collapse |
| 0.6 | `archive/return-and-progression.md` | implemented — `retryVariants`, typed `concepts` |
| 0.7 | `archive/trajectory-drill.md` | implemented — `legs`, `run_trajectory` |
| 0.8 | `archive/pack-studio.md` | implemented — source-derived channel; `provenance.reviewStatus` narrowed to `schema_example \| draft \| published`; typed `reviewers` removed |
| 0.9 | `archive/n-way-comparison.md` | implemented — prediction `grading` removed; numbers are recorded and rendered without a verdict |
| 0.10 | `archive/structural-reading.md` | implemented 2026-08-13, draft — `$defs/structuralFeature` and `$defs/structuralExpression`, a fourth `fenPredicate` variant, a fifth `successCondition` kind (`structural_feature`), `$defs/file`. No migration: rung-0 facts are never persisted |
| 0.11 | `archive/shape-library.md` | implemented — additive only: optional top-level `shapes` (referenced shape-entry ids) and optional `planClass.shapePlan`. `planClasses` stays fully valid; no committed digest moves (the `$id` is not part of any pack document) |
| 0.12 | `archive/defect-batch-2.md` | implemented — tightening only: `$defs/opponentPolicy` gets `additionalProperties: false` (D22); all committed packs and fixtures validate unchanged; no committed digest moves |
| 0.13 | `archive/predicate-wave-2.md` | implemented — additive: `structuralFeature` gains `bishop_on_shade`, `pawn_count` and `king_opposition`; `structuralExpression` gains `mirrored` and `quantified`; shape-entry schema 0.1 → 0.2 with the same duplicated grammar. No migration; rung-0 facts remain derived |

Landing order follows the numbers. A draft that cannot land behind its
predecessor renegotiates here rather than renumbering unilaterally.

**Content-sourcing split, 2026-08-12.** An adversarial review rejected the single
`content-sourcing-pipelines.md` draft and recommended a four-way split; the draft
is deleted, not stubbed, and its content is fully rehomed. **B6a is the
foundation and the other three name it in `Depends on:`** — it ships the artifact
triple (`pack.json` / `evidence.json` / `sources.json`), the fetch manifest, the
deterministic-output rule, the licence and attribution encoding required by the
2026-08-12 content-rights ruling, the `sourcing-check` gate, and the
`chess-openings` line skeleton. The batch landed **B6a → B6b → B6c → B6d**
(reasoning in `archive/content-sourcing-foundation.md` §6). B6d is a **redesign**, not a
rehome: the withdrawn §5 asked the learner to solve the tactic, which
`design/00-thesis.md:70,93-94` rejects.


**Exploration gate opened by owner ruling 2026-08-12** (logged in
`planning/exploration/log.md`): E1 met, E2 advisory, E3/E4/E5 accepted as in-flight
risk with their experiments folded into implementation. Previously: The repo is in the exploratory phase.
The first experimental vertical-slice RFC may be drafted only after the
exploration-to-slice gate in `planning/exploration/gates.md` passes, or an owner ruling
(logged in `planning/exploration/log.md`) opens it early. Product RFCs remain closed until
the slice passes the later continuation gates. See the "Exploration gate" section of
`0000-rfc-process.md`.

**Breadth sequencing ruling, 2026-08-11:** the owner opened design and RFC
planning for the complete B1–B8 product surface in
`design/03-product-breadth.md`. This does not waive RFC review or authorize
unspecified implementation; it supersedes the assumption that the next work is
content for one narrow slice. Breadth RFCs must preserve the global shell and
name the B-gates they complete before code begins.

## Migration register

Instituted 2026-08-12 after two RFCs drafted in parallel both claimed database
migration 2 and `STORAGE_VERSION` 1→2, so neither could land independently. A
migration number is a **shared, single-writer resource**; claim it here before
writing it into a draft.

| Migration | `STORAGE_VERSION` | Owner RFC | Status |
|---|---|---|---|
| 1 | 0→1 | shipped | implemented; **body** rewritten by `archive/pack-optional-runs.md` §8 to stop replaying through `projectRun` (no version change, no new number) |
| 2 | 1→2 | `archive/learner-identity-and-authorization.md` | implemented |
| 3 | 2→3 | `archive/pack-optional-runs.md` | implemented after migration 2 |
| 4 | 3→4 | `archive/terminal-outcome-events.md` | implemented; upgrades ordinary v0.5 snapshots and quarantines pre-producer outcome events. Its body is frozen to literal `"0.6"` by `archive/line-drill-theory-grading.md` §11b so later schema constants cannot mis-stamp rows before migration 5 |
| 5 | 4→5 | `archive/line-drill-theory-grading.md` | implemented — run schema v0.7; adds `policyModeApplied` to `opponent.move_selected.selection`, historical selections migrate to `unknown` and are never inferred |
| 6 | 5→6 | `archive/return-and-progression.md` | implemented — attempts, schedules, progress and position statistics; create-table/index plus one-time backfill |
| 7 | 6→7 | `archive/pack-studio.md` | implemented — studio drafts, retained playtest bytes, and registered packs |
| 8 | 7→8 | `archive/n-way-comparison.md` | implemented — run schema v0.8, branch origin and prediction event |
| 9 | 8→9 | `archive/live-session-platform.md` | implemented — live-session tables; create-table/index only |
| 10 | 9→10 | `archive/shape-library.md` | implemented — `shape_drafts` and `registered_shapes`; create-table/index plus the pack-style account-deletion tombstone. Run schema stays 0.8 by design (firings are derived projections, never events) |
| 11 | 10→11 | `archive/branch-groups.md` | implemented — run schema v0.9: adds the `group.created` event and widens `policyModeApplied` with `enumerated`. Stamp-only body (frozen literals `"0.8"`→`"0.9"`, no data rewrite exists to do); mandatory because reads filter on the current run-schema version |
| 12 | 11→12 | `archive/game-import-and-story.md` | implemented — run schema v0.10: `sessionKind` gains `imported` (non-pack projection rules unchanged). Creates `imported_games` (one row per imported run: source kind/url, movetext digest, headers, original PGN bytes, licence note) plus the pack-style account-deletion tombstone, and stamps frozen literals `"0.9"`→`"0.10"` (no data rewrite). Landed behind implemented migration 11 |
| 13 | 12→13 | `archive/adoption-wave-1.md` | implemented — creates `public_tokens` + `run_derivations`; literal CHECK strings per the migration-9 freeze lesson |
| 14 | 13→14 | `social-match.md` | implementing — creates `match_states`; rebuilds `live_sessions`, `session_journal`, and `public_tokens` with widened closed vocabularies; no run/pack schema change. Lands behind implemented migration 13 |

A migration's *number* is the shared resource, but its *body* is shared too: an
already-applied migration still runs on databases that never reached it, so a
schema change can break a migration it did not touch. Record body edits here as
well.

**F3 landed before F2**, decided 2026-08-12 on three grounds: D1 was a
live defect (a run link is a write credential) and the deployment ruling is
hosted multi-user, so identity is a prerequisite to exposing anything at all;
F2's v0.4 snapshot quarantine is simpler to write once ownership columns exist
than the reverse; and F2 is the riskier change (`RunService.create` becomes
async across ~15 call sites), so it should not also carry the migration that
another draft depends on. F2 therefore rebased its migration to 3 and recorded
the dependency explicitly.

Any RFC touching persisted shape adds its row here in the same commit that
drafts the migration.

## Cross-draft ownership pins

Instituted 2026-08-14 after `archive/shape-library.md` and `adaptive-guidance.md`, drafted in
parallel, **both** scoped the minimal Just Play position player — the register-collision
class on an implementation surface instead of a number. Pin: **`archive/shape-library.md` owns the
position player** (it scoped it concretely as its largest surface, and its acceptance test
cannot exist without it); `adaptive-guidance.md` names it in `Depends on:` and ships no
client entry of its own. Landing order follows: shape-library before adaptive-guidance.

Pin, 2026-08-14 (parallel wave): **`archive/adoption-wave-1.md` owns the `public_tokens` table** —
the single trust surface for anonymous capability tokens (hashed 32-byte tokens, closed
typed `scope` CHECK, per-token revocation, uniform 404 non-disclosure, creator-cascade
deletion). The `social-match` draft (friend-link tokens, same trust surface) adds its
scopes by widening the CHECK in its own migration, names `archive/adoption-wave-1.md` in
`Depends on:`, and creates no second token table.

## Withdrawn

Kept for the record (RFC-0000: `withdrawn` = abandoned, not superseded). Their
findings are salvaged into content-era BACKLOG rows — read the withdrawal notes
before re-attempting this territory.

| RFC | Why |
|---|---|
| `withdrawn/authoring-contracts-v03.md` | Specified an authored vocabulary with no authored content to design against; three reviews, three variations of that fault |
| `withdrawn/evidence-composer.md` | Prerequisite withdrawn; the packet abstraction proved unnecessary for v1 |

## Archive

| RFC | Status | Canonical docs link |
|---|---|---|
| `archive/branch-runtime.md` | implemented | `docs/branch-runtime.md` |
| `archive/drill-pack-format.md` | implemented | `docs/drill-pack-format.md` |
| `archive/engine-workers.md` | implemented | `docs/engine-workers.md` |
| `archive/drill-client.md` | implemented | `docs/drill-client.md` |
| `archive/app-shell.md` | implemented | `docs/app-shell.md` |
| `archive/explanation-grounds.md` | implemented | `docs/explanation-grounds.md` |
| `archive/authored-feedback-delivery.md` | implemented | `docs/drill-client.md`, `docs/drill-pack-format.md` |
| `archive/authored-explanation-surface.md` | implemented | `docs/explanation-grounds.md` |
| `archive/learner-identity-and-authorization.md` | implemented | `docs/identity-and-authorization.md`, `docs/branch-runtime.md` |
| `archive/pack-optional-runs.md` | implemented | `docs/branch-runtime.md`, `docs/drill-client.md` |
| `archive/terminal-outcome-events.md` | implemented | `docs/branch-runtime.md`, `docs/drill-client.md`, `docs/explanation-grounds.md` |
| `archive/content-sourcing-foundation.md` | implemented | `docs/content-sourcing.md` |
| `archive/content-sourcing-syzygy.md` | implemented | `docs/content-sourcing.md` |
| `archive/content-sourcing-explorer.md` | implemented | `docs/content-sourcing.md` |
| `archive/content-sourcing-position-seeds.md` | implemented | `docs/content-sourcing.md` |
| `archive/outcome-drill-grading.md` | implemented | `docs/outcome-drill-grading.md`, `docs/drill-pack-format.md`, `docs/branch-runtime.md`, `docs/drill-client.md`, `docs/content-sourcing.md` |
| `archive/line-drill-theory-grading.md` | implemented | `docs/drill-pack-format.md`, `docs/branch-runtime.md`, `docs/engine-workers.md`, `docs/drill-client.md`, `docs/explanation-grounds.md`, `docs/outcome-drill-grading.md` |
| `archive/defect-sweep.md` | implemented | `docs/drill-pack-format.md`, `docs/drill-client.md`, `docs/engine-workers.md`, `docs/development.md`, `docs/content-sourcing.md`, `docs/outcome-drill-grading.md` |
| `archive/return-and-progression.md` | implemented | `docs/return-and-progression.md`, `docs/drill-pack-format.md`, `docs/app-shell.md` |
| `archive/trajectory-drill.md` | implemented | `docs/trajectory-drill.md`, `docs/drill-pack-format.md`, `docs/branch-runtime.md`, `docs/drill-client.md` |
| `archive/pack-studio.md` | implemented | `docs/pack-studio.md`, `docs/drill-pack-format.md`, `docs/app-shell.md` |
| `archive/n-way-comparison.md` | implemented | `docs/n-way-comparison.md`, `docs/branch-runtime.md`, `docs/explanation-grounds.md`, `docs/drill-pack-format.md` |
| `archive/live-session-platform.md` | implemented | `docs/live-sessions.md`, `docs/identity-and-authorization.md`, `docs/app-shell.md` |
| `archive/shape-library.md` | implemented | `docs/shape-library.md`, `docs/drill-pack-format.md`, `docs/drill-client.md`, `docs/pack-studio.md` |
| `archive/adaptive-guidance.md` | implemented | `docs/adaptive-guidance.md`, `docs/explanation-grounds.md`, `docs/app-shell.md` |
| `archive/defect-batch-2.md` | implemented | `docs/branch-runtime.md`, `docs/drill-pack-format.md`, `docs/structural-reading.md` |
| `archive/branch-groups.md` | implemented | `docs/branch-groups.md`, `docs/branch-runtime.md`, `docs/engine-workers.md`, `docs/drill-client.md` |
| `archive/game-import-and-story.md` | implemented | `docs/game-import-and-story.md`, `docs/branch-runtime.md` |
| `archive/predicate-wave-2.md` | implemented | `docs/structural-reading.md`, `docs/drill-pack-format.md`, `docs/shape-library.md`, `docs/explanation-grounds.md` |
| `archive/runtime-corpus-evidence.md` | implemented | `docs/runtime-corpus-evidence.md`, `docs/adaptive-guidance.md`, `docs/explanation-grounds.md`, `docs/branch-groups.md` |
| `archive/adoption-wave-1.md` | implemented | `docs/adoption-wave-1.md`, `docs/game-import-and-story.md`, `docs/adaptive-guidance.md`, `docs/return-and-progression.md`, `docs/live-sessions.md` |

## The archive sketches are quarry, not RFCs

`archive/brief-v2/rfcs/RFC-0001..0008` and `archive/brief-v2/adrs/ADR-0001..0006` are
pre-validation decision sketches from the brief. They are design-tier material: future
real RFCs mine them for content and cite them, but nothing in `archive/` has RFC status.
Their topics are tracked as rows in `design/BACKLOG.md`; the ADR decisions are tracked
in that file's Provisional decisions table with revisit triggers.

## Deferred decisions register

Decisions deliberately punted, each with a named owner so defaults are not chosen
silently later.

| Deferred decision | Origin | Owner | Why it matters |
|---|---|---|---|
| Server language | ✅ resolved 2026-08-12: **TS core + Go workers** doctrine (chess-semantics code is TS/shared runtime; self-contained data-format workers are Go; Python only inside Maia sidecar containers) | — | `design/research/stack-selection.md` |
| Client framework | ✅ resolved 2026-08-12: **Svelte 5** + Vite | — | `design/research/stack-selection.md` |
| Client routing | ✅ resolved 2026-08-11: **hand-rolled history-API router** (~100 lines); no SvelteKit migration, no routing dependency | — | `rfc/archive/app-shell.md` AS-C5 |
| SQLite vs PostgreSQL for runs/branches | ✅ resolved 2026-08-12: **SQLite ratified**. PostgreSQL remains a bounded follow-up for multi-host deployment or demonstrated write contention. Ruling and proposal: `planning/archive/branch-runtime/log.md` | — | `docs/branch-runtime.md` |
| Source model, deployment, monetization, and content/data rights | exploration Q2 | Marco | Gates public release; GPL/AGPL obligations constrain combinations but do not prohibit charging |
