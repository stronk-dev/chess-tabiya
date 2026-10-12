<script lang="ts">
  import { onMount } from "svelte";
  import { preferenceDisplayMode, presetDeclaration, renderSuppression, requestedModules, requestedPreset, selectNamedPreset, workflowContextPolicy, type PresetId } from "@chess-tabiya/runtime/client";
  import { loadWorkflowPreference, saveWorkflowPreference, workflowPreferenceKey, type PreferenceStorage } from "./assistance-preference.js";
  import { CAMPAIGN_MODULE_LABELS, campaignBotLabel, rewardText, type CampaignModuleId, type CampaignNodeCard, type CampaignProjection } from "./campaign-api.js";
  import { modalBoundary } from "./modal-boundary.js";
  import { offeredPresetChoices, unavailablePresetNotice } from "./preset-menu.js";

  interface Props {
    campaign: CampaignProjection;
    card: CampaignNodeCard;
    busy: string | undefined;
    error: string | undefined;
    onEquip: (id: CampaignModuleId, equipped: boolean) => Promise<void>;
    onStart: () => void;
    onClose: () => void;
    assistanceStorage?: PreferenceStorage | undefined;
  }
  let { campaign, card, busy, error, onEquip, onStart, onClose, assistanceStorage }: Props = $props();
  const policy = workflowContextPolicy("campaign");
  function preferenceStorage(): PreferenceStorage | undefined {
    if (assistanceStorage !== undefined) return assistanceStorage;
    if (import.meta.env.MODE === "test") return undefined;
    try { return globalThis.localStorage ?? undefined; } catch { return undefined; }
  }
  let preference = $state(loadWorkflowPreference("campaign", preferenceStorage()));
  let helpError = $state<string | undefined>();
  const selected = $derived(requestedPreset(preference, "campaign") ?? policy.defaultPreset);
  const isCustom = $derived(preferenceDisplayMode(preference, selected) === "custom");
  const helpLabel = $derived(isCustom ? "Custom" : presetDeclaration(selected).label);
  const requestedTools = $derived(requestedModules(preference, selected));

  function chooseHelp(select: HTMLSelectElement): void {
    const preset = select.value as PresetId;
    if (!policy.allowedPresets.includes(preset)) return;
    const next = selectNamedPreset("campaign", preference, preset);
    // The encounter loads this same canonical key after navigation. Do not display a choice
    // that only exists in this soon-to-be-destroyed preparation view when persistence refuses.
    if (saveWorkflowPreference("campaign", next, preferenceStorage())) {
      preference = next.intent;
      helpError = undefined;
    } else {
      helpError = "Could not save your help style. Your previous choice is still selected. Try again or start with it.";
      select.value = isCustom ? "custom" : selected;
    }
  }

  function refreshPreference(event: StorageEvent): void {
    if (event.key !== null && event.key !== workflowPreferenceKey("campaign")) return;
    preference = loadWorkflowPreference("campaign", preferenceStorage());
    helpError = undefined;
  }
  let heading: HTMLHeadingElement;
  onMount(() => heading.focus());

  function keydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
  }
</script>

<!-- Disabling the focused Start control can move browser focus to body. Escape still
     belongs to the mounted preparation workflow while its request is pending. -->
<svelte:window onkeydown={keydown} onstorage={refreshPreference} />

