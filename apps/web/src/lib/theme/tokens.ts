export const THEME_TOKENS = Object.freeze([
  "paper",
  "panel",
  "surface",
  "ink",
  "muted",
  "line",
  "accent",
  "on-accent",
  "accent-soft",
  "warning",
  "danger",
  "shadow-color",
] as const);

export type ThemeToken = (typeof THEME_TOKENS)[number];
export type Palette = Readonly<Record<ThemeToken, string>>;

export const DERIVED_TOKENS = Object.freeze([
  "shadow",
  "scrim",
  "scrim-strong",
  "display-font",
] as const);
