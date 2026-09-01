import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import type { DrillPackDefinition, SpineNode } from "../../packages/schema/src/drill-pack/index.js";
import { parseUci } from "chessops/util";
import { krpkrGeometry, type KrpKrGeometry } from "./geometry.js";

interface MeasuredPosition {
  readonly packId: string;
  readonly nodeId: string;
  readonly geometry: KrpKrGeometry;
  readonly recordedTablebase: string | null;
  readonly attackerTablebaseOutcome: string | null;
}

function play(fen: string, uci: string): string {
  const board = positionFromFen(fen);
  const move = parseUci(uci);
  if (move === undefined || !board.isLegal(move)) throw new TypeError(`illegal authored move ${uci}`);
  board.play(move);
  return canonicalFen(board);
}

function evidenceCategories(root: string, packId: string): ReadonlyMap<string, string> {
  const file = resolve(root, `${packId}.evidence.json`);
  if (!existsSync(file)) return new Map();
  const document = JSON.parse(readFileSync(file, "utf8")) as {
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

function packPositions(pack: DrillPackDefinition, root: string): readonly MeasuredPosition[] {
  const tablebase = evidenceCategories(root, pack.id);
  const measured: MeasuredPosition[] = [];
  const add = (nodeId: string, fen: string): string => {
    const canonical = canonicalFen(positionFromFen(fen));
    const geometry = krpkrGeometry(canonical);
    if (geometry !== null) {
      const recordedTablebase = tablebase.get(canonical) ?? null;
      const sideToMove = canonical.split(" ")[1] === "w" ? "white" : "black";
      const attackerTablebaseOutcome = recordedTablebase === null || recordedTablebase === "draw"
        ? recordedTablebase
        : sideToMove === geometry.attacker
          ? recordedTablebase
          : recordedTablebase === "win" ? "loss" : recordedTablebase === "loss" ? "win" : recordedTablebase;
      measured.push(Object.freeze({ packId: pack.id, nodeId, geometry, recordedTablebase, attackerTablebaseOutcome }));
    }
    return canonical;
  };
  const walk = (children: readonly SpineNode[], parentFen: string): void => {
    for (const child of children) {
      const fen = add(child.id, play(parentFen, child.moveUci));
      walk(child.children, fen);
    }
  };
  const rootFen = add("$start", pack.start.fen);
  walk(pack.spine ?? [], rootFen);
  return Object.freeze(measured);
}

function count(values: readonly string[]): Readonly<Record<string, number>> {
  return Object.freeze(Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((candidate) => candidate === value).length])));
}

function boolCount(rows: readonly MeasuredPosition[], field: keyof KrpKrGeometry): number {
  return rows.filter((row) => row.geometry[field] === true).length;
}

function packFiles(root: string): readonly string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !/\.(?:browser|evidence|job|sources)\.json$/u.test(entry.name))
    .map((entry) => resolve(root, entry.name))
    .sort();
}

export function measureTechniqueApplicability(packs: readonly DrillPackDefinition[], root: string) {
  const rows = packs.flatMap((pack) => packPositions(pack, root));
  const setupFields = ["lucenaCanonicalSetup", "philidorCanonicalSetup", "vancuraCanonicalSetup"] as const;
  const candidates = Object.freeze(Object.fromEntries(setupFields.map((field) => [field, boolCount(rows, field)])));
  const candidateRows = Object.freeze(Object.fromEntries(setupFields.map((field) => [field, rows
    .filter((row) => row.geometry[field])
    .map((row) => Object.freeze({ packId: row.packId, nodeId: row.nodeId, fen: row.geometry.fen, recordedTablebase: row.recordedTablebase, attackerTablebaseOutcome: row.attackerTablebaseOutcome }))])));
  return Object.freeze({
    schema: "tabiya.research.endgame-technique-applicability.v1",
    boundary: "Published necessary/canonical setup geometry only; no method applicability, reachability, advice or universal chess-truth label",
    corpus: Object.freeze({ packs: packs.length, krpkrPositions: rows.length, packsWithKrpkr: new Set(rows.map((row) => row.packId)).size }),
    currentMaterialLabels: Object.freeze({ lucena: rows.length, philidor: rows.length, vancura: rows.filter((row) => row.geometry.rookPawn).length }),
    operands: Object.freeze({
      rookPawn: boolCount(rows, "rookPawn"),
      pawnRank: count(rows.map((row) => String(row.geometry.pawnRank))),
      attackerKingOnPromotionSquare: boolCount(rows, "attackerKingOnPromotionSquare"),
      defenderKingOnPromotionSquareOrAdjacent: boolCount(rows, "defenderKingOnPromotionSquareOrAdjacent"),
      attackerKingBeyondDefenderThird: boolCount(rows, "attackerKingBeyondDefenderThird"),
      defenderRookOnThirdRank: boolCount(rows, "defenderRookOnThirdRank"),
      attackerRookCutsDefenderKingByFile: boolCount(rows, "attackerRookCutsDefenderKingByFile"),
      attackerRookInFrontOfPawn: boolCount(rows, "attackerRookInFrontOfPawn"),
      defenderRookAttacksPawnFromSide: boolCount(rows, "defenderRookAttacksPawnFromSide"),
      defenderKingBeyondSideRook: boolCount(rows, "defenderKingBeyondSideRook"),
      defenderKingAtOppositeCornerBand: boolCount(rows, "defenderKingAtOppositeCornerBand"),
    }),
    canonicalSetupCandidates: candidates,
    tablebase: Object.freeze({
      rawSideToMove: count(rows.map((row) => row.recordedTablebase ?? "not_recorded")),
      attackerOutcome: count(rows.map((row) => row.attackerTablebaseOutcome ?? "not_recorded")),
      attackerOutcomeByCandidate: Object.freeze(Object.fromEntries(setupFields.map((field) => [field, count(rows.filter((row) => row.geometry[field]).map((row) => row.attackerTablebaseOutcome ?? "not_recorded"))]))),
    }),
    candidateRows,
    invariants: Object.freeze({
      materialLabelsMinusCanonicalLucena: rows.length - candidates.lucenaCanonicalSetup,
      materialLabelsMinusCanonicalPhilidor: rows.length - candidates.philidorCanonicalSetup,
      dualCanonicalLucenaPhilidor: rows.filter((row) => row.geometry.lucenaCanonicalSetup && row.geometry.philidorCanonicalSetup).length,
      nonRookPawnVancura: rows.filter((row) => !row.geometry.rookPawn && row.geometry.vancuraCanonicalSetup).length,
    }),
  });
}

const draftRoot = resolve(process.argv[2] ?? "content/drafts");
const output = resolve(process.argv[3] ?? "planning/endgame-technique-applicability/results.json");
const packs = packFiles(draftRoot).map((file) => JSON.parse(readFileSync(file, "utf8")) as DrillPackDefinition);
const report = measureTechniqueApplicability(packs, draftRoot);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`endgame-technique-applicability: ${report.corpus.krpkrPositions} KRPKR positions; current labels ${JSON.stringify(report.currentMaterialLabels)}; canonical setups ${JSON.stringify(report.canonicalSetupCandidates)}\n`);
