import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { CELL_NAMES, VIEWPORTS, collectCompositionEvidence, publishCompositionEvidence } from "./play-composition-matrix.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "tabiya-composition-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "test-results/playwright"), { recursive: true });
  const attachments = CELL_NAMES.flatMap(name => {
    // Synthetic container fixtures test dimensions/joins, not screenshot content or browser behavior.
    const bytes = Buffer.alloc(45);
    Buffer.from("89504e470d0a1a0a", "hex").copy(bytes);
    bytes.writeUInt32BE(13, 8); bytes.write("IHDR", 12);
    const [width, height] = name.slice("play-composition-".length).split("-")[0].split("x").map(Number);
    bytes.writeUInt32BE(width, 16); bytes.writeUInt32BE(height, 20);
    Buffer.from("0000000049454e44ae426082", "hex").copy(bytes, 33);
    const path = `test-results/playwright/${name}.png`;
    writeFileSync(join(root, path), bytes);
    const conformance = { version: 1, cell: name, viewport: { width, height }, controls: 1, boxes: 1, keyboardProjections: 0, inertControls: 0, scrollers: [], issues: [] };
    const vocabulary = { version: 1, cell: name, viewport: { width, height }, ordinaryTextNodes: 1, inspectorTextNodes: name.endsWith("10-inspector-open") ? 1 : 0, leaks: [], inspectorExamples: [] };
    return [{ name, contentType: "image/png", path }, { name: `composition-conformance-${name}`, contentType: "application/json", body: Buffer.from(JSON.stringify(conformance)).toString("base64") }, { name: `composition-vocabulary-${name}`, contentType: "application/json", body: Buffer.from(JSON.stringify(vocabulary)).toString("base64") }];
  });
  // Playwright omits suites on leaf suites; nested suites remain recursively checked.
  const report = { errors: [], stats: { unexpected: 0 }, suites: [{ specs: [{ ok: true, tests: [{ projectName: "desktop-chromium", expectedStatus: "passed", results: [{ status: "passed", retry: 0, attachments }] }] }] }] };
  return { root, report, result: report.suites[0].specs[0].tests[0].results[0], attachments };
}

test("publishes exactly 112 distinct cells, with byte-bound PNGs surviving later browser cleanup", t => {
  const { root, report } = fixture(t);
  const receipt = publishCompositionEvidence(root, Buffer.from(JSON.stringify(report)));
  assert.equal(receipt.provenCells, 112);
  assert.deepEqual(receipt.cells.map(cell => cell.name), CELL_NAMES);
  rmSync(join(root, "test-results/playwright"), { recursive: true });
  for (const cell of receipt.cells) assert.ok(readFileSync(join(root, cell.path)).length >= 45);
  for (const cell of receipt.cells) assert.equal(JSON.parse(readFileSync(join(root, cell.conformance.path), "utf8")).cell, cell.name);
  for (const cell of receipt.cells) assert.equal(JSON.parse(readFileSync(join(root, cell.vocabulary.path), "utf8")).cell, cell.name);
  assert.deepEqual(JSON.parse(readFileSync(join(root, "test-results/composition/receipt.json"), "utf8")), receipt);
});

