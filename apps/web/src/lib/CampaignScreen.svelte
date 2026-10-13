<script lang="ts">
  import { onMount, tick } from "svelte";

  import { ApiError } from "./api.js";
  import CampaignEncounterHistory from "./CampaignEncounterHistory.svelte";
  import CampaignPreparation from "./CampaignPreparation.svelte";
  import type { PreferenceStorage } from "./assistance-preference.js";
  import {
    ACT_LABELS,
    CAMPAIGN_MODULE_LABELS,
    CampaignApi,
    assertCampaignCommand,
    campaignBotLabel,
    newCampaignCommandId,
    rewardText,
    verdictText,
    type CampaignActiveRun,
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
    /** Storage only: preserves this browser's writer id for resume, even after navigation. */
    rememberWriter: (runId: string, writerId: string) => void;
    assistanceStorage?: PreferenceStorage | undefined;
  }
  let { campaigns, campaignRunId, onNavigate, rememberWriter, assistanceStorage }: Props = $props();

  let catalogue: readonly CampaignCatalogueEntry[] = $state([]);
  let savedRuns: readonly CampaignActiveRun[] = $state([]);
  let campaign: CampaignProjection | undefined = $state();
  let result: CampaignRunResult | undefined = $state();
  let loading = $state(true);
  let loadFailed = $state(false);
  let busy: string | undefined = $state();
  let error: string | undefined = $state();
  let preparingNodeId: string | undefined = $state();
  const preparing = $derived(campaign?.acts.flatMap(act => act.layers.flatMap(layer => layer.choices)).find(card => card.nodeId === preparingNodeId));
  let preparationVersion = 0;
  let preparationOpener: HTMLButtonElement | undefined;
  let confirmAbandon = $state(false);
  let generation = 0;
  let resultError = $state(false);
  let resultLoading = $state(false);
  const abandonedCard = $derived(campaign?.acts.flatMap(act => act.layers.flatMap(layer => layer.choices)).find(card => card.nodeId === campaign?.abandonedEncounter?.nodeId));
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

  function prepare(card: CampaignNodeCard, opener: HTMLButtonElement): void {
    if (busy !== undefined) return;
    preparationVersion += 1;
    preparationOpener = opener;
    error = undefined;
    preparingNodeId = card.nodeId;
  }

  async function closePreparation(): Promise<void> {
    const current = generation, version = ++preparationVersion, opener = preparationOpener;
    preparingNodeId = undefined;
    await tick();
    if (current !== generation || version !== preparationVersion) return;
    if (opener?.isConnected && !opener.disabled) opener.focus();
    else document.getElementById("campaign-title")?.focus();
  }

  onMount(() => () => { generation += 1; });

  // Loads on mount and whenever the route's campaign run changes.
  $effect(() => {
    void campaignRunId;
    void load();
  });

  async function load(restoreFocus = false): Promise<void> {
    const current = ++generation;
    const requestedRunId = campaignRunId;
    loading = true;
    loadFailed = false;
    busy = undefined;
    error = undefined;
    campaign = undefined;
    catalogue = [];
    savedRuns = [];
    result = undefined;
    resultError = false;
    resultLoading = false;
    preparingNodeId = undefined;
    preparationVersion += 1;
    confirmAbandon = false;
    try {
      if (requestedRunId === undefined) {
        const [next, active] = await Promise.all([campaigns.catalogue(), campaigns.active()]);
        if (current !== generation) return;
        catalogue = next.campaigns;
        savedRuns = active.runs;
        campaign = undefined;
        result = undefined;
      } else {
        const next = await campaigns.read(requestedRunId);
        if (current !== generation) return;
        if (next.campaignRun.id !== requestedRunId) throw new Error("Crossed campaign read");
        campaign = next;
        if (next.campaignRun.status !== "active") await readResult(next, current);
      }
    } catch (caught) {
      if (current === generation) { error = message(caught); loadFailed = true; }
    } finally {
      if (current === generation) {
        loading = false;
        if (restoreFocus) {
          await tick();
          if (current === generation && requestedRunId === campaignRunId) document.getElementById("campaign-title")?.focus();
        }
      }
    }
  }

  function retryLoad(): void {
    if (loading || busy !== undefined) return;
    void load(true);
  }

  async function begin(entry: CampaignCatalogueEntry): Promise<void> {
    if (busy !== undefined) return;
    if (entry.activeRunId !== null) { onNavigate(`/campaign/${encodeURIComponent(entry.activeRunId)}`); return; }
    const current = generation, requestedRoute = campaignRunId;
    const ownsView = () => current === generation && requestedRoute === campaignRunId;
    const intent = `create:${entry.id}@${entry.version}`;
    busy = intent;
    error = undefined;
    try {
      const created = await campaigns.create(entry.id, entry.version, commandFor(intent));
      if (!ownsView()) return;
      const actual = created?.campaign?.campaignRun;
      if (actual?.campaignId !== entry.id || actual.campaignVersion !== entry.version || typeof actual.id !== "string" || actual.id.trim() === ""
        || created.result?.kind !== "campaign_created" || created.result.campaignRunId !== actual.id
        || created.result.campaignId !== entry.id || created.result.campaignVersion !== entry.version || created.result.documentDigest !== actual.documentDigest) throw new Error("Crossed campaign creation");
      pending.delete(intent);
      onNavigate(`/campaign/${encodeURIComponent(created.campaign.campaignRun.id)}`);
    } catch (caught) {
      if (ownsView()) error = message(caught);
    } finally {
      if (ownsView()) busy = undefined;
    }
  }

  async function startEncounter(card: CampaignNodeCard): Promise<void> {
    if (campaign === undefined || busy !== undefined) return;
    const requested = campaign, current = generation, requestedRoute = campaignRunId;
    const ownsView = () => current === generation && requestedRoute === campaignRunId;
    const intent = `start:${requested.campaignRun.id}:${card.nodeId}:${requested.campaignRun.revision}`;
    const preparation = preparationVersion;
    busy = intent;
    error = undefined;
    const writerKey = `writer:${intent}`;
    let writerId = pending.get(writerKey);
    if (writerId === undefined) { writerId = `writer-${globalThis.crypto.randomUUID()}`; pending.set(writerKey, writerId); }
    try {
      const started = await campaigns.start(requested.campaignRun.id, card.nodeId, requested.campaignRun.revision, commandFor(intent), writerId);
      assertCampaignCommand(started, requested, "encounter_started");
      const playRunId = started.result.response?.playRunId;
      if (started.result.response?.nodeId !== card.nodeId || typeof playRunId !== "string" || playRunId.trim() === "") throw new Error("Crossed encounter start");
      rememberWriter(playRunId, writerId);
      if (!ownsView()) return;
      pending.delete(intent);
      pending.delete(writerKey);
      if (preparation !== preparationVersion) {
        campaign = started.campaign;
        return;
      }
      onNavigate(`/play/run/${encodeURIComponent(playRunId)}`);
    } catch (caught) {
      if (!ownsView()) return;
      error = message(caught);
      if (caught instanceof ApiError && caught.code === "CAMPAIGN_REVISION_STALE") { const reload = generation + 1; await load(); if (generation === reload && requestedRoute === campaignRunId) error = "The campaign changed in another tab. Check the reloaded map before starting an encounter."; }
    } finally {
      if (ownsView()) busy = undefined;
    }
  }

  async function toggleEquip(moduleId: CampaignModuleId, equip: boolean): Promise<void> {
    if (campaign === undefined || busy !== undefined) return;
    const requested = campaign, current = generation, requestedRoute = campaignRunId;
    const ownsView = () => current === generation && requestedRoute === campaignRunId;
    const next = equip ? [...requested.kit.equipped, moduleId] : requested.kit.equipped.filter((id) => id !== moduleId);
    const intent = `loadout:${requested.campaignRun.id}:${requested.campaignRun.revision}:${[...next].sort().join(",")}`;
    busy = intent;
    error = undefined;
    try {
      const changed = await campaigns.loadout(requested.campaignRun.id, next, requested.campaignRun.revision, commandFor(intent));
      if (!ownsView()) return;
      assertCampaignCommand(changed, requested, "loadout_changed");
      pending.delete(intent);
      campaign = changed.campaign;
    } catch (caught) {
      if (!ownsView()) return;
      error = message(caught);
      if (caught instanceof ApiError && caught.code === "CAMPAIGN_REVISION_STALE") { const reload = generation + 1; await load(); if (generation === reload && requestedRoute === campaignRunId) error = "The campaign changed in another tab. Check the reloaded kit before changing it."; }
    } finally {
      if (ownsView()) busy = undefined;
    }
  }

  async function abandon(): Promise<void> {
    if (campaign === undefined || busy !== undefined) return;
    const requested = campaign, current = generation, requestedRoute = campaignRunId;
    const ownsView = () => current === generation && requestedRoute === campaignRunId;
    const intent = `abandon:${requested.campaignRun.id}:${requested.campaignRun.revision}`;
    busy = intent;
    error = undefined;
    try {
      const abandoned = await campaigns.abandon(requested.campaignRun.id, requested.campaignRun.revision, commandFor(intent));
      if (!ownsView()) return;
      assertCampaignCommand(abandoned, requested, "campaign_abandoned");
      if (abandoned.campaign.campaignRun.status !== "abandoned") throw new Error("Invalid abandonment state");
      pending.delete(intent);
      confirmAbandon = false;
      campaign = abandoned.campaign;
      await readResult(abandoned.campaign, current);
    } catch (caught) {
      if (ownsView()) error = message(caught);
    } finally {
      if (ownsView()) busy = undefined;
    }
  }

  async function readResult(requested: CampaignProjection, current = generation): Promise<void> {
    if (resultLoading || (busy !== undefined && !busy.startsWith("abandon:"))) return;
    resultLoading = true;
    resultError = false;
    try {
      const next = await campaigns.result(requested.campaignRun.id);
      if (current !== generation || campaignRunId !== requested.campaignRun.id) return;
      if (next.campaign.campaignRun.id !== requested.campaignRun.id || next.campaign.campaignRun.documentDigest !== requested.campaignRun.documentDigest
        || next.campaign.campaignRun.status !== requested.campaignRun.status) throw new Error("Crossed campaign result");
      result = next;
    } catch {
      if (current !== generation || campaignRunId !== requested.campaignRun.id) return;
      resultError = true;
    } finally {
      if (current === generation && campaignRunId === requested.campaignRun.id) resultLoading = false;
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
    return undefined;
  }
</script>

<section class="campaign-view" aria-labelledby="campaign-title">
  {#if campaignRunId === undefined}
    <header>
      <p class="eyebrow">Campaign</p>
      <h1 id="campaign-title" tabindex="-1">Campaign</h1>
      <p class="honest">A campaign strings rehearsals into a map. Playing a node unlocks tools for this run; winning only adds a prestige mark. Every pack stays open in Play and the Library — nothing here is locked behind a campaign or sold.</p>
    </header>
    {#if loading}<p role="status">Loading campaigns…</p>{/if}
    {#if error && !preparing}<p role="alert">{error}</p>{/if}
    {#if loadFailed}
      <p>Your saved campaigns are unchanged. Retry to load them.</p>
      <button type="button" disabled={loading} onclick={retryLoad}>Retry loading campaigns</button>
    {/if}
    {#if savedRuns.length > 0}
      <section class="saved-campaigns" aria-labelledby="saved-campaigns-title">
        <h2 id="saved-campaigns-title">Continue your campaign</h2>
        <p class="honest">Your saved runs stay here even if the installed campaigns change. Opening a map does not start an encounter; missing content is explained on the map.</p>
        <div class="catalogue">
          {#each savedRuns as saved (saved.campaignRunId)}
            <article class="campaign-card" data-saved-campaign={saved.campaignRunId}>
              <h3>{saved.title}</h3>
              {#if saved.activeEncounter}<p>Encounter in progress: {saved.activeEncounter.title}</p>{/if}
              <p class="meta">Earned rewinds: {saved.chargeBalance} remaining this campaign</p>
              <button type="button" disabled={busy !== undefined} onclick={() => onNavigate(`/campaign/${encodeURIComponent(saved.campaignRunId)}`)}>Resume run</button>
            </article>
          {/each}
        </div>
      </section>
    {/if}
    <section class="installed-campaigns" aria-labelledby="installed-campaigns-title">
    <h2 id="installed-campaigns-title">Start a new campaign</h2>
    <p class="honest">Each campaign has one active run. Finish or abandon it before starting another run of that campaign.</p>
    <div class="catalogue">
      {#each catalogue as entry (`${entry.id}@${entry.version}`)}
        {@const saved = savedRuns.find(run => run.campaignId === entry.id)}
        <article class="campaign-card" data-campaign={entry.id}>
          <h3>{entry.title}</h3>
          <p class="meta">{entry.channel === "official" ? "Official" : "Community draft"} · {entry.nodeCount} nodes across three acts{entry.completedRuns > 0 ? ` · completed ${entry.completedRuns}×` : ""}</p>
          {#if entry.marks.length > 0}<p class="meta">Marks: {entry.marks.map((mark) => mark.startsWith("prestige") ? "Prestige" : "Completion").join(", ")}</p>{/if}
          {#if !entry.available}<p class="honest" id={`unavailable-${entry.id}`}>Unavailable here: {entry.unavailablePacks.join(", ")} not installed.</p>{/if}
          {#if saved}
            <p class="honest">Resume the saved run above. Finish or abandon it before starting another run of this campaign.</p>
          {:else if entry.activeRunId !== null}
            <p class="honest">An active run was reported when this catalogue was read. Refresh to check your saved campaigns.</p>
            <button type="button" disabled={loading || busy !== undefined} onclick={retryLoad}>Refresh campaigns</button>
          {:else}
            <button type="button" disabled={!entry.available || busy !== undefined} aria-describedby={!entry.available ? `unavailable-${entry.id}` : undefined} onclick={() => void begin(entry)}>
              {busy === `create:${entry.id}@${entry.version}` ? "Starting…" : "Start a run"}
            </button>
          {/if}
        </article>
      {:else}
        {#if !loading && !loadFailed}<p class="honest">No campaigns are installed here.</p>{/if}
      {/each}
    </div>
    </section>
  {:else if campaign}
    <header class="map-header">
      <div>
        <p class="eyebrow">Campaign · {campaign.campaignRun.channel === "official" ? "Official" : "Community draft"}</p>
        <h1 id="campaign-title" tabindex="-1">{campaign.campaignRun.title}</h1>
      </div>
      <p class="charges" data-testid="campaign-charges" aria-label={`Earned rewinds: ${campaign.charges.balance} remaining this campaign`}>
        <span aria-hidden="true">⟲ {campaign.charges.balance}</span>
        <span class="charges-copy">Earned rewinds: {campaign.charges.balance} remaining this campaign</span>
      </p>
    </header>
    {#if error && !preparing}<p role="alert">{error}</p>{/if}
    {#if resultError}
      <p role="alert">The campaign was {campaign.campaignRun.status === "completed" ? "completed" : "abandoned"}. Its result could not be loaded; the recorded campaign and encounters are kept.</p>
      <button type="button" disabled={busy !== undefined || resultLoading} onclick={() => void readResult(campaign!)}>Reload result</button>
    {/if}
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
              <CampaignEncounterHistory {campaigns} campaignRunId={campaign.campaignRun.id} nodeId={step.nodeId} runId={step.playRunId} campaignDocumentDigest={campaign.campaignRun.documentDigest} {onNavigate} /></li>
          {/each}
        </ol>
        {#if campaign.abandonedEncounter}
          <section class="abandoned-encounter" aria-labelledby="abandoned-encounter-title">
            <h3 id="abandoned-encounter-title">Unfinished encounter: {abandonedCard?.title ?? "Recorded attempt"}</h3>
            <p>This encounter was left unfinished when the campaign was abandoned. No seal or encounter reward was earned for this attempt.</p>
            <CampaignEncounterHistory {campaigns} campaignRunId={campaign.campaignRun.id} nodeId={campaign.abandonedEncounter.nodeId} runId={campaign.abandonedEncounter.playRunId} campaignDocumentDigest={campaign.campaignRun.documentDigest} abandoned {onNavigate} />
          </section>
        {/if}
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
                  {#if card.unavailable !== null}<p class="honest">{unavailableText(card)}</p>{/if}
                  {#if card.opponent}<p class="meta">Opponent: {campaignBotLabel(card.opponent.profileId)} · {card.rating === "unrated" ? "unrated" : "rated when clean"}</p>{/if}
                  <p>{rewardText(card.reward)}</p>
                  {#if card.suppress.length > 0}<p class="suppress">Sets aside: {card.suppress.map((id) => CAMPAIGN_MODULE_LABELS[id]).join(", ")}</p>{/if}
                  {#if card.seal !== null}
                    <p class="seal">{verdictText(card.seal)}</p>
                    <CampaignEncounterHistory {campaigns} campaignRunId={campaign.campaignRun.id} nodeId={card.nodeId} runId={card.seal.playRunId} campaignDocumentDigest={campaign.campaignRun.documentDigest} {onNavigate} />
                  {/if}
                  {#if card.active}
                    <button type="button" onclick={() => onNavigate(`/play/run/${encodeURIComponent(campaign!.activeEncounter!.playRunId)}`)}>Continue</button>
                  {:else if card.selectable}
                    <button type="button" disabled={busy !== undefined} onclick={(event) => prepare(card, event.currentTarget)}>Prepare</button>
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
            <li><label><input type="checkbox" checked={campaign.kit.equipped.includes(moduleId)} disabled={busy !== undefined || campaign.campaignRun.status !== "active"} onchange={(event) => { const input = event.currentTarget; void toggleEquip(moduleId, input.checked).then(() => { if (input.isConnected) input.checked = campaign?.kit.equipped.includes(moduleId) ?? false; }); }} /> {CAMPAIGN_MODULE_LABELS[moduleId]}</label></li>
          {/each}
        </ul>
      {/if}
    </section>

    {#if preparing}
      <CampaignPreparation {campaign} card={preparing} {busy} {error} {assistanceStorage} onEquip={toggleEquip} onStart={() => void startEncounter(preparing!)} onClose={() => void closePreparation()} />
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
    <h1 id="campaign-title" tabindex="-1">Campaign unavailable</h1>
    <p role="alert">{error}</p>
    {#if loadFailed}
      <p>Your saved campaign and encounters are unchanged. Retry to load this map.</p>
      <button type="button" disabled={loading} onclick={retryLoad}>Retry loading campaign</button>
    {/if}
  {/if}
</section>

<style>
  .campaign-view { height: 100%; overflow: auto; padding: clamp(1rem, 3vw, 2.5rem); max-width: 72rem; margin: 0 auto; box-sizing: border-box; }
  h1, h2, h3, p { margin-top: 0; }
  .eyebrow { color: var(--muted); font: 700 0.72rem/1.2 ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
  .honest, .meta { color: var(--muted); }
  .catalogue { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr)); gap: 1rem; }
  .saved-campaigns, .installed-campaigns { margin-top: 1.5rem; }
  .campaign-card h3, .campaign-card p { overflow-wrap: anywhere; }
  .campaign-card, .node-card, .resume, .result, .kit { padding: 1rem; border: 1px solid var(--line); border-radius: .8rem; background: var(--panel); min-width: 0; }
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
  .kit ul { padding-left: 1.2rem; }
  .row-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
  button { min-height: 2.75rem; padding: .55rem .9rem; border: 1px solid var(--line); border-radius: .6rem; background: var(--accent); color: var(--on-accent); font-weight: 700; cursor: pointer; }
  button:disabled { opacity: .55; cursor: not-allowed; }
  button.quiet { background: var(--paper); color: var(--ink); font-weight: 500; }
  .abandon { margin-top: 1.5rem; }
  .path { padding-left: 1.2rem; }
  .resume, .result { margin-top: 1rem; }
</style>
