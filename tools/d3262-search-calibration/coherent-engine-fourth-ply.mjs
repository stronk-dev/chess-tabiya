// Disposable D3262/D3485 actual provider traversal. Ranks order visits, not
// probabilities, exact negatives, recursive semantic proof or engine reasons.
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { engineMoves } from "./coherent-third-ply-frame.mjs";
import { boardTerminalReason } from "./maia-horizon4-path-check.mjs";
import { directory, frameName, sha, loadFrozenThirdPlyFrame, validateThirdPlyStockfish } from "./third-ply-source-check.mjs";
import { loadSemanticCaptureFrame, validateSemanticCapture, captureName as supplementName } from "./semantic-third-ply-capture.mjs";
import { outputName as semanticName, arms as semanticArms } from "./coherent-semantic-third-ply.mjs";

export const captureName = "d3262-stockfish-third-ply-capture.json.gz";
export const outputName = "d3262-coherent-engine-fourth-ply.json.gz";
export const engineArms = ["depth8", "depth12", "movetime100"].flatMap((budget) => [2, 4, 8].map((width) => `engine:${budget}:top${width}`));
function check(value, message) { if (!value) throw new Error(message); }
const key = (row) => JSON.stringify([row.rootId, row.candidateUci]);
const cellKey = (row) => JSON.stringify([row.rootId, row.targetId, row.candidateUci]);
function index(rows, identity, label) {
  const result = new Map(rows.map((row, i) => [identity(row), { row, index: i }]));
  check(result.size === rows.length, `Duplicated ${label}`);
  return result;
}
function replay(rootFen, history) {
  const board = Chess.fromSetup(parseFen(rootFen).unwrap()).unwrap();
  for (const uci of history) {
    check(boardTerminalReason(makeFen(board.toSetup())) === null, "Frozen path crosses an ancestor game terminal");
    const parsed = parseUci(uci), move = parsed && normalizeMove(board, parsed);
    check(move && board.isLegal(move), "Illegal selected engine history");
    board.play(move);
  }
  return board;
}
function literal(value, raw, compressed) {
  check(JSON.stringify(value) === JSON.stringify(JSON.parse(compressed ? gunzipSync(raw) : raw)), "Crossed literal continuation source bytes");
}

