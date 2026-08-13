# RFC: Pack studio, write path, and review queue

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-13
- **Design refs:** `design/03-product-breadth.md` §Create and curate, §Breadth-complete
  gate B6, §Provisional foundations-first RFC program item 6;
  `design/04-content-architecture.md` §8 production model;
  `design/00-thesis.md` §Target player (on-ramp knobs)
- **Exploration gate:** owner ruling 2026-08-12 opening the exploration gate
  (`rfc/README.md` §Active); breadth sequencing ruling 2026-08-11
- **Migration:** **9** (`STORAGE_VERSION` 8 → 9), claimed in `rfc/README.md`'s register.
  Create-table and create-index only; no existing row is read or written and
  `DRILL_RUN_SCHEMA_VERSION` is untouched, so it needs no freeze rule. 6, 7 and 8 belong
  to `n-way-comparison.md`, `live-session-platform.md` and `return-and-progression.md`;
  see §2.
- **Depends on:** **`rfc/defect-sweep.md`** and **`rfc/return-and-progression.md`** (see §0 —
  they own pack schema v0.5 and v0.6, and the sweep closes D6, D8 and D9, three conditions
  this RFC's registration gate would otherwise have to re-specify),
  `rfc/archive/content-sourcing-foundation.md` (artifact triple,
  `sourcing-check`, licence encoding), `rfc/archive/learner-identity-and-authorization.md`
  (the subject), `rfc/archive/pack-optional-runs.md` (pack-optional run identity),
  `rfc/archive/authored-explanation-surface.md` and
  `rfc/archive/authored-feedback-delivery.md` (per-scope reveal)
- **Parent / amends:** amends `rfc/archive/drill-pack-format.md` in one bounded place
  (§14a, optional `deviations[].planClassId`, schema `$id` **0.7 → 0.8**)
- **Supersedes / superseded by:** —
- **Planning:** `planning/pack-studio-and-review/` (once implementing)

## Summary

B6's mining half is met: `candidate-emit` has produced four real unpublished
candidates in `content/candidates/` through the shipped sourcing pipelines. The
other half — how a candidate, an import, or a completed run becomes a *reviewed,
served* pack — does not exist at any layer. `apps/server/src/rest.ts` has no
non-GET `/packs` route; `content/packs/` is empty; `/create` is an honest empty
state (`apps/web/src/App.svelte:341-355`). This RFC specifies the pack studio,
the draft→review→registered write path, session distillation, PGN/candidate
imports, the review state machine and its authorization, versioning, and export
for community interchange. It reuses the shipped validator, RFC-8785 digest,
registry, sourcing checks and orchestrator rather than building a second
authoring stack, and it closes one live defect the write path would otherwise
make dangerous: a run whose pack digest no longer matches the registry silently
stops being orchestrated.

## Motivation

### What is verified absent

| Capability | Verified state |
|---|---|
| Pack write endpoint | `rest.ts:521-545` handles `GET /packs` and `GET /packs/:id` only; `parseRunRoute` (`rest.ts:391-403`) covers no pack route |
| Served pack catalogue | `PackRegistry.loadDefault` (`pack-registry.ts:224-271`) reads the schema fixture, `content/packs/` (empty but for `.gitkeep`) and, in development only, `content/drafts/` |
| Studio UI | `/create` renders "Pack authoring, imports, review, and session distillation arrive in program item 6" (`App.svelte:341-355`); `capabilities.ts:117-129` reports `create: "unavailable-here"` |
| Session distillation | no code anywhere; `design/03` lists it under Live and Create both |
| Review queue | `provenance.reviewStatus` is a free enum in the document (`schemas/drill_pack.schema.json` `$defs/provenance`); nothing but `pack-validation.ts:86-109` reacts to it |
| Versioning workflow | `PackRegistry` is keyed by pack id with one record each (`pack-registry.ts:171-222`); no version history exists |

### What already ships and must be extended, not rebuilt

`validatePackDocument` (`pack-validation.ts:420-447`) composes JSON Schema,
`lintDrillPack`, and executable-policy checks and is already shared by
`make pack-check` and registry loading. `digestDrillPack`
(`packages/schema/src/drill-pack/digest.ts:56-64`) is RFC-8785 identity over the
complete document. `checkSourcingDirectory` (`sourcing/check.ts:191-264`) already
enforces the candidate contract including `CANDIDATE_ALREADY_PROMOTED`
(`check.ts:216`). `assessmentGrounding` (`sourcing/ledger-validation.ts:380-407`)
already decides whether a Syzygy declaration is earned. `orchestratePackMove`
(`pack-orchestrator.ts:278-298`) already drives checkpoints and objectives from an
authored document. Every one of those is a dependency of this RFC, not a
competitor to it.

### What the authoring work measured

Three packs were authored and logged in `planning/content-era/log.md`. Across Pack
A's two sessions the cost was 105 minutes with 45 of them `tooling-friction`
(43%, past the 25% threshold in `planning/content-era/plan.md` §1 that fires the
build-tooling rule) — and **all 45 minutes were playtest/run-assembly friction**,
not research or encoding (`design/BACKLOG.md`, "Pack interop" row). The named
lever is a pack playtest harness with server-derived run id, `policyConfig` and
seed. Import attacks the other 55% and is the lever for the long tail, not the
first one. This RFC therefore treats the playtest harness as load-bearing scope
and the importers as breadth scope, in that order.

Two further findings shape the specification. Pack C's `still-holding` checkpoint
was true at the root, so the one authored `hold` pack was never playable (D12,
closed by `outcome-drill-grading`); nobody discovered that until an RFC executed
it, because nobody had played it. And `owner-review` is still 0 minutes across all
three packs — the clock `plan.md` §1b calls decisive has never started, because
there is no review surface to start it on.

### The grounding reality

No sourcing pipeline supplies reviewer sign-off, so none can promote a pack.
`sourcing/check.ts:122-124` already encodes the permanently human-only set
mechanically: any machine evidence record whose `supports` pointer matches
`PROSE_POINTERS` (`check.ts:30-36`: `/objective/summary`,
`/planClasses/N/description`, spine `annotations`, `/deviations/N/note`,
`/feedbackClaims/N/text`) or matches `/deviations/N/class` is rejected with
`EVIDENCE_OVERREACH`. Pack A marks castling a `concept_violation` while its own
note says it "is not a blunder", and no evaluation in this system separates those.
The review queue is therefore the only path to publication, and this RFC's job is
to say exactly what a reviewer does and exactly what state their sign-off writes.

ADR-0001 (curated-first) and Law 8 bound the whole surface: a studio may draft,
never publish; any authoring assist may word validated evidence and may never
create a strategic claim or grade a move.

### Out of scope

Visual/form pack editing (the command loop has not been shown to be the
bottleneck; the measured bottleneck was playtesting). Automatic candidate
*selection* or ranking. Any authoring LLM. Corpus mining beyond the shipped
pipelines. Intent-relative success conditions and the `concept_violation` split
(§14b/§14c explain the refusal). Public unauthenticated share links.

## Specification

### 0. Relationship to the parallel drafts — shared single-writer resources

Five product RFCs are in draft alongside this one, and between them they have already
claimed both shared single-writer resources this RFC touches. Nothing below is a
dependency of *design*; it is bookkeeping on two numbers, done in the register rather
than discovered at merge.

`rfc/README.md`'s pack-schema-version register records a **contention on 0.6** between this
RFC and `return-and-progression.md`, and offers two resolutions: one rebases to 0.8, or the
two merge their bump. **This RFC takes 0.8.** Merging the bumps would couple two unrelated
additions — `retryVariants`/`concepts` for scheduling, `deviations[].planClassId` for review
— into one version whose meaning is "whichever of these landed", and the register's own note
says a pack version rebases cheaply because pack digests are content digests unaffected by
the `$id`. The cheap move is the right one, and the contention is resolved here rather than
left for the implementer.

| Resource | Claimed by | This RFC takes |
|---|---|---|
| pack schema version | `defect-sweep.md` → **0.5**; `return-and-progression.md` → **0.6**; `trajectory-drill.md` → **0.7** | **0.8** |
| database migration | `n-way-comparison.md` → **6**; `live-session-platform.md` → **7**; `return-and-progression.md` → **8** | **9** |

Three of `defect-sweep`'s closures land inside this RFC's registration gate, and this RFC
inherits them rather than restating them:

| Closed by | Effect here |
|---|---|
| D9 — `start.required` gains `side` (`defect-sweep` §3a) | a side-less pack is refused at the **schema** stage of `validatePackDocument`, so §4b needs no separate registration check and no new error code |
| D8 — `immediate_blunder_guard` removed from the schema; `perfect_tablebase` kept as a declared-not-selectable mode bound by test (`defect-sweep` §2a/§2b) | registration refuses the first at the schema stage and the second at the runtime stage with the existing `UNSUPPORTED_OPPONENT_POLICY` reason string |
| D6 — `PackSummary` gains `phase` (`defect-sweep` §4a) | `PackCatalogue.list()` (§3) carries `phase` through for registered packs from the moment it exists |

**If the acceptance order differs**, this RFC rebases downward to the lowest unclaimed pack
version and migration number rather than leaving a hole — the migration list skips any
`version <= current` (`storage.ts:942-955`), so a gap would be silently tolerated and then
silently mis-ordered by the next claim. If `defect-sweep` in particular does not land first,
this RFC re-adds the two registration conditions D8 and D9 would otherwise close, under the
code `START_SIDE_REQUIRED` and the existing `UNSUPPORTED_*_POLICY` set. Nothing else in this
specification changes under any ordering.

Three of the parallel drafts also touch shape this RFC reads:

- `n-way-comparison.md` adds `Branch.origin: "played" | "simulated"`, which session
  distillation must respect or it will manufacture deviations out of authored content (§6).
- `return-and-progression.md` adds `retryVariants` and types `concepts` in pack schema 0.6.
  Neither is a prose assertion under `PROSE_POINTERS`, so neither enters §10b's review
  checklist; `concepts` becoming typed does not change what a reviewer signs.
- `trajectory-drill.md` adds `legs` in pack schema 0.7. A leg boundary is structure, not an
  assertion, so it too stays out of the checklist — but a leg carrying authored prose would
  bring that prose in through `PROSE_POINTERS` automatically, because §10b derives the
  checklist from the document rather than from a hand-maintained list. That is the point of
  deriving it.

One row in `defect-sweep`'s proposed backlog is a live constraint on this RFC's never-silent
guarantee and is named here so it is not mistaken for a gap this RFC introduced:
`$defs/opponentPolicy` is `additionalProperties: true`, so an author can write a policy field
nothing reads and hear nothing. This RFC's closed-record parsing (§4) covers the *request
envelope*, not the pack document's own open objects; that residue belongs to the sweep's row.

### 1. Three content locations, one schema

| Location | Contents | Written by | Served |
|---|---|---|---|
| `content/packs/`, `schemas/drill_pack.example.json` | **seed catalogue**: packs shipped in the image and in git | humans, through git | always |
| `content/drafts/`, `content/candidates/` | file workspaces for `pack-check`/`pack-preview` and for `candidate-emit`/`sourcing-check` | the existing CLIs | drafts in development only; candidates never |
| SQLite `pack_drafts` / `registered_packs` | the studio's drafts and everything it registers | this RFC's endpoints | registered packs always; drafts never |

The server never writes to `content/`. Registration writes a database row; leaving
the deployment is an explicit export (§11) followed by a human commit.

**Seed ids are reserved.** Registration rejects any pack id present in the seed
registry with `PACK_ID_RESERVED` (409). The two channels therefore have disjoint id
spaces and no shadowing rule is needed. A self-hoster who ships packs in git
updates them in git.

### 2. Storage — migration 9

`STORAGE_VERSION` 8 → 9 (`storage.ts:147`), appended to the migration list at
`storage.ts:915-941` in the established shape. Claimed in `rfc/README.md`'s
migration register in the same commit that drafts this RFC.

6, 7 and 8 are claimed (§0), so this RFC takes 9 and its DDL appends after them.
The ordering is not a real dependency: those three change run-persisted shape,
per-session tables and a progress projection respectively, and this one only
creates tables of its own. The number is the shared resource; the register is
where it is settled, and §0 states the rebase rule.

```sql
CREATE TABLE pack_drafts (
  id TEXT PRIMARY KEY,
  pack_id TEXT NOT NULL,
  owner_learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  document_json TEXT NOT NULL,
  digest TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN
    ('draft','in_review','changes_requested','approved','registered','withdrawn')),
  seed_kind TEXT NOT NULL CHECK (seed_kind IN
    ('blank','candidate','pgn','run','version','interchange')),
  seed_ref TEXT,
  proposals_json TEXT NOT NULL DEFAULT '[]',
  regressions_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX pack_drafts_owner ON pack_drafts(owner_learner_id);
CREATE INDEX pack_drafts_state ON pack_drafts(state);

CREATE TABLE pack_reviews (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL REFERENCES pack_drafts(id) ON DELETE CASCADE,
  reviewer_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,
  reviewer_handle TEXT NOT NULL,
  subject_digest TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved','changes_requested')),
  note TEXT,
  decided_at TEXT NOT NULL
) STRICT;
CREATE INDEX pack_reviews_draft ON pack_reviews(draft_id);

CREATE TABLE pack_review_items (
  review_id TEXT NOT NULL REFERENCES pack_reviews(id) ON DELETE CASCADE,
  pointer TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('accepted','rejected')),
  grounds TEXT NOT NULL CHECK (grounds IN
    ('citable_source','machine_validation','reviewer_signoff')),
  note TEXT,
  PRIMARY KEY (review_id, pointer)
) STRICT;

CREATE TABLE registered_packs (
  pack_id TEXT NOT NULL,
  version TEXT NOT NULL,
  digest TEXT NOT NULL UNIQUE,
  document_json TEXT NOT NULL,
  ledger_json TEXT,
  manifest_json TEXT,
  review_id TEXT NOT NULL REFERENCES pack_reviews(id) ON DELETE RESTRICT,
  draft_id TEXT NOT NULL REFERENCES pack_drafts(id) ON DELETE RESTRICT,
  registered_at TEXT NOT NULL,
  PRIMARY KEY (pack_id, version)
) STRICT;
CREATE INDEX registered_packs_digest ON registered_packs(digest);
```

The migration creates tables and indexes only; it backfills nothing, because no
prior state exists. It reads no run snapshot, calls no runtime function, rewrites
no `drill_runs` row, and leaves `DRILL_RUN_SCHEMA_VERSION` untouched, so it needs
no freeze rule and cannot mis-stamp anything. Existing databases at version 8 gain
empty tables. It touches no column any of migrations 6–8 writes, so the bodies are
independent as well as the numbers.

**Account deletion.** `deleteLearner` currently reassigns owned runs and held
leases to the `__legacy` sentinel (`docs/identity-and-authorization.md`). It is
extended, in the same transaction, to:

- set every non-`registered` draft owned by the deleted learner to `withdrawn`
  (a draft is private work, not a shared artifact like a run, so it is not
  reassigned);
- null `pack_reviews.reviewer_learner_id` while `reviewer_handle` and every
  `pack_review_items` row survive. A registered pack's audit trail must never be
  erasable by deleting an account, and `provenance.reviewers` in the published
  document already carries the handle independently.

`registered_packs` rows are never deleted by any code path in this RFC.

### 3. Digest-addressed pack resolution (defect fix, prerequisite)

`RunService.#registeredPack` reads `this.#packRegistry?.get(run.packId)` and
returns it only when `pack.digest === run.packDigest`
(`apps/server/src/service.ts:621-625`). When the digests differ it returns
`undefined`, and `move` (`service.ts:252`) and `opponentPly` (`service.ts:276`)
then **skip `orchestratePackMove` entirely**: no checkpoint fires, no objective
transitions, and because disclosure keys on `checkpoint.reached` /
`segment.completed` / `outcome.reached`, authored feedback is never revealed. The
run keeps accepting moves and silently stops being a drill. `authoredFeedback`
throws `PACK_NOT_FOUND` (`service.ts:448-458`) and `pgn` silently downgrades to
the pack-free exporter (`service.ts:521-524`).

Today this is unreachable because a pack id has exactly one document for a
process lifetime. **A versioning workflow makes it reachable for every in-flight
run of every pack that gets a new version.** It must be fixed before, not after,
the write path exists.

Introduce `PackSource` in `apps/server/src/pack-source.ts`:

```ts
export interface PackSource {
  list(): readonly PackSummary[];             // catalogue browsing
  get(packId: string): PackRecord | undefined; // newest registered version
  required(packId: string): PackRecord;
  byDigest(digest: string): PackRecord | undefined; // every version, forever
}
```

`PackRegistry` implements it (`byDigest` over its existing record map).
`PackCatalogue` composes the seed `PackRegistry`, a `PackStore` reading
`registered_packs`, and an in-memory ephemeral map used by the playtest harness
(§8). `RunService`'s `packRegistry` option is retyped to `PackSource`; no other
call site changes.

`#registeredPack` becomes:

```ts
#registeredPack(run: DrillRun): PackRecord | undefined {
  if (!isPackSession(run)) return undefined;
  const pack = this.#packs?.byDigest(run.packDigest);
  return pack?.document.id === run.packId ? pack : undefined;
}
```

`list()` returns the seed summaries plus the **highest registered semver per pack
id**, each built by the same `PackSummary` construction the registry already uses
(`pack-registry.ts:201-209`) so registered packs carry `phase` from the moment
`defect-sweep` §4a adds it and the Learn IA does not have to special-case the
studio's output. `get(packId)` resolves the same way. Superseded versions stay
resolvable by digest but do not appear in `GET /packs`.

`POST /runs` keeps its existing stale-digest rejection (`service.ts:170`): a client
that asks for a specific digest that is not the newest is told so, rather than
being silently started on a different pack.

### 4. Draft write path

All routes require an authenticated session (`identity.authenticate`, as
`rest.ts:461-467`), `content-type: application/json` via the existing
`requireJson`, and closed-record body parsing via the existing `closedRecord`
helper (`rest.ts:62-73`) so unknown fields are rejected rather than ignored —
D3's never-silent rule. Bodies above 512 KiB are rejected with `INVALID_REQUEST`;
a learner may hold at most 200 non-`withdrawn` drafts.

| Method | Path | Effect |
|---|---|---|
| `POST` | `/packs/drafts` | create a draft from a seed (§5–§6) |
| `GET` | `/packs/drafts` | drafts owned by the caller; `?queue=review` returns the review queue when the caller is a configured reviewer |
| `GET` | `/packs/drafts/:draftId` | document, digest, state, validation issues, proposals, regression cases, review history |
| `PUT` | `/packs/drafts/:draftId` | replace the document (requires `If-Match`) |
| `POST` | `/packs/drafts/:draftId/lint` | validate a candidate document without saving |
| `POST` | `/packs/drafts/:draftId/playtest` | create a real run against the draft (§8) |
| `POST` | `/packs/drafts/:draftId/regressions` | replace the regression set |
| `POST` | `/packs/drafts/:draftId/regressions/run` | execute the regression set (§9) |
| `POST` | `/packs/drafts/:draftId/submit` | `draft` → `in_review` |
| `POST` | `/packs/drafts/:draftId/review` | reviewer decision (§10) |
| `POST` | `/packs/drafts/:draftId/register` | `approved` → registered (§11) |
| `POST` | `/packs/drafts/:draftId/withdraw` | → `withdrawn` |
| `GET` | `/packs/:packId/versions` | registered versions with digests and review ids |
| `GET` | `/packs/:packId/export` | canonical interchange bundle (§12) |

`isApiPath` (`application.ts:206-217`) already matches `/packs` and `/packs/`
prefixes, so no static-serving change is needed.

#### 4a. Safety invariants

Every one of these is enforced server-side and each has a distinct error code.

1. **No write bypasses validation.** `PUT` and `POST /packs/drafts` run
   `validatePackDocument` on the submitted document and persist it together with
   its issues. A document with schema errors is still *stored* (an author must be
   able to save work in progress) but the draft cannot leave `draft`.
2. **`reviewStatus` is not author-writable.** Any submitted document whose
   `provenance.reviewStatus` is not `"draft"` is rejected with
   `PROVENANCE_STATUS_NOT_WRITABLE`; any non-empty `provenance.reviewers` is
   rejected with `PROVENANCE_REVIEWERS_NOT_WRITABLE`. Only §11's registration
   transition writes those two fields. This is the mechanical form of ADR-0001 and
   closes the hole `planning/content-era/plan.md` §3b names honestly ("nothing
   stops `reviewStatus` being flipped") for every path except a direct file edit
   in git.
3. **Optimistic concurrency.** `PUT` requires `If-Match: <digest>` naming the
   digest the client last read. A mismatch is 409 `DRAFT_STALE` with the current
   digest in `details`. There is no lease: drafts are single-owner, and the real
   conflict is two tabs.
4. **Drafts are locked during review.** `PUT`, `POST /regressions` and
   `POST /withdraw`-into-`registered` are rejected with `DRAFT_LOCKED_FOR_REVIEW`
   while the state is `in_review`. An edit in `approved` is *allowed* and
   returns the draft to `draft`, voiding the approval — enforced by digest
   comparison in §11, so it cannot be forgotten.
5. **Ownership.** Only the owner may `PUT`, submit, withdraw, or edit regression
   cases. A configured reviewer may read any `in_review` draft, playtest it, run
   its regressions, and review it. Nobody else may read a draft; a non-owner
   non-reviewer receives 404, matching the run-grant disclosure rule.
6. **Registration is append-only and immutable.** `(pack_id, version)` is unique
   (`PACK_VERSION_EXISTS`, 409) and the submitted version must be strictly greater
   than every registered version of that id under semver precedence
   (`PACK_VERSION_NOT_INCREASING`, 422). No registered row is ever mutated.
7. **No filesystem writes.** Export is a read.

#### 4b. Boundary conditions the schema permits and consumers cannot survive

Registration (§11) additionally refuses documents that validate but break a
downstream consumer — the boundary-condition class this RFC treats as its primary
failure mode. Two of them are **inherited** from `defect-sweep` rather than
respecified (§0); the rest are new.

| Code | Condition | Why |
|---|---|---|
| inherited — schema stage | `start.side` absent | `packStartSide` throws `TypeError` (`apps/web/src/lib/screen-model.ts:56-62`) and `RunService.create` refuses the run (`service.ts:186-188`), so a registered pack without it is a pack nobody can open. `defect-sweep` §3a makes `side` schema-required, so registration inherits the refusal at the earliest stage with a JSON Pointer |
| inherited — existing `UNSUPPORTED_OPPONENT_POLICY` / schema stage | `perfect_tablebase`; `immediate_blunder_guard` | D8. After `defect-sweep` §2a/§2b the first is refused by `runtimeIssues` with its own reason string and the second by the schema. Registration inherits both: a D8 pack cannot enter the served catalogue through this path |
| `GRADUATION_BLOCKERS_OUTSTANDING` | `provenance.graduationBlockers` present and non-empty | every emitted candidate carries this array (e.g. `content/candidates/onramp-00008/pack.json`) and every authored draft used it. It is untyped extra metadata that `provenance.additionalProperties: true` permits; registration turns the convention into a precondition |
| existing `SYZYGY_ASSESSMENT_UNGROUNDED` | `assessedBy.kind === "syzygy"` and `assessmentGrounding(...) === "unverified"` | reuses `sourcing/ledger-validation.ts:380-407` verbatim, against the ledger and manifest attached to the draft |

A fourth condition was drafted and then **withdrawn on verification**: a pack with
no checkpoints can never disclose authored prose or resolve an objective, but
`schemas/drill_pack.schema.json`'s `checkpoints` already carries `minItems: 1`, so
the schema stage refuses it and a registration-level `CHECKPOINT_SET_EMPTY` would
have been a second copy of a rule that already holds. Recorded rather than deleted,
because "the gate I was about to add already exists" is the finding this repo keeps
paying to relearn.

Registration also fails if the document produces any `validatePackDocument`
issue of severity `error`, and reports warnings without blocking.

### 5. Seeds

`POST /packs/drafts` body: `{ seed, document?, ledger?, manifest? }`.

| `seed.kind` | `seed.ref` | Document source |
|---|---|---|
| `blank` | — | a minimal valid skeleton the server generates: caller-supplied `id`/`title`/`start`, `mode`, `objective.type: "play_until_checkpoint"` with a summary the author must replace, one `atPly` checkpoint, `feedbackPolicy: "delayed_checkpoint"`, `opponentPolicy.mode: "human_common"`, `provenance: {reviewStatus:"draft", sources:[], reviewers:[]}` |
| `candidate` | candidate directory id | `document` = the candidate's `pack.json`, `ledger`/`manifest` = its `evidence.json` / `sources.json` |
| `pgn` | optional source URL | §5a |
| `run` | run id | §6 |
| `version` | `<packId>@<version>` | §11a |
| `interchange` | exporting deployment/URL, free text | an exported bundle from another deployment; `provenance.reviewStatus` forced to `draft` and `reviewers` cleared on ingest — **review does not travel** (§12) |

Candidate ingestion is a body upload, not a server-side directory read, so the
server keeps no assumption that a repo checkout is present. A new CLI target
carries a candidate over the same endpoint:

```
make draft-import DIR=content/candidates/<id> API=http://localhost:3000
```

It runs `checkSourcingDirectory` in strict mode locally first and refuses to
upload a candidate that fails it, so `candidate-emit` → `sourcing-check` →
`draft-import` is one continuous pipeline with no second validator.

#### 5a. PGN and FEN-collection import

One importer, PGN, because a Lichess study exports as PGN and declaring a
separate "study importer" would mean inventing a format and pinning an
unversioned web API. The author exports the study and uploads the PGN.

The importer takes PGN text and an explicit `learnerSide`, and:

- parses with `parsePgn` from `chessops/pgn` — the same dependency
  `apps/server/src/sourcing/openings.ts:47` already uses for the opening skeleton;
- resolves the start position from the `FEN`/`SetUp` headers or the standard
  initial position, and validates it as legal standard chess;
- walks the mainline and every variation legally, deriving SAN for each move, and
  builds a `spine` tree whose node ids are `<index>-<san-slug>`, deduplicated;
- emits `start.fen`, `start.movesSan` when the game began from the initial
  position, and `start.side = learnerSide`;
- emits exactly one `atPly` checkpoint at the mainline's last learner ply;
- copies **no** PGN comments, NAGs, or annotation glyphs into the pack. This is
  the single most important rule in the importer: imported commentary is third
  party prose with unknown licence and unknown truth, and copying it into
  `annotations` would launder it into authored teaching. Comments are returned in
  the response as *reference material for the author to read*, stored on the
  draft's `proposals_json`, and never in the document;
- writes `provenance.sources` with the supplied source description and
  `provenance.graduationBlockers` naming every assertion class the import cannot
  supply.

A multi-game PGN produces one draft per game, capped at 20 per request. A
FEN collection (one FEN per line) is the degenerate case: one draft per FEN with
no spine.

### 6. Session distillation

A completed run is turned into a **pack seed**, never into a pack. The run holds
exactly the material `design/03` promises — spine, checkpoints reached, deviations
played, and evidence — and the distiller's whole discipline is separating the part
that is mechanical from the part that is judgment.

Input: a run the caller may read, and a chosen `branchId` (default: the branch
containing the deepest node).

**Extracted mechanically into the draft document:**

1. `start` = `run.start` verbatim (`packages/runtime/src/types.ts:47-50`). Because
   `RunStart.side` is required at the runtime type level, a distilled pack cannot
   reproduce D9.
2. `spine`: the run's node graph rendered as an authored tree, built by the same
   path-merging rule `exportPackRunPgn` already uses
   (`packages/runtime/src/pack-pgn.ts:164`) rather than a second merger. The
   selected branch is the mainline; every other branch appears as a sibling child
   at its fork node. `moveUci`/`moveSan` are copied from the run's nodes, which the
   runtime already validated against legal chess and re-validates on export.
   Spine-node ids are derived from run node ids and are unique by construction.
3. `opponentPolicy` = `run.opponentPolicy`. The opponent's replies in the spine
   are **one sampled line, not theory**: the distiller writes a mandatory
   `graduationBlockers` entry saying so, naming the engine identities that actually
   produced them from `opponent.move_selected.selection.engine`
   (`types.ts:144-152`) and the `policyModeApplied` recorded for each. Where D15's
   `theory_strict` fallback fired, the distilled provenance says the opponent
   stopped playing theory, because migration 5 made that traceable instead of
   inferred.
4. `checkpoints`:
   - pack-sourced run — the definitions of the checkpoints that actually fired,
     copied from the source pack resolved by `byDigest(run.packDigest)`.
     Unreached checkpoints are dropped and listed in the response;
   - position-sourced run — exactly one `atPly` checkpoint at the selected
     branch's deepest learner ply, with `objective.type: "play_until_checkpoint"`
     and a summary that states it is mechanical. This is the convention
     `position-seeds` already ships (`content/candidates/onramp-00008/pack.json`),
     reused verbatim rather than re-invented.
5. `difficulty.branchLengthTarget` = the selected branch's ply length when it
   falls inside the schema's 2–20 band; omitted otherwise.
6. `provenance.sources` — one generated line naming the run id, its
   `sessionDigest`, the source pack id and digest if any, and the engine
   identities above. These are facts about how the moves came to exist.
6a. The remaining required scalars, which the schema demands and which have exactly
   one honest source each: `id` and `title` from the request (the author names their
   own pack); `version` `"0.1.0"`; `mode` and `objective.type` copied from the source
   pack for a pack-sourced run and `"outcome"` / `"play_until_checkpoint"` for a
   position-sourced one; `feedbackPolicy` = `run.feedbackPolicy`, except that a
   position run's `attempt_end` — which is a run policy, not a pack policy, and is
   absent from the pack enum — becomes `delayed_checkpoint` and is named in
   `graduationBlockers` as a substitution rather than a choice.
7. `provenance.reviewStatus: "draft"`, `reviewers: []`, and
   `graduationBlockers` enumerating the five §3b assertion categories plus the
   opponent-line caveat and any substitution above.

**Extracted as proposals, outside the pack document:** every fork in the run
becomes a *deviation proposal* in `proposals_json`.

One exclusion, and it is not optional. `n-way-comparison.md` §7.4 adds
`Branch.origin: "played" | "simulated"`, where a simulated branch is the pack's
own authored line played forward by the simulate grid. Distilling a simulated
branch into a deviation proposal would manufacture "the learner deviated here" out
of content the author already wrote — a deviation that describes nothing anyone
chose. **The distiller skips every branch whose `origin` is `"simulated"`**, both
as a spine sibling and as a proposal, and says so in the response. Until that field
exists every branch is `"played"` by construction and the rule is inert; it is
specified now because a distiller written before the field lands would silently do
the wrong thing after it does.

Each proposal:

```
{ kind: "deviation", atSpineNodeId, moveUci, moveSan,
  branchLabel, branchIntent?, objectiveStateBefore, objectiveStateAfter }
```

The proposal deliberately has **no `class`**. `deviations[].class` is required by
the schema and is permanently human-only — `sourcing/check.ts:122-124` already
refuses to let any machine evidence support that pointer. A proposal enters
`deviations` only when the author picks a class in the studio. The branch label
and intent the learner typed at fork time are shown because they are the closest
thing to a recorded human judgment the run contains, and they are still the
learner's words, not a classification.

**Never extracted:** any `objective.summary` beyond the stated mechanical
placeholder; any annotation; any deviation class or note; any plan class; any
`feedbackClaims` entry; any objective type other than the source pack's (already
human-authored) or `play_until_checkpoint`; any grading assessment. A run
contains no evidence for any of them, and generating one would be exactly the
ungrounded-assertion failure Law 8 forbids arriving through the content door.

**Engine evidence is not carried into an evidence ledger.** Run evidence is
movetime-budgeted (`service.ts` enqueues with `DEFAULT_STRONG_ENGINE_PROFILE`),
while the authoring evidence contract requires fixed depth and explicitly
forbids `movetimeMs`/`requestedMovetimeMs` (`sourcing/check.ts:160-163`). A
distilled draft therefore has no `evidence.json`; recorded evaluations appear only
as a human-readable provenance note. Grounding a distilled pack means running the
`--engine-eval` authoring job, not recycling gameplay evidence.

### 7. Lint additions

Three, all in the existing `runtimeIssues` path (`pack-validation.ts:81-418`) so
`make pack-check`, the studio, registry loading and `sourcing-check` all see them.

| Code | Severity | Rule |
|---|---|---|
| `INTENT_CAPTURE_HAS_NO_RECORDING_SITE` | warning | a checkpoint declares `interaction.type: "intent_capture"`. Its `planClassIds` do gate plan-class *reveal* (`authored-feedback.ts:210-217`), but nothing records which class the learner chose: `CheckpointSheet.svelte` offers no plan control and no event type carries a choice (`packages/runtime/src/types.ts:200-213`). The warning tells the author, at encoding time, that the field is half-inert — the field-consumer matrix turned into a build signal instead of a document |
| `DEVIATION_PLAN_CLASS_UNKNOWN` | error | `deviations[].planClassId` (§14a) names an id absent from `planClasses` |
| `CONSTRUCTED_ROOT_UNVERIFIED` | warning | `start.movesSan` is absent, so the root was placed by hand rather than derived by replaying a legal move list. Pack C's hand-placed root contained a mate in two that no move list could have produced; the position was legal, the spine was legal, and the pack was a lie. The warning is a signal to the reviewer, and §10's checklist makes `/start/fen` a mandatory sign-off item in exactly this case. No engine search is performed — this RFC states a fact about provenance, not an evaluation |

### 8. Playtest harness — the measured 43%

`POST /packs/drafts/:draftId/playtest` creates a **real run** against the draft
document and returns `{ run, url }`. The server derives everything the author had
to hand-assemble:

- `id` = `randomUUID()`;
- `seed` = a random safe integer;
- `policyConfig` = `{ seedMode: "per_run", locus: { executedAt: "server",
  engineIds: [], modelIds: [] } }`;
- session = `{ kind: "pack", packId, packDigest: <the draft's digest> }`.

The draft document is admitted to `PackCatalogue`'s **ephemeral map** keyed by its
digest, so `#registeredPack` (§3) resolves it by digest and the run goes through
`orchestratePackMove`, per-scope reveal, authored-feedback projection and the
evidence queue — the same code paths a learner gets, not a mock of them. Ephemeral
records never appear in `list()`, so a draft is never browsable as a pack. They are
retained for the process lifetime and rebuilt on demand from `pack_drafts` when a
run's digest is not otherwise resolvable, so a restart does not orphan a playtest
run.

A playtest is refused unless `validatePackDocument(...).valid` is true, and it is
available to the draft owner and to reviewers reviewing it. It is the mechanism by
which "validation by use, not ceremony" applies to review: a reviewer who cannot
play the pack cannot judge it, and D12 was found by execution after three
document reviews missed it.

`make pack-preview` is unchanged and remains the local file-based loop.

### 9. Regression set

A draft may carry an ordered regression set in `regressions_json`:

```
{ id, description,
  moves: [ { by: "learner" | "opponent", uci } ],
  expect: { checkpointsReached?: string[], objectiveState?: ObjectiveState,
            outcome?: "win" | "loss" | "draw" } }
```

`POST /packs/drafts/:draftId/regressions/run` replays each case entirely in
memory: `createRun` with the draft document, then `commitMove` for learner plies
and `appendOpponentPly` for opponent plies with a fixed synthetic selection
(`policyModeApplied: "unknown"`, engine identity
`{id:"regression", name:"Regression harness", version:"1", seedHonored:true}`),
passing each result through `orchestratePackMove`. No engine is consulted, no run
is persisted, and the result is deterministic. Each case returns pass/fail with the
first differing expectation.

Registration requires every existing case to pass. It does **not** require cases
to exist — but the review checklist shows the case count, so "0 regression cases"
is a fact a reviewer sees and may reject on. This is the mechanism that would have
caught D12 before a reviewer ever opened the file.

### 10. The review queue

#### 10a. Who may review

There is no operator or administrator account
(`docs/identity-and-authorization.md`), and approval is a deployment-wide
privilege, so it comes from deployment configuration — the same operator boundary
`docs/content-sourcing.md` already establishes for explorer credentials.

`TABIYA_REVIEWERS` is a comma-separated list of learner handles, read in
`apps/server/src/main.ts` and passed through `ApplicationOptions`. It is:

- **fail-closed** — unset or empty means nobody may approve, and every review
  endpoint returns 403 `REVIEW_UNCONFIGURED`. A deployment that forgot to
  configure reviewers cannot publish; it does not fall back to self-approval;
- **not self-serving** — `reviewer_learner_id` must differ from the draft's
  `owner_learner_id`, always, regardless of configuration
  (`REVIEW_SELF_NOT_PERMITTED`). If the only configured reviewer is the draft's
  author, that draft cannot be registered on that deployment. That is the correct
  outcome under ADR-0001 and §3b, not a bug: a solo self-hoster can still author,
  playtest, and use their packs as drafts; they simply cannot label them
  `reviewed`.

Reviewer status grants no other privilege anywhere in the system.

#### 10b. What a reviewer actually does

The checklist is **derived from the document**, not typed by hand. For the draft
document `D` at digest `S`, the server enumerates every pointer that must carry a
human judgment:

1. every pointer in `D` matching the shipped `PROSE_POINTERS` set
   (`apps/server/src/sourcing/check.ts:30-36`) — `/objective/summary`,
   `/planClasses/N/description`, `/spine/.../annotations/N`,
   `/deviations/N/note`, `/feedbackClaims/N/text`. This is exactly
   `planning/content-era/plan.md` §3b's five-category assertion set, already
   encoded in code;
2. `/deviations/N/class` for every deviation — the pointer
   `check.ts:122-124` singles out alongside the prose set as one no machine
   evidence may support;
3. `/objective/grading/assessedBy` when `kind === "authored"`. When
   `kind === "syzygy"` the item is listed as already grounded with
   `grounds: "machine_validation"` and is pre-accepted by
   `assessmentGrounding`, so a reviewer is never asked to hand-sign a tablebase
   fact;
4. `/start/fen` when `start.movesSan` is absent (a constructed root, §7).

For each pointer the reviewer records:

```
{ pointer, decision: "accepted" | "rejected",
  grounds: "citable_source" | "machine_validation" | "reviewer_signoff",
  note?: string }
```

`grounds` reuses the shipped ledger vocabulary (`EvidenceRecord.grounds`,
`sourcing/types.ts:79`) with one addition, `reviewer_signoff`, which is precisely
§3b's third acceptable ground and the one no pipeline can ever supply. A
`rejected` item requires a note.

`POST /packs/drafts/:draftId/review` body:
`{ decision: "approve" | "request_changes", subjectDigest, items[], note? }`.

Approval requires **all** of: `subjectDigest` equals the draft's current digest
(`REVIEW_SUBJECT_STALE`, 409); every enumerated pointer has an `accepted` item
(`REVIEW_CHECKLIST_INCOMPLETE`, 422, listing the missing pointers); no item
targets a pointer outside the enumeration (`REVIEW_POINTER_UNKNOWN`); the caller
is a configured reviewer who is not the owner. `request_changes` requires at
least one `rejected` item or a note.

The review is written to `pack_reviews` + `pack_review_items` **outside the pack
document**. That is what makes the signature non-circular: a reviewer signs the
exact bytes they read, and those bytes do not yet contain the signature.

#### 10c. State machine

Draft lifecycle state lives on the draft row. The document itself only ever
carries `provenance.reviewStatus: "draft"` until registration writes
`"reviewed"`.

```
            submit                approve              register
  draft ──────────▶ in_review ──────────▶ approved ──────────▶ registered
    ▲                   │                    │
    │  request_changes  │                    │  any edit (digest changes)
    └───────────────────┴────────────────────┘
                    changes_requested ──edit──▶ draft

  draft | in_review | changes_requested | approved ──withdraw──▶ withdrawn
```

| Transition | Actor | Preconditions |
|---|---|---|
| → `draft` | owner | valid seed |
| `draft` → `in_review` | owner | `validatePackDocument(...).valid`; `graduationBlockers` empty; all §4b conditions met; all regression cases pass; document `reviewStatus === "draft"` and `reviewers` empty |
| `in_review` → `changes_requested` | reviewer | §10b |
| `in_review` → `approved` | reviewer | §10b |
| `changes_requested` → `draft` | owner | any `PUT` |
| `approved` → `draft` | owner | any `PUT`; the approval is void because the digest changed |
| `approved` → `registered` | owner or the approving reviewer | §11 |
| any non-`registered` → `withdrawn` | owner | — |

`registered` is terminal. A registered draft is retained as the provenance of its
`registered_packs` row.

### 11. Registration and versioning

`POST /packs/drafts/:draftId/register` performs one SQLite transaction:

1. re-read the draft and recompute `digestDrillPack(document)`; require it to
   equal the approving review's `subject_digest` (`REVIEW_SUBJECT_STALE`);
2. re-run `validatePackDocument` on those exact bytes and require zero errors,
   plus every §4b condition;
3. require the pack id to be absent from the seed registry
   (`PACK_ID_RESERVED`) and the version to be strictly greater than every
   registered version of that id;
4. compute the published document as the deterministic function

   ```
   published = { ...draft,
     provenance: { ...draft.provenance,
                   reviewStatus: "reviewed",
                   reviewers: [review.reviewer_handle] } }
   ```

   and `publishedDigest = digestDrillPack(published)`. Because the transform is
   exact and the inputs are stored, anyone holding the draft and the review record
   can recompute the published digest and verify that nothing else changed;
5. insert `registered_packs`, set the draft to `registered`, and add the record to
   `PackCatalogue`.

`reviewStatus` is written as `"reviewed"`, never `"published"`. Both are treated
identically by `pack-validation.ts:86-109`, and this endpoint performs no
distribution act — it makes a pack servable in this deployment. Distribution is
§12's export followed by a human commit. Nothing in this RFC ever writes
`"published"`.

#### 11a. Versioning

`seed.kind: "version"` with `seed.ref: "<packId>@<version>"` creates a new draft
from a registered document with `reviewStatus` reset to `draft`, `reviewers`
cleared, and `version` unchanged so the author must bump it deliberately. Submit
rejects a version that is not strictly greater.

**Every new version requires a full review.** A typo fix is re-reviewed. The
alternative is a "trivial change" classifier, and no mechanism in this system can
make that judgment; a digest-scoped signature is the only honest one available.
Superseded versions remain resolvable by digest forever (§3), so in-flight runs
finish on the pack they started.

### 12. Export and community interchange

`GET /packs/:packId/export` (optionally `?version=` or `?digest=`) returns:

```
{ pack, review, sources?, evidence? }
```

`pack` is the registered document; the response body is serialized with
`canonicalizeJson` (`digest.ts:53-55`) plus one trailing newline, the same
convention `writeCanonicalJson` uses for candidates
(`sourcing/canonical.ts:11-14`), so the exported bytes hash to the pack's digest.
An `x-pack-digest` header carries it, matching `GET /packs/:id`
(`rest.ts:541`).

`review` is a new **reserved sidecar** named `review.json`:

```
{ schema: "tabiya.pack.review.v1",
  packId, packVersion, subjectDigest, publishedDigest,
  reviewerHandle, decidedAt,
  items: [ { pointer, decision, grounds, note? } ] }
```

`review.json` joins `SIDECAR_BASENAMES` (`pack-registry.ts:15-20`) in the same
change, per the standing rule in `docs/development.md` that new sidecar kinds must
join that single list before being placed beside served packs. `isSidecarName`
then excludes it from pack discovery and `checkPackFile` rejects it as a pack
filename by the existing mechanism.

The interchange unit is therefore the shipped `schemas/drill_pack.schema.json`
document plus already-reserved sidecar names — no private author format, which is
`design/03`'s explicit requirement.

**Review does not travel.** `seed.kind: "interchange"` accepts an exported bundle
and lands it as a `draft` with `reviewStatus` forced to `draft` and `reviewers`
cleared. The imported `review.json` is retained as `seed_ref` provenance a human
can read; it grants no status, because another deployment's reviewer is not this
deployment's reviewer.

`make pack-export PACK=<id> OUT=<dir> API=<url>` writes `pack.json` and
`review.json` into a directory ready to commit into `content/packs/`.

### 13. Client surface

#### 13a. Routes

`router.ts:18-27` gains dynamic create routes in the existing `/play/run/:id`
style:

| Path | Screen |
|---|---|
| `/create` | drafts owned by the caller; the review queue when the caller is a reviewer |
| `/create/new` | seed picker: blank · candidate triple · PGN · completed run · new version |
| `/create/draft/:draftId` | editor, lint panel, regression panel, playtest and submit |
| `/create/draft/:draftId/review` | the derived checklist |

`AppRoute` gains `{ name: "createDraft", draftId }` and
`{ name: "createReview", draftId }`; `routePath` and `parseRoute` are extended
symmetrically and covered by `router.test.ts`.

#### 13b. Editor

Three panes. A JSON text editor; a lint panel listing every
`PackValidationIssue` as `severity · path · code · message` with the path
clickable to select that region; and an action bar with Playtest, Run
regressions, and Submit for review. Submit is disabled while any error exists,
with the reason named.

**No visual form builder.** `planning/content-era/log.md` records that one was
deliberately not built pending evidence that the command loop is the bottleneck,
and the measured evidence since points at playtesting instead. This RFC ships the
playtest loop and leaves the editor textual.

#### 13c. Review screen

One row per checklist pointer, each rendering the pointer, the actual value from
the document, the surrounding context (for `/deviations/N/class`: the anchor
spine node, the move in SAN, the note, and the plan class named by
`planClassId` when present), Accept/Reject, a grounds selector, and a note field.
Approve is disabled until every row is accepted. A "Play this draft" action opens
a playtest run.

#### 13d. Capabilities

`SURFACE_IDS` (`capabilities.ts:32-41`) gains `"review"`. `surfaces()`
(`capabilities.ts:117-129`) reports `create: "available"` — authoring works on any
deployment — and `review: TABIYA_REVIEWERS` non-empty ? `"available"` :
`"unavailable-here"`. `assertSurfaceCapabilities` keeps the key set exact, and the
web `SurfaceId`/`PLANNED_SURFACES` union in `api.ts:158-176` is updated in the same
change so the two hand-maintained lists cannot drift (the D4 shape). If
`defect-sweep` has landed, its shared-constant treatment of duplicated
vocabularies applies to this pair as well and the duplicate list is bound by an
equality test rather than by hand.

### 14. The three authoring frictions

`design/BACKLOG.md` §Authoring-format friction records three, each raised with
content in hand. This RFC fixes one and surfaces two, on a single rule: **grow the
format only where a consumer grows with it.**

#### 14a. Fixed — a deviation may name its plan class

Pack B: 11.a3 and 11.Rab1 are literally the same plan and `accepted_alternative`
says nothing about that. Add an optional `planClassId` to
`$defs/deviation` in `schemas/drill_pack.schema.json` (whose
`additionalProperties` is `false`, so this requires the schema change), a matching
optional field on `Deviation` in
`packages/schema/src/drill-pack/types.ts`, and the `DEVIATION_PLAN_CLASS_UNKNOWN`
error in §7. The schema `$id` moves `urn:chess-tabiya:schema:drill-pack:0.7` →
`:0.8` and `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts:2`) with it,
following the same handling `defect-sweep` §7 specifies for 0.4 → 0.5; the
assertions in `packages/schema/src/drill-pack.test.ts:49-56` move with them.
Existing packs are unaffected: the property is optional and purely additive, so no
existing document's bytes, canonicalization or digest change, and no sidecar
`packDigest` in `content/candidates/` is invalidated.

