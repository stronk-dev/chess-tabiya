<script lang="ts">
  // rfc/player-style.md + rfc/skills.md — the private learner profile. Every number arrives with its
  // denominator and opens the runs and moves behind it; a card below its own floor shows only the
  // reason and the distance. This surface never names a type of player, compares you with anyone,
  // ranks what you do, or tells you what to play.
  import { onMount } from "svelte";

  import type { DrillClientApi } from "./api.js";
  import type {
    HabitCard,
    LearnerProfileView,
    ObservationDetail,
    OpeningDetail,
    ProfileHistoryRow,
    SharedHabitCard,
    StyleContributorRef,
    StyleContributors,
  } from "./profile-response.js";
  import { routePath } from "./router.js";
  import { labelFor, learnerProse } from "./labels/index.js";

  interface Props {
    api: DrillClientApi;
    onNavigate: (path: string) => void;
    onStartPack?: (packId: string) => Promise<void>;
  }
  let { api, onNavigate, onStartPack }: Props = $props();

  let profile: LearnerProfileView | undefined = $state();
  let loading = $state(true);
  let error: string | undefined = $state();
  let cardDrill: Record<string, { readonly contributors: StyleContributors; readonly offset: number } | undefined> = $state({});
  let cardDrillError: Record<string, string | undefined> = $state({});
  let openingDrill: Record<string, OpeningDetail | undefined> = $state({});
  let observationDrill: Record<string, ObservationDetail | undefined> = $state({});
  let drillError: string | undefined = $state();
  let historyRows: readonly ProfileHistoryRow[] = $state([]);
  let historyHidden = $state(0);
  let historyBusy = $state(false);
  let shareIntent: string | undefined = $state();
  let shareConsent = $state(false);
  let shareBusy = $state(false);
  let shareError: string | undefined = $state();
  let shared: SharedHabitCard | undefined = $state();
  let copied = $state(false);
  let attached = false;
  let generation = 0;

  onMount(() => {
    attached = true;
    void load();
    return () => { attached = false; generation += 1; };
  });

  async function load(): Promise<void> {
    const current = ++generation;
    loading = true;
    error = undefined;
    try {
      if (api.learnerProfile === undefined) throw new Error("The profile is unavailable.");
      const next = await api.learnerProfile();
      if (!attached || current !== generation) return;
      profile = next;
      historyRows = next.history.items;
      historyHidden = next.history.hiddenCount;
    } catch {
      if (!attached || current !== generation) return;
      error = "Your profile could not be loaded. Nothing has been changed; try again.";
    } finally {
      if (attached && current === generation) loading = false;
    }
  }

  function readableDate(value: string | null): string {
    if (value === null) return "date not recorded";
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleDateString();
  }

  function plural(count: number, noun: string): string {
    return `${count} ${noun}${count === 1 ? "" : "s"}`;
  }

  function moveLabel(ref: StyleContributorRef): string {
    const moveNumber = Math.ceil(ref.ply / 2);
    const san = ref.moveSan ?? "position";
    return `Move ${moveNumber}${ref.ply % 2 === 0 ? "…" : "."} ${san} (ply ${ref.ply}) · ${readableDate(ref.observedAt)}`;
  }

  function phaseText(value: string): string {
    return value === "all" ? "all phases" : `the ${value}`;
  }

  function kindText(value: ProfileHistoryRow["sessionKind"]): string {
    return value === "pack" ? "Pack rehearsal" : value === "imported" ? "Imported game" : value === "position" ? "Game or position" : "Run";
  }

  function outcomeText(value: ProfileHistoryRow["outcome"]): string {
    return value === "win" ? "won" : value === "loss" ? "lost" : value === "draw" ? "drawn" : "no recorded result";
  }

  function stateText(row: ProfileHistoryRow): string {
    if (row.state === "pending") return "being processed";
    if (row.state === "failed") return "not processed";
    if (row.state === "unavailable") return "not counted";
    return row.status === "counted_game" ? "counted as a game" : "counted as observations only";
  }

  function intervalText(card: Extract<HabitCard, { state: "measured" }>): string {
    const digits = card.unit === "decision" ? 3 : 2;
    return `${card.interval.lower.toFixed(digits)} to ${card.interval.upper.toFixed(digits)} (95%, ${card.interval.resamples} game resamples)`;
  }

  async function openCard(metricId: string, offset = 0): Promise<void> {
    if (api.learnerProfileStyle === undefined) return;
    cardDrillError = { ...cardDrillError, [metricId]: undefined };
    try {
      const page = await api.learnerProfileStyle(metricId, offset, 25);
      if (!attached) return;
      const previous = offset === 0 ? [] : cardDrill[metricId]?.contributors.shown ?? [];
      cardDrill = { ...cardDrill, [metricId]: { offset, contributors: { ...page.contributors, shown: [...previous, ...page.contributors.shown] } } };
    } catch {
      if (attached) cardDrillError = { ...cardDrillError, [metricId]: "The games behind this card could not be loaded. Try again." };
    }
  }

  async function openOpening(key: string): Promise<void> {
    if (api.learnerProfileOpening === undefined) return;
    drillError = undefined;
    try {
      const detail = await api.learnerProfileOpening(key, 0, 100);
      if (attached) openingDrill = { ...openingDrill, [key]: detail };
    } catch {
      if (attached) drillError = "These games could not be loaded. Try again.";
    }
  }

  async function openObservation(key: string): Promise<void> {
    if (api.learnerProfileObservation === undefined) return;
    drillError = undefined;
    try {
      const detail = await api.learnerProfileObservation(key, 0, 100);
      if (attached) observationDrill = { ...observationDrill, [key]: detail };
    } catch {
      if (attached) drillError = "These moves could not be loaded. Try again.";
    }
  }

  async function moreHistory(): Promise<void> {
    if (api.learnerProfileHistory === undefined) return;
    historyBusy = true;
    try {
      const page = await api.learnerProfileHistory(historyRows.length, 50);
      if (!attached) return;
      historyRows = [...historyRows, ...page.items];
      historyHidden = page.hiddenCount;
    } catch {
      if (attached) drillError = "More history could not be loaded. Try again.";
    } finally {
      if (attached) historyBusy = false;
    }
  }

  function beginShare(metricId: string): void {
    shareIntent = metricId;
    shareConsent = false;
    shareError = undefined;
    shared = undefined;
    copied = false;
  }

  async function confirmShare(): Promise<void> {
    if (shareIntent === undefined || !shareConsent || api.shareProfileCard === undefined) return;
    shareBusy = true;
    shareError = undefined;
    try {
      shared = await api.shareProfileCard(shareIntent, true);
    } catch {
      shareError = "This card could not be prepared for sharing. Nothing was shared.";
    } finally {
      shareBusy = false;
    }
  }

  async function copyShare(): Promise<void> {
    if (shared === undefined) return;
    try {
      await navigator.clipboard.writeText(shared.text);
      copied = true;
    } catch {
      copied = false;
      shareError = "Copying failed. Select the text and copy it yourself.";
    }
  }

  function openRun(runId: string, review: boolean): void {
    onNavigate(routePath(review ? { name: "story", runId } : { name: "run", runId }));
  }
