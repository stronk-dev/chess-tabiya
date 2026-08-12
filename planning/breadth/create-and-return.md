# Breadth foundation alignment — B6 (create and curate) and B7 (return and progression)

Program items #6 and #7 of `design/03-product-breadth.md` §Provisional foundations-first
RFC program. This is planning-tier decomposition against **verified shipped code**, not an
RFC and not design-tier intent.

**Method.** Every "shipped" claim cites `path:line` in production code (tests excluded
unless named); every "absent" claim cites the grep proving absence. This applies the
standing lesson from `planning/content-era/log.md` (2026-08-12, "delivery RFC accepted
after a fifth same-class finding"): check whether a capability shipped **before** writing
the sentence that uses it. Every capability named in B6/B7 gets a scheduled slice with a
minimal-but-real definition; ordering constraints are stated, nothing is postponed out of
the program.

---

# PART A — B6, Creation and curation

## A1. Scope

| Surface | B-gate row owned |
|---|---|
| `/create` route: pack studio, draft list, review queue | B6 (`design/03-product-breadth.md:138`, `:166`) |
| Pack preview, lint, regression tests, versioning, provenance, strong-player review | B6 (`:95–96`) |
| Imports: Lichess studies, repertoires, FEN/PGN collections, historical games, completed sessions as seeds | B6 (`:97–98`) |
| Authoring of theory boundaries, objectives, timing windows, acceptable moves, model-game spines, transitions, claims, transfer positions | B6 (`:99–100`) |
| Corpus search and candidate mining emitting ≥1 unpublished candidate through the real pipeline | B6 (`:101–103`) — the gate's fixed proof |
| Community contribution and open pack interchange through the same schema | B6 (`:104–105`) |

Gate status of record: `B6 — create … | schema/lint only` (`planning/exploration/gates.md:127`).
That status is accurate.

## A2. What ships today

| Capability | Shipped? | Evidence |
|---|:--:|---|
| Pack format v0.2 as a Draft 2020-12 JSON Schema, root `additionalProperties: false` | yes | `schemas/drill_pack.schema.json:72` |
| Structural validation (Ajv, `strict: true`, all errors) | yes | `apps/server/src/pack-validation.ts:38-41`, entry `:182` |
| Semantic authoring lint (legal spine walk, duplicate ids, unknown spine refs, prediction density) | yes | `packages/schema/src/drill-pack/lint.ts`, invoked `pack-validation.ts:193` |
| Executable-policy lint: closed checkpoint-action vocabulary | yes | `pack-validation.ts:11` (`SUPPORTED_CHECKPOINT_ACTIONS = ["compare_branches"]`), enforced `:140-158` |
| Executable-policy lint: closed feedback policy / opponent mode / objective condition | yes | `pack-validation.ts:103-123`, `:125-138` (against `capabilities.ts:10-14`), `:160-178` |
| Coarse graduation enforcement (§3b) | yes | `pack-validation.ts:80-101` — `GRADUATION_REQUIRES_SOURCES`, `GRADUATION_REQUIRES_REVIEWERS` |
| Author CLI check | yes | `apps/server/src/pack-check.ts:25` (`checkPackFile`), `:66` (`main`); `Makefile` target `pack-check` |
| Author preview against the real app | yes | `Makefile` target `pack-preview`; `DRAFT_PACK_FILE` gate `apps/server/src/main.ts:18-20` |
| Committed draft workspace, development-only load | yes | `content/drafts/README.md`; `apps/server/src/pack-registry.ts:154-196`, dev guard `:170-172` |
| Content-addressed versioning (RFC 8785 + SHA-256 over the whole doc incl. `version`) | yes | `packages/schema/src/drill-pack/digest.ts`; served as `x-pack-digest` `apps/server/src/rest.ts:386-392` |
| Browser-safe pack projection (authored prose withheld from `GET /packs/:id`) | yes | `pack-registry.ts:46-73`; `projectSpineNode` `:33-40` drops `annotations` |
| Pack+run PGN export with authored spine variations | yes | `packages/runtime/src/pack-pgn.ts`; REST `rest.ts:435-446` |
| **`/create` UI of any kind** | **no** | `apps/web/src/App.svelte:250-264` renders an honest empty state for `learn`/`live`/`create`; capability reports `create: "unavailable-here"` at `apps/server/src/capabilities.ts:107` |
| **Any pack write endpoint** | **no** | `rest.ts` route surface is `GET /capabilities`, `GET /packs`, `GET /packs/:id`, `POST|GET /runs`, `POST /select-move`, and the run subroutes matched by the regex at `rest.ts:299`. No POST/PUT/PATCH/DELETE on `/packs`. |
| **Any importer (Lichess study, repertoire, PGN/FEN collection, historical game)** | **no** | `grep -rniE "lichess\|study\|import[A-Z]\|mining\|distill" apps packages workers tools --include="*.ts" --include="*.svelte" --include="*.go"` → only chessground CSS imports, the `App.svelte:261` empty-state prose, and `packages/schema/src/drill-pack.test.ts:133` |
| **PGN parsing on the ingest side** | **no** | `parsePgn` from `chessops/pgn` appears only in `packages/runtime/src/{pgn,pack-pgn,invariants,vertical-scenario}.test.ts` and `apps/server/src/drill-client-server.test.ts`. No production module imports it. |
| **Session distillation** | **no** | `session_distilled` is an accepted provenance *string* only (`packages/schema/src/drill-pack.test.ts:133`); grep finds no producer |
| **Corpus search / candidate mining** | **no** | no explorer/corpus client anywhere; grep above |
| **Review queue / reviewer workflow** | **no** | `provenance.reviewStatus` is a field the author types; the only mechanical barrier is `pack-validation.ts:80-101` |
| **Per-pack regression tests** | **no** | `Makefile` has `test`, `test-browser`, `schema-check`, `pack-check`, `pack-preview` — no pack acceptance runner |
| **Any published production pack** | **no** | `content/packs/` holds only `.gitkeep`; the single registered pack is `schemas/drill_pack.example.json`, `"reviewStatus": "schema_example"` (`:145`) |

## A3. The gap — what each capability needs to be minimally real

| Capability | Missing for minimal-but-real |
|---|---|
| Pack studio | A real entry (`/create`), a server-side draft store, and an editor writing through the *same* `validatePackDocument` path the registry uses. Drafts today are files a human puts in `content/drafts/` for a dev-mode server to read. |
| Preview | Exists, but restarts the whole app on file change and runs the mock opponent with constant-zero evidence (`content-era/log.md`, codex review finding 2). Minimal-real: preview a draft *by id* in a running server, executor labelled honestly. |
| Lint | Shipped and load-bearing; the gap is surfacing. Issues are CLI stderr lines. Needs the same `PackValidationIssue[]` (`pack-validation.ts:13-19`) returned over HTTP. |
| Regression tests | No declarative per-pack acceptance artifact. Pack A's spine walk was done by hand over REST at a cost of 40 measured minutes (`log.md`, session 2 pass (a)). |
| Versioning | Digest identity ships; no version diff, changelog, or "this run used digest X, the pack is now Y" reconciliation beyond the stale-digest rejection at `service.ts:131-137`. |
| Provenance | Fields ship and the coarse rule is enforced. Missing: who moved the status and when — `reviewStatus` has no history. |
| Strong-player review | No queue, assignment, diff view, or sign-off record. §3b's five-assertion walk is a process barrier with no instrument. |
| Imports | Nothing. Needs a converter emitting a **seed** (start FEN + legal spine + provenance chain), never a pack, never checkpoints or claims. |
| Session distillation | Needs a run→seed projection; `exportPackRunPgn` already proves the authored+played tree is well-formed, so the chess half exists. |
| Authoring of windows/claims/transitions | Vocabulary is encoded and inert — `authoredBoundary`, `deviations`, `interaction`, `feedbackClaims` all dead (`field-consumer-matrix.md:20-29`). Program item #2 fixes that; B6's obligation is not to author *more* inert vocabulary. |
| Corpus mining | Nothing. Gate proof is fixed: one unpublished candidate through the real pipeline. |
| Community interchange | The schema is open and content-addressed — most of the work. Missing: a stable published `$id` with a conformance fixture set, and an import path accepting a foreign file. |

## A4. Contracts to pin

**A4.1 — The review/publish state machine.** Shipped enum, verbatim
(`schemas/drill_pack.schema.json:462-464`):

```json
"reviewStatus": { "enum": ["schema_example", "draft", "reviewed", "published"] }
```

with (`:465-474`) `sources` and `reviewers` as `array` of `nonEmptyString`, and
`"additionalProperties": true` on the provenance object — which is why
`graduationBlockers` in `content/drafts/anti-caro-advance.json:273-277` validates as
untyped extra metadata. The only shipped transition rule is
`pack-validation.ts:80-101`: `reviewed | published` ⇒ both arrays non-empty.
`schema_example` is deliberately outside the rule.

Amendment to pin: transitions become server-mediated and append-only
(`draft → reviewed → published`, plus `reviewed → draft` on rework), each recording actor
and timestamp. The rule at `:80-101` stays as the floor, unchanged.

**A4.2 — Import → pack-seed shape.** A seed is a `DrillPackDefinition` that validates
today, with these constraints and nothing invented:

| Field | Seed value | Why it is already legal |
|---|---|---|
| `provenance.reviewStatus` | `"draft"` | enum above |
| `provenance.sources` | source URL + licence, one entry per origin | `nonEmptyString[]` |
| `start.fen`, `start.movesSan` | from the imported game/chapter | `schemas/drill_pack.schema.json:108-116` |
| `spine` | converted chapter tree | walked and legality-checked by `lintDrillPack` |
| `checkpoints` | exactly one `atPly` checkpoint, actions `[]` | schema requires `minItems: 1` (`:44-48`); an empty `actions` array is the shipped "offers no action" encoding (`docs/drill-pack-format.md:41`) |
| `objective` | `play_until_checkpoint` + human summary | `packages/schema/src/drill-pack/types.ts:11` |
| `feedbackPolicy` | `delayed_checkpoint` | only two are runnable (`pack-validation.ts:112-115`) |
| `opponentPolicy.mode` | `theory_strict` | `capabilities.ts:10-14` |

The load-bearing rule: **a seed carries no claims, no deviation classes, and no plan
descriptions.** Import produces geometry and provenance; judgment stays with the author.
This is ADR-0001 (curated-first) and ADR-0005 (no LLM-manufactured chess truth) expressed
as a data shape rather than a promise.

**A4.3 — The endpoint surface each extension amends.** Shipped, verbatim from `rest.ts`:
`GET /packs` → `json(200, service.packs())` (`:375-377`); `GET /packs/:id` → the
projection at `:386` with header `x-pack-digest` (`:391`). `service.packs()` returns
`PackSummary[]` (`pack-registry.ts:16-24`: `id, version, digest, title, mode, difficulty,
reviewStatus`). Additions must reuse `validatePackDocument` and `PackValidationIssue`
(`pack-validation.ts:13-19`) so an authoring no-op cannot validate in the studio and then
fail at registry load — the invariant `docs/drill-pack-format.md:64-67` already states.

**A4.4 — The registry is immutable and file-backed.** `PackRegistry` builds a frozen map
in `fromDocuments` (`pack-registry.ts:120-152`) and exposes only `list`/`get`/`required` —
no reload, no insert. A studio therefore needs a *second* store for drafts, with promotion
to `content/packs/` as a separate explicit act. Pin this rather than mutating the
registry: an immutable-per-process catalogue is what makes `packDigest` reconciliation
(`service.ts:131-137`) sound.

## A5. Slice plan

| # | Slice | Minimal real proof | Acceptance scenario | Depends on |
|---|---|---|---|---|
| B6-1 | **Draft store + `/create` entry** | Server-side draft table; `POST/GET/PUT /packs/drafts`; `/create` lists drafts with status, digest, and live `PackValidationIssue[]` | `content/drafts/anti-caro-advance.json` is uploaded through the API, appears at `/create` as `draft`, and a promote call with `reviewers: []` returns 422 carrying `GRADUATION_REQUIRES_REVIEWERS` and its JSON Pointer | shipped validator; shell (B1, met) |
| B6-2 | **Playtest harness** — the measured friction | `POST /packs/drafts/:id/playtest-run` derives run id, `policyConfig`, and seed server-side; `/create/:id` starts and shows the run | The session-2 pass (a) walk (40 min of hand-assembled REST) is repeated end to end from the studio with zero minutes of assembly; friction re-measured into `planning/content-era/log.md` | B6-1 |
| B6-3 | **Pack regression tests** | A per-pack acceptance file asserting the exact event sequence of a `theory_strict` spine walk; `make pack-test FILE=` runs it in CI | Pack A asserts `checkpoint.reached` for `plan-commitment` at spine node `be2`, `break-arrived` at `c5-break`, and one `segment.completed` between them — the behaviour session 2 verified by hand | B6-2 |
| B6-4 | **Review queue and sign-off record** | Reviewer assignment, a five-category assertion checklist derived from `planning/content-era/plan.md` §3b, and an append-only status/actor/timestamp trail | The owner reviews pack A in the app; sign-off writes `provenance.reviewers` and the trail; §3b's process barrier becomes an instrument | B6-1 |
| B6-5 | **Import → seed: PGN/FEN collections and historical games** | `POST /packs/seeds/import` accepting PGN; emits a seed per A4.2; rejects anything it cannot make legal | A downloaded master game becomes a seed whose spine passes `pack-check`, with source and licence in `provenance.sources` | B6-1; `chessops/pgn` (already a dependency) |
| B6-6 | **Import → seed: Lichess studies and repertoires** | Study/chapter fetch by id or uploaded study PGN, mapping chapters to seeds and preserving chapter names as titles | A public study chapter becomes a seed the author then annotates in the studio; measured `agent-research` + `agent-encoding` for the annotated pack is logged against session 1's 55 minutes | B6-5 |
| B6-7 | **Session distillation** | `POST /packs/seeds/from-run/:runId` projecting a chosen branch into a seed with `provenance.sources: ["session_distilled"]` | A completed anti-Caro run becomes a seed; `exportPackRunPgn` output and the seed spine agree | B6-5 |
| B6-8 | **Corpus search and candidate mining — the B6 gate proof** | Stage-0 explorer queries (per `planning/exploration/plan.md` §Q6: explorer API + curated PGNs, no bulk ingestion) select candidate roots and emit seeds into the review queue | **One unpublished candidate reaches the review queue with a provenance chain back to its source games and is never auto-published** — the gate's fixed proof | B6-5, B6-4 |
| B6-9 | **Open interchange** | Stable schema `$id` + conformance fixture set + foreign-file import through B6-1 and export by digest | A pack file authored outside this repo validates, imports, plays, exports, and re-imports to a byte-identical RFC 8785 digest | B6-1, B6-3 |
| B6-10 | **Bounded authoring assist** | An assistant may draft prose fields into a seed; it may not write `deviations[].class`, grade moves, or set `reviewStatus`; every generated field lands with a `graduationBlockers` entry | Assist fills `spine[].annotations` on an imported seed; `pack-check` still refuses promotion until sources and reviewers exist | B6-4, B6-6; ADR-0001, ADR-0005 |

## A6. Dependencies

**In:** the shipped validator/lint/digest stack (A2); the shell's `/create` route (B1,
met, `router.ts:18-27`); `chessops/pgn` for import parsing.

