import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import {
  commitMove,
  createRun,
  MATERIAL_VALUES,
  matchesStructuralExpression,
  type StructuralExpression,
} from "../../packages/runtime/src/index.js";
import { objectiveRules, orchestratePackMove } from "../../apps/server/src/pack-orchestrator.js";
import type {
  DrillPackDefinition,
  SuccessCondition,
} from "../../packages/schema/src/drill-pack/index.js";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const root = process.cwd();
const schema = JSON.parse(readFileSync(join(root, "schemas/drill_pack.schema.json"), "utf8")) as Json;
const allPackFiles = readdirSync(join(root, "content/drafts"))
  .filter((name) => name.endsWith(".json") && !name.endsWith(".evidence.json") && !name.endsWith(".sources.json") && !name.endsWith(".job.json"))
  .sort();
const packFiles = allPackFiles.filter((name) => !name.endsWith(".browser.json"));
const browserFixtureFiles = allPackFiles.filter((name) => name.endsWith(".browser.json"));
const shapeFiles = readdirSync(join(root, "content/shapes")).filter((name) => name.endsWith(".json")).sort();
const packs = packFiles.map((name) => ({ name, value: JSON.parse(readFileSync(join(root, "content/drafts", name), "utf8")) as DrillPackDefinition }));
const shapes = shapeFiles.map((name) => ({ name, value: JSON.parse(readFileSync(join(root, "content/shapes", name), "utf8")) as any }));

function walk(value: Json, visit: (value: Json, path: readonly (string | number)[]) => void, path: readonly (string | number)[] = []): void {
  visit(value, path);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visit, [...path, index]));
  else if (value !== null && typeof value === "object") Object.entries(value).forEach(([key, item]) => walk(item, visit, [...path, key]));
}

function uniqueSchemaConsts(): string[] {
  const values = new Set<string>();
  walk(schema, (value) => {
    if (value !== null && !Array.isArray(value) && typeof value === "object" && typeof value.const === "string") values.add(value.const);
  });
  return [...values].sort();
}

function schemaEnum(definition: string): string[] {
  const defs = (schema as any).$defs as Record<string, any>;
  return [...(defs[definition]?.enum ?? [])];
}

function schemaConstKinds(definition: string, property = "kind"): string[] {
  const defs = (schema as any).$defs as Record<string, any>;
  return [...new Set((defs[definition]?.oneOf ?? []).flatMap((item: any) => {
    const candidate = item?.properties?.[property];
    if (typeof candidate?.const === "string") return [candidate.const];
    if (Array.isArray(candidate?.enum)) return candidate.enum;
    return [];
  }))].sort();
}

function countString(value: Json, wanted: string): number {
  let count = 0;
  walk(value, (item) => { if (item === wanted) count += 1; });
  return count;
}

function countsFor(values: readonly string[]): Record<string, { packs: number; shapes: number; packFiles: number; shapeFiles: number }> {
  return Object.fromEntries(values.map((value) => {
    const packCounts = packs.map((item) => countString(item.value as unknown as Json, value));
    const shapeCounts = shapes.map((item) => countString(item.value as Json, value));
    return [value, {
      packs: packCounts.reduce((a, b) => a + b, 0),
      shapes: shapeCounts.reduce((a, b) => a + b, 0),
      packFiles: packCounts.filter(Boolean).length,
      shapeFiles: shapeCounts.filter(Boolean).length,
    }];
  }));
}

interface PositionProbe { readonly label: string; readonly fen: string }

function packPositions(pack: DrillPackDefinition): PositionProbe[] {
  const values: PositionProbe[] = [{ label: "/start/fen", fen: pack.start.fen }];
  const rootPosition = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
  const visit = (nodes: readonly DrillPackDefinition["spine"][number][], position: Chess, path: string): void => {
    for (const [index, node] of nodes.entries()) {
      const next = position.clone();
      const move = parseUci(node.moveUci);
      if (move === undefined || !next.isLegal(move)) continue;
      next.play(move);
      values.push({ label: `${path}/${index}:${node.id}`, fen: makeFen(next.toSetup()) });
      visit(node.children, next, `${path}/${index}/children`);
    }
  };
  visit(pack.spine ?? [], rootPosition, "/spine");
  return values;
}

