<script lang="ts">
  // rfc/evidence-presentation.md Checkpoint A: the client renderer for sealed presented items. It
  // receives only items the exact receipt parser sealed; it selects, queries and grades nothing.
  // Every text node is the component's own equivalent sentence (presentedSentence), so the visual
  // and screen-reader renderings are the same bytes. Abstention is structurally distinct from a
  // value: it alone carries `data-abstention`, and no value component ever does (§4c).
  import { assertPresentedEvidenceItem, presentedSentence, type PresentedEvidenceItem } from "@chess-tabiya/runtime";

  interface Props { items: readonly PresentedEvidenceItem[] }
  let { items }: Props = $props();

  const view = $derived(items.map((item) => {
    assertPresentedEvidenceItem(item);
    const component = item.component;
    const abstention = component.id === "abstention"
      ? (component.operand.kind === "pending" ? component.operand.stage : component.operand.reason)
      : undefined;
    const convention = component.id === "magnitude" && component.operand.convention.basis.kind === "search"
      ? `${component.operand.convention.producer.id}@${component.operand.convention.producer.version}`
      : undefined;
    return { id: component.id, sentence: presentedSentence(item), abstention, convention, digest: item.componentDigest };
  }));
</script>

{#each view as entry (entry.digest)}
  {#if entry.abstention !== undefined}
    <div class="presented abstention" data-component="abstention" data-abstention={entry.abstention} role="note">
      <p>{entry.sentence}</p>
    </div>
  {:else}
    <div class="presented" data-component={entry.id} data-convention-producer={entry.convention}>
      <p>{entry.sentence}</p>
    </div>
  {/if}
{/each}

<style>
  .presented{display:block}
  .presented p{margin:0}
  .presented[data-component="magnitude"] p{font-variant-numeric:tabular-nums}
  .abstention{border:1px solid var(--line);border-radius:.35rem;padding:.25rem .45rem;color:var(--muted)}
</style>
