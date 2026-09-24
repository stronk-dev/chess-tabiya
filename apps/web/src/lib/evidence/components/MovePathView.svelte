<script lang="ts">
  // rfc/evidence-presentation.md §3.6 — a numbered move list over an ORDERED operand; a searched line
  // carries its convention inside the root. The module ceiling refusal happens before sealing.
  import type { ComponentValue } from "@chess-tabiya/runtime";
  import { attribution } from "../presented-view.js";

  interface Props { component: Extract<ComponentValue, { id: "move_path" }>; sentence: string }
  let { component, sentence }: Props = $props();
</script>

<div class="move-path" data-component="move_path" data-origin={component.operand.origin}>
  <ol class="plies" aria-label={sentence}>
    {#each component.operand.plies as ply (`${ply.ply}${ply.uci}`)}<li>{ply.san}</li>{/each}
  </ol>
  {#if component.operand.convention}<p class="convention">{attribution(component.operand.convention)}</p>{/if}
</div>

<style>
  .move-path{display:grid;gap:.2rem}
  .plies{margin:0;padding-left:1.2rem;display:flex;flex-wrap:wrap;gap:.1rem .9rem;font-size:.78rem;color:var(--ink)}
  .convention{margin:0;font-size:.7rem;color:var(--muted)}
</style>
