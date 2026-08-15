export const MINIMUM_RUN_VIEWPORT = Object.freeze({ width: 360, height: 680 });

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
      : `The run board needs at least ${MINIMUM_RUN_VIEWPORT.width} × ${MINIMUM_RUN_VIEWPORT.height} CSS pixels. Below that, 24-pixel chess-square targets and a fully visible board cannot both fit. Enlarge the window or rotate the device.`,
  });
}
