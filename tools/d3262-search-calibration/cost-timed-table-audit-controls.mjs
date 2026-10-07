// Disposable D3508 custody/output falsifiers over the retained real examples.
// Mutates in-memory copies only; never rewrites evidence or executes Stockfish.
import { readFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { checkTimedTableAudit } from "./cost-timed-table-audit.mjs";
import { sha } from "./cost-contract.mjs";

const value = JSON.parse(readFileSync(process.argv[2], "utf8"));
const original = checkTimedTableAudit(value);
const resealMetadata = (v, change) => {
  const metadata = JSON.parse(v.metadataLiteral); change(metadata);
  v.metadataLiteral = JSON.stringify(metadata); v.metadataDigest = sha(v.metadataLiteral);
};
const resealGroup = (v, change) => {
  const group = v.groups[0];
  const rows = JSON.parse(gunzipSync(Buffer.from(group.base64, "base64"))); change(rows);
  for (const row of rows) row.row.rawCaptureDigest = sha(JSON.stringify(row.raw));
  const bytes = gzipSync(JSON.stringify(rows));
  group.base64 = bytes.toString("base64"); group.digest = sha(bytes);
};
const controls = [
  ["metadata bytes", v => { v.metadataLiteral += " "; }],
  ["resealed plan", v => resealMetadata(v, m => { m.planDigest = sha("other plan"); })],
  ["resealed range", v => resealMetadata(v, m => { m.start += 3; })],
  ["filtered declared population", v => resealMetadata(v, m => { m.cases.pop(); m.limit--; })],
  ["duplicate original group", v => { v.groups.push(structuredClone(v.groups[0])); }],
  ["changed source snapshot", v => { v.sourceSnapshots[1].literal += "\n"; }],
  ["resealed different source", v => { const s = v.sourceSnapshots[1]; s.literal += "\n"; s.digest = sha(s.literal); }],
  ["resealed missing regime", v => resealGroup(v, rows => { rows.pop(); })],
  ["resealed crossed case", v => resealGroup(v, rows => { rows[0].raw.cell.candidateUci = "a1a8"; })],
  ["resealed filtered dependencies", v => resealGroup(v, rows => { rows[0].raw.dependencies.pop(); })],
  ["resealed crossed query", v => resealGroup(v, rows => { rows[0].raw.dependencies[0].operands.multiPv++; })],
  ["resealed missing delimiter", v => resealGroup(v, rows => {
    rows[0].raw.dependencies.find(d => d.failure === "Bound-only score cannot form coherent rank table").rejectedCapture.lines.pop();
  })],
  ["changed earlier depth", v => { v.result.examples[0].observation.earlierExactFrame.coherentDepth++; }],
  ["changed exact score", v => { v.result.examples[0].observation.earlierExactFrame.entries[0].score.value++; }],
  ["invented bestmove agreement", v => {
    const frame = v.result.examples.find(x => x.observation.earlierExactFrame.delimiterMatchesFrameRankOne === false)?.observation.earlierExactFrame;
    if (!frame) throw new Error("real disagreement control unavailable");
    frame.delimiterMatchesFrameRankOne = true;
  }],
  ["invented production profile", v => { v.result.productionProfileSelected = true; }],
  ["invented whole-population claim", v => { v.result.wholePopulationClaim = true; }],
  ["invented move recommendation", v => { v.result.examples[0].observation.moveRecommendationLicensed = true; }],
];
let rejected = 0;
for (const [name, change] of controls) {
  const copy = structuredClone(value); change(copy);
  let refused = false;
  try { checkTimedTableAudit(copy); } catch { refused = true; }
  if (!refused) throw new Error(`D3508 falsifier admitted: ${name}`);
  rejected++;
}
process.stdout.write(`${JSON.stringify({ ...original, rejectedCorruptions: rejected,
  originalsUntouched: sha(readFileSync(process.argv[2])), independentOracle: false })}\n`);
