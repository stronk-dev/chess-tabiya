<script lang="ts">
  import { onMount } from "svelte";
  import { DRILL_SHORTCUTS, WORKSPACE_SHORTCUTS } from "./keyboard.js";
  import { modalBoundary } from "./modal-boundary.js";

  interface Props { headingId: string; eyebrow: string; title: string; onClose: () => void }
  let { headingId, eyebrow, title, onClose }: Props = $props();
  let heading: HTMLHeadingElement;
  onMount(() => heading.focus());
</script>

<div class="backdrop">
  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby={headingId} use:modalBoundary>
    <header><div><p>{eyebrow}</p><h2 id={headingId} tabindex="-1" bind:this={heading}>{title}</h2></div><button type="button" onclick={onClose}>Close</button></header>
    <section aria-labelledby={`${headingId}-workspace`}><h3 id={`${headingId}-workspace`}>Workspace</h3><dl>{#each WORKSPACE_SHORTCUTS as [keys, action]}<div><dt><kbd>{keys}</kbd></dt><dd>{action}</dd></div>{/each}</dl></section>
    <section aria-labelledby={`${headingId}-rehearsal`}><h3 id={`${headingId}-rehearsal`}>Rehearsal</h3><dl>{#each DRILL_SHORTCUTS as [keys, action]}<div><dt><kbd>{keys}</kbd></dt><dd>{action}</dd></div>{/each}</dl></section>
    <p class="ownership">Text fields and the chessboard keep their native keys. Press Escape from another drill control to return to the drill shortcut region.</p>
  </div>
</div>

<style>
  .backdrop{position:fixed;inset:0;z-index:40;display:grid;place-items:center;padding:1rem;background:var(--scrim);backdrop-filter:blur(6px)}.dialog{width:min(40rem,100%);max-height:calc(100dvh - 2rem);overflow:auto;padding:1.25rem;border-radius:1.2rem;background:var(--panel)}header,dl>div{display:flex;justify-content:space-between;gap:1rem}header p{margin:0;color:var(--accent);font:700 .68rem ui-monospace,monospace;text-transform:uppercase}h2{margin:.3rem 0 0;font:500 1.8rem/1 var(--display-font)}h3{margin:1.25rem 0 .25rem;font:600 .85rem/1.2 ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em}dl{margin:0}dl>div{padding:.45rem 0;border-top:1px solid var(--line)}dt,dd{margin:0}kbd{font:600 .75rem ui-monospace,monospace}button{align-self:start;border:0;background:transparent;color:inherit;cursor:pointer}.ownership{color:var(--muted);font-size:.8rem}
</style>