It has a consumer *in this RFC*: §13c's checklist row for
`/deviations/N/class` renders the plan the author says the deviation belongs to,
which is exactly the evidence a reviewer needs to judge whether
`accepted_alternative` or `concept_violation` is the right label. It is a link
between two id spaces the schema already owns, not a judgment.

**It is deliberately not added to the delivery surface.** `AuthoredFeedbackItem`
does not gain `planClassId`. Plan classes reveal only through
`planClassSourceIds` (`authored-feedback.ts:210-217`), gated on their
intent-capture checkpoint; cross-linking a deviation to a plan class in the
delivered payload would create a second reveal path that bypasses that gate and
leak a plan class earlier than its checkpoint. `planClassId` is authoring and
review metadata only.

#### 14b. Surfaced, not fixed — intent-relative success

Pack B: a plan drill's objective is relative to the intent the learner captured,
and `successConditions` supports only intent-blind `reach_checkpoint`, so the pack
shipped with no objective at all. Fixing this needs a **recording site** for the
learner's choice, and there is none: `CheckpointSheet.svelte` renders revealed
plan-class prose but offers no plan control, and no run event type carries a
choice (`packages/runtime/src/types.ts:200-213`). Adding an intent-conditional
success condition now would add a second unevaluated objective vocabulary beside
`preserve_plan_window`, which is the exact failure this repo has already paid for
twice.

