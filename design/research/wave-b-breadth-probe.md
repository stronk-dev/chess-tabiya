# Wave-B middlegame breadth: second cross-population probe

**Question.** Which additional exact or disclosed-convention atoms deserve a place in the
evidence foundation, and which are merely true-but-background facts that would recreate the raw
hint dump?

**Verdict.** `[V]` Two joins survive as strong candidates across both populations:
exchange-exposing defender loss (4.50×/6.52×) and increased material-role asymmetry
(2.47×/4.35×). The other six candidate events do **not** earn global learner prominence.
Future-square pawn contest is almost exactly background; connected rooks are near 1; direct
blockade reverses sign across populations; targeted slider coordination is too rare and reverses
sharply; the king-exposure composite never occurs on an authored played edge. These facts may
remain operands, on-demand board explanations or habit opportunities, but not default hints.

This is a Phase-2b research result, not an RFC or implementation. It extends
`middlegame-evidence-and-style-taxonomy.md` and uses the D730 convention from
`legal-exchange-prerequisite.md`.

## 1. Method

`[V]` The disposable instrument is `tools/d754-wave-b-harness/`. It evaluates every played move
and every distinct legal-result alternative from the same source position:

- 754 authored source rows, 717 eligible decisions and 19,619 alternatives;
- 579 sealed imported CC0 source rows, 577 eligible decisions and 18,842 alternatives;
- the same bullet/blitz/rapid × 1000–1399/1400–1799/1800–2199 imported strata used by D723/D730;
- 2,000 deterministic paired source-position bootstrap resamples.

Each probe carries its own denominator. In particular, the defender-loss probe abstains when its
hypothetical pass state cannot be constructed: 675/717 authored played decisions and
19,156/19,619 authored alternatives are eligible; the imported denominators are 545/577 and
18,440/18,842. An abstention is never counted as `false`. `[V]`

Lift is discrimination from legal alternatives, not correctness, usefulness, move quality or
intent. The authored corpus is purpose-selected; the imported sample is ordinary human play.
Agreement is stronger evidence than either population alone, and disagreement is a refusal of one
global selection prior.

The harness imports one shared research-only `legal-exchange@1` implementation. `[V]` The D730
suite still passes after extraction, including the new paired pin controls: an illegal off-ray
pinned recapture is excluded, while a legal along-ray capture of the pinner is retained. The
capture-destination `RxQ KxR` control also prevents `trapped@1` from treating a +4 local exchange
as no escape.

## 2. Predeclared atoms and results

| Candidate | Authored lift (paired 95%) | Imported lift (paired 95%) | Decision |
|---|---:|---:|---|
| defender loss + same target locally exchange-exposed under disclosed pass state | 4.50× (2.34–7.48) | 6.52× (3.86–9.76) | admit as exact operands + bounded convention consequence; no tactic name yet |
| any P/N/B/R/Q inventory signature change | 3.84× (3.16–4.57) | 5.05× (4.38–5.83) | retain as generic capture/promotion join; high lift does not make it a useful sentence |
| material role asymmetry increases | 2.47× (1.86–3.14) | 4.35× (3.59–5.19) | admit as exact valence-free inventory event and habit operand |
| target-bearing slider coordination gained | 2.19× (0.00–10.61) | 0.25× (0.00–0.89) | reject global reading; 2/1 played positives and population reversal |
| pawn newly contests empty square reachable by enemy minor | 0.96× (0.75–1.19) | 0.95× (0.73–1.19) | exact on-demand topology only; default hint would be noise |
| connected rook pair gained | 0.82× (0.45–1.23) | 1.12× (0.78–1.53) | exact state/operand only; no global event prior |
| pawn advances on strict a–c/f–h majority wing | 0.76× (0.38–1.21) | 0.69× (0.34–1.08) | opportunity-normalized habit candidate, not learner event |
| non-pawn direct blockader placed | 0.62× (0.38–0.87) | 1.10× (0.79–1.47) | population-dependent; state/phase context required |
| shelter count falls + enemy king-zone attacked-square count rises | 0.00× (0.00–0.00) | 1.47× (0.33–3.15) | too sparse and authored-corpus absent; do not admit as a global event |

