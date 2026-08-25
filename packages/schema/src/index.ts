export const DRILL_RUN_SCHEMA_VERSION = "0.17" as const;
export const DRILL_PACK_SCHEMA_VERSION = "0.27" as const;
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

export const schemaBuildInfo = Object.freeze({
  drillPackVersion: DRILL_PACK_SCHEMA_VERSION,
  drillRunVersion: DRILL_RUN_SCHEMA_VERSION,
  shapeEntryVersion: SHAPE_ENTRY_SCHEMA_VERSION,
  principleEntryVersion: PRINCIPLE_ENTRY_SCHEMA_VERSION,
});
