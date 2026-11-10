<script lang="ts">
  // §3.6b: inspect the source's OWN position sequence, never the active saved-run cursor.
  import { assertPresentedEvidenceItem, movePathFrames, presentedSentence, type ComponentValue, type PresentedEvidenceItem } from "@chess-tabiya/runtime/client";
  import { onDestroy, tick } from "svelte";
  import Chessboard from "../../Chessboard.svelte";
  import { modalBoundary } from "../../modal-boundary.js";
  import { attribution } from "../presented-view.js";

  interface Props { owner: PresentedEvidenceItem; component: Extract<ComponentValue, { id: "move_path" }>; sentence: string }
  let { owner, component, sentence }: Props = $props();
  const id = $props.id();
  const frames = $derived.by(() => {
    assertPresentedEvidenceItem(owner);
    if (owner.component !== component || presentedSentence(owner) !== sentence) throw new TypeError("Line preview crosses its original presented owner");
    return movePathFrames(component.operand);
  });
  interface Preview { readonly owner: PresentedEvidenceItem; readonly component: Props["component"]; readonly frames: readonly string[]; readonly index: number; readonly opener: HTMLButtonElement }
  let preview: Preview | undefined = $state.raw();
  let dialog: HTMLElement | undefined = $state();
  let alive = true;
  let previewEpoch = 0;
  onDestroy(() => { alive = false; previewEpoch += 1; });
  const current = (expected: Preview) => alive && preview === expected && expected.owner === owner && expected.component === component;
  $effect(() => { if (preview !== undefined && (preview.owner !== owner || preview.component !== component)) { previewEpoch += 1; preview = undefined; } });
  async function open(renderedOwner: PresentedEvidenceItem, index: number, event: MouseEvent): Promise<void> {
    const opener = event.currentTarget;
    if (!alive || owner !== renderedOwner || component !== renderedOwner.component || !(opener instanceof HTMLButtonElement) || !opener.isConnected || index < 1 || index >= frames.length) return;
    const expected = { owner, component, frames, index, opener };
    previewEpoch += 1;
    preview = expected;
    await tick();
    if (current(expected) && dialog?.isConnected) dialog.focus();
  }
  function select(expected: Preview, index: number, event: MouseEvent): void {
    if (!current(expected) || !(event.currentTarget instanceof HTMLElement) || !event.currentTarget.isConnected
      || !Number.isSafeInteger(index) || index < 0 || index >= expected.frames.length) return;
    preview = { ...expected, index };
  }
  async function close(expected: Preview): Promise<void> {
    if (!current(expected)) return;
    const closingEpoch = ++previewEpoch;
    preview = undefined;
    await tick();
    if (alive && preview === undefined && previewEpoch === closingEpoch && owner === expected.owner && component === expected.component && expected.opener.isConnected) expected.opener.focus();
  }
</script>

<div class="move-path" data-component="move_path" data-origin={component.operand.origin}>
  {#each [owner] as renderedOwner (renderedOwner)}
  <ol class="plies" aria-label={sentence}>
    {#each component.operand.plies as ply, index (`${ply.ply}${ply.uci}`)}<li><button type="button" class="san" aria-label={`Preview after ${ply.san}, step ${index + 1}`} onclick={event => void open(renderedOwner, index + 1, event)}>{ply.san}</button></li>{/each}
  </ol>
  {/each}
  {#if component.operand.convention}<p class="convention">{attribution(component.operand.convention)}</p>{/if}
</div>

{#if preview}
  {@const selected = preview}
  <div class="line-backdrop">
    <div class="line-preview" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-note`}
      tabindex="-1" bind:this={dialog} use:modalBoundary onkeydowncapture={event => { if (event.key === "Escape") { event.stopPropagation(); event.preventDefault(); void close(selected); } }}>
      <header><h2 id={`${id}-title`}>Read-only line preview</h2><button type="button" onclick={() => void close(selected)} aria-label="Close line preview">Close</button></header>
      <p id={`${id}-note`}>Inspecting this line does not change your game.</p>
      <div class="preview-board" data-line-preview-position={selected.index}>
        <Chessboard fen={selected.frames[selected.index]!} startSide={selected.frames[0]!.split(" ")[1] === "b" ? "black" : "white"}
          disabled showDests={false} highlightMoves={false} showControls={false} drawingEnabled={false} onMove={() => false} onExitGrid={() => void close(selected)} />
      </div>
      <p class="step-status" role="status">{selected.index === 0 ? "Starting position" : `After ${component.operand.plies[selected.index - 1]!.san}`} · {selected.index} of {component.operand.plies.length}</p>
      <nav aria-label="Line positions" class="positions">
        <button type="button" disabled={selected.index === 0} onclick={event => select(selected, 0, event)}>Start</button>
        <button type="button" disabled={selected.index === 0} onclick={event => select(selected, selected.index - 1, event)}>Previous</button>
        <button type="button" disabled={selected.index === component.operand.plies.length} onclick={event => select(selected, selected.index + 1, event)}>Next</button>
      </nav>
      <div class="ply-choices" aria-label="Choose a line position">
        {#each component.operand.plies as ply, index (`${ply.ply}${ply.uci}`)}<button type="button" aria-pressed={selected.index === index + 1} aria-label={`Position after ${ply.san}, step ${index + 1}`} onclick={event => select(selected, index + 1, event)}>{ply.san}</button>{/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .move-path{display:grid;gap:.2rem}
  .plies{margin:0;padding-left:1.2rem;display:flex;flex-wrap:wrap;gap:.1rem .9rem;font-size:.78rem;color:var(--ink)}
  .convention{margin:0;font-size:.7rem;color:var(--muted)}
  .san{border:0;padding:0;background:none;color:var(--accent);font:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:.15em}
  .line-backdrop{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:.5rem;background:var(--scrim)}
  .line-preview{width:min(36rem,100%);min-width:0;max-height:calc(100dvh - 1rem);overflow:auto;display:grid;gap:.65rem;padding:1rem;border:1px solid var(--line);border-radius:.8rem;background:var(--panel);color:var(--ink)}
  header{display:flex;align-items:center;justify-content:space-between;gap:.5rem}h2{margin:0;font-size:1.1rem}p{margin:0}
  .preview-board{width:min(100%,24rem,54dvh);aspect-ratio:1;justify-self:center}
  .positions,.ply-choices{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center}.step-status{text-align:center}
  .line-preview button{min-height:2.75rem;padding:.4rem .65rem;border:1px solid var(--line);border-radius:.35rem;background:var(--paper);color:var(--ink);font:inherit;cursor:pointer}
  .line-preview button[aria-pressed="true"]{border-color:var(--accent);background:var(--accent-soft)}
  .line-preview button:disabled{opacity:.5;cursor:default}button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
</style>
