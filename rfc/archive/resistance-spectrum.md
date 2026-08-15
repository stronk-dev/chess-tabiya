# RFC: The resistance spectrum — practical difficulty as a measured primitive

- **Status:** implemented
- **Author:** claude (drafted on the parallel-wave assignment, 2026-08-15)
- **Created:** 2026-08-15
- **Design refs:** `design/01-training-model.md:81-91` (the four outcome types; **save** =
  "exploit realistic inaccuracies", **resist** = "maximize practical difficulty, reach
  resistance checkpoints"), `design/01-training-model.md:118` (Outcome Drill "vs
  exact/human resistance"), `design/05-in-run-experience.md:242` (rung 0 cannot be wrong
  about chess). Ledger rows, **cited by title** (line numbers move; titles do not):
  "Resistance spectrum completion (perfect/annoying/fallible)", "Recovery as a first-class
  skill" (*"the fuck up, then recover, and if recovery fails grind out the draw"*),
  "Punishment-free experimentation", "R4 answered: decidedness, not piece count, is the
  gate for measured difficulty", "Question shapes: the vocabulary supports one, players
  ask four", and the declared-vs-executable law recorded in `rfc/archive/defect-sweep.md`
  §2b (`defect-sweep.md:293-299`), pending promotion to design tier
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

**Register claims (parallel wave, 2026-08-15; rebased same day).** This RFC claims **run
schema 0.14** and **migration 19 (`STORAGE_VERSION` 18→19)**, stamp-only. Baseline:
`DRILL_RUN_SCHEMA_VERSION = "0.13"` (`packages/schema/src/index.ts:1`) and
`STORAGE_VERSION = 18` (`apps/server/src/storage.ts:387`), so 0.14 and 19 are each the
next free number and this draft is the single writer of both (`rfc/README.md` migration
register). **Say it loudly:** a run-schema bump *requires* a stamp migration — reads filter
on the current version (`storage.ts:624`, `:726`) and a run stamped with an old version
becomes invisible. Frozen literals: `"0.13"` → `"0.14"`.

*Rebase history (do not re-derive from it).* The draft first claimed 0.15 / migration 20
behind a sibling 0.14 holder, `own-game-rehearsal`. That holder was **cancelled before
drafting** — verification found game import, the ~8-moment story, story re-entry and PGN
export already shipped in `docs/game-import-and-story.md` — so this draft's own rebase rule
fired and it moved down a lane. Nothing below reads as 0.15 or 20; every occurrence has
been rewritten. Rebase, never renumber-in-place.

**No pack-schema version is claimed.** `practical_resistance` is already in the
`$defs/opponentPolicy.mode` enum (`schemas/drill_pack.schema.json:673-683`, the value at
`:678`), and that object is `additionalProperties: false` (`:690`) since pack 0.12, so the
policy is **parameter-free by construction** — §2f turns that constraint into the design.
The learner-side consumer of this RFC's primitive needs a new `successCondition` kind and
therefore a pack-schema version this draft may not take; §7a hands it to the vocabulary
lane instead of inventing it here.

**Ownership pins taken:** the practical-difficulty primitive
(`packages/runtime/src/practical-difficulty.ts`, new — the single definition §1 exists to
prevent being written twice) and the `eloHonored` capability seam in
`apps/server/src/engine-supervisor.ts`.


> **R4 MEASURED, 2026-08-15 — and absorbed into the body, not appended to it.**
> `design/research/practical-difficulty-outside-tablebase.md` ran the experiment §7b
> specified, over 171 in-range positions / 2,416 legal moves, with Stockfish holding no
> tablebase access (`tbhits 0`, empty `SyzygyPath`, no `.rtbw` on disk). This note is an
> index to where each finding now lives; **the sections are the specification, this is not.**
>
> | Finding | Absorbed in |
> |---|---|
> | §7b's centipawn *window* fails (κ 0.577, set match 66.1%); classifying by **outcome class** at ±100 cp gives κ 1.000 / 171-of-171, same probe, no extra cost | §7b, rewritten to the outcome-class formulation |
> | Outside the range it repairs nothing — median \|eval\| 43 cp, 10.2% of 284 decided, concession set reproduces on 29–54% vs 99.4–100% in range | §7b, and open question 3 |
> | Cost: only depth 8 fits <500 ms, and §2c needs a probe per candidate → ≈620 ms per selection at the least stable depth | §2c, §7b |
> | In range, 46.2% of positions have **no** conceding move at all | §2b step 4 (the new named refusal) and §2c |
> | Maia advertises `Elo` — `eloHonored` will be **true** | §3a, open question 2 (now closed) |
> | Maia returns a policy scalar at 120/120 probes but caps its candidate list at **20**, carrying a median 99.99% of the mass | §1d |
> | Maia latency at MultiPV 20–42 is 144–167 ms median, ~3× the documented 53 ms | §2c, §Deviations |
> | D35 quantified: no-reset changes 83.8% of evaluations and the best move on 89/171; the reset costs 6 ms | §4d |
> | Repeat requests returned byte-identical policy vectors on 60/60 pairs at n = 2 | §4b, acceptance criterion 5 |
>
> **The one reframe the measurement forces on the design: decidedness, not piece count, is
> the real gate.** The v1 scoping to ≤7 pieces is right in effect and wrong in reason. §2e
> and open question 3 now say so in those words, and §2b acts on the half of it that is
> free — but the piece-count boundary still ships, for reasons §7b and open question 3 give.

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
seven-piece boundary — which is a *classifier-availability* boundary standing proxy for the
real predicate, **decidedness** (§7b, open question 3) — with named refusals outside it and
a named refusal *inside* it whenever the measurement has nothing to maximize; (3) fixes the
honesty defect behind "fallible" — `targetElo` is sent to Maia blind and never verified, so
the one knob that would calibrate human error is an unchecked assumption; and (4) states
plainly what it does **not** ship and what would supply it, now with the R4 measurement
behind those refusals rather than an untested specification.

## Motivation

**a. Two shipped outcome types have no opponent that makes them real.** `design/01`
defines four outcome types and the pack schema, validator, orchestrator and grader all
implement four (`schemas/drill_pack.schema.json:196-200`;
`apps/server/src/pack-orchestrator.ts:258-260`, `:289-300`). Content tells the other half
of the story. **Re-derived 2026-08-15 against the tree at `ffc9817`, 43 pack documents in
`content/drafts/` (up from the 35 the R4 dossier snapshotted; the Scandinavian pair
landed in between): 12 `win` objectives, 5 `hold`, 1 `resist`, and zero `save`** —
counting trajectory legs, which contribute 2 of the `win` and 1 of the `hold`. The lone
`resist` is a browser test fixture whose own provenance says "Test-only fixture; never
publish as chess content" (`content/drafts/outcome-resist.browser.json`). The two packs
added since the dossier snapshot are both `follow_theory`, so growth has not moved these
counts and the claim is stable, not lucky. Two of the four outcome types have no authored
content, and the reason is mechanical rather than editorial:

- **save** is "start objectively worse; exploit realistic inaccuracies to reach a draw or
  real counterplay" (`design/01-training-model.md:85-86`). Against `strong_engine` or
  `perfect_tablebase` there are no inaccuracies to exploit; the drill is unwinnable by
  construction. Against `human_common` there are, but *how many* is unstated — §3.
- **resist** is "position may stay lost; maximize practical difficulty, reach resistance
  checkpoints" (`:87-88`). Its grading is a terminal loss **plus** the reach of one
  authored checkpoint (`pack-orchestrator.ts:289-300`; validation rejects terminal-only
  resist as ungradable, `OBJECTIVE_RESIST_NEEDS_CHECKPOINT`, `pack-validation.ts:282-283`).
  The checkpoint is an authored proxy — usually "survive to ply N". Nothing measures
  difficulty.

**b. The shipped "perfect" opponent literally optimizes for simplification.** This is not
rhetoric, it is the code. `#perfectTablebase` filters to the category-preserving replies
(`apps/server/src/opponent-selector.ts:547`) and then orders them by a metric that is
`Math.abs(move.preciseDtz ?? move.dtz ?? 0)`, **ascending when the position is winning**
(`:550-552`):

```ts
const winning=position.category.includes("win"),losing=position.category.includes("loss");
const metric=(move:TablebaseMove)=>Math.abs(move.preciseDtz??move.dtz??0);
const ordered=[...preserving].sort((left,right)=>winning?metric(left)-metric(right)||…
```

