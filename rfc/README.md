# RFC index

Process: `rfc/0000-rfc-process.md`. Template: `rfc/template.md`.

## Active

| RFC | Status | Parent | Implementation |
|---|---|---|---|
| `0000-rfc-process.md` | accepted | — | process |
| `defect-sweep.md` | draft | `archive/drill-pack-format.md`, `archive/drill-client.md`, `archive/engine-workers.md` | closes D4, D5, D6, D8, D9, D10; pack schema 0.4 → 0.5; **no migration** |
| `n-way-comparison.md` | draft | `archive/branch-runtime.md`, `archive/explanation-grounds.md`, `archive/drill-client.md` | breadth program **#5**, gate **B3** — single-axis N-way comparison payload, manual N-branch selection, per-branch consequence rows, resulting-position grid / N-column strips / narrative mode, branch-selective export, simulate (scratch until entered), prediction checkpoints that show numbers and never a verdict, deep analysis. Run schema 0.7 → 0.8, migration **6**; pack schema 0.8 → **0.9** (`grading` removed) |
| `trajectory-drill.md` | draft | `archive/drill-pack-format.md`, `archive/line-drill-theory-grading.md`, `archive/outcome-drill-grading.md`, `archive/branch-runtime.md` | breadth program **#4**, closes the last **B2** row — Trajectory Drill as one run with authored legs, objective replacement instead of the absorbing `transitioned`, causal provenance from the run's own move history, organic/guided split, no trajectory aggregate. Pack schema 0.6 → **0.7**, **no migration** |
| `live-session-platform.md` | draft | `archive/learner-identity-and-authorization.md` (F3), `archive/pack-optional-runs.md` (F2) | breadth program **#8**, gate **B5** — live session aggregate above the run, board control and handoff, possession journal, participant proposals, chat-vote windows, overlay projection, Position Arena two-leg PGN import as root-forked branches of one run. Opens and closes D17, D18, D19. **Run schema unchanged**, migration **7** |
| `return-and-progression.md` | draft | `archive/drill-pack-format.md`, `archive/learner-identity-and-authorization.md` (F3), `defect-sweep.md` | breadth program **#7**, gate **B7** — the attempt (a branch of a run) as the scheduled unit, durable attempt records, the blocked-vs-varied trigger, the first `transfer.scheduled` producer, `POST /runs/:id/duplicate`, `/learn` and progress display, related-position retrieval, opt-in history recommender, and the two unfalsifiable success metrics turned into queries. **Run schema unchanged**, migration **8**, pack schema 0.5 → 0.6 |
| `pack-studio.md` | draft | `archive/drill-pack-format.md`, `defect-sweep.md`, `archive/content-sourcing-foundation.md` | breadth program **#6**, gate **B6**'s remaining half — pack write path and its safety invariants, `/create` studio, session distillation, PGN/candidate/interchange imports, versioning, export, and the **publication channel** (official = git/image, community = studio) that replaces the struck review gate. Closes **D20**, the latent superseded-digest defect in `service.ts:621-625`. **Run schema unchanged**, migration **9**, pack schema 0.7 → **0.8** (`planClassId`; `provenance.reviewStatus` narrowed, `provenance.reviewers` removed) |

`defect-sweep.md` claims **no migration number**: nothing it changes is persisted,
and its §Migration states the check rather than omitting the question.

`n-way-comparison.md` and `defect-sweep.md` are independent and may land in either
order: the first changes only run-persisted shape, the second only pack shape.
`n-way-comparison.md` takes D4 and D9 as inbound from `defect-sweep.md` and
re-claims neither.

`return-and-progression.md` is ordered behind `defect-sweep.md` and independent of the
other two. It takes D6 as inbound (its `/learn` phase filter *consumes* the
`PackSummary.phase` the sweep adds and does not re-add it) and reuses the sweep's shared
vocabulary-constant mechanism for `retryVariants` instead of creating a seventh copy of a
vocabulary. **The pack schema version is a shared single-writer resource too**, for the
same reason a migration number is: the sweep claims **0.5**, this draft claims **0.6** and
names it in `Depends on:` rather than making its own version conditional on landing order.
Claim the next pack version here whenever a draft narrows or widens
`schemas/drill_pack.schema.json`. Against `n-way-comparison.md` and
`live-session-platform.md` it is ordered, not coupled: it changes no run-persisted shape and
its DDL appends after 7.

