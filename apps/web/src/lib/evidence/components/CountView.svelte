<script lang="ts">
  // rfc/evidence-presentation.md §3.7 — a numerator against the base it was drawn from; the
  // component computes the proportion itself. A zero denominator (or an unmet floor) draws no mark.
  import type { ComponentValue } from "@chess-tabiya/runtime";
  import { countView } from "../presented-view.js";

  interface Props { component: Extract<ComponentValue, { id: "count_with_denominator" }>; sentence: string }
  let { component, sentence }: Props = $props();
  const view = $derived(countView(component));
</script>

<div class="count" data-component="count_with_denominator">
  <p class="value">{view.text}</p>
  {#if view.width !== null}<span class="track" aria-hidden="true"><span class="bar" style:width={`${view.width}%`}></span></span>{/if}
  <p class="visually-hidden">{sentence}</p>
</div>

<style>
  .count{display:grid;gap:.2rem}
  .value{margin:0;font-size:.78rem;font-variant-numeric:tabular-nums;color:var(--ink)}
  .track{display:block;height:.35rem;border-radius:.2rem;background:var(--surface);border:1px solid var(--line);overflow:hidden}
  .bar{display:block;height:100%;background:var(--accent)}
</style>
