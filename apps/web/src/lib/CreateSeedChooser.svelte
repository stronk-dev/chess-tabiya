<script lang="ts">
  import Chessboard from "./Chessboard.svelte";
  import type { PackSummary, RunSummary } from "./api.js";
  import { INITIAL_POSITION_FEN, playAuthoringMove, positionTurn } from "./pack-authoring-seeds.js";

  type Door = "position" | "game" | "run" | "pack";
  interface Props {
    packs: readonly PackSummary[];
    runs: readonly RunSummary[];
    busy?: boolean;
    error?: string | undefined;
    onPosition: (input: { readonly title: string; readonly fen: string; readonly side: "white" | "black" }) => void | Promise<void>;
    onGame: (input: { readonly title: string; readonly side: "white" | "black"; readonly pgn: string; readonly url: string }) => void | Promise<void>;
    onRun: (input: { readonly runId: string; readonly title: string }) => void | Promise<void>;
    onPack: (packId: string) => void | Promise<void>;
    onClearError: () => void;
  }

  let { packs, runs, busy = false, error, onPosition, onGame, onRun, onPack, onClearError }: Props = $props();
  let door: Door | undefined = $state();
  let title = $state("");
  let fen = $state(INITIAL_POSITION_FEN);
  let side: "white" | "black" = $state("white");
  let pgn = $state("");
  let url = $state("");
  let selectedRunId = $state("");
  let runTitle = $state("");
  let selectedPackId = $state("");
  let turn = $derived(positionTurn(fen));

  function choose(value: Door): void {
    door = value;
    onClearError();
  }

  function returnToChoices(): void { door = undefined; onClearError(); }

  function moveOnSeedBoard(uci: string): boolean {
    const next = playAuthoringMove(fen, uci);
    if (next === undefined) return false;
    fen = next;
    return true;
  }
</script>

