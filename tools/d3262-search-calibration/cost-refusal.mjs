// Preserve a complete refused capture losslessly. A whole-setting projection
// can be admitted separately, never by dropping a failed candidate or regime.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkRawCapture, selectBatchCases } from "./cost-batch.mjs";
import { loadCostPlan, sha, validateCostRows } from "./cost-contract.mjs";
import { inputPins } from "./cost-execution.mjs";

const authority = "lossless_refused_cost_capture_not_admitted_measurement";
const directory = "planning/semantic-consequence-search";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (value, message) => { if (!value) throw new Error(`D3262_COST_REFUSAL: ${message}`); };
const refusal = (plan, records) => {
  try { validateCostRows(plan, records.map(x => x.row)); }
  catch (error) { return error.message; }
  throw new Error("D3262_COST_REFUSAL: valid capture cannot be called refused");
};
export function verifyRefusedCostValue(pack) {
  const plan = loadCostPlan();
  check(pack.version === 1 && pack.authority === authority, "foreign refused envelope");
  check(pack.metadata.planDigest === sha(`${JSON.stringify(plan, null, 2)}\n`)
    && same(pack.metadata.inputs, inputPins)
    && same(pack.metadata.cases, selectBatchCases(plan, pack.metadata.start, pack.metadata.limit)), "crossed refused plan/range");
  check(same(Object.keys(pack.sourceSnapshot).sort(), Object.keys(pack.metadata.instrumentDigests).sort()), "missing refused source snapshot");
  for (const [name, digest] of Object.entries(pack.metadata.instrumentDigests))
    check(sha(Buffer.from(pack.sourceSnapshot[name], "base64")) === digest, "changed refused source");
  const records = [];
  for (const group of pack.groups) {
    const bytes = Buffer.from(group.base64, "base64");
    check(sha(bytes) === group.digest, "changed refused literal triplet");
    const parsed = JSON.parse(gunzipSync(bytes));
    check(parsed.length === 3, "lost refused regime");
    parsed.forEach(checkRawCapture); records.push(...parsed);
  }
  check(same(records.map(x => x.raw.cell), pack.metadata.cases), "filtered refused population");
  check(pack.refusal === refusal(plan, records), "false refusal");
  return records;
}
export function freezeRefusedCostBatch(out, archive) {
  const metadata = JSON.parse(readFileSync(`${out}/metadata.json`));
  const sourceSnapshot = Object.fromEntries(Object.entries(metadata.instrumentDigests).map(([name, digest]) => {
    const bytes = readFileSync(new URL(name, import.meta.url));
    check(sha(bytes) === digest, "changed original refused instrument; preserve before editing");
    return [name, bytes.toString("base64")];
  }));
  const groups = readdirSync(out).filter(x => /^triplet-\d{6}\.json\.gz$/u.test(x)).sort().map(name => {
    const bytes = readFileSync(`${out}/${name}`);
    return { name, digest: sha(bytes), base64: bytes.toString("base64") };
  });
  const records = groups.flatMap(x => JSON.parse(gunzipSync(Buffer.from(x.base64, "base64"))));
  const pack = { version: 1, authority, metadata, refusal: refusal(loadCostPlan(), records), sourceSnapshot, groups };
  verifyRefusedCostValue(pack);
  const bytes = gzipSync(`${JSON.stringify(pack)}\n`);
  writeFileSync(archive, bytes, { flag: "wx" });
  return { archive, digest: sha(bytes), rows: records.length, refusal: pack.refusal, admitted: false };
}
export function projectCompleteCostSetting(parentArchive, setting, archive) {
  const parentBytes = readFileSync(parentArchive), parent = JSON.parse(gunzipSync(parentBytes));
  const records = verifyRefusedCostValue(parent), plan = loadCostPlan();
  const settingIndex = plan.settings.findIndex(x => x.id === setting);
  check(settingIndex >= 0, "undeclared setting");
  const start = settingIndex * plan.candidates.length * plan.horizons.length * plan.regimes.length;
  const limit = plan.candidates.length * plan.horizons.length * plan.regimes.length;
  const selected = records.filter(x => x.row.setting === setting);
  const expected = selectBatchCases(plan, start, limit);
  check(same(selected.map(x => x.raw.cell), expected), "projection must retain entire setting and every regime");
  const admission = validateCostRows(plan, selected.map(x => x.row));
  const groups = parent.groups.filter((_, index) => records[index * 3].row.setting === setting);
  const basename = parentArchive.split("/").at(-1);
  check(/^d3262-cost-live-[a-z0-9-]+\.json\.gz$/u.test(basename) && parentArchive === `${directory}/${basename}`, "explicit repository parent required");
  const metadata = { ...parent.metadata, start, limit, cases: expected,
    projection: { parentArchive: basename, parentDigest: sha(parentBytes), setting,
      originalStart: parent.metadata.start, originalLimit: parent.metadata.limit,
      authority: "complete_setting_projection_original_capture_bytes_not_recapture" } };
  const summary = { groups: groups.map(({ name, digest }) => ({ name, digest })), ...admission,
    requestedBatchComplete: true, rawReplay: "same_implementation_receipt_check_not_independent_validation" };
  const pack = { version: 1, authority: "lossless_partial_cost_capture_not_full_profile", metadata, summary,
    sourceSnapshot: parent.sourceSnapshot, groups };
  verifyProjectedCostEnvelope(pack);
  const bytes = gzipSync(`${JSON.stringify(pack)}\n`);
  writeFileSync(archive, bytes, { flag: "wx" });
  return { archive, digest: sha(bytes), rows: selected.length, parent: sha(parentBytes), completeProfile: false };
}
export function verifyProjectedCostEnvelope(pack) {
  if (!pack.metadata.projection) return;
  const p = pack.metadata.projection;
  check(/^d3262-cost-live-[a-z0-9-]+\.json\.gz$/u.test(p.parentArchive), "foreign projection parent");
  const bytes = readFileSync(`${directory}/${p.parentArchive}`);
  check(sha(bytes) === p.parentDigest, "changed projection parent");
  const parent = JSON.parse(gunzipSync(bytes)), records = verifyRefusedCostValue(parent), plan = loadCostPlan();
  const index = plan.settings.findIndex(x => x.id === p.setting), limit = plan.candidates.length * 6;
  check(index >= 0 && pack.metadata.start === index * limit && pack.metadata.limit === limit
    && p.originalStart === parent.metadata.start && p.originalLimit === parent.metadata.limit
    && p.authority === "complete_setting_projection_original_capture_bytes_not_recapture", "filtered projection range");
  const selected = parent.groups.filter((_, i) => records[i * 3].row.setting === p.setting);
  const { projection, ...metadata } = pack.metadata;
  check(same(metadata, { ...parent.metadata, start: index * limit, limit, cases: selectBatchCases(plan, index * limit, limit) })
    && same(pack.groups, selected) && same(pack.sourceSnapshot, parent.sourceSnapshot), "restamped projected metadata/bytes");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), get = name => args[args.indexOf(name) + 1];
  let result;
  if (args.length === 4 && args[0] === "--out" && args[2] === "--archive")
    result = freezeRefusedCostBatch(get("--out"), get("--archive"));
  else if (args.length === 6 && args[0] === "--parent" && args[2] === "--setting" && args[4] === "--archive")
    result = projectCompleteCostSetting(get("--parent"), get("--setting"), get("--archive"));
  else throw new Error("Explicit refused freeze or complete-setting projection required");
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
