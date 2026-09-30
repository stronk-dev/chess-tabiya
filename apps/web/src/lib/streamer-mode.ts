// ux-live-and-social.md §6 (LIV-a14): streamer mode is a posture on the learner's OWN screen —
// "hide my private information while I am on camera". It is chrome, in the same class as the theme:
// it hides, it never unlocks, and it never withholds. This module must stay unreachable from the
// assistance compiler in both directions; a fence test pins that.

export const STREAMER_MODES = Object.freeze(["off", "always", "in_run"] as const);
export type StreamerMode = (typeof STREAMER_MODES)[number];

export const STREAMER_MODE_KEY = "tabiya.streamer-mode.v1";

export const STREAMER_MODE_LABELS: Readonly<Record<StreamerMode, string>> = Object.freeze({
  off: "Off",
  always: "On everywhere",
  in_run: "Only while playing a run",
});

/** What the camera no longer sees on this screen. */
export const STREAMER_MODE_HIDES: readonly string[] = Object.freeze([
  "Your handle and the navigation bar",
  "Your rating on the Rating page",
  "The support style control, Inspector, and Support region",
  "Authored markers on the timeline",
]);

/** E2: the honest-absence line nobody writes, stated beside the control. */
export const STREAMER_MODE_LIMIT = "This hides panels on your screen. It does not change what your viewers see, and it does not withhold anything from your run.";

/** E4: one clause now, so "Stream" does not quietly mean two things. */
export const STREAMER_MODE_NOT_A_SESSION = "Streamer mode is not the Stream a rehearsal session on Live: it changes only what your own screen shows.";

export interface StreamerModeStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }

export function loadStreamerMode(storage: StreamerModeStorage | undefined): StreamerMode {
  try {
    const value = storage?.getItem(STREAMER_MODE_KEY);
    return (STREAMER_MODES as readonly string[]).includes(value ?? "") ? value as StreamerMode : "off";
  } catch {
    return "off";
  }
}

export function saveStreamerMode(mode: StreamerMode, storage: StreamerModeStorage | undefined): boolean {
  try {
    if (storage === undefined) return false;
    storage.setItem(STREAMER_MODE_KEY, mode);
    return true;
  } catch {
    return false;
  }
}

export function streamerModeActive(mode: StreamerMode, routeName: string): boolean {
  return mode === "always" || (mode === "in_run" && routeName === "run");
}

/**
 * The Z key flips what the screen shows right now: an active mode turns off; otherwise the learner's
 * last on-state returns if it applies here, else streamer mode turns on everywhere.
 */
export function toggledStreamerMode(mode: StreamerMode, lastOn: Exclude<StreamerMode, "off">, routeName: string): StreamerMode {
  if (streamerModeActive(mode, routeName)) return "off";
  return streamerModeActive(lastOn, routeName) ? lastOn : "always";
}
