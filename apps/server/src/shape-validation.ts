import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import type { StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import { matchesStructuralExpression } from "@chess-tabiya/runtime";
import { INITIAL_FEN } from "chessops/fen";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { structuralIssues, type PackValidationIssue } from "./pack-validation.js";
import { refuteStructuralExpression } from "./expression-satisfiability.js";

export interface ShapeValidationResult {
  readonly valid: boolean;
  readonly issues: readonly PackValidationIssue[];
  readonly document?: ShapeEntryDefinition;
  readonly probeMatches?: boolean;
}

let compiled: ValidateFunction | undefined;

function validator(): ValidateFunction {
  if (compiled !== undefined) return compiled;
  const schema = JSON.parse(readFileSync(fileURLToPath(new URL("../../../schemas/shape_entry.schema.json", import.meta.url)), "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  compiled = ajv.compile(schema);
  return compiled;
}

function pointerToken(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function issue(code: string, path: string, message: string, source: PackValidationIssue["source"] = "runtime"): PackValidationIssue {
  return Object.freeze({ severity: "error", source, code, path, message });
}

function schemaIssue(error: ErrorObject): PackValidationIssue {
  const missing = error.keyword === "required" ? error.params.missingProperty : undefined;
  const path = typeof missing === "string" ? `${error.instancePath}/${pointerToken(missing)}` : error.instancePath || "/";
  return issue(`SCHEMA_${error.keyword.toUpperCase()}`, path || "/", error.message ?? `failed ${error.keyword}`, "schema");
}

const FEN_IN_PROSE = /(?:^|\s)(?:[prnbqkPRNBQK1-8]+\/){7}[prnbqkPRNBQK1-8]+(?:\s|$)/;

function containsPlanSignature(expression: StructuralExpression): boolean {
  if (expression.kind === "plan_signature") return true;
  if (expression.kind === "all" || expression.kind === "any") return expression.of.some(containsPlanSignature);
  if (expression.kind === "not" || expression.kind === "mirrored") return containsPlanSignature(expression.of);
  return false;
}

export function validateShapeEntry(value: unknown, options: { readonly probeFen?: string } = {}): ShapeValidationResult {
  const validate = validator();
  if (!validate(value)) return Object.freeze({ valid: false, issues: Object.freeze((validate.errors ?? []).map(schemaIssue)) });
  const document = structuredClone(value) as ShapeEntryDefinition;
  const issues: PackValidationIssue[] = [...structuralIssues(document.trigger, "/trigger")];
  if (containsPlanSignature(document.trigger)) issues.push(issue("PLAN_SIGNATURE_NESTED", "/trigger", "shape entries cannot resolve pack-local plan_signature references"));
  for (const [index, plan] of document.plans.entries()) {
    if (plan.success.signature !== null) {
      issues.push(...structuralIssues(plan.success.signature, `/plans/${index}/success/signature`));
      if (containsPlanSignature(plan.success.signature)) issues.push(issue("PLAN_SIGNATURE_NESTED", `/plans/${index}/success/signature`, "shape plan signatures cannot contain pack-local plan_signature references"));
    }
  }
  const expressionValid = !issues.some((candidate) => candidate.severity === "error");
  if (expressionValid && matchesStructuralExpression(INITIAL_FEN, document.trigger)) {
    issues.push(issue("SHAPE_TRIGGER_TRUE_AT_INITIAL", "/trigger", "shape trigger must not match the standard initial position"));
  }
  const triggerRefutation = containsPlanSignature(document.trigger) ? undefined : refuteStructuralExpression(document.trigger);
  if (triggerRefutation !== undefined) issues.push(issue("STRUCTURAL_EXPRESSION_UNSATISFIABLE", "/trigger", `${triggerRefutation.rule}: ${triggerRefutation.message}`));
  for (const [index, plan] of document.plans.entries()) {
    if (plan.success.signature === null) continue;
    if (containsPlanSignature(plan.success.signature)) continue;
    const refutation = refuteStructuralExpression(plan.success.signature);
    if (refutation !== undefined) issues.push(issue("STRUCTURAL_EXPRESSION_UNSATISFIABLE", `/plans/${index}/success/signature`, `${refutation.rule}: ${refutation.message}`));
  }
  const ids = new Set<string>();
  for (const [index, plan] of document.plans.entries()) {
    if (ids.has(plan.id)) issues.push(issue("SHAPE_DUPLICATE_PLAN_ID", `/plans/${index}/id`, `duplicate plan id ${plan.id}`));
    ids.add(plan.id);
  }
  if (!document.plans.some((plan) => plan.side === "white") || !document.plans.some((plan) => plan.side === "black")) {
    issues.push(issue("SHAPE_PLAN_SIDES_ONE_WAY", "/plans", "shape entries require at least one plan for each side"));
  }
  const prose: readonly (readonly [string, string])[] = [
    ...document.plans.flatMap((plan, index) => [[`/plans/${index}/description`, plan.description], [`/plans/${index}/success/note`, plan.success.note]] as const),
    ...document.watch.map((text, index) => [`/watch/${index}`, text] as const),
    ...document.typicalMistakes.map((text, index) => [`/typicalMistakes/${index}`, text] as const),
  ];
  for (const [path, text] of prose) {
    if (FEN_IN_PROSE.test(text)) issues.push(issue("SHAPE_PROSE_CONTAINS_FEN", path, "shape prose cannot contain a FEN"));
  }
  return Object.freeze({
    valid: !issues.some((candidate) => candidate.severity === "error"),
    issues: Object.freeze(issues),
    document,
    ...(options.probeFen === undefined || !expressionValid ? {} : { probeMatches: matchesStructuralExpression(options.probeFen, document.trigger) }),
  });
}
