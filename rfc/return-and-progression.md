# RFC: Return and progression — attempt records, the due model, and `/learn`

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-13
- **Design refs:** `design/01-training-model.md` §Vocabulary, §Repetition scheduling;
  `design/03-product-breadth.md` §Learn and return (`:69-76`), B7 row (`:167`)
- **Exploration gate:** owner ruling 2026-08-12 opening the exploration gate
  (`rfc/README.md:58-65`); breadth sequencing ruling 2026-08-11 (`rfc/README.md:67-72`)
- **Depends on:** `archive/learner-identity-and-authorization.md` (the learner subject),
  `archive/pack-optional-runs.md` (position sessions), `archive/terminal-outcome-events.md`
  (`outcome.reached` producer), `archive/outcome-drill-grading.md` and
  `archive/line-drill-theory-grading.md` (objective rules that make an attempt resolvable),
  and the concurrent draft **`defect-sweep.md`** — it closes D6 (`PackSummary` gains
  `phase`, which `/learn`'s phase filter reads), establishes the shared
  vocabulary-constant mechanism this RFC reuses for `retryVariants`, and claims pack schema
  v0.5. This RFC ships after it and takes v0.6.
- **Parent / amends:** amends the pack format shipped by `archive/drill-pack-format.md`
  (v0.5 → v0.6, `retryVariants` only); amends nothing in the run event schema
- **Supersedes / superseded by:** —
- **Planning:** `planning/return-and-progression/` (once implementing)
- **Migration:** 8 (`STORAGE_VERSION` 7→8), claimed in `rfc/README.md` §Migration register.
  Rebased from 6 as `n-way-comparison.md` and `live-session-platform.md` claimed 6 and 7;
  neither is a dependency, since this RFC's DDL is create-only and touches no run shape.

## Summary

This RFC specifies program item #7 (gate B7): the product's answer to "why would you open
this on Tuesday?" It pins the schedulable unit to **the attempt, which in the runtime is a
branch of a run**, records one durable row per attempt in a sibling projection store behind
migration 8, derives blocked and varied repetition from those rows with a stated trigger,
gives `transfer.scheduled` its first producer, adds `POST /runs/:id/duplicate`, ships
`/learn` as a real surface over due work and recorded attempts, and adds an opt-in
personal-history recommender that is additive by construction. It also makes the two
success metrics that `planning/exploration/gates.md:149-160` records as unfalsifiable into
queries that return rows.

It does **not** build a cross-pack concept registry. §3 states that call and its cost.

## Motivation

### 1. Re-verification: nine corrections to the record

The planning decomposition for this gate (`planning/breadth/create-and-return.md` Part B)
was written before twelve RFCs landed. Every claim below was re-verified against the tree
at the date of this draft. Nine are corrections, and three of them change the design.

| # | Record says | Verified state |
|---|---|---|
| 1 | "`GET /runs` returns every run in the database" (`create-and-return.md:257`) | **Wrong now.** `list` joins `run_grants` on the calling learner (`apps/server/src/storage.ts:429-440`) and `RunService.runs` passes `principal.learnerId` (`apps/server/src/service.ts:355-362`). History is learner-scoped. |
| 2 | "there is no learner. Also no learner/user identity on the server" (`:246`, `:260`) | **Wrong now.** `learners`, `learner_sessions`, `run_grants` ship (`storage.ts:991-1032`), `drill_runs` carries `owner_learner_id` and `active_writer_learner_id` (`storage.ts:1017-1018`), and every request resolves a `Principal` (`apps/server/src/authorization.ts:11-14`, `rest.ts:461-467`). |
| 3 | "`outcome.reached` … has no producer" (`:263`) | **Wrong now.** `commitMove` emits it on terminal detection (`packages/runtime/src/runtime.ts:337-343`), and `projectRun` validates it against a recomputed terminal outcome (`packages/runtime/src/events.ts:163-186`). |
| 4 | "**Second storage table of any kind** — no … `STORAGE_VERSION = 1`" (`:250`) | **Wrong now.** Four tables, `STORAGE_VERSION = 5` (`storage.ts:147`), five migrations (`storage.ts:915-941`). |
| 5 | The unit of scheduling is the **checkpoint-bounded segment** (`:270-284`) | **Refuted by shipped code** — see §1 below. Three of the eight registered packs can never produce a segment. |
| 6 | "`transfer.scheduled` … no producer" (`:243`) | **Still true.** `grep -rn "transfer.scheduled"` over `apps packages schemas` returns the type (`packages/runtime/src/types.ts:197-200`), the schema branch (`schemas/drill_run.schema.json:558-571`), and the projection no-op (`packages/runtime/src/events.ts:187-190`). Nothing emits it. |
| 7 | "`concepts` … the only app-code occurrence is a test asserting it is not projected" (`:244`) | **Still true**, and worse than stated: `concepts` does not appear in `packages/schema/src/drill-pack/types.ts` at all. It is reachable only through the `[key: string]: unknown` index signature at `types.ts:101`. |
| 8 | `gates.md:157-159`: "Pack A declares no `objective.successConditions`, so its objective can never transition" | **Wrong now.** `objectiveRules` builds rules for `follow_theory` packs from `offObjective` deviations and the authored-boundary checkpoint (`apps/server/src/pack-orchestrator.ts:171-211`). `content/drafts/anti-caro-advance.json` has one `offObjective` deviation and the `past-the-book` boundary checkpoint, so it resolves to `degraded` or `preserved`. Pack A is gradable. |
| 9 | D6 "`phase` never reaches the client" (`design/BACKLOG.md:132`) | **Half-closed, and the other half is already owned.** `projectPackDocument` sends `phase` for a single pack (`apps/server/src/pack-registry.ts:68`); `PackSummary` still omits it (`pack-registry.ts:26-34`, mirrored at `apps/web/src/lib/api.ts:16-24`). The concurrent `defect-sweep.md` draft §4 closes exactly that. `/learn`'s phase filter **consumes** the field it adds; this RFC does not also write it. |

Citation drift in the source document is real and this RFC does not inherit it: for example
`SUPPORTED_CHECKPOINT_ACTIONS` is at `pack-validation.ts:18`, not `:11`; `deriveSegments`
is at `events.ts:226-248`, not `:167-189`; `drill_runs` is created at `storage.ts:310-317`,
not `:177-184`. Every `file:line` in this RFC was read, not copied.

### 2. What does not exist

Verified absent, with the grep that proves it:

- **Any progress, mastery, SRS or due state.** `grep -rniE "srs|spaced|dueAt|nextDue|easeFactor|mastery|attemptNo" apps packages --include="*.ts" --include="*.svelte"` returns only interval timers. The word "progress" occurs in application code once, in the `/learn` empty-state copy (`apps/web/src/App.svelte:348-350`).
- **Run duplicate.** The run subroute grammar is a closed regex: `moves|rewind|fork|graph|compare|events|evidence|authored-feedback|pgn|grants|lease|reveal` (`apps/server/src/rest.ts:394`).
- **A `/learn` surface.** The route is reserved (`apps/web/src/lib/router.ts:22`), the shell renders an honest empty state (`App.svelte:341-352`), the server reports `learn: "unavailable-here"` (`apps/server/src/capabilities.ts:122`), and the client marks it planned (`apps/web/src/lib/api.ts:170-176`).
- **Related-position retry.** `transposeKey` exists and is stored on every node (`packages/runtime/src/chess.ts:16-19`, `packages/runtime/src/types.ts:89`); nothing queries across runs.
- **Any personal-history import.** No production module imports `chessops/pgn`; it appears only in `packages/runtime/src/{pgn,pack-pgn,invariants,vertical-scenario}.test.ts` and `apps/server/src/drill-client-server.test.ts`.

### 3. Scope boundary

In: the attempt record, the progress store, the due model and its trigger, run duplicate,
the `transfer.scheduled` producer, related-position retrieval, `/learn`, progress display,
the optional recommender, and the two metric queries.

Out, with reasons that are rulings rather than preferences:

- **A cross-pack concept registry.** `design/01-training-model.md:62-65` rules that the
  registry "is an authoring contract and belongs with the pack studio, not with the
  scheduler". §3 of the specification says what B7 does instead and what it costs.
- **Phase as a scheduling input.** `design/01-training-model.md:66-70` forbids it. Phase
  appears in this RFC exactly once, as a discovery filter on `/learn`.
- **Per-move learner attribution.** A run can have several granted writers
  (`storage.ts:744-756`), but no run event records *which* learner moved: `move.committed`
  carries a `Node` whose only actor field is `user | opponent | system`
  (`packages/runtime/src/types.ts:3`, `:93`). Attempts therefore attribute to the run's
  `owner_learner_id`. Changing that is a run-schema change, and this RFC does not make one.

## Specification

### 1. The attempt is a branch of a run

`design/01-training-model.md:36-39` rules: "in the runtime an attempt **is a branch of a
run**." Verified against shipped types, that ruling is exactly implementable and the
planning document's alternative is not.

**The pin.** An attempt is a `Branch` (`packages/runtime/src/types.ts:102-108`):

```ts
export interface Branch {
  readonly id: string;
  readonly forkNodeId: string;
  readonly label: string;
  readonly intent?: string;
  readonly seed: number;
}
```

Every run has at least one: `createRun` seeds `branches: [branch]` with `label: "main"` and
`forkNodeId` equal to the root node (`packages/runtime/src/runtime.ts:189-194`). Retrying
after a rewind creates another one automatically — `commitMove` forks when the cursor node
already has children and the current branch is not empty at the cursor
(`runtime.ts:292-299`, using `branchIsEmptyAtCursor` at `:130-138`). So "try that again"
already produces a new attempt without any new vocabulary.

**Why not the checkpoint-bounded segment.** `deriveSegments` pairs *consecutive*
`checkpoint.reached` events on the same branch and emits nothing for the first one
(`packages/runtime/src/events.ts:226-248`); `reachCheckpoint` only emits
`segment.completed` when a previous checkpoint exists on that branch (`runtime.ts:448-466`).
The pack schema requires `checkpoints` `minItems: 1` (`schemas/drill_pack.schema.json:44-48`),
and three of the eight packs the server registers declare exactly one:
`outcome-hold.browser.json`, `outcome-resist.browser.json`, and the browser fixture
`schemas/fixtures/drill-pack/terminal-outcome.browser.json`. `outcome-grading.test.ts:133`
asserts, for a complete graded run, that no `segment.completed` event exists at all. A unit
that records nothing for the packs that actually resolve is not a unit. Segments remain what
they are today — the delivery boundary for authored feedback
(`apps/server/src/authored-feedback.ts:168-183`).

**Attempt identity.** An attempt is a *thing attempted*. Its identity is the **root key**:

```
rootKey = `${sessionKind}|${packId ?? ""}|${rootTransposeKey}`
rootTransposeKey = node(branch.forkNodeId).transposeKey
```

`transposeKey` is the first four FEN fields of the canonical FEN
(`packages/runtime/src/chess.ts:16-19`), stored on every node (`types.ts:89`), so the key is
stable across runs and across packs. For the main branch the fork node is the run root, so
two runs of the same pack share a root key. For a mid-line retry branch the fork node is
deeper, so it is an attempt at a *different* thing — which is correct: rewinding to a
checkpoint and choosing differently is an attempt at that decision, not at the pack.

`packId` is part of the key; `packDigest` is **not**. Keying on the digest would fragment a
learner's history on every authoring edit. The digest is recorded per attempt instead, so an
edit is visible rather than conflated — the same reasoning that makes the stale-digest
rejection at `service.ts:170-172` sound.

**Countability.** An attempt is *countable* when at least one node on its branch has
`actor: "user"`. The root node is `actor: "system"` (`runtime.ts:182`) and opponent plies are
`actor: "opponent"`, so a run that has been opened but not played, and a branch forked but
never moved in, both record an attempt row with `countable = 0`. Uncountable attempts are
displayed but never schedule anything.

**Verdict.** The attempt's tip is the branch node with the greatest `ply` (nodes on one
branch form a path, so the tip is unique); a branch with no nodes uses its fork node. The
verdict maps the tip's `objectiveState` (`packages/runtime/src/types.ts:4-10`):

