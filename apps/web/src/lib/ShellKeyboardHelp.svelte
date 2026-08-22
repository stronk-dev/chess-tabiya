<script lang="ts">
  import { onMount } from "svelte";

  import { KEYBOARD_OWNERSHIP } from "./keyboard.js";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
  let heading: HTMLHeadingElement;
  onMount(() => heading?.focus());

  const chords = [
    ["G then H", "Home"],
    ["G then P", "Play"],
    ["G then L", "Learn"],
    ["G then R", "Review"],
    ["G then V", "Live"],
    ["G then C", "Create"],
    ["G then B", "Library"],
    ["G then S", "Settings"],
    ["G then M", "Focus primary navigation"],
    ["?", "Open or close this guide"],
    ["Escape", "Close this guide"],
  ] as const;
</script>

<div class="backdrop">
  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="shell-shortcuts-title">
    <header>
      <div>
        <p>Application keyboard map</p>
        <h2 id="shell-shortcuts-title" tabindex="-1" bind:this={heading}>Move through the whole workspace.</h2>
      </div>
      <button type="button" onclick={onClose}>Close</button>
    </header>
    <dl>
      {#each chords as [keys, action]}
        <div><dt><kbd>{keys}</kbd></dt><dd>{action}</dd></div>
      {/each}
    </dl>
    <p class="ownership">Inside the drill, the drill region owns {KEYBOARD_OWNERSHIP.drill.slice(0, 9).join(", ")}. Normal Tab navigation is retained in the top bar.</p>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: var(--scrim);
    backdrop-filter: blur(6px);
  }
  .dialog { width: min(38rem, 100%); max-height: calc(100dvh - 2rem); overflow: auto; padding: 1.25rem; border-radius: 1.2rem; background: var(--panel); }
  header, dl > div { display: flex; justify-content: space-between; gap: 1rem; }
  header p { margin: 0; color: var(--accent); font: 700 0.68rem ui-monospace, monospace; text-transform: uppercase; }
  h2 { margin: 0.3rem 0 0; font: 500 1.8rem/1 var(--display-font); }
  dl { margin: 1.5rem 0 0; }
  dl > div { padding: 0.45rem 0; border-top: 1px solid var(--line); }
  dt, dd { margin: 0; }
  kbd { font: 600 0.75rem ui-monospace, monospace; }
  button { align-self: start; border: 0; background: transparent; color: inherit; cursor: pointer; }
  .ownership { color: var(--muted); font-size: 0.8rem; }
</style>
