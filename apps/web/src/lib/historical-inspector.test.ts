// @vitest-environment happy-dom
// Genuine RunService/SQLite JSON enters the actual mounted seat and its source browser.
import { tick, type ComponentProps } from "svelte";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { branchPath, moduleDecisionStamp, projectRun, type DrillRun } from "@chess-tabiya/runtime";
import { createComponentTestScope } from "./component-test-lifecycle.js";
import { historicalInspectorFixture, disposeInspectorBrowserFixtures, terminateInspectorBrowserFixture } from "./inspector-source-browser.test-support.js";
import * as receiver from "./historical-inspector.js";
import HistoricalInspector from "./HistoricalInspector.svelte";

const scope = createComponentTestScope();
type Props = ComponentProps<typeof HistoricalInspector>;
afterEach(async () => { await scope.cleanup(); vi.restoreAllMocks(); document.body.replaceChildren(); await disposeInspectorBrowserFixtures(); });
afterAll(async () => { await terminateInspectorBrowserFixture(); });
function button(root: ParentNode, text: string) { const found = [...root.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.trim() === text); expect(found, text).toBeDefined(); return found!; }
function select(root: ParentNode, label: string) { const found = [...root.querySelectorAll("label")].find(node => node.childNodes[0]?.textContent?.trim() === label)?.querySelector("select"); expect(found, label).toBeDefined(); return found!; }
async function choose(control: HTMLSelectElement, value: string) { control.value = value; control.dispatchEvent(new Event("change", { bubbles: true })); await tick(); }
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(accept => { resolve = accept; }); return { resolve, promise }; }
async function fixture(patch: Partial<Props> = {}, side: "white" | "black" = "white") {
  const f = await historicalInspectorFixture({ historical: true, side }), root = document.createElement("div"); document.body.append(root);
  const onConfirm = vi.fn(f.confirm), onQuery = vi.fn(f.send);
  const props: Props = { run: f.run, workflowContext: "imported", accessIdentity: "host|false|false|writer", sourceHealth: undefined, onConfirm, onQuery, ...patch };
  const instance = scope.createClassComponent({ component: HistoricalInspector, target: root, props }); await tick();
  return { ...f, root, instance, onConfirm, onQuery, props };
}
async function oldRoot(f: Awaited<ReturnType<typeof fixture>>) {
  await choose(select(f.root, "Recorded line"), f.run.branches[0]!.id);
  expect(select(f.root, "Recorded position").value).toBe(branchPath(f.run, f.run.branches[0]!.id)[0]!.id);
}
async function open(root: HTMLElement) { const action = button(root, "Inspect recorded position"); action.focus(); action.click(); await tick(); }
async function inventory(root: HTMLElement) { await vi.waitFor(() => expect(root.querySelectorAll('nav[aria-label="Evidence sources"] li')).toHaveLength(8)); }
async function castling(root: HTMLElement) {
  for (let page = 0; page < 9; page++) {
    const source = [...root.querySelectorAll<HTMLButtonElement>('nav[aria-label="Evidence sources"] button')].find(node => node.textContent?.trim() === "Castling rights");
    if (source !== undefined) { source.click(); await tick(); return; }
    const first = root.querySelector("nav li")?.textContent; button(root, "Next sources").click(); await tick();
    await vi.waitFor(() => expect(root.querySelector("nav li")?.textContent).not.toBe(first));
  }
  throw new Error("Actual source catalogue has no Castling rights");
}