| `objectiveState` | verdict | rationale |
|---|---|---|
| `achieved`, `preserved`, `transitioned` | `stable` | all three are absorbing resolutions (`packages/runtime/src/objective-state.ts:4-10`) |
| `degraded`, `failed` | `unstable` | |
| `active` | `open` | the attempt never resolved |

**A result is not a verdict.** `outcome.reached` records `win | loss | draw`
(`types.ts:193-196`) and is recorded on the attempt row, but it never produces a verdict on
its own. The `resist` fixture grades a terminal **loss** as `achieved` — the browser suite
asserts exactly that (`tests/browser/drill.spec.ts:72-76`). Inferring "loss ⇒ failure" would
be manufacturing chess truth from a rules fact, which ADR-0005 forbids.

**Gradability.** An attempt is `graded` when `objectiveRules(pack).length > 0`
(`apps/server/src/pack-orchestrator.ts:167-276`) — the shipped function, not a new
predicate. Position sessions (`sessionKind: "position"`) have no pack and are never graded.
Verified over the registered packs: `anti-caro-advance` ✓, `line-boundary.browser` ✓,
`outcome-hold.browser` ✓, `outcome-resist.browser` ✓, `rook-4v3-same-side` ✓,
`drill_pack.example` ✓, `carlsbad-minority-attack` ✗ (its two `offObjective` deviations are
inert because that rule path is `follow_theory`-only, `pack-orchestrator.ts:171-211`),
`terminal-outcome.browser` ✗. Ungraded attempts always have verdict `open` and are handled
explicitly in §7 — otherwise blocked repetition loops forever on a pack that cannot resolve.

