// Portable gzip source artifact. Compression changes storage, not provider
// values, capture chronology, frame identity or complete-population obligations.
import { existsSync, readFileSync } from "node:fs";
import { link, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";
import { chunkPlan } from "./stockfish-horizon4-batch.mjs";
import { chunkDirectory, validatePlannedInterval } from "./third-ply-stockfish-batch.mjs";
import { directory, loadFrozenThirdPlyFrame, sha, validateThirdPlyStockfish } from "./third-ply-source-check.mjs";

function check(value, message) { if (!value) throw new Error(message); }
export function mergeThirdPlyCaptures(frame, bytes, chunks) {
  const plan = chunkPlan(frame.engineJobs.length);
  check(chunks.length === plan.length, "Incomplete third-ply interval population");
  const rows = [], chunkDigests = [];
  let source;
  for (let index = 0; index < plan.length; index++) {
    const chunk = chunks[index], planned = plan[index];
    check(chunk.file === planned.file, "Missing or crossed third-ply interval");
    const capture = JSON.parse(chunk.bytes);
    validatePlannedInterval(frame, bytes, planned, capture);
    if (source === undefined) source = capture.source;
    else check(JSON.stringify(source) === JSON.stringify(capture.source), "Changed source between intervals");
    rows.push(...capture.rows);
    chunkDigests.push({ file: chunk.file, sha256: sha(chunk.bytes), positions: planned.count });
  }
  const artifact = { version: 1, manifest: frame.manifest, frontierDigest: sha(bytes), start: 0,
    positions: frame.engineJobs.length, partial: false, source, rows, chunkDigests };
  const summary = validateThirdPlyStockfish(frame, bytes, artifact);
  return { artifact, summary };
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const { frame, bytes } = loadFrozenThirdPlyFrame();
  const chunks = chunkPlan(frame.engineJobs.length).map((chunk) => ({ file: chunk.file, bytes: readFileSync(join(chunkDirectory, chunk.file)) }));
  const { artifact, summary } = mergeThirdPlyCaptures(frame, bytes, chunks);
  const raw = Buffer.from(`${JSON.stringify(artifact)}\n`), compressed = gzipSync(raw);
  const output = join(directory, "d3262-stockfish-third-ply-capture.json.gz");
  if (process.argv.includes("--write")) {
    check(!existsSync(output), "Refusing to replace a final-ply source");
    const temporary = `${output}.partial-${process.pid}`;
    await writeFile(temporary, compressed, { flag: "wx" });
    try { await link(temporary, output); } finally { await unlink(temporary); }
  } else check(readFileSync(output).equals(compressed), "Merged compressed source differs from checked intervals");
  check(gunzipSync(compressed).equals(raw), "Compressed source round trip changed bytes");
  process.stdout.write(`${JSON.stringify({ compressedDigest: sha(compressed), logicalDigest: sha(raw),
    compressedBytes: compressed.length, logicalBytes: raw.length, chunks: chunks.length, ...summary }, null, 2)}\n`);
}