describe("explicit historical Inspector journey", () => {
  it.each(["white", "black"] as const)("opens an old %s root only on explicit action, without active retry or preference changes", async side => {
    const f = await fixture({}, side), before = JSON.stringify(f.run), storage = localStorage.length;
    await oldRoot(f);
    expect(f.onConfirm).not.toHaveBeenCalled(); expect(f.onQuery).not.toHaveBeenCalled();
    expect(await f.stats()).toEqual({ acquisitions: [], providerCalls: [] });
    await open(f.root); await inventory(f.root);
    const target = f.onConfirm.mock.calls[0]![0].inspector;
    expect(target).toEqual({ branchId: f.run.branches[0]!.id, nodeId: f.run.nodes[0]!.id, decisionDigest: moduleDecisionStamp(f.run).digest });
    expect(f.onQuery.mock.calls[0]![0].query).toMatchObject({ ...target, view: { kind: "inventory", start: 0 } });
    expect(f.root.textContent).toContain("not your current retry");
    expect(document.activeElement).toBe(f.root.querySelector("h4"));
    await castling(f.root);
    await vi.waitFor(() => expect(f.root.querySelectorAll("[data-presented]").length).toBeGreaterThan(0));
    expect(f.onQuery.mock.calls.at(-1)![0].query.nodeId).toBe(f.run.nodes[0]!.id);
    expect(JSON.stringify(f.run)).toBe(before); expect(localStorage.length).toBe(storage);
  });

  it("selects inherited-prefix and later positions without switching the active cursor", async () => {
    const f = await fixture(), before = { ...f.run.activeCursor }; await oldRoot(f);
    const path = branchPath(f.run, f.run.branches[0]!.id);
    for (const node of [path[2]!, path[3]!]) {
      await choose(select(f.root, "Recorded position"), node.id); await open(f.root); await inventory(f.root);
      expect(f.onQuery.mock.calls.at(-1)![0].query.nodeId).toBe(node.id); expect(f.run.activeCursor).toEqual(before);
      expect(f.root.querySelectorAll('[role="alert"]')).toHaveLength(0);
    }
  });

  it("shows actual current retry disclosure refusal, then explicitly retries a different recorded line", async () => {
    const f = await fixture(); await open(f.root);
    await vi.waitFor(() => expect(f.root.querySelector('[role="alert"]')).not.toBeNull());
    expect(f.onQuery).not.toHaveBeenCalled();
    await oldRoot(f); await open(f.root); await inventory(f.root);
    expect(f.onConfirm).toHaveBeenCalledTimes(2);
  });

  it.each(["target", "snapshot", "access", "context", "health", "close", "unmount"])("retires pending confirmation on %s before parsing a late genuine response", async change => {
    const f = await fixture(), held = deferred<unknown>(); let raw: unknown, signal: AbortSignal | undefined;
    f.instance.$set({ onConfirm: async (body, next) => { signal = next; raw = await f.confirm(body, next); return held.promise; } });
    await tick(); await oldRoot(f); await open(f.root);
    await vi.waitFor(() => expect(raw).toBeDefined());
    const parser = vi.spyOn(receiver, "parseInspectorAssistanceResponse");
    if (change === "target") await choose(select(f.root, "Recorded position"), f.run.nodes[1]!.id);
    if (change === "snapshot") {
      const events = structuredClone(f.run.events); (events.at(-1)! as { at: string }).at = "2026-11-03T00:00:02.000Z";
      const changed = projectRun(events); expect(moduleDecisionStamp(changed)).toEqual(moduleDecisionStamp(f.run));
      f.instance.$set({ run: changed }); await tick();
    }
    if (change === "access") { f.instance.$set({ accessIdentity: "spectator|false|false|read_only" }); await tick(); }
    if (change === "context") { f.instance.$set({ workflowContext: "match" }); await tick(); }
    if (change === "health") { f.instance.$set({ sourceHealth: { changed: true } }); await tick(); }
    if (change === "close") { button(f.root, "Close recorded evidence").click(); await tick(); }
    if (change === "unmount") f.instance.$destroy();
    expect(signal!.aborted).toBe(true); held.resolve(raw); await tick(); await Promise.resolve();
    expect(parser).not.toHaveBeenCalled(); expect(f.onQuery).not.toHaveBeenCalled(); expect(f.root.querySelector("nav")).toBeNull();
  });

  it("deduplicates only pending confirmation and offers a later explicit retry", async () => {
    const f = await fixture(), held = deferred<unknown>(); let raw: unknown;
    const onConfirm = vi.fn(async (body: receiver.InspectorAssistanceRequest, signal: AbortSignal) => { raw = await f.confirm(body, signal); return held.promise; });
    f.instance.$set({ onConfirm }); await tick(); await oldRoot(f); await open(f.root);
    const pending = button(f.root, "Confirming recorded access…"); pending.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.waitFor(() => expect(raw).toBeDefined()); expect(onConfirm).toHaveBeenCalledTimes(1); expect(f.onQuery).not.toHaveBeenCalled();
    held.resolve(raw); await inventory(f.root);
    f.instance.$set({ onConfirm: f.onConfirm }); await tick();
    await open(f.root); await inventory(f.root); expect(f.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("retires ready pages and pending source responses when a target or health identity changes", async () => {
    const f = await fixture(), held = deferred<unknown>(); let raw: unknown, sourceSignal: AbortSignal | undefined;
    f.instance.$set({ onQuery: async (body, signal) => {
      const value = await f.send(body, signal);
      if (body.query.view.kind === "source") { raw = value; sourceSignal = signal; return held.promise; }
      return value;
    } }); await tick(); await oldRoot(f); await open(f.root); await inventory(f.root);
    await castling(f.root); await vi.waitFor(() => expect(raw).toBeDefined());
    f.instance.$set({ sourceHealth: { changed: true } }); await tick();
    expect(sourceSignal!.aborted).toBe(true); held.resolve(raw); await tick();
    expect(f.root.querySelectorAll("[data-presented]")).toHaveLength(0); expect(f.root.querySelector("nav")).toBeNull();
    await open(f.root); await inventory(f.root); expect(f.onConfirm).toHaveBeenCalledTimes(2);
  });

  it("does not steal moved focus, and closing recorded evidence returns owned focus to its action", async () => {
    const f = await fixture(), held = deferred<unknown>(); let raw: unknown;
    f.instance.$set({ onConfirm: async (body, signal) => { raw = await f.confirm(body, signal); return held.promise; } });
    await tick(); await oldRoot(f); await open(f.root); await vi.waitFor(() => expect(raw).toBeDefined());
    select(f.root, "Recorded line").focus(); held.resolve(raw); await inventory(f.root);
    expect(document.activeElement).toBe(select(f.root, "Recorded line"));
    const close = button(f.root, "Close recorded evidence"); close.focus(); close.click(); await tick();
    expect(document.activeElement).toBe(button(f.root, "Inspect recorded position"));
  });

  it("the actual source-browser recovery button reconfirms historical help, not active Play, before reloading inventory", async () => {
    const f = await fixture(), held = deferred<unknown>(); let refreshed: unknown;
    // A stale decision on one transport request produces a genuine server refusal, not a
    // fabricated page. Every confirmation and the recovered inventory use the real current cut.
    let first = true;
    f.instance.$set({ onQuery: async (body, signal) => {
      if (first && body.query.view.kind === "source") {
        first = false;
        const refused = await f.send({ ...body, query: { ...body.query, decisionDigest: `sha256:${"0".repeat(64)}` } }, signal);
        expect(refused).toMatchObject({ kind: "refused", code: "stale" });
        return refused;
      }
      return f.onQuery(body, signal);
    } }); await tick(); await oldRoot(f); await open(f.root); await inventory(f.root);
    await castling(f.root);
    await vi.waitFor(() => expect(f.root.textContent).toContain("The game or its evidence changed"));
    const onConfirm = vi.fn(async (body: receiver.InspectorAssistanceRequest, signal: AbortSignal) => { refreshed = await f.confirm(body, signal); return held.promise; });
    f.instance.$set({ onConfirm }); await tick();
    const refresh = button(f.root, "Refresh help and source list"); refresh.focus(); refresh.click(); await tick();
    expect(f.root.querySelector("nav")).toBeNull(); expect(f.root.textContent).toContain("Confirming recorded access");
    await vi.waitFor(() => expect(refreshed).toBeDefined());
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith({ assistance: expect.objectContaining({ contextHint: "imported", preference: expect.objectContaining({ preset: "analysis" }) }),
      inspector: { branchId: f.run.branches[0]!.id, nodeId: f.run.nodes[0]!.id, decisionDigest: moduleDecisionStamp(f.run).digest } }, expect.any(AbortSignal));
    held.resolve(refreshed); await inventory(f.root);
    expect(f.root.querySelector('[role="alert"]')).toBeNull(); expect(document.activeElement).toBe(f.root.querySelector("h4"));
    expect(await f.stats()).toEqual({ acquisitions: [], providerCalls: [] });
  });
});
