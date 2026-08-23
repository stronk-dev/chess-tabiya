# RFC: Bounded policy targets — one named target, three plies, and the two policy arms that bound it

- **Status:** draft — 2026-08-23
- **Author:** claude (drafted from `design/research/bounded-policy-targets.md` and re-verified line by line against `tools/d1023-bounded-policy-harness/`)
- **Created:** 2026-08-23
- **Design refs:** `design/00-thesis.md` (the instrument doctrine — *"Stockfish validates, Maia predicts, the corpus witnesses — none of them can teach why"* — is the whole shape of this RFC: three arms, three authorities, no fourth voice); `design/05-in-run-experience.md` §assistance ladder (these projections are requested operands, never a default stream). No design-tier section owns the named-target family; its intent authority is [[D558]]'s split and the [[D1023]] research closure, and a `design/` section remains owner work under law 5.
- **Exploration gate:** [[D1023]] ✅ — *"Named-target 2–3-ply prevention research is complete… The RFC may define exact removal/return plus policy-labelled bounds; intent, plan, prophylaxis and move quality remain refused without theory/authored joins."* The harness ran under `rfc/0000-rfc-process.md` §Exploration gate as a labelled disposable instrument. [[D1330]] ranked the resulting dossier **live debt rank 7**: *"[[D1023]] says drafting is unblocked and **no draft exists**."* That absence is what this RFC closes.
- **Depends on:** implemented `archive/evidence-contract-manifest.md` (F1 — the producer/projection/binding grammar and its compiler). `rfc/tactical-collectors.md` (awaiting) ships `rules.tactic.consequence.threat@1` and `rules.exchange.predicate.legal_exchange@1`, which are the exact inputs the rules arm is defined over — the harness imports both from `packages/runtime` rather than reimplementing them. `rfc/breadth-collectors.md` (awaiting) owns the contested-destination disposition this RFC closes one clause of (§2.5, criterion 16).
- **Parent / amends:** amends `rfc/breadth-collectors.md` §4 in one clause — [[D755]]'s escape hatch (*"unless a bounded continuation proves denial"*) is measured shut for the pawn-created destination family and the text still reads as open (§2.5). Amends nothing in `bot-policy.md`; §5 reconciles with it and with `bot-route-source.md` **without editing either**, and states why each reconciliation is a composition rule rather than an amendment.
- **Supersedes / superseded by:** —
- **Planning:** `planning/bounded-policy-targets/` (once implementing)

```tabiya-claims
none
```

**Why `none`, verified at HEAD, and why the verification is the interesting part.** Everything this
RFC adds is an additive `@1` identity declared through the shipped `producer()`/`projection()`
helpers in `packages/runtime/src/evidence-catalog.ts` — the same argument `tactical-collectors.md`
and `semantic-collectors.md` make, checked rather than inherited. Both helpers hardcode
`version: 1` (`evidence-catalog.ts:27`, `:29`, `:55`), so there is no projection version to move and
no register owns one. **Projections are not persisted**: `grep -n projection schemas/*.json` returns
zero, and the only evidence in the run schema is the four-member payload lane
(`schemas/drill_run.schema.json:501` — `kind ∈ ["eval","wdl","bestline","tablebase"]`, `:502-504` —
`source ∈ ["engine_validated","human_model_predicted","tablebase_exact"]`), which this RFC does not
widen: a bounded-target result is derived at read time from a FEN, a candidate and a provider page,
exactly as all 189 shipped projections are. `[V]` No `STRUCTURAL_FEATURE_KINDS` member is added
(`packages/schema/src/drill-pack/types.ts:372`), which is the one edit that would move
`DRILL_PACK_SCHEMA_VERSION`. Register heads verified with `node tools/register-check.mjs` at
drafting HEAD `476d5a0`: pack 0.27 (next free 0.33), run 0.17 (0.18–0.22 live-claimed, next free
0.23), shape-entry 0.3, principle-entry 0.1, campaign 1, migration 25, evidence-kinds 7 members —
**this RFC contests none of them, and in particular does not touch `bot-policy.md`'s unlanded
run-schema lane 0.18 or the `bot-route-source.md` cross-draft pin that rides it** (`rfc/README.md:366-377`).
`EvidenceGrounding` (`packages/runtime/src/evidence-contract.ts:3`) gains no member; §6.2 explains
why the mixed-grounding arms take the existing `declared_convention` value and why the compiler
*forces* that choice rather than leaving it to taste. The register row for this draft is added to
`rfc/README.md` in the registration commit, per Rule 6 (`rfc/0000-rfc-process.md:86-87`).

## Summary

A learner who plays a move and is told *"that stopped `Bxh7`"* is owed an exact statement about an
exact capture, not a strategic label. [[D1023]] measured whether that statement can be made
truthfully over a bounded horizon, and the answer is **yes as several typed facts with different
authorities, and no as one detector**. This RFC specifies those facts.

**The rules arm discriminates and its stronger form usually does not hold.** Over a fixed
enumerated population — every legal opponent move and every defender reply under a 25,000-position
cap — the played candidate removes the named target on **120/147 authored (81.63%)** and
**188/255 imported (73.73%)** identities, against **969/4,870 (19.90%)** and **2,309/8,927 (25.87%)**
for legal alternatives: a **4.10×** and **2.85×** lift. `[V]` But **69/120** and **130/188** of those
removals are undone inside the same three plies, and only **2/120** and **0/188** survive every legal
defence. `[V]` (`tools/d1023-bounded-policy-harness/exact-census-output.md`)

**Two directions the source dossier does not report, computed here from the committed census.**
First, conditional on removal the played candidate's removal is markedly **more durable** than an
alternative's — it survives the horizon **42.5%** of the time authored against **10.7%** for
alternatives (69/120 vs 865/969 reintroduced), and **30.9%** against **15.2%** imported
(130/188 vs 1,958/2,309). That is a second, independent discrimination of **3.97×** and **2.03×**,
same sign in both populations, and it is the strongest product-relevant number in the census. `[V]`
Second, and pointing the other way, the rare operand a surface would most want — *survives every
legal defence* — has **no measured lift and reverses in one population**: 2/120 = 1.67% played
against 9/969 = 0.93% alternatives authored, but **0/188 = 0% played against 29/2,309 = 1.26%
alternatives imported**. `[V]` So the exact fact is registerable and the *selection* of a moment on
it is not; §2.4 makes that a rule rather than a footnote.

**The two policy arms are bounded, labelled and abstaining.** Stockfish 18 agrees with itself
across depth 8 and depth 10 on **88/96 rows (91.67%)**, above the predeclared 90% gate, with all
**308** legal-root tables complete and every entry reaching its requested depth; the eight unstable
rows abstain rather than inherit a depth. `[V]` Maia admits a row only when the root and every
expanded second node retain **≥90%** of returned probability mass under an eight-move expansion, and
that admits **52/66/77/85 of 96** at bands 1000/1400/1800/2200 — **monotone in band**, which means
any aggregate over admitted rows is band-confounded before a single human behaviour enters (§4.4).
`[V]` Missing and tail mass stay in the upper bound and are never renormalized; the four bands never
merge; nothing is a human-likelihood claim.

**The destination family produces a negative and this RFC ships the negative.** All 75/75 authored
and 50/52 imported pawn-created minor-destination targets become locally non-losing again, **72 and
49 of them because the controlling pawn itself moved or was captured**, and **0/75 and 0/52** survive
every defence. `[V]` [[D755]] left exactly one door open — *"call it a contested destination, not
'prevention,' **unless a bounded continuation proves denial**"* — and the bounded continuation has
now run and closed it. No destination bounded-return projection registers here; the measurement lands
as a permanent negative fixture and `breadth-collectors` §4's clause is amended so no implementer
reads it as still open (§2.5, criterion 16).

**The bot consumer is specified in full and registers nothing, and the blockers are structural rather
than editorial** (§5): the layer that could carry a target-removal preference is a **multiplier**
(`applyPolicyMultiplier`, `bot-policy-catalog.ts:350`), so it can only reweight moves the base
already emitted; the layer that could *originate* one is `bot-route-source.md`'s `propose` effect,
whose `RouteTarget` is a set of occupancy requirements and **cannot express an opponent capture
predicate at all**; and [[D815]]'s closing sentence refuses a bot weight for exact threats in wording
wider than its salience-scoped evidence, which is [[D1320]]'s defect shape and is **the owner's to
scope, not mine** (Open question 1).

## Motivation

