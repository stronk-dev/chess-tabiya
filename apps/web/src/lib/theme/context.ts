import { getContext, setContext } from "svelte";

import { ThemeController } from "./controller.js";

const THEME_CONTEXT = Symbol("tabiya-theme");

export function provideTheme(controller: ThemeController): ThemeController {
  setContext(THEME_CONTEXT, controller);
  return controller;
}

export function useTheme(): ThemeController {
  return getContext<ThemeController | undefined>(THEME_CONTEXT) ?? new ThemeController();
}
