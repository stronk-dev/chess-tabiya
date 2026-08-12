# RFC: Syzygy grounding at ≤7 pieces, and the abstention rule above it

- **Status:** implementing
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/04-content-architecture.md` §4 (Syzygy ground truth: "Syzygy where ≤7 pieces; Stockfish + authored claims above that"), §8 (batch-1 endgame pack)
- **Exploration gate:** breadth sequencing ruling 2026-08-11 (`design/04-content-architecture.md` header); owner ruling 2026-08-12 opening the RFC tier (`rfc/README.md`)
- **Depends on:** **`rfc/content-sourcing-foundation.md` (B6a)** — manifest (including its `local-file` and `engine` origins, B6a §1.2), evidence sidecar, source-linkage rule (§1.2a), deterministic-output rule, `sourcing-check`, record vocabulary, licence encoding. **Blocks on defect D11** (`design/BACKLOG.md:115`, B6a §1.5): an endgame run that mates or stalemates before its checkpoint never discloses its evidence, and there is no workaround in the pack format — see §7. Also `rfc/archive/drill-pack-format.md` and `rfc/archive/engine-workers.md` (both implemented)
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
`:526` records "NO TABLEBASE GROUND TRUTH EXISTS ANYWHERE IN THIS PACK. Rook and four pawns
against rook and three is eleven pieces with both kings", and `:486` ships a `feedbackClaim`
telling the learner the same thing.

The count was wrong in both places when this RFC was first drafted — "ten pieces" — and **both
are now fixed**: `a5e27e1` corrected the pack, so `:486` reads "Eleven pieces are on the
board." and `:526` reads "eleven pieces with both kings", and `1e4b4ae` corrected the same
number where it had propagated into an RFC fixture and two logs. The previous revision of this
RFC claimed `:486` still shipped "Ten pieces" and was **wrong** — a stale claim about a stale
claim, which is the same failure one level up and is recorded here rather than quietly
deleted.

The original error is still the strongest argument this RFC has. The verdict was unchanged
either way (10 and 11 are both above 7), which is exactly why nobody caught it for three
commits: a wrong number inside a sentence whose conclusion is right does not get recounted,
and the author of the correction says so in their own log
(`planning/content-era/log.md:537-556`). That is why §2's census is a mechanical count with a
property test against `chessops` rather than a number an author types — and why this RFC no
longer asks anyone to hand-verify a piece count anywhere.

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
| Making `perfect_tablebase` selectable | Defect **D8** (`design/BACKLOG.md:118`). See §5 — this RFC states the dependency rather than fixing the schema/validator divergence inline |
| Making `win`/`hold`/`save` mechanically checkable | Requires an `outcome.reached` producer, which does not exist (B6a §0). Program item #2/#4 work |
| Endgame *position* sourcing (which roots to drill) | B6d supplies positions from the puzzle DB; canonical theoretical positions are authoring work under `planning/content-era/` |

## Specification

### 1. Backend

`https://tablebase.lichess.org/standard?fen=<fen>` — verified anonymous and answering
2026-08-12, returning `{checkmate, stalemate, variant_win, variant_loss,
insufficient_material, dtz, precise_dtz, dtm, dtw, dtc, category, moves[]}` (B6a §0 probe
table; `dtw` and `dtc` were `null` on the probed position and are not read by this RFC).
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
white, 5 black) — the number `content/drafts/rook-4v3-same-side.json:486` and `:526` now
carry, and the number the emitter derives rather than trusts.

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
`{ fen, pieceCount, category, dtz, precise_dtz, dtm, checkmate, stalemate,
insufficient_material }`, each field copied verbatim from the response except `fen` and
`pieceCount`, which are the query. `dtm` is `null` in the response for many positions and is
copied as `null`, never omitted and never inferred; the same rule applies to `dtz` and
`precise_dtz`. `dtw` and `dtc` are present in the response and deliberately not copied — this
RFC has no consumer for them and an unread field in an evidence record is a claim nobody
checks.

