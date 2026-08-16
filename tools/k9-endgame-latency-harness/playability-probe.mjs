// DISPOSABLE RESEARCH INSTRUMENT — Q-04 / K9 / C7 (2026-08-16). Not production code.
//
// Before latency can be measured on the endgame surface, the endgame surface
// has to be playable. This probe opens every served pack at a stated viewport
// and reports, per pack:
//   - the board's bounding box and whether it fits the viewport;
//   - what element is actually on top at the board's centre (hit testing);
//   - whether the authored first move can be made at all, by drag and by
//     click-click, with and without scrolling the board into view;
//   - the resulting ply count.
//
// Usage: node playability-probe.mjs <base> <width>x<height> <pack-json-dir> [screenshot-dir]
import { readdir, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

import { chromium } from "/Users/stronk/repos/chess-drills/node_modules/@playwright/test/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:4180";
const [width, height] = (process.argv[3] ?? "1440x1000").split("x").map(Number);
const packDir = process.argv[4];
const shots = process.argv[5];

const documents = new Map();
for (const entry of await readdir(packDir)) {
  if (!entry.endsWith(".json")) continue;
  const document = JSON.parse(await readFile(join(packDir, entry), "utf8"));
  documents.set(document.id, document);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(`${base}/play`);
if (await page.getByRole("button", { name: "Create an account" }).isVisible().catch(() => false)) {
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Handle").fill(`k9p${Math.floor(Math.random() * 1e8)}`);
  await page.getByLabel("Password").fill("k9-probe-password");
  await page.getByRole("button", { name: "Register" }).click();
}
await page.getByText("Choose a position worth returning to.").waitFor();

const served = await (await fetch(`${base}/packs`)).json();
const results = [];
if (shots !== undefined) await mkdir(shots, { recursive: true });

const squares = (box, square) => ({
  x: box.x + ((square.charCodeAt(0) - 97 + 0.5) * box.width) / 8,
  y: box.y + ((7 - (Number(square[1]) - 1) + 0.5) * box.height) / 8,
});

for (const pack of served) {
  const document = documents.get(pack.id);
  const firstMove = document?.spine?.[0]?.moveUci;
  await page.locator("#primary-navigation a[href='/play']").click();
  await page.getByText("Choose a position worth returning to.").waitFor();
  await page
    .getByRole("article")
    .filter({ hasText: pack.title })
    .getByRole("button", { name: /Open position/ })
    .click();
  await page.getByLabel("Chessboard").waitFor();
  await page.waitForTimeout(400);

  const box = await page.getByLabel("Chessboard").boundingBox();
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const topAtCentre = await page.evaluate(
    ([x, y]) => {
      const element = document.elementFromPoint(x, y);
      if (element === null) return "none (outside viewport)";
      return `${element.tagName.toLowerCase()}${element.className && typeof element.className === "string" ? `.${element.className.split(" ")[0]}` : ""}`;
    },
    [centre.x, centre.y],
  );
  const region = await page
    .locator(".drill-region")
    .evaluate((element) => ({ scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }))
    .catch(() => null);

  const attempt = async (mode) => {
    if (firstMove === undefined) return "no authored first move";
    const before = await page.locator(".timeline-heading span").innerText();
    const board = await page.getByLabel("Chessboard").boundingBox();
    const from = squares(board, firstMove.slice(0, 2));
    const to = squares(board, firstMove.slice(2, 4));
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
    await page.waitForTimeout(1200);
    const after = await page.locator(".timeline-heading span").innerText();
    return { before, after, moved: before !== after };
  };

  const drag = await attempt("drag");
  const click = await attempt("click");
  await page.getByLabel("Chessboard").scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(300);
  const afterScroll = await attempt("drag");
  const boxAfterScroll = await page.getByLabel("Chessboard").boundingBox();

  if (shots !== undefined) await page.screenshot({ path: join(shots, `${pack.id}-${width}x${height}.png`) });

  results.push({
    pack: pack.id,
    phase: pack.phase,
    objectiveChars: document?.objective?.statement?.length ?? document?.objective?.text?.length ?? null,
    board: { x: Math.round(box.x), y: Math.round(box.y), size: Math.round(box.width) },
    fitsViewport: box.y >= 0 && box.y + box.height <= height,
    topElementAtBoardCentre: topAtCentre,
    region,
    drag,
    click,
    afterScrollIntoView: afterScroll,
    boardAfterScroll: boxAfterScroll === null ? null : { y: Math.round(boxAfterScroll.y), size: Math.round(boxAfterScroll.width) },
  });
  console.log(JSON.stringify(results.at(-1)));
}

await browser.close();
console.log(`\nK9_PLAYABILITY ${JSON.stringify({ viewport: `${width}x${height}`, results })}`);
