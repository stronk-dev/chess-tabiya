<script lang="ts">
  // rfc/evidence-presentation.md §3.6a — one admitted directed relation: the retained edges as chips
  // (the seat draws the same edges as board arrows within its arrow budget). The equivalent sentence
  // names only retained endpoints; gained/lost use line pattern, never a good/bad colour.
  import type { ComponentValue } from "@chess-tabiya/runtime";
  import { attribution, relationChips } from "../presented-view.js";

  interface Props { component: Extract<ComponentValue, { id: "relation_overlay" }>; sentence: string; onFocusSquares?: ((squares: readonly string[] | undefined) => void) | undefined }
  let { component, sentence, onFocusSquares }: Props = $props();
  const chips = $derived(relationChips(component));
  const squares = $derived(component.operand.nodes.map((node) => node.square));
</script>

<div class="relation" data-component="relation_overlay" data-owner={component.operand.owner.factRef}>
  <ul class="edges" aria-label={sentence} tabindex="0" onfocus={() => onFocusSquares?.(squares)} onblur={() => onFocusSquares?.(undefined)}>
    {#each chips as chip (`${chip.from}${chip.to}${chip.phrase}`)}<li class={chip.sign}><span>{chip.from}</span><span aria-hidden="true"> → </span><span>{chip.to}</span></li>{/each}
  </ul>
  {#if component.operand.convention}<p class="convention">{attribution(component.operand.convention)}</p>{/if}
</div>

<style>
  .relation{display:grid;gap:.2rem}
  .edges{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:.3rem}
  .edges li{padding:0 .35rem;border:1px solid var(--line);border-radius:.3rem;font-size:.72rem;color:var(--ink);font-variant-numeric:tabular-nums}
  .edges li.lost{border-style:dashed}
  .edges li.gained{border-color:var(--accent)}
  .convention{margin:0;font-size:.7rem;color:var(--muted)}
</style>
