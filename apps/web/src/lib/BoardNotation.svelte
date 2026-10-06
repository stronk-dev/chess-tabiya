<script lang="ts">
  import type { BoardInputResult } from "./board-input.js";
  import { modalBoundary } from "./modal-boundary.js";
  import StatusAnnouncement from "./StatusAnnouncement.svelte";

  interface Props {
    disabled: boolean;
    onSubmit: (text: string) => BoardInputResult;
    popup?: boolean;
  }
  let { disabled, onSubmit, popup = false }: Props = $props();
  const id = $props.id();
  let open = $state(false);
  let summary: HTMLElement | undefined = $state();
  let text = $state("");
  let error = $state("");
  function close(): void { open = false; summary?.focus(); }
  function submit(event: SubmitEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const result = onSubmit(text);
    if (result.moveUci === undefined) { error = result.state.lastAnnouncement; return; }
    text = "";
    error = "";
    if (popup) close();
  }
</script>

<details class="text-move" class:popup bind:open
  role={popup && open ? "dialog" : undefined} aria-modal={popup && open ? "true" : undefined}
  aria-label={popup && open ? "Enter a move" : undefined} use:modalBoundary={popup && open}
  onkeydown={(event) => { if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); } }}>
  <summary bind:this={summary} aria-label="Enter a move" aria-haspopup={popup ? "dialog" : undefined} title="Enter a move">
    <span class="entry-icon" aria-hidden="true">⌨</span><span class="entry-label">Enter a move</span>
  </summary>
  <div class="notation-panel">
    <form aria-label="Move entry" onsubmit={submit}>
      <label>Move in chess notation<input bind:value={text} disabled={disabled} aria-describedby={disabled ? `${id}-disabled` : error ? `${id}-error` : undefined} autocomplete="off" /></label>
      <button type="submit" disabled={disabled} aria-describedby={disabled ? `${id}-disabled` : undefined}>Submit move</button>
      {#if disabled}<p id={`${id}-disabled`}>This board is waiting for the other side to move.</p>{/if}
      {#if error}<p id={`${id}-error`}>{error}</p><StatusAnnouncement message={error} />{/if}
    </form>
    <a class="appearance-link" href="/settings#appearance-settings">Appearance</a>
  </div>
</details>

<style>
  .text-move { position:relative; width:min(20rem,100%); max-width:100%; font-size:.75rem; }
  .text-move.popup { width:fit-content; }
  .text-move:not(.popup) summary { width:fit-content; }
  summary { display:flex; align-items:center; gap:.35rem; min-height:2rem; padding:.3rem .5rem; box-sizing:border-box; cursor:pointer; color:var(--ink); background:var(--panel); border:1px solid var(--line); border-radius:.5rem; }
  summary::-webkit-details-marker { display:none; }
  .entry-icon { font-size:1rem; }
  .notation-panel { width:min(20rem,100%); box-sizing:border-box; padding:.65rem; background:var(--panel); border:1px solid var(--line); border-radius:.5rem; }
  .popup .notation-panel { position:fixed; z-index:25; top:4rem; left:50%; transform:translateX(-50%); width:min(24rem,calc(100vw - 2rem)); max-height:calc(100dvh - 5rem); overflow-y:auto; overscroll-behavior:contain; box-shadow:var(--shadow); }
  form { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:end; gap:.35rem; margin:0; }
  label { display:grid; gap:.25rem; min-width:0; }
  input, button { min-width:0; min-height:2rem; box-sizing:border-box; padding:.35rem; color:inherit; background:var(--panel); border:1px solid var(--line); }
  p { grid-column:1 / -1; margin:.2rem 0; }
  .appearance-link { display:inline-flex; align-items:center; min-height:1.5rem; margin-top:.5rem; color:var(--muted); }
  @media(max-width:1023px) { .popup .entry-label { display:none; } .popup summary { width:2rem; justify-content:center; padding:.25rem; } }
</style>
