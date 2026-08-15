# RFC: The resistance spectrum — practical difficulty as a measured primitive

- **Status:** draft
- **Author:** claude (drafted on the parallel-wave assignment, 2026-08-15)
- **Created:** 2026-08-15
- **Design refs:** `design/01-training-model.md:81-91` (the four outcome types; **save** =
  "exploit realistic inaccuracies", **resist** = "maximize practical difficulty, reach
  resistance checkpoints"), `design/01-training-model.md:118` (Outcome Drill "vs
  exact/human resistance"), `design/05-in-run-experience.md:242` (rung 0 cannot be wrong
  about chess), `design/BACKLOG.md:241` ("Resistance spectrum completion
  (perfect/annoying/fallible)"), `design/BACKLOG.md:255` ("Recovery as a first-class
  skill" — *"the fuck up, then recover, and if recovery fails grind out the draw"*),
  `design/BACKLOG.md:254` (punishment-free experimentation),
  `design/BACKLOG.md:233` (declared-vs-executable law, pending promotion to design tier)
- **Exploration gate:** exploration gate opened by owner ruling 2026-08-12 + breadth
  sequencing ruling 2026-08-11 (`rfc/README.md:75-89`)
- **Depends on:** `rfc/archive/grounding-pair.md` (the tablebase provider seam, the
  category-preserving filter, the D8 three-legged path this RFC repeats),
  `rfc/archive/engine-workers.md` (selector seam, Maia sidecar, policy-mass patch),
  `rfc/archive/line-drill-theory-grading.md` (`policyModeApplied`),
  `rfc/archive/branch-groups.md` (the group reply journal this RFC must not desync),
  `rfc/archive/outcome-drill-grading.md` (the `resist` grading path this RFC measures),
  `rfc/archive/defect-sweep.md` §2b (the declared-vs-executable law)
- **Parent / amends:** follow-up to `archive/grounding-pair.md` §2 and
  `archive/engine-workers.md`
- **Supersedes / superseded by:** —
- **Planning:** `planning/resistance-spectrum/` (once implementing)

**Register claims (parallel wave, 2026-08-15).** This RFC claims **run schema
0.15** per the wave's lane assignment (baseline `DRILL_RUN_SCHEMA_VERSION = "0.13"`,
`packages/schema/src/index.ts:1`; 0.14 is assigned to a sibling draft in this wave) and
**migration 20 (`STORAGE_VERSION` 19→20)**, stamp-only. **Say it loudly:** the migration
baseline is `STORAGE_VERSION = 18` (`apps/server/src/storage.ts:387`), so 19 is the next
free number. A run-schema bump *requires* a stamp migration — reads filter on the current
version (`storage.ts:624`, `:726`) and a run stamped with an old version becomes invisible
— so the 0.14 holder must claim 19, and this draft claims 20 behind it. **If the 0.14
draft does not land, or lands claiming no migration, this rebases to migration 19 and its
frozen literals become `"0.13"` → `"0.15"`** rather than `"0.14"` → `"0.15"`. Rebase,
never renumber-in-place.

**No pack-schema version is claimed.** `practical_resistance` is already in the
`$defs/opponentPolicy.mode` enum (`schemas/drill_pack.schema.json:641`), and that object
is `additionalProperties: false` since pack 0.12, so the policy is **parameter-free by
construction** — §2f turns that constraint into the design. The learner-side consumer of
this RFC's primitive needs a new `successCondition` kind and therefore a pack-schema
version this draft may not take; §7a hands it to the vocabulary lane instead of inventing
it here.

**Ownership pins taken:** the practical-difficulty primitive
(`packages/runtime/src/practical-difficulty.ts`, new — the single definition §1 exists to
prevent being written twice) and the `eloHonored` capability seam in
`apps/server/src/engine-supervisor.ts`.


> **REBASE APPLIED by claude (register single writer), 2026-08-15.** The 0.14 holder
> (`own-game-rehearsal`) was **cancelled before drafting** — verification found game import,
> the ~8-moment story, story re-entry and PGN export already shipped in
> `docs/game-import-and-story.md`. The lane is free, so this RFC's own rebase rule fires:
> **run schema 0.13 → 0.14, migration 19** (`STORAGE_VERSION` 18→19), frozen literals
> `"0.13"` → `"0.14"`. Every 0.15 / migration-20 reference below reads as 0.14 / 19.


