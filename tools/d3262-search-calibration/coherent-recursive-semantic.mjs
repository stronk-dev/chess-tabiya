// Disposable D3489 recursive scheduling frame. Missing final-ply sources stay
// missing; a geometric event never becomes a positive-exchange/proof verdict.
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { directory, sha } from "./third-ply-source-check.mjs";
import { engineMoves } from "./coherent-third-ply-frame.mjs";
import { arms as seedArms } from "./coherent-semantic-third-ply.mjs";
import { relationEventsAtHistory } from "./dist/recursive-relation-events.mjs";
import { enumerateCandidate } from "./exact-reply-enumeration.mjs";
import { boardTerminalReason } from "./maia-horizon4-path-check.mjs";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";

export const names = ["d3262-recursive-semantic-preregistration.md", "d3262-coherent-target-comparison-frame.json",
  "d3262-coherent-root-frame.json", "d3262-coherent-semantic-third-ply.json.gz",
  "d3262-stockfish-horizon4-capture.json", "d3262-stockfish-coherent-deeper-supplement.json",
  "d3262-stockfish-coherent-semantic-supplement.json", "d3262-stockfish-third-ply-capture.json.gz",
  "d3262-stockfish-semantic-third-ply-capture.json.gz"];
export const outputName = "d3262-coherent-recursive-semantic-frame.json.gz";
export const arms = seedArms.map((arm) => arm.replace(/^semantic:/u, "recursive:"));
const key = (r) => JSON.stringify([r.rootId, r.targetId, r.candidateUci]);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function require(value, message) { if (!value) throw new Error(message); }
function index(rows, identity, label) {
  const result = new Map(rows.map((r) => [identity(r), r]));
  require(result.size === rows.length, `Duplicated ${label}`); return result;
}
export function reserveEvent(legal, ranked, eventUcis, width) {
  require([2, 4, 8].includes(width) && [legal, ranked, eventUcis].every((list) => Array.isArray(list)
    && list.every((v) => typeof v === "string") && new Set(list).size === list.length)
    && ranked.length === Math.min(8, legal.length) && [...ranked, ...eventUcis].every((uci) => legal.includes(uci)), "Invalid reserve width/rank/legal identity");
  const baseline = ranked.slice(0, width), rankedEvent = ranked.find((uci) => eventUcis.includes(uci));
  const reservedUci = rankedEvent ?? [...eventUcis].sort()[0] ?? null;
  const selected = reservedUci === null || baseline.includes(reservedUci) ? baseline : [...baseline.slice(0, -1), reservedUci];
  require(selected.length === Math.min(width, legal.length) && new Set(selected).size === selected.length, "Reserve changed cardinality");
  return { baseline, reservedUci, reservedRank: rankedEvent === undefined ? null : ranked.indexOf(rankedEvent) + 1,
    eventOrderAuthority: rankedEvent === undefined && reservedUci !== null ? "canonical_uci_unranked_tie_not_engine_rank" : "retained_top8_engine_order",
    selected, omittedLegal: legal.length - selected.length,
    status: reservedUci === null ? "no_legal_event" : baseline.includes(reservedUci) ? "event_already_in_baseline" : "event_reserved_outside_baseline" };
}
export function loadRecursiveInputs() {
  const raw = names.map((name) => readFileSync(`${directory}/${name}`));
  return { values: raw.map((b, i) => i === 0 ? b.toString() : JSON.parse(names[i].endsWith(".gz") ? gunzipSync(b) : b)),
    digests: Object.fromEntries(names.map((name, i) => [name, sha(raw[i])])) };
}
export function compileRecursiveFrame({ values, digests }, { providerOff = false } = {}) {
  const [prereg, comparison, rootsFrame, seed, ...captures] = values;
  require(prereg.includes("before this profile's selection or outcome measurements") && comparison.comparisons.length === 182
    && comparison.definitions.length === 64 && rootsFrame.roots.length === 66 && seed.rows.length === 182
    && seed.candidateCoverage.length === 193 && equal(seed.arms, seedArms)
    && [rootsFrame, seed, ...captures].every((v) => v.manifest === comparison.manifest), "Crossed recursive population/preregistration");
  for (const name of names.slice(4, 7)) require(seed.inputDigests[name] === digests[name], "Crossed recursive learner source digest");
  require(comparison.rootFrameDigest === digests[names[2]], "Crossed recursive root digest");
  const identity = seed.finalPlyQueries.stockfish;
  captures.forEach((source, i) => require(source.partial === false && source.source.multiPv === (i < 3
    ? "top8_legal_moves_at_selected_reply" : "top8_legal_moves_at_selected_third_ply")
    && ["engineName", "executableDigest", "threads", "hashMb", "scorePerspective"].every((field) =>
      source.source[field] === identity[field]), "Crossed recursive engine query identity"));
  const roots = index(rootsFrame.roots, (r) => r.rootId, "recursive root");
  const definitions = index(comparison.definitions, (r) => r.id, "recursive target");
  const seedCells = index(seed.rows, key, "recursive seed cell");
  const sourceRows = Object.fromEntries(names.slice(4).map((name, i) => [name, captures[i]]));
  const finalIndexes = captures.slice(3).map((capture) => index(capture.rows, (r) => r.fen, "final source FEN"));
  const caches = { ranks: new Map(), events: new Map(), exact: new Map() }, pathMap = new Map();
  const eventNode = (rootFen, history, definition) => {
    const id = sha(JSON.stringify([definition.id, ...history]));
    if (!caches.events.has(id)) caches.events.set(id, { id, rootId: definition.rootId, targetId: definition.id,
      ...relationEventsAtHistory(rootFen, history, definition) });
    return caches.events.get(id);
  };
  const rows = comparison.comparisons.map((cell) => {
    const root = roots.get(cell.rootId), definition = definitions.get(cell.targetId), prior = seedCells.get(key(cell));
    require(root && definition?.rootId === cell.rootId && prior && cell.sourceObserved === prior.sourceObserved
      && root.candidates.some((c) => c.moveUci === cell.candidateUci), "Crossed recursive target/candidate");
    const candidateKey = JSON.stringify([cell.rootId, cell.candidateUci]);
    if (!caches.exact.has(candidateKey)) caches.exact.set(candidateKey, enumerateCandidate(root.fen, cell.candidateUci));
    const exact = caches.exact.get(candidateKey);
    const armRows = arms.map((arm, i) => {
      const sourceArm = prior.arms.find((a) => a.arm === seedArms[i]);
      const [, budget, widthText] = arm.split(":"), width = Number(widthText.slice(3));
      require(sourceArm && sourceArm.selectedReplyUcis.length === Math.min(width, exact.replyCount)
        && new Set(sourceArm.selectedReplyUcis).size === sourceArm.selectedReplyUcis.length, "Changed frozen first reply seed");
      const replies = sourceArm.selectedReplyUcis.map((uci) => {
        require(exact.replies.some((r) => r.uci === uci), "Illegal frozen first reply seed");
        const node = eventNode(root.fen, [cell.candidateUci, uci], definition), original = prior.replies.find((r) => r.replyUci === uci);
        require(original?.fen === node.fen, "Crossed recursive preparation FEN");
        if (node.terminalReason !== null) return { replyUci: uci, nodeId: node.id, source: null,
          status: "absorbing_terminal", selected: [], omittedLegal: 0, unexpandedTerminalLegalMoves: node.legal.length };
        const binding = original.sourceBinding, capture = sourceRows[binding.source]?.rows[binding.row];
        require(capture?.fen === node.fen, "Crossed recursive learner binding");
        if (providerOff) return { replyUci: uci, nodeId: node.id, source: null, status: "source_off",
          selected: [], omittedLegal: node.legal.length, unexpandedTerminalLegalMoves: 0 };
        const ranked = engineMoves(capture, node.fen, `engine:${budget}:top8`, caches.ranks);
        const selection = reserveEvent(node.legal, ranked, node.events.map((e) => e.uci), width);
        const selected = selection.selected.map((learnerUci) => {
          const historyUci = [cell.candidateUci, uci, learnerUci], id = sha(JSON.stringify([cell.rootId, ...historyUci]));
          let path = pathMap.get(id);
          if (!path) {
            const descendant = eventNode(root.fen, historyUci, definition);
            path = { id, rootId: cell.rootId, rootFen: root.fen, historyUci, fen: descendant.fen,
              terminalReason: descendant.terminalReason, legalReplyCount: descendant.legal.length, subjects: [] };
            pathMap.set(id, path);
          }
          let subject = path.subjects.find((s) => s.targetId === cell.targetId);
          if (!subject) { subject = { targetId: cell.targetId, selectedBy: [] }; path.subjects.push(subject); }
          require(!subject.selectedBy.includes(arm), "Duplicated recursive path subject/arm"); subject.selectedBy.push(arm);
          return { learnerUci, pathId: id };
        });
        return { replyUci: uci, nodeId: node.id, source: { ...binding, budget }, ...selection,
          selected, unexpandedTerminalLegalMoves: 0 };
      });
      return { arm, seedArm: seedArms[i], selectedReplyUcis: sourceArm.selectedReplyUcis,
        omittedFirstReplies: exact.replyCount - replies.length, replies,
        proofCeiling: "recursive_geometric_scheduling_actual_partial_provider_paths_not_profit_or_proof" };
    });
    return { ...cell, family: definition.family, phase: root.phase, arms: armRows };
  });
  const paths = [...pathMap.values()].sort((a, b) => a.id.localeCompare(b.id)), jobs = new Map();
  for (const path of paths) {
    path.subjects.sort((a, b) => a.targetId.localeCompare(b.targetId));
    path.subjects.forEach((s) => s.selectedBy.sort());
    if (path.terminalReason !== null) continue;
    const job = jobs.get(path.fen) ?? { id: sha(path.fen), fen: path.fen, paths: [], budgets: [] };
    job.paths.push(path.id);
    for (const s of path.subjects) for (const arm of s.selectedBy) if (!job.budgets.includes(arm.split(":")[1])) job.budgets.push(arm.split(":")[1]);
    job.budgets.sort(); jobs.set(path.fen, job);
  }
  const engineJobs = [...jobs.values()].sort((a, b) => a.id.localeCompare(b.id));
  for (const job of engineJobs) {
    job.actualReuse = []; job.missingBudgets = [];
    for (const budget of job.budgets) {
      const i = providerOff ? -1 : finalIndexes.findIndex((source) => source.get(job.fen)?.probes.some((p) => p.budget === budget));
      if (i < 0) job.missingBudgets.push(budget);
      else {
        const capture = finalIndexes[i].get(job.fen);
        engineMoves(capture, job.fen, `engine:${budget}:top8`, caches.ranks);
        job.actualReuse.push({ source: names[7 + i], row: captures[3 + i].rows.indexOf(capture), budget, sourceStatus: "actual_checked_captured_query" });
      }
    }
  }
  const leafCache = new Map();
  const finalPlyNodes = paths.flatMap((path) => path.subjects.flatMap((subject) => {
    const definition = definitions.get(subject.targetId), node = eventNode(path.rootFen, path.historyUci, definition);
    return subject.selectedBy.map((arm) => {
      const [, budget, widthText] = arm.split(":"), width = Number(widthText.slice(3));
      const job = jobs.get(path.fen), binding = job?.actualReuse.find((r) => r.budget === budget);
      if (node.terminalReason !== null || !binding) return { pathId: path.id, targetId: subject.targetId, arm,
        nodeId: node.id, source: null, status: node.terminalReason !== null ? "absorbing_terminal" : "source_off",
        selected: [], omittedLegal: node.terminalReason !== null ? 0 : node.legal.length,
        unexpandedTerminalLegalMoves: node.terminalReason !== null ? node.legal.length : 0 };
      const capture = sourceRows[binding.source].rows[binding.row], ranked = engineMoves(capture, node.fen, `engine:${budget}:top8`, caches.ranks);
      const selection = reserveEvent(node.legal, ranked, node.events.map((e) => e.uci), width);
      return { pathId: path.id, targetId: subject.targetId, arm, nodeId: node.id, source: binding, ...selection,
        selected: selection.selected.map((uci) => {
          const leafId = sha(JSON.stringify([path.rootId, ...path.historyUci, uci]));
          if (!leafCache.has(leafId)) {
            const next = Chess.fromSetup(parseFen(path.fen).unwrap()).unwrap(), parsed = parseUci(uci);
            require(parsed, "Invalid selected recursive leaf"); const move = normalizeMove(next, parsed);
            require(next.isLegal(move), "Illegal selected recursive leaf"); next.play(move);
            const fen = makeFen(next.toSetup());
            leafCache.set(leafId, { moveUci: uci, leafId, fen, terminalReason: boardTerminalReason(fen) });
          }
          return leafCache.get(leafId);
        }), unexpandedTerminalLegalMoves: 0 };
    });
  }));
  const candidateCoverage = rootsFrame.roots.flatMap((r) => r.candidates.map((c) => {
    const targetIds = rows.filter((cell) => cell.rootId === r.rootId && cell.candidateUci === c.moveUci).map((cell) => cell.targetId);
    return { rootId: r.rootId, candidateUci: c.moveUci, phase: r.phase, targetIds,
      status: targetIds.length ? "named_target_recursive_frame" : comparison.controls.some((c) => c.rootId === r.rootId)
        && comparison.controls.find((c) => c.rootId === r.rootId)?.status === "declared_relation_control"
        ? "declared_control_separate_not_evaluated" : "no_autonomous_semantic_target" };
  }));
  require(candidateCoverage.length === 193 && index(rows, key, "recursive cell").size === 182, "Lost recursive population");
  return { version: 1, profile: "d3262-coherent-recursive-semantic-frame-v1", manifest: comparison.manifest,
    authority: "disposable_recursive_geometry_scheduling_with_explicit_missing_sources_not_complete_arm5",
    preregistrationDigest: digests[names[0]], inputDigests: digests, providerOff,
    finalPlyQueries: seed.finalPlyQueries, controls: comparison.controls, candidateCoverage, arms, rows, paths,
    eventNodes: [...caches.events.values()].sort((a, b) => a.id.localeCompare(b.id)), finalPlyNodes, engineJobs,
    supplementJobs: engineJobs.filter((job) => job.missingBudgets.length).map((job) => ({ id: job.id,
      fen: job.fen, paths: job.paths, budgets: job.missingBudgets })) };
}
export function summarizeRecursiveFrame(frame) {
  return { cells: frame.rows.length, candidateCoverage: frame.candidateCoverage.length, paths: frame.paths.length,
    eventNodes: frame.eventNodes.length, finalPlyNodes: frame.finalPlyNodes.length,
    sourceOffFinalNodes: frame.finalPlyNodes.filter((n) => n.status === "source_off").length,
    engineJobs: frame.engineJobs.length, actualReuseQueries: frame.engineJobs.reduce((n, j) => n + j.actualReuse.length, 0),
    missingPositions: frame.supplementJobs.length, missingQueries: frame.supplementJobs.reduce((n, j) => n + j.budgets.length, 0),
    learnerReserved: frame.rows.flatMap((r) => r.arms.flatMap((a) => a.replies)).filter((r) => r.status === "event_reserved_outside_baseline").length,
    finalReserved: frame.finalPlyNodes.filter((n) => n.status === "event_reserved_outside_baseline").length };
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const frame = compileRecursiveFrame(loadRecursiveInputs()), plain = Buffer.from(`${JSON.stringify(frame)}\n`), compressed = gzipSync(plain, { level: 9 });
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${outputName}`, compressed, { flag: "wx" });
  else require(readFileSync(`${directory}/${outputName}`).equals(compressed), "Recursive frame differs from preregistered inputs");
  process.stdout.write(`${JSON.stringify({ digest: sha(compressed), logicalDigest: sha(plain), bytes: compressed.length,
    summary: summarizeRecursiveFrame(frame) }, null, 2)}\n`);
}
