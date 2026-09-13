import type { ShapeDraft, ShapeSummary } from "./api.js";

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : undefined;
}

function validIssue(value: unknown): boolean {
  const issue = record(value);
  return issue !== undefined
    && typeof issue.code === "string"
    && typeof issue.path === "string"
    && typeof issue.message === "string"
    && (issue.severity === undefined || issue.severity === "error" || issue.severity === "warning");
}

function validCorpusPreview(value: unknown): boolean {
  if (value === undefined) return true;
  const preview = record(value);
  if (preview === undefined
    || !Number.isInteger(preview.fires)
    || !Number.isInteger(preview.of)
    || Number(preview.fires) < 0
    || Number(preview.of) < Number(preview.fires)
    || !Array.isArray(preview.matches)) return false;
  return preview.matches.every((value) => {
    const match = record(value);
    return match !== undefined
      && typeof match.packId === "string"
      && typeof match.packTitle === "string"
      && Number.isInteger(match.ply)
      && Number(match.ply) >= 0
      && typeof match.fen === "string"
      && (match.startSide === "white" || match.startSide === "black");
  });
}

export function validShapeValidation(value: unknown): value is ShapeDraft["validation"] {
  const validation = record(value);
  return validation !== undefined
    && typeof validation.valid === "boolean"
    && Array.isArray(validation.issues)
    && validation.issues.every(validIssue)
    && (validation.probeMatches === undefined || typeof validation.probeMatches === "boolean")
    && validCorpusPreview(validation.corpusPreview);
}

export function validShapeDraftIdentity(draft: ShapeDraft, expectedShapeId: string): boolean {
  const document = record(draft.document);
  return draft.id.trim().length > 0
    && draft.shapeId === expectedShapeId
    && draft.state === "draft"
    && draft.digest.trim().length > 0
    && document?.id === expectedShapeId
    && validShapeValidation(draft.validation);
}

export function validRegisteredShapeIdentity(summary: ShapeSummary, draft: ShapeDraft): boolean {
  const document = record(draft.document);
  return summary.id === draft.shapeId
    && summary.version === document?.version
    && summary.digest === draft.digest
    && summary.name.trim().length > 0
    && Array.isArray(summary.phases)
    && summary.phases.every((phase) => phase === "opening" || phase === "middlegame" || phase === "endgame")
    && summary.licence.trim().length > 0
    && summary.channel === "community"
    && Number.isInteger(summary.usedByPacks)
    && summary.usedByPacks >= 0;
}