`[V]` Counts and rates are in `tools/d754-wave-b-harness/output.md`. All boundary fixtures pass:
occupied harassment vs empty contested square, strict vs equal majority, direct vs displaced
blockade, generic rook alignment vs target-bearing coordination, shelter loss vs the composite,
and defence-edge loss with vs without a positive exchange on the retained target.

## 3. What the strong results do—and do not—mean

### Defender loss that exposes a local exchange

The join retains the lost defender edge, target square/role and a positive legal-exchange capture
of that unchanged target under a disclosed pass state with en-passant cleared. It abstains when the
flipped state is invalid. This is materially sharper than D748's edge loss alone and is selective
in both populations. `[V]`

It still cannot say *removal of the defender*, *deflection*, *overload*, *wins material* or *the
move threatened X*. The edge loss and exchange exposure co-occur; causality and survival through
the opponent reply require identity-retaining multi-edge evidence or bounded search. The honest
module sentence ceiling is: “This defender relation disappeared; if the opponent passed, this
named capture has a positive local-exchange result.”

### Material asymmetry

`material_role_imbalance_increased` is the sum of absolute White-vs-Black count differences for
P/N/B/R/Q. It says the material configuration became less role-symmetric and names the before/
after vectors. It does not say which side is better or whether the exchange was favorable. `[V]`

Its strong lift is partly capture-shaped: the broader `material_signature_changed` is even
stronger because humans and authored lines select captures more often than uniformly sampled
legal alternatives. This is a warning for the selection layer: **high lift can identify an obvious
move class without identifying an explanation worth showing.** Material inventory should join to
an authored principle, engine delta, tablebase outcome, or a later opportunity-normalized habit;
it should not consume a hint slot merely for changing.

## 4. What the refusals are still good for

- `pawn_contests_minor_destination` directly covers the owner's “pawn stops a bishop/knight from
  using that square” observation at the safe claim level. It belongs in hover/touch square
  explanation and can join to theory or a later sequence, but its ~0.95× lift says it must not be
  announced after every occurrence.
- Majority advances and blockaders are legitimate structural profile opportunities. Their low or
  reversing event lift says style must be measured as `played - legal-alternative share`, split by
  phase/structure/population—not counted as flattering labels.
- Connected rooks and target-bearing slider coordination remain useful operands. D746 already
  rejected generic slider alignment; adding a heavy target was not enough to create a stable
  universal event. Functional significance needs a concrete legal action, tactical survival,
  theory identity or authored plan.
- King exposure should be a level state with separate shelter, open-line, escape-square and
  attacker/defender operands. The tested conjunction is too sparse to be the collector itself.

## 5. Foundation and roadmap consequences

1. Add Wave-B RFC candidates only for the exact atoms/joins, never their strategic gloss:
   contested minor destination, material inventory/asymmetry, defender-edge identity + exchange
   exposure, and state operands for blockades/coordination/king state.
2. F5 module eligibility must be context-specific. The inspector may expose every atom; hover can
   answer a square question; Review can select a rare defender-exposure moment; ordinary Just Play
   should remain silent on the six background/unstable events.
3. Bot traits may use these atoms as candidate features only after strength and legality guards.
   A pawn-majority preference or blockade preference is a declared policy weight, not evidence the
   bot has a plan.
4. Player habits may use majority, blockade, asymmetry and square-contest **opportunity residuals**
   after D729's temporal/rating/time-control gates. Raw counts are not style.
5. Pack vocabulary remains unchanged. These research identities must not force another corpus
   rewrite before Gate F and an accepted authorable-vocabulary RFC.

## 6. Remaining breadth gap

This pass still does not close Phase 2b. Required next evidence:

- three-edge defender manipulation with stable piece identity and the opponent reply retained;
- pawn levers/candidate passers/majority conversion rather than a generic wing advance;
- safe/legal mobility by individual piece and constrained-piece identity;
- file/diagonal control with entry squares and target functions;
- king escape/open-line/attacker-defender state by phase;
- bounded forcing-reply breadth, interference, clearance and zwischenzug;
- corpus-scale persistence beyond the first pawn-harass→retreat sequence.

These are the difference between broad atoms and a system that can honestly “pick a game apart.”
