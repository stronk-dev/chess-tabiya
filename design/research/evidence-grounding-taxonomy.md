# Evidence grounding taxonomy — the twenty `rules/position_rules/exact` adapters

**Question.** Do the twenty generic source adapters currently labelled
`rules / position_rules / exact` all have one truth authority, and may a value-authority repair
trust that scalar when it chooses how evidence is constructed?

**Disposition.** Answered negatively `[V]` at 2026-08-30 HEAD. The class contains four different
authority shapes: nine literal rule totals, six rule computations whose exact meaning depends on a
named direct convention, two product classifications, and three projections that combine multiple
authorities. The initial [[D2145]] suspicion was therefore directionally right but too broad:
convention dependence alone does **not** make a computed position fact inexact. The repair must
retain that distinction instead of demoting every convention-bearing fact.

**Instrument.** `tools/d2144-evidence-seal-audit/value-authority.test.ts` publishes the reviewed
twenty-row table, compares it set-equal to the live generic-adapter population, pins the 9/6/2/3
partition and separately freezes the twelve rows with a current consumer binding. The instrument
fails when a projection enters or leaves the class without review. `[V]` (`make
evidence-seal-audit`)

## Result

| Current projection | Bound now | Authority found | Required contract action |
|---|---:|---|---|
| `rules.castling.reading.rights` | no | literal rule total | retain `position_rules/exact`; compute and seal from FEN |
| `rules.castling.reading.legality` | no | literal rule total | retain scalar; compute and seal from FEN |
| `rules.castling.event.rights_lost` | yes | literal rule total | retain scalar; validate the exact legal edge and compute the event |
| `rules.structural.reading.pawn_connectivity` | no | literal rule total | retain scalar; compute and seal from FEN |
| `rules.structural.event.pawn_islands` | yes | literal rule total | retain scalar; compute from the two connectivity readings on a validated edge |
| `rules.tactic.consequence.mate_in_one` | no | literal rule total | retain scalar; enumerate and seal the complete legal one-ply result |
| `rules.tactic.consequence.reply_breadth` | yes | literal rule total | retain scalar; compute the complete legal reply set from FEN + move |
| `rules.tactic.event.check` | yes | literal rule total | retain scalar; compute from FEN + legal move |
| `rules.tactic.reading.rook_on_seventh` | no | literal rule total | retain scalar; compute and seal from FEN |
| `rules.square.reading.control` | no | rule computation + direct convention | retain primary scalar, attach `square-control@1`, compute from FEN |
| `rules.square.event.control` | yes | rule computation + direct convention | retain primary scalar and convention closure; compute from a validated edge |
| `rules.tactic.reading.defender_duty_set` | no | rule computation + direct convention | retain primary scalar, attach `defence-duty@1`, compute from FEN |
| `rules.tactic.event.defender_removed` | yes | rule computation + direct convention | retain primary scalar and inherited duty closure; derive from the exact capture edge |
| `rules.tactic.event.defender_duty_relocated` | yes | rule computation + direct convention | retain primary scalar and inherited duty closure; compute from the validated edge |
| `rules.tactic.consequence.forced_mate_after_move` | no | rule computation + direct convention | retain primary scalar, attach `mate-proof@1`, compute only from sealed reply breadth |
| `rules.phase.reading` | yes | product classification | reclassify as `declared_convention/convention`; compute under a registered phase-band definition |
| `rules.structural.reading.named_structure` | yes | product classification | reclassify as `declared_convention/convention`; fix the declared operands and register each catalogue definition |
| `rules.endgame.reading` | yes | phase convention + material classifier + theory metadata | split material/type classification from named technique references and cite the latter |
| `rules.pivotal.marker` | yes | heterogeneous rule, run, human-model and product-convention sources | split by marker kind; no one scalar or constructor truthfully covers all four |
| `rules.structural.predicate.result` | yes | authored predicate + computed position evaluation | make it a derived result over the sealed authored condition and computed trace; do not mint it as a raw rules source |

`[V]` The live implementations are `castlingRights`, `castlingLegality` and
`castlingRightsLost` (`packages/runtime/src/castling.ts:24,51,86`),
`pawnConnectivityReading` (`packages/runtime/src/structure.ts:190`),
`pawnIslandSemanticEvents` (`packages/runtime/src/semantic-evidence.ts:382`),
`mateInOne`, `replyBreadth`, `checkEvent` and `rookOnSeventhReading`
(`packages/runtime/src/tactics.ts:246,827,860,879`), `squareControlReading` and
`squareControlEvents` (`packages/runtime/src/square-control.ts:98,118`), the three defender-duty
operations (`packages/runtime/src/tactics.ts:76,118,141`), and `forcedMateAfterMove`
(`packages/runtime/src/mate-proof.ts:64`). Those functions establish that the first fifteen rows
have complete deterministic operations; the generic adapters do not invoke them.

