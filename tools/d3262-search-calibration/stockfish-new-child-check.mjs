// D3262 corrected-frame new-child Stockfish source: exact three-position join.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { validateCoherentRecapture } from "./stockfish-coherent-recapture-check.mjs";

const directory = "planning/semantic-consequence-search";
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }

export function newChildJobs(graph, oldGraph) {
  check(graph.profile === "d3262-coherent-root-v1" && graph.authority === "coherent_root_complete_legal_reply_edges_not_semantic_proof"
    && oldGraph.authority === "complete_legal_opponent_reply_edges_not_a_semantic_proof"
    && graph.manifest === oldGraph.manifest && graph.roots.length === 66 && oldGraph.roots.length === 66,
  "Crossed corrected child graphs");
  const jobs = graph.roots.flatMap((root, index) => {
    const prior = oldGraph.roots[index];
    check(root.rootId === prior.rootId && root.fen === prior.fen, `Crossed child root ${index}`);
    const old = new Set(prior.candidates.map((candidate) => candidate.candidateUci));
    return root.candidates.filter((candidate) => !old.has(candidate.candidateUci))
      .map((candidate) => ({ rootId: root.rootId, candidateUci: candidate.candidateUci,
        fen: candidate.afterFen, replies: candidate.replies.map((reply) => reply.uci) }));
  });
  check(jobs.length === 3 && jobs.reduce((sum, job) => sum + job.replies.length, 0) === 55,
    "Corrected new-child population drifted");
  return jobs;
}

if (process.argv[1]?.endsWith("stockfish-new-child-check.mjs")) {
  const graphBytes = readFileSync(`${directory}/d3262-coherent-exact-replies.json`);
  const oldGraph = JSON.parse(readFileSync(`${directory}/d3262-exact-replies.json`));
  const jobs = newChildJobs(JSON.parse(graphBytes), oldGraph);
  const topBytes = readFileSync(`${directory}/d3262-stockfish-new-child-coherent.json`);
  const allBytes = readFileSync(`${directory}/d3262-stockfish-new-child-coherent-all.json`);
  const original = JSON.parse(readFileSync(`${directory}/d3262-stockfish-child-capture.json`));
  const top = validateCoherentRecapture(JSON.parse(topBytes), jobs, original, "child", sha(graphBytes));
  const all = validateCoherentRecapture(JSON.parse(allBytes), jobs, original, "child-all", sha(graphBytes));
  process.stdout.write(`${JSON.stringify({ jobs: jobs.map(({ replies, ...job }) => ({ ...job, replyCount: replies.length })),
    topEight: { digest: sha(topBytes), ...top }, allLegal: { digest: sha(allBytes), ...all } }, null, 2)}\n`);
}
