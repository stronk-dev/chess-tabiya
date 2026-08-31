# Shared candidate packet fifth author repair — 2026-08-31

## Scope

This author pass repairs [[D2389]] only. The fourth independent review accepted the projection-key
and dependency-closure repairs, then returned the RFC because its flat legal list and its sealed
`ExactLegalMoveMap` receipt had separate value sources.

## Repair

The contract now has one legal-population object graph:

1. call `exactLegalMoveMap(beforeFen)` exactly once;
2. pass that exact object to `declareExactLegalMovesEvidence`;
3. flatten `legalMovesInput.payload.pieces[].moves` into a frozen container without copying a move;
4. construct every packet row from that container; and
5. reject a field-equal or UCI-equal second enumeration because its move references are different.

The product factory/compiler no longer imports or calls `exactLegalMoves`. Set equality remains the
population-completeness check, but it follows an exact-reference ownership check and cannot stand in
for it.

## Falsifiers

`make candidate-packet-fifth-author-repair` checks the normative source call, declaration input,
factory boundary, exact flattened references and an equal rebuilt-list refusal. The historical
fourth-review target also checks that the returned two-source wording is gone while retaining the
small identity counterexample that exposed it.

## Verdict

Author repair complete. A fifth fresh independent buildability review is required before
acceptance. No production, schema, content, API or UX implementation is authorized.
