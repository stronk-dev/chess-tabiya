import { expect, test } from "@playwright/test";
import { inspectComposition } from "./composition-conformance.js";

test("@matrix A3 conformance rejects clipped/covered controls and nested same-axis scroll, with positive recovery", async ({ page }) => {
  // Disposable DOM negative controls for the same checker used by production matrix cells.
  // No chess payload, production component stub or evidence answer is manufactured.
  await page.setContent('<main><button>Reachable action</button></main>');
  const good = await inspectComposition(page, "negative-control-baseline");
  expect(good.controls).toBe(1);
  expect(good.issues).toEqual([]);
  await page.setContent('<main style="width:80px;overflow:hidden"><button style="margin-left:160px">Clipped action</button></main>');
  expect((await inspectComposition(page, "clipped-control")).issues.some(i => i.kind === "clipped_box")).toBe(true);
  await page.setContent('<main><button style="width:80px;overflow:hidden;white-space:nowrap">A clipped action label still fails when its button fits</button></main>');
  expect((await inspectComposition(page, "clipped-action-label")).issues.some(i => i.kind === "clipped_box")).toBe(true);
  for (const markup of ['<button style="opacity:0">Invisible active action</button>', '<section style="opacity:0"><button>Invisible ancestor action</button></section>']) {
    await page.setContent(`<main>${markup}</main>`);
    const invisible = await inspectComposition(page, "invisible-active-control");
    expect(invisible.controls).toBe(1);
    expect(invisible.issues.some(i => i.kind === "hidden_control")).toBe(true);
  }
  await page.setContent('<main><button style="position:absolute;left:20px;top:20px;width:100px;height:40px">Covered action</button><div style="position:absolute;left:20px;top:20px;width:100px;height:40px;background:black"></div></main>');
  expect((await inspectComposition(page, "covered-control")).issues.some(i => i.kind === "covered_control")).toBe(true);
  await page.setContent('<main class="companion-section" style="height:100px;overflow-y:auto"><section class="companion-queue band"><div class="seat-card" style="height:200px;overflow-y:auto"><button style="margin-top:300px">Nested action</button></div></section></main>');
  expect((await inspectComposition(page, "nested-scroller")).issues.some(i => i.kind === "nested_scroll")).toBe(true);
  await page.setContent('<main class="companion-section" style="height:100px;overflow-y:auto"><button style="margin-top:300px">Reachable scrolled action</button></main>');
  const scrolled = await inspectComposition(page, "declared-scroll-positive");
  expect(scrolled.issues).toEqual([]);
  expect(scrolled.scrollers).toHaveLength(1);
  expect(await page.locator("main").evaluate(e => e.scrollTop)).toBe(0);
  await page.setContent('<main><button>Restored action</button><section inert><button>Deliberate modal background</button></section></main>');
  const restored = await inspectComposition(page, "restored-positive");
  expect(restored.controls).toBe(1);
  expect(restored.inertControls).toBe(1);
  expect(restored.issues).toEqual([]);
  await page.setContent('<main><details><summary>Present door</summary><input aria-label="Intentionally concealed content" /></details></main>');
  const closed = await inspectComposition(page, "closed-native-details");
  expect(closed.controls).toBe(1);
  expect(closed.issues).toEqual([]);
  await page.locator("summary").click();
  const opened = await inspectComposition(page, "open-native-details");
  expect(opened.controls).toBe(2);
  expect(opened.issues).toEqual([]);
  await page.setContent('<main><button>Present action</button><span aria-hidden="true" class="visually-hidden-on-phone" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)">Intentionally hidden context</span></main>');
  expect((await inspectComposition(page, "hidden-context-projection")).issues).toEqual([]);
  await page.setContent('<main><button>Present action</button><span aria-hidden="true" class="visually-hidden-on-phone" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)"><button>Wrongly hidden action</button></span></main>');
  expect((await inspectComposition(page, "hidden-action-is-not-context")).issues.some(i => i.kind === "clipped_box")).toBe(true);
  await page.setContent('<main style="width:120px;overflow:hidden"><button class="objective-line" style="width:100px"><strong style="display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">An intentionally elided long objective with an accessible full text door</strong></button></main>');
  expect((await inspectComposition(page, "objective-summary-projection")).issues).toEqual([]);
  await page.locator("button").evaluate(e => { e.style.marginLeft = "100px"; });
  expect((await inspectComposition(page, "objective-door-still-clips")).issues.some(i => i.kind === "clipped_box")).toBe(true);
});