`trajectory-drill.md` closes the last **B2** row and is independent of all four. It changes
no run-persisted shape and claims **no migration number**. It cites `defect-sweep.md` as the
owner of D4, D5, D6, D8, D9 and D10 and duplicates none of those fixes; its only inbound is
the sweep's required `start.side`, which its fixture already declares. Against
`n-way-comparison.md` it is a producer, not a competitor: a trajectory's legs are spans of one
path, so its branches are ordinary inputs to N-way comparison. It **rebased its pack schema
claim to 0.7** after finding 0.6 claimed twice — see the register below.

`live-session-platform.md` is independent of both. It cites all six of
`defect-sweep.md`'s defects and duplicates none of its fixes; the only shared shape is
D4, where the sweep collapses the four *pack* vocabularies and the live draft collapses
`RunRole`, which the sweep's scope does not reach — whichever lands first supplies the
constant module the other reuses. Against `n-way-comparison.md` it is ordered, not
coupled: it rebased to migration **7** and changes no run-persisted shape, so its DDL
appends after 6 without depending on anything 6 does. Its Arena leg import produces
ordinary root-forked branches, which are inputs to N-way comparison rather than a
competing mechanism.

`pack-studio.md` (renamed from `pack-studio-and-review.md` on 2026-08-13) closes gate
**B6**'s remaining half and is ordered behind `defect-sweep.md`, independent of the rest. It
re-claims none of the sweep's fixes: it takes D6, D8 and D9 as inbound registration-gate
conditions its write path inherits rather than restates, and its §0 gives the exact swap if
the sweep does not land first. It **resolved the 0.6 contention by rebasing to 0.8** rather
than merging bumps with `return-and-progression.md`. Against `n-way-comparison.md` it is a
consumer: `Branch.origin` is what stops session distillation turning a promoted simulated
branch into a manufactured deviation. Against `live-session-platform.md` it is ordered only —
that draft's "session distilled into a pack" promise is satisfied by this draft's
`seed.kind: "run"`, and neither writes the other's tables.

