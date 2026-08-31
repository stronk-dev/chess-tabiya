# Shared candidate packet fourth fresh independent review — 2026-08-31

## Verdict

Returned on [[D2389]]. The D2329/D2330 author repair is coherent: projection identity uses one
literal versioned-key dialect and the readings scope executes its event dependencies without
retaining them. The legal-population value authority remains split, so implementation is not
authorized.

## D2389 — the flat legal population and its evidence receipt have different sources

`CandidatePopulationReceipt` requires a sealed `DeclaredEvidence<ExactLegalMoveMap>`. The normative
packet source in §4.1 is instead `exactLegalMoves(beforeFen)`; the service factory fixes that
function, and criteria 2 and 5 use it as the independent population authority. Production's exact
declaration adapter accepts an `ExactLegalMoveMap` and validates it by calling
`exactLegalMoveMap(payload.fen)`. The RFC does not say which exact map object is retained or require
the packet's flat move objects to come from its payload.

Set equality does not close this seam. A separately enumerated equal list passes every population
set check while the receipt authenticates another object graph. That contradicts the RFC's own
exact-reference receipt rule and leaves implementers to choose the source.

## Required repair

Compile one `exactLegalMoveMap(beforeFen)`, seal that exact object through
`declareExactLegalMovesEvidence`, and derive the packet list by flattening
`legalMovesInput.payload.pieces[].moves` without copying its move objects. The packet compiler and
factory must not call `exactLegalMoves` as a second population source. Add a positive exact-reference
fixture and a negative in which a separately enumerated equal list is rejected.

## Verification

`make candidate-packet-fourth-author-repair` remains green for D2329/D2330.
`make candidate-packet-fourth-fresh-review` reproduces D2389 against the RFC and current production
factory boundaries. No production, schema, content, archive or protected-intent file changed.