> **R4 MEASURED, 2026-08-15 — §7b's classifier as specified FAILS, and the fix is one word.** `design/research/practical-difficulty-outside-tablebase.md`
> ran the experiment this RFC specified over 171 in-range positions / 2,416 legal moves,
> with Stockfish holding no tablebase access (`tbhits 0`, empty `SyzygyPath`, no `.rtbw` on disk).
>
> - The **centipawn-window** classifier §7b specifies peaks at **κ = 0.577** (accuracy 0.806) and
>   gets its concession set right on only 66.1% of positions. It measures *distance from best*;
>   the tablebase measures *change of outcome class*. **No window width reconciles them.**
> - Classifying by **outcome class** at ±100 cp instead gives **κ = 1.000, accuracy 1.000, set
>   match 1.000, zero false positives, zero false negatives** at depths 12 and 16 — Stockfish's
>   position class equals the tablebase category on **171/171**. §2b's self-preservation gate has
>   **zero unsafe admissions** at depth ≥ 6. Both readings come from the same MultiPV probe, so
>   this costs nothing.
> - **It repairs nothing outside the range**, because there a position has no outcome class:
>   median |eval| **43 cp**, only **10.2%** of 284 out-of-range positions decided. The concession
>   set reproduces across depth on 99.4–100% in range and **29–54%** out of it.
> - **Cost**: against the <500 ms budget (`design/02-product-shape.md:162-163`) only depth 8 fits,
>   and §2c needs one probe per candidate — a real selection is ≈620 ms at depth 8, which is also
>   the least stable depth out of range. Cost is the second problem, not the first.
>
> **The reframe this forces: decidedness, not piece count, is the real gate.** The v1 scoping to
> ≤7 pieces is right in effect and wrong in reason — a `practical_resistance` that probes once and
> refuses by name when |eval| is inside the threshold would extend honestly to decided middlegames.
>
> **Open question 2 is settled affirmatively:** Maia advertises `Elo` (with `SelfElo`, `OppoElo`,
> `Temperature`, `TopP`, `MultiPV`), so §3's `eloHonored` seam is a check that will pass, not a
> refusal. Maia returned a policy scalar at **120/120** probes in and out of range; it caps at 20
> candidates but those carry a median **99.99%** of the mass.
> **D35 is now quantified:** a no-reset control changes **83.8%** of move evaluations and the
> reported best move on **89/171** positions; the reset costs a flat 6 ms.

## Summary

The opponent spectrum ships four modes and every one of them optimizes the same thing:
play the best move available to the instrument. `theory_strict` and `human_common` sample
a human-choice distribution, `strong_engine` searches, `perfect_tablebase` solves. None
of them has *practical difficulty* as an objective, and no code anywhere in the repo can
measure practical difficulty at all. That is why two shipped outcome types are not real
drills: **save** needs an opponent whose fallibility is a stated, honored parameter, and
**resist** needs both an opponent whose objective is difficulty and a way to grade the
learner on having produced it. This RFC (1) defines practical difficulty **once**, as a
composition of two shipped instruments — Maia's per-move policy mass and a grounded
concession classifier — usable identically by the opponent selector and by learner
grading; (2) makes `practical_resistance` executable on that primitive inside the
seven-piece boundary, with a named refusal outside it; (3) fixes the honesty defect
behind "fallible" — `targetElo` is sent to Maia blind and never verified, so the one knob
that would calibrate human error is an unchecked assumption; and (4) states plainly what
it does **not** ship and what would supply it.

## Motivation

**a. Two shipped outcome types have no opponent that makes them real.** `design/01`
defines four outcome types and the pack schema, validator, orchestrator and grader all
implement four (`schemas/drill_pack.schema.json:167-170`;
`apps/server/src/pack-orchestrator.ts:213`, `:244-256`). Content tells the other half of
the story: across every committed pack there are 12 `win` objectives, 5 `hold`, **1
`resist` — a browser test fixture whose own provenance says "Test-only fixture; never
publish as chess content" (`content/drafts/outcome-resist.browser.json`) — and zero
`save`.** Two of the four outcome types have no authored content, and the reason is
mechanical rather than editorial:

- **save** is "start objectively worse; exploit realistic inaccuracies to reach a draw or
  real counterplay" (`design/01-training-model.md:85-86`). Against `strong_engine` or
  `perfect_tablebase` there are no inaccuracies to exploit; the drill is unwinnable by
  construction. Against `human_common` there are, but *how many* is unstated — §3.
- **resist** is "position may stay lost; maximize practical difficulty, reach resistance
  checkpoints" (`:87-88`). Its grading is a terminal loss **plus** the reach of one
  authored checkpoint (`pack-orchestrator.ts:244-256`; validation rejects terminal-only
  resist as ungradable, `pack-validation.ts:466-472`). The checkpoint is an authored
  proxy — usually "survive to ply N". Nothing measures difficulty.

**b. The shipped "perfect" opponent literally optimizes for simplification.** This is not
rhetoric, it is the code: when winning, `perfect_tablebase` orders category-preserving
moves by *shortest* absolute DTZ (`apps/server/src/opponent-selector.ts:550-552`). DTZ is
distance-to-zeroing, and the zeroing move is a capture or a pawn move. The exact opponent
therefore takes the shortest path to the next irreversible simplification — correct for
"perfect play", and the precise opposite of an opponent that makes you work. This is
right for `perfect_tablebase` (it is what perfection means under the fifty-move rule) and
it is exactly why the spectrum needs a mode whose objective is something else.

**c. The learner-side mirror wants the same quantity.** The owner's 2026-08-15 list of
what a player actually asks includes *"how can i annoy my opponent"* alongside *"entice a
pawn trade to open a file"* (ledgered as "Question shapes: the vocabulary supports one,
players ask four"). "Be annoying" is not a new idea in this repo — it is `resist`, already
in `design/01`. So the same quantity is wanted twice: as the opponent's objective function
and as the learner's grade. **Two definitions of practical difficulty that drift apart
would be a live defect** — a drill that rewards the learner for something its own opponent
does not do. §1 therefore defines it once, in the runtime, with one exported function, and
§2 and §7a are two consumers of that one definition.

