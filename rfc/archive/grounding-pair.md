# RFC: The grounding pair — `verify-draft` and the `perfect_tablebase` opponent policy

- **Status:** implemented
- **Author:** claude (drafted on the owner's polish-wave program)
- **Created:** 2026-08-14
- **Design refs:** `design/01-training-model.md:84-99` (hold/save against "strong or perfect
  resistance"; Outcome Drill "vs exact/human resistance"); `design/BACKLOG.md` rows
  "Endgame-wave frictions" (line 199, item 1), "Declared-vs-executable vocabulary law"
  (line 217), "Resistance spectrum: `perfect_tablebase` re-add decision" (line 220),
  "Resistance spectrum completion" (line 226)
- **Exploration gate:** exploration gate opened by owner ruling 2026-08-12 + breadth
  sequencing ruling 2026-08-11 (`rfc/README.md:75-89`); polish-wave drafting slot in
  `planning/roadmap-to-done.md:17` ("(c) grounding pair — `verify-draft`,
  `perfect_tablebase` policy")
- **Depends on:** `rfc/archive/content-sourcing-foundation.md` (artifact triple, canonical
  JSON, source lock), `rfc/archive/content-sourcing-syzygy.md` (tablebase query, evidence
  kinds, range boundary), `rfc/archive/outcome-drill-grading.md` (assessment admission),
  `rfc/archive/defect-sweep.md` (the declared-vs-executable law this RFC discharges),
  `rfc/archive/line-drill-theory-grading.md` (`policyModeApplied`),
  `rfc/archive/engine-workers.md` (selector seam)
- **Parent / amends:** follow-up to `archive/content-sourcing-syzygy.md` (§1) and
  `archive/engine-workers.md` + `archive/defect-sweep.md` §2b (§2)
- **Supersedes / superseded by:** —
- **Planning:** `planning/grounding-pair/` (once implementing)

**Wave claim (three-draft wave, 2026-08-14 second — claim #3 of 3, behind
`polish-surfaces` and `orphan-completion`, per `rfc/README.md:23-26`).** This RFC claims
**migration 18 (`STORAGE_VERSION` 17→18) and run schema 0.12→0.13**, both stamp-only
(§2g); baselines verified at drafting time: `STORAGE_VERSION = 17`
(`apps/server/src/storage.ts:387`), run `"0.12"` / pack `"0.15"`
(`packages/schema/src/index.ts:1-2`). Both predecessors were read after they landed and
both claim **no** migration number, `STORAGE_VERSION` change, or run/pack schema version
(`rfc/polish-surfaces.md:14-21`; `rfc/orphan-completion.md:19-24`), so migration 18 and
run 0.13 are unclaimed and this draft takes them; landing order still follows the wave
order. **No pack-schema version is claimed**: the
`opponentPolicy.mode` enum already contains `perfect_tablebase`
(`schemas/drill_pack.schema.json:642`) and the sidecar formats are versioned outside the
pack schema. Ownership pin taken: **the tablebase provider seam** (`apps/server/src/tablebase.ts`,
new) and **the flat-sidecar emitter** (`apps/server/src/sourcing/verify-draft.ts`, new).

## Summary

Two halves of one loop. (1) **`make verify-draft FILE=...`** queries every root, spine,
and deviation position of a hand-authored pack against the tablebase and writes the
evidence-ledger and source-manifest sidecars in the existing candidate formats, next to
the draft under the registry's existing flat sibling names — so the pack's
`assessedBy: syzygy` declaration becomes `ledger_verified` through the existing,
unmodified admission path. (2) **`perfect_tablebase`** becomes an executable opponent
mode: for positions of at most seven pieces the selector queries the tablebase and plays
a DTZ-optimal move, records `policyModeApplied: "perfect_tablebase"`, is
capability-published, and refuses by name above range or when the provider is absent —
never silently substituting another mode. Together they turn the six wave-5b endgame
packs from "declared, hand-checked" into machine-verified drills that can actually be
played against the exact defence their objectives are graded by.

## Motivation

Wave 5b landed six endgame packs whose every root, spine node, and category-stating
deviation was queried against `tablebase.lichess.org` by hand, catching three real
authoring errors pre-ship (`planning/content-era/log.md:1042-1054`). But the queries
survive only as provenance prose: `candidate-emit PIPELINE=syzygy` mints *new* spine-less
packs from a FEN list and cannot ground an *existing* authored draft
(`planning/content-era/log.md:1078-1084`), so all six carry `assessedBy: syzygy` as
declared, not ledger-verified — the BACKLOG names a `verify-draft` command "the cheapest
grounding win in the repo" (`design/BACKLOG.md:199`). Meanwhile the packs' own
graduation blockers state the other half of the gap: "Exact tablebase grading is
available for this root but `perfect_tablebase` is a declared mode this deployment
cannot select; the opponent is human_common and can deviate from best play"
(emitter string at `apps/server/src/sourcing/syzygy.ts:173`; the mode has sat in
`DECLARED_UNIMPLEMENTED_POLICY_MODES` since the defect sweep,
`apps/server/src/capabilities.ts:23-26`). A hold drill graded "draw is success" against
an opponent that can blunder is not a drill against exact defence. One RFC, because each
half alone leaves the packs half-grounded: verified assessments drilled against fallible
resistance, or perfect resistance defending unverified claims.

Out of scope: prose generation or any new machine-prose crossing (B6a registers none for
tablebase evidence — `docs/content-sourcing.md:76-78`), pack promotion, rewriting the six
drafts' authored text (content-tier, the authoring agent's territory), local Syzygy file
probing (nothing in the repo ships `.rtbw`/`.rtbz` handling — verified across
`compose.yaml`, `deploy/`, `workers/`; the only tablebase the repo knows is the
`tablebase.lichess.org/standard` HTTP client at `apps/server/src/sourcing/syzygy.ts:103-119`),
and the variants-rule / `beforeFirstMove` frictions (BACKLOG rows of their own,
`design/BACKLOG.md:199` items 2-3).

## Specification

### 1. `make verify-draft FILE=<pack>.json`

**1a. Surface.** New Makefile target following the existing esbuild-bundle pattern
(`Makefile:23-26`, `:45-59`): bundles `apps/server/src/sourcing/verify-draft.ts`, runs it
on `$(abspath $(FILE))`. `OFFLINE=1` swaps `liveTablebaseQuery` for a per-FEN fixture
map (a new fixtures directory keyed by FEN; the existing single-payload
`fixtureTablebaseQuery` at `syzygy.ts:88-101` cannot distinguish positions and stays for
the emitter).

**1b. Input contract.** The file must pass `validatePackDocument` and declare
`objective.grading.assessedBy.kind: "syzygy"`; otherwise the command fails typed
(`SourcingError` codes `DRAFT_PACK_INVALID` / `VERIFY_ASSESSMENT_NOT_SYZYGY`). Any pack
path is accepted; `content/drafts/` is the target population. Note the input's root is
always in range: pack validation already refuses a syzygy declaration above seven pieces
(`SYZYGY_ASSESSMENT_OUT_OF_RANGE`, `apps/server/src/pack-validation.ts:566-577`).

**1c. Position enumeration.** Walk with chessops exactly as the emitters do: the root
FEN; the position after every spine node (depth-first over `spine[].children`); and for
every deviation, the position after applying `moveUci` at its location (`at.spineNodeId`
→ that node's derived position; `at.fen` → that FEN). Positions are deduplicated by full
FEN. An illegal walk is a hard error.

**1d. Range and abstention.** For each position, `countFenPieces` decides:
at most seven → query; eight or more → an abstention record with `reason: "out_of_range"`
and the exact count, mirroring the emitter's shape (`syzygy.ts:168`). Since a chess move
never increases the piece count (promotion swaps a pawn for a piece, castling moves two,
captures and en passant decrease), every position derived from the in-range root is in
range; abstentions can arise only from free-FEN deviation anchors — the schema's
`at.fen` variant accepts any position — and the ledger's separate `abstentions` array
records them honestly rather than skipping them (linkage validates abstentions exactly
like records, `ledger-validation.ts:324-326`), so an out-of-range deviation anchor
never silently vanishes and never blocks the root admission, which reads only the root
record (§1g).

**1e. Queries.** Through the existing `liveTablebaseQuery` (`syzygy.ts:103-119`):
serialized under `content/sources/.fetch.lock`, 60/120/240-second retry on 429/5xx,
immediate failure on 4xx (`docs/content-sourcing.md:50-54`). This is the batch politeness
posture, correct for an operator command; the runtime selector in §2 uses the interactive
posture instead. Each answer contributes a `syzygy` `SourceEntry` under the
`no-rights-asserted` licence with `TABLEBASE_RATIONALE` (`syzygy.ts:18`).

**1f. Sidecar emission — existing formats, existing names.** The command writes
`tabiya.sourcing.evidence.v1` and `tabiya.sourcing.manifest.v1` documents via
`writeCanonicalJson` (RFC 8785 + trailing newline), under the registry's flat sibling
names `<stem>.evidence.json` / `<stem>.sources.json` (`sidecarPaths`,
`apps/server/src/pack-registry.ts:185-202`), plus `<stem>.job.json` recording resolved
arguments and the deterministic job digest. All three basenames are already reserved
from pack discovery (`SIDECAR_BASENAMES` includes `job.json`; suffix rule at
`pack-registry.ts:17-22,168-172`). Records:

- root: one `position_legality` record (the emitter's shape, `syzygy.ts:142-150`) and one
  `tablebase_result` record, both supporting `/start/fen`;
- each spine position: a `tablebase_result` supporting that node's
  `/spine/.../moveUci` pointer;
- each deviation position: a `tablebase_result` supporting `/deviations/<i>/moveUci`.

Never a prose pointer and never `/deviations/<i>/class` — the checker's
`EVIDENCE_OVERREACH` boundaries stand unchanged (`apps/server/src/sourcing/check.ts:30-36,122-125`);
the tablebase grounds categories, not reasons. The draft file itself is ingested via
`ingestLocalFile` as a `no-rights-asserted` source entry (the author's own pack), which
anchors the `position_legality` record and any abstentions so `MANIFEST_ENTRY_UNUSED`
stays green. `sourcedAt` is derived as the maximum consumed `retrievedAt`
(`apps/server/src/sourcing/ledger-validation.ts:365-377`); `packId`/`packVersion`/
`packDigest` bind via `digestDrillPack`. One rule the single-query emitter never needed:
manifest entries are **deduplicated by `(sourceId, retrievedAt)`** — the manifest refuses
duplicate pairs (`MANIFEST_DUPLICATE_ENTRY`, `ledger-validation.ts:243-245`) while any
number of records may link to one entry (linkage matches records to entries by that same
pair) — so many queries answered in the same instant, and the offline fixture map's
shared fixture timestamps, collapse to one entry instead of an invalid manifest.

**1g. Stamping the declaration — provenance yes, truth never.** Admission is a strict
nine-condition match on the root record (`ledger-validation.ts:395-406`): kind,
machine-validation grounds, FEN, category, pieceCount, sourceId, retrievedAt,
`/start/fen` support, and ledger packId. Two of those — `retrievedAt`, `sourceId` — are
retrieval provenance that a hand author typed from a scratchpad harness and a fresh query
necessarily changes. Following the `candidate-attach` atomic pack-plus-sidecar precedent
(`docs/content-sourcing.md:122-128`), `verify-draft` rewrites exactly those two fields of
`objective.grading.assessedBy` to the fresh root query's values, then writes the sidecars
against the resulting digest. It **never** rewrites `category` or `pieceCount`: if the
queried category or the census contradicts the declaration, the command fails
`VERIFY_ASSESSMENT_CONTRADICTED` and writes nothing — a wrong chess claim is surfaced,
not repaired by the tool (law 8). "Contradicts" is byte equality: the declaration's
closed `win | loss | draw` enum must equal the queried category exactly, so an API
answer of `cursed-win` or `blessed-loss` (a win or loss spoiled by the 50-move rule)
contradicts a declared `win`/`loss` — correctly, since the objective it grades is not
achievable over the board. The failure mode for all six wave-5b packs is therefore
**fix-the-pack, never weaken-the-check**: the admission match and its nine conditions
are not edited by this RFC, the only fields the tool may touch are the two retrieval
stamps, and a pack that fails on any other condition is corrected in `content/` (the
authoring agent's territory) and re-verified.

**1h. Category-regression gate.** Using the same learner-perspective mapping as pack
validation (`pack-validation.ts:578-588`), a **learner** spine move whose resulting
learner-perspective category is worse than its parent's fails the command
(`VERIFY_SPINE_CATEGORY_REGRESSION`) — this automates precisely the hand method wave 5b
used ("every spine move verified category-preserving for the learner",
`planning/content-era/log.md:1042-1054`). An **opponent** spine move that changes the
category is a command warning, not an error: authored sub-optimal resistance is an
authoring choice, and the queried fact is recorded either way.

**1i. Exit gate — the existing admission path, closed in-process.** After writing, the
command re-validates ledger and manifest, runs `linkage` and the evidence-semantics
checks, and requires `assessmentGrounding({document, ledger, manifest})` to return
`"ledger_verified"` (`ledger-validation.ts:380-408`) — the same function registry
admission calls (`pack-registry.ts:235`), fed by the same flat-sidecar loading the
development registry already performs (`pack-registry.ts:296-305`). No new trust
machinery, no registry change, no new admission rule: the command's entire job is to
produce artifacts the shipped verifier already accepts. The advisory/strict boundary of
`sourcing-check` is untouched (`check.ts:193-196`); hand-authored packs acquire no
sidecar *requirement*, only the option.

### 2. `perfect_tablebase` — from declared to executable

**2a. The vocabulary move.** `RUN_OPPONENT_MODES` gains `"perfect_tablebase"`
(`packages/runtime/src/types.ts:38-42`); the entry is deleted from
`DECLARED_UNIMPLEMENTED_POLICY_MODES` (`capabilities.ts:17-28`). The pack schema is not
edited — the enum already holds all seven modes (`schemas/drill_pack.schema.json:636-645`).
The binding test's two assertions — schema enum equals supported ∪ declared as sets, and
the partitions are disjoint (`apps/server/src/pack-authoring.test.ts:43-61`) — pass
mechanically after the move; that partition-shift-without-schema-edit is exactly the
transition `defect-sweep.md` §2b built the test for.

**2b. Provider.** A new interactive tablebase client (`apps/server/src/tablebase.ts`)
against `tablebase.lichess.org/standard` — the only tablebase this repo ships (§Motivation).
It adopts the corpus client's interactive posture verbatim as the politeness model
(`apps/server/src/corpus.ts:85-128`; documented at `docs/runtime-corpus-evidence.md:21-26`):
512-entry in-memory LRU; identical-request coalescing; one upstream request at a time
with a small bounded queue; four-second dispatch budget; 60-second negative cache for
429/5xx/network failures; repository-identifying user-agent; never takes the batch
`.fetch.lock`, never writes source artifacts, never substitutes a different answer. This
meets the operator's published guidance: neither the tablebase endpoint spec nor the
`lila-tablebase` README states a tablebase-specific limit, and the Lichess API's general
rate-limiting section asks exactly what both postures already do — "Only make one
request at a time" and, on a 429, that "waiting one minute before retrying will be
sufficient" (https://lichess.org/api §Rate limiting; the interactive 60-second negative
cache and the batch 60/120/240 ladder both wait at least that minute). One
deliberate divergence from the corpus posture: positive entries have no TTL — a
tablebase category/DTZ is immutable mathematics, so only the LRU bounds retention.
Deployments with real engines enable it by default; mock deployments wire a fixture
provider; `CapabilityProviders` gains `tablebase: "lichess" | "mock" | "none"`
(`capabilities.ts:48-53`).

**2c. Selection semantics.** Selector modes are dispatched at
`opponent-selector.ts:430-441`; `perfect_tablebase` becomes a fourth case. It applies
only to positions of at most seven pieces, queried with the position's true halfmove
clock (DTZ and category depend on it). Categories are taken exactly as the API reports
them for that clock — the full lattice including `cursed-win` and `blessed-loss`, each
its own rung, never conflated with `win`/`loss` — so "category-preserving" already
encodes the 50-move boundary: a move that lets a win decay to a cursed win changes
category and is excluded while any true-category-preserving move exists. The move choice
is deterministic **DTZ-optimal**: restrict to moves preserving the selector side's
category; when winning, minimize the resulting distance-to-zeroing (progress that is
immune to 50-move draws — the actual content of the "exact defence" claim, which DTM
optimality does not guarantee); when losing, maximize it (longest resistance); when the
category is drawn, every category-preserving move ties by definition; **all ties — equal
DTZ, null DTZ, or the drawn case — break to the lexicographically least UCI**, so two
runs, or two branches of one group, replaying the same position always receive the same
reply. No seed participates — the selection is a pure function of the position — the
existing cache key (`opponent-selector.ts:180-184`) applies unchanged, and the
branch-group fixed-resistance reply journal is satisfied trivially: a pure function
cannot disagree with its own journal. The tablebase's ranked moves are recorded as `SelectionCandidate`s
(rank, no mass). The recorded identity is synthetic but honest:
`{id: "lichess-tablebase", name: "Syzygy (tablebase.lichess.org/standard)", version: "7man", seedHonored: true}` —
here the determinism claim is real, unlike Maia's recorded `seedHonored: false`
(`docs/engine-workers.md:87-89`).

**2d. Applied record.** Every selection records
`policyModeApplied: "perfect_tablebase"`. The type widens automatically through
`PolicyModeApplied = RunOpponentMode | "enumerated" | "unknown"` (`types.ts:44`); the
narrowed unions widen by hand: `makeSelection` (`opponent-selector.ts:263-275`), the REST
literal list (`apps/server/src/rest.ts:188-202`), the client mode unions
(`apps/web/src/lib/api.ts:250-257`, `session-controller.ts:137-156`). Group-reply
compatibility (`apps/server/src/service.ts:897`) and pivotal-move filtering inherit the
widened type without behavior change.

**2e. Refusals — all named, none silent.**

- *Static:* a pack declaring `perfect_tablebase` whose root exceeds seven pieces is
  refused at validation, `PERFECT_TABLEBASE_OUT_OF_RANGE` at `/opponentPolicy/mode`
  (alongside the mode check at `pack-validation.ts:304-320`). Monotone piece count means
  the root gate covers every reachable position of the run.
- *Capability:* `availableModes()` (`opponent-selector.ts:389-396`) includes the mode iff
  the provider is configured; `/capabilities` `policyModes` reflects it
  (`capabilities.ts:180`); position sessions keep their existing refusal
  (`service.ts:559`) and their two-mode union (`types.ts:59-61`) — Just Play is unchanged.
- *Runtime:* provider absent, unreachable, timed out, or negative-cached →
  `TABLEBASE_UNAVAILABLE`, HTTP 503 with `retryAfterMs`, the `ENGINE_UNAVAILABLE` shape
  (`apps/server/src/errors.ts:74-83`); a mid-run position over seven pieces (unreachable
  by monotonicity, guarded anyway) → `TABLEBASE_OUT_OF_RANGE`, 422. **The selector never
  falls through to another mode.** This is the deliberate opposite of `theory_strict`'s
  audible off-spine fallback (`opponent-selector.ts:497-504`): theory has an
  in-vocabulary honest substitute and records the substitute's true mode; perfect play
  has none, and a `strong_engine` move presented as exact defence is precisely the
  misrepresentation `policyModeApplied` exists to prevent.
- *Client:* substitution may occur only at session negotiation, before any move, through
  the capabilities payload (`session-controller.ts:137-156`), and the existing
  requested-versus-applied surface discloses it (`docs/outcome-drill-grading.md:85-96`).
  Mid-run, `TABLEBASE_UNAVAILABLE` is surfaced, the turn does not advance, and switching
  resistance is an explicit learner action recorded under its true mode.

**2f. The D8 law, discharged.** The declared-vs-executable rule
(`rfc/archive/defect-sweep.md:296-299`) admits a value into the executable partition only
with: (1) **capability publication** — `policyModes` plus `providers.tablebase` (§2b, §2e);
(2) **a named refusal** — the four typed refusals of §2e; (3) **an applied record** —
`policyModeApplied` on every selection (§2d). This is the same three-legged path
`immediate_guard` took (`rfc/archive/onramp-guard.md:33,293`), completing the third of the
three designs the law has decided (`design/BACKLOG.md:217`).

**2g. Versioning.** Run schema 0.12 → 0.13: `RunOpponentMode` and `PolicyModeApplied`
widen on the persisted `opponent.move_selected` selection and the session's opponent
policy. Migration 18 (`STORAGE_VERSION` 17→18) is stamp-only with frozen literals
`"0.12"` → `"0.13"` — mandatory because reads filter on the current run-schema version;
the precedents are migrations 11 and 16 (`rfc/README.md:110,115`). No data rewrite
exists to do; historical selections keep their recorded values and only pre-v0.7 plies
remain `"unknown"` (`apps/server/src/storage.ts:2113,2920`).

**2h. Follow-through strings and docs (implementation-time edits).** The emitter blocker
sentence at `syzygy.ts:173` and its assertion at `syzygy.test.ts:143` claim the
deployment cannot select the mode — after this RFC that claim is false and both change to
state the mode is selectable where the provider is published. Docs to update on landing:
`docs/outcome-drill-grading.md:119-121`, `docs/engine-workers.md:242`,
`docs/content-sourcing.md:96-98`. The six drafts' authored blocker sentences are
content-tier and belong to the authoring agent.

### 3. Why one RFC

`verify-draft` makes "this position is a win/draw" ledger-verified;
`perfect_tablebase` makes "play it out against exact defence" executable. The wave-5b
hold/save drills need both to mean what they say: a verified draw defended by a fallible
opponent, or a perfect opponent defending an unverified claim, are each half a drill.
The two halves share their entire foundation (the tablebase client family, the range
census, the category perspective mapping) and neither adds trust machinery — one closes
the sourcing loop, the other closes the resistance loop, over contracts that already
ship.

## Deviations from design

One record correction rather than a design deviation: the resistance-spectrum ledger row
once said `perfect_tablebase` "was deleted by the D8 fix". It was not — the defect sweep
deleted `immediate_blunder_guard` and deliberately *kept* `perfect_tablebase` declared
with a checked refusal (`rfc/archive/defect-sweep.md:399-416`; the enum member is live at
`schemas/drill_pack.schema.json:642`). The row now carries this draft's correction
("Record corrected 2026-08-14 (grounding-pair draft): `perfect_tablebase` was NOT
deleted", `design/BACKLOG.md:226`). This RFC's §2 is therefore a partition move, not a
re-add. No other deviation: none.

## Acceptance criteria

1. **Six fixtures, closed loop.** `make verify-draft FILE=content/drafts/<pack>.json`
   for all six wave-5b packs (`lucena-bridge-convert`, `philidor-third-rank-hold`,
   `pawn-opposition-convert`, `pawn-breakthrough-convert`,
   `opposite-bishops-fortress-hold`, `queen-vs-pawn-seventh-convert`) exits 0, writes the
   three flat sidecars each, changes only the two stamped `assessedBy` fields in each
   pack, and a development `PackRegistry.loadDefault` projects
   `assessmentGrounding: "ledger_verified"` for all six — retiring the
   "no authored pack in the repository" limit (`docs/outcome-drill-grading.md:116-118`).
   The offline path passes in CI via per-FEN fixtures.
2. **Tamper honesty.** Editing a spine move after verification yields the
   `EVIDENCE_DIGEST_STALE` warning on inspection and admission stays on the recorded
   digest rules; flipping the declared category fails `VERIFY_ASSESSMENT_CONTRADICTED`
   with no sidecars written; removing a manifest entry demotes admission to `unverified`.
3. **Regression gate.** A fixture pack whose learner spine move loses the queried
   category fails `VERIFY_SPINE_CATEGORY_REGRESSION`; an opponent spine move that
   changes category passes with a warning and a recorded fact.
4. **Deterministic perfect play.** Against fixtures, `perfect_tablebase` returns the
   same DTZ-optimal move on every call with `policyModeApplied: "perfect_tablebase"`,
   ranked candidates, and the synthetic identity; a Lucena-defence fixture shows the
   selector holding the tablebase defence.
5. **Named refusals.** Provider `none`: the mode is absent from `/capabilities` and
   `availableModes()`, and run negotiation discloses any substitution before the first
   move. Mid-run provider outage: `TABLEBASE_UNAVAILABLE` (503, `retryAfterMs`), no move
   committed under any other mode. An eight-piece root with the mode:
   `PERFECT_TABLEBASE_OUT_OF_RANGE` at validation.
6. **Bindings and registers.** The pack-authoring set-equality and disjointness
   assertions pass with the moved partition and no schema edit; migration 18 is
   stamp-only and existing runs replay unchanged; `make verify` is green; strict
   `sourcing-check` behavior on `content/candidates/` is unchanged.

## Open questions

None.

## Changelog

- 2026-08-14: created; wave claim #3 registered (migration 18, run 0.13, no pack-schema
  claim) after reading both landed predecessors, which claim no versioned resource.
- 2026-08-14 (adversarial review, fixed in place): §1d states why free-FEN abstentions
  neither vanish nor block root admission and completes the piece-count argument
  (promotion swaps, never adds); §1f adds the `(sourceId, retrievedAt)` manifest
  dedup rule the multi-query command needs (`MANIFEST_DUPLICATE_ENTRY`); §1g pins
  "contradicts" to byte equality — `cursed-win`/`blessed-loss` contradict a declared
  `win`/`loss` — and states the fix-the-pack-never-weaken-the-check failure mode for
  the six wave-5b packs; §2b cites the operator's actual published guidance
  (https://lichess.org/api §Rate limiting: one request at a time, one minute after a
  429) and shows both postures meet it; §2c pins the full API category lattice as its
  own rungs and extends the lexicographic-UCI tiebreak to every tie (equal DTZ, drawn
  category), adding the group reply-journal consequence; Deviations updated to record
  that the BACKLOG row now carries this draft's correction.
- 2026-08-14 (implementation review): approved. The official lila-tablebase
  response example confirms each move category is reported for the resulting
  position's side to move, so the selector must invert it before applying the
  RFC's selector-side category comparison. This is an implementation pin on
  §2c, not a change to its semantics.
