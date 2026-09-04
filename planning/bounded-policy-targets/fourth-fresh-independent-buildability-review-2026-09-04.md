# Bounded policy targets — fourth fresh independent buildability review

- **Date:** 2026-09-04
- **Artifact:** `rfc/bounded-policy-targets.md` after the D2340–D2342 fourth author repair
- **Verdict:** returned on [[D2628]]–[[D2630]]; implementation remains unauthorized
- **Executable review:** `make bounded-target-fourth-fresh-review` — retained author checks 3/3 plus fresh checks 3/3

## What survives

The repair correctly recognizes semantic readings as explicit validation roots, keeps value
construction provenance separate from semantic validation, and keeps the three bounded-target
factories out of application/package public APIs. The local/background execution class, exact
exists-versus-for-all outcome split, complete candidate/exchange admission and no-significance
boundary also remain the right foundation shape.

## Returns

### [[D2628]] — the proposed protocol module is not the normative protocol

The imported `protocol.proposed.ts` is a reduced illustration. It drops the batch request, service,
limits/options and both factory-result types; removes `TargetDerivation.target`; truncates evidence
payloads and request/result identities; and represents projections as strings where the RFC requires
versioned objects. The typecheck can therefore remain green while most of §4 and criteria 11, 17 and
25 are absent. The next repair must generate or import the complete public image and compare its
export/field/discriminant sets, not selected regex tokens.

### [[D2629]] — containment leaves no execution path

The three `makeBoundedTarget*Evidence` functions live in an internal factory module and may have
exactly one non-test importer: the central value-route registry. The background service lives in
`bounded-target.ts`, yet neither this RFC nor `evidence-value-authority.md` defines a closed typed
registry invocation that the service can call. Direct imports violate criterion 28; a registry that
only records callable metadata cannot build results. Name one exact correlated dispatch or govern
the service as an additional importer.

### [[D2630]] — the threat authority has two incompatible names

This RFC exports and migrates to `declareThreatEvidence(sourceFen)`. Its required value-authority
route map assigns the same `rules.tactic.consequence.threat@1` authority to
`createRulesTacticConsequenceThreatV1Evidence` and explicitly refuses compatibility aliases. The
dependency order therefore produces two authorities or breaks this RFC's symbols. Consume the exact
registered factory name and make the route-set gate reject the old alias.

## Required bounded repair

1. Replace the reduced proposed protocol with one complete generated/imported source of truth.
2. Define the service-to-value-route call graph and exact typed dispatch/result correlation.
3. Adopt the registered threat factory symbol and remove every old alias/route.
4. Retain the D2340–D2342 controls and this review when requesting another fresh review.

No production runtime, server, provider, API, schema, content, UX, archive or protected-design byte
changed in this review.