**d. "Fallible" is not a missing mode, and it must not become one.** `AGENTS.md:109-110`
rejects "weakened Stockfish as the default opponent (samples weaker engine moves; does not
model human choice)". The repo's answer to human choice is Maia, containerized
(`workers/maia/README.md:1-12`), and `human_common` already *is* the fallible policy. The
declared-but-unimplemented set holds `plan_defense`, `practical_resistance` and
`human_external` (`apps/server/src/capabilities.ts:17-24`) — there is no `fallible` slot
and there should not be one. What is actually missing is calibration honesty: the selector
sends `setoption name Elo value <targetElo>` unconditionally
(`opponent-selector.ts:455-459`) and nothing checks that the engine advertises the option,
even though the supervisor already parses the advertised option list for exactly this
purpose one field over (`engine-supervisor.ts:231-243`, `:115`, `:136-137`). A drill whose
objective is "exploit realistic inaccuracies" is standing on an unverified claim about
which population's inaccuracies it is exploiting. §3 fixes that with the mechanism the
repo already invented for seeds.

**e. Enticement is undrillable today.** "Entice a pawn trade to open the c-file" requires
an opponent that can be enticed. `strong_engine` takes only when best; `perfect_tablebase`
takes when it shortens DTZ (§b); `theory_strict` follows authored replies. Only a
band-calibrated human model can be baited, and only a difficulty-seeking opponent can
*decline* a trade because declining is annoying. Instrumental-play drills therefore depend
on this wave, and the dependency runs to the parallel vocabulary draft — noted in §7a
rather than claimed here.

**Out of scope**, each with its reason and its handoff:
learner-side grading of practical difficulty (needs a pack-schema `successCondition` kind
and the version lane is closed — §7a); the middlegame/opening concession gate (needs a
latency experiment this RFC specifies and does not authorize — §7b); explorer-seeded
resistance (needs a mode name, a pinned time window, and coverage this repo does not have
— §7c); `plan_defense` and `human_external` (untouched, still declared with their checked
refusals); and making `strong_engine` itself reproducible (§4d records the finding and
files it, but does not fix it).

## Specification

### 1. The primitive: `humanConcessionMass`

**1a. Definition.** For a position `P` with side to move `S`, a rating band `E`, and a
concession classifier `C`:

> `humanConcessionMass(P, S, E, C)` is the sum of Maia-3's move-policy mass, at band `E`,
> over the legal moves that `C` classifies as conceding for `S`.

It is a number in `[0, 1]`. It is a **measurement composed of two instrument readings**,
not a claim about the position. Its honest English is: *"of the move-probability mass this
human model assigns in this position, X sits on moves that give up the result."* Nothing
in it asserts that a move is good, bad, best, or instructive, so it does not manufacture
chess truth (`AGENTS.md` law 8, ADR-0005) and it introduces no LLM anywhere.

**1b. Reading one — the human-choice distribution.** Maia-3 (`maia3-5m`, pinned checkpoint
`b6559de…`, `workers/maia/README.md:6-12`) emits its already-computed policy scalar on
each MultiPV info line through the AGPL-published patch
`workers/maia/patches/maia3-uci-policy-mass.patch`, parsed at
`apps/server/src/opponent-selector.ts:227-231`. This is the model's own move distribution,
kept explicitly distinct from its WDL head (`docs/engine-workers.md:91-97`). The band is
the run's `targetElo`, subject to §3.

**1c. Reading two — the concession classifier `C`.** A move concedes for `S` when it
changes `S`'s outcome class. **In v1 there is exactly one admissible classifier**: the
tablebase category, taken from a single probe of `P` — the Lichess standard-tablebase
provider returns a category for *every* legal move in one response
(`TablebasePosition.moves`, `apps/server/src/tablebase.ts:8`), each stated for the
resulting position's side to move and therefore inverted through the shipped
`invertTablebaseCategory` (`tablebase.ts:11`) before comparison, exactly as
`#perfectTablebase` already does (`opponent-selector.ts:545-549`). A move concedes iff its
inverted category differs from `P`'s category. The full ten-value lattice is used as its
own rungs — `cursed-win` is not `win` (`tablebase.ts:5`) — so the fifty-move boundary is
already encoded, per `grounding-pair` §2c.

This makes the classifier **exact, free of engine opinion, and one HTTP probe per
position**. It is available only at seven pieces or fewer. The engine-gated classifier
that would lift that boundary is specified in §7b and not shipped.

**1d. Absent-mass honesty.** Maia is asked for MultiPV `max(8, |legal moves|)` candidates;
mass outside the returned set is unmeasured, not zero. The primitive therefore returns
`{concedingMass, measuredMass, candidateCount}` and every consumer compares
`concedingMass / measuredMass`. If any returned candidate omits its policy scalar, the
primitive **abstains** — it returns `null` and emits the existing `DEGRADED_POLICY_MASS`
warning (`opponent-selector.ts:519-524`). It never substitutes inverse-rank weights the
way `theory_strict` sampling may: a rank-derived pseudo-mass is a fine way to *pick* a
move and a dishonest way to *report a measurement*.

