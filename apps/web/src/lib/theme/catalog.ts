import type { AppThemeId, ThemeMode } from "./axes.js";
import type { Palette } from "./tokens.js";

export interface AppThemeDef {
  id: AppThemeId;
  label: string;
  modes: readonly ThemeMode[];
  palettes: Partial<Record<ThemeMode, Palette>>;
  origin: "tabiya" | "inherited";
  after?: string;
  validation?: "candidate";
}

export const PAPER_PALETTE: Palette = Object.freeze({
  paper: "#eeeade",
  panel: "#f8f5ec",
  surface: "#e5e0d2",
  ink: "#171713",
  muted: "#6d6960",
  line: "#cbc4b4",
  accent: "#3858c8",
  "on-accent": "#ffffff",
  "accent-soft": "#dce3fb",
  warning: "#8e6116",
  danger: "#ad3c32",
  "shadow-color": "rgb(40 35 25 / 10%)",
});

export const TOKYO_NIGHT_DARK: Palette = Object.freeze({
  paper: "#1a1b26",
  panel: "#1f2335",
  surface: "#15161e",
  ink: "#c0caf5",
  muted: "#a9b1d6",
  line: "#414868",
  accent: "#7aa2f7",
  "on-accent": "#1a1b26",
  "accent-soft": "#292e42",
  warning: "#e0af68",
  danger: "#f7768e",
  "shadow-color": "rgb(0 0 0 / 40%)",
});

export const TOKYO_NIGHT_LIGHT: Palette = Object.freeze({
  paper: "#e1e2e7",
  panel: "#d5d6db",
  surface: "#c8c9ce",
  ink: "#3b4261",
  muted: "#4e5772",
  line: "#b4b5b9",
  accent: "#2e7de9",
  "on-accent": "#ffffff",
  "accent-soft": "#c8c9ce",
  warning: "#8c6c3e",
  danger: "#f52a65",
  "shadow-color": "rgb(0 0 0 / 12%)",
});

export const WARM_DARK_PALETTE: Palette = Object.freeze({
  paper: "#16140f",
  panel: "#1e1b15",
  surface: "#2a2720",
  ink: "#e8e4d8",
  muted: "#97917f",
  line: "#615b4c",
  accent: "#8fa4e8",
  "on-accent": "#16140f",
  "accent-soft": "#353d57",
  warning: "#df9d32",
  danger: "#e06c75",
  "shadow-color": "rgb(0 0 0 / 45%)",
});

export const APP_THEMES: Readonly<Record<AppThemeId, AppThemeDef>> = Object.freeze({
  paper: Object.freeze({
    id: "paper",
    label: "Tabiya paper",
    modes: ["light"] as const,
    palettes: Object.freeze({ light: PAPER_PALETTE }),
    origin: "tabiya",
  }),
  "tokyo-night": Object.freeze({
    id: "tokyo-night",
    label: "Tokyo Night",
    modes: ["dark", "light"] as const,
    palettes: Object.freeze({ dark: TOKYO_NIGHT_DARK, light: TOKYO_NIGHT_LIGHT }),
    origin: "inherited",
    after: "after folke/tokyonight.nvim",
  }),
  "warm-dark": Object.freeze({
    id: "warm-dark",
    label: "Tabiya warm dark",
    modes: ["dark"] as const,
    palettes: Object.freeze({ dark: WARM_DARK_PALETTE }),
    origin: "tabiya",
    validation: "candidate",
  }),
});

export const MODE_DEFAULT: Readonly<Record<ThemeMode, AppThemeId>> = Object.freeze({
  light: "paper",
  dark: "warm-dark",
});

export const MARK_BRUSHES = Object.freeze({
  green: Object.freeze({ key: "g", color: "#15781B", opacity: 1, lineWidth: 10 }),
  red: Object.freeze({ key: "r", color: "#882020", opacity: 1, lineWidth: 10 }),
  blue: Object.freeze({ key: "b", color: "#003088", opacity: 1, lineWidth: 10 }),
  yellow: Object.freeze({ key: "y", color: "#e68f00", opacity: 1, lineWidth: 10 }),
});

export interface ContrastNotice {
  pair: string;
  ratio: number;
  minimum: number;
}

// Committed measurements for the inherited palette. They are disclosures,
// never a second palette that silently edits upstream values.
export const INHERITED_CONTRAST_NOTICES: Readonly<
  Partial<Record<AppThemeId, Partial<Record<ThemeMode, readonly ContrastNotice[]>>>>
> = Object.freeze({
  "tokyo-night": Object.freeze({
    light: Object.freeze([
      Object.freeze({ pair: "accent text / accent", ratio: 4.02, minimum: 4.5 }),
      Object.freeze({ pair: "accent / panel", ratio: 2.77, minimum: 3 }),
      Object.freeze({ pair: "danger / panel", ratio: 2.68, minimum: 3 }),
    ]),
    dark: Object.freeze([]),
  }),
});
