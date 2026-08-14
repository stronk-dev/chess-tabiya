# RFC: Orphan completion — comparison narrative and strips, session distillation, event-fact recommender

- **Status:** draft
- **Author:** claude (for owner review)
- **Created:** 2026-08-14
- **Design refs:** `design/02-product-shape.md:180-183` (compare mode: difference strip + narrative
  mode); `design/03-product-breadth.md:62` (review surface list), `:283` (B3 residual), `:286` (B6
  correction), `:287` (B7 correction), `:374-378` (program items 5–7)
- **Exploration gate:** opened by owner ruling 2026-08-12 (`rfc/README.md:75-82`); breadth
  sequencing ruling 2026-08-11 (`rfc/README.md:84-89`); the three orphans were scheduled into the
  2026-08-14 polish wave by the owner (`design/BACKLOG.md:221-223`)
- **Depends on:** `archive/n-way-comparison.md`, `archive/game-import-and-story.md`,
  `archive/adaptive-guidance.md`, `archive/pack-studio.md`, `archive/shape-library.md`,
  `archive/return-and-progression.md`, `archive/repertoire-gap-finding.md` (all implemented)
- **Parent / amends:** the comparison, studio, and progression systems above
- **Supersedes / superseded by:** —
- **Planning:** `planning/orphan-completion/` (once implementing)
- **Wave claim:** second in the 2026-08-14 (second) three-draft wave (`rfc/README.md:23-26`).
  This draft claims **no migration number, no `STORAGE_VERSION` change, no pack-schema version,
  and no new table**. Its shared implementation surfaces, named for the sibling drafts:
  `apps/web/src/lib/CompareView.svelte` (additive sections), the `/learn` screen (one additive
  section), and the voice-scope union at `apps/server/src/rest.ts:1068` (one added member).

## Summary

The 2026-08-14 forward trace found six true orphans among ~103 design commitments; the three
scheduled into this wave are the compare surface's promised storytelling forms (narrative mode and
difference strips), session distillation (completed run → pack seed), and the opt-in recommender
(`planning/traceability-forward.md:155-169`, `design/BACKLOG.md:220-223`). All three are thin
derived slices over machinery that already shipped: the strips and narrative are deterministic
projections over the N-way comparison payload rendered with the story system's sentence and voice
discipline; distillation is the once-reviewed extract from the original pack-studio draft §6
(`rfc/archive/pack-studio.md:710-831`), landed through the existing studio write path with the
already-reserved `seed_kind = 'run'` (`apps/server/src/storage.ts:2601`); the recommender is a
read-only projection whose grammar is pinned to event facts the product already records. Each
slice carries an explicit Law-8 boundary and a browser-test acceptance gate.

## Motivation

### Verified absent

| Promise | Where promised | Verified state today |
|---|---|---|
| Narrative mode (causal, not move-by-move) | `design/02:180-183`, `design/03:62` | zero hits for "narrative" in `apps/web/src` and `apps/server/src`; `CompareView.svelte` (109 lines) renders boards, an aligned stepper, per-branch score lists and a leaf structural reading — no strip band, no narrative form |
| Difference strips (eval trajectory, structure changes, timing events, key piece routes) | `design/02:180-181`, `design/03:283` B3 residual | the comparison payload carries per-branch recorded evidence (`packages/runtime/src/compare.ts:60-67,104`) but no strip projection exists in runtime, server, or client |
| Session distillation | `design/03:286` (B6 correction), `design/03:377` | `seed_kind` CHECK already reserves `'run'` with zero producers (`storage.ts:2601`); `"session_distilled"` appears only in a schema test fixture (`packages/schema/src/drill-pack.test.ts:210`); `docs/pack-studio.md:53-55` names distillation as not-yet |
| Opt-in recommender | `design/03:287` (B7 correction), `design/03:74-75` | zero hits for "recommend" in `apps/server/src`; `docs/return-and-progression.md:59-60` states the disclaimer; the archived spec section (`rfc/archive/return-and-progression.md:795-811`) was never implemented |

