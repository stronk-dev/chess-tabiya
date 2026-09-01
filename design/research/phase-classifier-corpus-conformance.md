# Phase-classifier corpus conformance

**Question:** Before the rules-only phase reading powers Just Play, does it at least agree with the
curated phase boundaries already authored in the corpus, does it abstain rather than guess, and does
it flicker along legal authored paths?

**Run:** 2026-09-01 · `make phase-classifier-census` · result
`planning/phase-classifier-census/results.json` · SHA-256
`87120a31b5c36b6edea17cb2b2820d9936f890f4341c4d393b602d4980482102` `[V]`

## Verdict

The current classifier is a useful cheap convention, not a sufficient Just Play phase authority.
At the strongest in-repo comparison point—the root of each single-phase authored pack—it agrees on
42/48 (87.5%), abstains on 5/48 (10.4%), and gives a different non-unclear phase on 1/48 (2.1%).
Across every authored position in those packs, agreement falls to 517/681 (75.9%), with 108/681
abstentions (15.9%) and 56/681 different labels (8.2%). The wider figure is a consistency reading,
not an accuracy score: an opening drill may deliberately play far enough into its consequences to
reach a middlegame position while retaining its catalogue phase. `[V]`
(`planning/phase-classifier-census/results.json`; the authority/automation split is explicit in
`planning/exploration/plan.md` §Q4c.)

The reassuring result is stability. Across 754 legal authored edges there are 39 phase-label
changes and zero two-edge A→B→A reversals. Every changed edge is one of
`opening→unclear` (19), `unclear→middlegame` (17), `middlegame→unclear` (1),
`unclear→endgame` (1), or `middlegame→endgame` (1). There is no return to opening and no return from
endgame in the committed corpus. This convention is coarse, but it is not visibly chattering.
`[V]` (`planning/phase-classifier-census/results.json` `transitionMatrix` and
`twoEdgeReversals`.)

## What was measured

The disposable harness loads the 50 non-browser draft packs, walks all 804 legal root/spine
positions using the same `authoredSpineFens` authority as the server, and invokes the shipped
`classifyPhase` on each FEN. It refuses a pack if the authored node count and legal successor count
diverge. Two `cross_phase` trajectories are reported but excluded from single-label agreement
denominators. `[V]` (`tools/d2483-phase-classifier-census/measure.ts`;
`apps/server/src/pack-validation.ts:332-347`.)

The classifier has four outputs but only two input families: non-pawn material per side and the
number of bishops/knights still on their original squares. Maximum material ≤13 means endgame;
material below 18 means unclear; otherwise ≥5 undeveloped minors means opening, ≤2 means
middlegame, and 3–4 means unclear. It has no opening catalogue input, tablebase input, confidence,
typed reason, or distance-to-band output. `[V]` (`packages/runtime/src/phase.ts:1-92`.)

## Results by authored phase

| Declared pack phase | Packs | positions | same label | unclear | different non-unclear label |
|---|---:|---:|---:|---:|---:|
| opening | 20 | 256 | 121 (47.3%) | 84 (32.8%) | 51 (19.9%) |
| middlegame | 14 | 152 | 123 (80.9%) | 24 (15.8%) | 5 (3.3%) |
| endgame | 14 | 273 | 273 (100%) | 0 | 0 |

These are exact finite-corpus counts, not sampling estimates. The opening row must not be read as
“52.7% wrong”: its denominator includes later consequence positions under one pack-level label.
It does prove that the pack label and the live classifier answer different questions often enough
that a module cannot substitute one for the other silently. `[V]`
(`planning/phase-classifier-census/results.json` `packs[*].conformance`.)

At roots, all five abstentions occupy the convention's deliberate 3–4-minor gap. Three are authored
middlegames (`berlin-queenless-press`, `closed-centre-chain-black-base-strike`,
`open-centre-french-exchange-black`) and two authored openings (`italian-center-attack-white`,
`kid-classical-black`). The sole non-abstaining root mismatch is `open-centre-ruy-exchange`: the
pack says middlegame, while five undeveloped home-square minors put the rules convention exactly on
its opening boundary. `[V]` (`planning/phase-classifier-census/results.json` `packs[*].root`.)

Both cross-phase trajectories exercise all three concrete labels plus `unclear`. The Caro
trajectory changes opening→unclear→middlegame→endgame; the QGD trajectory changes
opening→unclear→middlegame→unclear→endgame. Neither reverses within two edges. That is useful
positive coverage for a future phase-arc module, but two authored trajectories are not external
validation. `[V]` (`planning/phase-classifier-census/results.json` pack rows
`trajectory-caro-advance-chain-bishops` and `trajectory-qgd-exchange-minority`.)

## Consequences for the evidence foundation

1. **Keep the rules classifier source-pure.** Its cheap material/development convention is useful
   for endgame gating, deterministic fallback, and explicit abstention. Injecting a catalogue or
   provider call into `classifyPhase` would hide latency, availability and grounding changes behind
   the same projection identity. `[M]`
2. **Make abstention inspectable.** The operands are present, but consumers must currently
   reimplement the threshold tree to know why `unclear` fired. A successor should carry a typed arm
   and distance to the nearest declared band. That satisfies Q4c's confidence requirement without
   inventing a probability the corpus has not calibrated. This is [[D2484]]. `[M]` grounded in the
   shipped output shape and the five measured root abstentions above.
3. **Compose a derived phase arc rather than crown one classifier.** Runtime opening identity
   already exposes exact endpoint/path/history projections with typed unavailable states, and
   Syzygy/tablebase evidence has separate exact provenance. A module/Review projection can compose
   those with the rules convention while retaining each source and abstention. It must not relabel
   the underlying facts or make an opening-name hit equal a universal chess phase. This is
   [[D2485]]. `[V]` for the available opening producer
   (`docs/runtime-opening-identity.md` §§Data model–HTTP); `[M]` for the composition direction.
4. **Do not tune thresholds to maximize this report.** Pack-level labels are deliberately
   authoritative for curated navigation and deliberately not position-level reviewer truth. Tuning
   on them would reward the classifier for suppressing real phase progression inside opening and
   cross-phase consequence paths. `[M]`

## What remains open

Q4c is still partial. This pass supplies no independent position labels, no inter-reviewer
agreement, no cost model for early/late transition errors, and no owner-use reading of how a phase
arc should affect Support. It therefore cannot establish accuracy for an uncurated imported game
or authorize a default learner-facing phase claim. The next validation population must label
positions or transition edges—not whole packs—and keep book identity, broad phase, structure, and
learning-locus labels separate. `[V]` for the missing requirements
(`planning/exploration/plan.md` §Q4c); `[M]` for the population shape.

No product classifier, selector, module, pack, schema, or authored chess statement changed in this
pass.
