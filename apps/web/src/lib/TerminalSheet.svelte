<script lang="ts">
  import { onMount } from "svelte";
  import { modalBoundary } from "./modal-boundary.js";

  import type { RunOutcome } from "@chess-tabiya/runtime";
  import type { AuthoredFeedbackItem, ShapeEntryView } from "./api.js";
  import type { EvidenceSentence } from "./evidence-sentences.js";
  import OutcomeContext from "./OutcomeContext.svelte";
  import type { DrillRun } from "@chess-tabiya/runtime";
  import { theoryVerdictSentence, UNKNOWN_THEORY_NOTE } from "./theory-presentation.js";
  import { claimProvenance } from "./claim-presentation.js";

  export interface AssignmentSubmissionOffer {
    readonly id: string;
    readonly classroomName: string;
    readonly assignedByHandle: string;
    readonly teacherHandles: readonly string[];
    readonly note: string | null;
  }

  interface Props {
    outcome: RunOutcome;
    authoredItems: readonly AuthoredFeedbackItem[];
    evidence: readonly EvidenceSentence[];
    canRewind: boolean;
    onRewind: () => void | Promise<void>;
    onStop: () => void;
    assessment?: string | undefined;
    resistance?: readonly string[];
    grade?: string | undefined;
    run: DrillRun;
    shapes?: readonly ShapeEntryView[];
    onStory?: (() => void) | undefined;
    onFlip?: (() => void | Promise<void>) | undefined;
    onInspectEvidence?: (() => void) | undefined;
    assignmentOffers?: readonly AssignmentSubmissionOffer[] | undefined;
    onSubmitAssignment?: ((assignmentId: string) => Promise<void>) | undefined;
  }

  let { outcome, authoredItems, evidence, canRewind, onRewind, onStop, assessment, resistance = [], grade, run, shapes = [], onStory, onFlip, onInspectEvidence, assignmentOffers = [], onSubmitAssignment }: Props = $props();
  let heading: HTMLHeadingElement;
  let selectedAssignmentId: string | undefined = $state();
  let submissionBusy = $state(false);
  let submissionError: string | undefined = $state();
  let selectedAssignment = $derived(assignmentOffers.find((assignment) => assignment.id === selectedAssignmentId));
  onMount(() => heading?.focus());

  async function submitAssignment(): Promise<void> {
    if (selectedAssignment === undefined || onSubmitAssignment === undefined || submissionBusy) return;
    submissionBusy = true;
    submissionError = undefined;
    try {
      await onSubmitAssignment(selectedAssignment.id);
      selectedAssignmentId = undefined;
    } catch (error) {
      submissionError = error instanceof Error ? error.message : String(error);
    } finally {
      submissionBusy = false;
    }
  }
</script>

