export type PlayViewportClass = "desktop" | "tablet" | "phone";

export const PLAY_COMPOSITION_TOKENS = {
  topbarHeight: 56,
  timelineHeight: 40,
  objectiveHeight: 32,
  companionBandHeight: 176,
  companionRimHeight: 48,
  companionRailWidth: 336,
  stackGaps: 32,
  desktopStagePadding: 16,
  tabletStagePadding: 16,
  phoneStagePadding: 8,
} as const;

export function playViewportClass(width: number): PlayViewportClass {
  if (width <= 719) return "phone";
  if (width <= 1023) return "tablet";
  return "desktop";
}

function snap8(value: number): number {
  return Math.max(0, Math.floor(value / 8) * 8);
}

/** One authority for both rendered geometry and the browser acceptance matrix. */
export function playBoardEdge(width: number, height: number): number {
  const tokens = PLAY_COMPOSITION_TOKENS;
  switch (playViewportClass(width)) {
    case "desktop":
      return snap8(
        Math.min(
          width - tokens.companionRailWidth,
          height - tokens.topbarHeight - tokens.timelineHeight,
        ) - 2 * tokens.desktopStagePadding,
      );
    case "tablet":
      return snap8(
        Math.min(
          width - 2 * tokens.tabletStagePadding,
          height
            - tokens.topbarHeight
            - tokens.timelineHeight
            - tokens.objectiveHeight
            - tokens.companionBandHeight
            - tokens.stackGaps,
        ),
      );
    case "phone":
      return snap8(
        Math.min(
          width - 2 * tokens.phoneStagePadding,
          height
            - tokens.topbarHeight
            - tokens.timelineHeight
            - tokens.objectiveHeight
            - tokens.companionRimHeight
            - tokens.stackGaps,
        ),
      );
  }
}
