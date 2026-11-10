import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import ts from "typescript";
import { runStagedTypecheck } from "./staged-typecheck.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "tabiya-staged-types-fixture-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "--quiet"], { cwd: root });
  writeFileSync(join(root, "source.ts"), "export const value = 1;\n");
  writeFileSync(join(root, "consumer.ts"), 'import { value } from "./source.js"; export const result: number = value;\n');
  execFileSync("git", ["add", "source.ts", "consumer.ts"], { cwd: root });
  return root;
}
function typecheck(root) {
  const program = ts.createProgram(readdirSync(root).filter(file => file.endsWith(".ts")).map(file => join(root, file)), {
    noEmit: true, strict: true, skipLibCheck: true, types: [], target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext,
  });
  const errors = ts.getPreEmitDiagnostics(program);
  if (errors.length) throw new Error(ts.formatDiagnostics(errors, { getCanonicalFileName: path => path, getCurrentDirectory: () => root, getNewLine: () => "\n" }));
}

test("project types use staged dependencies and exclude unstaged/untracked poison without changing the checkout", t => {
  const root = fixture(t);
  writeFileSync(join(root, "consumer.ts"), 'import { value } from "./source.js"; export const result: number = value + 1;\n');
  execFileSync("git", ["add", "consumer.ts"], { cwd: root });
  writeFileSync(join(root, "consumer.ts"), 'import { value } from "./source.js"; export const result: number = value + 2;\n');
  writeFileSync(join(root, "source.ts"), 'export const value = "unfinished dependency";\n');
  writeFileSync(join(root, "poison.ts"), 'const invalid: number = "untracked";\n');
  assert.throws(() => typecheck(root), /not assignable/u); // Actual mixed-checkout predecessor fails.
  const before = execFileSync("git", ["diff"], { cwd: root, encoding: "utf8" });
  const beforeIndex = execFileSync("git", ["ls-files", "--stage"], { cwd: root, encoding: "utf8" });
  let snapshot;
  runStagedTypecheck(root, { execute(directory) {
    snapshot = directory;
    assert.equal(readFileSync(join(directory, "source.ts"), "utf8"), "export const value = 1;\n");
    assert.match(readFileSync(join(directory, "consumer.ts"), "utf8"), /value \+ 1/u);
    assert.equal(existsSync(join(directory, "poison.ts")), false);
    assert.equal(existsSync(join(directory, "node_modules")), false); // No borrowed workspace link.
    typecheck(directory);
  } });
  assert.equal(existsSync(snapshot), false);
  assert.equal(execFileSync("git", ["diff"], { cwd: root, encoding: "utf8" }), before);
  assert.equal(existsSync(join(root, "poison.ts")), true);
  assert.equal(execFileSync("git", ["ls-files", "--stage"], { cwd: root, encoding: "utf8" }), beforeIndex);
});

test("a genuinely invalid staged project fails even when the working copy is fixed, then cleans up", t => {
  const root = fixture(t);
  writeFileSync(join(root, "consumer.ts"), 'import { value } from "./source.js"; export const result: string = value;\n');
  execFileSync("git", ["add", "consumer.ts"], { cwd: root });
  writeFileSync(join(root, "consumer.ts"), 'import { value } from "./source.js"; export const result: number = value;\n');
  typecheck(root);
  let snapshot;
  assert.throws(() => runStagedTypecheck(root, { execute(directory) { snapshot = directory; typecheck(directory); } }), /not assignable/u);
  assert.equal(existsSync(snapshot), false);
  assert.match(readFileSync(join(root, "consumer.ts"), "utf8"), /result: number/u);
});

test("normal commit configuration uses one complete staged project check", () => {
  const hook = readFileSync(new URL("../lefthook.yml", import.meta.url), "utf8");
  assert.match(hook, /name: staged-typecheck[\s\S]*?run: make staged-typecheck/u);
  for (const name of ["runtime-typecheck", "schema-typecheck", "server-typecheck", "web-typecheck"]) assert.ok(!hook.includes(`name: ${name}`));
});