### 2. Attempt records

One row per `(runId, branchId)`, derived entirely from the run projection plus the pack:

| Column | Source |
|---|---|
| `run_id`, `branch_id` | `Branch.id` |
| `learner_id` | `drill_runs.owner_learner_id` (see §Scope boundary) |
| `session_kind`, `pack_id`, `pack_digest` | `run.sessionKind`, `run.packId`, `run.packDigest` |
| `root_node_id`, `root_transpose_key`, `root_key` | `node(branch.forkNodeId)` |
| `branch_label`, `branch_intent`, `branch_seed` | `Branch` |
| `attempt_no` | ordinal of this attempt among the learner's countable attempts at `root_key`, ordered by `started_at`, ties broken by `run_id`, then `branch_id` |
| `countable` | ≥1 node with `actor = "user"` on the branch |
| `graded` | `objectiveRules(pack).length > 0` |
| `objective_state`, `verdict` | tip node, §1 |
| `result` | `outcome.reached.outcome` for a branch node, else NULL |
| `user_ply_count` | nodes with `actor = "user"` on the branch |
| `checkpoint_ids` | JSON array of `checkpoint.reached` ids on this branch, in event order |
| `origin` | §6 |
| `schedule_id` | the schedule consumed when the run started, else NULL |
| `started_at`, `ended_at` | first and last node `createdAt` on the branch; `ended_at` falls back to `started_at` for an empty branch |

Concept tags go in a second table, one row per `(run_id, branch_id, concept_key)`, populated
from the pack's `concepts` array (§3).

The row set is a **pure function** of `(run, packDocument, learnerId)`. It is therefore
recomputable, and recomputation is the idempotency mechanism: re-projecting a run must
produce byte-identical rows.

### 3. Concept identity: pack-scoped keys, and why B7 does not build a registry

**The problem, verified.** `concepts` is declared only in the JSON Schema, as
`nonEmptyString[]` with `uniqueItems` (`schemas/drill_pack.schema.json:30-34`). It is absent
from `packages/schema/src/drill-pack/types.ts`. Uniqueness is per document, so
`content/drafts/anti-caro-advance.json` and any other pack writing `break-timing` have no
contract making them the same concept. Shipped values are not even slug-shaped:
`schemas/drill_pack.example.json` declares `["move order", "theory-to-plan transition"]`,
with a space — so tightening the schema to the id pattern would invalidate the one pack
registered in production mode (`apps/server/src/pack-registry.ts:231-243`).

**The call.** B7 ships attempt-scheduling only and records concepts as **pack-scoped keys**:

```
conceptKey = `pack:${packId}#${raw}`     // raw is the authored string, verbatim
```

Three consequences, all deliberate:

1. **Scheduling never reads a concept.** The owner ruling is that attempts are scheduled and
   concepts select among them (`design/01-training-model.md:48-51`). Every rule in §7 keys
   on `root_key`. Removing every concept row would not change a single due item. This is why
   the missing registry cannot block this RFC.
2. **Two packs saying `break-timing` stay two concepts, and the surface says so.** `/learn`
   groups concept tags under their pack and states, in the page, that concepts are pack-local
   until an authoring registry exists. It does not silently merge strings, and it does not
   slugify — normalizing `"move order"` into `move-order` would manufacture identity from
   punctuation.
3. **The seam is named now so item #6 can fill it without a migration of meaning.** The
   projector resolves concepts through

   ```ts
   export interface ConceptResolver {
     resolve(packId: string, raw: string): { readonly key: string; readonly label: string };
   }
   ```

   with one shipped implementation, `PackScopedConceptResolver`, returning the key above and
   `label = raw`. When the pack studio ships a registry, it supplies a second implementation
   and a re-projection of `attempt_concepts` rebuilds the keys; attempt rows themselves are
   untouched because they never referenced a concept.

Additionally: `concepts` gains a TypeScript type (§13) so it stops being invisible to the
compiler, and `lintDrillPack` gains a **warning** (never an error)
`CONCEPT_KEY_NOT_SLUG` for concepts that do not match `^[a-z0-9][a-z0-9-]*$`. A warning
keeps `drill_pack.example.json` loadable while telling every future author the shape a
registry will want.

**The cost, stated plainly.** "Voluntary return to the same concept" (§14) becomes
measurable, but same-pack only. Across packs it undercounts — never overcounts. An
undercounting metric can still falsify the claim it exists to test; a metric built on
merged-by-accident strings could not.

### 4. Storage: migration 8

`STORAGE_VERSION` moves 7 → 8 (`apps/server/src/storage.ts:147`, currently 5; migrations 6
and 7 are claimed by `n-way-comparison.md` and `live-session-platform.md`) with one entry
appended to the ladder at `storage.ts:915-941`, named `attempt records, concept tags, schedules, and
history stats`. It creates tables and indexes **only**. It reads no snapshot and calls no
runtime function — the register already records that migration 1's body had to be rewritten
to stop replaying through `projectRun` (`rfc/README.md:51`), and this RFC does not repeat
that mistake. Backfill is an application-level pass (§5).

```sql
CREATE TABLE attempts (
  run_id             TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  branch_id          TEXT NOT NULL,
  learner_id         TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  session_kind       TEXT NOT NULL CHECK (session_kind IN ('pack','position')),
  pack_id            TEXT,
  pack_digest        TEXT,
  root_key           TEXT NOT NULL,
  root_node_id       TEXT NOT NULL,
  root_transpose_key TEXT NOT NULL,
  branch_label       TEXT NOT NULL,
  branch_intent      TEXT,
  branch_seed        INTEGER NOT NULL,
  attempt_no         INTEGER NOT NULL,
  countable          INTEGER NOT NULL CHECK (countable IN (0,1)),
  graded             INTEGER NOT NULL CHECK (graded IN (0,1)),
  objective_state    TEXT NOT NULL,
  verdict            TEXT NOT NULL CHECK (verdict IN ('stable','unstable','open')),
  result             TEXT CHECK (result IN ('win','loss','draw')),
  user_ply_count     INTEGER NOT NULL,
  checkpoint_ids     TEXT NOT NULL,
  origin             TEXT NOT NULL CHECK (origin IN ('fresh','duplicate','scheduled','in_run_retry')),
  schedule_id        TEXT,
  started_at         TEXT NOT NULL,
  ended_at           TEXT NOT NULL,
  PRIMARY KEY (run_id, branch_id)
) STRICT;
CREATE INDEX attempts_root ON attempts(learner_id, root_key, ended_at);
CREATE INDEX attempts_transpose ON attempts(root_transpose_key);

