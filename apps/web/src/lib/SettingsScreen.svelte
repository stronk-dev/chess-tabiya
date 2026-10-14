<script lang="ts">
  import type { ComponentProps } from "svelte";
  import AppearanceSettings from "./AppearanceSettings.svelte";
  import AccessibilitySettings from "./AccessibilitySettings.svelte";
  import AssistanceSettings from "./AssistanceSettings.svelte";
  import StreamerModeSettings from "./StreamerModeSettings.svelte";
  import type { StreamerMode } from "./streamer-mode.js";

  type Props = ComponentProps<typeof AssistanceSettings> & {
    streamerMode: StreamerMode;
    onStreamerModeChange: (mode: StreamerMode) => void;
  };
  let { streamerMode, onStreamerModeChange, ...accountProps }: Props = $props();
</script>

<nav class="settings-toc" aria-label="Settings sections"><a href="#appearance-settings">Appearance</a><a href="#accessibility-settings">Accessibility</a><a href="#streamer-mode-settings">Streamer mode</a><a href="#playing-settings">Playing</a>{#if accountProps.learner}<a href="#account-settings">Account</a>{/if}<a href="#about-deployment">About</a></nav>
<AppearanceSettings />
<AccessibilitySettings />
<StreamerModeSettings mode={streamerMode} onChange={onStreamerModeChange} />
<AssistanceSettings {...accountProps} />

<style>
  .settings-toc { position: sticky; z-index: 2; top: 0; display: flex; flex-wrap: wrap; gap: .45rem; padding: .65rem; border: 1px solid var(--line); border-radius: .75rem; background: color-mix(in srgb, var(--panel) 92%, transparent); backdrop-filter: blur(.5rem); }
  .settings-toc a { padding: .45rem .65rem; border-radius: .5rem; color: var(--ink); text-decoration: none; }
  .settings-toc a:hover, .settings-toc a:focus-visible { background: var(--accent-soft); }
</style>
