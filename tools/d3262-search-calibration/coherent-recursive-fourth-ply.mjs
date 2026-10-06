// D3490 actual fourth-ply join, separate from the immutable scheduling frame.
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { directory, sha } from "./third-ply-source-check.mjs";
import { engineMoves } from "./coherent-third-ply-frame.mjs";
import { boardTerminalReason } from "./maia-horizon4-path-check.mjs";
import { outputName as frameName, reserveEvent } from "./coherent-recursive-semantic.mjs";
import { captureName, frameDigest, validateRecursiveCapture } from "./recursive-third-ply-capture.mjs";

export const names = [frameName, "d3262-stockfish-third-ply-capture.json.gz",
  "d3262-stockfish-semantic-third-ply-capture.json.gz", captureName];
export const outputName = "d3262-coherent-recursive-fourth-ply.json.gz";
function require(value, message) { if (!value) throw new Error(message); }
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function loadCompletionInputs() {
  const raw = names.map((name) => readFileSync(`${directory}/${name}`));
  return { values: raw.map((bytes) => JSON.parse(gunzipSync(bytes))), frameBytes: raw[0],
    digests: Object.fromEntries(names.map((name, i) => [name, sha(raw[i])])) };
}
export function compileRecursiveCompletion({ values, frameBytes, digests }) {
  const [frame, ...captures] = values;
  require(sha(frameBytes) === frameDigest && equal(JSON.parse(gunzipSync(frameBytes)), frame)
    && digests[names[0]] === frameDigest && frame.providerOff === false
    && frame.rows.length === 182 && frame.candidateCoverage.length === 193 && frame.arms.length === 18,
    "Crossed frozen recursive frame bytes/population");
  for (const name of names.slice(1, 3)) require(frame.inputDigests[name] === digests[name], "Crossed reused source digest");
  for (const capture of captures) require(capture.partial === false && equal(capture.source, frame.finalPlyQueries.stockfish),
    "Crossed complete recursive query identity");
  validateRecursiveCapture({ ...frame, engineJobs: frame.supplementJobs }, frameBytes, captures[2]);
  const sources = Object.fromEntries(names.slice(1).map((name, i) => [name, captures[i]]));
  const supplement = new Map(captures[2].rows.map((row, i) => [row.fen, i]));
  require(supplement.size === frame.supplementJobs.length, "Duplicate recursive source FEN");
  const paths = new Map(frame.paths.map((path) => [path.id, path]));
  const nodes = new Map(frame.eventNodes.map((node) => [node.id, node]));
  const rankCache = new Map(), leafCache = new Map();
  const engineJobs = frame.engineJobs.map((job) => ({ ...job, missingBudgets: [],
    actualReuse: [...job.actualReuse, ...job.missingBudgets.map((budget) => {
      const row = supplement.get(job.fen);
      require(row !== undefined, "Missing complete recursive source position");
      return { source: captureName, row, budget, sourceStatus: "actual_checked_captured_query" };
    })] }));
  const jobs = new Map(engineJobs.map((job) => [job.fen, job]));
  const finalPlyNodes = frame.finalPlyNodes.map((prior) => {
    const path = paths.get(prior.pathId), node = nodes.get(prior.nodeId);
    require(path && node && node.fen === path.fen && node.targetId === prior.targetId, "Crossed recursive final node");
    if (prior.status === "absorbing_terminal") return prior;
    const [, budget, widthText] = prior.arm.split(":"), binding = jobs.get(path.fen)?.actualReuse.find((r) => r.budget === budget);
    const row = sources[binding?.source]?.rows[binding?.row];
    require(binding && row?.fen === path.fen, "Missing recursive query binding");
    const ranked = engineMoves(row, path.fen, `engine:${budget}:top8`, rankCache);
    const selection = reserveEvent(node.legal, ranked, node.events.map((event) => event.uci), Number(widthText.slice(3)));
    const selected = selection.selected.map((uci) => {
      const leafId = sha(JSON.stringify([path.rootId, ...path.historyUci, uci]));
      if (!leafCache.has(leafId)) {
        const board = Chess.fromSetup(parseFen(path.fen).unwrap()).unwrap(), parsed = parseUci(uci);
        require(parsed, "Invalid recursive selected UCI");
        const move = normalizeMove(board, parsed); require(board.isLegal(move), "Illegal recursive selected UCI");
        board.play(move); const fen = makeFen(board.toSetup());
        leafCache.set(leafId, { moveUci: uci, leafId, fen, terminalReason: boardTerminalReason(fen) });
      }
      return leafCache.get(leafId);
    });
    const completed = { pathId: prior.pathId, targetId: prior.targetId, arm: prior.arm,
      nodeId: prior.nodeId, source: binding, ...selection, selected, unexpandedTerminalLegalMoves: 0 };
    if (prior.status !== "source_off") require(equal(prior, completed), "Changed already captured recursive selection");
    return completed;
  });
  return { ...frame, profile: "d3262-coherent-recursive-fourth-ply-v1",
    authority: "disposable_actual_recursive_geometry_selected_paths_not_profit_proof_or_complete_arm5",
    frozenFrameDigest: frameDigest, inputDigests: digests, finalPlyNodes, engineJobs, supplementJobs: [] };
}
export function summarizeCompletion(value) {
  return { candidates: value.candidateCoverage.length, cells: value.rows.length, arms: value.arms.length,
    paths: value.paths.length, finalPlyNodes: value.finalPlyNodes.length,
    sourceOff: value.finalPlyNodes.filter((node) => node.status === "source_off").length,
    selectedEdges: value.finalPlyNodes.reduce((n, node) => n + node.selected.length, 0),
    uniqueLeaves: new Set(value.finalPlyNodes.flatMap((node) => node.selected.map((leaf) => leaf.leafId))).size,
    reservedOutsideBaseline: value.finalPlyNodes.filter((node) => node.status === "event_reserved_outside_baseline").length,
    actualQueries: value.engineJobs.reduce((n, job) => n + job.actualReuse.length, 0) };
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const value = compileRecursiveCompletion(loadCompletionInputs()), plain = Buffer.from(`${JSON.stringify(value)}\n`), compressed = gzipSync(plain, { level: 9 });
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${outputName}`, compressed, { flag: "wx" });
  else require(readFileSync(`${directory}/${outputName}`).equals(compressed), "Recursive fourth-ply output differs");
  process.stdout.write(`${JSON.stringify({ digest: sha(compressed), logicalDigest: sha(plain), bytes: compressed.length,
    summary: summarizeCompletion(value) }, null, 2)}\n`);
}
