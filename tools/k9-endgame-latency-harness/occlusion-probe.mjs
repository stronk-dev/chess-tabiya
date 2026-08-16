// DISPOSABLE RESEARCH INSTRUMENT — Q-04 / K9 / C7 (2026-08-16). Not production code.
//
// Hit-tests all 64 squares of the board on every served pack at a stated
// viewport: for each square centre, which element is actually on top? A square
// whose top element is not the board cannot be clicked or dragged from, so a
// piece standing there cannot be moved. Reports the occluded square list, the
// occluding element, and — for the endgame packs — whether the side to move has
// pieces standing on occluded squares.
//
// Usage: node occlusion-probe.mjs <base> <w>x<h> [more viewports...]
import { chromium } from "/Users/stronk/repos/chess-drills/node_modules/@playwright/test/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:4180";
const viewports = (process.argv.length > 3 ? process.argv.slice(3) : ["1440x1000"]).map((value) => {
  const [width, height] = value.split("x").map(Number);
  return { width, height };
});

const served = await (await fetch(`${base}/packs`)).json();
const browser = await chromium.launch();
const report = [];

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${base}/play`);
  if (await page.getByRole("button", { name: "Create an account" }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Handle").fill(`k9o${Math.floor(Math.random() * 1e8)}`);
    await page.getByLabel("Password").fill("k9-probe-password");
    await page.getByRole("button", { name: "Register" }).click();
  }
  await page.getByText("Choose a position worth returning to.").waitFor();

  for (const pack of served) {
    await page.locator("#primary-navigation a[href='/play']").click();
    await page.getByText("Choose a position worth returning to.").waitFor();
    await page
      .getByRole("article")
      .filter({ hasText: pack.title })
      .getByRole("button", { name: /Open position/ })
      .click();
    await page.getByLabel("Chessboard").waitFor();
    await page.waitForTimeout(350);

    const result = await page.evaluate(() => {
      const wrapper = document.querySelector('[aria-label="Chessboard"]');
      const box = wrapper.getBoundingClientRect();
      const size = box.width / 8;
      const occluded = [];
      const blockers = new Set();
      for (let file = 0; file < 8; file += 1) {
        for (let rank = 0; rank < 8; rank += 1) {
          const x = box.left + (file + 0.5) * size;
          const y = box.top + (7 - rank + 0.5) * size;
          const top = document.elementFromPoint(x, y);
          const inside = top !== null && wrapper.contains(top);
          if (!inside) {
            occluded.push(`${String.fromCharCode(97 + file)}${rank + 1}`);
            blockers.add(
              top === null
                ? "outside viewport"
                : `${top.tagName.toLowerCase()}${typeof top.className === "string" && top.className !== "" ? `.${top.className.split(" ")[0]}` : ""}`,
            );
          }
        }
      }
      const pieces = [...document.querySelectorAll("cg-board piece")].map((piece) => {
        const style = piece.getAttribute("style") ?? "";
        const match = /translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/.exec(style);
        const file = match === null ? 0 : Math.round(Number(match[1]) / size);
        const row = match === null ? 0 : Math.round(Number(match[2]) / size);
        return { square: `${String.fromCharCode(97 + file)}${8 - row}`, kind: piece.className };
      });
      return {
        board: { x: Math.round(box.left), y: Math.round(box.top), size: Math.round(box.width) },
        viewportHeight: window.innerHeight,
        bottomOverflowPx: Math.round(box.bottom - window.innerHeight),
        occluded,
        blockers: [...blockers],
        pieces,
      };
    });
    const occludedPieces = result.pieces.filter((piece) => result.occluded.includes(piece.square));
    report.push({
      viewport: `${viewport.width}x${viewport.height}`,
      pack: pack.id,
      phase: pack.phase,
      ...result,
      occludedCount: result.occluded.length,
      occludedPieces,
    });
    console.log(
      JSON.stringify({
        viewport: `${viewport.width}x${viewport.height}`,
        pack: pack.id,
        phase: pack.phase,
        boardY: result.board.y,
        boardSize: result.board.size,
        bottomOverflowPx: result.bottomOverflowPx,
        occludedSquares: result.occluded.length,
        blockers: result.blockers,
        occludedPieces: occludedPieces.map((piece) => `${piece.kind}@${piece.square}`),
      }),
    );
  }
  await page.close();
}

await browser.close();
console.log(`\nK9_OCCLUSION ${JSON.stringify(report)}`);
