<script lang="ts">
  interface Props {
    busy?: boolean;
    onStart: (input: { readonly fen: string; readonly side: "white" | "black"; readonly mode: "human_common" | "strong_engine" }) => void | Promise<void>;
  }
  let { busy = false, onStart }: Props = $props();
  let side: "white" | "black" = $state("white");
  let mode: "human_common" | "strong_engine" = $state("human_common");
  let fen = $state("");
  const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
</script>

<section class="just-play" aria-labelledby="just-play-title">
  <p>Just Play</p><h2 id="just-play-title">Start with a board, then branch and learn as you go.</h2>
  <form onsubmit={(event) => { event.preventDefault(); void onStart({ fen: fen.trim() || initial, side, mode }); }}>
    <label>Your side <select bind:value={side}><option value="white">White</option><option value="black">Black</option></select></label>
    <label>Opponent <select bind:value={mode}><option value="human_common">Human-common</option><option value="strong_engine">Strong engine</option></select></label>
    <label class="fen">Optional FEN <input bind:value={fen} placeholder="Initial position" /></label>
    <button type="submit" disabled={busy}>Start game</button>
  </form>
</section>

<style>
  .just-play{width:min(70rem,calc(100% - 2rem));margin:0 auto 1rem;padding:1rem;border:1px solid var(--line);border-radius:1rem;background:var(--panel)}p{margin:0;color:var(--accent);font:700 .7rem ui-monospace,monospace;text-transform:uppercase}h2{margin:.25rem 0 1rem;font:500 1.5rem var(--display-font)}form{display:grid;grid-template-columns:auto auto minmax(15rem,1fr) auto;gap:.7rem;align-items:end}label{display:grid;gap:.25rem;font-size:.78rem}.fen input,select{padding:.65rem;border:1px solid var(--line);border-radius:.55rem;background:var(--paper)}button{padding:.7rem}.just-play :global(button:disabled){opacity:.5}@media(max-width:50rem){form{grid-template-columns:1fr}.just-play{max-height:45%;overflow:auto}}
</style>
