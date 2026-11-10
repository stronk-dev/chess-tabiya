<script lang="ts">
  import { tick, untrack } from "svelte";
  import {
    INSPECTOR_SOURCE_TOPICS, INSPECTOR_DETAIL_SOURCES, parseInspectorQueryRequest,
    type InspectorQueryRequest, type InspectorQueryView, type InspectorSourceContext, type InspectorSourceRef,
    type RequestedAssistanceV1, type InspectorDetailScope, type InspectorRecordedCoverage,
  } from "@chess-tabiya/runtime/client";
  import PresentedEvidence from "./evidence/PresentedEvidence.svelte";
  import { parseInspectorQueryPage, type ParsedInspectorPage } from "./inspector-query-response.js";
  import { INSPECTOR_SOURCE_LABELS } from "./inspector-source-labels.js";

  interface Props {
    runId: string; branchId: string; nodeId: string; decisionDigest: string; fen: string;
    assistance: RequestedAssistanceV1; requestedDigest: string; finalDigest: string;
    peers: readonly { branchId: string; nodeId: string; label: string }[];
    onQuery: (body: InspectorQueryRequest, signal: AbortSignal) => Promise<unknown>;
    onRefreshAssistance?: () => Promise<void>;
  }
  let { runId, branchId, nodeId, decisionDigest, fen, assistance, requestedDigest, finalDigest, peers, onQuery, onRefreshAssistance }: Props = $props();
  let identity = $derived(JSON.stringify([runId, branchId, nodeId, decisionDigest, requestedDigest, finalDigest]));
  let page: ParsedInspectorPage | undefined = $state.raw();
  let pending = $state(false), failed = $state(false);
  let topicStart = $state(0), topicNext: number | null = $state(null);
  let topics: readonly (typeof INSPECTOR_SOURCE_TOPICS)[number][] = $state.raw([]);
  let selected: InspectorSourceRef | undefined = $state();
  let contextKind: InspectorSourceContext["kind"] = $state("position");
  let peerId = $state("");
  let horizon: 1 | 2 | 3 | 4 = $state(1);
  let focusTarget = $state(""), focusColor: "white" | "black" = $state("white"), focusMode: "geometric" | "legal" = $state("geometric");
  let activeView: InspectorQueryView = $state.raw({ kind: "inventory", start: 0 });
  let browserElement: HTMLElement | undefined = $state(), inventoryTitle: HTMLHeadingElement | undefined = $state(), resultTitle: HTMLHeadingElement | undefined = $state();
  let generation = 0, controller: AbortController | undefined, pendingRequestKey: string | undefined;
  const contextLabels: Readonly<Record<InspectorSourceContext["kind"], string>> = {
    position: "This position", incoming_edge: "The move into this position", recorded_window: "Recorded continuation",
    branch: "This line up to this position", recorded_review: "Recorded review up to this position", comparison: "Compare with another line",
  };
  const refusalLabels = {
    invalid_request: "That evidence request could not be read. Refresh the source list.", not_found: "This game is no longer accessible.",
    withheld: "Evidence is not available in this workflow yet.", stale: "The game or its evidence changed. Refresh before continuing.",
    unsupported_version: "This server does not support this Inspector version. No older output was substituted.",
  };
  function sourceContext(): InspectorSourceContext | undefined {
    if (contextKind === "branch" || contextKind === "recorded_review") return { kind: contextKind, throughNodeId: nodeId };
    if (contextKind === "comparison") {
      const peer = peers.find(peer => peer.branchId === peerId && peer.branchId !== branchId);
      return peer === undefined ? undefined : { kind: "comparison", otherBranchId: peer.branchId, otherNodeId: peer.nodeId };
    }
    return { kind: contextKind };
  }
  function sourceView(projection: InspectorSourceRef, context: InspectorSourceContext): InspectorQueryView {
    return projection === "rules.tactic.consequence.forced_mate_after_move@1" || projection === "rules.tactic.consequence.forced_mate_after_move@2"
      ? { kind: "source", projection, context, start: 0, collectionKey: null, parameters: { kind: "forced_mate", maxAttackerMoves: horizon } }
      : { kind: "source", projection, context, start: 0, collectionKey: null };
  }
  async function send(view: InspectorQueryView): Promise<void> {
    const requestKey = JSON.stringify([identity, view]);
    if (pending && pendingRequestKey === requestKey && controller?.signal.aborted === false) return;
    const owned = ++generation, subject = identity;
    controller?.abort(); const abort = new AbortController(); controller = abort;
    pendingRequestKey = requestKey;
    const invoker = document.activeElement;
    let ownsFocus = invoker !== null && browserElement?.contains(invoker) === true;
    const movedFocus = (event: FocusEvent): void => {
      if (event.target !== invoker && event.target !== document.body) ownsFocus = false;
    };
    document.addEventListener("focusin", movedFocus, { signal: abort.signal });
    pending = true; failed = false; page = undefined; activeView = view;
    if (view.kind === "inventory") selected = undefined;
    try {
      const request = parseInspectorQueryRequest({ protocol: "inspector.query_page@1", assistance,
        query: { branchId, nodeId, decisionDigest, view } });
      const expected = { runId, request, requestedDigest, finalDigest, fen };
      const value = await onQuery(request, abort.signal);
      if (abort.signal.aborted || owned !== generation || subject !== identity) return;
      const received = parseInspectorQueryPage(value, expected);
      if (abort.signal.aborted || owned !== generation || subject !== identity) return;
      page = received;
      if (received.kind === "page" && received.body.kind === "inventory") {
        topicStart = received.body.range.start; topicNext = received.body.range.next;
        topics = received.body.topics.map(topic => INSPECTOR_SOURCE_TOPICS.find(declared => declared.projection === topic.projection)!);
      }
    } catch {
      if (!abort.signal.aborted && owned === generation && subject === identity) failed = true;
    } finally {
      if (owned === generation) {
        pending = false;
        await tick();
        if (ownsFocus && owned === generation && subject === identity && !abort.signal.aborted
          && invoker?.isConnected === false && document.activeElement === document.body && browserElement?.isConnected) {
          (selected === undefined ? inventoryTitle : resultTitle)?.focus();
        }
      }
      document.removeEventListener("focusin", movedFocus);
    }
  }
  function retireSelection(): void { ++generation; controller?.abort(); page = undefined; pending = false; failed = false; }
  async function refreshHelp(): Promise<void> {
    if (pending || onRefreshAssistance === undefined) return;
    retireSelection();
    const owned = generation;
    pending = true;
    try { await onRefreshAssistance(); }
    catch { if (owned === generation) failed = true; }
    finally { if (owned === generation) pending = false; }
  }
  function choose(projection: InspectorSourceRef): void {
    retireSelection();
    selected = projection; contextKind = INSPECTOR_SOURCE_TOPICS.find(topic => topic.projection === projection)!.contexts[0]!;
    peerId = peers.find(peer => peer.branchId !== branchId)?.branchId ?? "";
    focusTarget = "";
    const context = sourceContext(); if (context !== undefined) void send(sourceView(projection, context));
  }
  function loadSelected(): void { const context = sourceContext(); if (selected !== undefined && context !== undefined) void send(sourceView(selected, context)); }
  function openDetail(sourceKey: string, focused = false): void {
    if (activeView.kind !== "source") return;
    const view = activeView;
    const projection = Object.values(INSPECTOR_DETAIL_SOURCES).find(ref => ref === view.projection);
    if (projection === undefined || focused && projection !== "rules.square.reading.control@1") return;
    const scope: InspectorDetailScope = focused ? { kind: "control_target", color: focusColor, mode: focusMode, target: focusTarget as `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8"}` } : { kind: "whole" };
    void send({ kind: "detail", projection, context: activeView.context, sourceKey, scope, start: 0 });
  }
  function nextPage(next: number): void {
    if (activeView.kind === "source" && page?.kind === "page" && page.body.kind === "source" && page.body.outcome.kind === "available") {
      void send({ ...activeView, start: next, collectionKey: page.body.outcome.collectionKey });
    } else if (activeView.kind === "detail") void send({ ...activeView, start: next });
  }
  function coverageText(coverage: InspectorRecordedCoverage): string {
    const counts = coverage.abstentions;
    return `${coverage.admittedRecords} admitted; ${coverage.notAdmittedRecords} not admitted.`
      + (counts.out_of_range ? ` ${counts.out_of_range} outside the recorded range.` : "")
      + (counts.source_unavailable ? ` ${counts.source_unavailable} unavailable at source.` : "")
      + (counts.no_data_at_band ? ` ${counts.no_data_at_band} without data at this band.` : "")
      + (counts.licence_withheld ? ` ${counts.licence_withheld} withheld by licence.` : "");
  }
  $effect(() => {
    const subject = identity;
    untrack(() => { selected = undefined; topics = []; topicStart = 0; topicNext = null; void send({ kind: "inventory", start: 0 }); });
    return () => { void subject; ++generation; controller?.abort(); };
  });
