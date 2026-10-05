import { readFileSync, writeFileSync } from "node:fs";
import { populationReceipt } from "./receipt.js";

const artifact = JSON.parse(readFileSync(".cache/bot-calibration/human-reference-population.json", "utf8"));
const receipt = `${JSON.stringify(populationReceipt(artifact), null, 2)}\n`;
if (process.argv.includes("--update")) {
  writeFileSync("planning/bot-roster/calibration-human-reference-population.json", receipt);
} else if (process.argv.includes("--check")) {
  if (readFileSync("planning/bot-roster/calibration-human-reference-population.json", "utf8") !== receipt) throw new TypeError("saved population receipt drift");
}
process.stdout.write(receipt);
