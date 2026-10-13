// Disposable research: asserts the CURRENT defect, not acceptance of its proposed repair.
// Real authenticated run creation, real legal moves, actual projector and native Profile.
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const fixtures = [
  { side: "white", number: 1, move: "e2e4", san: "e4" },
  { side: "black", number: 1, move: "e7e5", san: "e5" },
  { side: "white", number: 37, move: "e2e4", san: "e4" },
  { side: "black", number: 37, move: "e7e5", san: "e5" },
] as const;

for (const suffix of ["desktop", "@mobile touch phone"]) test(`D3670 recorded numbering reaches the missing wire and incorrect Profile label ${suffix}`, async ({ page }) => {
  const registration = await page.request.post("/auth/register", { data: { handle: `numbers_${randomUUID().slice(0, 8)}`, password: "numbering-research-password" } });
  expect(registration.status(), await registration.text()).toBe(201);
  const runs = [];
  for (const fixture of fixtures) {
    const id = `numbering-${randomUUID()}`;
    const headers = { "x-writer-id": `writer-${id}` };
    const fen = `4k3/4p3/8/8/8/8/4P3/4K3 ${fixture.side[0]} - - 0 ${fixture.number}`;
    const created = await page.request.post("/runs", { headers, data: {
      id, seed: 7, session: { kind: "position", start: { fen, side: fixture.side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    } });
    expect(created.status(), await created.text()).toBe(201);
    const moved = await page.request.post(`/runs/${id}/moves`, { headers, data: { uci: fixture.move } });
    expect(moved.ok(), await moved.text()).toBe(true);
    const { run } = await moved.json();
    const child = run.nodes.find((node: { moveUci: string | null }) => node.moveUci === fixture.move);
    expect(child).toMatchObject({ ply: 1, moveSan: fixture.san });
    const parent = run.nodes.find((node: { id: string }) => node.id === child.parentId);
    expect(parent.fen).toBe(fen);
    expect(child.fen.split(" ")[5]).toBe(String(fixture.number + (fixture.side === "black" ? 1 : 0)));
    runs.push({ ...fixture, id, nodeId: child.id });
  }
  let profile: any;
  await expect.poll(async () => {
    const response = await page.request.get("/learner-profile");
    expect(response.ok(), await response.text()).toBe(true);
    profile = (await response.json()).profile;
    return [profile.store.runs, profile.store.pending, profile.store.failed];
  }).toEqual([4, 0, 0]);
  expect(profile.population.measuredGames).toBe(0); // These are positions, not standard-start games.
  let selected: { key: string; label: string } | undefined;
  for (const row of profile.observations.rows) {
    if (row.occurred !== 4) continue;
    const response = await page.request.get(`/learner-profile/observations/${encodeURIComponent(row.key)}?limit=25`);
    expect(response.ok(), await response.text()).toBe(true);
    const refs = (await response.json()).occurred.items;
    if (!runs.every(run => refs.some((ref: { runId: string; nodeId: string }) => ref.runId === run.id && ref.nodeId === run.nodeId))) continue;
    selected = row;
    for (const ref of refs) {
      expect(ref.ply).toBe(1);
      expect(Object.hasOwn(ref, "moveNumber")).toBe(false);
      expect(Object.hasOwn(ref, "mover")).toBe(false);
    }
    break;
  }
  expect(selected, "a real source observation must include all four actual decisions").toBeDefined();
  await page.goto("/profile");
  const region = page.getByRole("region", { name: "Recorded observations" });
  await region.getByText("Show the recorded observations", { exact: true }).click();
  await region.getByRole("row").filter({ has: page.getByRole("rowheader").filter({ hasText: selected!.label }) }).getByRole("button", { name: "Show moves", exact: true }).click();
  const list = region.getByRole("list", { name: `${selected!.label}: moves`, exact: true });
  await expect(list.locator("li")).toHaveCount(4);
  await expect(list.getByText(/^Move 1\. e[45] \(ply 1\)/u)).toHaveCount(4);
  await expect(list.getByText(/^Move 37/u)).toHaveCount(0);
  await expect(list.getByText(/^Move 1…/u)).toHaveCount(0);
  const wrong = runs.filter(run => run.side === "black" || run.number !== 1);
  expect(wrong).toHaveLength(3);
  console.log("D3670_NUMBERING", JSON.stringify({ viewport: suffix, observations: selected!.key, checked: runs.length, misnumbered: wrong.length, missingWireFields: ["moveNumber", "mover"], nativeLabels: await list.locator("li > span:first-child").allTextContents() }));
});
