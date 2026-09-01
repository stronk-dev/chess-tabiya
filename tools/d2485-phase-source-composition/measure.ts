import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import type { DrillPackDefinition, SpineNode } from "../../packages/schema/src/drill-pack/index.js";
import { parseUci } from "chessops/util";
import {
  compileLoadedOpeningCatalogue,
  measuredOpeningHistory,
  measuredPhaseSourcePoint,
  type RecordedTablebaseFact,
} from "./compose.js";

type Point = ReturnType<typeof measuredPhaseSourcePoint>;

function play(fen: string, uci: string): string {
  const board = positionFromFen(fen);
  const move = parseUci(uci);
  if (move === undefined || !board.isLegal(move)) throw new TypeError(`illegal authored move ${uci}`);
  board.play(move);
  return canonicalFen(board);
}

function evidenceFor(root: string, packId: string): Map<string, RecordedTablebaseFact> {
  const file = resolve(root, `${packId}.evidence.json`);
  if (!existsSync(file)) return new Map();
  const value = JSON.parse(readFileSync(file, "utf8")) as { records?: readonly { kind?: string; anchor?: { fen?: string }; sourceId?: string; values?: Record<string, unknown> }[] };
  const result = new Map<string, RecordedTablebaseFact>();
  for (const row of value.records ?? []) {
    if (row.kind !== "tablebase_result" || typeof row.anchor?.fen !== "string" || typeof row.sourceId !== "string" || typeof row.values?.pieceCount !== "number" || typeof row.values.category !== "string") continue;
    const fen = canonicalFen(positionFromFen(row.anchor.fen));
    result.set(fen, Object.freeze({ fen, pieceCount: row.values.pieceCount, category: row.values.category, sourceId: row.sourceId }));
  }
  return result;
}

function packPopulation(pack: DrillPackDefinition, opening: Parameters<typeof measuredPhaseSourcePoint>[0], evidenceRoot: string) {
  const tablebase = evidenceFor(evidenceRoot, pack.id);
  const root = measuredPhaseSourcePoint(opening, "$start", pack.start.fen, tablebase.get(canonicalFen(positionFromFen(pack.start.fen))));
  const nodes: Point[] = [root];
  const paths: Point[][] = [];
  const walk = (children: readonly SpineNode[], parent: Point, prefix: readonly Point[]): void => {
    if (children.length === 0) {
      paths.push([...prefix]);
      return;
    }
    for (const child of children) {
      const fen = play(parent.position.fen, child.moveUci);
      const point = measuredPhaseSourcePoint(opening, child.id, fen, tablebase.get(fen));
      nodes.push(point);
      walk(child.children, point, [...prefix, point]);
    }
  };
  walk(pack.spine ?? [], root, [root]);
  return Object.freeze({ packId: pack.id, nodes: Object.freeze(nodes), paths: Object.freeze(paths.map((path) => Object.freeze(path))) });
}

function count<T extends string>(values: readonly T[]): Readonly<Record<T, number>> {
  return Object.freeze(Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((candidate) => candidate === value).length])) as Record<T, number>);
}

function sourceState(point: Point): string {
  return [
    `endpoint:${point.opening.currentEndpoint.kind}`,
    `membership:${point.opening.catalogueMembership.kind}`,
    `phase:${point.rulesPhase.reading.phase}`,
    `endgame:${point.rulesEndgame.kind === "not_applicable" ? "not_applicable" : point.rulesEndgame.reading.type?.id ?? "untyped"}`,
    `tablebase:${point.recordedTablebase.kind}`,
  ].join("|");
}

function changes<T>(path: readonly T[], project: (value: T) => string): number {
  let total = 0;
  for (let index = 1; index < path.length; index += 1) if (project(path[index - 1]!) !== project(path[index]!)) total += 1;
  return total;
}

function transitionMatrix<T>(paths: readonly { readonly path: readonly T[] }[], project: (value: T) => string): Readonly<Record<string, number>> {
  const transitions: string[] = [];
  for (const { path } of paths) {
    for (let index = 1; index < path.length; index += 1) {
      const before = project(path[index - 1]!);
      const after = project(path[index]!);
      if (before !== after) transitions.push(`${before}->${after}`);
    }
  }
  return count(transitions);
}