The studio's contribution is the `INTENT_CAPTURE_HAS_NO_RECORDING_SITE` warning
(§7): an author is told at encoding time that the field is half-inert, instead of
discovering it in a field-consumer audit after spending the minutes. The
capability belongs to program item #4 with a durable interaction record; a
BACKLOG row is proposed below.

#### 14c. Surfaced, not fixed — `concept_violation` doing two jobs

Pack B used it both for a timing error (11.e4, right idea, wrong moment) and a
plan-coherence error (14.Na4, removing the piece that supports your own break).
Pack B's own note says the format should not grow a class until more packs confirm
the split, and two instances from one author is not that.

The review queue is where this is actually caught, and this RFC puts it there:
`/deviations/N/class` is a **mandatory per-item sign-off**, rendered beside its
note and its plan class, with a reviewer note required to reject. Pack A's
castling deviation — `class: concept_violation`, note: "is not a blunder" — is a
contradiction no evaluation in this system can detect and a reviewer reads in one
line. Splitting the enum before a reviewer has ever rejected one of these would be
designing the fix ahead of the evidence.

### 15. Error codes

New `ServerErrorCode` values in `apps/server/src/errors.ts`, with the status
mapping added to `errorResponse` (`rest.ts:353-378`):

| Code | Status |
|---|---|
| `DRAFT_NOT_FOUND` | 404 |
| `DRAFT_STALE` | 409 |
| `DRAFT_LOCKED_FOR_REVIEW` | 409 |
| `DRAFT_STATE_INVALID` | 409 |
| `DRAFT_LIMIT_REACHED` | 409 |
| `PROVENANCE_STATUS_NOT_WRITABLE` | 422 |
| `PROVENANCE_REVIEWERS_NOT_WRITABLE` | 422 |
| `GRADUATION_BLOCKERS_OUTSTANDING` | 422 |
| `REGRESSION_FAILED` | 422 |
| `REVIEW_UNCONFIGURED` | 403 |
| `REVIEW_SELF_NOT_PERMITTED` | 403 |
| `REVIEW_SUBJECT_STALE` | 409 |
| `REVIEW_CHECKLIST_INCOMPLETE` | 422 |
| `REVIEW_POINTER_UNKNOWN` | 422 |
| `PACK_ID_RESERVED` | 409 |
| `PACK_VERSION_EXISTS` | 409 |
| `PACK_VERSION_NOT_INCREASING` | 422 |
| `IMPORT_INVALID` | 422 |

