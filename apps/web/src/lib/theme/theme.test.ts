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
  MARK_BRUSHES,
  MODE_DEFAULT,
  TOKYO_NIGHT_DARK,
  TOKYO_NIGHT_LIGHT,
} from "./catalog.js";
import { animationConfig, resolveTheme, ThemeController } from "./controller.js";
import { loadThemePreference, THEME_STORAGE_KEY } from "./preference.js";
import { DERIVED_TOKENS, THEME_TOKENS } from "./tokens.js";

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
    expect(resolveTheme(DEFAULT_THEME_PREFERENCE, false, false).appTheme).toBe("paper");
    expect(resolveTheme(DEFAULT_THEME_PREFERENCE, true, false).appTheme).toBe("warm-dark");
    expect(resolveTheme({ ...DEFAULT_THEME_PREFERENCE, appTheme: "tokyo-night" }, true, false).appTheme).toBe("tokyo-night");
    expect(resolveTheme(DEFAULT_THEME_PREFERENCE, false, true).animation).toBe("none");
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
    expect(APP_THEME_IDS).toHaveLength(3);
    expect(BOARD_THEME_IDS).toHaveLength(2);
    expect(PIECE_SET_IDS).toHaveLength(2);
    expect(APP_THEME_IDS.length * BOARD_THEME_IDS.length * PIECE_SET_IDS.length).toBe(12);
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

  it("pins inherited palette bytes and all published contrast measurements", () => {
    expect(TOKYO_NIGHT_DARK).toEqual({ paper: "#1a1b26", panel: "#1f2335", surface: "#15161e", ink: "#c0caf5", muted: "#a9b1d6", line: "#414868", accent: "#7aa2f7", "on-accent": "#1a1b26", "accent-soft": "#292e42", warning: "#e0af68", danger: "#f7768e", "shadow-color": "rgb(0 0 0 / 40%)" });
    expect(TOKYO_NIGHT_LIGHT).toEqual({ paper: "#e1e2e7", panel: "#d5d6db", surface: "#c8c9ce", ink: "#3b4261", muted: "#4e5772", line: "#b4b5b9", accent: "#2e7de9", "on-accent": "#ffffff", "accent-soft": "#c8c9ce", warning: "#8c6c3e", danger: "#f52a65", "shadow-color": "rgb(0 0 0 / 12%)" });
    const expected = {
      dark: [10.5870, 9.6350, 8.0955, 7.3676, 6.7867, 6.7867, 6.1765, 8.5468, 7.7783, 6.4596, 5.8788],
      light: [7.5936, 6.7688, 5.5402, 4.9385, 4.0182, 3.1062, 2.7689, 3.7495, 3.3422, 3.0054, 2.6790],
    };
    for (const mode of ["dark", "light"] as const) {
      const palette = APP_THEMES["tokyo-night"].palettes[mode]!;
      const pairs = [[palette.ink, palette.paper], [palette.ink, palette.panel], [palette.muted, palette.paper], [palette.muted, palette.panel], [palette["on-accent"], palette.accent], [palette.accent, palette.paper], [palette.accent, palette.panel], [palette.warning, palette.paper], [palette.warning, palette.panel], [palette.danger, palette.paper], [palette.danger, palette.panel]];
      expect(pairs.map(([a, b]) => contrast(a!, b!))).toEqual(expected[mode].map((value) => expect.closeTo(value, 3)));
    }
  });

  it("keeps brushes, board evidence paint, and status identities separated", () => {
    const brushes = Object.values(MARK_BRUSHES).map((brush) => rgb(brush.color));
    for (let left = 0; left < brushes.length; left += 1) {
      for (let right = left + 1; right < brushes.length; right += 1) {
        expect(deltaE(brushes[left]!, brushes[right]!)).toBeGreaterThanOrEqual(20);
      }
    }
    const boards = [["#f0d9b5", "#c0ae91"], ["#f0d9a8", "#96a25e"]] as const;
    const paints = [[155, 199, 0, 0.41], [20, 85, 30, 0.5], [20, 30, 85, 0.5]] as const;
    for (const board of boards) for (const square of board) for (const paint of paints) {
      expect(deltaE(composite(paint, rgb(square)), rgb(square))).toBeGreaterThanOrEqual(20);
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

    for (const file of files.filter((path) => path.endsWith(".svelte") && !path.includes("/theme/"))) {
      if (file.endsWith("GameStoryScreen.svelte")) continue;
      expect(readFileSync(file, "utf8"), relative(sourceDirectory, file)).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/iu);
    }
    for (const file of filesBelow(join(themeDirectory, "board-skins"))) {
      expect(readFileSync(file, "utf8")).not.toMatch(/last-move|selected|move-dest|check|premove/u);
    }
    expect(Object.keys(MARK_BRUSHES)).toEqual(["green", "red", "blue", "yellow"]);
    const manifest = JSON.parse(readFileSync(join(sourceDirectory, "..", "public", "manifest.webmanifest"), "utf8")) as Record<string, unknown>;
    expect(manifest.theme_colors).toEqual({ light: "#eeeade", dark: "#16140f" });
  });
});
