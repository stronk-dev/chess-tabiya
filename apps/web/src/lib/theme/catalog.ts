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

export const DRACULA_DARK: Palette = Object.freeze({
  paper: "#282a36", panel: "#44475a", surface: "#1e1f29", ink: "#f8f8f2",
  muted: "#bd93f9", line: "#6272a4", accent: "#bd93f9", "on-accent": "#282a36",
  "accent-soft": "#383a4a", warning: "#f1fa8c", danger: "#ff5555",
  "shadow-color": "rgb(0 0 0 / 50%)",
});

export const NORD_DARK: Palette = Object.freeze({
  paper: "#2e3440", panel: "#3b4252", surface: "#272c36", ink: "#eceff4",
  muted: "#d8dee9", line: "#4c566a", accent: "#88c0d0", "on-accent": "#2e3440",
  "accent-soft": "#434c5e", warning: "#ebcb8b", danger: "#bf616a",
  "shadow-color": "rgb(0 0 0 / 40%)",
});

export const CATPPUCCIN_DARK: Palette = Object.freeze({
  paper: "#1e1e2e", panel: "#313244", surface: "#181825", ink: "#cdd6f4",
  muted: "#bac2de", line: "#585b70", accent: "#cba6f7", "on-accent": "#1e1e2e",
  "accent-soft": "#45475a", warning: "#f9e2af", danger: "#f38ba8",
  "shadow-color": "rgb(0 0 0 / 40%)",
});

export const CATPPUCCIN_LIGHT: Palette = Object.freeze({
  paper: "#eff1f5", panel: "#ccd0da", surface: "#dce0e8", ink: "#4c4f69",
  muted: "#5c5f77", line: "#9ca0b0", accent: "#8839ef", "on-accent": "#ffffff",
  "accent-soft": "#ccd0da", warning: "#df8e1d", danger: "#d20f39",
  "shadow-color": "rgb(0 0 0 / 10%)",
});

export const GRUVBOX_DARK: Palette = Object.freeze({
  paper: "#282828", panel: "#3c3836", surface: "#1d2021", ink: "#ebdbb2",
  muted: "#d5c4a1", line: "#665c54", accent: "#d79921", "on-accent": "#282828",
  "accent-soft": "#504945", warning: "#fabd2f", danger: "#fb4934",
  "shadow-color": "rgb(0 0 0 / 50%)",
});

export const GRUVBOX_LIGHT: Palette = Object.freeze({
  paper: "#fbf1c7", panel: "#ebdbb2", surface: "#f2e5bc", ink: "#3c3836",
  muted: "#504945", line: "#a89984", accent: "#d79921", "on-accent": "#282828",
  "accent-soft": "#ebdbb2", warning: "#b57614", danger: "#cc241d",
  "shadow-color": "rgb(0 0 0 / 12%)",
});

export const ONE_DARK: Palette = Object.freeze({
  paper: "#282c34", panel: "#2c313a", surface: "#21252b", ink: "#abb2bf",
  muted: "#9da5b4", line: "#3e4451", accent: "#61afef", "on-accent": "#282c34",
  "accent-soft": "#3a3f4b", warning: "#e5c07b", danger: "#e06c75",
  "shadow-color": "rgb(0 0 0 / 50%)",
});

export const GITHUB_DARK: Palette = Object.freeze({
  paper: "#0d1117", panel: "#161b22", surface: "#010409", ink: "#e6edf3",
  muted: "#8b949e", line: "#30363d", accent: "#58a6ff", "on-accent": "#0d1117",
  "accent-soft": "#21262d", warning: "#d29922", danger: "#f85149",
  "shadow-color": "rgb(0 0 0 / 60%)",
});

export const ROSE_PINE_DARK: Palette = Object.freeze({
  paper: "#191724", panel: "#1f1d2e", surface: "#13111e", ink: "#e0def4",
  muted: "#908caa", line: "#524f67", accent: "#c4a7e7", "on-accent": "#191724",
  "accent-soft": "#26233a", warning: "#f6c177", danger: "#eb6f92",
  "shadow-color": "rgb(0 0 0 / 50%)",
});

export const SOLARIZED_DARK: Palette = Object.freeze({
  paper: "#002b36", panel: "#073642", surface: "#00212b", ink: "#839496",
  muted: "#93a1a1", line: "#586e75", accent: "#2aa198", "on-accent": "#002b36",
  "accent-soft": "#0a4050", warning: "#b58900", danger: "#dc322f",
  "shadow-color": "rgb(0 0 0 / 40%)",
});

export const SOLARIZED_LIGHT: Palette = Object.freeze({
  paper: "#fdf6e3", panel: "#eee8d5", surface: "#f5efdc", ink: "#657b83",
  muted: "#586e75", line: "#93a1a1", accent: "#2aa198", "on-accent": "#fdf6e3",
  "accent-soft": "#eee8d5", warning: "#b58900", danger: "#dc322f",
  "shadow-color": "rgb(0 0 0 / 10%)",
});