DTZ is distance-to-zeroing, and the zeroing move is a capture or a pawn move. The exact
opponent therefore takes the shortest path to the next irreversible simplification —
correct for "perfect play", and the precise opposite of an opponent that makes you work.
(When *losing* it maximises the same metric, which is longest resistance and is the right
sign; the simplification bias is specifically the winning branch, which is the branch a
`hold`/`save`/`resist` learner faces.) This is right for `perfect_tablebase` — it is what
perfection means under the fifty-move rule — and it is exactly why the spectrum needs a
mode whose objective is something else.

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
declared-but-unimplemented set `DECLARED_UNIMPLEMENTED_POLICY_MODES` holds exactly
`plan_defense`, `practical_resistance` and `human_external`
(`apps/server/src/capabilities.ts:18-25`) — there is no `fallible` slot and there should
not be one. Both halves of that argument were checked in code, not asserted:

- *`human_common` is the human-choice model.* `#humanCommon` is one Maia call at MultiPV 8
  (`opponent-selector.ts:478-486` → `#maia`, `:451-476`), sampling the model's own policy
  distribution. Nothing about it is a weakened search.
- *The real defect is one field.* `#maia` builds
  `setoption name Elo value ${request.policy.targetElo}` whenever `targetElo` is defined
  (`opponent-selector.ts:456-458`) with **no check that the engine advertises an `Elo`
  option**, even though the supervisor already collects the advertised option list
  (`engine-supervisor.ts:231-237`) and already converts one such name into a published
  honesty fact — `seedHonored` (`:115`, `:136-137`). One field over, the same list, the
  opposite treatment.

A drill whose objective is "exploit realistic inaccuracies" is standing on an unverified
claim about which population's inaccuracies it is exploiting. §3 fixes that with the
mechanism the repo already invented for seeds.

**e. Enticement is undrillable today.** "Entice a pawn trade to open the c-file" requires
an opponent that can be enticed. `strong_engine` takes only when best; `perfect_tablebase`
takes when it shortens DTZ (§b); `theory_strict` follows authored replies. Only a
band-calibrated human model can be baited, and only a difficulty-seeking opponent can
*decline* a trade because declining is annoying. Instrumental-play drills therefore depend
on this wave, and the dependency runs to the parallel vocabulary draft — noted in §7a
rather than claimed here.

**Out of scope**, each with its reason and its handoff:
learner-side grading of practical difficulty (needs a pack-schema `successCondition` kind
and the version lane is closed — §7a); the middlegame/opening concession gate (the
experiment this RFC specified has now been **run**, and it refuted the specified classifier
and repaired it; the repaired classifier still does not ship, for three measured reasons —
§7b); explorer-seeded resistance (needs a mode name, a pinned time window, and coverage this
repo does not have — §7c, which R4 promotes to the highest-value follow-up in the
territory); `plan_defense` and `human_external` (untouched, still declared with their
checked refusals); and making `strong_engine` itself reproducible (§4d records the finding,
now quantified, and files it without fixing it).

**In scope by cross-review, one item the draft left ambiguous:** D36, the
`policyModeApplied` wire narrowing that omits `"enumerated"`. This RFC edits that expression
and therefore owns it — §2d.

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
the run's `targetElo`, subject to §3. R4 §8 measured the scalar present on **120 of 120**
probes across bands 1100/1500/1900, in and out of range, with **zero** failures `[V]`, so
the instrument this reading depends on is not the fragile half of the primitive.

**1c. Reading two — the concession classifier `C`.** A move concedes for `S` when it
changes `S`'s outcome class. **In v1 there is exactly one admissible classifier**: the
tablebase category, taken from a single probe of `P` — the Lichess standard-tablebase
provider returns a category for *every* legal move in one response
(`TablebasePosition.moves`, `apps/server/src/tablebase.ts:15`), each stated for the
resulting position's side to move and therefore inverted through the shipped
`invertTablebaseCategory` (`tablebase.ts:18`) before comparison, exactly as
`#perfectTablebase` already does (`opponent-selector.ts:547`). A move concedes iff its
inverted category differs from `P`'s category. The full ten-value lattice is used as its
own rungs — `cursed-win` is not `win` (`tablebase.ts:5`) — so the fifty-move boundary is
already encoded, per `grounding-pair` §2c.

Two properties of that `≠`, one checked and one not:

- **It is symmetric by construction, and that is deliberate.** A move that *improves* the
  class — a draw found in a lost position — is also class-changing and is also flagged. R4
  §5.1 checked whether that ever fires over the committed corpus: all **554** class-changing
  moves are worsenings, zero are improvements `[V]`. The formulation is therefore doing no
  unintended work today. It would on a corpus of saveable lost positions — which is exactly
  what `save` content will be — so §7a's consuming draft must re-check it rather than
  inherit this finding.
- **It says nothing about how many conceding moves exist.** In range, R4 §5.1 measured that
  **46.2%** of positions have *no* conceding move at all `[V]`. §2b step 4 is the refusal
  that fact requires.

This makes the classifier **exact, free of engine opinion, and one HTTP probe per
position**. It is available only at seven pieces or fewer. The engine-gated classifier
that would lift that boundary is now *measured* rather than merely specified — §7b — and
still not shipped, for the reason given there.

**1d. Absent-mass honesty.** `practical_resistance` asks Maia for MultiPV
`max(8, |legal moves|)` candidates — its own request shape, not `#humanCommon`'s fixed 8
(`opponent-selector.ts:479`) — and mass outside the returned set is unmeasured, not zero.
**This is now a measured quantity, not a hedge.** R4 §8 observation 2 found that Maia
**caps its candidate list at 20 regardless of the requested MultiPV**, and that the
returned 20 carry a median **99.99%** of the policy mass, worst case **98.91%** `[V]`. The
absent mass is real and small, and the primitive must report it rather than assume it away.

The primitive therefore returns `{concedingMass, measuredMass, candidateCount}` and every
consumer compares `concedingMass / measuredMass`. If any returned candidate omits its
policy scalar, the primitive **abstains** — it returns `null` and emits the existing
`DEGRADED_POLICY_MASS` warning (`opponent-selector.ts:522`). It never substitutes
inverse-rank weights the way `theory_strict` sampling may: a rank-derived pseudo-mass is a
fine way to *pick* a move and a dishonest way to *report a measurement*.

**1e. Where it lives.** `packages/runtime/src/practical-difficulty.ts`, exported from
`packages/runtime/src/index.ts`, pure, with the Maia candidate list and the classified
move set passed in — no I/O, no engine handle. Both consumers (§2, §7a) call this one
function. **Any second definition of practical difficulty in this repo is a defect**;
§Acceptance criteria 7 makes that checkable.

### 2. `practical_resistance` — the opponent consumer ("annoying")

**2a. The vocabulary move.** `RUN_OPPONENT_MODES` gains `"practical_resistance"`
(`packages/runtime/src/types.ts:38-43`); the entry is deleted from
`DECLARED_UNIMPLEMENTED_POLICY_MODES` (`capabilities.ts:20-23`). The pack schema is not
edited — the enum already holds all seven modes
(`schemas/drill_pack.schema.json:673-683`). The binding test asserts set-equality between
the schema enum and `SUPPORTED_POLICY_MODES ∪ DECLARED_UNIMPLEMENTED_POLICY_MODES`, plus
their disjointness (`apps/server/src/pack-authoring.test.ts:65-80`); both pass mechanically
after the partition move, since the union is unchanged and the intersection stays empty.
This is the second time that transition runs, `grounding-pair` §2a being the first.

**2b. What "annoying" means, precisely.**

> Of the replies that do not concede your own result, play the one that leaves the learner
> the greatest measured chance of going wrong; break ties by lexicographically least UCI.
> **If no reply leaves the learner any measured chance of going wrong, say so and refuse —
> do not play the alphabetical one and keep the name.**

Formally, for the position `P` facing the selector with band `E`:

1. **Self-preservation gate.** Restrict to the legal replies whose inverted tablebase
   category equals `P`'s category — the identical filter `#perfectTablebase` computes
   (`opponent-selector.ts:547`). An annoying opponent that throws the game away is not
   annoying, it is losing. If no category-preserving move exists, refuse by name (§2e); do
   not silently accept a worse category.
2. **Difficulty maximization.** For each surviving reply `m`, compute
   `humanConcessionMass` of the resulting position `P·m` for the **learner** at band `E`
   (§1). Choose the `m` with the greatest `concedingMass / measuredMass`.