**3.2 Out of range, the only substitute is the shipped Stockfish judge, and it is labelled
differently.** `kind: "engine_eval"`, `grounds: "machine_validation"`, `values` carrying
`centipawns` or `mateIn` plus the reached `depth` exactly as
`apps/server/src/evidence-queue.ts:323-333` produces them, plus `engineId` and
`requestedDepth`, which the shipped `searchProvenance` already attaches when a job is
depth-budgeted (`:282-289`), plus the profile fields from §3.3. It is **never** written as
`tablebase_result`, and a claim it supports may never be phrased as an exact result. The
distinction is enforced, not conventional: `sourcing-check` fails
`EVIDENCE_KIND_MISMATCH` if a `tablebase_result` record's `values.pieceCount` is ≥ 8, and
fails it symmetrically if an `engine_eval` record is anchored to a ≤7-piece position for
which a `tablebase_result` exists in the same file.

**3.3 The authoring engine budget is a fixed depth, single-threaded, MultiPV 1, in a fresh
process, cached.** Every word of that is load-bearing and three of them correct the earlier
draft.

*Why not movetime.* `DEFAULT_STRONG_ENGINE_PROFILE` (`apps/server/src/strong-engine.ts:10-15`)
is `movetimeMs: 100` — adequate for in-run evidence, useless for a reproducible authored
claim. **Stockfish at a fixed movetime is not deterministic across runs**: the node count
reached in 10 s depends on the machine, its load, and the moment. The earlier draft asked for
byte-identical re-emission (B6a §1.4) *and* `movetimeMs: 10000`, which cannot both hold.

*The budget, and why `depth`.* Every authoring search is `go depth 22`. The shipped executor
already emits exactly that: `EvidenceJobInput` takes `depth` **xor** `movetime`
(`apps/server/src/evidence-queue.ts:19-20`, guarded at `:101-107`) and
`StockfishEvidenceExecutor` writes `go depth ${job.depth}` (`:301-304`). The alternative
deterministic budget, `go nodes`, has **no** executor path — `grep -rn "go nodes"
apps/server/src` is empty — and would need a new job field, a new command branch, and a new
provenance key for a budget that is no more portable than depth. Depth ships; depth is used.

*The cost of depth, stated rather than hidden.* A fixed depth has unbounded wall-clock, and
the shipped executor hard-codes the depth path's timeout to
`Math.max(5_000, (job.movetime ?? 0) * 10)` — with `depth` set, `movetime` is `undefined`, so
the ceiling is **exactly 5 000 ms** (`evidence-queue.ts:312`) and a longer search dies as
`ENGINE_UNAVAILABLE` (`engine-supervisor.ts:364`). B6b therefore ships **one** executor
change, and its whole diff is: add an optional `timeoutMs` to `EvidenceJobInput`, defaulting
to today's expression, and pass it through at `:312`. Every shipped caller is unaffected by
construction because the default *is* the current value. The authoring job sets
`timeoutMs: 120_000`; a search that still does not finish is an abstention with
`reason: "source_unavailable"` and the depth in `detail`, not a silent shorter search.

*Why `multiPv: 1`, not 3.* The earlier draft specified `multiPv: 3` with no path to an
engine and a parser that would have misread it:

- The evidence executor never sends `setoption name MultiPV`; the only such command in the
  tree is on the Maia path (`opponent-selector.ts:413`). For the judge, MultiPV is fixed at
  spawn, and `stockfishAnalysisSpec` hard-codes `{ Threads: 1, Hash: 16, MultiPV: 1 }`
  (`application.ts:183-191`). `resolveStrongEngineProfile`'s `multiPv` reaches only the
  **opponent** spec (`strong-engine.ts:41-57`).
- Worse than absent: `lastInfo` takes the **last** matching `info` line
  (`evidence-queue.ts:265-275`), which under MultiPV > 1 is the highest-numbered `multipv`
  line. A MultiPV-3 search would have recorded the *third*-best move's score as the
  position's evaluation, and its PV as the best line.

So B6b pins `multiPv: 1`, and the emitter **refuses** an authoring profile with `multiPv > 1`
with a named error citing `evidence-queue.ts:265-275`. Top-*n* alternatives would need a
different parser; that is not in this RFC.

*Why a fresh process per position.* No `ucinewgame` is sent anywhere in the tree
(`grep -n "ucinewgame" apps/server/src` is empty; the handshake is `uci` → the spec's
`setoption`s → `isready`, `engine-supervisor.ts:225-236`), so the transposition table carries
across positions and the same `go depth 22` on the same FEN can return a different PV
depending on what was searched before it. The pipeline therefore spawns one engine process
per position and stops it after. At authoring scale that costs a process start per record and
buys the only determinism claim worth making.

