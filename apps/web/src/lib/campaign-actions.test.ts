// @vitest-environment happy-dom
// campaign-core §§6.0/7.1: command completion belongs to its originating view, not the next one.
import { tick } from "svelte";
import { createClassComponent } from "svelte/legacy";
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { presetDeclaration, selectNamedPreset, workflowContextPolicy, type BrowserNarrowedAssistanceV1 } from "@chess-tabiya/runtime";
import { loadWorkflowPreference, saveWorkflowPreference, workflowPreferenceKey, type PreferenceStorage } from "./assistance-preference.js";
import CampaignScreen from "./CampaignScreen.svelte";
import CampaignStrip from "./CampaignStrip.svelte";
import { CampaignApi, type CampaignCommandResult, type CampaignProjection } from "./campaign-api.js";

const RUN = "campaign-actions", NODE = "first-node", PLAY = "first-play";
const DIGEST = `sha256:${"a".repeat(64)}`;
type Action = "create" | "start" | "loadout" | "abandon";
const actions: Action[] = ["create", "start", "loadout", "abandon"];
const cleanup: (() => void)[] = [];
afterEach(() => { for (const destroy of cleanup.splice(0)) destroy(); document.body.replaceChildren(); vi.restoreAllMocks(); });

function fixture(id = RUN): CampaignProjection {
  return {
    campaignRun: { id, campaignId: "fixture", campaignVersion: 1, title: id === RUN ? "First campaign" : "Next campaign", channel: "community", documentDigest: DIGEST, status: "active", revision: 1, createdAt: "2026-10-08T12:00:00.000Z" },
    cursor: { kind: "active", act: "act1", layer: 1 }, activeEncounter: null,
    acts: [{ id: "act1", layers: [{ layer: 1, state: "current", choices: [{ nodeId: NODE, kind: "pack", title: "First encounter", packId: "fixture-pack", phase: "opening", objectiveSummary: "Play a continuation", boss: false, suppress: [], reward: null, opponent: null, rating: null, seal: null, selectable: true, active: false, unavailable: null }] }] }],
    charges: { balance: 1, startingIncome: 1, actIncome: 0, rewardIncome: 0, spent: 0 }, economy: { startingCharges: 1, actGrants: { act1: 1, act2: 1, act3: 0 } },
    kit: { owned: ["postcommit_nudge"], equipped: ["postcommit_nudge"], ceiling: ["postcommit_nudge"], shelf: [] },
    prestige: { eligible: false }, awards: [], abandonedEncounter: null,
  };
}

function response(action: Action): CampaignCommandResult {
  const campaign = fixture();
  if (action === "create") return { result: { kind: "campaign_created", campaignRunId: RUN, campaignId: "fixture", campaignVersion: 1, documentDigest: DIGEST }, campaign };
  const changed = { ...campaign, campaignRun: { ...campaign.campaignRun, revision: 2 } };
  if (action === "start") return { result: { kind: "encounter_started", campaignRevision: 2, response: { nodeId: NODE, playRunId: PLAY } }, campaign: { ...changed, activeEncounter: { nodeId: NODE, playRunId: PLAY, title: "First encounter" } } };
  if (action === "loadout") return { result: { kind: "loadout_changed", campaignRevision: 2, response: { equippedModuleIds: [] } }, campaign: { ...changed, kit: { ...changed.kit, equipped: [] } } };
  return { result: { kind: "campaign_abandoned", campaignRevision: 2, response: { activeNodeId: null, activePlayRunId: null } }, campaign: { ...changed, campaignRun: { ...changed.campaignRun, status: "abandoned" }, cursor: { kind: "abandoned" } } };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { resolve, promise };
}
const button = (text: string) => [...document.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent?.trim() === text)!;
async function settle() { await Promise.resolve(); await tick(); await Promise.resolve(); await tick(); }

async function screen(action: Action, mutation: () => Promise<Response>, resultRead?: () => Promise<Response>, projection = fixture(), assistanceStorage?: PreferenceStorage) {
  const fetcher = vi.fn(async (path: string, init?: RequestInit): Promise<Response> => {
    if (init?.method !== "GET") return mutation();
    if (path === "/campaigns") return Response.json({ campaigns: [{ id: "fixture", version: 1, title: "First campaign", channel: "community", nodeCount: 9, available: true, unavailablePacks: [], activeRunId: null, completedRuns: 0, marks: [] }] });
    if (path.endsWith("/result")) return resultRead?.() ?? Response.json({ campaign: response("abandon").campaign, path: [], prestigeEligible: false, awards: [] });
    return Response.json(path.endsWith(RUN) ? projection : fixture("next-campaign"));
  });
  const onNavigate = vi.fn(), rememberWriter = vi.fn();
  const component = createClassComponent({ component: CampaignScreen, target: document.body, props: { campaigns: new CampaignApi(fetcher), campaignRunId: action === "create" ? undefined : RUN, onNavigate, rememberWriter, assistanceStorage } });
  cleanup.push(() => component.$destroy());
  await vi.waitFor(() => expect(document.querySelector("h1")?.textContent).toBe(action === "create" ? "Campaign" : "First campaign"));
  if (action === "create") await vi.waitFor(() => expect(button("Start a run")).toBeDefined());
  if (action === "start") { button("Prepare").click(); await tick(); }
  if (action === "abandon") { button("Abandon this run…").click(); await tick(); }
  function activate() {
    if (action === "loadout") {
      const input = document.querySelector<HTMLInputElement>(".kit input")!;
      input.checked = false; input.dispatchEvent(new Event("change", { bubbles: true }));
    } else button(action === "create" ? "Start a run" : action === "start" ? "Start encounter" : "Confirm abandon").click();
  }
  return { component, fetcher, onNavigate, rememberWriter, activate };
}

