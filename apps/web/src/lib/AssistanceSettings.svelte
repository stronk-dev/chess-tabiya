<script lang="ts">
  import { SILENT_ASSISTANCE, type AssistanceConfig } from "@chess-tabiya/runtime";
  import { onMount } from "svelte";

  import type { Capabilities, Learner } from "./api.js";
  import { ASSISTANCE_PROFILES, loadAssistance, saveAssistance, type AssistanceProfile } from "./assistance-preference.js";

  interface Props {
    capabilities?: Capabilities | undefined;
    learner?: Learner | undefined;
    onSignOut: () => void | Promise<void>;
    onDelete: (password: string) => void | Promise<void>;
  }

  let { capabilities, learner, onSignOut, onDelete }: Props = $props();
  const labels: Record<AssistanceProfile, string> = { pack: "Curated drill", position: "Just Play", imported: "Imported game", match: "Match / Arena", stream: "Streamed session", onramp: "On-ramp" };
  let configs: Record<AssistanceProfile, AssistanceConfig> = $state(Object.fromEntries(ASSISTANCE_PROFILES.map((profile) => [profile, SILENT_ASSISTANCE])) as Record<AssistanceProfile, AssistanceConfig>);
  let password = $state("");
  let deleteError = $state<string | undefined>();

  function storage(): Storage | undefined { try { return globalThis.localStorage; } catch { return undefined; } }
  function set<Key extends keyof Omit<AssistanceConfig, "version">>(kind: AssistanceProfile, key: Key, value: AssistanceConfig[Key]): void {
    const next = Object.freeze({ ...configs[kind], [key]: value });
    configs = { ...configs, [kind]: next };
    saveAssistance(kind, next, storage());
  }
  async function removeAccount(): Promise<void> {
    deleteError = undefined;
    if (password.length === 0) { deleteError = "Re-enter your password before deleting the account."; return; }
    try { await onDelete(password); password = ""; } catch (error) { deleteError = error instanceof Error ? error.message : String(error); }
  }
  onMount(() => { configs = Object.fromEntries(ASSISTANCE_PROFILES.map((profile) => [profile, loadAssistance(profile, storage())])) as Record<AssistanceProfile, AssistanceConfig>; });
</script>

<section aria-labelledby="assistance-settings-title">
  <h2 id="assistance-settings-title">Assistance by context</h2>
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
        <label><input type="checkbox" checked={configs[kind].voice === "persona"} disabled={capabilities?.providers.llm !== "external"} aria-describedby={capabilities?.providers.llm !== "external" ? `${kind}-voice-unavailable` : undefined} onchange={(event) => set(kind, "voice", event.currentTarget.checked ? "persona" : "authored")} /> External voice</label>
        {#if capabilities?.providers.llm !== "external"}<span class="honest" id={`${kind}-voice-unavailable`}>No external voice provider is configured for this deployment.</span>{/if}
      </fieldset>
    {/each}
  </div>
</section>

<section aria-labelledby="provider-settings-title">
  <h2 id="provider-settings-title">Deployment capabilities</h2>
  {#if capabilities}<dl>{#each Object.entries(capabilities.providers) as [name, value]}<div><dt>{name}</dt><dd>{value}</dd></div>{/each}</dl><p>Run schema {capabilities.runSchemaVersion}; policies {capabilities.policyModes.join(", ")}.</p>{:else}<p>Capability status is unavailable.</p>{/if}
  <p class="honest">These are status facts, not account controls. Change them in the deployment environment.</p>
</section>

{#if learner}
<section aria-labelledby="account-settings-title">
  <h2 id="account-settings-title">Account</h2><p>Signed in as <strong>@{learner.handle}</strong>.</p>
  <button type="button" onclick={onSignOut}>Sign out</button>
  <form onsubmit={(event) => { event.preventDefault(); void removeAccount(); }}>
    <label>Re-enter password <input type="password" autocomplete="current-password" bind:value={password} /></label>
    <button type="submit">Delete account</button>
    <p class="honest">Shared runs are reassigned, not deleted. There is no password recovery, device list, or global sign-out; sessions expire after 30 days.</p>
    {#if deleteError}<p role="alert">{deleteError}</p>{/if}
  </form>
</section>
{/if}

<style>
  section{margin:2rem 0}.context-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem}fieldset{display:grid;gap:.65rem;padding:1rem;border:1px solid var(--line);border-radius:.8rem;background:var(--panel)}label{display:grid;gap:.25rem}dl{display:flex;flex-wrap:wrap;gap:.5rem 1rem}dl div{display:grid}.honest{color:var(--muted);font-size:.8rem}form{display:grid;gap:.6rem;max-width:28rem;margin-top:1rem}@media(max-width:719px){.context-grid{grid-template-columns:1fr}}
</style>
