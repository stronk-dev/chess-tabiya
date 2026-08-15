# Authoring vocabulary completeness and engine leverage

**Question (owner sequencing, 2026-08-15):** *"for content we have a good start, but we need
to lock in the primitives and detectors and etc that they use… make sure the current set is
also COMPLETE and leveraging the engine nicely… and then we can quickly do a lot of
content."* Authoring at scale against an incomplete vocabulary means re-authoring
everything. This dossier decides whether the scale-up is safe.

**Measured at `fa1e689` (clean tree), 2026-08-15.** All counts re-derived; none inherited.

---

## Verdict, stated for the content decision

**Yes for structure, no for tempo, and the engine is barely referenceable.**

The vocabulary can express what the 37 authored packs actually say — `pack-check` passes on
**37 of 37** with zero warnings `[V]`, and the expression census found **zero unsatisfiable
expressions** (`planning/expression-census-triage.md:56-92`). Nothing in the corpus is
provably broken, and no vocabulary work is in flight to wait for: all three active RFCs
(`rfc/client-surface-floor.md:54-56`, `rfc/fixture-realism.md:35-42`,
`rfc/live-marker-quality.md`) declare that they claim nothing versioned `[V]`.

Three things would force a re-author at 100+ packs, ordered by how much content each
invalidates:

1. **The tempo contract is required by design on every opening root and has never been
   authored once.** `design/04-content-architecture.md:228` requires "one timing window
   where the tempo contract bites" per opening root. **0 of 20** opening packs declare one;
   **0 of 145** checkpoints use an `atWindow` trigger; **0** success conditions are
   `timing_window`; the `preserve_plan_window` objective has **0** users; all **7** tempo
   verdicts have **0** users `[V]`. The vocabulary is now 100% executable (`tempo.ts`
   consumes `opens`, `closes`, `readiness`, `tolerated`, `luxuryMoveBudget`,
   `gradeOutpaced` — `packages/runtime/src/tempo.ts:140-274`), which means this is no
   longer an expressiveness gap. It is an **unexercised** one. Authoring 100 opening packs
   against a construct nobody has used once is the single largest re-author exposure in the
   repo.
2. **131 authored feedback claims have no delivery path, and the number scales linearly
   with packs.** All 37 packs carry claims (3.5/pack); their only consumer is
   `ReasoningGround {kind:"claim"}` inside a `stated_reasoning` checkpoint
   (`apps/server/src/reasoning.ts:64`), and **0 of 145** checkpoints are `stated_reasoning`
   `[V]`. Q8's finding reproduced exactly. At the mapped scope this becomes ~350
   undeliverable claims.
3. **275 deviations carry no `mistake` and no `cost`**, one wave after
   `deviation-classes` (pack 0.21) shipped both `[V]`. `mistake` is explicitly a human
   judgment no machine can backfill (`design/BACKLOG.md:256`), so this is pure re-reading
   of every deviation ever authored — 275 today, ~750 at the mapped scope.

**Engine leverage: one engine output of six is referenceable as a live condition.** See §3.

**The re-author risk is not hypothetical — it has already happened once.** Commit
`930b367` (transition primitives) deleted the corpus's only `plan_consequence` success
condition from `content/drafts/carlsbad-minority-attack.json` and replaced it with a
`transition_feature` expression `[V]`. One authored condition, one wave apart, re-authored
because a better primitive landed. In a corpus of 37 that is a curiosity; the same rate at
370 is the failure the owner is asking about.

---

## Method

Every number below is re-derived at `fa1e689` against `content/`, `packages/`, `schemas/`
and `apps/`. Three instruments:

- a token census over `schemas/drill_pack.schema.json` (**188** distinct `const`/`enum`
  string tokens) counted by exact quoted-string match across the 37 authored packs, the 6
  `*.browser.json` acceptance fixtures and the 25 shape entries;
- a structural census that parses each pack and walks its expressions, counting kinds at
  their host sites (objective types including trajectory legs, success conditions,
  structural/transition features, combinators, checkpoint triggers and interactions,
  deviation fields, evidence labels);
- the shipped repo instruments, run over all 37 packs:
  `node apps/server/dist/pack-check.js` and
  `node apps/server/dist/sourcing-check.js … file`.