3. **Ties.** Equal *positive* ratios, or an all-abstaining candidate set (§1d), break to
   lexicographically least UCI — the `grounding-pair` §2c precedent, applied here for the
   same reason.
4. **Vacuity refusal — the decidedness gate, one boundary in.** If **every** surviving
   candidate scores `concedingMass == 0`, the argmax has nothing to maximize and step 3
   would silently degrade the mode to *play the alphabetically first legal reply*. Refuse
   by name instead: `PRACTICAL_RESISTANCE_UNDECIDABLE` (422, §2e). **This is not a corner
   case.** R4 §5.1 measured that 46.2% of in-range positions have no conceding move at all
   `[V]` — dead-drawn and dead-lost positions where nothing any side plays can change the
   class. The vacuous case for step 2 is the *joint* condition (every `P·m` is such a
   position for the learner), which is a subset of that and **has not been separately
   measured** — the honest statement is that the rate is unknown and plausibly large, which
   is precisely why it must be a refusal and not a fallback. Acceptance criterion 10
   measures it on the fixture suite.

This is a different objective function from every shipped mode, and it is stated as an
objective function rather than as a chess claim. It does not say the chosen move is good.
It says: among the moves that keep my result, this is the one after which the most
human-choice mass sits on losing replies, as measured by a named model at a named band.
When there is no such move it says so, rather than picking one and keeping the name.

**2c. Cost — measured, over budget, and stated rather than assumed.** A selection costs
**one tablebase probe for `P`, then one tablebase probe and one Maia call per surviving
candidate.** The original draft asserted this "stays inside the same envelope
`human_common` already meets". **That assertion is refuted by this RFC's own measurement
and is withdrawn.** The real figures:

- **Maia is sequential and wider than documented.** `EngineSupervisor` drives one UCI
  process per engine and `#client.execute` serializes, so N candidates are N *sequential*
  calls. R4 §8 measured a **144 ms median / 335 ms maximum** for in-range Maia probes at
  the MultiPV widths this mode needs `[V]`, against the 53 ms median
  `docs/engine-workers.md:218-227` records at MultiPV 8. At the draft's cap of eight
  candidates that is ≈**1.15 s** of Maia alone — 2.3× the whole budget, before a single
  tablebase probe.
