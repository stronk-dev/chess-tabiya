// `make component-coverage` entry point (rfc/evidence-presentation.md §8.2, criterion 2). Exits
// non-zero on any population miss, registry miss or unresolved consumer-class anchor.
import { componentCoverage, formatCoverage } from "./coverage.js";
import { productionCoverageInput, unresolvedClassAnchors } from "./production.js";

const report = componentCoverage(productionCoverageInput());
const anchors = unresolvedClassAnchors(process.cwd());
console.log(formatCoverage(report));
for (const miss of anchors) console.log(`  ANCHOR ${miss}`);
if (!report.ok || anchors.length > 0) process.exitCode = 1;
