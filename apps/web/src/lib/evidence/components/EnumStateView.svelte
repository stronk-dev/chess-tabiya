<script lang="ts">
  // rfc/evidence-presentation.md §3.9 — one member of a closed vocabulary rendered as its registry
  // label; the valence token comes from the registry, never from the call site.
  import { LABEL_VOCABULARIES, type ComponentValue, type LabelVocabulary } from "@chess-tabiya/runtime";

  interface Props { component: Extract<ComponentValue, { id: "enum_state" }>; sentence: string }
  let { component, sentence }: Props = $props();
  const valence = $derived((LABEL_VOCABULARIES[component.operand.vocabulary] as LabelVocabulary<string>)[component.operand.value]?.valence ?? "neutral");
</script>

<span class={`state ${valence}`} data-component="enum_state">{sentence}</span>

<style>
  .state{display:inline-block;padding:0 .4rem;border-radius:.6rem;border:1px solid var(--line);font-size:.74rem;color:var(--ink)}
  .positive{border-color:var(--accent)}
  .caution{border-color:var(--warning)}
  .adverse{border-color:var(--danger)}
</style>