- **The tablebase client is single-flight with a 4-deep queue.** `LichessTablebaseSource`
  runs one request at a time and rejects with `TABLEBASE_UNAVAILABLE` ("Interactive
  tablebase queue is full") once four callers are already waiting
  (`apps/server/src/tablebase.ts:27`). At the draft's cap this mode wanted nine probes per
  selection; they cannot be issued concurrently without self-inflicting that refusal, and
  issued serially they queue behind one another. Warm they are free — the positive cache is
  a 512-entry LRU with **no** TTL, because tablebase facts are immutable
  (`docs/tablebase-grounding.md:43`) — but a cold endgame root pays one round trip to
  `tablebase.lichess.org` per probe.

Three consequences, all normative:

1. **The candidate set is capped at 4**, not 8, ordered by lexicographic UCI before
   truncation so the cap itself is deterministic; a position with more category-preserving
   replies is measured on the first four and the recorded candidate list says so. A
   selection is then **5 tablebase probes and 4 Maia calls**. Four is chosen because it is
   the tablebase client's queue depth and because 4 × 144 ms ≈ 580 ms is the closest this
   objective gets to the `<500 ms` line without becoming a different objective — at three
   candidates the argmax is thin enough that the mode starts approximating a tiebreak. It is
   still over budget. §Deviations 2 records that rather than hiding it in a cap.
2. **Probes are issued serially and the per-candidate tablebase probe is looked up through
   the shipped client**, so the LRU absorbs the repeated-position case that branch groups
   and rewind generate. No second cache is introduced.
3. **Outside the seven-piece boundary the classifier does not exist and the mode refuses**
   (§2e). It does **not** fall back to a cheaper, different objective function under the
   same name, because one mode name covering two objectives is precisely the
   misrepresentation `policyModeApplied` exists to prevent. §7b now has the measurement
   showing what that cheaper objective would actually be.

**2d. Applied record.** Every selection records
`policyModeApplied: "practical_resistance"`. `PolicyModeApplied` widens automatically
through `RunOpponentMode | "enumerated" | "unknown"` (`types.ts:45`); the hand-narrowed
unions widen by hand: `makeSelection` (`opponent-selector.ts:265-277`, the literal union at
`:269`), the REST literal list (`apps/server/src/rest.ts:197-203`, inside
`parseOpponentSelection`), the client mode unions
(`apps/web/src/lib/session-controller.ts:140-146`). `PositionOpponentPolicy`
(`types.ts:60-62`) is **not** widened: Just Play stays `human_common | strong_engine`,
unchanged, as it did through `grounding-pair`.

The recorded candidates carry the measurement. `SelectionCandidate`
(`types.ts:64-68`) gains an optional `concessionRatio?: number` — the §1 ratio for the
position after that candidate, present only for `practical_resistance` selections. This is
the run-schema change of §6 and it is load-bearing for §4: the record is what makes the
selection auditable and replayable without recomputation. It is also what makes §2b step 4
visible after the fact — a refusal is a run event, but a *near*-vacuous selection (one
candidate at 0.02, the rest at zero) is only legible if the ratios were written down.

**D36 is scoped IN, deliberately, and the ledger row flips with this RFC.** The REST list
at `rest.ts:197-203` narrows to four modes plus `"unknown"` and omits `"enumerated"`, which
`types.ts:45` permits and `branch-groups` writes — ledger row "`policyModeApplied` literal
list omits `"enumerated"`" (D36 🐞, open). This RFC has to edit that exact expression
anyway, and the correct edit is to **narrow against the exported vocabulary rather than a
hand-written literal chain** — one membership test over
`[...RUN_OPPONENT_MODES, "enumerated", "unknown"]`. That fixes D36 as a structural
consequence, not as a bolted-on fifth literal, and it removes the class of defect rather
than one instance: a hand-copied union is what made D36 possible and what would make D36′
possible at the next mode. Adding `practical_resistance` to a four-literal chain while
leaving the chain hand-written would be shipping a new instance of the defect in the same
commit that names it. Acceptance criterion 9 and §8 row 6 carry this.

**2e. Refusals — all named, none silent.**

- *Static:* a pack declaring `practical_resistance` whose root exceeds seven pieces gets a
  `severity: "error"` runtime issue, `PRACTICAL_RESISTANCE_OUT_OF_RANGE` at
  `/opponentPolicy/mode`, emitted through `runtimeIssue` (`pack-validation.ts:102-107`)
  beside the existing `UNSUPPORTED_OPPONENT_POLICY` mode check and the
  `PERFECT_TABLEBASE_OUT_OF_RANGE` range check, which is the line-for-line model
  (`pack-validation.ts:510-528`). Piece count is monotone, so the root gate covers every
  reachable position. **Name it for what it is:** this is a *classifier-availability*
  boundary, not a difficulty boundary — see open question 3 and §7b.
- *Capability:* `availableModes()` (`opponent-selector.ts:393-401`) includes the mode iff
  **both** the tablebase provider and the Maia opponent engine are live — the mode needs
  two instruments, unlike every existing mode. `/capabilities.policyModes` reflects it
  through the same publication path that filters `perfect_tablebase`
  (`capabilities.ts:193`); that line is the D8 law executing and this mode extends its
  predicate rather than adding a parallel one.
- *Runtime:* provider absent/unreachable/negative-cached, or its interactive queue full →
  `TABLEBASE_UNAVAILABLE` (503, `retryAfterMs`; `tablebase.ts:27`); a position over seven
  pieces → `TABLEBASE_OUT_OF_RANGE` (422); Maia unavailable → the existing
  `ENGINE_UNAVAILABLE`; no category-preserving reply exists →
  `PRACTICAL_RESISTANCE_UNAVAILABLE` (422); every surviving candidate scores zero
  conceding mass (§2b step 4) → `PRACTICAL_RESISTANCE_UNDECIDABLE` (422). **The selector
  never falls through to another mode**, the `grounding-pair` §2e rule, for the same
  reason: a `human_common` move presented as practical resistance misreports the
  opponent's objective.
- *Client:* substitution may occur only at session negotiation, before any move, through
  the capabilities payload (`session-controller.ts:137-157`), and the existing
  requested-versus-applied surface discloses it
  (`docs/outcome-drill-grading.md:85-96`). Mid-run the turn does not advance.

Three new `ServerErrorCode` members, appended to the union at
`apps/server/src/errors.ts:1-58` (which currently ends at `REPERTOIRE_SCAN_UNAVAILABLE`,
`:58`): `PRACTICAL_RESISTANCE_OUT_OF_RANGE`, `PRACTICAL_RESISTANCE_UNAVAILABLE`,
`PRACTICAL_RESISTANCE_UNDECIDABLE`.

**Collision sweep, run independently 2026-08-15 against `ffc9817`.** All three names are
absent from `apps/server/src/errors.ts`, from `pack-validation.ts`'s runtime-issue codes,
and from every `.ts`/`.json`/`.md` under `apps/`, `packages/`, `schemas/` and `docs/` —
`grep -r "PRACTICAL_RESISTANCE"` returns zero hits repo-wide. Nearest neighbours are
`PERFECT_TABLEBASE_OUT_OF_RANGE` (`errors.ts:16`, used as a runtime-issue code at
`pack-validation.ts:528`) and `TABLEBASE_OUT_OF_RANGE` (`errors.ts:14`); the naming
follows the first exactly. Note the shipped precedent that a single identifier serves as
both a `ServerErrorCode` member and a `runtimeIssue` code — this RFC repeats it rather
than inventing a second vocabulary.

**2f. Parameter-free by construction, and that is correct.** `$defs/opponentPolicy` is
`additionalProperties: false` (pack 0.12), so `practical_resistance` can take no authored
knob without a pack-schema version this draft may not claim. That constraint produces the
right design: the only thing an author could plausibly tune is a difficulty threshold, and
a tuned threshold would be an authored assertion about how hard a position is — an
ungrounded chess claim wearing a number. The band comes from the run's existing
`targetElo`; everything else is measured.

### 3. "Fallible" — the missing thing is band honesty, not a mode

**3a. The finding.** `targetElo` flows from pack to run to selector to
`setoption name Elo value N` (`opponent-selector.ts:456-458`) with **no check that the
engine advertises an `Elo` option**. The supervisor already collects advertised option
names while parsing identity (`engine-supervisor.ts:231-237`) and already converts one
such name into a published honesty fact — `seedHonored` is true iff the configured seed
option was actually advertised (`:115`, `:136-137`), which is how the repo learned to
record `seedHonored: false` for Maia rather than claim determinism it does not have
(`docs/engine-workers.md:87-89`). The band knob never got the same treatment.

**The defect is the missing check, not an unknown answer.** The original draft said "this
RFC does not assert that Maia advertises the option or that it does not". That hedge was
wrong twice over and is withdrawn:

- **It is already documented.** `workers/maia/README.md:42-44`: *"First contact against the
  pinned source advertises `Elo`, `SelfElo`, `OppoElo`, `Temperature`, `TopP`, and
  `MultiPV`. It advertises no seed option, therefore `seedHonored` is `false`."* The repo
  recorded the answer to its own open question in the same paragraph where it recorded the
  seed answer, and the draft did not read it.
- **It is now also measured.** R4 §8 observation 3 confirms the same six options from a
  live handshake against the pinned image `[V]`, and observation 4 confirms the knob is not
  decorative — the policy vector differs across bands 1100/1500/1900 on **18 of 20**
  positions, the two exceptions being near-forced `[V]`.

So under §3b's mechanism `eloHonored` will be **true** for the shipped Maia spec: the seam
is a check that passes, and band-calibrated fallibility becomes a *shipped capability*
rather than a shipped claim. That does not make the seam optional. The defect the seam
fixes is that the deployment cannot currently *tell* — a policy whose whole purpose is
realistic human fallibility must publish which population it is being fallible as, and must
keep being right about it across a pin bump, an image swap, or a `FixtureEngine`. `Elo`
being advertised today is the reason the check is cheap, not a reason to skip it.

**3b. The mechanism, copied from the precedent.** `EngineSpec` gains an optional
`bandOption?: string` beside its existing `seedOption`; `parseIdentity`
(`engine-supervisor.ts:115-137`) sets `eloHonored: spec.bandOption === undefined ? false :
optionNames.has(spec.bandOption)`. `EngineIdentity` and `SelectionEngineIdentity`
(`types.ts:70-77`) carry it, `/capabilities.engines[]` publishes it
(`docs/engine-workers.md:194-203`), and the selector **only sends the setoption when the
option is advertised** — sending an unadvertised setoption to a UCI engine is at best a
no-op and at worst a silently ignored calibration.

**3c. The applied record.** `SelectionEngineIdentity` (`types.ts:70-77`) gains optional
`eloApplied?: number`, present iff the band was requested *and* the option was advertised
*and* the setoption was sent. Absent means "this selection was not band-calibrated",
stated rather than assumed. `selectionIdentity` (`opponent-selector.ts:252-263`) projects
it alongside the existing optional fields.

**`sameEngine` is *not* extended to compare it.** The original draft required that and
§4c argued for it; both were wrong, and §4c now carries the disproof and the correct
placement of the band comparison. The one-line reason: `sameEngine`'s right-hand operand
at the only call site is `selector.identityFor(mode)`
(`service.ts:926` → `opponent-selector.ts:403-409`), a **band-free live engine identity**
that can never carry `eloApplied`, so comparing the field would make every journal entry
mismatch and disable reuse entirely.

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
reason (`docs/tablebase-grounding.md:43`). The candidate cap (§2c) truncates a
lexicographically ordered list, so it cannot introduce order dependence. The **negative**
cache does have a TTL — 60 s after an upstream failure (`tablebase.ts:29`) — but it only
ever produces a refusal, never a different move, so it cannot make two selections disagree.

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
  the policy scalars byte-for-byte. R4 §8 observation 5 is an early, undersized reading in
  its favour — **60 of 60 repeat pairs byte-identical, at n = 2 repeats, not the 20 the
  criterion asks for** `[V]`, and the dossier explicitly declines to call it a result. If
  the 20-repeat probe agrees, a follow-up may upgrade this mode to
  determinism-by-construction and flip `seedHonored`; if it does not, the record is the
  only story and this RFC already told the truth. Nothing in §2 or §6 changes either way.

**4c. The group reply journal cannot desync — and the mechanism the draft proposed for
that would have broken it.** Fixed-resistance group replies search the durable journal for
a compatible selection at the same transpose key, requiring both `compatibleAppliedMode`
and `sameEngine` (`service.ts:926-937`; the predicates at `:227-234` and `:236-242`).

- `practical_resistance` requests match only `practical_resistance` selections —
  `compatibleAppliedMode` (`service.ts:236-242`) gets **no new pair**. The one existing
  widening (`theory_strict` accepting `human_common`) exists because theory has an
  in-vocabulary honest substitute; practical resistance has none, exactly as
  `perfect_tablebase` has none. Verified: the function is a two-term disjunction and adding
  a mode to `RunOpponentMode` does not widen it implicitly.
- Because the journal is keyed on the transpose key and the metric is a function of the
  position, a journal hit is *the same measurement*, not a stale one — the same argument
  `grounding-pair` §2c made, weakened honestly from "a pure function cannot disagree with
  its own journal" to "the journal is the authority when the function might".

**The cross-band correction.** The original draft extended `sameEngine` with `eloApplied`
and claimed it "means a reply measured at band 1500 is never reused for a band-1900
request". Reading the call site refutes that claim in three places, so the extension is
**dropped** (§3c) and replaced:

1. **The journal cannot cross runs at all.** The search iterates
   `opponentMovesFromEvents(stored.run.events)` (`service.ts:930`) — one run's own event
   log, filtered to members of one group. `stored.run.opponentPolicy.targetElo` is constant
   within a run, as the draft itself observed. A cross-band journal hit is therefore not
   merely unlikely, it is **unreachable**, and the defence the draft proposed defends
   nothing.
2. **The derived-run argument was the wrong mechanism.** `flip` (`service.ts:562`) and
   `createRepertoireGapRun` (`:571`) do carry a band forward, but each calls `createRun`
   with a **fresh id and a fresh event log**. Nothing in the group-reply path reads another
   run's journal. Those two line references were doing rhetorical work, not evidentiary
   work.
3. **The extension would have disabled reuse entirely.** `sameEngine(move.engine, identity)`
   compares a *journaled selection's* identity against
   `identity = selector.identityFor(mode)` (`service.ts:926`). `identityFor`
   (`opponent-selector.ts:403-409`) takes only a mode and returns
   `selectionIdentity(engineIdentity(client, engineId))` — a live handle identity with **no
   request, no policy, and therefore no band**. A journaled `eloApplied: 1500` would be
   compared against `undefined` on every single lookup, `sameEngine` would return `false`
   forever, and every band-carrying fixed-resistance group would silently stop reusing and
   start recomputing. Against Maia — `seedHonored: false`, determinism by record — that is
   exactly the group divergence §4c exists to prevent. **The draft's own desync defence was
   the desync.**

**Where the band comparison actually belongs, and why nothing needs to be added.** The
cross-run reuse surface is the *selection cache*, not the journal:
`selectionCacheKey` is `(policyConfigDigest, packId, seed, historyHash)`
(`opponent-selector.ts:182-186`), and it is process-global, so it genuinely can serve one
run's computation to another. It is **already band-safe**, and by construction rather than
by accident: `policyConfigDigest` is the run's `sessionDigest` (`service.ts:1760`,
`rest.ts:1026`), which is `digestSessionSource(session)` — an RFC-8785 canonicalization of
the whole session source including `opponentPolicy.targetElo`
(`packages/runtime/src/session.ts:113-120`, `service.ts:388`, `:461`, `:562`, `:571`). Two
runs at different bands have different session digests and therefore different cache keys.
A band-1500 reply cannot reach a band-1900 request through the cache.

