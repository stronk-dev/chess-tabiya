# Grounded coaching starts with a cited observation ledger, not a diagnosis

**Question:** platform-alignment R13 — can registered event aggregates support useful recurring-
pattern summaries and exact replay/drill actions without turning correlation into diagnosis?

**Status:** mechanical/code arm answered `[V]`; owner-use quality remains.

## Verdict

Yes at the contract level; no from the current production history topology.

A useful grounded card is mechanically expressible when it carries one versioned observation,
its opportunity population, exact contributing source positions and an exact applicability set.
The disposable prototype renders:

> Carlsbad structure appeared in 2 of 3 recorded opportunities.

It preserves the full source count while showing one exact `run#node`, and exposes two applicable
packs plus one theory identity. It does not say the learner is weak at Carlsbad positions, should
study them, or played them badly. Five negative controls refuse label-only merges, denominator-free
tendencies, source-less counts, ungrounded pack/theory actions and diagnostic/advice vocabulary.
`[V]` `tools/r13-grounded-coaching-harness/prototype.test.ts` and `prototype-output.md`.

The current app cannot populate that card honestly across a learner's games. Imported runs are
explicitly excluded from the attempt projection; semantic F2 events do not enter progress storage;
pack concepts are persisted under pack-scoped identities; current aggregate metrics return no
source rows or opportunity denominators; shape recommendations retain run IDs but lose exact node
IDs; and Review Story does not consume F2 transition events. `[V]` current-tree census in
`tools/r13-grounded-coaching-harness/census.json`.

The architectural answer is therefore a **personal observation ledger**: append/query projections
of already-declared evidence and measured habit rows, with source, opportunity and applicability
preserved. Coaching modules read that ledger. An LLM may optionally paraphrase an admitted card;
it neither scrapes, retrieves, selects, diagnoses, grades nor prescribes.

## 1. Five planes exist; none is the cross-game coaching source

### 1.1 Attempt history

`projectAttempts` records pack/position branches with root, pack, objective state, verdict, result,
attempt number and exact root node. It returns an empty projection for `sessionKind === "imported"`.
This supports retry history and return scheduling for native rehearsals, but cannot power the
requested Chess.com-style review of imported games or a longitudinal profile. `[V]`
`apps/server/src/progress.ts:82-89`; `apps/server/src/storage.ts:1385-1586`.

Attempt `stable`/`unstable` is an authored-objective result inside a selected pack. Counting it is
legal; calling a high unstable rate a learner weakness is not. Exposure is selected, pack
difficulty differs, objectives differ, and the table carries no population of opportunities the
learner did not choose. The honest sentence is “3 of 5 graded attempts on this exact root ended
stable,” not “you struggle with this concept.”

### 1.2 Pack concepts

The 50 draft packs contain **199 concept references** across **168 raw identities**. Twenty-five raw
identities appear in more than one pack; `advance-chain-base` appears in six, while Carlsbad,
minority-attack, backward-pawn-target, blockade-square and castle-before-attacking are among the
reused pairs. Yet the default resolver stores every row as `pack:<packId>#<raw>`, producing 199
separate persisted identities. `[V]` corpus census; `apps/server/src/progress.ts:54-58`.

That scope is safe for exact pack attribution and wrong for cross-pack recurrence. Merging by the
display string would silently treat spelling as ontology; retaining the prefix makes “you met this
idea across contexts” impossible. F9 needs a registered cross-pack concept/evidence identity and a
migration, not a SQL `GROUP BY label`.

### 1.3 Shape encounters

`shapeRecommendations` is the closest shipped coaching aggregate. It scans up to 50 preserved
runs, counts distinct runs where a registered shape fired, subtracts shapes named by any countable
pack attempt and returns `runIds` plus matching `packIds`. Its deterministic sentence is already
appropriately literal. `[V]` `apps/server/src/service.ts:808-827`.

Three gaps prevent it from being the general ledger: it recomputes rather than persists evidence;
it drops each firing's node identity into a run-only set; and its pack join still admits prospective
references (D693). The client then drops the returned pack ID (D692). R8/F7 own the last two action
edges; F9 must not fork them.

### 1.4 Review moments

Review Story preserves exact run nodes and evidence for pivotal markers, shape spans, endgame entry,
recorded outcome and recorded evaluation shifts. It is a per-run narrative, not a cross-run store,
and its registered consumer currently omits F2 semantic transition events. `[V]`
`packages/runtime/src/story.ts`; `packages/runtime/src/evidence-catalog.ts` `review.story@1`.

R7 already established that local selection and whole-game moment selection are different jobs.
R13 adds a third: cross-game aggregation must consume admitted local identities and sources; it
must not rerun a new classifier or rank raw sentences.

