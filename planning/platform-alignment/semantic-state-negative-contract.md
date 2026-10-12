# Complete state events: qualification contract clarification

2026-10-12 · D3687 / D3690 / D3745 · evidence-foundation · awaiting the
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

## D3745: the sparse controller-delta case belongs to the same repair

`rules.square.event.control@1` is not complete state: it reports gained/lost controller
edges. However, `square-control.ts` includes the controller's origin in edge identity,
and its pseudo attacks include friendly-occupied target squares. A legal standard-chess
move relocates at least one physical piece with nonempty geometric attacks. Its vacated
origin therefore loses controller edges even when destinations were already defended.
Promotion and castling do not remove that obligation. Simply making other events sparse
cannot provide a whole-family omission for this fifth projection.

`make semantic-validation-matrix` executes the disposable `state-boundary.test.ts`
against the real local-edge operation and target selector: all 127 legal successors from
eight positions retain all five families. The positions cover both initial turns, bare
kings, en passant, promotions, castling, bishop and queen moves. Zero pawn counts/islands
and terminal zero replies remain populated. A conditional check event supplies an actual
quiet-edge omission and mate-edge positive control; null moves and wrong successor FENs
are refused. All 97 matrix checks pass. This finite sample corroborates the source
construction; it is not exhaustive position coverage or additional registered authority.

The existing author repair must cover all five families and distinguish literal state,
unavoidable physical deltas and conditional motifs. Property-specific negatives need exact
independent operands and a stated scope; they cannot certify the whole payload by testing
one absent property. Versioned successors require consumer/replay/content compatibility,
and a plain changed-only filter does not solve square-control. No option is accepted here.
All five arms remain required; D3690 owns the consolidated repair and D3745 closes only
the research audit. The canonical 343 cases/81 subjects remain unchanged and none is fully
qualified. No collector, profile, eligibility or learner permission changes.

## Consumer consequence: proactive Nudge (D3715 / D3713)

The October 11 source-to-module probe establishes a separate selection conflict.
`createRulesStructuralEventPawnIslandsV1Evidence` maps both colours unconditionally;
`postcommitEdgeEvidence` includes that projection; Nudge accepts it; `witnessedEvidence`
does not distinguish unchanged counts; and `applyPositionNovelty` conservatively
abstains on unregistered identities. The two facts fit the ordinary Nudge budget.
Thus the complete state can fill a card whose declared question is "What did the
move I just played actually change?", even when these counts did not change.

The legal `d2f3` edge from
`7k/pppppppp/PPPPPPPP/8/8/8/3N4/K7 w - - 0 1` delivers exactly two island-count
facts with both counts unchanged at one. A real query and mounted tablet recovery
retain that populated card and its selector focus; they do not exercise silent
retirement. Four source-bound cohorts in `module-query.test.ts` walk every legal
edge in locked-pawn and nonterminal pawn-free positions, in both colours. They
retain exact edge/colour/count operands and demonstrate current nonempty module
reach. This finite population is not the proof of the factory's universal shape;
the unconditional construction above is.

The qualification negative and the Nudge signal contract are different obligations.
Do not "solve" the latter by making the state collector sparse: Inspector, authored
conditions and saved evidence still need complete count state. The module author
must define which preserved state observations may trigger a proactive nudge and
which remain inspection-only, including the related retained pawn/open-file facts.
Specify the exact source-bound witness and no-witness controls, keep genuine count
changes and other concrete consequences, and do not substitute novelty abstention,
statistical ranking, a source failure or an invented empty packet for quiet success.
This note does not accept new selection semantics. D3713 is blocked on D3715 until
the actual module operation can issue the intended silent response.
