# Transition primitives implementation plan

1. Add the closed transition-expression grammar, evaluator, objective compiler, evidence refs,
   schema 0.22, and exhaustive validation.
2. Prove coverage on authored spine and deviation edges; measure the production evaluator against
   the independent corpus harness and tighten per-leaf ranges.
3. Ship three authored pack consumers and a closed-by-default committed-edge reading. Do not ship
   the R3-refused live marker.
4. Fix `structuralDelta`'s repeated-FEN parsing without making it a transition dependency.
5. Update canonical docs and lifecycle records; run both gates before and after archival.
