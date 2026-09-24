<script lang="ts">
  import { onMount } from "svelte";

  import { ApiError } from "./api.js";
  import {
    ACT_LABELS,
    CAMPAIGN_MODULE_LABELS,
    CampaignApi,
    SHELF_REASON_TEXT,
    newCampaignCommandId,
    rewardText,
    verdictText,
    type CampaignCatalogueEntry,
    type CampaignModuleId,
    type CampaignNodeCard,
    type CampaignProjection,
    type CampaignRunResult,
  } from "./campaign-api.js";

  // rfc/campaign-core.md §7.1 — Campaign home/resume, the map, bounded encounter preparation and the
  // run result. Campaign is optional: it never locks the open library and never sells progression.

  interface Props {
    campaigns: CampaignApi;
    campaignRunId?: string | undefined;
    onNavigate: (path: string) => void;
    /** Persists the writer id this browser used to start an encounter, keyed by its play run. */
    rememberWriter: (runId: string, writerId: string) => void;
  }
  let { campaigns, campaignRunId, onNavigate, rememberWriter }: Props = $props();

  let catalogue: readonly CampaignCatalogueEntry[] = $state([]);
  let campaign: CampaignProjection | undefined = $state();
  let result: CampaignRunResult | undefined = $state();
  let loading = $state(true);
  let busy: string | undefined = $state();
  let error: string | undefined = $state();
  let preparing: CampaignNodeCard | undefined = $state();
  let confirmAbandon = $state(false);
  let generation = 0;
  // One command id per intent, retained until it settles, so a retried click replays instead of repeating.
  const pending = new Map<string, string>();

  function commandFor(intent: string): string {
    let id = pending.get(intent);
    if (id === undefined) { id = newCampaignCommandId(); pending.set(intent, id); }
    return id;
  }

  function message(caught: unknown): string {
    if (caught instanceof ApiError) {
      if (caught.code === "CAMPAIGN_REVISION_STALE") return "The campaign changed in another tab. The map has been reloaded.";
      return caught.message;
    }
    return "The campaign could not be loaded. Try again.";
  }

  onMount(() => () => { generation += 1; });

  // Loads on mount and whenever the route's campaign run changes.
  $effect(() => {
    void campaignRunId;
    void load();
  });

  async function load(): Promise<void> {
    const current = ++generation;
    loading = true;
    error = undefined;
    try {
      if (campaignRunId === undefined) {
        const next = await campaigns.catalogue();
        if (current !== generation) return;
        catalogue = next.campaigns;
        campaign = undefined;
        result = undefined;
      } else {
        const next = await campaigns.read(campaignRunId);
        if (current !== generation) return;
        campaign = next;
        result = next.campaignRun.status === "active" ? undefined : await campaigns.result(campaignRunId);
      }
    } catch (caught) {
      if (current === generation) error = message(caught);
    } finally {
      if (current === generation) loading = false;
    }
  }

  async function begin(entry: CampaignCatalogueEntry): Promise<void> {
    if (entry.activeRunId !== null) { onNavigate(`/campaign/${encodeURIComponent(entry.activeRunId)}`); return; }
    const intent = `create:${entry.id}@${entry.version}`;
    busy = intent;
    error = undefined;
    try {
      const created = await campaigns.create(entry.id, entry.version, commandFor(intent));
      pending.delete(intent);
      onNavigate(`/campaign/${encodeURIComponent(created.campaign.campaignRun.id)}`);
    } catch (caught) {
      error = message(caught);
    } finally {
      busy = undefined;
    }
  }

  async function startEncounter(card: CampaignNodeCard): Promise<void> {
    if (campaign === undefined) return;
    const intent = `start:${campaign.campaignRun.id}:${card.nodeId}:${campaign.campaignRun.revision}`;
    busy = intent;
    error = undefined;
    const writerKey = `writer:${intent}`;
    let writerId = pending.get(writerKey);
    if (writerId === undefined) { writerId = `writer-${globalThis.crypto.randomUUID()}`; pending.set(writerKey, writerId); }
    try {
      const started = await campaigns.start(campaign.campaignRun.id, card.nodeId, campaign.campaignRun.revision, commandFor(intent), writerId);
      const playRunId = String(started.result.response?.playRunId);
      rememberWriter(playRunId, writerId);
      pending.delete(intent);
      pending.delete(writerKey);
      onNavigate(`/play/run/${encodeURIComponent(playRunId)}`);
    } catch (caught) {
      error = message(caught);
      if (caught instanceof ApiError && caught.code === "CAMPAIGN_REVISION_STALE") await load();
    } finally {
      busy = undefined;
    }
  }

  async function toggleEquip(moduleId: CampaignModuleId, equip: boolean): Promise<void> {
    if (campaign === undefined) return;
    const next = equip ? [...campaign.kit.equipped, moduleId] : campaign.kit.equipped.filter((id) => id !== moduleId);
    const intent = `loadout:${campaign.campaignRun.revision}:${[...next].sort().join(",")}`;
    busy = intent;
    error = undefined;
    try {
      const changed = await campaigns.loadout(campaign.campaignRun.id, next, campaign.campaignRun.revision, commandFor(intent));
      pending.delete(intent);
      campaign = changed.campaign;
    } catch (caught) {
      error = message(caught);
      await load();
    } finally {
      busy = undefined;
    }
  }

  async function abandon(): Promise<void> {
    if (campaign === undefined) return;
    const intent = `abandon:${campaign.campaignRun.id}:${campaign.campaignRun.revision}`;
    busy = intent;
    error = undefined;
    try {
      const abandoned = await campaigns.abandon(campaign.campaignRun.id, campaign.campaignRun.revision, commandFor(intent));
      pending.delete(intent);
      confirmAbandon = false;
      campaign = abandoned.campaign;
      result = await campaigns.result(campaign.campaignRun.id);
    } catch (caught) {
      error = message(caught);
    } finally {
      busy = undefined;
    }
  }

  function unavailableText(card: CampaignNodeCard): string | undefined {
    if (card.unavailable === "pack_unavailable") return "This encounter's pack is not installed here.";
    if (card.unavailable === "opponent_unavailable") return "This boss's registered bot cannot start a game right now.";
    return undefined;
  }

  function lockedReason(layerState: string, card: CampaignNodeCard): string | undefined {
    if (card.seal !== null) return undefined;
    if (layerState === "locked") return "Opens when the previous layer is sealed.";
    if (layerState === "sealed") return "Another path was chosen on this layer.";
    if (campaign?.activeEncounter !== null && !card.active) return "Finish the active encounter first.";
    return unavailableText(card);
  }
