<script lang="ts">
  import type { AssistanceConfig } from "@chess-tabiya/runtime";

  import type { Capabilities, DeletionEffect, DeletionPreview, Learner } from "./api.js";
  import { ASSISTANCE_PROFILES, loadAssistance, saveAssistance, type AssistanceProfile } from "./assistance-preference.js";
  import StatusAnnouncement from "./StatusAnnouncement.svelte";

  interface Props {
    capabilities?: Capabilities | undefined;
    learner?: Learner | undefined;
    onSignOut: () => void | Promise<void>;
    onExport: (password: string) => void | Promise<void>;
    onDelete: (password: string, previewDigest: string) => void | Promise<void>;
    loadDeletionPreview?: () => Promise<DeletionPreview>;
    plannedSurfaceIds?: readonly string[];
  }

  let { capabilities, learner, onSignOut, onExport, onDelete, loadDeletionPreview, plannedSurfaceIds = [] }: Props = $props();
  const labels: Record<AssistanceProfile, string> = { pack: "Curated drill", position: "Just Play", imported: "Imported game", match: "Match / Arena", stream: "Streamed session", academy: "Academy", onramp: "On-ramp", campaign: "Campaign" };
  let configs: Record<AssistanceProfile, AssistanceConfig> = $state(Object.fromEntries(ASSISTANCE_PROFILES.map((profile) => [profile, loadAssistance(profile, storage())])) as Record<AssistanceProfile, AssistanceConfig>);
  let password = $state("");
  let exportPassword = $state("");
  let exportStatus = $state<string | undefined>();
  let deleteError = $state<string | undefined>();
  let deletionPreview = $state<DeletionPreview | undefined>();

  function storage(): Storage | undefined { try { return globalThis.localStorage; } catch { return undefined; } }
  function set<Key extends keyof Omit<AssistanceConfig, "version">>(kind: AssistanceProfile, key: Key, value: AssistanceConfig[Key]): void {
    const next = Object.freeze({ ...configs[kind], [key]: value });
    configs = { ...configs, [kind]: next };
    saveAssistance(kind, next, storage());
  }
  async function removeAccount(): Promise<void> {
    deleteError = undefined;
    if (deletionPreview === undefined) { deleteError = "Review what will happen before deleting the account."; return; }
    if (password.length === 0) { deleteError = "Re-enter your password before deleting the account."; return; }
    try { await onDelete(password, deletionPreview.digest); password = ""; } catch (error) { deleteError = error instanceof Error ? error.message : String(error); }
  }
  async function previewDeletion(): Promise<void> {
    deleteError = undefined;
    try {
      if (loadDeletionPreview === undefined) throw new Error("Deletion preview is unavailable.");
      deletionPreview = await loadDeletionPreview();
    } catch (error) { deleteError = error instanceof Error ? error.message : String(error); }
  }
  function effectCount(groups: readonly DeletionEffect[]): number { return groups.reduce((total, effect) => total + effect.count, 0); }
  async function downloadAccount(): Promise<void> {
    exportStatus = undefined;
    if (exportPassword.length === 0) { exportStatus = "Re-enter your password to download your data."; return; }
    try { await onExport(exportPassword); exportStatus = "Your account data download has started."; }
    catch (error) { exportStatus = error instanceof Error ? error.message : String(error); }
    finally { exportPassword = ""; }
  }
</script>

