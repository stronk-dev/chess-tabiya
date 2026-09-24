<script lang="ts">
  import { learnerProse } from "./labels/index.js";
  import type { AssistanceConfig, AssistancePermission } from "@chess-tabiya/runtime";

  import type { Capabilities } from "./api.js";
  import { operationConfigured, operationNotice } from "./provider-availability.js";

  type AssistanceField = keyof Omit<AssistanceConfig, "version">;

  interface Props {
    config: AssistanceConfig;
    permissions: Readonly<Record<AssistanceField, AssistancePermission>>;
    capabilities?: Capabilities | undefined;
    disabled?: boolean;
    describedBy?: string | undefined;
    lockedReasonId?: string | undefined;
    externalVoiceReasonId?: string | undefined;
    speechAvailable?: boolean | undefined;
    onChange: (value: AssistanceConfig) => void;
  }

  let {
    config,
    permissions,
    capabilities,
    disabled = false,
    describedBy,
    lockedReasonId,
    externalVoiceReasonId,
    speechAvailable,
    onChange,
  }: Props = $props();

  const uid = $props.id();
  const evidenceNoteId = `assistance-evidence-ceiling-${uid}`;
  let evidenceWithheld = $derived(!disabled && (permissions.boardLighting !== "evidence" || permissions.arrows !== "evidence"));
  const lockedNoteId = `assistance-locked-${uid}`;
  let lockedWithoutReason = $derived(!disabled && describedBy === undefined && lockedReasonId === undefined && Object.values(permissions).includes("locked_off"));
  // Provider-backed preferences stay rendered: not-configured disables them with the reason; a
  // runtime failure leaves the preference settable (delivery reports its own degraded outcome).
  let voiceConfigured = $derived(operationConfigured(capabilities, "render.voice"));
  let speechConfigured = $derived(operationConfigured(capabilities, "render.speech"));
  const speechReasonId = `assistance-speech-provider-${uid}`;
  let speechNotice = $derived(operationNotice(capabilities, "render.speech"));

  function blocked(field: AssistanceField): boolean {
    return disabled || permissions[field] === "locked_off";
  }

  function reason(field: AssistanceField): string | undefined {
    if (describedBy !== undefined) return describedBy;
    if (permissions[field] === "locked_off") return lockedReasonId ?? lockedNoteId;
    if (field === "voice" && !voiceConfigured) return externalVoiceReasonId;
    if (field === "spoken" && !speechConfigured) return speechReasonId;
    return undefined;
  }

  function update<Key extends AssistanceField>(key: Key, value: AssistanceConfig[Key]): void {
    onChange(Object.freeze({ ...config, [key]: value }));
  }
</script>

<div class="assistance-fields">
  <label>Board lighting
    <select value={config.boardLighting} disabled={disabled} aria-describedby={reason("boardLighting")} onchange={(event) => update("boardLighting", event.currentTarget.value as AssistanceConfig["boardLighting"])}>
      <option value="off">Off</option>
      <option value="legal">Legal moves</option>
      <option value="sight">Structural sight</option>
      <option value="evidence" disabled={!disabled && permissions.boardLighting !== "evidence"} aria-describedby={!disabled && permissions.boardLighting !== "evidence" ? evidenceNoteId : undefined}>Disclosed evidence</option>
    </select>
  </label>
  <label>Arrows
    <select value={config.arrows} disabled={disabled} aria-describedby={reason("arrows")} onchange={(event) => update("arrows", event.currentTarget.value as AssistanceConfig["arrows"])}>
      <option value="off">Off</option>
      <option value="sight">Structural sight</option>
      <option value="evidence" disabled={!disabled && permissions.arrows !== "evidence"} aria-describedby={!disabled && permissions.arrows !== "evidence" ? evidenceNoteId : undefined}>Disclosed evidence</option>
    </select>
  </label>
  <label><input type="checkbox" checked={config.markers === "live"} disabled={blocked("markers")} aria-describedby={reason("markers")} onchange={(event) => update("markers", event.currentTarget.checked ? "live" : "off")} /> Passive markers</label>
  <label><input type="checkbox" checked={config.guided === "live"} disabled={blocked("guided")} aria-describedby={reason("guided")} onchange={(event) => update("guided", event.currentTarget.checked ? "live" : "off")} /> Named-pattern guidance</label>
  <label><input type="checkbox" checked={config.humanSplit === "on_request"} disabled={blocked("humanSplit")} aria-describedby={reason("humanSplit")} onchange={(event) => update("humanSplit", event.currentTarget.checked ? "on_request" : "off")} /> Human move split on request</label>
  <label><input type="checkbox" checked={config.corpus === "on_request"} disabled={blocked("corpus")} aria-describedby={reason("corpus")} onchange={(event) => update("corpus", event.currentTarget.checked ? "on_request" : "off")} /> Corpus counts on request</label>
  <label><input type="checkbox" checked={config.voice === "persona"} disabled={blocked("voice") || !voiceConfigured} aria-describedby={reason("voice")} onchange={(event) => update("voice", event.currentTarget.checked ? "persona" : "authored")} /> External voice</label>
  <label>Spoken guidance
    <select value={config.spoken} disabled={blocked("spoken")} aria-describedby={reason("spoken")} onchange={(event) => update("spoken", event.currentTarget.value as AssistanceConfig["spoken"])}>
      <option value="off">Off</option>
      {#if speechAvailable !== false}<option value="browser">Browser voice</option>{/if}
      <option value="provider" disabled={!speechConfigured} aria-describedby={speechConfigured ? undefined : speechReasonId}>Configured provider{speechConfigured ? "" : " (not on this deployment)"}</option>
    </select>
  </label>
  {#if !speechConfigured}<p id={speechReasonId} class="honest">{learnerProse(speechNotice.reason)}</p>{/if}
  <label><input type="checkbox" checked={config.ambient === "on"} disabled={blocked("ambient")} aria-describedby={reason("ambient")} onchange={(event) => update("ambient", event.currentTarget.checked ? "on" : "off")} /> Ambient presence</label>
  {#if lockedWithoutReason}<p id={lockedNoteId} class="honest">Switches this workflow never offers stay off here.</p>{/if}
  {#if evidenceWithheld}<p id={evidenceNoteId} class="honest">Disclosed evidence is not offered to you here; structural sight is the ceiling.</p>{/if}
</div>

<style>
  .assistance-fields { display:grid; gap:.55rem; }
  label { display:grid; gap:.25rem; }
  label:has(> input[type="checkbox"]) { display:flex; align-items:center; gap:.4rem; }
  select { min-height:2.75rem; padding:.65rem .75rem; border:1px solid var(--line); border-radius:.6rem; background:var(--paper); color:var(--ink); font:inherit; }
</style>