describe("Campaign arrival read recovery", () => {
  async function arrival(runId?: string, fetcher: Mock<(path: string, init?: RequestInit) => Promise<Response>> = vi.fn(async () => Response.json({}))) {
    const onNavigate = vi.fn(), rememberWriter = vi.fn();
    const component = createClassComponent({ component: CampaignScreen, target: document.body,
      props: { campaigns: new CampaignApi(fetcher), campaignRunId: runId, onNavigate, rememberWriter } });
    cleanup.push(() => component.$destroy());
    return { component, fetcher, onNavigate, rememberWriter };
  }

  const catalogueResponse = () => Response.json({ campaigns: [{ id: "fixture", version: 1, title: "First campaign", channel: "community", nodeCount: 9, available: true, unavailablePacks: [], activeRunId: RUN, completedRuns: 0, marks: [] }] });
  const failedRead = () => Response.json({ error: { code: "HTTP_ERROR", message: "Temporary read failure" } }, { status: 503 });

  it("distinguishes a failed catalogue from empty and retries the read without creating a campaign", async () => {
    let failed = true;
    const fetcher = vi.fn(async () => failed ? failedRead() : catalogueResponse());
    const view = await arrival(undefined, fetcher);
    await vi.waitFor(() => expect(document.querySelector('[role="alert"]')).not.toBeNull());
    expect(document.body.textContent).not.toContain("No campaigns are installed here");
    expect(button("Retry loading campaigns")).toBeDefined();
    failed = false; button("Retry loading campaigns").click();
    await vi.waitFor(() => expect(button("Resume run")).toBeDefined());
    await vi.waitFor(() => expect(document.activeElement).toBe(document.querySelector("h1")));
    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(fetcher.mock.calls).toHaveLength(2);
    expect(view.onNavigate).not.toHaveBeenCalled();
    expect(view.rememberWriter).not.toHaveBeenCalled();
    button("Resume run").click();
    expect(view.onNavigate).toHaveBeenCalledWith(`/campaign/${RUN}`);
    expect(fetcher.mock.calls).toHaveLength(2);
  });

  it("retries the exact saved map once while loading and preserves its active encounter", async () => {
    const late = deferred<Response>();
    const fetcher = vi.fn().mockResolvedValueOnce(failedRead()).mockImplementation(() => late.promise);
    const view = await arrival(RUN, fetcher);
    await vi.waitFor(() => expect(document.querySelector('[role="alert"]')).not.toBeNull());
    const retry = button("Retry loading campaign");
    expect(retry).toBeDefined();
    retry.click(); retry.click(); await settle();
    expect(fetcher.mock.calls).toHaveLength(2);
    const map = fixture();
    late.resolve(Response.json({ ...map, activeEncounter: { nodeId: NODE, playRunId: PLAY, title: "First encounter" } }));
    await vi.waitFor(() => expect(button("Continue encounter")).toBeDefined());
    await vi.waitFor(() => expect(document.activeElement).toBe(document.querySelector("h1")));
    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(fetcher.mock.calls.map(([path, init]) => [path, init?.method])).toEqual([[`/campaign-runs/${RUN}`, "GET"], [`/campaign-runs/${RUN}`, "GET"]]);
    expect(view.onNavigate).not.toHaveBeenCalled();
    button("Continue encounter").click();
    expect(view.onNavigate).toHaveBeenCalledWith(`/play/run/${PLAY}`);
    expect(view.rememberWriter).not.toHaveBeenCalled();
  });

  it("keeps repeated read failure retryable and returns focus to its explanation", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(failedRead()).mockResolvedValueOnce(failedRead()).mockResolvedValueOnce(Response.json(fixture()));
    await arrival(RUN, fetcher);
    await vi.waitFor(() => expect(button("Retry loading campaign")).toBeDefined());
    button("Retry loading campaign").click();
    await vi.waitFor(() => expect(fetcher.mock.calls).toHaveLength(2));
    await vi.waitFor(() => expect(button("Retry loading campaign")).toBeDefined());
    await vi.waitFor(() => expect(document.activeElement).toBe(document.querySelector("h1")));
    button("Retry loading campaign").click();
    await vi.waitFor(() => expect(document.querySelector("h1")?.textContent).toBe("First campaign"));
    expect(fetcher.mock.calls).toHaveLength(3);
  });

  it("retires a retried map response after navigation to another campaign", async () => {
    const late = deferred<Response>();
    let attempts = 0;
    const fetcher = vi.fn(async (path: string) => path.endsWith("next-campaign") ? Response.json(fixture("next-campaign")) : ++attempts === 1 ? failedRead() : late.promise);
    const view = await arrival(RUN, fetcher);
    await vi.waitFor(() => expect(button("Retry loading campaign")).toBeDefined());
    button("Retry loading campaign").click(); await settle();
    view.component.$set({ campaignRunId: "next-campaign" });
    await vi.waitFor(() => expect(document.querySelector("h1")?.textContent).toBe("Next campaign"));
    late.resolve(Response.json(fixture())); await settle();
    expect(document.querySelector("h1")?.textContent).toBe("Next campaign");
    expect(view.onNavigate).not.toHaveBeenCalled();
    expect(view.rememberWriter).not.toHaveBeenCalled();
  });

  it("keeps a crossed map refusal recoverable and permits another exact read", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json(fixture("next-campaign"))).mockResolvedValueOnce(Response.json(fixture()));
    await arrival(RUN, fetcher);
    await vi.waitFor(() => expect(button("Retry loading campaign")).toBeDefined());
    expect(document.querySelector("h1")?.textContent).not.toBe("Next campaign");
    button("Retry loading campaign").click();
    await vi.waitFor(() => expect(document.querySelector("h1")?.textContent).toBe("First campaign"));
    expect(fetcher.mock.calls).toHaveLength(2);
  });

  it("renders empty only after a successful catalogue read", async () => {
    await arrival(undefined, vi.fn(async () => Response.json({ campaigns: [] })));
    await vi.waitFor(() => expect(document.body.textContent).toContain("No campaigns are installed here"));
    expect(button("Retry loading campaigns")).toBeUndefined();
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });
});