<section id="playing-settings" aria-labelledby="assistance-settings-title">
  <h2 id="assistance-settings-title">Playing</h2>
  <p class="honest">Saved in this browser only. Deployment providers are controlled by the server environment.</p>
  <div class="context-grid">
    {#each ASSISTANCE_PROFILES as kind}
      <fieldset>
        <legend>{labels[kind]}</legend>
        <label>Board lighting <select value={configs[kind].boardLighting} onchange={(event) => set(kind, "boardLighting", event.currentTarget.value as AssistanceConfig["boardLighting"])}><option value="off">Off</option><option value="legal">Legal moves</option><option value="sight">Structural sight</option><option value="evidence">Disclosed evidence</option></select></label>
        <label>Arrows <select value={configs[kind].arrows} onchange={(event) => set(kind, "arrows", event.currentTarget.value as AssistanceConfig["arrows"])}><option value="off">Off</option><option value="sight">Structural sight</option><option value="evidence">Disclosed evidence</option></select></label>
        <label>Spoken guidance <select value={configs[kind].spoken} onchange={(event) => set(kind, "spoken", event.currentTarget.value as AssistanceConfig["spoken"])}><option value="off">Off</option><option value="browser">Browser voice</option>{#if capabilities?.providers.tts === "external"}<option value="provider">Configured provider</option>{/if}</select></label>
        <label><input type="checkbox" checked={configs[kind].ambient === "on"} onchange={(event) => set(kind, "ambient", event.currentTarget.checked ? "on" : "off")} /> Ambient presence</label>
        <label><input type="checkbox" checked={configs[kind].markers === "live"} onchange={(event) => set(kind, "markers", event.currentTarget.checked ? "live" : "off")} /> Passive markers</label>
        <label><input type="checkbox" checked={configs[kind].guided === "live"} onchange={(event) => set(kind, "guided", event.currentTarget.checked ? "live" : "off")} /> Named-pattern guidance</label>
        <label><input type="checkbox" checked={configs[kind].humanSplit === "on_request"} onchange={(event) => set(kind, "humanSplit", event.currentTarget.checked ? "on_request" : "off")} /> Human move split on request</label>
        <label><input type="checkbox" checked={configs[kind].corpus === "on_request"} onchange={(event) => set(kind, "corpus", event.currentTarget.checked ? "on_request" : "off")} /> Corpus counts on request</label>
        <label><input type="checkbox" checked={configs[kind].voice === "persona"} disabled={capabilities?.providers.llm !== "external"} aria-describedby={capabilities?.providers.llm !== "external" ? "external-voice-unavailable" : undefined} onchange={(event) => set(kind, "voice", event.currentTarget.checked ? "persona" : "authored")} /> External voice</label>
      </fieldset>
    {/each}
  </div>
</section>

{#if learner}
<section id="account-settings" aria-labelledby="account-settings-title">
  <h2 id="account-settings-title">Account</h2><p>Signed in as <strong>@{learner.handle}</strong>.</p>
  <button type="button" onclick={onSignOut}>Sign out</button>
  <form onsubmit={(event) => { event.preventDefault(); void downloadAccount(); }}>
    <h3>Download my data</h3>
    <p class="honest">A portable copy of your runs, progress, authored drafts, publications, and account-scoped activity. Passwords, sessions, provider credentials, and preferences stored only on this device are excluded.</p>
    <label>Current password <input type="password" autocomplete="current-password" bind:value={exportPassword} /></label>
    <button type="submit">Download my data</button>
    {#if exportStatus}<p role="status">{exportStatus}</p>{/if}
  </form>
  <form onsubmit={(event) => { event.preventDefault(); void removeAccount(); }}>
    <h3>Delete account</h3>
    {#if deletionPreview === undefined}
      <p>First review exactly what will be deleted, what collaborators can still read, and what published work remains.</p>
      <button type="button" onclick={() => void previewDeletion()}>Review deletion effects</button>
    {:else}
      <div class="deletion-preview">
        <StatusAnnouncement message={`Deletion effects loaded. ${effectCount(deletionPreview.hardDelete)} permanently deleted. ${effectCount(deletionPreview.tombstone)} kept read-only. ${effectCount(deletionPreview.revoke)} access records revoked. ${effectCount(deletionPreview.retainedPublished)} published records retained.`} />
        <h4>Deletion effects</h4>
        {#if effectCount(deletionPreview.hardDelete) > 0}<h5>Permanently deleted</h5><ul>{#each deletionPreview.hardDelete as effect}<li>{effect.label} ({effect.count})</li>{/each}</ul>{/if}
        {#if effectCount(deletionPreview.tombstone) > 0}<h5>Kept read-only for collaborators</h5><ul>{#each deletionPreview.tombstone as effect}<li>{effect.label}</li>{/each}</ul>{/if}
        {#if effectCount(deletionPreview.revoke) > 0}<h5>Access revoked</h5><ul>{#each deletionPreview.revoke as effect}<li>{effect.label} ({effect.count})</li>{/each}</ul>{/if}
        {#if effectCount(deletionPreview.retainedPublished) > 0}<h5>Published work retained</h5><ul>{#each deletionPreview.retainedPublished as effect}<li>{effect.label}</li>{/each}</ul>{/if}
        <p class="honest">{deletionPreview.backupNotice}</p>
      </div>
    <label>Re-enter password <input type="password" autocomplete="current-password" bind:value={password} /></label>
    <button type="submit">Delete account</button>
    <p class="honest">This browser's Tabiya writer ids and preferences are cleared after deletion. Other devices may retain obsolete device-local preferences, but every server session is invalidated.</p>
    {/if}
    {#if deleteError}<p role="alert">{deleteError}</p>{/if}
  </form>
</section>
{/if}

<section id="about-deployment" aria-labelledby="about-deployment-title">
  <h2 id="about-deployment-title">About this deployment</h2>
  {#if capabilities}
    <h3>Services</h3><dl>{#each Object.entries(capabilities.providers) as [name, value]}<div><dt>{name}</dt><dd>{value}</dd></div>{/each}</dl>
    <p>Run schema {capabilities.runSchemaVersion}; policies {capabilities.policyModes.join(", ")}.</p>
    <h3>Surface availability</h3><ul>{#each Object.entries(capabilities.surfaces) as [id, availability]}<li>{id}: {plannedSurfaceIds.includes(id) ? "planned" : availability}</li>{/each}</ul>
  {:else}<p>Deployment status is unavailable.</p>{/if}
  {#if capabilities?.providers.llm !== "external"}<p class="honest" id="external-voice-unavailable">External voice is unavailable because this deployment has no configured provider.</p>{/if}
  <p class="honest">These are status facts, not account controls. Change them in the deployment environment.</p>
</section>

<style>
  section{margin:2rem 0}.context-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem}fieldset{display:grid;gap:.65rem;padding:1rem;border:1px solid var(--line);border-radius:.8rem;background:var(--panel)}label{display:grid;gap:.25rem}label:has(> input[type="checkbox"]){display:flex;align-items:center}dl{display:flex;flex-wrap:wrap;gap:.5rem 1rem}dl div{display:grid}.honest{color:var(--muted);font-size:.8rem}form{display:grid;gap:.6rem;max-width:28rem;margin-top:1rem}@media(max-width:719px){.context-grid{grid-template-columns:1fr}}
</style>
