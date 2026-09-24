<script lang="ts">
  // rfc/evidence-presentation.md §3.1 — ranked rows, each a label, a proportional bar and the share
  // numeral; the residual is drawn explicitly and the convention line sits inside the root. No row
  // is ever coloured by quality: the highlight only locates the move you played.
  import type { ComponentValue } from "@chess-tabiya/runtime";
  import { attribution, distributionRows } from "../presented-view.js";

  interface Props { component: Extract<ComponentValue, { id: "distribution" }>; sentence: string }
  let { component, sentence }: Props = $props();
  const rows = $derived(distributionRows(component));
</script>

<figure class="distribution" data-component="distribution">
  <ol class="rows" aria-hidden="true">
    {#each rows as row (row.label)}
      <li class:highlighted={row.highlighted} class:withheld={row.withheld}>
        <span class="label">{row.label}</span>
        <span class="track">{#if !row.withheld}<span class="bar" style:width={`${row.width}%`}></span>{/if}</span>
        <span class="share">{row.share}</span>
      </li>
    {/each}
  </ol>
  <figcaption class="convention">{attribution(component.operand.convention)}</figcaption>
  <p class="visually-hidden">{sentence}</p>
</figure>

<style>
  .distribution{margin:0;display:grid;gap:.3rem}
  .rows{list-style:none;margin:0;padding:0;display:grid;gap:.2rem}
  .rows li{display:grid;grid-template-columns:3.2rem 1fr 3rem;align-items:center;gap:.4rem;font-size:.78rem}
  .label{font-weight:600;color:var(--ink)}
  .track{display:block;height:.5rem;border-radius:.25rem;background:var(--surface);border:1px solid var(--line);overflow:hidden}
  .bar{display:block;height:100%;background:var(--accent-soft)}
  .highlighted .bar{background:var(--accent)}
  .withheld .label{color:var(--muted)}
  .share{text-align:right;font-variant-numeric:tabular-nums;color:var(--ink)}
  .convention{font-size:.7rem;color:var(--muted)}
</style>
