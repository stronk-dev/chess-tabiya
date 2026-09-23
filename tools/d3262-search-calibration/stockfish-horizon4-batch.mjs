// Resumable disposable D3262 capture. Each completed interval is immutable and
// checked before the next one starts; a crash can lose only the active interval.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import { validateHorizon4Capture } from "./stockfish-horizon4-check.mjs";

const root = "planning/semantic-consequence-search";
const directory = join(root, "d3262-stockfish-horizon4-chunks");
const chunkSize = 25;
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }

export function chunkPlan(total, size = chunkSize) {
  check(Number.isSafeInteger(total) && total > 0 && Number.isSafeInteger(size) && size > 0, "Invalid capture chunk plan");
  return Array.from({ length: Math.ceil(total / size) }, (_, index) => {
    const start = index * size, count = Math.min(size, total - start);
    return { index, start, count, file: `chunk-${String(start).padStart(4, "0")}-${String(start + count - 1).padStart(4, "0")}.json` };
  });
}

function runOne(chunk, output) {
  return new Promise((resolveDone, rejectDone) => {
    const child = spawn(process.execPath, ["tools/d3262-search-calibration/stockfish-capture.mjs", "--horizon4", "--start", String(chunk.start), "--limit", String(chunk.count), "--out", output], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    child.stdout.on("data", (bytes) => { stdout = `${stdout}${bytes}`.slice(-4000); });
    child.stderr.on("data", (bytes) => { stderr = `${stderr}${bytes}`.slice(-4000); });
    child.on("error", rejectDone);
    child.on("exit", (code, signal) => code === 0 ? resolveDone() : rejectDone(new Error(`Stockfish chunk ${chunk.index} exited code=${code} signal=${signal}\n${stdout}\n${stderr}`)));
  });
}

export async function captureBatches({ maxNew = Infinity } = {}) {
  check(process.env.SF_CMD, "SF_CMD must name the pinned Stockfish executable");
  check(maxNew === Infinity || Number.isSafeInteger(maxNew) && maxNew > 0, "--max-new must be positive");
  const frontierBytes = readFileSync(join(root, "d3262-horizon4-frontier.json"));
  const frontier = JSON.parse(frontierBytes);
  const reference = JSON.parse(readFileSync(join(root, "d3262-stockfish-child-capture.json")));
  const plan = chunkPlan(frontier.jobs.length);
  await mkdir(directory, { recursive: true });
  let completed = 0, newlyCaptured = 0, legalMoves = 0, rankedMoves = 0, trailingPartial = 0;
  const digests = [];
  for (const chunk of plan) {
    const output = resolve(directory, chunk.file);
    const prior = existsSync(output);
    if (!prior && newlyCaptured >= maxNew) break;
    if (!prior) await runOne(chunk, output);
    const bytes = readFileSync(output);
    const capture = JSON.parse(bytes);
    check(capture.start === chunk.start && capture.positions === chunk.count, `Crossed interval in ${basename(output)}`);
    const checked = validateHorizon4Capture(frontier, frontierBytes, capture, reference);
    completed += chunk.count;
    if (!prior) newlyCaptured += 1;
    legalMoves += checked.legalMoves;
    rankedMoves += checked.rankedMoves;
    trailingPartial += checked.trailingPartial;
    digests.push({ file: chunk.file, sha256: sha(bytes), positions: chunk.count });
    process.stdout.write(`D3262 horizon4 ${prior ? "reused" : "captured"} ${chunk.file}: ${completed}/${frontier.jobs.length} positions, ${checked.rankedMoves} coherent ranked entries\n`);
  }
  return { frontierDigest: sha(frontierBytes), completed, total: frontier.jobs.length, newlyCaptured, chunks: digests.length, legalMoves, rankedMoves, trailingPartial, digests };
}

if (process.argv[1]?.endsWith("stockfish-horizon4-batch.mjs")) {
  const index = process.argv.indexOf("--max-new");
  const maxNew = index < 0 ? Infinity : Number(process.argv[index + 1]);
  const summary = await captureBatches({ maxNew });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}
