# Shared candidate packet — eleventh fresh independent buildability review

- **Date:** 2026-09-05
- **Reviewed:** tenth author repair for [[D2678]]–[[D2684]] and [[D2841]]–[[D2842]]
- **Gate:** `make candidate-packet-eleventh-fresh-review`
- **Verdict:** **RETURNED on [[D2860]]–[[D2863]]; implementation remains unauthorized**

## Findings

1. **The current checkpoint replaced the public service ([[D2860]]).** The RFC requires one
   `CandidatePopulationService` with typed request results, single-flight, bounded admission,
   cancellation, queue/compile deadlines, idempotent close and stats. The tenth model exports only a
   synchronous compiler and an insertion cache. It has no hit result at all: admitting the same
   recognized packet twice returns `miss` twice. Historical predecessor tests do not compose these
   missing authorities into the object an implementer is told to build.
2. **The packet hashes identity fields it does not retain ([[D2861]]).** The id preimage contains
   canonical FEN, ruleset, scope, compiler version, legal convention, move convention and manifest
   digest. The packet retains only FEN/ruleset/scope plus the opaque digest; the four declared
   convention/manifest/version fields are absent, so a downstream reader cannot verify or report
   the exact authority the digest allegedly commits to.
3. **The closed collector result and abstention algebra disappeared ([[D2862]]).** Every current
   outcome is only `{collectorId, values}`. It has no move, projection, or
   available/unavailable/failed result, while every row constructs `abstentions: []` unconditionally
   and the generated abstention registry is not imported. Available-empty, unavailable and failed
   can no longer be distinguished or joined to their exact move/projection.
4. **Terminal truth disappeared ([[D2863]]).** Executed checkmate and stalemate roots both compile
   to zero-candidate packets with no `terminal.reason`. They are indistinguishable despite criterion
   3 requiring exact `checkmate` versus `stalemate` and refusing anonymous empty populations.

## Required repair

Compose one current model instead of treating predecessor models as mix-and-match specification.
It must retain the tenth repair's real production adapters, complete private graph, seven-term key
and deep sealing while restoring the exact packet fields, total collector outcomes/abstentions,
terminal distinction, and the public asynchronous service/cache/cancellation/result/stat boundary.
The existing `evidence-value-authority` factory dependency remains; another genuinely fresh review
must attack the composed checkpoint before acceptance.

## Executed evidence

`make candidate-packet-eleventh-fresh-review` retains the complete predecessor chain and passes 4/4
new falsifiers. No runtime packet/cache/service, route, schema, content or protected-design byte
changed.
