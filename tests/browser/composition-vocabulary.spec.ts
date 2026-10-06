import { expect, test } from "@playwright/test";
import { inspectCompositionVocabulary } from "./composition-vocabulary.js";

test("@matrix A4 vocabulary separates real Inspector text from ordinary and accessible text", async ({ page }) => {
  const forbidden = "e2e4 +0.54 M+3 Tabiya’s phase bands detector recorded mass evidence recorded.";
  await page.setContent(`<main><p>Ne5 attacks the bishop; White has two rooks.</p><section class="inspector-surface" role="dialog" aria-modal="true"><p>${forbidden}</p></section></main>`);
  const positive = await inspectCompositionVocabulary(page);
  expect(positive.ordinaryTextNodes).toBe(1);
  expect(positive.inspectorTextNodes).toBe(1);
  expect(positive.leaks).toEqual([]);
  expect(positive.inspectorExamples.map(f => f.kind)).toEqual(["uci", "evaluation", "producer"]);
  await page.locator("main").evaluate((e, text) => { const p = document.createElement("p"); p.textContent = text; e.append(p); }, forbidden);
  expect((await inspectCompositionVocabulary(page)).leaks.map(f => f.kind)).toEqual(["uci", "evaluation", "producer"]);

  await page.setContent(`<main><p data-evidence-consumer="inspector.fake">${forbidden}</p></main>`);
  expect((await inspectCompositionVocabulary(page)).leaks).toHaveLength(3);
  await page.setContent('<main><p>e2<b>e4</b> +<b>0.54</b> phase <strong>bands</strong></p></main>');
  expect((await inspectCompositionVocabulary(page)).leaks.map(f => f.kind)).toEqual(["uci", "evaluation", "producer"]);
  await page.setContent(`<main><p style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)">${forbidden}</p></main>`);
  expect((await inspectCompositionVocabulary(page)).leaks).toHaveLength(3);
  await page.setContent(`<main><details><summary>Show details</summary><p>${forbidden}</p></details><p hidden>${forbidden}</p><p style="display:none">${forbidden}</p></main>`);
  expect((await inspectCompositionVocabulary(page)).leaks).toEqual([]);
  await page.locator("summary").click();
  expect((await inspectCompositionVocabulary(page)).leaks).toHaveLength(3);
  await page.setContent(`<main><section class="comparison-inspector" role="dialog" aria-modal="true"><p>${forbidden}</p></section></main>`);
  expect((await inspectCompositionVocabulary(page)).inspectorExamples).toHaveLength(3);
  await page.setContent('<main><p>Ne5 centralizes the knight.</p><p>White has two bishops.</p></main>');
  expect((await inspectCompositionVocabulary(page)).leaks).toEqual([]);
});
