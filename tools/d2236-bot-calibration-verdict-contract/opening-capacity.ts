/** Disposable D3409 exact-opening capacity census, before selection or model output. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { StringDecoder } from "node:string_decoder";
import { makeFen, parseFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";
import { digest, gameDecisions, type HumanReference } from "./population.js";
import manifest from "./manifest.json";
import { validateManifest } from "./contract.mjs";

export const OPENING_SPEC = Object.freeze({ requiredPositions: 128, observationsPerBand: 100 });
export interface OpeningObservation {
  readonly gameHash: string;
  readonly referenceHalf: 0 | 1;
  readonly band: string;
  readonly fen: string;
  readonly moveUci: string;
}
export interface FenCounts { readonly fen: string; readonly observations: readonly number[] }
const INSTRUMENT_FILES = ["opening-capacity.ts", "opening-capacity-stream.ts", "capture-opening-capacity.sh", "population.ts"];
export function openingInstrumentDigest(): string {
  return digest(JSON.stringify(INSTRUMENT_FILES.map((file) => [file,
    digest(readFileSync(`tools/d2236-bot-calibration-verdict-contract/${file}`))])));
}

/** Use the already-executed full-game admission; do not admit a legal opening with an illegal tail. */
export function openingObservations(block: string, reference: HumanReference): readonly OpeningObservation[] {
  const admitted = gameDecisions(block, reference);
  if (admitted.length === 0) return [];
  const game = parsePgn(block)[0]!;
  const position = startingPosition(game.headers).unwrap();
  const ratings = { white: Number(game.headers.get("WhiteElo")), black: Number(game.headers.get("BlackElo")) };
  const window = reference.windows.find((item) => item.id === "opening-8-16");
  if (!window || window.maxPly === null) throw new TypeError("missing bounded opening window");
  const rows: OpeningObservation[] = [];
  let ply = 0;
  for (const data of game.moves.mainline()) {
    if (++ply > window.maxPly) break;
    const move = parseSan(position, data.san);
    if (!move || !position.isLegal(move)) throw new TypeError("admitted opening no longer replays legally");
    const band = reference.bands.find((item) => ratings[position.turn] >= item.min && ratings[position.turn] <= item.max);
    if (ply >= window.minPly && band) rows.push({ gameHash: admitted[0]!.gameHash,
      referenceHalf: admitted[0]!.referenceHalf, band: band.id, fen: makeFen(position.toSetup()), moveUci: makeUci(move) });
    position.play(move);
  }
  return rows;
}

/** A band/FEN can count a particular raw-byte game only once. Full six-field FENs are retained. */
export async function countOpeningCapacity(chunks: AsyncIterable<Uint8Array>, reference: HumanReference) {
  const hash = createHash("sha256");
  const decoder = new StringDecoder("utf8");
  const seen = new Set<string>();
  const positions = new Map<string, number[]>();
  let bytes = 0, blocks = 0, rejected = 0, duplicates = 0, eligible = 0;
  let buffer = "", block = "";
  const consume = () => {
    blocks++;
    let rows: readonly OpeningObservation[];
    try { rows = openingObservations(block, reference); } catch { rejected++; return; }
    if (rows.length === 0) { rejected++; return; }
    if (seen.has(rows[0]!.gameHash)) { duplicates++; return; }
    seen.add(rows[0]!.gameHash); eligible++;
    const gameFens = new Set<string>();
    for (const row of rows) {
      const bandIndex = reference.bands.findIndex((band) => band.id === row.band);
      if (bandIndex < 0) throw new TypeError("unregistered observation band");
      const key = `${row.band}/${row.fen}`;
      if (gameFens.has(key)) continue;
      gameFens.add(key);
      let counts = positions.get(row.fen);
      if (!counts) { counts = Array<number>(reference.bands.length * 2).fill(0); positions.set(row.fen, counts); }
      counts[bandIndex * 2 + row.referenceHalf]!++;
    }
  };
  const line = (value: string) => {
    if (value.startsWith("[Event ") && block.length > 0) { consume(); block = ""; }
    block += value;
  };
  for await (const chunk of chunks) {
    hash.update(chunk); bytes += chunk.byteLength;
    buffer += decoder.write(Buffer.from(chunk));
    let end: number, start = 0;
    while ((end = buffer.indexOf("\n", start)) !== -1) { line(buffer.slice(start, end + 1)); start = end + 1; }
    buffer = buffer.slice(start);
  }
  // Frozen partial source: neither a final newline nor a completed result makes its last block eligible.
  decoder.end();
  const table: FenCounts[] = [...positions.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([fen, observations]) => ({ fen, observations }));
  return { decompressedSha256: `sha256:${hash.digest("hex")}`, decompressedBytes: bytes,
    completeBlocks: blocks, eligibleOpeningGames: eligible, rejectedOrNoOpeningGames: rejected,
    duplicateGames: duplicates, trailingPartialBlocksDropped: 1, table };
}

