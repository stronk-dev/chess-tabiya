# Review evidence compiler — fourth author repair

- **Date:** 2026-09-07
- **Rows:** [[D3109]]–[[D3115]]
- **Gate:** `make review-evidence-fourth-author-repair`
- **Scope:** authoring model only; no product, API, schema, client or content bytes

## Outcome

The returned compiler is repaired as one end-to-end authority chain:

1. the caller supplies only a sealed run, branch id and matching imported record; the exact recorded
   path authority derives all Review subject fields;
2. literal projection/adapter rows with operation, parser, family and grain are set-equal to the
   Review-eligible manifest input supplied to compilation;
3. each available result retains private-sealed, projection-typed evidence and its digest;
4. each node retains ply, position key, incoming move, evidence items, links and all family states;
5. the completion fold survives into the packet and the full Story receipt;
6. every identity uses the repository RFC-8785 serializer and a literal digest domain; and
7. the attempt store parses the outcome union and implements shared completion, bounded retry,
   cancellation, exhaustion and exact delivery-digest success release.

The literal production adapter population remains a declared dependency on D921. The author model
uses real declared projections across all nine families to prove the mechanism; it does not invent
the final eligibility list.

## Verification

`make review-evidence-fourth-author-repair` retains 6 original, 5 second-author and 6 third-author
controls, then passes 6 fourth-author groups and strict repository TypeScript. A genuinely fresh
review must still attack the composition before acceptance. Provider exchange, recorded semantic
path, shared candidate evidence, evidence presentation and D921 remain implementation blockers.
