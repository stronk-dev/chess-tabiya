export function createExactLegalEvidenceFactory(exactLegalMoveMap) {
  return (value) => {
    if (typeof value !== "string") throw new TypeError("EXACT_LEGAL_EVIDENCE_FEN_INVALID");
    const payload = exactLegalMoveMap(value);
    return Object.freeze({
      producer: Object.freeze({ id: "rules.mobility", version: 1 }),
      projection: Object.freeze({ id: "rules.mobility.reading.legal_moves", version: 1 }),
      payload,
    });
  };
}

export function compileLegalPopulation(beforeFen, declareExactLegalMovesEvidence) {
  const legalMovesInput = declareExactLegalMovesEvidence(beforeFen);
  const legalMoves = Object.freeze(legalMovesInput.payload.pieces.flatMap((piece) => piece.moves));
  return Object.freeze({ legalMovesInput, legalMoves });
}

export function assertLegalPopulationOwned(compiled) {
  const retained = compiled.legalMovesInput.payload.pieces.flatMap((piece) => piece.moves);
  if (retained.length !== compiled.legalMoves.length) throw new TypeError("CANDIDATE_POPULATION_RECEIPT_INVALID");
  for (let index = 0; index < retained.length; index += 1) {
    if (retained[index] !== compiled.legalMoves[index]) throw new TypeError("CANDIDATE_POPULATION_RECEIPT_INVALID");
  }
}