<div class="backdrop">
  <div class="preparation" role="dialog" aria-modal="true" aria-labelledby="prep-title" tabindex="-1" use:modalBoundary onkeydown={(event) => { event.stopPropagation(); keydown(event); }}>
    <header>
      <p class="eyebrow">Prepare encounter</p>
      <h2 id="prep-title" tabindex="-1" bind:this={heading}>{card.boss ? "Boss · " : ""}{card.title}</h2>
    </header>
    {#if card.objectiveSummary}<p>{card.objectiveSummary}</p>{/if}
    {#if card.opponent}<p>You play a full game from the authored start against {campaignBotLabel(card.opponent.profileId)}. Only the rules end it.</p>{/if}
    <p>{rewardText(card.reward)} — earned when you declare the encounter done, whatever the outcome.</p>
    {#if card.suppress.length > 0}
      <p class="suppression">This encounter sets aside: {card.suppress.map(id => CAMPAIGN_MODULE_LABELS[id]).join(", ")}. These tools stay in your kit.</p>
    {/if}
    <section aria-labelledby="prep-help-title">
      <h3 id="prep-help-title">How would you like help?</h3>
      <label class="help-style">Help style
        <select aria-label="Help style" value={isCustom ? "custom" : selected} disabled={busy !== undefined}
          aria-describedby={`prep-help-description prep-preset-availability${preference.kind === "invalid_fallback" ? " prep-help-recovery" : ""}${helpError ? " prep-help-error" : ""}`}
          onchange={(event) => chooseHelp(event.currentTarget)}>
          {#if isCustom}<option value="custom" disabled>Custom (from {presetDeclaration(selected).label})</option>{/if}
          {#each offeredPresetChoices("campaign") as preset}<option value={preset.id}>{preset.label}</option>{/each}
        </select>
      </label>
      <p id="prep-help-description" class="muted">{isCustom ? "Your individual help choices are kept. Choosing a style replaces Custom; individual lower limits still apply." : `Style requests: ${presetDeclaration(selected).promise}`}</p>
      <p id="prep-preset-availability" class="muted">{unavailablePresetNotice("campaign")}</p>
      <p class="muted">Help is confirmed when the encounter opens. Your individual limits, earned and equipped tools, encounter restrictions and available evidence still apply. Changing help style does not change your kit.</p>
      {#if preference.kind === "invalid_fallback"}<p id="prep-help-recovery" role="status">{renderSuppression({ kind: "preference_recovery", reason: preference.reason }, "campaign")}</p>{/if}
      {#if helpError}<p id="prep-help-error" role="alert">{helpError}</p>{/if}
    </section>
    <section aria-labelledby="prep-kit-title">
      <h3 id="prep-kit-title">Tools for this encounter</h3>
      <p class="muted">Your current kit. Equipping allows a tool; your help style and available evidence determine what appears during play.</p>
      <ul class="tools">
        {#each campaign.kit.owned as id (id)}
          {@const suppressed = card.suppress.includes(id)}
          <li>
            <label>
              <input type="checkbox" checked={campaign.kit.equipped.includes(id)} disabled={busy !== undefined || suppressed || campaign.campaignRun.status !== "active"} aria-describedby={`prep-tool-${id}`}
                onchange={(event) => {
                  const input = event.currentTarget;
                  void onEquip(id, input.checked).then(() => { if (input.isConnected) input.checked = campaign.kit.equipped.includes(id); });
                }} />
              <span>{CAMPAIGN_MODULE_LABELS[id]}</span>
            </label>
            <p id={`prep-tool-${id}`} class="muted">{suppressed ? "Set aside for this encounter, even if equipped." : !campaign.kit.equipped.includes(id) ? "Not equipped — select to equip." : !requestedTools.includes(id) ? `Not requested by ${helpLabel} — remains equipped.` : "Equipped"}</p>
          </li>
        {:else}
          <li>Legal moves only — no tools earned yet.</li>
        {/each}
      </ul>
    </section>
    <section aria-labelledby="prep-rewinds-title">
      <h3 id="prep-rewinds-title">Rehearse, then declare done</h3>
      <p>Rewinds and branches inside the encounter spend earned rewinds ({campaign.charges.balance} left). Comparing lines is free.</p>
      <p class="muted">Declare done seals your chosen line and keeps your attempts in history. Playing the encounter earns its reward; winning is not required.</p>
    </section>
    {#if error}<p role="alert">{error}</p>{/if}
    {#if busy?.startsWith("loadout:")}<p role="status">Saving your kit…</p>{/if}
    {#if busy?.startsWith("start:")}<p role="status">Starting… You can return to the map; an accepted encounter will remain available to continue.</p>{/if}
    <footer>
      <button type="button" disabled={busy !== undefined || !card.selectable} onclick={onStart}>{busy?.startsWith("start:") ? "Starting…" : "Start encounter"}</button>
      <button class="quiet" type="button" onclick={onClose}>Back to map</button>
    </footer>
  </div>
</div>

<style>
  .backdrop { position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; padding: 1rem; background: var(--scrim); }
  .preparation { box-sizing: border-box; width: min(40rem, 100%); min-width: 0; max-height: calc(100dvh - 2rem); overflow: auto; overscroll-behavior: contain; padding: clamp(1rem, 3vw, 1.5rem); border: 1px solid var(--line); border-radius: .8rem; background: var(--panel); color: var(--ink); overflow-wrap: anywhere; }
  h2, h3, p { margin-top: 0; }
  h2 { font-size: 1.4rem; }
  h3 { font-size: 1rem; margin-bottom: .5rem; }
  section { margin-top: 1.25rem; }
  .eyebrow { color: var(--muted); font: 700 .72rem/1.2 ui-monospace, monospace; text-transform: uppercase; letter-spacing: .08em; }
  .muted { color: var(--muted); }
  .suppression { padding: .75rem; border-left: 3px solid var(--warning, var(--line)); background: var(--paper); }
  .tools { list-style: none; padding: 0; }
  .tools li { padding: .5rem 0; border-bottom: 1px solid var(--line); }
  .tools label { display: flex; align-items: center; gap: .6rem; min-height: 2.75rem; cursor: pointer; }
  .tools input { flex: 0 0 auto; width: 1.25rem; height: 1.25rem; accent-color: var(--accent); }
  .tools p { margin: 0 0 .5rem 1.85rem; }
  .help-style { display: grid; gap: .4rem; margin-bottom: .65rem; }
  select { box-sizing: border-box; width: 100%; min-width: 0; min-height: 2.75rem; padding: .55rem; border: 1px solid var(--line); border-radius: .4rem; background: var(--paper); color: var(--ink); font: inherit; }
  footer { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: 1rem; }
  button { min-height: 2.75rem; padding: .55rem .9rem; border: 1px solid var(--line); border-radius: .6rem; background: var(--accent); color: var(--on-accent); font-weight: 700; cursor: pointer; }
  button:disabled { opacity: .55; cursor: not-allowed; }
  button.quiet { background: var(--paper); color: var(--ink); font-weight: 500; }
</style>
