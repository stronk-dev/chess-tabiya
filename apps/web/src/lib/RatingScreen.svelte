<script lang="ts">
  import { onMount } from "svelte";

  import type { PublishedBandValue, RatingPublication } from "@chess-tabiya/runtime";
  import type {
    DrillClientApi,
    LearnerMark,
    RatedGameHistoryItem,
    RatingHistoryPage,
    RatingView,
  } from "./api.js";

  interface Props {
    api: DrillClientApi;
    onStart?: (band: 1000 | 1400 | 1800 | 2200, side: "white" | "black") => Promise<void>;
  }
  let { api, onStart }: Props = $props();

  let ratingView: RatingView | undefined = $state();
  let history: RatingHistoryPage | undefined = $state();
  let marks: readonly LearnerMark[] = $state([]);
  let loading = $state(true);
  let error: string | undefined = $state();
  let startError: string | undefined = $state();
  let starting = $state(false);
  let selectedBand: "1000" | "1400" | "1800" | "2200" = $state("1400");
  let selectedSide: "white" | "black" = $state("white");

  onMount(() => { void load(); });

  async function load(): Promise<void> {
    loading = true;
    error = undefined;
    try {
      [ratingView, history, marks] = await Promise.all([
        api.rating?.() ?? Promise.resolve({ disclosures: [] }),
        api.ratingHistory?.() ?? Promise.resolve({ periods: [], games: [] }),
        api.learnerMarks?.() ?? Promise.resolve([]),
      ]);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      loading = false;
    }
  }

  function band(value: PublishedBandValue): string {
    if (value.kind === "below") return `below band ${value.band}`;
    if (value.kind === "above") return `above band ${value.band}`;
    return `band ${Math.round(value.value)}`;
  }

  function interval(publication: RatingPublication): string {
    return `${band(publication.interval[0])} to ${band(publication.interval[1])}`;
  }

  function gameResult(game: RatedGameHistoryItem): string {
    if (game.state === "voided") return game.voidReason === null ? "voided" : `voided: ${game.voidReason.replaceAll("_", " ")}`;
    return game.result ?? "sealed";
  }

  function readableDate(value: string | null): string {
    if (value === null) return "open";
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleDateString();
  }


  async function start(): Promise<void> {
    if (onStart === undefined) return;
    starting = true;
    startError = undefined;
    try {
      await onStart(Number(selectedBand) as 1000 | 1400 | 1800 | 2200, selectedSide);
    } catch (cause) {
      startError = cause instanceof Error ? cause.message : String(cause);
      starting = false;
    }
  }
</script>

