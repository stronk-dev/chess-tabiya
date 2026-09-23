// Disposable D3262 provider-line arm over the frozen named-target comparisons.
// A PV is one occurrence, never a causal proof or an all-defences result.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";

const path = (name) => `planning/semantic-consequence-search/${name}`;
const budgets = Object.freeze(["depth8", "depth12", "movetime100"]);
function check(value, message) { if (!value) throw new Error(message); }
function key(rootId, targetId, candidateUci) { return `${rootId}|${targetId}|${candidateUci}`; }
function indexed(rows) {
  const result = new Map();
  for (const row of rows) {
    const id = key(row.rootId, row.targetId, row.candidateUci);
    check(!result.has(id), `Duplicate named target comparison ${id}`);
    result.set(id, row);
  }
  return result;
}
function replayPrefix(fen, pv, candidateUci) {
  check(Array.isArray(pv) && pv.length > 0 && pv[0] === candidateUci, `Crossed provider PV for ${candidateUci}`);
  const pos = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const states = [];
  for (const uci of pv.slice(0, 4)) {
    const parsed = parseUci(uci);
    check(parsed !== undefined, `Invalid provider PV move ${uci}`);
    const move = normalizeMove(pos, parsed);
    check(pos.isLegal(move), `Illegal provider PV move ${uci}`);
    pos.play(move);
    states.push(makeFen(pos.toSetup()));
  }
  return { line: pv.slice(0, 4), states };
}

export function compileProviderLineArm(comparisons, material, destination, witness, capture, frame, targets, fork, bishop) {
  check(comparisons.authority === "target_candidate_comparison_population_not_outcome_or_move_grade", "Wrong comparison authority");
  check(material.authority === "exact_immediate_material_relation_not_move_grade_or_search_result" && material.manifest === comparisons.manifest, "Crossed material reading");
  check(destination.authority === "exact_immediate_minor_destination_availability_not_move_grade" && destination.manifest === comparisons.manifest, "Crossed destination reading");
  check(witness.authority === "named_exact_reply_witness_not_all_defences_or_move_grade" && witness.manifest === comparisons.manifest, "Crossed destination witness");
  check(capture.manifest === comparisons.manifest && capture.partial === false && capture.roots === 66, "Incomplete Stockfish capture");
  check(frame.manifest === comparisons.manifest && frame.authority === "shared_candidate_population_not_move_grade", "Crossed selected root frame");
  check(targets.manifest === comparisons.manifest && targets.authority === "source_named_target_identity_not_search_verdict", "Crossed target control register");
  check(fork.authority === "declared_piece_identity_and_geometric_attack_only" && fork.controls.length === 2, "Crossed fork controls");
  check(bishop.authority === "declared_pressure_and_legal_screen_move_exposure_only", "Crossed bishop control");
  const materialRows = indexed(material.rows), destinationRows = indexed(destination.rows), witnessRows = indexed(witness.rows);
  const roots = new Map(capture.rows.map((root) => [root.rootId, root]));
  check(roots.size === 66, "Duplicate or missing Stockfish roots");
  const rows = [];
  for (const pair of comparisons.comparisons) {
    const id = key(pair.rootId, pair.targetId, pair.candidateUci);
    const materialRow = materialRows.get(id), destinationRow = destinationRows.get(id), witnessRow = witnessRows.get(id);
    check(Number(materialRow !== undefined) + Number(destinationRow !== undefined) === 1, `Missing or crossed semantic family ${id}`);
    check((destinationRow === undefined) === (witnessRow === undefined), `Destination witness join missing ${id}`);
    const root = roots.get(pair.rootId);
    check(root !== undefined, `Missing Stockfish root ${pair.rootId}`);
    for (const budget of budgets) {
      const probe = root.probes.find((value) => value.budget === budget);
      check(probe !== undefined, `Missing Stockfish budget ${pair.rootId}/${budget}`);
      const entries = probe.entries.filter((value) => value.moveUci === pair.candidateUci);
      check(entries.length <= 1, `Duplicate Stockfish candidate ${id}/${budget}`);
      const entry = entries[0];
      if (entry === undefined) {
        check(probe.missingMoves.includes(pair.candidateUci), `Candidate silently missing from Stockfish ${id}/${budget}`);
        rows.push({ ...pair, family: materialRow === undefined ? "destination" : "material", budget, sourceStatus: "unreturned", pv: null, event: "unknown_source_unreturned" });
        continue;
      }
      check(!probe.missingMoves.includes(pair.candidateUci), `Returned Stockfish candidate also marked missing ${id}/${budget}`);
      const { line, states } = replayPrefix(root.fen, entry.pv, pair.candidateUci);
      check(states[0] === (materialRow ?? destinationRow).afterFen, `Stockfish candidate FEN crosses registered relation ${id}/${budget}`);
      let event;
      if (materialRow !== undefined) {
        event = materialRow.positiveCaptureUci !== null && line[1] === materialRow.positiveCaptureUci
          ? "registered_positive_capture_on_line" : "registered_capture_not_observed_on_line";
      } else if (witnessRow.status === "named_minor_absent") {
        event = "named_minor_absent_before_reply";
      } else if (line[1] !== witnessRow.arrivalUci) {
        event = "named_minor_arrival_not_observed_on_line";
      } else if (witnessRow.namedPawnCaptureUci !== null && line[2] === witnessRow.namedPawnCaptureUci) {
        event = "named_arrival_and_declared_pawn_capture_on_line";
      } else {
        event = "named_arrival_without_declared_pawn_capture_on_line";
      }
      rows.push({ ...pair, family: materialRow === undefined ? "destination" : "material", budget, sourceStatus: "returned", rank: entry.rank, reachedDepth: entry.depth, rawScore: entry.score, pv: line, replayedFens: states, event });
    }
  }
  check(rows.length === 185 * budgets.length, `Provider-line result lost comparisons: ${rows.length}`);
  const controlRows = [];
  check(targets.controls.length === 4, "Unexpected special-control count");
  for (const control of targets.controls) {
    const selectedRoot = frame.roots.find((root) => root.rootId === control.rootId);
    const sourceRoot = roots.get(control.rootId);
    check(selectedRoot !== undefined && sourceRoot !== undefined && selectedRoot.fen === sourceRoot.fen, `Missing special control ${control.rootId}`);
    const selected = selectedRoot.candidates.filter((candidate) => candidate.origins.includes(`control:${control.rootId}`));
    check(selected.length === 1, `Special control lacks one declared candidate ${control.rootId}`);
    const declaredCandidateUci = selected[0].moveUci;
    for (const candidate of selectedRoot.candidates) {
      const candidateUci = candidate.moveUci;
      for (const budget of budgets) {
        const probe = sourceRoot.probes.find((value) => value.budget === budget);
        const entry = probe?.entries.find((value) => value.moveUci === candidateUci);
        check(entry !== undefined, `Special control has no returned PV ${control.rootId}/${candidateUci}/${budget}`);
        const { line, states } = replayPrefix(sourceRoot.fen, entry.pv, candidateUci);
        let event;
        if (control.status === "no_autonomous_semantic_target") {
          check(control.rootId === "quiet-plan:carlsbad-nf8", "Unknown no-target control");
          event = "no_autonomous_target";
        } else if (candidateUci !== declaredCandidateUci) {
          event = "no_declared_control_for_candidate";
        } else if (control.rootId.startsWith("tactical:fork-")) {
          const declared = fork.controls.find((item) => item.rootId === control.rootId && item.candidateUci === candidateUci);
          const exact = declared?.replies.find((reply) => reply.uci === line[1]);
          check(exact !== undefined, `Fork PV reply absent from exact control ${control.rootId}/${budget}`);
          event = exact.retainsAny ? "fork_geometry_retained_on_line" : "fork_geometry_refuted_on_line";
        } else {
          check(control.rootId === bishop.result.rootId && candidateUci === bishop.result.candidateUci, `Unknown declared control ${control.rootId}`);
          event = line[1] === bishop.result.selectedReplyUci ? "declared_bishop_retreat_on_line" : "declared_bishop_retreat_not_observed_on_line";
        }
        controlRows.push({ rootId: control.rootId, candidateUci, budget, event, rank: entry.rank, reachedDepth: entry.depth, rawScore: entry.score, pv: line, replayedFens: states });
      }
    }
  }
  check(controlRows.length === 14 * budgets.length, "Special-control projection is incomplete");
  const selectedKeys = new Set(frame.roots.flatMap((root) => root.candidates.map((candidate) => `${root.rootId}|${candidate.moveUci}`)));
  const projectedKeys = new Set([...rows, ...controlRows].map((row) => `${row.rootId}|${row.candidateUci}`));
  check(selectedKeys.size === 196 && projectedKeys.size === selectedKeys.size && [...selectedKeys].every((value) => projectedKeys.has(value)), "Provider-line arm omitted a selected candidate");
  return { version: 1, manifest: comparisons.manifest, authority: "stockfish_pv_occurrence_only_not_causality_or_all_defences", budgets, rows, controlRows };
}

