<script lang="ts">
  import { STREAMER_MODE_HIDES, STREAMER_MODE_LABELS, STREAMER_MODE_LIMIT, STREAMER_MODE_NOT_A_SESSION, STREAMER_MODES, type StreamerMode } from "./streamer-mode.js";

  interface Props { mode: StreamerMode; onChange: (mode: StreamerMode) => void; }
  let { mode, onChange }: Props = $props();
</script>

<section id="streamer-mode-settings" aria-labelledby="streamer-mode-title">
  <h2 id="streamer-mode-title">Streamer mode</h2>
  <p>Hide private information on your own screen while you are on camera. Press <kbd>Z</kbd> to switch it on or off.</p>
  <fieldset>
    <legend>Use streamer mode</legend>
    {#each STREAMER_MODES as option (option)}
      <label><input type="radio" name="streamer-mode" value={option} checked={mode === option} aria-describedby="streamer-mode-limit" onchange={() => onChange(option)} /> {STREAMER_MODE_LABELS[option]}</label>
    {/each}
  </fieldset>
  <h3 id="streamer-mode-hides-title">What it hides</h3>
  <ul aria-labelledby="streamer-mode-hides-title">{#each STREAMER_MODE_HIDES as item (item)}<li>{item}</li>{/each}</ul>
  <p id="streamer-mode-limit"><strong>What it does not do.</strong> {STREAMER_MODE_LIMIT}</p>
  <p class="honest">{STREAMER_MODE_NOT_A_SESSION}</p>
</section>

<style>
  section{margin:2rem 0;padding:1rem;border:1px solid var(--line);border-radius:.8rem;background:var(--panel)}
  fieldset{display:flex;flex-wrap:wrap;gap:.5rem 1.25rem;border:0;padding:0;margin:.5rem 0}
  legend{font-weight:600;margin-bottom:.35rem}
  label{display:flex;align-items:center;gap:.4rem}
  ul{margin:.25rem 0;padding-left:1.2rem}
  .honest{font-size:.8rem;color:var(--muted)}
  kbd{font:600 .8rem ui-monospace,monospace}
</style>
