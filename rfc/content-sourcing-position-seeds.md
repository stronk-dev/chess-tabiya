# RFC: Position seeds from the Lichess puzzle database — the consequence, not the tactic

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/04-content-architecture.md` §6 (on-ramp layer: "one-move-consequence packs from the CC0 puzzle DB re-cut as *play-the-consequence* rather than find-the-tactic"), §8 order item 4; `design/00-thesis.md:70,93-94` (explicitly not a tactics puzzle trainer), `:82-95` (target band)
- **Exploration gate:** breadth sequencing ruling 2026-08-11 (`design/04-content-architecture.md` header); owner ruling 2026-08-12 opening the RFC tier (`rfc/README.md`)
- **Depends on:** **`rfc/content-sourcing-foundation.md` (B6a)** — manifest, evidence sidecar, deterministic-output rule, `sourcing-check`, record vocabulary. Also `rfc/archive/drill-pack-format.md` and `rfc/archive/engine-workers.md` (both implemented). Optionally strengthened by B6b (`rfc/content-sourcing-syzygy.md`) once its `engine_eval` producer exists
- **Parent / amends:** — (B6d; fourth of four RFCs split out of the withdrawn `content-sourcing-pipelines.md` draft, 2026-08-12. **This is a redesign, not a rehome**: the withdrawn draft's §5 contradicted `design/00-thesis.md` and is not carried forward)
- **Supersedes / superseded by:** —
- **Planning:** `planning/content-sourcing-position-seeds/` (once implementing)

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
learner ever plays — it is *already in the start FEN*. What the learner gets is the
aftermath: an advantage that someone else's tactic created, an opponent at their own rating
who is not obliged to co-operate, and the question the product actually exists to ask, which
is what you do next.

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
| `immediate_blunder_guard` feedback | Defect **D8** (`design/BACKLOG.md:105`). §Deviations 1 records the substitution |

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
| `id` | `` `onramp-${PuzzleId.toLowerCase()}` ``, with `-2`/`-3` suffixes on case-fold collision in ascending original-id order | `PuzzleId` is mixed-case (`000Pw`) and the pack `id` pattern is `^[a-z0-9][a-z0-9-]*$` (`schemas/drill_pack.schema.json:78-81`). Case folding is lossy, so the original is preserved verbatim in `provenance.sources` |
| `version` | `"0.1.0"` | `schema:82-84` |
| `title` | `` `Play on from Lichess puzzle ${PuzzleId}` ``, `PuzzleId` case-preserved | `nonEmptyString`, root-required. Carries no chess claim and requires no judgement about which theme is "primary" |
| `mode` | `"outcome"` | `schema:23`, root-required (`schema:7-18`). **The withdrawn draft omitted `mode` entirely and would not have validated.** Not `"line"`: there is no line |
| `phase` | see §2.2 | `schema:24-26`, optional |
| `start.fen` | `FEN` with **all** of `Moves[0..n-1]` applied | **the redesign.** The complete solution is setup; this is the position the tactic produced |
| `start.movesSan` | the full SAN sequence of `Moves[0..n-1]` | `schema:113-116`. Honest: it says how this position was reached, and it is already history by the time play starts |
| `start.side` | **the solver's colour**, i.e. the opposite of the `FEN` side to move | `schema:117`. `start.side` is the *learner's* colour, not the FEN's side to move (B6a §0, `apps/web/src/lib/session-controller.ts:345`). Since the side to move after the full line is the non-solver (§1), the **opponent moves first**: the defender answers the tactic, then the learner plays on |
| `spine` | **absent** | the CSV supplies no continuation. `spine` is optional at the root (`schema:7-18` omits it from `required`) and `minItems: 1` only when present (`schema:39-43`) |
| `objective.type` | `"play_until_checkpoint"` | the only condition-free honest type; `win`/`execute_break` need an `outcome.reached` producer, which does not exist (B6a §0) |
| `objective.summary` | `` `Play on from this position for ${C} plies against an opponent near your rating.` `` | mechanical instruction, zero chess claims. Recorded as a placeholder in `graduationBlockers` (B6a §4) |
| `objective.successConditions` | `[{ "kind": "reach_checkpoint", "checkpointId": "consequence" }]` | the only executable condition (`apps/server/src/pack-validation.ts:159-178`) |
| `checkpoints` | exactly one: `{ "id": "consequence", "label": "Consequence", "trigger": { "atPly": C }, "actions": [] }`, `C` even, default 8 | see §2.1 |
| `opponentPolicy` | `{ "mode": "human_common", "targetElo": <§2.3>, "seedMode": "per_branch" }` | `apps/server/src/capabilities.ts:10-14`. `human_common` is what makes it a consequence rather than a solution check: Maia does **not** have to play the defence the source game played. **Never `theory_strict`** — with no spine it silently degrades to `human_common` (`apps/server/src/opponent-selector.ts:454-457`) and the pack would misdescribe its own opponent |
| `feedbackPolicy` | `"delayed_checkpoint"` | §Deviations 1 records the deviation from the declared on-ramp knob |
| `difficulty` | `{ "minOnlineRapid": max(1000, Rating-150), "maxOnlineRapid": max(1000, Rating+150), "branchLengthTarget": C }` | **both** bounds carry `minimum: 1000` (`schema:97-98`), not just the lower one — the withdrawn draft clamped only `minOnlineRapid`. `branchLengthTarget` accepts 2–20 (`schema:100-104`) and `C = 8` is the top of the declared on-ramp branch band (`design/00-thesis.md:88-89`) |
| `deviations`, `planClasses`, `feedbackClaims`, `concepts`, `annotations`, `authoredBoundary` | **absent** | every one of them is a judgement |
| `provenance` | `reviewStatus: "draft"`, `reviewers: []`, the CC0 source strings (§5), `graduationBlockers` | `schema:458-475`. No `licence`, no `attribution` — no prose is borrowed |

**2.1 The checkpoint, and why `atPly`.** The root is `ply: 0`
(`packages/runtime/src/runtime.ts:142`) and every move is `+1` (`:258`).
`orchestratePackMove` runs after learner moves *and* opponent plies
(`apps/server/src/service.ts:195,214`), and `atPly` compares `node.ply` directly
(`apps/server/src/pack-orchestrator.ts:45`), so it always fires.

`atSpineNode` is not merely a worse choice here — it is **structurally impossible**. With no
spine, `activeSpineNodeId` walks `pack.spine ?? []` and returns `undefined` at the first move
(`pack-orchestrator.ts:21-37,28`), so an `atSpineNode` checkpoint can never fire and the
drill would silently never end. A pack whose only checkpoint never fires also never reveals
withheld engine evidence, because `feedbackIsRevealed` requires a `checkpoint.reached` event
under `delayed_checkpoint` (`apps/server/src/feedback-policy.ts:12-14`).

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
omitted when two or more appear. The key vocabulary is
`raw.githubusercontent.com/lichess-org/lila/master/translation/source/puzzleTheme.xml`
(`design/research/theory-sourcing.md:108-112`, `[V]` for the file). Whether those three
specific keys are in it is **not verified here** `[M]`, so the emitter treats their absence
as normal: no matching key simply means no `phase`, never an error and never a guess.

**2.3 `targetElo`.** `Rating` clamped to `[1100, 2000]`. This clamp is an **authoring
convention, not a capability claim**: `schema:363` types `targetElo` as a bare integer,
`apps/server/src/opponent-selector.ts` requires only a safe integer, and the packaged Maia
worker advertises an `Elo` option with no documented range
(`workers/maia/README.md:42-44`). The bounds are taken from the served band
(`design/00-thesis.md:78-95`, 1000 → 2000+) and are recorded in `graduationBlockers` as an
authoring decision, not asserted as an engine limit.

### 3. What the learner faces, and how it is graded without an authored spine

This is the part a spine-less pack has to answer honestly.

**What they face.** A position in which a tactic has just concluded in their favour, with the
defender to move. They are told nothing about the tactic; it is history in
`start.movesSan`. They play four moves against Maia at their own band, which is under no
obligation to play the source game's defence — `human_common` samples from the model's policy
(`opponent-selector.ts` `#humanCommon`), it does not replay a script. Then the checkpoint
fires, evidence is released, and they can rewind, branch, and compare, which is the product's
core loop and needs no authored content to work.