### Scope boundary

In scope: the three orphans above, each as the smallest slice that makes the design promise true
over shipped machinery. Out of scope: branch race (explicitly experimental,
`design/02:182-183`); bulk personal-PGN history import (`design/BACKLOG.md:66` stays a ledger
row; ADR-0003 makes it optional forever); any pack-schema or persisted-shape change; the other
three forward-trace orphans (events layer, resistance spectrum, tracks — separately ledgered).

## Specification

### 1. Comparison narrative and difference strips (B3 residual)

Both are **derived projections in `@chess-tabiya/runtime`** (new module
`packages/runtime/src/compare-strips.ts`, exported from `index.ts`), computed from a `DrillRun`
plus an already-computed `BranchComparison` (`compare.ts:98-107`). No wire change to
`GET /runs/:id/compare` (`apps/server/src/rest.ts:1257-1263`): the client already holds both
inputs (`CompareView.svelte:12-21`), so strips and deterministic narrative are client projections
of data the viewer already holds — the same argument that keeps markers client-enforced
(`docs/adaptive-guidance.md:52-54`). The server calls the identical functions when assembling the
voice packet, so there is exactly one narrative builder.

#### 1a. `comparisonStrips(run, comparison): Readonly<Record<branchId, BranchStrips>>`

Per branch column, four fact rows, each keyed by `plyOffset` relative to the shared fork:

- **`evalTrail`** — `comparison.evidence[branchId]` re-sorted by `plyOffset`. Recorded
  `cp`/`mate` scores only (`compare.ts:56-58`); no interpolation, no request for new
  evaluation; a ply with no recorded score renders as absence.
- **`structure`** — `structuralReading(fen)` (already client-imported, `CompareView.svelte:3`)
  evaluated on each node FEN of the branch's fork→leaf suffix; an entry is emitted only where a
  feature value differs from the previous node on that suffix. Vocabulary is the shipped
  structural-feature set; no new chess nouns.
- **`timing`** — merged, ply-ordered: `checkpointHits[branchId]` and
  `objectiveTimelines[branchId]` from the payload (`compare.ts:102-103`), plus the shipped
  irreversibility and phase-band detectors applied to the suffix (the `pivotalMarkers` detector
  families, `docs/adaptive-guidance.md:62-68`), each entry carrying its product-convention
  attribution.
- **`routes`** — for each piece identified by its square on the fork node, the ordered squares
  it visits on this branch's suffix; only pieces that moved at least once past the fork are
  included. Pure move arithmetic over persisted nodes.

Hard rule, inherited from the payload it projects: **strips never rank branches, compute a
cross-branch delta, or recommend a winner** (`docs/n-way-comparison.md:11-13`). A strip is a
per-branch fact column; the comparison of columns is the learner's act. Shared-prefix groups
(`comparison.rows[].groups`) render one strip segment, not duplicated differences
(`docs/n-way-comparison.md:17-18`).

#### 1b. `comparisonNarrative(run, comparison, strips): ComparisonNarrative`

Deterministic, attributed, causal. Output: one preamble group plus one sentence group per branch
column.

- Preamble: the fork fact only — shared plies through the fork node, each branch's own fork
  offset and forking SAN (facts already in `columns` and `rows`).
- Per-branch causal order: decision → irreversible commitments (timing strip) → structure
  changes → checkpoint and objective facts (with their evidence refs) → recorded evaluation
  pivots → terminal or consequence fact (`consequences[branchId]`, `compare.ts:78-96`).
- Evaluation pivots reuse the documented story convention verbatim: mate maps to the ±1000 cp
  rail, scores are learner-relative, a consecutive recorded swing of at least 150 cp is a pivot
  (`docs/game-import-and-story.md:73-77`). Arithmetic over recorded evidence, never a move grade.
- Sentences come from a **closed template set**; every sentence names its ground (recorded
  engine evidence / product convention / pack author / legal-move arithmetic), the same
  discipline as story moments (`docs/game-import-and-story.md:79-84`).