The token census is string-level and is only quoted for tokens whose spelling is unique to
one vocabulary slot; where a token is ambiguous (`outcome` is both a `mode` value and a
success-condition kind) the structural census is authoritative and is what is cited.

**Corpus.** `content/drafts` holds 43 `*.json` pack documents, of which **6** are
`*.browser.json` acceptance fixtures, leaving **37** authored packs — 20 opening, 14
endgame, 2 cross_phase, 1 middlegame `[V]`. Plus **25** shape entries with **117** plans,
**32** `*.evidence.json` ledgers with **764** records, and **36** machine-emitted candidate
skeletons under `content/candidates/` (not authored content; 1.5 KB each) `[V]`.

**Scope being sized against.** `design/04-content-architecture.md` §2a–2b name **≥54**
distinct opening spines against 20 authored (2.7×) *before* §2c's mirrored anti-packs; §3
names **10** middlegame structures at 8–15 roots each against **1** authored middlegame
pack; §5 names a **6**-pack trajectory launch set against 3 authored `[V]`.

---

## 1. The vocabulary as it stands

| Host site | Declared | Used in ≥1 authored pack | Unused |
|---|---:|---:|---:|
| Objective types | 12 | 7 | **5** |
| Success-condition kinds | 8 | 4 | **4** |
| Structural feature kinds | 18 | 9 (15 incl. shape entries) | **3 everywhere** |
| Structural expression nodes | 7 | 6 (`mirrored` shapes-only) | 0 |
| Transition feature kinds | 6 | 3 | **3** |
| `move_irreversibility` subkinds | 4 | 1 (`pawn_break`) | **3** |
| Transition expression nodes | 5 | 3 (`all`, `feature`, `position`) | 2 |
| Checkpoint trigger kinds | 7 | 4 | **3** (`atStart`, `materialBalance`, `atWindow`) |
| Checkpoint interaction types | 3 | 1 (`intent_capture`) | **2** |
| Reasoning ground kinds | 4 | 0 | **4** |
| Deviation classes | 5 | 4 | **1** (`required_theory`) |
| Deviation `mistake` tags | 3 | 0 | **3** |
| Deviation `cost` forms | 3 | 0 | **3** |
| Tempo verdicts | 7 | 0 | **7** |
| Window opening / closing forms | 3 / 4 | 0 / 0 | **all 7** |
| Opponent policy modes | 7 | 3 | **4** |
| Feedback policies | 3 | 2 | **1** (`segment_end`) |
| `feedbackClaim` evidence types | 7 | 6 | **1** (`human_model_predicted`) |
| Retry-variant kinds | 5 | 3 | **2** |
| `variantOf` relations | 3 | **0** | **3** |
| `fenPredicate` types | 3 | 1 (`structuralFeature`) | **2** |
| Root-assessment kinds | 3 | 3 (engine 20, syzygy 12, authored 5) | 0 |
| `provenance.reviewStatus` | 3 | 1 (`draft`, 43/43) | **2** |

Volumes: 145 checkpoints, 275 deviations, 634 spine nodes, 105 plan classes (41 with a
`shapePlan` binding), 29 shape references, 131 feedback claims, 146 concepts, 425 free-text
spine annotations, 38 success conditions, 9 trajectory legs, 6 guards `[V]`.

**Shape entries have improved sharply and the old headline is stale.** `signature: null`
is now **21 of 117 plans (17.9%)**, not the 73% (75/103) in
`authored-transitions-and-features.md` `[V]`. `design/BACKLOG.md:280,297` already records
the corrected 96/21/117 figure; this pass confirms it independently. Predicate waves 2–3
worked: `piece_reach_count` — the "existence encoding" that appeared 143 times in the
earlier audit (`planning/pack-vocabulary-audit/report.md:118-128`) — now appears **0 times
in packs and 0 times in shapes** `[V]`.

---

## 2. Coverage matrix: every logged friction against the vocabulary

Sources: the friction batches and rows in `design/BACKLOG.md` (lines 204–210, 237–303) and
the open-defect rows they produced (110–164). Column key: **NOW** = expressible in the
shipped schema; **RFC** = expressible after an in-flight RFC; **GAP** = not expressible and
unclaimed by any RFC.

