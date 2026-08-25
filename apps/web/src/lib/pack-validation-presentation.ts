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

export interface PresentedGraduationEntry {
  readonly id: string;
  readonly state: "blocking" | "resolved" | "accepted";
  readonly statement: string;
  readonly legacy: boolean;
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

export function graduationEntries(documentText: string): readonly PresentedGraduationEntry[] | undefined {
  let document: unknown;
  try {
    document = JSON.parse(documentText);
  } catch {
    return undefined;
  }
  if (document === null || typeof document !== "object" || Array.isArray(document)) return Object.freeze([]);
  const provenance = (document as Record<string, unknown>).provenance;
  if (provenance === null || typeof provenance !== "object" || Array.isArray(provenance)) return Object.freeze([]);
  const entries = (provenance as Record<string, unknown>).graduationBlockers;
  if (!Array.isArray(entries)) return Object.freeze([]);
  return Object.freeze(entries.map((entry, index): PresentedGraduationEntry => {
    if (typeof entry === "string") {
      return Object.freeze({ id: `legacy-${index + 1}`, state: "blocking", statement: entry, legacy: true });
    }
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return Object.freeze({ id: `invalid-${index + 1}`, state: "blocking", statement: "Malformed graduation entry; fix the document before publication.", legacy: true });
    }
    const object = entry as Record<string, unknown>;
    const state = object.state === "resolved" || object.state === "accepted" ? object.state : "blocking";
    return Object.freeze({
      id: typeof object.id === "string" && object.id.length > 0 ? object.id : `invalid-${index + 1}`,
      state,
      statement: typeof object.statement === "string" && object.statement.length > 0 ? object.statement : "Graduation entry has no statement.",
      legacy: false,
    });
  }));
}
