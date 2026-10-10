import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import test from "node:test";

const makefile = readFileSync(new URL("../Makefile", import.meta.url), "utf8");

test("standalone JavaScript recipes use the existing selected runtime", () => {
  assert.deepEqual(makefile.split("\n").filter(line => /^\t@?node /u.test(line)), []);
});

// Run the actual recipe's executable selection through Make, not a PATH-string assertion.
// The fixture executables deliberately disagree and require no installed Node/Corepack version.
for (const script of ["apps/server/dist/recorded-semantic-path-check.js", "tools/work-state.mjs --sync", "tools/test-tier-check.mjs"]) {
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
