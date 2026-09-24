import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, it } from "node:test";

import {
  DEFAULT_ALLOWLIST,
  compareToAllowlist,
  isEnumShapedExpression,
  markupMustaches,
  parseAllowlist,
  renderedOperands,
  sweep,
  sweepSource,
} from "./label-sweep.mjs";

const repoRoot = resolve(import.meta.dirname, "../..");

async function fixtureTree(files) {
  const root = await mkdtemp(join(tmpdir(), "label-sweep-"));
  for (const [path, text] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), text);
  }
  return root;
}

async function svelteFiles(directory) {
  const out = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) out.push(...await svelteFiles(path));
    else if (entry.name.endsWith(".svelte")) out.push(path);
  }
  return out;
}

describe("label-sweep (rfc/evidence-presentation.md §8.1)", () => {
  it("the shipped tree is set-equal to the allowlist, and the allowlist ships empty (criterion 4)", async () => {
    const allowlist = parseAllowlist(await readFile(resolve(repoRoot, DEFAULT_ALLOWLIST), "utf8"));
    assert.deepEqual(allowlist, []);
    const { findings } = await sweep();
    assert.deepEqual(compareToAllowlist(findings, allowlist), { unexpected: [], stale: [] });
  });

  it("RED: re-adding {node.objectiveState} to CompareView.svelte is named with its file and line", async () => {
    const path = "apps/web/src/lib/CompareView.svelte";
    const lines = (await readFile(resolve(repoRoot, path), "utf8")).split("\n");
    const markupStart = lines.findIndex((line) => line.startsWith("</script>")) + 2;
    lines.splice(markupStart, 0, "<p>{node.objectiveState}</p>");
    assert.deepEqual(sweepSource(path, lines.join("\n")), [`${path}:${markupStart + 1}: {node.objectiveState}`]);
  });

  it("RED: a sweep reading only one file fails — every .svelte under the root is read, nested ones too", async () => {
    const root = await fixtureTree({
      "apps/web/src/App.svelte": "<script>let x = 1;</script>\n<h2>{assignment.packId}</h2>\n",
      "apps/web/src/lib/deep/Nested.svelte": "<p>ok</p>\n<p>{draft.state}</p>\n",
      "apps/web/src/lib/model.ts": 'export const s = (v: string) => v.replaceAll("_", " ");\n',
    });
    try {
      const { files, findings } = await sweep({ root });
      assert.equal(files, 3);
      assert.deepEqual(findings.sort(), [
        "apps/web/src/App.svelte:2: {assignment.packId}",
        'apps/web/src/lib/deep/Nested.svelte:2: {draft.state}',
        'apps/web/src/lib/model.ts:1: replaceAll("_", " ")',
      ].sort());
    } finally {
      await rm(root, { recursive: true, force: true });
    }
    const shipped = await sweep();
    const svelte = (await svelteFiles(resolve(repoRoot, "apps/web/src"))).map((path) => path.slice(repoRoot.length + 1));
    assert.ok(svelte.length > 1);
    for (const path of svelte) assert.ok(shipped.paths.includes(path), `the shipped sweep skipped ${path}`);
    assert.ok(shipped.paths.includes("apps/web/src/lib/screen-model.ts"), "the shipped sweep reads .ts too");
  });

  it("flags id- and enum-shaped final segments, dotted or camelCase, through fallbacks, ternaries and template literals", () => {
    for (const expression of ["node.objectiveState", "model.state", "assignment.packId", "draft.state", "invitation.state", "entry.id", "run.opponentPolicy.mode", "item?.kind", "row.status", "leaf.reason", "branch.scope", "move.origin", "delta.sign", "disabledReason", "role",
      'consequence?.objectiveState ?? "unknown"', 'leg.status === "x" ? "not entered" : leg.state', "`This draft is ${draft.state}.`"]) {
      assert.equal(isEnumShapedExpression(expression), true, expression);
    }
    for (const expression of ["objectiveStateLabel(node.objectiveState)", "pack.title", "card.stateLabel", "idle", "kindness", 'x ? "a" : "b"', "count + 1", "LABEL_REGISTRY.objective_state[node.objectiveState].label"]) {
      assert.equal(isEnumShapedExpression(expression), false, expression);
    }
    assert.deepEqual(renderedOperands('a ? b.state : (c ?? "d")'), ["b.state", "c", '"d"']);
  });

  it("keeps line numbers across stripped script/style and multi-line tags, and ignores attribute and control mustaches", () => {
    const source = [
      "<script>",
      "  const label = `${node.state}`;",
      "</script>",
      '<div class={model.state} title="{x.id}"',
      "  data-kind={kind}>",
      "  {#if node.objectiveState}{/if}",
      "  {node.objectiveState}",
      "</div>",
      "<style>.a { color: red; }</style>",
    ].join("\n");
    assert.deepEqual(sweepSource("A.svelte", source), ["A.svelte:7: {node.objectiveState}"]);
    const texts = markupMustaches(source).filter((mustache) => mustache.context === "text");
    assert.deepEqual(texts.map((mustache) => mustache.line), [7]);
  });

  it("flags every de-underscore spelling outside apps/web/src/lib/labels/ only (criterion 9)", () => {
    const source = ['a.replaceAll("_", " ");', "b.replace(/_/g, ' ');", "c.replace(/_/gu, \" \");", 'd.split("_").join(" ");', 'e.replaceAll("-", " ");'].join("\n");
    assert.equal(sweepSource("apps/web/src/lib/screen-model.ts", source).length, 4);
    assert.deepEqual(sweepSource("apps/web/src/lib/labels/speed.ts", source), []);
  });

  it("flags JSON.stringify reaching markup, not in event handlers or data attributes (criterion 10)", () => {
    const source = '<p>{JSON.stringify(page.scan.population)}</p>\n<button onclick={() => (x = JSON.stringify(y))} data-x={JSON.stringify(z)} title={JSON.stringify(w)}>ok</button>\n';
    assert.deepEqual(sweepSource("App.svelte", source), [
      "App.svelte:1: {JSON.stringify(page.scan.population)}",
      "App.svelte:2: {JSON.stringify(w)}",
    ]);
  });

  it("is set-equality, not a count: an unexpected finding and a stale allowlist entry both fail", () => {
    assert.deepEqual(compareToAllowlist(["a:1: {x.id}"], ["b:2: {y.id}"]), { unexpected: ["a:1: {x.id}"], stale: ["b:2: {y.id}"] });
    assert.deepEqual(parseAllowlist("# comment\n\n a:1: {x.id} \n"), ["a:1: {x.id}"]);
  });
});
