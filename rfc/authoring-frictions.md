# RFC: Authoring frictions — the full frictions wave

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/01-training-model.md` §Outcome types (`:81-91`) and the mode table (`:93-100`); `design/00-thesis.md` §Target player on-ramp knobs (`:148-154`) and the honest-target rule (`:84-96`); `design/04-content-architecture.md` §0a content-transfer test; `design/BACKLOG.md` rows **Opening-wave authoring frictions**, **Trajectory-format frictions**, **On-ramp wave frictions**, **Endgame-wave frictions**, **Wave-4a follow-ups**, **Mates-batch frictions**, **Cursed wins / blessed losses vs the outcome types**, **Declared-vs-executable vocabulary law**, and the defect rows **D29**, **D30**, **D31**. *Rows are cited by title throughout this RFC: `design/BACKLOG.md` line numbers shifted twice during this draft's review and are not a stable address.*
- **Exploration gate:** owner ruling 2026-08-12 opened the RFC tier (`rfc/README.md` §Exploration gate); this RFC is scoped by the owner ruling of 2026-08-15 — *"full frictions wave"*, one RFC covering the four friction batches deposited by content waves 4a, 5a, 5b and 5c, plus the cursed-win / blessed-loss admission ruling recorded in the **Cursed wins / blessed losses** row and the D30 defect ruling of the same date
- **Depends on:** `rfc/archive/grounding-pair.md` (tablebase grounding, `verify-draft`, `perfect_tablebase`), `rfc/archive/line-drill-theory-grading.md` (deviation classification and the `follow_theory` scope table), `rfc/archive/onramp-guard.md` (`immediate_guard`, the `guard` block), `rfc/archive/trajectory-drill.md` (`legs`), `rfc/archive/content-sourcing-foundation.md` (the artifact triple and candidate directories)
- **Parent / amends:** amends the shipped systems named above; introduces no new subsystem
- **Supersedes / superseded by:** —
- **Planning:** `planning/authoring-frictions/` (once implementing)

## Summary

Four content waves authored twenty-two packs and deposited four batches of
authoring frictions in the ledger. This RFC specifies the fixes for the seven
frictions that either passed the repeated-attestation threshold or are cheap and
blocking (§§1–7, in attestation order), plus two items the owner ruled on
2026-08-15: the **admission rule** (§8) — a cursed win may not root a **Win**
drill, while a blessed loss under **Hold/Save/Resist** is explicitly trainable
with the fifty-move counter as the resource being learned — and the **D30
defect** (§9) that admission rule's grading path depends on. It claims **pack
schema 0.16** and **no migration**: every change is additive to the pack format,
to authoring tooling, to the runtime's terminal-outcome coverage, or to validator
refusals, and nothing persisted moves.

Three findings from reading the code were sharper than the ledger prose that
sent me there. All three have since been ledgered by the ledger's single writer
as **D29**, **D30** and **D31** in `design/BACKLOG.md`, and
all three are load-bearing below:

- **D31** — the mirrored-side candidate collision is a **pack-id** collision, not
  only a `job.json` overwrite (§7).
- **D29** — the fifty-move draw the cursed-win ruling depends on is **not
  declarable from the pack format** today: `RulesFactPredicate` executes
  `fact: "draw"` (`packages/runtime/src/objective.ts:26-35`, `:221-222`) but the
  schema's `rules_fact` enum is `["checkmate", "stalemate"]`
  (`schemas/drill_pack.schema.json:305`, `$defs/successCondition`). §8b widens it.
- **D30** — `terminalOutcome` never reports a draw for the fifty-move rule or
  threefold repetition at all (`packages/runtime/src/outcome.ts:5-11`). The
  **owner ruled on 2026-08-15 that this is a defect, not an open question**: in a
  drill as in a tournament, a thrice-repeated position or an exhausted fifty-move
  counter *is* a draw. §9 ships that fix inside this wave, because §8 would
  otherwise ship a workaround the very next RFC removes.

The **Cursed wins / blessed losses** row's *"Runtime support already exists —
`objective.ts:197-203` `drawIsAvailable` adjudicates stalemate, insufficient
material, threefold AND `halfmoves >= 100`"* is half true; §§8–9 supply the
missing half.

## Motivation

**Why now, and why one RFC.** Our own rule is that repeated attestation is what
earns a fix — an ask that has recurred across independent authoring waves is
evidence about the format, not a preference. Four of the nine items below are
past that threshold and three of them have been paid for four times each in
scratchpad re-implementation, hand-verification, and prose stand-ins. They also
share three surfaces (the pack schema, `pack-validation.ts`, the sourcing
emitters); splitting them into four RFCs would mean four claims on pack schema
version and four rebases in the register for changes that are individually a
dozen lines.

**Ordering is by attestation count, and it is normative.** If the wave must be
cut short, it is cut from the bottom.

| # | Item | Attestations | Ledger row |
|---|---|---|---|
| 1 | Tablebase walker blessed as repo tooling | 4th (waves 2, 3, 4a, 5c) | Mates-batch (3) |
| 2 | First-move alternative cannot be a deviation | 3rd/4th (waves 2, 4a ×2) | Opening-wave, Wave-4a |
| 3 | Intent capture before ply 1 | 3rd (waves 3, 5a, 5b) | Endgame-wave (3) |
| 4 | Variants rule has no encoding | 2nd, now machine-derivable | Endgame-wave (2), Mates-batch (2) |
| 5 | 20-ply segment cap vs full-length mates | 1st, blocking B+N now | Mates-batch (1), Trajectory-format |
| 6 | Guard's single-scalar `evalSwingCp` | 1st, four named sub-asks | On-ramp |
| 7 | Candidate directory keying | 1st, silently destructive | Opening-wave, D31 |
| 8 | Cursed-win / blessed-loss admission | owner ruling 2026-08-15 | Cursed-wins |
| 9 | D30 — fifty-move / threefold are not outcomes | owner ruling 2026-08-15 | D30 |

**Row 9 is not attestation-ordered**; it is a defect the owner ruled on while
this draft was in review, admitted here because §8's grading path is built on top
of it (§9 §Why it is in this wave).

**Explicitly out of scope**, with the reason for each, so the boundary is not a
silent omission:

- **`intent_capture`'s validated-answer slot** (On-ramp row, 3rd attestation). It
  needs a recorded learner answer, which needs a new run event, a run-schema
  bump, a migration and a client interaction surface — `Branch.intent`
  (`packages/runtime/src/types.ts:107`) is a free-text branch label and is not
  it. That is a whole RFC, and §3 here unblocks its *placement* half without
  prejudging its grading half. It should be the next drafted follow-up.
- **Per-leg `shapes` and per-leg `opponentPolicy`** (Trajectory-format row). Single attestation,
  and the item that motivated them here — the B+N trajectory — wants
  `perfect_tablebase` on every leg, so §5 does not need them. §5 adds only the
  per-leg field the ply cap actually blocks.
- **`shapePlan: null` ergonomics, hands-off-to vs present-now shape references**
  (Opening-wave row), **Node zstd**, **`theory_strict` off-spine consequence
  behaviour** (On-ramp row), the **`rook-4v3-same-side` trigger over-promise**
  (Trajectory-format row), and every commissioned shape entry (Wave-4a row). These are content, shape-library or runtime
  questions, not authoring-format frictions; they ride their own surfaces.
- **Anything under `content/`.** A parallel agent is authoring the B+N
  multi-segment trajectory right now. This RFC changes formats and tools; the
  re-emission and re-authoring passes that consume them are content work.

## Specification

### §0. Register claims

- **Pack schema version: 0.16 is claimed here.** `$id` in
  `schemas/drill_pack.schema.json:3` moves `urn:chess-tabiya:schema:drill-pack:0.15`
  → `:0.16`; `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts:2`) moves
  `"0.15"` → `"0.16"`; the pinned expectation in
  `packages/schema/src/drill-pack.test.ts:60` moves with them. Every 0.16 change
  is **additive or widening**: every committed pack and fixture stays valid, and
  no committed digest moves (pack digests are content digests and do not include
  the `$id` — `packages/schema/src/drill-pack/digest.ts:58-66`). This RFC does
  **not** edit `rfc/README.md`; the register row is claimed in this text and the
  single writer of that file lands it.
- **No migration is claimed. The migration register stays at 18.** Nothing
  persisted changes shape: §3 fires an existing `checkpoint.reached` event at an
  existing node (`schemas/drill_run.schema.json:429-440`, whose `data` is
  `{checkpointId, nodeId, branchId}` — exactly what `reachCheckpoint` already
  writes), §6 fires an existing `feedback.generated` event (`guard.ts:86`), §8 is
  pure admission, §9 emits an existing `outcome.reached` event with an existing
  `result` value, and §§1/4/5/7 touch tooling, validation and pack documents only.
- **No run-schema change.** `DRILL_RUN_SCHEMA_VERSION` stays `"0.13"`. §9 is the
  only item that changes what a *new* run records; it adds no event type, no
  field, and no vocabulary value, and it is replay-compatible with every stored
  run (§9 §Replay compatibility). A behaviour change is not a schema change, but
  it is not nothing either, and §9 states the boundary rather than hiding behind
  the version pin.

### §1. A blessed tablebase walker (4th attestation)

**The friction as attested.** Every verification wave hand-rolls the same
tablebase walker: enumerate the legal moves at a learner decision node, query
each resulting position's category, walk the spine to a terminal, cache, back
off on 429. Wave 5c logs it as *"python-chess still not blessed in the repo
toolchain (third attestation; installed to scratchpad venv again)"*
(`planning/content-era/log.md`), and wave 4a paid the same cost a fourth time
with a chessops scratch script. The instrument is what caught the real errors —
five authored chess errors in wave 5c alone, including a 23-ply mate over the
format cap and a "Ra7+ draws" claim that enumeration refuted — so it is not
disposable exploration, it is the authoring loop's measuring device.

**The fix.** Ship `apps/server/src/sourcing/tablebase-walk.ts` with a Makefile
target. It is the **authoring-time walker**; `verify-draft` is the
**admission-time grounder**, and they do not merge:

| | `verify-draft` (shipped) | `tablebase-walk` (this RFC) |
|---|---|---|
| Input | a draft pack that already declares `assessedBy.kind: "syzygy"` | a draft pack **or** a FEN list, with no declaration required |
| Walks | root, spine nodes, authored deviations (`verify-draft.ts:60-79`) | the same, **plus every legal move at every learner decision node** |
| Writes | `.evidence.json` / `.sources.json` / `.job.json` sidecars, and rewrites the pack | a report to stdout or `--out`; **never** a pack, never a sidecar |
| Fails on | a contradicted root, a category-regressing learner spine move | no chess judgement at all; it exits non-zero only on transport failure or `WALK_QUERY_BUDGET_EXCEEDED` |

The tool **must not** duplicate `verify-draft`'s emission path. It imports
`enumerate`-equivalent walking, `countFenPieces`
(`apps/server/src/sourcing/chess-facts.ts`), `learnerCategory`/`invert`/
`CATEGORY_RANK` (`verify-draft.ts:86-93` — extracted to a shared module in this
RFC so both callers use one ranking) and `liveTablebaseQuery`
(`apps/server/src/sourcing/syzygy.ts:102-119`).

**Language.** The ledger says *"python-chess harness"*. It lands in
**TypeScript**, because `docs/development.md:9` confines Python to the
Dockerized Maia sidecar and `design/research/stack-selection.md:197` states the
scoped exception as *"Python may exist only inside worker containers speaking
UCI/JSON, never in server code"*. Nothing in the friction needs python-chess:
chessops already generates the legal moves (it is the engine of
`verify-draft.ts:43-58` and `packages/runtime/src/line.ts:32-52`), and the
Lichess tablebase HTTP path already carries our source lock, licence rationale
and backoff. The ledger names a habit, not a requirement. Recorded as a
deliberate divergence in §Deviations, with an owner escape hatch in §Open
questions.

**Surface.**

```
make tablebase-walk FILE=<pack.json>            [OUT=<report.json>] [OFFLINE=1]
make tablebase-walk FENS=<positions.txt>        [OUT=<report.json>] [OFFLINE=1]
```

Flags: `--enumerate=decision|all|none` (default `decision` — every node where the
learner is to move), `--max-queries=N` (default 400, a hard stop with a named
refusal so a walk cannot silently become a thousand-request crawl).

**Report shape** (`tabiya.sourcing.walk.v1`, canonical JSON via
`writeCanonicalJson`):

```json
{
  "schema": "tabiya.sourcing.walk.v1",
  "subject": { "kind": "pack", "packId": "...", "learnerSide": "white" },
  "queries": 137,
  "nodes": [
    {
      "pointer": "/spine/0/moveUci",
      "fen": "...",
      "ply": 1,
      "sideToMove": "black",
      "pieceCount": 5,
      "learnerCategory": "win",
      "dtz": 12, "dtm": 21,
      "terminal": null,
      "moves": [
        { "uci": "h6b6", "san": "Rb6", "learnerCategory": "win", "dtz": -11, "terminal": null },
        { "uci": "h6h8", "san": "Rh8", "learnerCategory": "loss", "dtz": 0, "terminal": null }
      ]
    }
  ],
  "abstentions": [
    { "fen": "...", "reason": "out_of_range", "detail": "9 pieces; Syzygy covers <=7" }
  ],
  "spineTerminal": { "pointer": "/spine/0/children/0/...", "kind": "checkmate" }
}
```

`learnerCategory` is always stated from the learner's perspective, using the
inversion table and rank order already shipped (`verify-draft.ts:86-93`,
`apps/server/src/tablebase.ts:11`), so an author never has to invert by hand —
the wave-5c enumeration errors were perspective errors.

**Caching.** A per-position cache at
`content/sources/syzygy/<transposeKey>-<halfmoves>.json`, with **no TTL**,
mirroring the explorer's cache-then-lock structure
(`apps/server/src/sourcing/explorer.ts:101-128`) and the runtime's justification
for an unbounded positive cache — a successful probe is cached with
`expiresAt: Number.POSITIVE_INFINITY` at `apps/server/src/tablebase.ts:22`
because a tablebase answer for a fixed FEN cannot change.
`content/sources/` is gitignored (`.gitignore:11`), so the cache is local and
reruns are free.

**`OFFLINE=1` abstains on a miss; `verify-draft` does not, and this is a
deliberate divergence.** `offlineQuery` (`verify-draft.ts:102-110`) reads the
committed `apps/server/src/sourcing/fixtures/verify-draft.json` (135 positions)
and **throws** `TABLEBASE_SOURCE_UNAVAILABLE` at `:105` on a miss. That is right
for an admission-time grounder walking a bounded set of authored positions; it is
wrong for a walker whose whole job is to enumerate *every legal move*, because
the fixture set was built from authored spines and does not contain the
successors. Measured against the committed fixture, the philidor hold root
`4k3/R7/7r/4K3/4P3/8/8/8 b - - 0 1` has **16 legal black moves of which 5 are in
the fixture** — including `h6h8`, whose successor
`4k2r/R7/8/4K3/4P3/8/8/8 w - - 1 2` is present with `category: "win"`. So the
walker's offline reader catches the miss and pushes an
`{ "reason": "offline_fixture_missing" }` entry into `abstentions[]` instead of
aborting, and the report is honest about what it could not see. Online (`OFFLINE`
unset) there is no such gap: every position is queried through
`liveTablebaseQuery` and cached.

**Rate discipline.** All requests go through `SourcingHttpClient`
(`apps/server/src/sourcing/http.ts:20-47`), which already serializes every
in-process request and retries 429/5xx at 60/120/240s. Wave 5c's "parallel
streams tripped 429s, fixed with one sequential stream" is therefore satisfied by
using the shipped client rather than a new one.

**Schema/API surface touched.** New file + new Makefile target + a small
extraction of the shared category helpers from `verify-draft.ts`. No pack-schema
change.

**Verified by** a test that fails today because the file does not exist:
`apps/server/src/sourcing/tablebase-walk.test.ts` walks
`content/drafts/philidor-third-rank-hold.json` under `OFFLINE=1` and asserts
(a) the root's learner category is `draw` (fixture `category: "draw"`, learner is
the side to move), (b) the enumeration at the root decision node contains `h6h8`
with learner category `loss` (fixture `category: "win"` for White to move,
inverted for the Black learner) — the machine fact §4 then consumes — (c) the
other eleven of the root's sixteen legal moves appear in `abstentions[]` with
reason `offline_fixture_missing` rather than aborting the walk, and (d) no
`.evidence.json`, `.sources.json` or `.job.json` file is written next to the
draft.

### §2. First-move alternatives as classified deviations (3rd/4th attestation)

**The friction as attested.** *"First-move alternatives cannot be deviations in a
`follow_theory` pack — deviations need spine-node anchors and no node precedes
ply 1"* (wave 2, Opening-wave row), recurring at the 3rd and 4th attestations in
wave 4a with the anti-Dutch 2.Bf4/2.e4 and anti-Italian ...Nf6 alternatives
(Wave-4a row).
Authors encode them as sibling root branches in the top-level `spine` array,
which makes them **theory** — verdict `on_line` — when what the author means is
`accepted_alternative`, `interesting_deviation` or `concept_violation`.

**Why the refusal exists, and what actually blocks it.** Two things, and only
one of them still applies:

1. `pack-validation.ts:432-438` refuses `at: {fen}` under `follow_theory`
   (`THEORY_DEVIATION_NEEDS_SPINE_ANCHOR`). Its stated reason in
   `rfc/archive/line-drill-theory-grading.md:210` is that `at: {fen}` notes have
   **no delivery path** — `apps/server/src/authored-feedback.ts:145` skips any
   deviation that is not `spineNodeId`-anchored — so grading them would produce
   graded-but-unexplainable verdicts. That reason is real and is fixed here.
2. The runtime already matches FEN-anchored deviations correctly:
   `packages/runtime/src/line.ts:135` compares `transposeKey(candidate.at.fen)`
   against the parent's `transposeKey`. **No runtime change is needed at all.**

**The fix.** Add a third `deviationLocation` variant that is not a free FEN but a
reference to the pack's own root:

```json
{ "at": { "atStart": true }, "moveUci": "f1f4", "class": "accepted_alternative",
  "note": "2.Bf4 is the other main try; the game becomes a London with an extra tempo." }
