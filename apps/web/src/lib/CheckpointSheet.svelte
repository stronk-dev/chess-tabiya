<script lang="ts">
  import { onMount } from "svelte";

  import HonestControl from "./HonestControl.svelte";
  import { recognizedCheckpointActions, type CheckpointNotice } from "./screen-model.js";
  import type { AuthoredFeedbackItem } from "./api.js";
  import OutcomeContext from "./OutcomeContext.svelte";
  import type { DrillRun } from "@chess-tabiya/runtime";
  import { theoryVerdictSentence, UNKNOWN_THEORY_NOTE } from "./theory-presentation.js";

  interface Props {
    checkpoint: CheckpointNotice;
    canCompare: boolean;
    onContinue: () => void | Promise<void>;
    onRewind: () => void | Promise<void>;
    onCompare: () => void | Promise<void>;
    onStop: () => void;
    authoredItems?: readonly AuthoredFeedbackItem[];
    assessment?: string | undefined;
    resistance?: readonly string[];
    resolution?: string | undefined;
    run: DrillRun;
  }

  let {
    checkpoint,
    canCompare,
    onContinue,
    onRewind,
    onCompare,
    onStop,
    authoredItems = [],
    assessment,
    resistance = [],
    resolution,
    run,
  }: Props = $props();
  let heading: HTMLHeadingElement;
  let recognizedActions = $derived(recognizedCheckpointActions(checkpoint.actions));

  onMount(() => heading?.focus());
</script>

<div class="backdrop">
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="checkpoint-title">
    <p class="eyebrow">Checkpoint</p>
    <h2 id="checkpoint-title" tabindex="-1" bind:this={heading}>{checkpoint.label}</h2>
    <p>You reached a semantic boundary. Continue, replay it, or compare attempts.</p>
    {#if assessment !== undefined || resistance.length > 0}
      <OutcomeContext {assessment} {resistance} {resolution} />
    {/if}
    {#if authoredItems.length > 0}
      <section class="authored-feedback" aria-labelledby="authored-feedback-title">
        <h3 id="authored-feedback-title">Authored commentary</h3>
        <ul>
          {#each authoredItems as item}
            <li>
              {#if item.kind === "annotation"}
                <span class="kind">Line note</span><p>{item.text}</p>
              {:else if item.kind === "deviation"}
                <span class="kind">Alternative {item.anchor.moveUci}</span><p>{item.note}</p>
              {:else if item.kind === "plan_class"}
                <span class="kind">Plan option</span><strong>{item.label}</strong>
                {#if item.description}<p>{item.description}</p>{/if}
              {:else}
                <span class="kind">Theory</span><p>{theoryVerdictSentence(item, run)}</p>
              {/if}
            </li>
          {/each}
        </ul>
        {#if authoredItems.some((item) => item.kind === "theory_verdict" && item.verdict === "unknown")}
          <p>{UNKNOWN_THEORY_NOTE}</p>
        {/if}
      </section>
    {/if}
    <div class="actions">
      <button class="primary" type="button" onclick={onContinue}>Continue</button>
      <button type="button" onclick={onRewind}>Rewind here</button>
      {#if recognizedActions.compare_branches}
        <HonestControl
          disabled={!canCompare}
          reasonId="checkpoint-compare-unavailable"
          reason="Reach this checkpoint on at least two branches before comparing."
        >
          {#snippet children(describedBy)}
            <button
              type="button"
              disabled={!canCompare}
              aria-describedby={describedBy}
              onclick={onCompare}
            >Compare</button>
          {/snippet}
        </HonestControl>
      {/if}
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
    width: min(38rem, 100%);
    max-height: min(88dvh, 48rem);
    overflow: auto;
    padding: 1.4rem;
    border-radius: 1.25rem;
    background: var(--panel);
    box-shadow: 0 1.2rem 4rem rgb(0 0 0 / 35%);
  }

  .eyebrow {
    color: var(--warning);
    font: 700 0.68rem ui-monospace, monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0.35rem 0;
    font: 500 2rem/1 var(--display-font);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1.3rem;
  }

  .authored-feedback {
    margin-top: 1rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--line);
  }

  .authored-feedback h3,
  .authored-feedback p {
    margin: 0;
  }

  .authored-feedback ul {
    display: grid;
    gap: 0.75rem;
    margin: 0.65rem 0 0;
    padding: 0;
    list-style: none;
  }

  .kind {
    display: block;
    color: var(--muted);
    font: 700 0.62rem ui-monospace, monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  button {
    padding: 0.7rem 0.9rem;
    border: 1px solid var(--line);
    border-radius: 0.65rem;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  button.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: white;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
