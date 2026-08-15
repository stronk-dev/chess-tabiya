export const RULES_EVIDENCE_FACTS = Object.freeze([
  "checkmate",
  "stalemate",
  "draw",
  "draw-threefold",
  "draw-50move",
  "draw-insufficient",
  "material",
  "result-win",
  "result-loss",
  "result-draw",
  "structure-pawn-safe-square",
  "structure-outpost",
  "structure-backward-pawn",
  "structure-isolated-pawn",
  "structure-doubled-pawn",
  "structure-passed-pawn",
  "structure-open-file",
  "structure-half-open-file",
  "structure-line-blockers",
  "structure-direct-attack-count",
  "structure-piece-reach-count",
  "structure-named-structure",
  "structure-bishop-on-shade",
  "structure-pawn-count",
  "structure-king-opposition",
  "structure-piece-count",
  "structure-king-zone",
  "structure-piece-distance",
] as const);

export type RulesEvidenceFact = (typeof RULES_EVIDENCE_FACTS)[number];
export type RulesEvidenceRef = `rules:${RulesEvidenceFact}`;
export type PackEvidenceRef = `pack:${string}`;
export type PackAbsentEvidenceRef = `pack-absent:${string}`;

export const THEORY_EVIDENCE_FACTS = Object.freeze([
  "off-objective-deviation",
] as const);
export type TheoryEvidenceFact = (typeof THEORY_EVIDENCE_FACTS)[number];
export type TheoryEvidenceRef = `theory:${TheoryEvidenceFact}`;
export type EngineEvidenceRef = `engine:${string}`;
export type TempoEvidenceRef = `tempo:${string}`;

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

export function packAbsentEvidenceRef(checkpointId: string): PackAbsentEvidenceRef {
  return `pack-absent:${evidenceId(checkpointId, "Checkpoint id")}`;
}

export function theoryEvidenceRef(fact: TheoryEvidenceFact): TheoryEvidenceRef {
  return `theory:${fact}`;
}

export function tempoEvidenceRef(windowId: string, verdict: string): TempoEvidenceRef {
  return `tempo:${evidenceId(windowId, "Window id")}.${evidenceId(verdict.replaceAll("_", "-"), "Tempo verdict")}`;
}

export function engineEvidenceRef(jobId: string): EngineEvidenceRef {
  return `engine:${evidenceId(jobId, "Engine job id")}`;
}

export function isEngineEvidenceRef(reference: string): reference is EngineEvidenceRef {
  return reference.startsWith("engine:") && reference.length > "engine:".length;
}
