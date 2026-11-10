<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { parsePresentationReceipt, reviewText } from "@chess-tabiya/runtime/client";
  import { parseRecordedClockView, type RecordedClockView } from "../../../../packages/runtime/src/recorded-clock-view.js";
  import type { ReviewMap } from "./api.js";
  import PresentedEvidence from "./evidence/PresentedEvidence.svelte";
  import { isWorkflowPreferenceStorageKey, WORKFLOW_PREFERENCE_CHANGED } from "./assistance-preference.js";

  interface Props {
    review: ReviewMap;
    nodeId?: string | undefined;
    accessIdentity: string;
    enabled?: boolean;
    load?: ((review: ReviewMap, nodeId: string, signal: AbortSignal, current: () => boolean) => Promise<RecordedClockView>) | undefined;
  }
  let { review, nodeId, accessIdentity, enabled = true, load }: Props = $props();
  type Owner = { readonly review: ReviewMap; readonly nodeId: string; readonly access: string; readonly preference: number; readonly loader: NonNullable<Props["load"]>; readonly serial: number; readonly abort: AbortController };
  type State = { readonly kind: "pending" | "failed"; readonly owner: Owner } | { readonly kind: "ready"; readonly owner: Owner; readonly page: RecordedClockView };
  let clockState = $state.raw<State | undefined>(), retry = $state(0), preference = $state(0);
  let serial = 0, alive = true;
  const current = (owner: Owner): boolean => alive && enabled && !owner.abort.signal.aborted && owner.serial === serial
    && owner.review === review && owner.nodeId === nodeId && owner.access === accessIdentity && owner.preference === preference && owner.loader === load;
  const shown = $derived(clockState !== undefined && current(clockState.owner) ? clockState : undefined);
  const items = $derived(shown?.kind === "ready" ? parsePresentationReceipt(shown.page.presentation) : []);
  const retryOwners = new WeakMap<HTMLButtonElement, State>();
  function bindRetry(control: HTMLButtonElement, failed: State) {
    if (failed.kind !== "failed") throw new Error("Retry control requires its original failed owner");
    retryOwners.set(control, failed);
    return { destroy: () => { retryOwners.delete(control); } };
  }
  function retryFailed(this: HTMLButtonElement): void {
    const failed = retryOwners.get(this);
    if (failed !== undefined && failed.kind === "failed" && failed === clockState && current(failed.owner)) retry += 1;
  }

  $effect(() => {
    const snapshot = review, selected = nodeId, loader = load, access = accessIdentity, permitted = enabled;
    retry; const observedPreference = preference;
    serial += 1;
    if (!permitted || snapshot.source.kind === "native" || selected === undefined || loader === undefined) { clockState = undefined; return; }
    const owner: Owner = Object.freeze({ review: snapshot, nodeId: selected, access, preference: observedPreference, loader, serial, abort: new AbortController() });
    clockState = { kind: "pending", owner };
    void (async () => {
      try {
        const received = await loader(snapshot, selected, owner.abort.signal, () => current(owner));
        if (!current(owner)) return;
        const row = snapshot.rows.find(item => item.nodeId === selected);
        if (row === undefined) throw new Error("The selected recorded move is no longer represented");
        const parent = snapshot.rows.find(item => item.nodeId === row.entryNodeId);
        const previous = snapshot.rows.find(item => item.ply === row.ply - 2);
        const page = parseRecordedClockView(received, { runId: snapshot.runId, branchId: snapshot.branchId, nodeId: selected, eventHeadSeq: snapshot.decision.eventHeadSeq,
          afterFen: row.fen, moveUci: row.moveUci, side: row.side, sourcePly: row.ply, parentNodeId: row.entryNodeId, rootNodeId: snapshot.rows[0]!.entryNodeId,
          ...(parent === undefined ? {} : { beforeFen: parent.fen }),
          ...(previous === undefined ? {} : { previousSample: { nodeId: previous.nodeId, sourcePly: previous.ply, moveUci: previous.moveUci, side: previous.side } }) });
        if (current(owner)) clockState = { kind: "ready", owner, page };
      } catch {
        if (current(owner)) clockState = { kind: "failed", owner };
      }
    })();
    return () => { owner.abort.abort(); };
  });
  onMount(() => {
    const retire = () => { clockState?.owner.abort.abort(); preference += 1; };
    const storageChanged = (event: StorageEvent) => {
      if (event.storageArea !== null) { try { if (event.storageArea !== window.localStorage) return; } catch { return; } }
      if (isWorkflowPreferenceStorageKey(review.workflowContext, event.key)) retire();
    };
    const localChanged = (event: Event) => { if ((event as CustomEvent<{ context?: unknown }>).detail?.context === review.workflowContext) retire(); };
    window.addEventListener("storage", storageChanged); window.addEventListener(WORKFLOW_PREFERENCE_CHANGED, localChanged);
    return () => { window.removeEventListener("storage", storageChanged); window.removeEventListener(WORKFLOW_PREFERENCE_CHANGED, localChanged); };
  });
  onDestroy(() => { alive = false; serial += 1; clockState?.owner.abort.abort(); });
</script>

<section class="clock-readout" aria-label={reviewText("clock.title")} aria-busy={shown?.kind === "pending"} data-recorded-clock={review.source.kind === "native" ? "native" : shown?.kind ?? "unavailable"}>
  <h3>{reviewText("clock.title")}</h3>
  <div class="clock-content" aria-live="polite">
    {#if review.source.kind === "native"}
      <p>{reviewText("clock.native")}</p>
    {:else if shown?.kind === "pending"}
      <p role="status">{reviewText("clock.pending")}</p>
    {:else if shown?.kind === "failed"}
      <p role="status">{reviewText("clock.failed")}</p>
      {#key shown.owner.serial}<button type="button" use:bindRetry={shown} onclick={retryFailed}>{reviewText("clock.retry")}</button>{/key}
    {:else if shown?.kind === "ready"}
      {#if shown.page.reading.kind === "unavailable"}
        <p>{shown.page.reading.reason === "missing_context" ? reviewText("clock.no_context") : reviewText("clock.source_failed")}</p>
      {:else}
        <div class="clock-facts"><PresentedEvidence {items} /></div>
        {#if shown.page.use.kind === "unavailable"}<p class="muted">{reviewText("clock.use_unavailable")}</p>{/if}
      {/if}
    {:else}
      <p>{reviewText("clock.unavailable")}</p>
    {/if}
  </div>
</section>

<style>
  .clock-readout{box-sizing:border-box;block-size:15rem;min-block-size:15rem;max-block-size:15rem;min-inline-size:0;overflow:auto;overflow-wrap:anywhere;padding:.6rem .7rem;border:1px solid var(--line);border-radius:.5rem;background:var(--panel)}
  h3{font-size:.95rem;margin:0 0 .4rem}
  p{margin:.35rem 0;line-height:1.4}
  .clock-facts{font-family:ui-monospace,monospace;font-variant-numeric:tabular-nums}
  .muted{color:var(--muted);font-size:.85rem}
  button{font:inherit}
</style>