**1e. Where it lives.** `packages/runtime/src/practical-difficulty.ts`, exported from
`packages/runtime/src/index.ts`, pure, with the Maia candidate list and the classified
move set passed in — no I/O, no engine handle. Both consumers (§2, §7a) call this one
function. **Any second definition of practical difficulty in this repo is a defect**;
§Acceptance criteria 7 makes that checkable.

### 2. `practical_resistance` — the opponent consumer ("annoying")

**2a. The vocabulary move.** `RUN_OPPONENT_MODES` gains `"practical_resistance"`
(`packages/runtime/src/types.ts:38-43`); the entry is deleted from
`DECLARED_UNIMPLEMENTED_POLICY_MODES` (`capabilities.ts:19-22`). The pack schema is not
edited — the enum already holds all seven modes
(`schemas/drill_pack.schema.json:636-646`). The binding test's set-equality and
disjointness assertions (`apps/server/src/pack-authoring.test.ts:64-75`) pass mechanically
after the partition move; this is the second time that transition runs, `grounding-pair`
§2a being the first.

**2b. What "annoying" means, precisely.**

> Of the replies that do not concede your own result, play the one that leaves the learner
> the greatest measured chance of going wrong; break every tie by lexicographically least
> UCI.

Formally, for the position `P` facing the selector with band `E`:

1. **Self-preservation gate.** Restrict to the legal replies whose inverted tablebase
   category equals `P`'s category — the identical filter `#perfectTablebase` computes
   (`opponent-selector.ts:545-549`). An annoying opponent that throws the game away is not
   annoying, it is losing. If no category-preserving move exists, refuse by name (§2e); do
   not silently accept a worse category.
2. **Difficulty maximization.** For each surviving reply `m`, compute
   `humanConcessionMass` of the resulting position `P·m` for the **learner** at band `E`
   (§1). Choose the `m` with the greatest `concedingMass / measuredMass`.
3. **Ties.** Equal ratios, or an all-abstaining candidate set (§1d), break to
   lexicographically least UCI — the `grounding-pair` §2c precedent, applied here for the
   same reason.

This is a different objective function from every shipped mode, and it is stated as an
objective function rather than as a chess claim. It does not say the chosen move is good.
It says: among the moves that keep my result, this is the one after which the most
human-choice mass sits on losing replies, as measured by a named model at a named band.

**2c. Cost, and why the boundary is where it is.** One tablebase probe for `P` (gate) plus
one tablebase probe and one Maia call per surviving candidate. Maia's measured uncached
median is 53 ms with a 123 ms maximum (`docs/engine-workers.md:218-227`), and the
tablebase client coalesces identical requests behind a 512-entry LRU with no positive TTL
(`docs/tablebase-grounding.md:29`), so an endgame position with a handful of
category-preserving replies stays inside the same envelope `human_common` already meets.
The candidate set is capped at **8** surviving replies, ordered by lexicographic UCI
before truncation so the cap itself is deterministic; a position with more
category-preserving replies is measured on the first eight and the recorded candidate list
says so. Outside the seven-piece boundary the classifier does not exist and the mode
refuses (§2e) — it does **not** fall back to a cheaper, different objective function under
the same name, because one mode name covering two objectives is precisely the
misrepresentation `policyModeApplied` exists to prevent.

**2d. Applied record.** Every selection records
`policyModeApplied: "practical_resistance"`. `PolicyModeApplied` widens automatically
through `RunOpponentMode | "enumerated" | "unknown"` (`types.ts:45`); the hand-narrowed
unions widen by hand: `makeSelection` (`opponent-selector.ts:265-277`), the REST literal
list (`apps/server/src/rest.ts:192-207` — **note for implementation:** that list already
omits `"enumerated"`, which `types.ts:45` permits and `branch-groups` writes; widen it to
the constant rather than adding a fifth literal), the client mode unions
(`apps/web/src/lib/session-controller.ts:137-157`). `PositionOpponentPolicy`
(`types.ts:60-62`) is **not** widened: Just Play stays `human_common | strong_engine`,
unchanged, as it did through `grounding-pair`.

The recorded candidates carry the measurement. `SelectionCandidate`
(`types.ts:64-68`) gains an optional `concessionRatio?: number` — the §1 ratio for the
position after that candidate, present only for `practical_resistance` selections. This is
the run-schema change of §6 and it is load-bearing for §4: the record is what makes the
selection auditable and replayable without recomputation.

**2e. Refusals — all named, none silent.**

- *Static:* a pack declaring `practical_resistance` whose root exceeds seven pieces is
  refused at validation, `PRACTICAL_RESISTANCE_OUT_OF_RANGE` at `/opponentPolicy/mode`,
  beside the existing mode check and the `perfect_tablebase` range check
  (`pack-validation.ts:304-323`). Piece count is monotone, so the root gate covers every
  reachable position.
