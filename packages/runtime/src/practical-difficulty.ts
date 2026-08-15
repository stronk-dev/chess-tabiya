export interface PolicyMassCandidate {
  readonly moveUci: string;
  readonly mass?: number;
  readonly offWindow?: boolean;
}

export interface HumanConcessionMass {
  readonly concedingMass: number;
  readonly measuredMass: number;
  readonly candidateCount: number;
}

// Maia's measured maximum excess is 9.25e-8. One float32 ulp at 1.0 gives
// 1.29x headroom while keeping the guard close enough for a captured vector to
// exercise its valid side. See maia-policy-mass-near-boundary.fixture.json.
export const FLOAT32_POLICY_MASS_TOLERANCE = 2 ** -23;

export class PolicyMassError extends TypeError {
  readonly code = "POLICY_MASS_INVALID" as const;

  constructor(message: string) {
    super(message);
    this.name = "PolicyMassError";
  }
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
  const measured = candidates.filter((candidate) => candidate.offWindow !== true);
  if (measured.length === 0 || measured.some((candidate) => candidate.mass === undefined)) return null;
  let concedingMass = 0;
  let measuredMass = 0;
  for (const candidate of measured) {
    const mass = candidate.mass!;
    if (!Number.isFinite(mass) || mass < 0 || mass > 1 + FLOAT32_POLICY_MASS_TOLERANCE) {
      throw new PolicyMassError(`policy mass must be between 0 and 1 within float32 tolerance; received ${String(mass)}`);
    }
    measuredMass += mass;
    if (concedingMoves.has(candidate.moveUci)) concedingMass += mass;
  }
  if (measuredMass > 1 + FLOAT32_POLICY_MASS_TOLERANCE) {
    throw new PolicyMassError(`measured policy mass cannot exceed 1 within float32 tolerance; received ${String(measuredMass)}`);
  }
  return Object.freeze({ concedingMass, measuredMass, candidateCount: measured.length });
}
