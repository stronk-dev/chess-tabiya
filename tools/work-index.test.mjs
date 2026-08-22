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
      "rfc/feature.md": "Owns [[D10]].",
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

test("discovers only active RFCs and route-shaped living planning documents", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tabiya-work-index-"));
  fs.mkdirSync(path.join(root, "rfc/archive"), { recursive: true });
  fs.mkdirSync(path.join(root, "planning/lane"), { recursive: true });
  fs.writeFileSync(path.join(root, "rfc/README.md"), "## Active\n\n| RFC | Status |\n|---|---|\n| `active.md` | accepted |\n\n## Archive\n");
  fs.writeFileSync(path.join(root, "rfc/active.md"), "D1");
  fs.writeFileSync(path.join(root, "rfc/inactive.md"), "D2");
  fs.writeFileSync(path.join(root, "rfc/archive/old.md"), "D3");
  fs.writeFileSync(path.join(root, "planning/lane/plan.md"), "D4");
  fs.writeFileSync(path.join(root, "planning/lane/results.md"), "D5");
  fs.writeFileSync(path.join(root, "planning/lane/log.md"), "D6");
  assert.deepEqual(routeDocumentPaths(root), ["planning/lane/plan.md", "rfc/active.md"]);
  fs.rmSync(root, { recursive: true, force: true });
});
