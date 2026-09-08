import { createHash } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";

import { canonicalizeJson, digestDrillPack, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";

import { runExpressionCensus } from "../expression-census.js";
import { EMITTER_GRADUATION_CLEARANCE_PLANS, type EmitterGraduationClearancePlan } from "../graduation-blocker-templates.mjs";
import { objectiveRules } from "../pack-orchestrator.js";
import { validateClaimBindings } from "./claim-binding.js";
import { readJson, writeCanonicalJson } from "./canonical.js";
import { resolvePointer } from "./check.js";
import { assessmentGrounding } from "./ledger-validation.js";
import type { EvidenceLedger, EvidenceRecord, SourceManifest, SourcingIssue } from "./types.js";

const FIRST_RUN_EXEMPTIONS = new Set([
  "mate-k-q-technique/the-syzygy-root-assessment-is-declared-but-not-ledger-ve",
  "mate-k-r-technique/the-syzygy-root-assessment-is-declared-but-not-ledger-ve",
  "mate-two-bishops/the-syzygy-root-assessment-is-declared-but-not-ledger-ve",
  "philidor-passive-rook-convert/the-syzygy-root-assessment-is-declared-but-not-ledger-ve",
]);

const MECHANICAL_KINDS = new Set([
  "assessment_grounded",
  "ledger_record",
  "claim_bound",
  "shape_firing",
  "pointer_authored",
  "pointer_equals",
  "objective_graded",
  "content_declared",
]);

export interface GraduationClearance {
  readonly kind: "assessment_grounded" | "ledger_record" | "claim_bound" | "shape_firing" | "pointer_authored" | "pointer_equals" | "objective_graded" | "content_declared" | "unbuilt" | "unreachable" | "referent_removed";
  readonly subject?: string;
  readonly recordKind?: EvidenceRecord["kind"];
  readonly instrument?: string;
  readonly blockedBy?: string;
  readonly placeholder?: string;
  readonly absentIds?: readonly string[];
  readonly expected?: string | number | boolean | null;
  readonly templateId?: string;
  readonly emittedPayloadDigest?: string;
  readonly declaration?: {
    readonly authority: "repository_content_declaration";
    readonly declaredAt: string;
    readonly declarationDigest: string;
  };
}

interface BlockingEntry {
  readonly id: string;
  readonly state: "blocking";
  readonly statement: string;
  readonly clearance?: GraduationClearance;
}

export interface PredicateResult {
  readonly holds: boolean;
  readonly evidence: string;
}

export interface GraduationTransitionResult {
  readonly schema: "tabiya.graduation.transition.v1";
  readonly packId: string;
  readonly at: string;
  readonly packDigestBefore: string;
  readonly packDigestAfter: string;
  readonly transitions: readonly {
    readonly id: string;
    readonly from: "blocking";
    readonly to: "resolved";
    readonly clearance: GraduationClearance;
    readonly evidence: string;
  }[];
  readonly held: readonly {
    readonly id: string;
    readonly kind: GraduationClearance["kind"] | "unspecified";
    readonly recordKind?: EvidenceRecord["kind"];
    readonly verdict: "does not hold" | "no predicate";
  }[];
}

export class GraduationClearanceError extends Error {
  constructor(readonly code: "GRADUATION_CLEARANCE_VACUOUS" | "GRADUATION_CLEARANCE_INVALID", message: string) {
    super(message);
    this.name = "GraduationClearanceError";
  }
}

function paths(file: string): { pack: string; ledger: string; manifest: string; transition: string } {
  const pack = resolve(file);
  const directory = dirname(pack);
  const name = basename(pack);
  if (name === "pack.json") return {
    pack,
    ledger: resolve(directory, "evidence.json"),
    manifest: resolve(directory, "sources.json"),
    transition: resolve(directory, "graduation.json"),
  };
  const stem = name.slice(0, -extname(name).length);
  return {
    pack,
    ledger: resolve(directory, `${stem}.evidence.json`),
    manifest: resolve(directory, `${stem}.sources.json`),
    transition: resolve(directory, `${stem}.graduation.json`),
  };
}

function shapePredicate(pack: DrillPackDefinition, clearance: GraduationClearance, census: ReturnType<typeof runExpressionCensus>): boolean {
  if (clearance.subject === undefined) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", "shape_firing requires subject");
  const resolved = resolvePointer(pack, clearance.subject);
  if (!resolved.found) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", `${clearance.subject} does not resolve`);
  let kind: string;
  let shape: string | undefined;
  let plan: string | undefined;
  if (/^\/shapes\/\d+$/u.test(clearance.subject) && typeof resolved.value === "string") {
    kind = "shape_trigger";
    shape = resolved.value;
  } else if (/^\/planClasses\/\d+\/shapePlan$/u.test(clearance.subject) && typeof resolved.value === "object" && resolved.value !== null) {
    const value = resolved.value as Record<string, unknown>;
    kind = "shape_plan_signature";
    shape = typeof value.shape === "string" ? value.shape : undefined;
    plan = typeof value.plan === "string" ? value.plan : undefined;
  } else {
    throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", `${clearance.subject} is not a shape-firing subject`);
  }
  const subject = census.subjects?.find((candidate: any) => candidate.site?.subject?.kind === kind && candidate.site.subject.shape === shape && (plan === undefined || candidate.site.subject.plan === plan));
  return subject?.coverage?.corpus?.packs?.some((candidate: any) => candidate.id === pack.id && candidate.count > 0) === true;
}

function digestCanonicalSync(value: unknown): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value), "utf8").digest("hex")}`;
}

function templatePlan(entryId: string): EmitterGraduationClearancePlan | undefined {
  return (EMITTER_GRADUATION_CLEARANCE_PLANS as Readonly<Record<string, EmitterGraduationClearancePlan>>)[entryId];
}

function persistedPlan(plan: EmitterGraduationClearancePlan): Readonly<Record<string, unknown>> {
  return Object.freeze(Object.fromEntries(Object.entries(plan).filter(([key]) => ![
    "payloadPointers",
    "captureEmittedPayload",
    "requireNonEmptyCollection",
    "deferredSubject",
  ].includes(key))));
}

function assertTemplatePlan(entryId: string, clearance: GraduationClearance): EmitterGraduationClearancePlan | undefined {
  const plan = templatePlan(entryId);
  if (plan === undefined) return undefined;
  const expected = persistedPlan(plan);
  const allowed = new Set([
    ...Object.keys(expected),
    ...(plan.kind === "content_declared" ? ["declaration"] : []),
    ...(plan.captureEmittedPayload === true ? ["emittedPayloadDigest"] : []),
  ]);
  for (const [key, value] of Object.entries(expected)) {
    if (!(key in clearance) || canonicalizeJson((clearance as unknown as Record<string, unknown>)[key]) !== canonicalizeJson(value)) {
      throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", `${entryId} clearance does not match registered plan field ${key}`);
    }
  }
  for (const key of Object.keys(clearance)) {
    if (!allowed.has(key)) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", `${entryId} clearance adds unregistered plan field ${key}`);
  }
  if (plan.captureEmittedPayload === true && !/^sha256:[0-9a-f]{64}$/u.test(clearance.emittedPayloadDigest ?? "")) {
    throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", `${entryId} requires emittedPayloadDigest`);
  }
  return plan;
}

export function graduationContentDeclarationPayload(pack: DrillPackDefinition, entryId: string): Readonly<Record<string, unknown>> {
  const plan = templatePlan(entryId);
  if (plan?.kind !== "content_declared" || plan.templateId !== entryId || plan.payloadPointers === undefined) {
    throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", `${entryId} is not a content-declared emitter template`);
  }
  return Object.freeze({
    schema: "tabiya.graduation.content-declaration-payload.v1",
    packId: pack.id,
    entryId,
    templateId: plan.templateId,
    payload: Object.freeze(plan.payloadPointers.map((pointer) => {
      const value = resolvePointer(pack, pointer);
      return Object.freeze({ pointer, value: value.found ? value.value : null });
    })),
  });
}

function declarationMaterial(pack: DrillPackDefinition, entryId: string, declaredAt: string): Readonly<Record<string, unknown>> {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(declaredAt) || new Date(declaredAt).toISOString() !== declaredAt) {
    throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", "content declaration declaredAt must be an RFC 3339 UTC date-time");
  }
  return Object.freeze({
    schema: "tabiya.graduation.content-declaration.v1",
    declaredAt,
    payload: graduationContentDeclarationPayload(pack, entryId),
  });
}

export function createGraduationContentDeclaration(pack: DrillPackDefinition, entryId: string, declaredAt: string): NonNullable<GraduationClearance["declaration"]> {
  return Object.freeze({
    authority: "repository_content_declaration",
    declaredAt,
    declarationDigest: digestCanonicalSync(declarationMaterial(pack, entryId, declaredAt)),
  });
}

export function emittedGraduationPayloadDigest(pack: DrillPackDefinition, entryId: string): `sha256:${string}` {
  const plan = templatePlan(entryId);
  if (plan?.captureEmittedPayload !== true) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", `${entryId} has no emitted payload capture`);
  return digestCanonicalSync(graduationContentDeclarationPayload(pack, entryId));
}

export function emitterGraduationClearance(pack: DrillPackDefinition, entryId: string): GraduationClearance {
  const plan = templatePlan(entryId);
  if (plan === undefined) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", `unknown emitter clearance plan ${entryId}`);
  return Object.freeze({
    ...persistedPlan(plan),
    ...(plan.captureEmittedPayload === true ? { emittedPayloadDigest: emittedGraduationPayloadDigest(pack, entryId) } : {}),
  }) as GraduationClearance;
}

function contentDeclarationPrecondition(pack: DrillPackDefinition, entryId: string, clearance: GraduationClearance, plan: EmitterGraduationClearancePlan): boolean {
  const payload = graduationContentDeclarationPayload(pack, entryId).payload as readonly { readonly value: unknown }[];
  if (plan.requireNonEmptyCollection === true && !payload.some(({ value }) => Array.isArray(value) && value.length > 0)) return false;
  if (entryId === "mechanical-objective-placeholder") {
    const summary = resolvePointer(pack, "/objective/summary");
    return summary.found && typeof summary.value === "string" && summary.value.trim() !== ""
      && clearance.emittedPayloadDigest !== emittedGraduationPayloadDigest(pack, entryId);
  }
  if (entryId === "target-elo-authored") return Number.isInteger(resolvePointer(pack, "/opponentPolicy/targetElo").value);
  if (entryId === "opponent-policy-authored") {
    const value = resolvePointer(pack, "/opponentPolicy").value;
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  if (entryId === "mechanical-objective-needs-grounding") {
    const value = resolvePointer(pack, "/objective").value;
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  return true;
}

export function evaluateGraduationClearance(pack: DrillPackDefinition, packDigest: string, ledger: EvidenceLedger, manifest: SourceManifest, entryId: string, clearance: GraduationClearance, census: ReturnType<typeof runExpressionCensus>): PredicateResult | undefined {
  if (!MECHANICAL_KINDS.has(clearance.kind)) return undefined;
  const plan = assertTemplatePlan(entryId, clearance);
  switch (clearance.kind) {
    case "assessment_grounded": {
      const grounding = assessmentGrounding({ document: pack, documentDigest: packDigest, ledger, manifest });
      const relevant = ledger.records.filter((record) => record.kind === "tablebase_result" || record.kind === "engine_eval").length;
      return { holds: grounding === "ledger_verified", evidence: `assessmentGrounding = ${grounding}; ${relevant} assessment records` };
    }
    case "ledger_record": {
      if (clearance.subject === undefined) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", "ledger_record requires subject");
      if (clearance.recordKind === undefined) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", "ledger_record requires recordKind");
      const subject = clearance.subject;
      const recordKind = clearance.recordKind;
      const count = ledger.records.filter((record) => record.kind === recordKind && record.supports.includes(subject)).length;
      return { holds: count > 0, evidence: `${count} ${recordKind} records support ${subject}` };
    }
    case "claim_bound": {
      if (clearance.subject === undefined) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", "claim_bound requires subject");
      const issues: SourcingIssue[] = [];
      const bindings = validateClaimBindings(pack, ledger, issues);
      const holds = issues.length === 0 && bindings.some((binding) => binding.pointer === clearance.subject);
      return { holds, evidence: `${holds ? 1 : 0} valid claim binding resolves ${clearance.subject}; ${issues.length} issues` };
    }
    case "shape_firing": {
      const holds = shapePredicate(pack, clearance, census);
      return { holds, evidence: `${clearance.subject} ${holds ? "fires" : "does not fire"} in ${pack.id}` };
    }
    case "pointer_authored": {
      if (clearance.subject === undefined) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", "pointer_authored requires subject");
      if (clearance.placeholder === undefined) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", "pointer_authored requires placeholder");
      const pointer = resolvePointer(pack, clearance.subject);
      if (!pointer.found || typeof pointer.value !== "string") throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", `${clearance.subject} must resolve to a string`);
      const holds = pointer.value !== clearance.placeholder;
      return { holds, evidence: `${clearance.subject} ${holds ? "differs from" : "matches"} the declared placeholder` };
    }
    case "pointer_equals": {
      if (clearance.subject === undefined || !("expected" in clearance)) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", "pointer_equals requires subject and expected");
      const pointer = resolvePointer(pack, clearance.subject);
      const holds = pointer.found && canonicalizeJson(pointer.value) === canonicalizeJson(clearance.expected);
      return { holds, evidence: `${clearance.subject} ${holds ? "equals" : "does not equal"} the registered expected value` };
    }
    case "objective_graded": {
      const objective = resolvePointer(pack, clearance.subject ?? "");
      const value = objective.value as DrillPackDefinition["objective"] | undefined;
      const holds = objective.found && value !== undefined && ["win", "hold", "save", "resist"].includes(value.type)
        && value.grading !== undefined && objectiveRules(pack, value).length > 0;
      return { holds, evidence: `${clearance.subject ?? "(missing subject)"} ${holds ? "has" : "does not have"} compiled outcome grading` };
    }
    case "content_declared": {
      if (plan?.kind !== "content_declared" || !contentDeclarationPrecondition(pack, entryId, clearance, plan)) {
        return { holds: false, evidence: `${entryId} content precondition does not hold` };
      }
      const declaration = clearance.declaration;
      if (declaration === undefined || declaration.authority !== "repository_content_declaration") {
        return { holds: false, evidence: `${entryId} has no repository content declaration` };
      }
      const expected = digestCanonicalSync(declarationMaterial(pack, entryId, declaration.declaredAt));
      const holds = declaration.declarationDigest === expected;
      return { holds, evidence: `${entryId} declaration ${holds ? "matches" : "does not match"} current content` };
    }
  }
}

async function atomicWrite(documents: readonly { path: string; value: unknown; pretty?: boolean }[]): Promise<void> {
  const temporary = documents.map(({ path }) => `${path}.tmp-${process.pid}`);
  try {
    for (const [index, document] of documents.entries()) {
      if (document.pretty) await writeFile(temporary[index]!, `${JSON.stringify(document.value, null, 2)}\n`, "utf8");
      else await writeCanonicalJson(temporary[index]!, document.value);
    }
    for (const [index, document] of documents.entries()) await rename(temporary[index]!, document.path);
  } finally {
    await Promise.all(temporary.map((file) => rm(file, { force: true })));
  }
}

export async function clearGraduationEntries(file: string, options: { readonly now?: () => Date; readonly census?: ReturnType<typeof runExpressionCensus>; readonly check?: boolean } = {}): Promise<GraduationTransitionResult> {
  const target = paths(file);
  const [packValue, ledgerValue, manifestValue] = await Promise.all([readJson(target.pack), readJson(target.ledger), readJson(target.manifest)]);
  const pack = packValue as DrillPackDefinition;
  const ledger = ledgerValue as EvidenceLedger;
  const manifest = manifestValue as SourceManifest;
  const before = await digestDrillPack(pack);
  const census = options.census ?? runExpressionCensus({ roots: [dirname(target.pack)] });
  const entries = (pack.provenance.graduationBlockers ?? []) as readonly unknown[];
  const at = (options.now ?? (() => new Date()))().toISOString();
  const transitions: GraduationTransitionResult["transitions"][number][] = [];
  const held: GraduationTransitionResult["held"][number][] = [];
  const nextEntries = entries.map((entry): unknown => {
    if (typeof entry !== "object" || entry === null || (entry as { state?: unknown }).state !== "blocking") return entry;
    const blocking = entry as BlockingEntry;
    const clearance = blocking.clearance;
    if (clearance === undefined) {
      held.push({ id: blocking.id, kind: "unspecified", verdict: "no predicate" });
      return entry;
    }
    const result = evaluateGraduationClearance(pack, before, ledger, manifest, blocking.id, clearance, census);
    if (result === undefined) {
      held.push({ id: blocking.id, kind: clearance.kind, ...(clearance.recordKind === undefined ? {} : { recordKind: clearance.recordKind }), verdict: "no predicate" });
      return entry;
    }
    if (!result.holds) {
      held.push({ id: blocking.id, kind: clearance.kind, ...(clearance.recordKind === undefined ? {} : { recordKind: clearance.recordKind }), verdict: "does not hold" });
      return entry;
    }
    if (!FIRST_RUN_EXEMPTIONS.has(`${pack.id}/${blocking.id}`) || clearance.kind !== "assessment_grounded") {
      throw new GraduationClearanceError("GRADUATION_CLEARANCE_VACUOUS", `${pack.id}/${blocking.id} already satisfies ${clearance.kind}`);
    }
    transitions.push({ id: blocking.id, from: "blocking", to: "resolved", clearance, evidence: result.evidence });
    return { id: blocking.id, state: "resolved", statement: blocking.statement, resolved: { at, clearance, by: result.evidence } };
  });
  const nextPack = { ...pack, provenance: { ...pack.provenance, graduationBlockers: nextEntries } };
  const after = await digestDrillPack(nextPack);
  const nextLedger = { ...ledger, packDigest: after };
  const transition: GraduationTransitionResult = Object.freeze({ schema: "tabiya.graduation.transition.v1", packId: pack.id, at, packDigestBefore: before, packDigestAfter: after, transitions: Object.freeze(transitions), held: Object.freeze(held) });
  if (options.check !== true) await atomicWrite([
    { path: target.pack, value: nextPack, pretty: true },
    { path: target.ledger, value: nextLedger },
    { path: target.transition, value: transition },
  ]);
  return transition;
}

if (/graduation-clear\.(?:js|ts)$/u.test(process.argv[1] ?? "")) {
  const file = process.argv[2];
  if (file === undefined) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", "pack file is required");
  const result = await clearGraduationEntries(file, { check: process.env.CHECK === "1" });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
