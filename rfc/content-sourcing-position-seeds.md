# RFC: Position seeds from the Lichess puzzle database — the consequence, not the tactic

- **Status:** implementing
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/04-content-architecture.md` §6 (on-ramp layer: "one-move-consequence packs from the CC0 puzzle DB re-cut as *play-the-consequence* rather than find-the-tactic"), §8 order item 4; `design/00-thesis.md:70,93-94` (explicitly not a tactics puzzle trainer), `:82-95` (target band)
- **Exploration gate:** breadth sequencing ruling 2026-08-11 (`design/04-content-architecture.md` header); owner ruling 2026-08-12 opening the RFC tier (`rfc/README.md`)
- **Depends on:** **`rfc/content-sourcing-foundation.md` (B6a)** — manifest, evidence sidecar, source-linkage rule (§1.2a), emission-job digest (§1.4), deterministic-output rule, `sourcing-check`, record vocabulary. **Blocks on defect D11** (`design/BACKLOG.md:115`, B6a §1.5): a consequence run that mates or stalemates before ply 8 never discloses its evidence, and there is no workaround in the pack format — see §3a. Also `rfc/archive/drill-pack-format.md` and `rfc/archive/engine-workers.md` (both implemented). Optionally strengthened by B6b (`rfc/content-sourcing-syzygy.md`) once its `engine_eval` producer exists, and then only behind `--engine-eval` (§4)
- **Parent / amends:** — (B6d; fourth of four RFCs split out of the withdrawn `content-sourcing-pipelines.md` draft, 2026-08-12. **This is a redesign, not a rehome**: the withdrawn draft's §5 contradicted `design/00-thesis.md` and is not carried forward)
- **Supersedes / superseded by:** —
- **Planning:** `planning/content-sourcing-position-seeds/`

## Summary

`design/04-content-architecture.md` §6 asks for "one-move-consequence packs from the CC0
puzzle DB re-cut as *play-the-consequence* rather than find-the-tactic". The withdrawn
`content-sourcing-pipelines.md` draft said it would do that and then did the opposite: it
set `start.fen` to the FEN after only `Moves[0]` and put `Moves[1..]` on the spine
(withdrawn draft §5.2, "`start.fen` | `FEN` with `Moves[0]` applied" and "`spine` |
`Moves[1..]` as one chain"). A learner starting there, on move, with the solution as the
spine, is being asked to **find the tactic** — the exact thing `design/00-thesis.md:70` ("not
an auto-puzzle feed") and `:93-94` ("**Explicitly not:** a tactics puzzle trainer or lesson
content. The 1000→1400 tactics-volume leg is well served free elsewhere") reject. The draft
even stated the correct thesis one paragraph earlier and then encoded its negation.

**The redesign, in one sentence: apply the complete puzzle line, and start the session from
the position it produces.** The solution is not a spine, not a hint, and not something the
learner ever plays — it is *consumed at emit time and discarded from the document*. What the
learner gets is the aftermath: a position someone else's tactic produced, an opponent at
their own rating who is not obliged to co-operate, and the question the product actually
exists to ask, which is what you do next.

**And the line is not written down anywhere the learner can read it.** An earlier version of
this RFC put the solution in `start.movesSan` "for honesty". `projectPackDocument` ships
`start` whole (`apps/server/src/pack-registry.ts:59`, B6a §1.1) in `GET /packs/:id`, before a
move is played — so that field is response body, not authoring metadata, and putting the
line there re-creates the leak class the repo already closed for authored prose. The line
lives in `evidence.json`, which is never served (B6a §1.1a), and `start.movesSan` is
**omitted**. It has no production reader anyway (B6a §0), so the pack loses a field nothing
renders and gains the property that the drill's setup cannot be read off the wire.

Emitted packs are therefore **spine-less**. Nothing in the CSV supplies a continuation, and
inventing one would be a chess claim (AGENTS.md law 8). §3 says exactly what the learner
faces and exactly how thin the machine verdict is, because a spine-less pack has one
executable grade and it is not a judgement of play.

## Motivation

The 1000–1400 on-ramp is the one band where `design/00-thesis.md:88-90` specifies three
knobs and the repo can encode two of them. There is no on-ramp content at all: all three
hand-authored drafts (`content/drafts/`) are core-band packs at `targetElo` 1800–1900. The
puzzle database is the largest CC0 position source available — 6,057,356 rated and tagged
puzzles (`design/research/theory-sourcing.md:102-107`) — and the only one that arrives with a
per-position difficulty rating, which is what makes band-targeted on-ramp content mechanical
rather than a guess.

The failure mode is equally clear, and it is why this RFC's shape matters more than its
throughput: a pipeline that emits puzzle positions with the solution attached produces a
tactics trainer with a rewind button. That is one word away from the standing failure-shape
warning at `design/00-thesis.md:72-74`.

**Out of scope,** each with a reason:

| Out of scope | Why |
|---|---|
| Everything in B6a §1–§3 | `rfc/content-sourcing-foundation.md`. This RFC adds one record kind and one emitter |
| Grading the learner's play | No source supplies it. §3 states what is and is not graded, rather than manufacturing a verdict |
| Tactic *training* in any form: solve-the-position, hint reveal, solution playback | `design/00-thesis.md:93-94`. The solution is consumed at emit time and never re-enters the product |
| Lichess theme *description prose* | `design/research/theory-sourcing.md:108-112`: the theme keys are facts and reusable; lila's description strings are AGPL text and are not reused |
| Bulk retention of the puzzle dump | The dump is streamed and discarded; only selected rows survive, in fixtures. `AGENTS.md:93-95` |
| `immediate_blunder_guard` feedback | Defect **D8** (`design/BACKLOG.md:118`). §Deviations 1 records the substitution |

## Specification

### 1. Input encoding, verified live 2026-08-12 `[V]`

Header, read from the actual file at `database.lichess.org/lichess_db_puzzle.csv.zst`
(`content-length: 304384407`, `last-modified: Sun, 02 Aug 2026`):

```
PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags,DailyDate
```

**Eleven columns.** `design/research/theory-sourcing.md:102-107` abbreviates this with an
ellipsis; `DailyDate` is the eleventh and `RatingDeviation` the fifth.

The `FEN`/`Moves` convention, confirmed by replaying three real rows through `chessops` —
every move legal, SAN derived, parity checked:

| PuzzleId | `FEN` side to move | `Moves` | Solver |
|---|---|---|---|
| `00008` | `b` | `Bxg3 Rxe7 Qb1+ Nc1 Qxc1+ Qxc1` | **white** (3 solver moves = theme `long`) |
| `0000D` | `w` | `Qd6 Rd8 Qxd8+ Bxd8` | **black** (2 = `short`) |
| `000Pw` | `w` | `Nd2 Ne2+ Kf1 Nxc3` | **black** (2 = `short`; the `fork` is Black's) |

So: **`FEN` is the position *before* the opponent's move; `Moves[0]` is the opponent's move;
the solver is the side to move *after* `Moves[0]`; the solution is the odd-indexed moves and
the list always ends on one.** An emitter that treats `FEN` as the position to solve builds
every pack from the wrong side. This finding is the single most load-bearing fact in this
RFC and every acceptance criterion below that touches sides exists to keep it true.

Two arithmetic consequences the emission rules depend on, both following directly from the
alternation and from the list ending on a solver move:

- **`Moves.length` is always even.**
- **After the complete line is applied, the side to move is the `FEN` side — that is, the
  non-solver.** The tactic has just landed and the defender must answer.

### 2. Emission — a consequence pack, spine-less

`make candidate-emit PIPELINE=position-seeds ARGS='--rating-band 1000-1400 --themes fork,pin
--count 20'`.

