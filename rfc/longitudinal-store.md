# RFC: Longitudinal store — the personal observation ledger

- **Status:** accepted — 2026-08-22, by claude as register owner on the buildability test, after cross-review (corrections in place; the **grain amendment** — `decision_class` in the PK, [[D934]] — is the substantive change, made because the drafted key would have pooled the historic player's moves, the learner's rehearsal and their predictions into one habit denominator: the exact corruption the store exists to prevent). Three open questions resolve before implementation per their own clauses; the crash-window honesty note and AC-11's derivation-digest pin ride the criteria. *(Prior line for history: draft 2026-08-22 — adversarial cross-review on the buildability test)*
  completed 2026-08-22 with corrections applied in place: the observation grain gains
  **`decision_class` (played / game / predicted)** with owner-only attribution over
  durable records — the played/predicted/reviewed separation `session_kind` alone cannot
  carry — plus the crash-window transactionality statement, the accumulation-order and
  forced-move pins, the AC-11 digest-and-rev fixture, and the refs-dominated size term in
  open question 2. Verdict: **accept-after-corrections** (corrections applied; the three
  open questions still resolve before `accepted`, per their own clauses). Original line:
  the thrice-named blocker, specified as a storage projection
  with no learner-facing surface. [[D844]] names the store, not a collector, as the tip
  sentence's blocker; [[D842]] needs opportunity denominators over time; Wave C's consumer
  matrix holds habit classification at **zero rows** until this exists
  (`rfc/semantic-collectors.md` §5.1). This RFC ships the store and its rebuild instrument
  only; every reader of it is a later RFC
- **Author:** claude
- **Created:** 2026-08-22
- **Design refs:** `design/03-product-breadth.md` §Learn and return;
  `design/06-campaign.md` §3 law 2 (ADR-0007 — progression unlocked by playing, never
  purchased — binds any future credit consumer, not this store); ADR-0005 (law 8). The design basis is
  research-tier and cited as such: `design/research/player-analysis-and-skills.md` §3
  (credit rules) and §6 (dependency edges), and
  `design/research/grounded-coaching-aggregation.md` (R13) §2 (the personal observation
  ledger and its seven invariants)
- **Exploration gate:** owner ideas **D549/D552/D553** (2026-08-20, verbatim in the dossier);
  the D842–D844 dossier landing 2026-08-22. Product RFC drafting is open per the 2026-08-12
  owner ruling (`rfc/README.md` §Exploration gate). The R13 research exit is complete on its
  mechanical arm; the owner-use arm is [[D649]]'s validation-by-use posture and does not
  block a storage contract