- *Capability:* `availableModes()` (`opponent-selector.ts:393-401`) includes the mode iff
  **both** the tablebase provider and the Maia opponent engine are live — the mode needs
  two instruments, unlike every existing mode. `/capabilities.policyModes` reflects it
  through the same publication path that filters `perfect_tablebase`
  (`capabilities.ts:190`); that line is the D8 law executing and this mode extends its
  predicate rather than adding a parallel one.
- *Runtime:* provider absent/unreachable/negative-cached → `TABLEBASE_UNAVAILABLE` (503,
  `retryAfterMs`); a position over seven pieces → `TABLEBASE_OUT_OF_RANGE` (422); Maia
  unavailable → the existing `ENGINE_UNAVAILABLE`; no category-preserving reply exists →
  `PRACTICAL_RESISTANCE_UNAVAILABLE` (422). **The selector never falls through to another
  mode**, the `grounding-pair` §2e rule, for the same reason: a `human_common` move
  presented as practical resistance misreports the opponent's objective.
- *Client:* substitution may occur only at session negotiation, before any move, through
  the capabilities payload (`session-controller.ts:137-157`), and the existing
  requested-versus-applied surface discloses it
  (`docs/outcome-drill-grading.md:85-96`). Mid-run the turn does not advance.

Two new `ServerErrorCode` members, appended to `apps/server/src/errors.ts:1-58`:
`PRACTICAL_RESISTANCE_OUT_OF_RANGE`, `PRACTICAL_RESISTANCE_UNAVAILABLE`.

**2f. Parameter-free by construction, and that is correct.** `$defs/opponentPolicy` is
`additionalProperties: false` (pack 0.12), so `practical_resistance` can take no authored
knob without a pack-schema version this draft may not claim. That constraint produces the
right design: the only thing an author could plausibly tune is a difficulty threshold, and
a tuned threshold would be an authored assertion about how hard a position is — an
ungrounded chess claim wearing a number. The band comes from the run's existing
`targetElo`; everything else is measured.

### 3. "Fallible" — the missing thing is band honesty, not a mode

**3a. The finding.** `targetElo` flows from pack to run to selector to
`setoption name Elo value N` (`opponent-selector.ts:455-459`) with **no check that the
engine advertises an `Elo` option**. The supervisor already collects advertised option
names while parsing identity (`engine-supervisor.ts:231-237`) and already converts one
such name into a published honesty fact — `seedHonored` is true iff the configured seed
option was actually advertised (`:115`, `:136-137`), which is how the repo learned to
record `seedHonored: false` for Maia rather than claim determinism it does not have
(`docs/engine-workers.md:87-89`). The band knob never got the same treatment. **This RFC
does not assert that Maia advertises the option or that it does not** — it asserts that
the deployment currently cannot tell, and that a policy whose whole purpose is realistic
human fallibility must know which population it is being fallible as.

**3b. The mechanism, copied from the precedent.** `EngineSpec` gains an optional
`bandOption?: string` beside its existing `seedOption`; `parseIdentity`
(`engine-supervisor.ts:115-137`) sets `eloHonored: spec.bandOption === undefined ? false :
optionNames.has(spec.bandOption)`. `EngineIdentity` and `SelectionEngineIdentity`
(`types.ts:70-77`) carry it, `/capabilities.engines[]` publishes it
(`docs/engine-workers.md:194-203`), and the selector **only sends the setoption when the
option is advertised** — sending an unadvertised setoption to a UCI engine is at best a
no-op and at worst a silently ignored calibration.

**3c. The applied record.** `SelectionEngineIdentity` gains optional
`eloApplied?: number`, present iff the band was requested *and* the option was advertised
*and* the setoption was sent. Absent means "this selection was not band-calibrated",
stated rather than assumed. `sameEngine` (`apps/server/src/service.ts:225-232`) extends to
compare it — see §4c for why that is required and not merely tidy.

**3d. The refusal.** A run requesting `targetElo` against an opponent engine reporting
`eloHonored: false` is **not** a hard failure: the mode is still `human_common` and it
still models human choice; only the band is unhonored. It is a **negotiation-time
disclosure**, through the same before-the-first-move channel as every other substitution
(§2e, *Client*), and the run's recorded selections say `eloApplied` absent forever after.
Silence here is the defect; a refusal that blocks play is an overreaction to it. Packs
whose objective is `save` are the exception: §7a's grading consumer, when it exists, has a
legitimate claim to require an honored band, and the ledger row in §8 records that.

**3e. What is deliberately *not* done.** No mode is added for "fallible". No engine is
weakened. No temperature/top-p ladder is invented as a difficulty dial — those two knobs
exist (`opponent-selector.ts:459-462`, defaults 0.8/0.92) and are Maia sampling
parameters, not a model of human error rate; presenting them as one would be the same
category error as weakened Stockfish, one layer up.

### 4. Determinism

The brief is right that this is the likeliest place to be wrong. The honest position, mode
by mode:

**4a. The gate is pure.** Category preservation is a pure function of the position and the
tablebase's immutable mathematics; positive tablebase entries have no TTL for exactly that
reason (`docs/tablebase-grounding.md:29`). The candidate cap (§2c) truncates a
lexicographically ordered list, so it cannot introduce order dependence.

