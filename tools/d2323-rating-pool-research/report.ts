import { buildResearchReport } from "./simulation.ts";

process.stdout.write(`${JSON.stringify(buildResearchReport(), null, 2)}\n`);
