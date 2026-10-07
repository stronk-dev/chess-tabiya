// @vitest-environment happy-dom
// rfc/hint-distance.md §7 — the web client and rail seat contracts (criteria 11 and 12, web arm).

import { mount, tick, unmount } from "svelte";
import { SvelteMap } from "svelte/reactivity";
import { afterEach, describe, expect, it, vi } from "vitest";

import { compileAssistanceRequest, hintDecisionStamp, hintReceiptDigest, type DrillRun, type HintDeliveryReceipt, type HintResponse, type HintRung } from "@chess-tabiya/runtime";

import { ApiError, DrillApi, type GuidedHintClient, type HintRequestBody } from "./api.js";
import GuidedHintSeat from "./GuidedHintSeat.svelte";
import { PLAY_SEAT_MODULES, toggleExpanded } from "./module-seats.js";

const revealedRun = (id = "hint-run", seq = 2): DrillRun => ({
  id,
  feedbackPolicy: "attempt_end",
  events: [{ seq: 1, type: "run.created", at: "2026-09-24T12:00:00.000Z", data: {} }, { seq, type: "feedback.revealed", at: "2026-09-24T12:00:01.000Z", data: { nodeId: "n0" } }],
  nodes: [],
  branches: [],
  activeCursor: { branchId: "main", nodeId: "n0" },
}) as unknown as DrillRun;

const SENTENCES: Readonly<Record<HintRung, string>> = {
  pattern: "A Mock Stockfish mock-1 search from here (depth 12) finds a double attack for you.",
  square: "A Mock Stockfish mock-1 search from here (depth 12) finds a double attack for you. It involves d1 and d3.",
  piece: "piece", distance: "distance", move: "move",
};

function receipt(run: DrillRun, rung: HintRung): HintDeliveryReceipt {
  const marks = rung === "pattern" ? { rung } : { rung, squares: ["d1", "d3"] };
  const body = {
    version: 1 as const, requestId: `${rung === "pattern" ? "a" : "b"}`.repeat(32), runId: run.id, decision: hintDecisionStamp(run), rung, family: "double_attack" as const,
    projectionId: `derived.hint.disclosure.double_attack.${rung}` as const, disclosureDigest: "c".repeat(64), manifestDigest: "d".repeat(64),
    rendered: { source: "deterministic" as const, sentence: SENTENCES[rung], voice: { state: "not_requested" as const } }, marks,
  };
  return { ...body, receiptDigest: hintReceiptDigest(body as never) } as HintDeliveryReceipt;
}

function target(): HTMLElement {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
}

afterEach(() => document.body.replaceChildren());

it("Guided Hint shares the one-expanded authority without entering the module-packet protocol", () => {
  expect(toggleExpanded("theory_breadcrumb", "guided_hint")).toBe("guided_hint");
  expect(toggleExpanded("guided_hint", "theory_breadcrumb")).toBe("theory_breadcrumb");
  expect(toggleExpanded("guided_hint", "guided_hint")).toBeUndefined();
  expect(PLAY_SEAT_MODULES).not.toContain("guided_hint");
});

