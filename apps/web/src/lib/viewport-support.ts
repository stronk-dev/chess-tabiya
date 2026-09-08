// WCAG 1.4.10's 320 CSS-pixel reflow width at 400% zoom commonly presents
// roughly 320 x 256. The run scrolls vertically at short heights rather than
// deleting the board.
export const MINIMUM_RUN_VIEWPORT = Object.freeze({ width: 320, height: 256 });

export interface RunViewportSupport {
  readonly supported: boolean;
  readonly width: number;
  readonly height: number;
  readonly reason: string | null;
}

export function runViewportSupport(width: number, height: number): RunViewportSupport {
  const supported = width >= MINIMUM_RUN_VIEWPORT.width && height >= MINIMUM_RUN_VIEWPORT.height;
  return Object.freeze({
    supported,
    width,
    height,
    reason: supported
      ? null
      : "There is not enough room to show a playable board. Make the window a little larger or rotate your device, then reopen the rehearsal.",
  });
}