*Recording, so the number is checkable.* The record's `values` carry `depth`, `threads`,
`hashMb`, `multiPv`, `timeoutMs`, and the engine identity — `id`, `name`, `version` — as
returned by the supervisor. Getting a real `version` requires one deliberate choice: the
authoring spec sets `id: "stockfish-authoring"`, `kind: "judge"`, and **no `name`**, because
`parseIdentity` fills the version from the advertised `id name` line only when `spec.name` is
undefined (`engine-supervisor.ts:116-126`). Both shipped Stockfish specs set
`name: "Stockfish"` and therefore report `version: "unknown"` — which is the second reason
B6b does not reuse `stockfish-analysis` as-is.

*And the honest residual.* Fixed depth, one thread, fixed hash and a fresh process make a
search reproducible **on one binary**. A different Stockfish build or NNUE net can return a
different score at the same depth, and this RFC cannot prevent that. What it does instead is
B6a §1.4's rule: every engine result is written to the `engine` cache kind, keyed by engine
id, version, profile, budget, FEN and evidence kind, and re-emission reads the cache. So
re-emission is byte-identical because the answer is *recorded*, and a change of engine build
shows up as a cache miss and a new record carrying the new `version` — visible in review,
never silent.

An unqualified "the engine says" is exactly the dashboard ADR-0005 and AGENTS.md law 8
forbid; the recorded budget, profile and build are what make the sentence checkable.

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

**The position list is a manifest entry, and that is what makes an abstention-only candidate
legal.** It is ingested as B6a §1.4's `file` cache kind and declared as a `local-file` origin
(B6a §1.2) with `sourceId: "author-positions"`, its repo-relative `path`, its `sha256`, and a
`retrievedAt` written once at first ingest. `licence` is `basis: "no-rights-asserted"` with
`rationale: "the author's own position list; a list of FENs states facts about chess
positions"`.

This is load-bearing rather than bookkeeping. An 11-piece candidate issues **no HTTP request
at all** (§2), so under the previous HTTP-only manifest it had zero entries — and B6a's
`MANIFEST_EMPTY` forbids that, which meant the deliverable this whole RFC is built around
could not produce a legal artifact triple without inventing a fetch. With the `local-file`
origin the manifest is honestly non-empty, the abstention links to it by
`sourceId` + `retrievedAt` (B6a §1.2a), `sourcedAt` derives from it, and `MANIFEST_ENTRY_UNUSED`
is satisfied. Nothing is asserted about Syzygy that did not happen: the abstention names the
input that *was* consumed, never the source that was not queried.

An `engine_eval` record's manifest entry is the `engine` origin (B6a §1.2) carrying engine id,
version, profile, budget, FEN and evidence kind — the same identity §3.3 records in `values`,
declared once in the place every other non-reproducible input is declared.

