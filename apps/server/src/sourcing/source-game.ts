// rfc/famous-games.md §3 — the typed identity of a cited game, at `$defs/provenance.sourceGame`
// (pack-schema lane 0.31). The pack schema is the validating authority; this module keeps the typed
// vocabulary the masters emitter derives into, and `SOURCE_GAME_SCHEMA` is bound byte-for-byte in
// meaning to the schema fragment by test. The interim `source-game.json` sidecar that carried the
// object while lane 0.30 was unlanded is retired: landing the lane relocated the object into the pack.

import type { SourceGame } from "@chess-tabiya/schema/drill-pack";

export type { SourceGame };

export const SOURCE_GAME_LICENCE_BASES = ["no-rights-asserted", "cc0", "cc-by-sa-4.0", "public-domain"] as const;
export type SourceGameLicenceBasis = (typeof SOURCE_GAME_LICENCE_BASES)[number];
export const SOURCE_GAME_RESULTS = ["1-0", "0-1", "1/2-1/2", "*"] as const;
export type SourceGameResult = (typeof SOURCE_GAME_RESULTS)[number];

/** The §3 JSON Schema fragment; equal to `schemas/drill_pack.schema.json#/$defs/provenance/properties/sourceGame`. */
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

/** Returns one message per violation; an empty array is valid. Closed: an unknown key is refused. */
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
