export interface PolicyMassCandidate {
  readonly moveUci: string;
  readonly mass?: number;
}

export interface HumanConcessionMass {
  readonly concedingMass: number;
  readonly measuredMass: number;
  readonly candidateCount: number;
}

/**
 * Measures how much of an observed human-policy distribution lies on moves
 * whose externally classified outcome differs. Missing policy mass is an
 * abstention: rank weights are selection aids, not measurements.
 */
export function humanConcessionMass(
  candidates: readonly PolicyMassCandidate[],
  concedingMoves: ReadonlySet<string>,
): HumanConcessionMass | null {
  if (candidates.length === 0 || candidates.some((candidate) => candidate.mass === undefined)) return null;
  let concedingMass = 0;
  let measuredMass = 0;
  for (const candidate of candidates) {
    const mass = candidate.mass!;
    if (!Number.isFinite(mass) || mass < 0 || mass > 1) {
      throw new TypeError(`policy mass must be between 0 and 1; received ${String(mass)}`);
    }
    measuredMass += mass;
    if (concedingMoves.has(candidate.moveUci)) concedingMass += mass;
  }
  if (measuredMass > 1 + 1e-9) {
    throw new TypeError(`measured policy mass cannot exceed 1; received ${String(measuredMass)}`);
  }
  return Object.freeze({ concedingMass, measuredMass, candidateCount: candidates.length });
}
