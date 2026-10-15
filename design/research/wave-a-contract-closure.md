# Wave-A returned-contract closure

**Date:** 2026-08-22  
**Scope:** D829–D835 and D931, the ten still-unimplemented projections in the accepted
`tactical-collectors.md` wave. This pass resolves detector meanings; it does not select evidence,
write learner prose or implement a production collector.

## Method

The pass checked the accepted RFC against the shipped runtime types and the research helpers, then
made the proposed repairs executable in
`tools/d829-wave-a-contract-harness/contracts.test.ts`. Seven boundary tests pass: a branched pawn
chain with two bases, adjacent-but-unsupported pawns, doubled-pawn island identity, an unqualified
rook on the seventh, immediate versus delayed recapture, mover-relative loose-piece changes,
discovered execution with/without the latent relation, and promotion availability after a checking
move. `[V]` (`pnpm exec vitest run --config tools/d829-wave-a-contract-harness/vitest.config.ts`,
7/7 on 2026-08-22)

External terminology is used only to establish the traditional concept boundary. The precise
payloads below remain declared Tabiya conventions. FIDE defines an attacked square independently
of whether moving the attacker would expose its own king, and defines an exchange in one glossary
sense as a capture followed by a recapture; neither source supplies our evidence schema. `[V]`
([FIDE Laws of Chess, arts. 3.1.2–3.1.3 and glossary](https://rcc.fide.com/fide-laws-of-chess_fulltexthtml/))

## Findings and repairs

| row | finding | exact repair |
|---|---|---|
| D829 | Space is not one universal algorithm. Chess Programming Wiki calls it loosely defined and related to square/centre control, then records materially different engine implementations. `[V]` ([Space](https://www.chessprogramming.org/Space)) | Cite the tradition boundary honestly. The owner's a–c / d–e / f–h, enemy-half, pawn-attack formula is explicitly **our declared convention**, not attributed byte-for-byte to tradition or Stockfish. FIDE's attack rule pins why a pawn attack remains control even when a legal move would be unavailable. |
| D830 | General connected pawns are same-color pawns on adjacent files; a pawn chain is the narrower diagonal support relation, whose base is unprotected by another pawn. `[P]` ([Connected pawns](https://en.wikipedia.org/wiki/Connected_pawns), [Chess.com pawn chain](https://www.chess.com/terms/pawn-chain-chess)) | Store adjacent-file pairs separately from directed support edges. A chain is a maximal weak component of the support-edge graph; `bases` is a set of members with no incoming pawn-support edge. The two-base fixture proves a singular `base` field is not total. “Mutual pawn support” is deleted as impossible under literal pawn attacks. |
| D831 | The familiar value of a rook on the seventh is associated with attacking unadvanced pawns and hemming the king, but the sources do not define one generic `cutOff` predicate. `[P]` ([Rook, Development](https://en.wikipedia.org/wiki/Rook_(chess)#Development)) | Emit the rook identity, enemy pawns on that relative rank, and whether the enemy king is literally on its back rank. Delete `cutOff`; a later module may join exact king mobility/control from Wave B. The base state still fires when both relevance operands are empty. |
| D833 | `slider_ray:gained` retains a slider and blocker-set delta but does not prove the former blocker was a friendly screen or that the retained target was an enemy positive-exchange target. `[V]` (`packages/runtime/src/transition.ts:278-306`; `packages/runtime/src/tactics.ts:239-282`) | `discovered_executed@1` consumes the **before-position** `discovered_latency@1`, the exact played-move identity and the gained slider-ray event. The mover must be the named screen; the same slider and target identities must survive after the move. No tactical predicate is recomputed. |
| D834 | “Within the recorded continuation” admits arbitrarily delayed return captures, while the evidence name is supposed to denote the elementary exchange pair. FIDE's glossary supports capture→recapture as the conventional core but does not define an arbitrary delay. `[V]` (FIDE source above; executable delayed-recapture negative) | Define `trade_completed@1` as **two immediately consecutive legal capture anchors**, the second capturing on the first move's landing square. Retain both captured identities, both movers, both canonical UCIs, three ordered FEN/node anchors and byte-equal shared boundary. Later recaptures do not fire this id. |
| D835 | `loosePieceReading` intentionally describes the non-moving side, so naïve before/after calls describe opposite colors. `[V]` (`packages/runtime/src/tactics.ts:37-72`) | The event follows **all retained mover-owned non-king pieces**. Before-state is read on a disclosed opponent-turn clone with en passant cleared; after-state uses the ordinary child where the mover is already non-moving. Map the moved identity from `from`→`to`, unchanged identities by square/color/role, and classify the `enPrise` flag gained/lost/preserved. Promotion retains the mover edge with its role transition. Avoidance enumerates the same gained predicate over every legal alternative and shows the denominator. Clone failure is typed `invalid_turn_clone`, never false. |
| D931 | The geometry row can exist even when a checking pawn move makes the pass-turn clone illegal. The research helper currently returns `false`, erasing that distinction. `[V]` (`tools/d872-semantic-tactics-harness/king-promotion.test.ts:42-64`; executable `g6g7+` boundary) | Keep one total per-pawn geometry item. Represent `passAvailability` and `replyPersistence` as available/unavailable fields; `invalid_turn_clone` is unavailable, not false. `promotionAvailableNext` derives only from an available pass result. `promotionUnstoppable` uses the real opponent-reply population; zero replies yields false because the game has ended, not vacuous truth. |

## Consequence

These are basic collectors. None needs an LLM, unbounded engine search or inferred chess intent.
They need exact position arithmetic, stable identities, at most a bounded legal-reply population,
and explicit absence. `[M]`

The amendment can now be independently reviewed and then the ten projections can land. Breadth
still follows the complete Wave-A landing under its accepted ordering; this pass does not silently
relax that dependency. `[V]` (`rfc/breadth-collectors.md` Depends-on and §1)

## Terminal all-reply boundary — 2026-10-13 ([[D3768]])

`make tactical-terminal-research` runs 22 disposable controls in
`tools/tactical-collector-measurement-harness/terminal.test.ts`. Both-color legal checkmate
and stalemate edges have a genuine exchange-filtered double attack, zero legal replies and
`forkSurvivesReply.matched === true`. The sole factory retains that result, and the admitted
registered caption says “0 of the 0 legal replies answer the double attack.” `[V]`
(`packages/runtime/src/tactics.ts` `forkSurvivesReply`; the named executable controls).

The actual candidate compiler and Guided Hint selector consume controlled provider-exchange
fixtures for those same edges. Checkmate selects `mate_in_one`; stalemate selects
`fork_survives_reply`, whose pattern disclosure says “a double attack that still stands after
every reply.” This proves a source-to-selector/rendering path, **not** real Stockfish recommending
these moves, an HTTP/browser journey, incidence in ordinary games, or learned usefulness. `[V]`
(`terminal.test.ts` candidate-to-hint cases; `testing/hint-fixture.ts`; `hint-horizon.ts`).

The sibling policies are not interchangeable. On the same four terminal edges, the bounded mate
proof explicitly distinguishes proved checkmate from refuted stalemate. On both stalemate
fixtures with a mover-owned promotion-ready pawn added, pass availability is true but promotion
reply persistence is available/false. Four nonterminal promotion forks retain their genuine
positive/refutable results and exact refuting UCIs. `[V]` (`terminal.test.ts`; `mate-proof.ts`;
`tactics.ts` `promotionPressureReading`).

The fork's empty universal quantification follows the literal current §3.7 formula; the sibling
promotion rule explicitly rejects vacuous truth. Therefore this is a **missing terminal semantic
rule**, not authority to silently redefine the accepted fork convention. `[V]`
(`rfc/tactical-collectors.md` §§3.7/3.14). The proposed source-first repair and historical-output
decision are routed to `planning/tactical-collectors/plan.md` under D3768. Independent contract
acceptance is required before production changes. No projection, source eligibility, hint rank,
budget, pack, validation qualification or RFC lifecycle is changed by this experiment.

The first proposed stalemate fixtures were wrong: a knight checked the opposite king; a later
position permitted capture of the pinner; another let one target block the other. The final
controls assert legal move, terminal/check state and both positive-exchange targets before
asserting the consequence. Those failed fixture attempts are not product findings. `[V]`
(`terminal.test.ts` final boundary assertions).

## Terminal repair source/adoption inventory — 2026-10-15, D3768/D3847

The normal research target now passes 25 tests, retaining all original 22 characterizations.
The added non-production recipe validates genuine named double-attack/reply-breadth factories
and both private full-edge authorities before applying nonempty-replies AND the old survival
result. Four terminal payloads change only matched to false and retain zero real refutations;
four nonterminal promotion-fork payloads remain exactly equal. This is proposed semantics,
not a new registered helper, convention, factory or accepted repair. `[V]`
`make tactical-terminal-research`, `terminal.test.ts:prospectiveNonterminalFork`.

A legal pair demonstrates why the full edge join matters: a Black knight forks from b4 to c2
in otherwise identical positions with/without a genuine e3 en-passant right. Both produce the
same after-FEN, UCI and reply-breadth payload, but different private input authorities. The old
factory accepts the crossed breadth; the prospective guard refuses it and accepts its own.
Because the post-move positions are equal, this is a source-identity gap, not evidence of a
different fork verdict. `[V]` same target's equal-after-position control.

The compiled manifest has exactly five consumer declarations reaching the old predicate:

| Consumer | Declared relationship | Current-path evidence / limit |
|---|---|---|
| module.full_inspector@1 | direct | existing exact presentation pair; its dependent incoming-edge acquisition is still proposed under D3836/D3792 |
| module.postcommit_nudge@1 | direct | admitted registered presentation reproduced by the original terminal tests, not an authenticated live emission proof |
| module.review_map@1 | direct | acceptance/binding declarations, not proof the Review node compiler emits the predicate |
| module.guided_hint@1 | transitive | actual candidate packet → family source → horizon/disclosure selection reproduced by controlled provider fixtures |
| opponent.selection@1 | transitive via candidate_feature_vector | vector factory/collector and exported server adapter exist; source search finds no in-repo production caller of that server wrapper |

`[V]` same target's manifest dependency walk; `candidate-population.ts:forkSurvival`,
`hint-distance.ts:familySources`, `hint-horizon.ts:familyOperands`, `candidate-feature-vector.ts`,
`apps/server/src/candidate-evidence.ts`; exact candidateFeatureVector call sites. A declaration
is not an emitting path, nor does a repository search prove no external API callers.

The current renderer does not read matched: it renders the old statement from doubleAttack,
replyBreadth and refutingReplies. Reusing that exact pair for terminal false therefore does not
explain terminality. Candidate packet construction separately retains compilerVersion=1 and
requires a change for new construction semantics. The candidate-feature-vector route and
opponent.selection@1 are another exact source/consumer pair, not automatically changed by an
Inspector alias. These are explicit adoption obligations, not new learner surfaces. `[V]`
`presentation-inspector-adapters.ts:forkSurvives`; `candidate-population.ts` compiler identity;
`rfc/shared-candidate-evidence-packet.md` §5/criteria; server vector admission.

Longitudinal revision5 admits version1 semantic **events**, whereas fork survival is a predicate
and is absent from that registry. Do not commission a history rebuild solely because a new
predicate exists. Current content source search finds no literal fork-survival/fork_survives_reply
requirement; old module execution/binding plan artifacts do retain the old ref. This is a checked
repository snapshot, not authority to rewrite stored receipts or authored content. Actual
serialized occurrences and every later adopter still require their owner's inventory and
compatibility rule. `[V]` `longitudinal-registry.ts` exact registry constructor;
content/rfc/contracts source search; existing module plan artifacts.