function spinePaths(pack: DrillPackDefinition): readonly (readonly any[])[] {
  const paths: any[][] = [];
  const visit = (nodes: readonly any[], prefix: readonly any[]): void => {
    for (const node of nodes) {
      const path = [...prefix, node];
      paths.push(path);
      visit(node.children ?? [], path);
    }
  };
  visit(pack.spine ?? [], []);
  return paths;
}

function replayPackPaths(pack: DrillPackDefinition): readonly { readonly path: string; readonly events: readonly any[] }[] {
  return spinePaths(pack).map((path, pathIndex) => {
    let run = createRun({
      id: `audit-${pack.id}-${pathIndex}`,
      session: { kind: "pack", packId: pack.id, packDigest: `sha256:${"0".repeat(64)}`, start: pack.start, feedbackPolicy: pack.feedbackPolicy, opponentPolicy: pack.opponentPolicy as any },
      sessionDigest: `sha256:${"0".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 0,
      createdAt: "2000-01-01T00:00:00.000Z",
    });
    for (const [index, node] of path.entries()) {
      const before = run;
      const committed = commitMove(run, node.moveUci, { at: `2000-01-01T00:00:${String(index).padStart(2, "0")}.000Z` });
      run = orchestratePackMove(pack, before, committed).run;
    }
    return { path: path.map((node) => node.id).join(" → "), events: run.events };
  });
}

const synthetic: readonly PositionProbe[] = Object.freeze([
  { label: "initial", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" },
  { label: "kings-only", fen: "8/8/8/4k3/8/8/4K3/8 w - - 0 1" },
  { label: "direct-opposition", fen: "8/8/8/4k3/8/4K3/8/8 b - - 0 1" },
  { label: "distant-opposition", fen: "8/8/4k3/8/8/8/4K3/8 b - - 0 1" },
  { label: "white-material", fen: "4k3/8/8/8/8/8/P3K3/R2Q4 w - - 0 1" },
  { label: "black-material", fen: "r2q4/p3k3/8/8/8/8/8/4K3 b - - 0 1" },
  { label: "isolated-doubled", fen: "4k3/8/8/8/3P4/3P4/8/4K3 w - - 0 1" },
  { label: "backward-half-open-c", fen: "4k3/8/2p5/8/1P6/8/8/4K3 w - - 0 1" },
  { label: "passed-pawns", fen: "4k3/7p/8/4P3/8/8/P7/4K3 w - - 0 1" },
  { label: "bishops-both-shades", fen: "4k3/8/8/8/8/8/2B2B2/4K3 w - - 0 1" },
  { label: "open-sliders", fen: "4k3/8/8/8/3Q4/8/8/R3K3 w - - 0 1" },
  { label: "checkmate", fen: "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1" },
  { label: "stalemate", fen: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1" },
]);

type StaticTruth = { readonly value: boolean | null; readonly reason: string };

function staticFeatureTruth(feature: any): StaticTruth {
  if (["line_blockers", "direct_attack_count"].includes(feature.kind) && feature.comparison === "atLeast" && feature.count <= 0) {
    return { value: true, reason: `${feature.kind} is a non-negative count` };
  }
  if (feature.kind === "piece_reach_count" && feature.scope === "every" && feature.comparison === "atLeast" && feature.count <= 0) {
    return { value: true, reason: "every reach count is non-negative and every(empty) is vacuously true" };
  }
  if (feature.kind === "pawn_count") {
    const lower = feature.basis === "count" ? 0 : -8;
    const upper = 8;
    if (feature.comparison === "atLeast" && feature.count <= lower) return { value: true, reason: `pawn ${feature.basis} lower bound is ${lower}` };
    if (feature.comparison === "atMost" && feature.count >= upper) return { value: true, reason: `pawn ${feature.basis} upper bound is ${upper}` };
    if (feature.comparison === "atLeast" && feature.count > upper) return { value: false, reason: `pawn ${feature.basis} upper bound is ${upper}` };
    if (feature.comparison === "atMost" && feature.count < lower) return { value: false, reason: `pawn ${feature.basis} lower bound is ${lower}` };
    if (feature.comparison === "equal" && (feature.count < lower || feature.count > upper)) return { value: false, reason: `pawn ${feature.basis} range is ${lower}..${upper}` };
  }
  return { value: null, reason: "not statically decided by the audited algebra" };
}

function staticExpressionTruth(expression: StructuralExpression): StaticTruth {
  if (expression.kind === "feature") return staticFeatureTruth(expression.feature);
  if (expression.kind === "pieceOnSquare" || expression.kind === "quantified" || expression.kind === "mirrored") return { value: null, reason: "position-dependent" };
  if (expression.kind === "not") {
    const child = staticExpressionTruth(expression.of);
    return child.value === null ? child : { value: !child.value, reason: `negation of: ${child.reason}` };
  }
  const children = expression.of.map(staticExpressionTruth);
  if (expression.kind === "all") {
    const falseChild = children.find((child) => child.value === false);
    if (falseChild) return { value: false, reason: `conjunction contains false: ${falseChild.reason}` };
    if (children.every((child) => child.value === true)) return { value: true, reason: "every conjunct is statically true" };
  } else {
    const trueChild = children.find((child) => child.value === true);
    if (trueChild) return { value: true, reason: `disjunction contains true: ${trueChild.reason}` };
    if (children.every((child) => child.value === false)) return { value: false, reason: "every disjunct is statically false" };
  }
  return { value: null, reason: "contains position-dependent leaves" };
}

function materialScore(fen: string, color: "white" | "black"): number {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  return Object.entries(MATERIAL_VALUES).reduce((sum, [role, value]) => sum + position.board[role as keyof typeof MATERIAL_VALUES].intersect(position.board[color]).size() * value, 0);
}

function conditionMatches(condition: SuccessCondition, fen: string): boolean | null {
  if (condition.kind === "structural_feature") return matchesStructuralExpression(fen, condition.feature);
  if (condition.kind === "material_balance") {
    const actual = materialScore(fen, condition.perspective) - materialScore(fen, condition.perspective === "white" ? "black" : "white");
    return condition.comparison === "atLeast" ? actual >= condition.value : condition.comparison === "atMost" ? actual <= condition.value : actual === condition.value;
  }
  if (condition.kind === "rules_fact") {
    const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
    if (condition.fact === "checkmate") return position.isCheckmate() && (condition.winner === undefined || condition.winner === (position.turn === "white" ? "black" : "white"));
    return position.isStalemate();
  }
  if (condition.kind === "outcome") {
    const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
    if (condition.result === "draw") return position.isStalemate() || position.isInsufficientMaterial() || position.halfmoves >= 100;
    if (!position.isCheckmate()) return false;
    const winner = position.turn === "white" ? "black" : "white";
    return condition.result === "win" ? winner === "white" : winner === "black";
  }
  return null;
}

interface AuthoredCondition {
  readonly pack: string;
  readonly path: string;
  readonly objectiveType: string;
  readonly condition: SuccessCondition;
}

function authoredConditions(): AuthoredCondition[] {
  const result: AuthoredCondition[] = [];
  for (const { name, value: pack } of packs) {
    for (const [index, condition] of (pack.objective.successConditions ?? []).entries()) result.push({ pack: name, path: `/objective/successConditions/${index}`, objectiveType: pack.objective.type, condition });
    for (const [legIndex, leg] of (pack.legs ?? []).entries()) for (const [index, condition] of (leg.objective.successConditions ?? []).entries()) result.push({ pack: name, path: `/legs/${legIndex}/objective/successConditions/${index}`, objectiveType: leg.objective.type, condition });
  }
  return result;
}

function conditionAudit(): unknown[] {
  const byPack = new Map(packs.map(({ name, value }) => [name, packPositions(value)]));
  const replayed = new Map(packs.map(({ name, value }) => {
    try { return [name, { paths: replayPackPaths(value), error: null }] as const; }
    catch (error) { return [name, { paths: [], error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) }] as const; }
  }));
  return authoredConditions().map((authored) => {
    const local = byPack.get(authored.pack)!;
    const probes = [...local, ...synthetic];
    const values = probes.map((probe) => ({ ...probe, value: conditionMatches(authored.condition, probe.fen) }));
    const evaluated = values.filter((item) => item.value !== null);
    const replay = replayed.get(authored.pack)!;
    const eventMatches = authored.condition.kind === "reach_checkpoint"
      ? replay.paths.filter((path) => path.events.some((event) => event.type === "checkpoint.reached" && event.data.checkpointId === authored.condition.checkpointId)).map((path) => path.path)
      : authored.condition.kind === "outcome"
        ? replay.paths.filter((path) => path.events.some((event) => event.type === "outcome.reached" && event.data.outcome === authored.condition.result)).map((path) => path.path)
        : [];
    let compile: "ok" | string = "ok";
    try {
      const pack = packs.find((item) => item.name === authored.pack)!.value;
      const objective = authored.path.startsWith("/legs/") ? pack.legs![Number(authored.path.split("/")[2])]!.objective : pack.objective;
      objectiveRules(pack, objective);
    } catch (error) {
      compile = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    }
    return {
      pack: authored.pack,
      path: authored.path,
      objectiveType: authored.objectiveType,
      kind: authored.condition.kind,
      condition: authored.condition,
      staticTruth: authored.condition.kind === "structural_feature" ? staticExpressionTruth(authored.condition.feature) : { value: null, reason: "not a structural expression" },
      localPositions: local.length,
      evaluatedPositions: evaluated.length,
      localTrue: values.slice(0, local.length).filter((item) => item.value === true).map((item) => item.label),
      localFalse: values.slice(0, local.length).filter((item) => item.value === false).map((item) => item.label),
      syntheticTrue: values.slice(local.length).filter((item) => item.value === true).map((item) => item.label),
      syntheticFalse: values.slice(local.length).filter((item) => item.value === false).map((item) => item.label),
      constant: evaluated.length === 0 ? "event-dependent" : evaluated.every((item) => item.value === true) ? "always-true-on-probes" : evaluated.every((item) => item.value === false) ? "never-true-on-probes" : "varies",
      compile,
      replayError: replay.error,
      matchingSpinePaths: eventMatches.slice(0, 10),
    };
  });
}

function checkpointAudit(): unknown[] {
  return packs.flatMap(({ name, value: pack }) => {
    let paths: readonly { readonly path: string; readonly events: readonly any[] }[] = [];
    let replayError: string | null = null;
    try { paths = replayPackPaths(pack); } catch (error) { replayError = error instanceof Error ? `${error.name}: ${error.message}` : String(error); }
    return pack.checkpoints.map((checkpoint, index) => {
      const matching = paths.filter((path) => path.events.some((event) => event.type === "checkpoint.reached" && event.data.checkpointId === checkpoint.id)).map((path) => path.path);
      return { pack: name, path: `/checkpoints/${index}`, id: checkpoint.id, trigger: checkpoint.trigger, matchingSpinePathCount: matching.length, matchingSpinePaths: matching.slice(0, 5), replayError };
    });
  });
}

function allExpressions(): { source: "pack" | "shape"; file: string; path: string; expression: StructuralExpression }[] {
  const result: { source: "pack" | "shape"; file: string; path: string; expression: StructuralExpression }[] = [];
  const scan = (source: "pack" | "shape", file: string, value: Json): void => {
    walk(value, (item, path) => {
      if (item === null || Array.isArray(item) || typeof item !== "object") return;
      const parent = path.at(-1);
      if (item.kind === "structural_feature" && item.feature && typeof item.feature === "object") result.push({ source, file, path: `/${path.join("/")}/feature`, expression: item.feature as unknown as StructuralExpression });
      else if (item.type === "structuralFeature" && item.feature && typeof item.feature === "object") result.push({ source, file, path: `/${path.join("/")}/feature`, expression: item.feature as unknown as StructuralExpression });
      else if (parent === "trigger" && typeof item.kind === "string" && ["all", "any", "not", "feature", "pieceOnSquare", "mirrored", "quantified"].includes(item.kind)) result.push({ source, file, path: `/${path.join("/")}`, expression: item as unknown as StructuralExpression });
      else if (parent === "signature" && typeof item.kind === "string") result.push({ source, file, path: `/${path.join("/")}`, expression: item as unknown as StructuralExpression });
      else if (item.kind === "structural" && item.expression && typeof item.expression === "object") result.push({ source, file, path: `/${path.join("/")}/expression`, expression: item.expression as unknown as StructuralExpression });
    });
  };
  packs.forEach(({ name, value }) => scan("pack", name, value as unknown as Json));
  shapes.forEach(({ name, value }) => scan("shape", name, value as Json));
  const unique = new Map(result.map((entry) => [`${entry.source}:${entry.file}:${entry.path}`, entry]));
  return [...unique.values()];
}

function expressionAudit(): unknown[] {
  const catalog = packs.flatMap(({ name, value }) => packPositions(value).map((probe) => ({ ...probe, label: `${name}:${probe.label}` })));
  const probes = [...catalog, ...synthetic];
  return allExpressions().map((entry) => {
    const results = probes.map((probe) => ({ label: probe.label, value: matchesStructuralExpression(probe.fen, entry.expression) }));
    return {
      ...entry,
      expression: entry.expression,
      positions: results.length,
      trueCount: results.filter((item) => item.value).length,
      falseCount: results.filter((item) => !item.value).length,
      constant: results.every((item) => item.value) ? "always-true-on-catalog-and-synthetic" : results.every((item) => !item.value) ? "never-true-on-catalog-and-synthetic" : "varies",
      staticTruth: staticExpressionTruth(entry.expression),
      trueExamples: results.filter((item) => item.value).slice(0, 5).map((item) => item.label),
      falseExamples: results.filter((item) => !item.value).slice(0, 5).map((item) => item.label),
    };
  });
}

function semanticUsage(): unknown {
  const objective = new Map<string, { occurrences: number; files: Set<string> }>();
  const conditions = new Map<string, { occurrences: number; files: Set<string> }>();
  const deviationUses = new Map<string, { occurrences: number; files: Set<string> }>();
  const bump = (map: Map<string, { occurrences: number; files: Set<string> }>, key: string, file: string): void => {
    const row = map.get(key) ?? { occurrences: 0, files: new Set<string>() };
    row.occurrences += 1; row.files.add(file); map.set(key, row);
  };
  for (const { name, value: pack } of packs) {
    bump(objective, pack.objective.type, name);
    (pack.objective.successConditions ?? []).forEach((condition) => bump(conditions, condition.kind, name));
    for (const leg of pack.legs ?? []) {
      bump(objective, leg.objective.type, name);
      (leg.objective.successConditions ?? []).forEach((condition) => bump(conditions, condition.kind, name));
    }
    (pack.deviations ?? []).forEach((deviation) => bump(deviationUses, deviation.class, name));
  }
  const render = (values: readonly string[], map: Map<string, { occurrences: number; files: Set<string> }>) => Object.fromEntries(values.map((value) => [value, { occurrences: map.get(value)?.occurrences ?? 0, files: [...(map.get(value)?.files ?? [])].sort() }]));
  return { objectiveTypes: render(objectiveTypes, objective), conditionKinds: render(conditionKinds, conditions), deviations: render(deviations, deviationUses) };
}

function d32ObjectiveMatrix(): unknown[] {
  const base = structuredClone(packs.find((item) => item.value.objective.type === "play_until_checkpoint")!.value) as any;
  const condition = { kind: "structural_feature", feature: { kind: "pieceOnSquare", square: "e1", piece: { color: "white", role: "king" } } };
  const validationExecutes = new Set(["reach_structure", "preserve_plan_window", "execute_break", "prevent_opponent_plan", "transition_to_endgame"]);
  return objectiveTypes.map((type) => {
    const objective: any = { type, successConditions: [condition] };
    if (["win", "hold", "save", "resist"].includes(type)) objective.grading = { assessedBy: { kind: "authored", note: "probe" }, resolveAt: type === "resist" ? { kind: "checkpoint", checkpointId: base.checkpoints[0].id } : { kind: "terminal" } };
    let compile: string;
    try { compile = `ok:${objectiveRules(base, objective).length}`; }
    catch (error) { compile = error instanceof Error ? `${error.name}: ${error.message}` : String(error); }
    return { objectiveType: type, validationCallsObjectiveRules: validationExecutes.has(type), playCompilesCondition: type !== "run_trajectory", compile };
  });
}

function refusalCodes(): unknown[] {
  const validationSource = readFileSync(join(root, "apps/server/src/pack-validation.ts"), "utf8");
  const lintSource = readFileSync(join(root, "packages/schema/src/drill-pack/lint.ts"), "utf8");
  const codes = new Map<string, string>();
  for (const match of validationSource.matchAll(/runtimeIssue\(\s*"([A-Z][A-Z0-9_]+)"/g)) codes.set(match[1]!, "runtime");
  for (const match of validationSource.matchAll(/code:\s*"([A-Z][A-Z0-9_]+)"/g)) codes.set(match[1]!, "runtime");
  for (const match of lintSource.matchAll(/\|\s*"([A-Z][A-Z0-9_]+)"/g)) codes.set(match[1]!, "lint");
  const testSources = readdirSync(join(root, "apps/server/src")).filter((name) => name.endsWith(".test.ts")).map((name) => readFileSync(join(root, "apps/server/src", name), "utf8")).join("\n")
    + readFileSync(join(root, "packages/schema/src/drill-pack.test.ts"), "utf8");
  return [...codes].sort(([a], [b]) => a.localeCompare(b)).map(([code, source]) => ({ code, source, assertions: [...testSources.matchAll(new RegExp(`\\b${code}\\b`, "g"))].length }));
}

function compileAudit(): unknown[] {
  const result: unknown[] = [];
  for (const { name, value: pack } of packs) {
    const objectives = [{ path: "/objective", value: pack.objective }, ...(pack.legs ?? []).map((leg, index) => ({ path: `/legs/${index}/objective`, value: leg.objective }))];
    for (const objective of objectives) {
      try {
        const rules = objectiveRules(pack, objective.value);
        result.push({ pack: name, path: objective.path, type: objective.value.type, rules: rules.length, status: "ok" });
      } catch (error) {
        result.push({ pack: name, path: objective.path, type: objective.value.type, rules: null, status: error instanceof Error ? `${error.name}: ${error.message}` : String(error) });
      }
    }
  }
  return result;
}

const objectiveTypes = schemaEnum("objectiveType");
const conditionKinds = schemaConstKinds("successCondition");
const featureKinds = schemaConstKinds("structuralFeature");
const expressionKinds = schemaConstKinds("structuralExpression");
const fenPredicateKinds = schemaConstKinds("fenPredicate", "type");
const deviations = ((schema as any).$defs.deviation.properties.class.enum as string[]).slice();
const consts = uniqueSchemaConsts();

process.stdout.write(`${JSON.stringify({
  generatedAt: new Date().toISOString(),
  census: { packs: packs.length, browserFixtures: browserFixtureFiles.length, shapes: shapes.length, schemaConstLiterals: consts.length, objectiveTypes: objectiveTypes.length },
  consts: countsFor(consts),
  objectiveTypes: countsFor(objectiveTypes),
  conditionKinds: countsFor(conditionKinds),
  featureKinds: countsFor(featureKinds),
  expressionKinds: countsFor(expressionKinds),
  fenPredicateKinds: countsFor(fenPredicateKinds),
  deviations: countsFor(deviations),
  conditions: conditionAudit(),
  checkpoints: checkpointAudit(),
  expressions: expressionAudit(),
  compilation: compileAudit(),
  semanticUsage: semanticUsage(),
  d32ObjectiveMatrix: d32ObjectiveMatrix(),
  refusalCodes: refusalCodes(),
}, null, 2)}\n`);