So: `SelectionEngineIdentity.eloApplied` ships as a **recorded honesty fact** (§3c) — it
makes a replay able to say which population a selection was calibrated against — and
`sameEngine` (`service.ts:227-234`) is left byte-identical. Historical selections have
`eloApplied` absent, nothing compares it, and **migration 19 rewrites nothing** (§6).
Acceptance criterion 7 tests the reuse that must keep working, and acceptance criterion 11
tests the cross-band separation at the surface where it is real.

**4d. A finding this RFC records, quantifies, and does not fix (D35).** `strong_engine`
searches with `go movetime` (`opponent-selector.ts:488-496`; the same shape in `enumerate`,
`:418-426`) and **no `ucinewgame` or `Clear Hash` is sent anywhere in the server** — the
draft's grep, re-run by R4 §4.2 across `apps/server/src/`, `packages/` and `workers/`
including tests, still returns **zero matches** `[V]`. Its transposition table carries
across selections and its search is wall-clock-bounded. **`strong_engine` is therefore not
reproducible either**, and never has been; the group journal has been carrying that mode
for the same reason it will carry this one.

**Now measured, and larger than the draft assumed.** R4 §7 re-probed 171 in-range positions
at depth 12 with and without the reset: hash carry-over changes **83.8%** of individual move
evaluations (2,025 of 2,416) and the engine's own reported best move on **89 of 171**
positions `[V]`. Any consumer reading a *score* or a *best move* off the shipped
`strong_engine` path is reading a number that depends on what was searched before it. The
reset costs a flat **6 ms** median, invariant across depth `[V]` — so D35 is an omission,
not a cost trade-off. Fixing it still means fixed-depth search with a cleared hash, which is
a latency and strength change to a ratified profile
(`apps/server/src/strong-engine.ts:10-15`, `DEFAULT_STRONG_ENGINE_PROFILE`) and belongs in
its own RFC. Ledger row in §8 — the row already exists and now carries the numbers.

**One consequence that lands inside this RFC's scope.** R4 §7 also found the *outcome-class*
classifier robust to that hash noise in range — the concession set is identical on 171 of
171 positions and per-move classification agrees on 2,416 of 2,416 `[V]` — because a sign
test on a ±500 cp quantity does not move across a ±100 cp line. Out of range, where the
median |eval| is 43 cp, that robustness argument does not hold **and was not measured**.
That residual is one of the reasons §7b stays unshipped.

### 5. The D8 law, discharged again

The declared-vs-executable rule (`rfc/archive/defect-sweep.md:293-299`) admits a value
into the executable partition only with (1) **capability publication**, (2) **a named
refusal**, (3) **an applied record**. `practical_resistance` takes all three: publication
gated on two providers (§2e), five typed refusals (§2e), `policyModeApplied` on every
selection (§2d). This is the fourth design the law has decided — after `perfect_tablebase`,
`immediate_guard` and `policyModeApplied` itself — and the second to move a value across
the partition. §3's `eloHonored` is the same law applied one level down, to an engine
*option* rather than a vocabulary value: published, checked, recorded. §2d's D36 fix is the
same law applied to a wire narrowing that had drifted behind the vocabulary it narrows.

### 6. Versioning

Run schema 0.13 → **0.14** (`DRILL_RUN_SCHEMA_VERSION`, `packages/schema/src/index.ts:1`).
Three persisted widenings:

- `RunOpponentMode` and `PolicyModeApplied` gain `practical_resistance`
  (`types.ts:38-45`), on the run's `opponentPolicy.mode` and on every
  `opponent.move_selected.selection`;
- `SelectionCandidate` gains optional `concessionRatio` (`types.ts:64-68`);
- `SelectionEngineIdentity` gains optional `eloApplied` (`types.ts:70-77`).

**Migration 19 (`STORAGE_VERSION` 18→19) is stamp-only**, frozen literals `"0.13"` →
`"0.14"`, modelled body-for-body on the migration-18 stamp (`storage.ts:2704-2710`), which
selects rows at the previous literal, re-checks `snapshot.schemaVersion` before touching
each one, and writes the new literal:

```ts
const rows = …prepare("SELECT id, snapshot_json FROM drill_runs WHERE schema_version = '0.13'").all();
const update = …prepare("UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.14' WHERE id = ?");
… if (snapshot.schemaVersion !== "0.13") continue;
   update.run(JSON.stringify({ ...snapshot, schemaVersion: "0.14" }), row.id);
```

Literals are frozen rather than read from the constant, per the migration-4 lesson recorded
in the `rfc/README.md` migration register.

**It rewrites nothing, and that is checkable rather than asserted.** All three widenings are
additive: two are new *optional* fields that historical selections simply lack, and the
third adds a value to a union without changing any existing value. Nothing compares the new
fields — §4c drops the `sameEngine` extension that would have — so historical
group-journal rows compare exactly as they did before the migration, on the same six
fields (`service.ts:227-234`). The migration is **mandatory rather than optional** only
because reads filter on the current run-schema version (`storage.ts:624`, `:726`) and an
unstamped run becomes invisible. Acceptance criterion 9 asserts the replay equality.

### 7. What this RFC does not ship, and what would supply it

**7a. Learner-side grading of practical difficulty — handed to the vocabulary lane.**
`resist` today grades "terminal loss AND authored checkpoint reached"
(`pack-orchestrator.ts:289-300`), where the checkpoint is a proxy such as "survive to ply
N". With §1 in the runtime, the real grade becomes expressible: *the learner's committed
moves kept the opponent's `humanConcessionMass` above threshold T for K plies*, or *the
learner reached a position whose `humanConcessionMass` for the opponent exceeded T*. That
needs a new `successCondition` kind and therefore a pack-schema version, and **0.17 and
0.18 are claimed** by `tempo-vocabulary` and `predicate-wave-3` respectively — this draft
may not take one. The specification is stated here so the metric is defined once (§Motivation
c): the consuming draft should add a `practical_difficulty` success condition carrying
`{threshold, atLeastPlies?}`, evaluated against `concessionRatio` values already recorded
on the run's selections, and it should name this RFC in `Depends on:`.

**Two constraints R4 hands that draft, which it must not rediscover.** First, the condition
inherits a **decidedness** gate, not a piece-count gate — the metric is exactly gradable
only where the position has an outcome class, so a `practical_difficulty` condition
declared on an undecided position must load-refuse rather than evaluate to `false`. Second,
§1c's symmetric `≠` is unvalidated on saveable lost positions, which is precisely the
content `save` grading will consist of; that draft re-checks it rather than inheriting R4
§5.1's zero-improvements finding.

**Until it exists, `resist` remains graded by an authored proxy, and this RFC does not
claim otherwise.** R4 strengthens that from a concession into a finding: in undecided
positions the proxy cannot be replaced by a measurement at all, so authored ply proxies are
**correct** there rather than merely tolerated. Same for `save`: §3's honored band is what
makes "realistic inaccuracies" a stated population rather than an assumption, but grading a
learner on having *exploited* them needs the same vocabulary.

**7b. The engine-gated classifier (the middlegame) — specified, MEASURED, and still not
shipped.** This section asked for an experiment. `design/research/practical-difficulty-outside-tablebase.md`
ran it (2026-08-15, R4), over 171 in-range positions / 2,416 legal moves, with Stockfish
holding no tablebase access — `SyzygyPath` empty, no `.rtbw` on disk, `tbhits 0` on a
depth-16 probe `[V]` — so the in-range agreement below is between an NNUE search and Syzygy,
not between Syzygy and itself. The answer changes this section in three ways.

