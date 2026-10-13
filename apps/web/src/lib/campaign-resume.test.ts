// @vitest-environment happy-dom
// campaign-core §7.1: saved runs are not installed catalogue entries.
import { tick } from "svelte";
import { createClassComponent } from "svelte/legacy";
import { afterEach, describe, expect, it, vi } from "vitest";
import CampaignScreen from "./CampaignScreen.svelte";
import { CampaignApi, type CampaignCatalogueEntry } from "./campaign-api.js";

const ID = "saved-campaign", CAMPAIGN = "retained-definition";
const saved = () => ({ campaignRunId: ID, campaignId: CAMPAIGN, title: "My original campaign", revision: 2,
  chargeBalance: 1, activeEncounter: { nodeId: "first-node", playRunId: "saved-play", title: "Recorded encounter" } });
const entry = (available = true): CampaignCatalogueEntry => ({ id: CAMPAIGN, version: 2, title: "Replacement campaign",
  channel: "community", nodeCount: 9, available, unavailablePacks: available ? [] : ["missing-pack"],
  activeRunId: ID, completedRuns: 0, marks: [] });
const cleanups: (() => void)[] = [];
afterEach(() => { cleanups.splice(0).forEach(cleanup => cleanup()); document.body.replaceChildren(); vi.restoreAllMocks(); });
const button = (label: string) => [...document.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent?.trim() === label);
async function settle() { await Promise.resolve(); await tick(); await Promise.resolve(); await tick(); }
async function mount(fetcher: (path: string, init?: RequestInit) => Promise<Response>) {
  const navigate = vi.fn();
  const view = createClassComponent({ component: CampaignScreen, target: document.body,
    props: { campaigns: new CampaignApi(fetcher), campaignRunId: undefined as string | undefined, onNavigate: navigate, rememberWriter: vi.fn() } });
  cleanups.push(() => view.$destroy());
  await settle();
  return { view, navigate };
}
const response = (path: string, entries: readonly CampaignCatalogueEntry[] = []) =>
  Response.json(path === "/campaigns/active" ? { runs: [saved()] } : { campaigns: entries });

