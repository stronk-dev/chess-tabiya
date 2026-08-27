<script lang="ts">
  import { HUMAN_MODEL_RUNG_DISCLAIMER } from "./opponent-copy.js";

  interface StartInput {
    readonly fen: string;
    readonly side: "white" | "black";
    readonly mode: "human_common" | "strong_engine";
    readonly targetElo?: 1000 | 1400 | 1800 | 2200;
  }
  interface Props { busy?: boolean; onStart: (input: StartInput) => void | Promise<void>; }
  let { busy = false, onStart }: Props = $props();
  let side: "white" | "black" = $state("white");
  let opponent: "1000" | "1400" | "1800" | "2200" | "engine" = $state("1400");
  let fen = $state("");
  let positionOpen = $state(false);
  const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const bands = Object.freeze([
    { value: "1000", name: "First rung", detail: "More familiar human choices" },
    { value: "1400", name: "Steady", detail: "A balanced rehearsal partner" },
    { value: "1800", name: "Testing", detail: "Stronger practical resistance" },
    { value: "2200", name: "Top measured rung", detail: "The hardest calibrated human-choice band" },
  ] as const);

  function start(): void {
    if (opponent === "engine") {
      void onStart({ fen: fen.trim() || initial, side, mode: "strong_engine" });
      return;
    }
    void onStart({ fen: fen.trim() || initial, side, mode: "human_common", targetElo: Number(opponent) as 1000 | 1400 | 1800 | 2200 });
  }
</script>

<section class="just-play" aria-labelledby="just-play-title">
  <header>
    <p class="eyebrow">Play a full game</p>
    <h2 id="just-play-title">Choose the resistance. Keep every decision.</h2>
    <p>Start from the normal position or bring a FEN. You can rewind and branch without losing the attempt.</p>
  </header>
  <form onsubmit={(event) => { event.preventDefault(); start(); }}>
    <fieldset>
      <legend>Opponent</legend>
      <section class="ladder" aria-labelledby="human-ladder-title">
        <div><strong id="human-ladder-title">Human-like ladder</strong><small>Maia models common human choices at four calibrated rungs.</small></div>
      <div class="opponent-grid">
        {#each bands as band}
          <label class:checked={opponent === band.value}>
            <input type="radio" name="opponent" value={band.value} bind:group={opponent} />
            <span><strong>{band.name}</strong><small>{band.detail}</small></span>
            <b>{band.value}</b>
          </label>
        {/each}
      </div>
      <p class="honest">{HUMAN_MODEL_RUNG_DISCLAIMER}</p>
      </section>
      <section class="engine-choice" aria-labelledby="engine-test-title">
        <label class:checked={opponent === "engine"}>
          <input type="radio" name="opponent" value="engine" bind:group={opponent} />
          <span><strong id="engine-test-title">Engine test</strong><small>Strongest available calculation. This is outside the human-like ladder.</small></span>
          <b>SF</b>
        </label>
      </section>
    </fieldset>
    <div class="start-options">
      <label>Your side
        <select bind:value={side}><option value="white">White</option><option value="black">Black</option></select>
      </label>
      <button class="position-toggle" type="button" aria-expanded={positionOpen} onclick={() => positionOpen = !positionOpen}>{positionOpen ? "Use normal start" : "Start from a FEN"}</button>
      {#if positionOpen}<label class="fen">Position FEN <input bind:value={fen} placeholder="Paste a legal FEN" /></label>{/if}
      <button class="start" type="submit" disabled={busy}>{busy ? "Starting…" : "Start and keep the game"}</button>
    </div>
  </form>
</section>

<style>
  .just-play { width: min(76rem, calc(100% - 2rem)); margin: 1rem auto 1.5rem; padding: clamp(1rem, 3vw, 1.5rem); border: 1px solid var(--line); border-radius: 1.25rem; background: var(--panel); box-shadow: var(--shadow); }
  header { max-width: 48rem; }
  .eyebrow { margin: 0; color: var(--accent); font: 700 .7rem ui-monospace, monospace; text-transform: uppercase; letter-spacing: .08em; }
  h2 { margin: .3rem 0 .5rem; font: 500 clamp(1.5rem, 4vw, 2.3rem) var(--display-font); }
  header > p:last-child { margin-top: 0; color: var(--muted); }
  form { display: grid; gap: 1rem; }
  fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
  legend { margin-bottom: .5rem; font-weight: 700; }
  .ladder,.engine-choice { padding:.8rem;border:1px solid var(--line);border-radius:.9rem;background:color-mix(in srgb,var(--panel) 92%,var(--paper)); }
  .ladder>div:first-child { display:grid;gap:.2rem;margin-bottom:.65rem }.ladder>div:first-child small{color:var(--muted)}
  .engine-choice{margin-top:.65rem}.opponent-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .5rem; }
  .opponent-grid label,.engine-choice label { position: relative; min-height: 7.25rem; display: grid; grid-template-columns: 1fr auto; align-content: space-between; gap: .5rem; padding: .8rem; border: 1px solid var(--line); border-radius: .8rem; background: var(--paper); cursor: pointer; }
  .engine-choice label{min-height:auto}.opponent-grid label.checked,.engine-choice label.checked { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  .opponent-grid input { position: absolute; opacity: 0; }
  .opponent-grid span,.engine-choice span { display: grid; gap: .25rem; }
  .opponent-grid small,.engine-choice small { color: var(--muted); line-height: 1.3; }
  .opponent-grid b,.engine-choice b { align-self: end; color: var(--accent); font: 700 1rem ui-monospace, monospace; }
  .honest { margin: .6rem 0 0; color: var(--muted); font-size: .75rem; }
  .start-options { display: grid; grid-template-columns: minmax(8rem, .35fr) auto minmax(18rem, 1fr) auto; gap: .6rem; align-items: end; }
  .start-options label { display: grid; gap: .3rem; font-size: .78rem; }
  select, input, button { min-height: 2.75rem; padding: .65rem .75rem; border: 1px solid var(--line); border-radius: .6rem; background: var(--paper); color: var(--ink); font: inherit; }
  .position-toggle { align-self: end; }
  .start { border-color: var(--accent); background: var(--accent); color: var(--on-accent); font-weight: 700; }
  button { cursor: pointer; }
  button:disabled { opacity: .5; cursor: wait; }
  @media (max-width: 65rem) { .opponent-grid { grid-template-columns: repeat(2, 1fr); } .start-options { grid-template-columns: 1fr 1fr; } .fen { grid-column: 1 / -1; } }
  @media (max-width: 35rem) { .opponent-grid, .start-options { grid-template-columns: 1fr; } .fen { grid-column: auto; } }
</style>
