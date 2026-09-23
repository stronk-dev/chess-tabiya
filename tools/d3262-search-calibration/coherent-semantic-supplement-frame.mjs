// Frozen source jobs for semantic-event paths absent from the checked provider
// captures. Selection is source-blind and predates semantic outcomes.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-semantic-provider-gap.json", "d3262-coherent-exact-replies.json"];
const sha = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
function check(value, message) { if (!value) throw new Error(message); }
function pathKey(row) { return JSON.stringify([row.rootId, row.candidateUci, row.replyUci]); }

export function compileSemanticSupplementFrame(gap, graph, inputDigests) {
  check(gap.profile === "d3262-coherent-semantic-provider-gap-v1"
    && graph.profile === "d3262-coherent-root-v1" && gap.manifest === graph.manifest
    && gap.paths.length === 152, "Crossed semantic event provider gap");
  const roots = new Map(graph.roots.map((root) => [root.rootId, root]));
  const missing = gap.paths.filter((row) => row.needsStockfish || row.needsMaia);
  check(missing.length === 1 && missing[0].needsStockfish && missing[0].needsMaia,
    "Semantic event supplement denominator changed");
  const path = missing[0];
  const root = roots.get(path.rootId);
  const reply = root?.candidates.find((candidate) => candidate.candidateUci === path.candidateUci)?.replies
    .find((item) => item.uci === path.replyUci);
  check(reply?.fen === path.fen && root?.fen, "Missing exact semantic supplement path");
  const engineJobs = [{ id: sha(path.fen), fen: path.fen,
    paths: [{ rootId: path.rootId, candidateUci: path.candidateUci, replyUci: path.replyUci }] }];
  const maiaJobs = [{ id: sha(pathKey(path)), rootId: path.rootId,
    candidateUci: path.candidateUci, replyUci: path.replyUci,
    rootFen: root.fen, historyUci: [path.candidateUci, path.replyUci], fen: path.fen }];
  return { version: 1, profile: "d3262-coherent-semantic-supplement-v1",
    authority: "missing_semantic_event_provider_jobs_not_result_or_move_grade",
    manifest: gap.manifest, inputDigests, engineJobs, maiaJobs };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const bytes = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = compileSemanticSupplementFrame(...bytes.map((value) => JSON.parse(value.toString())),
    Object.fromEntries(names.map((name, index) => [name, sha(bytes[index])])));
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-semantic-supplement-frame.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Semantic supplement frame differs from sealed sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(output), stockfishJobs: artifact.engineJobs.length,
    maiaJobs: artifact.maiaJobs.length }, null, 2)}\n`);
}