</script>

{#snippet refList(refs: readonly StyleContributorRef[], label: string)}
  <ol class="ref-list" aria-label={label}>
    {#each refs as ref (`${ref.runId}:${ref.nodeId}`)}
      <li>
        <span>{moveLabel(ref)}</span>
        <span class="ref-actions">
          <button type="button" onclick={() => openRun(ref.runId, true)}>Open game review</button>
          <button type="button" onclick={() => openRun(ref.runId, false)}>Open in rehearsal</button>
        </span>
      </li>
    {/each}
  </ol>
{/snippet}

<main class="profile-view" aria-labelledby="profile-title">
  <header>
    <p class="eyebrow">Your profile · private</p>
    <h1 id="profile-title">What your recorded games show</h1>
    <p>Counts from your own saved games, each shown with what it was counted out of. Open any number to see the games and moves behind it.</p>
  </header>

  {#if loading}
    <p role="status">Loading your profile…</p>
  {:else if error}
    <div class="error" role="alert"><p>{error}</p><button type="button" onclick={() => void load()}>Try again</button></div>
  {:else if profile}
    <section class="status-card" aria-labelledby="profile-status-title">
      <h2 id="profile-status-title">What is counted</h2>
      <p>{profile.store.statement}</p>
      <p>{profile.population.definition}</p>
      <p>{profile.population.measuredGames === 1 ? "1 measured game" : `${profile.population.measuredGames} measured games`} · {profile.population.playedDecisions} of your moves{profile.population.window ? ` · ${readableDate(profile.population.window.from)} to ${readableDate(profile.population.window.to)}` : ""}</p>
      {#if profile.store.pending > 0}<button type="button" onclick={() => void load()}>Check again</button>{/if}
    </section>

    <section aria-labelledby="habit-title">
      <h2 id="habit-title">Habit cards</h2>
      <ul class="disclosures">{#each profile.style.disclosures as line}<li>{line}</li>{/each}</ul>
      <div class="card-grid">
        {#each profile.style.cards as card (card.metricId)}
          <article class="habit-card" class:abstained={card.state === "abstained"} aria-labelledby={`card-${card.metricId}`}>
            <h3 id={`card-${card.metricId}`}>{card.title}</h3>
            <p class="sentence">{card.sentence}</p>
            {#if card.state === "measured"}
              <p class="value">{card.valueText}</p>
              <dl>
                <div><dt>Interval</dt><dd>{intervalText(card)}</dd></div>
                <div><dt>Counted</dt><dd>{card.games} games, {card.decisions} of your moves</dd></div>
                <div><dt>This card's floor</dt><dd>{card.floor} games</dd></div>
                <div><dt>Window</dt><dd>{readableDate(card.window.from)} to {readableDate(card.window.to)}</dd></div>
                <div><dt>Scope</dt><dd>{phaseText(card.phaseScope)}; all of your recorded games (time controls are not recorded yet)</dd></div>
                <div><dt>State</dt><dd>{labelFor("style_tier_state", card.tier.state)} under {labelFor("style_tier_rule", card.tier.rule)}</dd></div>
                <div><dt>Metric</dt><dd>Version {card.version}{card.reference ? ` · reference population version ${card.reference.version}` : ""}</dd></div>
              </dl>
            {:else}
              <dl>
                <div><dt>This card's floor</dt><dd>{plural(card.floor, "game")}</dd></div>
                {#if card.abstention.code === "blocked"}
                  <div><dt>Waiting on</dt><dd>{card.abstention.home}</dd></div>
                {:else}
                  <div><dt>Measured so far</dt><dd>{plural(card.games, "game")}</dd></div>
                {/if}
              </dl>
            {/if}
            <details>
              <summary>How this is counted</summary>
              <p>Value: {card.valueDefinition}.</p>
              <p>Out of: {card.denominatorDefinition}.</p>
            </details>
            <div class="row-actions">
              {#if card.contributors.total > 0}
                <button type="button" onclick={() => void openCard(card.metricId)} aria-expanded={cardDrill[card.metricId] !== undefined}>
                  {card.state === "measured" ? "Show the moves behind this" : "Show the games counted so far"}
                </button>
              {/if}
              {#if card.state === "measured" && api.shareProfileCard}
                <button type="button" onclick={() => beginShare(card.metricId)}>Prepare to share…</button>
              {/if}
            </div>
            {#if cardDrillError[card.metricId]}<p role="alert">{cardDrillError[card.metricId]}</p>{/if}
            {#if cardDrill[card.metricId]}
              {@const drill = cardDrill[card.metricId]!}
              {@render refList(drill.contributors.shown, `${card.title}: contributing moves`)}
              <p class="honest">Showing {drill.contributors.shown.length} of {drill.contributors.total}{drill.contributors.hiddenCount > 0 ? `; ${drill.contributors.hiddenCount} more not shown` : ""}.</p>
              {#if drill.contributors.hiddenCount > 0}<button type="button" onclick={() => void openCard(card.metricId, drill.contributors.shown.length)}>Show more</button>{/if}
            {/if}
            {#if shareIntent === card.metricId}
              <aside class="consent-card" aria-labelledby={`share-${card.metricId}`}>
                <h4 id={`share-${card.metricId}`}>Share this card?</h4>
                <p>You receive this card's sentence and numbers as text. Tabiya stores nothing and publishes nothing; the text leaves Tabiya only if you paste it somewhere.</p>
                <p class="honest">The text carries no game, move or label about you — only the measured numbers shown above.</p>
                <label><input type="checkbox" bind:checked={shareConsent} disabled={shareBusy} /> I choose to share this card's numbers</label>
                <div class="row-actions">
                  <button type="button" disabled={!shareConsent || shareBusy} onclick={() => void confirmShare()}>{shareBusy ? "Preparing…" : "Prepare text"}</button>
                  <button type="button" onclick={() => { shareIntent = undefined; shared = undefined; }}>Cancel</button>
                </div>
                {#if shared}
                  <label>Text to share <textarea readonly rows="4">{shared.text}</textarea></label>
                  <button type="button" onclick={() => void copyShare()}>{copied ? "Copied" : "Copy text"}</button>
                {/if}
                {#if shareError}<p role="alert">{shareError}</p>{/if}
              </aside>
            {/if}
          </article>
        {/each}
      </div>
    </section>

    <section aria-labelledby="openings-title">
      <h2 id="openings-title">Openings you played</h2>
      {#if !profile.openings.available}
        <p>{learnerProse(profile.openings.unavailableReason ?? "")}</p>
      {:else}
        <p class="honest">{profile.openings.rateStatement}{profile.openings.source ? ` Names: ${profile.openings.source}` : ""}</p>
        {#if profile.openings.rows.length === 0}
          <p>No measured game has reached a named opening yet.</p>
        {:else}
          <ul class="opening-list">
            {#each profile.openings.rows as row (row.key)}
              <li>
                <div>
                  <h3>{row.eco} {row.name}</h3>
                  <p>{row.games === 1 ? "1 game" : `${row.games} games`}: {row.results.win} won, {row.results.draw} drawn, {row.results.loss} lost, {row.results.noResult} without a recorded result · last {readableDate(row.lastPlayedAt)}</p>
                  {#if row.relatedPacks.length > 0}
                    <p>Packs that start in {row.eco}:</p>
                    <div class="row-actions">{#each row.relatedPacks as pack (pack.id)}<button type="button" disabled={onStartPack === undefined} onclick={() => void onStartPack?.(pack.id)}>Rehearse {pack.title}</button>{/each}</div>
                  {/if}
                </div>
                <button type="button" onclick={() => void openOpening(row.key)} aria-expanded={openingDrill[row.key] !== undefined}>Show these games</button>
                {#if openingDrill[row.key]}
                  {@const detail = openingDrill[row.key]!}
                  <ol class="ref-list" aria-label={`${row.eco} ${row.name}: games`}>
                    {#each detail.games.items as game (game.runId)}
                      <li><span>{readableDate(game.observedAt)} · {outcomeText(game.outcome)}</span><span class="ref-actions"><button type="button" onclick={() => openRun(game.runId, true)}>Open game review</button><button type="button" onclick={() => openRun(game.runId, false)}>Open in rehearsal</button></span></li>
                    {/each}
                  </ol>
                  {#if detail.games.hiddenCount > 0}<p class="honest">{detail.games.hiddenCount} more games not shown.</p>{/if}
                {/if}
              </li>
            {/each}
          </ul>
          {#if profile.openings.unresolvedGames > 0}<p class="honest">{profile.openings.unresolvedGames === 1 ? "1 measured game" : `${profile.openings.unresolvedGames} measured games`} did not reach a named opening in the installed catalogue.</p>{/if}
        {/if}
      {/if}
    </section>

    <section aria-labelledby="observations-title">
      <h2 id="observations-title">Recorded observations</h2>
      <p class="honest">{profile.observations.statement}</p>
      {#if profile.observations.rows.length === 0}
        <p>No observation has been recorded from your moves yet.</p>
      {:else}
        <details>
          <summary>Show the recorded observations</summary>
          <div class="table-scroll"><table>
            <thead><tr><th scope="col">Observation</th><th scope="col">Happened</th><th scope="col">Could have happened</th><th scope="col">Games</th><th scope="col">Your moves in those games</th><th scope="col"><span class="visually-hidden">Details</span></th></tr></thead>
            <tbody>
              {#each profile.observations.rows as row (row.key)}
                <tr>
                  <th scope="row">{row.label}<br /><small>Version {row.projectionVersion}</small></th>
                  <td>{row.occurred}</td><td>{row.opportunities}</td><td>{row.runs}</td><td>{row.decisions}</td>
                  <td><button type="button" disabled={row.occurred === 0} onclick={() => void openObservation(row.key)}>Show moves</button></td>
                </tr>
                {#if observationDrill[row.key]}
                  {@const detail = observationDrill[row.key]!}
                  <tr><td colspan="6">{@render refList(detail.occurred.items, `${row.label}: moves`)}{#if detail.occurred.hiddenCount > 0}<p class="honest">{detail.occurred.hiddenCount} more moves not shown.</p>{/if}</td></tr>
                {/if}
              {/each}
            </tbody>
          </table></div>
        </details>
      {/if}
    </section>

    <section aria-labelledby="skills-title">
      <h2 id="skills-title">Skills</h2>
      <p>{profile.skills.marksStatement}</p>
      <p class="honest">{profile.skills.valence.statement}</p>
      <div class="category-grid">
        {#each profile.skills.categories as category (category.category)}
          <article aria-labelledby={`skill-${category.category}`}>
            <h3 id={`skill-${category.category}`}>{category.label}</h3>
            {#if category.marks.length > 0}
              <ul>{#each category.marks as mark (mark.kind)}<li>{mark.sentence} {readableDate(mark.occurredAt)} <button type="button" onclick={() => openRun(mark.link.runId, true)}>Open the game</button></li>{/each}</ul>
            {:else if category.emptyReason}
              <p>{learnerProse(category.emptyReason)}</p>
            {:else}
              <p>Nothing here can be credited yet.</p>
            {/if}
          </article>
        {/each}
      </div>
      {#if profile.skills.candidateLeaves.length > 0}
        <details>
          <summary>Ideas that could become skills, and what each is waiting on</summary>
          <ul class="leaf-list">
            {#each profile.skills.candidateLeaves as leaf (leaf.leafId)}
              <li><strong>{leaf.label}</strong><ul>{#each leaf.blockerText as blocker}<li>{blocker}</li>{/each}</ul></li>
            {/each}
          </ul>
          <p class="honest">{profile.skills.conceptIdentity}</p>
        </details>
      {/if}
    </section>

    <section aria-labelledby="history-title">
      <h2 id="history-title">Your saved runs</h2>
      {#if historyRows.length === 0}
        <p>You have no saved runs yet.</p>
      {:else}
        <ol class="history-list">
          {#each historyRows as row (row.runId)}
            <li>
              <div>
                <strong>{kindText(row.sessionKind)}</strong> · {readableDate(row.observedAt)} · {stateText(row)}{row.opening ? ` · ${row.opening.eco} ${row.opening.name}` : ""}{row.state === "counted" && row.status === "counted_game" ? ` · ${outcomeText(row.outcome)}` : ""}
                {#if row.detail}<p class="honest">{row.detail}</p>{/if}
              </div>
              <span class="ref-actions"><button type="button" onclick={() => openRun(row.runId, true)}>Open game review</button><button type="button" onclick={() => openRun(row.runId, false)}>Open in rehearsal</button></span>
            </li>
          {/each}
        </ol>
        {#if historyHidden > 0}<p class="honest">{historyHidden} more saved runs not shown.</p><button type="button" disabled={historyBusy} onclick={() => void moreHistory()}>{historyBusy ? "Loading…" : "Show more"}</button>{/if}
      {/if}
      {#if drillError}<p role="alert">{drillError}</p>{/if}
    </section>

    <section aria-labelledby="privacy-title">
      <h2 id="privacy-title">Privacy</h2>
      <ul class="disclosures">{#each profile.privacy.statements as line}<li>{line}</li>{/each}</ul>
      <p><a href="/settings#account-settings" onclick={(event) => { event.preventDefault(); onNavigate("/settings#account-settings"); }}>Download or delete your data in Account settings</a></p>
    </section>
  {/if}
</main>

<style>
  .profile-view { height: 100%; overflow: auto; padding: clamp(1rem, 3vw, 2.5rem); max-width: 72rem; margin: 0 auto; }
  header { max-width: 48rem; }
  h1, h2, h3, h4, p { margin-top: 0; }
  section { margin-top: 1.75rem; }
  .eyebrow { color: var(--muted); font: 700 0.72rem/1.2 ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
  .status-card, .habit-card, .category-grid article, .consent-card { padding: 1rem; border: 1px solid var(--line); border-radius: .9rem; background: var(--panel); }
  .card-grid, .category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr)); gap: 1rem; }
  .habit-card.abstained { background: var(--paper); }
  .sentence { line-height: 1.5; }
  .value { font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums; }
  dl { display: grid; gap: .35rem; margin: 0 0 .75rem; }
  dl div { display: grid; grid-template-columns: minmax(7rem, auto) 1fr; gap: .5rem; }
  dt { color: var(--muted); font-size: .75rem; text-transform: uppercase; }
  dd { margin: 0; overflow-wrap: anywhere; }
  .disclosures { color: var(--muted); line-height: 1.5; max-width: 60rem; }
  .row-actions, .ref-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
  button { min-height: 2.5rem; padding: .45rem .7rem; border: 1px solid var(--line); border-radius: .55rem; background: var(--paper); color: var(--ink); cursor: pointer; }
  button:disabled { cursor: not-allowed; opacity: .6; }
  details { margin: .25rem 0 .75rem; }
  summary { display: flex; align-items: center; gap: .4rem; min-height: 2.5rem; cursor: pointer; }
  summary::before { content: "▸"; }
  details[open] > summary::before { content: "▾"; }
  summary::-webkit-details-marker { display: none; }
  summary { list-style: none; }
  .ref-list, .history-list, .opening-list, .leaf-list { display: grid; gap: .5rem; padding-left: 1.25rem; }
  .ref-list li, .history-list li { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem; }
  .opening-list { list-style: none; padding: 0; }
  .opening-list > li { display: grid; gap: .5rem; padding: .75rem 0; border-bottom: 1px solid var(--line); }
  .honest { color: var(--muted); }
  .table-scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: .5rem; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
  thead th { color: var(--muted); font-size: .72rem; text-transform: uppercase; }
  td { font-variant-numeric: tabular-nums; }
  textarea { width: 100%; box-sizing: border-box; }
  .error { padding: 1rem; border: 1px solid var(--warning); border-radius: .75rem; }
  @media (max-width: 720px) { dl div { grid-template-columns: 1fr; } }
</style>