- Causal-not-move-by-move is structural: a sentence exists only at a strip event; a branch with
  no events past the fork yields one fixed sentence stating that fact.
- Forbidden in any template: verdicts, better/worse/should, any cross-branch numeric
  comparison, any move grade. The `voiceCheck` banned-token scan runs over the template set in
  unit tests so the deterministic text is held to the same bar as provider text.

Determinism contract: identical `(run snapshot, comparison, strips)` inputs produce
byte-identical output.

#### 1c. Voice seam (narrative mode's optional persona)

The closed scope union at `rest.ts:1068` (`marker | reading | steering | story`) gains
**`compare`**. For `scope: "compare"` the body carries `branches` (2–8 persisted branch ids)
instead of `nodeId`. The server recomputes the comparison through `service.compare` — inheriting
the disclosure gate unchanged (`docs/explanation-grounds.md:80-99`): before disclosure the
payload's evidence arrays are empty, so the packet simply contains no evaluation sentences —
then builds the packet from `comparisonStrips` + `comparisonNarrative` output and nothing else.
Provider behavior is the existing contract byte-for-byte: packet-bound phrasing only,
`voiceCheck` rejection, one retry, then the byte-identical deterministic sentence set;
`VOICE_UNAVAILABLE` (503) with no provider; output ephemeral, never evidence
(`docs/adaptive-guidance.md:109-130`). The Law-8/ADR-0005 line: the LLM may re-voice the
deterministic narrative; it cannot add a chess claim, and the deterministic narrative is itself
only rendered validated evidence and conventions.

#### 1d. Client surface

`CompareView.svelte` gains, inside its existing scroll container:

- a **strip band** under the stepper: per branch, the eval trail as a sparkline of recorded
  points only (rendered point count equals recorded entry count), structure and timing tick rows
  with their attributed sentences on open, and per-branch piece routes behind a disclosure
  control;
- a **Narrative** toggle rendering the deterministic sentence groups; the persona voice control
  appears only when the provider is configured and the learner's assistance preference allows it
  (`docs/adaptive-guidance.md:36-54,116-118`).

The existing rules are untouched: selection changes request a fresh comparison and reset the
stepper (`docs/n-way-comparison.md:5-7`); eight branches remain the readability cap.

### 2. Session distillation (B6 residual)

A completed run becomes a **pack seed, never a pack** — the archived §6 extract
(`rfc/archive/pack-studio.md:710-831`), already adversarially reviewed once, restated here as
the normative slice over today's shipped write path.

#### 2a. Endpoint and authorization

`POST /runs/:id/distill` joins the run-route action set (`rest.ts:522`). Body:
`{ packId, title, branchId? }` (`branchId` defaults to the branch containing the deepest node).
The caller must be the run's **host** — the same bar as sharing a story
(`apps/server/src/service.ts:538`) — and an authenticated learner, because the result is a
learner-private draft. Response `201`: `{ draft, proposals, dropped }`. The draft is created
through the existing studio create path (`apps/server/src/pack-studio.ts:71-79`) with
`seedKind: "run"` and `seedRef: runId`, making the reserved enum value real. **No migration:**
the CHECK constraint already admits `'run'` (`storage.ts:2601`) and no new column or table is
added.

#### 2b. Mechanical extraction (into the draft document)

1. `start` = `run.start` verbatim. For a pack-sourced run, `start.movesSan` is copied from the
   source pack resolved by digest when — and only when — the pack's `start.fen` is byte-equal to
   `run.start.fen`. When it cannot be copied, the hand-placed-root fact is named in
   `provenance.graduationBlockers` (this RFC ships no new lint).
2. `spine`: the run's node graph rendered as an authored tree by the same path-merging rule
   `exportPackRunPgn` uses (`packages/runtime/src/pack-pgn.ts:164`) — the selected branch is the
   mainline; every other played branch appears as a sibling child at its fork node.
   `moveUci`/`moveSan` are copied from run nodes; spine ids derive from run node ids.
