// Independent, read-only D3262 Maia child-capture validation.
// Never treats raw top-window mass as configured sampling probability.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

function check(value, message) { if (!value) throw new Error(message); }
function near(left, right) { return Math.abs(left - right) <= 0.000_002; }

export function validateMaiaChildCapture(capture, graph, graphBytes) {
  check(graph.authority === "complete_legal_opponent_reply_edges_not_a_semantic_proof", "Wrong legal child authority");
  check(capture.version === 1 && capture.partial === false && capture.manifest === graph.manifest, "Maia child capture is incomplete or crossed");
  check(capture.exactReplyDigest === `sha256:${createHash("sha256").update(graphBytes).digest("hex")}`, "Maia child capture uses a different exact graph");
  const positions = graph.roots.flatMap((root) => root.candidates.map((candidate) => ({ rootId: root.rootId, candidateUci: candidate.candidateUci, fen: candidate.afterFen, legalReplyUcis: candidate.replies.map((reply) => reply.uci) })));
  check(positions.length === 196 && capture.positions === 196 && capture.rows?.length === 196, "Maia child capture omitted positions");
  const source = capture.source;
  check(source.mode === "human_common" && source.band === 1400 && source.temperature === 0.8 && source.topP === 0.92, "Maia child source parameters changed");
  check(source.policyConfigDigest === `sha256:${"3".repeat(64)}` && source.endpoint === "/select-move", "Maia child source request identity changed");
  check(source.seed === "sha256(fen|band).first32.and31" && source.massMeaning === "raw_model_softmax_not_configured_sampling_probability", "Maia child mass meaning changed");
  const engines = new Set(), latencies = [];
  let captured = 0, sourceOff = 0, legalMoves = 0, retainedMoves = 0, unreturnedMoves = 0, missingMasses = 0, castlingEncoded = 0;
  for (let index = 0; index < positions.length; index += 1) {
    const expected = positions[index], row = capture.rows[index];
    check(row.rootId === expected.rootId && row.candidateUci === expected.candidateUci && row.fen === expected.fen, `Crossed Maia child position ${index}`);
    check(JSON.stringify(row.legalReplyUcis) === JSON.stringify(expected.legalReplyUcis), `Lost exact legal replies at child ${index}`);
    check(Number.isFinite(row.elapsedMs) && row.elapsedMs >= 0, `Invalid child latency ${index}`);
    latencies.push(row.elapsedMs);
    const legal = new Set(expected.legalReplyUcis);
    check(legal.size === expected.legalReplyUcis.length, `Duplicate legal child replies ${index}`);
    legalMoves += legal.size;
    if (row.status === "source_off") {
      check(typeof row.errorCode === "string" || Number.isInteger(row.httpStatus), `Unexplained child source failure ${index}`);
      check(row.candidates === undefined && row.engine === undefined, `Source-off child invented provider data ${index}`);
      sourceOff += 1;
      unreturnedMoves += legal.size;
      continue;
    }
    check(row.status === "captured", `Unknown child status ${index}`);
    check(row.engine?.id === "maia-5m" && row.engine?.modelId === "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe", `Wrong Maia child model ${index}`);
    check(row.engine.eloApplied === 1400 && row.engine.eloHonored === true, `Wrong Maia child band ${index}`);
    engines.add(JSON.stringify(row.engine));
    check(Array.isArray(row.candidates) && row.candidates.length > 0 && row.candidates.length <= 20, `Bad Maia child window ${index}`);
    const seen = new Set();
    let mass = 0, missing = 0;
    for (const [rank, candidate] of row.candidates.entries()) {
      check(candidate.rank === rank + 1 && typeof candidate.moveUci === "string", `Invalid Maia child rank ${index}`);
      const normalized = legal.has(candidate.moveUci) ? candidate.moveUci : { e1h1: "e1g1", e1a1: "e1c1", e8h8: "e8g8", e8a8: "e8c8" }[candidate.moveUci];
      check(normalized !== undefined && candidate.legalUci === normalized && legal.has(normalized) && !seen.has(normalized), `Illegal, crossed or duplicate Maia child move ${index}`);
      seen.add(normalized);
      castlingEncoded += Number(normalized !== candidate.moveUci);
      if (candidate.mass === undefined) missing += 1;
      else { check(Number.isFinite(candidate.mass) && candidate.mass >= 0 && candidate.mass <= 1, `Bad Maia child mass ${index}`); mass += candidate.mass; }
      check(candidate.offWindow === undefined || candidate.offWindow === true, `Bad Maia child window flag ${index}`);
    }
    check(mass <= 1.000_002 && near(row.returnedMass, mass), `Maia child returned mass differs ${index}`);
    check(near(row.missingMass, Math.max(0, 1 - mass)) && row.missingCandidateMasses === missing, `Maia child residual mass differs ${index}`);
    check(row.unreturnedLegalCount === legal.size - seen.size, `Maia child unreturned legal population differs ${index}`);
    captured += 1;
    retainedMoves += seen.size;
    unreturnedMoves += legal.size - seen.size;
    missingMasses += missing;
  }
  check(source.engineIdentities?.length === engines.size && source.engineIdentities.every((value) => engines.has(JSON.stringify(value))), "Maia child engine identity population differs");
  const ordered = latencies.sort((left, right) => left - right);
  return { positions: positions.length, captured, sourceOff, legalMoves, retainedMoves, unreturnedMoves, missingMasses, castlingEncoded, p50Ms: ordered[Math.ceil(ordered.length * 0.5) - 1], p95Ms: ordered[Math.ceil(ordered.length * 0.95) - 1], maxMs: ordered.at(-1) };
}

if (process.argv[1]?.endsWith("maia-child-capture-check.mjs")) {
  const graphBytes = readFileSync("planning/semantic-consequence-search/d3262-exact-replies.json");
  const captureBytes = readFileSync("planning/semantic-consequence-search/d3262-maia-child-capture.json");
  const result = validateMaiaChildCapture(JSON.parse(captureBytes.toString()), JSON.parse(graphBytes.toString()), graphBytes);
  process.stdout.write(`${JSON.stringify({ captureDigest: `sha256:${createHash("sha256").update(captureBytes).digest("hex")}`, ...result }, null, 2)}\n`);
}