### 1.5 Habit metrics

R12 retained twelve literal short-session metrics with separate 25–200-game floors, confidence
intervals and exact contributing decisions. It refused four metrics, natural archetypes, GM twins
and LLM-written advice. Those records are research artifacts, not production events or storage.
`[V]` `design/research/player-style-metrics.md`.

A habit card is descriptive, not a coaching prescription. It may state the metric, window,
population, sample and uncertainty. Moving from “you castle kingside in X of Y eligible games” to
“work on queenside attacks” introduces a chess judgement no measured field establishes.

## 2. The smallest sufficient primitive

The research prototype supports this logical record; names are illustrative, not a production
schema:

```text
PersonalObservation
  learner
  evidence projection id + version
  occurred / opportunity
  source { game-or-run, node-or-ply }
  population/window
  measured value + uncertainty? + sample floor?
  exact applicability { theory ids, pack ids }
  producer/version/created-at
```

The ledger is a projection of declared facts, not another evidence authority. Its essential
invariants are:

1. occurrence and opportunity travel together when a rate is possible;
2. every count reopens exact contributing rows;
3. a truncated UI says “3 shown of 17,” never silently changes the denominator;
4. identity and version, not prose, define recurrence;
5. applicability is attached by F7's exact join and may be honestly empty;
6. deletion/export follow the personal-data contract; and
7. recomputation is versioned so classifier improvements do not rewrite old claims invisibly.

This is intentionally separate from O5's knowledge-builder. The offline exact/FTS theory bundle
answers “what cited authored/external material applies to this registered identity?” The personal
ledger answers “where and how often did this learner meet the identity?” Neither belongs inside an
LLM hint request, and neither needs semantic retrieval as authority.

## 3. Three learner modules, not one coach dump

The evidence supports three different modules with different semantics:

1. **Observed habit** — continuous R12 metric, own denominator/window/confidence, contributing
   games. No good/bad valence.
2. **Recurring situation** — registered evidence identity across source positions, with occurrence
   and opportunity counts. It can open those positions and applicable theory.
3. **Rehearsal result** — exact root/pack objective history and retry state. It can reopen or retry;
   it does not generalize to the learner's chess outside that authored task.

Keeping them separate is the UX translation the raw evidence inspector lacks. A preset may choose
which modules appear in Review, Learn, Just Play or a social recap; a learner should not configure
producers. Advanced settings may expose sources and primitive inventory, but ordinary flows choose
modules and assistance distance.

## 4. What the renderer may do

The deterministic renderer is sufficient for every admissible factual card in this experiment.
R5 already found that hosted prose is provider-dependent and typed IDs alone do not preserve
citations; local 360M prose failed the safety contract. `[V]`
`design/research/llm-renderer-contract.md`.

An optional LLM renderer may receive only the sealed card fields and exact cited excerpts selected
by the deterministic system. It may vary tone or obtuseness within a declared assistance distance.
It may not:

- select which pattern is important;
- infer intention, weakness, strength or causation;
- turn population rarity into move quality;
- add a plan not present in cited theory/pack evidence;
- choose a drill through embedding similarity; or
- hide abstention/honest-empty output.

This answers the scraper question bottom-up: reuse Skipper-like crawling and invalidation for the
**offline knowledge compiler** under O5, not for live coaching requests. Runtime joins exact local
artifacts; the LLM is optional presentation over an already admitted card.

## 5. What may proceed and what remains refused

O9/F9 may specify:

- a versioned personal-observation ledger fed only by declared evidence/habit producers;
- the three modules above;
- literal deterministic cards with complete source and denominator disclosure;
- exact replay/retry and F7-owned theory/drill actions;
- independent module/preset defaults per workflow;
- optional sealed LLM paraphrase; and
- export/delete/recompute/version behavior.

Still refused on present evidence:

- a global weakness score or “top thing to fix” ranking;
- archetypes, GM twins or tactical/positional personality labels;
- diagnosing from chosen drill outcomes;
- merging pack concepts by label;
- recommendations from source-less counts or missing opportunity denominators;
- semantic/vector similarity as applicability or priority authority; and
- claiming that any card improves learning before use supplies that evidence.

Owner use remains necessary to judge whether the modules are useful, calm and worth returning to.
It is not necessary to identify the missing primitives or authorize the conservative architecture.

## 6. Reproduction

The plan is `planning/platform-alignment/grounded-coaching/plan.md`. Run:

```sh
pnpm exec vitest run --config tools/r13-grounded-coaching-harness/vitest.config.ts
```

The two focused tests regenerate the corpus/topology census and the positive/negative prototype.
