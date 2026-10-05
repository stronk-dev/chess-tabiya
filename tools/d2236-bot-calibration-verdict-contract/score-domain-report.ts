// Explicit offline D3430 audit; no source acquisition, provider calls or calibration outputs.
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { auditScoreDomains, assertHistoricalPricing } from "./score-domain-audit.js";
import { populationReceipt } from "./receipt.js";
import { digest } from "./population.js";

const options = process.argv.slice(2);
if (options.length > 1 || options.some((option) => !["--update", "--check"].includes(option))) throw new TypeError("expected only --update or --check");
const population = JSON.parse(await readFile(".cache/bot-calibration/human-reference-population.json", "utf8"));
const reference = populationReceipt(population);
// An immutable historical receipt, not today's mutable executor or a caller-supplied digest.
// New scheduling code must not invalidate descriptive use of already captured evidence, nor
// make that evidence appear to have been regenerated under the new code.
const pricingRevision = "bb53301fb0dd3f3a65b24754c9aafe9eedf212a8";
const historical = (file: string) => execFileSync("git", ["show", `${pricingRevision}:${file}`], { maxBuffer: 2_000_000 });
const pricingReceipt = JSON.parse(historical("planning/bot-roster/calibration-human-reference-pricing.json").toString("utf8"));
const originalFiles = ["tools/d2236-bot-calibration-verdict-contract/evaluation.ts", "tools/d2236-bot-calibration-verdict-contract/evaluate.ts",
  "tools/d2236-bot-calibration-verdict-contract/receipt.ts", "tools/d2236-bot-calibration-verdict-contract/population.ts",
  "apps/server/src/engine-supervisor.ts", "apps/server/src/provider-exchange.ts", "apps/server/src/provider-operations.ts"];
const historicalExecutorDigest = digest(JSON.stringify(originalFiles.map((file) => [file, digest(historical(file))])));
if (historicalExecutorDigest !== pricingReceipt.instrumentDigest) throw new TypeError("historical executor closure mismatch");
const result = await auditScoreDomains(".cache/bot-calibration/human-reference-pricing.jsonl", population.rows, reference.populationDigest, historicalExecutorDigest);
assertHistoricalPricing(result, pricingReceipt);
if (result.counts.decisions !== reference.selectedDecisions || result.clusters.distinctGames !== reference.distinctGames
  || result.clusters.distinctGameWindows !== reference.distinctGameWindows) throw new TypeError("audit population coverage mismatch");
for (const cell of reference.cells) {
  for (const half of [0, 1] as const) {
    const count = result.cells.find((value) => value.cell === `${cell.cell}/${half}`);
    if (!count || count.decisions !== cell[half === 0 ? "half0" : "half1"]) throw new TypeError("audit cell/half coverage mismatch");
  }
}
const files = ["score-domain-audit.ts", "score-domain-report.ts"];
const auditInstrumentDigest = digest(JSON.stringify(await Promise.all(files.map(async (file) =>
  [file, digest(await readFile(`tools/d2236-bot-calibration-verdict-contract/${file}`))]))));
const receipt = `${JSON.stringify({ ...result, auditInstrumentDigest, pricingRevision }, null, 2)}\n`;
const output = "planning/bot-roster/calibration-score-domains.json";
if (options.includes("--update")) await writeFile(output, receipt);
else if (options.includes("--check") && await readFile(output, "utf8") !== receipt) throw new TypeError("saved score-domain receipt drift");
process.stdout.write(receipt);
