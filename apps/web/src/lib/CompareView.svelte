<script lang="ts">
  import type { BranchComparison, DrillRun } from "@chess-tabiya/runtime";
  import { onMount } from "svelte";

  import Chessboard from "./Chessboard.svelte";
  import type { StartSide } from "./board-model.js";
  import { comparisonNode } from "./screen-model.js";

  interface Props {
    run: DrillRun;
    comparison: BranchComparison;
    branchLabels: readonly [string, string];
    startSide: StartSide;
    step: number;
    onStep: (step: number) => void;
    onClose: () => void;
  }

  let { run, comparison, branchLabels, startSide, step, onStep, onClose }: Props =
    $props();
  let nodeA = $derived(comparisonNode(run, comparison, step, "a"));
  let nodeB = $derived(comparisonNode(run, comparison, step, "b"));
  let maxStep = $derived(comparison.pairs.length);
  let heading: HTMLHeadingElement;

  onMount(() => heading?.focus());
</script>

<section class="compare" aria-labelledby="compare-title">
  <header>
    <div>
      <p>Branch comparison</p>
      <h2 id="compare-title" tabindex="-1" bind:this={heading}>Same decision, two consequences.</h2>
    </div>
    <button type="button" onclick={onClose}>Close <kbd>Tab</kbd></button>
  </header>

  <div class="boards" aria-live="polite">
    <article class:absent={!nodeA}>
      <h3>{branchLabels[0]}</h3>
      {#if nodeA}
        <Chessboard
          fen={nodeA.fen}
          {startSide}
          lastMove={nodeA.moveUci}
          disabled
          onMove={() => {}}
        />
      {:else}
        <div class="line-ended">Line ended</div>
      {/if}
    </article>
    <article class:absent={!nodeB}>
      <h3>{branchLabels[1]}</h3>
      {#if nodeB}
        <Chessboard
          fen={nodeB.fen}
          {startSide}
          lastMove={nodeB.moveUci}
          disabled
          onMove={() => {}}
        />
      {:else}
        <div class="line-ended">Line ended</div>
      {/if}
    </article>
  </div>

  <div class="stepper">
    <button type="button" disabled={step === 0} onclick={() => onStep(step - 1)}>
      ← Previous
    </button>
    <span>Aligned ply {step} / {maxStep}</span>
    <button
      type="button"
      disabled={step === maxStep}
      onclick={() => onStep(step + 1)}
    >
      Next →
    </button>
  </div>

  <div class="strips">
    <section aria-label={`${branchLabels[0]} objective and checkpoints`}>
      <h3>{branchLabels[0]}</h3>
      <div class="strip objective-strip">
        {#each comparison.objectiveTimelines.a as entry}
          <span title={`Ply ${entry.plyOffset}: ${entry.from} to ${entry.to}`}>
            {entry.to}
          </span>
        {:else}<small>No objective change</small>{/each}
      </div>
      <div class="strip checkpoint-strip">
        {#each comparison.checkpointHits.a as hit}
          <span title={`Ply ${hit.plyOffset}`}>{hit.checkpointId}</span>
        {:else}<small>No checkpoint</small>{/each}
      </div>
    </section>
    <section aria-label={`${branchLabels[1]} objective and checkpoints`}>
      <h3>{branchLabels[1]}</h3>
      <div class="strip objective-strip">
        {#each comparison.objectiveTimelines.b as entry}
          <span title={`Ply ${entry.plyOffset}: ${entry.from} to ${entry.to}`}>
            {entry.to}
          </span>
        {:else}<small>No objective change</small>{/each}
      </div>
      <div class="strip checkpoint-strip">
        {#each comparison.checkpointHits.b as hit}
          <span title={`Ply ${hit.plyOffset}`}>{hit.checkpointId}</span>
        {:else}<small>No checkpoint</small>{/each}
      </div>
    </section>
  </div>
</section>

<style>
  .compare {
    width: min(82rem, calc(100% - 2rem));
    margin: 0 auto;
    padding: 1.5rem 0 3rem;
  }

  header,
  .stepper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  header p {
    margin: 0;
    color: var(--accent);
    font: 700 0.68rem ui-monospace, monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0.2rem 0 0;
    font: 500 clamp(1.8rem, 4vw, 3.2rem) / 1 var(--display-font);
  }

  button {
    padding: 0.65rem 0.8rem;
    border: 1px solid var(--line);
    border-radius: 0.65rem;
    background: var(--panel);
    color: inherit;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.4;
  }

  .boards,
  .strips {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 1.25rem;
  }

  .boards article,
  .strips > section {
    min-width: 0;
    padding: 0.8rem;
    border: 1px solid var(--line);
    border-radius: 1rem;
    background: var(--panel);
  }

  .boards article.absent {
    opacity: 0.45;
  }

  h3 {
    margin: 0 0 0.65rem;
    font: 600 0.9rem var(--display-font);
  }

  .line-ended {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    border: 1px dashed var(--line);
    color: var(--muted);
  }

  .stepper {
    margin-top: 1rem;
  }

  .strip {
    min-height: 2rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
    margin-top: 0.4rem;
  }

  .strip span,
  .strip small {
    padding: 0.3rem 0.45rem;
    border-radius: 999px;
    background: var(--paper-soft);
    font: 0.66rem ui-monospace, monospace;
  }

  .checkpoint-strip span {
    background: color-mix(in srgb, var(--warning) 18%, var(--paper-soft));
  }

  @media (max-width: 48rem) {
    .boards,
    .strips {
      grid-template-columns: 1fr;
    }
  }
</style>