```

- **Schema (0.16, additive):** `$defs/deviationLocation` gains
  `{ "type": "object", "required": ["atStart"], "properties": { "atStart": { "const": true } }, "additionalProperties": false }`.
  `$defs/deviation` is otherwise unchanged.
- **Types:** `Deviation["at"]` gains `{ readonly atStart: true }`
  (`packages/schema/src/drill-pack/types.ts`).
- **Lint** (`packages/schema/src/drill-pack/lint.ts`): the existing anchor walk
  resolves `atStart` to `pack.start.fen`, so `DEVIATION_WRONG_SIDE`,
  `ILLEGAL_DEVIATION_MOVE`, `DUPLICATE_DEVIATION` and
  `DEVIATION_SHADOWS_SPINE_MOVE` all apply to it unchanged. A root alternative
  that duplicates a top-level spine move raises `DEVIATION_SHADOWS_SPINE_MOVE`
  (warning) exactly as a mid-line one does.
- **Validation** (`pack-validation.ts:432-438`):
  `THEORY_DEVIATION_NEEDS_SPINE_ANCHOR` narrows to refusing **only** `"fen" in
  deviation.at`. `atStart` is admitted under `follow_theory`.
- **Runtime** (`packages/runtime/src/line.ts:133-138`): the deviation matcher
  gains an `"atStart" in candidate.at` case comparing against
  `transposeKey(pack.start.fen)`. `objectiveRules`' `follow_theory` off-objective
  rules (`apps/server/src/pack-orchestrator.ts:173-186`) currently return `[]`
  for non-spine anchors; they gain the same case, so a root deviation marked
  `offObjective: true` degrades the objective like any other.
- **Delivery** (`apps/server/src/authored-feedback.ts:123-160`): `nodeSources`
  keys sources by spine node id. Root-anchored deviations key on the reserved
  anchor id `"/start"`, which is never a valid pack id (ids match
  `^[a-z0-9][a-z0-9-]*$`) and is therefore collision-free. `"/start"` is
  unconditionally reachable — every run's path contains the root — so the note
  becomes deliverable on the first reveal, which is the same rule spine-anchored
  deviation notes already follow. `AuthoredFeedbackItem["anchor"]` for kind
  `deviation` widens to `{ spineNodeId: string; moveUci: string } | { atStart:
  true; moveUci: string }`.

**Schema/API surface touched.** Pack schema 0.16; `Deviation` type;
`lint.ts`; `pack-validation.ts`; `line.ts`; `pack-orchestrator.ts`;
`authored-feedback.ts`; the authored-feedback projection shape consumed by
`apps/web`.

**Verified by** a test that fails today: `apps/server/src/pack-authoring.test.ts`
adds a `follow_theory` pack whose only deviation is `{ at: { atStart: true },
moveUci: <a legal first move that is not the spine's>, class:
"accepted_alternative", note: "..." }`. Today it is refused with
`SCHEMA_ONEOF` from the schema and, once schema-legal, with
`THEORY_DEVIATION_NEEDS_SPINE_ANCHOR`. After the change it validates, the
runtime returns `classified_deviation` with class `accepted_alternative` for a
run that plays that move, and `projectAuthoredFeedback` releases its note.

### §3. Intent capture before ply 1 (3rd attestation)

**The friction as attested.** *"Learner-moves-first roots cannot capture intent
before ply 1"* (Endgame-wave row, item 3). The endgame wave's hold and convert packs open
on the learner's move; the one moment worth asking *"what are you going to do
here?"* is before that move, and the format cannot address it.

**Why.** Checkpoints are evaluated only in `orchestratePackMove`
(`apps/server/src/pack-orchestrator.ts:281-295`), which runs after a commit;
`pack-validation.ts:623-632` therefore refuses `atPly: 0` with
`CHECKPOINT_UNREACHABLE_AT_ROOT` — *"atPly 0 can never be evaluated because
checkpoints run after a commit"*. The refusal is correct about the shipped
mechanism and stays.

**The fix.** A new simple trigger and one orchestration entry point.

- **Schema (0.16, additive):** `$defs/simpleTrigger` gains
  `{ "type": "object", "required": ["atStart"], "properties": { "atStart": { "const": true } }, "additionalProperties": false }`.
  `SimpleTrigger` in `types.ts:66-71` gains `{ readonly atStart: true }`.
- **Matching** (`pack-orchestrator.ts:39-62`): `simpleTriggerMatches` returns
  `node.parentId === null` for `atStart`.
- **Firing:** a new exported `orchestratePackStart(pack, run): MutationResult`
  fires every `atStart` checkpoint on the root node via the shipped
  `reachCheckpoint` (`packages/runtime/src/runtime.ts:427-448`), which stamps the
  active cursor's node and branch. `RunService.create` calls it after `createRun`
  (`apps/server/src/service.ts:387-394`) and before `this.#storage.create`
  (`:408-412`) — outside the `try` block, so an orchestration failure is not
  reported as `Run definition is invalid` — so the run is persisted with the
  checkpoint already reached and no second write is required. **No new event
  type**: this is a `checkpoint.reached` event at the root node, whose `data` is
  `{checkpointId, nodeId, branchId}` and which the run schema already permits
  (`schemas/drill_run.schema.json:429-440`). `reachCheckpoint` emits no
  `segment.completed` alongside it, because that append is conditional on a
  *previous* checkpoint on the same branch (`runtime.ts:451`) and at run creation
  there is none.
