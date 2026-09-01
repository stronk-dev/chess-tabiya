import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { DrillPackDefinition } from "../../packages/schema/src/drill-pack/index.js";
import { phaseCensus } from "./census.js";

function packFiles(root: string): readonly string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !/\.(?:browser|evidence|job|sources)\.json$/u.test(entry.name))
    .map((entry) => resolve(root, entry.name))
    .sort();
}

const root = resolve(process.argv[2] ?? "content/drafts");
const out = resolve(process.argv[3] ?? "planning/phase-classifier-census/results.json");
const packs = packFiles(root).map((file) => JSON.parse(readFileSync(file, "utf8")) as DrillPackDefinition);
const report = phaseCensus(packs);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`phase-classifier-census: ${report.corpus.packs} packs / ${report.corpus.positions} positions; roots ${report.roots.matches} match, ${report.roots.abstains} abstain, ${report.roots.mismatches} mismatch; authored positions ${report.authoredPositions.matches} match, ${report.authoredPositions.abstains} abstain, ${report.authoredPositions.mismatches} mismatch; edge changes ${report.edgeChanges}, reversals ${report.twoEdgeReversals}\n`);