if (process.argv[1]?.endsWith("provider-line-arm.mjs")) {
  const names = ["d3262-target-comparison-frame.json", "d3262-material-immediate.json", "d3262-destination-immediate.json", "d3262-destination-reply-witness.json", "d3262-stockfish-capture.json", "d3262-root-frame.json", "d3262-target-register.json", "d3262-fork-control-identity.json", "d3262-bishop-pressure-control.json"];
  const bytes = names.map((name) => readFileSync(path(name)));
  const artifact = { ...compileProviderLineArm(...bytes.map((value) => JSON.parse(value.toString()))), inputDigests: Object.fromEntries(names.map((name, index) => [name, `sha256:${createHash("sha256").update(bytes[index]).digest("hex")}`])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = path("d3262-provider-line-arm.json");
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 provider-line arm differs from frozen inputs");
  const counts = Object.fromEntries(budgets.map((budget) => [budget, Object.fromEntries([...new Set(artifact.rows.filter((row) => row.budget === budget).map((row) => row.event))].sort().map((event) => [event, artifact.rows.filter((row) => row.budget === budget && row.event === event).length]))]));
  const controlCounts = Object.fromEntries([...new Set(artifact.controlRows.map((row) => row.event))].sort().map((event) => [event, artifact.controlRows.filter((row) => row.event === event).length]));
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(output).digest("hex")}`, comparisons: artifact.rows.length, controls: artifact.controlRows.length, counts, controlCounts }, null, 2)}\n`);
}
