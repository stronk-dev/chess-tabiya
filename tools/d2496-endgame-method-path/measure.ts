import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { Color } from "chessops/types";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import type { DrillPackDefinition, SpineNode } from "../../packages/schema/src/drill-pack/index.js";
import { krpkrGeometry } from "../d2495-endgame-technique-applicability/geometry.js";
import {
  observedMethodStages,
  parseMethodUci,
  type MethodPathStep,
  type MethodStageEvent,
  type MethodTechnique,
} from "./method.js";

interface AuthoredPath {
  readonly packId: string;
  readonly pathId: string;
  readonly steps: readonly MethodPathStep[];
}

interface SetupArrival {
  readonly packId: string;
  readonly pathId: string;
  readonly technique: MethodTechnique;
  readonly moveUci: string;
  readonly afterFen: string;
}

function play(fen: string, moveUci: string): string {
  const board = positionFromFen(fen);
  const move = parseMethodUci(moveUci);
  if (move === undefined || !board.isLegal(move)) throw new TypeError(`illegal authored move ${moveUci} after ${fen}`);
  board.play(move);
  return canonicalFen(board);
}

function authoredPaths(pack: DrillPackDefinition): readonly AuthoredPath[] {
  const paths: AuthoredPath[] = [];
  const walk = (
    nodes: readonly SpineNode[],
    parentFen: string,
    prior: readonly MethodPathStep[],
    ids: readonly string[],
  ): void => {
    if (nodes.length === 0) {
      if (prior.length > 0) paths.push(Object.freeze({ packId: pack.id, pathId: ids.join("/"), steps: Object.freeze([...prior]) }));
      return;
    }
    for (const node of nodes) {
      const beforeFen = canonicalFen(positionFromFen(parentFen));
      const afterFen = play(beforeFen, node.moveUci);
      const step = Object.freeze({ moveUci: node.moveUci, beforeFen, afterFen });
      walk(node.children, afterFen, [...prior, step], [...ids, node.id]);
    }
  };
  walk(pack.spine ?? [], pack.start.fen, [], []);
  return Object.freeze(paths);
}

function packFiles(root: string): readonly string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !/\.(?:browser|evidence|job|sources)\.json$/u.test(entry.name))
    .map((entry) => resolve(root, entry.name))
    .sort();
}

function tablebaseCategories(root: string, packId: string): ReadonlyMap<string, string> {
  const path = resolve(root, `${packId}.evidence.json`);
  if (!existsSync(path)) return new Map();
  const document = JSON.parse(readFileSync(path, "utf8")) as {
    readonly records?: readonly {
      readonly kind?: string;
      readonly anchor?: { readonly fen?: string };
      readonly values?: { readonly category?: unknown };
    }[];
  };
  const rows = new Map<string, string>();
  for (const record of document.records ?? []) {
    if (record.kind !== "tablebase_result" || typeof record.anchor?.fen !== "string" || typeof record.values?.category !== "string") continue;
    rows.set(canonicalFen(positionFromFen(record.anchor.fen)), record.values.category);
  }
  return rows;
}

function outcomeFor(category: string | undefined, fen: string, beneficiary: Color): string | null {
  if (category === undefined) return null;
  if (category === "draw") return category;
  const sideToMove: Color = canonicalFen(positionFromFen(fen)).split(" ")[1] === "w" ? "white" : "black";
  if (sideToMove === beneficiary) return category;
  if (category === "win") return "loss";
  if (category === "loss") return "win";
  return category;
}

function setupFlags(fen: string): Readonly<Record<MethodTechnique, boolean>> {
  const geometry = krpkrGeometry(fen);
  return Object.freeze({
    lucena: geometry?.lucenaCanonicalSetup ?? false,
    philidor: geometry?.philidorCanonicalSetup ?? false,
    vancura: geometry?.vancuraCanonicalSetup ?? false,
  });
}

function setupArrivals(path: AuthoredPath): readonly SetupArrival[] {
  const rows: SetupArrival[] = [];
  for (const step of path.steps) {
    const before = setupFlags(step.beforeFen);
    const after = setupFlags(step.afterFen);
    for (const technique of ["lucena", "philidor", "vancura"] as const) {
      if (!before[technique] && after[technique]) {
        rows.push(Object.freeze({ packId: path.packId, pathId: path.pathId, technique, moveUci: step.moveUci, afterFen: step.afterFen }));
      }
    }
  }
  return Object.freeze(rows);
}

function count(values: readonly string[]): Readonly<Record<string, number>> {
  return Object.freeze(Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((candidate) => candidate === value).length])));
}