export const AYU_MIRAGE_DARK: Palette = Object.freeze({
  paper: "#242936", panel: "#1f2430", surface: "#1a1e29", ink: "#cccac2",
  muted: "#707a8c", line: "#565b70", accent: "#ffad66", "on-accent": "#242936",
  "accent-soft": "#2d3441", warning: "#ffd580", danger: "#f28779",
  "shadow-color": "rgb(0 0 0 / 50%)",
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
  dracula: Object.freeze({
    id: "dracula", label: "Dracula", modes: ["dark"] as const,
    palettes: Object.freeze({ dark: DRACULA_DARK }), origin: "inherited",
  }),
  nord: Object.freeze({
    id: "nord", label: "Nord", modes: ["dark"] as const,
    palettes: Object.freeze({ dark: NORD_DARK }), origin: "inherited",
  }),
  catppuccin: Object.freeze({
    id: "catppuccin", label: "Catppuccin", modes: ["dark", "light"] as const,
    palettes: Object.freeze({ dark: CATPPUCCIN_DARK, light: CATPPUCCIN_LIGHT }), origin: "inherited",
  }),
  gruvbox: Object.freeze({
    id: "gruvbox", label: "Gruvbox", modes: ["dark", "light"] as const,
    palettes: Object.freeze({ dark: GRUVBOX_DARK, light: GRUVBOX_LIGHT }), origin: "inherited",
  }),
  "one-dark": Object.freeze({
    id: "one-dark", label: "One Dark", modes: ["dark"] as const,
    palettes: Object.freeze({ dark: ONE_DARK }), origin: "inherited",
  }),
  "github-dark": Object.freeze({
    id: "github-dark", label: "GitHub Dark", modes: ["dark"] as const,
    palettes: Object.freeze({ dark: GITHUB_DARK }), origin: "inherited",
  }),
  "rose-pine": Object.freeze({
    id: "rose-pine", label: "Rosé Pine", modes: ["dark"] as const,
    palettes: Object.freeze({ dark: ROSE_PINE_DARK }), origin: "inherited",
  }),
  solarized: Object.freeze({
    id: "solarized", label: "Solarized", modes: ["dark", "light"] as const,
    palettes: Object.freeze({ dark: SOLARIZED_DARK, light: SOLARIZED_LIGHT }), origin: "inherited",
  }),
  "ayu-mirage": Object.freeze({
    id: "ayu-mirage", label: "Ayu Mirage", modes: ["dark"] as const,
    palettes: Object.freeze({ dark: AYU_MIRAGE_DARK }), origin: "inherited",
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

// Committed measurements for every inherited palette. They are disclosures,
// never a second palette that silently edits upstream values. The independent
// test recomputes the complete pair population from the pinned palette bytes.
export const INHERITED_CONTRAST_NOTICES: Readonly<
  Partial<Record<AppThemeId, Partial<Record<ThemeMode, readonly ContrastNotice[]>>>>
> = Object.freeze({
  "tokyo-night": Object.freeze({
    dark: Object.freeze([]),
    light: Object.freeze([
      Object.freeze({ pair: "accent text / accent", ratio: 4.0182, minimum: 4.5 }),
      Object.freeze({ pair: "accent / panel", ratio: 2.7689, minimum: 3 }),
      Object.freeze({ pair: "danger / panel", ratio: 2.6790, minimum: 3 }),
    ]),
  }),
  dracula: Object.freeze({ dark: Object.freeze([
    Object.freeze({ pair: "muted text / panel", ratio: 3.7936, minimum: 4.5 }),
    Object.freeze({ pair: "danger / panel", ratio: 2.9122, minimum: 3 }),
  ]) }),
  nord: Object.freeze({ dark: Object.freeze([
    Object.freeze({ pair: "danger / panel", ratio: 2.4595, minimum: 3 }),
  ]) }),
  catppuccin: Object.freeze({
    dark: Object.freeze([]),
    light: Object.freeze([
      Object.freeze({ pair: "muted text / panel", ratio: 4.0503, minimum: 4.5 }),
      Object.freeze({ pair: "warning / page", ratio: 2.3142, minimum: 3 }),
      Object.freeze({ pair: "warning / panel", ratio: 1.6951, minimum: 3 }),
    ]),
  }),
  gruvbox: Object.freeze({
    dark: Object.freeze([]),
    light: Object.freeze([
      Object.freeze({ pair: "accent / page", ratio: 2.1858, minimum: 3 }),
      Object.freeze({ pair: "accent / panel", ratio: 1.8078, minimum: 3 }),
      Object.freeze({ pair: "warning / panel", ratio: 2.7501, minimum: 3 }),
    ]),
  }),
  "one-dark": Object.freeze({ dark: Object.freeze([]) }),
  "github-dark": Object.freeze({ dark: Object.freeze([]) }),
  "rose-pine": Object.freeze({ dark: Object.freeze([]) }),
  solarized: Object.freeze({
    dark: Object.freeze([
      Object.freeze({ pair: "text / panel", ratio: 4.1114, minimum: 4.5 }),
      Object.freeze({ pair: "danger / panel", ratio: 2.8108, minimum: 3 }),
    ]),
    light: Object.freeze([
      Object.freeze({ pair: "text / page", ratio: 4.1296, minimum: 4.5 }),
      Object.freeze({ pair: "text / panel", ratio: 3.6355, minimum: 4.5 }),
      Object.freeze({ pair: "muted text / panel", ratio: 4.3921, minimum: 4.5 }),
      Object.freeze({ pair: "accent text / accent", ratio: 2.9276, minimum: 4.5 }),
      Object.freeze({ pair: "accent / page", ratio: 2.9276, minimum: 3 }),
      Object.freeze({ pair: "accent / panel", ratio: 2.5774, minimum: 3 }),
      Object.freeze({ pair: "warning / page", ratio: 2.9754, minimum: 3 }),
      Object.freeze({ pair: "warning / panel", ratio: 2.6194, minimum: 3 }),
    ]),
  }),
  "ayu-mirage": Object.freeze({ dark: Object.freeze([
    Object.freeze({ pair: "muted text / page", ratio: 3.3563, minimum: 4.5 }),
    Object.freeze({ pair: "muted text / panel", ratio: 3.5849, minimum: 4.5 }),
  ]) }),
});
