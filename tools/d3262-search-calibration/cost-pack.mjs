// Lossless immutable capture packaging; preserves original compressed triplet bytes.
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkBatch, checkRawCapture, selectBatchCases } from "./cost-batch.mjs";
import { loadCostPlan, sha, validateCostRows } from "./cost-contract.mjs";
import { inputPins } from "./cost-execution.mjs";

export function packCostBatch(out, archive) {
  const summary = checkBatch(out), metadata = JSON.parse(readFileSync(`${out}/metadata.json`));
  const sourceSnapshot = Object.fromEntries(Object.entries(metadata.instrumentDigests).map(([name, digest]) => {
    const bytes = readFileSync(new URL(name, import.meta.url));
    if (sha(bytes) !== digest) throw new Error(`Cannot snapshot changed historical instrument: ${name}`);
    return [name, bytes.toString("base64")];
  }));
  const groups = summary.groups.map(({ name, digest }) => {
    const bytes = readFileSync(`${out}/${name}`);
    if (sha(bytes) !== digest) throw new Error("Changed compressed triplet");
    return { name, digest, base64: bytes.toString("base64") };
  });
  const value = { version: 1, authority: "lossless_partial_cost_capture_not_full_profile", metadata, summary, sourceSnapshot, groups };
  const bytes = gzipSync(`${JSON.stringify(value)}\n`);
  writeFileSync(archive, bytes, { flag: "wx" });
  return { archive, digest: sha(bytes), rows: summary.admittedRows, complete: summary.complete };
}
export function verifyPackedCostValue(pack) {
  if (pack.version !== 1 || pack.authority !== "lossless_partial_cost_capture_not_full_profile") throw new Error("Foreign capture package");
  const plan = loadCostPlan(), same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (pack.metadata.planDigest !== sha(`${JSON.stringify(plan, null, 2)}\n`) || !same(pack.metadata.inputs, inputPins)
    || !same(pack.metadata.cases, selectBatchCases(plan, pack.metadata.start, pack.metadata.limit))) throw new Error("Changed batch population/input identity");
  if (!same(Object.keys(pack.sourceSnapshot).sort(), Object.keys(pack.metadata.instrumentDigests).sort())) throw new Error("Missing/foreign source snapshot");
  for (const [name, digest] of Object.entries(pack.metadata.instrumentDigests))
    if (sha(Buffer.from(pack.sourceSnapshot[name], "base64")) !== digest) throw new Error("Changed retained instrument source");
  const rows = [], cases = [];
  for (const group of pack.groups) {
    const raw = Buffer.from(group.base64, "base64");
    if (sha(raw) !== group.digest) throw new Error("Changed compressed raw triplet");
    const records = JSON.parse(gunzipSync(raw));
    if (records.length !== 3) throw new Error("Lost case in packaged triplet");
    records.forEach(checkRawCapture); rows.push(...records.map(x => x.row)); cases.push(...records.map(x => x.raw.cell));
  }
  const admission = validateCostRows(plan, rows);
  if (!same(cases, pack.metadata.cases) || !same(pack.summary, { groups: pack.groups.map(({ name, digest }) => ({ name, digest })),
    ...admission, requestedBatchComplete: rows.length === pack.metadata.limit,
    rawReplay: "same_implementation_receipt_check_not_independent_validation" })) throw new Error("Changed packaged population/summary");
  return admission;
}
export function checkPackedCostBatch(archive) {
  const bytes = readFileSync(archive), pack = JSON.parse(gunzipSync(bytes)), admission = verifyPackedCostValue(pack);
  return { archive, digest: sha(bytes), ...admission };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), value = name => args[args.indexOf(name) + 1];
  if (!args.includes("--archive")) throw new Error("Explicit --archive required");
  if (!args.includes("--check") && !args.includes("--out")) throw new Error("Explicit capture directory required");
  const result = args.includes("--check") ? checkPackedCostBatch(value("--archive")) : packCostBatch(value("--out"), value("--archive"));
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
