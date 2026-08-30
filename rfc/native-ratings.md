# RFC: native-ratings — the rating and result substrate for two-human play, built so a tournament is a feature

- **Status:** draft — **RETURNED by fresh independent buildability review 2026-08-30 on
  [[D2308]]–[[D2323]].** The color-oriented game-result direction survives. The result writer
  reverses resignation/flag winners; game truth and rating eligibility are conflated; proposed SQL
  admits contradictory lifecycle, rating and participant records; seat/game identities can
  disagree; deletion destroys shared history; the attempt migration misses live consumers; rating
  subject, migration and typed learner journey are incomplete; tournament readiness is vacuous;
  dependencies and owner questions remain unresolved; and the measured human-pool research refutes
  its direct-anchor publication rule. `make native-ratings-fresh-review` passes 16/16 and
  `make rating-pool-research` passes 5/5. No implementation before predecessor, owner and author
  repair plus another review
- **Author:** claude (native-ratings lane), from the measured DDL at HEAD, `rfc/social-play.md` §§1,
  3, 7, `rfc/learner-rating.md` §§2, 3, 5, 6, 8, 9, 10a, 11.3, `planning/ux-implementation-index.md`
  §Tournament readiness (T1–T22), and `design/research/league-as-return-loop.md` §§C5, C6
- **Created:** 2026-08-26
- **Design refs:** `design/03-product-breadth.md:53-55` (Position Arena's minimum and its *"native
  clocks/matchmaking can deepen later"* clause — see Deviations), `:92-97` (native match play as
  shipped), `:87-88` (the parked events row — **not** reopened here);
  `design/02-product-shape.md:98-99` (*"No operator account exists… never a privileged user"* —
  **conformed to, not deviated from**); `design/06-campaign.md:159-162` and `:453-455` (the rated
  boss, whose sentences describe the rated-game object and are narrowed by this change set — see
  Deviations); `design/05-in-run-experience.md:41` (*"Absence is stated, never simulated"*) and
  `:42` (session machinery *"may never alter what the run says happened on the board"*)