Every body carries the existing `{error:{code,message,...details}}` shape, and
validation failures carry the full `PackValidationIssue[]` in `details.issues`
with JSON Pointer paths, matching `PackRegistry`'s existing `PACK_INVALID` detail
shape (`pack-registry.ts:91-102`).

### 16. Documentation

`docs/pack-studio.md` is created: the three content locations, the write path and
its invariants, distillation's extract/refuse boundary, the review state machine
and checklist derivation, versioning, and export. `docs/drill-pack-format.md`
records the v0.8 `planClassId` addition and the three new lint codes, in the
style of its existing `## v0.4 Line Drill contract` section and after the v0.5, v0.6 and
v0.7 sections the parallel drafts add.
`docs/development.md` records `make draft-import`, `make pack-export`,
`TABIYA_REVIEWERS`, and `review.json` joining the sidecar list.
`docs/branch-runtime.md` records digest-addressed pack resolution.
`docs/content-sourcing.md` records that `draft-import` is the candidate's exit.

## Deviations from design

1. **`design/03` lists "study/repertoire/game/session imports" as distinct
   importers; this RFC ships one PGN importer plus candidate and interchange
   ingestion.** A Lichess study exports as PGN, so a separate study importer would
   mean pinning an unversioned web API and inventing a second format. The surface
   promised — importing a study as a pack seed — works; the mechanism is one
   importer.
