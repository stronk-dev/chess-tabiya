import type { EngineSpec } from "./engine-supervisor.js";

export interface StrongEngineProfile {
  readonly movetimeMs: number;
  readonly threads: number;
  readonly hashMb: number;
  readonly multiPv: number;
}

export const DEFAULT_STRONG_ENGINE_PROFILE: StrongEngineProfile = Object.freeze({
  movetimeMs: 100,
  threads: 1,
  hashMb: 16,
  multiPv: 1,
});

function positiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new TypeError(`${label} must be a positive safe integer`);
  }
}

export function resolveStrongEngineProfile(
  overrides: Partial<StrongEngineProfile> = {},
): StrongEngineProfile {
  const profile = Object.freeze({ ...DEFAULT_STRONG_ENGINE_PROFILE, ...overrides });
  positiveInteger(profile.movetimeMs, "Strong-engine movetime");
  positiveInteger(profile.threads, "Strong-engine thread count");
  positiveInteger(profile.hashMb, "Strong-engine hash size");
  positiveInteger(profile.multiPv, "Strong-engine MultiPV");
  return profile;
}

export interface StockfishPlaySpecOptions {
  readonly command?: string;
  readonly args?: readonly string[];
  readonly profile?: Partial<StrongEngineProfile>;
  readonly version?: string;
}

export function stockfishPlaySpec(
  options: StockfishPlaySpecOptions = {},
): EngineSpec {
  const profile = resolveStrongEngineProfile(options.profile);
  return Object.freeze({
    id: "stockfish-play",
    kind: "opponent",
    command: options.command ?? "stockfish",
    ...(options.args === undefined ? {} : { args: Object.freeze([...options.args]) }),
    name: "Stockfish",
    ...(options.version === undefined ? {} : { version: options.version }),
    options: Object.freeze({
      Threads: profile.threads,
      Hash: profile.hashMb,
      MultiPV: profile.multiPv,
    }),
  });
}
