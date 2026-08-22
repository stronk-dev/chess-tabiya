export const APP_THEME_IDS = ["paper", "tokyo-night", "warm-dark"] as const;
export type AppThemeId = (typeof APP_THEME_IDS)[number];

export const BOARD_THEME_IDS = ["brown", "olive"] as const;
export type BoardThemeId = (typeof BOARD_THEME_IDS)[number];

export const PIECE_SET_IDS = ["cburnett", "mono"] as const;
export type PieceSetId = (typeof PIECE_SET_IDS)[number];

export const THEME_MODES = ["light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const ANIMATION_PREFERENCES = ["none", "fast", "normal"] as const;
export type AnimationPreference = (typeof ANIMATION_PREFERENCES)[number];

export interface ThemeSelection {
  appTheme: AppThemeId;
  boardTheme: BoardThemeId;
  pieceSet: PieceSetId;
}

export interface ThemePreference extends ThemeSelection {
  modeOverride: ThemeMode | null;
  animation: AnimationPreference;
}

export const DEFAULT_THEME_PREFERENCE: ThemePreference = Object.freeze({
  appTheme: "paper",
  boardTheme: "brown",
  pieceSet: "cburnett",
  modeOverride: null,
  animation: "normal",
});

export const BOARD_THEMES = Object.freeze([
  Object.freeze({ id: "brown" as const, label: "Classic brown" }),
  Object.freeze({ id: "olive" as const, label: "Warm olive", validation: "candidate" as const }),
]);

export const PIECE_SETS = Object.freeze([
  Object.freeze({ id: "cburnett" as const, label: "Cburnett" }),
  Object.freeze({ id: "mono" as const, label: "Mono", validation: "candidate" as const }),
]);
