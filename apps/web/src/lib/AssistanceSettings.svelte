<script lang="ts">
  import { ASSISTANCE_PREFERENCE_FIELDS, CONFIGURABLE_MODULE_IDS, MODULE_LABELS, permittedAssistance, preferenceDisplayMode, presetDeclaration, requestedModules, requestedPreset, selectNamedPreset, setPreferenceField, setPreferenceModule, workflowContextPolicy, type AssistanceConfig, type AssistancePermission, type ConfigurableModuleId, type PresetId, type WorkflowPreferenceReceipt, type WorkflowPreferenceV2 } from "@chess-tabiya/runtime";
  import { onDestroy, onMount } from "svelte";

  import type { AccountExportProgress, AccountImportReceipt, AccountInventory, Capabilities, DeletionEffect, DeletionPreview, Learner } from "./api.js";
  import AccountImportPanel from "./AccountImportPanel.svelte";
  import AccountInventoryPanel from "./AccountInventoryPanel.svelte";
  import { formatBytes } from "./account-inventory-copy.js";
  import { ASSISTANCE_PROFILES, loadWorkflowPreference, requestedAssistanceConfig, saveWorkflowPreference, type AssistanceProfile } from "./assistance-preference.js";
  import AssistanceControlFields from "./AssistanceControlFields.svelte";
  import { operationConfigured, operationNotice, providerInspectorRows, providerRows } from "./provider-availability.js";
  import StatusAnnouncement from "./StatusAnnouncement.svelte";
  import { assertAccountDeletionPreview } from "./account-deletion-preview.js";

  interface Props {
    capabilities?: Capabilities | undefined;
    learner?: Learner | undefined;
    onSignOut: () => void | Promise<void>;
    onExport: (password: string, onProgress?: (progress: AccountExportProgress) => void) => void | Promise<void>;
    onDelete: (password: string, previewDigest: string) => void | Promise<void>;
    loadDeletionPreview?: () => Promise<DeletionPreview>;
    loadAccountInventory?: (() => Promise<AccountInventory>) | undefined;
    previewAccountImport?: ((bundle: unknown) => Promise<AccountImportReceipt>) | undefined;
    commitAccountImport?: ((password: string, bundle: unknown) => Promise<AccountImportReceipt>) | undefined;
    plannedSurfaceIds?: readonly string[];
  }

  let { capabilities, learner, onSignOut, onExport, onDelete, loadDeletionPreview, loadAccountInventory, previewAccountImport, commitAccountImport, plannedSurfaceIds = [] }: Props = $props();
  let exportProgress = $state<AccountExportProgress | undefined>();
  let inventoryVersion = $state(0);
  const labels: Record<AssistanceProfile, string> = { pack: "Curated drill", position: "Just Play", imported: "Imported game", match: "Match / Arena", stream: "Streamed session", academy: "Academy", onramp: "On-ramp", campaign: "Campaign" };
  let receipts: Record<AssistanceProfile, WorkflowPreferenceReceipt> = $state(Object.fromEntries(ASSISTANCE_PROFILES.map((profile) => [profile, loadWorkflowPreference(profile, storage())])) as Record<AssistanceProfile, WorkflowPreferenceReceipt>);
  let unsaved = $state(false);
  let password = $state("");
  let exportPassword = $state("");
  let exportMessage = $state<string | undefined>();
  let exportError = $state<string | undefined>();
  let exportBusy = $state(false);
  let deleteError = $state<string | undefined>();
  let deleteBusy = $state(false);
  let deletionPreview = $state<DeletionPreview | undefined>();
  let previewLoading = $state(false);
  let previewError = $state<string | undefined>();
  let signOutBusy = $state(false);
  let signOutError = $state<string | undefined>();
  let previewRequest = 0;
  let exportRequest = 0;
  let deleteRequest = 0;
  let signOutRequest = 0;
  let mounted = true;
  const surfaceLabels: Readonly<Record<keyof Capabilities["surfaces"], string>> = Object.freeze({
    play: "Rehearsals",
    review: "Review and import",
    learn: "Learning plans",
    live: "Live sessions",
    create: "Authoring",
    justPlay: "Just Play",
    fromPosition: "Start from a position",
  });

  onMount(() => {
    if (learner !== undefined && loadDeletionPreview !== undefined) void previewDeletion();
  });

  function storage(): Storage | undefined { try { return globalThis.localStorage; } catch { return undefined; } }
  function profilePermissions(kind: AssistanceProfile): Readonly<Record<keyof Omit<AssistanceConfig, "version">, AssistancePermission>> {
    return permittedAssistance({
      workflowContext: kind,
      deliveryOpen: true,
      role: kind === "match" ? "participant" : "solo",
      seatedInContest: kind === "match",
      reviewing: kind === "imported",
    });
  }
  function profileRefusal(kind: AssistanceProfile): string | undefined {
    return workflowContextPolicy(kind).moduleCeiling.length === 1
      ? "Match play permits legal board interaction only. These saved support preferences do not apply during a match."
      : undefined;
  }
  // rfc/intent-presets.md §7: the ordinary view is the per-context help style; the nine raw
  // switches and the module include/exclude list stay reachable under Advanced.
  function commit(kind: AssistanceProfile, next: WorkflowPreferenceV2): void {
    receipts = { ...receipts, [kind]: next.intent };
    unsaved = !saveWorkflowPreference(kind, next, storage());
  }
  function choosePreset(kind: AssistanceProfile, preset: PresetId): void {
    commit(kind, selectNamedPreset(kind, receipts[kind], preset));
  }
  function set(kind: AssistanceProfile, value: AssistanceConfig): void {
    const current = requestedAssistanceConfig(kind, receipts[kind]);
    let receipt = receipts[kind];
    let next: WorkflowPreferenceV2 | undefined;
    for (const field of ASSISTANCE_PREFERENCE_FIELDS) {
      if (value[field] === current[field]) continue;
      next = setPreferenceField(kind, receipt, field, value[field]);
      receipt = next.intent;
    }
    if (next !== undefined) commit(kind, next);
  }
  function setModule(kind: AssistanceProfile, moduleId: ConfigurableModuleId, enabled: boolean): void {
    commit(kind, setPreferenceModule(kind, receipts[kind], moduleId, enabled));
  }
  function activePreset(kind: AssistanceProfile): PresetId {
    return requestedPreset(receipts[kind], kind) ?? workflowContextPolicy(kind).defaultPreset;
  }
  function custom(kind: AssistanceProfile): boolean {
    return preferenceDisplayMode(receipts[kind], activePreset(kind)) === "custom";
  }
  async function removeAccount(): Promise<void> {
    if (deleteBusy) return;
    deleteError = undefined;
    if (deletionPreview === undefined) { deleteError = "Review what will happen before deleting the account."; return; }
    if (password.length === 0) { deleteError = "Re-enter your password before deleting the account."; return; }
    const request = ++deleteRequest;
    const submittedPassword = password;
    const previewDigest = deletionPreview.digest;
    deleteBusy = true;
    try {
      await onDelete(submittedPassword, previewDigest);
      if (mounted && request === deleteRequest && password === submittedPassword) password = "";
    } catch {
      if (mounted && request === deleteRequest) deleteError = "Your account could not be deleted. Nothing was changed; review the summary and try again.";
    } finally {
      if (mounted && request === deleteRequest) deleteBusy = false;
    }
  }
  async function previewDeletion(): Promise<void> {
    if (previewLoading || deleteBusy) return;
    const request = ++previewRequest;
    previewLoading = true;
    previewError = undefined;
    deletionPreview = undefined;
    try {
      if (loadDeletionPreview === undefined) throw new Error("Deletion preview is unavailable.");
      const preview = await loadDeletionPreview();
      assertAccountDeletionPreview(preview);
      if (mounted && request === previewRequest) deletionPreview = preview;
    } catch {
      if (mounted && request === previewRequest) previewError = "Your data summary could not be loaded. Nothing was changed; try again.";
    } finally {
      if (mounted && request === previewRequest) previewLoading = false;
    }
  }
  function effectCount(groups: readonly DeletionEffect[]): number { return groups.reduce((total, effect) => total + effect.count, 0); }
  function records(count: number): string { return `${count} ${count === 1 ? "record" : "records"}`; }
  function surfaceState(id: keyof Capabilities["surfaces"], value: Capabilities["surfaces"][keyof Capabilities["surfaces"]]): string {
    if (plannedSurfaceIds.includes(id)) return "Coming later";
    return value === "available" ? "Available" : "Not available on this server";
  }
  async function downloadAccount(): Promise<void> {
    if (exportBusy) return;
    exportMessage = undefined;
    exportError = undefined;
    if (exportPassword.length === 0) { exportMessage = "Re-enter your password to download your data."; return; }
    const request = ++exportRequest;
    const submittedPassword = exportPassword;
    exportPassword = "";
    exportBusy = true;
    exportProgress = undefined;
    try {
      await onExport(submittedPassword, (progress) => { if (mounted && request === exportRequest) exportProgress = progress; });
      if (mounted && request === exportRequest) exportMessage = "Your account data download has started.";
    } catch {
      if (mounted && request === exportRequest) exportError = "Your account download could not be prepared. Re-enter your password and try again.";
    } finally {
      if (mounted && request === exportRequest) { exportBusy = false; exportProgress = undefined; }
    }
  }

  function progressText(progress: AccountExportProgress): string {
    return progress.totalBytes === null
      ? `Downloaded ${formatBytes(progress.receivedBytes)}`
      : `Downloaded ${formatBytes(progress.receivedBytes)} of ${formatBytes(progress.totalBytes)}`;
  }

  function accountImported(): void {
    inventoryVersion += 1;
    if (loadDeletionPreview !== undefined) void previewDeletion();
  }

  async function signOut(): Promise<void> {
    if (signOutBusy) return;
    const request = ++signOutRequest;
    signOutBusy = true;
    signOutError = undefined;
    try { await onSignOut(); }
    catch { if (mounted && request === signOutRequest) signOutError = "You could not be signed out. Your session is unchanged; try again."; }
    finally { if (mounted && request === signOutRequest) signOutBusy = false; }
  }

  onDestroy(() => {
    mounted = false;
    previewRequest += 1;
    exportRequest += 1;
    deleteRequest += 1;
    signOutRequest += 1;
  });
