import { loadSemanticValidationCases } from "../packages/runtime/src/semantic-validation-case-storage.js";
import { encodeSemanticValidationReceipt } from "../packages/runtime/src/semantic-validation-receipt-storage.js";
// `make semantic-validation-update` / `make semantic-validation-check` (rfc/semantic-validation-authority.md §6).
//
// Runs every registered case, every population census and the migrated external receipts, compiles
// one verdict per live root and writes `packages/runtime/src/semantic-validation-receipt.generated.ts`.
// `--check` recomputes into memory and fails on any byte difference; only `--write` rewrites.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { PRIMARY_EVIDENCE_MANIFEST, SEMANTIC_EVENT_DECLARATIONS } from "../packages/runtime/src/evidence-catalog.js";
import { compileCandidatePopulation, CANDIDATE_WIDE_SCOPE } from "../packages/runtime/src/candidate-population.js";
import { SUBJECT_OUTCOME_FAMILIES, type SubjectOutcomeFamily } from "../packages/runtime/src/semantic-subject-types.js";
import { evidenceDigest, evidenceValueReceipt, type VersionedEvidenceId } from "../packages/runtime/src/evidence-contract.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_RESOLVERS, semanticValidationImportClosure } from "../packages/runtime/src/semantic-validation-authorities.js";
import { semanticPopulationReceiptId } from "../packages/runtime/src/semantic-validation-law.js";
import { SEMANTIC_VALIDATION_OPERATIONS, subjectOutcomesFromReceipt, observationEvidence, observationSubjectKind, semanticValidationPopulationOperation, type SemanticValidationObservation, type SemanticValidationOperationResult } from "../packages/runtime/src/semantic-validation-operations.js";
import { executeSemanticValidationCase, semanticValidationSoleFactory, type SemanticCaseExecutionReceipt } from "../packages/runtime/src/semantic-validation-runner.js";
import {
  SEMANTIC_VALIDATION_ARMS,
  SEMANTIC_VALIDATION_PROFILE_CELLS,
  SEMANTIC_VALIDATION_PROFILES_PATH,
  SEMANTIC_READING_VALIDATION_DECLARATIONS,
  assertSemanticValidationFourWayEquality,
  assertSemanticValidationRegistryJoins,
  compileSemanticValidationVerdict,
  parseSemanticValidationCase,
  parseSemanticValidationProfile,
  parseSemanticValidationSubject,
  semanticValidationRoots,
  semanticValidationSubjectKey,
  semanticLegalSetDigest,
  type SemanticValidationArm,
  type SemanticValidationCell,
  type SemanticValidationCellOutcome,
  type SemanticValidationOperationId,
  type SemanticValidationProfile,
  type SemanticValidationReceiptDocument,
  type SemanticValidationRegistryRow,
  type SemanticValidationSubject,
  type SemanticSubjectOutcomesInput,
} from "../packages/runtime/src/semantic-validation.js";
import { readSemanticValidationPopulation, type SemanticValidationPopulation } from "./semantic-validation-population.js";

const ROOT = SEMANTIC_VALIDATION_REPOSITORY_ROOT;
const GENERATED = "packages/runtime/src/semantic-validation-receipt.generated.ts";
const GENERATED_JSON = "packages/runtime/src/semantic-validation-receipt.generated.json";
const EXTERNAL = "packages/runtime/src/semantic-validation-external.json";
const sha = (text: string | Buffer): string => createHash("sha256").update(text).digest("hex");
const refKey = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;

// ---------------------------------------------------------------------------------------------
// Implementation digests: the complete static local import closure of each operation entry
// ---------------------------------------------------------------------------------------------

function operationDigests(): SemanticValidationReceiptDocument["operations"] {
  const lock = sha(readFileSync(resolve(ROOT, "pnpm-lock.yaml")));
  return Object.values(SEMANTIC_VALIDATION_OPERATIONS).map((declaration) => {
    const files = semanticValidationImportClosure(declaration.implementationEntries);
    const digest = sha(JSON.stringify({ operation: declaration.ref, symbol: declaration.productionSymbol, adapter: declaration.resultAdapter, lock, files: files.map((file) => [file, sha(readFileSync(resolve(ROOT, file)))]) }));
    return Object.freeze({ id: declaration.ref.id, version: 1 as const, implementationDigest: digest, files: Object.freeze(files), reach: declaration.reach.kind });
  }).sort((left, right) => left.id.localeCompare(right.id));
}

