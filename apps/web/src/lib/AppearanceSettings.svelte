<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  import { useTheme } from "./theme/context.js";
  import {
    ANIMATION_PREFERENCES,
    APP_THEME_IDS,
    BOARD_THEMES,
    PIECE_SETS,
    type AnimationPreference,
    type AppThemeId,
    type BoardThemeId,
    type PieceSetId,
    type ThemeMode,
  } from "./theme/axes.js";
  import { APP_THEMES, INHERITED_CONTRAST_NOTICES } from "./theme/catalog.js";
  import type { ResolvedTheme } from "./theme/controller.js";

  const theme = useTheme();
  let resolved: ResolvedTheme = $state(theme.current);
  let notices = $derived(INHERITED_CONTRAST_NOTICES[resolved.appTheme]?.[resolved.mode] ?? []);
  let unsubscribe: (() => void) | undefined;

  onMount(() => { unsubscribe = theme.subscribe((next) => (resolved = next)); });
  onDestroy(() => unsubscribe?.());

  function setAppTheme(value: string): void { theme.update({ appTheme: value as AppThemeId }); }
  function setBoardTheme(value: string): void { theme.update({ boardTheme: value as BoardThemeId }); }
  function setPieceSet(value: string): void { theme.update({ pieceSet: value as PieceSetId }); }
  function setMode(value: string): void { theme.update({ modeOverride: value === "device" ? null : value as ThemeMode }); }
  function setAnimation(value: string): void { theme.update({ animation: value as AnimationPreference }); }
</script>

<section id="appearance-settings" aria-labelledby="appearance-settings-title">
  <h2 id="appearance-settings-title">Appearance</h2>
  <p class="honest">Saved in this browser and applied immediately. Board and pieces are independent of the app colors.</p>
  <div class="appearance-grid">
    <label>
      App theme
      <select value={resolved.preference.appTheme} onchange={(event) => setAppTheme(event.currentTarget.value)}>
        {#each APP_THEME_IDS as id}<option value={id}>{APP_THEMES[id].label}</option>{/each}
      </select>
    </label>
    <label>
      Light or dark
      <select value={resolved.preference.modeOverride ?? "device"} onchange={(event) => setMode(event.currentTarget.value)}>
        <option value="device">Follow device</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    <label>
      Board
      <select value={resolved.preference.boardTheme} onchange={(event) => setBoardTheme(event.currentTarget.value)}>
        {#each BOARD_THEMES as item}<option value={item.id}>{item.label}</option>{/each}
      </select>
    </label>
    <label>
      Pieces
      <select value={resolved.preference.pieceSet} onchange={(event) => setPieceSet(event.currentTarget.value)}>
        {#each PIECE_SETS as item}<option value={item.id}>{item.label}</option>{/each}
      </select>
    </label>
    <label>
      Piece movement
      <select value={resolved.preference.animation} onchange={(event) => setAnimation(event.currentTarget.value)}>
        {#each ANIMATION_PREFERENCES as value}<option {value}>{value === "none" ? "No animation" : value === "fast" ? "Fast" : "Normal"}</option>{/each}
      </select>
    </label>
  </div>
  <p class="current">Using {APP_THEMES[resolved.appTheme].label} in {resolved.mode} mode.</p>
  {#if APP_THEMES[resolved.preference.appTheme].after}<p class="credit">{APP_THEMES[resolved.preference.appTheme].after}</p>{/if}
  {#if notices.length > 0}
    <details class="contrast-notice">
      <summary>This inherited palette has {notices.length} measured low-contrast {notices.length === 1 ? "pair" : "pairs"}</summary>
      <ul>{#each notices as notice}<li>{notice.pair}: {notice.ratio.toFixed(2)}:1 (AA floor {notice.minimum}:1)</li>{/each}</ul>
    </details>
  {/if}
</section>

<style>
  section{margin:2rem 0;padding:1rem;border:1px solid var(--line);border-radius:.8rem;background:var(--panel)}
  .appearance-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.8rem}
  label{display:grid;gap:.3rem;font-size:.82rem;color:var(--muted)}
  select{color:var(--ink);background:var(--surface)}
  .honest,.credit,.current,.contrast-notice{font-size:.8rem;color:var(--muted)}
  .current{color:var(--ink)}
  .contrast-notice{border-left:3px solid var(--warning);padding-left:.7rem}
</style>