| Pack field | Value | Why this, and why not the obvious alternative |
|---|---|---|
| `id` | `` `onramp-${PuzzleId.toLowerCase()}` ``, with `-2`/`-3` suffixes on case-fold collision in ascending original-id order | `PuzzleId` is mixed-case (`000Pw`) and the pack `id` pattern is `^[a-z0-9][a-z0-9-]*$` (`schemas/drill_pack.schema.json:78-81`). Case folding is lossy, so the original is preserved verbatim in `evidence.json`'s `puzzleId` (§4) — and in `title`, which keeps the case too |
| `version` | `"0.1.0"` | `schema:82-84` |
| `title` | `` `Play on from Lichess puzzle ${PuzzleId}` ``, `PuzzleId` case-preserved | `nonEmptyString`, root-required. Carries no chess claim and requires no judgement about which theme is "primary". It is a *pointer*, not the line — §3's disclosure paragraph says what that costs |
| `mode` | `"outcome"` | `schema:23`, root-required (`schema:7-18`). **The withdrawn draft omitted `mode` entirely and would not have validated.** Not `"line"`: there is no line |
| `phase` | see §2.2 | `schema:24-26`, optional |
| `start.fen` | `FEN` with **all** of `Moves[0..n-1]` applied | **the redesign.** The complete solution is setup; this is the position the tactic produced |
| `start.movesSan` | **omitted** | `schema:113-116` makes it optional and `start` requires only `fen` (`schema:110-119`). The full line **is** the puzzle solution, and `start` is served whole to the browser before play (`pack-registry.ts:59`; B6a §1.1). The line goes to `evidence.json` instead (§4). Omitting it is free: `movesSan` has no production reader (B6a §0) |
| `start.side` | **the solver's colour**, i.e. the opposite of the `FEN` side to move | `schema:117`, schema-optional but client-required — defect **D9**, so it is always written (`apps/web/src/lib/screen-model.ts:54-60`). `start.side` is the *learner's* colour, not the FEN's side to move (B6a §0, `apps/web/src/lib/session-controller.ts:367`). Since the side to move after the full line is the non-solver (§1), the **opponent moves first**: the defender answers the tactic, then the learner plays on |
| `spine` | **absent** | the CSV supplies no continuation. `spine` is optional at the root (`schema:7-18` omits it from `required`) and `minItems: 1` only when present (`schema:39-43`) |
| `objective.type` | `"play_until_checkpoint"` | the only condition-free honest type; `win`/`execute_break` need an `outcome.reached` producer, which does not exist (B6a §0) |
| `objective.summary` | `` `Play on from this position for ${C} plies against an opponent near your rating.` `` | mechanical instruction, zero chess claims. Recorded as a placeholder in `graduationBlockers` (B6a §4) |
| `objective.successConditions` | `[{ "kind": "reach_checkpoint", "checkpointId": "consequence" }]` | the only executable condition (`apps/server/src/pack-validation.ts:160-178`) |
| `checkpoints` | exactly one: `{ "id": "consequence", "label": "Consequence", "trigger": { "atPly": C }, "actions": [] }`, `C` even, default 8 | see §2.1 |
| `opponentPolicy` | `{ "mode": "human_common", "targetElo": <§2.3>, "seedMode": "per_branch" }` | `apps/server/src/capabilities.ts:10-14`. `human_common` is what makes it a consequence rather than a solution check: Maia does **not** have to play the defence the source game played. **Never `theory_strict`** — with no spine it silently degrades to `human_common` (`apps/server/src/opponent-selector.ts:453-458`) and the pack would misdescribe its own opponent |
| `feedbackPolicy` | `"delayed_checkpoint"` | §Deviations 1 records the deviation from the declared on-ramp knob |
| `difficulty` | `{ "minOnlineRapid": max(1000, Rating-150), "maxOnlineRapid": max(1000, Rating+150), "branchLengthTarget": C }` | **both** bounds carry `minimum: 1000` (`schema:97-98`), not just the lower one — the withdrawn draft clamped only `minOnlineRapid`. `branchLengthTarget` accepts 2–20 (`schema:100-104`) and `C = 8` is the top of the declared on-ramp branch band (`design/00-thesis.md:88-89`) |
| `deviations`, `planClasses`, `feedbackClaims`, `concepts`, `annotations`, `authoredBoundary` | **absent** | every one of them is a judgement |
| `provenance` | `reviewStatus: "draft"`, `reviewers: []`, **one** CC0 source string naming the dump and its `etag` (§5), `licence: "CC-BY-SA-4.0"` (B6a §2, unconditional), no `attribution`, `graduationBlockers` | `schema:458-475`. `provenance` is served verbatim before play (`pack-registry.ts:58`), so it carries the obligation and nothing else — the per-row `PuzzleId`/`GameUrl` pointer moved to `evidence.json` (§5) |

