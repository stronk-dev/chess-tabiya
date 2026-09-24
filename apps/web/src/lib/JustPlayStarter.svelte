<script lang="ts">
  import { BOT_FAMILY_LABELS, presetDeclaration, type BotProfileReference } from "@chess-tabiya/runtime";
  import type { BotRosterRow } from "./api.js";
  import { botAvailabilityNote, botCardSummary, botIsStartable } from "./bot-picker.js";
  import { HUMAN_MODEL_RUNG_DISCLAIMER } from "./opponent-copy.js";

  interface StartInput {
    readonly fen: string;
    readonly side: "white" | "black";
    readonly mode: "human_common" | "strong_engine";
    readonly targetElo?: 1000 | 1400 | 1800 | 2200;
    readonly profile?: BotProfileReference;
  }
  interface Props { busy?: boolean; roster?: readonly BotRosterRow[]; onStart: (input: StartInput) => void | Promise<void>; }
  let { busy = false, roster = [], onStart }: Props = $props();
  let side: "white" | "black" = $state("white");
  // No opponent is preselected: the first-use default is an owner decision (D1611) that has not
  // been made, so the learner chooses explicitly. Raw rungs stay one disclosure away (Advanced).
  let opponent: string = $state("");
  let advancedOpen = $state(false);
  let fen = $state("");
  let positionOpen = $state(false);
  const startingSupport = presetDeclaration("quiet");
  const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const bands = Object.freeze([
    { value: "1000", name: "First rung", detail: "More familiar human choices" },
    { value: "1400", name: "Steady", detail: "A balanced rehearsal partner" },
    { value: "1800", name: "Testing", detail: "Stronger practical resistance" },
    { value: "2200", name: "Top measured rung", detail: "The hardest calibrated human-choice band" },
  ] as const);
  const families = $derived.by(() => {
    const grouped = new Map<BotRosterRow["reference"]["family"], BotRosterRow[]>();
    for (const row of roster) grouped.set(row.reference.family, [...(grouped.get(row.reference.family) ?? []), row]);
    return [...grouped.entries()].map(([family, rows]) => ({ family, label: BOT_FAMILY_LABELS[family], rows }));
  });
  const selectedBot = $derived(opponent.startsWith("bot:") ? roster.find((row) => `bot:${row.reference.id}` === opponent) : undefined);
  // Why Start is disabled, stated next to it (every disabled control names its reason).
  const startBlocked = $derived(busy ? "Starting the game…" : opponent === "" ? "Choose an opponent to start." : selectedBot !== undefined && !botIsStartable(selectedBot) ? "This bot is unavailable here. Choose another opponent." : undefined);

  function start(): void {
    if (opponent === "") return;
    const position = fen.trim() || initial;
    if (selectedBot !== undefined) {
      if (!botIsStartable(selectedBot)) return;
      void onStart({ fen: position, side, mode: "human_common", profile: selectedBot.reference });
      return;
    }
    if (opponent === "engine") {
      void onStart({ fen: position, side, mode: "strong_engine" });
      return;
    }
    void onStart({ fen: position, side, mode: "human_common", targetElo: Number(opponent) as 1000 | 1400 | 1800 | 2200 });
  }
</script>