**(i) The classifier this section specified is the wrong one, and is replaced.** The
original text asked for "keeping every reply within a fixed centipawn window of the best; a
move concedes iff it falls outside the window". Swept at depth 12, that peaks at **κ =
0.577** (accuracy 0.806, 200 cp window) and gets the concession *set* exactly right on only
**66.1%** of positions `[V]`. The failure is structural, not a tuning miss: the window
measures *distance from the best move*, the tablebase measures *change of outcome class*. In
an already-lost position the tablebase says nothing concedes while the window flags every
move that is not the longest resistance; in a mate-in-6 the window flags every non-mating
move though many still win. **No window width reconciles them.**

**The corrected specification.** Classify each move's evaluation into `{win, draw, loss}` at
a threshold **T = 100 cp** and call a move conceding iff its class differs from the
position's class (i.e. from the best move's class). Same probe, same cost, one different
reading:

| Depth | median `go` | accuracy | **κ** | set match | FP | FN |
|---:|---:|---:|---:|---:|---:|---:|
| 8 | 6.9 ms | 0.9988 | 0.9965 | 0.994 | 3 | 0 |
| **12** | 42.8 ms | **1.0000** | **1.0000** | **1.000** | **0** | **0** |
| **16** | 170.0 ms | **1.0000** | **1.0000** | **1.000** | **0** | **0** |

`[V]`, 171 positions / 2,416 moves per row. Stockfish's own class for the position equals
the tablebase category on **171 of 171** at depths 8, 12 and 16, and §2b's self-preservation
gate has **zero unsafe admissions** — no move the engine gate keeps and the tablebase calls
conceding — at depth ≥ 6 `[V]`. The threshold is not delicate (T = 150 cp → κ 0.9988,
T = 50 cp → κ 0.9814; it degrades from T ≥ 200) `[V]`. The rest of the probe shape stands as
originally specified and was used as specified: MultiPV at the legal-move count, **fixed
depth, never movetime**, `Threads 1`, with `ucinewgame` + `Clear Hash` + `isready` before
every probe.

**(ii) It still does not ship, and the reason is no longer "unmeasured".** It is three
measured reasons:

- **Outside the range there is no outcome class to change.** Only **10.2%** of 284
  out-of-range positions are decided at depth 12 — median |eval| **43 cp**, p90 100 cp — and
  more depth makes it *more* balanced, not less (12.0% decided at depth 8, 5.8% at depth
  16) `[V]`. Against 88.3% in range. So at the threshold that scores κ = 1.000, the
  position's class is `draw` for ~90% of out-of-range positions and "concedes iff it changes
  the class" silently degenerates into "concedes iff its evaluation leaves ±100 cp" — a
  magnitude filter flagging **50.8%** of all legal moves, with **no oracle anywhere to check
  it against** `[V]`. That is a different quantity under the same name, which is the exact
  misrepresentation §2e refuses one boundary in.
- **It does not converge.** Fraction of positions whose concession set is identical at two
  consecutive depths: in range, 0.988 → **0.994** → **1.000** (6→8, 8→12, 12→16). Out of
  range, 0.366 → **0.398** → 0.538, and **no depth pair anywhere on the ladder from 1→2
  beats 0.538** `[V]`. The 1→2 pair (0.415) is no worse than 8→12 (0.398). A metric whose
  value depends on an arbitrary depth constant, in a regime where no oracle can adjudicate
  the constant, is a tuning knob presented as a measurement — the same objection §2f already
  makes to authored thresholds, applied to a depth.
- **The affordable depth is the unstable one.** Out-of-range probes (mean 31.8 legal moves,
  MultiPV at the legal-move count) cost a median **77 ms** at depth 8, **938 ms** at depth
  12, **~7.7–8.6 s** at depth 16 and **~39 s** at depth 20 `[V]`, against the `<500 ms`
  budget (`design/02-product-shape.md:162-163`). Only depth 8 fits — and §2c needs one probe
  *per candidate*, so a real selection is **≈620 ms at depth 8** even at the old cap of
  eight, ≈7.5 s at depth 12. Depth 8 is also the least stable depth out of range. There is
  no depth that is both affordable and stable, and none that is *meaningful*.

**(iii) What is left open, and what would supply it.** Not the agreement measurement — that
is done and this section is amended by it. What remains is the **decidedness-gated variant**:
a mode that probes once, checks |eval| against T, and refuses by name when the position is
undecided, extending honestly to the 9-piece won endgame and the middlegame that is already
+3. Three things it needs first, none of which this RFC can supply:

1. **A corpus containing decided middlegames.** R4's out-of-range half is 18 opening packs,
   1 middlegame pack and 2 cross-phase trajectories — authored theory lines, balanced by
   construction. Its 10.2% decided rate is a property of that corpus, a floor rather than an
   estimate, and 29 of 284 positions is not a population to measure an abstention rate on.
2. **The cross-depth stability control re-run on decided out-of-range positions**
   specifically. R4 §6.2's non-convergence is measured over the undecided majority; the
   decidedness gate would admit exactly the complement, and that set was not measured.
3. **The D35 hash-carry-over control re-run out of range.** R4 §7 shows the outcome-class
   classifier is robust to hash noise *in range*, where evaluations are polarized around
   ±500 cp. At a median |eval| of 43 cp that argument does not hold, and the control was not
   run.

Open question 3 records the resulting recommendation and its reasoning.

**7c. Explorer-seeded resistance.** RFC-0003's source list included "empirical corpus
distribution" (`archive/brief-v2/rfcs/RFC-0003-opponent-policy.md:11-18`), and
`docs/runtime-corpus-evidence.md:63-66` names explorer-seeded resistance as explicitly not
implemented. It stays that way here, for three reasons rather than one: it would need a
mode name and therefore a pack-schema version (closed lane); the population window is
computed from `now` at query time (`apps/server/src/corpus.ts:139-144`, `corpusPopulation`
defaulting to a 36-month window ending at the current month), so determinism would require
pinning the window into the run at creation, which is a run-shape change this draft does
not want to bundle; and coverage is opening-only with a 100-game abstention floor
(`docs/runtime-corpus-evidence.md:34`), which is the wrong half of the board for the outcome
types §Motivation is about. When it is drafted it should reuse §1 verbatim, with the corpus
distribution substituted for Maia's — the primitive is deliberately parameterized on the
distribution for this reason.

**R4 raises this from a deferral to the highest-value follow-up in the territory**, and the
reason is worth stating here because it inverts the usual ordering. §7b fails out of range
because the engine has no *result* to report there. Human games do: the explorer returns
per-move win/draw/loss counts at a rating band — an empirical result distribution over a
position, not an engine opinion at all, and it is the object "practical difficulty" actually
wants. Its blocker is coverage, which is a measurable question nobody has measured. **How
far explorer coverage reaches into middlegame positions is a cheaper and more decisive
experiment than any further engine tuning**, and it should be run before a §7b successor is
drafted, not after.

**7d. `plan_defense` and `human_external`.** Untouched. They remain declared with their
checked refusals (`capabilities.ts:19`, `:24`). After this RFC the spectrum is five
executable modes and two declared, and the ledger row "Resistance spectrum completion
(perfect/annoying/fallible)" turns its "three of five" into **"five of seven, two honestly
declared"**.

### 8. Ledger rows this RFC requires (not written here — `design/` is intent tier)

Per `AGENTS.md` law 4 and law 5, these belong in `design/BACKLOG.md` and this draft does
not edit it. **Cited by row title, not by line number** — the ledger is edited constantly
and every line citation in the original draft had already gone stale by cross-review.
**Rows 2–5 already exist**; the draft called them "New", which was true when it was written
and is not true now. They were added on landing and then updated with the R4 numbers, so
the work here is a flip or an amendment, not a creation:

