import type { PackDraft } from "./api.js";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { graduationEntries, type PresentedValidationIssue } from "./pack-validation-presentation.js";

/** Saved work may be incomplete or read-only; identity and usable validation must still match. */
export function assertSavedPackDraft(value: unknown, expectedDraftId: string): asserts value is PackDraft {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Invalid saved draft response");
  const draft = value as Record<string, unknown>;
  const document = draft.document;
  const validation = draft.validation;
  if (draft.id !== expectedDraftId || expectedDraftId.trim() === ""
    || typeof draft.packId !== "string" || draft.packId.trim() === ""
    || typeof draft.digest !== "string" || draft.digest.trim() === ""
    || !["draft", "registered", "withdrawn"].includes(draft.state as string)
    || document === null || typeof document !== "object" || Array.isArray(document)
    || (document as Record<string, unknown>).id !== draft.packId
    || validation === null || typeof validation !== "object" || Array.isArray(validation)) throw new TypeError("Invalid saved draft response");
  const result = validation as Record<string, unknown>;
  if (typeof result.valid !== "boolean" || !Array.isArray(result.issues)
    || result.issues.some(issue => issue === null || typeof issue !== "object" || Array.isArray(issue)
      || typeof issue.code !== "string" || issue.code.trim() === ""
      || typeof issue.path !== "string" || (issue.path !== "" && !issue.path.startsWith("/"))
      || typeof issue.message !== "string"
      || (issue.severity !== undefined && issue.severity !== "error" && issue.severity !== "warning"))) throw new TypeError("Invalid saved draft validation");
}

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
