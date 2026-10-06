import type { AssistanceConfig } from "./assistance.js";

// The current registered assistance head. V5/hintDistance remains a separate, unlanded claim.
export const ASSISTANCE_PREFERENCE_FIELDS = Object.freeze([
  "markers", "guided", "humanSplit", "corpus", "voice", "spoken",
  "boardLighting", "arrows", "ambient",
] as const satisfies readonly (keyof Omit<AssistanceConfig, "version">)[]);
export type AssistancePreferenceField = (typeof ASSISTANCE_PREFERENCE_FIELDS)[number];
export type AssistancePreferenceFields = Readonly<Pick<Omit<AssistanceConfig, "version">, AssistancePreferenceField>>;

type FieldDomains = { readonly [K in keyof Omit<AssistanceConfig, "version">]: readonly AssistanceConfig[K][] };
/** Lowest → highest; shared by persistence and the preset narrowing algebra. */
export const ASSISTANCE_FIELD_DOMAINS: FieldDomains = Object.freeze({
  markers: Object.freeze(["off", "live"] as const),
  guided: Object.freeze(["off", "live"] as const),
  humanSplit: Object.freeze(["off", "on_request"] as const),
  corpus: Object.freeze(["off", "on_request"] as const),
  voice: Object.freeze(["authored", "persona"] as const),
  spoken: Object.freeze(["off", "browser", "provider"] as const),
  boardLighting: Object.freeze(["off", "legal", "sight", "evidence"] as const),
  arrows: Object.freeze(["off", "sight", "evidence"] as const),
  ambient: Object.freeze(["off", "on"] as const),
});

export class AssistanceCodecError extends TypeError {
  constructor(readonly code: "ASSISTANCE_SHAPE" | "ASSISTANCE_VALUE" | "ASSISTANCE_VERSION", message: string) {
    super(`${code}: ${message}`);
    this.name = "AssistanceCodecError";
  }
}

function plain(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype && Reflect.ownKeys(value).every((key) =>
      typeof key === "string" && Object.getOwnPropertyDescriptor(value, key)?.enumerable === true &&
      Object.hasOwn(Object.getOwnPropertyDescriptor(value, key)!, "value"));
}

/** One validator for sparse overrides and complete current-head fields. */
export function parseAssistancePreferenceFields(value: unknown, complete = false): Readonly<Partial<AssistancePreferenceFields>> {
  if (!plain(value)) throw new AssistanceCodecError("ASSISTANCE_SHAPE", "expected plain assistance fields");
  const keys = Object.keys(value);
  if (keys.some((key) => !(ASSISTANCE_PREFERENCE_FIELDS as readonly string[]).includes(key)) ||
      (complete && keys.length !== ASSISTANCE_PREFERENCE_FIELDS.length)) {
    throw new AssistanceCodecError("ASSISTANCE_SHAPE", "unknown or missing assistance field");
  }
  const out: Record<string, string> = {};
  for (const field of ASSISTANCE_PREFERENCE_FIELDS) {
    if (!Object.hasOwn(value, field)) continue;
    const selected = value[field];
    if (typeof selected !== "string" || !(ASSISTANCE_FIELD_DOMAINS[field] as readonly string[]).includes(selected)) {
      throw new AssistanceCodecError("ASSISTANCE_VALUE", `invalid ${field} value`);
    }
    out[field] = selected;
  }
  return Object.freeze(out) as Readonly<Partial<AssistancePreferenceFields>>;
}

/** Parse only the landed head; this does not silently adopt a future config version. */
export function parseAssistanceConfig(value: unknown): AssistanceConfig {
  if (!plain(value) || !Object.hasOwn(value, "version")) throw new AssistanceCodecError("ASSISTANCE_SHAPE", "expected versioned assistance config");
  if (value.version !== 4) throw new AssistanceCodecError("ASSISTANCE_VERSION", "expected registered assistance head 4");
  const { version: _version, ...fields } = value;
  return Object.freeze({ version: 4, ...parseAssistancePreferenceFields(fields, true) }) as AssistanceConfig;
}

export interface AssistanceMigration {
  readonly config: AssistanceConfig;
  readonly sourceVersion: 1 | 2 | 3 | 4;
}

/**
 * Pure, one-way v1–v4 migration preserving source version and established defaults.
 * Historical browser migration ignored extra keys; keep that admission grammar here,
 * never copy those keys into the closed current config or adopt a future version.
 */
export function migrateAssistanceConfig(value: unknown): AssistanceMigration {
  if (!plain(value)) throw new AssistanceCodecError("ASSISTANCE_SHAPE", "expected plain legacy assistance config");
  if (value.version === 4) {
    const fields = Object.fromEntries(ASSISTANCE_PREFERENCE_FIELDS.map((field) => [field, value[field]]));
    return Object.freeze({ config: parseAssistanceConfig({ version: 4, ...fields }), sourceVersion: 4 });
  }
  if (value.version !== 1 && value.version !== 2 && value.version !== 3) {
    throw new AssistanceCodecError("ASSISTANCE_VERSION", "unsupported assistance version");
  }
  const sourceVersion = value.version;
  if (sourceVersion === 3 && value.spoken !== "off" && value.spoken !== "on") {
    throw new AssistanceCodecError("ASSISTANCE_VALUE", "invalid legacy spoken value");
  }
  const config = parseAssistanceConfig({
    version: 4, markers: value.markers, guided: value.guided, humanSplit: value.humanSplit,
    corpus: sourceVersion >= 2 ? value.corpus : "off", voice: value.voice,
    spoken: sourceVersion === 3 && value.spoken === "on" ? "browser" : "off",
    boardLighting: "legal", arrows: "off", ambient: "off",
  });
  return Object.freeze({ config, sourceVersion });
}
