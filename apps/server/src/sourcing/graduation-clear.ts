import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";

import { digestDrillPack, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";

import { runExpressionCensus } from "../expression-census.js";
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
]);

export interface GraduationClearance {
  readonly kind: "assessment_grounded" | "ledger_record" | "claim_bound" | "shape_firing" | "pointer_authored" | "unbuilt" | "unreachable" | "referent_removed";
  readonly subject: string;
  readonly recordKind?: EvidenceRecord["kind"];
  readonly instrument?: string;
  readonly blockedBy?: string;
  readonly placeholder?: string;
  readonly absentIds?: readonly string[];
}

interface BlockingEntry {
  readonly id: string;
  readonly state: "blocking";
  readonly statement: string;
  readonly clearance?: GraduationClearance;
}

interface PredicateResult {
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

function evaluate(pack: DrillPackDefinition, ledger: EvidenceLedger, manifest: SourceManifest, clearance: GraduationClearance, census: ReturnType<typeof runExpressionCensus>): PredicateResult | undefined {
  if (!MECHANICAL_KINDS.has(clearance.kind)) return undefined;
  switch (clearance.kind) {
    case "assessment_grounded": {
      const grounding = assessmentGrounding({ document: pack, ledger, manifest });
      const relevant = ledger.records.filter((record) => record.kind === "tablebase_result" || record.kind === "engine_eval").length;
      return { holds: grounding === "ledger_verified", evidence: `assessmentGrounding = ${grounding}; ${relevant} assessment records` };
    }
    case "ledger_record": {
      if (clearance.recordKind === undefined) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", "ledger_record requires recordKind");
      const count = ledger.records.filter((record) => record.kind === clearance.recordKind && record.supports.includes(clearance.subject)).length;
      return { holds: count > 0, evidence: `${count} ${clearance.recordKind} records support ${clearance.subject}` };
    }
    case "claim_bound": {
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
      if (clearance.placeholder === undefined) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", "pointer_authored requires placeholder");
      const pointer = resolvePointer(pack, clearance.subject);
      if (!pointer.found || typeof pointer.value !== "string") throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", `${clearance.subject} must resolve to a string`);
      const holds = pointer.value !== clearance.placeholder;
      return { holds, evidence: `${clearance.subject} ${holds ? "differs from" : "matches"} the declared placeholder` };
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
    const result = evaluate(pack, ledger, manifest, clearance, census);
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