| # | Friction | Attestation | Status | Verified against |
|---|---|---|---|---|
| 1 | Plan-drill objective is intent-blind | Pack B, 2026-08-12 (`:204`) | **NOW** via `plan_consequence` — but **0 users**; the corpus's only use was deleted at `930b367` | structural census; `git show 930b367` |
| 2 | **Deviations have no link to a plan class** | Pack B, 2026-08-12 (`:206`) | **GAP** — `$defs/deviation` properties are `at, moveUci, class, offObjective, note, mistake, cost, timingWindowId`; no `planClassId` | `schemas/drill_pack.schema.json` |
| 3 | `concept_violation` conflates timing and plan-coherence errors | Pack B, 2026-08-12 (`:207`) | **NOW** via `mistake` (0.21) — **0 of 275** deviations use it | structural census |
| 4 | On-ramp blunder-guard knob has no encoding | defect sweep (`:205`) | **NOW** via `immediate_guard` + `guard.*` — 6 packs | structural census |
| 5 | **Per-leg `shapes` and per-leg `opponentPolicy` on trajectories** | trajectory wave, 2026-08-14 (`:248`) | **GAP** — `$defs/trajectoryLeg` accepts only `id, entryCheckpointId, branchLengthTarget, objective`; `opponentPolicy` is pack-level only | `schemas/drill_pack.schema.json` |
| 6 | Piece censuses need a six-leaf existence hack | trajectory wave (`:248`) | **NOW** — `quantified` + `piece_count`; the 143 `piece_reach_count` leaves are gone | token census |
| 7 | `rook-4v3-same-side` trigger names a family it cannot census | trajectory wave (`:248`); now **D75** | **GAP (content-owned)** — the census located the fault in the **trigger**, not the signature | `planning/expression-census-triage.md:309-330` |
| 8 | **Validated intent answers** | on-ramp wave 5a (`:249`) | **GAP** — `intent_capture` records a plan-class id; nothing validates it | `authored-feedback.ts:233-242`; `pack-vocabulary-audit/report.md:206-211` |
| 9 | **`theory_strict` off-spine consequence behaviour** | on-ramp wave 5a (`:249`) | **GAP** — degrades to `human_common` by name | `opponent-selector.ts:574` |
| 10 | Node v26 zstd cannot read the puzzle dump | on-ramp wave 5a (`:249`, `:299`) | **GAP** — tooling, not vocabulary; absent from the frictions RFC's eight items | `design/BACKLOG.md:299` |
| 11 | Tablebase evidence attachment; machine-proved `variantOf`; `atStart` checkpoints | endgame wave 5b (`:250`) | **NOW** — but `variantOf` has **0 pack users** and never has had any (`git log -S`) | token census; git |
| 12 | Format ceiling 40; tablebase walker | mates wave 5c (`:252`) | **NOW** | `schemas/drill_pack.schema.json`; `sourcing/tablebase-walk.ts` |
| 13 | Tempo vocabulary encodes the wrong object | 0 of 135 checkpoints (`:254`) | **NOW** and fully executable — **0 of 145** checkpoints use the new form either | `tempo.ts:140-274`; structural census |
| 14 | Two of three phases have no evidence-attachment path | 20 opening packs (`:255`) | **NOW** — 391 `engine_eval` records across 20 packs | evidence-ledger census |
| 15 | **`guard.evalSwingCp` unlinked from deviation classes** | on-ramp frictions (`:257`) | **NOW** via `cost` + validation warning — **0** deviations declare `cost`, so the link is never exercised | structural census |
| 16 | Corpus artifacts miss the on-ramp's own band | 3 on-ramp packs (`:258`) | **GAP** — no explorer evidence exists in any pack ledger (§3) | evidence-ledger census |
| 17 | **Question shapes 3–4** ("the vocabulary supports one, players ask four") | 4 shapes (`:260`) | **GAP** — shape 2 shipped as `transition-primitives`; 3–4 unclaimed | `design/BACKLOG.md:260` |
| 18 | **Third orientation gap in the shape library** | 3rd instance (`:269`) | **GAP** — `mirrored` exists; `axis: "colors"` and `"both"` have **0** users anywhere | token census |
| 19 | No repo command evaluates a shape entry against a corpus | 2nd attestation (`:270`) | **NOW** — `make expression-census` (`design/BACKLOG.md:426`) | Makefile:33 |
| 20 | `structuralDelta` cost / deadness | (`:279`, `:281`) | **NOW** for cost; **GAP** for deadness — `structuralDelta`/`vacationReading` still consumed by nothing but tests | `design/BACKLOG.md:281` |
| 21 | **Practical difficulty has no learner-side grade** | handed off by `resistance-spectrum` §7a (`:287`) | **GAP** | `design/BACKLOG.md:287` |
| 22 | **`resist` graded by an authored ply proxy** | (`:288`) | **GAP** — and `resist` has **0** authored users | `design/BACKLOG.md:288`; token census |
| 23 | **Bind `/deviations/{i}/cost` to engine evidence** | declined by two RFCs (`:293`) | **GAP** — the engine number exists at the exact pointer (§3) and the vocabulary cannot consume it | evidence-ledger census |
| 24 | Prediction distribution delivery truncated | (`:210`) | **GAP** | `design/BACKLOG.md:210` |
| 25 | Comparison column ceiling (fabricated citation) | (`:209`) | **GAP** — owner ruling wanted | `design/BACKLOG.md:209` |
| 26 | Rewind cancels pending evidence | 2 independent drafts in one day (`:245`) | **GAP** — "if a third consumer hits it, the fix is structural" | `design/BACKLOG.md:245` |
| 27 | Outcome leg with no `successConditions` grades nothing silently (**D28**) | found by first trajectory packs (`:247`) | **GAP** — both trajectory packs still carry a `material_balance` condition purely to dodge it | `design/BACKLOG.md:247` |
| 28 | Nine of 25 shape entries referenced by no pack (**D44**) | (`:150`) | **GAP (content-owned)** — re-derived: still **9 of 25** (`doubled-c-pawns, hanging-pawns, iqp-black, knight-vs-bishop, maroczy-bind, open-centre, queenless-middlegame, up-an-exchange, vancura`) | shape/pack cross-census |

