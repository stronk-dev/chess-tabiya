import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { lintDrillPack } from "@chess-tabiya/schema/drill-pack";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { SUPPORTED_POLICY_MODES } from "./capabilities.js";

export interface PackValidationIssue {
  readonly severity: "error" | "warning";
  readonly source: "schema" | "lint" | "runtime";
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface PackValidationResult {
  readonly valid: boolean;
  readonly issues: readonly PackValidationIssue[];
  readonly document?: DrillPackDefinition;
}

let schemaValidator: ValidateFunction | undefined;

function validator(): ValidateFunction {
  if (schemaValidator !== undefined) return schemaValidator;
  const schemaPath = fileURLToPath(
    new URL("../../../schemas/drill_pack.schema.json", import.meta.url),
  );
  const schema = JSON.parse(readFileSync(schemaPath, "utf8")) as Record<
    string,
    unknown
  >;
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  schemaValidator = ajv.compile(schema);
  return schemaValidator;
}

function pointerToken(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function schemaPath(error: ErrorObject): string {
  if (error.keyword !== "required") return error.instancePath || "/";
  const missing = error.params.missingProperty;
  return typeof missing === "string"
    ? `${error.instancePath}/${pointerToken(missing)}` || "/"
    : error.instancePath || "/";
}

function schemaIssue(error: ErrorObject): PackValidationIssue {
  return Object.freeze({
    severity: "error",
    source: "schema",
    code: `SCHEMA_${error.keyword.toUpperCase()}`,
    path: schemaPath(error),
    message: error.message ?? `failed ${error.keyword}`,
  });
}

function runtimeIssue(
  code: string,
  path: string,
  message: string,
): PackValidationIssue {
  return Object.freeze({ severity: "error", source: "runtime", code, path, message });
}

function runtimeIssues(pack: DrillPackDefinition): readonly PackValidationIssue[] {
  const issues: PackValidationIssue[] = [];
  const raw = pack as unknown as Record<string, unknown>;
  const feedbackPolicy = raw.feedbackPolicy;
  if (feedbackPolicy === "immediate_blunder_guard") {
    issues.push(
      runtimeIssue(
        "UNSUPPORTED_FEEDBACK_POLICY",
        "/feedbackPolicy",
        "immediate_blunder_guard is not supported in v1",
      ),
    );
  } else if (
    feedbackPolicy !== "delayed_checkpoint" &&
    feedbackPolicy !== "segment_end"
  ) {
    issues.push(
      runtimeIssue(
        "UNSUPPORTED_FEEDBACK_POLICY",
        "/feedbackPolicy",
        `${String(feedbackPolicy)} is not a supported v1 feedback policy`,
      ),
    );
  }

  const opponentPolicy = raw.opponentPolicy as Record<string, unknown>;
  const opponentMode = opponentPolicy.mode;
  if (
    typeof opponentMode !== "string" ||
    !SUPPORTED_POLICY_MODES.some((mode) => mode === opponentMode)
  ) {
    issues.push(
      runtimeIssue(
        "UNSUPPORTED_OPPONENT_POLICY",
        "/opponentPolicy/mode",
        `${String(opponentMode)} is not selectable in v1`,
      ),
    );
  }

  const checkpoints = new Set(pack.checkpoints.map((checkpoint) => checkpoint.id));
  const conditions = pack.objective.successConditions;
  if (Array.isArray(conditions)) {
    for (const [index, value] of conditions.entries()) {
      const condition = value as Record<string, unknown>;
      if (
        condition.kind !== "reach_checkpoint" ||
        typeof condition.checkpointId !== "string" ||
        !checkpoints.has(condition.checkpointId)
      ) {
        issues.push(
          runtimeIssue(
            "UNSUPPORTED_OBJECTIVE_CONDITION",
            `/objective/successConditions/${index}`,
            "only reach_checkpoint for a checkpoint in this pack is supported in v1",
          ),
        );
      }
    }
  }
  return Object.freeze(issues);
}

export function validatePackDocument(value: unknown): PackValidationResult {
  const validate = validator();
  if (!validate(value)) {
    return Object.freeze({
      valid: false,
      issues: Object.freeze((validate.errors ?? []).map(schemaIssue)),
    });
  }

  const document = structuredClone(value) as DrillPackDefinition;
  const issues: PackValidationIssue[] = [
    ...lintDrillPack(document).map((issue) =>
      Object.freeze({
        severity: issue.severity,
        source: "lint" as const,
        code: issue.code,
        path: issue.path,
        message: issue.message,
      }),
    ),
    ...runtimeIssues(document),
  ];
  return Object.freeze({
    valid: !issues.some((issue) => issue.severity === "error"),
    issues: Object.freeze(issues),
    document,
  });
}
