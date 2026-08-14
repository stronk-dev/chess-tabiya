<script lang="ts">
  import { onMount } from "svelte";

  import type { RunOutcome } from "@chess-tabiya/runtime";
  import type { AuthoredFeedbackItem, ShapeEntryView } from "./api.js";
  import type { EvidenceSentence } from "./evidence-sentences.js";
  import OutcomeContext from "./OutcomeContext.svelte";
  import type { DrillRun } from "@chess-tabiya/runtime";
  import { theoryVerdictSentence, UNKNOWN_THEORY_NOTE } from "./theory-presentation.js";

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
  }

  let { outcome, authoredItems, evidence, canRewind, onRewind, onStop, assessment, resistance = [], grade, run, shapes = [], onStory, onFlip }: Props = $props();
  let heading: HTMLHeadingElement;
  onMount(() => heading?.focus());
</script>

<div class="backdrop">
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="outcome-title">
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
              {:else if item.kind === "plan_class"}<strong>{item.label}</strong>{#if item.shapePlan}{@const plan=shapes.find((entry)=>entry.id===item.shapePlan!.shape)?.plans.find((candidate)=>candidate.id===item.shapePlan!.plan)}{#if plan} — {plan.description}{/if}{/if}{#if item.description} — {item.description}{/if}
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

    {#if evidence.length > 0}
      <section aria-labelledby="terminal-evidence">
        <h3 id="terminal-evidence">Recorded evidence</h3>
        <ul>
          {#each evidence as sentence}
            <li><strong>{sentence.sourceLabel}</strong> · {sentence.text}</li>
          {/each}
        </ul>
      </section>
    {/if}

    <div class="actions">
      {#if onStory}<button type="button" onclick={onStory}>Story of this run</button>{/if}
      {#if onFlip}<button type="button" onclick={onFlip}>Replay this as {run.start.side === "white" ? "Black" : "White"}</button>{/if}
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
    background: rgb(20 18 14 / 52%);
    backdrop-filter: blur(5px);
  }
  .sheet {
    width: min(42rem, 100%);
    max-height: min(80dvh, 44rem);
    overflow: auto;
    padding: 1.4rem;
    border-radius: 1.25rem;
    background: var(--panel);
    box-shadow: 0 1.2rem 4rem rgb(0 0 0 / 35%);
  }
  .eyebrow {
    margin: 0;
    color: var(--warning);
    font: 700 0.68rem ui-monospace, monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  h2 { margin: 0.35rem 0 1rem; font: 500 2rem/1 var(--display-font); }
  h3 { margin-bottom: 0.35rem; font-size: 0.9rem; }
  ul { margin: 0; padding-left: 1.2rem; }
  li + li { margin-top: 0.35rem; }
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
