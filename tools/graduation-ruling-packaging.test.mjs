import assert from "node:assert/strict";
import test from "node:test";

import { missingGraduationRulingCopies } from "./graduation-ruling-packaging.mjs";

const ROOTS = Object.freeze([
  "planning/exploration/log.md",
  "docs/tablebase-grounding.md",
]);

test("requires one production-image copy for every admitted graduation ruling root", () => {
  const complete = ROOTS.map((root) => `COPY ${root} ${root}`).join("\n");
  assert.deepEqual(missingGraduationRulingCopies(ROOTS, complete), []);

  const missingSecond = `COPY ${ROOTS[0]} ${ROOTS[0]}`;
  assert.deepEqual(missingGraduationRulingCopies(ROOTS, missingSecond), [ROOTS[1]]);
});