**Out:** B6-7 gives B7 its "completed session as pack seed" path; B6-3's event-sequence
assertions give program item #2 a regression net for when authored prose starts rendering;
B6-8's provenance chain is the shape trajectories need for the causal-integrity rule
(`design/04-content-architecture.md` §5).

**Not owned by B6:** making `deviations`, `feedbackClaims`, `interaction`, or
`authoredBoundary` do anything — that is program item #2. B6 must not author more inert
vocabulary; the field matrix already shows roughly half of an author's output has no
consumer (`field-consumer-matrix.md:35-37`).

## A7. Proposed BACKLOG row edits (B6)

Table: `design/BACKLOG.md` §Breadth-first product surfaces (columns Surface | Breadth
requirement | Home).

Existing first cell: `| Create/curate system |`
```
| Create/curate system | **B6, program item #6, scheduled.** Draft store + `/create` studio, playtest harness, per-pack regression tests, review queue with sign-off trail, PGN/study/session imports emitting *seeds* (geometry + provenance only, never claims), corpus mining, open interchange, bounded assist. Slice plan: `planning/breadth/create-and-return.md` §A5 | `03-product-breadth.md`, `arch/product/content_pack_authoring.md`, `planning/breadth/create-and-return.md` |
```

Existing first cell: `| Automatic candidate-pack mining |`
```
| Automatic candidate-pack mining | **B6-8, scheduled — the B6 gate's fixed proof.** Stage-0 explorer/curated-PGN search emits ≥1 unpublished candidate seed into the review queue with a provenance chain to its source games; publishing stays a reviewed human act (ADR-0001). Bulk ingestion remains the rejected pattern | B6, `03-product-breadth.md`, `arch/08`, `planning/breadth/create-and-return.md` §A5 |
```

