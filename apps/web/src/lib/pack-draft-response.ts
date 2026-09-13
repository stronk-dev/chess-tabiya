import type { PackDraft } from "./api.js";

export function validPackDraftIdentity(draft: PackDraft, expectedPackId: string): boolean {
  const document = draft.document;
  return draft.id.trim().length > 0
    && draft.packId === expectedPackId
    && draft.state === "draft"
    && draft.digest.trim().length > 0
    && typeof document === "object"
    && document !== null
    && "id" in document
    && document.id === expectedPackId;
}