**What is graded, exactly.** One thing: `reach_checkpoint`. The only executable success
condition in the system is `reach_checkpoint` for a checkpoint in the same pack
(`pack-validation.ts:159-178`, `pack-orchestrator.ts:88-100`), and `outcome.reached` has no
producer (B6a §0). So the objective transitions `active → achieved` on **surviving eight
plies**, and nothing else. That is the entire machine verdict, and this RFC states it in the
pack: every candidate carries the `graduationBlockers` entry

> `The objective transitions on reaching the checkpoint, i.e. on playing the position out. No shipped mechanism grades whether the advantage was converted; adding one is an authored act.`

Calling that a grade would be dishonest, so it is not called one anywhere in the emitted
document — `objective.summary` says "play on for 8 plies", which is exactly what is measured.

**What the learner nonetheless gets that is real, and where it comes from.**

1. **The consequence itself.** Watching a live opponent answer, and being wrong about how
   they would, is the training signal the product is built on. It requires no authored
   content and no grading.
2. **Shipped engine evidence, released at the checkpoint.** The evidence queue attaches
   `eval`/`wdl`/`bestline` payloads with `source: "engine_validated"`
   (`apps/server/src/evidence-queue.ts:324,339,360`), withheld until reveal by
   `publicNodes`/`publicEvents` (`apps/server/src/feedback-policy.ts:21,48`). That is not this
   RFC's code and this RFC changes none of it; it is why a spine-less pack is still worth
   playing.
