import type { PreferenceStorage } from "../assistance-preference.js";
import {
  ANIMATION_PREFERENCES,
  APP_THEME_IDS,
  BOARD_THEME_IDS,
  DEFAULT_THEME_PREFERENCE,
  PIECE_SET_IDS,
  THEME_MODES,
  type ThemePreference,
} from "./axes.js";

export const THEME_STORAGE_KEY = "tabiya.theme";

function member<Value extends string>(values: readonly Value[], value: unknown): value is Value {
  return typeof value === "string" && values.includes(value as Value);
}

export function loadThemePreference(storage?: PreferenceStorage): ThemePreference {
  if (storage === undefined) return DEFAULT_THEME_PREFERENCE;
  try {
    const raw = storage.getItem(THEME_STORAGE_KEY);
    if (raw === null) return DEFAULT_THEME_PREFERENCE;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return DEFAULT_THEME_PREFERENCE;
    const item = parsed as Record<string, unknown>;
    return Object.freeze({
      appTheme: member(APP_THEME_IDS, item.appTheme) ? item.appTheme : DEFAULT_THEME_PREFERENCE.appTheme,
      boardTheme: member(BOARD_THEME_IDS, item.boardTheme) ? item.boardTheme : DEFAULT_THEME_PREFERENCE.boardTheme,
      pieceSet: member(PIECE_SET_IDS, item.pieceSet) ? item.pieceSet : DEFAULT_THEME_PREFERENCE.pieceSet,
      modeOverride: item.modeOverride === null || member(THEME_MODES, item.modeOverride)
        ? item.modeOverride as ThemePreference["modeOverride"]
        : DEFAULT_THEME_PREFERENCE.modeOverride,
      animation: member(ANIMATION_PREFERENCES, item.animation) ? item.animation : DEFAULT_THEME_PREFERENCE.animation,
    });
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

export function saveThemePreference(value: ThemePreference, storage?: PreferenceStorage): void {
  storage?.setItem(THEME_STORAGE_KEY, JSON.stringify(value));
}
