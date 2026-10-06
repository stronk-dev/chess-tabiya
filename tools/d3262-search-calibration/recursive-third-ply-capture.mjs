// Disposable D3490 source execution for the independently checked D3489 frame.
// Original frame, sources and interval directories remain unchanged.
import { existsSync, readFileSync } from "node:fs";
import { link, mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";
import { CoherentEngineQuery } from "./coherent-engine-query.mjs";
import { chunkPlan } from "./stockfish-horizon4-batch.mjs";
import { mergeThirdPlyCaptures } from "./third-ply-stockfish-merge.mjs";
import { directory, sha, validateThirdPlyStockfish } from "./third-ply-source-check.mjs";
import { outputName } from "./coherent-recursive-semantic.mjs";

export const chunkDirectory = join(directory, "d3262-stockfish-recursive-third-ply-chunks");
export const captureName = "d3262-stockfish-recursive-third-ply-capture.json.gz";
export const captureScope = "recursive_semantic_third_ply_missing_budgets_only";
export const frameDigest = "sha256:508c9e84515233e456ba12ed5cf787c8bb1eb14748314de010c5d76e5fa52232";
function require(value, message) { if (!value) throw new Error(message); }
export function loadRecursiveCaptureFrame() {
  const bytes = readFileSync(join(directory, outputName)), frame = JSON.parse(gunzipSync(bytes));
  require(sha(bytes) === frameDigest && frame.profile === "d3262-coherent-recursive-semantic-frame-v1"
    && frame.providerOff === false && frame.supplementJobs.length === 418
    && frame.supplementJobs.reduce((n, j) => n + j.budgets.length, 0) === 958, "Changed frozen recursive capture frame");
  return { frame: { ...frame, engineJobs: frame.supplementJobs }, bytes };
}
export function validateRecursiveCapture(frame, bytes, capture, interval) {
  require(capture.captureScope === captureScope, "Crossed recursive capture scope");
  if (interval) require(capture.start === interval.start && capture.positions === interval.count, "Crossed recursive interval");
  const result = validateThirdPlyStockfish(frame, bytes, capture), expected = frame.finalPlyQueries.stockfish;
  require(JSON.stringify(Object.keys(capture.source).sort()) === JSON.stringify(Object.keys(expected).sort())
    && Object.keys(expected).every((field) => capture.source[field] === expected[field]), "Crossed recursive full query identity");
  require(capture.rows.every((r) => r.probes.every((p) => p.legal.includes(p.bestmove))), "Illegal recursive bestmove");
  return result;
}
async function publish(path, bytes) {
  const temporary = `${path}.partial-${process.pid}`;
  await writeFile(temporary, bytes, { flag: "wx" });
  try { await link(temporary, path); } finally { await unlink(temporary); }
}
export async function captureRecursiveInterval(frame, bytes, interval, command = process.env.SF_CMD) {
  require(command && sha(readFileSync(command)) === frame.finalPlyQueries.stockfish.executableDigest,
    "SF_CMD must name the frozen Stockfish executable; use the Make target");
  require(Number.isSafeInteger(interval.start) && Number.isSafeInteger(interval.count) && interval.start >= 0
    && interval.count > 0 && interval.start + interval.count <= frame.engineJobs.length, "Invalid recursive interval");
  const engine = new CoherentEngineQuery(command), rows = [];
  try {
    await engine.initialize(); require(engine.identity === frame.finalPlyQueries.stockfish.engineName, "Crossed recursive Stockfish name");
    for (const job of frame.engineJobs.slice(interval.start, interval.start + interval.count)) {
      const probes = [];
      for (const budget of job.budgets) probes.push(await engine.probe(job.fen, budget));
      rows.push({ jobId: job.id, fen: job.fen, budgets: job.budgets, probes });
    }
  } finally { await engine.close(); }
  const capture = { version: 1, manifest: frame.manifest, frontierDigest: sha(bytes), captureScope,
    start: interval.start, positions: rows.length, partial: interval.start !== 0 || rows.length !== frame.engineJobs.length,
    source: { ...frame.finalPlyQueries.stockfish }, rows };
  validateRecursiveCapture(frame, bytes, capture, interval); return capture;
}
export function mergeRecursiveCaptures(frame, bytes, chunks) {
  const plan = chunkPlan(frame.engineJobs.length);
  require(chunks.length === plan.length, "Incomplete recursive interval population");
  chunks.forEach((c, i) => validateRecursiveCapture(frame, bytes, JSON.parse(c.bytes), plan[i]));
  const merged = mergeThirdPlyCaptures(frame, bytes, chunks); merged.artifact.captureScope = captureScope;
  validateRecursiveCapture(frame, bytes, merged.artifact); return merged;
}
export async function captureRecursiveBatches({ maxNew = Infinity } = {}) {
  require(maxNew === Infinity || Number.isSafeInteger(maxNew) && maxNew > 0, "Invalid max-new interval count");
  const { frame, bytes } = loadRecursiveCaptureFrame(); await mkdir(chunkDirectory, { recursive: true });
  let completed = 0, newlyCaptured = 0;
  for (const interval of chunkPlan(frame.engineJobs.length)) {
    const path = join(chunkDirectory, interval.file), previous = existsSync(path);
    if (!previous && newlyCaptured >= maxNew) break;
    if (!previous) { await publish(path, `${JSON.stringify(await captureRecursiveInterval(frame, bytes, interval))}\n`); newlyCaptured++; }
    const checked = validateRecursiveCapture(frame, bytes, JSON.parse(readFileSync(path)), interval);
    completed += interval.count;
    process.stdout.write(`D3262 recursive ${previous ? "reused" : "captured"} ${interval.file}: ${completed}/${frame.engineJobs.length} positions; ${checked.rankedMoves} ranks\n`);
  }
  return { frameDigest: sha(bytes), completed, total: frame.engineJobs.length, newlyCaptured, complete: completed === frame.engineJobs.length };
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const mode = process.argv[2]; require(["preflight", "batch", "merge", "check"].includes(mode), "Pass a declared recursive capture operation");
  if (mode === "batch") {
    const i = process.argv.indexOf("--max-new");
    process.stdout.write(`${JSON.stringify(await captureRecursiveBatches({ maxNew: i < 0 ? Infinity : Number(process.argv[i + 1]) }))}\n`);
  } else {
    const { frame, bytes } = loadRecursiveCaptureFrame();
    if (mode === "preflight") process.stdout.write(`${JSON.stringify({ frameDigest: sha(bytes), positions: frame.engineJobs.length,
      queries: frame.engineJobs.reduce((n, j) => n + j.budgets.length, 0), scope: captureScope })}\n`);
    else if (mode === "check") {
      const raw = readFileSync(join(directory, captureName)), capture = JSON.parse(gunzipSync(raw));
      require(capture.partial === false, "Recursive capture is partial");
      process.stdout.write(`${JSON.stringify({ digest: sha(raw), ...validateRecursiveCapture(frame, bytes, capture) })}\n`);
    } else {
      const chunks = chunkPlan(frame.engineJobs.length).map((c) => ({ file: c.file, bytes: readFileSync(join(chunkDirectory, c.file)) }));
      const { artifact, summary } = mergeRecursiveCaptures(frame, bytes, chunks), plain = Buffer.from(`${JSON.stringify(artifact)}\n`), compressed = gzipSync(plain);
      if (process.argv.includes("--write")) await publish(join(directory, captureName), compressed);
      else require(readFileSync(join(directory, captureName)).equals(compressed), "Recursive capture differs from original intervals");
      process.stdout.write(`${JSON.stringify({ digest: sha(compressed), logicalDigest: sha(plain), chunks: chunks.length, ...summary })}\n`);
    }
  }
}