**2.1 The checkpoint, and why `atPly`.** The root is `ply: 0`
(`packages/runtime/src/runtime.ts:178`) and every move is `+1` (`:325`).
`orchestratePackMove` runs after learner moves *and* opponent plies
(`apps/server/src/service.ts:258,282` — post-F3 coordinates), and `atPly` compares `node.ply`
directly (`apps/server/src/pack-orchestrator.ts:45`), so it always fires.

`atSpineNode` is not merely a worse choice here — it is **structurally impossible**. With no
spine, `activeSpineNodeId` walks `pack.spine ?? []` and returns `undefined` at the first move
(`pack-orchestrator.ts:21-37,28`), so an `atSpineNode` checkpoint can never fire and the
drill would silently never end. A pack whose only checkpoint never fires also never reveals
withheld engine evidence, because under `delayed_checkpoint` disclosure requires a
`checkpoint.reached` event — `feedbackDisclosed`, `packages/runtime/src/feedback.ts:3-6`,
called from `apps/server/src/feedback-policy.ts:13,39`. (There is no `feedbackIsRevealed` in
the tree; two drafts of this territory cited that name.)

`C` is **even** because the opponent moves first (§2, `start.side` row), so learner plies are
even and an even `C` lands the checkpoint on the learner's own move rather than mid-reply.
`C = 8` gives four learner moves and four replies. `C` is also the emitted
`difficulty.branchLengthTarget`, so a `C` outside 2–20 is refused rather than clamped
(`schema:100-104`).

The single non-`atSpineNode` checkpoint additionally suppresses
`AUTHORED_PROSE_AFTER_LAST_CHECKPOINT` entirely (`packages/schema/src/drill-pack/lint.ts:50-60`),
which is correct for a seed carrying no prose and becomes the author's problem the moment
they add some.

**2.2 `phase`.** Emitted only when the row's `Themes` contains exactly one of the literal
keys `opening`, `middlegame`, `endgame`, mapped straight through; omitted otherwise, and
omitted when two or more appear. **All three keys are verified present** `[V]` in the official
vocabulary, read live 2026-08-12 from
<https://raw.githubusercontent.com/lichess-org/lila/master/translation/source/puzzleTheme.xml>
(alongside `pin`, `fork`, `mate`, `mateIn1`–`mateIn5`, `short`, `long`, `veryLong` and the
rest; each key appears as a `name` attribute with a paired `<key>Description` string that this
RFC does not reuse — `design/research/theory-sourcing.md:108-112`). The previous revision
marked them `[M]` and unverified; they are neither.

The emitter still treats absence as normal — no matching key means no `phase`, never an error
and never a guess — because the vocabulary is Lichess's to change and a pipeline that fails on
an unfamiliar theme list would break on their next release rather than on ours.

**2.3 `targetElo`.** `Rating` clamped to `[1100, 2000]`. This clamp is an **authoring
convention, not a capability claim**: `schema:363` types `targetElo` as a bare integer,
`apps/server/src/opponent-selector.ts` requires only a safe integer, and the packaged Maia
worker advertises an `Elo` option with no documented range
(`workers/maia/README.md:42-44`). The bounds are taken from the served band
(`design/00-thesis.md:78-95`, 1000 → 2000+) and are recorded in `graduationBlockers` as an
authoring decision, not asserted as an engine limit.

### 3. What the learner faces, and how it is graded without an authored spine

This is the part a spine-less pack has to answer honestly.

**What they face.** A position that a tactic has just produced, with the defender to move.
They are told nothing about the tactic: it is not in the pack. They play four moves against
Maia at their own band, which is under no obligation to play the source game's defence —
`human_common` samples from the model's policy (`opponent-selector.ts` `#humanCommon`), it
does not replay a script. Then the checkpoint fires, evidence is released, and they can
rewind, branch, and compare, which is the product's core loop and needs no authored content
to work.

**What the position is *not* claimed to be.** Not "winning", not "an advantage", not "in the
learner's favour". A puzzle's solution is the best line available, and what it produces
depends entirely on the puzzle: mate (excluded outright, §4.7), material won, a perpetual, a
fortress, a saved half-point, or simply the least-bad continuation of a position that is
still worse. `design/research/theory-sourcing.md:108-112`'s theme vocabulary contains
defensive and drawing themes for exactly this reason. **Nothing in the CSV states which**,
and this pipeline has no instrument that could — so the claim is not made anywhere in the
emitted document, and every candidate carries the `graduationBlockers` entry

> `The start position is whatever the puzzle's solution produced; it is not asserted to be winning, equal, or better for the learner. No engine or tablebase has evaluated it.`

If B6b has landed **and `--engine-eval` is passed** (§4), an author may attach an `engine_eval`
record for the start position — that is the only way this system can say what the position
actually is, it is opt-in rather than ambient, and it is evidence for a reviewer rather than a
sentence for a learner.

**What is graded, exactly.** One thing: `reach_checkpoint`. The only executable success
condition in the system is `reach_checkpoint` for a checkpoint in the same pack
(`pack-validation.ts:160-178`, `pack-orchestrator.ts:88-100`), and `outcome.reached` has no
producer (B6a §0). So the objective transitions `active → achieved` on **surviving eight
plies**, and nothing else. That is the entire machine verdict, and this RFC states it in the
pack: every candidate carries the `graduationBlockers` entry

> `The objective transitions on reaching the checkpoint, i.e. on playing the position out. No shipped mechanism grades how it was played out or what happened to the position; adding one is an authored act.`

Calling that a grade would be dishonest, so it is not called one anywhere in the emitted
document — `objective.summary` says "play on for 8 plies", which is exactly what is measured.

**What the learner nonetheless gets that is real, and where it comes from.**

1. **The consequence itself.** Watching a live opponent answer, and being wrong about how
   they would, is the training signal the product is built on. It requires no authored
   content and no grading.
2. **Shipped engine evidence, released at the checkpoint.** The evidence queue attaches
   `eval`/`wdl`/`bestline` payloads with `source: "engine_validated"`
   (`apps/server/src/evidence-queue.ts:324,339,360`), withheld until reveal by
   `publicNodes`/`publicEvents` (`apps/server/src/feedback-policy.ts:10,34`). That is not this
   RFC's code and this RFC changes none of it; it is why a spine-less pack is still worth
   playing.
