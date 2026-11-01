import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import test from "node:test";

const makefile = readFileSync(new URL("../Makefile", import.meta.url), "utf8");

test("the actual Make runtime matches .node-version and the compiler Unicode contract", () => {
  const prelude = makefile.slice(0, makefile.indexOf("SF_CMD ?="));
  const result = spawnSync("make", ["--no-print-directory", "-f", "-", "probe"], {
    input: `${prelude}\nprobe:\n\t@$(CI_NODE) -p 'process.version + \":\" + process.versions.unicode'\n`,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const required = readFileSync(new URL("../.node-version", import.meta.url), "utf8").trim();
  assert.equal(result.stdout.trim(), `v${required}:17.0`);
});

test("all CI Node installations consume the same version file, not a floating major", () => {
  for (const name of ["verify", "browser", "release"]) {
    const workflow = readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), "utf8");
    const count = [...workflow.matchAll(/uses: actions\/setup-node@/gu)].length;
    assert.ok(count > 0);
    assert.equal([...workflow.matchAll(/node-version-file: \.node-version/gu)].length, count);
    assert.doesNotMatch(workflow, /node-version:\s*24\s*$/mu);
  }
  const hook = readFileSync(new URL("../lefthook.yml", import.meta.url), "utf8");
  assert.match(hook, /run: make staged-process-contracts/u);
  assert.match(makefile, /staged-process-contracts:\n\t\$\(CI_NODE\) tools\/staged-process-contracts\.mjs/u);
});

test("standalone JavaScript recipes use the existing selected runtime", () => {
  assert.deepEqual(makefile.split("\n").filter(line => /^\t@?node /u.test(line)), []);
});

// Run the actual recipe's executable selection through Make, not a PATH-string assertion.
// The fixture executables deliberately disagree and require no installed Node/Corepack version.
for (const script of ["apps/server/dist/recorded-semantic-path-check.js", "tools/work-state.mjs --sync", "tools/test-tier-check.mjs", "tools/dist/d3300-projector-profile.mjs", "tools/dist/d3300-projector-profile.mjs compare"]) {
  test(`Make launches ${script} with the selected Node, not ambient Node`, t => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-make-toolchain-"));
    t.after(() => rmSync(directory, { recursive: true, force: true }));
    const selected = join(directory, "selected-node");
    const ambient = join(directory, "node");
    for (const [path, output] of [[selected, "selected"], [ambient, "ambient"]]) {
      writeFileSync(path, `#!/bin/sh\nprintf '%s\\n' '${output}'\n`);
      chmodSync(path, 0o755);
    }
    const recipe = makefile.split("\n").find(line => /^\t@?(?:node|\$\(CI_NODE\)) /u.test(line) && line.trimEnd().endsWith(script));
    assert.ok(recipe, `missing normal Make recipe for ${script}`);
    const executable = /^\t(?:@)?(\S+)/u.exec(recipe)?.[1];
    assert.ok(executable);
    const result = spawnSync("make", ["--no-print-directory", "-f", "-", "probe"], {
      cwd: directory,
      input: `CI_NODE := ${selected}\nprobe:\n\t@${executable} -e unused-probe\n`,
      env: { ...process.env, PATH: `${directory}${delimiter}${process.env.PATH ?? ""}` },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), "selected");
  });
}
