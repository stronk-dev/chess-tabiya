# RFC: Syzygy grounding at ≤7 pieces, and the abstention rule above it

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/04-content-architecture.md` §4 (Syzygy ground truth: "Syzygy where ≤7 pieces; Stockfish + authored claims above that"), §8 (batch-1 endgame pack)
- **Exploration gate:** breadth sequencing ruling 2026-08-11 (`design/04-content-architecture.md` header); owner ruling 2026-08-12 opening the RFC tier (`rfc/README.md`)
- **Depends on:** **`rfc/content-sourcing-foundation.md` (B6a)** — manifest, evidence sidecar, deterministic-output rule, `sourcing-check`, record vocabulary, licence encoding. Also `rfc/archive/drill-pack-format.md` and `rfc/archive/engine-workers.md` (both implemented)
- **Parent / amends:** — (B6b; second of four RFCs split out of the withdrawn `content-sourcing-pipelines.md` draft, 2026-08-12)
- **Supersedes / superseded by:** —
- **Planning:** `planning/content-sourcing-syzygy/` (once implementing)

## Summary

`design/04-content-architecture.md` §4 says "Ground truth: Syzygy where ≤7 pieces;
Stockfish + authored claims above that." This RFC implements that sentence, and its first
real job is the **second half**: to refuse.

`design/04` §8's batch-1 endgame pack is **4v3 rook endings**. Count the board: 2 kings + 2
rooks + 7 pawns = **11 pieces**. The 3v2 reduction is 9. Syzygy covers 7. *This pipeline
grounds nothing at the root of the pack `design/04` names first,* and the same is true of
the only endgame pack that actually exists — `content/drafts/rook-4v3-same-side.json`, whose
start FEN `3r2k1/5pp1/7p/8/4P3/8/5PPP/R5K1 w - - 0 1` carries 11 pieces (6 white, 5 black).

That pack's author already discovered this by hand and wrote it into the content:
`:526` records "NO TABLEBASE GROUND TRUTH EXISTS ANYWHERE IN THIS PACK", and `:486` ships a
`feedbackClaim` telling the learner the same thing. The author also miscounted — both lines
say "ten pieces" where the FEN has eleven. The verdict is unchanged (10 and 11 are both
above 7), but the arithmetic error is exactly what a mechanical census exists to prevent, and
it is the strongest available argument that the range check must be code and not prose.

So this RFC specifies a pipeline that **grounds run terminals, not pack roots**: an 11-piece
rook ending reduces into Syzygy range as pawns trade, and that is where exact truth becomes
available. Above the range, the substitute is the shipped Stockfish judge, labelled
differently, at an authoring profile, and never phrased as a result.

## Motivation

Two things are wrong today and this RFC fixes exactly one of them.

**Wrong and fixed here:** there is no way to check an endgame claim against exact truth, so
authors assert. `content/drafts/rook-4v3-same-side.json:439` argues that accepting a rook
trade is bad "not because the resulting pawn ending is proven lost — it is not proven
anything, no tablebase reaches this material". The honest hedge is correct writing and a
tooling failure: the *reduced* positions the drill produces are frequently within range, and
nothing can query them.

**Wrong and not fixed here:** `design/04` §4 reads, to a fast reader, as though Syzygy grounds
the endgame family. It grounds a strict minority of it. This RFC does not change the design
intent; it makes the boundary explicit, mechanical, and recorded in every candidate.

**Out of scope,** each with a reason:

| Out of scope | Why |
|---|---|
| Everything in B6a §1–§3 | `rfc/content-sourcing-foundation.md`. This RFC adds two record kinds and one emitter; it does not restate the manifest, sidecar, cache, or check |
| Self-hosted Syzygy files | A deployment choice. `design/research/theory-sourcing.md:95-96` leaves the mirror inventory unverified (`syzygy-tables.info` fetch blocked by anti-bot), so this RFC uses the API and does not claim a mirror capability |
| Making `perfect_tablebase` selectable | Defect **D8** (`design/BACKLOG.md:105`). See §5 — this RFC states the dependency rather than fixing the schema/validator divergence inline |
| Making `win`/`hold`/`save` mechanically checkable | Requires an `outcome.reached` producer, which does not exist (B6a §0). Program item #2/#4 work |
| Endgame *position* sourcing (which roots to drill) | B6d supplies positions from the puzzle DB; canonical theoretical positions are authoring work under `planning/content-era/` |

## Specification

### 1. Backend

`https://tablebase.lichess.org/standard?fen=<fen>` — verified anonymous and answering
2026-08-12, returning `{dtz, precise_dtz, dtm, category, moves[]}` (B6a §0 probe table).
Same politeness, caching, and `--offline` rules as everything else (B6a §1.4); `sourceId`
is `syzygy`. A local file mirror is a configuration swap behind the same interface, and is
not part of this RFC's capability claim.

