<script lang="ts">
  // rfc/evidence-presentation.md §3.5 — the squares of exactly one admitted fact with the one caption
  // that owns them. Focusing the caption or a square chip announces the same fact; the board paint is
  // drawn by the owning seat from the same sealed operand (never a second query).
  import type { ComponentValue } from "@chess-tabiya/runtime";

  interface Props { component: Extract<ComponentValue, { id: "square_set" }>; sentence: string; onFocusSquares?: ((squares: readonly string[] | undefined) => void) | undefined }
  let { component, sentence, onFocusSquares }: Props = $props();
</script>

<div class="square-set" data-component="square_set" data-owner={component.operand.owner.factRef}>
  {#if onFocusSquares !== undefined}
    <button type="button" class="caption" onfocus={() => onFocusSquares?.(component.operand.squares)} onclick={() => onFocusSquares?.(component.operand.squares)} onblur={() => onFocusSquares?.(undefined)}>{sentence}</button>
  {:else}
    <p class="caption">{sentence}</p>
  {/if}
  <ul class="squares" aria-label="Squares of this fact">
    {#each component.operand.squares as square (square)}<li>
      {#if onFocusSquares !== undefined}<button type="button" class="chip" aria-label={`${square}: ${sentence}`} onfocus={() => onFocusSquares?.([square])} onclick={() => onFocusSquares?.([square])} onblur={() => onFocusSquares?.(undefined)}>{square}</button>
      {:else}<span class="chip">{square}</span>{/if}
    </li>{/each}
  </ul>
</div>

<style>
  .square-set{display:grid;gap:.25rem}
  .caption{margin:0;padding:0;border:0;background:none;font:inherit;font-size:.78rem;color:var(--ink);text-align:left}
  .squares{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:.25rem}
  .chip{display:inline-block;padding:0 .3rem;border-radius:.25rem;border:1px solid var(--line);background:var(--accent-soft);color:var(--ink);font:inherit;font-size:.7rem;font-variant-numeric:tabular-nums}
  button{cursor:pointer}
  button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
</style>
