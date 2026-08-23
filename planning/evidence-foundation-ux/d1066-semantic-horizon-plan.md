# D1066 — semantic-horizon reach

Status: complete 2026-08-23. Depth-12 reach passes the preregistered 80% gate (87.5%);
the unfiltered-selector reuse gate fails (48.5% of compatibility selections lack one target).
The production-budget arm reaches 71.9% diagnostically, and cold selection latency requires a
shared candidate/event cache before implementation.

## Question

Can the current sealed semantic-event layer turn a versioned Stockfish PV into the ruled
square → piece → occurrence-ply → move hint ladder without inventing a chess judgement?

## Fixed population and inputs

- Reuse the 64 deterministic positions and already-recorded `depth12` / `movetime100_a` PVs in
  `d1061-bestline-distance-results.json`. Do not ask Stockfish again.
- Replay every legal PV edge and call the shipped `localSemanticEvents` plus the shipped
  experimental `research.r2_candidate@1` selector.
- Report opening, middlegame and cross-phase separately. The authored pack population is a
  product-path sample, not a representative chess population.

## Closed measurements

1. Projection reach before and after R2 selection.
2. A literal adapter table for every selected projection. Each adapter must name its actor and
   target paths from sealed operands, or refuse the projection with a reason. Parsing prose or
   treating any arbitrary square string as a target is forbidden.
3. Per PV: first stageable event, first-occurrence ply, actor/target cardinality, and honest-empty
   reason.
4. Depth-12 versus 100-ms agreement on the selected projection family and first-occurrence ply.
5. Sequence-only Wave-C events are reported separately: `localSemanticEvents` cannot emit an
   observed 3–5-edge motif merely because the bytes exist in the PV.
6. Reuse of the unfiltered R2 selector is adjudicated from its permanent authored/imported
   output: it selects families the accepted nudge module explicitly refuses. The PV census
   therefore applies the same R2 policy only after the accepted Appendix-B event filter; it does
   not pay for a second unfiltered counterfactual pass at every PV edge.

## Decision rules

- If fewer than 80% of depth-12 lines contain a stageable event within four plies, semantic
  horizons cannot be the sole guided-hint source; the module must compose theory/authored/
  tablebase grounds and expose honest empty.
- If more than 10% of selected events lack a literal actor or target adapter, the current R2
  selector cannot be reused as the hint selector unchanged.
- A projection-family or occurrence-ply disagreement is evidence identity drift, not prose
  variance. Report it; do not merge the arms.
- No event is called important, good, bad, forced, tactical or strategic unless its declared
  projection establishes that exact statement. Selection is a product convention only.

## Outputs

- `design/research/semantic-horizon-coverage.md`
- `planning/evidence-foundation-ux/d1066-semantic-horizon-results.json`
- `planning/evidence-foundation-ux/d1066-semantic-horizon-results.md`
- `tools/d1066-semantic-horizon-harness/`