### 2. The range rule, stated before the capability

Count the pieces on the board **from the FEN's placement field**, mechanically, before any
request is made:

- If the count is **≤ 7**, query the backend.
- If the count is **≥ 8**, emit an abstention with `kind: "tablebase_result"`,
  `reason: "out_of_range"`, and `detail: "<n> pieces; Syzygy covers <=7"`. **No request is
  issued.** The pipeline does not guess and does not silently fall through.

The census is a character count over the placement field, not an interpretation: every
alphabetic character is one piece. On `3r2k1/5pp1/7p/8/4P3/8/5PPP/R5K1` this yields 11 (6
white, 5 black), which is the number that belongs in
`content/drafts/rook-4v3-same-side.json` in place of "ten".

This is not an edge case; it is the common case for the content
`design/04-content-architecture.md` §4 lists. The families named there — 4v3 and 3v2
same-side rook endings, rook activity vs material, rook + minor, practical conversion,
up-an-exchange, opposite-coloured bishops with pawns — are almost all above 7 pieces at
their roots. Anyone reading `design/04` §4's "Syzygy where ≤7 pieces" as covering practical rook endings
is reading it wrong, and this pipeline must make that impossible to miss. **The abstention
path is the deliverable**, which is why B6b lands second (B6a §6) rather than after the
pipelines that always have something to say.

### 3. What B6b actually grounds: run terminals, not pack roots

An 11-piece 4v3 rook drill *reduces* into range as pawns trade — that is what the drill is
about. So:

**3.1 Position grading**, `kind: "tablebase_result"`, `grounds: "machine_validation"`, is
offered for any position with ≤7 pieces: a pack root, a spine node, a position an author
pastes in, or **a terminal position reached in a recorded run**. `values` carries
`{ fen, pieceCount, category, dtz, precise_dtz, dtm }`, each field copied verbatim from the
response except `fen` and `pieceCount`, which are the query. `dtm` is `null` in the response
for many positions and is copied as `null`, never omitted and never inferred.

**3.2 Out of range, the only substitute is the shipped Stockfish judge, and it is labelled
differently.** `kind: "engine_eval"`, `grounds: "machine_validation"`, `values` carrying
`centipawns` or `mateIn` plus `depth` exactly as `apps/server/src/evidence-queue.ts:324-331`
produces them, plus the profile fields from §3.3. It is **never** written as
`tablebase_result`, and a claim it supports may never be phrased as an exact result. The
distinction is enforced, not conventional: `sourcing-check` fails
`EVIDENCE_KIND_MISMATCH` if a `tablebase_result` record's `values.pieceCount` is ≥ 8, and
fails it symmetrically if an `engine_eval` record is anchored to a ≤7-piece position for
which a `tablebase_result` exists in the same file.

**3.3 The authoring engine profile is not the runtime profile.**
`apps/server/src/strong-engine.ts:10-15` ships `movetimeMs: 100, threads: 1, hashMb: 16,
multiPv: 1` — adequate for in-run evidence, not for validating an authored endgame claim.
The pipeline calls `resolveStrongEngineProfile` (`strong-engine.ts:23-31`) with an explicit
authoring override and records `movetimeMs`, `depth`, `threads`, `hashMb` and `multiPv` in
the record's `values`. An unqualified "the engine says" is exactly the dashboard ADR-0005
and AGENTS.md law 8 forbid; the profile is what makes the sentence checkable.

Default authoring override, pinned so re-emission is reproducible:
`{ movetimeMs: 10000, threads: 1, hashMb: 256, multiPv: 3 }`. `threads: 1` is not a
performance choice — multi-threaded Stockfish is nondeterministic across runs, and B6a §1.4
requires byte-identical re-emission. Overriding the profile changes the `values`, therefore
changes `evidence.json`, therefore is visible in review.

**3.4 No record from this RFC may support prose.** B6a §3.3 ships the prose-template table
empty and B6b registers no template. `tablebase_result` and `engine_eval` records support
only structural pointers (`/start/fen`, `/spine/**/moveUci`, `/checkpoints/*/trigger`), never
`/objective/summary`, `/spine/**/annotations/*`, `/feedbackClaims/*/text`,
`/deviations/*/note`, and never `/deviations/*/class`. A tablebase result is a fact about a
position; "therefore take the rook ending" is a claim about a plan, and no `dtz` implies it.