| # | Row title | Current state | What lands with this RFC |
|---|---|---|---|
| 1 | Resistance spectrum completion (perfect/annoying/fallible) | 💡 | Flip to ✅ for `practical_resistance`, with the correction that **"fallible" was never a mode** (§3) and the count restated as five of seven |
| 2 | Practical difficulty has no learner-side grade | 💡, carries the R4 decidedness note | Amend with the two constraints §7a hands the consuming draft (decidedness gate; §1c's `≠` unvalidated on saveable positions) |
| 3 | `strong_engine` is not reproducible (D35 🐞) | 💡, already carries R4's 83.8% / 89-of-171 / 6 ms | No change needed; §4d cites it rather than restating it. Stays open — this RFC does not fix it |
| 4 | Maia policy-scalar stability is unmeasured | 📊 partial (60/60 at n = 2) | Flip to ✅ or 🐞 when acceptance criterion 5's 20-repeat probe reports, **whichever way it comes out** |
| 5 | `resist` is graded by an authored ply proxy | 💡, carries R4's "authored proxies remain CORRECT in undecided positions" | No change; §7a cites it |
| 6 | `policyModeApplied` literal list omits `"enumerated"` (D36 🐞) | 💡 open | **Flip to 🔨 shipped by this RFC §2d** — the narrow-against-the-constant fix, in the same commit, per the RFC completion protocol |
| 7 | R4 answered: decidedness, not piece count, is the gate for measured difficulty | ✅ | Amend with this RFC's ruling: the decidedness-gated variant is **not** taken in v1, with the three unmet prerequisites §7b(iii) lists. The row currently reads as though the variant is ready to build; it is the right variant and it is not yet buildable |
| 8 | **New:** `practical_resistance` selection cost exceeds the interactive budget | — | The §Deviations entry: N sequential Maia calls at a measured 144 ms, against a `<500 ms` line written for one. Owner-level, filed rather than resolved |

## Deviations from design

**Two**, one a vocabulary addition and one a measured budget breach. Neither is written
into `design/`; the design tier is the owner's (law 5), so both are filed as ledger rows.

**1. A third resistance answer (addition, not conflict).**
`design/01-training-model.md:84` says **hold** is preserved "against strong or perfect
resistance" and `:118` says the Outcome Drill plays "vs exact/human resistance" — a
two-valued spectrum. This RFC adds a third answer that is neither strong nor human-typical
but difficulty-seeking. That is an *addition* to the design's vocabulary. Filed as ledger
row 8.1 above.

**2. `practical_resistance` does not meet the interactive latency budget, and cannot.**
`design/02-product-shape.md:162-163` sets "uncached Maia **<500 ms**". That line was
written for a mode that makes **one** Maia call. This objective function requires one Maia
call *per candidate reply* — the learner's choice distribution in each resulting position
is the quantity being maximized, so there is no formulation of "annoying" that reads it
once. At the §2c cap of four candidates and R4's measured 144 ms median at the required
MultiPV widths, a warm-cache selection is ≈**580 ms**, and a cold one adds up to five
serialized round trips to `tablebase.lichess.org` on top.

This is stated as a deviation rather than engineered away because the three available
evasions are each worse than the breach:

- *Lower the cap to one or two.* At one candidate the argmax is vacuous and the mode is
  `perfect_tablebase` with extra steps; at two it is a coin flip wearing a measurement.
- *Parallelize.* `EngineSupervisor` drives one process per engine and the tablebase client
  is single-flight with a four-deep queue (`tablebase.ts:27`); concurrency would
  self-inflict `TABLEBASE_UNAVAILABLE` and would not help the Maia leg at all.
- *Precompute at authoring time.* Real, and the right long-term answer for authored spines
  — it is the shape grounding wave G1 already runs — but it covers only positions an author
  anticipated, which is the opposite of what a branch-and-rewind runtime generates.

**The honest disposition:** `practical_resistance` is a deliberately slower mode, and the
learner sees the existing thinking affordance rather than a broken promise. Whether a
~580 ms opponent is acceptable for an endgame drill is an **owner-level** call, not an
implementation detail, and it is filed as ledger row 8.8 rather than assumed. The budget
line itself may want an axis — *per instrument call* versus *per selection* — which is a
design-tier edit this RFC may not make.

## Acceptance criteria

1. **One definition.** `humanConcessionMass` exists once, in
   `packages/runtime/src/practical-difficulty.ts`, is pure, and is the only place in the
   repo where policy mass and concession classification are combined. A grep-based unit
   test asserts no second combination site.
2. **Deterministic gate and tiebreak.** Against fixture tablebase positions
   (`FixtureTablebaseSource`, `tablebase.ts:32`), `practical_resistance` returns the same
   move on every call for identical inputs; candidate sets exceeding **four** truncate
   identically after lexicographic ordering; an all-abstaining candidate set (§1d, policy
   scalars stripped) selects the lexicographically least category-preserving UCI and emits
   `DEGRADED_POLICY_MASS`. **Abstention and vacuity are distinguished:** a stripped-scalar
   set tiebreaks (criterion 2), an all-zero-mass set refuses (criterion 10). A test that
   passes both with the same outcome has not tested either.
3. **It is actually annoying, and it is measurably not `perfect_tablebase`.** On at least
   one fixture endgame where the DTZ-optimal move and the difficulty-maximizing move
   differ, `perfect_tablebase` and `practical_resistance` select **different** moves, and
   the recorded `concessionRatio` of the practical choice is **strictly greater than that
   of the DTZ-optimal move and strictly greater than zero** — the second clause matters,
   because a fixture where both are zero would pass a naive "different moves" assertion
   while actually exercising §2b step 4. The fixture must place the DTZ-optimal move inside
   the four-candidate cap, or the comparison is vacuous. This is the test that proves the
   mode is a new objective function rather than a renamed old one; if no such fixture can be
   constructed, the RFC's motivation is wrong and that must surface here rather than in a
   review. §Motivation b predicts exactly where to look: a won endgame where the shortest
   DTZ is a capture that simplifies into a trivially-held position.
4. **Never concedes.** Across a fixture suite, every `practical_resistance` selection
   preserves the selector's tablebase category; a constructed position with no
   category-preserving reply yields `PRACTICAL_RESISTANCE_UNAVAILABLE` and commits no
   move.
5. **Maia stability, measured.** A tagged `INTEGRATION=maia` probe issues the same request
   **20** times and reports whether the policy scalars are byte-identical. R4 §8's n = 2
   reading does not discharge this and is explicitly not accepted as one. The result is
   recorded in `docs/engine-workers.md` and in ledger row 8.4 **whichever way it comes
   out**; the mode ships either way, because §4b's determinism story does not depend on
   the answer.
6. **Band honesty, both directions.** Against the shipped `maiaDockerSpec` with
   `bandOption: "Elo"`: `eloHonored: **true**` in `/capabilities.engines[]`, the setoption
   sent once, `eloApplied` recorded on the selection — this is the expected production path
   per §3a, not the exotic one. Against a fixture engine that advertises no `Elo`:
   `eloHonored: false`, **no** `setoption name Elo` in the supervisor transcript,
   `eloApplied` absent from every recorded selection, and the substitution disclosed at
   negotiation. A test suite that only covers the second case has tested the refusal and not
   the capability.
7. **Journal integrity, and the reuse that must keep working.** A fixed-resistance branch
   group under `practical_resistance` reuses a journal entry at a repeated transpose key and
   never reuses one recorded under a different `policyModeApplied`. **A band-carrying
   `human_common` group still reuses its journal entries after the `eloApplied` field
   exists** — this is the regression §4c(3) identifies and is the single most important
   assertion in this list. A `theory_strict`/`human_common` group replays byte-identically
   to its pre-RFC behavior.
8. **Named refusals.** Tablebase provider `none` **or** Maia absent → the mode is absent
   from `availableModes()` and `/capabilities.policyModes`. An eight-piece root declaring
   the mode → `PRACTICAL_RESISTANCE_OUT_OF_RANGE` as a `severity: "error"` runtime issue at
   `/opponentPolicy/mode`, and the pack reports `valid: false`. Mid-run provider outage →
   `TABLEBASE_UNAVAILABLE`, no move committed under any other mode.
9. **Bindings and registers.** `pack-authoring.test.ts` set-equality and disjointness pass
   with the moved partition and **no pack-schema edit**; migration 19 is stamp-only, stamps
   `"0.13"` → `"0.14"`, and existing runs replay unchanged including their group-journal
   reuse decisions; `PositionOpponentPolicy` still refuses both new behaviors; **D36 is
   discharged — `rest.ts` accepts `"enumerated"`, asserted by a round-trip of a
   `branch-groups`-written enumerated selection through `parseOpponentSelection`, which
   fails today**; `make verify` green; browser suite at zero retries.
10. **Vacuity refuses rather than degrades (§2b step 4).** A fixture dead-drawn position in
    which every category-preserving reply leads to a position where the learner has no
    class-changing move yields `PRACTICAL_RESISTANCE_UNDECIDABLE` and commits no move. The
    test asserts the refusal *and* records the observed vacuity rate across the fixture
    suite, because §2b states that rate is unknown and the suite is the first place it can
    be seen.
11. **Cross-band separation, tested where it is real.** Two runs at bands 1500 and 1900,
    identical start, identical seed, identical pack: their `selectionCacheKey`s differ,
    because `policyConfigDigest` is the session digest and the session includes `targetElo`.
    Asserted directly on `digestSessionSource`, not inferred. The group journal is *not*
    tested for cross-band reuse, because §4c(1) shows it cannot occur.

## Open questions

1. **Is Maia's policy head reproducible across identical requests?** **Still open**, now
   with a signal. Acceptance criterion 5 answers it empirically at n = 20; R4 §8 saw 60 of
   60 repeat pairs byte-identical at n = 2 and explicitly declined to call that a result.
   If yes, a follow-up can promote `practical_resistance` to determinism-by-construction
   and record `seedHonored: true`; if no, §4b's determinism-by-record stands and nothing in
   this RFC changes. Deliberately not assumed in either direction.

2. **Does Maia-3 advertise an `Elo` UCI option?** ✅ **CLOSED, affirmative.** It does —
   `Elo`, `SelfElo`, `OppoElo`, `Temperature`, `TopP`, `MultiPV`, documented at
   `workers/maia/README.md:42-44` and re-confirmed by live handshake in R4 §8 `[V]`. So
   `eloHonored` is **true** for the shipped spec and band-calibrated human fallibility is a
   shipped *capability*, not a shipped claim. The check in §3b is still required — see §3a
   for why an answered question does not make a missing check optional — and acceptance
   criterion 6 now tests the affirmative path first.

3. **Piece-count gate or decidedness gate for v1?** ✅ **RESOLVED: piece count ships;
   decidedness is the stated reason, and the variant is filed with its prerequisites.**
   This was the reviewer-raised question and it deserves the reasoning, not just the answer.

   *What the measurement establishes.* The real predicate is **decidedness**, not piece
   count. R4 §5.3 + §6.1 are unambiguous: the classifier is exact where a position has an
   outcome class and degenerates into an unvalidatable magnitude filter where it does not.
   The seven-piece line is a **proxy** for that predicate — right in effect over the
   committed corpus, where the two sets coincide exactly, and wrong in reason.

   *Why the decidedness-gated variant is nonetheless not taken here.* It is not a gate
   swapped for a gate. Outside seven pieces the tablebase does not exist, so decidedness
   gating necessarily **admits a second classifier** — §7b's Stockfish outcome-class reading
   — which this RFC declared inadmissible in v1 (§1c) and which arrives with a threshold
   constant (T), a depth constant (D), and a per-candidate cost. Then:
   - **The gate is cheap and what it admits is not.** One decidedness probe is ~77 ms at
     depth 8. Passing it means paying one probe *per candidate*: ≈620 ms at the old cap of
     eight and the RFC is already over budget on the Maia leg alone (§Deviations).
   - **The admitted set is precisely the set nobody measured.** R4's stability and
     hash-robustness controls out of range were run over the undecided majority (median
     |eval| 43 cp). The decidedness gate admits the complement — 29 of 284 positions in
     that corpus — which is not a population, and the dossier says so in its own residuals.
     Shipping the variant would mean asserting stability on the exact set the experiment
     could not reach.
   - **The abstention rate is unknown in the phase it is for.** A middlegame `annoying`
     opponent that refuses ~90% of the time is not a mode, it is a disappointment, and no
     corpus in this repo can currently say whether that is the number.

   *What is taken instead, because it is free and it is the same insight.* §2b step 4 — the
   **vacuity refusal**. Inside the range, 46.2% of positions have no conceding move at all
   (R4 §5.1), and in those the argmax over `concedingMass` has nothing to maximize; the
   draft silently fell through to *lexicographically least UCI*, which is an opponent named
   difficulty-seeking that plays alphabetically. That is the decidedness defect in
   miniature, one boundary in, on the instrument that already ships, at zero cost. Refusing
   it by name is the honest half of the reframe and it lands in v1.

   *What that means for the boundary that ships.* The seven-piece gate stays, but §2e now
   names it for what it is — a **classifier-availability** boundary, not a difficulty
   boundary — and §7b(iii) records the decidedness-gated variant with its three unmet
   prerequisites so the next draft inherits the reasoning rather than the proxy. **Still
   owner-level, and still reversible before `accepted`:** shipping the broad instrument
   instead would mean accepting a tuning constant, a depth constant, and an unmeasured
   abstention rate, in exchange for reaching a phase where R4 says the metric currently
   stops meaning anything.

4. **Should `save` packs be able to require an honored band?** **Open, deferred.** §3d says
   the disclosure is enough for `human_common` generally, but a `save` objective's whole
   premise is a population's error rate. Now sharper than when it was written: since
   `eloHonored` is **true** on the shipped engine (question 2), the requirement would pass
   today and would only bite on a pin bump or an alternative deployment — which is exactly
   when it should bite. Requiring it still means a validation-time capability dependency,
   which pack validation does not currently have (it is deployment-independent by design).
   Deferred to §7a's draft, which owns the objective vocabulary.

5. **Does `enumerated` belong in the REST literal list?** ✅ **CLOSED: yes, and this RFC
   ships it.** The omission is the open ledger defect D36, not a deliberate narrowing —
   `branch-groups` writes `"enumerated"` and `types.ts:45` permits it, so the current list
   rejects a record the system itself produces. §2d takes the fix, narrowing against the
   exported vocabulary rather than adding a fifth literal, and §8 row 6 flips D36 in the
   same commit per the RFC completion protocol.

6. **Is a ~580 ms opponent acceptable for an endgame drill?** **Open, owner-level.** New
   at cross-review; see §Deviations 2 and ledger row 8.8. The three evasions are each worse
   than the breach, so the honest options are to accept the latency for this mode, to lower
   the `<500 ms` line's applicability to *per instrument call* rather than *per selection*
   (a design-tier edit this RFC may not make), or to not ship `practical_resistance`. This
   draft assumes the first and files the second.

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
- 2026-08-15: **rebased** to run schema **0.14** and **migration 19** after the 0.14 holder
  `own-game-rehearsal` was cancelled before drafting. Applied throughout the body, not only
  in a header note.
- 2026-08-15: **R4 landed** (`design/research/practical-difficulty-outside-tablebase.md`)
  and is absorbed section by section. §7b's centipawn-window classifier is replaced by the
  outcome-class formulation (κ 0.577 → 1.000) and its non-shipping is now three measured
  reasons rather than one unmeasured one; §1d carries Maia's 20-candidate cap and the
  99.99% measured mass; §4d quantifies D35; open question 2 closes affirmatively; open
  question 3 resolves with the piece-count-versus-decidedness reasoning.
- 2026-08-15: **adversarial cross-review** (independent reviewer, not the author). Four
  substantive corrections, all in the body:
  1. **§4c's `sameEngine`/`eloApplied` extension is withdrawn** — `identityFor` returns a
     band-free live identity, so comparing `eloApplied` would have disabled *all* journal
     reuse for band-carrying groups; the journal cannot cross runs anyway, and the real
     cross-run surface (the selection cache) is already band-safe through
     `policyConfigDigest = sessionDigest`. §3c and acceptance criteria 7 and 11 follow.
  2. **§2b gains step 4, the vacuity refusal** (`PRACTICAL_RESISTANCE_UNDECIDABLE`) — the
     draft's tiebreak silently degraded the mode to alphabetical play in the 46.2% of
     in-range positions that have no conceding move.
  3. **§2c's cost claim is refuted and rewritten** — the mode is N sequential Maia calls at
     a measured 144 ms plus up to five serialized tablebase probes behind a four-deep
     single-flight queue; the cap drops 8 → 4 and the residual breach is filed as a
     §Deviations entry and an owner-level open question 6.
  4. **§3a's hedge on the `Elo` option is withdrawn** — the answer was already committed in
     `workers/maia/README.md` at drafting time.
  Plus: D36 explicitly scoped **in** with its ledger flip (§2d, §8 row 6, open question 5);
  §8 corrected — four rows the draft called "New" already exist, and all ledger citations
  moved from line numbers to row titles; the content census re-derived at 43 packs; an
  independent refusal-code collision sweep recorded in §2e; and every code citation
  re-pinned by symbol against `ffc9817`.
