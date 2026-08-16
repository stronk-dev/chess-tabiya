import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { PrincipleEntryDefinition } from "@chess-tabiya/schema/principle-entry";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import type { PackValidationIssue } from "./pack-validation.js";

export interface PrincipleValidationResult {
  readonly valid: boolean;
  readonly issues: readonly PackValidationIssue[];
  readonly document?: PrincipleEntryDefinition;
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

export function validatePrincipleEntry(value: unknown): PrincipleValidationResult {
  const validate = validator();
  if (validate(value)) return Object.freeze({ valid: true, issues: Object.freeze([]), document: structuredClone(value) as PrincipleEntryDefinition });
  const issues = (validate.errors ?? []).map((error: ErrorObject) => {
    const missing = error.keyword === "required" ? error.params.missingProperty : undefined;
    const path = typeof missing === "string" ? `${error.instancePath}/${token(missing)}` : error.instancePath || "/";
    return Object.freeze({ severity: "error" as const, source: "schema" as const, code: `SCHEMA_${error.keyword.toUpperCase()}`, path, message: error.message ?? `failed ${error.keyword}` });
  });
  return Object.freeze({ valid: false, issues: Object.freeze(issues) });
}