| Pack field | Value | Legality |
|---|---|---|
| `id` | `` `endgame-${slug(label)}` `` with `-2`/`-3` on collision in ascending input order | `schema:78-81` |
| `version` | `"0.1.0"` | `schema:82-84` |
| `title` | the supplied label, or `` `Endgame: ${material signature}` `` (e.g. `Endgame: KRPPP vs KRPP`) computed from the FEN | `nonEmptyString` |
| `mode` | `"outcome"` | `schema:23`; root-required. Not `"line"` — there is no line |
| `phase` | `"endgame"` | `schema:24-26` |
| `start.fen` | the supplied FEN | `lint.ts:218` |
| `start.side` | `--learner-side`, **required, no default** | schema-optional (`schema:117`), client-required (`apps/web/src/lib/screen-model.ts:54-60`); defect **D9**, B6a §0 |
| `spine` | **omitted** | no source supplies a continuation; inventing one is a chess claim |
| `objective.type` | `"play_until_checkpoint"` | see §5 |
| `objective.summary` | `` `Play this endgame out for ${C} plies from this position.` `` | B6a §4's placeholder discipline; `graduationBlockers` records it |
| `objective.successConditions` | `[{ "kind": "reach_checkpoint", "checkpointId": "endgame-played-out" }]` | only executable condition (`pack-validation.ts:160-178`) |
| `checkpoints` | exactly one: `{ "id": "endgame-played-out", "trigger": { "atPly": C }, "actions": [] }`, `C` = 16 adjusted to learner parity (§4.1) | `minItems: 1` (`schema:44-48`); `atPly` fires regardless of spine (`pack-orchestrator.ts:45`) |
| `opponentPolicy` | `{ "mode": "strong_engine" }` or `{ "mode": "human_common", "targetElo": …, "seedMode": "per_branch" }`, chosen by `--opponent`, **required** | `capabilities.ts:10-14`. **Never `theory_strict`**: with no spine it silently degrades to `human_common` (`opponent-selector.ts:453-458`) and the pack would misdescribe itself |
| `feedbackPolicy` | `"delayed_checkpoint"` | `pack-validation.ts:103-122` |
| `difficulty` | `{ "branchLengthTarget": C }` when `C ≤ 20`, else omitted | `schema:100-104` bounds it to 2–20 |
| `provenance` | `reviewStatus: "draft"`, `reviewers: []`, the no-rights-asserted source string (§6), `licence: "CC-BY-SA-4.0"` (B6a §2, unconditional), no `attribution`, `graduationBlockers` | `schema:458-475`, `additionalProperties: true` at `:474` |

`--opponent` is required and has no default because the choice is pedagogical: `strong_engine`
drills convert/hold under best defence, `human_common` drills practical resistance, and
`design/04` §4's "convert / hold / save variants" does not say which. The choice is recorded
in `graduationBlockers` as an open authoring decision.

**4.1 Checkpoint parity.** The root is `ply: 0` (`packages/runtime/src/runtime.ts:178`) and
each move is `+1` (`:325`). The opponent moves whenever the board's turn colour is not
`start.side` (`apps/web/src/lib/session-controller.ts:367`). Therefore:

- FEN side to move **equals** `start.side` ⇒ the learner moves first ⇒ **learner plies are
  odd**.
- FEN side to move **differs from** `start.side` ⇒ the opponent moves first ⇒ **learner plies
  are even**.

The emitter computes this from the FEN and `--learner-side` and adjusts `C` by one so the
checkpoint always fires on a **learner** ply. This matters because withheld engine evidence
is unlocked by `feedbackDisclosed`, which under `delayed_checkpoint` returns true as soon as
a `checkpoint.reached` event exists (`packages/runtime/src/feedback.ts:3-6`, called from
`apps/server/src/feedback-policy.ts:13,39`) — and revealing it in the middle of the
opponent's turn is a worse moment than after the learner's own move. (There is no
`feedbackIsRevealed` in the tree; two drafts of this territory cited it.)

Parity fixes *when* the checkpoint fires. It does nothing about the runs where it never fires
at all, which is §7.

**Deliberately absent:** no `annotations`, no `planClasses`, no `deviations`, no
`feedbackClaims`, no `concepts`, no `authoredBoundary`. Every one is a judgment.

### 5. What B6b cannot do, and its dependency on D8

**It cannot select `opponentPolicy.mode: "perfect_tablebase"`.** That value is in the schema
(`schemas/drill_pack.schema.json:361`) and **not** in `SUPPORTED_POLICY_MODES`
(`apps/server/src/capabilities.ts:10-14`), so `pack-validation.ts:125-138` rejects it with
`UNSUPPORTED_OPPONENT_POLICY`. This is defect **D8** (`design/BACKLOG.md:118`), which
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
condition is `reach_checkpoint` (`pack-validation.ts:160-178`) and `outcome.reached` has no
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

Encoded per B6a §1.2 as `basis: "no-rights-asserted"`, `spdx: null`, with `rationale` set to
that Feist / Football Dataco text, carried verbatim into one `provenance.sources[]` string.
This is the case B6a §1.2 introduced the field for: the claim is not "the licence is unknown"
(SPDX `NOASSERTION`) and not "the licence is unlisted" (SPDX `LicenseRef-…`) but "this is not
a copyrightable work", and `unlicensed-data` — the withdrawn draft's value — is not an SPDX
identifier at all.

