import type { PreferenceStorage } from "../assistance-preference.js";
import {
  DEFAULT_THEME_PREFERENCE,
  type AnimationPreference,
  type ThemeMode,
  type ThemePreference,
} from "./axes.js";
import { APP_THEMES, MODE_DEFAULT } from "./catalog.js";
import { loadThemePreference, saveThemePreference } from "./preference.js";
import { THEME_TOKENS } from "./tokens.js";

export interface ResolvedTheme {
  preference: ThemePreference;
  mode: ThemeMode;
  appTheme: keyof typeof APP_THEMES;
  animation: AnimationPreference;
}

export interface MediaQueryLike {
  matches: boolean;
  addEventListener(type: "change", listener: () => void): void;
  removeEventListener(type: "change", listener: () => void): void;
}

export function resolveTheme(
  preference: ThemePreference,
  deviceDark: boolean,
  reducedMotion: boolean,
): ResolvedTheme {
  const mode = preference.modeOverride ?? (deviceDark ? "dark" : "light");
  const selected = APP_THEMES[preference.appTheme];
  const appTheme = selected.modes.includes(mode) ? preference.appTheme : MODE_DEFAULT[mode];
  return Object.freeze({
    preference,
    mode,
    appTheme,
    animation: reducedMotion ? "none" : preference.animation,
  });
}

export function animationConfig(preference: AnimationPreference): { enabled: boolean; duration: number } {
  if (preference === "none") return { enabled: false, duration: 0 };
  return { enabled: true, duration: preference === "fast" ? 120 : 250 };
}

export class ThemeController {
  #preference: ThemePreference;
  #resolved: ResolvedTheme;
  #listeners = new Set<(value: ResolvedTheme) => void>();
  #deviceDark = false;
  #reducedMotion = false;
  #deviceQuery: MediaQueryLike | undefined;
  #motionQuery: MediaQueryLike | undefined;
  #root: HTMLElement | undefined;

  constructor(private readonly storage?: PreferenceStorage) {
    this.#preference = loadThemePreference(this.#storage());
    this.#resolved = resolveTheme(this.#preference, false, false);
  }

  get current(): ResolvedTheme { return this.#resolved; }

  start(root: HTMLElement = document.documentElement): () => void {
    this.#root = root;
    if (typeof globalThis.matchMedia === "function") {
      this.#deviceQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
      this.#motionQuery = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
      this.#deviceDark = this.#deviceQuery.matches;
      this.#reducedMotion = this.#motionQuery.matches;
      this.#deviceQuery.addEventListener("change", this.#mediaChanged);
      this.#motionQuery.addEventListener("change", this.#mediaChanged);
    }
    globalThis.addEventListener?.("storage", this.#storageChanged);
    this.#commit(false);
    return () => this.stop();
  }

  stop(): void {
    this.#deviceQuery?.removeEventListener("change", this.#mediaChanged);
    this.#motionQuery?.removeEventListener("change", this.#mediaChanged);
    globalThis.removeEventListener?.("storage", this.#storageChanged);
    this.#deviceQuery = undefined;
    this.#motionQuery = undefined;
    this.#root = undefined;
  }

  subscribe(listener: (value: ResolvedTheme) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#resolved);
    return () => this.#listeners.delete(listener);
  }

  update(patch: Partial<ThemePreference>): void {
    this.#preference = Object.freeze({ ...this.#preference, ...patch });
    this.#commit(true);
  }

  #mediaChanged = (): void => {
    this.#deviceDark = this.#deviceQuery?.matches ?? false;
    this.#reducedMotion = this.#motionQuery?.matches ?? false;
    this.#commit(false);
  };

  #storageChanged = (event: Event): void => {
    if ("key" in event && (event as StorageEvent).key !== "tabiya.theme") return;
    this.#preference = loadThemePreference(this.#storage());
    this.#commit(false);
  };

  #commit(persist: boolean): void {
    this.#resolved = resolveTheme(this.#preference, this.#deviceDark, this.#reducedMotion);
    if (persist) saveThemePreference(this.#preference, this.#storage());
    this.#apply();
    for (const listener of this.#listeners) listener(this.#resolved);
  }

  #apply(): void {
    const root = this.#root;
    if (root === undefined) return;
    const palette = APP_THEMES[this.#resolved.appTheme].palettes[this.#resolved.mode];
    if (palette === undefined) throw new TypeError(`Theme ${this.#resolved.appTheme} has no ${this.#resolved.mode} palette`);
    root.dataset.appTheme = this.#resolved.appTheme;
    root.dataset.mode = this.#resolved.mode;
    root.dataset.boardTheme = this.#preference.boardTheme;
    root.dataset.pieceSet = this.#preference.pieceSet;
    root.style.colorScheme = this.#resolved.mode;
    for (const token of THEME_TOKENS) root.style.setProperty(`--${token}`, palette[token]);
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", palette.paper);
  }

  #storage(): PreferenceStorage | undefined {
    if (this.storage !== undefined) return this.storage;
    try { return globalThis.localStorage; } catch { return undefined; }
  }
}

export function inertThemeController(): ThemeController {
  return new ThemeController({ getItem: () => null, setItem: () => undefined });
}