CREATE TABLE attempt_concepts (
  run_id      TEXT NOT NULL,
  branch_id   TEXT NOT NULL,
  pack_id     TEXT NOT NULL,
  concept_key TEXT NOT NULL,
  label       TEXT NOT NULL,
  PRIMARY KEY (run_id, branch_id, concept_key),
  FOREIGN KEY (run_id, branch_id) REFERENCES attempts(run_id, branch_id) ON DELETE CASCADE
) STRICT;
CREATE INDEX attempt_concepts_key ON attempt_concepts(concept_key);

CREATE TABLE schedules (
  id                 TEXT PRIMARY KEY,
  learner_id         TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  root_key           TEXT NOT NULL,
  session_kind       TEXT NOT NULL CHECK (session_kind IN ('pack','position')),
  pack_id            TEXT,
  root_transpose_key TEXT NOT NULL,
  kind               TEXT NOT NULL CHECK (kind IN ('blocked','varied')),
  variant            TEXT,
  origin             TEXT NOT NULL CHECK (origin IN ('auto','learner')),
  state              TEXT NOT NULL CHECK (state IN ('pending','started','dismissed')),
  due_at             TEXT NOT NULL,
  created_at         TEXT NOT NULL,
  source_run_id      TEXT,
  source_node_id     TEXT,
  started_run_id     TEXT
) STRICT;
CREATE UNIQUE INDEX schedules_one_auto_pending
  ON schedules(learner_id, root_key) WHERE state = 'pending' AND origin = 'auto';
CREATE INDEX schedules_due ON schedules(learner_id, state, due_at);

CREATE TABLE learner_position_stats (
  learner_id    TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  transpose_key TEXT NOT NULL,
  seen_count    INTEGER NOT NULL,
  PRIMARY KEY (learner_id, transpose_key)
) STRICT;

CREATE TABLE progress_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
```

`schedules.source_run_id` deliberately has no foreign key: a learner-scheduled transfer must
survive the deletion of the run it came from. Deleting a learner cascades all four tables,
which keeps the deletion promise made by `deleteLearner` (`storage.ts:610-649`) intact.

`RunStorage` (`storage.ts:71-100`) is not widened. A sibling interface `ProgressStorage` is
declared in the same module and implemented by the same `SQLiteRunStorage` class, so there
is exactly one `DatabaseSync` handle and one migration ladder. Its methods:
`upsertAttempts`, `attemptsForRoot`, `progressRoots`, `upsertAutoSchedule`, `schedule`,
`dueSchedules`, `markScheduleStarted`, `dismissSchedule`, `saveWithSchedule`, `relatedRoots`,
`replacePositionStats`, `positionStats`, `progressMeta`, `setProgressMeta`, and
`runIdsForBackfill`.

### 5. The projector

`apps/server/src/progress.ts` exports a pure function

```ts
export function projectAttempts(input: {
  readonly run: DrillRun;
  readonly learnerId: string;
  readonly pack: DrillPackDefinition | undefined;
  readonly origins: Readonly<Record<string, AttemptOrigin>>;
  readonly concepts: ConceptResolver;
}): { readonly attempts: readonly AttemptRow[]; readonly conceptTags: readonly ConceptTagRow[] }
```

and a class `ProgressProjector` holding the storage, the pack registry and the resolver.

**When it runs.** `RunService` calls `projector.project(run, ownerLearnerId)` immediately
after every `#storage.save(...)` in `move`, `opponentPly`, `rewind`, `fork` and `reveal`, and
after `#storage.create(...)` in `create` (`service.ts:163-238`, `:240-328`). Cost is
`O(nodes + events)` per mutation, which is strictly less than the replay the cold-read path
already pays (`storage.ts:396`). Projection failure must not fail the mutation: it is caught,
logged with the run id, and retried on the next mutation, because a progress row is a derived
read model and a run write is the source of truth.

**`attempt_no` and idempotency.** `attempt_no` is assigned by the store, not the projector:
`upsertAttempts` writes the rows in one transaction and then renumbers the affected
`(learner_id, root_key)` groups by `(started_at, run_id, branch_id)`. Re-projecting an
unchanged run therefore produces identical rows including ordinals.

**Backfill.** `createApplication` (`apps/server/src/application.ts:260-311`) runs
`projector.backfill()` after constructing the service, unless
`progress_meta['attempts_backfilled_at']` is set. It pages run ids through
`runIdsForBackfill` (current `schema_version` only, so migration-3 quarantined snapshots are
skipped by construction), reads each through `RunStorage.read`, and projects it. A run whose
snapshot fails replay is counted and logged, never fatal — `read` throws
`STORAGE_FAILURE` on a failed replay (`storage.ts:405-407`) and a boot must not die on one
bad row. The marker is written with the count of projected and skipped runs.

### 6. Run duplicate and attempt origin

**`POST /runs/:id/duplicate`.** `duplicate` is added to the run subroute regex
(`rest.ts:394`). The caller needs read access to the source run (`requireRead`,
`authorization.ts:28-39`) — a spectator may duplicate, because the result is a new run owned
by the caller and it copies nothing that `GET /runs/:id/graph` does not already expose. It
does **not** require the writer lease: duplicating is not a write to the source run.

Body: `{ "id": string, "seed": number, "policyConfig": {…} }` — the same three fields
`POST /runs` already requires, parsed by the same helpers (`parseCreateInput` at
`rest.ts:245`, `parsePolicyConfig` at `:195`). The session is derived server-side from the
source run's `run.started` data, never from the client:

- `sessionKind: "pack"` → `{ kind: "pack", packId: source.packId }`. The pack is resolved
  from the **current** registry, so the new run carries the current digest. If the pack is no
  longer registered, `PACK_NOT_FOUND` (404) — never a silent downgrade to a position session.
- `sessionKind: "position"` → `{ kind: "position", start: source.start, feedbackPolicy: "attempt_end", opponentPolicy: source.opponentPolicy }`.