3. **Rewind and compare.** `POST /runs/:id/rewind`, `/fork`, `/compare`
   (`apps/server/src/rest.ts:670,689,711` — post-F3; the draft's `:492,510,531` are stale)
   are pack-independent.

**What is not available, stated as a blocker rather than hidden.** Nobody can say whether the
plan was right, whether the conversion technique was sound, or which of two branches was
better *as chess*. Those are `feedbackClaims`, `planClasses` and `deviations` — B6a §3.3's
permanently-human fields — and every candidate's `graduationBlockers` lists them as unwritten.
An author who wants them writes them; the pipeline never will.

**What is served, and the one disclosure that remains.** Everything in B6a §1.1's served
column is public before play. For a B6d candidate that is: `id`, `title`, `mode`, `phase`,
`difficulty`, `provenance`, `start` (now `fen` and `side` only), `objective.type`/`summary`,
`feedbackPolicy`, `opponentPolicy`, an empty `spine`, and one checkpoint's id and label. The
puzzle line is in none of them.

What remains is a **pointer**: the `PuzzleId` inside `id` and `title`. Anyone who follows it
to `lichess.org/training/<id>` sees the tactic that produced the start position and, through
the puzzle's game link, what the original players did next. Three reasons this is accepted
rather than engineered away, stated so the trade is visible instead of implied:

1. It is not the drill's answer. The tactic is over; the drill begins after it. The source
   game's continuation is one human's choice in a game the learner is not playing, and Maia
   is under no obligation to repeat it.
2. Obscuring it does not work. The start FEN is searchable, and a hashed id would trade a
   stable, deterministic, collision-resolvable identity (§Acceptance 12) for obscurity that
   one query defeats.
3. The pointer is what makes a candidate reviewable. `evidence.json` carries the full
   `puzzleId`, `gameUrl` and solution line for the reviewer; `id` and `title` are what let a
   human match a served pack back to its record.

The `GameUrl` itself is **not** in `provenance` any more (§5): CC0 imposes no attribution
obligation, so an unrequired pointer that resolves to withheld material belongs in the
sidecar, per B6a §1.1a's rule.

### 3a. The run that never reaches ply 8 — B6d blocks on D11

Everything in §3 depends on one event: the `consequence` checkpoint firing at ply 8. That is
where the objective transitions, where withheld engine evidence is released, and therefore
where the entire "what the learner nonetheless gets that is real" list above comes from. **A
run that ends before ply 8 gets none of it, permanently.**

This is not hypothetical for this pipeline in particular. B6d's start positions are the
aftermath of a tactic, four learner moves from a live Maia opponent, in positions that
frequently have reduced material and an exposed king — and the *defender* moves first. Mate,
stalemate and insufficient material inside eight plies are ordinary outcomes there. When one
happens the terminal move commits and is orchestrated normally
(`apps/server/src/service.ts:258,282`), every later move throws `RUN_TERMINATED`
(`packages/runtime/src/runtime.ts:274-276`), the `atPly 8` trigger never matches
(`apps/server/src/pack-orchestrator.ts:45`), `feedbackDisclosed` stays false forever
(`packages/runtime/src/feedback.ts:3-12`), and the objective never leaves `active`. This is
shipped defect **D11** (`design/BACKLOG.md:115`), stated once with its mechanism and its four
closed workarounds in B6a §1.5.

The irony is worth naming because it is also the argument: **the learner who converts the
tactic into a mate is the one the product punishes.** They played the position out better than
the checkpoint asked and are shown less than someone who shuffled. A pack whose reward
structure inverts on its best outcome is not shippable content, whatever its emitter does.

There is **no bounded workaround** to specify instead, and B6a §1.5 is the check rather than an
assertion: no trigger observes a terminal position, an early checkpoint would disclose from
ply 1 and destroy `delayed_checkpoint`, `segment_end` requires a checkpoint to have fired
already, and `attempt_end` does not validate. Lowering `C`, or filtering to positions unlikely
to end, would be shaping content around a runtime defect — and §4.7 already rejects rows whose
*start* is terminal, which is a different and much smaller problem than a run that terminates
mid-drill.

**So B6d is not implementable until D11 ships.** The fix is named in B6a §1.5, it is
program-item work rather than sourcing work, and this RFC does not implement it as a side
effect. §Acceptance 19a is the failing test that expresses the block.

### 4. Selection, and the boundary conditions that make a row unusable

Rows are read from the streamed CSV and accepted only if **all** hold:

1. `Rating ≥ 1000` — below it `difficulty.maxOnlineRapid` would clamp to the same value as
   `minOnlineRapid` and the band would be degenerate.
2. `Rating` inside the requested `--rating-band`.
3. `NbPlays ≥ 1000` and `Popularity ≥ 80` — signal quality, per the CSV's own columns.
4. `Themes` intersects `--themes` when given; theme **keys only**, never lila's descriptions
   (`design/research/theory-sourcing.md:108-112`).
5. `Moves.length` is even, ≥ 2, and ≤ 8. Even is an invariant of the format (§1) and a row
   violating it is a parse error, not a filter miss. The ceiling keeps the setup short enough
   that a reviewer can replay `evidence.json`'s `solutionUci` by hand and see that it
   produces `start.fen` — the review path that replaced the served `start.movesSan`.
6. Every move in `Moves` is legal from its predecessor, walked with `chessops`. A row that
   does not walk is skipped with a named error, never partially emitted.
7. **The resulting position has at least one legal move and is not checkmate or stalemate.**
   This is the boundary condition the redesign creates and the withdrawn draft could not have
   hit: applying the *complete* line to a mating puzzle produces a **checkmated position**,
   from which there is nothing to play on. The check is positional, not thematic — the row is
   evaluated with `chessops` after the full line and rejected on `isEnd()` — so it holds even
   if a mate row carries no `mateIn*` theme and even if the theme vocabulary changes.
   Theme-based exclusion of `mate`/`mateIn1`/`mateIn2`/`mateIn3` is applied as well, as a
   cheap pre-filter, but it is belt to the positional check's braces and never the sole
   guard.

Selection is deterministic: after filtering, sort by `PuzzleId` ascending and take the first
`--count`.

**Scale, and exactly what is kept.** The dump is 304 MB zstd (§1). The pipeline streams it
row-at-a-time through `node:zlib`'s `createZstdDecompress` and never materializes it;
`node -e "require('node:zlib').createZstdDecompress"` resolves on the interpreter in this
checkout (v26.7.0, re-checked 2026-08-12) and the repo pins `engines.node >= 24`
(`package.json:24-25`), but the emitter **asserts the export exists at startup** and exits
with a named error rather than assuming it.

`lichess-puzzle-db` is declared a **streamed source**, so its cache entry is B6a §1.4's
`headers-only` kind: status, headers, `etag` (`"6a6ef08b-12248997"`, `content-length:
304384407`, `last-modified: Sun, 02 Aug 2026 07:23:55 GMT`, all re-verified 2026-08-12) and
`retrievedAt` — **and no body**. The 304 MB is decompressed through the process and dropped;
it is never written to `content/sources/`. "Streamed and discarded" and "retained in the
cache" were both stated in the earlier draft and they cannot both be true; this is the one
that holds, and B6a §1.4's 50 MB ceiling is what forces it rather than leaving it to
discipline.

Three consequences, all deliberate:

- **A re-run is a no-op only when the `etag`, the job, *and* the outputs all say so.** The
  previous revision short-circuited on the `etag` alone, which is wrong in the ordinary case:
  after one run at `--rating-band 1000-1400 --themes fork --count 20`, a second run asking for
  `--themes pin`, or `--count 200`, or a different band, sees the same dump `etag` and emits
  **nothing** — the upstream has not changed, but the question has. The dump's identity says
  what the *input* is; it says nothing about what was asked of it.

  So the no-op requires all three of B6a §1.4's conditions: the `HEAD` `etag` is unchanged;
  the `emissionJobDigest` — SHA-256 over the canonicalized `{pipeline, resolved args,
  sourceEtags}`, recorded in `job.json` — is byte-identical to the recorded one; and the
  outputs are **complete**, meaning every candidate directory the recorded job names exists
  with all three artifacts and `sourcing-check` passes on each. Any of the three failing means
  a full re-run. `--engine-eval` is part of the resolved args and therefore part of the digest,
  so turning it on changes the job (§4).
- A re-run whose `etag` **changed** must re-download; there is no cached body to fall back
  on. That is the price of not keeping 304 MB, and it is the right price for an authoring
  command that runs a handful of times a year.
- `--offline` therefore cannot consult the dump at all. B6d's offline path is the committed
  row fixtures and nothing else (§Acceptance 23), which is what CI runs against anyway.

Nothing from the dump survives on disk except the header entry, the selected rows inside the
emitted candidates and their `evidence.json`, and the committed CI fixtures.

**What B6d writes into `evidence.json`** — which is the sidecar, never merged into the pack
and never served (B6a §1.1a). One `puzzle_provenance` record per candidate,
`grounds: "citable_source"`, `values` carrying `{ puzzleId, gameUrl, rating, ratingDeviation,
popularity, nbPlays, themes, csvFen, solutionUci, solutionSan, solutionPlies }`, supporting
only `/start/fen`.

`solutionUci`/`solutionSan` are the line this RFC removed from the pack. They are recorded
here because a reviewer must be able to check that `start.fen` is what `csvFen` plus the
whole line produces — the claim `supports: ["/start/fen"]` makes — and that check is
mechanical: `sourcing-check` replays `solutionUci` from `csvFen` with `chessops` and fails
`EVIDENCE_VALUES_INVALID` if the result is not `start.fen`. The pack is thereby verifiable
without the pack containing the answer, which is the whole shape of this redesign.

One `position_legality` record for the start position, `grounds: "machine_validation"`.
**No `templateId`, therefore no prose support** — B6a §3.3's table has no row for
`puzzle_provenance`, so any attempt fails `EVIDENCE_OVERREACH`.

**Engine evaluation is opt-in behind `--engine-eval`, and ambient availability changes
nothing.** When and only when that flag is passed, the emitter writes one `engine_eval` record
per start position under B6b §3.3's fixed-depth authoring rules, with the matching `engine`
manifest entry (B6a §1.2). Without the flag it writes none, **even if B6b has landed, even if a
Stockfish binary is on the path, and even if the engine cache already holds an answer** — and
the emitter never probes for engine availability outside the flagged path.

The rule is about determinism, not tidiness. Deterministic output means the artifacts are a
function of the recorded inputs; a record that appears because a sibling RFC shipped, or
because this machine happens to have an engine, makes the output a function of the environment
instead, and two authors on the same fixtures would produce different candidates with different
`packDigest`-adjacent sidecars and different `sourcedAt`. `--engine-eval` is part of the
resolved argument set and therefore part of the `emissionJobDigest` (§4), so turning it on is a
visibly different job rather than a silent drift. Absent the flag, `sourcing-check` fails
`EVIDENCE_KIND_UNEXPECTED` on any `engine_eval` record in a B6d candidate.

It stays optional because it is the only thing in the system that could ever say what the
position is worth (§3), and it stays evidence for a reviewer rather than a sentence for a
learner: B6a §3.3's table has no `engine_eval` prose template either.

### 5. Licence

CC0-1.0, quoted at `design/research/theory-sourcing.md:104-106` from `database.lichess.org`:
"Database exports are released under the Creative Commons CC0 license. Use them for research,
commercial purpose, publication, anything you like." Encoded per B6a §1.2 as
`basis: "spdx"`, `spdx: "CC0-1.0"`, `noticeText: null`, `rationale: null` — the row that
derives no attribution and no share-alike obligation. The obligation booleans are not stored:
a `licence` object carrying them fails `LICENCE_FIELD_INVALID`, because a field that can
disagree with its own SPDX identifier is a bypass, not an encoding.

**One** `provenance.sources[]` string per candidate: the CC0 statement with the dump URL and
`etag`. The earlier draft added a second string carrying the `PuzzleId` and `GameUrl`;
`provenance` is served verbatim before play (`pack-registry.ts:58`), CC0 imposes no
attribution obligation, and B6a §1.1a says a pointer that discharges no obligation and
resolves to withheld material belongs in the sidecar. So `puzzleId` and `gameUrl` are in
`evidence.json` (§4), case-preserved, where the reviewer reads them. The `PuzzleId` still
appears in `id` and `title` and §3 accounts for that.

`provenance.licence` is `"CC-BY-SA-4.0"` — the wholesale ruling of B6a §2, which is about
*our* prose and is written on every emitted pack regardless of what was borrowed.
`provenance.attribution` is absent: CC0 requires none and no prose is borrowed. The Lichess
theme *keys* that appear in `evidence.json` are API vocabulary, not text.

## Deviations from design

1. **The on-ramp's declared feedback knob cannot be encoded.** `design/00-thesis.md:88-90`
   and `design/04-content-architecture.md` §6 specify `immediate_blunder_guard` for the
   1000–1400 layer; `apps/server/src/pack-validation.ts:103-111` rejects it in v1 while
   `schemas/drill_pack.schema.json:54` accepts it — defect **D8**
   (`design/BACKLOG.md:118`). B6d emits `delayed_checkpoint` and records the substitution in
   `graduationBlockers`. Making the on-ramp policy real is program item #2/#4 work, not a
   sourcing change, and B6d's candidates become correct by **re-emission** when it lands —
   nothing needs hand editing.
2. **`design/04` §6 says "one-move-consequence packs"; these carry the *whole* solution as
   setup.** A one-move setup would leave the learner inside the tactic. The design intent
   ("play-the-consequence rather than find-the-tactic") is preserved exactly; the ply count of
   the setup is not.
3. **The pack records no history.** `start.movesSan` exists in the format for exactly the
   purpose B6d cannot use it for: saying how the position arose. Here those moves are the
   puzzle's solution and `start` is served whole before play (B6a §1.1), so the field is
   omitted and the line is kept in `evidence.json`. The learner sees a position with no
   preamble, which is what a from-position drill is; and since `movesSan` has no production
   reader (B6a §0), nothing on screen changes.
4. **Emitted packs are spine-less**, where `design/04` §2d's pack-contents template and the
   drill-pack format both centre on a spine. No source supplies a continuation. The runtime
   supports it — `spine` is optional at the root, `lintDrillPack` handles `pack.spine ?? []`
   (`packages/schema/src/drill-pack/lint.ts:228`), `projectPackDocument` emits `spine: []`
   (`apps/server/src/pack-registry.ts:66`), and the client's `timelineEntries` reads
   `pack?.spine ?? []` (`apps/web/src/lib/screen-model.ts:96`) — but no shipped pack exercises
   it, so the acceptance criteria prove it end to end rather than assuming it.
5. **Doctrine deviation: the puzzle-dump scan is TypeScript, not a Go worker.**
   `AGENTS.md` doctrine assigns self-contained data-format workers to Go.
   `find . -name "go.mod" -not -path "./node_modules/*"` is empty — there is no Go toolchain,
   build, or CI lane in this repo, so a Go worker here is a new lane plus a pipeline. The scan
   also terminates in `chessops` semantics (walking `Moves`, deriving SAN, testing `isEnd()`)
   that exist only in TS, and it shares B6a's cache and manifest code. Revisit trigger: if the
   scan becomes a scheduled or serving component rather than a one-shot authoring command.
6. **The `targetElo` clamp is an authoring convention, not a capability.** Stated in §2.3
   rather than presented as an engine constraint, because no shipped code bounds it.

## Acceptance criteria

**The redesign, proved against real rows:**

1. **The complete line is applied.** Fixture rows `00008`, `0000D`, `000Pw` (committed
   verbatim, all eleven columns) emit candidates whose `start.fen` equals the FEN reached by
   playing **all** of `Moves` from the CSV `FEN`, asserted by an independent `chessops` walk
   in the test rather than by the emitter's own output.
2. **The wrong-side bug cannot survive.** For each fixture, `start.side` equals the solver:
   `white` for `00008`, `black` for `0000D` and `000Pw`. A test asserts `start.side !==
   sideToMove(csvFen)` and `start.side !== sideToMove(pack.start.fen)`; a candidate failing
   either assertion fails the suite. This is the §1 finding under regression.
3. **The opponent moves first.** In a played run the node at `ply: 1` has
   `actor: "opponent"` and the node at `ply: 8` — the one carrying the `consequence`
   checkpoint reference — has `actor: "user"` (`Actor` at `packages/runtime/src/types.ts:3`,
   the node field at `:85`).
4. **No spine is emitted.** `"spine" in pack` is `false` for every candidate — not an empty
   array, absent. `validatePackDocument` passes; `projectPackDocument` returns `spine: []`.
5. **The solution is not in the served response, in any field.** The strongest criterion in
   this RFC, and it is a string search, not a structural one: for each fixture candidate the
   test serializes `GET /packs/:id` and asserts that **no** element of `Moves` appears in it
   in UCI or in SAN, in any casing — not in `start`, not in `spine`, not in `provenance`, not
   in `title`, not in a checkpoint label. Separately: `"movesSan" in pack.start` is `false`;
   `pack.spine`, `pack.deviations` and every checkpoint trigger contain no `Moves[i]`; and
   `authoredFeedback` for a completed run contains none of them either.
6. **The line survives where a reviewer needs it, and only there.** `evidence.json` carries
   `solutionUci` and `solutionSan`; `sourcing-check` replays `solutionUci` from `csvFen` and
   fails `EVIDENCE_VALUES_INVALID` when the result is not `start.fen`; and a mutated
   `start.fen` is caught by that check — so removing the line from the pack costs no
   verifiability.
7. **The disclosure is exactly the pointer, and no more.** A test asserts `provenance.sources`
   has exactly one entry, that it contains the dump URL and `etag`, and that it contains
   neither `GameUrl` nor a bare `PuzzleId` outside the `id`/`title` pointer §3 accepts.
8. **`mode` is present.** Every candidate declares `mode: "outcome"`; a candidate with `mode`
   removed fails `validatePackDocument` at `/` with a `required` error — the withdrawn
   draft's omission under regression.
9. **`start.side` is always written.** Every candidate carries it (defect D9: the schema does
   not require it, `packStartSide` throws without it, `screen-model.ts:54-60`), and a
   candidate with it stripped is asserted to throw in the client while still passing JSON
   Schema — the divergence, under regression.

**Boundary conditions of shapes the schema permits** — the failure class that killed five
drafts:

10. **A mating puzzle is refused.** A fixture row whose complete line ends in checkmate is
    rejected by §4.7 with a named error and emits no candidate. The same assertion is made
    twice: once for a row carrying a `mateIn2` theme, and once for a hand-constructed row that
    mates with **no** mate theme in `Themes` — proving the positional check, not the theme
    pre-filter, is the guard. A stalemate row is refused the same way.
11. **`atSpineNode` cannot fire on a spine-less pack.** A pack identical to an emitted
    candidate except for an `atSpineNode` trigger is played for 12 plies and asserted
    **never** to emit `checkpoint.reached`; the emitted `atPly` candidate fires at ply 8 in
    the same scenario. Consequently the `atSpineNode` variant never reveals engine evidence
    (`feedbackDisclosed`, `packages/runtime/src/feedback.ts:3-6`), asserted directly.
12. **`theory_strict` is never emitted, and would lie if it were.** A test asserts every
   candidate declares `human_common`; a companion test sets `theory_strict` on a spine-less
    pack, runs one selection, and asserts it takes the `#humanCommon` path
    (`opponent-selector.ts:453-458`).
13. **Both rating bounds are clamped.** A puzzle with `Rating: 1050` emits
    `minOnlineRapid: 1000` (not 900) **and** `maxOnlineRapid: 1200`; a hand-constructed row
    with `Rating: 1000` emits `maxOnlineRapid: 1150`, and a row with `Rating: 900` is rejected
    by §4.1 rather than emitting `maxOnlineRapid: 1050`. Both fields carry `minimum: 1000`
    (`schema:97-98`).
14. **`C` is even and inside the `branchLengthTarget` range.** `C = 8` by default; `--plies 7`
    and `--plies 22` are each refused with a named error rather than silently adjusted.
15. **PuzzleId case-fold collision.** Two fixture rows differing only in case emit ids
    `onramp-<x>` and `onramp-<x>-2`, deterministically by ascending original id, with both
    originals preserved case-exact in `evidence.json`'s `puzzleId` (not in `provenance` —
    §5).
