export const RULES_EVIDENCE_FACTS = Object.freeze([
  "checkmate",
  "stalemate",
  "draw-threefold",
  "draw-50move",
  "draw-insufficient",
  "material",
] as const);

export type RulesEvidenceFact = (typeof RULES_EVIDENCE_FACTS)[number];
export type RulesEvidenceRef = `rules:${RulesEvidenceFact}`;
export type PackEvidenceRef = `pack:${string}`;
export type EngineEvidenceRef = `engine:${string}`;

function evidenceId(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9._-]+$/.test(normalized)) {
    throw new TypeError(
      `${label} must use only letters, digits, dot, underscore, or hyphen`,
    );
  }
  return normalized;
}

export function rulesEvidenceRef(fact: RulesEvidenceFact): RulesEvidenceRef {
  if (!RULES_EVIDENCE_FACTS.includes(fact)) {
    throw new TypeError(`Unsupported rules evidence fact: ${String(fact)}`);
  }
  return `rules:${fact}`;
}

export function packEvidenceRef(checkpointId: string): PackEvidenceRef {
  return `pack:${evidenceId(checkpointId, "Checkpoint id")}`;
}

export function engineEvidenceRef(jobId: string): EngineEvidenceRef {
  return `engine:${evidenceId(jobId, "Engine job id")}`;
}

export function isEngineEvidenceRef(reference: string): reference is EngineEvidenceRef {
  return reference.startsWith("engine:") && reference.length > "engine:".length;
}
