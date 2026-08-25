<script lang="ts">
  import type { PrincipleSummary, ShapeSummary } from "./api.js";
  import { readPackVocabulary, setClaimPrinciple, setPackShapeReference, type ShapeRelation } from "./pack-vocabulary-fields.js";

  interface Props {
    documentJson: string;
    shapes: readonly ShapeSummary[];
    principles: readonly PrincipleSummary[];
    onDocumentJson: (documentJson: string) => void;
  }

  let { documentJson, shapes, principles, onDocumentJson }: Props = $props();
  let draft = $derived(readPackVocabulary(documentJson));
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
</style>