export function phaseSourceCompositionCensus(packs: readonly DrillPackDefinition[], artifact: unknown, evidenceRoot: string) {
  const catalogue = compileLoadedOpeningCatalogue(artifact);
  const opening = Object.freeze({ kind: "available" as const, catalogue });
  const populations = packs.map((pack) => packPopulation(pack, opening, evidenceRoot)).sort((left, right) => left.packId.localeCompare(right.packId));
  const nodes = populations.flatMap((pack) => pack.nodes);
  const paths = populations.flatMap((pack) => pack.paths.map((path) => ({ packId: pack.packId, path })));
  const endpoint = (point: Point) => point.opening.currentEndpoint.kind;
  const membership = (point: Point) => point.opening.catalogueMembership.kind;
  const phase = (point: Point) => point.rulesPhase.reading.phase;
  const endgame = (point: Point) => point.rulesEndgame.kind === "not_applicable" ? "not_applicable" : point.rulesEndgame.reading.type?.id ?? "untyped";
  const tablebase = (point: Point) => point.recordedTablebase.kind;
  const openingPhaseMatrix = count(nodes.map((point) => `${membership(point)}|${phase(point)}`));
  const endpointPhaseMatrix = count(nodes.map((point) => `${endpoint(point)}|${phase(point)}`));
  const tablebasePhaseMatrix = count(nodes.map((point) => `${tablebase(point)}|${phase(point)}`));
  const history = paths.map(({ packId, path }) => ({ packId, history: measuredOpeningHistory(opening, path) }));

  return Object.freeze({
    schema: "tabiya.research.phase-source-composition.v1",
    boundary: "Source-retaining corpus composition; no merged phase truth, precedence or learner advice",
    catalogue: catalogue.ref,
    corpus: Object.freeze({ packs: populations.length, positions: nodes.length, paths: paths.length, pathPositionOccurrences: paths.reduce((sum, item) => sum + item.path.length, 0) }),
    sourceReach: Object.freeze({
      endpoint: count(nodes.map(endpoint)),
      membership: count(nodes.map(membership)),
      phase: count(nodes.map(phase)),
      decisionArm: count(nodes.map((point) => point.rulesPhase.decision.kind)),
      endgame: count(nodes.map(endgame)),
      currentTechniqueCandidates: count(nodes.flatMap((point) => point.rulesEndgame.kind === "classified" ? point.rulesEndgame.reading.techniques.map((technique) => technique.id) : [])),
      recordedTablebase: count(nodes.map(tablebase)),
      openingPhaseMatrix,
      endpointPhaseMatrix,
      tablebasePhaseMatrix,
    }),
    history: Object.freeze({
      deepestOpening: count(history.map((item) => item.history.kind)),
      pathsWithNamedEndpoint: history.filter((item) => item.history.kind === "matched").length,
      endpointChanges: paths.reduce((sum, item) => sum + changes(item.path, endpoint), 0),
      membershipChanges: paths.reduce((sum, item) => sum + changes(item.path, membership), 0),
      phaseChanges: paths.reduce((sum, item) => sum + changes(item.path, phase), 0),
      endgameChanges: paths.reduce((sum, item) => sum + changes(item.path, endgame), 0),
      tablebaseChanges: paths.reduce((sum, item) => sum + changes(item.path, tablebase), 0),
      compositeStateChanges: paths.reduce((sum, item) => sum + changes(item.path, sourceState), 0),
      endpointTransitions: transitionMatrix(paths, endpoint),
      membershipTransitions: transitionMatrix(paths, membership),
      phaseTransitions: transitionMatrix(paths, phase),
      endgameTransitions: transitionMatrix(paths, endgame),
      tablebaseTransitions: transitionMatrix(paths, tablebase),
    }),
    invariants: Object.freeze({
      matchedEndpointWithoutMembership: nodes.filter((point) => point.opening.currentEndpoint.kind === "matched" && point.opening.catalogueMembership.kind !== "member").length,
      endgameApplicabilityMismatch: nodes.filter((point) => (point.rulesPhase.reading.phase === "endgame") !== (point.rulesEndgame.kind === "classified")).length,
      recordedTablebaseOutsideDomain: nodes.filter((point) => point.recordedTablebase.kind === "recorded" && point.recordedTablebase.pieceCount > 7).length,
      collapsedTopLevelPhaseField: 0,
    }),
    samples: Object.freeze(populations.map((pack) => Object.freeze({
      packId: pack.packId,
      root: pack.nodes[0],
      positions: pack.nodes.length,
      paths: pack.paths.length,
    }))),
  });
}

function packFiles(root: string): readonly string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !/\.(?:browser|evidence|job|sources)\.json$/u.test(entry.name))
    .map((entry) => resolve(root, entry.name))
    .sort();
}

const drafts = resolve(process.argv[2] ?? "content/drafts");
const artifactFile = resolve(process.argv[3] ?? "apps/server/artifacts/runtime-opening-catalogue.json");
const out = resolve(process.argv[4] ?? "planning/phase-source-composition/results.json");
const packs = packFiles(drafts).map((file) => JSON.parse(readFileSync(file, "utf8")) as DrillPackDefinition);
const report = phaseSourceCompositionCensus(packs, JSON.parse(readFileSync(artifactFile, "utf8")), drafts);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`phase-source-composition: ${report.corpus.positions} positions / ${report.corpus.paths} paths; endpoint ${JSON.stringify(report.sourceReach.endpoint)}; membership ${JSON.stringify(report.sourceReach.membership)}; phase ${JSON.stringify(report.sourceReach.phase)}; tablebase ${JSON.stringify(report.sourceReach.recordedTablebase)}; invariant failures ${Object.values(report.invariants).reduce((sum, value) => sum + value, 0)}\n`);
