// DISPOSABLE author contract for D2361. Not the production C11 implementation.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const rfc = readFileSync("rfc/provider-protocol-register.md", "utf8");
const current = rfc.slice(0, rfc.indexOf("## Changelog"));
const transition = (previous, current) => {
  if (previous.kind === "landed" && current.kind === "absent") throw new TypeError("LANDED_RESOURCE_CANNOT_BECOME_ABSENT");
  if (previous.kind === "absent" && (previous.claim !== "first lane 1" || current.kind !== "landed" || current.head !== 1)) throw new TypeError("FIRST_LANDING_INVALID");
  return current;
};
test("D2361 uses named-root absence and a unique first claim", () => {
  assert.match(rfc, /provider-protocol head=absent/u);
  assert.match(rfc, /provider-protocol \| first lane 1 \|/u);
  assert.match(rfc, /packages\/runtime\/src\/provider-protocol\.ts#PROVIDER_PROTOCOL_VERSION/u);
  assert.doesNotMatch(current, /head=0|head 0 \+|pre-landing head-0 state/u);
});
test("D2361 makes absence one-way", () => {
  assert.deepEqual(transition({ kind: "absent", claim: "first lane 1" }, { kind: "landed", head: 1 }), { kind: "landed", head: 1 });
  assert.throws(() => transition({ kind: "landed", head: 1 }, { kind: "absent", claim: "first lane 1" }), /CANNOT_BECOME_ABSENT/u);
});
