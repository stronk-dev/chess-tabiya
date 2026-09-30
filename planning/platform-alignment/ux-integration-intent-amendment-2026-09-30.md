# Proposed intent amendment — UX integration, 2026-09-30

This is flow-back under `AGENTS.md`, not an edit to protected intent. The existing
Claude UX branch is being integrated with the current typed presentation paths;
the owner or Claude on an owner ruling remains the intent author.

## `design/03-product-breadth.md`, B1 residual

Exact current sentence:

> The true residual is quality, not capability: unstyled natives, no presets,
> checkbox-above-label — owned by the R3/R7 presentation work and `assistance-controls`

What is now true:

- Presets already drive the live learner module seats; this integration does not
  introduce them or change their assistance ceilings.
- Ordinary Playing settings explain the in-run support-style choice. One
  Advanced door selects one named activity; individual channels are nested
  inside it. The old visible per-context matrix is gone.
- High-contrast board settings, screen-local streamer mode and the phone
  companion below the unchanged board are implemented, with component tests
  and browser journeys. They do not prove all UX or accessibility complete.

The residual should name the still-open presentation consumers and fidelity
work rather than state that presets are absent. `planning/roadmap-1.0.json`
retains D3309, remaining Inspector consumers, raw-id leaks, presentation D1/D9,
owner use and the D1639 ceiling ruling. No B1/B8 release gate is promoted here.

Evidence: `apps/web/src/lib/AssistanceSettings.svelte`,
`apps/web/src/lib/AccessibilitySettings.svelte`,
`apps/web/src/lib/streamer-mode.ts`, `apps/web/src/lib/DrillScreen.svelte`,
`tests/browser/drill.spec.ts`, `tests/browser/theme.spec.ts`, and
`planning/work-items-1.0.json`.
