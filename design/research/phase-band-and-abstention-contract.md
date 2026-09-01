# Phase band and abstention contract

**Question:** What machine-readable reason and threshold sensitivity can the shipped rules-only
phase classifier expose honestly, before any independent position labels exist?

**Run:** 2026-09-01 · `make phase-band-census` · result
`planning/phase-band-census/results.json` · SHA-256
`00fb27450bc4a9eeb74c0db900def704fe612f4eeae185fbf137fed6d557eb7d` `[V]`

## Verdict

The classifier has five exact decision arms, not one scalar confidence. Across all 804 legal
authored positions, the selected arms are 296 endgame-material, 5 material-gap abstentions, 153
opening-development, 233 middlegame-development and 117 development-gap abstentions. The honest
machine contract is therefore a closed discriminated union carrying the selected arm, its operand,
its declared boundary or boundaries, and exact integer distance from them. `[V]`
(`planning/phase-band-census/results.json` `arms`; `packages/runtime/src/phase.ts`.)

This margin is threshold sensitivity, not probability, chess accuracy or move distance. Of 682
concrete-label readings, 147 (21.6%) sit exactly on their selected boundary and 251 (36.8%) sit at
margin zero or one. A capture can change material by more than one unit and a developing move can
change more than one home-minor count through capture, so the number must never be rendered as
“moves until the phase changes.” `[V]` for the finite-corpus counts
(`planning/phase-band-census/results.json` `selectedBandMargins`); `[M]` for the consumer rule,
derived from the operand definition and legal move effects.

The 122 abstentions are not one failure class. Five positions occupy the material gap and all five
have maximum non-pawn material 14, one unit above the endgame band and four below the developed
band. The other 117 occupy the development gap: 53 have three and 64 have four undeveloped
home-square minors. At pack roots, all five abstentions are the four-minor development arm and none
is the material arm. `[V]` (`planning/phase-band-census/results.json` `abstentions`.)

## What was measured

The disposable instrument reuses D2483's side-effect-free legal-spine walker, then reconstructs
the shipped classifier's ordered threshold tree from its returned operands. It refuses any sample
whose reconstructed arm produces a different phase from `classifyPhase`. The focused controls hit
all five arms, both values in each gap, every inclusive boundary and an inconsistent supplied
phase. `[V]` (`tools/d2483-phase-classifier-census/census.ts`;
`tools/d2484-phase-band-census/measure.ts`; `measure.test.ts`.)

The first run exposed an instrument defect: importing D2483's bundled CLI executed that CLI as well
because both modules saw an entry filename ending in `measure.mjs`. The reusable census is now a
side-effect-free module and the executable is a separate wrapper. D2484's runner byte-checks the
committed D2483 result before and after every run; a mutation is a hard failure, and both positive
and negative controls pass. The earlier report retains its exact committed digest. `[V]`
(`tools/d2484-phase-band-census/run-isolated.mjs`; `run-isolated.test.mjs`;
`planning/phase-classifier-census/results.json`.)

## Exact result

| Decision arm | Phase | positions | roots | exact operand reading |
|---|---|---:|---:|---|
| `endgame_material_band` | endgame | 296 | 14 | maximum material ≤13; inside-band margin `13 − observed` |
| `material_transition_gap` | unclear | 5 | 0 | 14–17; distances `observed − 13` and `18 − observed` |
| `opening_development_band` | opening | 153 | 21 | material ≥18 and undeveloped ≥5; margin `observed − 5` |
| `middlegame_development_band` | middlegame | 233 | 10 | material ≥18 and undeveloped ≤2; margin `2 − observed` |
| `development_transition_gap` | unclear | 117 | 5 | material ≥18 and undeveloped 3–4; distances `observed − 2` and `5 − observed` |

The selected-band sensitivity is uneven. Opening has 74/153 (48.4%) readings within one operand
unit of its boundary; middlegame has 172/233 (73.8%); endgame has 5/296 (1.7%). This describes the
composition of the authored corpus, not the reliability of those labels in general play. `[V]`
(`planning/phase-band-census/results.json` `selectedBandMargins`.)

## Required successor payload

The successor to `rules.phase.reading@1` should carry one of the following literal shapes alongside
canonical FEN, material operands, undeveloped-minor operands and a registered convention identity:

1. A selected-band arm with `kind`, concrete `phase`, typed `axis`, `observed`, `boundary` and
   non-negative `marginInsideBand`.
2. A transition-gap arm with `kind`, `phase: "unclear"`, typed `axis`, `observed`, both named
   boundaries and the two positive distances to those bands.

The five `kind` values and field sets are those in the table above. A generic
`reason: string`, nullable margin, percentage or `confidence: number` loses which predicate fired
or invents calibration the evidence does not supply. `[M]` grounded in the exhaustive decision
tree and measured arms above.

`evidence-value-authority.md` currently proposes `rules.phase.reading@2` while explicitly retaining
the old `PhaseReading` payload. That draft successor would correct grounding but leave D2484's
consumer reimplementation defect intact. Because `@2` is unlanded, amend its payload before
acceptance rather than minting an immediate `@3`. The value factory must compute the phase and arm
together once; it must not accept caller-supplied reason or margin. `[V]` for the current draft
contract (`rfc/evidence-value-authority.md` §3.3); `[M]` for the amendment direction.

Provider absence does not belong in this union: the rules classifier is local and total over a
valid FEN. Exact opening identity, tablebase availability and any disagreement/precedence state
belong to the separately derived, source-retaining phase-arc composition owned by [[D2485]]. This
keeps “the rules convention abstained” distinct from “an optional provider was unavailable.” `[V]`
for current source behavior (`packages/runtime/src/phase.ts`; `docs/runtime-opening-identity.md`);
`[M]` for the composition boundary.

## What this does not settle

No independent position labels were added, so these distances cannot be calibrated into a
probability that a human reviewer would choose the same phase. The five material-gap observations
all sit at 14 and cannot validate behavior at 15–17. Pack roots contain no material-gap example.
The corpus is curated around product content, not sampled from general human games. Q4c still needs
position/edge labels, inter-reviewer agreement, false-transition costs and owner-use evidence
before a learner-facing phase claim can be treated as validated. `[V]` for the missing Q4c arms
(`planning/exploration/plan.md` §Q4c); `[M]` for the generalization limit.

No product classifier, evidence projection, module, pack, schema or authored chess statement
changed in this pass.
