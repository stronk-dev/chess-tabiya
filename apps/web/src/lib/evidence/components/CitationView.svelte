<script lang="ts">
  // rfc/evidence-presentation.md §3.8 — an attributed block: the quoted passage, the registered source
  // title and locator, the licence and the pinned revision, all part of the component itself.
  import type { ComponentValue } from "@chess-tabiya/runtime";

  interface Props { component: Extract<ComponentValue, { id: "citation" }>; sentence: string }
  let { component, sentence }: Props = $props();
  const source = $derived(component.operand.source);
</script>

<figure class="citation" data-component="citation" aria-label={sentence}>
  <blockquote>{component.operand.content.text}</blockquote>
  <figcaption>{source.title}, {source.locator} · {source.licence} · revision {source.revision}</figcaption>
</figure>

<style>
  .citation{margin:0;display:grid;gap:.2rem}
  blockquote{margin:0;padding-left:.5rem;border-left:2px solid var(--line);color:var(--ink);font-size:.78rem}
  figcaption{font-size:.7rem;color:var(--muted)}
</style>