describe("DrillApi Guided Hint wire", () => {
  it("POSTs the decision with the writer header, polls and cancels one exact id, and refuses a malformed envelope", async () => {
    const run = revealedRun();
    const calls: { url: string; method: string; writer: string | null; body: unknown }[] = [];
    const responses: unknown[] = [
      { hint: { state: "pending", requestId: "a".repeat(32), rung: "pattern" } },
      { hint: { state: "available", delivery: receipt(run, "pattern") } },
      { hint: { state: "cancelled", requestId: "a".repeat(32), rung: "pattern" } },
      { hint: { state: "available", delivery: { ...receipt(run, "pattern"), seal: true } } },
      { hint: { state: "pending", requestId: "a".repeat(32), rung: "pattern" }, extra: 1 },
    ];
    const api = new DrillApi("", async (input, init) => {
      calls.push({ url: String(input), method: init?.method ?? "GET", writer: new Headers(init?.headers).get("x-writer-id"), body: init?.body === undefined ? undefined : JSON.parse(String(init.body)) });
      return new Response(JSON.stringify(responses.shift()), { status: 200, headers: { "content-type": "application/json" } });
    });
    const body: HintRequestBody = { nodeId: "n0", rung: "pattern", decisionDigest: hintDecisionStamp(run).digest, assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }) };
    expect(await api.hint("hint-run", body, "writer-1")).toEqual({ state: "pending", requestId: "a".repeat(32), rung: "pattern" });
    expect((await api.hintPoll("hint-run", "a".repeat(32))).state).toBe("available");
    expect((await api.hintCancel("hint-run", "a".repeat(32))).state).toBe("cancelled");
    expect(calls.map((call) => [call.method, call.url, call.writer])).toEqual([
      ["POST", "/runs/hint-run/hints", "writer-1"],
      ["GET", `/runs/hint-run/hints/${"a".repeat(32)}`, null],
      ["DELETE", `/runs/hint-run/hints/${"a".repeat(32)}`, null],
    ]);
    // The body carries a decision, a rung and stage-1 intent — never a ceiling, source or projection.
    expect(Object.keys(calls[0]!.body as object).sort()).toEqual(["assistance", "decisionDigest", "nodeId", "rung"]);
    await expect(api.hintPoll("hint-run", "a".repeat(32))).rejects.toThrow(/HINT_EXCHANGE_INVALID/u);
    await expect(api.hintPoll("hint-run", "a".repeat(32))).rejects.toThrow(/malformed/u);
  });
});

