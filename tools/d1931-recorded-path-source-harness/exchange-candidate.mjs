// DISPOSABLE D3787 compiler variant. Patch only the ignored research bundle, never repo source.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { build } from "esbuild";

const sourcePath = resolve("packages/runtime/src/recorded-semantic-path.ts");
let replaced = false;
await build({
  entryPoints: ["tools/d1931-recorded-path-source-harness/exchange-cost.ts"], bundle: true,
  platform: "node", format: "esm", outfile: "tools/dist/recorded-exchange-after.mjs", logLevel: "warning",
  nodePaths: [resolve("packages/runtime/node_modules")],
  plugins: [{ name: "disposable-exact-exchange-reuse", setup(builder) {
    builder.onLoad({ filter: /\/recorded-semantic-path\.ts$/ }, ({ path }) => {
      if (path !== sourcePath) return undefined;
      let contents = readFileSync(path, "utf8");
      const replace = (before, after) => {
        assert.equal(contents.split(before).length, 2, `research anchor must occur once: ${before}`);
        contents = contents.replace(before, after);
      };
      replace("function exchangeEvidence(result: LegalExchangeResult): DeclaredEvidence<unknown> {", "function exchangeEvidence(result: LegalExchangeResult, sources: Map<string, DeclaredEvidence<unknown>>): DeclaredEvidence<unknown> {");
      replace('  const computed = invokeEvidenceValueRoute("rules.exchange.predicate.legal_exchange@1", { fen: result.beforeFen, captureUci: result.captureUci })[0];', '  const query = { fen: result.beforeFen, captureUci: result.captureUci };\n  const key = JSON.stringify([query.fen, query.captureUci]);\n  const computed = sources.get(key) ?? invokeEvidenceValueRoute("rules.exchange.predicate.legal_exchange@1", query)[0];');
      replace("  return computed;", "  sources.set(key, computed);\n  return computed;");
      replace("duty: () => DeclaredEvidence<unknown>): readonly SemanticEvidenceEvent[] {", "duty: () => DeclaredEvidence<unknown>, exchange: (result: LegalExchangeResult) => DeclaredEvidence<unknown>): readonly SemanticEvidenceEvent[] {");
      for (const field of ["targetCapture", "retainedRecapture", "secondTargetCapture"]) {
        const pattern = `exchangeEvidence(value.${field})`;
        const count = contents.split(pattern).length - 1;
        assert.equal(count, field === "targetCapture" ? 3 : 1);
        contents = contents.replaceAll(pattern, `exchange(value.${field})`);
      }
      replace("  const dutyByFen = new Map<string, DeclaredEvidence<unknown>>();", "  const dutyByFen = new Map<string, DeclaredEvidence<unknown>>();\n  const sources = new Map<string, DeclaredEvidence<unknown>>();\n  const exchange = (result: LegalExchangeResult) => exchangeEvidence(result, sources);");
      replace("evaluate(row, window, duty);", "evaluate(row, window, duty, exchange);");
      replaced = true;
      return { contents, loader: "ts", resolveDir: dirname(path) };
    });
  } }],
});
assert(replaced, "the research bundle must use the literal compiler variant, not the original twice");
