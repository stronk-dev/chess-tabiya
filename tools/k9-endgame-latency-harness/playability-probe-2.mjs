// DISPOSABLE RESEARCH INSTRUMENT — Q-04 / K9 / C7 re-measurement (2026-08-17).
// Not production code.
//
// Same question as playability-probe.mjs — can the pack's own authored first
// move be made, by drag and by click — with two corrections the re-run needed:
//
//  1. The original probe attempts drag, THEN click, in the SAME run. Before the
//     D507 fix both failed, so the ordering was invisible. After the fix the
//     drag succeeds, which leaves the click attempt trying the authored FIRST
//     move from a position that is already two plies deep — it correctly fails,
//     and reads as "click does not work". This probe gives each gesture its own
//     fresh run.
//  2. The original navigates between packs by clicking the /play nav link. A
//     sheet backdrop opened by a completed move intercepts that click and the
//     probe dies after the third pack. This one navigates with page.goto and
//     uses a fresh page per pack per gesture.
//
// Usage: node playability-probe-2.mjs <base> <w>x<h> <pack-json-dir>
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { chromium } from "/Users/stronk/repos/chess-drills/node_modules/@playwright/test/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:4180";
const [width, height] = (process.argv[3] ?? "1440x1000").split("x").map(Number);
const packDir = process.argv[4];

const documents = new Map();
for (const entry of await readdir(packDir)) {
  if (!entry.endsWith(".json")) continue;
  const document = JSON.parse(await readFile(join(packDir, entry), "utf8"));
  documents.set(document.id, document);
}

const served = await (await fetch(`${base}/packs`)).json();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width, height } });

{
  const page = await context.newPage();
  await page.goto(`${base}/play`);
  if (await page.getByRole("button", { name: "Create an account" }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Handle").fill(`k9q${Math.floor(Math.random() * 1e8)}`);
    await page.getByLabel("Password").fill("k9-probe-password");
    await page.getByRole("button", { name: "Register" }).click();
  }
  await page.getByText("Choose a position worth returning to.").waitFor();
  await page.close();
}

// Orientation matters and the original probe did not account for it:
// philidor-third-rank-hold starts with Black to move (1 of the 6 served endgame
// packs), so its board renders flipped and the original probe aimed its drag at
// the mirrored square. Before the D507 fix every attempt failed for layout
// reasons, so the error was invisible.
const squares = (box, square, flipped) => {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  const column = flipped ? 7 - file : file;
  const row = flipped ? rank : 7 - rank;
  return {
    x: box.x + ((column + 0.5) * box.width) / 8,
    y: box.y + ((row + 0.5) * box.height) / 8,
  };
};

const results = [];
for (const pack of served) {
  const document = documents.get(pack.id);
  const firstMove = document?.spine?.[0]?.moveUci;
  const row = {
    pack: pack.id,
    objectiveChars: document?.objective?.summary?.length ?? null,
    firstMove,
  };

  for (const mode of ["drag", "click"]) {
    const page = await context.newPage();
    await page.goto(`${base}/play`);
    await page.getByText("Choose a position worth returning to.").waitFor();
    await page
      .getByRole("article")
      .filter({ hasText: pack.title })
      .getByRole("button", { name: /Open position/ })
      .click();
    await page.getByLabel("Chessboard").waitFor();
    await page.waitForTimeout(400);

    const box = await page.getByLabel("Chessboard").boundingBox();
    const geometry = await page.evaluate(() => {
      const wrapper = document.querySelector('[aria-label="Chessboard"]');
      const b = wrapper.getBoundingClientRect();
      const column = document.querySelector(".position-column")?.getBoundingClientRect() ?? null;
      const timeline = document.querySelector(".timeline-row")?.getBoundingClientRect()
        ?? document.querySelector("section.timeline")?.getBoundingClientRect() ?? null;
      const region = document.querySelector(".drill-region");
      const objective = document.querySelector(".objective-copy h1");
      return {
        boardBottom: Math.round(b.bottom),
        columnBottom: column === null ? null : Math.round(column.bottom),
        timelineTop: timeline === null ? null : Math.round(timeline.top),
        overflowOfColumnPx: column === null ? null : Math.round(b.bottom - column.bottom),
        regionScrolls: region === null ? null : region.scrollHeight > region.clientHeight + 1,
        objective: objective === null ? null : {
          clientHeight: Math.round(objective.clientHeight),
          scrollHeight: Math.round(objective.scrollHeight),
          clipped: objective.scrollHeight > objective.clientHeight + 1,
        },
      };
    });

    const flipped = await page
      .getByLabel("Chessboard")
      .evaluate((element) => element.classList.contains("orientation-black"));
    const before = await page.locator(".timeline-heading span").innerText();
    const from = squares(box, firstMove.slice(0, 2), flipped);
    const to = squares(box, firstMove.slice(2, 4), flipped);
    if (mode === "drag") {
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: 8 });
      await page.mouse.up();
    } else {
      await page.mouse.click(from.x, from.y);
      await page.waitForTimeout(150);
      await page.mouse.click(to.x, to.y);
    }
    await page.waitForTimeout(1400);
    const after = await page.locator(".timeline-heading span").innerText();

    row[mode] = { before, after, moved: before !== after, flipped };
    if (mode === "drag") {
      row.board = { x: Math.round(box.x), y: Math.round(box.y), size: Math.round(box.width) };
      row.fitsViewport = box.y >= -1 && box.y + box.height <= height + 1;
      Object.assign(row, geometry);
    }
    await page.close();
  }

  results.push(row);
  console.log(JSON.stringify(row));
}

await browser.close();
console.log(`\nK9_PLAYABILITY2 ${JSON.stringify({ viewport: `${width}x${height}`, results })}`);
