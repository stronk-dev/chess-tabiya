# Complete state events: qualification contract clarification

2026-10-11 · D3687 / D3690 · evidence-foundation · awaiting the
`semantic-validation-authority.md` author's accepted amendment, not implementation authority.

## The conflict

The accepted §3.2 semantic-negative requirement and the implemented `omits`
expectation mean zero observations for the exact event projection after a completed,
valid production operation. Four frozen v1 projections deliberately report complete
state instead of only changes:

| Projection | Production behavior on a legal edge |
|---|---|
| `rules.king.event.zone_state@1` | Both colours' before/after state, including empty deltas |
| `rules.structural.event.piece_count@1` | Both colours × six roles, including unchanged and zero counts |
| `rules.structural.event.pawn_islands@1` | Both colours' before/after island counts, including zero |
| `rules.tactic.consequence.reply_breadth@1` | One full legal-reply population, including terminal zero |

The source construction establishes the contract conflict, not a finite-case claim
that a test corpus proves universal behavior. Relevant production sites are
`king-state.ts`'s `kingZoneEvents`, `structure.ts`'s `computeStructuralReading`,
`semantic-evidence.ts`'s `structuralSemanticEventPayloads`, and the pawn-island/
reply-breadth factories in `evidence-factories.ts`.

Permanent controls in `semantic-validation-rule-state.test.ts` and
`semantic-validation-pawn-dynamics.test.ts` exercise actual local-edge operations.
Quiet edges retain empty king deltas. White/Black bare-king steps retain twelve
piece counts, two zero island counts and a complete reply reading. The legal
`f7g7` mate retains a reply observation with `terminal: true`, `count: 0` and
`replies: []`; zero replies are not zero observations.

## Author decision required

Specify a coherent negative contract for complete state projections, or explicitly
choose versioned sparse successor events. No option is accepted by this note.

If permitting property-specific negatives, name the exact independently grounded
property and operands, bind them to the source/case/production operation, and say
what a successful negative disproves. It must not qualify other properties or the
whole state payload merely because one property is absent. An always-true or
unreachable property is not an adequate negative.

If choosing sparse successors, retain frozen v1 replay and enumerate migration,
manifest, validation, consumer and content effects. Filtering v1 in place is not
a compatible fix.

Both approaches need failing controls for a false claimed absence and passing
controls on completed legal operations. Invalid input, unavailable sources,
abstention or an empty test population cannot discharge the requirement.

All four current negative arms remain `required`. No new learner permission,
source admission, collector behavior, strategic judgement or content migration
is shipped here. D3691's finite pawn-dynamics cases are separate admitted Slice B
work and do not solve this state-event contract.
