<script lang="ts">
  // rfc/evidence-presentation.md §3.2 — one stacked bar in three segments over a stated perspective.
  // Segments use accent / muted / line weightings, never a good/bad axis. A withheld (below-floor)
  // or empty split draws NO bar: it is a different picture from a real split (§4b).
  import type { ComponentValue } from "@chess-tabiya/runtime";
  import { attribution, outcomeSegments } from "../presented-view.js";

  interface Props { component: Extract<ComponentValue, { id: "outcome_split" }>; sentence: string }
  let { component, sentence }: Props = $props();
  const segments = $derived(outcomeSegments(component));
</script>

<figure class="outcome" data-component="outcome_split" data-perspective={component.operand.perspective}>
  {#if segments.length > 0}
    <div class="bar" aria-hidden="true">
      {#each segments as segment (segment.side)}<span class={`segment ${segment.side}`} style:width={`${segment.width}%`}></span>{/each}
    </div>
    <ul class="legend" aria-hidden="true">
      {#each segments as segment (segment.side)}<li>{segment.label} {segment.share}</li>{/each}
    </ul>
  {/if}
  <figcaption class="convention">{attribution(component.operand.convention)}</figcaption>
  {#if segments.length > 0}
    <p class="visually-hidden">{sentence}</p>
  {:else}
    <!-- §4b: a withheld or empty split is the abstention rendering: no bar, the reason is an attribute. -->
    <p class="stated" data-abstention={component.operand.total === 0 ? "no_observation" : "floor_not_met"}>{sentence}</p>
  {/if}
</figure>

<style>
  .outcome{margin:0;display:grid;gap:.3rem}
  .bar{display:flex;height:.6rem;border-radius:.3rem;overflow:hidden;border:1px solid var(--line)}
  .segment{display:block;height:100%}
  .white{background:var(--accent)}
  .draws{background:var(--muted)}
  .black{background:var(--line)}
  .legend{list-style:none;margin:0;padding:0;display:flex;gap:.6rem;font-size:.74rem;font-variant-numeric:tabular-nums;color:var(--ink)}
  .convention{font-size:.7rem;color:var(--muted)}
  .stated{margin:0;font-size:.78rem;color:var(--ink)}
</style>