16. **Odd `Moves.length` is a parse error.** A hand-corrupted fixture row with five moves
    fails with a named error naming the §1 invariant, not a filter skip.
17. **`phase` is emitted only on an exact single match**, and its absence is never an error —
    asserted on a row with no phase theme, one with `endgame`, and one hand-constructed with
    both `middlegame` and `endgame`.
18. **No emitter writes a key the schema forbids** — B6a §Acceptance 13's property test
    extended to this pipeline, asserting in particular that `start` and `difficulty` carry no
    extra keys.

**Grading honesty:**

19. **The objective transitions on the checkpoint and on nothing else.** A run that plays
    eight plies badly (a scripted losing sequence) reaches `achieved` exactly as one that
    plays well does, and the test asserts both — the machine verdict this RFC declines to
    dress up. Both scripted lines are asserted **non-terminal at every ply**
    (`position.isEnd()` false through ply 8), so this criterion proves the grading rule and is
    not quietly resting on two lines that happened to avoid D11.
19a. **A run that ends before ply 8 still reveals.** A B6d candidate is played along a
     **scripted forced mate** landing before ply 8. After the mating move the test asserts:
     the objective has left `active`; `feedbackDisclosed` is true
     (`packages/runtime/src/feedback.ts:3-12`); `GET /runs/:id/events` includes the
     `evidence.attached` events withheld until then; and the learner sees what a ply-8 finisher
     sees. A stalemate line and an insufficient-material line are asserted the same way.
     **This cannot pass until D11 ships** (§3a, B6a §1.5, `design/BACKLOG.md:115`) and is the
     block, expressed as a test. The test asserts its own lines *are* terminal before ply 8, so
     no future edit can satisfy it by choosing a line that survives.
