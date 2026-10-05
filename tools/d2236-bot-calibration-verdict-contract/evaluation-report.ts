import { readFile, writeFile } from "node:fs/promises";
import { inspectJournal, instrumentDigest } from "./evaluation.js";
import { populationReceipt } from "./receipt.js";

const population = JSON.parse(await readFile(".cache/bot-calibration/human-reference-population.json", "utf8"));
const reference = populationReceipt(population);
const result = await inspectJournal(".cache/bot-calibration/human-reference-pricing.jsonl", population.rows, reference.populationDigest, await instrumentDigest());
if (result.counts.decisions !== population.rows.length) throw new TypeError(`incomplete pricing: ${result.counts.decisions}/${population.rows.length}; no complete receipt published`);
const receipt = `${JSON.stringify({
  ...result.header, state: "priced_not_calibrated", journalDigest: result.chain,
  ...result.counts, cells: result.cells,
  claims: { strength: "not_measured", distribution: "not_measured", bandIdentity: "not_measured", humanLikeLabelAllowed: false },
}, null, 2)}\n`;
const output = "planning/bot-roster/calibration-human-reference-pricing.json";
if (process.argv.includes("--update")) await writeFile(output, receipt);
else if (process.argv.includes("--check") && await readFile(output, "utf8") !== receipt) throw new TypeError("saved evaluation receipt drift");
process.stdout.write(receipt);
