// DISPOSABLE RESEARCH INSTRUMENT — Q-04 / K9 / C7 re-measurement (2026-08-17).
// Not production code.
//
// The 2026-08-16 probes asked "did ANY move happen". After the D507 fix that is
// the wrong question, because a mis-aimed click on a rook's file still produces
// a legal move -- just not the one the learner aimed at. This probe asks the
// question a learner would:
//
//   * aim every pointer event at where the square IS ON SCREEN at that instant
//     (re-measuring the grid between the two clicks, and mid-drag);
//   * record the SAN of the move that actually resulted;
//   * compare it to the pack's own authored first move.
//
// Reported per pack per viewport: intended SAN, delivered SAN, and whether they
// match. A delivered move that differs from the aimed one is a worse outcome
// than no move at all, and the earlier probes could not distinguish them.
//
// Usage: node human-aim-probe.mjs <base> <pack-json-dir> <w>x<h> [more...]
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

const GRID = () => {
  const wrapper = document.querySelector('[aria-label="Chessboard"]');
  const box = wrapper.querySelector("cg-board").getBoundingClientRect();
  return {
    x: box.left,
    y: box.top,
    size: box.width,
    flipped: wrapper.classList.contains("orientation-black"),
  };
};

const centre = (grid, square) => {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  const column = grid.flipped ? 7 - file : file;
  const row = grid.flipped ? rank : 7 - rank;
  const unit = grid.size / 8;
  return { x: grid.x + (column + 0.5) * unit, y: grid.y + (row + 0.5) * unit };
};

// The learner's own move is ply 1 -- the first timeline entry that is not the
// start node. Taking `.first()` picks up "0 Start <objective>" instead.
const firstPly = async (page) =>
  page
    .locator(".timeline li")
    .allInnerTexts()
    .then((items) => {
      const plies = items
        .map((text) => text.replace(/\s+/gu, " ").trim())
        .filter((text) => !/^0\s/u.test(text));
      return plies.length === 0 ? "(no ply entry)" : plies[0];
    })
    .catch(() => "(no timeline entry)");

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  {
    const page = await context.newPage();
    await page.goto(`${base}/play`);
    if (await page.getByRole("button", { name: "Create an account" }).isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Create an account" }).click();
      await page.getByLabel("Handle").fill(`k9h${Math.floor(Math.random() * 1e8)}`);
      await page.getByLabel("Password").fill("k9-probe-password");
      await page.getByRole("button", { name: "Register" }).click();
    }
    await page.getByText("Choose a position worth returning to.").waitFor();
    await page.close();
  }

  for (const pack of served) {
    const document = documents.get(pack.id);
    const move = document?.spine?.[0]?.moveUci;
    const intended = document?.spine?.[0]?.moveSan;
    const [origin, destination] = [move.slice(0, 2), move.slice(2, 4)];

    for (const gesture of ["drag", "click"]) {
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

      const before = await page.locator(".timeline-heading span").innerText();
      const restGrid = await page.evaluate(GRID);
      const from = centre(restGrid, origin);
      let midDragShift = 0;

      if (gesture === "drag") {
        await page.mouse.move(from.x, from.y);
        await page.mouse.down();
        await page.waitForTimeout(350);
        const dragGrid = await page.evaluate(GRID);
        midDragShift = Math.round(dragGrid.y - restGrid.y);
        const to = centre(dragGrid, destination);
        await page.mouse.move(to.x, to.y, { steps: 8 });
        await page.waitForTimeout(120);
        await page.mouse.up();
      } else {
        await page.mouse.click(from.x, from.y);
        await page.waitForTimeout(400);
        const selectGrid = await page.evaluate(GRID);
        midDragShift = Math.round(selectGrid.y - restGrid.y);
        const to = centre(selectGrid, destination);
        await page.mouse.click(to.x, to.y);
      }

      await page.waitForTimeout(1500);
      const after = await page.locator(".timeline-heading span").innerText();
      const delivered = before === after ? null : await firstPly(page);

      const row = {
        viewport: `${viewport.width}x${viewport.height}`,
        pack: pack.id,
        gesture,
        intended,
        shiftPx: midDragShift,
        moved: before !== after,
        delivered,
        matches: delivered !== null && delivered.includes(intended),
      };
      report.push(row);
      console.log(JSON.stringify(row));
      await page.close();
    }
  }
  await context.close();
}

await browser.close();
console.log(`\nK9_HUMAN_AIM ${JSON.stringify(report)}`);