<section class="just-play" aria-labelledby="just-play-title">
  <header>
    <p class="eyebrow">Play a full game</p>
    <h2 id="just-play-title">Choose an opponent. Keep every decision.</h2>
    <p>Start from the normal position or bring a FEN. You can rewind and branch without losing the attempt.</p>
  </header>
  <form onsubmit={(event) => { event.preventDefault(); start(); }}>
    <fieldset class="bot-roster" aria-describedby="bot-roster-honesty">
      <legend>Opponent</legend>
      {#if roster.length === 0}
        <p class="honest">The bot roster is not available here. Raw model rungs and the engine test are under Advanced.</p>
      {/if}
      {#each families as family (family.family)}
        <section class="family" aria-label={family.label}>
          <h3>{family.label}</h3>
          <div class="bot-grid">
            {#each family.rows as row (row.reference.id)}
              {@const startable = botIsStartable(row)}
              {@const note = botAvailabilityNote(row)}
              <label class:checked={opponent === `bot:${row.reference.id}`} class:unavailable={!startable} data-bot-profile={row.reference.id}>
                <input type="radio" name="opponent" value={`bot:${row.reference.id}`} bind:group={opponent} disabled={!startable} aria-describedby={note === undefined ? undefined : `bot-note-${row.reference.family}-${row.reference.band}`} />
                <span><strong>{row.card.title}</strong><small>{botCardSummary(row)}</small></span>
                <em>{row.card.strength.kind === "uncalibrated" ? "Uncalibrated" : "Calibrated"}</em>
                {#if note !== undefined}<small class="availability" id={`bot-note-${row.reference.family}-${row.reference.band}`}>{note}</small>{/if}
              </label>
            {/each}
          </div>
        </section>
      {/each}
      <p class="honest" id="bot-roster-honesty">Every bot draws its moves from the Maia human-move model at one model band. Bands are model settings, not FIDE, Lichess or Chess.com ratings, and no bot shows a strength number until games measure that exact bot.</p>
      {#if selectedBot !== undefined}
        <section class="bot-card" aria-labelledby="bot-card-title" aria-live="polite">
          <h3 id="bot-card-title">{selectedBot.card.title}</h3>
          <ul>
            {#each selectedBot.card.statements as statement (statement.id)}
              <li data-card-statement={statement.id}>{statement.text}</li>
            {/each}
          </ul>
        </section>
      {/if}
      <details class="advanced" bind:open={advancedOpen}>
        <summary>Advanced: raw model rungs and the engine test</summary>
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
      </details>
    </fieldset>
    <section class="starting-support" aria-labelledby="starting-support-title">
      <div>
        <p class="eyebrow">Starting support</p>
        <h3 id="starting-support-title">{startingSupport.label}</h3>
        <p>{startingSupport.promise}</p>
      </div>
      <p class="support-next-step">Fine-tune individual help channels from <strong>Advanced support controls</strong> after the board opens.</p>
    </section>
    <div class="start-options">
      <label>Your side
        <select bind:value={side}><option value="white">White</option><option value="black">Black</option></select>
      </label>
      <button class="position-toggle" type="button" aria-expanded={positionOpen} onclick={() => positionOpen = !positionOpen}>{positionOpen ? "Use normal start" : "Start from a FEN"}</button>
      {#if positionOpen}<label class="fen">Position FEN <input bind:value={fen} placeholder="Paste a legal FEN" /></label>{/if}
      <button class="start" type="submit" disabled={startBlocked !== undefined} aria-describedby={startBlocked === undefined ? undefined : "just-play-start-note"}>{busy ? "Starting…" : "Start and keep the game"}</button>
    </div>
    {#if startBlocked !== undefined}<p class="honest choose-first" id="just-play-start-note">{startBlocked}</p>{/if}
  </form>
</section>

<style>
  .just-play { width: min(76rem, calc(100% - 2rem)); margin: 1rem auto 1.5rem; padding: clamp(1rem, 3vw, 1.5rem); border: 1px solid var(--line); border-radius: 1.25rem; background: var(--panel); box-shadow: var(--shadow); }
  header { max-width: 48rem; }
  .eyebrow { margin: 0; color: var(--accent); font: 700 .7rem ui-monospace, monospace; text-transform: uppercase; letter-spacing: .08em; }
  h2 { margin: .3rem 0 .5rem; font: 500 clamp(1.5rem, 4vw, 2.3rem) var(--display-font); }
  header > p:last-child { margin-top: 0; color: var(--muted); }
  form { display: grid; gap: 1rem; }
  fieldset { min-width: 0; margin: 0; padding: 0; border: 0; display: grid; gap: .75rem; }
  legend { margin-bottom: .5rem; font-weight: 700; }
  .family h3 { margin: 0 0 .4rem; font: 600 1rem var(--display-font); }
  .bot-grid, .opponent-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .5rem; }
  .bot-grid label, .opponent-grid label, .engine-choice label { position: relative; min-height: 6.5rem; display: grid; grid-template-columns: 1fr auto; align-content: space-between; gap: .4rem; padding: .75rem; border: 1px solid var(--line); border-radius: .8rem; background: var(--paper); cursor: pointer; }
  .bot-grid label.checked, .opponent-grid label.checked, .engine-choice label.checked { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  .bot-grid label.unavailable { cursor: not-allowed; opacity: .6; }
  .bot-grid input, .opponent-grid input { position: absolute; opacity: 0; }
  .bot-grid input:focus-visible + span, .opponent-grid input:focus-visible + span { outline: 2px solid var(--accent); outline-offset: 2px; }
  .bot-grid span, .opponent-grid span, .engine-choice span { display: grid; gap: .25rem; }
  .bot-grid small, .opponent-grid small, .engine-choice small { color: var(--muted); line-height: 1.3; }
  .bot-grid em { align-self: start; color: var(--muted); font: 600 .65rem ui-monospace, monospace; font-style: normal; text-transform: uppercase; }
  .bot-grid .availability { grid-column: 1 / -1; }
  .opponent-grid b, .engine-choice b { align-self: end; color: var(--accent); font: 700 1rem ui-monospace, monospace; }
  .bot-card { max-height: 16rem; overflow: auto; padding: .75rem 1rem; border: 1px solid var(--line); border-radius: .8rem; background: color-mix(in srgb, var(--panel) 92%, var(--paper)); }
  .bot-card h3 { margin: 0 0 .4rem; font: 600 1rem var(--display-font); }
  .bot-card ul { margin: 0; padding-left: 1.1rem; display: grid; gap: .3rem; color: var(--muted); font-size: .85rem; line-height: 1.4; }
  .advanced { padding: .6rem .8rem; border: 1px solid var(--line); border-radius: .9rem; }
  .advanced summary { cursor: pointer; font-weight: 600; }
  .ladder, .engine-choice { margin-top: .65rem; padding: .8rem; border: 1px solid var(--line); border-radius: .9rem; background: color-mix(in srgb, var(--panel) 92%, var(--paper)); }
  .ladder > div:first-child { display: grid; gap: .2rem; margin-bottom: .65rem; } .ladder > div:first-child small { color: var(--muted); }
  .engine-choice label { min-height: auto; }
  .honest { margin: .2rem 0 0; color: var(--muted); font-size: .75rem; }
  .starting-support { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1rem; align-items: center; padding: .85rem 1rem; border: 1px solid var(--line); border-radius: .9rem; background: color-mix(in srgb, var(--accent) 6%, var(--paper)); }
  .starting-support h3 { margin: .15rem 0 .25rem; font: 600 1.15rem var(--display-font); }
  .starting-support div > p:last-child, .support-next-step { margin: 0; color: var(--ink); line-height: 1.4; }
  .support-next-step { max-width: 21rem; font-size: .78rem; text-align: right; }
  .start-options { display: grid; grid-template-columns: minmax(8rem, .35fr) auto minmax(18rem, 1fr) auto; gap: .6rem; align-items: end; }
  .start-options label { display: grid; gap: .3rem; font-size: .78rem; }
  select, input, button { min-height: 2.75rem; padding: .65rem .75rem; border: 1px solid var(--line); border-radius: .6rem; background: var(--paper); color: var(--ink); font: inherit; }
  .position-toggle { align-self: end; }
  .start { border-color: var(--accent); background: var(--accent); color: var(--on-accent); font-weight: 700; }
  button { cursor: pointer; }
  button:disabled { opacity: .5; cursor: not-allowed; }
  @media (max-width: 65rem) { .bot-grid, .opponent-grid { grid-template-columns: repeat(2, 1fr); } .start-options { grid-template-columns: 1fr 1fr; } .fen { grid-column: 1 / -1; } }
  @media (max-width: 35rem) { .bot-grid, .opponent-grid, .start-options, .starting-support { grid-template-columns: 1fr; } .fen { grid-column: auto; } .support-next-step { max-width: none; text-align: left; } }
</style>
