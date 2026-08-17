// DISPOSABLE RESEARCH INSTRUMENT — Q-04 / K9 / C7 re-measurement (2026-08-17).
// Not production code.
//
// The 2026-08-16 occlusion probe hit-tests the board AT REST. That was the right
// question when the board was unreachable at rest. After the D507 fix the board
// is 0/64 occluded at rest at every viewport, so the next question is whether it
// stays that way once the learner touches it.
//
// This probe measures the board in two states per pack per viewport:
//   REST   — page loaded, nothing selected
//   SELECT — the pack's own authored origin square clicked, piece selected
// and reports the board rect in both, the shift between them, and which squares
// are occluded in each. It uses the inner cg-board rect (the true 8x8 grid)
// rather than the [aria-label] wrapper, which carries a border and makes square
// centres ~3px low at 1440x1000.
//
// Usage: node selection-shift-probe.mjs <base> <pack-json-dir> <w>x<h> [more...]
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

const SURVEY = () => {
  const wrapper = document.querySelector('[aria-label="Chessboard"]');
  const grid = wrapper.querySelector("cg-board");
  const box = grid.getBoundingClientRect();
  const size = box.width / 8;
  const flipped = wrapper.classList.contains("orientation-black");
  const occluded = [];
  const blockers = new Set();
  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const column = flipped ? 7 - file : file;
      const row = flipped ? rank : 7 - rank;
      const x = box.left + (column + 0.5) * size;
      const y = box.top + (row + 0.5) * size;
      const top = document.elementFromPoint(x, y);
      if (!(top !== null && wrapper.contains(top))) {
        occluded.push(`${String.fromCharCode(97 + file)}${rank + 1}`);
        blockers.add(
          top === null
            ? "outside viewport"
            : `${top.tagName.toLowerCase()}${typeof top.className === "string" && top.className !== "" ? `.${top.className.split(" ")[0]}` : ""}`,
        );
      }
    }
  }
  return {
    rect: { x: Math.round(box.left), y: Math.round(box.top), size: Math.round(box.width) },
    flipped,
    occluded,
    blockers: [...blockers],
  };
};

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  {
    const page = await context.newPage();
    await page.goto(`${base}/play`);
    if (await page.getByRole("button", { name: "Create an account" }).isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Create an account" }).click();
      await page.getByLabel("Handle").fill(`k9s${Math.floor(Math.random() * 1e8)}`);
      await page.getByLabel("Password").fill("k9-probe-password");
      await page.getByRole("button", { name: "Register" }).click();
    }
    await page.getByText("Choose a position worth returning to.").waitFor();
    await page.close();
  }

  for (const pack of served) {
    const origin = documents.get(pack.id)?.spine?.[0]?.moveUci?.slice(0, 2);
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

    const rest = await page.evaluate(SURVEY);
    const size = rest.rect.size / 8;
    const file = origin.charCodeAt(0) - 97;
    const rank = Number(origin[1]) - 1;
    const column = rest.flipped ? 7 - file : file;
    const row = rest.flipped ? rank : 7 - rank;
    await page.mouse.click(rest.rect.x + (column + 0.5) * size, rest.rect.y + (row + 0.5) * size);
    await page.waitForTimeout(500);
    const select = await page.evaluate(SURVEY);
    const dests = await page.locator("cg-board square.move-dest").count();

    const row_ = {
      viewport: `${viewport.width}x${viewport.height}`,
      pack: pack.id,
      origin,
      restRect: rest.rect,
      selectRect: select.rect,
      shiftPx: select.rect.y - rest.rect.y,
      dests,
      restOccluded: rest.occluded.length,
      selectOccluded: select.occluded.length,
      selectBlockers: select.blockers,
      selectOccludedSquares: select.occluded,
    };
    report.push(row_);
    console.log(JSON.stringify(row_));
    await page.close();
  }
  await context.close();
}

await browser.close();
console.log(`\nK9_SELECTION_SHIFT ${JSON.stringify(report)}`);
