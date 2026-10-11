<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import { ApiError } from "./api.js";
  import { MODULE_LABELS, type BrowserNarrowedAssistanceV1 } from "@chess-tabiya/runtime";
  import CampaignEncounterHistory from "./CampaignEncounterHistory.svelte";
  import {
    CAMPAIGN_MODULE_LABELS,
    CampaignApi,
    campaignEncounterResult,
    newCampaignCommandId,
    assertCampaignCommand,
    type CampaignProjection,
  } from "./campaign-api.js";

  // rfc/campaign-core.md §7.1 "In-run context": the campaign rail seat beside the board. It renders
  // the node title, `⟲ N` BEFORE any spend (criterion 4), the effective kit and "Declare done". It
  // never inserts content between the board and its controls and never resizes the board.

  interface Props {
    campaigns: CampaignApi;
    origin: { readonly campaignRunId: string; readonly nodeId: string };
    runId: string;
    branchId: string;
    /** Bumps whenever the play run changes, so a settled charge re-reads the balance. */
    runRevision: number;
    assistance?: BrowserNarrowedAssistanceV1 | undefined;
    assistanceState?: "pending" | "ready" | "unavailable" | undefined;
    onNavigate: (path: string) => void;
    /** Publishes the campaign revision the charged gestures must carry (null when not active). */
    onRevision: (state: { readonly campaignRevision: number; readonly active: boolean } | null) => void;
  }
  let { campaigns, origin, runId, branchId, runRevision, assistance, assistanceState = "pending", onNavigate, onRevision }: Props = $props();

  let campaign: CampaignProjection | undefined = $state();
  let error: string | undefined = $state();
  let readError: string | undefined = $state();
  let reading = $state(false);
  let title: HTMLElement | undefined = $state();
  let readNotice: HTMLParagraphElement | undefined = $state();
  let busy = $state(false);
  let sealed: ReturnType<typeof campaignEncounterResult> = $state();
  let submission: { campaign: CampaignProjection; campaignRunId: string; nodeId: string; input: { runId: string; branchId: string; expectedRevision: number; commandId: string } } | undefined;
  let generation = 0;
  let readGeneration = 0;
  let subject: string | undefined;

  let active = $derived(campaign?.activeEncounter?.playRunId === runId && campaign.activeEncounter.nodeId === origin.nodeId);
  let nodeTitle = $derived(campaign?.acts.flatMap((act) => act.layers.flatMap((layer) => layer.choices)).find((card) => card.nodeId === origin.nodeId)?.title ?? origin.nodeId);
  let suppressed = $derived(campaign?.acts.flatMap((act) => act.layers.flatMap((layer) => layer.choices)).find((card) => card.nodeId === origin.nodeId)?.suppress ?? []);
  let confirmedHelp = $derived(assistanceState === "ready" && assistance?.context === "campaign" && assistance.campaignReceipt !== undefined ? assistance : undefined);

  $effect(() => {
    void runRevision;
    const nextSubject = JSON.stringify([origin.campaignRunId, origin.nodeId, runId, branchId]);
    untrack(() => {
      if (subject !== nextSubject) {
        subject = nextSubject;
        generation++;
        campaign = undefined;
        sealed = undefined;
        submission = undefined;
        busy = false;
        error = undefined;
        readError = undefined;
      }
      void refresh();
    });
  });
  onMount(() => () => { generation++; readGeneration++; });

  function ownsView(current: number, requestedSubject: string | undefined): boolean {
    return current === generation && requestedSubject === JSON.stringify([origin.campaignRunId, origin.nodeId, runId, branchId]);
  }

  async function refresh(invoker?: HTMLElement): Promise<void> {
    const current = generation, requestedSubject = subject, request = ++readGeneration;
    const requestedId = origin.campaignRunId;
    // Disabling the retry button can move native focus to body before the response arrives.
    // Remember the invoking focus, but retire it if the learner focuses another control.
    let ownsFocus = invoker !== undefined && document.activeElement === invoker;
    const focusChanged = (event: FocusEvent): void => {
      if (event.target !== invoker && event.target !== document.body) ownsFocus = false;
    };
    if (ownsFocus) document.addEventListener("focusin", focusChanged);
    reading = true;
    readError = undefined;
    // A retained map is useful context, not authority for another charged or seal command.
    onRevision(null);
    try {
      const next = await campaigns.read(requestedId);
      if (!ownsView(current, requestedSubject) || request !== readGeneration) return;
      if (next.campaignRun.id !== requestedId || (campaign !== undefined && next.campaignRun.documentDigest !== campaign.campaignRun.documentDigest)) throw new Error("Crossed campaign read");
      const result = campaignEncounterResult(next, origin.nodeId, runId);
      campaign = next;
      sealed = result;
      if (result !== undefined) { submission = undefined; error = undefined; }
      onRevision(next.activeEncounter?.playRunId === runId && next.activeEncounter.nodeId === origin.nodeId ? { campaignRevision: next.campaignRun.revision, active: true } : null);
      if (ownsFocus) {
        await tick();
        if (ownsFocus && ownsView(current, requestedSubject) && request === readGeneration && (document.activeElement === invoker || document.activeElement === document.body)) title?.focus();
      }
    } catch (caught) {
      if (ownsView(current, requestedSubject) && request === readGeneration) {
        readError = caught instanceof ApiError ? caught.message : "Campaign state could not be loaded.";
        if (ownsFocus) {
          await tick();
          if (ownsFocus && ownsView(current, requestedSubject) && request === readGeneration && (document.activeElement === invoker || document.activeElement === document.body)) readNotice?.focus();
        }
      }
    } finally {
      document.removeEventListener("focusin", focusChanged);
      if (ownsView(current, requestedSubject) && request === readGeneration) reading = false;
    }
  }

  function retryRead(): void {
    if (reading || busy) return;
    void refresh(document.activeElement instanceof HTMLElement ? document.activeElement : undefined);
  }

  export function declareError(): string | undefined {
    return readError ?? error;
  }

  export async function declareDone(): Promise<boolean> {
    if (busy || reading || readError !== undefined || campaign === undefined) return false;
    if (sealed !== undefined) return true;
    if (!active && submission === undefined) return false;
    const current = generation, requestedSubject = subject;
    busy = true;
    error = undefined;
    submission ??= { campaign, campaignRunId: origin.campaignRunId, nodeId: origin.nodeId, input: { runId, branchId, expectedRevision: campaign.campaignRun.revision, commandId: newCampaignCommandId() } };
    const requested = submission;
    try {
      const done = await campaigns.submit(requested.campaignRunId, requested.nodeId, requested.input);
      if (!ownsView(current, requestedSubject)) return false;
      const originalCard = requested.campaign.acts.flatMap(act => act.layers.flatMap(layer => layer.choices)).find(card => card.nodeId === requested.nodeId);
      assertCampaignCommand(done, requested.campaign, originalCard?.kind === "boss_game" ? "boss_game_committed" : "node_committed");
      const card = done.campaign.acts.flatMap(act => act.layers.flatMap(layer => layer.choices)).find(card => card.nodeId === requested.nodeId);
      if (done.result.response?.nodeId !== requested.nodeId || card?.seal == null || card.seal.kind !== originalCard?.kind || card.seal.playRunId !== requested.input.runId) throw new Error("Crossed encounter seal");
      const result = campaignEncounterResult(done.campaign, requested.nodeId, requested.input.runId);
      if (result === undefined) throw new Error("Missing encounter result");
      readGeneration++;
      reading = false;
      readError = undefined;
      submission = undefined;
      sealed = result;
      campaign = done.campaign;
      onRevision(null);
      return true;
    } catch (caught) {
      if (!ownsView(current, requestedSubject)) return false;
      error = caught instanceof ApiError ? caught.message : "The encounter could not be declared done. Try again.";
      if (caught instanceof ApiError && caught.code === "CAMPAIGN_REVISION_STALE") { submission = undefined; await refresh(); }
    } finally {
      if (ownsView(current, requestedSubject)) busy = false;
    }
    return false;
  }
