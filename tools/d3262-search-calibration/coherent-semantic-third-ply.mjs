// Disposable D3262/D3483 continuation of the FROZEN first-reply reserve.
// The learner layer follows the same engine budget/width; this is NOT a
// recursively semantic selector or a complete fifth-arm/proof result.
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { enumerateCandidate, legalMoves } from "./exact-reply-enumeration.mjs";
import { engineMoves } from "./coherent-third-ply-frame.mjs";
import { directory, sha, frameName, loadFrozenThirdPlyFrame } from "./third-ply-source-check.mjs";

export const names = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-root-frame.json",
  "d3262-coherent-semantic-reserve.json", "d3262-coherent-deeper-source-union.json",
  "d3262-coherent-semantic-source-union.json", "d3262-stockfish-horizon4-capture.json",
  "d3262-stockfish-coherent-deeper-supplement.json", "d3262-stockfish-coherent-semantic-supplement.json", frameName];
export const outputName = "d3262-coherent-semantic-third-ply.json.gz";
export const budgets = ["depth8", "depth12", "movetime100"], widths = [2, 4, 8], eventWidths = ["top8", "all_legal"];
export const arms = budgets.flatMap((budget) => widths.flatMap((width) => eventWidths.map((source) => `semantic:${budget}:top${width}:${source}`)));
const defaultLimits = { cells: 182, targets: 64, roots: 66, candidates: 193 };
function check(value, message) { if (!value) throw new Error(message); }
const key = (row) => JSON.stringify([row.rootId, row.candidateUci]);
const replyKey = (row) => JSON.stringify([row.rootId, row.candidateUci, row.replyUci]);
const cellKey = (row) => JSON.stringify([row.rootId, row.targetId, row.candidateUci]);
const armKey = (row) => `semantic:${row.budget}:top${row.width}:${row.eventSourceWidth}`;
function index(rows, identity, label) {
  const map = new Map(rows.map((row) => [identity(row), row]));
  check(map.size === rows.length, `Duplicated ${label}`);
  return map;
}
function board(fen) { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function terminal(pos) {
  if (legalMoves(pos).length === 0) return pos.isCheck() ? "CHECKMATE" : "STALEMATE";
  if (pos.isInsufficientMaterial()) return "INSUFFICIENT_MATERIAL";
  return pos.halfmoves >= 150 ? "SEVENTYFIVE_MOVES" : null;
}
function replay(fen, ucis) {
  const pos = board(fen);
  for (const uci of ucis) {
    check(terminal(pos) === null, "Semantic path continues past game terminal");
    const parsed = parseUci(uci), move = parsed && normalizeMove(pos, parsed);
    check(move && pos.isLegal(move), "Illegal semantic continuation");
    pos.play(move);
  }
  return pos;
}

export function compileSemanticThirdPly(comparison, frame, reserve, provider, semantic, sources, prior, inputDigests, limits = defaultLimits) {
  check(comparison.profile === "d3262-coherent-target-comparison-v1" && frame.profile === "d3262-coherent-root-v1"
    && reserve.profile === "d3262-coherent-semantic-reserve-v1" && provider.profile === "d3262-coherent-deeper-source-union-v1"
    && semantic.profile === "d3262-coherent-semantic-source-union-v1" && prior.profile === "d3262-coherent-third-ply-v1"
    && [frame, reserve, provider, semantic, prior, ...Object.values(sources)].every((value) => value.manifest === comparison.manifest)
    && comparison.comparisons.length === limits.cells && comparison.definitions.length === limits.targets
    && frame.roots.length === limits.roots && frame.roots.reduce((sum, root) => sum + root.candidates.length, 0) === limits.candidates
    && reserve.rows.length === limits.cells * arms.length, "Crossed semantic continuation population");
  check(comparison.rootFrameDigest === inputDigests[names[1]]
    && [names[5], names[6]].every((name) => provider.inputDigests[name] === inputDigests[name])
    && semantic.inputDigests[names[7]] === inputDigests[names[7]], "Crossed semantic continuation source digest");
  check(Object.values(sources).every((source) => source.source.multiPv === "top8_legal_moves_at_selected_reply"
    && ["engineName", "executableDigest", "threads", "hashMb", "scorePerspective"].every((field) =>
      source.source[field] !== undefined && source.source[field] === prior.finalPlyQueries.stockfish[field])), "Crossed semantic engine query identity");
  const roots = index(frame.roots, (row) => row.rootId, "semantic root");
  const definitions = index(comparison.definitions, (row) => row.id, "semantic definition");
  const selected = index(reserve.rows, (row) => JSON.stringify([cellKey(row), armKey(row)]), "semantic reserve arm");
  const providerIndex = index(provider.bindings, replyKey, "provider binding"), semanticIndex = index(semantic.bindings, replyKey, "semantic binding");
  const exactCache = new Map(), rankCache = new Map(), pathMap = new Map();
  const rows = comparison.comparisons.map((pair) => {
    const root = roots.get(pair.rootId), definition = definitions.get(pair.targetId);
    check(root && definition?.rootId === pair.rootId && root.candidates.some((entry) => entry.moveUci === pair.candidateUci), "Missing semantic target/candidate");
    if (!exactCache.has(key(pair))) exactCache.set(key(pair), enumerateCandidate(root.fen, pair.candidateUci));
    const exact = exactCache.get(key(pair));
    const replyMap = new Map();
    const armRows = arms.map((arm) => {
      const reserved = selected.get(JSON.stringify([cellKey(pair), arm]));
      check(reserved?.family === definition.family && new Set(reserved.selected).size === reserved.selected.length
        && reserved.selected.length === Math.min(reserved.width, exact.replyCount)
        && reserved.selected.every((uci) => exact.replies.some((entry) => entry.uci === uci)), "Crossed semantic first-reply selection");
      const pathIds = [], absorbingReplyUcis = [];
      let legalLearnerEdges = 0;
      for (const replyUci of reserved.selected) {
        const reply = exact.replies.find((entry) => entry.uci === replyUci), subject = { ...pair, replyUci };
        const normal = providerIndex.get(replyKey(subject)), extra = semanticIndex.get(replyKey(subject));
        const binding = normal ?? extra, source = sources[binding?.stockfish.source], capture = source?.rows[binding?.stockfish.row];
        check(binding?.fen === reply.fen && capture?.fen === reply.fen, "Missing or crossed semantic deeper provider source");
        if (normal && extra) check(normal.stockfish.source === extra.stockfish.source && normal.stockfish.row === extra.stockfish.row, "Conflicting semantic source bindings");
        const afterReply = replay(root.fen, [pair.candidateUci, replyUci]);
        const reason = terminal(afterReply), legalCount = legalMoves(afterReply).length;
        legalLearnerEdges += legalCount;
        const learner = reason === null ? engineMoves(capture, reply.fen, `engine:${reserved.budget}:top${reserved.width}`, rankCache) : [];
        if (reason !== null) absorbingReplyUcis.push(replyUci);
        const entries = learner.map((learnerUci) => {
          const historyUci = [pair.candidateUci, replyUci, learnerUci], id = sha(JSON.stringify([root.rootId, ...historyUci]));
          let path = pathMap.get(id);
          if (!path) {
            const pos = replay(root.fen, historyUci);
            path = { id, rootId: root.rootId, rootFen: root.fen, historyUci,
              fen: makeFen(pos.toSetup()), legalReplyCount: legalMoves(pos).length, terminalReason: terminal(pos), subjects: [] };
            pathMap.set(id, path);
          }
          let target = path.subjects.find((entry) => entry.targetId === pair.targetId);
          if (!target) { target = { targetId: pair.targetId, selectedBy: [] }; path.subjects.push(target); }
          check(!target.selectedBy.includes(arm), "Duplicated semantic path subject/arm");
          target.selectedBy.push(arm); pathIds.push(id);
          return { learnerUci, pathId: id };
        });
        const item = replyMap.get(replyUci) ?? { replyUci, fen: reply.fen, legalLearnerCount: legalCount,
          terminalReason: reason, sourceBinding: { register: normal ? names[3] : names[4], ...binding.stockfish }, arms: [] };
        item.arms.push({ arm, selected: entries, unvisitedLegal: legalCount - entries.length });
        replyMap.set(replyUci, item);
      }
      return { arm, selectedReplyUcis: reserved.selected, selectedReplies: reserved.selected.length,
        unvisitedReplies: exact.replyCount - reserved.selected.length, selectedLearnerPaths: pathIds,
        unvisitedLearnerEdgesWithinSelectedReplies: legalLearnerEdges - pathIds.length,
        absorbingReplyUcis, proofCeiling: "partial_first_reply_reserve_then_engine_continuation", universalVerdict: "not_evaluated" };
    });
    return { ...pair, family: definition.family, phase: root.phase, legalReplyCount: exact.replyCount,
      replies: [...replyMap.values()], arms: armRows };
  });
  const paths = [...pathMap.values()].sort((left, right) => left.id.localeCompare(right.id));
  const jobs = new Map(), priorJobs = index(prior.engineJobs, (row) => row.fen, "prior engine job");
  for (const path of paths) {
    path.subjects.sort((a, b) => a.targetId.localeCompare(b.targetId));
    path.subjects.forEach((subject) => subject.selectedBy.sort());
    if (path.terminalReason !== null) continue;
    const job = jobs.get(path.fen) ?? { id: sha(path.fen), fen: path.fen, paths: [], budgets: [] };
    job.paths.push(path.id);
    for (const subject of path.subjects) for (const arm of subject.selectedBy) {
      const budget = arm.split(":")[1]; if (!job.budgets.includes(budget)) job.budgets.push(budget);
    }
    job.budgets.sort(); jobs.set(path.fen, job);
  }
  const engineJobs = [...jobs.values()].sort((a, b) => a.id.localeCompare(b.id));
  for (const job of engineJobs) {
    const existing = priorJobs.get(job.fen);
    job.plannedReuse = job.budgets.filter((budget) => existing?.budgets.includes(budget))
      .map((budget) => ({ frame: frameName, jobId: existing.id, budget, sourceStatus: "awaiting_complete_checked_capture" }));
    job.missingBudgets = job.budgets.filter((budget) => !existing?.budgets.includes(budget));
  }
  const candidateCoverage = frame.roots.flatMap((root) => root.candidates.map((candidate) => {
    const targetIds = rows.filter((row) => row.rootId === root.rootId && row.candidateUci === candidate.moveUci).map((row) => row.targetId);
    const control = comparison.controls.find((row) => row.rootId === root.rootId);
    return { rootId: root.rootId, candidateUci: candidate.moveUci, phase: root.phase, targetIds,
      status: targetIds.length ? "named_target_paths_declared" : control?.status === "declared_relation_control"
        ? "declared_control_separate_not_evaluated" : "no_autonomous_semantic_target" };
  }));
  check(index(rows, cellKey, "semantic cell").size === limits.cells && candidateCoverage.length === limits.candidates, "Lost semantic continuation population");
  return { version: 1, profile: "d3262-coherent-semantic-third-ply-v1", manifest: frame.manifest,
    authority: "actual_first_reply_reserve_then_engine_path_and_jobs_not_recursive_semantic_arm_or_proof",
    traversalRule: "frozen_one_slot_first_reply_reserve_then_same_engine_budget_and_width_at_learner_node",
    inputDigests, finalPlyQueries: { stockfish: prior.finalPlyQueries.stockfish }, arms,
    controls: comparison.controls, candidateCoverage, rows, paths, engineJobs,
    supplementJobs: engineJobs.filter((job) => job.missingBudgets.length > 0)
      .map((job) => ({ id: job.id, fen: job.fen, paths: job.paths, budgets: job.missingBudgets })) };
}

export function loadSemanticThirdPlyInputs() {
  loadFrozenThirdPlyFrame();
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`)), objects = inputs.map((value) => JSON.parse(value));
  return [...objects.slice(0, 5), Object.fromEntries(names.slice(5, 8).map((name, i) => [name, objects[i + 5]])), objects[8],
    Object.fromEntries(names.map((name, i) => [name, sha(inputs[i])]))];
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const artifact = compileSemanticThirdPly(...loadSemanticThirdPlyInputs()), bytes = Buffer.from(`${JSON.stringify(artifact)}\n`), compressed = gzipSync(bytes);
  check(gunzipSync(compressed).equals(bytes), "Semantic continuation compression changed logical bytes");
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${outputName}`, compressed, { flag: "wx" });
  else check(readFileSync(`${directory}/${outputName}`).equals(compressed), "Semantic continuation differs from frozen sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(compressed), logicalDigest: sha(bytes), compressedBytes: compressed.length, logicalBytes: bytes.length,
    cells: artifact.rows.length, candidateCoverage: artifact.candidateCoverage.length,
    paths: artifact.paths.length, engineJobs: artifact.engineJobs.length,
    budgetQueries: artifact.engineJobs.reduce((sum, job) => sum + job.budgets.length, 0),
    plannedReuseQueries: artifact.engineJobs.reduce((sum, job) => sum + job.plannedReuse.length, 0),
    supplementPositions: artifact.supplementJobs.length,
    supplementQueries: artifact.supplementJobs.reduce((sum, job) => sum + job.budgets.length, 0),
    terminalPaths: artifact.paths.filter((path) => path.terminalReason !== null).length,
    candidateStates: Object.fromEntries([...new Set(artifact.candidateCoverage.map((row) => row.status))]
      .map((status) => [status, artifact.candidateCoverage.filter((row) => row.status === status).length])) }, null, 2)}\n`);
}
