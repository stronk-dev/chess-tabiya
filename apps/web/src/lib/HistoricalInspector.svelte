<script lang="ts">
  import { branchPath, type DrillRun, type FinalizedAssistanceV1, type InspectorQueryRequest, type RequestedAssistanceV1, type WorkflowContextId } from "@chess-tabiya/runtime/client";
  import { onDestroy, tick, untrack } from "svelte";
  import InspectorSourceBrowser from "./InspectorSourceBrowser.svelte";
  import { historicalInspectorIntent, historicalInspectorTarget, parseInspectorAssistanceResponse, type HistoricalInspectorTarget, type InspectorAssistanceRequest } from "./historical-inspector.js";

  interface Props {
    run: DrillRun;
    workflowContext: WorkflowContextId;
    accessIdentity: string;
    sourceHealth: unknown;
    onConfirm: (body: InspectorAssistanceRequest, signal: AbortSignal) => Promise<unknown>;
    onQuery: (body: InspectorQueryRequest, signal: AbortSignal) => Promise<unknown>;
  }
  let { run, workflowContext, accessIdentity, sourceHealth, onConfirm, onQuery }: Props = $props();
  let branchId = $state("");
  let nodeId = $state("");
  let status: "idle" | "pending" | "ready" | "failed" = $state("idle");
  let ready = $state<{ target: HistoricalInspectorTarget; intent: RequestedAssistanceV1; help: FinalizedAssistanceV1; query: Props["onQuery"] }>();
  let action: HTMLButtonElement | undefined = $state();
  let result: HTMLHeadingElement | undefined = $state();
  let seat: HTMLElement | undefined = $state();
  let sequence = 0, pending: AbortController | undefined;
  // A replacement run can render before the reset effect replaces the old selection.
  // Do not query its graph with a branch that belongs only to the previous run.
  let path = $derived(run.branches.some(branch => branch.id === branchId) ? branchPath(run, branchId) : []);
  let peers = $derived(run.branches.map(branch => ({ branchId: branch.id, nodeId: branchPath(run, branch.id).at(-1)!.id, label: branch.label })));

  function retire(restoreFocus = false): void {
    const owned = restoreFocus && seat?.contains(document.activeElement) && document.activeElement !== action;
    sequence++; pending?.abort(); pending = undefined; ready = undefined; status = "idle";
    if (owned) void tick().then(() => {
      if (action?.isConnected && (document.activeElement === document.body || document.activeElement === null)) action.focus();
    });
  }
  $effect(() => {
    // Actual snapshot/access/health changes retire work even if the decision digest is unchanged.
    run; workflowContext; accessIdentity; sourceHealth;
    untrack(() => {
      retire(true);
      if (!run.branches.some(branch => branch.id === branchId)) branchId = run.activeCursor.branchId;
      const positions = branchPath(run, branchId);
      if (!positions.some(node => node.id === nodeId)) nodeId = positions[0]!.id;
    });
  });
  onDestroy(() => { sequence++; pending?.abort(); });

  function changeLine(event: Event): void {
    retire(); branchId = (event.currentTarget as HTMLSelectElement).value;
    nodeId = branchPath(run, branchId)[0]!.id;
  }
  function changePosition(event: Event): void { retire(); nodeId = (event.currentTarget as HTMLSelectElement).value; }
  async function confirm(): Promise<void> {
    if (status === "pending") return;
    retire();
    const controller = new AbortController(), generation = ++sequence;
    const subjectRun = run, subjectContext = workflowContext, subjectAccess = accessIdentity, subjectHealth = sourceHealth;
    pending = controller; status = "pending";
    const target = historicalInspectorTarget(run, branchId, nodeId, workflowContext), intent = historicalInspectorIntent(target);
    const invoker = document.activeElement;
    let ownsFocus = true;
    const movedFocus = (event: FocusEvent) => { if (event.target !== invoker && event.target !== document.body) ownsFocus = false; };
    document.addEventListener("focusin", movedFocus, { signal: controller.signal });
    const current = () => !controller.signal.aborted && sequence === generation && run === subjectRun
      && workflowContext === subjectContext && accessIdentity === subjectAccess && sourceHealth === subjectHealth;
    try {
      const response = await onConfirm({ assistance: intent, inspector: { branchId: target.branchId, nodeId: target.nodeId, decisionDigest: target.decision.digest } }, controller.signal);
      if (!current()) return;
      const help = parseInspectorAssistanceResponse(response, target, intent);
      if (!current()) return;
      ready = { target, intent, help, query: async (body, signal) => {
        if (!current()) throw new DOMException("Recorded position retired", "AbortError");
        const value = await onQuery(body, signal);
        if (!current()) throw new DOMException("Recorded position retired", "AbortError");
        return value;
      } }; status = "ready";
      await tick();
      if (current() && ownsFocus && (document.activeElement === invoker || document.activeElement === document.body)) result?.focus();
    } catch {
      if (current()) { ready = undefined; status = "failed"; }
    } finally {
      document.removeEventListener("focusin", movedFocus);
      if (current()) pending = undefined;
    }
  }
</script>

<section class="recorded-inspector" aria-label="Inspect a recorded line" bind:this={seat}>
  <h3>Inspect a recorded line</h3>
  <p>Choose a position from a recorded line. This does not change your current game or reveal help for an unfinished retry.</p>
  <div class="target-controls">
    <label>Recorded line <select value={branchId} onchange={changeLine}>{#each run.branches as branch (branch.id)}<option value={branch.id}>{branch.label}</option>{/each}</select></label>
    <label>Recorded position <select value={nodeId} onchange={changePosition}>{#each path as node, index (node.id)}<option value={node.id}>{index === 0 ? "Starting position" : `${index}. After ${node.moveSan ?? "recorded move"}`}</option>{/each}</select></label>
    <button bind:this={action} type="button" disabled={status === "pending" || nodeId === ""} onclick={() => void confirm()}>{status === "pending" ? "Confirming recorded access…" : status === "failed" ? "Retry recorded access" : "Inspect recorded position"}</button>
    {#if status !== "idle"}<button type="button" onclick={() => retire(true)}>Close recorded evidence</button>{/if}
  </div>
  {#if status === "pending"}<p role="status">Checking access to this recorded position. No evidence source has been requested.</p>{/if}
  {#if status === "failed"}<p role="alert">Recorded evidence is unavailable or access is withheld. You can retry after access or source availability changes.</p>{/if}
  {#if ready !== undefined}
    <h4 tabindex="-1" bind:this={result}>Recorded evidence — {path.findIndex(node => node.id === ready!.target.nodeId) === 0 ? "starting position" : "selected position"}</h4>
    <p>This evidence belongs to the selected recorded line, not your current retry.</p>
    <InspectorSourceBrowser runId={ready.target.runId} branchId={ready.target.branchId} nodeId={ready.target.nodeId}
      decisionDigest={ready.target.decision.digest} fen={ready.target.fen} assistance={ready.intent}
      requestedDigest={ready.help.requestedDigest} finalDigest={ready.help.finalDigest} {peers} onQuery={ready.query}
      onRefreshAssistance={confirm} />
  {/if}
</section>

<style>
  .recorded-inspector { min-width: 0; }
  .target-controls { display: flex; flex-wrap: wrap; align-items: end; gap: .75rem; }
  label { display: grid; gap: .25rem; min-width: 0; max-width: 100%; }
  select { max-width: 100%; }
  h4:focus { outline: 2px solid var(--accent, currentColor); outline-offset: .25rem; }
</style>
