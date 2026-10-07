<script lang="ts">
  // rfc/evidence-presentation.md §3.8 — an attributed block: the quoted passage, the registered source
  // title and locator, the licence and the pinned revision, all part of the component itself.
  import type { ComponentValue } from "@chess-tabiya/runtime";

  interface Props { component: Extract<ComponentValue, { id: "citation" }>; sentence: string }
  let { component, sentence }: Props = $props();
  const source = $derived(component.operand.source);
  function sourceHref(value: string | undefined): string | undefined {
    if (value === undefined) return undefined;
    try {
      const url = new URL(value);
      return (url.protocol === "https:" || url.protocol === "http:") && url.username === "" && url.password === "" ? value : undefined;
    } catch { return undefined; }
  }
  const href = $derived(sourceHref(source.url));
</script>

<figure class="citation" data-component="citation" aria-label={sentence}>
  <blockquote>{component.operand.content.text}</blockquote>
  <figcaption>{#if href !== undefined}<a href={href} target="_blank" rel="noopener noreferrer">{source.title}</a>{:else}{source.title}{/if}, {source.locator} · {source.licence} · revision {source.revision}</figcaption>
</figure>

<style>
  .citation{margin:0;display:grid;gap:.2rem}
  blockquote{margin:0;padding-left:.5rem;border-left:2px solid var(--line);color:var(--ink);font-size:.78rem}
  figcaption{font-size:.7rem;color:var(--muted)}
  a{color:var(--accent);overflow-wrap:anywhere}
</style>