**The gap is exactly one document wide.** [[D1023]] closed on 2026-08-23 with the sentence
*"collector RFC drafting unblocked"*, and [[D1330]]'s per-dossier classification of all 118 research
artifacts found ten live-debt dossiers and ranked this one seventh on the plainest property in the
list: the research says drafting is unblocked and **no draft exists**. A grep of `rfc/*.md` for
`bounded-policy` or `named target` at drafting HEAD returns zero matches. `[V]` Two open ledger rows
name this RFC as their destination and have had none: [[D1025]] (*"Keep `next_execution_mass` and
`second_opportunity_available_mass` separate, never sum them"* — a correction made in the plan and
never written into a contract) and [[D771]] (the destination family's disposition). [[D558]]'s
partial closure lists *"non-mate 2–3-ply prevention/prophylaxis, split to [[D1023]]"* as one of its
named residues.

**Why the evidence is worth a contract rather than a dashboard.** Law 8's named anti-pattern is
*"Stockfish: +0.54 / Maia: 31% / LLM: 'Ne5 centralizes the knight'"*. The failure in that string is
not the numbers; it is that the third clause has no author. This family is the opposite shape: the
rules arm has a witness line an implementer can replay, the Stockfish arm carries its engine, both
depths and a typed score, the Maia arm carries its model id, band and an interval whose width is the
mass it could not see — and **no arm supplies meaning**. The dossier's operative sentence is
*"Strategic interpretation remains a join to cited theory or authored content; an LLM may render only
the admitted payload."* `[V]` That is a contract, and it is checkable.

**What a reader should not conclude from the headline lift.** The 4.10×/2.85× immediate-removal lift
is real and it is the weakest of the three facts, because 57.5% and 69.1% of those removals are
undone inside the horizon. An implementer who registers only the lift ships a surface that is right
about the first ply and silently wrong about the next two. §2 registers all three quantifier levels
as separate fields for that reason, and criterion 4 makes collapsing them a test failure.

**Out of scope, each with a named home and a named owner** ([[D1230]] — a deferral without a home is
not a deferral; a deferral without an owner is a wish):

| out of scope | why | home | owner |
|---|---|---|---|
| any registered bot trait over these quantities | [[D815]]'s wording refuses a bot weight for threat-derived evidence, and `bot-policy` §2.5's R11 trait gate has never been run for this family | Open question 1 + Discharge D4 | OWNER, then codex |
| a default post-move sentence naming a prevented target | refused, not deferred — §8.6; the dossier's own boundary (*"They do not authorize a default stream of sentences"*) and the assistance ladder | — | — |
| Review's choice of *which* removal moment is worth showing | needs a second admitted significance source this RFC does not own; `review-map.md` owns moment selection | Discharge D5 | claude |
| longitudinal habit inference over target opportunities | §4.4's band confound plus `longitudinal-store` carrying no opportunity denominator for this family | Discharge D6 | codex |
| a true cold-container Maia latency distribution | unmeasured — the first pass had up to 36 of 2,596 requests possibly warmed, and the replay is a cache hit | Discharge D3 | codex |
| horizons beyond three plies | the census enumerates ∀-replies at ply 3; a fourth ply is a different search with a different cap and D1025 says the fourth ply is undeclared | Discharge D7 | claude |
| a `prophylaxis` / `plan` / `intent` classifier | refused, not deferred — §8.1; [[D1023]]'s verdict refuses it by name and no measurement in this dossier bears on intent | — | — |

## Specification

### §0 — What D1023 established, what it did not, and what its dossier does not say

**Every headline number in `design/research/bounded-policy-targets.md` reproduces from the committed
artifacts.** That is stated first because it is not the usual result: a full re-derivation at HEAD
found **zero numeric drift** across the census table, the Stockfish agreement rate and latency
quartiles, the four-band admission counts, the paired-direction counts, the refusal decomposition,
the request count and the model identity fields. `[V]` The one wording defect found is small and
recorded in §0.3.

**§0.1 — The rules census, re-derived.** `[V]`
(`tools/d1023-bounded-policy-harness/exact-census-output.md`)

| | authored pack spines | sealed imported sample |
|---|---:|---:|
| decisions carrying a target / all | 116 / 754 | 183 / 579 |
| target identities | 147 | 255 |
| played: removed / preserved | 120 / 27 | 188 / 67 |
| alternatives: removed / preserved | 969 / 3,901 | 2,309 / 6,618 |
| immediate removal lift | **4.10×** | **2.85×** |
| played: reintroduced within 3 ply | 69 / 120 (57.5%) | 130 / 188 (69.1%) |
| alternatives: reintroduced | 865 / 969 (89.3%) | 1,958 / 2,309 (84.8%) |
| played: survives every legal defence | 2 / 120 | 0 / 188 |
| alternatives: survives every legal defence | 9 / 969 | 29 / 2,309 |
| budget exhausted (cap 25,000) | 0 | 0 |
| visited positions p99 / max, played | 1,826 / 1,913 | 2,140 / 2,185 |

**§0.2 — The two derived directions the dossier does not report.** Both are computed from the table
above, both are population-level contrasts over the fixed enumerated census rather than paired
comparisons, and both are stated with that caveat.

1. **Conditional durability discriminates, and more cleanly than immediate removal.** Given a
   removal happened, it survives the horizon on **42.5%** of played authored targets against
   **10.7%** of alternatives, and **30.9%** against **15.2%** imported — **3.97×** and **2.03×**.
   The dossier reports the played rates (*"57.5% of authored and 69.1% of imported played removals
   restore the same target"*) and calls the stronger story *"usually false"*, without contrasting
   them against the alternative rates, which makes a genuine second discrimination read as a
   weakness. `[V]`
2. **The rare operand does not discriminate and reverses.** *Survives every legal defence* is
   1.67% of played authored removals against 0.93% of alternative removals — and **0% of played
   imported removals against 1.26% of alternatives**. `[V]` The dossier calls it *"an honest rare
   operand, not an everyday hint"*, which is true and insufficient: it is also **directionless**, and
   on one population the counterfactual produces it more often. §2.4 turns this into a registration
   rule — the fact registers, the *selection* of a moment on it does not.

**§0.3 — The one wording defect.** The dossier writes *"Eleven focused tests include positive,
hard-negative, identity, castling and terminal controls."* `exact-target.test.ts` contains exactly
eleven `it()` blocks, but the eleventh is `"censuses both named-target families over the full bounded
horizon"` (`:699`) — the exhaustive fixed-population run the harness README describes separately as
taking *"about 150 seconds"*. The focused-control count is **ten**, plus one census. Corrected here;
criterion 1 counts the controls by name rather than by total.

**§0.4 — The Stockfish arm, re-derived.** 96 rows; category agreement across depths **88 (91.67%)**;
**308** probe tables, of which **0** are incomplete (`moves === entryCount` on every one) and **0**
fall short of the requested depth (`minReachedDepth === depth` on every one); cold latency
**72.0 / 337.0 / 630.8 / 735.1 ms** at p50/p90/p99/max over the 308 probes; warm pass **not measured**
(`warmProbeLatencyMs: null`). `[V]` (`stockfish-output.json`) Paired material directions, recomputed
from the 32 pairs rather than read off the dossier: played lowers immediate target selection at both
depths in **9/16 authored** and **5/16 imported**, raises it in **1/16** each, and is unclear in
6 and 10. Second-opportunity availability is **0 down / 3 up / 13 unclear** authored and
**2 / 1 / 13** imported — *mixed* is the dossier's word and it is fair, with the note that the
authored population shows zero pairs in the lowering direction. `[V]`

**§0.5 — The Maia arm, re-derived.** `[V]` (`maia-output.json`, `maia-timing-output.md`)

| band | admitted / 96 | root gate failures | second-node gate failures | admitted pairs / 32 | next-execution direction (up/down/unclear) | second-opportunity direction |
|---:|---:|---:|---:|---:|---:|---:|
| 1000 | 52 | 12 | 40 | 18 | 2 / 13 / 3 | 4 / 5 / 9 |
| 1400 | 66 | 9 | 24 | 25 | 3 / 17 / 5 | 6 / 7 / 12 |
| 1800 | 77 | 5 | 15 | 27 | 5 / 17 / 5 | 8 / 8 / 11 |
| 2200 | 85 | 4 | 8 | 28 | 4 / 19 / 5 | 8 / 9 / 11 |

The root and second-node failure columns overlap (8 rows fail both at band 1000, 1 at band 2200),
which is why 12 + 40 ≠ 44 refusals. `missingCandidateMasses` is **0 on all 384 band-rows**, so the
mass-completeness half of the gate never fired in the sealed sample — it is a real guard with no
production exercise, and §4.3 says what it guards against. Model identity is retained per row:
`maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe`, version `1e13597c…`, `eloHonored: true`,
**`seedHonored: false`**. Timing: first full pass **91.0 / 161.7 / 279.2 / 1,185.0 ms**, warm replay
**0.4 / 0.7 / 1.0 / 2.7 ms**, 2,596 requests per pass.

**§0.6 — What it did not establish, quoted so no downstream reader inflates it.** *"Nothing measured
establishes intent, strategic purpose, objective quality or a universal human likelihood."* `[V]`
Three further limits ride with it: the stratified provider sets *"validate the exact comparison and
direction per pair; they are not population-frequency estimates"*; the four bands *"must remain
separate"*, and *"'Human players are unlikely to play this' and a cross-band average are not
supported"*; and no human played, ranked or was surveyed on any of these lines, so nothing in this
RFC may carry a human-difficulty or human-likeness claim.

### §1 — Which prior refusals bind this RFC, and which do not

Six rulings touch this subject. **Two do not bind, two bind fully and are executed here, one binds
partially and is the owner's, one is measured shut by this evidence and is amended.** Each is quoted
at its own scope rather than summarised, per [[D1320]].

**§1.1 — [[D1025]]. Binds fully; this RFC is where it becomes a contract.** *"The D1023 provider plan
used 'target execution within the horizon' for two different events… Keep `next_execution_mass` and
`second_opportunity_available_mass` separate, never sum them, and treat actual second-opportunity
execution as outside v1."* `[V]` The instrument obeys it — `maia-probe.mts:108` adds path mass when
`targetPolicyMoveUci(atSecondOpportunity) !== undefined`, which is the target being **available**,
and there is no code path anywhere in the harness that assigns mass to *selecting* it at ply 3. `[V]`
The row is `🐞` and open, and its own note says *"permanent provider fixtures still required"*. §4.2
names the two fields, §8.7 refuses the sum, and criterion 9 is the permanent fixture the row asked
for.

**§1.2 — [[D1032]]. Binds fully; its correction is what makes the paired arm citable.** The first
sealed sample *"was stratified but not paired, so it could not compute the candidate deltas its own
plan required"*, and *"the old Stockfish result was rerun, not relabelled."* `[V]` Verified at HEAD:
`provider-sample.json` yields exactly **32 material pairs of size 2** and **32 standalone destination
rows**, every pair sharing source position, attacker identity and victim identity; the material rows
are 64 and the destination rows 32, summing to the 96 the two provider outputs carry. `[V]` §3.2's
counterfactual field exists because of this row: a target-policy result without its paired
alternative is a number with nothing to compare to.

**§1.3 — [[D817]]. Binds fully at its mechanism, and this RFC is narrower than it.** *"Multi-band
Maia disagreement does not track human band movement… Runtime multi-band queries multiply cost
without a validated difficulty/teachability signal and are excluded from F8."* `[V]` It was measured
on 1,171–1,283 shared move rows at Pearson **0.021–0.044** and sign agreement **47.2–52.0%**. Its
scope is (a) **band disagreement as a signal** and (b) **runtime multi-band fan-out in the bot lane**.
This RFC computes no disagreement statistic, no cross-band average and no per-band difference; the
four-band table in §0.5 is a research measurement of the instrument's own availability, not a
production shape. §4.5 pins the production shape at **one band per request**, and §8.3 refuses the
fan-out. `bot-policy.md` §5's sentence — *"Multi-band Maia queries are **not** a projection here and
never will be on current evidence ([[D817]])"* — is scoped by its own *here*, which is the
`opponent.selection` consumer; this RFC binds nowhere near it (§5.6).

**§1.4 — [[D815]]. Binds partially, its wording is wider than its evidence, and I do not lift it.**
The row closes: *"All three predeclared clauses fail. Exact threats remain valid descriptive evidence
for Support/Review/drills, but **no bot weight**, human-difficulty label or individual explanation may
be inferred."* `[V]` The measurement behind that sentence is three **salience** flags —
attacker-just-moved (29 usable positions), stationary-threat-created (7, against a floor of 20) —
which worsened grouped-CV RMSE by **0.477%** at permutation p **.677**. `[V]` So the **evidence**
refuses salience flags as predictors of human error on the R11 population, while the **wording**
refuses any bot weight derived from exact threats — and this RFC's family is derived from
`rules.tactic.consequence.threat@1`. That is exactly the shape `bot-route-source.md` §1.4 found in
`bot-policy` §9.5 and `bot-roster`'s out-of-scope row: a mechanism refusal written at goal scope.

**I refuse to resolve it by reading it generously.** Two facts make the generous reading tempting and
one makes it wrong: the operands here are *policy* quantities rather than threat geometry, and the
first clause explicitly permits *"Support/Review/drills"* — but the sentence says *bot weight*
without qualification and the row is closed, so re-scoping it is a ruling, not a reading. **This RFC
therefore registers no bot trait** (§5.5), and Open question 1 puts the scope to the owner with a
recommendation. Note that even at the generous reading the bot consumer is still blocked by
`bot-policy` §2.5's trait gate, which has never been run for this family — so the owner's answer
changes who is blocked, not whether.

**§1.5 — [[D771]]. Binds fully on the destination family, and this RFC does not disturb it.** *"A
pawn-controlled minor destination is a safety change, not a legal denial — and it is background
without context… It measures 1.00× authored (0.76–1.26) and 1.02× imported (0.74–1.34). Use it for
touch/hover, theory joins, bot features and opportunity-normalized habits; never default-render
'prevented,' intent, force or quality."* `[V]` The one-edge fact stays the truthful operand and stays
[[D771]]'s, unregistered at HEAD and routed to `breadth-collectors`. §2.5 adds only the bounded
result, and the bounded result is negative.

**§1.6 — [[D755]]. Measured shut by this evidence, and its text is amended.** *"A pawn controlling a
future bishop/knight square is not the same event as harassing an occupied minor… call it a contested
destination, not 'prevention,' **unless a bounded continuation proves denial**."* `[V]` The row is
closed and consumed by `breadth-collectors.md` §3.1/§4, whose refusal is written with that conditional
intact. The bounded continuation has now run over the full population and returns **0/75 authored and
0/52 imported** surviving every defence, with **72/75** and **49/50** of the returns caused by the
controlling pawn moving or being captured. `[V]` The conditional is not merely unmet — it is measured
shut for this family, and an implementer reading `breadth-collectors` §4 today would think it is still
a door. One textual amendment, made failable by criterion 16 rather than performed in this commit.

### §2 — The rules arm: one exact target, three plies, two quantifiers

**§2.1 — What a target is.** A target is **one pre-candidate positive material capture** identified
by attacker piece identity (colour, role, promoted flag, square), victim identity (colour, role,
square) and the baseline capture UCI. It is enumerated from `rules.tactic.consequence.threat@1`'s
positive set, whose convention text ships at `evidence-catalog.ts:307` — *"threat@1 gives the move to
the opponent and clears en-passant, then enumerates positive legal-exchange@1 captures and mate in
one. It abstains while the side to move is in check."* `[V]` Positivity is
`legalExchangeForMove(...).resultUnits > 0`, the shipped predicate, not a new one
(`exact-target.test.ts:12` imports `exchangeCaptureAt` and `legalExchangeForMove` from
`packages/runtime/src/exchange.js`). **This RFC adds no detector**; it adds a bounded question asked
about an already-registered one.

**§2.2 — Identity is tracked, never laundered.** A target survives the candidate move only if both
tracked pieces are still the same pieces. The harness tracks identity across the moving piece
(`advanceIdentity`), promotion, and **the rook's implicit move during castling** — chessops emits the
king-to-rook form and the rook's square changes without a move of its own, so a naive
square-keyed tracker would silently retarget. `[V]` (control test `"tracks the rook identity through
chessops rook-square castling"`, `exact-target.test.ts:667`) A candidate that destroys the identity
returns `identity_lost`, which is a **third immediate value**, never folded into `removed`. Measured:
`identity_lost` is 0 in all four census arms, which makes it an unexercised arm and a required
negative fixture rather than dead code.

**§2.3 — The immediate result and its closed cause vocabulary.** The immediate value is
`removed | preserved | identity_lost`. `removed` carries one of five causes and `preserved` is its
own: **`preserved`, `attacker_captured`, `target_moved`, `capture_illegal`, `exchange_neutralized`,
`identity_lost`** — the exact six-member union at `exact-target.test.ts:53`, closed, with measured
occupancy in every member except `identity_lost`. `[V]` The cause is load-bearing rather than
decorative: *"the attacker is gone"* and *"the exchange is no longer profitable"* are different
statements about the same board, and a surface that renders only `removed` cannot tell them apart.

**§2.4 — The two quantifiers, and why they are two fields.**

- **`reintroducedWithin3Ply`** is **∃ preparation ∃ reply**: some opponent preparation and some
  defender reply leave the exact positive capture available. It carries a **witness line** of four
  UCI moves (candidate, preparation, reply, capture).
- **`preparationSurvivesEveryDefence`** is **∃ preparation ∀ reply**: some preparation makes the
  capture available after *every* legal defender reply. It carries its own witness line, and when it
  is false the projection carries the **first refutation line** — the three-move prefix showing a
  defence that breaks it.

They are computed in one pass (`exact-target.test.ts:263-320`) and they are never one boolean.
**The measured spread is the argument**: 69 versus 2, and 130 versus 0. `[V]` A surface that
collapses them says *"unavoidable"* about a position where 58 of 60 defences work. §8.2 refuses the
collapse and criterion 4 fails a payload that carries one field where two are declared.

**And the strong field may not select a moment.** §0.2's second direction is a registration
constraint, not a caveat: *survives every legal defence* has no measured lift and reverses sign
between populations, so it may be **rendered when asked about a target** and may **never be the
reason a moment was chosen**. Review's selection rule is `review-map.md`'s (Discharge D5); this RFC
states the constraint so that rule cannot be written against a directionless statistic. Criterion 5.

**§2.5 — The pawn-created destination family: the bounded answer is negative, and the negative
ships.** A destination target is the same named bishop or knight and the same empty square: legal and
locally non-losing before the pawn move, still legal but locally losing **specifically to the moved
pawn** after it. The bounded question is whether that same minor-to-square move becomes locally
non-losing again after one preparation and one reply. Measured over the full population: `[V]`

| population | targets | return within 3 ply | of which the controlling pawn moved or was captured | survives every defence |
|---|---:|---:|---:|---:|
| authored | 75 | 75 / 75 | 72 | **0 / 75** |
| imported | 52 | 50 / 52 | 49 | **0 / 52** |

The return is essentially universal and it is essentially *not about the defender at all* — in 121 of
125 returns the pawn that created the denial left. **No destination bounded-return projection
registers.** What registers is the measurement as a permanent negative fixture (criterion 15) and the
[[D755]] amendment (criterion 16). This is following the evidence to a smaller registered surface,
which is the opposite of a scope cut: the full ask here was *"can we say the square is prevented for
three plies"*, and the full answer is **no, and here is the executable proof**.

**§2.6 — The horizon and the cap are declared literals, not parameters.** The horizon is exactly
three plies after the candidate — preparation, reply, then the capture's availability at the
opponent's second decision state. It is not configurable, because a fourth ply is a different search
whose ∀-arm cost is a different order and whose semantics [[D1025]] explicitly places outside v1
(Discharge D7). The enumeration cap is **25,000 visited positions**, exposed as the typed abstention
`budget_exhausted` — the same reason string the shipped bounded-mate predicate already uses
(`evidence-catalog.ts:444`). Measured headroom: the largest observed `visited` across all four arms is
**2,527**, so the cap has roughly ten times the observed worst case and **fired zero times**. `[V]`
It is a declared abstention, never a silent truncation, and criterion 6 asserts a synthetic
cap-exceeding fixture abstains rather than returning a partial answer as a complete one.

### §3 — The Stockfish arm: depth is an abstention label, not a claim

**§3.1 — What it measures.** For one named target and one candidate, at each of two declared depths,
the engine's own principal choice over the complete legal root is inspected for two booleans:
**`nextExecution`** — the engine's chosen move at the position after the candidate *is* the target
capture — and **`secondOpportunityAvailable`** — after the engine's first choice and the defender's
best reply, the exact target capture is available again. The projection retains the engine name and
command identity, both depths, per-depth legal-move count, entry count, min/max reached depth, the
engine's best move, and the **typed cp-or-mate score** (`{kind: "cp" | "mate", value}`) — never a
coerced integer, which is `move-quality-grades.md`'s [[D939]] lesson applied before it can recur here.

**§3.2 — The counterfactual is part of the fact.** [[D1032]]'s correction means a target-policy row
is only interpretable against its paired alternative over the same source position, attacker and
victim. The projection therefore carries `candidate`, `counterfactual` and the pair key, and a
consumer that renders one without the other is rendering a number with nothing to compare to.
Criterion 7.

**§3.3 — The stability gate, and the eight rows that abstain.** The category is the ordered pair
`(nextExecution, secondOpportunityAvailable)`. Agreement across depth 8 and depth 10 is **88/96 =
91.67%**, above the predeclared 90% gate. `[V]` The eight disagreeing rows **abstain** with the typed
reason `depth_category_unstable`; they do not inherit either depth's answer and they do not average.
This is the same discipline `grade.ts:125-128` already ships for comparisons — depth equality is an
*instrument-equality guard that triggers abstention*, not a claim — and it is the only shipped
precedent for depth-labelled evidence in the repository. Criterion 8, with the eight rows named as
the fixture population.

**§3.4 — Coverage is asserted, not assumed.** All **308** probe tables have `moves === entryCount`
and `minReachedDepth === depth`. `[V]` A table with a missing entry or a short-of-requested depth
abstains with `incomplete_root_table`; there is no partial-table answer.

**§3.5 — Cost is stated at its measured strength.** 72.0 / 337.0 / 630.8 / 735.1 ms at p50/p90/p99/max
over 308 cold probes; **no warm pass was measured**. `[V]` The dossier's sentence stands as the
normative one: *"This is a workflow cost input, not permission to put engine search on every
gesture."* §7 turns it into a binding rule.

### §4 — The Maia arm: bounded, band-labelled, one band per request

**§4.1 — The expansion, declared.** The root distribution at one band is requested at full legal
width, the top **`keptPerNode = 8`** moves are expanded, and for each the second node's top 8 replies
are read. Temperature **0.8**, top-p **0.92**. Every one of those numbers is a declared parameter that
rides the payload, because §4.4 shows the admission gate is a property of the expansion budget rather
than of the model.

**§4.2 — Two intervals, named for what they measure.**

- **`next_execution_mass`** — the mass the model assigns to *actually playing* the target capture at
  the opponent's next move. When the target move is present in the returned candidate list its mass
  is known and the interval is the degenerate `[m, m]`; when it is absent the interval is
  `[0, missingMass]` where `missingMass = max(0, 1 − Σ returned mass)`. (`maia-probe.mts:89-91`)
  The measured size of that second case matters and is small but not zero: across all 384 band-rows
  the minimum `returnedMass` is **0.9542** and 17 rows fall below 0.99, so an absent target is
  bounded at up to about **4.6%** rather than at an unbounded unknown. `[V]`
- **`second_opportunity_available_mass`** — the mass of paths that arrive at a state where the exact
  target capture is **available again**, summed over expanded first moves × expanded replies. The
  lower bound is the mass of paths verified available; the upper bound is `1 − knownFailure`, where
  `knownFailure` accumulates paths verified unavailable or terminal. (`:104-112`)

The gap between the bounds is exactly the mass the expansion did not look at. **It is never
renormalized away** (`bounds()` at `:81-83` takes `max(lower, 1 − knownFailure)` and rounds; there is
no division by retained mass anywhere in the probe). `[V]` [[D1025]]'s separation is structural here:
these are two objects computed at two different nodes, and §8.7 refuses their sum.

**§4.3 — The refusal, and the two clauses it has.** A row is admitted only when the root **and every
expanded second node** satisfy `keptMass ≥ 0.9` **and** `missingCandidateMasses === 0`
(`maia-probe.mts:93`, `:103`). The failure is a typed refusal `retained_mass_below_gate`, and a
refused row is excluded from every positive count rather than counted as zero. The second clause has
never fired in measurement (**0 across all 384 band-rows**) and it is the clause that matters most in
production, because of what produces a mass-less candidate: `opponent-selector.ts:633` injects
`Object.freeze({ moveUci, rank: maxRank + 1, offWindow: true as const })` when Maia's own `bestmove`
is missing from its returned list — **a row with no `mass` field at all**. `[V]` Treating that row as
mass 0 would understate `returnedMass`, silently widen `missingMass`, and push the fabricated
uncertainty into the upper bound of a published interval. **Rule: a distribution containing a
mass-less candidate refuses; it is never zeroed.** Criterion 10.

**§4.4 — Availability is monotone in band, and that is a confound, not a quality signal.** Admission
runs **52 / 66 / 77 / 85** of 96 at bands 1000 / 1400 / 1800 / 2200, decomposing into **12 / 9 / 5 / 4**
root failures and **40 / 24 / 15 / 8** second-node failures. `[V]` Lower bands lose more rows because
their distributions are wider under an eight-move expansion — which means **the admitted set is
systematically different at every band before any human behaviour enters**. Two consequences the
payload must carry so a consumer cannot get this wrong: the projection retains
`expandedSecondNodes`, `minimumSecondKeptMass`, `keptCount`, `candidateCount`, `returnedMass` and
`keptMass`, and **any aggregate a consumer computes must carry its band-specific denominator**.
Criterion 11 asserts an aggregate without a denominator fails. The dossier's sentence — *"This is
availability semantics, not evidence that lower-rated play is invalid"* — is the operative one, and
§8.5 refuses the inference in the other direction too.

**§4.5 — One band per request, and the band is the run's.** A request names exactly one band; there
is no multi-band form of this projection ([[D817]], §1.3). Where the projection describes a run's
opponent, the band **is** the run's applied band (`appliedTargetElo`, `apps/server/src/engine-band.ts:68`,
as `bot-policy` §2.1 requires), not a free parameter — otherwise a Review screen can report a number
about a band the learner never played. Where no run supplies one, the request must name a band
explicitly and the payload records which. Criterion 12.

**§4.6 — Identity, including the unflattering half.** Every row retains the model id, model version,
container-visible `modelId`, the applied band, `eloHonored`, and **`seedHonored: false`** — the model
does not honour the request seed, so two identical requests are not guaranteed identical. `[V]`
That is recorded on the payload rather than in a comment, because a consumer comparing two readings
needs to know they are not reproducible in the way a Stockfish depth-bounded reading is.

**§4.7 — Cost.** First full pass **91.0 / 161.7 / 279.2 / 1,185.0 ms**; warm replay
**0.4 / 0.7 / 1.0 / 2.7 ms**; one row-band costs at most **9** requests (a root plus up to eight
expanded second nodes), and the sealed sample's **2,596** requests across 96 rows × 4 bands average
**6.8** per row-band after FEN-level deduplication. `[V]` **A true cold-container distribution is
unmeasured** — the
first pass ran after `make up-engines` and a smoke pass, so up to 36 of 2,596 requests could already
have been cached, and the replay is a cache hit by construction. Discharge D3.

### §5 — Composition with the bot layer: three rules, one structural gap, no amendment

`bot-route-source.md` established the composition this section reconciles against:
**base → sampler → route source → guard → traits → draw**, with `propose` the only effect that may
add a row, and the guard asymmetry as its load-bearing rule. Everything below is a **composition
rule for this RFC's projections**; none of it edits `bot-policy.md`, `bot-roster.md` or
`bot-route-source.md`, and §5.5 explains why no bot layer registers here at all.

**§5.1 — The measurement basis is the raw policy vector, never the composed selection.** This is the
most important rule in this section and it follows directly from the guard asymmetry. When the guard
abstains — `provider_unavailable` or `empty_after_mask` — `bot-policy` §2.4 passes the base
distribution through **unmasked** (`bot-policy-catalog.ts:497-506`), and `bot-route-source.md` §6.2
adds that **every proposed row is dropped** on that same abstention. So the candidate list attached
to a recorded selection is one of at least three different objects depending on guard state and
proposer presence: the unguarded base, the masked base, or the masked base plus admitted proposals.
A `next_execution_mass` computed over that list would silently be a different quantity per selection.
**Rule: the Maia arm reads a fresh raw policy vector at a named band from the human-policy model. It
never reads `OpponentSelection.candidates`.** Criterion 13 supplies a fixture whose recorded
selection carries a guard-abstained unmasked list and asserts the projection does not consume it.

**§5.2 — The mass basis is keyed on base mass, never on proposal provenance; and a mass-less row
refuses the whole distribution. Two absences, two different treatments, and neither is zero.**
`bot-route-source.md` §7.4 makes `rawMass` optional and adds `proposedBy` with the invariant that
**exactly one of them is absent**, which invites the obvious rule *"exclude every `proposedBy` row
from the mass basis"*. **That rule is wrong, and [[D1372]] returned the invariant it rests on**:
D1084 resolved **26 of 41** route selections with *both* route provenance and retained Maia mass, so
base membership and proposal provenance are independent facets and a row can honestly carry both.
Excluding on `proposedBy` would therefore drop the majority of route selections — rows that do carry
human mass — out of a human-mass denominator, which is the same class of silent deletion §5.3
refuses for `offWindow`. **Rule: a candidate contributes to the mass basis if and only if it carries
base mass; `proposedBy` is orthogonal provenance and never gates the basis.** Stated this way the
rule is correct under the drafted XOR *and* under D1372's repair, so it is independent of landing
order. A row carrying `offWindow: true` is a different animal: it is a *provider artifact* with no
mass at all, and §4.3 refuses the whole distribution rather than excluding the row, because its
presence means the returned page is not a complete distribution. Criterion 10 covers the second;
criterion 14 covers the first.

**§5.3 — This RFC marks nothing `offWindow`, and there are five readers of that field, not three.**
`bot-route-source.md` §7.2 correctly names three **exclusion** consumers — `service.ts:1206` filters
off-window candidates out of the published distribution, `pivotal.ts:32` excludes them from pivotal
detection, `practical-difficulty.ts:37` excludes them from difficulty measurement. `[V]` Two further
readers exist and change the risk picture: **`feedback-policy.ts:39` propagates the field into the
public run event**, so it is client-visible, and **`rest.ts:183` and `:231` accept it on an ingested
selection**, so a client can *set* it. `[V]` A measurement-exclusion marker that an untrusted caller
can set on a candidate is worth knowing about before anything else is hung on it; this RFC hangs
nothing on it and criterion 14 asserts no bounded-target payload carries or produces the field.

**§5.4 — A bot preference over these quantities is not expressible as a trait, and the reason is
mechanical.** `bot-policy` §2.5's `ControlledTrait` is *"a declared candidate classifier … and a
multiplier over the post-guard distribution"*, executed by `applyPolicyMultiplier`
(`bot-policy-catalog.ts:512`), which maps over the existing rows and computes
`row.finalMass * multiplier(row.moveUci)` (`:350-356`). `[V]` So a `trait.target_removal` could
reweight a removing move the base already emitted and could **never** make a bot play a removal the
base never proposed — [[D1162]]'s law at the line, and the same wall `bot-route-source.md` §3
measured at 36.6% for routes.

**§5.5 — And the proposing layer cannot express it either. This is the structural gap.** The one
layer that may originate a candidate is `bot-route-source.md`'s `propose` effect, whose goal is a
`RouteTarget`: *"a set of `(role, square)` occupancy requirements"* with distance defined as the
count of unsatisfied requirements. *"My named piece is not capturable by that named attacker"* is
**not** an occupancy requirement — it is a predicate over an *opponent's* capture whose truth depends
on exchange arithmetic over the whole board, and there is nowhere in `RouteTarget` to put it. So at
HEAD **neither the shipped nor the drafted layer grammar can carry a target-preserving bot goal**,
and that is a finding about the layer rather than a limitation of this RFC. It is named, homed and
owned (Discharge D8, owner claude, home `rfc/bot-route-source.md`) rather than solved by widening
someone else's type from here. Combined with §1.4's [[D815]] wording and `bot-policy` §2.5's unrun
trait gate, **three independent gates stand between this evidence and a bot layer**, and this RFC
registers none.

**§5.6 — No collision with `bot-policy` §5's opponent projections, verified.** §5 of that RFC
registers `derived.opponent.choice_breadth@1` — [[D816]]'s admission, *"candidate-loss distribution or
named sufficient statistics + engine identity/depth/budget + legal-set completeness"* — bound
**`→ opponent.selection` only**. `[V]` The Stockfish arm here is a different quantity (a per-target
category over two depths, not a loss distribution over candidates) on a different producer with a
different binding, and the Maia arm is a mass interval about one named move rather than a breadth
statistic. Neither touches `derived.opponent`, `OpponentSelection`, run-schema lane 0.18, or the
`bot-route-source` pin that rides it. `bot-roster.md`'s twelve profiles are read-only inputs here:
§4.5 takes a run's band from the applied profile and writes nothing back.

### §6 — Registration contract

**§6.1 — Two new producers, six new projections.** Unit: **projection id**; the total is asserted by
set-equality against `make bounded-target-census` (§6.5), with the integer below baked in only as a
drift tripwire ([[D1240]]).

| producer | availability | implementation | projection | role | grounding | exactness |
|---|---|---|---|---|---|---|
| `rules.bounded_target` | `local` | `packages/runtime/src/bounded-target.ts` | `rules.bounded_target.reading.named_target@1` | reading | `position_rules` | exact |
| | | | `rules.bounded_target.reading.immediate@1` | reading | `position_rules` | exact |
| | | | `rules.bounded_target.reading.bounded_return@1` | reading | `declared_convention` | convention |
| `live.stockfish` *(existing)* | `provider` | its declared list `"apps/server/src/evidence-queue.ts; apps/server/src/rest.ts"` (`:768`) **gains** `apps/server/src/bounded-target-policy.ts` — the field is a `;`-separated list and `evidence-manifest-check.ts:58-60` asserts every path exists on disk | `live.stockfish.target_policy@1` | source_record | `bounded_search` | measured |
| `derived.bounded_target` | `local` | `apps/server/src/bounded-target-policy.ts` | `derived.bounded_target.engine_target_policy@1` | reading | `declared_convention` | convention |
| | | | `derived.bounded_target.policy_bounds@1` | reading | `declared_convention` | convention |

**Why a new `live.stockfish` projection rather than deriving from `live.stockfish.eval@1`.** Checked,
not assumed: `live.stockfish.eval@1` is `EvidencePayload.eval` with operands `["kind","source","values"]`
(`evidence-catalog.ts:770`) — a single evaluation, not a legal-root table at a declared depth. The
Stockfish arm needs the complete root table with per-entry reached depth, which no shipped projection
supplies, so the new source record is forced by the input rather than chosen. The Maia arm needs no
such addition: `human.maia.policy@1` already retains `["nodeId","engine","targetElo","candidates"]`
(`:782`), which is exactly a per-position candidate distribution at a band.

**Why a new `derived.bounded_target` producer rather than hanging the arms on `derived.opponent`.**
`derived.opponent` is bound `→ opponent.selection` only and is `bot-policy`'s surface; adding a
projection to it would widen a binding surface this RFC has no business widening (§5.6).

**§6.2 — The compiler forces the honest labels, and this is worth stating because it looks like a
choice.** `compileEvidenceManifest` refuses a derivation that widens its inputs
(`evidence-contract.ts:482-502`): a projection deriving from inputs of **mixed grounding** must
declare `grounding: "declared_convention"` (`:493-495`), its `exactness` may not widen (`:492`), its
`answerContent` must be a subset (`:496`), and it must propagate abstention with **`input_abstained`**
in its reasons (`:497`). Both derived arms take a `position_rules` input and a provider input, so
`declared_convention` and `convention` are compiled outcomes, not editorial modesty — and they are
also the truthful labels, since the three-ply horizon, the 25,000 cap, the two depths, the eight-move
expansion and the 90% floor are all declared conventions. `EvidenceGrounding` gains no member.

**§6.3 — The Maia arm is the first derived projection in the catalogue with a `human_model` input,
and that has to be argued rather than slipped in.** `candidateCollectorInputs`
(`evidence-catalog.ts:715-721`) filters `human.maia.candidate_wdl` out of
`derived.opponent.candidate_feature_vector@1` with a load-bearing comment: *"Maia WDL is an
alternative provider evaluation, not a local collector result."* `[V]` That reason is about **WDL
being an evaluation** — a competing verdict on the position — and it does not reach policy mass, whose
own shipped limitation reads *"Policy mass describes model choice, not move quality"* (`:782`). So
the exclusion does not bind, but its existence means this is a first, and criterion 17 makes the
distinction failable: a fixture attempting to feed `human.maia.candidate_wdl` into
`derived.bounded_target.policy_bounds@1` must fail, so the door opened here is exactly one
projection wide.

**§6.4 — Disposition, not binding, and the reason is that the binding is not this RFC's to make.**
Every projection here lands `disposition: inspector_only` — the shipped discipline for a reading that
lands before its consumer, via the `inspectorOnly` helper at `evidence-catalog.ts:580` (committed
examples: `rules.square.reading.control` at `:589`, *"All-square topology lands for research and
advanced inspection before module selection"*, and `human.maia.candidate_wdl@1` at `:783`, D744). The compiler's bound-XOR-disposed
invariant (`evidence-contract.ts:601-604`) makes this a real fork rather than a soft one: a projection
must have a binding **or** a disposition, never both and never neither. Binding to Support requires
`learner-modules`' requested-gesture contract; binding to Review requires the moment-selection rule
`review-map.md` owns (Discharge D5) — and §2.4 shows that rule cannot be written against the
strongest field. Registering a binding this RFC cannot make failable would be worse than declaring
the disposition honestly. Criterion 3 asserts the fork is taken deliberately: every id carries a
disposition whose `reason` names its blocking contract.

**§6.5 — The census is a procedure, and the integers are tripwires.** `make bounded-target-census`
recomputes, from the committed harness artifacts and the compiled catalogue: the registered id set,
the four census arms of §0.1, the destination table of §2.5, the Stockfish agreement and coverage
counts of §0.4, and the four-band admission decomposition of §0.5. Criteria assert **set-equality
against the command's output**; the integers in this document are baked in only as drift tripwires
([[D1240]]). Where a criterion quotes a measured number the number is the predeclared direction; a
contrary measurement is recorded and escalated under law 6, never shipped around.

**§6.6 — Pinned conventions (exact values; each ships verbatim in its declaration).**

| constant | value | where it is measured |
|---|---|---|
| `BOUNDED_TARGET_CONVENTION` | `"bounded-target@1"` | this RFC |
| horizon after the candidate | **3 plies** (preparation, reply, availability) | §2.6, [[D1025]] |
| enumeration cap | **25,000** visited positions | `exact-target.test.ts:17`; max observed 2,527 |
| immediate cause vocabulary | the closed six at `exact-target.test.ts:53` | §2.3 |
| `TARGET_POLICY_DEPTHS` | `[8, 10]` | `stockfish-output.json` `source.depths` |
| depth-agreement floor | **0.90** (measured 0.9167) | §3.3 |
| `TARGET_POLICY_KEPT_PER_NODE` | **8** | `maia-probe.mts` `KEPT` |
| retained-mass floor | **0.90**, root and every expanded second node | `maia-probe.mts:93`, `:103` |
| sampler parameters | temperature **0.8**, top-p **0.92** | `maia-output.json` `source` |

### §7 — Consumers, and the cost rule that follows from the measurement

The dossier's consumer posture, made normative. Each row states what the surface may do and the
measured fact that bounds it.

| consumer | admitted | bounded by |
|---|---|---|
| **Support / touch** | exact current-square or named-target explanation **on request**; the rules arm only, which is pure board arithmetic at `latency: sync` | **no provider call because a piece was hovered** — a provider arm requires an explicit request, on 72 ms (Stockfish p50) and 91 ms (Maia p50 first pass) of measured cost with the cold distribution unmeasured |
| **Review** | render a removal/reintroduction moment with its target, counterfactual and witness line | the moment must be selected by a **second admitted significance source**; the strong field may never be the selector (§2.4); moment selection is Discharge D5 |
| **Drills / theory** | an authored or cited claim names the strategic idea; these projections prove the concrete line and its bounded exceptions | law 8 — the join supplies the meaning, the projection supplies the line |
| **Bots** | nothing registers (§5.5) | three independent gates: [[D815]]'s wording, `bot-policy` §2.5's unrun trait gate, and the layer grammar that cannot express the goal |
| **Style / longitudinal** | nothing registers | §4.4's band confound plus the absent opportunity denominator; Discharge D6 |

**§7.1 — The declared-latency defect, found while writing this table and recorded rather than worked
around.** `producer()` derives latency from availability alone —
`availability === "provider" ? "interactive" : availability === "build_time" ? "offline" : "sync"`
(`evidence-catalog.ts:29`). `[V]` A **derived** producer is `local`, so it is declared `sync` **even
when every one of its inputs is a provider**. This already ships: `derived.grade` is `local`/`sync`
(`:812`) and derives from `live.stockfish.eval` (`:820`). `derived.bounded_target` would inherit the
same false cost label. The manifest is therefore not a safe source for *"is this cheap enough to run
on a gesture"*, and the answer for this family lives in §7's table instead. Named as a defect with a
home (Discharge D9) rather than patched from inside a collector RFC.

### §8 — What this RFC refuses, at mechanism level

1. **A `prophylaxis`, `plan` or `intent` classifier.** [[D1023]] refuses it by name and nothing
   measured bears on intent. The banned payload and rendering vocabulary is closed at
   **`prophylaxis`, `plan`, `intent`, `forced`, `best`, `mistake`, `good`, `bad`**, extended here with
   **`prevented`** for the destination family ([[D771]]) and **`unavoidable`** for anything short of
   the ∀-arm. Criterion 2 greps the shipped payload and renderer surface to zero and adds the words
   to `BANNED_JUDGEMENTS`.
2. **Collapsing ∃∃ into ∃∀.** §2.4; measured at 69 versus 2 and 130 versus 0.
3. **A multi-band fan-out, a cross-band average, or any band-disagreement statistic.** [[D817]], §1.3.
4. **Renormalizing missing or tail mass.** §4.2; the interval width *is* the unseen mass and dividing
   it away manufactures confidence.
5. **Inferring anything about lower-rated play from a lower admission rate.** §4.4; the gradient is a
   property of an eight-move expansion, not of the players.
6. **A default stream of sentences.** The dossier: *"They do not authorize a default stream of
   sentences, a move grade, or a strategic label."* Every consumer in §7 is request-initiated.
7. **Summing `next_execution_mass` and `second_opportunity_available_mass`.** [[D1025]], §1.1 —
   different nodes, different events, and one of them is availability rather than execution.
8. **Inheriting either depth on Stockfish disagreement.** §3.3; the eight rows abstain.
9. **Reusing `offWindow`, or emitting it.** §5.3 — three exclusion consumers, one propagation site
   and a client-settable ingest path.
10. **Reading `OpponentSelection.candidates` as a mass basis.** §5.1 — the guard asymmetry makes that
    list a different object per selection.
11. **A three-ply denial claim for the pawn-created destination family.** §2.5; 0/75, 0/52, with 121
    of 125 returns caused by the pawn leaving.
12. **Any human-difficulty, human-likeness or "players are unlikely to play this" claim.** §0.6; no
    human was measured anywhere in this dossier.

### §9 — Implementation surface

Unit: **production source file**; total: **8**. Criterion 18 counts the same unit.

| # | file | change |
|---|---|---|
| 1 | `packages/runtime/src/bounded-target.ts` (new) | target enumeration over `threats`/`legalExchangeForMove`, identity tracking incl. castling and promotion, the immediate result and its six causes, the bounded ∃∃/∃∀ pass with witness/refutation lines and the `budget_exhausted` cap (§2) |
| 2 | `packages/runtime/src/evidence-catalog.ts` | two producers, six projections, their dispositions, `dependsOn`/`derivation` declarations and the `EVIDENCE_PRODUCER_IDS` members (§6.1) |
| 3 | `packages/runtime/src/evidence-source-adapters.ts` | the sealing adapters; operand lists asserted equal to the manifest by the shipped `exactObject` (`:18-28`) |
| 4 | `packages/runtime/src/index.ts` | exports for the runtime consumers |
| 5 | `apps/server/src/bounded-target-policy.ts` (new) | the two provider arms: the two-depth legal-root probe and its category, and the single-band bounded expansion with the retained-mass refusal (§3, §4) |
| 6 | `apps/server/src/evidence-manifest.ts` | producer availability rows and binding summaries |
| 7 | `apps/server/src/capabilities.ts` | dispositions for the two new producers, passing `assertAdvertisedCapabilityDispositions` (`:167`) |
| 8 | `tools/bounded-target-census.mjs` (new) | `make bounded-target-census` (§6.5) |

Named validation and docs sites that necessarily move (the [[D828]] discipline — named, not implicit,
and not additional implementation homes): `packages/runtime/src/evidence-catalog.test.ts` (the
literal producer list at `:27` and the count tuples at `:51-52`),
`apps/server/src/evidence-manifest.test.ts:40`, `apps/server/src/evidence-manifest-check.ts`,
`docs/evidence-contract.md`, `docs/semantic-evidence.md`, and `Makefile` (the census target). **The
count tuple is a moving target at drafting time and the RFC says so rather than pinning a number that
is already stale**: the last commit carries `[35, 188, 25, 210]` and the working tree carries
`[35, 189, 25, 210]` because the in-flight `exact-legal-mobility` implementation is adding
`rules.mobility.reading.legal_moves@1`. `[V]` Criterion 18 asserts the delta this RFC contributes
(**+2 producers, +6 projections, +0 bindings**, since every id is disposed rather than bound), not an
absolute total.

### §10 — Where each finding is specified

Every finding this draft recorded is routed to the section that repairs it and the criterion that
makes the repair failable, so an implementer can work from the defect rather than from the prose.

| finding | specified in | made failable by |
|---|---|---|
| conditional durability is the discriminating statistic and is unreported | §0.2, §2.4 | criteria 4, 5 |
| the ∀-arm has no measured lift and reverses between populations | §0.2, §2.4 | criterion 5 |
| Maia admission is monotone in band, so aggregates are confounded | §4.4 | criterion 11 |
| an `offWindow` row has no mass and must refuse, not zero — and has five readers, not three | §4.3, §5.3 | criteria 10, 14 |
| [[D1372]]'s returned XOR would make the obvious basis rule drop 26 of 41 route selections; the basis is keyed on base mass instead | §5.2 | criterion 14 (two-armed) |
| the second-opportunity arm measures availability, never execution | §4.2, §1.1 | criterion 9 |
| the 90% gate is a property of the eight-move expansion budget | §4.1, §4.4 | criterion 11 |
| [[D815]]'s bot refusal is written wider than its salience-scoped evidence | §1.4, §5.5 | Open question 1 |
| [[D755]]'s "unless a bounded continuation proves denial" is measured shut | §1.6, §2.5 | criteria 15, 16 |
| no derived projection takes a `human_model` input, and the exclusion's reason does not reach policy mass | §6.3 | criterion 17 |
| a derived producer is declared `sync` even when every input is a provider | §7.1 | Discharge D9 |
| neither the shipped nor the drafted layer grammar can express a target-preserving bot goal | §5.4, §5.5 | Discharge D8 |

## Deviations from design

**One, and it is a narrowing rather than a widening.** `design/05-in-run-experience.md`'s assistance
ladder is written as a graded surface the learner climbs. Every projection here sits **outside** the
ladder: none is a rung, none fires by default, and all six are request-initiated readings with an
`inspector_only` disposition. The design's *intent* — that assistance is asked for rather than pushed
— is served exactly; its *shape* is not, because a rung implies a default and this family has none
until Review's selection rule exists. Recorded here rather than silently, and the owner may direct
otherwise on the same authority that would answer Open question 1.

## Acceptance criteria

> **Findings landed 2026-08-23.** [[D1389]] — `offWindow` has five readers and is settable by an untrusted caller. [[D1390]] — declared latency is derived from availability alone. [[D1391]] — no shipped or drafted grammar can express a target-preserving bot goal. [[D1392]] — the dossier re-derived with zero drift; its two unreported directions are recorded.

Every criterion can fail ([[D451]]). Where a criterion quotes a measured number, the number is the
predeclared direction and a drift tripwire; a contrary measurement is recorded and escalated per
law 6, never shipped around. Where a criterion asserts a total, it asserts **set-equality against
`make bounded-target-census`** and never against a hand-count ([[D1240]]).

1. **Registration completeness.** The six ids of §6.1 exist in the compiled catalogue;
   `make evidence-manifest-check semantic-evidence-check` passes; the docs tuples move in the same
   change. The ten focused controls of `exact-target.test.ts` are ported by **name** — preserved vs
   removed, identity tracking after the target moves, ∃∃ weaker than ∃∀, attacker-captured as removal
   rather than identity loss, abstention while checked, closed fact vocabulary, canonical fixture
   FENs, castling rook identity, the fixed ∀-positive, destination denial separate from legality —
   not by count (§0.3). *Wrong implementation that would pass a weaker check: one that ports "eleven
   tests" and drops the castling control.*
2. **The refused vocabulary is enforced, not documented.** `prophylaxis`, `plan`, `intent`, `forced`,
   `best`, `mistake`, `good`, `bad`, `prevented`, `unavoidable` are added to `BANNED_JUDGEMENTS` and
   a grep over the payload and renderer surface returns zero. *Fails if any word reaches a rendered
   string.*
3. **Every id is disposed, none is bound, and each disposition names its blocking contract.** A
   fixture asserts the bound-XOR-disposed invariant holds for all six and that each `reason` string
   names either `learner-modules`, `review-map` or Discharge D5. *Fails if a binding is added without
   the selection rule that licenses it.*
4. **The two quantifiers are two fields and a payload with one fails.** A fixture asserts a bounded
   return payload carries `reintroducedWithin3Ply`, `preparationSurvivesEveryDefence`, a witness line
   for each true arm and a refutation line when the ∀-arm is false. A payload folding them into one
   boolean is a must-fail fixture. *This is §2.4's measured 69-vs-2 spread made unrepeatable.*
5. **The ∀-arm may not select.** A fixture supplies a candidate whose only distinguishing property is
   `preparationSurvivesEveryDefence: true` and asserts no selection API returns it as a chosen
   moment. *Fails if a moment can be chosen on a statistic measured at 0% versus 1.26%.*
6. **The cap abstains rather than truncating.** A synthetic fixture exceeding 25,000 visited positions
   returns `budget_exhausted` with no `reintroducedWithin3Ply: false` claim attached. *Wrong
   implementation that would pass a weaker check: one returning a partial search as a complete
   negative.*
7. **The counterfactual rides the engine fact.** A fixture asserts an
   `engine_target_policy@1` payload without its paired alternative fails to compile the projection.
   ([[D1032]], §3.2.)
8. **Depth disagreement abstains, demonstrated on the measured eight.** The eight rows whose
   depth-8 and depth-10 categories disagree in `stockfish-output.json` are the fixture population;
   each must return `depth_category_unstable`, and the remaining 88 must return a category. A
   fixture that inherits depth 10's answer on a disagreeing row must fail. *Set-equality against the
   census; 88/96 is the tripwire.*
9. **`next_execution_mass` and `second_opportunity_available_mass` are never summed, and the second is
   named for availability.** The permanent provider fixture [[D1025]] asked for: a row where the
   target is unavailable at ply 1 and available on some ply-3 path asserts a zero first interval and
   a positive second, and any code path adding them is a must-fail fixture. *This is the row's own
   requested closure.*
10. **A mass-less candidate refuses the distribution.** A fixture supplies a page containing
    `{ moveUci, rank, offWindow: true }` with no `mass` and asserts `retained_mass_below_gate`, not a
    zero-mass row. *Fails if the row is treated as mass 0, which would widen the published upper
    bound with fabricated uncertainty.*
11. **Aggregates carry their band denominator.** A fixture computing any summary over admitted rows
    without the band-specific admitted/total pair fails; a fixture asserts the four measured pairs
    52/96, 66/96, 77/96, 85/96 are recoverable from the payloads alone. *Fails if the §4.4 confound
    can be hidden.*
12. **One band per request, and the run's band when a run supplies one.** A request naming two bands
    fails; a run-scoped request whose band differs from `appliedTargetElo` fails. ([[D817]], §4.5.)
13. **The mass basis is a fresh policy vector, never a recorded selection.** A fixture supplies a
    recorded `OpponentSelection` whose guard abstained (unmasked base) and asserts the projection
    does not read `candidates` from it. *Fails if the guard asymmetry can leak into a measurement.*
14. **No bounded-target payload produces or carries `offWindow`, and the mass basis is keyed on base
    mass rather than on `proposedBy`.** Asserted against all five readers of the off-window field
    (`service.ts:1206`, `pivotal.ts:32`, `practical-difficulty.ts:37`, `feedback-policy.ts:39`,
    `rest.ts:231`). The basis half is a **two-armed** fixture ([[D1372]]): a row with `proposedBy`
    **and** `rawMass` is **included**, and a row with `proposedBy` and no `rawMass` is **excluded**.
    *Fails if provenance is used as the basis predicate, which would drop 26 of D1084's 41 route
    selections out of a human-mass denominator.*
15. **The destination negative is a permanent fixture.** `make bounded-target-census` reproduces
    0/75 and 0/52 surviving every defence and 72/75 and 49/50 pawn-departure returns, set-equal to the
    committed census; a registered destination bounded-return projection is a must-fail fixture.
16. **`breadth-collectors.md` §4's [[D755]] clause is amended** to record that the bounded
    continuation ran and returned zero survivals for this family, citing this RFC. Asserted by
    `make refusal-index` ([[D1038]]) once it lands, and by grep until then. *Fails if the escape
    clause is left readable as open.*
17. **The `human_model` door is exactly one projection wide.** A fixture feeding
    `human.maia.candidate_wdl` into `derived.bounded_target.policy_bounds@1` fails to compile.
    (§6.3.)
18. **The manifest delta is +2 producers, +6 projections, +0 bindings**, counted by the same unit §9
    states, asserted as a delta against the pre-change compiled manifest rather than an absolute
    tuple. *Fails if a binding is smuggled in, and does not fail merely because a concurrent RFC
    moved the total.*

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Port the ten focused controls and the exhaustive census out of the disposable harness into a permanent instrument before the harness is deleted | claude | `planning/bounded-policy-targets/` | |
| D2 | Seal the provider fixtures for both arms from the committed outputs so the criteria run with no engine and no sidecar | codex | `planning/bounded-policy-targets/` | |
| D3 | Measure a true cold-container Maia latency distribution; the recorded first pass had up to 36 of 2,596 requests possibly warmed and the replay is a cache hit (§4.7) | codex | `planning/bounded-policy-targets/` | |
| D4 | Run `bot-policy` §2.5's R11 trait gate for this family, or record that it is not being run — no bot layer may register on either outcome until Open question 1 is answered | codex | `rfc/bot-policy.md` | |
| D5 | Define Review's moment-selection rule for removal/reintroduction, given that the ∀-arm may not select (§2.4) | claude | `rfc/review-map.md` | |
| D6 | Carry an opportunity denominator and per-band source availability into the longitudinal store before any habit over this family is computed (§4.4) | codex | `rfc/longitudinal-store.md` | |
| D7 | A fourth ply — actual second-opportunity execution — is outside v1 by [[D1025]]; if it is ever wanted it is a new search with a new cap and a new declaration | claude | `planning/rfc-drafting-queue.md` | |
| D8 | Neither `ControlledTrait` (a multiplier) nor `RouteTarget` (an occupancy set) can express a target-preserving bot goal; decide whether the layer grammar gains a third goal kind or the goal is refused (§5.5) | claude | `rfc/bot-route-source.md` | |
| D9 | `producer()` derives `latency` from `availability` alone, so a derived producer with only provider inputs is declared `sync`; already shipped on `derived.grade` (§7.1) | codex | `rfc/breadth-collectors.md` | |

## Open questions

1. **Does [[D815]]'s *"no bot weight"* clause reach these policy quantities, or only the three
   salience flags it measured?** — **acceptance-blocking for the bot consumer only, and OWNER's.**
   The row's evidence is a salience experiment (29 and 7 usable positions, RMSE +0.477%, p .677); its
   wording refuses any bot weight inferred from exact threats, and this family derives from
   `threat@1`. Re-scoping a closed row is a ruling rather than a reading, so I do not make it.
   *Recommendation: read [[D815]] at its evidence — it refuses salience flags as human-error
   predictors, not every threat-derived operand — which leaves `bot-policy` §2.5's unrun trait gate
   and §5.5's grammar gap as the real blockers, both of which stay closed either way.* Nothing else
   in this RFC waits on the answer; §7 registers no bot consumer under either reading.
2. **Should the Maia band ever be learner-selectable?** §4.5 pins it to the run's applied band so a
   surface cannot report a number about a band the learner never played. A selector would be honest
   in one sense — the learner chooses what population to ask about — and would reconstruct
   [[D817]]'s refused multi-band fan-out one request at a time through the UI. *Recommendation: keep
   the band pinned to the run and refuse a selector; if a comparison is ever wanted it is a research
   surface with its own gate, not a control on a Review screen.* Not blocking; routed to
   `rfc/review-map.md` if the recommendation is taken.

## Ledger rows

*(Proposed — ids assigned at landing; head was **D1354** at drafting.)*

- **📊** — **The D1023 dossier does not report its own strongest number: conditional durability
  discriminates better than immediate removal.** Given a removal happened, it survives the three-ply
  horizon on **42.5%** of played authored targets against **10.7%** of legal alternatives (69/120 vs
  865/969 reintroduced) and **30.9%** against **15.2%** imported (130/188 vs 1,958/2,309) — **3.97×**
  and **2.03×**, same sign in both populations, computed from the committed census. The dossier
  reports only the played rates and calls the stronger story *"usually false"*, which makes a second
  independent discrimination read as a weakness. Population-level contrast over a fixed enumerated
  census, not a paired comparison.
- **🐞** — **The rare operand a surface would most want has no measured lift and reverses between
  populations.** *Survives every legal defence* is 2/120 = 1.67% of played authored removals against
  9/969 = 0.93% of alternatives, but **0/188 = 0% played against 29/2,309 = 1.26% alternatives
  imported**. So the ∀-arm is not only rare, it is directionless, and on one population the
  counterfactual produces it more often than the played move. It may be rendered when asked; it may
  never be the reason a moment was selected.
- **🐞** — **Maia's row-admission rate is monotone in band, so any aggregate over admitted rows is
  band-confounded before a single human behaviour enters.** 52/66/77/85 of 96 at bands
  1000/1400/1800/2200, decomposing into 12/9/5/4 root failures and 40/24/15/8 second-node failures
  (overlapping: 8 rows fail both at band 1000). The gate is a property of the **eight-move expansion
  budget**, not of the model — the provider returned every legal candidate with a mass on all 384
  band-rows, at a minimum `returnedMass` of **0.9542** and only **17 of 384** below 0.99. Any
  longitudinal or style denominator over this family must carry its
  band-specific admitted/total pair or it measures the instrument.
- **🐞** — **An `offWindow` candidate carries no `mass` field, so a policy-mass projection must refuse
  the distribution rather than treat the row as zero.** `opponent-selector.ts:633` emits
  `{ moveUci, rank, offWindow: true }` with no mass; zeroing it understates `returnedMass`, widens
  `missingMass`, and pushes fabricated uncertainty into a published upper bound. The shipped harness
  gate is `missingCandidateMasses === 0` (`maia-probe.mts:93`) and it fired **zero times in 384
  band-rows** — a real guard with no production exercise.
- **🐞** — **`offWindow` has five readers, not the three named in `bot-route-source.md` §7.2, and one
  of them is client-settable.** The three exclusion consumers are correct (`service.ts:1206`,
  `pivotal.ts:32`, `practical-difficulty.ts:37`); additionally `feedback-policy.ts:39` **propagates**
  the field into the public run event and `rest.ts:183`/`:231` **accept it on an ingested selection**.
  A measurement-exclusion marker an untrusted caller can set is worth knowing before anything is hung
  on it.
- **📊** — **[[D1025]]'s separation is honoured in the instrument and provable at the line.**
  `maia-probe.mts:108` adds path mass when the target move is **available** at the opponent's second
  decision state; no code path anywhere in the harness assigns mass to *selecting* it there. The
  field must therefore be named `second_opportunity_available_mass`, and the row's requested permanent
  provider fixtures are this RFC's criterion 9.
- **🐞** — **[[D815]]'s closing sentence states a bot refusal at goal scope on salience-scoped
  evidence** — [[D1320]]'s defect shape, the same one `bot-route-source.md` found in `bot-policy`
  §9.5. Its measurement is three salience flags (29 and 7 usable positions; grouped-CV RMSE +0.477%
  at p .677); its wording refuses any bot weight inferred from exact threats, which reaches every
  operand derived from `rules.tactic.consequence.threat@1`. Not lifted here: no bot layer registers,
  and the scope goes to the owner.
- **📊** — **[[D755]]'s escape clause is measured shut for the pawn-created destination family.**
  *"Call it a contested destination, not 'prevention,' unless a bounded continuation proves denial."*
  The bounded continuation ran over the full population: **0/75 authored and 0/52 imported** survive
  every defence, and **72/75** and **49/50** of the returns happen because the controlling pawn moved
  or was captured. `breadth-collectors.md` §4 still reads as though the door is open and is amended.
- **📊** — **No derived projection in the evidence catalogue takes a `human_model` input, and the one
  exclusion that exists does not reach policy mass.** `candidateCollectorInputs`
  (`evidence-catalog.ts:715-721`) filters `human.maia.candidate_wdl` out of
  `derived.opponent.candidate_feature_vector@1` because *"Maia WDL is an alternative provider
  evaluation, not a local collector result"* — a reason about a competing **verdict**, while
  `human.maia.policy@1`'s own limitation reads *"Policy mass describes model choice, not move
  quality"* (`:782`). The door opens exactly one projection wide and a fixture keeps it that way.
- **🐞** — **A derived producer is declared `latency: "sync"` even when every one of its inputs is a
  provider.** `producer()` derives latency from availability alone (`evidence-catalog.ts:29`), and
  `derived.grade` already ships as `local`/`sync` while deriving from `live.stockfish.eval` (`:812`,
  `:820`). The compiled manifest is therefore not a safe source for *"is this cheap enough to run on
  a gesture"*, which is exactly the question this family's Support binding turns on.
- **📊** — **Neither the shipped nor the drafted bot layer grammar can express a target-preserving
  goal.** `ControlledTrait` is executed by `applyPolicyMultiplier` (`bot-policy-catalog.ts:350`,
  applied `:512`), which maps over existing rows, so it can only reweight a removal the base already
  emitted; and `bot-route-source.md`'s `propose` effect takes a `RouteTarget` of `(role, square)`
  occupancy requirements, which cannot hold a predicate over an *opponent's* capture. Three
  independent gates therefore stand between this evidence and a bot layer, and the third is
  structural rather than evidential.

## Changelog

- 2026-08-23 — drafted on [[D1023]]'s closed research, routed by [[D1330]] as live-debt rank 7
  (*"says drafting is unblocked and no draft exists"*). Every headline number in the source dossier
  re-derived from the committed harness artifacts with **zero numeric drift**; one wording defect
  corrected (§0.3, ten focused controls plus one census, not eleven controls) and two unreported
  directions computed from the same census (§0.2). Reconciled with `bot-route-source.md`'s
  composition layering in §5 without amending it: the mass basis is the raw policy vector rather than
  the guard-state-dependent composed selection, a proposed row is excluded from the basis while a
  mass-less row refuses the distribution, and the structural finding that neither layer kind can
  carry this goal is routed as a discharge. [[D755]]'s conditional measured shut; [[D815]]'s scope
  put to the owner rather than read generously. Amended before commit for [[D1372]], which landed
  mid-drafting and returned `bot-route-source.md`'s `rawMass`/`proposedBy` XOR: §5.2's basis rule is
  keyed on **base mass** rather than on proposal provenance, which is correct under both the drafted
  invariant and its repair, and criterion 14 became two-armed.
