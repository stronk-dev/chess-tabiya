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

<style>
  .statement{margin:0;color:var(--ink)}
</style>
