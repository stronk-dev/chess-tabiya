import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appendProbe, appendImmutablePulse, permitImmutableReset, PROBE_KEY, PULSE_KEY, RESET_KEY, PULSE_SITE, SITES } from "./build-memo-probe.mjs";

test("the probe preserves each actual module prefix byte-for-byte and observes its lexical map", () => {
  for (const site of SITES) {
    const source = readFileSync(site.path, "utf8"), instrumented = appendProbe(site.path, source);
    assert(instrumented.startsWith(source));
    assert.equal(instrumented.slice(source.length).includes("new Map"), false);
    assert(instrumented.slice(source.length).includes(site.clear));
    assert(instrumented.includes(PROBE_KEY));
  }
});
test("the immutable pulse preserves actual source and never clears or replaces its weak metadata", () => {
  const source = readFileSync(PULSE_SITE.path, "utf8"), result = appendImmutablePulse(source);
  assert(result.startsWith(source));
  const added = result.slice(source.length);
  assert(added.includes(PULSE_KEY)); assert(added.includes("immutable({"));
  assert(!/new WeakSet|IMMUTABLE_DATA\s*=|\.clear\(|declareEvidence/u.test(added));
  assert.throws(() => appendImmutablePulse(source.replace(PULSE_SITE.anchor, "")));
  assert.throws(() => appendImmutablePulse(source + PULSE_SITE.anchor));
  assert.throws(() => appendImmutablePulse(result));
});
test("the separate reset changes exactly the verifier's declaration and adds no issuer", () => {
  const source = readFileSync(PULSE_SITE.path, "utf8"), result = permitImmutableReset(source);
  const expected = source.replace(PULSE_SITE.anchor, PULSE_SITE.anchor.replace("const ", "let "));
  assert(result.startsWith(expected)); assert.equal(expected.length, source.length - 2);
  const added = result.slice(expected.length);
  assert(added.includes(RESET_KEY)); assert(added.includes("IMMUTABLE_DATA = new FrozenDataMemo(262_144)"));
  assert(!/VALUE_RECEIPTS|DECLARED_VALUES|declareEvidence|\.clear\(/u.test(added));
  assert.throws(() => permitImmutableReset(source.replace(PULSE_SITE.anchor, "")));
  assert.throws(() => permitImmutableReset(source + PULSE_SITE.anchor));
  assert.throws(() => permitImmutableReset(result));
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
