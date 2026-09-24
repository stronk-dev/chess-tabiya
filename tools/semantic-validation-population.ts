// Build-only population reader for rfc/semantic-validation-authority.md §5.1.
//
// Parses the committed CC0 imported sample, fails unless every fixture-manifest count and digest
// reproduces, and projects three sealed populations from the same games: canonical sampled edges
// at plies 8/16/24/32/40/48, complete recorded mainlines, and the complete legal successor set of
// every sampled edge's before FEN. No case, profile or implementer can supply a subset.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { makeFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";

import { canonicalSemanticEdge } from "../packages/runtime/src/semantic-validation-operations.js";
import { semanticPopulationProjectionDigest, semanticRecordedPathDigest, type SemanticEdgeInput, type SemanticRecordedPathInput } from "../packages/runtime/src/semantic-validation.js";

export const SEMANTIC_POPULATION_ID = "r2-imported-sample-2026-07";
export const SEMANTIC_POPULATION_READER_VERSION = 1;
const TARGET_PLIES = new Set([8, 16, 24, 32, 40, 48]);

const sha = (bytes: string | Buffer): string => createHash("sha256").update(bytes).digest("hex");

export interface SemanticSampledEdge {
  readonly site: string;
  readonly ply: number;
  readonly edge: SemanticEdgeInput;
}

export interface SemanticRecordedPath {
  readonly site: string;
  readonly path: SemanticRecordedPathInput;
}

export interface SemanticValidationPopulation {
  readonly id: string;
  readonly version: 1;
  readonly pgnSha256: string;
  readonly manifestSha256: string;
  readonly games: number;
  readonly sampledEdges: readonly SemanticSampledEdge[];
  readonly recordedPaths: readonly SemanticRecordedPath[];
  /** Per-projection input digests: PGN + manifest + reader version + the exact projected identities. */
  readonly projectionDigests: Readonly<Record<"sampled_edges" | "recorded_paths" | "bounded_target_sources", string>>;
}

function speed(event: string): "bullet" | "blitz" | "rapid" | undefined {
  if (/UltraBullet/u.test(event)) return undefined;
  if (/Bullet/u.test(event)) return "bullet";
  if (/Blitz/u.test(event)) return "blitz";
  if (/Rapid/u.test(event)) return "rapid";
  return undefined;
}

function band(rating: number): string | undefined {
  if (rating >= 1000 && rating <= 1399) return "1000-1399";
  if (rating >= 1400 && rating <= 1799) return "1400-1799";
  if (rating >= 1800 && rating <= 2199) return "1800-2199";
  return undefined;
}

export function readSemanticValidationPopulation(root: string): SemanticValidationPopulation {
  const pgnPath = resolve(root, "tools/r2-selection-harness/imported-sample.pgn");
  const manifestPath = resolve(root, "tools/r2-selection-harness/fixture.json");
  const pgnBytes = readFileSync(pgnPath);
  const manifestText = readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(manifestText) as { readonly fixture: { readonly bytes: number; readonly sha256: string; readonly games: number; readonly decisions: number; readonly strata: Readonly<Record<string, number>> } };
  const pgnSha256 = sha(pgnBytes);
  if (pgnBytes.length !== manifest.fixture.bytes || pgnSha256 !== manifest.fixture.sha256) throw new Error("SEMANTIC_VALIDATION_POPULATION_INCOMPLETE: imported sample bytes do not reproduce the fixture manifest");
  const accepted = new Map<string, number>();
  const sampledEdges: SemanticSampledEdge[] = [];
  const recordedPaths: SemanticRecordedPath[] = [];
  const full = (): boolean => Object.entries(manifest.fixture.strata).every(([cell, count]) => (accepted.get(cell) ?? 0) >= count);
  for (const block of pgnBytes.toString("utf8").split(/\n(?=\[Event )/u)) {
    if (full()) break;
    const [game] = parsePgn(block);
    if (game === undefined || game.headers.get("Result") === "*" || (game.headers.get("Variant") !== undefined && game.headers.get("Variant") !== "Standard")) continue;
    const time = speed(game.headers.get("Event") ?? "");
    const elo = band((Number(game.headers.get("WhiteElo")) + Number(game.headers.get("BlackElo"))) / 2);
    if (time === undefined || elo === undefined) continue;
    const cell = `${time}/${elo}`;
    if ((accepted.get(cell) ?? 0) >= (manifest.fixture.strata[cell] ?? 0)) continue;
    const setup = startingPosition(game.headers);
    if (setup.isErr) continue;
    const position = setup.value;
    const site = game.headers.get("Site") ?? cell;
    const edges: SemanticEdgeInput[] = [];
    const samples: SemanticSampledEdge[] = [];
    let legal = true;
    for (const node of game.moves.mainline()) {
      const move = parseSan(position, node.san);
      if (move === undefined || !position.isLegal(move)) { legal = false; break; }
      const beforeFen = makeFen(position.toSetup());
      const edge = canonicalSemanticEdge({ kind: "edge", beforeFen, moveUci: makeUci(move), afterFen: "" });
      position.play(move);
      edges.push(edge);
      if (TARGET_PLIES.has(edges.length)) samples.push(Object.freeze({ site, ply: edges.length, edge }));
    }
    if (!legal || samples.length === 0) continue;
    accepted.set(cell, (accepted.get(cell) ?? 0) + 1);
    sampledEdges.push(...samples);
    recordedPaths.push(Object.freeze({ site, path: Object.freeze({ kind: "recorded_path" as const, pathReceipt: Object.freeze({ id: "run.record.edge", version: 1 }), edges: Object.freeze(edges), pathDigest: semanticRecordedPathDigest(edges) }) }));
  }
  if (!full()) throw new Error("SEMANTIC_VALIDATION_POPULATION_INCOMPLETE: the imported sample did not fill every stratum");
  if (recordedPaths.length !== manifest.fixture.games || sampledEdges.length !== manifest.fixture.decisions) {
    throw new Error(`SEMANTIC_VALIDATION_POPULATION_INCOMPLETE: reproduced ${recordedPaths.length} games / ${sampledEdges.length} edges, manifest says ${manifest.fixture.games} / ${manifest.fixture.decisions}`);
  }
  const manifestSha256 = sha(manifestText);
  const base = { pgnSha256, manifestSha256, reader: SEMANTIC_POPULATION_READER_VERSION };
  const projectionDigests = Object.freeze({
    sampled_edges: semanticPopulationProjectionDigest(base, "sampled_edges", sampledEdges.map((row) => [row.site, row.ply, row.edge.beforeFen, row.edge.moveUci, row.edge.afterFen])),
    recorded_paths: semanticPopulationProjectionDigest(base, "recorded_paths", recordedPaths.map((row) => [row.site, row.path.pathDigest])),
    bounded_target_sources: semanticPopulationProjectionDigest(base, "bounded_target_sources", sampledEdges.map((row) => [row.site, row.ply, row.edge.beforeFen])),
  });
  return Object.freeze({ id: SEMANTIC_POPULATION_ID, version: 1, pgnSha256, manifestSha256, games: recordedPaths.length, sampledEdges: Object.freeze(sampledEdges), recordedPaths: Object.freeze(recordedPaths), projectionDigests });
}
