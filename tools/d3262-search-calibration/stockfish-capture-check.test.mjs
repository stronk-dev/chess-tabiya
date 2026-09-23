import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const source = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-stockfish-capture.json", import.meta.url), "utf8"));
const checker = fileURLToPath(new URL("./stockfish-capture-check.mjs", import.meta.url));

function refused(edit, expected) {
  const directory = mkdtempSync(join(tmpdir(), "d3262-capture-check-"));
  try {
    const artifact = structuredClone(source);
    edit(artifact);
    const path = join(directory, "mutated.json");
    writeFileSync(path, JSON.stringify(artifact));
    const result = spawnSync(process.execPath, [checker, "--file", path], { encoding: "utf8", timeout: 10_000 });
    assert.notEqual(result.status, 0, "a corrupted capture passed the checker");
    assert.match(result.stderr, expected);
  } finally { rmSync(directory, { recursive: true, force: true }); }
}

test("rejects a captured root that no longer matches the frozen manifest", () => {
  refused((artifact) => { artifact.rows[0].rootId = "another-root"; }, /changed identity or order/u);
});

test("rejects a legal move silently removed from the denominator", () => {
  refused((artifact) => { artifact.rows[0].probes[0].legal.pop(); }, /legal denominator is incomplete/u);
});

test("rejects a PV whose first move is not its scored candidate", () => {
  refused((artifact) => { artifact.rows[0].probes[0].entries[0].pv[0] = "a1a2"; }, /disconnected PV/u);
});

test("rejects a bounded score whose bound flag is erased", () => {
  refused((artifact) => {
    const bounded = artifact.rows.flatMap((row) => row.probes[2].entries).find((entry) => entry.score.bound);
    assert.ok(bounded, "the 100-ms control must retain a bounded score");
    bounded.score.bound = null;
  }, /invalid raw score/u);
});
