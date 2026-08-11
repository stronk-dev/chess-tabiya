export type RegionKeyboardHandler = (event: KeyboardEvent) => boolean;
export type RegisterKeyboardRegion = (
  element: HTMLElement,
  handler: RegionKeyboardHandler,
) => () => void;

export const KEYBOARD_OWNERSHIP = Object.freeze({
  shell: Object.freeze(["g chords", "? outside a region", "Escape for shell overlays"]),
  drill: Object.freeze([
    "R",
    "Shift+R",
    "B",
    "1…9",
    "Tab inside the drill region",
    "ArrowLeft",
    "ArrowRight",
    "Space",
    "E",
    "? and Escape for drill overlays",
  ]),
  browser: Object.freeze(["Tab outside the drill region"]),
});

interface KeyboardActions {
  readonly navigate: (path: string) => void;
  readonly focusPrimaryNavigation: () => void;
  readonly openHelp: () => void;
  readonly closeHelp: () => void;
  readonly helpIsOpen: () => boolean;
}

interface RegionBinding {
  readonly element: HTMLElement;
  readonly handler: RegionKeyboardHandler;
}

const CHORD_ROUTES: Readonly<Record<string, string>> = Object.freeze({
  h: "/",
  p: "/play",
  l: "/learn",
  r: "/review",
  v: "/live",
  c: "/create",
  b: "/library",
  s: "/settings",
});

function effectiveTarget(event: KeyboardEvent): Node | null {
  return event.target instanceof Node ? event.target : document.activeElement;
}

function interactive(target: Node | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export class ShellKeyboardDispatcher {
  readonly #actions: KeyboardActions;
  #region: RegionBinding | undefined;
  #waitingForChord = false;
  #chordTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(actions: KeyboardActions) {
    this.#actions = actions;
  }

  readonly registerRegion: RegisterKeyboardRegion = (element, handler) => {
    const binding = Object.freeze({ element, handler });
    this.#region = binding;
    return () => {
      if (this.#region === binding) this.#region = undefined;
    };
  };

  handle(event: KeyboardEvent): void {
    const target = effectiveTarget(event);
    if (this.#waitingForChord) {
      event.preventDefault();
      this.#clearChord();
      const key = event.key.toLowerCase();
      if (key === "m") this.#actions.focusPrimaryNavigation();
      else {
        const path = CHORD_ROUTES[key];
        if (path !== undefined) this.#actions.navigate(path);
      }
      return;
    }

    const region = this.#region;
    if (
      region !== undefined &&
      target !== null &&
      region.element.contains(target) &&
      region.handler(event)
    ) {
      return;
    }

    if (interactive(target)) return;
    if (event.key.toLowerCase() === "g" && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      this.#waitingForChord = true;
      this.#chordTimer = setTimeout(() => this.#clearChord(), 1_200);
      return;
    }
    if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
      event.preventDefault();
      if (this.#actions.helpIsOpen()) this.#actions.closeHelp();
      else this.#actions.openHelp();
      return;
    }
    if (event.key === "Escape" && this.#actions.helpIsOpen()) {
      event.preventDefault();
      this.#actions.closeHelp();
    }
  }

  destroy(): void {
    this.#region = undefined;
    this.#clearChord();
  }

  #clearChord(): void {
    this.#waitingForChord = false;
    if (this.#chordTimer !== undefined) clearTimeout(this.#chordTimer);
    this.#chordTimer = undefined;
  }
}
