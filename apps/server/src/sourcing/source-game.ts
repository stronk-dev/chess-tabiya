// rfc/famous-games.md §3 — the typed identity of a cited game.
//
// The RFC places this object at `$defs/provenance.sourceGame` under pack-schema lane 0.31. That lane
// sits behind lane 0.30 (`pack-capability-contract.md`, unlanded), and landing order follows the
// numbers (rfc/README.md §Pack-schema-version register), so the pack schema is NOT changed here.
// Until the lane lands, the sourcing lane derives the object and writes it beside the candidate as
// `source-game.json`, validated by the closed shape below — the exact §3 shape, so moving it into
// `$defs/provenance` is a relocation, not a re-derivation.

export const SOURCE_GAME_LICENCE_BASES = ["no-rights-asserted", "cc0", "cc-by-sa-4.0", "public-domain"] as const;
export type SourceGameLicenceBasis = (typeof SOURCE_GAME_LICENCE_BASES)[number];
export const SOURCE_GAME_RESULTS = ["1-0", "0-1", "1/2-1/2", "*"] as const;
export type SourceGameResult = (typeof SOURCE_GAME_RESULTS)[number];

export interface SourceGame {
  readonly white: string;
  readonly black: string;
  readonly event?: string;
  readonly site?: string;
  readonly date: string;
  readonly round?: string;
  readonly result: SourceGameResult;
  readonly sourceId: string;
  readonly licenceBasis: SourceGameLicenceBasis;
}

/** The §3 JSON Schema fragment, byte-for-byte in meaning; lane 0.31 moves it into `$defs/provenance`. */
export const SOURCE_GAME_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: ["white", "black", "date", "result", "sourceId", "licenceBasis"],
  properties: {
    white: { type: "string", minLength: 1, maxLength: 120 },
    black: { type: "string", minLength: 1, maxLength: 120 },
    event: { type: "string", maxLength: 200 },
    site: { type: "string", maxLength: 200 },
    date: { type: "string", maxLength: 10 },
    round: { type: "string", maxLength: 20 },
    result: { enum: SOURCE_GAME_RESULTS },
    sourceId: { type: "string", minLength: 1, maxLength: 120 },
    licenceBasis: { enum: SOURCE_GAME_LICENCE_BASES },
  },
} as const);

export const SOURCE_GAME_SIDECAR_SCHEMA = "tabiya.sourcing.source-game.v1";

export interface SourceGameSidecar {
  readonly schema: typeof SOURCE_GAME_SIDECAR_SCHEMA;
  readonly packId: string;
  readonly sourceGame: SourceGame;
}

/** Returns one message per violation; an empty array is valid. Closed: a seventh-or-later unknown key is refused. */
export function sourceGameIssues(value: unknown): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return ["sourceGame must be an object"];
  const record = value as Record<string, unknown>;
  const issues: string[] = [];
  const properties = SOURCE_GAME_SCHEMA.properties as Readonly<Record<string, { readonly type?: string; readonly minLength?: number; readonly maxLength?: number; readonly enum?: readonly string[] }>>;
  for (const key of Object.keys(record)) if (!(key in properties)) issues.push(`sourceGame.${key} is not a sourceGame field`);
  for (const key of SOURCE_GAME_SCHEMA.required) if (!(key in record)) issues.push(`sourceGame.${key} is required`);
  for (const [key, rule] of Object.entries(properties)) {
    if (!(key in record)) continue;
    const field = record[key];
    if (rule.enum !== undefined) {
      if (typeof field !== "string" || !rule.enum.includes(field)) issues.push(`sourceGame.${key} must be one of ${rule.enum.join(", ")}`);
      continue;
    }
    if (typeof field !== "string") { issues.push(`sourceGame.${key} must be a string`); continue; }
    if (rule.minLength !== undefined && field.length < rule.minLength) issues.push(`sourceGame.${key} must not be empty`);
    if (rule.maxLength !== undefined && field.length > rule.maxLength) issues.push(`sourceGame.${key} exceeds ${rule.maxLength} characters`);
  }
  return issues;
}

export function sourceGameSidecarIssues(value: unknown, packId: unknown): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return ["source-game.json must be an object"];
  const record = value as Record<string, unknown>;
  const issues: string[] = [];
  for (const key of Object.keys(record)) if (key !== "schema" && key !== "packId" && key !== "sourceGame") issues.push(`source-game.json.${key} is not a sidecar field`);
  if (record.schema !== SOURCE_GAME_SIDECAR_SCHEMA) issues.push(`source-game.json.schema must be ${SOURCE_GAME_SIDECAR_SCHEMA}`);
  if (typeof packId === "string" && record.packId !== packId) issues.push("source-game.json.packId does not match the pack");
  issues.push(...sourceGameIssues(record.sourceGame));
  return issues;
}