3. `opponentPolicy` = `run.opponentPolicy`, with a mandatory `graduationBlockers` entry stating
   the opponent replies are **one sampled line, not theory**, naming the recorded engine
   identities and each `policyModeApplied`.
4. `checkpoints`: the definitions of checkpoints that actually fired, copied from the
   digest-resolved source pack; unreached checkpoints are dropped and listed in `dropped`. A
   position-sourced run — or a pack-sourced run in which **no** checkpoint fired (the schema
   refuses `checkpoints: []`, `minItems: 1`) — gets exactly one mechanical `atPly` checkpoint at
   the selected branch's deepest learner ply with `objective.type: "play_until_checkpoint"` and
   a summary stating it is mechanical; the substitution is named in `graduationBlockers`. A
   selected branch with zero learner plies refuses with `IMPORT_INVALID`.
5. `difficulty.branchLengthTarget` = the selected branch's ply length iff within the schema's
   2–20 band; omitted otherwise.
6. `provenance.reviewStatus: "draft"`; `provenance.sources` includes the literal
   `"session_distilled"` plus one generated line naming the run id, its `sessionDigest`
   (`packages/runtime/src/types.ts:299` — every run has one), the source pack id and digest when
   present, and — for an `imported` run — the stored licence note and source URL from its
   `imported_games` row (`docs/game-import-and-story.md:31-34`). **The provenance names the run
   digest**; nothing else asserts where the moves came from.
7. Remaining required scalars: `id`/`title` from the request; `version` `"0.1.0"`; `mode` and
   `objective.type` copied from the source pack (pack-sourced) or `"outcome"` /
   `"play_until_checkpoint"` (otherwise); `feedbackPolicy` = `run.feedbackPolicy`, with the
   run-only `attempt_end` substituted by `delayed_checkpoint` and the substitution named in
   `graduationBlockers`.

#### 2c. Deviation proposals — classes are human-only

Every fork in the run is returned as a **deviation proposal** in the response:
`{ kind: "deviation", atSpineNodeId, moveUci, moveSan, branchLabel, branchIntent?,
objectiveStateBefore, objectiveStateAfter }` — deliberately with **no `class`**.
`deviations[].class` is permanently human-only; the distiller writes **zero** entries into
`deviations`, `annotations`, `planClasses`, or `feedbackClaims`, and no objective summary beyond
the stated mechanical placeholder. A proposal enters `deviations` only when the author picks a
class in the studio editor. Proposals are **not persisted**: distillation is deterministic over
the run snapshot (same snapshot → byte-identical draft document and proposals), so re-invoking
reproduces them; this replaces the archived draft's `proposals_json` column and is why this RFC
needs no migration.

Branches whose `origin` is `"simulated"` (`docs/n-way-comparison.md:37`) are skipped both as
spine siblings and as proposals, and the response says so — entering a demonstration is not
deviating from it (`rfc/archive/pack-studio.md:787-799`; the field shipped in run schema 0.8, so
the rule is live, not inert).

Run engine evidence is never carried into an authoring evidence ledger: it is
movetime-budgeted, and the authoring contract requires fixed depth
(`rfc/archive/pack-studio.md:823-831`). A distilled draft has no `evidence.json`; grounding it
means running the authoring evaluation job.

#### 2d. Landing in the studio

The draft is an ordinary learner-owned community-channel draft: saved invalid or valid,
lintable, playtestable when clean, and registrable **only** through the normal gate — which
requires no declared graduation blockers (`docs/pack-studio.md:28-31`). Since §2b makes at least
one blocker mandatory, a distilled draft cannot be registered until a human deliberately does
the judgment work and removes the blockers. That is the Law-8 boundary working as designed: the
run supplies facts about how moves came to exist; every assertion class stays human.

Client: the run screen of an eligible completed run gains a "Distill to draft" control that
calls the endpoint and navigates to `/create` with the new draft open, proposals rendered as
read-only reference beside the editor.

### 3. Event-fact recommender (B7 residual)

`GET /progress/recommendations` joins the progress routes (`rest.ts:843-864`). Learner-scoped,
read-only, derived on request, no caching, no new storage. Two producers, both consuming facts
already recorded:

