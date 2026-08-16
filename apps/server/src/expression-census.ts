import { readFileSync, readdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

import type { DrillPackDefinition, StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { matchesStructuralExpression } from "@chess-tabiya/runtime";

import { authoredSpineFens } from "./pack-validation.js";
import {
  expandStructuralExpression,
  planSignatureResolver,
  type PlanSignatureResolver,
} from "./pack-orchestrator.js";
import {
  DEGENERATE_POSITIONS,
  expressionSatisfiability,
  type ExpressionWitness,
} from "./expression-satisfiability.js";
import type { EvidenceLedger, EvidenceRecord } from "./sourcing/types.js";

export type CensusSubjectKind = "shape_trigger" | "shape_plan_signature" | "pack_success_condition" | "pack_fen_predicate" | "pack_window_closing" | "pack_key_point_ground" | "bare_expression";
export interface CensusSubject {
  readonly file: string;
  readonly pointer: string;
  readonly kind: CensusSubjectKind;
  readonly expression: StructuralExpression;
  readonly packId?: string;
  readonly shapeId?: string;
  readonly planId?: string;
  readonly trigger?: StructuralExpression;
}
interface CorpusPosition { readonly packId: string; readonly file: string; readonly ply: number; readonly fen: string }

const EVIDENCE_RUNG: Readonly<Record<string, number>> = Object.freeze({
  derived_feature: 0,
  tablebase_exact: 1,
  engine_validated: 2,
  human_model_predicted: 3,
  corpus_observed: 4,
  author_principle: 5,
  hypothesis: 5,
});
const LEDGER_KIND: Readonly<Record<string, readonly EvidenceRecord["kind"][]>> = Object.freeze({
  tablebase_exact: ["tablebase_result"],
  engine_validated: ["engine_eval"],
  corpus_observed: ["explorer_frequency", "explorer_position_census"],
});

function absolutePly(fen: string): number {
  const fields = fen.split(" ");
  return (Number(fields[5] ?? "1") - 1) * 2 + (fields[1] === "b" ? 1 : 0);
}

function filesUnder(path: string): readonly string[] {
  try {
    const entries = readdirSync(path, { withFileTypes: true });
    return entries.flatMap((entry) => entry.isDirectory() ? filesUnder(resolve(path, entry.name)) : [resolve(path, entry.name)]).sort();
  } catch { return []; }
}

function packFiles(roots: readonly string[]): readonly string[] {
  return roots.flatMap(filesUnder).filter((file) => file.endsWith(".json") && !/\.(?:evidence|job|sources)\.json$/u.test(file));
}

function displayPath(file: string): string {
  const path = relative(process.cwd(), file);
  return path.startsWith("..") ? file : path;
}

function readJson(file: string): any { return JSON.parse(readFileSync(file, "utf8")); }

function evidenceLedgerPath(packFile: string): string {
  return packFile.endsWith("/pack.json") ? resolve(packFile, "../evidence.json") : packFile.replace(/\.json$/u, ".evidence.json");
}

function evidenceLedger(packFile: string): EvidenceLedger | undefined {
  try {
    const value = readJson(evidenceLedgerPath(packFile));
    return value?.schema === "tabiya.sourcing.evidence.v1" && Array.isArray(value.records) ? value as EvidenceLedger : undefined;
  } catch { return undefined; }
}

function populationOf(record: EvidenceRecord): Record<string, unknown> | undefined {
  if (record.kind !== "explorer_frequency" && record.kind !== "explorer_position_census") return undefined;
  const { ratings, speeds, since, until, total } = record.values;
  if (!Array.isArray(ratings) || !Array.isArray(speeds) || typeof since !== "string" || typeof until !== "string" || !Number.isSafeInteger(total)) return undefined;
  return { ratings, speeds, since, until, total };
}

export function evidenceCensus(packDocuments: ReadonlyMap<string, DrillPackDefinition>) {
  const packs = [...packDocuments].flatMap(([absolute, pack]) => {
    const claims = pack.feedbackClaims ?? [];
    if (claims.length === 0) return [];
    const ledger = evidenceLedger(absolute);
    const citations = [...new Set(claims.flatMap((claim) => claim.evidenceTypes))].sort().map((evidenceType) => {
      const claimIndexes = claims.flatMap((claim, index) => claim.evidenceTypes.includes(evidenceType) ? [index] : []);
      const ledgerKinds = LEDGER_KIND[evidenceType];
      const bindings = claimIndexes.flatMap((index) => ledger?.claimBindings?.filter((binding) => binding.pointer === `/feedbackClaims/${index}/text`) ?? []);
      const assertionFamilies = new Set(bindings.flatMap((binding) => binding.spans.flatMap((span) => "assertion" in span ? [span.assertion.kind.split(".")[0]] : [])));
      const matching = ledgerKinds === undefined ? [] : ledger?.records.filter((record) => ledgerKinds.includes(record.kind) && assertionFamilies.has(record.kind === "tablebase_result" ? "tablebase" : record.kind === "engine_eval" ? "engine" : "explorer")) ?? [];
      const backedClaims = ledgerKinds === undefined ? 0 : claimIndexes.filter((index) => (ledger?.claimBindings ?? []).some((binding) => binding.pointer === `/feedbackClaims/${index}/text` && binding.spans.some((span) => "assertion" in span && ledgerKinds.includes(span.assertion.kind.startsWith("tablebase.") ? "tablebase_result" : span.assertion.kind.startsWith("engine.") ? "engine_eval" : "explorer_position_census")))).length;
      const populations = matching.flatMap((record) => {
        const population = populationOf(record);
        return population === undefined ? [] : [canonicalizeJson(population)];
      });
      return {
        evidenceType,
        rung: EVIDENCE_RUNG[evidenceType] ?? null,
        claims: claimIndexes.length,
        backing: ledgerKinds === undefined
          ? { kind: evidenceType === "derived_feature" ? "derived" : evidenceType === "author_principle" || evidenceType === "hypothesis" ? "authored" : "unregistered", backedClaims: 0, records: 0 }
          : { kind: "ledger", backedClaims, records: matching.length },
        populations: [...new Set(populations)].sort().map((value) => JSON.parse(value)),
      };
    });
    return [{ packId: pack.id, file: displayPath(absolute), claims: claims.length, citations }];
  }).sort((left, right) => left.file.localeCompare(right.file));
  const citations = packs.flatMap((pack) => pack.citations);
  const rungs = [...new Set(citations.map((citation) => citation.rung))].sort((a, b) => (a ?? 99) - (b ?? 99)).map((rung) => ({
    rung,
    claims: citations.filter((citation) => citation.rung === rung).reduce((sum, citation) => sum + citation.claims, 0),
    backedClaims: citations.filter((citation) => citation.rung === rung).reduce((sum, citation) => sum + citation.backing.backedClaims, 0),
  }));
  return Object.freeze({
    packs: Object.freeze(packs),
    totals: {
      packs: packs.length,
      claims: packs.reduce((sum, pack) => sum + pack.claims, 0),
      backedClaims: citations.reduce((sum, citation) => sum + citation.backing.backedClaims, 0),
      populations: citations.reduce((sum, citation) => sum + citation.populations.length, 0),
      byRung: rungs,
    },
  });
}

function censusExpression(
  expression: StructuralExpression,
  pointer: string,
  resolvePlanSignature: PlanSignatureResolver,
): StructuralExpression {
  try {
    return expandStructuralExpression(
      expression,
      pointer,
      resolvePlanSignature,
    ).value;
  } catch {
    // Invalid or unresolved references remain visible as evaluation faults. The
    // census reports bad authoring; it does not turn it into a process crash.
    return expression;
  }
}

function packSubjects(
  pack: DrillPackDefinition,
  file: string,
  resolvePlanSignature: PlanSignatureResolver,
): readonly CensusSubject[] {
  const result: CensusSubject[] = [];
  const visit = (value: unknown, pointer: string): void => {
    if (value === null || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach((child, index) => visit(child, `${pointer}/${index}`)); return; }
    const object = value as Record<string, any>;
    if (object.kind === "structural_feature" && object.feature !== undefined) {
      const subjectPointer = `${pointer}/feature`;
      result.push({ file, pointer: subjectPointer, kind: "pack_success_condition", expression: censusExpression(object.feature, subjectPointer, resolvePlanSignature), packId: pack.id });
      return;
    }
    if (object.type === "structuralFeature" && object.feature !== undefined) {
      const subjectPointer = `${pointer}/feature`;
      result.push({ file, pointer: subjectPointer, kind: "pack_fen_predicate", expression: censusExpression(object.feature, subjectPointer, resolvePlanSignature), packId: pack.id });
      return;
    }
    if (object.kind === "position" && object.feature !== undefined && pointer.includes("/timingWindows/")) {
      const subjectPointer = `${pointer}/feature`;
      result.push({ file, pointer: subjectPointer, kind: "pack_window_closing", expression: censusExpression(object.feature, subjectPointer, resolvePlanSignature), packId: pack.id });
      return;
    }
    if (object.kind === "structural" && object.expression !== undefined && pointer.includes("/keyPoints/")) {
      const subjectPointer = `${pointer}/expression`;
      result.push({ file, pointer: subjectPointer, kind: "pack_key_point_ground", expression: censusExpression(object.expression, subjectPointer, resolvePlanSignature), packId: pack.id });
      return;
    }
    for (const [key, child] of Object.entries(object)) visit(child, `${pointer}/${key.replaceAll("~", "~0").replaceAll("/", "~1")}`);
  };
  visit(pack, "");
  return Object.freeze(result);
}

function shapeSubjects(entry: ShapeEntryDefinition, file: string): readonly CensusSubject[] {
  return Object.freeze([
    { file, pointer: "/trigger", kind: "shape_trigger", expression: entry.trigger, shapeId: entry.id, trigger: entry.trigger },
    ...entry.plans.flatMap((plan, index) => plan.success.signature === null ? [] : [{
      file, pointer: `/plans/${index}/success/signature`, kind: "shape_plan_signature" as const,
      expression: plan.success.signature, shapeId: entry.id, planId: plan.id, trigger: entry.trigger,
    }]),
  ]);
}

function evaluate(expression: StructuralExpression, positions: readonly CorpusPosition[]) {
  const firing: CorpusPosition[] = [];
  const faults: string[] = [];
  for (const position of positions) {
    try { if (matchesStructuralExpression(position.fen, expression)) firing.push(position); }
    catch (error) { faults.push(error instanceof Error ? error.message : String(error)); }
  }
  return { firing, faults };
}

function coverageRecord(subject: CensusSubject, positions: readonly CorpusPosition[]) {
  const corpus = evaluate(subject.expression, positions);
  const packPositions = subject.packId === undefined ? undefined : positions.filter((position) => position.packId === subject.packId);
  const own = packPositions === undefined ? undefined : evaluate(subject.expression, packPositions);
  const inShapePositions = subject.trigger === undefined ? undefined : positions.filter((position) => {
    try { return matchesStructuralExpression(position.fen, subject.trigger!); } catch { return false; }
  });
  const inShape = inShapePositions === undefined ? undefined : evaluate(subject.expression, inShapePositions);
  const packs = [...new Set(corpus.firing.map((value) => value.packId))].sort().map((id) => ({ id, count: corpus.firing.filter((value) => value.packId === id).length }));
  return {
    corpus: {
      fires: corpus.firing.length, of: positions.length - corpus.faults.length, packs,
      plies: [...new Set(corpus.firing.map((value) => value.ply))].sort((a, b) => a - b),
      samples: corpus.firing.slice(0, 3).map(({ packId, ply, fen }) => ({ packId, ply, fen })),
      ...(corpus.faults.length === 0 ? {} : { faults: { count: corpus.faults.length, first: corpus.faults[0] } }),
    },
    ...(own === undefined ? {} : { inPack: { fires: own.firing.length, of: packPositions!.length - own.faults.length } }),
    ...(inShape === undefined ? {} : { inShape: { basis: { kind: "shape_trigger", shape: subject.shapeId }, fires: inShape.firing.length, of: inShapePositions!.length - inShape.faults.length } }),
    firingFens: corpus.firing.map((value) => value.fen),
  };
}

function observations(coverage: ReturnType<typeof coverageRecord>, satisfiability: ReturnType<typeof expressionSatisfiability>, degenerate: readonly string[]): readonly string[] {
  const result: string[] = [];
  if (satisfiability.verdict === "unsatisfiable") result.push("UNSATISFIABLE");
  if (coverage.corpus.fires === 0 && coverage.corpus.faults === undefined) result.push("NEVER_FIRES_IN_CORPUS");
  if (coverage.inShape?.of === 0) result.push("IN_SHAPE_DENOMINATOR_EMPTY");
  else if (coverage.inShape !== undefined && coverage.inShape.fires === 0) {
    result.push("NEVER_FIRES_IN_SHAPE");
    if (coverage.corpus.fires > 0) result.push("FIRES_ONLY_OUTSIDE_SHAPE");
  }
  if (coverage.corpus.fires > coverage.corpus.of / 2) result.push("FIRES_ON_MAJORITY");
  if (degenerate.length > 0) result.push("FIRES_ON_DEGENERATE");
  if (satisfiability.verdict === "unknown") result.push("SATISFIABILITY_UNKNOWN");
  if (coverage.corpus.faults !== undefined) result.push("EVALUATION_FAULT");
  return Object.freeze(result);
}

export interface CensusOptions {
  readonly roots?: readonly string[];
  readonly shapeRoot?: string;
  readonly files?: readonly string[];
  readonly expression?: StructuralExpression;
  readonly witnesses?: Readonly<Record<string, readonly ExpressionWitness[]>>;
  readonly degenerates?: boolean;
}

export function runExpressionCensus(options: CensusOptions = {}): any {
  const roots = (options.roots ?? ["content/drafts", "content/packs"]).map((path) => resolve(path));
  const discoveredPackFiles = packFiles(roots);
  const positions: CorpusPosition[] = [];
  const packsWithoutSpine: string[] = [];
  const fixturePacks: string[] = [];
  const packDocuments = new Map<string, DrillPackDefinition>();
  for (const absolute of discoveredPackFiles) {
    const pack = readJson(absolute) as DrillPackDefinition;
    if (typeof pack.id !== "string" || typeof pack.mode !== "string") continue;
    packDocuments.set(absolute, pack);
    const fens = authoredSpineFens(pack);
    if (!Object.hasOwn(pack, "spine")) packsWithoutSpine.push(pack.id);
    if (absolute.endsWith(".browser.json")) fixturePacks.push(pack.id);
    const rootPly = absolutePly(fens[0]!);
    fens.forEach((fen) => positions.push({ packId: pack.id, file: displayPath(absolute), ply: absolutePly(fen) - rootPly, fen }));
  }
  const shapeFiles = filesUnder(resolve(options.shapeRoot ?? "content/shapes")).filter((file) => file.endsWith(".json"));
  const shapeRecords = new Map<string, { readonly document: ShapeEntryDefinition }>();
  for (const absolute of shapeFiles) {
    const document = readJson(absolute) as ShapeEntryDefinition;
    shapeRecords.set(document.id, { document });
  }
  let subjects: CensusSubject[] = [];
  for (const [absolute, pack] of packDocuments) {
    subjects.push(...packSubjects(
      pack,
      displayPath(absolute),
      planSignatureResolver(pack, shapeRecords),
    ));
  }
  for (const absolute of shapeFiles) {
    const entry = shapeRecords.get((readJson(absolute) as ShapeEntryDefinition).id)!.document;
    subjects.push(...shapeSubjects(entry, displayPath(absolute)));
  }
  if (options.files !== undefined) {
    const selected = new Set(options.files.map((file) => displayPath(resolve(file))));
    subjects = subjects.filter((subject) => selected.has(subject.file));
  }
  if (options.expression !== undefined) subjects = [{ file: "<expression>", pointer: "/", kind: "bare_expression", expression: options.expression }];
  subjects.sort((left, right) => left.file.localeCompare(right.file) || left.pointer.localeCompare(right.pointer));
  const records = subjects.map((subject) => {
    const coverage = coverageRecord(subject, positions);
    const key = `${subject.file}#${subject.pointer}`;
    const satisfiability = expressionSatisfiability(subject.expression, coverage.firingFens, options.witnesses?.[key] ?? []);
    const degenerate = options.degenerates === false ? [] : DEGENERATE_POSITIONS.filter((position) => {
      try { return matchesStructuralExpression(position.fen, subject.expression); } catch { return false; }
    }).map((position) => position.id);
    const { firingFens: _, ...publicCoverage } = coverage;
    return {
      site: { file: subject.file, pointer: subject.pointer, subject: { kind: subject.kind, ...(subject.shapeId === undefined ? {} : { shape: subject.shapeId }), ...(subject.planId === undefined ? {} : { plan: subject.planId }), ...(subject.packId === undefined ? {} : { pack: subject.packId }) } },
      coverage: publicCoverage, satisfiability, degenerate, observations: observations(coverage, satisfiability, degenerate),
    };
  });
  const count = (label: string) => records.filter((record) => record.observations.includes(label)).length;
  return Object.freeze({
    schema: "tabiya.authoring.census.v1",
    corpus: { roots: roots.map(displayPath), packs: packDocuments.size, fixturePacks: fixturePacks.sort(), positions: positions.length, transitions: positions.length - packDocuments.size, packsWithoutSpine: packsWithoutSpine.sort(), shapeEntries: shapeFiles.length },
    evidence: evidenceCensus(packDocuments),
    subjects: Object.freeze(records),
    totals: { subjects: records.length, neverFiresInCorpus: count("NEVER_FIRES_IN_CORPUS"), firesOnlyOutsideShape: count("FIRES_ONLY_OUTSIDE_SHAPE"), inShapeDenominatorEmpty: count("IN_SHAPE_DENOMINATOR_EMPTY"), unsatisfiable: count("UNSATISFIABLE"), satisfiabilityUnknown: count("SATISFIABILITY_UNKNOWN") },
  });
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

async function main(): Promise<number> {
  try {
    const witnessPath = option("--witnesses") ?? resolve("content/witnesses/expression-witnesses.json");
    const witnesses = JSON.parse(await readFile(witnessPath, "utf8")) as Record<string, readonly ExpressionWitness[]>;
    const expressionPath = option("--expr");
    const selectedFiles = option("--file")?.split(",").filter(Boolean);
    const selectedExpression = expressionPath === undefined ? undefined : JSON.parse(await readFile(expressionPath, "utf8"));
    const report = runExpressionCensus({
      roots: (option("--corpus") ?? "content/drafts,content/packs").split(",").filter(Boolean),
      ...(selectedFiles === undefined ? {} : { files: selectedFiles }),
      ...(selectedExpression === undefined ? {} : { expression: selectedExpression }),
      witnesses,
      degenerates: option("--degenerate") !== "0",
    });
    const output = `${canonicalizeJson(report)}\n`;
    const out = option("--out");
    if (out === undefined) process.stdout.write(output); else await writeFile(out, output, "utf8");
    const witnessFault = report.subjects.some((subject: any) => subject.satisfiability.witnesses?.some((value: any) => value.error !== undefined));
    return report.totals.unsatisfiable > 0 || witnessFault ? 1 : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 2;
  }
}

if (process.argv[1]?.endsWith("expression-census.js")) process.exitCode = await main();
