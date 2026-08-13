# RFC: Pack studio, write path, and publication channels

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-13
- **Design refs:** `design/03-product-breadth.md` §Create and curate, §Breadth-complete
  gate B6, §Provisional foundations-first RFC program item 6;
  `design/04-content-architecture.md` §8 production model;
  `design/00-thesis.md` §Target player (on-ramp knobs)
- **Exploration gate:** owner ruling 2026-08-12 opening the exploration gate
  (`rfc/README.md` §Active); breadth sequencing ruling 2026-08-11
- **Migration:** **9**, claimed in `rfc/README.md`'s register. The shipped value is
  `STORAGE_VERSION = 5` (`apps/server/src/storage.ts:147`); 6, 7 and 8 are claimed by
  `n-way-comparison.md`, `live-session-platform.md` and `return-and-progression.md`, so
  this RFC's DDL appends after theirs and §0's rebase rule applies if any of them does
  not land. Create-table and create-index only; no existing row is read or written and
  `DRILL_RUN_SCHEMA_VERSION` is untouched, so it needs no freeze rule. See §2.
- **Depends on:** **`rfc/defect-sweep.md`** and **`rfc/return-and-progression.md`** (see §0 —
  they own pack schema v0.5 and v0.6, and the sweep closes D6, D8 and D9, three conditions
  this RFC's registration gate would otherwise have to re-specify),
  `rfc/archive/content-sourcing-foundation.md` (artifact triple,
  `sourcing-check`, licence encoding), `rfc/archive/learner-identity-and-authorization.md`
  (the subject), `rfc/archive/pack-optional-runs.md` (pack-optional run identity),
  `rfc/archive/authored-explanation-surface.md` and
  `rfc/archive/authored-feedback-delivery.md` (per-scope reveal)
- **Parent / amends:** amends `rfc/archive/drill-pack-format.md` in **one** bounded place
  (§10a, `provenance.reviewStatus` narrowed and `provenance.reviewers` removed — schema
  `$id` **0.7 → 0.8**; the shipped `$id` is `:0.4`, see §0). A second amendment,
  optional `deviations[].planClassId`, was drafted and **withdrawn on review** — §14a
  records why.
- **Supersedes / superseded by:** —
- **Owner rulings applied:** **no pack review workflow, ever** (2026-08-13 ruling 1,
  `planning/exploration/log.md:1231-1262`) — ADR-0001's "reviewed" half is superseded and
  continuation gate C1 is withdrawn. The publication channel is this RFC's mechanism for
  that ruling's "they ship with honest provenance", and is already recorded as the
  replacement in `planning/content-era/plan.md` §3b; it is not itself a separate ruling
  and the owner may replace it with another honest origin label without reopening ruling 1.
- **Planning:** `planning/pack-studio/` (once implementing)

## Summary

B6's mining half is met: `candidate-emit` has produced four real unpublished
candidates in `content/candidates/` through the shipped sourcing pipelines. The
other half — how a candidate, an import, or a completed run becomes a *served*
pack — does not exist at any layer. `apps/server/src/rest.ts` has no
non-GET `/packs` route; `content/packs/` is empty; `/create` is an honest empty
state (`apps/web/src/App.svelte:341-355`). This RFC specifies the pack studio,
the draft→registered write path and its safety invariants, session distillation,
PGN/candidate/interchange imports, versioning, export, and the **publication
channel** that replaces the approval gate the owner struck on 2026-08-13. It
reuses the shipped validator, RFC-8785 digest, registry, sourcing checks and
orchestrator rather than building a second authoring stack, and it closes one
live defect the write path would otherwise make dangerous: a run whose pack
digest no longer matches the registry silently stops being orchestrated (**D20**).

**The ruling this draft was rebuilt around.** There is no pack review workflow and
there never will be one. A sign-off gate nobody performs is worse than an honest
label, because a status nobody can grant implies a check that never happened. What
replaces it is a fact the server can actually assert: **where a pack came from**.
An *official* pack ships in the repository or the image; a *community* pack is
published through this studio. The channel is not a claim about quality and does
not pretend to be one.

## Motivation

### What is verified absent

| Capability | Verified state |
|---|---|
| Pack write endpoint | `rest.ts:521-545` handles `GET /packs` and `GET /packs/:id` only; `parseRunRoute` (`rest.ts:391-403`) covers no pack route |
| Served pack catalogue | `PackRegistry.loadDefault` (`pack-registry.ts:224-271`) reads the schema fixture, `content/packs/` (empty but for `.gitkeep`) and, in development only, `content/drafts/` |
| Studio UI | `/create` renders "Pack authoring, imports, review, and session distillation arrive in program item 6" (`App.svelte:341-355`); `capabilities.ts:117-129` reports `create: "unavailable-here"` |
| Session distillation | no code anywhere; `design/03` lists it under Live and Create both |
| Publication channel | nothing anywhere distinguishes a first-party pack from a contributed one. `PackSummary` carries `reviewStatus` and nothing else about origin (`pack-registry.ts:33,208`), and the client renders that string raw (`PackList.svelte:35`, `App.svelte:359`) |
| `reviewStatus` consumers | exactly two: `pack-validation.ts:87-109` (requires non-empty `sources` **and** non-empty `reviewers` when the value is `reviewed`/`published`) and `sourcing/check.ts:216` (`CANDIDATE_ALREADY_PROMOTED`). Every committed pack is `draft` or `schema_example`; no committed document is `reviewed` or `published` |
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

One further finding shapes the specification. Pack C's `still-holding` checkpoint
was true at the root, so the one authored `hold` pack was never playable (D12,
closed by `outcome-drill-grading`); nobody discovered that until an RFC executed
it, because nobody had played it. Execution found it and reading did not — which
is why the playtest harness (§8) and the regression set (§9) are the two
mechanisms this RFC ships in place of a reading pass.

### The grounding reality

`sourcing/check.ts:122-124` encodes a permanently human-only set mechanically: any
machine evidence record whose `supports` pointer matches `PROSE_POINTERS`
(`check.ts:30-36`: `/objective/summary`, `/planClasses/N/description`, spine
`annotations`, `/deviations/N/note`, `/feedbackClaims/N/text`) or matches
`/deviations/N/class` is rejected with `EVIDENCE_OVERREACH`. Pack A marks castling
a `concept_violation` while its own note says it "is not a blunder", and no
evaluation in this system separates those.

The previous draft of this RFC concluded from that gap that a review queue was the
only honest path to publication. **The owner ruled otherwise on 2026-08-13, and the
ruling is right about the mechanism this repo can actually operate.** A sign-off
gate nobody performs does not close the gap; it hides it behind a status. Pack A
already states in plain text that its claims are agent-authored and unvalidated,
and that statement *is* the safeguard. So the gap stays visible instead:

- the pack's own `provenance.graduationBlockers` names what is not yet grounded, in
  the author's words, and registration refuses a pack that still carries any (§4b);
- the **channel** (§10) tells the learner where the pack came from — a fact — rather
  than whether someone vouched for it — a claim this system cannot support;
- nothing anywhere asserts that a pack was checked.

ADR-0001's curated-first half stands and Law 8 bounds the whole surface: any
authoring assist may word validated evidence and may never create a strategic claim
or grade a move. ADR-0001's "reviewed" half is superseded by the ruling and marked
so in `design/BACKLOG.md`.

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

**The shipped coordinates are 0.4 and 5, not 0.7 and 8.** `schemas/drill_pack.schema.json`'s
`$id` is `urn:chess-tabiya:schema:drill-pack:0.4` and `DRILL_PACK_SCHEMA_VERSION`
(`packages/schema/src/index.ts:2`) is `"0.4"`; `STORAGE_VERSION` (`apps/server/src/storage.ts:147`)
is `5`. Every number between those and this RFC's is claimed by a draft that has not landed.
The claims below are register bookkeeping, not statements about the tree, and the rebase rule
at the end of this section is what makes them safe to write down.

`rfc/README.md`'s pack-schema-version register records a **contention on 0.6** between this
RFC and `return-and-progression.md`, and offers two resolutions: one rebases to 0.8, or the
two merge their bump. **This RFC takes 0.8.** Merging the bumps would couple two unrelated
additions — `retryVariants`/`concepts` for scheduling, the `provenance` narrowing for
authoring — into one version whose meaning is "whichever of these
landed", and the register's own note
says a pack version rebases cheaply because pack digests are content digests unaffected by
the `$id`. The cheap move is the right one, and the contention is resolved here rather than
left for the implementer.

| Resource | Shipped | Claimed by | This RFC takes |
|---|---|---|---|
| pack schema version | **0.4** | `defect-sweep.md` → **0.5**; `return-and-progression.md` → **0.6**; `trajectory-drill.md` → **0.7**; `n-way-comparison.md` → **0.9** | **0.8** |
| database migration | **5** | `n-way-comparison.md` → **6**; `live-session-platform.md` → **7**; `return-and-progression.md` → **8** | **9** |

`n-way-comparison.md`'s **0.9** claim is downstream of this one and is not a contention: it
removes `grading` from `$defs/checkpointInteraction`, which this RFC does not touch.
`objective.grading.assessedBy` — the field §4b's syzygy condition reads through
`assessmentGrounding` — is a different pointer and survives that draft.

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

- `n-way-comparison.md` adds `Branch.origin: "played" | "simulated"`, which after that
  draft's own 2026-08-13 rework is a **promotion marker**: a simulated branch is scratch
  until the learner enters it, and a branch that reaches persistence with
  `origin: "simulated"` is one the learner entered whose moves are still the pack's own
  authored line. Session distillation must respect it or it will manufacture deviations out
  of authored content (§6).
- `return-and-progression.md` adds `retryVariants` and types `concepts` in pack schema 0.6.
  Both are structure, neither is a prose assertion under `PROSE_POINTERS`, and neither
  interacts with this RFC's registration gate.
- `trajectory-drill.md` adds `legs` in pack schema 0.7. A leg boundary is structure too. A
  leg carrying authored prose is an ordinary authored assertion and belongs in the pack's
  own `graduationBlockers` like any other, which is where §4b reads it.

One row in `defect-sweep`'s proposed backlog is a live constraint on this RFC's never-silent
guarantee and is named here so it is not mistaken for a gap this RFC introduced:
`$defs/opponentPolicy` is `additionalProperties: true`
(`schemas/drill_pack.schema.json:496`), so an author can write a policy field
nothing reads and hear nothing. This RFC's closed-record parsing (§4) covers the *request
envelope*, not the pack document's own open objects; that residue belongs to the sweep's row.

Three objects in the pack schema are open, and only one of them is harmless. The document
root is `additionalProperties: false` (`:72`), but `$defs/opponentPolicy` (`:496`),
`$defs/feedbackClaim` (`:580`) and **`provenance` (`:598`)** are open. `provenance` is the
one this RFC has to answer for, because §10a's whole argument is "there is no channel field
to forge" — and an open object means an author can *invent* one. §13c closes that with a
rendering allow-list rather than a schema change, since narrowing `provenance` would rewrite
every committed document that carries `licence` or `graduationBlockers`.

### 1. Three content locations, one schema — and the channel boundary

| Location | Contents | Written by | Served | Channel |
|---|---|---|---|---|
| `content/packs/`, `schemas/drill_pack.example.json` | **seed catalogue**: packs shipped in the image and in git | humans, through git | always | **official** |
| `content/drafts/` | file workspace for `pack-check`/`pack-preview` | the existing CLIs | **development only** | **official** (see below) |
| `content/candidates/` | `candidate-emit`/`sourcing-check` workspace | the existing CLIs | never | — (not served) |
| SQLite `pack_drafts` / `registered_packs` | the studio's drafts and everything it registers | this RFC's endpoints | registered packs always; drafts never | **community** |

**`content/drafts/` is official, and that is not a loophole.** `PackRegistry.loadDefault`
loads `content/drafts/` and any `--draft-file` into the *same* record map as the fixture and
`content/packs/`, in development only (`pack-registry.ts:237-256`, wired at
`application.ts:265-269`). The channel is derived from which source resolved a pack (§10a),
so those records are stamped `official` — correctly, because the assertion `official` makes
is "this deployment's operator put these bytes here", and a local operator running
`make pack-preview` on their own file has done exactly that. No production deployment serves
them (`development !== true` yields an empty draft path list), and no request can add one:
`draftFile` is a process option, not a body field. The earlier draft's table called this row
"not published", which contradicted §10a; the contradiction was in the table, not the code.

**The server never writes to `content/`.** That sentence was a safety note in the
previous draft; under the channel ruling it is the channel boundary itself. The only
writer of the official channel is a git commit into the image — an act outside this
process, performed by whoever controls the repository. Registration writes a database
row, and a database row is community by construction. Leaving the deployment is an
explicit export (§12) followed by a human commit, and that commit — not any endpoint —
is the sole path from community to official.

**Seed ids are reserved.** Registration rejects any pack id present in the seed
registry with `PACK_ID_RESERVED` (409), and additionally rejects the route-reserved
literal `drafts` (§4). A self-hoster who ships packs in git updates them in git.

**But reservation is a check at one instant, and the seed registry is mutable**, so
"disjoint id spaces" is not something registration alone can guarantee. The pack id
grammar is `^[a-z0-9][a-z0-9-]*$` (`schemas/drill_pack.schema.json:78-80`) with no
namespace, so a later git commit can introduce an official pack whose id a community pack
already holds — the reservation ran before that commit existed. Resolution is therefore
specified, not assumed: **the seed source always wins `get()` and `list()`**. A community
row whose id has been taken over by a seed pack stops being browsable, stays resolvable by
`byDigest` forever so its in-flight runs finish (§3), and the collision is logged at
startup with both digests. Nothing is deleted and nothing is silently served under the
wrong channel. The alternative — refusing to start — would let any community registration
brick the next deployment.

### 2. Storage — migration 9

`STORAGE_VERSION` → 9 (`storage.ts:147`, shipped value `5`), appended to the migration
list at `storage.ts:915-941` in the established shape. Claimed in `rfc/README.md`'s
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
  owner_learner_id TEXT NOT NULL REFERENCES learners(id),
  document_json TEXT NOT NULL,
  digest TEXT NOT NULL,
  ledger_json TEXT,
  manifest_json TEXT,
  state TEXT NOT NULL CHECK (state IN ('draft','registered','withdrawn')),
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

-- Every document a playtest run was created against, by digest. Retained so an
-- edit to the draft cannot orphan an earlier playtest run (§3, §8).
CREATE TABLE playtest_documents (
  digest TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL REFERENCES pack_drafts(id),
  document_json TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE registered_packs (
  pack_id TEXT NOT NULL,
  version TEXT NOT NULL,
  digest TEXT NOT NULL UNIQUE,
  document_json TEXT NOT NULL,
  ledger_json TEXT,
  manifest_json TEXT,
  publisher_handle TEXT NOT NULL,
  publisher_learner_id TEXT NOT NULL,
  draft_id TEXT NOT NULL REFERENCES pack_drafts(id),
  registered_at TEXT NOT NULL,
  PRIMARY KEY (pack_id, version)
) STRICT;
CREATE INDEX registered_packs_digest ON registered_packs(digest);
```

`ledger_json` and `manifest_json` are on `pack_drafts` as well as on
`registered_packs` because §4b's `SYZYGY_ASSESSMENT_UNGROUNDED` condition runs
`assessmentGrounding(...)` against the draft's sidecars at registration time and §5
accepts them on the seed body; a draft that could not hold them would make that
condition unevaluable. They are the same two sidecars `PackRegistry.loadDefault`
reads from disk (`pack-registry.ts:259-265`), carried in columns instead of files.

**No foreign key uses `CASCADE` or `RESTRICT`, and that is load-bearing.** The
earlier draft had `owner_learner_id ... ON DELETE CASCADE` alongside
`draft_id ... ON DELETE RESTRICT`. `PRAGMA foreign_keys = ON` is set
(`storage.ts:307`) and `deleteLearner` ends in `DELETE FROM learners WHERE id = ?`
(`storage.ts:637`), so the cascade would try to delete the learner's drafts, the
restrict would refuse for any draft that had been registered, and the *whole*
`deleteLearner` transaction would roll back: **a learner who had ever published a
pack could never delete their account**, and the failure would surface as
`STORAGE_FAILURE`, not as anything a caller could act on. Plain references plus the
explicit reassignment below reproduce the behaviour the rest of `deleteLearner`
already uses.

**There is no `channel` column, deliberately.** Every row in `registered_packs` is
community and every pack outside it is official; storing the channel would create a
second source of truth for a fact the table already is, and a column is something a
future bug can set wrongly. §10 derives the channel from which source resolved the
pack.

`publisher_handle` is the learner handle at registration time, denormalised so a
published pack keeps an attributable origin after the account is gone. It is a
statement about who pressed register, not about who vouched for the chess.
`publisher_learner_id` is separate from it and is not a display value: it is what
§4a invariant 6a compares to decide who may publish the next version of a pack id,
and it must not move when a learner renames themselves.

The migration creates tables and indexes only; it backfills nothing, because no
prior state exists. It reads no run snapshot, calls no runtime function, rewrites
no `drill_runs` row, and leaves `DRILL_RUN_SCHEMA_VERSION` untouched, so it needs
no freeze rule and cannot mis-stamp anything. Existing databases gain three
empty tables. It touches no column any of migrations 6–8 writes, so the bodies are
independent as well as the numbers.

**Account deletion.** `deleteLearner` reassigns owned runs and held leases to the
`__legacy` sentinel and then deletes the `learners` row (`storage.ts:610-648`,
`docs/identity-and-authorization.md`). Because `pack_drafts.owner_learner_id`
references `learners(id)` with the default `NO ACTION` and foreign keys are enforced
(`storage.ts:307`), that final delete fails unless the referencing rows move first.
So in the same transaction, **before** the `DELETE FROM learners`:

- every non-`registered` draft owned by the deleted learner is set to `withdrawn`;
- every draft owned by them — `withdrawn` and `registered` alike — has
  `owner_learner_id` set to `__legacy`, the same sentinel the runs take. A draft is
  private work rather than a shared artifact, so this is a tombstone and not a
  handover: `__legacy` cannot authenticate, so nobody inherits read or write access;
- `registered_packs.publisher_learner_id` is set to `__legacy` for their rows, which
  makes the pack ids they published permanently unclaimable rather than claimable by
  the next registrant. `publisher_handle` and every other column are untouched: a
  published pack's origin must not be erasable by deleting an account, and the row is
  the only remaining record of it.

`registered_packs` and `playtest_documents` rows are never deleted by any code path
in this RFC, which is what makes `byDigest` total over everything a run can point at
(§3).

### 3. Digest-addressed pack resolution — D20 (defect fix, prerequisite)

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
`PackCatalogue` composes the seed `PackRegistry`, a `PackStore` over
`registered_packs`, and a `PlaytestStore` over `playtest_documents` (§8).
`RunService`'s `packRegistry` option is retyped to `PackSource`; the two other call
sites, `packs()` and `pack()` (`service.ts:383,387`), use `list()` and `required()`
and are unchanged.

`byDigest` must be **synchronous and durable**, not a process-lifetime cache.
`node:sqlite` statements are synchronous, so `PackStore.byDigest` and
`PlaytestStore.byDigest` are a prepared `SELECT` by primary key, a `JSON.parse` and
the same `PackRecord` construction the registry performs — `feedbackPolicy`,
`assessmentGrounding(...)` over the row's stored `ledger_json`/`manifest_json`, and
the stored `digest` rather than a recomputed one (`digestDrillPack` is async and is
called only on write). A restart, a second process against the same database file, or
a database moved between deployments therefore resolves exactly the same set. An
in-memory map would have re-introduced D20 at every restart.

`list()` returns the seed summaries plus the **highest registered semver per pack
id**, each built by the same `PackSummary` construction the registry already uses
(`pack-registry.ts:201-209`) so registered packs carry `phase` from the moment
`defect-sweep` §4a adds it and the Learn IA does not have to special-case the
studio's output. `get(packId)` resolves the same way, **seed source first** (§1).
Superseded versions stay resolvable by digest but do not appear in `GET /packs`.
`playtest_documents` is reachable through `byDigest` **only**: never `list()`, never
`get()`. That is not a tidiness rule — see §8.

Each composed source stamps the channel on the records it returns
(§10), so a `PackRecord` or `PackSummary` always carries where it came from and no
consumer has to infer it.

`POST /runs` keeps its existing stale-digest rejection (`service.ts:170`): a client
that asks for a specific digest that is not the newest is told so, rather than
being silently started on a different pack.

#### 3a. Digest-addressing is necessary and not sufficient — the residue must be loud

Digest-addressing closes the case D20 was found in: a superseded version, whose
document this RFC guarantees is retained forever (§2). It does **not** make
`byDigest` total, and three reachable cases remain where it returns `undefined` for
a genuine pack session:

1. **An official pack changed or was removed in git.** `content/packs/` and
   `schemas/drill_pack.example.json` are the one pack source this RFC does not
   control and cannot make append-only; the next image edits or deletes bytes and
   every in-flight run against the old bytes is unresolvable, permanently. This is
   the same defect, reached through the channel the RFC otherwise treats as
   trustworthy.
2. **A playtest run whose draft was edited.** `PUT` replaces the document and changes
   its digest, and edit-then-playtest-again *is* the authoring loop. Without
   `playtest_documents` (§2) the previous playtest run silently stops orchestrating
   the moment the author saves — a D20 recurrence this RFC would have introduced.
3. **A database restored, copied, or downgraded** so that a row a run points at is
   absent.

Case 2 is fixed by storage; cases 1 and 3 cannot be fixed by storage, because the
missing bytes are genuinely gone. So the second half of the fix is the never-silent
rule (D3), applied to the resolution failure itself:

> When `isPackSession(run)` and `byDigest(run.packDigest)` misses, the run is not
> orchestratable and no caller may be told otherwise.

| Call site | Today | After |
|---|---|---|
| `move` (`service.ts:252`) | skips `orchestratePackMove`, saves, returns success | throws `PACK_UNRESOLVABLE` (409) **before** `commitMove`, so no move is committed into a run that cannot grade it |
| `opponentPly` (`service.ts:276`) | same | same |
| `authoredFeedback` (`service.ts:448-458`) | throws `PACK_NOT_FOUND` | throws `PACK_UNRESOLVABLE` — the same event, one code |
| `pgn` (`service.ts:521-524`) | silently downgrades to `exportPgn` | throws `PACK_UNRESOLVABLE`; the pack-free exporter stays the path for genuine position sessions only |

The error body names the run id, the unresolvable digest and the pack id, because the
operator remedy for case 1 is to restore those bytes — into `content/packs/` for an
official pack, from the export bundle (§12) for a community one — after which the run
resumes with no data loss. `rewind`, `fork`, `graph`, `compare` and `events` are
unaffected: they read run state and never consult the pack.

This is what makes the fix a fix. Digest-addressing alone would have turned "the pack
moved" into "the pack is missing" and left the second one silent, which is the
defect. Both halves land together or neither closes D20.

This fix is independent of everything else in this RFC and of the channel ruling: it
is a latent defect in shipped code (**D20**, `design/BACKLOG.md:126`) that versioning
makes live, and it would be worth landing on its own.

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
| `GET` | `/packs/drafts` | drafts owned by the caller |
| `GET` | `/packs/drafts/:draftId` | document, digest, state, validation issues, proposals, regression cases |
| `PUT` | `/packs/drafts/:draftId` | replace the document (requires `If-Match`) |
| `POST` | `/packs/drafts/:draftId/lint` | validate a candidate document without saving |
| `POST` | `/packs/drafts/:draftId/playtest` | create a real run against the draft (§8) |
| `POST` | `/packs/drafts/:draftId/regressions` | replace the regression set |
| `POST` | `/packs/drafts/:draftId/regressions/run` | execute the regression set (§9) |
| `POST` | `/packs/drafts/:draftId/register` | `draft` → registered, community channel (§11) |
| `POST` | `/packs/drafts/:draftId/withdraw` | → `withdrawn` |
| `GET` | `/packs/:packId/versions` | registered versions with digests and publisher handles |
| `GET` | `/packs/:packId/export` | canonical interchange bundle (§12) |

`isApiPath` (`application.ts:206-217`) already matches `/packs` and `/packs/`
prefixes, so no static-serving change is needed.

**Route order is a correctness condition, not a style choice.** The shipped handler
matches `GET /packs/:id` as `request.method === "GET" && url.pathname.startsWith("/packs/")`
(`rest.ts:524`) and then extracts the id with `/^\/packs\/([^/]+)$/`
(`packIdFromPath`, `rest.ts:405-413`), returning 404 for anything with a further
segment. Added naively, **every route in the table above is dead**: `GET /packs/drafts`
would resolve as the pack whose id is `drafts` and 404, and `/packs/:packId/versions`
and `/packs/:packId/export` would 404 on the extra segment. So the draft routes and the
two two-segment pack routes are matched **before** the existing `startsWith("/packs/")`
branch, which becomes the fallthrough it already reads as.

That leaves one collision the ordering creates rather than removes: `drafts` is a legal
pack id under `^[a-z0-9][a-z0-9-]*$` (`schemas/drill_pack.schema.json:78-80`), so a pack
called `drafts` would be permanently unreachable at `GET /packs/drafts`. It is refused at
registration with `PACK_ID_RESERVED` alongside the seed ids (§1). No committed pack uses
it, so nothing in the tree changes.

#### 4a. Safety invariants

Every one of these is enforced server-side and each has a distinct error code.

1. **No write bypasses validation.** `PUT` and `POST /packs/drafts` run
   `validatePackDocument` on the submitted document and persist it together with
   its issues. A document with schema errors is still *stored* (an author must be
   able to save work in progress) but the draft cannot leave `draft`.
2. **`reviewStatus` is not author-writable.** Any submitted document whose
   `provenance.reviewStatus` is not `"draft"` is rejected with
   `PROVENANCE_STATUS_NOT_WRITABLE`. Only §11's registration transition writes
   `"published"`. This closes the hole `planning/content-era/plan.md` §3b names
   honestly ("nothing stops `reviewStatus` being flipped") for every path except a
   direct file edit in git — which is the official channel, and is git's problem.
   `provenance.reviewers` is removed from the schema at 0.8 (§10a); a document that
   still carries one is accepted as untyped extra metadata, and §10a removes the last
   two code paths that read it.
3. **The channel is not author-writable, because it is not in the document.** No
   field of `schemas/drill_pack.schema.json` names a channel and none is added. The
   channel is computed by `PackCatalogue` from which source resolved the pack (§10),
   so a community author has no channel field to forge and the server has no
   submitted value to trust. This is the strongest available form of invariant 2, and
   it is why the channel was not encoded as provenance. **It is not, by itself, a
   defence against forged origin claims**: `provenance` is an open object
   (`schemas/drill_pack.schema.json:598`) and `projectPackDocument` returns it whole
   (`pack-registry.ts:70`), so an author who cannot forge the field can still invent
   `"channel": "official"`, `"reviewedBy": …`, or `"endorsement": …` and have it
   served. Nothing in the *server's* channel computation reads any of it; what stops
   it reaching a learner as an origin claim is §13c's rendering allow-list, which is
   why that section is an obligation with an acceptance criterion rather than a UI
   note.
4. **Optimistic concurrency.** `PUT` requires `If-Match: <digest>` naming the
   digest the client last read. A mismatch is 409 `DRAFT_STALE` with the current
   digest in `details`. There is no lease: drafts are single-owner, and the real
   conflict is two tabs.
5. **Ownership.** Only the owner may read, `PUT`, playtest, register, withdraw, or
   edit regression cases on a draft. Nobody else may read a draft at all; a
   non-owner receives 404, matching the run-grant disclosure rule. There is no
   second role in this RFC.
6. **Registration is append-only and immutable.** `(pack_id, version)` is unique
   (`PACK_VERSION_EXISTS`, 409) and the submitted version must be strictly greater
   than every registered version of that id under semver precedence
   (`PACK_VERSION_NOT_INCREASING`, 422). No registered row is ever mutated.
6a. **A pack id belongs to its first publisher.** The version rule above is a rule
   about *numbers*, and on its own it is an impersonation route: pack ids are global
   and unnamespaced, so any learner could register `1.1.0` of another learner's
   `1.0.0` pack, and `get(packId)` — which resolves the highest version — would serve
   their document under the original author's title and version history to every
   learner browsing the catalogue. So registration additionally requires that either
   no version of that id exists, or the caller's learner id equals the existing
   `publisher_learner_id`; otherwise `PACK_ID_NOT_YOURS` (409). Comparison is by
   learner id, not handle, so a rename does not transfer a pack and a deleted account
   does not either (§2). There is no transfer endpoint: moving a pack between
   publishers is export plus a fresh id, or a git commit into the official channel.
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

**`GRADUATION_BLOCKERS_OUTSTANDING` is now the only content gate, and it is
author-declared.** An author can clear their own blockers without grounding anything,
and this RFC does not pretend otherwise. What it buys is that a pack cannot reach the
catalogue while still *saying in its own file* that it is ungrounded — a contradiction
between the served label and the served document. What stops a determined author from
lying is nothing, which is exactly what the channel exists to communicate: a community
pack carries no assertion that anyone checked it.

### 5. Seeds

`POST /packs/drafts` body: `{ seed, document?, ledger?, manifest? }`.

| `seed.kind` | `seed.ref` | Document source |
|---|---|---|
| `blank` | — | a minimal valid skeleton the server generates: caller-supplied `id`/`title`/`start`, `mode`, `objective.type: "play_until_checkpoint"` with a summary the author must replace, one `atPly` checkpoint, `feedbackPolicy: "delayed_checkpoint"`, `opponentPolicy.mode: "human_common"`, `provenance: {reviewStatus:"draft", sources:[]}` |
| `candidate` | candidate directory id | `document` = the candidate's `pack.json`, `ledger`/`manifest` = its `evidence.json` / `sources.json` |
| `pgn` | optional source URL | §5a |
| `run` | run id | §6 |
| `version` | `<packId>@<version>` | §11a |
| `interchange` | exporting deployment/URL, free text | an exported bundle from another deployment; `provenance.reviewStatus` forced to `draft` on ingest — **publication does not travel** (§12) |

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
   reproduce D9. `RunStart` is `{ fen, side }` and carries **no `movesSan`**, so every
   distilled document trips §7's `CONSTRUCTED_ROOT_UNVERIFIED` warning — correctly,
   since the root is a FEN the runtime was handed rather than a move list anyone
   replayed. For a pack-sourced run the distiller copies `start.movesSan` from the
   source pack when — and only when — the source pack's `start.fen` is byte-equal to
   `run.start.fen`, which restores the provenance the run type discards without
   asserting a derivation that was not performed.
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
     reused verbatim rather than re-invented;
   - **pack-sourced run in which no checkpoint fired** — the common case for an
     abandoned run, and the one that breaks the first rule: dropping every unreached
     checkpoint leaves `checkpoints: []`, which `schemas/drill_pack.schema.json:44-47`
     refuses with `minItems: 1`, so the distiller would emit a document that cannot be
     saved as anything but a permanently invalid draft. It falls back to the
     position-sourced rule above and names the substitution in `graduationBlockers`.
     The same fallback covers a run whose selected branch has zero learner plies,
     where the mechanical checkpoint would sit at ply 0: distillation is refused with
     `IMPORT_INVALID` and the reason, because a pack with nothing to play is not a
     seed for anything.
5. `difficulty.branchLengthTarget` = the selected branch's ply length when it
   falls inside the schema's 2–20 band (`schemas/drill_pack.schema.json:100-103`);
   omitted otherwise — a 40-ply run distils to a pack with no target rather than to
   an invalid one.
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
7. `provenance.reviewStatus: "draft"` and `graduationBlockers` enumerating the five
   `planning/content-era/plan.md` §3b assertion categories plus the opponent-line
   caveat and any substitution above.

**Extracted as proposals, outside the pack document:** every fork in the run
becomes a *deviation proposal* in `proposals_json`.

One exclusion, and it is not optional. `n-way-comparison.md` §7.4 adds
`Branch.origin: "played" | "simulated"`, where a simulated branch is the pack's
own authored line played forward by the simulate grid. After that draft's
2026-08-13 rework a simulated branch is scratch until the learner enters it, so a
persisted branch marked `"simulated"` is one the learner *chose to enter* — but its
moves are still the pack's own authored line, and distilling it into a deviation
proposal would manufacture "the learner deviated here" out of content the author
already wrote. Entering a demonstration is not deviating from it. **The distiller
skips every branch whose `origin` is `"simulated"`**, both as a spine sibling and as
a proposal, and says so in the response. Until that field exists every branch is
`"played"` by construction and the rule is inert; it is specified now because a
distiller written before the field lands would silently do the wrong thing after it
does.

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
movetime-budgeted — `#enqueueMoveEvidence` enqueues `movetime: this.#evidenceMovetimeMs`
(`service.ts:635`), which defaults to `DEFAULT_STRONG_ENGINE_PROFILE.movetimeMs`
(`service.ts:156-157`) — while the authoring evidence contract requires fixed depth and
explicitly
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
| `CONSTRUCTED_ROOT_UNVERIFIED` | warning | `start.movesSan` is absent, so the root was placed by hand rather than derived by replaying a legal move list. Pack C's hand-placed root contained a mate in two that no move list could have produced; the position was legal, the spine was legal, and the pack was a lie. The warning is a signal to the author at encoding time and it survives into the served pack's lint report, so a learner reading provenance can see it too. No engine search is performed — this RFC states a fact about provenance, not an evaluation |

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
available to the draft owner only. It is where "validation by use, not ceremony"
lands now that there is no ceremony: D12 was found by executing Pack C after three
document readings had missed it, and an author who has played their own pack has
done the one check that has ever actually worked here.

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

Registration requires every existing case to pass. It does **not** require cases to
exist — but the case count is carried on the registered record and rendered beside
the pack's provenance, so "0 regression cases" is a fact a learner can see. This is
the mechanism that would have caught D12 without anyone opening the file, and with
no reviewer in the loop it is the only executable check the pipeline has.

### 10. Publication channels

The owner ruling of 2026-08-13 struck the review queue that occupied this section.
What replaces it is smaller and is a fact rather than a judgment: every pack the
catalogue serves carries **where it came from**.

```ts
export type PackChannel = "official" | "community";
```

| Channel | Means, exactly | Written by |
|---|---|---|
| `official` | this pack ships in the repository or the image — `content/packs/` or `schemas/drill_pack.example.json` | a git commit, outside this process |
| `community` | this pack was published through this deployment's studio by a learner account | `POST /packs/drafts/:draftId/register` |

It means nothing else. It is not a quality tier, not an endorsement, and not a
claim that anyone checked the chess. An official pack is one whoever controls this
deployment's repository chose to ship; that is the whole assertion, and it is one
the server can make without lying.

#### 10a. Where the channel lives — and where it deliberately does not

**Not in the pack document.** `schemas/drill_pack.schema.json` gains no channel
field. The channel is stamped on `PackRecord` and `PackSummary` by `PackCatalogue`
(§3) according to which composed source resolved the pack:

| Source | Channel |
|---|---|
| seed `PackRegistry` (git / image) | `official` |
| `PackStore` over `registered_packs` | `community` |
| the ephemeral playtest map (§8) | `community`; never in `list()`, so never browsable |

Three consequences, and they are the reason for the choice:

1. **A community author cannot forge official provenance, because there is no field
   to forge.** §4a invariant 3 is enforced by absence rather than by a check that
   could be forgotten. The alternative — a document field plus a
   `PROVENANCE_CHANNEL_NOT_WRITABLE` rejection — would have been a second
   author-writable-status hole of exactly the kind invariant 2 exists to close.
2. **No committed pack's bytes change**, so no digest changes and no sidecar
   `packDigest` in `content/candidates/` is invalidated.
3. **An exported pack has no channel**, which is correct: channel is a fact about a
   catalogue, not about a document, and the same bytes are official here and
   community there (§12).

**`provenance.reviewStatus` is narrowed rather than removed.** It is a required
field on every pack in the tree and removing it would rewrite every committed
document's bytes and every recorded digest. It stays, with the review meaning
struck out of it:

| | Before | After (pack schema 0.8) |
|---|---|---|
| enum | `schema_example`, `draft`, `reviewed`, `published` | `schema_example`, `draft`, `published` |
| `reviewed` | "a reviewer signed this" | **removed** — nothing can grant it and nothing ever did; no committed document uses it |
| `published` | a distribution act nothing performed | "this document has been published to a catalogue" — written by §11's registration, or by the human who commits a pack into `content/packs/` |
| `provenance.reviewers` | required non-empty at `reviewed`/`published` | **removed from the schema.** `provenance.additionalProperties` is `true`, so the `"reviewers": []` in every committed pack still validates as untyped extra metadata and no bytes change |

`reviewStatus` therefore has exactly one honest reading left, and it is an
author-and-server-set lifecycle label: *is this document a working draft, or has it
been put in front of learners?* It says nothing about grounding, which is what
`graduationBlockers` says, and nothing about origin, which is what the channel says.

**The shipped graduation rule is re-pointed, not deleted.** `pack-validation.ts:87-109`
currently fires two issues when `reviewStatus` is `reviewed` or `published`. After
this RFC:

- `GRADUATION_REQUIRES_SOURCES` **survives**, now keyed on `published` alone. A pack
  put in front of learners must say where its material came from; that is enforceable,
  it is the licence and attribution obligation from
  `archive/content-sourcing-foundation.md`, and it does not depend on anyone reviewing
  anything. Its message stops citing `plan.md` §3b's reviewer bar and cites the
  provenance requirement instead.
- `GRADUATION_REQUIRES_REVIEWERS` is **deleted**, along with the reviewers field it
  read. It was the mechanical form of a workflow that no longer exists, and leaving it
  would mean `make pack-check` demanding a name nobody can supply.
- `sourcing/check.ts:216` (`CANDIDATE_ALREADY_PROMOTED`, "sourcing candidates must
  remain draft") is **unchanged and still correct**: a candidate is not a published
  pack, and `draft` is still the only value it may carry.

`apps/server/src/pack-authoring.test.ts:116-147,263` asserts against `"reviewed"` and
moves with the enum in the same change.

#### 10b. Community by construction

There is no endpoint by which a studio pack becomes official, and there is no
configuration that makes one. The enforcement is structural, in four layers, each
verifiable in code rather than by convention:

1. `PackCatalogue` reads the channel from the resolving source (§10a). The register
   endpoint writes a `registered_packs` row and that table is the community source,
   so its output is community by the same mechanism that makes it findable at all.
2. The server never writes to `content/` (§1) and this RFC adds no filesystem write
   (§4a invariant 7), so no request can put bytes into the official channel.
3. Seed ids are reserved (§1): registration rejects any pack id present in the seed
   registry with `PACK_ID_RESERVED`, so a community pack cannot take, shadow, or
   masquerade as an official pack's identity.
4. The only path from community to official is `GET /packs/:packId/export` (§12)
   followed by a human commit into a repository. That is a deliberate act by whoever
   controls the deployment, performed with the pack's full bytes in hand, and it is
   where any judgment about the content actually happens — in git, by a person, on
   the record, with no status field claiming it happened.

#### 10c. Draft lifecycle

With review struck, three states remain on the draft row.

```
              register
  draft ──────────────▶ registered        (community catalogue, §11)
    │
    └──withdraw──▶ withdrawn
```

| Transition | Actor | Preconditions |
|---|---|---|
| → `draft` | owner | valid seed |
| `draft` → `registered` | owner | `validatePackDocument(...).valid`; `graduationBlockers` empty; all §4b conditions met; all regression cases pass; document `reviewStatus === "draft"`; id not reserved; version strictly increasing |
| `draft` → `withdrawn` | owner | — |

`registered` is terminal. A registered draft is retained as the provenance of its
`registered_packs` row. There is no lock state, because there is no second party
whose read could go stale, and no `subjectDigest` handshake, because there is no
signature to scope.

### 11. Registration and versioning

`POST /packs/drafts/:draftId/register` performs one SQLite transaction:

1. re-read the draft, require `state === "draft"` (`DRAFT_STATE_INVALID`), and
   recompute `digestDrillPack(document)` from the stored bytes rather than from
   anything the request supplied;
2. re-run `validatePackDocument` on those exact bytes and require zero errors,
   plus every §4b condition, plus every stored regression case passing (§9);
3. require the pack id to be absent from the seed registry
   (`PACK_ID_RESERVED`) and the version to be strictly greater than every
   registered version of that id;
4. compute the published document as the deterministic function

   ```
   published = { ...draft,
     provenance: { ...draft.provenance, reviewStatus: "published" } }
   ```

   and `publishedDigest = digestDrillPack(published)`. The transform touches exactly
   one field and the inputs are stored, so anyone holding the draft can recompute the
   published digest and verify that nothing else changed. This is the only
   server-side rewrite of an authored document anywhere in this RFC;
5. insert `registered_packs` with the caller's handle as `publisher_handle`, set the
   draft to `registered`, and add the record to `PackCatalogue` — which resolves it
   from the community source, so it is served as `channel: "community"` (§10).

`reviewStatus: "published"` here means precisely "served to learners by this
deployment", which is what just happened. It carries no distribution claim beyond
this deployment and no quality claim at all; the pack's `graduationBlockers` are
empty because §4b required it, and the channel says who published it.

#### 11a. Versioning

`seed.kind: "version"` with `seed.ref: "<packId>@<version>"` creates a new draft
from a registered document with `reviewStatus` reset to `draft` and `version`
unchanged, so the author must bump it deliberately. Registration rejects a version
that is not strictly greater.

Every new version is an independent registration with its own digest and its own
row. Superseded versions remain resolvable by digest forever (§3), so in-flight runs
finish on the pack they started — which is the whole point of the D20 fix and the
reason versioning could not ship before it.

### 12. Export and interchange

`GET /packs/:packId/export` (optionally `?version=` or `?digest=`) returns:

```
{ pack, sources?, evidence? }
```

`pack` is the registered document; the response body is serialized with
`canonicalizeJson` (`digest.ts:53-55`) plus one trailing newline, the same
convention `writeCanonicalJson` uses for candidates
(`sourcing/canonical.ts:11-14`), so the exported bytes hash to the pack's digest.
An `x-pack-digest` header carries it, matching `GET /packs/:id`
(`rest.ts:541`).

There is **no `review.json` sidecar** and `SIDECAR_BASENAMES`
(`pack-registry.ts:15-20`) is unchanged. The previous draft reserved that name for a
sign-off record; with no sign-off there is nothing for it to carry, and reserving a
basename for a file that will never exist is exactly the kind of implied check the
ruling struck. The interchange unit is the shipped
`schemas/drill_pack.schema.json` document plus the already-reserved
`sources.json` / `evidence.json` triple — no private author format, which is
`design/03`'s explicit requirement.

**The channel does not travel, because it is not in the bytes.** `seed.kind:
"interchange"` accepts an exported bundle and lands it as a `draft` with
`reviewStatus` forced back to `draft`; the exporting deployment and URL are retained
as `seed_ref` provenance a human can read. A pack that is official on the deployment
that shipped it is community here until someone commits it into this repository,
and that is the correct answer rather than a limitation: "official" means *we ship
it*, and no other deployment can make that statement on our behalf.

`make pack-export PACK=<id> OUT=<dir> API=<url>` writes `pack.json` and any
sidecars into a directory ready to commit into `content/packs/` — the one path from
community to official (§10b).

### 13. Client surface

#### 13a. Routes

`router.ts:18-27` gains dynamic create routes in the existing `/play/run/:id`
style:

| Path | Screen |
|---|---|
| `/create` | drafts owned by the caller, and the packs they have registered |
| `/create/new` | seed picker: blank · candidate triple · PGN · completed run · new version |
| `/create/draft/:draftId` | editor, lint panel, regression panel, playtest and register |

`AppRoute` gains `{ name: "createDraft", draftId }`; `routePath` and `parseRoute`
are extended symmetrically and covered by `router.test.ts`. No review route is
added.

#### 13b. Editor

Three panes. A JSON text editor; a lint panel listing every
`PackValidationIssue` as `severity · path · code · message` with the path
clickable to select that region; and an action bar with Playtest, Run
regressions, and Register. Register is disabled while any error exists, while any
`graduationBlockers` entry remains, or while any regression case fails — each with
the blocking reason named rather than the button silently inert.

A deviation row in the editor renders the plan class named by its optional
`planClassId` (§14a) beside the deviation's `class` and note, so the author can see
that 11.a3 and 11.Rab1 are the same plan while encoding them.

**No visual form builder.** `planning/content-era/log.md` records that one was
deliberately not built pending evidence that the command loop is the bottleneck,
and the measured evidence since points at playtesting instead. This RFC ships the
playtest loop and leaves the editor textual.

#### 13c. Rendering the channel — everywhere a pack is surfaced

The channel is only worth computing if a learner sees it, so this is a specified
obligation with its own acceptance criterion (A11), not a UI suggestion.
`PackSummary.channel` and `PackRecord.channel` (§10a) reach the browser through the
existing `api.ts:23` summary shape, and the client renders it in **every place a pack
is identified**:

| Surface | Today | After |
|---|---|---|
| pack list | `PackList.svelte:35` renders `reviewStatus` raw | renders the channel as the primary origin marker, with a community pack visibly distinguished — not by colour alone |
| app-shell library section | `App.svelte:359` renders `reviewStatus` raw | same treatment |
| drill screen | pack title only | the channel accompanies the pack title for the whole run, so a learner is never mid-drill without knowing whose content it is |
| provenance / pack detail | nothing | channel, publisher handle for community packs, `provenance.sources`, and the pack's outstanding lint warnings |

A community pack carries one fixed sentence wherever its provenance is expanded, and
it is the honest form of what Pack A already says in plain text:

> `Published to this deployment by <handle>. Community packs are not checked by anyone; their claims are the author's.`

No sentence anywhere states or implies that an official pack was checked either. The
difference the UI communicates is origin, and only origin.

#### 13d. Capabilities

`SURFACE_IDS` (`capabilities.ts:32-41`) gains **no** new member: there is no review
surface. `surfaces()` (`capabilities.ts:117-129`) reports `create: "available"` —
authoring works on any deployment, and unlike approval it needs no roster to be
honest. `assertSurfaceCapabilities` keeps the key set exact, and the web
`SurfaceId`/`PLANNED_SURFACES` union in `api.ts:158-176` is updated in the same
change so the two hand-maintained lists cannot drift (the D4 shape).

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

Its consumer changed when the review checklist was struck, and it survives because
the replacement consumer is real rather than a placeholder: **§13b's editor renders
the named plan class beside each deviation's `class` and note**, which is the view
that makes "11.a3 and 11.Rab1 are the same plan" visible at the moment the author is
encoding them, and `DEVIATION_PLAN_CLASS_UNKNOWN` (§7) enforces referential integrity
between the two id spaces at every validation site. It is a link between two id
spaces the schema already owns, not a judgment. If the owner would rather not grow
the format for an editor-only consumer, dropping §14a costs this RFC nothing else —
it is the only part of the pack schema 0.8 bump that is optional, since the
`provenance` narrowing in §10a is not.

**It is deliberately not added to the delivery surface.** `AuthoredFeedbackItem`
does not gain `planClassId`. Plan classes reveal only through
`planClassSourceIds` (`authored-feedback.ts:210-217`), gated on their
intent-capture checkpoint; cross-linking a deviation to a plan class in the
delivered payload would create a second reveal path that bypasses that gate and
leak a plan class earlier than its checkpoint. `planClassId` is authoring metadata
only.

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

The previous draft routed this to the review queue and made `/deviations/N/class`
a mandatory sign-off item. With no queue, **it stays surfaced and unfixed, which is
where Pack B's own note already put it.** Pack A's castling deviation —
`class: concept_violation`, note: "is not a blunder" — is a contradiction no
evaluation in this system can detect and no lint can either; it is caught by a human
reading the file, and after the ruling that human is whoever commits the pack into
the official channel (§10b) or nobody at all for a community pack. Splitting the enum
now would be designing a fix ahead of the evidence, and the evidence is still two
instances from one author. The unblocking input is unchanged: more authored packs
that need the split.

### 15. Error codes

New `ServerErrorCode` values in `apps/server/src/errors.ts`, with the status
mapping added to `errorResponse` (`rest.ts:353-378`):

| Code | Status |
|---|---|
| `DRAFT_NOT_FOUND` | 404 |
| `DRAFT_STALE` | 409 |
| `DRAFT_STATE_INVALID` | 409 |
| `DRAFT_LIMIT_REACHED` | 409 |
| `PROVENANCE_STATUS_NOT_WRITABLE` | 422 |
| `GRADUATION_BLOCKERS_OUTSTANDING` | 422 |
| `REGRESSION_FAILED` | 422 |
| `PACK_ID_RESERVED` | 409 |
| `PACK_VERSION_EXISTS` | 409 |
| `PACK_VERSION_NOT_INCREASING` | 422 |
| `IMPORT_INVALID` | 422 |

Every body carries the existing `{error:{code,message,...details}}` shape, and
validation failures carry the full `PackValidationIssue[]` in `details.issues`
with JSON Pointer paths, matching `PackRegistry`'s existing `PACK_INVALID` detail
shape (`pack-registry.ts:91-102`).

### 16. Documentation

`docs/pack-studio.md` is created: the three content locations and the channel
boundary between them, the write path and its invariants, distillation's
extract/refuse boundary, the draft lifecycle, versioning, and export. It states in
its own words that no pack in this system has been reviewed by anyone and that the
channel is an origin fact, so the canonical documentation cannot be read as implying
a check. `docs/drill-pack-format.md` records the v0.8 `planClassId` addition, the
narrowed `provenance.reviewStatus` enum, the removal of `provenance.reviewers`, and
the three new lint codes, in the style of its existing `## v0.4 Line Drill contract`
section and after the v0.5, v0.6 and v0.7 sections the parallel drafts add.
`docs/development.md` records `make draft-import` and `make pack-export`; the
sidecar list is unchanged and that is stated, because the previous draft proposed
adding to it. `docs/branch-runtime.md` records digest-addressed pack resolution
(D20). `docs/content-sourcing.md` records that `draft-import` is the candidate's
exit. `docs/app-shell.md` records the channel's rendering obligation (§13c).

## Deviations from design

1. **`design/03` lists "study/repertoire/game/session imports" as distinct
   importers; this RFC ships one PGN importer plus candidate and interchange
   ingestion.** A Lichess study exports as PGN, so a separate study importer would
   mean pinning an unversioned web API and inventing a second format. The surface
   promised — importing a study as a pack seed — works; the mechanism is one
   importer.
2. **`design/03` §Create lists "strong-player review"; this RFC ships no review at
   all.** This is the owner ruling of 2026-08-13, not an implementer's judgment: there
   is no pack review workflow and there never will be one, because a sign-off gate
   nobody performs is worse than an honest label. The surface `design/03` promised is
   replaced by the publication channel (§10), which asserts origin instead of
   approval. A `design/` BACKLOG row is proposed below to bring that document into
   line; this RFC does not edit it.
3. **`design/03` §Stable application shell puts "review queue" under Create.**
   Not honoured, for the same reason. `/create` holds drafts and registrations only,
   and no `review` capability surface is added — a surface that reports "approval is
   unconfigured" would imply approval exists somewhere, which it does not.

## Acceptance criteria

1. `make verify` and `make test-browser` pass; no test is retried or skipped.
2. **Migration.** A database at `STORAGE_VERSION` 8 migrates to 9 with both tables
   present and no existing row altered; a database already at 9 is a no-op;
   a database at 10 still fails with the existing newer-schema error. A database at
   5 migrates through 6, 7 and 8 to 9 with every intervening body intact.
3. **Digest-addressed resolution (regression for D20, §3).** A run is
   started against pack `p@1.0.0`; `p@1.1.0` is then registered; the in-flight run
   still fires checkpoints, still transitions its objective, still returns authored
   feedback, and still exports pack-aware PGN. The same test asserts the pre-fix
   behaviour is gone by checking that `byDigest` resolves the superseded version
   while `list()` does not contain it.
4. **`reviewStatus` cannot be author-written.** `POST /packs/drafts` and `PUT` with
   `provenance.reviewStatus: "published"` return `PROVENANCE_STATUS_NOT_WRITABLE`.
   A draft can reach no state in which any endpoint serves it from `GET /packs`
   without passing through `register`.
5. **The channel is not forgeable, because it is not in the document.** A schema
   test asserts that no property named `channel` exists anywhere in
   `schemas/drill_pack.schema.json`. A server test registers a pack whose document
   carries a hand-added `provenance.channel: "official"` extra property and asserts
   that `GET /packs` reports it as `community`, that `GET /packs/:id` does the same,
   and that the served summary's channel is byte-identical to the one computed for
   a pack with no such property. A second case asserts that a pack resolved from the
   seed registry reports `official` and that registering under a seed id is refused
   with `PACK_ID_RESERVED`.
6. **The graduation rule is re-pointed, not broken.** `make pack-check` on a
   document with `reviewStatus: "published"` and empty `sources` reports
   `GRADUATION_REQUIRES_SOURCES`; the same document with one source passes.
   `GRADUATION_REQUIRES_REVIEWERS` no longer exists in the codebase, asserted by
   absence from the exported issue-code set. `sourcing/check.ts:216`'s
   `CANDIDATE_ALREADY_PROMOTED` still fires for a candidate whose `reviewStatus` is
   not `draft`, unchanged.
7. **Registration is idempotent-safe and stateful.** Registering the same draft
   twice returns `DRAFT_STATE_INVALID` on the second call, and exactly one
   `registered_packs` row exists. The published document differs from the draft in
   exactly one JSON Pointer, `/provenance/reviewStatus`, asserted by structural
   diff rather than by digest equality alone.
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
   → playtest run that fires the candidate's checkpoint → register → the pack
   appears in `GET /packs` with `channel: "community"`, `GET /packs/:id` serves it
   with `reviewStatus: "published"`, `GET /packs/:id/export` returns bytes that hash
   to the registered digest, and the recomputed
   `{...draft, provenance:{...reviewStatus:"published"}}` transform reproduces that
   digest exactly.
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
    gate. A run containing a branch with `origin: "simulated"` produces no proposal
    and no spine sibling for it, and the response says so.
11. **The channel is visible wherever a pack is (§13c).** Component tests assert
    that `PackList`, the app-shell library section, the drill screen's run header
    and the pack-provenance panel each render the channel for both an official and
    a community pack, that the two are distinguishable by text and not by colour
    alone, and that the community sentence in §13c appears verbatim on the
    community pack and nowhere on the official one. A snapshot asserts that no
    rendered string anywhere in the pack surface contains "reviewed", "approved",
    "verified" or "checked".
12. **Import refuses to launder prose.** A PGN with comments and NAGs produces a
    draft whose document contains none of that text — asserted by searching the
    serialized document for each comment string — while the comments are returned
    as reference material.
13. **Lints.** `INTENT_CAPTURE_HAS_NO_RECORDING_SITE` fires on the schema fixture's
    intent-capture checkpoint and is a warning, not an error;
    `DEVIATION_PLAN_CLASS_UNKNOWN` is an error; `CONSTRUCTED_ROOT_UNVERIFIED` fires
    on Pack C's draft and not on Pack A's.
14. **Format amendment.** The schema `$id` is `:0.8` and
    `DRILL_PACK_SCHEMA_VERSION` is `"0.8"`; the `reviewStatus` enum is exactly
    `["schema_example","draft","published"]`; `provenance.reviewers` is absent from
    the schema and a document still carrying `"reviewers": []` validates as untyped
    extra metadata; every pack in `content/candidates/`, `content/drafts/`, and
    `schemas/` still validates; `digestDrillPack` over every committed pack returns
    the digest recorded in its sidecar where one exists, and the digest of
    `schemas/drill_pack.example.json` is unchanged.
15. **Sidecar list unchanged.** `SIDECAR_BASENAMES` (`pack-registry.ts:15-20`) has
    the same members before and after this change, asserted explicitly — the
    previous draft added `review.json` to it and the assertion is what stops that
    addition surviving as a stray reservation.
16. **Browser test (required by the brief).** A Playwright test in
    `tests/browser/` registers one learner and: navigates to `/create`, creates a
    draft from a seed, sees a lint error and fixes it, sees Register disabled with
    the outstanding `graduationBlockers` named as the reason, clears them, playtests
    the draft and plays one move that fires its checkpoint, registers; the pack then
    appears in `/library` **marked community**, opens in `/play`, and shows the
    community provenance sentence. The test asserts a draft never appears in the
    `/play` pack list, and that the served example pack appears marked official in
    the same list, so the two channels are visibly distinct in one screenshot.
17. **Documentation** in §16 lands in the same change; `rfc/README.md` carries the
    Active row, migration 9, and the pack-schema-version claim (§0), and the
    migration register records migration 9 against this RFC before any code is
    written.

## Proposed BACKLOG rows (owner-tier; not implementer work)

Per RFC-0000's agent rule, the implementer must not edit `design/`. Proposed rows
for the owner:

1. **Authoring-format friction table** — mark the `planClassId` row `📜 RFC` naming
   this RFC §14a and noting that its consumer is now the studio editor rather than a
   review checklist; annotate the intent-relative-success row "surfaced by
   `INTENT_CAPTURE_HAS_NO_RECORDING_SITE`; blocked on a durable interaction record
   (program #4)"; annotate the `concept_violation` row "surfaced, not fixed; the
   review sign-off that would have caught it was struck by the 2026-08-13 ruling.
   Unblocking input is more authored packs that need the split, not a reviewer."
2. **New defect row D20** — *a superseded pack digest silently un-orchestrates its
   in-flight runs* (`service.ts:621-625` with `service.ts:252,276`), closed by this
   RFC §3. It is latent today and becomes live the moment a second version of any
   pack can exist.
3. **New row** — *durable checkpoint-interaction record*: intent capture and
   prediction both need a run event carrying the learner's choice. Names program #4
   and the `INTENT_CAPTURE_HAS_NO_RECORDING_SITE` warning as the evidence.
4. **New row** — *pack contribution across deployments*: an exported pack lands as
   community wherever it is imported and carries no channel of its own (§12); a
   cross-deployment provenance model (signed publisher identity, federated origin
   claims) is undesigned and touches Q2.
5. **`design/03-product-breadth.md` §Create and §Stable application shell** — the
   surface map still lists "strong-player review" and a "review queue" under Create,
   and gate **B6** is worded against a reviewed catalogue. The 2026-08-13 ruling
   removes all three. Proposed: replace them with the publication channel, and
   restate B6 as "a candidate, an import, or a completed run can become a served
   community pack, and its channel is visible wherever it is surfaced". This is the
   `design/` edit this RFC most needs and cannot make.
6. **`design/00-thesis.md` / research queue 9** — strong-reviewer recruitment was
   the staffing question behind the review gate. With no gate it is no longer a
   product prerequisite; the row should be restated as content-sourcing partnership
   or closed.

## Open questions

None. The one open question this draft carried — the shape of the reviewer roster —
was answered by the owner ruling of 2026-08-13, which removed the roster and the
workflow it served rather than choosing a shape for it.

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
- 2026-08-13: **rewritten against two owner rulings and renamed
  `pack-studio-and-review.md` → `pack-studio.md`.**
  *Ruling 1 — there is no pack review workflow and there never will be one.* Struck:
  the review queue and its `?queue=review` listing, the `TABIYA_REVIEWERS` roster and
  its fail-closed configuration, the self-review refusal, the document-derived
  sign-off checklist and its `grounds` vocabulary, the `pack_reviews` and
  `pack_review_items` tables, `registered_packs.review_id`, the
  `draft → in_review → changes_requested → approved → registered` state machine and
  its lock and staleness rules, the `/submit` and `/review` endpoints, the
  `/create/draft/:draftId/review` route and screen, the `review` capability surface,
  the `review.json` interchange sidecar and its `SIDECAR_BASENAMES` reservation, six
  `REVIEW_*` error codes plus `DRAFT_LOCKED_FOR_REVIEW` and
  `PROVENANCE_REVIEWERS_NOT_WRITABLE`, and the open question about solo operators.
  *Ruling 2 — packs carry a publication channel, not a review status.* Added §10
  (`PackChannel`, official = git/image, community = studio), made the previously
  incidental seed-id reservation the channel boundary itself (§1, §10b), and gave the
  channel a rendering obligation with its own acceptance criterion (§13c, A11).
  **Resolved the dangling `reviewStatus` field** rather than leaving it: verified its
  two shipped consumers (`pack-validation.ts:87-109`, `sourcing/check.ts:216`) and
  narrowed the enum to `schema_example | draft | published`, removed
  `provenance.reviewers`, kept `GRADUATION_REQUIRES_SOURCES` re-keyed on `published`,
  and deleted `GRADUATION_REQUIRES_REVIEWERS`. No committed document's bytes or
  digest change, because `provenance.additionalProperties` is `true`. Re-justified
  §14a's `planClassId` against its surviving consumer (the studio editor) and flagged
  it as the only optional part of the 0.8 bump. Kept unchanged: the write path and
  its safety invariants, `/create`, session distillation, PGN/candidate/interchange
  import, the playtest harness, the regression set, versioning, and the D20
  digest-addressed resolution fix.
