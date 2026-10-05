/** Opt-in research report. Never a production execution or availability image. */
import { writeFileSync } from "node:fs";
import { auditExecutionFrontier, CATALOGUE } from "./audit.js";
const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== "--write")) throw new TypeError("Use no argument or --write");
const report = auditExecutionFrontier(CATALOGUE);
if (args[0] === "--write") writeFileSync("planning/provider-exchange-and-execution/execution-frontier.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ purpose: report.purpose, manifestDigest: report.manifestDigest,
  summary: report.summary, wholeManifest: report.wholeManifest,
  providerFrontier: report.providerFrontier.map(row => ({ projection: row.projection,
    payloadType: row.payloadType, refusal: row.refusal,
    affectedProjections: row.affectedProjections.length, affectedBindings: row.affectedBindings.length,
    affectedConsumers: row.affectedConsumers })),
  consumers: report.consumers.map(row => ({ consumer: row.consumer, bindingCount: row.bindingCount,
    contract: row.completeContract.kind, ...(row.completeContract.kind === "refused" ? { code: row.completeContract.code, message: row.completeContract.message } : {}),
    runtimeAdoption: row.runtimeAdoption })),
}, null, 2));
