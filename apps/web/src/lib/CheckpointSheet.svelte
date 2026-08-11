<script lang="ts">
  import { onMount } from "svelte";

  import type { CheckpointNotice } from "./screen-model.js";

  interface Props {
    checkpoint: CheckpointNotice;
    canCompare: boolean;
    onContinue: () => void | Promise<void>;
    onRewind: () => void | Promise<void>;
    onCompare: () => void | Promise<void>;
    onStop: () => void;
  }

  let { checkpoint, canCompare, onContinue, onRewind, onCompare, onStop }: Props =
    $props();
  let heading: HTMLHeadingElement;

  onMount(() => heading?.focus());
</script>

<div class="backdrop">
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="checkpoint-title">
    <p class="eyebrow">Checkpoint</p>
    <h2 id="checkpoint-title" tabindex="-1" bind:this={heading}>{checkpoint.label}</h2>
    <p>You reached a semantic boundary. Continue, replay it, or compare attempts.</p>
    <div class="actions">
      <button class="primary" type="button" onclick={onContinue}>Continue</button>
      <button type="button" onclick={onRewind}>Rewind here</button>
      {#if checkpoint.actions.includes("compare_branches")}
        <button type="button" disabled={!canCompare} onclick={onCompare}>Compare</button>
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
