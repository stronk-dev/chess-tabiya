export const DRILL_RUN_SCHEMA_VERSION = "0.18" as const;
export const DRILL_PACK_SCHEMA_VERSION = "0.29" as const;
export const DRILL_PACK_REQUIRED_FIELDS = Object.freeze([
  "id",
  "version",
  "title",
  "mode",
  "start",
  "objective",
  "checkpoints",
  "opponentPolicy",
  "feedbackPolicy",
  "provenance",
] as const);
export const SHAPE_ENTRY_SCHEMA_VERSION = "0.3" as const;

export type DrillRunSchemaVersion = typeof DRILL_RUN_SCHEMA_VERSION;
export type DrillPackSchemaVersion = typeof DRILL_PACK_SCHEMA_VERSION;
export type DrillPackRequiredField = typeof DRILL_PACK_REQUIRED_FIELDS[number];
export type ShapeEntrySchemaVersion = typeof SHAPE_ENTRY_SCHEMA_VERSION;
export const PRINCIPLE_ENTRY_SCHEMA_VERSION = "0.1" as const;
export type PrincipleEntrySchemaVersion = typeof PRINCIPLE_ENTRY_SCHEMA_VERSION;
/**
 * The concept-registry schema lane (`schemas/concept_registry.schema.json`, rfc/concept-registry.md).
 * Revision documents carry it as the numeric literal `schemaVersion: 1`
 * (`CONCEPT_REGISTRY_SCHEMA_VERSION` in `@chess-tabiya/runtime`).
 */
export const CONCEPT_REGISTRY_SCHEMA_LANE = "1" as const;

export const schemaBuildInfo = Object.freeze({
  drillPackVersion: DRILL_PACK_SCHEMA_VERSION,
  drillRunVersion: DRILL_RUN_SCHEMA_VERSION,
  shapeEntryVersion: SHAPE_ENTRY_SCHEMA_VERSION,
  principleEntryVersion: PRINCIPLE_ENTRY_SCHEMA_VERSION,
});