describe("Campaign action ownership", () => {
  function preferenceStore() {
    const bytes = new Map<string, string>();
    return { bytes, getItem: vi.fn((key: string) => bytes.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { bytes.set(key, value); }) };
  }
  function helpStyle() { return document.querySelector<HTMLSelectElement>('[role="dialog"] select[aria-label="Help style"]')!; }
  async function chooseHelp(preset: string) { const select = helpStyle(); select.value = preset; select.dispatchEvent(new Event("change", { bubbles: true })); await settle(); }

  it("D3741 offers Campaign kit before the ordinary help ladder without writing preferences on entry", async () => {
    const storage = preferenceStore();
    await screen("start", async () => Response.json(response("start")), undefined, fixture(), storage);
    expect(helpStyle()).not.toBeNull();
    expect(helpStyle().value).toBe("campaign_kit");
    expect([...helpStyle().options].map(option => option.value)).toEqual(["campaign_kit", "quiet", "theory_only", "guided", "analysis"]);
    expect([...helpStyle().options].map(option => option.value).sort()).toEqual([...workflowContextPolicy("campaign").allowedPresets].sort());
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("Help is confirmed when the encounter opens");
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("keeps an equipped tool visible when saved Quiet does not request it, without a Campaign mutation", async () => {
    const storage = preferenceStore();
    saveWorkflowPreference("campaign", selectNamedPreset("campaign", { kind: "unset" }, "quiet"), storage);
    const view = await screen("start", async () => Response.json(response("start")), undefined, fixture(), storage);
    expect(helpStyle()?.value).toBe("quiet");
    expect(document.querySelector<HTMLInputElement>('[role="dialog"] input')?.checked).toBe(true);
    expect(document.querySelector("#prep-tool-postcommit_nudge")?.textContent).toContain("Not requested by Quiet");
    expect(view.fetcher.mock.calls.filter(([, init]) => init?.method !== "GET")).toHaveLength(0);
  });

  it("saves only the canonical Campaign preference before Start and preserves the equipment revision", async () => {
    const storage = preferenceStore();
    const view = await screen("start", async () => Response.json(response("start")), undefined, fixture(), storage);
    await chooseHelp("theory_only");
    expect(loadWorkflowPreference("campaign", storage)).toEqual(selectNamedPreset("campaign", { kind: "unset" }, "theory_only").intent);
    expect(storage.bytes.has(workflowPreferenceKey("pack"))).toBe(false);
    expect(document.querySelector("#prep-tool-postcommit_nudge")?.textContent).toContain("Not requested by Theory only");
    expect(view.fetcher.mock.calls.filter(([, init]) => init?.method !== "GET")).toHaveLength(0);
    button("Back to map").click(); await settle(); button("Prepare").click(); await settle();
    expect(helpStyle().value).toBe("theory_only");
    view.activate(); await settle();
    const call = view.fetcher.mock.calls.find(([path]) => path.endsWith("/start"))!;
    expect(JSON.parse(call[1]!.body as string).expectedRevision).toBe(1);
    expect(view.onNavigate).toHaveBeenCalledWith(`/play/run/${PLAY}`);
  });

  it("preserves migrated Custom on entry and applies the existing named-choice transition", async () => {
    const storage = preferenceStore();
    storage.bytes.set("tabiya.assistance.v1.campaign", JSON.stringify({ version: 4, ...presetDeclaration("quiet").config }));
    const prior = loadWorkflowPreference("campaign", storage);
    expect(prior.kind).toBe("migrated_snapshot");
    await screen("start", async () => Response.json(response("start")), undefined, fixture(), storage);
    expect(helpStyle()?.value).toBe("custom");
    expect(helpStyle().selectedOptions[0]?.textContent).toBe("Custom (from Campaign kit)");
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("Choosing a style replaces Custom");
    await chooseHelp("guided");
    expect(loadWorkflowPreference("campaign", storage)).toEqual(selectNamedPreset("campaign", prior, "guided").intent);
    expect(helpStyle().value).toBe("guided");
  });

  it("explains malformed preference recovery without overwriting bytes until an explicit choice", async () => {
    const storage = preferenceStore();
    storage.bytes.set(workflowPreferenceKey("campaign"), "broken");
    await screen("start", async () => Response.json(response("start")), undefined, fixture(), storage);
    expect(document.querySelector("#prep-help-recovery")?.getAttribute("role")).toBe("status");
    expect(helpStyle()?.getAttribute("aria-describedby")).toContain("prep-help-recovery");
    expect(storage.bytes.get(workflowPreferenceKey("campaign"))).toBe("broken");
    await chooseHelp("quiet");
    expect(loadWorkflowPreference("campaign", storage).kind).toBe("explicit");
    expect(document.querySelector("#prep-help-recovery")).toBeNull();
  });

  it("restores the retained style and explains a refused preference write instead of promising it will start", async () => {
    const storage = preferenceStore();
    saveWorkflowPreference("campaign", selectNamedPreset("campaign", { kind: "unset" }, "quiet"), storage);
    const view = await screen("start", async () => Response.json(response("start")), undefined, fixture(), storage);
    storage.setItem.mockImplementation(() => { throw new Error("private storage detail"); });
    await chooseHelp("guided");
    expect(helpStyle().value).toBe("quiet");
    expect(document.querySelector('[role="dialog"] [role="alert"]')?.textContent).toContain("Could not save your help style");
    expect(document.body.textContent).not.toContain("private storage detail");
    expect(loadWorkflowPreference("campaign", storage)).toEqual(selectNamedPreset("campaign", { kind: "unset" }, "quiet").intent);
    expect(button("Start encounter").disabled).toBe(false);
    expect(view.fetcher.mock.calls.filter(([, init]) => init?.method !== "GET")).toHaveLength(0);
    storage.setItem.mockImplementation((key, value) => { storage.bytes.set(key, value); });
    await chooseHelp("guided");
    expect(helpStyle().value).toBe("guided");
    expect(document.querySelector('[role="dialog"] [role="alert"]')).toBeNull();
  });

  it("refreshes only the canonical Campaign key when another tab changes the saved choice", async () => {
    const storage = preferenceStore();
    await screen("start", async () => Response.json(response("start")), undefined, fixture(), storage);
    saveWorkflowPreference("campaign", selectNamedPreset("campaign", { kind: "unset" }, "quiet"), storage);
    window.dispatchEvent(new StorageEvent("storage", { key: workflowPreferenceKey("position") })); await settle();
    expect(helpStyle().value).toBe("campaign_kit");
    window.dispatchEvent(new StorageEvent("storage", { key: workflowPreferenceKey("campaign") })); await settle();
    expect(helpStyle().value).toBe("quiet");
    expect(document.querySelector("#prep-tool-postcommit_nudge")?.textContent).toContain("Not requested by Quiet");
    storage.bytes.delete(workflowPreferenceKey("campaign"));
    window.dispatchEvent(new StorageEvent("storage", { key: null })); await settle();
    expect(helpStyle().value).toBe("campaign_kit");
  });

  it("keeps explicit lower limits while clearing Custom module changes through the shared transition", async () => {
    const storage = preferenceStore();
    const prior = { kind: "explicit", preset: "campaign_kit", overrides: { guided: "off" }, moduleOverrides: { include: [], exclude: ["postcommit_nudge"] } } as const;
    saveWorkflowPreference("campaign", { version: 2, assistanceHead: 4, intent: prior }, storage);
    await screen("start", async () => Response.json(response("start")), undefined, fixture(), storage);
    expect(helpStyle().value).toBe("custom");
    expect(document.querySelector("#prep-tool-postcommit_nudge")?.textContent).toContain("Not requested by Custom");
    await chooseHelp("guided");
    const actual = loadWorkflowPreference("campaign", storage);
    expect(actual).toEqual(selectNamedPreset("campaign", prior, "guided").intent);
    expect(actual.kind === "explicit" && actual.overrides.guided).toBe("off");
    expect(helpStyle().value).toBe("guided");
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("individual limits");
  });

  it("retains suppression before preset narrowing and disables help changes while Start is pending", async () => {
    const storage = preferenceStore();
    saveWorkflowPreference("campaign", selectNamedPreset("campaign", { kind: "unset" }, "quiet"), storage);
    const projection = fixture(), card = projection.acts[0]!.layers[0]!.choices[0]!;
    const late = deferred<Response>();
    const view = await screen("start", () => late.promise, undefined, {
      ...projection, acts: [{ id: "act1", layers: [{ layer: 1, state: "current", choices: [{ ...card, boss: true, suppress: ["postcommit_nudge"] }] }] }],
    }, storage);
    expect(document.querySelector("#prep-tool-postcommit_nudge")?.textContent).toContain("Set aside for this encounter");
    view.activate(); await settle();
    expect(helpStyle().disabled).toBe(true);
    button("Back to map").click(); await settle();
    late.resolve(Response.json(response("start"))); await settle();
    expect(view.onNavigate).not.toHaveBeenCalled();
  });

  it("owns preparation focus and returns it to the exact map choice on Escape", async () => {
    await screen("start", async () => Response.json(response("start")));
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog!.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement).toBe(dialog!.querySelector("h2"));
    dialog!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await settle();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(button("Prepare"));
  });

  it("edits the server-owned kit inside preparation before starting with its new revision", async () => {
    const late = deferred<Response>();
    let calls = 0;
    const started = response("start");
    const view = await screen("start", () => ++calls === 1 ? late.promise : Promise.resolve(Response.json({
      ...started, result: { ...started.result, campaignRevision: 3 },
      campaign: { ...started.campaign, campaignRun: { ...started.campaign.campaignRun, revision: 3 }, kit: { ...started.campaign.kit, equipped: [] } },
    })));
    const input = document.querySelector<HTMLInputElement>('[role="dialog"] input[type="checkbox"]');
    expect(input).not.toBeNull();
    input!.checked = false; input!.dispatchEvent(new Event("change", { bubbles: true })); await tick();
    expect(button("Start encounter").disabled).toBe(true);
    expect(view.fetcher.mock.calls.filter(([, init]) => init?.method === "PUT")).toHaveLength(1);
    late.resolve(Response.json(response("loadout"))); await settle();
    expect(input!.checked).toBe(false);
    view.activate(); await tick();
    const call = view.fetcher.mock.calls.find(([path]) => path.endsWith("/start"))!;
    expect(JSON.parse(call[1]!.body as string).expectedRevision).toBe(2);
    await vi.waitFor(() => expect(view.onNavigate).toHaveBeenCalledWith(`/play/run/${PLAY}`));
  });

  it("keeps a suppressed tool owned and equipped without offering an ineffective toggle", async () => {
    const projection = fixture();
    const card = projection.acts[0]!.layers[0]!.choices[0]!;
    const view = await screen("start", async () => Response.json(response("start")), undefined, {
      ...projection, acts: [{ id: "act1", layers: [{ layer: 1, state: "current", choices: [{ ...card, boss: true, suppress: ["postcommit_nudge"] }] }] }],
    });
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    const input = dialog.querySelector<HTMLInputElement>("input")!;
    expect(input.checked).toBe(true);
    expect(input.disabled).toBe(true);
    expect(dialog.textContent).toContain("These tools stay in your kit");
    expect(dialog.textContent).toContain("Set aside for this encounter, even if equipped");
    expect(view.fetcher.mock.calls.filter(([, init]) => init?.method === "PUT")).toHaveLength(0);
    button("Back to map").click(); await settle();
    expect(document.querySelector<HTMLInputElement>(".kit input")!.checked).toBe(true);
  });

  it("shows loadout refusal inside preparation and restores the server's checkbox state", async () => {
    const view = await screen("start", async () => Response.json({ error: { code: "CAMPAIGN_LOADOUT_INVALID", message: "The kit was not changed." } }, { status: 409 }));
    const input = document.querySelector<HTMLInputElement>('[role="dialog"] input')!;
    input.checked = false; input.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"] [role="alert"]')?.textContent).toContain("The kit was not changed"));
    expect(document.querySelectorAll('[role="alert"]')).toHaveLength(1);
    expect(input.checked).toBe(true);
    expect(input.disabled).toBe(false);
    expect(view.onNavigate).not.toHaveBeenCalled();
  });

  it("allows a pending kit edit to settle on the map after preparation closes", async () => {
    const late = deferred<Response>();
    const view = await screen("start", () => late.promise);
    const input = document.querySelector<HTMLInputElement>('[role="dialog"] input')!;
    input.checked = false; input.dispatchEvent(new Event("change", { bubbles: true })); await tick();
    button("Back to map").click(); await settle();
    expect(document.activeElement).toBe(document.querySelector("h1"));
    late.resolve(Response.json(response("loadout"))); await settle();
    expect(document.querySelector<HTMLInputElement>(".kit input")!.checked).toBe(false);
    expect(view.onNavigate).not.toHaveBeenCalled();
    button("Prepare").click(); await tick();
    expect(document.querySelector<HTMLInputElement>('[role="dialog"] input')!.checked).toBe(false);
  });

  it("keeps an accepted start resumable after closing preparation, without navigating", async () => {
    const late = deferred<Response>();
    const view = await screen("start", () => late.promise);
    view.activate(); await tick();
    button("Back to map").click(); await settle();
    late.resolve(Response.json(response("start"))); await settle();
    expect(view.rememberWriter).toHaveBeenCalledWith(PLAY, expect.stringMatching(/^writer-/u));
    expect(view.onNavigate).not.toHaveBeenCalled();
    expect(button("Continue encounter")).toBeDefined();
    button("Continue encounter").click();
    expect(view.onNavigate).toHaveBeenCalledWith(`/play/run/${PLAY}`);
  });

  it.each(actions)("retires late %s completion after departure", async action => {
    const late = deferred<Response>();
    const view = await screen(action, () => late.promise);
    view.activate(); await tick();
    expect(view.fetcher.mock.calls.filter(([, init]) => init?.method !== "GET")).toHaveLength(1);
    cleanup.pop()!();
    late.resolve(Response.json(response(action))); await settle();
    expect(view.onNavigate).not.toHaveBeenCalled();
    if (action === "start") expect(view.rememberWriter).toHaveBeenCalledWith(PLAY, expect.stringMatching(/^writer-/u));
    else expect(view.rememberWriter).not.toHaveBeenCalled();
    expect(view.fetcher.mock.calls.filter(([path]) => path.endsWith("/result"))).toHaveLength(0);
  });

  it.each(actions)("keeps a replacement campaign intact after late %s completion", async action => {
    const late = deferred<Response>();
    const view = await screen(action, () => late.promise);
    view.activate(); await tick();
    view.component.$set({ campaignRunId: "next-campaign" });
    await vi.waitFor(() => expect(document.querySelector("h1")?.textContent).toBe("Next campaign"));
    late.resolve(Response.json(response(action))); await settle();
    expect(document.querySelector("h1")?.textContent).toBe("Next campaign");
    expect(document.querySelector(".result")).toBeNull();
    expect(view.onNavigate).not.toHaveBeenCalled();
    if (action === "start") expect(view.rememberWriter).toHaveBeenCalledWith(PLAY, expect.stringMatching(/^writer-/u));
    else expect(view.rememberWriter).not.toHaveBeenCalled();
  });

  it.each(actions)("does not publish an old %s error into the replacement view", async action => {
    const late = deferred<Response>();
    const view = await screen(action, () => late.promise);
    view.activate(); await tick();
    view.component.$set({ campaignRunId: "next-campaign" });
    await vi.waitFor(() => expect(document.querySelector("h1")?.textContent).toBe("Next campaign"));
    late.resolve(Response.json({ error: { code: "CAMPAIGN_REVISION_STALE", message: "Old campaign changed" } }, { status: 409 })); await settle();
    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(view.fetcher.mock.calls.filter(([path, init]) => path === "/campaign-runs/next-campaign" && init?.method === "GET")).toHaveLength(1);
    expect(document.querySelector<HTMLInputElement>(".kit input")?.disabled).toBe(false);
  });

  it.each(actions)("holds one %s command before disabled DOM state updates", async action => {
    const late = deferred<Response>();
    const view = await screen(action, () => late.promise);
    view.activate(); view.activate(); await tick();
    expect(view.fetcher.mock.calls.filter(([, init]) => init?.method !== "GET")).toHaveLength(1);
    late.resolve(Response.json(response(action))); await settle();
  });

  it("reports committed abandonment separately from a result refresh failure", async () => {
    let failed = true;
    const view = await screen("abandon", async () => Response.json(response("abandon")), async () => failed
      ? Response.json({ error: { code: "HTTP_ERROR", message: "Result failed" } }, { status: 503 })
      : Response.json({ campaign: response("abandon").campaign, path: [], prestigeEligible: false, awards: [] }));
    view.activate();
    await vi.waitFor(() => expect(document.querySelector('[role="alert"]')?.textContent).toContain("The campaign was abandoned"));
    expect(document.querySelector('[role="alert"]')?.textContent).toContain("result could not be loaded");
    expect(button("Confirm abandon")).toBeUndefined();
    expect(button("Reload result")).toBeDefined();
    failed = false; button("Reload result").click();
    await vi.waitFor(() => expect(document.querySelector(".result")?.textContent).toContain("Campaign abandoned"));
    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(view.fetcher.mock.calls.filter(([, init]) => init?.method !== "GET")).toHaveLength(1);
  });

  it("retries a lost encounter-start response with the same command, revision and writer", async () => {
    let failed = true;
    const view = await screen("start", async () => {
      if (failed) throw new TypeError("Lost response");
      return Response.json(response("start"));
    });
    view.activate(); await vi.waitFor(() => expect(document.querySelector('[role="alert"]')).not.toBeNull());
    failed = false; view.activate(); await vi.waitFor(() => expect(view.onNavigate).toHaveBeenCalledWith(`/play/run/${PLAY}`));
    const calls = view.fetcher.mock.calls.filter(([, init]) => init?.method !== "GET");
    expect(calls).toHaveLength(2);
    expect(calls[1]).toEqual(calls[0]);
    expect(view.rememberWriter).toHaveBeenCalledOnce();
  });

  it.each(actions)("refuses a crossed %s campaign response before publishing it", async action => {
    const crossed = response(action);
    const view = await screen(action, async () => Response.json({ ...crossed, campaign: { ...crossed.campaign, campaignRun: { ...crossed.campaign.campaignRun, campaignId: "other-definition" } } }));
    view.activate(); await vi.waitFor(() => expect(document.querySelector('[role="alert"]')).not.toBeNull());
    expect(view.onNavigate).not.toHaveBeenCalled();
    expect(view.rememberWriter).not.toHaveBeenCalled();
    expect(document.querySelector("h1")?.textContent).toBe(action === "create" ? "Campaign" : "First campaign");
  });
});

function encounterFixture(id = RUN): CampaignProjection {
  const base = fixture(id);
  return { ...base, activeEncounter: { nodeId: NODE, playRunId: PLAY, title: "First encounter" } };
}
function sealResponse(): CampaignCommandResult {
  const base = encounterFixture();
  return {
    result: { kind: "node_committed", campaignRevision: 2, response: { nodeId: NODE, kind: "pack", verdict: "open", reward: null, terminal: "continue" } },
    campaign: { ...base, campaignRun: { ...base.campaignRun, revision: 2 }, activeEncounter: null,
      acts: [{ id: "act1", layers: [{ layer: 1, state: "sealed", choices: [{ ...base.acts[0]!.layers[0]!.choices[0]!, selectable: false, seal: { kind: "pack", verdict: "open", playRunId: PLAY } }] }] }] },
  };
}
async function strip(submit: () => Promise<Response>, read: () => Promise<Response> = async () => Response.json(encounterFixture())) {
  const fetcher = vi.fn(async (path: string, init?: RequestInit) => path.endsWith("/review")
    ? Response.json({ kind: "available", runId: PLAY, nodeId: NODE, campaignDocumentDigest: DIGEST, route: `/play/run/${PLAY}`, reviewNodeId: "recorded-tip", reviewBranchId: "main", reviewRoute: `/review/game/${PLAY}?branch=main&node=recorded-tip` })
    : init?.method === "GET" ? read() : submit());
  const onRevision = vi.fn();
  const component = createClassComponent({ component: CampaignStrip, target: document.body, props: {
    campaigns: new CampaignApi(fetcher), origin: { campaignRunId: RUN, nodeId: NODE }, runId: PLAY, branchId: "main", runRevision: 1, onNavigate: vi.fn(), onRevision,
    assistance: undefined as BrowserNarrowedAssistanceV1 | undefined, assistanceState: "pending" as "pending" | "ready" | "unavailable",
  } });
  cleanup.push(() => component.$destroy());
  await vi.waitFor(() => expect(button("Declare done")?.disabled).toBe(false));
  return { component, fetcher, onRevision };
}

describe("Campaign in-game read recovery", () => {
  const failedRead = () => Response.json({ error: { code: "HTTP_ERROR", message: "Temporary encounter read failure" } }, { status: 503 });

  it("never presents the latest map equipment as confirmed encounter help", async () => {
    const view = await strip(async () => Response.json(sealResponse()));
    const help = () => document.querySelector('[data-testid="campaign-encounter-help"]')!.textContent!;
    expect(help()).toContain("Confirming help for this encounter");
    expect(help()).not.toContain("After-move nudge");
    expect(help()).not.toContain("Help for this encounter: legal moves only");
    view.component.$set({ assistanceState: "unavailable" }); await settle();
    expect(help()).toContain("Help could not be confirmed");
    expect(help()).toContain("retry confirming help in Support style");
    expect(help()).not.toContain("After-move nudge");
    view.component.$set({ assistanceState: "ready", assistance: undefined }); await settle();
    expect(help()).toContain("Help could not be confirmed");
  });

  it("offers an initial read-only retry and restores the same encounter's authority and focus", async () => {
    let failed = true;
    const fetcher = vi.fn(async () => failed ? failedRead() : Response.json(encounterFixture()));
    const onRevision = vi.fn(), onNavigate = vi.fn();
    const component = createClassComponent({ component: CampaignStrip, target: document.body, props: {
      campaigns: new CampaignApi(fetcher), origin: { campaignRunId: RUN, nodeId: NODE }, runId: PLAY, branchId: "main", runRevision: 1, onNavigate, onRevision,
    } });
    cleanup.push(() => component.$destroy());
    await vi.waitFor(() => expect(document.querySelector('[role="alert"]')).not.toBeNull());
    expect(onRevision).toHaveBeenLastCalledWith(null);
    expect(await component.declareDone()).toBe(false);
    const retry = button("Retry loading encounter");
    expect(retry).toBeDefined();
    retry.focus(); failed = false; retry.click();
    await vi.waitFor(() => expect(button("Declare done")?.disabled).toBe(false));
    expect(onRevision).toHaveBeenLastCalledWith({ campaignRevision: 1, active: true });
    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(document.activeElement).toBe(document.querySelector(".campaign-strip .encounter-title"));
    expect(fetcher.mock.calls).toEqual([[`/campaign-runs/${RUN}`, expect.objectContaining({ method: "GET" })], [`/campaign-runs/${RUN}`, expect.objectContaining({ method: "GET" })]]);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("revokes old authority while loading and after failure, with one explicit retry", async () => {
    let next: () => Promise<Response> = async () => Response.json(encounterFixture());
    const view = await strip(async () => Response.json(sealResponse()), () => next());
    const pending = deferred<Response>(); next = () => pending.promise;
    view.component.$set({ runRevision: 2 }); await settle();
    expect(view.onRevision).toHaveBeenLastCalledWith(null);
    expect(button("Declare done").disabled).toBe(true);
    expect(await view.component.declareDone()).toBe(false);
    pending.resolve(failedRead()); await settle();
    expect(button("Declare done").disabled).toBe(true);
    expect(view.onRevision).toHaveBeenLastCalledWith(null);
    const retryResult = deferred<Response>(); next = () => retryResult.promise;
    const retry = button("Retry loading encounter");
    retry.click(); retry.click(); await settle();
    expect(view.fetcher.mock.calls).toHaveLength(3);
    expect(button("Reloading encounter…").disabled).toBe(true);
    const restored = encounterFixture();
    retryResult.resolve(Response.json({ ...restored, campaignRun: { ...restored.campaignRun, revision: 5 } }));
    await vi.waitFor(() => expect(button("Declare done")?.disabled).toBe(false));
    expect(view.onRevision).toHaveBeenLastCalledWith({ campaignRevision: 5, active: true });
    expect(view.fetcher.mock.calls.every(([, init]) => init?.method === "GET")).toBe(true);
  });

  it("retains retry on repeated failure without stealing focus from another control", async () => {
    let failed = false;
    const view = await strip(async () => Response.json(sealResponse()), async () => failed ? failedRead() : Response.json(encounterFixture()));
    failed = true; view.component.$set({ runRevision: 2 });
    await vi.waitFor(() => expect(button("Retry loading encounter")).toBeDefined());
    button("Retry loading encounter").click(); await settle();
    await vi.waitFor(() => expect(button("Retry loading encounter")).toBeDefined());
    expect(await view.component.declareDone()).toBe(false);
    const late = deferred<Response>();
    const reader = vi.spyOn(CampaignApi.prototype, "read").mockImplementationOnce(async () => { const response = await late.promise; return await response.json(); });
    const retry = button("Retry loading encounter"); retry.focus(); retry.click();
    const map = button("Map"); map.focus(); map.blur();
    late.resolve(Response.json(encounterFixture())); await settle(); reader.mockRestore();
    expect(document.activeElement).toBe(document.body);
  });

  it("retires a retry response after replacement and rejects a crossed campaign definition", async () => {
    let fail = false;
    const view = await strip(async () => Response.json(sealResponse()), async () => fail ? failedRead() : Response.json(encounterFixture()));
    fail = true; view.component.$set({ runRevision: 2 });
    await vi.waitFor(() => expect(button("Retry loading encounter")).toBeDefined());
    const late = deferred<CampaignProjection>();
    const reader = vi.spyOn(CampaignApi.prototype, "read").mockImplementationOnce(() => late.promise);
    button("Retry loading encounter").click();
    view.component.$set({ runId: "replacement-play", origin: { campaignRunId: "replacement-campaign", nodeId: "replacement-node" } }); await settle();
    late.resolve(encounterFixture()); await settle(); reader.mockRestore();
    expect(document.querySelector(".campaign-strip")?.textContent).not.toContain("First encounter");
    expect(view.onRevision).toHaveBeenLastCalledWith(null);

    fail = false; view.component.$set({ runId: PLAY, origin: { campaignRunId: RUN, nodeId: NODE } });
    await vi.waitFor(() => expect(button("Declare done")?.disabled).toBe(false));
    const crossed = encounterFixture();
    const crossing = vi.spyOn(CampaignApi.prototype, "read").mockResolvedValueOnce({ ...crossed, campaignRun: { ...crossed.campaignRun, documentDigest: `sha256:${"b".repeat(64)}` } });
    view.component.$set({ runRevision: 3 }); await settle(); crossing.mockRestore();
    expect(view.onRevision).toHaveBeenLastCalledWith(null);
    expect(button("Declare done").disabled).toBe(true);
    expect(button("Retry loading encounter")).toBeDefined();
  });

  it("recovers a durably sealed encounter by reading without repeating a lost submit", async () => {
    let next: () => Promise<Response> = async () => Response.json(encounterFixture());
    const view = await strip(async () => { throw new TypeError("Lost submit response"); }, () => next());
    expect(await view.component.declareDone()).toBe(false);
    next = async () => failedRead(); view.component.$set({ runRevision: 2 });
    await vi.waitFor(() => expect(button("Retry loading encounter")).toBeDefined());
    next = async () => Response.json(sealResponse().campaign);
    button("Retry loading encounter").click();
    await vi.waitFor(() => expect(document.querySelector(".node-result")?.textContent).toContain("Played to the authored boundary"));
    expect(view.onRevision).toHaveBeenLastCalledWith(null);
    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(await view.component.declareDone()).toBe(true);
    expect(view.fetcher.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
  });
});

describe("Campaign earned encounter results", () => {
  function withReward(reward: CampaignProjection["acts"][number]["layers"][number]["choices"][number]["reward"], options: { equipped?: boolean; suppressed?: boolean } = {}) {
    const done = sealResponse(), card = done.campaign.acts[0]!.layers[0]!.choices[0]!;
    return { ...done, campaign: { ...done.campaign,
      charges: { ...done.campaign.charges, balance: 5, actIncome: 1, rewardIncome: reward?.kind === "resource_grant" ? reward.amount : 0 },
      kit: { ...done.campaign.kit, equipped: options.equipped === false ? [] : ["postcommit_nudge"] },
      acts: [{ id: "act1" as const, layers: [{ layer: 1 as const, state: "sealed" as const, choices: [{ ...card, reward, suppress: options.suppressed ? ["postcommit_nudge" as const] : [] }] }] }],
    } };
  }

  it("separates a resource reward from act income instead of claiming a tool unlock", async () => {
    const view = await strip(async () => Response.json(withReward({ kind: "resource_grant", resourceId: "campaign_rewind_charge", amount: 3 })));
    expect(await view.component.declareDone()).toBe(true);
    const text = document.querySelector(".node-result")!.textContent!;
    expect(text).toContain("1 earned rewind for finishing this encounter in Act I");
    expect(text).toContain("3 earned rewinds from this encounter’s reward");
    expect(text).toContain("Current campaign balance: 5 earned rewinds");
    expect(text).not.toContain("now in your campaign kit");
    expect(text).toContain("win or lose");
  });

  it.each([true, false])("shows a module unlock and its current equipment state (%s)", async equipped => {
    const view = await strip(async () => Response.json(withReward({ kind: "module_unlock", moduleId: "postcommit_nudge" }, { equipped })));
    expect(await view.component.declareDone()).toBe(true);
    const result = document.querySelector(".node-result")!;
    expect(result.textContent).toContain("Unlocked After-move nudge");
    expect(result.textContent).toContain(equipped ? "After-move nudge — equipped" : "After-move nudge — not equipped");
    expect(result.textContent).toContain("Your help style, the next encounter and available evidence still determine what appears");
    expect(result.textContent).toContain("Your recorded attempts are kept");
  });

  it("ends an encounter restriction without promising that a tool is now active", async () => {
    const view = await strip(async () => Response.json(withReward(null, { suppressed: true })));
    expect(await view.component.declareDone()).toBe(true);
    expect(document.querySelector(".node-result")!.textContent).toContain("This encounter’s restriction ended for: After-move nudge");
    expect(document.querySelector(".node-result")!.textContent).not.toContain("now active");
  });

  it("reconstructs the earned result after a reload from the recorded seal", async () => {
    const done = withReward({ kind: "resource_grant", resourceId: "campaign_rewind_charge", amount: 3 });
    const fetcher = vi.fn(async (path: string, _init?: RequestInit) => Response.json(path.endsWith("/review")
      ? { kind: "available", runId: PLAY, nodeId: NODE, campaignDocumentDigest: DIGEST, route: `/play/run/${PLAY}`, reviewNodeId: "recorded-tip", reviewBranchId: "main", reviewRoute: `/review/game/${PLAY}?branch=main&node=recorded-tip` }
      : done.campaign));
    const component = createClassComponent({ component: CampaignStrip, target: document.body, props: {
      campaigns: new CampaignApi(fetcher), origin: { campaignRunId: RUN, nodeId: NODE }, runId: PLAY, branchId: "main", runRevision: 1, onNavigate: vi.fn(), onRevision: vi.fn(),
    } });
    cleanup.push(() => component.$destroy());
    await vi.waitFor(() => expect(document.querySelector(".node-result")?.textContent).toContain("3 earned rewinds from this encounter’s reward"));
    expect(button("Continue to the map")).toBeDefined();
    expect(fetcher.mock.calls.map(([path]) => path)).toEqual([`/campaign-runs/${RUN}`, `/campaign-runs/${RUN}/nodes/${NODE}/review`]);
    expect(fetcher.mock.calls.every(([, init]) => init?.method === "GET")).toBe(true);
  });

  it("does not call a tool earned when the canonical kit does not own it", async () => {
    const done = withReward({ kind: "module_unlock", moduleId: "postcommit_nudge" });
    const view = await strip(async () => Response.json({ ...done, campaign: { ...done.campaign, kit: { ...done.campaign.kit, owned: [], equipped: [] } } }));
    expect(await view.component.declareDone()).toBe(false);
    expect(document.querySelector(".node-result")).toBeNull();
    expect(view.onRevision).not.toHaveBeenLastCalledWith(null);
  });

  it("shows zero act income and no extra reward without inventing a kit grant", async () => {
    const done = withReward(null);
    const campaign = { ...done.campaign, economy: { ...done.campaign.economy, actGrants: { act1: 0, act2: 0, act3: 0 } } };
    const view = await strip(async () => Response.json({ ...done, campaign }));
    expect(await view.component.declareDone()).toBe(true);
    const text = document.querySelector(".node-result")!.textContent!;
    expect(text).toContain("0 earned rewinds for finishing this encounter in Act I");
    expect(text).toContain("No additional encounter reward");
    expect(text).not.toContain("Unlocked");
  });

  it("keeps this seal's income distinct from a later replay map's current balance", async () => {
    const done = withReward({ kind: "resource_grant", resourceId: "campaign_rewind_charge", amount: 3 });
    const campaign = { ...done.campaign, campaignRun: { ...done.campaign.campaignRun, revision: 12 }, charges: { startingIncome: 1, actIncome: 100, rewardIncome: 4, spent: 50, balance: 55 } };
    const view = await strip(async () => Response.json({ ...done, replayed: true, campaign }));
    expect(await view.component.declareDone()).toBe(true);
    const text = document.querySelector(".node-result")!.textContent!;
    expect(text).toContain("1 earned rewind for finishing this encounter in Act I");
    expect(text).toContain("3 earned rewinds from this encounter’s reward");
    expect(text).toContain("Current campaign balance: 55 earned rewinds");
    expect(text).not.toContain("100 earned");
  });
});

describe("Campaign encounter declaration ownership", () => {
  it("cannot report successful declaration or publish a revision after departure", async () => {
    const late = deferred<Response>();
    const view = await strip(() => late.promise);
    const declaring = view.component.declareDone();
    const before = view.onRevision.mock.calls.length;
    cleanup.pop()!(); late.resolve(Response.json(sealResponse()));
    expect(await declaring).toBe(false);
    expect(view.onRevision.mock.calls).toHaveLength(before);
  });

  it("does not publish a previous branch's declaration after the subject changes", async () => {
    const late = deferred<Response>();
    const view = await strip(() => late.promise);
    const declaring = view.component.declareDone();
    view.component.$set({ branchId: "other-attempt" }); await settle();
    late.resolve(Response.json(sealResponse()));
    expect(await declaring).toBe(false);
    expect(document.querySelector(".node-result")).toBeNull();
  });

  it("holds one declaration across both shell and strip activation", async () => {
    const late = deferred<Response>();
    const view = await strip(() => late.promise);
    const first = view.component.declareDone();
    const second = view.component.declareDone();
    expect(view.fetcher.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
    late.resolve(Response.json(sealResponse()));
    expect(await first).toBe(true); expect(await second).toBe(false);
    expect(document.querySelector(".node-result")?.textContent).toContain("Played to the authored boundary");
  });

  it("keeps the entire declaration input after response loss even when a refresh advances the map", async () => {
    let failed = true, advanced = false;
    const view = await strip(async () => { if (failed) throw new TypeError("Lost response"); return Response.json(sealResponse()); }, async () => {
      const campaign = encounterFixture();
      return Response.json(advanced ? { ...campaign, campaignRun: { ...campaign.campaignRun, revision: 2 } } : campaign);
    });
    expect(await view.component.declareDone()).toBe(false);
    advanced = true; view.component.$set({ runRevision: 2 });
    await vi.waitFor(() => expect(view.onRevision).toHaveBeenLastCalledWith({ campaignRevision: 2, active: true }));
    failed = false; expect(await view.component.declareDone()).toBe(true);
    const calls = view.fetcher.mock.calls.filter(([, init]) => init?.method === "POST");
    expect(calls).toHaveLength(2); expect(calls[1]).toEqual(calls[0]);
  });

  it("retires an in-flight map refresh when the encounter leaves", async () => {
    const late = deferred<Response>(); let delay = false;
    const view = await strip(async () => Response.json(sealResponse()), async () => delay ? late.promise : Response.json(encounterFixture()));
    delay = true; view.component.$set({ runRevision: 2 }); await settle();
    const before = view.onRevision.mock.calls.length;
    cleanup.pop()!(); late.resolve(Response.json(encounterFixture())); await settle();
    expect(view.onRevision.mock.calls).toHaveLength(before);
  });

  it("does not let a refresh in flight during a declaration reattach the sealed encounter", async () => {
    const late = deferred<Response>(), submitted = deferred<Response>(); let delay = false;
    const view = await strip(() => submitted.promise, async () => delay ? late.promise : Response.json(encounterFixture()));
    const declaring = view.component.declareDone();
    delay = true; view.component.$set({ runRevision: 2 }); await settle();
    submitted.resolve(Response.json(sealResponse()));
    expect(await declaring).toBe(true);
    const before = view.onRevision.mock.calls.length;
    late.resolve(Response.json(encounterFixture())); await settle();
    expect(view.onRevision.mock.calls).toHaveLength(before);
    expect(view.onRevision).toHaveBeenLastCalledWith(null);
    expect(document.querySelector(".node-result")?.textContent).toContain("Played to the authored boundary");
  });

  it("refuses a seal for another recorded game", async () => {
    const done = sealResponse(), card = done.campaign.acts[0]!.layers[0]!.choices[0]!;
    const view = await strip(async () => Response.json({ ...done, campaign: { ...done.campaign, acts: [{ id: "act1", layers: [{ layer: 1, state: "sealed", choices: [{ ...card, seal: { kind: "pack", verdict: "open", playRunId: "another-play" } }] }] }] } }));
    expect(await view.component.declareDone()).toBe(false);
    expect(document.querySelector(".node-result")).toBeNull();
  });
});