2. **`design/03` §Create lists "strong-player review"; this RFC specifies
   deployment-configured reviewers.** Strong-reviewer recruitment is research queue
   9 and is a staffing question, not a mechanism. The mechanism is neutral about
   how strong the configured reviewer is and records who they were.
3. **`design/03` §Stable application shell puts "review queue" under Create.**
   Honoured, with one addition: `review` becomes a capability surface so a
   deployment can honestly report that approval is unconfigured, rather than
   showing a queue nobody can act on.

## Acceptance criteria

1. `make verify` and `make test-browser` pass; no test is retried or skipped.
2. **Migration.** A database at `STORAGE_VERSION` 8 migrates to 9 with all four
   tables present and no existing row altered; a database already at 9 is a no-op;
   a database at 10 still fails with the existing newer-schema error. A database at
   5 migrates through 6, 7 and 8 to 9 with every intervening body intact.
3. **Digest-addressed resolution (regression for the §3 defect).** A run is
   started against pack `p@1.0.0`; `p@1.1.0` is then registered; the in-flight run
   still fires checkpoints, still transitions its objective, still returns authored
   feedback, and still exports pack-aware PGN. The same test asserts the pre-fix
   behaviour is gone by checking that `byDigest` resolves the superseded version
   while `list()` does not contain it.
