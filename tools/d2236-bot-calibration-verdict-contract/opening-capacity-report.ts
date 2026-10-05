import { readFileSync, writeFileSync } from "node:fs";
import { openingCapacityReceipt } from "./opening-capacity.js";
const artifact = JSON.parse(readFileSync(".cache/bot-calibration/opening-capacity.json", "utf8"));
const receipt = `${JSON.stringify(openingCapacityReceipt(artifact), null, 2)}\n`;
const destination = "planning/bot-roster/calibration-opening-capacity.json";
if (process.argv.includes("--update")) writeFileSync(destination, receipt);
else if (process.argv.includes("--check") && readFileSync(destination, "utf8") !== receipt) throw new TypeError("committed opening capacity receipt drift");
process.stdout.write(receipt);