**4b. The metric's Maia input is not provably pure, and this RFC does not pretend it
is.** Maia advertises no seed option and the repo records `seedHonored: false` for it
(`docs/engine-workers.md:87-89`). The policy scalars come from the model's policy head and
*should* be reproducible for a fixed checkpoint and input, but nothing in the repo has
measured that, and a mode whose selection is an argmax over those scalars must not assume
it. Therefore:

- **Determinism is delivered by record, not by construction.** The two shipped mechanisms
  do the work unchanged: the selection cache keyed on
  `(policyConfigDigest, packId, seed, historyHash)` (`opponent-selector.ts:182-186`), and
  read-back replay treating the logged selection as authoritative and never recomputing it
  (`docs/engine-workers.md:137-139`).
- **The recorded `concessionRatio` per candidate (§2d) is what makes this auditable**: a
  replay can show *what* was measured and *why* that move was chosen without re-running
  either instrument.
- **The recorded identity keeps saying `seedHonored: false`.** `practical_resistance`
  inherits Maia's honest limitation. It does not get `perfect_tablebase`'s
  `seedHonored: true`, which that mode earns by being a pure function
  (`opponent-selector.ts:404`).
- **Acceptance criterion 5 measures the open question** rather than assuming either
  answer: an integration probe repeating an identical Maia request N times and comparing
  the policy scalars byte-for-byte. If they are stable, a follow-up may upgrade this mode
  to determinism-by-construction and flip `seedHonored`; if they are not, the record is
  the only story and the RFC already told the truth.

**4c. The group reply journal cannot desync.** Fixed-resistance group replies search the
durable journal for a compatible selection at the same transpose key, requiring both
`compatibleAppliedMode` and `sameEngine` (`service.ts:924-936`, `:225-240`). Three
consequences, all deliberate:

- `practical_resistance` requests match only `practical_resistance` selections —
  `compatibleAppliedMode` (`service.ts:234-240`) gets **no new pair**. The one existing
  widening (`theory_strict` accepting `human_common`) exists because theory has an
  in-vocabulary honest substitute; practical resistance has none, exactly as
  `perfect_tablebase` has none.
- Because the journal is keyed on the transpose key and the metric is a function of the
  position, a journal hit is *the same measurement*, not a stale one — the same argument
  `grounding-pair` §2c made, weakened honestly from "a pure function cannot disagree with
  its own journal" to "the journal is the authority when the function might".
- `sameEngine` extended with `eloApplied` (§3c) means a reply measured at band 1500 is
  never reused for a band-1900 request. Within one run the band is constant, so no
  existing behavior changes; across the derived runs that carry a band
  (`service.ts:554`, `:564`) it is the difference between a correct reuse and a silent
  cross-band one. Historical selections have `eloApplied` absent on both sides and compare
  equal, so migration 20 rewrites nothing (§6).

**4d. A finding this RFC records and does not fix.** `strong_engine` searches with
`go movetime` (`opponent-selector.ts:488-496`) and no `ucinewgame` or `Clear Hash` is sent
anywhere in the server (verified by grep across `apps/server/src`), so its transposition
table carries across selections and its search is wall-clock-bounded. **`strong_engine` is
therefore not reproducible either**, and never has been; the group journal has been
carrying that mode for the same reason it will carry this one. Fixing it means fixed-depth
search with a cleared hash, which is a latency and strength change to a ratified profile
(`apps/server/src/strong-engine.ts:10-15`) and belongs in its own RFC. Ledger row in §8.

### 5. The D8 law, discharged again

The declared-vs-executable rule (`rfc/archive/defect-sweep.md:293-299`) admits a value
into the executable partition only with (1) **capability publication**, (2) **a named
refusal**, (3) **an applied record**. `practical_resistance` takes all three: publication
gated on two providers (§2e), four typed refusals (§2e), `policyModeApplied` on every
selection (§2d). This is the fourth design the law has decided — after `perfect_tablebase`,
`immediate_guard` and `policyModeApplied` itself (`design/BACKLOG.md:233`) — and the
second to move a value across the partition. §3's `eloHonored` is the same law applied one
level down, to an engine *option* rather than a vocabulary value: published, checked,
recorded.

### 6. Versioning

Run schema 0.13 → **0.15** (lane assignment; see the header claim for the 0.14 dependency
and the rebase rule). Three persisted widenings:

- `RunOpponentMode` and `PolicyModeApplied` gain `practical_resistance`
  (`types.ts:38-45`), on the run's `opponentPolicy.mode` and on every
  `opponent.move_selected.selection`;
- `SelectionCandidate` gains optional `concessionRatio` (`types.ts:64-68`);
- `SelectionEngineIdentity` gains optional `eloApplied` (`types.ts:70-77`).

Migration 20 (`STORAGE_VERSION` 19→20) is **stamp-only**, frozen literals `"0.14"` →
`"0.15"` (or `"0.13"` → `"0.15"` under the rebase rule), modelled on the migration-18 body
(`storage.ts:2704-2710`). No data rewrite exists to do: both new fields are optional and
historical selections simply lack them. Mandatory rather than optional because reads
filter on the current version (`storage.ts:624`, `:726`).

### 7. What this RFC does not ship, and what would supply it

