// Disposable D3262/D3289 full legal reply graph for the separately frozen
// coherent-root candidate frame. An edge is not a semantic proof or move grade.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { enumerateCandidate } from "./exact-reply-enumeration.mjs";

const directory = "planning/semantic-consequence-search";
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }

export function compileCoherentExactReplies(frame, frameBytes, oldGraph) {
  check(frame.profile === "d3262-coherent-root-v1" && frame.authority === "coherent_root_candidate_population_not_move_grade"
    && frame.roots.length === 66 && oldGraph.roots.length === 66 && oldGraph.manifest === frame.manifest,
  "Crossed corrected candidate/old reply source");
  const roots = frame.roots.map((root, index) => {
    const old = oldGraph.roots[index];
    check(old.rootId === root.rootId && old.fen === root.fen, `Crossed corrected exact root ${index}`);
    return { rootId: root.rootId, fen: root.fen,
      candidates: root.candidates.map((candidate) => enumerateCandidate(root.fen, candidate.moveUci)) };
  });
  let reused = 0, added = 0, dropped = 0;
  for (let index = 0; index < roots.length; index += 1) {
    const oldByMove = new Map(oldGraph.roots[index].candidates.map((candidate) => [candidate.candidateUci, candidate]));
    const currentByMove = new Map(roots[index].candidates.map((candidate) => [candidate.candidateUci, candidate]));
    for (const [uci, candidate] of currentByMove) {
      const prior = oldByMove.get(uci);
      if (prior === undefined) added += 1;
      else { check(JSON.stringify(candidate) === JSON.stringify(prior), `Retained reply edge changed ${roots[index].rootId}/${uci}`); reused += 1; }
    }
    dropped += [...oldByMove.keys()].filter((uci) => !currentByMove.has(uci)).length;
  }
  check(reused === 190 && added === 3 && dropped === 6, `Corrected reply population drifted: ${reused} reused, +${added}/-${dropped}`);
  return { version: 1, profile: frame.profile, rootFrameDigest: sha(frameBytes), manifest: frame.manifest,
    authority: "coherent_root_complete_legal_reply_edges_not_semantic_proof",
    comparison: { reused, added, dropped }, roots };
}

if (process.argv[1]?.endsWith("coherent-exact-replies.mjs")) {
  const frameBytes = readFileSync(`${directory}/d3262-coherent-root-frame.json`);
  const oldBytes = readFileSync(`${directory}/d3262-exact-replies.json`);
  const graph = compileCoherentExactReplies(JSON.parse(frameBytes), frameBytes, JSON.parse(oldBytes));
  const output = `${JSON.stringify(graph, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-exact-replies.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Corrected exact replies differ from frozen source frame");
  process.stdout.write(`${JSON.stringify({ digest: sha(output), candidates: graph.roots.reduce((sum, root) => sum + root.candidates.length, 0),
    replies: graph.roots.reduce((sum, root) => sum + root.candidates.reduce((subtotal, candidate) => subtotal + candidate.replyCount, 0), 0),
    ...graph.comparison }, null, 2)}\n`);
}
