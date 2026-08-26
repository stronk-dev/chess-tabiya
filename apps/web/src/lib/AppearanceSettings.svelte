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
  import type { DrawShape } from "@lichess-org/chessground/draw";
  import Chessboard from "./Chessboard.svelte";
  import HonestControl from "./HonestControl.svelte";

  const theme = useTheme();
  let resolved: ResolvedTheme = $state(theme.current);
  let notices = $derived(INHERITED_CONTRAST_NOTICES[resolved.appTheme]?.[resolved.mode] ?? []);
  let previewPalette = $derived(APP_THEMES[resolved.appTheme].palettes[resolved.mode]!);
  let previewStyle = $derived(Object.entries(previewPalette).map(([token, value]) => `--${token}:${value}`).join(";"));
  let previewReset = $state(0);
  let unsubscribe: (() => void) | undefined;

  const PREVIEW_FEN = "r1b2rk1/ppppbppp/1qn2n2/4p3/4P3/2NP1N2/PPP1B1PP/R1BQ1RK1 w - - 4 10";
  const PREVIEW_MARKS: readonly DrawShape[] = Object.freeze([
    Object.freeze({ orig: "a2", dest: "a4", brush: "green" }),
    Object.freeze({ orig: "b6", dest: "f2", brush: "red" }),
    Object.freeze({ orig: "c3", dest: "d5", brush: "blue" }),
    Object.freeze({ orig: "d1", dest: "b3", brush: "yellow" }),
  ]);

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
      {#if notices.length > 0}
        <span class="theme-contrast" role="status">This theme has {notices.length} measured low-contrast {notices.length === 1 ? "pair" : "pairs"}: {notices.map((notice) => `${notice.pair} ${notice.ratio.toFixed(2)}:1`).join("; ")}.</span>
      {/if}
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
      <HonestControl disabled={resolved.reducedMotion} reasonId="device-reduced-motion" reason="Your device requests reduced motion, so piece movement is off. Change the device setting to choose another speed.">
        {#snippet children(describedBy)}
          <select disabled={resolved.reducedMotion} aria-describedby={describedBy} value={resolved.preference.animation} onchange={(event) => setAnimation(event.currentTarget.value)}>
            {#each ANIMATION_PREFERENCES as value}<option {value}>{value === "none" ? "No animation" : value === "fast" ? "Fast" : "Normal"}</option>{/each}
          </select>
        {/snippet}
      </HonestControl>
    </label>
  </div>
  <section class="appearance-preview" aria-labelledby="appearance-preview-title">
    <div class="chrome-preview" style={previewStyle}>
      <header><strong id="appearance-preview-title">Tabiya</strong><span>Appearance preview</span></header>
      <article><p class="preview-eyebrow">Your next rehearsal</p><h3>Play the consequence</h3><p>Chrome, board, pieces and evidence paint update together without merging their settings.</p><button type="button">Accent action</button></article>
    </div>
    <div class="board-preview" aria-label="Board and piece preview">
      <Chessboard
        fen={PREVIEW_FEN}
        startSide="white"
        lastMove="b4b6"
        boardTheme={resolved.preference.boardTheme}
        pieceSet={resolved.preference.pieceSet}
        selectedSquare="g1"
        overlays={PREVIEW_MARKS}
        resetToken={previewReset}
        onMove={() => { previewReset += 1; }}
      />
      <p>Select a piece to preview legal destinations. The position includes every piece role in both colours, a checked king, last move, and all four mark brushes.</p>
    </div>
  </section>
  <p class="current">Using {APP_THEMES[resolved.appTheme].label} in {resolved.mode} mode.</p>
  {#if APP_THEMES[resolved.preference.appTheme].after}<p class="credit">{APP_THEMES[resolved.preference.appTheme].after}</p>{/if}
</section>

<style>
  section{margin:2rem 0;padding:1rem;border:1px solid var(--line);border-radius:.8rem;background:var(--panel)}
  .appearance-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.8rem}
  .appearance-preview{display:grid;grid-template-columns:minmax(14rem,1fr) minmax(15rem,21rem);gap:1rem;align-items:center;margin-top:1rem;padding:1rem;border:1px solid var(--line);border-radius:.75rem;background:var(--surface)}
  .chrome-preview{align-self:stretch;padding:.8rem;border:1px solid var(--line);border-radius:.7rem;background:var(--paper);color:var(--ink);box-shadow:var(--shadow)}
  .chrome-preview header{display:flex;justify-content:space-between;gap:1rem;padding-bottom:.65rem;border-bottom:1px solid var(--line)}
  .chrome-preview header span,.chrome-preview article>p{color:var(--muted)}
  .chrome-preview article{margin-top:.8rem;padding:.8rem;border-radius:.6rem;background:var(--panel)}
  .chrome-preview h3,.chrome-preview p{margin:.25rem 0}.chrome-preview button{margin-top:.75rem;background:var(--accent);color:var(--on-accent);border-color:var(--accent)}
  .preview-eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:.68rem}.board-preview{min-width:0}.board-preview :global(.appearance-link),.board-preview :global(.text-move){display:none}.board-preview p{margin:.5rem 0 0;color:var(--muted);font-size:.72rem;line-height:1.4}
  label{display:grid;gap:.3rem;font-size:.82rem;color:var(--muted)}
  select{color:var(--ink);background:var(--surface)}
  .honest,.credit,.current,.theme-contrast{font-size:.8rem;color:var(--muted)}
  .current{color:var(--ink)}
  .theme-contrast{padding-left:.6rem;border-left:3px solid var(--warning);line-height:1.4}
  @media(max-width:719px){.appearance-preview{grid-template-columns:1fr}.board-preview{width:min(100%,21rem);justify-self:center}}
</style>
