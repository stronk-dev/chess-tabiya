// DISPOSABLE research instrument — platform-alignment A2 / D537-D541 / K9.
// Not production code.
import { writeFile } from "node:fs/promises";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { chromium } from "@playwright/test";
import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";

const base = process.argv[2] ?? "http://127.0.0.1:4182";
const packDir = process.argv[3];
if (packDir === undefined) throw new TypeError("usage: run.mjs <base-url> <pack-dir>");
const output = process.env.A2_OUT ?? new URL("./output.json", import.meta.url).pathname;
const commit = process.env.A2_COMMIT ?? "unstated";
const viewports = [
  { width: 1440, height: 1000 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];
const moveGestures = ["stale_click", "live_click", "live_drag", "touch_live", "resize_recovery"];

const documents = new Map();
for (const entry of await readdir(packDir)) {
  if (!entry.endsWith(".json")) continue;
  const document = JSON.parse(await readFile(join(packDir, entry), "utf8"));
  const intendedUci = document.spine?.[0]?.moveUci;
  if (typeof intendedUci !== "string") throw new TypeError(`${document.id} has no first spine move`);
  const position = Chess.fromSetup(parseFen(document.start.fen).unwrap()).unwrap();
  const move = parseUci(intendedUci);
  if (move === undefined || !position.isLegal(move)) throw new TypeError(`${document.id} has illegal first move ${intendedUci}`);
  documents.set(document.id, document);
}

const served = await (await fetch(`${base}/packs`)).json();
const browser = await chromium.launch();
const rows = [];

const gridState = () => {
  const wrapper = document.querySelector('[aria-label="Chessboard"]');
  const board = wrapper?.querySelector("cg-board");
  if (!(wrapper instanceof HTMLElement) || !(board instanceof HTMLElement)) throw new Error("board DOM missing");
  const box = board.getBoundingClientRect();
  const caption = document.querySelector(".overlay-caption");
  return {
    x: box.left,
    y: box.top,
    width: box.width,
    height: box.height,
    flipped: wrapper.classList.contains("orientation-black"),
    selectedMarkers: board.querySelectorAll("square.selected").length,
    captionHeight: caption instanceof HTMLElement ? caption.getBoundingClientRect().height : 0,
  };
};

const squarePoint = (grid, square) => {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  const column = grid.flipped ? 7 - file : file;
  const row = grid.flipped ? rank : 7 - rank;
  return {
    x: grid.x + ((column + 0.5) * grid.width) / 8,
    y: grid.y + ((row + 0.5) * grid.height) / 8,
  };
};

const pointState = ([x, y]) => {
  const wrapper = document.querySelector('[aria-label="Chessboard"]');
  const target = document.elementFromPoint(x, y);
  return {
    insideBoard: target !== null && wrapper?.contains(target) === true,
    topElement: target === null
      ? "outside"
      : `${target.tagName.toLowerCase()}${typeof target.className === "string" && target.className !== "" ? `.${target.className.split(" ")[0]}` : ""}`,
  };
};

async function register(context, prefix) {
  const page = await context.newPage();
  await page.goto(`${base}/play`);
  if (await page.getByRole("button", { name: "Create an account" }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Handle").fill(`${prefix}${Math.floor(Math.random() * 1e8)}`);
    await page.getByLabel("Password").fill("a2-interaction-probe-password");
    await page.getByRole("button", { name: "Register" }).click();
  }
  await page.getByText("Choose a position worth returning to.").waitFor();
  await page.close();
}

async function openPack(page, title) {
  await page.goto(`${base}/play`);
  await page.getByText("Choose a position worth returning to.").waitFor();
  await page.getByRole("article").filter({ hasText: title }).getByRole("button", { name: /Open position/ }).click();
  await page.getByLabel("Chessboard").waitFor();
  await page.waitForTimeout(350);
}

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, hasTouch: true });
  await register(context, `a2${viewport.width}`);
  for (const pack of served) {
    const document = documents.get(pack.id);
    if (document === undefined) throw new Error(`served pack ${pack.id} missing from ${packDir}`);
    const intendedUci = document.spine[0].moveUci;
    const origin = intendedUci.slice(0, 2);
    const destination = intendedUci.slice(2, 4);

    for (const gesture of [...moveGestures, "hover"]) {
      const page = await context.newPage();
      const submitted = [];
      const responseStatuses = [];
      page.on("request", (request) => {
        if (request.method() !== "POST" || !/\/runs\/[^/]+\/moves$/u.test(new URL(request.url()).pathname)) return;
        const data = request.postDataJSON();
        if (typeof data?.uci === "string") submitted.push(data.uci);
      });
      page.on("response", (response) => {
        if (response.request().method() === "POST" && /\/runs\/[^/]+\/moves$/u.test(new URL(response.url()).pathname)) responseStatuses.push(response.status());
      });
      await openPack(page, pack.title);
      const rest = await page.evaluate(gridState);
      const restOrigin = squarePoint(rest, origin);
      const restDestination = squarePoint(rest, destination);
      const sourceAtRest = await page.evaluate(pointState, [restOrigin.x, restOrigin.y]);
      let selected = rest;
      let target = restDestination;

      if (gesture === "hover") {
        await page.mouse.move(restOrigin.x, restOrigin.y);
        await page.waitForTimeout(350);
        selected = await page.evaluate(gridState);
      } else if (gesture === "live_drag") {
        await page.mouse.move(restOrigin.x, restOrigin.y);
        await page.mouse.down();
        await page.waitForTimeout(350);
        selected = await page.evaluate(gridState);
        target = squarePoint(selected, destination);
        await page.mouse.move(target.x, target.y, { steps: 8 });
        await page.mouse.up();
      } else if (gesture === "touch_live") {
        await page.touchscreen.tap(restOrigin.x, restOrigin.y);
        await page.waitForTimeout(350);
        selected = await page.evaluate(gridState);
        target = squarePoint(selected, destination);
        await page.touchscreen.tap(target.x, target.y);
      } else {
        await page.mouse.click(restOrigin.x, restOrigin.y);
        await page.waitForTimeout(350);
        selected = await page.evaluate(gridState);
        if (gesture === "resize_recovery") {
          await page.evaluate(() => window.dispatchEvent(new Event("resize")));
          await page.waitForTimeout(150);
        }
        target = gesture === "stale_click" ? restDestination : squarePoint(selected, destination);
        await page.mouse.click(target.x, target.y);
      }

      const hit = await page.evaluate(pointState, [target.x, target.y]);
      await page.waitForTimeout(900);
      const submittedUci = submitted[0] ?? null;
      const row = {
        viewport: `${viewport.width}x${viewport.height}`,
        pack: pack.id,
        gesture,
        intendedUci,
        intendedLegal: true,
        submittedUci,
        matches: gesture === "hover" ? submittedUci === null : submittedUci === intendedUci,
        extraPlayerRequests: Math.max(0, submitted.length - 1),
        responseStatuses,
        rest: { y: Math.round(rest.y), size: Math.round(rest.width) },
        source: { x: Math.round(restOrigin.x), y: Math.round(restOrigin.y), ...sourceAtRest },
        selected: {
          y: Math.round(selected.y),
          size: Math.round(selected.width),
          shiftPx: Math.round(selected.y - rest.y),
          selectedMarkers: selected.selectedMarkers,
          captionHeight: Math.round(selected.captionHeight),
        },
        target: { x: Math.round(target.x), y: Math.round(target.y), ...hit },
      };
      rows.push(row);
      console.log(JSON.stringify(row));
      await page.close();
    }
  }
  await context.close();
}

await browser.close();
const summary = {};
for (const row of rows) {
  const key = `${row.viewport}/${row.gesture}`;
  const value = summary[key] ?? { total: 0, matched: 0, wrong: 0, none: 0 };
  value.total += 1;
  if (row.matches) value.matched += 1;
  else if (row.submittedUci === null) value.none += 1;
  else value.wrong += 1;
  summary[key] = value;
}
const report = {
  measuredAt: new Date().toISOString(),
  commit,
  base,
  packIds: served.map((pack) => pack.id),
  viewports: viewports.map((viewport) => `${viewport.width}x${viewport.height}`),
  summary,
  rows,
};
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`A2_SUMMARY ${JSON.stringify(summary)}`);