</script>

<section class="campaign-view" aria-labelledby="campaign-title">
  {#if campaignRunId === undefined}
    <header>
      <p class="eyebrow">Campaign</p>
      <h1 id="campaign-title">Campaign</h1>
      <p class="honest">A campaign strings rehearsals into a map. Playing a node unlocks tools for this run; winning only adds a prestige mark. Every pack stays open in Play and the Library — nothing here is locked behind a campaign or sold.</p>
    </header>
    {#if loading}<p role="status">Loading campaigns…</p>{/if}
    {#if error}<p role="alert">{error}</p>{/if}
    <div class="catalogue">
      {#each catalogue as entry (`${entry.id}@${entry.version}`)}
        <article class="campaign-card" data-campaign={entry.id}>
          <h2>{entry.title}</h2>
          <p class="meta">{entry.channel === "official" ? "Official" : "Community draft"} · {entry.nodeCount} nodes across three acts{entry.completedRuns > 0 ? ` · completed ${entry.completedRuns}×` : ""}</p>
          {#if entry.marks.length > 0}<p class="meta">Marks: {entry.marks.map((mark) => mark.startsWith("prestige") ? "Prestige" : "Completion").join(", ")}</p>{/if}
          {#if !entry.available}<p class="honest" id={`unavailable-${entry.id}`}>Unavailable here: {entry.unavailablePacks.join(", ")} not installed.</p>{/if}
          <button type="button" disabled={!entry.available || busy !== undefined} aria-describedby={!entry.available ? `unavailable-${entry.id}` : undefined} onclick={() => void begin(entry)}>
            {entry.activeRunId !== null ? "Resume run" : busy === `create:${entry.id}@${entry.version}` ? "Starting…" : "Start a run"}
          </button>
        </article>
      {:else}
        {#if !loading}<p class="honest">No campaigns are installed here.</p>{/if}
      {/each}
    </div>
  {:else if campaign}
    <header class="map-header">
      <div>
        <p class="eyebrow">Campaign · {campaign.campaignRun.channel === "official" ? "Official" : "Community draft"}</p>
        <h1 id="campaign-title">{campaign.campaignRun.title}</h1>
      </div>
      <p class="charges" data-testid="campaign-charges" aria-label={`Earned rewinds: ${campaign.charges.balance} remaining this campaign`}>
        <span aria-hidden="true">⟲ {campaign.charges.balance}</span>
        <span class="charges-copy">Earned rewinds: {campaign.charges.balance} remaining this campaign</span>
      </p>
    </header>
    {#if error}<p role="alert">{error}</p>{/if}
    {#if campaign.activeEncounter}
      <aside class="resume" aria-label="Active encounter">
        <p>Encounter in progress: <strong>{campaign.activeEncounter.title}</strong></p>
        <button type="button" onclick={() => onNavigate(`/play/run/${encodeURIComponent(campaign!.activeEncounter!.playRunId)}`)}>Continue encounter</button>
      </aside>
    {/if}

    {#if result}
      <section class="result" aria-labelledby="run-result-title">
        <h2 id="run-result-title">{campaign.campaignRun.status === "completed" ? "Campaign completed" : "Campaign abandoned"}</h2>
        <p>{result.prestigeEligible ? "Every node was won: the prestige mark is earned." : campaign.campaignRun.status === "completed" ? "Completed. Prestige needs every node won; the core path never did." : "Abandoned. Seals already made stay in your history; no completion mark is awarded."}</p>
        {#if result.awards.length > 0}<p>Marks awarded: {result.awards.map((award) => award.durableRewardId.startsWith("prestige") ? "Prestige mark" : "Completion mark").join(", ")}</p>{/if}
        <ol class="path">
          {#each result.path as step (step.nodeId)}
            <li>{ACT_LABELS[step.act as "act1"]} · {step.title} — {step.kind === "pack" ? verdictText({ kind: "pack", verdict: step.verdict, playRunId: step.playRunId }) : verdictText({ kind: "boss_game", outcome: step.outcome, reason: step.reason, playRunId: step.playRunId })}
              <button type="button" class="link" onclick={() => onNavigate(`/play/run/${encodeURIComponent(step.playRunId)}`)}>Review</button></li>
          {/each}
        </ol>
        <button type="button" onclick={() => onNavigate("/campaign")}>Start another run</button>
      </section>
    {/if}

    <div class="map" role="list" aria-label="Campaign map">
      {#each campaign.acts as act (act.id)}
        <section class="act" role="listitem" aria-labelledby={`act-${act.id}`}>
          <h2 id={`act-${act.id}`}>{ACT_LABELS[act.id]} · earned rewinds per seal: {campaign.economy.actGrants[act.id]}</h2>
          {#each act.layers as layer (layer.layer)}
            <div class={`layer ${layer.state}`} aria-label={`${ACT_LABELS[act.id]}, layer ${layer.layer}: ${layer.state}`}>
              {#each layer.choices as card (card.nodeId)}
                {@const locked = lockedReason(layer.state, card)}
                <article class="node-card" class:boss={card.boss} class:sealed={card.seal !== null} data-node={card.nodeId}>
                  <h3>{card.boss ? "Boss · " : ""}{card.title}</h3>
                  <p class="meta">{card.kind === "boss_game" ? "Full game" : "Rehearsal pack"}{card.phase ? ` · ${card.phase}` : ""}</p>
                  {#if card.opponent}<p class="meta">Opponent: registered bot {card.opponent.profileId} · {card.rating === "unrated" ? "unrated" : "rated when clean"}</p>{/if}
                  <p>{rewardText(card.reward)}</p>
                  {#if card.suppress.length > 0}<p class="suppress">Sets aside: {card.suppress.map((id) => CAMPAIGN_MODULE_LABELS[id]).join(", ")}</p>{/if}
                  {#if card.seal !== null}<p class="seal">{verdictText(card.seal)}</p>{/if}
                  {#if card.active}
                    <button type="button" onclick={() => onNavigate(`/play/run/${encodeURIComponent(campaign!.activeEncounter!.playRunId)}`)}>Continue</button>
                  {:else if card.selectable}
                    <button type="button" onclick={() => { preparing = card; }}>Prepare</button>
                  {:else if locked}
                    <p class="honest">{locked}</p>
                  {/if}
                </article>
              {/each}
            </div>
          {/each}
        </section>
      {/each}
    </div>

    <section class="kit" aria-labelledby="kit-title">
      <h2 id="kit-title">Your campaign kit</h2>
      {#if campaign.kit.owned.length === 0}
        <p class="honest">No tools earned yet. Playing a node — whatever its outcome — earns its reward.</p>
      {:else}
        <ul>
          {#each campaign.kit.owned as moduleId (moduleId)}
            <li><label><input type="checkbox" checked={campaign.kit.equipped.includes(moduleId)} disabled={busy !== undefined || campaign.campaignRun.status !== "active"} onchange={(event) => void toggleEquip(moduleId, event.currentTarget.checked)} /> {CAMPAIGN_MODULE_LABELS[moduleId]}</label></li>
          {/each}
        </ul>
      {/if}
    </section>

    {#if preparing}
      <section class="prep" aria-labelledby="prep-title">
        <h2 id="prep-title">{preparing.boss ? "Boss · " : ""}{preparing.title}</h2>
        {#if preparing.objectiveSummary}<p>{preparing.objectiveSummary}</p>{/if}
        {#if preparing.opponent}<p>You play a full game from the authored start against registered bot {preparing.opponent.profileId}. Only the rules end it.</p>{/if}
        <p>{rewardText(preparing.reward)} — earned when you declare the encounter done, whatever the outcome.</p>
        {#if preparing.suppress.length > 0}<p class="suppress">This boss sets aside: {preparing.suppress.map((id) => CAMPAIGN_MODULE_LABELS[id]).join(", ")}.</p>{/if}
        <h3>Tools for this encounter</h3>
        <ul class="shelf">
          {#each campaign.kit.owned as moduleId (moduleId)}
            {@const suppressed = preparing.suppress.includes(moduleId)}
            {@const equipped = campaign.kit.equipped.includes(moduleId)}
            <li>{CAMPAIGN_MODULE_LABELS[moduleId]}: {suppressed ? SHELF_REASON_TEXT.boss_suppressed : equipped ? "ready" : SHELF_REASON_TEXT.not_equipped}</li>
          {:else}
            <li>Legal moves only — no tools earned yet.</li>
          {/each}
        </ul>
        <p class="honest">Rewinds and branches inside the encounter spend earned rewinds ({campaign.charges.balance} left). Comparing lines is free.</p>
        <div class="row-actions">
          <button type="button" disabled={busy !== undefined} onclick={() => void startEncounter(preparing!)}>{busy?.startsWith("start:") ? "Starting…" : "Start encounter"}</button>
          <button type="button" onclick={() => { preparing = undefined; }}>Back to map</button>
        </div>
      </section>
    {/if}

    {#if campaign.campaignRun.status === "active"}
      <section class="abandon">
        {#if confirmAbandon}
          <aside class="consent-card" aria-label="Abandon this campaign run">
            <p>Abandoning ends this run now. Seals and play runs stay in your history; no completion or prestige mark is awarded. Nothing else changes — every pack stays open.</p>
            <div class="row-actions">
              <button type="button" disabled={busy !== undefined} onclick={() => void abandon()}>Confirm abandon</button>
              <button type="button" onclick={() => { confirmAbandon = false; }}>Keep playing</button>
            </div>
          </aside>
        {:else}
          <button type="button" class="quiet" onclick={() => { confirmAbandon = true; }}>Abandon this run…</button>
        {/if}
      </section>
    {/if}
  {:else if loading}
    <p role="status">Loading the campaign…</p>
  {:else if error}
    <p role="alert">{error}</p>
  {/if}
</section>

<style>
  .campaign-view { height: 100%; overflow: auto; padding: clamp(1rem, 3vw, 2.5rem); max-width: 72rem; margin: 0 auto; box-sizing: border-box; }
  h1, h2, h3, p { margin-top: 0; }
  .eyebrow { color: var(--muted); font: 700 0.72rem/1.2 ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
  .honest, .meta { color: var(--muted); }
  .catalogue { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr)); gap: 1rem; }
  .campaign-card, .node-card, .resume, .result, .prep, .kit { padding: 1rem; border: 1px solid var(--line); border-radius: .8rem; background: var(--panel); min-width: 0; }
  .map-header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: end; }
  .charges { display: grid; gap: .2rem; justify-items: end; font-variant-numeric: tabular-nums; }
  .charges span:first-child { font-size: 1.6rem; font-weight: 700; }
  .charges-copy { color: var(--muted); font-size: .85rem; }
  .map { display: grid; gap: 1.25rem; margin-top: 1rem; }
  .act { display: grid; gap: .75rem; }
  .act h2 { font-size: 1.05rem; }
  .layer { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); gap: .75rem; }
  .layer.locked { opacity: .8; }
  .node-card h3 { font-size: 1rem; overflow-wrap: anywhere; }
  .node-card.boss { border-width: 2px; }
  .node-card.sealed { background: color-mix(in srgb, var(--accent) 7%, var(--panel)); }
  .suppress { color: var(--warning, var(--muted)); }
  .kit ul, .shelf { padding-left: 1.2rem; }
  .prep { position: sticky; bottom: 0; margin-top: 1rem; }
  .row-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
  button { min-height: 2.75rem; padding: .55rem .9rem; border: 1px solid var(--line); border-radius: .6rem; background: var(--accent); color: var(--on-accent); font-weight: 700; cursor: pointer; }
  button:disabled { opacity: .55; cursor: not-allowed; }
  button.quiet, button.link { background: var(--paper); color: var(--ink); font-weight: 500; }
  button.link { min-height: 2rem; padding: .2rem .5rem; margin-left: .4rem; }
  .abandon { margin-top: 1.5rem; }
  .path { padding-left: 1.2rem; }
  .resume, .result { margin-top: 1rem; }
</style>
