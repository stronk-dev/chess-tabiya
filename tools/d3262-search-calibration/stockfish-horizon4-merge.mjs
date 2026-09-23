// Merge a complete set of checked local interval captures into one portable
// research source artifact. No incomplete prefix can become a full result.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { link, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { chunkPlan } from "./stockfish-horizon4-batch.mjs";
import { validateHorizon4Capture } from "./stockfish-horizon4-check.mjs";

const root = "planning/semantic-consequence-search";
const directory = join(root, "d3262-stockfish-horizon4-chunks");
const output = join(root, "d3262-stockfish-horizon4-capture.json");
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function quantile(values, q) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(q * sorted.length) - 1];
}

export function mergeHorizon4Captures(frontier, frontierBytes, reference, chunks) {
  const plan = chunkPlan(frontier.jobs.length);
  check(chunks.length === plan.length, `Incomplete horizon-four capture: ${chunks.length}/${plan.length} chunks`);
  let source;
  const rows = [], digests = [];
  for (let index = 0; index < plan.length; index += 1) {
    const planned = plan[index], input = chunks[index];
    check(input.file === planned.file, `Missing or crossed interval ${planned.file}`);
    const capture = JSON.parse(input.bytes);
    check(capture.start === planned.start && capture.positions === planned.count, `Wrong interval extent ${planned.file}`);
    validateHorizon4Capture(frontier, frontierBytes, capture, reference);
    if (source === undefined) source = capture.source;
    else check(JSON.stringify(source) === JSON.stringify(capture.source), `Source changed across chunks at ${planned.file}`);
    rows.push(...capture.rows);
    digests.push({ file: planned.file, sha256: sha(input.bytes), positions: planned.count });
  }
  const artifact = { version: 1, manifest: frontier.manifest, frontierDigest: sha(frontierBytes), start: 0, positions: frontier.jobs.length, partial: false, source, rows, chunkDigests: digests };
  const checked = validateHorizon4Capture(frontier, frontierBytes, artifact, reference);
  const elapsedByBudget = Object.fromEntries(["depth8", "depth12", "movetime100"].map((budget) => {
    const values = rows.map((row) => row.probes.find((probe) => probe.budget === budget).elapsedMs);
    return [budget, { p50Ms: quantile(values, 0.5), p95Ms: quantile(values, 0.95), maxMs: Math.max(...values) }];
  }));
  return { artifact, summary: { ...checked, elapsedByBudget } };
}

if (process.argv[1]?.endsWith("stockfish-horizon4-merge.mjs")) {
  const frontierBytes = readFileSync(join(root, "d3262-horizon4-frontier.json"));
  const frontier = JSON.parse(frontierBytes);
  const reference = JSON.parse(readFileSync(join(root, "d3262-stockfish-child-capture.json")));
  const chunks = chunkPlan(frontier.jobs.length).map((item) => ({ file: item.file, bytes: readFileSync(join(directory, item.file)) }));
  const { artifact, summary } = mergeHorizon4Captures(frontier, frontierBytes, reference, chunks);
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  if (process.argv.includes("--write")) {
    const temporary = `${output}.partial-${process.pid}`;
    await writeFile(temporary, bytes, { flag: "wx" });
    try { await link(temporary, output); }
    finally { await unlink(temporary); }
  } else check(readFileSync(output, "utf8") === bytes, "Merged horizon-four capture differs from checked chunks");
  process.stdout.write(`${JSON.stringify({ digest: sha(bytes), chunks: chunks.length, ...summary }, null, 2)}\n`);
}