### The deliverable: not expressible, and unclaimed

Fourteen rows, of which the **five that touch how a pack grades or explains** are the ones a
content wave will hit repeatedly:

1. **`deviation.planClassId`** — the "same plan, different move" case. 88
   `accepted_alternative` deviations exist and none can say *which plan it is an
   alternative within* `[V]`. Two years of attestation is one; it will recur on every
   plan-mode pack.
2. **Per-leg `shapes` and per-leg `opponentPolicy` on trajectory legs** — a trajectory
   crossing three phases cannot vary resistance by phase. Blocks §5's 6-pack launch set
   beyond the 3 authored.
3. **`/deviations/{i}/cost` bound to engine evidence** — see §3; explicitly declined by
   two RFCs and left author-declared-and-unbacked by coordinator ruling
   (`design/BACKLOG.md:293`).
4. **Validated intent answers** — `intent_capture` is used at 38 of 145 checkpoints, more
   than any other interaction, and validates nothing. The audit's phrasing stands:
   *"`intent_capture` does not capture intent"* (`planning/pack-vocabulary-audit/report.md:206`).
5. **D28: an outcome leg with no `successConditions` grades nothing and passes silently** —
   already worked around in both authored trajectory packs. This is a green-admission-to-
   nothing defect and it scales with every trajectory authored.

The remaining nine (`theory_strict` off-spine, question shapes 3–4, mirror orientation
coverage, `structuralDelta` deadness, practical-difficulty learner grade, `resist`'s ply
proxy, prediction-distribution delivery, comparison-column ceiling, rewind-cancels-evidence,
Node zstd) are real but either content-owned, surface-owned, or below the attestation bar
this repo uses to earn a fix.

---

## 3. Engine leverage — the question nobody had asked

The engine layer produces six distinguishable outputs. **Only one is referenceable as a
condition a pack can be graded by at play time, and it is the narrowest of the six.**

