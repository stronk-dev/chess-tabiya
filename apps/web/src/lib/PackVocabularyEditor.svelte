<script lang="ts">
  import type { ConceptCatalogueView, PrincipleSummary, ShapeSummary } from "./api.js";
  import { conceptMatches, readPackVocabulary, setClaimPrinciple, setPackConcept, setPackShapeReference, type ShapeRelation } from "./pack-vocabulary-fields.js";

  interface Props {
    documentJson: string;
    shapes: readonly ShapeSummary[];
    principles: readonly PrincipleSummary[];
    /** The compiled concept registry's projection; absent while it loads or when unavailable. */
    concepts?: ConceptCatalogueView | undefined;
    onDocumentJson: (documentJson: string) => void;
  }

  let { documentJson, shapes, principles, concepts, onDocumentJson }: Props = $props();
  let draft = $derived(readPackVocabulary(documentJson));
  let conceptQuery = $state("");
  let selectedConcepts = $derived(new Set(draft.concepts));
  // rfc/concept-registry.md §3: only active entries are offered; a selected retired or unknown id is
  // shown so it can be removed, never re-added.
  let offeredConcepts = $derived((concepts?.entries ?? []).filter((entry) => entry.status === "active" && conceptMatches(entry, conceptQuery)));
  let heldConcepts = $derived(draft.concepts.flatMap((id) => {
    const entry = concepts?.entries.find((candidate) => candidate.id === id);
    return entry?.status === "active" ? [] : [{ id, label: entry?.label ?? id, status: entry?.status ?? "unregistered" }];
  }));
</script>

<section class="vocabulary-editor" aria-labelledby="vocabulary-editor-title">
  <p class="eyebrow">Reusable knowledge</p>
  <h2 id="vocabulary-editor-title">Pack vocabulary</h2>
  {#if !draft.valid}
    <p class="honest">Fix the JSON syntax before choosing registry entries.</p>
  {:else}
    <div class="vocabulary-fields">
      {#each draft.shapeFields as field}
        <details>
          <summary>{field.label} · {field.selected.size} selected</summary>
          <div class="picker-list">
            {#each shapes as shape}
              {@const relation = field.selected.get(shape.id)}
              <article class:selected={relation !== undefined}>
                <label class="picker-choice"><input type="checkbox" checked={relation !== undefined} onchange={(event) => onDocumentJson(setPackShapeReference(documentJson, field.scope, shape.id, event.currentTarget.checked, relation ?? "present"))} /><span><strong>{shape.name}</strong> <code>{shape.id}</code><small>{shape.phases.join(" · ")} · used by {shape.usedByPacks} packs</small></span></label>
                <label class="relation">Relation <select disabled={relation === undefined} value={relation ?? "present"} onchange={(event) => onDocumentJson(setPackShapeReference(documentJson, field.scope, shape.id, true, event.currentTarget.value as ShapeRelation))}><option value="present">Present in authored play</option><option value="prospective">Prospective handoff</option></select></label>
              </article>
            {:else}<p>No shape registry is available.</p>{/each}
          </div>
        </details>
      {/each}
      <details>
        <summary>Concepts · {selectedConcepts.size} selected</summary>
        {#if concepts === undefined}
          <p class="honest">The concept registry is unavailable, so concepts cannot be chosen.</p>
        {:else}
          <label class="concept-search">Find a concept <input type="search" bind:value={conceptQuery} aria-describedby="concept-registry-digest" /></label>
          <p id="concept-registry-digest" class="honest">Registry <code>{concepts.registryDigest}</code>. Concepts are chosen from the registry; new ones are added to the registry as reviewed content, not typed here.</p>
          {#if heldConcepts.length > 0}
            <ul class="held-concepts" aria-label="Concepts that cannot be newly chosen">
              {#each heldConcepts as held}
                <li><span><strong>{held.label}</strong> <code>{held.id}</code> · {held.status === "retired" ? "retired" : "not in the registry"}</span><button type="button" onclick={() => onDocumentJson(setPackConcept(documentJson, held.id, false))}>Remove</button></li>
              {/each}
            </ul>
          {/if}
          <div class="picker-list" role="group" aria-label="Registered concepts">
            {#each offeredConcepts as entry (entry.id)}
              <label class="picker-choice principle" class:selected={selectedConcepts.has(entry.id)}><input type="checkbox" checked={selectedConcepts.has(entry.id)} onchange={(event) => onDocumentJson(setPackConcept(documentJson, entry.id, event.currentTarget.checked))} /><span><strong>{entry.label}</strong> <code>{entry.id}</code></span></label>
            {:else}<p>No registered concept matches.</p>{/each}
          </div>
        {/if}
      </details>
      {#each draft.principleFields as field}
        <details>
          <summary>Claim: {field.id} · {field.selected.size} principles</summary>
          {#if field.text}<p class="claim-text">{field.text}</p>{/if}
          <div class="picker-list">
            {#each principles as principle}
              <label class="picker-choice principle" class:selected={field.selected.has(principle.id)}><input type="checkbox" checked={field.selected.has(principle.id)} onchange={(event) => onDocumentJson(setClaimPrinciple(documentJson, field.index, principle.id, event.currentTarget.checked))} /><span><strong>{principle.name}</strong> <code>{principle.id}</code><small>{principle.statement}</small></span></label>
            {:else}<p>No principle registry is available.</p>{/each}
          </div>
        </details>
      {/each}
    </div>
    {#if draft.principleFields.length === 0}<p class="honest">Add a feedback claim before attaching a principle.</p>{/if}
    <p class="honest">Present shapes may fire and ground authored consequences. Prospective shapes document a future handoff and do not fire or grade this pack.</p>
  {/if}
</section>

<style>
  .vocabulary-editor { margin-block: 1rem; padding: 1rem; border: 1px solid var(--line); border-radius: .8rem; background: var(--panel); }
  h2, p { margin-top: 0; }
  .vocabulary-fields, .picker-list { display: grid; gap: .55rem; }
  details { padding: .65rem; border: 1px solid var(--line); border-radius: .55rem; }
  summary { cursor: pointer; font-weight: 650; }
  .picker-list { margin-top: .65rem; }
  article, .picker-choice.principle { padding: .55rem; border: 1px solid var(--line); border-radius: .5rem; }
  article.selected, .picker-choice.principle.selected { border-color: var(--accent); }
  .picker-choice { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .55rem; align-items: start; }
  .picker-choice span { display: grid; min-width: 0; gap: .2rem; }
  small, .claim-text { color: var(--muted); }
  code, small { overflow-wrap: anywhere; }
  .relation { display: flex; align-items: center; justify-content: flex-end; gap: .5rem; margin-top: .4rem; font-size: .82rem; }
  select { max-width: 14rem; }
  .concept-search { display: grid; gap: .3rem; margin-block: .65rem .4rem; }
  .held-concepts { display: grid; gap: .4rem; padding: 0; list-style: none; }
  .held-concepts li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem; }
</style>