export function compileEngineFourthPly({ third, thirdBytes, final, finalBytes, semantic, semanticBytes, supplement, supplementBytes }) {
  literal(third, thirdBytes, false); literal(final, finalBytes, true);
  literal(semantic, semanticBytes, true); literal(supplement, supplementBytes, true);
  check(third.profile === "d3262-coherent-third-ply-v1" && semantic.profile === "d3262-coherent-semantic-third-ply-v1"
    && third.manifest === semantic.manifest && semantic.inputDigests[frameName] === sha(thirdBytes)
    && JSON.stringify(semantic.arms) === JSON.stringify(semanticArms), "Crossed engine/semantic traversal population");
  check(final.partial === false && final.start === 0 && final.positions === third.engineJobs.length
    && supplement.partial === false && supplement.start === 0 && supplement.positions === semantic.supplementJobs.length,
  "Incomplete actual final-ply source population");
  validateThirdPlyStockfish(third, thirdBytes, final);
  validateSemanticCapture({ ...semantic, engineJobs: semantic.supplementJobs }, semanticBytes, supplement);
  check([final, supplement].every((source) => Object.keys(source.source).length === Object.keys(third.finalPlyQueries.stockfish).length
    && Object.keys(source.source).every((field) => source.source[field] === third.finalPlyQueries.stockfish[field])),
    "Crossed full final-ply engine identity");
  const captures = { [captureName]: final, [supplementName]: supplement };
  const original = index(final.rows, (row) => row.fen, "original engine FEN"), extra = index(supplement.rows, (row) => row.fen, "supplement engine FEN");
  const jobs = index(third.engineJobs, (row) => row.fen, "original engine job");
  const semanticJobs = index(semantic.engineJobs, (row) => row.fen, "semantic engine job");
  let resolvedReuseQueries = 0, resolvedSupplementQueries = 0;
  for (const { row: job } of semanticJobs.values()) {
    check(new Set(job.budgets).size === job.budgets.length
      && JSON.stringify(job.budgets) === JSON.stringify([...job.plannedReuse.map((item) => item.budget), ...job.missingBudgets].sort()),
    "Crossed semantic budget partition");
    for (const reuse of job.plannedReuse) {
      check(reuse.frame === frameName && reuse.sourceStatus === "awaiting_complete_checked_capture"
        && reuse.jobId === jobs.get(job.fen)?.row.id && original.get(job.fen)?.row.probes.some((probe) => probe.budget === reuse.budget),
      "Planned semantic reuse has no actual captured query");
      resolvedReuseQueries++;
    }
    for (const budget of job.missingBudgets) {
      check(extra.get(job.fen)?.row.probes.some((probe) => probe.budget === budget)
        && !original.get(job.fen)?.row.probes.some((probe) => probe.budget === budget), "Missing or conflicting actual supplement query");
      resolvedSupplementQueries++;
    }
  }
  check(resolvedSupplementQueries === supplement.rows.reduce((sum, row) => sum + row.probes.length, 0), "Unconsumed semantic supplement budget");
  const leaves = new Map(), rankCache = new Map(), usedOriginal = new Set(), usedSupplement = new Set();
  const profiles = [
    { kind: "engine", input: third, arms: engineArms, identity: key, pathArms: (path) => path.selectedBy.filter((arm) => engineArms.includes(arm)) },
    { kind: "semantic_first_reply_reserve", input: semantic, arms: semanticArms, identity: cellKey,
      pathArms: (path) => [...new Set(path.subjects.flatMap((subject) => subject.selectedBy))] },
  ].map(({ kind, input, arms, identity, pathArms }) => {
    const paths = input.paths.filter((path) => pathArms(path).length > 0).map((path) => {
      check(path.id === sha(JSON.stringify([path.rootId, ...path.historyUci])) && path.historyUci.length === 3, "Crossed third-ply path identity");
      const board = replay(path.rootFen, path.historyUci), fen = makeFen(board.toSetup());
      const legalCount = legalMoves(board).length, terminalReason = boardTerminalReason(fen);
      check(fen === path.fen && legalCount === path.legalReplyCount
        && (kind === "engine" || terminalReason === path.terminalReason), "Crossed third-ply board/terminal denominator");
      const armRows = pathArms(path).map((arm) => {
        check(arms.includes(arm), "Undeclared continuation arm");
        const [, budget, top] = arm.split(":"), width = Number(top.slice(3));
        let source = null, selected = [];
        // Preserve source jobs on outcome-terminal boards, but never expand them.
        if (terminalReason === null) {
          const supplementBudget = kind !== "engine" && semanticJobs.get(fen)?.row.missingBudgets.includes(budget);
          const sourceName = supplementBudget ? supplementName : captureName;
          const found = (supplementBudget ? extra : original).get(fen);
          check(found && found.row.probes.some((probe) => probe.budget === budget), "Missing actual final-ply budget");
          source = { source: sourceName, row: found.index, budget, probe: found.row.probes.findIndex((probe) => probe.budget === budget) };
          (supplementBudget ? usedSupplement : usedOriginal).add(JSON.stringify([fen, budget]));
          selected = engineMoves(found.row, fen, `engine:${budget}:top${width}`, rankCache).map((moveUci, i) => {
            const historyUci = [...path.historyUci, moveUci], leafId = sha(JSON.stringify([path.rootId, ...historyUci]));
            if (!leaves.has(leafId)) {
              const position = replay(path.rootFen, historyUci);
              leaves.set(leafId, { id: leafId, rootId: path.rootId, rootFen: path.rootFen, historyUci,
                fen: makeFen(position.toSetup()), terminalReason: boardTerminalReason(makeFen(position.toSetup())) });
            }
            return { moveUci, rank: i + 1, leafId };
          });
        }
        return { arm, source, selected, omittedLegal: terminalReason === null ? legalCount - selected.length : 0,
          unexpandedTerminalLegalMoves: terminalReason === null ? 0 : legalCount };
      });
      return { ...path, terminalReason, arms: armRows };
    });
    const pathIndex = index(paths, (path) => path.id, "selected continuation history");
    const byCandidate = new Map();
    for (const path of paths) {
      const identity = key({ rootId: path.rootId, candidateUci: path.historyUci[0] });
      byCandidate.set(identity, [...(byCandidate.get(identity) ?? []), path]);
    }
    const rows = input.rows.map((row) => {
      const candidates = byCandidate.get(key(row)) ?? [];
      const armRows = arms.map((arm) => {
        const earlier = row.arms.find((item) => item.arm === arm);
        check(earlier, "Lost input candidate/cell arm");
        const selected = candidates.filter((path) => path.arms.some((item) => item.arm === arm)
          && (kind === "engine" || path.subjects.some((subject) => subject.targetId === row.targetId && subject.selectedBy.includes(arm))));
        if (kind !== "engine") check(JSON.stringify([...earlier.selectedLearnerPaths].sort()) === JSON.stringify(selected.map((path) => path.id).sort()),
          "Lost semantic subject/path selection");
        return { arm, inputSelection: earlier, selectedPaths: selected.map((path) => path.id),
          selectedFourthPlyEdges: selected.reduce((sum, path) => sum + path.arms.find((item) => item.arm === arm).selected.length, 0),
          omittedLegalFourthRepliesWithinSelectedNonterminalPaths: selected.reduce((sum, path) => sum + path.arms.find((item) => item.arm === arm).omittedLegal, 0),
          absorbingThirdPlyPaths: selected.filter((path) => path.terminalReason !== null).map((path) => path.id),
          universalVerdict: "not_evaluated", negativeVerdict: "abstain_partial", weightAuthority: "unweighted_selected_paths_not_policy_mass" };
      });
      check(new Set(armRows.map((item) => item.arm)).size === arms.length, "Duplicated output arm");
      return { ...row, arms: armRows };
    });
    check(index(rows, identity, "output candidate/cell").size === input.rows.length
      && paths.every((path) => rows.some((row) => key(row) === key({ rootId: path.rootId, candidateUci: path.historyUci[0] }))), "Unconsumed continuation population");
    // Read the index here to retain an explicit uniqueness assertion, not a census-only anchor.
    check(pathIndex.size === paths.length, "Duplicated output history");
    return { kind, traversalRule: kind === "engine" ? "same_engine_budget_and_width_at_each_selected_layer"
      : "frozen_one_slot_first_reply_reserve_then_same_engine_budget_and_width_no_recursive_semantic_selector",
    arms, rows, paths, candidateCoverage: input.candidateCoverage ?? null, controls: input.controls ?? null };
  });
  const unusedQueries = [];
  for (const [name, source] of Object.entries(captures)) for (const row of source.rows) for (const probe of row.probes) {
    if ((name === captureName ? usedOriginal : usedSupplement).has(JSON.stringify([row.fen, probe.budget]))) continue;
    const reason = boardTerminalReason(row.fen);
    check(reason !== null, "Unconsumed nonterminal final-ply source query");
    unusedQueries.push({ source: name, jobId: row.jobId, budget: probe.budget, reason: "absorbed_game_terminal", terminalReason: reason });
  }
  return { version: 1, profile: "d3262-coherent-engine-fourth-ply-v1", manifest: third.manifest,
    authority: "actual_partial_provider_paths_not_recursive_semantic_proof_policy_mass_or_engine_reason",
    inputDigests: { [frameName]: sha(thirdBytes), [captureName]: sha(finalBytes), [semanticName]: sha(semanticBytes), [supplementName]: sha(supplementBytes) },
    source: third.finalPlyQueries.stockfish, resolvedReuseQueries, resolvedSupplementQueries, unusedQueries,
    profiles, leaves: [...leaves.values()].sort((a, b) => a.id.localeCompare(b.id)) };
}