Table: `design/BACKLOG.md` §Untracked-until-now gaps (columns Idea | Take | Home).

Existing first cell: `| Pack interop: import Lichess studies / existing repertoires as pack seeds |`
```
| Pack interop: import Lichess studies / existing repertoires as pack seeds | **Scheduled as B6-5/B6-6.** Converters emit *seeds* — start FEN, legal spine, provenance chain, one `atPly` checkpoint — and never claims, deviation classes, or plan descriptions; the author annotates. **Measurement correction:** on the evidence logged so far this is the *scaling* lever, not the first one — `tooling-friction` is 45 of 105 measured minutes (43%, over the §1 threshold) and every one of those minutes was playtest/run-assembly friction, not source-preparation friction. B6-2 precedes it | Q7, K10, `planning/breadth/create-and-return.md` §A5 |
```

Existing first cell: `| Open pack format as the ecosystem contribution |`
```
| Open pack format as the ecosystem contribution | **Scheduled as B6-9.** Stable schema `$id`, a conformance fixture set, foreign-file import through the same validator, and export by RFC 8785 digest — community contribution uses the shipped schema, not a private author-only format. Already half-shipped: `schemas/drill_pack.schema.json` is open and packs are content-addressed | Q2, B6, `00-thesis.md` candidate amendment, `planning/breadth/create-and-return.md` §A5 |
```

