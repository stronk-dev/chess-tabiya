import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { instrument, SITES, TRACE_KEY } from "./build.mjs";

test("actual source bodies remain verbatim between guarded diagnostic insertions", () => {
  for (const site of SITES) {
    const original = readFileSync(site.path, "utf8"), result = instrument(site.path, original);
    assert(result.includes(TRACE_KEY));
    for (const name of site.functions) assert(result.includes(`${site.file}:${name}`));
    // Erase only the observer syntax: any altered original algorithm/statement remains visible.
    let restored = result
      .replace(/\nconst __d4224Span = [^\n]+; try \{\n/g, "")
      .replace(/\n\} finally \{ if \(__d4224Span [^\n]+\}\n/g, "")
      .replace(/\n\(globalThis as any\)\["__TABIYA_D4224_PROFILE_BUILD__"\] = true;\n$/u, "");
    if (site.file === "fen-memo.ts") restored = restored.replace(/const __trace = [^\n]+;\n\s+const value = deepFreeze\(__trace === undefined \? compute\(input\) : __trace.span\('reading.compute\/' \+ reading, \(\) => compute\(input\)\)\);/u,
      "const value = deepFreeze(compute(input));");
    if (site.file === "evidence-contract.ts") restored = restored.replace(/if \(!IMMUTABLE_DATA.has\(payload\)\) \{\n[^\n]+\n\s+return evidenceDigest\(payload\);\n\s+\}/u,
      "if (!IMMUTABLE_DATA.has(payload)) return evidenceDigest(payload);");
    assert.equal(restored, original, `Original source altered beyond the known observations: ${site.path}`);
    assert.throws(() => instrument(site.path, result));
    if (site.functions.length) {
      const name = site.functions[0];
      assert.throws(() => instrument(site.path, original.replace(`function ${name}`, `function removed_${name}`)));
      const duplicate = `\nfunction ${name}() {}\n`; assert.throws(() => instrument(site.path, original + duplicate));
    }
  }
  assert.throws(() => instrument("other.ts", ""));
});
test("actual reading misses and verification fallback have exactly one guarded site", () => {
  for (const [file, anchor] of [["fen-memo.ts", "const value = deepFreeze(compute(input));"],
    ["evidence-contract.ts", "if (!IMMUTABLE_DATA.has(payload)) return evidenceDigest(payload);"]]) {
    const path = `packages/runtime/src/${file}`, source = readFileSync(path, "utf8");
    assert.throws(() => instrument(path, source.replace(anchor, "")));
    assert.throws(() => instrument(path, source + anchor));
  }
});