// ---------------------------------------------------------------------------------------------
// Population censuses (§5.1)
// ---------------------------------------------------------------------------------------------

interface PopulationRow {
  readonly id: string;
  readonly subject: string;
  readonly operation: SemanticValidationOperationId;
  readonly predicateImplementationDigest: string;
  readonly input: { readonly id: string; readonly version: 1; readonly projection: string; readonly sha256: string; readonly invocations: number };
  readonly result: { readonly version: 1; readonly sha256: string; readonly positiveCount: number; readonly abstainedCount: number };
}

function observationKey(observation: SemanticValidationObservation): { readonly subject: string; readonly key: string } {
  const evidence = observationEvidence(observation);
  const projection = evidence.projection;
  // Value authority is part of the census: a target minted by another factory fails the build.
  const receipt = evidenceValueReceipt(evidence);
  const factory = semanticValidationSoleFactory(projection);
  if (receipt.factory !== factory) throw new Error(`SEMANTIC_VALIDATION_VALUE_AUTHORITY_MISSING: ${refKey(projection)} minted by ${receipt.factory}, not ${factory ?? "(none)"}`);
  return { subject: `${observationSubjectKind(observation)}:${refKey(projection)}`, key: observation.kind === "event" ? observation.item.id : receipt.payloadDigest };
}

interface CensusResult {
  readonly projection: string;
  readonly inputSha: string;
  invocations: number;
  readonly observations: Map<string, string[]>;
  readonly unavailable: string[];
  readonly abstained: Map<string, string[]>;
}
function addCensusResult(run: CensusResult, identity: string, result: SemanticValidationOperationResult): void {
  run.invocations++;
  if (result.kind === "unavailable") { run.unavailable.push(`${identity}:${result.reason}`); return; }
  for (const abstention of result.abstentions) {
    const subject = `event:${refKey(abstention.projection)}`;
    run.abstained.set(subject, [...(run.abstained.get(subject) ?? []), `${identity}:${abstention.reason}`]);
  }
  for (const observation of result.observations) {
    const { subject, key } = observationKey(observation), list = run.observations.get(subject) ?? [];
    list.push(`${identity}:${key}`); run.observations.set(subject, list);
  }
}

/** Receiving check: deleting a family or reusing another family's output is not a zero census. */
export function assertSubjectCensusFamilies(runs: ReadonlyMap<SubjectOutcomeFamily, CensusResult>, population: SemanticValidationPopulation): void {
  if (runs.size !== SUBJECT_OUTCOME_FAMILIES.length || SUBJECT_OUTCOME_FAMILIES.some(family => {
    const run = runs.get(family);
    return run === undefined || run.projection !== `subject_outcomes:${family}` || run.invocations !== population.sampledEdges.length
      || run.inputSha !== evidenceDigest({ projection: "subject_outcomes", family, sampledEdges: population.projectionDigests.sampled_edges })
      || [...run.observations.keys()].some(subject => subject !== `event:derived.semantic_avoidance.${family}@2`);
  })) throw new Error("SEMANTIC_VALIDATION_POPULATION_INCOMPLETE: exact thirteen family censuses required");
}