Table: `design/BACKLOG.md` §Core systems (columns Topic | Status | Home).

Existing first cell: `| Content authoring workflow + pack production cost |`
```
| Content authoring workflow + pack production cost | 📐 · cost = exploration **Q7** · job open in `planning/content-era/`; the tooling half is scheduled as B6 (`planning/breadth/create-and-return.md` §A5). First measured verdict: the validator paid for itself on first use; playtest friction is the dominant measured category | `arch/product/content_pack_authoring.md`, `planning/content-era/plan.md` |
```

## A8. Owner-level questions (B6)

1. **Is community contribution in v1 breadth, or is "open format" satisfied by publishing
   the schema?** B6-9 as written is single-user: a stable `$id`, conformance fixtures, and
   an import path for a foreign file. It does **not** include a registry, identity,
   moderation, or trust model. The breadth doc says community contribution "supported by
   the same schema, not a private author-only format" (`design/03-product-breadth.md:104`)
   — which the file-level answer satisfies literally. If the intent was a contribution
   *channel* (submit, review, accept from a stranger), that pulls learner/author identity
   forward and changes B7-1 too.
2. **Does an authoring assistant draft prose at all (B6-10)?** ADR-0001 and ADR-0005 both
   permit it (drafts stay unpublished; the LLM renders rather than judges) and the BACKLOG
   lists it (`design/BACKLOG.md:80`). But `content-era/plan.md` §1b names `owner-review`
   as the load-bearing clock and holds that only "content reuse and better first drafts"
   can reduce it. An assistant is exactly that bet, and its failure mode is *more* review
   time spent on fluent ungrounded prose. A product-intent fork, not a capability question.

