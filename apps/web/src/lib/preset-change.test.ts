// @vitest-environment happy-dom
// D4061: actual stored-run authority/source replies and mounted workflows, not native geometry.
import { tick } from "svelte";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { createRun, commitMove, fork, revealFeedback, compileAssistanceRequest, hintDecisionStamp, type HintResponse, type RequestedAssistanceV1 } from "@chess-tabiya/runtime";
import { mirrorSemanticFen, mirrorSemanticUci } from "../../../../packages/runtime/src/semantic-validation.js";
import { recordedSequenceRouteFixture } from "../../../../packages/runtime/src/testing/recorded-sequence-window-fixture.js";
import { INSPECTOR_SOURCE_TOPICS } from "../../../../packages/runtime/src/inspector-source-topics.js";
import { INSPECTOR_SOURCE_LABELS } from "./inspector-source-labels.js";
import { createComponentTestScope } from "./component-test-lifecycle.js";
import { historicalInspectorFixture, disposeInspectorBrowserFixtures, terminateInspectorBrowserFixture } from "./inspector-source-browser.test-support.js";
import { workflowPreferenceKey } from "./assistance-preference.js";
import type { GuidedHintClient } from "./api.js";
import DrillScreen from "./DrillScreen.svelte";
import { attachDelivery, evaluationDelivery } from "../../../../packages/runtime/src/testing/review-evidence-fixture.js";
import { branchPath, presentedSentence, presentedGradeMeasurementReport } from "@chess-tabiya/runtime";
import { parseModuleQueryPage } from "./module-query-response.js";

