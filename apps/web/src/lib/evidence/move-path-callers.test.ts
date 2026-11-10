// @vitest-environment happy-dom
// D3979: actual SQLite/RunService JSON → strict receivers → real caller/board/modal.
// Chessground drawing is mocked; this is not native geometry/default-bootstrap proof.
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { tick } from "svelte";
import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import { branchPath, commitMove, fork, parsePresentationReceipt } from "@chess-tabiya/runtime";
import { recordedSequenceRouteFixture, recordedSequenceWindowFixture } from "../../../../../packages/runtime/src/testing/recorded-sequence-window-fixture.js";
import type { InspectorSourceRef } from "../../../../../packages/runtime/src/inspector-query-contract.js";
import { INSPECTOR_SOURCE_TOPICS } from "../../../../../packages/runtime/src/inspector-source-topics.js";
import { INSPECTOR_SOURCE_LABELS } from "../inspector-source-labels.js";
import { createComponentTestScope } from "../component-test-lifecycle.js";
import { inspectorBrowserFixture, historicalInspectorFixture, disposeInspectorBrowserFixtures, terminateInspectorBrowserFixture } from "../inspector-source-browser.test-support.js";
import { assertReviewMapResponse } from "../review-response.js";
import InspectorSourceBrowser from "../InspectorSourceBrowser.svelte";
import ReviewMapScreen from "../ReviewMapScreen.svelte";
import HistoricalInspector from "../HistoricalInspector.svelte";

const boards = vi.hoisted(() => ({ entries: [] as { element: HTMLElement; config: Config; set: ReturnType<typeof vi.fn<(config: Config) => void>>; destroy: ReturnType<typeof vi.fn> }[] }));
vi.mock("@lichess-org/chessground", () => ({ Chessground: (element: HTMLElement, config: Config) => {
  const entry = { element, config, set: vi.fn<(config: Config) => void>(), destroy: vi.fn() }; boards.entries.push(entry);
  return { state: { dom: { bounds: { clear() {} } } }, set: entry.set, destroy: entry.destroy } as unknown as Api;
} }));
const scope = createComponentTestScope(), route = "derived.pawn.sequence.contact_timing@3";
const button = (root: ParentNode, text: string) => [...root.querySelectorAll<HTMLButtonElement>("button")].find(node => node.textContent?.trim() === text);
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
function retainedClick(control: HTMLButtonElement) {
  const symbol = Object.getOwnPropertySymbols(control).find(value => value.description === "events");
  const events: unknown = symbol === undefined ? undefined : Reflect.get(control, symbol);
  if (events === null || typeof events !== "object" || !("click" in events) || typeof events.click !== "function") throw Error("Expected the actual delegated Svelte callback");
  const handler = events.click;
  return (root: HTMLElement) => {
    root.append(control);
    const event = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(event, "currentTarget", { value: control });
    handler.call(control, event);
  };
}
async function settled(root: HTMLElement) { await vi.waitFor(() => expect(root.textContent).not.toContain("Reading the requested evidence…")); await tick(); }
async function click(root: ParentNode, text: string) { const control = button(root, text); expect(control, text).toBeDefined(); control!.click(); await tick(); }
async function choose(root: HTMLElement, projection: InspectorSourceRef = route) {
  const label = INSPECTOR_SOURCE_LABELS[projection];
  for (let page = 0; page < Math.ceil(INSPECTOR_SOURCE_TOPICS.length / 8); page++) {
    if (button(root.querySelector("nav")!, label) !== undefined) break;
    await click(root, "Next sources"); await settled(root);
  }
  await click(root, label); await settled(root);
}
afterEach(async () => { await scope.cleanup(); document.body.replaceChildren(); boards.entries.length = 0; vi.clearAllMocks(); await disposeInspectorBrowserFixtures(); });
afterAll(async () => { await terminateInspectorBrowserFixture(); });