- **Scope limit — `atStart` fires once per run, not once per branch.** This is a
  known and accepted narrowing, stated here rather than discovered in
  implementation. `orchestratePackStart` runs only at `RunService.create`;
  `orchestratePackMove` cannot fire an `atStart` trigger afterwards because it
  evaluates checkpoints against the node just committed, which by construction
  has a parent. So a learner who rewinds to the root and forks a new branch is
  **not** asked the intent question again, even though rewind-and-branch is the
  product's core loop. Re-asking per branch needs a per-branch reachability rule
  — `reachedOnActivePath` (`pack-orchestrator.ts:290`) is path-scoped, but there
  is no orchestration entry point on `branch.forked`/`run.rewound` to call. That
  entry point is deferred with the `intent_capture` grading RFC (§Motivation),
  which needs the same hook to record a per-attempt answer; §3 ships the
  addressable root so that RFC inherits it.
- **Validator carve-outs** (`pack-validation.ts:623-642`): `atStart` is exempt
  from `CHECKPOINT_TRUE_AT_ROOT` — being true at the root is its entire purpose.
  `atPly: 0` keeps `CHECKPOINT_UNREACHABLE_AT_ROOT`, whose message gains *"use
  `atStart` to address the root position"*. Two new refusals:
  `START_TRIGGER_IN_WINDOW` (an `atStart` inside a `windowOpens`/`windowCloses`
  timing window — a window that opens at the root and a segment that has not
  begun are not compatible) and `START_TRIGGER_NOT_FIRST_LEG` (an `atStart`
  checkpoint used as a trajectory leg's `entryCheckpointId`, which
  `TRAJECTORY_FIRST_LEG_HAS_ENTRY` at `:343-345` already implies for leg 0 and
  which is unreachable for later legs).
- **Client** (`apps/web/src/lib/DrillScreen.svelte:485-496`):
  `latestCheckpointId()` excludes any checkpoint whose `nodeId` equals the active
  cursor, which would hide a root checkpoint at run start. The exclusion gains
  "unless the checkpoint's trigger is `atStart` and the active node is the run
  root". `latestCheckpoint` in `apps/web/src/lib/screen-model.ts:160-186` has no
  such exclusion and needs no change.

An `atStart` checkpoint carrying `interaction: { type: "intent_capture", ... }`
is the target case, but the trigger is interaction-agnostic: the schema admits
`prediction` and `stated_reasoning` at the root too. One consequence is
load-bearing and is **not** a bug: `REASONING_SEGMENT_END_UNPROVEN`
(`pack-validation.ts:226-241`) is unchanged, and because an `atStart` trigger is
neither `atPly` nor `atSpineNode` the `proven` expression at `:228-240` evaluates
false, so **`stated_reasoning` at the root is refused under `feedbackPolicy:
"segment_end"`** and admitted under the other two policies. That is correct — a
segment that has not begun cannot be proven to end — and it is the same shape as
`START_TRIGGER_IN_WINDOW` below.

**Schema/API surface touched.** Pack schema 0.16; `SimpleTrigger`;
`pack-orchestrator.ts`; `service.ts`; `pack-validation.ts`; `DrillScreen.svelte`.

**Verified by** a test that fails today, in
`apps/server/src/pack-authoring.test.ts` (there is no
`pack-orchestrator.test.ts`; orchestrator behaviour is tested from
`outcome-grading.test.ts`, `line-drill.test.ts` and `trajectory-drill.test.ts`):
it creates a run for a pack whose first checkpoint is
`{ trigger: { atStart: true }, interaction: { type: "intent_capture",
planClassIds: [...] } }` and asserts the freshly created run already contains a
`checkpoint.reached` event whose `nodeId` is the root node id, before any move is
committed. Today the pack is refused at validation and no such event can exist.

### §4. The variants rule gets a real encoding (2nd attestation, machine-derivable)

**The friction as attested.** *"Convert/hold siblings of one root are prose
promises, no in-file or cross-file link"* (Endgame-wave row, item 2), and the wave-5c
sharpening: *"the convert root is derived from the hold pack's queried-losing
1...Rh8??, i.e. root identity across siblings is computable"* (Mates-batch row, item 2).
The state of the art is a `retryVariants` note — in
`content/drafts/philidor-passive-rook-convert.json`, `{ "kind": "opposite_side",
"note": "Defender's bench: philidor-third-rank-hold — the same family root, one
move earlier..." }` — plus a `graduationBlocker` that says, in the author's own
words, *"the variants rule has no encoding: the sibling link ... is prose plus a
retryVariants note, invisible to the runtime."*

**The machine fact this encoding exists to capture.** `philidor-third-rank-hold`
starts at `4k3/R7/7r/4K3/4P3/8/8/8 b - - 0 1`. Playing `h6h8` yields
`4k2r/R7/8/4K3/4P3/8/8/8 w - - 1 2`, which is byte-for-byte
`philidor-passive-rook-convert`'s `start.fen` — confirmed by playing the move
through chessops against the two committed drafts, not by reading the FENs. The
relationship is one legal move, verifiable in microseconds, and today it is a
sentence.

**The fix.** A new optional top-level `variantOf`, a **closed union of three
machine-checkable relations**, each of which the validator proves rather than
trusts:

```json
"variantOf": {
  "packId": "philidor-third-rank-hold",
  "relation": { "kind": "root_after_move", "moveUci": "h6h8" },
  "note": "The convert bench: this root is what 1...Rh8?? produces."
}
```

| `relation.kind` | Meaning | What the validator proves |
|---|---|---|
| `root_after_move` (`moveUci`) | this pack's root is the sibling's root after one legal move | `moveUci` is legal in the sibling's `start.fen`, and the resulting FEN's `transposeKey` equals this pack's root `transposeKey` |
| `same_root_other_side` | the two packs share a root and swap the learner's chair | `transposeKey(sibling.start.fen) === transposeKey(this.start.fen)` **and** `sibling.start.side !== this.start.side` |
| `same_root_other_objective` | the two packs share a root and pose different objectives | the transpose keys are equal, the sides are equal, and `sibling.objective.type !== this.objective.type` |

- **Schema (0.16, additive):** a new top-level optional `variantOf` with
  `required: ["packId", "relation"]`, `packId: {$ref: "#/$defs/id"}`, `note:
  {$ref: "#/$defs/nonEmptyString"}`, `relation` a three-branch `oneOf` with
  `additionalProperties: false` throughout.
- **Resolution:** `validatePackDocument` gains a second optional lookup beside
  `shapes`, following that field's exact precedent
  (`pack-validation.ts:42-44`, `:211-213`, `:655`):
  `packs?: PackSiblingLookup` with
  `get(id): { readonly start: { readonly fen: string; readonly side: "white" | "black" }; readonly objective: { readonly type: string } } | undefined`.
  When no lookup is supplied — the emitters, `verify-draft` — the reference is
  **not** refused, matching the shape-lookup rule at `:212`.
  `PackRegistry.fromDocuments`/`loadDefault` performs a **second pass** after all
  documents are validated, so sibling order does not matter and the lookup is
  built from documents that are already known schema-valid.
  **`pack-check` gets the lookup but must not build a registry to get it.**
  `pack-check.ts:72-73` today loads `ShapeRegistry.loadDefault()` and passes
  `{ shapes }` to `validatePackDocument`; it gains a sibling lookup built by
  reading `content/drafts/*.json` and `content/packs/*.json` for `{id, start,
  objective.type}` only — a plain read, **not** `PackRegistry.loadDefault`, which
  would validate every draft and make `make pack-check FILE=x` fail on defects in
  an unrelated file `y`. A file that fails to parse is skipped, exactly as a
  missing sibling is: absent from the lookup, and therefore
  `VARIANT_PACK_UNKNOWN`.
- **Named refusals:** `VARIANT_PACK_UNKNOWN` (the lookup was supplied and the id
  is absent), `VARIANT_SELF_REFERENCE` (`packId === pack.id`),
  `VARIANT_RELATION_UNPROVEN` (the relation's proof above fails — an illegal
  `moveUci`, a mismatched transpose key, an equal side under
  `same_root_other_side`, an equal objective type under
  `same_root_other_objective`). All three are errors.
