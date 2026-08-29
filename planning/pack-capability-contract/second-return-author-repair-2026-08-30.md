# Pack-capability contract — second-return author repair

- **Repaired:** 2026-08-30
- **Input:** `repeat-independent-buildability-review-2026-08-28.md`
- **Rows:** [[D1982]]–[[D1992]]
- **RFC state:** draft; fresh independent buildability review required
- **Production/corpus state:** untouched; lane 0.30 and [[D560]] remain held

## Result

All eleven repeat-review blockers now have normative, able-to-fail contracts in
`rfc/pack-capability-contract.md`. `make pack-capability-repeat-review` was inverted from a review
reproduction into the author-side positive contract and passes 11/11. The earlier
`make pack-capability-closure` remains green at 7/7. After regenerating the derived roadmap receipt,
the full `make verify` passes: 1,084 software tests, 2 performance tests, 172 real-content tests,
type checks, production builds and repository-governance contracts. Neither target authorises
implementation.

## What is now determined

1. Capability ids have one exact compatibility regex. Retained mixed-case and colon families parse;
   new ids use lowercase dotted authoring form; suffix versions are rejected from `id`.
2. `CapabilityVersion` is a closed integer/semver union. Registry keys, requirements and generated
   shape/principle identities preserve the arm and never coerce one into the other.
3. Applicability is a complete generated authority from strict schema annotations, unconditional
   named roots and resolved references, paired with a checked exclusions artifact.
4. F1 projections use their sealed manifest declaration and compiled execution as a subject-specific
   source. They do not acquire fictional AST sites or a copied digest.
5. Every one of the 20 legacy refused rows has a typed destination. The migration distinguishes
   lawful refusal, negative measurement, missing implementation, pending decision, withdrawal,
   active reversal and deprecation. An unknown legacy refusal is a hard failure.
6. Both capability annotations have closed meta-schemas under one strict AJV factory used by every
   pack-schema compiler. Misspellings remain errors.
7. F3 exports only a generic `claim.binding` identity. The later sidecar RFC owns fields, dispatch,
   stages and refusal codes after F3 acceptance, removing the acceptance cycle.
8. Every constant-table root is an exact exported symbol with a required production reader.
9. One `SemanticDisposition` union governs declarations and criteria; deployment reachability stays
   orthogonal.
10. Resolved shape/principle declarations close over embedded expressions, references and evaluator
    dependencies, reproducing the D566 chain through `shape.maroczy-bind`.
11. `requires` has canonical typed bytes: duplicate tuple refusal, NFC id ordering, typed version
    ordering, structural uniqueness and byte-equal authored/derived comparison.

## Deliberate holds

- A fresh independent reviewer must still construct the same public types, generated graphs,
  migration states and failure behavior without consulting author intent.
- No lane-0.30 implementation, pack rewrite, digest re-stamp, publication or Gate-F lift occurred.
- `claim-semantic-anchors` remains downstream and draft; F3 contains no consumer implementation.