### 4. What an endgame candidate looks like

B6b emits candidates from an author-supplied position list (FEN per line, with an optional
label), not from a corpus: `make candidate-emit PIPELINE=syzygy ARGS='--positions
<file> --learner-side black'`. Positions come from authors today and from B6d later.

| Pack field | Value | Legality |
|---|---|---|
| `id` | `` `endgame-${slug(label)}` `` with `-2`/`-3` on collision in ascending input order | `schema:78-81` |
| `version` | `"0.1.0"` | `schema:82-84` |
| `title` | the supplied label, or `` `Endgame: ${material signature}` `` (e.g. `Endgame: KRPPP vs KRPP`) computed from the FEN | `nonEmptyString` |
| `mode` | `"outcome"` | `schema:23`; root-required. Not `"line"` — there is no line |
| `phase` | `"endgame"` | `schema:24-26` |
| `start.fen` | the supplied FEN | `lint.ts:218` |
| `start.side` | `--learner-side`, **required, no default** | schema-optional (`schema:117`), client-required (`apps/web/src/lib/screen-model.ts:54-59`); B6a §0 |
| `spine` | **omitted** | no source supplies a continuation; inventing one is a chess claim |
| `objective.type` | `"play_until_checkpoint"` | see §5 |
| `objective.summary` | `` `Play this endgame out for ${C} plies from this position.` `` | B6a §4's placeholder discipline; `graduationBlockers` records it |
| `objective.successConditions` | `[{ "kind": "reach_checkpoint", "checkpointId": "endgame-played-out" }]` | only executable condition (`pack-validation.ts:159-178`) |
| `checkpoints` | exactly one: `{ "id": "endgame-played-out", "trigger": { "atPly": C }, "actions": [] }`, `C` = 16 adjusted to learner parity (§4.1) | `minItems: 1` (`schema:44-48`); `atPly` fires regardless of spine (`pack-orchestrator.ts:45`) |
| `opponentPolicy` | `{ "mode": "strong_engine" }` or `{ "mode": "human_common", "targetElo": …, "seedMode": "per_branch" }`, chosen by `--opponent`, **required** | `capabilities.ts:10-14`. **Never `theory_strict`**: with no spine it silently degrades to `human_common` (`opponent-selector.ts:454-457`) and the pack would misdescribe itself |
| `feedbackPolicy` | `"delayed_checkpoint"` | `pack-validation.ts:103-122` |
| `difficulty` | `{ "branchLengthTarget": C }` when `C ≤ 20`, else omitted | `schema:100-104` bounds it to 2–20 |
| `provenance` | `reviewStatus: "draft"`, `reviewers: []`, the `unlicensed-data` source string (§6), `graduationBlockers` | `schema:458-475` |

`--opponent` is required and has no default because the choice is pedagogical: `strong_engine`
drills convert/hold under best defence, `human_common` drills practical resistance, and
`design/04` §4's "convert / hold / save variants" does not say which. The choice is recorded
in `graduationBlockers` as an open authoring decision.

**4.1 Checkpoint parity.** The root is `ply: 0` (`packages/runtime/src/runtime.ts:142`) and
each move is `+1` (`:258`). The opponent moves whenever the board's turn colour is not
`start.side` (`apps/web/src/lib/session-controller.ts:345`). Therefore:

- FEN side to move **equals** `start.side` ⇒ the learner moves first ⇒ **learner plies are
  odd**.
- FEN side to move **differs from** `start.side` ⇒ the opponent moves first ⇒ **learner plies
  are even**.

The emitter computes this from the FEN and `--learner-side` and adjusts `C` by one so the
checkpoint always fires on a **learner** ply. This matters because `feedbackIsRevealed`
(`apps/server/src/feedback-policy.ts:12-14`) unlocks withheld engine evidence on
`checkpoint.reached`, and revealing it in the middle of the opponent's turn is a worse moment
than after the learner's own move.

**Deliberately absent:** no `annotations`, no `planClasses`, no `deviations`, no
`feedbackClaims`, no `concepts`, no `authoredBoundary`. Every one is a judgment.

### 5. What B6b cannot do, and its dependency on D8