<div class="backdrop">
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="outcome-title" use:modalBoundary>
    <p class="eyebrow">Attempt complete</p>
    <h2 id="outcome-title" tabindex="-1" bind:this={heading}>
      {outcome === "win" ? "You won." : outcome === "loss" ? "You lost." : "Draw."}
    </h2>

    {#if assessment !== undefined || resistance.length > 0}
      <OutcomeContext {assessment} {resistance} {grade} />
    {/if}

    {#if authoredItems.length > 0}
      <section aria-labelledby="terminal-commentary">
        <h3 id="terminal-commentary">Authored commentary</h3>
        <ul>
          {#each authoredItems as item}
            <li>
              {#if item.kind === "annotation"}{item.text}
              {:else if item.kind === "deviation"}{item.note}
              {:else if item.kind === "plan_class"}<strong>{item.label}</strong>{#if item.shapePlan}{@const plan=shapes.find((entry)=>entry.id===item.shapePlan!.shape)?.plans.find((candidate)=>candidate.id===item.shapePlan!.plan)}{#if plan} — {plan.description}{/if}{/if}{#if item.description} — {item.description}{/if}{#if item.gradability === "declared_uncheckable"}<p>This plan has no structural signature, so the drill does not check it.</p>{#if item.gradabilityNote}<p>{item.gradabilityNote}</p>{/if}{/if}
              {:else if item.kind === "claim"}<span class="kind">Author's claim</span><p>{item.text}</p><small>{claimProvenance(item)}</small>
              {:else}{theoryVerdictSentence(item, run)}
              {/if}
            </li>
          {/each}
        </ul>
        {#if authoredItems.some((item) => item.kind === "theory_verdict" && item.verdict === "unknown")}
          <p>{UNKNOWN_THEORY_NOTE}</p>
        {/if}
      </section>
    {/if}

    {#if assignmentOffers.length > 0 && onSubmitAssignment !== undefined}
      <section aria-labelledby="assignment-hand-in-title" class="assignment-hand-in">
        <h3 id="assignment-hand-in-title">Hand in this attempt</h3>
        {#each assignmentOffers as assignment}
          <article>
            <p><strong>{assignment.classroomName}</strong> · assigned by @{assignment.assignedByHandle}</p>
            {#if assignment.note}<p>Teacher note: {assignment.note}</p>{/if}
            {#if selectedAssignmentId !== assignment.id}<button type="button" onclick={() => { selectedAssignmentId = assignment.id; submissionError = undefined; }}>Review sharing</button>{/if}
          </article>
        {/each}
        {#if selectedAssignment}
          <aside class="submission-confirm" aria-labelledby="terminal-submission-confirm-title">
            <h3 id="terminal-submission-confirm-title">Share this completed attempt?</h3>
            <p>{selectedAssignment.teacherHandles.length > 0 ? `${selectedAssignment.teacherHandles.map((handle) => `@${handle}`).join(", ")} will be able to read this run for up to 90 days.` : "No active teacher is available to receive this run."}</p>
            <p>They receive this run only, including its moves and the evidence or reveals you opened during it. They do not gain access to your other runs. You can stop future access after sharing, but that cannot undo what a teacher already saw.</p>
            <div class="actions">
              <button type="button" disabled={submissionBusy || selectedAssignment.teacherHandles.length === 0} aria-describedby={selectedAssignment.teacherHandles.length === 0 ? "terminal-submission-no-teacher" : undefined} onclick={() => void submitAssignment()}>{submissionBusy ? "Sharing…" : "Confirm sharing"}</button>
              <button type="button" disabled={submissionBusy} onclick={() => { selectedAssignmentId = undefined; submissionError = undefined; }}>Cancel</button>
            </div>
            {#if selectedAssignment.teacherHandles.length === 0}<p id="terminal-submission-no-teacher">An active teacher must be present before this run can be shared.</p>{/if}
            {#if submissionError}<p role="alert">{submissionError}</p>{/if}
          </aside>
        {/if}
      </section>
    {/if}

    <div class="actions">
      {#if onStory}<button type="button" onclick={onStory}>Story of this run</button>{/if}
      {#if onFlip}<button type="button" onclick={onFlip}>Replay this as {run.start.side === "white" ? "Black" : "White"}</button>{/if}
      {#if evidence.length > 0 && onInspectEvidence}<button type="button" onclick={onInspectEvidence}>Inspect recorded evidence <span aria-hidden="true">({evidence.length})</span></button>{/if}
      <button type="button" disabled={!canRewind} onclick={onRewind}>Rewind and branch</button>
      <button type="button" onclick={onStop}>Stop session</button>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: grid;
    place-items: end center;
    padding: 1rem;
    background: var(--scrim);
    backdrop-filter: blur(5px);
  }
  .sheet {
    width: min(42rem, 100%);
    max-height: min(80dvh, 44rem);
    overflow: auto;
    padding: 1.4rem;
    border-radius: 1.25rem;
    background: var(--panel);
    box-shadow: var(--shadow);
  }
  .eyebrow {
    margin: 0;
    color: var(--ink);
    font: 700 0.68rem ui-monospace, monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  h2 { margin: 0.35rem 0 1rem; font: 500 2rem/1 var(--display-font); }
  h3 { margin-bottom: 0.35rem; font-size: 0.9rem; }
  ul { margin: 0; padding-left: 1.2rem; }
  li + li { margin-top: 0.35rem; }
  .assignment-hand-in { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--line); }
  .assignment-hand-in article + article { margin-top: 0.75rem; }
  .assignment-hand-in p { margin: 0.35rem 0; }
  .submission-confirm { margin-top: 0.8rem; padding: 0.9rem; border: 2px solid var(--accent); border-radius: 0.8rem; background: var(--panel); }
  .actions { display: flex; gap: 0.5rem; margin-top: 1.3rem; }
  button {
    padding: 0.7rem 0.9rem;
    border: 1px solid var(--line);
    border-radius: 0.65rem;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