| Engine capability | Produced by | Author-referenceable in a pack? | Evaluated when? |
|---|---|---|---|
| **Stockfish eval (cp / mate) at depth** | `evidence-queue.ts`, `sourcing/engine-walk.ts`, `strong-engine.ts` | **Yes, twice.** `objective.grading.assessedBy {kind:"engine"}` — one number, for the **root FEN only**. And `guard.evalSwingCp` / `fireOnMate` / `guard.overrides[]` / `opponentPolicy.stockfishGuardCp` | **`guard.*` is the only live one.** `applyRecordedEngineGuard` (`apps/server/src/guard.ts:199-229`) reads engine payloads off the run's `evidence.attached` stream and compares them at play time. `assessedBy` is an authored constant |
| **Syzygy category** (5 values) | `tablebase.ts`, `sourcing/syzygy.ts` | **Yes, as a constant.** `assessedBy {kind:"syzygy"}` (category + pieceCount), plus the `perfect_tablebase` opponent mode | Never at play time. Cross-checked against the ledger once, at pack load, and only for `/start/fen` (`ledger-validation.ts:395-405`) |
| **Syzygy DTZ / DTM / precise_dtz** | retrieved and stored — **341 `tablebase_result` records carry `dtz` and `dtm`** | **No.** The string `dtz` appears **0 times** in `drill_pack.schema.json`, `shape_entry.schema.json` and `drill_run.schema.json` | n/a |
| **Maia policy distribution at a band** | `maia.ts`, `opponent-selector.ts` | **No condition of any kind.** Maia is reachable only as an *opponent* (`opponentPolicy.mode` + `targetElo`). The one Maia-shaped token in the pack schema is the evidence label `human_model_predicted`, which has **0 uses** and **no entry in the backing map** (`sourcing/check.ts:183` maps only `engine_validated→engine_eval`, `tablebase_exact→tablebase_result`, `corpus_observed→explorer_frequency`) — it is unbackable by construction | n/a |
| **Explorer win/draw/loss + play counts** | `corpus.ts`, `sourcing/explorer.ts` | **No condition.** Only the claim label `corpus_observed` (23 uses), which maps to evidence kind `explorer_frequency` — of which **0 records exist anywhere in `content/`** | n/a |
| Stockfish WDL (`UCI_ShowWDL`), bestline, top-N | `evidence-queue.ts:337-373`; run schema evidence kinds `eval`/`wdl`/`bestline` | **No.** Runtime-only | n/a |

### The sharpest form of the finding

The repo already holds **764 machine-validated evidence records** across 32 ledgers — **391
Stockfish `engine_eval`** (depth 22, MultiPV 1) and **341 syzygy `tablebase_result`**
(with `dtz`, `dtm`, `precise_dtz`) `[V]`. **235 of them are anchored to
`/deviations/{i}/moveUci`** — 135 engine evals and 100 tablebase results, sitting at the
exact JSON pointer of the field that would consume them `[V]`.

**Zero of 275 deviations declare a `cost`.** The engine has already answered the question,
the answer is committed to the repo next to the field, and the vocabulary has no way to
consume it — `deviation.cost` is an *authored* number whose `basis` is a free label, and the
row that would bind them was declined by both `deviation-classes` and
`opening-evidence-path` (`design/BACKLOG.md:293`).

Q8 found that authored *claims* have no delivery path. The parallel holds and is worse for
*conditions*: an author can reference exactly one engine output in a runtime-evaluated
condition (a Stockfish centipawn swing, through the guard), and **6 of 37** packs do so.
Everything else the engine can produce — DTZ, human policy, human outcomes, WDL, top-N — is
unreferenceable from the pack vocabulary. **A vocabulary that cannot reference the engine's
best output is not leveraging it, and this one references one output of six.**

### Two measured consequences for scale

- **67 machine-checkable evidence labels are unbacked, 0 backed.** `sourcing-check` over all
  37 packs emits **66 `EVIDENCE_TYPE_UNBACKED` warnings** (my static count is 67; the
  difference is 5 packs with no ledger at all, whose claims are never reached) `[V]`.
  Breakdown: `tablebase_exact` 37, `corpus_observed` 23, `engine_validated` 7. **0** evidence
  records support any `/feedbackClaims/{i}/text` pointer. All **43** pack documents are
  `reviewStatus: "draft"`, and `check.ts:191` promotes this warning to an **error** on
  `published` — so the whole corpus is currently unpublishable on this check alone.
- **Evidence binding is by whole-pack digest, so any edit invalidates the entire ledger.**
  `sourcing-check` reports **11 `EVIDENCE_DIGEST_STALE`** today — every tablebase-grounded
  endgame pack `[V]`. At 37 packs this is a chore; at 370, with vocabulary waves still
  landing, it is a treadmill.

---

## 4. Dead and unused vocabulary — unneeded versus unusable

