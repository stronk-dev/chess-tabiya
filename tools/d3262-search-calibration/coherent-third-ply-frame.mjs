// Disposable D3262 continuation instrument, not product search. A visited
// policy path is not a human frequency, exact negative, or engine explanation.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { enumerateCandidate, legalMoves } from "./exact-reply-enumeration.mjs";

const directory = "planning/semantic-consequence-search";
export const sourceNames = ["d3262-stockfish-horizon4-capture.json", "d3262-stockfish-coherent-deeper-supplement.json",
  "d3262-maia-horizon4-path-capture.json", "d3262-maia-coherent-deeper-supplement.json"];
const names = ["d3262-coherent-root-frame.json", "d3262-coherent-first-reply-frontier.json",
  "d3262-coherent-deeper-source-union.json", ...sourceNames,
  "d3262-maia-history-replay.json", "d3262-maia-coherent-new-child.json"];
export const arms = [...["depth8", "depth12", "movetime100"].flatMap((budget) =>
  [2, 4, 8].map((width) => `engine:${budget}:top${width}`)), "maia:prefix0.80", "maia:prefix0.90"];
const sha = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
function check(value, message) { if (!value) throw new Error(message); }
const pathKey = (row) => JSON.stringify([row.rootId, row.candidateUci, row.replyUci]);
const candidateKey = (row) => JSON.stringify([row.rootId, row.candidateUci]);
function index(rows, key, label) {
  const result = new Map(rows.map((row) => [key(row), row]));
  check(result.size === rows.length, `Duplicated ${label}`);
  return result;
}
function sameSet(left, right) {
  return left.length === right.length && new Set(left).size === left.length && left.every((value) => right.includes(value));
}
function state(fen) { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function replay(fen, ucis) {
  const position = state(fen);
  for (const uci of ucis) {
    const parsed = parseUci(uci);
    check(parsed !== undefined, `Invalid path UCI ${uci}`);
    const move = normalizeMove(position, parsed);
    check(position.isLegal(move), `Illegal path UCI ${uci}`);
    position.play(move);
  }
  return position;
}
function modelIdentity(source) {
  const fields = ["modelId", "modelCheckpointSha256", "uciSourceSha256", "mode", "band", "temperature", "topP",
    "useUciHistory", "device", "rawMeaning", "configuredMeaning", "preRootHistory"];
  check(fields.every((field) => source[field] !== undefined), "Missing Maia query identity");
  check(source.useUciHistory === true && source.configuredMeaning === "direct_sample_from_logits_support_and_normalized_mass",
    "Wrong configured Maia authority");
  return JSON.stringify(fields.map((field) => source[field]));
}
function configuredPolicy(row, fen, rootFen, history) {
  check(row.fen === fen && row.rootFen === rootFen && JSON.stringify(row.historyUci) === JSON.stringify(history),
    "Crossed Maia path history");
  const legal = legalMoves(state(fen)).map((entry) => entry.uci);
  check(sameSet(row.rawFullLegal.map((entry) => entry.legalUci), legal)
    && row.rawFullLegal.every((entry) => Number.isFinite(entry.mass) && entry.mass >= 0)
    && Math.abs(row.rawFullLegal.reduce((sum, entry) => sum + entry.mass, 0) - 1) < 1e-5,
  "Crossed Maia legal denominator");
  const support = row.configuredSupport;
  check(Array.isArray(support) && support.length > 0 && new Set(support.map((entry) => entry.legalUci)).size === support.length
    && support.every((entry, i) => legal.includes(entry.legalUci) && Number.isFinite(entry.mass) && entry.mass > 0
      && (i === 0 || support[i - 1].mass >= entry.mass))
    && Math.abs(support.reduce((sum, entry) => sum + entry.mass, 0) - 1) < 1e-5,
  "Invalid configured Maia support or normalized mass");
  return support;
}
function prefix(support, threshold) {
  const result = [];
  let mass = 0;
  for (const entry of support.slice(0, 8)) {
    if (mass >= threshold) break;
    result.push(entry);
    mass += entry.mass;
  }
  return result;
}
export function engineMoves(row, fen, arm, cache) {
  const [, budget, top] = arm.split(":");
  const cached = cache.get(row)?.get(budget);
  if (cached !== undefined) return cached.slice(0, Number(top.slice(3)));
  const probes = row.probes.filter((probe) => probe.budget === budget);
  check(row.fen === fen && probes.length === 1, "Missing or crossed engine budget");
  const probe = probes[0], legal = legalMoves(state(fen)).map((entry) => entry.uci);
  check(sameSet(probe.legal, legal) && probe.entries.length === Math.min(8, legal.length)
    && new Set(probe.entries.map((entry) => entry.moveUci)).size === probe.entries.length
    && sameSet(probe.missingMoves, legal.filter((uci) => !probe.entries.some((entry) => entry.moveUci === uci))),
  "Crossed coherent engine legal/rank denominator");
  check(probe.entries.every((entry, i) => entry.rank === i + 1 && entry.depth === probe.coherentDepth
    && legal.includes(entry.moveUci) && entry.pv?.[0] === entry.moveUci), "Mixed or crossed coherent engine ranks");
  for (const entry of probe.entries) replay(fen, entry.pv);
  const moves = probe.entries.map((entry) => entry.moveUci);
  const budgets = cache.get(row) ?? new Map();
  budgets.set(budget, moves);
  cache.set(row, budgets);
  return moves.slice(0, Number(top.slice(3)));
}

export function compileThirdPlyFrame(frame, first, union, sources, childMaia, inputDigests) {
  check(frame.profile === "d3262-coherent-root-v1" && first.profile === "d3262-coherent-first-reply-v1"
    && union.profile === "d3262-coherent-deeper-source-union-v1"
    && first.manifest === frame.manifest && union.manifest === frame.manifest,
  "Crossed corrected population authorities");
  for (const [name, source] of Object.entries(sources)) {
    check(source.manifest === frame.manifest && union.inputDigests[name] === inputDigests[name], "Crossed deeper source digest");
  }
  check(union.inputDigests[names[1]] === inputDigests[names[1]], "Crossed first-reply source digest");
  const identities = [...childMaia, sources[sourceNames[2]], sources[sourceNames[3]]].map((source) => modelIdentity(source.source));
  check(new Set(identities).size === 1, "Crossed Maia model or sampling identity");
  check(["engineName", "executableDigest", "threads", "hashMb", "multiPv", "scorePerspective"].every((field) =>
    sources[sourceNames[0]].source[field] !== undefined
      && sources[sourceNames[0]].source[field] === sources[sourceNames[1]].source[field])
    && sources[sourceNames[0]].source.multiPv === "top8_legal_moves_at_selected_reply",
  "Crossed Stockfish query identity");
  const firstIndex = index(first.rows, candidateKey, "first-reply candidate");
  const bindingIndex = index(union.bindings, pathKey, "deeper path binding");
  const childIndices = childMaia.map((source) => index(source.rows, candidateKey, "child Maia path"));
  const usedBindings = new Set(), continuations = new Map(), rows = [], engineCache = new Map();
  for (const root of frame.roots) for (const candidate of root.candidates) {
    const subject = { rootId: root.rootId, candidateUci: candidate.moveUci };
    const firstRow = firstIndex.get(candidateKey(subject));
    const exact = enumerateCandidate(root.fen, candidate.moveUci);
    check(firstRow !== undefined && firstRow.legalReplyCount === exact.replyCount, "Missing exact first-reply denominator");
    const childMatches = childIndices.map((source) => source.get(candidateKey(subject))).filter(Boolean);
    check(childMatches.length === (exact.terminal ? 0 : 1), "Missing or duplicated first-child Maia source");
    const firstPolicy = exact.terminal ? [] : configuredPolicy(childMatches[0], exact.afterFen, root.fen, [candidate.moveUci]);
    const visited = new Map();
    for (const reply of firstRow.replies) {
      const legalReply = exact.replies.find((entry) => entry.uci === reply.uci);
      check(legalReply?.fen === reply.fen && reply.selectedBy.length > 0
        && new Set(reply.selectedBy).size === reply.selectedBy.length && reply.selectedBy.every((arm) => arms.includes(arm)),
      "Crossed first-reply selection");
      check(!visited.has(reply.uci), "Duplicated selected opponent reply");
      const path = { ...subject, replyUci: reply.uci }, binding = bindingIndex.get(pathKey(path));
      check(binding?.fen === reply.fen, "Missing or crossed deeper binding");
      usedBindings.add(pathKey(path));
      const engine = sources[binding.stockfish.source]?.rows[binding.stockfish.row];
      const maia = sources[binding.maia.source]?.rows[binding.maia.row];
      check(engine?.fen === reply.fen && maia?.fen === reply.fen
        && pathKey(maia) === pathKey(path), "Crossed deeper source row reference");
      const legalLearner = legalMoves(state(reply.fen)).map((entry) => entry.uci);
      const policy = legalLearner.length === 0 ? []
        : configuredPolicy(maia, reply.fen, root.fen, [candidate.moveUci, reply.uci]);
      const armRows = reply.selectedBy.map((arm) => {
        const selected = legalLearner.length === 0 ? [] : arm.startsWith("engine:")
          ? engineMoves(engine, reply.fen, arm, engineCache)
          : prefix(policy, Number(arm.slice("maia:prefix".length))).map((entry) => entry.legalUci);
        for (const learnerUci of selected) {
          const historyUci = [candidate.moveUci, reply.uci, learnerUci];
          const id = sha(JSON.stringify([root.rootId, ...historyUci]));
          let item = continuations.get(id);
          if (item === undefined) {
            const position = replay(root.fen, historyUci), fen = makeFen(position.toSetup());
            item = { id, rootId: root.rootId, rootFen: root.fen,
              historyUci, fen, legalReplyCount: legalMoves(position).length, selectedBy: [] };
          }
          check(!item.selectedBy.includes(arm), "Crossed continuation identity");
          item.selectedBy.push(arm);
          continuations.set(id, item);
        }
        const coveredMass = arm.startsWith("maia:") ? (legalLearner.length === 0 ? 1
          : policy.filter((entry) => selected.includes(entry.legalUci)).reduce((sum, entry) => sum + entry.mass, 0)) : null;
        return { arm, selected, unvisitedLegal: legalLearner.length - selected.length,
          terminal: legalLearner.length === 0, coveredMass };
      });
      visited.set(reply.uci, { replyUci: reply.uci, legalLearnerCount: legalLearner.length, arms: armRows });
    }
    const armRows = arms.map((arm) => {
      const selected = [...visited.values()].filter((entry) => entry.arms.some((value) => value.arm === arm));
      if (arm.startsWith("engine:")) {
        check(selected.length === Math.min(Number(arm.split(":")[2].slice(3)), exact.replyCount), "Missing engine first-layer selection");
      } else {
        const expected = prefix(firstPolicy, Number(arm.slice("maia:prefix".length))).map((entry) => entry.legalUci);
        check(sameSet(selected.map((entry) => entry.replyUci), expected), "Crossed Maia first-layer prefix");
      }
      const frontierMass = arm.startsWith("maia:") ? (exact.terminal ? 1 : selected.reduce((sum, entry) => {
        const parent = firstPolicy.find((value) => value.legalUci === entry.replyUci);
        return sum + parent.mass * entry.arms.find((value) => value.arm === arm).coveredMass;
      }, 0)) : null;
      check(frontierMass === null || Number.isFinite(frontierMass) && frontierMass >= 0 && frontierMass <= 1 + 1e-5,
        "Invalid composed model path mass");
      const firstCoveredMass = arm.startsWith("maia:") ? (exact.terminal ? 1 : selected.reduce((sum, entry) =>
        sum + firstPolicy.find((value) => value.legalUci === entry.replyUci).mass, 0)) : null;
      return { arm, selectedReplies: selected.length, unvisitedReplies: exact.replyCount - selected.length,
        selectedLearnerEdges: selected.reduce((sum, entry) => sum + entry.arms.find((value) => value.arm === arm).selected.length, 0),
        unvisitedLearnerEdgesWithinSelectedReplies: selected.reduce((sum, entry) => sum + entry.arms.find((value) => value.arm === arm).unvisitedLegal, 0),
        completedAtReply: selected.filter((entry) => entry.legalLearnerCount === 0).length,
        firstCoveredMass, frontierMass,
        omittedFirstLayerMass: firstCoveredMass === null ? null : Math.max(0, 1 - firstCoveredMass),
        omittedSecondLayerMass: frontierMass === null ? null : Math.max(0, firstCoveredMass - frontierMass),
        residualMass: frontierMass === null ? null : Math.max(0, 1 - frontierMass) };
    });
    rows.push({ ...subject, phase: root.phase, terminalAfterCandidate: exact.terminal,
      legalReplyCount: exact.replyCount, replies: [...visited.values()], arms: armRows });
  }
  check(rows.length === first.rows.length && usedBindings.size === union.bindings.length
    && [...bindingIndex.keys()].every((key) => usedBindings.has(key)), "Unconsumed or missing continuation population");
  const paths = [...continuations.values()].sort((left, right) => left.id.localeCompare(right.id));
  for (const path of paths) path.selectedBy.sort();
  const engineJobs = new Map();
  for (const path of paths.filter((item) => item.legalReplyCount > 0 && item.selectedBy.some((arm) => arm.startsWith("engine:")))) {
    const job = engineJobs.get(path.fen) ?? { id: sha(path.fen), fen: path.fen, paths: [], budgets: [] };
    job.paths.push(path.id);
    for (const arm of path.selectedBy.filter((arm) => arm.startsWith("engine:"))) {
      const budget = arm.split(":")[1];
      if (!job.budgets.includes(budget)) job.budgets.push(budget);
    }
    job.budgets.sort();
    engineJobs.set(path.fen, job);
  }
  const maiaJobs = paths.filter((path) => path.legalReplyCount > 0 && path.selectedBy.some((arm) => arm.startsWith("maia:")))
    .map(({ selectedBy, ...path }) => path);
  return { version: 1, profile: "d3262-coherent-third-ply-v1", manifest: frame.manifest,
    authority: "two_layer_provider_path_selection_and_final_ply_jobs_not_four_ply_proof_or_human_frequency",
    finalPlyQueries: {
      stockfish: { ...sources[sourceNames[0]].source, multiPv: "top8_legal_moves_at_selected_third_ply" },
      maia: { ...sources[sourceNames[2]].source, historyUci: "root_candidate_reply_learner_path_per_row" },
    },
    inputDigests, arms, rows, paths, engineJobs: [...engineJobs.values()].sort((left, right) => left.id.localeCompare(right.id)), maiaJobs };
}

export function loadThirdPlyInputs() {
  const bytes = Object.fromEntries(names.map((name) => [name, readFileSync(`${directory}/${name}`)]));
  const sources = Object.fromEntries(names.map((name) => [name, JSON.parse(bytes[name])]));
  return [sources[names[0]], sources[names[1]], sources[names[2]],
    Object.fromEntries(sourceNames.map((name) => [name, sources[name]])), [sources[names[7]], sources[names[8]]],
    Object.fromEntries(names.map((name) => [name, sha(bytes[name])]))];
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const artifact = compileThirdPlyFrame(...loadThirdPlyInputs());
  check(artifact.rows.length === 193 && artifact.rows.reduce((sum, row) => sum + row.replies.length, 0) === 1966,
    "Changed frozen corrected candidate/reply population");
  const output = `${JSON.stringify(artifact, null, 2)}\n`, target = `${directory}/d3262-coherent-third-ply-frame.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Third-ply frame differs from frozen provider sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(output), candidates: artifact.rows.length, selectedPaths: artifact.paths.length,
    terminalPaths: artifact.paths.filter((path) => path.legalReplyCount === 0).length,
    engineJobs: artifact.engineJobs.length, maiaJobs: artifact.maiaJobs.length,
    arms: Object.fromEntries(arms.map((arm) => {
      const rows = artifact.rows.map((row) => row.arms.find((value) => value.arm === arm));
      return [arm, { selectedReplies: rows.reduce((sum, row) => sum + row.selectedReplies, 0),
        selectedLearnerEdges: rows.reduce((sum, row) => sum + row.selectedLearnerEdges, 0),
        unvisitedLearnerEdgesWithinSelectedReplies: rows.reduce((sum, row) => sum + row.unvisitedLearnerEdgesWithinSelectedReplies, 0),
        minimumFrontierMass: arm.startsWith("maia:") ? Math.min(...rows.map((row) => row.frontierMass)) : null }];
    })) }, null, 2)}\n`);
}