/** One genuine root at a time, reused across all13 families and then released. No retained root cache. */
export function runSubjectCensuses(population: SemanticValidationPopulation): ReadonlyMap<SubjectOutcomeFamily, CensusResult> {
  if (population.sampledEdges.length === 0) throw new Error("SEMANTIC_VALIDATION_POPULATION_INCOMPLETE: no subject samples");
  const runs = new Map(SUBJECT_OUTCOME_FAMILIES.map(family => [family, { projection: `subject_outcomes:${family}`,
    inputSha: evidenceDigest({ projection: "subject_outcomes", family, sampledEdges: population.projectionDigests.sampled_edges }),
    invocations: 0, observations: new Map<string, string[]>(), unavailable: [], abstained: new Map<string, string[]>() } satisfies CensusResult]));
  for (const row of population.sampledEdges) {
    const compiled = compileCandidatePopulation({ beforeFen: row.edge.beforeFen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    if (compiled.kind !== "ready") throw new Error(`Subject census root failed: ${compiled.error.code}`);
    const receipt = compiled.receipt, alternatives = receipt.packet.candidates.map(candidate => ({ kind: "edge" as const,
      beforeFen: receipt.packet.beforeFen, moveUci: candidate.moveUci, afterFen: candidate.afterFen }));
    for (const family of SUBJECT_OUTCOME_FAMILIES) {
      const input: SemanticSubjectOutcomesInput = { kind: "subject_outcomes", family, population: { kind: "complete_alternatives", rootFen: receipt.packet.beforeFen,
        played: row.edge, alternatives, legalSetDigest: semanticLegalSetDigest(receipt.packet.beforeFen, alternatives.map(edge => edge.moveUci)) } };
      addCensusResult(runs.get(family)!, `${row.site}#${row.ply}`, subjectOutcomesFromReceipt(input, receipt));
    }
  }
  assertSubjectCensusFamilies(runs, population);
  return runs;
}

async function runCensus(operation: SemanticValidationOperationId, population: SemanticValidationPopulation): Promise<CensusResult> {
  const declaration = SEMANTIC_VALIDATION_OPERATIONS[operation] as { readonly invoke: (input: unknown) => SemanticValidationOperationResult | Promise<SemanticValidationOperationResult>; readonly population: string };
  const items: readonly { readonly identity: string; readonly input: unknown }[] =
    declaration.population === "sampled_edges" ? population.sampledEdges.map(row => ({ identity: `${row.site}#${row.ply}`, input: row.edge }))
    : declaration.population === "recorded_paths" ? population.recordedPaths.map(row => ({ identity: row.site, input: row.path })) : [];
  if (items.length === 0) throw new Error(`SEMANTIC_VALIDATION_POPULATION_INCOMPLETE: ${operation} has no compatible population`);
  const run: CensusResult = { projection: declaration.population,
    inputSha: population.projectionDigests[declaration.population as keyof SemanticValidationPopulation["projectionDigests"]], invocations: 0,
    observations: new Map(), unavailable: [], abstained: new Map() };
  for (const item of items) addCensusResult(run, item.identity, await declaration.invoke(item.input));
  return run;
}

// ---------------------------------------------------------------------------------------------
// External disagreement receipts (§5.2)
// ---------------------------------------------------------------------------------------------

interface ExternalRow {
  readonly id: string;
  readonly subject: SemanticValidationSubject;
  readonly receipt: Readonly<Record<string, unknown>>;
}

function externalRows(): readonly ExternalRow[] {
  const document = JSON.parse(readFileSync(resolve(ROOT, EXTERNAL), "utf8")) as {
    readonly source: { readonly path: string; readonly sha256: string };
    readonly dataset: { readonly id: string; readonly version: 1; readonly sha256: string };
    readonly receipts: readonly { readonly id: string; readonly subject: unknown; readonly theme: string; readonly localPredicateSource: string; readonly tagged: number; readonly taggedDetected: number; readonly controls: number; readonly controlsDetected: number }[];
  };
  if (sha(readFileSync(resolve(ROOT, document.source.path))) !== document.source.sha256) throw new Error(`SEMANTIC_VALIDATION_POPULATION_STALE: ${document.source.path} no longer matches its recorded digest`);
  return document.receipts.map((row) => {
    const subject = parseSemanticValidationSubject(row.subject);
    const cells = { tagged_and_local: row.taggedDetected, tagged_only: row.tagged - row.taggedDetected, control_and_local: row.controlsDetected, control_only: row.controls - row.controlsDetected };
    const result = { version: 1 as const, sha256: sha(JSON.stringify({ id: row.id, cells })) };
    return Object.freeze({
      id: row.id,
      subject,
      receipt: Object.freeze({
        id: row.id, version: 1, subject: semanticValidationSubjectKey(subject), kind: "external_disagreement",
        dataset: document.dataset, source: document.source.path, sourceSha256: document.source.sha256, theme: row.theme,
        localPredicate: refKey(subject.projection), localPredicateSource: row.localPredicateSource,
        denominator: row.tagged + row.controls, localPositiveCount: row.taggedDetected + row.controlsDetected, labelledPositiveCount: row.tagged, cells, result,
      }),
    });
  });
}

// ---------------------------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------------------------

function loadDocuments(): { readonly profiles: readonly SemanticValidationProfile[]; readonly cases: ReturnType<typeof parseSemanticValidationCase>[]; readonly profileText: string; readonly caseText: string } {
  const profileText = readFileSync(resolve(ROOT, SEMANTIC_VALIDATION_PROFILES_PATH), "utf8");
  const caseDocument = loadSemanticValidationCases(ROOT);
  const caseText = JSON.stringify(caseDocument);
  const profiles = (JSON.parse(profileText) as { readonly profiles: readonly unknown[] }).profiles.map(parseSemanticValidationProfile);
  const cases = caseDocument.cases.map(parseSemanticValidationCase);
  return { profiles, cases, profileText, caseText };
}

export async function buildSemanticValidationReceipt(): Promise<{ readonly document: SemanticValidationReceiptDocument; readonly text: string; readonly json: string }> {
  const { profiles, cases, profileText, caseText } = loadDocuments();
  const roots = semanticValidationRoots(PRIMARY_EVIDENCE_MANIFEST, undefined, (projection) => semanticValidationSoleFactory(projection) !== undefined);
  const declarations = [
    ...SEMANTIC_EVENT_DECLARATIONS.map((declaration) => ({ kind: "event" as const, projection: declaration.validation.profile.projection })),
    ...SEMANTIC_READING_VALIDATION_DECLARATIONS.filter((declaration) => roots.some((root) => semanticValidationSubjectKey(root) === semanticValidationSubjectKey(declaration.subject))).map((declaration) => declaration.subject),
  ];
  const externals = externalRows();
  const registry: SemanticValidationRegistryRow[] = [
    ...cases.map((value) => ({ kind: "case" as const, id: value.id, subject: value.subject, arm: value.arm as SemanticValidationArm })),
    ...profiles.flatMap((profile) => profile.importedPopulation.disposition === "present" ? profile.importedPopulation.refs.map((ref) => ({ kind: "population_receipt" as const, id: ref.id, subject: ref.subject, arm: "imported_population" as const })) : []),
    ...externals.map((row) => ({ kind: "external_disagreement_receipt" as const, id: row.id, subject: row.subject, arm: "external_label" as const })),
  ];
  assertSemanticValidationRegistryJoins(roots, profiles, registry);

  // Cases.
  const caseMap = new Map(cases.map((value) => [value.id, value]));
  const executions = new Map<string, SemanticCaseExecutionReceipt>();
  for (const value of cases) executions.set(value.id, await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, caseMap));

  // Populations: one census per operation, split per subject.
  const population = readSemanticValidationPopulation(ROOT);
  const operations = operationDigests();
  const implementation = new Map(operations.map((row) => [row.id, row.implementationDigest]));
  const populationSubjects = profiles.filter((profile) => profile.importedPopulation.disposition === "present");
  const census = new Map<string, Awaited<ReturnType<typeof runCensus>>>();
  let subjectRuns: ReadonlyMap<SubjectOutcomeFamily, CensusResult> | undefined;
  const familyFor = (subject: SemanticValidationSubject): SubjectOutcomeFamily | undefined => subject.projection.version === 2 ? SUBJECT_OUTCOME_FAMILIES.find(family => subject.projection.id === `derived.semantic_avoidance.${family}`) : undefined;
  const censusKey = (operation: SemanticValidationOperationId, subject: SemanticValidationSubject) => `${operation}@1:${familyFor(subject) ?? ""}`;
  for (const profile of populationSubjects) {
    const operation = semanticValidationPopulationOperation(profile.subject);
    if (operation === undefined) throw new Error(`SEMANTIC_VALIDATION_POPULATION_INCOMPLETE: ${semanticValidationSubjectKey(profile.subject)} names a population receipt but has no population operation`);
    const key = censusKey(operation, profile.subject);
    if (!census.has(key)) {
      if (operation === "runtime.semantic.subject_outcomes") {
        subjectRuns ??= runSubjectCensuses(population);
        const family = familyFor(profile.subject);
        if (family === undefined) throw new Error("Subject population has no exact family");
        census.set(key, subjectRuns.get(family)!);
      } else census.set(key, await runCensus(operation, population));
    }
  }
  const populations: PopulationRow[] = populationSubjects.map((profile) => {
    const operation = semanticValidationPopulationOperation(profile.subject)!;
    const run = census.get(censusKey(operation, profile.subject))!;
    const key = semanticValidationSubjectKey(profile.subject);
    const observations = [...(run.observations.get(key) ?? [])].sort();
    const unavailable = [...run.unavailable, ...(run.abstained.get(key) ?? [])].sort();
    return Object.freeze({
      id: semanticPopulationReceiptId(profile.subject),
      subject: key,
      operation,
      predicateImplementationDigest: implementation.get(operation)!,
      input: Object.freeze({ id: population.id, version: 1 as const, projection: run.projection, sha256: run.inputSha, invocations: run.invocations }),
      result: Object.freeze({ version: 1 as const, sha256: sha(JSON.stringify({ observations, unavailable })), positiveCount: observations.length, abstainedCount: unavailable.length }),
    });
  });
  const populationById = new Map(populations.map((row) => [row.id, row]));
  const externalById = new Map(externals.map((row) => [row.id, row]));

  // Verdicts.
  const reachDebt = (operation: SemanticValidationOperationId): { readonly owner: string; readonly discharge: string } | undefined => {
    const reach = SEMANTIC_VALIDATION_OPERATIONS[operation].reach;
    return reach.kind === "required" ? { owner: reach.owner, discharge: reach.discharge } : undefined;
  };
  const verdicts = profiles.map((profile) => {
    const cells: SemanticValidationCellOutcome[] = SEMANTIC_VALIDATION_PROFILE_CELLS.map(([cellKey, arm]): SemanticValidationCellOutcome => {
      const cell = profile[cellKey] as SemanticValidationCell<SemanticValidationArm>;
      if (cell.disposition === "required") return { arm, status: "required", owner: cell.owner, discharge: cell.discharge };
      if (cell.disposition === "not_applicable") return { arm, status: "not_applicable", reason: cell.reason };
      const ids = cell.refs.map((ref) => ref.id);
      const failures: string[] = [];
      let debt: { readonly owner: string; readonly discharge: string } | undefined;
      for (const ref of cell.refs) {
        if (ref.kind === "case") {
          const execution = executions.get(ref.id)!;
          if (execution.status !== "passed") failures.push(`${ref.id}: ${execution.failure?.code ?? "failed"}`);
          debt ??= reachDebt(caseMap.get(ref.id)!.operation.id);
        } else if (ref.kind === "population_receipt") {
          const row = populationById.get(ref.id);
          if (row === undefined || row.input.invocations === 0) failures.push(`${ref.id}: SEMANTIC_VALIDATION_POPULATION_INCOMPLETE`);
          else debt ??= reachDebt(row.operation);
        } else if (!externalById.has(ref.id)) failures.push(`${ref.id}: external receipt missing`);
      }
      if (failures.length > 0) return { arm, status: "failed", refs: ids, failures };
      if (debt !== undefined) return { arm, status: "required", owner: debt.owner, discharge: `reach: ${debt.discharge}` };
      return { arm, status: "passed", refs: ids };
    });
    return compileSemanticValidationVerdict(profile.subject, cells);
  });
  assertSemanticValidationFourWayEquality({ roots, declarations, profiles: profiles.map((profile) => profile.subject), verdicts: verdicts.map((row) => row.subject) });
  void SEMANTIC_VALIDATION_ARMS;

  const document: SemanticValidationReceiptDocument = {
    schemaVersion: 1,
    writer: "make semantic-validation-update",
    rootDigest: evidenceDigest(roots.map(semanticValidationSubjectKey)),
    profileDigest: sha(profileText),
    caseDigest: sha(caseText),
    externalDigest: sha(readFileSync(resolve(ROOT, EXTERNAL))),
    operations,
    population: Object.freeze({
      id: population.id, version: 1, pgnSha256: population.pgnSha256, manifestSha256: population.manifestSha256,
      games: population.games, sampledEdges: population.sampledEdges.length, recordedPaths: population.recordedPaths.length,
      recordedPathEdges: population.recordedPaths.reduce((sum, row) => sum + row.path.edges.length, 0),
      projections: population.projectionDigests,
    }),
    cases: [...executions.values()].sort((left, right) => left.case.localeCompare(right.case)) as unknown as SemanticValidationReceiptDocument["cases"],
    populations: populations.sort((left, right) => left.subject.localeCompare(right.subject)) as unknown as SemanticValidationReceiptDocument["populations"],
    externals: externals.map((row) => row.receipt).sort((left, right) => String(left.id).localeCompare(String(right.id))),
    verdicts: [...verdicts].sort((left, right) => semanticValidationSubjectKey(left.subject).localeCompare(semanticValidationSubjectKey(right.subject))),
  };
  // Keep one complete case receipt per line so the checked artifact stays within the
  // source blob limit. The other sections retain the existing readable formatting.
  const json = encodeSemanticValidationReceipt(document);
  const table = {
    schemaVersion: 1,
    receiptSha256: sha(json),
    verdicts: document.verdicts.map((row) => ({ subject: row.subject, verdict: row.verdict, open: row.open })),
  };
  const text = [
    "// GENERATED by `make semantic-validation-update` (tools/semantic-validation-build.ts). Do not edit by hand.",
    "// `make semantic-validation-check` recomputes this file and semantic-validation-receipt.generated.json and fails on any byte difference.",
    "// The JSON sibling uses semantic-validation-receipt-storage to expand full records; runtime imports only these compact verdicts.",
    'import type { SemanticValidationVerdictTable } from "./semantic-validation.js";',
    "",
    `export const SEMANTIC_VALIDATION_RECEIPT: SemanticValidationVerdictTable = ${JSON.stringify(table, null, 2)};`,
    "",
  ].join("\n");
  return { document, text, json };
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
const mode = process.argv.includes("--write") ? "write" : "check";
const { document, text, json } = await buildSemanticValidationReceipt();
const passed = document.verdicts.filter((row) => row.verdict === "passed").length;
const caseCounts = { passed: document.cases.filter((row) => row.status === "passed").length, failed: document.cases.filter((row) => row.status === "failed").length };
const summary = `semantic validation: ${document.verdicts.length} subjects, ${passed} passed; ${document.cases.length} cases (${caseCounts.passed} passed, ${caseCounts.failed} failed); ${document.populations.length} population receipts; ${document.externals.length} external receipts`;
if (mode === "write") {
  writeFileSync(resolve(ROOT, GENERATED_JSON), json);
  writeFileSync(resolve(ROOT, GENERATED), text);
  console.log(`${summary}\nwrote ${GENERATED_JSON} and ${GENERATED}`);
} else {
  const stale = [[GENERATED_JSON, json], [GENERATED, text]].filter(([path, expected]) => !existsSync(resolve(ROOT, path!)) || readFileSync(resolve(ROOT, path!), "utf8") !== expected).map(([path]) => path);
  if (stale.length > 0) {
    console.error(`${summary}\nstale: ${stale.join(", ")}; run make semantic-validation-update`);
    process.exit(1);
  }
  console.log(`${summary}\n${GENERATED_JSON} and ${GENERATED} are current`);
}
}
