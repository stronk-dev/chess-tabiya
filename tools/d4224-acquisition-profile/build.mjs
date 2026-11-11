// DISPOSABLE D4224 body instrumentation; on-disk production stays unchanged.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { build } from "esbuild";

export const TRACE_KEY = "__TABIYA_D4224_TRACE__", BUILD_KEY = "__TABIYA_D4224_PROFILE_BUILD__";
export const SITES = Object.freeze([
  { file: "candidate-population.ts", functions: ["compileInternal", "compileLegalPopulation", "compileRow", "childReadingsFromFoundation", "candidateFoundationPosition", "compileCandidatePopulationReceipt", "assertCandidatePopulationReceipt", "assertCandidateFoundationPosition"] },
  { file: "semantic-evidence.ts", functions: ["localSemanticEventClosure", "subjectOutcomeSemanticEvents"] },
  { file: "candidate-total-inputs.ts", functions: ["collectCandidateTotalInputs", "assertCandidateTotalInputs", "pawnLineage"] },
  { file: "foundation-piece-lineage.ts", functions: ["originalPiecePositions"] },
  { file: "evidence-factories.ts", functions: ["readFoundationPositionTuple", "readMoverPieceRiskInvocation", "mint", "mintConventionReceipt", "authorityDigest"] },
  { file: "evidence-conventions.ts", functions: ["conventionReceipt"] },
  { file: "evidence-contract.ts", functions: ["declareEvidence", "evidenceDigest", "sealedPayloadDigest"] },
  { file: "fen-memo.ts", functions: [] },
].map(site => ({ ...site, path: `packages/runtime/src/${site.file}` })));

export function instrument(path, source) {
  const site = SITES.find(site => site.path === path); assert(site, `Unknown D4224 source ${path}`);
  assert(!source.includes(TRACE_KEY) && !source.includes(BUILD_KEY), "Diagnostic already present");
  const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true), edits = [];
  for (const name of site.functions) {
    const declarations = tree.statements.filter(node => ts.isFunctionDeclaration(node) && node.name?.text === name && node.body);
    assert.equal(declarations.length, 1, `Expected one actual ${name} body in ${path}`);
    const fn = declarations[0]; assert(!fn.asteriskToken && !fn.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword));
    const body = fn.body; assert(!source.slice(body.pos, body.end).includes("__d4224Span"));
    const key = JSON.stringify(TRACE_KEY), label = JSON.stringify(`${site.file}:${name}`);
    edits.push({ at: body.getStart(tree) + 1, text: `\nconst __d4224Span = (globalThis as any)[${key}]?.enter(${label}); try {\n` });
    edits.push({ at: body.end - 1, text: `\n} finally { if (__d4224Span !== undefined) (globalThis as any)[${key}].leave(__d4224Span); }\n` });
  }
  let result = source;
  for (const edit of edits.sort((a, b) => b.at - a.at)) result = result.slice(0, edit.at) + edit.text + result.slice(edit.at);
  if (site.file === "fen-memo.ts") {
    const anchor = "const value = deepFreeze(compute(input));";
    assert.equal(result.split(anchor).length, 2);
    result = result.replace(anchor, `const __trace = (globalThis as any)[${JSON.stringify(TRACE_KEY)}];
      const value = deepFreeze(__trace === undefined ? compute(input) : __trace.span('reading.compute/' + reading, () => compute(input)));`);
  }
  if (site.file === "evidence-contract.ts") {
    const anchor = "if (!IMMUTABLE_DATA.has(payload)) return evidenceDigest(payload);";
    assert.equal(result.split(anchor).length, 2);
    result = result.replace(anchor, `if (!IMMUTABLE_DATA.has(payload)) {
      (globalThis as any)[${JSON.stringify(TRACE_KEY)}]?.count(SEALED_PAYLOAD_DIGESTS.has(payload) ? 'digest.verification_miss_with_prior_digest' : 'digest.verification_miss_without_prior_digest');
      return evidenceDigest(payload);
    }`);
  }
  if (site.file === "candidate-population.ts") result += `\n(globalThis as any)[${JSON.stringify(BUILD_KEY)}] = true;\n`;
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const common = { entryPoints: ["tools/d4224-acquisition-profile/run.ts"], bundle: true, platform: "node", format: "esm", external: ["typescript"], logLevel: "warning" };
  await build({ ...common, outfile: ".cache/d4224-acquisition-profile/ordinary.mjs" });
  const loaded = new Set();
  await build({ ...common, outfile: ".cache/d4224-acquisition-profile/profiled.mjs", plugins: [{ name: "D4224-actual-source-spans", setup(build) {
    build.onLoad({ filter: /\.ts$/ }, args => {
      const site = SITES.find(site => resolve(site.path) === args.path); if (!site) return;
      assert(!loaded.has(site.path)); loaded.add(site.path);
      return { contents: instrument(site.path, readFileSync(args.path, "utf8")), loader: "ts" };
    });
  } }] });
  assert.deepEqual([...loaded].sort(), SITES.map(site => site.path).sort());
}