`provenance.licence` is `"CC-BY-SA-4.0"` like every emitted pack (B6a §2 is wholesale, not
conditional on borrowing); `provenance.attribution` is absent, because nothing was borrowed
and a tablebase result is not prose. The `licence` object carries exactly `basis`, `spdx`,
`noticeText` and `rationale` — the obligation booleans no longer exist and are derived from
the identifier (B6a §1.2), so this entry cannot declare itself attribution-free in one field
and attribution-bearing in another.

### 7. B6b blocks on D11, and there is no workaround to build instead

**The dependency, stated as the review demanded rather than discovered in implementation:
B6b requires terminal-completion/reveal semantics that do not ship.** B6a §1.5 has the full
mechanism; the part that is specific to this RFC is why it is a block here and not a caveat.

An endgame drill is *the* case where a run ends. B6b emits `mode: "outcome"` packs with one
`atPly C` checkpoint, `C` around 16, played against `strong_engine` or `human_common` from a
position with few pieces on the board. Mate, stalemate and insufficient material inside 16
plies are not edge cases in that material — they are the drill's subject matter. When one
occurs: the terminal move commits and is orchestrated (`apps/server/src/service.ts:258,282`),
every later move throws `RUN_TERMINATED` (`packages/runtime/src/runtime.ts:274-276`), the
`atPly C` checkpoint never matches, `feedbackDisclosed` stays false
(`packages/runtime/src/feedback.ts:3-12`), the objective stays `active`, and every
`tablebase_result` and `engine_eval` this RFC exists to attach stays withheld forever. **The
learner who converted the ending is shown less than the learner who shuffled for sixteen
plies.** That is not a pack this RFC should ship.

**No bounded local workaround exists**, and B6a §1.5's table is the check: there is no trigger
that matches a terminal position, an early checkpoint destroys delayed disclosure, `segment_end`
needs a checkpoint to have fired already, and `attempt_end` does not validate. Options that
would be *available* — lowering `C`, choosing a quieter opponent, restricting to positions
unlikely to end — are all forms of emitting content shaped around a runtime defect rather than
around chess, and each one would have to be undone when D11 lands.

**So:**

- B6b is **not implementable until D11 ships.** Its fix is named in B6a §1.5 and is program-item
  work, not sourcing work; this RFC does not implement it as a side effect, and B6a §6 puts it
  in the landing order between B6a and B6b.
- The block is expressed as §Acceptance 21, a scripted forced mate before the checkpoint that
  must still reveal. It fails today. It is deliberately not satisfiable by choosing a line that
  avoids termination.
- **The abstention path is unaffected and stays this RFC's primary deliverable.** §2's census,
  the out-of-range refusal, and the `local-file` manifest entry that makes its triple legal are
  all independent of D11 — they concern what is *written*, not what is *played*. If the owner
  wants the refusal instrument before the runtime fix, the honest split is to land §1–§2 and
  §6 (census, abstention, licence) and hold §4's pack emission, not to ship packs that cannot
  reveal.

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
1a. **The abstention-only candidate is a legal triple.** The same run's `sources.json` carries
    exactly one entry — `origin.kind: "local-file"`, `sourceId: "author-positions"`, the
    list's `sha256` — `make sourcing-check` passes, `MANIFEST_EMPTY` does **not** fire, the
    abstention's `sourceId`/`retrievedAt` match that entry byte for byte (B6a §1.2a), and
    `sourcedAt` equals its `retrievedAt`. A variant test that strips the entry fails
    `MANIFEST_EMPTY`, and one that renames the abstention's `sourceId` to `"syzygy"` fails
    `EVIDENCE_SOURCE_UNLINKED` — the shape that would have asserted a retrieval that never
    happened.
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
6. **The authoring budget is deterministic and recorded.** Every `engine_eval` record carries
   `depth`, `threads`, `hashMb`, `multiPv`, `timeoutMs` and the engine `id`/`name`/`version`;
   a record missing any of them fails `EVIDENCE_VALUES_INVALID`. A record carrying
   `movetimeMs` fails the same way — **no engine-derived record in this RFC may be produced
   by a wall-clock budget**. A test asserts the emitted job sets `depth` and not `movetime`,
   and that the executor received `go depth 22`.