20. **The blockers are present verbatim.** Every candidate carries the grading blocker (§3),
    the not-asserted-to-be-winning blocker (§3), the `objective.summary` placeholder blocker
    (B6a §4), the `immediate_blunder_guard` substitution blocker (§Deviations 1), and the
    `targetElo` convention blocker (§2.3).
21. **No emitted document claims the position is good for the learner.** A test asserts the
    strings `winning`, `advantage`, `in your favour`, `better` and `won` appear nowhere in
    any emitted `title`, `objective.summary`, checkpoint `label` or `provenance` string —
    the §3 restraint under regression, since the emitter's vocabulary is fixed and small
    enough for the assertion to be exact rather than a heuristic.
22. **No prose is supported.** A `puzzle_provenance` record whose `supports` targets
    `/objective/summary`, `/checkpoints/0/label`, or `/deviations/0/class` fails
    `EVIDENCE_OVERREACH`; one carrying `templateId: "explorer-move-share/v1"` fails the same
    way (templates are keyed by `kind`, B6a §3.3).
23. **Engine evidence still reveals.** A completed run's `GET /runs/:id/events` withholds
    `evidence.attached` before ply 8 and includes it after, using the shipped withholding
    barrier unmodified.

**Scale, licence, hygiene:**

24. **The dump is streamed and never lands on disk.** A test runs the emitter against a
    synthetic `.csv.zst` fixture above the 50 MB ceiling with a heap ceiling and the cache
    directory watched, and asserts: peak resident rows never exceed one; no cache file
    exceeding a few kilobytes is created; the cache entry is B6a §1.4's `headers-only` kind
    carrying `etag`, `content-length` and `retrievedAt` and **no** body.
    `createZstdDecompress` is asserted present at startup, and its absence produces a named
    error rather than a `TypeError`.