4. **`reviewStatus` cannot be author-written.** `POST /packs/drafts` and `PUT` with
   `provenance.reviewStatus: "reviewed"` return `PROVENANCE_STATUS_NOT_WRITABLE`;
   with a non-empty `reviewers`, `PROVENANCE_REVIEWERS_NOT_WRITABLE`. A draft that
   never passes review can reach no state in which any endpoint serves it from
   `GET /packs`.
5. **Review authorization.** With `TABIYA_REVIEWERS` unset, every review endpoint
   returns 403 `REVIEW_UNCONFIGURED`. With the draft owner as the only configured
   reviewer, approval returns 403 `REVIEW_SELF_NOT_PERMITTED`. With a second
   configured learner, approval succeeds.
6. **Checklist derivation.** For a draft containing an objective summary, two plan
   classes with descriptions, three spine annotations, four deviations with notes,
   one feedback claim and an authored root assessment, the derived checklist
   contains exactly the expected pointer set; approving with any one pointer
   missing returns `REVIEW_CHECKLIST_INCOMPLETE` naming it; a pointer outside the
   set returns `REVIEW_POINTER_UNKNOWN`.
7. **Signature is digest-scoped.** After approval, one `PUT` returns the draft to
   `draft` and `register` returns `REVIEW_SUBJECT_STALE`.
