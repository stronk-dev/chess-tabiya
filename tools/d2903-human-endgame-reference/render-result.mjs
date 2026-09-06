// DISPOSABLE research harness — D2903. Not production code.
import { readFileSync, writeFileSync } from "node:fs";

import { renderD2903Result } from "./report.mjs";

const [, , inputPath, outputPath] = process.argv;
if (inputPath === undefined || outputPath === undefined) throw new TypeError("usage: render-result <result.json> <report.md>");
writeFileSync(outputPath, renderD2903Result(JSON.parse(readFileSync(inputPath, "utf8"))));
