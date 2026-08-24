import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

import {
  CHESS_OPENINGS_COMMIT,
} from "./sourcing/openings.js";
import {
  OPENING_CATALOGUE_COMPILER_FILES,
  OPENING_CATALOGUE_FILES,
  compileRuntimeOpeningCatalogue,
} from "./opening-catalogue.js";

const root = process.cwd();
const sourceRoot = resolve(root, "vendor", "chess-openings", CHESS_OPENINGS_COMMIT);
const output = resolve(root, "apps", "server", "artifacts", "runtime-opening-catalogue.json");
const sourceFiles = await Promise.all(OPENING_CATALOGUE_FILES.map(async (name) => Object.freeze({ name, bytes: await readFile(join(sourceRoot, name)) })));
const expectedBytes = Object.freeze({ "a.tsv": 66_338, "b.tsv": 77_372, "c.tsv": 132_306, "d.tsv": 69_199, "e.tsv": 42_837 } as const);
const [harnessReadme, retrievalPrepare, sourceRegister] = await Promise.all([
  readFile(resolve(root, "tools/d894-opening-runtime-harness/README.md"), "utf8"),
  readFile(resolve(root, "tools/knowledge-retrieval-harness/prepare.mjs"), "utf8"),
  readFile(resolve(root, "planning/platform-alignment/knowledge-retrieval/source-register.csv"), "utf8"),
]);
for (const file of sourceFiles) {
  const letter = file.name[0]!;
  const digest = createHash("sha256").update(file.bytes).digest("hex");
  const registerLine = sourceRegister.split(/\r?\n/u).find((line) => line.startsWith(`lichess-openings-${letter},`));
  const witnesses = [
    harnessReadme.includes(`\`${file.name}\` | \`${digest}\``),
    retrievalPrepare.includes(`${letter}: "${digest}"`),
    registerLine?.includes(`sha256:${digest}`) === true,
  ];
  if (!witnesses.every(Boolean)) throw new TypeError(`Opening source witnesses disagree for ${file.name}`);
  if (file.bytes.byteLength !== expectedBytes[file.name]) throw new TypeError(`Opening source byte count changed for ${file.name}`);
}
const compilerFiles = await Promise.all(OPENING_CATALOGUE_COMPILER_FILES.map(async (path) => Object.freeze({ path, bytes: await readFile(resolve(root, path)) })));
const artifact = compileRuntimeOpeningCatalogue(sourceFiles, compilerFiles);
if (artifact.namedEndpoints.length !== 3_810 || artifact.pathMembership.length !== 7_854 || Math.max(...artifact.pathMembership.map((item) => item.descendantEndpointCount)) !== 2_023) throw new TypeError("Runtime opening catalogue population differs from the accepted source closure");
const bytes = `${canonicalizeJson(artifact)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(output, "utf8").catch(() => "");
  if (current !== bytes) throw new TypeError("Runtime opening catalogue is stale; run make opening-catalogue");
  console.log(`runtime opening catalogue: ${artifact.namedEndpoints.length} endpoints, ${artifact.pathMembership.length} path keys, ${artifact.digest}`);
} else {
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, bytes, "utf8");
  console.log(`wrote ${output}`);
}