- **`root_after_move` is directional, and the philidor pair is one-way.** The
  convert pack can prove `root_after_move` toward the hold pack. The hold pack
  **cannot** prove anything back: enumerating all legal moves from the convert
  root `4k2r/R7/8/4K3/4P3/8/8/8 w - - 1 2` yields **no** move whose result has
  the hold root's transpose key (White is to move there; the move that made the
  convert root was Black's), and the transpose keys are unequal so neither
  `same_root_*` relation holds either. Reciprocity is therefore **not** a
  property of this encoding, and this RFC does not claim it: `variantOf` is one
  optional field carrying one provable claim, authored on whichever side can
  prove it. The reverse link stays what it already is — the hold pack's
  `retryVariants` note.
- **Cycles are permitted where they are provable.** `same_root_other_side` and
  `same_root_other_objective` are symmetric, so two packs in either relation may
  name each other and both proofs succeed. The validator never traverses
  transitively, so there is nothing to cycle-detect.
- **`retryVariants` stays.** It is authored intent about *what to try next* and
  is not superseded; `variantOf` is a claim about *root identity*. The
  philidor pair keeps both, and its graduation blocker is deleted by the author
  in a content pass.
- **Projection:** `projectPackDocument`
  (`apps/server/src/pack-registry.ts:64-119`) emits `variantOf` verbatim when
  present, so a client can offer "the other bench" as a real link instead of a
  sentence. No client surface is required by this RFC.

**Schema/API surface touched.** Pack schema 0.16; `DrillPackDefinition`;
`pack-validation.ts` (new lookup + three refusals); `pack-check.ts`;
`pack-registry.ts` (second pass + projection).

**Verified by** a test that fails today: `apps/server/src/pack-authoring.test.ts`
loads the two philidor drafts through a registry, asserts the convert pack's
`variantOf.relation` of kind `root_after_move` with `moveUci: "h6h8"` validates,
and asserts that mutating the `moveUci` to any of the other fifteen legal black
moves at the hold root raises `VARIANT_RELATION_UNPROVEN`. Today the field is
rejected by `additionalProperties: false` on the pack root
(`schemas/drill_pack.schema.json:107`).

### §5. The segment cap vs full-length mates

**The friction as attested.** *"The 20-ply cap structurally constrains
full-length mates — K+R centre-king DTM is 21–23, so the pack starts pre-boxed"*
(Mates-batch row, item 1), from a wave that caught a real 23-ply K+R finish and had to
root it one stage in. The owner has since commissioned B+N as a multi-segment
trajectory (Mates-batch row, item 5), and B+N is ~66 plies — *"if the leg format or the ply
cap blocks it, that blockage is itself the cap fix's next attestation."*

**What the cap actually is.** `difficulty.branchLengthTarget` is bounded 2–20 at
`schemas/drill_pack.schema.json:139-143` (`$defs/difficulty`). It is **purely
declarative**: a repo-wide search for the field finds exactly three code sites,
all writers and no readers — `apps/server/src/distill.ts:81` (clamps a distilled
branch into the band), `apps/server/src/sourcing/syzygy.ts:181` (omits it when
`atPly > 20`) and `apps/server/src/sourcing/position-seeds.ts:231` (emits the
requested ply count). **Nothing in grading, comparison, projection, the run
schema or the browser client reads it**, so widening the band cannot change any
running behaviour. But it is binding in practice: it is the format's only
statement of a pack's segment length, and the shipped mates packs all declare it
equal to their exact spine depth (19/19/17 against spine depths 19/19/17,
verified by walking the committed drafts). An author facing a 23-ply technique
therefore chooses between lying, omitting, or cutting the technique. All three
happened.

