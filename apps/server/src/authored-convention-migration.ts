import baseline from "../../../rfc/contracts/foundation-authored-convention-sites-v1.json" with { type: "json" };
import { resolve } from "node:path";
import { canonicalizeJson, STRUCTURAL_CONVENTION_REFS, type DrillPackDefinition, type StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import { authoredStructuralDocument, authoredStructuralSites, readAuthoredStructuralConditionSource, selectAuthoredStructuralCondition, type AuthoredStructuralConditionSource } from "../../../packages/runtime/src/internal/authored-structural-source.js";
import { declareCurrentStructuralPredicateEvidence, preflightCurrentAuthoredOperation } from "../../../packages/runtime/src/structural-evidence.js";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { authoredFilePath, authoredPackFiles, loadAuthoredShapeFiles, readAuthoredJson } from "./authored-document-files.js";
import { authoredSpineFens, validatePackDocument, type PackValidationIssue } from "./pack-validation.js";
import { validateShapeEntry } from "./shape-validation.js";

type Family = keyof typeof STRUCTURAL_CONVENTION_REFS;
type Document = DrillPackDefinition | ShapeEntryDefinition;
type Kind = "pack" | "shape";
const EXPECTED = Object.freeze({ king_opposition: 8, backward_pawn: 5, outpost: 23 });
const familyOf = (expression: StructuralExpression): Family | undefined => {
  if (expression.kind !== "feature" && expression.kind !== "quantified") return undefined;
  const kind = expression.feature.kind;
  return Object.hasOwn(EXPECTED, kind) ? kind as Family : undefined;
};
interface Position { readonly file: string; readonly packId: string; readonly ordinal: number; readonly ply: number; readonly fen: string }
interface DocumentEntry { readonly file: string; readonly kind: Kind; readonly document: Document; readonly valid: boolean; readonly issues: readonly PackValidationIssue[] }
interface Pair { readonly literal: AuthoredStructuralConditionSource; readonly context: AuthoredStructuralConditionSource }
interface TraceNode {
  readonly path: string; readonly matched: boolean; readonly kind: string;
  readonly piece?: Extract<StructuralExpression, { kind: "pieceOnSquare" }>;
  readonly leaf?: { readonly projection: { readonly id: string; readonly version: number }; readonly feature: unknown; readonly factory: string; readonly payloadDigest: string };
}
type Outcome = { readonly kind: "available"; readonly matched: boolean; readonly trace: readonly TraceNode[]; readonly factory: string; readonly payloadDigest: string; readonly conventions: readonly { readonly id: string; readonly version: number }[] }
  | { readonly kind: "unavailable"; readonly reason: string }
  | { readonly kind: "failed"; readonly reason: string };
interface SiteAddress { readonly file: string; readonly documentId: string; readonly kind: Kind; readonly family: Family; readonly pointer: string; readonly conditionPointer: string; readonly contextPointer: string }
interface Sample { readonly reasons: readonly string[]; readonly position: Position; readonly legacy: { readonly literal: Outcome; readonly context: Outcome }; readonly successor: { readonly literal: Outcome; readonly context: Outcome } }
interface ArmSummary { readonly source: ReturnType<typeof sourceSummary>; readonly context: ReturnType<typeof sourceSummary>; readonly validation: { readonly valid: boolean; readonly issues: ReturnType<typeof issueSummary> } }
type MigrationSite = { readonly site: SiteAddress; readonly decision: "pending_author_review" } & (
  { readonly status: "blocked"; readonly reason: string } |
  { readonly status: "compared"; readonly successorRef: typeof STRUCTURAL_CONVENTION_REFS[Family]; readonly legacy: ArmSummary; readonly successor: ArmSummary; readonly literal: ReturnType<typeof counts>; readonly context: ReturnType<typeof counts>; readonly samples: readonly Sample[] }
);
interface EvaluationContext { readonly successful: WeakMap<AuthoredStructuralConditionSource, Map<string, Extract<Outcome, { kind: "available" }>>> }

function evaluate(source: AuthoredStructuralConditionSource, fen: string, context: EvaluationContext): Outcome {
  try {
    preflightCurrentAuthoredOperation("authoring");
    readAuthoredStructuralConditionSource(source);
    const cached = context.successful.get(source)?.get(fen);
    if (cached !== undefined) return cached;
    const result = declareCurrentStructuralPredicateEvidence(fen, source, "predicate", "authoring");
    if (result.kind !== "available") return result;
    readAuthoredStructuralConditionSource(source);
    const observation = result.value.payload.observation, receipt = evidenceValueReceipt(result.value);
    const outcome: Extract<Outcome, { kind: "available" }> = {
      kind: "available", matched: observation.matched, factory: receipt.factory, payloadDigest: receipt.payloadDigest,
      conventions: receipt.convention?.refs ?? [],
      trace: observation.trace.map(node => ({ path: node.path, matched: node.matched, kind: node.expression.kind,
        ...(node.expression.kind === "pieceOnSquare" ? { piece: node.expression } : {}),
        ...(node.leaf === undefined ? {} : { leaf: { projection: node.leaf.projection, feature: node.leaf.payload.feature,
          factory: evidenceValueReceipt(node.leaf).factory, payloadDigest: evidenceValueReceipt(node.leaf).payloadDigest } }),
      })),
    };
    let values = context.successful.get(source);
    if (values === undefined) { values = new Map(); context.successful.set(source, values); }
    values.set(fen, outcome); return outcome;
  } catch (error) { return { kind: "failed", reason: error instanceof Error ? error.message : String(error) }; }
}
function sourceSummary(source: AuthoredStructuralConditionSource) {
  const { origin, pointer, expression } = readAuthoredStructuralConditionSource(source);
  return { kind: origin.kind, stage: origin.stage, documentId: origin.documentId, version: origin.version, digest: origin.digest, pointer, expression };
}
function pair(document: Document, pointer: string, root: string): Pair {
  const handle = authoredStructuralDocument(document), literal = selectAuthoredStructuralCondition(handle, pointer);
  return { literal, context: root === pointer ? literal : selectAuthoredStructuralCondition(handle, root) };
}
function featureAt(document: Document, pointer: string): Record<string, unknown> {
  let value: unknown = document;
  for (const token of pointer.slice(1).split("/")) {
    if (value === null || typeof value !== "object") throw new TypeError(`Invalid authored pointer ${pointer}`);
    value = (value as Record<string, unknown>)[token.replaceAll("~1", "/").replaceAll("~0", "~")];
  }
  if (value === null || typeof value !== "object" || !("feature" in value) || value.feature === null || typeof value.feature !== "object") throw new TypeError(`Not an authored feature site ${pointer}`);
  return value.feature as Record<string, unknown>;
}
const issueSummary = (issues: readonly PackValidationIssue[]) => issues.map(({ severity, code, path, message }) => ({ severity, code, path, message }));
function counts() { return { cases: 0, paired: 0, changed: 0, legacyAvailable: 0, successorAvailable: 0, legacyMatched: 0, successorMatched: 0 }; }
function count(target: ReturnType<typeof counts>, legacy: Outcome, successor: Outcome): void {
  target.cases++;
  if (legacy.kind === "available") { target.legacyAvailable++; if (legacy.matched) target.legacyMatched++; }
  if (successor.kind === "available") { target.successorAvailable++; if (successor.matched) target.successorMatched++; }
  if (legacy.kind === "available" && successor.kind === "available") { target.paired++; if (legacy.matched !== successor.matched) target.changed++; }
}
const differs = (left: Outcome, right: Outcome) => left.kind === "available" && right.kind === "available" && left.matched !== right.matched;

/** Diagnostic comparisons only. No file writes, requirement restamps or author decisions. */
export async function authoredConventionMigrationReport(options: { readonly roots?: readonly string[]; readonly shapeRoot?: string } = {}) {
  preflightCurrentAuthoredOperation("authoring");
  const roots = (options.roots ?? ["content/drafts", "content/packs"]).map(path => resolve(path));
  const shapes = await loadAuthoredShapeFiles(resolve(options.shapeRoot ?? "content/shapes"));
  const documents: DocumentEntry[] = [], positions: Position[] = [], admissionFaults: { file: string; message: string }[] = [];
  const packIds = new Map<string, string>();
  let expectedPositions = 0;
  const replayFaults: { file: string; packId: string; expectedPositions: number; replayedPositions: number; omittedPositions: number; issues: ReturnType<typeof issueSummary> }[] = [];
  const nodeCount = (nodes: readonly import("@chess-tabiya/schema/drill-pack").SpineNode[]): number => nodes.reduce((total, node) => total+1+nodeCount(node.children), 0);
  for (const { file, validation } of shapes.entries) {
    if (validation.document === undefined) admissionFaults.push({ file: authoredFilePath(file), message: JSON.stringify(issueSummary(validation.issues)) });
    else documents.push({ file: authoredFilePath(file), kind: "shape", document: validation.document, valid: validation.valid, issues: validation.issues });
  }
  for (const file of authoredPackFiles(roots)) {
    const validation = validatePackDocument(readAuthoredJson(file), { shapes: shapes.registry });
    if (validation.document === undefined) { admissionFaults.push({ file: authoredFilePath(file), message: JSON.stringify(issueSummary(validation.issues)) }); continue; }
    const document = validation.document, previous = packIds.get(document.id);
    if (previous !== undefined) throw new TypeError(`duplicate pack id ${document.id}: ${previous} and ${authoredFilePath(file)}`);
    packIds.set(document.id, authoredFilePath(file));
    documents.push({ file: authoredFilePath(file), kind: "pack", document, valid: validation.valid, issues: validation.issues });
    const authoredPositions = 1+nodeCount(document.spine ?? []);
    expectedPositions += authoredPositions;
    try {
      const fens = authoredSpineFens(document), ply = (fen: string) => { const fields = fen.split(" "); return (Number(fields[5] ?? "1")-1)*2 + (fields[1] === "b" ? 1 : 0); };
      if (fens.length !== authoredPositions) replayFaults.push({ file: authoredFilePath(file), packId: document.id,
        expectedPositions: authoredPositions, replayedPositions: fens.length, omittedPositions: authoredPositions-fens.length, issues: issueSummary(validation.issues) });
      fens.forEach((fen, ordinal) => positions.push({ file: authoredFilePath(file), packId: document.id, ordinal, ply: ply(fen)-ply(fens[0]!), fen }));
    } catch (error) {
      admissionFaults.push({ file: authoredFilePath(file), message: error instanceof Error ? error.message : String(error) });
      replayFaults.push({ file: authoredFilePath(file), packId: document.id, expectedPositions: authoredPositions, replayedPositions: 0,
        omittedPositions: authoredPositions, issues: issueSummary(validation.issues) });
    }
  }
  documents.sort((left, right) => left.file.localeCompare(right.file));
  const context: EvaluationContext = { successful: new WeakMap() }, sources: AuthoredStructuralConditionSource[] = [];
  const actual = { king_opposition: 0, backward_pawn: 0, outpost: 0 };
  const sites = documents.flatMap(entry => {
    const structuralSites = authoredStructuralSites(entry.kind, entry.document);
    return [...structuralSites].flatMap<MigrationSite>(([pointer, expression]) => {
      const family = familyOf(expression);
      if (family === undefined) return [];
      actual[family]++;
      const root = [...structuralSites.keys()].filter(parent => pointer === parent || pointer.startsWith(`${parent}/`)).sort((a,b) => a.length-b.length)[0]!;
      const site = { file: entry.file, documentId: entry.document.id, kind: entry.kind, family, pointer: `${pointer}/feature`, conditionPointer: pointer, contextPointer: root };
      try {
        const original = featureAt(entry.document, pointer);
        if (Object.hasOwn(original, "conventionRef")) throw new TypeError("Original already selects a convention; this report compares absent-ref legacy with its explicit successor");
        const counterfactual = structuredClone(entry.document);
        featureAt(counterfactual, pointer).conventionRef = { ...STRUCTURAL_CONVENTION_REFS[family] };
        if (canonicalizeJson({ requires: (entry.document as DrillPackDefinition).requires ?? null }) !== canonicalizeJson({ requires: (counterfactual as DrillPackDefinition).requires ?? null })) throw new TypeError("Counterfactual changed authored requirements");
        const validation = entry.kind === "shape" ? validateShapeEntry(counterfactual) : validatePackDocument(counterfactual, { shapes: shapes.registry });
        if (validation.document === undefined) throw new TypeError(JSON.stringify(issueSummary(validation.issues)));
        const legacy = pair(entry.document, pointer, root), successor = pair(validation.document, pointer, root);
        sources.push(legacy.literal, legacy.context, successor.literal, successor.context);
        const literalCounts = counts(), contextCounts = counts();
        const samples: Sample[] = [];
        const sampled = new Set<string>();
        for (const position of positions) {
          const old = { literal: evaluate(legacy.literal, position.fen, context), context: evaluate(legacy.context, position.fen, context) };
          const next = { literal: evaluate(successor.literal, position.fen, context), context: evaluate(successor.context, position.fen, context) };
          count(literalCounts, old.literal, next.literal); count(contextCounts, old.context, next.context);
          const unavailable = [old.literal, old.context, next.literal, next.context].some(outcome => outcome.kind !== "available");
          const reasons = [
            ...(unavailable ? ["evaluation_unavailable"] : []),
            ...(differs(old.literal, next.literal) ? ["literal_changed"] : []),
            ...(differs(old.context, next.context) ? ["context_changed"] : []),
          ];
          if (reasons.length === 0) reasons.push("unchanged");
          if (samples.length < 4 && reasons.some(reason => !sampled.has(reason))) {
            reasons.forEach(reason => sampled.add(reason)); samples.push({ reasons, position, legacy: old, successor: next });
          }
        }
        return [{ site, status: "compared" as const, decision: "pending_author_review" as const,
          successorRef: STRUCTURAL_CONVENTION_REFS[family],
          legacy: { source: sourceSummary(legacy.literal), context: sourceSummary(legacy.context), validation: { valid: entry.valid, issues: issueSummary(entry.issues) } },
          successor: { source: sourceSummary(successor.literal), context: sourceSummary(successor.context), validation: { valid: validation.valid, issues: issueSummary(validation.issues) } },
          literal: literalCounts, context: contextCounts, samples,
        }];
      } catch (error) { return [{ site, status: "blocked" as const, decision: "pending_author_review" as const, reason: error instanceof Error ? error.message : String(error) }]; }
    });
  });
  // No retained available comparison may survive an original dependency replacement.
  for (const source of sources) readAuthoredStructuralConditionSource(source);
  const countsMatch = Object.entries(EXPECTED).every(([family, expected]) => actual[family as Family] === expected);
  const address = (site: { file: string; documentId: string; kind: string; pointer: string; family: string }) => JSON.stringify([site.file, site.documentId, site.kind, site.pointer, site.family]);
  const expectedSites = new Set(baseline.sites.map(address)), actualSites = new Set(sites.map(row => address(row.site)));
  const missingSites = [...expectedSites].filter(site => !actualSites.has(site)).sort();
  const additionalSites = [...actualSites].filter(site => !expectedSites.has(site)).sort();
  const sitesMatch = missingSites.length === 0 && additionalSites.length === 0 && expectedSites.size === baseline.sites.length && actualSites.size === sites.length;
  const populationMatches = countsMatch && sitesMatch;
  return {
    schema: "tabiya.authored-convention-migration.v1",
    scope: "literal predicates and containing structural expressions over authored spine occurrences",
    literalScope: "standalone authored subtree, excluding its enclosing boolean or mirror context",
    counterfactualPolicy: "one literal ref at a time; joint migration effects are unmeasured",
    changeMetric: "matched_boolean",
    decision: "pending_author_review", writesContent: false,
    population: { roots: roots.map(authoredFilePath), corpusDocuments: documents.length, affectedDocuments: new Set(sites.map(row => row.site.file)).size, positions: positions.length, expected: EXPECTED, actual, matches: populationMatches, countsMatch, sitesMatch, missingSites, additionalSites, admissionFaults,
      replay: { expectedPositions, retainedPositions: positions.length, omittedPositions: expectedPositions-positions.length, faults: replayFaults } },
    comparisonComplete: populationMatches && admissionFaults.length === 0 && replayFaults.length === 0 && positions.length > 0 && sites.every(row => row.status === "compared" && row.literal.paired === positions.length && row.context.paired === positions.length),
    sites,
  };
}
