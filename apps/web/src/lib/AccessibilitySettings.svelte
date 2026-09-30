<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  import { useTheme } from "./theme/context.js";
  import type { BoardThemeId } from "./theme/axes.js";
  import type { ResolvedTheme } from "./theme/controller.js";

  // ux-accessibility-and-mobile.md §5 Q5, ruled by D1566: an Accessibility settings family with a
  // high-contrast board skin, beside the device preferences Tabiya already follows.
  const HIGH_CONTRAST_BOARD: BoardThemeId = "contrast";
  const theme = useTheme();
  let resolved: ResolvedTheme = $state(theme.current);
  let previousBoard: BoardThemeId = $state(theme.current.preference.boardTheme === HIGH_CONTRAST_BOARD ? "brown" : theme.current.preference.boardTheme);
  let unsubscribe: (() => void) | undefined;
  let highContrast = $derived(resolved.preference.boardTheme === HIGH_CONTRAST_BOARD);

  onMount(() => {
    unsubscribe = theme.subscribe((next) => {
      resolved = next;
      if (next.preference.boardTheme !== HIGH_CONTRAST_BOARD) previousBoard = next.preference.boardTheme;
    });
  });
  onDestroy(() => unsubscribe?.());

  function setHighContrast(enabled: boolean): void {
    theme.update({ boardTheme: enabled ? HIGH_CONTRAST_BOARD : previousBoard });
  }
</script>

<section id="accessibility-settings" aria-labelledby="accessibility-settings-title">
  <h2 id="accessibility-settings-title">Accessibility</h2>
  <p class="honest">Saved in this browser and applied immediately.</p>
  <label class="toggle"><input type="checkbox" checked={highContrast} aria-describedby="high-contrast-board-help" onchange={(event) => setHighContrast(event.currentTarget.checked)} /> High-contrast board</label>
  <p id="high-contrast-board-help" class="honest">Light and dark squares differ in brightness by at least 3:1, not only in colour. On every board, move, capture, last-move, check and premove marks keep a brightness difference, so they stay visible in greyscale.</p>
  <h3>Followed from your device</h3>
  <ul>
    <li data-device-preference="reduced-motion">Reduced motion: {resolved.reducedMotion ? "on, so piece movement is off." : "off."}</li>
    <li data-device-preference="forced-colors">Windows high-contrast mode (forced colours) is followed on the board and its marks.</li>
  </ul>
  <p>Press <kbd>?</kbd> when focus is not in a form field or on the board to list every keyboard shortcut.</p>
</section>

<style>
  section{margin:2rem 0;padding:1rem;border:1px solid var(--line);border-radius:.8rem;background:var(--panel)}
  .toggle{display:flex;align-items:center;gap:.5rem;font-weight:600}
  .honest{font-size:.8rem;color:var(--muted)}
  ul{margin:.25rem 0;padding-left:1.2rem}
  kbd{font:600 .8rem ui-monospace,monospace}
</style>