describe("D3979 actual recorded source callers", () => {
  for (const change of ["target", "branch", "run", "health", "access"] as const) it.each(["white", "black"] as const)(`Historical Inspector retires an open preview on real ${change} change (side=%s)`, async side => {
    const backend = await historicalInspectorFixture({ id: `historical-preview-${change}`, historical: true, side, authenticatedRest: true, sharedViewer: change === "access", ...(change === "health" ? { liveHealth: true, corpusTotal: 100 } : {}) });
    const saved = JSON.stringify(await backend.savedRun()), initialHealth = await backend.providerHealth(), initialAccess = await backend.viewerAccess();
    expect(initialAccess.kind).toBe("allowed");
    const root = document.createElement("div"); document.body.append(root);
    const onConfirm = vi.fn(backend.confirm), onQuery = vi.fn(backend.send);
    const screen = scope.createClassComponent({ component: HistoricalInspector, target: root, props: { run: backend.run, workflowContext: "imported", accessIdentity: JSON.stringify(initialAccess), sourceHealth: initialHealth, onConfirm, onQuery } });
    const target = async (label: string, value: string) => {
      const control = [...root.querySelectorAll('label')].find(node => node.childNodes[0]?.textContent?.trim() === label)!.querySelector('select')!;
      control.value = value; control.dispatchEvent(new Event("change", { bubbles: true })); await tick(); await tick();
    };
    const prepare = async (f: typeof backend) => {
      const path = branchPath(f.run, f.run.branches[0]!.id);
      await target("Recorded line", f.run.branches[0]!.id); await target("Recorded position", path[3]!.id);
      return path;
    };
    const confirm = async () => { await click(root, "Inspect recorded position"); await vi.waitFor(() => expect(root.querySelectorAll('nav[aria-label="Evidence sources"] li')).toHaveLength(8)); };
    const openPath = async (path: ReturnType<typeof branchPath>) => {
      await choose(root, "rules.mobility.event.piece_destinations@1");
      const opener = root.querySelector<HTMLButtonElement>('[data-component="move_path"] .san')!;
      expect(opener).not.toBeNull(); opener.click(); await tick(); await tick(); expect(dialog()).not.toBeNull();
      const preview = boards.entries.at(-1)!;
      await click(dialog()!, "Start"); expect(preview.set.mock.calls.at(-1)![0].fen).toBe(path[2]!.fen);
      await click(dialog()!, "Next"); expect(preview.set.mock.calls.at(-1)![0].fen).toBe(path[3]!.fen);
      return { open: retainedClick(opener), step: retainedClick(button(dialog()!, "Previous")!) };
    };
    const path = await prepare(backend); await confirm(); const old = await openPath(path);
    const originalRequest = onQuery.mock.calls.at(-1)![0], previousSourceCount = onQuery.mock.calls.filter(([request]) => request.query.view.kind === "source").length;
    let current = backend, currentConfirm = onConfirm, currentQuery = onQuery;
    if (change === "target") await target("Recorded position", path[1]!.id);
    if (change === "branch") await target("Recorded line", backend.run.activeCursor.branchId);
    if (change === "run") {
      current = await historicalInspectorFixture({ id: `replacement-history-${side}`, historical: true, side, authenticatedRest: true });
      currentConfirm = vi.fn(current.confirm); currentQuery = vi.fn(current.send);
      screen.$set({ run: current.run, accessIdentity: JSON.stringify(await current.viewerAccess()), sourceHealth: await current.providerHealth(), onConfirm: currentConfirm, onQuery: currentQuery }); await tick(); await tick();
    }
    if (change === "health") {
      const failed = await backend.failExplorer({ ...originalRequest, query: { ...originalRequest.query, view: { kind: "source", projection: "derived.explorer.inspector_population@1", context: { kind: "position" }, start: 0, collectionKey: null } } });
      expect(failed.actual).toMatchObject({ kind: "page", body: { kind: "source", outcome: { kind: "failed" } } });
      expect(failed.availability.explorer).toEqual({ state: "failed", reason: "authentication" });
      expect(failed.health).not.toEqual(initialHealth); expect((await backend.stats()).providerCalls).toHaveLength(1);
      screen.$set({ sourceHealth: failed.health }); await tick(); await tick();
    }
    if (change === "access") {
      const denied = await backend.viewerAccess(false); expect(denied).toEqual({ kind: "refused", code: "RUN_NOT_FOUND" });
      screen.$set({ accessIdentity: JSON.stringify(denied) }); await tick(); await tick();
      const before = (await backend.stats()).acquisitions.length;
      expect(await backend.send(originalRequest, new AbortController().signal)).toMatchObject({ kind: "refused", code: "not_found" });
      expect((await backend.httpStatuses()).at(-1)).toBe(404); expect((await backend.stats()).acquisitions).toHaveLength(before);
      await click(root, "Inspect recorded position"); await vi.waitFor(() => expect(root.querySelector('[role="alert"]')).not.toBeNull());
      const restored = await backend.viewerAccess(true); expect(restored).toMatchObject({ kind: "allowed", authority: { access: { role: "host" } } });
      screen.$set({ accessIdentity: JSON.stringify(restored) }); await tick(); await tick();
    }
    expect(dialog()).toBeNull(); expect(root.querySelector('nav[aria-label="Evidence sources"]')).toBeNull();
    old.open(root); old.step(root); await tick(); await tick(); expect(dialog()).toBeNull();
    expect(onQuery.mock.calls.filter(([request]) => request.query.view.kind === "source")).toHaveLength(previousSourceCount);
    const nextPath = await prepare(current); expect(dialog()).toBeNull();
    await confirm(); await openPath(nextPath);
    expect(currentConfirm).toHaveBeenCalledTimes(change === "run" ? 1 : change === "access" ? 3 : 2);
    expect(currentQuery.mock.calls.filter(([request]) => request.query.view.kind === "source")).toHaveLength(change === "run" ? 1 : previousSourceCount + 1);
    expect(JSON.stringify(await backend.savedRun())).toBe(saved);
    if (change === "run") expect(current.run.id).not.toBe(backend.run.id);
    if (change !== "health") expect((await backend.stats()).providerCalls).toEqual([]);
  });

  it.each([false, true])("Inspector preserves the first and fifth identical-looking move's own FEN (mirrored=%s)", async black => {
    const run = recordedSequenceWindowFixture({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", moves: ["g1f3", "g8f6", "f3g1", "f6g8", "g1f3"] }, black, `repeated-preview-${black}`);
    const f = await inspectorBrowserFixture({ run, authenticatedRest: true }), saved = JSON.stringify(await f.savedRun());
    const path = branchPath(f.run, f.run.activeCursor.branchId), onQuery = vi.fn(f.send);
    expect(path[1]!.moveUci).toBe(path[5]!.moveUci); expect(path[1]!.moveSan).toBe(path[5]!.moveSan);
    expect(path[1]!.fen.split(" ").slice(0, 4)).toEqual(path[5]!.fen.split(" ").slice(0, 4));
    expect(path[1]!.fen).not.toBe(path[5]!.fen);
    const root = document.createElement("div"); document.body.append(root);
    const screen = scope.createClassComponent({ component: InspectorSourceBrowser, target: root, props: { ...await f.propsFor({ nodeId: path[1]!.id }), onQuery } });
    await tick(); await vi.waitFor(() => expect(root.querySelectorAll("nav li")).toHaveLength(8));
    let oldOpen: ReturnType<typeof retainedClick> | undefined, oldStep: ReturnType<typeof retainedClick> | undefined;
    for (const index of [1, 5]) {
      if (index === 5) {
        screen.$set({ ...await f.propsFor({ nodeId: path[5]!.id }), onQuery }); await tick(); await tick();
        expect(dialog()).toBeNull();
        await vi.waitFor(() => expect(root.querySelectorAll("nav li")).toHaveLength(8));
        oldOpen!(root); oldStep!(root); await tick(); await tick();
        expect(dialog()).toBeNull();
      }
      await choose(root, "rules.mobility.event.piece_destinations@1");
      const opener = root.querySelector<HTMLButtonElement>('[data-component="move_path"] .san')!;
      expect(opener).not.toBeNull(); const calls = onQuery.mock.calls.length;
      expect(onQuery.mock.calls.at(-1)![0].query).toMatchObject({ nodeId: path[index]!.id, view: { kind: "source", context: { kind: "incoming_edge" } } });
      opener.click(); await tick(); await tick(); expect(dialog()).not.toBeNull();
      const preview = boards.entries.at(-1)!;
      await click(dialog()!, "Start"); expect(preview.set.mock.calls.at(-1)![0].fen).toBe(path[index - 1]!.fen);
      await click(dialog()!, "Next"); expect(preview.set.mock.calls.at(-1)![0].fen).toBe(path[index]!.fen);
      expect(button(dialog()!, "Next")!.disabled).toBe(true);
      if (index === 1) { oldOpen = retainedClick(opener); oldStep = retainedClick(button(dialog()!, "Previous")!); }
      expect(onQuery).toHaveBeenCalledTimes(calls);
      expect(JSON.stringify(await f.savedRun())).toBe(saved);
    }
    expect(onQuery.mock.calls.filter(([request]) => request.query.view.kind === "source")).toHaveLength(2);
    const statuses = await f.httpStatuses();
    expect(statuses.length).toBeGreaterThan(0); expect([...new Set(statuses)]).toEqual([200]);
    expect((await f.stats()).providerCalls).toEqual([]);
  });

  for (const black of [false, true]) for (const inherited of [false, true]) {
    it(`Review steps original ${black ? "black" : "white"}/${inherited ? "inherited" : "main"} path without moving its board or stored game`, async () => {
      let run = recordedSequenceRouteFixture(route, black);
      if (inherited) {
        const original = branchPath(run, run.activeCursor.branchId);
        run = fork(run, original[1]!.id, { at: "2026-11-04T00:00:00.000Z" }).run;
        for (const node of original.slice(2)) run = commitMove(run, node.moveUci!, { at: "2026-11-04T00:00:00.000Z" }).run;
      }
      const f = await inspectorBrowserFixture({ run }), saved = JSON.stringify(await f.savedRun()), value = await f.review();
      assertReviewMapResponse(value, { runId: run.id, branchId: run.activeCursor.branchId });
      const row = [...value.rows].reverse().find(candidate => parsePresentationReceipt(candidate.packet).some(item => item.adapter.projection.id === "derived.pawn.sequence.contact_timing" && item.component.id === "move_path"))!;
      expect(row).toBeDefined();
      const itemIndex = parsePresentationReceipt(row.packet).findIndex(item => item.adapter.projection.id === "derived.pawn.sequence.contact_timing" && item.component.id === "move_path");
      const item = parsePresentationReceipt(row.packet)[itemIndex]!;
      if (item.component.id !== "move_path") throw Error("Missing actual recorded line");
      expect(item.component.operand.startFen).toBe(run.nodes[0]!.fen);
      const root = document.createElement("div"); document.body.append(root);
      const retry = vi.fn(), onExport = vi.fn(), onAnalyze = vi.fn();
      scope.createClassComponent({ component: ReviewMapScreen, target: root, props: { review: value, initialNodeId: row.nodeId, onRetry: retry, onExport, onAnalyze } });
      await tick();
      const activeBoard = boards.entries[0]!, activeElement = activeBoard.element, originalConfig = JSON.stringify(activeBoard.config);
      const opener = root.querySelectorAll<HTMLElement>(".evidence > .presented")[itemIndex]!.querySelector<HTMLButtonElement>(".san")!;
      expect(opener).toBeDefined(); opener.click(); await tick(); await tick();
      expect(dialog()).not.toBeNull();
      const preview = boards.entries.at(-1)!;
      expect(preview).not.toBe(activeBoard);
      await click(dialog()!, "Start");
      expect(preview.set.mock.calls.at(-1)![0].fen).toBe(run.nodes[0]!.fen);
      const path = branchPath(run, run.activeCursor.branchId);
      for (const node of path.slice(1)) {
        await click(dialog()!, "Next"); expect(preview.set.mock.calls.at(-1)![0].fen).toBe(node.fen);
      }
      expect(activeElement.isConnected).toBe(true); expect(activeBoard.destroy).not.toHaveBeenCalled();
      expect(JSON.stringify(activeBoard.config)).toBe(originalConfig);
      expect(activeBoard.set.mock.calls.every(([config]) => config.fen === row.fen)).toBe(true);
      expect(retry).not.toHaveBeenCalled(); expect(onExport).not.toHaveBeenCalled(); expect(onAnalyze).not.toHaveBeenCalled();
      expect(JSON.stringify(await f.savedRun())).toBe(saved); expect(await f.stats()).toEqual({ acquisitions: [], providerCalls: [] });
      const oldNext = button(dialog()!, "Previous")!;
      // A real recorded-row navigation retires the item, not just the dialog button.
      root.querySelector<HTMLButtonElement>(`.move-row[data-node-id="${value.rows[0]!.nodeId}"] .move-select`)!.click(); await tick(); await tick();
      expect(dialog()).toBeNull(); opener.click(); oldNext.click(); await tick(); expect(dialog()).toBeNull();
    });
  }
  for (const projection of [route, "derived.tactic.overload_exploitation_observed@3"] as const) for (const inherited of [false, true]) it.each([false, true])(`Inspector steps its demanded ${projection} line and retires it on source/host changes (inherited=${inherited}, mirrored=%s)`, async black => {
    let run = recordedSequenceRouteFixture(projection, black);
    if (inherited) {
      const path = branchPath(run, run.activeCursor.branchId), at = "2026-11-04T00:00:00.000Z";
      run = fork(run, path[1]!.id, { at }).run;
      for (const node of path.slice(2)) run = commitMove(run, node.moveUci!, { at }).run;
      expect(branchPath(run, run.activeCursor.branchId)[1]!.branchId).not.toBe(run.activeCursor.branchId);
    }
    const f = await inspectorBrowserFixture({ run, authenticatedRest: true }), original = JSON.stringify(await f.savedRun());
    const onQuery = vi.fn(f.send), root = document.createElement("div"); document.body.append(root);
    const screen = scope.createClassComponent({ component: InspectorSourceBrowser, target: root, props: { ...f.props, onQuery } });
    await tick(); await vi.waitFor(() => expect(root.querySelectorAll("nav li")).toHaveLength(8));
    await choose(root, projection);
    const opener = root.querySelector<HTMLButtonElement>('[data-component="move_path"] .san')!;
    expect(opener).not.toBeNull(); const calls = onQuery.mock.calls.length;
    opener.click(); await tick(); await tick(); expect(dialog()).not.toBeNull();
    const preview = boards.entries.at(-1)!;
    await click(dialog()!, "Start"); expect(preview.set.mock.calls.at(-1)![0].fen).toBe(run.nodes[0]!.fen);
    for (const node of branchPath(run, run.activeCursor.branchId).slice(1)) {
      await click(dialog()!, "Next"); expect(preview.set.mock.calls.at(-1)![0].fen).toBe(node.fen);
    }
    expect(onQuery).toHaveBeenCalledTimes(calls);
    expect(JSON.stringify(await f.savedRun())).toBe(original);
    const retained = button(dialog()!, "Previous")!;
    // A different real topic destroys the actual source result and its exact owner.
    const otherSource = [...root.querySelectorAll<HTMLButtonElement>("nav li button")].find(control => control.textContent !== INSPECTOR_SOURCE_LABELS[projection])!;
    otherSource.click(); await tick(); await settled(root);
    expect(dialog()).toBeNull(); opener.click(); retained.click(); await tick(); expect(dialog()).toBeNull();
    await choose(root, projection);
    root.querySelector<HTMLButtonElement>('[data-component="move_path"] .san')!.click(); await tick(); await tick();
    expect(dialog()).not.toBeNull();
    screen.$destroy(); await tick(); expect(dialog()).toBeNull();
    const statuses = await f.httpStatuses();
    expect(statuses.length).toBeGreaterThan(0); expect([...new Set(statuses)]).toEqual([200]);
  });
});