3. **Rewind and compare.** `POST /runs/:id/rewind`, `/fork`, `/compare`
   (`apps/server/src/rest.ts:492,510,531`) are pack-independent.

**What is not available, stated as a blocker rather than hidden.** Nobody can say whether the
plan was right, whether the conversion technique was sound, or which of two branches was
better *as chess*. Those are `feedbackClaims`, `planClasses` and `deviations` — B6a §3.3's
permanently-human fields — and every candidate's `graduationBlockers` lists them as unwritten.
An author who wants them writes them; the pipeline never will.

**One accepted disclosure.** `provenance` is projected to the browser verbatim before play
(`apps/server/src/pack-registry.ts:58`), so the `GameUrl` is visible from the start. A
determined learner can open the source game and see what the original players did next. This
is accepted rather than mitigated: the attribution and position provenance are obligations
(§5) and a self-inflicted spoiler of a *different game's* continuation is not the same as the
pack leaking its own answer — there is no answer to leak, because there is no spine.

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
   that `start.movesSan` remains auditable by a reviewer.
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

**Scale.** The dump is 304 MB zstd (§1). The pipeline streams it row-at-a-time through
`node:zlib`'s `createZstdDecompress` and never materializes it;
`node -e "require('node:zlib').createZstdDecompress"` resolves on the interpreter in this
checkout (v26.7.0, 2026-08-12) and the repo pins `engines.node >= 24`
(`package.json:24-25`), but the emitter **asserts the export exists at startup** and exits
with a named error rather than assuming it. The dump is keyed by `etag`
(`"6a6ef08b-12248997"` on 2026-08-12) so a re-run without a new dump is a no-op. Committed CI
fixtures are a handful of rows, never the dump; nothing from the dump is retained on disk
beyond the cache entry and the selected rows.

**What B6d writes into `evidence.json`.** One `puzzle_provenance` record per candidate,
`grounds: "citable_source"`, `values` carrying `{ puzzleId, gameUrl, rating,
ratingDeviation, popularity, nbPlays, themes, solutionPlies }`, supporting only `/start/fen`
and `/start/movesSan`. One `position_legality` record for the start position,
`grounds: "machine_validation"`. **No `templateId`, therefore no prose support** — B6a §3.3's
table has no row for `puzzle_provenance`, so any attempt fails `EVIDENCE_OVERREACH`. If B6b
has landed, the emitter may additionally write one `engine_eval` record for the start position
under B6b §3.3's authoring-profile rules; it is optional and B6d does not depend on it.

### 5. Licence

CC0-1.0, quoted at `design/research/theory-sourcing.md:104-106` from `database.lichess.org`:
"Database exports are released under the Creative Commons CC0 license. Use them for research,
commercial purpose, publication, anything you like." Encoded per B6a §1.2 with
`attributionRequired: false`.

Two `provenance.sources[]` strings per candidate: the CC0 statement with the dump URL and
`etag`, and a position-provenance string carrying the original `PuzzleId` **case-preserved**
and the `GameUrl`. The game link is provenance for the position, costs nothing to keep, and
is the reason §3's accepted disclosure is stated rather than avoided.

