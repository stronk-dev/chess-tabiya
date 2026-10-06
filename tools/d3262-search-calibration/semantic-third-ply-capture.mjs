// Disposable D3262/D3484 source execution over the frozen missing-budget jobs.
// Existing D3478 frame/capturer/queue are unchanged. A planned or partial source
// is never a complete engine result, target proof or production search profile.
import { existsSync, readFileSync } from "node:fs";
import { link, mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";
import { CoherentEngineQuery } from "./coherent-engine-query.mjs";
import { chunkPlan } from "./stockfish-horizon4-batch.mjs";
import { mergeThirdPlyCaptures } from "./third-ply-stockfish-merge.mjs";
import { directory, sha, validateThirdPlyStockfish } from "./third-ply-source-check.mjs";
import { outputName } from "./coherent-semantic-third-ply.mjs";

export const chunkDirectory = join(directory, "d3262-stockfish-semantic-third-ply-chunks");
export const captureName = "d3262-stockfish-semantic-third-ply-capture.json.gz";
export const captureScope = "semantic_third_ply_missing_budgets_only";
const frameDigest = "sha256:191ca5935b501dc6164116cbc10ecaeb3ac1ae8e87e1ec6d3295b65f84508252";
const logicalDigest = "sha256:203791b0c532b3573a8a0607e4d0c89af0cfb6e67b4b3ea7a7a2b1a17d8f0f62";
function check(value, message) { if (!value) throw new Error(message); }
export function loadSemanticCaptureFrame() {
  const bytes = readFileSync(join(directory, outputName)), raw = gunzipSync(bytes), frame = JSON.parse(raw);
  check(sha(bytes) === frameDigest && sha(raw) === logicalDigest
    && frame.profile === "d3262-coherent-semantic-third-ply-v1"
    && frame.supplementJobs.length === 870
    && frame.supplementJobs.reduce((sum, job) => sum + job.budgets.length, 0) === 2028,
  "Changed frozen semantic capture frame");
  return { frame: { ...frame, engineJobs: frame.supplementJobs }, bytes };
}
export function validateSemanticCapture(frame, bytes, capture, interval) {
  check(capture.captureScope === captureScope, "Crossed semantic capture scope");
  if (interval) check(capture.start === interval.start && capture.positions === interval.count, "Crossed semantic capture interval");
  const result = validateThirdPlyStockfish(frame, bytes, capture), expected = frame.finalPlyQueries.stockfish;
  check(JSON.stringify(Object.keys(capture.source).sort()) === JSON.stringify(Object.keys(expected).sort())
    && Object.keys(expected).every((key) => capture.source[key] === expected[key]), "Crossed semantic full query identity");
  check(capture.rows.every((row) => row.probes.every((probe) => probe.legal.includes(probe.bestmove))), "Illegal semantic source bestmove");
  return result;
}
async function publish(path, bytes) {
  const temporary = `${path}.partial-${process.pid}`;
  await writeFile(temporary, bytes, { flag: "wx" });
  try { await link(temporary, path); } finally { await unlink(temporary); }
}
export async function captureSemanticInterval(frame, bytes, interval, command = process.env.SF_CMD) {
  check(command, "SF_CMD must name the frozen Stockfish executable; use the Make target");
  const executableDigest = sha(readFileSync(command)), expected = frame.finalPlyQueries.stockfish;
  check(executableDigest === expected.executableDigest, "Crossed frozen semantic Stockfish executable");
  check(Number.isSafeInteger(interval.start) && Number.isSafeInteger(interval.count) && interval.start >= 0
    && interval.count > 0 && interval.start + interval.count <= frame.engineJobs.length, "Invalid semantic capture interval");
  const engine = new CoherentEngineQuery(command), rows = [];
  try {
    await engine.initialize();
    check(engine.identity === expected.engineName, "Crossed frozen semantic Stockfish name");
    for (const job of frame.engineJobs.slice(interval.start, interval.start + interval.count)) {
      const probes = [];
      for (const budget of job.budgets) probes.push(await engine.probe(job.fen, budget));
      rows.push({ jobId: job.id, fen: job.fen, budgets: job.budgets, probes });
    }
  } finally { await engine.close(); }
  const capture = { version: 1, manifest: frame.manifest, frontierDigest: sha(bytes), captureScope,
    start: interval.start, positions: rows.length,
    partial: interval.start !== 0 || rows.length !== frame.engineJobs.length,
    source: { ...expected }, rows };
  validateSemanticCapture(frame, bytes, capture, interval);
  return capture;
}
export async function captureSemanticBatches({ maxNew = Infinity } = {}) {
  check(maxNew === Infinity || Number.isSafeInteger(maxNew) && maxNew > 0, "--max-new must be positive");
  const { frame, bytes } = loadSemanticCaptureFrame();
  await mkdir(chunkDirectory, { recursive: true });
  let completed = 0, newlyCaptured = 0;
  for (const interval of chunkPlan(frame.engineJobs.length)) {
    const path = join(chunkDirectory, interval.file), prior = existsSync(path);
    if (!prior && newlyCaptured >= maxNew) break;
    if (!prior) {
      const capture = await captureSemanticInterval(frame, bytes, interval);
      await publish(path, `${JSON.stringify(capture)}\n`);
      newlyCaptured++;
    }
    const capture = JSON.parse(readFileSync(path)), checked = validateSemanticCapture(frame, bytes, capture, interval);
    completed += interval.count;
    process.stdout.write(`D3262 semantic supplement ${prior ? "reused" : "captured"} ${interval.file}: ${completed}/${frame.engineJobs.length} positions; ${checked.rankedMoves} coherent entries\n`);
  }
  return { frameDigest: sha(bytes), completed, total: frame.engineJobs.length, newlyCaptured,
    complete: completed === frame.engineJobs.length };
}
export function mergeSemanticCaptures(frame, bytes, chunks) {
  const plan = chunkPlan(frame.engineJobs.length);
  check(chunks.length === plan.length, "Incomplete semantic supplement interval population");
  chunks.forEach((chunk, index) => validateSemanticCapture(frame, bytes, JSON.parse(chunk.bytes), plan[index]));
  const merged = mergeThirdPlyCaptures(frame, bytes, chunks);
  merged.artifact.captureScope = captureScope;
  validateSemanticCapture(frame, bytes, merged.artifact);
  return merged;
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const mode = process.argv[2];
  check(["preflight", "batch", "merge", "check"].includes(mode), "Pass a declared semantic capture operation");
  if (mode === "batch") {
    const index = process.argv.indexOf("--max-new");
    process.stdout.write(`${JSON.stringify(await captureSemanticBatches({ maxNew: index < 0 ? Infinity : Number(process.argv[index + 1]) }))}\n`);
  } else {
    const { frame, bytes } = loadSemanticCaptureFrame();
    if (mode === "preflight") process.stdout.write(`${JSON.stringify({ frameDigest: sha(bytes), positions: frame.engineJobs.length,
      budgetQueries: frame.engineJobs.reduce((sum, job) => sum + job.budgets.length, 0), scope: captureScope })}\n`);
    else if (mode === "check") {
      const raw = readFileSync(join(directory, captureName)), capture = JSON.parse(gunzipSync(raw));
      check(capture.partial === false, "Semantic supplement is not complete");
      process.stdout.write(`${JSON.stringify({ captureDigest: sha(raw), ...validateSemanticCapture(frame, bytes, capture) })}\n`);
    } else {
      const chunks = chunkPlan(frame.engineJobs.length).map((interval) => ({ file: interval.file, bytes: readFileSync(join(chunkDirectory, interval.file)) }));
      const { artifact, summary } = mergeSemanticCaptures(frame, bytes, chunks);
      const raw = Buffer.from(`${JSON.stringify(artifact)}\n`), compressed = gzipSync(raw), output = join(directory, captureName);
      check(gunzipSync(compressed).equals(raw), "Compression changed semantic capture bytes");
      if (process.argv.includes("--write")) await publish(output, compressed);
      else check(readFileSync(output).equals(compressed), "Semantic merged source differs from checked intervals");
      process.stdout.write(`${JSON.stringify({ compressedDigest: sha(compressed), logicalDigest: sha(raw), chunks: chunks.length, ...summary })}\n`);
    }
  }
}