for (const mutation of ["missing", "duplicate", "foreign", "wrong_type", "two_authorities", "wrong_cell", "wrong_viewport", "failed_predicate", "vacuous", "negative_count", "unknown_scroller", "wrong_axis", "malformed", "different_result"]) {
  test(`refuses ${mutation} conformance paired with otherwise successful PNGs`, t => {
    const { root, report, attachments, result } = fixture(t);
    publishCompositionEvidence(root, Buffer.from(JSON.stringify(report)));
    const prior = readFileSync(join(root, "test-results/composition/receipt.json"));
    const attachment = attachments[1];
    const data = JSON.parse(Buffer.from(attachment.body, "base64"));
    if (mutation === "missing") attachments.splice(1, 1);
    if (mutation === "duplicate") attachments.push({ ...attachment });
    if (mutation === "foreign") attachment.name += "-invented";
    if (mutation === "wrong_type") attachment.contentType = "text/plain";
    if (mutation === "two_authorities") attachment.path = attachments[0].path;
    if (mutation === "wrong_cell") data.cell = CELL_NAMES[1];
    if (mutation === "wrong_viewport") data.viewport.width++;
    if (mutation === "failed_predicate") data.issues.push({ kind: "clipped_box", element: "button", detail: "clipped" });
    if (mutation === "vacuous") data.controls = 0;
    if (mutation === "negative_count") data.boxes = -1;
    if (mutation === "unknown_scroller") data.scrollers.push({ element: "invented", family: "whatever", axes: "y" });
    if (mutation === "wrong_axis") data.scrollers.push({ element: "rail", family: "rail", axes: "x" });
    attachment.body = Buffer.from(mutation === "malformed" ? "not json" : JSON.stringify(data)).toString("base64");
    if (mutation === "different_result") {
      attachments.splice(1, 1);
      report.suites[0].specs.push({ ok: true, tests: [{ projectName: "desktop-chromium", expectedStatus: "passed", results: [{ ...result, attachments: [attachment] }] }] });
    }
    assert.throws(() => publishCompositionEvidence(root, Buffer.from(JSON.stringify(report))));
    assert.ok(readFileSync(join(root, "test-results/composition/receipt.json")).equals(prior));
  });
}

for (const mutation of ["missing", "duplicate", "foreign", "wrong_type", "two_authorities", "wrong_cell", "wrong_viewport", "leak", "vacuous", "no_inspector", "negative_count", "false_inspector", "malformed", "different_result"]) {
  test(`refuses ${mutation} vocabulary paired with otherwise successful PNGs`, t => {
    const { root, report, attachments, result } = fixture(t);
    publishCompositionEvidence(root, Buffer.from(JSON.stringify(report)));
    const prior = readFileSync(join(root, "test-results/composition/receipt.json"));
    const attachment = mutation === "no_inspector" ? attachments.find(a => a.name.startsWith("composition-vocabulary-") && a.name.endsWith("10-inspector-open")) : attachments[2];
    const at = attachments.indexOf(attachment);
    const data = JSON.parse(Buffer.from(attachment.body, "base64"));
    if (mutation === "missing") attachments.splice(at, 1);
    if (mutation === "duplicate") attachments.push({ ...attachment });
    if (mutation === "foreign") attachment.name += "-invented";
    if (mutation === "wrong_type") attachment.contentType = "text/plain";
    if (mutation === "two_authorities") attachment.path = attachments[0].path;
    if (mutation === "wrong_cell") data.cell = CELL_NAMES[1];
    if (mutation === "wrong_viewport") data.viewport.width++;
    if (mutation === "leak") data.leaks.push({ kind: "uci", text: "e2e4", element: "p", inspector: false });
    if (mutation === "vacuous") data.ordinaryTextNodes = 0;
    if (mutation === "no_inspector") data.inspectorTextNodes = 0;
    if (mutation === "negative_count") data.inspectorTextNodes = -1;
    if (mutation === "false_inspector") data.inspectorExamples.push({ kind: "uci", text: "e2e4", element: "p", inspector: false });
    attachment.body = Buffer.from(mutation === "malformed" ? "not json" : JSON.stringify(data)).toString("base64");
    if (mutation === "different_result") {
      attachments.splice(at, 1);
      report.suites[0].specs.push({ ok: true, tests: [{ projectName: "desktop-chromium", expectedStatus: "passed", results: [{ ...result, attachments: [attachment] }] }] });
    }
    assert.throws(() => publishCompositionEvidence(root, Buffer.from(JSON.stringify(report))));
    assert.ok(readFileSync(join(root, "test-results/composition/receipt.json")).equals(prior));
  });
}

