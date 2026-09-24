// @vitest-environment happy-dom
// rfc/hint-distance.md §7 — the web client and rail seat contracts (criteria 11 and 12, web arm).

import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import { compileAssistanceRequest, hintDecisionStamp, hintReceiptDigest, type DrillRun, type HintDeliveryReceipt, type HintResponse, type HintRung } from "@chess-tabiya/runtime";

import { DrillApi, type GuidedHintClient, type HintRequestBody } from "./api.js";
import GuidedHintSeat from "./GuidedHintSeat.svelte";

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
});
