// @vitest-environment happy-dom

import { flushSync, mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DrillClientApi, RunPage, RunSummary } from "./api.js";
import TheoryEntryScreen from "./TheoryEntryScreen.svelte";

const entry = (id = "entry") => ({ pack: { id, title: `Pack ${id}`, phase: "endgame", objectiveSummary: "Fixture objective." }, disclosure: { channel: "community", reviewStatus: "draft" }, shapes: [], principles: [], concepts: [] });
const run = (id: string, packId: string | null = null, viewerRole = "host") => ({ id, packId, viewerRole } as RunSummary);
const page = (runs: readonly RunSummary[], offset = 0, total = offset + runs.length): RunPage => ({ runs, selection: { shown: offset + runs.length, total } });
const emptyDue = { schedules: [], waiting: 0, intakeLimit: 10 };
const firstPage = () => page(Array.from({ length: 50 }, (_, i) => run(`other-${i}`)), 0, 52);
const button = (name: string) => [...document.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent?.trim() === name);
const components: ReturnType<typeof mount>[] = [];
afterEach(async () => { for (const component of components.splice(0)) await unmount(component); document.body.replaceChildren(); });

function show(overrides: Partial<DrillClientApi> = {}) {
  const api = { packEntry: async (id: string) => entry(id), dueProgress: async () => emptyDue, runPage: async () => page([]), ...overrides } as DrillClientApi;
  const onNavigate = vi.fn();
  const component = mount(TheoryEntryScreen, { target: document.body, props: { api, route: { name: "pack", packId: "entry" }, onNavigate, onRehearse: vi.fn() } });
  components.push(component);
  return { api, component, onNavigate };
}

