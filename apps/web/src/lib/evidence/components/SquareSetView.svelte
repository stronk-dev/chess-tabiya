<script lang="ts">
  // rfc/evidence-presentation.md §3.5 — the squares of exactly one admitted fact with the one caption
  // that owns them. Focusing the caption or a square chip announces the same fact; the board paint is
  // drawn by the owning seat from the same sealed operand (never a second query).
  import type { ComponentValue } from "@chess-tabiya/runtime";

  interface Props { component: Extract<ComponentValue, { id: "square_set" }>; sentence: string; onFocusSquares?: ((squares: readonly string[] | undefined) => void) | undefined }
  let { component, sentence, onFocusSquares }: Props = $props();
</script>

<div class="square-set" data-component="square_set" data-owner={component.operand.owner.factRef}>
  <p class="caption" tabindex="0" onfocus={() => onFocusSquares?.(component.operand.squares)} onblur={() => onFocusSquares?.(undefined)}>{sentence}</p>
  <ul class="squares" aria-label="Squares of this fact">
    {#each component.operand.squares as square (square)}<li><span class="chip" tabindex="-1">{square}</span></li>{/each}
  </ul>
</div>

<style>
  .square-set{display:grid;gap:.25rem}
  .caption{margin:0;font-size:.78rem;color:var(--ink)}
  .squares{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:.25rem}
  .chip{display:inline-block;padding:0 .3rem;border-radius:.25rem;border:1px solid var(--line);background:var(--accent-soft);color:var(--ink);font-size:.7rem;font-variant-numeric:tabular-nums}
</style>
