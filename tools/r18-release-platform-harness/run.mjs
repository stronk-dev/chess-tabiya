import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { chromium } from "@playwright/test";

const origin = process.argv[2] ?? "http://127.0.0.1:43180";
const output = resolve(process.argv[3] ?? "planning/platform-alignment/release-platform/browser-results.json");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const page = await context.newPage();

async function snapshot(label) {
  const client = await context.newCDPSession(page);
  const { nodes } = await client.send("Accessibility.getFullAXTree");
  await client.detach();
  const namedBoard = nodes.find((node) => node.name?.value === "Chessboard");
  const focusable = await page.locator("a,button,input,select,textarea,summary,[tabindex]").evaluateAll((elements) =>
    elements
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      })
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 100),
        ariaLabel: element.getAttribute("aria-label"),
        role: element.getAttribute("role"),
        tabIndex: element.tabIndex,
        disabled: element.matches(":disabled,[aria-disabled='true']"),
        describedBy: element.getAttribute("aria-describedby"),
      })),
  );
  return {
    label,
    title: await page.title(),
    url: page.url(),
    focusable,
    axBoard: namedBoard === undefined ? null : {
      role: namedBoard.role?.value ?? null,
      name: namedBoard.name?.value ?? null,
      ignored: namedBoard.ignored,
      childCount: namedBoard.childIds?.length ?? 0,
      properties: Object.fromEntries((namedBoard.properties ?? []).map((property) => [property.name, property.value?.value ?? null])),
    },
  };
}

await page.goto(origin, { waitUntil: "networkidle" });
const auth = await snapshot("auth");
const handle = `r18probe${Date.now().toString(36).slice(-8)}`;
const password = "r18-browser-probe-password";
const registration = await page.evaluate(async ({ handle, password }) => {
  const response = await fetch("/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ handle, password }),
  });
  return { ok: response.ok, status: response.status, body: await response.text() };
}, { handle, password });
if (!registration.ok) {
  throw new Error(`Disposable learner registration failed: HTTP ${registration.status} ${registration.body}`);
}
await page.reload({ waitUntil: "networkidle" });
await page.getByRole("button", { name: "Go to Play" }).waitFor();
await page.goto(`${origin}/play`, { waitUntil: "networkidle" });
const pack = page.locator("article").filter({ hasText: "Caro-Kann Advance: winning the c5 race" });
await pack.getByRole("button", { name: "Open position" }).click();
await page.waitForURL(/\/play\/run\//);
await page.getByLabel("Chessboard").waitFor();
await page.waitForTimeout(500);

const drill = await snapshot("drill");
const boardDom = await page.getByLabel("Chessboard").evaluate((board) => {
  const rect = board.getBoundingClientRect();
  const descendants = [...board.querySelectorAll("*")];
  return {
    tag: board.tagName.toLowerCase(),
    role: board.getAttribute("role"),
    tabIndexAttribute: board.getAttribute("tabindex"),
    tabIndexProperty: board.tabIndex,
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    descendantTags: Object.fromEntries(
      [...new Set(descendants.map((element) => element.tagName.toLowerCase()))]
        .map((tag) => [tag, descendants.filter((element) => element.tagName.toLowerCase() === tag).length]),
    ),
    focusableDescendants: descendants.filter((element) => element.matches("a,button,input,select,textarea,summary,[tabindex]")).length,
    namedDescendants: descendants.filter((element) => element.hasAttribute("aria-label") || element.hasAttribute("aria-labelledby")).length,
  };
});

await page.locator("body").click({ position: { x: 1, y: 1 } });
const tabSequence = [];
for (let index = 0; index < 40; index += 1) {
  await page.keyboard.press("Tab");
  tabSequence.push(await page.evaluate(() => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement)) return null;
    return {
      tag: element.tagName.toLowerCase(),
      text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80),
      ariaLabel: element.getAttribute("aria-label"),
      className: typeof element.className === "string" ? element.className : "",
    };
  }));
}

const disabledReasonFailures = await page.locator(":disabled,[aria-disabled='true']").evaluateAll((controls) => controls.flatMap((control) => {
  const ids = (control.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
  const valid = ids.length > 0 && ids.every((id) => (document.getElementById(id)?.textContent ?? "").trim().length > 0);
  return valid ? [] : [{ tag: control.tagName.toLowerCase(), text: (control.textContent ?? "").trim(), describedBy: ids }];
}));

const viewports = [];
for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
]) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(100);
  viewports.push(await page.evaluate((size) => {
    const board = document.querySelector("[aria-label='Chessboard']");
    const rect = board?.getBoundingClientRect();
    return {
      ...size,
      refusal: document.querySelector(".viewport-refusal")?.textContent?.trim() ?? null,
      board: rect === undefined ? null : { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom },
      documentOverflow: document.scrollingElement === null ? null : document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight,
    };
  }, viewport));
}

const pwa = await page.evaluate(async () => {
  const manifestLink = document.querySelector("link[rel='manifest']")?.getAttribute("href") ?? null;
  const registrations = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistrations() : [];
  return {
    manifestLink,
    serviceWorkerApi: "serviceWorker" in navigator,
    serviceWorkerRegistrations: registrations.length,
    prefersReducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    activeAnimations: document.getAnimations().length,
  };
});

const result = {
  schema: "tabiya.r18.browser-probe.v1",
  measuredAt: new Date().toISOString(),
  origin,
  browserVersion: browser.version(),
  auth,
  drill,
  boardDom,
  tabSequence,
  disabledReasonFailures,
  viewports,
  pwa,
  limitation: "Mechanical browser/AX-tree evidence only; no screen-reader user participated.",
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify({ output, boardDom, axBoard: drill.axBoard, disabledReasonFailures, viewports, pwa }, null, 2));
