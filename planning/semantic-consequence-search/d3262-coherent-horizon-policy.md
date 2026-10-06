# D3494 — two-ply target projection and joint-policy stopping audit

2026-10-06. Disposable RFC-0000 research, not production search authorization.
Inputs, selectors, thresholds, source distributions and earlier artifacts remain
unchanged. This result extends the common four-ply receipt, not the original196
population or a newly chosen search profile.

## Scope and horizons

All **193 offered candidates / 66 roots / 182 named cells / 53 settings /
116 candidate pairs / 17 unpaired targets / four controls** remain. Fourteen
no-target candidates stay explicit. The two-ply projection retains each approach's
actual first-reply selections, including both forcing sensitivities and the
separate first-reply-reserve/oracle diagnostics. It does not invent a new forcing
trigger or truncate/rewrite the original PV/forcing source results.

The **6,068 unique root/target/history observations** independently replay
the immediate board and all selected two-ply histories. Positive v2 target actions
retain original piece identities, actual captured squares and promotion roles.
An executed named action is the literal selected opponent reply matching one of
those immediate actions, not a later available action at ply three or four.
Missing replies remain literal UCI omissions; terminal legal moves remain counted
but no continuation is invented.

The result establishes **107 immediate opportunities / 75 immediate removals**.
The **84 directional current-option candidate contrasts** are exact statements
about this named action on the board after the root move. They are **not** the
four-ply reintroduction/preparation claim, permanent prevention, a root benefit,
an engine reason or a move grade. Every setting explicitly reports later
reintroduction/universal preparation as outside the two-ply horizon.

| Actual first-reply setting | Cells with selected execution / 182 |
|---|---:|
| Provider PV, depth12 | 28 |
| Complete opponent reply enumeration, either forcing interpretation | 107 |
| Engine, depth12/top8 | 62 |
| Configured model, prefix0.90 | 48 |
| Recursive, depth12/top8/top8 | 62 |

Enumeration means the action appears among legally enumerated replies, not that
a bot chooses it. At two plies recursive selection has the same first-reply seed
as the earlier relation reserve. Its improvement at later plies cannot be borrowed
into the two-ply reading. Lack of selected execution is never certified absence
of execution under unvisited replies.

## Joint policy coverage and honest stopping

Conditioned on each fixed candidate, the model arm measures the pinned configured
band-1400 policy on **both colors**, not observed human frequency or an actual
learner's move distribution. Prefixes remain 0.80 / 0.90 with cap eight **per node**.
No selected frontier is renormalized and no new branch is selected after seeing
the outcome. Literal path products and conditional leaf masses are recomputed,
not copied from a coverage headline.

| Local prefix | Horizon | Candidates meeting the same joint threshold | Exhausted below threshold | Minimum literal joint mass |
|---|---:|---:|---:|---:|
| 0.80 | 2 plies | 193 / 193 | 0 | 0.803573 |
| 0.80 | 3 plies | 139 / 193 | 54 | 0.675384 |
| 0.80 | 4 plies | 79 / 193 | 114 | 0.597414 |
| 0.90 | 2 plies | 191 / 193 | 2 | 0.811290 |
| 0.90 | 3 plies | 153 / 193 | 40 | 0.805792 |
| 0.90 | 4 plies | 108 / 193 | 85 | 0.777252 |

All **1,158 candidate/policy/horizon receipts** keep required joint mass, literal
covered joint mass, residual, shortfall, per-layer omissions and stop status.
The cap can fail before any deeper node: two first-layer 0.90 cases remain partial.
Passing at one node or horizon cannot authorize passing at the next.

The existing immutable source contract accepts float32 normalized support within
**1e-5** (`coherent-third-ply-frame.mjs` §`configuredPolicy`). Actual first-source
weights can sum to **1.0000000968575478**. That is numerical representation error,
not extra policy mass. Literal weights remain unchanged. The audit propagates
the existing allowance as `(1 + 1e-5)^policyLayers - 1`, keeps coverage intervals
and raw mass-balance error, and requires the **lower** bound to meet the threshold.
An intersecting numerical boundary abstains. No actual case is on that boundary.
New execution-mass intervals apply the same allowance while retaining the literal
selected-execution sum separately. Invalid larger overshoots are still refused.

The stop vocabulary is deliberately narrow:

- `joint_rule_satisfied`: this frozen frontier's conservative joint interval
  clears the named threshold; never an exact all-defence result.
- `frozen_frontier_exhausted_below_joint_threshold`: retain coverage and residual,
  abstain from claiming the requested coverage; do not relabel the threshold local.
- `numerical_boundary_abstain`: representational allowance intersects the threshold.
- `source_off_abstain`: unknown/null mass, not zero mass or a proved negative.

An absorbing terminal retains its previously admitted path mass rather than
inventing another move or losing that mass. The actual insufficient-material
third-ply terminal is checked independently against its board despite retaining
physical legal moves. Missing-source and early-absorption boundary controls are
synthetic falsifiers; no new actual provider-off latency measurement is claimed.

## Verification and remaining work

`make semantic-search-horizon-policy-check`: six JS controls, nine actual immutable
input corruptions, legal v2 replay and deterministic byte-identical reconstruction.
Controls exercise local-versus-joint coverage, cap shortfall, absorption, missing
sources, float32 preservation/boundary abstention and precision-aware execution
intervals, plus the complete population.

`make semantic-search-horizon-policy-independent`: four Python boundary controls,
complete reconstruction and **fifteen actual output corruptions refused**: population,
horizon widening, later-absence promotion, illegal history, false execution,
erased omissions, reversed benefit/polarity, local-as-joint completion, mass
renormalization, lost layer residuals/absorption, invalid execution intervals,
erased numerical allowance/balance error and production/UI-latency promotion.
Python independently
replays board/identity/action observations and the common two-ply join, and reruns
the complete actual 1,401-history / 4,127-leaf configured-policy prerequisite before
recomputing every joint product, residual and stop receipt. It uses pinned source
weights, not a new model inference or independently established strategic truth.

Artifact `d3262-coherent-horizon-policy.json.gz`: **828,617 bytes**, SHA-256
`172bfccf3a8c84e12a985d27529bec4131a2e3e56b366bb410097f80e442ec8a`.
Nine immutable inputs are bound by physical hashes. Earlier/preregistered artifacts
are unchanged; the optional research targets do not enter mandatory software CI.

This closes the two-ply projection and audit of **the frozen stopping criteria**, not
production calibration. The shortfall is not fixed by quietly widening the cap or
renormalizing selected paths. D3262 stays doing: qualify phase/focus/usefulness,
measure controlled cold/warm/provider-offline end-to-end cost and compare coverage/
reach/abstention/cost before choosing a source-declared production profile. A new
joint-coverage selection rule needs a separately preregistered experiment.
All production consumer, source, A4, official-content and full-1.0 obligations remain;
no gate, RFC, capability or milestone is promoted.
