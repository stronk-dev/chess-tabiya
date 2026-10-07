<script lang="ts">
  // rfc/hint-distance.md §5/§7 — the Guided Hint rail seat. One learner question, one progressive
  // action: "Hint", then "A little more", one rung per request for the exact current decision. It never
  // asks on its own, never offers a rung/source select, and renders only the server's closed receipt.
  import { onDestroy, untrack } from "svelte";
  import {
    HINT_DISTANCES,
    hintDecisionStamp,
    nextHintRung,
    type DrillRun,
    type HintDeliveryMarks,
    type HintDistance,
    type HintPolicyReason,
    type HintRequestState,
    type HintResponse,
    type RequestedAssistanceV1,
  } from "@chess-tabiya/runtime";

  import { ApiError, type GuidedHintClient, type HintRequestBody } from "./api.js";
  import CompanionSeat from "./CompanionSeat.svelte";

  interface Props {
    run: DrillRun;
    ceiling: HintDistance;
    canWrite: boolean;
    decisionReady?: boolean;
    client: GuidedHintClient;
    assistanceRequest: () => RequestedAssistanceV1 | undefined;
    onMarks?: ((marks: HintDeliveryMarks | undefined) => void) | undefined;
    pollIntervalMs?: number;
    expanded?: boolean;
    onToggle?: (() => void) | undefined;
    band?: boolean;
  }

  let { run, ceiling, canWrite, decisionReady = true, client, assistanceRequest, onMarks, pollIntervalMs = 50, expanded = true, onToggle, band = false }: Props = $props();

  const POLICY_COPY: Readonly<Record<HintPolicyReason, string>> = {
    module_inactive: "This help style does not include hints.",
    above_ceiling: "That is as far as this help style goes here.",
    disclosure_closed: "Hints open once support is shown for this position.",
    not_your_decision: "Hints answer your own decision. Wait for your move.",
    rated_game_open: "Hints are off during a rated game.",
  };

  let decisionDigest = $derived(hintDecisionStamp(run).digest);
  let progress: HintRequestState | undefined = $state();
  let response: HintResponse | undefined = $state();
  let clientProblem: "poll_limit" | "transport_error" | undefined = $state();
  let busy = $state(false);
  let activeRequestId: string | undefined;
  let retryRequestId: string | undefined;
  let generation = 0;

  let next = $derived(nextHintRung(progress, decisionDigest, ceiling));
  let revealed = $derived(progress?.decisionDigest === decisionDigest ? progress.revealed : null);
  let visibleDelivery = $derived(decisionReady && response?.state === "available"
    && response.delivery.decision.digest === decisionDigest
    && HINT_DISTANCES.indexOf(response.delivery.rung) <= HINT_DISTANCES.indexOf(ceiling) ? response.delivery : undefined);
  let sentence = $derived(visibleDelivery === undefined ? undefined : visibleDelivery.rendered.voice.state === "rendered" ? visibleDelivery.rendered.voice.sentence : visibleDelivery.rendered.sentence);
  // One progressive disclosure is one fact, not a count of revealed rungs. A door, pending
  // request, policy refusal or failed transport makes no assertion about available evidence.
  let badge = $derived(visibleDelivery !== undefined ? 1 : decisionReady && (response?.state === "honest_empty" || response?.state === "source_unavailable") ? 0 : undefined);
  $effect(() => { onMarks?.(visibleDelivery?.marks); });
  let message = $derived.by(() => {
    if (clientProblem === "poll_limit") return "The hint is taking longer than expected. Try again.";
    if (clientProblem === "transport_error") return "The hint request could not be completed. Try again.";
    if (response === undefined) return undefined;
    switch (response.state) {
      case "pending": return "Looking for a hint in a searched line…";
      case "available": return undefined;
      case "honest_empty": return "The searched line from here shows no pattern to hint at. Play the move you believe in and see what the consequence exposes, or rewind and try another branch.";
      case "source_unavailable": return "Hints need the analysis engine, which is not available right now. Theory and structure help are unaffected.";
      case "policy_refused": return POLICY_COPY[response.reason];
      case "failed": return "The hint could not be prepared. Try again.";
      case "stale": return "The position changed. Ask again for this decision.";
      case "cancelled": return undefined;
    }
  });

  function reset(): void {
    generation += 1;
    const pending = activeRequestId ?? retryRequestId;
    activeRequestId = undefined;
    retryRequestId = undefined;
    if (pending !== undefined) void client.cancel(pending).catch(() => undefined);
    progress = undefined;
    response = undefined;
    clientProblem = undefined;
    busy = false;
    onMarks?.(undefined);
  }

  // §5: commit, rewind, fork, cursor or boundary change and a replaced run reset the ladder.
  $effect(() => {
    void decisionDigest;
    untrack(reset);
  });
  onDestroy(() => { generation += 1; const pending = activeRequestId ?? retryRequestId; if (pending !== undefined) void client.cancel(pending).catch(() => undefined); onMarks?.(undefined); });

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async function ask(): Promise<void> {
    if (!canWrite || !decisionReady || busy) return;
    const rung = next;
    const assistance = assistanceRequest();
    if (rung === undefined || assistance === undefined) return;
    const mine = ++generation;
    const digest = decisionDigest;
    const body: HintRequestBody = { nodeId: run.activeCursor.nodeId, rung, decisionDigest: digest, assistance };
    busy = true;
    clientProblem = undefined;
    try {
      // A failed operation is still an idempotently settled server record. Explicit retry
      // removes that exact record before re-POSTing the same decision/rung; polling never retries.
      if (retryRequestId !== undefined) {
        try { await client.cancel(retryRequestId); }
        catch (error) { if (!(error instanceof ApiError && error.status === 404)) throw error; }
        if (mine !== generation) return;
        retryRequestId = undefined;
      }
      let current = await client.request(body);
      // §10/D3503: leave transport/paint room in the 150 ms budget. The measured
      // 100 ms wait exhausted it even with no optional voice call. Keep the
      // original 200 × 350 ms pending window, separately from polling frequency.
      // Bound elapsed time as well as count, including slow network round trips.
      const pendingWindowMs = 70_000;
      const cadence = Number.isFinite(pollIntervalMs) && pollIntervalMs > 0 ? pollIntervalMs : 50;
      const deadline = Date.now() + pendingWindowMs;
      const maxPolls = Math.ceil(pendingWindowMs / cadence);
      for (let attempt = 0; current.state === "pending" && attempt < maxPolls && Date.now() < deadline; attempt += 1) {
        if (mine !== generation) return;
        activeRequestId = current.requestId;
        response = current;
        await wait(Math.min(cadence, Math.max(0, deadline - Date.now())));
        if (mine !== generation) return;
        try {
          current = await client.poll(current.requestId);
        } catch (error) {
          // §7 step 5: after a server restart the id is unknown; re-POST the same decision and rung.
          if (error instanceof ApiError && error.status === 404) current = await client.request(body);
          else throw error;
        }
      }
      if (mine !== generation) return;
      if (current.state === "pending") {
        // Polling is bounded, but the server operation still exists. Keep its actual
        // identity for explicit retry/reset/teardown instead of fabricating a failure receipt.
        retryRequestId = current.requestId;
        activeRequestId = undefined;
        response = undefined;
        clientProblem = "poll_limit";
        return;
      }
      activeRequestId = undefined;
      // The client also compares the receipt stamp and never renders a late result (§7 step 3).
      if (current.state === "available" && (current.delivery.decision.digest !== decisionDigest || current.delivery.rung !== rung)) {
        response = { state: "stale", requestId: current.delivery.requestId, rung };
        return;
      }
      response = current;
      retryRequestId = current.state === "source_unavailable" || current.state === "failed" ? current.requestId : undefined;
      if (current.state === "available") {
        progress = { decisionDigest: digest, revealed: rung };
      }
    } catch {
      if (mine === generation) {
        retryRequestId = activeRequestId ?? retryRequestId;
        activeRequestId = undefined;
        response = undefined;
        clientProblem = "transport_error";
      }
    } finally {
      if (mine === generation) busy = false;
    }
  }
