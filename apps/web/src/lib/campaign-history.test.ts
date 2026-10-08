// @vitest-environment happy-dom
// campaign-core §§6.3/7.1: history is resolved through the existing node operation, not a guessed URL.
import { mount, tick, unmount } from "svelte";
import { createClassComponent } from "svelte/legacy";
import { afterEach, describe, expect, it, vi } from "vitest";

import CampaignScreen from "./CampaignScreen.svelte";
import { CampaignApi, type CampaignProjection, type CampaignRunResult } from "./campaign-api.js";

const DIGEST = `sha256:${"a".repeat(64)}`;
const RUN = "campaign-history";
const NODE = "node-one";
const PLAY = "recorded game/one";
const ROUTE = `/play/run/${encodeURIComponent(PLAY)}`;

afterEach(() => document.body.replaceChildren());

function fixture(abandoned = false): CampaignProjection {
  return {
    campaignRun: { id: RUN, campaignId: "fixture", campaignVersion: 1, title: "Recorded campaign", channel: "community", documentDigest: DIGEST, status: abandoned ? "abandoned" : "completed", revision: 3, createdAt: "2026-10-08T12:00:00.000Z" },
    cursor: abandoned ? { kind: "abandoned" } : { kind: "completed" }, activeEncounter: null,
    acts: [{ id: "act1", layers: [{ layer: 1, state: "sealed", choices: [{ nodeId: NODE, kind: "pack", title: "First encounter", packId: "fixture-pack", phase: "opening", objectiveSummary: "Play the recorded continuation", boss: false, suppress: [], reward: null, opponent: null, rating: null, seal: abandoned ? null : { kind: "pack", verdict: "open", playRunId: PLAY }, selectable: false, active: false, unavailable: null }] }] }],
    charges: { balance: 2, startingIncome: 1, actIncome: 1, rewardIncome: 0, spent: 0 }, economy: { startingCharges: 1, actGrants: { act1: 1, act2: 1, act3: 0 } },
    kit: { owned: [], equipped: [], ceiling: [], shelf: [] }, prestige: { eligible: false }, awards: [],
    abandonedEncounter: abandoned ? { nodeId: NODE, playRunId: PLAY } : null,
  };
}

function review(kind: "available" | "abandoned" | "unavailable" = "available", abandoned = false) {
  const base = { runId: PLAY, nodeId: NODE, campaignDocumentDigest: DIGEST };
  return kind === "unavailable" ? { ...base, kind, reason: abandoned ? "campaign_abandoned_run_deleted" : "campaign_encounter_run_deleted" }
    : kind === "abandoned" ? { ...base, kind, reason: "campaign_encounter_abandoned", route: ROUTE }
      : { ...base, kind, route: ROUTE };
}

const buttons = (label: string) => [...document.querySelectorAll<HTMLButtonElement>("button")].filter(button => button.textContent?.trim() === label);
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
};

async function render(resolveReview: () => Promise<Response>, abandoned = false) {
  const campaign = fixture(abandoned);
  const result: CampaignRunResult = { campaign, path: abandoned ? [] : [{ nodeId: NODE, act: "act1", layer: 1, title: "First encounter", playRunId: PLAY, kind: "pack", verdict: "open" }], prestigeEligible: false, awards: [] };
  const fetcher = vi.fn(async (path: string, init?: RequestInit): Promise<Response> => {
    expect(init?.method).toBe("GET");
    if (path.endsWith("/review")) return resolveReview();
    if (path.endsWith("/result")) return Response.json(result);
    return Response.json(campaign);
  });
  const onNavigate = vi.fn();
  const component = mount(CampaignScreen, { target: document.body, props: { campaigns: new CampaignApi(fetcher), campaignRunId: RUN, onNavigate, rememberWriter: vi.fn() } });
  await vi.waitFor(() => expect(document.querySelector(".result h2")?.textContent).toMatch(/Campaign (completed|abandoned)/u));
  return { component, onNavigate, fetcher, campaign };
}

