<script lang="ts">
  import {
    addPackAttribution,
    readPackProvenance,
    removePackAttribution,
    setPackProvenancePosture,
    setPackProvenanceSources,
    updatePackAttribution,
    type PackAttributionDraft,
  } from "./pack-provenance-editor.js";

  interface Props {
    documentJson: string;
    onDocumentJson: (documentJson: string) => void;
  }

  let { documentJson, onDocumentJson }: Props = $props();
  let draft = $derived(readPackProvenance(documentJson));

  function updateAttribution(index: number, patch: Partial<PackAttributionDraft>): void {
    onDocumentJson(updatePackAttribution(documentJson, index, patch));
  }
</script>

<section class="provenance-editor" aria-labelledby="provenance-editor-title">
  <p class="eyebrow">Rights and sources</p>
  <h2 id="provenance-editor-title">Provenance</h2>
  {#if !draft.valid}
    <p class="honest">Fix the JSON syntax before editing provenance here.</p>
  {:else}
    <fieldset>
      <legend>Choose one whole-pack prose posture</legend>
      <label><input type="radio" name="pack-provenance-posture" checked={draft.posture === "original"} onchange={() => onDocumentJson(setPackProvenancePosture(documentJson, "original"))} /> Original prose; sources are references only</label>
      <label><input type="radio" name="pack-provenance-posture" checked={draft.posture === "cc_by_sa"} onchange={() => onDocumentJson(setPackProvenancePosture(documentJson, "cc_by_sa"))} /> Pack prose is CC BY-SA 4.0 wholesale</label>
      {#if draft.posture === "unsupported"}<p role="alert">These bytes use an unsupported or mixed licence posture{draft.licence ? ` (${draft.licence})` : ""}. Choose a clean posture explicitly; nothing is changed automatically.</p>{/if}
    </fieldset>

    <label for="pack-provenance-sources">Where did this come from? <span>One source id or URL per line.</span></label>
    <textarea id="pack-provenance-sources" value={draft.sources.join("\n")} oninput={(event) => onDocumentJson(setPackProvenanceSources(documentJson, event.currentTarget.value.split("\n")))}></textarea>

    {#if draft.posture === "cc_by_sa"}
      <div class="credit-heading"><h3>Who must be credited?</h3><button type="button" onclick={() => onDocumentJson(addPackAttribution(documentJson))}>Add credit</button></div>
      {#each draft.attribution as credit, index}
        <fieldset class="credit-row">
          <legend>Credit {index + 1}</legend>
          <label>Source id <input value={credit.sourceId} oninput={(event) => updateAttribution(index, { sourceId: event.currentTarget.value })} /></label>
          <label>Required credit / notice <textarea value={credit.noticeText} oninput={(event) => updateAttribution(index, { noticeText: event.currentTarget.value })}></textarea></label>
          <label>Source URL <input type="url" value={credit.url} oninput={(event) => updateAttribution(index, { url: event.currentTarget.value })} /></label>
          <label>Retrieved on <input type="date" value={credit.retrievedAt} oninput={(event) => updateAttribution(index, { retrievedAt: event.currentTarget.value })} /></label>
          <button type="button" onclick={() => onDocumentJson(removePackAttribution(documentJson, index))}>Remove credit {index + 1}</button>
        </fieldset>
      {:else}<p class="honest">Add every attribution required by the reused prose before registration.</p>{/each}
    {/if}

    <aside class="cc0-limit" aria-labelledby="cc0-limit-title">
      <h3 id="cc0-limit-title">CC0 source limitation</h3>
      <p>The current pack attribution checker cannot represent a credited CC0 entry. Record the source above, but do not create a credited-looking CC0 row or mix licences. Candidate-pipeline support must land before Studio can validate that posture.</p>
    </aside>
    <p class="honest">The posture applies to the whole pack. Tabiya does not track licensing per paragraph or rewrite authored prose automatically.</p>
  {/if}
</section>

<style>
  .provenance-editor { margin-block: 1rem; padding: 1rem; border: 1px solid var(--line); border-radius: .8rem; background: var(--panel); }
  h2, h3 { margin: 0; }
  fieldset, label { display: grid; gap: .35rem; }
  fieldset { margin-block: .8rem; padding: .8rem; border: 1px solid var(--line); border-radius: .65rem; }
  fieldset label { grid-template-columns: auto minmax(0, 1fr); align-items: start; }
  label > span { color: var(--muted); font-size: .82rem; }
  input, textarea { width: 100%; padding: .6rem; border: 1px solid var(--line); border-radius: .5rem; background: var(--paper); color: var(--ink); }
  input[type="radio"] { width: auto; }
  textarea { min-height: 5rem; resize: vertical; }
  .credit-heading { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
  .credit-row label { grid-template-columns: 9rem minmax(0, 1fr); align-items: center; }
  .cc0-limit { margin-top: 1rem; padding: .8rem; border-inline-start: .25rem solid var(--accent); background: var(--surface); }
  @media (max-width: 45rem) { .credit-row label { grid-template-columns: 1fr; } }
</style>