- **Depends on:** `rfc/archive/semantic-evidence-selection.md` (F2 —
  `legalAlternativeEdges`, `localSemanticEvents`, the complete legal-alternative
  population), `rfc/archive/evidence-contract-manifest.md` (F1 — the versioned projection
  ids this store keys on), `rfc/archive/return-and-progression.md` (the `attempts`
  projection seam and migration-6 replay precedent),
  `rfc/archive/learner-identity-and-authorization.md` (`learners`, cascade posture),
  `rfc/archive/game-import-and-story.md` (imported runs — this store's first population)
- **Coordination:** `learner-rating.md` (migration order — this RFC claims the position
  behind its two claims; and R15 — its §8 refusal and rendering-set, quoted and extended
  to both directions of this store in §5.2 here, enforced as reachability since a
  consumer-less store has no rendered bytes for a byte-identity fixture to compare);
  `portable-account-data.md` (the two new durable classes join its export/deletion
  inventory — Discharge D1)
- **Parent / amends:** —
- **Supersedes / superseded by:** —
- **Planning:** `planning/longitudinal-store/` (once implementing)

```tabiya-claims
migration | position behind learner-rating | learner_observations; learner_structure_stats
```

## Summary

A per-learner, per-game store of **opportunity/outcome pairs over declared evidence**,
phase-split and **decision-class-split** (played / game / predicted — action, observed
source-game moves, and guesses never pooled by default), keyed by the F1 projection ids
that produced them, plus the per-root
**attempt-structure counts** (rewinds, forks, comparison groups) that every surveyed
competitor destroys. The store is a **projection of the run event log** — derived at the
existing attempt-projection seam, idempotent, and re-derivable byte-for-byte by a rebuild
instrument — never a second source of truth. It ships **no learner-facing surface**: no
route, no client code, no habit card, no skill credit, no tip. Those are F6/F9 lanes with
their own RFCs; what they all block on today is that **no declared-evidence observation
survives the run that produced it**, and this RFC removes exactly that blocker.

## Motivation

### The blocker, named three times

1. **[[D844]]** — the owner's tip sentence (*"early game is solid, but in the midgame your
   play is too simple and positional, not enough tactics"*) decomposes into three grounded
   phase-split aggregates, and §6 of the dossier finds *"nothing persists cross-game today —
   the longitudinal store precedes every habit card."*
2. **[[D842]]** — a skill credit is an opportunity-normalized rate with a per-metric floor;
   *"rate = credited events / declinable opportunities."* The denominators exist transiently
   (F2 enumerates the complete legal-alternative population at every decision) and are
   discarded with the response.
3. **Wave C** — `rfc/semantic-collectors.md` §5.1 pins the refusal: *"Habit rows: 0
   (intentionally held until opportunity denominators, sample floors and the longitudinal
   store exist)"*, with a matrix invariant that fails the suite if any row names a `habit`
   consumer. That zero is correct **and stays correct until this RFC lands.**

### "Nothing persists cross-game", verified at the symbol

The claim needs precision, because durable learner-keyed tables do exist. What exists at
HEAD, and why none of it is the longitudinal source:

| What persists | Symbol | Why it is not this store |
|---|---|---|
| `attempts` — per-branch verdict/result/attempt-no | `apps/server/src/storage.ts` (migration 6 DDL; `session_kind` CHECK `('pack','position')`) | rehearsal history on selected roots; **imported runs are excluded by the CHECK itself**, and `projectAttempts` returns an empty projection for `sessionKind === "imported"` (`apps/server/src/progress.ts:84`) |
| `attempt_concepts` — concept credit rows | `apps/server/src/storage.ts` | keyed `pack:<packId>#<raw>` by `PackScopedConceptResolver` (`apps/server/src/progress.ts:56-59`) — cross-pack recurrence is [[D300]]'s open migration |
| `learner_position_stats` | `apps/server/src/storage.ts` | a bare `seen_count` per transpose key; no evidence, no denominator |
| `ProgressStorage.metrics` | `apps/server/src/storage.ts:379` | returns counts with **no source rows and no opportunity denominators** (R13 §1 census) |
| `shapeRecommendations` | `apps/server/src/service.ts:819` | **recomputes** by replaying preserved runs, capped at `list(learnerId, 50, 0)` — the measured symptom of having no store: every longitudinal read is a bounded corpus replay, and node identity is dropped into a run-only set |
| F2 semantic events | `packages/runtime/src/semantic-evidence.ts` | computed on demand, entered into **no** storage (R13 §1 census `[V]`) |

So the precise statement is: **no declared-evidence observation, and no opportunity
denominator, persists cross-game.** The run event logs persist everything — `drill_runs`
retains complete event logs, and the runtime appends `run.rewound` rather than deleting
(the attempt-history advantage `teardown-chesscom-desk.md` §Q1 measures competitors
destroying) — but nothing queryable is derived from them. The store is the missing
projection, not a missing collector: Wave B/C shipped the events; R12 already computed
`played_event − legal_alternative_share(event)` over 261,892 decisions with the same
primitives this RFC persists.

### Scope boundary — explicitly out

- **No learner-facing surface.** No route, no client change, no `/capabilities` entry, no
  inspector panel. The store is readable only through the typed storage contract (§6) and
  the rebuild instrument. `docs/return-and-progression.md:47-49` (*"never add a skill
  percentage, score, streak, rating, ranking, or cross-learner comparison"*) is untouched
  and untouchable by this RFC: nothing here renders.
- **No habit cards, skill credits, milestones, tips, or style axes.** Those are F6/F9
  consumers (D549/D552/D844) with their own RFCs, floors, and validation obligations.
- **No opening-identity rollups.** Deferred on [[D694]] — see §8.2.
- **No concept-keyed aggregation.** Deferred on [[D300]] — see §8.1.
- **No rating input or output.** §5.2.
- **No LLM anywhere.** Law 8; the schema has no prose column for an LLM to fill (§5.3).

## Specification

### 1. Vocabulary

- **Decision** — a user-actor node in a run: a `Node` with `actor === "user"` and a
  non-null parent, identified by `(parent.fen, node.moveUci)` — **attributed to the run's
  owner, or booked not at all** (§4.2's attribution rule; a grant holder's or seated
  opponent's move is another learner's hand and is never the owner's observation).
- **Decision class** — *how the learner met the decision*, a closed three-value
  vocabulary added by the 2026-08-22 cross-review because `session_kind` alone cannot
  carry it (one imported run mixes all three): **`played`** — a decision the owner
  committed live (all owner-attributed user-actor nodes in `pack`/`position` runs; in
  imported runs, the owner's rewound/forked/extension play beyond the source mainline);
  **`game`** — a user-actor node on an imported run's source-game mainline (the historic
  player's move for the chosen side — the store does **not** assert that player is the
  learner; import headers are unverified); **`predicted`** — a decision evidenced by a
  `prediction.recorded` event (`packages/runtime/src/types.ts:227`), whose "played" edge
  is the predicted edge. Without this column, [[D860]]/[[D869]]'s prediction runs and
  third-party imports would silently pool observation with action — the exact habit-
  denominator corruption this store exists to prevent; a consumer that pools classes must
  do so by explicit filter, never by default.
- **Habit family** — one versioned F1 projection id from the ingest set (§3), e.g.
  `derived.semantic_avoidance.loose_piece` at version 1. The family **is** the F1 identity;
  this RFC invents no second taxonomy.
- **Opportunity** — a decision at which the family's event is exhibited by at least one
  edge of the population `{played edge} ∪ legalAlternativeEdges(parent.fen, node.moveUci)`.
  This is [[D842]] rule 1's *declinable* opportunity: the population includes the moves the
  learner did not play, so a credit computable only from moves that already exhibit the
  event is unrepresentable ([[D603]]'s all-ones alarm, made structural).
- **Occurrence** — an opportunity at which the **played** edge exhibits the event.
- **Phase band** — `classifyPhase(parent.fen).phase`
  (`packages/runtime/src/phase.ts:63`): `opening | middlegame | endgame`. The band is the
  measured window that makes "midgame" in the tip sentence a fact rather than vibes
  (dossier §5).
- **Root** — a branch's fork node, keyed by `rootKey(sessionKind, packId, transposeKey)`
  (`apps/server/src/progress.ts:67-73`), exactly as `attempts` keys it.

### 2. What is stored — two tables, one migration

Both tables follow the `attempts` cascade posture (`REFERENCES learners(id) ON DELETE
CASCADE`, `REFERENCES drill_runs(id) ON DELETE CASCADE`) and the migration-9 freeze lesson
(literal CHECK strings). `STRICT` throughout.

```sql
CREATE TABLE learner_observations (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  projection_id TEXT NOT NULL,
  projection_version INTEGER NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('opening','middlegame','endgame')),
  decision_class TEXT NOT NULL CHECK (decision_class IN ('played','game','predicted')),
  session_kind TEXT NOT NULL CHECK (session_kind IN ('pack','position','imported')),
  pack_id TEXT,
  decisions INTEGER NOT NULL,             -- owner decisions of this row's class in this run+phase (family-independent)
  opportunities INTEGER NOT NULL,         -- decisions where the family was declinable
  occurred INTEGER NOT NULL,              -- opportunities where the class's played/predicted edge exhibits it
  alternative_share_sum REAL NOT NULL,    -- Σ over decisions of (exhibiting alternatives / legal alternatives); 0 for a forced move (§4.2)
  occurred_refs TEXT NOT NULL,            -- JSON array of node ids (exact drill-down, R13 invariant 2)
  opportunity_refs TEXT NOT NULL,         -- JSON array of node ids
  derived_rev INTEGER NOT NULL,
  derived_at TEXT NOT NULL,
  PRIMARY KEY (learner_id, run_id, projection_id, projection_version, phase, decision_class),
  CHECK (occurred <= opportunities),
  CHECK (opportunities > 0)
) STRICT;
CREATE INDEX learner_observations_family
  ON learner_observations(learner_id, projection_id, projection_version, phase);

CREATE TABLE learner_structure_stats (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  root_key TEXT NOT NULL,
  root_node_id TEXT NOT NULL,
  session_kind TEXT NOT NULL CHECK (session_kind IN ('pack','position','imported')),
  pack_id TEXT,
  branch_count INTEGER NOT NULL,
  rewound_count INTEGER NOT NULL,         -- run.rewound events on branches under this root
  forked_count INTEGER NOT NULL,          -- branch.forked events whose new branch roots here
  group_count INTEGER NOT NULL,           -- group.created events whose sourceNodeId's branch roots here
  outcome_count INTEGER NOT NULL,         -- outcome.reached events on branches under this root
  derived_rev INTEGER NOT NULL,
  derived_at TEXT NOT NULL,
  PRIMARY KEY (learner_id, run_id, root_key)
) STRICT;
CREATE INDEX learner_structure_stats_root
  ON learner_structure_stats(learner_id, root_key);
```

Design notes, each load-bearing:

1. **The grain is per-game (per-run).** No cross-game total is ever stored; a window
   aggregate (per-family rate over the last N games, a sample-floor check, an eight-week
   early/late split) is **computed at read** by summing per-run rows. This is the
   D368/D487 discipline applied to learner data: *a fact you never write cannot go stale.*
   A stored running total is exactly the class of hand-maintained derived number those two
   rows measured rotting; a per-run row is a pure function of one run's bytes and never
   needs updating when the corpus grows.
2. **`CHECK (opportunities > 0)` — a denominator-free row is unrepresentable.** A family
   with no opportunity in a run+phase has **no row** (honest empty), never a zero-denominator
   row. R13's negative controls refuse denominator-free tendencies; here the schema refuses
   them.
3. **`decisions` is deliberately denormalized** onto every family row so a row is
   self-contained: rate, share-residual (R12's `occurred/decisions −
   alternative_share_sum/decisions` form) and opportunity density are all computable from
   one row without a second query. It is derived data inside a derived table; the equality
   instrument (§4.3) is what keeps it honest.
4. **`session_kind` includes `'imported'` — the deliberate difference from `attempts` —
   and `decision_class` carries what `session_kind` cannot.** The attempts CHECK excludes
   imported runs because a rehearsal verdict on an unauthored game is meaningless; an
   *observation* on an imported game is the entire point of a longitudinal profile (D552:
   "tells you all your openings"). But `session_kind` is per-run and the mixing is
   per-decision: a single imported run holds the source game's own moves (`game`), the
   owner's rewound-and-branched rehearsal inside it (`played`), and — once [[D860]]/
   [[D869]] lift the pack gate at `service.ts:1204` — the owner's guesses (`predicted`).
   The class column keys the row, so the three are never summed by accident; a habit
   denominator over `played` is action, `game` is observation whose subject identity the
   store never asserts, and `predicted` is its own behavioral channel, landing with no
   migration on the day solitaire ships. `session_kind`/`pack_id` still carry run
   provenance so consumers can apply [[D842]] rule 2 — drill outcomes credit *rehearsal
   result*, never *skill possessed* — and pack-selected exposure stays visible rather than
   laundered into a population claim.
5. **Anti-farming is a consumer join, with the key provided.** [[D842]] rule 3 (retries on
   one root contribute one opportunity row per distinct decision context) is enforceable by
   joining `learner_observations.run_id` to `attempts` (`attempt_no`, `origin`,
   `root_transpose_key`) and by `learner_structure_stats.root_key`; the store records
   facts and does not pre-aggregate them into a credit.
6. **`occurred_refs`/`opportunity_refs` carry exact node ids** so every count reopens its
   contributing rows (R13 invariant 2 — the property `shapeRecommendations` loses when it
   drops node identity into a run-only set). Refs are node ids within the row's own run;
   `run_id` is already a column, so a ref resolves without ambiguity.

### 3. The ingest set — declared, closed, versioned

The families ingested at landing are exactly the members of
`SEMANTIC_EVENT_PROJECTION_IDS` (`packages/runtime/src/evidence-catalog.ts:126`): the
structural events, transition events, avoidance events
(`derived.semantic_avoidance.*`), tactical events, castling events and derived exchange
events F2 registered — each already versioned, operand-declared, and manifest-compiled.
The set is transcribed **by symbol reference, not by copied list**: the derivation reads
the exported constant, so a projection added to F2's set under its own RFC enters the
ingest population at the next `derived_rev` bump (§4.4) rather than silently or never.

**What the ingest set is not:**

- It is **not** extensible by this store. Adding a family means adding a projection to the
  F1 catalog under whatever RFC owns that producer; the store follows.
- Producers outside the semantic-event set (shape firings, tablebase facts, clock spend,
  explorer joins) are **not ingested at landing** — open question 1 records the nearest
  candidate. Every one of them persists in run event logs and is re-derivable into this
  store later without data loss, because the store is a projection (§4.1); deferral costs
  a rev bump and a rebuild, not a migration.

### 4. The write path — a projection of the event log

#### 4.1 The store is a projection, never a second source of truth

Every row is a pure function `f(run bytes, durable attribution records, ingest-set
catalog, derived_rev)` — where the durable attribution records are the run's session
journal and match seating (`session_journal`/`match_states`, for owner attribution of
each commit) and its `imported_games` row (for the source-mainline boundary), every one
of them a durable single-writer store the rebuild reads exactly as the incremental path
does. The run event log is the primary authority; the store is a queryable index of it.
Three consequences are normative:

1. **No API writes rows except the deriver and the rebuild instrument.** There is no
   insert/update surface, no correction endpoint, no manual repair path. A wrong row is
   fixed by fixing the derivation and rebuilding.
2. **Any dispute between the store and a replay of the log resolves for the log**, by
   running the rebuild instrument (§4.3).
3. **Deleting the store loses nothing** but time: `make longitudinal-rebuild` restores it
   byte-for-byte from `drill_runs`.

This is the same relationship `attempts` already has to runs (`RunService.#project` →
`projectAttempts` → `upsertAttempts`, `apps/server/src/service.ts:1775-1793`), stated as
an invariant instead of an implementation accident, and it is the property that makes the
D368 staleness class structurally impossible here: the check is not "was this number
updated" but "does replay equal state", and an instrument runs it.

#### 4.2 Derivation

A new pure function in the `projectAttempts` family:

```ts
// apps/server/src/progress.ts (family home; exact file is the implementer's)
export function projectObservations(input: {
  readonly run: DrillRun;
  readonly ownerLearnerId: string;          // the run's owner — NEVER the acting writer
  readonly moveAuthorship: readonly MoveAuthorship[]; // deriveMoveAuthorship + match seats
  readonly importedMainlinePlies: number | null;      // from the imported_games record
}): {
  readonly observations: readonly ObservationRow[];
  readonly structureStats: readonly StructureStatRow[];
}
```

- **Attribution — the owner, or nothing.** Rows are derived for
  `ownerLearnerId(runId)`, **never** for the acting writer. This is a pin, not a detail:
  `RunService.#project` today receives `lease.learnerId`, and in a shared run (a live
  session with a board grant, a match with a seated opponent — `#matchMoveOptions`
  assigns `actor: "user"` to whoever holds the start side) the writer is not the owner.
  Wiring the writer in would attribute another learner's moves to whichever hand last
  persisted, and rebuild — which reads `owner_learner_id` — would silently disagree.
  Per-commit authorship derives from the durable records the platform already keeps:
  `deriveMoveAuthorship` (`apps/server/src/live-session.ts:18`) over the session journal,
  plus `match_states` seating for match runs. A user-actor decision whose commit is
  attributed to a non-owner produces **no row** — another learner's hand is neither the
  owner's action nor the owner's opportunity. A run with no session journal attributes
  every commit to the owner, which is today's single-player truth.
- **Decisions**: every owner-attributed node with `actor === "user"` and a parent, across
  all branches. Unlike `projectAttempts`, **imported runs are included** — `sessionKind
  === "imported"` produces rows, because a longitudinal store of native rehearsals only
  would repeat the R13 census failure this RFC exists to fix.
- **Decision class** (§1): in `pack`/`position` runs every decision is `played`. In an
  imported run, a user-actor node is `game` iff it lies on the primary branch
  (`run.branches[0]`) at a ply within the source mainline — the boundary is
  `importedMainlinePlies`, the move count of the immutable `imported_games` record's
  movetext (never inferred from timestamps), so an owner extension past a resigned
  game's tip books `played`, not `game`. A `predicted` decision is the **first**
  `prediction.recorded` event per `(nodeId, checkpointId)` — the untutored guess; later
  re-predictions at the same checkpoint are event-log history, not additional decisions
  (the [[D842]]-rule-3 discipline applied to guessing). Its population is
  `{predicted edge} ∪ legalAlternativeEdges(node.fen, predictedUci)` and its occurrence
  edge is the predicted edge; phase is `classifyPhase(node.fen)`.
- **Per decision**: population = played edge plus
  `legalAlternativeEdges(parent.fen, node.moveUci)`
  (`packages/runtime/src/semantic-evidence.ts:304`); events per edge via
  `localSemanticEvents` (`semantic-evidence.ts:263`); phase via `classifyPhase(parent.fen)`.
  For each ingested family: opportunity if any edge exhibits it; occurrence if the
  class's played/predicted edge does; `alternative_share_sum` accumulates
  exhibiting-alternatives ÷ legal-alternatives for the decision. **A forced move**
  (`legalAlternativeEdges` empty) **contributes 0 to the sum** — the only pinnable
  reading of 0/0 that keeps R12's share-residual form finite — and can still be an
  opportunity and occurrence through its own edge.
- **Aggregation**: rows keyed `(learner, run, family, phase)` per §2; structure stats per
  §2's event-to-root attribution — an event belongs to the root of the branch it names
  (`run.rewound.branchId`; `branch.forked`'s new branch; `group.created.sourceNodeId`'s
  node branch; `outcome.reached.nodeId`'s node branch), where a branch's root is its
  `forkNodeId` node, exactly as `projectAttempts` resolves roots.
- **Determinism**: output ordering is canonical (sorted by primary key), and — because
  `alternative_share_sum` is a REAL whose value depends on float summation order —
  **accumulation order is pinned too**: decisions accumulate in ascending event `seq`
  (node commit order). Two calls over the same inputs are byte-identical, and the
  incremental and rebuild paths share the one function, so equality never depends on two
  implementations agreeing.

#### 4.3 Writing, and the rebuild instrument

**Incremental write.** `RunService.#project` (the seam that already calls
`upsertAttempts`) additionally calls `ProgressStorage.replaceObservations(runId, rows)`:
one transaction that deletes the run's existing rows in both tables and inserts the fresh
projection. Whole-run replace makes the write **idempotent and order-independent** — the
final state after any sequence of persists equals a single derivation over the final run
bytes. The seam fires on every run mutation persist, which subsumes run close
(`outcome.reached` arrives through the same persist path); no separate close hook exists
to drift from. **The transactionality boundary, stated rather than implied:** the replace
transaction is atomic *within itself* but is a separate transaction from the run persist
it follows. In-process this window is unreadable — the storage connection is synchronous
and the seam runs in the same call chain as the persist, so no request observes a run
whose observations are mid-replace — and concurrent branch closes on one run are
serialized commits whose later projection covers both. What remains is the crash between
persist and projection: stale rows for exactly that run, which the default-mode rebuild
names (AC-5's missing/stale-run fixture) and `--write` repairs, and which no reader can
be misled by at landing because no consumer exists (AC-9). A future consumer RFC that
cannot tolerate the crash window moves the replace into the run-persist transaction; the
contract here is equality-or-detectably-behind, never a second truth.

**The rebuild instrument.** A `make longitudinal-rebuild` target running a server-side
script (entry `apps/server/src/longitudinal-rebuild.ts`, in the family of the migration-6
replay body at `storage.ts:3150-3165`, which already demonstrates replaying every stored
run through a projection):

- default mode: derive `projectObservations` over every run in `drill_runs` — joined to
  the same durable attribution records the incremental path reads (§4.1): the run's
  session journal, match seating, and `imported_games` row — compare the canonical
  serialization (stored rows read in primary-key order) against stored state, **exit
  non-zero naming every divergent row**;
- `--write`: replace stored state with the derived state in one transaction.

**Byte-equality is the contract**: incremental state and rebuilt state must be identical,
not equivalent. This is the D368/D487 discipline applied to learner data — the register
lesson (*"a hand-written copy is updated when a claim arrives and reliably is not when a
claim departs"*) holds for any incrementally-maintained store, and the answer is the same:
derive, and hold every written copy equal to the derivation with an instrument that can go
red.

**Why the migration carries no backfill.** The migration body (§7) is create-table/index
only. Backfill *is* rebuild: `make longitudinal-rebuild --write` run once at landing (and
by any operator after upgrading) produces the identical state a migration backfill would,
with one decisive difference — a migration body freezes forever and *"an already-applied
migration still runs on databases that never reached it"* (`rfc/README.md` §Migration
register), so freezing a semantic derivation over a moving ingest set into a migration
body would pin today's catalog into frozen literals, the exact hazard class the
migration-4/-9 freeze lessons record. The rebuild command always derives at current code,
and the equality criterion makes "backfill" and "repair" the same operation. (Migration 6
backfilled in-body because its projection was frozen alongside it at a pinned schema
version; this store's ingest set is deliberately not frozen.)

#### 4.4 `derived_rev`

`OBSERVATION_DERIVATION_REV`, an exported integer literal, stamped on every row. Bumping
it is **required** whenever the derivation function or the ingest set changes meaning, and
a bump obligates a rebuild (`--write`) before the equality criterion can pass again. The
honest limit of that guarantee: an *unbumped* semantic change passes AC-5 trivially — both
sides of the equality run the new code — and leaves production rows stale under an
unchanged rev until an operator happens to rebuild. The rev is therefore held by a fixture
rather than by discipline alone: **AC-11 commits the pair `(fixture-corpus derivation
digest, OBSERVATION_DERIVATION_REV)` as one literal**, so any change to derivation output
fails a test and forces the author to touch the line that names the rev — an unbumped
change becomes a diff-visible refusal instead of a silent mix.
Together with the projection version in the key, this is R13 invariant 7 (versioned
recomputation — classifier improvements do not rewrite old claims invisibly) in storage
form: a producer's semantic change arrives as `projection_version` N+1 rows under a new
rev, visibly re-derived, never as edited history — and superseded-version rows do not
linger, because the rebuild derives exactly the current catalog and the event log remains
the archive of everything else.

### 5. Never stored — the pins, each with its mechanism

#### 5.1 No style vector leaves the learner's row space (R12; [[D843]])

R12 re-identified **35 of 36 accounts** from disjoint halves of the style vector: a
measured-habit profile is behavioral identifying data. Storage-side pins:

1. **No table stores a per-learner metric vector, archetype, axis label, or composite.**
   The store holds per-run opportunity/outcome pairs; any vector is computed at read,
   inside the learner's own authenticated request, by a future F9 consumer, and is never
   persisted by that consumer into these tables (§4.1's no-other-writer rule makes this
   structural).
2. **No cross-learner read path exists.** Both read methods (§6) take a `learnerId` and
   return only that learner's rows; there is no cohort, classroom, or population query.
   Classroom and cohort-standing modules (`apps/server/src/classroom.ts`;
   `learner-rating.md` §10a) gain **no join** to these tables — asserted by the
   reachability criterion (AC-6), the same enforcement shape as R15's.
3. **Export is owner-only**: rows leave the database exclusively through the learner's own
   account export (§7.3). No submission shape, share packet, or teacher grant includes
   them.

#### 5.2 Nothing rating-conditioned, in either direction (R15, quoted and extended)

`learner-rating.md` §8/R15, the byte-identity rule this store inherits verbatim:

> *a rating may select WHAT a learner is shown — which pack, which band, which population —
> and may never appear as an input to WHAT IS SAID about a move they played. Selection,
> yes; rendering, never.*

Extended here to both directions of this store, as the dossier's edge 6 requires:

- **Nothing rating-conditioned is stored.** No column derives from `learner_ratings` or
  any projection of it (`rating`, `rd`, band-equivalent, bracket, `seed_band`,
  `period_no`); the derivation module imports no rating module. A stored aggregate that
  silently baked in a rating would make every future consumer rating-conditioned at once —
  chess.com's `Brilliant` failure installed at the storage layer.
- **The store reaches no rendering input.** No module in learner-rating's AC-11 rendering
  set (`guard.ts`, `guard-conditions.ts`, `voice.ts`, `outcome-presentation.ts`,
  `feedback.ts`, `objective.ts`) imports the store; observations may later *select* (which
  card, which drill door, which campaign gate a mastered skill opens — D297's
  knowledge-as-key spend, under ADR-0007's never-purchased constraint) and may never
  change what is *said* about a move. Enforced as module-graph reachability (AC-5), not as
  a principle.

#### 5.3 No LLM output, no prose, no verdict (law 8)

Every column is an id, closed-vocabulary token, count, share-sum, ref array, revision or
timestamp. **There is no
sentence column, no label column, no verdict column** — the same "no column any renderer
reads" property `learner-rating` §10.1 establishes for its tables, here with the stronger
consequence that LLM text has no cell it could occupy. The derivation reads rules-grounded
event functions only; the writer imports no provider module.

#### 5.4 No stored cross-game total, no stored credit, no stored tier

Rates, floors-cleared, milestones and windows are consumer arithmetic at read time over
per-run rows (§2 note 1). A stored tier would be the first learner-facing number this
product ever persisted about a learner's skill, and it belongs to the F9 RFC that can
validate it — with [[D842]]'s floors and [[D603]]'s alarms — not to storage.

### 6. The read path

#### 6.1 Consumers at landing: none — stated, not implied

No production code reads these tables at landing except the rebuild instrument. The
`ProgressStorage` interface gains two typed, learner-scoped methods:

```ts
observations(learnerId: string, filter?: {
  readonly projectionIds?: readonly string[];   // family ids, versions in-key
  readonly phases?: readonly ("opening" | "middlegame" | "endgame")[];
  readonly decisionClasses?: readonly ("played" | "game" | "predicted")[];
  readonly sessionKinds?: readonly ("pack" | "position" | "imported")[];
  readonly since?: string;                      // derived_at lower bound
}): readonly ObservationRow[];

structureStats(learnerId: string, filter?: {
  readonly rootKey?: string;
}): readonly StructureStatRow[];
```

These are the contract future consumers read. Registered, named, and **not built here**:

| Future consumer | Ledger/lane | What it reads |
|---|---|---|
| Habit cards / skill credits / milestones | F9; [[D549]]/[[D842]] | family rows + floors over summed opportunities |
| The longitudinal tip sentence | F9; [[D844]] — a registered F1 §6.1 `RenderedEvidenceView` consumer | three phase-split family aggregates with baselines |
| Review longitudinal focus | F6 (excluded until F9 per the rfc-graph F6 row) | family rows joined to Review moments |
| Assistance-fade instrument | [[D882]] | opportunity-normalized rates with [[D842]] floors |
| Campaign credit currency | [[D893]]/[[D297]] (knowledge-as-key; ADR-0007) | mastered-family reads that *open* content |
| Difficult-roots surface | [[D865]] | `structureStats` joined to preserved attempts |

None of these may query the tables directly; each registers its own F1 consumer and reads
through the typed contract, so the R15/R12 pins of §5 sit on one chokepoint.

#### 6.2 Decided and argued: a storage table with a migration, not an F1-registered aggregate schema

The alternative was to version the aggregate shapes on F1's extensible
producer/projection set and avoid a migration. Refused, on the division of labor the F1
contract itself draws: the catalog (`evidence-catalog.ts`, compiled and digest-frozen) is
a **static declaration of meanings** — every F1 producer recomputes; nothing in the
catalog is durable per-learner state, and `docs/evidence-contract.md` scopes F1 to
*"eligibility and traceability only."* Durable rows need deletion cascades, export
inventory membership, and a migration ladder position — storage concerns the catalog
rightly has no vocabulary for. What the store takes **from** F1 is identity: rows are
keyed by projection id + version, so the aggregate's semantic versioning *is* F1's
projection versioning plus `derived_rev`, and no third versioning scheme is invented. A
future F9 consumer that renders an aggregate registers **itself** on F1 (as
[[D844]] already specifies for the tip); the table is where the numbers wait for it.

### 7. Migration, register, and claim

- **Claim:** one migration position, **behind `learner-rating`'s two claims** — declared in
  this RFC's `tabiya-claims` block as `position behind learner-rating`, per the
  position-not-integer rule (a claimed-but-unlanded number is a hole the next landing seals
  shut; the number is taken as `STORAGE_VERSION + 1` at landing, never before).
- **Verified at HEAD:** `STORAGE_VERSION` is **24** (`apps/server/src/storage.ts:476`),
  landed by `archive/teacher-surface.md`; the only live claimants are `learner-rating`'s
  two `position next` lines (`rfc/README.md` §Migration register). If `learner-rating`
  stalls or splits, the order renegotiates in the register; this RFC can land first only
  by that renegotiation, never by taking a number.
- **Body:** create-table/index only — the two §2 tables and their indexes. No backfill
  (§4.3's argument), no snapshot rewrite, no run-schema or pack-schema change, no stamp.
- **Landing edits the literal assertion** `expect(STORAGE_VERSION).toBe(24)` at
  `apps/server/src/live-session.test.ts:29` (correct at HEAD as of this draft; re-derive at
  landing).
- **All other registers: nothing claimed.** No pack lane, no run-schema lane, no
  shape-entry lane, no principle-entry lane, no evidence-kinds member. The run schema is
  read, not written: the store consumes existing event types
  (`run.rewound`, `branch.forked`, `group.created`, `outcome.reached` —
  `packages/runtime/src/types.ts:294-310` union) and adds none.

### 8. Retention identity — what the keys are pinned to, and what is deferred

#### 8.1 Keys are F1 projection ids; concept identity is deferred on [[D300]]

Aggregates key on projection id + version, **not** on pack concepts, and the choice is
argued rather than defaulted:

- Projection ids are **registered, closed, versioned, single-writer** resources — the F1
  contract's whole mechanism — with a compiled manifest digest guarding drift. A semantic
  change arrives as a new version, which is a new key: old rows are never silently
  re-meant. That is stable enough to persist against, in exactly the way prose labels are
  not.
- Cross-pack concept identity is [[D300]]'s open migration: 156 distinct concept strings,
  132 singletons, persisted under `pack:<packId>#<raw>` keys. Keying durable aggregates on
  an identity scheme whose unification is an open question would either freeze the wrong
  identity or force a rewrite of learner data when D300 resolves. So: **no concept-keyed
  rows here**; `attempt_concepts` is untouched; when D300's cross-pack resolver lands,
  concept rollups become a consumer-side join (`attempt_concepts` × `attempts` ×
  `learner_observations` on `run_id`), and this store needs neither a column nor a
  migration for it.

#### 8.2 Opening-identity rollups: deferred on [[D694]], with the honest-empty stated

The dossier's Openings column (per-opening accuracy, theory-match depth) is blocked at
HEAD by design: runtime opening identity is **refused** at
`apps/server/src/position-evidence.ts:25` (*"Opening identity is position naming, not a
recorded measurement"*), and [[D694]] measured zero runtime reach; the R8/F7
position/transposition-keyed runtime join is the gated route, and `semantic-collectors.md`
assigned the opening trio to that RFC. This store therefore ships **no opening rollup
table and no opening column** — not an empty table with an unpinned key, because pinning a
column for an identity vocabulary that does not exist yet would encode intent, not a
schema. When the runtime join lands, its RFC adds the rollup table in its own migration,
keyed on whatever identity it actually ships, and populates it by rebuild over the same
preserved runs — deferral loses no data (§4.1). Until then, any consumer asking this store
an opening-shaped question gets the only honest answer: the family is not stored, stated
as absence, never approximated.

### 9. Privacy, deletion, export, posture

1. **Learner deletion is a hard cascade.** Both tables `ON DELETE CASCADE` on
   `learners(id)` — migration 2's posture, same as `attempts`. The `__legacy` reassignment
   precedent (`LEGACY_ID`, `apps/server/src/storage.ts:477`) is **deliberately not used**:
   reassignment exists to preserve *shared* artifacts other learners retain access to, and
   these tables are never shared (§5.1), so on account deletion they are erased, not
   tombstoned. Given R12's re-identification result, retaining "anonymized" observation
   rows would be retention in disguise.
2. **Per-run deletion cascades too** (`drill_runs(id) ON DELETE CASCADE`): deleting a run
   deletes every observation derived from it, keeping the store a projection of the logs
   that remain — and keeping `portable-account-data`'s exact per-run deletion preview
   truthful when it counts these rows.
3. **Export.** Both tables are owner-exportable durable data and join the account-export
   and deletion inventories that `portable-account-data.md` (O13/D616's Choice-C appliance
   floor) maintains — Discharge D1. Rows are re-derivable, which makes them cheap to
   export and safe to *omit from import* (a future importer may rebuild them from imported
   runs rather than trusting exported aggregates — noted for that future RFC, decided
   here for neither side).
4. **Self-hosted posture ([[D649]]).** The owner's own data is the first corpus and the
   validation instrument is the owner playing. The rebuild instrument doubles as the trust
   instrument for a self-hoster: at any moment, `make longitudinal-rebuild` proves the
   store equals the logs — the store never asks to be believed.

## Deviations from design

One addition beyond the dossier, from the 2026-08-22 cross-review: the **`decision_class`
key column** (§1, §2). The dossier's aggregates assume the learner's own play; the shipped
event stream also carries source-game moves (imported mainlines, `importGame` commits them
with `actor: "user"` for the chosen side) and predictions ([[D860]]), and a store poured
without the distinction could never add it to already-derived history without a rev bump
it had no column for. R13 §3's module split (observed habit / recurring situation /
rehearsal result) is the same distinction one tier up, so this is the dossier's own
posture pushed into the key rather than a departure from it.

Otherwise none. The store implements the dossier's §6 edge 1 and R13 §2's ledger shape as
specified.
Two boundaries are tighter than the research proposed, not looser: R13 invariant 5's
applicability join (theory/pack ids on each observation) is left to F7's exact join rather
than stored here (the refs and `pack_id` carry the join keys), and R13's "measured value +
uncertainty" fields are consumer arithmetic (§5.4), not columns — both are narrowings a
consumer RFC can relax by reading more, without a schema change here.

## Acceptance criteria

Every criterion is satisfiable at HEAD-plus-this-implementation, non-empty, and carries a
negative fixture where it could otherwise pass vacuously.

- **AC-1 (migration is additive-only).** The migration creates exactly the two §2 tables
  and their indexes; a schema diff before/after shows only new objects; `STORAGE_VERSION`
  becomes the value the register assigns at landing (`+1` from the then-head, never a
  number from this document); the literal assertion in `live-session.test.ts` is updated.
  Negative fixture: a migration body that also rewrites a `drill_runs` row fails the diff
  test.
- **AC-2 (derivation, positive and honest-empty, and the class split).** A fixture run
  with hand-computed decisions yields exactly the expected `learner_observations` rows
  (values and refs); an `imported` fixture run **containing a learner fork** yields
  source-mainline rows with `decision_class='game'` and forked-branch rows with
  `decision_class='played'`, asserted separately with hand-computed counts for each; a
  fixture with a `prediction.recorded` event yields a `predicted` row whose occurrence
  edge is the predicted move, and a second prediction at the same `(nodeId,
  checkpointId)` changes nothing; a live-session fixture in which a **grant holder**
  commits a user-actor move yields **no row for that decision** (owner attribution,
  §4.2), and the suite asserts the absence; a fixture where a family has zero
  opportunities yields **no row** for that family, and the suite asserts the absence (not
  merely fails to assert presence). Negative fixture: a row with `opportunities = 0` is
  rejected by the schema CHECK.
- **AC-3 (structure stats).** A fixture run containing `run.rewound`, `branch.forked`,
  `group.created` and `outcome.reached` events across two roots yields per-root counts
  matching hand attribution per §4.2. Negative fixture: an event attributed to the wrong
  root's row fails the comparison.
- **AC-4 (idempotency and order-independence).** Persisting the same run twice produces
  byte-identical store state; persisting a run incrementally (mid-run, then final) equals
  a single derivation over the final bytes. Negative fixture: a writer that appends
  instead of replacing fails the second comparison.
- **AC-5 (rebuild equality — the instrument can fail).** Over a fixture corpus that
  includes an imported run, a shared run written by a non-owner, and a prediction run,
  incremental state equals `longitudinal-rebuild`'s derived state byte-for-byte. Three
  mandatory red fixtures, because an equality check that has never failed is [[D444]]'s
  class: tampering a **count** and tampering a **refs-array element** (data, not just
  totals) each make the instrument exit non-zero naming the row; deleting one run's rows
  entirely (the §4.3 crash shape) is likewise named. After `--write`, equality holds
  again.
- **AC-6 (reachability, both R15 directions and the R12 pin).** A module-graph test in
  the shape of `learner-rating.md`'s AC-11 asserts: (a) no module in the rendering set (`guard.ts`,
  `guard-conditions.ts`, `voice.ts`, `outcome-presentation.ts`, `feedback.ts`,
  `objective.ts`) imports the store/derivation modules; (b) the store/derivation modules
  import no rating module and no provider/LLM module; (c) `classroom.ts` and any
  cohort-standing module import no store module. Negative fixture: the test detects a
  synthetic fixture graph containing each forbidden edge.
- **AC-7 (learner scoping).** Storage-level: after writing learner A's rows,
  `observations(B)` returns empty; there is no storage method returning rows for more than
  one learner (asserted over the `ProgressStorage` interface). Negative fixture: a
  hypothetical unscoped method added to a test double is caught by the interface
  assertion.
- **AC-8 (deletion cascades).** Deleting a learner leaves zero rows in both tables;
  deleting one run leaves that run's rows absent and all others intact.
- **AC-9 (no consumer at landing).** A census test asserts that no production module
  outside the progress-storage implementation and the rebuild entry reads either table or
  calls the two read methods — the "research/report-only" boundary as a test, red the day
  a consumer wires in without its own RFC. Negative fixture: a synthetic importing module
  is detected.
- **AC-10 (closed column set).** A schema-reflection test asserts both tables' column
  lists equal the §2 lists exactly — the no-prose-column pin (§5.3) as a diff-visible
  gate. Negative fixture: adding a `sentence` column fails it.
- **AC-11 (rev discipline is a fixture, not a promise — §4.4).** One committed literal
  pairs the canonical-serialization digest of the derivation over AC-5's fixture corpus
  with `OBSERVATION_DERIVATION_REV`; a test derives at current code and asserts the pair.
  Any semantic change to the derivation or the ingest set changes the digest and fails the
  test, forcing the author to edit the literal that names the rev in the same diff.
  Negative fixture: recompute the digest with one predicate inverted and assert the pair
  no longer matches.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| `D1` | the two durable classes (`learner_observations`, `learner_structure_stats`) enter the account-export and account/per-run deletion inventories — `portable-account-data.md`'s §2 inventory if it is still active at this RFC's landing, else the landed export/deletion docs surface | `longitudinal-store` (self, at landing) | the landing commit | |

## Open questions

1. **Does `theory.shapes` join the ingest set in v1?** Shape firings are the
   highest-lift shipped detector family (named_structure 9.96×) and
   `shapeRecommendations`' 50-run replay cap is the measured cost of leaving them
   unstored. Proposal: no at landing (the semantic-event set is the coherent F2 unit; a
   shapes family needs its own opportunity definition, which is not the legal-alternative
   population), yes as the first post-landing rev bump once that definition is written.
   Resolve before `accepted`.
2. **Bulk-import scale.** A learner importing thousands of games multiplies rows by
   (families × phases × classes) per game — the ingest set is **40 families** at HEAD (11
   structural + 13 transition + 11 avoidance + 3 tactical + 1 castling + 1 exchange), so
   the per-run ceiling is ~120 family rows per class — and the honest cost term is not
   the counts but the **refs arrays**: `opportunity_refs` can hold every decision of a
   long game per firing family, so a dense family costs O(decisions) per row and a bulk
   import is O(games × families × decisions) bytes in the worst case, not "small rows."
   SQLite is ratified for this deployment shape, but no measurement exists. Proposal:
   accept without a cap; measure on the owner's own import corpus ([[D649]]) — refs bytes
   specifically, not just row counts — and let a future rev move refs to a side table or
   window them if the measurement demands it (a rev bump and rebuild, not a data loss).
   Resolve or explicitly defer before `accepted`.
3. **Who bumps `derived_rev`.** Proposal: any RFC that changes the derivation or the
   ingest set names the bump and the rebuild in its own acceptance criteria (the pattern
   §4.4 assumes); a bump outside an RFC is a defect. Resolve before `accepted`.

## Ledger rows

**Written 2026-08-22** as **D929** (drafted: the blocker routed as a projection of the
event log) and **D930** (pin: consumers read only through the typed learner-scoped
contract, each registering its own F1 consumer; the R15/R12 pins live at that chokepoint).
The cross-review found `design/BACKLOG.md` at HEAD carries a **D929 collision** — a
separate `promotion_pressure` absence-semantics row (tactical/semantic seam) also landed
as D929 — which the ledger owner resolves by renumbering the later row (proposed: D931),
exactly as the earlier D925→D927 collision resolved. Proposed by this review, from the
head after that renumbering and **not yet written**:

- **D932** — `longitudinal-store.md` cross-review correction: the observation grain gains
  `decision_class ∈ {played, game, predicted}` in the key, with owner-only attribution
  over the durable session-journal/match-seat records — `session_kind` alone cannot
  separate the source game's moves, the learner's rehearsal inside an imported run, and
  [[D860]]/[[D869]] predictions, and pooling them silently is the habit-denominator
  corruption the store exists to prevent.

## Changelog

- 2026-08-22: created.
- 2026-08-22: adversarial cross-review (claude, independent of the author). Blockers
  fixed in place: (1) `decision_class ∈ {played, game, predicted}` added to the
  observation key with owner-only attribution derived from the durable session
  journal/match seating and the `imported_games` mainline boundary — as drafted, imported
  mainline moves (`actor:"user"` by `importGame`'s side rule), the learner's own forked
  play in the same run, and future [[D860]]/[[D869]] predictions were indistinguishable,
  and shared-run writes would have attributed a grant holder's or seated opponent's
  moves to whichever learner last persisted while the rebuild attributed to the owner —
  byte-equality was unsatisfiable as specified; (2) §4.3 states the real transactionality
  boundary (replace is atomic but separate from the run persist; crash window detected by
  rebuild, unreadable at landing); (3) §4.4's "never mix revisions silently" narrowed to
  its true scope and held by the new AC-11 digest+rev pair fixture; (4) accumulation
  order and the forced-move 0/0 case pinned for byte-determinism of the REAL column; (5)
  AC-2/AC-5 fixtures extended (class split, grant-holder absence, refs-element tamper,
  crash-shape deletion); (6) open question 2 re-costed — refs arrays, not row counts, are
  the size term; (7) ledger section reconciled: D929/D930 landed, the HEAD D929 collision
  named, D932 proposed for the grain amendment.