---

# PART B — B7, Return and progression

## B1. Scope

| Surface | B-gate row owned |
|---|---|
| Run history, resume, duplicate | B7 (`design/03-product-breadth.md:59`, `:167`) |
| Concept/skill progress model | B7 (`:73`) |
| Due episodes; blocked vs varied repetition; SRS over episodes and concepts | B7 (`:73`), `design/01-training-model.md` §Repetition scheduling |
| Related-position transfer and retry history | B7 (`:73`) |
| Optional personal-history relevance, never the required entry point | B7 (`:74-75`), ADR-0003 |
| Phase-oriented discovery as navigation and filters (`/learn`) | B7 (`:70-71`) |

Gate status of record: `B7 — Return … | resume partial`
(`planning/exploration/gates.md:128`). Accurate, and "partial" is generous — see B3.

## B2. What ships today

| Capability | Shipped? | Evidence |
|---|:--:|---|
| Durable run persistence (event log, replayed on read) | yes | `apps/server/src/storage.ts:216-248`; `readBackReplay` at `:238` |
| Run history list, newest first, without replaying every log | yes | `storage.ts:250-287`; denormalized `summary_json` migration `storage.ts:376-401` |
| History over HTTP with pagination | yes | `rest.ts:402-405`; `parsePagination` `:340-355`, max 100 `:353` |
| Run summary fields | yes | `storage.ts:13-21` — `id, title, packId, updatedAt, objectiveState, branchCount, activeWriterId` |
| Resume a run by deep link | yes | `apps/web/src/lib/router.ts:37-45`; `App.svelte:139` (`controller.resume`) |
| Resume card on Home; run list on Review | yes | `App.svelte:193-203`, `:237-249` |
| Writer-lease-aware resume (writer vs read-only) | yes | `apps/web/src/lib/writer-session.ts` (`peek`/`claimFor`/`observe`); `App.svelte:103-109` |
| First attempt is never erased (branches are immutable) | yes | `packages/runtime/src/events.ts:33-151` (append-only projection) |
| Cross-run position key | yes | `packages/runtime/src/chess.ts:16` — `transposeKey` = the first four FEN fields; stored on every node (`packages/runtime/src/types.ts:61`) |
| Checkpoint-bounded segment derivation | yes | `packages/runtime/src/events.ts:167-189` (`deriveSegments`) |
| `transfer.scheduled` event **declared** | type only | `packages/runtime/src/types.ts:160-163` — `{ nodeId, scheduleId }`; `schemas/drill_run.schema.json:463-473`; projection is a deliberate no-op at `packages/runtime/src/events.ts:135`; **no producer** (`grep -rn "transfer.scheduled"` finds only type, schema, projection no-op, and docs) |
| `concepts[]` **declared** on packs | type only | `schemas/drill_pack.schema.json:30-34` — `nonEmptyString[]`, `uniqueItems`; matrix verdict **dead** (`field-consumer-matrix.md:21`); the only app-code occurrence is `apps/server/src/drill-client-server.test.ts:157` asserting it is *not* projected |
| `retryVariants[]` **declared** on packs | type only | `schemas/drill_pack.schema.json:66-69` — `{"type":"array","items":{"type":"object"}}`, entirely untyped; grep finds it only in schema and example files |
| **Any learner/user identity on the server** | **no** | `grep -rniE "userId\|accountId\|auth\|login\|profile" apps/server/src --include="*.ts"` returns only `StrongEngineProfile`/`policyProfiles`. Runs are keyed by run id; the only actor token is a browser-local UUID in `localStorage` under `chess-tabiya:run:<id>:writer-id` (`writer-session.ts:7-9`) |
| **Any progress / mastery / SRS / due state** | **no** | `grep -rniE "srs\|spaced\|dueAt\|nextDue\|easeFactor\|mastery" apps packages --include="*.ts" --include="*.svelte"` returns only `setInterval`/`clearInterval` polling timers. The word "progress" occurs once in the codebase: `App.svelte:258`, inside the empty-state copy |
| **Duplicate / retry a run** | **no** | the run subroute regex is `/^\/runs\/([^/]+)\/(moves\|rewind\|fork\|graph\|compare\|events\|evidence\|pgn)$/` (`rest.ts:299`) |
| **`/learn` surface** | **no** | `App.svelte:250-264` honest empty state; `capabilities.ts:105` reports `learn: "unavailable-here"`; client marks it planned (`apps/web/src/lib/api.ts:91-97`) |
| **Second storage table of any kind** | **no** | `storage.ts:177-184` creates exactly `drill_runs`; `STORAGE_VERSION = 1` (`:69`), one migration (`:347-353`) |
| **Personal-history import or recommender** | **no** | same import grep as A2 |