**It cannot select `opponentPolicy.mode: "perfect_tablebase"`.** That value is in the schema
(`schemas/drill_pack.schema.json:361`) and **not** in `SUPPORTED_POLICY_MODES`
(`apps/server/src/capabilities.ts:10-14`), so `pack-validation.ts:125-138` rejects it with
`UNSUPPORTED_OPPONENT_POLICY`. This is defect **D8** (`design/BACKLOG.md:105`), which
also covers `immediate_blunder_guard`.

**B6b needs `perfect_tablebase` to exist**, and states the dependency rather than working
around it. A tablebase-perfect opponent is the only opponent that makes an exact `dtz` claim
operational: with `strong_engine` the learner can hold a theoretically lost position by
outplaying a 100 ms search, and the pack's ground truth then describes a game nobody played.

Concretely:

- **B6b ships without it.** Emitted candidates use `strong_engine` or `human_common` (§4).
  `tablebase_result` records still ground the *position*; they do not ground the *defence*.
- **Every candidate whose start position is ≤7 pieces carries the `graduationBlockers`
  entry**: `` `Exact tablebase grading is available for this root but perfect_tablebase is not
  selectable (defect D8); the opponent is <mode> and can deviate from best play` ``.
- **When D8 is fixed** — by adding `perfect_tablebase` to `SUPPORTED_POLICY_MODES` with a
  selector implementation, or by removing it from the schema — B6b's emitter gains a
  `--opponent perfect_tablebase` value for ≤7-piece roots only, and the blocker entry is no
  longer written. Re-emission is the migration; nothing needs hand editing.
- **If D8 is resolved by deleting the value from the schema**, this section becomes moot and
  the blocker text changes to name the ruling. Either resolution is fine; silence is not.

**It cannot make `objective.type: "win"`/`"hold"`/`"save"` mechanically checkable.** Those
values validate (`schemas/drill_pack.schema.json:122-131`) but the only executable success
condition is `reach_checkpoint` (`pack-validation.ts:159-178`) and `outcome.reached` has no
producer (B6a §0). Emitted candidates therefore use `play_until_checkpoint`, and upgrading
the objective is an authored act — the same shape as
`content/drafts/rook-4v3-same-side.json`, which declares `objective.type: "hold"` and then
reaches it through a `materialBalance` checkpoint plus a `reach_checkpoint` condition, by
hand.

### 6. Licence

Syzygy *files* are copyright-free. `design/research/theory-sourcing.md:87-91` quotes the
generator README: "All tablebase files generated using this generator may be freely
redistributed. In fact, those files are free of copyright at least under US law (following
Feist...) and under EU law (following Football Dataco...)." The generator's GPL-2.0 binds the
code, not the data. The Lichess tablebase API is a transport, not a rightsholder.

Encoded per B6a §1.2 as `spdx: "unlicensed-data"` with `rationale` set to that Feist /
Football Dataco text, carried verbatim into one `provenance.sources[]` string. No
`provenance.licence` and no `provenance.attribution` — no prose is borrowed.

## Deviations from design

1. **`design/04-content-architecture.md` §4 reads as though Syzygy grounds the endgame
   family; it grounds ≤7 pieces only,** which excludes the batch-1 4v3 rook pack (§Summary)
   and most of `design/04` §4's listed families. This RFC does not change the design intent; it makes the
   boundary explicit and mechanical, and writes the refusal into every candidate.
2. **The endgame opponent is not the one the content architecture implies.** "Convert / hold
   / save variants" presumes an opponent that plays the defence correctly; the selectable
   modes are `strong_engine` at a 100 ms default and `human_common`. B6b requires the choice
   to be made explicitly and records it as a graduation blocker rather than letting a default
   decide.
3. **Emitted endgame candidates are spine-less and `mode: "outcome"`,** where
   `design/04` §2d's pack-contents template is written for line-shaped packs. There is no
   source of endgame continuations, so a spine would be invented.

## Acceptance criteria

**The abstention is the primary proof:**

1. **`design/04`'s own batch-1 root abstains.** `make candidate-emit PIPELINE=syzygy` on
   `3r2k1/5pp1/7p/8/4P3/8/5PPP/R5K1 w - - 0 1` (the FEN
   `content/drafts/rook-4v3-same-side.json` actually ships) writes an abstention with
   `reason: "out_of_range"` and `detail: "11 pieces; Syzygy covers <=7"`. **No
   `tablebase_result` record exists for it anywhere in the file, and no HTTP request is
   issued** — asserted with the network layer stubbed to throw on any call.
