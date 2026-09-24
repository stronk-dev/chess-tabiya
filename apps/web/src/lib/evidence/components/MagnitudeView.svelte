<script lang="ts">
  // rfc/evidence-presentation.md §3.3 — one measured number in tabular figures with its unit and the
  // convention (producer, perspective, bound) rendered inside the same root (§5c). The producer id
  // travels only in a data attribute, never as learner text (§5d).
  import type { ComponentValue } from "@chess-tabiya/runtime";

  interface Props { component: Extract<ComponentValue, { id: "magnitude" }>; sentence: string }
  let { component, sentence }: Props = $props();
  const producer = $derived(`${component.operand.convention.producer.id}@${component.operand.convention.producer.version}`);
</script>

<div class="magnitude" data-component="magnitude" data-convention-producer={producer} data-unit={component.operand.unit.kind}>
  <p class="sentence">{sentence}</p>
</div>

<style>
  .magnitude{display:block}
  .sentence{margin:0;font-variant-numeric:tabular-nums;color:var(--ink)}
</style>