**Where the 2–20 number comes from.** Not from one mode.
`docs/drill-pack-format.md:60` records it as the union of two declared bands —
*"covering the declared 2–8 on-ramp and 8–20 core bands"* — from
`design/00-thesis.md:149` (on-ramp branch length 2–8 plies) and
`design/01-training-model.md:98` (Plan Drill's 8–20-ply segment). Widening the
ceiling leaves both bands intact and adds room above them; it takes nothing away
from either.

**The fix.**

- **Widen the band to 2–40** in `$defs/difficulty`. Forty plies is twenty moves —
  enough for K+R from the centre (21–23) with method overhead, and enough for
  each of B+N's three legs. It is not enough for a single-segment 66-ply march,
  and that is deliberate: the owner's ruling on B+N is that it is *taught as
  phases*.
- **Add per-leg `branchLengthTarget`** to `$defs/trajectoryLeg` (integer 2–40,
  optional). `TrajectoryLeg` (`packages/schema/src/drill-pack/types.ts:160-164`)
  gains the field. This is the only per-leg field this RFC adds; per-leg `shapes`
  and `opponentPolicy` stay out of scope (§Motivation).
- **New lint, warning:** `SEGMENT_BEYOND_PLAN_BAND` fires when a pack with
  `mode: "plan"` declares `branchLengthTarget > 20`. `design/01-training-model.md:98`
  states the Plan Drill contract as an 8–20-ply segment; the warning preserves
  the design number where the design states it, without a hard refusal in a tier
  this RFC may not edit. It goes in `lint.ts` rather than `pack-validation.ts`
  because it is a warning, and lint output already reaches `make pack-check`:
  `validatePackDocument` folds `lintDrillPack(document)` into its issue list at
  `pack-validation.ts:666`, while `pack-pgn.ts:175` filters to `severity ===
  "error"` and is therefore unaffected. Both inputs it needs — `mode` and
  `difficulty` — are on the document lint already receives.
- **New validation, error:** `LEG_LENGTH_WITHOUT_TRAJECTORY` when a leg declares
  `branchLengthTarget` while `pack.legs === undefined` is impossible by
  construction, so the real check is the mirror: `TRAJECTORY_LENGTHS_EXCEED_PACK`
  when a trajectory's per-leg targets sum to more than a declared top-level
  `branchLengthTarget`. Declaring both and contradicting yourself is the
  authoring error worth catching.
- **Emitters:** `syzygy.ts:181` widens its `atPly <= 20` guard to `atPly <= 40`,
  so a 24-ply endgame candidate emits its real target instead of omitting it.
  `distill.ts:81`'s `length >= 2 && length <= 20` clamp widens to `<= 40` with
  it — it is the same literal ceiling, and leaving it at 20 would make a
  distilled 30-ply branch silently drop its target for a reason that no longer
  exists. Neither change moves a committed artifact: no committed candidate is
  re-emitted by this RFC.

**Schema/API surface touched.** Pack schema 0.16 (`difficulty`,
`trajectoryLeg`); `TrajectoryLeg`; `lint.ts`; `pack-validation.ts`;
`syzygy.ts`; `distill.ts`; `docs/drill-pack-format.md:60` (implementer updates
the stated band).

**Verified by** a test that fails today: `packages/schema/src/drill-pack.test.ts`
asserts a pack declaring `difficulty.branchLengthTarget: 23` validates, and a
`trajectory` pack whose three legs declare `22`/`22`/`22` validates; plus a lint
test asserting `SEGMENT_BEYOND_PLAN_BAND` fires for a `plan`-mode pack at 24 and
does not fire for an `outcome`-mode pack at 24. All are `SCHEMA_MAXIMUM` failures
today.

### §6. The guard grows past one scalar

**The friction as attested.** Wave 5a, in the author's own enumeration:
*"`guard.evalSwingCp` is the entire authored surface. Could not express: (a)
per-branch/per-deviation thresholds ... (b) 'always fire on a missed forced mate
regardless of cp' ... (c) any ply/phase window ... (d) separate tuning of the
deterministic rules tiers vs the recorded-engine tier (only global `null`
disables the latter)."* Each pack's number is a compromise averaged over its
branches, and the rationale lives in a `feedbackClaim` the runtime never reads.

**What ships today.** `pack.guard` is `{ evalSwingCp?: number | null }`
(`packages/schema/src/drill-pack/types.ts:137-139`, schema
`drill_pack.schema.json:59-70`). `applyRecordedEngineGuard`
(`apps/server/src/guard.ts:140-168`) early-returns entirely when `evalSwingCp ===
null` — which is why (b) and (d) are true: disabling the threshold also disables
mate detection (`engineSwing`'s mate branch, `guard.ts:134`) and there is no
knob at all for the deterministic tier `applyRulesGuard` (`guard.ts:90-108`).
The default threshold is the literal `200` at `guard.ts:150`.

**The fix.** `guard` grows four optional siblings; the existing `evalSwingCp`
keeps its exact meaning and its exact default, so every committed pack behaves
identically.

```json
"guard": {
  "evalSwingCp": 250,
  "fireOnMate": true,
  "rulesTier": true,
  "window": { "fromPly": 1, "toPly": 7 },
  "overrides": [
    { "at": { "spineNodeId": "b-damiano" }, "evalSwingCp": 120 }
  ]
}
```

| Field | Type | Default | Semantics |
|---|---|---|---|
| `evalSwingCp` | integer 50–1000, or `null` | `200` | unchanged: engine-tier centipawn threshold; `null` disables the **threshold**, no longer the tier |
| `fireOnMate` | boolean | `true` | the engine tier fires when the consequence is mate against the learner and the previous position was not, **independently of `evalSwingCp`** — including when `evalSwingCp` is `null`. This is sub-ask (b) and it inverts the current early return |
| `rulesTier` | boolean | `true` | `false` disables `applyRulesGuard`'s material and undefended-piece firings, leaving only the engine tier. Sub-ask (d) |
| `window` | `{fromPly: int ≥ 1, toPly: int ≥ 1}` | absent = every ply | both tiers fire only when the *consequence* node's `ply` is inside the inclusive window. Sub-ask (c) |
| `overrides` | array of `{at, evalSwingCp?, fireOnMate?}` | `[]` | per-subtree overrides. Sub-ask (a) |

**Override resolution** reuses shipped anchoring rather than inventing a second
scheme. `at` is a **`$defs/deviationLocation`** — the same union §2 widens, whose
members are `{spineNodeId}`, `{fen}` and (from §2) `{atStart: true}`. Note the
key is `spineNodeId`, *not* the `atSpineNode` of `$defs/simpleTrigger`; the two
vocabularies are distinct in the shipped schema (`:674-693` vs `:488-531`) and
this RFC does not merge them. Resolution reuses the shipped machinery for each
member: `{spineNodeId}` through `deviationAnchors`
(`packages/runtime/src/line.ts:160-164`, spine node id → transpose key),
`{fen}` through `transposeKey(at.fen)` as `line.ts:135` already does, and
`{atStart: true}` through `transposeKey(pack.start.fen)` as §2 adds. An override
applies to a decision triple when its anchor position appears on the path from
the root to the triple's `previous` node, inclusive. **The deepest matching
anchor wins; ties break by array order.** This makes "250cp everywhere except the
Damiano branch" one line, which is what wave 5a asked for.

**Refusals** (`pack-validation.ts`, beside `GUARD_WITHOUT_IMMEDIATE_GUARD` at
`:294-302`): `GUARD_WINDOW_EMPTY` (`fromPly > toPly`),
`GUARD_OVERRIDE_ANCHOR_UNKNOWN` (a `spineNodeId` that is not a spine node id;
`{fen}` and `{atStart}` anchors cannot be unknown),
`GUARD_OVERRIDE_DUPLICATE` (two overrides on one anchor),
`GUARD_DISABLES_EVERYTHING` (`rulesTier: false` **and** `evalSwingCp: null`
**and** `fireOnMate: false` — a guard block that guards nothing under
`immediate_guard`, the D12a silent-pass shape).

**Emitter (`--guard-cp`).** `emitPositionSeeds`
(`apps/server/src/sourcing/position-seeds.ts:236`) hard-codes
`feedbackPolicy: "immediate_guard"` with no `guard` block. It gains
`--guard-cp <int>` and `--guard-mate <bool>`, emitted into the pack **and into
`args`** (`position-seeds.ts:254`) so the `emissionJobDigest` changes with the
tuning and idempotence holds. Wave 5a's *"a batch cannot carry band-appropriate
tuning even though the batch KNOWS its rating band"* is answered without
hand-editing 24 sidecar-checked files.

**Capability publication.** `Capabilities.guardBasis`
(`apps/server/src/capabilities.ts:61`, `:192-194`) already publishes
`["rules"]` or `["rules", "engine"]`. It is unchanged and remains correct: the
new knobs tune tiers, they do not add one.

**Schema/API surface touched.** Pack schema 0.16 (`guard`); the `guard` type;
`guard.ts` (both entry points); `pack-validation.ts`; `position-seeds.ts`;
`candidate-emit.ts` argument parsing.

**Verified by** tests that fail today in `apps/server/src/guard.test.ts`:
(a) a pack with `{ evalSwingCp: null, fireOnMate: true }` fires on a
mate-against-learner consequence — today `guard.ts:147` returns empty;
(b) a pack with `overrides: [{ at: { spineNodeId: X }, evalSwingCp: 120 }]` and a
top-level `250` fires on a 130cp swing under X and not on the same swing
elsewhere; (c) a pack with `window: { fromPly: 1, toPly: 4 }` does not fire at
ply 6; (d) `rulesTier: false` suppresses the material firing that
`applyRulesGuard` produces today.

### §7. Candidate directories key per emission, not per row

**The friction as attested.** *"Candidate directory identity is per TSV row, not
per (row, side, split). Both mirrored packs of a family want skeletons from the
same row; the second emit overwrites `job.json`, so the committed candidate now
records only the most recent side (B90 dir: black; C02 main-line dir: white)"*
(Opening-wave row). Confirmed in the tree:
`content/candidates/b90-sicilian-defense-najdorf-variation-english-attack/job.json`
records `"learnerSide": "black"` and nothing records the white emit.

**Sharper than the ledger says** (now ledgered as **D31**).
The colliding identity is not only the directory — it is the **pack id**.
`openings.ts:93` computes `const id = slug(\`${eco}-${name}\`)`, uses it as both
the pack's `id` and the output directory name (`:139`), and the learner side
never enters either. Two sides of one row therefore produce two documents with
the **same pack id**. `PackRegistry.fromDocuments`
(`apps/server/src/pack-registry.ts:225-230`) refuses that with `Duplicate pack
id` — **but only when `replaceDuplicates !== true`**, and `loadDefault` sets
`replaceDuplicates: options.development === true` (`:307-310`), which is also the
only mode in which `content/drafts/` is loaded at all. So the mirrored pair has
**two** failure modes, not one: hard-refused on the production path, and
**silently last-write-wins on the development path** — one side of the family
disappearing from the registry with no diagnostic. The second is the worse of the
two and is the one an author would actually meet. Both are fixed by keying the id.

**No shipped pack is affected.** `loadDefault` reads
`schemas/drill_pack.example.json`, `content/packs/` (currently empty) and, in
development, `content/drafts/`; it never reads `content/candidates/`. Checked
across all 39 candidate directories and every draft: no two pack ids collide
today. The defect is latent in the emitter, not live in the registry, which is
why this is a format fix rather than an incident.

The syzygy emitter has the same shape: `syzygy.ts:133-136` keys on the position
label alone while `learnerSide` and `opponent` sit in `args` at `:195`.

**The fix.** Both emitters key the pack id and the output directory on the
**emission identity**, defined as the argument tuple that changes the emitted
document:

- `openings`: `${slug(eco-name)}-${learnerSide}` — `splitPly` is deliberately not
  in the key, because a re-emit at a different split is a *replacement* of the
  same drill, not a sibling, and the existing `emissionJobDigest` short-circuit
  (`openings.ts:148-154`) already re-emits it correctly in place.
- `syzygy`: `${baseId}-${learnerSide}` before the existing collision counter at
  `:132-136`, so `-2`, `-3` suffixes still disambiguate repeated labels within
  one side.
- `position-seeds`: unchanged. Its id is the puzzle id and the learner side is
  derived from the puzzle (`position-seeds.ts:217-220` for the id,
  `:232` for `side: learnerSide(row)`), so no two emissions collide.
- `explorer`: unchanged. It writes one fixed artifact directory
  (`explorer.ts:195`).

**Refusal, not silent overwrite.** Both emitters gain a guard before writing:
if the target directory exists, contains a `job.json` whose
`emissionJobDigest` differs, **and** whose `args` disagree with this emission on
any key-forming argument, throw `CANDIDATE_IDENTITY_COLLISION` naming both
argument sets. Today the mismatched-digest path at `openings.ts:148-154` falls
straight through to `writeCanonicalJson` and overwrites. This refusal is the
belt to the key's braces: it catches any future key-forming argument we forget
to add to the key.

**Content note, not content work.** **Nine** committed opening candidate
directories carry the old unkeyed names (A87, B12, B90, C02 ×2, C54, D02, D35,
E99), plus one syzygy directory (`endgame-rook-4v3-same-side-root`). They are
regenerable emitter output, not authored content; a content-era pass re-emits
both sides and deletes the unkeyed directories. **This RFC does not touch
`content/`**, so no `pack.json` changes and therefore no committed `packDigest`
in any `evidence.json` moves — `make sourcing-check` re-validates committed
artifacts (`apps/server/src/sourcing/check.ts:193-221`), it does not re-run the emitter.

**Schema/API surface touched.** `openings.ts`; `syzygy.ts`; no pack-schema
change.

**Verified by** a test that fails today in
`apps/server/src/sourcing/sourcing.test.ts`: emit the same ECO row twice with
`--learner-side white` and `--learner-side black` into a temporary output root,
and assert two directories exist, that their `pack.json` ids differ, and that
both `job.json` files record their own side. Today the second emit overwrites the
first and one side is lost.

### §8. Cursed wins and blessed losses: the admission rule (owner ruling 2026-08-15)

**The ruling.** From the **Cursed wins / blessed losses** row: *"scoped refusal, not blanket ...
The refusal attaches to the objective, never to the position: a cursed win may
not root a **Win** drill, because the 50-move rule makes 'finish the conversion'
unreachable no matter how well the learner plays ... The defender's side is
explicitly trainable: a blessed loss under **Hold/Save/Resist** is a legitimate
drill where the 50-move counter IS the resource being learned ... such roots must
be authored with the counter already advanced, so the pack is a short survival
segment, not a 100-ply march."*

**The contradiction is machine-provable from shipped code**, which is why this is
an admission rule and not a style guide. `objectiveRules` compiles
`outcomeRule("draw", objective.type === "win" ? "failed" : "achieved")`
(`apps/server/src/pack-orchestrator.ts:243`). On a cursed-win root under a **Win**
objective, the game's correct result is a draw, and a draw transitions the
objective to `failed` from every non-terminal state. The learner cannot pass, at
any strength. That is the definition of a drill that cannot be won.

#### §8a. The declared vocabulary

`assessedBy.category` is `enum: ["win", "loss", "draw"]`
(`schemas/drill_pack.schema.json:220`, `$defs/objectiveGrading`) and
`RootAssessment` matches
(`packages/schema/src/drill-pack/types.ts:174-182`). The tablebase
vocabulary is ten categories (`apps/server/src/tablebase.ts:5`). A cursed-win root
therefore cannot be declared at all today, and `verify-draft` would fail it with
`VERIFY_ASSESSMENT_CONTRADICTED` (`verify-draft.ts:135-136`) — a true refusal
with a misleading reason.

**Pack schema 0.16 widens the enum to exactly five determinate categories:**
`["win", "loss", "draw", "cursed-win", "blessed-loss"]`. The four indeterminate
ones (`syzygy-win`, `maybe-win`, `maybe-loss`, `syzygy-loss`) and `unknown` stay
out, deliberately: they express uncertainty about the game value, and a pack's
declared objective may not rest on an uncertain root. `verify-draft` gains
`VERIFY_ASSESSMENT_INDETERMINATE` for a queried root in that set, so the refusal
states its real reason instead of reading as a contradiction.

#### §8b. What is missing under the ruling, and what is not

The **Cursed wins / blessed losses** row says *"Runtime support already exists —
`objective.ts:197-203` `drawIsAvailable` adjudicates stalemate, insufficient
material, threefold AND `halfmoves >= 100`. What is missing is the *admission*
rule."* Half true — and the row's own line reference is one short; the function
runs to `:204`. The missing half is two separate defects, both now ledgered:

1. `drawIsAvailable` (`packages/runtime/src/objective.ts:197-204`) does read the
   halfmove clock. **Confirmed.**
2. **D29**. It is reachable only from
   `RulesFactPredicate` with `fact: "draw"` (`objective.ts:26-35`, evaluated
   `:221-222`). **But the pack format cannot express that fact**:
   `$defs/successCondition`'s `rules_fact` branch has
   `"fact": { "enum": ["checkmate", "stalemate"] }`
   (`schemas/drill_pack.schema.json:305`). This is a declared-vs-executable
   inversion — the runtime executes more than the format declares — and it is the
   exact mirror of D8. Fixed here.
3. **D30**. The *automatic* outcome rules cannot see it
   either. `terminalOutcome` (`packages/runtime/src/outcome.ts:5-11`) returns an
   outcome only when `position.isEnd()`, and chessops defines `isEnd` as
   `isInsufficientMaterial() || !hasDests()` (chessops 0.15.1,
   `packages/runtime/node_modules/chessops/dist/esm/chess.js:340-343`, verified
   against the installed package). **Neither the fifty-move rule nor threefold
   repetition is a terminal outcome in this runtime.** Fixed in **§9**, on the
   owner's 2026-08-15 ruling that this is a defect rather than an open question.

**§8 ships one format addition alongside the refusals** — the D29 fix. The
`rules_fact` enum gains `"draw"`, mapping to the shipped `rulesFact/draw`
predicate through the existing `successPredicate` branch
(`pack-orchestrator.ts:109-116`), which passes `condition.fact` through
unchanged. Zero runtime code changes; `conditionEvidenceRefs` already emits
`rulesEvidenceRef(condition.fact)` (`:133`).

**How a blessed-loss Hold pack actually grades, after §9.** Through the
automatic outcome rule, authoring nothing:
`outcomeRule("draw", "achieved")` (`pack-orchestrator.ts:243`) already transitions
a non-`win` objective to `achieved` on a draw, and §9 makes the fifty-move count
and the threefold repetition produce that draw. This is the path the owner's D30
ruling names, and it is the one §8's admission rule is written against.

The `rules_fact: "draw"` condition therefore is **not** the grading workaround it
was in the previous draft of this text; it earns its place on its own terms,
because `drawIsAvailable` answers a strictly wider question than `terminalOutcome`
does — *a draw is available here* (stalemate, insufficient material, threefold on
the path, or the counter exhausted) rather than *the game ended in a draw*. An
author who wants to grade "you reached a position you could claim" rather than
"the drill ended drawn" writes:

```json
{ "kind": "rules_fact", "fact": "draw", "to": "achieved" }
```

and that sentence is now expressible. Both paths ship; neither is load-bearing for
the other.

#### §8c. The admission rule

`pack-validation.ts:569-601` currently maps objective type → one expected
category (`:587-591`). It becomes a mapping to a **category set**, and the sets
are stated once as a shipped constant so the client capability can publish them.
The four keys below are exhaustive and total, not a selection: `grading` is
refused on any objective outside `["win", "hold", "save", "resist"]`
(`pack-validation.ts:403`, `:448`), so no fifth objective type can reach this
table.

| Objective | Admissible learner-perspective root categories |
|---|---|
| `win` | `win` |
| `hold` | `draw`, `cursed-win`, `blessed-loss` |
| `save`, `resist` | `loss`, `blessed-loss` |

The learner-perspective inversion already exists at `:580-586` and widens to use
the shipped ten-category table (`apps/server/src/tablebase.ts:11`) instead of its
local three-value `opposite`, which removes the duplicate inversion the wave-5c
verification had to reconcile by hand.

**Named refusals** (all errors, all at `/objective/grading/assessedBy/category`
unless stated):

| Code | Fires when |
|---|---|
| `CURSED_WIN_CANNOT_ROOT_WIN` | objective `win`, learner-perspective root category `cursed-win`. Message names the reason: the fifty-move rule makes the declared conversion unreachable, so the objective would grade `failed` on correct play (`pack-orchestrator.ts:243`) |
| `ASSESSMENT_CATEGORY_INDETERMINATE` | the declared or queried category is one of the four uncertainty categories or `unknown` |
| `ASSESSMENT_CATEGORY_MISMATCH` | the category is determinate but outside the objective's admissible set. Replaces `SYZYGY_ASSESSMENT_MISMATCH`'s single-value comparison; the old code is **kept** for the three original categories so existing expectations and messages do not churn |
| `RULE_DRAW_ROOT_NEEDS_SEGMENT_BUDGET` | at `/difficulty/branchLengthTarget`: a root whose category is `cursed-win` or `blessed-loss` under any outcome objective that does not declare `branchLengthTarget`, or declares one smaller than `100 - halfmoves` |

**The halfmove-clock rule is derived, not arbitrary.** The owner's constraint is
*"authored with the counter already advanced, so the pack is a short survival
segment, not a 100-ply march."* Encoded as: a rule-drawn root must be able to
reach the fifty-move draw **inside its own declared segment** —

```
100 - halfmoves(start.fen)  ≤  difficulty.branchLengthTarget  ≤  40   (§5's band)
```

which forces `halfmoves ≥ 60` at the loosest admissible setting and forces the
author to declare the budget rather than leave it implicit. A pack claiming a
20-ply survival segment must root at halfmove 80 or later. Nothing about this
number is invented here: 100 is the runtime's own threshold
(`objective.ts:200`), and 40 is §5's band.

**Both sides of the inequality are in plies, and that is why it is exact.** The
FEN halfmove clock counts plies since the last capture or pawn move, which is why
`drawIsAvailable` tests `position.halfmoves >= 100` for the fifty-*move* rule;
`branchLengthTarget` is likewise a ply count
(`docs/drill-pack-format.md:60` — *"accepts 2–20 plies"*). A root at halfmove `h`
therefore needs exactly `100 - h` further plies with no capture and no pawn move,
so `branchLengthTarget ≥ 100 - halfmoves` is the budget with no fence-post
correction. Two honest limits on what this rule buys:

- **It is a declared budget, not an executed one.** §5 established that nothing
  reads `branchLengthTarget` at runtime. The rule makes an author who declares a
  rule-drawn root state a segment long enough to contain the draw; it cannot make
  the draw arrive. It is an authoring-hygiene refusal, in the same family as
  `PERFECT_TABLEBASE_OUT_OF_RANGE`.
- **The budget is a floor, not a guarantee.** Any capture or pawn move resets the
  clock to zero, so a defender's real survival distance may exceed the declared
  target. That is the drill, not a defect in the rule: the counter is the resource
  the owner's ruling names, and resetting it is the attacker's whole method.

#### §8d. D8 compliance: capability, refusal, applied record

The declared-vs-executable law (`design/BACKLOG.md`, row **Declared-vs-executable
vocabulary law**) requires all three.

- **Capability publication.** `Capabilities`
  (`apps/server/src/capabilities.ts:57-68`) gains
  `assessmentCategories: readonly TablebaseCategory[]` — the five determinate
  categories — and `objectiveAssessmentSets: Readonly<Record<"win" | "hold" |
  "save" | "resist", readonly TablebaseCategory[]>>`, both emitted from the one
  constant the validator uses. A client can then say why a pack is inadmissible
  before the server refuses it.
- **Named refusal.** The four codes above, each with a message that states the
  rule rather than the symptom, following `PERFECT_TABLEBASE_OUT_OF_RANGE`
  (`pack-validation.ts:321-323`) as the shape.
- **Applied record.** The category that was actually queried is already recorded
  in the evidence ledger's `tablebase_result` values (`verify-draft.ts:82-84`
  emits `category`, `dtz`, `precise_dtz`, `dtm`), and the pack projection already
  carries `objective.grading` with its `grounding`
  (`pack-registry.ts:91-97`). §8 adds nothing new to persist; it makes the
  existing record sufficient by widening the vocabulary it may record.

**Schema/API surface touched.** Pack schema 0.16 (`assessedBy.category`,
`rules_fact.fact`); `RootAssessment`; `pack-validation.ts`; `capabilities.ts`;
`verify-draft.ts`.

**Verified by** tests that fail today:
(a) `apps/server/src/pack-authoring.test.ts` — a `win` pack declaring
`assessedBy.category: "cursed-win"` is refused with `CURSED_WIN_CANNOT_ROOT_WIN`
(today: `SCHEMA_ENUM`, the right outcome for the wrong reason);
(b) a `hold` pack declaring `blessed-loss`, `halfmoves` 82 in its start FEN and
`branchLengthTarget: 18` validates (today: `SCHEMA_ENUM`);
(c) the same pack with `branchLengthTarget: 8` is refused with
`RULE_DRAW_ROOT_NEEDS_SEGMENT_BUDGET`;
(d) `packages/runtime/src/objective.test.ts` or
`apps/server/src/outcome-grading.test.ts` — a
`hold` pack with `{ kind: "rules_fact", fact: "draw", to: "achieved" }` reaches
`achieved` on a node whose FEN has `halfmoves` 100 (today: `SCHEMA_ENUM` on the
condition, and no path from the format to `drawIsAvailable`).

### §9. D30 — the fifty-move rule and threefold repetition become terminal outcomes (owner ruling 2026-08-15)

**The ruling.** From the **D30** row: *"we're making drill packs — what do
you think should happen if someone achieves the goal that would ALWAYS resolve in
a draw in GM games? DRAW IS A COMMON OUTCOME IN TOURNAMENTS."* There is no
claim-versus-automatic question to settle: in a drill as in a game, a position
repeated three times or an exhausted fifty-move counter **is** a draw. The
outcome fires; grading resolves direction by objective, which
`pack-orchestrator.ts:243` already does correctly.

**Why it is in this wave.** §8's admission rule exists to make a blessed-loss Hold
pack gradable, and its grading path is the automatic draw rule. Without D30 that
path does not exist and §8 must grade through an authored condition instead — a
workaround the next RFC deletes. Shipping the defect fix alongside the admission
rule that depends on it is one commit; shipping them apart is two, the second of
which is a removal. It is also the smallest item in the wave: one function, one
guard, and no new vocabulary anywhere.

**The change, exactly.** `terminalOutcome`
(`packages/runtime/src/outcome.ts:5-11`) gains an optional third parameter and a
fallback branch. Nothing above the fallback moves:

```ts
export function terminalOutcome(
  position: Chess,
  learnerSide: "white" | "black",
  repetitionCount = 1,
): RunOutcome | undefined {
  if (position.isEnd()) {                                   // unchanged, and FIRST
    if (!position.isCheckmate()) return "draw";
    return position.turn === learnerSide ? "loss" : "win";
  }
  if (position.halfmoves >= 100 || repetitionCount >= 3) return "draw";
  return undefined;
}
```

**The ordering is normative, for two independent reasons that agree.** Chess:
checkmate ends the game, so a mate delivered at halfmove 100 is a mate, not a
draw. Software: evaluating the shipped `isEnd()` block first means the new code
can only ever turn a previous `undefined` into `"draw"` — it can never change a
`"win"`, `"loss"` or `"draw"` that a stored run already recorded. An
implementation that tests the counter first is wrong on both counts.

**Why the signature has to change.** The fifty-move half is a property of the
position (`position.halfmoves`). The threefold half is not: repetition is a
property of the *path*, which is why `drawIsAvailable` takes `(run, node)` and
counts path nodes sharing a `transposeKey` (`objective.ts:201-203`).
`transposeKey` is the first four FEN fields — placement, side to move, castling,
en passant (`packages/runtime/src/chess.ts:16-19`) — which is the repetition
identity, so the count is already computed correctly in the codebase and §9
reuses the same key rather than inventing one. The default of `1` makes every
existing two-argument call site behave exactly as today. Both real call sites can
supply it:

- `runtime.ts:340` has `run` and the freshly built `node`: count the nodes on
  `historyFrom(run, run.activeCursor.nodeId)` whose `transposeKey` equals the new
  node's, plus one for the new node.
- `events.ts:323` has the accumulated `nodes` and the event's node: walk the
  `parentId` chain and count the same way.

**What does NOT change, and must not be touched.**

- **How draws grade.** `outcomeRule("draw", objective.type === "win" ? "failed" :
  "achieved")` (`pack-orchestrator.ts:243`) is already exactly the owner's ruling.
  §9 changes when a draw *arrives*, never what it *means*.
- **The event.** `outcome.reached` keeps its shape and its closed `result`
  vocabulary `["win", "loss", "draw"]` (pinned by
  `packages/schema/src/drill-run.test.ts:247`). No run-schema change, no
  migration; the register stays at 18.
- **`drawIsAvailable` and the `rules_fact` path (§8b).** They answer the wider
  "a draw is available here" question and stay as they are.

**Replay compatibility with every stored run.** `events.ts:323-331` re-derives
`terminalOutcome` for each `outcome.reached` on every replay and throws on a
mismatch or on a non-terminal node. Because the fallback is strictly additive and
strictly last, no stored event can newly mismatch. The converse — a stored run
that played *past* a now-terminal node without an outcome event — also replays,
because `move.committed` (`events.ts:185-194`) performs no terminality check on
the parent; the commit-time guard lives at `runtime.ts:280` and is not re-applied
on replay. Stored runs are therefore unaffected in both directions, which is what
makes this a no-migration change rather than a data-shape change.

**Blast radius. There are three definitions of "terminal" in the tree and §9
moves one of them; the other two must be reconciled in the same commit.**

1. **`runtime.ts:280` — the commit guard**, `TERMINAL_OBJECTIVE_STATES.has(...) ||
   position.isEnd()`. For an outcome-graded pack the objective transition to
   `achieved`/`failed` catches the new draw, so play stops. For a pack whose
   objective compiles no draw rule — `play_until_checkpoint`, `follow_theory`,
   `run_trajectory`, or a plain position session — it does not, and the run would
   accept further moves after emitting `outcome.reached`, then emit a *second*
   `outcome.reached` at a later node. `events.ts:314` permits that (its
   uniqueness check is per node, not per branch), so nothing would catch it, and
   `story.ts:103` / `compare.ts:276` / `service.ts:510` would each pick a
   different one. **Fix: the guard gains "an `outcome.reached` event exists for
   the cursor node".** This is the one place §9 can produce a real defect if it
   is implemented as a one-line change to `outcome.ts` and nothing else.
2. **`service.ts:212-213` — `terminalPosition(fen)`**, an independent
   `Chess...isEnd()` used to refuse a group starting from a terminal node
   (`:772`), to refuse an active group position that is terminal (`:910`), and at
   `:1600`. It takes a bare FEN, so it can absorb the halfmove half but *cannot*
   see repetition. **Fix: widen it to `halfmoves >= 100` and leave repetition to
   the call sites that have a run** — and say so in a comment, because a
   FEN-only helper that silently under-reports terminality is exactly the shape
   this RFC is trying to remove elsewhere.
3. **`terminalOutcome` itself** — §9's subject.

**Consumers checked and requiring no change.** Every other reader treats
`outcome.reached` as "the branch ended" and switches on a `result` whose
vocabulary is unchanged: `story.ts:103-111` (pivotal/terminal slide selection),
`compare.ts:276-292`, `progress.ts:105-127`, `authored-feedback.ts:165`, `:254`,
`feedback.ts:7-26` (reveal gating), `service.ts:510-535`, `objective.ts:245`
(`outcomeReached` predicate), and on the client `App.svelte:598`, `:608`, `:611`,
`session-controller.ts:489`, `:565`, `:590`, `:599`, `GroupPanel.svelte:28-36`
and `DrillScreen.svelte:183`, `:227`, `:866` — the last of which already disables
commit while a terminal event exists (`:740`), so the board locks correctly on a
fifty-move draw with no client change. `storage.ts:2874` is a historical
migration-6 predicate over stored snapshots and is untouched. The one thing a
reader may now see that it could not before is an `outcome.reached` on a node
that still has legal moves; none of the above depends on the absence of legal
moves.

**Schema/API surface touched.** `packages/runtime/src/outcome.ts` (signature +
fallback); `runtime.ts` (call site + commit guard); `events.ts` (call site);
`apps/server/src/service.ts` (`terminalPosition`); no pack-schema change, no
run-schema change, no migration.

**Verified by** tests that fail today:
(a) `packages/runtime/src/outcome.test.ts` — committing the ply that takes a
position to `halfmoves` 100 emits `outcome.reached` with `outcome: "draw"`, and
the same position at `halfmoves` 99 emits none;
(b) the same file — a position reached for the third time on one path emits
`outcome.reached` with `"draw"`, and the second occurrence does not;
(c) a checkmate delivered at `halfmoves` 100 still emits `"win"`/`"loss"`, never
`"draw"` — the precedence law;
(d) `packages/runtime/src/runtime.test.ts` — a further `commitMove` from a node
carrying a fifty-move `outcome.reached` throws `RUN_TERMINATED`
(`packages/runtime/src/errors.ts:48-49`), including for a `play_until_checkpoint`
pack that compiles no draw rule;
(e) `apps/server/src/outcome-grading.test.ts` — a `hold` pack reaches
`achieved` and a `win` pack reaches `failed` on that same draw, with no authored
`successCondition` in either, through `pack-orchestrator.ts:243`;
(f) every existing run fixture in `apps/server/src/storage.test.ts` still
replays unchanged.

### §10. Refusal-code register for this wave

Every code introduced above, in one place, so no two items collide:

| Code | Section | Severity |
|---|---|---|
| `WALK_QUERY_BUDGET_EXCEEDED` | §1 | error (tool) |
| `START_TRIGGER_IN_WINDOW` | §3 | error |
| `START_TRIGGER_NOT_FIRST_LEG` | §3 | error |
| `VARIANT_PACK_UNKNOWN` | §4 | error |
| `VARIANT_SELF_REFERENCE` | §4 | error |
| `VARIANT_RELATION_UNPROVEN` | §4 | error |
| `SEGMENT_BEYOND_PLAN_BAND` | §5 | warning |
| `TRAJECTORY_LENGTHS_EXCEED_PACK` | §5 | error |
| `GUARD_WINDOW_EMPTY` | §6 | error |
| `GUARD_OVERRIDE_ANCHOR_UNKNOWN` | §6 | error |
| `GUARD_OVERRIDE_DUPLICATE` | §6 | error |
| `GUARD_DISABLES_EVERYTHING` | §6 | error |
| `CANDIDATE_IDENTITY_COLLISION` | §7 | error (emitter) |
| `CURSED_WIN_CANNOT_ROOT_WIN` | §8 | error |
| `ASSESSMENT_CATEGORY_INDETERMINATE` | §8 | error |
| `ASSESSMENT_CATEGORY_MISMATCH` | §8 | error |
| `RULE_DRAW_ROOT_NEEDS_SEGMENT_BUDGET` | §8 | error |
| `VERIFY_ASSESSMENT_INDETERMINATE` | §8 | error (verify-draft) |

Checked against every `"[A-Z_]{5,}"` literal in `apps/server/src`,
`packages/schema/src` and `packages/runtime/src` (251 codes): **none of the
eighteen collides with a shipped code**, including the near neighbours
`SYZYGY_ASSESSMENT_MISMATCH`, `GUARD_WITHOUT_IMMEDIATE_GUARD`,
`CANDIDATE_ALREADY_PROMOTED`, `VERIFY_ASSESSMENT_CONTRADICTED` and the twelve
`TRAJECTORY_*` codes.

**§9 introduces no new code** — it widens an existing refusal,
`RUN_TERMINATED` (`packages/runtime/src/errors.ts:48-49`), to cover a node that
is terminal by outcome rather than by `isEnd()`.

Existing codes whose scope changes: `THEORY_DEVIATION_NEEDS_SPINE_ANCHOR`
(narrows to `{fen}` only, §2), `CHECKPOINT_UNREACHABLE_AT_ROOT` (message gains
the `atStart` pointer, §3), `SYZYGY_ASSESSMENT_MISMATCH` (kept for the three
original categories, §8c), `RUN_TERMINATED` (widened, §9).

`LEG_LENGTH_WITHOUT_TRAJECTORY` is named in §5 only to record why it is **not**
shipped: the condition it would detect is impossible by construction.

### §11. Documentation the implementer updates

`docs/` is canonical description of what exists; this RFC does not edit it, and
the implementing commit must: `docs/drill-pack-format.md` (the deviation anchor
list, the trigger list, the `branchLengthTarget` band at `:60`, `variantOf`, the
`guard` block, the widened `assessedBy.category` and `rules_fact` vocabularies),
`docs/tablebase-grounding.md` (the walker, and the determinate/indeterminate
split), `docs/content-sourcing.md` (candidate keying, `--guard-cp`),
`docs/outcome-drill-grading.md` (the admission sets, the fifty-move draw
condition, and §9's two new terminal outcomes), `docs/development.md` (the
`make tablebase-walk` target), `docs/branch-runtime.md` (§9: when
`outcome.reached` fires, and that a terminal node may now have legal moves).

### §12. Ledger rows this wave ships

`design/` is intent tier and this RFC does not write to it. Three findings from
reading the code were proposed by an earlier draft of this section; the ledger's
single writer has since landed all three, so this section now records what this
RFC **ships** rather than what it proposes:

1. **D29** — `rules_fact` cannot express `draw`
   although the runtime executes it. Shipped by §8b.
2. **D30** — the fifty-move rule and threefold repetition are not
   terminal outcomes. **Ruled a defect by the owner on 2026-08-15**, not an open
   question. Shipped by §9. The earlier draft of this RFC deferred it and framed
   §8's authored condition as the substitute; that framing is withdrawn.
3. **D31** — the mirrored-side candidate collision is a pack-id
   collision. Shipped by §7, with the development-path `replaceDuplicates`
   refinement recorded there.

No new ledger row is proposed by this review. Two observations that did **not**
reach defect status are recorded in §Open questions instead, so they are not lost:
the per-branch gap in §3's `atStart` firing, and the two surviving `isEnd()`-based
definitions of "terminal" that §9 reconciles but does not unify.

When this RFC is archived, the RFC completion protocol flips `design/BACKLOG.md`
rows **Opening-wave authoring frictions** (candidate keying, first-move
alternatives), **On-ramp wave frictions** (guard scalar, emitter guard tuning),
**Endgame-wave frictions** (items 2 and 3), **Wave-4a follow-ups**
(first-move-alternative idiom), **Mates-batch frictions** (items 1, 2, 3),
**Cursed wins / blessed losses vs the outcome types**, and the defect rows
**D29**, **D30** and **D31**, in the same commit, leaving the out-of-scope items
of each row open with their attestation counts intact. **Match on row title, not
on line number** — these rows moved twice during this draft's review alone.

## Deviations from design

1. **The walker lands in TypeScript, not python-chess — an owner-facing
   divergence from an explicit ledger ask, flagged rather than absorbed.** The
   **Mates-batch frictions** row (item 3) asks for a *"python-chess
   harness"*, and wave 5c's log entry records installing python-chess to a
   scratchpad venv for the third time. This RFC does not do that. The two
   citations behind the refusal say what is claimed of them, quoted in full:
   `docs/development.md:9-10` — *"Go is reserved for self-contained data-format
   workers; Python is confined to the Dockerized Maia sidecar"* — and
   `design/research/stack-selection.md:197-198` — *"Scoped exception to 'no
   Python': Python may exist only inside worker containers speaking UCI/JSON,
   never in server code."* An authoring tool under `apps/server/src/sourcing/` is
   server code by both readings. Nothing in the friction requires
   python-chess — chessops already generates legal moves throughout the sourcing
   path, and the Lichess tablebase HTTP client already carries our lock, licence
   rationale and backoff. Divergence from a ledger row's wording, not from a
   design doc; §Open questions offers the owner the alternative.
2. **`difficulty.branchLengthTarget`'s band widens past both declared bands.**
   `design/01-training-model.md:98` states Plan Drill as an *8–20-ply segment* and
   `design/00-thesis.md:149` states the on-ramp as *2–8 plies*; the schema's 2–20
   is their union (`docs/drill-pack-format.md:60`), applied to every mode, which
   is what blocked a 23-ply mate. §5 widens the format band to 2–40 and adds
   `SEGMENT_BEYOND_PLAN_BAND` (warning) so the Plan Drill number still governs the
   mode it was written for; the on-ramp band is untouched. No design doc is
   edited; if the owner reads the widening as a design change rather than a format
   correction, §5 is the item to hold.
3. **Cursed win / blessed loss have no design-tier home.**
   The **Cursed wins / blessed losses** row records this explicitly — the concept exists in code
   and in `docs/tablebase-grounding.md` and *"appears nowhere in design tier"*.
   §8 implements the owner's ruling as recorded in the ledger row; the design-tier
   text for `design/01-training-model.md` §Outcome types is the owner's to write,
   and this RFC deliberately does not pre-empt it.
4. **§9 changes what a run records, on a defect ruling rather than a design
   ref.** No design doc states when `outcome.reached` fires; `design/01-training-model.md:81-91`
   states the outcome types and is unaffected, since §9 changes only *when* a draw
   arrives, never what a draw means for any objective. The authority is the owner's
   D30 ruling of 2026-08-15 (`design/BACKLOG.md`, row **D30**), quoted in §9. If the owner
   wants the design tier to state it before the code does, §9 is the item to hold —
   and §8b's authored `rules_fact: "draw"` condition then becomes the only grading
   path for a blessed-loss Hold pack until it lands.

Everything else is additive to shipped systems and diverges from no design doc.

## Acceptance criteria

1. `pnpm verify` (typecheck, tests, schema-check) passes; `make pack-check` and
   `make sourcing-check` pass on every file under `content/` unchanged, and no
   committed pack digest moves.
2. `schemas/drill_pack.schema.json` `$id` reads
   `urn:chess-tabiya:schema:drill-pack:0.16`, `DRILL_PACK_SCHEMA_VERSION` reads
   `"0.16"`, `packages/schema/src/drill-pack.test.ts` pins both, and
   `DRILL_RUN_SCHEMA_VERSION` still reads `"0.13"` with no new migration in
   `apps/server/src/storage.ts`.
3. **§1** — `make tablebase-walk FILE=content/drafts/philidor-third-rank-hold.json OFFLINE=1`
   emits a `tabiya.sourcing.walk.v1` report containing the root enumeration with
   `h6h8 → loss` from the learner's perspective and the eleven fixture-missing
   successors in `abstentions[]`, and writes no sidecar beside the draft. The
   cache criterion is the **online** one: a second `make tablebase-walk FILE=…`
   with no `OFFLINE` re-runs from `content/sources/syzygy/` with zero network
   requests.
4. **§2** — a `follow_theory` pack with an `{ atStart: true }` deviation
   validates, yields `classified_deviation` for a run playing that move, and
   releases its note through `projectAuthoredFeedback`.
5. **§3** — a run created for a pack with an `atStart` intent-capture checkpoint
   contains a `checkpoint.reached` event at the root before any commit, and the
   drill screen renders its sheet on load.
6. **§4** — `philidor-passive-rook-convert` validates with a `root_after_move`
   `variantOf` toward `philidor-third-rank-hold`; a falsified `moveUci` raises
   `VARIANT_RELATION_UNPROVEN`; a missing sibling raises `VARIANT_PACK_UNKNOWN`
   when a lookup is supplied and is silently accepted when none is. The reverse
   link is **not** asserted — no relation in the union is provable from the
   convert root back to the hold root (§4).
7. **§5** — a 23-ply `outcome` pack and a three-leg trajectory declaring 22 plies
   per leg both validate; a `plan` pack at 24 plies validates with
   `SEGMENT_BEYOND_PLAN_BAND`.
8. **§6** — all four wave-5a sub-asks have a passing test (§6's (a)–(d));
   `content/drafts/opening-principles-white.json` and the other four
   `evalSwingCp` packs validate and behave identically to today with no edits.
9. **§7** — emitting one ECO row for both learner sides produces two candidate
   directories with distinct pack ids and side-correct `job.json` files; a
   colliding re-emit raises `CANDIDATE_IDENTITY_COLLISION`.
10. **§8** — the four refusals fire on their cases; a blessed-loss Hold pack with
    an advanced halfmove clock validates, and a run of it reaches `achieved` at
    halfmove 100 **twice over**: automatically through
    `outcomeRule("draw", "achieved")` once §9 lands, and through an authored
    `{ kind: "rules_fact", fact: "draw" }` condition. `GET /capabilities`
    publishes `assessmentCategories` and `objectiveAssessmentSets`.
11. **§9** — the six tests in §9's *Verified by* pass; `runtime.ts:280` refuses a
    commit from a node carrying a fifty-move or threefold `outcome.reached`;
    `service.ts:212`'s `terminalPosition` agrees with `terminalOutcome` on the
    halfmove half; and **no stored-run fixture requires a migration**, which the
    unchanged migration `PRAGMA user_version` in `apps/server/src/storage.ts`
    demonstrates.
12. Every code in §10 is emitted by at least one test, and no shipped code is
    silently reused for a new meaning.
13. `docs/` files listed in §11 are updated in the implementing commit, and
    `design/BACKLOG.md` rows are flipped per §12 when the RFC is archived.

## Open questions

1. **Is 40 the right ceiling for `branchLengthTarget` (§5)?** It is chosen to fit
   K+R from the centre and one B+N leg, and to keep a rule-drawn survival segment
   under §8's derived halfmove floor at 60. A 66-ply single-segment B+N remains
   impossible by design, per the owner's phases ruling. If the owner wants a
   different ceiling, only two numbers change.
2. **Does the owner want python-chess blessed anyway (§1)?** The TypeScript
   walker is the doctrine-compliant reading and reuses four shipped modules.
   Blessing a Python authoring tool would need an explicit widening of the
   "Python only inside worker containers" exception in
   `design/research/stack-selection.md:197`, which is the owner's to grant.
3. **Should `hold` admit `cursed-win` (§8c)?** The ruling names the refusal for
   Win and the permission for the defender. A learner holding the *strong* side
   of a cursed win is drilling "your win is gone; take the draw" — arguably
   honest, arguably a confusing frame. The table admits it; if the owner wants it
   refused, one entry is removed and a fifth refusal code is added.
4. **Is the one-per-run firing of `atStart` acceptable for now (§3)?** A learner
   who rewinds to the root and forks is not asked the intent question again, even
   though rewind-and-branch is the core loop. Fixing it needs an orchestration
   entry point on `branch.forked`/`run.rewound`, which the `intent_capture`
   grading RFC needs anyway. §3 states the limit rather than hiding it; if the
   owner wants per-branch firing in this wave, it is one more entry point and one
   more test, not a redesign.
5. **Should the two surviving `isEnd()`-based definitions of "terminal" be
   unified (§9)?** §9 reconciles `service.ts:212`'s `terminalPosition` and
   `runtime.ts:280`'s commit guard with the widened `terminalOutcome`, but leaves
   three call sites answering the question three ways because two of them only
   have a FEN. A single `isTerminal(run, node)` helper would be cleaner and is a
   larger refactor than this wave should carry.
6. **Deferred to a named future RFC:** `intent_capture`'s validated-answer slot
   (3rd attestation, §Motivation) — it needs a run event, a run-schema bump, a
   migration and a client surface, and should be the next draft in this
   sequence. §3 here deliberately ships the placement half so that RFC inherits a
   root-addressable checkpoint.

## Changelog

- 2026-08-15: created.
- 2026-08-15: adversarial cross-review. **Every `design/BACKLOG.md` citation is
  now by row title, not line number** — the rows this RFC depends on moved twice
  during review (once when D29–D31 landed, once again mid-review), and every
  line-number citation in the original draft was stale by three. Corrected
  `syzygy.ts:177` → `:181` and `pack-orchestrator.test.ts` (which does not exist)
  → the real test homes; all 198 remaining `file:line` citations were checked to
  resolve. §12 rewritten from *proposed* rows to *shipped* rows now that D29–D31
  are ledgered. **Added §9** implementing the owner's D30 ruling, and withdrew
  §8b's "`terminalOutcome` is deliberately not changed" rationale; §§9–12 are the
  former §§8–11 renumbered. Fixed four claims that did not survive checking
  against the code: §1's OFFLINE behaviour (`offlineQuery` throws, it does not
  abstain, and the committed fixture covers 5 of the root's 16 legal moves),
  §4's reciprocity (no relation is provable from the convert root back to the
  hold root — enumerated), §6's override anchor vocabulary (`deviationLocation`
  uses `spineNodeId`, not `simpleTrigger`'s `atSpineNode`), and §7's "never
  registrable" (true only when `replaceDuplicates` is false; `loadDefault` sets
  it true in development, where the collision is silent instead). Recorded §3's
  one-per-run firing limit, §5's `distill.ts` ceiling, §8's declarative-only
  budget, and the refusal-code collision sweep.