2. **The census is exact at the boundary.** An 8-piece position abstains; a 7-piece position
   queries. Both assertions run with the network stubbed, so the 8-piece case is proven by
   the absence of a request, not by the response.
3. **The census matches a chessops piece count.** A property test over 200 committed FENs
   asserts the placement-field character count equals
   `Chess.fromSetup(parseFen(fen).unwrap()).unwrap().board.occupied.size()`.

**Grounding:**

4. **In-range grading is real.** A ≤7-piece position yields a `tablebase_result` whose
   `category` and `dtz` match a committed `tablebase.lichess.org` response fixture, with
   `dtm: null` preserved as `null` where the fixture has it.
5. **Kind separation is enforced.** A `tablebase_result` record with `values.pieceCount: 11`
   fails `sourcing-check` with `EVIDENCE_KIND_MISMATCH`; an `engine_eval` record anchored to
   a ≤7-piece position that also has a `tablebase_result` in the same file fails the same
   way.
6. **The authoring profile is recorded.** Every `engine_eval` record carries `movetimeMs`,
   `depth`, `threads`, `hashMb` and `multiPv`; a record missing any of them fails
   `EVIDENCE_VALUES_INVALID`. A test asserts the emitter calls
   `resolveStrongEngineProfile` with an override and never uses
   `DEFAULT_STRONG_ENGINE_PROFILE` unmodified.
7. **No record from this RFC supports prose.** Records whose `supports` target
   `/spine/0/annotations/0`, `/feedbackClaims/0/text`, `/objective/summary`, or
   `/deviations/0/class` each fail `EVIDENCE_OVERREACH` — asserted for both `kind`s.

**Boundary conditions of shapes the schema permits:**

8. **`perfect_tablebase` refusal.** An endgame candidate hand-edited to that mode fails
   `validatePackDocument` with `UNSUPPORTED_OPPONENT_POLICY` at `/opponentPolicy/mode`; the
   shipped emitter never produces it; and every ≤7-piece candidate carries the D8
   `graduationBlockers` entry verbatim.
9. **`theory_strict` is never emitted.** A test asserts no B6b candidate declares it, and a
   companion test constructs a spine-less pack with `theory_strict`, runs one selection, and
   asserts it takes the `#humanCommon` path (`opponent-selector.ts:454-457`) — the silent
   degradation this emitter must not create.
10. **A spine-less candidate is valid and playable.** A B6b candidate passes
    `validatePackDocument`; `projectPackDocument` returns `spine: []`
    (`apps/server/src/pack-registry.ts:66`); the client's `timelineEntries`
    (`apps/web/src/lib/screen-model.ts:96`) renders it without throwing; and one full run
    reaches `endgame-played-out`.
11. **Checkpoint parity (§4.1).** For a FEN with White to move and `--learner-side white` the
    emitted `atPly` is **odd**; with `--learner-side black` it is **even**. In both cases a
    played run fires `checkpoint.reached` on a node whose `actor` is `"user"`
    (`packages/runtime/src/types.ts:3,65`).
12. **`branchLengthTarget` is omitted, not clamped, when `C > 20`.** `schema:100-104` bounds
    it to 2–20; a candidate with `C = 24` emits no `difficulty.branchLengthTarget` and still
    validates.
13. **No emitter writes a key the schema forbids** — the B6a §Acceptance 11 property test is
    extended to this pipeline.

**Licence and hygiene:**

14. `syzygy` → `spdx: "unlicensed-data"` with the Feist / Football-Dataco rationale text
    present in `sources.json` and verbatim in `provenance.sources[]`; no `provenance.licence`
    and no `provenance.attribution` are written.
15. **Determinism.** Two `--offline` runs against the committed tablebase fixtures produce
    byte-identical `pack.json`, `evidence.json` and `sources.json` (B6a §1.4).
16. **No candidate is promotable** — `reviewStatus: "reviewed"` without a reviewer fails
    `GRADUATION_REQUIRES_REVIEWERS` (`pack-validation.ts:91-100`).
17. `make verify` green; `docs/content-sourcing.md` gains the Syzygy section including the
    range rule and the D8 dependency; `content/drafts/rook-4v3-same-side.json` is **not**
    modified by this RFC — correcting "ten pieces" to eleven is authoring work under
    `planning/content-era/`, and a BACKLOG row records it.

## Open questions

None.

## Changelog

- 2026-08-12: created, as B6b of the four-way split of the withdrawn
  `content-sourcing-pipelines.md` draft.
