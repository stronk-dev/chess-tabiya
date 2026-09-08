<script lang="ts">
  import type { SimulationResult } from "./api.js";
  import type { StartSide } from "./board-model.js";
  import Chessboard from "./Chessboard.svelte";
  import { rehearsalTurnCount } from "./chronology-copy.js";
  import { modalBoundary } from "./modal-boundary.js";

  interface Props {
    simulation: SimulationResult;
    startSide: StartSide;
    busy?: boolean;
    onEnter: (branchIndex: number) => void | Promise<void>;
    onClose: () => void;
  }

  let { simulation, startSide, busy = false, onEnter, onClose }: Props = $props();

  function keydown(event: KeyboardEvent): void {
    if (event.key === "Escape") onClose();
  }
</script>

<div class="backdrop">
  <div
    class="preview"
    role="dialog"
    aria-modal="true"
    aria-labelledby="simulation-title"
    aria-describedby="simulation-note"
    tabindex="-1"
    use:modalBoundary
    onkeydown={keydown}
  >
    <header>
      <div>
        <p>Authored consequences</p>
        <h2 id="simulation-title">Where these lines lead</h2>
      </div>
      <button type="button" aria-label="Close authored line preview" onclick={onClose}>Close</button>
    </header>
    <p id="simulation-note" class="note">These are demonstrations from the drill, not moves added to your attempt. Choose one only when you want to step into that line.</p>
    <div class="line-grid">
      {#each simulation.branches as branch, index}
        <article>
          <div class="line-heading">
            <span>{index + 1}</span>
            <div><h3>{branch.label}</h3><p>{rehearsalTurnCount(branch.plies)} shown</p></div>
          </div>
          <div class="board" aria-label={`Final position after ${branch.label}`}>
            <Chessboard fen={branch.leafFen} {startSide} disabled showDests={false} highlightMoves={false} onMove={() => false} />
          </div>
          {#if branch.truncatedAt !== undefined}<p class="honest">This preview stops before the drill node {branch.truncatedAt}.</p>{/if}
          {#if branch.subvariationsSkipped !== undefined}<p class="honest">{branch.subvariationsSkipped} nested {branch.subvariationsSkipped === 1 ? "alternative is" : "alternatives are"} available deeper in the line.</p>{/if}
          <button class="enter" type="button" disabled={busy} onclick={() => void onEnter(branch.index)}>Enter this line</button>
        </article>
      {/each}
    </div>
  </div>
</div>

<style>
  .backdrop{position:fixed;inset:0;z-index:45;display:grid;place-items:center;padding:clamp(.5rem,2vw,1.5rem);background:var(--scrim);backdrop-filter:blur(7px)}
  .preview{width:min(76rem,100%);max-height:calc(100dvh - 1rem);overflow:auto;display:grid;gap:1rem;padding:clamp(1rem,2vw,1.5rem);border:1px solid var(--line);border-radius:1.2rem;background:var(--panel);box-shadow:0 1.5rem 5rem color-mix(in srgb,var(--ink) 24%,transparent)}
  header,.line-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}header p,h2,h3,.line-heading p,.note,.honest{margin:0}header>div>p{color:var(--accent);font:700 .68rem ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em}h2{margin-top:.25rem;font:500 clamp(1.5rem,3vw,2.25rem)/1 var(--display-font)}header button{min-width:2.75rem;min-height:2.75rem}.note{max-width:62ch;color:var(--muted)}
  .line-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(15rem,100%),1fr));gap:1rem;align-items:start}article{min-width:0;display:grid;gap:.75rem;padding:.8rem;border:1px solid var(--line);border-radius:.9rem;background:var(--paper)}.line-heading{justify-content:flex-start}.line-heading>span{display:grid;place-items:center;width:1.8rem;aspect-ratio:1;border-radius:50%;background:var(--accent);color:var(--on-accent);font-weight:700}.line-heading h3{font:600 1rem/1.2 var(--display-font)}.line-heading p,.honest{margin-top:.15rem;color:var(--muted);font-size:.78rem}.board{width:100%;max-width:22rem;aspect-ratio:1;justify-self:center;overflow:hidden;border-radius:.35rem}.enter{width:100%;min-height:2.75rem;border-color:var(--accent);background:var(--accent);color:var(--on-accent);font-weight:700}
  @media(max-width:40rem){.backdrop{padding:0}.preview{max-height:100dvh;height:100dvh;border:0;border-radius:0}.line-grid{grid-template-columns:1fr}.board{max-width:min(22rem,72vw)}}
</style>
