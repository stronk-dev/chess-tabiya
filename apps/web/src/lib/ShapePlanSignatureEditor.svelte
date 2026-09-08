<script lang="ts">
  import { markShapePlanUncheckable, readShapePlanSignatures, updateShapePlanRefusalNote } from "./shape-plan-signatures.js";
  import StructuralExpressionNode from "./StructuralExpressionNode.svelte";
  import { defaultStructuralExpression, readShapeExpressions, setShapePlanSignature, setShapeTrigger } from "./structural-expression-builder.js";

  interface Props {
    documentJson: string;
    onDocumentJson: (documentJson: string) => void;
  }

  let { documentJson, onDocumentJson }: Props = $props();
  let draft = $derived(readShapePlanSignatures(documentJson));
  let expressions = $derived(readShapeExpressions(documentJson));
  let proposedReasons: Record<number, string> = $state({});
</script>

<section class="signature-editor" aria-labelledby="signature-editor-title">
  <h3 id="signature-editor-title">Structural expression builder</h3>
  {#if !draft.valid}
    <p class="honest">Fix the shape JSON syntax before editing structural checks.</p>
  {:else}
    <p class="honest">Build the trigger and plan checks here. The Shape JSON above stays live and remains the complete source.</p>
    {#if expressions.trigger}
      <article class="trigger-expression">
        <div><strong>Shape trigger</strong></div>
        <StructuralExpressionNode expression={expressions.trigger} onExpression={(expression) => onDocumentJson(setShapeTrigger(documentJson, expression))} />
      </article>
    {:else}<p role="status">Add a valid trigger object in the JSON before using the builder.</p>{/if}
    {#if draft.plans.length === 0}<p class="honest">Add a plan to choose how its success can be checked.</p>{/if}
    <div class="signature-list">
      {#each draft.plans as plan, index}
        <article>
          <div><strong>{plan.label}</strong> <code>{plan.id}</code></div>
          {#if plan.state === "uncheckable"}
            <p><strong>Honest refusal:</strong> this plan is deliberately not graded from one structural position.</p>
            <label>Why it cannot be expressed structurally
              <textarea value={plan.note} oninput={(event) => onDocumentJson(updateShapePlanRefusalNote(documentJson, index, event.currentTarget.value))}></textarea>
            </label>
          {:else if plan.state === "structural"}
            <p><strong>Structurally checkable.</strong></p>
            {#if expressions.plans[index]?.signature && expressions.plans[index]?.signature !== null}
              <StructuralExpressionNode expression={expressions.plans[index]!.signature!} onExpression={(expression) => onDocumentJson(setShapePlanSignature(documentJson, index, expression))} />
            {/if}
            <details>
              <summary>Replace the structural check with an honest refusal</summary>
              <label>Required reason<textarea value={proposedReasons[index] ?? ""} oninput={(event) => proposedReasons = { ...proposedReasons, [index]: event.currentTarget.value }}></textarea></label>
              <button type="button" disabled={!(proposedReasons[index] ?? "").trim()} onclick={() => onDocumentJson(markShapePlanUncheckable(documentJson, index, proposedReasons[index] ?? ""))}>Use null signature</button>
            </details>
          {:else}
            <p role="status">No success signature has been chosen.</p>
            <button type="button" onclick={() => onDocumentJson(setShapePlanSignature(documentJson, index, defaultStructuralExpression()))}>Add structural check</button>
            <label>Why one position cannot certify success<textarea value={proposedReasons[index] ?? plan.note} oninput={(event) => proposedReasons = { ...proposedReasons, [index]: event.currentTarget.value }}></textarea></label>
            <button type="button" disabled={!(proposedReasons[index] ?? plan.note).trim()} onclick={() => onDocumentJson(markShapePlanUncheckable(documentJson, index, proposedReasons[index] ?? plan.note))}>Mark deliberately uncheckable</button>
          {/if}
        </article>
      {/each}
    </div>
    <p class="honest">A null signature is not missing work: its note tells learners and validators why the plan cannot honestly be graded from a structural snapshot.</p>
  {/if}
</section>

<style>
  .signature-editor { display: grid; gap: .6rem; margin-block: .8rem; padding: .8rem; border: 1px solid var(--line); border-radius: .65rem; }
  h3, p { margin: 0; }
  .signature-list { display: grid; gap: .6rem; }
  .trigger-expression { border-color: var(--accent); }
  article { display: grid; gap: .5rem; padding: .7rem; border: 1px solid var(--line); border-radius: .55rem; background: var(--panel); }
  label, details { display: grid; gap: .35rem; }
  textarea { min-height: 4.5rem; padding: .55rem; border: 1px solid var(--line); border-radius: .45rem; resize: vertical; }
  code { overflow-wrap: anywhere; }
</style>