**The owner ruling of 2026-08-13 removed this draft's review half entirely** — there is no
pack review workflow and there never will be one, because a status nobody can grant implies a
check that never happened. The draft's queue, `TABIYA_REVIEWERS` roster, sign-off checklist,
`draft → in_review → approved` state machine and `review.json` sidecar are struck, and its
single open question (the roster's shape) is closed by removal. What replaces the gate is a
**publication channel**: official packs ship in git or the image, community packs are
published through the studio, and the seed-id reservation that was a collision guard is now
the channel boundary itself. `provenance.reviewStatus` is narrowed to
`schema_example | draft | published` and `provenance.reviewers` is removed, both at pack
schema 0.8; `pack-validation.ts`'s `GRADUATION_REQUIRES_SOURCES` survives re-keyed on
`published` and `GRADUATION_REQUIRES_REVIEWERS` is deleted. ADR-0001's "reviewed" half is
superseded and continuation gate C1 is withdrawn.

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
| 0.5 | `defect-sweep.md` | **claimed 2026-08-13, draft** — required `start.side`, vocabulary-constant collapse |
| 0.6 | `return-and-progression.md` | **claimed 2026-08-13, draft** — `retryVariants`, typed `concepts`. Contention with `pack-studio.md` **resolved 2026-08-13**: that draft rebased to 0.8 rather than merging the two bumps, which would have coupled scheduling vocabulary and review metadata into one version meaning "whichever landed" |
| 0.7 | `trajectory-drill.md` | **claimed 2026-08-13, draft** — `legs`, `run_trajectory`. Rebased from 0.5 to 0.7 rather than joining the contention; the number is load-bearing for nothing in that RFC |
| 0.8 | `pack-studio.md` | **claimed 2026-08-13, draft** — optional `deviations[].planClassId` (additive); `provenance.reviewStatus` narrowed to `schema_example \| draft \| published`; `provenance.reviewers` removed. Rebased 0.6 → 0.7 → 0.8 as the contention resolved and `trajectory-drill.md` took 0.7. No committed pack's bytes or digest change: nothing in the tree declares `reviewed`, and `provenance.additionalProperties` is `true`, so an existing `"reviewers": []` still validates as untyped extra metadata |
| 0.9 | `n-way-comparison.md` | **claimed 2026-08-13, draft** — `grading` removed from `$defs/checkpointInteraction` after the owner ruled that prediction checkpoints show numbers and never a verdict. `schemas/drill_pack.example.json`'s digest changes with it; no other committed document declares a prediction interaction |

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

## Pack schema register

Instituted 2026-08-13 after **three** drafts written in parallel each claimed a
pack-schema version — the same collision the migration register was created to
prevent, one layer over. A pack-schema version is a **shared single-writer
resource**; claim it here before writing it into a draft.

| Pack schema | Owner RFC | Change | Status |
|---|---|---|---|
| 0.4 | shipped | current | implemented |
| 0.5 | `defect-sweep.md` | `start.side` required; `immediate_blunder_guard` removed | draft |
| 0.6 | `return-and-progression.md` | `retryVariants`; `concepts` typed | draft |
| 0.7 | `trajectory-drill.md` | `legs` | draft |
| 0.8 | `pack-studio.md` | `deviations[].planClassId`; `provenance.reviewStatus` narrowed; `provenance.reviewers` removed | draft |
| 0.9 | `n-way-comparison.md` | `grading` removed from `$defs/checkpointInteraction` | draft — **rebase done 2026-08-13**. The `0.8` in its §10 and R3/R4 was the *run* schema and was always correct; the draft carried no pack-schema claim at all until the prediction ruling removed `grading`, and it now takes 0.9 explicitly (its §8.0, §10, §12) |

Landing order follows the numbers. A draft that cannot land behind its
predecessor must renegotiate here rather than renumber unilaterally.

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
| 6 | 5→6 | `n-way-comparison.md` | **claimed 2026-08-13, draft** — run schema v0.8; adds `Branch.origin` (`"played" \| "simulated"`) and the `prediction.recorded` event. Body backfills `origin: "played"` on every branch of every v0.7 snapshot; the new event type needs no backfill. Both literals (`"played"`, `"0.8"`) are frozen in the body rather than read from the schema constant, following migration 4's freeze rule, so a later bump cannot mis-stamp rows before migration 7. **Unchanged by the 2026-08-13 scratch ruling**: simulated branches are now scratch until promoted, which changes who writes `"simulated"` and not whether `origin` exists, so the backfill is still mandatory — skipping it would leave `origin` undefined on every historical branch |
| 7 | 6→7 | `live-session-platform.md` | **claimed 2026-08-13, draft** — the live-session layer: `live_sessions`, `session_journal`, `session_proposals`, `session_vote_windows`, `session_votes`, `session_invitations`, `arena_legs`. **Create-table only.** It backfills nothing, reads no run snapshot, rewrites no `drill_runs` row, and leaves `DRILL_RUN_SCHEMA_VERSION` untouched, so it cannot mis-stamp anything and needs no freeze rule. Rebased from 6 when `n-way-comparison.md` claimed it; if that draft is withdrawn before landing, this rebases to 6 rather than leaving a hole |
| 8 | 7→8 | `return-and-progression.md` | **claimed 2026-08-13, draft** — the progress projection: `attempts`, `attempt_concepts`, `schedules`, `learner_position_stats`, `progress_meta`. **Create-table and create-index only.** It reads no run snapshot, calls no runtime function, rewrites no `drill_runs` row, and leaves `DRILL_RUN_SCHEMA_VERSION` untouched, so it needs no freeze rule; backfill is an application-level pass at startup, deliberately outside the migration body because migration 1's body had to be rewritten to stop replaying through `projectRun`. Rebased from 6 to 8 as `n-way-comparison.md` and `live-session-platform.md` claimed 6 and 7; if either is withdrawn before landing, this rebases downward rather than leaving a hole |
| 9 | 8→9 | `pack-studio.md` | **claimed 2026-08-13, draft** — the studio layer: `pack_drafts` and `registered_packs`. **Create-table and create-index only.** It backfills nothing (no prior state exists), reads no run snapshot, rewrites no `drill_runs` row, and leaves `DRILL_RUN_SCHEMA_VERSION` untouched, so it needs no freeze rule. It does extend `deleteLearner` to withdraw a deleted learner's non-registered drafts; `registered_packs` rows including `publisher_handle` are untouched, because a published pack's origin must not be erasable by deleting an account. **Body narrowed 2026-08-13** by the no-review ruling: `pack_reviews` and `pack_review_items` are gone, `registered_packs.review_id` is replaced by `publisher_handle`, and the draft-state CHECK is `('draft','registered','withdrawn')`. Rebased from 6 as 6, 7 and 8 were claimed; if any is withdrawn before landing, this rebases downward rather than leaving a hole |

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