export function loadEngineFourthPlyInputs() {
  const { frame: third, bytes: thirdBytes } = loadFrozenThirdPlyFrame();
  const finalBytes = readFileSync(`${directory}/${captureName}`), supplementBytes = readFileSync(`${directory}/${supplementName}`);
  const semanticBytes = readFileSync(`${directory}/${semanticName}`);
  loadSemanticCaptureFrame();
  return { third, thirdBytes, final: JSON.parse(gunzipSync(finalBytes)), finalBytes,
    semantic: JSON.parse(gunzipSync(semanticBytes)), semanticBytes, supplement: JSON.parse(gunzipSync(supplementBytes)), supplementBytes };
}
export function summary(artifact) {
  return { resolvedReuseQueries: artifact.resolvedReuseQueries, resolvedSupplementQueries: artifact.resolvedSupplementQueries,
    unusedTerminalQueries: artifact.unusedQueries.length, distinctFourthPlyHistories: artifact.leaves.length,
    profiles: artifact.profiles.map((profile) => ({ kind: profile.kind, cells: profile.rows.length, paths: profile.paths.length,
      terminalPaths: profile.paths.filter((path) => path.terminalReason !== null).length,
      arms: Object.fromEntries(profile.arms.map((arm) => {
        const rows = profile.rows.map((row) => row.arms.find((item) => item.arm === arm));
        return [arm, { selectedEdges: rows.reduce((sum, row) => sum + row.selectedFourthPlyEdges, 0),
          omittedLegalFourthReplies: rows.reduce((sum, row) => sum + row.omittedLegalFourthRepliesWithinSelectedNonterminalPaths, 0) }];
      })) })) };
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const artifact = compileEngineFourthPly(loadEngineFourthPlyInputs()), raw = Buffer.from(`${JSON.stringify(artifact)}\n`), bytes = gzipSync(raw);
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${outputName}`, bytes, { flag: "wx" });
  else check(readFileSync(`${directory}/${outputName}`).equals(bytes), "Engine continuation differs from actual frozen sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(bytes), logicalDigest: sha(raw), compressedBytes: bytes.length, ...summary(artifact) }, null, 2)}\n`);
}