export function summarizeOpeningCounts(table: readonly FenCounts[], reference: HumanReference) {
  const observationsByBand = reference.bands.map((band) => ({ band: band.id, observations: 0, referenceHalves: [0, 0] }));
  const thresholds = [1, 10, 25, 50, OPENING_SPEC.observationsPerBand, 200];
  const capacityByThreshold = thresholds.map((minimumObservationsPerBand) => ({ minimumObservationsPerBand, exactFens: 0 }));
  const qualified: FenCounts[] = [];
  let previous = "";
  for (const row of table) {
    if (row.fen <= previous || makeFen(parseFen(row.fen).unwrap()) !== row.fen) throw new TypeError("count inventory FENs are not canonical, unique and sorted");
    previous = row.fen;
    if (row.observations.length !== reference.bands.length * 2
      || row.observations.some((count) => !Number.isSafeInteger(count) || count < 0)
      || row.observations.every((count) => count === 0)) throw new TypeError("invalid distinct-game count inventory");
    const counts = reference.bands.map((_, index) => row.observations[index * 2]! + row.observations[index * 2 + 1]!);
    for (const [index, count] of counts.entries()) {
      observationsByBand[index]!.observations += count;
      observationsByBand[index]!.referenceHalves[0]! += row.observations[index * 2]!;
      observationsByBand[index]!.referenceHalves[1]! += row.observations[index * 2 + 1]!;
    }
    for (const threshold of capacityByThreshold) if (counts.every((count) => count >= threshold.minimumObservationsPerBand)) threshold.exactFens++;
    if (counts.every((count) => count >= OPENING_SPEC.observationsPerBand)) qualified.push(row);
  }
  return { exactFens: table.length, observationsByBand, capacityByThreshold,
    qualifyingExactFens: qualified.length, qualifyingInventoryDigest: digest(JSON.stringify(qualified)),
    requiredPositions: OPENING_SPEC.requiredPositions, minimumObservationsPerBand: OPENING_SPEC.observationsPerBand,
    state: qualified.length >= OPENING_SPEC.requiredPositions ? "capacity_sufficient_not_selected" : "capacity_insufficient",
    positionsSelected: 0, modelQueries: 0, bandIdentity: "not_measured", humanLikeAllowed: false };
}

export function openingCapacityArtifact(result: Awaited<ReturnType<typeof countOpeningCapacity>>) {
  validateManifest(manifest);
  const metric = manifest.metrics.find((item) => item.id === "opening_band_identity");
  if (metric?.population !== "128 canonical exact FENs, each with >=100 observed moves in every band") throw new TypeError("frozen opening population contract changed");
  if (result.decompressedSha256 !== manifest.humanReference.decompressedSha256) throw new TypeError("opening source digest mismatch");
  return { schema: "tabiya.research.bot-opening-capacity.v1", manifestDigest: digest(JSON.stringify(manifest)),
    instrumentDigest: openingInstrumentDigest(), source: manifest.humanReference,
    countInventoryDigest: digest(JSON.stringify(result.table)), ...result,
    summary: summarizeOpeningCounts(result.table, manifest.humanReference) };
}

/** Recompute every summary field from the complete cached FEN × band × fixed-half inventory. */
export function openingCapacityReceipt(artifact: ReturnType<typeof openingCapacityArtifact>) {
  if (artifact.schema !== "tabiya.research.bot-opening-capacity.v1"
    || artifact.manifestDigest !== digest(JSON.stringify(manifest))
    || artifact.instrumentDigest !== openingInstrumentDigest()
    || JSON.stringify(artifact.source) !== JSON.stringify(manifest.humanReference)
    || artifact.decompressedSha256 !== manifest.humanReference.decompressedSha256
    || artifact.countInventoryDigest !== digest(JSON.stringify(artifact.table))) throw new TypeError("opening capacity identity mismatch");
  const summary = summarizeOpeningCounts(artifact.table, manifest.humanReference);
  if (JSON.stringify(summary) !== JSON.stringify(artifact.summary)) throw new TypeError("opening capacity summary mismatch");
  for (const count of [artifact.decompressedBytes, artifact.completeBlocks, artifact.eligibleOpeningGames,
    artifact.rejectedOrNoOpeningGames, artifact.duplicateGames]) if (!Number.isSafeInteger(count) || count < 0) throw new TypeError("invalid source census count");
  if (artifact.completeBlocks !== artifact.eligibleOpeningGames + artifact.rejectedOrNoOpeningGames + artifact.duplicateGames
    || artifact.trailingPartialBlocksDropped !== 1) throw new TypeError("opening source census does not close");
  const { table: _inventory, summary: _summary, ...identity } = artifact;
  return { ...identity, ...summary };
}