## Why the six convention rows stay position-grounded

The square-control, defence-duty and mate-proof payloads are complete deterministic results under
literal disclosed algorithms. Their convention identifies *which* pseudo/legal controller rule,
pseudo-defence rule or bounded proof traversal was applied; it does not replace the board and legal
move tree as the fact's primary authority. `[V]` (`packages/runtime/src/evidence-catalog.ts:190-198,
422-449,584-598`; `packages/runtime/src/mate-proof.ts:64-153`)

This is the distinction the in-flight semantic-convention contract is designed to carry: primary
grounding and transitive convention identity are separate dimensions. Its reviewed other-grounding
table already retains `position_rules` for defence duty, its two events and mate proof. `[V]` as a
statement of the current draft, not acceptance (`rfc/semantic-convention-provenance.md:307-327`).
The value-authority successor must consume that closure; it must not duplicate a second convention
registry.

## The two false scalar labels

`classifyPhase` assigns opening/middlegame/endgame/unclear through Tabiya-owned material values and
three thresholds, and emits `"Tabiya's phase bands"` as provenance. It is a deterministic product
classification, not a rule of chess. `[V]` (`packages/runtime/src/phase.ts:15-20,63-89`)

Named structures are selected by four hard-coded matchers and joined to product-authored names and
provenance strings. The manifest declares only `provenanceNote` as an operand even though the real
`StructureMatch` carries `id`, `name` and `provenanceNote`; the public adapter therefore seals an
arbitrary note and currently relies on D1934's extra-key hole to accept the real object. `[V]`
(`packages/runtime/src/structure.ts:583-588,661-662`;
`packages/runtime/src/evidence-catalog.ts:236-245`;
`packages/runtime/src/evidence-source-adapters.ts:44`). Reclassifying the projection without fixing
its operands would preserve the wrong authority boundary.

## The three projections that must split

### Endgame

`endgameReading` first consumes the product phase classifier, then applies a material census, then
attaches Lucena, Philidor and Vancura records whose provenance says only “Standard
endgame-literature name.” Every rook-and-pawn-versus-rook material position receives Lucena and
Philidor candidates; the code does not establish that either position is present. `[V]`
(`packages/runtime/src/endgame.ts:7-54`). One `position_rules/exact` projection therefore conflates
a material label, a product applicability rule and uncited theory metadata. Law 8 requires the
technique references to become separately cited theory candidates rather than borrowing the
material census's exactness.

### Pivotal markers

One projection carries four unlike kinds: phase changes from the product classifier,
irreversibility from exact transitions, human divergence from recorded Maia candidate mass, and
option collapse from a three-position legal-count threshold over run history. `[V]`
(`packages/runtime/src/pivotal.ts:23-79`). The renderer already attributes the aggregate to
“Tabiya product convention,” but the manifest still calls it position-rules exact. Splitting by kind
is required both for truthful grounding and for later module selection: a learner ceiling may admit
an irreversible rule event while withholding human-model distribution or product prominence.

### Structural predicate result

`declareStructuralPredicateEvidence` correctly constructs the authored condition and the computed
result together, but the result's public adapter can be called independently with an arbitrary
condition, boolean and trace. The manifest records only `dependsOn` rather than a derived-input
member. `[V]` (`packages/runtime/src/structural-evidence.ts:98-124`;
`packages/runtime/src/evidence-catalog.ts:227-235`;
`packages/runtime/src/evidence-source-adapters.ts:200`). The result must be compiler-minted from the
sealed authored input and recomputed evaluation, preserving authorship without treating the
author's predicate as a chess rule.

## Consequence for the foundation sequence

The evidence-value-authority RFC may now be drafted, but its implementation must compose with the
semantic-convention RFC rather than accept today's scalar labels as truth. The order is:

1. correct/split the five product or multi-authority rows at the contract level;
2. land convention closure for the six exact-under-convention rows;
3. replace the fifteen deterministic public payload adapters with compute/derive-and-seal
   operations;
4. migrate the remaining recorded/provider/human/authored adapters under their own source receipts;
5. only then widen ordinary Support, Review, bot, pack-validation and longitudinal bindings.

`DESIGN-GAP:` Gate B4 currently says exact source adapters ship. Identity and construction ship;
truthful primary grounding and value authority do not yet close for this population. Phase-3
module activation remains held.