Response: `201 { run, derivedFromRunId, packDigestChanged: boolean }`. Lineage is recorded in
the progress store as the new run's first-attempt `origin`, plus a `derived_from_run_id`
column on `attempts`; it is **not** written into the run event log, because
`run.started.data` is closed by `schemas/drill_run.schema.json` and this RFC changes no run
schema.

**Origin.** `POST /runs` gains one optional top-level field, added to the closed key list at
`rest.ts:246`:

```jsonc
"intent": { "origin": "fresh" | "duplicate", "scheduleId"?: string }
```

Rules:

- Any branch other than the run's first is `in_run_retry`, regardless of what the client said.
- If `intent.scheduleId` resolves to a `pending` or `started` schedule owned by the caller,
  the server sets `origin: "scheduled"` and records `schedule_id`, whatever the client
  claimed. A schedule id belonging to another learner is `404 RUN_NOT_FOUND`; a `dismissed`
  schedule is `422 INVALID_REQUEST`.
- Otherwise the origin is the client's `fresh` or `duplicate`, defaulting to `fresh`.

`intent` never reaches `createRun` and never appears in the event log. That is an acceptance
assertion, not a convention (§Acceptance, A7).

### 7. Schedules: the blocked/varied trigger

`design/01-training-model.md:72-79` designs blocked versus varied repetition and does not say
what triggers the change. This is the trigger, expressed only in recorded facts.

Let `H` be the learner's **countable** attempts at one `root_key`, ordered by `ended_at`.
After each projection, for each affected root, the scheduler computes at most one automatic
schedule and upserts it against `schedules_one_auto_pending`, so re-projection can never
duplicate a due item.

```
VARIED_LADDER_DAYS = [1, 3, 7, 16, 35]

if H is empty                       -> no schedule
if the latest attempt is ungraded   -> varied, k = |H| - 1
else if the last two verdicts are both `stable`
                                    -> varied, k = (trailing stable count) - 2
else                                -> blocked

blocked: due_at = last attempt's ended_at   (i.e. due now), variant = NULL
varied:  due_at = last attempt's ended_at + VARIED_LADDER_DAYS[min(k, 4)] days
```

Four consequences worth stating because each one is a failure mode avoided:

- **One success is not stabilization.** A single `stable` attempt still schedules blocked
  repetition. `design/01` defines blocked as "same root until the procedure stabilizes"; one
  pass is not evidence of a procedure.
- **`open` behaves like `unstable` on a graded root.** A graded pack whose objective never
  transitioned is an unfinished attempt, which is exactly what blocked repetition is for.
- **Ungraded roots never schedule blocked repetition.** `carlsbad-minority-attack` and the
  terminal-outcome fixture cannot resolve an objective, so a verdict-driven rule would leave
  them due forever. They go straight onto the varied ladder and `/learn` labels them
  "not graded" rather than inventing a mastery signal.
- **A `variant` is only named when a pack declares one.** `variant` is drawn from the pack's
  `retryVariants` (§13), rotating by `k`. With none declared, `variant` is NULL and the
  surface says the variation is a fresh opponent seed — which is a real change, not a
  placebo: `nextBranch` reuses the run's seed unless `seedMode` is `per_branch`
  (`runtime.ts:107`), so within one run a retry faces the same sampling, while a new run gets
  a new seed from the client (`apps/web/src/lib/session-controller.ts:221`). Varied repetition
  is therefore a *new run*, and blocked repetition may be either.

Time comes from the storage's injected clock (`storage.ts:298`, `:303`), so tests control it.

**Ladder provenance.** The ladder is a fixed, legible parameter — no ease factors, no
per-item difficulty estimate, because nothing recorded today could justify one. It is
revisable on stated evidence: once attempt rows exist, the second-attempt query in §14
measures whether an interval precedes recovery or regression. The value is pinned; the
revision trigger is named.

### 8. `transfer.scheduled` gets a producer

`POST /runs/:id/schedule` (added to the regex at `rest.ts:394`) requires the writer lease
(`requireWrite`, `authorization.ts:41-62`), because it appends to the run.

Body: `{ "nodeId": string, "kind": "blocked" | "varied", "variant"?: string, "dueAt"?: string }`.
`variant` must be a member of `RETRY_VARIANT_KINDS` (§13) when `kind` is `varied`. The
schedule row is written with `origin: "learner"`, `root_key` computed from that node's
`transposeKey`, and `source_run_id` / `source_node_id` set. `dueAt` defaults to now.

The event emitted is the one already declared (`packages/runtime/src/types.ts:197-200`,
`schemas/drill_run.schema.json:558-571`):

```ts
{ type: "transfer.scheduled", data: { nodeId, scheduleId } }
```

`scheduleId` is a UUID; `$defs/id` in the run schema is `{ type: "string", minLength: 1 }`
(`schemas/drill_run.schema.json:78-81`), so no id-shape change is needed. `projectRun`
already accepts the event as a no-op (`events.ts:187-190`), and the ordering rule that
constrains `outcome.reached` applies only to that event (`events.ts:169-174`), so a transfer
may be scheduled from a run that has already ended — which is the main case, since you
schedule a retry after you lost.

**Atomicity.** `saveWithSchedule(run, lease, schedule)` performs the schedule INSERT and the
`drill_runs` UPDATE inside one `BEGIN IMMEDIATE`, reusing the two-table transaction pattern
`create` already uses (`storage.ts:329-353`). If the UPDATE changes zero rows, the
transaction rolls back and the call throws `NOT_ACTIVE_WRITER`. There is no window in which
a `scheduleId` in the event log points at no row, and none in which a row references an
event that was never appended.

### 9. Related-position retrieval

`GET /progress/related?runId=…&nodeId=…` returns at most three honestly-labelled relations,
each derived from something recorded:

| Relation | Derivation | Label shown |
|---|---|---|
| `same_position` | another root key with an equal `root_transpose_key`, different `run_id` | "same position" |
| `same_pack` | another root key with the same `pack_id` | "same pack, different position" |
| `same_concept_in_pack` | another root key in the same pack sharing a `concept_key` | "same concept, same pack" |

There is no cross-pack concept relation, because there is no cross-pack concept key (§3). The
surface must not offer one; an empty section states why in one sentence rather than showing a
guess. Results are ordered by relation strength in the order above, then by the learner's
attempt count ascending, so the least-attempted material surfaces first.

### 10. HTTP surface

New routes, all authenticated through the existing `authenticate()` seam (`rest.ts:461-467`):