25. **The no-op requires all three conditions, and the two-of-three cases re-emit.** A second
    run with the same `etag`, an identical `emissionJobDigest`, and complete passing outputs
    emits nothing and exits 0. Each of these **re-emits** instead, asserted separately, and the
    first three are the bug the previous revision shipped:
    - same `etag`, `--themes pin` where the recorded job had `--themes fork`;
    - same `etag`, `--count 200` where the recorded job had `--count 20`;
    - same `etag`, `--rating-band 1400-1800` where the recorded job had `1000-1400`;
    - same `etag` and identical digest, but one candidate's `evidence.json` deleted;
    - same `etag` and identical digest, but one candidate failing `sourcing-check`.
    A run whose `etag` changed is asserted to re-download rather than to read a cached body,
    because there is none — the documented price of §4's retention rule. A test asserts
    `job.json` is not part of `pack.json`, `evidence.json`, `sources.json`, or any digest.
25a. **Engine evaluation is opt-in and ambience-proof.** Without `--engine-eval`, a run with
     B6b landed, a Stockfish binary on the path, **and** a warm `engine` cache entry for the
     start position emits **no** `engine_eval` record and produces artifacts byte-identical to
     a run with no engine present at all; an `engine_eval` record hand-added to that candidate
     fails `EVIDENCE_KIND_UNEXPECTED`. With `--engine-eval`, exactly one such record and its
     `engine` manifest entry appear, and the `emissionJobDigest` differs from the unflagged
     run's — so the flag is visible in the recorded job rather than inferred from the output.
