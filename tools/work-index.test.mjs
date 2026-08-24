import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildWorkIndex, parseLedgerRows, routeDocumentPaths } from "./work-index.mjs";

test("parses open and terminal ledger glyphs without treating measured rows as closed", () => {
  assert.deepEqual(parseLedgerRows([
    "| D1 🐞 | open | queue |",
    "| D2 ✅ | done | closed |",
    "| D3 📊 | measured | research |",
    "| D4 ⛔ | declined | terminal |",
  ].join("\n")), [
    { id: "D1", state: "🐞", open: true },
    { id: "D2", state: "✅", open: false },
    { id: "D3", state: "📊", open: true },
    { id: "D4", state: "⛔", open: false },
  ]);
});

test("routes an open row to a living queue or active RFC and exposes every reference", () => {
  const result = buildWorkIndex({
    ledger: "| D10 🐞 | defect | open |\n| D11 ✅ | done | closed |\n",
    documents: {
      "planning/codex-queue.md": "Take D10 after the compiler.",
      "rfc/feature.md": "- **Status:** accepted — D99\n\n## Specification\n\nOwns [[D10]].",
    },
  });
  assert.equal(result.unrouted.length, 0);
  assert.equal(result.routes[0].primary, "rfc/feature.md");
  assert.deepEqual(result.routes[0].destinations, ["rfc/feature.md", "planning/codex-queue.md"]);
});

test("reports missing routes and duplicate ledger identities", () => {
  const result = buildWorkIndex({ ledger: "| D8 💡 | idea | open |\n| D8 🐞 | duplicate | open |\n", documents: {} });
  assert.deepEqual(result.duplicateIds, ["D8"]);
  assert.deepEqual(result.unrouted, ["D8", "D8"]);
});

test("reports archive-only references without treating an immutable RFC as an owner", () => {
  const result = buildWorkIndex({
    ledger: "| D9 🐞 | stranded obligation | open |\n",
    documents: { "rfc/archive/old.md": "## Open questions\n\nD9 was deferred here.\n" },
  });
  assert.deepEqual(result.unrouted, ["D9"]);
  assert.deepEqual(result.routes[0].destinations, []);
  assert.deepEqual(result.routes[0].archivedDestinations, ["rfc/archive/old.md"]);
  assert.deepEqual(result.archiveOnly.map((route) => route.id), ["D9"]);
});

test("does not treat RFC status, changelog, or proposed ledger rows as durable routes", () => {
  const result = buildWorkIndex({
    ledger: [
      "| D20 🐞 | status-only | open |",
      "| D21 🐞 | proposed-only | open |",
      "| D22 🐞 | changelog-only | open |",
      "| D23 🐞 | specified | open |",
      "| D24 🐞 | discharged | open |",
    ].join("\n"),
    documents: {
      "rfc/feature.md": [
        "- **Status:** accepted — owns D20",
        "",
        "## Summary",
        "Summary mentions D21 but does not own it.",
        "",
        "## Specification",
        "The implementation owns D23.",
        "",
        "## Discharges",
        "D24 is discharged by this RFC.",
        "",
        "## Ledger rows (proposed — renumber at landing)",
        "- D21 future row.",
        "",
        "## Changelog",
        "A prior status mentioned D22.",
      ].join("\n"),
    },
  });
  assert.deepEqual(result.unrouted, ["D20", "D21", "D22"]);
  assert.deepEqual(result.routes.find((route) => route.id === "D23")?.destinations, ["rfc/feature.md"]);
  assert.deepEqual(result.routes.find((route) => route.id === "D24")?.destinations, ["rfc/feature.md"]);
});

test("does not treat a proposed ledger section in a planning document as a route", () => {
  const result = buildWorkIndex({
    ledger: "| D30 🐞 | proposed-only | open |\n| D31 🐞 | queued | open |\n",
    documents: {
      "planning/lane/plan.md": [
        "D31 is assigned to the implementation pass.",
        "",
        "## Proposed ledger rows — not written",
        "D30 may be allocated later.",
      ].join("\n"),
    },
  });
  assert.deepEqual(result.unrouted, ["D30"]);
  assert.deepEqual(result.routes.find((route) => route.id === "D31")?.destinations, ["planning/lane/plan.md"]);
});

test("discovers active and archived RFCs plus route-shaped living planning documents", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tabiya-work-index-"));
  fs.mkdirSync(path.join(root, "rfc/archive"), { recursive: true });
  fs.mkdirSync(path.join(root, "planning/lane"), { recursive: true });
  fs.writeFileSync(path.join(root, "rfc/README.md"), "## Active\n\n| RFC | Status |\n|---|---|\n| `active.md` | accepted |\n\n## Archive\n\n| RFC | Status |\n|---|---|\n| `archive/old.md` | implemented |\n");
  fs.writeFileSync(path.join(root, "rfc/active.md"), "D1");
  fs.writeFileSync(path.join(root, "rfc/inactive.md"), "D2");
  fs.writeFileSync(path.join(root, "rfc/archive/old.md"), "D3");
  fs.writeFileSync(path.join(root, "planning/lane/plan.md"), "D4");
  fs.writeFileSync(path.join(root, "planning/lane/results.md"), "D5");
  fs.writeFileSync(path.join(root, "planning/lane/log.md"), "D6");
  fs.writeFileSync(path.join(root, "planning/roadmap-to-done.md"), "D7");
  assert.deepEqual(routeDocumentPaths(root), ["planning/lane/plan.md", "planning/roadmap-to-done.md", "rfc/active.md", "rfc/archive/old.md"]);
  fs.rmSync(root, { recursive: true, force: true });
});
