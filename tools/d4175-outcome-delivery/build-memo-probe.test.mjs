import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appendProbe, PROBE_KEY, SITES } from "./build-memo-probe.mjs";

test("the probe preserves each actual module prefix byte-for-byte and observes its lexical map", () => {
  for (const site of SITES) {
    const source = readFileSync(site.path, "utf8"), instrumented = appendProbe(site.path, source);
    assert(instrumented.startsWith(source));
    assert.equal(instrumented.slice(source.length).includes("new Map"), false);
    assert(instrumented.slice(source.length).includes(site.clear));
    assert(instrumented.includes(PROBE_KEY));
  }
});
test("missing, duplicate, renamed and already-instrumented cache declarations refuse", () => {
  for (const site of SITES) {
    const source = readFileSync(site.path, "utf8");
    assert.throws(() => appendProbe(site.path, source.replace(site.anchor, "")));
    assert.throws(() => appendProbe(site.path, source + site.anchor));
    assert.throws(() => appendProbe(site.path, appendProbe(site.path, source)));
  }
  assert.throws(() => appendProbe("packages/runtime/src/other.ts", ""));
});