describe("GuidedHintSeat", () => {
  it.each([true, false])("does not request until the current decision is ready (expanded %s)", async expanded => {
    const states = new SvelteMap<string, boolean>([["ready", false]]);
    const run = revealedRun();
    const request = vi.fn<GuidedHintClient["request"]>(async () => ({ state: "available", delivery: receipt(run, "pattern") }));
    const component = mount(GuidedHintSeat, { target: target(), props: {
      run, ceiling: "distance", canWrite: true, client: { request, poll: vi.fn(), cancel: vi.fn() }, assistanceRequest,
      get decisionReady() { return states.get("ready")!; }, expanded, onToggle: vi.fn(),
    } });
    await settle();
    const button = document.querySelector<HTMLButtonElement>(expanded ? ".hint-actions button" : ".seat-row")!;
    expect(button.disabled).toBe(true);
    if (!expanded) expect(document.getElementById(button.getAttribute("aria-describedby")!)?.textContent).toContain("Wait for this position");
    button.click(); await settle();
    expect(request).not.toHaveBeenCalled();
    expect(document.querySelector(".hint-actions")?.textContent).toContain("Wait for this position and its help settings to finish updating.");
    states.set("ready", true); await settle();
    expect(request).not.toHaveBeenCalled(); // Readiness itself never asks.
    expect(button.disabled).toBe(false);
    button.click(); await settle();
    expect(request).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ rung: "pattern", decisionDigest: hintDecisionStamp(run).digest }));
    await unmount(component);
  });

  it("temporary readiness loss preserves the delivered rung and requires another learner request", async () => {
    const states = new SvelteMap<string, boolean>([["ready", true]]);
    const run = revealedRun();
    const request = vi.fn<GuidedHintClient["request"]>(async body => ({ state: "available", delivery: receipt(run, body.rung) }));
    const component = mount(GuidedHintSeat, { target: target(), props: {
      run, ceiling: "distance", canWrite: true, client: { request, poll: vi.fn(), cancel: vi.fn() }, assistanceRequest,
      get decisionReady() { return states.get("ready")!; },
    } });
    await settle();
    const button = document.querySelector<HTMLButtonElement>(".hint-actions button")!;
    button.click(); await settle();
    expect(document.querySelector("[data-hint-rung]")?.getAttribute("data-hint-rung")).toBe("pattern");
    states.set("ready", false); await settle();
    expect(button.disabled).toBe(true);
    button.click(); await settle();
    expect(request).toHaveBeenCalledTimes(1);
    states.set("ready", true); await settle();
    expect(request).toHaveBeenCalledTimes(1);
    expect(button.textContent).toContain("A little more");
    button.click(); await settle();
    expect(request.mock.calls.map(([body]) => body.rung)).toEqual(["pattern", "square"]);
    await unmount(component);
  });

  it.each(["waiting", "lowered"])("hides delivered guidance when current help no longer permits it (%s), without asking again", async reason => {
    const states = new SvelteMap<string, boolean>([["ready", true], ["lowered", false]]);
    const run = revealedRun();
    const request = vi.fn<GuidedHintClient["request"]>(async body => ({ state: "available", delivery: receipt(run, body.rung) }));
    const marks = vi.fn();
    const component = mount(GuidedHintSeat, { target: target(), props: {
      run, canWrite: true, client: { request, poll: vi.fn(), cancel: vi.fn() }, assistanceRequest, onMarks: marks,
      get decisionReady() { return states.get("ready")!; },
      get ceiling() { return states.get("lowered") ? "pattern" as const : "distance" as const; },
    } });
    await settle();
    const button = document.querySelector<HTMLButtonElement>(".hint-actions button")!;
    button.click(); await settle(); button.click(); await settle();
    expect(document.querySelector('[data-hint-rung="square"]')?.textContent).toBe(SENTENCES.square);
    expect(marks).toHaveBeenLastCalledWith(receipt(run, "square").marks);
    states.set(reason === "waiting" ? "ready" : "lowered", reason !== "waiting"); await settle();
    expect(document.querySelector("[data-hint-rung]")).toBeNull();
    expect(marks).toHaveBeenLastCalledWith(undefined);
    expect(button.disabled).toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
    states.set("ready", true); states.set("lowered", false); await settle();
    expect(document.querySelector('[data-hint-rung="square"]')?.textContent).toBe(SENTENCES.square);
    expect(marks).toHaveBeenLastCalledWith(receipt(run, "square").marks);
    expect(request).toHaveBeenCalledTimes(2);
    button.click(); await settle();
    expect(request.mock.calls.map(([body]) => body.rung)).toEqual(["pattern", "square", "piece"]);
    await unmount(component);
  });

  it.each([0, 49, 51, 151, 199, 201])("the shipping cadence renders a result ready at %i ms within the next 50 ms", async readyAt => {
    const run = revealedRun(), requestId = "e".repeat(32);
    const client: GuidedHintClient = {
      async request(body) { return { state: "pending", requestId, rung: body.rung }; },
      async poll() { return Date.now() >= readyAt ? { state: "available", delivery: receipt(run, "pattern") } : { state: "pending", requestId, rung: "pattern" }; },
      async cancel(id) { return { state: "cancelled", requestId: id, rung: "pattern" }; },
    };
    const component = mount(GuidedHintSeat, { target: target(), props: { run, ceiling: "distance", canWrite: true, client, assistanceRequest } });
    await settle();
    vi.useFakeTimers(); vi.setSystemTime(0);
    try {
      document.querySelector<HTMLButtonElement>(".hint-actions button")!.click();
      await vi.advanceTimersByTimeAsync(readyAt + 50); await tick();
      expect(document.querySelector(".hint-sentence")?.textContent).toBe(SENTENCES.pattern);
    } finally { await unmount(component); vi.useRealTimers(); }
  });

  it("the shipping cadence preserves 70 seconds of pending time and stops without a retry", async () => {
    const run = revealedRun(), requestId = "e".repeat(32);
    const request = vi.fn<GuidedHintClient["request"]>(async body => ({ state: "pending", requestId, rung: body.rung }));
    const poll = vi.fn<GuidedHintClient["poll"]>(async () => ({ state: "pending", requestId, rung: "pattern" }));
    const cancel = vi.fn<GuidedHintClient["cancel"]>(async id => ({ state: "cancelled", requestId: id, rung: "pattern" }));
    const component = mount(GuidedHintSeat, { target: target(), props: { run, ceiling: "distance", canWrite: true, client: { request, poll, cancel }, assistanceRequest } });
    await settle();
    vi.useFakeTimers();
    try {
      const button = document.querySelector<HTMLButtonElement>(".hint-actions button")!;
      button.click();
      await vi.advanceTimersByTimeAsync(69_999); await tick();
      expect(button.disabled).toBe(true);
      expect(document.querySelector(".hint-message")?.textContent).toContain("Looking for a hint");
      await vi.advanceTimersByTimeAsync(1); await tick();
      expect(button.disabled).toBe(false);
      expect(document.querySelector(".hint-message")?.textContent).toContain("taking longer than expected");
      expect(poll).toHaveBeenCalledTimes(1400);
      expect(request).toHaveBeenCalledTimes(1);
      expect(cancel).not.toHaveBeenCalled();
    } finally { await unmount(component); vi.useRealTimers(); }
    expect(cancel).toHaveBeenCalledWith(requestId);
  });

  it("slow poll round trips count towards the pending deadline rather than multiplying the lifetime", async () => {
    const run = revealedRun(), requestId = "e".repeat(32);
    const poll = vi.fn<GuidedHintClient["poll"]>(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { state: "pending", requestId, rung: "pattern" };
    });
    const client: GuidedHintClient = {
      async request(body) { return { state: "pending", requestId, rung: body.rung }; }, poll,
      async cancel(id) { return { state: "cancelled", requestId: id, rung: "pattern" }; },
    };
    const component = mount(GuidedHintSeat, { target: target(), props: { run, ceiling: "distance", canWrite: true, client, assistanceRequest } });
    await settle(); vi.useFakeTimers();
    try {
      document.querySelector<HTMLButtonElement>(".hint-actions button")!.click();
      await vi.advanceTimersByTimeAsync(70_400); await tick();
      expect(poll).toHaveBeenCalledTimes(128);
      expect(document.querySelector(".hint-message")?.textContent).toContain("taking longer than expected");
      await vi.advanceTimersByTimeAsync(70_000);
      expect(poll).toHaveBeenCalledTimes(128);
    } finally { await unmount(component); vi.useRealTimers(); }
  });

  it("teardown during the shipping poll wait cancels the exact request and never polls or renders", async () => {
    const run = revealedRun(), requestId = "e".repeat(32);
    const poll = vi.fn<GuidedHintClient["poll"]>(async () => ({ state: "available", delivery: receipt(run, "pattern") }));
    const cancel = vi.fn<GuidedHintClient["cancel"]>(async id => ({ state: "cancelled", requestId: id, rung: "pattern" }));
    const client: GuidedHintClient = { async request(body) { return { state: "pending", requestId, rung: body.rung }; }, poll, cancel };
    const component = mount(GuidedHintSeat, { target: target(), props: { run, ceiling: "distance", canWrite: true, client, assistanceRequest } });
    await settle(); vi.useFakeTimers();
    let removed = false;
    try {
      document.querySelector<HTMLButtonElement>(".hint-actions button")!.click();
      await vi.advanceTimersByTimeAsync(49); await tick();
      await unmount(component); removed = true;
      await vi.advanceTimersByTimeAsync(200);
      expect(cancel).toHaveBeenCalledWith(requestId);
      expect(poll).not.toHaveBeenCalled();
      expect(document.querySelector(".hint-sentence")).toBeNull();
    } finally { if (!removed) await unmount(component); vi.useRealTimers(); }
  });

  it.each(["retry", "teardown"] as const)("poll exhaustion retains exact cleanup identity for %s", async action => {
    const run = revealedRun(), requestId = "e".repeat(32);
    const trace: string[] = [], bodies: HintRequestBody[] = [];
    const poll = vi.fn<GuidedHintClient["poll"]>(async () => ({ state: "pending", requestId, rung: "pattern" }));
    const client: GuidedHintClient = {
      async request(body) { trace.push("POST"); bodies.push(body); return bodies.length === 1 ? { state: "pending", requestId, rung: body.rung } : { state: "available", delivery: receipt(run, body.rung) }; },
      poll,
      async cancel(id) { trace.push(`DELETE:${id}`); return { state: "cancelled", requestId: id, rung: "pattern" }; },
    };
    const component = mount(GuidedHintSeat, { target: target(), props: { run, ceiling: "distance", canWrite: true, client, assistanceRequest } });
    await settle();
    const button = () => document.querySelector<HTMLButtonElement>(".hint-actions button")!;
    let removed = false;
    vi.useFakeTimers();
    try {
      button().click();
      await vi.advanceTimersByTimeAsync(70_001); await tick();
      expect(poll).toHaveBeenCalledTimes(1400);
      expect(button().disabled).toBe(false);
      expect(document.querySelector(".hint-message")?.textContent).toContain("taking longer than expected");
      expect(trace).toEqual(["POST"]); // The cap must not autonomously cancel/retry or advance.
      if (action === "retry") {
        button().click(); await vi.advanceTimersByTimeAsync(0); await tick();
        expect(trace).toEqual(["POST", `DELETE:${requestId}`, "POST"]);
        expect(bodies[1]).toEqual(bodies[0]);
        expect(document.querySelector(".hint-sentence")?.textContent).toBe(SENTENCES.pattern);
      }
      await unmount(component);
      removed = true;
      if (action === "teardown") expect(trace).toEqual(["POST", `DELETE:${requestId}`]);
    } finally { if (!removed) await unmount(component); vi.useRealTimers(); }
  });

  it("poll transport failure retains the known id for explicit cancellation before retry", async () => {
    const run = revealedRun(), requestId = "e".repeat(32);
    const trace: string[] = [], bodies: HintRequestBody[] = [];
    const client: GuidedHintClient = {
      async request(body) { trace.push("POST"); bodies.push(body); return bodies.length === 1 ? { state: "pending", requestId, rung: body.rung } : { state: "available", delivery: receipt(run, body.rung) }; },
      async poll() { throw new ApiError(500, "POLL_FAILED", "transport failed"); },
      async cancel(id) { trace.push(`DELETE:${id}`); return { state: "cancelled", requestId: id, rung: "pattern" }; },
    };
    const component = mount(GuidedHintSeat, { target: target(), props: { run, ceiling: "distance", canWrite: true, client, assistanceRequest, pollIntervalMs: 1 } });
    await settle();
    const button = () => document.querySelector<HTMLButtonElement>(".hint-actions button")!;
    try {
      button().click(); await settle();
      expect(trace).toEqual(["POST"]);
      expect(document.querySelector(".hint-sentence")).toBeNull();
      button().click(); await settle();
      expect(trace).toEqual(["POST", `DELETE:${requestId}`, "POST"]);
      expect(bodies[1]).toEqual(bodies[0]);
      expect(document.querySelector(".hint-sentence")?.textContent).toBe(SENTENCES.pattern);
    } finally { await unmount(component); }
  });

  function fakeClient(answer: (body: HintRequestBody) => HintResponse, pending = false): GuidedHintClient & { readonly bodies: HintRequestBody[]; readonly cancelled: string[] } {
    const bodies: HintRequestBody[] = [];
    const cancelled: string[] = [];
    let queued: HintResponse | undefined;
    return {
      bodies, cancelled,
      async request(body) { bodies.push(body); const result = answer(body); if (!pending) return result; queued = result; return { state: "pending", requestId: "e".repeat(32), rung: body.rung }; },
      async poll() { const result = queued!; queued = undefined; return result; },
      async cancel(requestId) { cancelled.push(requestId); return { state: "cancelled", requestId, rung: "pattern" }; },
    };
  }
  const assistanceRequest = () => compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
  const settle = async () => { for (let index = 0; index < 8; index += 1) { await tick(); await new Promise((resolve) => setTimeout(resolve, 5)); } };

  it("keeps a disclosure across identical snapshots but resets on a genuinely changed decision", async () => {
    const run = revealedRun();
    const snapshots = new SvelteMap([["current", run]]);
    const client = fakeClient((body) => ({ state: "available", delivery: receipt(run, body.rung) }));
    const component = mount(GuidedHintSeat, { target: target(), props: { get run() { return snapshots.get("current")!; }, ceiling: "square", canWrite: true, client, assistanceRequest, onToggle: vi.fn(), pollIntervalMs: 1 } });
    try {
      await settle();
      document.querySelector<HTMLButtonElement>(".hint-actions button")!.click();
      await settle();
      expect(document.querySelector(".seat-badge")?.textContent).toBe("1");
      snapshots.set("current", JSON.parse(JSON.stringify(run)) as DrillRun);
      await settle();
      expect(document.querySelector(".hint-sentence")?.textContent).toBe(SENTENCES.pattern);
      expect(document.querySelector(".seat-badge")?.textContent).toBe("1");
      expect(client.bodies).toHaveLength(1);
      snapshots.set("current", revealedRun(run.id, 3));
      await settle();
      expect(document.querySelector(".hint-sentence")).toBeNull();
      expect(document.querySelector(".seat-badge")).toBeNull();
      expect(client.bodies).toHaveLength(1);
    } finally { await unmount(component); }
  });

  it.each(["available", "honest_empty", "source_unavailable", "failed", "policy_refused"] as const)("badges only answered facts for %s, never a door or extra rung", async state => {
    const run = revealedRun();
    const client = fakeClient((body): HintResponse => {
      if (state === "available") return { state, delivery: receipt(run, body.rung) };
      if (state === "policy_refused") return { state, rung: body.rung, reason: "disclosure_closed" };
      if (state === "honest_empty") return { state, requestId: "f".repeat(32), rung: body.rung, reason: "no_admitted_occurrence" };
      if (state === "source_unavailable") return { state, requestId: "f".repeat(32), rung: body.rung, reason: "provider_unavailable" };
      return { state, requestId: "f".repeat(32), rung: body.rung, reason: "internal_error" };
    });
    const component = mount(GuidedHintSeat, { target: target(), props: { run, ceiling: "square", canWrite: true, client, assistanceRequest, onToggle: vi.fn(), pollIntervalMs: 1 } });
    try {
      await settle();
      expect(document.querySelector(".seat-badge")).toBeNull();
      document.querySelector<HTMLButtonElement>(".hint-actions button")!.click();
      await settle();
      const expected = state === "available" ? "1" : state === "honest_empty" || state === "source_unavailable" ? "0" : undefined;
      expect(document.querySelector(".seat-badge")?.textContent).toBe(expected);
      if (state === "available") {
        document.querySelector<HTMLButtonElement>(".hint-actions button")!.click();
        await settle();
        expect(client.bodies.map((body) => body.rung)).toEqual(["pattern", "square"]);
        expect(document.querySelector(".seat-badge")?.textContent).toBe("1");
      }
    } finally { await unmount(component); }
  });

  it("asks only on request, climbs one rung per press to the ceiling, and shows only the receipt's sentence", async () => {
    const run = revealedRun();
    const client = fakeClient((body) => ({ state: "available", delivery: receipt(run, body.rung) }), true);
    const marks = vi.fn();
    const component = mount(GuidedHintSeat, { target: target(), props: { run, ceiling: "square", canWrite: true, client, assistanceRequest, onMarks: marks, pollIntervalMs: 1 } });
    await settle();
    // Never proactive: nothing is requested before the learner presses the button.
    expect(client.bodies).toEqual([]);
    const button = () => document.querySelector<HTMLButtonElement>(".hint-actions button")!;
    expect(button().textContent?.trim()).toBe("Hint");
    button().click();
    await settle();
    expect(client.bodies.map((body) => [body.rung, body.nodeId, body.decisionDigest])).toEqual([["pattern", "n0", hintDecisionStamp(run).digest]]);
    expect(document.querySelector(".hint-sentence")?.textContent).toBe(SENTENCES.pattern);
    expect(button().textContent?.trim()).toBe("A little more");
    button().click();
    await settle();
    expect(client.bodies.map((body) => body.rung)).toEqual(["pattern", "square"]);
    expect(marks).toHaveBeenLastCalledWith({ rung: "square", squares: ["d1", "d3"] });
    // The proposed ceiling stops the ladder; the control says so instead of offering a rung select.
    expect(button().disabled).toBe(true);
    expect(document.body.textContent).toContain("That is as far as this help style goes here.");
    expect(document.querySelector("select")).toBeNull();
    unmount(component);
  });

  it("never renders a refused or empty result as a hint, and keeps the first-press label", async () => {
    const run = revealedRun();
    const client = fakeClient((body) => body.rung === "pattern" ? { state: "policy_refused", rung: "pattern", reason: "disclosure_closed" } : { state: "honest_empty", requestId: "f".repeat(32), rung: body.rung, reason: "no_admitted_occurrence" });
    const component = mount(GuidedHintSeat, { target: target(), props: { run, ceiling: "distance", canWrite: true, client, assistanceRequest, pollIntervalMs: 1 } });
    await settle();
    const button = () => document.querySelector<HTMLButtonElement>(".hint-actions button")!;
    button().click();
    await settle();
    expect(document.querySelector(".hint-sentence")).toBeNull();
    expect(document.body.textContent).toContain("Hints open once support is shown for this position.");
    expect(button().textContent?.trim()).toBe("Hint");
    unmount(component);
  });

  it.each(["source_unavailable", "failed"] as const)("explicit retry removes %s before repeating the exact decision/rung", async state => {
    const run = revealedRun();
    const failedId = "f".repeat(32);
    const trace: string[] = [];
    const bodies: HintRequestBody[] = [];
    const client: GuidedHintClient = {
      async request(body) {
        trace.push("POST"); bodies.push(body);
        return bodies.length === 1
          ? state === "failed" ? { state, requestId: failedId, rung: body.rung, reason: "internal_error" } : { state, requestId: failedId, rung: body.rung, reason: "provider_unavailable" }
          : { state: "available", delivery: receipt(run, body.rung) };
      },
      async poll() { throw new Error("not pending"); },
      async cancel(requestId) { trace.push(`DELETE:${requestId}`); return { state: "cancelled", requestId, rung: "pattern" }; },
    };
    const component = mount(GuidedHintSeat, { target: target(), props: { run, ceiling: "distance", canWrite: true, client, assistanceRequest } });
    await settle();
    document.querySelector<HTMLButtonElement>(".hint-actions button")!.click(); await settle();
    expect(trace).toEqual(["POST"]); // No retry without a second human request.
    expect(document.querySelector(".hint-sentence")).toBeNull();
    document.querySelector<HTMLButtonElement>(".hint-actions button")!.click(); await settle();
    expect(trace).toEqual(["POST", `DELETE:${failedId}`, "POST"]);
    expect(bodies[1]).toEqual(bodies[0]);
    expect(document.querySelector(".hint-sentence")?.textContent).toBe(SENTENCES.pattern);
    expect(document.querySelector(".hint-actions button")?.textContent?.trim()).toBe("A little more");
    await unmount(component);
  });

  it.each([404, 500])("retry cancellation HTTP %s only permits re-POST when the old id is gone", async status => {
    const run = revealedRun();
    const request = vi.fn<GuidedHintClient["request"]>(async body => ({ state: "source_unavailable", requestId: "f".repeat(32), rung: body.rung, reason: "provider_unavailable" }));
    const client: GuidedHintClient = { request, async poll() { throw new Error("not pending"); }, async cancel() { throw new ApiError(status, "CANCEL_FAILED", "cancel failed"); } };
    const component = mount(GuidedHintSeat, { target: target(), props: { run, ceiling: "distance", canWrite: true, client, assistanceRequest } });
    await settle();
    document.querySelector<HTMLButtonElement>(".hint-actions button")!.click(); await settle();
    document.querySelector<HTMLButtonElement>(".hint-actions button")!.click(); await settle();
    expect(request).toHaveBeenCalledTimes(status === 404 ? 2 : 1);
    await unmount(component);
  });

  it("teardown during explicit retry cancellation cannot launch a replacement hint", async () => {
    const run = revealedRun();
    let finish!: () => void;
    const cancelled = new Promise<void>(resolve => { finish = resolve; });
    const request = vi.fn<GuidedHintClient["request"]>(async body => ({ state: "failed", requestId: "f".repeat(32), rung: body.rung, reason: "internal_error" }));
    const cancel = vi.fn<GuidedHintClient["cancel"]>(async requestId => { await cancelled; return { state: "cancelled", requestId, rung: "pattern" }; });
    const client: GuidedHintClient = { request, cancel, async poll() { throw new Error("not pending"); } };
    const component = mount(GuidedHintSeat, { target: target(), props: { run, ceiling: "distance", canWrite: true, client, assistanceRequest } });
    await settle();
    document.querySelector<HTMLButtonElement>(".hint-actions button")!.click(); await settle();
    document.querySelector<HTMLButtonElement>(".hint-actions button")!.click(); await settle();
    expect(cancel).toHaveBeenCalled();
    await unmount(component);
    finish(); await settle();
    expect(request).toHaveBeenCalledTimes(1);
  });
});