describe("D3686 Library return history and recovery", () => {
  it("finds the latest owned rehearsal beyond the first page without claiming a false empty history", async () => {
    const runPage = vi.fn(async (_limit: number, offset: number) => offset === 0 ? firstPage() : page([run("shared", "entry", "spectator"), run("older-owned", "entry")], 50));
    const { onNavigate } = show({ runPage });
    await vi.waitFor(() => expect(button("Check earlier rehearsals")).toBeDefined());
    expect(document.body.textContent).not.toContain("You have not rehearsed this pack yet");
    expect(runPage).toHaveBeenCalledTimes(1);
    button("Check earlier rehearsals")!.click();
    await vi.waitFor(() => expect(button("Open your latest rehearsal of this pack")).toBeDefined());
    button("Open your latest rehearsal of this pack")!.click();
    expect(onNavigate).toHaveBeenCalledWith("/play/run/older-owned");
    expect(runPage.mock.calls).toEqual([[50, 0], [50, 50]]);
  });

  it("does not turn a due-only intake into a claim that no future return is scheduled", async () => {
    show({ dueProgress: async () => ({ ...emptyDue, waiting: 3 }), runPage: async () => page([run("owned", "entry")]) });
    await vi.waitFor(() => expect(button("Open your latest rehearsal of this pack")).toBeDefined());
    expect(document.body.textContent).not.toContain("No return is scheduled for this pack");
    expect(document.body.textContent).toContain("current due queue");
    expect(document.querySelector<HTMLAnchorElement>('a[href="/learn"]')).not.toBeNull();
  });

  it("retries unavailable reads once and retains the native retry control while pending", async () => {
    let settle!: (value: RunPage) => void;
    const runPage = vi.fn().mockRejectedValueOnce(new Error("offline")).mockImplementationOnce(() => new Promise<RunPage>(resolve => { settle = resolve; }));
    show({ runPage });
    await vi.waitFor(() => expect(button("Retry return lookup")).toBeDefined());
    const retry = button("Retry return lookup")!;
    retry.focus(); retry.click(); retry.click(); flushSync(); await tick();
    expect(runPage).toHaveBeenCalledTimes(2);
    expect(button("Retry return lookup")).toBe(retry);
    expect(retry.getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(retry);
    settle(page([run("owned", "entry")]));
    await vi.waitFor(() => expect(button("Open your latest rehearsal of this pack")).toBeDefined());
    expect(button("Refresh return lookup")).toBe(retry);
    expect(document.activeElement).toBe(retry);
  });

  it("retries an earlier page at the same offset without reloading the due queue", async () => {
    const runPage = vi.fn().mockResolvedValueOnce(firstPage()).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(page([run("owned", "entry")], 50));
    const dueProgress = vi.fn(async () => emptyDue);
    show({ runPage, dueProgress });
    await vi.waitFor(() => expect(button("Check earlier rehearsals")).toBeDefined());
    button("Check earlier rehearsals")!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Earlier rehearsals could not be loaded"));
    expect(document.body.textContent).not.toContain("You have not rehearsed this pack yet");
    button("Check earlier rehearsals")!.click();
    await vi.waitFor(() => expect(button("Open your latest rehearsal of this pack")).toBeDefined());
    expect(runPage.mock.calls).toEqual([[50, 0], [50, 50], [50, 50]]);
    expect(dueProgress).toHaveBeenCalledTimes(1);
  });

  it("keeps absent adapters unavailable instead of manufacturing an empty history", async () => {
    const { api } = show();
    delete api.runPage;
    delete api.dueProgress;
    await vi.waitFor(() => expect(button("Retry return lookup")).toBeDefined());
    expect(document.body.textContent).not.toContain("You have not rehearsed this pack yet");
  });

  it("refuses a crossed pack entry before making any return reads", async () => {
    const runPage = vi.fn(async () => page([]));
    show({ packEntry: async () => entry("another") as never, runPage });
    await vi.waitFor(() => expect(document.querySelector('[role="alert"]')).not.toBeNull());
    expect(runPage).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain("Pack another");
  });

  it("does not claim a complete empty history from inconsistent pagination", async () => {
    show({ runPage: async () => ({ runs: [], selection: { shown: 50, total: 50 } }) });
    await vi.waitFor(() => expect(button("Retry return lookup")).toBeDefined());
    expect(document.body.textContent).not.toContain("You have not rehearsed this pack yet");
  });

  it("retires a departed entry before its delayed read can start return work", async () => {
    let settle!: (value: unknown) => void;
    const runPage = vi.fn(async () => page([]));
    const { component } = show({ packEntry: () => new Promise(resolve => { settle = resolve as never; }), runPage });
    await tick();
    await unmount(component);
    components.splice(components.indexOf(component), 1);
    settle(entry());
    await tick();
    expect(runPage).not.toHaveBeenCalled();
    expect(document.querySelector("#return")).toBeNull();
  });

  it("reports only the preserved-history scope after exhausting all pages", async () => {
    const runPage = vi.fn().mockResolvedValueOnce(firstPage()).mockResolvedValueOnce(page([run("other-50"), run("other-51")], 50));
    show({ runPage });
    await vi.waitFor(() => expect(button("Check earlier rehearsals")).toBeDefined());
    button("Check earlier rehearsals")!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("No rehearsal of this pack was found in your saved history"));
    expect(button("Check earlier rehearsals")).toBeUndefined();
    expect(document.body.textContent).not.toContain("You have not rehearsed this pack yet");
  });

  it("refreshes the lookup from the beginning when saved history changes", async () => {
    const runPage = vi.fn().mockResolvedValueOnce(firstPage()).mockResolvedValueOnce(page([run("new-owned", "entry")]));
    const { onNavigate } = show({ runPage });
    await vi.waitFor(() => expect(button("Refresh return lookup")).toBeDefined());
    button("Refresh return lookup")!.click();
    await vi.waitFor(() => expect(button("Open your latest rehearsal of this pack")).toBeDefined());
    button("Open your latest rehearsal of this pack")!.click();
    expect(onNavigate).toHaveBeenCalledWith("/play/run/new-owned");
    expect(runPage.mock.calls).toEqual([[50, 0], [50, 0]]);
  });
});
