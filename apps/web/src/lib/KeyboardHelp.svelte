<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
  let heading: HTMLHeadingElement;
  onMount(() => heading?.focus());

  const shortcuts = [
    ["R", "Rewind to last checkpoint"],
    ["Shift + R", "Choose a checkpoint"],
    ["B", "Fork at the current position"],
    ["1…9", "Switch branch"],
    ["Alt + C", "Toggle comparison when the drill region is focused"],
    ["Board arrows / Home / End / Page keys", "Move the active board square"],
    ["Board Enter / Space", "Select a piece or commit its destination"],
    ["Board Escape", "Cancel selection; press again to leave the board"],
    ["← / →", "Step timeline or comparison"],
    ["Space", "Play or pause branch replay"],
    ["E", "Export PGN"],
    ["?", "Open or close this guide"],
  ] as const;
</script>

<div class="backdrop">
  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="shortcut-title">
    <header>
      <div>
        <p>Keyboard map</p>
        <h2 id="shortcut-title" tabindex="-1" bind:this={heading}>Keep your hands on the position.</h2>
      </div>
      <button type="button" onclick={onClose}>Close</button>
    </header>
    <dl>
      {#each shortcuts as shortcut}
        <div><dt><kbd>{shortcut[0]}</kbd></dt><dd>{shortcut[1]}</dd></div>
      {/each}
    </dl>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: var(--scrim);
    backdrop-filter: blur(6px);
  }

  .dialog {
    width: min(36rem, 100%);
    max-height: calc(100dvh - 2rem);
    overflow: auto;
    padding: 1.25rem;
    border-radius: 1.2rem;
    background: var(--panel);
  }

  header,
  dl > div {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  header p {
    margin: 0;
    color: var(--accent);
    font: 700 0.68rem ui-monospace, monospace;
    text-transform: uppercase;
  }

  h2 {
    margin: 0.3rem 0 0;
    font: 500 1.8rem/1 var(--display-font);
  }

  dl {
    margin: 1.5rem 0 0;
  }

  dl > div {
    padding: 0.55rem 0;
    border-top: 1px solid var(--line);
  }

  dt,
  dd {
    margin: 0;
  }

  kbd {
    font: 600 0.75rem ui-monospace, monospace;
  }

  button {
    align-self: start;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
</style>