No `provenance.licence` and no `provenance.attribution`: CC0 imposes no attribution
obligation and no prose is borrowed. The Lichess theme *keys* that appear in
`evidence.json` are API vocabulary, not text.

## Deviations from design

1. **The on-ramp's declared feedback knob cannot be encoded.** `design/00-thesis.md:88-90`
   and `design/04-content-architecture.md` §6 specify `immediate_blunder_guard` for the
   1000–1400 layer; `apps/server/src/pack-validation.ts:103-111` rejects it in v1 while
   `schemas/drill_pack.schema.json:54` accepts it — defect **D8**
   (`design/BACKLOG.md:105`). B6d emits `delayed_checkpoint` and records the substitution in
   `graduationBlockers`. Making the on-ramp policy real is program item #2/#4 work, not a
   sourcing change, and B6d's candidates become correct by **re-emission** when it lands —
   nothing needs hand editing.
2. **`design/04` §6 says "one-move-consequence packs"; these carry the *whole* solution as
   setup.** A one-move setup would leave the learner inside the tactic. The design intent
   ("play-the-consequence rather than find-the-tactic") is preserved exactly; the ply count of
   the setup is not.
3. **Emitted packs are spine-less**, where `design/04` §2d's pack-contents template and the
   drill-pack format both centre on a spine. No source supplies a continuation. The runtime
   supports it — `spine` is optional at the root, `lintDrillPack` handles `pack.spine ?? []`
   (`packages/schema/src/drill-pack/lint.ts:228`), `projectPackDocument` emits `spine: []`
   (`apps/server/src/pack-registry.ts:66`), and the client's `timelineEntries` reads
   `pack?.spine ?? []` (`apps/web/src/lib/screen-model.ts:96`) — but no shipped pack exercises
   it, so the acceptance criteria prove it end to end rather than assuming it.
4. **Doctrine deviation: the puzzle-dump scan is TypeScript, not a Go worker.**
   `AGENTS.md` doctrine assigns self-contained data-format workers to Go.
   `find . -name "go.mod" -not -path "./node_modules/*"` is empty — there is no Go toolchain,
   build, or CI lane in this repo, so a Go worker here is a new lane plus a pipeline. The scan
   also terminates in `chessops` semantics (walking `Moves`, deriving SAN, testing `isEnd()`)
   that exist only in TS, and it shares B6a's cache and manifest code. Revisit trigger: if the
   scan becomes a scheduled or serving component rather than a one-shot authoring command.
5. **The `targetElo` clamp is an authoring convention, not a capability.** Stated in §2.3
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
   checkpoint reference — has `actor: "user"` (`packages/runtime/src/types.ts:3,65`).
4. **No spine is emitted.** `"spine" in pack` is `false` for every candidate — not an empty
   array, absent. `validatePackDocument` passes; `projectPackDocument` returns `spine: []`;
   `GET /packs/:id` contains no solution moves anywhere outside `start.movesSan`.
5. **The solution never reaches the learner as a playable rail.** A test asserts no
   `Moves[i]` for `i ≥ 0` appears in `pack.spine`, `pack.deviations`, or any checkpoint
   trigger, and that `authoredFeedback` for a completed run contains none of them.
6. **`mode` is present.** Every candidate declares `mode: "outcome"`; a candidate with `mode`
   removed fails `validatePackDocument` at `/` with a `required` error — the withdrawn
   draft's omission under regression.

**Boundary conditions of shapes the schema permits** — the failure class that killed five
drafts:

7. **A mating puzzle is refused.** A fixture row whose complete line ends in checkmate is
   rejected by §4.7 with a named error and emits no candidate. The same assertion is made
   twice: once for a row carrying a `mateIn2` theme, and once for a hand-constructed row that
   mates with **no** mate theme in `Themes` — proving the positional check, not the theme
   pre-filter, is the guard. A stalemate row is refused the same way.
8. **`atSpineNode` cannot fire on a spine-less pack.** A pack identical to an emitted
   candidate except for an `atSpineNode` trigger is played for 12 plies and asserted **never**
   to emit `checkpoint.reached`; the emitted `atPly` candidate fires at ply 8 in the same
   scenario. Consequently the `atSpineNode` variant never reveals engine evidence
   (`feedback-policy.ts:12-14`), asserted directly.
9. **`theory_strict` is never emitted, and would lie if it were.** A test asserts every
   candidate declares `human_common`; a companion test sets `theory_strict` on a spine-less
   pack, runs one selection, and asserts it takes the `#humanCommon` path
   (`opponent-selector.ts:454-457`).