for (const mutation of ["missing", "duplicate", "foreign", "failed", "retry", "skipped", "wrong_project", "report_error", "wrong_size", "wrong_type", "two_authorities", "outside", "symlink", "missing_file", "not_png"]) {
  test(`refuses ${mutation} evidence instead of reusing an old receipt`, async t => {
    const { root, report, result, attachments } = fixture(t);
    publishCompositionEvidence(root, Buffer.from(JSON.stringify(report)));
    const prior = readFileSync(join(root, "test-results/composition/receipt.json"));
    if (mutation === "missing") attachments.splice(0, 1);
    if (mutation === "duplicate") attachments.push({ ...attachments[0] });
    if (mutation === "foreign") attachments[0].name += "-invented";
    if (mutation === "failed") result.status = "failed";
    if (mutation === "retry") result.retry = 1;
    if (mutation === "skipped") result.status = "skipped";
    if (mutation === "wrong_project") report.suites[0].specs[0].tests[0].projectName = "unmeasured";
    if (mutation === "report_error") report.errors.push({ message: "test crashed" });
    if (mutation === "wrong_size") { const bytes = readFileSync(join(root, attachments[0].path)); bytes.writeUInt32BE(192, 16); writeFileSync(join(root, attachments[0].path), bytes); }
    if (mutation === "wrong_type") attachments[0].contentType = "text/plain";
    if (mutation === "two_authorities") attachments[0].body = readFileSync(join(root, attachments[0].path)).toString("base64");
    if (mutation === "outside" || mutation === "symlink") {
      const outside = join(root, "foreign.png"); writeFileSync(outside, readFileSync(join(root, attachments[0].path)));
      if (mutation === "outside") attachments[0].path = outside;
      else { const { symlinkSync } = await import("node:fs"); const link = join(root, "test-results/playwright/linked.png"); symlinkSync(outside, link); attachments[0].path = link; }
    }
    if (mutation === "missing_file") rmSync(join(root, attachments[0].path));
    if (mutation === "not_png") writeFileSync(join(root, attachments[0].path), Buffer.alloc(45));
    assert.throws(() => publishCompositionEvidence(root, Buffer.from(JSON.stringify(report))));
    assert.ok(readFileSync(join(root, "test-results/composition/receipt.json")).equals(prior));
  });
}

test("empty and malformed reports cannot count an old screenshot directory", t => {
  const { root, report } = fixture(t);
  report.suites = [];
  assert.throws(() => collectCompositionEvidence(report, { root }), /MISSING_CELLS/u);
  report.suites = [{}];
  assert.throws(() => collectCompositionEvidence(report, { root }), /MALFORMED/u);
});

test("nested suites are traversed, and malformed children fail closed", t => {
  const { root, report } = fixture(t);
  const leaf = report.suites[0];
  report.suites = [{ specs: [], suites: [leaf] }];
  assert.equal(collectCompositionEvidence(report, { root }).length, 112);
  report.suites[0].suites = {};
  assert.throws(() => collectCompositionEvidence(report, { root }), /MALFORMED/u);
});

test("the accepted closed population and normal CI commands carry the retained matrix", () => {
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const rfc = readFileSync(join(root, "rfc/play-composition.md"), "utf8");
  const table = rfc.slice(rfc.indexOf("| # | state |"), rfc.indexOf("States 15–16 are"));
  assert.deepEqual([...table.matchAll(/^\| (\d+) \|/gmu)].map(match => Number(match[1])), Array.from({ length: 16 }, (_, index) => index + 1));
  const acceptanceViewports = rfc.slice(rfc.indexOf("2. **A2 —"), rfc.indexOf("3. **A3 —"));
  assert.deepEqual([...acceptanceViewports.matchAll(/\b(\d{3,4})×(\d{3,4})\b/gu)].map(match => `${match[1]}x${match[2]}`), VIEWPORTS);
  const make = readFileSync(join(root, "Makefile"), "utf8");
  assert.match(make, /test-browser-matrix: play-composition-matrix-contract\n\t\.\/node_modules\/\.bin\/playwright test --grep "@matrix"\n\tnode tools\/play-composition-matrix\.mjs/u);
  assert.match(make, /^verify-software: .*play-composition-matrix-contract$/mu);
  assert.match(readFileSync(join(root, "playwright.config.ts"), "utf8"), /\["json", \{ outputFile: "test-results\/browser-results\.json" \}\]/u);
  const workflow = readFileSync(join(root, ".github/workflows/browser.yml"), "utf8");
  assert.match(workflow, /run: make test-browser-matrix/u);
  assert.match(workflow, /if: always\(\)/u);
  assert.match(workflow, /^\s+test-results\/$/mu);
});