**7a. Learner-side grading of practical difficulty — handed to the vocabulary lane.**
`resist` today grades "terminal loss AND authored checkpoint reached"
(`pack-orchestrator.ts:244-256`), where the checkpoint is a proxy such as "survive to ply
N". With §1 in the runtime, the real grade becomes expressible: *the learner's committed
moves kept the opponent's `humanConcessionMass` above threshold T for K plies*, or *the
learner reached a position whose `humanConcessionMass` for the opponent exceeded T*. That
needs a new `successCondition` kind and therefore a pack-schema version, and **0.16
through 0.19 are claimed** — this draft may not take one. The specification is stated here
so the metric is defined once (§1c of the motivation): the consuming draft should add a
`practical_difficulty` success condition carrying `{threshold, atLeastPlies?}`, evaluated
against `concessionRatio` values already recorded on the run's selections, and it should
name this RFC in `Depends on:`. **Until it exists, `resist` remains graded by an authored
proxy, and this RFC does not claim otherwise.** Same for `save`: §3's honored band is what
makes "realistic inaccuracies" a stated population rather than an assumption, but grading a
learner on having *exploited* them needs the same vocabulary.

**7b. The engine-gated classifier (the middlegame).** Lifting the seven-piece boundary
needs a concession classifier where no tablebase exists. The shape: Stockfish MultiPV at a
**fixed depth** (not movetime), `Threads 1` (already the default,
`strong-engine.ts:10-15`), with `ucinewgame`/`Clear Hash` before each probe (§4d — not
sent today), keeping every reply within a fixed centipawn window of the best; a move
concedes iff it falls outside the window. That is reproducible and honest as a *bounded
engine measurement at depth D*, never as a claim about the position. It is not shipped
because the cost is a Stockfish probe per candidate per ply against the 500 ms server-side
target (`docs/engine-workers.md:216-227`), and because the window width is a tuning
constant nobody has measured. **What would supply it:** a disposable latency-and-agreement
harness under the exploration gate (`rfc/0000-rfc-process.md` §Exploration gate) —
measure the per-ply cost at candidate depths, and measure how often the depth-D window
agrees with the tablebase classifier on positions where both are available. The second
measurement is the important one: it is the only way to know whether the engine-gated mode
is the same mode.

**7c. Explorer-seeded resistance.** RFC-0003's source list included "empirical corpus
distribution" (`archive/brief-v2/rfcs/RFC-0003-opponent-policy.md:11-18`), and
`docs/runtime-corpus-evidence.md:63-66` names explorer-seeded resistance as explicitly not
implemented. It stays that way here, for three reasons rather than one: it would need a
mode name and therefore a pack-schema version (closed lane); the population window is
computed from `now` at query time (`apps/server/src/corpus.ts:139-144`), so determinism
would require pinning the window into the run at creation, which is a run-shape change
this draft does not want to bundle; and coverage is opening-only with a 100-game
abstention floor (`docs/runtime-corpus-evidence.md:34`), which is the wrong half of the
board for the outcome types §Motivation is about. When it is drafted it should reuse §1
verbatim, with the corpus distribution substituted for Maia's — the primitive is
deliberately parameterized on the distribution for this reason.

**7d. `plan_defense` and `human_external`.** Untouched. They remain declared with their
checked refusals (`capabilities.ts:18`, `:23`). After this RFC the spectrum is five
executable modes and two declared, and the ledger row's "three of five" becomes
"five of seven, two honestly declared".

### 8. Ledger rows this RFC requires (not written here — `design/` is intent tier)

Per `AGENTS.md` law 4 and law 5, these belong in `design/BACKLOG.md` and this draft does
not edit it. On landing, the coordinating agent should add or flip:

1. "Resistance spectrum completion" (`design/BACKLOG.md:241`) — flip to ✅ for
   `practical_resistance`, with the correction that "fallible" was never a mode (§3).
2. **New:** "Practical difficulty has no learner-side grade" — the §7a handoff, naming the
   pack-schema lane holder.
3. **New:** "`strong_engine` is not reproducible" — the §4d finding: movetime search, no
   `ucinewgame`, hash carryover.
4. **New:** "Maia policy-scalar stability is unmeasured" — the §4b open question and the
   acceptance probe that answers it.
5. **New:** "`resist` is graded by an authored ply proxy" — true today, cited to
   `pack-orchestrator.ts:244-256`, resolved only by row 2.

## Deviations from design

**None**, with one design-tier proposal filed rather than taken.
`design/01-training-model.md:84` says **hold** is preserved "against strong or perfect
resistance" and `:118` says the Outcome Drill plays "vs exact/human resistance" — a
two-valued spectrum. This RFC adds a third answer that is neither strong nor human-typical
but difficulty-seeking. That is an *addition* to the design's vocabulary, and the design
tier is the owner's (law 5), so it is filed as ledger row 8.1 above and not written into
`design/01`.

## Acceptance criteria

1. **One definition.** `humanConcessionMass` exists once, in
   `packages/runtime/src/practical-difficulty.ts`, is pure, and is the only place in the
   repo where policy mass and concession classification are combined. A grep-based unit
   test asserts no second combination site.