10. **Both rating bounds are clamped.** A puzzle with `Rating: 1050` emits
    `minOnlineRapid: 1000` (not 900) **and** `maxOnlineRapid: 1200`; a hand-constructed row
    with `Rating: 1000` emits `maxOnlineRapid: 1150`, and a row with `Rating: 900` is rejected
    by §4.1 rather than emitting `maxOnlineRapid: 1050`. Both fields carry `minimum: 1000`
    (`schema:97-98`).
11. **`C` is even and inside the `branchLengthTarget` range.** `C = 8` by default; `--plies 7`
    and `--plies 22` are each refused with a named error rather than silently adjusted.
12. **PuzzleId case-fold collision.** Two fixture rows differing only in case emit ids
    `onramp-<x>` and `onramp-<x>-2`, deterministically by ascending original id, with both
    originals preserved case-exact in `provenance.sources`.
13. **Odd `Moves.length` is a parse error.** A hand-corrupted fixture row with five moves
    fails with a named error naming the §1 invariant, not a filter skip.
14. **`phase` is emitted only on an exact single match**, and its absence is never an error —
    asserted on a row with no phase theme, one with `endgame`, and one hand-constructed with
    both `middlegame` and `endgame`.
15. **No emitter writes a key the schema forbids** — B6a §Acceptance 11's property test
    extended to this pipeline, asserting in particular that `start` and `difficulty` carry no
    extra keys.

**Grading honesty:**

16. **The objective transitions on the checkpoint and on nothing else.** A run that plays
    eight plies badly (a scripted losing sequence) reaches `achieved` exactly as one that
    plays well does, and the test asserts both — the machine verdict this RFC declines to
    dress up.
17. **The blockers are present verbatim.** Every candidate carries the grading blocker (§3),
    the `objective.summary` placeholder blocker (B6a §4), the `immediate_blunder_guard`
    substitution blocker (§Deviations 1), and the `targetElo` convention blocker (§2.3).
18. **No prose is supported.** A `puzzle_provenance` record whose `supports` targets
    `/objective/summary`, `/checkpoints/0/label`, or `/deviations/0/class` fails
    `EVIDENCE_OVERREACH`; one carrying `templateId: "explorer-move-share/v1"` fails the same
    way (templates are keyed by `kind`, B6a §3.3).
19. **Engine evidence still reveals.** A completed run's `GET /runs/:id/events` withholds
    `evidence.attached` before ply 8 and includes it after, using the shipped withholding
    barrier unmodified.

**Scale, licence, hygiene:**

20. **The dump is streamed, never materialized.** A test runs the emitter against a
    multi-megabyte synthetic `.csv.zst` fixture with a heap ceiling and asserts peak resident
    rows never exceed one; `createZstdDecompress` is asserted present at startup, and its
    absence produces a named error rather than a `TypeError`.
21. **`etag` short-circuit.** A second run with the same `etag` emits nothing and exits 0.
22. `lichess-puzzle-db` → `spdx: "CC0-1.0"`, `attributionRequired: false`;
    `provenance.sources[]` contains the CC0 statement, the original `PuzzleId` verbatim
    (case preserved), and the `GameUrl`; no `provenance.licence` and no
    `provenance.attribution` are written.
23. **Determinism.** Two `--offline` runs against the committed fixtures produce
    byte-identical `pack.json`, `evidence.json` and `sources.json` (B6a §1.4).
24. **No candidate is promotable** — `reviewStatus: "reviewed"` without a reviewer fails
    `GRADUATION_REQUIRES_REVIEWERS` (`pack-validation.ts:91-100`).
25. `make verify` green; `docs/content-sourcing.md` gains the position-seeds section stating
    the complete-line rule and §3's grading honesty;
    `design/research/theory-sourcing.md`'s coverage-matrix row notes the puzzle CSV's eleventh
    column and the 2026-08-12 re-verification.

## Open questions

None.

## Changelog

- 2026-08-12: created, as B6d of the four-way split of the withdrawn
  `content-sourcing-pipelines.md` draft. **Redesigned rather than rehomed**: the withdrawn
  §5 started the session after `Moves[0]` and put `Moves[1..]` on the spine, which asks the
  learner to solve the tactic and contradicts `design/00-thesis.md:70,93-94`.
