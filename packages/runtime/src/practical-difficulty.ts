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

// Maia emits float32 policy values. A normalized vector may therefore sum a
// few float32 ulps above 1 after the values are parsed and accumulated here.
// The sidecar currently returns at most 20 candidates; 32 ulps leaves room for
// that accumulation while still refusing materially invalid distributions.
export const FLOAT32_POLICY_MASS_TOLERANCE = 32 * 2 ** -23;

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
