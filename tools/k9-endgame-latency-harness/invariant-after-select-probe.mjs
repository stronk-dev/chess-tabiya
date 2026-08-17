// DISPOSABLE RESEARCH INSTRUMENT — Q-04 / K9 / C7 re-measurement (2026-08-17).
// Not production code.
//
// `assertRunViewport` (tests/browser/drill.spec.ts:20) now runs on all six
// served endgame packs at five desktop/tablet projections and passes at HEAD.
// This probe re-evaluates EVERY ONE OF ITS CLAUSES a second time, after the
// pack's own authored origin square has been clicked -- the state the shipped
// assertion never enters, because it never touches a piece.
//
// Clause list transcribed from the shipped assertion at HEAD:
//   1 board.x >= -1
//   2 board.y >= -1
//   3 board.x + board.width <= viewport.width + 1
//   4 board.y + board.height <= viewport.height + 1
//   5 board.width >= 192
//   6 board inside .position-column (all four edges, 1px tolerance)
//   7 .drill-region does not scroll
//   8 board bottom <= .timeline-row top (desktop only)
//
// Usage: node invariant-after-select-probe.mjs <base> <pack-json-dir> <w>x<h> [...]
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { chromium } from "/Users/stronk/repos/chess-drills/node_modules/@playwright/test/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:4180";
const packDir = process.argv[3];
const viewports = process.argv.slice(4).map((value) => {
  const [width, height] = value.split("x").map(Number);
  return { width, height };
});

const documents = new Map();
for (const entry of await readdir(packDir)) {
  if (!entry.endsWith(".json")) continue;
  const document = JSON.parse(await readFile(join(packDir, entry), "utf8"));
  documents.set(document.id, document);
}

const served = await (await fetch(`${base}/packs`)).json();
const browser = await chromium.launch();
const report = [];

const CLAUSES = (viewport) => {
  const wrapper = document.querySelector('[aria-label="Chessboard"]');
  const board = wrapper.getBoundingClientRect();
  const column = document.querySelector(".position-column").getBoundingClientRect();
  const region = document.querySelector(".drill-region");
  const timeline = document.querySelector(".timeline-row")?.getBoundingClientRect() ?? null;
  const failures = [];
  if (!(board.x >= -1)) failures.push("1 board.x");
  if (!(board.y >= -1)) failures.push("2 board.y");
  if (!(board.x + board.width <= viewport.width + 1)) failures.push("3 right edge");
  if (!(board.y + board.height <= viewport.height + 1)) failures.push("4 bottom edge");
  if (!(board.width >= 192)) failures.push("5 min width 192");
  if (!(board.x >= column.x - 1 && board.y >= column.y - 1
    && board.x + board.width <= column.x + column.width + 1
    && board.y + board.height <= column.y + column.height + 1)) failures.push("6 inside .position-column");
  if (!(region.scrollHeight <= region.clientHeight + 1)) failures.push("7 .drill-region scrolls");
  if (viewport.width > 719 && timeline !== null && !(board.y + board.height <= timeline.y + 1)) {
    failures.push("8 board below timeline top");
  }
  return {
    failures,
    board: { y: Math.round(board.y), bottom: Math.round(board.bottom), width: Math.round(board.width) },
    column: { y: Math.round(column.y), bottom: Math.round(column.bottom) },
    columnOverflowPx: Math.round(board.bottom - column.bottom),
    topOverflowPx: Math.round(column.y - board.y),
  };
};

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  {
    const page = await context.newPage();
    await page.goto(`${base}/play`);
    if (await page.getByRole("button", { name: "Create an account" }).isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Create an account" }).click();
      await page.getByLabel("Handle").fill(`k9i${Math.floor(Math.random() * 1e8)}`);
      await page.getByLabel("Password").fill("k9-probe-password");
      await page.getByRole("button", { name: "Register" }).click();
    }
    await page.getByText("Choose a position worth returning to.").waitFor();
    await page.close();
  }

  for (const pack of served) {
    const origin = documents.get(pack.id).spine[0].moveUci.slice(0, 2);
    const page = await context.newPage();
    await page.goto(`${base}/play`);
    await page.getByText("Choose a position worth returning to.").waitFor();
    await page
      .getByRole("article")
      .filter({ hasText: pack.title })
      .getByRole("button", { name: /Open position/ })
      .click();
    await page.getByLabel("Chessboard").waitFor();
    await page.waitForTimeout(500);

    const rest = await page.evaluate(CLAUSES, viewport);
    const grid = await page.evaluate(() => {
      const wrapper = document.querySelector('[aria-label="Chessboard"]');
      const box = wrapper.querySelector("cg-board").getBoundingClientRect();
      return { x: box.left, y: box.top, size: box.width, flipped: wrapper.classList.contains("orientation-black") };
    });
    const file = origin.charCodeAt(0) - 97;
    const rank = Number(origin[1]) - 1;
    const unit = grid.size / 8;
    await page.mouse.click(
      grid.x + ((grid.flipped ? 7 - file : file) + 0.5) * unit,
      grid.y + ((grid.flipped ? rank : 7 - rank) + 0.5) * unit,
    );
    await page.waitForTimeout(500);
    const selected = await page.evaluate(CLAUSES, viewport);

    const row = {
      viewport: `${viewport.width}x${viewport.height}`,
      pack: pack.id,
      restFailures: rest.failures,
      selectedFailures: selected.failures,
      restTopOverflowPx: rest.topOverflowPx,
      selectedTopOverflowPx: selected.topOverflowPx,
    };
    report.push(row);
    console.log(JSON.stringify(row));
    await page.close();
  }
  await context.close();
}

await browser.close();
console.log(`\nK9_INVARIANT_AFTER_SELECT ${JSON.stringify(report)}`);
