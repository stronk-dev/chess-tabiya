import { createHash } from "node:crypto";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/digest.js";

export type TemplatePlan = Readonly<Record<string, unknown> & {
  kind: string;
  instrument: string;
  subject?: string;
  expected?: string | number | boolean | null;
  templateId?: string;
  payloadPointers?: readonly string[];
  captureEmittedPayload?: boolean;
  requireNonEmptyCollection?: boolean;
  deferredSubject?: boolean;
}>;

type Document = Record<string, any> & { id: string };
type Entry = { id: string; state: "blocking"; statement: string; clearance: Record<string, unknown> };

export type EvaluationContext = Readonly<{
  assessmentGrounding: "ledger_verified" | "unverified";
  objectiveRuleCount(document: Document): number;
}>;

const DECLARATION_KEYS = new Set(["declaration"]);

export function digestCanonicalSync(value: unknown): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value), "utf8").digest("hex")}`;
}

function pointerValue(document: unknown, pointer: string): { found: boolean; value?: unknown } {
  if (pointer === "") return { found: true, value: document };
  if (!pointer.startsWith("/")) return { found: false };
  let value = document;
  for (const rawToken of pointer.slice(1).split("/")) {
    const token = rawToken.replaceAll("~1", "/").replaceAll("~0", "~");
    if (value === null || typeof value !== "object" || !(token in value)) return { found: false };
    value = (value as Record<string, unknown>)[token];
  }
  return { found: true, value };
}

export function declarationPayload(document: Document, entryId: string, plan: TemplatePlan) {
  if (plan.kind !== "content_declared" || plan.templateId !== entryId || plan.payloadPointers === undefined) {
    throw new TypeError(`content-declaration:plan:${entryId}`);
  }
  return Object.freeze({
    schema: "tabiya.graduation.content-declaration-payload.v1",
    packId: document.id,
    entryId,
    templateId: plan.templateId,
    payload: Object.freeze(plan.payloadPointers.map((pointer) => Object.freeze({
      pointer,
      value: pointerValue(document, pointer).value ?? null,
    }))),
  });
}

export function declarationMaterial(document: Document, entryId: string, plan: TemplatePlan, declaredAt: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(declaredAt) || new Date(declaredAt).toISOString() !== declaredAt) {
    throw new TypeError("content-declaration:declaredAt");
  }
  return Object.freeze({
    schema: "tabiya.graduation.content-declaration.v1",
    declaredAt,
    payload: declarationPayload(document, entryId, plan),
  });
}

export function declare(document: Document, entryId: string, plan: TemplatePlan, declaredAt = "2026-09-07T12:00:00.000Z") {
  return Object.freeze({
    authority: "repository_content_declaration",
    declaredAt,
    declarationDigest: digestCanonicalSync(declarationMaterial(document, entryId, plan, declaredAt)),
  });
}

export function persistedClearance(plan: TemplatePlan, state: Record<string, unknown> = {}): Record<string, unknown> {
  const persisted = Object.fromEntries(Object.entries(plan).filter(([key]) => !["payloadPointers", "captureEmittedPayload", "requireNonEmptyCollection", "deferredSubject"].includes(key)));
  return Object.freeze({ ...persisted, ...state });
}

function assertPlanJoined(entry: Entry, plan: TemplatePlan): void {
  const persistedPlan = persistedClearance(plan);
  const allowed = new Set([
    ...Object.keys(persistedPlan),
    ...(plan.kind === "content_declared" ? DECLARATION_KEYS : []),
    ...(plan.captureEmittedPayload === true ? ["emittedPayloadDigest"] : []),
  ]);
  const actualKeys = Object.keys(entry.clearance).sort();
  for (const [key, expected] of Object.entries(persistedPlan)) {
    if (!(key in entry.clearance) || canonicalizeJson(entry.clearance[key]) !== canonicalizeJson(expected)) {
      throw new TypeError(`clearance:plan-mismatch:${entry.id}:${key}`);
    }
  }
  for (const key of actualKeys) {
    if (!allowed.has(key)) throw new TypeError(`clearance:plan-extra:${entry.id}:${key}`);
  }
  if (plan.captureEmittedPayload === true && !/^sha256:[0-9a-f]{64}$/u.test(String(entry.clearance.emittedPayloadDigest))) {
    throw new TypeError(`clearance:emitted-payload:${entry.id}`);
  }
}

function contentPrecondition(document: Document, entryId: string, plan: TemplatePlan): boolean {
  const payload = declarationPayload(document, entryId, plan).payload;
  if (plan.requireNonEmptyCollection === true && !payload.some(({ value }) => Array.isArray(value) && value.length > 0)) return false;
  if (entryId === "mechanical-objective-placeholder") {
    const summary = pointerValue(document, "/objective/summary").value;
    const emitted = document.provenance?.graduationBlockers?.find((candidate: any) => candidate.id === entryId)?.clearance?.emittedPayloadDigest;
    return typeof summary === "string" && summary.trim() !== "" && typeof emitted === "string" && emitted !== digestCanonicalSync(declarationPayload(document, entryId, plan));
  }
  if (entryId === "target-elo-authored") return Number.isInteger(pointerValue(document, "/opponentPolicy/targetElo").value);
  if (entryId === "opponent-policy-authored") {
    const value = pointerValue(document, "/opponentPolicy").value;
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  if (entryId === "mechanical-objective-needs-grounding") {
    const value = pointerValue(document, "/objective").value;
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  return true;
}

export function evaluateTemplate(
  plans: Readonly<Record<string, TemplatePlan>>,
  document: Document,
  entry: Entry,
  context: EvaluationContext,
): boolean {
  const plan = plans[entry.id];
  if (plan === undefined) throw new TypeError(`clearance:unregistered:${entry.id}`);
  assertPlanJoined(entry, plan);
  switch (plan.kind) {
    case "pointer_equals": {
      const resolved = pointerValue(document, String(plan.subject));
      return resolved.found && canonicalizeJson(resolved.value) === canonicalizeJson(plan.expected);
    }
    case "objective_graded": {
      const objective = pointerValue(document, String(plan.subject)).value as Record<string, unknown> | undefined;
      return objective !== undefined && ["win", "hold", "save", "resist"].includes(String(objective.type)) && objective.grading !== null && typeof objective.grading === "object" && context.objectiveRuleCount(document) > 0;
    }
    case "assessment_grounded": {
      const resolved = pointerValue(document, String(plan.subject));
      return resolved.found && context.assessmentGrounding === "ledger_verified";
    }
    case "content_declared": {
      if (!contentPrecondition(document, entry.id, plan)) return false;
      const declaration = entry.clearance.declaration as Record<string, unknown> | undefined;
      if (declaration === undefined || declaration.authority !== "repository_content_declaration" || typeof declaration.declaredAt !== "string" || typeof declaration.declarationDigest !== "string") return false;
      const expected = digestCanonicalSync(declarationMaterial(document, entry.id, plan, declaration.declaredAt));
      return declaration.declarationDigest === expected;
    }
    default:
      throw new TypeError(`clearance:unsupported:${plan.kind}`);
  }
}
