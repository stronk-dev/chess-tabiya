// @vitest-environment happy-dom

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { AssistanceConfig } from "@chess-tabiya/runtime";
import {
  APP_THEME_IDS,
  BOARD_THEME_IDS,
  DEFAULT_THEME_PREFERENCE,
  PIECE_SET_IDS,
  type ThemePreference,
} from "./axes.js";
import { THEME_ARTWORK_ASSETS } from "./assets.js";
import {
  APP_THEMES,
  INHERITED_CONTRAST_NOTICES,
  MARK_BRUSHES,
  MODE_DEFAULT,
} from "./catalog.js";
import { animationConfig, resolveTheme, ThemeController } from "./controller.js";
import { loadThemePreference, THEME_STORAGE_KEY } from "./preference.js";
import { DERIVED_TOKENS, THEME_TOKENS, type Palette } from "./tokens.js";

const themeDirectory = dirname(fileURLToPath(import.meta.url));
const sourceDirectory = join(themeDirectory, "..", "..");

function filesBelow(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((left, right) => right - left);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

type Rgb = readonly [number, number, number];
function rgb(hex: string): Rgb {
  return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16)) as unknown as Rgb;
}
function composite(foreground: readonly [number, number, number, number], background: Rgb): Rgb {
  return foreground.slice(0, 3).map((channel, index) => channel! * foreground[3] + background[index]! * (1 - foreground[3])) as unknown as Rgb;
}
function mix(first: Rgb, second: Rgb, firstShare: number): Rgb {
  return first.map((channel, index) => channel * firstShare + second[index]! * (1 - firstShare)) as unknown as Rgb;
}
function lab(value: Rgb): Rgb {
  const [red, green, blue] = value.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  const x = (0.4124564 * red! + 0.3575761 * green! + 0.1804375 * blue!) / 0.95047;
  const y = 0.2126729 * red! + 0.7151522 * green! + 0.072175 * blue!;
  const z = (0.0193339 * red! + 0.119192 * green! + 0.9503041 * blue!) / 1.08883;
  const convert = (component: number): number => component > 216 / 24389 ? Math.cbrt(component) : (24389 / 27 * component + 16) / 116;
  const fx = convert(x), fy = convert(y), fz = convert(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function deltaE(first: Rgb, second: Rgb): number {
  const left = lab(first), right = lab(second);
  return Math.sqrt(left.reduce((sum, value, index) => sum + (value - right[index]!) ** 2, 0));
}

const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/iu;
const NAMED_COLOR_DECLARATION = /\b(?:color|background(?:-color)?|border(?:-color)?|outline(?:-color)?|fill|stroke)\s*:[^;}\n]*\b(?:white|black|Canvas|CanvasText)\b/iu;

function boardSquares(id: "brown" | "olive"): readonly [string, string] {
  const source = readFileSync(join(themeDirectory, "board-skins", `${id}.css`), "utf8");
  const light = source.match(/background-color:\s*(#[0-9a-f]{6})/iu)?.[1];
  if (light === undefined) throw new Error(`${id} has no declared light square`);
  const explicitDark = source.match(/repeating-conic-gradient\(\s*(#[0-9a-f]{6})/iu)?.[1];
  if (explicitDark !== undefined) return [light, explicitDark];
  const encoded = source.match(/base64,([^')]+)/u)?.[1];
  if (encoded === undefined) throw new Error(`${id} has no derivable dark square`);
  const svg = Buffer.from(encoded, "base64").toString("utf8");
  const opacity = Number(svg.match(/<rect[^>]*\bid="f"[^>]*\bopacity="([0-9.]+)"/u)?.[1]);
  if (!Number.isFinite(opacity)) throw new Error(`${id} dark-square overlay has no opacity`);
  const dark = composite([0, 0, 0, opacity], rgb(light));
  return [light, `#${dark.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`];
}

describe("theme foundation", () => {
  it("loads each preference field independently and claims no version", () => {
    const storage = {
      getItem: (key: string) => key === THEME_STORAGE_KEY ? JSON.stringify({
        appTheme: "tokyo-night",
        boardTheme: "missing",
        pieceSet: "mono",
        modeOverride: "dark",
        animation: "warp",
        version: 9000,
      }) : null,
      setItem() {},
    };
    expect(loadThemePreference(storage)).toEqual({
      appTheme: "tokyo-night",
      boardTheme: "brown",
      pieceSet: "mono",
      modeOverride: "dark",
      animation: "normal",
    });
  });

  it("resolves device mode, fallback, reduced motion, and three animation levels", () => {
    expect(resolveTheme(DEFAULT_THEME_PREFERENCE, false, false)).toMatchObject({ appTheme: "paper", reducedMotion: false });
    expect(resolveTheme(DEFAULT_THEME_PREFERENCE, true, false)).toMatchObject({ appTheme: "warm-dark", reducedMotion: false });
    expect(resolveTheme({ ...DEFAULT_THEME_PREFERENCE, appTheme: "tokyo-night" }, true, false).appTheme).toBe("tokyo-night");
    expect(resolveTheme(DEFAULT_THEME_PREFERENCE, false, true)).toMatchObject({ animation: "none", reducedMotion: true });
    expect(animationConfig("none")).toEqual({ enabled: false, duration: 0 });
    expect(animationConfig("fast")).toEqual({ enabled: true, duration: 120 });
    expect(animationConfig("normal")).toEqual({ enabled: true, duration: 250 });
    for (const mode of ["light", "dark"] as const) {
      expect(APP_THEMES[MODE_DEFAULT[mode]].origin).toBe("tabiya");
      expect(APP_THEMES[MODE_DEFAULT[mode]].modes).toContain(mode);
    }
  });

  it("applies all axes without changing any other selection", () => {
    document.head.innerHTML = '<meta name="theme-color" content="">';
    const values = new Map<string, string>();
    const controller = new ThemeController({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });
    controller.start(document.documentElement);
    controller.update({ boardTheme: "olive" });
    expect(controller.current.preference).toEqual({ ...DEFAULT_THEME_PREFERENCE, boardTheme: "olive" });
    controller.update({ pieceSet: "mono" });
    expect(controller.current.preference.appTheme).toBe("paper");
    expect(controller.current.preference.boardTheme).toBe("olive");
    expect(document.documentElement.dataset.pieceSet).toBe("mono");
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe("#eeeade");
    expect(JSON.parse(values.get(THEME_STORAGE_KEY) ?? "{}")).not.toHaveProperty("version");
    values.set(THEME_STORAGE_KEY, JSON.stringify({ ...DEFAULT_THEME_PREFERENCE, appTheme: "tokyo-night", pieceSet: "mono" }));
    globalThis.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY }));
    expect(controller.current.preference.pieceSet).toBe("mono");
    expect(document.documentElement.dataset.appTheme).toBe("tokyo-night");
    controller.stop();
  });

  it("ships total catalogs and a complete cross-product", () => {
    expect(APP_THEME_IDS).toEqual([
      "paper", "tokyo-night", "dracula", "nord", "catppuccin", "gruvbox",
      "one-dark", "github-dark", "rose-pine", "solarized", "ayu-mirage", "warm-dark",
    ]);
    expect(BOARD_THEME_IDS).toHaveLength(2);
    expect(PIECE_SET_IDS).toHaveLength(2);
    expect(APP_THEME_IDS.length * BOARD_THEME_IDS.length * PIECE_SET_IDS.length).toBe(48);
    for (const theme of Object.values(APP_THEMES)) {
      for (const mode of theme.modes) {
        const palette = theme.palettes[mode];
        expect(palette).toBeDefined();
        for (const token of THEME_TOKENS) expect(palette?.[token]).toBeTruthy();
      }
    }
  });

  it("gates Tabiya palettes at the specified WCAG floors", () => {
    for (const theme of Object.values(APP_THEMES).filter((item) => item.origin === "tabiya")) {
      for (const mode of theme.modes) {
        const palette = theme.palettes[mode]!;
        for (const [foreground, background] of [
          ["ink", "paper"], ["ink", "panel"], ["muted", "paper"], ["muted", "panel"], ["on-accent", "accent"],
        ] as const) expect(contrast(palette[foreground], palette[background])).toBeGreaterThanOrEqual(4.5);
        for (const foreground of ["accent", "warning", "danger"] as const) {
          expect(Math.min(contrast(palette[foreground], palette.paper), contrast(palette[foreground], palette.panel))).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it("pins every inherited palette and derives complete low-contrast disclosures", () => {
    const values = (palette: Palette): readonly string[] => [
      palette.paper, palette.panel, palette.surface, palette.ink, palette.muted, palette.line,
      palette.accent, palette["on-accent"], palette["accent-soft"], palette.warning,
      palette.danger, palette["shadow-color"],
    ];
    const expected: Readonly<Record<string, readonly string[]>> = {
      "tokyo-night/dark": ["#1a1b26", "#1f2335", "#15161e", "#c0caf5", "#a9b1d6", "#414868", "#7aa2f7", "#1a1b26", "#292e42", "#e0af68", "#f7768e", "rgb(0 0 0 / 40%)"],
      "tokyo-night/light": ["#e1e2e7", "#d5d6db", "#c8c9ce", "#3b4261", "#4e5772", "#b4b5b9", "#2e7de9", "#ffffff", "#c8c9ce", "#8c6c3e", "#f52a65", "rgb(0 0 0 / 12%)"],
      "dracula/dark": ["#282a36", "#44475a", "#1e1f29", "#f8f8f2", "#bd93f9", "#6272a4", "#bd93f9", "#282a36", "#383a4a", "#f1fa8c", "#ff5555", "rgb(0 0 0 / 50%)"],
      "nord/dark": ["#2e3440", "#3b4252", "#272c36", "#eceff4", "#d8dee9", "#4c566a", "#88c0d0", "#2e3440", "#434c5e", "#ebcb8b", "#bf616a", "rgb(0 0 0 / 40%)"],
      "catppuccin/dark": ["#1e1e2e", "#313244", "#181825", "#cdd6f4", "#bac2de", "#585b70", "#cba6f7", "#1e1e2e", "#45475a", "#f9e2af", "#f38ba8", "rgb(0 0 0 / 40%)"],
      "catppuccin/light": ["#eff1f5", "#ccd0da", "#dce0e8", "#4c4f69", "#5c5f77", "#9ca0b0", "#8839ef", "#ffffff", "#ccd0da", "#df8e1d", "#d20f39", "rgb(0 0 0 / 10%)"],
      "gruvbox/dark": ["#282828", "#3c3836", "#1d2021", "#ebdbb2", "#d5c4a1", "#665c54", "#d79921", "#282828", "#504945", "#fabd2f", "#fb4934", "rgb(0 0 0 / 50%)"],
      "gruvbox/light": ["#fbf1c7", "#ebdbb2", "#f2e5bc", "#3c3836", "#504945", "#a89984", "#d79921", "#282828", "#ebdbb2", "#b57614", "#cc241d", "rgb(0 0 0 / 12%)"],
      "one-dark/dark": ["#282c34", "#2c313a", "#21252b", "#abb2bf", "#9da5b4", "#3e4451", "#61afef", "#282c34", "#3a3f4b", "#e5c07b", "#e06c75", "rgb(0 0 0 / 50%)"],
      "github-dark/dark": ["#0d1117", "#161b22", "#010409", "#e6edf3", "#8b949e", "#30363d", "#58a6ff", "#0d1117", "#21262d", "#d29922", "#f85149", "rgb(0 0 0 / 60%)"],
      "rose-pine/dark": ["#191724", "#1f1d2e", "#13111e", "#e0def4", "#908caa", "#524f67", "#c4a7e7", "#191724", "#26233a", "#f6c177", "#eb6f92", "rgb(0 0 0 / 50%)"],
      "solarized/dark": ["#002b36", "#073642", "#00212b", "#839496", "#93a1a1", "#586e75", "#2aa198", "#002b36", "#0a4050", "#b58900", "#dc322f", "rgb(0 0 0 / 40%)"],
      "solarized/light": ["#fdf6e3", "#eee8d5", "#f5efdc", "#657b83", "#586e75", "#93a1a1", "#2aa198", "#fdf6e3", "#eee8d5", "#b58900", "#dc322f", "rgb(0 0 0 / 10%)"],
      "ayu-mirage/dark": ["#242936", "#1f2430", "#1a1e29", "#cccac2", "#707a8c", "#565b70", "#ffad66", "#242936", "#2d3441", "#ffd580", "#f28779", "rgb(0 0 0 / 50%)"],
    };
    const inherited = Object.values(APP_THEMES).filter((theme) => theme.origin === "inherited");
    expect(inherited.flatMap((theme) => theme.modes.map((mode) => `${theme.id}/${mode}`)).sort())
      .toEqual(Object.keys(expected).sort());
    for (const theme of inherited) for (const mode of theme.modes) {
      const palette = theme.palettes[mode]!;
      expect(values(palette), `${theme.id}/${mode}`).toEqual(expected[`${theme.id}/${mode}`]);
      const pairs = [
        ["text / page", palette.ink, palette.paper, 4.5],
        ["text / panel", palette.ink, palette.panel, 4.5],
        ["muted text / page", palette.muted, palette.paper, 4.5],
        ["muted text / panel", palette.muted, palette.panel, 4.5],
        ["accent text / accent", palette["on-accent"], palette.accent, 4.5],
        ["accent / page", palette.accent, palette.paper, 3],
        ["accent / panel", palette.accent, palette.panel, 3],
        ["warning / page", palette.warning, palette.paper, 3],
        ["warning / panel", palette.warning, palette.panel, 3],
        ["danger / page", palette.danger, palette.paper, 3],
        ["danger / panel", palette.danger, palette.panel, 3],
      ] as const;
      const expectedNotices = pairs.flatMap(([pair, foreground, background, minimum]) => {
        const ratio = contrast(foreground, background);
        return ratio < minimum ? [{ pair, ratio, minimum }] : [];
      });
      const actualNotices = INHERITED_CONTRAST_NOTICES[theme.id]?.[mode];
      expect(actualNotices?.map(({ pair, minimum }) => ({ pair, minimum })), `${theme.id}/${mode} notice population`)
        .toEqual(expectedNotices.map(({ pair, minimum }) => ({ pair, minimum })));
      expect(actualNotices?.map(({ ratio }) => ratio), `${theme.id}/${mode} notice measurements`)
        .toEqual(expectedNotices.map(({ ratio }) => expect.closeTo(ratio, 3)));
    }
  });

  it("keeps brushes, board evidence paint, and status identities separated", () => {
    const brushes = Object.values(MARK_BRUSHES).map((brush) => rgb(brush.color));
    for (let left = 0; left < brushes.length; left += 1) {
      for (let right = left + 1; right < brushes.length; right += 1) {
        expect(deltaE(brushes[left]!, brushes[right]!)).toBeGreaterThanOrEqual(20);
      }
    }
    const boards = [boardSquares("brown"), boardSquares("olive")];
    for (const theme of Object.values(APP_THEMES)) for (const mode of theme.modes) {
      const palette = theme.palettes[mode]!;
      const anchor = rgb(mode === "dark" ? palette.surface : palette.ink);
      const paints = [
        [...mix(rgb(palette.warning), anchor, 0.1), 0.75],
        [...mix(rgb(palette.accent), anchor, 0.2), 0.65],
        [...mix(rgb(palette.muted), anchor, 0.3), 0.65],
        [...mix(rgb(palette.accent), anchor, 0.2), 0.75], // occupied destination ring
      ] as readonly (readonly [number, number, number, number])[];
      for (const board of boards) for (const square of board) for (const paint of paints) {
        expect(deltaE(composite(paint, rgb(square)), rgb(square)), `${theme.id}/${mode} on ${square}`).toBeGreaterThanOrEqual(20);
      }
    }
    for (const theme of Object.values(APP_THEMES)) for (const mode of theme.modes) {
      const palette = theme.palettes[mode]!;
      expect(deltaE(rgb(palette.warning), rgb(palette.danger))).toBeGreaterThanOrEqual(20);
    }
  });

  it("keeps appearance disjoint from assistance and registers every artwork file", () => {
    type Shared = keyof ThemePreference & keyof AssistanceConfig;
    const noSharedKey: Shared extends never ? true : false = true;
    expect(noSharedKey).toBe(true);
    const registered = new Set(THEME_ARTWORK_ASSETS.map((asset) => asset.file));
    for (const directory of ["board-skins", "piece-skins"]) {
      for (const file of filesBelow(join(themeDirectory, directory))) {
        expect(registered.has(`${directory}/${relative(join(themeDirectory, directory), file)}`)).toBe(true);
      }
    }
    expect(registered.has("@lichess-org/chessground/assets/chessground.cburnett.css")).toBe(true);
    const themeImports = filesBelow(themeDirectory).filter((file) => /\.(?:ts|svelte)$/u.test(file)).map((file) => readFileSync(file, "utf8")).join("\n")
      .replaceAll('import type { PreferenceStorage } from "../assistance-preference.js";', "");
    expect(themeImports).not.toMatch(/from\s+["'][^"']*(?:assistance-preference|assistance-|preset)[^"']*["']/u);
    const outsideImports = filesBelow(sourceDirectory).filter((file) => /assistance[^/]*\.(?:ts|svelte)$/u.test(file)).map((file) => readFileSync(file, "utf8")).join("\n");
    expect(outsideImports).not.toMatch(/from\s+["'][^"']*\/theme\//u);
  });

  it("has no phantom tokens, retired surface tokens, stray colors, or board paint leakage", () => {
    const files = filesBelow(sourceDirectory).filter((file) => /\.(?:svelte|css)$/u.test(file));
    const source = files.map((file) => readFileSync(file, "utf8")).join("\n");
    const declared = new Set<string>([...THEME_TOKENS, ...DERIVED_TOKENS]);
    for (const match of source.matchAll(/--([a-z][a-z0-9-]+)\s*:/gu)) declared.add(match[1]!);
    for (const match of source.matchAll(/var\(--([a-z][a-z0-9-]+)/gu)) expect(declared.has(match[1]!)).toBe(true);
    expect(source).not.toMatch(/--(?:paper|panel)-soft\b/u);

    const literalAuthorities = new Set([
      join(themeDirectory, "base.css"),
      ...filesBelow(join(themeDirectory, "board-skins")),
      ...filesBelow(join(themeDirectory, "piece-skins")),
    ]);
    const systemColorAuthorities = new Set([
      join(sourceDirectory, "accessibility.css"), // Forced-colors mode must use the OS high-contrast palette.
    ]);
    expect(COLOR_LITERAL.test("color: #fff")).toBe(true);
    expect(NAMED_COLOR_DECLARATION.test("background: white")).toBe(true);
    expect(NAMED_COLOR_DECLARATION.test("color: CanvasText")).toBe(true);
    expect(files.some((path) => path.endsWith(".css") && !literalAuthorities.has(path))).toBe(true);
    for (const file of files) {
      const contents = readFileSync(file, "utf8");
      if (!literalAuthorities.has(file)) expect(contents, relative(sourceDirectory, file)).not.toMatch(COLOR_LITERAL);
      if (!systemColorAuthorities.has(file)) expect(contents, relative(sourceDirectory, file)).not.toMatch(NAMED_COLOR_DECLARATION);
    }
    for (const file of filesBelow(join(themeDirectory, "board-skins"))) {
      expect(readFileSync(file, "utf8")).not.toMatch(/last-move|selected|move-dest|check|premove/u);
    }
    const interactionPaint = readFileSync(join(themeDirectory, "interaction-paint.css"), "utf8");
    expect(interactionPaint).not.toMatch(COLOR_LITERAL);
    for (const token of ["interaction-move", "interaction-history", "interaction-premove", "interaction-check", "interaction-contrast", "interaction-dark-anchor"]) {
      expect(interactionPaint).toContain(`var(--${token})`);
    }
    expect(Object.keys(MARK_BRUSHES)).toEqual(["green", "red", "blue", "yellow"]);
    const manifest = JSON.parse(readFileSync(join(sourceDirectory, "..", "public", "manifest.webmanifest"), "utf8")) as Record<string, unknown>;
    expect(manifest.theme_colors).toEqual({ light: "#eeeade", dark: "#16140f" });
  });

  it("keeps critical board states distinguishable without hue alone", () => {
    const paint = readFileSync(join(themeDirectory, "interaction-paint.css"), "utf8");
    expect(paint).toMatch(/square\.last-move\s*\{[^}]*box-shadow:/su);
    expect(paint).toMatch(/square\.check\s*\{[^}]*box-shadow:/su);
    const accessibility = readFileSync(join(sourceDirectory, "accessibility.css"), "utf8");
    expect(accessibility).toMatch(/@media \(forced-colors: active\)/u);
    for (const selector of ["move-dest", "oc.move-dest", "last-move", "selected", "check", "current-premove"]) {
      expect(accessibility).toContain(`square.${selector}`);
    }
  });
});