<main class="rating-view" aria-labelledby="rating-title">
  <header>
    <p class="eyebrow">Rated games</p>
    <h1 id="rating-title">Your measured record</h1>
    <p>Results against the calibrated human-choice opponent ladder. This record never grades a move or changes what a coach says about it.</p>
  </header>

  {#if loading}
    <p role="status">Loading rated games…</p>
  {:else if error}
    <div class="error" role="alert"><p>{error}</p><button type="button" onclick={() => void load()}>Try again</button></div>
  {:else}
    {#if onStart}
      <section class="start-card" aria-labelledby="start-rated-title">
        <div>
          <p class="eyebrow">Play a measured game</p>
          <h2 id="start-rated-title">Choose the opponent; keep the game clean.</h2>
          <p>One full game from the normal starting position. Rewinds and live assistance void the rating result, but never delete the game.</p>
        </div>
        <form onsubmit={(event) => { event.preventDefault(); void start(); }}>
          <label>Opponent
            <select value={selectedBand} disabled={starting} onchange={(event) => selectedBand = event.currentTarget.value as typeof selectedBand}>
              <option value="1000">Band 1000 · first rung</option>
              <option value="1400">Band 1400 · steady</option>
              <option value="1800">Band 1800 · testing</option>
              <option value="2200">Band 2200 · top measured rung</option>
            </select>
          </label>
          <label>Your side
            <select value={selectedSide} disabled={starting} onchange={(event) => selectedSide = event.currentTarget.value as typeof selectedSide}>
              <option value="white">White</option>
              <option value="black">Black</option>
            </select>
          </label>
          <button type="submit" disabled={starting}>{starting ? "Starting…" : "Start rated game"}</button>
        </form>
        <p class="honest">Band labels describe this calibrated Maia ladder. They are not FIDE, Lichess, or Chess.com ratings.</p>
        {#if startError}<p role="alert" class="error">{startError}</p>{/if}
      </section>
    {/if}

    {#if ratingView?.rating}
      {@const publication = ratingView.rating}
      <section class="rating-card" aria-labelledby="current-rating-title">
        <div>
          <p class="eyebrow">Current publication</p>
          <h2 id="current-rating-title">
            {publication.pointEstimate ? band(publication.pointEstimate) : "Interval only"}
          </h2>
          <p class="interval">{interval(publication)}</p>
        </div>
        <dl>
          <div><dt>State</dt><dd>{publication.state}</dd></div>
          <div><dt>Rated games</dt><dd>{publication.ratedGames}</dd></div>
          <div><dt>Abandoned</dt><dd>{publication.abandonedGames}</dd></div>
        </dl>
      </section>
      <section aria-labelledby="rating-disclosures-title">
        <h2 id="rating-disclosures-title">What this number means</h2>
        <ul class="disclosures">{#each ratingView.disclosures as disclosure}<li>{disclosure}</li>{/each}</ul>
      </section>
    {/if}

    {#if marks.length > 0}
      <section aria-labelledby="marks-title">
        <h2 id="marks-title">Recorded wins</h2>
        <ul class="marks">{#each marks as item}<li class={`mark ${item.mark}`}>Beat band {item.mark === "bronze" ? 1400 : item.mark === "silver" ? 1800 : 2200} on {readableDate(item.earnedAt)}</li>{/each}</ul>
      </section>
    {/if}

    <section aria-labelledby="rated-history-title">
      <h2 id="rated-history-title">Game history</h2>
      {#if history?.games.length}
        <div class="table-scroll"><table>
          <thead><tr><th>Date</th><th>Opponent</th><th>Side</th><th>Result</th></tr></thead>
          <tbody>{#each [...history.games].reverse() as game}<tr><td>{readableDate(game.sealedAt ?? game.startedAt)}</td><td>Band {game.opponentBand}</td><td>{game.learnerSide}</td><td>{gameResult(game)}</td></tr>{/each}</tbody>
        </table></div>
      {:else}
        <p>No rated-game result has been recorded. Rated campaign games will appear here after they reach a chess-rules result.</p>
      {/if}
    </section>
  {/if}
</main>

<style>
  .rating-view { height: 100%; overflow: auto; padding: clamp(1rem, 3vw, 2.5rem); max-width: 70rem; margin: 0 auto; }
  header { max-width: 48rem; }
  h1, h2, p { margin-top: 0; }
  section { margin-top: 1.5rem; }
  .eyebrow { color: var(--muted); font: 700 0.72rem/1.2 ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
  .rating-card { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1.5rem; align-items: end; padding: clamp(1rem, 3vw, 1.75rem); border: 1px solid var(--line); border-radius: 1rem; background: var(--panel); }
  .start-card { display: grid; grid-template-columns: minmax(0, 1fr) minmax(18rem, .8fr); gap: 1.5rem; align-items: end; padding: clamp(1rem, 3vw, 1.75rem); border: 1px solid var(--line); border-radius: 1rem; background: var(--panel); }
  .start-card form { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; align-items: end; }
  .start-card label { display: grid; gap: .35rem; color: var(--muted); font-size: .8rem; }
  .start-card select, .start-card button { min-height: 2.75rem; padding: .6rem .7rem; border: 1px solid var(--line); border-radius: .6rem; background: var(--paper); color: var(--ink); }
  .start-card button { grid-column: 1 / -1; background: var(--accent); color: var(--accent-text); font-weight: 700; cursor: pointer; }
  .start-card .honest { grid-column: 1 / -1; margin-bottom: 0; color: var(--muted); }
  .rating-card h2 { font-size: clamp(1.8rem, 5vw, 3.2rem); }
  .interval { color: var(--muted); margin-bottom: 0; }
  dl { display: flex; gap: 1.5rem; margin: 0; }
  dl div { display: grid; gap: .2rem; }
  dt { color: var(--muted); font-size: .72rem; text-transform: uppercase; }
  dd { margin: 0; font-variant-numeric: tabular-nums; }
  .disclosures { max-width: 55rem; color: var(--muted); line-height: 1.5; }
  .marks { display: flex; flex-wrap: wrap; gap: .6rem; padding: 0; list-style: none; }
  .mark { padding: .55rem .75rem; border: 1px solid var(--line); border-radius: 999px; }
  .bronze { background: color-mix(in srgb, var(--danger) 12%, var(--paper)); }
  .silver { background: color-mix(in srgb, var(--muted) 14%, var(--paper)); }
  .gold { background: color-mix(in srgb, var(--warning) 16%, var(--paper)); }
  .table-scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: .7rem; border-bottom: 1px solid var(--line); text-align: left; }
  th { color: var(--muted); font-size: .72rem; text-transform: uppercase; }
  .error { padding: 1rem; border: 1px solid var(--warning); border-radius: .75rem; }
  @media (max-width: 720px) { .start-card, .rating-card { grid-template-columns: 1fr; } .start-card form { grid-template-columns: 1fr; } .start-card button { grid-column: auto; } dl { flex-wrap: wrap; } }
</style>