Re-derived. The older figures are superseded: **7 of 15 feature kinds unused** is now
**3 of 18 unused everywhere**; `piece_reach_count`'s 143 existence-encoding leaves are
**0**; `preserve_plan_window` still has **0** users; `timingWindows` is declared by
**0 of 37** packs (was 0 of 43 under the census's wider convention) `[V]`.

### (a) Unused because *unusable* — the actionable set

| Item | Users | Why unusable |
|---|---:|---|
| `human_model_predicted` evidence label | 0 | **No evidence kind exists to back it.** `EVIDENCE_KINDS` has six members and none is a Maia record (`sourcing/types.ts:57-64`); `check.ts:183`'s map omits it. Declaring it is declaring something the pipeline cannot ever verify |
| `corpus_observed` evidence label | 23 | `explorer_frequency` is a declared evidence kind with **0 records in `content/`**. The explorer pipeline writes ledgers for *candidates* (`sourcing/explorer.ts:234-274`) but no pack ledger carries one |
| `deviation.cost` (all 3 forms) | 0 | Author-declared and unbacked by ruling, while 235 machine records sit at its pointer (§3) |
| `rules_fact` success condition | 0 | The schema permits `winner` on `stalemate` and the evaluator ignores it; `material_balance.value` accepts any JSON number while runtime material is an integer, making `equal` with a decimal globally false (`pack-vocabulary-audit/report.md:174-181`). Neither is fixed at `fa1e689` |
| `plan_consequence` success condition | 0 | Usable, and used once, then **deleted in favour of `transition_feature`** at `930b367`. Two vocabularies now cover one job with no rule for choosing. 41 of 105 plan classes carry a `shapePlan` binding that `plan_consequence` exists to grade, and **0** are graded |
| `variantOf` (all 3 relations) | 0 | Shipped by `authoring-frictions` and ledgered as a closed friction (`BACKLOG:250,252`); **never used in `content/` in the entire git history** (`git log -S'variantOf' -- content/` → empty) |
| `iqp-black`, `maroczy-bind` named structures | 4 shape uses, 0 pack uses | Both triggers fire **0 of 694** corpus positions and both entries are D44 orphans (`expression-census-triage.md:309-379`) |
| `mirrored` `axis: "colors"` / `"both"` | 0 | The mirror combinator shipped for exactly the orientation gap at `BACKLOG:269`, and only `axis: "files"` has ever been written |

### (b) Unused because *unneeded* (or not yet reached) — leave alone

`save`, `prevent_opponent_plan`, `transition_to_endgame` objectives; `required_theory`
deviation class; `segment_end` feedback policy; `same_root_new_defense` and
`alternate_plan_class` retry variants; `pawn_safe_square` and `pawn_count` structural
features (`pawn_count` is already deprecation-scheduled, `BACKLOG:282`); `transposeKey` and
`pawnStructure` fenPredicate types; `atStart` and `materialBalance` triggers; `castled`,
`last_of_role` and `clock_zeroed` irreversibility subkinds (`last_of_role` is the sub-kind
`live-marker-quality` is *narrowing to*, so its zero is expected); `cursed-win` /
`blessed-loss` categories; `plan_defense` and `human_external` opponent modes (both carry
named capability refusals — the D8-compliant form). `resist` and `practical_resistance` sit
between the two buckets: both are executable, both have zero authored users, and both have
open ledger rows against them (`BACKLOG:287,288`).

### (c) The D75 lesson, re-confirmed

The census's central finding is that **the fault is usually one level above where it
appears**: `rook-4v3-same-side`'s zero-firing signature is a defect in the **trigger**,
which has no pawn constraint (`expression-census-triage.md:309-330`). This pass found the
same shape twice more. `timingWindows`'s zero is not a tempo-vocabulary defect — the
evaluator is complete — it is an authoring-wave defect: **no wave has authored a window
since the vocabulary was fixed.** And `plan_consequence`'s zero is not a `plan_consequence`
defect; it is the absence of a rule for choosing between two overlapping grammars.

---

## 5. What would force a re-author, ordered by content invalidated

| Rank | Gap | Content invalidated if it changes | Why this rank |
|---|---|---|---|
| **1** | **Tempo / timing windows** | Every opening pack — 20 today, and openings dominate the mapped scope (≥54 named spines before mirrors) | The construct is **required per opening root** by `04` §2d and has **never been authored once**. The three races `04` §7 names (Caro Advance c5-break, Sicilian attack, Carlsbad minority-attack) all have packs in `content/` and none declares a window. Authoring 100 opening packs against an unexercised construct is the definition of the risk being asked about |
| **2** | **Feedback-claim delivery** | All 131 claims, all 37 packs, ~22% of the authored prose corpus | Undeliverable **by construction**: the only consumer needs a `stated_reasoning` checkpoint and authors write `intent_capture` at 38 of 38 interaction sites. Claims scale 1:1 with packs, so the debt compounds faster than any other |
| **3** | **`mistake` / `cost` backfill** | 275 deviations, ~750 at scale | Additive per row rather than structural — but `mistake` is a *human judgment* nothing can backfill, so it is 275 manual re-readings. Shipped one wave ago and adopted zero times |
| **4** | **`plan_consequence` vs `transition_feature`** | 41 plan-class bindings; unknown share of future plan-mode packs | The only **observed** re-author. Two grammars, one job, no selection rule. Cheap to fix by ruling; expensive to leave, because every plan pack authored before the ruling picks the losing side |
| **5** | **D28 (leg with no conditions grades nothing)** | Every trajectory pack | Both authored trajectories already carry a dodge condition. Green-admission-to-nothing scales badly |
| **6** | **Engine-condition reference (DTZ, Maia, explorer, WDL)** | **None** | Genuinely missing (§3), but a new success-condition arm or evidence kind is **additive**: existing packs stay valid. This is the biggest capability gap and the **smallest** re-author risk — which is why it should not be allowed to block the content wave |
| **7** | `deviation.planClassId`, per-leg `shapes`/`opponentPolicy`, validated intent | Additive fields; no existing pack invalidated | Real frictions, additive fixes |

**The ordering's point:** the two things that would cost the most to redo (1 and 2) are not
missing from the vocabulary at all. They are present, executable, and unexercised. **The
cheapest possible insurance against a 100-pack re-author is to author one pack that uses
each — one opening pack with a real timing window, and one pack whose claims are delivered
through a `stated_reasoning` checkpoint — before the wave starts, not after.** That is two
packs of work standing between the corpus and the risk.

---

## 6. By-products

- **`pack-check` passes on 37/37 with zero warnings** `[V]` — the format is not the
  bottleneck.
- **`sourcing-check`: 66 `EVIDENCE_TYPE_UNBACKED`, 11 `EVIDENCE_DIGEST_STALE`, 5 packs with
  no ledger** (`carlsbad-minority-attack`, `conversion-up-a-piece`, `rook-4v3-same-side`,
  `trajectory-caro-advance-chain-bishops`, `trajectory-qgd-exchange-minority`) `[V]`.
- **`DESIGN-GAP:` `04` §2d stands and has widened** — it requires one timing window per
  opening root; **20 of 20** opening packs have none (was 18 of 18 in
  `authored-transitions-and-features.md`). Escalating, not resolving: design-tier text is
  not this dossier's to edit.
- **`variantOf` has never appeared in `content/`** despite two closed friction rows citing
  it as shipped `[V]`. Not a defect in the format; a gap between the ledger's "closed" and
  the corpus.
- **All 43 pack documents are `reviewStatus: "draft"`.** No pack has ever been published,
  and publishing turns 66 warnings into errors.
- **`piece_reach_count`, `pawn_count` and `pawn_safe_square` are the only 3 of 18 structural
  feature kinds with zero uses anywhere** — down from the 7-of-15 and 2-of-15 figures in the
  earlier audit. The deprecation-and-replacement loop demonstrably works.
- **41 of 105 plan classes carry a `shapePlan` binding and 0 are graded** `[V]`.

---

## Residuals

- **No run was played.** Everything here is static: schema, content, evaluator source, and
  the two shipped CLI checks. Whether an authored timing window *behaves* correctly in a
  live run is untested by this pass and by every pass since 2026-08-12
  (`design/BACKLOG.md:298`).
- **The token census is string-level.** Ambiguous tokens are reported from the structural
  census instead; no conclusion rests on a string count alone.
- **"Unneeded" in §4b is inference, not evidence** `[M]`. A kind with zero users may be
  unneeded, or may be needed by content nobody has written. The distinction is only settled
  by authoring; §4a is confined to items with a mechanical reason they cannot be used.
- **No chess judgment is offered anywhere in this dossier** (Law 8). Where a signature or
  trigger fires on nothing, the finding is a coverage or binding fact, never a claim that
  the authored chess is wrong.