7. **MultiPV is 1 and cannot be raised.** An authoring profile with `multiPv: 3` is refused
   with a named error; a test drives `StockfishEvidenceExecutor` over a canned MultiPV-3
   transcript and asserts `lastInfo` (`evidence-queue.ts:265-275`) returns the `multipv 3`
   line — the misreading this restriction prevents, proved rather than asserted.
8. **The executor change is exactly one field and changes no shipped behaviour.** A test
   enqueues a `depth` job with no `timeoutMs` and asserts the effective timeout is still
   `Math.max(5_000, (job.movetime ?? 0) * 10)`; another passes `timeoutMs: 120_000` and
   asserts a 30 s search completes rather than aborting at 5 s.
9. **Each position gets a fresh process, and re-emission comes from the cache.** A test
   asserts one spawn per graded position; a second runs the emitter twice with the engine
   stubbed to fail on the second run and asserts identical output, proving the second run
   read the `engine` cache entry (B6a §1.4) and never searched.
10. **No record from this RFC supports prose.** Records whose `supports` target
    `/spine/0/annotations/0`, `/feedbackClaims/0/text`, `/objective/summary`, or
    `/deviations/0/class` each fail `EVIDENCE_OVERREACH` — asserted for both `kind`s.

**Boundary conditions of shapes the schema permits:**

11. **`perfect_tablebase` refusal.** An endgame candidate hand-edited to that mode fails
    `validatePackDocument` with `UNSUPPORTED_OPPONENT_POLICY` at `/opponentPolicy/mode`
    (`pack-validation.ts:125-138`); the shipped emitter never produces it; and every ≤7-piece
    candidate carries the D8 `graduationBlockers` entry verbatim.
12. **`theory_strict` is never emitted.** A test asserts no B6b candidate declares it, and a
    companion test constructs a spine-less pack with `theory_strict`, runs one selection, and
    asserts it takes the `#humanCommon` path (`opponent-selector.ts:453-458`) — the silent
    degradation this emitter must not create.
13. **A spine-less candidate is valid and playable.** A B6b candidate passes
    `validatePackDocument`; `projectPackDocument` returns `spine: []`
    (`apps/server/src/pack-registry.ts:66`); the client's `timelineEntries`
    (`apps/web/src/lib/screen-model.ts:96`) renders it without throwing; and one full run
    reaches `endgame-played-out`.
14. **Checkpoint parity (§4.1).** For a FEN with White to move and `--learner-side white` the
    emitted `atPly` is **odd**; with `--learner-side black` it is **even**. In both cases a
    played run fires `checkpoint.reached` on a node whose `actor` is `"user"`
    (`Actor` at `packages/runtime/src/types.ts:3`, the node field at `:85`).
15. **`branchLengthTarget` is omitted, not clamped, when `C > 20`.** `schema:100-104` bounds
    it to 2–20; a candidate with `C = 24` emits no `difficulty.branchLengthTarget` and still
    validates.
16. **No emitter writes a key the schema forbids** — the B6a §Acceptance 13 property test is
    extended to this pipeline.

**Licence and hygiene:**

17. `syzygy` → `basis: "no-rights-asserted"`, `spdx: null`, with the Feist / Football-Dataco
    rationale text present in `sources.json` and verbatim in `provenance.sources[]`;
    `provenance.licence` is `"CC-BY-SA-4.0"` and `provenance.attribution` is absent. A test
    asserts no artifact of this pipeline contains the string `unlicensed-data`, and a second
    asserts no `licence` object emitted by this pipeline carries an `attributionRequired` or
    `shareAlike` key (B6a §1.2 derives both).
18. **Determinism.** Two `--offline` runs against the committed tablebase **and engine**
    fixtures produce byte-identical `pack.json`, `evidence.json` and `sources.json`
    (B6a §1.4), including for candidates carrying `engine_eval` records.
19. **No candidate is promotable** — `reviewStatus: "reviewed"` without a reviewer fails
    `GRADUATION_REQUIRES_REVIEWERS` (`pack-validation.ts:92-99`).
20. `make verify` green; `docs/content-sourcing.md` gains the Syzygy section including the
    range rule, the fixed-depth budget, and the D8 and D11 dependencies;
    `content/drafts/rook-4v3-same-side.json` is **not** modified by this RFC. Its piece count
    is already correct at `:486` and `:526` (`a5e27e1`), so there is nothing for this RFC to
    fix there; a test asserts the emitter's census over that pack's `start.fen` returns 11,
    which is the same claim under machine control instead of under proofreading.

