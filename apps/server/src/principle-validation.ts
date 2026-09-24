import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { isPrincipleCitation, type PrincipleEntryDefinition } from "@chess-tabiya/schema/principle-entry";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import type { PackValidationIssue } from "./pack-validation.js";
import { joinPrincipleCitation, loadDefaultTheorySourceRegister, type JoinedCitation, type TheorySourceRegister } from "./theory-sources.js";

export interface PrincipleValidationResult {
  readonly valid: boolean;
  readonly issues: readonly PackValidationIssue[];
  readonly document?: PrincipleEntryDefinition;
  /** Every structured citation joined to its accepted register row, in `provenance.sources` order. */
  readonly citations?: readonly JoinedCitation[];
}

export interface PrincipleValidationOptions {
  /** Defaults to the committed `content/theory-sources.json`. */
  readonly sources?: TheorySourceRegister;
  /** Local pinned-bytes directory for the proof tier; `null` skips it (`source_unavailable`). */
  readonly bytesDirectory?: string | null;
}

let compiled: ValidateFunction | undefined;

function validator(): ValidateFunction {
  if (compiled !== undefined) return compiled;
  const schema = JSON.parse(readFileSync(fileURLToPath(new URL("../../../schemas/principle_entry.schema.json", import.meta.url)), "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  compiled = ajv.compile(schema);
  return compiled;
}

function token(value: string): string { return value.replaceAll("~", "~0").replaceAll("/", "~1"); }

/**
 * Principle-entry 0.2 (rfc/theory-knowledge-pipeline.md §10). After the schema, two semantic arms:
 * `standsOn: "cited_source"` holds exactly when at least one structured citation is present (the
 * biconditional that keeps the member from being an inert relabel, [[D428]]/[[D135]]), and every
 * structured citation joins an accepted theory-source register row with an equal revision and digest
 * ([[D1898]]).
 */
export function validatePrincipleEntry(value: unknown, options: PrincipleValidationOptions = {}): PrincipleValidationResult {
  const validate = validator();
  if (!validate(value)) {
    const issues = (validate.errors ?? []).map((error: ErrorObject) => {
      const missing = error.keyword === "required" ? error.params.missingProperty : undefined;
      const path = typeof missing === "string" ? `${error.instancePath}/${token(missing)}` : error.instancePath || "/";
      return Object.freeze({ severity: "error" as const, source: "schema" as const, code: `SCHEMA_${error.keyword.toUpperCase()}`, path, message: error.message ?? `failed ${error.keyword}` });
    });
    return Object.freeze({ valid: false, issues: Object.freeze(issues) });
  }
  const document = structuredClone(value) as PrincipleEntryDefinition;
  const issues: PackValidationIssue[] = [];
  const structured = document.provenance.sources.flatMap((source, index) => isPrincipleCitation(source) ? [{ source, index }] : []);
  if (document.standsOn === "cited_source" && structured.length === 0) {
    issues.push(Object.freeze({ severity: "error", source: "lint", code: "PRINCIPLE_CITATION_REQUIRED", path: "/standsOn", message: "standsOn cited_source requires at least one structured citation in provenance.sources" }));
  }
  if (document.standsOn !== "cited_source" && structured.length > 0) {
    issues.push(Object.freeze({ severity: "error", source: "lint", code: "PRINCIPLE_CITATION_BASIS_MISMATCH", path: "/standsOn", message: "a principle carrying a structured citation stands on cited_source" }));
  }
  const citations: JoinedCitation[] = [];
  if (structured.length > 0) {
    const register = options.sources ?? loadDefaultTheorySourceRegister();
    for (const { source, index } of structured) {
      const joined = joinPrincipleCitation(source, register, { path: `/provenance/sources/${index}`, ...(options.bytesDirectory === undefined ? {} : { bytesDirectory: options.bytesDirectory }) });
      for (const issue of joined.issues) issues.push(Object.freeze({ severity: "error", source: "lint", code: issue.code, path: issue.path, message: issue.message }));
      if (joined.citation !== undefined) citations.push(joined.citation);
    }
  }
  if (issues.length > 0) return Object.freeze({ valid: false, issues: Object.freeze(issues) });
  return Object.freeze({ valid: true, issues: Object.freeze([]), document, citations: Object.freeze(citations) });
}
