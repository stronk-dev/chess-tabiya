// @vitest-environment happy-dom
// source-safe §6/D4185: actual original stored edges → authenticated cookie REST → strict
// receiver → selected module DOM. Chessground alone is replaced (canvas is not this test).
// Item-scoped Inspector actions and real browser geometry remain separate D4188 obligations.
import { afterAll, afterEach, expect, it, vi } from "vitest";
import { tick, type ComponentProps } from "svelte";
import { commitMove, exactLegalMoves, revealFeedback, rewind } from "@chess-tabiya/runtime";
import { parsePresentationReceipt, presentedNativeFactReport, presentedSentence } from "../../../../packages/runtime/src/presentation-contract.js";
import { recordedSequenceWindowFixture } from "../../../../packages/runtime/src/testing/recorded-sequence-window-fixture.js";
import { CURRENT_NATIVE_MODULE_CASES } from "../../../../packages/runtime/src/testing/current-native-module-fixtures.js";
import { historicalInspectorFixture, disposeInspectorBrowserFixtures, terminateInspectorBrowserFixture } from "./inspector-source-browser.test-support.js";
import { createComponentTestScope } from "./component-test-lifecycle.js";
import { workflowPreferenceKey } from "./assistance-preference.js";
import * as moduleResponses from "./module-query-response.js";
import { assertReviewMapResponse } from "./review-response.js";
import DrillScreen from "./DrillScreen.svelte";
import ReviewMapScreen from "./ReviewMapScreen.svelte";

vi.mock("@lichess-org/chessground", () => ({ Chessground: () => ({ state: { dom: { bounds: { clear() {} } } }, set: vi.fn(), destroy: vi.fn() }) }));
const scope = createComponentTestScope();
afterEach(async () => {
  try { await scope.cleanup(); } finally { document.body.replaceChildren(); vi.restoreAllMocks(); await disposeInspectorBrowserFixtures(); }
});
afterAll(async () => { await terminateInspectorBrowserFixture(); });
const at = "2026-11-10T02:00:00.000Z";
const key = (ref: { readonly id: string; readonly version: number }) => `${ref.id}@${ref.version}`;

function retainedClick(button: HTMLButtonElement) {
  const callbacks = Object.getOwnPropertySymbols(button).flatMap(symbol => {
    const value = symbol.description === "events" ? Reflect.get(button, symbol) : null;
    return value !== null && typeof value === "object" && typeof value.click === "function" ? [value.click] : [];
  });
  expect(callbacks).toHaveLength(1);
  return (target: Element) => {
    target.append(button);
    const event = new MouseEvent("click", { bubbles: true }); Object.defineProperty(event, "currentTarget", { value: button });
    callbacks[0]!.call(button, event);
    button.remove(); // Remove only the detached stale control this probe reinserted.
  };
}
async function inspectOriginal(seat: Element, item: Parameters<typeof presentedNativeFactReport>[0]) {
  const line = [...seat.querySelectorAll('p[data-component="fact_statement"]')].find(node => node.textContent === presentedSentence(item))!;
  expect(line).toBeDefined();
  const controls = line.parentElement!, button = controls.querySelector<HTMLButtonElement>("button")!;
  expect(button?.textContent).toBe("Inspect this fact");
  const full = presentedNativeFactReport(item);
  if (full?.kind !== "available") throw new Error("Expected the original full source text");
  expect(controls.querySelector('[aria-label="Fact details"]')).toBeNull();
  expect(controls.textContent).not.toContain(full.sentence);
  const oldOpen = retainedClick(button);
  button.focus(); button.click(); await tick();
  const report = controls.querySelector('[aria-label="Fact details"]')!;
  expect(report?.querySelector("p")?.textContent).toBe(full.sentence);
  expect(report.id).toBe(button.getAttribute("aria-controls"));
  expect(report.textContent).not.toMatch(/rules\.|derived\.|membership_changed|half_open_(?:white|black)/u);
  return { oldOpen, oldClose: retainedClick(report.querySelector<HTMLButtonElement>("button")!) };
}