const board = vi.hoisted(() => ({ set: vi.fn(), destroy: vi.fn() }));
vi.mock("@lichess-org/chessground", () => ({ Chessground: () => ({ state: { dom: { bounds: { clear() {} } } }, set: board.set, destroy: board.destroy }) }));
const scope = createComponentTestScope(), at = "2026-11-04T00:00:00.000Z";
afterEach(async () => { await scope.cleanup(); await disposeInspectorBrowserFixtures(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.replaceChildren(); });
afterAll(async () => { await terminateInspectorBrowserFixture(); });
type Backend = Awaited<ReturnType<typeof historicalInspectorFixture>>;
function modernRun(fen: string, moves: readonly string[] = [], id = "preset-change-run") {
  let run = createRun({ id, session: { kind: "position", start: { fen, side: fen.split(" ")[1] === "w" ? "white" : "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"3".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  for (const move of moves) run = commitMove(run, move, { at }).run;
  return revealFeedback(run, at).run;
}
function mounted(backend: Backend, options: { failed?: boolean; hints?: GuidedHintClient; authority?: Backend["authority"]; restModules?: boolean; readOnly?: boolean } = {}) {
  const target = document.createElement("div"); document.body.append(target);
  let activeBackend = backend;
  const onModuleQuery = vi.fn(async (body: Parameters<Backend["modules"]>[0]) => {
    if (options.failed) throw Error("transport unavailable");
    return options.restModules ? activeBackend.modulesRest(body) : activeBackend.modules(body);
  });
  const onMove = vi.fn(), onRewind = vi.fn();
  const onInspectorQuery = vi.fn(backend.send);
  const preference = JSON.stringify({ version: 2, assistanceHead: 4, intent: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
  const preferences = new Map([[workflowPreferenceKey("position"), preference], [workflowPreferenceKey("onramp"), preference]]);
  const component = scope.createClassComponent({ component: DrillScreen, target, props: {
    snapshot: { run: backend.run, access: options.readOnly ? "read_only" : "writer", pendingEvidence: 0, withheld: false }, onModuleQuery, onInspectorQuery,
    onAssistanceQuery: options.authority ?? backend.authority, hints: options.hints,
    assistanceStorage: { getItem: key => preferences.get(key) ?? null, setItem: vi.fn((key: string, value: string) => { preferences.set(key, value); }) },
    onMove, onRewind, onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion: () => () => {},
  } });
  return { target, component, onModuleQuery, onInspectorQuery, preferences, onMove, onRewind,
    replaceBackend(next: Backend) {
      activeBackend = next;
      component.$set({ snapshot: { run: next.run, access: "writer", pendingEvidence: 0, withheld: false }, onAssistanceQuery: next.authority, onInspectorQuery: next.send });
    } };
}
async function ready(root: HTMLElement) { await vi.waitFor(() => expect(root.querySelector('[data-preset-state]')?.getAttribute("data-preset-state")).toBe("ready")); }
async function choosePreset(root: HTMLElement, value: string) {
  const menu = root.querySelector<HTMLDetailsElement>('details.assistance-control')!;
  menu.open = true; menu.dispatchEvent(new Event("toggle")); await tick();
  const input = menu.querySelector<HTMLInputElement>(`.preset-options input[value="${value}"]`)!;
  expect(input).not.toBeNull(); input.focus(); input.click(); await tick();
  return menu.querySelector('summary');
}
function defaultHead(root: HTMLElement) {
  expect.soft(root.querySelectorAll('#run-support-region [data-queue-head]')).toHaveLength(1);
  expect.soft(root.querySelector<HTMLDivElement>('#support_tools-card')!.hidden).toBe(false);
}
function retainedMeasurement(control: HTMLButtonElement) {
  const handler = Object.getOwnPropertySymbols(control).flatMap(symbol => {
    const value: unknown = symbol.description === "events" ? Reflect.get(control, symbol) : null;
    return typeof value === "object" && value !== null && "click" in value && typeof value.click === "function" ? [value.click] : [];
  })[0];
  if (typeof handler !== "function") throw Error("Expected original emitted click handler");
  return (root: HTMLElement) => {
    root.append(control); const event = new MouseEvent("click", { bubbles: true }); Object.defineProperty(event, "currentTarget", { value: control });
    handler.call(control, event);
  };
}
const measurementOpen = (root: HTMLElement) => [...root.querySelectorAll<HTMLButtonElement>('[data-module="postcommit_nudge"] button')].find(button => button.textContent === "How measured");
const measurementReport = (root: HTMLElement) => root.querySelector<HTMLElement>('[aria-label="Measurement details"]');

describe("D4064 complete original reports through authenticated Play", () => {
  it("retires details after actual shared-host grant revocation and does not reopen them on restoration", async () => {
    vi.stubGlobal("innerWidth", 1440); vi.stubGlobal("innerHeight", 1000);
    let run = modernRun("7k/p7/8/8/8/2P1PN2/6P1/K7 w - - 0 1", ["f3d4"]);
    for (const [i, node] of branchPath(run, run.activeCursor.branchId).entries()) run = attachDelivery(run, node.id, evaluationDelivery(node.fen, i === 0 ? "cp 0" : "cp 200"));
    const backend = await historicalInspectorFixture({ run, preserveRun: true, authenticatedRest: true, sharedViewer: true });
    expect(await backend.viewerAccess()).toMatchObject({ kind: "allowed", authority: { access: { role: "host" } } });
    const saved = JSON.stringify(await backend.savedRun()), f = mounted(backend, { restModules: true, readOnly: true }); await ready(f.target);
    await vi.waitFor(() => expect(measurementOpen(f.target)).not.toBeUndefined());
    const oldOpen = retainedMeasurement(measurementOpen(f.target)!); measurementOpen(f.target)!.click(); await tick(); await tick();
    expect(measurementReport(f.target)).not.toBeNull();
    const oldClose = retainedMeasurement(measurementReport(f.target)!.querySelector<HTMLButtonElement>("button")!);
    expect(await backend.viewerAccess(false)).toEqual({ kind: "refused", code: "RUN_NOT_FOUND" });
    f.component.$set({ viewerRole: "spectator" }); await tick(); await tick();
    expect(measurementReport(f.target)).toBeNull(); oldOpen(f.target); oldClose(f.target); await tick(); expect(measurementReport(f.target)).toBeNull();
    expect(await backend.viewerAccess(true)).toMatchObject({ kind: "allowed", authority: { access: { role: "host" } } });
    f.component.$set({ viewerRole: "host" }); await ready(f.target); await tick();
    oldOpen(f.target); oldClose(f.target); await tick(); expect(measurementReport(f.target)).toBeNull();
    expect(JSON.stringify(await backend.savedRun())).toBe(saved); expect((await backend.stats()).providerCalls).toEqual([]);
  });
  for (const change of ["repeated subject", "inherited branch", "run"] as const) it(`retires equal-grade original incoming-edge reports on actual stored ${change} change`, async () => {
    vi.stubGlobal("innerWidth", 1440); vi.stubGlobal("innerHeight", 1000);
    const fen = "7k/p7/8/8/8/2P1PN2/6P1/K7 w - - 0 1";
    const graded = (id: string) => {
      let run = modernRun(fen, ["f3d4"], id);
      for (const [i, node] of branchPath(run, run.activeCursor.branchId).entries()) run = attachDelivery(run, node.id, evaluationDelivery(node.fen, i === 0 ? "cp 0" : "cp 200"));
      return run;
    };
    const initial = graded("preset-change-run");
    let next = change === "run" ? graded("replacement-grade-run") : initial;
    if (change !== "run") {
      if (change === "inherited branch") next = fork(next, next.activeCursor.nodeId, { at }).run;
      next = commitMove(next, "h8g8", { at, actor: "system" }).run;
      next = attachDelivery(next, next.activeCursor.nodeId, evaluationDelivery(next.nodes.find(node => node.id === next.activeCursor.nodeId)!.fen, "cp 0"));
      next = commitMove(next, "d4f3", { at, actor: "user" }).run;
      next = attachDelivery(next, next.activeCursor.nodeId, evaluationDelivery(next.nodes.find(node => node.id === next.activeCursor.nodeId)!.fen, "cp 200"));
      next = revealFeedback(next, at).run;
    }
    const backend = await historicalInspectorFixture({ run: initial, preserveRun: true, authenticatedRest: true });
    const f = mounted(backend, { restModules: true }); await ready(f.target);
    await vi.waitFor(() => expect(f.target.querySelector('[data-module="postcommit_nudge"] .seat-row')).not.toBeNull());
    const seat = f.target.querySelector('[data-module="postcommit_nudge"]')!;
    const toggle = seat.querySelector<HTMLButtonElement>('.seat-row')!; if (toggle.getAttribute("aria-expanded") !== "true") { toggle.click(); await tick(); }
    await vi.waitFor(() => expect(measurementOpen(f.target)).not.toBeUndefined());
    const oldOpen = retainedMeasurement(measurementOpen(f.target)!); measurementOpen(f.target)!.click(); await tick(); await tick();
    const oldClose = retainedMeasurement(measurementReport(f.target)!.querySelector<HTMLButtonElement>("button")!);
    const originalSentence = measurementReport(f.target)!.querySelector("p")!.textContent;
    const calls = f.onModuleQuery.mock.calls.length;
    const nextBackend = change === "run" ? await historicalInspectorFixture({ run: next, preserveRun: true, authenticatedRest: true }) : backend;
    if (change === "run") f.replaceBackend(nextBackend);
    else { await backend.publish(next); f.component.$set({ snapshot: { run: next, access: "writer", pendingEvidence: 0, withheld: false } }); }
    await tick();
    expect(measurementReport(f.target)).toBeNull(); oldOpen(f.target); await tick(); expect(measurementReport(f.target)).toBeNull();
    await vi.waitFor(() => expect(f.onModuleQuery.mock.calls.length).toBeGreaterThan(calls));
    const currentPages = await Promise.all(f.onModuleQuery.mock.results.slice(calls).map(result => result.value));
    const raw = currentPages.at(-1) as { page: { effectiveConfigDigest: string } };
    const parsed = parseModuleQueryPage(raw, { runId: next.id, subjectNodeId: next.activeCursor.nodeId, finalDigest: raw.page.effectiveConfigDigest });
    expect(parsed.packets.find(packet => packet.module === "postcommit_nudge")?.items.some(item => item.adapter.projection.id === "derived.grade.move_quality")).toBe(true);
    await vi.waitFor(() => expect(f.target.querySelector('[data-module="postcommit_nudge"] [data-presented]')).not.toBeNull());
    const currentToggle = f.target.querySelector<HTMLButtonElement>('[data-module="postcommit_nudge"] .seat-row')!;
    if (currentToggle.getAttribute("aria-expanded") !== "true") { currentToggle.click(); await tick(); }
    await vi.waitFor(() => expect(measurementOpen(f.target)).not.toBeUndefined());
    measurementOpen(f.target)!.click(); await tick(); await tick();
    expect(measurementReport(f.target)!.querySelector("p")!.textContent).toBe(originalSentence);
    oldClose(f.target); await tick(); expect(measurementReport(f.target)).not.toBeNull();
    expect(JSON.stringify(await nextBackend.savedRun())).toBe(JSON.stringify(next));
    expect((await nextBackend.stats()).providerCalls).toEqual([]); expect(f.onMove).not.toHaveBeenCalled(); expect(f.onRewind).not.toHaveBeenCalled();
  });
  for (const black of [false, true]) for (const origin of ["provider", "offline"] as const) for (const scores of [
    { arm: "eval_delta", before: "cp 0", after: "cp 200" },
    { arm: "mate_lost", before: "mate 2", after: "cp -700" },
    { arm: "mate_allowed", before: "cp 0", after: "mate 2" },
  ]) it(`${origin}/${scores.arm}/mirrored=${black} opens its complete same-source report without new work`, async () => {
    vi.stubGlobal("innerWidth", 1440); vi.stubGlobal("innerHeight", 1000);
    const whiteFen = "7k/p7/8/8/8/2P1PN2/6P1/K7 w - - 0 1";
    let run = modernRun(black ? mirrorSemanticFen(whiteFen, "color_and_vertical") : whiteFen, [black ? "f6d5" : "f3d4"]);
    for (const [i, node] of branchPath(run, run.activeCursor.branchId).entries()) run = attachDelivery(run, node.id, evaluationDelivery(node.fen, i === 0 ? scores.before : scores.after));
    const backend = await historicalInspectorFixture({ run, preserveRun: true, authenticatedRest: true,
      ...(origin === "offline" ? { offlineGrade: { black, before: scores.before, after: scores.after, bound: { kind: "movetime", requestedMs: 100 } } } : {}) });
    const original = JSON.stringify(await backend.savedRun()), f = mounted(backend, { restModules: true }); await ready(f.target);
    await vi.waitFor(() => expect(f.target.querySelector('[data-module="postcommit_nudge"] [data-presented]')).not.toBeNull());
    const i = f.onModuleQuery.mock.calls.map(([body]) => (body.query as { timing?: string }).timing).lastIndexOf("post_commit");
    const body = await f.onModuleQuery.mock.results[i]!.value as { page: { effectiveConfigDigest: string } };
    const page = parseModuleQueryPage(body, { runId: backend.run.id, subjectNodeId: backend.run.activeCursor.nodeId, finalDigest: body.page.effectiveConfigDigest });
    const packet = page.packets.find(row => row.module === "postcommit_nudge")!;
    const item = packet.items.find(row => row.adapter.projection.id === "derived.grade.move_quality")!;
    expect(item).not.toBeUndefined();
    if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== "play.move_quality_summary@1") throw Error("Expected exact current summary");
    expect(item.component.operand.operands).toMatchObject({ arm: scores.arm, instrument: { origin: origin === "offline" ? "offline_engine" : "provider_delivery" } });
    const full = presentedGradeMeasurementReport(item); if (full?.kind !== "available") throw Error("Expected whole report");
    const seat = f.target.querySelector<HTMLElement>('[data-module="postcommit_nudge"]')!;
    const toggle = seat.querySelector<HTMLButtonElement>('.seat-row')!; if (toggle.getAttribute("aria-expanded") !== "true") { toggle.click(); await tick(); }
    expect(seat.textContent).not.toContain(full.sentence);
    const http = await backend.httpCalls();
    [...seat.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "How measured")!.click(); await tick(); await tick();
    expect(seat.querySelector('[aria-label="Measurement details"] p')?.textContent).toBe(full.sentence);
    expect(await backend.httpCalls()).toEqual(http); expect((await backend.stats()).providerCalls).toEqual([]);
    expect(JSON.stringify(await backend.savedRun())).toBe(original);
    expect(f.onMove).not.toHaveBeenCalled(); expect(f.onRewind).not.toHaveBeenCalled();
  });
});

describe("D4061 settled preset removal", () => {
  for (const black of [false, true]) for (const setup of [
    { name: "quiet grade", fen: "7k/p7/8/8/8/2P1PN2/6P1/K7 w - - 0 1", moves: ["f3d4"], selected: true },
    { name: "completed overload", fen: "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", moves: ["b8a7", "c6a7", "e1e7"], selected: false },
    { name: "castling", fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", moves: ["e1g1"], selected: true },
  ]) {
    it(`D3767 current ${setup.name} grade selection reaches actual cookie REST and mounted Nudge, mirrored=${black}`, async () => {
      vi.stubGlobal("innerWidth", 1440); vi.stubGlobal("innerHeight", 1000);
      const fen = black ? mirrorSemanticFen(setup.fen, "color_and_vertical") : setup.fen;
      let run = modernRun(fen);
      for (const [index, move] of setup.moves.entries()) run = commitMove(run, black ? mirrorSemanticUci(move, "color_and_vertical") : move, { at, actor: index % 2 === 0 ? "user" : "system" }).run;
      const path = branchPath(run, run.activeCursor.branchId);
      for (const [index, node] of path.entries()) run = attachDelivery(run, node.id, evaluationDelivery(node.fen, index === path.length - 1 ? "cp 200" : "cp 0"));
      run = revealFeedback(run, at).run;
      const backend = await historicalInspectorFixture({ run, preserveRun: true, authenticatedRest: true }), saved = JSON.stringify(await backend.savedRun());
      const f = mounted(backend, { restModules: true }); await ready(f.target);
      await vi.waitFor(() => expect(f.target.querySelector('[data-module="postcommit_nudge"] [data-presented]')).not.toBeNull());
      const index = f.onModuleQuery.mock.calls.map(([body]) => (body.query as { timing?: string }).timing).lastIndexOf("post_commit");
      expect(index).toBeGreaterThanOrEqual(0);
      const body = await f.onModuleQuery.mock.results[index]!.value as { page: { effectiveConfigDigest: string } };
      const page = parseModuleQueryPage(body, { runId: run.id, subjectNodeId: run.activeCursor.nodeId, finalDigest: body.page.effectiveConfigDigest });
      const packet = page.packets.find(packet => packet.module === "postcommit_nudge")!;
      const grade = packet.items.filter(item => item.adapter.projection.id === "derived.grade.move_quality");
      expect(grade).toHaveLength(setup.selected ? 1 : 0);
      const seat = f.target.querySelector<HTMLElement>('[data-module="postcommit_nudge"]')!;
      const toggle = seat.querySelector<HTMLButtonElement>('.seat-row')!;
      if (toggle.getAttribute("aria-expanded") !== "true") { toggle.click(); await tick(); }
      expect(seat.querySelectorAll('[data-presented]')).toHaveLength(packet.items.length);
      for (const item of packet.items) expect(seat.textContent).toContain(presentedSentence(item));
      if (setup.selected) expect(seat.textContent).toContain("Blunder");
      else expect(seat.textContent).not.toContain("single move-loss convention");
      const http = await backend.httpCalls();
      expect(http.length).toBeGreaterThan(0);
      expect(http.every(call => call.method === "POST" && call.path === `/runs/${run.id}/modules/query` && call.status === 200)).toBe(true);
      if (setup.selected) {
        const full = presentedGradeMeasurementReport(grade[0]!);
        if (full?.kind !== "available") throw Error("Expected complete same-item report");
        expect(seat.textContent).not.toContain(full.sentence);
        const measured = [...seat.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "How measured")!;
        expect(measured).not.toBeUndefined(); measured.click(); await tick(); await tick();
        expect(seat.querySelector('[aria-label="Measurement details"] p')?.textContent).toBe(full.sentence);
        expect(await backend.httpCalls()).toEqual(http); // Local disclosure does no source/provider work.
        await choosePreset(f.target, "quiet"); await ready(f.target); await tick();
        expect(f.target.querySelector('[aria-label="Measurement details"]')).toBeNull();
        expect(f.target.textContent).not.toContain(full.sentence);
      } else expect([...seat.querySelectorAll("button")].some(button => button.textContent === "How measured")).toBe(false);
      expect((await backend.stats()).providerCalls).toEqual([]);
      expect(JSON.stringify(await backend.savedRun())).toBe(saved);
      expect(f.onMove).not.toHaveBeenCalled(); expect(f.onRewind).not.toHaveBeenCalled();
    });
  }
  it("D3979 real cross-tab help changes retire an open active Inspector preview and require fresh demand", async () => {
    vi.stubGlobal("innerWidth", 1440); vi.stubGlobal("innerHeight", 1000);
    const route = "derived.pawn.sequence.contact_timing@3";
    const backend = await historicalInspectorFixture({ run: revealFeedback(recordedSequenceRouteFixture(route), at).run, preserveRun: true, authenticatedRest: true });
    const saved = JSON.stringify(await backend.savedRun()), f = mounted(backend);
    await ready(f.target); await choosePreset(f.target, "analysis"); await ready(f.target);
    const key = workflowPreferenceKey("position"), analysis = f.preferences.get(key)!;
    f.target.querySelector<HTMLButtonElement>('.inspector-entry')!.click(); await tick();
    const browser = () => f.target.querySelector<HTMLElement>('.source-browser');
    const inventory = async () => { await vi.waitFor(() => expect(browser()?.querySelectorAll("nav li")).toHaveLength(8)); };
    const choose = async () => {
      const label = INSPECTOR_SOURCE_LABELS[route];
      let selected = false;
      for (let page = 0; page < Math.ceil(INSPECTOR_SOURCE_TOPICS.length / 8); page++) {
        const control = [...browser()!.querySelectorAll<HTMLButtonElement>('nav button')].find(button => button.textContent?.trim() === label);
        if (control !== undefined) { control.click(); selected = true; break; }
        [...browser()!.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === "Next sources")!.click();
        await tick();
        await vi.waitFor(() => expect(browser()?.textContent).not.toContain("Reading the requested evidence…"));
        await inventory();
      }
      expect(selected).toBe(true);
      await vi.waitFor(() => expect(browser()!.querySelector('[data-component="move_path"] .san')).not.toBeNull());
    };
    await inventory(); await choose();
    const opener = browser()!.querySelector<HTMLButtonElement>('[data-component="move_path"] .san')!;
    opener.click(); await tick(); await tick();
    expect(f.target.querySelector('[aria-label="Line positions"]')).not.toBeNull();
    const eventsSymbol = Object.getOwnPropertySymbols(opener).find(value => value.description === "events")!;
    const events: unknown = Reflect.get(opener, eventsSymbol);
    if (events === null || typeof events !== "object" || !("click" in events) || typeof events.click !== "function") throw Error("Expected original emitted callback");
    const oldOpen = events.click;
    // The modal makes its background inert. This is a supported change from another tab,
    // not a claim that the background preset menu is reachable through the preview modal.
    const changed = JSON.parse(analysis); changed.intent.preset = "quiet";
    f.preferences.set(key, JSON.stringify(changed)); globalThis.dispatchEvent(new StorageEvent("storage", { key }));
    await ready(f.target); await tick(); await tick();
    expect(f.target.querySelector('[data-preset-mode]')?.textContent).toBe("Quiet");
    expect(browser()).toBeNull(); expect(f.target.querySelector('[aria-label="Line positions"]')).toBeNull();
    f.preferences.set(key, analysis); globalThis.dispatchEvent(new StorageEvent("storage", { key }));
    await ready(f.target); await inventory();
    expect(f.target.querySelector('[data-preset-mode]')?.textContent).toBe("Analyze");
    f.target.append(opener);
    const event = new MouseEvent("click", { bubbles: true }); Object.defineProperty(event, "currentTarget", { value: opener });
    oldOpen.call(opener, event); await tick(); await tick();
    expect(f.target.querySelector('[aria-label="Line positions"]')).toBeNull();
    expect(f.onInspectorQuery.mock.calls.filter(([request]) => request.query.view.kind === "source")).toHaveLength(1);
    await choose(); browser()!.querySelector<HTMLButtonElement>('[data-component="move_path"] .san')!.click(); await tick(); await tick();
    expect(f.target.querySelector('[aria-label="Line positions"]')).not.toBeNull();
    expect(f.onInspectorQuery.mock.calls.filter(([request]) => request.query.view.kind === "source")).toHaveLength(2);
    expect(JSON.stringify(await backend.savedRun())).toBe(saved);
    expect((await backend.stats()).providerCalls).toEqual([]);
    expect(f.onMove).not.toHaveBeenCalled(); expect(f.onRewind).not.toHaveBeenCalled();
  });

  it("D4062 rejects malformed action keys before real source acquisition", async () => {
    const backend = await historicalInspectorFixture({ run: modernRun("k7/7K/8/8/N7/3r4/8/3r4 w - - 0 1"), preserveRun: true, hints: true });
    const body = { nodeId: backend.run.activeCursor.nodeId, rung: "pattern", decisionDigest: hintDecisionStamp(backend.run).digest,
      assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }) };
    for (const key of [undefined, null, 42, "", "a".repeat(31), "a".repeat(33), "A".repeat(32), "g".repeat(32)]) {
      const result = await backend.postHint({ ...body, ...(key === undefined ? {} : { clientRequestId: key }) });
      expect(result.status).toBe(400);
    }
    expect(await backend.hintStats()).toMatchObject({ searches: 0, operations: 0 });
  });

  for (const delayed of ["post", "delete"] as const) {
    it(`D4062 a late ${delayed} retires only its action after the same Hint reopens`, async () => {
      vi.stubGlobal("innerWidth", 768); vi.stubGlobal("innerHeight", 1024);
      const backend = await historicalInspectorFixture({ run: modernRun("k7/7K/8/8/N7/3r4/8/3r4 w - - 0 1"), preserveRun: true, hints: true, holdHintSource: true });
      const source = backend.hints!, seen: HintResponse[] = [];
      let releasePost: (() => void) | undefined, releaseDelete: (() => void) | undefined;
      const client = {
        request: vi.fn(async (body: Parameters<GuidedHintClient["request"]>[0]) => {
          const value = await source.request(body); seen.push(value);
          if (delayed === "post" && seen.length === 1) await new Promise<void>(resolve => { releasePost = resolve; });
          return value;
        }),
        poll: vi.fn(source.poll),
        cancel: vi.fn(async (id: string) => {
          if (delayed === "delete") await new Promise<void>(resolve => { releaseDelete = resolve; });
          return source.cancel(id);
        }),
      };
      const f = mounted(backend, { hints: client });
      const openHint = async () => {
        const row = f.target.querySelector<HTMLButtonElement>('[data-module="guided_hint"] .seat-row')!;
        row.click(); await tick();
      };
      try {
        await ready(f.target); await openHint();
        await vi.waitFor(() => expect(seen).toHaveLength(1));
        if (delayed === "delete") await vi.waitFor(() => expect(client.poll).toHaveBeenCalled());
        await choosePreset(f.target, "quiet"); await ready(f.target);
        if (delayed === "delete") await vi.waitFor(() => expect(releaseDelete).toBeDefined());
        await choosePreset(f.target, "guided"); await ready(f.target); await openHint();
        await vi.waitFor(() => expect(seen).toHaveLength(2));
        const [first, second] = seen;
        if (first?.state !== "pending" || second?.state !== "pending") throw Error("Expected actual gated pending operations");
        expect(first.requestId).not.toBe(second.requestId);
        const [a, b] = client.request.mock.calls.map(call => call[0]);
        expect(a!.clientRequestId).toMatch(/^[0-9a-f]{32}$/u);
        expect(b!.clientRequestId).not.toBe(a!.clientRequestId);
        expect(await source.request(b!)).toEqual(second); // Same-action retransmission joins the waiter.
        expect((await backend.hintStats()).operations).toBe(2);
        expect((await backend.hintStats()).searches).toBe(1);
        releasePost?.(); releaseDelete?.();
        await vi.waitFor(() => expect(client.cancel).toHaveBeenCalledExactlyOnceWith(first.requestId));
        await client.cancel.mock.results[0]!.value;
        expect((await backend.hintStats()).operations).toBe(1);
        expect(await source.poll(second.requestId)).toEqual(second);
        await backend.releaseHintSource();
        await vi.waitFor(async () => expect((await source.poll(second.requestId)).state).toBe("available"));
        await vi.waitFor(() => expect(f.target.querySelector('[data-module="guided_hint"] [data-presented]') ?? f.target.querySelector('.hint-sentence')).not.toBeNull());
        expect(client.request).toHaveBeenCalledTimes(2);
        expect(f.onMove).not.toHaveBeenCalled(); expect(f.onRewind).not.toHaveBeenCalled();
      } finally { releasePost?.(); releaseDelete?.(); await backend.releaseHintSource(); }
    });
  }

  for (const black of [false, true]) for (const pendingRetry of [false, true]) {
    it(`removes ${pendingRetry ? "pending Retry" : "populated Nudge"} without losing the tablet default (mirrored=${black})`, async () => {
      vi.stubGlobal("innerWidth", 768); vi.stubGlobal("innerHeight", 1024);
      const fen = "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", move = "e4d5";
      const run = modernRun(black ? mirrorSemanticFen(fen, "color_and_vertical") : fen, [black ? mirrorSemanticUci(move, "color_and_vertical") : move]);
      const backend = await historicalInspectorFixture({ run, preserveRun: true }), original = JSON.stringify(await backend.savedRun());
      const f = mounted(backend, { failed: pendingRetry }); await ready(f.target);
      const seat = () => f.target.querySelector('[data-module="postcommit_nudge"]');
      await vi.waitFor(() => expect(pendingRetry ? seat()?.querySelector('[role="alert"]') : seat()?.querySelector('[data-presented]')).toBeTruthy());
      const selector = seat()!.querySelector<HTMLButtonElement>('.seat-row')!;
      if (selector.getAttribute("aria-expanded") !== "true") { selector.click(); await tick(); }
      expect(f.target.querySelector('#postcommit_nudge-card')?.getAttribute("data-queue-head")).toBe("postcommit_nudge");
      let release: ((value: unknown) => void) | undefined, result: unknown;
      if (pendingRetry) {
        f.onModuleQuery.mockImplementation(() => new Promise(resolve => { release = resolve; }));
        const retry = [...seat()!.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === "Try again")!;
        retry.focus(); retry.click(); await tick();
        result = await backend.modules(f.onModuleQuery.mock.calls[1]![0]);
      }
      const invoker = await choosePreset(f.target, "quiet"); await ready(f.target);
      expect(f.target.querySelector('[data-preset-mode]')?.textContent).toBe("Quiet");
      expect(seat()).toBeNull(); expect(document.activeElement === invoker).toBe(true); defaultHead(f.target);
      release?.(result); await tick(); await tick();
      expect(seat()).toBeNull(); expect(document.activeElement === invoker).toBe(true);
      expect(f.onModuleQuery).toHaveBeenCalledTimes(pendingRetry ? 2 : 1);
      expect(JSON.stringify(await backend.savedRun())).toBe(original);
      expect(f.onMove).not.toHaveBeenCalled(); expect(f.onRewind).not.toHaveBeenCalled();
    });
  }

  for (const state of ["available", "pending", "late-post"] as const) {
    it(`retires a genuine ${state} Hint on Quiet and retains it through temporary compilation`, async () => {
      vi.stubGlobal("innerWidth", 768); vi.stubGlobal("innerHeight", 1024);
      const backend = await historicalInspectorFixture({ run: modernRun("k7/7K/8/8/N7/3r4/8/3r4 w - - 0 1"), preserveRun: true, hints: true, holdHintSource: state !== "available" });
      const source = backend.hints!, original = JSON.stringify(await backend.savedRun()), seen: HintResponse[] = [];
      let releasePost: (() => void) | undefined, holdAuthority = false, releaseAuthority: (() => void) | undefined;
      const authority = async (request: RequestedAssistanceV1) => {
        const value = await backend.authority(request);
        if (holdAuthority) await new Promise<void>(resolve => { releaseAuthority = resolve; });
        return value;
      };
      const client = {
        request: vi.fn(async (body: Parameters<GuidedHintClient["request"]>[0]) => {
          const value = await source.request(body); seen.push(value);
          if (state === "late-post") await new Promise<void>(resolve => { releasePost = resolve; });
          return value;
        }),
        poll: vi.fn(async (id: string) => { const value = await source.poll(id); seen.push(value); return value; }),
        cancel: vi.fn(source.cancel),
      };
      const f = mounted(backend, { hints: client, authority });
      try {
        await ready(f.target);
        const seat = () => f.target.querySelector<HTMLElement>('[data-module="guided_hint"]');
        expect(seat()).not.toBeNull(); seat()!.querySelector<HTMLButtonElement>('.seat-row')!.click(); await tick();
        await vi.waitFor(() => expect(seen.length).toBeGreaterThan(0));
        expect(seen[0]!.state).toBe("pending");
        if (state === "available") {
          await vi.waitFor(() => expect(seen.some(value => value.state === "available")).toBe(true)); await tick();
          const more = seat()!.querySelector<HTMLButtonElement>('.hint-actions button')!;
          expect(more.textContent?.trim()).toBe("A little more"); more.click();
          await vi.waitFor(() => expect(seen.some(value => value.state === "available" && value.delivery.rung === "square")).toBe(true)); await tick();
          const delivered = [...seen].reverse().find(value => value.state === "available" && value.delivery.rung === "square")!;
          if (delivered.state !== "available") throw Error("Actual square hint missing");
          expect(seat()!.textContent).toContain(delivered.delivery.rendered.sentence);
          expect(delivered.delivery.marks.rung).toBe("square");
          const retained = seat(), posts = client.request.mock.calls.length;
          holdAuthority = true;
          await choosePreset(f.target, "support");
          await vi.waitFor(() => expect(releaseAuthority).toBeDefined());
          expect(seat()).toBe(retained); expect(client.cancel).not.toHaveBeenCalled(); expect(client.request).toHaveBeenCalledTimes(posts);
          holdAuthority = false; releaseAuthority!(); await ready(f.target); await tick();
          expect(seat()).toBe(retained); expect(seat()!.textContent).toContain(delivered.delivery.rendered.sentence);
          expect(client.cancel).not.toHaveBeenCalled(); expect(client.request).toHaveBeenCalledTimes(posts);
        } else if (state === "pending") await vi.waitFor(() => expect(client.poll).toHaveBeenCalled());
        const invoker = await choosePreset(f.target, "quiet"); await ready(f.target);
        expect(seat()).toBeNull(); expect(document.activeElement === invoker).toBe(true); defaultHead(f.target);
        releasePost?.(); await tick(); await tick();
        if (state !== "available") {
          await vi.waitFor(() => expect(client.cancel).toHaveBeenCalledTimes(1));
          await client.cancel.mock.results[0]!.value;
          expect((await backend.hintStats()).operations).toBe(0);
        }
        expect(seat()).toBeNull(); expect(document.activeElement === invoker).toBe(true);
        expect((await backend.hintStats()).searches).toBe(1);
        expect(JSON.stringify(await backend.savedRun())).toBe(original);
        expect(f.onMove).not.toHaveBeenCalled(); expect(f.onRewind).not.toHaveBeenCalled();
      } finally { holdAuthority = false; releaseAuthority?.(); releasePost?.(); await backend.releaseHintSource(); }
    });
  }
});
