import { DRILL_PACK_REQUIRED_FIELDS, type DrillPackRequiredField } from "@chess-tabiya/schema";

export interface PresentedValidationIssue {
  readonly severity?: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface RequiredFieldState {
  readonly field: DrillPackRequiredField;
  readonly present: boolean;
}

export function requiredFieldStates(documentText: string): readonly RequiredFieldState[] {
  let document: unknown;
  try {
    document = JSON.parse(documentText);
  } catch {
    document = undefined;
  }
  const object = document !== null && typeof document === "object" && !Array.isArray(document)
    ? document as Record<string, unknown>
    : undefined;
  return Object.freeze(DRILL_PACK_REQUIRED_FIELDS.map((field) => Object.freeze({
    field,
    present: object !== undefined && Object.hasOwn(object, field),
  })));
}

export function splitValidationIssues(issues: readonly PresentedValidationIssue[]): {
  readonly incomplete: readonly PresentedValidationIssue[];
  readonly wrong: readonly PresentedValidationIssue[];
  readonly warnings: readonly PresentedValidationIssue[];
} {
  return Object.freeze({
    incomplete: Object.freeze(issues.filter((issue) => issue.severity !== "warning" && issue.code === "SCHEMA_REQUIRED")),
    wrong: Object.freeze(issues.filter((issue) => issue.severity !== "warning" && issue.code !== "SCHEMA_REQUIRED")),
    warnings: Object.freeze(issues.filter((issue) => issue.severity === "warning")),
  });
}
