<script lang="ts">
  import { markShapePlanUncheckable, readShapePlanSignatures, updateShapePlanRefusalNote } from "./shape-plan-signatures.js";

  interface Props {
    documentJson: string;
    onDocumentJson: (documentJson: string) => void;
  }

  let { documentJson, onDocumentJson }: Props = $props();
  let draft = $derived(readShapePlanSignatures(documentJson));
  let proposedReasons: Record<number, string> = $state({});
</script>

<section class="signature-editor" aria-labelledby="signature-editor-title">
  <h3 id="signature-editor-title">Plan success checks</h3>
  {#if !draft.valid}
    <p class="honest">Fix the shape JSON syntax before choosing success checks.</p>
  {:else if draft.plans.length === 0}
    <p class="honest">Add a plan to choose how its success can be checked.</p>
  {:else}
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
            <p><strong>Structurally checkable.</strong> Its expression remains editable in the JSON.</p>
            <details>
              <summary>Replace the structural check with an honest refusal</summary>
              <label>Required reason<textarea value={proposedReasons[index] ?? ""} oninput={(event) => proposedReasons = { ...proposedReasons, [index]: event.currentTarget.value }}></textarea></label>
              <button type="button" disabled={!(proposedReasons[index] ?? "").trim()} onclick={() => onDocumentJson(markShapePlanUncheckable(documentJson, index, proposedReasons[index] ?? ""))}>Use null signature</button>
            </details>
          {:else}
            <p role="status">No success signature has been chosen.</p>
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
  article { display: grid; gap: .5rem; padding: .7rem; border: 1px solid var(--line); border-radius: .55rem; background: var(--panel); }
  label, details { display: grid; gap: .35rem; }
  textarea { min-height: 4.5rem; padding: .55rem; border: 1px solid var(--line); border-radius: .45rem; resize: vertical; }
  code { overflow-wrap: anywhere; }
</style>