2. **Deterministic gate and tiebreak.** Against fixture tablebase positions,
   `practical_resistance` returns the same move on every call for identical inputs;
   candidate sets exceeding eight truncate identically; an all-abstaining candidate set
   (§1d, policy scalars stripped) selects the lexicographically least category-preserving
   UCI and emits `DEGRADED_POLICY_MASS`.
3. **It is actually annoying, and it is measurably not `perfect_tablebase`.** On at least
   one fixture endgame where the DTZ-optimal move and the difficulty-maximizing move
   differ, `perfect_tablebase` and `practical_resistance` select **different** moves, and
   the recorded `concessionRatio` of the practical choice is strictly greater. This is the
   test that proves the mode is a new objective function rather than a renamed old one; if
   no such fixture can be constructed, the RFC's motivation is wrong and that must surface
   here rather than in a review.
4. **Never concedes.** Across a fixture suite, every `practical_resistance` selection
   preserves the selector's tablebase category; a constructed position with no
   category-preserving reply yields `PRACTICAL_RESISTANCE_UNAVAILABLE` and commits no
   move.
5. **Maia stability, measured.** A tagged `INTEGRATION=maia` probe issues the same request
   20 times and reports whether the policy scalars are byte-identical. The result is
   recorded in `docs/engine-workers.md` and in ledger row 8.4 **whichever way it comes
   out**; the mode ships either way, because §4b's determinism story does not depend on
   the answer.
6. **Band honesty.** With a spec declaring `bandOption` against an engine that does not
   advertise it: `eloHonored: false` in `/capabilities`, **no** `setoption name Elo` in the
   supervisor transcript, `eloApplied` absent from every recorded selection, and the
   substitution disclosed at negotiation. With an advertising fixture engine: the setoption
   is sent once and `eloApplied` is recorded.
7. **Journal integrity.** A fixed-resistance branch group under `practical_resistance`
   reuses a journal entry at a repeated transpose key and never reuses one recorded under a
   different mode or a different `eloApplied`; a `theory_strict`/`human_common` group
   replays byte-identically to its pre-RFC behavior.
8. **Named refusals.** Tablebase provider `none` **or** Maia absent → the mode is absent
   from `availableModes()` and `/capabilities.policyModes`. An eight-piece root declaring
   the mode → `PRACTICAL_RESISTANCE_OUT_OF_RANGE` at validation. Mid-run provider outage →
   `TABLEBASE_UNAVAILABLE`, no move committed under any other mode.
9. **Bindings and registers.** `pack-authoring.test.ts` set-equality and disjointness pass
   with the moved partition and **no pack-schema edit**; migration 20 is stamp-only and
   existing runs replay unchanged; `PositionOpponentPolicy` still refuses both new
   behaviors; `make verify` green; browser suite at zero retries.

## Open questions

1. **Is Maia's policy head reproducible across identical requests?** Acceptance criterion 5
   answers it empirically. If yes, a follow-up can promote `practical_resistance` to
   determinism-by-construction and record `seedHonored: true`; if no, §4b's
   determinism-by-record stands and nothing in this RFC changes. Deliberately not assumed
   in either direction.
2. **Does Maia-3 advertise an `Elo` UCI option?** §3 is written so that either answer is
   handled honestly, but the answer determines whether "band-calibrated human fallibility"
   is a shipped capability today or a shipped *claim*. Resolved at implementation by
   reading the supervisor transcript, not by reading source.
3. **Is the seven-piece boundary acceptable for a v1 "annoying" opponent?** It makes
   `practical_resistance` an endgame-only mode. That serves the outcome types this RFC is
   motivated by (`hold`/`save`/`resist` are endgame-shaped in every committed pack) but it
   means the middlegame "how can I annoy my opponent" question stays undrillable until §7b.
   **Owner-level:** an alternative is to ship the engine-gated classifier in this RFC and
   accept a latency and a tuning constant. This draft chose the exact instrument over the
   broad one; that choice is reversible before `accepted`.
4. **Should `save` packs be able to require an honored band?** §3d says the disclosure is
   enough for `human_common` generally, but a `save` objective's whole premise is a
   population's error rate. Requiring it means a validation-time capability dependency,
   which pack validation does not currently have (it is deployment-independent by design).
   Deferred to §7a's draft, which owns the objective vocabulary.
5. **Does `enumerated` belong in the REST literal list?** §2d notes the existing omission at
   `rest.ts:192-207`. Widening the list to the exported constant fixes it as a side effect;
   if the omission is deliberate, the implementation should preserve it explicitly rather
   than by accident.

## Changelog

- 2026-08-15: created. Register claims: run schema 0.15, migration 20 (with the stated
  rebase rule behind the 0.14 holder), **no** pack-schema claim. Ownership pins: the
  practical-difficulty primitive and the `eloHonored` capability seam.
- 2026-08-15: mid-draft, incorporated the owner's "how can i annoy my opponent" question
  shape — practical difficulty is now defined once as a shared primitive (§1) with the
  opponent as one consumer (§2) and learner-side grading handed to the vocabulary lane
  (§7a); the save/resist argument in §Motivation is strengthened from "no opponent" to "no
  opponent *and* no grading quantity"; enticement's dependency on a baitable opponent is
  recorded (§Motivation e).