| Method | Path | Purpose |
|---|---|---|
| GET | `/progress` | recorded roots for the caller (§11) |
| GET | `/progress/due?limit=&at=` | pending schedules with `due_at <= now`, blocked first, then `due_at` ascending |
| GET | `/progress/related?runId=&nodeId=` | §9 |
| GET | `/progress/recommendations` | §12; empty array when no history is imported |
| POST | `/progress/schedules/:id` | `{ "op": "dismiss" }` |
| POST | `/profile/history` | `{ "op": "import", "pgn": string }` or `{ "op": "clear" }` |
| POST | `/runs/:id/duplicate` | §6 |
| POST | `/runs/:id/schedule` | §8 |

`isApiPath` (`apps/server/src/application.ts:206-217`) gains `/progress`, `/progress/…` and
`/profile/…`. It must **not** gain `/learn`: `/learn` is a client route served by the SPA
fallback (`router.ts:22`), and routing it to the API would blank the page. Pagination reuses
`parsePagination` (`rest.ts:435-450`, max 100).

`/learn`'s phase filter reads `PackSummary.phase`, which `defect-sweep.md` §4 adds to
`pack-registry.ts:26-34` / `:201-209` and its client mirror at `apps/web/src/lib/api.ts:16-24`,
as `PackPhase | null`. This RFC does not write that field; it consumes it, and treats `null`
as the filter value "unclassified" — `phase` is optional in the schema
(`schemas/drill_pack.schema.json:24-26`) and guessing one from a position is not permitted.

### 11. `/learn`, progress display, and what it may not say

`capabilities.ts:122` flips to `learn: "available"` and `learn` is removed from
`PLANNED_SURFACES` (`apps/web/src/lib/api.ts:170-176`). The `App.svelte:341-352` empty-state
branch keeps `live` and `create` and drops `learn`.

The route renders four sections:

1. **Due now** — `GET /progress/due`. Each item shows the pack or position title, whether it
   is blocked or varied, the variation when one is named, and how long since the last
   attempt. Its primary action starts a run carrying `intent.scheduleId`, so the resulting
   attempt records `origin: "scheduled"`. Its secondary action dismisses.
2. **Coming up** — pending schedules with a future `due_at`, showing the date.
3. **What is recorded** — `GET /progress` rows, filterable by `phase` (from the pack list) and
   by pack. Each row shows: attempts, the verdict of each in order, the last attempt's date,
   the pack digest if it changed between attempts, the pack-scoped concept tags, and a
   "Try this again" action that calls `POST /runs/:id/duplicate` on the most recent run.
4. **Related** — rendered on a row's expansion, from `GET /progress/related`.

**What the display may not say.** The section answering "what does it believe you know?" is
titled *What is recorded*, and it believes nothing. It may state counts, verdicts, dates,
results and what the scheduler will do next. It may not emit a mastery score, a percentage, a
strength/weakness label, or any sentence of the form "you keep mistiming the break" — that
sentence needs a cross-pack concept identity that does not exist (§3), and asserting it from
one pack's attempt counts would be exactly the dashboard anti-pattern the project names as
the thing it must not become. Zero attempts renders "Nothing recorded yet", never a
curriculum.

An ungraded root renders "this pack declares no objective grading, so attempts are recorded
but not graded" — one sentence, sourced from the `graded` column.

### 12. Optional personal-history recommender

Opt-in, off by default, and additive by construction: **no other endpoint or table reads
`learner_position_stats`.**

`POST /profile/history { op: "import", pgn }` parses with `parsePgn` from `chessops/pgn`
(already a workspace dependency, currently used only in tests), walks each game's mainline,
computes `transposeKey` per position (`packages/runtime/src/chess.ts:16-19`), and replaces the
caller's rows with the counts. Limits: 2 MiB of text and 500 games per request, both rejected
with `422 INVALID_REQUEST` carrying the limit; unparseable games are skipped and counted in
the response rather than failing the import. `{ op: "clear" }` deletes the caller's rows.

`GET /progress/recommendations` returns registered packs ranked by how often the learner's own
positions match the pack's root `transposeKey` and its spine positions, each with the raw
`reachedCount` so the ranking is inspectable. With no imported history the response is `[]`
and `/learn` shows the ordinary pack list.

Hard rules, enforced by acceptance (A9): it never creates or modifies a schedule, never writes
an attempt row, never grades, never changes a surface's availability, and never becomes an
entry requirement. ADR-0003 holds because the whole B7 suite passes with the table empty.

### 13. Pack format v0.6: `retryVariants` and `concepts`

`retryVariants` is `{"type": "array", "items": {"type": "object"}}` today
(`schemas/drill_pack.schema.json:66-69`) — entirely untyped, read by nothing. The varied
schedule needs a variation axis, and an untyped one would be one more inert field. It gains a
closed vocabulary drawn from `design/01-training-model.md:72-79` plus the two values already
shipped in `schemas/drill_pack.example.json`:

```ts
export const RETRY_VARIANT_KINDS = Object.freeze([
  "same_root_new_defense",      // shipped in drill_pack.example.json
  "alternate_plan_class",       // shipped in drill_pack.example.json
  "related_position_same_idea",
  "opposite_side",
  "different_material_details",
] as const);
```

Each item becomes `{ "kind": <enum>, "note"?: nonEmptyString }` with
`additionalProperties: false`. Both shipped entries validate unchanged.

`concepts` gains a type — `readonly concepts?: readonly string[]` on `DrillPackDefinition`
(`packages/schema/src/drill-pack/types.ts:80-102`) — and no schema constraint, per §3.

Because a previously free-form object becomes closed, this is a breaking validation change:
`DRILL_PACK_SCHEMA_VERSION` moves to `"0.6"` (`packages/schema/src/index.ts:2`), the schema
`$id` becomes `urn:chess-tabiya:schema:drill-pack:0.6` with the matching `description`, and
`packages/schema/src/drill-pack.test.ts:49-55` is updated.

**Why 0.6 and not 0.5.** The pack schema version is a shared single-writer resource for the
same reason a migration number is: two parallel drafts that both claim it cannot land
independently, which is why the migration register exists (`rfc/README.md:76-79`).
`defect-sweep.md` §7 claims 0.5 for `start.side` becoming required and
`immediate_blunder_guard` leaving the `feedbackPolicy` enum. This RFC therefore takes 0.6 and
names that draft in `Depends on:`, rather than colliding on 0.5 or making its own version
conditional on a landing order.

