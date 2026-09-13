import type { DistillResult } from "./api.js";

export function validDistilledDraft(result: DistillResult, expectedPackId: string): boolean {
  const document = result.draft.document;
  return result.draft.id.trim().length > 0
    && result.draft.packId === expectedPackId
    && result.draft.state === "draft"
    && result.draft.digest.trim().length > 0
    && typeof document === "object"
    && document !== null
    && "id" in document
    && document.id === expectedPackId;
}