- **Unaddressed repertoire gaps** — for each repertoire the caller owns that has a stored scan
  (`repertoire_scans`, `storage.ts:2263-2276`): each `GapRow`
  (`apps/server/src/repertoire.ts:26-34`) with no `repertoire_gap_runs` row for its key
  (`storage.ts:2277-2283`). Item: `{ kind: "repertoire_gap", repertoireId, repertoireName,
  gapKey, replySan, line, mass, gamesUntilSeen, sentence }`, with the existing enter action
  (`repertoire.ts:78`) as its link. Every gap item carries the corpus guard verbatim:
  "These counts say what this population played, not what is good"
  (`repertoire.ts:24`, `docs/repertoire-gap-finding.md:12-15`).
- **Structures met but never drilled** — `shapeFirings`
  (`packages/runtime/src/index.ts:35`) evaluated over the played paths of the caller's 50 most
  recently updated owned runs, against the served shape catalogue; from the fired entries,
  subtract every entry referenced (`pack.shapes`, `docs/shape-library.md:31-33`) by any pack
  appearing in the caller's `attempts` rows. Item: `{ kind: "shape_encounter", shapeId,
  shapeName, runCount, runIds, packIds, sentence }` where `packIds` lists served packs naming
  the entry. Firings remain derived, never events (`docs/shape-library.md:42-45`); the measured
  evaluator envelope (~1.3 ms median per run path, `docs/shape-library.md:76-77`) bounds the
  50-run scan.

**The recommendation grammar is pinned to event facts.** Every sentence is generated from a
closed template set whose slots are counts, names, ids, and dates of recorded events:
"Your repertoire ⟨name⟩ has no answer to ⟨replySan⟩ after ⟨line⟩; this population reached it
about once every ⟨gamesUntilSeen⟩ games." / "You met ⟨shape name⟩ in ⟨runCount⟩ of your
preserved runs and have not completed an attempt in any pack that names it." Forbidden by
construction and by test: any skill, struggle, weakness, mastery, rating, or grading claim, and
any cross-learner claim — **"players who drilled X often struggle with Y" is a skill claim and
is out permanently.** All inputs are learner-scoped; no cross-learner data is consulted.

Ordering is deterministic: gaps by `mass` descending then key; encounters by `runCount`
descending then shape id. At most 10 items per kind.

**Strictly additive (ADR-0003,
`archive/brief-v2/adrs/ADR-0003-personal-history-optional.md`):** with nothing recorded the
response is `[]` and `/learn` renders no recommendation section; the endpoint never creates or
modifies a schedule, never writes an attempt, never grades, never changes any surface's
availability, and is never an entry requirement — the hard rules the archived spec already
stated (`rfc/archive/return-and-progression.md:809-811`), now enforced by acceptance. The
repertoire half consumes an import the learner already chose to make; the encounter half needs
no import at all. `/learn` keeps its no-mastery-percentage stance
(`docs/return-and-progression.md:44-49`): a "Recommended next" section listing the sentences and
their links, nothing scored.

### 4. Shared Law-8 boundary (all three slices)

| Slice | May state | May never state |
|---|---|---|
| Strips + narrative | recorded scores, structural feature diffs, checkpoint/objective/terminal facts, move arithmetic, product conventions (attributed) | a branch ranking, verdict, move grade, or any unattributed chess claim |
| Distillation | how moves came to exist (run id, digest, engines, policy modes, substitutions) | any deviation class, annotation, plan class, feedback claim, or objective judgment |
| Recommender | event facts about the learner's own recorded data | any skill/weakness/mastery claim; anything cross-learner |

## Deviations from design

1. `design/02:180` promises an "eval/WDL trajectory" strip. Recorded comparison evidence
   carries `cp`/`mate` scores only (`compare.ts:56-58`); the strip renders the recorded cp/mate
   rail and renders no WDL, because displaying a win/draw/loss probability nobody recorded would
   fabricate evidence.
2. `design/02:182-183` keeps branch race experimental; this RFC does not touch it.
3. Against the archived (not design-tier) drafts: proposals are response-derived rather than
   stored in a `proposals_json` column (`rfc/archive/pack-studio.md:700-701`), trading a
   migration for a determinism guarantee; and the recommender consumes already-recorded event
   facts instead of the archived bulk personal-PGN ranker
   (`rfc/archive/return-and-progression.md:795-807`) — that ranker's ledger row
   (`design/BACKLOG.md:66`) is untouched by this RFC.

## Acceptance criteria

Browser tests live in `tests/browser/` under the existing Playwright harness
(`playwright.config.ts:6`); server/runtime tests beside their modules.

1. **Strips/narrative browser test.** From a drilled run with two forks and disclosure reached:
   the compare screen shows per-branch strip rows whose rendered eval points equal the recorded
   evidence entries for that branch (no interpolation); structure and timing ticks open to
   attributed sentences; the Narrative toggle renders the preamble and per-branch groups; the
   rendered narrative contains no token from the verdict/prescriptive banned list; deselecting a
   branch resets the stepper and re-renders strips.
2. **Narrative determinism and hygiene (unit).** Same inputs → byte-identical narrative; the
   full template set passes the `voiceCheck` banned-token scan; no emitted sentence contains a
   cross-branch numeric delta or ranking word.
3. **Voice seam (server).** `scope: "compare"` with no provider → `VOICE_UNAVAILABLE` and the
   client hides the persona control; with a stub provider emitting an ungrounded claim, the
   response degrades to the byte-identical deterministic sentences; pre-disclosure packets
   contain no evaluation sentence.
4. **Distillation browser test.** Complete the browser fixture pack run with one fork and a
   fired checkpoint; "Distill to draft" lands on `/create` with the draft open,
   `seedKind: "run"` visible in its listing, the fork present as a spine sibling, the fired
   checkpoint present, and registration refused while graduation blockers are declared.
5. **Distillation properties (server).** Restating the archived acceptance 10/10a
   (`rfc/archive/pack-studio.md:1545-1565`): a one-fork run yields exactly one classless
   proposal and zero `deviations`/`annotations`/`planClasses`/`feedbackClaims`; a run with no
   fired checkpoint yields `checkpoints.length === 1` with the substitution named; a zero-
   learner-ply branch refuses with `IMPORT_INVALID`; a 40-ply branch yields no
   `branchLengthTarget`; `origin: "simulated"` branches produce no sibling and no proposal, and
   the response says so; `provenance.sources` contains `"session_distilled"`, the run id, and
   its `sessionDigest`; a property test over generated runs asserts every distilled document
   passes `validatePackDocument` and always declares at least one graduation blocker; repeated
   distillation of one snapshot is byte-identical.
6. **Recommender browser test.** After the existing repertoire import-and-scan flow
   (`tests/browser/drill.spec.ts:75`), `/learn` shows a gap recommendation carrying the corpus
   guard; entering that gap removes it. A Just Play run meeting a catalogued shape produces an
   encounter recommendation whose link lists packs naming the entry; recording an attempt on
   such a pack removes it.
7. **Strictly additive.** With empty inputs, `GET /progress/recommendations` returns `[]` and
   `/learn` renders no recommendation section; a server test asserts `schedules` and `attempts`
   row counts are unchanged by any recommendations read; the pre-existing browser suite passes
   unmodified.
8. **Grammar pin (unit).** Every renderable recommendation sentence is produced by the closed
   template set; a static forbidden-term list (skill, weak, struggle, mastery, rating, "players
   who") appears in no renderable output.
9. **Register neutrality.** Tests assert `STORAGE_VERSION`, the migration count, and the pack
   schema `$id` (`urn:chess-tabiya:schema:drill-pack:0.15`) are unchanged by this RFC's
   implementation.

## Open questions

None.

## Changelog

- 2026-08-14: created — drafted second in the 2026-08-14 (second) wave behind
  `polish-surfaces`, ahead of `grounding-pair`; claims no registered shared resources.