<section class="seed-chooser" aria-labelledby="seed-chooser-title">
  <div class="seed-heading">
    <div><p class="eyebrow">Start with real chess</p><h2 id="seed-chooser-title">What are you starting from?</h2></div>
    {#if door}<button type="button" disabled={busy} onclick={returnToChoices}>Back to four choices</button>{/if}
  </div>

  {#if door === undefined}
    <div class="seed-doors">
      <button type="button" onclick={() => choose("position")}><strong>Position</strong><span>Paste a FEN or play legal moves on a board.</span></button>
      <button type="button" onclick={() => choose("game")}><strong>Finished game</strong><span>Import PGN or a Lichess game, then distill its recorded line.</span></button>
      <button type="button" onclick={() => choose("run")}><strong>Run you played</strong><span>Turn one preserved attempt into an editable draft.</span></button>
      <button type="button" onclick={() => choose("pack")}><strong>Existing pack</strong><span>Copy a served pack with fresh review debt and a new identity.</span></button>
    </div>
  {:else if door === "position"}
    <form onsubmit={(event) => { event.preventDefault(); void onPosition({ title: title.trim(), fen: fen.trim(), side }); }}>
      <div class="seed-fields">
        <label>Draft title<input required maxlength="120" bind:value={title} placeholder="What consequence will this rehearse?" /></label>
        <label>Learner side<select bind:value={side}><option value="white">White</option><option value="black">Black</option></select></label>
        <label class="fen-field">Starting FEN<input required bind:value={fen} aria-invalid={turn === undefined} /></label>
      </div>
      {#if turn}
        <div class="seed-board"><Chessboard {fen} startSide={turn} showDests highlightMoves onMove={moveOnSeedBoard} /></div>
        <p class="honest">Move pieces legally to advance the seed position. The learner side is separate from whose turn it is on this setup board.</p>
      {:else}<p role="alert">Enter a legal FEN before using the board.</p>{/if}
      <button class="primary" type="submit" disabled={busy || title.trim() === "" || turn === undefined}>{busy ? "Creating…" : "Create ten-field draft"}</button>
    </form>
  {:else if door === "game"}
    <form onsubmit={(event) => { event.preventDefault(); void onGame({ title: title.trim(), side, pgn, url: url.trim() }); }}>
      <label>Draft title<input required maxlength="120" bind:value={title} placeholder="What should this game's rehearsal teach?" /></label>
      <label>Lichess game URL<input type="url" bind:value={url} placeholder="https://lichess.org/abcdefgh" /></label>
      <span>or paste one completed game</span>
      <label>PGN<textarea rows="7" bind:value={pgn} placeholder="[Event …]"></textarea></label>
      <label>Your side<select bind:value={side}><option value="white">White</option><option value="black">Black</option></select></label>
      <p class="honest">The imported game stays private. Distillation copies recorded moves only and leaves grading, claims, and theory as explicit author work.</p>
      <button class="primary" type="submit" disabled={busy || title.trim() === "" || (url === "" && pgn.trim() === "")}>{busy ? "Importing and distilling…" : "Import game to draft"}</button>
    </form>
  {:else if door === "run"}
    <form onsubmit={(event) => { event.preventDefault(); void onRun({ runId: selectedRunId, title: runTitle.trim() }); }}>
      <label>Played run<select required value={selectedRunId} onchange={(event) => selectedRunId = event.currentTarget.value}><option value="">Choose a run</option>{#each runs as run}<option value={run.id}>{run.title} · {run.recordedMoveCount} moves</option>{/each}</select></label>
      <label>Draft title<input required maxlength="120" bind:value={runTitle} placeholder="What does this rehearsal teach?" /></label>
      <p class="honest">The source run stays unchanged. The draft preserves its recorded branch and declares the human judgments still owed.</p>
      <button class="primary" type="submit" disabled={busy || selectedRunId === "" || runTitle.trim() === ""}>{busy ? "Distilling…" : "Distill selected run"}</button>
      {#if runs.length === 0}<p>No saved runs are available yet. Play or import a game first.</p>{/if}
    </form>
  {:else}
    <form onsubmit={(event) => { event.preventDefault(); void onPack(selectedPackId); }}>
      <label>Served pack<select required value={selectedPackId} onchange={(event) => selectedPackId = event.currentTarget.value}><option value="">Choose a pack</option>{#each packs as pack}<option value={pack.id}>{pack.title} · {pack.channel}</option>{/each}</select></label>
      <p class="honest">Copying preserves the source bytes for inspection, assigns a new draft id and version, and adds a blocker requiring review of every inherited move and claim.</p>
      <button class="primary" type="submit" disabled={busy || selectedPackId === ""}>{busy ? "Copying…" : "Copy into a new draft"}</button>
      {#if packs.length === 0}<p>No served packs are available in this deployment.</p>{/if}
    </form>
  {/if}
  {#if error}<p role="alert">{error}</p>{/if}
</section>

<style>
  .seed-chooser { display: grid; gap: 1rem; margin: 1.5rem 0; padding: clamp(1rem, 3vw, 1.4rem); border: 1px solid var(--line); border-radius: 1rem; background: var(--panel); }
  .seed-heading { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
  h2, p { margin: 0; }
  .seed-doors { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .7rem; }
  .seed-doors button { display: grid; gap: .45rem; min-height: 9rem; text-align: left; align-content: start; }
  .seed-doors strong { font: 600 1.05rem var(--display-font); }
  .seed-doors span { color: var(--muted); line-height: 1.45; }
  form, label { display: grid; gap: .45rem; }
  form { max-width: 48rem; }
  input, select, textarea { width: 100%; min-width: 0; padding: .65rem; border: 1px solid var(--line); border-radius: .5rem; background: var(--paper); color: var(--ink); }
  .seed-fields { display: grid; grid-template-columns: minmax(12rem, 1fr) minmax(8rem, .35fr); gap: .7rem; }
  .fen-field { grid-column: 1 / -1; }
  .seed-board { width: min(100%, 30rem); aspect-ratio: 1; margin-block: .5rem; }
  @media (max-width: 56rem) { .seed-doors { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 35rem) { .seed-heading { display: grid; } .seed-doors, .seed-fields { grid-template-columns: 1fr; } .fen-field { grid-column: 1; } }
</style>