**The D11 block, expressed as the test that fails:**

21. **A run that ends before its checkpoint still reveals.** A B6b candidate is played from a
    committed fixture position along a **scripted forced mate** that lands before `atPly C`.
    The test asserts, after the mating move: the objective has left `active`; `feedbackDisclosed`
    is true (`packages/runtime/src/feedback.ts:3-12`); `GET /runs/:id/events` includes the
    `evidence.attached` events that were withheld; and `GET /runs/:id/authored-feedback`
    behaves as it does after a normal checkpoint. A stalemate line and an
    insufficient-material line are asserted the same way. **This criterion cannot pass until
    D11 ships** (B6a §1.5, `design/BACKLOG.md:115`), and that is the block, not a caveat: it
    may not be satisfied by choosing a line that avoids termination, and the test asserts the
    scripted line *is* terminal before ply `C` so that no future edit can quietly turn it into
    one that survives.

## Open questions

None.

## Changelog

- 2026-08-12: implementation began after D11 landed. The mechanical range census,
  abstention-first candidate emitter, tablebase evidence, fixed-depth authoring profile,
  and executor timeout override are assigned to `planning/content-sourcing-syzygy/`.

- 2026-08-12: created, as B6b of the four-way split of the withdrawn
  `content-sourcing-pipelines.md` draft.
- 2026-08-12: revised against the per-file review. (1) The engine budget is now a fixed
  `go depth 22` — the only deterministic budget with a shipped executor path
  (`evidence-queue.ts:19-20,101-107,301-304`) — replacing `movetimeMs: 10000`, which
  contradicted B6a §1.4's byte-identical rule; the cost (unbounded wall clock, the 5 s
  hard-coded depth timeout at `:312`) is stated with the one-field executor change that
  answers it. (2) `multiPv: 3` dropped to `1`: nothing carries an overridden MultiPV to the
  judge (`application.ts:189` is hard-coded, `strong-engine.ts:41-57` feeds the opponent
  only), and `lastInfo` (`:265-275`) would have read the *third*-best line as the evaluation.
  (3) Determinism is now sourced from the `engine` cache kind plus a fresh process per
  position (no `ucinewgame` exists), with the cross-binary residual stated instead of
  implied. (4) Licence encoding moved off the non-SPDX `spdx: "unlicensed-data"` and onto
  B6a's `basis: "no-rights-asserted"`, and `provenance.licence` is now written
  unconditionally per the wholesale ruling. (5) The §Summary claim that Pack C says "ten
  pieces" in both places is corrected: `:526` was fixed in `a5e27e1`, `:486` still ships it.
  (6) `feedbackIsRevealed` corrected to `feedbackDisclosed`; `runtime.ts`,
  `session-controller.ts`, `types.ts` and `opponent-selector.ts` coordinates re-taken.
- 2026-08-12: revised against the second review. (1) **New §7: B6b blocks on D11.** An endgame
  run that mates or stalemates before `atPly C` never fires a checkpoint, so
  `feedbackDisclosed` stays false forever (`packages/runtime/src/feedback.ts:3-12`) and every
  record this RFC attaches stays withheld — in exactly the runs endgame packs are about. All
  four candidate workarounds are closed by shipped code (B6a §1.5), so the dependency is
  stated as a block with a named fix rather than papered over; §Acceptance 21 is the failing
  test that expresses it, and it is written so a line that happens to survive cannot satisfy
  it. (2) §4 now declares the author's position list as a `local-file` manifest entry (B6a
  §1.2): without it the out-of-range candidate — this RFC's primary deliverable — had an empty
  manifest, which `MANIFEST_EMPTY` forbids, and the only alternative was inventing a fetch.
  The abstention links to that entry by B6a §1.2a, and §Acceptance 1a proves both directions.
  (3) **The §Summary claim about Pack C was itself stale and is corrected**: `:486` and `:526`
  both read "eleven" since `a5e27e1`, so the previous revision's "half of it still is [wrong]"
  was wrong; §Acceptance 20 no longer assigns a correction that has already happened, and
  replaces it with a census test. (4) The licence encoding drops the derived obligation
  booleans per B6a §1.2's matrix.
