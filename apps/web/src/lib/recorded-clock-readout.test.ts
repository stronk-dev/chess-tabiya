// @vitest-environment happy-dom
// Actual imported clock/service/view operands mounted in the historical seat. No native layout proof.
import { tick, type ComponentProps } from "svelte";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import type { RecordedClockView } from "../../../../packages/runtime/src/recorded-clock-view.js";
import { parseRecordedClockView } from "../../../../packages/runtime/src/recorded-clock-view.js";
import { evidenceDigest } from "../../../../packages/runtime/src/evidence-contract.js";
import { factStatementOperand, presentationDigest } from "../../../../packages/runtime/src/presentation-contract.js";
import { createComponentTestScope } from "./component-test-lifecycle.js";
import ClockReadout from "./ClockReadout.svelte";
import { assertReviewMapResponse } from "./review-response.js";
import { saveWorkflowPreference, workflowPreferenceKey } from "./assistance-preference.js";
import { historicalInspectorFixture, disposeInspectorBrowserFixtures, terminateInspectorBrowserFixture } from "./inspector-source-browser.test-support.js";

const scope = createComponentTestScope();
type Props = ComponentProps<typeof ClockReadout>;
afterEach(async () => { await scope.cleanup(); await disposeInspectorBrowserFixtures(); vi.restoreAllMocks(); document.body.replaceChildren(); });
afterAll(async () => { await terminateInspectorBrowserFixture(); });
function deferred<T>() { let resolve!: (value: T) => void, reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
async function data(pgn = '[TimeControl "300+2"]\n\n1. e4 {[%clk 0:04:59.123]} e5 {[%clk 0:04:57]} *') {
  const f = await historicalInspectorFixture({ authenticatedRest: true, clockPgn: pgn, side: "black" }), run = f.run;
  if (f.api === undefined) throw new Error("Actual cookie REST fixture required");
  await f.api.reveal(run.id, "browser-writer");
  const review: unknown = await f.api.review(run.id, run.branches[0]!.id);
  assertReviewMapResponse(review, { runId: run.id, branchId: run.branches[0]!.id });
  const first = run.nodes[1]!.id, second = run.nodes[2]!.id;
  const page = (nodeId: string) => f.api!.recordedClock(run.id, run.branches[0]!.id, nodeId, new AbortController().signal);
  return { review, first, second, page };
}
async function mount(props: Props) {
  const root = document.createElement("div"); document.body.append(root);
  const instance = scope.createClassComponent({ component: ClockReadout, target: root, props }); await tick();
  return { root, instance };
}

describe("fixed historical recorded clock readout", () => {
  it("shows exact original remaining/use/control through registered components without stealing focus or ticking", async () => {
    const f = await data(), outside = document.createElement("button"); document.body.append(outside); outside.focus();
    const loader = vi.fn(async (_review, nodeId) => f.page(nodeId));
    const { root } = await mount({ review: f.review, nodeId: f.first, accessIdentity: "owner", load: loader });
    await vi.waitFor(() => expect(root.querySelector('[data-recorded-clock="ready"]')).not.toBeNull());
    expect(root.textContent).toContain("White: 0:04:59.123 remaining after this move.");
    expect(root.textContent).toContain("recorded clock use 0:00:02.877");
    expect(root.textContent).toContain("Declared control: 300 seconds + 2 seconds per move.");
    expect(document.activeElement).toBe(outside);
    const before = root.textContent; await tick(); expect(root.textContent).toBe(before); expect(loader).toHaveBeenCalledTimes(1);
    expect(root.querySelectorAll("svg,canvas,cg-board")).toHaveLength(0);
  });

  it.each(["selection", "review_object", "access", "disabled", "unmount"] as const)("retires late success/error after %s and cannot resurrect after returning", async change => {
    const f = await data(), waits: ReturnType<typeof deferred<RecordedClockView>>[] = [], signals: AbortSignal[] = [];
    const loader = vi.fn((_review, _nodeId, signal: AbortSignal) => { const held = deferred<RecordedClockView>(); waits.push(held); signals.push(signal); return held.promise; });
    const { root, instance } = await mount({ review: f.review, nodeId: f.first, accessIdentity: "owner", load: loader });
    expect(loader).toHaveBeenCalledTimes(1);
    if (change === "selection") instance.$set({ nodeId: f.second });
    if (change === "review_object") instance.$set({ review: structuredClone(f.review) });
    if (change === "access") instance.$set({ accessIdentity: "changed-account-or-help" });
    if (change === "disabled") instance.$set({ enabled: false });
    if (change === "unmount") instance.$destroy();
    await tick(); expect(signals[0]!.aborted).toBe(true);
    waits[0]!.resolve(await f.page(f.first)); await tick(); await tick();
    expect(root.textContent).not.toContain("0:04:59.123");
    expect(root.textContent).not.toContain("could not be loaded");
    if (change !== "unmount") {
      instance.$set({ review: f.review, nodeId: f.first, accessIdentity: "owner", enabled: true }); await tick();
      expect(root.textContent).not.toContain("0:04:59.123");
      const retired = waits.at(-1)!, index = waits.length - 1;
      instance.$set({ accessIdentity: "final-owner" }); await tick(); expect(signals[index]!.aborted).toBe(true);
      retired.reject(new Error("late retired request")); await tick(); await tick();
      expect(root.textContent).not.toContain("could not be loaded");
    }
  });

  it("keeps invalid, missing and control-absent frames distinct and never turns missing use into zero", async () => {
    const f = await data("1. e4 {[%clk nonsense]} e5 *"), { root, instance } = await mount({ review: f.review, nodeId: f.first, accessIdentity: "owner",
      load: async (_review, nodeId) => f.page(nodeId) });
    await vi.waitFor(() => expect(root.textContent).toContain("invalid or repeated"));
    expect(root.textContent).toContain("No time control was declared."); expect(root.textContent).toContain("clock use is unavailable");
    expect(root.textContent).not.toContain("0:00:00.000");
    instance.$set({ nodeId: f.second }); await tick();
    await vi.waitFor(() => expect(root.textContent).toContain("no clock annotation supplied"));
  });

  it("binds the actual emitted Retry handler to its failed control through a newer failed owner", async () => {
    const f = await data(), waiting = deferred<RecordedClockView>(); let calls = 0;
    const loader = vi.fn(() => ++calls <= 2 ? Promise.reject(new Error(`offline${calls}`)) : waiting.promise);
    const { root, instance } = await mount({ review: f.review, nodeId: f.first, accessIdentity: "owner", load: loader });
    await vi.waitFor(() => expect(root.querySelector("button")).not.toBeNull());
    const retry = root.querySelector<HTMLButtonElement>("button")!;
    const handlers = Object.getOwnPropertySymbols(retry).flatMap(symbol => {
      const value: unknown = symbol.description === "events" ? Reflect.get(retry, symbol) : undefined;
      return value !== null && typeof value === "object" && "click" in value && typeof value.click === "function" ? [value.click] : [];
    });
    expect(handlers).toHaveLength(1);
    instance.$set({ review: structuredClone(f.review) }); await tick();
    await vi.waitFor(() => { expect(loader).toHaveBeenCalledTimes(2); expect(root.querySelector("button")).not.toBeNull(); });
    const current = root.querySelector<HTMLButtonElement>("button")!; expect(current).not.toBe(retry);
    document.body.append(retry);
    const event = new MouseEvent("click", { bubbles: true }); Object.defineProperty(event, "currentTarget", { value: retry });
    handlers[0]!.call(retry, event); await tick();
    expect(loader).toHaveBeenCalledTimes(2);
    current.click(); await tick(); expect(loader).toHaveBeenCalledTimes(3);
    waiting.resolve(await f.page(f.first)); await tick(); await tick();
    expect(root.textContent).toContain("0:04:59.123");
  });

  it("states native clocks honestly without collecting an imported clock source", async () => {
    const f = await data(), loader = vi.fn(async () => f.page(f.first));
    const { root } = await mount({ review: { ...f.review, source: { kind: "native" } }, nodeId: f.first, accessIdentity: "owner", load: loader });
    expect(root.textContent).toContain("Live clock use is not recorded."); expect(loader).not.toHaveBeenCalled();
  });

  it("retires observed cross-tab and actual same-document preference writes before accepting late results", async () => {
    const f = await data(), waits: ReturnType<typeof deferred<RecordedClockView>>[] = [], signals: AbortSignal[] = [];
    const loader = vi.fn((_review, _nodeId, signal: AbortSignal) => { const held = deferred<RecordedClockView>(); waits.push(held); signals.push(signal); return held.promise; });
    const { root } = await mount({ review: f.review, nodeId: f.first, accessIdentity: "owner", load: loader });
    window.dispatchEvent(new StorageEvent("storage", { key: "unrelated.preference" })); await tick();
    expect(loader).toHaveBeenCalledTimes(1); expect(signals[0]!.aborted).toBe(false);
    window.dispatchEvent(new StorageEvent("storage", { key: workflowPreferenceKey(f.review.workflowContext) }));
    expect(signals[0]!.aborted).toBe(true); await tick(); expect(loader).toHaveBeenCalledTimes(2);
    waits[0]!.resolve(await f.page(f.first)); await tick(); await tick(); expect(root.textContent).not.toContain("0:04:59.123");
    expect(saveWorkflowPreference(f.review.workflowContext, { version: 2, assistanceHead: 4, intent: { kind: "unset" } }, window.localStorage)).toBe(true);
    expect(signals[1]!.aborted).toBe(true); await tick(); expect(loader).toHaveBeenCalledTimes(3);
    waits[1]!.reject(new Error("retired help response")); await tick(); await tick();
    expect(root.textContent).not.toContain("could not be loaded");
  });

  it("rejects a coherent redigested different legal edge relabelled to the selected move ids", async () => {
    const selected = await data(), different = await data('[TimeControl "300+2"]\n\n1. d4 {[%clk 0:04:59.123]} d5 {[%clk 0:04:57]} *');
    const wrong = JSON.parse(JSON.stringify(await different.page(different.first))), q = { runId: selected.review.runId, branchId: selected.review.branchId, nodeId: selected.first };
    const subject = { ...wrong.reading.value.subject, ...q, sourceNodeId: selected.first, eventHead: { ...wrong.subject.eventHead, seq: selected.review.decision.eventHeadSeq } };
    wrong.subject = { kind: "resolved", ...subject }; wrong.reading.value.subject = subject; wrong.use.value.subject = subject;
    const parent = selected.review.rows[0]!.entryNodeId;
    wrong.reading.value.original.beforeNodeId = parent; wrong.use.value.decision.nodeId = parent; wrong.use.value.previous.nodeId = parent;
    for (const [index, row] of wrong.presentation.items.entries()) {
      const payload = index === 0 ? wrong.reading.value : wrong.use.value;
      row.evidenceRef.evidenceDigest = `sha256:${evidenceDigest(payload)}`;
      row.component.operand = index === 0 ? factStatementOperand("review.clock_remaining@1", "recorded_run", "recorded-run@1", payload)
        : factStatementOperand("review.clock_used@1", "recorded_run", "clock-spend-input@1", payload);
      row.componentDigest = presentationDigest("presentation.component@1", { evidenceRef: row.evidenceRef, adapter: row.adapter, component: row.component });
    }
    wrong.presentation.digest = presentationDigest("presentation.receipt@1", wrong.presentation.items);
    // The body is internally coherent; only the actual known selected-row join can reject it.
    const coherent = parseRecordedClockView(wrong, q);
    const { root } = await mount({ review: selected.review, nodeId: selected.first, accessIdentity: "owner", load: async () => coherent });
    await vi.waitFor(() => expect(root.textContent).toContain("could not be loaded"));
    expect(root.textContent).not.toContain("0:04:59.123");
  });
});