## B3. The gap

| Capability | Missing for minimal-but-real |
|---|---|
| Run history | Shipped and real. Gaps: no filter by pack/phase/outcome, and no notion of *whose* history — `GET /runs` returns every run in the database. |
| Resume | Shipped. One untested behaviour survives the corrected session-2 entry: refresh `/play/run/:id` and verify checkpoint/timeline rebuild from `/events?sinceSeq=0`. Cheap; belongs in B7-2's acceptance. |
| Duplicate | No endpoint. Needs a new run at the same pack + start FEN with a fresh seed and a recorded `derivedFrom`, so retry history is a graph rather than unrelated rows. |
| Concept/skill progress | Nothing — and the subject is missing before the model is: there is no learner. Also no cross-pack concept key; `concepts[]` items are bare `nonEmptyString` unique *within one pack only*. |
| Due episodes | Nothing: no schedule store, no trigger, no surface. The named open problem — the varied-repetition scheduler has no trigger. |
| Blocked vs varied repetition | Designed (`design/01-training-model.md:31-41`) and encodable in principle via `retryVariants`, which is an untyped `object[]` no code reads. |
| SRS over episodes/concepts | Needs a unit, a store, and an outcome signal. The signal partly exists — node `objectiveState`, plus the `outcome.reached` event type, which also has no producer (same grep class as `transfer.scheduled`). |
| Related-position transfer | `transposeKey` gives an exact cross-run position key. Missing: a *related*-position relation (shared structure or concept) and the schedule that consumes it. |
| Retry history | Implicit inside one run's branch graph; absent across runs. |
| Optional personal-history relevance | Nothing. Must be strictly additive per ADR-0003 — every slice above passes its acceptance with import switched off. |

## B4. Contracts to pin

**B4.1 — The unit of scheduling.** Proposed pin: **the episode attempt**, defined as a
checkpoint-bounded segment of one run against one pack version, with concept and position
as secondary indexes rather than primary units. Justification is in shipped code, not
preference:

| Candidate unit | Shipped addressability | Verdict |
|---|---|---|
| Move | none needed | Rejected by `design/01-training-model.md:9` — the learning unit is an episode, not a move. This is the K1 kill criterion ("opening mode collapses into ordinary spaced repetition"). |
| Position | `Node.transposeKey` (`chess.ts:16`), stored on every node, identical across runs | **Secondary index.** The only cross-run key that already exists; the right key for related-position retry, the wrong unit for "what do you know". |
| Concept | `concepts[]` are bare `nonEmptyString` unique within one pack (`schemas/drill_pack.schema.json:30-34`) | **Secondary index, needs a key space first** — see B7-4. Cannot be primary today: two packs writing `"break-timing"` have no contract making them the same concept. |
| Episode | `deriveSegments(run)` (`events.ts:167-189`) yields `{branchId, startCheckpointId, endCheckpointId, startNodeId, endNodeId, startSeq, endSeq}`; the pack side is `(packId, packDigest)` | **Primary.** Checkpoint-bounded, already derived, and it is exactly the object `01-training-model.md` calls the learning unit. |

So the scheduling key is `(learnerId, packId, startCheckpointId, endCheckpointId)`, with
`packDigest` recorded on each attempt so a pack edit is visible rather than silently
conflated.

**B4.2 — Where progress state lives.** Pin: **a separate projection store, never inside
the run event log.** Grounds, all shipped:

- The run store is one table keyed by run id — `CREATE TABLE IF NOT EXISTS drill_runs (id
  TEXT PRIMARY KEY, snapshot_json TEXT NOT NULL, active_writer_id TEXT NOT NULL …)`
  (`storage.ts:177-184`), plus `summary_json` from migration 1 (`:376-401`). There is no
  cross-run index of any kind.
- Reads replay the whole log (`storage.ts:238`) and writes require the writer lease
  (`storage.ts:289-327`). A schedule that lived in run events could only be updated by
  whoever holds that run's lease — wrong ownership for something spanning runs.
- The run projection is closed and validated: `projectRun` throws on an unknown or
  out-of-order event (`events.ts:43-48`), and objective transitions are asserted
  (`events.ts:104-108`). Progress is a derived read model, not a source of truth.
- `RunStorage` is an interface (`storage.ts:29-37`), so a sibling `ProgressStorage`
  behind its own migration is additive and does not touch run semantics.

**B4.3 — `transfer.scheduled` is the only shipped scheduling vocabulary, and it is a
pointer, not a schedule.** Shipped, verbatim (`packages/runtime/src/types.ts:160-163`):

```ts
export type TransferScheduledEvent = Event<
  "transfer.scheduled",
  { readonly nodeId: string; readonly scheduleId: string }
>;
```

`schemas/drill_run.schema.json:463-473` requires both fields, `additionalProperties:
false`, both matching `#/$defs/id`. Projection ignores it (`events.ts:135`). Read
correctly this is a gift: the run log records *that a transfer was scheduled from this
node*, and `scheduleId` foreign-keys into the progress store. It confirms B4.2 by
construction — the event has room for a reference and no room for a schedule.

**B4.4 — The learner subject.** Nothing shipped. Minimal pin that does not import an
auth system: a `learnerId` column defaulting to a single local profile, set at run
creation, so `GET /runs` and every progress row are scoped from day one. Retrofitting a
subject after schedules exist is the expensive order.

## B5. Slice plan

| # | Slice | Minimal real proof | Acceptance scenario | Depends on |
|---|---|---|---|---|
| B7-1 | **Learner subject** | `learnerId` on runs (single local profile default, no auth); `GET /runs` scoped; storage migration 2 | Existing runs backfill to the default profile; the migration is not re-applied on reopen (the pattern `storage.ts:339-374` already proves) | `storage.ts` |
| B7-2 | **Duplicate / retry, and verified resume** | `POST /runs/:id/duplicate` → new run, same `packId`/`startFen`, fresh seed, recorded `derivedFrom` | Retry pack A from the root; both runs appear in history and the first attempt is untouched. Same slice closes the pending reload test: refresh `/play/run/:id` and verify checkpoint/timeline rebuild from `/events?sinceSeq=0` | B7-1 |
| B7-3 | **Episode attempt records** | `ProgressStorage` (migration 3) writing one row per completed segment: `(learnerId, packId, packDigest, startCheckpointId, endCheckpointId, rootTransposeKey, objectiveState, attemptNo, at)`, projected from `segment.completed` + `objective.state_changed` | A pack A run produces attempt rows for the `plan-commitment → break-arrived` segment; replaying the same run twice is idempotent | B7-1, B4.1 |
| B7-4 | **Concept key space** | `concepts[]` items constrained to a namespaced id and resolved against a repo-level concept registry; `pack-check` fails unknown concepts (the same closed-vocabulary discipline as `pack-validation.ts:11`) | Pack A's `break-timing` resolves to one registry concept; a typo fails validation instead of silently creating a new concept | B6-1 (studio surfaces the registry) |
| B7-5 | **Due model and `/learn`** | A scheduler over attempt rows: **blocked** repetition while the last attempt is `failed`/`degraded`; **varied** repetition after `achieved`/`preserved`, with the variation axis drawn from `retryVariants` (typed in this slice) | `/learn` and the Home card show real due work; opening a due item starts the right run; with zero attempts, `/learn` says so honestly rather than inventing a curriculum | B7-3, B7-4 |
| B7-6 | **`transfer.scheduled` gets a producer** | Scheduling a retry from a node emits the event with a `scheduleId` foreign-keyed into the progress store | Rewind, schedule a related retry, see the event in `/events` and the item in due work — the first non-inert use of a run event type that has shipped since v0.3 | B7-5 |
| B7-7 | **Related-position transfer** | Relation built from `transposeKey` (exact) plus shared registry concepts (related); retrieval ranked and honestly labelled as one or the other | After failing the c5 race, due work offers a root sharing `break-timing` from a different pack, labelled "related concept", not "same position" | B7-4, B7-5 |
| B7-8 | **Optional personal-history recommender** | Opt-in, off by default: import personal PGN, index reached `transposeKey`s, rank *existing* packs by how often the learner actually reaches them. It ranks; it never authors, never grades, never gates | With import off, B7-1..B7-7 pass unchanged; with it on, pack ordering changes and nothing else does. ADR-0003 holds by construction | B7-3, B6-5 (PGN parsing) |