</script>

<section id="playing-settings" aria-labelledby="assistance-settings-title">
  <h2 id="assistance-settings-title">Playing</h2>
  <p class="honest">Saved in this browser only. Deployment providers are controlled by the server environment.</p>
  {#if unsaved}<p class="honest" role="status">This browser is not saving help settings, so these choices last only until you leave.</p>{/if}
  <div class="context-grid">
    {#each ASSISTANCE_PROFILES as kind}
      {@const refusal = profileRefusal(kind)}
      {@const permissions = profilePermissions(kind)}
      {@const policy = workflowContextPolicy(kind)}
      {@const selected = activePreset(kind)}
      {@const isCustom = custom(kind)}
      {@const modules = requestedModules(receipts[kind], selected)}
      <fieldset data-assistance-context={kind}>
        <legend>{labels[kind]}</legend>
        {#if refusal}<p id={`assistance-profile-refusal-${kind}`} class="honest">{refusal}</p>{/if}
        {#if kind === "campaign"}<p class="honest">Campaign encounters are not separate yet; this choice is kept for when they are.</p>{/if}
        <label>Help style
          <select value={isCustom ? "custom" : selected} disabled={refusal !== undefined} aria-describedby={refusal ? `assistance-profile-refusal-${kind}` : undefined} onchange={(event) => choosePreset(kind, event.currentTarget.value as PresetId)}>
            {#if isCustom}<option value="custom" disabled aria-describedby={`custom-help-${kind}`}>Custom (from {presetDeclaration(selected).label})</option>{/if}
            {#each policy.allowedPresets as preset}<option value={preset}>{presetDeclaration(preset).label}</option>{/each}
          </select>
        </label>
        <p id={`custom-help-${kind}`} class="honest">{isCustom ? "Custom help. Choosing a style replaces it." : presetDeclaration(selected).promise}</p>
        <details class="advanced-assistance">
          <summary>Advanced</summary>
          <AssistanceControlFields
            config={requestedAssistanceConfig(kind, receipts[kind])}
            {permissions}
            {capabilities}
            disabled={refusal !== undefined}
            describedBy={refusal ? `assistance-profile-refusal-${kind}` : undefined}
            externalVoiceReasonId="external-voice-unavailable"
            onChange={(value) => set(kind, value)}
          />
          <fieldset class="module-toggles">
            <legend>Help modules</legend>
            <p id={`module-ceiling-${kind}`} class="honest">Modules this workflow never shows stay unavailable; legal moves always stay.</p>
            {#each CONFIGURABLE_MODULE_IDS as moduleId (moduleId)}
              {@const admitted = policy.moduleCeiling.includes(moduleId)}
              <label><span><input type="checkbox" checked={modules.includes(moduleId)} disabled={!admitted || refusal !== undefined} aria-describedby={refusal ? `assistance-profile-refusal-${kind}` : admitted ? undefined : `module-ceiling-${kind}`} onchange={(event) => setModule(kind, moduleId, event.currentTarget.checked)} /> {MODULE_LABELS[moduleId]}</span></label>
            {/each}
          </fieldset>
        </details>
      </fieldset>
    {/each}
  </div>
</section>

{#if learner}
<section id="account-settings" aria-labelledby="account-settings-title">
  <h2 id="account-settings-title">Account</h2><p>Signed in as <strong>@{learner.handle}</strong>.</p>
  <button type="button" disabled={signOutBusy} aria-describedby={signOutBusy ? "account-signout-busy" : undefined} onclick={() => void signOut()}>{signOutBusy ? "Signing out…" : "Sign out"}</button>
  {#if signOutBusy}<p id="account-signout-busy" role="status">Ending this account session…</p>{/if}
  {#if signOutError}<p role="alert">{signOutError}</p>{/if}
  <section class="data-summary" aria-labelledby="account-data-title">
    <h3 id="account-data-title">Your data and privacy</h3>
    <p class="honest">This is a read-only summary of account data in this deployment. Loading or refreshing it does not start deletion.</p>
    {#if previewLoading}
      <p role="status">Loading your data summary…</p>
    {:else if previewError}
      <p role="alert">{previewError}</p><button type="button" onclick={() => void previewDeletion()}>Try loading again</button>
    {:else if deletionPreview}
      <div class="deletion-preview">
        <StatusAnnouncement message={`Account data summary loaded. ${records(effectCount(deletionPreview.hardDelete))} would be permanently deleted. ${records(effectCount(deletionPreview.tombstone))} would remain read-only as shared history. ${records(effectCount(deletionPreview.revoke))} would have access revoked. ${records(effectCount(deletionPreview.retainedPublished))} would remain as published work.`} />
        {#if effectCount(deletionPreview.hardDelete) > 0}<h4>Private account data</h4><ul>{#each deletionPreview.hardDelete as effect}<li>{effect.label} ({effect.count})</li>{/each}</ul>{/if}
        {#if effectCount(deletionPreview.tombstone) > 0}<h4>Shared history</h4><ul>{#each deletionPreview.tombstone as effect}<li>{effect.label}</li>{/each}</ul>{/if}
        {#if effectCount(deletionPreview.revoke) > 0}<h4>Revocable access</h4><ul>{#each deletionPreview.revoke as effect}<li>{effect.label} ({effect.count})</li>{/each}</ul>{/if}
        {#if effectCount(deletionPreview.retainedPublished) > 0}<h4>Published work</h4><ul>{#each deletionPreview.retainedPublished as effect}<li>{effect.label}</li>{/each}</ul>{/if}
        <p class="honest">{deletionPreview.backupNotice}</p>
        <button type="button" disabled={previewLoading || deleteBusy} aria-describedby={previewLoading ? "account-preview-busy" : deleteBusy ? "account-delete-busy" : undefined} onclick={() => void previewDeletion()}>Refresh data summary</button>
      </div>
    {:else}<p>This deployment cannot provide an account data summary.</p>{/if}
    {#if loadAccountInventory}
      {#key inventoryVersion}<AccountInventoryPanel loadInventory={loadAccountInventory} />{/key}
    {/if}
  </section>
  <form onsubmit={(event) => { event.preventDefault(); void downloadAccount(); }}>
    <h3>Download my data</h3>
    <p class="honest">A portable copy of your runs, progress, authored drafts, publications, and account-scoped activity. Passwords, sessions, provider credentials, and preferences stored only on this device are excluded.</p>
    <p class="honest">This Tabiya account archive is for safekeeping, inspection and moving your private records into another Tabiya account; other chess products do not read it. To move games between chess tools, <a href="/library">download them as PGN</a>.</p>
    <label>Current password <input type="password" autocomplete="current-password" bind:value={exportPassword} /></label>
    <button type="submit" disabled={exportBusy} aria-describedby={exportBusy ? "account-export-busy" : undefined}>{exportBusy ? "Preparing download…" : "Download my data"}</button>
    {#if exportBusy}<p id="account-export-busy" role="status">Preparing one private account archive.</p>{/if}
    {#if exportBusy && exportProgress}
      <progress class="export-progress" max={exportProgress.totalBytes ?? undefined} value={exportProgress.receivedBytes} aria-label="Account download progress">{progressText(exportProgress)}</progress>
      <p class="honest">{progressText(exportProgress)}</p>
    {/if}
    {#if exportMessage}<p role="status">{exportMessage}</p>{/if}
    {#if exportError}<p role="alert">{exportError}</p>{/if}
  </form>
  {#if previewAccountImport && commitAccountImport}
    <AccountImportPanel previewImport={previewAccountImport} commitImport={commitAccountImport} onImported={accountImported} />
  {/if}
  <form onsubmit={(event) => { event.preventDefault(); void removeAccount(); }}>
    <h3>Delete account</h3>
    {#if deletionPreview === undefined}
      <p>Load the data summary above before deleting the account.</p>
      <button type="button" disabled={previewLoading || deleteBusy} aria-describedby={previewLoading ? "account-preview-busy" : deleteBusy ? "account-delete-busy" : undefined} onclick={() => void previewDeletion()}>{previewLoading ? "Loading data summary…" : "Load data summary"}</button>
    {:else}
    <p>The current data summary above is the deletion preview. Refresh it if your account changed since this page opened.</p>
    <label>Re-enter password <input type="password" autocomplete="current-password" bind:value={password} /></label>
    <button type="submit" disabled={deleteBusy || previewLoading} aria-describedby={deleteBusy ? "account-delete-busy" : previewLoading ? "account-preview-busy" : undefined}>{deleteBusy ? "Deleting account…" : "Delete account"}</button>
    {#if deleteBusy}<p id="account-delete-busy" role="status">Deleting this account and ending its sessions…</p>{/if}
    <p class="honest">This browser's sign-in and play preferences are cleared after deletion. Other devices may keep old display preferences, but you will be signed out everywhere.</p>
    {/if}
    {#if deleteError}<p role="alert">{deleteError}</p>{/if}
  </form>
  {#if previewLoading}<span id="account-preview-busy" class="visually-hidden">Loading the current account data summary.</span>{/if}
</section>
{/if}

<section id="about-deployment" aria-labelledby="about-deployment-title">
  <h2 id="about-deployment-title">About this deployment</h2>
  {#if capabilities}
    <h3>Available services</h3><dl id="deployment-services">{#each providerRows(capabilities) as row (row.id)}<div data-provider={row.id}><dt>{row.label}</dt><dd>{row.state}</dd></div>{/each}</dl>
    <h3>App areas</h3><ul>{#each Object.entries(capabilities.surfaces) as [id, availability]}<li><strong>{surfaceLabels[id as keyof Capabilities["surfaces"]]}</strong>: {surfaceState(id as keyof Capabilities["surfaces"], availability as Capabilities["surfaces"][keyof Capabilities["surfaces"]])}</li>{/each}</ul>
    <details class="technical-details"><summary>Technical details</summary><p>Run format {capabilities.runSchemaVersion}</p><p>Opponent policies: {capabilities.policyModes.join(", ")}</p><p>Provider snapshot {capabilities.providerHealth.generatedAt}</p><dl>{#each providerInspectorRows(capabilities) as row (row.id)}<div><dt>{row.id}</dt><dd>{row.detail}</dd></div>{/each}</dl></details>
  {:else}<p>Deployment status is unavailable.</p>{/if}
  {#if !operationConfigured(capabilities, "render.voice")}<p class="honest" id="external-voice-unavailable">External voice is unavailable because this deployment has no configured provider.</p>{:else if !operationNotice(capabilities, "render.voice").requestable}<p class="honest" id="external-voice-unavailable">{operationNotice(capabilities, "render.voice").reason} Written guidance stays grounded and unchanged.</p>{/if}
  <p class="honest">These are status facts, not account controls. Whoever runs this Tabiya server chooses which optional services are available.</p>
</section>

<style>
  section{margin:2rem 0}.data-summary{max-width:44rem;padding:1rem;border:1px solid var(--line);border-radius:.8rem;background:var(--panel)}.data-summary h4{margin-bottom:.35rem}.data-summary ul{margin-top:0}.context-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem}fieldset{display:grid;gap:.65rem;padding:1rem;border:1px solid var(--line);border-radius:.8rem;background:var(--panel)}label{display:grid;gap:.25rem}dl{display:flex;flex-wrap:wrap;gap:.5rem 1rem}dl div{display:grid}.technical-details{margin-top:1rem}.technical-details summary{cursor:pointer;font-weight:700}.honest{color:var(--muted);font-size:.8rem}.advanced-assistance{display:grid;gap:.5rem}.advanced-assistance summary{cursor:pointer;font-weight:700}.module-toggles{padding:.6rem}form{display:grid;gap:.6rem;max-width:28rem;margin-top:1rem}@media(max-width:719px){.context-grid{grid-template-columns:1fr}}
</style>
