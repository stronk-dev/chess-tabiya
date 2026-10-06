<script lang="ts">
  // The play-composition §2.2 layout frame, not an evidence producer or request controller.
  // In a tablet band, the same mounted seat contributes a selector and (only when open) a head.
  // Outside that band its ordinary rail markup remains intact. Receipts/counts stay caller-owned.
  import type { Snippet } from "svelte";
  import type { PlayExpandedSeat } from "./module-seats.js";

  interface Props {
    id: string;
    label: string;
    shortLabel?: string;
    module?: Exclude<PlayExpandedSeat, "support_tools">;
    band?: boolean;
    open?: boolean;
    state?: string;
    badge?: number | null | undefined;
    headSlot?: boolean;
    tools?: boolean;
    controlLabel?: string;
    disabled?: boolean;
    onToggle?: (() => void) | undefined;
    children: Snippet;
  }
  let { id, label, shortLabel = label, module, band = false, open = true, state,
    badge, headSlot = false, tools = false, controlLabel = label, disabled = false,
    onToggle, children }: Props = $props();
  let shown = $derived(open || (tools && !band));
</script>

<section class:module-seat={module !== undefined} class:companion-tools={tools}
  class:head-slot={headSlot} class:band role={tools ? "group" : undefined} aria-label={label}
  data-module={module} data-seat-class={module === undefined ? undefined : headSlot ? "board_adjacent" : "rail"}
  data-seat-state={module === undefined ? undefined : headSlot ? state : open ? "expanded" : state}>
  {#if !headSlot && (!tools || band)}
    {#if onToggle !== undefined}
      <button type="button" class="seat-row" class:queue-selector={band}
        title={band ? label : undefined} aria-label={controlLabel} aria-expanded={open}
        aria-controls={`${id}-card`} disabled={disabled} onclick={onToggle}>
        <span class="seat-label">{band ? shortLabel : label}</span>
        {#if badge !== undefined && badge !== null}<span class="seat-badge" aria-label={`${badge} ${badge === 1 ? "fact" : "facts"}`}>{badge}</span>{/if}
      </button>
    {:else}<h2>{label}</h2>{/if}
  {/if}
  <!-- Hidden preserves a mounted Hint's request/rung and existing Support control state. -->
  <div id={`${id}-card`} class="seat-card" class:tools-card={tools} hidden={!shown}
    data-queue-head={band && shown ? id : undefined}>
    {#if band && shown && !headSlot}<strong class="seat-title">{label}</strong>{/if}
    {@render children()}
  </div>
</section>

<style>
  .module-seat { display:grid; gap:.35rem; margin:0; padding:.55rem .65rem; border:1px solid var(--line); border-radius:.7rem; background:var(--panel); }
  .head-slot { border-color:var(--warning); }
  .seat-row { display:flex; justify-content:space-between; align-items:center; gap:.5rem; width:100%; padding:0; border:0; background:none; color:var(--ink); font:inherit; font-weight:600; text-align:left; cursor:pointer; }
  .seat-row:disabled { cursor:default; opacity:.65; }
  .seat-badge { min-width:1.3rem; padding:0 .35rem; border-radius:.65rem; background:var(--accent-soft); color:var(--ink); font:normal .72rem var(--display-font); text-align:center; font-variant-numeric:tabular-nums; }
  .seat-card { display:grid; gap:.35rem; font-size:.78rem; }
  .seat-card[hidden] { display:none; }
  h2 { margin:0; font:600 1rem/1.2 var(--display-font); }
  .companion-tools, .companion-tools > .tools-card { display:contents; }
  .band { display:contents; }
  .band > .queue-selector { grid-row:2; min-width:0; min-height:2rem; padding:.3rem .4rem; gap:.25rem; border:1px solid var(--line); border-radius:.5rem; background:var(--paper); font-size:.7rem; justify-content:center; white-space:nowrap; }
  .band > .queue-selector[aria-expanded="true"] { border-color:var(--accent); color:var(--accent); }
  .band > .seat-card { grid-row:1; grid-column:1/-1; min-width:0; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:.4rem .55rem; border:1px solid var(--line); border-radius:.5rem; background:var(--panel); align-content:start; }
  .band.head-slot > .seat-card { border-color:var(--warning); }
  .band.companion-tools > .tools-card { display:grid; }
  .band > .seat-card[hidden] { display:none; }
  .seat-title { font:600 .8rem/1.2 var(--display-font); }
</style>
