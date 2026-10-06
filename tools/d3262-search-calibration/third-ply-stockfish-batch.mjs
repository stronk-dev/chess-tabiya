// Resumable D3262 final-ply capture: immutable 25-position intervals, verified
// before reuse. No source subset can masquerade as the complete 16,813 jobs.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { chunkPlan } from "./stockfish-horizon4-batch.mjs";
import { directory, loadFrozenThirdPlyFrame, sha, validateThirdPlyStockfish } from "./third-ply-source-check.mjs";

export const chunkDirectory = join(directory, "d3262-stockfish-third-ply-chunks");
function check(value, message) { if (!value) throw new Error(message); }
function runOne(chunk, output) {
  return new Promise((resolveDone, rejectDone) => {
    const child = spawn(process.execPath, ["tools/d3262-search-calibration/stockfish-capture.mjs", "--coherent-third-ply",
      "--start", String(chunk.start), "--limit", String(chunk.count), "--out", output], { stdio: ["ignore", "pipe", "pipe"] });
    let tail = "";
    for (const stream of [child.stdout, child.stderr]) stream.on("data", (bytes) => { tail = `${tail}${bytes}`.slice(-6000); });
    child.on("error", rejectDone);
    child.on("exit", (code, signal) => code === 0 ? resolveDone()
      : rejectDone(new Error(`Third-ply interval ${chunk.file} failed: code=${code} signal=${signal}\n${tail}`)));
  });
}
export function validatePlannedInterval(frame, bytes, chunk, capture) {
  check(capture.start === chunk.start && capture.positions === chunk.count, `Crossed planned interval ${chunk.file}`);
  return validateThirdPlyStockfish(frame, bytes, capture);
}
export async function captureThirdPlyBatches({ maxNew = Infinity } = {}) {
  check(process.env.SF_CMD, "SF_CMD must name the frozen Stockfish binary");
  check(maxNew === Infinity || Number.isSafeInteger(maxNew) && maxNew > 0, "--max-new must be positive");
  const { frame, bytes } = loadFrozenThirdPlyFrame(), plan = chunkPlan(frame.engineJobs.length);
  await mkdir(chunkDirectory, { recursive: true });
  let completed = 0, newlyCaptured = 0;
  const digests = [];
  for (const chunk of plan) {
    const output = resolve(chunkDirectory, chunk.file), prior = existsSync(output);
    if (!prior && newlyCaptured >= maxNew) break;
    if (!prior) await runOne(chunk, output);
    const raw = readFileSync(output), capture = JSON.parse(raw);
    const checked = validatePlannedInterval(frame, bytes, chunk, capture);
    completed += chunk.count;
    newlyCaptured += Number(!prior);
    digests.push({ file: chunk.file, sha256: sha(raw), positions: chunk.count });
    process.stdout.write(`D3262 third ply ${prior ? "reused" : "captured"} ${chunk.file}: ${completed}/${frame.engineJobs.length} positions; ${checked.rankedMoves} coherent entries\n`);
  }
  return { frontierDigest: sha(bytes), completed, total: frame.engineJobs.length, newlyCaptured, chunks: digests.length, digests };
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const index = process.argv.indexOf("--max-new");
  const result = await captureThirdPlyBatches({ maxNew: index < 0 ? Infinity : Number(process.argv[index + 1]) });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