</script>

<section bind:this={browserElement} class="source-browser" aria-label="Evidence inspector: full inspector" data-module="full_inspector">
  <h3 bind:this={inventoryTitle} tabindex="-1">Explore evidence for this position</h3>
  <p class="honest">Choose a source to inspect. Opening this list does not request engine or model analysis.</p>
  <nav aria-label="Evidence sources">
    <ul>{#each topics as topic (topic.projection)}<li><button type="button" aria-pressed={selected === topic.projection} onclick={() => choose(topic.projection)}>{INSPECTOR_SOURCE_LABELS[topic.projection]}</button></li>{/each}</ul>
    <div class="actions">
      {#if topicStart > 0}<button type="button" onclick={() => void send({ kind: "inventory", start: Math.max(0, topicStart - 8) })}>Previous sources</button>{/if}
      {#if topicNext !== null}<button type="button" onclick={() => void send({ kind: "inventory", start: topicNext! })}>Next sources</button>{/if}
    </div>
  </nav>
  {#if selected !== undefined}
    <h4 bind:this={resultTitle} tabindex="-1">{INSPECTOR_SOURCE_LABELS[selected]}</h4>
    <div class="source-controls">
      <label>Scope <select bind:value={contextKind} onchange={retireSelection}>{#each INSPECTOR_SOURCE_TOPICS.find(topic => topic.projection === selected)!.contexts as kind}<option value={kind}>{contextLabels[kind]}</option>{/each}</select></label>
      {#if contextKind === "comparison"}<label>Other line <select bind:value={peerId} onchange={retireSelection}>{#each peers.filter(peer => peer.branchId !== branchId) as peer}<option value={peer.branchId}>{peer.label}</option>{/each}</select></label>{/if}
      {#if selected.startsWith("rules.tactic.consequence.forced_mate_after_move@")}
        <label>Search bound <select bind:value={horizon} onchange={retireSelection}><option value={1}>1 attacking move</option><option value={2}>2 attacking moves</option><option value={3}>3 attacking moves</option><option value={4}>4 attacking moves</option></select></label>
      {/if}
      <button type="button" disabled={pending || contextKind === "comparison" && peerId === ""} onclick={loadSelected}>Read this source</button>
    </div>
    {#if contextKind === "comparison" && peerId === ""}<p>No other recorded line is available to compare.</p>{/if}
  {/if}
  {#if pending}<p role="status">Reading the requested evidence…</p>
  {:else if failed}<p role="alert">This response could not be verified. No evidence was displayed.</p><button type="button" onclick={() => void send(activeView)}>Retry this request</button>
  {:else if page?.kind === "refused"}<p role="status">{refusalLabels[page.code]}</p><button type="button" onclick={() => void send({ kind: "inventory", start: 0 })}>Refresh source list</button>
  {:else if page?.kind === "page"}
    {@const body = page.body}
    {#if body.kind === "source"}
      {@const outcome = body.outcome}
      {#if body.recordedCoverage !== null}<p class="coverage" aria-label="Recorded measurement coverage">{coverageText(body.recordedCoverage)}</p>{/if}
      {#if outcome.kind === "available"}
        <p>{outcome.collected} collected; {outcome.displayed} displayed on this page; {outcome.deferred} exceed this page's display budget.</p>
        <PresentedEvidence items={page.items} />
        {#if body.projection === "rules.square.reading.control@1"}
          <fieldset><legend>Focus square-control detail</legend>
            <label>Square <input bind:value={focusTarget} maxlength="2" placeholder="e4" /></label>
            <label>Side <select bind:value={focusColor}><option value="white">White</option><option value="black">Black</option></select></label>
            <label>Control <select bind:value={focusMode}><option value="geometric">Geometric</option><option value="legal">Legal</option></select></label>
          </fieldset>
        {/if}
        {#each outcome.facts as fact, i (fact.sourceKey)}
          {#if fact.disposition === "deferred"}<p>Observation {outcome.range.start + i + 1} is too large to display whole here. It has not been cropped.</p>{/if}
          {#if fact.detail !== null}
            <button type="button" onclick={() => openDetail(fact.sourceKey)}>Read complete members of observation {outcome.range.start + i + 1}</button>
            {#if body.projection === "rules.square.reading.control@1"}<button type="button" disabled={!/^[a-h][1-8]$/u.test(focusTarget)} onclick={() => openDetail(fact.sourceKey, true)}>Read control at the selected square</button>{/if}
          {:else if fact.disposition === "deferred"}
            <p class="honest">This source has no bounded detail view yet.</p>
            {#if i > 0}<button type="button" onclick={() => nextPage(outcome.range.start + i)}>Show observation {outcome.range.start + i + 1} first</button>{/if}
          {/if}
        {/each}
        {#if outcome.range.next !== null}<button type="button" onclick={() => nextPage(outcome.range.next!)}>Next observations</button>{/if}
      {:else if outcome.kind === "below_floor"}
        <p>Not enough games in this Lichess explorer population to show a distribution ({outcome.total}; minimum 100).</p>
        <p>Rating buckets: {outcome.population.ratingBuckets.join(", ")}. Speeds: {outcome.population.speeds.join(", ")}. From {outcome.population.since ?? "all dates"} to {outcome.population.until ?? "the latest recorded date"}.</p>
      {:else if outcome.kind === "no_witness"}<p>This source completed its check and found no matching observation.</p>
      {:else if outcome.kind === "missing_context"}<p>The recorded move, continuation or second line needed for this source is not available here.</p>
      {:else if outcome.kind === "unavailable"}<p>This evidence source is unavailable here. That is not a finding about the position.</p>
      {:else}<p role="status">This evidence source could not complete its check. That is not an empty chess result.</p>{/if}
    {:else if body.kind === "detail"}
      {#if body.range.total === 0}<p>No members match this detail scope; {body.fullSourceTotal} in the complete source.</p>
      {:else}<p>Members {body.range.start + 1}–{body.range.start + body.range.count} of {body.range.total} selected; {body.fullSourceTotal} in the complete source.</p>{/if}
      <PresentedEvidence items={page.items} />
      {#if body.range.next !== null}<button type="button" onclick={() => nextPage(body.range.next!)}>Next members</button>{/if}
      <button type="button" onclick={loadSelected}>Back to source</button>
    {:else if body.kind === "detail_limited"}
      <p>This complete member exceeds the display budget. It has not been cropped or skipped.</p>
      <button type="button" onclick={loadSelected}>Back to source</button>
    {/if}
  {/if}
  {#if onRefreshAssistance !== undefined && (failed || page?.kind === "refused")}
    <p class="honest">If evidence availability changed, confirm the current help settings and reload the source list.</p>
    <button type="button" onclick={() => void refreshHelp()}>Refresh help and source list</button>
  {/if}
</section>

<style>
  .source-browser { min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
  nav ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); gap: .4rem; list-style: none; padding: 0; }
  nav li, .source-controls { min-width: 0; }
  button, select, input { max-width: 100%; min-height: 2.75rem; }
  nav button { width: 100%; text-align: start; }
  .actions, .source-controls, fieldset { display: flex; flex-wrap: wrap; gap: .5rem; align-items: end; }
  label { display: grid; gap: .25rem; min-width: 0; }
  .honest, .coverage { color: var(--muted); }
</style>
