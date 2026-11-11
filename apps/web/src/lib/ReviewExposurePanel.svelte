<script lang="ts">
  import { reviewText } from "@chess-tabiya/runtime/client";
  import { onMount, tick } from "svelte";
  import { renderFoundationDetailMember } from "../../../../packages/runtime/src/foundation-snapshot-detail.js";
  import type { ExposureDetailScope } from "../../../../packages/runtime/src/defender-exposure-detail.js";
  import type { ReviewExposurePage, ReviewExposureSession } from "./review-exposure.js";

  interface Props {
    load: (signal: AbortSignal, current: () => boolean) => Promise<ReviewExposureSession>;
    current: () => boolean;
    onClose: () => void;
  }
  let { load, current, onClose }: Props = $props();
  let session: ReviewExposureSession | undefined;
  let page = $state.raw<ReviewExposurePage>();
  let failed = $state(false);
  let busy = $state(true);
  let heading = $state<HTMLHeadingElement>();
  let pending: { scope: ExposureDetailScope; start: number } | undefined;
  let pageAbort: AbortController | undefined;
  const lifetime = new AbortController();
  const live = () => !lifetime.signal.aborted && current();
  const captures = { kind: "exposure_captures" } as const;

  async function request(next?: { scope: ExposureDetailScope; start: number }): Promise<void> {
    if (!live()) return;
    const focused = document.activeElement;
    pageAbort?.abort();
    const controller = new AbortController();
    pageAbort = controller;
    const active = () => live() && !controller.signal.aborted;
    pending = next;
    failed = false;
    busy = true;
    try {
      if (session === undefined) {
        const opened = await load(lifetime.signal, live);
        if (!active()) return;
        session = opened;
      }
      const result = next === undefined ? session.initialPage : await session.read(next.scope, next.start, controller.signal, active);
      if (active()) page = result;
    } catch {
      if (active()) {
        session = undefined;
        failed = true;
      }
    } finally {
      if (active()) {
        busy = false;
        await tick();
        if (active() && focused instanceof HTMLElement
          && (!focused.isConnected || focused instanceof HTMLButtonElement && focused.disabled)
          && (document.activeElement === document.body || document.activeElement === focused)) heading?.focus({ preventScroll: true });
      }
    }
  }
  const show = (scope: ExposureDetailScope, start = 0) => void request({ scope, start });
  onMount(() => {
    void request();
    return () => { lifetime.abort(); pageAbort?.abort(); };
  });
</script>

<section class="exposure-detail" aria-labelledby="review-exposure-title" aria-busy={busy}>
  <header>
    <h3 id="review-exposure-title" bind:this={heading} tabindex="-1">{reviewText("exposure.title")}</h3>
    <button type="button" onclick={onClose}>{reviewText("exposure.close")}</button>
  </header>
  {#if busy}<p role="status">{reviewText("exposure.loading")}</p>{/if}
  {#if failed}
    <p role="status">{reviewText("exposure.failed")}</p>
    <button type="button" onclick={() => void request(pending)}>{reviewText("exposure.retry")}</button>
  {/if}
  {#if page && !failed}
    {@const scope = page.scope}
    <p class="muted">{reviewText("exposure.hypothetical")}</p>
    {#if scope.kind !== "exposure_captures"}
      <nav aria-label={reviewText("exposure.navigation")}>
        <button type="button" disabled={busy} onclick={() => show(captures)}>{reviewText("exposure.back_captures")}</button>
        {#if scope.kind === "exposure_branches"}
          <button type="button" disabled={busy} onclick={() => show({ kind: "exposure_exchange", captureIndex: scope.captureIndex })}>{reviewText("exposure.back_exchange")}</button>
          {#if scope.parentPath.length > 0}
            <button type="button" disabled={busy} onclick={() => show({ ...scope, parentPath: scope.parentPath.slice(0, -1) })}>{reviewText("exposure.parent")}</button>
          {/if}
        {/if}
      </nav>
    {/if}
    {#if page.members.length === 0}
      <p>{reviewText("exposure.no_recaptures")}</p>
    {:else}
      <ul>
        {#each page.members as member (member.sourceOrdinal)}
          <li>
            <p>{renderFoundationDetailMember(member)}</p>
            {#if member.kind === "foundation_capture_header" && scope.kind !== "exposure_exchange"}
              <button type="button" disabled={busy} onclick={() => show({ kind: "exposure_exchange", captureIndex: member.value.captureIndex })}>
                {reviewText("exposure.exchange", { number: member.value.captureIndex + 1 })}
              </button>
            {/if}
            {#if member.kind === "foundation_capture_header" && scope.kind === "exposure_exchange" && member.value.branchCount > 0}
              <button type="button" disabled={busy} onclick={() => show({ kind: "exposure_branches", captureIndex: member.value.captureIndex, parentPath: [] })}>{reviewText("exposure.recapture_choices")}</button>
            {:else if member.kind === "foundation_exchange_branch" && scope.kind === "exposure_branches" && member.value.continuationCount > 0}
              <button type="button" disabled={busy} onclick={() => show({ ...scope, parentPath: member.value.path })}>{reviewText("exposure.follow_recapture", { square: member.value.step.from })}</button>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
    <nav aria-label={reviewText("exposure.pages")}>
      {#if page.range.next !== null}
        <button type="button" disabled={busy} onclick={() => page?.range.next != null && show(scope, page.range.next)}>{reviewText("exposure.next")}</button>
      {/if}
      {#if scope.kind === "exposure_captures"}
        <button type="button" disabled={busy} onclick={() => show({ kind: "whole" })}>{reviewText("exposure.all")}</button>
      {/if}
    </nav>
  {/if}
</section>

<style>
  .exposure-detail { min-width: 0; overflow-wrap: anywhere; margin-block: .75rem; padding: .75rem; border: 1px solid var(--line); border-radius: .5rem; }
  header, nav { display: flex; flex-wrap: wrap; gap: .5rem; align-items: baseline; }
  header { justify-content: space-between; }
  h3, li p { margin: 0; }
  .muted { color: var(--muted); }
  ul { padding-inline-start: 1.25rem; }
  li { margin-block: .5rem; }
  li button { margin-block-start: .25rem; }
</style>
