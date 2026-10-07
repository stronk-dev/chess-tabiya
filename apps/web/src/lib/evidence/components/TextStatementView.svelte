<script lang="ts">
  // rfc/evidence-presentation.md §3.10 (claim) and §3.10a (fact_statement) — a registered sentence
  // recomputed from the sealed operand on parse; the claim's binding is its attribution. No caller
  // may attach prose: the only text is the component's own equivalent sentence.
  import type { ComponentValue } from "@chess-tabiya/runtime";

  interface Props { component: Extract<ComponentValue, { id: "claim" | "fact_statement" }>; sentence: string }
  let { component, sentence }: Props = $props();
  const binding = $derived(component.id === "claim" ? component.operand.binding : component.operand.binding);
</script>

<p class="statement" data-component={component.id} data-binding={binding}>{sentence}</p>
{#if component.id === "fact_statement" && component.operand.rendererId === "play.shape_entry@1"}
  <a class="pattern-entry" href={`/library/shape/${encodeURIComponent(component.operand.operands.entryId)}`}>Open pattern entry</a>
{/if}

<style>
  .statement{margin:0;color:var(--ink);white-space:pre-line;overflow-wrap:anywhere}
  .pattern-entry{display:inline-block;margin-top:.5rem;color:var(--ink);text-underline-offset:.2em}
  .pattern-entry:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
</style>