describe("campaign recorded encounter handoff", () => {
  it("gives both the sealed map and result a source-resolved action, without any write", async () => {
    const { component, onNavigate, fetcher, campaign } = await render(async () => Response.json(review()));
    const original = JSON.stringify(campaign);
    await vi.waitFor(() => expect(buttons("Open recorded encounter")).toHaveLength(2));
    buttons("Open recorded encounter")[0]!.click();
    await vi.waitFor(() => expect(onNavigate).toHaveBeenCalledWith(ROUTE));
    expect(fetcher.mock.calls.filter(([path]) => path === `/campaign-runs/${RUN}/nodes/${NODE}/review`)).toHaveLength(3);
    expect(JSON.stringify(campaign)).toBe(original);
    await unmount(component);
  });

  it("keeps seals on map/result while explaining deleted play-run history instead of opening a dead URL", async () => {
    const { component, onNavigate } = await render(async () => Response.json(review("unavailable")));
    await vi.waitFor(() => expect(document.querySelectorAll('[data-history-reason="campaign_encounter_run_deleted"]')).toHaveLength(2));
    expect(document.querySelector(".node-card .seal")?.textContent).toBe("Played to the authored boundary");
    expect(buttons("Open recorded encounter")).toHaveLength(0);
    expect(onNavigate).not.toHaveBeenCalled();
    await unmount(component);
  });

  it("retains the abandoned-unsealed attempt separately from the sealed path and awards", async () => {
    const { component, onNavigate } = await render(async () => Response.json(review("abandoned")), true);
    await vi.waitFor(() => expect(buttons("Open recorded encounter")).toHaveLength(1));
    expect(document.querySelector(".abandoned-encounter")?.textContent).toContain("No seal or encounter reward was earned for this attempt.");
    buttons("Open recorded encounter")[0]!.click();
    await vi.waitFor(() => expect(onNavigate).toHaveBeenCalledWith(ROUTE));
    await unmount(component);
    const deleted = await render(async () => Response.json(review("unavailable", true)), true);
    await vi.waitFor(() => expect(document.querySelector('[data-history-reason="campaign_abandoned_run_deleted"]')).not.toBeNull());
    expect(buttons("Open recorded encounter")).toHaveLength(0);
    await unmount(deleted.component);
  });

  it.each([
    { nodeId: "another-node" }, { runId: "another-run" }, { campaignDocumentDigest: `sha256:${"b".repeat(64)}` },
    { route: "https://example.com/" }, { route: "/play/run/another-run" }, { kind: "unknown" },
    { kind: "abandoned", reason: "campaign_encounter_abandoned" },
    { kind: "unavailable", reason: "campaign_abandoned_run_deleted", route: undefined },
  ])("refuses crossed history response %j", async changed => {
    const { component, onNavigate } = await render(async () => Response.json({ ...review(), ...changed }));
    await vi.waitFor(() => expect(document.querySelectorAll(".encounter-history [role=alert]")).toHaveLength(2));
    expect(buttons("Open recorded encounter")).toHaveLength(0);
    expect(onNavigate).not.toHaveBeenCalled();
    await unmount(component);
  });

  it("rechecks at activation so deletion after map loading cannot navigate to the old game", async () => {
    let deleted = false;
    const { component, onNavigate } = await render(async () => Response.json(review(deleted ? "unavailable" : "available")));
    await vi.waitFor(() => expect(buttons("Open recorded encounter")).toHaveLength(2));
    deleted = true;
    buttons("Open recorded encounter")[0]!.click();
    await vi.waitFor(() => expect(document.querySelector('[data-history-reason="campaign_encounter_run_deleted"]')).not.toBeNull());
    expect(onNavigate).not.toHaveBeenCalled();
    await unmount(component);
  });

  it("offers retry after a read failure without navigation, then rechecks the same encounter", async () => {
    let failed = true;
    const { component, onNavigate } = await render(async () => failed ? Response.json({ error: { code: "HTTP_ERROR", message: "failed" } }, { status: 503 }) : Response.json(review()));
    await vi.waitFor(() => expect(buttons("Try again")).toHaveLength(2));
    failed = false;
    buttons("Try again")[0]!.click();
    await vi.waitFor(() => expect(buttons("Open recorded encounter")).toHaveLength(1));
    expect(onNavigate).not.toHaveBeenCalled();
    await unmount(component);
  });

  it("holds one opening request and cannot navigate after departure", async () => {
    const late = deferred<Response>();
    let opening = false;
    const { component, onNavigate, fetcher } = await render(async () => opening ? late.promise : Response.json(review()));
    await vi.waitFor(() => expect(buttons("Open recorded encounter")).toHaveLength(2));
    opening = true;
    const button = buttons("Open recorded encounter")[0]!;
    button.click(); button.click();
    await tick();
    expect(fetcher.mock.calls.filter(([path]) => path.endsWith("/review"))).toHaveLength(3);
    await unmount(component);
    late.resolve(Response.json(review()));
    await tick();
    await Promise.resolve();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("discards a late result load after route replacement rather than displaying another campaign's history", async () => {
    const first = fixture();
    const next: CampaignProjection = { ...fixture(), campaignRun: { ...fixture().campaignRun, id: "other-campaign", title: "Next campaign", status: "active" }, cursor: { kind: "active", act: "act1", layer: 1 } };
    const late = deferred<Response>();
    const resultRequested = vi.fn();
    const campaigns = new CampaignApi(async path => {
      if (path.endsWith("/result")) { resultRequested(); return late.promise; }
      if (path.endsWith("/review")) return Response.json(review());
      return Response.json(path.endsWith(RUN) ? first : next);
    });
    // Svelte's component test adapter changes real props without adding a production harness.
    const component = createClassComponent({ component: CampaignScreen, target: document.body, props: { campaigns, campaignRunId: RUN, onNavigate: vi.fn(), rememberWriter: vi.fn() } });
    await vi.waitFor(() => expect(resultRequested).toHaveBeenCalledOnce());
    component.$set({ campaignRunId: "other-campaign" });
    await vi.waitFor(() => expect(document.querySelector("h1")?.textContent).toBe("Next campaign"));
    late.resolve(Response.json({ campaign: first, path: [], prestigeEligible: false, awards: [] }));
    await tick(); await Promise.resolve(); await tick();
    expect(document.querySelector(".result")).toBeNull();
    component.$destroy();
  });
});