8. **Registration gate.** Registration is refused, each identifying its own cause,
   for: a pack whose `start.side` is absent (schema stage, inherited); a pack
   declaring `perfect_tablebase` (runtime stage, inherited); a pack declaring
   `immediate_blunder_guard` (schema stage, inherited); a pack with non-empty
   `graduationBlockers`; a pack with an ungrounded `syzygy` assessment; a
   seed-registry pack id; a non-increasing version; a failing
   regression case. The three inherited cases are asserted here as well as in
   `defect-sweep`, because "the schema already refuses it" is a claim about a
   composition this RFC introduces and must therefore prove at this boundary.
9. **Round trip (required by the brief).** One server-level test carries a real
   committed candidate — `content/candidates/d35-queen-s-gambit-declined-exchange-variation`
   — end to end: `draft-import` → author edits that clear every graduation blocker
   → playtest run that fires the candidate's checkpoint → submit → a second
   learner's review signing every derived pointer → register → the pack appears in
   `GET /packs`, `GET /packs/:id` serves it with `reviewStatus: "reviewed"` and one
   reviewer, `GET /packs/:id/export` returns bytes that hash to the registered
   digest, and the recomputed `{...draft, provenance:{...}}` transform reproduces
   that digest exactly.
10. **Session distillation.** Distilling a run with one fork produces: a spine
    whose mainline equals the selected branch and whose fork appears as a sibling;
    exactly one deviation *proposal* with no `class`; zero entries in
    `deviations`, `annotations`, `planClasses`, `feedbackClaims`; an
    `objective.summary` equal to the stated mechanical placeholder;
    `graduationBlockers` naming all five assertion categories plus the sampled
    opponent line; and `provenance.sources` naming the run id, session digest, and
    the engine identities and `policyModeApplied` values actually recorded. A
    property test over generated runs asserts the distilled document always
    passes `validatePackDocument` structurally and always fails §4b's graduation
    gate.
