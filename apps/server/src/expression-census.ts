import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { DrillPackDefinition, StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { matchesStructuralExpression } from "@chess-tabiya/runtime";
import { authoredStructuralSites, maybeAuthoredStructuralDocument, readAuthoredStructuralConditionSource, selectAuthoredStructuralCondition, type AuthoredStructuralConditionSource, type AuthoredStructuralDocument } from "../../../packages/runtime/src/internal/authored-structural-source.js";
import { matchesCurrentStructuralExpression, preflightCurrentAuthoredOperation } from "../../../packages/runtime/src/structural-evidence.js";

import { authoredSpineFens, validatePackDocument } from "./pack-validation.js";
import { validateShapeEntry } from "./shape-validation.js";
import { authoredPackFiles as packFiles, authoredFilePath as censusFilePath, loadAuthoredShapeFiles } from "./authored-document-files.js";
export { censusFilePath };
import {
  DEGENERATE_POSITIONS,
  expressionSatisfiability,
  authoredExpressionSatisfiability,
  type ExpressionWitness,
} from "./expression-satisfiability.js";
import type { EvidenceLedger, EvidenceRecord, SourcingIssue } from "./sourcing/types.js";
import { MACHINE_LABEL_EVIDENCE_KINDS, validateClaimBindings } from "./sourcing/claim-binding.js";
import { validateLedger } from "./sourcing/ledger-validation.js";
import { runDeclarationCensus } from "./declaration-census.js";

export type CensusSubjectKind = "shape_trigger" | "shape_plan_signature" | "pack_success_condition" | "pack_fen_predicate" | "pack_window_closing" | "pack_key_point_ground" | "pack_plan_consequence" | "pack_transition_position" | "document_error" | "bare_expression";
type EvaluationTarget =
  | { readonly kind: "authored"; readonly source: AuthoredStructuralConditionSource }
  | { readonly kind: "bare_expression"; readonly expression: StructuralExpression }
  | { readonly kind: "unavailable"; readonly error: string };
export interface CensusSubject {
  readonly file: string;
  readonly pointer: string;
  readonly kind: CensusSubjectKind;
  readonly target: EvaluationTarget;
  readonly packId?: string;
  readonly shapeId?: string;
  readonly planId?: string;
  readonly trigger?: EvaluationTarget;
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
function absolutePly(fen: string): number {
  const fields = fen.split(" ");
  return (Number(fields[5] ?? "1") - 1) * 2 + (fields[1] === "b" ? 1 : 0);
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
  const validatedClaimKeys = new Set<string>();
  const packs = [...packDocuments].flatMap(([absolute, pack]) => {
    const claims = pack.feedbackClaims ?? [];
    if (claims.length === 0) return [];
    const ledger = evidenceLedger(absolute);
    const validationIssues: SourcingIssue[] = [];
    const validatedLedger = ledger === undefined ? undefined : validateLedger(ledger, validationIssues);
    const validBindings = validatedLedger === undefined ? [] : validateClaimBindings(pack, validatedLedger, validationIssues);
    for (const binding of validBindings) {
      const claim = claims.find((candidate) => candidate.id === binding.claimId);
      if (claim?.evidenceTypes.some((label) => (MACHINE_LABEL_EVIDENCE_KINDS[label] ?? []).some((kind) => binding.instrumentKinds.includes(kind)))) {
        validatedClaimKeys.add(`${pack.id}/${binding.claimId}`);
      }
    }
    const citations = [...new Set(claims.flatMap((claim) => claim.evidenceTypes))].sort().map((evidenceType) => {
      const claimIndexes = claims.flatMap((claim, index) => claim.evidenceTypes.includes(evidenceType) ? [index] : []);
      const ledgerKinds = MACHINE_LABEL_EVIDENCE_KINDS[evidenceType];
      const validPointers = new Set(validBindings.map((binding) => `${binding.claimId}\u0000${binding.pointer}`));
      const bindings = claimIndexes.flatMap((index) => ledger?.claimBindings?.filter((binding) => binding.pointer === `/feedbackClaims/${index}/text` && validPointers.has(`${binding.claimId}\u0000${binding.pointer}`)) ?? []);
      const assertionFamilies = new Set(bindings.flatMap((binding) => binding.spans.flatMap((span) => "assertion" in span ? [span.assertion.kind.split(".")[0]] : [])));
      const matching = ledgerKinds === undefined ? [] : validatedLedger?.records.filter((record) => ledgerKinds.includes(record.kind) && assertionFamilies.has(record.kind === "tablebase_result" ? "tablebase" : record.kind === "engine_eval" ? "engine" : "explorer")) ?? [];
      const backedClaims = ledgerKinds === undefined ? 0 : claimIndexes.filter((index) => validBindings.some((binding) => binding.pointer === `/feedbackClaims/${index}/text` && binding.instrumentKinds.some((kind) => ledgerKinds.includes(kind)))).length;
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
    return [{ packId: pack.id, file: censusFilePath(absolute), claims: claims.length, citations }];
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
      backedClaims: validatedClaimKeys.size,
      populations: citations.reduce((sum, citation) => sum + citation.populations.length, 0),
      byRung: rungs,
    },
  });
}

function unavailable(error: unknown): EvaluationTarget {
  return { kind: "unavailable", error: error instanceof Error ? error.message : String(error) };
}

function selectTarget(document: AuthoredStructuralDocument | undefined, pointer: string): EvaluationTarget {
  try {
    if (document === undefined) throw new TypeError("Document has no original authored structural source");
    return { kind: "authored", source: selectAuthoredStructuralCondition(document, pointer) };
  } catch (error) { return unavailable(error); }
}

/** Count typed use sites once; nested nodes belong to their containing expression's visitor. */
function rootSites(kind: "pack" | "shape", document: DrillPackDefinition | ShapeEntryDefinition): readonly string[] {
  const pointers = [...authoredStructuralSites(kind, document).keys()];
  return pointers.filter(pointer => !pointers.some(parent => parent !== pointer && pointer.startsWith(`${parent}/`)));
}

function packSubjectKind(pointer: string): CensusSubjectKind {
  if (/\/successConditions\/\d+$/u.test(pointer)) return "pack_plan_consequence";
  if (pointer.includes("/transition/") && pointer.endsWith("/expression")) return "pack_transition_position";
  if (pointer.includes("/timingWindows/") && pointer.includes("/closes/")) return "pack_window_closing";
  if (pointer.includes("/keyPoints/")) return "pack_key_point_ground";
  if (pointer.includes("/successConditions/")) return "pack_success_condition";
  return "pack_fen_predicate";
}

function packSubjects(pack: DrillPackDefinition, file: string): readonly CensusSubject[] {
  try {
    const document = maybeAuthoredStructuralDocument(pack);
    return rootSites("pack", pack).map(pointer => ({ file, pointer, kind: packSubjectKind(pointer), target: selectTarget(document, pointer), packId: pack.id }));
  } catch (error) { return [{ file, pointer: "/", kind: "document_error", target: unavailable(error), packId: pack.id }]; }
}

function shapeSubjects(entry: ShapeEntryDefinition, file: string): readonly CensusSubject[] {
  try {
    const document = maybeAuthoredStructuralDocument(entry), trigger = selectTarget(document, "/trigger");
    return rootSites("shape", entry).map(pointer => {
      const index = /^\/plans\/(\d+)\/success\/signature$/u.exec(pointer)?.[1];
      return { file, pointer, kind: pointer === "/trigger" ? "shape_trigger" : "shape_plan_signature",
        target: pointer === "/trigger" ? trigger : selectTarget(document, pointer), shapeId: entry.id,
        ...(index === undefined ? {} : { planId: entry.plans[Number(index)]!.id }), trigger };
    });
  } catch (error) { return [{ file, pointer: "/", kind: "document_error", target: unavailable(error), shapeId: entry.id }]; }
}

interface EvaluationRow { readonly position: CorpusPosition; readonly matched?: boolean; readonly error?: string }
interface Evaluation { readonly rows: readonly EvaluationRow[]; readonly globalFault?: string }
interface CensusEvaluation {
  readonly successful: WeakMap<AuthoredStructuralConditionSource, Map<string, boolean>>;
  readonly populations: Map<EvaluationTarget, Evaluation>;
}
function assertTargetCurrent(target: EvaluationTarget): void {
  if (target.kind === "unavailable") throw new TypeError(target.error);
  if (target.kind === "authored") {
    preflightCurrentAuthoredOperation("authoring");
    readAuthoredStructuralConditionSource(target.source);
  }
}
function matchesTarget(target: EvaluationTarget, fen: string, context: CensusEvaluation): boolean {
  assertTargetCurrent(target);
  if (target.kind === "unavailable") throw new TypeError(target.error);
  if (target.kind === "bare_expression") return matchesStructuralExpression(fen, target.expression);
  const cached = context.successful.get(target.source)?.get(fen);
  if (cached !== undefined) return cached;
  const matched = matchesCurrentStructuralExpression(fen, readAuthoredStructuralConditionSource(target.source).effectiveExpression, "authoring");
  // A genuine value from a source retired during evaluation cannot enter the cache/report.
  assertTargetCurrent(target);
  let values = context.successful.get(target.source);
  if (values === undefined) { values = new Map(); context.successful.set(target.source, values); }
  values.set(fen, matched);
  return matched;
}
function evaluate(target: EvaluationTarget, positions: readonly CorpusPosition[], context: CensusEvaluation): Evaluation {
  const existing = context.populations.get(target);
  if (existing !== undefined) return existing;
  let result: Evaluation;
  try {
    assertTargetCurrent(target);
    result = { rows: positions.map(position => {
      try { return { position, matched: matchesTarget(target, position.fen, context) }; }
      catch (error) { return { position, error: error instanceof Error ? error.message : String(error) }; }
    }) };
  } catch (error) { result = { rows: [], globalFault: error instanceof Error ? error.message : String(error) }; }
  context.populations.set(target, result);
  return result;
}
/** Project original occurrence rows; equal FENs never collapse report denominators or samples. */
function coverageOf(target: EvaluationTarget, evaluation: Evaluation, positions: readonly CorpusPosition[]) {
  const firing: CorpusPosition[] = [];
  let globalFault = evaluation.globalFault;
  try { assertTargetCurrent(target); }
  catch (error) { globalFault = error instanceof Error ? error.message : String(error); }
  if (globalFault !== undefined) return { firing, faults: [globalFault], excluded: positions.length };
  const included = new Set(positions), faults: string[] = [];
  for (const row of evaluation.rows) {
    if (!included.has(row.position)) continue;
    if (row.error !== undefined) faults.push(row.error);
    else if (row.matched === true) firing.push(row.position);
  }
  return { firing, faults, excluded: faults.length };
}
function coverageRecord(subject: CensusSubject, positions: readonly CorpusPosition[], context: CensusEvaluation) {
  const population = evaluate(subject.target, positions, context);
  const corpus = coverageOf(subject.target, population, positions);
  const packPositions = subject.packId === undefined ? undefined : positions.filter(position => position.packId === subject.packId);
  const own = packPositions === undefined ? undefined : coverageOf(subject.target, population, packPositions);
  const trigger = subject.trigger === undefined ? undefined : coverageOf(subject.trigger, evaluate(subject.trigger, positions, context), positions);
  const inShape = trigger === undefined ? undefined : coverageOf(subject.target, population, trigger.firing);
  const packs = [...new Set(corpus.firing.map(value => value.packId))].sort().map(id => ({ id, count: corpus.firing.filter(value => value.packId === id).length }));
  const fault = (errors: readonly string[]) => errors.length === 0 ? {} : { faults: { count: errors.length, first: errors[0] } };
  return {
    corpus: { fires: corpus.firing.length, of: positions.length-corpus.excluded, packs,
      plies: [...new Set(corpus.firing.map(value => value.ply))].sort((a,b) => a-b),
      samples: corpus.firing.slice(0,3).map(({ packId,ply,fen }) => ({ packId,ply,fen })), ...fault(corpus.faults) },
    ...(own === undefined ? {} : { inPack: { fires: own.firing.length, of: packPositions!.length-own.excluded, ...fault(own.faults) } }),
    ...(inShape === undefined ? {} : { inShape: { basis: { kind: "shape_trigger", shape: subject.shapeId }, fires: inShape.firing.length,
      of: trigger!.firing.length-inShape.excluded, ...fault([...trigger!.faults,...inShape.faults]) } }),
    firingFens: corpus.firing.map(value => value.fen),
  };
}

function observations(coverage: ReturnType<typeof coverageRecord>, satisfiability: ReturnType<typeof expressionSatisfiability>, degenerate: readonly string[]): readonly string[] {
  const result: string[] = [];
  if (satisfiability.verdict === "unsatisfiable") result.push("UNSATISFIABLE");
  if (coverage.corpus.fires === 0 && coverage.corpus.faults === undefined) result.push("NEVER_FIRES_IN_CORPUS");
  if (coverage.inShape?.faults === undefined && coverage.inShape?.of === 0) result.push("IN_SHAPE_DENOMINATOR_EMPTY");
  else if (coverage.inShape !== undefined && coverage.inShape.faults === undefined && coverage.inShape.fires === 0) {
    result.push("NEVER_FIRES_IN_SHAPE");
    if (coverage.corpus.fires > 0) result.push("FIRES_ONLY_OUTSIDE_SHAPE");
  }
  if (coverage.corpus.fires > coverage.corpus.of / 2) result.push("FIRES_ON_MAJORITY");
  if (degenerate.length > 0) result.push("FIRES_ON_DEGENERATE");
  if (satisfiability.verdict === "unknown") result.push("SATISFIABILITY_UNKNOWN");
  if (coverage.corpus.faults !== undefined || coverage.inPack?.faults !== undefined || coverage.inShape?.faults !== undefined) result.push("EVALUATION_FAULT");
  return Object.freeze(result);
}

export interface CensusOptions {
  readonly roots?: readonly string[];
  readonly shapeRoot?: string;
  readonly files?: readonly string[];
  readonly expression?: StructuralExpression;
  readonly witnesses?: Readonly<Record<string, readonly ExpressionWitness[]>>;
  readonly degenerates?: boolean;
  readonly declarations?: boolean;
  readonly declarationSourceOverrides?: Readonly<Record<string, string>>;
}

export async function runExpressionCensus(options: CensusOptions = {}) {
  const roots = (options.roots ?? ["content/drafts", "content/packs"]).map((path) => resolve(path));
  const selectedFiles = options.files === undefined ? undefined : new Set(options.files.map(file => censusFilePath(resolve(file))));
  const selectsSubjects = (file: string): boolean => selectedFiles === undefined || selectedFiles.has(censusFilePath(file));
  const discoveredPackFiles = packFiles(roots);
  const positions: CorpusPosition[] = [];
  let transitions = 0;
  const packsWithoutSpine: string[] = [], fixturePacks: string[] = [];
  const packDocuments = new Map<string, DrillPackDefinition>();
  const packIds = new Map<string, string>();
  const loadedShapes = await loadAuthoredShapeFiles(resolve(options.shapeRoot ?? "content/shapes"));
  const shapes = loadedShapes.registry, shapeFiles = loadedShapes.entries.map(entry => entry.file);
  let subjects: CensusSubject[] = [];
  const documentError = (absolute: string, error: unknown): void => {
    subjects.push({ file: censusFilePath(absolute), pointer: "/", kind: "document_error", target: unavailable(error) });
  };
  for (const { file, validation } of loadedShapes.entries) {
    if (validation.document === undefined) documentError(file, validation.issues.map(issue => `${issue.code}: ${issue.message}`).join("; "));
    else if (selectsSubjects(file)) subjects.push(...shapeSubjects(validation.document, censusFilePath(file)));
  }
  for (const absolute of discoveredPackFiles) {
    const raw = readJson(absolute);
    if (typeof raw?.id === "string") {
      const previous = packIds.get(raw.id);
      if (previous !== undefined) throw new TypeError(`duplicate pack id ${raw.id}: ${censusFilePath(previous)} and ${censusFilePath(absolute)}`);
      packIds.set(raw.id, absolute);
    }
    const validation = validatePackDocument(raw, { shapes });
    if (validation.document === undefined) { documentError(absolute, validation.issues.map(issue => `${issue.code}: ${issue.message}`).join("; ")); continue; }
    const pack = validation.document;
    packDocuments.set(absolute, pack);
    if (selectsSubjects(absolute)) subjects.push(...packSubjects(pack, censusFilePath(absolute)));
    try {
      const fens = authoredSpineFens(pack);
      if (!Object.hasOwn(pack, "spine")) packsWithoutSpine.push(pack.id);
      if (absolute.endsWith(".browser.json")) fixturePacks.push(pack.id);
      const rootPly = absolutePly(fens[0]!);
      transitions += Math.max(0, fens.length - 1);
      fens.forEach(fen => positions.push({ packId: pack.id, file: censusFilePath(absolute), ply: absolutePly(fen)-rootPly, fen }));
    } catch (error) { documentError(absolute, error); }
  }
  const discovered = new Set([...discoveredPackFiles, ...shapeFiles]);
  for (const absolute of [...new Set((options.files ?? []).map(file => resolve(file)))].sort()) {
    if (discovered.has(absolute)) continue;
    const raw = readJson(absolute);
    if (raw !== null && typeof raw === "object" && "trigger" in raw && "plans" in raw) {
      const validation = validateShapeEntry(raw);
      if (validation.document === undefined) documentError(absolute, validation.issues.map(issue => `${issue.code}: ${issue.message}`).join("; "));
      else subjects.push(...shapeSubjects(validation.document, censusFilePath(absolute)));
    } else {
      const validation = validatePackDocument(raw, { shapes });
      if (validation.document === undefined) documentError(absolute, validation.issues.map(issue => `${issue.code}: ${issue.message}`).join("; "));
      else subjects.push(...packSubjects(validation.document, censusFilePath(absolute)));
    }
  }
  if (selectedFiles !== undefined) {
    subjects = subjects.filter((subject) => selectedFiles.has(subject.file));
  }
  if (options.expression !== undefined) subjects = [{ file: "<expression>", pointer: "/", kind: "bare_expression", target: { kind: "bare_expression", expression: options.expression } }];
  subjects.sort((left, right) => left.file.localeCompare(right.file) || left.pointer.localeCompare(right.pointer));
  // No await or cross-run cache: results belong only to this original synchronous census.
  const context: CensusEvaluation = { successful: new WeakMap(), populations: new Map() };
  const records = subjects.map((subject) => {
    const coverage = coverageRecord(subject, positions, context);
    const key = `${subject.file}#${subject.pointer}`;
    let satisfiability: ReturnType<typeof expressionSatisfiability>;
    let satisfiabilityError: string | undefined;
    try {
      if (subject.target.kind === "unavailable") throw new TypeError(subject.target.error);
      satisfiability = subject.target.kind === "authored"
        ? authoredExpressionSatisfiability(subject.target.source, coverage.firingFens.slice(0, 1), options.witnesses?.[key] ?? [])
        : expressionSatisfiability(subject.target.expression, coverage.firingFens, options.witnesses?.[key] ?? []);
    } catch (error) {
      satisfiabilityError = error instanceof Error ? error.message : String(error);
      satisfiability = { verdict: "unknown", basis: "source or evaluation unavailable" };
    }
    const degenerate: string[] = [], degenerateFaults: { id: string; error: string }[] = [];
    if (options.degenerates !== false) for (const position of DEGENERATE_POSITIONS) {
      try { if (matchesTarget(subject.target, position.fen, context)) degenerate.push(position.id); }
      catch (error) { degenerateFaults.push({ id: position.id, error: error instanceof Error ? error.message : String(error) }); }
    }
    const { firingFens: _, ...publicCoverage } = coverage;
    return {
      site: { file: subject.file, pointer: subject.pointer, subject: { kind: subject.kind, ...(subject.shapeId === undefined ? {} : { shape: subject.shapeId }), ...(subject.planId === undefined ? {} : { plan: subject.planId }), ...(subject.packId === undefined ? {} : { pack: subject.packId }) } },
      coverage: publicCoverage, satisfiability, degenerate,
      ...(satisfiabilityError === undefined ? {} : { satisfiabilityError }),
      ...(degenerateFaults.length === 0 ? {} : { degenerateFaults }),
      observations: [...new Set([...observations(coverage, satisfiability, degenerate),
        ...(satisfiabilityError !== undefined || degenerateFaults.length > 0 || satisfiability.witnesses?.some(witness => witness.code === "WITNESS_EVALUATION_FAILED") ? ["EVALUATION_FAULT"] : [])])],
    };
  });
  const count = (label: string) => records.filter((record) => record.observations.includes(label)).length;
  const declarationReport = options.declarations === true
    ? runDeclarationCensus({
        packs: [...packDocuments.values()],
        ...(options.declarationSourceOverrides === undefined ? {} : { sourceOverrides: options.declarationSourceOverrides }),
      })
    : undefined;
  // Dependency replacement anywhere during this synchronous report cannot publish earlier hits.
  for (const subject of subjects) for (const target of [subject.target, subject.trigger]) {
    if (target?.kind === "authored") assertTargetCurrent(target);
  }
  return Object.freeze({
    schema: "tabiya.authoring.census.v1",
    corpus: { roots: roots.map(censusFilePath), packs: packDocuments.size, fixturePacks: fixturePacks.sort(), positions: positions.length, transitions, packsWithoutSpine: packsWithoutSpine.sort(), shapeEntries: shapeFiles.length },
    evidence: evidenceCensus(packDocuments),
    subjects: Object.freeze(records),
    ...(declarationReport === undefined ? {} : { declarations: declarationReport.declarations }),
    totals: {
      subjects: records.length,
      neverFiresInCorpus: count("NEVER_FIRES_IN_CORPUS"),
      firesOnlyOutsideShape: count("FIRES_ONLY_OUTSIDE_SHAPE"),
      inShapeDenominatorEmpty: count("IN_SHAPE_DENOMINATOR_EMPTY"),
      unsatisfiable: count("UNSATISFIABLE"),
      satisfiabilityUnknown: count("SATISFIABILITY_UNKNOWN"),
      evaluationFaults: count("EVALUATION_FAULT"),
      ...(declarationReport === undefined ? {} : { declarations: declarationReport.totals }),
    },
  });
}

export type ExpressionCensusReport = Awaited<ReturnType<typeof runExpressionCensus>>;

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
    const report = await runExpressionCensus({
      roots: (option("--corpus") ?? "content/drafts,content/packs").split(",").filter(Boolean),
      ...(selectedFiles === undefined ? {} : { files: selectedFiles }),
      ...(selectedExpression === undefined ? {} : { expression: selectedExpression }),
      witnesses,
      degenerates: option("--degenerate") !== "0",
      declarations: option("--declarations") === "1",
    });
    const output = `${canonicalizeJson(report)}\n`;
    const out = option("--out");
    if (out === undefined) process.stdout.write(output); else await writeFile(out, output, "utf8");
    const witnessFault = report.subjects.some((subject: any) => subject.satisfiability.witnesses?.some((value: any) => value.error !== undefined));
    return report.totals.unsatisfiable > 0 || report.totals.evaluationFaults > 0 || witnessFault ? 1 : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 2;
  }
}

if (process.argv[1]?.endsWith("expression-census.js")) process.exitCode = await main();