</script>

<aside class="session-banner campaign-strip" aria-label="Campaign encounter">
  {#if sealed}
    <div class="node-result" role="status">
      <strong class="encounter-title" tabindex="-1" bind:this={title}>{sealed.title}: {sealed.verdict}</strong>
      <p>This choice is sealed. Your recorded attempts are kept; continue on the map.</p>
      <p>{sealed.actIncome} earned {sealed.actIncome === 1 ? "rewind" : "rewinds"} for finishing this encounter in {sealed.act}, win or lose.</p>
      {#if sealed.resourceIncome > 0}<p>{sealed.resourceIncome} earned {sealed.resourceIncome === 1 ? "rewind" : "rewinds"} from this encounter’s reward.</p>{/if}
      {#if sealed.reward}<p>{sealed.reward}.</p>{/if}
      {#if sealed.reward === undefined && sealed.resourceIncome === 0}<p>No additional encounter reward.</p>{/if}
      <p>Current campaign balance: {sealed.balance} earned {sealed.balance === 1 ? "rewind" : "rewinds"}.</p>
      {#if sealed.endedRestrictions.length > 0}<p>This encounter’s restriction ended for: {sealed.endedRestrictions.join(", ")}.</p>{/if}
      <div class="result-kit">
        <strong>Your current campaign kit</strong>
        {#if sealed.tools.length > 0}
          <ul>{#each sealed.tools as tool (tool.label)}<li>{tool.label} — {tool.equipped ? "equipped" : "not equipped"}</li>{/each}</ul>
        {:else}<p>No tools earned yet.</p>{/if}
        <p>Your help style, the next encounter and available evidence still determine what appears. Change equipment on the map.</p>
      </div>
      {#if sealed.completed}<span>The campaign run is complete.</span>{/if}
    </div>
    <div class="row-actions">
      <button type="button" onclick={() => onNavigate(`/campaign/${encodeURIComponent(origin.campaignRunId)}`)}>{sealed.completed ? "See the run result" : "Continue to the map"}</button>
      {#if campaign}<CampaignEncounterHistory {campaigns} campaignRunId={origin.campaignRunId} nodeId={origin.nodeId} {runId} campaignDocumentDigest={campaign.campaignRun.documentDigest} {onNavigate} />{/if}
    </div>
  {:else if campaign}
    <strong class="encounter-title" tabindex="-1" bind:this={title}>Campaign · {nodeTitle}</strong>
    <span class="charges" data-testid="campaign-strip-charges" aria-label={`Earned rewinds: ${campaign.charges.balance} remaining this campaign`}><span aria-hidden="true">⟲ {campaign.charges.balance}</span> Earned rewinds: {campaign.charges.balance} remaining this campaign</span>
    {#if active}
      <span class="kit" data-testid="campaign-encounter-help" role="status">
        {#if confirmedHelp !== undefined}
          Help for this encounter: {confirmedHelp.modules.filter(id => id !== "rules_floor").map(id => CAMPAIGN_MODULE_LABELS[id as keyof typeof CAMPAIGN_MODULE_LABELS] ?? MODULE_LABELS[id]).join(", ") || "legal moves only"}.
          {suppressed.length ? ` Set aside: ${suppressed.map(id => CAMPAIGN_MODULE_LABELS[id]).join(", ")}.` : ""}
          Feedback still needs available evidence. Equipment changes on the map apply to your next encounter.
        {:else if assistanceState === "pending"}
          Confirming help for this encounter. Legal moves stay visible meanwhile.
        {:else}
          Help could not be confirmed. Only legal moves are shown; retry confirming help in Support style.
        {/if}
      </span>
      <div class="row-actions">
        <button type="button" disabled={busy || reading || readError !== undefined} aria-describedby={reading || readError !== undefined ? "campaign-strip-read" : undefined} onclick={() => void declareDone()}>{busy ? "Declaring…" : "Declare done"}</button>
        <button type="button" class="quiet" onclick={() => onNavigate(`/campaign/${encodeURIComponent(origin.campaignRunId)}`)}>Map</button>
      </div>
    {:else}
      <span>This run was a campaign encounter.</span>
      <button type="button" class="quiet" onclick={() => onNavigate(`/campaign/${encodeURIComponent(origin.campaignRunId)}`)}>Open the campaign map</button>
    {/if}
  {/if}
  {#if reading}<p id="campaign-strip-read" role="status">Loading encounter state. Campaign commands are paused until this read finishes.</p>{/if}
  {#if readError !== undefined}
    <p id="campaign-strip-read" role="alert" tabindex="-1" bind:this={readNotice}>{readError} This read has not changed your encounter; reload its state before using campaign commands.</p>
  {/if}
  {#if reading || readError !== undefined}
    <button type="button" disabled={reading || busy} onclick={retryRead}>{reading ? "Reloading encounter…" : "Retry loading encounter"}</button>
  {/if}
  {#if error}<p role="alert">{error}</p>{/if}
</aside>

<style>
  .campaign-strip { display: flex; flex-wrap: wrap; gap: .5rem 1rem; align-items: center; }
  .campaign-strip .charges { font-variant-numeric: tabular-nums; }
  .campaign-strip .kit { color: var(--muted); }
  .node-result { display: grid; gap: .4rem; min-width: 0; flex-basis: 100%; overflow-wrap: anywhere; }
  .node-result p { margin: 0; }
  .result-kit { padding: .6rem; border: 1px solid var(--line); border-radius: .4rem; }
  .result-kit ul { margin: .4rem 0; padding-left: 1.25rem; }
  .row-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
</style>