</script>

<CompanionSeat id="guided_hint" module="guided_hint" label="Ask for the least that helps" shortLabel="Hint"
  {band} open={expanded} state={visibleDelivery === undefined ? "door" : "filled"} {badge}
  controlLabel={expanded ? "Collapse guided hint" : revealed === null ? "Hint" : "Open guided hint"}
  controlDescriptionId={!decisionReady && canWrite ? "guided-hint-wait" : undefined}
  disabled={onToggle !== undefined && !expanded && revealed === null && (!canWrite || !decisionReady || busy)}
  onToggle={onToggle === undefined ? undefined : () => { const shouldAsk = !expanded && revealed === null; onToggle?.(); if (shouldAsk) void ask(); }}>
  <p class="eyebrow">Stuck?</p>
  <div class="hint-card" id="guided-hint-card" hidden={!expanded}>
  {#if sentence !== undefined}<p class="hint-sentence" role="status" data-hint-rung={revealed}>{sentence}</p>{/if}
  {#if message !== undefined}<p class="hint-message" role={response?.state === "pending" ? "status" : undefined}>{message}</p>{/if}
  <div class="hint-actions">
    <button type="button" disabled={!canWrite || !decisionReady || busy || next === undefined} aria-describedby={!decisionReady && canWrite ? "guided-hint-wait" : next === undefined && revealed !== null ? "guided-hint-limit" : undefined} onclick={() => void ask()}>
      {busy ? "Looking…" : revealed === null ? "Hint" : "A little more"}
    </button>
    {#if decisionReady && next === undefined && revealed !== null}<span id="guided-hint-limit" class="honest">That is as far as this help style goes here.</span>{/if}
    {#if !canWrite}<span class="honest">This read-only view cannot ask for hints.</span>{/if}
    {#if !decisionReady && canWrite}<span id="guided-hint-wait" class="honest" role="status">Wait for this position and its help settings to finish updating.</span>{/if}
  </div>
  </div>
</CompanionSeat>

<style>
  .eyebrow { color:var(--accent); font:700 .62rem ui-monospace,monospace; letter-spacing:.08em; text-transform:uppercase; }
  .hint-sentence { font-size:.82rem; line-height:1.45; }
  .hint-card { display:grid; gap:.4rem; }
  .hint-card[hidden] { display:none; }
  .hint-message { color:var(--muted); font-size:.76rem; line-height:1.4; }
  .hint-actions { display:flex; flex-wrap:wrap; align-items:center; gap:.4rem; }
  .hint-actions button { justify-self:start; padding:.5rem .65rem; border:1px solid var(--line); border-radius:.6rem; background:var(--paper); color:inherit; }
  .hint-actions button:not(:disabled) { border-color:var(--accent); color:var(--accent); }
  .honest { color:var(--muted); font-size:.72rem; }
</style>