**One vocabulary, one source.** `RETRY_VARIANT_KINDS` and `RetryVariantKind` are declared in
`packages/schema/src/drill-pack/types.ts` beside `OBJECTIVE_TYPES` and the constants
`defect-sweep.md` §1a adds, re-exported from `drill-pack/index.ts`, enforced in
`pack-validation.ts` the way checkpoint actions are (`pack-validation.ts:18`, enforced
`:153-172`), and asserted set-equal to the JSON Schema enum by the same
`packages/schema/src/drill-pack.test.ts` case that draft's §1e introduces. D4 and D8 are two
instances of one defect class — a vocabulary with more than one hand-maintained source — and
this RFC adds no third instance. It does not claim to close either.

### 14. The two unfalsifiable metrics, made measurable

`planning/exploration/gates.md:149-160` records two success metrics as unfalsifiable. Each
becomes a query over `attempts`.

**"Voluntary return to the same concept."** Voluntary means unprompted, and prompting is
recorded: a due item can only be started with a `scheduleId`, which the server — not the
client — turns into `origin = 'scheduled'` (§6).

```sql
-- voluntary returns: a later attempt on a concept the learner already attempted,
-- not started from a due item
SELECT c.concept_key, count(*) AS voluntary_returns
FROM attempts a
JOIN attempt_concepts c ON c.run_id = a.run_id AND c.branch_id = a.branch_id
WHERE a.learner_id = ?1 AND a.countable = 1
  AND a.origin IN ('fresh','duplicate','in_run_retry')
  AND a.attempt_no > 1
GROUP BY c.concept_key;
```

Denominator: the same query with the `origin` filter removed. Known bias, stated in §3: with
pack-scoped keys this **undercounts** cross-pack returns and never overcounts, so a positive
result is trustworthy and a null result is not conclusive across packs. Trust boundary: the
client could omit a `scheduleId` and mis-record a prompted return as voluntary. In a
single-account-per-learner deployment that is a client bug, not an adversary, and it is
detectable — a `started` schedule whose root gained an attempt with no `schedule_id` in the
same window is the signature.

**"Second-attempt objective achievement."**

```sql
SELECT first.root_key,
       first.verdict  AS first_verdict,
       second.verdict AS second_verdict,
       second.result  AS second_result
FROM attempts first
JOIN attempts second
  ON second.learner_id = first.learner_id
 AND second.root_key   = first.root_key
 AND second.attempt_no = 2
WHERE first.learner_id = ?1 AND first.attempt_no = 1
  AND first.countable = 1 AND second.countable = 1
  AND first.graded = 1 AND second.graded = 1;
```

The `graded = 1` filter is the honest denominator: a pack that cannot resolve an objective
cannot supply evidence for or against this metric, and correction #8 above establishes that
Pack A now can. The metric never reads `result`, for the reason given in §1 — the `resist`
fixture grades a loss as `achieved`.

Both queries ship as two methods on `ProgressStorage` with unit tests over fixtures, so the
metric is a code path rather than an ad-hoc query someone writes once.

### 15. Boundary conditions the schema permits

Each row is a shape the shipped schema or type allows, the failure it would cause, and the
required handling. All are acceptance-tested.

| # | Permitted shape | Failure it would cause | Required handling |
|---|---|---|---|
| B1 | A pack with exactly one checkpoint (`minItems: 1`, three registered packs) | zero segments, zero records under a segment-based unit | attempts are branches; segments are not used (§1) |
| B2 | A branch forked but never played (`branchIsEmptyAtCursor`, `runtime.ts:130-138`) | an "attempt" with no attempt in it, inflating counts | row written with `countable = 0`; excluded from `attempt_no`, from every schedule rule, and from both metrics |
| B3 | A pack whose `objectiveRules` are empty (`carlsbad-minority-attack`, `terminal-outcome.browser`) | verdict is permanently `open` → blocked repetition due forever | `graded = 0` → varied ladder, `/learn` says "not graded" (§7) |
| B4 | A run reaching a terminal outcome without any objective transition (the `terminal-outcome` fixture does exactly this) | inferring failure from `loss` | `result` recorded, verdict untouched; `resist` grades a loss `achieved` (`drill.spec.ts:72-76`) |
| B5 | `achieved`/`failed` are absorbing (`objective-state.ts:4-10`) and `commitMove` throws `RUN_TERMINATED` at a terminal node (`runtime.ts:277-279`) | "retry" offered inside a run that cannot accept another move | a due item always starts a **new** run; in-run retry is offered only from a node whose `objectiveState` is non-terminal |
| B6 | The same seed on every branch unless `seedMode = "per_branch"` (`runtime.ts:107`) | "varied" repetition that varies nothing | varied schedules start a new run with a new seed; the surface names the seed as the variation when no `retryVariants` are declared |
| B7 | A pack removed from `content/drafts/` between runs (dev drafts load only in development, `pack-registry.ts:240-250`) | duplicate silently degrading a pack run to a position run | `PACK_NOT_FOUND` (404) |
| B8 | A pack edited between attempts (digest changes; `service.ts:170-172` rejects a stale client digest) | two attempts silently compared across different content | `root_key` excludes the digest, `pack_digest` recorded per attempt, `/learn` marks the change |
| B9 | `concepts` unique per document only; values with spaces (`drill_pack.example.json`) | two packs' `break-timing` merged into one false concept | pack-scoped keys, no normalization, lint warning only (§3) |
| B10 | A run with several granted writers (`storage.ts:744-756`) with no per-move learner in any event | another learner's moves recorded as yours | attempts attribute to `owner_learner_id`; documented in `docs/` as a named limitation |
| B11 | Quarantined snapshots whose `schema_version` is not current (migrations 3–5) | backfill crashing at boot | `runIdsForBackfill` filters on the current version; per-run failures are counted and logged (§5) |
| B12 | Two `pending` auto schedules for one root after a re-projection | duplicate due items that multiply on every write | partial unique index `schedules_one_auto_pending` + upsert (§4) |
| B13 | A learner deleted while runs are reassigned to `__legacy` (`storage.ts:610-649`) | orphan attempt and schedule rows keeping a deleted learner's history | `ON DELETE CASCADE` on `learner_id` in all four new tables |
| B14 | `scheduleId` referencing a schedule that was never written | an event log pointing at nothing | one `BEGIN IMMEDIATE` for the row and the run update (§8) |
| B15 | A schedule for a root whose only source run was deleted | foreign-key failure or a dead due item | `source_run_id` has no FK; the item stays startable because it carries `pack_id` and `root_transpose_key` |
| B16 | A client claiming `intent.origin = "fresh"` while consuming a due item | the voluntary-return metric measuring nothing | a resolving `scheduleId` forces `origin = 'scheduled'` server-side (§6) |

## Deviations from design

