import { dirname, resolve } from "node:path";

import { runExpressionCensus } from "../expression-census.js";
import { clearGraduationEntries, GraduationClearanceError } from "./graduation-clear.js";

const files = process.argv.slice(2);
if (files.length === 0) throw new GraduationClearanceError("GRADUATION_CLEARANCE_INVALID", "at least one pack file is required");
const results = [];
for (const file of files) {
  results.push(await clearGraduationEntries(file, {
    check: process.env.CHECK === "1",
    census: runExpressionCensus({ roots: [dirname(resolve(file))] }),
  }));
}
process.stdout.write(`${JSON.stringify(results.length === 1 ? results[0] : results, null, 2)}\n`);
