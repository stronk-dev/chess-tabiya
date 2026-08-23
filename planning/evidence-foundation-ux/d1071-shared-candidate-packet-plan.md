# D1071/D1072 — shared candidate-event packet

Status: complete 2026-08-23. The implemented vector fails population completeness, sealed-event
retention and engine-input provenance; the lower score-free packet contract is in
`design/research/shared-candidate-evidence-packet.md`.

## Question

Can the implemented opponent `CandidateFeatureVector` serve as the one cached candidate-event
population shared by bot policy, semantic-horizon hints and later Review analysis, or does that
require a lower source-safe primitive?

## Fixed checks

1. Call the shipped constructor with a strict legal subset and compare its accepted population
   with the exact legal-move population at the same canonical FEN.
2. Compare one emitted semantic event with the result retained in the candidate vector. Record
   whether sign, sealed identity and derivation/source identity survive.
3. Trace every production caller and consumer. A registered producer with no production caller is
   not a cache or shared runtime primitive.
4. Separate facts that need only rules/legal arithmetic from facts that need Stockfish scores or a
   hypothetical PV. No consumer may be forced to claim an engine dependency it does not use.
5. Specify exact packet identity, completeness, invalidation, provider-off and cache ownership. The
   proposal must preserve D1066's complete-alternative denominator and must not make MultiPV equal
   the legal population.

## Decision rules

- A constructor accepting a strict subset fails the complete-population requirement even if every
  supplied move is legal.
- Losing event sign or exact evidence identity fails reuse; recomputing those fields downstream is
  not caching.
- Caller-supplied engine numbers are not grounded merely because a manifest lists
  `live.stockfish.eval` as a dependency.
- The shared packet is score-free unless a rules-only consumer demonstrably needs the score.
- No new production implementation is authorized by this instrument. Output is a research dossier
  and an RFC-ready contract handoff.

## Outputs

- `tools/d1071-candidate-packet-harness/`
- `design/research/shared-candidate-evidence-packet.md`
- a D1071/D1072 ledger disposition and exploration-log entry