- **Exploration gate:** owner ruling **[[D1414]]** (O12 — 1.0 human play is native-first; native
  ratings were **never** part of [[D1416]]'s deferral) and owner clarification **[[D1520]]**
  (*"we def want to be ready for tournaments, 'native ratings' — like i have asked for that 10
  effing times already; i only said push the tournaments and operator accounts"* — [[D1416]]
  deferred the **features**, and the **architecture must be ready for them**). Routing failures that
  made this document necessary: [[D1516]], [[D1521]], [[D1529]].
- **Depends on:** `rfc/learner-rating.md` (implementing — the Glicko-2 arithmetic, the calibration,
  the periods, the refusals and the publication rules are **consumed, never re-decided**; this RFC
  changes its preconditions and §6 states the amendment it owes); `rfc/social-play.md` (draft — the
  native match, the terms object, the invitation state machine, and run-schema lane **0.23**'s
  `GameResignedEvent`/`DrawAgreedEvent`, which this RFC **consumes and does not claim**);
  `rfc/enforced-clocks.md` (draft — lane **0.21**'s `ClockFlaggedEvent` and its
  `rated_games.terminal_reason` widening, likewise consumed); `rfc/archive/social-match.md`
  (`match_states`, the seating and `MATCH_LIVE`); `rfc/archive/return-and-progression.md`
  (`attempts`, `projectAttempts`, `/learn`); `rfc/archive/teacher-surface.md` (`classrooms` and the
  delegated-capability model [[D1481]] found already ships);
  `rfc/archive/portable-account-data.md` (the inventory and disclosure lists every new table joins)
- **Consumes without re-specifying:** `rfc/bot-roster.md` and `rfc/bot-policy.md` (a bot entrant's
  identity is a band plus a container digest; nothing here selects a bot move),
  `rfc/campaign-core.md` (the rated boss rides the unchanged solo-bot arm)
- **Parent / amends:** amends nothing directly. **Names three amendments owed** — to
  `learner-rating.md` (§6), to `social-play.md` §3.6 (§5.3), and to `design/06` (Deviations 1).
- **Supersedes / superseded by:** —
- **Planning:** `planning/native-ratings/` (once implementing)

```tabiya-claims
migration | position behind theory-drill-current-joins | rated_games rebuilt as games plus game_sides with a colour-oriented declared result and a polymorphic opponent; attempts primary key widens to (run_id, branch_id, learner_id) and attempt_concepts re-points its foreign key at drill_runs; five new tables contests, contest_rounds, contest_encounters, encounter_seats, encounter_games
```

## Summary

A native match is **one run with two learners**, and every object this product would use to record
it is **single-perspective**: `rated_games.run_id` is a `PRIMARY KEY` so a run carries one rating
outcome; `attempts` is keyed `(run_id, branch_id)` so a run carries one learner's progress; and
`rated_games.result` is `win|loss|draw` — a value relative to *a learner*, which is the reason one
run cannot carry two. This RFC rebuilds that substrate once: a **game** with a **colour-oriented
declared result** and a **polymorphic opponent**, **one row per side**, one attempt row per seated
learner, and a **contest/round/encounter aggregate** above the game whose only 1.0 instance is the
friend match that already exists. Ratings for two-human play then fall out as a precondition change
in `learner-rating.md`, which stays the single writer. Nothing here builds a tournament — [[D1416]]
defers that feature and this document must not — but every closed vocabulary a tournament needs is
opened **now**, because on a `STRICT` table a `CHECK` edit is a rebuild and a rebuild is exactly
what [[D1520]] asks us to stop buying twice. The deferred members are held unproducible by a
compiled set difference, so the deferral is enforced in code rather than in prose.

## Motivation

### 1. What is measured, and what did not reproduce

Every claim below was re-derived at HEAD (`495645ee`) rather than inherited. Three inherited claims
**did not reproduce** and are corrected here rather than built on, which is the whole point of
re-deriving them ([[D1388]], [[D1477]], [[D1518]], [[D1531]] are the same class).

**Reproduced exactly:**

| # | fact | site |
|---|---|---|
| 1 | `rated_games.run_id TEXT PRIMARY KEY REFERENCES drill_runs(id)` — **one rated game per run** | `apps/server/src/storage.ts:4567` |
| 2 | `opponent_band INTEGER NOT NULL` and `engine_identity_digest TEXT NOT NULL` — both **presuppose a bot** | `:4570`, `:4575` |
| 3 | `rated_games` is `STRICT` (`:4584`), so a `CHECK` or nullability edit is a **rebuild** | `:4566-4584` |
| 4 | `live_sessions.run_id TEXT NOT NULL UNIQUE` — one session per run, **no aggregate above it** | `:3996` |
| 5 | `assignments` addresses `pack_id`; **nothing in the schema addresses an opponent** | `:4513-4521` |
| 6 | `assignment_submissions` has **no result column at all**; its key is `(assignment_id, learner_id, run_id)` | `:4525-4534` |
| 7 | `cohort_standings.classroom_id TEXT PRIMARY KEY` — **one standing per classroom, ever**; `standing_members` is self-published, so an organiser cannot enter anyone's result | `:4601-4616` |
| 8 | `learner_marks PRIMARY KEY (learner_id, mark)` — **one gold per learner for all time**, no event dimension | `:4617-4624` |
| 9 | `arena_legs.leg INTEGER NOT NULL CHECK (leg IN (1,2))` — hard-capped at two legs | `:4063` |
| 10 | **Zero** occurrences of `pairing`, `rounds` or `tournament` in `apps/server/src`, `apps/web/src` or `packages/` outside tests | `grep -rniE '\bpairing\|\brounds\b\|tournament'` |
| 11 | `outcome.reached` must **immediately follow** its `move.committed`, and the reducer throws *"references a non-terminal node"* when the board is not terminal — so a game ending with **no move** cannot be an outcome event | `packages/runtime/src/events.ts:330-333`, `:344-345` |
| 12 | `DrillRunEvent` is a union of **16** members | `packages/runtime/src/types.ts:294-309` |
| 13 | `STORAGE_VERSION = 25` | `apps/server/src/storage.ts:633` |

**Did not reproduce — corrected here:**

- **[[D1529]] item 9, *"`public_tokens.scope` is `CHECK (scope IN ('story_read'))` — a single value"*,
  is stale by eleven migrations.** That DDL is migration 13's (`storage.ts:3842`); **migration 14**
  (`native matches and session join tokens`, `:3727-3730`) rebuilt the table and the live `CHECK`
  reads `scope IN ('story_read','session_join')` (`:3958`) with a compound scope/column invariant
  beneath it (`:3971-3976`). The finding's *shape* survives and is strengthened rather than
  weakened: migration 14 is the worked example of what a scope addition costs — `ALTER TABLE
  public_tokens RENAME TO public_tokens_v13`, recreate, `INSERT … SELECT`, `DROP TABLE`
  (`:3953`, `:3977-3978`). What is false is the number.
- **[[D1529]]'s *"37 application tables"* is 40 at HEAD.** Derived, not counted by hand ([[D1240]]):
  `grep -oE "CREATE TABLE (IF NOT EXISTS )?[a-z_]+" apps/server/src/storage.ts | sed -E 's/CREATE
  TABLE (IF NOT EXISTS )?//' | sort -u | wc -l` → **40**, with the three `*_v13` rename targets being
  transient inside migration 14 and not tables. The count is a **drift tripwire, never a criterion**.
- **[[D1529]]'s *"`arena_legs` is the only table in the product with a declared `result`"* is false.**
  Four columns named `result` ship: `arena_legs` (`:4067`), `attempts` (`:4123`), `imported_games`
  (`:4394`) and `rated_games` (`:4578`). Two of the four are **learner-keyed**, which is the actual
  defect and is sharper than the one reported: the product has results, and every one of them is
  written from one person's point of view.

### 2. The defect is one shape, not three

The three objects a native match needs are broken **identically**, and that is why one rebuild
answers all of them.

| object | shipped key | what a two-human game needs |
|---|---|---|
| the rating outcome | `rated_games(run_id)` — one row | two, one per seated learner |
| the return-loop attempt | `attempts(run_id, branch_id)` — one row, carrying one `learner_id` | two, one per seated learner |
| the declared result | `rated_games.result IN ('win','loss','draw')` — relative to *a learner* | one, relative to **colour** |

The third line is the load-bearing one. `result` is learner-relative because `terminalOutcome`
computes it against a single side — `return position.turn === learnerSide ? "loss" : "win"`
(`packages/runtime/src/outcome.ts:12`), called with `data.start.side`
(`packages/runtime/src/events.ts:343`). A value defined relative to one participant **cannot** be
shared by two, so the one-row-per-run key is not an oversight to be widened; it is the correct key
for the value the column holds. Re-orienting the declared result to **colour** is what makes the
row a fact about the *game*, and each side's score a projection. That single change is also exactly
what a crosstable reads.

### 3. Two findings that make [[D1415]]'s repair insufficient as written

[[D1415]] rules that two-human play counts toward the return loop, and `rfc/social-play.md` §3.6
specifies the repair: remove the forcing at `service.ts:2134-2136`, which rewrites the projection to
`countable: false` whenever `#matchContext` resolves — and it resolves only for
`boardControl === "match"` (`:2057-2060`). **That is verified, correct, and not enough.** Two
mechanisms downstream of it were not in the memo.

**(a) The guest never gets a row, and cannot later.** `#project` is always called with
`lease.learnerId` (fifteen call sites, `service.ts:554`–`:2015`), so the attempt row's `learner_id`
is whoever's request produced the write. The upsert is
`ON CONFLICT(run_id, branch_id) DO UPDATE SET …` and its assignment list — nine columns at
`storage.ts:2561-2566` — **does not include `learner_id`**. So the row belongs permanently to
whoever wrote first, which for a native match is the host. Removing the forcing therefore makes a
friend game count **for the host only**, and the guest's play stays invisible in `/learn` forever.

**(b) The guest's moves are stamped as not-the-learner's.** In a match,
`#matchMoveOptions` derives the actor as `moverSide === run.start.side ? "user" : "system"`
(`service.ts:2116`), and `projectAttempts` computes
`userPlyCount = attemptPath.filter((node) => node.actor === "user").length`
(`apps/server/src/progress.ts:98`), with `countable: userPlyCount > 0` (`:124`). So even a row that
existed for the guest would count zero plies.

**Neither is a schema defect, and this is the RFC's one piece of good news.** `Node.actor` is a
three-member enum, `["user","opponent","system"]`
(`schemas/drill_run.schema.json:263`), and `"opponent"` is reserved for an engine-selected move
(`packages/runtime/src/runtime.ts:284`, `replay.ts:50`, `:83`, `guard.ts:89`). A match's `"system"`
therefore already **distinguishes a human guest from a bot**; the field is run-owner-relative and
correct as shipped. The repair is a **projection**, not a persisted field: the mover's colour is
derivable from the node FEN (the same expression `service.ts:2115` already uses) and the seat map is
`match_states.white_learner_id` / `black_learner_id` (`storage.ts:3984`, `:3985`). **No run-schema lane
is owed for the return-loop half** — see §7.2, where that is argued rather than assumed.

### 4. Why the aggregate is in scope when the tournament is not

[[D1416]] defers bot tournaments, leagues and operator accounts **as features**. [[D1520]] rules
that the **architecture must be ready for them**, and [[D1481]] named the two missing objects: a
**round/pairing aggregate** and a **declared result**. Both are visible in the DDL as absences
(facts 4, 5, 6, 10 above).

The scope boundary this RFC draws is not a compromise between them. It is this:

> **A friend match is a one-round, one-encounter, two-seat contest.** Building the aggregate at 1.0
> is not building a tournament; it is refusing to build the friend match as a special case that a
> tournament would later have to un-special.

Concretely, 1.0 writes exactly one contest shape and refuses every other **in code** (§4.4). A later
tournament RFC registers a second shape, adds a pairing algorithm, adds endpoints and adds rows. It
runs **no migration over these tables** — which is this RFC's acceptance test for itself
(criterion 14).

### Scope boundary — explicitly out

**Not specified here, and not deferred vaguely** (each of these has a home in §9):

- Any pairing algorithm, Swiss/round-robin logic, standings table, crosstable, tiebreak or seeding.
- Any organiser, arbiter or operator **role**. `design/02:98-99` refuses the account form and
  [[D1481]] found the capability already ships as `teacher-surface`'s delegated model.
- A public matchmaking pool — `social-play.md` Open question 1, reserved by [[D1414]] and untouched
  here. Nothing in this RFC leans on the answer.
- The bot event of `social-play.md` §6 — deferred by [[D1416]], and `BOT_POLICY_PROFILES =
  compileBotPolicyCatalog([])` is a literal empty array (`bot-policy-catalog.ts:299`), so it has no
  entrants to field.
- Clocks. `enforced-clocks.md` owns them on lane 0.21; this RFC consumes `clock.flagged` as a
  result cause and specifies no timing.
- The rating **arithmetic**, the calibration, the periods, the publication bracket and the sixteen
  refusals. All are `learner-rating.md`'s and are consumed verbatim.

## Specification

### §1 — Vocabulary

- **Game** — a played or unplayed contest between two sides that has, or will have, a **declared
  result**. A game may have a run (`games.run_id`) or none (a bye, a forfeit — reserved, §3.3).
- **Side** — one seat in a game, identified by **colour**. Exactly two per game.
- **Declared result** — the game's outcome oriented to **colour**: `white`, `black`, `draw` or
  `none`, with a **cause** (§3.2).
- **Rating outcome** — one `learner-rating` update owed to one side. A game with two learner sides
  owes two.
- **Contest** — the aggregate above the game: a named container with rounds, encounters and seats
  (§4). A friend match is a contest of kind `match`.
- **Encounter** — one pairing inside one round of one contest, realised by zero or more games.

### §2 — `games` and `game_sides`: the rebuild

`rated_games` is replaced. The name changes because the object changes: a row now exists for unrated
native matches too, since a friend game that ends in resignation has a result whether or not it
moves a rating.

```sql
CREATE TABLE games (
  id                TEXT PRIMARY KEY,
  run_id            TEXT UNIQUE REFERENCES drill_runs(id) ON DELETE CASCADE,
  origin            TEXT NOT NULL CHECK (origin IN ('solo_bot','native_match','imported','unplayed')),
  rated             INTEGER NOT NULL CHECK (rated IN (0,1)),
  calibration_id    TEXT,
  start_piece_count INTEGER,
  state             TEXT NOT NULL CHECK (state IN ('open','sealed','voided')),
  result            TEXT CHECK (result IN ('white','black','draw','none')),
  result_cause      TEXT CHECK (result_cause IN (
                      'checkmate','stalemate','insufficient_material','fifty_move','threefold',
                      'resignation','agreement','flag','flag_insufficient_material',
                      'forfeit','default','bye','adjudication','double_forfeit','withdrawal')),
  declared_by       TEXT REFERENCES learners(id) ON DELETE SET NULL,
  void_reason       TEXT CHECK (void_reason IN (
                      'rewound','forked','assistance','engine_changed',
                      'calibration_retired','abandoned','side_unrateable')),
  ply_count         INTEGER,
  started_at        TEXT NOT NULL,
  sealed_at         TEXT,
  CHECK ((state = 'open'   AND result IS NULL AND result_cause IS NULL AND sealed_at IS NULL)
      OR (state = 'sealed' AND result IS NOT NULL AND result_cause IS NOT NULL AND sealed_at IS NOT NULL)
      OR (state = 'voided' AND void_reason IS NOT NULL)),
  CHECK ((origin = 'unplayed' AND run_id IS NULL) OR (origin <> 'unplayed' AND run_id IS NOT NULL))
) STRICT;

CREATE INDEX games_run ON games(run_id);

CREATE TABLE game_sides (
  game_id            TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  colour             TEXT NOT NULL CHECK (colour IN ('white','black')),
  participant_kind   TEXT NOT NULL CHECK (participant_kind IN ('learner','bot','unknown','absent')),
  learner_id         TEXT REFERENCES learners(id) ON DELETE CASCADE,
  bot_band           INTEGER,
  bot_engine_digest  TEXT,
  rated              INTEGER NOT NULL CHECK (rated IN (0,1)),
  rating_before      REAL,
  rd_before          REAL,
  volatility_before  REAL,
  period_no          INTEGER,
  PRIMARY KEY (game_id, colour),
  CHECK (
    (participant_kind = 'learner' AND learner_id IS NOT NULL AND bot_band IS NULL AND bot_engine_digest IS NULL)
 OR (participant_kind = 'bot'     AND learner_id IS NULL AND bot_band IS NOT NULL AND bot_engine_digest IS NOT NULL)
 OR (participant_kind IN ('unknown','absent') AND learner_id IS NULL AND bot_band IS NULL AND bot_engine_digest IS NULL)
  ),
  CHECK (rated = 0 OR participant_kind IN ('learner','bot')),
  CHECK (rated = 0 OR (rating_before IS NOT NULL AND rd_before IS NOT NULL AND volatility_before IS NOT NULL))
) STRICT;

CREATE INDEX game_sides_learner ON game_sides(learner_id, rated);
```

Six properties are normative and each is there for a stated reason.

1. **`result` is oriented to colour.** §Motivation 2. Every per-learner score is a read-time
   projection: `score(side) = 1` where `games.result = side.colour`, `0.5` where `result = 'draw'`,
   `0` where `result` is the other colour, and **undefined** where `result = 'none'` (a game with no
   winner and no draw — a double forfeit or a voided encounter). `none` is not a draw and must never
   be scored as one; criterion 5.
2. **The opponent is polymorphic.** `participant_kind` replaces two `NOT NULL` bot columns. The
   three-arm `CHECK` makes an impossible side unstorable rather than merely undocumented.
3. **`rating_before`/`rd_before`/`volatility_before` are written at admission, never at seal.**
   This is what makes a two-learner update symmetric and order-independent: both sides read the
   other's **pre-game** state, so processing white first and black first give byte-identical
   results. Without it, whichever side is updated first moves the rating the second side is scored
   against. Criterion 6 permutes the order and asserts equality.
4. **Voiding is game-level, not side-level.** Derived rather than asserted: `learner-rating` §3's
   voiding conditions are `run.rewound`, `branch.forked`, `run.branches.length !== 1` and an engine
   identity mismatch — all four are properties of the **run**, which both sides share
   (`service.ts:2142-2170`). The one condition that is *not* obviously shared is assistance, and it
   is shared too: `seatedInContest` is produced for both seated learners
   (`service.ts:2069-2070`) and consumed identically (`assistance.ts`), so the withholding is
   symmetric. The residual — a **non-seated** host who can read evidence while two other people play
   — is `social-play.md` Discharge D9 and is a game-level void when it fires, because a third party
   feeding one player corrupts the game, not one seat. `side_unrateable` is the one side-shaped
   cause and it voids the **game**: if either side cannot be rated, neither side's outcome is
   trustworthy as a rating input.
5. **`run_id` is `UNIQUE`, not `PRIMARY KEY`, and is nullable.** Unique because a run is still at
   most one game; nullable because a forfeit and a bye are games with no run, and that is the
   difference between a schema a tournament can use and one it must rebuild.
6. **`start_piece_count` is nullable** because an unplayed game has no start position.
   `learner-rating` R5's ≥21 floor is checked at admission over `origin <> 'unplayed'`, unchanged.

### §3 — The declared result as a first-class object

#### §3.1 Why it cannot be an `outcome.reached`

`enforced-clocks.md` §3.1 established the mechanism for a flag and this RFC restates it because it
governs three more causes. `outcome.reached` must **immediately follow** its `move.committed`
(`events.ts:330-333`), and the reducer then re-derives `terminalOutcome` and throws
*"references a non-terminal node"* when the board is not terminal (`:344-345`). A resignation, an
agreed draw and a flag all end a game **with no move**. Appending an `outcome.reached` for one of
them does not fail at review — it **corrupts every later read of that run, permanently**, because
the reducer runs on every projection.

`social-play.md` §3.4 claims **run-schema lane 0.23** for `GameResignedEvent` and `DrawAgreedEvent`
on exactly that mechanism, and `enforced-clocks.md` claims **lane 0.21** for `ClockFlaggedEvent`.
**This RFC consumes both and claims neither** (§7.2). What it adds is the object those events feed:
a declared result that is not an event at all.

#### §3.2 The cause vocabulary, opened to its full extent now

`result_cause` is fifteen members, split into two sets that are **compiled**, not described.

**Producible at 1.0 — nine.** Each has a named producer that exists or is claimed:

| cause | produced by | owner |
|---|---|---|
| `checkmate`, `stalemate`, `insufficient_material`, `fifty_move`, `threefold` | `outcome.reached`, via `terminalOutcome`'s four cases plus the fifty-move/threefold arms (`packages/runtime/src/outcome.ts:10-15`) | shipped |
| `resignation` | `game.resigned` | `social-play.md` lane 0.23 |
| `agreement` | `draw.agreed` | `social-play.md` lane 0.23 |
| `flag`, `flag_insufficient_material` | `clock.flagged`, with FIDE 6.9's draw arm computed from the board | `enforced-clocks.md` lane 0.21 |

**Reserved and unproducible — six:** `forfeit`, `default`, `bye`, `adjudication`,
`double_forfeit`, `withdrawal`. These are the causes a Swiss cannot run without, and none of them
has a producer in 1.0.

The writer exports two frozen arrays, `RESULT_CAUSES` (fifteen) and `PRODUCIBLE_RESULT_CAUSES`
(nine), and one test asserts

```ts
setDifference(RESULT_CAUSES, PRODUCIBLE_RESULT_CAUSES) === DEFERRED_RESULT_CAUSES
```

by **id**, never by count ([[D1240]]), and a second asserts that `declareResult` refuses every
deferred member with `RESULT_CAUSE_DEFERRED`. Criterion 7.

**This reservation is argued, and it is argued against a real precedent in this repo.**
`design/03-product-breadth.md:328`'s B6 cell records the correction: `session_distilled` is *"a reserved
enum with zero producers"* and its presence let a breadth gate be claimed on a feature that did not
exist. The difference here is not confidence, it is **enforcement**: the deferred six are declared
unreachable by a compiled set difference and by a named refusal, so no gate, capability row or
surface can be claimed on them, and the build fails the moment someone adds a producer without an
owner ruling. What the reservation buys is that [[D1416]]'s deferral is honoured **in the writer**,
where it can be tested, rather than in the `CHECK`, where honouring it costs a `STRICT`-table
rebuild later. §8.2 states the cost of being wrong about this.

#### §3.3 Declaring a result

One server operation, `declareResult(gameId, { result, cause, declaredBy })`, is the **only** writer
of `games.result`. It is atomic with the seal and enforces:

1. **The cause must be producible** (§3.2), else `RESULT_CAUSE_DEFERRED`.
2. **The cause must agree with the run.** For the five rules causes the server re-derives
   `terminalOutcome` over the final node and refuses a mismatch (`RESULT_NOT_TERMINAL`). For
   `resignation`/`agreement`/`flag*` the corresponding run event must be the run's last event, and
   the declared colour must equal the event's own (`resignedBy`, the flagged side). **Nothing is
   inferred from the board for these three** — `social-play.md` §3.4 rule 3 is inherited verbatim:
   a resignation's outcome is a function of the resigning side alone, and we do not check whether
   the position was lost.
3. **`declared_by` is a record, not an authority.** It is the learner whose act produced the
   result — the resigner, the accepter of a draw — and is `NULL` for the five rules causes and for a
   flag, because nobody declared those. It never confers a capability; there is no arbiter in 1.0.
4. **A sealed game is immutable.** No re-declaration, no correction. A wrong result is a new game or
   a void, never an edit — the same discipline `learner-rating` §5 applies to a rated run.

#### §3.4 What a result does not do

A declared result does **not** write a mark, a standing or a rank. `learner_marks` stays
`(learner_id, mark)` and `cohort_standings` stays one-per-classroom; both are `learner-rating`'s and
neither is touched here. §8.3 states what that costs a later event.

### §4 — The aggregate above the session

#### §4.1 The finding that keeps it small

[[D1529]] reads `live_sessions.run_id NOT NULL UNIQUE` as *"one session per run with no aggregate
above it"* and infers that a round has nowhere to live. The first half is exact; the inference points
one table too low. **A round is many simultaneous games, and a game is a run — so the aggregate
belongs above the game, not above the session.** Eight boards in a round are eight runs, eight
sessions and eight `games` rows under one contest. `live_sessions` is therefore **not rebuilt**, and
neither is `arena_legs`: this RFC adds no column and no `CHECK` to it, so `social-play.md`
criterion 18 (the `arena_legs` `CHECK` count stays at **2**, no rebuild runs) stays green. Criterion
12.

#### §4.2 The tables

```sql
CREATE TABLE contests (
  id                   TEXT PRIMARY KEY,
  kind                 TEXT NOT NULL CHECK (kind IN ('match','arena','event')),
  name                 TEXT NOT NULL CHECK (length(name) > 0),
  scope_kind           TEXT NOT NULL CHECK (scope_kind IN ('private','classroom')),
  scope_id             TEXT REFERENCES classrooms(id) ON DELETE CASCADE,
  opened_by_learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  state                TEXT NOT NULL CHECK (state IN ('open','running','closed')),
  created_at           TEXT NOT NULL,
  closed_at            TEXT,
  CHECK ((scope_kind = 'private'   AND scope_id IS NULL)
      OR (scope_kind = 'classroom' AND scope_id IS NOT NULL))
) STRICT;

CREATE TABLE contest_rounds (
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  round_no   INTEGER NOT NULL CHECK (round_no >= 1),
  state      TEXT NOT NULL CHECK (state IN ('pending','open','closed')),
  opens_at   TEXT,
  closes_at  TEXT,
  PRIMARY KEY (contest_id, round_no)
) STRICT;

CREATE TABLE contest_encounters (
  id         TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL,
  round_no   INTEGER NOT NULL,
  board_no   INTEGER NOT NULL CHECK (board_no >= 1),
  state      TEXT NOT NULL CHECK (state IN ('pending','live','complete','void')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (contest_id, round_no) REFERENCES contest_rounds(contest_id, round_no) ON DELETE CASCADE,
  UNIQUE (contest_id, round_no, board_no)
) STRICT;

CREATE TABLE encounter_seats (
  encounter_id      TEXT NOT NULL REFERENCES contest_encounters(id) ON DELETE CASCADE,
  seat              INTEGER NOT NULL CHECK (seat >= 1),
  participant_kind  TEXT NOT NULL CHECK (participant_kind IN ('learner','bot','unknown','absent')),
  learner_id        TEXT REFERENCES learners(id) ON DELETE SET NULL,
  bot_band          INTEGER,
  bot_engine_digest TEXT,
  PRIMARY KEY (encounter_id, seat),
  CHECK (
    (participant_kind = 'learner' AND learner_id IS NOT NULL AND bot_band IS NULL AND bot_engine_digest IS NULL)
 OR (participant_kind = 'bot'     AND learner_id IS NULL AND bot_band IS NOT NULL AND bot_engine_digest IS NOT NULL)
 OR (participant_kind IN ('unknown','absent') AND learner_id IS NULL AND bot_band IS NULL AND bot_engine_digest IS NULL)
  )
) STRICT;

CREATE TABLE encounter_games (
  encounter_id TEXT NOT NULL REFERENCES contest_encounters(id) ON DELETE CASCADE,
  game_id      TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  ordinal      INTEGER NOT NULL CHECK (ordinal >= 1),
  PRIMARY KEY (encounter_id, game_id),
  UNIQUE (encounter_id, ordinal)
) STRICT;
```

Four decisions inside that DDL are the ones that make a tournament additive.

- **`seat INTEGER CHECK (seat >= 1)`, never `CHECK (seat IN (1,2))`.** This is the direct
  application of fact 9: `arena_legs.leg CHECK (leg IN (1,2))` is precisely the shape that makes a
  multi-board round a rebuild. The two-seat rule is a **contest-kind rule in code** (§4.4), where
  widening it is a code change.
- **`ordinal >= 1`, likewise.** A rematch chain, a two-leg Arena and a best-of-N match are the same
  column.
- **`participant_kind` includes `absent`.** A bye is a seat with nobody in it, and it must be
  expressible or a Swiss's odd round is a rebuild.
- **`scope_kind`** puts a contest inside a classroom **without** touching `cohort_standings`. A club
  that runs two seasons gets two contests; fact 7's one-standing-ever ceiling is **bypassed**, not
  repaired. §8.3 states what remains broken.

#### §4.3 The 1.0 write path

Exactly one shape is written, and it is the friend match `social-play.md` §3 already specifies.
Creating a native match now creates, in **one transaction** with the session and `match_states` row:

```
contests           1 row  kind='match'  scope_kind='private'  state='open'  name = the host's title
contest_rounds     1 row  round_no=1    state='open'
contest_encounters 1 row  round_no=1    board_no=1  state='live'
encounter_seats    2 rows seat=1,2      participant_kind='learner'
encounter_games    1 row  ordinal=1     → the games row for this run
```

A rated solo-bot game (`POST /rated-games`, unchanged as a route) creates a `games` row with
`origin='solo_bot'` and **no contest** — a drill against a bot is not a contest, and manufacturing
one would be the ceremony this RFC is trying to avoid. `contest_id` is therefore not on `games`;
the join is `encounter_games`, which is nullable by absence.

**One thing 1.0 gains that is not structure.** `contests.name` is the first place a native match has
ever had a name. Today `createLive` sends ``title: `${liveKind} session` `` (`App.svelte:616`), so
every session a person hosts is called *"match session"* — T17 in the readiness register. The
creation surface `social-play.md` §3.7 specifies asks for the name; this RFC stores it.

#### §4.4 What refuses the tournament

A frozen `CONTEST_SHAPES` map, keyed by `kind`, declares the seat count, the round count, the games
per encounter and whether the shape is **producible**:

| kind | seats | rounds | games/encounter | producible at 1.0 |
|---|---|---|---|---|
| `match` | exactly 2 | exactly 1 | 1, or 2 on a rematch (`social-play.md` Open question 3) | **yes** |
| `arena` | exactly 2 | exactly 1 | exactly 2 | **no** — reserved for the existing two-leg Arena, whose adoption is Discharge D4 |
| `event` | ≥ 2 | ≥ 1 | ≥ 1 | **no** — [[D1416]] |

`openContest` refuses a non-producible kind with `CONTEST_KIND_DEFERRED`, and one test asserts the
producible set is exactly `{match}` by id. Criterion 8. A tournament RFC flips one row and supplies a
pairing writer; **it runs no migration**, and criterion 14 is this RFC's own falsifiable claim to
that effect.

### §5 — Two-human play in the return loop — [[D1415]]

#### §5.1 One attempt row per seated learner

`attempts` is rebuilt: `PRIMARY KEY (run_id, branch_id)` becomes
`PRIMARY KEY (run_id, branch_id, learner_id)`. Every column and index is otherwise carried over
verbatim; the three existing indexes (`attempts_root`, `attempts_transpose`, `attempts_pack`,
`storage.ts:4134`, `:4135`, `:4136`) are already `learner_id`-leading and are recreated unchanged.

`attempt_concepts` currently declares `FOREIGN KEY (run_id, branch_id) REFERENCES attempts(run_id,
branch_id)` (`storage.ts:4144`), and after the widening those parent columns are no longer unique.
Concepts are a property of the **branch**, not of a learner, so duplicating them per seat would be
wrong. The repair: `attempt_concepts` keeps its `(run_id, branch_id, concept_key)` key and
**re-points its foreign key at `drill_runs(id) ON DELETE CASCADE`**. Nothing is lost — the
cascade it actually needed was run deletion, and its rewrite-on-upsert is already explicit
(`DELETE FROM attempt_concepts WHERE run_id = ?`, `storage.ts:2582`).

#### §5.2 The projection becomes seat-aware

`projectAttempts` gains an optional `seats: { white: learnerId | null, black: learnerId | null }`.
Where it is absent, behaviour is **byte-identical to today** — criterion 9 asserts that on a solo
run. Where present, it emits one attempt row per seated learner, and for each:

- `learner_id` is that seat's learner;
- `userPlyCount` counts plies whose **mover colour equals that seat's colour**, derived from the
  node FEN exactly as `service.ts:2115` already derives it — `node.actor` is read for solo runs
  only and its meaning does not change (§Motivation 3);
- `result` is that seat's projection of `games.result` (§2 property 1), not `outcome.reached`'s
  start-side value;
- every other field is the branch's and is identical across the two rows.

The seat map is `match_states`. `#project` passes it whenever `#matchContext` resolves.

#### §5.3 The forcing, and the amendment owed to `social-play`

`service.ts:2134-2136`'s `countable: false` forcing is removed, as `social-play.md` §3.6 specifies.
**That RFC's criterion 8 remains true and is not sufficient**, for the two mechanisms in
§Motivation 3, and its §3.6 is owed one sentence naming this RFC as the source of the guest's row.
Discharge D2.

`#matchContext`'s three other consumers are untouched — opponent-selection refusal (`:1000`), the
pause protocol (`:2083`) and actor derivation (`:2105`) — which `social-play.md` §3.6 already states
and this RFC re-verified at HEAD.

### §6 — The rating substrate, and the amendment `learner-rating` owes

**`learner-rating.md` is the single writer of every rating object and this RFC writes none.** What
follows is the exact amendment it owes; nothing here may be implemented before that amendment
lands. Discharge D1.

#### §6.1 The predicate, changed in exactly three places

`learner-rating.md` §3 lists eight rated-game preconditions. **Five are unchanged and are re-stated
only to show they survive**: declared rated at creation (R11), `sessionKind === "position"` (R1/R2),
≥21 pieces (R5), every server-routed assistance rung refused for the whole run (R6), and no
`run.rewound` with exactly one branch (R11). Three change:

**(a) Condition 3 — the opponent — becomes a rateability predicate over `game_sides`,** replacing
*"`opponentPolicy.mode === "human_common"` and `targetElo` is one of the four ladder rungs"*:

| the other side is | the rating reads | status |
|---|---|---|
| `bot` with a rung in `RATED_OPPONENT_CALIBRATION` and `containerDigest` equal to the pinned digest | the calibration's `(rating, rd)` for that band | **unchanged** — today's arm, verbatim |
| `learner` with a `learner_ratings` row | **that learner's** `(rating, rd, volatility)` as of admission, snapshotted into `game_sides` | **new** |
| `unknown` (an imported opponent) | nothing — the game is not rated | **unchanged**; R7 declines to publish against an unmeasured anchor |
| `absent` | nothing | reserved (§3.2) |

A learner with no `learner_ratings` row is seeded by `initialRating()`
(`packages/runtime/src/rating.ts:119`) at admission, as today.

**(b) Condition 8 — *"It reaches `outcome.reached`"* — becomes *"It reaches a sealed declared result
whose cause is in `PRODUCIBLE_RESULT_CAUSES`."*** This is the clause that lets a rated game end by
resignation, agreement or flag. R12's refusal of **adjudication** is unchanged and is now enforced
structurally: `adjudication` is one of the six deferred causes and has no producer.

**(c) `[[D962]]`'s persona/`targetElo` disjointness is unaffected** and is re-recorded here so it is
not read as resolved: `bot-policy.md`'s `RunOpponentPolicy.profile` forbids `targetElo` in a
profiled request, so a persona'd bot still cannot satisfy the bot arm. The human arm does not
involve a profile at all, so this RFC neither opens nor forecloses it.

#### §6.2 Two rating outcomes from one game

On seal, `learner-rating`'s writer produces one `GlickoResult`
(`packages/runtime/src/rating.ts:58-62`) **per rated `game_sides` row**:

```
for each side S with S.rated = 1 and S.participant_kind = 'learner':
    opponent  := the other side
    opponentRating, opponentRd := opponent's snapshotted rating_before / rd_before
    score     := 1.0 if games.result = S.colour
                 0.5 if games.result = 'draw'
                 0.0 if games.result = the opponent's colour
                 (a games.result of 'none' produces NO result and rates nothing)
    enqueue into S.learner's current rating period
```

**Both sides read `rating_before`, never a live value.** That is §2 property 3 and it is the whole
of the concurrency story: the two updates commute, so there is no ordering rule to get wrong and no
lock to hold. Criterion 6.

Periods are untouched: each learner's result enters **that learner's own** current period
(`learner-rating` §6.3), and the two learners may be in different periods. Nothing about the
Glicko-2 arithmetic, the constants, the volatility update or the publication bracket changes.

#### §6.3 The anchor, and the disclosure it forces

`learner-rating`'s scale is defined by a calibration measured against **bot rungs**
(`RATED_OPPONENT_CALIBRATION`, `rating.ts:21`), and AC-7's three-model × two-arrival simulation
narrowed the publication bracket to 1500–1800 BCS on those arms. **A learner whose rated games are
all against other learners is on a scale nothing holds in place.** Two humans in a closed pool can
drift together indefinitely; Glicko-2 will report low RD and high confidence about a number with no
external referent.

The repair is **disclosure, not exclusion**, following [[D1292]]'s precedent exactly — the owner
chose widest coverage plus a label over rate-only-where-calibrated. `learner-rating` §7.4 gains one
obligation:

> **Obligation (anchored fraction).** The publication surface states the share of the learner's
> sealed rated games whose opponent was a calibrated bot rung. Where that share is **zero**, the
> band-equivalent is published with the sentence *"nothing in these games was measured against a
> calibrated opponent"*, and the point estimate is withheld regardless of RD — the same posture
> §7.2 already takes for an abandonment share above 0.25.

The fraction is read-time arithmetic over `game_sides` and persists nothing. Discharge D1 carries
it; §8.1 states it again as a limit rather than a feature.

#### §6.4 What the resignation event does and does not fix

`learner-rating` §11.3 names the abandonment bias and says outright that *"the real fix is a
resignation event — one run-schema field, which this RFC declines only because it claims no run
lane."* `social-play.md` lane 0.23 supplies it, and this RFC makes it a rating-terminating cause.
**That closes the resolution gap and does not close the bias**: a learner can still close the tab,
and §7.2's abandonment refusal stands unamended. What changes is that a two-human game now has an
honest ending available to the losing side, which is the precondition for ever narrowing the
threshold — not the narrowing itself.

### §7 — Register claims, argued

#### §7.1 Migration — **one position, behind `theory-drill-current-joins`**

The chain at HEAD carries **nine** live claims, not eight: `longitudinal-store` (behind
`learner-rating`), `bot-policy`, `campaign-core`, `live-sources`, `recorded-clocks`,
`live-following`, `enforced-clocks`, `social-play`, `theory-drill-current-joins`. This RFC takes
the **tenth** position, and the tail is the correct place for a reason rather than by default:

**`enforced-clocks` claims a rebuild of `rated_games.terminal_reason` and this RFC deletes the
table.** If this migration landed first, that body would fail on every database that had not yet
reached it — and README's own rule is that *"an already-applied migration still runs on databases
that never reached it."* Landing last is what makes both bodies correct on every path. The body is
written to be **order-independent even so**: it copies an explicit, frozen column list from
`rated_games` and maps `terminal_reason` through a seven-member table covering the five values
migration 25 admits (`storage.ts:4579`) and the two `enforced-clocks` adds; if that RFC has not
landed, its two values simply never appear.

**Body — a rebuild plus five creates plus one PK widening, with a real data copy.** No stamp, no run
snapshot rewrite, and frozen literals throughout ([[D384]]'s lesson, restated in
`learner-rating` §9.1).

| step | what |
|---|---|
| 1 | `CREATE TABLE games`, `game_sides` and their indexes |
| 2 | `INSERT INTO games … SELECT` from `rated_games`: one row per old row, `origin='solo_bot'`, `rated=1`, `result` converted from learner-relative to **colour** using `learner_side` (`win` → `learner_side`, `loss` → the other colour, `draw` → `'draw'`), `result_cause` mapped from `terminal_reason` |
| 3 | `INSERT INTO game_sides`: **two** rows per old row — the learner side (`participant_kind='learner'`, `rated=1`, `rating_before`/`rd_before`/`volatility_before` recovered from the game's `rating_periods` row where one exists and from `learner_ratings` seed values otherwise) and the bot side (`participant_kind='bot'`, `bot_band=opponent_band`, `bot_engine_digest=engine_identity_digest`, `rated=0`) |
| 4 | `DROP TABLE rated_games` |
| 5 | `ALTER TABLE attempts RENAME TO attempts_v25`; recreate with `PRIMARY KEY (run_id, branch_id, learner_id)`; `INSERT … SELECT` every row unchanged; recreate the three indexes; `DROP TABLE attempts_v25` |
| 6 | Rebuild `attempt_concepts` with its foreign key re-pointed at `drill_runs(id) ON DELETE CASCADE` |
| 7 | `CREATE TABLE contests`, `contest_rounds`, `contest_encounters`, `encounter_seats`, `encounter_games` |
| 8 | Backfill **one** contest per existing native match: for every `live_sessions` row with `board_control='match'` that has a `match_states` row, write the §4.3 five-row shape and an `encounter_games` link to that run's `games` row if one exists. This is the only backfill and it is derived entirely from shipped rows |

Step 3's `rating_before` recovery is the one place the migration cannot always be exact: a sealed
historical game's pre-game rating is not stored anywhere today. Where it cannot be recovered, the
three columns are written `NULL` and `rated` is set to `0` on **both** sides of that game, which
makes the row a historical record rather than a rating input. It is already counted in
`learner_ratings.rated_games`, so nothing is double-counted and no rating moves. Criterion 11
asserts every learner's `(rating, rd, volatility)` is byte-identical across the migration.

**Account data.** Seven tables enter `ACCOUNT_DATA_INVENTORY` and `ACCOUNT_TAGGED_RECORD_FIELDS`
(`apps/server/src/account-data.ts:38-79` and its `ACCOUNT_TAGGED_RECORD_FIELDS` map) and `rated_games` leaves both; the
`assertAccountDataInventory(storage.applicationTableNames())` guard
(`account-data.test.ts:53-54`) is a set-equality over the live schema, so a forgotten table fails
the build rather than silently dropping out of export. `games`/`game_sides` take
`behavioral_profiles`; the five contest tables take `live_social` with `tombstone` deletion, matching
`classrooms` and `assignments`. T20's disclosure labels are rewritten to survive an event context —
`opponent_band` becomes a labelled side rather than a bare integer. Criterion 13.

#### §7.2 Run schema — **none**, and this is argued, not assumed

Head is **0.17**; lanes 0.18–0.23 are claimed by `bot-policy`, `recorded-clocks`, `variants`,
`enforced-clocks`, `bot-roster` and `social-play`, so the next free lane is 0.24 and **this RFC does
not want it.** Three candidate claims were examined and each is refused on evidence:

1. **The three non-move endings.** Owned by `social-play` (0.23) and `enforced-clocks` (0.21).
   Consuming an unlanded lane is a **cross-draft pin**, recorded in `rfc/README.md`; the precedent is
   `bot-route-source.md`'s pin on `bot-policy`'s 0.18. Criterion 10 fails if a
   `game.resigned`/`draw.agreed`/`clock.flagged` member is added **here** instead of there.
2. **A per-node "which human moved this" field.** Refused because it is derivable: the mover's
   colour comes from the node FEN and the seat map is `match_states` (§5.2). `Node.actor`'s
   three-member enum already distinguishes a human guest (`system`) from an engine (`opponent`), so
   nothing about it changes.
3. **A rating or result on the run snapshot.** Refused on `learner-rating` §9.3's argument, which
   holds unchanged and is also a **safety** property: a number that never enters a run event, a run
   snapshot or an engine request cannot reach a renderer that reads them. Every object here is a
   materialised read over the event log.

#### §7.3 Pack schema, shape-entry, principle-entry, campaign-schema, evidence-kinds — **none**

Nothing about a pack, a shape entry, a principle or a campaign document changes. A rated boss is a
`position` session against a calibrated rung and rides the **unchanged** solo-bot arm of §6.1(a);
`campaign-core.md`'s Discharge D1 is neither advanced nor blocked. No evidence kind is added: a
declared result is a record, not evidence, and law 8 forbids grading it.

## Deviations from design

1. **`design/06-campaign.md:159-162` and `:453-455` — narrowing owed.** Both describe a rated game
   as *"a `position` session played to a rules-terminal result against a calibrated rung"*, and
   `:162` equates that with *"the object `POST /rated-games` already creates"*. After this RFC both
   clauses are true **of the boss** and false **of the object**: a rated game may have a learner
   opponent, and it may end by resignation, agreement or flag, none of which is rules-terminal. The
   boss itself is unaffected — `social-play.md` §3.4 rule 1 refuses `game.resigned` on a run with no
   `match_states` row, so a boss cannot be resigned, and §6.1(a)'s bot arm is verbatim today's.
   **Proposed amendment filed, not written** (law 5):
   `planning/platform-alignment/native-ratings-intent-amendment-2026-08-26.md`.
2. **`design/03-product-breadth.md:53-55` — already filed, and this change set is a second
   falsifier.** Its *"native clocks/matchmaking can deepen later"* clause was filed by the
   `social-play` rebuild at
   `planning/platform-alignment/social-play/intent-amendment-2026-08-24.md` §1, whose proposed
   replacement already reads *"Native clocks and native ratings are 1.0 ([[D1414]])"*. No second
   proposal is made; the memo above records that a second change set now depends on the same pen.
3. **`design/02-product-shape.md:98-99` — conformed to, not deviated from.** No operator, arbiter or
   organiser role is created. `declared_by` is a record of who acted, never a capability (§3.3
   rule 3), and `contests.scope_kind='classroom'` reuses `teacher-surface`'s shipped delegated
   capability rather than inventing a role, exactly as [[D1481]] found.
4. **`design/03-product-breadth.md:87-88` and `:327` — untouched.** No matchmaking is specified and
   nothing here leans on `social-play.md` Open question 1.
5. **`design/05-in-run-experience.md:42` — applied, not amended.** Session machinery may never alter
   what the run says happened on the board, which is why the declared result reads the run's own
   event log (§3.3 rule 2) and never writes to it.

## Fresh independent buildability return (2026-08-30)

The color-oriented game fact is the right foundation; this contract cannot implement it yet. The
exact review is
`planning/native-ratings/native-ratings-fresh-independent-buildability-review-2026-08-30.md`, and
`make native-ratings-fresh-review` reproduces all sixteen blockers:

1. [[D2308]] — resignation and flag require the losing side to equal the winning color.
2. [[D2309]] — rating refusal/withholding voids the played game fact instead of a rating disposition.
3. [[D2310]] — SQL admits open/sealed rows with void reasons and voided rows with results.
4. [[D2311]] — game/side rating flags can disagree and a bot may be marked rated.
5. [[D2312]] — eager two-learner seats contradict the accepted invite/accept boundary.
6. [[D2313]] — neither storage nor token redemption prevents one learner taking both colors.
7. [[D2314]] — encounter seats and game sides can disagree; one game can occupy two encounters.
8. [[D2315]] — account deletion cascades away the opponent's shared history; export privacy is absent.
9. [[D2316]] — attempt numbering/joins remain learner-blind and branch FK integrity is weakened.
10. [[D2317]] — rules, setup family, time control and calibration are absent from rating identity.
11. [[D2318]] — native-match backfill creates contests but no general game or deterministic game id.
12. [[D2319]] — no typed API/client/result/history journey consumes the new substrate.
13. [[D2320]] — tournament readiness proves arbitrary inserts, not entrants/pairings/results/standings.
14. [[D2321]] — the core-loop question is routed to an unrelated discharge; rematch remains open.
15. [[D2322]] — every terminal/social input the draft consumes is currently returned.
16. [[D2323]], [[D2324]], [[D2325]] and [[D2326]] — committed research establishes additive
    pool-location ambiguity, refutes the direct-anchor-fraction boundary and leaves local-pool versus
    cross-pool publication policy for owner/author repair.

The migration reservation remains provisional, not buildable. Repair must first accept exact seat,
result and terminal authorities; separate game truth from rating disposition; define one
transactional participant/lifecycle authority and complete rating subject; migrate all attempt,
privacy and account-lifecycle consumers; consume the measured component-level calibration findings
and settle publication semantics; and prove the complete learner journey before another independent
review.

## Acceptance criteria

Each is failable at HEAD unless marked otherwise. Counts are drift tripwires, never criteria
([[D1240]]); every set assertion is by **id**.

1. **The rebuild lands with no rating movement.** For a fixture database at migration 25 carrying
   sealed, open and voided `rated_games` rows across three learners, every `learner_ratings` row's
   `(rating, rd, volatility, rated_games, voided_games, abandoned_games, period_no)` is byte-identical
   before and after. Fails today: the table does not exist.
2. **One run, two rating outcomes.** A native match between two rated learners, played to
   checkmate, produces exactly two `game_sides` rows with `rated = 1` and exactly two Glicko-2
   results, one per learner. Fails at HEAD by `PRIMARY KEY` violation.
3. **The bot arm is byte-identical.** A rated solo-bot game admitted through `POST /rated-games` and
   sealed by `outcome.reached` produces the same published rating, band-equivalent, interval and
   disclosure set as the pre-migration implementation, asserted against a rendered-byte fixture.
4. **`STRICT` and the three-arm side `CHECK` hold.** Direct SQL inserting a `game_sides` row with
   `participant_kind='learner'` and a non-null `bot_band`, or with `rated=1` and a null
   `rating_before`, is rejected by the database, not by application code.
5. **`none` is not a draw.** A game sealed `result='none'` produces **zero** Glicko-2 results and is
   scored nowhere; a test asserts the scoring function has no `none` branch by exhaustive union
   coverage rather than by a runtime check.
6. **The two-side update commutes.** The same match processed white-first and black-first yields
   byte-identical `learner_ratings` rows for both learners. Constructed to fail if any implementation
   reads a live rating instead of `rating_before`.
7. **The deferred causes are unproducible.**
   `setDifference(RESULT_CAUSES, PRODUCIBLE_RESULT_CAUSES)` equals `DEFERRED_RESULT_CAUSES` by id,
   and `declareResult` refuses each of the six with `RESULT_CAUSE_DEFERRED`. Fails if a producer is
   added without an owner ruling.
8. **The deferred contest kinds are unproducible.** The producible set of `CONTEST_SHAPES` is
   exactly `{match}` by id, and `openContest` refuses `arena` and `event` with
   `CONTEST_KIND_DEFERRED`.
9. **The solo projection is unchanged.** `projectAttempts` called without `seats` emits rows
   byte-identical to HEAD's across a fixture of pack, position, duplicated, scheduled and forked
   runs.
10. **No run-schema member is added here.** `DrillRunEvent`'s member set, `Node.actor`'s enum and
    `schemas/drill_run.schema.json`'s bytes are unchanged by this change set, asserted over the diff.
11. **The migration is exact where it can be and honest where it cannot.** Every historical game
    whose `rating_before` cannot be recovered has `rated = 0` on **both** sides, and the count of
    such games is reported by the migration rather than swallowed.
12. **`arena_legs` and `live_sessions` are not rebuilt.** `arena_legs`' `CHECK` count stays at
    **2** and `live_sessions`' DDL bytes are unchanged, so `social-play.md` criterion 18 stays green.
13. **Account data is complete by set equality.**
    `assertAccountDataInventory(storage.applicationTableNames())` and
    `assertIdentityTransformInventory(storage.applicationIdentityFields())` both pass with the seven
    new tables present and `rated_games` absent, and a permanent test asserts that dropping any one
    new table from the inventory fails the build.
14. **The tournament test, and this RFC's own falsifiable claim.** A written fixture spec — not an
    implementation — expresses a 3-round, 8-board Swiss with one bye, one forfeit and one bot
    entrant using **only** `INSERT`s into the seven tables specified here, with no `ALTER`, no
    `CHECK` edit and no new column. If it cannot, this RFC has failed at the thing it exists to do.
15. **The anchored-fraction disclosure renders.** A learner with zero bot games gets the §6.3
    sentence and no point estimate; a learner with a mixed record gets the fraction. Fails today:
    the surface does not exist.
16. **Every honest limit in §8 is stated on a surface or in a named document**, asserted by a test
    over the limit ids, so a limit cannot be silently dropped by a later edit.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | The `learner-rating` amendment §6 specifies in full: the rateability predicate replacing §3 condition 3, the declared-result condition replacing condition 8, the two-outcome seal reading `rating_before`, and §7.4's anchored-fraction obligation. **No implementation here may precede it** | `learner-rating.md` | that RFC's next amendment | |
| D2 | `social-play.md` §3.6 gains one sentence: removing the `countable:false` forcing is necessary and not sufficient, and the guest's attempt row comes from this RFC's §5 | `social-play.md` | that RFC's next amendment | |
| D3 | The declared result's three non-move causes ride lanes 0.23 (`game.resigned`, `draw.agreed`) and 0.21 (`clock.flagged`); until both land, only the five rules causes have producers and `PRODUCIBLE_RESULT_CAUSES` is correspondingly smaller | `social-play.md` | that RFC's implementing commit, and `enforced-clocks.md`'s | |
| D4 | Whether the shipped two-leg Arena adopts the `arena` contest shape or keeps `arena_legs` as its own record. Not decided here because `social-play.md` Open question 3 owns the rematch chain and the answers interact | `social-play.md` | that RFC's Open question 3 ruling | |
| D5 | The `design/06-campaign.md` narrowing (Deviations 1) — law 5 work, proposed not written | OWNER | `planning/platform-alignment/native-ratings-intent-amendment-2026-08-26.md` | proposed 2026-08-26 |
| D6 | `docs/return-and-progression.md` and `docs/account-data-lifecycle.md` updates for the attempt-per-seat change, the seven-table inventory and the twelve rewritten disclosure labels | codex | this RFC's implementing commit | |
| D7 | Whether a later event may order a crosstable by rank, seed or tiebreak — `learner-rating` R10(b) bars all three and a Swiss needs all three (§8.3). This RFC neither amends R10 nor designs around it | OWNER | the tournament RFC's acceptance, or an R10 amendment | |
| D8 | An abandoned native match has no resolution until a clock exists (§8.4); until then it voids as `abandoned` and no forfeit is declared | `enforced-clocks.md` | that RFC's implementing commit | |

## Open questions

1. **Does a rated native game refuse the product's own core loop, and is that acceptable?**
   `learner-rating` R11 voids any rated game containing a rewind, and `MATCH_LIVE`
   (`apps/server/src/errors.ts:48`) refuses rewind, duplicate and flip while a match is live. The two
   are consistent, and together they mean the one place where two humans play a real game is the one
   place the commit → rewind → branch → compare loop is unavailable. `learner-rating` §11.4 names
   this tension for the solo case; native-first doubles it. **This document does not lean**, and the
   two branches are not equal in cost: leaving it is free and slightly dishonest to the thesis;
   changing it means either a rated game that survives a rewind (which R11 refuses on measured
   grounds) or an unrated "review after the game" mode, which is `review-map.md`'s territory and not
   a schema question. Routed to **D7**'s owner, not decided.
2. **Should `games` absorb imported games?** `origin='imported'` is reserved and unproducible, and
   `participant_kind='unknown'` exists for an external opponent — together they are the cheapest
   route to `learner-rating` R7's human anchor (its highest-value unrun experiment, and
   `social-play.md` Discharge D3). *Recommendation:* **not in this RFC** — `imported_games` is a
   different object with a licence story, and folding it in would put a rebuild of it inside a
   migration that is already large. Flagged because the reserved vocabulary makes the later
   adoption additive, which is the whole point.
3. **Does a contest need a token scope?** A tournament needs a viewer, caster or arbiter scope, and
   `public_tokens.scope` is a two-member `CHECK` on a `STRICT` table (§Motivation 1), so adding one
   later is a rebuild — exactly the cost this RFC exists to avoid. **It is nevertheless refused
   here, and the refusal is argued rather than deferred:** that `CHECK` is a *safety* invariant, not
   an application vocabulary — it is paired with a compound constraint tying each scope to the
   columns it may carry (`storage.ts:3971-3976`), and reserving an unproducible scope would weaken a
   security guard for a feature nobody is building. The cost is stated as §8.5 rather than paid, and
   T4 remains a later rebuild.

## Honest limits

Stated because they are true, not designed around. Criterion 16 makes each one failable.

**§8.1 — The scale is anchored only through bot games.** `learner-rating`'s calibration is measured
against Maia bands and AC-7's bracket was narrowed on those arms. A pool of learners who play only
each other drifts as a whole with nothing holding it, and Glicko-2 will report a narrow RD about it.
§6.3's disclosure states the anchored fraction; it does not fix the drift, and no arithmetic can.

**§8.2 — All bot calibration is untimed.** `enforced-clocks.md` records a measured ~230 Elo
cross-control drift, and [[D1292]] ruled timed games rated with a label rather than excluded. A
clocked native game therefore rates against an untimed anchor. This RFC inherits that and adds a
second-order case the label does not yet cover: a **clocked human-vs-human** game has no calibrated
anchor at either end, so both the control disclosure and §6.3's anchored-fraction disclosure apply
to the same row.

**§8.3 — `learner-rating` R10(a)/(b)/(c) and a Swiss are incompatible, and this RFC does not resolve
it.** R10(a) bars any standing spanning classrooms; R10(b) bars rating as *"a rank, a sort key, a
seed, a section boundary or a tiebreak"*; R10(c) bars any entry a learner did not publish by their
own act. A Swiss needs a seed, a rank and a tiebreak, and an organiser enters results for people who
did not publish them. `contests.scope_kind` bypasses R10(a)'s one-standing-per-classroom ceiling by
scoping to a contest instead, but **(b) and (c) are untouched**, and a later tournament RFC must
either put its crosstable wholly outside R10 or get R10 amended by the owner. Discharge D7.

**§8.4 — An abandoned native match has no resolution in 1.0.** Without a clock there is no flag, and
`forfeit` is one of the six deferred causes. Such a game voids as `abandoned` and moves no rating,
which means the abandon-when-losing bias `learner-rating` §11.3 measures now applies to two-human
play as well as solo. The resignation event gives the losing side an honest exit; it does not compel
one. Discharge D8.

**§8.5 — Every future viewer, caster or arbiter token scope is still a rebuild.** Open question 3
refuses to reserve one, on a safety argument. This is the single readiness item in
`planning/ux-implementation-index.md`'s T-register that this RFC deliberately leaves expensive.

**§8.6 — A bot entrant is impossible today, and renaming one would void its calibration.**
`BOT_POLICY_PROFILES = compileBotPolicyCatalog([])` is an empty array
(`bot-policy-catalog.ts:299`), so `participant_kind='bot'` in a contest has nothing to field; and
[[D708]] establishes that changing a persona name voids that profile's calibration by digest, so any
published bot rating pins name and digest together permanently. `bot-roster.md` owns both.

**§8.7 — There is no fair-play enforcement on any native row.** `social-play.md` §3.2 makes that
sentence normative on **every** native game regardless of clock or rating, and this RFC adds a
rating to games that carry it. A rated native ladder with no cheat detection, no report button and
no adjudication is exactly what the label says it is.

**§8.8 — A game's own history is single-writer even after this.**
`drill_runs.active_writer_id` is one column (`storage.ts:899`) and a native match passes possession
through it. Nothing here changes that, and it remains the seam a simultaneous two-device match runs
into.

## Changelog

- 2026-08-26: created. Drafted on [[D1414]] and [[D1520]], taking [[D1516]] out of
  `social-play.md`'s Discharge D2 and into its own document per [[D1521]]. Three inherited
  [[D1529]] claims corrected at HEAD: `public_tokens.scope` admits **two** values, not one
  (migration 14 rebuilt it); the table count is **40**, not 37; and `arena_legs` is **not** the only
  table with a declared `result` (four ship, two of them learner-keyed — which is the sharper
  defect). Two mechanisms were found that make `social-play.md` §3.6's [[D1415]] repair insufficient
  as written: the attempt upsert never rewrites `learner_id`, and a match guest's plies are stamped
  `actor: "system"`. Claims one migration position and **no** run-schema lane, consuming
  `social-play`'s 0.23 and `enforced-clocks`' 0.21 as a cross-draft pin.