11. **Import refuses to launder prose.** A PGN with comments and NAGs produces a
    draft whose document contains none of that text — asserted by searching the
    serialized document for each comment string — while the comments are returned
    as reference material.
12. **Lints.** `INTENT_CAPTURE_HAS_NO_RECORDING_SITE` fires on the schema fixture's
    intent-capture checkpoint and is a warning, not an error;
    `DEVIATION_PLAN_CLASS_UNKNOWN` is an error; `CONSTRUCTED_ROOT_UNVERIFIED` fires
    on Pack C's draft and not on Pack A's.
13. **Format amendment.** The schema `$id` is `:0.8` and
    `DRILL_PACK_SCHEMA_VERSION` is `"0.8"`; every pack in `content/candidates/`,
    `content/drafts/`, and `schemas/` still validates; `digestDrillPack` over every
    committed pack returns the digest recorded in its sidecar where one exists, and
    the digest of `schemas/drill_pack.example.json` is unchanged.
14. **Sidecar list.** `review.json` is in `SIDECAR_BASENAMES`; `checkPackFile`
    rejects it with `PACK_FILE_IS_RESERVED_SIDECAR_NAME`; a directory containing
    `pack.json` + `review.json` loads exactly one pack.
15. **Browser test (required by the brief).** A Playwright test in
    `tests/browser/` registers two learners on a deployment configured with the
    second as reviewer, and: author navigates to `/create`, creates a draft from a
    seed, sees a lint error and fixes it, playtests the draft and plays one move
    that fires its checkpoint, submits it; reviewer opens `/create`, sees the
    queue, opens the checklist, accepts every row, approves; author registers; the
    pack appears in `/library` with a reviewed status; and the author's attempt to
    approve their own draft is refused in the UI with the reason shown. The test
    asserts a draft never appears in the `/play` pack list.
16. **Documentation** in §16 lands in the same change; `rfc/README.md` carries the
    Active row, migration 9, and the pack-schema-version claim (§0), and the
    migration register records migration 9 against this RFC before any code is
    written.

## Proposed BACKLOG rows (owner-tier; not implementer work)

Per RFC-0000's agent rule, the implementer must not edit `design/`. Proposed rows
for the owner:

1. **Authoring-format friction table** — mark the `planClassId` row `📜 RFC` naming
   this RFC §14a; annotate the intent-relative-success row "surfaced by
   `INTENT_CAPTURE_HAS_NO_RECORDING_SITE`; blocked on a durable interaction record
   (program #4)"; annotate the `concept_violation` row "handled by mandatory
   reviewer sign-off on `/deviations/N/class`; enum split deferred pending a
   reviewer rejection that the split would have prevented".
2. **New defect row** — *a superseded pack digest silently un-orchestrates its
   in-flight runs* (`service.ts:621-625` with `service.ts:252,276`), closed by this
   RFC §3. It is latent today and becomes live the moment a second version of any
   pack can exist.
3. **New row** — *durable checkpoint-interaction record*: intent capture and
   prediction both need a run event carrying the learner's choice before either
   can be graded. Names program #4 and the `INTENT_CAPTURE_HAS_NO_RECORDING_SITE`
   warning as the evidence.
4. **New row** — *pack contribution across deployments*: `review.json` travels as
   provenance but confers no status; a cross-deployment trust model (signed
   reviewer identity, federated rosters) is undesigned and touches Q2.
5. **B6 gate row** — update `design/03` §Breadth-complete gate B6 once implemented.

## Open questions

**Owner ruling required: the reviewer roster.** `docs/identity-and-authorization.md`
states that a learner "owns no deployment-wide privileges" and that "there is no
operator or administrator account", yet approval is exactly a deployment-wide
privilege. §10a specifies a deploy-time `TABIYA_REVIEWERS` handle list, fail-closed
when unset, with self-review refused unconditionally — matching the operator
boundary `docs/content-sourcing.md` already establishes for explorer credentials.
Two points need the owner, because both are product decisions rather than
mechanism:

1. Is a deploy-time roster the right shape, or should it be a per-pack grant
   (author invites a reviewer, as runs invite spectators) or a first-registered-
   learner privilege? A per-pack grant would let authors choose their reviewers,
   which is closer to how the content-era pipeline actually works but weaker as a
   catalogue-quality guarantee.
2. Is it *intended* that a solo self-hoster with one account can author, playtest
   and use packs but can never mark one `reviewed`? This RFC says yes, on ADR-0001
   and §3b grounds — a second judgment is the whole point of the graduation bar —
   and accepts that it makes `reviewed` unreachable for single-account
   deployments.

No other question is open.

## Changelog

- 2026-08-13: created. Re-verified the absent surface against the tree (no non-GET
  `/packs` route, empty `content/packs/`, `/create` an honest empty state) and the
  measured 43% playtest friction against `design/BACKLOG.md`'s "Pack interop" row.
  Found and specified the fix for a latent defect the write path would make live:
  a run whose pack digest is superseded silently stops being orchestrated
  (`service.ts:621-625` with `:252,276`). Withdrew a drafted
  `CHECKPOINT_SET_EMPTY` registration gate on verifying that
  `schemas/drill_pack.schema.json` already carries `minItems: 1`. Rebased twice
  against parallel drafts: pack schema 0.6 → 0.7 → **0.8** (resolving the register's
  recorded 0.6 contention with `return-and-progression.md` rather than merging
  bumps), and migration 6 → 7 → 8 → **9** as `n-way-comparison.md`,
  `live-session-platform.md` and `return-and-progression.md` claimed those numbers.
