import { mkdir, writeFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

test("measures an uncached Maia reply through browser transport", async ({ page }) => {
  test.skip(process.env.MAIA_LATENCY !== "1", "requires the Compose engines profile");
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const packResponse = await fetch("/packs");
    const packs = (await packResponse.json()) as { id: string; digest: string }[];
    const packResponseDetail = await fetch(`/packs/${packs[0]!.id}`);
    const pack = await packResponseDetail.json();
    const started = performance.now();
    const response = await fetch("/select-move", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        startFen: pack.start.fen,
        historyUci: ["c1e3"],
        policy: {
          mode: pack.opponentPolicy.mode,
          policyConfigDigest: packs[0]!.digest,
          targetElo: pack.opponentPolicy.targetElo,
          temperature: pack.opponentPolicy.temperature,
          topP: pack.opponentPolicy.topP,
        },
        seed: Date.now(),
      }),
    });
    const body = await response.json();
    return {
      status: response.status,
      body,
      uncachedMaiaReplyMs: performance.now() - started,
    };
  });

  expect(result.status, JSON.stringify(result.body)).toBe(200);
  await mkdir("test-results", { recursive: true });
  await writeFile(
    "test-results/maia-browser-latency.json",
    `${JSON.stringify({ uncachedMaiaReplyMs: result.uncachedMaiaReplyMs }, null, 2)}\n`,
  );
  console.log(
    `MAIA_BROWSER_LATENCY ${JSON.stringify({ uncachedMaiaReplyMs: result.uncachedMaiaReplyMs })}`,
  );
  expect(Number.isFinite(result.uncachedMaiaReplyMs)).toBe(true);
  expect(result.uncachedMaiaReplyMs).toBeGreaterThanOrEqual(0);
});
