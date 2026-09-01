import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { runWithoutMutating } from "./run-isolated.mjs";

test("accepts a successful CLI that leaves the protected result byte-identical", () => {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-d2486-pass-"));
  const protectedFile = path.join(root, "prior.json");
  const executable = path.join(root, "pass.mjs");
  writeFileSync(protectedFile, "prior\n");
  writeFileSync(executable, "process.stdout.write('measured\\n');\n");
  assert.equal(runWithoutMutating({ protectedFile, executable }), "measured\n");
  assert.equal(readFileSync(protectedFile, "utf8"), "prior\n");
});

test("refuses a successful CLI that mutates the protected prior result", () => {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-d2486-fail-"));
  const protectedFile = path.join(root, "prior.json");
  const executable = path.join(root, "mutate.mjs");
  writeFileSync(protectedFile, "prior\n");
  writeFileSync(executable, `import { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(protectedFile)}, "changed\\n");\n`);
  assert.throws(() => runWithoutMutating({ protectedFile, executable }), /mutated protected prior result/u);
});