26. `lichess-puzzle-db` → `origin.kind: "http"` with a `headers-only` cache entry,
    `basis: "spdx"`, `spdx: "CC0-1.0"`, and **no** `attributionRequired` or `shareAlike` key —
    both are derived from the identifier (B6a §1.2) and a stored copy fails
    `LICENCE_FIELD_INVALID`. `provenance.sources[]` is exactly one string containing the CC0
    statement, the dump URL and the `etag`; `provenance.licence` is `"CC-BY-SA-4.0"` and
    `provenance.attribution` is absent; `puzzleId` (case preserved) and `gameUrl` appear in
    `evidence.json` and in no served field.
26a. **Every record and abstention links to a manifest entry** (B6a §1.2a): each
     `puzzle_provenance` and `position_legality` record carries `sourceId: "lichess-puzzle-db"`
     and the `retrievedAt` of the `headers-only` entry, byte-equal; altering either fails
     `EVIDENCE_SOURCE_UNLINKED` or `EVIDENCE_RETRIEVED_AT_MISMATCH`; and a candidate whose
     manifest carries an entry no record references fails `MANIFEST_ENTRY_UNUSED`.
27. **Determinism.** Two `--offline` runs against the committed row fixtures produce
    byte-identical `pack.json`, `evidence.json` and `sources.json` (B6a §1.4).
28. **No candidate is promotable** — `reviewStatus: "reviewed"` without a reviewer fails
    `GRADUATION_REQUIRES_REVIEWERS` (`pack-validation.ts:92-99`).
29. `make verify` green; `docs/content-sourcing.md` gains the position-seeds section stating
    the complete-line rule, the omitted `start.movesSan`, §3's grading honesty, and §3a's D11
    block. The `design/research/theory-sourcing.md` coverage-matrix update — the puzzle CSV's
    eleventh column, the 2026-08-12 re-verification, and the now-verified `opening`/
    `middlegame`/`endgame` theme keys — is **proposed** as a `design/BACKLOG.md` row quoting
    the exact replacement text. The implementer does not edit `design/`
    (`AGENTS.md:64-68`).

## Open questions

None.

## Changelog

- 2026-08-12: status → implementing; the accepted complete-line consequence pipeline,
  private solution sidecar, streamed dump reader, and spine-less candidate emitter landed.
  The verbatim `000Pw` fixture remains a transformation test but is excluded from production
  emission because its real `NbPlays` is 629 and §4 requires at least 1000.
- 2026-08-12: created, as B6d of the four-way split of the withdrawn
  `content-sourcing-pipelines.md` draft. **Redesigned rather than rehomed**: the withdrawn
  §5 started the session after `Moves[0]` and put `Moves[1..]` on the spine, which asks the
  learner to solve the tactic and contradicts `design/00-thesis.md:70,93-94`.
- 2026-08-12: revised against the per-file review. (1) **The solution line is no longer in the
  pack.** `start.movesSan` carried the whole puzzle solution and `projectPackDocument` ships
  `start` whole to the browser before play (`pack-registry.ts:59`), so the field is now
  omitted and the line lives in `evidence.json` as `solutionUci`/`solutionSan`, replayable by
  `sourcing-check` against `start.fen` so nothing is lost to review. The `GameUrl` moved out
  of `provenance` for the same reason; the `PuzzleId` pointer in `id`/`title` stays, with the
  trade stated. (2) The cache-retention contradiction is resolved in favour of "streamed and
  discarded": the dump is a `headers-only` cache entry (B6a §1.4) with no body on disk, and
  the consequences — re-download on `etag` change, fixtures as the only offline path — are
  spelled out. (3) "A tactic has just concluded in their favour" is withdrawn: a puzzle
  solution ends in mate (excluded), material, a save, or a draw, and nothing in the CSV says
  which, so no emitted field claims it and a new `graduationBlockers` entry says so. (4)
  Coordinates re-taken after F2/F3 (`rest.ts`, `service.ts`, `runtime.ts`, `types.ts`,
  `session-controller.ts`), and `feedbackIsRevealed` corrected to `feedbackDisclosed`.
- 2026-08-12: revised against the second review. (1) **New §3a: B6d blocks on D11.** A
  consequence run that mates or stalemates before ply 8 never fires its only checkpoint, so
  `feedbackDisclosed` stays false forever and the learner who converted the tactic is shown
  less than one who shuffled; all four workarounds are closed by shipped code (B6a §1.5), so
  the dependency is a block with a named fix, expressed as §Acceptance 19a, and §Acceptance 19
  now asserts its scripted lines are non-terminal so it cannot rest on a line that happened to
  survive. (2) **The `etag` no-op is corrected** (§4): the previous rule short-circuited on the
  dump `etag` alone, so a second run asking for different themes, a larger `--count`, or a
  different band emitted nothing; a no-op now requires unchanged `etag` **and** an identical
  `emissionJobDigest` (B6a §1.4) **and** complete, checking outputs, with the three failing
  cases enumerated in §Acceptance 25. (3) **Engine evaluation is behind `--engine-eval`**
  (§4): ambient B6b or Stockfish availability must not change deterministic output, the flag
  enters the job digest, and an unflagged candidate carrying an `engine_eval` record now
  fails. (4) The `opening`/`middlegame`/`endgame` theme keys were marked unverified `[M]`;
  **all three are present** in `puzzleTheme.xml`, read live, and §2.2 now says so `[V]`.
  (5) The licence entry drops the derived obligation booleans (B6a §1.2), declares its
  `origin`, and §Acceptance 26a adds the source-linkage assertions. (6) §Acceptance 29 no
  longer assigns a `design/research/` edit to the implementer (`AGENTS.md:64-68`).