function canonicalVancuraControl(): readonly MethodPathStep[] {
  const start = "R7/6k1/P4r2/8/2K5/8/8/8 w - - 0 1";
  const first = play(start, "a6a7");
  return Object.freeze([
    Object.freeze({ moveUci: "a6a7", beforeFen: canonicalFen(positionFromFen(start)), afterFen: first }),
    Object.freeze({ moveUci: "f6a6", beforeFen: first, afterFen: play(first, "f6a6") }),
  ]);
}

function eventRow(packId: string, pathId: string, tablebase: ReadonlyMap<string, string>, event: MethodStageEvent) {
  const beforeOutcome = outcomeFor(tablebase.get(canonicalFen(positionFromFen(event.beforeFen))), event.beforeFen, event.beneficiary);
  const afterOutcome = outcomeFor(tablebase.get(canonicalFen(positionFromFen(event.afterFen))), event.afterFen, event.beneficiary);
  return Object.freeze({
    packId,
    pathId,
    technique: event.technique,
    stage: event.stage,
    beneficiary: event.beneficiary,
    moveUci: event.moveUci,
    beforeFen: event.beforeFen,
    afterFen: event.afterFen,
    beforeOutcome,
    afterOutcome,
    recordedOutcomePreserved: beforeOutcome !== null && beforeOutcome === afterOutcome,
  });
}

export function measureEndgameMethodPaths(packs: readonly DrillPackDefinition[], root: string) {
  const paths = packs.flatMap(authoredPaths);
  const events = paths.flatMap((path) => {
    const tablebase = tablebaseCategories(root, path.packId);
    return observedMethodStages(path.steps).map((event) => eventRow(path.packId, path.pathId, tablebase, event));
  });
  const arrivals = paths.flatMap(setupArrivals);
  const vancura = canonicalVancuraControl();
  const vancuraEvents = observedMethodStages(vancura);
  return Object.freeze({
    schema: "tabiya.research.endgame-method-path.v1",
    boundary: "Observed authored-path stages and witnessed setup arrivals only; no best-play reachability, advice, correctness or universal technique verdict",
    corpus: Object.freeze({ packs: packs.length, authoredRootToLeafPaths: paths.length, pathsWithObservedStages: new Set(events.map((row) => `${row.packId}:${row.pathId}`)).size }),
    observedStages: Object.freeze({
      total: events.length,
      byStage: count(events.map((row) => row.stage)),
      byPack: count(events.map((row) => row.packId)),
      withBothTablebaseOutcomes: events.filter((row) => row.beforeOutcome !== null && row.afterOutcome !== null).length,
      withRecordedOutcomePreserved: events.filter((row) => row.recordedOutcomePreserved).length,
      rows: events,
    }),
    witnessedSetupArrivals: Object.freeze({ total: arrivals.length, byTechnique: count(arrivals.map((row) => row.technique)), rows: arrivals }),
    canonicalVancuraControl: Object.freeze({
      startFen: vancura[0]?.beforeFen,
      moves: vancura.map((step) => step.moveUci),
      stages: vancuraEvents.map((event) => event.stage),
      tablebaseObservation: Object.freeze({
        rootCategory: "draw",
        afterA7Category: "draw",
        drawPreservingDefenderReplies: Object.freeze(["f6f4", "f6a6"]),
        nonPreservingDefenderReplies: 16,
        rootUrl: "https://tablebase.lichess.ovh/standard?fen=R7%2F6k1%2FP4r2%2F8%2F2K5%2F8%2F8%2F8%20w%20-%20-%200%201",
        afterA7Url: "https://tablebase.lichess.ovh/standard?fen=R7%2FP5k1%2F5r2%2F8%2F2K5%2F8%2F8%2F8%20b%20-%20-%200%201",
        scope: "Externally probed fixed control; the local detector verifies stage identity only",
      }),
    }),
    reachabilityClaimsNotMeasured: Object.freeze(["possible_under_cooperation", "forceable_against_all_replies", "inevitable_under_all_moves"]),
  });
}

const draftRoot = resolve(process.argv[2] ?? "content/drafts");
const output = resolve(process.argv[3] ?? "planning/endgame-method-path/results.json");
const packs = packFiles(draftRoot).map((file) => JSON.parse(readFileSync(file, "utf8")) as DrillPackDefinition);
const report = measureEndgameMethodPaths(packs, draftRoot);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`endgame-method-path: ${report.corpus.authoredRootToLeafPaths} paths; ${report.observedStages.total} observed stages; ${report.witnessedSetupArrivals.total} witnessed setup arrivals\n`);