Ordering note: B7-1 first is not preference. Every subsequent row needs a subject, and
`storage.ts` shows exactly one table today — adding the column before schedules exist is
one migration instead of three.

## B6. Dependencies

**In:** run storage and its migration mechanism (`storage.ts:339-374`); `deriveSegments`;
`transposeKey`; `transfer.scheduled`; the reserved `/learn` route (`router.ts:24`);
B6-5's PGN parsing for B7-8; B6-1's studio for the concept registry.

**Out:** B7-3's attempt rows are the measurement substrate for C3, C4, K1, K8, and the
"voluntary return to the same concept" success metric (`gates.md:143`) — all currently
unmeasurable because nothing records an attempt. B7-4's concept keys are what program
item #2 needs to anchor an explanation to a concept rather than a sentence.

**Contradiction to record:** `gates.md:143` already tracks "voluntary return to the same
concept" as a success metric, though no mechanism exists by which a concept could be
returned to. B7-3/B7-4 are what make that metric falsifiable rather than theater — the
same objection the "Small-n evaluation methodology" row raises (`design/BACKLOG.md:108`).

## B7. Proposed BACKLOG row edits (B7)

Table: `design/BACKLOG.md` §Breadth-first product surfaces (Surface | Breadth requirement | Home).

Existing first cell: `| Learn/return system |`
```
| Learn/return system | **B7, program item #7, scheduled.** Learner subject, run duplicate/retry with verified reload, episode-attempt records, concept key space, due model over blocked vs varied repetition, related-position transfer, optional recommender. Slice plan: `planning/breadth/create-and-return.md` §B5 | `03-product-breadth.md`, `01-training-model.md`, `planning/breadth/create-and-return.md` |
```

Existing first cell: `| Episode/concept SRS |`
```
| Episode/concept SRS | **B7-3/B7-5, scheduled.** Unit of scheduling pinned to the *episode attempt* — `(learnerId, packId, startCheckpointId, endCheckpointId)`, `packDigest` recorded — with `transposeKey` and registry concepts as secondary indexes; never memorized moves (that shape is kill criterion K1). Progress lives in a sibling projection store, not in the run event log, which is single-table and lease-scoped (`apps/server/src/storage.ts:177-184`) | B7, `03-product-breadth.md`, `01-training-model.md §Repetition`, `planning/breadth/create-and-return.md` §B4 |
```

Existing first cell: `| Optional personal-history recommender |`
```
| Optional personal-history recommender | **B7-8, scheduled, strictly additive.** Opt-in and off by default: indexes the learner's own reached positions to *rank existing packs*. It never authors, grades, or gates, and every other B7 slice must pass acceptance with import switched off — ADR-0003 enforced by acceptance, not intent | B7, ADR-0003, `03-product-breadth.md`, `planning/breadth/create-and-return.md` §B5 |
```

Table: `design/BACKLOG.md` §Untracked-until-now gaps (Idea | Take | Home).

Existing first cell: `| Skill/progress model + return loop |`
```
| Skill/progress model + return loop | **Designed and scheduled as B7-1..B7-7** (`planning/breadth/create-and-return.md` §B4–B5). The two blockers were structural, not conceptual: there is no learner subject on the server at all (runs are keyed by run id; the only actor token is a browser-local writer UUID) and no cross-pack concept key (`concepts[]` are bare strings unique within one pack). Both are fixed before the scheduler, since "voluntary return to the same concept" is already a tracked success metric with no mechanism behind it | B7, `gates.md`, feeds Q1b, `planning/breadth/create-and-return.md` |
```

## B8. Owner-level questions (B7)

1. **Confirm the unit of scheduling.** §B4.1 pins the **episode attempt**
   `(learnerId, packId, startCheckpointId, endCheckpointId)`, with `transposeKey` and
   concept as secondary indexes. The alternative reading of `03-product-breadth.md:73`
   ("SRS over episodes/concepts") is concept-primary: that makes the concept registry
   (B7-4) a prerequisite for *all* scheduling rather than an index, and schedules across
   packs from day one. Episode-primary is cheaper and matches `01-training-model.md:9`;
   concept-primary is a stronger claim about what the product believes it teaches. Not
   cheaply reversible once attempt rows exist.
2. **Does a learner subject exist server-side, and is it singular?** B7-1 proposes a
   `learnerId` column with a single local-profile default and no auth — enough to scope
   progress in a self-hosted deployment, consistent with ADR-0004. If the intended posture
   is multi-profile (a household, a coach with students) or shared/hosted, the subject
   needs to be a real entity now, which also decides A8-Q1 (community contribution) since
   both need the same identity. Q2 (source model/deployment) is the parent question and
   is still open (`planning/exploration/plan.md:20`).
