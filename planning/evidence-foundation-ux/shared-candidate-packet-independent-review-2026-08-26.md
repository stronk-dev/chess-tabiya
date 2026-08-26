# Shared candidate packet — independent buildability return

**Reviewed:** 2026-08-26
**Reviewer:** codex
**Document:** `rfc/shared-candidate-evidence-packet.md` after the [[D1570]]–[[D1580]] amendment
**Verdict:** **RETURNED.** The lower primitive remains the right architecture, and the Node-24
cache receipt is useful. Implementation is not authorised from the current contract.

## Method

The pass read the full RFC and its buildability dossier, then re-derived the load-bearing seams at
HEAD rather than inheriting the amendment's claims:

- the literal F1 projection/derivation rules in `evidence-contract.ts` and the current catalogue;
- every non-test caller of semantic selection and candidate-feature construction;
- the application composition root and `OpponentSelector` cache/provider request path;
- the exact legal-move authority and terminal predicates;
- the current tactical/breadth candidate-collector closure;
- the proposed White-perspective engine source and root-side bot vector.

The review deliberately did not edit Claude's concurrent Wave-C harness files or the untracked
`planning/review/` worktree.

## What survives

The architectural split is sound: compile one provider-free complete legal-candidate population,
then join bot, hint and Review opinions separately. Full-six-field-FEN identity is honest for the
factual packet; immutable exact scopes avoid a mutable digest-bearing value; process-local
single-flight plus an entry/weighted bound is materially better than the unbounded cache; the
equal-item memory falsifier correctly prevents treating readings and events as one homogeneous
unit. The packet must remain operator-only and no LLM should select from it.

Those findings are not sufficient for acceptance because six implementation-critical contracts
cannot simultaneously hold.

## Blockers

### 1. Terminal identity contradicts complete legal-move identity ([[D1631]])

The packet type admits `insufficient_material` as a zero-row terminal reason; §3.3 and criterion 3
require terminal packets to have zero candidates. Criterion 2 independently requires candidates
to be set-equal to `exactLegalMoves(beforeFen)`. Insufficient-material positions such as king
versus king remain positions with legal king moves, so the two criteria are mutually exclusive.

Game adjudication also has history-sensitive forms (threefold) and a clock-derived fifty-move
form that cannot be recovered from “no legal moves.” Repair by keeping the factual population
complete and representing adjudication separately, or restricting the packet's zero-row terminal
case to checkmate/stalemate. Add explicit insufficient-material, fifty-move and repetition arms.

### 2. The final selector cache cannot share on packet identity ([[D1632]])

The packet itself may share on canonical full FEN because it contains position-derived rules
facts. `OpponentSelector`'s final result may not. `#maia` sends
`position fen <startFen> moves <historyUci...>` to the model. A transposed final position therefore
does not prove an identical provider distribution. Discharge D1's proposed key—packet id + profile
digest + seed—drops that history-conditioned provider input and can return the wrong policy/move.

Keep cache identities layered:

1. factual packet: exact full-FEN + manifest/conventions/compiler/scope;
2. provider result: the provider's complete request identity, including history/model/bound;
3. policy result: packet id + admitted provider receipt/digest + profile/seed and every declared
   policy input.

Bound the existing final-selection cache, but do not call history a contaminant merely because it
does not belong in the factual packet.

### 3. The promised production operations do not exist in the implementation surface ([[D1633]])

`selectLocalSemanticEvidence` has one non-test source caller: the
`apps/server/src/semantic-evidence-check.ts` CLI. `candidateFeatureVector` has no production caller.
`OpponentSelector` admits provider evidence but never constructs or consumes the proposed packet
or vector. Nonetheless §6.0 and criterion 23 require one service injected into the bot and a
“server-side semantic selection operation.”

Section 12 omits `application.ts`, `opponent-selector.ts`, any semantic operation/service entry,
route/service ownership, and the final-cache repair named by D1. The amendment therefore proves
manifest anchors and constructors, not consumption—the [[D666]] class. Name the exact operations,
composition root, execution/cancellation boundary and production callers, or narrow the RFC's
landing claim. The implementation surface must include every resulting file/symbol.

### 4. The literal F1 tuple fails `compileEvidenceManifest` ([[D1634]])

Section 3.1 declares the packet as `declared_convention` / `convention` with literal derivation
`inputs: [rules.mobility.reading.legal_moves@1]`. That input is `position_rules` / `exact`.
`compileEvidenceManifest` requires a derived projection with one derivation input to inherit that
input's grounding exactly. Listing the retained event closure only in `dependsOn` does not affect
that test, so the exact tuple the RFC calls buildable is rejected by the shipped compiler.

Specify a derivation declaration that truthfully includes the retained evidence/weakest grounding,
can represent per-row abstention, and passes the real manifest compiler. The review fixture must
compile the literal proposed row and fail when its weakest input is laundered.

### 5. Moving `childReadings` drops two candidate features ([[D1635]])

The current candidate vector is not only `childReadings + localSemanticEvents`. `collectorResults`
also adds `rules.exchange.predicate.legal_exchange@1` and, when a double attack exists,
`derived.tactic.fork_survives_reply@1` from reply breadth + legal exchange. Neither is in the
twenty-item `childReadings` function, and `localSemanticEvents` emits reply breadth/double attack
but not those two declared readings. The RFC migrates the twenty-item helper and events while the
vector declaration continues to depend on the complete tactical/breadth inventory.

Publish the literal event and reading closure, including the extra derivations and their abstention
conditions. Require set equality between the pre-migration and repaired vector identities on
ordinary, capture, double-attack and abstaining candidates. A shared foundation cannot silently
lose two inputs while claiming consolidation.

### 6. The engine join declares root-side scores but retains only White scores ([[D1636]])

`live.stockfish.position_eval@1` is correctly proposed as a White-perspective cp/mate source reusable
by Review. The repaired `CandidateFeatureVector` still declares `scoreFrame: "root_side"`, while
each row retains only that White-perspective item and specifies no conversion, comparison or loss
value. Bot guards consume candidate loss relative to the best root-side candidate; Review consumes
White perspective. One source can serve both, but the bot derivation is missing.

Define the typed White→root-side projection and candidate-set loss algebra, including Black roots,
cp-only sets, mate-only sets, mixed-domain abstention, engine/bound equality and positive integral
mate distance. Do not put a root-side label next to bytes that remain White-perspective.

## Required amendment order

1. Resolve the factual population versus game-adjudication model (D1631).
2. Publish the three-layer cache identities and keep Maia history in the provider/policy layers
   (D1632).
3. Name the real production operations/composition surface and cancellation/timeout ownership
   (D1633).
4. Compile the literal F1 tuple against the shipped manifest rules (D1634).
5. Publish and preserve the complete candidate event/reading closure (D1635).
6. Specify the reusable White score and root-side bot-loss derivation separately (D1636).
7. Re-run the existing Node-24 cold/warm and equal-item controls against the resulting production
   symbols; retain [[D1580]] as release-tier debt rather than converting it to a mechanism failure.
8. Send the amended document through another independent buildability review before implementation.

No owner ruling is required for these repairs. They are technical contract contradictions and
missing execution seams. No schema/resource claim changes are implied by the return.