1. **`design/03-product-breadth.md:73` reads "SRS over episodes/concepts".** This RFC
   schedules attempts only; concepts are recorded as tags and select among attempts, never
   key a schedule. That is the later and narrower owner ruling
   (`design/01-training-model.md:48-70`), and where the two texts differ this RFC follows the
   ruling.
2. **`design/01-training-model.md:36-39` calls the attempt "one pass through the four
   stages".** A branch is that pass in the runtime, but a branch created by rewind-then-move
   begins mid-line rather than at orientation. This RFC treats such a branch as a full
   attempt at its own root (the fork position) rather than a partial attempt at the pack's
   root. Without this reading, a rewind-and-retry — the product's central gesture — would
   record nothing.
3. **The retry-variant vocabulary and the interval ladder are pinned here, not in design.**
   Both are implementation parameters with named revision triggers (§7, §13); neither is a
   product claim.

No other deviations. Phase is never a scheduling key; personal history is never required;
nothing in this RFC generates a strategic claim.

## Acceptance criteria

Server and unit (`make test`):

- **A1.** `projectAttempts` is pure and idempotent: projecting the same run twice produces
  identical rows including `attempt_no`; a fixture run with a rewind-and-retry yields two
  attempts with the expected roots, verdicts and `origin` values.
- **A2.** Countability: a run opened but not played yields one row with `countable = 0`; a
  forked-but-unplayed branch yields a second such row; neither affects `attempt_no`, any
  schedule, or either metric query. (B2)
- **A3.** Migration 8 applies to a database at the preceding version, is not re-applied on reopen (the
  pattern proven at `apps/server/src/storage.test.ts:38-91`), and touches no snapshot.
  Backfill projects existing runs, skips non-current `schema_version` rows without throwing,
  and writes `progress_meta['attempts_backfilled_at']`. (B11)
- **A4.** Trigger table, one test per row: one `stable` → blocked; two consecutive `stable` →
  varied at ladder index 0; `unstable` → blocked; `open` on a graded root → blocked;
  ungraded root → varied and never blocked. (B3)
- **A5.** Re-projecting a run five times leaves exactly one `pending` auto schedule for its
  root. (B12)
- **A6.** `POST /runs/:id/duplicate`: creates a run with the same pack and a new seed;
  returns `packDigestChanged` when the registry digest differs; 404s when the pack is gone;
  works for a position session; a spectator may duplicate; the source run's event count is
  unchanged. (B7, B8)
- **A7.** `POST /runs` with `intent` records the origin and `GET /runs/:newId/events?sinceSeq=0`
  contains no `intent` field anywhere; an unknown `intent` key is rejected; a foreign
  `scheduleId` 404s; a dismissed one 422s; a valid one forces `origin = 'scheduled'` even
  when the body claims `fresh`. (B16)
- **A8.** `POST /runs/:id/schedule` emits exactly one `transfer.scheduled` event whose
  `scheduleId` matches the stored row; the run still projects; a caller without the lease gets
  `NOT_ACTIVE_WRITER` and **no** schedule row is left behind; scheduling from a run that has
  already reached a terminal outcome succeeds. (B14, B5)
- **A9.** Additivity: the entire suite passes with `learner_position_stats` empty;
  `GET /progress/recommendations` returns `[]`; after importing a PGN, pack ranking changes
  and no schedule, attempt row, verdict or surface availability differs.
- **A10.** Both metric queries return the expected rows over a fixture with one ungraded root,
  one graded root with a failed-then-stable pair, and one prompted return.
- **A11.** Pack format: `drill_pack.example.json` and all six drafts validate against v0.6;
  an unknown `retryVariants[].kind` is rejected with a JSON Pointer; the schema enum and
  `RETRY_VARIANT_KINDS` are set-equal; a non-slug `concepts` entry produces a **warning**, and
  `drill_pack.example.json` still loads. (B9)
- **A12.** `/learn`'s phase filter groups packs by `PackSummary.phase` and files a `null`
  phase under "unclassified" — consuming the field `defect-sweep.md` §4 adds, not re-adding
  it. If that draft has not landed, this RFC does not ship the filter and ships the other
  three `/learn` sections; it never adds a second writer for `phase`.

Browser (`make test-browser`, `tests/browser/progress.spec.ts`, mock engine mode):

- **A13 — an ungraded loss does not trap the learner in blocked repetition.** Play the
  terminal-outcome fixture to "You lost." (the existing path, `drill.spec.ts:22-41`), open
  `/learn`: the root appears under *What is recorded* with the recorded result and the
  "not graded" sentence, and its schedule is **varied, not due now**. "Due now" does not
  contain it. (B3, B4)
- **A14 — the blocked→varied trigger, end to end.** Play `outcome-resist.browser.json` to
  `achieved` (`drill.spec.ts:64-77`). `/learn` shows one blocked item due now. Start it from
  the due list; the new run's first attempt records `origin: "scheduled"` (asserted through
  `GET /progress`). Play it to `achieved` again. `/learn` now shows the root as varied with a
  future due date and no blocked item, and *What is recorded* shows two attempts in order.
- **A15 — `transfer.scheduled` has a producer the learner can see.** From the terminal sheet
  after a loss, use "Schedule a retry from here"; `GET /runs/:id/events?sinceSeq=0` contains a
  `transfer.scheduled` event; its `scheduleId` appears in `GET /progress/due`; `/learn` lists
  it as learner-scheduled.
- **A16 — duplicate from Review.** "Try this again" on a run in *What is recorded* creates a
  second run; both appear in `/review`; the first run's branch count and event count are
  unchanged — the first attempt is never erased.
- **A17 — honest empty state.** A freshly registered learner opening `/learn` sees
  "Nothing recorded yet" and no invented curriculum, and `GET /capabilities` reports
  `learn: "available"`.

Documentation and register, in the same change:

- **A18.** `docs/return-and-progression.md` created and listed in `docs/README.md`, covering
  the attempt unit, the trigger, the store, the endpoints, the pack-scoped concept limitation,
  and the owner-attribution limitation (B10). `docs/drill-pack-format.md` gains a `## v0.6
  retry variants` section in the style of `## v0.4 Line Drill contract` (`:140-160`).
- **A19.** `rfc/README.md` migration register row for migration 8 and the Active-table row;
  on completion the RFC moves to `rfc/archive/` per RFC-0000.
- **A20.** `planning/exploration/gates.md` B7 status updated to what is then true, and the
  measurability audit entries at `:149-160` replaced with the shipped queries and their stated
  bias. Proposed `design/BACKLOG.md` row text is supplied in the planning directory for the
  owner; the implementer does not edit `design/`.

## Open questions

None.

## Changelog

- 2026-08-13: created.
