// Disposable D3262/D3481 model-frontier instrument. This follows the same
// declared prefix through three policy nodes; it never licenses exact proof,
// observed human frequency, arbitrary-learner coverage or engine causality.
import { readFileSync, writeFileSync } from "node:fs";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { compileThirdPlyFrame, loadThirdPlyInputs } from "./coherent-third-ply-frame.mjs";
import { boardTerminalReason } from "./maia-horizon4-path-check.mjs";
import { directory, frameName, loadFrozenThirdPlyFrame, sha, validateThirdPlyMaia } from "./third-ply-source-check.mjs";

export const captureName = "d3262-maia-third-ply-capture.json";
export const outputName = "d3262-coherent-maia-fourth-ply.json";
export const modelArms = ["maia:prefix0.80", "maia:prefix0.90"];
const candidateKey = (row) => JSON.stringify([row.rootId, row.candidateUci]);
const replyKey = (row) => JSON.stringify([row.rootId, row.candidateUci, row.replyUci]);
const asBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
function check(value, message) { if (!value) throw new Error(message); }
function index(rows, key, label) {
  const result = new Map(rows.map((row, i) => [key(row), { row, index: i }]));
  check(result.size === rows.length, `Duplicated ${label}`);
  return result;
}
function prefix(support, threshold) {
  let mass = 0;
  const selected = [];
  for (const item of support.slice(0, 8)) {
    if (mass >= threshold) break;
    selected.push(item);
    mass += item.mass;
  }
  return { selected, mass };
}
function policyMass(row, uci) {
  const found = row.configuredSupport.find((entry) => entry.legalUci === uci);
  check(found !== undefined && Number.isFinite(found.mass) && found.mass > 0, "Selected path lost conditional source mass");
  return found.mass;
}
function state(fen) { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function play(fen, uci) {
  const board = state(fen), parsed = parseUci(uci);
  check(parsed !== undefined, "Invalid fourth-ply UCI");
  const move = normalizeMove(board, parsed);
  check(board.isLegal(move), "Illegal fourth-ply selection");
  board.play(move);
  return makeFen(board.toSetup());
}

export function compileMaiaFourthPly({ priorInputs, third, thirdBytes, final, finalBytes,
  direct, directBytes, child, childBytes }) {
  check(asBytes(compileThirdPlyFrame(...priorInputs)).equals(thirdBytes)
    && asBytes(third).equals(thirdBytes), "Crossed earlier provider frame or literal source bytes");
  // Python and JS spell some identical float values differently. Bind the
  // decoded object to the literal hashed bytes; never rewrite captured bytes
  // just to match this instrument's JSON serializer.
  check(JSON.stringify(final) === JSON.stringify(JSON.parse(finalBytes)), "Crossed literal final source bytes");
  validateThirdPlyMaia(third, thirdBytes, direct, directBytes, child, childBytes, final);
  const [, , union, sources, childSources] = priorInputs;
  const parents = index(childSources.flatMap((source, sourceIndex) => source.rows.map((row) => ({ ...row,
    sourceName: sourceIndex === 0 ? "d3262-maia-history-replay.json" : "d3262-maia-coherent-new-child.json" }))),
  candidateKey, "first-child model source");
  const deeper = index(union.bindings, replyKey, "deeper path binding");
  const finalIndex = index(final.rows, (row) => row.id, "final model history");
  const candidatePaths = new Map(), paths = [], leaves = new Map(), used = new Set();
  for (const path of third.paths.filter((entry) => entry.selectedBy.some((arm) => modelArms.includes(arm)))) {
    const [candidateUci, replyUci, learnerUci] = path.historyUci;
    const subject = { rootId: path.rootId, candidateUci, replyUci };
    const parent = parents.get(candidateKey(subject))?.row;
    const binding = deeper.get(replyKey(subject))?.row;
    const policy = sources[binding?.maia.source]?.rows[binding?.maia.row];
    const captured = finalIndex.get(path.id);
    check(parent?.rootFen === path.rootFen && policy?.rootFen === path.rootFen,
      "Crossed conditional model root history");
    // The frozen frame already handles zero-legal-reply paths without a job.
    const terminalWithoutJob = path.legalReplyCount === 0;
    check(terminalWithoutJob ? captured === undefined : captured !== undefined, "Missing or invented final model history");
    if (captured) used.add(path.id);
    const terminalReason = terminalWithoutJob ? boardTerminalReason(path.fen) : captured.row.terminalReason;
    const terminal = terminalWithoutJob || captured.row.terminal;
    check(!terminal || terminalReason !== null, "Terminal path lacks board authority");
    const conditionalReplyMass = policyMass(parent, replyUci);
    const conditionalLearnerMass = policyMass(policy, learnerUci);
    const pathMass = conditionalReplyMass * conditionalLearnerMass;
    const armRows = path.selectedBy.filter((arm) => modelArms.includes(arm)).map((arm) => {
      const selectedPrefix = terminal ? { selected: [], mass: 1 }
        : prefix(captured.row.configuredSupport, Number(arm.slice("maia:prefix".length)));
      const selected = selectedPrefix.selected.map((entry) => {
        const historyUci = [...path.historyUci, entry.legalUci], fen = play(path.fen, entry.legalUci);
        const id = sha(JSON.stringify([path.rootId, ...historyUci]));
        let leaf = leaves.get(id);
        if (!leaf) leaf = { id, rootId: path.rootId, rootFen: path.rootFen, historyUci, fen,
          legalNextCount: legalMoves(state(fen)).length, terminalReason: boardTerminalReason(fen), selectedBy: [] };
        check(!leaf.selectedBy.includes(arm), "Duplicated final arm leaf");
        leaf.selectedBy.push(arm);
        leaves.set(id, leaf);
        return { leafId: id, moveUci: entry.legalUci, conditionalMass: entry.mass,
          jointMass: pathMass * entry.mass };
      });
      return { arm, pathMass, coveredConditionalMass: selectedPrefix.mass,
        coveredPathMass: pathMass * selectedPrefix.mass,
        omittedPathMass: Math.max(0, pathMass * (1 - selectedPrefix.mass)), selected,
        omittedLegalReplies: terminal ? 0 : path.legalReplyCount - selected.length,
        unexpandedTerminalLegalMoves: terminal ? path.legalReplyCount : 0 };
    });
    const item = { id: path.id, rootId: path.rootId, rootFen: path.rootFen, historyUci: path.historyUci,
      fen: path.fen, legalReplyCount: path.legalReplyCount,
      source: captured ? { name: captureName, row: captured.index } : null,
      firstSource: { name: parent.sourceName, historyUci: parent.historyUci },
      secondSource: { name: binding.maia.source, row: binding.maia.row, historyUci: policy.historyUci },
      conditionalReplyMass, conditionalLearnerMass, terminalReason, arms: armRows };
    paths.push(item);
    const key = candidateKey({ rootId: path.rootId, candidateUci });
    const list = candidatePaths.get(key) ?? [];
    list.push(item);
    candidatePaths.set(key, list);
  }
  check(used.size === final.rows.length, "Unconsumed final model population");
  const rows = third.rows.map((row) => {
    const related = candidatePaths.get(candidateKey(row)) ?? [];
    const parent = parents.get(candidateKey(row))?.row;
    const armRows = modelArms.map((arm) => {
      const before = row.arms.find((entry) => entry.arm === arm);
      const selected = related.filter((path) => path.arms.some((entry) => entry.arm === arm));
      const get = (path) => path.arms.find((entry) => entry.arm === arm);
      const stoppedAtReplyMass = row.terminalAfterCandidate ? 1 : row.replies
        .filter((entry) => entry.legalLearnerCount === 0 && entry.arms.some((value) => value.arm === arm))
        .reduce((sum, entry) => sum + policyMass(parent, entry.replyUci), 0);
      const twoLayerMass = stoppedAtReplyMass + selected.reduce((sum, path) => sum + get(path).pathMass, 0);
      check(Math.abs(twoLayerMass - before.frontierMass) < 1e-5, "Crossed two-layer joint mass or missing arm path");
      const frontierMass = stoppedAtReplyMass + selected.reduce((sum, path) => sum + get(path).coveredPathMass, 0);
      check(Number.isFinite(frontierMass) && frontierMass >= 0 && frontierMass <= twoLayerMass + 1e-5,
        "Invalid three-layer composed mass");
      const stoppedAtThirdPlyMass = selected.filter((path) => path.terminalReason !== null)
        .reduce((sum, path) => sum + get(path).pathMass, 0);
      const selectedLeaves = selected.flatMap((path) => get(path).selected);
      const stoppedAtFourthPlyMass = selectedLeaves.filter((entry) => leaves.get(entry.leafId).terminalReason !== null)
        .reduce((sum, entry) => sum + entry.jointMass, 0);
      return { arm, firstCoveredMass: before.firstCoveredMass, twoLayerMass, frontierMass,
        omittedFirstLayerMass: before.omittedFirstLayerMass, omittedSecondLayerMass: before.omittedSecondLayerMass,
        omittedThirdLayerMass: Math.max(0, twoLayerMass - frontierMass), residualMass: Math.max(0, 1 - frontierMass),
        stoppedAtReplyMass, stoppedAtThirdPlyMass, stoppedAtFourthPlyMass,
        selectedThirdPlyPaths: selected.length, selectedFourthPlyEdges: selectedLeaves.length,
        omittedLegalFourthRepliesWithinSelectedNonterminalPaths: selected.reduce((sum, path) => sum + get(path).omittedLegalReplies, 0),
        unexpandedTerminalLegalMoves: selected.reduce((sum, path) => sum + get(path).unexpandedTerminalLegalMoves, 0) };
    });
    return { rootId: row.rootId, candidateUci: row.candidateUci, phase: row.phase,
      terminalAfterCandidate: row.terminalAfterCandidate, legalReplyCount: row.legalReplyCount, arms: armRows };
  });
  return { version: 1, profile: "d3262-coherent-maia-fourth-ply-v1", manifest: third.manifest,
    authority: "three_policy_layer_configured_model_frontier_not_human_frequency_exact_proof_or_engine_reason",
    inputDigests: { ...third.inputDigests, [frameName]: sha(thirdBytes), [captureName]: sha(finalBytes) },
    source: final.source, modelArms, rows, paths,
    leaves: [...leaves.values()].sort((left, right) => left.id.localeCompare(right.id)) };
}

export function loadFourthPlyInputs() {
  const { frame: third, bytes: thirdBytes } = loadFrozenThirdPlyFrame();
  const finalBytes = readFileSync(`${directory}/${captureName}`);
  check(sha(finalBytes) === "sha256:64652308c2196cd14b59414fa016506e84aa557fd3419e042437505a52b8c508",
    "Changed frozen final Maia capture");
  const directBytes = readFileSync(`${directory}/d3262-maia-direct-logits.json`);
  const childBytes = readFileSync(`${directory}/d3262-maia-history-replay.json`);
  return { priorInputs: loadThirdPlyInputs(), third, thirdBytes, final: JSON.parse(finalBytes), finalBytes,
    direct: JSON.parse(directBytes), directBytes, child: JSON.parse(childBytes), childBytes };
}
export function summary(artifact) {
  return { digest: sha(asBytes(artifact)), candidates: artifact.rows.length, thirdPlyPaths: artifact.paths.length,
    fourthPlyLeaves: artifact.leaves.length,
    arms: Object.fromEntries(modelArms.map((arm) => {
      const entries = artifact.rows.map((row) => row.arms.find((item) => item.arm === arm));
      const values = entries.map((entry) => entry.frontierMass).sort((left, right) => left - right);
      const threshold = Number(arm.slice("maia:prefix".length));
      return [arm, { minimumJointMass: values[0], medianJointMass: values[Math.floor(values.length / 2)],
        belowJointThreshold: values.filter((mass) => mass + 1e-5 < threshold).length,
        selectedFourthPlyEdges: entries.reduce((sum, entry) => sum + entry.selectedFourthPlyEdges, 0),
        omittedLegalFourthReplies: entries.reduce((sum, entry) => sum + entry.omittedLegalFourthRepliesWithinSelectedNonterminalPaths, 0),
        phase: Object.fromEntries([...new Set(artifact.rows.map((row) => row.phase))].map((phase) => {
          const subset = artifact.rows.filter((row) => row.phase === phase).map((row) => row.arms.find((entry) => entry.arm === arm));
          return [phase, { candidates: subset.length, minimumJointMass: Math.min(...subset.map((entry) => entry.frontierMass)),
            belowJointThreshold: subset.filter((entry) => entry.frontierMass + 1e-5 < threshold).length }];
        })) }];
    })) };
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const artifact = compileMaiaFourthPly(loadFourthPlyInputs()), output = asBytes(artifact);
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${outputName}`, output, { flag: "wx" });
  else check(readFileSync(`${directory}/${outputName}`).equals(output), "Fourth-ply model frontier differs from frozen sources");
  process.stdout.write(`${JSON.stringify(summary(artifact), null, 2)}\n`);
}