for (const [projection, fen, move] of CURRENT_NATIVE_MODULE_CASES) for (const black of [false, true]) {
  it(`Nudge selects and renders ${projection} through actual cookie REST, mirrored=${black}`, async () => {
    const run = revealFeedback(recordedSequenceWindowFixture({ fen, moves: [move] }, black, `native-seat-${projection}-${black}`), at).run;
    const f = await historicalInspectorFixture({ run, authenticatedRest: true, preserveRun: true });
    const saved = JSON.stringify(await f.savedRun()), received = vi.spyOn(moduleResponses, "parseModuleQueryPage");
    const onModuleQuery = vi.fn((body: Parameters<NonNullable<ComponentProps<typeof DrillScreen>["onModuleQuery"]>>[0]) => f.api!.modules(run.id, body));
    const target = document.createElement("div"); document.body.append(target);
    const component = scope.createClassComponent({ component: DrillScreen, target, props: {
      snapshot: { run: f.run, access: "writer", pendingEvidence: 0, withheld: false },
      onAssistanceQuery: f.authority, onModuleQuery,
      assistanceStorage: { getItem: name => name === workflowPreferenceKey("position") ? JSON.stringify({ version: 2, assistanceHead: 4,
        intent: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }) : null, setItem: vi.fn() },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(),
      onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion: () => () => {},
    } });
    await vi.waitFor(() => expect(document.querySelector('[data-module="postcommit_nudge"] [data-presented]')).not.toBeNull());
    const pages = received.mock.results.filter(result => result.type === "return").map(result => result.value);
    const packet = pages.flatMap(page => page.packets).find(packet => packet.module === "postcommit_nudge")!;
    expect(packet).toBeDefined(); expect(packet.items.length).toBeLessThanOrEqual(2);
    const originals = packet.items.filter(item => key(item.adapter.projection) === projection);
    expect(originals.length, "The actual strict selected packet must contain this source").toBeGreaterThan(0);
    const seat = document.querySelector('[data-module="postcommit_nudge"]')!;
    for (const item of originals) expect(seat.textContent).toContain(presentedSentence(item));
    expect(seat.textContent).not.toMatch(/rules\.|derived\.|membership_changed|half_open_(?:white|black)/u);
    const beforeInspect = (await f.httpCalls()).length;
    const detail = await inspectOriginal(seat, originals[0]!);
    expect((await f.httpCalls()).length).toBe(beforeInspect);
    const calls = await f.httpCalls();
    expect(calls.some(call => call.path.endsWith("/modules/query") && call.status === 200)).toBe(true);
    expect((await f.stats()).providerCalls).toEqual([]); expect(JSON.stringify(await f.savedRun())).toBe(saved);
    const root = rewind(f.run, f.run.nodes[0]!.id, at).run;
    await f.publish(root); component.$set({ snapshot: { run: root, access: "writer", pendingEvidence: 0, withheld: false } }); await tick();
    await vi.waitFor(() => expect(document.querySelector('[data-module="postcommit_nudge"] [data-presented]')).toBeNull());
    expect(document.querySelector('[aria-label="Fact details"]')).toBeNull();
    detail.oldOpen(target); detail.oldClose(target); await tick();
    expect(document.querySelector('[aria-label="Fact details"]')).toBeNull();
    expect(onModuleQuery.mock.settledResults.every(result => result.type === "fulfilled")).toBe(true);
  });

  it(`Review renders selected ${projection} through actual cookie REST, mirrored=${black}`, async () => {
    const initial = recordedSequenceWindowFixture({ fen, moves: [move] }, black, `native-review-${projection}-${black}`);
    const subjectNodeId = initial.activeCursor.nodeId, reply = exactLegalMoves(initial.nodes.at(-1)!.fen)[0];
    expect(reply).toBeDefined();
    const run = revealFeedback(commitMove(initial, reply!.uci, { actor: "system", at }).run, at).run;
    const f = await historicalInspectorFixture({ run, authenticatedRest: true, preserveRun: true, sharedViewer: true });
    const viewer = await f.api!.session();
    await f.api!.updateGrants(run.id, { op: "grant", handle: viewer.handle, role: "spectator" }, "browser-writer");
    const saved = JSON.stringify(await f.savedRun()), review = await f.api!.review(run.id, run.activeCursor.branchId);
    assertReviewMapResponse(review, { runId: run.id });
    expect(review.viewer.mayWrite).toBe(false);
    const selected = review.rows.find(row => row.nodeId === subjectNodeId)!;
    expect(selected).toBeDefined();
    const originals = parsePresentationReceipt(selected.packet).filter(item => key(item.adapter.projection) === projection);
    expect(originals.length, "The actual full Review packet must contain this source").toBeGreaterThan(0);
    const target = document.createElement("div"); document.body.append(target);
    const component = scope.createClassComponent({ component: ReviewMapScreen, target, props: { review, readActive: true, initialNodeId: selected.nodeId, onRetry: vi.fn(), onExport: vi.fn() } });
    await tick();
    const facts = document.querySelector('[data-review-surface="review_map"] .evidence')!;
    expect(facts).not.toBeNull();
    for (const item of originals) expect(facts.textContent).toContain(presentedSentence(item));
    expect(facts.textContent).not.toMatch(/rules\.|derived\.|membership_changed|half_open_(?:white|black)/u);
    const beforeInspect = (await f.httpCalls()).length;
    const detail = await inspectOriginal(facts, originals[0]!);
    expect((await f.httpCalls()).length).toBe(beforeInspect);
    expect((await f.httpCalls()).some(call => call.path.includes("/review") && call.status === 200)).toBe(true);
    expect((await f.stats()).providerCalls).toEqual([]); expect(JSON.stringify(await f.savedRun())).toBe(saved);
    const next = review.rows.find(row => row.nodeId === run.activeCursor.nodeId)!;
    expect(next).toBeDefined();
    document.querySelector<HTMLButtonElement>('[data-review-surface="review_map"] .nav button:last-child')!.click(); await tick();
    expect(document.querySelector('[aria-label="Fact details"]')).toBeNull();
    detail.oldOpen(target); detail.oldClose(target); await tick();
    expect(document.querySelector('[aria-label="Fact details"]')).toBeNull();
    const nextBindings = parsePresentationReceipt(next.packet).flatMap(item => item.component.id === "fact_statement" ? [item.component.operand.binding] : []);
    expect(nextBindings.length, "The next legal row must actually render source facts").toBeGreaterThan(0);
    const nextSentences = parsePresentationReceipt(next.packet).filter(item => item.component.id === "fact_statement").map(presentedSentence);
    const initialSentences = parsePresentationReceipt(selected.packet).filter(item => item.component.id === "fact_statement").map(presentedSentence);
    expect(nextSentences).not.toEqual(initialSentences);
    expect([...document.querySelectorAll('[data-review-surface="review_map"] .evidence p[data-component="fact_statement"]')].map(node => node.textContent)).toEqual(nextSentences);
    expect([...document.querySelectorAll('[data-review-surface="review_map"] .evidence [data-component="fact_statement"]')].map(node => node.getAttribute("data-binding"))).toEqual(nextBindings);
    // Return to the known native source row before testing read access restoration.
    target.querySelector<HTMLButtonElement>('[data-review-surface="review_map"] .nav button:first-child')!.click(); await tick();
    // The actual shared viewer may inspect despite mayWrite=false; read revocation retires it.
    component.$set({ readActive: false }); await tick();
    expect([...target.querySelectorAll("button")].some(button => button.textContent === "Inspect this fact")).toBe(false);
    detail.oldOpen(target); await tick(); expect(target.querySelector('[aria-label="Fact details"]')).toBeNull();
    component.$set({ readActive: true }); await tick();
    expect([...target.querySelectorAll("button")].some(button => button.textContent === "Inspect this fact")).toBe(true);
    expect(JSON.stringify(await f.savedRun())).toBe(saved);
  });
}