describe("saved Campaign home", () => {
  it.each([true, false])("offers the saved identity/title independently of replacement availability %s", async available => {
    const fetcher = vi.fn(async (path: string) => response(path, [entry(available)]));
    const { navigate } = await mount(fetcher);
    await vi.waitFor(() => expect(document.querySelector('[data-saved-campaign="saved-campaign"]')).not.toBeNull());
    const card = document.querySelector('[data-saved-campaign="saved-campaign"]')!;
    expect(card.textContent).toContain("My original campaign");
    expect(card.textContent).not.toContain("Replacement campaign");
    expect(card.textContent).toContain("Recorded encounter");
    expect(button("Resume run")?.disabled).toBe(false);
    button("Resume run")!.click();
    expect(navigate).toHaveBeenCalledWith(`/campaign/${ID}`);
    expect(fetcher.mock.calls.map(([path]) => path).sort()).toEqual(["/campaigns", "/campaigns/active"]);
    expect(document.querySelector('[data-campaign="retained-definition"]')?.textContent).toContain("Resume the saved run above");
  });

  it("keeps a removed definition's run reachable alongside an honest empty installed catalogue", async () => {
    const { navigate } = await mount(async path => response(path));
    await vi.waitFor(() => expect(button("Resume run")).toBeDefined());
    expect(document.body.textContent).toContain("No campaigns are installed here");
    expect(document.body.textContent).toContain("My original campaign");
    button("Resume run")!.click();
    expect(navigate).toHaveBeenCalledWith(`/campaign/${ID}`);
  });

  it("leaves an unavailable new campaign disabled without inventing a saved run", async () => {
    await mount(async path => Response.json(path === "/campaigns/active" ? { runs: [] } : { campaigns: [{ ...entry(false), activeRunId: null }] }));
    await vi.waitFor(() => expect(button("Start a run")).toBeDefined());
    expect(document.body.textContent).toContain("Each campaign has one active run");
    expect(button("Start a run")!.disabled).toBe(true);
    expect(button("Resume run")).toBeUndefined();
    expect(document.body.textContent).toContain("missing-pack not installed");
  });

  it("offers read-only refresh when the independent reads disagree about the active run", async () => {
    const fetcher = vi.fn(async (path: string, _init?: RequestInit) => Response.json(path === "/campaigns/active" ? { runs: [] } : { campaigns: [entry()] }));
    await mount(fetcher);
    await vi.waitFor(() => expect(button("Refresh campaigns")).toBeDefined());
    expect(button("Start a run")).toBeUndefined();
    button("Refresh campaigns")!.click();
    await vi.waitFor(() => expect(fetcher.mock.calls).toHaveLength(4));
    expect(fetcher.mock.calls.every(([, init]) => init?.method === "GET")).toBe(true);
  });

  it.each(["/campaigns", "/campaigns/active"])("refuses incomplete home reads and recovers %s without a command", async failedPath => {
    let fail = true;
    const fetcher = vi.fn(async (path: string, _init?: RequestInit) => fail && path === failedPath
      ? Response.json({ error: { code: "HTTP_ERROR", message: "Temporary read failure" } }, { status: 503 }) : response(path));
    const { navigate } = await mount(fetcher);
    await vi.waitFor(() => expect(button("Retry loading campaigns")).toBeDefined());
    expect(button("Resume run")).toBeUndefined();
    expect(document.body.textContent).not.toContain("No campaigns are installed here");
    fail = false; button("Retry loading campaigns")!.click(); button("Retry loading campaigns")?.click();
    await vi.waitFor(() => expect(button("Resume run")).toBeDefined());
    await vi.waitFor(() => expect(document.activeElement).toBe(document.querySelector("h1")));
    expect(fetcher.mock.calls).toHaveLength(4);
    expect(fetcher.mock.calls.every(([, init]) => init?.method === "GET")).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("retires delayed saved-home delivery when the route changes", async () => {
    let release!: (value: Response) => void;
    const pending = new Promise<Response>(resolve => { release = resolve; });
    const { view, navigate } = await mount(async path => path === "/campaigns/active" ? pending : Response.json({ campaigns: [] }));
    view.$set({ campaignRunId: "another-campaign" });
    await vi.waitFor(() => expect(button("Retry loading campaign")).toBeDefined());
    release(Response.json({ runs: [saved()] })); await settle();
    expect(button("Resume run")).toBeUndefined();
    expect(document.body.textContent).not.toContain("My original campaign");
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("Campaign active-summary client admission", () => {
  it("admits and isolates the declared saved summary without a mutation", async () => {
    const fetcher = vi.fn(async () => Response.json({ runs: [saved(), { ...saved(), campaignRunId: "other", campaignId: "other", activeEncounter: null }] }));
    const result = await new CampaignApi(fetcher).active();
    expect(result.runs).toHaveLength(2);
    expect(result.runs[0]).toEqual(saved());
    expect(Object.isFrozen(result.runs)).toBe(true);
    expect(Object.isFrozen(result.runs[0]?.activeEncounter)).toBe(true);
    expect(fetcher.mock.calls).toHaveLength(1);
  });

  const badRows = [
    null, [], {}, { ...saved(), campaignRunId: "" }, { ...saved(), campaignId: null },
    { ...saved(), title: " " }, { ...saved(), revision: "2" }, { ...saved(), revision: -1 },
    { ...saved(), revision: 1.5 }, { ...saved(), revision: Number.MAX_SAFE_INTEGER + 1 },
    { ...saved(), chargeBalance: null }, { ...saved(), chargeBalance: -1 },
    { ...saved(), activeEncounter: undefined }, { ...saved(), activeEncounter: [] },
    { ...saved(), activeEncounter: {} }, { ...saved(), activeEncounter: { ...saved().activeEncounter, nodeId: "" } },
    { ...saved(), activeEncounter: { ...saved().activeEncounter, playRunId: 1 } },
    { ...saved(), activeEncounter: { ...saved().activeEncounter, title: null } },
  ];
  it.each(badRows.map((value, index) => ({ value, index })))("refuses malformed saved summary $index", async ({ value }) => {
    await expect(new CampaignApi(async () => Response.json({ runs: [value] })).active()).rejects.toThrow();
  });
  it.each([{}, { runs: {} }, { runs: [saved(), saved()] }])("refuses a malformed or duplicate saved list", async payload => {
    await expect(new CampaignApi(async () => Response.json(payload)).active()).rejects.toThrow();
  });
});
