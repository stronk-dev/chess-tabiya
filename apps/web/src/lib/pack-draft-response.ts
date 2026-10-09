import type { PackDraft } from "./api.js";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { graduationEntries, type PresentedValidationIssue } from "./pack-validation-presentation.js";

/** Only the publication validator's structured errors are safe author-facing details. */
export function parsePackPublicationIssues(value: unknown): readonly PresentedValidationIssue[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const issues: PresentedValidationIssue[] = [];
  for (const item of value) {
    if (item === null || typeof item !== "object" || Array.isArray(item)
      || typeof item.code !== "string" || item.code.trim() === ""
      || typeof item.path !== "string" || (item.path !== "" && !item.path.startsWith("/"))
      || typeof item.message !== "string" || item.message.trim() === ""
      || (item.severity !== undefined && item.severity !== "error" && item.severity !== "warning")) return undefined;
    if (item.severity !== "warning") issues.push({ code: item.code, path: item.path, message: item.message, severity: "error" });
  }
  return issues.length === 0 ? undefined : issues;
}

/** Registration publishes saved content, never an older document behind the editor. */
export function packRegistrationBlockReason(draft: PackDraft | undefined, editorText: string): string | undefined {
  if (draft === undefined) return "Select a draft first.";
  if (draft.state !== "draft") return `This draft is ${draft.state} and cannot be changed.`;
  let matchesSaved: boolean;
  try { matchesSaved = canonicalizeJson(JSON.parse(editorText)) === canonicalizeJson(draft.document); }
  catch { return "Fix the JSON before publishing, then save your changes."; }
  if (!matchesSaved) {
    return "Save your changes before publishing. Registration uses the saved draft.";
  }
  if (!draft.validation.valid) return "Fix the validation errors first.";
  if (graduationEntries(editorText)?.some(entry => entry.state === "blocking")) {
    return "Resolve the declared graduation blockers first.";
  }
  return undefined;
}

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
