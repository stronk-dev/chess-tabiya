// Intent-parity verification — D651. It reads protected design and never writes it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { INTENT_CONTRACTS, renderIntentParityReport } from "./registry.mjs";

const ROOT = new URL("../../", import.meta.url);
function source(path) { return readFileSync(new URL(path, ROOT), "utf8"); }
function normalized(value) { return value.replace(/[*_`]/gu, "").replace(/\s+/gu, " "); }

test("binds every approved amendment and every deliberately preserved opening", () => {
  assert.equal(INTENT_CONTRACTS.length, 6);
  for (const contract of INTENT_CONTRACTS) {
    for (const assertion of contract.assertions) assert.ok(normalized(source(assertion.path)).includes(normalized(assertion.text)), `${contract.id}: ${assertion.text}`);
    if (contract.preservedOpen !== undefined) assert.ok(normalized(source(contract.preservedOpen.path)).includes(normalized(contract.preservedOpen.text)), `${contract.id}: preserved opening`);
  }
});

test("requires amendments to follow rather than erase their historical claims", () => {
  const product = source("design/02-product-shape.md");
  assert.ok(product.indexOf("Deployment axis, amended — O13 RULED 2026-08-20") > product.indexOf("Deployment axis — SETTLED 2026-08-12"));
  const breadth = source("design/03-product-breadth.md");
  assert.ok(breadth.indexOf("Amendment — O1/O2/O4 RULED 2026-08-20") > breadth.indexOf("The seed sources **are the assistance ladder"));
  const gates = source("planning/exploration/gates.md");
  assert.ok(gates.indexOf("Correction 2026-08-21") > gates.indexOf("Breadth gates — **COMPLETE 2026-08-14"));
});

test("keeps the four amended breadth gates mirrored at the measured boundary", () => {
  const design = normalized(source("design/03-product-breadth.md"));
  const gates = normalized(source("planning/exploration/gates.md"));
  for (const fact of [
    { design: "20 producers / 126 projections / 25 consumers / 175 bindings", gates: "20 producers / 126 projections / 25 consumers / 175 bindings" },
    { design: "not completeness or a learner experience", gates: "F2 deliberately grants no product-module admission" },
    { design: "only 11/18 structural families round-trip", gates: "only 11/18 structural families round-trip" },
    { design: "only 2/6 direct workflow bindings", gates: "only 2/6 intended workflows bind directly" },
    { design: "The provider-off Compose core functions", gates: "The 1.0 platform floor is still unmet independently" },
  ]) {
    assert.ok(design.includes(fact.design), `design mirror: ${fact.design}`);
    assert.ok(gates.includes(fact.gates), `gate mirror: ${fact.gates}`);
  }
});

test("byte-checks the derived contract report instead of rewriting it during verify", () => {
  assert.equal(source("tools/intent-parity-harness/output.md"), renderIntentParityReport());
});
