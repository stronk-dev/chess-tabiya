# Bounded policy targets — fifth author repair

- **Date:** 2026-09-04
- **Input:** fourth fresh independent return [[D2628]]–[[D2630]]
- **Status:** author-repaired; another genuinely fresh independent review is required
- **Executable contract:** `make bounded-target-fifth-author-repair` — retained fourth repair 3/3,
  complete protocol TypeScript compilation, and fifth repair 5/5
- **Boundary:** RFCs, disposable author protocol, maintained Make target and planning/register
  records; no runtime, server, provider, API, schema, storage, content, web or protected-design bytes

## Outcome

The measured bounded-target semantics remain unchanged. The repair closes the three buildability
seams around their public and internal construction boundaries.

1. `protocol.proposed.ts` is now the complete normative public declaration rather than a reduced
   example. The author contract parses both it and the RFC TypeScript model and requires set
   equality across exported names, structured fields and all important discriminants. The consumer
   fixture reaches target ancestry, request inputs, factory results, service options and nested
   return outcomes through the imported module only.
2. The central value-route registry now owns one generated, package-internal
   `invokeEvidenceValueRoute` operation. Exact route-indexed input/result maps and runtime exact-key
   validation correlate calls after TypeScript erasure. `bounded-target.ts` imports this invoker,
   never a value factory; the registry remains every factory's sole non-test importer.
3. Threat construction consumes the route table's exact
   `createRulesTacticConsequenceThreatV1Evidence` symbol. The old `declareThreatEvidence` name is
   present only as a retired/rejected alias and fails the cross-RFC route census.

## Remaining gate

This is positive author evidence, not acceptance. A fresh reviewer must attack the RFC/module
protocol equality, route-map generation and runtime validation, import graph, threat route identity
and every previously retained bounded-target control. The evidence-value-authority dependencies
must still be accepted and implemented before bounded targets can enter production.
