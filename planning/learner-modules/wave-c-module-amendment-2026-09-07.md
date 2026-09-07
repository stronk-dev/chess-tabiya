# Wave-C module amendment — D921 / D3129

## Result

The tracker carried a false dependency cycle: D921 was blocked on
`review-evidence-compiler.md`, while that RFC requires D921's literal production population before
acceptance. The cycle was not a product dependency. Twelve Wave-C projections already compile, and
the two held promotion projections were transferred to D1699/D1700 by D3069.

`rfc/learner-modules.md` §4.12/A19 now owns an exact 26-pair additive amendment:

- all twelve shipped Wave-C projections bind to `module.full_inspector`;
- the seven observed named tactics additionally bind to `module.postcommit_nudge` and
  `module.review_map`;
- defender-duty reading/removal/relocation, candidate-time overload conflict and bounded
  forced-mate proof do not enter proactive learner modules.

The last boundary is deliberate rather than missing work. Those five rows are useful evidence and
must remain inspectable, but their operands do not by themselves establish an observed named
tactic; two contain candidate-move information. A later Support admission must use a typed
disclosure/renderer contract instead of widening eligibility.

## Implementation-draft rebase

`rfc/module-registration.md` and its generated requirements-only artifacts now consume that exact
subset. The image moves from 127 unique compiled projection requirements / 224 compiled module
pairs to **132 / 229**. All 229 bindings remain `blocked_dependencies`; this checkpoint does not
claim production execution.

## Evidence

`make wave-c-module-amendment` runs the existing complete module-assembly contract, the generated
module-register author contract and five D3129 controls. It proves the exact 12-projection / 26-pair
join, the Inspector-only boundary for the five lower-level rows, exclusion of the transferred
promotion pair, parent/implementation agreement and removal of the D921→Review cycle.

Fresh independent review still precedes acceptance of the parent amendment and D921 closeout.
